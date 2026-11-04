/*
 * Barcodes: the codes of the shelves, the parcels and the tickets, drawn in SVG; QR codes are the QR Service.
 * - Formats(): the names of the formats: code128 (any ASCII text, its sets switched to the shortest), ean13 and ean8
 *   (12 or 7 digits, the check digit added; or 13 and 8, the check digit checked), upca (11 or 12 digits), code39 (the
 *   capitals, the digits and - . space $ / + %; Check adds the digit of modulo 43), itf14 (13 or 14 digits, its bearer
 *   bars), datamatrix (any text, in UTF-8; the least square symbol it fits, 10 to 144 modules) and pdf417 (any text;
 *   Columns 1 to 30, Level 0 to 8 of error correction, by its length when not given).
 * - Register(name, format): a format of its own, {Encode(text, options), Label}: Encode returns a code (below) or
 *   throws an Error of what is wrong in the text.
 * - Encode(format, text, options): the code, one of {Kind: 'linear', Modules: '1011...' (1 a dark module), Guards (the
 *   same length, 1 a bar drawn longer: the guards of EAN and UPC), Texts: [{Text, From, To}] (the human text, at those
 *   modules: less than 0 or past the end in the quiet zone), Quiet: {Left, Right}, Bearer}, {Kind: 'matrix', Modules:
 *   [[true, false...]] (rows of dark), Quiet} or {Kind: 'stacked', Rows: ['1011...'], RowHeight, Quiet}.
 * - SVG(format, text, options): its drawing; options Height (of the bars, in modules: 50), ShowText (true), FontSize (in
 *   modules: 10), Dark, Light (transparent for none), Round (0 to 1: the ends of the bars round), Shape (of the modules
 *   of a matrix: square, dots, rounded or diamond, as the QR Service draws them) and the options of the format.
 */
