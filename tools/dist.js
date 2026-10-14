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
var Packs = common.readPacks(Library);

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
		text = /\.json$/i.test(relative) ? Minify.JSON(text) : Minify.HTML(text);

	return '\tElemenx.Resource(root + ' + JSON.stringify('/' + relative) + ', ' + JSON.stringify(text) + ');';
}

/* A pack of ElemenxUI (packs.json) as a script of its own: its files, embedded. */
function pack (name, min) {
	var lines = ['(function () {', '\tvar script = document.currentScript;', RootLine, ''];

	Packs[name].Files.forEach(function (relative) {
		lines.push(resource(relative, min));
	});

	lines.push('})();');

	return lines.join('\n') + '\n';
}

/* The standalone bundle of ElemenxUI: its stylesheets, its files (sprites, data) but the packs, and every entity, embedded. */
function library (min) {
	var list = files(Library);
	var entities = {};
	var css = list.CSS.map(function (file) {
		var text = fs.readFileSync(file, 'utf8');

		return min ? Minify.CSS(text) : text;
	}).join('\n');
	var lines = [];

	list.JS.forEach(function (file) {
		var source = entity(file, min);
		var declared = /\bElemenx\.(Component|Service|Guard|Directive)\s*\(\s*(['"])([^'"]+)\2/.exec(source);
		if (!declared)
			common.fail('Not an entity of the Library: ' + file);

		entities[declared[1]] = entities[declared[1]] || {};
		entities[declared[1]][declared[3]] = source;
	});

	lines.push('(function () {');
	lines.push('\tvar script = document.currentScript;');
	lines.push(RootLine);
	lines.push('\tvar style = document.createElement(\'style\');');
	lines.push('');
	lines.push('\tstyle.setAttribute(\'data-elemenx-library\', \'ElemenxUI\');');
	lines.push('\tstyle.textContent = ' + JSON.stringify(css) + ';');
	lines.push('');
	lines.push('\t(document.head || document.documentElement).appendChild(style);');
	lines.push('');
	lines.push('\tElemenx.Library(\'ElemenxUI\', {$Root: root});');
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
 *                                         icon sets), left out of elemenx-ui.js: a page adds the scripts of the packs
 *                                         it uses, or ElemenxUI loads their files from elemenx-ui/ (not from a file)
 *   elemenx.all.js, elemenx.all.min.js    the framework and ElemenxUI in one file
 *   elemenx-ui/                           ElemenxUI as files, for the Discovery of a project (Library $Root)
 *   manifest.json                         the version, and the size, gzip size and integrity (SRI) of every file
 */
function Build (output) {
	var target = path.resolve(output || path.join(Root, 'dist'));
	var framework = fs.readFileSync(path.join(Root, 'elemenx.js'), 'utf8');
	var outputs = {};
	var manifest = {Name: 'elemenx', Version: Package.version, Files: {}};

	outputs['elemenx.js'] = banner('Elemenx') + framework;
	outputs['elemenx.min.js'] = banner('Elemenx') + Minify.JavaScript(framework);
	outputs['elemenx-ui.js'] = banner('ElemenxUI') + library(false);
	outputs['elemenx-ui.min.js'] = banner('ElemenxUI') + Minify.JavaScript(library(true));
	outputs['elemenx.all.js'] = outputs['elemenx.js'] + '\n' + outputs['elemenx-ui.js'];
	outputs['elemenx.all.min.js'] = outputs['elemenx.min.js'] + outputs['elemenx-ui.min.js'];

	Object.keys(Packs).forEach(function (name) {
		outputs['elemenx-ui.' + name + '.js'] = banner('ElemenxUI') + pack(name, false);
		outputs['elemenx-ui.' + name + '.min.js'] = banner('ElemenxUI') + Minify.JavaScript(pack(name, true));
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

if (require.main === module) {
	try {
		(function (result) {
			Object.keys(result.Manifest.Files).forEach(function (name) {
				var file = result.Manifest.Files[name];

				process.stdout.write('  ' + name + Array(Math.max(2, 28 - name.length)).join(' ') + Math.round(file.Size / 1024) + ' KB, gzip ' + Math.round(file.Gzip / 1024) + ' KB\n');
			});

			process.stdout.write('Elemenx dist ' + result.Manifest.Version + ': ' + result.Output + '\n');
		})(Build(process.argv[2]));
	}
	catch (error) {
		process.stderr.write('Elemenx dist: ' + error.message + '\n');

		process.exitCode = 1;
	}
}
