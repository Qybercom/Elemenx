/*
 * What an editor knows of Elemenx: the Components, Services and Directives of the Libraries (the meta.json of
 * ElemenxUI: `elemenx meta`) and of the project (its Elemenx.Component and Elemenx.Service calls), and what it does
 * with them in the templates (.html) and the code (.js): completion, hover, the definition, diagnostics.
 * ES5 and no dependency: the extension of VS Code takes it in its own host, the language server (LSP, for IntelliJ
 * and the other editors) over stdio.
 *
 * Create({Roots: [directories], Meta: file}) returns the knowledge of a project: Refresh(), Update(file, text),
 * Forget(file), Component(name), Components(), Services(), Directives(). Then, of a text and an offset in it (UTF-16,
 * as LSP counts), its language 'html' or 'js' and its file:
 * - Complete(knowledge, text, offset, language, file): [{Label, Kind, Detail, Documentation, Insert, Snippet, Start, End, Sort}]
 *   (Start and End: the offsets the item replaces; Kind: component, prop, event, directive, value, service, field, method;
 *   Sort: the order of the list, the props of a Component before its bindings, events and the directives);
 * - Hover(knowledge, text, offset, language, file): {Markdown, Start, End} or null;
 * - Definition(knowledge, text, offset, language, file): {File, Line, Character} or null (from 0);
 * - Diagnose(knowledge, text, language, file): [{Start, End, Severity (error, warning, information), Message}].
 * Position(text, offset) and Offset(text, position) turn offsets into {line, character} and back.
 */
var fs = require('fs');
var path = require('path');

var Skipped = {'node_modules': true, 'dist': true, 'docs-site': true, '.git': true, 'build': true, '.gradle': true, '.idea': true, '.vscode': true, 'coverage': true, 'test-results': true, 'playwright-report': true, '.vitest': true, 'android': true, 'ios': true};

/*
 * A build, not a source: a minified file, or one with the banner of a build of Elemenx (/*! Elemenx 0.10.1, /*! ElemenxUI):
 * its copies of the Components and directives of the Libraries are no definitions (regression: *tip went into a bundle).
 */
function built (file, source) {
	return /\.min\.m?js$/.test(file) || /^\/\*! Elemenx(UI)? \d/.test(source);
}

/* The directives of the core, beside the ones of the Libraries. */
var CoreDirectives = [
	{Name: 'if', Description: 'Renders the element while its expression is true.'},
	{Name: 'for', Description: 'Renders the element for each item: `*for="item of Items"` (`$index` the place of the item).'},
	{Name: 'key', Description: 'The key of an item of `*for`: an item keeps its element as the list changes.'},
	{Name: 'lazy', Description: 'Renders its host when it comes near the viewport or the browser is idle (`*lazy="320"`: the height it holds meanwhile).'},
	{Name: 'keep', Description: 'Keeps its host asleep out of the page while it is hidden, with its state (Elemenx.Cache).'}
];

/* The attributes any element takes: no diagnostic for them on a Component. */
var Globals = ['id', 'class', 'style', 'slot', 'title', 'hidden', 'role', 'tabindex', 'lang', 'dir', 'name', 'part', 'is', 'draggable', 'spellcheck', 'translate', 'inert', 'autofocus', 'contenteditable', 'ref', '#'];

/* The order of the kinds in a list of completion. */
var Order = {component: '0', prop: '1', value: '1', field: '1', service: '1', method: '2', event: '3', directive: '4'};

/* The events a plain element is told of most. */
var DomEvents = ['click', 'dblclick', 'input', 'change', 'submit', 'keydown', 'keyup', 'focus', 'blur', 'pointerdown', 'pointermove', 'pointerup', 'mouseenter', 'mouseleave', 'wheel', 'scroll', 'contextmenu', 'dragstart', 'dragover', 'drop'];

function lower (value) {
	return String(value || '').toLowerCase();
}

/* A name as the templates match it: no case, no dashes (page-size is PageSize). */
function plain (value) {
	return lower(value).replace(/-/g, '');
}

function read (file) {
	try {
		return fs.readFileSync(file, 'utf8');
	}
	catch (error) {
		return null;
	}
}

function exists (file) {
	try {
		return fs.statSync(file).isFile();
	}
	catch (error) {
		return false;
	}
}

/* The line (from 0) of an offset of a text. */
function lineOf (text, offset) {
	var count = 0;
	var at = text.indexOf('\n');

	while (at !== -1 && at < offset) {
		count++;
		at = text.indexOf('\n', at + 1);
	}

	return count;
}

function Position (text, offset) {
	var before = text.substring(0, Math.max(0, Math.min(offset, text.length)));
	var line = before.split('\n');

	return {line: line.length - 1, character: line[line.length - 1].length};
}

function Offset (text, position) {
	var lines = text.split('\n');
	var offset = 0;
	var i;

	for (i = 0; i < Math.min(position.line, lines.length); i++) {
		offset += lines[i].length + 1;
	}

	return Math.min(text.length, offset + Math.min(position.character, (lines[position.line] || '').length));
}

/* The end of the object literal that opens at offset (its '{'): strings, comments and regular expressions of a definition skipped well enough. */
function closing (source, offset) {
	var depth = 0;
	var i = offset;
	var character;
	var quote;

	while (i < source.length) {
		character = source.charAt(i);

		if (character === '\'' || character === '"' || character === '`') {
			quote = character;
			i++;

			while (i < source.length && source.charAt(i) !== quote) {
				if (source.charAt(i) === '\\')
					i++;

				i++;
			}
		}
		else if (character === '/' && source.charAt(i + 1) === '/') {
			i = source.indexOf('\n', i);

			if (i === -1)
				return source.length;
		}
		else if (character === '/' && source.charAt(i + 1) === '*') {
			i = source.indexOf('*/', i + 2);

			if (i === -1)
				return source.length;

			i++;
		}
		else if (character === '{') {
			depth++;
		}
		else if (character === '}') {
			depth--;

			if (!depth) return i;
		}

		i++;
	}

	return source.length;
}

