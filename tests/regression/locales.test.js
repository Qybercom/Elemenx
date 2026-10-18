import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

var library = path.resolve(process.cwd(), 'libraries', 'ElemenxUI');

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

function dictionary (language) {
	return flatten(JSON.parse(fs.readFileSync(path.join(library, 'locales', language + '.json'), 'utf8')), '', {});
}

function sources (directory, result) {
	fs.readdirSync(directory, {withFileTypes: true}).forEach(function (entry) {
		var file = path.join(directory, entry.name);

		if (entry.isDirectory()) sources(file, result);
		else if (/\.(js|html)$/.test(entry.name)) result.push(file);
	});

	return result;
}

/* The keys the code of the Library names: $T('...') in templates, Elemenx.Locale.Text('...') and Key: '...' in scripts. */
function used () {
	var keys = {};

	sources(path.join(library, 'components'), sources(path.join(library, 'services'), [])).forEach(function (file) {
		var text = fs.readFileSync(file, 'utf8');

		Array.from(text.matchAll(/(?:\$T|Elemenx\.Locale\.Text)\('(ui\.[\w.]+)'(?!\s*\+)/g)).concat(Array.from(text.matchAll(/Key: '(ui\.[\w.]+)'/g))).forEach(function (match) {
			keys[match[1]] = path.relative(library, file);
		});
	});

	return keys;
}

function placeholders (text) {
	return (text.match(/\{\w+\}/g) || []).filter(function (name, index, list) {
		return list.indexOf(name) === index;
	}).sort();
}

describe('ElemenxUI dictionaries', function () {
	it('has every language in the same keys, with the same {params}', function () {
		var english = dictionary('en');
		var languages = fs.readdirSync(path.join(library, 'locales')).map(function (name) {
			return name.replace(/\.json$/, '');
		});

		expect(languages.sort()).toEqual(['en', 'ru']);

		languages.forEach(function (language) {
			var phrases = dictionary(language);

			expect(Object.keys(phrases).sort(), language).toEqual(Object.keys(english).sort());

			Object.keys(english).forEach(function (key) {
				expect(placeholders(phrases[key]), language + ' ' + key).toEqual(placeholders(english[key]));
				expect(phrases[key].trim(), language + ' ' + key).not.toBe('');
			});
		});
	});

	it('has a phrase for every key the components and services name, and no phrase nobody names', function () {
		var english = dictionary('en');
		var keys = used();
		var dynamic = /^ui\.emojiPicker\.(group\.|tone\d)|^ui\.game\.(health|mana|experience|stamina|common|uncommon|rare|epic|legendary)$/;

		expect(Object.keys(keys).filter(function (key) {
			return !(key in english);
		})).toEqual([]);

		expect(Object.keys(english).filter(function (key) {
			return !(key in keys) && !dynamic.test(key);
		})).toEqual([]);
	});

	it('lists the languages of the dictionaries in the default declaration of ElemenxUI in elemenx.js', function () {
		var core = fs.readFileSync(path.resolve(process.cwd(), 'elemenx.js'), 'utf8');

		expect(core).toContain("ElemenxUI: {$Root: '/libraries/ElemenxUI', $Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}}");
		expect(fs.readFileSync(path.join(library, 'index.js'), 'utf8')).toContain("'locales/ru.json'");
	});
});
