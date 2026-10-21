'use strict';

var fs = require('fs');
var path = require('path');
var common = require('./common.js');
var Package = require('../package.json');
var fail = common.fail;

var Types = {
	component: {Label: 'Component'},
	service: {Label: 'Service'},
	guard: {Label: 'Guard'},
	directive: {Label: 'Directive'}
};

function validName (name) {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name || '');
}

function normalize (value) {
	return value.split('\\').join('/').split(path.sep).join('/');
}

function readIndex (file) {
	if (!fs.existsSync(file)) return [];

	return common.parseIndex(file);
}

function writeIndex (file, entries) {
	var lines = ['['];
	var i = 0;

	while (i < entries.length) {
		lines.push('\t' + JSON.stringify(entries[i]).replace(/"/g, "'") + (i + 1 < entries.length ? ',' : ''));

		i++;
	}

	lines.push(']');

	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, lines.join('\n'));
}

function addIndexEntry (file, entry) {
	var entries = readIndex(file);
	var i = 0;

	while (i < entries.length) {
		if (entries[i] === entry) return false;

		i++;
	}

	entries.push(entry);

	writeIndex(file, entries);

	return true;
}

function componentFiles (name) {
	var files = {};

	files[name + '.js'] = "Elemenx.Component('" + name + "', {\n\t$TemplateURL: '" + name + ".html'\n});";
	files[name + '.html'] = '<div class = "' + name + '"></div>';

	return files;
}

function serviceFiles (name) {
	var files = {};

	files[name + '.js'] = "Elemenx.Service('" + name + "', {\n});";

	return files;
}

function guardFiles (name) {
	var files = {};

	files[name + '.js'] = "Elemenx.Guard('" + name + "', function () {\n\treturn true;\n});";

	return files;
}

function directiveFiles (name) {
	var files = {};

	files[name + '.js'] = "Elemenx.Directive('" + name + "', {\n\t$OnCreate: function (context) {\n\t},\n\n\t$OnUpdate: function (context) {\n\t},\n\n\t$OnDestroy: function (context) {\n\t}\n});";

	return files;
}

function filesFor (type, name) {
	if (type === 'component')
		return componentFiles(name);

	if (type === 'service')
		return serviceFiles(name);

	if (type === 'guard')
		return guardFiles(name);

	if (type === 'directive')
		return directiveFiles(name);

	fail('unknown generator type: ' + type);
}

function ensureInside (root, target, label) {
	var relative = path.relative(root, target);
	if (relative === '..' || relative.indexOf('..' + path.sep) === 0 || path.isAbsolute(relative))
		fail(label + ' is outside application root: ' + target);
}

function nearestIndex (application, destination) {
	var current = destination;

	while (true) {
		var index = path.join(current, 'index.js');
		if (fs.existsSync(index)) return index;
		if (current === application) break;

		var parent = path.dirname(current);
		if (parent === current) break;

		current = parent;
	}

	var root = path.join(application, 'index.js');
	if (!fs.existsSync(root))
		fail('application graph root not found: ' + root);

	return root;
}

function resolveEntity (application, type, target) {
	var requested = target || '';
	var normalizedRequested = String(requested || '.').split('\\').join('/');
	var absolute = path.resolve.apply(path, [application].concat(normalizedRequested.split('/')));
	var name = path.basename(absolute);

	if (!requested || requested === '.' || requested === path.sep)
		fail(type + ' destination must include an entity name');

	if (!validName(name))
		fail('invalid ' + type + ' name: ' + name);

	if (type === 'component')
		return {
			Name: name,
			Directory: absolute,
			Entry: path.join(absolute, name + '.js')
		};

	return {
		Name: name,
		Directory: path.dirname(absolute),
		Entry: absolute + '.js'
	};
}

function ensureWritable (targets, force) {
	var names = Object.keys(targets);
	var i = 0;

	if (force) return;

	while (i < names.length) {
		if (fs.existsSync(names[i]))
			fail('file already exists: ' + names[i] + ' (use --force to overwrite)');

		i++;
	}
}


function writeIfMissing (file, source) {
	if (fs.existsSync(file)) return false;

	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, source);

	return true;
}

/* The dependency of a generated host on this Elemenx: the package and the versions of its minor release. */
function dependency () {
	var result = {};

	result[Package.name] = '^' + Package.version;

	return result;
}

function applicationPackageName (name) {
	return String(name).replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^A-Za-z0-9._-]+/g, '-').toLowerCase();
}

