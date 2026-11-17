import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var data;
var planets;
var baked;

/* A small planet: two levels of heights of 9 samples a side, one of biomes. */
var options = {Radius: 1200, Seed: 'format', Ocean: 0.6};

function bake (settings) {
	return new Promise(function (resolve, reject) {
		data.Bake(options, settings, function (error, made) {
			if (error) reject(error);
			else resolve(made);
		});
	});
}

function open (source) {
	return new Promise(function (resolve, reject) {
		data.Open(source, function (error, made) {
			if (error) reject(error);
			else resolve(made);
		});
	});
}


/* A transport of messages, two ends of one link, as the tests of Network.Transfer have it. */
function Linked () {
	this.Listeners = {};
	this.Peer = null;
}

Linked.prototype.On = function (name, callback) {
	(this.Listeners[name] = this.Listeners[name] || []).push(callback);

	return this;
};

Linked.prototype.Off = function (name, callback) {
	var list = this.Listeners[name] || [];
	var at = list.indexOf(callback);
	if (at !== -1)
		list.splice(at, 1);

	return this;
};

Linked.prototype.Emit = function (name, data) {
	(this.Listeners[name] || []).slice().forEach(function (callback) {
		callback({Type: name.substring(name.indexOf('.') + 1), Data: data});
	});
};

Linked.prototype.Send = function (packet) {
	var peer = this.Peer;

	setTimeout(function () {
		peer.Emit('Protocol.Transfer', packet);
	}, 0);

	return true;
};

Linked.prototype.Writable = function () {
	return true;
};

/* A transport of one request (as XHR): its answer of the server of the test, by the URL the application gave it. */
function Asked (url, method, server) {
	this.Listeners = {};
	this.URL = url;
	this.Method = method;
	this.Server = server;
}

Asked.prototype.On = Linked.prototype.On;
Asked.prototype.Off = Linked.prototype.Off;
Asked.prototype.Emit = Linked.prototype.Emit;

Asked.prototype.Data = function (value) {
	this.Body = value;

	return this;
};

Asked.prototype.Execute = function () {
	var self = this;

	setTimeout(function () {
		var answer = self.Server(self.Method, self.URL, self.Body);

		self.Emit('Transport.Success', answer);
	}, 0);

	return this;
};

