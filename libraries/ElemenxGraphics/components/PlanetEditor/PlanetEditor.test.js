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

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && drawn;
	}, 20000);

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

	it('paints the globe of the planet in workers, each pixel of it, and tells the point under the pointer', async function () {
		var mounted = await mount({Seed: 'editor', Ocean: 0.6});
		var editor = mounted.Editor;
		var canvas = editor.$Element().querySelector('canvas');
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
	}, 45000);

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

		input = editor.$Element().querySelector('.elemenx-planet-editor-panel input[data-key="Edge"]');
		input.value = '50';

		input.dispatchEvent(new Event('change', {bubbles: true}));

		expect(host.Changes[host.Changes.length - 1].Paint[0].Edge).toBe(50);

		/* The look: a press on its outline selects it, Delete takes it away. */
		editor.Picked('look');

		editor.Selected = -1;

		press(editor, view.Width / 2, view.Height / 2 - 40);

		expect(editor.Selected).toBe(0);

		editor.Key({key: 'Delete'});

		expect(host.Changes[host.Changes.length - 1].Paint).toEqual([]);
	}, 45000);

	it('shows the winds and the plates as arrows over the globe', async function () {
		var mounted = await mount({Seed: 'show'});
		var editor = mounted.Editor;
		var before = mounted.Drawn();

		editor.Overlaid({target: {value: 'wind'}});

		expect(editor.$Element().querySelectorAll('.elemenx-planet-editor-arrow').length).toBeGreaterThan(50);

		editor.Overlaid({target: {value: 'plates'}});

		expect(editor.$Element().querySelectorAll('.elemenx-planet-editor-arrow').length).toBeGreaterThan(3);

		await waitFor(function () {
			return mounted.Drawn() > before;
		}, 20000);
	});
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

		select = editor.$Element().querySelector('.elemenx-planet-editor-panel select[data-key="Beyond"]');
		select.value = 'cliff';

		select.dispatchEvent(new Event('change', {bubbles: true}));

		expect(host.Changes[host.Changes.length - 1].Locations[id].Beyond).toBe('cliff');

		editor.PassageAdded();

		expect(host.Changes[host.Changes.length - 1].Locations[id].Passages.length).toBe(1);
		expect(Object.keys(host.Changes[host.Changes.length - 1].Locations).length).toBe(2);

		editor.Opened();

		expect(opened.ID).toBe(id);
		expect(opened.Location.Beyond).toBe('cliff');
		expect(opened.Location.World.type).toBe('world');
		expect(Elemenx.Service('SceneWorld').Make(opened.Location.World).Ground.Planet.Latitude).toBeCloseTo(opened.Location.Place.Latitude, 9);
	});
});
