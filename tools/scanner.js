'use strict';

/*
 * The parts of a text of JavaScript the tools read alike (minify.js, mangle.js): where a string ends, where a regular
 * expression ends, and what may stand before a slash that starts one. Each tool keeps its own words before such a slash:
 * mangle.js reads ES5 alone, where of, yield and await are names.
 * - String(source, start): the index after the string that starts at start (its quote ' " or `; a backslash escapes).
 * - Regex(source, start): the index after the regular expression that starts at start, its flags too; a line break in it
 *   is the error 'Unterminated regular expression at <start>'.
 * - RegexAfter: the characters after which a slash starts a regular expression. Word, Start: the characters of a name,
 *   and those a name starts with.
 */

var Word = /[A-Za-z0-9_$\u0080-￿]/;
var Start = /[A-Za-z_$\u0080-￿]/;
var RegexAfter = '(,=:[!&|?{};+-*%<>~^';

function string (source, start) {
	var quote = source.charAt(start);
	var i = start + 1;

	while (i < source.length && source.charAt(i) !== quote) {
		if (source.charAt(i) === '\\')
			i++;

		i++;
	}

	return i + 1;
}

function regex (source, start) {
	var i = start + 1;
	var klass = false;
	var c;

	while (i < source.length) {
		c = source.charAt(i);

		if (c === '/' && !klass) break;

		if (c === '\n')
			throw new Error('Unterminated regular expression at ' + start);

		if (c === '[') klass = true;
		else if (c === ']') klass = false;

		i += c === '\\' ? 2 : 1;
	}

	i++;

	while (i < source.length && /[a-z]/i.test(source.charAt(i))) {
		i++;
	}

	return i;
}

module.exports = {
	String: string,
	Regex: regex,
	RegexAfter: RegexAfter,
	Word: Word,
	Start: Start
};
