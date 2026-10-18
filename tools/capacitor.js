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
 * which the Native Service of ElemenxUI uses: links in the browser of the system (@capacitor/browser), messages
 * (@capacitor/dialog), the links of the scheme of the program and the pause and resume of the program (@capacitor/app).
 */

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

/* The platforms a build may make. */
var Platforms = ['android', 'ios'];

/* The package.json of a module of the project, or null when it is not installed. */
function installed (project, name) {
	try {
		var file = require.resolve(name + '/package.json', {paths: [project]});

		return {File: file, Package: JSON.parse(fs.readFileSync(file, 'utf8'))};
	}
	catch (error) {
		return null;
	}
}

/* The name and the ID of the program: its settings, then the package.json of the project. */
function details (project, settings) {
	var file = path.join(project, 'package.json');
	var pack = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
	var name = String(settings.Name || pack.productName || pack.name || path.basename(project));
	var id = String(settings.AppID || 'com.example.' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'application'));
	if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(id))
		throw new Error('Native.Mobile.AppID must be a reverse domain name, as com.example.app: ' + id);

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
function pack (source, folder, project, settings, command) {
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
		fs.writeFileSync(config, JSON.stringify({appId: info.AppID, appName: info.Name, webDir: webDir}, null, '\t') + '\n');
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

	process.stdout.write('Elemenx Builder: the mobile programs are ready to build: ' + (synced.length ? synced.join(', ') + ' (npx cap open ' + synced[0] + ')' : 'no platform installed (npx elemenx native add mobile)') + '\n');

	return {Folder: folder, Platforms: synced};
}

module.exports = {
	Pack: pack,
	Platforms: Platforms,
	Guide: guide
};
