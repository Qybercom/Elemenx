import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Scanner = require('../../tools/scanner.js');

/*
 * Regression: minify.js and mangle.js each read the strings and the regular expressions of a source their own way (a fix
 * in one was not in the other). One scanner now.
 */
describe('Regression: the scanner of the tools, the strings and the regular expressions of JavaScript', function () {
	it('ends a string after its quote, past escaped ones; a regular expression after its flags, a slash in a class kept', function () {
		var text = 'var a = "x\\"y" + \'z\';';
		var start = text.indexOf('"');
		var pattern = 'x = /[/\\]]+\\/a/gi.test(y);';
		var at = pattern.indexOf('/');

		expect(text.substring(start, Scanner.String(text, start))).toBe('"x\\"y"');
		expect(text.substring(text.indexOf('\''), Scanner.String(text, text.indexOf('\'')))).toBe('\'z\'');
		expect(pattern.substring(at, Scanner.Regex(pattern, at))).toBe('/[/\\]]+\\/a/gi');
		expect(function () {
			Scanner.Regex('a = /abc\nd/', 4);
		}).toThrow('Unterminated regular expression at 4');
		expect(Scanner.RegexAfter.indexOf('(')).not.toBe(-1);
		expect(Scanner.Word.test('$')).toBe(true);
		expect(Scanner.Start.test('1')).toBe(false);
	});
});
