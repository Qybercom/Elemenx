'use strict';

var fs = require('fs');
var path = require('path');
var common = require('./common.js');
var Minify = require('./minify.js');
var fail = common.fail;

function readIndex (directory) {
	var file = path.join(directory, 'index.js');
	if (!fs.existsSync(file))
		fail('index.js not found: ' + directory);

	return common.parseIndex(file);
}

function entityType (file, root, source) {
	var relative = path.relative(root, file).replace(/\\/g, '/').toLowerCase();
	var match;

	if (relative.indexOf('components/') === 0) return 'Component';
	if (relative.indexOf('services/') === 0) return 'Service';
	if (relative.indexOf('guards/') === 0) return 'Guard';
	if (relative.indexOf('directives/') === 0) return 'Directive';

	match = /\bElemenx\.(Component|Service|Guard|Directive)\s*\(/.exec(source || '');

	if (match)
		return match[1];

	return 'Entity';
}

/* Puts the template and the style of a Component into its definition; min minifies them (a single-file build). */
function inlineResources (file, source, min) {
	var directory = path.dirname(file);

	function replace (key, inlineKey, minify) {
		var escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		var pattern = new RegExp('(^|[^A-Za-z0-9_$])' + escaped + '\\s*:\\s*([\'"])([^\'"]+)\\2', 'g');

		source = source.replace(pattern, function (all, prefix, quote, target) {
			var resource = path.resolve(directory, target);
			if (!fs.existsSync(resource))
				fail(key + ' not found for ' + file + ': ' + target);

			return prefix + inlineKey + ': ' + JSON.stringify(min ? minify(fs.readFileSync(resource, 'utf8')) : fs.readFileSync(resource, 'utf8'));
		});
	}

	replace('$TemplateURL', '$Template', Minify.HTML);
	replace('$StyleURL', '$Style', Minify.CSS);

	return source;
}

function scan (directory, root, entities, visited, declaredNames, min) {
	var absolute = path.resolve(directory);
	if (visited[absolute]) return;

	visited[absolute] = true;

	var entries = readIndex(absolute);
	var i = 0;

	while (i < entries.length) {
		if (typeof entries[i] !== 'string')
			fail('index entries must be strings: ' + absolute);

		var target = path.resolve(absolute, entries[i]);

		if (/\.css$/i.test(entries[i])) {
			i++;

			continue;
		}

		if (/\.js$/i.test(entries[i])) {
			var name = path.basename(target, '.js');
			var source = fs.readFileSync(target, 'utf8');
			var type = entityType(target, root, source);
			var declared = declaredNames ? /\bElemenx\.(?:Component|Service|Guard|Directive)\s*\(\s*(['\"])([^'\"]+)\1/.exec(source) : null;
			if (declared)
				name = declared[2];

			if (type === 'Component')
				source = inlineResources(target, source, min);

			if (!entities[type])
				entities[type] = {};

			if (entities[type][name])
				fail('duplicate entity ' + type + ':' + name);

			entities[type][name] = source;
		}
		else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
			scan(target, root, entities, visited, declaredNames, min);
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

	if (Array.isArray(configured) && configured.length) {
		roots = configured.slice();
	}
	else if (options.applicationExplicit && options.application) {
		roots = [options.application];
	}
	else {
		pattern = /\bElemenx\.Application\s*\(\s*[^,]+,\s*\{[\s\S]*?\$Root\s*:\s*(['"])([^'"]+)\1[\s\S]*?\}\s*\)/g;

		while ((match = pattern.exec(appSource))) {
			if (fs.existsSync(path.resolve(project, match[2], 'index.js')))
				roots.push(match[2]);
		}

		if (!roots.length && options.application)
			roots.push(options.application);
	}

	if (!roots.length)
		roots.push('application');

	return unique(roots);
}

function libraryDeclarations (project, appSource) {
	var result = [];
	var names = {};
	var pattern = /\bElemenx\.Library\s*\(\s*(['"])([^'"]+)\1\s*,\s*\{([\s\S]*?)(?:\$Root|Root)\s*:\s*(['"])([^'"]+)\4([\s\S]*?)\}\s*\)/g;
	var match;
	var packageRoot = path.resolve(__dirname, '..');

	while ((match = pattern.exec(appSource))) {
		var configured = match[5];
		var directory = path.resolve(project, configured);
		if (!fs.existsSync(path.join(directory, 'index.js')))
			directory = path.resolve(packageRoot, configured);

		if (!fs.existsSync(path.join(directory, 'index.js'))) continue;

		result.push({Name: match[2], Root: configured, Directory: directory});

		names[match[2]] = true;
	}

	var usePattern = /(?:\$Use|Use)\s*:\s*(?:\[([\s\S]*?)\]|(['"])([^'"]+)\2)/g;

	while ((match = usePattern.exec(appSource))) {
		var body = match[1] || (match[3] ? JSON.stringify(match[3]) : '');
		var itemPattern = /(['"])([^'"]+)\1/g;
		var item;

		while ((item = itemPattern.exec(body))) {
			if (item[2] === 'ElemenxUI' && !names.ElemenxUI) {
				result.push({Name: 'ElemenxUI', Root: 'libraries/ElemenxUI', Directory: path.resolve(packageRoot, 'libraries/ElemenxUI')});

				names.ElemenxUI = true;
			}
		}
	}

	return result;
}

function libraryRoots (project, appSource) {
	var declarations = libraryDeclarations(project, appSource);
	var roots = [];
	var i = 0;

	while (i < declarations.length) {
		roots.push(declarations[i].Root);

		i++;
	}

	return unique(roots);
}

function sourceUsesComponent (source, name) {
	var escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	return new RegExp('<\\s*' + escaped + '(?:\\s|/?>)').test(source || '');
}

function selectLibraryEntities (entities, catalog) {
	var type;

	for (type in catalog) {
		if (!Object.prototype.hasOwnProperty.call(catalog, type) || type === 'Component') continue;

		if (!entities[type])
			entities[type] = {};

		var names = Object.keys(catalog[type]);
		var ni = 0;

		while (ni < names.length) {
			if (!entities[type][names[ni]])
				entities[type][names[ni]] = catalog[type][names[ni]];

			ni++;
		}
	}

	if (!catalog.Component) return;

	var changed = true;

	while (changed) {
		changed = false;

		var available = Object.keys(catalog.Component);
		var sources = [];
		var types = Object.keys(entities);
		var ti = 0;

		while (ti < types.length) {
			var current = entities[types[ti]];
			var currentNames = Object.keys(current);
			var ci = 0;

			while (ci < currentNames.length) {
				sources.push(current[currentNames[ci]]);

				ci++;
			}

			ti++;
		}

		var ai = 0;

		while (ai < available.length) {
			var name = available[ai];

			if (!entities.Component || !entities.Component[name]) {
				var si = 0;

				while (si < sources.length) {
					if (sourceUsesComponent(sources[si], name)) {
						if (!entities.Component)
							entities.Component = {};

						entities.Component[name] = catalog.Component[name];
						changed = true;

						break;
					}

					si++;
				}
			}

			ai++;
		}
	}
}

function libraryResources (directory, root, result, visited) {
	var absolute = path.resolve(directory);
	if (visited[absolute]) return;

	visited[absolute] = true;

	var entries = readIndex(absolute);
	var i = 0;

	while (i < entries.length) {
		var target = path.resolve(absolute, entries[i]);

		if (/\.js$/i.test(entries[i])) {
			i++;

			continue;
		}

		if (fs.existsSync(target) && fs.statSync(target).isDirectory()) libraryResources(target, root, result, visited);
		else result.push({Source: target, Relative: path.relative(root, target), Style: /\.css$/i.test(entries[i])});

		i++;
	}
}

function copyLibraryResources (output, declarations) {
	var hrefs = [];
	var i = 0;

	while (i < declarations.length) {
		var declaration = declarations[i];
		var resources = [];

		libraryResources(declaration.Directory, declaration.Directory, resources, {});

		var ri = 0;

		while (ri < resources.length) {
			if (!fs.existsSync(resources[ri].Source))
				fail('Library resource not found: ' + resources[ri].Source);

			var target = path.resolve(output, declaration.Root, resources[ri].Relative);

			fs.mkdirSync(path.dirname(target), {recursive: true});
			fs.copyFileSync(resources[ri].Source, target);

			if (resources[ri].Style)
				hrefs.push('/' + declaration.Root.replace(/^\/+|\/+$/g, '') + '/' + resources[ri].Relative.replace(/\\/g, '/'));

			ri++;
		}

		i++;
	}

	return unique(hrefs);
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

	var libraries = libraryDeclarations(project, appSource);

	directories = applicationDirectories(project, roots);

	while (i < directories.length) {
		scan(directories[i], directories[i], entities, {}, false, options.single);

		i++;
	}

	i = 0;
	while (i < libraries.length) {
		var catalog = {};

		scan(libraries[i].Directory, libraries[i].Directory, catalog, {}, true, options.single);

		selectLibraryEntities(entities, catalog);

		i++;
	}

	bundle = render(entities);

	if (options.single)
		return single({Project: project, Output: output, Index: index, Entry: app, Framework: framework, Roots: roots, Libraries: libraries, Code: (templateBundle ? templateBundle + '\n' : '') + bundle + '\n' + appSource});

	removeTree(output);

	fs.mkdirSync(output, {recursive: true});

	var excludedPaths = applicationDirectories(project, roots).concat([
		output,
		app,
		index,
		path.join(project, 'elemenx.config.js'),
		path.join(project, 'package.json'),
		path.join(project, 'package-lock.json'),
		path.join(project, 'index.production.html')
	]);

	copyPublic(project, output, excludedPaths);

	var libraryStyleHrefs = copyLibraryResources(output, libraries);
	var productionIndex = fs.readFileSync(index, 'utf8');

	if (libraryStyleHrefs.length) {
		var styleMarkup = libraryStyleHrefs.map(function (href) { return '<link rel="stylesheet" href="' + href + '">'; }).join('\n');

		if (/<\/head>/i.test(productionIndex)) productionIndex = productionIndex.replace(/<\/head>/i, styleMarkup + '\n</head>');
		else productionIndex = styleMarkup + '\n' + productionIndex;
	}

	fs.writeFileSync(path.join(output, 'index.html'), productionIndex);
	fs.copyFileSync(framework, path.join(output, 'elemenx.js'));
	fs.writeFileSync(path.join(output, 'app.js'), (templateBundle ? templateBundle + '\n' : '') + bundle + '\n' + appSource.replace(/^\s+/, ''));

	process.stdout.write('Elemenx Builder: ' + output + '\n');

	return output;
}

/* Text for a <script> of the page: the HTML parser ends a script at </script and changes state at <!--. */
function scriptText (source) {
	return source.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

/*
 * A build of the whole Application into one index.html: the framework, the code of the Application, its templates and
 * styles and the Libraries it uses (their stylesheets, and their other files through Elemenx.Resource), inline and
 * minified. Images and the other public files of the project are copied next to it.
 */
function single (job) {
	var page = fs.readFileSync(job.Index, 'utf8').replace(/^\uFEFF/, '');
	var styles = [];
	var resources = [];
	var framework = scriptText(Minify.JavaScript(fs.readFileSync(job.Framework, 'utf8')));
	var code;
	var replaced = {Framework: false, Entry: false};

	job.Libraries.forEach(function (declaration) {
		var list = [];
		var root = '/' + String(declaration.Root).replace(/^\/+|\/+$/g, '');

		libraryResources(declaration.Directory, declaration.Directory, list, {});

		list.forEach(function (item) {
			var text = fs.readFileSync(item.Source, 'utf8');
			var relative = item.Relative.replace(/\\/g, '/');

			if (item.Style) styles.push(Minify.CSS(text));
			else resources.push('Elemenx.Resource(' + JSON.stringify(root + '/' + relative) + ', ' + JSON.stringify(/\.json$/i.test(relative) ? Minify.JSON(text) : Minify.HTML(text)) + ');');
		});
	});

	code = scriptText(Minify.JavaScript(resources.join('\n') + '\n' + job.Code));

	/* The framework and the Application take the places of their <script src>: the framework stays one script of its own, so the workers can load it. */
	page = page.replace(/<script\b[^>]*\bsrc\s*=\s*(["'])([^"']*)\1[^>]*>\s*<\/script>/gi, function (tag, quote, src) {
		var name = src.replace(/[?#].*$/, '').split('/').pop();

		if (name === 'elemenx.js' || name === 'elemenx.min.js') {
			replaced.Framework = true;

			return '<script id="elemenx">' + framework + '</script>';
		}

		if (name === path.basename(job.Entry)) {
			replaced.Entry = true;

			return '<script>' + code + '</script>';
		}

		return tag;
	});

	if (!replaced.Framework || !replaced.Entry)
		fail('index.html must load elemenx.js and ' + path.basename(job.Entry) + ' with <script src> for a single-file build');

	if (styles.length) {
		if (/<\/head>/i.test(page)) page = page.replace(/<\/head>/i, '<style>' + styles.join('') + '</style>\n</head>');
		else page = '<style>' + styles.join('') + '</style>\n' + page;
	}

	removeTree(job.Output);

	fs.mkdirSync(job.Output, {recursive: true});

	copyPublic(job.Project, job.Output, applicationDirectories(job.Project, job.Roots).concat([
		job.Output,
		job.Entry,
		job.Index,
		path.join(job.Project, 'elemenx.config.js'),
		path.join(job.Project, 'package.json'),
		path.join(job.Project, 'package-lock.json'),
		path.join(job.Project, 'index.production.html')
	]));

	fs.writeFileSync(path.join(job.Output, 'index.html'), page);

	process.stdout.write('Elemenx Builder: ' + path.join(job.Output, 'index.html') + ' (' + Math.round(Buffer.byteLength(page) / 1024) + ' KB)\n');

	return job.Output;
}

function option (args, name, fallback) {
	var i = args.indexOf('--' + name);
	if (i === -1)
		return fallback;

	if (i + 1 >= args.length)
		fail('missing value for --' + name);

	return args[i + 1];
}

module.exports = {
	Build: build,
	ScriptText: scriptText,
	Scan: scan,
	Render: render,
	IndexTemplates: indexTemplates,
	RenderTemplates: renderTemplates,
	ApplicationRoots: applicationRoots,
	LibraryRoots: libraryRoots,
	LibraryDeclarations: libraryDeclarations,
	SelectLibraryEntities: selectLibraryEntities
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