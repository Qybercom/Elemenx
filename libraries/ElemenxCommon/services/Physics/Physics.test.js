import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

/* Runs a world for some seconds in frames of 1/60. */
function run (world, seconds) {
	var frames = Math.round(seconds * 60);
	var i = 0;

	while (i < frames) {
		world.Step(1 / 60);

		i++;
	}
}

describe('Contract: Physics World, solid bodies that fall, strike and rest', function () {
	var physics;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Physics']);

		physics = Elemenx.Service('Physics');
	});

	it('lets a ball fall onto the ground and rest on it, then sleep', function () {
		var world = physics.World();
		var ball = world.Add({Shape: 'sphere', Radius: 0.5, At: [0, 5, 0]});

		run(world, 0.5);

		expect(ball.At[1]).toBeLessThan(5 - 0.5 * 9.81 * 0.25 * 0.9);
		expect(ball.Way[1]).toBeLessThan(-3);

		run(world, 4);

		expect(ball.At[1]).toBeCloseTo(0.5, 1);
		expect(Math.abs(ball.Way[1])).toBeLessThan(0.05);
		expect(ball.Sleeping).toBe(true);
	});

	it('bounces as much as it is told', function () {
		function peak (bounce) {
			var world = physics.World({Bounce: bounce, Sleep: false});
			var ball = world.Add({Shape: 'sphere', Radius: 0.5, At: [0, 3, 0], Bounce: bounce});
			var landed = false;
			var high = 0;
			var i = 0;

			while (i < 240) {
				world.Step(1 / 60);

				if (ball.Way[1] > 0)
					landed = true;

				if (landed)
					high = Math.max(high, ball.At[1]);

				i++;
			}

			return high;
		}

		var dead = peak(0);
		var lively = peak(0.8);

		expect(dead).toBeLessThan(0.6);
		expect(lively).toBeGreaterThan(1.5);
		expect(lively).toBeLessThan(3);
	});

	it('keeps the momentum of two balls that strike head on, and gives it across', function () {
		var world = physics.World({Ground: null, Gravity: 0, Sleep: false});
		var a = world.Add({Shape: 'sphere', Radius: 0.5, Mass: 1, At: [-2, 0, 0], Way: [3, 0, 0], Bounce: 1, Damping: 0});
		var b = world.Add({Shape: 'sphere', Radius: 0.5, Mass: 1, At: [2, 0, 0], Way: [0, 0, 0], Bounce: 1, Damping: 0});

		run(world, 2);

		expect(a.Way[0] + b.Way[0]).toBeCloseTo(3, 1);
		expect(a.Way[0]).toBeLessThan(0.5);
		expect(b.Way[0]).toBeGreaterThan(2.5);
		expect(b.At[0]).toBeGreaterThan(a.At[0] + 1);
	});

	it('stacks boxes that stand still on one another and sleep, flat and in their places', function () {
		var world = physics.World();
		var stack = [0, 1, 2].map(function (level) {
			return world.Add({Shape: 'box', Size: [1, 1, 1], At: [0, 0.5 + level * 1.01, 0]});
		});

		run(world, 5);

		stack.forEach(function (box, level) {
			expect(Math.abs(box.At[0])).toBeLessThan(0.05);
			expect(Math.abs(box.At[2])).toBeLessThan(0.05);
			expect(box.At[1]).toBeCloseTo(0.5 + level, 1);
			expect(Math.abs(box.Turn[3])).toBeGreaterThan(0.999);
			expect(box.Sleeping).toBe(true);
		});
	});

	it('tumbles a box dropped askew until it lies on a face, and one turned on another stays on it', function () {
		var world = physics.World();
		var q = [Math.sin(0.3) * 0.6, Math.sin(0.3) * 0.8, 0, Math.cos(0.3)];
		var box = world.Add({Shape: 'box', Size: [1, 1, 1], At: [0, 2, 0], Turn: q, Spin: [1, 0, 2]});
		var base = world.Add({Shape: 'box', Size: [2, 1, 2], At: [5, 0.5, 0]});
		var top = world.Add({Shape: 'box', Size: [1, 0.5, 1], At: [5, 1.3, 0], Turn: [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)]});
		var x;
		var y;
		var z;
		var w;

		run(world, 6);

		[x, y, z, w] = box.Turn;

		/* How far up each axis of the box looks: one of them straight up when it lies on a face. */
		expect(box.At[1]).toBeCloseTo(0.5, 1);
		expect(Math.max(Math.abs(2 * (x * y + z * w)), Math.abs(1 - 2 * (x * x + z * z)), Math.abs(2 * (y * z - x * w)))).toBeGreaterThan(0.99);
		expect(box.Sleeping).toBe(true);
		expect(base.At[1]).toBeCloseTo(0.5, 1);
		expect(top.At[1]).toBeCloseTo(1.25, 1);
		expect(Math.abs(top.At[0] - 5)).toBeLessThan(0.05);
		expect(top.Sleeping).toBe(true);
	});

	it('lets a heap of balls, boxes and capsules settle with none sunk, none flung away', function () {
		/* Rough ground, so the balls do not roll for ever. */
		var world = physics.World({Rolling: 0.3});
		var shapes = ['sphere', 'box', 'capsule'];
		var i = 0;

		while (i < 60) {
			world.Add({Shape: shapes[i % 3], Radius: 0.3, Size: [0.6, 0.6, 0.6], Height: 0.5, At: [(i % 4) * 0.7 - 1, 0.5 + Math.floor(i / 4) * 0.8, (i % 3) * 0.3]});

			i++;
		}

		run(world, 12);

		world.Bodies().forEach(function (body) {
			expect(Number.isFinite(body.At[0] + body.At[1] + body.At[2])).toBe(true);
			expect(body.At[1]).toBeGreaterThan(0.2);
			expect(Math.hypot(body.At[0], body.At[2])).toBeLessThan(25);
			expect(Math.hypot(...body.Way)).toBeLessThan(0.5);
		});
	});

	it('holds back a rolling ball as much as it is told, and none at 0', function () {
		function rolled (rolling) {
			var world = physics.World({Rolling: rolling, Sleep: false});
			var ball = world.Add({Shape: 'sphere', Radius: 0.5, At: [0, 0.5, 0], Way: [3, 0, 0], Spin: [0, 0, -6], Rolling: rolling, Damping: 0, Angular: 0});

			run(world, 4);

			return Math.hypot(...ball.Way);
		}

		expect(rolled(0)).toBeGreaterThan(2.9);
		expect(rolled(0.1)).toBeLessThan(0.5);
	});

	it('wakes a sleeping box when another strikes it, and when it is pushed', function () {
		var world = physics.World();
		var box = world.Add({Shape: 'box', Size: [1, 1, 1], At: [0, 0.5, 0]});
		var ball;

		run(world, 2);

		expect(box.Sleeping).toBe(true);

		ball = world.Add({Shape: 'sphere', Radius: 0.3, Mass: 5, At: [-3, 0.5, 0], Way: [8, 0, 0], Gravity: 0});

		run(world, 0.6);

		expect(box.Sleeping).toBe(false);
		expect(box.At[0]).toBeGreaterThan(0.1);
		expect(ball.At[0]).toBeLessThan(box.At[0]);
		expect(world.Remove(ball)).toBe(true);

		run(world, 4);

		expect(box.Sleeping).toBe(true);

		world.Push(box, [0, 6, 0]);

		expect(box.Sleeping).toBe(false);
		expect(box.Way[1]).toBeCloseTo(6, 5);
	});

	it('lets a body it does not move, moved by its owner with a way, wake a sleeping ball and push it', function () {
		var world = physics.World();
		var ball = world.Add({Shape: 'sphere', Radius: 0.5, At: [0, 0.5, 0], Mass: 0.5});
		var pusher = world.Add({Shape: 'capsule', Radius: 0.4, Height: 1, Mass: 0, At: [-3, 0.9, 0]});
		var i = 0;

		run(world, 2);

		expect(ball.Sleeping).toBe(true);

		/* Moved by hand, 4 m/s, frame by frame, as a walker is. */
		while (i < 60) {
			pusher.Way = [4, 0, 0];
			pusher.At = [pusher.At[0] + 4 / 60, 0.9, 0];

			world.Step(1 / 60);

			i++;
		}

		expect(ball.At[0]).toBeGreaterThan(0.5);
	});

	it('holds a box on a slope by friction, and lets it slide off one of ice', function () {
		function slid (friction) {
			var tilt = 20 * Math.PI / 180;
			var world = physics.World({Ground: function (x) {
				return -Math.tan(tilt) * x;
			}, Friction: friction});
			var box = world.Add({Shape: 'box', Size: [1, 0.4, 1], At: [0, 0.3, 0], Turn: [0, 0, -Math.sin(tilt / 2), Math.cos(tilt / 2)], Friction: friction});

			run(world, 2);

			return box.At[0];
		}

		expect(Math.abs(slid(0.9))).toBeLessThan(0.15);
		expect(slid(0.02)).toBeGreaterThan(1.5);
	});

	it('keeps a ball still on a static box, a body of no mass, which never moves', function () {
		var world = physics.World({Ground: null});
		var floor = world.Add({Shape: 'box', Size: [10, 1, 10], At: [0, -0.5, 0], Mass: 0});
		var ball = world.Add({Shape: 'sphere', Radius: 0.5, At: [1, 2, 0]});
		var capsule = world.Add({Shape: 'capsule', Radius: 0.3, Height: 1, At: [-2, 2, 0]});

		run(world, 3);

		expect(floor.At).toEqual([0, -0.5, 0]);
		expect(ball.At[1]).toBeCloseTo(0.5, 1);
		expect(capsule.At[1]).toBeCloseTo(0.8, 1);
	});

	it('lays a capsule down on its side when it falls tilted', function () {
		var world = physics.World();
		var capsule = world.Add({Shape: 'capsule', Radius: 0.25, Height: 1.5, At: [0, 1.5, 0], Turn: [0, 0, Math.sin(0.15), Math.cos(0.15)]});

		run(world, 6);

		expect(capsule.At[1]).toBeCloseTo(0.25, 1);
		expect(Math.abs(capsule.Turn[2])).toBeGreaterThan(0.65);
	});

	it('swings a ball on a rod at its length, and lets one on a rope fall until the rope is taut', function () {
		var world = physics.World({Ground: null, Sleep: false});
		var bob = world.Add({Shape: 'sphere', Radius: 0.1, At: [2, 5, 0], Damping: 0});
		var hanging = world.Add({Shape: 'sphere', Radius: 0.1, At: [10, 5, 0], Damping: 0});
		var low = 5;
		var i = 0;

		world.Joint(bob, null, {From: bob.At, To: [0, 5, 0]});
		world.Joint(hanging, null, {From: hanging.At, To: [10, 5, 0], Length: 3, Rope: true});

		while (i < 120) {
			world.Step(1 / 60);

			low = Math.min(low, bob.At[1]);

			expect(Math.hypot(bob.At[0], bob.At[1] - 5, bob.At[2])).toBeCloseTo(2, 1);

			i++;
		}

		expect(low).toBeLessThan(3.2);

		run(world, 3);

		expect(hanging.At[1]).toBeGreaterThan(1.8);
		expect(hanging.At[1]).toBeLessThan(2.2);
	});

	it('finds what a ray meets first: a ball, a box, a capsule or the ground, with the normal there', function () {
		var world = physics.World({Ground: function (x) {
			return x * 0.5;
		}});
		var ball = world.Add({ID: 'ball', Shape: 'sphere', Radius: 1, At: [0, 5, 0], Mass: 0});
		var box = world.Add({ID: 'box', Shape: 'box', Size: [2, 2, 2], At: [10, 5, 0], Mass: 0, Turn: [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)]});
		var capsule = world.Add({ID: 'capsule', Shape: 'capsule', Radius: 0.5, Height: 2, At: [20, 5, 0], Mass: 0});
		var hit = world.Ray([0, 20, 0], [0, -1, 0]);

		expect(hit.Body).toBe(ball);
		expect(hit.Distance).toBeCloseTo(14, 5);
		expect(hit.Normal[1]).toBeCloseTo(1, 5);

		hit = world.Ray([10, 20, 0], [0, -1, 0]);

		expect(hit.Body).toBe(box);
		expect(hit.At[1]).toBeCloseTo(6, 5);

		hit = world.Ray([15, 5.5, 0], [1, 0, 0], 100, function (body) {
			return body !== null;
		});

		expect(hit.Body).toBe(capsule);
		expect(hit.At[0]).toBeCloseTo(19.5, 5);
		expect(hit.Normal[0]).toBeCloseTo(-1, 5);

		hit = world.Ray([4, 20, 0], [0, -1, 0]);

		expect(hit.Body).toBe(null);
		expect(hit.At[1]).toBeCloseTo(2, 3);
		expect(hit.Normal[0]).toBeLessThan(-0.4);

		expect(world.Ray([0, 20, 0], [0, -1, 0], 10)).toBe(null);
		expect(world.Ray([0, 20, 0], [0, -1, 0], 100, function (body) {
			return body !== ball;
		}).Body).toBe(null);
	});

	it('floats a light board on water, face up, and lets a heavy box sink', function () {
		var world = physics.World({Ground: -10, Water: {Level: 0}});
		var light = world.Add({Shape: 'box', Size: [2, 0.4, 2], Mass: 640, At: [0, 1, 0], Turn: [Math.sin(0.3), 0, 0, Math.cos(0.3)]});
		var heavy = world.Add({Shape: 'box', Size: [1, 1, 1], Mass: 3000, At: [5, 1, 0]});
		var ball = world.Add({Shape: 'sphere', Radius: 0.5, Mass: 100, At: [-5, 1, 0]});
		var x;
		var y;
		var z;
		var w;

		run(world, 12);

		[x, y, z, w] = light.Turn;

		/* 640 kg in 1.6 cubic metres: 0.4 of it under, 0.16 of its 0.4, its middle 0.04 above. */
		expect(light.At[1]).toBeCloseTo(0.04, 1);
		expect(Math.max(Math.abs(2 * (x * y + z * w)), Math.abs(1 - 2 * (x * x + z * z)), Math.abs(2 * (y * z - x * w)))).toBeGreaterThan(0.98);
		expect(heavy.At[1]).toBeCloseTo(-9.5, 1);
		expect(ball.At[1]).toBeGreaterThan(0);
	});

	it('lets a ragdoll fall limp to the ground, its parts held together, none through another', function () {
		var world = physics.World();
		var doll = world.Ragdoll([0, 0.05, 0], {Height: 1.8});
		var names = Object.keys(doll.Parts);

		expect(names.length).toBe(11);

		world.Push(doll.Parts.Chest, [40, 0, 0]);

		run(world, 5);

		/* Fallen: the head down near the ground, every part on it, the joints whole. */
		expect(doll.Parts.Head.At[1]).toBeLessThan(0.5);

		names.forEach(function (name) {
			var part = doll.Parts[name];

			expect(Number.isFinite(part.At[1])).toBe(true);
			expect(part.At[1]).toBeGreaterThan(0);
			expect(part.At[1]).toBeLessThan(0.6);
		});

		expect(Math.hypot(doll.Parts.ShinLeft.At[0] - doll.Parts.ThighLeft.At[0], doll.Parts.ShinLeft.At[1] - doll.Parts.ThighLeft.At[1], doll.Parts.ShinLeft.At[2] - doll.Parts.ThighLeft.At[2])).toBeLessThan(0.55);

		doll.Remove();

		expect(world.Bodies()).toEqual([]);
	});

	it('hangs a cloth from its top, lays it over a ball, and lets a rope swing at its length', function () {
		var cloth = physics.Cloth({Columns: 12, Rows: 12, Spacing: 0.1, At: [-0.55, 2, -0.55], Across: [1, 0, 0], Down: [0, 0, 1], Pinned: 'none', Ground: 0, Colliders: [{At: [0, 1, 0], Radius: 0.4}]});
		var rope = physics.Rope({From: [0, 5, 0], To: [2, 5, 0], Segments: 10});
		var curtain = physics.Cloth({Columns: 5, Rows: 5, Spacing: 0.2, At: [0, 3, 0]});
		var i = 0;
		var middle;
		var length;

		while (i < 180) {
			cloth.Step(1 / 60);
			rope.Step(1 / 60);
			curtain.Step(1 / 60);

			i++;
		}

		/* The middle rests on top of the ball, the corners hang lower. */
		middle = cloth.Points[cloth.Index(6, 6)];

		expect(Math.hypot(middle[0], middle[1] - 1, middle[2])).toBeGreaterThan(0.39);
		expect(middle[1]).toBeGreaterThan(1.3);
		expect(cloth.Points[0][1]).toBeLessThan(1.2);

		/* The rope hangs down from where it is held, as long as it was. */
		length = 0;

		rope.Links.forEach(function (item) {
			length += Math.hypot(rope.Points[item[1]][0] - rope.Points[item[0]][0], rope.Points[item[1]][1] - rope.Points[item[0]][1], rope.Points[item[1]][2] - rope.Points[item[0]][2]);
		});

		expect(rope.Points[0]).toEqual([0, 5, 0]);
		expect(rope.Points[10][1]).toBeLessThan(3.5);
		expect(length).toBeCloseTo(2, 1);

		/* The curtain keeps its top where it was; the wind blows it aside. */
		expect(curtain.Points[2]).toEqual([0.4, 3, 0]);

		curtain.Blow([0, 0, 15]);

		i = 0;

		while (i < 120) {
			curtain.Step(1 / 60);

			i++;
		}

		expect(curtain.Points[curtain.Index(2, 4)][2]).toBeGreaterThan(0.3);
	});

	it('sends rings out over water from where it is struck, and lets them die away', function () {
		var waves = physics.Waves({Columns: 41, Rows: 41, Cell: 0.5, At: [-10, -10], Speed: 4, Damping: 0.5});
		var first = -1;
		var t = 0;

		waves.Disturb(0, 0, 1, 1.5);

		expect(waves.Height(0, 0)).toBeCloseTo(1, 1);
		expect(waves.Height(6, 0)).toBe(0);

		/* A ring reaches 6 m out after about 6 / 4 s. */
		while (t < 3) {
			waves.Step(1 / 60);

			t += 1 / 60;

			if (first < 0 && Math.abs(waves.Height(6, 0)) > 0.02)
				first = t;
		}

		expect(first).toBeGreaterThan(0.9);
		expect(first).toBeLessThan(2);

		while (t < 15) {
			waves.Step(1 / 60);

			t += 1 / 60;
		}

		expect(Math.max(...Array.from(waves.Heights).map(Math.abs))).toBeLessThan(0.05);
	});

	it('lets a block of fluid fall, spread over its box and settle, near the density of water', function () {
		var fluid = physics.Fluid({Radius: 0.2, Min: [-1, 0, -0.3], Max: [1, 3, 0.3]});
		var particles;
		var left;
		var right;
		var high;

		fluid.Pour([-0.95, 0.05, -0.25], 300, 6);

		expect(fluid.Count()).toBe(300);

		high = Math.max(...fluid.Particles().map(function (p) {
			return p.At[1];
		}));

		let i = 0;

		while (i < 180) {
			fluid.Step(1 / 60);

			i++;
		}

		particles = fluid.Particles();
		left = Math.min(...particles.map((p) => p.At[0]));
		right = Math.max(...particles.map((p) => p.At[0]));

		/* A dam that broke: it went from a corner across the box, and lower than it stood. */
		expect(particles.every((p) => Number.isFinite(p.At[0] + p.At[1] + p.At[2]))).toBe(true);
		expect(right - left).toBeGreaterThan(1.2);
		expect(Math.max(...particles.map((p) => p.At[1]))).toBeLessThan(high);
		expect(particles.every((p) => p.At[1] >= 0 && p.At[1] <= 3 && p.At[0] >= -1 && p.At[0] <= 1)).toBe(true);
		expect(Math.max(...particles.map((p) => Math.hypot(...p.Way)))).toBeLessThan(1);
		expect(Math.max(...particles.map((p) => p.Density))).toBeGreaterThan(700);
		expect(Math.max(...particles.map((p) => p.Density))).toBeLessThan(1300);

		fluid.Clear();

		expect(fluid.Count()).toBe(0);
	});

	it('tells once when two begin to touch, and lists what touches', function () {
		var touches = [];
		var world = physics.World({Touch: function (a, b, contact) {
			touches.push([a.ID, b ? b.ID : null, contact.Impulse]);
		}});

		world.Add({ID: 'ball', Shape: 'sphere', Radius: 0.5, At: [0, 2, 0], Bounce: 0});

		run(world, 2);

		expect(touches.length).toBe(1);
		expect(touches[0][0]).toBe('ball');
		expect(touches[0][1]).toBe(null);
		expect(touches[0][2]).toBeGreaterThan(1);
		expect(world.Contacts().length).toBe(0);

		world.Bodies()[0].Sleeping = false;

		world.Step(1 / 60);

		expect(world.Contacts()[0].Normal).toEqual([0, 1, 0]);
		expect(touches.length).toBe(1);
		expect(world.Remove(world.Bodies()[0])).toBe(true);
		expect(world.Bodies()).toEqual([]);
	});
});

