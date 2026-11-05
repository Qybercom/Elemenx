import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

describe('Contract: SceneShowcase, one world of every primitive of the generation', function () {
	var showcase;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SceneShowcase', 'service:SceneTerrainGenerator', 'service:SceneRoads', 'service:SceneModels', 'service:SceneBuildingGenerator']);

		showcase = Elemenx.Service('SceneShowcase');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('lays out its districts, each with what it shows, and a tour of them', function () {
		var world = showcase.World();

		expect(world.Size).toBe(3000);
		expect(world.Districts.map(function (district) {
			return district.ID;
		})).toEqual(showcase.Districts().map(function (district) {
			return district.ID;
		}));
		expect(world.Districts.every(function (district) {
			return district.Name && district.Radius > 0 && district.Shows.length > 0;
		})).toBe(true);
		expect(world.Route.map(function (stop) {
			return stop.ID;
		})).toEqual(world.Districts.map(function (district) {
			return district.ID;
		}));
		expect(world.Objects[0]).toMatchObject({ID: 'land', Kind: 'ground'});
		expect(Elemenx.Service('SceneWorld').Make(world.Objects[0].World).Ground.Size).toBe(3000);
	});

	/* Every primitive: a type of a sketch, a type of a road, a model, a class of building, an effect added later shows too. */
	it('uses every type of the sketch of a ground, every type of road, every model, every class of building and every effect', function () {
		var world = showcase.World();
		var sketch = Elemenx.Service('SceneWorld').Make(world.Objects[0].World).Ground.Sketch;
		var used = {};
		var ids = {};

		sketch.Layers.forEach(function (layer) {
			layer.Items.forEach(function (item) {
				used[item.Type] = true;
			});
		});

		world.Objects.forEach(function (object) {
			ids[object.ID] = object;
		});

		expect(Object.keys(Elemenx.Service('SceneTerrainGenerator').SketchTypes).filter(function (type) {
			return !used[type];
		})).toEqual([]);
		expect(Elemenx.Service('SceneRoads').Types().filter(function (type) {
			return !ids['road-' + type];
		})).toEqual([]);
		expect(Elemenx.Service('SceneModels').Names().filter(function (name) {
			return !ids['model-' + name] && name.indexOf('showcase-') !== 0;
		})).toEqual([]);
		expect(Elemenx.Service('SceneBuildingGenerator').Classes().filter(function (name) {
			return !ids['building-' + name] || !Elemenx.Service('SceneModels').Has('showcase-' + name);
		})).toEqual([]);
		expect(showcase.Effects.filter(function (type) {
			return !ids['effect-' + type];
		})).toEqual([]);
		expect(['mirror', 'glass', 'car', 'boat', 'track', 'tyres', 'motorway', 'railway', 'cross', 'cave', 'gate', 'camp', 'spawn', 'hamlet', 'meadows', 'groves', 'thickets', 'stones', 'sun'].filter(function (id) {
			return !ids[id];
		})).toEqual([]);
	});

	it('makes a smaller world at its scale, and only the districts asked for', function () {
		var world = showcase.World({Size: 600, Seed: 'small', Districts: ['game', 'race']});

		expect(world.Seed).toBe('small');
		expect(world.Districts.map(function (district) {
			return district.ID;
		})).toEqual(['race', 'game']);
		expect(world.Districts[1].X).toBeCloseTo(-150 * 0.2, 6);
		expect(world.Objects.some(function (object) {
			return object.ID === 'motorway' || object.ID === 'mirror';
		})).toBe(false);
		expect(world.Objects.some(function (object) {
			return object.ID === 'car';
		})).toBe(true);
	});

	it('goes into a Scene as one list: its ground with the sketch, its objects', async function () {
		var ready = null;
		var world = showcase.World({Size: 600, Districts: ['game', 'race']});
		var component = Elemenx.Component(unique('ShowcaseHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready"></Scene></div>', Ready: function (scene) {
			ready = scene;
		}})();
		var scene;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		scene = ready.Scene();

		ready.Add(world.Objects);
		ready.Engine().Frame(performance.now() + 50);

		expect(Elemenx.Service('SceneWorld').Make(scene.Objects.land.Traits.Terrain.World).Ground.Sketch.Layers.length).toBe(2);
		expect(scene.Objects.track.Traits.Road.Type).toBe('track');
		expect(scene.Objects.gate.Traits.Trigger.Radius).toBe(6);
		expect(scene.Ground && scene.Ground.Field.Sketch).toBeTruthy();
	});
});
