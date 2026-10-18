'use strict';

/*
 * A zip archive with no dependencies: the files of a directory, deflated (zlib), with fixed dates so the same files
 * make the same archive. Enough for the stores of browser extensions.
 */

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var Table = (function () {
	var table = [];
	var n = 0;
	var c;
	var k;

	while (n < 256) {
		c = n;
		k = 0;

		while (k < 8) {
			c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;

			k++;
		}

		table.push(c >>> 0);

		n++;
	}

	return table;
})();

function crc32 (buffer) {
	var crc = 0xFFFFFFFF;
	var i = 0;

	while (i < buffer.length) {
		crc = Table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);

		i++;
	}

	return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* The files of a directory, with their paths from it (forward slashes), sorted. */
function files (directory, base, result) {
	result = result || [];
	base = base || directory;

	fs.readdirSync(directory, {withFileTypes: true}).sort(function (a, b) {
		return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
	}).forEach(function (entry) {
		var full = path.join(directory, entry.name);

		if (entry.isDirectory()) files(full, base, result);
		else result.push({Name: path.relative(base, full).replace(/\\/g, '/'), Data: fs.readFileSync(full)});
	});

	return result;
}

/* A zip archive of a list of {Name, Data}: a Buffer. */
function archive (list) {
	var parts = [];
	var central = [];
	var offset = 0;
	var size = 0;
	var time = 0;
	var date = (0 << 9) | (1 << 5) | 1;

	list.forEach(function (file) {
		var name = Buffer.from(file.Name, 'utf8');
		var data = Buffer.isBuffer(file.Data) ? file.Data : Buffer.from(String(file.Data), 'utf8');
		var deflated = zlib.deflateRawSync(data, {level: 9});
		var crc = crc32(data);
		var local = Buffer.alloc(30);
		var entry = Buffer.alloc(46);

		local.writeUInt32LE(0x04034B50, 0);
		local.writeUInt16LE(20, 4);
		local.writeUInt16LE(0x0800, 6);
		local.writeUInt16LE(8, 8);
		local.writeUInt16LE(time, 10);
		local.writeUInt16LE(date, 12);
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(deflated.length, 18);
		local.writeUInt32LE(data.length, 22);
		local.writeUInt16LE(name.length, 26);
		local.writeUInt16LE(0, 28);

		entry.writeUInt32LE(0x02014B50, 0);
		entry.writeUInt16LE(20, 4);
		entry.writeUInt16LE(20, 6);
		entry.writeUInt16LE(0x0800, 8);
		entry.writeUInt16LE(8, 10);
		entry.writeUInt16LE(time, 12);
		entry.writeUInt16LE(date, 14);
		entry.writeUInt32LE(crc, 16);
		entry.writeUInt32LE(deflated.length, 20);
		entry.writeUInt32LE(data.length, 24);
		entry.writeUInt16LE(name.length, 28);
		entry.writeUInt32LE(offset, 42);

		parts.push(local, name, deflated);
		central.push(entry, name);

		offset += local.length + name.length + deflated.length;
	});

	central.forEach(function (part) {
		size += part.length;
	});

	var end = Buffer.alloc(22);

	end.writeUInt32LE(0x06054B50, 0);
	end.writeUInt16LE(list.length, 8);
	end.writeUInt16LE(list.length, 10);
	end.writeUInt32LE(size, 12);
	end.writeUInt32LE(offset, 16);

	return Buffer.concat(parts.concat(central, [end]));
}

/* The zip archive of a directory, written to target. */
function directory (source, target) {
	fs.writeFileSync(target, archive(files(source)));

	return target;
}

module.exports = {
	Archive: archive,
	Directory: directory,
	Files: files,
	CRC32: crc32
};
