'use strict';

var fs = require('fs');

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

module.exports = {
	fail: fail,
	parseIndex: parseIndex
};
