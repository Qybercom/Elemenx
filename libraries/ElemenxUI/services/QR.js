/*
 * QR codes (ISO/IEC 18004): Encode(text, level) returns the modules of the code of a text, {Size, Version, Level,
 * Modules: rows of true (dark) and false}: the text in UTF-8 (byte mode), the least version (1 to 40) it fits, level
 * L, M (the default), Q or H of error correction (a code still reads with 7, 15, 25 or 30% of it damaged), and the
 * mask with the least penalty. A text too long for version 40 throws. SVG(text, options) is the text of an SVG of it
 * ({Level, Margin (4 modules), Dark, Light}).
 */
Elemenx.Service('QR', {
	$Meta: {
		Description: 'QR codes: Encode(text, level) returns the modules of the code of a text, SVG(text, options) a drawing of it.',
		Methods: ['Encode(text, level)', 'SVG(text, options)']
	},
	/* The error correction codewords of a block, and the blocks, for each level and version (from 1). */
	Codewords: {
		L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
		M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
		Q: [13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
		H: [17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
	},
	Blocks: {
		L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
		M: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
		Q: [1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
		H: [1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
	},
	/* The two bits of a level in the format information. */
	Format: {L: 1, M: 0, Q: 3, H: 2},

	/* The bytes of a text in UTF-8. */
	Bytes: function (text) {
		var bytes = [];
		var i = 0;
		var code;

		text = String(text == null ? '' : text);

		while (i < text.length) {
			code = text.charCodeAt(i);

			if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
				code = 0x10000 + (code - 0xd800) * 0x400 + (text.charCodeAt(i + 1) - 0xdc00);
				i++;
			}

			if (code < 0x80) {
				bytes.push(code);
			}
			else if (code < 0x800) {
				bytes.push(0xc0 | code >> 6, 0x80 | code & 63);
			}
			else if (code < 0x10000) {
				bytes.push(0xe0 | code >> 12, 0x80 | code >> 6 & 63, 0x80 | code & 63);
			}
			else {
				bytes.push(0xf0 | code >> 18, 0x80 | code >> 12 & 63, 0x80 | code >> 6 & 63, 0x80 | code & 63);
			}

			i++;
		}

		return bytes;
	},

	/* The modules a version holds for data and error correction, the patterns taken away. */
	RawModules: function (version) {
		var result = (16 * version + 128) * version + 64;
		var count;

		if (version >= 2) {
			count = Math.floor(version / 7) + 2;
			result -= (25 * count - 10) * count - 55;

			if (version >= 7)
				result -= 36;
		}

		return result;
	},

	DataCodewords: function (version, level) {
		return Math.floor(this.RawModules(version) / 8) - this.Codewords[level][version - 1] * this.Blocks[level][version - 1];
	},

	/* Multiplication in GF(256) of the polynomial 0x11D. */
	Multiply: function (x, y) {
		var z = 0;
		var i;

		for (i = 7; i >= 0; i--) {
			z = z << 1 ^ (z >>> 7) * 0x11d;
			z ^= (y >>> i & 1) * x;
		}

		return z;
	},

	Divisor: function (degree) {
		var result = [];
		var root = 1;
		var i;
		var j;

		for (i = 0; i < degree - 1; i++)
			result.push(0);

		result.push(1);

		for (i = 0; i < degree; i++) {
			for (j = 0; j < result.length; j++) {
				result[j] = this.Multiply(result[j], root);

				if (j + 1 < result.length)
					result[j] ^= result[j + 1];
			}

			root = this.Multiply(root, 0x02);
		}

		return result;
	},

	Remainder: function (data, divisor) {
		var self = this;
		var result = divisor.map(function () {
			return 0;
		});

		data.forEach(function (value) {
			var factor = value ^ result.shift();

			result.push(0);

			divisor.forEach(function (coefficient, index) {
				result[index] ^= self.Multiply(coefficient, factor);
			});
		});

		return result;
	},

	/* The codewords of the data split into blocks, each with its error correction, interleaved. */
	Interleave: function (data, version, level) {
		var count = this.Blocks[level][version - 1];
		var correction = this.Codewords[level][version - 1];
		var raw = Math.floor(this.RawModules(version) / 8);
		var short = count - raw % count;
		var shortLength = Math.floor(raw / count);
		var divisor = this.Divisor(correction);
		var blocks = [];
		var result = [];
		var at = 0;
		var i;
		var j;
		var block;
		var ecc;

		for (i = 0; i < count; i++) {
			block = data.slice(at, at + shortLength - correction + (i < short ? 0 : 1));
			at += block.length;
			ecc = this.Remainder(block, divisor);

			if (i < short)
				block.push(0);

			blocks.push(block.concat(ecc));
		}

		for (i = 0; i < blocks[0].length; i++) {
			for (j = 0; j < blocks.length; j++) {
				if (i !== shortLength - correction || j >= short)
					result.push(blocks[j][i]);
			}
		}

		return result;
	},

	Encode: function (text, level) {
		var bytes = this.Bytes(text);
		var version;
		var capacity;
		var bits = [];
		var data = [];
		var put = function (value, length) {
			var i;

			for (i = length - 1; i >= 0; i--)
				bits.push(value >>> i & 1);
		};
		var i;

		level = this.Format[String(level || 'M').toUpperCase()] === undefined ? 'M' : String(level || 'M').toUpperCase();

		for (version = 1; version <= 40; version++) {
			capacity = this.DataCodewords(version, level) * 8;

			if (4 + (version <= 9 ? 8 : 16) + bytes.length * 8 <= capacity) break;
		}

		if (version > 40)
			throw new Error('QR: the text is too long for a code (' + bytes.length + ' bytes)');

		put(4, 4);
		put(bytes.length, version <= 9 ? 8 : 16);

		bytes.forEach(function (value) {
			put(value, 8);
		});

		put(0, Math.min(4, capacity - bits.length));
		put(0, (8 - bits.length % 8) % 8);

		/* The bytes of padding alternate: 0xEC, 0x11. */
		for (i = 0xec; bits.length < capacity; i ^= 0xec ^ 0x11)
			put(i, 8);

		for (i = 0; i < bits.length; i += 8)
			data.push(parseInt(bits.slice(i, i + 8).join(''), 2));

		return this.Matrix(this.Interleave(data, version, level), version, level);
	},

	/* The modules of a version: its patterns, the codewords, and the mask with the least penalty. */
	Matrix: function (codewords, version, level) {
		var size = version * 4 + 17;
		var modules = [];
		var fixed = [];
		var set = function (x, y, dark) {
			modules[y][x] = dark;
			fixed[y][x] = true;
		};
		var x;
		var y;
		var best = 0;
		var least = Infinity;
		var mask;
		var score;

		for (y = 0; y < size; y++) {
			modules.push([]);
			fixed.push([]);

			for (x = 0; x < size; x++) {
				modules[y].push(false);
				fixed[y].push(false);
			}
		}

		this.Patterns(version, size, set);
		this.Place(codewords, size, modules, fixed);

		for (mask = 0; mask < 8; mask++) {
			this.Mask(mask, size, modules, fixed);
			this.FormatBits(level, mask, size, set);

			score = this.Penalty(modules, size);

			if (score < least) {
				least = score;
				best = mask;
			}

			this.Mask(mask, size, modules, fixed);
		}

		this.Mask(best, size, modules, fixed);
		this.FormatBits(level, best, size, set);

		return {Size: size, Version: version, Level: level, Mask: best, Modules: modules};
	},

	Patterns: function (version, size, set) {
		var positions = [];
		var count;
		var step;
		var position;
		var i;
		var j;

		for (i = 0; i < size; i++) {
			set(6, i, i % 2 === 0);
			set(i, 6, i % 2 === 0);
		}

		[[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (center) {
			var dx;
			var dy;
			var distance;

			for (dy = -4; dy <= 4; dy++) {
				for (dx = -4; dx <= 4; dx++) {
					distance = Math.max(Math.abs(dx), Math.abs(dy));

					if (center[0] + dx >= 0 && center[0] + dx < size && center[1] + dy >= 0 && center[1] + dy < size)
						set(center[0] + dx, center[1] + dy, distance !== 2 && distance !== 4);
				}
			}
		});

		if (version > 1) {
			count = Math.floor(version / 7) + 2;
			step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
			positions = [6];

			for (position = size - 7; positions.length < count; position -= step)
				positions.splice(1, 0, position);
		}

		for (i = 0; i < positions.length; i++) {
			for (j = 0; j < positions.length; j++) {
				if ((i === 0 && j === 0) || (i === 0 && j === positions.length - 1) || (i === positions.length - 1 && j === 0)) continue;

				this.Alignment(positions[i], positions[j], set);
			}
		}

		this.FormatBits('M', 0, size, set);
		this.VersionBits(version, size, set);
	},

	Alignment: function (x, y, set) {
		var dx;
		var dy;

		for (dy = -2; dy <= 2; dy++) {
			for (dx = -2; dx <= 2; dx++)
				set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
		}
	},

	FormatBits: function (level, mask, size, set) {
		var data = this.Format[level] << 3 | mask;
		var remainder = data;
		var bits;
		var bit = function (index) {
			return (bits >>> index & 1) !== 0;
		};
		var i;

		for (i = 0; i < 10; i++)
			remainder = remainder << 1 ^ (remainder >>> 9) * 0x537;

		bits = (data << 10 | remainder) ^ 0x5412;

		for (i = 0; i <= 5; i++)
			set(8, i, bit(i));

		set(8, 7, bit(6));
		set(8, 8, bit(7));
		set(7, 8, bit(8));

		for (i = 9; i < 15; i++)
			set(14 - i, 8, bit(i));

		for (i = 0; i < 8; i++)
			set(size - 1 - i, 8, bit(i));

		for (i = 8; i < 15; i++)
			set(8, size - 15 + i, bit(i));

		set(8, size - 8, true);
	},

	VersionBits: function (version, size, set) {
		var remainder = version;
		var bits;
		var i;

		if (version < 7) return;

		for (i = 0; i < 12; i++)
			remainder = remainder << 1 ^ (remainder >>> 11) * 0x1f25;

		bits = version << 12 | remainder;

		for (i = 0; i < 18; i++) {
			set(size - 11 + i % 3, Math.floor(i / 3), (bits >>> i & 1) !== 0);
			set(Math.floor(i / 3), size - 11 + i % 3, (bits >>> i & 1) !== 0);
		}
	},

	/* The bits of the codewords in the zigzag of two columns, from the bottom right, around the patterns. */
	Place: function (codewords, size, modules, fixed) {
		var i = 0;
		var right;
		var vertical;
		var j;
		var x;
		var y;

		for (right = size - 1; right >= 1; right -= 2) {
			if (right === 6)
				right = 5;

			for (vertical = 0; vertical < size; vertical++) {
				for (j = 0; j < 2; j++) {
					x = right - j;
					y = (right + 1 & 2) === 0 ? size - 1 - vertical : vertical;

					if (!fixed[y][x] && i < codewords.length * 8) {
						modules[y][x] = (codewords[i >>> 3] >>> 7 - (i & 7) & 1) !== 0;
						i++;
					}
				}
			}
		}
	},

	/* The eight masks: whether a module at x, y is inverted. */
	Masks: [
		function (x, y) {
			return (x + y) % 2 === 0;
		},
		function (x, y) {
			return y % 2 === 0;
		},
		function (x) {
			return x % 3 === 0;
		},
		function (x, y) {
			return (x + y) % 3 === 0;
		},
		function (x, y) {
			return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
		},
		function (x, y) {
			return x * y % 2 + x * y % 3 === 0;
		},
		function (x, y) {
			return (x * y % 2 + x * y % 3) % 2 === 0;
		},
		function (x, y) {
			return ((x + y) % 2 + x * y % 3) % 2 === 0;
		}
	],

	/* A mask applied to the modules that are not patterns; applied twice, it takes itself away. */
	Mask: function (mask, size, modules, fixed) {
		var invert = this.Masks[mask];
		var x;
		var y;

		for (y = 0; y < size; y++) {
			for (x = 0; x < size; x++) {
				if (!fixed[y][x] && invert(x, y))
					modules[y][x] = !modules[y][x];
			}
		}
	},

	/* The penalty of the modules: runs, 2 by 2 squares, shapes like a finder, and the balance of dark and light. */
	Penalty: function (modules, size) {
		var result = 0;
		var dark = 0;
		var history;
		var color;
		var run;
		var x;
		var y;
		var add = function (length) {
			if (history[0] === 0)
				length += size;

			history.pop();
			history.unshift(length);
		};
		var count = function () {
			var n = history[1];
			var core = n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;

			return (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) + (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0);
		};
		var line = function (get) {
			var i;

			color = false;
			run = 0;
			history = [0, 0, 0, 0, 0, 0, 0];

			for (i = 0; i < size; i++) {
				if (get(i) === color) {
					run++;

					if (run === 5) result += 3;
					else if (run > 5) result++;
				}
				else {
					add(run);

					if (!color)
						result += count() * 40;

					color = get(i);
					run = 1;
				}
			}

			if (color) {
				add(run);

				run = 0;
			}

			run += size;

			add(run);

			result += count() * 40;
		};

		for (y = 0; y < size; y++) {
			line(function (i) {
				return modules[y][i];
			});
		}

		for (x = 0; x < size; x++) {
			line(function (i) {
				return modules[i][x];
			});
		}

		for (y = 0; y < size - 1; y++) {
			for (x = 0; x < size - 1; x++) {
				if (modules[y][x] === modules[y][x + 1] && modules[y][x] === modules[y + 1][x] && modules[y][x] === modules[y + 1][x + 1])
					result += 3;
			}
		}

		modules.forEach(function (row) {
			row.forEach(function (module) {
				if (module)
					dark++;
			});
		});

		result += (Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1) * 10;

		return result;
	},

	SVG: function (text, options) {
		var code = this.Encode(text, options && options.Level);
		var margin = options && options.Margin !== undefined ? Number(options.Margin) : 4;
		var total = code.Size + margin * 2;
		var path = '';

		code.Modules.forEach(function (row, y) {
			row.forEach(function (module, x) {
				if (module)
					path += 'M' + (x + margin) + ' ' + (y + margin) + 'h1v1h-1z';
			});
		});

		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="' + (options && options.Light || '#ffffff') + '"/><path d="' + path + '" fill="' + (options && options.Dark || '#000000') + '"/></svg>';
	}
});
