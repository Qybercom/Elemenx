import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import mannequinSource from '../../libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.js?raw';

var man;
var bones;

function times (a, b) {
	return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
}

function rotate (q, v) {
	var r = times(times(q, [v[0], v[1], v[2], 0]), [-q[0], -q[1], -q[2], q[3]]);

	return [r[0], r[1], r[2]];
}

/* Where the soles of a pose are: the heel, the joint of the toes and their tip of each foot, of the bones turned. */
function soles (skeleton, pose) {
	var made = man.Pose(skeleton, Object.keys(pose).reduce(function (all, key) {
		if (key !== 'Root')
			all[key] = pose[key];

		return all;
	}, {}));
	var turns = [];
	var at = [];
	var out = [];

	skeleton.forEach(function (bone, i) {
		var p = bone.Parent;

		if (p === -1) {
			turns[i] = made.Turns[i];
			at[i] = [bone.At[0] + pose.Root[0], bone.At[1] + pose.Root[1], bone.At[2] + pose.Root[2]];

			return;
		}

		var moved = rotate(turns[p], [bone.At[0] - skeleton[p].At[0], bone.At[1] - skeleton[p].At[1], bone.At[2] - skeleton[p].At[2]]);

		turns[i] = times(turns[p], made.Turns[i]);
		at[i] = [at[p][0] + moved[0], at[p][1] + moved[1], at[p][2] + moved[2]];
	});

	['Left', 'Right'].forEach(function (side) {
		var ankle = man.Find(skeleton, side + 'Foot');
		var toe = man.Find(skeleton, side + 'ToeBase');
		var tip = skeleton[man.Find(skeleton, side + 'Toe_End')].At;
		var a = skeleton[ankle].At;
		var t = skeleton[toe].At;

		[[ankle, [a[0], 0, a[2] - 0.035 * 1.78]], [toe, [t[0], t[1] - 0.025, t[2]]], [toe, [tip[0], 0, tip[2]]]].forEach(function (one) {
			var origin = skeleton[one[0]].At;
			var r = rotate(turns[one[0]], [one[1][0] - origin[0], one[1][1] - origin[1], one[1][2] - origin[2]]);

			out.push([at[one[0]][0] + r[0], at[one[0]][1] + r[1], at[one[0]][2] + r[2]]);
		});
	});

	return out;
}

/* A cycle of a gait of 100 frames: how far its planted soles slide (centimetres a cycle), the lowest sole of each frame. */
function walked (name, skeleton, graph) {
	var values = man.GaitValues(graph || name);
	var v0 = values(0);
	var frames = 100;
	var travel = (v0.Direction || 0) * Math.PI / 180;
	var want = (v0.Back ? 1 : -1) * (v0.Stride || 0) / frames;
	var last = null;
	var slide = 0;
	var lows = [];
	var poses = [];
	var k;

	for (k = 0; k < frames; k++) {
		var pose = man.GaitPose(skeleton, values, k / frames, 1, 1.78);
		var now = soles(skeleton, pose);

		poses.push(pose);
		lows.push(Math.min.apply(null, now.map(function (point) {
			return point[1];
		})));

		if (last)
			now.forEach(function (point, j) {
				if (point[1] < 0.004 && last[j][1] < 0.004)
					slide += Math.hypot(point[0] - last[j][0] - want * Math.sin(travel), point[2] - last[j][2] - want * Math.cos(travel));
			});

		last = now;
	}

	return {Slide: slide * 100, Lows: lows, Poses: poses};
}

/*
 * Regression: the gaits of the mannequin were sines of code (walk, jog, sprint, back, strafes, crouch, jump), a stride the
 * feet did not travel (they slid back and forth on the ground), the knee bent but once, no roll of the foot, no turn of the
 * hips. Each is a graph of the library now (blueprints/animation/<clip>): its legs of the path of the feet, the feet planted
 * do not slide, the stride is what they travel, and the turns are those of a walk of a person (within degrees of Mixamo's).
 */
