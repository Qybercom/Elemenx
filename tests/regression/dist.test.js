import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import crypto from 'crypto';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Dist = require('../../tools/dist.js');
var Builder = require('../../tools/builder.js');
var childProcess = require('child_process');
var Package = require('../../package.json');
var output;
var result;

function read (name) {
	return fs.readFileSync(path.join(output, name), 'utf8');
}

describe('Elemenx dist', function () {
	beforeAll(function () {
		output = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-dist-'));
		result = Dist.Build(output);
	});

	afterAll(function () {
		fs.rmSync(output, {recursive: true, force: true});
	});

	it('writes the framework, ElemenxUI and both in one, plain and minified, with a license banner', function () {
		['elemenx.js', 'elemenx.min.js', 'elemenx-ui.js', 'elemenx-ui.min.js', 'elemenx.all.js', 'elemenx.all.min.js'].forEach(function (name) {
			var source = read(name);

			expect(source.indexOf('/*! ' + (name.indexOf('elemenx-ui') === 0 ? 'ElemenxUI' : 'Elemenx') + ' ' + Package.version + ' | LGPL-3.0 */'), name).toBe(0);
			expect(function () {
				new vm.Script(source);
			}, name).not.toThrow();
		});

		expect(read('elemenx.min.js').length).toBeLessThan(read('elemenx.js').length * 0.8);
		expect(read('elemenx-ui.min.js').length).toBeLessThan(read('elemenx-ui.js').length);
		expect(read('elemenx.all.min.js')).toBe(read('elemenx.min.js') + read('elemenx-ui.min.js'));
	});

	it('embeds in ElemenxUI its styles, sprites, data and every entity with its template and style', function () {
		var ui = read('elemenx-ui.min.js');

		expect(ui).toContain('Elemenx.Library(\'ElemenxUI\',{$Root:root});');
		expect(ui).toContain('Elemenx.Resource(root+"/index.svg",');
		expect(ui).toContain('Elemenx.Resource(root+"/icons/weather.svg",');
		expect(ui).toContain('Elemenx.Resource(root+"/data/emoji.json",');
		expect(ui).toContain('"Ribbon":function(){');
		expect(ui).toContain('"Emoji":function(){');
		expect(ui).toContain('"glyph":function(){');
		expect(ui).toContain('--elemenx-accent-rgb');
		expect(ui).not.toContain('$TemplateURL');
		expect(ui).not.toContain('$StyleURL');
	});

	it('builds an Application into one index.html with elemenx build --single, its scripts safe inside a <script>', function () {
		var cli = path.resolve(process.cwd(), 'elemenx-cli.js');
		var project = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
		var target = path.join(project, '..', 'single-cli-output');
		var run;
		var html;

		try {
			run = childProcess.spawnSync(process.execPath, [cli, 'build', project, '--single', '--out', '../single-cli-output'], {encoding: 'utf8'});
			html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(run.status).toBe(0);
			expect(run.stdout).toMatch(/^Elemenx Builder: .+index\.html \(\d+ KB\)\n$/);
			expect(html.match(/<script/g).length).toBe(2);
			expect(fs.existsSync(path.join(target, 'app.js'))).toBe(false);
			expect(fs.existsSync(path.join(target, 'elemenx.js'))).toBe(false);
		}
		finally {
			fs.rmSync(target, {recursive: true, force: true});
		}

		expect(Builder.ScriptText('var a = "</script>", b = "<!-- x";')).toBe('var a = "<\\/script>", b = "<\\!-- x";');
		expect(new Function('return ' + Builder.ScriptText('"</SCRIPT><!--"'))()).toBe('</SCRIPT><!--');
	});

	it('copies ElemenxUI as files and describes every file in manifest.json', function () {
		var manifest = JSON.parse(read('manifest.json'));

		expect(fs.existsSync(path.join(output, 'elemenx-ui', 'index.js'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'elemenx-ui', 'icons', 'brands.svg'))).toBe(true);
		expect(manifest.Version).toBe(Package.version);
		expect(Object.keys(manifest.Files).sort()).toEqual(['elemenx-ui.js', 'elemenx-ui.min.js', 'elemenx.all.js', 'elemenx.all.min.js', 'elemenx.js', 'elemenx.min.js']);
		expect(manifest.Files['elemenx.min.js'].Integrity).toBe('sha384-' + crypto.createHash('sha384').update(fs.readFileSync(path.join(output, 'elemenx.min.js'))).digest('base64'));
		expect(manifest.Files['elemenx.min.js'].Gzip).toBeLessThan(manifest.Files['elemenx.min.js'].Size);
		expect(result.Output).toBe(path.resolve(output));
	});
});
