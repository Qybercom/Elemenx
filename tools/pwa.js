'use strict';

/*
 * A build of an Application as an installable application of the system (a PWA): PWA of elemenx.config.js, true or
 * {Name, ShortName, Description, Icon (a PNG or an SVG of the project, 512 pixels for every system), Icons ([{Src,
 * Sizes, Type, Purpose}] instead), Theme and Background (CSS colors of the bar of its window and of its start; the
 * background of the splash, white by default), Display (standalone by default, fullscreen, minimal-ui, browser), Start
 * (the address it opens, /), Orientation, Offline (true by default), Update (how a new build takes the place of the one
 * the page runs: auto, by default, at once, for the next start; prompt, when the Application says, Elemenx.Install
 * checking for one at the start and every hour; manual, when the Application says, after it asks)}. The build writes
 * manifest.webmanifest and links it
 * from the head of the page, with the color of the theme and the icon of Apple; with Offline, elemenx-pwa.js, a service
 * worker that keeps every file of the build (up to 2 MB each; larger ones once they are fetched) so the Application
 * runs without the network: the page from the network when there is one, the files from the cache, a new build a new
 * cache. Elemenx.Install registers the worker and gives the Application the prompt of the browser to install it.
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var Displays = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];

/* How a new build takes the place of the one the page runs (PWA.Update). */
var Updates = ['auto', 'prompt', 'manual'];

/* The largest file kept when the worker installs; the larger ones are kept once fetched. */
var Precached = 2 * 1024 * 1024;

