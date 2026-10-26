import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import crypto from 'crypto';
import { createRequire } from 'module';
import { Sandbox } from './sandbox.mjs';

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

		expect(ui).toContain('Elemenx.Library(\'ElemenxUI\',{$Root:root,$Locales:{"URL":"locales/{language}.json","Languages":["en","ru"]}});');
		expect(ui).toContain('Elemenx.Resource(root+"/locales/ru.json",');
		expect(ui).toContain('Elemenx.Resource(root+"/index.svg",');
		expect(ui).toContain('Elemenx.Resource(root+"/icons/weather.svg",');
		expect(ui).not.toContain('"/data/emoji');
		expect(ui).not.toContain('"/icons/brands.svg"');
		expect(ui).not.toContain('"/icons/files.svg"');
		expect(ui).toContain('"Ribbon":function(){');
		expect(ui).toContain('"Emoji":function(){');
		expect(ui).toContain('"glyph":function(){');
		expect(ui).toContain('--elemenx-accent-rgb');
		expect(ui).not.toContain('$TemplateURL');
		expect(ui).not.toContain('$StyleURL');
	});

	it('leaves the packs of ElemenxUI (packs.json) to scripts of their own that put their files next to the script', function () {
		var packs = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'libraries', 'ElemenxUI', 'packs.json'), 'utf8'));

		expect(Object.keys(packs)).toEqual(['emoji', 'emoji.ru', 'cities', 'cities.ru', 'meta', 'brands', 'files', 'sport', 'racing', 'science', 'art', 'cinema', 'games', 'fantasy', 'scifi']);

		Object.keys(packs).filter(function (name) {
			return !/\.css$/.test(packs[name].Files[0]);
		}).forEach(function (name) {
			['elemenx-ui.' + name + '.js', 'elemenx-ui.' + name + '.min.js'].forEach(function (file) {
				var registered = {};

				new vm.Script(read(file)).runInNewContext({
					document: {currentScript: {src: 'file:///D:/site/dist/' + file + '?v=1'}},
					Elemenx: {
						Resource: function (url, text) {
							registered[url] = text;
						}
					}
				});

				expect(Object.keys(registered), file).toEqual(packs[name].Files.map(function (relative) {
					return 'file:///D:/site/dist/elemenx-ui/' + relative;
				}));
				expect(registered['file:///D:/site/dist/elemenx-ui/' + packs[name].Files[0]].length, file).toBeGreaterThan(1000);

				/* The data of text files is kept as it is: the cities are lines of fields between tabs. */
				packs[name].Files.filter(function (relative) {
					return /\.txt$/.test(relative);
				}).forEach(function (relative) {
					expect(registered['file:///D:/site/dist/elemenx-ui/' + relative], file).toBe(fs.readFileSync(path.resolve(process.cwd(), 'libraries', 'ElemenxUI', relative), 'utf8'));
				});
			});
		});
	});

	it('leaves the game themes out of elemenx-ui.js, to scripts of their own that put their stylesheet into the page', function () {
		var ui = read('elemenx-ui.js');

		expect(ui).not.toContain("[data-theme][data-theme='fantasy']");
		expect(ui).not.toContain("[data-theme][data-theme='scifi']");
		expect(ui).toContain("[data-theme][data-theme='darcula']");

		['fantasy', 'scifi'].forEach(function (name) {
			['elemenx-ui.' + name + '.js', 'elemenx-ui.' + name + '.min.js'].forEach(function (file) {
				var styles = [];

				new vm.Script(read(file)).runInNewContext({
					document: {
						currentScript: {src: 'file:///D:/site/dist/' + file},
						createElement: function () {
							return {setAttribute: function () {}};
						},
						head: {
							appendChild: function (style) {
								styles.push(style.textContent);
							}
						}
					}
				});

				expect(styles.length, file).toBe(1);
				expect(styles[0], file).toContain("[data-theme][data-theme='" + name + "']");
			});
		});
	});

	it('writes no Unicode noncharacter, which an HTML parser reports in an inline script', function () {
		['elemenx-ui.js', 'elemenx-ui.emoji.js', 'elemenx-ui.emoji.ru.js', 'elemenx-ui.cities.js', 'elemenx-ui.cities.ru.js', 'elemenx-ui.brands.js', 'elemenx-ui.files.js'].forEach(function (name) {
			var source = read(name);
			var found = [];

			for (var char of source) {
				var code = char.codePointAt(0);
				if ((code >= 0xFDD0 && code <= 0xFDEF) || (code & 0xFFFE) === 0xFFFE)
					found.push(code.toString(16));
			}

			expect(found, name).toEqual([]);
		});
	});

	it('embeds in a single file the packs the Application uses, and the ones of --packs', function () {
		var sandbox = Sandbox('packs');
		var project = sandbox.Project;
		var target = path.join(project, '..', 'single-packs-output');
		var html;

		function embedded (relative) {
			return html.indexOf('Elemenx.Resource("/libraries/ElemenxUI/' + relative + '"') !== -1;
		}

		try {
			Builder.Build(project, {single: true, out: '../single-packs-output'});

			html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(embedded('icons/brands.svg')).toBe(true);
			expect(embedded('icons/weather.svg')).toBe(true);
			expect(embedded('icons/files.svg')).toBe(false);
			expect(embedded('data/emoji.json')).toBe(false);

			Builder.Build(project, {single: true, out: '../single-packs-output', packs: ['emoji', 'files']});

			html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(embedded('icons/files.svg')).toBe(true);
			expect(embedded('data/emoji.json')).toBe(true);
			expect(embedded('data/emoji-en.json')).toBe(true);
			expect(embedded('data/emoji-ru.json')).toBe(false);

			/* The game themes go in when the Application names them, or by --packs. */
			expect(html).not.toContain("[data-theme][data-theme='fantasy']");
			expect(html).toContain("[data-theme][data-theme='darcula']");

			Builder.Build(project, {single: true, out: '../single-packs-output', packs: ['fantasy']});

			html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(html).toContain("[data-theme][data-theme='fantasy']");
			expect(html).not.toContain("[data-theme][data-theme='scifi']");
		}
		finally {
			fs.rmSync(sandbox.Root, {recursive: true, force: true});
		}
	});

	it('copies next to a build in a folder the packs the Application uses, with every language of them, and the ones of --packs or --full', function () {
		var sandbox = Sandbox('folder-packs');
		var project = sandbox.Project;
		var target = path.join(project, '..', 'folder-packs-output');
		var index;

		function copied (relative) {
			return fs.existsSync(path.join(target, 'libraries', 'ElemenxUI', relative));
		}

		try {
			Builder.Build(project, {out: '../folder-packs-output'});

			index = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(copied('icons/brands.svg')).toBe(true);
			expect(copied('icons/weather.svg')).toBe(true);
			expect(copied('index.css')).toBe(true);
			expect(copied('icons/files.svg')).toBe(false);
			expect(copied('data/emoji.json')).toBe(false);
			expect(copied('data/cities.txt')).toBe(false);
			expect(copied('themes/fantasy.css')).toBe(false);
			expect(index).not.toContain('themes/fantasy.css');
			expect(index).toContain('themes/darcula.css');

			Builder.Build(project, {out: '../folder-packs-output', packs: ['emoji', 'fantasy']});

			index = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(copied('data/emoji.json')).toBe(true);
			expect(copied('data/emoji-en.json')).toBe(true);
			expect(copied('data/emoji-ru.json')).toBe(true);
			expect(copied('themes/fantasy.css')).toBe(true);
			expect(index).toContain('themes/fantasy.css');

			Builder.Build(project, {out: '../folder-packs-output', full: true});

			expect(copied('data/cities.txt')).toBe(true);
			expect(copied('icons/files.svg')).toBe(true);
			expect(fs.readFileSync(path.join(target, 'libraries', 'ElemenxUI', 'locales', 'en.json'), 'utf8')).toBe(fs.readFileSync(path.join(process.cwd(), 'libraries', 'ElemenxUI', 'locales', 'en.json'), 'utf8'));
		}
		finally {
			fs.rmSync(sandbox.Root, {recursive: true, force: true});
		}
	});

	it('takes a Component of a Library the code names to make it, as a window of a program opens it, not only by its tag', function () {
		var project = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-named-'));
		var bundle;

		try {
			fs.cpSync(path.resolve(process.cwd(), 'tests', 'dist', 'single-project'), project, {recursive: true});
			fs.appendFileSync(path.join(project, 'app.js'), '\nvar windows = {Component: \'NativeMenuPanel\'};\nvar made = Elemenx.Component(\'Knob\');\n');

			Builder.Build(project, {out: 'dist'});

			bundle = fs.readFileSync(path.join(project, 'dist', 'app.js'), 'utf8');

			expect(bundle).toContain('Elemenx.Component(\'NativeMenuPanel\'');
			expect(bundle).toContain('Elemenx.Component(\'Knob\'');
			expect(bundle).not.toContain('Elemenx.Component(\'Piano\'');
		}
		finally {
			fs.rmSync(project, {recursive: true, force: true});
		}
	});

	it('keeps in the dictionaries of ElemenxUI the phrases the build names, by their key or the start of one', function () {
		var project = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-dictionary-'));
		var target = path.join(project, 'dist');
		var app = path.join(project, 'app.js');
		var dictionary;

		try {
			fs.cpSync(path.resolve(process.cwd(), 'tests', 'dist', 'single-project'), project, {recursive: true});

			/* The code of the Application names a phrase, and phrases by the start of their key. */
			fs.appendFileSync(app, '\nElemenx.Locale.Text(\'ui.common.close\');\nvar status = function (name) { return Elemenx.Locale.Text(\'ui.presence.\' + name); };\n');

			Builder.Build(project, {out: 'dist'});

			dictionary = JSON.parse(fs.readFileSync(path.join(target, 'libraries', 'ElemenxUI', 'locales', 'ru.json'), 'utf8'));

			expect(Object.keys(dictionary.ui).sort()).toEqual(['badge', 'common', 'presence']);
			expect(Object.keys(dictionary.ui.common)).toEqual(['close']);
			expect(Object.keys(dictionary.ui.presence).length).toBe(Object.keys(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'libraries', 'ElemenxUI', 'locales', 'ru.json'), 'utf8')).ui.presence).length);
		}
		finally {
			fs.rmSync(project, {recursive: true, force: true});
		}
	});

	it('builds an Application into one index.html with elemenx build --single, its scripts safe inside a <script>', function () {
		var cli = path.resolve(process.cwd(), 'elemenx-cli.js');
		var sandbox = Sandbox('cli');
		var project = sandbox.Project;
		var target = path.join(project, '..', 'single-cli-output');
		var run;
		var html;

		try {
			run = childProcess.spawnSync(process.execPath, [cli, 'build', project, '--single', '--out', '../single-cli-output', '--packs', 'files, emoji'], {encoding: 'utf8'});
			html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');

			expect(run.status).toBe(0);
			expect(run.stdout).toMatch(/^Elemenx Builder: .+index\.html \(\d+ KB\)\n$/);

			/* Its page has no <meta name="viewport">: phones would show it as a desktop page, and the build says so. */
			expect(run.stderr).toContain('index.html has no <meta name="viewport" content="width=device-width, initial-scale=1">: phones show it as a desktop page, zoomed out');
			expect(html.match(/<script/g).length).toBe(2);
			expect(html).toContain('Elemenx.Resource("/libraries/ElemenxUI/icons/files.svg"');
			expect(html).toContain('Elemenx.Resource("/libraries/ElemenxUI/data/emoji.json"');
			expect(fs.existsSync(path.join(target, 'app.js'))).toBe(false);
			expect(fs.existsSync(path.join(target, 'elemenx.js'))).toBe(false);
		}
		finally {
			fs.rmSync(sandbox.Root, {recursive: true, force: true});
		}

		expect(Builder.ScriptText('var a = "</script>", b = "<!-- x";')).toBe('var a = "<\\/script>", b = "<\\!-- x";');
		expect(new Function('return ' + Builder.ScriptText('"</SCRIPT><!--"'))()).toBe('</SCRIPT><!--');
	});

	it('copies ElemenxUI as files and describes every file in manifest.json', function () {
		var manifest = JSON.parse(read('manifest.json'));

		expect(fs.existsSync(path.join(output, 'elemenx-ui', 'index.js'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'elemenx-ui', 'icons', 'brands.svg'))).toBe(true);
		expect(manifest.Version).toBe(Package.version);
		expect(Object.keys(manifest.Files).sort()).toEqual([
			'elemenx-ui.art.js', 'elemenx-ui.art.min.js', 'elemenx-ui.brands.js', 'elemenx-ui.brands.min.js', 'elemenx-ui.cinema.js', 'elemenx-ui.cinema.min.js', 'elemenx-ui.cities.js', 'elemenx-ui.cities.min.js', 'elemenx-ui.cities.ru.js', 'elemenx-ui.cities.ru.min.js', 'elemenx-ui.emoji.js', 'elemenx-ui.emoji.min.js', 'elemenx-ui.emoji.ru.js', 'elemenx-ui.emoji.ru.min.js',
			'elemenx-ui.fantasy.js', 'elemenx-ui.fantasy.min.js', 'elemenx-ui.files.js', 'elemenx-ui.files.min.js', 'elemenx-ui.games.js', 'elemenx-ui.games.min.js', 'elemenx-ui.js', 'elemenx-ui.meta.js', 'elemenx-ui.meta.min.js', 'elemenx-ui.min.js',
			'elemenx-ui.racing.js', 'elemenx-ui.racing.min.js', 'elemenx-ui.science.js', 'elemenx-ui.science.min.js', 'elemenx-ui.scifi.js', 'elemenx-ui.scifi.min.js', 'elemenx-ui.sport.js', 'elemenx-ui.sport.min.js', 'elemenx.all.js', 'elemenx.all.min.js', 'elemenx.js', 'elemenx.min.js'
		]);
		expect(manifest.Files['elemenx.min.js'].Integrity).toBe('sha384-' + crypto.createHash('sha384').update(fs.readFileSync(path.join(output, 'elemenx.min.js'))).digest('base64'));
		expect(manifest.Files['elemenx.min.js'].Gzip).toBeLessThan(manifest.Files['elemenx.min.js'].Size);
		expect(result.Output).toBe(path.resolve(output));
	});
});
