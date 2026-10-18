import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import Expressions from '../../tools/expressions.js';
import Builder from '../../tools/builder.js';

/* The sources the builder precompiles are the ones the runtime compiles, and nothing that would not compile. */
describe('Builder: precompiled expressions', function () {
	function sources (scripts, pages) {
		var code = Expressions.Render(scripts, pages);
		var found = {};

		new Function('Elemenx', code)({Expressions: function (map) {
			found = map;
		}});

		return Object.keys(found).sort();
	}

	it('takes the {{ }} of texts and attributes, [bindings], *directives and the parts of *for, decoded', function () {
		expect(sources([
			"Elemenx.Component('A', {$Template: '<p [class]=\"[a, b]\" *for=\"x of list\" title=\"{{t}}\">{{x.Name}} &amp; {{ y &gt; 2 }}</p>' + '<i *for=\"i = 0; i < n; i++\" (click)=\"Go\" [(value)]=\"v\" #ref></i>'});",
			"Elemenx.Template('row', \"<td>{{ row.Cell }}</td>\");"
		], ['<template id="t"><b *if="ok">{{ $T(\'a.b\') }}</b></template>'])).toEqual(['$T(\'a.b\')', '0', '[a, b]', 'i < n', 'i++', 'list', 'ok', 'row.Cell', 't', 'x.Name', 'y > 2']);
	});

	it('leaves out what is not an expression, and gives nothing for templates without one', function () {
		expect(sources(["Elemenx.Component('B', {$Template: '<p *for=\"x of\">{{ ) }}</p>'});"], [])).toEqual([]);
		expect(Expressions.Render(["Elemenx.Component('C', {$Template: '<p>Plain</p>'});"], [])).toBe('');
	});

	it('puts them before the bundle of a build with precompile', function () {
		var project = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
		var target = path.join(project, '..', 'single-precompile-output');
		var html;

		try {
			Builder.Build(project, {single: true, out: '../single-precompile-output', precompile: true});

			html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(html).toContain('Elemenx.Expressions({');
			expect(html.indexOf('Elemenx.Expressions({')).toBeLessThan(html.indexOf('Elemenx.Bundle({'));

			Builder.Build(project, {single: true, out: '../single-precompile-output'});

			expect(fs.readFileSync(path.join(target, 'index.html'), 'utf8')).not.toContain('Elemenx.Expressions(');
		}
		finally {
			fs.rmSync(target, {recursive: true, force: true});
		}
	});
});
