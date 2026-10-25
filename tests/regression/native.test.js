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

		/* With a splash, the screen of the system takes its color and waits for the page to hide it. */
		fs.rmSync(config);

		build({splash: {Background: '#102030'}});

		expect(JSON.parse(fs.readFileSync(config, 'utf8')).plugins).toEqual({SplashScreen: {launchAutoHide: false, launchShowDuration: 0, backgroundColor: '#102030'}});
		expect(JSON.parse(fs.readFileSync(config, 'utf8')).backgroundColor).toBe('#102030');

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

		/* With a splash, the launch theme of Android takes its color: set once, set again on the next build. */
		write(path.join(project, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml'), '<resources>\n    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">\n        <item name="android:background">@drawable/splash</item>\n    </style>\n</resources>\n');

		build({nativeSettings: {Mobile: {AppID: 'dev.elemenx.single', Name: 'Single'}}, splash: {Background: '#102030'}});
		build({nativeSettings: {Mobile: {AppID: 'dev.elemenx.single', Name: 'Single'}}, splash: {Background: '#405060'}});

		expect(fs.readFileSync(path.join(project, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml'), 'utf8')).toBe('<resources>\n    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">\n        <item name="android:background">@drawable/splash</item>\n        <item name="windowSplashScreenBackground">#405060</item>\n    </style>\n</resources>\n');
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
		}).toThrow('unknown --native platform: tv (desktop, mobile, android-library, or none for desktop and mobile)');
		expect(function () {
			build({nativeSettings: {Mobile: {AppID: 'single'}}});
		}).toThrow('Native.Mobile.AppID must be a reverse domain name, as com.example.app: single');
		/* Android builds the code of the program in a package of its ID: no part of it may be a word of Java. */
		expect(function () {
			build({nativeSettings: {Mobile: {AppID: 'dev.elemenx.native'}}});
		}).toThrow('Native.Mobile.AppID holds a word of Java, which Android does not take in an ID (native): dev.elemenx.native');
		expect(function () {
			build({nativeSettings: {Mobile: {Platforms: ['android', 'tizen']}}});
		}).toThrow('unknown Native.Mobile.Platforms: tizen (android, ios)');
	});

	it('makes the interface for an Android program of its own: a module of Gradle with the build in its assets, the bridge first, ElemenxView in its package', function () {
		var folder = path.join(output, 'native', 'android-library');
		var module = path.join(folder, 'ui');
		var text;
		var view;

		text = build({native: 'android-library', nativeSettings: {Android: {Package: 'com.example.server.ui', Module: 'ui'}}});

		expect(text).toContain('the Android module ' + module + ' (com.example.server.ui.ElemenxView');

		/* Only that target: not the desktop program or the Capacitor folder. */
		expect(fs.readdirSync(path.join(output, 'native')).sort()).toEqual(['android-library']);

		/* The build in its assets, the bridge before the framework. */
		expect(fs.existsSync(path.join(module, 'src', 'main', 'assets', 'elemenx', 'elemenx.js'))).toBe(true);
		expect(fs.existsSync(path.join(module, 'src', 'main', 'assets', 'elemenx', 'elemenx-android.js'))).toBe(true);
		expect(fs.readFileSync(path.join(module, 'src', 'main', 'assets', 'elemenx', 'index.html'), 'utf8').match(/<script src="[^"]+"/g)[0]).toBe('<script src="/elemenx-android.js"');

		/* The view in the package of the settings, the module of that namespace, its door kept by R8. */
		view = fs.readFileSync(path.join(module, 'src', 'main', 'java', 'com', 'example', 'server', 'ui', 'ElemenxView.java'), 'utf8');

		expect(view.split('\n')[0]).toBe('package com.example.server.ui;');
		expect(view).not.toContain('__PACKAGE__');
		expect(fs.readFileSync(path.join(module, 'build.gradle'), 'utf8')).toContain("namespace 'com.example.server.ui'");
		expect(fs.readFileSync(path.join(module, 'build.gradle'), 'utf8')).toContain("implementation 'androidx.webkit:webkit:1.14.0'");
		expect(fs.readFileSync(path.join(module, 'consumer-rules.pro'), 'utf8')).toContain('-keepclassmembers class com.example.server.ui.ElemenxView$Port');
		expect(fs.readFileSync(path.join(folder, 'README.md'), 'utf8')).toContain("include ':ui'");

		expect(function () {
			build({native: 'android-library', nativeSettings: {Android: {Package: 'ui'}}});
		}).toThrow('Native.Android.Package must be a Java package of two words or more, as com.example.ui: ui');
		expect(function () {
			build({native: 'android-library', nativeSettings: {Android: {Package: 'com.example.native'}}});
		}).toThrow('Native.Android.Package must be a Java package');
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
			[site, 'install --save @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/app @capacitor/browser @capacitor/dialog @capacitor/filesystem @capacitor/splash-screen']
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
		expect(build.stdout).toMatch(/\n {2}--native \[desktop\|mobile\|android-library\] +native programs: desktop \(Electron\)/);
		expect(flag.stdout).toBe(build.stdout);
		expect(short.stdout).toContain('elemenx native add [desktop|mobile|all] [project]');
		expect(alias.stdout).toContain('elemenx generate application <Name> [path] [--native [desktop|mobile]] [--force]');
		expect(unknown.stderr).toBe('Elemenx CLI: unknown command: nothing (use elemenx help)\n');
	});

	it('reads --native with a platform or alone, not taking the project for a platform', function () {
		expect(Cli.Parse(['build', '--native']).Options).toEqual({native: true});
		expect(Cli.Parse(['build', '--native', 'mobile', 'site'])).toEqual({Arguments: ['build', 'site'], Options: {native: 'mobile'}});
		expect(Cli.Parse(['build', '--native', 'site'])).toEqual({Arguments: ['build', 'site'], Options: {native: true}});
		expect(Cli.Parse(['build', '--native', 'android-library'])).toEqual({Arguments: ['build'], Options: {native: 'android-library'}});
		expect(childProcess.spawnSync(process.execPath, [cli, 'native', 'remove'], {encoding: 'utf8'}).stderr).toBe('Elemenx CLI: usage: elemenx native add [desktop|mobile|all] [project]\n');
	});
});
