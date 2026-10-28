'use strict';

/*
 * A build of an Application as a desktop program (Electron, elemenx build --native desktop): its production build in
 * dist/native/desktop/app, with a main script that opens it in a window and a package.json, and, when the project has
 * Electron and its packager, the program itself for the system of the build in dist/native/desktop-bin. Elemenx
 * carries neither: they are large and the project picks their versions (elemenx native add desktop installs them).
 *
 * The window loads the Application from app://bundle/: a scheme of its own, standard and secure, so the absolute paths
 * of the page (/elemenx.js), fetch and the Libraries work as from a server, and the files stay inside the folder of the
 * Application. The Router keeps its route in memory there (the page is not served over http).
 *
 * The program keeps the languages of Chromium the Application speaks (Languages: its locales/*.json, and en-US), and
 * is made, as Targets asks, into a zip of its folder, an installer and a portable program (one file) in
 * dist/native/desktop-dist; the installer and the portable program are made by electron-builder, from the program
 * the packager made.
 */

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

/* The name, the version and the window of the program: its settings, then the package.json of the project. */
function details (project, settings) {
	var file = path.join(project, 'package.json');
	var pack = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
	var name = String(settings.Name || pack.productName || pack.name || path.basename(project));

	return {
		Name: name,
		Package: name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'elemenx-application',
		Version: (/^\d+\.\d+\.\d+/.exec(String(settings.Version || pack.version || '1.0.0')) || ['1.0.0'])[0],
		Description: String(settings.Description || pack.description || ''),
		Width: Number(settings.Width) || 1200,
		Height: Number(settings.Height) || 800
	};
}

/* The features of the bridge a program has by default (Native.Desktop.Features keeps some of them). */
var Features = ['window', 'dialogs', 'menu', 'tray', 'external', 'taskbar', 'hotkeys', 'autostart', 'links', 'power', 'update', 'notifications'];

/* The schemes a program may not take for its links. */
/* The frames of a window: the one of the system, its title hidden under the page (its buttons stay), none, none and see-through. */
var Frames = ['system', 'hidden', 'none', 'transparent'];

/* The materials of the background of a window under a see-through page: Windows 11 (mica, acrylic, tabbed), and macOS (its vibrancy). */
var Materials = ['none', 'mica', 'acrylic', 'tabbed'];

var Reserved = ['http', 'https', 'file', 'ftp', 'mailto', 'data', 'javascript', 'blob', 'about', 'app', 'chrome', 'devtools', 'ws', 'wss'];

/*
 * The settings the main script reads: the name, the window and the features of the program, the scheme of its links
 * (Protocol), the feed of its versions (Update), CloseToTray and the jump list (Tasks).
 */
