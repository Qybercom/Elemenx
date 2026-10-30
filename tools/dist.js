'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var crypto = require('crypto');
var common = require('./common.js');
var Builder = require('./builder.js');
var Minify = require('./minify.js');
var Package = require('../package.json');

var Root = path.resolve(__dirname, '..');
var Library = path.join(Root, 'libraries', 'ElemenxUI');
/* The packs its bundles carry in scripts of their own: a Bundled one (the themes of every day) stays in elemenx-ui.js. */
var Packs = (function (packs) {
	var result = {};

	Object.keys(packs).forEach(function (name) {
		if (!packs[name].Bundled)
			result[name] = packs[name];
	});

	return result;
})(common.readPacks(Library));

/* The dictionaries of ElemenxUI: locales/<language>.json, the source of Elemenx.Locale its declaration names. */
var Locales = {URL: 'locales/{language}.json', Languages: fs.readdirSync(path.join(Library, 'locales')).filter(function (name) {
	return /\.json$/.test(name);
}).map(function (name) {
	return name.replace(/\.json$/, '');
}).sort()};

/* The line of a script of ElemenxUI that sets root, the URL of the files of the Library next to the script (dist/elemenx-ui). */
var RootLine = '\tvar root = script && script.src ? script.src.replace(/[?#].*$/, \'\').replace(/\\/[^\\/]*$/, \'\') + \'/elemenx-ui\' : \'/libraries/ElemenxUI\';';

function banner (name) {
	return '/*! ' + name + ' ' + Package.version + ' | LGPL-3.0 */\n';
}

/* The files of a Discovery index, its nested indexes included, in their order: {JS, CSS, Other} of absolute paths. */
function files (directory, result) {
	var entries = common.parseIndex(path.join(directory, 'index.js'));

	result = result || {JS: [], CSS: [], Other: []};

	entries.forEach(function (entry) {
		var target = path.resolve(directory, entry);

		if (/\.js$/i.test(entry)) result.JS.push(target);
		else if (/\.css$/i.test(entry)) result.CSS.push(target);
		else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) files(target, result);
		else result.Other.push(target);
	});

	return result;
}

/* An entity of the Library with its template and style inline, minified with min. */
function entity (file, min) {
	var source = fs.readFileSync(file, 'utf8');
	var directory = path.dirname(file);

	function inline (key, inlineKey, minify) {
		var pattern = new RegExp('(^|[^A-Za-z0-9_$])\\' + key + '\\s*:\\s*([\'"])([^\'"]+)\\2', 'g');

		source = source.replace(pattern, function (all, prefix, quote, target) {
			var text = fs.readFileSync(path.resolve(directory, target), 'utf8');

			return prefix + inlineKey + ': ' + JSON.stringify(min ? minify(text) : text);
		});
	}

	inline('$TemplateURL', '$Template', Minify.HTML);
	inline('$StyleURL', '$Style', Minify.CSS);

	return source;
}

/* A file of the Library (its path from the root) embedded for Elemenx.Resource. */
function resource (relative, min) {
	var text = fs.readFileSync(path.join(Library, relative), 'utf8');

	if (min)
		text = /\.json$/i.test(relative) ? Minify.JSON(text) : /\.txt$/i.test(relative) ? text : Minify.HTML(text);

	return '\tElemenx.Resource(root + ' + JSON.stringify('/' + relative) + ', ' + JSON.stringify(text) + ');';
}

/* A pack of ElemenxUI (packs.json) as a script of its own: its files, embedded; its stylesheets put into the page. */
function pack (name, min) {
	var lines = ['(function () {', '\tvar script = document.currentScript;', RootLine, ''];

	Packs[name].Files.forEach(function (relative) {
		if (/\.css$/i.test(relative)) lines = lines.concat(styleLines(stylesheet(path.join(Library, relative), min)));
		else lines.push(resource(relative, min));
	});

	lines.push('})();');

	return lines.join('\n') + '\n';
}

/* The text of a stylesheet of the Library, minified with min. */
function stylesheet (file, min) {
	var text = fs.readFileSync(file, 'utf8');

	return min ? Minify.CSS(text) : text;
}

/* The lines of a script of ElemenxUI that put a stylesheet into the page. */
function styleLines (css) {
	return [
		'\tvar style = document.createElement(\'style\');',
		'',
		'\tstyle.setAttribute(\'data-elemenx-library\', \'ElemenxUI\');',
		'\tstyle.textContent = ' + JSON.stringify(css) + ';',
		'',
		'\t(document.head || document.documentElement).appendChild(style);',
		''
	];
}

