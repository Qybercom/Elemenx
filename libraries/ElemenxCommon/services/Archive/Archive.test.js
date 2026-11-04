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
});
