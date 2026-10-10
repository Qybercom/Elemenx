#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var Builder = require('./tools/builder.js');
var Server = require('./tools/server.js');
var Generator = require('./tools/generator.js');
var Package = require('./package.json');
var fail = require('./tools/common.js').fail;

var BooleanOptions = {force: true};

function parse (argv) {
	var result = {Arguments: [], Options: {}};
	var i = 0;

	while (i < argv.length) {
		var value = argv[i];

		if (value.indexOf('--') === 0) {
			var name = value.substring(2);
			if (!name)
				fail('invalid option');

			if (BooleanOptions[name]) {
				result.Options[name] = true;

				i++;
			}
			else if (i + 1 < argv.length && argv[i + 1].indexOf('--') !== 0) {
				result.Options[name] = argv[i + 1];

				i += 2;
			}
			else {
				result.Options[name] = true;

				i++;
			}
		}
		else {
			result.Arguments.push(value);

			i++;
		}
	}

	return result;
}

function config (project) {
	var file = path.join(project, 'elemenx.config.js');
	if (!fs.existsSync(file)) return {};

	delete require.cache[require.resolve(file)];

	var value = require(file);
	if (!value || typeof value !== 'object')
		fail('elemenx.config.js must export an object');

	return value;
}

function value (options, name, configured, fallback) {
	if (options[name] !== undefined) return options[name];
	if (configured !== undefined) return configured;

	return fallback;
}

function projectPath (argument) {
	return path.resolve(argument || process.cwd());
}

function buildOptions (parsed, settings) {
	return {
		application: value(parsed.Options, 'application', settings.Application, 'application'),
		applicationExplicit: parsed.Options.application !== undefined,
		applications: value(parsed.Options, 'applications', settings.Applications, undefined),
		entry: value(parsed.Options, 'entry', settings.Entry, 'app.js'),
		index: value(parsed.Options, 'index', settings.Index, 'index.html'),
		out: value(parsed.Options, 'out', settings.Output, 'dist')
	};
}

function booleanValue (input, fallback) {
	if (input === undefined) return fallback;
	if (input === true || input === false) return input;
	if (String(input).toLowerCase() === 'true') return true;
	if (String(input).toLowerCase() === 'false') return false;

	fail('expected true or false, got: ' + input);
}

function listen (directory, port, settings, production, options) {
	var serverSettings = settings.Server || {};
	var compression = production ? booleanValue(value(options, 'compression', serverSettings.Compression, true), true) : false;
	var threshold = Number(value(options, 'compression-threshold', serverSettings.CompressionThreshold, 1024));
	var host = value(options, 'host', serverSettings.Host, '127.0.0.1');
	var cacheControl = production ? value(options, 'cache-control', serverSettings.CacheControl, 'public, max-age=0, must-revalidate') : false;

	if (!isFinite(threshold) || threshold < 0)
		fail('compression threshold must be a non-negative number');

	Server
		.Create({
			Root: directory,
			Compression: compression,
			CompressionThreshold: threshold,
			CacheControl: cacheControl,
			FrameworkFallback: !production,
			Request: serverSettings.Request || null,
			WebSocket: serverSettings.WebSocket || null
		})
		.Listen(port, host, function () {
			process.stdout.write('Elemenx ' + (production ? 'serve' : 'dev') + ': http://' + host + ':' + port + '/\n');
		});
}

var Commands = {};

function command (name, description, handler) {
	Commands[name] = {Description: description, Handler: handler};
}

command('generate', 'Generate an Application or an entity and register it in the Application graph.', function (parsed) {
	var type = String(parsed.Arguments.shift() || '').toLowerCase();
	var target = parsed.Arguments.shift();

	if (type === 'application') {
		if (!target) {
			fail('usage: elemenx generate application <Name> [path] [--force]');
		}

		Generator.GenerateApplication(projectPath(parsed.Arguments.shift()), target, {
			force: parsed.Options.force === true
		});

		return;
	}

	var project = projectPath(parsed.Arguments.shift());
	var settings = config(project);

	if (!type || !target)
		fail('usage: elemenx generate <component|service|guard|directive> <path/Name> [project] [--application Name] [--force]');

	Generator.Generate(project, type, target, {
		application: parsed.Options.application !== undefined ? parsed.Options.application : (settings.Application || null),
		force: parsed.Options.force === true
	});
});

command('build', 'Build an application into dist.', function (parsed) {
	var project = projectPath(parsed.Arguments[0]);
	var settings = config(project);

	Builder.Build(project, buildOptions(parsed, settings));
});

command('dev', 'Serve application sources for development.', function (parsed) {
	var project = projectPath(parsed.Arguments[0]);
	var settings = config(project);
	var server = settings.Server || {};
	var port = Number(value(parsed.Options, 'port', server.DevelopmentPort, 4173));

	listen(project, port, settings, false, parsed.Options);
});

command('serve', 'Serve the production dist with gzip and HTTP caching.', function (parsed) {
	var project = projectPath(parsed.Arguments[0]);
	var settings = config(project);
	var output = value(parsed.Options, 'out', settings.Output, 'dist');
	var directory = path.basename(project) === output ? project : path.join(project, output);
	var server = settings.Server || {};
	var port = Number(value(parsed.Options, 'port', server.ProductionPort, 4175));

	if (!fs.existsSync(directory))
		fail('dist not found: ' + directory + ' (run elemenx build first)');

	listen(directory, port, settings, true, parsed.Options);
});

command('version', 'Print Elemenx version.', function () {
	process.stdout.write(Package.version + '\n');
});

command('help', 'Show Elemenx CLI commands.', function () {
	var names = Object.keys(Commands);
	var i = 0;

	process.stdout.write('Elemenx CLI ' + Package.version + '\n\n');
	process.stdout.write('Usage: elemenx <command> [target] [options]\n\nCommands:\n');

	while (i < names.length) {
		process.stdout.write('  ' + names[i] + Array(Math.max(2, 14 - names[i].length)).join(' ') + Commands[names[i]].Description + '\n');

		i++;
	}

	process.stdout.write('\nAlias: g = generate. Future command groups are reserved for inspect and other toolchain operations.\n');
});

function main (argv) {
	var parsed = parse(argv);
	var name = parsed.Arguments.shift() || 'help';
	if (name === 'g')
		name = 'generate';

	if (name === '--help' || name === '-h')
		name = 'help';

	if (name === '--version' || name === '-v')
		name = 'version';

	if (!Commands[name])
		fail('unknown command: ' + name + ' (use elemenx help)');

	Commands[name].Handler(parsed);
}

if (require.main === module) {
	try {
		main(process.argv.slice(2));
	}
	catch (error) {
		process.stderr.write('Elemenx CLI: ' + error.message + '\n');

		process.exitCode = 1;
	}
}

module.exports = {
	Main: main,
	Commands: Commands
};