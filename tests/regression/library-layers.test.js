import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/*
 * The system Libraries stand one on another: ElemenxCommon, ElemenxUI on it, ElemenxGraphics on ElemenxUI, ElemenxGaming on
 * ElemenxGraphics. A Library uses what is below it and knows nothing of what is above: no name of an entity of an upper
 * Library, no phrase of its keys, no class of its stylesheets and no token only it declares, in its code (its comments
 * may tell who uses it). Regression: ElemenxUI had the game tokens and classes, the Designer named the kinds of
 * ElemenxGaming, Window had a Variant of a game and *itemcard the card of an item; ElemenxCommon a Component of a page,
 * and its directives the classes ElemenxUI styled (they are styled by its own index.css now, its tokens with fallbacks).
 */
var layers = [
	{Name: 'ElemenxCommon', Prefix: 'common'},
	{Name: 'ElemenxUI', Prefix: 'ui'},
	{Name: 'ElemenxGraphics', Prefix: 'graphics'},
	{Name: 'ElemenxGaming', Prefix: 'gaming'}
].map(function (one) {
	return Object.assign(one, {Root: path.resolve(process.cwd(), 'libraries', one.Name)});
});

/* The files of a Library's code: its scripts, templates and stylesheets, not its tests, docs, data or dictionaries. */
function files (root) {
	var result = [];

	(function walk (directory) {
		fs.readdirSync(directory, {withFileTypes: true}).forEach(function (entry) {
			var full = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				if (['docs', 'locales', 'data', 'node_modules'].indexOf(entry.name) === -1)
					walk(full);
			}
			else if (/\.(js|html|css)$/.test(entry.name) && !/\.test\.js$/.test(entry.name) && entry.name !== 'index.js') {
				result.push(full);
			}
		});
	})(root);

	return result;
}

/* A file without its comments: what it tells of others is allowed, what it does is not. */
function code (file) {
	return fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
}

/* The entities a Library defines: the folders of its components, services, directives and traits. */
function entities (root) {
	return ['components', 'services', 'directives', 'traits'].reduce(function (list, kind) {
		var folder = path.join(root, kind);

		return fs.existsSync(folder) ? list.concat(fs.readdirSync(folder).filter(function (name) {
			return fs.statSync(path.join(folder, name)).isDirectory();
		})) : list;
	}, []);
}

/* The elemenx-* classes of a Library's stylesheets, and the tokens it declares (a --elemenx-* given a value anywhere in its code). */
function classes (root) {
	var result = {};

	files(root).filter(function (file) {
		return /\.css$/.test(file);
	}).forEach(function (file) {
		Array.from(code(file).matchAll(/([^{}]+)\{/g), function (match) {
			Array.from(match[1].matchAll(/\.(elemenx-[a-z0-9-]+)/g), function (name) {
				result[name[1]] = true;
			});
		});
	});

	return result;
}

function tokens (root) {
	var result = {};

	files(root).forEach(function (file) {
		Array.from(code(file).matchAll(/(--elemenx-[a-z0-9-]+)\s*:/g), function (match) {
			result[match[1]] = true;
		});
	});

	return result;
}

describe('Regression: the system Libraries know nothing of the ones above them', function () {
	it('name no entity, phrase, class or token of an upper Library in their code', function () {
		var found = [];
		var below = {Entities: {}, Classes: {}, Tokens: {}};

		layers.forEach(function (layer, at) {
			var upper = layers.slice(at + 1);
			var own = {Entities: entities(layer.Root), Classes: classes(layer.Root), Tokens: tokens(layer.Root)};
			var theirs = {Entities: [], Classes: [], Prefixes: upper.map(function (one) {
				return one.Prefix;
			})};

			own.Entities.forEach(function (name) {
				below.Entities[name] = true;
			});

			Object.assign(below.Classes, own.Classes);
			Object.assign(below.Tokens, own.Tokens);

			upper.forEach(function (one) {
				entities(one.Root).forEach(function (name) {
					if (!below.Entities[name])
						theirs.Entities.push(name);
				});

				Object.keys(classes(one.Root)).forEach(function (name) {
					if (!below.Classes[name])
						theirs.Classes.push(name);
				});
			});

			files(layer.Root).forEach(function (file) {
				var text = code(file);
				var where = path.relative(process.cwd(), file).replace(/\\/g, '/');

				/* An entity used: a Service asked for, a Component made or named to be made, its tag; a word in a text is no use. */
				theirs.Entities.forEach(function (name) {
					if (new RegExp("(?:\\$Service|Elemenx\\.(?:Service|Component|Directive|Trait))\\(\\s*['\"]" + name + "['\"]|Component:\\s*['\"]" + name + "['\"]|<" + name + '[\\s/>]').test(text))
						found.push(where + ': ' + name);
				});

				theirs.Prefixes.forEach(function (prefix) {
					if (new RegExp("['\"]" + prefix + '\\.[a-zA-Z]').test(text))
						found.push(where + ': phrase ' + prefix + '.*');
				});

				theirs.Classes.forEach(function (name) {
					if (new RegExp('(^|[^a-z0-9-])' + name + '(?![a-z0-9-])').test(text))
						found.push(where + ': class ' + name);
				});

				/* A token it reads that only an upper Library gives a value, with no fallback of its own (with one it stands alone). */
				Array.from(text.matchAll(/var\((--elemenx-[a-z0-9-]+)\)/g), function (match) {
					if (!below.Tokens[match[1]] && upper.some(function (one) {
						return tokens(one.Root)[match[1]];
					}))
						found.push(where + ': token ' + match[1]);
				});
			});
		});

		expect(Array.from(new Set(found))).toEqual([]);
	});
});
