import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var formats;

/* The phrase of a key in the English dictionary of ElemenxUI, as Elemenx.Locale.Text gives it. */
function text (key, params) {
	var value = key.split('.').reduce(function (node, part) {
		return node && node[part];
	}, english);

	return String(value || key).replace(/\{(\w+)\}/g, function (all, name) {
		return params && name in params ? String(params[name]) : all;
	});
}

var english = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'libraries', 'ElemenxUI', 'locales', 'en.json'), 'utf8'));

/* The FieldFormats Service of ElemenxUI, run outside a page: its definition with $OnCreate called, as Elemenx would. */
function load () {
	var definition = null;
	var context = {
		URL: URL,
		Elemenx: {
			Locale: {Text: text},
			Service: function (name, value) {
				definition = value;
			}
		}
	};

	vm.runInNewContext(fs.readFileSync(path.resolve(process.cwd(), 'libraries', 'ElemenxUI', 'services', 'FieldFormats.js'), 'utf8'), context);

	definition.$OnCreate.call(definition);

	return definition;
}

function check (name, text, options) {
	return formats.Check(name, text, options);
}

describe('ElemenxUI FieldFormats', function () {
	beforeAll(function () {
		formats = load();
	});

	it('has the formats of the text fields', function () {
		expect(formats.Names()).toEqual(['email', 'url', 'semver', 'ipv4', 'ipv6', 'uuid', 'iban', 'postal-code', 'integer', 'decimal']);
	});

	it('checks and normalizes an email and a web address', function () {
		expect(check('email', '  Ada@Example.COM ')).toEqual({Valid: true, Value: 'Ada@example.com', Message: ''});
		expect(check('email', 'ada@example').Valid).toBe(false);
		expect(check('email', 'ada@example').Message).toBe('Enter an email address, like name@example.com');
		expect(check('url', 'example.com/docs')).toEqual({Valid: true, Value: 'https://example.com/docs', Message: ''});
		expect(check('url', 'http://localhost:4173').Valid).toBe(true);
		expect(check('url', 'ftp://example.com').Valid).toBe(false);
		expect(check('url', 'https://nohost').Valid).toBe(false);
	});

	it('checks versions, addresses and identifiers', function () {
		expect(check('semver', 'v1.4.2')).toEqual({Valid: true, Value: '1.4.2', Message: ''});
		expect(check('semver', '2.0.0-rc.1+build.5').Valid).toBe(true);
		expect(check('semver', '1.02.0').Valid).toBe(false);
		expect(check('semver', '1.2').Valid).toBe(false);
		expect(check('ipv4', '192.168.0.1').Valid).toBe(true);
		expect(check('ipv4', '256.1.1.1').Valid).toBe(false);
		expect(check('ipv4', '01.1.1.1').Valid).toBe(false);
		expect(check('ipv6', '2001:DB8::1')).toEqual({Valid: true, Value: '2001:db8::1', Message: ''});
		expect(check('ipv6', '::ffff:192.168.0.1').Valid).toBe(true);
		expect(check('ipv6', '2001:db8:::1').Valid).toBe(false);
		expect(check('ipv6', '192.168.0.1').Valid).toBe(false);
		expect(check('uuid', '123E4567E89B12D3A456426614174000')).toEqual({Valid: true, Value: '123e4567-e89b-12d3-a456-426614174000', Message: ''});
		expect(check('uuid', '123e4567-e89b-12d3-a456-42661417400').Valid).toBe(false);
	});

	it('checks an IBAN by its country length and its check digits, and shows it in groups of four', function () {
		expect(check('iban', 'de89 3704 0044 0532 0130 00')).toEqual({Valid: true, Value: 'DE89370400440532013000', Message: ''});
		expect(check('iban', 'GB82WEST12345698765432').Valid).toBe(true);
		expect(check('iban', 'MD24AG000225100013104168').Valid).toBe(true);
		expect(check('iban', 'DE89370400440532013001').Message).toBe('This IBAN has a mistake: check its characters');
		expect(check('iban', 'DE8937040044053201300').Valid).toBe(false);
		expect(check('iban', 'ZZ89370400440532013000').Valid).toBe(false);
		expect(formats.Display('iban', 'DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00');
		expect(formats.IbanLength('ru')).toBe(33);
	});

	it('checks a postal code by its country, and any country by a loose rule', function () {
		expect(check('postal-code', '94043-1351', {Country: 'US'}).Valid).toBe(true);
		expect(check('postal-code', 'sw1a 1aa', {Country: 'GB'})).toEqual({Valid: true, Value: 'SW1A 1AA', Message: ''});
		expect(check('postal-code', 'MD-2001', {Country: 'md'}).Valid).toBe(true);
		expect(check('postal-code', '12345', {Country: 'RU'})).toEqual({Valid: false, Value: '12345', Message: 'Enter a postal code of RU'});
		expect(check('postal-code', 'AB 12', {Country: 'XX'}).Valid).toBe(true);
		expect(check('postal-code', 'A', {}).Valid).toBe(false);
	});

	it('checks whole and decimal numbers in their bounds; a comma is a decimal point', function () {
		expect(check('integer', '007')).toEqual({Valid: true, Value: '7', Message: ''});
		expect(check('integer', '1.5').Message).toBe('Enter a whole number');
		expect(check('integer', '-3', {Min: 0}).Message).toBe('Enter 0 or more');
		expect(check('decimal', ' 012,50 ')).toEqual({Valid: true, Value: '12.50', Message: ''});
		expect(check('decimal', '12.5', {Max: 10}).Message).toBe('Enter 10 or less');
		expect(check('decimal', '1.2.3').Valid).toBe(false);
	});

	it('keeps while typing only the characters a format holds; an empty value is valid', function () {
		expect(formats.Filter('integer', '12a-3 4')).toBe('12-34');
		expect(formats.Filter('ipv4', '192.168,0x1')).toBe('192.16801');
		expect(formats.Filter('email', 'a b@c.d')).toBe('ab@c.d');
		expect(formats.Filter('unknown', 'any text')).toBe('any text');
		expect(check('email', '   ')).toEqual({Valid: true, Value: '', Message: ''});
	});

	it('takes the formats of the Application', function () {
		formats.Register('ticket', {Filter: /[A-Z0-9-]/, Normalize: function (text) {
			return text.toUpperCase();
		}, Validate: function (value) {
			return /^[A-Z]+-\d+$/.test(value) ? '' : 'Enter a ticket, like ELX-42';
		}});

		expect(check('ticket', 'elx-42')).toEqual({Valid: true, Value: 'ELX-42', Message: ''});
		expect(formats.Find('ticket')).not.toBeNull();
		expect(function () {
			formats.Register('broken');
		}).toThrow('FieldFormats.Register expects (name, format)');
	});
});
