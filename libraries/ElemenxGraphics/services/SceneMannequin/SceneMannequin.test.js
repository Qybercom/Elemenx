import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: SceneMannequin, a person made of code: its skeleton of Mixamo, its skin, its weights and its clips', function () {
	var mannequin;
	var models;
	var asset;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneModels', 'service:SceneMannequin']);

		mannequin = Elemenx.Service('SceneMannequin');
		models = Elemenx.Service('SceneModels');
		asset = mannequin.Asset({Detail: 0.014});
	});

	it('has the bones Mixamo names, the fingers, the eyes and the jaw among them, each of a parent before it', function () {
		var bones = mannequin.Skeleton({});
		var names = bones.map(function (bone) {
			return bone.Name;
		});

		['Hips', 'Spine2', 'Neck', 'Head', 'Jaw', 'LeftEye', 'RightEye', 'LeftArm', 'RightForeArm', 'LeftHandThumb3', 'RightHandPinky4', 'LeftUpLeg', 'RightToeBase'].forEach(function (name) {
			expect(names).toContain('mixamorig:' + name);
		});
		expect(bones.every(function (bone, index) {
			return bone.Parent < index;
		})).toBe(true);
		expect(bones[mannequin.Find(bones, 'HeadTop_End')].At[1]).toBeCloseTo(1.78, 1);
	});

	it('takes its proportions of options: taller, shorter legs, its numbers kept within their bounds', function () {
		var tall = mannequin.Skeleton({Height: 2});
		var legs = mannequin.Skeleton({Legs: 0.9});
		var normal = mannequin.Skeleton({});
		var knee = mannequin.Find(normal, 'LeftLeg');

		expect(tall[mannequin.Find(tall, 'HeadTop_End')].At[1]).toBeCloseTo(2, 1);
		expect(legs[knee].At[1]).toBeLessThan(normal[knee].At[1]);
		expect(mannequin.Options({Build: 7, Height: 'x'})).toMatchObject({Build: 1, Height: 1.78});
	});

	/* Its skin is closed (each edge of two triangles, nearly all), faces out, stands on the ground, and each corner is skinned whole. */
	it('makes a skin closed and facing out, standing on the ground, of weights that add to one', function () {
		var geometry = asset.Meshes[0][0].Geometry;
		var p = geometry.Positions;
		var edges = {};
		var open = 0;
		var out = 0;
		var low = Infinity;
		var high = -Infinity;
		var i;
		var k;

		for (i = 1; i < p.length; i += 3) {
			low = Math.min(low, p[i]);
			high = Math.max(high, p[i]);
		}

		for (i = 0; i < geometry.Indices.length; i += 3) {
			var a = geometry.Indices[i] * 3;
			var b = geometry.Indices[i + 1] * 3;
			var c = geometry.Indices[i + 2] * 3;
			var u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]];
			var v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
			var n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
			if (n[0] * geometry.Normals[a] + n[1] * geometry.Normals[a + 1] + n[2] * geometry.Normals[a + 2] > 0)
				out++;

			for (k = 0; k < 3; k++) {
				var x = geometry.Indices[i + k];
				var y = geometry.Indices[i + (k + 1) % 3];
				var key = Math.min(x, y) + ':' + Math.max(x, y);

				edges[key] = (edges[key] || 0) + 1;
			}
		}

		Object.keys(edges).forEach(function (key) {
			if (edges[key] === 1)
				open++;
		});

		expect(geometry.Indices.length / 3).toBeGreaterThan(5000);
		expect(open / Object.keys(edges).length).toBeLessThan(0.01);
		expect(out / (geometry.Indices.length / 3)).toBeGreaterThan(0.99);
		expect(low).toBeGreaterThan(-0.01);
		expect(low).toBeLessThan(0.02);
		expect(high).toBeCloseTo(1.78, 1);

		for (i = 0; i < geometry.Weights.length; i += 4)
			expect(geometry.Weights[i] + geometry.Weights[i + 1] + geometry.Weights[i + 2] + geometry.Weights[i + 3]).toBeCloseTo(1, 3);
	});

	/* The hand is of its own bones: a corner at a fingertip follows the finger, one at the wrist does not. */
	it('skins a fingertip to its finger and the eyes to the bones of the eyes', function () {
		var bones = mannequin.Skeleton({Detail: 0.014});
		var geometry = asset.Meshes[0][0].Geometry;
		var tip = bones[mannequin.Find(bones, 'LeftHandIndex4')].At;
		var best = -1;
		var nearest = Infinity;
		var finger = mannequin.Find(bones, 'LeftHandIndex3');
		var eyes = asset.Meshes[1][0].Geometry;
		var i;

		for (i = 0; i < geometry.Positions.length; i += 3) {
			var d = Math.hypot(geometry.Positions[i] - tip[0], geometry.Positions[i + 1] - tip[1], geometry.Positions[i + 2] - tip[2]);

			if (d < nearest) {
				nearest = d;
				best = i / 3;
			}
		}

		expect(geometry.Joints[best * 4]).toBe(finger);
		expect([eyes.Joints[0], eyes.Joints[eyes.Joints.length - 4]]).toEqual([mannequin.Find(bones, 'LeftEye'), mannequin.Find(bones, 'RightEye')]);
	});

	it('has its clips, the gaits of them strides, and turns a pose of degrees into the turns of the bones', function () {
		var names = asset.Animations.map(function (clip) {
			return clip.Name;
		});
		var bones = mannequin.Skeleton({});
		var pose = mannequin.Pose(bones, {LLeg: [90, 0, 0], LFingers: 60});
		var knee = pose.Turns[mannequin.Find(bones, 'LeftLeg')];

		['idle', 'walk', 'jog', 'sprint', 'strafe-left', 'crouch-walk', 'lie-front', 'crawl', 'aim-bow', 'sit', 'drive', 'jump', 'pull-up', 'swim-crawl'].forEach(function (name) {
			expect(names).toContain(name);
		});
		expect(asset.Motions.walk.Stride).toBeGreaterThan(1);
		expect(knee[0]).toBeCloseTo(Math.sin(Math.PI / 4), 5);
		expect(pose.Turns[mannequin.Find(bones, 'LeftHandMiddle2')][2]).not.toBe(0);
		expect(pose.Turns[mannequin.Find(bones, 'RightHandMiddle2')]).toEqual([0, 0, 0, 1]);
	});

	/* A model of SceneModels made of code as a file is: loaded, skinned, its clips played (the hips of a walk move). */
	it('is a model of SceneModels, loaded as a file is, and others of options are defined of it', function () {
		var name = mannequin.Define('mannequin-test', {Detail: 0.016, Height: 1.6});
		var made;
		var failed;

		models.Load(name, function (error, model) {
			failed = error;
			made = model;
		});

		expect(failed).toBe(null);
		expect(models.Has('mannequin')).toBe(true);
		expect(made.Joints).toBe(mannequin.Skeleton({}).length);
		expect(Object.keys(made.Clips)).toContain('walk');
		expect(Object.keys(made.Clips)).toContain('run');
		expect(models.Length(made, 'walk')).toBeCloseTo(1.1, 3);
		expect(made.Size).toBe(1.6);
	});

	/* Regression: a list of the models made one by one (Make with no Load) got null for the mannequin, not yet generated. */
	it('is made by Make at once, with no Load before, as the models of code are', function () {
		var name = mannequin.Define('mannequin-made', {Detail: 0.02});
		var model = models.Make(name);

		expect(model).not.toBe(null);
		expect(model.Pieces.length).toBeGreaterThan(0);
		expect(models.Make(name)).toBe(model);
	});
});
