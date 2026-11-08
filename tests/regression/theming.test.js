import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

var library = path.resolve(process.cwd(), 'libraries', 'ElemenxUI');
var gaming = path.resolve(process.cwd(), 'libraries', 'ElemenxGaming');

/* The stylesheets of the Libraries themselves: ElemenxUI and the game look of ElemenxGaming. */
var indexes = [path.join(library, 'index.css'), path.join(gaming, 'index.css')];
var docs = path.resolve(process.cwd(), 'docs');

function read (file) {
	return fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

/* The stylesheets of the components of every system Library: the themes of ElemenxUI style them all. */
function componentStyles () {
	return ['ElemenxCommon', 'ElemenxUI', 'ElemenxGraphics', 'ElemenxGaming'].flatMap(function (name) {
		var root = path.resolve(process.cwd(), 'libraries', name, 'components');

		return fs.existsSync(root) ? fs.readdirSync(root).sort().map(function (one) {
			return path.join(root, one);
		}) : [];
	}).flatMap(function (directory) {
		return fs.readdirSync(directory).filter(function (file) {
			return /\.css$/.test(file);
		}).map(function (file) {
			return path.join(directory, file);
		});
	});
}

function selectors (source) {
	return Array.from(source.matchAll(/([^{}]+)\{/g), function (match) {
		return match[1].trim();
	}).filter(function (selector) {
		return selector.charAt(0) !== '@';
	});
}

function declarations (source) {
	return Array.from(source.matchAll(/(?<![\w-])([a-z-]+)\s*:\s*([^;{}]+);/g), function (match) {
		return {Property: match[1], Value: match[2].trim()};
	}).filter(function (declaration) {
		return declaration.Property.indexOf('--') !== 0;
	});
}

/* Every elemenx-* class of the stylesheets, with the modifier classes it is combined with. */
function classes () {
	var result = new Map();

	indexes.concat(componentStyles()).forEach(function (file) {
		selectors(read(file)).forEach(function (selector) {
			Array.from(selector.matchAll(/(?:\.[a-zA-Z0-9_-]+)+/g), function (match) {
				var names = match[0].substring(1).split('.');

				names.forEach(function (name) {
					if (name.indexOf('elemenx-') !== 0) return;

					if (!result.has(name))
						result.set(name, new Set());

					names.forEach(function (other) {
						if (other.indexOf('elemenx-') !== 0)
							result.get(name).add(other);
					});
				});
			});
		});
	});

	return result;
}

function documented () {
	var result = new Map();
	var source = fs.readFileSync(path.join(docs, 'THEMING-CLASSES.md'), 'utf8');

	Array.from(source.matchAll(/^- `(elemenx-[a-z0-9-]+)`(?:: (.*))?$/gm), function (match) {
		result.set(match[1], new Set(match[2] ? Array.from(match[2].matchAll(/`([^`]+)`/g), function (modifier) {
			return modifier[1];
		}) : []));
	});

	return result;
}

function flatten (map) {
	var list = [];

	map.forEach(function (modifiers, name) {
		list.push(name);

		modifiers.forEach(function (modifier) {
			list.push(name + '.' + modifier);
		});
	});

	return list.sort();
}

/* The tokens of the theme: the variables an index.css defines on :root and body (not those of a Component class). */
function tokens (root) {
	var result = new Set();

	Array.from(read(path.join(root || library, 'index.css')).matchAll(/([^{}]+)\{([^{}]*)\}/g), function (block) {
		if (!/^(?::root|body)\b/.test(block[1].trim())) return;

		Array.from(block[2].matchAll(/(--elemenx-[a-z0-9-]+)\s*:/g), function (match) {
			result.add(match[1]);
		});
	});

	return Array.from(result).sort();
}

describe('ElemenxUI theming', function () {
	it('lists every class and modifier of the stylesheets in docs/THEMING-CLASSES.md, and nothing else', function () {
		var actual = flatten(classes());
		var listed = flatten(documented());

		expect(actual.filter(function (name) {
			return listed.indexOf(name) === -1;
		})).toEqual([]);

		expect(listed.filter(function (name) {
			return actual.indexOf(name) === -1;
		})).toEqual([]);
	});

	it('gives every token of an index.css a line in the theme template of its Library and in docs/THEMING.md', function () {
		var guide = fs.readFileSync(path.join(docs, 'THEMING.md'), 'utf8');

		[library, gaming].forEach(function (root) {
			var template = fs.readFileSync(path.join(root, 'themes', 'template.css'), 'utf8');

			expect(tokens(root).length, root).toBeGreaterThan(50);

			expect(tokens(root).filter(function (token) {
				return template.indexOf(token + ':') === -1;
			})).toEqual([]);

			expect(tokens(root).filter(function (token) {
				return guide.indexOf('`' + token + '`') === -1;
			})).toEqual([]);
		});
	});

	it('keeps the game tokens and classes in ElemenxGaming: ElemenxUI names none', function () {
		var found = [];

		[path.join(library, 'index.css')].concat(fs.readdirSync(path.join(library, 'themes')).map(function (file) {
			return path.join(library, 'themes', file);
		})).concat(componentStyles().filter(function (file) {
			return file.indexOf(library) === 0;
		})).forEach(function (file) {
			if (/--elemenx-game|elemenx-game-|\.elemenx-window\.game\b/.test(read(file)))
				found.push(path.basename(file));
		});

		expect(found).toEqual([]);
	});

	it('names no color in the stylesheets of the Components: colors are tokens of the theme', function () {
		var found = [];

		componentStyles().forEach(function (file) {
			/* The color picker draws real colors: its hue strip, its gradients and its checkerboard. */
			if (path.basename(file) === 'ColorInput.css') return;

			declarations(read(file)).forEach(function (declaration) {
				var value = declaration.Value.replace(/rgba\(var\(--elemenx-[a-z0-9-]+-rgb(?:, var\(--elemenx-[a-z0-9-]+-rgb\))?\), [\d.]+\)/g, '').replace(/var\(--[a-z0-9-]+,\s*(?:[^()]|\([^()]*\))*\)/g, '');
				if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(|\b(?:white|black)\b/.test(value))
					found.push(path.basename(file) + ': ' + declaration.Property + ': ' + declaration.Value);
			});
		});

		expect(found).toEqual([]);
	});

	it('rounds corners and sizes type with the tokens of the theme', function () {
		var found = [];

		indexes.concat(componentStyles()).forEach(function (file) {
			declarations(read(file)).forEach(function (declaration) {
				var value = declaration.Value.replace(/var\([^()]*\)|calc\((?:[^()]|\([^()]*\))*\)/g, '');
				if (/radius$/.test(declaration.Property) && /\b(?!1px\b)\d+(?:\.\d+)?px\b/.test(value))
					found.push(path.basename(file) + ': ' + declaration.Property + ': ' + declaration.Value);

				if (declaration.Property === 'font-size' && /^(?:12|14|16)px$/.test(value))
					found.push(path.basename(file) + ': ' + declaration.Property + ': ' + declaration.Value);

				if (declaration.Property === 'transition' && /\d+ms/.test(value))
					found.push(path.basename(file) + ': ' + declaration.Property + ': ' + declaration.Value);
			});
		});

		expect(found).toEqual([]);
	});

	it('mixes no colors with color-mix(), and gives every color with channels channels that match it', function () {
		var files = indexes.concat(componentStyles()).concat([library, gaming].flatMap(function (root) {
			return fs.readdirSync(path.join(root, 'themes')).map(function (file) {
				return path.join(root, 'themes', file);
			});
		}));
		var mixed = [];
		var wrong = [];

		files.forEach(function (file) {
			var source = read(file);
			if (source.indexOf('color-mix(') !== -1)
				mixed.push(path.basename(file));

			Array.from(source.matchAll(/([^{}]+)\{([^{}]*)\}/g), function (block) {
				Array.from(block[2].matchAll(/(--elemenx-[a-z-]+): #([0-9a-fA-F]{6});/g), function (color) {
					var channels = new RegExp(color[1] + '-rgb: ([0-9, ]+);').exec(block[2]);
					var expected = [0, 2, 4].map(function (start) {
						return parseInt(color[2].substring(start, start + 2), 16);
					}).join(', ');
					if (/^--elemenx-(background|surface|surface-hover|text|text-muted|accent|accent-text|danger|success|warning|info|border-strong)$/.test(color[1]) && (!channels || channels[1] !== expected))
						wrong.push(path.basename(file) + ' ' + block[1].trim() + ' ' + color[1]);
				});
			});
		});

		expect(mixed).toEqual([]);
		expect(wrong).toEqual([]);
	});

	it('starts every rule of a Library theme with the attribute of the theme, and loads every theme with the Library', function () {
		[
			{Root: library, Files: ['contrast.css', 'darcula.css', 'fantasy.css', 'glassy.css', 'scifi.css', 'soft.css', 'template.css']},
			{Root: gaming, Files: ['fantasy.css', 'scifi.css', 'template.css']}
		].forEach(function (one) {
			var index = fs.readFileSync(path.join(one.Root, 'index.js'), 'utf8');
			var files = fs.readdirSync(path.join(one.Root, 'themes')).filter(function (file) {
				return /\.css$/.test(file);
			});

			expect(files).toEqual(one.Files);

			files.forEach(function (file) {
				var name = file === 'template.css' ? 'my-theme' : file.replace(/\.css$/, '');

				selectors(read(path.join(one.Root, 'themes', file))).forEach(function (selector) {
					selector.split(',').forEach(function (part) {
						expect(part.trim().indexOf("[data-theme][data-theme='" + name + "']"), file + ': ' + part.trim()).toBe(0);
					});
				});

				expect(index.indexOf("'themes/" + file + "'") !== -1, file).toBe(file !== 'template.css');
			});
		});
	});
});
