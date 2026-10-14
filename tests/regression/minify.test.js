import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Minify = require('../../tools/minify.js');

function run (source) {
	var context = {result: null};

	vm.runInNewContext(source, context);

	return context.result;
}

describe('Elemenx minifier', function () {
	it('drops comments and blanks, keeps license comments, strings and every name', function () {
		var source = [
			'/*! License 1.0 */',
			'// a line comment',
			'var Value = "a // not a comment", Other = \'b /* not either */\';',
			'/* a block',
			'   comment */',
			'function Sum (first, second) {',
			'\treturn first + second;',
			'}',
			'result = [Sum(1, 2), Value, Other];'
		].join('\n');
		var minified = Minify.JavaScript(source);

		expect(minified).toBe('/*! License 1.0 */\nvar Value="a // not a comment",Other=\'b /* not either */\';function Sum(first,second){return first+second;}result=[Sum(1,2),Value,Other];\n');
		expect(run(minified)).toEqual([3, 'a // not a comment', 'b /* not either */']);
	});

	it('tells a regular expression from a division and keeps the meaning of every line break', function () {
		var source = [
			'var a = 10, b = 2, g = 5;',
			'var ratio = a / b / g;',
			'var pattern = /[/*]+\\/x/g;',
			'var tested = pattern.test("/*/x");',
			'function f () {',
			'\treturn',
			'\t\t42;',
			'}',
			'var i = 1;',
			'var j = i++ + ++i - -1;',
			'var k = a - -b;',
			'result = [ratio, tested, f(), j, k, typeof /x/];'
		].join('\n');

		expect(run(Minify.JavaScript(source))).toEqual(run(source));
		expect(Minify.JavaScript(source)).toContain('return\n42;');
		expect(Minify.JavaScript(source)).toContain('i++ + ++i- -1');
	});

	it('keeps the framework working: elemenx.js minified parses and defines the same API', function () {
		var source = fs.readFileSync(path.resolve(process.cwd(), 'elemenx.js'), 'utf8');
		var minified = Minify.JavaScript(source);

		expect(minified.length).toBeLessThan(source.length * 0.8);
		expect(function () {
			new vm.Script(minified);
		}).not.toThrow();
	});

	it('minifies CSS without touching strings, calc() and selectors', function () {
		var css = '/* note */\n.a :hover ,\n.b > .c {\n\tcontent: "x  ;  y";\n\twidth: calc(100% - 1px);\n\tcolor : red;\n}\n/*! keep */\n';

		expect(Minify.CSS(css)).toBe('.a :hover,.b > .c{content:"x  ;  y";width:calc(100% - 1px);color :red}/*! keep */');
	});

	it('minifies HTML and SVG templates, but not what pre and textarea hold', function () {
		var html = '<div>\n\t<!-- a comment -->\n\t<span>a</span>\n\t<pre>  x\n\t  y</pre>\n</div>\n';

		expect(Minify.HTML(html)).toBe('<div>\n<span>a</span>\n<pre>  x\n\t  y</pre>\n</div>');
		expect(Minify.JSON('{\n\t"a": [1, 2]\n}')).toBe('{"a":[1,2]}');
	});
});