/* The keys of the first level of an object literal, from its '{' to its '}': {Name, Offset, Function}. */
function keys (source, start, end) {
	var result = [];
	var depth = 0;
	var i = start;
	var character;
	var quote;
	var match;
	var pattern = /^\s*([A-Za-z_$][\w$]*)\s*:\s*/;

	while (i < end) {
		character = source.charAt(i);

		if (character === '\'' || character === '"' || character === '`') {
			quote = character;
			i++;

			while (i < end && source.charAt(i) !== quote) {
				if (source.charAt(i) === '\\')
					i++;

				i++;
			}
		}
		else if (character === '/' && source.charAt(i + 1) === '/') {
			i = source.indexOf('\n', i);

			if (i === -1) break;

			continue;
		}
		else if (character === '/' && source.charAt(i + 1) === '*') {
			i = source.indexOf('*/', i + 2) + 1;

			if (i === 0) break;
		}
		else if (character === '{' || character === '[' || character === '(') {
			depth++;

			if (depth === 1 && character === '{') {
				match = pattern.exec(source.substring(i + 1, Math.min(end, i + 200)));

				if (match)
					result.push({Name: match[1], Offset: i + 1 + match[0].indexOf(match[1]), Function: /^function\b/.test(source.substring(i + 1 + match[0].length, i + 1 + match[0].length + 10))});
			}
		}
		else if (character === '}' || character === ']' || character === ')') {
			depth--;
		}
		else if (character === ',' && depth === 1) {
			match = pattern.exec(source.substring(i + 1, Math.min(end, i + 200)));

			if (match)
				result.push({Name: match[1], Offset: i + 1 + match[0].indexOf(match[1]), Function: /^function\b/.test(source.substring(i + 1 + match[0].length, i + 1 + match[0].length + 10))});
		}

		i++;
	}

	return result;
}

/* The comment right before an offset: the description of a definition when it has no $Meta. */
function commentBefore (source, offset) {
	var before = source.substring(Math.max(0, offset - 4000), offset).replace(/\s+$/, '');
	var match = /\/\*([\s\S]*?)\*\/$/.exec(before);
	if (!match) return '';

	return match[1].replace(/^\s*\*\s?/gm, '').replace(/\s+/g, ' ').trim();
}

/* The Components and Services a source defines: their names, places, props, events and methods. */
/* The events a source tells: every text of the first argument of an $Emit (a ? 'minimize' : 'restore' tells both). */
function emitted (source) {
	var result = [];
	var pattern = /\$Emit\(([^,)]*)/g;
	var match;

	while ((match = pattern.exec(source))) {
		(match[1].match(/'[\w:-]+'|"[\w:-]+"/g) || []).forEach(function (name) {
			if (result.indexOf(name.slice(1, -1)) === -1)
				result.push(name.slice(1, -1));
		});
	}

	return result;
}

