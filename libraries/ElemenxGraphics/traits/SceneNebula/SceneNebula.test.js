import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('NebulaHost'), {$Template: '<div style="width: 400px; height: 300px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="orion" Kind="nebula" Type="hii" Radius="6" Seed="orion" />' +
		'<SceneObject ID="ring" Kind="nebula" Type="planetary" Radius="0.6" Distance="400000" />' +
		'<SceneObject ID="tycho" Kind="nebula" Type="remnant" Subtype="Ia" Radius="10" Distance="2000000" />' +
		'<SceneObject ID="coal" Kind="nebula" Type="dark" Radius="4" Distance="900000" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready && ready.Get('orion');
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

describe('Contract: the nebulae of a Scene: clouds of gas and dust drawn as volumes, from outside and from within', function () {
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
	});

	function frames (scene, count) {
		var i;

		for (i = 0; i < count; i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
	}

	it('makes each kind of its look and size: a cloud where stars are born, a shell of a dying star, a remnant of each supernova, dark dust', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var inner = scene.Scene();

		frames(scene, 2);

		expect(engine.NebulaLook('orion')).toMatchObject({Type: 'hii', Subtype: ''});
		expect(engine.NebulaLook('ring').Type).toBe('planetary');
		expect(engine.NebulaLook('tycho')).toMatchObject({Type: 'remnant', Subtype: 'Ia'});
		expect(engine.NebulaLook('coal').Dust).toBeGreaterThan(engine.NebulaLook('orion').Dust * 2);

		/* A remnant of hydrogen (II) red; of a stripped star (Ic) none of that red. */
		scene.Change('tycho', {Subtype: 'Ic'});

		expect(engine.NebulaLook('tycho').Colors[0][0]).toBeLessThan(engine.NebulaLook('tycho').Colors[0][2]);

		/* As wide as its light years are, laid out as the scene lays out distances. */
		expect(inner.Objects.orion.Size).toBeGreaterThan(inner.Objects.ring.Size * 3);
		expect(scene.Describe('orion').Kind).toBe('nebula');
	});

	/* Regression: a nebula at the root of a system was given its first star as what it goes round, round itself in turn, far off. */
	it('keeps a nebula at the root of a system in the middle, its stars round it', async function () {
		var ready = null;
		var host = Elemenx.Component(unique('NebulaRoot'), {$Template: '<div style="width: 300px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" [System]="Held" (ready)="Ready" /></div>', Held: {Objects: [{ID: 'cloud', Kind: 'nebula', Traits: {Nebula: {Type: 'hii', Radius: 8}}, Children: [{ID: 'young', Kind: 'star', Traits: {Star: {Mass: 20}, Orbit: {Distance: 9000, Unit: 'AU'}}}]}]}, Ready: function (space) {
			ready = space;
		}})();
		var world;

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		await waitFor(function () {
			return ready && ready.Get('cloud');
		}, 4000);

		ready.Scene().Loop.Stop();

		frames(ready, 2);

		world = ready.Scene().Objects.cloud.World;

		expect(ready.Get('cloud').Parent || '').toBe('');
		expect(ready.Get('young').Parent).toBe('cloud');
		expect(Math.hypot(world[0], world[1], world[2])).toBeLessThan(1e-6);
	});

	it('bakes its shape once, then draws it through its ball: what stands before it hides it from outside, all of it around the eye within', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var inner = scene.Scene();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var marches = [];
		var orion;

		renderer.Draw = function (mesh, program, uniforms, state) {
			if (uniforms && uniforms.uBlock)
				marches.push({Uniforms: uniforms, State: state});

			return draw.apply(this, arguments);
		};

		try {
			inner.Active.forEach(function (object) {
				if (object.ID !== 'orion')
					object.Hidden = true;
			});

			orion = inner.Objects.orion;
			inner.Camera.Position = [orion.World[0], orion.World[1], orion.World[2] + orion.Size * 3];

			await waitFor(function () {
				frames(scene, 1);

				return marches.length > 0;
			}, 30000);

			expect(engine.NebulaLook('orion').Baked).toBe(true);
			expect(marches[0].State).toMatchObject({Blend: 'premultiplied', Depth: true, DepthWrite: false});
			expect(marches[0].Uniforms.uDepth).toBeGreaterThan(-1);

			/* Within it: around the eye, nothing before it. */
			marches.length = 0;

			scene.FocusOn('orion');

			inner.Target = orion.World.slice();
			inner.Moving = 1;
			inner.Wanted = inner.Distance = orion.Size * 0.3;

			frames(scene, 3);

			expect(marches.length).toBeGreaterThan(0);
			expect(marches[marches.length - 1].State.Depth).toBe(false);
			expect(marches[marches.length - 1].Uniforms.uDepth).toBe(-1);
		}
		finally {
			renderer.Draw = draw;
		}
	}, 60000);
});