describe('Regression: the gaits of the mannequin, graphs of the library, the feet planted', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneMannequin', 'service:Blueprints']);

		man = Elemenx.Service('SceneMannequin');
		bones = man.Skeleton({});
	});

	it('makes each gait of its graph, its stride what its feet travel: the feet on the ground do not slide', function () {
		['walk', 'jog', 'sprint', 'walk-back', 'run-back', 'strafe-left', 'strafe-right', 'strafe-left-run', 'strafe-right-run', 'crouch-walk'].forEach(function (name) {
			var made = walked(name, bones);

			expect([name, made.Slide < 3]).toEqual([name, true]);
			expect(Math.min.apply(null, made.Lows)).toBeGreaterThan(-0.004);
		});

		['idle', 'crouch'].forEach(function (name) {
			expect(walked(name, bones).Slide).toBeLessThan(0.5);
		});

		/* Walking, a foot is always down. */
		expect(Math.max.apply(null, walked('walk', bones).Lows)).toBeLessThan(0.006);
		expect(mannequinSource).not.toContain('function gait (');
	});

	it('walks as a person: the knee bent twice, the hips turning, the stride and the cycle of a walk', function () {
		var made = walked('walk', bones);
		var clip = man.Gait(bones, 'walk');
		var knees = made.Poses.map(function (pose) {
			return pose.LeftLeg[0];
		});
		var hips = made.Poses.map(function (pose) {
			return pose.LeftUpLeg[0];
		});
		var turns = made.Poses.map(function (pose) {
			return pose.Hips[1];
		});

		expect(Math.max.apply(null, knees)).toBeGreaterThan(55);
		expect(Math.max.apply(null, knees)).toBeLessThan(72);
		expect(Math.min.apply(null, hips)).toBeLessThan(-30);
		expect(Math.max.apply(null, hips)).toBeGreaterThan(5);
		expect(Math.max.apply(null, turns) - Math.min.apply(null, turns)).toBeGreaterThan(6);

		/* The knee takes the weight after the heel strikes: a bend of its own before the swing's. */
		expect(knees.slice(0, 30).some(function (knee, i) {
			return i > 0 && i < 29 && knee > knees[i - 1] && knee >= knees[i + 1];
		})).toBe(true);
		expect(clip.Stride * 1.78).toBeCloseTo(1.575, 3);
		expect(clip.Length).toBeCloseTo(0.95, 3);
		expect(clip.Loop).toBe(true);
	});

	it('mirrors a strafe to the right, the left leg doing what the right one did', function () {
		var left = walked('strafe-left', bones).Poses;
		var right = walked('strafe-right', bones).Poses;

		left.forEach(function (pose, i) {
			expect(right[i].LeftUpLeg[0]).toBeCloseTo(pose.RightUpLeg[0], 6);
			expect(right[i].LeftUpLeg[2]).toBeCloseTo(-pose.RightUpLeg[2], 6);
			expect(right[i].Hips[1]).toBeCloseTo(-pose.Hips[1], 6);
		});
	});

	it('jumps of the ground and lands on it, the feet off it in the air', function () {
		var clip = man.Gait(bones, 'jump');
		var values = man.GaitValues('jump');
		var heights = [];
		var k;

		for (k = 0; k <= 20; k++)
			heights.push(Math.min.apply(null, soles(bones, man.GaitPose(bones, values, k / 20, 1, 1.78)).map(function (point) {
				return point[1];
			})));

		expect(clip.Loop).toBe(false);
		expect(heights[0]).toBeLessThan(0.004);
		expect(heights[20]).toBeLessThan(0.004);
		expect(Math.max.apply(null, heights)).toBeGreaterThan(0.12);
	});
});

/*
 * Regression: the mannequin's hip joint stood at half its height, its thigh shorter than its shank (0.38 m against 0.43):
 * at the stride of a run the knees bent deep, a crouched run. The joints are where a person has them now: the hip at 0.53 of
 * the height, the thigh as long as the shank, the arms of their length; the chest and the head stay where they were.
 */
