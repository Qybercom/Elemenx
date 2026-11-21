import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];
var clock = 0;
var now = Date.now;

async function mount (value) {
	var told = [];
	var component = Elemenx.Component(unique('SwipeHost'), {$Template: '<div class="pad" style="width: 300px; height: 200px" *swipe="Options" (swipemove)="Told" (swipe)="Told" (swipecancel)="Told"><input class="field" /></div>', Options: value, Told: function (event) {
		told.push([event.type, event.detail]);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(20);

	return {Pad: component.$Element().querySelector('.pad') || component.$Element(), Told: told};
}

/* A finger (or a mouse) down at a point, moved along points ms apart, lifted. */
function drag (target, points, gap, type) {
	var kind = type || 'touch';

	function send (name, point) {
		target.dispatchEvent(new PointerEvent(name, {pointerId: 7, pointerType: kind, clientX: point[0], clientY: point[1], button: 0, bubbles: true}));
	}

	send('pointerdown', points[0]);

	points.slice(1).forEach(function (point) {
		clock += gap;

		send('pointermove', point);
	});

	clock += gap;

	send('pointerup', points[points.length - 1]);
}

function names (told) {
	return told.map(function (one) {
		return one[0];
	});
}

/*
 * *swipe: an element follows a finger along its axis (swipemove), and tells the end of the move: swipe past Threshold or
 * flicked, swipecancel if not; across its axis the page scrolls (none of it told); a field, and a mouse without Mouse,
 * are left alone. Regression: it recognized the finger by a code of its own beside the Gestures Service; it is of its
 * Recognizer now, its events as they were.
 */
describe('Contract: *swipe, an element that follows a finger along an axis and tells the end of the move', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['*swipe']);
	});

	beforeEach(function () {
		resetDOM();

		clock = 1000;
		Date.now = function () {
			return clock;
		};
	});

	afterEach(function () {
		Date.now = now;

		while (owned.length) owned.pop().$Destroy();
	});

	it('follows a finger along x and swipes past its threshold, the way it went', async function () {
		var made = await mount('x');

		drag(made.Pad, [[100, 100], [110, 101], [140, 102], [170, 103]], 60);

		expect(names(made.Told)).toEqual(['swipemove', 'swipemove', 'swipemove', 'swipe']);
		expect(made.Told[1][1]).toEqual({DX: 40, DY: 0});
		expect(made.Told[3][1]).toEqual({Direction: 'right', DX: 70, DY: 0});
		expect(made.Pad.style.touchAction).toBe('pan-y pinch-zoom');
	});

	it('cancels a short slow move, swipes a short flick, and up along y', async function () {
		var made = await mount({Axis: 'x', Threshold: 40});

		drag(made.Pad, [[100, 100], [108, 100], [116, 100], [125, 100]], 200);

		expect(names(made.Told).pop()).toBe('swipecancel');

		made.Told.length = 0;

		drag(made.Pad, [[100, 100], [92, 100], [80, 100]], 5);

		expect(made.Told.pop()).toEqual(['swipe', {Direction: 'left', DX: -20, DY: 0}]);

		var up = await mount('y');

		drag(up.Pad, [[100, 150], [100, 130], [100, 90]], 30);

		expect(up.Told.pop()).toEqual(['swipe', {Direction: 'up', DX: 0, DY: -60}]);
	});

	it('leaves a move across its axis to the page, a field and a mouse (but with Mouse) alone', async function () {
		var made = await mount('x');

		drag(made.Pad, [[100, 100], [101, 120], [102, 160]], 30);

		expect(made.Told).toEqual([]);

		drag(made.Pad.querySelector('.field'), [[100, 100], [150, 100], [200, 100]], 30);

		expect(made.Told).toEqual([]);

		drag(made.Pad, [[100, 100], [150, 100], [200, 100]], 30, 'mouse');

		expect(made.Told).toEqual([]);

		var mouse = await mount({Axis: 'x', Mouse: true});

		drag(mouse.Pad, [[100, 100], [150, 100], [200, 100]], 30, 'mouse');

		expect(names(mouse.Told).pop()).toBe('swipe');
	});
});
