import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('CodesHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* A short hash of a long string of modules, to keep a code read by a reference decoder (zxing-cpp) in a test. */
function hash (text) {
	var value = 5381;
	var i;

	for (i = 0; i < text.length; i++) value = ((value * 33) ^ text.charCodeAt(i)) >>> 0;

	return value.toString(36);
}

function flat (code) {
	if (code.Kind === 'linear') return code.Modules;

	if (code.Kind === 'matrix')
		return code.Modules.map(function (row) {
			return row.map(function (dark) {
				return dark ? 1 : 0;
			}).join('');
		}).join('/');

	return code.Rows.join('/');
}

/*
 * The codes of these texts were drawn, and read back by zxing-cpp, when the formats were written: the modules stay the
 * ones that read (the long ones by their hash).
 */
var Read = [
	['code128', 'Hello, World!', '1101001000011000101000101100100001100101000011001010000100011110101011001110011011001100111010001101000111101010010011110110010100001000010011011001101100110010100001100011101011'],
	['code128', '0123456789012', '110100111001100110110011101101110101110110001000010110011011011110110011011001011110111011001110010101110111101100011101011'],
	['code128', 'AB1234567890cd', '110100100001010001100010001011000101110111101011001110010001011000111000101101100001010011011110110101111011101000010110010000100110100010011001100011101011'],
	['ean13', '400638133393', '10100011010100111010111101111010001001011001101010100001010000101000010111010010000101100110101'],
	['ean8', '9638507', '1010001011010111101111010110111010101001110111001010001001011100101'],
	['upca', '03600029145', '10100011010111101010111100011010001101000110101010110110011101001100110101110010011101101100101'],
	['code39', 'CODE 39-TEST.$/+%', 'xgbqz8'],
	['itf14', '1540014128876', '101011100010100010111010101110001000111010001011101110100010001011101011100010001110101000111011101010111000100010001110001110101011101'],
	['datamatrix', 'Hello DataMatrix', 'fayakr'],
	['datamatrix', 'Привет, мир ✓', '4cjcaz'],
	['datamatrix', 'The quick brown fox jumps over the lazy dog, 0123456789. '.repeat(8), '1mchnpn'],
	['pdf417', 'Hello PDF417', '19snogb'],
	['pdf417', 'Привет, мир ✓', '1tbyns5']
];

describe('Contract: the barcodes and the QR codes of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Barcode', 'QRCode', 'service:Barcodes', 'service:QR', 'service:Platform']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('Barcodes writes each format as the reference decoder read it, checks the digits, and tells what a format cannot write', function () {
		var barcodes = Elemenx.Service('Barcodes');

		expect(barcodes.Formats()).toEqual(['code128', 'ean13', 'ean8', 'upca', 'code39', 'itf14', 'datamatrix', 'pdf417']);

		Read.forEach(function (entry) {
			var modules = flat(barcodes.Encode(entry[0], entry[1]));

			expect(modules.length < 200 && entry[0] !== 'code39' ? modules : hash(modules), entry[0] + ' ' + entry[1].slice(0, 20)).toBe(entry[2]);
		});

		/* The check digit added, or checked; the size of a DataMatrix the least it fits. */
		expect(barcodes.Encode('ean13', '4006381333931').Modules).toBe(barcodes.Encode('ean13', '400638133393').Modules);
		expect(barcodes.Encode('datamatrix', 'A').Size).toBe(10);
		expect(barcodes.Encode('datamatrix', '123456789012345678901234567890').Size).toBe(18);
		expect(barcodes.Encode('pdf417', 'ABC', {Level: 0}).Level).toBe(0);
		expect(barcodes.Encode('pdf417', 'ABC', {Columns: 3}).Columns).toBe(3);

		expect(function () {
			barcodes.Encode('ean13', '4006381333932');
		}).toThrow('Elemenx Barcodes ean13: the check digit of 4006381333932 is 1');
		expect(function () {
			barcodes.Encode('ean8', '12');
		}).toThrow('Elemenx Barcodes ean8 takes 7 or 8 digits: 12');
		expect(function () {
			barcodes.Encode('code39', 'lower');
		}).not.toThrow();
		expect(function () {
			barcodes.Encode('code39', 'a_b');
		}).toThrow('Elemenx Barcodes code39 cannot write _');
		expect(function () {
			barcodes.Encode('code128', 'Привет');
		}).toThrow('Elemenx Barcodes code128 takes ASCII only');
		expect(function () {
			barcodes.Encode('aztec', 'x');
		}).toThrow('Elemenx Barcodes does not know the format aztec');
	});

	it('Barcodes takes a format of its own, and draws the guards of EAN longer, the text under the bars and the frame of ITF-14', function () {
		var barcodes = Elemenx.Service('Barcodes');
		var ean;
		var itf;

		barcodes.Register('dots', {Label: 'Dots', Encode: function (text) {
			return {Kind: 'linear', Modules: text.split('').map(function () {
				return '10';
			}).join(''), Texts: [{Text: text, From: 0, To: text.length * 2}], Quiet: {Left: 2, Right: 2}};
		}});

		expect(barcodes.Formats()).toContain('dots');
		expect(barcodes.SVG('dots', 'abc', {ShowText: false})).toContain('<rect x="2" y="1" width="1" height="50"/><rect x="4"');

		ean = barcodes.SVG('ean13', '400638133393', {Height: 60, FontSize: 10});

		/* The guards go down into the line of the digits; the first digit is in the quiet zone on the left. */
		expect(ean).toContain('height="65.5"');
		expect(ean).toContain('>4</text>');
		expect(ean).toContain('>006381</text>');
		expect(ean).toContain('>333931</text>');

		itf = barcodes.SVG('itf14', '1540014128876');

		expect(itf).toContain('fill-rule="evenodd"');
		expect(barcodes.SVG('itf14', '1540014128876', {Bearer: false})).not.toContain('fill-rule="evenodd"');
		expect(barcodes.SVG('datamatrix', 'dots', {Shape: 'dots'})).toContain('a0.45 0.45');
	});

	it('Barcode draws its format at its sizes, emits why it cannot, and gives its picture as an SVG, a PNG and a download', async function () {
		var errors = [];
		var saved = [];
		var native = Elemenx.Service('Platform');
		var save = native.Save;
		var host = mount('<div><Barcode Format="ean13" Value="400638133393" Module="3" Height="90" /><Barcode Format="ean13" Value="123" (error)="Failed" /></div>', {
			Failed: function (error) {
				errors.push(error.message);
			}
		});
		var svg;
		var png = null;
		var instance;

		await tick(20);

		svg = host.$Element().querySelector('.elemenx-barcode svg');

		/* 95 modules and the quiet zones (11 and 7), 3 pixels each. */
		expect(svg.getAttribute('width')).toBe(String((11 + 95 + 7) * 3));
		expect(host.$Element().querySelector('.elemenx-barcode').getAttribute('aria-label')).toBe('Barcode: 400638133393');
		expect(errors).toEqual(['Elemenx Barcodes ean13 takes 12 or 13 digits: 123']);

		/* Its methods, on an instance. */
		instance = Elemenx.Component('Barcode')({Value: 'ELEMENX', Format: 'code128'});

		owned.push(instance);

		document.getElementById('mount').appendChild(instance.$Element());

		await tick(20);

		expect(instance.SVG()).toContain('<svg');

		instance.Png(2, function (error, url) {
			png = error ? error.message : url;
		});

		expect(await waitFor(function () {
			return png;
		}, 4000)).toMatch(/^data:image\/png;base64,/);

		native.Save = function (options, callback) {
			saved.push(options.Name + ' ' + (options.Text ? 'text' : 'data'));

			callback(null, null);
		};

		try {
			instance.Download('label', 'svg');
			instance.Download('label.png');

			expect(await waitFor(function () {
				return saved.length === 2;
			}, 4000)).toBe(true);
			expect(saved).toEqual(['label.svg text', 'label.png data']);
		}
		finally {
			native.Save = save;
		}
	});

	it('QRCode takes a style: its modules, eyes, gradient and logo (the level H then), and saves its whole style as a PNG and an SVG', async function () {
		var qr = Elemenx.Service('QR');
		var logo = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#e33"/></svg>');
		var plain = qr.SVG('https://elemenx.dev', {});
		var styled = qr.SVG('https://elemenx.dev', {Modules: 'dots', Eyes: 'leaf', EyeColor: '#c2185b', Gradient: {From: '#1a237e', To: '#00897b', Angle: 45}, Logo: logo, Id: 'g1'});
		var instance;
		var png = null;
		var saved = [];
		var native = Elemenx.Service('Platform');
		var save = native.Save;

		/* The plain code is the one it always was: squares, the eyes of its modules, crisp. */
		expect(plain).toContain('shape-rendering="crispEdges"');
		expect(plain).not.toContain('<image');

		expect(styled).toContain('<linearGradient id="g1"');
		expect(styled).toContain('fill="url(#g1)"');
		expect(styled).toContain('fill="#c2185b"');
		expect(styled).toContain('<image href="' + logo.replace(/&/g, '&amp;') + '"');
		expect(styled).toContain('a0.45 0.45');

		/* A logo takes the level H: the code of the same text is bigger. */
		expect(qr.LevelFor({Logo: logo})).toBe('H');
		expect(qr.LevelFor({Logo: logo, Level: 'Q'})).toBe('Q');
		expect(qr.LevelFor({Level: 'L'})).toBe('L');
		expect(qr.SVG('x', {Text: 'PAY', Id: 'g2'})).toContain('>PAY</text>');
		expect(qr.SVG('x', {Light: 'transparent'})).not.toContain('<rect');

		instance = Elemenx.Component('QRCode')({Value: 'https://elemenx.dev', Modules: 'rounded', Eyes: 'circle', Logo: logo, Size: 120});

		owned.push(instance);

		document.getElementById('mount').appendChild(instance.$Element());

		await tick(20);

		expect(instance.$Element().querySelector('svg image')).toBeTruthy();
		expect(instance.Image(60)).toMatch(/^data:image\/png;base64,/);

		instance.Png(200, function (error, url) {
			png = error ? error.message : url;
		});

		expect(await waitFor(function () {
			return png;
		}, 4000)).toMatch(/^data:image\/png;base64,/);

		native.Save = function (options, callback) {
			saved.push(options.Name + ' ' + (options.Text ? 'text' : 'data'));

			callback(null, null);
		};

		try {
			instance.Download('ticket', 'svg');
			instance.Download('ticket');

			expect(await waitFor(function () {
				return saved.length === 2;
			}, 4000)).toBe(true);
			expect(saved).toEqual(['ticket.svg text', 'ticket.png data']);
		}
		finally {
			native.Save = save;
		}
	});
});
