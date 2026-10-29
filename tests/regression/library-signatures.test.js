import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('SignaturesHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* A wave across the field: the strokes of a signature, its points of a given shape, shift and size. */
function wave (options) {
	var points = [];
	var i;

	for (i = 0; i <= 60; i++)
		points.push({X: 20 + i * 4 * (options.Scale || 1) + (options.Shift || 0), Y: 70 + Math.sin(i / (options.Period || 4)) * 30 * (options.Scale || 1), P: 0.5, T: i * 12});

	return [points, [{X: 30, Y: 120, P: 0.5, T: 900}, {X: 200, Y: 120, P: 0.5, T: 1000}].map(function (point) {
		return {X: 20 + (point.X - 20) * (options.Scale || 1) + (options.Shift || 0), Y: 70 + (point.Y - 70) * (options.Scale || 1), P: point.P, T: point.T};
	})];
}

/* Draws the strokes on the canvas of a pad with the pointer, as a hand would. */
async function draw (pad, strokes) {
	var canvas = pad.querySelector('.elemenx-signature-canvas');
	var box = canvas.getBoundingClientRect();

	strokes.forEach(function (stroke) {
		stroke.forEach(function (point, index) {
			canvas.dispatchEvent(new PointerEvent(index ? 'pointermove' : 'pointerdown', {clientX: box.left + point.X, clientY: box.top + point.Y, pointerId: 1, pointerType: 'pen', pressure: 0.5, bubbles: true}));
		});

		canvas.dispatchEvent(new PointerEvent('pointerup', {pointerId: 1, bubbles: true}));
	});

	await tick(20);
}

describe('Contract: Signatures and the comparison of a SignaturePad', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['SignaturePad']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('scores a signature against another and against the samples of a person, its parts told', function () {
		var signatures = Elemenx.Service('Signatures');
		var reference = signatures.Enroll([wave({}), wave({Shift: 6}), wave({Scale: 1.1})]);
		var alike = signatures.Compare(wave({Shift: 40, Scale: 0.8}), wave({}));
		var other = signatures.Compare(wave({Period: 1.5}), wave({}));
		var normalized = signatures.Normalize(wave({}));

		/* Its place and its size do not count. */
		expect(alike.Score).toBeGreaterThan(0.9);
		expect(other.Score).toBeLessThan(alike.Score - 0.15);
		expect(Object.keys(alike.Parts)).toEqual(['Shape', 'Strokes', 'Proportions', 'Dynamics']);
		expect(normalized.Points.length).toBeGreaterThan(80);
		expect(normalized.Strokes.length).toBe(2);
		expect(normalized.Duration).toBe(1000);

		expect(reference.Samples.length).toBe(3);
		expect(reference.Threshold).toBeGreaterThanOrEqual(0.5);
		expect(reference.Threshold).toBeLessThanOrEqual(0.85);
		expect(signatures.Match(wave({Shift: 10}), reference).Match).toBe(true);
		expect(signatures.Match(wave({Period: 1.5}), reference).Match).toBe(false);

		/* Without a time, the dynamics are left out of the score. */
		expect(signatures.Compare([[{X: 0, Y: 0}, {X: 50, Y: 50}]], [[{X: 0, Y: 0}, {X: 60, Y: 60}]]).Parts.Dynamics).toBe(null);
		expect(signatures.Normalize([])).toBe(null);
	});

	it('compares what is drawn with its Reference after each stroke, tells compare and says whether it looks like it', async function () {
		var results = [];
		var host = mount('<div style="width: 320px"><SignaturePad Height="160" [reference]="Samples" (compare)="Compared" /></div>', {
			Samples: [wave({}), wave({Shift: 6}), wave({Scale: 1.05})],
			Compared: function (result) {
				results.push(result);
			}
		});
		var pad;

		await tick(30);

		pad = host.$Element().querySelector('.elemenx-signature-pad');

		await draw(pad, wave({Shift: 4}));

		expect(results.length).toBe(2);
		expect(results[1].Match).toBe(true);
		expect(pad.querySelector('.elemenx-signature-result').className).toContain('match');
		expect(pad.querySelector('.elemenx-signature-result').textContent).toContain('Looks like the signature on file');

		/* Every point keeps its time from the start of the signature. */
		expect(Elemenx.Instance(pad).Value[1][0].T).toBeGreaterThanOrEqual(0);

		Elemenx.Instance(pad).Clear();

		await tick(10);

		expect(pad.querySelector('.elemenx-signature-result')).toBe(null);

		await draw(pad, wave({Period: 1.5}));

		expect(results[results.length - 1].Match).toBe(false);
		expect(pad.querySelector('.elemenx-signature-result').className).toContain('mismatch');
	});
});
