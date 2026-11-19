import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (planet) {
	var drawn = 0;
	var component = Elemenx.Component(unique('PlanetHost'), {$Template: '<div style="width: 520px; height: 380px"><PlanetEditor #Editor [value]="Planet" (change)="Changed" (drawn)="Drawn" /></div>', Planet: planet, Changes: [], Changed: function (value) {
		this.Changes.push(value);
	}, Drawn: function () {
		drawn++;
	}})();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	/*
	 * Regression (under load): the workers that paint its globe, busy with the other tests, took more than the 20 s it had;
	 * then a test of 45 s ran out while its globe was still drawn: each test with it has 90 s.
	 */
	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && drawn;
	}, 50000);

	return {Host: component, Editor: editor, Drawn: function () {
		return drawn;
	}};
}

function press (editor, x, y) {
	var view = editor.$Element().querySelector('.elemenx-planet-editor-view');
	var box = view.getBoundingClientRect();

	['pointerdown', 'pointerup'].forEach(function (type) {
		view.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: box.left + x, clientY: box.top + y, pointerId: 1, button: 0}));
	});
}

describe('Contract: PlanetEditor, a planet drawn on a globe and shown as it is', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['PlanetEditor', 'service:ScenePlanet', 'service:SceneBiomes', 'service:Workers', 'service:SceneLocations', 'service:SceneWorld']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * Regression: a view of no size (hidden, or taken out of the page as it drew) is one pixel high, lower than its bands:
	 * a band of no height made a picture of none, which threw.
	 */
	it('draws a globe in a view of no size, lower than its bands, some of them of no height', async function () {
		var drawn = 0;
		var errors = [];
		var caught = function (event) {
			errors.push(String(event.message || event.error));
		};
		var component = Elemenx.Component(unique('PlanetLow'), {$Template: '<div style="display: none"><PlanetEditor [value]="Planet" (drawn)="Drawn" /></div>', Planet: {Seed: 'low', Ocean: 0.6}, Drawn: function () {
			drawn++;
		}})();

		owned.push(component);

		window.addEventListener('error', caught);

		try {
			document.getElementById('mount').appendChild(component.$Element());

			/* Regression (under load): its workers, busy with the other tests, took more than 20 s (as mount waits 50 s). */
			expect(await waitFor(function () {
				return drawn > 0;
			}, 50000)).toBe(true);

			expect(errors).toEqual([]);
		}
		finally {
			window.removeEventListener('error', caught);
		}
	});

	it('paints the globe of the planet in workers, each pixel of it, and tells the point under the pointer', async function () {
		var mounted = await mount({Seed: 'editor', Ocean: 0.6});
		var editor = mounted.Editor;
		var canvas = editor.$Element().querySelector('.elemenx-planet-editor-canvas');
		var view = editor.View();
		var middle = canvas.getContext('2d').getImageData(Math.round(canvas.width / 2), Math.round(canvas.height / 2), 1, 1).data;
		var corner = canvas.getContext('2d').getImageData(2, 2, 1, 1).data;
		var box = editor.$Element().querySelector('.elemenx-planet-editor-view').getBoundingClientRect();
		var at = editor.At(box.left + view.Width / 2, box.top + view.Height / 2);
		var planets = Elemenx.Service('ScenePlanet');
		var under = planets.LatLon(planets.Unproject(view, view.Width / 2, view.Height / 2));

		/* The globe in the middle, nothing off it. */
		expect(middle[3]).toBe(255);
		expect(corner[3]).toBe(0);
		expect(at.Latitude).toBeCloseTo(under[0], 6);
		expect(at.Sample.Elevation).toBe(editor.Planet().Elevation(planets.Unproject(view, view.Width / 2, view.Height / 2)));

		/* Drawn again at the same size, it keeps the globe till the new picture comes (Regression: it was cleared at once). */
		editor.Render();

		expect(canvas.getContext('2d').getImageData(Math.round(canvas.width / 2), Math.round(canvas.height / 2), 1, 1).data[3]).toBe(255);
	}, 90000);

	it('draws a continent by its points on the globe, sets its fields and takes it away, each change emitted', async function () {
		var mounted = await mount({Seed: 'draw', Ocean: 0.9});
		var editor = mounted.Editor;
		var host = mounted.Host;
		var view = editor.View();
		var planets = Elemenx.Service('ScenePlanet');
		var stroke;
		var input;

		editor.Picked('land');

		await tick(20);

		press(editor, view.Width / 2 - 40, view.Height / 2 - 40);
		press(editor, view.Width / 2 + 40, view.Height / 2 - 40);
		press(editor, view.Width / 2 + 40, view.Height / 2 + 40);
		press(editor, view.Width / 2 - 40, view.Height / 2 + 40);

		expect(editor.$Element().querySelectorAll('.draft polyline').length).toBe(1);
		expect(editor.Finish()).toBe(true);

		stroke = host.Changes[host.Changes.length - 1].Paint[0];

		expect(stroke.Type).toBe('land');
		expect(stroke.Points.length).toBe(4);
		expect(stroke.Points[0][0]).toBeCloseTo(planets.LatLon(planets.Unproject(view, view.Width / 2 - 40, view.Height / 2 - 40))[0], 3);
		expect(editor.Selected).toBe(0);

		/* Land where it was drawn, on a planet of nine tenths of sea. */
		expect(editor.Planet().Land(planets.Unproject(view, view.Width / 2, view.Height / 2))).toBe(true);

		await tick(30);

		/* A field of the panel is an Input of ElemenxUI: its own field of the page told. */
		input = editor.$Element().querySelector('.elemenx-planet-editor-panel [data-key="Edge"] .elemenx-input input');
		input.value = '50';

		input.dispatchEvent(new Event('input', {bubbles: true}));
		input.dispatchEvent(new Event('change', {bubbles: true}));

		expect(host.Changes[host.Changes.length - 1].Paint[0].Edge).toBe(50);

		/* The look: a press on its outline selects it, Delete takes it away. */
		editor.Picked('look');

		editor.Selected = -1;

		press(editor, view.Width / 2, view.Height / 2 - 40);

		expect(editor.Selected).toBe(0);

		editor.Key({key: 'Delete'});

		expect(host.Changes[host.Changes.length - 1].Paint).toEqual([]);
	}, 90000);

	it('shows the winds and the plates as arrows over the globe', async function () {
		var mounted = await mount({Seed: 'show'});
		var editor = mounted.Editor;
		var before = mounted.Drawn();

		editor.Overlaid('wind');

		expect(editor.$Element().querySelectorAll('.elemenx-planet-editor-arrow').length).toBeGreaterThan(50);

		editor.Overlaid('plates');

		expect(editor.$Element().querySelectorAll('.elemenx-planet-editor-arrow').length).toBeGreaterThan(3);

		await waitFor(function () {
			return mounted.Drawn() > before;
		}, 20000);
	}, 90000);
	it('picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there', async function () {
		var mounted = await mount({Seed: 'places', Ocean: 0.5, LocationSize: 50});
		var editor = mounted.Editor;
		var host = mounted.Host;
		var view = editor.View();
		var locations = Elemenx.Service('SceneLocations');
		var opened = null;
		var select;
		var under;
		var box;
		var id;

		editor.$On('location', function (made) {
			opened = made;
		});
		editor.Picked('location');

		press(editor, view.Width / 2 + 10, view.Height / 2 - 10);

		id = editor.Place;

		box = editor.$Element().querySelector('.elemenx-planet-editor-view').getBoundingClientRect();
		under = editor.At(box.left + view.Width / 2 + 10, box.top + view.Height / 2 - 10);

		expect(id).toBe(locations.At({Seed: 'places', LocationSize: 50}, under.Latitude, under.Longitude));
		expect(editor.$Element().querySelector('[data-location="' + id + '"] polyline')).not.toBe(null);

		await tick(30);

		/* A list of the panel is a Select of ElemenxUI. */
		select = editor.$Element().querySelector('.elemenx-planet-editor-panel [data-key="Beyond"] .elemenx-select');

		Elemenx.Instance(select).Choose(Elemenx.Instance(select).Options.map(function (option) {
			return option.Value;
		}).indexOf('cliff'), select);

		expect(editor.$Element().querySelectorAll('.elemenx-planet-editor select, .elemenx-planet-editor-field > input, .elemenx-planet-editor-toolbar > button:not(.elemenx-button)').length).toBe(0);

		expect(host.Changes[host.Changes.length - 1].Locations[id].Beyond).toBe('cliff');

		editor.PassageAdded();

		expect(host.Changes[host.Changes.length - 1].Locations[id].Passages.length).toBe(1);
		expect(Object.keys(host.Changes[host.Changes.length - 1].Locations).length).toBe(2);

		editor.Opened();

		expect(opened.ID).toBe(id);
		expect(opened.Location.Beyond).toBe('cliff');
		expect(opened.Location.World.type).toBe('world');
		expect(Elemenx.Service('SceneWorld').Make(opened.Location.World).Ground.Planet.Latitude).toBeCloseTo(opened.Location.Place.Latitude, 9);
	}, 90000);

	/* On a touch screen: a bar of actions that ends a stroke, two fingers that turn the globe and bring it nearer. */
	it('ends and drops a stroke by its bar of actions, a press on the bar no point of it, and two fingers bring the globe nearer', async function () {
		var mounted = await mount({Seed: 'touch', Ocean: 0.9});
		var editor = mounted.Editor;
		var host = mounted.Host;
		var view = editor.View();
		var element = editor.$Element().querySelector('.elemenx-planet-editor-view');
		var box = element.getBoundingClientRect();
		var bar = editor.$Element().querySelector('.elemenx-view-actions');
		var zoom;
		var button = function (title) {
			return Array.prototype.find.call(bar.querySelectorAll('button'), function (node) {
				return node.getAttribute('title') === title || node.getAttribute('aria-label') === title;
			});
		};
		var finger = function (type, id, x, y) {
			element.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: box.left + x, clientY: box.top + y, pointerId: id, pointerType: 'touch'}));
		};

		editor.Picked('land');

		await tick(20);

		bar = editor.$Element().querySelector('.elemenx-view-actions');

		press(editor, view.Width / 2 - 40, view.Height / 2 - 40);
		press(editor, view.Width / 2 + 40, view.Height / 2 - 40);
		press(editor, view.Width / 2 + 40, view.Height / 2 + 40);

		/* A press on the bar is no point of the stroke. */
		['pointerdown', 'pointerup'].forEach(function (type) {
			button('Done').dispatchEvent(new PointerEvent(type, {bubbles: true, pointerId: 1, button: 0}));
		});

		button('Done').click();

		await tick(20);

		expect(host.Changes[host.Changes.length - 1].Paint[0].Points.length).toBe(3);
		expect(editor.Selected).toBe(0);

		button('Delete').click();

		await tick(20);

		expect(host.Changes[host.Changes.length - 1].Paint).toEqual([]);

		zoom = editor.Own().View.Zoom;

		finger('pointerdown', 11, view.Width / 2 - 50, view.Height / 2);
		finger('pointerdown', 12, view.Width / 2 + 50, view.Height / 2);
		finger('pointermove', 11, view.Width / 2 - 100, view.Height / 2);
		finger('pointermove', 12, view.Width / 2 + 100, view.Height / 2);

		/* The globe is nearer at once (drawn of the map of the planet), the picture of the view coming again when it rests. */
		expect(editor.Own().View.Zoom).toBeGreaterThan(zoom * 1.5);

		finger('pointerup', 11, view.Width / 2 - 100, view.Height / 2);
		finger('pointerup', 12, view.Width / 2 + 100, view.Height / 2);

		expect(editor.$Element().querySelector('.elemenx-planet-editor-canvas').style.transform).toBe('');
		expect(editor.Own().View.Zoom).toBeGreaterThan(zoom * 1.5);
		expect(editor.Own().Draft).toEqual([]);
	}, 90000);

	/* The brushes of its relief: a drag paints an edit along its path, one step to undo and redo. */
	it('paints the relief with a brush along a drag, an edit of the planet, and undoes and redoes it', async function () {
		var mounted = await mount({Seed: 'brush', Ocean: 0.6});
		var editor = mounted.Editor;
		var host = mounted.Host;
		var view = editor.View();
		var element = editor.$Element().querySelector('.elemenx-planet-editor-view');
		var box = element.getBoundingClientRect();
		var under;
		var before;
		var edit;
		var pointer = function (type, x, y) {
			element.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: box.left + x, clientY: box.top + y, pointerId: 1, button: 0}));
		};

		editor.Picked('raise');
		editor.BrushChanged('Radius', 300);

		await tick(20);

		expect(editor.$Element().querySelector('.elemenx-planet-editor-panel [data-key="Amount"]')).not.toBe(null);

		under = editor.At(box.left + view.Width / 2, box.top + view.Height / 2);
		before = editor.Planet().Elevation(under.Sample.Direction);

		pointer('pointerdown', view.Width / 2 - 60, view.Height / 2);
		pointer('pointermove', view.Width / 2 - 20, view.Height / 2);
		pointer('pointermove', view.Width / 2 + 20, view.Height / 2);
		pointer('pointerup', view.Width / 2 + 60, view.Height / 2);

		edit = host.Changes[host.Changes.length - 1].Edits[0];

		expect(edit.Type).toBe('raise');
		expect(edit.Radius).toBe(300);
		expect(edit.Amount).toBe(800);
		expect(edit.Points.length).toBeGreaterThan(1);
		expect(editor.Planet().Elevation(under.Sample.Direction)).toBeGreaterThan(before + 400);

		editor.Undo();

		expect(host.Changes[host.Changes.length - 1].Edits).toBeUndefined();
		expect(editor.Planet().Elevation(under.Sample.Direction)).toBe(before);

		editor.Key({key: 'y', ctrlKey: true, preventDefault: function () {}});

		expect(host.Changes[host.Changes.length - 1].Edits.length).toBe(1);
	}, 90000);

	/* The rules of detail: a region drawn with its rule, a rule of a biome, and the graph of a rule edited, the planet's own. */
	it('draws a region of a rule, sets the rule of a biome, and edits the graph of a rule into one of the planet', async function () {
		var mounted = await mount({Seed: 'ruled', Ocean: 0.5});
		var editor = mounted.Editor;
		var host = mounted.Host;
		var view = editor.View();
		var last = function () {
			return host.Changes[host.Changes.length - 1];
		};
		var graph;

		editor.Picked('rule');

		editor.RuleName = 'dunes';

		await tick(20);

		press(editor, view.Width / 2 - 40, view.Height / 2 - 40);
		press(editor, view.Width / 2 + 40, view.Height / 2 - 40);
		press(editor, view.Width / 2 + 40, view.Height / 2 + 40);

		expect(editor.Finish()).toBe(true);
		expect(last().Regions[0].Rule).toBe('dunes');
		expect(last().Regions[0].Points.length).toBe(3);
		expect(last().Paint).toEqual([]);

		await tick(20);

		expect(editor.$Element().querySelectorAll('.elemenx-planet-editor-marks .region').length).toBe(1);
		expect(editor.$Element().querySelector('.elemenx-planet-editor-rule[data-region="0"]')).not.toBe(null);

		editor.BiomeRuled('desert', 'mesas');

		expect(last().Rules.Biomes).toEqual({desert: 'mesas'});

		/* The graph of a rule of the library open under the view; changed, a copy of it is the planet's own. */
		editor.RuleOpened('mesas');

		await tick(40);

		expect(editor.$Element().querySelector('.elemenx-planet-editor-graph .elemenx-blueprint, .elemenx-planet-editor-graph [class*="blueprint"]')).not.toBe(null);

		graph = JSON.parse(JSON.stringify(editor.RuleGraph()));

		graph.parameters.forEach(function (parameter) {
			if (parameter.key === 'Step')
				parameter.value = 90;
		});

		editor.RuleDrawn(graph);

		expect(last().Rules.Graphs.mesas.parameters.filter(function (parameter) {
			return parameter.key === 'Step';
		})[0].value).toBe(90);
		expect(Elemenx.Service('ScenePlanet').Rules.mesas.parameters.filter(function (parameter) {
			return parameter.key === 'Step';
		})[0].value).toBe(180);
		expect(editor.RuleOptions().filter(function (option) {
			return option.Value === 'mesas';
		})[0].Label).toBe('mesas *');
	}, 90000);

	/*
	 * Regression: the picture of before was moved as a flat image when the globe turned (wrong at any latitude: black
	 * stripes, coasts that did not meet), the globe stopped at its poles and could not be turned round the view.
	 */
	it('turns the globe as a ball: over its poles, round the middle of the view, north up again, its marks where its points are', async function () {
		var mounted = await mount({Seed: 'turn', Ocean: 0.6});
		var editor = mounted.Editor;
		var planets = Elemenx.Service('ScenePlanet');
		var view;
		var direction;
		var back;
		var i;

		editor.SetView({Yaw: 0, Pitch: 1.2, Zoom: 1});

		/* Over the north pole and on: the middle of the view goes down the other side. */
		for (i = 0; i < 10; i++)
			editor.Turn(0, -0.1, 0);

		view = editor.View();

		expect(view.Pitch).toBeLessThan(1.2);
		expect(Math.abs(Math.abs(view.Yaw) - Math.PI)).toBeLessThan(0.05);

		editor.Turn(0, 0, 0.5);

		expect(editor.Roll()).not.toBeCloseTo(0, 2);

		editor.NorthUp();

		expect(editor.Roll()).toBeCloseTo(0, 5);

		/* What is drawn and what is pointed at are the same point of the planet, however the view is turned. */
		editor.Turn(0.3, 0.7, 1.1);

		view = editor.View();
		direction = planets.Unproject(view, view.Width * 0.6, view.Height * 0.4);
		back = planets.Project(view, direction);

		expect(back[0]).toBeCloseTo(view.Width * 0.6, 5);
		expect(back[1]).toBeCloseTo(view.Height * 0.4, 5);
		expect(editor.$Element().querySelector('.elemenx-planet-editor-canvas').style.transform).toBe('');

		/* The globe under the picture: of the map of all the planet, drawn by WebGL. */
		await waitFor(function () {
			return editor.Own().MapTexture;
		}, 30000);
	}, 90000);

	/*
	 * Its settlements and rivers as a Scene and a bake make them, changed in its Places: a village added where a press was,
	 * of another kind, moved by a drag, removed by Delete; a river drawn by presses and removed; undone.
	 */
	it('shows the settlements and rivers its planet makes and changes them in its Places, laid over them again', async function () {
		var made = await mount({Seed: 'places', Ocean: 0.4});
		var editor = made.Editor;
		var host = made.Host;
		var planets = Elemenx.Service('ScenePlanet');
		var view = editor.$Element().querySelector('.elemenx-planet-editor-view');
		var marks = editor.$Element().querySelector('.elemenx-planet-editor-marks');
		var first;
		var spot = null;
		var x;
		var y;

		function last () {
			return host.Changes[host.Changes.length - 1];
		}

		function pointer (type, at) {
			var box = view.getBoundingClientRect();

			view.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: box.left + at[0], clientY: box.top + at[1], pointerId: 1, button: 0}));
		}

		/* A pixel of the globe away from any settlement and river: a place to add one. */
		function free () {
			var box = view.getBoundingClientRect();
			var tool = editor.Tool;
			var found = null;

			for (y = 60; y < 320 && !found; y += 17) {
				for (x = 140; x < 360 && !found; x += 17) {
					editor.Tool = 'settlements';

					var town = editor.PlaceAt(box.left + x, box.top + y);

					editor.Tool = 'streams';

					if (!town && !editor.PlaceAt(box.left + x, box.top + y) && editor.At(box.left + x, box.top + y))
						found = [x, y];
				}
			}

			editor.Tool = tool;

			return found;
		}

		editor.Picked('settlements');

		/* Made in workers: its rivers of its heights, its settlements of them, shown when they came. */
		expect(await waitFor(function () {
			return editor.Laid();
		}, 100000)).toBeTruthy();

		first = editor.Laid();

		expect(first.Towns.length).toBeGreaterThan(5);
		expect(first.Rivers.length).toBeGreaterThan(5);
		expect(editor.Making).toBe('');
		expect(marks.querySelectorAll('circle.elemenx-planet-editor-town').length).toBeGreaterThan(0);
		expect(marks.querySelectorAll('polyline.elemenx-planet-editor-course').length).toBeGreaterThan(0);

		/* A press where none is: a village added there, selected. */
		spot = free();

		expect(spot).not.toBeNull();

		pointer('pointerdown', spot);
		pointer('pointerup', spot);

		expect(last().Places.Towns).toEqual([{Op: 'add', Point: expect.any(Array), Kind: 'village', Size: 0.5}]);
		expect(editor.Laid().Towns.length).toBe(first.Towns.length + 1);
		expect(editor.PlaceSelected).toEqual({Kind: 'town', Index: first.Towns.length});
		expect(editor.PlaceOf()).toEqual({Kind: 'town', Of: 'village'});

		/* Of another kind, from the panel. */
		editor.PlaceKind('city');

		expect(last().Places.Towns[1]).toEqual({Op: 'kind', At: expect.any(Array), Kind: 'city'});

		last().Places.Towns[1].At.forEach(function (value, axis) {
			expect(value).toBeCloseTo(last().Places.Towns[0].Point[axis], 6);
		});

		expect(editor.Laid().Towns[first.Towns.length].Kind).toBe('city');

		/* Carried by a drag 30 pixels aside: moved there. */
		var at = planets.Project(editor.View(), editor.Laid().Towns[first.Towns.length].Point);

		pointer('pointerdown', [at[0], at[1]]);
		pointer('pointermove', [at[0] + 15, at[1]]);
		pointer('pointermove', [at[0] + 30, at[1]]);
		pointer('pointerup', [at[0] + 30, at[1]]);

		expect(last().Places.Towns[2].Op).toBe('move');

		var moved = planets.Project(editor.View(), editor.Laid().Towns[first.Towns.length].Point);

		expect(Math.hypot(moved[0] - at[0] - 30, moved[1] - at[1])).toBeLessThan(2);

		/* Removed by Delete. */
		view.dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, key: 'Delete'}));

		expect(last().Places.Towns[3]).toEqual({Op: 'remove', At: expect.any(Array)});
		expect(editor.Laid().Towns.length).toBe(first.Towns.length);
		expect(editor.PlaceSelected).toBeNull();

		/* A river drawn by presses where no river is, ended by Enter: its course added, as long as it was drawn. */
		editor.Picked('streams');

		spot = free();

		pointer('pointerdown', spot);
		pointer('pointerup', spot);
		pointer('pointerdown', [spot[0] + 25, spot[1] + 10]);
		pointer('pointerup', [spot[0] + 25, spot[1] + 10]);

		view.dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, key: 'Enter'}));

		expect(last().Places.Rivers).toEqual([{Op: 'add', Points: [expect.any(Array), expect.any(Array)], Flow: 200}]);
		expect(editor.Laid().Rivers.length).toBe(first.Rivers.length + 1);
		expect(editor.PlaceOf()).toEqual({Kind: 'river', Flow: 200});
		expect(marks.querySelectorAll('polyline.elemenx-planet-editor-course.drawn').length).toBeGreaterThan(0);

		/* Removed, and undone. */
		editor.PlaceRemoved();

		expect(last().Places.Rivers[1]).toEqual({Op: 'remove', At: expect.any(Array)});
		expect(editor.Laid().Rivers.length).toBe(first.Rivers.length);

		editor.Undo();

		expect(editor.Laid().Rivers.length).toBe(first.Rivers.length + 1);
	}, 160000);
});
