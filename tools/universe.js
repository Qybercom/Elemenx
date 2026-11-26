'use strict';

/*
 * A universe of Elemenx in Node (docs/UNIVERSE-FORMAT.md): its services and resources loaded as a page has them (Load), a
 * region of it written to files (Bake: elemenx universe bake), and the same files made as they are asked for (Serve:
 * elemenx universe serve). The layout of both (paths of a base):
 * - universe.json: its passport; edits.json: its edits.
 * - cubes/<x>.<y>.<z>.json: the galaxies of a cube ({Key, Count, Galaxies}, UniverseData.Cube).
 * - galaxies/<id>.json: the passport of a galaxy (GalaxyData.Make of its seed and kind at its place).
 * - galaxies/<id>/sky.json: the galaxies seen from it (UniverseData.Sky).
 * - galaxies/<id>/sectors/<x>.<y>.<z>.json: the stars of a sector of it (GalaxyData.Sector; ?limit= served).
 * - index.json (baked): what was written, {Universe, Cubes: [keys], Galaxies: [IDs]}.
 * What a seed makes is the same in every one of them: a client may make any part itself (UniverseData) or read it here.
 */

var fs = require('fs');
var path = require('path');
var http = require('http');

var root = path.join(__dirname, '..');
var loaded = null;

/* The Elemenx of a universe in Node: the framework, the services of its numbers, the graphs and data of the libraries. */
function load () {
	var Elemenx;

	if (loaded)
		return loaded;

	delete globalThis.localStorage;
	delete globalThis.sessionStorage;

	require(path.join(root, 'elemenx.js'));

	Elemenx = globalThis.Elemenx;

	[['ElemenxCommon', 'resources', 'Data'], ['ElemenxGraphics', 'resources', 'Data'], ['ElemenxGraphics', 'blueprints', 'Blueprints']].forEach(function (set) {
		var base = path.join(root, 'libraries', set[0], set[1]);

		(function walk (dir) {
			fs.readdirSync(dir, {withFileTypes: true}).forEach(function (entry) {
				var file = path.join(dir, entry.name);

				if (entry.isDirectory()) walk(file);
				else if (/\.json$/.test(entry.name)) Elemenx.Resources(set[2], set[0] + '/' + path.relative(base, file).replace(/\\/g, '/').replace(/\.json$/, ''), JSON.parse(fs.readFileSync(file, 'utf8')));
			});
		})(base);
	});

	['ElemenxCommon/services/Math/Math.js', 'ElemenxCommon/services/Seeded/Seeded.js', 'ElemenxCommon/services/Random/Random.js', 'ElemenxCommon/services/Noise/Noise.js', 'ElemenxCommon/services/Blueprints/Blueprints.js', 'ElemenxCommon/services/Astronomy/Astronomy.js', 'ElemenxCommon/services/Archive/Archive.js', 'ElemenxGraphics/services/Renderer/Renderer.js', 'ElemenxGraphics/services/BlueprintShaders/BlueprintShaders.js', 'ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.js', 'ElemenxGraphics/services/PlanetData/PlanetData.js', 'ElemenxGraphics/services/SystemData/SystemData.js', 'ElemenxGraphics/services/GalaxyData/GalaxyData.js', 'ElemenxGraphics/services/UniverseData/UniverseData.js'].forEach(function (file) {
		require(path.join(root, 'libraries', file));
	});

	loaded = Elemenx;

	return Elemenx;
}

/* A universe of a file (its passport, or options of UniverseData.Make) or of a seed. */
function universeOf (source) {
	var Elemenx = load();
	var universes = Elemenx.Service('UniverseData');
	var given;

	if (source && typeof source === 'object') given = source;
	else if (source && fs.existsSync(String(source))) given = JSON.parse(fs.readFileSync(String(source), 'utf8'));
	else if (source && /^\s*\{/.test(String(source))) given = JSON.parse(String(source));
	else given = {Seed: String(source || 'universe')};

	if (given.Manifest && given.Manifest.Format === 'elemenx-universe')
		return {Manifest: given.Manifest, Edits: given.Edits || {Overrides: {}, Removed: [], Added: []}, Galaxies: {}};

	return universes.Make(given);
}

function key (cube) {
	return cube[0] + '.' + cube[1] + '.' + cube[2];
}

/*
 * What a path of the layout holds (as text of JSON), made of the universe; null for none. Each galaxy made once (kept by
 * UniverseData with the universe).
 */
function answer (data, address) {
	var Elemenx = load();
	var universes = Elemenx.Service('UniverseData');
	var galaxies = Elemenx.Service('GalaxyData');
	var url = String(address).split('?');
	var parts = url[0].replace(/^\/+/, '').split('/').map(decodeURIComponent);
	var query = {};
	var match;
	var galaxy;

	(url[1] || '').split('&').forEach(function (pair) {
		var at = pair.split('=');
		if (at[0])
			query[decodeURIComponent(at[0])] = decodeURIComponent(at[1] || '');
	});

	function cube (text) {
		var at = /^(-?\d+)\.(-?\d+)\.(-?\d+)\.json$/.exec(text);

		return at ? [Number(at[1]), Number(at[2]), Number(at[3])] : null;
	}

	if (parts.length === 1 && parts[0] === 'universe.json') return data.Manifest;
	if (parts.length === 1 && parts[0] === 'edits.json') return data.Edits;

	if (parts.length === 2 && parts[0] === 'cubes' && cube(parts[1])) {
		match = cube(parts[1]);

		return universes.Cube(data, match[0], match[1], match[2]);
	}

	if (parts[0] !== 'galaxies' || parts.length < 2) return null;

	if (parts.length === 2 && /\.json$/.test(parts[1])) {
		galaxy = universes.Galaxy(data, parts[1].replace(/\.json$/, ''));

		return galaxy ? galaxy.Manifest : null;
	}

	galaxy = universes.Galaxy(data, parts[1]);

	if (!galaxy)
		return null;

	if (parts.length === 3 && parts[2] === 'sky.json') return universes.Sky(data, parts[1]);

	if (parts.length === 4 && parts[2] === 'sectors' && cube(parts[3])) {
		match = cube(parts[3]);

		return galaxies.Sector(galaxy, match[0], match[1], match[2], query.limit === undefined ? undefined : Number(query.limit));
	}

	return null;
}

function write (out, name, value) {
	var file = path.join(out, name);

	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, JSON.stringify(value));
}

