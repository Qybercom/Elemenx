'use strict';

var fs = require('fs');
var path = require('path');

function fail (message) {
	throw new Error(message);
}

function readIndex (directory) {
	var file = path.join(directory, 'index.js');
	var source;
	var value;
	
	if (!fs.existsSync(file))
		fail('index.js not found: ' + directory);
	
	source = fs.readFileSync(file, 'utf8').replace(/;\s*$/, '');
	
	try {
		value = Function('return (' + source + ');')();
	}
	catch (error) {
		fail('invalid index ' + file + ': ' + error.message);
	}
	
	if (!Array.isArray(value))
		fail('index must return an Array: ' + file);
	
	return value;
}

function entityType (file, root, source) {
	var relative = path.relative(root, file).replace(/\\/g, '/').toLowerCase();
	var match;
	
	if (relative.indexOf('components/') === 0) return 'Component';
	if (relative.indexOf('services/') === 0) return 'Service';
	if (relative.indexOf('guards/') === 0) return 'Guard';
	if (relative.indexOf('directives/') === 0) return 'Directive';
	
	match = /\bElemenx\.(Component|Service|Guard|Directive)\s*\(/.exec(source || '');
	if (match) return match[1];
	
	return 'Entity';
}

function inlineResources (file, source) {
	var directory = path.dirname(file);
	
	function replace (key, inlineKey) {
		var pattern = new RegExp('\\b' + key + '\\s*:\\s*([\\\'\"])([^\\\'\"]+)\\1', 'g');
		
		source = source.replace(pattern, function (all, quote, target) {
			var resource = path.resolve(directory, target);
			if (!fs.existsSync(resource))
				fail(key + ' not found for ' + file + ': ' + target);
			
			return inlineKey + ': ' + JSON.stringify(fs.readFileSync(resource, 'utf8'));
		});
	}
	
	replace('TemplateURL', 'Template');
	replace('StyleURL', 'Style');
	
	return source;
}

function scan (directory, root, entities, visited) {
	var absolute = path.resolve(directory);
	
	if (visited[absolute]) return;
	visited[absolute] = true;
	
	var entries = readIndex(absolute);
	var i = 0;
	
	while (i < entries.length) {
		if (typeof entries[i] !== 'string')
			fail('index entries must be strings: ' + absolute);
		
		var target = path.resolve(absolute, entries[i]);
		
		if (/\.js$/i.test(entries[i])) {
			var name = path.basename(target, '.js');
			var source = fs.readFileSync(target, 'utf8');
			var type = entityType(target, root, source);
			
			if (type === 'Component')
				source = inlineResources(target, source);
			
			if (!entities[type])
				entities[type] = {};
			
			if (entities[type][name])
				fail('duplicate entity ' + type + ':' + name);
			
			entities[type][name] = source;
		}
		else {
			scan(target, root, entities, visited);
		}
		
		i++;
	}
}

function render (entities) {
	var lines = ['Elemenx.Bundle({'];
	var types = Object.keys(entities).sort();
	var ti = 0;
	
	while (ti < types.length) {
		var type = types[ti];
		var names = Object.keys(entities[type]).sort();
		var ni = 0;
		
		lines.push('\t' + JSON.stringify(type) + ': {');
		
		while (ni < names.length) {
			var name = names[ni];
			var source = entities[type][name].replace(/\r\n/g, '\n').replace(/\r/g, '\n');
			var body = source
				.split('\n')
				.map(function (line) {
					return '\t\t\t' + line;
				})
				.join('\n');
			
			lines.push('\t\t' + JSON.stringify(name) + ': function () {');
			lines.push(body);
			lines.push('\t\t}' + (ni + 1 < names.length ? ',' : ''));
			
			ni++;
		}
		
		lines.push('\t}' + (ti + 1 < types.length ? ',' : ''));
		
		ti++;
	}
	
	lines.push('});');
	
	return lines.join('\n');
}

function indexTemplates (source) {
	var result = [];
	var stack = [];
	var pattern = /<\/?template\b[^>]*>/gi;
	var match;
	var opening;
	var idMatch;
	var frame;
	
	while ((match = pattern.exec(source))) {
		opening = match[0].charAt(1) !== '/';
		
		if (opening) {
			idMatch = /\bid\s*=\s*(["'])(.*?)\1/i.exec(match[0]);
			stack.push({
				ID: idMatch ? idMatch[2] : null,
				Start: pattern.lastIndex
			});
		}
		else if (stack.length) {
			frame = stack.pop();
			if (frame.ID) {
				result.push({
					ID: frame.ID,
					HTML: source.substring(frame.Start, match.index)
				});
			}
		}
	}
	
	return result;
}

function renderTemplates (source) {
	var templates = indexTemplates(source);
	var lines = [];
	var i = 0;
	
	while (i < templates.length) {
		lines.push('Elemenx.Template(' + JSON.stringify(templates[i].ID) + ', ' + JSON.stringify(templates[i].HTML) + ');');
		i++;
	}
	
	return lines.join('\n');
}

function removeTree (target) {
	if (fs.existsSync(target))
		fs.rmSync(target, {recursive: true, force: true});
}

function isInside (target, parent) {
	var relative = path.relative(path.resolve(parent), path.resolve(target));
	
	return relative === '' || (relative.indexOf('..' + path.sep) !== 0 && relative !== '..' && !path.isAbsolute(relative));
}

function copyPublic (source, output, excludedPaths) {
	var entries = fs.readdirSync(source, {withFileTypes: true});
	var i = 0;
	
	excludedPaths = excludedPaths || [];
	
	while (i < entries.length) {
		var entry = entries[i];
		var from = path.join(source, entry.name);
		var to = path.join(output, entry.name);
		var excluded = false;
		var ei = 0;
		
		while (ei < excludedPaths.length) {
			if (isInside(from, excludedPaths[ei])) {
				excluded = true;
				
				break;
			}
			
			ei++;
		}
		
		if (!excluded) {
			if (entry.isDirectory()) {
				fs.mkdirSync(to, {recursive: true});
				
				copyPublic(from, to, excludedPaths);
			}
			else if (entry.isFile()) {
				fs.copyFileSync(from, to);
			}
		}
		
		i++;
	}
}
function unique (values) {
	var result = [];
	var seen = {};
	var i = 0;
	
	while (i < values.length) {
		var value = String(values[i] || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
		
		if (value && !seen[value]) {
			seen[value] = true;
			
			result.push(value);
		}
		
		i++;
	}
	
	return result;
}

function applicationRoots (project, options, appSource) {
	var configured = options.applications;
	var roots = [];
	var pattern;
	var match;
	
	if (typeof configured === 'string')
		configured = configured.split(',');
	
	if (Array.isArray(configured) && configured.length) roots = configured.slice();
	else if (options.applicationExplicit && options.application) roots = [options.application];
	else {
		pattern = /\bRoot\s*:\s*(['"])([^'"]+)\1/g;
		
		while ((match = pattern.exec(appSource))) {
			if (fs.existsSync(path.resolve(project, match[2], 'index.js'))) {
				roots.push(match[2]);
			}
		}
		
		if (!roots.length && options.application) roots.push(options.application);
	}
	
	if (!roots.length)
		roots.push('application');
	
	return unique(roots);
}

function applicationDirectories (project, roots) {
	var result = [];
	var i = 0;
	
	while (i < roots.length) {
		var directory = path.resolve(project, roots[i]);
		
		if (!fs.existsSync(path.join(directory, 'index.js')))
			fail('application graph root not found: ' + directory);
		
		result.push(directory);
		
		i++;
	}
	
	return result;
}

function build (project, options) {
	options = options || {};
	
	var appName = options.entry || 'app.js';
	var indexName = options.index || 'index.html';
	var outputName = options.out || 'dist';
	var app = path.join(project, appName);
	var index = path.join(project, indexName);
	var output = path.join(project, outputName);
	var framework = path.resolve(__dirname, '..', 'elemenx.js');
	var entities = {};
	var appSource;
	var indexSource;
	var templateBundle;
	var roots;
	var directories;
	var bundle;
	var i = 0;
	
	if (!fs.existsSync(app))
		fail('app entry not found: ' + app);
	
	if (!fs.existsSync(index))
		fail('index not found: ' + index);
	
	if (!fs.existsSync(framework))
		fail('elemenx.js not found: ' + framework);
	
	appSource = fs.readFileSync(app, 'utf8').replace(/^\uFEFF/, '');
	indexSource = fs.readFileSync(index, 'utf8').replace(/^\uFEFF/, '');
	templateBundle = renderTemplates(indexSource);
	roots = applicationRoots(project, options, appSource);
	directories = applicationDirectories(project, roots);
	
	while (i < directories.length) {
		scan(directories[i], directories[i], entities, {});
		
		i++;
	}
	
	bundle = render(entities);
	
	removeTree(output);
	fs.mkdirSync(output, {recursive: true});
	
	var excludedPaths = directories.concat([
		output,
		app,
		index,
		path.join(project, 'elemenx.config.js'),
		path.join(project, 'package.json'),
		path.join(project, 'package-lock.json'),
		path.join(project, 'index.production.html')
	]);
	
	copyPublic(project, output, excludedPaths);
	
	fs.copyFileSync(index, path.join(output, 'index.html'));
	fs.copyFileSync(framework, path.join(output, 'elemenx.js'));
	fs.writeFileSync(path.join(output, 'app.js'), (templateBundle ? templateBundle + '\n' : '') + bundle + '\n' + appSource.replace(/^\s+/, ''));
	
	process.stdout.write('Elemenx Builder: ' + output + '\n');
	
	return output;
}

function option (args, name, fallback) {
	var i = args.indexOf('--' + name);
	if (i === -1) return fallback;
	
	if (i + 1 >= args.length)
		fail('missing value for --' + name);
	
	return args[i + 1];
}

function serve (directory, args) {
	var childProcess = require('child_process');
	var port = option(args, 'port', process.env.PORT || '4173');
	var server = path.resolve(__dirname, 'server.js');
	var child = childProcess.spawn(process.execPath, [server, directory, String(port)], {stdio: 'inherit'});
	
	child.on('exit', function (code) {
		process.exit(code === null ? 1 : code);
	});
}

function usage () {
	fail('usage: node tools/builder.js build <project> [--out dist] [--application application] [--entry app.js] [--index index.html]\n' +
		'       node tools/builder.js serve <directory> [--port 4173]\n' +
		'       node tools/builder.js dev <project> [--port 4173]');
}

module.exports = {
	Build: build,
	Scan: scan,
	Render: render,
	IndexTemplates: indexTemplates,
	RenderTemplates: renderTemplates,
	ApplicationRoots: applicationRoots
};

if (require.main === module) {
	var args = process.argv.slice(2);
	var command = args.shift();
	var target = args.shift();
	
	try {
		if (!command)
			throw new Error('usage: node tools/builder.js build <project>');
		
		if (command !== 'build') {
			if (!target)
				throw new Error('legacy output path is required');
			
			var legacyRoot = path.resolve(command);
			var legacyOutput = path.resolve(target);
			var legacyEntities = {};
			
			scan(legacyRoot, legacyRoot, legacyEntities, {});
			
			fs.mkdirSync(path.dirname(legacyOutput), {recursive: true});
			fs.writeFileSync(legacyOutput, render(legacyEntities));
			
			process.stdout.write('Elemenx Builder: ' + legacyOutput + '\n');
		}
		else {
			if (!target)
				throw new Error('project path is required');
			
			build(path.resolve(target), {
				out: option(args, 'out', 'dist'),
				application: option(args, 'application', 'application'),
				applicationExplicit: args.indexOf('--application') !== -1,
				entry: option(args, 'entry', 'app.js'),
				index: option(args, 'index', 'index.html')
			});
		}
	}
	catch (error) {
		process.stderr.write('Elemenx Builder: ' + error.message + '\n');
		process.exitCode = 1;
	}
}