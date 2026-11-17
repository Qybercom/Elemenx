import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

var faked = [];

function fake (name, value) {
	Object.defineProperty(navigator, name, {value: value, configurable: true});

	faked.push(name);
}

function call (method) {
	var args = Array.prototype.slice.call(arguments, 1);

	return new Promise(function (resolve) {
		method.apply(null, args.concat([function (error, result) {
			resolve([error || null, result]);
		}]));
	});
}

function hex (bytes) {
	return Array.from(bytes).map(function (byte) {
		return (byte < 16 ? '0' : '') + byte.toString(16);
	}).join('');
}

function text (value) {
	return new TextEncoder().encode(value);
}

/*
 * A board of the ESP32 family on a serial port of the fake browser, its ROM loader as esptool knows it: into it by DTR
 * and RTS, SLIP frames, sync, its magic register, SPI attach and parameters, a faster speed, begin (erasing), data, end,
 * MD5 and slow reads of its flash of 4 MB. Silent: it never answers.
 */
function board (chip, silent) {
	var magic = {'ESP32': 0x00f01d83, 'ESP32-S3': 0x9, 'ESP32-C3': 0x1b31506f}[chip];
	var flash = new Uint8Array(4 * 1024 * 1024);
	var state = {Loader: false, Begin: null, Bauds: [], Commands: [], Signals: [], Opened: 0, Frame: null, Escape: false};
	var queue = [];
	var waiting = null;
	var port;

	flash.fill(0x5A);

	function send (bytes) {
		var out = [0xC0];

		bytes.forEach(function (byte) {
			if (byte === 0xC0) out.push(0xDB, 0xDC);
			else if (byte === 0xDB) out.push(0xDB, 0xDD);
			else out.push(byte);
		});

		out.push(0xC0);

		queue.push(new Uint8Array(out));

		if (waiting) {
			var resolve = waiting;

			waiting = null;

			resolve({done: false, value: queue.shift()});
		}
	}

	function answer (op, value, body) {
		var data = Array.from(body || []).concat([0, 0, 0, 0]);

		send([0x01, op, data.length & 255, data.length >> 8, value & 255, value >>> 8 & 255, value >>> 16 & 255, value >>> 24 & 255].concat(data));
	}

	function refuse (op) {
		send([0x01, op, 4, 0, 0, 0, 0, 0, 1, 0x05, 0, 0]);
	}

	function word (data, at) {
		return (data[at] | data[at + 1] << 8 | data[at + 2] << 16 | data[at + 3] << 24) >>> 0;
	}

	function command (frame) {
		var op = frame[1];
		var size = frame[2] | frame[3] << 8;
		var data = frame.subarray(8, 8 + size);

		state.Commands.push(op);

		if (silent || !state.Loader) return;

		if (op === 0x08) {
			for (var i = 0; i < 8; i++)
				answer(0x08, 0);
		}
		else if (op === 0x0a) {
			answer(0x0a, word(data, 0) === 0x40001000 ? magic : 0);
		}
		else if (op === 0x14) {
			refuse(op);
		}
		else if (op === 0x0d || op === 0x0b) {
			answer(op, 0);
		}
		else if (op === 0x0f) {
			state.Bauds.push(word(data, 0));

			answer(op, 0);
		}
		else if (op === 0x02) {
			state.Begin = {Size: word(data, 0), Blocks: word(data, 4), Block: word(data, 8), Offset: word(data, 12), Words: data.length / 4};

			flash.fill(0xFF, state.Begin.Offset, Math.min(flash.length, state.Begin.Offset + Math.ceil(state.Begin.Size / 4096) * 4096));

			answer(op, 0);
		}
		else if (op === 0x03) {
			var length = word(data, 0);
			var seq = word(data, 4);
			var block = data.subarray(16, 16 + length);
			var sum = 0xEF;

			block.forEach(function (byte) {
				sum ^= byte;
			});

			if (sum !== (frame[4] | 0)) {
				refuse(op);

				return;
			}

			flash.set(block, state.Begin.Offset + seq * state.Begin.Block);

			answer(op, 0);
		}
		else if (op === 0x04) {
			answer(op, 0);
		}
		else if (op === 0x13) {
			answer(op, 0, text(hex(Elemenx.Hardware.Firmware.Digest(flash.subarray(word(data, 0), word(data, 0) + word(data, 4)), 'md5'))));
		}
		else if (op === 0x0e) {
			answer(op, 0, flash.subarray(word(data, 0), word(data, 0) + word(data, 4)));
		}
	}

	function heard (bytes) {
		bytes.forEach(function (byte) {
			if (byte === 0xC0) {
				if (state.Frame && state.Frame.length)
					command(new Uint8Array(state.Frame));

				state.Frame = [];
			}
			else if (state.Frame) {
				if (state.Escape) {
					state.Frame.push(byte === 0xDC ? 0xC0 : 0xDB);

					state.Escape = false;
				}
				else if (byte === 0xDB) {
					state.Escape = true;
				}
				else {
					state.Frame.push(byte);
				}
			}
		});
	}

	port = {
		getInfo: function () {
			return {usbVendorId: 0x10c4, usbProductId: 0xea60};
		},
		open: function (options) {
			state.Opened++;
			state.Baud = options.baudRate;
			port.readable = {getReader: function () {
				return {
					read: function () {
						return queue.length ? Promise.resolve({done: false, value: queue.shift()}) : new Promise(function (resolve) {
							waiting = resolve;
						});
					},
					releaseLock: function () {},
					cancel: function () {
						if (waiting) {
							var resolve = waiting;

							waiting = null;

							resolve({done: true});
						}

						return Promise.resolve();
					}
				};
			}};
			port.writable = {getWriter: function () {
				return {
					write: function (bytes) {
						heard(Array.from(bytes));

						return Promise.resolve();
					},
					releaseLock: function () {}
				};
			}};

			return Promise.resolve();
		},
		setSignals: function (signals) {
			state.Signals.push(signals);

			/* IO0 held down (DTR) as EN rises: into the loader. */
			if (signals.dataTerminalReady === true && signals.requestToSend === false)
				state.Loader = true;

			return Promise.resolve();
		},
		close: function () {
			state.Closed = true;

			return Promise.resolve();
		}
	};

	return {Port: port, Flash: flash, State: state};
}

