import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var added = [];

async function mount (quality) {
	var ready = null;
	var component = Elemenx.Component(unique('ScreensHost'), {$Template: '<div style="width: 400px; height: 260px"><Scene Paused="true" Quality="' + (quality || 'high') + '" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" Elevation="50" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

/* Something of the page, out of sight but laid out: its HTML, its styles. */
function element (html, css) {
	var holder = document.createElement('div');
	var style = document.createElement('style');

	style.textContent = css || '';
	holder.style.cssText = 'position: fixed; left: -5000px; top: 0';
	holder.innerHTML = html;

	document.head.appendChild(style);
	document.body.appendChild(holder);

	added.push(holder, style);

	return holder.firstElementChild;
}

/* The picture of an element as Rasterize makes it: its pixels [r, g, b, a] at a point. */
function rasterize (engine, target, width, height) {
	return new Promise(function (resolve, reject) {
		engine.Rasterize(target, width, height, function (error, canvas) {
			if (error) {
				reject(error);

				return;
			}

			resolve(function (x, y) {
				return Array.prototype.slice.call(canvas.getContext('2d').getImageData(x, y, 1, 1).data);
			});
		});
	});
}

describe('Contract: the screens of a Scene, pictures of a camera, a canvas, an image or an element of the page', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		while (added.length) added.pop().remove();
	});

	function frame (scene, count) {
		var i;

		for (i = 0; i < (count || 1); i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
	}

	/* A point of the canvas where a screen shows a part of it (u, v from its left and its top), found by ScreenAt. */
	function pointOf (scene, id, u, v) {
		var box = scene.$Element().querySelector('canvas').getBoundingClientRect();
		var best = null;
		var x;
		var y;

		for (y = 0; y < box.height; y += 2) {
			for (x = 0; x < box.width; x += 2) {
				var hit = scene.ScreenAt(box.left + x, box.top + y);

				if (hit && hit.ID === id) {
					var far = Math.hypot(hit.U - u, hit.V - v);
					if (!best || far < best.Far)
						best = {X: box.left + x, Y: box.top + y, Far: far};
				}
			}
		}

		return best;
	}

	function press (scene, point, type) {
		var canvas = scene.$Element().querySelector('canvas');

		canvas.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: point.X, clientY: point.Y, pointerId: 1, button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true}));
	}

	it('shows an element of the page, and what the pointer does on it goes to what lies under it there; a field pressed takes the keys', async function () {
		var scene = await mount();
		var panel = element('<div id="screen-panel" style="width: 320px; height: 180px; background: #123; color: #fff; font: 20px sans-serif; display: flex; gap: 0"><button id="screen-left" style="width: 160px; height: 180px; margin: 0; border: 0; background: #800">left</button><input id="screen-field" style="width: 160px; height: 180px; margin: 0; border: 0; box-sizing: border-box"></div>');
		var pressed = 0;

		panel.querySelector('#screen-left').addEventListener('click', function () {
			pressed++;
		});

		scene.Add('screen', {ID: 'panel', X: 0, Y: 0, Lift: 1.5, Width: 1.6, Height: 0.9, Element: '#screen-panel'});
		scene.SetViewpoint({Target: [0, 1.5, 0], Yaw: 0, Pitch: 0, Distance: 2.4});

		/*
		 * Regression: under load the view had not come to its distance yet (it eases there frame by frame): the panel was
		 * partly out of the canvas and the point a quarter across it not on it. The view is put at its distance at once.
		 */
		scene.Scene().Wanted = 2.4;
		scene.Scene().Distance = 2.4;

		await waitFor(function () {
			frame(scene, 1);

			return !!scene.Engine().ScreenPicture(scene.Get('panel'));
		}, 30000);

		var left = pointOf(scene, 'panel', 0.25, 0.5);
		var right = pointOf(scene, 'panel', 0.75, 0.5);

		expect(left.Far).toBeLessThan(0.05);
		expect(scene.ScreenAt(left.X, left.Y).ID).toBe('panel');

		press(scene, left, 'pointerdown');
		press(scene, left, 'pointerup');

		expect(pressed).toBe(1);

		press(scene, right, 'pointerdown');
		press(scene, right, 'pointerup');

		expect(document.activeElement).toBe(panel.querySelector('#screen-field'));

		/* A key typed there is the field's, not the scene's. */
		expect(scene.ScreenTyped({target: panel.querySelector('#screen-field')})).toBe(true);
		expect(scene.ScreenTyped({target: scene.$Element()})).toBe(false);
	}, 60000);

	it('draws the picture of an element over what is behind it where it is clear, the depth of it written, nothing until it came; a camera\'s opaque', async function () {
		var scene = await mount();
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var draws = [];
		var hud = element('<div id="screen-hud" style="width: 200px; height: 100px; color: #ff0; font: bold 30px sans-serif">HUD</div>');

		renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms && uniforms.uClear !== undefined && uniforms.uFlip !== undefined)
				draws.push({Clear: uniforms.uClear, Blend: options && options.Blend, Depth: options && options.DepthWrite});

			return draw.apply(this, arguments);
		};

		try {
			scene.Add('screen', {ID: 'hud', X: 0, Y: 0, Lift: 1.5, Element: '#screen-hud'});

			frame(scene, 1);

			expect(draws.length).toBe(0);

			await waitFor(function () {
				frame(scene, 1);

				return draws.length > 0;
			}, 10000);

			expect(draws[draws.length - 1]).toEqual({Clear: 1, Blend: 'veil', Depth: undefined});

			scene.Remove('hud');
			scene.Add('camera', {ID: 'cam', X: 5, Y: 5});
			scene.Add('screen', {ID: 'tv', X: 0, Y: 0, Lift: 1.5, Camera: 'cam'});

			draws = [];

			frame(scene, 1);

			expect(draws[0]).toEqual({Clear: 0, Blend: undefined, Depth: undefined});
		}
		finally {
			renderer.Draw = draw;
		}
	});

	it('shows what a camera of the scene sees at medium and over, as many as the quality allows, none at low', async function () {
		var high = await mount('high');

		high.Add('camera', {ID: 'cam', X: 10, Y: 10, Lift: 3});
		['a', 'b', 'c'].forEach(function (id, index) {
			high.Add('screen', {ID: id, X: index * 2 - 2, Y: 0, Lift: 1.5, Camera: 'cam'});
		});
		high.SetViewpoint({Target: [0, 1.5, 0], Yaw: 0, Pitch: 0, Distance: 6});

		high.Scene().Wanted = 6;

		frame(high, 3);

		var shown = ['a', 'b', 'c'].filter(function (id) {
			var picture = high.Engine().ScreenPicture(high.Get(id));

			return picture && picture.Flip;
		});

		expect(shown.length).toBe(2);

		var low = await mount('low');

		low.Add('camera', {ID: 'cam', X: 10, Y: 10, Lift: 3});
		low.Add('screen', {ID: 'a', X: 0, Y: 0, Lift: 1.5, Camera: 'cam'});

		frame(low, 3);

		expect(low.Engine().ScreenPicture(low.Get('a'))).toBe(null);
	});

	it('shows a canvas of the page as it is drawn', async function () {
		var scene = await mount();
		var canvas = document.createElement('canvas');

		canvas.width = 64;
		canvas.height = 32;
		canvas.getContext('2d').fillStyle = '#f00';

		canvas.getContext('2d').fillRect(0, 0, 64, 32);

		canvas.id = 'screen-canvas';
		canvas.style.cssText = 'position: fixed; left: -5000px';

		document.body.appendChild(canvas);

		added.push(canvas);

		scene.Add('screen', {ID: 'art', X: 0, Y: 0, Lift: 1.5, Canvas: '#screen-canvas', Every: 0});

		frame(scene, 1);

		expect(scene.Engine().ScreenPicture(scene.Get('art')).Texture).toBeTruthy();
	});

	/* Regressions of the picture of an element: each was drawn otherwise than the page shows it. */
	it('draws an element as the page shows it: the rules of the page for all, pseudo elements, placeholders, typed values, a table with a caption, a picture of an address, put out of sight', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var picture;

		/* A rule for all (* {box-sizing: border-box}) was read as what a div has by itself, and the picture had none of it. */
		var boxed = element('<div class="raster-boxed"><div class="raster-box"></div></div>', '.raster-boxed * { box-sizing: border-box } .raster-boxed { width: 200px; height: 40px; background: #fff } .raster-box { width: 100px; height: 40px; padding: 20px; background: #f00 }');

		picture = await rasterize(engine, boxed, 200, 40);

		expect(picture(90, 20).slice(0, 3)).toEqual([255, 0, 0]);
		expect(picture(130, 20).slice(0, 3)).toEqual([255, 255, 255]);

		/* What ::before shows, and the color of a placeholder. */
		var marked = element('<div class="raster-marked"><input class="raster-field" placeholder="WWWWWWWW"></div>', '.raster-marked { width: 200px; height: 40px; background: #fff; position: relative } .raster-marked::before { content: ""; position: absolute; left: 0; top: 0; width: 20px; height: 40px; background: #00f } .raster-field { position: absolute; left: 40px; top: 0; width: 160px; height: 40px; border: 0; background: #fff; font: bold 30px sans-serif; padding: 0 } .raster-field::placeholder { color: #0c0; opacity: 1 }');

		picture = await rasterize(engine, marked, 200, 40);

		expect(picture(10, 20).slice(0, 3)).toEqual([0, 0, 255]);

		var green = 0;
		var x;

		for (x = 40; x < 200; x++) {
			var pixel = picture(x, 20);
			if (pixel[1] > 150 && pixel[0] < 80)
				green++;
		}

		expect(green).toBeGreaterThan(5);

		/* What is typed into a field, and a box ticked. */
		var typed = element('<div style="width: 200px; height: 40px; background: #fff"><input class="raster-typed" style="width: 200px; height: 40px; border: 0; padding: 0; font: bold 30px sans-serif; color: #000; background: #fff"></div>');

		typed.querySelector('input').value = 'WWWWW';
		picture = await rasterize(engine, typed, 200, 40);

		var dark = 0;

		for (x = 0; x < 200; x++) {
			if (picture(x, 20)[0] < 80)
				dark++;
		}

		expect(dark).toBeGreaterThan(10);

		/* A table with a caption: its height counts the caption, its rows were stretched by it. */
		var table = element('<table style="border-collapse: collapse; width: 100px"><caption style="height: 20px; background: #fff">c</caption><tr style="height: 20px; background: #f00"><td></td></tr><tr style="height: 20px; background: #00f"><td></td></tr></table>');

		picture = await rasterize(engine, table, 100, table.offsetHeight);

		expect(picture(50, 30).slice(0, 3)).toEqual([255, 0, 0]);
		expect(picture(50, 50).slice(0, 3)).toEqual([0, 0, 255]);

		/* A picture of an address: a picture of an SVG fetches nothing, the address goes in it as data. */
		var source = document.createElement('canvas');

		source.width = 4;
		source.height = 4;
		source.getContext('2d').fillStyle = '#0f0';

		source.getContext('2d').fillRect(0, 0, 4, 4);

		var address = await new Promise(function (resolve) {
			source.toBlob(function (blob) {
				resolve(URL.createObjectURL(blob));
			});
		});
		var shown = element('<div style="width: 40px; height: 40px"><img style="display: block; width: 40px; height: 40px"></div>');

		shown.querySelector('img').src = address;

		await waitFor(function () {
			return shown.querySelector('img').complete;
		}, 4000);

		picture = await rasterize(engine, shown, 40, 40);

		expect(picture(20, 20).slice(0, 3)).toEqual([0, 255, 0]);
	});
});
