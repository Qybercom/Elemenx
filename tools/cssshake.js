'use strict';

/*
 * Leaves out of a stylesheet the rules no element of a build can match: a selector goes when one of its classes is
 * named nowhere in the code of the build (the framework, the templates and the code of its Components, Services and
 * Directives, the Application, its page), and a rule when all of its selectors go. A class is named when it is a word
 * of the code, or when a string of the code is its start up to a hyphen ('value-' + placement makes value-below): a
 * class made of parts stays. A start that many classes share (elemenx-, of an id) tells nothing and does not count. What a class inside :not(), :is(), :where() or :has() matches is not needed by the selector (a
 * :not() of an unused class matches every element). @media, @supports, @container and @layer are shaken inside;
 * @keyframes, @font-face and the other at-rules stay as they are. A stylesheet is minified first (tools/minify.js).
 *
 * Shake(css, code) returns {CSS, Removed} (the number of selectors left out).
 */

/* A start shared by more classes than these is a namespace, not a part of a class. */
var Generic = 40;

/*
 * The words of the code (letters, digits, _ and -), and the words of its strings that end with a hyphen (not the ones
 * of an operator, c--, or of a class of characters, a-z0-9-): the starts of the classes it makes of parts.
 */
function vocabulary (code, all) {
	var words = {};
	var starts = {};

	String(code).split(/[^A-Za-z0-9_-]+/).forEach(function (word) {
		if (word)
			words[word] = true;
	});

	(String(code).match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g) || []).forEach(function (text) {
		text.split(/[^A-Za-z0-9_-]+/).forEach(function (word) {
			if (/^[A-Za-z][\w-]*-$/.test(word) && all.filter(function (name) {
				return name.indexOf(word) === 0;
			}).length <= Generic)
				starts[word] = true;
		});
	});

	return {Words: words, Starts: Object.keys(starts)};
}

function named (name, known) {
	var i = 0;

	if (known.Words[name]) return true;

	while (i < known.Starts.length) {
		if (name.indexOf(known.Starts[i]) === 0) return true;

		i++;
	}

	return false;
}

/* The classes a selector needs: the ones out of its functional pseudo-classes (:not(.a) needs no a). */
function classes (selector) {
	var plain = '';
	var depth = 0;
	var i = 0;
	var c;
	var result = [];
	var pattern = /\.(-?[A-Za-z_][\w-]*)/g;
	var match;

	while (i < selector.length) {
		c = selector.charAt(i);

		if (c === '(') depth++;
		else if (c === ')') depth--;
		else if (depth === 0) plain += c;

		/* An attribute selector ([class~="x"], [href$=".pdf"]) holds no class of the selector. */
		if (c === '[' && depth === 0) {
			while (i < selector.length && selector.charAt(i) !== ']') {
				i++;
			}

			plain += ' ';
		}

		i++;
	}

	while ((match = pattern.exec(plain))) {
		result.push(match[1]);
	}

	return result;
}

/* The selectors of a list, split at the commas out of parentheses and brackets. */
function selectors (list) {
	var result = [];
	var depth = 0;
	var start = 0;
	var i = 0;
	var c;

	while (i < list.length) {
		c = list.charAt(i);

		if (c === '(' || c === '[') {
			depth++;
		}
		else if (c === ')' || c === ']') {
			depth--;
		}
		else if (c === ',' && depth === 0) {
			result.push(list.substring(start, i));

			start = i + 1;
		}

		i++;
	}

	result.push(list.substring(start));

	return result;
}

/* The end of a block that opens at start (its {), past the strings and the blocks inside it. */
function blockEnd (css, start) {
	var depth = 0;
	var i = start;
	var c;
	var quote;

	while (i < css.length) {
		c = css.charAt(i);

		if (c === '"' || c === '\'') {
			quote = c;
			i++;

			while (i < css.length && css.charAt(i) !== quote) {
				if (css.charAt(i) === '\\')
					i++;

				i++;
			}
		}
		else if (c === '{') {
			depth++;
		}
		else if (c === '}') {
			depth--;

			if (depth === 0) return i;
		}

		i++;
	}

	return css.length - 1;
}

var Nested = /^@(media|supports|container|layer|document)\b/i;

function shakeRules (css, known, counter) {
	var out = '';
	var i = 0;
	var open;
	var end;
	var head;
	var body;
	var kept;
	var inner;

	while (i < css.length) {
		open = css.indexOf('{', i);

		/* What is left with no block: an @import, an @charset, a @layer list. */
		if (open === -1) {
			out += css.substring(i);

			break;
		}

		head = css.substring(i, open);
		end = blockEnd(css, open);
		body = css.substring(open + 1, end);

		/* A statement at-rule before the block (@import ...;) stays, and the rule starts after it. */
		if (/^\s*@[^{]*;/.test(head)) {
			out += head.substring(0, head.lastIndexOf(';') + 1);
			head = head.substring(head.lastIndexOf(';') + 1);
		}

		if (/^\s*@/.test(head)) {
			if (Nested.test(head.replace(/^\s+/, ''))) {
				inner = shakeRules(body, known, counter);

				if (inner.replace(/\s+/g, ''))
					out += head + '{' + inner + '}';
			}
			else {
				out += head + '{' + body + '}';
			}
		}
		else {
			kept = selectors(head).filter(function (selector) {
				var needed = classes(selector).every(function (name) {
					return named(name, known);
				});
				if (!needed)
					counter.Removed++;

				return needed;
			});

			if (kept.length)
				out += kept.join(',') + '{' + body + '}';
		}

		i = end + 1;
	}

	return out;
}

function Shake (css, code) {
	var counter = {Removed: 0};
	var all = {};
	var result;

	(String(css).match(/\.-?[A-Za-z_][\w-]*/g) || []).forEach(function (name) {
		all[name.substring(1)] = true;
	});

	result = shakeRules(String(css), vocabulary(code, Object.keys(all)), counter);

	return {CSS: result, Removed: counter.Removed};
}

/*
 * The symbols of a sprite of icons (<symbol id="name">) the code of a build names, by the same rules as the classes:
 * an icon is drawn by its name (<Icon Name="save" />, 'weather:rain'), which is a word of the code or starts with one
 * of its strings ('chevron-' + side). A build that lists the icons of a set (the Names or the Load of the Icons
 * Service, whose callback has their names: a picker, a gallery) keeps all of them. Returns {SVG, Removed}.
 */
function Sprite (svg, code) {
	var removed = 0;
	var ids = [];
	var known;
	var result;

	if (/(Icons['"]\)|\bicons)\s*\.\s*(Names|Load)\s*\(/i.test(code)) return {SVG: svg, Removed: 0};

	String(svg).replace(/<symbol\b[^>]*\bid="([^"]+)"/g, function (all, id) {
		ids.push(id);

		return all;
	});

	known = vocabulary(code, ids);
	result = String(svg).replace(/<symbol\b[^>]*\bid="([^"]+)"[\s\S]*?<\/symbol>\s*/g, function (symbol, id) {
		if (named(id, known)) return symbol;

		removed++;

		return '';
	});

	return {SVG: result, Removed: removed};
}

module.exports = {
	Shake: Shake,
	Sprite: Sprite
};
