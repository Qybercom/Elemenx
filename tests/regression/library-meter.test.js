import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (template, state) {
	var component = Elemenx.Component(unique('MeterHost'), Object.assign({$Template: '<div style="width: 320px;">' + template + '</div>'}, state))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(20);

	return component;
}

/* The declarations of the rule of a selector in the stylesheets of the page (its tokens are not there: the values are not computed). */
function rule (selector) {
	var found = null;

	Array.prototype.forEach.call(document.styleSheets, function (sheet) {
		Array.prototype.forEach.call(sheet.cssRules, function (one) {
			if (one.selectorText && one.selectorText.split(',').map(function (part) {
				return part.trim();
			}).indexOf(selector) !== -1)
				found = one.style;
		});
	});

	return found;
}

function wait (ms) {
	return new Promise(function (done) {
		setTimeout(done, ms);
	});
}

describe('Contract: Meter and Progress, as fast fed each frame as now and then', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Meter', 'Progress', 'service:ElemenxHelpers']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * Regression: the share of a Meter was a property of its root, and every part under it (17 of a dial) took it again
	 * at each value: 0.2 ms an update. It is on the parts that draw it: the fill, the arc, the needle.
	 */
	it('puts the share of its range on the parts that draw it, its zone and its value told as before', async function () {
		var host = await mount('<Meter Shape="dial" Needle="true" Ticks="5" Min="0" Max="200" Low="60" High="150" Optimum="20" Unit=" km/h" [value]="Speed" /><Meter Min="0" Max="100" [value]="Load" />', {Speed: 50, Load: 25});
		var dial = host.$Element().querySelectorAll('.elemenx-meter')[0];
		var bar = host.$Element().querySelectorAll('.elemenx-meter')[1];

		expect(dial.getAttribute('style')).not.toContain('--elemenx-meter-share');
		expect(dial.getAttribute('style')).toContain('--elemenx-meter-span: 270deg');
		expect(dial.querySelector('.elemenx-meter-arc').getAttribute('style')).toBe('--elemenx-meter-share: 0.25;');
		expect(dial.querySelector('.elemenx-meter-needle').getAttribute('style')).toBe('--elemenx-meter-share: 0.25;');
		expect(bar.querySelector('.elemenx-meter-fill').getAttribute('style')).toBe('--elemenx-meter-share: 0.25;');
		expect(dial.classList.contains('success')).toBe(true);
		expect(dial.getAttribute('aria-valuenow')).toBe('50');

		host.Speed = 180;

		await tick();

		expect(dial.querySelector('.elemenx-meter-needle').getAttribute('style')).toBe('--elemenx-meter-share: 0.9;');
		expect(dial.classList.contains('danger')).toBe(true);
		expect(dial.getAttribute('aria-valuetext')).toBe('180 km/h');
		/* Drawn by it: the needle turned by the share, nine tenths of 270 degrees. */
		expect(getComputedStyle(dial.querySelector('.elemenx-meter-needle')).getPropertyValue('--elemenx-meter-share').trim()).toBe('0.9');
	});

	/* Regression: fed each frame, a transition started again at each value cost 0.4 ms and lagged; now and then it still glides. */
	it('shows a value fed on and on at once, with no transition, and glides again when it changes now and then', async function () {
		var host = await mount('<Meter Shape="dial" Needle="true" [value]="Value" /><Progress [value]="Value" />', {Value: 10});
		var meter = host.$Element().querySelector('.elemenx-meter');
		var progress = host.$Element().querySelector('.elemenx-progress');
		var i;

		/* A while after it was first drawn. */
		await wait(300);

		host.Value = 20;

		await tick();

		/* One change after a while: it glides. */
		expect(meter.classList.contains('live')).toBe(false);

		for (i = 0; i < 5; i++) {
			host.Value = 30 + i;

			await tick();
		}

		expect(meter.classList.contains('live')).toBe(true);
		expect(progress.classList.contains('live')).toBe(true);
		/* Live, their parts have no transition; else theirs glides. */
		expect(rule('.elemenx-meter.live .elemenx-meter-needle').transitionProperty).toBe('none');
		expect(rule('.elemenx-progress.live .elemenx-progress-fill').transitionProperty).toBe('none');
		expect(rule('.elemenx-meter-needle').getPropertyValue('transition')).toContain('transform');

		await wait(300);

		host.Value = 80;

		await tick();

		expect(meter.classList.contains('live')).toBe(false);
		expect(progress.classList.contains('live')).toBe(false);
	});
});