describe('Contract: Physics Boat, a boat on the waves', function () {
	var physics;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Physics']);

		physics = Elemenx.Service('Physics');
	});

	function boat () {
		return {X: 0, Z: 0, Heading: 0, Forward: 0, Aside: 0, Rate: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0};
	}

	function sail (state, input, sea, bed, seconds, settings) {
		var i;

		for (i = 0; i < seconds * 120; i++)
			physics.Boat(state, input, sea, bed, settings || {}, 1 / 120);

		return state;
	}

	function calm () {
		return {Height: 0};
	}

	function deep () {
		return -20;
	}

	it('comes to its top speed at full gas, turns only as water goes past its rudder, and slows when let go', function () {
		var still = sail(boat(), {Steer: 1}, calm, deep, 3);
		var going = sail(boat(), {Gas: 1}, calm, deep, 30, {Top: 16});

		expect(still.Heading).toBeCloseTo(0, 6);
		expect(going.Forward).toBeGreaterThan(14);
		expect(going.Forward).toBeLessThan(16.1);
		expect(going.Z).toBeGreaterThan(200);
		expect(Math.abs(going.X)).toBeLessThan(1e-6);
		/* The bow rises as it goes fast. */
		expect(going.Pitch).toBeGreaterThan(0.05);

		sail(going, {Gas: 1, Steer: 1}, calm, deep, 2);

		expect(going.Heading).toBeGreaterThan(1);
		expect(going.Roll).not.toBe(0);

		sail(going, {}, calm, deep, 20);

		expect(going.Forward).toBeLessThan(2);
	});

	it('rides on the water, its bow up where a wave lifts it, and runs aground where the bed comes up', function () {
		var riding = sail(boat(), {}, function (x, z) {
			return {Height: 1 + z * 0.1};
		}, deep, 6, {Draft: 0.35});
		var beached = sail(boat(), {Gas: 1}, calm, function (x, z) {
			return z > 30 ? 0 : -10;
		}, 20);

		expect(riding.Y).toBeCloseTo(1 - 0.35, 1);
		expect(riding.Pitch).toBeCloseTo(Math.atan(0.1), 1);
		expect(beached.Aground).toBe(true);
		expect(beached.Z).toBeLessThan(30);
		expect(beached.Forward).toBeLessThan(1);
	});
});
