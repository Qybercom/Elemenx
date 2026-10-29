#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var Builder = require('./tools/builder.js');
var Server = require('./tools/server.js');
var Splash = require('./tools/splash.js');
var Generator = require('./tools/generator.js');
var Icons = require('./tools/icons.js');
var Native = require('./tools/native.js');
var Meta = require('./tools/meta.js');
var Package = require('./package.json');
var fail = require('./tools/common.js').fail;

var BooleanOptions = {force: true, 'current-color': true, single: true, widget: true, full: true, readable: true, precompile: true, extension: true, help: true, docker: true, strict: true, open: true, 'no-split': true};

/* Options whose value may be left out: --native alone builds all the platforms. */
var OptionalValues = {native: ['desktop', 'mobile', 'android-library', 'all']};

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
			else if (OptionalValues[name]) {
				result.Options[name] = OptionalValues[name].indexOf(argv[i + 1]) !== -1 ? argv[i + 1] : true;

				i += result.Options[name] === true ? 1 : 2;
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
			if (value === '-h') result.Options.help = true;
			else result.Arguments.push(value);

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

/*
 * The settings of elemenx dev, the answers of its server (Server.Request) read again from elemenx.config.js when the
 * file changes: a server started before a change answered as the file said at its start (regression), and a file that
 * does not load keeps the answers it had.
 */
function reloaded (project, settings) {
	var file = path.join(project, 'elemenx.config.js');
	var current = settings;
	var time = changed();

	function changed () {
		return fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0;
	}

	return Object.assign({}, settings, {Server: Object.assign({}, settings.Server, {Request: function (request, response, pathname) {
		var now = changed();
		var handler;

		if (now !== time) {
			time = now;

			try {
				delete require.cache[require.resolve(file)];

				current = require(file) || current;
			}
			catch (error) {
				process.stderr.write('Elemenx dev: elemenx.config.js is not read again: ' + (error.message || error) + '\n');
			}
		}

		handler = (current.Server || {}).Request;

		return typeof handler === 'function' ? handler(request, response, pathname) : false;
	}})});
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
		out: value(parsed.Options, 'out', settings.Output, 'dist'),
		single: parsed.Options.single === true || settings.Single === true,
		widget: parsed.Options.widget === true || settings.Widget === true,
		full: parsed.Options.full === true || settings.Full === true,
		minify: !(parsed.Options.readable === true || settings.Minify === false),
		split: !(parsed.Options['no-split'] === true || settings.Split === false),
		precompile: parsed.Options.precompile === true || settings.Precompile === true,
		extension: parsed.Options.extension === true,
		surface: value(parsed.Options, 'surface', (settings.Extension || {}).Surface, 'popup'),
		extensionSettings: settings.Extension || {},
		native: parsed.Options.native === undefined ? false : parsed.Options.native,
		nativeSettings: settings.Native || {},
		docker: parsed.Options.docker === true,
		dockerSettings: settings.Docker || {},
		strict: parsed.Options.strict === true,
		packs: listValue(value(parsed.Options, 'packs', settings.Packs, [])),
		splash: settings.Splash,
		pwa: settings.PWA,
		icon: settings.Icon,
		icons: settings.Icons
	};
}

/* A list option: an Array of the config, or the names of the command line separated by commas. */
function listValue (input) {
	if (Array.isArray(input)) return input;

	return String(input === true ? '' : input).split(',').map(function (item) {
		return item.trim();
	}).filter(Boolean);
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
	var cacheControl = production ? value(options, 'cache-control', serverSettings.CacheControl, 'public, max-age=0, must-revalidate') : 'no-cache';

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
			Templates: serverSettings.Templates !== false,
			/* In development the page gets its splash as a build would write it, splash.html read again each time. */
			Page: production ? null : function (text) {
				return Splash.Inject(text, Splash.Settings(directory, settings.Splash));
			},
			WebSocket: serverSettings.WebSocket || null
		})
		.Listen(port, host, function () {
			process.stdout.write('Elemenx ' + (production ? 'serve' : 'dev') + ': http://' + host + ':' + port + '/\n');
		});
}

