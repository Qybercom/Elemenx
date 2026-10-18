'use strict';

/*
 * A build of an Application as a browser extension (Manifest V3): the files of its production build with its
 * expressions precompiled (the policy of an extension forbids eval), a manifest and, for some surfaces, a background
 * script. One folder and one zip for Chrome (Edge and Vivaldi take it too) and one for Firefox, whose manifest differs.
 *
 * The Application shows on a surface: 'popup' (the window of the button of the extension, by default), 'tab' (a tab of
 * its own, opened by the button) or 'side' (the side panel of Chrome, the sidebar of Firefox).
 */

var fs = require('fs');
var path = require('path');
var common = require('./common.js');
var Zip = require('./zip.js');
var fail = common.fail;

var Surfaces = ['popup', 'tab', 'side'];
var Browsers = ['chrome', 'firefox'];

/* The name, the description and the version of the extension: its settings, then the package.json of the project. */
function details (project, settings) {
	var file = path.join(project, 'package.json');
	var pack = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
	var version = String(settings.Version || pack.version || '1.0.0');

	return {
		Name: String(settings.Name || pack.productName || pack.name || path.basename(project)),
		Description: String(settings.Description || pack.description || ''),
		Version: (/^\d+(\.\d+){0,3}/.exec(version) || ['1.0.0'])[0],
		ID: settings.ID || (String(pack.name || path.basename(project)).replace(/[^a-z0-9._-]+/gi, '-') + '@elemenx.extension')
	};
}

/* The icons of the extension by size: Icons of the settings, or icon.png of the build for every size. */
function icons (folder, settings) {
	if (settings.Icons)
		return settings.Icons;

	if (!fs.existsSync(path.join(folder, 'icon.png'))) return null;

	return {16: 'icon.png', 32: 'icon.png', 48: 'icon.png', 128: 'icon.png'};
}

/* The background script of a surface: the button opens the tab or the side panel. A popup needs none. */
function background (browser, surface) {
	var api = browser === 'firefox' ? 'browser' : 'chrome';

	if (surface === 'tab')
		return api + '.action.onClicked.addListener(function () {\n\t' + api + '.tabs.create({url: ' + api + '.runtime.getURL(\'index.html\')});\n});\n';

	if (surface === 'side' && browser === 'firefox')
		return 'browser.action.onClicked.addListener(function () {\n\tbrowser.sidebarAction.toggle();\n});\n';

	if (surface === 'side')
		return 'chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch(function () {});\n';

	return null;
}

/* The manifest of a browser and a surface; Manifest of the settings adds to it (its keys win). */
function manifest (browser, surface, info, settings, iconSet) {
	var result = {
		manifest_version: 3,
		name: info.Name,
		version: info.Version,
		description: info.Description,
		action: {default_title: info.Name}
	};
	var extra = settings.Manifest || {};
	var key;

	if (iconSet) {
		result.icons = iconSet;
		result.action.default_icon = iconSet;
	}

	if (surface === 'popup')
		result.action.default_popup = 'index.html';

	if (surface === 'side' && browser === 'chrome') {
		result.side_panel = {default_path: 'index.html'};
		result.permissions = ['sidePanel'];
	}

	if (surface === 'side' && browser === 'firefox')
		result.sidebar_action = {default_panel: 'index.html', default_title: info.Name};

	if (background(browser, surface))
		result.background = browser === 'firefox' ? {scripts: ['background.js']} : {service_worker: 'background.js'};

	if (browser === 'firefox')
		result.browser_specific_settings = {gecko: {id: info.ID}};

	for (key in extra) {
		if (Object.prototype.hasOwnProperty.call(extra, key))
			result[key] = extra[key];
	}

	return result;
}

/* An inline script of the page would not run in an extension (its policy forbids it): the build stops on it. */
function checkPage (folder) {
	var page = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
	var pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
	var match;

	while ((match = pattern.exec(page))) {
		if (/\bsrc\s*=/i.test(match[1]) || !match[2].trim()) continue;

		if (/\btype\s*=\s*["']?(application\/(ld\+)?json|importmap|text\/template)/i.test(match[1])) continue;

		fail('an extension cannot run the inline script of index.html (its Content-Security-Policy forbids it): move it into a file');
	}
}

function copy (source, target) {
	fs.mkdirSync(target, {recursive: true});

	fs.readdirSync(source, {withFileTypes: true}).forEach(function (entry) {
		var from = path.join(source, entry.name);
		var to = path.join(target, entry.name);

		if (entry.isDirectory()) copy(from, to);
		else fs.copyFileSync(from, to);
	});
}

/*
 * The extension of the production build in folder, written to target: target/chrome and target/firefox, and a zip of
 * each. settings: Surface, Name, Description, Version, ID (the id of Firefox), Icons, Manifest. Returns the folders.
 */
function pack (folder, target, project, settings) {
	var surface = settings.Surface || 'popup';
	var info;
	var iconSet;
	var result = {};

	if (Surfaces.indexOf(surface) === -1)
		fail('extension surface must be popup, tab or side: ' + surface);

	checkPage(folder);

	info = details(project, settings);
	iconSet = icons(folder, settings);

	Browsers.forEach(function (browser) {
		var directory = path.join(target, browser);
		var script = background(browser, surface);

		fs.rmSync(directory, {recursive: true, force: true});

		copy(folder, directory);

		fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest(browser, surface, info, settings, iconSet), null, '\t') + '\n');

		if (script)
			fs.writeFileSync(path.join(directory, 'background.js'), script);

		Zip.Directory(directory, path.join(target, browser + '.zip'));

		result[browser === 'chrome' ? 'Chrome' : 'Firefox'] = directory;
	});

	return result;
}

module.exports = {
	Pack: pack,
	Manifest: manifest,
	Surfaces: Surfaces
};
