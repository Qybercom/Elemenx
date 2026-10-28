'use strict';

/*
 * A build of an Application as a mobile program (Capacitor: Android and iOS): its production build in
 * dist/native/mobile, the web folder of a Capacitor project whose root is the project itself (capacitor.config.json,
 * android/ and ios/ next to package.json, as Capacitor makes them). With Capacitor in the project the build adds the
 * platforms it has installed and syncs them; the program itself is then built by Android Studio or Xcode (npx cap
 * open android, npx cap run android). Elemenx carries neither: the project picks their versions (elemenx native add
 * mobile installs them).
 *
 * The page reaches the device through the bridge of elemenx-native.js (window.ElemenxNative, Platform 'capacitor'),
 * which the Platform Service of ElemenxUI uses: links in the browser of the system (@capacitor/browser), messages
 * (@capacitor/dialog), files saved in the Documents of the device (@capacitor/filesystem), the links of the scheme of
 * the program and the pause and resume of the program (@capacitor/app). Files are opened with the picker of the web view.
 */

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

/* The platforms a build may make. */
var Platforms = ['android', 'ios'];

/* The package.json of a module of the project, or null when it is not installed. */
var installed = require('./common.js').installed;
var AppIcon = require('./appicon.js');

/* The words of Java, which Android takes in no part of the ID of a program (it is the package of its code). */
var Keywords = ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'false', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'void', 'volatile', 'while'];

/*
 * The name and the ID of the program: its settings, then the package.json of the project. An ID made of the name
 * never ends with a word of Java (native: nativeapp).
 */
function details (project, settings) {
	var file = path.join(project, 'package.json');
	var pack = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
	var name = String(settings.Name || pack.productName || pack.name || path.basename(project));
	var last = name.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/^[0-9]+/, '') || 'application';
	var id = String(settings.AppID || 'com.example.' + (Keywords.indexOf(last) === -1 ? last : last + 'app'));
	var taken;

	if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(id))
		throw new Error('Native.Mobile.AppID must be a reverse domain name, as com.example.app: ' + id);

	taken = id.split('.').filter(function (part) {
		return Keywords.indexOf(part) !== -1;
	});

	if (taken.length)
		throw new Error('Native.Mobile.AppID holds a word of Java, which Android does not take in an ID (' + taken.join(', ') + '): ' + id);

	return {Name: name, AppID: id};
}

/* What to type to get the programs, when the project has not Capacitor. */
function guide (project, folder, missing, command) {
	var where = path.relative(process.cwd(), project) || '.';

	return [
		'',
		'Elemenx Builder: the Application is ready for Capacitor in ' + (path.relative(process.cwd(), folder) || '.') + ', but it has no mobile projects yet.',
		'To make the Android and iOS programs, this project needs Capacitor (missing: ' + missing.join(', ') + ').',
		'',
		'1. Install it in the project, once:',
		'',
		'       cd ' + where,
		'       npx elemenx native add mobile',
		'',
		'2. Build again: the build adds the platforms and copies the Application into them:',
		'',
		'       ' + command,
		'',
		'3. Open a platform in its IDE (Android Studio, Xcode on a Mac) and build or run the program there:',
		'',
		'       npx cap open android',
		'       npx cap run android',
		''
	].join('\n');
}

/* Runs the Capacitor CLI of the project there. */
function cap (project, cli, args) {
	var binary = cli.Package.bin;
	var script = path.join(path.dirname(cli.File), typeof binary === 'string' ? binary : binary.cap || binary[Object.keys(binary)[0]]);
	var run = childProcess.spawnSync(process.execPath, [script].concat(args), {cwd: project, encoding: 'utf8'});
	if (run.status !== 0)
		throw new Error('Capacitor ' + args.join(' ') + ' failed:\n' + (run.stderr || run.stdout || run.error || ''));

	return run.stdout;
}

/*
 * The mobile build of the production build in source, written to folder (dist/native/mobile), the bridge of Native
 * put into its page; capacitor.config.json made in the project when it has none. settings: Name, AppID, Platforms
 * (['android', 'ios'] by default). Returns {Folder, Platforms (the ones synced)}.
 */
/* The color of a splash as the systems of the phones take it: #rrggbb (or #rrggbbaa), else null. */
function hex (splash) {
	return splash && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(splash.Background) ? splash.Background : null;
}

