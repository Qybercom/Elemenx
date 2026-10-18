import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var syntax;

/* The Syntax Service of ElemenxUI, run outside a page: its definition with $OnCreate called, as Elemenx would. */
function load () {
	var definition = null;
	var context = {
		Elemenx: {
			Service: function (name, value) {
				definition = value;
			}
		}
	};

	vm.runInNewContext(fs.readFileSync(path.resolve(process.cwd(), 'libraries', 'ElemenxUI', 'services', 'Syntax.js'), 'utf8'), context);

	definition.$OnCreate.call(definition);

	return definition;
}

/* The tokens of a text with a type, as [type, text]. */
function typed (text, language) {
	return syntax.Tokens(text, language).filter(function (token) {
		return token.Type;
	}).map(function (token) {
		return [token.Type, token.Text];
	});
}

describe('ElemenxUI Syntax', function () {
	beforeAll(function () {
		syntax = load();
	});

	it('covers the whole text with its tokens in every language', function () {
		var samples = {
			javascript: '// note\nconst re = /a[/]b/g, s = `x ${y}`;\nfunction add (a, b) { return a / b / 2; }\n/* open',
			typescript: 'interface Point { x: number; readonly y?: string }\nlet p: Point = <Point>{x: 1};',
			json: '{"name": "elemenx", "count": -1.5e3, "on": true, "list": [null]}',
			html: '<!DOCTYPE html>\n<div class="a" data-x=\'1\' hidden>{{Count + 1}} &amp; <br /></div>\n<script>if (a < b) go();</script>\n<style>a:hover { color: red; }</style>\n<!-- end',
			css: '@media (max-width: 600px) {\n\t.a > b:hover, #id::before { color: #fff !important; margin: -1.5em 0; --gap: calc(2px + 1%); }\n}',
			markdown: '# Title\n\nSome **bold**, *em* and `code` [link](http://a.b).\n\n```js\nvar a = 1;\n```\n> quote\n- item',
			sql: "SELECT id, name FROM users WHERE email LIKE '%@a.b' AND age >= 18 -- adults\nORDER BY name;",
			python: '@cached\ndef area(r: float) -> float:\n\t"""Doc."""\n\treturn 3.14 * r ** 2  # pi\nprint(f"{area(2)}", None)',
			shell: '#!/bin/bash\nfor f in *.txt; do\n\techo "$f" ${HOME} --verbose # note\ndone && exit 0',
			text: 'plain <text> "here"'
		};

		Object.keys(samples).forEach(function (language) {
			expect(syntax.Tokens(samples[language], language).map(function (token) {
				return token.Text;
			}).join('')).toBe(samples[language]);
		});
	});

	it('reads JavaScript: comments, strings, regular expressions, numbers, keywords and calls', function () {
		var tokens = typed("// a\nvar x = /b+/gi; if (n === 0x1F) go('c', 1.5e3, 10n); a / b / c;", 'js');

		expect(tokens).toContainEqual(['comment', '// a']);
		expect(tokens).toContainEqual(['keyword', 'var']);
		expect(tokens).toContainEqual(['regex', '/b+/gi']);
		expect(tokens).toContainEqual(['number', '0x1F']);
		expect(tokens).toContainEqual(['number', '1.5e3']);
		expect(tokens).toContainEqual(['number', '10n']);
		expect(tokens).toContainEqual(['function', 'go']);
		expect(tokens).toContainEqual(['string', "'c'"]);
		expect(tokens.filter(function (token) {
			return token[0] === 'regex';
		}).length).toBe(1);
	});

	it('reads a block comment and a string left open up to the end, as they are typed', function () {
		expect(typed('a /* open\nstill', 'javascript')).toContainEqual(['comment', '/* open\nstill']);
		expect(typed("say('open", 'javascript')).toContainEqual(['string', "'open"]);
	});

	it('reads the script and the style of HTML in their languages, and the tags and attributes', function () {
		var tokens = typed('<p class="x">Hi</p><script>let a = 1;</script><style>b { color: red; }</style>', 'html');

		expect(tokens).toContainEqual(['tag', '<p']);
		expect(tokens).toContainEqual(['attribute', 'class']);
		expect(tokens).toContainEqual(['string', '"x"']);
		expect(tokens).toContainEqual(['keyword', 'let']);
		expect(tokens).toContainEqual(['property', 'color']);
		expect(tokens).toContainEqual(['selector', 'b ']);
	});

	it('reads the code of a fenced block of Markdown in the language it names', function () {
		var tokens = typed('# Head\n\n```python\ndef f():\n\tpass\n```\n', 'markdown');

		expect(tokens).toContainEqual(['heading', '# Head']);
		expect(tokens).toContainEqual(['keyword', 'def']);
		expect(tokens).toContainEqual(['meta', 'python\n']);
	});

	it('splits the tokens into lines, one array for each line', function () {
		var lines = syntax.Lines('/* a\nb */ x\n\n', 'javascript');

		expect(lines.length).toBe(4);
		expect(lines[0]).toEqual([{Type: 'comment', Text: '/* a'}]);
		expect(lines[1][0]).toEqual({Type: 'comment', Text: 'b */'});
		expect(lines[2]).toEqual([]);
	});

	it('escapes the HTML it returns', function () {
		expect(syntax.HTML('a < "b" & c', 'text')).toBe('a &lt; "b" &amp; c');
		expect(syntax.HTML("'<b>'", 'javascript')).toBe('<span class="elemenx-syntax-string">\'&lt;b&gt;\'</span>');
	});

	it('finds languages by their aliases and takes new ones', function () {
		expect(syntax.Find('TS').Name).toBe('typescript');
		expect(syntax.Find('bash').Name).toBe('shell');
		expect(syntax.Find('nope')).toBe(null);
		expect(syntax.Languages()).not.toContain('html-tag');

		syntax.Register('ini', {Aliases: ['conf'], Comment: {Line: ';'}, Rules: [['comment', /;[^\n]*/], ['property', /^[\w.]+(?=\s*=)/m], ['meta', /^\[[^\]\n]*\]/m]]});

		expect(typed('[main]\nkey = 1 ; note', 'conf')).toEqual([['meta', '[main]'], ['property', 'key'], ['comment', '; note']]);
		expect(syntax.Languages()).toContain('ini');
	});
});
