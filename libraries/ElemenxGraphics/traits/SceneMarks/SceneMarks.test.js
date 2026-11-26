import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (inside) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('MarksHost'), {$Template: '<div style="width: 640px; height: 400px"><Scene Paused="true" Quality="low" (ready)="Ready" (markcluster)="Told">' +
		'<SceneObject ID="sun" Kind="star" Name="Sun"><SceneObject ID="earth" Kind="planet" Name="Earth" Distance="1" /></SceneObject>' + (inside || '') +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}, Told: function (event) {
		told.push(event);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return {Scene: ready, Told: told};
}

/* An element as a game puts one over the scene: in its HUD, of a size of its own. */
function box (scene, text) {
	var element = document.createElement('div');

	element.textContent = text;
	element.style.cssText = 'width: 60px; height: 18px';

	scene.$Element().querySelector('.elemenx-scene-hud').appendChild(element);

	return element;
}

function of (scene, key) {
	return scene.MarksOnScreen().filter(function (one) {
		return one.Key === key;
	})[0];
}

describe('Contract: the marks of a Scene (SceneMarks, SceneMark): elements over places of it, laid out each frame', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'SceneMark', 'service:Renderer', 'service:Meshes', 'service:Astronomy', 'service:Noise', 'service:Random']);
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function frames (scene, count) {
		var i;

		for (i = 0; i < count; i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
	}

	/* The view at a distance from the sun along Z, the sun in the middle. */
	function look (scene) {
		var sun = scene.Scene().Objects.sun;

		scene.SetViewpoint({Target: sun.World.slice(), Yaw: 0, Pitch: 0, Distance: sun.Size * 20});

		frames(scene, 2);

		return sun;
	}

	it('puts an element over its point, moves another off it with a line, and the names of the objects are marks too', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var sun = look(scene);
		var point = [sun.World[0] + sun.Size * 4, sun.World[1], sun.World[2]];
		var a = box(scene, 'A');
		var b = box(scene, 'B');
		var spot;
		var first;
		var second;

		expect(scene.Mark('a', {Element: a, Point: point})).toBe('a');

		scene.Mark('b', {Element: b, Point: point, Priority: -1});

		frames(scene, 2);

		spot = scene.Engine().Project(point);
		first = of(scene, 'a');
		second = of(scene, 'b');

		expect(first.Shown).toBe(true);
		expect(first.Moved).toBe(0);
		/* Its foot in the middle on the point. */
		expect(Math.abs(first.X - spot.X)).toBeLessThan(1);
		expect(a.style.transform).toBe('translate(' + Math.round(spot.X - 30) + 'px, ' + Math.round(spot.Y - 18) + 'px)');
		expect(second.Shown).toBe(true);
		expect(Math.abs(second.Moved)).toBeGreaterThan(17);
		expect(scene.$Element().querySelector('.elemenx-scene-marks-line').getAttribute('d')).toMatch(/^M\d+ \d+L\d+ \d+$/);

		/* The names of the objects are among them. */
		expect(of(scene, 'label:earth')).toBeTruthy();
		expect(scene.$Element().querySelector('.elemenx-scene-label[data-id="sun"]').getAttribute('data-elemenx-mark')).toBe('label:sun');

		/* Taken away: no longer laid out, its transform cleared. */
		scene.Unmark('b');

		frames(scene, 1);

		expect(of(scene, 'b')).toBe(undefined);
		expect(b.style.transform).toBe('');
		expect(function () {
			scene.Mark('c', {Point: point});
		}).toThrow('Elemenx Scene: Mark expects (key, {Element, Object or Point or At})');
	});

	/* Regression: its point of this frame was kept where the Point of the options is: a mark of an object stayed where it was the first frame. */
	it('follows its object as it goes round its star', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var earth;
		var before;
		var after;
		var spot;

		look(scene);

		scene.SetViewpoint({Target: scene.Scene().Objects.sun.World.slice(), Yaw: 0, Pitch: 1.2, Distance: 60});
		scene.Mark('earth', {Element: box(scene, 'earth'), Object: 'earth', Up: 0, Align: 'center', Declutter: false, Occlude: false});

		frames(scene, 2);

		before = of(scene, 'earth');

		scene.SetTime(scene.Now() + 120);

		frames(scene, 2);

		earth = scene.Scene().Objects.earth;
		spot = scene.Engine().Project(earth.World);
		after = of(scene, 'earth');

		expect(Math.hypot(after.X - before.X, after.Y - before.Y)).toBeGreaterThan(20);
		expect(Math.abs(after.X - spot.X)).toBeLessThan(2);
		expect(Math.abs(after.Y + 9 - spot.Y)).toBeLessThan(2);
	});

	it('hides one behind a body, one too far; one behind the eye shows at the edge with an arrow when it may', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var sun = look(scene);
		var eye = scene.Scene().Camera.Position;
		var behind = [sun.World[0], sun.World[1], sun.World[2] - sun.Size * 3];
		var back = [eye[0], eye[1], eye[2] + sun.Size * 10];
		var shown;

		scene.Mark('covered', {Element: box(scene, 'covered'), Point: behind, Occlude: true});
		scene.Mark('far', {Element: box(scene, 'far'), Point: [sun.World[0], sun.World[1] + sun.Size * 2, sun.World[2]], Far: sun.Size * 5, Declutter: false});
		scene.Mark('back', {Element: box(scene, 'back'), Point: back});
		scene.Mark('edge', {Element: box(scene, 'edge'), Point: back, Edge: true});

		frames(scene, 2);


		expect(of(scene, 'covered').Why).toBe('hidden');
		expect(of(scene, 'far').Why).toBe('far');
		expect(of(scene, 'back').Why).toBe('behind');

		shown = of(scene, 'edge');

		expect(shown.Shown).toBe(true);
		expect(shown.Edge).toBe(true);
		expect(scene.$Element().querySelector('[data-elemenx-mark="edge"]').getAttribute('data-edge')).toBe('true');
		expect(scene.$Element().querySelector('.elemenx-scene-marks-arrow').getAttribute('d')).toMatch(/^M-?\d+ -?\d+L-?\d+ -?\d+L-?\d+ -?\d+Z$/);
		/* Within the view. */
		expect(shown.X).toBeGreaterThanOrEqual(0);
		expect(shown.X).toBeLessThanOrEqual(640);
		expect(shown.Y).toBeGreaterThanOrEqual(0);
		expect(shown.Y).toBeLessThanOrEqual(400);
	});

	it('shows marks of a cluster near each other as one with a badge +N, a press on it told', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var sun = look(scene);
		var badge;
		var i;

		for (i = 0; i < 3; i++)
			scene.Mark('ship' + i, {Element: box(scene, 'ship ' + i), Point: [sun.World[0] + sun.Size * (4 + i * 0.05), sun.World[1] + sun.Size * 3, sun.World[2]], Cluster: 'fleet'});

		frames(scene, 2);

		expect(scene.MarksOnScreen().filter(function (one) {
			return one.Cluster === 'fleet' && one.Shown;
		}).length).toBe(1);
		expect(of(scene, 'ship0').Count).toBe(3);
		expect(of(scene, 'ship1').Why).toBe('clustered');

		badge = scene.$Element().querySelector('.elemenx-scene-mark-cluster');

		expect(badge.hidden).toBe(false);
		expect(badge.textContent).toBe('+2');

		badge.click();

		expect(mounted.Told).toEqual([{Cluster: 'fleet', Keys: ['ship0', 'ship1', 'ship2']}]);
	});

	it('lays out what a SceneMark holds over its object, as its props say', async function () {
		var mounted = await mount('<SceneMark slot="hud" Key="earth-card" For="earth" Line="true" Occlude="false"><span class="mark-card">Earth card</span></SceneMark>');
		var scene = mounted.Scene;
		var shown;

		look(scene);

		await waitFor(function () {
			frames(scene, 1);

			return of(scene, 'earth-card');
		}, 4000);

		shown = of(scene, 'earth-card');

		expect(shown.Shown).toBe(true);
		expect(scene.$Element().querySelector('[data-elemenx-mark="earth-card"] .mark-card').textContent).toBe('Earth card');
		expect(scene.$Element().querySelector('.elemenx-scene-marks-line').getAttribute('d')).toContain('M');
	});
});
