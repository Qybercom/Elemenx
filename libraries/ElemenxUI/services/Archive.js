/*
 * Archives made in the page: a project, a game or a set of files to download in one.
 * - Zip(files): a zip of files by their paths ({'index.html': text, 'model.glb': bytes}: texts in UTF-8, bytes as an
 *   ArrayBuffer or a Uint8Array), stored as they are, with no compression: the bytes of the archive (a Uint8Array) that
 *   any system opens.
 * - Crc(bytes): the CRC-32 of bytes, as a zip keeps it.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Archive', {
	$Meta: {
		Description: 'Archives made in the page: a zip of texts and bytes by their paths, to download a project or a game in one file.',
		Methods: ['Zip(files)', 'Crc(bytes)']
	},

	Crc: function (bytes) {
		var table = this.Table || (this.Table = (function () {
			var result = [];
			var n = 0;
			var c;
			var k;

			while (n < 256) {
				c = n;
				k = 0;

				while (k < 8) {
					c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;

					k++;
				}

				result[n] = c >>> 0;

				n++;
			}

			return result;
		})());
		var crc = 0xffffffff;
		var i = 0;

		while (i < bytes.length) {
			crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);

			i++;
		}

		return (crc ^ 0xffffffff) >>> 0;
	},

	Zip: function (files) {
		var self = this;
		var encoder = new TextEncoder();
		var parts = [];
		var central = [];
		var offset = 0;
		var size = 0;
		var result;
		var end;
		var at = 0;

		function header (length) {
			var bytes = new Uint8Array(length);

			return {Bytes: bytes, View: new DataView(bytes.buffer)};
		}

		Object.keys(files).forEach(function (name) {
			var given = files[name];
			var path = encoder.encode(name);
			var data = typeof given === 'string' ? encoder.encode(given) : given instanceof ArrayBuffer ? new Uint8Array(given) : given;
			var crc = self.Crc(data);
			var local = header(30 + path.length);
			var entry = header(46 + path.length);

			local.View.setUint32(0, 0x04034b50, true);
			local.View.setUint16(4, 20, true);
			local.View.setUint16(6, 0x0800, true);
			local.View.setUint32(14, crc, true);
			local.View.setUint32(18, data.length, true);
			local.View.setUint32(22, data.length, true);
			local.View.setUint16(26, path.length, true);
			local.Bytes.set(path, 30);

			entry.View.setUint32(0, 0x02014b50, true);
			entry.View.setUint16(4, 20, true);
			entry.View.setUint16(6, 20, true);
			entry.View.setUint16(8, 0x0800, true);
			entry.View.setUint32(16, crc, true);
			entry.View.setUint32(20, data.length, true);
			entry.View.setUint32(24, data.length, true);
			entry.View.setUint16(28, path.length, true);
			entry.View.setUint32(42, offset, true);
			entry.Bytes.set(path, 46);

			parts.push(local.Bytes, data);
			central.push(entry.Bytes);

			offset += local.Bytes.length + data.length;
		});

		central.forEach(function (entry) {
			size += entry.length;
		});

		end = header(22);

		end.View.setUint32(0, 0x06054b50, true);
		end.View.setUint16(8, central.length, true);
		end.View.setUint16(10, central.length, true);
		end.View.setUint32(12, size, true);
		end.View.setUint32(16, offset, true);

		parts = parts.concat(central, [end.Bytes]);
		result = new Uint8Array(offset + size + 22);

		parts.forEach(function (part) {
			result.set(part, at);

			at += part.length;
		});

		return result;
	}
});