/* The standalone bundle of ElemenxUI: its stylesheets, its files (sprites, data) but the packs, and every entity, embedded. */
function library (min) {
	var list = files(Library);
	var entities = {};
	var css = list.CSS.filter(function (file) {
		return !common.packOf(Packs, path.relative(Library, file).replace(/\\/g, '/'));
	}).map(function (file) {
		return stylesheet(file, min);
	}).join('\n');
	var lines = [];

	list.JS.forEach(function (file) {
		var source = entity(file, min);
		var declared = /\bElemenx\.(Component|Service|Guard|Directive|Trait)\s*\(\s*(['"])([^'"]+)\2/.exec(source);
		if (!declared)
			common.fail('Not an entity of the Library: ' + file);

		entities[declared[1]] = entities[declared[1]] || {};
		entities[declared[1]][declared[3]] = source;
	});

	lines.push('(function () {');
	lines.push('\tvar script = document.currentScript;');
	lines.push(RootLine);

	lines = lines.concat(styleLines(css));

	lines.push('\tElemenx.Library(\'ElemenxUI\', {$Root: root, $Locales: ' + JSON.stringify(Locales) + '});');
	lines.push('');

	list.Other.forEach(function (file) {
		var relative = path.relative(Library, file).replace(/\\/g, '/');
		if (!common.packOf(Packs, relative))
			lines.push(resource(relative, min));
	});

	lines.push('})();');

	return lines.join('\n') + '\n' + Builder.Render(entities) + '\n';
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
 * Builds the distribution of Elemenx into output (dist by default):
 *   elemenx.js, elemenx.min.js            the framework
 *   elemenx-ui.js, elemenx-ui.min.js      ElemenxUI standalone: components, templates, styles, sprites and data
 *                                         embedded, for a page with no build and no server (file:// too)
 *   elemenx-ui.<pack>.js, .min.js         a pack of ElemenxUI (packs.json: the emoji data and its languages, the large
 *                                         icon sets, the game themes), left out of elemenx-ui.js: a page adds the
 *                                         scripts of the packs it uses, or ElemenxUI loads their files from
 *                                         elemenx-ui/ (not from a file; a stylesheet only from its script)
 *   elemenx.all.js, elemenx.all.min.js    the framework and ElemenxUI in one file
 *   elemenx-ui/                           ElemenxUI as files, for the Discovery of a project (Library $Root)
 *   manifest.json                         the version, and the size, gzip size and integrity (SRI) of every file
 */
function Build (output) {
	var target = path.resolve(output || path.join(Root, 'dist'));
	var framework = fs.readFileSync(path.join(Root, 'elemenx.js'), 'utf8');
	var outputs = {};
	var manifest = {Name: Package.name, Version: Package.version, Files: {}};

	outputs['elemenx.js'] = banner('Elemenx') + framework;
	outputs['elemenx.min.js'] = banner('Elemenx') + Minify.Script(framework, ['Version']);
	outputs['elemenx-ui.js'] = banner('ElemenxUI') + library(false);
	outputs['elemenx-ui.min.js'] = banner('ElemenxUI') + Minify.Script(library(true));
	outputs['elemenx.all.js'] = outputs['elemenx.js'] + '\n' + outputs['elemenx-ui.js'];
	outputs['elemenx.all.min.js'] = outputs['elemenx.min.js'] + outputs['elemenx-ui.min.js'];

	Object.keys(Packs).forEach(function (name) {
		outputs['elemenx-ui.' + name + '.js'] = banner('ElemenxUI') + pack(name, false);
		outputs['elemenx-ui.' + name + '.min.js'] = banner('ElemenxUI') + Minify.Script(pack(name, true));
	});

	if (fs.existsSync(target))
		fs.rmSync(target, {recursive: true, force: true});

	fs.mkdirSync(target, {recursive: true});

	Object.keys(outputs).forEach(function (name) {
		var bytes = Buffer.from(outputs[name], 'utf8');

		fs.writeFileSync(path.join(target, name), bytes);

		manifest.Files[name] = {
			Size: bytes.length,
			Gzip: zlib.gzipSync(bytes, {level: 9}).length,
			Integrity: 'sha384-' + crypto.createHash('sha384').update(bytes).digest('base64')
		};
	});

	copy(Library, path.join(target, 'elemenx-ui'));

	fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, '\t') + '\n');

	return {Output: target, Manifest: manifest};
}

module.exports = {
	Build: Build
};

/*
 * The extensions of the editors into <output>/editors, after the files of the framework (editors/build.js): the one of
 * VS Code always, the plugin of IntelliJ when an IDE of JetBrains or a release can make it. In the repository only:
 * the package of npm has no editors/. They are told in manifest.json, as Editors.
 */
function Editors (result) {
	var builder = path.join(Root, 'editors', 'build.js');
	var made;

	if (!fs.existsSync(builder)) return [];

	made = require(builder).Build({Output: path.join(result.Output, 'editors')});
	result.Manifest.Editors = {};

	made.forEach(function (file) {
		var bytes = fs.readFileSync(path.join(result.Output, 'editors', file.Name));

		result.Manifest.Editors['editors/' + file.Name] = {Size: bytes.length, Integrity: 'sha384-' + crypto.createHash('sha384').update(bytes).digest('base64')};
	});

	fs.writeFileSync(path.join(result.Output, 'manifest.json'), JSON.stringify(result.Manifest, null, '\t') + '\n');

	return made;
}

if (require.main === module) {
	try {
		(function (result) {
			Object.keys(result.Manifest.Files).forEach(function (name) {
				var file = result.Manifest.Files[name];

				process.stdout.write('  ' + name + Array(Math.max(2, 28 - name.length)).join(' ') + Math.round(file.Size / 1024) + ' KB, gzip ' + Math.round(file.Gzip / 1024) + ' KB\n');
			});

			if (process.argv.indexOf('--no-editors') === -1) {
				Editors(result).forEach(function (file) {
					process.stdout.write('  editors/' + file.Name + Array(Math.max(2, 20 - file.Name.length)).join(' ') + Math.round(file.Size / 1024) + ' KB\n');
				});
			}

			process.stdout.write('Elemenx dist ' + result.Manifest.Version + ': ' + result.Output + '\n');
		})(Build(process.argv[2] && process.argv[2].indexOf('--') !== 0 ? process.argv[2] : undefined));
	}
	catch (error) {
		process.stderr.write('Elemenx dist: ' + error.message + '\n');

		process.exitCode = 1;
	}
}
