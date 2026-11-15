import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var systems;
var planet;

function open (source) {
	return new Promise(function (resolve, reject) {
		systems.Open(source, function (error, made) {
			if (error) reject(error);
			else resolve(made);
		});
	});
}

/* A binary star round its barycentre (a black hole round one of them), a planet round the two with its moon, a station on the moon's orbit. */
function binary () {
	return {Objects: [
		{ID: 'centre', Kind: 'barycentre', Values: {Name: 'Centre'}, Children: [
			{ID: 'a', Kind: 'star', Values: {Name: 'A'}, Traits: {Star: {Mass: 1}, Orbit: {Distance: 0.1, Anomaly: 0, Unit: 'AU'}}},
			{ID: 'b', Kind: 'star', Values: {Name: 'B'}, Traits: {Star: {Mass: 1}, Orbit: {Distance: 0.1, Anomaly: 180, Unit: 'AU'}}, Children: [
				{ID: 'hole', Kind: 'blackhole', Values: {Name: 'Hole'}, Traits: {Orbit: {Distance: 0.02, Unit: 'AU'}, BlackHole: {Mass: 6}}, Children: [
					{ID: 'stone', Kind: 'planetoid', Values: {Name: 'Stone'}, Traits: {Orbit: {Distance: 0.001, Unit: 'AU'}}}
				]}
			]},
			{ID: 'terra', Kind: 'planet', Values: {Name: 'Terra'}, Traits: {Orbit: {Distance: 1.5, Unit: 'AU'}, Body: {Radius: 6371}}, Children: [
				{ID: 'luna', Kind: 'moon', Values: {Name: 'Luna'}, Children: [
					{ID: 'dock', Kind: 'station', Values: {Name: 'Dock'}}
				]}
			]}
		]}
	]};
}

