'use strict';

/*
 * What a project needs to build native programs, installed into it with npm (elemenx native add): desktop is
 * Electron and its packager (development tools), mobile is Capacitor, its Android and iOS platforms and the plugins
 * the bridge of Native uses (the app needs them at run time). Elemenx carries none of them: the project keeps their
 * versions.
 */

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var Packages = {
	desktop: {Development: true, Names: ['electron', '@electron/packager']},
	mobile: {Development: false, Names: ['@capacitor/core', '@capacitor/cli', '@capacitor/android', '@capacitor/ios', '@capacitor/app', '@capacitor/browser', '@capacitor/dialog', '@capacitor/filesystem', '@capacitor/splash-screen']}
};

/* The platforms of a word: desktop, mobile, or all (nothing) for both. */
function platforms (name) {
	if (!name || name === true || name === 'all') return Object.keys(Packages);

	if (!Packages[name])
		throw new Error('unknown native platform: ' + name + ' (desktop, mobile, or all)');

	return [name];
}

/* The npm commands of the platforms: [{Platform, Args}]. */
function commands (list) {
	return list.map(function (platform) {
		return {Platform: platform, Args: ['install', Packages[platform].Development ? '--save-dev' : '--save'].concat(Packages[platform].Names)};
	});
}

/*
 * Runs npm in the project and shows what it prints; the status of npm. On Windows npm is a script of the shell
 * (npm.cmd), which Node starts only in a shell: one command line then, its words quoted, not words handed to the shell.
 */
function npm (project, args) {
	var run = process.platform === 'win32' ? childProcess.spawnSync(['npm'].concat(args).map(function (word) {
		return /^[\w@./:=^~-]+$/.test(word) ? word : '"' + word.replace(/"/g, '\\"') + '"';
	}).join(' '), {cwd: project, stdio: 'inherit', shell: true}) : childProcess.spawnSync('npm', args, {cwd: project, stdio: 'inherit'});

	return run.error ? 1 : run.status;
}

/*
 * Installs the packages of the platforms (a word of platforms) into the project, which must have a package.json.
 * options.Run(project, args) runs npm (the real npm by default) and returns its status. Returns the platforms
 * installed.
 */
function add (project, name, options) {
	var list = platforms(name);
	var run = options && options.Run || npm;

	if (!fs.existsSync(path.join(project, 'package.json')))
		throw new Error('no package.json in ' + project + ' (elemenx native add works in a project)');

	commands(list).forEach(function (command) {
		process.stdout.write('Elemenx native: npm ' + command.Args.join(' ') + '\n');

		if (run(project, command.Args) !== 0)
			throw new Error('npm could not install the ' + command.Platform + ' packages (npm ' + command.Args.join(' ') + ')');
	});

	process.stdout.write('Elemenx native: ' + list.join(' and ') + ' ready; build with: npx elemenx build --native' + (list.length === 1 ? ' ' + list[0] : '') + '\n');

	return list;
}

module.exports = {
	Add: add,
	Packages: Packages,
	Platforms: platforms,
	Commands: commands
};