var Commands = {};

/*
 * A command: its description (one line), its handler and its help (elemenx help <command>, or --help): {Usage: [lines],
 * Text: [paragraphs], Options: [[option, what it does]]}.
 */
function command (name, description, handler, help) {
	Commands[name] = {Description: description, Handler: handler, Help: help || {}};
}

/* The help of a command: what it does, how to call it, its options. */
function describe (name) {
	var entry = Commands[name];
	var help = entry.Help;
	var width = 0;
	var lines = ['elemenx ' + name + ': ' + entry.Description, '', 'Usage:'];

	(help.Usage || ['elemenx ' + name]).forEach(function (usage) {
		lines.push('  ' + usage);
	});

	(help.Text || []).forEach(function (text) {
		lines.push('', text);
	});

	if ((help.Options || []).length) {
		help.Options.forEach(function (option) {
			width = Math.max(width, option[0].length);
		});

		lines.push('', 'Options:');

		help.Options.forEach(function (option) {
			lines.push('  ' + option[0] + Array(width - option[0].length + 3).join(' ') + option[1]);
		});
	}

	return lines.join('\n') + '\n';
}

command('generate', 'Generate an Application or an entity and register it in the Application graph.', function (parsed) {
	var type = String(parsed.Arguments.shift() || '').toLowerCase();
	var target = parsed.Arguments.shift();

	if (type === 'application') {
		if (!target) {
			fail('usage: elemenx generate application <Name> [path] [--force]');
		}

		var root = projectPath(parsed.Arguments.shift());

		Generator.GenerateApplication(root, target, {
			force: parsed.Options.force === true,
			native: parsed.Options.native || false
		});

		if (parsed.Options.native)
			Native.Add(root, parsed.Options.native);

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
}, {
	Usage: ['elemenx generate application <Name> [path] [--native [desktop|mobile]] [--force]', 'elemenx generate <component|service|guard|directive> <path/Name> [project] [--application Name] [--force]', 'elemenx g ... (the same)'],
	Text: ['An Application gets its folder, and its app.js, index.html, elemenx.config.js and package.json when the project has none. An entity gets its files and its line in the graph of its Application (index.js).'],
	Options: [
		['--application <Name>', 'the Application of the entity (Application of elemenx.config.js by default)'],
		['--native [platform]', 'an Application made for native programs: installs Electron (desktop), Capacitor (mobile), or both, and adds npm run native'],
		['--force', 'writes over the files that exist']
	]
});

command('build', 'Build an Application into dist: a site, one file, a widget, a browser extension or native programs.', function (parsed) {
	var project = projectPath(parsed.Arguments[0]);
	var settings = config(project);

	var options = buildOptions(parsed, settings);
	var mode = options.single || options.widget || options.extension || options.native || options.docker;
	var targets = parsed.Options.target !== undefined ? listValue(parsed.Options.target) : ((settings.Build || {}).Targets || null);

	/* The targets of elemenx.config.js (Build.Targets) or of --target, each into its folder; an option of a mode builds that one alone. */
	if (targets && targets.length && (!mode || parsed.Options.target !== undefined)) {
		Builder.BuildTargets(project, options, targets);

		return;
	}

	Builder.Build(project, options);
}, {
	Usage: ['elemenx build [project] [options]'],
	Text: ['Without an option the build is a site: the framework, the Application and its Libraries for any static server. The settings of elemenx.config.js are the defaults of the options (docs/BUILDER.md).', 'Build.Targets of elemenx.config.js (or --target) builds several at once: web, single, widget, extension, desktop, mobile, android-library, docker; one goes where its build goes, several each into a folder of its own (dist/web, dist/single, dist/widget, dist/docker, dist/extension, dist/native/<platform>). An option of a mode (--single...) builds that one alone.'],
	Options: [
		['--out <folder>', 'the folder of the build (dist)'],
		['--entry <file>', 'the script of the Applications (app.js)'],
		['--index <file>', 'the page (index.html)'],
		['--application <Name>', 'the Application to build, of a project with several'],
		['--single', 'all of it in one index.html that runs from a file'],
		['--widget', 'one isolated widget.js for a page of another site'],
		['--packs <a,b>', 'the Library packs it always takes (all: every pack)'],
		['--full', 'all of the framework, not only the sections the build uses'],
		['--readable', 'keeps the comments, the blanks and the names of the scripts, to read the build (Minify: false in elemenx.config.js)'],
		['--precompile', 'the expressions of the templates as code, for a page that forbids eval'],
		['--no-split', 'one bundle: the Components of the routes not in parts of their own (Split: false in elemenx.config.js)'],
		['--extension', 'a browser extension for Chrome, Edge and Firefox'],
		['--surface <popup|tab|side>', 'where the extension shows (popup)'],
		['--docker', 'the site and a Docker image of it, served by nginx (the image when docker is installed)'],
		['--target <a,b>', 'the targets to build (Build.Targets): web, single, widget, extension, desktop, mobile, android-library, docker'],
		['--strict', 'fails a target whose tool is missing (docker) instead of leaving it out'],
		['--native [desktop|mobile|android-library]', 'native programs: desktop (Electron) or mobile (Capacitor: Android and iOS), without a platform both (elemenx native add installs what they need); android-library: the interface for an Android program of its own, a module of Gradle with ElemenxView']
	]
});

command('dev', 'Serve application sources for development.', function (parsed) {
	var project = projectPath(parsed.Arguments[0]);
	var settings = config(project);
	var server = settings.Server || {};
	var port = Number(value(parsed.Options, 'port', server.DevelopmentPort, 4173));

	listen(project, port, reloaded(project, settings), false, parsed.Options);
}, {
	Usage: ['elemenx dev [project] [--port 4173] [--host 127.0.0.1]'],
	Text: ['Serves the sources as they are, with the framework of the package: a reload shows every change.'],
	Options: [
		['--port <number>', 'the port (Server.DevelopmentPort, 4173)'],
		['--host <address>', 'the address it listens on (127.0.0.1; 0.0.0.0 for the other devices of the network)']
	]
});

command('serve', 'Serve the production dist with gzip and HTTP caching.', function (parsed) {
	var project = projectPath(parsed.Arguments[0]);
	var settings = config(project);
	var output = value(parsed.Options, 'out', settings.Output, 'dist');
	var directory = path.basename(project) === output ? project : path.resolve(project, output);
	var server = settings.Server || {};
	var port = Number(value(parsed.Options, 'port', server.ProductionPort, 4175));

	if (!fs.existsSync(directory))
		fail('dist not found: ' + directory + ' (run elemenx build first)');

	listen(directory, port, settings, true, parsed.Options);
}, {
	Usage: ['elemenx serve [project] [options]'],
	Text: ['Serves the build of elemenx build, compressed and with caching, as a production server would.'],
	Options: [
		['--port <number>', 'the port (Server.ProductionPort, 4175)'],
		['--host <address>', 'the address it listens on (127.0.0.1)'],
		['--out <folder>', 'the folder of the build (dist)'],
		['--compression <true|false>', 'gzip and brotli (true)'],
		['--compression-threshold <bytes>', 'the smallest response it compresses (1024)'],
		['--cache-control <value>', 'the Cache-Control of the files']
	]
});

/*
 * The Docs of this version of Elemenx, served from the package (docs-site/, built by prepack); in the repository
 * of Elemenx it is built again from the sources each time (tools/docs-site.js).
 */
command('docs', 'Serve the Docs of this version of Elemenx, offline.', function (parsed) {
	var directory = path.join(__dirname, 'docs-site');
	var port = Number(value(parsed.Options, 'port', undefined, 4179));
	var url;

	/* In the repository of Elemenx the Docs is built again each time: a build left from before would be of another version. */
	if (fs.existsSync(path.join(__dirname, 'examples', 'Docs', 'app.js'))) {
		process.stdout.write('Elemenx docs: building the Docs of the sources...\n');

		require('./tools/docs-site.js').Build({Output: directory});
	}
	else if (!fs.existsSync(path.join(directory, 'index.html'))) {
		fail('the Docs is not in this package: docs-site/ is missing (reinstall @qybercom/elemenx)');
	}

	listen(directory, port, config(directory), true, parsed.Options);

	url = 'http://' + value(parsed.Options, 'host', undefined, '127.0.0.1') + ':' + port + '/';

	if (parsed.Options.open === true)
		openBrowser(url);
}, {
	Usage: ['elemenx docs [--port 4179] [--open]'],
	Text: ['The Docs of the version of Elemenx the project installed (the guide, the core, every Component, Service and Directive of ElemenxUI with its live example), served from the package: no network needed.'],
	Options: [
		['--port <number>', 'the port (4179)'],
		['--host <address>', 'the address it listens on (127.0.0.1)'],
		['--open', 'opens it in the browser of the system']
	]
});

command('designer', 'Open the Designer on a project: its pages, components and routes, nothing written to its files.', function (parsed) {
	var project = projectPath(parsed.Arguments[0]);
	var directory = path.join(__dirname, 'designer-site');
	var port = Number(value(parsed.Options, 'port', undefined, 4180));
	var settings = config(project);
	var describe = require('./tools/designer.js').Request(project, settings.Entry || 'app.js', path.join(directory, 'index.html'));
	var url;

	if (!fs.existsSync(project) || !fs.statSync(project).isDirectory())
		fail('no project at ' + project);

	/* In the repository of Elemenx the Designer is built again each time: a build left from before would be of another version. */
	if (fs.existsSync(path.join(__dirname, 'examples', 'Designer', 'app.js'))) {
		process.stdout.write('Elemenx designer: building the Designer of the sources...\n');

		require('./tools/designer-site.js').Build({Output: directory});
	}
	else if (!fs.existsSync(path.join(directory, 'index.html'))) {
		fail('the Designer is not in this package: designer-site/ is missing (reinstall @qybercom/elemenx)');
	}

	process.stdout.write('Elemenx designer: ' + project + ' (read only: the Designer keeps its changes in the browser)\n');

	listen(directory, port, {Server: {
		/* The project (its description and its files, read only), then the bundles an export of the Designer puts into its file. */
		Request: function (request, response, pathname) {
			var match;
			var file;

			if (describe(request, response, pathname)) return true;

			match = /^\/bundles\/(elemenx\.min\.js|elemenx-ui\.min\.js)$/.exec(pathname);
			file = match ? path.join(__dirname, 'dist', match[1]) : '';

			if (!match || !fs.existsSync(file)) return false;

			response.writeHead(200, {'Content-Type': 'text/javascript; charset=utf-8'});

			fs.createReadStream(file).pipe(response);

			return true;
		}
	}}, true, parsed.Options);

	url = 'http://' + value(parsed.Options, 'host', undefined, '127.0.0.1') + ':' + port + '/';

	if (parsed.Options.open === true)
		openBrowser(url);
}, {
	Usage: ['elemenx designer [project] [--port 4180] [--open]'],
	Text: ['The Designer of the version of Elemenx the project installed, on the project: its Applications, routes, guards and Libraries as a tree, its Components in the palette and on the canvas as they run. A Component of the project opens as a copy to edit; the copies and the new pages and components stay in the storage of the browser, one place for each project: nothing is written to the files of the project.'],
	Options: [
		['--port <number>', 'the port (4180)'],
		['--host <address>', 'the address it listens on (127.0.0.1)'],
		['--open', 'opens it in the browser of the system']
	]
});

/* Opens a URL in the browser of the system. */
function openBrowser (url) {
	var child = require('child_process');

	if (process.platform === 'win32') child.spawn('cmd', ['/c', 'start', '""', url], {detached: true, stdio: 'ignore'}).unref();
	else child.spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], {detached: true, stdio: 'ignore'}).unref();
}

