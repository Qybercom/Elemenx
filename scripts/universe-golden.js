'use strict';

/*
 * The golden numbers of the universe (docs/UNIVERSE-FORMAT.md): what a seed makes, as this code makes it in Node, for a
 * port in another language (PHP, C++) to be checked against, and for tests/regression/universe-golden.test.js to check
 * the browser against. node scripts/universe-golden.js [out.json] (docs/universe-golden.json by default) writes them.
 * Every number is kept as JSON writes it (the shortest text read back to the very same double).
 */

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var out = process.argv[2] || path.join(root, 'docs/universe-golden.json');
var Elemenx = require(path.join(root, 'tools/universe.js')).Load();

module.exports = require(path.join(root, 'tests/regression/universe-golden.js'));

if (require.main === module) {
	fs.writeFileSync(out, JSON.stringify(module.exports(Elemenx), null, '\t') + '\n');
	console.log(out);
}
