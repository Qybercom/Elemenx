'use strict';

/*
 * The expressions of the templates of a build, precompiled: functions written as code, so a page whose
 * Content-Security-Policy forbids eval (a browser extension) runs the templates (Elemenx.Expressions).
 *
 * The templates are the $Template strings of the definitions and the <template> elements of the page, and the strings
 * given to Elemenx.Template. The sources are the ones the runtime compiles, by the same rules: the {{ }} of texts and
 * attributes, the values of [bindings], of *directives and of the (events) that are no name of a handler ((click)="Open
 * = !Open"), and the parts of a *for (its source, or the three parts of a classic loop). A {{ escaped as \{{ is a text.
 * A text that is not an expression is left out: it would not compile at run time either.
 */

var Entities = {amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' '};

/* The text of an attribute or of a text node as the DOM gives it: its character references decoded. */
function decode (text) {
	return String(text).replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, function (all, name) {
		if (name.charAt(0) !== '#')
			return Object.prototype.hasOwnProperty.call(Entities, name.toLowerCase()) ? Entities[name.toLowerCase()] : all;

		return String.fromCharCode(name.charAt(1).toLowerCase() === 'x' ? parseInt(name.substring(2), 16) : parseInt(name.substring(1), 10));
	});
}

/* The {{ }} of a text, as the runtime finds them (Runtime.Interpolation): \{{ is a {{ of the text. */
function interpolations (text, add) {
	var pattern = /\\{\{|\{\{\s*([\s\S]+?)\s*\}\}/g;
	var match;

	while ((match = pattern.exec(text))) {
		if (match[1] !== undefined)
			add(match[1]);
	}
}

/* The sources of a *for, as the directive takes them apart. */
function loopParts (value, add) {
	var classic = value.split(';');
	var match = /^\s*([A-Za-z_$][\w$]*)\s+(of|in)\s+([\s\S]+)$/.exec(value);
	var initializer;

	if (classic.length === 3) {
		initializer = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(classic[0]);

		if (initializer)
			add(initializer[2]);

		add(classic[1]);
		add(classic[2]);

		return;
	}

	if (match)
		add(match[3]);
}

/* The attributes of a tag: [{Name, Value}], the values decoded. */
function attributes (tag) {
	var result = [];
	var pattern = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
	var match;

	while ((match = pattern.exec(tag))) {
		result.push({Name: match[1], Value: decode(match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : '')});
	}

	return result;
}

/* The sources of a template: its texts and the attributes of its tags. */
function templateSources (html, add) {
	var i = 0;
	var end;
	var tag;
	var list;
	var j;
	var name;

	html = String(html);

	while (i < html.length) {
		if (html.substr(i, 4) === '<!--') {
			end = html.indexOf('-->', i + 4);
			i = end === -1 ? html.length : end + 3;

			continue;
		}

		if (html.charAt(i) === '<' && /[A-Za-z]/.test(html.charAt(i + 1))) {
			end = tagEnd(html, i);
			tag = html.substring(i + 1, end).replace(/^[^\s>\/]*/, '');
			list = attributes(tag);
			j = 0;

			while (j < list.length) {
				name = list[j].Name;

				if (name.charAt(0) === '[' && name.charAt(1) !== '(' && name.charAt(name.length - 1) === ']') {
					add(list[j].Value);
				}
				else if (/^\([^)]+\)$/.test(name) && !/^\s*[A-Za-z_$][\w$]*\s*$/.test(list[j].Value)) {
					add(list[j].Value);
				}
				else if (name.charAt(0) === '*') {
					add(list[j].Value);

					if (name.toLowerCase() === '*for')
						loopParts(list[j].Value, add);
				}

				interpolations(list[j].Value, add);

				j++;
			}

			i = end + 1;

			continue;
		}

		end = html.indexOf('<', i + 1);

		if (end === -1)
			end = html.length;

		interpolations(decode(html.substring(i, end)), add);

		i = end;
	}
}

/* The end of a tag that starts at start: its closing bracket, past the brackets inside the quotes of its values. */
function tagEnd (html, start) {
	var i = start + 1;
	var quote = '';

	while (i < html.length) {
		if (quote) {
			if (html.charAt(i) === quote)
				quote = '';
		}
		else if (html.charAt(i) === '"' || html.charAt(i) === '\'') {
			quote = html.charAt(i);
		}
		else if (html.charAt(i) === '>') {
			return i;
		}

		i++;
	}

	return html.length;
}

/* The string a literal of JavaScript at start means (single or double quotes), and where it ends. */
function literal (source, start) {
	var quote = source.charAt(start);
	var i = start + 1;

	while (i < source.length && source.charAt(i) !== quote) {
		if (source.charAt(i) === '\\')
			i++;

		i++;
	}

	return {Value: Function('return ' + source.substring(start, i + 1) + ';')(), End: i + 1};
}

/* The string a sum of literals at start means ('<p>' + '{{a}}</p>'), or null when it is not one. */
function literalSum (source, start) {
	var value = '';
	var i = start;
	var read;

	while (true) {
		while (/\s/.test(source.charAt(i))) i++;

		if (source.charAt(i) !== '"' && source.charAt(i) !== '\'') return value === '' && i === start ? null : value;

		read = literal(source, i);
		value += read.Value;
		i = read.End;

		while (/\s/.test(source.charAt(i))) i++;

		if (source.charAt(i) !== '+') return value;

		i++;
	}
}

/* The templates in a script: the strings of $Template and the second argument of Elemenx.Template. */
function scriptTemplates (source, add) {
	var pattern = /\$Template\s*:\s*|Elemenx\.Template\(\s*(["'])(?:\\.|(?!\1).)*\1\s*,\s*/g;
	var value;

	while (pattern.exec(source)) {
		value = literalSum(source, pattern.lastIndex);

		if (value !== null)
			add(value);
	}
}

/* Whether a source compiles as an expression, as the runtime compiles it. */
function compiles (source) {
	try {
		Function('$globals', '$scope', 'with ($globals) { with ($scope || {}) { return (' + source + '); } }');

		return true;
	}
	catch (error) {
		return false;
	}
}

/*
 * The precompiled expressions of the scripts and the pages of a build: the code of an Elemenx.Expressions call, or ''
 * when the templates have no expression. scripts and pages are lists of texts.
 */
function render (scripts, pages) {
	var sources = {};
	var list;

	function add (source) {
		source = String(source).replace(/^\s+|\s+$/g, '');

		if (source && !Object.prototype.hasOwnProperty.call(sources, source) && compiles(source))
			sources[source] = true;
	}

	function template (html) {
		templateSources(html, add);
	}

	(scripts || []).forEach(function (source) {
		scriptTemplates(String(source), template);
	});

	(pages || []).forEach(template);

	list = Object.keys(sources).sort();

	if (!list.length) return '';

	return 'Elemenx.Expressions({\n' + list.map(function (source) {
		return '\t' + JSON.stringify(source) + ': function ($globals, $scope) { with ($globals) { with ($scope || {}) { return (' + source + '\n); } } }';
	}).join(',\n') + '\n});\n';
}

module.exports = {
	Render: render,
	TemplateSources: templateSources,
	ScriptTemplates: scriptTemplates
};
