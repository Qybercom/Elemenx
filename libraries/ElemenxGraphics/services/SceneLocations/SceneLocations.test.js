import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var locations;
var planets;

describe('Contract: SceneLocations, the locations of a planet: cells of its surface, their neighbours and passages', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneLocations', 'service:ScenePlanet', 'service:SceneWorld', 'service:SceneTerrainGenerator', 'service:SceneBiomes']);

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
		expect(Math.round(location.Place.Size)).toBe(made.Ground.Size);
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
});
