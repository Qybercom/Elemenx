import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var locations;
var planets;

describe('Contract: SceneLocations, the locations of a planet: cells of its surface, their neighbours and passages', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneLocations', 'service:ScenePlanet', 'service:SceneWorld', 'service:SceneTerrainGenerator', 'service:SceneBiomes', 'service:SceneSower', 'service:SceneRoads', 'service:Workers']);

		locations = Elemenx.Service('SceneLocations');
		planets = Elemenx.Service('ScenePlanet');
	});

	it('finds the location of a point, its place, its sides and its World: the ground of the planet there', function () {
		var planet = {Seed: 'map', Radius: 6371, LocationSize: 4, Ocean: 0.5};
		var id = locations.At(planet, 12.3, 45.6);
		var location = locations.Location(planet, id);
		var made = Elemenx.Service('SceneWorld').Make(location.World);
		var field = Elemenx.Service('SceneTerrainGenerator').Flat(made.Ground);
		var sample = planets.Planet(Object.assign({BiomeList: made.Ground.Planet.Options.BiomeList}, planet)).Sample(planets.Direction(location.Place.Latitude, location.Place.Longitude));

		expect(location.ID).toBe(id);
		expect(location.Kind).toBe('generated');
		expect(location.Told).toBe(false);
		expect(location.Sides.length).toBe(4);
		expect(location.Beyond).toBe('far');
		expect(made.Ground.Size).toBe(locations.Extent(location.Place));
		expect(made.Ground.Size).toBeGreaterThan(location.Place.Size + 400);
		expect(field.Height(0, 0)).toBeCloseTo(sample.Elevation, 6);

		/* The point is in it: the location of its middle is itself. */
		expect(locations.At(planet, location.Place.Latitude, location.Place.Longitude)).toBe(id);
	});

	it('tells locations, the sides still open beside them, and passages that lead both ways', function () {
		var planet = {Seed: 'map', LocationSize: 4};
		var id = locations.At(planet, -20, 100);
		var told = locations.Tell(planet, id, {Kind: 'model', Model: 'places/fort.glb', Beyond: 'wall'});
		var location = locations.Location(told, id);
		var east = location.Sides[0].To;
		var linked;
		var other;

		expect(planet.Locations).toBeUndefined();
		expect(location).toMatchObject({Kind: 'model', Model: 'places/fort.glb', Beyond: 'wall', Told: true});
		expect(locations.Open(told, id).length).toBe(4);

		linked = locations.Passage(locations.Tell(told, east, {}), id, {Side: 0, At: 0.3, Kind: 'road', Width: 8});
		other = locations.Location(linked, east);

		expect(locations.Open(linked, id).map(function (side) {
			return side.Side;
		})).toEqual([1, 2, 3]);
		expect(locations.Location(linked, id).Sides[0].Passages).toEqual([{Side: 0, At: 0.3, Kind: 'road', Width: 8, Mode: 'seamless', To: east}]);
		expect(other.Passages.length).toBe(1);
		expect(other.Passages[0]).toMatchObject({To: id, Kind: 'road', Width: 8, Mode: 'seamless'});
		expect(other.Passages[0].At).toBeCloseTo(0.7, 9);
		expect(other.Sides[other.Passages[0].Side].To).toBe(id);

		expect(locations.Forget(linked, east).Locations[east]).toBeUndefined();
	});

	it('lays its locations out in hexagons too: six sides, passages on them both ways', function () {
		var planet = {Seed: 'map', LocationSize: 4, Grid: 'hex'};
		var id = locations.At(planet, 30, -40);
		var location = locations.Location(planet, id);
		var other;
		var linked;

		expect(id.charAt(0)).toBe('h');
		expect(location.Sides.length).toBe(6);
		expect(location.Place.Points.length).toBe(6);
		expect(locations.At(planet, location.Place.Latitude, location.Place.Longitude)).toBe(id);

		linked = locations.Passage(planet, id, {Side: 4, At: 0.25, Kind: 'gate', Width: 6});
		other = locations.Location(linked, location.Sides[4].To);

		expect(other.Passages[0]).toMatchObject({To: id, Kind: 'gate'});
		expect(other.Passages[0].At).toBeCloseTo(0.75, 9);
		expect(other.Sides[other.Passages[0].Side].To).toBe(id);
	});

	it('makes what is past its outline: a cliff falls, a passage keeps its way open with a road to the middle, a wall stands with a gate, a side with a location beside and no passage stays open', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var worlds = Elemenx.Service('SceneWorld');
		var planet = {Seed: 'border', LocationSize: 4, Ocean: 0.2};
		var id = locations.At(planet, 20, 10);
		var plain = locations.Location(planet, id);
		var cliff = locations.Passage(locations.Tell(planet, id, {Beyond: 'cliff'}), id, {Side: 0, At: 0.5, Kind: 'road', Width: 8});
		var location = locations.Location(cliff, id);
		var side = location.Place.Sides[0];
		var middle = [(side[0] + side[2]) / 2, (side[1] + side[3]) / 2];
		var other = location.Place.Sides[2];
		var far = [(other[0] + other[2]) / 2 * 1.04, (other[1] + other[3]) / 2 * 1.04];
		var base = terrain.Flat(worlds.Make(plain.World).Ground);
		var made = worlds.Make(location.World).Ground;
		var field = terrain.Flat(made);
		var roads = made.Sketch.Layers[0].Items;
		var walled;
		var wall;

		/* Past the side with no passage it falls; inside it is the planet as it is; the passage keeps its way. */
		expect(field.Height(far[0], far[1])).toBeLessThan(base.Height(far[0], far[1]) - 200);
		expect(field.Height(0, 0)).toBeCloseTo(base.Height(0, 0), 3);
		expect(field.Border.Distance(far[0], far[1])).toBeGreaterThan(0);
		expect(field.Border.Gap(middle[0] * 1.03, middle[1] * 1.03)).toBe(1);
		expect(roads.length).toBe(1);
		expect(roads[0]).toMatchObject({Type: 'road', Width: 8});
		expect(roads[0].Points[3]).toEqual([0, 0]);

		/* Regression: the workers of the ground and of what grows on it had no Border, and made no ground of such a location. */
		for (var pool of [terrain.Work(), Elemenx.Service('SceneSower').Work(), Elemenx.Service('SceneRoads').Work()]) {
			var piece = await new Promise(function (done, failed) {
				pool.Run('SceneTerrainGenerator', 'Piece', ['Flat', made, null, [far[0], far[1], 64, 8]], function (error, result) {
					if (error) failed(error);
					else done(result);
				});
			});

			expect(Array.from(piece.Positions)).toEqual(Array.from(new Float32Array(field.Chunk(far[0], far[1], 64, 8).Positions)));
		}

		/* A wall with a gate in it; told the neighbour, that side has no wall and nothing falls past it. */
		walled = locations.Passage(locations.Tell(planet, id, {Beyond: 'wall'}), id, {Side: 1, At: 0.5, Kind: 'gate', Width: 6});
		walled = locations.Tell(walled, locations.Location(walled, id).Sides[3].To, {});
		wall = worlds.Make(locations.Location(walled, id).World).Ground.Sketch.Layers[0].Items.filter(function (item) {
			return item.Type === 'citywall';
		});

		expect(wall.map(function (item) {
			return item.ID;
		})).toEqual(['border-wall-0', 'border-wall-1', 'border-wall-2']);
		expect(wall[0].Gates).toEqual([]);
		expect(wall[1].Gates[0]).toMatchObject({Model: 'gate', Radius: 6});
	});

	it('bakes an edited location into the planet: its globe and its surface show the edit, the location beside and its own ground are as they were', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var worlds = Elemenx.Service('SceneWorld');
		var planet = {Seed: 'bake', LocationSize: 4, Ocean: 0.2, Radius: 6371};
		var id = locations.At(planet, 20, 10);
		var plain = locations.Location(planet, id);
		var place = plain.Place;
		var options = Object.assign({}, planet);
		var edited;
		var baked;
		var middle = planets.Direction(place.Latitude, place.Longitude);
		var far = planets.Direction(place.Latitude + 0.2, place.Longitude);
		var before = planets.Make(planet);
		var after;
		var field;

		/* A mountain of 900 metres drawn in its middle. */
		edited = locations.Tell(planet, id, {World: worlds.Library({Size: locations.Extent(place), Planet: {Options: options, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn}, Sketch: {Layers: [{ID: 'edit', Items: [{ID: 'peak', Type: 'mountain', At: [0, 0], Radius: 600, Height: 900}]}]}})});
		field = terrain.Flat(worlds.Make(locations.Location(edited, id).World).Ground);
		baked = locations.Bake(edited, id, 65);
		after = planets.Make(baked);

		expect(baked.Baked[id]).toMatchObject({Side: 65, Size: locations.Extent(place)});
		expect(after.Elevation(middle)).toBeCloseTo(field.Height(0, 0), 0);
		expect(after.Elevation(middle)).toBeGreaterThan(before.Elevation(middle) + 600);
		expect(after.Elevation(far)).toBe(before.Elevation(far));
		expect(planets.Sphere(Object.assign({}, baked)).Elevation(middle) * 1000).toBeCloseTo(field.Height(0, 0), 0);

		/* The location beside and the ground of the location itself are made of the planet as it is, not of what was baked. */
		expect(terrain.Flat(worlds.Make(locations.Location(baked, plain.Sides[0].To).World).Ground).Height(0, 0)).toBe(terrain.Flat(worlds.Make(locations.Location(planet, plain.Sides[0].To).World).Ground).Height(0, 0));
		expect(terrain.Flat(worlds.Make(locations.Location(baked, id).World).Ground).Height(0, 0)).toBe(field.Height(0, 0));
		expect(locations.Forget(baked, id).Baked[id]).toBeUndefined();
	});
});
