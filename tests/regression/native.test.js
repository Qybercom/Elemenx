import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import childProcess from 'child_process';
import { createRequire } from 'module';
import Builder from '../../tools/builder.js';

var require = createRequire(import.meta.url);
var Native = require('../../tools/native.js');
var Cli = require('../../elemenx-cli.js');
var cli = path.resolve(process.cwd(), 'elemenx-cli.js');
/* A copy of the project of the dist tests: the tests of Electron put their own modules into that one at the same time. */
var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var project = path.resolve(process.cwd(), 'tests', 'dist', 'native-project');
var output = path.resolve(process.cwd(), 'tests', 'dist', 'native-output');
var modules = path.join(project, 'node_modules');
var config = path.join(project, 'capacitor.config.json');

function write (file, text) {
	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, text);
}

/* Builds with the output of the builder captured. */
function build (options) {
	var written = '';
	var original = process.stdout.write;

	process.stdout.write = function (text) {
		written += text;

		return true;
	};

	try {
		Builder.Build(project, Object.assign({native: 'mobile', out: '../native-output'}, options || {}));
	}
	finally {
		process.stdout.write = original;
	}

	return written;
}

/* Runs a function with what it writes to the output kept: [result, text]. */
function quiet (run) {
	var written = '';
	var original = process.stdout.write;
	var result;

	process.stdout.write = function (text) {
		written += text;

		return true;
	};

	try {
		result = run();
	}
	finally {
		process.stdout.write = original;
	}

	return [result, written];
}

beforeAll(function () {
	fs.rmSync(project, {recursive: true, force: true});
	fs.cpSync(source, project, {recursive: true, filter: function (file) {
		return !/(^|[\\/])node_modules([\\/]|$)/.test(path.relative(source, file));
	}});
});

afterAll(function () {
	fs.rmSync(project, {recursive: true, force: true});
});

afterEach(function () {
	fs.rmSync(output, {recursive: true, force: true});
	fs.rmSync(modules, {recursive: true, force: true});
	fs.rmSync(config, {force: true});
	fs.rmSync(path.join(project, 'android'), {recursive: true, force: true});
});

describe('Builder: native programs (--native)', function () {
	it('makes the web folder of a Capacitor project with the bridge of Native, and says what to type without Capacitor', function () {
		var text = build();
		var folder = path.join(output, 'native', 'mobile');
		var html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');

		expect(fs.readFileSync(path.join(folder, 'elemenx-native.js'), 'utf8')).toContain('window.ElemenxNative = {');
		expect(html).toMatch(/<head[^>]*>\n\t<script src="elemenx-native.js"><\/script>/);
		expect(fs.readFileSync(path.join(folder, 'app.js'), 'utf8')).toContain('Elemenx.Expressions({');
		expect(JSON.parse(fs.readFileSync(config, 'utf8'))).toEqual({appId: 'com.example.nativeproject', appName: 'native-project', webDir: '../native-output/native/mobile'});
		expect(fs.existsSync(path.join(output, 'native-app'))).toBe(false);

		expect(text).toContain('it has no mobile projects yet');
		expect(text).toContain('(missing: @capacitor/cli, @capacitor/core, @capacitor/android, @capacitor/ios)');
		expect(text).toContain('npx elemenx native add mobile');
		expect(text).toContain('npx elemenx build --native mobile --out ../native-output');
		expect(text).toContain('npx cap open android');
	});

	it('adds the platforms Capacitor has in the project and syncs them', function () {
		var record = path.join(output, 'cap.txt');
		var text;

		write(path.join(modules, '@capacitor', 'core', 'package.json'), JSON.stringify({name: '@capacitor/core', version: '6.0.0'}));
		write(path.join(modules, '@capacitor', 'android', 'package.json'), JSON.stringify({name: '@capacitor/android', version: '6.0.0'}));
		write(path.join(modules, '@capacitor', 'cli', 'package.json'), JSON.stringify({name: '@capacitor/cli', bin: {cap: 'bin/capacitor'}}));
		write(path.join(modules, '@capacitor', 'cli', 'bin', 'capacitor'), 'require("fs").appendFileSync(' + JSON.stringify(record) + ', process.argv.slice(2).join(" ") + "|" + process.cwd() + "\\n");');

		text = build({nativeSettings: {Mobile: {AppID: 'dev.elemenx.single', Name: 'Single'}}});

		expect(fs.readFileSync(record, 'utf8').trim().split('\n')).toEqual(['add android|' + project, 'sync|' + project]);
		expect(JSON.parse(fs.readFileSync(config, 'utf8')).appId).toBe('dev.elemenx.single');
		expect(text).toContain('the mobile programs are ready to build: android (npx cap open android)');
	});

	it('builds every platform without one, and refuses a platform or an ID it does not know', function () {
		quiet(function () {
			return build({native: true});
		});

		expect(fs.existsSync(path.join(output, 'native', 'desktop', 'main.js'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'native', 'desktop', 'app', 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'native', 'mobile', 'elemenx-native.js'))).toBe(true);
		expect(fs.readdirSync(output).sort()).toEqual(['native']);

		expect(function () {
			build({native: 'tv'});
		}).toThrow('unknown --native platform: tv (desktop, mobile, or none for all of them)');
		expect(function () {
			build({nativeSettings: {Mobile: {AppID: 'single'}}});
		}).toThrow('Native.Mobile.AppID must be a reverse domain name, as com.example.app: single');
		expect(function () {
			build({nativeSettings: {Mobile: {Platforms: ['android', 'tizen']}}});
		}).toThrow('unknown Native.Mobile.Platforms: tizen (android, ios)');
	});
});

