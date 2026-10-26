import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var Image = require('../../tools/image.js');
var AppIcon = require('../../tools/appicon.js');
var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var temporary = [];

/* A square PNG of a size: blue, its corner transparent. */
function picture (size) {
	var data = Buffer.alloc(size * size * 4);
	var i = 0;

	while (i < size * size) {
		data[i * 4 + 2] = 255;
		data[i * 4 + 3] = i === 0 ? 0 : 255;

		i++;
	}

	return Image.Write({Width: size, Height: size, Data: data});
}

/* A copy of the project of the tests with an icon. */
function project (size) {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-icon-'));

	temporary.push(folder);

	fs.cpSync(source, folder, {recursive: true});
	fs.writeFileSync(path.join(folder, 'icon.png'), picture(size || 1024));

	return folder;
}

function build (folder, options) {
	var original = process.stdout.write;
	var written = '';

	process.stdout.write = function (text) {
		written += text;

		return true;
	};

	try {
		Builder.Build(folder, Object.assign({out: 'dist'}, options));
	}
	finally {
		process.stdout.write = original;
	}

	return written;
}

function size (file) {
	var image = Image.Read(fs.readFileSync(file));

	return image.Width + 'x' + image.Height;
}

describe('Builder: the icon of an Application on every platform', function () {
	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('reads and writes PNG, makes it smaller by the average of what it covers, and makes ICO and ICNS of it', function () {
		var image = Image.Read(picture(64));
		var small = Image.Resize(image, 16);
		var ico = Image.ICO(image, [16, 32, 256]);
		var icns = Image.ICNS(image);

		expect([small.Width, small.Height]).toEqual([16, 16]);
		expect(Array.from(small.Data.subarray(4, 8))).toEqual([0, 0, 255, 255]);
		expect([ico.readUInt16LE(2), ico.readUInt16LE(4), ico[6], ico[6 + 32]]).toEqual([1, 3, 16, 0]);
		expect(icns.toString('ascii', 0, 4)).toBe('icns');
		expect(icns.readUInt32BE(4)).toBe(icns.length);
		expect(function () {
			Image.Read(Buffer.from('GIF89a'));
		}).toThrow('not a PNG');
	});

	it('gives the page its icon in place of the ones it named, and a PWA its icons of 192 and 512', function () {
		var folder = project();
		var page = build(folder, {icon: '/icon.png', pwa: {Offline: false}});
		var manifest = JSON.parse(fs.readFileSync(path.join(folder, 'dist', 'manifest.webmanifest'), 'utf8'));

		page = fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8');

		expect(page).not.toContain('href="data:,"');
		expect(page).toContain('<link rel="icon" type="image/png" sizes="32x32" href="/icons/app-32.png">');
		expect(page.match(/apple-touch-icon/g).length).toBe(1);
		expect(['app-32.png', 'app-180.png', 'app-192.png', 'app-512.png'].map(function (name) {
			return size(path.join(folder, 'dist', 'icons', name));
		})).toEqual(['32x32', '180x180', '192x192', '512x512']);
		expect(manifest.icons).toEqual([{src: '/icons/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'}, {src: '/icons/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'}]);

		/* A page in one file has it inline. */
		build(folder, {icon: '/icon.png', single: true});

		expect(fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8')).toContain('<link rel="icon" type="image/png" href="data:image/png;base64,');
	});

	it('takes /icons/app.png from the root of the project, and a full path of a file as it is, a full path of Linux too', function () {
		var folder = project(256);
		/* Of this run alone: two runs at the same time do not take each other's file. */
		var outside = path.resolve(process.cwd(), 'tests', 'dist', 'icon-outside-' + process.pid + '.ico');
		/* A full path that starts with /, as all of them do on Linux and macOS (on Windows: from the root of the drive). */
		var slashed = process.platform === 'win32' ? outside.slice(2).replace(/\\/g, '/') : outside;
		var icon;

		fs.mkdirSync(path.join(folder, 'icons'), {recursive: true});
		fs.copyFileSync(path.join(folder, 'icon.png'), path.join(folder, 'icons', 'app.png'));
		fs.writeFileSync(outside, 'an ico');

		try {
			icon = AppIcon.Settings(folder, '/icons/app.png', {Windows: slashed});

			expect(icon.File).toBe(path.join(folder, 'icons', 'app.png'));
			expect(icon.Icons.Windows).toBe(outside);
		}
		finally {
			fs.rmSync(outside, {force: true});
		}
	});

	it('refuses an icon that is not a square PNG, and tells a small one', function () {
		var folder = project(256);

		fs.writeFileSync(path.join(folder, 'wide.png'), Image.Write({Width: 4, Height: 2, Data: Buffer.alloc(32)}));
		fs.writeFileSync(path.join(folder, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');

		expect(build(folder, {icon: 'icon.png'})).toContain('the icon is 256 pixels');
		expect(function () {
			AppIcon.Settings(folder, 'wide.png');
		}).toThrow('Icon must be a square');
		expect(function () {
			AppIcon.Settings(folder, 'icon.svg');
		}).toThrow('Icon must be a PNG');
		expect(function () {
			AppIcon.Settings(folder, 'icon.png', {Tablet: 'icon.png'});
		}).toThrow('Icons does not know Tablet');
	});

	it('makes the icons of a desktop program and of the mobile programs, a platform taking a file of its own', function () {
		var folder = project();
		var desktop = path.join(folder, 'desktop');
		var res = path.join(folder, 'android', 'app', 'src', 'main', 'res');
		var apple = path.join(folder, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
		var icon;
		var made;
		var ios;

		fs.mkdirSync(path.join(desktop, 'app'), {recursive: true});
		fs.mkdirSync(res, {recursive: true});
		fs.mkdirSync(apple, {recursive: true});
		fs.writeFileSync(path.join(folder, 'own.ico'), 'an ico of its own');

		icon = AppIcon.Settings(folder, 'icon.png', {Windows: 'own.ico'});
		made = AppIcon.Desktop(icon, desktop);

		expect(fs.readFileSync(made.Windows, 'utf8')).toBe('an ico of its own');
		expect(fs.readFileSync(made.Mac).toString('ascii', 0, 4)).toBe('icns');
		expect(size(made.Linux)).toBe('512x512');
		expect(size(path.join(desktop, 'app', made.Window))).toBe('256x256');

		AppIcon.Mobile(icon, folder, '#102030');

		expect(size(path.join(res, 'mipmap-xxxhdpi', 'ic_launcher.png'))).toBe('192x192');
		expect(size(path.join(res, 'mipmap-mdpi', 'ic_launcher_foreground.png'))).toBe('108x108');
		expect(Image.Read(fs.readFileSync(path.join(res, 'mipmap-mdpi', 'ic_launcher_round.png'))).Data[3]).toBe(0);
		expect(fs.readFileSync(path.join(res, 'values', 'ic_launcher_background.xml'), 'utf8')).toContain('<color name="ic_launcher_background">#102030</color>');

		/* iOS draws no transparency: the icon on the background. */
		ios = Image.Read(fs.readFileSync(path.join(apple, 'AppIcon-512@2x.png')));

		expect([ios.Width, Array.from(ios.Data.subarray(0, 4))]).toEqual([1024, [16, 32, 48, 255]]);
	});
});
