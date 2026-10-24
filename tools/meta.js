'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var fail = require('./common.js').fail;

/*
 * The meta of a library for its tools (a builder, a reference): what its Components, Services and Directives declare
 * of themselves in $Meta, normalized as Elemenx.Meta(name) does it, and the classes of its stylesheets with the
 * modifier classes each one takes. Build(library, output) writes it as JSON and returns it.
 */

/* The type of a prop from its default value, as Elemenx.Meta tells it. */
function typeOf (value) {
	if (typeof value === 'boolean') return 'bool';

	if (typeof value === 'number') return 'number';

	if (typeof value === 'string') return 'text';

	return 'json';
}

function copy (value) {
	return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/* The $Meta of a definition, normalized as Elemenx.Meta(name) returns it (keep both the same). */
function normalize (name, kind, definition) {
	var meta = definition.$Meta;
	var props = [];

	if (!meta || typeof meta !== 'object') return null;

	Object.keys(meta.Props || {}).forEach(function (key) {
		var entry = typeof meta.Props[key] === 'string' ? {Description: meta.Props[key]} : meta.Props[key] || {};

		props.push({
			Name: key,
			Type: entry.Type || (entry.Options ? 'select' : typeOf(definition[key])),
			Default: typeof definition[key] === 'function' ? undefined : copy(definition[key]),
			Options: entry.Options ? entry.Options.slice() : null,
			Schema: entry.Schema ? copy(entry.Schema) : null,
			Description: entry.Description || ''
		});
	});

	return {
		Name: name,
		Kind: kind,
		Group: meta.Group || '',
		Icon: meta.Icon || '',
		Description: meta.Description || '',
		Props: props,
		Slots: (meta.Slots || []).slice(),
		Container: !!meta.Container,
		Children: (meta.Children || []).slice(),
		Current: meta.Current || '',
		Events: (meta.Events || []).slice(),
		Methods: (meta.Methods || []).slice(),
		Sample: copy(meta.Sample || {})
	};
}

/* The definitions a script registers, read in a sandbox where Elemenx only records them. */
function definitions (file) {
	var found = [];
	/* Whatever a script asks of the framework at its top (a handle of a Service, a call on it) answers this: nothing. */
	var nothing = new Proxy(function () {}, {
		get: function (target, key) {
			return key === Symbol.toPrimitive ? function () {
				return '';
			} : nothing;
		},
		apply: function () {
			return nothing;
		}
	});
	var record = function (kind) {
		return function (name, definition) {
			if (definition && typeof definition === 'object')
				found.push({Kind: kind, Name: kind === 'Directive' ? String(name).toLowerCase() : name, Definition: definition});

			return nothing;
		};
	};
	var sandbox = {
		Elemenx: {Component: record('Component'), Service: record('Service'), Directive: record('Directive')},
		window: {},
		document: {},
		navigator: {},
		console: console
	};

	try {
		vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, {filename: file, timeout: 1000});
	}
	catch (error) {
		fail('Elemenx meta: ' + file + ': ' + error.message);
	}

	return found;
}

/* The classes of a stylesheet (elemenx-*) with the modifier classes they are combined with. */
function classes (css, result) {
	var text = css.replace(/\/\*[\s\S]*?\*\//g, '');
	var pattern = /([^{}]+)\{/g;
	var match = pattern.exec(text);

	while (match) {
		if (match[1].trim().charAt(0) !== '@') {
			(match[1].match(/(?:\.[a-zA-Z0-9_-]+)+/g) || []).forEach(function (compound) {
				var names = compound.substring(1).split('.');

				names.forEach(function (name) {
					if (name.indexOf('elemenx-') !== 0) return;

					result[name] = result[name] || [];

					names.forEach(function (other) {
						if (other.indexOf('elemenx-') !== 0 && result[name].indexOf(other) === -1)
							result[name].push(other);
					});
				});
			});
		}

		match = pattern.exec(text);
	}

	return result;
}

function Build (library, output) {
	var index = path.join(library, 'index.js');
	var files;
	var result = {Components: [], Services: [], Directives: [], Classes: {}};

	if (!fs.existsSync(index))
		fail('Elemenx meta: no index.js in ' + library);

	files = vm.runInNewContext(fs.readFileSync(index, 'utf8'), {}, {filename: index});

	files.forEach(function (file) {
		var full = path.join(library, file);

		if (/\.js$/.test(file)) {
			definitions(full).forEach(function (entry) {
				var meta = normalize(entry.Name, entry.Kind, entry.Definition);
				if (meta)
					result[entry.Kind + 's'].push(meta);
			});

			if (fs.existsSync(full.replace(/\.js$/, '.css')))
				classes(fs.readFileSync(full.replace(/\.js$/, '.css'), 'utf8'), result.Classes);
		}
		else if (/\.css$/.test(file) && file.indexOf('themes/') !== 0) {
			classes(fs.readFileSync(full, 'utf8'), result.Classes);
		}
	});

	Object.keys(result.Classes).forEach(function (name) {
		result.Classes[name].sort();
	});

	if (output)
		fs.writeFileSync(output, JSON.stringify(result, null, '\t') + '\n');

	return result;
}

module.exports = {
	Build: Build,
	Normalize: normalize
};
