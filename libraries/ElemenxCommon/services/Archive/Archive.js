/*
 * Archives made in the page: a project, a game or a set of files to download in one.
 * - Zip(files): a zip of files by their paths ({'index.html': text, 'model.glb': bytes}: texts in UTF-8, bytes as an
 *   ArrayBuffer or a Uint8Array), stored as they are, with no compression: the bytes of the archive (a Uint8Array) that
 *   any system opens. Over 65535 files, or past 4 GB, it is a ZIP64.
 * - Unzip(bytes): the files of a zip by their paths, each its bytes (a Uint8Array): what Zip made, or any zip of stored
 *   files; a file compressed in it is an error.
 * - Compress(files, callback(error, bytes)): a zip as Zip makes it, each file deflated where that makes it smaller;
 *   Expand(bytes, callback(error, files), options): the files of any zip, stored or deflated; a deflated one unpacks to
 *   the size its directory tells at most, its CRC checked ('Archive: <name> is not as its directory tells'), all of
 *   them to options MaxBytes (MaxBytes, 1 GB) at most ('Archive: the files unpack to more than <most> bytes').
 * - Entries(bytes, base): the directory of a zip, of the whole file or of its end alone (bytes from the place base of the
 *   file on): [{Name, Method (0 stored, 8 deflated), Crc, Size, Compressed, Offset (of its local header in the file)}];
 *   Data(bytes, entry): the bytes kept of one entry, bytes being the file from its local header on.
 * - Deflate(bytes, callback(error, bytes)) and Inflate(bytes, callback(error, bytes), most): raw deflate (RFC 1951) of
 *   the platform (CompressionStream), in a page, a worker and Node; an error where there is none. Inflate makes most
 *   bytes at most (MaxBytes by default): 'Archive: unpacked data of more than <most> bytes'.
 * - Crc(bytes): the CRC-32 of bytes, as a zip keeps it.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Archive', {
	$Meta: {
		Description: 'Archives made in the page: a zip of texts and bytes by their paths, stored or deflated, to download a project or a game in one file, and the files of a zip read back, its directory alone too.',
		Methods: ['Zip(files)', 'Unzip(bytes)', 'Compress(files, callback)', 'Expand(bytes, callback)', 'Entries(bytes, base)', 'Data(bytes, entry)', 'Deflate(bytes, callback)', 'Inflate(bytes, callback, most)', 'Crc(bytes)']
	},

	/* The most bytes what is unpacked may be (Inflate, Expand), when it is not told. */
	MaxBytes: 1073741824,

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

	/* The bytes of a file given as a text, an ArrayBuffer or a Uint8Array. */
	Bytes: function (given) {
		return typeof given === 'string' ? new TextEncoder().encode(given) : given instanceof ArrayBuffer ? new Uint8Array(given) : given;
	},

	Zip: function (files) {
		var self = this;

		return this.Build(Object.keys(files).map(function (name) {
			var data = self.Bytes(files[name]);

			return {Name: name, Data: data, Size: data.length, Crc: self.Crc(data), Method: 0};
		}));
	},

	/* A zip of entries {Name, Data (as kept), Size (of the file), Crc, Method}; ZIP64 where a count, a size or a place outgrows its field. */
	Build: function (entries) {
		var encoder = new TextEncoder();
		var parts = [];
		var central = [];
		var offset = 0;
		var size = 0;
		var at = 0;
		var result;
		var wide;
		var end;
		var record;
		var locator;

		function header (length) {
			var bytes = new Uint8Array(length);

			return {Bytes: bytes, View: new DataView(bytes.buffer)};
		}

		/* A number of 64 bits, little-endian, of one of JavaScript (exact to 2^53). */
		function set64 (view, place, value) {
			view.setUint32(place, value % 4294967296, true);
			view.setUint32(place + 4, Math.floor(value / 4294967296), true);
		}

		entries.forEach(function (one) {
			var path = encoder.encode(one.Name);
			var far = offset >= 0xffffffff;
			var local = header(30 + path.length);
			var entry = header(46 + path.length + (far ? 12 : 0));

			local.View.setUint32(0, 0x04034b50, true);
			local.View.setUint16(4, far ? 45 : 20, true);
			local.View.setUint16(6, 0x0800, true);
			local.View.setUint16(8, one.Method, true);
			local.View.setUint32(14, one.Crc, true);
			local.View.setUint32(18, one.Data.length, true);
			local.View.setUint32(22, one.Size, true);
			local.View.setUint16(26, path.length, true);
			local.Bytes.set(path, 30);

			entry.View.setUint32(0, 0x02014b50, true);
			entry.View.setUint16(4, far ? 45 : 20, true);
			entry.View.setUint16(6, far ? 45 : 20, true);
			entry.View.setUint16(8, 0x0800, true);
			entry.View.setUint16(10, one.Method, true);
			entry.View.setUint32(16, one.Crc, true);
			entry.View.setUint32(20, one.Data.length, true);
			entry.View.setUint32(24, one.Size, true);
			entry.View.setUint16(28, path.length, true);
			entry.View.setUint32(42, far ? 0xffffffff : offset, true);
			entry.Bytes.set(path, 46);

			/* Its place past 4 GB: in its extra field of ZIP64. */
			if (far) {
				entry.View.setUint16(30, 12, true);
				entry.View.setUint16(46 + path.length, 0x0001, true);
				entry.View.setUint16(48 + path.length, 8, true);

				set64(entry.View, 50 + path.length, offset);
			}

			parts.push(local.Bytes, one.Data);
			central.push(entry.Bytes);

			offset += local.Bytes.length + one.Data.length;
		});

		central.forEach(function (entry) {
			size += entry.length;
		});

		wide = central.length > 65535 || offset >= 0xffffffff || size >= 0xffffffff;
		end = header(22);
		record = header(wide ? 56 : 0);
		locator = header(wide ? 20 : 0);

		end.View.setUint32(0, 0x06054b50, true);
		end.View.setUint16(8, wide ? 0xffff : central.length, true);
		end.View.setUint16(10, wide ? 0xffff : central.length, true);
		end.View.setUint32(12, wide ? 0xffffffff : size, true);
		end.View.setUint32(16, wide ? 0xffffffff : offset, true);

		/* ZIP64: its end record (the count, the size and the place of the directory in 64 bits) and the locator of it. */
		if (wide) {
			record.View.setUint32(0, 0x06064b50, true);

			set64(record.View, 4, 44);

			record.View.setUint16(12, 45, true);
			record.View.setUint16(14, 45, true);

			set64(record.View, 24, central.length);
			set64(record.View, 32, central.length);
			set64(record.View, 40, size);
			set64(record.View, 48, offset);

			locator.View.setUint32(0, 0x07064b50, true);

			set64(locator.View, 8, offset + size);

			locator.View.setUint32(16, 1, true);
		}

		parts = parts.concat(central, [record.Bytes, locator.Bytes, end.Bytes]);
		result = new Uint8Array(offset + size + record.Bytes.length + locator.Bytes.length + 22);

		parts.forEach(function (part) {
			result.set(part, at);

			at += part.length;
		});

		return result;
	},

	/* A number of 64 bits, little-endian. */
	Get64: function (view, place) {
		return view.getUint32(place, true) + view.getUint32(place + 4, true) * 4294967296;
	},

	Entries: function (bytes, base) {
		var data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
		var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		var decoder = new TextDecoder();
		var start = Number(base) || 0;
		var list = [];
		var end = data.length - 22;
		var count;
		var at;
		var i;
		var record;

		while (end >= 0 && view.getUint32(end, true) !== 0x06054b50)
			end--;

		if (end < 0)
			throw new Error('Archive: not a zip');

		count = view.getUint16(end + 10, true);
		at = view.getUint32(end + 16, true);

		/* ZIP64: the count and the place of its directory in its own end record, found by its locator. */
		if (end >= 20 && view.getUint32(end - 20, true) === 0x07064b50) {
			record = this.Get64(view, end - 12) - start;

			if (record < 0 || record + 56 > data.length || view.getUint32(record, true) !== 0x06064b50)
				throw new Error('Archive: not a zip');

			count = this.Get64(view, record + 32);
			at = this.Get64(view, record + 48);
		}

		at -= start;

		for (i = 0; i < count; i++) {
			if (at < 0 || at + 46 > data.length || view.getUint32(at, true) !== 0x02014b50)
				throw new Error('Archive: not a zip');

			list.push(this.Entry(view, data, at, decoder));

			at += 46 + view.getUint16(at + 28, true) + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
		}

		return list;
	},

	/* An entry of the directory at a place: its sizes and its place of 64 bits from its extra field of ZIP64 where they outgrew theirs. */
	Entry: function (view, data, at, decoder) {
		var named = view.getUint16(at + 28, true);
		var entry = {Name: decoder.decode(data.subarray(at + 46, at + 46 + named)), Method: view.getUint16(at + 10, true), Crc: view.getUint32(at + 16, true), Compressed: view.getUint32(at + 20, true), Size: view.getUint32(at + 24, true), Offset: view.getUint32(at + 42, true)};
		var field = at + 46 + named;
		var last = field + view.getUint16(at + 30, true);
		var place;

		while (field + 4 <= last) {
			place = field + 4;

			if (view.getUint16(field, true) === 0x0001) {
				if (entry.Size === 0xffffffff) {
					entry.Size = this.Get64(view, place);
					place += 8;
				}

				if (entry.Compressed === 0xffffffff) {
					entry.Compressed = this.Get64(view, place);
					place += 8;
				}

				if (entry.Offset === 0xffffffff)
					entry.Offset = this.Get64(view, place);
			}

			field += 4 + view.getUint16(field + 2, true);
		}

		return entry;
	},

	Data: function (bytes, entry) {
		var data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
		var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		var start;

		if (data.length < 30 || view.getUint32(0, true) !== 0x04034b50)
			throw new Error('Archive: not a zip');

		start = 30 + view.getUint16(26, true) + view.getUint16(28, true);

		return data.subarray(start, start + entry.Compressed);
	},

	/*
	 * The files of a zip by their paths (bytes: a Uint8Array or an ArrayBuffer), each its bytes, a Uint8Array over those
	 * given, not copied: what Zip made, or any zip whose files are stored. A file compressed in it is an error, as bytes
	 * that are no zip.
	 */
	Unzip: function (bytes) {
		var self = this;
		var data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
		var files = {};

		this.Entries(data).forEach(function (entry) {
			if (entry.Method !== 0)
				throw new Error('Archive: ' + entry.Name + ' is compressed');

			self.Put(files, entry.Name, self.Data(data.subarray(entry.Offset), entry));
		});

		return files;
	},

	/* A file of a zip by its name, whatever its name: one named __proto__ is a file, not the prototype of the list. */
	Put: function (files, name, value) {
		if (name === '__proto__') Object.defineProperty(files, name, {value: value, writable: true, enumerable: true, configurable: true});
		else files[name] = value;
	},

	/*
	 * Raw deflate or inflate of the platform: a stream of CompressionStream or DecompressionStream read piece by piece, most
	 * bytes at most (the reading stops there). Regression: read whole, a bomb of a megabyte unpacked to a gigabyte and more.
	 */
	Stream: function (bytes, kind, callback, most) {
		var limit = Number(most) > 0 ? Number(most) : this.MaxBytes;
		var pieces = [];
		var total = 0;
		var reader;
		var Made = kind === 'deflate' ? typeof CompressionStream === 'undefined' ? null : CompressionStream : typeof DecompressionStream === 'undefined' ? null : DecompressionStream;
		var stream;

		if (!Made || typeof Response === 'undefined' || typeof Blob === 'undefined') {
			callback(new Error('Archive: no ' + kind + ' here'));

			return;
		}

		try {
			stream = new Blob([bytes]).stream().pipeThrough(new Made('deflate-raw'));
		}
		catch (error) {
			callback(error);

			return;
		}

		reader = stream.getReader();

		function joined () {
			var made = new Uint8Array(total);
			var at = 0;

			pieces.forEach(function (piece) {
				made.set(piece, at);

				at += piece.length;
			});

			return made;
		}

		(function next () {
			reader.read().then(function (step) {
				if (step.done) {
					callback(null, joined());

					return;
				}

				total += step.value.length;

				if (total > limit) {
					reader.cancel();

					callback(new Error('Archive: unpacked data of more than ' + limit + ' bytes'));

					return;
				}

				pieces.push(step.value);

				next();
			}, function (error) {
				callback(error);
			});
		})();
	},

	Deflate: function (bytes, callback) {
		this.Stream(this.Bytes(bytes), 'deflate', callback);
	},

	Inflate: function (bytes, callback, most) {
		this.Stream(this.Bytes(bytes), 'inflate', callback, most);
	},

	Compress: function (files, callback) {
		var self = this;
		var names = Object.keys(files);
		var entries = [];
		var left = names.length;
		var failed = false;

		if (!left) {
			callback(null, this.Build([]));

			return;
		}

		names.forEach(function (name, index) {
			var data = self.Bytes(files[name]);

			self.Deflate(data, function (error, packed) {
				if (failed) return;

				if (error) {
					failed = true;

					callback(error);

					return;
				}

				/* Kept as it is where deflating it makes it no smaller. */
				entries[index] = {Name: name, Data: packed.length < data.length ? packed : data, Size: data.length, Crc: self.Crc(data), Method: packed.length < data.length ? 8 : 0};

				if (!--left)
					callback(null, self.Build(entries));
			});
		});
	},

	Expand: function (bytes, callback, options) {
		var self = this;
		var data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
		var most = options && Number(options.MaxBytes) > 0 ? Number(options.MaxBytes) : this.MaxBytes;
		var files = {};
		var failed = false;
		var entries;
		var left;

		try {
			entries = this.Entries(data);
		}
		catch (error) {
			callback(error);

			return;
		}

		if (entries.reduce(function (sum, entry) {
			return sum + entry.Size;
		}, 0) > most) {
			callback(new Error('Archive: the files unpack to more than ' + most + ' bytes'));

			return;
		}

		left = entries.length;

		if (!left) {
			callback(null, files);

			return;
		}

		function done (name, made) {
			self.Put(files, name, made);

			if (!--left)
				callback(null, files);
		}

		entries.forEach(function (entry) {
			var kept;

			if (failed) return;

			if (entry.Method !== 0 && entry.Method !== 8) {
				failed = true;

				callback(new Error('Archive: ' + entry.Name + ' is compressed by method ' + entry.Method));

				return;
			}

			kept = self.Data(data.subarray(entry.Offset), entry);

			if (entry.Method === 0) {
				done(entry.Name, kept);

				return;
			}

			/* As large as its directory tells, no larger, its CRC the one told: a bomb or a damaged file is an error. */
			self.Inflate(kept, function (error, made) {
				if (failed) return;

				if (!error && (made.length !== entry.Size || self.Crc(made) !== entry.Crc))
					error = new Error('Archive: ' + entry.Name + ' is not as its directory tells');

				if (error) {
					failed = true;

					callback(/more than/.test(error.message) ? new Error('Archive: ' + entry.Name + ' is not as its directory tells') : error);

					return;
				}

				done(entry.Name, made);
			}, entry.Size || 1);
		});
	}
});
