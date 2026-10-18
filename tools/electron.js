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
var Features = ['window', 'dialogs', 'menu', 'tray', 'external', 'taskbar', 'hotkeys', 'autostart', 'links', 'power', 'update'];

/* The schemes a program may not take for its links. */
var Reserved = ['http', 'https', 'file', 'ftp', 'mailto', 'data', 'javascript', 'blob', 'about', 'app', 'chrome', 'devtools', 'ws', 'wss'];

/*
 * The settings the main script reads: the name, the window and the features of the program, the scheme of its links
 * (Protocol) and the feed of its versions (Update).
 */
function native (info, settings) {
	var features = settings.Features || Features;
	var result;
	var unknown = features.filter(function (feature) {
		return Features.indexOf(feature) === -1;
	});
	if (unknown.length)
		throw new Error('unknown Native.Desktop.Features: ' + unknown.join(', ') + ' (' + Features.join(', ') + ')');

	result = {Name: info.Name, Width: info.Width, Height: info.Height, Frame: settings.Frame !== false, Features: features};

	if (settings.Protocol !== undefined) {
		if (!/^[a-z][a-z0-9+.-]*$/.test(String(settings.Protocol)) || Reserved.indexOf(String(settings.Protocol)) !== -1)
			throw new Error('Native.Desktop.Protocol must be a scheme of the program of its own, as myapp: ' + settings.Protocol);

		result.Protocol = String(settings.Protocol);
	}

	if (settings.Update !== undefined) {
		if (!/^https:\/\/[^\s]+$/i.test(String(settings.Update)))
			throw new Error('Native.Desktop.Update must be an https URL: ' + settings.Update);

		result.Update = String(settings.Update);
	}

	return result;
}

/* The package.json of a project module (electron, @electron/packager), or null when the project has not installed it. */
function installed (project, name) {
	try {
		return {
			File: require.resolve(name + '/package.json', {paths: [project]}),
			Package: JSON.parse(fs.readFileSync(require.resolve(name + '/package.json', {paths: [project]}), 'utf8'))
		};
	}
	catch (error) {
		return null;
	}
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

/*
 * The program of the production build in source, written to folder (dist/native/desktop): its main script,
 * package.json and app/, then, with Electron and the packager in the project, the program for this system (or
 * Platform and Arch of the settings) in bin (dist/native/desktop-bin). settings: Name, Version, Description, Width,
 * Height, Frame (false: no frame of the system, the Application draws its own), Features (of the bridge, all by default), Protocol (the scheme of the
 * links that open the program: myapp://...), Update (the https URL of the feed of its versions), Platform, Arch.
 * Returns {Folder, Program} (Program null when the project lacks them), and writes the guide when it does.
 */
function pack (source, folder, bin, project, settings, command) {
	var info = details(project, settings || {});
	var program = native(info, settings || {});
	var electron = installed(project, 'electron');
	var packager = installed(project, '@electron/packager');
	var missing = [];
	var command;
	var run;
	var binary;

	fs.renameSync(source, path.join(folder, 'app'));

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

	fs.rmSync(bin, {recursive: true, force: true});

	run = childProcess.spawnSync(process.execPath, [
		command,
		folder,
		info.Name,
		'--out=' + bin,
		'--overwrite',
		'--electron-version=' + electron.Package.version,
		'--platform=' + ((settings && settings.Platform) || process.platform),
		'--arch=' + ((settings && settings.Arch) || process.arch)
	].concat(program.Protocol ? ['--protocol=' + program.Protocol, '--protocol-name=' + info.Name] : []), {cwd: project, encoding: 'utf8'});

	if (run.status !== 0)
		throw new Error('Electron packager failed:\n' + (run.stderr || run.stdout || run.error || ''));

	process.stdout.write('Elemenx Builder: the program is in ' + bin + '\n');

	return {Folder: folder, Program: bin};
}

module.exports = {
	Pack: pack,
	Features: Features,
	Guide: guide
};