Elemenx.Service('Barcodes', {
	$Meta: {
		Description: 'Barcodes: Code 128, EAN-13, EAN-8, UPC-A, Code 39, ITF-14, DataMatrix, PDF417 and formats of its own, drawn in SVG.',
		Methods: ['Formats()', 'Register(name, format)', 'Encode(format, text, options)', 'SVG(format, text, options)']
	},
	$OnCreate: function () {
		var self = this;

		this.Registry = {};

		[['code128', 'Code 128', 'Code128'], ['ean13', 'EAN-13', 'Ean13'], ['ean8', 'EAN-8', 'Ean8'], ['upca', 'UPC-A', 'UpcA'], ['code39', 'Code 39', 'Code39'], ['itf14', 'ITF-14', 'Itf14'], ['datamatrix', 'Data Matrix', 'DataMatrix'], ['pdf417', 'PDF417', 'Pdf417']].forEach(function (entry) {
			self.Registry[entry[0]] = {Label: entry[1], Encode: function (text, options) {
				return self[entry[2]](String(text == null ? '' : text), options || {});
			}};
		});
	},

	Formats: function () {
		return Object.keys(this.Registry);
	},

	Register: function (name, format) {
		if (!name || !format || typeof format.Encode !== 'function')
			throw new Error('Elemenx Barcodes.Register expects (name, {Encode(text, options)})');

		this.Registry[String(name).toLowerCase()] = format;
	},

	Encode: function (format, text, options) {
		var entry = this.Registry[String(format || '').toLowerCase()];
		if (!entry)
			throw new Error('Elemenx Barcodes does not know the format ' + format + ' (' + this.Formats().join(', ') + ')');

		return entry.Encode(text, options || {});
	},

	/* The bytes of a text in UTF-8. */
	Bytes: function (text) {
		return Array.prototype.map.call(unescape(encodeURIComponent(String(text))), function (character) {
			return character.charCodeAt(0);
		});
	},

	/* Bars and spaces of widths (from a bar) as modules: [2, 1, 2] is 11011. */
	Widths: function (widths) {
		var modules = '';

		widths.forEach(function (width, index) {
			modules += new Array(Number(width) + 1).join(index % 2 ? '0' : '1');
		});

		return modules;
	},

	/* The check digit of a GTIN (EAN, UPC, ITF-14) of its digits without it. */
	GtinCheck: function (digits) {
		var sum = 0;
		var i;

		for (i = 0; i < digits.length; i++) {
			sum += Number(digits.charAt(digits.length - 1 - i)) * (i % 2 ? 1 : 3);
		}

		return String((10 - sum % 10) % 10);
	},

	/* The digits of a GTIN of length digits: one less gets its check digit, the right length has it checked. */
	Gtin: function (text, length, name) {
		var digits = String(text).replace(/\s+/g, '');
		if (!/^\d+$/.test(digits) || (digits.length !== length && digits.length !== length - 1))
			throw new Error('Elemenx Barcodes ' + name + ' takes ' + (length - 1) + ' or ' + length + ' digits: ' + text);

		if (digits.length === length - 1)
			return digits + this.GtinCheck(digits);

		if (this.GtinCheck(digits.substring(0, length - 1)) !== digits.charAt(length - 1))
			throw new Error('Elemenx Barcodes ' + name + ': the check digit of ' + digits + ' is ' + this.GtinCheck(digits.substring(0, length - 1)));

		return digits;
	},

	/* Code 128: the widths of its 107 symbols (103 to 105 the starts A, B and C, 106 the stop). */
	Code128Widths: ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'],

	/*
	 * Code 128 of an ASCII text: set C (two digits a symbol) for a run of four digits or more (six inside the text),
	 * set B for the printable characters, set A for the control ones, the check symbol of modulo 103.
	 */
	Code128: function (text) {
		var values = [];
		var set;
		var i = 0;
		var check;
		var modules = '';
		var self = this;

		function digits (from) {
			var count = 0;

			while (from + count < text.length && /\d/.test(text.charAt(from + count)))
				count++;

			return count;
		}

		function needsA (from) {
			var k;

			for (k = from; k < text.length; k++) {
				if (text.charCodeAt(k) < 32) return true;

				if (text.charCodeAt(k) >= 96) return false;
			}

			return false;
		}

		if (!text.length)
			throw new Error('Elemenx Barcodes code128 needs a text');

		for (i = 0; i < text.length; i++) {
			if (text.charCodeAt(i) > 127)
				throw new Error('Elemenx Barcodes code128 takes ASCII only: ' + text.charAt(i) + ' (datamatrix or pdf417 take any text)');
		}

		i = 0;
		set = digits(0) >= 4 || (digits(0) === text.length && text.length % 2 === 0) ? 'C' : needsA(0) ? 'A' : 'B';

		values.push(set === 'A' ? 103 : set === 'B' ? 104 : 105);

		while (i < text.length) {
			var run = digits(i);
			var code;

			if (set === 'C') {
				if (run >= 2) {
					values.push(Number(text.substr(i, 2)));

					i += 2;

					continue;
				}

				set = needsA(i) ? 'A' : 'B';

				values.push(set === 'A' ? 101 : 100);

				continue;
			}

			/* A run of digits long enough to save symbols in set C: an odd one gives its first digit to this set. */
			if (run >= 4 && (i + run === text.length || run >= 6)) {
				if (run % 2) {
					values.push(text.charCodeAt(i) - 32);

					i++;
				}

				set = 'C';

				values.push(99);

				continue;
			}

			code = text.charCodeAt(i);

			if (set === 'B' && code < 32) {
				set = 'A';

				values.push(101);
			}
			else if (set === 'A' && code >= 96) {
				set = 'B';

				values.push(100);
			}

			values.push(set === 'A' ? (code < 32 ? code + 64 : code - 32) : code - 32);

			i++;
		}

		check = values[0];

		for (i = 1; i < values.length; i++) {
			check += values[i] * i;
		}

		values.push(check % 103, 106);

		values.forEach(function (value) {
			modules += self.Widths(self.Code128Widths[value].split(''));
		});

		return {Kind: 'linear', Modules: modules, Texts: [{Text: text.replace(/[\x00-\x1f\x7f]/g, ' '), From: 0, To: modules.length}], Quiet: {Left: 10, Right: 10}};
	},

	/* The codes of EAN and UPC: L (odd parity, the left half), G (even, the left half of EAN-13) and R (the right half). */
	EanL: ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'],

	/* The parities of the left half of EAN-13 by its first digit (0 an L, 1 a G). */
	EanParity: ['000000', '001011', '001101', '001110', '010011', '011001', '011100', '010101', '010110', '011010'],

	EanDigit: function (digit, kind) {
		var l = this.EanL[Number(digit)];
		var r = l.replace(/[01]/g, function (bit) {
			return bit === '1' ? '0' : '1';
		});

		if (kind === 'L') return l;

		return kind === 'R' ? r : r.split('').reverse().join('');
	},

	/* The modules of an EAN of its digits: the left half by parity, the guards 101, 01010 and 101 drawn longer. */
	Ean: function (digits, parity) {
		var left = digits.length === 13 ? digits.substring(1, 7) : digits.substring(0, 4);
		var right = digits.length === 13 ? digits.substring(7) : digits.substring(4);
		var modules = '101';
		var guards = '111';
		var self = this;

		left.split('').forEach(function (digit, index) {
			modules += self.EanDigit(digit, parity && parity.charAt(index) === '1' ? 'G' : 'L');
		});

		modules += '01010';
		guards = guards + new Array(left.length * 7 + 1).join('0') + '11111';

		right.split('').forEach(function (digit) {
			modules += self.EanDigit(digit, 'R');
		});

		modules += '101';
		guards += new Array(right.length * 7 + 1).join('0') + '111';

		return {Modules: modules, Guards: guards};
	},

	Ean13: function (text) {
		var digits = this.Gtin(text, 13, 'ean13');
		var code = this.Ean(digits, this.EanParity[Number(digits.charAt(0))]);

		return {Kind: 'linear', Modules: code.Modules, Guards: code.Guards, Texts: [{Text: digits.charAt(0), From: -9, To: -1}, {Text: digits.substring(1, 7), From: 3, To: 45}, {Text: digits.substring(7), From: 50, To: 92}], Quiet: {Left: 11, Right: 7}};
	},

	Ean8: function (text) {
		var digits = this.Gtin(text, 8, 'ean8');
		var code = this.Ean(digits, null);

		return {Kind: 'linear', Modules: code.Modules, Guards: code.Guards, Texts: [{Text: digits.substring(0, 4), From: 3, To: 31}, {Text: digits.substring(4), From: 36, To: 64}], Quiet: {Left: 7, Right: 7}};
	},

	/* UPC-A: an EAN-13 of a first 0, its first and its last digit outside, their bars drawn longer too. */
	UpcA: function (text) {
		var digits = this.Gtin(text, 12, 'upca');
		var code = this.Ean('0' + digits, this.EanParity[0]);
		var guards = code.Guards.substring(0, 3) + '1111111' + code.Guards.substring(10, 85) + '1111111' + code.Guards.substring(92);

		return {Kind: 'linear', Modules: code.Modules, Guards: guards, Texts: [{Text: digits.charAt(0), From: -8, To: -1}, {Text: digits.substring(1, 6), From: 10, To: 45}, {Text: digits.substring(6, 11), From: 50, To: 85}, {Text: digits.charAt(11), From: 96, To: 103}], Quiet: {Left: 9, Right: 9}};
	},

	/* Code 39: its characters, and their nine elements (bar, space... bar), 1 a wide one. */
	Code39Characters: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*',
	Code39Patterns: ['000110100', '100100001', '001100001', '101100000', '000110001', '100110000', '001110000', '000100101', '100100100', '001100100', '100001001', '001001001', '101001000', '000011001', '100011000', '001011000', '000001101', '100001100', '001001100', '000011100', '100000011', '001000011', '101000010', '000010011', '100010010', '001010010', '000000111', '100000110', '001000110', '000010110', '110000001', '011000001', '111000000', '010010001', '110010000', '011010000', '010000101', '110000100', '011000100', '010101000', '010100010', '010001010', '000101010', '010010100'],

	Code39: function (text, options) {
		var value = String(text).toUpperCase();
		var characters = this.Code39Characters;
		var self = this;
		var modules = '';
		var sum = 0;
		var full;

		if (!value.length)
			throw new Error('Elemenx Barcodes code39 needs a text');

		value.split('').forEach(function (character) {
			var index = characters.indexOf(character);
			if (index === -1 || character === '*')
				throw new Error('Elemenx Barcodes code39 cannot write ' + character + ' (the capitals, the digits and - . space $ / + %)');

			sum += index;
		});

		full = '*' + value + (options.Check ? characters.charAt(sum % 43) : '') + '*';

		full.split('').forEach(function (character, index) {
			var pattern = self.Code39Patterns[characters.indexOf(character)];

			if (index)
				modules += '0';

			modules += self.Widths(pattern.split('').map(function (bit) {
				return bit === '1' ? 3 : 1;
			}));
		});

		return {Kind: 'linear', Modules: modules, Texts: [{Text: full.substring(1, full.length - 1), From: 0, To: modules.length}], Quiet: {Left: 10, Right: 10}};
	},

	/* Interleaved 2 of 5: the five elements of each digit, 1 a wide one. */
	ItfPatterns: ['00110', '10001', '01001', '11000', '00101', '10100', '01100', '00011', '10010', '01010'],

	/* ITF-14: the digits two by two (the bars of the first, the spaces of the second), and its bearer bars. */
	Itf14: function (text, options) {
		var digits = this.Gtin(text, 14, 'itf14');
		var widths = [1, 1, 1, 1];
		var self = this;
		var i;

		for (i = 0; i < digits.length; i += 2) {
			[0, 1, 2, 3, 4].forEach(function (k) {
				widths.push(self.ItfPatterns[Number(digits.charAt(i))].charAt(k) === '1' ? 3 : 1, self.ItfPatterns[Number(digits.charAt(i + 1))].charAt(k) === '1' ? 3 : 1);
			});
		}

		widths.push(3, 1, 1);

		return {Kind: 'linear', Modules: this.Widths(widths), Texts: [{Text: digits.charAt(0) + ' ' + digits.substring(1, 3) + ' ' + digits.substring(3, 8) + ' ' + digits.substring(8, 13) + ' ' + digits.charAt(13), From: 0, To: this.Widths(widths).length}], Quiet: {Left: 10, Right: 10}, Bearer: options.Bearer !== false};
	},

	/* The arithmetic of GF(256) of DataMatrix (its polynomial 301): its logarithms and powers, made once. */
	Field256: function () {
		var log = [];
		var power = [];
		var x = 1;
		var i;

		if (this.Gf)
			return this.Gf;

		for (i = 0; i < 255; i++) {
			power[i] = x;
			log[x] = i;
			x <<= 1;

			if (x & 256)
				x ^= 301;
		}

		this.Gf = {Log: log, Power: power};

		return this.Gf;
	},

	/* The error correction of a block of DataMatrix: count codewords of Reed-Solomon over GF(256). */
	DataMatrixCorrection: function (data, count) {
		var gf = this.Field256();
		var multiply = function (a, b) {
			return a && b ? gf.Power[(gf.Log[a] + gf.Log[b]) % 255] : 0;
		};
		var generator = [1];
		var remainder = [];
		var i;
		var j;
		var factor;

		/* (x - α^1)(x - α^2)...(x - α^count), the highest power first. */
		for (i = 1; i <= count; i++) {
			var next = [];

			for (j = 0; j <= generator.length; j++) {
				next[j] = (j < generator.length ? generator[j] : 0) ^ (j ? multiply(generator[j - 1], gf.Power[i % 255]) : 0);
			}

			generator = next;
		}

		for (i = 0; i < count; i++) remainder[i] = 0;

		data.forEach(function (codeword) {
			factor = codeword ^ remainder[0];

			remainder.shift();
			remainder.push(0);

			for (j = 0; j < count; j++) {
				remainder[j] ^= multiply(generator[j + 1], factor);
			}
		});

		return remainder;
	},

	/* The square symbols of DataMatrix ECC 200: [size, regions on a side, data codewords, error codewords, blocks]. */
	DataMatrixSizes: [[10, 1, 3, 5, 1], [12, 1, 5, 7, 1], [14, 1, 8, 10, 1], [16, 1, 12, 12, 1], [18, 1, 18, 14, 1], [20, 1, 22, 18, 1], [22, 1, 30, 20, 1], [24, 1, 36, 24, 1], [26, 1, 44, 28, 1], [32, 2, 62, 36, 1], [36, 2, 86, 42, 1], [40, 2, 114, 48, 1], [44, 2, 144, 56, 1], [48, 2, 174, 68, 1], [52, 2, 204, 84, 2], [64, 4, 280, 112, 2], [72, 4, 368, 144, 4], [80, 4, 456, 192, 4], [88, 4, 576, 224, 4], [96, 4, 696, 272, 4], [104, 4, 816, 336, 6], [120, 6, 1050, 408, 6], [132, 6, 1304, 496, 8], [144, 6, 1558, 620, 10]],

	/*
	 * DataMatrix ECC 200 of a text: its bytes in UTF-8 in the ASCII encodation (two digits a codeword, a byte past 127
	 * after an upper shift), padded, its blocks corrected and interleaved, placed as the standard says (ISO/IEC 16022,
	 * annex F) in the data regions of the least square symbol it fits, within their finder patterns.
	 */
	DataMatrix: function (text) {
		var bytes = this.Bytes(text);
		var data = [];
		var size;
		var i = 0;

		while (i < bytes.length) {
			if (i + 1 < bytes.length && bytes[i] >= 48 && bytes[i] <= 57 && bytes[i + 1] >= 48 && bytes[i + 1] <= 57) {
				data.push(130 + (bytes[i] - 48) * 10 + bytes[i + 1] - 48);

				i += 2;
			}
			else if (bytes[i] > 127) {
				data.push(235, bytes[i] - 127);

				i++;
			}
			else {
				data.push(bytes[i] + 1);

				i++;
			}
		}

		size = this.DataMatrixSizes.filter(function (entry) {
			return entry[2] >= data.length;
		})[0];

		if (!size)
			throw new Error('Elemenx Barcodes datamatrix: the text is too long for a symbol (1556 codewords at most)');

		/* The pads: 129 first, then the ones of the 253-state randomizing of their places (from 1). */
		var first = true;

		while (data.length < size[2]) {
			var pad = 129;

			if (!first) {
				pad = 129 + ((149 * (data.length + 1)) % 253) + 1;

				if (pad > 254)
					pad -= 254;
			}

			first = false;

			data.push(pad);
		}

		return {Kind: 'matrix', Modules: this.DataMatrixPlace(size, this.DataMatrixInterleave(data, size)), Quiet: 2, Size: size[0]};
	},

	/* The codewords with their error correction: the blocks take the data codewords in turn, and give their errors so. */
	DataMatrixInterleave: function (data, size) {
		var blocks = size[4];
		var errors = size[3] / blocks;
		var all = data.slice();
		var b;
		var k;

		for (b = 0; b < blocks; b++) {
			var block = data.filter(function (codeword, index) {
				return index % blocks === b;
			});
			var correction = this.DataMatrixCorrection(block, errors);

			for (k = 0; k < errors; k++) {
				all[data.length + k * blocks + b] = correction[k];
			}
		}

		return all;
	},

	/* The codewords placed in the symbol: [[dark]] of size rows, the finder patterns of each region around its data. */
	DataMatrixPlace: function (size, codewords) {
		var regions = size[1];
		var region = (size[0] - 2 * regions) / regions;
		var nrow = region * regions;
		var ncol = nrow;
		var array = [];
		var modules = [];
		var chr = 1;
		var row = 4;
		var col = 0;
		var x;
		var y;
		var i;

		for (i = 0; i < nrow * ncol; i++) array[i] = 0;

		function module (r, c, character, bit) {
			if (r < 0) {
				r += nrow;
				c += 4 - ((nrow + 4) % 8);
			}

			if (c < 0) {
				c += ncol;
				r += 4 - ((ncol + 4) % 8);
			}

			array[r * ncol + c] = 10 * character + bit;
		}

		function utah (r, c, character) {
			module(r - 2, c - 2, character, 1);
			module(r - 2, c - 1, character, 2);
			module(r - 1, c - 2, character, 3);
			module(r - 1, c - 1, character, 4);
			module(r - 1, c, character, 5);
			module(r, c - 2, character, 6);
			module(r, c - 1, character, 7);
			module(r, c, character, 8);
		}

		function corner (character, places) {
			places.forEach(function (place, index) {
				module(place[0], place[1], character, index + 1);
			});
		}

		do {
			if (row === nrow && col === 0)
				corner(chr++, [[nrow - 1, 0], [nrow - 1, 1], [nrow - 1, 2], [0, ncol - 2], [0, ncol - 1], [1, ncol - 1], [2, ncol - 1], [3, ncol - 1]]);

			if (row === nrow - 2 && col === 0 && ncol % 4)
				corner(chr++, [[nrow - 3, 0], [nrow - 2, 0], [nrow - 1, 0], [0, ncol - 4], [0, ncol - 3], [0, ncol - 2], [0, ncol - 1], [1, ncol - 1]]);

			if (row === nrow - 2 && col === 0 && ncol % 8 === 4)
				corner(chr++, [[nrow - 3, 0], [nrow - 2, 0], [nrow - 1, 0], [0, ncol - 2], [0, ncol - 1], [1, ncol - 1], [2, ncol - 1], [3, ncol - 1]]);

			if (row === nrow + 4 && col === 2 && !(ncol % 8))
				corner(chr++, [[nrow - 1, 0], [nrow - 1, ncol - 1], [0, ncol - 3], [0, ncol - 2], [0, ncol - 1], [1, ncol - 3], [1, ncol - 2], [1, ncol - 1]]);

			do {
				if (row < nrow && col >= 0 && !array[row * ncol + col])
					utah(row, col, chr++);

				row -= 2;

				col += 2;
			} while (row >= 0 && col < ncol);

			row += 1;
			col += 3;

			do {
				if (row >= 0 && col < ncol && !array[row * ncol + col])
					utah(row, col, chr++);

				row += 2;

				col -= 2;
			} while (row < nrow && col >= 0);

			row += 3;

			col += 1;
		} while (row < nrow || col < ncol);

		/* The corner the codewords leave: a fixed pattern. */
		if (!array[nrow * ncol - 1])
			array[nrow * ncol - 1] = array[nrow * ncol - ncol - 2] = 1;

		for (y = 0; y < size[0]; y++) {
			modules.push([]);

			for (x = 0; x < size[0]; x++) {
				var inY = y % (region + 2);
				var inX = x % (region + 2);
				var dark;
				var value;

				/* The finder of a region: solid on the left and at the bottom, dotted at the top and on the right. */
				if (inX === 0 || inY === region + 1) {
					dark = true;
				}
				else if (inY === 0) {
					dark = inX % 2 === 0;
				}
				else if (inX === region + 1) {
					dark = inY % 2 === 1;
				}
				else {
					value = array[(Math.floor(y / (region + 2)) * region + inY - 1) * ncol + Math.floor(x / (region + 2)) * region + inX - 1];
					dark = value === 1 || (value > 1 && !!(codewords[Math.floor(value / 10) - 1] & (1 << (8 - value % 10))));
				}

				modules[y].push(dark);
			}
		}

		return modules;
	},

	/* PDF417: the patterns of its codewords in their three clusters (ISO/IEC 15438, annex A; the table of ZXing, Apache 2.0), 4 digits of base 36 each. */
	Pdf417Table: [
		'2ksg2oz42r242km82ovs2r0e2bwg2kj42bts1uf42bsg1ue82cw02l0w2p302cps2kxk2p1a1w3k2cmo1w0w1x342d4g2l4s1www2d142l321wts2czg1xbk2d8c1x882d6m1xfg2r5m2k802ooo2qwu2b402k4w2on02b1c2k3c1su82b002k2k1stc2azc1ssw2bj42kc82oqm1tq82bg02kak1tnk2beg2k9q1tm82bdo1u5c2bnc2ke61u282blo1u0o2bku1u9k2bpa1u7w1u722aps2jxs2ojg2an42jw82oim1s1s2als2jvg1s0w2al41s0g1s081sjk2auo2jzw1sgw2at42jz21sfk2asc1sew1sek1sog2aws1smw2avy1sm41sqk2ag02jso2ogu1rnk2aeo2jrw1rmo2ae02jri1rm82ado1rm02adi1rvk2aig2jtq1ru82aho1rtk2aha1rt81rt22aji1rwu1rgg2ab42jq41rfk2aag2jpq1rf42aa41rew2a9y1res1rjk1riw1rik1rc02jou2a8c2a861rb62in42nw82qim27y82ik02nuk27vk2iig2ntq1mio27u81mhs28dc2irc2ny61neo28a82ipo1nc0288o1nao1na01nts28hk2ita1nqo28fw1np41noc1ny028ji1nwc1nzy2ls02pgw2rb02lpc2pfc2ra62e682lo02pek2e5c2lnc2pe62e4w2ln027k02icw2nr02eo027hc2ibc2nq62elc2lvc2pi61zy81lpc27fc2ia61zxc2ejc1zww1m8027ow2if020g01m5c27nc2ie620dc2erc2ly620c01m3c20bc1mcw27r020kw1mbc27q620jc2eu620ik1mf020n01me620m62li82pbs2r8e2ds02lgw2pb02dr42lg82pam2dqo2lfw2dqg2dqc27a82i7s2noe2e00278w2i701yrk1lb42ljw2i6m1yqo1lao277w1yq82dxo277q1lac1lk027co2i8u1yzk1lio27bw1yy82e1o27bi1yxk1lho1lhi1lmg27dq1z201llo1z181lla1z0u1z322dkw2ldc2p982dk02lco2p8u2djk2lcc2djc2lc62dj82dj61l4w275c2i581y681l40274o2i4u1y5c2dnc2le61y4w1l3c27461y4o2dmu1y4k1l80276k1y9c1l7c27661y8o2dou1y8c1l6u1y861yak1ya62dgg2law2p7y2dg02lak2dfs2lae2dfo2dfm1l0g272w2i3y1xuo1l00272k1xu82dho272e1xu01kzo1xtw1kzm1l201xw81xvw1xvq2l9o2l9i2ddu271o1ky01xoo1xok1xoi25z42hkg2ncs25wg2hiw1ikg25v42hi41ijk25ug1ij41iiw1j2826402hmk1izk262g2hlq1iy8261o1ixk1ix81j7426641j5k265a1j4s1j981j8e2j4w2o542qn2291c2j3k2o4c290g2j2w2o3y29002j2k28zs2j2e25pc2hfc2na6299c25o02hek1pa81i5c2j6k2he61p9c297c25n01p8w1i4o1p8o1ie825rs2hge1pi81icw2j8e1pgw29b025qm1pg81ibw1pfw1igo25su1pko1ifw1pjw1ifi1ihq1plq2m9s2pps2rfg2m8w2pp42rf22m8g2pos2m882pom2m8428u82j002o2k2fk028tc2pr02o262fj42mc82pqm2fio28so2iyu2fig2mbq28si1hz425kg2hcs1oow1hy825js2hce224g1oo028wo2j0u223k2fmg2mdq25ja22341onc28w6222w1hxe1i2825lo1os01i1k25la227k1orc28y6226w2fny1i121oqu1i3g1ot81i32228s1osu2m5c2pnc2re62m4w2pn02m4o2pmu2m4k2m4i28ps2ixk2o1a2f8g28pc2pny2f802m6k2ix22f7s28p02f7o28oy2f7m1huo25i02hbi1odc1hu825ho21eo1ocw28r025hi21e82f9o1htw21e01ock1htu1oci1hw825im1oew1hvw21g81oek1hvq21fw1oee1hwu21gu2m342pm42m2w2ply2m2s2m2q28nk2iwc2f2o28nc2iw62f2g2m3q2f2c28n62f2a1hsg25gs1o7k1hs825gm211s1o7c28o6211k2f3a1hs2211g1o76211e1o8c212k212e2pli2m1u2ivq28mc28ma1hrc1o4o20vc1hr61o4i24ww1glc24vk1gkg24uw2gzy1gk024uk1gjs24ue1gtc24zc2h261gs024yk1grc24y61gr01gqu1gvs250e1gv01gum1gwu26gw2htc2nh826g02hso26fk2hsc26fc2hs626f81ge824s02gyk1jy81gdc2huk2gy61jxc26jc2hu61jww1gco24qu1jwo26iu1gci1ghc24t81k1c1ggo24su1k0o26ku1k0c1gg61gik1k2k1gi61k262jds2o9k2qpa2jdc2o982jd42o922jd02jcy26cg2hqw29pc26c02hqk29ow2jf02hqe29oo26bo29ok26bm29oi1g9s24pk1jmo1g9c2hri1qcg1jm826do24p21qc029qk1g901qbs1jlw1g8y1jlu1gbc24q61jo81gb01qe01jnw1gau1qdo1jnq1gby1jou1qem2pu82rho2pu02rhi2ptw2ptu2jbk2o8c2mkw2pv02o862mko2puu2mkk2jb62mki26a82hpo29jk26a02hpi2g2829jc2jc62g202mli269u2g1w29j62g1u1g7k24oc1jgw1g7c24o61pzk1jgo26au230w1pzc29k61g76230o2g2u1jgi230k1g8c1jho1g861q0c1jhi231o1q06231i2pt42rh22pt02psy2jag2o7q2mi02pti2mhw2jaa2mhu26942hp229go26902fvs29gk268y2fvo29gi2fvm1g6g24nq1je0269i1pt41jdw1g6a22nc1pt01jdu22n81psy22n61jee22nq2psi2mgk2mgi29f82fsk2fsi1jck1ppw22gk22gi1fls1fkw24d41fkg1fk81fk41fow1fo81fnw1fnq1fq41fpq255s255c2h5825542h522550254y1fhc24bc1h9c257c24b01h8w25701h8o256u1h8k1fgi1h8i1fiw24by1haw257y1hak1fie1hae1fji1hbi2hxs2hxk2hxg2hxe253k26s02hyk2h4626rs2hye26ro253626rm1ff41h3k1few249y1kgg1h3c1fes1kg81h381feq1kg41h361ffw1h4c1ffq1kh81h461kh22obs2obo2obm2hwo2jjc2oc62jj82hwi2jj6252g2h3q26p42hx229yg26p0252a29yc26oy29ya1fe0249i1h0o252u1ka01h0k1fdu1qso1k9w1h0i1qsk1k9u1fee1h121kae1qt22ris2riq2ob82px02ob62pwy2hw42jhw2hw22mpg2jhu2mpe251w26no251u29v826nm2gac',
		'2r1c2s3c2ou82r002s2k2otc2qzc2s262osw2qz02oso2qyu2osk2p282r3s2s4e2kw02p0w2r302kv42p082r2m2kuo2ozw2kug2ozq2kuc2l402p4o2r4u2czk2l2o2p3w2cyo2l202p3i2cy82l1o2cy02l1i2cxw2d7k2l6g2p5q1x6o2d682l5o1x5s2d5k2l5a1x5c2d581x542d521xeo2da02l7i1xdc2d981xco2d8u1xcc1xh42db21xgc1xfy2on42qwg2s0s2om82qvs2s0e2ols2qvg2olk2qva2olg2ole2kao2oq82qxo2k9s2opk2qxa2k9c2op82k942op22k902k8y2bls2kds2org2bkw2kd42or22bkg2kcs2bk82kcm2bk42bk21u802bow2kf01u742bo82kem1u6o2bnw1u6g2bnq1u6c1ub42bq41uag2bpq1ua41u9y1ucc1uby2oio2qu02rzi2oi82qto2oi02qti2ohw2ohu2jz42ok82qum2jyo2ojw2jyg2ojq2jyc2jya2aw02k0o2oku2avk2k0c2avc2k062av82av61sps2axk2k1a1spc2ax81sp42ax21sp01soy1src2ay61sr01squ1sry2ogg2qss2og82qsm2og42og22jtc2oh82jt42oh22jt02jsy2aj42ju42aiw2jty2ais2aiq1ryo2ajw1ryg2ajq1ryc1rya1rzg1rza2ofc2qs62of82of62jqg2ofq2jqc2jqa2aco2jqu2ack2aci1rl42ad21rl01rky2oes2oeq2jp02joy2a9g2a9e2nuo2qi82rto2nts2qhk2rta2ntc2qh82nt42qh22nt02nsy2ips2nxs2qjg2iow2nx42qj22iog2nws2io82nwm2io42io228g02isw2nz028f42is82nym28eo2irw28eg2irq28ec28ea1nwg28j42iu41nvk28ig2itq1nv428i41nuw28hy1nus1nzk28kc1nyw28jy1nyk1nye1o0s1o0e2ra82s7s1zw02r9s2s7g1zi02r9k2s7a1zb02r9g2r9e2nq82qfs2rse2pi82nps2s8e2phs2rbg2qfa2phk2npg2phg2npe2phe2ie82nrs2qge2ly82ids2nrg2lxs2pjg2nra2lxk2idg2lxg2ide2lxe27q82ifs2nse2eu827ps2ifg2ets2lzg2ifa2etk27pg2etg27pe2ete1me827rs2ige20m81mds27rg20ls2evg27ra20lk1mdg20lg1mde1mfs27se20ns1mfg20ng1mfa20na1mge2r802s6k1ypk2r7s2s6e1yik2r7o1yf22r7m2no02qek2pcg2nns2qee2pc82r8m2pc42nnm2pc22i8g2nos2llc2i882nom2ll42pd22ll02i822lky27dc2i982e3427d42i922e2w2lly2e2s27cy2e2q1ln427e41z2o1lmw27dy1z2g2e3q1z2c1lmq1z2a1lnw1z3g1lnq1z3a2r6w2s5y1y4c2r6s1y0u2r6q2nmw2qdy2p9k2r7a2p9g2nmq2p9e2i5k2nna2lew2i5g2les2i5e2leq276w2i5y2dpk2lfa2dpg276q2dpe1l9k277a1yaw1l9g1yas1l9e1yaq1l9y1yba2r6c1xtq2r6a2nmc2p842nma2p822i442lbo2i422lbm273o2dis273m2diq1l2s1xx01l2q1xwy2r622nm22p7e2i3e2la227222dfe2nc02q8o2rou2nbk2q8c2nbc2q862nb82nb62hls2ndk2q9a2hlc2nd82hl42nd22hl02hky265c2hnc2ne6264w2hn0264o2hmu264k264i1j8g266w2hny1j80266k1j7s266e1j7o1j7m1ja0267i1j9o1j9i1jam2qmo2rvw1p882qmg2rvq1p182qmc1oxq2qma2n9s2q7g2o5s2n9k2q7a2o5k2qna2o5g2n9e2o5e2hg02nak2j802hfs2nae2j7s2o6e2j7o2hfm2j7m25sg2hgs29cg25s82hgm29c82j8m29c425s229c21ihc25t81plc1ih425t21pl429d21pl01igy1pky1ii41pm41ihy1ply2sa021v42fi42s9w21o82fem2s9u21ks21j22qlk2rva1on02rfs2sae222k1oji2rfo2qle21z22rfm2n8o2q6u2o2w2n8k2prc2rg62n8i2pr82o2q2pr62hd42n922j1k2hd02meg2j1g2hcy2mec2j1e2mea25m02hdi28yw25lw2foo28ys25lu2fok28yq2foi1i3s25me1otk1i3o22941otg1i3m22901ote228y1i461oty2s9g21a02f7i2s9e216k214u2ql01oce2rec2qky21dq2rea2n842o1g2n822po42o1e2po22hbo2iyc2hbm2m7o2iya2m7m25is28s425iq2fas28s22faq1hx01ofo1hwy21h01ofm21gy2s9620zg20xq2qkq2rdm2n7u2o0q2pmi2hay2iwq2m4a25h628oq2f3u1htm1o8q212y20u62n2o2q3w2n2g2q3q2n2c2n2a2h1s2n3g2h1k2n3a2h1g2h1e25002h2k24zs2h2e24zo24zm1gwg250s1gw8250m1gw41gw21gx81gx22qaw2rpy1jwc2qas1jsu2qaq2n1k2q3a2nhk2n1g2nhg2n1e2nhe2gyw2n1y2huw2gys2hus2gyq2huq24tk2gza26lk24tg26lg24te26le1giw24ty1k2w1gis1k2s1giq1k2q1gja1k3a2rx01q7s29oe2rwy1q4c1q2m2qac1jlq2qpg2qaa1qbi2qpe2n102ng42n0y2oac2ng22oaa2gxg2hro2gxe2jg42hrm2jg224qc26es24qa29ro26eq29rm1gc41jp01gc21qes1joy1qeq22uo2fzw22rc2fy622po22ou2rwq1px82sbe22yk1pvi22wu2qa22qoq2ri22n0q2nfe2o8q2pve2gwq2hq22jcq2mm224oq26be29kq2g3e1g8q1ji21q0q22k82fum22ik22hq1pry22m622f022e622ce2my02mxw2mxu2grs2mye2gro2grm24fc2gs624f824f61fqg24fq1fqc1fqa1fqu2q501h8e2q4y2mxg2n5g2mxe2n5e2gqc2h6c2gqa2h6a24c4258424c225821fjo1hbo1fjm1hbm2rqi1ke41kce2q4q2qca2mx62n4q2nju2gpm2h4q2hyy24ai254q26t61fga1h4q1khm1qpk29xa1qnw1qn21k8u1qri23cg2g8s23aw2g7y23a4239q1qkc23ek1qji23dq237c2g66236k23661qhq238e234s234e233i2gms2gmq2450244y1f5g1f5e2mze2gm22gu2243e24je1f221fy21hha1kn01km61qyg2a1q1qxo1qxa1kke1qzi23lc2gd823ko2gcu23kc23k61qvw23mk1qvi23m623iw2gby23ik23ie1qum23ji23ho23hi1hlq1krg1kr21r2w2a3y1r2k1r2e1kq61r3i1r1o1r1i',
		'2cio2ku01v402c4w2kn01uqo2by02kji1uk02buk1ugo2s401wps2cxk2s3s1wc02cqk2s3o1w542cn22s3m1w1o2r4g2s4s1x4o2r482s4m1wxo2r441wu62r422p5c2r582p542r522p502p4y2l742p642l6w2p5y2l6s2l6q2dao2l7w2dag2l7q2dac1tj42bcg2k8s1t5s2b5k2k5a1sz42b241svs2b0e1su42s141tyo2bjw2s101trs2bge2s0y1toc1tmm2qy02s1i1u642qxw1u2m2qxu2ors2qye2oro2orm2kfc2os62kf82kf62bqg2kfq2bqc2bqa1sdc2arc2jy61s6o2anw1s3c2am61s1o1s0u2rzo1sl42av22rzm1sho1sfy2qus1sou2quq2ol02oky2k1g2k1e2ayc2aya1rsg2ags1rp42af21rng1rmm2ryy1rwc1rum2qt62ohm2jui1ri02abi1rgc1rfi1rjy1rcs1rby1n7k286o2inw1mu827zs2ike1mnk27wc1mk827um1mik2ru01nn428e42rtw1ng828am2rtu1ncs1nb22qjs2rue1nuk2qjo1nr22qjm2nzc2qk62nz82nz62iug2nzq2iuc2iua28ko2iuu28kk28ki2ehs2ltk2pha1zgg2eb42lq41za82e7s2loe1z742e641z5k2e5a1z4s1m1s27lk2ida209s1lv427i420342em427ge1zzs1lq41zy41lpa1zxa2rsk1m9k27pa2s8k2rsi20hk1m642s8i20e41m4e20ce2qgk1mda2rck2qgi20la2rci2nsk2pkk2nsi2pki2igk2m0k2igi2m0i27sk27si1yo02dww2lj01yhs2dtk2lha1yeo2drw1yd42dr21ycc1yby1lgw27b01ywg1ldk279a1yt42dz21yrg1lb21yqm2rru1lks2s6y1z0c1lj21yym2qey2r962np62pdm2i9m2lmi27ei1y3k2dmg2ldq1y0g2dks1xyw2djy1xy41xxq1l6g275q1y7s1l4s1y641l3y1y5a1l8e1y9q1xtc2dh81xrs2dge1xr01xqm1l181xvg1l0e1xum1xo82dem1xng1xn21kym1xpa1xlo1xla1iw0260o2hku1ipc25x81im025vi1ikc1iji2rp01j3s264e2roy1j0c1iym2q9g1j7i2q9e2nec2nea2ho42ho2267o267m1p6o29682j5o1p0g292w2j3y1oxc29181ovs290e1ov01oum1ib425q41pf41i7s25oe1pbs298e1pa41i5a1p9a2roa1if02rwa1pj01ida1pha2q7u2qnu2nay2o6y2hh62j9625tm2fhc2mbc2pq621mo2fe82m9o21k02fco2m8u21io2fbw21i02fbi21ho1om828vs2j0e221s1oj428u421yo2fjw28ta21x41ogs21wc1oge21vy1i0o25ku1oqg1hz022601oos1hy6224c1ony223i1i2m1ose227y218g2f742m64215s2f5k2m5a214g2f4s213s2f4e213g213a1oc028qk21dc1oag28pq21bs2f8e21b01o9a21am1hvg1oe41hum21fg1oda21em20yo2f202m3i20xc2f1820wo2f0u20wc20w61o6w28ny21141o64210c1o5q20zy1hsu1o7y212620ts2ezg20t42ez220ss20sm1o4c20v01o3y20um20rc2ey620r020qu1o3220ry20q420py1gq824xo1gmw24vy1gl81gke1gu41gse2q4a2n3u2h2y25161jvk26ig2htq1jsg26gs1jqw26fy1jq41jpq1gfs24se1jzs1ge41jy41gda1jxa1ghq1k1q1q6829o02jek1q3k29mg2jdq1q2829lo1q1k29la1q181q121jlc26d81qb41jjs26ce1q9k1jj01q8s1jim1q8e1gak1jng1g9q1qd81jmm1qce2fz42mk82pum22ps2fxs2mjg22ow2fx42mj222og2fws22o82fwm22o41pwg29iw2jby22xs1pv429i422wg2g0s29hq22vs1pu422vg1pty22va1jg826am1pyw1jfg23081py41jf222zg1pxq22z21g7y1jha1pzy231a22io2fu82mho22hs2ftk2mha22hc2ft822h42ft222h022gy1prk29gc22ls1pqw29fy22l42fv222ks1pqe22km1jdo1pss1jda22n01pse22mm22e82frs2mge22ds2frg22dk2fra22dg22de1pp429f222fs1pos22fg1pom22fa1jce1ppq22ge22c02fqk22bs2fqe22bo22bm1pnw22cs1pnq22cm22aw2fpy22as22aq1pna22ba1fnc24e61flo1fku1fpa1h80256k1h6g255q1h5o1h5a1fi41ha41fha1h9a1kdc26rc2hy61kc026qk1kbc26q61kb01kau1h2w253y1kfs1h241kf01h1q1kem1ffi1h3y1kgu1qo029ww2jj01qn429w82jim1qmo29vw1qmg29vq1qmc1qma1k8g26os1qr41k7s26oe1qqg29xq1qq41k7a1qpy1h0c1k9o1gzy1qsc1k9a1qry2g802moo2pwu2g7k2moc2g7c2mo62g782g761qjk29ug2jhq23ds1qj429u423dc2g9829ty23d41qis23d01qiq23cy1k6026ni1ql41k5o23fc1qks1k5i23f01qkm23eu1gz21k6m1qlq23fy2g5s2mng2g5k2mna2g5g2g5e1qhc29t823801qh429t2237s2g6e237o1qgy237m1k4s1qi41k4m238s1qhy238m2g4o2mmu2g4k2g4i1qg829sm23541qg423501qg2234y1k461qgm235i2g442g421qfo233o1qfm233m1f3w1f321fw824im1fvg1fv21f1a1fxa1hgw25b01hg825am1hfw1hfq1fto1hi41fta1hhq1km826vs2i0e1kls26vg1klk26va1klg1kle1heg259q1kns26we1kng1hdy1kna1fse1hf21koe2a1c2jl82a142jl22a102a0y1kk026uk1qz42a2426ue1qyw1kjo1qys1kjm1qyq1hd81kks1hd21qzw1kkm1qzq2mqw2pxy2mqs2mqq2a082jkm2gdk2a042gdg2a022gde1kiw26ty1qw81kis23mw1qw41kiq23ms1qw223mq1hcm1kja1qwm23na2mqc2mqa29zo2gc429zm2gc21kic1qus1kia23jo1quq23jm2mq229ze2gbe1ki21qu223i21f8c1f7y1g0o24ku1g0c1g061f721g1a1hlc25d81hl425d21hl01hky1fzg1hm41fza1hly26y02i1i26xw26xu1hk825cm1krs26ye1kro1hk21krm1fyu1hkm1ks62jmc2jma26xg2a4426xe2a421hjo1kqc1hjm1r3o1kqa1r3m2jm226x62a3e1hje1kpm1r221fak1fae1g2w24ly1g2s1g2q1f9y1g3a25ec25ea1g2c1ho41g2a1ho22i22'
	],

	/* The 17 modules of a codeword in a cluster. */
	Pdf417Pattern: function (cluster, codeword) {
		var value = parseInt(this.Pdf417Table[cluster].substr(codeword * 4, 4), 36);

		return ('00000000000000000' + value.toString(2)).slice(-17);
	},

	/* The error correction of PDF417: count codewords of Reed-Solomon over GF(929) of the generator of the powers of 3. */
	Pdf417Correction: function (data, count) {
		var coefficients = [1];
		var errors = [];
		var power = 1;
		var i;
		var j;
		var t1;

		/* (x - 3)(x - 9)...(x - 3^count), the lowest power first. */
		for (i = 1; i <= count; i++) {
			var next = [];

			power = power * 3 % 929;

			for (j = 0; j <= coefficients.length; j++) {
				next[j] = ((j ? coefficients[j - 1] : 0) + (j < coefficients.length ? (929 - power) * coefficients[j] % 929 : 0)) % 929;
			}

			coefficients = next;
		}

		for (i = 0; i < count; i++) errors[i] = 0;

		data.forEach(function (codeword) {
			t1 = (codeword + errors[count - 1]) % 929;

			for (j = count - 1; j >= 1; j--) {
				errors[j] = (errors[j - 1] + 929 - t1 * coefficients[j] % 929) % 929;
			}

			errors[0] = (929 - t1 * coefficients[0] % 929) % 929;
		});

		return errors.map(function (error) {
			return error ? 929 - error : 0;
		}).reverse();
	},

	/*
	 * PDF417 of a text: its bytes in the byte compaction (an ECI of UTF-8 first for a text past ASCII), the symbol
	 * length descriptor, pads, the error correction of Level (by the length when not given), in rows of Columns
	 * codewords (chosen for a symbol about three times as wide as high) between their row indicators.
	 */
	Pdf417: function (text, options) {
		var bytes = this.Bytes(text);
		var codewords = [];
		var ascii = bytes.every(function (byte) {
			return byte < 128;
		});
		var i;
		var level;
		var count;
		var columns;
		var rows;
		var pads;
		var all;
		var lines = [];
		var self = this;

		if (!ascii)
			codewords.push(927, 26);

		codewords.push(bytes.length % 6 === 0 ? 924 : 901);

		for (i = 0; i + 6 <= bytes.length; i += 6) {
			var value = 0;
			var group = [];
			var k;

			for (k = 0; k < 6; k++) value = value * 256 + bytes[i + k];

			for (k = 0; k < 5; k++) {
				group.unshift(value % 900);

				value = Math.floor(value / 900);
			}

			codewords = codewords.concat(group);
		}

		for (; i < bytes.length; i++) codewords.push(bytes[i]);

		level = options.Level !== undefined && options.Level !== null ? Math.max(0, Math.min(8, Number(options.Level))) : codewords.length + 1 <= 40 ? 2 : codewords.length + 1 <= 160 ? 3 : codewords.length + 1 <= 320 ? 4 : codewords.length + 1 <= 863 ? 5 : 6;
		count = Math.pow(2, level + 1);

		/* The columns: the ones given, or the ones nearest to a symbol three times as wide as high. */
		columns = Number(options.Columns) || 0;

		if (!columns) {
			var best = Infinity;

			for (k = 1; k <= 30; k++) {
				var r = Math.max(3, Math.ceil((codewords.length + 1 + count) / k));
				var shape = Math.abs((17 * k + 69) / (r * 3) - 3);

				if (r <= 90 && shape < best) {
					best = shape;
					columns = k;
				}
			}
		}

		rows = Math.max(3, Math.ceil((codewords.length + 1 + count) / columns));

		if (!columns || rows > 90 || codewords.length + 1 + count > 928)
			throw new Error('Elemenx Barcodes pdf417: the text is too long for a symbol');

		pads = columns * rows - count - codewords.length - 1;
		all = [codewords.length + 1 + pads].concat(codewords);

		for (i = 0; i < pads; i++) all.push(900);

		all = all.concat(this.Pdf417Correction(all, count));

		for (i = 0; i < rows; i++) {
			var cluster = i % 3;
			var left;
			var right;
			var line = '11111111010101000';
			var x;

			if (cluster === 0) {
				left = 30 * Math.floor(i / 3) + Math.floor((rows - 1) / 3);
				right = 30 * Math.floor(i / 3) + columns - 1;
			}
			else if (cluster === 1) {
				left = 30 * Math.floor(i / 3) + level * 3 + (rows - 1) % 3;
				right = 30 * Math.floor(i / 3) + Math.floor((rows - 1) / 3);
			}
			else {
				left = 30 * Math.floor(i / 3) + columns - 1;
				right = 30 * Math.floor(i / 3) + level * 3 + (rows - 1) % 3;
			}

			line += self.Pdf417Pattern(cluster, left);

			for (x = 0; x < columns; x++) line += self.Pdf417Pattern(cluster, all[i * columns + x]);

			line += self.Pdf417Pattern(cluster, right) + '111111101000101001';

			lines.push(line);
		}

		return {Kind: 'stacked', Rows: lines, RowHeight: 3, Quiet: 2, Columns: columns, Level: level};
	},

	/* An attribute of SVG, escaped. */
	Escape: function (value) {
		return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	},

	/* The runs of dark modules of a line: [[from, length]]. */
	Runs: function (modules) {
		var runs = [];
		var i = 0;

		while (i < modules.length) {
			if (modules.charAt(i) === '1') {
				var start = i;

				while (i < modules.length && modules.charAt(i) === '1') i++;

				runs.push([start, i - start]);
			}
			else {
				i++;
			}
		}

		return runs;
	},

	/* A bar from x, y, w wide and h high, its ends round by round (0 to 1). */
	Bar: function (x, y, w, h, round) {
		var r = Math.min(w / 2, h / 2) * Math.max(0, Math.min(1, Number(round) || 0));

		return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (r ? ' rx="' + r + '" ry="' + r + '"' : '') + '/>';
	},

	SVG: function (format, text, options) {
		var settings = options || {};
		var code = this.Encode(format, text, settings);
		var dark = this.Escape(settings.Dark || '#000000');
		var light = settings.Light || '#ffffff';
		var shapes = '';
		var labels = '';
		var self = this;
		var width;
		var height;
		var quiet;
		var bars;
		var font;
		var shown;
		var qr;
		var frame;

		if (code.Kind === 'matrix') {
			qr = this.$Service('QR');
			quiet = code.Quiet === undefined ? 2 : code.Quiet;
			width = code.Modules[0].length + quiet * 2;
			height = code.Modules.length + quiet * 2;

			code.Modules.forEach(function (row, y) {
				row.forEach(function (module, x) {
					if (module)
						shapes += qr.ModulePath(x + quiet, y + quiet, settings.Shape || 'square');
				});
			});

			shapes = '<path d="' + shapes + '"/>';
		}
		else if (code.Kind === 'stacked') {
			quiet = code.Quiet === undefined ? 2 : code.Quiet;
			width = code.Rows[0].length + quiet * 2;
			height = code.Rows.length * code.RowHeight + quiet * 2;

			code.Rows.forEach(function (line, y) {
				self.Runs(line).forEach(function (run) {
					shapes += self.Bar(run[0] + quiet, y * code.RowHeight + quiet, run[1], code.RowHeight, settings.Round);
				});
			});
		}
		else {
			quiet = code.Quiet || {Left: 10, Right: 10};
			bars = Number(settings.Height) || 50;
			shown = settings.ShowText !== false && (code.Texts || []).length;
			font = Number(settings.FontSize) || 10;
			/* The bearer bars of ITF-14 frame the quiet zones too: five modules thick, outside them (regression: inside, they made the code unreadable). */
			frame = code.Bearer ? 5 : 0;
			width = frame + quiet.Left + code.Modules.length + quiet.Right + frame;
			height = bars + (shown ? font * 1.1 : 0) + (frame ? frame * 2 : 2);

			this.Runs(code.Modules).forEach(function (run) {
				var guard = code.Guards && code.Guards.charAt(run[0]) === '1';

				shapes += self.Bar(run[0] + frame + quiet.Left, frame || 1, run[1], bars + (guard && shown ? font * 0.55 : 0), settings.Round);
			});

			if (frame) {
				shapes += '<path d="M0 0h' + width + 'v' + (bars + frame * 2) + 'h-' + width + 'zM' + frame + ' ' + frame + 'v' + bars + 'h' + (width - frame * 2) + 'v-' + bars + 'z" fill-rule="evenodd"/>';
			}

			if (shown) {
				code.Texts.forEach(function (part) {
					labels += '<text x="' + (frame + quiet.Left + (part.From + part.To) / 2) + '" y="' + (bars + (frame ? frame * 2 : 2) + font * 0.95) + '" text-anchor="middle" font-family="' + self.Escape(settings.Font || 'ui-monospace, monospace') + '" font-size="' + font + '">' + self.Escape(part.Text) + '</text>';
				});
			}
		}

		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '"' + (settings.Round || (code.Kind === 'matrix' && settings.Shape && settings.Shape !== 'square') ? '' : ' shape-rendering="crispEdges"') + '>' + (light === 'transparent' ? '' : '<rect width="100%" height="100%" fill="' + this.Escape(light) + '"/>') + '<g fill="' + dark + '">' + shapes + labels + '</g></svg>';
	}
});
