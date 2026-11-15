import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var component = Elemenx.Component(unique('WorldEditorHost'), {$Template: '<div style="width: 1000px; height: 640px"><WorldEditor #Editor [value]="World" (change)="Changed" (level)="Leveled" /></div>', World: {Name: 'Aurelia', Galaxy: {Seed: 'world-test', Kind: 'spiral'}}, Changes: 0, Levels: [], Changed: function () {
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
