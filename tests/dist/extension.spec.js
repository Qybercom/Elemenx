import { chromium } from '@playwright/test';
import { test, expect } from '../coverage/playwright.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';

import Builder from '../../tools/builder.js';
import Extension from '../../tools/extension.js';

var project = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var output = path.resolve(process.cwd(), 'tests', 'dist', 'extension-output', 'extension');

/* The names of the files of a zip archive, from its central directory. */
function zipNames (file) {
	var data = fs.readFileSync(file);
	var end = data.lastIndexOf(Buffer.from([0x50, 0x4B, 0x05, 0x06]));
	var count = data.readUInt16LE(end + 10);
	var offset = data.readUInt32LE(end + 16);
	var names = [];
	var length;

	while (names.length < count) {
		length = data.readUInt16LE(offset + 28);
		names.push(data.toString('utf8', offset + 46, offset + 46 + length));
		offset += 46 + length + data.readUInt16LE(offset + 30) + data.readUInt16LE(offset + 32);
	}

	return names;
}

/* The text of a file of a zip archive. */
function zipText (file, name) {
	var data = fs.readFileSync(file);
	var at = data.indexOf(Buffer.from([0x50, 0x4B, 0x03, 0x04]));

	while (at !== -1) {
		var length = data.readUInt16LE(at + 26);
		var extra = data.readUInt16LE(at + 28);
		var size = data.readUInt32LE(at + 18);
		var start = at + 30 + length + extra;

		if (data.toString('utf8', at + 30, at + 30 + length) === name)
			return zlib.inflateRawSync(data.subarray(start, start + size)).toString('utf8');

		at = data.indexOf(Buffer.from([0x50, 0x4B, 0x03, 0x04]), start + size);
	}

	return null;
}

test.describe('elemenx build --extension', function () {
	test.describe.configure({mode: 'serial'});

	test.beforeAll(function () {
		Builder.Build(project, {extension: true, surface: 'tab', out: '../extension-output', extensionSettings: {Description: 'A test extension'}});
	});

	test.afterAll(function () {
		fs.rmSync(path.dirname(output), {recursive: true, force: true});
	});

	test('makes a folder and a zip for Chrome and for Firefox, with their manifests and the expressions precompiled', function () {
		var chrome = JSON.parse(fs.readFileSync(path.join(output, 'chrome', 'manifest.json'), 'utf8'));
		var firefox = JSON.parse(fs.readFileSync(path.join(output, 'firefox', 'manifest.json'), 'utf8'));

		expect(fs.readdirSync(output).sort()).toEqual(['chrome', 'chrome.zip', 'firefox', 'firefox.zip']);
		expect([chrome.manifest_version, chrome.name, chrome.version, chrome.description, chrome.background, chrome.action.default_popup]).toEqual([3, 'single-project', '1.0.0', 'A test extension', {service_worker: 'background.js'}, undefined]);
		expect([firefox.background, firefox.browser_specific_settings.gecko.id]).toEqual([{scripts: ['background.js']}, 'single-project@elemenx.extension']);
		expect(fs.readFileSync(path.join(output, 'chrome', 'background.js'), 'utf8')).toContain("chrome.tabs.create({url: chrome.runtime.getURL('index.html')})");
		expect(fs.readFileSync(path.join(output, 'firefox', 'background.js'), 'utf8')).toContain("browser.tabs.create({url: browser.runtime.getURL('index.html')})");
		expect(fs.readFileSync(path.join(output, 'chrome', 'app.js'), 'utf8')).toContain('Elemenx.Expressions({');

		expect(zipNames(path.join(output, 'chrome.zip'))).toEqual(expect.arrayContaining(['manifest.json', 'background.js', 'index.html', 'elemenx.js', 'app.js']));
		expect(JSON.parse(zipText(path.join(output, 'firefox.zip'), 'manifest.json'))).toEqual(firefox);
	});

	test('fits the manifest to the surface: a popup, a tab or a side panel; Manifest of the settings adds to it', function () {
		var info = {Name: 'App', Version: '2.1', Description: '', ID: 'app@example'};

		expect(Extension.Manifest('chrome', 'popup', info, {}, null).action).toEqual({default_title: 'App', default_popup: 'index.html'});
		expect(Extension.Manifest('chrome', 'popup', info, {}, null).background).toBeUndefined();
		expect([Extension.Manifest('chrome', 'side', info, {}, null).side_panel, Extension.Manifest('chrome', 'side', info, {}, null).permissions]).toEqual([{default_path: 'index.html'}, ['sidePanel']]);
		expect(Extension.Manifest('firefox', 'side', info, {}, null).sidebar_action).toEqual({default_panel: 'index.html', default_title: 'App'});
		expect(Extension.Manifest('chrome', 'tab', info, {Manifest: {permissions: ['storage'], homepage_url: 'https://example.com'}}, null)).toMatchObject({permissions: ['storage'], homepage_url: 'https://example.com'});
	});

	test('stops on an inline script of the page, which an extension cannot run', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-extension-'));

		try {
			fs.writeFileSync(path.join(folder, 'index.html'), '<!DOCTYPE html><script>window.a = 1;</script>');

			expect(function () {
				Extension.Pack(folder, path.join(folder, 'out'), project, {});
			}).toThrow('an extension cannot run the inline script of index.html');

			expect(function () {
				Extension.Pack(folder, path.join(folder, 'out'), project, {Surface: 'window'});
			}).toThrow('extension surface must be popup, tab or side: window');
		}
		finally {
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});

	/*
	 * In a browser: the page of the extension runs the Application under the policy of an extension (no eval), its
	 * Router keeps the route in memory from /. Edge loads an unpacked extension from the command line, Chrome no more;
	 * where Edge is not installed the test is skipped.
	 */
	test('runs in a browser under the policy of an extension, its Router in memory from the route /', async function () {
		var profile = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-profile-'));
		var folder = path.join(output, 'chrome');
		var context;
		var worker;
		var page;
		var list = [];

		try {
			context = await chromium.launchPersistentContext(profile, {channel: 'msedge', headless: true, args: ['--disable-extensions-except=' + folder, '--load-extension=' + folder]});
		}
		catch (error) {
			test.skip(true, 'Microsoft Edge is not installed: ' + error.message.split('\n')[0]);
		}

		try {
			worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
			page = await context.newPage();

			page.on('pageerror', function (error) {
				list.push(error.message);
			});

			page.on('console', function (message) {
				if (message.type() === 'error')
					list.push(message.text());
			});

			await page.goto('chrome-extension://' + worker.url().split('/')[2] + '/index.html');

			await expect(page.getByText('Single file')).toBeVisible();
			await expect(page.locator('.single-page')).toHaveText('/');

			/* A link goes to its route in memory: the URL of the page stays index.html. */
			await page.getByRole('link', {name: 'About'}).click();

			await expect(page.locator('.single-page')).toHaveText('/about');
			expect(new URL(page.url()).pathname).toBe('/index.html');

			expect(list).toEqual([]);
		}
		finally {
			await context.close();

			fs.rmSync(profile, {recursive: true, force: true});
		}
	});
});