async function portOf (made) {
	fake('serial', {
		addEventListener: function () {},
		removeEventListener: function () {},
		requestPort: function () {
			return Promise.resolve(made.Port);
		}
	});

	return (await call(Elemenx.Hardware.Serial.Request, {}))[1];
}

/* An image of a bootloader with its SHA-256 appended: header, one segment of 20 bytes, its checksum, the hash. */
function bootloader () {
	var image = new Uint8Array(24 + 8 + 20 + 12 + 32);

	image[0] = 0xE9;
	image[1] = 1;
	image[2] = 0;
	image[3] = 0x2f;
	image[23] = 1;
	image[28] = 20;

	image.set(Elemenx.Hardware.Firmware.Digest(image.subarray(0, 64), 'sha256'), 64);

	return image;
}

describe('Contract: Elemenx.Hardware.Firmware, the ROM loader of the ESP32 family and its partitions', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	afterEach(function () {
		while (faked.length)
			delete navigator[faked.pop()];

		resetDOM();
	});

	it('sums bytes as MD5 and SHA-256 do', function () {
		var firmware = Elemenx.Hardware.Firmware;
		var million = new Uint8Array(1000000).fill(97);

		expect(hex(firmware.Digest(new Uint8Array(0), 'md5'))).toBe('d41d8cd98f00b204e9800998ecf8427e');
		expect(hex(firmware.Digest(text('abc'), 'md5'))).toBe('900150983cd24fb0d6963f7d28e17f72');
		expect(hex(firmware.Digest(text('The quick brown fox jumps over the lazy dog'), 'md5'))).toBe('9e107d9d372bb6826bd81d3542a419d6');
		expect(hex(firmware.Digest(million, 'md5'))).toBe('7707d6ae4e027c70eea2a935c2296f21');
		expect(hex(firmware.Digest(new Uint8Array(0), 'sha256'))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
		expect(hex(firmware.Digest(text('abc'), 'sha256'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
		expect(hex(firmware.Digest(million, 'sha256'))).toBe('cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
	});

	it('makes, reads and checks a table of partitions, of its bytes and of its CSV', function () {
		var partitions = Elemenx.Hardware.Firmware.Partitions;
		var list = partitions.Preset('default');
		var bytes = partitions.Make(list);

		expect(partitions.Presets()).toEqual(['default', 'huge_app', 'min_spiffs', 'no_ota']);
		expect(partitions.Offset).toBe(0x8000);
		expect(bytes.length).toBe(0xC00);
		expect(Array.from(bytes.subarray(0, 4))).toEqual([0xAA, 0x50, 0x01, 0x02]);
		expect(Array.from(bytes.subarray(6 * 32, 6 * 32 + 2))).toEqual([0xEB, 0xEB]);
		expect(hex(bytes.subarray(6 * 32 + 16, 6 * 32 + 32))).toBe(hex(Elemenx.Hardware.Firmware.Digest(bytes.subarray(0, 6 * 32), 'md5')));
		expect(partitions.Parse(bytes)).toEqual(list);
		expect(partitions.Parse(partitions.CSV(list))).toEqual(list);
		expect(partitions.Check(list, 4 * 1024 * 1024)).toEqual([]);

		/* A CSV of its own: offsets left out after the one before, sizes in K and M, flags. */
		expect(partitions.Parse('# Name, Type, SubType, Offset, Size, Flags\nnvs, data, nvs, , 20K,\nfactory, app, factory, , 1M, readonly\nstore, data, littlefs, , 512K,\n')).toEqual([
			{Name: 'nvs', Type: 'data', SubType: 'nvs', Offset: 0x9000, Size: 0x5000, Flags: []},
			{Name: 'factory', Type: 'app', SubType: 'factory', Offset: 0x10000, Size: 0x100000, Flags: ['readonly']},
			{Name: 'store', Type: 'data', SubType: 'littlefs', Offset: 0x110000, Size: 0x80000, Flags: []}
		]);

		/* What is wrong: over another, an app off 64 KB, past the flash, a name twice, slots with no otadata. */
		var wrong = [
			{Name: 'nvs', Type: 'data', SubType: 'nvs', Offset: 0x9000, Size: 0x8000, Flags: []},
			{Name: 'app0', Type: 'app', SubType: 'ota_0', Offset: 0x11000, Size: 0x400000, Flags: []},
			{Name: 'nvs', Type: 'data', SubType: 'spiffs', Offset: 0x10000, Size: 0x1000, Flags: []}
		];
		var texts = partitions.Check(wrong, 4 * 1024 * 1024).map(function (one) {
			return one.Partition + ' ' + one.Text;
		});

		expect(texts).toEqual(['0 it lies over nvs', '1 an app begins on 64 KB', '1 it goes past the end of the flash', '2 its name is that of another', '-1 its slots of updates have no otadata']);
	});

	it('lays a build of arduino-cli and a manifest of ESP Web Tools at their offsets, and sets the header of a bootloader', async function () {
		var firmware = Elemenx.Hardware.Firmware;
		var files = [{Name: 'blink.ino.bin', Bytes: new Uint8Array(10)}, {Name: 'blink.ino.bootloader.bin', Bytes: new Uint8Array(4)}, {Name: 'blink.ino.partitions.bin', Bytes: new Uint8Array(3)}, {Name: 'boot_app0.bin', Bytes: new Uint8Array(2)}];
		var image = bootloader();
		var patched = firmware.Patch(image, {Chip: 'ESP32', Mode: 'dio', Size: '8MB', Frequency: '40m'});

		expect(firmware.Parts(files, 'ESP32').map(function (part) {
			return [part.Name, part.Offset];
		})).toEqual([['blink.ino.bootloader.bin', 0x1000], ['blink.ino.partitions.bin', 0x8000], ['boot_app0.bin', 0xe000], ['blink.ino.bin', 0x10000]]);
		expect(firmware.Parts(files, 'ESP32-S3')[0].Offset).toBe(0);
		expect(firmware.Parts(files.concat([{Name: 'blink.ino.merged.bin', Bytes: new Uint8Array(9)}]), 'ESP32')).toEqual([{Offset: 0, Bytes: new Uint8Array(9), Name: 'blink.ino.merged.bin'}]);

		/* Its mode, size and speed; its hash made again; the image given left as it was. */
		expect([patched[2], patched[3]]).toEqual([2, 0x30]);
		expect(hex(patched.subarray(64))).toBe(hex(firmware.Digest(patched.subarray(0, 64), 'sha256')));
		expect(hex(patched.subarray(64))).not.toBe(hex(image.subarray(64)));
		expect(image[3]).toBe(0x2f);
		expect(firmware.Patch(image, {Mode: 'keep'})).toEqual(image);

		var manifest = {builds: [{chipFamily: 'ESP32', parts: [{path: 'a.bin', offset: 4096}]}, {chipFamily: 'ESP32-C3', parts: [{path: 'boot.bin', offset: 0}, {path: 'app.bin', offset: 65536}]}]};
		var read = function (path, callback) {
			callback(null, text(path));
		};

		expect(await call(firmware.Manifest, manifest, 'ESP32-C3', read)).toEqual([null, [{Offset: 0, Bytes: text('boot.bin'), Name: 'boot.bin'}, {Offset: 65536, Bytes: text('app.bin'), Name: 'app.bin'}]]);
		expect((await call(firmware.Manifest, manifest, 'ESP32-S3', read))[0].name).toBe('NotFoundError');
	});

	it('flashes an ESP32 by its ROM loader: into it by DTR and RTS, faster, each part erased, written, its MD5 checked, reset', async function () {
		var made = board('ESP32');
		var port = await portOf(made);
		var table = Elemenx.Hardware.Firmware.Partitions.Make(Elemenx.Hardware.Firmware.Partitions.Preset('default'));
		var app = new Uint8Array(5000).map(function (value, index) {
			return index * 7 & 255;
		});
		var stages = [];
		var result = await call(Elemenx.Hardware.Firmware.Flash, port, [{Offset: 0x10000, Bytes: app}, {Offset: 0x1000, Bytes: bootloader()}, {Offset: 0x8000, Bytes: table}], {Flash: {Size: '4MB', Mode: 'dio', Frequency: '40m'}, Progress: function (progress) {
			if (stages[stages.length - 1] !== progress.Stage)
				stages.push(progress.Stage);
		}});

		expect(result[0]).toBe(null);
		expect(result[1].Chip).toBe('ESP32');
		expect(result[1].Written).toBe(app.length + 96 + table.length);
		expect(result[1].Parts.map(function (part) {
			return part.Offset;
		})).toEqual([0x1000, 0x8000, 0x10000]);
		expect(stages).toEqual(['connect', 'erase', 'write', 'verify', 'erase', 'write', 'verify', 'erase', 'write', 'verify', 'done']);

		/* What it holds: the parts, the bootloader set for its flash; past them as it was (erased by 4 KB). */
		expect(hex(made.Flash.subarray(0x10000, 0x10000 + app.length))).toBe(hex(app));
		expect(hex(made.Flash.subarray(0x8000, 0x8000 + 0xC00))).toBe(hex(table));
		expect([made.Flash[0x1002], made.Flash[0x1003]]).toEqual([2, 0x20]);
		expect(made.Flash[0x10000 + 0x2000]).toBe(0x5A);
		expect(made.State.Bauds).toEqual([460800]);
		expect(made.State.Baud).toBe(460800);
		expect(made.State.Begin.Words).toBe(4);

		/* Reset to run it, the port let go. */
		expect(made.State.Signals[made.State.Signals.length - 2]).toEqual({dataTerminalReady: false, requestToSend: true});
		expect(made.State.Signals[made.State.Signals.length - 1]).toEqual({requestToSend: false});
		expect(port.Opened()).toBe(false);
	});

	it('erases the whole flash first when asked, flashes the newer chips, and refuses an app longer than its partition', async function () {
		var made = board('ESP32-S3');
		var port = await portOf(made);
		var flashed = await call(Elemenx.Hardware.Firmware.Flash, port, [{Offset: 0x10000, Bytes: new Uint8Array(100)}], {Erase: true, Baud: 115200});

		expect(flashed[0]).toBe(null);
		expect(flashed[1].Chip).toBe('ESP32-S3');
		expect(made.Flash[0x200000]).toBe(0xFF);
		expect(made.State.Begin.Words).toBe(5);
		expect(made.State.Bauds).toEqual([]);

		/* Checked before the board is touched: the table of huge_app gives its app 3 MB, not 4. */
		var other = board('ESP32');
		var touched;

		port = await portOf(other);
		touched = await call(Elemenx.Hardware.Firmware.Flash, port, [{Offset: 0x8000, Bytes: Elemenx.Hardware.Firmware.Partitions.Make(Elemenx.Hardware.Firmware.Partitions.Preset('huge_app'))}, {Offset: 0x10000, Bytes: new Uint8Array(0x300001)}], {});

		expect(touched[0].name).toBe('DataError');
		expect(touched[0].message).toContain('longer than its partition app0');
		expect(other.State.Opened).toBe(0);
	});

	it('reads the chip and the flash of a board, tells a board that does not answer, and stops when cancelled', async function () {
		var made = board('ESP32-C3');
		var port = await portOf(made);
		var table = Elemenx.Hardware.Firmware.Partitions.Make(Elemenx.Hardware.Firmware.Partitions.Preset('no_ota'));

		made.Flash.set(table, 0x8000);

		expect(await call(Elemenx.Hardware.Firmware.Detect, port, {})).toEqual([null, {Chip: 'ESP32-C3', Family: 'ESP32-C3', Bootloader: 0}]);

		var read = await call(Elemenx.Hardware.Firmware.Read, port, 0x8000, 0xC00, {});

		expect(read[0]).toBe(null);
		expect(Elemenx.Hardware.Firmware.Partitions.Parse(read[1])).toEqual(Elemenx.Hardware.Firmware.Partitions.Preset('no_ota'));

		/* A board that never answers: both resets tried, then a TimeoutError. */
		var silent = board('ESP32', true);

		port = await portOf(silent);

		var lost = await call(Elemenx.Hardware.Firmware.Detect, port, {});

		expect(lost[0].name).toBe('TimeoutError');
		expect(port.Opened()).toBe(false);

		/* Cancelled while it writes. */
		var slow = board('ESP32');
		var job;
		var cancelled;

		port = await portOf(slow);
		cancelled = new Promise(function (resolve) {
			job = Elemenx.Hardware.Firmware.Flash(port, [{Offset: 0x10000, Bytes: new Uint8Array(64 * 1024)}], {Progress: function (progress) {
				if (progress.Stage === 'write' && progress.Done > 4096)
					job.Cancel();
			}}, function (error) {
				resolve(error);
			});
		});

		expect((await cancelled).name).toBe('AbortError');
		expect(port.Opened()).toBe(false);
		expect(Elemenx.Hardware.Firmware.Names()).toEqual(['esp']);
	}, 30000);

	it('cancels what a component flashes when it is destroyed', async function () {
		var made = board('ESP32');
		var component = Elemenx.Component(unique('FirmwareOwner'), {$Template: '<p>owner</p>'})();
		var port;
		var ended;

		document.getElementById('mount').appendChild(component.$Element());

		port = await portOf(made);
		ended = new Promise(function (resolve) {
			component.$Hardware.Firmware.Flash(port, [{Offset: 0x10000, Bytes: new Uint8Array(64 * 1024)}], {Progress: function (progress) {
				if (progress.Stage === 'write' && progress.Done > 4096 && !component.Gone) {
					component.Gone = true;

					component.$Destroy();
				}
			}}, function (error) {
				resolve(error);
			});
		});

		expect((await ended).name).toBe('AbortError');
	});
});