function escape (value) {
	return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* The size of a PNG from its header ('512x512'), or 'any' for an SVG, or null. */
function sizeOf (file) {
	var data;

	if (/\.svg$/i.test(file)) return 'any';
	if (!fs.existsSync(file)) return null;

	data = fs.readFileSync(file);

	if (data.length < 24 || data.toString('ascii', 1, 4) !== 'PNG') return null;

	return data.readUInt32BE(16) + 'x' + data.readUInt32BE(20);
}

function typeOf (src) {
	if (/\.svg$/i.test(src)) return 'image/svg+xml';
	if (/\.webp$/i.test(src)) return 'image/webp';

	return 'image/png';
}

/*
 * The PWA of a project, checked: {Name, ShortName, Description, Icons, Theme, Background, Display, Start, Scope,
 * Orientation, Offline, Language}, or null without one. page: the page of the build (its title and its language),
 * output: the folder of the build (the sizes of its icons), splash: the splash of the build (its background).
 */
function settings (project, pwa, page, output, splash, fallback) {
	var file = path.join(project, 'package.json');
	var pack = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
	var value;
	var title;
	var name;
	var icons;

	if (!pwa)
		return null;

	value = pwa === true ? {} : pwa;

	if (typeof value !== 'object' || Array.isArray(value))
		throw new Error('PWA must be true or {Name, ShortName, Description, Icon, Icons, Theme, Background, Display, Start, Orientation, Offline, Update}');

	if (value.Display !== undefined && Displays.indexOf(value.Display) === -1)
		throw new Error('PWA.Display must be one of ' + Displays.join(', ') + ': ' + value.Display);

	if (value.Update !== undefined && Updates.indexOf(value.Update) === -1)
		throw new Error('PWA.Update must be one of ' + Updates.join(', ') + ': ' + value.Update);

	['Theme', 'Background'].forEach(function (key) {
		if (value[key] !== undefined && !/^[#A-Za-z0-9(),.%\s-]+$/.test(String(value[key])))
			throw new Error('PWA.' + key + ' must be a CSS color: ' + value[key]);
	});

	title = (/<title>([^<]*)<\/title>/i.exec(page || '') || [])[1];
	name = String(value.Name || (title || '').trim() || pack.productName || pack.name || path.basename(project));

	icons = value.Icons ? value.Icons.map(function (icon) {
		return {src: String(icon.Src), sizes: String(icon.Sizes || sizeOf(path.join(output, String(icon.Src))) || 'any'), type: icon.Type || typeOf(String(icon.Src)), purpose: icon.Purpose || 'any'};
	}) : value.Icon ? [{src: String(value.Icon), sizes: sizeOf(path.join(output, String(value.Icon))) || 'any', type: typeOf(String(value.Icon)), purpose: 'any'}] : (fallback || []).map(function (icon) {
		return {src: icon.Src, sizes: icon.Sizes, type: icon.Type, purpose: 'any'};
	});

	return {
		Name: name,
		ShortName: String(value.ShortName || name).substring(0, 30),
		Description: String(value.Description || pack.description || ''),
		Icons: icons,
		Background: String(value.Background || (splash && splash.Background) || '#ffffff'),
		Theme: String(value.Theme || value.Background || (splash && splash.Background) || '#ffffff'),
		Display: value.Display || 'standalone',
		Start: String(value.Start || '/'),
		Scope: String(value.Scope || '/'),
		Orientation: value.Orientation ? String(value.Orientation) : '',
		Offline: value.Offline !== false,
		Update: value.Update || 'auto',
		Language: (/<html\b[^>]*\blang\s*=\s*["']?([A-Za-z-]+)/i.exec(page || '') || [])[1] || ''
	};
}

function manifest (pwa) {
	var value = {
		name: pwa.Name,
		short_name: pwa.ShortName,
		start_url: pwa.Start,
		scope: pwa.Scope,
		display: pwa.Display,
		background_color: pwa.Background,
		theme_color: pwa.Theme,
		icons: pwa.Icons
	};

	if (pwa.Description)
		value.description = pwa.Description;

	if (pwa.Orientation)
		value.orientation = pwa.Orientation;

	if (pwa.Language)
		value.lang = pwa.Language;

	return JSON.stringify(value, null, '\t') + '\n';
}

/* The page with the manifest, the color of its theme, the icon of Apple and the worker in its head. */
function head (page, pwa) {
	var tags = ['<link rel="manifest" href="/manifest.webmanifest">', '<meta name="theme-color" content="' + escape(pwa.Theme) + '">'];

	if (pwa.Icons.length && page.indexOf('rel="apple-touch-icon"') === -1)
		tags.push('<link rel="apple-touch-icon" href="' + escape(pwa.Icons[pwa.Icons.length - 1].src) + '">');

	if (pwa.Offline)
		tags.push('<meta name="elemenx-pwa-worker" content="/elemenx-pwa.js" data-scope="' + escape(pwa.Scope) + '" data-update="' + escape(pwa.Update || 'auto') + '">');

	if (page.indexOf('rel="manifest"') !== -1) return page;

	if (/<\/head>/i.test(page))
		return page.replace(/<\/head>/i, '\t' + tags.join('\n\t') + '\n</head>');

	return tags.join('\n') + '\n' + page;
}

/* The files of a folder, as the worker asks for them: /path, with forward slashes. */
function files (folder, base, list) {
	list = list || [];

	fs.readdirSync(folder, {withFileTypes: true}).sort(function (a, b) {
		return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
	}).forEach(function (entry) {
		var full = path.join(folder, entry.name);

		if (entry.isDirectory()) files(full, base, list);
		else list.push({URL: '/' + path.relative(base, full).replace(/\\/g, '/'), File: full});
	});

	return list;
}

/*
 * The service worker of a build: the files kept when it installs, its cache named by the version of the build. With
 * update auto it takes the place of the one before at once; else it waits until the page tells it (Elemenx.Install.Apply).
 */
function worker (list, version, update) {
	return [
		'/* The service worker of an Elemenx build (elemenx build, PWA.Offline): the files of the build, offline. */',
		'var Version = \'' + version + '\';',
		'var Cache = \'elemenx-pwa-' + version + '\';',
		'var Files = ' + JSON.stringify(list) + ';',
		'',
		'self.addEventListener(\'install\', function (event) {',
		'\tevent.waitUntil(caches.open(Cache).then(function (cache) {',
		'\t\treturn cache.addAll(Files);',
		'\t})' + ((update || 'auto') === 'auto' ? '.then(function () {' : ');'),
	].concat((update || 'auto') === 'auto' ? [
		'\t\treturn self.skipWaiting();',
		'\t}));'
	] : []).concat([
		'});',
		'',
		'/* The page asks for the version of the build, or tells it to take the place of the one before now. */',
		'self.addEventListener(\'message\', function (event) {',
		'\tvar data = event.data || {};',
		'',
		'\tif (data.Type === \'elemenx-pwa-version\' && event.ports && event.ports[0])',
		'\t\tevent.ports[0].postMessage({Version: Version});',
		'',
		'\tif (data.Type === \'elemenx-pwa-apply\')',
		'\t\tself.skipWaiting();',
		'});',
		'',
		'/* The caches of the builds before this one go. */',
		'self.addEventListener(\'activate\', function (event) {',
		'\tevent.waitUntil(caches.keys().then(function (keys) {',
		'\t\treturn Promise.all(keys.filter(function (key) {',
		'\t\t\treturn key.indexOf(\'elemenx-pwa-\') === 0 && key !== Cache;',
		'\t\t}).map(function (key) {',
		'\t\t\treturn caches.delete(key);',
		'\t\t}));',
		'\t}).then(function () {',
		'\t\treturn self.clients.claim();',
		'\t}));',
		'});',
		'',
		'/* The page from the network while there is one (the page of the build without it), the files from the cache. */',
		'self.addEventListener(\'fetch\', function (event) {',
		'\tvar request = event.request;',
		'',
		'\tif (request.method !== \'GET\' || new URL(request.url).origin !== self.location.origin) return;',
		'',
		'\tif (request.mode === \'navigate\') {',
		'\t\tevent.respondWith(fetch(request).catch(function () {',
		'\t\t\treturn caches.match(\'/index.html\');',
		'\t\t}));',
		'',
		'\t\treturn;',
		'\t}',
		'',
		'\tevent.respondWith(caches.match(request).then(function (found) {',
		'\t\treturn found || fetch(request).then(function (response) {',
		'\t\t\tvar copy = response.clone();',
		'',
		'\t\t\tif (response.ok)',
		'\t\t\t\tcaches.open(Cache).then(function (cache) {',
		'\t\t\t\t\tcache.put(request, copy);',
		'\t\t\t\t});',
		'',
		'\t\t\treturn response;',
		'\t\t});',
		'\t}));',
		'});',
		''
	]).join('\n');
}

/*
 * A build made a PWA: the manifest, the page with its head, then (Offline) the worker that keeps every file of the
 * folder, its version the hash of them. Returns the files it wrote.
 */
function apply (output, pwa) {
	var index = path.join(output, 'index.html');
	var hash = crypto.createHash('sha256');
	var list;

	fs.writeFileSync(path.join(output, 'manifest.webmanifest'), manifest(pwa));
	fs.writeFileSync(index, head(fs.readFileSync(index, 'utf8'), pwa));

	if (!pwa.Offline)
		return ['manifest.webmanifest'];

	list = files(output, output).filter(function (entry) {
		return entry.URL !== '/elemenx-pwa.js';
	});

	list.forEach(function (entry) {
		hash.update(entry.URL);
		hash.update(fs.readFileSync(entry.File));
	});

	fs.writeFileSync(path.join(output, 'elemenx-pwa.js'), worker(list.filter(function (entry) {
		return fs.statSync(entry.File).size <= Precached;
	}).map(function (entry) {
		return entry.URL;
	}), hash.digest('hex').substring(0, 12), pwa.Update));

	return ['manifest.webmanifest', 'elemenx-pwa.js'];
}

module.exports = {
	Settings: settings,
	Manifest: manifest,
	Head: head,
	Worker: worker,
	Apply: apply
};
