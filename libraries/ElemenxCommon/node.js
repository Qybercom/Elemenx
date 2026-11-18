/*
 * ElemenxCommon in Node (a server, a script, a build, a test): the framework and every Service of the Library, which
 * need no page. require('@qybercom/elemenx/libraries/ElemenxCommon/node.js') returns Elemenx, and the Services are
 * there at once: Elemenx.Service('Random').Create(7).Next(). The Components and the Directives of the Library are of a
 * page and stay out. A framework already loaded (the global Elemenx) is kept.
 */
var fs = require('fs');
var path = require('path');

if (typeof Elemenx === 'undefined')
	require('../../elemenx.js');

/* The files of the Library as its index.js lists them: its resources first (the kinds of planets of Astronomy), then its Services in their order. */
var files = new Function('return ' + fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8').replace(/;\s*$/, ''))();

files.filter(function (file) {
	return /^resources\/.+\.json$/.test(file);
}).forEach(function (file) {
	Elemenx.Resources('Data', 'ElemenxCommon/' + file.substring('resources/'.length).replace(/\.json$/, ''), fs.readFileSync(path.join(__dirname, file), 'utf8'));
});

files.filter(function (file) {
	return /^services\//.test(file);
}).forEach(function (file) {
	require(path.join(__dirname, file));
});

module.exports = Elemenx;
