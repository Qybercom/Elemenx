import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('ClusterHost'), {$Template: '<div style="width: 320px; height: 240px"><Scene Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="3000" Height="2" Water="0" Seed="clusters" />' +
		'<SceneObject ID="day" Kind="sun" Time="12" Latitude="45" />' +
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

describe('Contract: a large model that stands alone drawn by its clusters (SceneClusters, as Nanite)', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * A tower of thousands of faces, alone: near it is drawn at its finest, far at a coarser level of its clusters, fewer
	 * triangles; Clusters false, as it is.
	 */
	it('draws a tower near at its finest and far coarser, by its clusters', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var inner = scene.Scene();
		var now = performance.now() + 100;
		var made = Elemenx.Service('SceneBuildingGenerator').Define('cluster-tower', {Class: 'skyscraper', Seed: 'clusters'});

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		/* The lists of the tower drawn by their clusters, and the triangles of their meshes now. */
		function tower () {
			var lists = inner.StillLists || {};
			var names = Object.keys(lists).filter(function (name) {
				return lists[name].Clustered;
			});

			return {Lists: names.length, Level: Math.max.apply(null, [0].concat(names.map(function (name) {
				return lists[name].Clustered.Level;
			}))), Clusters: names.reduce(function (sum, name) {
				return sum + lists[name].Clustered.Clusters;
			}, 0)};
		}

		frames(3);

		scene.Add('thing', {ID: 'tower', Model: 'cluster-tower', X: 0, Y: 0, Size: made.Height});
		scene.SetViewpoint({Target: [0, made.Height / 2, 0], Yaw: 0.6, Pitch: 0.2, Distance: made.Height * 1.2});

		await waitFor(function () {
			frames(2);

			return tower().Lists > 0;
		}, 60000);

		frames(3);

		var near = tower();

		scene.SetViewpoint({Target: [0, made.Height / 2, 0], Yaw: 0.6, Pitch: 0.2, Distance: 1400});

		frames(6);

		var far = tower();

		expect(near.Lists).toBeGreaterThan(0);
		expect(far.Level).toBeGreaterThan(near.Level);
		expect(far.Clusters).toBeLessThan(near.Clusters);
	}, 120000);
});
