/*
 * The dictionaries of a Library made of their pieces. The phrases of an entity are beside it, in the locales folder of
 * its own folder (components/VirtualGamepad/locales/en.json, services/Math/locales/ru.json); the phrases of the Library
 * that no one entity has are in locales/shared/<language>.json. Merged, they are the dictionaries the Library serves
 * and its index.js lists, locales/<language>.json: those of the Library first, then those of each entity in the order
 * of their kinds and names. Two pieces with one phrase are an error.
 *
 *   node tools/locales.js            writes the dictionaries of each system Library
 *   node tools/locales.js --check    only tells which of them are not their pieces merged (exit code 1)
 *
 * Build(directory) returns {language: text} for a Library; Check(directory) the languages whose file differs.
 */
var fs = require('fs');
var path = require('path');
var common = require('./common.js');

var Kinds = ['components', 'services', 'directives', 'traits'];

function read (file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/* Puts piece into target: the objects joined, a phrase given twice is an error (where says from which file). */
function merge (target, piece, where, trail) {
	Object.keys(piece).forEach(function (key) {
		var name = trail ? trail + '.' + key : key;
		var value = piece[key];

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			if (Object.prototype.hasOwnProperty.call(target, key) && (typeof target[key] !== 'object' || Array.isArray(target[key])))
				throw new Error('The phrase ' + name + ' is given twice, again in ' + where);

			target[key] = target[key] || {};

			merge(target[key], value, where, name);

			return;
		}

		if (Object.prototype.hasOwnProperty.call(target, key))
			throw new Error('The phrase ' + name + ' is given twice, again in ' + where);

		target[key] = value;
	});

	return target;
}

/* The pieces of a Library: [{Language, File}], those of the Library first, then those of its entities. */
function pieces (directory) {
	var result = [];
	var shared = path.join(directory, 'locales', 'shared');

	function add (folder) {
		if (!fs.existsSync(folder)) return;

		fs.readdirSync(folder).filter(function (file) {
			return /^[\w-]+\.json$/.test(file);
		}).sort().forEach(function (file) {
			result.push({Language: file.replace(/\.json$/, ''), File: path.join(folder, file)});
		});
	}

	add(shared);

	Kinds.forEach(function (kind) {
		var folder = path.join(directory, kind);
		if (!fs.existsSync(folder)) return;

		fs.readdirSync(folder).sort().forEach(function (entity) {
			add(path.join(folder, entity, 'locales'));
		});
	});

	return result;
}

/* The dictionaries of a Library merged of its pieces, {language: text}; none when it has no pieces (its files are its own). */
function Build (directory) {
	var merged = {};
	var result = {};

	pieces(directory).forEach(function (piece) {
		merged[piece.Language] = merge(merged[piece.Language] || {}, read(piece.File), path.relative(directory, piece.File).replace(/\\/g, '/'));
	});

	Object.keys(merged).forEach(function (language) {
		result[language] = JSON.stringify(merged[language], null, '\t') + '\n';
	});

	return result;
}

/* The languages of a Library whose dictionary is not its pieces merged. */
function Check (directory) {
	var built = Build(directory);

	return Object.keys(built).filter(function (language) {
		var file = path.join(directory, 'locales', language + '.json');

		return !fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== built[language];
	});
}

function Write (directory) {
	var built = Build(directory);

	Object.keys(built).forEach(function (language) {
		var file = path.join(directory, 'locales', language + '.json');
		if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== built[language])
			fs.writeFileSync(file, built[language]);
	});

	return Object.keys(built);
}

module.exports = {Build: Build, Check: Check, Write: Write};

if (require.main === module) {
	var check = process.argv.indexOf('--check') !== -1;
	var stale = [];

	common.SystemLibraries.forEach(function (library) {
		var directory = path.resolve(__dirname, '..', 'libraries', library.Name);

		if (check) {
			Check(directory).forEach(function (language) {
				stale.push(library.Name + '/locales/' + language + '.json');
			});

			return;
		}

		process.stdout.write('Elemenx locales: ' + library.Name + ' ' + (Write(directory).join(', ') || 'no pieces') + '\n');
	});

	if (stale.length) {
		process.stderr.write('Not their pieces merged (node tools/locales.js): ' + stale.join(', ') + '\n');

		process.exitCode = 1;
	}
}
