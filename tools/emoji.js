'use strict';

var fs = require('fs');
var path = require('path');
var fail = require('./common.js').fail;

/* The groups of emoji-test.txt that the pickers show, with their ID and icon; Component (the skin tones) is left out. */
var Groups = {
	'Smileys & Emotion': {ID: 'smileys', Label: 'Smileys & emotion', Icon: 'smile'},
	'People & Body': {ID: 'people', Label: 'People & body', Icon: 'hand'},
	'Animals & Nature': {ID: 'nature', Label: 'Animals & nature', Icon: 'leaf'},
	'Food & Drink': {ID: 'food', Label: 'Food & drink', Icon: 'coffee'},
	'Travel & Places': {ID: 'travel', Label: 'Travel & places', Icon: 'globe'},
	'Activities': {ID: 'activities', Label: 'Activities', Icon: 'trophy'},
	'Objects': {ID: 'objects', Label: 'Objects', Icon: 'lightbulb'},
	'Symbols': {ID: 'symbols', Label: 'Symbols', Icon: 'heart'},
	'Flags': {ID: 'flags', Label: 'Flags', Icon: 'flag'}
};

var Tone = /\uD83C[\uDFFB-\uDFFF]/;
var Tones = /\uD83C[\uDFFB-\uDFFF]/g;

function plain (char) {
	return String(char).replace(/️/g, '');
}

function characters (codes) {
	return codes.split(' ').map(function (code) {
		return String.fromCodePoint(parseInt(code, 16));
	}).join('');
}

/* The region of a flag of two regional indicators ('🇩🇪' -> 'DE'), or ''. */
function region (char) {
	var points = Array.from(char).map(function (point) {
		return point.codePointAt(0);
	});
	if (points.length !== 2 || points[0] < 0x1F1E6 || points[0] > 0x1F1FF || points[1] < 0x1F1E6 || points[1] > 0x1F1FF) return '';

	return String.fromCharCode(points[0] - 0x1F1E6 + 65, points[1] - 0x1F1E6 + 65);
}

/*
 * Reads emoji-test.txt of Unicode: the fully-qualified emoji of every group but Component, in their order, with their
 * English name and the version of Emoji that brought them. The skin tone variants are not listed: an emoji takes a
 * tone (Tone) when it has a variant with one tone after its first code point.
 */
function parseTest (source) {
	var groups = [];
	var group = null;
	var toned = {};
	var all = [];
	var version = '';

	String(source).split(/\r?\n/).forEach(function (line) {
		var match = /^# group: (.+)$/.exec(line);
		var row;
		var char;

		if (/^# Version: /.test(line))
			version = line.substring(11).trim();

		if (match) {
			group = Groups[match[1]] ? {ID: Groups[match[1]].ID, Label: Groups[match[1]].Label, Icon: Groups[match[1]].Icon, Emoji: []} : null;

			if (group)
				groups.push(group);

			return;
		}

		row = /^([0-9A-F ]+?)\s*;\s*fully-qualified\s*#\s*\S+\s+E(\d+\.\d+)\s+(.+)$/.exec(line);

		if (!row || !group) return;

		char = characters(row[1]);

		if (Tone.test(char)) {
			if ((char.match(Tones) || []).length === 1)
				toned[plain(char.replace(Tones, ''))] = true;

			return;
		}

		all.push({Char: char, Name: row[3], Version: Number(row[2]), Group: group});
	});

	all.forEach(function (emoji) {
		var row = [emoji.Char, emoji.Name, emoji.Version, toned[plain(emoji.Char)] ? 1 : 0];

		if (region(emoji.Char))
			row.push(region(emoji.Char));

		emoji.Group.Emoji.push(row);
	});

	return {Version: version, Groups: groups};
}

/* The names and keywords of a language from the CLDR annotations (annotations.json and annotationsDerived). */
function parseAnnotations (files) {
	var result = {};

	files.forEach(function (file) {
		var data = JSON.parse(fs.readFileSync(file, 'utf8'));
		var root = data.annotations || data.annotationsDerived;
		var map = root && root.annotations;
		var char;

		if (!map)
			fail('Not a CLDR annotations file: ' + file);

		for (char in map) {
			if (map.hasOwnProperty(char) && !Tone.test(char))
				result[plain(char)] = [map[char].tts ? map[char].tts.join(' ') : '', map[char].default ? map[char].default.join('|') : ''];
		}
	});

	return result;
}

/*
 * Builds the emoji data of ElemenxUI: emoji.json (the groups, rows [char, English name, version, tone, region?]) and
 * one emoji-<locale>.json per language ({char: [name, keywords]}, only for the emoji of emoji.json). Options: Test
 * (emoji-test.txt), Annotations ({locale: [annotations.json, derived annotations.json]}), Output (a directory).
 */
function Build (options) {
	var data;
	var known = {};
	var locales = [];
	var locale;

	if (!options || !options.Test || !fs.existsSync(options.Test))
		fail('emoji-test.txt not found: ' + (options && options.Test));

	data = parseTest(fs.readFileSync(options.Test, 'utf8'));

	data.Groups.forEach(function (group) {
		group.Emoji.forEach(function (row) {
			known[plain(row[0])] = row[0];
		});
	});

	fs.mkdirSync(options.Output, {recursive: true});
	fs.writeFileSync(path.join(options.Output, 'emoji.json'), JSON.stringify(data).replace(/\],\[/g, '],\n[').replace(/"Emoji":\[\[/g, '"Emoji":[\n[') + '\n');

	for (locale in options.Annotations || {}) {
		if (!options.Annotations.hasOwnProperty(locale)) continue;

		(function (words) {
			var output = {};
			var key;

			for (key in words) {
				if (words.hasOwnProperty(key) && known[key])
					output[known[key]] = words[key];
			}

			fs.writeFileSync(path.join(options.Output, 'emoji-' + locale + '.json'), JSON.stringify(output).replace(/\],"/g, '],\n"') + '\n');
		})(parseAnnotations(options.Annotations[locale]));

		locales.push(locale);
	}

	return {Version: data.Version, Count: Object.keys(known).length, Locales: locales};
}

module.exports = {
	Build: Build,
	ParseTest: parseTest
};

/*
 * node tools/emoji.js <emoji-test.txt> <cldr-annotations-full> <cldr-annotations-derived-full> <output> [en,ru]
 * The CLDR directories are the npm packages cldr-annotations-full and cldr-annotations-derived-full.
 */
if (require.main === module) {
	(function (args) {
		var locales = String(args[4] || 'en,ru').split(',');
		var annotations = {};
		var result;

		if (args.length < 4)
			fail('usage: node tools/emoji.js <emoji-test.txt> <cldr-annotations-full> <cldr-annotations-derived-full> <output> [en,ru]');

		locales.forEach(function (locale) {
			annotations[locale] = [path.join(args[1], 'annotations', locale, 'annotations.json'), path.join(args[2], 'annotationsDerived', locale, 'annotations.json')];
		});

		result = Build({Test: args[0], Annotations: annotations, Output: args[3]});

		process.stdout.write('Elemenx emoji: ' + result.Count + ' emoji of Emoji ' + result.Version + ', ' + result.Locales.join(', ') + '\n');
	})(process.argv.slice(2));
}
