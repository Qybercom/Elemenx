import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var locales = require('../../tools/locales.js');
var common = require('../../tools/common.js');

/* The system Libraries and the start of the keys of each: every Library has its own dictionaries. */
var libraries = [['ElemenxCommon', 'common'], ['ElemenxUI', 'ui'], ['ElemenxGraphics', 'graphics'], ['ElemenxGaming', 'gaming']].map(function (pair) {
	return {Name: pair[0], Prefix: pair[1], Root: path.resolve(process.cwd(), 'libraries', pair[0])};
});

var plurals = ['zero', 'one', 'two', 'few', 'many', 'other'];

/* The phrases by key; the plural forms of a phrase are one value, its forms joined. */
function flatten (node, prefix, result) {
	Object.keys(node).forEach(function (key) {
		var forms = typeof node[key] === 'object' && Object.keys(node[key]).every(function (name) {
			return plurals.indexOf(name) !== -1;
		});

		if (typeof node[key] === 'string') result[prefix + key] = node[key];
		else if (forms) result[prefix + key] = Object.keys(node[key]).map(function (name) {
			return node[key][name];
		}).join(' | ');
		else flatten(node[key], prefix + key + '.', result);
	});

	return result;
}

function dictionary (language, root) {
	return flatten(JSON.parse(fs.readFileSync(path.join(root, 'locales', language + '.json'), 'utf8')), '', {});
}

function sources (directory, result) {
	if (!fs.existsSync(directory)) return result;

	fs.readdirSync(directory, {withFileTypes: true}).forEach(function (entry) {
		var file = path.join(directory, entry.name);

		/* The docs and the tests beside an entity name no phrase of its own. */
		if (entry.isDirectory() && entry.name !== 'docs') sources(file, result);
		else if (entry.isFile() && /\.(js|html)$/.test(entry.name) && !/\.test\.js$/.test(entry.name)) result.push(file);
	});

	return result;
}

/*
 * The keys the code of the system Libraries names: $T('...') in templates, Elemenx.Locale.Text('...') and Key: '...' in
 * scripts. A Library may name the keys of the ones it stands on.
 */
