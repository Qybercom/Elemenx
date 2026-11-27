import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

/* As a page of demos has it: in a box of the height left to it (Regression: a Blueprint of many blocks made the editor taller). */
async function mount () {
	var component = Elemenx.Component(unique('WorldEditorHost'), {$Template: '<div style="display: flex; width: 1000px; height: 640px; overflow: auto"><div style="display: flex; flex-direction: column; width: 100%; height: 100%"><div style="position: relative; flex: 1 1 auto; min-height: 240px; overflow: hidden"><WorldEditor #Editor [value]="World" (change)="Changed" (level)="Leveled" /></div></div></div>', World: {Name: 'Aurelia', Galaxy: {Seed: 'world-test', Kind: 'spiral'}}, Changes: 0, Levels: [], Changed: function () {
		this.Changes++;
	}, Leveled: function (event) {
		this.Levels.push(event.Path);
	}})();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && editor.GalaxyScene;
	}, 8000);

	return {Host: component, Editor: editor};
}

function enter (editor, level, id) {
	return new Promise(function (resolve, reject) {
		editor.Enter(level, id, function (error) {
			if (error) reject(error);
			else resolve();
		});
	});
}

describe('Contract: WorldEditor, a world level in level (galaxy, system, planet, location) and what it uses in tabs beside it', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['WorldEditor']);
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('goes from its galaxy into the system of a star and a planet of it, and back up its path', async function () {
		var made = await mount();
		var editor = made.Editor;
		var galaxies = Elemenx.Service('GalaxyData');
		var star = galaxies.Sector(editor.Galaxy(), 270, 0, 0, 1).Stars[0];
		var system;
		var body;

		expect(editor.Galaxy().Manifest.Kind).toBe('spiral');
		expect(editor.Path()).toEqual([{Level: 'galaxy', ID: ''}]);
		expect(editor.$Element().querySelector('.elemenx-world-editor-galaxy')).toBeTruthy();

		editor.StarPicked({ID: star.ID});

		await tick(20);

		expect(editor.CanEnter()).toBe(true);

		await enter(editor, 'system', star.ID);

		system = editor.$Ref('System', true);

		expect(editor.Path().map(function (step) {
			return step.Level;
		})).toEqual(['galaxy', 'system']);
		expect(system.Scene().Get('star')).toBeTruthy();
		/* The system of the star: of its seed, with its mass. */
		expect(system.Scene().Get('star').Traits.Star.Mass).toBeCloseTo(star.Mass, 2);

		body = system.Scene().Objects(function (object) {
			return !!object.Traits.Body;
		})[0];

		editor.BodyPicked({ID: body.ID});

		await enter(editor, 'planet', body.ID);

		await waitFor(function () {
			return editor.$Element().querySelector('.elemenx-planet-editor');
		}, 6000);

		editor.PlanetChanged({Seed: 'home', Radius: 3000});

		expect(editor.World().Planets[star.ID + '/' + body.ID]).toEqual({Seed: 'home', Radius: 3000});
		expect(made.Host.Levels.length).toBe(2);

		editor.Up(0);

		await tick(20);

		expect(editor.Path()).toEqual([{Level: 'galaxy', ID: ''}]);
		expect(editor.$Element().querySelector('.elemenx-planet-editor')).toBe(null);
	});

	it('goes into a nebula of its galaxy as into a system, edits its kind and its size there, and keeps them in the world', async function () {
		var made = await mount();
		var editor = made.Editor;
		var galaxies = Elemenx.Service('GalaxyData');
		var nebula = galaxies.Objects(editor.Galaxy()).filter(function (one) {
			return one.Type === 'remnant' && one.Subtype === 'II';
		})[0];
		var system;
		var field;

		editor.StarPicked({ID: nebula.ID});

		await tick(20);

		expect(editor.CanEnter()).toBe(true);

		/* Regression: told as a star, "A star of class {kind}, {mass} Suns, NaN K". */
		expect(editor.PickedNote()).toContain('remnant II');
		expect(editor.PickedNote()).not.toMatch(/\{|NaN/);

		await enter(editor, 'system', nebula.ID);

		system = editor.$Ref('System', true);

		expect(system.Scene().Get('nebula').Traits.Nebula).toMatchObject({Type: 'remnant', Subtype: 'II'});
		expect(system.Scene().Get('core').Kind).toBe('pulsar');

		/* Edited as any object: its fields in the inspector. */
		system.Select('nebula');

		field = function (key) {
			return system.FieldList.filter(function (one) {
				return one.ID === 'Nebula:' + key;
			})[0];
		};

		system.FieldChanged(field('Subtype'), 'Ib');
		system.FieldChanged(field('Radius'), '25');

		expect(system.Scene().Get('nebula').Traits.Nebula).toMatchObject({Subtype: 'Ib', Radius: 25});

		await waitFor(function () {
			var kept = editor.Galaxy().Systems[nebula.ID];

			return kept && JSON.stringify(kept).indexOf('"Ib"') !== -1;
		}, 6000);
	});

	it('searches its galaxy round where the view looks: a type, a mass, a text; a row chosen flies to it, chosen twice goes into it', async function () {
		var made = await mount();
		var editor = made.Editor;
		var scene = editor.GalaxyScene();
		var galaxies = Elemenx.Service('GalaxyData');
		var nebula = galaxies.Objects(editor.Galaxy()).filter(function (one) {
			return one.Type === 'planetary';
		})[0];
		var found;
		var star;

		scene.SetGalaxyView({Target: nebula.Place.slice(), Distance: 300, Pitch: 0.4, Yaw: 0});

		editor.Searched('Radius', '25');

		await tick(20);

		found = editor.FoundList;

		expect(found.Items.length).toBeGreaterThan(0);
		expect(found.Items[0].ID).toBe(nebula.ID);
		expect(editor.$Element().querySelector('.elemenx-world-editor-found')).toBeTruthy();
		expect(editor.FoundItems()[0].Label).toContain(nebula.Name);

		/* Of a type: only white dwarfs; of a mass: only the heavy ones. */
		editor.Searched('Type', 'white-dwarf');

		expect(editor.FoundList.Items.every(function (item) {
			return item.Type === 'white-dwarf';
		})).toBe(true);

		editor.Searched('Radius', '100');
		editor.Searched('Type', 'star');
		editor.Searched('Mass', [0, 2]);

		expect(editor.FoundList.Items.length).toBeGreaterThan(0);
		expect(editor.FoundList.Items.every(function (item) {
			return item.Mass >= 1 - 1e-9;
		})).toBe(true);

		/* Chosen: picked and flown to. */
		star = editor.FoundList.Items[0];

		editor.FoundChosen({ID: star.ID, Label: ''});

		expect(editor.Picked).toBe(star.ID);
		expect(scene.GalaxyPicked()).toBe(star.ID);

		/* Chosen again at once: into its system. */
		editor.FoundChosen({ID: star.ID, Label: ''});

		await waitFor(function () {
			return editor.Level() === 'system';
		}, 6000);

		expect(editor.Path()[1].ID).toBe(star.ID);
	});

	/*
	 * Regression: the tab of a cutscene gave its CutsceneEditor no scene: Play, Record, the camera and the keys from the
	 * view did nothing. A cutscene is of a location of the world, played in a scene of it beside its editor.
	 */
	it('plays a cutscene of the world in a scene of the location it is of, chosen in its tab', async function () {
		var made = await mount();
		var editor = made.Editor;
		var world = editor.World();
		var id;
		var cutscenes;

		world.Locations['sun/terra/harbour'] = {Version: 1, Name: 'Harbour', Setting: 'ground', Scene: {Version: 1, Seed: '', Time: 0, Travels: [], Removed: [], Overrides: {}, Added: [
			{ID: 'ground', Kind: 'ground', Values: {}, Traits: {Terrain: {World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 4, Seed: 'harbour'})}}, Parts: []},
			{ID: 'sun', Kind: 'sun', Values: {}, Traits: {Sun: {Time: 11}}, Parts: []}
		]}};

		editor.Load(world);

		id = editor.AddResource('cutscene');

		await waitFor(function () {
			return editor.$Element().querySelector('.elemenx-world-editor-main .elemenx-cutscene-editor');
		}, 6000);

		/* Of no location yet: told to pick one, no scene. */
		expect(editor.CutsceneLocation(0, editor.Tab)).toBe('');
		expect(editor.LocationOptions()).toEqual([{Value: 'sun/terra/harbour', Label: 'Harbour (terra)'}]);
		expect(editor.$Element().querySelector('.elemenx-world-editor-cutscene .elemenx-scene')).toBe(null);

		editor.CutsceneLocationChosen(editor.Tab, 'sun/terra/harbour');

		expect(editor.World().Resources.Cutscenes[id].Location).toBe('sun/terra/harbour');

		await waitFor(function () {
			cutscenes = Elemenx.Instance(editor.$Element().querySelector('.elemenx-world-editor-main .elemenx-cutscene-editor'));

			return cutscenes && cutscenes.Scene;
		}, 15000);

		/* Its editor plays in the scene of the location: its ground and its sun in it. */
		expect(cutscenes.Scene.Get('ground')).toBeTruthy();
		expect(cutscenes.Scene.Get('sun')).toBeTruthy();

		await waitFor(function () {
			return cutscenes.Scene.Scene().Ground;
		}, 30000);
	}, 60000);

	it('opens what the world uses in tabs of their editors: a model, a plant, a cutscene, a material', async function () {
		var made = await mount();
		var editor = made.Editor;
		var model = editor.AddResource('model');

		await waitFor(function () {
			return editor.$Element().querySelector('.elemenx-world-editor-main .elemenx-model-editor');
		}, 6000);

		expect(editor.Tab).toBe('model:' + model);
		expect(editor.TabItems().map(function (tab) {
			return tab.ID;
		})).toEqual(['world', 'model:' + model]);

		editor.AddResource('material');

		await waitFor(function () {
			return editor.$Element().querySelector('.elemenx-world-editor-main .elemenx-blueprint');
		}, 6000);

		editor.ResourceChanged('material:material-1', {Type: 'material', Blocks: []});

		expect(editor.World().Resources.Materials['material-1'].Value).toEqual({Type: 'material', Blocks: []});

		editor.TabClosed('material:material-1');

		expect(editor.Tab).toBe('world');
		expect(editor.World().Resources.Models[model].Name).toBeTruthy();
	});

	it('changes a graph of the library for the world alone in a tab, gives it to its planets and the grounds of its locations, and gives the library\'s back', async function () {
		var made = await mount();
		var editor = made.Editor;
		var ground = {ID: 'ground', Kind: 'ground', Values: {}, Traits: {Terrain: {World: null}}, Parts: []};
		var bytes;
		var shown;

		expect(editor.GraphNames()).toEqual(expect.arrayContaining(['planet/relief', 'planet/climate', 'sketch/river', 'carve/caves']));
		expect(editor.World().Graphs).toEqual({});

		/* A palette of many blocks, as a page of all the libraries has it. */
		Array.from({length: 80}).forEach(function (none, index) {
			Elemenx.Service('Blueprints').Node('WorldEditorTest' + index, {Graphs: ['generator'], Group: 'world-editor-test', Outputs: [{Key: 'Out', Type: 'float'}]});
		});

		/* Changed for the first time: a copy of the library's, in a tab of its Blueprint. */
		editor.OpenGraph('planet/relief');

		await waitFor(function () {
			return editor.$Element().querySelector('.elemenx-world-editor-graph .elemenx-blueprint');
		}, 6000);

		expect(editor.Tab).toBe('graph:planet/relief');

		/*
		 * Regression: in a box of no height of its own a Blueprint of many blocks (as a material of the world too) made the
		 * editor as tall as its palette: what its main part shows fills it and never makes it bigger.
		 */
		editor.$Element().style.height = 'auto';

		await tick(100);

		expect(editor.$Element().getBoundingClientRect().height).toBeLessThan(700);

		editor.$Element().style.height = '';

		expect(editor.World().Graphs['planet/relief']).toEqual(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/relief'));
		expect(editor.World().Graphs['planet/relief']).not.toBe(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/relief'));
		expect(editor.GraphOptions().map(function (option) {
			return option.Value;
		})).not.toContain('planet/relief');
		expect(editor.$Element().querySelector('[data-kind="graph"]').textContent).toContain('planet/relief');

		/* Its planets: ReliefGraph; kept without it. */
		editor.Own().Path = [{Level: 'galaxy', ID: ''}, {Level: 'system', ID: 'a'}, {Level: 'planet', ID: 'b'}];

		expect(editor.PlanetValue().ReliefGraph).toBe(editor.World().Graphs['planet/relief']);
		expect(editor.PlanetValue()).toBe(editor.PlanetValue());

		editor.PlanetChanged(Object.assign({}, editor.PlanetValue(), {Radius: 3000, ReliefSources: {Relief: {}}}));

		expect(editor.World().Planets['a/b']).toEqual({Seed: 'a/b', Radius: 3000});

		/* The grounds of its locations: Graphs of their Terrain, of sketch/ and carve/ alone; kept without them. */
		editor.Own().World.Locations['a/b/c'] = {Version: 1, Name: 'c', Setting: 'ground', Scene: {Added: [ground]}};

		editor.Own().Path.push({Level: 'location', ID: 'c'});

		expect(editor.LocationValue().Scene.Added[0].Traits.Terrain.Graphs).toBe(undefined);

		editor.OpenGraph('sketch/river');
		editor.GraphChanged('graph:sketch/river', Object.assign({}, editor.World().Graphs['sketch/river'], {name: 'mine'}));

		shown = editor.LocationValue();

		expect(Object.keys(shown.Scene.Added[0].Traits.Terrain.Graphs)).toEqual(['sketch/river']);
		expect(shown.Scene.Added[0].Traits.Terrain.Graphs['sketch/river'].name).toBe('mine');

		editor.LocationChanged(shown);

		expect(editor.World().Locations['a/b/c'].Scene.Added[0].Traits.Terrain.Graphs).toBe(undefined);

		/* Kept in its file. */
		bytes = await new Promise(function (resolve, reject) {
			editor.Pack(function (error, packed) {
				if (error) reject(error);
				else resolve(packed);
			});
		});

		/* The library's back: dropped, its tab closed. */
		editor.ResetGraph('sketch/river');

		expect(Object.keys(editor.World().Graphs)).toEqual(['planet/relief']);
		expect(editor.TabItems().map(function (tab) {
			return tab.ID;
		})).toEqual(['world', 'graph:planet/relief']);
		expect(editor.LocationValue().Scene.Added[0].Traits.Terrain.Graphs).toBe(undefined);

		await new Promise(function (resolve, reject) {
			editor.Open(bytes, function (error) {
				if (error) reject(error);
				else resolve();
			});
		});

		expect(Object.keys(editor.World().Graphs).sort()).toEqual(['planet/relief', 'sketch/river']);
		expect(editor.World().Graphs['sketch/river'].name).toBe('mine');
	});

	/*
	 * The shader graphs of the library (shader/: the bake of a body of noise, the weather of the surfaces of things, the shape
	 * of a lightning) a world changes too: the scenes of its systems and its locations are drawn with them (Graphs of Scene),
	 * made again as one of them changes.
	 */
	it('changes a shader graph for the world alone: the scenes of its systems and locations drawn with it, made again', async function () {
		var made = await mount();
		var editor = made.Editor;
		var graphs;

		expect(editor.GraphNames()).toEqual(expect.arrayContaining(['shader/bake', 'shader/weather', 'shader/bolt']));
		expect(editor.ShaderGraphs()).toBe(null);

		editor.OpenGraph('planet/relief');
		editor.OpenGraph('shader/weather');

		expect(editor.Fresh).toBe(false);

		await tick(20);

		expect(editor.Fresh).toBe(true);

		graphs = editor.ShaderGraphs();

		expect(Object.keys(graphs)).toEqual(['shader/weather']);
		expect(editor.ShaderGraphs()).toBe(graphs);

		editor.GraphChanged('graph:shader/weather', Object.assign({}, graphs['shader/weather'], {name: 'mine'}));

		expect(editor.ShaderGraphs()['shader/weather'].name).toBe('mine');

		editor.ResetGraph('shader/weather');

		expect(editor.ShaderGraphs()).toBe(null);

		/* The envelope of the bodies (planet/envelope) is the scene's: given to it, the scene made again. Regression: it was kept by the world, no scene read it. */
		editor.OpenGraph('planet/envelope');

		expect(editor.Fresh).toBe(false);
		expect(Object.keys(editor.ShaderGraphs())).toEqual(['planet/envelope']);

		editor.ResetGraph('planet/envelope');

		expect(editor.ShaderGraphs()).toBe(null);
	});

	it('changes a cloud, a network and a layout graph for the world alone in a Blueprint of its kind, what each gives drawn beside it', async function () {
		var made = await mount();
		var editor = made.Editor;
		var preview;

		expect(editor.GraphNames()).toEqual(expect.arrayContaining(['cloud/sky', 'cloud/night', 'cloud/cluster', 'cloud/belt']));

		editor.OpenGraph('cloud/belt');

		await tick(20);

		expect(editor.GraphType(editor.Version, 'graph:cloud/belt')).toBe('cloud');
		expect(editor.Previewed(editor.Version, 'graph:cloud/belt')).toBe(true);
		expect(editor.Previewed(editor.Version, 'graph:planet/relief')).toBe(false);
		/* The scenes of its systems read it: the rocks of their belts are of it. */
		expect(Object.keys(editor.ShaderGraphs())).toEqual(['cloud/belt']);

		await waitFor(function () {
			preview = made.Host.$Element().querySelector('.elemenx-world-editor-graph-preview');

			return preview && /260/.test(preview.textContent);
		}, 6000);

		expect(made.Host.$Element().querySelector('.elemenx-world-editor-graph-body.previewed')).not.toBe(null);

		editor.ResetGraph('cloud/belt');

		expect(editor.ShaderGraphs()).toBe(null);

		/* A network: the rivers of its planets (their option RiversGraph), drawn beside it too; not kept in a planet. */
		expect(editor.GraphNames()).toEqual(expect.arrayContaining(['network/rivers', 'network/roads', 'network/track']));

		editor.OpenGraph('network/rivers');

		editor.Own().Path = [{Level: 'galaxy', ID: ''}, {Level: 'system', ID: 'a'}, {Level: 'planet', ID: 'b'}];

		expect(editor.Previewed(editor.Version, 'graph:network/rivers')).toBe(true);
		expect(editor.PlanetValue().RiversGraph.type).toBe('network');

		editor.PlanetChanged(editor.PlanetValue());

		expect(editor.World().Planets[editor.PlanetKey()].RiversGraph).toBe(undefined);

		editor.ResetGraph('network/rivers');

		expect(editor.PlanetValue().RiversGraph).toBe(undefined);

		/* A layout: the plans of the settlements of its locations (Graphs of their ground), drawn beside it too. */
		expect(editor.GraphNames()).toEqual(expect.arrayContaining(['layout/grid', 'layout/districts', 'layout/village', 'layout/cloverleaf']));

		editor.OpenGraph('layout/grid');

		expect(editor.Previewed(editor.Version, 'graph:layout/grid')).toBe(true);
		expect(Object.keys(editor.GroundGraphs())).toEqual(['layout/grid']);

		editor.ResetGraph('layout/grid');

		expect(editor.GroundGraphs()).toBe(null);
	});

	it('keeps all of the world in one file: its galaxy and its edits, its planets, its locations and its resources', async function () {
		var made = await mount();
		var editor = made.Editor;
		var galaxies = Elemenx.Service('GalaxyData');
		var star = galaxies.Sector(editor.Galaxy(), 270, 0, 0, 1).Stars[0];
		var bytes;

		editor.StarPicked({ID: star.ID});
		editor.PickedRenamed('Polaris');

		editor.Own().World.Planets['a/b'] = {Seed: 'kept'};
		editor.Own().World.Locations['a/b/c'] = {Version: 1, Name: 'c', Setting: 'ground'};

		editor.AddResource('plant');

		bytes = await new Promise(function (resolve, reject) {
			editor.Pack(function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		editor.Load({Galaxy: {Seed: 'other'}});

		expect(editor.Galaxy().Manifest.Seed).toBe('other');

		await new Promise(function (resolve, reject) {
			editor.Open(bytes, function (error) {
				if (error) reject(error);
				else resolve();
			});
		});

		expect(editor.Galaxy().Manifest.Seed).toBe('world-test');
		expect(galaxies.Star(editor.Galaxy(), star.ID).Name).toBe('Polaris');
		expect(editor.World().Planets['a/b']).toEqual({Seed: 'kept'});
		expect(editor.World().Locations['a/b/c'].Name).toBe('c');
		expect(Object.keys(editor.World().Resources.Plants)).toEqual(['plant-1']);
	});

	it('puts a star and a body of no system where the view looks, and the body goes along the velocity told', async function () {
		var made = await mount();
		var editor = made.Editor;
		var star = editor.AddedHere('star');
		var body;

		expect(editor.PickedStar().ID).toBe(star);

		body = editor.AddedHere('station');

		editor.Moved(0, 12);

		expect(editor.PickedBody().Velocity).toEqual([12, 0, 0]);
		expect(Elemenx.Service('GalaxyData').Added(editor.Galaxy(), 10).filter(function (one) {
			return one.ID === body;
		})[0].Place[0]).toBeCloseTo(editor.PickedBody().Place[0] + 120, 5);
	});

	/* Its panel as wide as its edge is dragged (EditorPanes): kept in the browser for the next time, as the editors of the scene, the planet and the model keep theirs. */
	it('makes its panel as wide as its edge is dragged and keeps the width for the next time', async function () {
		var made = await mount();
		var editor = made.Editor;
		var panel = editor.$Element().querySelector('.elemenx-world-editor-panel');

		window.localStorage.removeItem('elemenx-panes:world-editor');

		expect(panel.querySelector('.elemenx-resize-handle.right')).not.toBe(null);

		editor.PaneResized('panel', {detail: {Width: 333}});

		await tick(20);

		expect(JSON.parse(window.localStorage.getItem('elemenx-panes:world-editor')).panel).toBe(333);
		expect(editor.PaneWidth('panel', 240)).toBe('333px');

		editor.Panes = null;

		expect(editor.PaneWidth('panel', 240)).toBe('333px');
		expect(editor.PaneWidth('other', 120)).toBe('120px');

		window.localStorage.removeItem('elemenx-panes:world-editor');
	});
});
