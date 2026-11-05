import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* A ground of gentle noise to sketch over: its heights a few metres, no sea. */
var GROUND = {Size: 600, Height: 4, Water: 0, Scale: 300, Ridges: 0, Seed: 'sketch'};

function sketch (items, layer) {
	return {Layers: [Object.assign({ID: 'base', Visible: true, Strength: 1, Items: items}, layer || {})]};
}

describe('Contract: sketches over a ground of Terrain: brushes, lines and areas that change its heights and colors, made again only where they change', function () {
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'Scene', 'SceneObject']);

		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function both (items, layer) {
		return {Plain: terrain.Flat(GROUND), Sketched: terrain.Flat(Object.assign({}, GROUND, {Sketch: sketch(items, layer)}))};
	}

	it('raises and lowers along a stroke, flattens to a height and smooths, up to its radius and no farther', function () {
		var made = both([{ID: 'a', Type: 'raise', Points: [[0, 0], [40, 0]], Radius: 10, Amount: 5}, {ID: 'b', Type: 'lower', Points: [[0, 100]], Radius: 10, Amount: 3}, {ID: 'c', Type: 'flatten', Points: [[100, 0], [140, 0]], Radius: 12, Height: 9}]);
		var plain = made.Plain.Height;
		var drawn = made.Sketched.Height;

		expect(drawn(20, 0) - plain(20, 0)).toBeCloseTo(5, 6);
		expect(drawn(20, 5) - plain(20, 5)).toBeCloseTo(2.5, 6);
		expect(drawn(20, 11)).toBe(plain(20, 11));
		expect(drawn(0, 100) - plain(0, 100)).toBeCloseTo(-3, 6);
		expect(drawn(120, 0)).toBeCloseTo(9, 6);
		expect(drawn(-60, -60)).toBe(plain(-60, -60));
	});

	it('draws ridges, valleys and canyons along lines, a river whose bed goes down the way it flows, a level road and a cliff on one side', function () {
		var made = both([
			{ID: 'r', Type: 'ridge', Points: [[-200, -200], [-100, -200]], Width: 30, Height: 20},
			{ID: 'v', Type: 'valley', Points: [[-200, -100], [-100, -100]], Width: 30, Depth: 6},
			{ID: 'w', Type: 'river', Points: [[0, -200, 6], [0, -150, 8], [0, -100, 3]], Width: 6, Depth: 2, Bank: 5},
			{ID: 'd', Type: 'road', Points: [[100, -200], [200, -200]], Width: 8, Shoulder: 4},
			{ID: 'c', Type: 'cliff', Points: [[100, -100], [200, -100]], Width: 2, Height: 10, Reach: 30}
		]);
		var plain = made.Plain.Height;
		var drawn = made.Sketched.Height;

		expect(drawn(-150, -200) - plain(-150, -200)).toBeGreaterThan(15);
		expect(drawn(-150, -100) - plain(-150, -100)).toBeCloseTo(-6, 6);

		/* Its levels along the way never rise: 6, then 6 (not 8), then 3; the bed 2 under them, across all its width. */
		expect(drawn(0, -175)).toBeCloseTo(Math.min(plain(0, -175), 4), 6);
		expect(drawn(2.5, -125)).toBeLessThanOrEqual(Math.min(plain(2.5, -125), 6 - 2.5 * (2 / 2) + 0.01));
		expect(drawn(0, -100)).toBeCloseTo(Math.min(plain(0, -100), 1), 6);

		/* A road across: the same height on both of its sides. */
		expect(drawn(150, -197)).toBeCloseTo(drawn(150, -203), 6);

		/* The cliff stands up on the left of its way (going +X, that is -Z), not on its right. */
		expect(drawn(150, -105) - plain(150, -105)).toBeGreaterThan(8);
		expect(drawn(150, -95) - plain(150, -95)).toBeLessThan(1);
	});

	it('makes plateaus, basins, lakes, terraces, swamps, beaches, floodplains, dunes, erosion, mountains, craters and stamps', function () {
		var square = function (cx, cz, half) {
			return [[cx - half, cz - half], [cx + half, cz - half], [cx + half, cz + half], [cx - half, cz + half]];
		};
		var made = both([
			{ID: 'p', Type: 'plateau', Points: square(-200, 100, 30), Height: 25, Edge: 10},
			{ID: 'b', Type: 'basin', Points: square(-100, 100, 30), Depth: 5, Edge: 10},
			{ID: 'l', Type: 'lake', Points: square(0, 100, 30), Level: -1.5, Depth: 3, Edge: 10},
			{ID: 't', Type: 'terraces', Points: square(100, 100, 30), Step: 1, Edge: 5},
			{ID: 's', Type: 'swamp', Points: square(200, 100, 30), Level: 0.2, Edge: 5},
			{ID: 'e', Type: 'beach', Points: square(-200, 200, 30), Edge: 5},
			{ID: 'f', Type: 'floodplain', Points: square(-100, 200, 30), Level: 1, Edge: 5},
			{ID: 'u', Type: 'dunes', Points: square(0, 200, 30), Height: 3, Length: 20, Edge: 5},
			{ID: 'o', Type: 'erosion', Points: square(100, 200, 30), Amount: 4, Edge: 5},
			{ID: 'm', Type: 'mountain', At: [200, 250], Radius: 40, Height: 50},
			{ID: 'k', Type: 'crater', At: [-200, -260], Radius: 20, Depth: 8, Rim: 3},
			{ID: 'q', Type: 'stamp', At: [-60, -260], Size: 20, Height: 10, Data: {Side: 2, Heights: [1, 1, 1, 1]}}
		]);
		var plain = made.Plain.Height;
		var drawn = made.Sketched.Height;
		var x;
		var low = Infinity;
		var high = -Infinity;

		expect(drawn(-200, 100)).toBeCloseTo(25, 6);
		expect(drawn(-100, 100) - plain(-100, 100)).toBeCloseTo(-5, 6);
		expect(drawn(0, 100)).toBeLessThanOrEqual(-1.5);

		/* Terraces: steps of a metre, the height whole where a step is flat. */
		expect(Math.abs(drawn(100, 100) - Math.round(drawn(100, 100)))).toBeLessThan(0.3);
		expect(Math.abs(drawn(200, 100) - 0.2)).toBeLessThan(0.5);
		expect(drawn(-200, 200)).toBeLessThan(0.71);
		expect(Math.abs(drawn(-100, 200) - 1)).toBeLessThan(0.3);

		for (x = -25; x <= 25; x += 2) {
			low = Math.min(low, drawn(x, 200) - plain(x, 200));
			high = Math.max(high, drawn(x, 200) - plain(x, 200));
		}

		expect(high - low).toBeGreaterThan(1.5);
		expect(drawn(100, 200)).toBeLessThanOrEqual(plain(100, 200));
		expect(drawn(200, 250) - plain(200, 250)).toBeGreaterThan(20);
		expect(drawn(-200, -260) - plain(-200, -260)).toBeCloseTo(-8, 6);
		expect(drawn(-180, -260) - plain(-180, -260)).toBeCloseTo(3, 6);
		expect(drawn(-60, -260)).toBeCloseTo(10, 6);
	});

	it('keeps to its layers: one hidden draws nothing, its Strength weakens it; a mask freezes what it holds and holds back what comes after', function () {
		var raise = {ID: 'a', Type: 'raise', Points: [[0, 0]], Radius: 20, Amount: 8};
		var hidden = both([raise], {Visible: false});
		var half = both([raise], {Strength: 0.5});
		var masked = terrain.Flat(Object.assign({}, GROUND, {Sketch: {Layers: [{ID: 'keep', Items: [{ID: 'm', Type: 'mask', Points: [[-5, -5], [5, -5], [5, 5], [-5, 5]], Edge: 1}]}, {ID: 'later', Items: [raise]}]}}));
		var frozen = terrain.Flat(Object.assign({}, GROUND, {Sketch: sketch([raise, {ID: 'f', Type: 'mask', Points: [[-5, -5], [5, -5], [5, 5], [-5, 5]], Edge: 1, Heights: {Bounds: [-10, -10, 10, 10], Side: 2, Data: [2, 2, 2, 2]}}])}));
		var plain = hidden.Plain.Height;

		expect(hidden.Sketched.Height(0, 0)).toBe(plain(0, 0));
		expect(half.Sketched.Height(0, 0) - plain(0, 0)).toBeCloseTo(4, 6);
		expect(masked.Height(0, 0)).toBeCloseTo(plain(0, 0), 6);
		expect(masked.Height(15, 0) - plain(15, 0)).toBeGreaterThan(0.5);
		expect(frozen.Height(0, 0)).toBeCloseTo(2, 6);
	});

	it('tells the water it lays: a river a little wider than its bed under the levels of its way, a lake at its level', function () {
		var field = terrain.Flat(Object.assign({}, GROUND, {Sketch: sketch([{ID: 'w', Type: 'river', Points: [[0, -50, 6], [0, 0, 8], [0, 50, 3]], Width: 6, Depth: 2, Flow: 2.5}, {ID: 'l', Type: 'lake', Points: [[100, 0], [120, 0], [120, 20]], Level: 2}])}));
		var waters = field.Sketch.Waters();

		expect(waters[0]).toEqual({Kind: 'river', Points: [[0, -50, 6], [0, 0, 8], [0, 50, 3]], Width: 7.5, Flow: 2.5, Levels: [5.5, 5.5, 2.5]});
		expect(waters[1]).toEqual({Kind: 'lake', Points: [[100, 0, undefined], [120, 0, undefined], [120, 20, undefined]], Level: 2});

		/* Under the water the bed: the water stands over it. */
		expect(field.Height(0, -25)).toBeLessThan(waters[0].Levels[0]);
	});

	it('paints what it lays: the palette of a biome over an area, a road and the sand of a beach', function () {
		var palette = {Low: [0.9, 0.1, 0.1], High: [0.9, 0.1, 0.1], Rock: [0.9, 0.1, 0.1], Snow: [0.9, 0.1, 0.1], Sand: [0.9, 0.1, 0.1], Deep: [0.9, 0.1, 0.1]};
		var field = terrain.Flat(Object.assign({}, GROUND, {Sketch: sketch([{ID: 'b', Type: 'biome', Points: [[-20, -20], [20, -20], [20, 20], [-20, 20]], Edge: 2, Palette: palette}, {ID: 'r', Type: 'road', Points: [[100, -50], [100, 50]], Width: 6}])}));

		expect(terrain.Paint(field, 0, 0, 2, 0)).toEqual([0.9, 0.1, 0.1]);
		expect(terrain.Paint(field, 100, 0, field.Height(100, 0), 0)).toEqual([0.5, 0.42, 0.32]);
		expect(terrain.Paint(field, -100, -100, 2, 0)).not.toEqual([0.9, 0.1, 0.1]);
	});

	it('tells where two sketches differ, and its workers make the very squares the page makes', async function () {
		var before = sketch([{ID: 'a', Type: 'raise', Points: [[0, 0]], Radius: 10}, {ID: 'b', Type: 'raise', Points: [[100, 100]], Radius: 10}]);
		var after = sketch([{ID: 'a', Type: 'raise', Points: [[0, 0]], Radius: 10}, {ID: 'b', Type: 'raise', Points: [[200, 100]], Radius: 10}, {ID: 'c', Type: 'crater', At: [-150, 0], Radius: 20}]);
		var options = Object.assign({}, GROUND, {Sketch: after});
		var page = terrain.Piece('Flat', options, null, [190, 100, 40, 8]);
		var worked = null;

		expect(terrain.SketchChanged(before, after)).toEqual([[90, 90, 110, 110], [190, 90, 210, 110], [-178, -28, -122, 28]]);
		expect(terrain.SketchChanged(after, after)).toEqual([]);

		terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', options, null, [190, 100, 40, 8]], function (error, piece) {
			worked = error || piece;
		});

		await waitFor(function () {
			return worked;
		}, 10000);

		expect(Array.from(worked.Positions)).toEqual(Array.from(page.Positions));
	});

	it('makes a ground again only where its sketch changed: the same ground, its squares there made again, what stands there set on it again', async function () {
		var ready = null;
		var component = Elemenx.Component(unique('SketchHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="600" Height="4" Water="0" Scale="300" Ridges="0" Seed="sketch" /></Scene></div>', Ready: function (space) {
			ready = space;
		}})();
		var scene;
		var inner;
		var engine;
		var ground;
		var near;
		var far;
		var before;
		var now = 1000;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		scene = ready;
		inner = scene.Scene();
		engine = scene.Engine();

		inner.Loop.Stop();

		scene.Add('unit', {ID: 'post', X: 10, Y: 0});
		scene.SetViewpoint({Target: [0, 2, 0], Yaw: 0, Pitch: 0.7, Distance: 60});

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 && Object.keys(inner.Ground.Nodes).length > 8;
		}, 20000);


		ground = inner.Ground;
		near = Object.keys(ground.Nodes).filter(function (key) {
			var node = ground.Nodes[key];

			return node.Size <= 75 && Math.abs(node.Center[0]) < node.Size && Math.abs(node.Center[2]) < node.Size;
		});
		far = Object.keys(ground.Nodes).filter(function (key) {
			var node = ground.Nodes[key];

			return node.Size <= 75 && Math.abs(node.Center[0] - 150) < 40;
		});
		before = {};

		Object.keys(ground.Nodes).forEach(function (key) {
			before[key] = ground.Nodes[key];
		});

		/*
		 * Regression: two changes before the squares of the first came (a mountain, then a river in the editor) left the squares
		 * asked for the first let go and never asked again: drawn as they were for good.
		 */
		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library(Object.assign({}, GROUND, {Sketch: sketch([{ID: 'hill', Type: 'raise', Points: [[10, 0]], Radius: 12, Amount: 3}])}))});

		inner.Rest = 0;

		engine.Frame(now += 33);

		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library(Object.assign({}, GROUND, {Sketch: sketch([{ID: 'hill', Type: 'raise', Points: [[10, 0]], Radius: 12, Amount: 6}])}))});

		inner.Rest = 0;

		engine.Frame(now += 33);

		/* The same ground, its field the sketched one, the squares under the hill made again, those far from it not. */
		expect(inner.Ground).toBe(ground);
		expect(inner.Ground.Field.Height(10, 0) - terrain.Flat(GROUND).Height(10, 0)).toBeCloseTo(6, 4);
		expect(near.length).toBeGreaterThan(0);
		expect(far.length).toBeGreaterThan(0);
		expect(far.every(function (key) {
			return ground.Nodes[key] && !ground.Nodes[key].Stale;
		})).toBe(true);
		expect(near.some(function (key) {
			return ground.Nodes[key] && ground.Nodes[key].Stale;
		})).toBe(true);

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return near.every(function (key) {
				return !ground.Nodes[key] || !ground.Nodes[key].Stale;
			}) && Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0;
		}, 20000);

		/* What is drawn now is of the new sketch, the square under the hill among it. */
		await waitFor(function () {
			var drawn = Object.keys(ground.Nodes).map(function (key) {
				return ground.Nodes[key];
			}).filter(function (node) {
				return node.Used === ground.Frame;
			});

			inner.Rest = 0;

			engine.Frame(now += 33);

			return drawn.length && drawn.every(function (node) {
				return !node.Stale;
			}) && drawn.some(function (node) {
				return Math.abs(node.Center[0] - 10) <= node.Size / 2 && Math.abs(node.Center[2]) <= node.Size / 2;
			});
		}, 20000);

		/* The squares far from the hill are the very ones they were; those under it, still drawn, new ones. */
		expect(far.every(function (key) {
			return ground.Nodes[key] === before[key];
		})).toBe(true);
		expect(near.filter(function (key) {
			return ground.Nodes[key];
		}).every(function (key) {
			return ground.Nodes[key] !== before[key];
		})).toBe(true);

		/* A change under all the view at once: more squares than the workers take in a frame, every one made again. */
		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library(Object.assign({}, GROUND, {Sketch: sketch([{ID: 'hill', Type: 'raise', Points: [[10, 0]], Radius: 12, Amount: 6}, {ID: 'wide', Type: 'plateau', Points: [[-200, -200], [200, -200], [200, 200], [-200, 200]], Height: 1, Edge: 20}])}))});

		await waitFor(function () {
			var drawn = Object.keys(ground.Nodes).map(function (key) {
				return ground.Nodes[key];
			}).filter(function (node) {
				return node.Used === ground.Frame;
			});

			inner.Rest = 0;

			engine.Frame(now += 33);

			return drawn.length > 8 && drawn.every(function (node) {
				return !node.Stale;
			});
		}, 30000);

		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library(Object.assign({}, GROUND, {Sketch: sketch([{ID: 'hill', Type: 'raise', Points: [[10, 0]], Radius: 12, Amount: 6}])}))});

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 && inner.Objects.post.World[1] > 4;
		}, 30000);

		/* What stands on the hill stands on it now. */
		expect(inner.Objects.post.World[1]).toBeCloseTo(inner.Ground.Field.Height(10, 0), 3);

		/* A river: its water drawn by the program of the sea, though this ground has no sea; gone with it. */
		var draw = engine.Renderer.Draw;
		var mesh = engine.Renderer.Mesh;
		var sea = 0;
		var flowing = null;
		var geometry = null;

		expect(inner.Ground.WaterMesh).toBe(null);

		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library(Object.assign({}, GROUND, {Sketch: sketch([{ID: 'w', Type: 'river', Points: [[-40, 20], [0, 20], [40, 20]], Width: 6, Depth: 2, Flow: 0}, {ID: 'f', Type: 'river', Points: [[-40, -60], [-40, -20]], Width: 6, Depth: 2, Flow: 3}])}))});

		engine.Renderer.Draw = function (made, program, uniforms) {
			if (made === inner.Ground.WaterMesh) {
				sea++;
				flowing = uniforms.uFlow;
			}

			return draw.apply(this, arguments);
		};

		/* The geometry of the water: the way each point runs and its speed in its color. */
		engine.Renderer.Mesh = function (made) {
			if (made && made.Colors && made.UVs && !geometry && made.Normals[1] === 1)
				geometry = made;

			return mesh.apply(this, arguments);
		};

		try {
			inner.Rest = 0;

			engine.Frame(now += 33);
		}
		finally {
			engine.Renderer.Draw = draw;
			engine.Renderer.Mesh = mesh;
		}

		expect(inner.Ground.WaterMesh).not.toBe(null);
		expect(sea).toBe(1);
		expect(flowing).toBe(1);

		/* Down the river from its first point: +X along the level one at its slowest; +Z along the one of a Flow, at its speed. */
		var ways = [];
		var i;

		for (i = 0; i < geometry.Colors.length; i += 3)
			ways.push(geometry.Colors.slice(i, i + 3).map(function (value) {
				return Math.round(value * 100) / 100;
			}).join(','));

		/* The one of a Flow at its speed; the other by the fall of its bed, from 0.8 to 4 metres a second. */
		expect(ways.filter(function (way) {
			return way.indexOf('0,1,') === 0;
		}).every(function (way) {
			return way === '0,1,3';
		})).toBe(true);
		expect(ways.filter(function (way) {
			return way.indexOf('1,0,') === 0;
		}).every(function (way) {
			var speed = Number(way.split(',')[2]);

			return speed >= 0.8 && speed <= 4;
		})).toBe(true);
		expect(ways.every(function (way) {
			return way.indexOf('0,1,') === 0 || way.indexOf('1,0,') === 0;
		})).toBe(true);
		expect(ways.some(function (way) {
			return way.indexOf('1,0,') === 0;
		})).toBe(true);

		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library(Object.assign({}, GROUND, {Sketch: null}))});

		inner.Rest = 0;

		engine.Frame(now += 33);

		expect(inner.Ground.WaterMesh).toBe(null);
	}, 60000);
});
