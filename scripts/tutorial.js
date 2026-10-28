/*
 * Runs a project of the tutorials from the repository: npm run tutorial -- Telemetry (the name in any case) serves
 * examples/Tutorials/Telemetry with elemenx dev, on the port of its elemenx.config.js, with the framework and ElemenxUI
 * of the repository. Without a name it lists the projects and their ports. Other arguments go to elemenx dev (--port).
 */
'use strict';

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var folder = path.join(root, 'examples', 'Tutorials');

/* The projects: the folders with an elemenx.config.js, {Name, Port}. */
function projects () {
	return fs.readdirSync(folder).filter(function (name) {
		return fs.existsSync(path.join(folder, name, 'elemenx.config.js'));
	}).sort().map(function (name) {
		var settings = require(path.join(folder, name, 'elemenx.config.js'));

		return {Name: name, Port: (settings.Server || {}).DevelopmentPort || 4173};
	});
}

function list () {
	process.stdout.write('The projects of the tutorials (npm run tutorial -- <name>):\n');

	projects().forEach(function (project) {
		process.stdout.write('  ' + project.Name + new Array(Math.max(2, 14 - project.Name.length)).join(' ') + 'http://127.0.0.1:' + project.Port + '/\n');
	});
}

function run (args) {
	var wanted = String(args[0] || '').toLowerCase();
	var found = projects().filter(function (project) {
		return project.Name.toLowerCase() === wanted;
	})[0];
	var child;

	if (!wanted) {
		list();

		return;
	}

	if (!found) {
		process.stderr.write('No tutorial project ' + args[0] + '.\n');
		list();

		process.exitCode = 1;

		return;
	}

	child = childProcess.spawn(process.execPath, [path.join(root, 'elemenx-cli.js'), 'dev', path.join(folder, found.Name)].concat(args.slice(1)), {stdio: 'inherit'});

	child.on('exit', function (code) {
		process.exitCode = code || 0;
	});
}

if (require.main === module)
	run(process.argv.slice(2));

module.exports = {Projects: projects, Run: run};