function definitions (source, file) {
	var result = {Components: [], Services: [], Directives: [], Emitted: emitted(source)};
	var directive = /Elemenx\.Directive\(\s*(['"])([\w-]+)\1/g;
	var named;
	var pattern = /Elemenx\.(Component|Service)\(\s*(['"])([A-Za-z][\w-]*)\2\s*,\s*\{/g;
	var match;

	while ((match = pattern.exec(source))) {
		var open = match.index + match[0].length - 1;
		var end = closing(source, open);
		var body = source.substring(open, end);
		var found = keys(source, open, end);
		var description = /\$Meta\s*:\s*\{[\s\S]*?Description\s*:\s*(['"])((?:[^\\]|\\.)*?)\1/.exec(body);
		var events = emitted(body);
		var template = /\$TemplateID\s*:\s*(['"])([^'"]+)\1/.exec(body);
		var closures = /this\.([A-Z][\w$]*)\s*=\s*function\s*\(([^)]*)\)/g;
		var closure;
		var methods = [];
		var props = [];

		found.forEach(function (key) {
			if (key.Function || key.Name.charAt(0) === '$') {
				if (key.Name.charAt(0) !== '$')
					methods.push({Name: key.Name, Line: lineOf(source, key.Offset), Character: key.Offset - source.lastIndexOf('\n', key.Offset) - 1});
			}
			else if (/^[A-Z]/.test(key.Name)) {
				props.push({Name: key.Name, Type: '', Options: null, Description: '', Line: lineOf(source, key.Offset)});
			}
		});

		/* The functions of $OnCreate that a template calls (this.Name = function). */
		while ((closure = closures.exec(body))) {
			if (!methods.some(function (method) {
				return method.Name === closure[1];
			}))
				methods.push({Name: closure[1], Line: lineOf(source, open + closure.index), Character: 0, Arguments: closure[2]});
		}

		(match[1] === 'Component' ? result.Components : result.Services).push({
			Name: match[3],
			Description: description ? description[2].replace(/\\(.)/g, '$1') : commentBefore(source, match.index),
			Props: props,
			Events: events,
			Methods: methods,
			Slots: [],
			File: file,
			Line: lineOf(source, match.index),
			Library: false,
			/* The <template id> of a page it takes ($TemplateID: 'x'), or null. */
			TemplateID: template ? template[2] : null
		});

		pattern.lastIndex = end;
	}

	while ((named = directive.exec(source))) {
		result.Directives.push({Name: named[2], Description: commentBefore(source, named.index), File: file, Line: lineOf(source, named.index)});
	}

	return result;
}

/* The meta.json of the Libraries a project uses: of its own (a Library of it), of the package of Elemenx, or the one given. */
/* The file of a folder of that name, whatever its case (Mount.js for the directive mount), or null. */
function fileOf (folder, name) {
	var names;

	try {
		names = fs.readdirSync(folder);
	}
	catch (error) {
		return null;
	}

	return names.filter(function (each) {
		return lower(each) === lower(name);
	}).map(function (each) {
		return path.join(folder, each);
	})[0] || null;
}

/* elemenx.js of a project: at its root (the repository of Elemenx), in its package, or the copy of the extension; null without one. */
function frameworkFile (roots) {
	var found = null;

	roots.forEach(function (root) {
		[path.join(root, 'elemenx.js'), path.join(root, 'node_modules', '@qybercom', 'elemenx', 'elemenx.js')].forEach(function (file) {
			if (!found && exists(file))
				found = file;
		});
	});

	/* The copy the extension carries, for a project with a build of dist alone. */
	if (!found && exists(path.join(__dirname, 'elemenx.js')))
		found = path.join(__dirname, 'elemenx.js');

	return found;
}

function metaFiles (roots, given) {
	var found = [];

	function add (file) {
		if (file && exists(file) && found.indexOf(path.resolve(file)) === -1)
			found.push(path.resolve(file));
	}

	add(given);

	roots.forEach(function (root) {
		['libraries', path.join('node_modules', '@qybercom', 'elemenx', 'libraries')].forEach(function (folder) {
			var directory = path.join(root, folder);
			var names;

			try {
				names = fs.readdirSync(directory);
			}
			catch (error) {
				return;
			}

			names.forEach(function (name) {
				add(path.join(directory, name, 'data', 'meta.json'));
			});
		});
	});

	/* The copy the extension carries, the Library of its version with its sources (a project with the builds of dist alone has none). */
	if (!found.length)
		add(path.join(__dirname, 'library', 'data', 'meta.json'));

	if (!found.length)
		add(path.join(__dirname, 'meta.json'));

	return found;
}

function Create (options) {
	var settings = options || {};
	var roots = (settings.Roots || []).filter(Boolean).map(function (root) {
		return path.resolve(root);
	});
	var library = {Components: {}, Services: {}, Directives: {}};
	var project = {};
	/* The files of the phrases of $T: the locales/*.json of the project and of the Libraries. */
	var locales = {};
	var knowledge;

	function loadMeta () {
		library = {Components: {}, Services: {}, Directives: {}};

		metaFiles(roots, settings.Meta).forEach(function (file) {
			var data;
			var base = path.dirname(path.dirname(file));

			addLocales(path.join(base, 'locales'));

			try {
				data = JSON.parse(read(file) || '{}');
			}
			catch (error) {
				return;
			}

			(data.Components || []).forEach(function (component) {
				var source = path.join(base, 'components', component.Name, component.Name + '.js');

				library.Components[lower(component.Name)] = {
					Name: component.Name,
					Description: component.Description || '',
					Group: component.Group || '',
					Props: (component.Props || []).map(function (prop) {
						return {Name: prop.Name, Type: prop.Type || '', Options: prop.Options || null, Default: prop.Default, Description: prop.Description || ''};
					}),
					Events: component.Events || [],
					EventDescriptions: component.EventDescriptions || {},
					Slots: component.Slots || [],
					Methods: (component.Methods || []).map(function (method) {
						return {Name: String(method).replace(/\(.*$/, ''), Signature: method};
					}),
					File: exists(source) ? source : null,
					Line: 0,
					Library: true
				};
			});

			(data.Services || []).forEach(function (service) {
				var source = path.join(base, 'services', service.Name + '.js');

				library.Services[lower(service.Name)] = {Name: service.Name, Description: service.Description || '', Methods: (service.Methods || []).map(function (method) {
					return {Name: String(method).replace(/\(.*$/, ''), Signature: method};
				}), File: exists(source) ? source : null, Line: 0, Library: true};
			});

			(data.Directives || []).forEach(function (directive) {
				library.Directives[lower(directive.Name)] = {Name: directive.Name, Description: directive.Description || '', File: fileOf(path.join(base, 'directives'), directive.Name + '.js')};
			});
		});
	}

	function addLocales (folder) {
		var entries;

		try {
			entries = fs.readdirSync(folder);
		}
		catch (error) {
			return;
		}

		entries.forEach(function (name) {
			if (/\.json$/.test(name))
				locales[path.join(folder, name)] = true;
		});
	}

	function scanFile (file, text) {
		var source = text === undefined ? read(file) : text;

		if (source === null || source.length > 4000000 || source.indexOf('Elemenx.') === -1 || built(file, source)) {
			delete project[file];

			return;
		}

		project[file] = definitions(source, file);
	}

	function walk (directory, count) {
		var entries;

		try {
			entries = fs.readdirSync(directory, {withFileTypes: true});
		}
		catch (error) {
			return count;
		}

		entries.forEach(function (entry) {
			var file = path.join(directory, entry.name);

			if (count > 20000) return;

			if (entry.isDirectory()) {
				if (entry.name === 'locales')
					addLocales(file);

				if (!Skipped[entry.name])
					count = walk(file, count + 1);
			}
			/* A page defines Components in its scripts too: the ones of its <template id>. */
			else if (/\.(js|mjs|html?)$/.test(entry.name)) {
				count++;

				scanFile(file);
			}
		});

		return count;
	}

	/* The ones of the project over the ones of the Libraries, a Library of the project read from its own files. */
	function merged (kind) {
		var result = {};
		var key;

		for (key in library[kind]) {
			result[key] = library[kind][key];
		}

		Object.keys(project).forEach(function (file) {
			project[file][kind].forEach(function (item) {
				var known = result[lower(item.Name)];

				if (known && known.Library) {
					result[lower(item.Name)] = {
						Name: known.Name,
						Description: known.Description || item.Description,
						Group: known.Group,
						Props: (known.Props || []).concat((item.Props || []).filter(function (each) {
							return !prop(known, each.Name);
						})),
						Events: (known.Events || []).concat((item.Events || []).filter(function (each) {
							return (known.Events || []).indexOf(each) === -1;
						})),
						EventDescriptions: known.EventDescriptions || {},
						Slots: known.Slots,
						Methods: item.Methods,
						File: item.File,
						Line: item.Line,
						Library: true
					};
				}
				else {
					result[lower(item.Name)] = item;
				}
			});
		});

		return result;
	}

	knowledge = {
		Roots: roots,
		Refresh: function () {
			project = {};
			locales = {};

			loadMeta();

			roots.forEach(function (root) {
				walk(root, 0);
			});

			this.Cache = null;
		},
		Update: function (file, text) {
			if (/meta\.json$/.test(file)) loadMeta();
			else scanFile(path.resolve(file), text);

			this.Cache = null;
		},
		Forget: function (file) {
			delete project[path.resolve(file)];

			this.Cache = null;
		},
		All: function () {
			if (!this.Cache)
				this.Cache = {Components: merged('Components'), Services: merged('Services')};

			return this.Cache;
		},
		Component: function (name) {
			return this.All().Components[lower(name)] || null;
		},
		Service: function (name) {
			return this.All().Services[lower(name)] || null;
		},
		Components: function () {
			var all = this.All().Components;

			return Object.keys(all).map(function (key) {
				return all[key];
			});
		},
		Services: function () {
			var all = this.All().Services;

			return Object.keys(all).map(function (key) {
				return all[key];
			});
		},
		Directives: function () {
			var result = CoreDirectives.slice();
			var key;

			/* The directives of a Library with their file first: a copy of one in a bundle of the project (a build) is no definition. */
			for (key in library.Directives) {
				if (library.Directives[key].File && !result.some(function (directive) {
					return lower(directive.Name) === key;
				}))
					result.push(library.Directives[key]);
			}

			Object.keys(project).forEach(function (file) {
				project[file].Directives.forEach(function (each) {
					if (!result.some(function (known) {
						return lower(known.Name) === lower(each.Name);
					}))
						result.push(each);
				});
			});

			for (key in library.Directives) {
				if (!result.some(function (directive) {
					return lower(directive.Name) === key;
				}))
					result.push(library.Directives[key]);
			}

			return result;
		},
		Emitted: function () {
			var result = {};

			Object.keys(project).forEach(function (file) {
				project[file].Emitted.forEach(function (name) {
					result[plain(name)] = true;
				});
			});

			return result;
		},
		/* The files of the phrases of $T, those of English first (the language the keys are written in). */
		Locales: function () {
			return Object.keys(locales).sort(function (a, b) {
				return (/[\\/]en\.json$/.test(b) ? 1 : 0) - (/[\\/]en\.json$/.test(a) ? 1 : 0) || (a < b ? -1 : a > b ? 1 : 0);
			});
		},
		/* elemenx.js, where the core directives are (*if, *for...). */
		Framework: function () {
			return frameworkFile(roots);
		},
		Empty: function () {
			return !Object.keys(library.Components).length && !Object.keys(project).length;
		}
	};

	knowledge.Refresh();

	return knowledge;
}

/*
 * The HTML of a template read up to limit: its tags with their attributes, and where limit falls: {Kind: text,
 * tag-name, attribute-name, attribute-value, expression or tag, Tag, Attribute, Prefix, PrefixStart}.
 */
function scan (text, limit) {
	var tags = [];
	var at = {Kind: 'text', Tag: null, Attribute: null, Prefix: '', PrefixStart: limit};
	var i = 0;
	var tag;
	var start;
	var name;
	var attribute;
	var quote;
	var raw;
	var end;

	function mark (kind, from, attributeOf) {
		at = {Kind: kind, Tag: tag || null, Attribute: attributeOf || null, Prefix: text.substring(from, limit), PrefixStart: from};
	}

	while (i < text.length) {
		if (text.substr(i, 4) === '<!--') {
			end = text.indexOf('-->', i + 4);
			end = end === -1 ? text.length : end + 3;

			if (limit > i && limit < end)
				at = {Kind: 'comment', Tag: null, Attribute: null, Prefix: '', PrefixStart: limit};

			i = end;

			continue;
		}

		if (text.substr(i, 2) === '{{') {
			/* An expression not closed yet (one being typed) runs to the end. */
			end = text.indexOf('}}', i + 2);
			end = end === -1 ? text.length + 2 : end + 2;

			if (limit >= i + 2 && limit <= end - 2)
				at = {Kind: 'expression', Tag: null, Attribute: null, Prefix: (/[\w$.]*$/.exec(text.substring(i + 2, limit)) || [''])[0], PrefixStart: limit - (/[\w$.]*$/.exec(text.substring(i + 2, limit)) || [''])[0].length, Expression: true};

			i = Math.min(end, text.length);

			continue;
		}

		if (text.charAt(i) === '<' && text.charAt(i + 1) === '/') {
			end = text.indexOf('>', i);
			i = end === -1 ? text.length : end + 1;

			continue;
		}

		if (text.charAt(i) === '<' && /[A-Za-z]/.test(text.charAt(i + 1) || '')) {
			start = i + 1;
			i = start;

			while (i < text.length && /[\w:.-]/.test(text.charAt(i))) {
				i++;
			}

			tag = {Name: text.substring(start, i), Start: start, End: i, Open: start - 1, Attributes: [], Close: text.length};

			tags.push(tag);

			if (limit >= start && limit <= i)
				mark('tag-name', start);

			/* Its attributes, to its end (a tag not finished yet ends at the next one). */
			while (i < text.length && text.charAt(i) !== '>' && text.charAt(i) !== '<') {
				if (/\s/.test(text.charAt(i)) || text.charAt(i) === '/') {
					if (limit === i + 1 && /\s/.test(text.charAt(i)))
						mark('attribute-name', i + 1);

					i++;

					continue;
				}

				start = i;

				while (i < text.length && !/[\s=><]/.test(text.charAt(i)) && !(text.charAt(i) === '/' && text.charAt(i + 1) === '>')) {
					i++;
				}

				name = text.substring(start, i);
				attribute = {Name: name, Start: start, End: i, ValueStart: -1, ValueEnd: -1, Value: null};

				tag.Attributes.push(attribute);

				if (limit >= start && limit <= i)
					mark('attribute-name', start, attribute);

				while (i < text.length && /\s/.test(text.charAt(i))) {
					i++;
				}

				if (text.charAt(i) !== '=') continue;

				i++;

				while (i < text.length && /\s/.test(text.charAt(i))) {
					i++;
				}

				quote = text.charAt(i);

				if (quote === '"' || quote === '\'') {
					end = text.indexOf(quote, i + 1);
					end = end === -1 ? text.length : end;
					attribute.ValueStart = i + 1;
					attribute.ValueEnd = end;
					i = end + 1;
				}
				else {
					start = i;

					while (i < text.length && !/[\s>]/.test(text.charAt(i))) {
						i++;
					}

					attribute.ValueStart = start;
					attribute.ValueEnd = i;
				}

				attribute.Value = text.substring(attribute.ValueStart, attribute.ValueEnd);

				if (limit >= attribute.ValueStart && limit <= attribute.ValueEnd)
					mark('attribute-value', limit - (/[\w$.-]*$/.exec(text.substring(attribute.ValueStart, limit)) || [''])[0].length, attribute);
			}

			tag.Close = i;

			if (limit > tag.End && limit <= i && at.Tag !== tag)
				mark('tag', limit);

			if (text.charAt(i) === '>')
				i++;

			/* The text of a script or a style is not HTML. */
			raw = lower(tag.Name);

			if (raw === 'script' || raw === 'style') {
				end = lower(text).indexOf('</' + raw, i);
				i = end === -1 ? text.length : end;
			}

			tag = null;

			continue;
		}

		i++;
	}

	if (at.Kind === 'tag' && !at.Tag)
		at.Kind = 'text';

	return {Tags: tags, At: at};
}

/* What an attribute binds: {Kind: prop, bind, event, directive, attribute, class or style, Name}. */
function binding (name) {
	var match;
	if ((match = /^\[(attribute|attr|class|style)\.([^\]]*)\]?$/.exec(name)))
		return {Kind: match[1] === 'attr' ? 'attribute' : match[1], Name: match[2]};

	if ((match = /^\[([^\]]*)\]?$/.exec(name))) return {Kind: 'bind', Name: match[1]};
	if ((match = /^\(([^)]*)\)?$/.exec(name))) return {Kind: 'event', Name: match[1]};

	if ((match = /^\*(.*)$/.exec(name)))
		return {Kind: 'directive', Name: match[1]};

	return {Kind: 'prop', Name: name};
}

function prop (component, name) {
	return (component && component.Props || []).filter(function (each) {
		return plain(each.Name) === plain(name);
	})[0] || null;
}

/*
 * The Component a template belongs to: in a <template id="x"> of a page (text, at offset), the one of that page or of
 * its folder with $TemplateID: 'x'; else the one defined next to it with its name (Name.html beside Name.js).
 */
function owner (knowledge, file, text, offset) {
	var name;
	var component;
	var id;
	var folder;

	if (!file)
		return null;

	id = text === undefined ? null : templateAt(text, offset);

	if (id) {
		folder = path.dirname(path.resolve(file));

		return knowledge.Components().filter(function (each) {
			return each.TemplateID === id && each.File && path.dirname(each.File) === folder;
		}).sort(function (a, b) {
			return (b.File === path.resolve(file)) - (a.File === path.resolve(file));
		})[0] || null;
	}

	name = path.basename(file).replace(/\.[^.]+$/, '');
	component = knowledge.Component(name);

	return component && component.File && path.dirname(component.File) === path.dirname(path.resolve(file)) ? component : null;
}

/* The id of the <template id> of a page around an offset, or null. */
function templateAt (text, offset) {
	var pattern = /<template\b([^>]*)>|<\/template\s*>/gi;
	var open = [];
	var match;
	var id;

	while ((match = pattern.exec(text)) && match.index < offset) {
		id = match[1] === undefined ? undefined : /\sid\s*=\s*(['"])([^'"]+)\1/.exec(match[1]);

		if (id === undefined) open.pop();
		else open.push(id ? id[2] : null);
	}

	/* The nearest template with an id: a <template slot> inside one is part of it. */
	return open.filter(function (each) {
		return each;
	}).pop() || null;
}

function describe (component) {
	var lines = ['**' + component.Name + '**' + (component.Library ? ' · Elemenx' : ''), ''];

	if (component.Description)
		lines.push(component.Description, '');

	if (component.Props.length) {
		lines.push('Props: ' + component.Props.map(function (each) {
			return '`' + each.Name + '`';
		}).join(', '));
	}

	if (component.Events.length) {
		lines.push('', 'Events: ' + component.Events.map(function (each) {
			return '`' + each + '`';
		}).join(', '));

		component.Events.forEach(function (each) {
			if (eventDescription(component, each))
				lines.push('- `' + each + '`: ' + eventDescription(component, each));
		});
	}

	if (component.Slots && component.Slots.length) {
		lines.push('', 'Slots: ' + component.Slots.map(function (each) {
			return '`' + each + '`';
		}).join(', '));
	}

	return lines.join('\n');
}

/* The description of an event of a component ($Meta.Events as {name: description}), or ''. */
function eventDescription (component, name) {
	var descriptions = component.EventDescriptions || {};
	var key;

	for (key in descriptions) {
		if (Object.prototype.hasOwnProperty.call(descriptions, key) && lower(key) === lower(name)) return descriptions[key];
	}

	return '';
}

function describeProp (component, item) {
	var lines = ['**' + component.Name + '.' + item.Name + '**' + (item.Type ? ' `' + item.Type + '`' : '')];

	if (item.Description)
		lines.push('', item.Description);

	if (item.Options && item.Options.length)
		lines.push('', 'One of: ' + item.Options.filter(Boolean).map(function (option) {
			return '`' + option + '`';
		}).join(', '));

	if (item.Default !== undefined && item.Default !== null && item.Default !== '')
		lines.push('', 'Default: `' + JSON.stringify(item.Default) + '`');

	return lines.join('\n');
}

function starts (value, prefix) {
	return lower(value).indexOf(lower(prefix)) === 0;
}

/* The service named in the code at an offset: $Service('Name') or Elemenx.Service('Name'). */
function serviceAt (text, offset) {
	var pattern = /(\$Service|Elemenx\.Service)\(\s*(['"])([\w]*)/g;
	var match;

	while ((match = pattern.exec(text))) {
		var start = match.index + match[0].length - match[3].length;
		if (offset >= start && offset <= start + match[3].length)
			return {Name: match[3], Start: start, End: start + match[3].length};

		if (match.index > offset) break;
	}

	return null;
}

function candidates (knowledge, text, offset, language, file) {
	var items = [];
	var found;
	var at;
	var component;
	var own;
	var kind;
	var push;
	var bound;

	if (language === 'js') {
		/* $Ref('...'): the references (#Name) of the template of the Component of the file. */
		found = /\$Refs?\(\s*['"]([\w$-]*)$/.exec(text.substring(Math.max(0, offset - 200), offset));

		if (found) {
			own = templateOf(file, text);

			(own ? refs(own.Text) : []).forEach(function (each) {
				if (starts(each.Name, found[1]) && !items.some(function (item) {
					return item.Label === each.Name;
				}))
					items.push({Label: each.Name, Kind: 'field', Detail: '#' + each.Name + ' · ' + path.basename(own.File), Documentation: 'The element of the template with #' + each.Name + '.', Insert: each.Name, Start: offset - found[1].length, End: offset});
			});

			return items;
		}

		found = /(\$Service|Elemenx\.Service)\(\s*['"]([\w]*)$/.exec(text.substring(Math.max(0, offset - 200), offset));

		if (!found)
			return items;

		knowledge.Services().forEach(function (service) {
			if (starts(service.Name, found[2]))
				items.push({Label: service.Name, Kind: 'service', Detail: service.Library ? 'Elemenx Service' : 'Service of the project', Documentation: service.Description, Insert: service.Name, Start: offset - found[2].length, End: offset});
		});

		return items;
	}

	at = scan(text, offset).At;

	if (at.Kind === 'tag-name') {
		knowledge.Components().forEach(function (each) {
			if (starts(each.Name, at.Prefix))
				items.push({Label: each.Name, Kind: 'component', Detail: each.Library ? 'Elemenx Component' + (each.Group ? ' · ' + each.Group : '') : 'Component of the project', Documentation: each.Description, Insert: each.Name, Start: at.PrefixStart, End: offset});
		});

		return items;
	}

	if (at.Kind === 'attribute-name' || at.Kind === 'tag') {
		component = knowledge.Component(at.Tag.Name);
		kind = at.Prefix.charAt(0);
		push = function (label, insert, itemKind, documentation) {
			if (starts(label, at.Prefix))
				items.push({Label: label, Kind: itemKind, Detail: component ? component.Name : '', Documentation: documentation || '', Insert: insert, Snippet: true, Start: at.PrefixStart, End: offset});
		};

		if (component) {
			component.Props.forEach(function (each) {
				if (kind !== '[' && kind !== '(' && kind !== '*')
					push(each.Name, each.Name + '="$1"', 'prop', describeProp(component, each));

				if (kind === '[' || !kind)
					push('[' + each.Name + ']', '[' + each.Name + ']="$1"', 'prop', describeProp(component, each));
			});

			component.Events.forEach(function (each) {
				if (kind === '(' || !kind)
					push('(' + each + ')', '(' + each + ')="$1"', 'event', eventDescription(component, each) || 'The ' + each + ' event of ' + component.Name + '.');
			});
		}
		else if (kind === '(' || !kind) {
			DomEvents.forEach(function (each) {
				push('(' + each + ')', '(' + each + ')="$1"', 'event', 'The ' + each + ' event of the element.');
			});
		}

		if (kind === '[' || !kind) {
			push('[attribute.]', '[attribute.$1]="$2"', 'prop', 'An attribute bound to an expression (null takes it away).');
			push('[class.]', '[class.$1]="$2"', 'prop', 'A class while the expression is true.');
			push('[style.]', '[style.$1]="$2"', 'prop', 'A style property bound to an expression.');
		}

		if (kind === '*' || !kind) {
			knowledge.Directives().forEach(function (each) {
				push('*' + each.Name, '*' + each.Name + '="$1"', 'directive', each.Description);
			});
		}

		return items;
	}

	if (at.Kind === 'attribute-value' || at.Kind === 'expression') {
		bound = at.Attribute ? binding(at.Attribute.Name) : {Kind: 'expression'};

		/* A {{ }} open in the value of an attribute (title="{{Na"): an expression, also in a plain attribute. */
		if (at.Kind === 'attribute-value' && at.Attribute && bound.Kind !== 'event' && /\{\{(?:(?!\}\})[\s\S])*$/.test(text.substring(at.Attribute.ValueStart, offset)))
			bound = {Kind: 'expression'};

		component = at.Tag ? knowledge.Component(at.Tag.Name) : null;

		/* A plain prop with options: its options. */
		if (bound.Kind === 'prop' && component && prop(component, bound.Name) && prop(component, bound.Name).Options) {
			prop(component, bound.Name).Options.forEach(function (option) {
				if (option && starts(option, at.Prefix))
					items.push({Label: String(option), Kind: 'value', Detail: component.Name + '.' + prop(component, bound.Name).Name, Documentation: '', Insert: String(option), Start: at.PrefixStart, End: offset});
			});

			return items;
		}

		/* The text of a plain attribute is no expression. */
		if (bound.Kind === 'prop') return items;

		/* An expression or a handler (a name, or an expression: (click)="Open = !Open"): the fields and the functions of the Component of the template. */
		own = owner(knowledge, file, text, offset);

		if (own) {
			own.Props.forEach(function (each) {
				if (starts(each.Name, at.Prefix))
					items.push({Label: each.Name, Kind: 'field', Detail: own.Name, Documentation: each.Description || '', Insert: each.Name, Start: at.PrefixStart, End: offset});
			});

			own.Methods.forEach(function (each) {
				if (starts(each.Name, at.Prefix))
					items.push({Label: each.Name, Kind: 'method', Detail: own.Name + (each.Arguments !== undefined ? '(' + each.Arguments + ')' : ''), Documentation: '', Insert: each.Name, Start: at.PrefixStart, End: offset});
			});
		}

		if (bound.Kind === 'event') {
			if (starts('$event', at.Prefix))
				items.push({Label: '$event', Kind: 'field', Detail: 'the event', Documentation: 'The DOM event, or what a Component told with its event.', Insert: '$event', Start: at.PrefixStart, End: offset});

			if (starts('$node', at.Prefix))
				items.push({Label: '$node', Kind: 'field', Detail: 'the element', Documentation: 'The element, or the Component, that told the event.', Insert: '$node', Start: at.PrefixStart, End: offset});
		}

		if (bound.Kind !== 'event' && starts('$T', at.Prefix))
			items.push({Label: '$T', Kind: 'method', Detail: '$T(key, params)', Documentation: 'The phrase of a key in the language of the page (Elemenx.Locale).', Insert: '$T', Start: at.PrefixStart, End: offset});
	}

	return items;
}

/* The template of the Component of a file of code: its $TemplateURL beside it, or the .html of its name. {File, Text} or null. */
function templateOf (file, source) {
	var url = /\$TemplateURL\s*:\s*(['"])([^'"]+)\1/.exec(source || '');
	var candidate;
	var text;

	if (!file)
		return null;

	candidate = url ? path.resolve(path.dirname(file), url[2]) : file.replace(/\.js$/, '.html');
	text = read(candidate);

	return text === null ? null : {File: candidate, Text: text};
}

/* The references of a template: #Name on its elements, [{Name, Start, End}] (the attribute, with its #). */
function refs (text) {
	var found = [];

	scan(text, -1).Tags.forEach(function (tag) {
		tag.Attributes.forEach(function (attribute) {
			if (attribute.Name.charAt(0) === '#' && attribute.Name.length > 1)
				found.push({Name: attribute.Name.substring(1), Start: attribute.Start, End: attribute.End});
		});
	});

	return found;
}

/* The $Ref('Name') of the code under offset: {Name, Start, End} of the name, or null. */
function refAt (text, offset) {
	var pattern = /\$Refs?\(\s*(['"])([\w$-]*)\1/g;
	var match;
	var start;

	while ((match = pattern.exec(text))) {
		start = match.index + match[0].length - 1 - match[2].length;

		if (offset >= start && offset <= start + match[2].length)
			return {Name: match[2], Start: start, End: start + match[2].length};
	}

	return null;
}

/* The key of the $T('key') under offset (in a template or in code): {Key, Start, End}, or null. */
function phraseAt (text, offset) {
	var pattern = /\$T\(\s*(['"])([^'"\n]*)\1/g;
	var match;
	var start;

	while ((match = pattern.exec(text))) {
		start = match.index + match[0].length - 1 - match[2].length;

		if (offset >= start && offset <= start + match[2].length)
			return {Key: match[2], Start: start, End: start + match[2].length};
	}

	return null;
}

/*
 * Where a key of phrases (ui.call.leave) is in the text of a JSON of a locale: the offset of the name of its last
 * part, nested ({"ui": {"call": {"leave": ...}}}) or written whole ({"ui.call.leave": ...}); -1 when it is not there.
 */
function phraseOffset (source, key) {
	var trail = [];
	var pending = null;
	var i = 0;
	var c;
	var end;
	var name;

	while (i < source.length) {
		c = source.charAt(i);

		if (c === '"') {
			end = i + 1;

			while (end < source.length && source.charAt(end) !== '"')
				end += source.charAt(end) === '\\' ? 2 : 1;

			name = source.substring(i + 1, end);

			/* A name is a key when a colon follows it. */
			if (/^\s*:/.test(source.substring(end + 1, end + 40))) {
				if (trail.filter(Boolean).concat([name]).join('.') === key) return i + 1;

				pending = name;
			}

			i = end + 1;

			continue;
		}

		if (c === '{') {
			trail.push(pending === null ? '' : pending);

			pending = null;
		}
		else if (c === '}') {
			trail.pop();
		}
		else if (c === ',' || c === '[') {
			pending = null;
		}

		i++;
	}

	return -1;
}

/*
 * The phrases of a key in the locales of the project and of its Libraries: [{File, Language, At, Text, Line,
 * Character}] of the folder of locales nearest to the file asking (its Application, its Library), English first.
 */
function phrases (knowledge, key, from) {
	var found = [];
	var best = -1;
	var near = function (file) {
		var a = path.resolve(path.dirname(file)).split(/[\\/]/);
		var b = path.resolve(from || '').split(/[\\/]/);
		var i = 0;

		while (i < a.length && i < b.length && a[i].toLowerCase() === b[i].toLowerCase())
			i++;

		return i;
	};

	knowledge.Locales().forEach(function (file) {
		var text = read(file);
		var at = text === null ? -1 : phraseOffset(text, key);
		var value;

		if (at === -1) return;

		value = /^(?:[^"\\]|\\.)*"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(text.substring(at));

		try {
			value = value ? JSON.parse(value[1]) : null;
		}
		catch (error) {
			value = null;
		}

		found.push({File: file, Language: path.basename(file, '.json'), Near: near(file), At: at, Text: value, Line: Position(text, at).line, Character: Position(text, at).character});

		best = Math.max(best, near(file));
	});

	return found.filter(function (each) {
		return each.Near === best && path.dirname(each.File) === path.dirname(found.filter(function (other) {
			return other.Near === best;
		})[0].File);
	});
}

/* The place of a key of phrases: in the English of the nearest locales, else in another language of them; null when none has it. */
function phrasePlace (knowledge, key, from) {
	var found = phrases(knowledge, key, from)[0];

	return found ? {File: found.File, Line: found.Line, Character: found.Character} : null;
}

/* The place of the first match of pattern in a file: {File, Line, Character} (at the text matched, past a new line), or null. */
function place (file, pattern) {
	var text = read(file);
	var match = text === null ? null : pattern.exec(text);
	var at;

	if (!match)
		return null;

	at = match.index + (match[0].charAt(0) === '\n' ? match[0].search(/[^\s]/) : 0);

	return {File: file, Line: Position(text, at).line, Character: Position(text, at).character};
}

function Complete (knowledge, text, offset, language, file) {
	return candidates(knowledge, text, offset, language, file).map(function (item) {
		item.Sort = Order[item.Kind] + (/^\[(attribute|class|style)\./.test(item.Label) ? '9' : /^\[/.test(item.Label) ? '1' : '0') + item.Label;

		return item;
	});
}

function Hover (knowledge, text, offset, language, file) {
	var at;
	var component;
	var bound;
	var item;
	var service;
	var own;
	var word;

	/* The key of $T('key'): its phrase in each language of the nearest locales. */
	word = phraseAt(text, offset);

	if (word) {
		item = phrases(knowledge, word.Key, file);

		return {Markdown: '`' + word.Key + '`' + (item.length ? '\n\n' + item.map(function (each) {
			return '- **' + each.Language + '**: ' + (each.Text === null ? '_not a text_' : String(each.Text).replace(/([\\`*_[\]])/g, '\\$1'));
		}).join('\n') : '\n\nNo phrase of this key in the locales of the project.'), Start: word.Start, End: word.End};
	}

	if (language === 'js') {
		word = refAt(text, offset);

		if (word) {
			own = templateOf(file, text);
			item = own ? refs(own.Text).filter(function (each) {
				return each.Name === word.Name;
			})[0] : null;

			return item ? {Markdown: '**#' + item.Name + '** · the element of ' + path.basename(own.File) + '\n\n```html\n' + own.Text.split('\n')[lineOf(own.Text, item.Start)].trim() + '\n```', Start: word.Start, End: word.End} : null;
		}

		service = serviceAt(text, offset);
		item = service ? knowledge.Service(service.Name) : null;

		if (!item)
			return null;

		return {Markdown: '**' + item.Name + '**' + (item.Library ? ' · Elemenx Service' : '') + '\n\n' + (item.Description || '') + (item.Methods.length ? '\n\nMethods: ' + item.Methods.map(function (method) {
			return '`' + (method.Signature || method.Name) + '`';
		}).join(', ') : ''), Start: service.Start, End: service.End};
	}

	at = scan(text, offset).At;

	if (at.Kind === 'tag-name' && at.Tag) {
		component = knowledge.Component(at.Tag.Name);

		return component ? {Markdown: describe(component), Start: at.Tag.Start, End: at.Tag.End} : null;
	}

	if (at.Kind === 'attribute-name' && at.Attribute) {
		component = knowledge.Component(at.Tag.Name);
		bound = binding(at.Attribute.Name);

		if (at.Attribute.Name.charAt(0) === '#') {
			own = owner(knowledge, file, text, offset);

			return {Markdown: '**' + at.Attribute.Name + '** · a reference: `this.$Ref(\'' + at.Attribute.Name.substring(1) + '\')`' + (own ? ' in ' + own.Name : '') + ' gives this element', Start: at.Attribute.Start, End: at.Attribute.End};
		}

		if (bound.Kind === 'directive') {
			item = knowledge.Directives().filter(function (each) {
				return lower(each.Name) === lower(bound.Name);
			})[0];

			return item ? {Markdown: '**\\*' + item.Name + '**\n\n' + item.Description, Start: at.Attribute.Start, End: at.Attribute.End} : null;
		}

		if (!component) return null;

		if (bound.Kind === 'event') {
			return component.Events.some(function (each) {
				return lower(each) === lower(bound.Name);
			}) ? {Markdown: '**(' + bound.Name + ')** · an event of ' + component.Name + (eventDescription(component, bound.Name) ? '\n\n' + eventDescription(component, bound.Name) : ''), Start: at.Attribute.Start, End: at.Attribute.End} : null;
		}

		item = prop(component, bound.Name);

		return item ? {Markdown: describeProp(component, item), Start: at.Attribute.Start, End: at.Attribute.End} : null;
	}

	if (at.Kind === 'attribute-value' || at.Kind === 'expression') {
		own = owner(knowledge, file, text, offset);
		word = (/^[\w$]*/.exec(text.substring(offset)) || [''])[0];
		word = (/[\w$]*$/.exec(text.substring(0, offset)) || [''])[0] + word;

		if (!own || !word) return null;

		item = prop(own, word) || own.Methods.filter(function (each) {
			return each.Name === word;
		})[0];

		return item ? {Markdown: '**' + own.Name + '.' + item.Name + '**' + (item.Description ? '\n\n' + item.Description : ''), Start: offset - (/[\w$]*$/.exec(text.substring(0, offset)) || [''])[0].length, End: offset - (/[\w$]*$/.exec(text.substring(0, offset)) || [''])[0].length + word.length} : null;
	}

	return null;
}

function Definition (knowledge, text, offset, language, file) {
	var at;
	var component;
	var service;
	var own;
	var word;
	var item;

	/* The key of $T('key'), in a template or in code: to its phrase in the locales (English first). */
	word = phraseAt(text, offset);

	if (word)
		return phrasePlace(knowledge, word.Key, file);

	if (language === 'js') {
		word = refAt(text, offset);

		/* $Ref('Name'): to #Name in the template. */
		if (word) {
			own = templateOf(file, text);
			item = own ? refs(own.Text).filter(function (each) {
				return each.Name === word.Name;
			})[0] : null;

			return item ? {File: own.File, Line: Position(own.Text, item.Start).line, Character: Position(own.Text, item.Start).character} : null;
		}

		service = serviceAt(text, offset);
		item = service ? knowledge.Service(service.Name) : null;

		return item && item.File ? {File: item.File, Line: item.Line || 0, Character: 0} : null;
	}

	at = scan(text, offset).At;

	/* *directive: to its Elemenx.Directive, or to its Register in elemenx.js (the core ones: *if, *for...). */
	if (at.Kind === 'attribute-name' && at.Attribute && at.Attribute.Name.charAt(0) === '*') {
		item = knowledge.Directives().filter(function (each) {
			return lower(each.Name) === lower(at.Attribute.Name.substring(1).replace(/[.=].*$/, ''));
		})[0];

		if (!item)
			return null;

		if (item.File && item.Line !== undefined)
			return {File: item.File, Line: item.Line, Character: 0};

		/* A directive of a Library: its file, at its Elemenx.Directive. */
		if (item.File)
			return place(item.File, /Elemenx\.Directive\(/) || {File: item.File, Line: 0, Character: 0};

		word = knowledge.Framework();

		return word ? place(word, new RegExp('Directive\\.Register\\(\\s*([\'"])' + item.Name + '\\1')) : null;
	}

	/* A prop (Title, [Title]) or an event ((pick)) of a Component: to its key, or to the line that emits it. */
	if (at.Kind === 'attribute-name' && at.Attribute && at.Tag && knowledge.Component(at.Tag.Name) && /^[\[(]?[A-Za-z]/.test(at.Attribute.Name)) {
		component = knowledge.Component(at.Tag.Name);
		word = binding(at.Attribute.Name);

		if (!component.File) return null;

		if (word.Kind === 'event')
			return place(component.File, new RegExp('\\$Emit\\(\\s*([\'"])' + word.Name + '\\1')) || {File: component.File, Line: component.Line || 0, Character: 0};

		item = prop(component, word.Name);

		if (item && item.Line !== undefined && !component.Library)
			return {File: component.File, Line: item.Line, Character: 0};

		/* The key of the definition (one tab in), not the one of its $Meta; else any key of that name. */
		return item ? place(component.File, new RegExp('\\n\\t' + item.Name + '\\s*:')) || place(component.File, new RegExp('\\n\\t+' + item.Name + '\\s*:')) || {File: component.File, Line: component.Line || 0, Character: 0} : null;
	}

	/* #Name: to the first $Ref('Name') of the code of its Component. */
	if (at.Kind === 'attribute-name' && at.Attribute && at.Attribute.Name.charAt(0) === '#') {
		own = owner(knowledge, file, text, offset);
		word = own ? read(own.File) : null;
		item = word ? new RegExp('\\$Refs?\\(\\s*([\'"])' + at.Attribute.Name.substring(1).replace(/\$/g, '\\$') + '\\1').exec(word) : null;

		if (!own || !own.File) return null;

		return item ? {File: own.File, Line: Position(word, item.index).line, Character: Position(word, item.index).character} : {File: own.File, Line: own.Line || 0, Character: 0};
	}

	if (at.Kind === 'tag-name' && at.Tag) {
		component = knowledge.Component(at.Tag.Name);

		return component && component.File ? {File: component.File, Line: component.Line || 0, Character: 0} : null;
	}

	if (at.Kind === 'attribute-value' || at.Kind === 'expression') {
		own = owner(knowledge, file, text, offset);
		word = (/[\w$]*$/.exec(text.substring(0, offset)) || [''])[0] + (/^[\w$]*/.exec(text.substring(offset)) || [''])[0];

		/* $T of the templates: to its definition in elemenx.js. */
		if (word === '$T')
			return knowledge.Framework() ? place(knowledge.Framework(), /\n\t+\$T: function/) : null;

		if (!own || !word) return null;

		item = own.Methods.filter(function (each) {
			return each.Name === word;
		})[0] || prop(own, word);

		return item && item.Line !== undefined ? {File: own.File, Line: item.Line, Character: item.Character || 0} : null;
	}

	return null;
}

function Diagnose (knowledge, text, language, file) {
	var problems = [];
	var told;
	var template;
	var names;
	var pattern = /(?:this|self)\.\$Refs?\(\s*(['"])([\w$-]+)\1/g;
	var named = /\$Template\s*:\s*(['"])#([A-Za-z_][\w:.-]*)\1/g;
	var match;

	/* $Template is the template itself: a name in it (Elemenx took one once) throws, the name goes to $TemplateID. */
	while ((match = named.exec(text)))
		problems.push({Start: match.index, End: match.index + match[0].length, Severity: 'error', Message: '$Template is the template itself, not a name: use $TemplateID: \'' + match[2] + '\''});

	/* The code of a Component: this.$Ref('Name') with no #Name in its template (a $Ref of another component is not known). */
	if (language === 'js') {
		template = /Elemenx\.Component\(/.test(text) ? templateOf(file, text) : null;
		names = template ? refs(template.Text).map(function (each) {
			return each.Name;
		}) : null;

		while (names && (match = pattern.exec(text))) {
			if (names.indexOf(match[2]) === -1)
				problems.push({Start: match.index + match[0].length - 1 - match[2].length, End: match.index + match[0].length - 1, Severity: 'warning', Message: 'No #' + match[2] + ' in ' + path.basename(template.File)});
		}

		return problems;
	}

	if (language !== 'html' || knowledge.Empty()) return problems;

	told = knowledge.Emitted();

	scan(text, -1).Tags.forEach(function (tag) {
		var component = knowledge.Component(tag.Name);

		if (!/^[A-Z]/.test(tag.Name)) return;

		if (!component) {
			problems.push({Start: tag.Start, End: tag.End, Severity: 'warning', Message: 'Unknown Elemenx Component: ' + tag.Name});

			return;
		}

		tag.Attributes.forEach(function (attribute) {
			var bound = binding(attribute.Name);
			var name = plain(bound.Name);

			/* A reference (#Name): no prop, the element is the one of $Ref. */
			if (attribute.Name.charAt(0) === '#') return;

			if (bound.Kind === 'prop' || bound.Kind === 'bind') {
				if (prop(component, bound.Name) || Globals.indexOf(name) !== -1 || /^(data-|aria-|on)/.test(lower(bound.Name)) || !name) return;
				/* A Component of the project takes props it does not declare (its state): only the ones of a Library are known for sure. */
				if (!component.Props.length || !component.Library) return;

				problems.push({Start: attribute.Start, End: attribute.End, Severity: 'information', Message: component.Name + ' has no prop ' + bound.Name});
			}

			if (bound.Kind === 'event' && component.Events.length && !component.Events.some(function (each) {
				return plain(each) === name;
			}) && DomEvents.indexOf(name) === -1 && !told[name]) {
				problems.push({Start: attribute.Start, End: attribute.End, Severity: 'information', Message: component.Name + ' tells no event ' + bound.Name});
			}

			if (bound.Kind === 'directive' && !knowledge.Directives().some(function (each) {
				return lower(each.Name) === name;
			})) {
				problems.push({Start: attribute.Start, End: attribute.End, Severity: 'warning', Message: 'Unknown directive: *' + bound.Name});
			}
		});
	});

	return problems;
}

module.exports = {
	Create: Create,
	Complete: Complete,
	Hover: Hover,
	Definition: Definition,
	Diagnose: Diagnose,
	Position: Position,
	Offset: Offset,
	Scan: scan,
	Definitions: definitions
};
