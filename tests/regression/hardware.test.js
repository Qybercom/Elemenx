import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

/* The browser objects given in place of its own (navigator.serial, navigator.usb), taken away after each test. */
var faked = [];

function fake (name, value) {
	Object.defineProperty(navigator, name, {value: value, configurable: true});

	faked.push(name);
}

/* An event target of the fake browser. */
function target () {
	var listeners = {};

	return {
		addEventListener: function (name, callback) {
			(listeners[name] = listeners[name] || []).push(callback);
		},
		removeEventListener: function (name, callback) {
			listeners[name] = (listeners[name] || []).filter(function (item) {
				return item !== callback;
			});
		},
		Fire: function (name, event) {
			(listeners[name] || []).forEach(function (callback) {
				callback(event);
			});
		}
	};
}

/* Calls a method that takes callback(error, result) and resolves to [error, result]. */
function call (method) {
	var args = Array.prototype.slice.call(arguments, 1);

	return new Promise(function (resolve) {
		method.apply(null, args.concat([function (error, result) {
			resolve([error || null, result]);
		}]));
	});
}

/* A serial port of the fake browser: what it is given to read, what was written to it. */
function serialPort (chunks) {
	var port = {
		Written: [],
		getInfo: function () {
			return {usbVendorId: 9025, usbProductId: 67};
		},
		open: function (options) {
			port.Options = options;
			port.readable = {getReader: function () {
				return {
					read: function () {
						return chunks.length ? Promise.resolve({done: false, value: chunks.shift()}) : new Promise(function (resolve) {
							port.Stop = function () {
								resolve({done: true});
							};
						});
					},
					releaseLock: function () {},
					cancel: function () {
						if (port.Stop)
							port.Stop();

						return Promise.resolve();
					}
				};
			}};
			port.writable = {getWriter: function () {
				return {
					write: function (bytes) {
						port.Written.push(new TextDecoder().decode(bytes));

						return Promise.resolve();
					},
					releaseLock: function () {}
				};
			}};

			return Promise.resolve();
		},
		setSignals: function (signals) {
			port.Signals = signals;

			return Promise.resolve();
		},
		close: function () {
			port.Closed = true;

			return Promise.resolve();
		}
	};

	return port;
}

