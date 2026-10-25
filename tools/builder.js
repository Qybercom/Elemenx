'use strict';

var fs = require('fs');
var path = require('path');
var common = require('./common.js');
var Minify = require('./minify.js');
var Shake = require('./shake.js');
var Splash = require('./splash.js');
var PWA = require('./pwa.js');
var Expressions = require('./expressions.js');
var Extension = require('./extension.js');
var Electron = require('./electron.js');
var Capacitor = require('./capacitor.js');
var fail = common.fail;

/*
 * A page without <meta name="viewport"> is drawn by a phone as a desktop page about 980 pixels wide and zoomed out:
 * none of the narrow layouts of the components apply there.
 */
function warnViewport (page, name) {
	if (!/<meta\b[^>]*\bname\s*=\s*["']?viewport\b/i.test(page))
		process.stderr.write('Elemenx Builder: ' + name + ' has no <meta name="viewport" content="width=device-width, initial-scale=1">: phones show it as a desktop page, zoomed out\n');
}

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

/*
 * A definition without its $Meta: what it tells the tools of itself (a builder, a reference) is no part of a build
 * that asks none of it (no Elemenx.Meta, no Designer). The braces in its texts are skipped with them.
 */
function stripMeta (source) {
	var pattern = /(^|\n)([ \t]*)\$Meta\s*:\s*\{/g;
	var match = pattern.exec(source);
	var depth;
	var i;
	var quote;

	while (match) {
		depth = 0;
		i = match.index + match[0].length - 1;
		quote = '';

		while (i < source.length) {
			if (quote) {
				if (source.charAt(i) === '\\') i++;
				else if (source.charAt(i) === quote) quote = '';
			}
			else if (source.charAt(i) === '\'' || source.charAt(i) === '"') {
				quote = source.charAt(i);
			}
			else if (source.charAt(i) === '{') {
				depth++;
			}
			else if (source.charAt(i) === '}') {
				depth--;

				if (!depth) break;
			}

			i++;
		}

		i++;

		if (source.charAt(i) === ',')
			i++;

		source = source.substring(0, match.index + match[1].length) + source.substring(i).replace(/^[ \t]*\r?\n/, '');
		pattern.lastIndex = match.index;
		match = pattern.exec(source);
	}

	return source;
}

function scan (directory, root, entities, visited, declaredNames, min, meta) {
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

			if (declaredNames && meta === false)
				source = stripMeta(source);

			if (!entities[type])
				entities[type] = {};

			if (entities[type][name])
				fail('duplicate entity ' + type + ':' + name);

			entities[type][name] = source;
		}
		else if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
			scan(target, root, entities, visited, declaredNames, min, meta);
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

/*
 * The folders and files of a project that are never public, wherever its build goes: the packages of npm, the history
 * of git, and the native projects of Capacitor (android, ios) with its config.
 */
function privatePaths (project) {
	return ['node_modules', '.git', 'android', 'ios', 'capacitor.config.json', 'capacitor.config.ts', 'capacitor.config.js'].map(function (name) {
		return path.join(project, name);
	});
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

/* Marks in shared the Services, Guards and Directives of a Library that the Application does not define: every Application gets them. */
function markShared (entities, catalog, shared) {
	Object.keys(catalog).forEach(function (type) {
		if (type === 'Component') return;

		Object.keys(catalog[type]).forEach(function (name) {
			if (!entities[type] || !entities[type][name])
				shared[type + ':' + name] = true;
		});
	});
}

/* The code of the entities an Application uses of its own: its entities and the Library Components it renders, not the shared ones. */
function ownCode (entities, shared) {
	var parts = [];

	Object.keys(entities).forEach(function (type) {
		Object.keys(entities[type]).forEach(function (name) {
			if (!shared[type + ':' + name])
				parts.push(entities[type][name]);
		});
	});

	return parts.join('\n');
}

/*
 * Whether a text uses a Library entity: a Component by its tag, a Directive by *name (or its name in quotes), a
 * Service or a Guard by its name in quotes ($Service('Toast'), $Guards: ['Auth']). Other entities always go in.
 */
function sourceUsesEntity (source, type, name) {
	var escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	if (type === 'Component')
		return sourceUsesComponent(source, name);

	if (type === 'Directive' && new RegExp('\\*' + escaped + '(?![A-Za-z0-9_$-])').test(source || '')) return true;
	if (type === 'Service' || type === 'Guard' || type === 'Directive') return new RegExp('[\'"]' + escaped + '[\'"]').test(source || '');

	return true;
}

/*
 * Adds to entities the ones of a Library catalog that the Application uses, and the ones they use, until nothing
 * changes. text is the code the build has besides the entities (the entry, the page and its templates).
 */
function selectLibraryEntities (entities, catalog, text) {
	var changed = true;

	while (changed) {
		changed = false;

		var sources = [text || ''];

		Object.keys(entities).forEach(function (type) {
			Object.keys(entities[type]).forEach(function (name) {
				sources.push(entities[type][name]);
			});
		});

		Object.keys(catalog).forEach(function (type) {
			Object.keys(catalog[type]).forEach(function (name) {
				if (entities[type] && entities[type][name]) return;

				if (sources.some(function (source) {
					return sourceUsesEntity(source, type, name);
				})) {
					if (!entities[type])
						entities[type] = {};

					entities[type][name] = catalog[type][name];
					changed = true;
				}
			});
		});
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

/*
 * Whether a build takes a pack of a Library (packs.json: {Files, Uses, Language}): the Application asks for it
 * (Packs, all for every pack) or its code has a text of Uses. language: the language of the page, which a pack of a
 * language must have too (a build in one file); without one (a build in a folder, which may change its language), a
 * pack of a language goes in with its texts, or with the pack it is of (emoji.ru with emoji).
 */
function packNeeded (name, pack, uses, asked, language) {
	if (asked.indexOf(name) !== -1 || asked.indexOf('all') !== -1) return true;
	if (language === undefined && pack.Language && asked.indexOf(name.split('.')[0]) !== -1) return true;
	if (language !== undefined && pack.Language && pack.Language !== String(language || '').toLowerCase()) return false;

	return (pack.Uses || []).some(function (text) {
		return uses.indexOf(text) !== -1;
	});
}

/*
 * A dictionary of a Library (locales/<language>.json) with the phrases the code of a build names only: a key in quotes
 * ('ui.select.placeholder', in $T, Elemenx.Locale.Text or Key:), or every key under a key built at run time from its
 * start ('ui.presence.' + status). The keys of a dictionary are its nested names joined by dots; an object of plural
 * forms is the phrase of its key. Returns the text of the dictionary, minified.
 */
function trimDictionary (text, code) {
	var named = {};
	var starts = [];
	var pattern = /['"`](ui\.[A-Za-z0-9_.-]+)['"`](\s*\+)?/g;
	var match;

	while ((match = pattern.exec(code))) {
		if (match[2] || match[1].charAt(match[1].length - 1) === '.') starts.push(match[1].replace(/\.?$/, '.'));
		else named[match[1]] = true;
	}

	function kept (key) {
		return named[key] || starts.some(function (start) {
			return key.indexOf(start) === 0;
		});
	}

	function walk (value, prefix) {
		var result = {};
		var any = false;

		Object.keys(value).forEach(function (name) {
			var key = prefix ? prefix + '.' + name : name;
			var inner;

			if (kept(key)) {
				result[name] = value[name];
				any = true;
			}
			else if (value[name] && typeof value[name] === 'object') {
				inner = walk(value[name], key);

				if (inner) {
					result[name] = inner;
					any = true;
				}
			}
		});

		return any ? result : null;
	}

	return JSON.stringify(walk(JSON.parse(text), '') || {});
}

/* Whether a file of a Library is one of its dictionaries. */
function dictionary (relative) {
	return /^locales\/[^/]+\.json$/i.test(String(relative).replace(/\\/g, '/'));
}

/*
 * The files of the Libraries next to a build in a folder; the paths of their stylesheets. choice {Uses, Packs,
 * Removed, Code}: the packs of a Library its code does not use stay out, their names in Removed[Library], and its
 * dictionaries keep the phrases Code names (null: every file, whole).
 */
function copyLibraryResources (output, declarations, choice) {
	var hrefs = [];
	var i = 0;

	while (i < declarations.length) {
		var declaration = declarations[i];
		var resources = [];
		var packs = choice ? common.readPacks(declaration.Directory) : {};

		libraryResources(declaration.Directory, declaration.Directory, resources, {});

		var ri = 0;

		while (ri < resources.length) {
			if (!fs.existsSync(resources[ri].Source))
				fail('Library resource not found: ' + resources[ri].Source);

			var pack = choice ? common.packOf(packs, resources[ri].Relative.replace(/\\/g, '/')) : null;

			if (pack && !packNeeded(pack, packs[pack], choice.Uses, choice.Packs)) {
				choice.Removed[declaration.Name] = choice.Removed[declaration.Name] || [];

				if (choice.Removed[declaration.Name].indexOf(pack) === -1)
					choice.Removed[declaration.Name].push(pack);

				ri++;

				continue;
			}

			var target = path.resolve(output, declaration.Root, resources[ri].Relative);

			fs.mkdirSync(path.dirname(target), {recursive: true});

			if (choice && dictionary(resources[ri].Relative)) fs.writeFileSync(target, trimDictionary(fs.readFileSync(resources[ri].Source, 'utf8'), choice.Code));
			else fs.copyFileSync(resources[ri].Source, target);

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

	if (options.extension)
		return extension(project, options);

	if (options.native)
		return native(project, options);

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
	var shared = {};
	var shaken;
	var i = 0;

	if (!fs.existsSync(app))
		fail('app entry not found: ' + app);

	if (!fs.existsSync(index))
		fail('index not found: ' + index);

	if (!fs.existsSync(framework))
		fail('elemenx.js not found: ' + framework);

	appSource = fs.readFileSync(app, 'utf8').replace(/^\uFEFF/, '');
	indexSource = fs.readFileSync(index, 'utf8').replace(/^\uFEFF/, '');

	warnViewport(indexSource, indexName);

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

		scan(libraries[i].Directory, libraries[i].Directory, catalog, {}, true, options.single, /\bElemenx\.Meta\b|Designer/.test((templateBundle || '') + '\n' + indexSource + '\n' + appSource));

		markShared(entities, catalog, shared);

		selectLibraryEntities(entities, catalog, (templateBundle || '') + '\n' + indexSource + '\n' + appSource);

		i++;
	}

	bundle = render(entities);

	/* With precompile, the expressions of the templates go as code before the bundle (see expressions.js). */
	if (options.precompile)
		bundle = Expressions.Render([bundle, appSource], [indexSource]) + bundle;

	/* The splash and the worker of a PWA the build puts in the page keep their sections of the framework. */
	shaken = frameworkSource(framework, (templateBundle || '') + '\n' + bundle + '\n' + indexSource + '\n' + appSource + (options.splash !== false && !options.widget && Splash.Settings(project, options.splash) ? '\nelemenx-splash' : '') + (options.pwa && !options.single && !options.widget ? '\nelemenx-pwa-worker' : ''), options.full);

	if (options.single || options.widget) {
		return (options.widget ? widget : single)({
			Project: project,
			Splash: options.splash === false ? null : Splash.Settings(project, options.splash),
			Output: output,
			Index: index,
			Entry: app,
			Framework: framework,
			FrameworkSource: shaken,
			Roots: roots,
			Libraries: libraries,
			Code: (templateBundle ? templateBundle + '\n' : '') + bundle + '\n' + appSource,
			Full: !!options.full,
			Uses: ownCode(entities, shared) + '\n' + indexSource + '\n' + appSource,
			Packs: options.packs || []
		});
	}

	removeTree(output);

	fs.mkdirSync(output, {recursive: true});

	var excludedPaths = applicationDirectories(project, roots).concat(options.excludes || [], privatePaths(project), [
		output,
		app,
		index,
		path.join(project, 'elemenx.config.js'),
		path.join(project, 'package.json'),
		path.join(project, 'package-lock.json'),
		path.join(project, 'index.production.html')
	]);

	copyPublic(project, output, excludedPaths);

	var choice = options.full ? null : {Uses: ownCode(entities, shared) + '\n' + indexSource + '\n' + appSource, Packs: options.packs || [], Removed: {}, Code: (templateBundle || '') + '\n' + bundle + '\n' + indexSource + '\n' + appSource};
	var libraryStyleHrefs = copyLibraryResources(output, libraries, choice);

	Object.keys(choice ? choice.Removed : {}).forEach(function (name) {
		process.stdout.write('Elemenx Builder: without the packs of ' + name + ': ' + choice.Removed[name].join(', ') + ' (unused; --packs or --full keeps them)\n');
	});

	var productionIndex = fs.readFileSync(index, 'utf8');

	if (libraryStyleHrefs.length) {
		var styleMarkup = libraryStyleHrefs.map(function (href) { return '<link rel="stylesheet" href="' + href + '">'; }).join('\n');

		if (/<\/head>/i.test(productionIndex)) productionIndex = productionIndex.replace(/<\/head>/i, styleMarkup + '\n</head>');
		else productionIndex = styleMarkup + '\n' + productionIndex;
	}

	/* The splash of the Application, at the top of its body (see splash.js). */
	if (options.splash !== false)
		productionIndex = Splash.Inject(productionIndex, Splash.Settings(project, options.splash));

	fs.writeFileSync(path.join(output, 'index.html'), productionIndex);
	fs.writeFileSync(path.join(output, 'elemenx.js'), shaken);
	fs.writeFileSync(path.join(output, 'app.js'), (templateBundle ? templateBundle + '\n' : '') + bundle + '\n' + appSource.replace(/^\s+/, ''));

	/* An installable application of the system, last: its worker keeps every file of the build (see pwa.js). */
	var pwa = PWA.Settings(project, options.pwa, productionIndex, output, options.splash === false ? null : Splash.Settings(project, options.splash));
	if (pwa)
		process.stdout.write('Elemenx Builder: a PWA, ' + PWA.Apply(output, pwa).join(', ') + (pwa.Icons.length ? '' : ' (no PWA.Icon: a browser installs it with an icon of 192 and of 512 pixels)') + '\n');

	process.stdout.write('Elemenx Builder: ' + output + '\n');

	return output;
}

/*
 * A build of the Application as a browser extension (see extension.js): its production build, with its expressions
 * precompiled, in out/extension/app, made into out/extension/chrome and out/extension/firefox with a zip of each.
 */
function extension (project, options) {
	var outputName = options.out || 'dist';
	var target = path.join(project, outputName, 'extension');
	var folder = path.join(target, 'app');
	var settings = options.extensionSettings || {};
	var result;

	if (options.single || options.widget)
		fail('--extension is a build of its own: not with --single or --widget');

	removeTree(target);

	build(project, {
		application: options.application,
		applicationExplicit: options.applicationExplicit,
		applications: options.applications,
		entry: options.entry,
		index: options.index,
		out: path.relative(project, folder),
		full: options.full,
		packs: options.packs,
		splash: false,
		precompile: true,
		excludes: [path.join(project, outputName)]
	});

	result = Extension.Pack(folder, target, project, {
		Surface: options.surface || settings.Surface,
		Name: settings.Name,
		Description: settings.Description,
		Version: settings.Version,
		ID: settings.ID,
		Icons: settings.Icons,
		Manifest: settings.Manifest
	});

	removeTree(folder);

	process.stdout.write('Elemenx Builder: ' + result.Chrome + ' (Chrome, Edge), ' + result.Firefox + ' (Firefox), and a zip of each\n');

	return target;
}

/* The platforms of elemenx build --native: a desktop program (Electron) and mobile programs (Capacitor). */
var NativePlatforms = ['desktop', 'mobile'];

/*
 * A build of the Application as native programs: its production build, with its expressions precompiled, once, then
 * for each platform (options.native: 'desktop', 'mobile', or 'all'): out/native/desktop, a desktop program with its
 * main script (see electron.js), and the program in out/native/desktop-bin when the project has Electron and its
 * packager; out/native/mobile, the web folder of the Capacitor project of the project (see capacitor.js). The
 * settings of a platform: options.nativeSettings.Desktop and .Mobile (Native in elemenx.config.js).
 */
function native (project, options) {
	var outputName = options.out || 'dist';
	var root = path.join(project, outputName, 'native');
	var staging = path.join(project, outputName, 'native-app');
	var platforms = options.native === true || options.native === 'all' ? NativePlatforms : [options.native];
	var settings = options.nativeSettings || {};
	/* The splash of the Application: its color is the one of the window, and of the screen of a phone, before the page paints. */
	var splash = options.splash === false ? null : Splash.Settings(project, options.splash);
	var command = function (platform) {
		return 'npx elemenx build --native ' + platform + (outputName === 'dist' ? '' : ' --out ' + outputName);
	};

	platforms.forEach(function (platform) {
		if (NativePlatforms.indexOf(platform) === -1)
			fail('unknown --native platform: ' + platform + ' (desktop, mobile, or none for all of them)');
	});

	if (options.single || options.widget || options.extension)
		fail('--native is a build of its own: not with --single, --widget or --extension');

	removeTree(staging);

	build(project, {
		application: options.application,
		applicationExplicit: options.applicationExplicit,
		applications: options.applications,
		entry: options.entry,
		index: options.index,
		out: path.relative(project, staging),
		full: options.full,
		packs: options.packs,
		splash: options.splash,
		precompile: true,
		excludes: [path.join(project, outputName)]
	});

	platforms.forEach(function (platform, index) {
		var source = staging;

		/* Each platform takes the build away: the ones before the last take a copy. */
		if (index < platforms.length - 1) {
			source = staging + '-' + platform;

			removeTree(source);

			fs.cpSync(staging, source, {recursive: true});
		}

		if (platform === 'desktop') {
			removeTree(path.join(root, 'desktop'));

			fs.mkdirSync(path.join(root, 'desktop'), {recursive: true});

			Electron.Pack(source, path.join(root, 'desktop'), path.join(root, 'desktop-bin'), project, settings.Desktop || {}, command('desktop'), splash);
		}
		else {
			Capacitor.Pack(source, path.join(root, 'mobile'), project, settings.Mobile || {}, command('mobile'), splash);
		}
	});

	return root;
}

/*
 * The framework of a build: elemenx.js without the sections the code of the build does not use (see shake.js), or
 * all of it when full is set. It reports the sections it leaves out.
 */
function frameworkSource (file, code, full) {
	var source = fs.readFileSync(file, 'utf8');
	var result;

	if (full)
		return source;

	result = Shake.Shake(source, code);

	if (result.Removed.length)
		process.stdout.write('Elemenx Builder: without ' + result.Removed.join(', ') + ' (unused; --full keeps them)\n');

	return result.Source;
}

/* Text for a <script> of the page: the HTML parser ends a script at </script and changes state at <!--. */
function scriptText (source) {
	return source.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

/*
 * The files of the Libraries of a build in one file: their stylesheets ({Name, Text}, minified) and the calls of
 * Elemenx.Resource that embed their other files. A pack of a Library goes in when the Application asks for it
 * (Packs) or uses it: its code has a text of Uses (a pack of a language, when it is the language of the page too).
 */
function libraryAssets (job, page) {
	var styles = [];
	var resources = [];
	var language = (/<html\b[^>]*\blang\s*=\s*["']?([A-Za-z]+)/i.exec(page) || [])[1];

	/* A pack of a Library goes in when the Application asks for it (Packs) or uses it: its code has a text of Uses. */
	function needed (name, pack) {
		return packNeeded(name, pack, job.Uses, job.Packs, language || '');
	}

	job.Libraries.forEach(function (declaration) {
		var list = [];
		var root = '/' + String(declaration.Root).replace(/^\/+|\/+$/g, '');
		var packs = common.readPacks(declaration.Directory);

		libraryResources(declaration.Directory, declaration.Directory, list, {});

		/* ElemenxUI takes its files from next to elemenx.js; in one file they are embedded under this root, so it keeps it. */
		if (declaration.Name === 'ElemenxUI')
			resources.push('if (Elemenx.Library && Elemenx.Library("ElemenxUI")) Elemenx.Library("ElemenxUI").$Root = ' + JSON.stringify(root) + ';');

		list.forEach(function (item) {
			var relative = item.Relative.replace(/\\/g, '/');
			var pack = common.packOf(packs, relative);
			if (pack && !needed(pack, packs[pack])) return;

			var text = fs.readFileSync(item.Source, 'utf8');

			/* Its dictionaries with the phrases the Application names (whole with --full). */
			if (!job.Full && dictionary(relative))
				text = trimDictionary(text, job.Code + '\n' + job.Uses);

			if (item.Style) styles.push({Name: root + '/' + relative, Text: Minify.CSS(text)});
			else resources.push('Elemenx.Resource(' + JSON.stringify(root + '/' + relative) + ', ' + JSON.stringify(/\.json$/i.test(relative) ? Minify.JSON(text) : /\.txt$/i.test(relative) ? text : Minify.HTML(text)) + ');');
		});
	});

	return {Styles: styles, Resources: resources};
}

/* The public files of the project next to a build in one file: not its sources, its entry, its page or its config. */
function copyBuildPublic (job) {
	removeTree(job.Output);

	fs.mkdirSync(job.Output, {recursive: true});

	copyPublic(job.Project, job.Output, applicationDirectories(job.Project, job.Roots).concat(privatePaths(job.Project), [
		job.Output,
		job.Entry,
		job.Index,
		path.join(job.Project, 'elemenx.config.js'),
		path.join(job.Project, 'package.json'),
		path.join(job.Project, 'package-lock.json'),
		path.join(job.Project, 'index.production.html')
	]));
}

/*
 * A build of the whole Application into one index.html: the framework, the code of the Application, its templates and
 * styles and the Libraries it uses (their stylesheets, and their other files through Elemenx.Resource), inline and
 * minified. Images and the other public files of the project are copied next to it.
 */
function single (job) {
	var page = fs.readFileSync(job.Index, 'utf8').replace(/^\uFEFF/, '');
	var assets = libraryAssets(job, page);
	var styles = assets.Styles.map(function (style) {
		return style.Text;
	});
	var framework = scriptText(Minify.JavaScript(job.FrameworkSource));
	var code = scriptText(Minify.JavaScript(assets.Resources.join('\n') + '\n' + job.Code));
	var replaced = {Framework: false, Entry: false};

	warnViewport(page, path.basename(job.Index));

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

	copyBuildPublic(job);

	page = Splash.Inject(page, job.Splash);

	fs.writeFileSync(path.join(job.Output, 'index.html'), page);

	process.stdout.write('Elemenx Builder: ' + path.join(job.Output, 'index.html') + ' (' + Math.round(Buffer.byteLength(page) / 1024) + ' KB)\n');

	return job.Output;
}

/*
 * A build of the Application as a widget for a page of another site: one widget.js with the framework, the Libraries
 * and the Application, isolated. The window gets no Elemenx (the page may have its own, of any version), the
 * Application renders in a shadow root (its styles and the ones of the page stay apart), the stylesheets reach it
 * through Elemenx.Style and the other files of the Libraries through Elemenx.Resource. The index.html of the project
 * becomes a page that loads widget.js in place of elemenx.js and the entry; the public files are copied next to it.
 */
function widget (job) {
	var page = fs.readFileSync(job.Index, 'utf8').replace(/^\uFEFF/, '');
	var assets = libraryAssets(job, page);
	var styles = assets.Styles.map(function (style) {
		return 'Elemenx.Style(' + JSON.stringify('library:' + style.Name) + ', ' + JSON.stringify(style.Text) + ');';
	});
	var framework = Minify.JavaScript(job.FrameworkSource);
	var code = Minify.JavaScript(styles.concat(assets.Resources).join('\n') + '\n' + job.Code);
	var version = (/\n\tvar Version = '([^']*)';/.exec(job.FrameworkSource) || [])[1] || '';
	var text = '/*! ' + path.basename(job.Project) + ' | Elemenx ' + version + ', isolated */\n(function () {\nvar ElemenxIsolated = {};\n' + framework + '(function (Elemenx) {\n' + code + '})(ElemenxIsolated.Elemenx);\n})();\n';
	var placed = false;

	page = page.replace(/<script\b[^>]*\bsrc\s*=\s*(["'])([^"']*)\1[^>]*>\s*<\/script>\s*/gi, function (tag, quote, src) {
		var name = src.replace(/[?#].*$/, '').split('/').pop();
		if (name !== 'elemenx.js' && name !== 'elemenx.min.js' && name !== path.basename(job.Entry)) return tag;
		if (placed) return '';

		placed = true;

		return '<script src="widget.js"></script>\n';
	});

	copyBuildPublic(job);

	fs.writeFileSync(path.join(job.Output, 'widget.js'), text);
	fs.writeFileSync(path.join(job.Output, 'index.html'), page);

	process.stdout.write('Elemenx Builder: ' + path.join(job.Output, 'widget.js') + ' (' + Math.round(Buffer.byteLength(text) / 1024) + ' KB)\n');

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
	StripMeta: stripMeta,
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