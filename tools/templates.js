'use strict';

/*
 * The <template id> of a page as <script type="text/html" id>, so that the text of a template reaches Elemenx as it
 * was written. The HTML parser reads a <template> by the rules of HTML: it writes the names of its elements in lower
 * case (<Table> becomes the table of HTML, and the parser moves what a table may not hold out of it), <TextArea /> takes
 * the rest of the page as its text, a <Select> drops what is not an option. The text of a script is not parsed.
 *
 * The development server, the production server and the builds write the pages so. A template that holds </script
 * (a script may not), one of a shadow root (shadowrootmode) and one with no id stay as they are.
 */

/* What the page holds outside its templates: comments and the text of scripts and styles are skipped. */
var Outside = /<!--[\s\S]*?(?:-->|$)|<(script|style|textarea)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)|<template\b([^>]*)>/gi;

/* Inside a template only its own nested templates count; what it holds is text, a <TextArea /> of it as well. */
var Inside = /<!--[\s\S]*?(?:-->|$)|<template\b[^>]*>|<\/template\s*>/gi;

/* The end of the template whose content starts at from: {Index, Length} of its </template>, or null. */
function closing (text, from) {
	var depth = 1;
	var match;

	Inside.lastIndex = from;

	while ((match = Inside.exec(text))) {
		if (match[0].charAt(1) === '!') continue;

		if (match[0].charAt(1) === '/') {
			depth--;

			if (!depth)
				return {Index: match.index, Length: match[0].length};
		}
		else {
			depth++;
		}
	}

	return null;
}

function page (html) {
	var text = String(html);
	var result = '';
	var last = 0;
	var match;
	var attributes;
	var end;
	var content;

	if (!/<template\b/i.test(text)) return text;

	Outside.lastIndex = 0;

	while ((match = Outside.exec(text))) {
		attributes = match[2];

		if (attributes === undefined || !/\sid\s*=/i.test(attributes) || /\sshadowroot/i.test(attributes)) continue;

		end = closing(text, Outside.lastIndex);

		if (!end) break;

		content = text.substring(Outside.lastIndex, end.Index);

		if (!/<\/script/i.test(content)) {
			result += text.substring(last, match.index) + '<script type="text/html"' + attributes + '>' + content + '</script>';
			last = end.Index + end.Length;
		}

		Outside.lastIndex = end.Index + end.Length;
	}

	return result + text.substring(last);
}

module.exports = {
	Page: page
};