describe('Contract: Elemenx.Hardware, Serial and USB of the core', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	afterEach(function () {
		while (faked.length)
			delete navigator[faked.pop()];

		resetDOM();
	});

	it('asks for a serial port by its filters, reads text and lines, writes, sets its signals and closes', async function () {
		var port = serialPort([new TextEncoder().encode('hello\nwor'), new TextEncoder().encode('ld\n')]);
		var asked;
		var lines = [];
		var data = [];

		fake('serial', Object.assign(target(), {
			requestPort: function (options) {
				asked = options;

				return Promise.resolve(port);
			},
			getPorts: function () {
				return Promise.resolve([port]);
			}
		}));

		var handle = (await call(Elemenx.Hardware.Serial.Request, {Filters: [{VendorID: 9025}]}))[1];

		expect(asked).toEqual({filters: [{usbVendorId: 9025}]});
		expect(handle.Info).toEqual({VendorID: 9025, ProductID: 67});
		expect(handle.Native).toBe(port);

		handle.On('line', function (line) {
			lines.push(line);
		});
		handle.On('data', function (text) {
			data.push(text);
		});

		expect((await call(handle.Open, {BaudRate: 115200}))[0]).toBe(null);
		expect(port.Options).toEqual({baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none'});

		await new Promise(function (resolve) {
			setTimeout(resolve, 10);
		});

		expect(data).toEqual(['hello\nwor', 'ld\n']);
		expect(lines).toEqual(['hello', 'world']);
		expect(await call(handle.Write, 'ping\n')).toEqual([null, 5]);
		expect(port.Written).toEqual(['ping\n']);
		expect(await call(handle.Signals, {DTR: false, RTS: true})).toEqual([null, true]);
		expect(port.Signals).toEqual({dataTerminalReady: false, requestToSend: true});

		/* One handle for a port, whoever asks. */
		expect((await call(Elemenx.Hardware.Serial.Ports))[1][0]).toBe(handle);
		expect(await call(handle.Close)).toEqual([null, true]);
		expect(port.Closed).toBe(true);
		expect(handle.Opened()).toBe(false);
		expect((await call(handle.Write, 'x'))[0].message).toBe('Elemenx Serial: the port is not open');
	});

	it('calls back NotSupportedError without Web Serial or WebUSB, and tells the ports that come and go', async function () {
		var serial = target();
		var heard = [];
		var listener = function (event) {
			heard.push(event.Port.Info);
		};

		fake('serial', undefined);
		fake('usb', undefined);

		expect(Elemenx.Hardware.Serial.Supported()).toBe(false);
		expect((await call(Elemenx.Hardware.Serial.Request, {}))[0].name).toBe('NotSupportedError');
		expect(await call(Elemenx.Hardware.Serial.Ports)).toEqual([null, []]);
		expect(Elemenx.Hardware.USB.Supported()).toBe(false);
		expect((await call(Elemenx.Hardware.USB.Request, {}))[0].name).toBe('NotSupportedError');
		expect(await call(Elemenx.Hardware.USB.Devices)).toEqual([null, []]);

		fake('serial', serial);

		Elemenx.Hardware.Serial.On('connect', listener);

		serial.Fire('connect', {type: 'connect', target: {getInfo: function () {
			return {usbVendorId: 1};
		}}});

		Elemenx.Hardware.Serial.Off('connect', listener);

		serial.Fire('connect', {type: 'connect', target: {getInfo: function () {
			return {usbVendorId: 2};
		}}});

		expect(heard).toEqual([{VendorID: 1, ProductID: null}]);
	});

	it('asks for a USB device, opens and claims it, and transfers data in, out and by control', async function () {
		var steps = [];
		var device = {
			vendorId: 4660,
			productId: 22136,
			productName: 'Board',
			manufacturerName: 'Maker',
			serialNumber: 'S1',
			configuration: null,
			open: function () {
				steps.push('open');

				return Promise.resolve();
			},
			selectConfiguration: function (value) {
				steps.push('configuration ' + value);

				return Promise.resolve();
			},
			claimInterface: function (value) {
				steps.push('claim ' + value);

				return Promise.resolve();
			},
			releaseInterface: function (value) {
				steps.push('release ' + value);

				return Promise.resolve();
			},
			close: function () {
				steps.push('close');

				return Promise.resolve();
			},
			transferIn: function (endpoint, length) {
				return Promise.resolve({data: new DataView(new Uint8Array([endpoint, length]).buffer)});
			},
			transferOut: function (endpoint, bytes) {
				return Promise.resolve({bytesWritten: bytes.length});
			},
			controlTransferIn: function (setup, length) {
				steps.push('control in ' + setup.request + ' ' + length);

				return Promise.resolve({data: new DataView(new Uint8Array([7]).buffer)});
			},
			controlTransferOut: function (setup, bytes) {
				steps.push('control out ' + setup.requestType + ' ' + bytes.length);

				return Promise.resolve({bytesWritten: bytes.length});
			}
		};

		fake('usb', Object.assign(target(), {
			requestDevice: function (options) {
				steps.push(JSON.stringify(options));

				return Promise.resolve(device);
			}
		}));

		var handle = (await call(Elemenx.Hardware.USB.Request, {Filters: [{VendorID: 4660, ClassCode: 255}]}))[1];

		expect(handle.Info).toEqual({VendorID: 4660, ProductID: 22136, Name: 'Board', Manufacturer: 'Maker', Serial: 'S1'});
		expect(await call(handle.Open, {Interface: 2})).toEqual([null, handle]);
		expect(Array.from((await call(handle.TransferIn, 1, 16))[1])).toEqual([1, 16]);
		expect(await call(handle.TransferOut, 2, 'abc')).toEqual([null, 3]);
		expect(Array.from((await call(handle.Control, {Request: 9}, 4))[1])).toEqual([7]);
		expect(await call(handle.Control, {Type: 'class', Request: 1}, 'hi')).toEqual([null, 2]);
		expect(await call(handle.Close)).toEqual([null, true]);
		expect(steps).toEqual(['{"filters":[{"vendorId":4660,"classCode":255}]}', 'open', 'configuration 1', 'claim 2', 'control in 9 4', 'control out class 2', 'release 2', 'close']);
	});

	/* $Hardware of an owner: what it opened is closed and what it listens to forgotten when it is destroyed. */
	it('closes the ports a component opened and forgets its listeners when it is destroyed, as $Network does', async function () {
		var port = serialPort([]);
		var serial = Object.assign(target(), {
			requestPort: function () {
				return Promise.resolve(port);
			}
		});
		var heard = [];
		var component;
		var handle;

		fake('serial', serial);

		component = Elemenx.Component(unique('HardwareOwner'), {$Template: '<p>owner</p>'})();

		document.getElementById('mount').appendChild(component.$Element());

		component.$Hardware.Serial.On('disconnect', function () {
			heard.push('heard');
		});

		handle = (await call(component.$Hardware.Serial.Request, {}))[1];

		expect(await call(handle.Open, {})).toEqual([null, handle]);
		expect(handle.Opened()).toBe(true);

		component.$Destroy();

		await new Promise(function (resolve) {
			setTimeout(resolve, 10);
		});

		expect(port.Closed).toBe(true);
		expect(handle.Opened()).toBe(false);

		serial.Fire('disconnect', {type: 'disconnect', target: port});

		expect(heard).toEqual([]);
	});
});