command('icons', 'Build an icon set (a sprite) from a directory of SVG files.', function (parsed) {
	var directory = parsed.Arguments[0];
	var output = parsed.Arguments[1];
	var result;

	if (!directory || !output)
		fail('usage: elemenx icons <directory> <output.svg> [--current-color]');

	result = Icons.Build(directory, output, {CurrentColor: parsed.Options['current-color'] === true});

	process.stdout.write('Elemenx icons: ' + result.Names.length + ' icons in ' + result.Output + '\n');
}, {
	Usage: ['elemenx icons <directory> <output.svg> [--current-color]'],
	Text: ['Each SVG file of the directory becomes a symbol of the sprite, named by its file; the Icons Service shows them as a set.'],
	Options: [
		['--current-color', 'paints the icons with the color of the text (their fills and strokes become currentColor)']
	]
});

command('meta', 'Collect the $Meta of the Components, Services and Directives of a library into one JSON file.', function (parsed) {
	var library = path.resolve(parsed.Arguments[0] || path.join(__dirname, 'libraries', 'ElemenxUI'));
	var output = path.resolve(parsed.Arguments[1] || path.join(library, 'data', 'meta.json'));
	var result = Meta.Build(library, output);

	process.stdout.write('Elemenx meta: ' + result.Components.length + ' components, ' + result.Services.length + ' services, ' + result.Directives.length + ' directives, ' + Object.keys(result.Classes).length + ' classes in ' + output + '\n');
}, {
	Usage: ['elemenx meta [library] [output.json]'],
	Text: ['Reads the files of the index.js of the library (ElemenxUI by default) and writes what their definitions declare in $Meta, as Elemenx.Meta(name) gives it, with the classes of the stylesheets and their modifiers: the data of the tools (a builder, a reference). The output is data/meta.json in the library by default, where the Designer Service reads it.']
});

