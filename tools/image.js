'use strict';

/*
 * Pictures of the tools, with no dependencies: a PNG read into its pixels (8 bits a channel: gray, gray and alpha, RGB,
 * RGBA or a palette, not interlaced) and written back, made smaller by the average of the pixels it covers (their
 * colors weighted by their alpha), and the icons of the systems made of PNGs: an ICO for Windows, an ICNS for macOS.
 */

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

var Signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32 (buffer) {
	var crc = 0xFFFFFFFF;
	var i = 0;

	while (i < buffer.length) {
		crc = Table[(crc ^ buffer[i]) & 255] ^ (crc >>> 8);

		i++;
	}

	return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* The pixels of a PNG: {Width, Height, Data (RGBA, 4 bytes a pixel)}; an error for a PNG it cannot read. */
function read (buffer) {
	var offset = 8;
	var header = null;
	var palette = null;
	var alphas = null;
	var parts = [];
	var raw;
	var channels;
	var stride;
	var data;
	var previous;
	var line;
	var y;
	var x;
	var i;

	if (buffer.length < 8 || !buffer.subarray(0, 8).equals(Signature))
		throw new Error('not a PNG');

	while (offset < buffer.length) {
		var length = buffer.readUInt32BE(offset);
		var type = buffer.toString('ascii', offset + 4, offset + 8);
		var body = buffer.subarray(offset + 8, offset + 8 + length);

		if (type === 'IHDR') header = {Width: body.readUInt32BE(0), Height: body.readUInt32BE(4), Depth: body[8], Color: body[9], Interlace: body[12]};
		else if (type === 'PLTE') palette = body;
		else if (type === 'tRNS') alphas = body;
		else if (type === 'IDAT') parts.push(body);
		else if (type === 'IEND') break;

		offset += 12 + length;
	}

	if (!header)
		throw new Error('a PNG with no header');

	if (header.Depth !== 8 || header.Interlace)
		throw new Error('a PNG of 8 bits a channel, not interlaced, is needed (this one has ' + header.Depth + ' bits' + (header.Interlace ? ', interlaced' : '') + ')');

	channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[header.Color];

	if (!channels)
		throw new Error('a PNG of an unknown color type: ' + header.Color);

	raw = zlib.inflateSync(Buffer.concat(parts));
	stride = header.Width * channels;
	data = Buffer.alloc(header.Width * header.Height * 4);
	previous = Buffer.alloc(stride);

	for (y = 0; y < header.Height; y++) {
		var filter = raw[y * (stride + 1)];

		line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));

		for (i = 0; i < stride; i++) {
			var left = i >= channels ? line[i - channels] : 0;
			var up = previous[i];
			var corner = i >= channels ? previous[i - channels] : 0;

			if (filter === 1) line[i] = (line[i] + left) & 255;
			else if (filter === 2) line[i] = (line[i] + up) & 255;
			else if (filter === 3) line[i] = (line[i] + ((left + up) >> 1)) & 255;
			else if (filter === 4) line[i] = (line[i] + paeth(left, up, corner)) & 255;
		}

		for (x = 0; x < header.Width; x++) {
			var at = (y * header.Width + x) * 4;
			var from = x * channels;

			if (header.Color === 6) {
				line.copy(data, at, from, from + 4);
			}
			else if (header.Color === 2) {
				line.copy(data, at, from, from + 3);

				data[at + 3] = 255;
			}
			else if (header.Color === 0 || header.Color === 4) {
				data[at] = data[at + 1] = data[at + 2] = line[from];
				data[at + 3] = header.Color === 4 ? line[from + 1] : 255;
			}
			else {
				palette.copy(data, at, line[from] * 3, line[from] * 3 + 3);

				data[at + 3] = alphas && line[from] < alphas.length ? alphas[line[from]] : 255;
			}
		}

		previous = line;
	}

	return {Width: header.Width, Height: header.Height, Data: data};
}

function paeth (a, b, c) {
	var p = a + b - c;
	var pa = Math.abs(p - a);
	var pb = Math.abs(p - b);
	var pc = Math.abs(p - c);
	if (pa <= pb && pa <= pc) return a;
	if (pb <= pc) return b;

	return c;
}

function chunk (type, body) {
	var head = Buffer.alloc(8);
	var tail = Buffer.alloc(4);

	head.writeUInt32BE(body.length, 0);
	head.write(type, 4, 'ascii');

	tail.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), body])), 0);

	return Buffer.concat([head, body, tail]);
}