function used () {
	var keys = {};

	libraries.forEach(function (one) {
		['components', 'traits', 'services', 'directives'].reduce(function (list, kind) {
			return sources(path.join(one.Root, kind), list);
		}, []).forEach(function (file) {
			var text = fs.readFileSync(file, 'utf8');

			Array.from(text.matchAll(/(?:\$T|Elemenx\.Locale\.Text)\('((?:common|ui|graphics|gaming)\.[\w.]+)'(?!\s*\+)/g)).concat(Array.from(text.matchAll(/Key: '((?:common|ui|graphics|gaming)\.[\w.]+)'/g))).forEach(function (match) {
				keys[match[1]] = path.relative(process.cwd(), file);
			});
		});
	});

	return keys;
}

function placeholders (text) {
	return (text.match(/\{\w+\}/g) || []).filter(function (name, index, list) {
		return list.indexOf(name) === index;
	}).sort();
}

describe('The dictionaries of the system Libraries', function () {
	it('has every language in the same keys, with the same {params}, each Library under its own start of keys', function () {
		libraries.forEach(function (one) {
			var english = dictionary('en', one.Root);
			/* The dictionaries, not the folder of the shared pieces they are made of. */
			var languages = fs.readdirSync(path.join(one.Root, 'locales')).filter(function (name) {
				return /\.json$/.test(name);
			}).map(function (name) {
				return name.replace(/\.json$/, '');
			});

			expect(languages.sort(), one.Name).toEqual(['en', 'ru']);

			expect(Object.keys(english).filter(function (key) {
				return key.split('.')[0] !== one.Prefix;
			}), one.Name).toEqual([]);

			languages.forEach(function (language) {
				var phrases = dictionary(language, one.Root);

				expect(Object.keys(phrases).sort(), one.Name + ' ' + language).toEqual(Object.keys(english).sort());

				Object.keys(english).forEach(function (key) {
					expect(placeholders(phrases[key]), language + ' ' + key).toEqual(placeholders(english[key]));
					expect(phrases[key].trim(), language + ' ' + key).not.toBe('');
				});
			});
		});
	});

	it('has a phrase for every key the components and services name, and no phrase nobody names', function () {
		var english = libraries.reduce(function (all, one) {
			return Object.assign(all, dictionary('en', one.Root));
		}, {});
		var keys = used();
		var dynamic = /^ui\.presence\.|^ui\.forms\.|^ui\.designer\.(groups|kinds|hints)\.|^ui\.designer\.rules\.(node|kind|within|when-|where-|scheme-)|^ui\.designer\.(before|after)$|^ui\.emojiPicker\.(group\.|tone\d)|^gaming\.ui\.(health|mana|experience|stamina|common|uncommon|rare|epic|legendary)$|^ui\.call\.layouts\.|^ui\.signal\.(good|fair|poor)$|^ui\.signaturePad\.(match|mismatch)$|^ui\.pipeline\.(retry|cancel|play|status\.)|^ui\.calculator\.keys\.|^ui\.quiz\.(check|next|right|wrong|passed|failed)$|^graphics\.scene\.(class|temperature|mass|radius|luminosity|gravity|distance|period|day|habitable|at|team|ships|heading|yes|locked|km|au|ms2|days|hours|health|parts|horizon|innermost|leads|nucleus|kinds\.|surfaces\.)|^graphics\.cutsceneEditor\.types\./;

		expect(Object.keys(keys).filter(function (key) {
			return !(key in english);
		})).toEqual([]);

		expect(Object.keys(english).filter(function (key) {
			return !(key in keys) && !dynamic.test(key);
		})).toEqual([]);
	});

	it('lists the languages of the dictionaries in the default declaration of the system Libraries in elemenx.js, which each of them has', function () {
		var core = fs.readFileSync(path.resolve(process.cwd(), 'elemenx.js'), 'utf8');

		expect(core).toContain("$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}, $Use: uses};");

		['ElemenxCommon', 'ElemenxUI', 'ElemenxGraphics', 'ElemenxGaming'].forEach(function (name) {
			expect(core).toContain(name + ": system('" + name + "', ");
			expect(fs.readFileSync(path.resolve(process.cwd(), 'libraries', name, 'index.js'), 'utf8'), name).toContain("'locales/ru.json'");
			expect(fs.existsSync(path.resolve(process.cwd(), 'libraries', name, 'locales', 'en.json')), name).toBe(true);
		});
	});

	it('has as the dictionaries of each Library its pieces merged, those beside its entities and its shared ones (node tools/locales.js)', function () {
		libraries.forEach(function (library) {
			expect(locales.Check(library.Root), library.Name).toEqual([]);
		});
	});

	it('merges the pieces of a Library, its shared ones first, and refuses a phrase given twice', function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-locales-'));

		function put (file, data) {
			fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
			fs.writeFileSync(path.join(root, file), JSON.stringify(data));
		}

		try {
			put('locales/shared/en.json', {kit: {title: 'Kit'}});
			put('services/Count/locales/en.json', {kit: {count: {one: 'One'}}});
			put('components/Card/locales/en.json', {kit: {card: {label: 'Card'}}});
			put('components/Card/locales/ru.json', {kit: {card: {label: 'Карточка'}}});

			expect(JSON.parse(locales.Build(root).en)).toEqual({kit: {title: 'Kit', card: {label: 'Card'}, count: {one: 'One'}}});
			expect(Object.keys(JSON.parse(locales.Build(root).en).kit)).toEqual(['title', 'card', 'count']);
			expect(locales.Check(root).sort()).toEqual(['en', 'ru']);

			locales.Write(root);

			expect(locales.Check(root)).toEqual([]);

			put('directives/Mark/locales/en.json', {kit: {card: {label: 'Again'}}});

			expect(function () {
				locales.Build(root);
			}).toThrow('The phrase kit.card.label is given twice, again in directives/Mark/locales/en.json');
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});

	it('keeps what is beside the entities of a Library for their authors out of what it ships', function () {
		['docs', 'services/Math/docs', 'services/Math/docs/Math.ru.md', 'services/Math/Math.test.js', 'services/Math/locales', 'locales/shared'].forEach(function (relative) {
			expect(common.LibraryPrivate(relative, !/\.\w+$/.test(relative)), relative).toBe(true);
		});

		['services/Math/Math.js', 'locales', 'locales/en.json', 'components/Card/Card.html', 'data/meta.json'].forEach(function (relative) {
			expect(common.LibraryPrivate(relative, !/\.\w+$/.test(relative)), relative).toBe(false);
		});
	});
});
