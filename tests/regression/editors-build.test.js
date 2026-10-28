import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var child = require('child_process');
var Editors = require('../../editors/build.js');
var platform = Object.getOwnPropertyDescriptor(process, 'platform');
var made = [];

describe('Elemenx editors: the build of the extensions', function () {
	afterEach(function () {
		vi.restoreAllMocks();

		Object.defineProperty(process, 'platform', platform);

		while (made.length) fs.rmSync(made.pop(), {recursive: true, force: true});
	});

	/* Regression: gradlew committed from Windows has no mode of a program, and the release failed on Linux (permission denied). */
	it('runs gradlew through sh on Linux, so a checkout without its mode builds the plugin of IntelliJ', function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-editors-'));
		var jdk = path.join(root, 'jdk');
		var distributions = path.resolve(process.cwd(), 'editors', 'intellij', 'build', 'distributions');
		var archive = path.join(distributions, 'elemenx-intellij.zip');
		/* A plugin built before stays: kept aside and put back after. */
		var kept = fs.existsSync(archive) ? fs.readFileSync(archive) : null;
		var calls = [];
		var result;

		made.push(root);

		fs.mkdirSync(jdk);
		fs.writeFileSync(path.join(jdk, 'release'), 'JAVA_VERSION="21.0.5"\n');

		Object.defineProperty(process, 'platform', {value: 'linux'});

		vi.stubEnv('JAVA_HOME', jdk);
		vi.stubEnv('ELEMENX_IDEA', '');
		vi.stubEnv('ELEMENX_INTELLIJ', 'download');

		vi.spyOn(child, 'spawnSync').mockImplementation(function (command, list) {
			calls.push([command].concat(list || []));

			/* vsce: the package where --out says. */
			if (list && list.indexOf('--out') !== -1)
				fs.writeFileSync(list[list.indexOf('--out') + 1], 'an extension');

			if (command === 'sh') {
				fs.mkdirSync(distributions, {recursive: true});
				fs.writeFileSync(archive, 'a plugin');
			}

			return {status: 0};
		});

		try {
			result = Editors.Build({Output: path.join(root, 'out'), Idea: null, Log: function () {}});
		}
		finally {
			if (kept) fs.writeFileSync(archive, kept);
			else fs.rmSync(archive, {force: true});
		}

		expect(calls.filter(function (call) {
			return /gradlew/.test(call.join(' '));
		})).toEqual([['sh', path.resolve(process.cwd(), 'editors', 'intellij', 'gradlew'), 'buildPlugin', '--no-daemon']]);
		expect(fs.existsSync(path.join(root, 'out', path.basename(archive)))).toBe(true);
		expect(JSON.stringify(result)).toContain(path.basename(archive));

		vi.unstubAllEnvs();
	});

	/* CI builds each extension in a job of its own, in parallel: --only builds that one, needs it, and touches no other. */
	it('builds one extension alone with Only, and refuses one it cannot build or does not know', function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-editors-'));
		var jdk = path.join(root, 'jdk');
		var distributions = path.resolve(process.cwd(), 'editors', 'intellij', 'build', 'distributions');
		var archive = path.join(distributions, 'elemenx-intellij.zip');
		var kept = fs.existsSync(archive) ? fs.readFileSync(archive) : null;
		var calls = [];
		var build = function (only) {
			calls = [];

			return Editors.Build({Output: path.join(root, 'out-' + only), Idea: null, Only: only, Log: function () {}}).map(function (file) {
				return file.Name;
			});
		};

		made.push(root);

		fs.mkdirSync(jdk);
		fs.writeFileSync(path.join(jdk, 'release'), 'JAVA_VERSION="21.0.5"\n');

		Object.defineProperty(process, 'platform', {value: 'linux'});

		vi.stubEnv('JAVA_HOME', jdk);
		vi.stubEnv('ELEMENX_IDEA', '');
		vi.stubEnv('ELEMENX_INTELLIJ', 'download');

		vi.spyOn(child, 'spawnSync').mockImplementation(function (command, list) {
			calls.push([command].concat(list || []).join(' '));

			if (list && list.indexOf('--out') !== -1)
				fs.writeFileSync(list[list.indexOf('--out') + 1], 'an extension');

			if (command === 'sh') {
				fs.mkdirSync(distributions, {recursive: true});
				fs.writeFileSync(archive, 'a plugin');
			}

			return {status: 0};
		});

		try {
			expect(build('intellij')).toEqual(['elemenx-intellij.zip']);
			expect(calls.some(function (call) {
				return /vsce/.test(call);
			})).toBe(false);

			expect(build('vscode')).toEqual(['elemenx-vscode.vsix']);
			expect(calls.some(function (call) {
				return /gradlew/.test(call);
			})).toBe(false);

			/* Visual Studio needs Windows: alone, it is required, so its absence fails the job instead of passing it empty. */
			expect(function () {
				build('visualstudio');
			}).toThrow('Elemenx editors: the extension of Visual Studio needs Windows');
			expect(function () {
				build('emacs');
			}).toThrow('Elemenx editors: --only takes vscode, intellij or visualstudio, not emacs');
		}
		finally {
			if (kept) fs.writeFileSync(archive, kept);
			else fs.rmSync(archive, {force: true});
		}

		vi.unstubAllEnvs();
	});
});
