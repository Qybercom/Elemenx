'use strict';

/*
 * A minifier with no dependencies and no renaming: comments and the blanks that carry no meaning go, every name stays,
 * so nothing of a public API can break. Comments that start with /*! (licenses) stay. JavaScript keeps a line break
 * where a statement could end at it, so the automatic semicolons of the source keep their meaning.
 */

var Word = /[A-Za-z0-9_$\u0080-￿]/;

/*
 * After these characters a line break cannot end a statement: it goes. A closing parenthesis is among them because
 * the sources end every statement with a semicolon (the lint checks it): after one, a line break is the body of an
 * if, a while or a for on its own line.
 */
var Open = '{([,;:=?&|+-*/%<>!~^)';

/* Before these characters a line break cannot start a statement: it goes. */
var Close = '})],;.:?';

/* After these characters, and after these words, a slash starts a regular expression. */
var RegexAfter = '(,=:[!&|?{};+-*%<>~^';
var RegexWords = ['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await'];

function scanString (source, start) {
	var quote = source.charAt(start);
	var i = start + 1;

	while (i < source.length && source.charAt(i) !== quote) {
		if (source.charAt(i) === '\\')
			i++;

		i++;
	}

	return i + 1;
}

function scanRegex (source, start) {
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

function JavaScript (source) {
	var out = [];
	var tail = '';
	var significant = '';
	var blank = '';
	var word = '';
	var i = 0;
	var c;
	var end;
	var token;

	source = String(source).replace(/\r\n?/g, '\n');

	/* Adds text to the output; tail is its last character, significant the last one that is not a line break. */
	function put (text) {
		out.push(text);

		tail = text.charAt(text.length - 1);

		if (text.replace(/\n+$/, ''))
			significant = text.replace(/\n+$/, '').charAt(text.replace(/\n+$/, '').length - 1);
	}

	/* The separator between the output so far and the next token, from the blanks between them. */
	function emit (text) {
		var next = text.charAt(0);
		var merges = (Word.test(tail) && Word.test(next)) || ((tail === '+' || tail === '-') && tail === next) || (tail === '/' && (next === '/' || next === '*'));

		/* After a license comment the output ends with its line break, which stays. */
		if (tail === '\n') {
			blank = '';
		}
		else if (blank && tail) {
			if (blank.indexOf('\n') !== -1 && Open.indexOf(tail) === -1 && Close.indexOf(next) === -1 && tail !== '}') put('\n');
			else if (merges) put(' ');
		}
		else if (merges && tail) {
			put(' ');
		}

		put(text);

		blank = '';
	}

	function regexAllowed () {
		if (!significant) return true;

		if (Word.test(significant))
			return RegexWords.indexOf(word) !== -1;

		return RegexAfter.indexOf(significant) !== -1;
	}

	while (i < source.length) {
		c = source.charAt(i);

		if (c === ' ' || c === '\t' || c === '\n' || c === '\f' || c === '\v' || c === ' ' || c === '﻿') {
			blank += c;
			i++;
		}
		else if (c === '/' && source.charAt(i + 1) === '/') {
			end = source.indexOf('\n', i);
			end = end === -1 ? source.length : end;
			blank += '\n';
			i = end;
		}
		else if (c === '/' && source.charAt(i + 1) === '*') {
			end = source.indexOf('*/', i + 2);

			if (end === -1)
				throw new Error('Unterminated comment at ' + i);

			token = source.substring(i, end + 2);

			if (token.charAt(2) === '!') {
				emit(token);

				put('\n');
			}
			else {
				blank += token.indexOf('\n') !== -1 ? '\n' : ' ';
			}

			i = end + 2;
		}
		else if (c === '"' || c === '\'' || c === '`') {
			end = scanString(source, i);

			emit(source.substring(i, end));

			word = '';
			i = end;
		}
		else if (c === '/' && regexAllowed()) {
			end = scanRegex(source, i);

			emit(source.substring(i, end));

			word = '';
			i = end;
		}
		else if (Word.test(c)) {
			end = i;

			while (end < source.length && (Word.test(source.charAt(end)) || (source.charAt(end) === '.' && /[0-9]/.test(source.charAt(i))))) {
				end++;
			}

			token = source.substring(i, end);

			emit(token);

			word = token;
			i = end;
		}
		else if ((c === '+' || c === '-') && source.charAt(i + 1) === c) {
			emit(c + c);

			word = '';
			i += 2;
		}
		else {
			emit(c);

			word = '';
			i++;
		}
	}

	return out.join('') + '\n';
}

/* CSS: no comments (but /*!), single blanks, none around braces, semicolons and commas, nor after a colon. */
function CSS (source) {
	var parts = [];
	var i = 0;
	var c;
	var end;
	var text = '';

	source = String(source).replace(/\r\n?/g, '\n');

	function flush () {
		parts.push(text.replace(/\s+/g, ' ').replace(/\s*([{};,])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}'));

		text = '';
	}

	while (i < source.length) {
		c = source.charAt(i);

		if (c === '/' && source.charAt(i + 1) === '*') {
			end = source.indexOf('*/', i + 2);
			end = end === -1 ? source.length : end + 2;

			if (source.charAt(i + 2) === '!') {
				flush();

				parts.push(source.substring(i, end) + '\n');
			}
			else {
				text += ' ';
			}

			i = end;
		}
		else if (c === '"' || c === '\'') {
			end = scanString(source, i);

			flush();

			parts.push(source.substring(i, end));

			i = end;
		}
		else {
			text += c;
			i++;
		}
	}

	flush();

	return parts.join('').replace(/^\s+|\s+$/g, '');
}

/*
 * HTML and SVG: no comments, and a run of blanks with a line break in it becomes one line break (a template renders it
 * as the space it was); the content of pre, textarea, script and style stays as it is.
 */
function HTML (source) {
	var kept = [];

	return String(source).replace(/\r\n?/g, '\n')
		.replace(/<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi, function (block) {
			kept.push(block);

			return '\u0000' + (kept.length - 1) + '\u0000';
		})
		.replace(/<!--(?!elemenx)[\s\S]*?-->/g, '')
		.replace(/[ \t]*\n\s*/g, '\n')
		.replace(/^\n+|\n+$/g, '')
		.replace(/\u0000(\d+)\u0000/g, function (all, index) {
			return kept[Number(index)];
		});
}

function JSONText (source) {
	return JSON.stringify(JSON.parse(source));
}

module.exports = {
	JavaScript: JavaScript,
	CSS: CSS,
	HTML: HTML,
	JSON: JSONText
};
