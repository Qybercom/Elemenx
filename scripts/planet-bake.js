'use strict';

/*
 * A planet of ScenePlanet options baked into the planet format (PlanetData, docs/PLANET-FORMAT.md) and written as its
 * one file, in Node:
 *   node scripts/planet-bake.js <options: a JSON file or JSON> <out.planet> [--id name] [--name text] [--depth 3]
 *     [--size 65] [--biomes 2] [--climate 2] [--plates 2] [--vectors true] [--towns 20000]
 * Its rivers, settlements and highways are baked too (its vectors), unless --vectors false.
 */

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var args = process.argv.slice(2);
var named = {};
var plain = [];
var options;
var started = Date.now();

args.forEach(function (arg, index) {
	if (arg.indexOf('--') === 0)
		named[arg.slice(2)] = args[index + 1];
	else if (index === 0 || args[index - 1].indexOf('--') !== 0)
		plain.push(arg);
});

if (plain.length < 2) {
	console.error('Usage: node scripts/planet-bake.js <options.json | JSON> <out.planet> [--id name] [--name text] [--depth 3] [--size 65] [--biomes 2] [--climate 2] [--plates 2] [--vectors true] [--towns 20000]');
	process.exit(1);
}

options = JSON.parse(fs.existsSync(plain[0]) ? fs.readFileSync(plain[0], 'utf8') : plain[0]);

delete globalThis.localStorage;
delete globalThis.sessionStorage;

require(path.join(root, 'elemenx.js'));

/* The lands of the library (resources/biomes), as a page has them: their climates place them on the planet. */
fs.readdirSync(path.join(root, 'libraries/ElemenxGraphics/resources/biomes')).forEach(function (file) {
	if (/\.json$/.test(file))
		Elemenx.Resources('Data', 'ElemenxGraphics/biomes/' + file.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(root, 'libraries/ElemenxGraphics/resources/biomes', file), 'utf8')));
});

['ElemenxCommon/services/Math/Math.js', 'ElemenxCommon/services/Seeded/Seeded.js', 'ElemenxCommon/services/Random/Random.js', 'ElemenxCommon/services/Noise/Noise.js', 'ElemenxCommon/services/Workers/Workers.js', 'ElemenxCommon/services/Blueprints/Blueprints.js', 'ElemenxCommon/services/Archive/Archive.js', 'ElemenxGraphics/services/SceneBiomes/SceneBiomes.js', 'ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.js', 'ElemenxGraphics/services/SceneFlora/SceneFlora.js', 'ElemenxGraphics/services/ScenePlanet/ScenePlanet.js', 'ElemenxGraphics/services/PlanetData/PlanetData.js'].forEach(function (file) {
	require(path.join(root, 'libraries', file));
});

Elemenx.Service('PlanetData').Bake(options, {
	ID: named.id,
	Name: named.name,
	Depth: named.depth === undefined ? 3 : Number(named.depth),
	Size: named.size === undefined ? 65 : Number(named.size),
	Biomes: named.biomes === undefined ? 2 : Number(named.biomes),
	Climate: named.climate === undefined ? undefined : Number(named.climate),
	Plates: named.plates === undefined ? undefined : Number(named.plates),
	Vectors: named.vectors !== 'false',
	Towns: named.towns === undefined ? undefined : Number(named.towns),
	Progress: function (done, total) {
		if (done % 50 === 0 || done === total)
			process.stdout.write('\r' + done + ' / ' + total + ' works');
	}
}, function (error, data) {
	process.stdout.write('\n');

	if (error) {
		console.error(String(error && error.message || error));
		process.exit(1);
	}

	/* Its file deflated (PlanetData.Pack), its tiles left out where their coarser ones tell them (Tolerance of Bake). */
	Elemenx.Service('PlanetData').Pack(data, function (failed, bytes) {
		if (failed) {
			console.error(String(failed && failed.message || failed));
			process.exit(1);
		}

		written(data, bytes);
	});
});

/* The file of the planet written, and what it holds told. */
function written (data, bytes) {
	fs.mkdirSync(path.dirname(path.resolve(plain[1])), {recursive: true});
	fs.writeFileSync(plain[1], Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));

	console.log(plain[1] + ': ' + data.Manifest.Tiles.length + ' tiles, ' + Object.keys(data.Vectors || {}).map(function (name) {
		return data.Vectors[name].length + ' ' + name.toLowerCase();
	}).join(', ') + ', ' + (bytes.length / 1048576).toFixed(1) + ' MB, ' + ((Date.now() - started) / 1000).toFixed(0) + ' s');
}
