import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

/* The entries of a zip stored as it is: {path: bytes}, read by its local headers, with the CRC each keeps. */
function entries (zip) {
	var view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
	var found = {};
	var at = 0;

	while (view.getUint32(at, true) === 0x04034b50) {
		var length = view.getUint16(at + 26, true);
		var size = view.getUint32(at + 18, true);
		var name = new TextDecoder().decode(zip.subarray(at + 30, at + 30 + length));

		found[name] = {Data: zip.slice(at + 30 + length, at + 30 + length + size), Crc: view.getUint32(at + 14, true), Flags: view.getUint16(at + 6, true)};

		at += 30 + length + size;
	}

	found.$End = {Count: view.getUint16(zip.length - 22 + 10, true), Central: view.getUint32(zip.length - 22 + 16, true), Signature: view.getUint32(zip.length - 22, true)};

	return found;
}

describe('Contract: Archive, a zip of texts and bytes made in the page', function () {
	var archive;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Archive']);

		archive = Elemenx.Service('Archive');
	});

	it('keeps texts in UTF-8 and bytes as they are, each with its CRC-32, and a directory of them at its end', function () {
		var bytes = new Uint8Array([0, 1, 2, 250, 255]);
		var zip = archive.Zip({'index.html': '<p>Привет</p>', 'models/a.glb': bytes, 'b.bin': bytes.buffer});
		var found = entries(zip);

		expect(Object.keys(found)).toEqual(['index.html', 'models/a.glb', 'b.bin', '$End']);
		expect(new TextDecoder().decode(found['index.html'].Data)).toBe('<p>Привет</p>');
		expect(Array.from(found['models/a.glb'].Data)).toEqual([0, 1, 2, 250, 255]);
		expect(Array.from(found['b.bin'].Data)).toEqual([0, 1, 2, 250, 255]);

		/* The names are UTF-8 (bit 11), the CRC that of the data. */
		expect(found['index.html'].Flags).toBe(0x0800);
		expect(archive.Crc(new TextEncoder().encode('hello'))).toBe(0x3610a686);
		expect(found['models/a.glb'].Crc).toBe(archive.Crc(bytes));
		expect(found.$End).toMatchObject({Signature: 0x06054b50, Count: 3});
		expect(new DataView(zip.buffer).getUint32(found.$End.Central, true)).toBe(0x02014b50);
	});

	it('reads the files of a zip back by their paths, and tells what is no zip or is compressed', function () {
		var bytes = new Uint8Array([0, 1, 2, 250, 255]);
		var zip = archive.Zip({'index.html': '<p>Привет</p>', 'models/a.glb': bytes, 'empty.txt': ''});
		var files = archive.Unzip(zip.buffer);
		var squeezed = zip.slice();
		var view = new DataView(squeezed.buffer);

		expect(Object.keys(files)).toEqual(['index.html', 'models/a.glb', 'empty.txt']);
		expect(new TextDecoder().decode(files['index.html'])).toBe('<p>Привет</p>');
		expect(Array.from(files['models/a.glb'])).toEqual([0, 1, 2, 250, 255]);
		expect(files['empty.txt'].length).toBe(0);
		expect(function () {
			archive.Unzip(new Uint8Array([1, 2, 3]));
		}).toThrow('Archive: not a zip');

		/* Its first file said to be deflated (method 8, in the directory at its end). */
		view.setUint16(view.getUint32(squeezed.length - 22 + 16, true) + 10, 8, true);

		expect(function () {
			archive.Unzip(squeezed);
		}).toThrow('Archive: index.html is compressed');
	});

	it('deflates the files of a zip where that makes them smaller, and expands any zip back', async function () {
		var text = 'mountains '.repeat(400);
		var noise = new Uint8Array(64).map(function (value, index) {
			return (index * 97 + 13) & 255;
		});
		var zip = await new Promise(function (resolve, reject) {
			archive.Compress({'a.txt': text, 'b.bin': noise}, function (error, bytes) {
				if (error) reject(error);
				else resolve(bytes);
			});
		});
		var list = archive.Entries(zip);
		var files = await new Promise(function (resolve, reject) {
			archive.Expand(zip, function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		expect(list.map(function (entry) {
			return entry.Name + ':' + entry.Method;
		})).toEqual(['a.txt:8', 'b.bin:0']);
		expect(list[0].Compressed).toBeLessThan(list[0].Size / 10);
		expect(new TextDecoder().decode(files['a.txt'])).toBe(text);
		expect(Array.from(files['b.bin'])).toEqual(Array.from(noise));
		expect(function () {
			archive.Unzip(zip);
		}).toThrow('Archive: a.txt is compressed');
	});

	/* What a reader of the network has of a zip: its end (a range of bytes), then each entry by its place. */
	it('reads the directory of a zip from its end alone, and an entry from its own bytes', function () {
		var zip = archive.Zip({'planet.json': '{}', 'tiles/a.bin': new Uint8Array([7, 8, 9])});
		var tail = zip.subarray(zip.length - 150);
		var list = archive.Entries(tail, zip.length - 150);
		var entry = list[1];

		expect(list.map(function (one) {
			return one.Name;
		})).toEqual(['planet.json', 'tiles/a.bin']);
		expect(Array.from(archive.Data(zip.subarray(entry.Offset, entry.Offset + 30 + 11 + entry.Compressed), entry))).toEqual([7, 8, 9]);
	});

	it('writes and reads a ZIP64 of more than 65535 files', function () {
		var files = {};
		var zip;
		var list;
		var view;
		var i;

		for (i = 0; i < 70000; i++)
			files['t/' + i] = new Uint8Array([i & 255]);

		zip = archive.Zip(files);
		view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
		list = archive.Entries(zip);

		expect(view.getUint16(zip.length - 22 + 10, true)).toBe(0xffff);
		expect(view.getUint32(zip.length - 42, true)).toBe(0x07064b50);
		expect(list.length).toBe(70000);
		expect(Array.from(archive.Unzip(zip)['t/69999'])).toEqual([69999 & 255]);
	});

	/*
	 * Regression: a zip of another unpacked without a bound (a megabyte to a gigabyte and more), whatever size its directory
	 * told, and a file named __proto__ became the prototype of the list of files.
	 */
	it('unpacks a deflated file to the size its directory tells at most, all of them to MaxBytes, a file named __proto__ kept', async function () {
		var big = new Uint8Array(200000);
		/* A literal {'__proto__': ...} sets a prototype: JSON gives the key of its own a file of another has. */
		var named = JSON.parse('{"__proto__": "own"}');
		var zip = await new Promise(function (done, fail) {
			archive.Compress(Object.defineProperty(JSON.parse('{"__proto__": "own"}'), 'zeros.bin', {value: big, enumerable: true}), function (error, made) {
				if (error) fail(error);
				else done(made);
			});
		});

		function expand (bytes, options) {
			return new Promise(function (done) {
				archive.Expand(bytes, function (error, files) {
					done(error ? error.message : files);
				}, options);
			});
		}

		var files = await expand(zip);

		expect(files['zeros.bin'].length).toBe(200000);
		expect(new TextDecoder().decode(Object.getOwnPropertyDescriptor(files, '__proto__').value)).toBe('own');
		expect(Object.getPrototypeOf(files)).toBe(Object.prototype);
		expect(await expand(zip, {MaxBytes: 1000})).toBe('Archive: the files unpack to more than 1000 bytes');

		/* Its directory made to tell 100 bytes: the deflated stream of 200000 is stopped there. */
		var lying = zip.slice();
		var view = new DataView(lying.buffer);
		var at = lying.length - 22;

		at = view.getUint32(at + 16, true);

		while (view.getUint32(at, true) === 0x02014b50) {
			var length = view.getUint16(at + 28, true);
			var name = new TextDecoder().decode(lying.subarray(at + 46, at + 46 + length));
			if (name === 'zeros.bin')
				view.setUint32(at + 24, 100, true);

			at += 46 + length + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
		}

		expect(await expand(lying)).toBe('Archive: zeros.bin is not as its directory tells');

		var packed = await new Promise(function (done) {
			archive.Deflate(big, function (error, made) {
				done(made);
			});
		});

		expect(await new Promise(function (done) {
			archive.Inflate(packed, function (error) {
				done(error.message);
			}, 100);
		})).toBe('Archive: unpacked data of more than 100 bytes');
		expect(Object.getOwnPropertyDescriptor(archive.Unzip(archive.Zip(named)), '__proto__').value.length).toBe(3);
	});
});