/* A PNG of pixels {Width, Height, Data (RGBA)}. */
function write (image) {
	var header = Buffer.alloc(13);
	var stride = image.Width * 4;
	var raw = Buffer.alloc((stride + 1) * image.Height);
	var y = 0;

	header.writeUInt32BE(image.Width, 0);
	header.writeUInt32BE(image.Height, 4);

	header[8] = 8;
	header[9] = 6;

	while (y < image.Height) {
		raw[y * (stride + 1)] = 0;

		image.Data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);

		y++;
	}

	return Buffer.concat([Signature, chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
}

/*
 * The pixels made size by size (a square of a square, its sides scaled alike): every pixel the average of the ones of the
 * source it covers, by their area, their colors weighted by their alpha so a transparent edge does not darken them.
 */
function resize (image, size) {
	var result = Buffer.alloc(size * size * 4);
	var scaleX = image.Width / size;
	var scaleY = image.Height / size;
	var y;
	var x;

	for (y = 0; y < size; y++) {
		for (x = 0; x < size; x++) {
			var top = y * scaleY;
			var bottom = top + scaleY;
			var left = x * scaleX;
			var right = left + scaleX;
			var sum = [0, 0, 0, 0];
			var area = 0;
			var sy;
			var sx;

			for (sy = Math.floor(top); sy < Math.min(image.Height, Math.ceil(bottom)); sy++) {
				var wy = Math.min(bottom, sy + 1) - Math.max(top, sy);

				for (sx = Math.floor(left); sx < Math.min(image.Width, Math.ceil(right)); sx++) {
					var weight = wy * (Math.min(right, sx + 1) - Math.max(left, sx));
					var at = (sy * image.Width + sx) * 4;
					var alpha = image.Data[at + 3] / 255;

					sum[0] += image.Data[at] * alpha * weight;
					sum[1] += image.Data[at + 1] * alpha * weight;
					sum[2] += image.Data[at + 2] * alpha * weight;
					sum[3] += alpha * weight;
					area += weight;
				}
			}

			var to = (y * size + x) * 4;

			result[to] = sum[3] ? Math.round(sum[0] / sum[3]) : 0;
			result[to + 1] = sum[3] ? Math.round(sum[1] / sum[3]) : 0;
			result[to + 2] = sum[3] ? Math.round(sum[2] / sum[3]) : 0;
			result[to + 3] = area ? Math.round(sum[3] / area * 255) : 0;
		}
	}

	return {Width: size, Height: size, Data: result};
}

/* A PNG of a size made of the pixels of the source. */
function png (image, size) {
	return write(image.Width === size && image.Height === size ? image : resize(image, size));
}

/* An ICO of PNGs of the sizes (Windows Vista and later read PNG in an ICO), the largest 256. */
function ico (image, sizes) {
	var pictures = sizes.map(function (size) {
		return {Size: size, Data: png(image, size)};
	});
	var head = Buffer.alloc(6 + 16 * pictures.length);
	var offset = head.length;

	head.writeUInt16LE(0, 0);
	head.writeUInt16LE(1, 2);
	head.writeUInt16LE(pictures.length, 4);

	pictures.forEach(function (picture, index) {
		var at = 6 + index * 16;

		head[at] = picture.Size >= 256 ? 0 : picture.Size;
		head[at + 1] = picture.Size >= 256 ? 0 : picture.Size;

		head.writeUInt16LE(1, at + 4);
		head.writeUInt16LE(32, at + 6);
		head.writeUInt32LE(picture.Data.length, at + 8);
		head.writeUInt32LE(offset, at + 12);

		offset += picture.Data.length;
	});

	return Buffer.concat([head].concat(pictures.map(function (picture) {
		return picture.Data;
	})));
}

/* An ICNS of PNGs (macOS 10.7 and later): 16 to 1024 pixels, with their retina twins. */
function icns (image) {
	var types = [['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024], ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512]];
	var made = {};
	var parts = types.map(function (type) {
		var data = made[type[1]] || (made[type[1]] = png(image, type[1]));
		var head = Buffer.alloc(8);

		head.write(type[0], 0, 'ascii');
		head.writeUInt32BE(data.length + 8, 4);

		return Buffer.concat([head, data]);
	});
	var total = parts.reduce(function (sum, part) {
		return sum + part.length;
	}, 8);
	var head = Buffer.alloc(8);

	head.write('icns', 0, 'ascii');
	head.writeUInt32BE(total, 4);

	return Buffer.concat([head].concat(parts));
}

module.exports = {
	Read: read,
	Write: write,
	Resize: resize,
	PNG: png,
	ICO: ico,
	ICNS: icns
};