function native (info, settings, splash) {
	var features = settings.Features || Features;
	var result;
	var unknown = features.filter(function (feature) {
		return Features.indexOf(feature) === -1;
	});
	if (unknown.length)
		throw new Error('unknown Native.Desktop.Features: ' + unknown.join(', ') + ' (' + Features.join(', ') + ')');

	result = {Name: info.Name, Width: info.Width, Height: info.Height, Frame: frameOf(settings.Frame), Features: features};

	if (settings.Material !== undefined && settings.Material !== 'none') {
		if (Materials.indexOf(settings.Material) === -1)
			throw new Error('Native.Desktop.Material must be one of ' + Materials.join(', ') + ': ' + settings.Material);

		result.Material = settings.Material;
	}

	if (settings.Protocol !== undefined) {
		if (!/^[a-z][a-z0-9+.-]*$/.test(String(settings.Protocol)) || Reserved.indexOf(String(settings.Protocol)) !== -1)
			throw new Error('Native.Desktop.Protocol must be a scheme of the program of its own, as myapp: ' + settings.Protocol);

		result.Protocol = String(settings.Protocol);
	}

	/* The color of the window before the page paints: the one of the splash, so it opens without a white flash. */
	if (splash && splash.Background && !/var\(/i.test(splash.Background))
		result.Background = splash.Background;

	/* Closing the window hides the program in its tray, while it has an icon there. */
	if (settings.CloseToTray)
		result.CloseToTray = true;

	/* The jump list of the program on Windows: [{ID, Label, Description}], each a task the page hears (Platform.Tasks, the task event). */
	if (settings.Tasks !== undefined) {
		if (!Array.isArray(settings.Tasks) || settings.Tasks.some(function (task) {
			return !task || !/^[\w-]+$/.test(String(task.ID || '')) || !String(task.Label || '').trim();
		}))
			throw new Error('Native.Desktop.Tasks must be a list of tasks {ID, Label, Description}, an ID of letters, digits, _ and -');

		result.Tasks = settings.Tasks.map(function (task) {
			return {ID: String(task.ID), Label: String(task.Label).trim(), Description: String(task.Description || '')};
		});
	}

	if (settings.Update !== undefined) {
		if (!/^https:\/\/[^\s]+$/i.test(String(settings.Update)))
			throw new Error('Native.Desktop.Update must be an https URL: ' + settings.Update);

		result.Update = String(settings.Update);
	}

	return result;
}

/* The package.json of a project module (electron, @electron/packager), or null when the project has not installed it. */
var installed = require('./common.js').installed;
var Zip = require('./zip.js');
var AppIcon = require('./appicon.js');

/* What a program is made into besides its folder (Native.Desktop.Targets). */
var Targets = ['zip', 'installer', 'portable'];

/* The targets of electron-builder for each system: an installer, a portable program. */
var Builders = {
	win32: {Flag: '--win', installer: 'nsis', portable: 'portable'},
	linux: {Flag: '--linux', installer: 'deb', portable: 'AppImage'},
	darwin: {Flag: '--mac', installer: 'dmg', portable: null}
};

/* The targets of the settings, checked: [] by default (the folder of the program alone). */
function targetsOf (settings) {
	var targets = settings.Targets === undefined ? [] : settings.Targets;
	if (!Array.isArray(targets) || targets.some(function (target) {
		return Targets.indexOf(target) === -1;
	}))
		throw new Error('Native.Desktop.Targets must be a list of ' + Targets.join(', ') + ': ' + JSON.stringify(targets));

	return targets;
}

/*
 * The languages of Chromium a program keeps (its menus of the system, its dialogs of the page): Languages of the
 * settings ('all' keeps every one), or the ones of the locales of the Application; en-US always.
 */
function languagesOf (project, settings) {
	var folder = path.join(project, 'locales');
	var languages = settings.Languages;
	if (languages === 'all') return null;

	if (languages === undefined)
		languages = fs.existsSync(folder) ? fs.readdirSync(folder).filter(function (name) {
			return /\.json$/i.test(name);
		}).map(function (name) {
			return name.replace(/\.json$/i, '');
		}) : [];

	if (!Array.isArray(languages) || languages.some(function (language) {
		return !/^[A-Za-z]{2,3}(-[A-Za-z0-9]+)?$/.test(String(language));
	}))
		throw new Error('Native.Desktop.Languages must be all or a list of languages, as ru or pt-BR: ' + JSON.stringify(languages));

	return ['en-US'].concat(languages.map(String));
}

/*
 * The files of the languages of Chromium a program does not speak, taken away (Windows and Linux: locales/*.pak; a
 * language keeps its regions too, pt the pak of pt-BR and pt-PT). The names taken away.
 */
function trimLanguages (program, languages) {
	var folder = path.join(program, 'locales');
	var removed = [];

	if (!languages || !fs.existsSync(folder)) return removed;

	fs.readdirSync(folder).forEach(function (name) {
		var language = name.replace(/\.pak$/i, '');
		var kept = languages.some(function (wanted) {
			return language.toLowerCase() === wanted.toLowerCase() || language.toLowerCase().indexOf(wanted.toLowerCase() + '-') === 0;
		});
		if (kept || !/\.pak$/i.test(name)) return;

		fs.unlinkSync(path.join(folder, name));

		removed.push(language);
	});

	return removed;
}

/* The files of a folder for a zip, with their modes (the programs of Linux keep the right to run). */
function entries (folder, base, list) {
	list = list || [];

	fs.readdirSync(folder, {withFileTypes: true}).sort(function (a, b) {
		return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
	}).forEach(function (entry) {
		var full = path.join(folder, entry.name);

		if (entry.isDirectory()) entries(full, base, list);
		else list.push({Name: path.relative(base, full).replace(/\\/g, '/'), Data: fs.readFileSync(full), Mode: fs.statSync(full).mode & 511});
	});

	return list;
}

/*
 * The program made into what Targets asks, in output: a zip of its folder (on macOS by ditto, which keeps the links of
 * its bundle), an installer and a portable program by electron-builder (missing: what to type). The files made.
 */
function make (program, output, folder, project, info, platform, arch, targets, electron, icons) {
	var made = [];
	var builder;
	var kinds;
	var config;
	var binary;
	var run;
	var zip;

	/* What an earlier build made goes, as the folder of the program does. */
	fs.rmSync(output, {recursive: true, force: true, maxRetries: 10, retryDelay: 300});

	if (!targets.length) return made;

	fs.mkdirSync(output, {recursive: true});

	if (targets.indexOf('zip') !== -1) {
		zip = path.join(output, info.Package + '-' + info.Version + '-' + platform + '-' + arch + '.zip');

		if (platform === 'darwin') {
			run = childProcess.spawnSync('ditto', ['-c', '-k', '--keepParent', program, zip], {encoding: 'utf8'});

			if (run.status !== 0)
				throw new Error('Elemenx Builder: a zip of a program of macOS is made on macOS (ditto): ' + (run.stderr || run.error || ''));
		}
		else {
			fs.writeFileSync(zip, Zip.Archive(entries(program, path.dirname(program)), 6));
		}

		made.push(zip);
	}

	kinds = ['installer', 'portable'].filter(function (kind) {
		return targets.indexOf(kind) !== -1 && Builders[platform] && Builders[platform][kind];
	});

	if (!kinds.length) return made;

	builder = installed(project, 'electron-builder');

	if (!builder) {
		process.stdout.write([
			'',
			'Elemenx Builder: an installer and a portable program are made by electron-builder, which this project has not:',
			'',
			'       cd ' + (path.relative(process.cwd(), project) || '.'),
			'       npm install --save-dev electron-builder',
			'',
			'and build again.',
			''
		].join('\n'));

		return made;
	}

	config = {
		appId: 'dev.elemenx.' + info.Package.replace(/[^a-z0-9]+/g, ''),
		productName: info.Name,
		electronVersion: electron.Package.version,
		directories: {output: output},
		nsis: {oneClick: false, allowToChangeInstallationDirectory: true, artifactName: '${productName}-${version}-setup.${ext}'},
		portable: {artifactName: '${productName}-${version}-portable.${ext}'},
		linux: {maintainer: info.Name, category: 'Utility', icon: icons && icons.Linux},
		win: {icon: icons && icons.Windows},
		mac: {icon: icons && icons.Mac},
		publish: null
	};

	fs.writeFileSync(path.join(folder, 'electron-builder.json'), JSON.stringify(config, null, '\t') + '\n');

	binary = builder.Package.bin;
	binary = path.join(path.dirname(builder.File), typeof binary === 'string' ? binary : binary['electron-builder']);

	run = childProcess.spawnSync(process.execPath, [
		binary,
		'--prepackaged', program,
		'--projectDir', folder,
		'--config', path.join(folder, 'electron-builder.json'),
		Builders[platform].Flag
	].concat(kinds.map(function (kind) {
		return Builders[platform][kind];
	}), ['--' + arch]), {cwd: project, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});

	if (run.status !== 0)
		throw new Error('electron-builder failed:\n' + (run.stderr || run.stdout || run.error || ''));

	/* What electron-builder leaves besides the programs: its log and the map of the blocks for its own updates. */
	fs.readdirSync(output).forEach(function (name) {
		if (name === 'builder-debug.yml' || /\.blockmap$/.test(name))
			fs.rmSync(path.join(output, name), {force: true});
	});

	fs.readdirSync(output).forEach(function (name) {
		if (/-(setup|portable)\.exe$|\.(deb|AppImage|dmg)$/.test(name))
			made.push(path.join(output, name));
	});

	return made;
}

/* What to type to get a program, when the project has not Electron or its packager: command builds it again. */
function guide (project, folder, bin, missing, command) {
	var relative = path.relative(process.cwd(), folder) || '.';
	var where = path.relative(process.cwd(), project) || '.';

	return [
		'',
		'Elemenx Builder: the Application is ready for Electron in ' + relative + ', but it is not a program yet.',
		'To make a program you can run, this project needs Electron and its packager (missing: ' + missing.join(', ') + ').',
		'',
		'1. Install them in the project, once (it downloads Electron, about 100 MB):',
		'',
		'       cd ' + where,
		'       npx elemenx native add desktop',
		'',
		'   (the same as: npm install --save-dev electron @electron/packager)',
		'',
		'2. Build again; the program for this system is then made in ' + path.relative(project, bin).replace(/\\/g, '/') + ':',
		'',
		'       ' + command,
		'',
		'To try the Application without making a program (after step 1):',
		'',
		'       npx electron ' + path.relative(project, folder).replace(/\\/g, '/'),
		''
	].join('\n');
}

/* The frame of the windows: Native.Desktop.Frame, true and false as system and none. */
function frameOf (frame) {
	if (frame === undefined || frame === true) return 'system';

	if (frame === false) return 'none';

	if (Frames.indexOf(frame) === -1)
		throw new Error('Native.Desktop.Frame must be one of ' + Frames.join(', ') + ': ' + frame);

	return frame;
}

/*
 * The program of the production build in source, written to folder (dist/native/desktop): its main script,
 * package.json and app/, then, with Electron and the packager in the project, the program for this system (or
 * Platform and Arch of the settings) in bin (dist/native/desktop-bin). settings: Name, Version, Description, Width,
 * Height, Frame (system, hidden: the title bar of the system hidden under the page, its buttons staying; none, or false:
 * no frame, the Application draws its own; transparent: none, and see-through), Material (mica, acrylic or tabbed under a
 * see-through page), Features (of the bridge, all by default), Protocol (the scheme of the
 * links that open the program: myapp://...), Update (the https URL of the feed of its versions), Platform, Arch.
 * Returns {Folder, Program} (Program null when the project lacks them), and writes the guide when it does.
 */
function pack (source, folder, bin, project, settings, command, splash, icon) {
	var info = details(project, settings || {});
	var program = native(info, settings || {}, splash);
	var targets = targetsOf(settings || {});
	var languages = languagesOf(project, settings || {});
	var platform = (settings && settings.Platform) || process.platform;
	var arch = (settings && settings.Arch) || process.arch;
	var made;
	var removed;
	var icons;
	var electron = installed(project, 'electron');
	var packager = installed(project, '@electron/packager');
	var missing = [];
	var command;
	var run;
	var binary;

	fs.renameSync(source, path.join(folder, 'app'));

	/* The icon of the program, of its installer and of its windows (see appicon.js). */
	icons = AppIcon.Desktop(icon, folder);

	if (icons.Window)
		program.Icon = icons.Window;

	fs.copyFileSync(path.join(__dirname, 'electron', 'main.js'), path.join(folder, 'main.js'));
	fs.copyFileSync(path.join(__dirname, 'electron', 'preload.js'), path.join(folder, 'preload.js'));
	fs.writeFileSync(path.join(folder, 'elemenx-native.json'), JSON.stringify(program, null, '\t') + '\n');
	fs.writeFileSync(path.join(folder, 'package.json'), JSON.stringify({name: info.Package, productName: info.Name, version: info.Version, description: info.Description, main: 'main.js', private: true}, null, '\t') + '\n');

	if (!electron)
		missing.push('electron');

	if (!packager)
		missing.push('@electron/packager');

	if (missing.length) {
		process.stdout.write(guide(project, folder, bin, missing, command || 'npx elemenx build --native desktop'));

		return {Folder: folder, Program: null};
	}

	binary = packager.Package.bin;
	command = path.join(path.dirname(packager.File), typeof binary === 'string' ? binary : binary[Object.keys(binary)[0]]);

	/* A program that has just quit may hold its files a moment longer (Windows): the removal tries again. */
	fs.rmSync(bin, {recursive: true, force: true, maxRetries: 10, retryDelay: 300});

	run = childProcess.spawnSync(process.execPath, [
		command,
		folder,
		info.Name,
		'--out=' + bin,
		'--overwrite',
		'--electron-version=' + electron.Package.version,
		'--platform=' + platform,
		'--arch=' + arch
	].concat(program.Protocol ? ['--protocol=' + program.Protocol, '--protocol-name=' + info.Name] : [], icons[{win32: 'Windows', darwin: 'Mac', linux: 'Linux'}[platform]] ? ['--icon=' + icons[{win32: 'Windows', darwin: 'Mac', linux: 'Linux'}[platform]]] : []), {cwd: project, encoding: 'utf8'});

	if (run.status !== 0)
		throw new Error('Electron packager failed:\n' + (run.stderr || run.stdout || run.error || ''));

	process.stdout.write('Elemenx Builder: the program is in ' + bin + '\n');

	removed = trimLanguages(path.join(bin, info.Name + '-' + platform + '-' + arch), languages);

	if (removed.length)
		process.stdout.write('Elemenx Builder: the program speaks ' + languages.join(', ') + ' (Native.Desktop.Languages: all keeps the other ' + removed.length + ')\n');

	made = make(path.join(bin, info.Name + '-' + platform + '-' + arch), path.join(path.dirname(bin), 'desktop-dist'), folder, project, info, platform, arch, targets, electron, icons);

	made.forEach(function (file) {
		process.stdout.write('Elemenx Builder: ' + file + '\n');
	});

	return {Folder: folder, Program: bin, Made: made};
}

module.exports = {
	Pack: pack,
	Targets: Targets,
	Features: Features,
	Guide: guide
};