/*
 * The screen Android shows while the program starts (12 and later: its icon on the background of the launch theme)
 * in the color of the splash: windowSplashScreenBackground of AppTheme.NoActionBarLaunch, as Capacitor makes it, set
 * again on each build (no other line of the file changes).
 */
function tint (project, splash) {
	var file = path.join(project, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');
	var color = hex(splash);
	var text;
	var next;

	if (!color || !fs.existsSync(file)) return;

	text = fs.readFileSync(file, 'utf8');
	next = text.replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)([\s\S]*?)(\s*<\/style>)/, function (all, open, body, close) {
		var item = '<item name="windowSplashScreenBackground">' + color + '</item>';

		if (/<item name="windowSplashScreenBackground">[^<]*<\/item>/.test(body))
			return open + body.replace(/<item name="windowSplashScreenBackground">[^<]*<\/item>/, item) + close;

		return open + body + '\n        ' + item + close;
	});

	if (next !== text)
		fs.writeFileSync(file, next);
}

function pack (source, folder, project, settings, command, splash, icon) {
	var info = details(project, settings || {});
	var config = path.join(project, 'capacitor.config.json');
	var webDir = path.relative(project, folder).replace(/\\/g, '/');
	var wanted = (settings && settings.Platforms) || Platforms;
	var cli = installed(project, '@capacitor/cli');
	var core = installed(project, '@capacitor/core');
	var index = path.join(folder, 'index.html');
	var missing = [];
	var synced = [];
	var html;

	wanted.forEach(function (platform) {
		if (Platforms.indexOf(platform) === -1)
			throw new Error('unknown Native.Mobile.Platforms: ' + platform + ' (' + Platforms.join(', ') + ')');
	});

	fs.rmSync(folder, {recursive: true, force: true});
	fs.mkdirSync(path.dirname(folder), {recursive: true});
	fs.renameSync(source, folder);

	fs.copyFileSync(path.join(__dirname, 'capacitor', 'bridge.js'), path.join(folder, 'elemenx-native.js'));

	if (fs.existsSync(index)) {
		html = fs.readFileSync(index, 'utf8');

		fs.writeFileSync(index, /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (head) {
			return head + '\n\t<script src="elemenx-native.js"></script>';
		}) : '<script src="elemenx-native.js"></script>\n' + html);
	}

	if (!fs.existsSync(config)) {
		fs.writeFileSync(config, JSON.stringify(Object.assign({appId: info.AppID, appName: info.Name, webDir: webDir}, splash ? {
			/* The web view, before the page paints, and the screen of the system while the program starts, in the color of the splash; the page hides the screen once it shows its own. */
			backgroundColor: hex(splash) || '#ffffff',
			plugins: {SplashScreen: {launchAutoHide: false, launchShowDuration: 0, backgroundColor: hex(splash) || '#ffffff'}}
		} : {}), null, '\t') + '\n');
	}
	else if (JSON.parse(fs.readFileSync(config, 'utf8')).webDir !== webDir) {
		process.stdout.write('Elemenx Builder: capacitor.config.json has another webDir; set it to "' + webDir + '" for the build to reach the programs\n');
	}

	if (!cli)
		missing.push('@capacitor/cli');

	if (!core)
		missing.push('@capacitor/core');

	if (missing.length) {
		process.stdout.write(guide(project, folder, missing.concat(wanted.map(function (platform) {
			return '@capacitor/' + platform;
		}).filter(function (name) {
			return !installed(project, name);
		})), command));

		return {Folder: folder, Platforms: []};
	}

	wanted.forEach(function (platform) {
		if (!installed(project, '@capacitor/' + platform)) return;

		if (!fs.existsSync(path.join(project, platform)))
			cap(project, cli, ['add', platform]);

		synced.push(platform);
	});

	if (synced.length)
		cap(project, cli, ['sync']);

	if (splash && synced.indexOf('android') !== -1)
		tint(project, splash);

	/* The icons of the programs, on the background of the splash (see appicon.js). */
	if (icon && synced.length)
		AppIcon.Mobile(icon, project, splash && splash.Background);

	process.stdout.write('Elemenx Builder: the mobile programs are ready to build: ' + (synced.length ? synced.join(', ') + ' (npx cap open ' + synced[0] + ')' : 'no platform installed (npx elemenx native add mobile)') + '\n');

	return {Folder: folder, Platforms: synced};
}

module.exports = {
	Pack: pack,
	Platforms: Platforms,
	Guide: guide
};