describe('elemenx native add', function () {
	var site;

	beforeEach(function () {
		site = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-site-'));

		fs.writeFileSync(path.join(site, 'package.json'), '{}');
	});

	afterEach(function () {
		fs.rmSync(site, {recursive: true, force: true});
	});

	it('installs Electron as tools of development and Capacitor as packages of the program, with npm in the project', function () {
		var calls = [];
		var run = function (where, args) {
			calls.push([where, args.join(' ')]);

			return 0;
		};
		var result = quiet(function () {
			return Native.Add(site, 'all', {Run: run});
		});

		expect(result[0]).toEqual(['desktop', 'mobile']);
		expect(calls).toEqual([
			[site, 'install --save-dev electron @electron/packager'],
			[site, 'install --save @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/app @capacitor/browser @capacitor/dialog']
		]);
		expect(result[1]).toContain('build with: npx elemenx build --native');

		calls = [];

		quiet(function () {
			return Native.Add(site, 'desktop', {Run: run});
		});

		expect(calls.length).toBe(1);
	});

	it('refuses a platform it does not know, a folder with no package.json, and a failed npm', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-native-'));

		try {
			expect(function () {
				Native.Add(site, 'tv');
			}).toThrow('unknown native platform: tv (desktop, mobile, or all)');
			expect(function () {
				Native.Add(folder, 'desktop');
			}).toThrow('no package.json in ' + folder);
			expect(function () {
				quiet(function () {
					return Native.Add(site, 'mobile', {Run: function () {
						return 1;
					}});
				});
			}).toThrow('npm could not install the mobile packages');
		}
		finally {
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});
});

describe('elemenx generate application --native', function () {
	it('gives the new project npm run native, for its platforms', function () {
		var Generator = require('../../tools/generator.js');
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-generate-'));
		var other = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-generate-'));

		try {
			quiet(function () {
				Generator.GenerateApplication(folder, 'FooApp', {native: 'desktop'});
				Generator.GenerateApplication(other, 'BarApp', {native: true});
			});

			expect(JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8')).scripts).toEqual({dev: 'elemenx dev', build: 'elemenx build', serve: 'elemenx serve', native: 'elemenx build --native desktop'});
			expect(JSON.parse(fs.readFileSync(path.join(other, 'package.json'), 'utf8')).scripts.native).toBe('elemenx build --native');
		}
		finally {
			fs.rmSync(folder, {recursive: true, force: true});
			fs.rmSync(other, {recursive: true, force: true});
		}
	});
});

describe('elemenx help', function () {
	it('lists the commands, and shows the help of one by help <command> or --help', function () {
		var all = childProcess.spawnSync(process.execPath, [cli, 'help'], {encoding: 'utf8'});
		var build = childProcess.spawnSync(process.execPath, [cli, 'help', 'build'], {encoding: 'utf8'});
		var flag = childProcess.spawnSync(process.execPath, [cli, 'build', '--help'], {encoding: 'utf8'});
		var short = childProcess.spawnSync(process.execPath, [cli, 'native', '-h'], {encoding: 'utf8'});
		var alias = childProcess.spawnSync(process.execPath, [cli, 'help', 'g'], {encoding: 'utf8'});
		var unknown = childProcess.spawnSync(process.execPath, [cli, 'help', 'nothing'], {encoding: 'utf8'});

		expect(all.stdout).toContain('  native       Add what native programs need');
		expect(all.stdout).toContain('elemenx help <command>, or elemenx <command> --help');
		expect(build.stdout).toContain('elemenx build: Build an Application into dist');
		expect(build.stdout).toContain('Usage:\n  elemenx build [project] [options]');
		expect(build.stdout).toMatch(/\n {2}--native \[desktop\|mobile\] +native programs: desktop \(Electron\)/);
		expect(flag.stdout).toBe(build.stdout);
		expect(short.stdout).toContain('elemenx native add [desktop|mobile|all] [project]');
		expect(alias.stdout).toContain('elemenx generate application <Name> [path] [--native [desktop|mobile]] [--force]');
		expect(unknown.stderr).toBe('Elemenx CLI: unknown command: nothing (use elemenx help)\n');
	});

	it('reads --native with a platform or alone, not taking the project for a platform', function () {
		expect(Cli.Parse(['build', '--native']).Options).toEqual({native: true});
		expect(Cli.Parse(['build', '--native', 'mobile', 'site'])).toEqual({Arguments: ['build', 'site'], Options: {native: 'mobile'}});
		expect(Cli.Parse(['build', '--native', 'site'])).toEqual({Arguments: ['build', 'site'], Options: {native: true}});
		expect(childProcess.spawnSync(process.execPath, [cli, 'native', 'remove'], {encoding: 'utf8'}).stderr).toBe('Elemenx CLI: usage: elemenx native add [desktop|mobile|all] [project]\n');
	});
});