describe('Regression: the proportions of the mannequin', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneMannequin']);

		man = Elemenx.Service('SceneMannequin');
	});

	it('has the hip at 0.53 of its height, the thigh as long as the shank, the arm and forearm of a person', function () {
		var skeleton = man.Skeleton({});

		function at (name) {
			return skeleton[man.Find(skeleton, name)].At;
		}

		function length (a, b) {
			return Math.hypot(at(a)[0] - at(b)[0], at(a)[1] - at(b)[1], at(a)[2] - at(b)[2]) / 1.78;
		}

		expect(at('LeftUpLeg')[1] / 1.78).toBeCloseTo(0.53, 2);
		expect(at('LeftLeg')[1] / 1.78).toBeCloseTo(0.285, 3);
		expect(Math.abs(length('LeftUpLeg', 'LeftLeg') - length('LeftLeg', 'LeftFoot'))).toBeLessThan(0.01);
		expect(length('LeftArm', 'LeftForeArm')).toBeCloseTo(0.172, 3);
		expect(length('LeftForeArm', 'LeftHand')).toBeCloseTo(0.146, 3);
		expect(at('Neck')[1] / 1.78).toBeCloseTo(0.83, 3);
		expect(at('HeadTop_End')[1]).toBeCloseTo(1.78, 3);
	});
});

/*
 * Regression: the poses of the mannequin (lying, crawling, aiming, seated, hanging, swimming) were functions of code, and the
 * gaits of graphs had open flat hands. Each pose is a graph of the library now (Pose: every bone of its keys), the same pose
 * on the skeleton of now; the hands of the gaits curl.
 */
describe('Regression: the poses of the mannequin, graphs of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneMannequin', 'service:Blueprints']);

		man = Elemenx.Service('SceneMannequin');
		bones = man.Skeleton({});
	});

	it('makes every clip of its graph, the poses as they were, the fingers of the gaits curled', function () {
		var hips = bones[0].At[1];
		var lying = man.GaitPose(bones, man.GaitValues('lie-front'), 0, 1, 1.78);
		var seated = man.GaitPose(bones, man.GaitValues('sit'), 0.3, 1, 1.78);
		var walking = man.GaitPose(bones, man.GaitValues('walk'), 0.2, 1, 1.78);
		var names = man.Clips(bones, {}).map(function (clip) {
			return clip.Name;
		});

		expect(names).toEqual(man.Gaits.concat(man.Poses));
		expect(lying.Root[1]).toBeCloseTo(-(hips - 0.11 * 1.78), 3);
		expect(lying.Hips[0]).toBeCloseTo(90, 6);
		expect(seated.LeftUpLeg[0]).toBeCloseTo(-88, 6);
		expect(seated.RightUpLeg[2]).toBeCloseTo(-4, 6);
		expect(walking.LeftFingers).toBe(15);
		expect(walking.RightFingers).toBe(15);
		expect(man.Gait(bones, 'swim-crawl').Stride * 1.78).toBeCloseTo(1.3 * 1.78, 2);
		expect(mannequinSource).not.toContain("add('lie-front'");
	});
});

describe('Contract: SceneMannequin.Gait, a clip of a graph of a gait', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneMannequin', 'service:Blueprints']);

		man = Elemenx.Service('SceneMannequin');
		bones = man.Skeleton({});
	});

	it('makes a clip of a graph of its own: its stride of its graph, the feet still planted', function () {
		var graph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/walk')));
		var stride = graph.blocks.filter(function (block) {
			return block.id === 'animation-walk-number-stride';
		})[0];
		var clip;

		stride.properties[0].value = 1.2;
		graph.name = 'short-walk';
		clip = man.Gait(bones, graph);

		expect(clip.Name).toBe('short-walk');
		expect(clip.Stride * 1.78).toBeCloseTo(1.2, 6);
		expect(walked('walk', bones, graph).Slide).toBeLessThan(3);
		expect(man.Gaits).toContain('strafe-right-run');
	});

	it('fits a gait to the legs of the person: a shorter one strides shorter, its cycle quicker', function () {
		var small = man.Skeleton({Height: 1.5});
		var clip = man.Gait(small, 'walk', {Height: 1.5});
		var normal = man.Gait(bones, 'walk');
		var scale = man.LegOf(small) / man.LegOf(bones);

		expect(clip.Stride * 1.5).toBeCloseTo(normal.Stride * 1.78 * scale, 6);
		expect(clip.Length).toBeCloseTo(normal.Length * Math.sqrt(scale), 6);
		expect(function () {
			man.Gait(bones, 'no-such-gait');
		}).toThrow('no graph of the gait');
	});
});
