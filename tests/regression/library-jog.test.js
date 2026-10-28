import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('JogHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function pointer (target, type, x, y) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1}));
}

/* The angle the platter is drawn at, in degrees. */
function angle (root) {
	var match = /rotate\(([-\d.]+)deg\)/.exec(root.querySelector('.elemenx-jog-platter').style.transform);

	return match ? Number(match[1]) : null;
}

/* Jog: the platter of a DJ, turned by the track, scratched by a hand, its ring bending the pitch. */
describe('Contract: Jog', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Jog']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('puts its marker where Time is, a turn every 60 / Rpm seconds, and turns by itself while Playing', async function () {
		var host = mount('<div><Jog [time]="Time" Rpm="30" [playing]="Playing" Title="Deck A" Subtitle="128 BPM" /></div>', {Time: 0.5, Playing: false});
		var root;
		var before;

		root = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-jog');
		});

		/* At 30 turns a minute a turn is 2 seconds: half a second is a quarter of it. */
		expect(angle(root)).toBe(90);
		expect(root.getAttribute('role')).toBe('slider');
		expect(root.getAttribute('aria-label')).toBe('Jog wheel');
		expect(root.getAttribute('aria-valuenow')).toBe('0.5');
		expect(root.querySelector('.elemenx-jog-title').textContent).toBe('Deck A');
		expect(root.querySelector('.elemenx-jog-subtitle').textContent).toBe('128 BPM');

		host.Time = 1.5;

		await tick();

		expect(angle(root)).toBe(270);

		/* From an eighth of a turn: the angle has room to grow before it goes round. */
		host.$Batch(function (state) {
			state.Time = 0.25;
			state.Playing = true;
		});

		await tick();

		before = angle(root);

		var started = Date.now();

		await new Promise(function (resolve) {
			setTimeout(resolve, 300);
		});

		/* 180 degrees a second, as long as it waited (a frame drawn up to a tenth of a second ago, under load). */
		var turned = angle(root) - before;
		var waited = (Date.now() - started) / 1000;

		expect(root.classList.contains('playing')).toBe(true);
		expect(turned).toBeGreaterThan((waited - 0.1) * 180);
		expect(turned).toBeLessThan(waited * 180 + 20);

		host.Playing = false;

		await tick();

		before = angle(root);

		await new Promise(function (resolve) {
			setTimeout(resolve, 150);
		});

		expect(angle(root)).toBe(before);
	});

	it('a hand on the record touches and scratches it; on the ring, the wheel and the keys it nudges', async function () {
		var events = [];
		var record = function (name) {
			return function (value) {
				events.push([name, value]);
			};
		};
		var host = mount('<div><Jog Rpm="30" Size="200" (touch)="Touched" (scratch)="Scratched" (nudge)="Nudged" /></div>', {Touched: record('touch'), Scratched: record('scratch'), Nudged: record('nudge')});
		var root;
		var rect;
		var x;
		var y;

		root = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-jog');
		});

		rect = root.getBoundingClientRect();
		x = rect.left + rect.width / 2;
		y = rect.top + rect.height / 2;

		/* A quarter turn clockwise on the record, from the top to the right, in three moves: half a second forward. */
		pointer(root, 'pointerdown', x, y - 50);

		expect(events).toEqual([['touch', true]]);
		expect(root.classList.contains('touched')).toBe(true);

		pointer(root, 'pointermove', x + 35.36, y - 35.36);
		pointer(root, 'pointermove', x + 50, y);
		pointer(root, 'pointermove', x + 50, y + 0.001);
		pointer(root, 'pointerup', x + 50, y);

		var scratches = events.filter(function (entry) {
			return entry[0] === 'scratch';
		});

		expect(scratches.reduce(function (sum, entry) {
			return sum + entry[1].Delta;
		}, 0)).toBeCloseTo(0.5, 2);
		expect(scratches[scratches.length - 1][1].Time).toBeCloseTo(0.5, 2);
		expect(events[events.length - 1]).toEqual(['touch', false]);
		expect(Math.round(angle(root))).toBe(90);

		/* Back across the left side, the short way: from the left (180) to the bottom-left is 45 degrees back. */
		events = [];

		pointer(root, 'pointerdown', x - 50, y + 0.001);
		pointer(root, 'pointermove', x - 50, y - 0.001);
		pointer(root, 'pointerup', x - 50, y - 0.001);

		expect(events.filter(function (entry) {
			return entry[0] === 'scratch';
		}).every(function (entry) {
			return Math.abs(entry[1].Delta) < 0.01;
		})).toBe(true);

		/* The ring: a drag on it bends the pitch, as do the wheel and the arrows; Shift and an arrow scratch. */
		events = [];

		pointer(root, 'pointerdown', x, y - 95);
		pointer(root, 'pointermove', x + 95, y);
		pointer(root, 'pointerup', x + 95, y);

		expect(events).toEqual([['nudge', {Delta: 1}]]);

		events = [];

		root.dispatchEvent(new WheelEvent('wheel', {deltaY: -100, bubbles: true, cancelable: true}));
		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}));
		root.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', shiftKey: true, bubbles: true}));

		expect(events[0]).toEqual(['nudge', {Delta: 0.25}]);
		expect(events[1]).toEqual(['nudge', {Delta: -0.1}]);
		expect(events[2][0]).toBe('scratch');
		expect(events[2][1].Delta).toBeCloseTo(0.1, 5);
	});
});
