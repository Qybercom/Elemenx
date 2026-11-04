'use strict';

var fs = require('fs');
var path = require('path');

function fail (message) {
	throw new Error(message);
}

/*
 * Reads a Discovery index file: a JavaScript Array literal of entity paths, optionally followed by `;`.
 */
function parseIndex (file) {
	var source = fs.readFileSync(file, 'utf8').replace(/;\s*$/, '');
	var value;

	try {
		value = Function('return (' + source + ');')();
	}
	catch (error) {
		fail('invalid index ' + file + ': ' + error.message);
	}

	if (!Array.isArray(value))
		fail('index must return an Array: ' + file);

	return value;
}

/*
 * Reads the packs of a Library, packs.json in its root: the files that its bundles leave out unless a page needs them,
 * {Name: {Files: [paths from the root], Uses: [texts in the code of an Application that show it needs them], Language}}.
 * A Library without the file has none.
 */
function readPacks (directory) {
	var file = path.join(directory, 'packs.json');
	var value;

	if (!fs.existsSync(file)) return {};

	try {
		value = JSON.parse(fs.readFileSync(file, 'utf8'));
	}
	catch (error) {
		fail('invalid packs ' + file + ': ' + error.message);
	}

	Object.keys(value).forEach(function (name) {
		if (!value[name] || !Array.isArray(value[name].Files))
			fail('a pack needs Files: ' + name + ' in ' + file);
	});

	return value;
}

/* The name of the pack that holds a file of a Library (its path from the root, with forward slashes), or null. */
function packOf (packs, relative) {
	var names = Object.keys(packs);
	var i = 0;

	while (i < names.length) {
		if (packs[names[i]].Files.indexOf(relative) !== -1) return names[i];

		i++;
	}

	return null;
}

/*
 * The package.json of a module the project installed ({File, Package}), or null: found in the node_modules of the
 * project and of the folders above it, as Node looks for a module. Not by require.resolve: a package whose exports
 * leave its package.json out (@electron/packager) cannot be resolved so.
 */
function installed (project, name) {
	var folder = path.resolve(project);
	var file;

	while (folder) {
		file = path.join(folder, 'node_modules', name, 'package.json');

		if (fs.existsSync(file)) {
			try {
				return {File: file, Package: JSON.parse(fs.readFileSync(file, 'utf8'))};
			}
			catch (error) {
				return null;
			}
		}

		if (path.dirname(folder) === folder) return null;

		folder = path.dirname(folder);
	}

	return null;
}

/*
 * Writes a file, a few tries: an editor or a server that reads it may hold it for a moment, and on Windows the write
 * fails then (UNKNOWN, EBUSY, EPERM). wait(milliseconds) waits between tries (a blocking sleep by default).
 */
function writeFile (file, text, wait) {
	var attempt;

	for (attempt = 1; ; attempt++) {
		try {
			fs.writeFileSync(file, text);

			return;
		}
		catch (error) {
			if (attempt === 10 || ['UNKNOWN', 'EBUSY', 'EPERM'].indexOf(error.code) === -1)
				throw error;

			(wait || function (milliseconds) {
				Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
			})(100);
		}
	}
}

/*
 * The system Libraries in their order, each on the ones before it (as the runtime declares them): Slug names their files
 * of dist (elemenx-<slug>.js, elemenx-<slug>/), All whether elemenx.all.js carries it.
 */
var SystemLibraries = [
	{Name: 'ElemenxCommon', Slug: 'common', Uses: [], All: true},
	{Name: 'ElemenxUI', Slug: 'ui', Uses: ['ElemenxCommon'], All: true},
	{Name: 'ElemenxGraphics', Slug: 'graphics', Uses: ['ElemenxUI'], All: false},
	{Name: 'ElemenxGaming', Slug: 'gaming', Uses: ['ElemenxGraphics'], All: false}
];

/* The system Libraries names need, those they use first: [{Name, Slug, Uses, All}] in their order. */
function systemLibraries (names) {
	var wanted = {};

	function want (name) {
		var library = SystemLibraries.filter(function (each) {
			return each.Name === name;
		})[0];
		if (!library || wanted[name]) return;

		wanted[name] = true;

		library.Uses.forEach(want);
	}

	(names || SystemLibraries.map(function (library) {
		return library.Name;
	})).forEach(want);

	return SystemLibraries.filter(function (library) {
		return wanted[library.Name];
	});
}

/*
 * What a Library keeps beside its entities for their authors, never shipped (bundles, its files in dist, the copies of
 * the editors, npm): a docs folder (of the Library or of an entity: its page, its example, its description in other
 * languages), a test beside what it tests (Math.test.js), and the pieces of its dictionaries (services/Math/locales,
 * locales/shared), which tools/locales.js merges into locales/<language>.json. relative is from the folder of the
 * Library, with /.
 */
function LibraryPrivate (relative, folder) {
	var parts = relative.split('/');
	if (parts.indexOf('docs') !== -1) return true;
	if (!folder && /\.test\.js$/.test(relative)) return true;
	if (parts[0] === 'locales' && parts[1] === 'shared') return true;

	return parts.indexOf('locales') > 0;
}

module.exports = {
	LibraryPrivate: LibraryPrivate,
	SystemLibraries: SystemLibraries,
	systemLibraries: systemLibraries,
	fail: fail,
	writeFile: writeFile,
	installed: installed,
	parseIndex: parseIndex,
	readPacks: readPacks,
	packOf: packOf
};
