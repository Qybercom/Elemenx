import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function wait (ms) {
	return new Promise(function (done) {
		setTimeout(done, ms);
	});
}

describe('Contract: FPS, how smoothly a page draws, and FPSMeter, which shows it', function () {
	var fps;

	beforeAll(async function () {
		await loadElemenx();

		Use(['FPSMeter', 'Scene', 'SceneObject', 'service:FPS']);

		fps = Elemenx.Service('FPS');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('times the frames of a page without WebGL while it is watched, and nothing when no one watches', async function () {
		var told = [];
		var watch;
		var stats;

		expect(fps.Watching()).toBe(false);

		/* Told while no one watches: kept nowhere. */
		fps.Report('Test', {Cpu: 5});

		watch = fps.Watch(function (value) {
			told.push(value);
		}, 100);

		expect(fps.Watching()).toBe(true);

		fps.Report('Test', {Cpu: 2});
		fps.Report('Test', {Cpu: 4, Skip: 'no'});

		await waitFor(function () {
			return told.length >= 3;
		}, 4000);

		stats = fps.Stats();

		expect(stats.Frames).toBeGreaterThan(3);
		expect(stats.FPS).toBeGreaterThan(5);
		expect(stats.Frame).toBeGreaterThan(0);
		expect(stats.P95).toBeGreaterThanOrEqual(stats.Frame);
		expect(stats.Max).toBeGreaterThanOrEqual(stats.P95);
		expect(stats.Slow).toBeGreaterThanOrEqual(stats.Long);
		expect(fps.History().length).toBe(stats.Frames);
		expect(stats.Sources.Test.Cpu).toEqual({Last: 4, Mean: 3, Max: 4});
		expect(stats.Sources.Test.Skip).toBe(undefined);
		expect(stats.Heap === null || stats.Heap > 0).toBe(true);
		expect(fps.Name('Gauge')).toBe('Gauge');
		expect(fps.Name('Gauge')).toBe('Gauge 2');

		watch.Stop();

		expect(fps.Watching()).toBe(false);
		expect(fps.History()).toEqual([]);
		expect(fps.Stats().Sources).toEqual({});

		/* Stopped: no more calls. */
		told = [];

		await wait(300);

		expect(told).toEqual([]);
	});

	it('shows the frames a second, the times and a graph, over a corner when asked, and stops timing when it is gone', async function () {
		var component = Elemenx.Component(unique('MeterHost'), {$Template: '<div style="position: relative; width: 300px; height: 200px"><FPSMeter Corner="top-right" Every="100" /></div>'})();
		var element;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			element = component.$Element().querySelector('.elemenx-fps-meter');

			return element && /\d/.test(element.querySelector('.elemenx-fps-meter-rate').textContent) && element.querySelector('.elemenx-fps-meter-times');
		}, 4000);

		expect(element.classList.contains('corner')).toBe(true);
		expect(element.classList.contains('top-right')).toBe(true);
		expect(getComputedStyle(element).position).toBe('absolute');
		expect(element.querySelector('.elemenx-fps-meter-times').textContent).toMatch(/p95 [\d.]+ · max [\d.]+ ms/);
		expect(element.querySelector('canvas.elemenx-fps-meter-graph')).not.toBe(null);
		expect(fps.Watching()).toBe(true);

		owned.pop().$Destroy();

		expect(fps.Watching()).toBe(false);
	});

	/* The meter of a page listed scenes long gone, and one asked for out of an application saw none of what its scenes told. */
	it('keeps the numbers of the page for the services of every application, and forgets a source that is gone', function () {
		var root = unique('FPSRoot');
		var app;
		var own;
		var watch;

		Elemenx.Component(root, {$Template: '<div></div>'});

		app = Elemenx.Application(unique('FPSApp'), {$Component: root, $Mount: '#mount'});
		own = app.$Service('FPS');
		watch = fps.Watch(function () {}, 1000);

		try {
			expect(own).not.toBe(fps);
			expect(own.Watching()).toBe(true);

			own.Report('Gone', {Cpu: 3});

			expect(fps.Stats().Sources.Gone.Cpu.Last).toBe(3);

			fps.Forget('Gone');

			expect(own.Stats().Sources.Gone).toBeUndefined();
		}
		finally {
			watch.Stop();

			app.$Destroy();
		}
	});

	it('hears from a scene the time of its frames, while someone watches', async function () {
		var ready = null;
		var component = Elemenx.Component(unique('SceneHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="100" Height="0.3" Water="0" Seed="flat" />' +
		'</Scene></div>', Ready: function (space) {
			ready = space;
		}})();
		var watch;
		var scene;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		ready.Scene().Loop.Stop();

		watch = fps.Watch(function () {}, 1000);

		try {
			await waitFor(function () {
				ready.Scene().Loop.Advance(17);

				var sources = fps.Stats().Sources;

				/* Each scene of a page tells under a name of its own: Scene, Scene 2... */
				scene = sources[Object.keys(sources).filter(function (name) {
					return /^Scene( \d+)?$/.test(name);
				})[0]];

				return scene && scene.Cpu;
			}, 10000);

			expect(scene.Cpu.Mean).toBeGreaterThan(0);
			expect(scene.Quiet.Last).toBe(0);
			expect(scene.Skipped.Last).toBe(0);

			/* Gone, the scene is no more in the numbers. */
			var names = Object.keys(fps.Stats().Sources).filter(function (name) {
				return /^Scene( \d+)?$/.test(name);
			});

			component.$Destroy();

			owned.splice(owned.indexOf(component), 1);

			expect(Object.keys(fps.Stats().Sources).filter(function (name) {
				return names.indexOf(name) >= 0;
			})).toEqual([]);
		}
		finally {
			watch.Stop();
		}
	});
});
