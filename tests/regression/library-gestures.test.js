import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';
import { Use } from '../library.js';

var gestures;
var owned = [];

/* The types and phases of what a recognizer made of a run of fingers: [[kind, id, x, y, time], ...]. */
function run (recognizer, steps) {
	var out = [];

	steps.forEach(function (step) {
		(step[0] === 'tick' ? recognizer.Tick(step[1]) : recognizer.Push(step[0], step[1], step[2], step[3], step[4])).forEach(function (gesture) {
			out.push(gesture);
		});
	});

	return out;
}

function names (list) {
	return list.map(function (gesture) {
		return gesture.Type + (gesture.Phase ? ':' + gesture.Phase : '');
	});
}

describe('Contract: Gestures, what fingers do on an element', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Gestures']);

		gestures = Elemenx.Service('Gestures');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		owned.forEach(function (component) {
			component.$Destroy();
		});

		owned = [];
	});

	it('taps, taps twice near in place and time, and presses a finger held still', function () {
		var recognizer = gestures.Recognizer();

		expect(names(run(recognizer, [['down', 1, 100, 100, 0], ['move', 1, 104, 103, 40], ['up', 1, 104, 103, 90]]))).toEqual(['tap']);
		expect(names(run(recognizer, [['down', 1, 110, 100, 250], ['up', 1, 110, 100, 300]]))).toEqual(['tap', 'doubletap']);
		/* A third tap starts anew: no double of the last two. */
		expect(names(run(recognizer, [['down', 1, 110, 100, 420], ['up', 1, 110, 100, 460]]))).toEqual(['tap']);
		/* Far from the last, or late: no double. */
		expect(names(run(recognizer, [['down', 1, 300, 100, 500], ['up', 1, 300, 100, 540]]))).toEqual(['tap']);
		expect(names(run(recognizer, [['down', 1, 300, 100, 1200], ['up', 1, 300, 100, 1240]]))).toEqual(['tap']);

		/* Held still: a press, and no tap when it lifts. */
		expect(names(run(recognizer, [['down', 1, 50, 50, 2000], ['tick', 2300], ['tick', 2510], ['up', 1, 52, 51, 2700]]))).toEqual(['press', 'pressup']);
		/* Moved before its time: no press. */
		expect(names(run(recognizer, [['down', 1, 50, 50, 3000], ['move', 1, 80, 50, 3100], ['tick', 3600], ['up', 1, 90, 50, 3700]]))).toEqual(['pan:start', 'pan:end']);
	});

	it('pans a finger past its slop, its moves told, and a quick one ends in a swipe', function () {
		var recognizer = gestures.Recognizer();
		var list = run(recognizer, [['down', 1, 100, 100, 0], ['move', 1, 105, 100, 50], ['move', 1, 130, 100, 100], ['move', 1, 160, 104, 150], ['up', 1, 220, 106, 200]]);

		expect(names(list)).toEqual(['pan:start', 'pan:move', 'pan:end', 'swipe']);
		expect(list[0].DX).toBe(30);
		expect(list[1].MoveX).toBe(30);
		expect(list[1].DX).toBe(60);
		expect(list[3].Direction).toBe('right');

		/* A slow one: no swipe. */
		expect(names(run(recognizer, [['down', 1, 100, 100, 1000], ['move', 1, 120, 100, 1400], ['move', 1, 130, 100, 1800], ['up', 1, 131, 100, 2400]]))).toEqual(['pan:start', 'pan:move', 'pan:end']);
	});

	it('pinches, rotates and pans two fingers at once; a second finger ends the pan of one', function () {
		var recognizer = gestures.Recognizer();
		var list = run(recognizer, [
			['down', 1, 100, 200, 0],
			['move', 1, 130, 200, 20],
			['down', 2, 200, 200, 40],
			/* Apart: a pinch. */
			['move', 2, 260, 200, 60],
			/* Turned: a rotate too. */
			['move', 2, 250, 250, 80],
			['up', 2, 250, 250, 100],
			['up', 1, 130, 200, 120]
		]);
		var pinch = list.filter(function (gesture) {
			return gesture.Type === 'pinch';
		});
		var rotate = list.filter(function (gesture) {
			return gesture.Type === 'rotate';
		});

		expect(names(list).slice(0, 3)).toEqual(['pan:start', 'pan:end', 'pinch:start']);
		expect(pinch[0].Scale).toBeCloseTo(130 / 70, 5);
		expect(names(rotate)).toEqual(['rotate:start', 'rotate:end']);
		expect(rotate[0].Angle).toBeGreaterThan(0.12);
		expect(pinch[pinch.length - 1].Phase).toBe('end');
		expect(list.every(function (gesture) {
			return gesture.Type !== 'tap';
		})).toBe(true);
	});

	it('tilts two fingers moving up or down together, alone of the gestures of two', function () {
		var recognizer = gestures.Recognizer();
		var list = run(recognizer, [
			['down', 1, 100, 300, 0],
			['down', 2, 200, 300, 10],
			['move', 1, 100, 280, 30],
			['move', 2, 200, 280, 40],
			['move', 1, 101, 250, 60],
			['move', 2, 199, 250, 70],
			['up', 1, 101, 250, 90]
		]);

		expect(names(list)).toEqual(['tilt:start', 'tilt:move', 'tilt:move', 'tilt:end']);
		expect(list[list.length - 1].DY).toBe(-50);
	});

	it('gives its gestures as events of templates on any element, and lets the element go with its component', function () {
		var host = Elemenx.Component(unique('GesturesHost'), {
			$Template: '<div class="area" style="width: 300px; height: 200px;" (tap)="Tapped" (pinch)="Pinched"></div>',
			Taps: 0,
			Scales: [],
			Tapped: function () {
				this.Taps++;
			},
			Pinched: function (event) {
				this.Scales.push(event.detail.Phase);
			}
		})();
		var area;

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		area = host.$Element();

		/* The browser scrolls and zooms none of it while it listens. */
		expect(area.style.touchAction).toBe('none');

		function finger (type, id, x, y) {
			area.dispatchEvent(new PointerEvent(type, {bubbles: true, pointerId: id, pointerType: 'touch', clientX: x, clientY: y, isPrimary: id === 1}));
		}

		finger('pointerdown', 1, 50, 50);
		finger('pointerup', 1, 50, 50);

		expect(host.Taps).toBe(1);

		finger('pointerdown', 1, 50, 50);
		finger('pointerdown', 2, 150, 50);
		finger('pointermove', 2, 220, 50);
		finger('pointerup', 2, 220, 50);
		finger('pointerup', 1, 50, 50);

		expect(host.Scales).toEqual(['start', 'end']);

		/* A mouse is no finger unless asked. */
		area.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, pointerId: 9, pointerType: 'mouse', clientX: 10, clientY: 10}));
		area.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 9, pointerType: 'mouse', clientX: 10, clientY: 10}));

		expect(host.Taps).toBe(1);

		host.$Destroy();

		owned = [];

		expect(area.style.touchAction).toBe('');
	});

	it('takes a mouse as one finger on an element with data-gestures-mouse', function () {
		var host = Elemenx.Component(unique('GesturesMouse'), {
			$Template: '<div class="area" data-gestures-mouse style="width: 300px; height: 200px;" (tap)="Tapped" (pan)="Panned"></div>',
			Taps: 0,
			Pans: [],
			Tapped: function () {
				this.Taps++;
			},
			Panned: function (event) {
				this.Pans.push(event.detail.Phase);
			}
		})();
		var area;

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		area = host.$Element();

		function mouse (type, x, y) {
			area.dispatchEvent(new PointerEvent(type, {bubbles: true, pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y, isPrimary: true, buttons: type === 'pointerup' ? 0 : 1}));
		}

		mouse('pointerdown', 10, 10);
		mouse('pointerup', 10, 10);

		expect(host.Taps).toBe(1);

		mouse('pointerdown', 10, 10);
		mouse('pointermove', 60, 10);
		mouse('pointerup', 60, 10);

		expect(host.Pans[0]).toBe('start');
		expect(host.Pans[host.Pans.length - 1]).toBe('end');
	});
});
