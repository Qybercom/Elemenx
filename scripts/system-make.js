'use strict';

/*
 * A star system written as JSON ({ID, Name, Seed or Objects (a tree with Children), Bodies: {id: {URL, Levels}}}) made a
 * file of the system format (SystemData, docs/SPACE-FORMAT.md), in Node:
 *   node scripts/system-make.js <system.json> <out.system>
 */

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var args = process.argv.slice(2);
var given;
var data;
var bytes;

if (args.length < 2) {
	console.error('Usage: node scripts/system-make.js <system.json> <out.system>');
	process.exit(1);
}

given = JSON.parse(fs.readFileSync(args[0], 'utf8'));

delete globalThis.localStorage;
delete globalThis.sessionStorage;

require(path.join(root, 'elemenx.js'));

['ElemenxCommon/services/Math/Math.js', 'ElemenxCommon/services/Random/Random.js', 'ElemenxCommon/services/Astronomy/Astronomy.js', 'ElemenxCommon/services/Archive/Archive.js', 'ElemenxGraphics/services/PlanetData/PlanetData.js', 'ElemenxGraphics/services/SystemData/SystemData.js'].forEach(function (file) {
	require(path.join(root, 'libraries', file));
});

data = Elemenx.Service('SystemData').Make(given.Objects ? {Objects: given.Objects} : {Seed: given.Seed}, {ID: given.ID, Name: given.Name});
data.Manifest.Bodies = given.Bodies || {};
bytes = Elemenx.Service('SystemData').Save(data);

fs.mkdirSync(path.dirname(path.resolve(args[1])), {recursive: true});
fs.writeFileSync(args[1], Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));

console.log(args[1] + ': ' + Elemenx.Service('SystemData').Objects(data, given.ID).length + ' objects, ' + bytes.length + ' bytes');
