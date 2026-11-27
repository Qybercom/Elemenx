'use strict';

/*
 * A build of an Application as the interface of an Android program of its own (elemenx build --native
 * android-library): a module of Gradle in dist/native/android-library/<Module> (elemenx by default) to include in
 * the project of the program. It holds the production build in its assets (assets/elemenx, with the bridge
 * elemenx-android.js first in the page) and ElemenxView, a WebView that serves them at
 * https://appassets.androidplatform.net/ and answers the Platform Service of ElemenxUI with the handlers the program
 * registers in Java or Kotlin. Native.Android of elemenx.config.js: Package (the Java package and the namespace of
 * the module, dev.elemenx.ui by default), Module (the name of its folder), Schemes (those a link out of the Application
 * opens: http, https, mailto, tel, sms, geo and market by default; intent, file, content, javascript, data and blob
 * never). Nothing is built here: the program builds the module with its own Gradle.
 */

var fs = require('fs');
var path = require('path');

/* The version of androidx.webkit the module asks for (WebViewAssetLoader). */
var Webkit = '1.14.0';

/* The schemes a link out of the Application opens by default, and those it never opens (they reach into the system). */
var Schemes = ['http', 'https', 'mailto', 'tel', 'sms', 'geo', 'market'];

var Never = ['intent', 'file', 'content', 'javascript', 'data', 'blob'];

var Keywords = ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'false', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'void', 'volatile', 'while'];

/* The settings, checked: {Package, Module, Schemes}. */
function settingsOf (settings) {
	var value = settings || {};
	var pack = String(value.Package || 'dev.elemenx.ui');
	var module = String(value.Module || 'elemenx');
	var schemes = value.Schemes === undefined ? Schemes : value.Schemes;

	if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(pack) || pack.split('.').some(function (part) {
		return Keywords.indexOf(part) !== -1;
	}))
		throw new Error('Native.Android.Package must be a Java package of two words or more, as com.example.ui: ' + pack);

	if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(module))
		throw new Error('Native.Android.Module must be a name of letters, digits, _ and -: ' + module);

	if (!Array.isArray(schemes) || schemes.some(function (scheme) {
		return !/^[a-z][a-z0-9+.-]*$/.test(String(scheme));
	}))
		throw new Error('Native.Android.Schemes must be a list of schemes in small letters, as ["https", "tel"]: ' + JSON.stringify(schemes));

	schemes.forEach(function (scheme) {
		if (Never.indexOf(scheme) !== -1)
			throw new Error('Native.Android.Schemes cannot open ' + scheme + ': (' + Never.join(', ') + ') reach into the system');
	});

	return {Package: pack, Module: module, Schemes: schemes};
}

function template (name, info) {
	return fs.readFileSync(path.join(__dirname, 'android-library', name), 'utf8').replace(/__PACKAGE__/g, info.Package).replace(/__WEBKIT__/g, Webkit).replace(/__SCHEMES__/g, (info.Schemes || Schemes).map(function (scheme) {
		return JSON.stringify(scheme);
	}).join(', '));
}

/* The page with the bridge first in its head: window.ElemenxNative is there before the framework starts. */
function bridged (html) {
	var tag = '<script src="/elemenx-android.js"></script>';
	if (html.indexOf(tag) !== -1) return html;

	return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (head) {
		return head + '\n\t' + tag;
	}) : tag + '\n' + html;
}

/* How the program takes the module: settings.gradle, its build.gradle, its code. */
function guide (info) {
	var simple = info.Package + '.ElemenxView';

	return [
		'# The interface of the Application for an Android program',
		'',
		'`' + info.Module + '/` is a module of Gradle (made by `elemenx build --native android-library`): the Application in its assets and `' + simple + '`, the view that shows it and answers it.',
		'',
		'1. Copy or point to the folder in the project of the program, in `settings.gradle`:',
		'',
		'   ```gradle',
		'   include \':' + info.Module + '\'',
		'   project(\':' + info.Module + '\').projectDir = file(\'path/to/' + info.Module + '\')',
		'   ```',
		'',
		'2. Depend on it in the `build.gradle` of the app: `implementation project(\':' + info.Module + '\')`.',
		'',
		'3. Show the view and answer the Application (Kotlin):',
		'',
		'   ```kotlin',
		'   val view = ElemenxView(this)',
		'   view.setFeatures("dialogs")',
		'   view.handle("server.start") { args -> server.start(args.optInt("Port", 8080)); "started" }',
		'   view.handleAsync("message") { args, reply -> showDialog(args.optString("Text")) { index -> reply.resolve(index) } }',
		'   setContentView(view)',
		'   view.load()',
		'   view.emit("server", mapOf("State" to "running"))',
		'   ```',
		'',
		'   In the page the Platform Service of ElemenxUI asks it: `Platform.Ask(\'server.start\', {Port: 8080}, callback)` and its features (`message`, `external`...), `Native.On(\'server\', callback)` hears `emit`. A call the program has no handler for, the Service does as on the web.',
		'',
		'The page is https://appassets.androidplatform.net/ (its absolute paths, its Router, `fetch` and its workers work), a link out of it opens in the program of the system for its scheme (http, https, mailto, tel, sms, geo and market; `Native.Android.Schemes` of the build or `setSchemes`). Only the frames of the Application reach the program: a frame of another origin in it has no door. Build again with `elemenx build --native android-library`: the module is made again, the program keeps its code.',
		''
	].join('\n');
}

/*
 * The module of the build in source: its assets (the build, moved), the bridge, ElemenxView in its package, its
 * Gradle files and its guide. Returns {Folder, Module}.
 */
function pack (source, folder, settings) {
	var info = settingsOf(settings);
	var module = path.join(folder, info.Module);
	var main = path.join(module, 'src', 'main');
	var assets = path.join(main, 'assets', 'elemenx');
	var code = path.join(main, 'java', info.Package.replace(/\./g, path.sep));
	var index;

	fs.rmSync(module, {recursive: true, force: true});
	fs.mkdirSync(path.dirname(assets), {recursive: true});
	fs.renameSync(source, assets);

	fs.copyFileSync(path.join(__dirname, 'android-library', 'bridge.js'), path.join(assets, 'elemenx-android.js'));

	index = path.join(assets, 'index.html');

	if (fs.existsSync(index))
		fs.writeFileSync(index, bridged(fs.readFileSync(index, 'utf8')));

	fs.mkdirSync(code, {recursive: true});

	fs.writeFileSync(path.join(code, 'ElemenxView.java'), template('ElemenxView.java', info));
	fs.writeFileSync(path.join(module, 'build.gradle'), template('build.gradle', info));
	fs.writeFileSync(path.join(module, 'consumer-rules.pro'), '# The door of the page to the program is a listener of messages (androidx.webkit): nothing of it is called by name.\n');
	fs.writeFileSync(path.join(main, 'AndroidManifest.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" />\n');
	fs.writeFileSync(path.join(folder, 'README.md'), guide(info));

	process.stdout.write('Elemenx Builder: the Android module ' + module + ' (' + info.Package + '.ElemenxView; see ' + path.join(folder, 'README.md') + ')\n');

	return {Folder: folder, Module: module};
}

module.exports = {
	Pack: pack,
	Settings: settingsOf,
	Bridged: bridged
};