/*
 * A region of a universe written to a folder: its passport and edits, its cubes within Radius Mpc of Around ([x, y, z];
 * its home galaxy by default), the passports and skies of its galaxies of the author and of the home one. options {Radius
 * (Mpc, 20), Around, Progress(done, total)}.
 */
function bake (source, out, options) {
	var Elemenx = load();
	var universes = Elemenx.Service('UniverseData');
	var settings = options || {};
	var data = universeOf(source);
	var home = universes.Home(data);
	var around = settings.Around || (home ? home.Place : [0, 0, 0]);
	var radius = Number(settings.Radius) || 20;
	var size = data.Manifest.Cube;
	var low = universes.CubeOf(data, [around[0] - radius, around[1] - radius, around[2] - radius]);
	var high = universes.CubeOf(data, [around[0] + radius, around[1] + radius, around[2] + radius]);
	var cubes = [];
	var ids = {};
	var x;
	var y;
	var z;

	for (x = low[0]; x <= high[0]; x++) {
		for (y = low[1]; y <= high[1]; y++) {
			for (z = low[2]; z <= high[2]; z++) {
				if (universes.CubeDistance(around, [x * size, y * size, z * size], size) <= radius)
					cubes.push([x, y, z]);
			}
		}
	}

	write(out, 'universe.json', data.Manifest);
	write(out, 'edits.json', data.Edits);

	cubes.forEach(function (cube, index) {
		write(out, 'cubes/' + key(cube) + '.json', answer(data, 'cubes/' + key(cube) + '.json'));

		if (settings.Progress)
			settings.Progress(index + 1, cubes.length);
	});

	universes.Authored(data).concat(home ? [home] : []).forEach(function (one) {
		ids[one.ID] = true;
	});

	Object.keys(ids).forEach(function (id) {
		write(out, 'galaxies/' + encodeURIComponent(id) + '.json', answer(data, 'galaxies/' + encodeURIComponent(id) + '.json'));
		write(out, 'galaxies/' + encodeURIComponent(id) + '/sky.json', answer(data, 'galaxies/' + encodeURIComponent(id) + '/sky.json'));
	});

	write(out, 'index.json', {Universe: data.Manifest.ID, Around: around, Radius: radius, Cubes: cubes.map(key), Galaxies: Object.keys(ids)});

	return {Cubes: cubes.length, Galaxies: Object.keys(ids).length};
}

/*
 * The same layout made as it is asked for, by a server of its own (options {Port (4180), Host (127.0.0.1), Base (the path
 * it is served under, '/')}); callback(error, server) once it listens. Answers in JSON, kept a day by caches (what a seed
 * makes does not change), with CORS open: a page of another origin reads it.
 */
function serve (source, options, callback) {
	var settings = options || {};
	var data = universeOf(source);
	var base = '/' + String(settings.Base || '/').replace(/^\/+|\/+$/g, '');
	var server = http.createServer(function (request, response) {
		var address = String(request.url || '/');
		var made;

		if (base !== '/' && address.indexOf(base + '/') !== 0) {
			response.writeHead(404, {'Access-Control-Allow-Origin': '*'});
			response.end();

			return;
		}

		try {
			made = answer(data, base === '/' ? address : address.slice(base.length));
		}
		catch (error) {
			response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*'});
			response.end(String(error && error.message || error));

			return;
		}

		if (made === null || made === undefined) {
			response.writeHead(404, {'Access-Control-Allow-Origin': '*'});
			response.end();

			return;
		}

		response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*'});
		response.end(JSON.stringify(made));
	});

	server.on('error', function (error) {
		if (callback)
			callback(error);
	});

	server.listen(Number(settings.Port === undefined ? 4180 : settings.Port), settings.Host || '127.0.0.1', function () {
		if (callback)
			callback(null, server);
	});

	return server;
}

module.exports = {
	Load: load,
	Universe: universeOf,
	Answer: answer,
	Bake: bake,
	Serve: serve
};
