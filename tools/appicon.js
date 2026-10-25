'use strict';

/*
 * The icon of an Application on every platform, made of one picture: Icon of elemenx.config.js, a square PNG of the
 * project (1024 pixels best, 512 at least). Icons gives a platform a file of its own instead: {Favicon, Windows (an
 * ICO), Mac (an ICNS), Linux, Android, IOS (PNGs)}.
 * - The page: icons/app-32.png as its icon and icons/app-180.png as the one of Apple, in place of the icons it named;
 *   icons/app-192.png and icons/app-512.png for a PWA without icons of its own. A page in one file has its icon inline.
 * - A desktop program: an ICO (Windows), an ICNS (macOS) or a PNG of 512 (Linux) for the packager and electron-builder
 *   (the program, its installer, its portable one), and a PNG of 256 for its windows.
 * - A mobile program: the icons of Android (mipmap-*: ic_launcher, ic_launcher_round and the foreground of its adaptive
 *   icon on the background of the splash) and the icon of iOS (1024, with no transparency, on that background).
 */

var fs = require('fs');
var path = require('path');
var Image = require('./image.js');

/* The sizes of the screens of Android: the icon, and the foreground of the adaptive icon (108 dp, the icon in its 72). */
var Densities = [['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216], ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432]];

/*
 * A file of the project: /icons/app.png is from its root, as in the page; a full path of a file that is there is taken
 * as it is (on Linux and macOS a full path starts with / too).
 */
function locate (project, value) {
	var text = String(value);
	if (path.isAbsolute(text) && fs.existsSync(text)) return path.resolve(text);

	return path.resolve(project, text.replace(/^\/+/, ''));
}

/*
 * The icon of a project, checked: {File, Image (its pixels), Icons (the files of the platforms)}, or null without
 * one. An icon that is not a square PNG is an error; a small one is told.
 */
function settings (project, icon, icons) {
	var file;
	var image;
	var own = {};

	if (!icon && !icons) return null;

	Object.keys(icons || {}).forEach(function (name) {
		if (['Favicon', 'Windows', 'Mac', 'Linux', 'Android', 'IOS'].indexOf(name) === -1)
			throw new Error('Icons does not know ' + name + ' (Favicon, Windows, Mac, Linux, Android, IOS)');

		own[name] = locate(project, icons[name]);

		if (!fs.existsSync(own[name]))
			throw new Error('Icons.' + name + ' not found: ' + own[name]);
	});

	if (!icon)
		return {File: null, Image: null, Icons: own};

	file = locate(project, icon);

	if (!fs.existsSync(file))
		throw new Error('Icon not found: ' + file);

	try {
		image = Image.Read(fs.readFileSync(file));
	}
	catch (error) {
		throw new Error('Icon must be a PNG: ' + file + ' (' + error.message + ')');
	}

	if (image.Width !== image.Height)
		throw new Error('Icon must be a square: ' + file + ' is ' + image.Width + 'x' + image.Height);

	if (image.Width < 512)
		process.stdout.write('Elemenx Builder: the icon is ' + image.Width + ' pixels; the systems draw it up to 1024 (512 at least)\n');

	return {File: file, Image: image, Icons: own};
}

/* A PNG of the icon of a size; the file of a platform when it has one. */
function picture (icon, size, own) {
	if (own && icon.Icons[own])
		return fs.readFileSync(icon.Icons[own]);

	return Image.PNG(icon.Image, size);
}

/* The pixels of the icon on a background (iOS draws no transparency): a #rrggbb color. */
function flatten (image, color) {
	var hex = /^#([0-9a-f]{6})$/i.exec(color || '') ? color.substring(1) : 'ffffff';
	var back = [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
	var data = Buffer.alloc(image.Data.length);
	var i = 0;

	while (i < data.length) {
		var alpha = image.Data[i + 3] / 255;

		data[i] = Math.round(image.Data[i] * alpha + back[0] * (1 - alpha));
		data[i + 1] = Math.round(image.Data[i + 1] * alpha + back[1] * (1 - alpha));
		data[i + 2] = Math.round(image.Data[i + 2] * alpha + back[2] * (1 - alpha));
		data[i + 3] = 255;

		i += 4;
	}

	return {Width: image.Width, Height: image.Height, Data: data};
}

/* The pixels of the icon in a circle (the round icon of Android), its edge smooth. */
function round (image) {
	var data = Buffer.from(image.Data);
	var radius = image.Width / 2;
	var y;
	var x;

	for (y = 0; y < image.Height; y++) {
		for (x = 0; x < image.Width; x++) {
			var d = Math.sqrt(Math.pow(x + 0.5 - radius, 2) + Math.pow(y + 0.5 - radius, 2));
			var keep = Math.max(0, Math.min(1, radius - d + 0.5));

			data[(y * image.Width + x) * 4 + 3] = Math.round(data[(y * image.Width + x) * 4 + 3] * keep);
		}
	}

	return {Width: image.Width, Height: image.Height, Data: data};
}

/* The pixels of the icon in the middle of a transparent square of a size: the foreground of an adaptive icon. */
function inset (image, size, inner) {
	var small = Image.Resize(image, inner);
	var data = Buffer.alloc(size * size * 4);
	var offset = Math.round((size - inner) / 2);
	var y = 0;

	while (y < inner) {
		small.Data.copy(data, ((y + offset) * size + offset) * 4, y * inner * 4, (y + 1) * inner * 4);

		y++;
	}

	return {Width: size, Height: size, Data: data};
}

/*
 * The icons of the page of a build in output: the files, and the page with its links to them in place of the icons it
 * named. inline: the icon as a data URL, for a page in one file.
 */
function page (text, icon, output, inline) {
	var links;
	var favicon;

	if (!icon.Image && !icon.Icons.Favicon) return text;

	favicon = picture(icon, 32, 'Favicon');

	if (inline) {
		links = '<link rel="icon" type="image/png" href="data:image/png;base64,' + favicon.toString('base64') + '">';
	}
	else {
		fs.mkdirSync(path.join(output, 'icons'), {recursive: true});
		fs.writeFileSync(path.join(output, 'icons', 'app-32.png'), favicon);

		links = '<link rel="icon" type="image/png" sizes="32x32" href="/icons/app-32.png">';

		if (icon.Image) {
			fs.writeFileSync(path.join(output, 'icons', 'app-180.png'), Image.PNG(icon.Image, 180));
			fs.writeFileSync(path.join(output, 'icons', 'app-192.png'), Image.PNG(icon.Image, 192));
			fs.writeFileSync(path.join(output, 'icons', 'app-512.png'), Image.PNG(icon.Image, 512));

			links += '\n\t<link rel="apple-touch-icon" href="/icons/app-180.png">';
		}
	}

	text = text.replace(/[ \t]*<link\b[^>]*\brel\s*=\s*["']?(?:shortcut icon|icon|apple-touch-icon)["']?[^>]*>[ \t]*\r?\n?/gi, '');

	if (/<\/head>/i.test(text))
		return text.replace(/<\/head>/i, '\t' + links + '\n</head>');

	return links + '\n' + text;
}

/* The icons a PWA takes of the icon of the page (made by page). */
function manifestIcons (icon) {
	if (!icon || !icon.Image) return [];

	return [{Src: '/icons/app-192.png', Sizes: '192x192', Type: 'image/png'}, {Src: '/icons/app-512.png', Sizes: '512x512', Type: 'image/png'}];
}

/*
 * The icons of a desktop program in folder: icon.ico, icon.icns and icon.png (512) for the packager and electron-builder,
 * and app/elemenx-icon.png (256) for its windows. {Windows, Mac, Linux, Window} are their paths.
 */
function desktop (icon, folder) {
	var result = {};

	if (!icon)
		return result;

	if (icon.Icons.Windows || icon.Image) {
		result.Windows = path.join(folder, 'icon.ico');

		fs.writeFileSync(result.Windows, icon.Icons.Windows ? fs.readFileSync(icon.Icons.Windows) : Image.ICO(icon.Image, [16, 24, 32, 48, 64, 128, 256]));
	}

	if (icon.Icons.Mac || icon.Image) {
		result.Mac = path.join(folder, 'icon.icns');

		fs.writeFileSync(result.Mac, icon.Icons.Mac ? fs.readFileSync(icon.Icons.Mac) : Image.ICNS(icon.Image));
	}

	if (icon.Icons.Linux || icon.Image) {
		result.Linux = path.join(folder, 'icon.png');

		fs.writeFileSync(result.Linux, picture(icon, 512, 'Linux'));
	}

	if (icon.Image) {
		result.Window = 'elemenx-icon.png';

		fs.writeFileSync(path.join(folder, 'app', result.Window), Image.PNG(icon.Image, 256));
	}

	return result;
}

/*
 * The icons of the mobile programs in a Capacitor project, where it has their folders: Android (mipmap-*) and iOS
 * (AppIcon). background: the color behind the icon (#rrggbb), the background of its adaptive icon too. The files written.
 */
function mobile (icon, project, background) {
	var written = [];
	var res = path.join(project, 'android', 'app', 'src', 'main', 'res');
	var apple = path.join(project, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
	var color = /^#[0-9a-f]{6}$/i.test(background || '') ? background : '#ffffff';
	var source;

	if (!icon || !(icon.Image || icon.Icons.Android || icon.Icons.IOS)) return written;

	if (fs.existsSync(res)) {
		source = icon.Icons.Android ? Image.Read(fs.readFileSync(icon.Icons.Android)) : icon.Image;

		Densities.forEach(function (density) {
			var folder = path.join(res, 'mipmap-' + density[0]);

			fs.mkdirSync(folder, {recursive: true});
			fs.writeFileSync(path.join(folder, 'ic_launcher.png'), Image.PNG(source, density[1]));
			fs.writeFileSync(path.join(folder, 'ic_launcher_round.png'), Image.Write(round(Image.Resize(source, density[1]))));
			fs.writeFileSync(path.join(folder, 'ic_launcher_foreground.png'), Image.Write(inset(source, density[2], Math.round(density[2] * 72 / 108))));

			written.push(folder);
		});

		fs.mkdirSync(path.join(res, 'values'), {recursive: true});
		fs.writeFileSync(path.join(res, 'values', 'ic_launcher_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">' + color.toUpperCase() + '</color>\n</resources>\n');
	}

	if (fs.existsSync(apple)) {
		source = icon.Icons.IOS ? Image.Read(fs.readFileSync(icon.Icons.IOS)) : icon.Image;

		fs.writeFileSync(path.join(apple, 'AppIcon-512@2x.png'), Image.Write(flatten(Image.Resize(source, 1024), color)));

		written.push(apple);
	}

	return written;
}

module.exports = {
	Settings: settings,
	Page: page,
	ManifestIcons: manifestIcons,
	Desktop: desktop,
	Mobile: mobile
};