command('native', 'Add what native programs need to a project: Electron (desktop), Capacitor (mobile).', function (parsed) {
	var action = parsed.Arguments.shift();
	var platform = OptionalValues.native.indexOf(parsed.Arguments[0]) !== -1 ? parsed.Arguments.shift() : 'all';

	if (action !== 'add')
		fail('usage: elemenx native add [desktop|mobile|all] [project]');

	Native.Add(projectPath(parsed.Arguments.shift()), platform);
}, {
	Usage: ['elemenx native add [desktop|mobile|all] [project]'],
	Text: ['Installs into the project, with npm: for desktop, electron and @electron/packager (development tools); for mobile, @capacitor/core, cli, android and ios, and the plugins app, browser and dialog. Without a platform, both. Then elemenx build --native makes the programs.']
});

command('version', 'Print Elemenx version.', function () {
	process.stdout.write(Package.version + '\n');
});

command('help', 'Show Elemenx CLI commands, or the help of one.', function (parsed) {
	var names = Object.keys(Commands);
	var topic = parsed && parsed.Arguments.shift();
	var i = 0;

	if (topic === 'g')
		topic = 'generate';

	if (topic) {
		if (!Commands[topic])
			fail('unknown command: ' + topic + ' (use elemenx help)');

		process.stdout.write(describe(topic));

		return;
	}

	process.stdout.write('Elemenx CLI ' + Package.version + '\n\n');
	process.stdout.write('Usage: elemenx <command> [target] [options]\n\nCommands:\n');

	while (i < names.length) {
		process.stdout.write('  ' + names[i] + Array(Math.max(2, 14 - names[i].length)).join(' ') + Commands[names[i]].Description + '\n');

		i++;
	}

	process.stdout.write('\nAlias: g = generate. The help of a command: elemenx help <command>, or elemenx <command> --help.\n');
}, {
	Usage: ['elemenx help [command]']
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

	if (parsed.Options.help && name !== 'help') {
		process.stdout.write(describe(name));

		return;
	}

	Commands[name].Handler(parsed);
}

/* Runs the CLI as a command: an error is a message and the exit code 1 (the bin of the package elemenx runs it too). */
function run (argv) {
	try {
		main(argv);
	}
	catch (error) {
		process.stderr.write('Elemenx CLI: ' + error.message + '\n');

		process.exitCode = 1;
	}
}

if (require.main === module)
	run(process.argv.slice(2));

module.exports = {
	Main: main,
	Run: run,
	Commands: Commands,
	Parse: parse,
	Describe: describe
};