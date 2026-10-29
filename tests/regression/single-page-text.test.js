import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var temporary = [];

/* Builds with the output of the builder kept quiet. */
function build (folder, options) {
	var original = process.stdout.write;

	process.stdout.write = function () {
		return true;
	};

	try {
		Builder.Build(folder, Object.assign({out: 'dist'}, options));
	}
	finally {
		process.stdout.write = original;
	}

	return fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8');
}

/*
 * Code that writes a page of its own (a page to print: its </head>, its <body>) goes into the page of a build in one
 * file as it is: the styles of the Libraries and the splash go into the page itself, not into the text of that code.
 */
describe('Regression: a build in one file with code that holds the text of a page', function () {
	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('keeps the scripts whole and puts the styles and the splash into the page', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-single-text-'));
		var page;
		var scripts;

		temporary.push(folder);

		fs.cpSync(source, folder, {recursive: true});
		fs.writeFileSync(path.join(folder, 'application', 'components', 'SinglePage', 'SinglePage.js'), "Elemenx.Component('SinglePage', {\n\t$Template: '<section class=\"single-page\">{{$Path}}</section>',\n\tPrinted: function () {\n\t\treturn '<html><head><title>Print</title></head><body><p>Page</p></body></html>';\n\t}\n});\n");

		page = build(folder, {single: true, splash: {Text: 'Loading'}});
		scripts = [];

		page.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, function (all, code) {
			scripts.push(code);

			return all;
		});

		expect(scripts.length).toBeGreaterThan(1);

		scripts.forEach(function (code) {
			expect(function () {
				return new vm.Script(code);
			}).not.toThrow();
		});

		expect(page).toContain('</head><body><p>Page</p></body></html>');
		expect(scripts.join('\n')).not.toContain(':root{--elemenx-font');
		expect(page.indexOf('id="elemenx-splash"')).toBeGreaterThan(page.lastIndexOf('</script>'));
	});
});
