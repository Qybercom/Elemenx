import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/*
 * SceneCars: the cars of a game as data, each a file of its own (or many in a catalogue, by their files): their models made
 * of SceneModels with their parts by their roles (ModelRoles), how they go, the unit a Scene takes. Regression: the cars of
 * Racing were written in the demo, their parts found by words of the names of their materials and boxes round them.
 */
describe('Contract: SceneCars, the cars of a game as data', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneCars', 'service:SceneModels', 'service:ModelRoles']);
	});

	function load (url) {
		return new Promise(function (resolve, reject) {
			Elemenx.Service('SceneCars').Load(url, function (error, names) {
				if (error) reject(error);
				else resolve(names);
			});
		});
	}

	it('reads a catalogue of cars, each of a file of its own or in it, their models of their roles, their files from their folders', async function () {
		var cars = Elemenx.Service('SceneCars');
		var models = Elemenx.Service('SceneModels');
		var names = await load('/cars/cars.json');
		var coupe = cars.Get('coupe');

		expect(names).toEqual(['coupe', 'kart']);
		expect(cars.Names().slice(-2)).toEqual(['coupe', 'kart']);

		/* Its model of its file (from the folder of its own file), its pieces cut as it says, its parts by their roles. */
		expect(coupe).toMatchObject({Label: 'Coupe', Model: 'car-coupe', File: '/cars/../models/coupe.glb'});
		expect(models.Recipes['car-coupe']).toMatchObject({URL: '/cars/../models/coupe.glb', Type: 'prop', Apart: 'Wheel'});
		expect(Elemenx.Service('ModelRoles').Get('car-coupe').map(function (role) {
			return role.ID;
		})).toEqual(['doors']);
		expect(Elemenx.Service('ModelRoles').Rig(Elemenx.Service('ModelRoles').Get('car-coupe')).Openings[0]).toMatchObject({Name: 'role:doors', Both: true, Hinge: [0.8, 0.9, 0.5], Angle: 70});

		/* What a Scene takes: where it stands and faces, how it goes (its Tune, and what is given over it). */
		var unit = cars.Unit('coupe', {ID: 'car', X: 4, Y: 5, Heading: 1.5}, {Power: 600000});

		expect(unit).toMatchObject({ID: 'car', X: 4, Y: 5, Name: '', Model: 'car-coupe', Size: 1.25});
		expect(unit.Heading).toBe(undefined);
		expect(unit.Vehicle).toMatchObject({Kind: 'car', Heading: 1.5, Yaw: 90, Seat: [0.3, 1, 0], Gears: [0.3, 0.6, 1], Shift: 'manual', Mirrors: [{At: [0, 1, 0.3]}], Brake: 30, Power: 600000, Mass: 1400});

		/* One in the catalogue itself: its pipes pop as an engine's mounts. */
		expect(cars.Unit('kart').Vehicle.Mounts).toEqual([{Kind: 'engine', Type: 'fumes', At: [0, 0.3, -0.9], Aim: [0, 0, -1], Size: 0.5, Pop: true, Light: false}]);
		expect(cars.Unit('kart').Size).toBe(0.8);
		expect(cars.Unit('nobody')).toBe(null);
	});

	it('reads one car, named after its file, and tells what it cannot read', async function () {
		var cars = Elemenx.Service('SceneCars');

		expect(await load('/cars/coupe.json')).toEqual(['coupe']);

		await expect(load('/cars/none.json')).rejects.toThrow(/none\.json gave 404/);

		expect(function () {
			cars.Define('empty', {});
		}).toThrow('Elemenx SceneCars: Define expects (name, {Model})');
	});
});