function generateApplication (project, name, options) {
	options = options || {};
	project = path.resolve(project || process.cwd());

	if (!validName(name))
		fail('invalid application name: ' + name);

	var application = path.join(project, name);
	var index = path.join(application, 'index.js');
	var componentDirectory = path.join(application, 'App');
	var targets = {};

	targets[index] = "[\n\t'App/App.js'\n]";
	targets[path.join(componentDirectory, 'App.js')] = "Elemenx.Component('App', {\n\t$TemplateURL: 'App.html'\n});";
	targets[path.join(componentDirectory, 'App.html')] = '<main class = "' + name + '"></main>';

	ensureWritable(targets, options.force === true);

	fs.mkdirSync(componentDirectory, {recursive: true});

	var files = Object.keys(targets);
	var i = 0;

	while (i < files.length) {
		fs.writeFileSync(files[i], targets[files[i]]);

		i++;
	}

	var host = [];
	var appFile = path.join(project, 'app.js');
	var indexFile = path.join(project, 'index.html');
	var configFile = path.join(project, 'elemenx.config.js');
	var packageFile = path.join(project, 'package.json');
	var scripts = {dev: 'elemenx dev', build: 'elemenx build', serve: 'elemenx serve'};

	/* A project made for native programs builds them with npm run native (elemenx build --native). */
	if (options && options.native)
		scripts.native = 'elemenx build --native' + (options.native === true || options.native === 'all' ? '' : ' ' + options.native);

	if (writeIfMissing(appFile, "Elemenx.Application('" + name + "', {\n\t$Component: 'App',\n\t$Root: '" + name + "',\n\t$Mount: 'body'\n});")) {
		host.push(appFile);
	}

	if (writeIfMissing(indexFile, '<!DOCTYPE html>\n<html>\n<head>\n\t<meta charset="utf-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1">\n\n\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>\n</head>\n<body>\n</body>\n</html>\n')) {
		host.push(indexFile);
	}

	if (writeIfMissing(configFile, "module.exports={\n\tApplication:'" + name + "',\n\tEntry:'app.js',\n\tIndex:'index.html',\n\tOutput:'dist',\n\tServer:{\n\t\tDevelopmentPort:4173,\n\t\tProductionPort:4175,\n\t\tCompression:true,\n\t\tCompressionThreshold:1024\n\t}\n};")) {
		host.push(configFile);
	}

	if (writeIfMissing(packageFile, JSON.stringify({name: applicationPackageName(path.basename(project) || name), private: true, scripts: scripts, devDependencies: dependency()}, null, '\t') + '\n')) {
		host.push(packageFile);
	}

	process.stdout.write('Elemenx Generator: Application ' + name + ' -> ' + normalize(path.relative(process.cwd(), application) || '.') + '\n');

	return {Application: application, Files: files, HostFiles: host};
}

function resolveApplicationRoot (project, target, configured) {
	if (configured) {
		var configuredRoot = path.resolve(project, configured);
		var normalizedTarget = String(target || '').split('\\').join('/');
		var configuredName = normalize(configured).replace(/^\.\//, '').replace(/\/$/, '');
		var configuredBase = normalize(path.basename(configuredRoot));

		if (normalizedTarget === configuredName || normalizedTarget.indexOf(configuredName + '/') === 0) {
			normalizedTarget = normalizedTarget.substring(configuredName.length).replace(/^\//, '');
		}
		else if (normalizedTarget === configuredBase || normalizedTarget.indexOf(configuredBase + '/') === 0) {
			normalizedTarget = normalizedTarget.substring(configuredBase.length).replace(/^\//, '');
		}

		return {Root: configuredRoot, Target: normalizedTarget};
	}

	var normalized = String(target || '').split('\\\\').join('/');
	var parts = normalized.split('/');

	while (parts.length && (parts[0] === '' || parts[0] === '.')) {
		parts.shift();
	}

	if (parts.length) {
		var candidate = path.resolve(project, parts[0]);
		if (fs.existsSync(path.join(candidate, 'index.js')))
			return {Root: candidate, Target: parts.slice(1).join('/')};
	}

	if (fs.existsSync(path.join(project, 'index.js'))) {
		return {Root: project, Target: target};
	}

	return {Root: path.resolve(project, 'application'), Target: target};
}

function generate (project, type, target, options) {
	options = options || {};
	type = String(type || '').toLowerCase();

	if (!Types[type])
		fail('unknown generator type: ' + type + '. Expected component, service, guard or directive');

	var resolved = resolveApplicationRoot(project, target, options.application);
	var application = resolved.Root;

	target = resolved.Target;

	if (!fs.existsSync(application))
		fail('application directory not found: ' + application);

	var entity = resolveEntity(application, type, target);

	ensureInside(application, entity.Directory, 'destination');
	ensureInside(application, entity.Entry, 'entity');

	var generated = filesFor(type, entity.Name);
	var fileNames = Object.keys(generated);
	var targets = {};
	var i = 0;

	while (i < fileNames.length) {
		targets[path.join(entity.Directory, fileNames[i])] = generated[fileNames[i]];

		i++;
	}

	ensureWritable(targets, options.force === true);

	// Ownership is resolved from the destination directory before creating it:
	// an existing local index.js wins, otherwise walk upward to the graph root.
	var owner = nearestIndex(application, entity.Directory);
	var relative = normalize(path.relative(path.dirname(owner), entity.Entry));

	fs.mkdirSync(entity.Directory, {recursive: true});

	var targetNames = Object.keys(targets);

	i = 0;
	while (i < targetNames.length) {
		fs.writeFileSync(targetNames[i], targets[targetNames[i]]);

		i++;
	}

	addIndexEntry(owner, relative);

	process.stdout.write('Elemenx Generator: ' + Types[type].Label + ' ' + entity.Name + ' -> ' + normalize(path.relative(application, entity.Entry)) + '\n');

	return {
		Files: targetNames,
		Index: owner,
		Entry: relative
	};
}

module.exports = {
	Generate: generate,
	GenerateApplication: generateApplication,
	Types: Types,
	NearestIndex: nearestIndex,
	ResolveApplicationRoot: resolveApplicationRoot
};