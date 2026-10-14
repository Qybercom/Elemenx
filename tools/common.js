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

module.exports = {
	fail: fail,
	parseIndex: parseIndex,
	readPacks: readPacks,
	packOf: packOf
};