describe('Contract: SystemData, a star system as data: its tree of orbits, its edits, the planets of its bodies', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SystemData', 'service:PlanetData', 'service:Archive', 'service:ScenePlanet', 'service:Astronomy', 'service:SceneTerrainGenerator', 'service:Noise', 'service:Workers']);

		systems = Elemenx.Service('SystemData');
		planet = await new Promise(function (resolve, reject) {
			Elemenx.Service('PlanetData').Bake({Radius: 6371, Seed: 'system-terra', Ocean: 0.5}, {ID: 'system-terra', Depth: 0, Biomes: 0, Size: 5}, function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('makes a system of a seed again whenever it is read, and one written as a tree of any depth', function () {
		var seeded = systems.Make({Seed: 'sol-like'});
		var written = systems.Make(binary(), {ID: 'binary', Name: 'Binary'});
		var objects = systems.Objects(written, 'binary');
		var byID = {};

		expect(seeded.Manifest.Origin).toEqual({Kind: 'generated', Seed: 'sol-like', Options: {}});
		expect(seeded.Objects).toBe(null);
		expect(systems.Objects(seeded, 'x')).toEqual(systems.Seeded('sol-like'));
		expect(written.Manifest.Origin.Kind).toBe('authored');

		objects.forEach(function (spec) {
			byID[spec.ID] = spec;
		});

		/* Each with its parent: a star round the barycentre, a station round a moon round a planet round it. */
		expect(byID.a.Parent).toBe('centre');
		expect(byID.terra.Parent).toBe('centre');
		expect(byID.luna.Parent).toBe('terra');
		expect(byID.dock.Parent).toBe('luna');
		expect(byID.hole.Parent).toBe('b');
		expect(byID.centre.Parent).toBe('');
	});

	it('keeps its edits over what it was made of: changed, added, taken away', function () {
		var data = systems.Make({Seed: 'edited'});
		var first = systems.Seeded('edited')[1];
		var objects;

		systems.Edit(data, first.ID, {Values: {Name: 'Renamed'}});
		systems.Add(data, {ID: 'rogue-dock', Kind: 'station', Parent: first.ID, Values: {Name: 'Dock'}});
		systems.Remove(data, systems.Seeded('edited')[2].ID);

		objects = systems.Objects(data, 'edited');

		expect(objects.filter(function (spec) {
			return spec.ID === first.ID;
		})[0].Values.Name).toBe('Renamed');
		expect(objects.map(function (spec) {
			return spec.ID;
		})).toContain('rogue-dock');
		expect(objects.map(function (spec) {
			return spec.ID;
		})).not.toContain(systems.Seeded('edited')[2].ID);
		expect(Object.keys(data.Dirty)).toEqual(['edits']);
	});

	it('keeps the planet of a body in its file, and opens it again with it, the planet by its parts', async function () {
		var data = systems.Make(binary(), {ID: 'binary'});
		var again;
		var body;
		var keys;
		var spec;

		systems.SetBody(data, 'terra', planet);

		again = await open(systems.Save(data));
		spec = systems.Objects(again, 'binary').filter(function (one) {
			return one.ID === 'terra';
		})[0];

		expect(again.Manifest.Bodies).toEqual({terra: {Part: true}});
		expect(spec.Traits.Surface.Planet.Data).toBe('system:binary:terra');

		body = await new Promise(function (resolve, reject) {
			systems.Body(again, 'terra', function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		expect(body.Manifest.ID).toBe('system-terra');
		expect(Array.from(body.Tiles['Height/0/0/0-0'])).toEqual(Array.from(planet.Tiles['Height/0/0/0-0']));

		keys = await new Promise(function (resolve) {
			systems.UseBodies('binary', again, function (error, made) {
				resolve(made);
			});
		});

		expect(keys).toEqual(['system:binary:terra']);
		expect(Elemenx.Service('ScenePlanet').DataOf('system:binary:terra').Manifest.ID).toBe('system-terra');
	});

	/* A Scene of a system of data: its objects, a binary round its barycentre, of the masses of both. */
	it('is drawn by a Scene of its key: a binary star going round its barycentre, opposite one another', async function () {
		var ready = null;
		var data = systems.Make(binary(), {ID: 'drawn'});
		var component;
		var inner;
		var a;
		var b;
		var middle;

		systems.Use('drawn-binary', data);

		component = Elemenx.Component(unique('SystemHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Background="false" [system]="System" (ready)="Ready" /></div>', System: {Data: 'drawn-binary'}, Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			var scene = ready && ready.Scene();

			return scene && scene.Objects.a && scene.Objects.a.World && scene.Objects.b && scene.Objects.b.World && scene.Objects.a.World[0] !== scene.Objects.b.World[0];
		}, 6000);

		inner = ready.Scene();
		a = inner.Objects.a;
		b = inner.Objects.b;
		middle = inner.Objects.centre;

		expect(middle).toBeTruthy();
		expect(a.Parent).toBe('centre');
		/* Opposite each other round their centre, as far from it. */
		expect(a.World[0] - middle.World[0]).toBeCloseTo(-(b.World[0] - middle.World[0]), 3);
		expect(a.World[2] - middle.World[2]).toBeCloseTo(-(b.World[2] - middle.World[2]), 3);
		/* Of the masses of both stars: the period of each the one round two Suns. */
		expect(a.Around).toBe(2);
		/* Round a black hole: of its mass. */
		expect(inner.Objects.hole.Parent).toBe('b');
		expect(inner.Objects.stone.Around).toBe(6);
		expect(inner.Objects.dock.Parent).toBe('luna');
	});

	/* A star and a black hole in a pair: its Members both; a black hole round it further out goes round it as a planet. */
	it('weighs a barycentre of its members, a black hole among them when it is one, the stars alone by default', async function () {
		var ready = null;
		var component;
		var inner;

		systems.Use('pair', systems.Make({Objects: [
			{ID: 'pair', Kind: 'barycentre', Traits: {Barycentre: {Members: ['sun', 'hole']}}, Children: [
				{ID: 'sun', Kind: 'star', Traits: {Star: {Mass: 2}, Orbit: {Distance: 0.05, Unit: 'AU'}}},
				{ID: 'hole', Kind: 'blackhole', Traits: {BlackHole: {Mass: 7}, Orbit: {Distance: 0.02, Anomaly: 180, Unit: 'AU'}}},
				{ID: 'far', Kind: 'blackhole', Traits: {BlackHole: {Mass: 30}, Orbit: {Distance: 5, Unit: 'AU'}}}
			]},
			{ID: 'single', Kind: 'barycentre', Children: [
				{ID: 'one', Kind: 'star', Traits: {Star: {Mass: 3}, Orbit: {Distance: 0.05, Unit: 'AU'}}},
				{ID: 'out', Kind: 'blackhole', Traits: {BlackHole: {Mass: 30}, Orbit: {Distance: 5, Unit: 'AU'}}}
			]}
		]}));

		component = Elemenx.Component(unique('PairHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Background="false" [system]="System" (ready)="Ready" /></div>', System: {Data: 'pair'}, Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready && ready.Scene().Objects.far && ready.Scene().Objects.far.Around;
		}, 6000);

		inner = ready.Scene();

		expect(inner.Objects.sun.Around).toBe(9);
		expect(inner.Objects.far.Around).toBe(9);
		expect(inner.Objects.one.Around).toBe(3);
	});

	/* The recipe of a Scene of space (what SceneEditor saves) as a system, and back. */
	it('makes a system of the recipe of a Scene of space and back: its seed, its edits, its cosmos, time and cutscenes', function () {
		var recipe = {Version: 1, Seed: 'recipe-seed', Cosmos: {Kind: 'nebula'}, Time: 12, Travels: [], Added: [{ID: 'outpost', Kind: 'station', Parent: 'star', Values: {Name: 'Out'}}], Removed: ['x'], Overrides: {star: {Values: {Name: 'Sol'}}}, Cutscenes: {intro: {Tracks: []}}};
		var data = systems.FromRecipe(recipe, {ID: 'recipe'});
		var back = systems.Recipe(data, 'recipe');
		var written = systems.FromRecipe({Version: 1, Seed: '', Added: [{ID: 'a', Kind: 'star'}, {ID: 'b', Kind: 'planet', Parent: 'a'}], Removed: [], Overrides: {}}, {ID: 'written'});

		expect(data.Manifest.Origin).toEqual({Kind: 'generated', Seed: 'recipe-seed', Options: {}});
		expect(data.Manifest.Scene).toEqual({Cosmos: {Kind: 'nebula'}, Time: 12, Cutscenes: {intro: {Tracks: []}}});
		expect(back).toEqual(recipe);
		expect(systems.Objects(written, 'w').map(function (spec) {
			return spec.ID;
		})).toEqual(['a', 'b']);
		expect(systems.Recipe(written, 'w').Seed).toBe('');
	});

	/* Regression: a system of a seed and options (the mass of a star of a galaxy) opened in a Scene as of its seed alone. */
	it('gives the recipe of a system of a seed with options as its objects, so a Scene makes the very same', function () {
		var data = systems.Make({Seed: 'told', Options: {Mass: 0.3}});
		var recipe;

		systems.Edit(data, 'star', {Values: {Name: 'Dim'}});

		recipe = systems.Recipe(data, 'told');

		expect(recipe.Seed).toBe('');
		expect(recipe.Added[0].Traits.Star.Mass).toBe(0.3);
		expect(recipe.Added[0].Values.Name).toBe('Dim');
		expect(systems.Recipe(systems.Make({Seed: 'free'}), 'f').Seed).toBe('free');
	});
});