describe('Contract: PlanetData, a planet as data: tiles of its layers over a cube', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:PlanetData', 'service:Archive', 'service:ScenePlanet', 'service:SceneBiomes', 'service:SceneTerrainGenerator', 'service:Noise', 'service:Workers', 'service:SceneLocations', 'service:SceneWorld']);

		data = Elemenx.Service('PlanetData');
		planets = Elemenx.Service('ScenePlanet');
		baked = await bake({ID: 'format', Depth: 1, Biomes: 0, Size: 9});
	}, 60000);

	it('places a direction on a face of the cube and back, by equal angles', function () {
		var face;

		for (face = 0; face < 6; face++) {
			[[0.5, 0.5], [0.1, 0.8], [0.97, 0.03]].forEach(function (at) {
				var back = planets.TilePlace(planets.TileDirection(face, at[0], at[1]));

				expect(back[0]).toBe(face);
				expect(back[1]).toBeCloseTo(at[0], 9);
				expect(back[2]).toBeCloseTo(at[1], 9);
			});
		}

		/* The faces as cubeDirection has them: face 0 is +X, 2 is +Y, 5 is -Z. */
		expect(planets.TileDirection(0, 0.5, 0.5)[0]).toBeCloseTo(1, 9);
		expect(planets.TileDirection(2, 0.5, 0.5)[1]).toBeCloseTo(1, 9);
		expect(planets.TileDirection(5, 0.5, 0.5)[2]).toBeCloseTo(-1, 9);
	});

	it('bakes the planet of options into its passport and the tiles of its heights and biomes, level by level', function () {
		var manifest = baked.Manifest;

		expect(manifest.Format).toBe('elemenx-planet');
		expect(manifest.Version).toBe(1);
		expect(manifest.ID).toBe('format');
		expect(manifest.Radius).toBe(1200);
		expect(manifest.Origin.Kind).toBe('generated');
		expect(manifest.Origin.Options.Seed).toBe('format');
		expect(manifest.Layers.Height.Depth).toBe(1);
		expect(manifest.Layers.Biome.Table[0]).toBe('');
		/* Heights: 6 faces of 1 and 4 tiles; biomes, climate and plates: 6 of 1 each. */
		expect(manifest.Tiles.length).toBe(48);
		expect(baked.Tiles['Height/0/1/1-0']).toBeInstanceOf(Int16Array);
		expect(baked.Tiles['Height/0/1/1-0'].length).toBe(81);
		expect(baked.Tiles['Biome/3/0/0-0']).toBeInstanceOf(Uint8Array);
		expect(baked.Tiles['Biome/3/1/0-0']).toBeUndefined();
	});

	it('keeps the heights of the planet at the samples of its tiles, and its edge samples shared by two tiles', function () {
		var planet = planets.Make(options);
		var finest = Math.PI / 2 * 1200 / (2 * 8);
		var tile = baked.Tiles['Height/4/1/0-1'];
		var right = baked.Tiles['Height/4/1/1-1'];
		var j;

		[[0, 0], [3, 5], [8, 8]].forEach(function (at) {
			var direction = planets.TileDirection(4, at[0] / 8 / 2, (1 + at[1] / 8) / 2);

			expect(Math.abs(tile[at[1] * 9 + at[0]] - planet.Elevation(direction, finest))).toBeLessThanOrEqual(0.5);
		});

		for (j = 0; j < 9; j++)
			expect(tile[j * 9 + 8]).toBe(right[j * 9]);
	});

	it('saves a planet to one file and opens it again, the same', async function () {
		var bytes = data.Save(baked);
		var files = Elemenx.Service('Archive').Unzip(bytes);
		var again = await open(new Blob([bytes]));

		expect(files['planet.json']).toBeInstanceOf(Uint8Array);
		expect(Object.keys(files).length).toBe(50);
		expect(again.Manifest).toEqual(baked.Manifest);
		expect(Array.from(again.Tiles['Height/2/1/1-1'])).toEqual(Array.from(baked.Tiles['Height/2/1/1-1']));
		expect(Array.from(again.Tiles['Biome/5/0/0-0'])).toEqual(Array.from(baked.Tiles['Biome/5/0/0-0']));
	});

	it('opens a planet of the network: a folder of its files, or its one file', async function () {
		var bytes = data.Save(baked);
		var files = Elemenx.Service('Archive').Unzip(bytes);
		var fetched = [];
		var real = window.fetch;
		var folder;
		var file;
		var again;
		var first;

		window.fetch = function (url) {
			var path = String(url).replace('https://planets.test/', '');

			fetched.push(path);

			if (path === 'earthlike.planet')
				return Promise.resolve(new Response(bytes));

			return Promise.resolve(files[path.replace('earthlike/', '')] ? new Response(files[path.replace('earthlike/', '')]) : new Response('', {status: 404}));
		};

		await new Promise(function (resolve) {
			data.Remove('format', resolve);
		});

		try {
			folder = await open('https://planets.test/earthlike/');
			file = await open('https://planets.test/earthlike.planet');
			first = fetched.slice();
			fetched.length = 0;
			again = await open('https://planets.test/earthlike/planet.json');
		}
		finally {
			window.fetch = real;
		}

		expect(first).toContain('earthlike/planet.json');
		expect(first).toContain('earthlike/tiles/Height/0/0/0-0.bin');
		/* Kept in the browser once read: the same planet again is its manifest alone from the network. */
		expect(fetched).toEqual(['earthlike/planet.json']);
		expect(Object.keys(again.Tiles).length).toBe(48);
		expect(Object.keys(folder.Tiles).length).toBe(48);
		expect(Object.keys(file.Tiles).length).toBe(48);
		expect(Array.from(folder.Tiles['Height/1/1/0-0'])).toEqual(Array.from(baked.Tiles['Height/1/1/0-0']));

		await expect(open('https://planets.test/none/')).rejects.toThrow();
		await expect(open(new Uint8Array([1, 2, 3]))).rejects.toThrow();
	});

	it('keeps planets in the browser, lists them and lets them go', async function () {
		var kept;
		var list;
		var gone;

		await new Promise(function (resolve) {
			data.Store(baked, resolve);
		});

		kept = await new Promise(function (resolve) {
			data.Stored('format', function (error, found) {
				resolve(found);
			});
		});
		list = await new Promise(function (resolve) {
			data.List(function (error, manifests) {
				resolve(manifests);
			});
		});

		expect(kept.Manifest.ID).toBe('format');
		expect(Array.from(kept.Tiles['Height/0/0/0-0'])).toEqual(Array.from(baked.Tiles['Height/0/0/0-0']));
		expect(list.map(function (manifest) {
			return manifest.ID;
		})).toContain('format');

		await new Promise(function (resolve) {
			data.Remove('format', resolve);
		});

		gone = await new Promise(function (resolve) {
			data.Stored('format', function (error, found) {
				resolve(found);
			});
		});

		expect(gone).toBe(null);
	});

	it('makes a planet of its data: as coarse as its tiles, their heights; finer, its own relief and the edits of it', function () {
		var made;
		var edited;
		var own = planets.Make(options);
		var finest = Math.PI / 2 * 1200 / (2 * 8);
		var raised = Object.assign({}, baked, {Tiles: Object.assign({}, baked.Tiles, {'Edit/1/0/0-0': new Int16Array(81).fill(250)})});
		var direction = planets.TileDirection(1, 0.5 + 2 / 16, 0.5 + 3 / 16);

		planets.UseData('format-test', baked);

		made = planets.Make({Data: 'format-test'});

		expect(made.Radius).toBe(1200);

		/* Finer than its tiles: the relief of the options it was made of, the very same. */
		[[0, 0.3, 0.7], [2, 0.5, 0.5], [5, 0.9, 0.12], [3, 0.25, 0.75]].forEach(function (at) {
			var there = planets.TileDirection(at[0], at[1], at[2]);
			var sample = made.Sample(there);

			expect(made.Elevation(there)).toBe(own.Elevation(there));
			expect(sample.Land).toBe(sample.Elevation > 0);
		});

		/* As coarse as a tile: what it keeps, read between its samples. */
		expect(made.Elevation(direction, finest)).toBe(baked.Tiles['Height/1/1/1-1'][3 * 9 + 2]);
		expect(made.Elevation(planets.TileDirection(1, 0.5 + 2.5 / 16, 0.5 + 3 / 16), finest)).toBeCloseTo((baked.Tiles['Height/1/1/1-1'][3 * 9 + 2] + baked.Tiles['Height/1/1/1-1'][3 * 9 + 3]) / 2, 6);
		expect(made.Biome(planets.TileDirection(2, 0.5, 0.5))).toBe(baked.Manifest.Layers.Biome.Table[baked.Tiles['Biome/2/0/0-0'][4 * 9 + 4]] || own.Biome(planets.TileDirection(2, 0.5, 0.5)));

		/* An edit (a tile of Edit, metres more or less, here the whole face 1): over its own relief where it is, none elsewhere. */
		planets.UseData('format-edited', raised);

		edited = planets.Make({Data: 'format-edited'});

		expect(edited.Elevation(direction)).toBeCloseTo(own.Elevation(direction) + 250, 6);
		expect(edited.Elevation(planets.TileDirection(0, 0.75, 0.75))).toBe(own.Elevation(planets.TileDirection(0, 0.75, 0.75)));
	});

	/* The climate and the plates of a planet as layers of four bytes a sample (rgba8): read of its tiles as coarse as they are. */
	it('bakes its climate and its plates as tiles, and a planet of data reads them, of data alone its plates too', function () {
		var own = planets.Make(options);
		var tile = baked.Tiles['Climate/2/0/0-0'];
		var plates = baked.Tiles['Plate/2/0/0-0'];
		var middle = planets.TileDirection(2, 0.5, 0.5);
		var coarse = Math.PI / 2 * 1200 / 8;
		var alone = {Manifest: Object.assign({}, baked.Manifest, {Origin: {Kind: 'data'}}), Tiles: baked.Tiles};
		var made;
		var sample;
		var truth = own.Sample(middle, coarse);

		expect(baked.Manifest.Layers.Climate.Type).toBe('rgba8');
		expect(tile).toBeInstanceOf(Uint8Array);
		expect(tile.length).toBe(81 * 4);
		expect(plates.length).toBe(81 * 4);
		/* The middle sample of the face: its warmth and its wetness, to a step of the byte. */
		expect(Math.abs(tile[40 * 4] / 255 * 90 - 40 - truth.Celsius)).toBeLessThan(0.2);
		expect(Math.abs(tile[40 * 4 + 1] / 255 - truth.Moisture)).toBeLessThan(0.003);
		expect(plates[40 * 4]).toBe(own.Plate(middle).ID);

		planets.UseData('format-climate', baked);

		made = planets.Make({Data: 'format-climate'});
		sample = made.Sample(middle, coarse);

		/* As coarse as its tile: the climate of the tile; finer: of its options, the very same. */
		expect(Math.abs(sample.Celsius - truth.Celsius)).toBeLessThan(0.2);
		expect(Math.abs(sample.Wind[0] - truth.Wind[0])).toBeLessThan(0.1);
		expect(made.Sample(middle).Celsius).toBe(own.Sample(middle).Celsius);

		/* Of data alone: its plates of its tiles. */
		planets.UseData('format-alone', alone);

		expect(planets.Make({Data: 'format-alone'}).Plate(middle).ID).toBe(own.Plate(middle).ID);
		expect(planets.Make({Data: 'format-alone'}).Plate(middle).Oceanic).toBe(own.Plate(middle).Oceanic);

		/* A tile of four bytes a sample in its file and back. */
		expect(Array.from(data.Tile(data.Bytes('Climate', 2, 0, 0, 0, tile, 'rgba8')).Values)).toEqual(Array.from(tile));
		expect(data.Tile(data.Bytes('Climate', 2, 0, 0, 0, tile, 'rgba8')).Size).toBe(9);
	});

	/* The vectors of a planet: its rivers, settlements and highways, baked and kept in its file, in place of being made at once. */
	it('bakes its rivers, settlements and highways, keeps them in its file, and a planet of data has them', async function () {
		var made = await bake({ID: 'format-vectors', Depth: 0, Biomes: 0, Size: 5, Vectors: true, VectorSize: 32, Towns: 600});
		var again = await open(new Blob([data.Save(made)]));
		var planet;

		expect(made.Manifest.Vectors).toEqual({Rivers: 'vectors/rivers.json', Settlements: 'vectors/settlements.json', Highways: 'vectors/highways.json'});
		expect(Array.isArray(made.Vectors.Rivers)).toBe(true);
		expect(made.Vectors.Settlements.length).toBeGreaterThan(0);
		expect(Array.isArray(made.Vectors.Highways)).toBe(true);
		expect(again.Vectors).toEqual(JSON.parse(JSON.stringify(made.Vectors)));

		planets.UseData('format-vectors', again);

		planet = planets.Make({Data: 'format-vectors'});

		expect(planets.DataVectors('format-vectors')).toEqual({Rivers: 'planet:format-vectors:Rivers', Settlements: 'planet:format-vectors:Settlements', Highways: 'planet:format-vectors:Highways'});
		expect(planet.Options.Settlements).toBe('planet:format-vectors:Settlements');
		expect(planets.TownsFor({Data: 'format-vectors'}).length).toBe(made.Vectors.Settlements.length);
		expect(planet.Towns(made.Vectors.Settlements[0].Point)[0].Far).toBeLessThan(1);
		/* Given ones are its own. */
		expect(planets.Vectored({Data: 'format-vectors', Rivers: false}).Rivers).toBe(false);
	}, 60000);

	/*
	 * What a developer changed of its settlements and rivers (Places, PlanetEditor) survives a bake: its settlements baked
	 * with them, its rivers baked as its ground makes them and the changes kept in the options it was made of, laid over them
	 * again by a planet of the data.
	 */
	it('bakes its settlements with what was changed of them, and keeps the changes of its rivers to lay them again', async function () {
		var added = planets.Direction(12, 34);
		var places = {Towns: [{Op: 'add', Point: added, Kind: 'city', Size: 0.9}], Rivers: [{Op: 'add', Points: [planets.Direction(20, 0), planets.Direction(20, 1)], Flow: 150}]};
		var made = await new Promise(function (resolve, reject) {
			data.Bake(Object.assign({}, options, {Places: places}), {ID: 'format-places', Depth: 0, Biomes: 0, Size: 5, Vectors: true, VectorSize: 32, Towns: 600}, function (error, baked) {
				if (error) reject(error);
				else resolve(baked);
			});
		});
		var town = made.Vectors.Settlements[made.Vectors.Settlements.length - 1];
		var planet;

		expect(made.Manifest.Origin.Options.Places).toEqual(places);
		expect(town.Kind).toBe('city');

		town.Point.forEach(function (value, axis) {
			expect(value).toBeCloseTo(added[axis], 6);
		});

		/* Its rivers as its ground made them: none of them drawn; laid again by the planet of the data, with the one drawn. */
		expect(made.Vectors.Rivers.some(function (river) {
			return river.Drawn;
		})).toBe(false);

		planets.UseData('format-places', made);

		planet = planets.Make({Data: 'format-places'});

		expect(planet.Courses().length).toBeGreaterThanOrEqual(made.Vectors.Rivers.length + 1);
		expect(planet.River(planets.Direction(20, 0.5)).Far).toBeLessThan(1);
	}, 60000);

	/* Step 3 of the format: its file deflated, its samples kept as differences, the tiles that say nothing more left out. */
	it('packs a planet smaller, its tiles as differences, opens either file, and leaves out the tiles its coarser ones tell', async function () {
		var stored = data.Save(baked);
		var packed = await new Promise(function (resolve, reject) {
			data.Pack(baked, function (error, bytes) {
				if (error) reject(error);
				else resolve(bytes);
			});
		});
		var again = await open(packed);
		var tile = baked.Tiles['Height/0/1/1-0'];
		var flat;
		var pruned;

		expect(packed.length).toBeLessThan(stored.length);
		expect(again.Manifest).toEqual(baked.Manifest);
		expect(Array.from(again.Tiles['Height/0/1/1-0'])).toEqual(Array.from(tile));
		expect(Array.from(again.Tiles['Climate/4/0/0-0'])).toEqual(Array.from(baked.Tiles['Climate/4/0/0-0']));
		/* Its samples as differences in its file, back as they were. */
		expect(new DataView(data.Bytes('Height', 0, 1, 1, 0, tile).buffer).getUint8(7)).toBe(1);
		expect(Array.from(data.Tile(data.Bytes('Height', 0, 1, 1, 0, tile)).Values)).toEqual(Array.from(tile));

		/* A flat sea: its four tiles of level 1 on face 3 are its tile of level 0 read there, to a metre. */
		flat = {Manifest: Object.assign({}, baked.Manifest), Tiles: Object.assign({}, baked.Tiles)};
		flat.Tiles['Height/3/0/0-0'] = new Int16Array(81).fill(-3000);

		['0-0', '1-0', '0-1', '1-1'].forEach(function (at) {
			flat.Tiles['Height/3/1/' + at] = new Int16Array(81).fill(-3000);
		});
		flat.Tiles['Height/3/1/1-1'][40] = -2900;

		pruned = data.Prune(flat, {Height: 2});

		expect(pruned).toBe(3);
		expect(flat.Tiles['Height/3/1/0-0']).toBeUndefined();
		expect(flat.Tiles['Height/3/1/1-1']).toBeInstanceOf(Int16Array);
		expect(flat.Tiles['Height/3/0/0-0']).toBeInstanceOf(Int16Array);
	});

	/* A planet of the network read in part: its coarse tiles at once, its finer ones round a point as they are needed. */
	it('opens a planet of the network to some level, its file by ranges of bytes or its folder by files, and reads the rest round a point (Need)', async function () {
		var packed = await new Promise(function (resolve, reject) {
			data.Pack(baked, function (error, bytes) {
				if (error) reject(error);
				else resolve(bytes);
			});
		});
		var files = await new Promise(function (resolve, reject) {
			Elemenx.Service('Archive').Expand(packed, function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});
		var asked = [];
		var real = window.fetch;
		var zip;
		var folder;
		var names;
		var direction = planets.TileDirection(2, 0.3, 0.7);

		window.fetch = function (url, init) {
			var path = String(url).replace('https://planets.test/', '');
			var range = init && init.headers && init.headers.Range;
			var match = /bytes=(\d*)-(\d*)/.exec(range || '');
			var start;
			var end;

			asked.push(path + (range ? ' ' + range : ''));

			if (path === 'terra.planet') {
				if (!match)
					return Promise.resolve(new Response(packed));

				start = match[1] === '' ? packed.length - Number(match[2]) : Number(match[1]);
				end = match[1] === '' || match[2] === '' ? packed.length - 1 : Math.min(packed.length - 1, Number(match[2]));
				start = Math.max(0, start);

				return Promise.resolve(new Response(packed.slice(start, end + 1), {status: 206, headers: {'Content-Range': 'bytes ' + start + '-' + end + '/' + packed.length}}));
			}

			path = path.replace('terra/', '');

			return Promise.resolve(files[path] ? new Response(files[path]) : new Response('', {status: 404}));
		};

		try {
			zip = await new Promise(function (resolve, reject) {
				data.Open('https://planets.test/terra.planet', function (error, made) {
					if (error) reject(error);
					else resolve(made);
				}, {Levels: 0});
			});
			folder = await new Promise(function (resolve, reject) {
				data.Open('https://planets.test/terra/', function (error, made) {
					if (error) reject(error);
					else resolve(made);
				}, {Levels: 0});
			});

			expect(zip.Source.Kind).toBe('zip');
			expect(folder.Source.Kind).toBe('folder');
			expect(zip.Tiles['Height/0/0/0-0']).toBeInstanceOf(Int16Array);
			expect(zip.Tiles['Height/0/1/0-0']).toBeUndefined();
			expect(Object.keys(folder.Tiles).length).toBe(24);
			/* Its file by ranges: its end, its passport, its coarse tiles in one range; no whole file. */
			expect(asked.filter(function (one) {
				return one === 'terra.planet';
			}).length).toBe(0);
			expect(asked.filter(function (one) {
				return one.indexOf('terra.planet bytes=') === 0;
			}).length).toBe(3);

			names = await new Promise(function (resolve, reject) {
				data.Need(zip, direction, 50, 1, function (error, made) {
					if (error) reject(error);
					else resolve(made);
				});
			});

			expect(names).toContain('Height/2/1/0-1');
			expect(Array.from(zip.Tiles['Height/2/1/0-1'])).toEqual(Array.from(baked.Tiles['Height/2/1/0-1']));

			/* Asked again: none comes, what it has is not read twice. */
			expect(await new Promise(function (resolve) {
				data.Need(zip, direction, 50, 1, function (error, made) {
					resolve(made);
				});
			})).toEqual([]);

			names = await new Promise(function (resolve, reject) {
				data.Need(folder, direction, 50, 1, function (error, made) {
					if (error) reject(error);
					else resolve(made);
				});
			});

			expect(names).toContain('Height/2/1/0-1');
			expect(asked).toContain('terra/tiles/Height/2/1/0-1.bin');
		}
		finally {
			window.fetch = real;
		}
	});

	/* Its edits: what was changed of it after it was made, apart from its options, in its file, made again where they changed. */
	it('keeps its edits apart from the options it was made of, applies them, and makes again the tiles an edit changed touches (Retile)', async function () {
		var edit = {Type: 'raise', Points: [[0, 0]], Radius: 300, Amount: 2000};
		var made = await bake({ID: 'format-edits', Depth: 1, Biomes: 0, Size: 9});
		var again;
		var planet;
		var middle = planets.Direction(0, 0);
		var own = planets.Make(options);
		var touched;
		var far;

		expect(made.Manifest.Edits).toBe('edits.json');
		expect(made.Edits).toEqual({Edits: [], Baked: {}, Regions: []});

		made = await new Promise(function (resolve, reject) {
			data.Bake(Object.assign({Edits: [edit]}, options), {ID: 'format-edits', Depth: 1, Biomes: 0, Size: 9}, function (error, result) {
				if (error) reject(error);
				else resolve(result);
			});
		});
		again = await open(new Blob([data.Save(made)]));

		expect(made.Manifest.Origin.Options.Edits).toBeUndefined();
		expect(again.Edits.Edits).toEqual([edit]);

		planets.UseData('format-edits', again);

		planet = planets.Make({Data: 'format-edits'});

		/* Of its data: finer, its relief of its options with its edits; coarse, its tile, sampled with them. */
		expect(planet.Elevation(middle)).toBeCloseTo(own.Elevation(middle) + 2000, 6);
		expect(planet.Options.Edits).toEqual([edit]);

		/* Its edit taken back: the tiles it touched made again, the others as they were. */
		far = Array.from(again.Tiles['Height/5/1/0-0']);
		touched = await new Promise(function (resolve, reject) {
			data.Retile(again, [], function (error, names) {
				if (error) reject(error);
				else resolve(names);
			});
		});

		expect(touched.length).toBeGreaterThan(0);
		expect(touched).toContain('Height/0/0/0-0');
		expect(touched).not.toContain('Height/5/1/0-0');
		expect(Array.from(again.Tiles['Height/5/1/0-0'])).toEqual(far);
		expect(Array.from(again.Tiles['Height/0/0/0-0'])).toEqual(Array.from(baked.Tiles['Height/0/0/0-0']));
		expect(again.Edits.Edits).toEqual([]);
	}, 60000);

	/* A planet in a store of parts: of the application (its own names of them), or of the browser; what changed alone written. */
	it('writes a planet to a store by its parts and reads it back in part, its objects as asked for, then only what changed', async function () {
		var kept = {};
		var asked = [];
		var written = [];
		/* A store of the application: its own names of the parts (here a URL of an API), no path of a file in it. */
		var store = {
			Read: function (part, callback) {
				var url = '/api/worlds/7/' + data.Key(part);

				asked.push(url);

				setTimeout(function () {
					callback(null, kept[url] || null);
				}, 0);
			},
			Write: function (part, bytes, callback) {
				var url = '/api/worlds/7/' + data.Key(part);

				written.push(url);

				kept[url] = bytes;

				setTimeout(function () {
					callback(null);
				}, 0);
			}
		};
		var write = function (one, target, whole) {
			return new Promise(function (resolve, reject) {
				data.Write(one, target, function (error, count) {
					if (error) reject(error);
					else resolve(count);
				}, whole);
			});
		};
		var source = Object.assign({}, baked, {Objects: {}});
		var again;
		var document = {Version: 1, Name: 'harbour', Scene: {Added: [{ID: 'crane', Kind: 'thing'}]}};
		var found;
		var browser = data.Browser('format-parts');
		var local;

		data.SetObjects(source, '4:1:2:3', document);

		expect(await write(source, store, true)).toBe(source.Manifest.Tiles.length + 3);
		expect(written).toContain('/api/worlds/7/objects:4:1:2:3');
		expect(written).toContain('/api/worlds/7/tile:Height/0/1/1-0');

		again = await new Promise(function (resolve, reject) {
			data.Open(store, function (error, made) {
				if (error) reject(error);
				else resolve(made);
			}, {Levels: 0});
		});

		expect(again.Manifest.Objects).toEqual(['4:1:2:3']);
		expect(again.Tiles['Height/0/1/1-0']).toBeUndefined();
		expect(Array.from(again.Tiles['Height/0/0/0-0'])).toEqual(Array.from(baked.Tiles['Height/0/0/0-0']));
		/* Its objects not read till asked for. */
		expect(asked).not.toContain('/api/worlds/7/objects:4:1:2:3');

		found = await new Promise(function (resolve, reject) {
			data.Objects(again, '4:1:2:3', function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		expect(found).toEqual(document);

		/* A location edited: its part and the passport alone are written. */
		written.length = 0;

		data.SetObjects(again, '4:1:2:3', Object.assign({}, document, {Name: 'port'}));

		expect(await write(again, store)).toBe(2);
		expect(written.sort()).toEqual(['/api/worlds/7/manifest', '/api/worlds/7/objects:4:1:2:3']);

		/* The store of the browser: the same planet, part by part. */
		await write(source, browser, true);

		local = await new Promise(function (resolve, reject) {
			data.Open(browser, function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		expect(Object.keys(local.Tiles).length).toBe(baked.Manifest.Tiles.length);
		expect(await new Promise(function (resolve) {
			data.Objects(local, '4:1:2:3', function (error, made) {
				resolve(made);
			});
		})).toEqual(document);
	});

	/* A store of the network: its parts by Network.Transfer, which part a request is for the application's alone. */
	it('reads and writes a planet over Network.Transfer: a request a part at the URLs of the application, or messages of a link with news of the other side', async function () {
		var files = {};
		var server = function (method, url, body) {
			if (method === 'PUT') {
				files[url] = new Uint8Array(body);

				return {Status: 204};
			}

			return files[url] ? {Status: 200, Response: files[url].buffer.slice(files[url].byteOffset, files[url].byteOffset + files[url].byteLength)} : {Status: 404};
		};
		/* The URL of a part: the application's own (a REST path here). */
		var rest = data.Remote({Transport: function (part, action) {
			var url = '/api/planets/format/' + part.Kind + (part.Kind === 'tile' ? '/' + part.Layer + '/' + part.Face + '/' + part.Level + '/' + part.X + '/' + part.Y : part.ID || part.Name ? '/' + (part.ID || part.Name) : '');

			return new Asked(url, action === 'Write' ? 'PUT' : 'GET', server);
		}});
		var call = function (method, args) {
			return new Promise(function (resolve, reject) {
				data[method].apply(data, args.concat([function (error, made) {
					if (error) reject(error);
					else resolve(made);
				}]));
			});
		};
		var source = Object.assign({}, baked, {Objects: {}});
		var again;
		var client = new Linked();
		var other = new Linked();
		var kept = {};
		var serverReceiver;
		var linked;
		var news = [];
		var stop;
		var remote;

		await call('Write', [source, rest]);

		expect(Object.keys(files)).toContain('/api/planets/format/tile/Height/0/1/1/0');
		expect(Object.keys(files)).toContain('/api/planets/format/manifest');

		again = await call('Open', [rest]);

		expect(Array.from(again.Tiles['Height/0/1/1-0'])).toEqual(Array.from(baked.Tiles['Height/0/1/1-0']));
		expect(await call('Objects', [again, 'none'])).toBe(null);

		/* A link: the other side answers each message to its ID, and tells of a part changed there. */
		client.Peer = other;
		other.Peer = client;
		serverReceiver = Elemenx.Network.TransferReceiver({Transport: other});

		serverReceiver.On('Transfer.Receive', function (event) {
			var head = event.Data.Data.Planet;
			var key = data.Key(head.Part);
			var answer = function (bytes) {
				Elemenx.Network.Transfer({Transport: other, Data: bytes ? {Planet: {Action: 'Result', ID: head.ID}, Bytes: bytes} : {Planet: {Action: 'Result', ID: head.ID}}}).Send();
			};

			if (head.Action === 'Write') {
				event.Data.Data.Bytes.arrayBuffer().then(function (buffer) {
					kept[key] = new Uint8Array(buffer);

					answer(null);
				});

				return;
			}

			answer(kept[key] || null);
		});

		remote = data.Remote({Transport: client});

		/* Written whole again: what it holds now is all to write. */
		delete source.Dirty;

		await call('Write', [source, remote]);

		expect(Object.keys(kept)).toContain('tile:Height/0/1/1-0');

		linked = await call('Open', [remote]);

		expect(Array.from(linked.Tiles['Height/5/1/1-1'])).toEqual(Array.from(baked.Tiles['Height/5/1/1-1']));

		stop = remote.Watch(function (part) {
			news.push(data.Key(part));
		});

		Elemenx.Network.Transfer({Transport: other, Data: {Planet: {Action: 'Changed', Part: {Kind: 'objects', ID: '4:1:2:3'}}}}).Send();

		await waitFor(function () {
			return news.length;
		}, 3000);

		expect(news).toEqual(['objects:4:1:2:3']);

		stop();
	});
});
