/*
 * SceneMannequin: a person made wholly of code, as detailed as a model of a file, and the base a generator of characters
 * builds on: its proportions are numbers, its skin a surface of them, its skeleton the bones Mixamo names, its clips made of
 * poses. It gives an asset as Gltf reads one, so a Scene draws it, skins it and plays its clips as any model of a file.
 * - Options(options): the person: Height (metres, 1.78), Build (0 slim to 1 heavy, 0.5), Muscle (0 to 1, 0.5), Sex (0 a
 *   man to 1 a woman, 0), Head, Legs, Shoulders, Hips (scales round 1), Detail (the size of the cells of its skin, metres,
 *   0.006: finer is more triangles), Color (of its skin, '#c9b9a6'), Eyes (the color of the irises, '#4a5a6a').
 * - Skeleton(options): its bones in their rest (standing as a T): [{Name (mixamorig:...), Parent (index, -1), At [x, y, z]
 *   (in the world, metres, facing +Z, its left side +X)}].
 * - Shapes(options, bones): what its body is made of: [{Kind (cone: a round cone From To, R1 R2; ball: At, R; ellipsoid: At,
 *   Radii; box: At, Half, Round), Bone (its index), Blend (how softly it melts into the rest), Cut (true: taken away)}].
 * - Distance(shapes, point): how far a point is out of the body (under 0 in it), and Near(shapes, point): the shapes near it
 *   with their own distances, for the weights of the skin.
 * - Asset(options): {Nodes, Meshes, Materials, Images, Skins, Animations, Motions, Scene}: the person as Gltf gives one, its
 *   skin a mesh of the surface of its shapes (surface nets over a grid fine only near it), its eyes balls of their own, each
 *   corner skinned to the 4 bones nearest by the shapes it is of; Clips(bones) its clips.
 * - Clips(bones, options): the clips of a person ([{Name, Length, Channels}]): its gaits (Gaits: idle, walk, jog, sprint,
 *   walk-back, run-back, strafe-left, strafe-right, strafe-left-run, strafe-right-run, crouch, crouch-walk, jump,
 *   jump-forward, stairs-up, stairs-down: the walk with the feet lifted higher, its steps fitted to the stairs by the feet
 *   of a Scene) and its poses (Poses: t-pose, attention, lie-front, lie-back, lie-left, lie-right, crawl, aim-hip,
 *   aim-shoulder, aim-bow, sit, drive, hang, pull-up, swim-breaststroke, swim-crawl, swim-back), each of its graph (a pose:
 *   Pose 1, every bone of its keys). Pose(bones, pose) the turns of the bones of a pose. Actions: clips of graphs of actions
 *   (float, fall, land, hit, stagger, die, reload, punch, attack, sword-slash, sword-thrust, block, interact, pick-up,
 *   vault, cast, enter-car, climb-step, climb-ladder, canopy-in), not of Clips: SceneModels lays them on a skeleton when
 *   first played; a graph's Loop 0 plays once, Hold 1 keeps its last pose, Upper 1 is of the arms (played on the legs
 *   that go, a layer of a Scene).
 * - Gait(bones, graph, options): a clip of a graph of a gait (blueprints/animation/<name> of the library by its name, an
 *   Application's of that name in its place, or a graph given): its legs of the path of the feet (GaitPose: a foot on the
 *   ground is a point of it, so it never slides; two bones reach the ankle), the rest of the body of the keys of the graph,
 *   its stride what the feet travel, fitted to the legs of the person (LegOf). Its numbers and keys were set beside clips
 *   of Mixamo (their files are not in the library): within degrees of them. Source(graph, options): a clip of a graph as
 *   Fbx.Parse reads a file (Bones, Length, Curves; Stride, Leg), what SceneModels.Retarget lays on another skeleton.
 * - Define(name, options): a model of SceneModels of that name, made when it is first asked for (Load), as a file is.
 * SceneModels has the model mannequin of it (Options of none). The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneMannequin', {
	$Meta: {
		Description: 'A person made wholly of code, as detailed as a model of a file: its skin, its skeleton of Mixamo and its clips.',
		Methods: ['Options(options)', 'Skeleton(options)', 'Shapes(options, bones)', 'Distance(shapes, point)', 'Near(shapes, point)', 'Asset(options)', 'Clips(bones, options)', 'Gait(bones, graph, options)', 'Source(graph, options)', 'Pose(bones, pose)', 'Define(name, options)']
	},

	Options: function (options) {
		var given = options || {};

		function number (key, fallback, low, high) {
			var value = given[key] === undefined || given[key] === null || given[key] === '' || isNaN(Number(given[key])) ? fallback : Number(given[key]);

			return Math.max(low, Math.min(high, value));
		}

		return {
			Height: number('Height', 1.78, 0.5, 2.6),
			Build: number('Build', 0.5, 0, 1),
			Muscle: number('Muscle', 0.5, 0, 1),
			Sex: number('Sex', 0, 0, 1),
			Head: number('Head', 1, 0.8, 1.25),
			Legs: number('Legs', 1, 0.85, 1.15),
			Shoulders: number('Shoulders', 1, 0.8, 1.2),
			Hips: number('Hips', 1, 0.8, 1.25),
			Detail: number('Detail', 0.008, 0.003, 0.03),
			Color: given.Color || '#c9b9a6',
			Eyes: given.Eyes || '#4a5a6a'
		};
	},

	/* The names of its bones, as Mixamo names them. */
	Prefix: 'mixamorig:',

	Skeleton: function (options) {
		var o = this.Options(options);
		var h = o.Height;
		var legs = o.Legs;
		var shoulder = (0.105 - o.Sex * 0.01) * o.Shoulders;
		var hip = (0.05 + o.Sex * 0.008) * o.Hips;
		var bones = [];
		var prefix = this.Prefix;

		function add (name, parent, at) {
			bones.push({Name: prefix + name, Parent: parent, At: [at[0] * h, at[1] * h, at[2] * h]});

			return bones.length - 1;
		}

		/*
		 * The joints of the legs where a person has them: the hip at 0.53 of the height, the knee at 0.285, the ankle at
		 * 0.046 (the thigh as long as the shank); the hips a little over the hip joints. The chest, the neck and the head stand
		 * of base, where they were before the hips came up (regression: the hip joint at 0.5, a thigh shorter than the shank,
		 * a run of bent knees).
		 */
		var base = 0.5 * legs + 0.03;
		var top = 0.53 * legs + 0.035;
		var hips = add('Hips', -1, [0, top, 0]);
		var spine = add('Spine', hips, [0, top + 0.05, 0.004]);
		var spine1 = add('Spine1', spine, [0, base + 0.14, 0.006]);
		var spine2 = add('Spine2', spine1, [0, base + 0.2, 0.004]);
		var neck = add('Neck', spine2, [0, base + 0.3, -0.004]);
		var head = add('Head', neck, [0, base + 0.345, 0.004]);

		add('HeadTop_End', head, [0, base + 0.345 + 0.125 * o.Head, 0.004]);
		add('LeftEye', head, [0.0185 * o.Head, base + 0.403 + (o.Head - 1) * 0.06, 0.042 * o.Head]);
		add('RightEye', head, [-0.0185 * o.Head, base + 0.403 + (o.Head - 1) * 0.06, 0.042 * o.Head]);
		add('Jaw', head, [0, base + 0.37, 0.012]);

		[['Left', 1], ['Right', -1]].forEach(function (side) {
			var s = side[1];
			var name = side[0];
			var clavicle = add(name + 'Shoulder', spine2, [s * 0.022, base + 0.282, 0.002]);
			var arm = add(name + 'Arm', clavicle, [s * shoulder, base + 0.287, -0.004]);
			var fore = add(name + 'ForeArm', arm, [s * (shoulder + 0.172), base + 0.287, -0.006]);
			var wrist = shoulder + 0.172 + 0.146;
			var hand = add(name + 'Hand', fore, [s * wrist, base + 0.287, -0.004]);

			/* The fingers: three bones and an end each, from the knuckles of the palm; the thumb from its root at the wrist. */
			[['Thumb', 0.012, 0.018, [0.022, 0.016, 0.012], -0.006], ['Index', 0.054, 0.0135, [0.024, 0.015, 0.011], 0], ['Middle', 0.056, 0.0035, [0.027, 0.017, 0.012], 0.001], ['Ring', 0.054, -0.0065, [0.025, 0.016, 0.011], 0], ['Pinky', 0.049, -0.0155, [0.019, 0.012, 0.01], -0.001]].forEach(function (finger) {
				var x = wrist + finger[1];
				var z = finger[2];
				var parent = hand;
				var thumb = finger[0] === 'Thumb';
				var y = base + 0.287 + finger[4];
				var k;

				for (k = 0; k < 4; k++) {
					var at = [s * x, y, z];

					parent = add(name + 'Hand' + finger[0] + (k + 1), parent, at);

					/* The thumb goes forward and out, the others along the arm. */
					if (thumb) {
						x += (finger[3][k] || 0.008) * 0.72;
						z += (finger[3][k] || 0.008) * 0.62;
						y -= (finger[3][k] || 0.008) * 0.15;
					}
					else {
						x += finger[3][k] || 0.009;
					}
				}
			});

			var thigh = add(name + 'UpLeg', hips, [s * hip, top - 0.035, 0.002]);
			var knee = add(name + 'Leg', thigh, [s * (hip - 0.004), 0.285 * legs + 0.0, 0.006]);
			var ankle = add(name + 'Foot', knee, [s * (hip - 0.008), 0.046, -0.006]);
			var toe = add(name + 'ToeBase', ankle, [s * (hip - 0.006), 0.014, 0.074]);

			add(name + 'Toe_End', toe, [s * (hip - 0.004), 0.012, 0.108]);

			return thigh;
		});

		return bones;
	},

	/* The index of a bone by its name without the prefix. */
	Find: function (bones, name) {
		var whole = this.Prefix + name;
		var i;

		for (i = 0; i < bones.length; i++) {
			if (bones[i].Name === whole) return i;
		}

		return -1;
	},

	Shapes: function (options, bones) {
		var o = this.Options(options);
		var h = o.Height;
		var self = this;
		var shapes = [];
		var fat = 0.85 + o.Build * 0.35;
		var muscle = 0.9 + o.Muscle * 0.2;
		var woman = o.Sex;

		function at (name) {
			return bones[self.Find(bones, name)].At;
		}

		function bone (name) {
			return self.Find(bones, name);
		}

		function mix (a, b, t) {
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
		}

		function off (p, x, y, z) {
			return [p[0] + x * h, p[1] + y * h, p[2] + z * h];
		}

		function cone (from, to, r1, r2, name, blend) {
			shapes.push({Kind: 'cone', From: from, To: to, R1: r1 * h, R2: r2 * h, Bone: bone(name), Blend: (blend || 0.012) * h});
		}

		function ball (center, r, name, blend) {
			shapes.push({Kind: 'ball', At: center, R: r * h, Bone: bone(name), Blend: (blend || 0.012) * h});
		}

		function ellipsoid (center, radii, name, blend) {
			shapes.push({Kind: 'ellipsoid', At: center, Radii: [radii[0] * h, radii[1] * h, radii[2] * h], Bone: bone(name), Blend: (blend || 0.014) * h});
		}

		function box (center, half, round, name, blend) {
			shapes.push({Kind: 'box', At: center, Half: [half[0] * h, half[1] * h, half[2] * h], Round: round * h, Bone: bone(name), Blend: (blend || 0.006) * h});
		}

		var hips = at('Hips');
		var spine = at('Spine');
		var spine1 = at('Spine1');
		var spine2 = at('Spine2');
		var neck = at('Neck');
		var head = at('Head');

		/* The trunk: the pelvis and the seat, the belly, the ribs and the chest, the breast, the back of the shoulders. */
		ellipsoid(off(hips, 0, -0.008, -0.004), [0.078 * fat * o.Hips + woman * 0.01, 0.062, 0.06 * fat], 'Hips', 0.03);
		[1, -1].forEach(function (s) {
			ellipsoid(off(hips, s * 0.038 * o.Hips, -0.04, -0.034), [0.044 * fat, 0.052, 0.042 * fat + woman * 0.006], 'Hips', 0.03);
		});
		ellipsoid(off(spine, 0, 0.01, 0.004 + (o.Build - 0.5) * 0.02), [0.072 * fat - woman * 0.01, 0.09, 0.056 * fat + (o.Build - 0.5) * 0.02], 'Spine', 0.045);
		ellipsoid(off(spine1, 0, 0.01, 0.002), [0.082 * fat - woman * 0.01, 0.09, 0.062 * fat], 'Spine1', 0.045);
		ellipsoid(off(spine2, 0, 0.022, 0.0), [0.096 * o.Shoulders * muscle - woman * 0.01, 0.08, 0.066 * fat], 'Spine2', 0.04);
		[1, -1].forEach(function (s) {
			/* The muscles of the chest, flat; a woman's breast over them. */
			ellipsoid(off(spine2, s * 0.05, 0.05, 0.044), [0.05, 0.03, 0.011 + o.Muscle * 0.008], 'Spine2', 0.03);

			if (woman > 0)
				ball(off(spine2, s * 0.047, 0.012, 0.052), 0.012 + woman * 0.026, 'Spine2', 0.02);

			cone(off(neck, 0, -0.006, -0.012), off(spine2, s * 0.095 * o.Shoulders, 0.075, -0.012), 0.034 * muscle, 0.028 * muscle, 'Spine2', 0.02);

			ellipsoid(off(spine2, s * 0.05, 0.03, -0.045), [0.05, 0.075, 0.03], 'Spine2', 0.02);
		});

		/* The neck and the head: the skull, the jaw and the chin, the brow, the cheekbones, the nose, the lips and the ears. */
		cone(off(neck, 0, -0.02, 0), off(head, 0, 0.012, 0.006), 0.031 * muscle, 0.029, 'Neck', 0.016);

		var hs = o.Head;
		var face = off(head, 0, 0.058 * hs, 0);

		ellipsoid(off(face, 0, 0.016 * hs, -0.008 * hs), [0.047 * hs, 0.059 * hs, 0.058 * hs], 'Head', 0.01);
		ellipsoid(off(face, 0, -0.032 * hs, 0.016 * hs), [0.04 * hs - woman * 0.004, 0.036 * hs, 0.042 * hs], 'Jaw', 0.012);

		ball(off(face, 0, -0.054 * hs, 0.038 * hs), 0.016 * hs, 'Jaw', 0.012);

		cone(off(face, 0.022 * hs, 0.012 * hs, 0.048 * hs), off(face, -0.022 * hs, 0.012 * hs, 0.048 * hs), 0.0072 * hs, 0.0072 * hs, 'Head', 0.014);
		[1, -1].forEach(function (s) {
			ball(off(face, s * 0.031 * hs, -0.008 * hs, 0.031 * hs), 0.012 * hs, 'Head', 0.016);

			ellipsoid(off(face, s * 0.049 * hs, -0.002 * hs, -0.002 * hs), [0.006 * hs, 0.018 * hs, 0.012 * hs], 'Head', 0.004);

			/* The sockets of the eyes: taken away under the brow. */
			shapes.push({Kind: 'ball', At: at(s > 0 ? 'LeftEye' : 'RightEye'), R: 0.0088 * hs * h, Bone: bone('Head'), Blend: 0.003 * h, Cut: true});
		});
		cone(off(face, 0, 0.004 * hs, 0.05 * hs), off(face, 0, -0.014 * hs, 0.064 * hs), 0.0055 * hs, 0.0085 * hs, 'Head', 0.005);

		ellipsoid(off(face, 0, -0.032 * hs, 0.054 * hs), [0.015 * hs, 0.0048 * hs, 0.008 * hs], 'Jaw', 0.003);
		ellipsoid(off(face, 0, -0.039 * hs, 0.052 * hs), [0.014 * hs, 0.0052 * hs, 0.008 * hs], 'Jaw', 0.003);

		/* The arms and the hands. */
		[['Left', 1], ['Right', -1]].forEach(function (side) {
			var n = side[0];
			var s = side[1];
			var arm = at(n + 'Arm');
			var fore = at(n + 'ForeArm');
			var wrist = at(n + 'Hand');

			ball(off(arm, s * 0.006, 0.004, 0), 0.036 * muscle, n + 'Arm', 0.02);

			cone(arm, fore, 0.032 * muscle * fat, 0.024, n + 'Arm', 0.016);

			ellipsoid(off(mix(arm, fore, 0.5), 0, 0.006, 0.012), [0.05, 0.02 * muscle, 0.018 * muscle], n + 'Arm', 0.012);
			ellipsoid(off(mix(arm, fore, 0.45), 0, -0.004, -0.014), [0.055, 0.021 * muscle, 0.018 * muscle], n + 'Arm', 0.012);

			ball(fore, 0.023, n + 'ForeArm', 0.014);

			cone(fore, wrist, 0.026 * muscle, 0.017, n + 'ForeArm', 0.014);

			ellipsoid(off(mix(fore, wrist, 0.25), 0, 0.006, 0), [0.05, 0.022 * muscle, 0.02], n + 'ForeArm', 0.012);

			/* The palm: from the wrist to the knuckles, flat, the heel of the thumb; a hand is made finer, its shapes marked. */
			var first = shapes.length;

			box(off(wrist, s * 0.03, 0.001, -0.001), [0.03, 0.0085, 0.0215], 0.0075, n + 'Hand', 0.006);

			ellipsoid(off(wrist, s * 0.02, -0.004, 0.014), [0.022, 0.011, 0.014], n + 'Hand', 0.006);

			['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].forEach(function (finger) {
				var thick = {Thumb: 0.0076, Index: 0.0052, Middle: 0.0054, Ring: 0.005, Pinky: 0.0044}[finger];
				var k;

				for (k = 1; k <= 3; k++) {
					var a = at(n + 'Hand' + finger + k);
					var b = at(n + 'Hand' + finger + (k + 1));

					cone(a, b, thick * (1 - (k - 1) * 0.1), thick * (0.92 - (k - 1) * 0.1), n + 'Hand' + finger + k, 0.0018);
				}
			});

			shapes.slice(first).forEach(function (shape) {
				shape.Hand = n;
			});

			/* Where a hand comes out of its arm: a piece of the arm, thinner than it, so the hand meets it under its skin. */
			shapes.push({Kind: 'cone', From: off(wrist, -s * 0.03, 0, 0), To: wrist, R1: 0.015 * h, R2: 0.0145 * h, Bone: bone(n + 'ForeArm'), Blend: 0.004 * h, Hand: n, Stub: true});

			/* The legs and the feet. */
			var thigh = at(n + 'UpLeg');
			var knee = at(n + 'Leg');
			var ankle = at(n + 'Foot');
			var toe = at(n + 'ToeBase');
			var end = at(n + 'Toe_End');

			cone(off(thigh, s * 0.004, 0.0, 0), knee, 0.054 * fat + woman * 0.008, 0.036, n + 'UpLeg', 0.03);

			ellipsoid(off(mix(thigh, knee, 0.42), 0, 0, 0.022), [0.04 * muscle, 0.1, 0.03 * muscle], n + 'UpLeg', 0.018);

			ball(off(knee, 0, 0.004, 0.006), 0.031, n + 'Leg', 0.016);

			cone(knee, ankle, 0.034 * muscle, 0.018, n + 'Leg', 0.016);

			ellipsoid(off(mix(knee, ankle, 0.27), 0, 0, -0.02), [0.03 * muscle, 0.07, 0.03 * muscle], n + 'Leg', 0.016);

			ball(ankle, 0.021, n + 'Foot', 0.01);

			/* The foot: the heel, its arch to the ball, the toes. */
			box(off(mix(ankle, toe, 0.42), 0, -0.0135, -0.006), [0.025, 0.017, 0.05], 0.014, n + 'Foot', 0.012);

			ball(off(ankle, 0, -0.024, -0.028), 0.022, n + 'Foot', 0.01);
			[[-0.017, 0.0072], [-0.006, 0.0064], [0.004, 0.006], [0.013, 0.0056], [0.021, 0.0052]].forEach(function (one, index) {
				var root = off(toe, s * one[0] * (index === 0 ? 1 : 1), -0.004, 0);
				var tip = off(end, s * one[0], -0.004, -(index * 0.006));

				cone(root, tip, one[1] * 1.3, one[1] * 1.15, n + 'ToeBase', 0.006);
			});
		});

		/* The hips meet the thighs softly: their tops. */
		return shapes;
	},

	/* Distance of a point to a shape, under 0 inside it. */
	ShapeDistance: function (shape, p) {
		var a;
		var b;
		var ba;
		var pa;
		var l2;
		var t;
		var d;

		if (shape.Kind === 'ball')
			return Math.hypot(p[0] - shape.At[0], p[1] - shape.At[1], p[2] - shape.At[2]) - shape.R;

		if (shape.Kind === 'ellipsoid') {
			var q = [(p[0] - shape.At[0]) / shape.Radii[0], (p[1] - shape.At[1]) / shape.Radii[1], (p[2] - shape.At[2]) / shape.Radii[2]];
			var k0 = Math.hypot(q[0], q[1], q[2]);
			var k1 = Math.hypot(q[0] / shape.Radii[0], q[1] / shape.Radii[1], q[2] / shape.Radii[2]);

			return k1 > 1e-12 ? k0 * (k0 - 1) / k1 : -Math.min(shape.Radii[0], shape.Radii[1], shape.Radii[2]);
		}

		if (shape.Kind === 'box') {
			var dx = Math.abs(p[0] - shape.At[0]) - shape.Half[0] + shape.Round;
			var dy = Math.abs(p[1] - shape.At[1]) - shape.Half[1] + shape.Round;
			var dz = Math.abs(p[2] - shape.At[2]) - shape.Half[2] + shape.Round;

			return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dy, dz), 0) - shape.Round;
		}

		/* A round cone: the segment From To, its radius going from R1 to R2. */
		a = shape.From;
		b = shape.To;
		ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
		pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
		l2 = ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2] || 1e-12;
		t = Math.max(0, Math.min(1, (pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / l2));
		d = Math.hypot(pa[0] - ba[0] * t, pa[1] - ba[1] * t, pa[2] - ba[2] * t);

		return d - (shape.R1 + (shape.R2 - shape.R1) * t);
	},

	/* The bounds of a shape, grown by its blend: [x0, y0, z0, x1, y1, z1]. */
	ShapeBounds: function (shape) {
		var grow = shape.Blend * 2;
		var r;

		if (shape.Kind === 'cone') {
			r = Math.max(shape.R1, shape.R2) + grow;

			return [Math.min(shape.From[0], shape.To[0]) - r, Math.min(shape.From[1], shape.To[1]) - r, Math.min(shape.From[2], shape.To[2]) - r, Math.max(shape.From[0], shape.To[0]) + r, Math.max(shape.From[1], shape.To[1]) + r, Math.max(shape.From[2], shape.To[2]) + r];
		}

		r = shape.Kind === 'ball' ? [shape.R, shape.R, shape.R] : shape.Kind === 'ellipsoid' ? shape.Radii : shape.Half;

		return [shape.At[0] - r[0] - grow, shape.At[1] - r[1] - grow, shape.At[2] - r[2] - grow, shape.At[0] + r[0] + grow, shape.At[1] + r[1] + grow, shape.At[2] + r[2] + grow];
	},

	/* How far a point is out of the body: the shapes melted together (smooth union), the cut ones taken away. */
	Distance: function (shapes, p) {
		var d = 1e9;
		var i;

		for (i = 0; i < shapes.length; i++) {
			var shape = shapes[i];
			var b = shape.Bounds;
			var e;
			var k;
			var hh;

			if (b && (p[0] < b[0] || p[1] < b[1] || p[2] < b[2] || p[0] > b[3] || p[1] > b[4] || p[2] > b[5])) continue;

			e = this.ShapeDistance(shape, p);
			k = shape.Blend;

			if (shape.Cut) {
				/* Smooth subtraction. */
				hh = Math.max(0, Math.min(1, 0.5 - 0.5 * (d + e) / k));
				d = d * (1 - hh) + -e * hh + k * hh * (1 - hh);

				continue;
			}

			hh = Math.max(0, Math.min(1, 0.5 + 0.5 * (e - d) / k));
			d = e * (1 - hh) + d * hh - k * hh * (1 - hh);
		}

		return d;
	},

	Near: function (shapes, p) {
		var self = this;

		return shapes.filter(function (shape) {
			var b = shape.Bounds;

			return !shape.Cut && (!b || !(p[0] < b[0] || p[1] < b[1] || p[2] < b[2] || p[0] > b[3] || p[1] > b[4] || p[2] > b[5]));
		}).map(function (shape) {
			return {Shape: shape, Distance: self.ShapeDistance(shape, p)};
		});
	},

	/*
	 * The skin of the shapes: surface nets over a grid of cells of size Detail, made only where the surface passes (the coarse
	 * cells, 4 times larger, that it crosses or nears). {Positions, Normals, Indices}.
	 */
	Skin: function (shapes, detail) {
		var self = this;
		var fine = detail;
		var coarse = fine * 4;
		var low = [Infinity, Infinity, Infinity];
		var high = [-Infinity, -Infinity, -Infinity];
		var values = {};
		var cells = {};
		var positions = [];
		var normals = [];
		var indices = [];
		var crossing = [];
		var made = [];
		var x;
		var y;
		var z;

		shapes.forEach(function (shape) {
			var b = shape.Bounds = self.ShapeBounds(shape);

			low = [Math.min(low[0], b[0]), Math.min(low[1], b[1]), Math.min(low[2], b[2])];
			high = [Math.max(high[0], b[3]), Math.max(high[1], b[4]), Math.max(high[2], b[5])];
		});

		var n = [Math.ceil((high[0] - low[0]) / coarse) + 1, Math.ceil((high[1] - low[1]) / coarse) + 1, Math.ceil((high[2] - low[2]) / coarse) + 1];
		var steps = Math.round(coarse / fine);
		var nf = [n[0] * steps + 1, n[1] * steps + 1, n[2] * steps + 1];

		function value (i, j, k) {
			var key = i + nf[0] * (j + nf[1] * k);
			if (values[key] === undefined)
				values[key] = self.Distance(shapes, [low[0] + i * fine, low[1] + j * fine, low[2] + k * fine]);

			return values[key];
		}

		/* The coarse cells the surface passes near: their middle within a diagonal of it. */
		for (z = 0; z < n[2]; z++) {
			for (y = 0; y < n[1]; y++) {
				for (x = 0; x < n[0]; x++) {
					var middle = self.Distance(shapes, [low[0] + (x + 0.5) * coarse, low[1] + (y + 0.5) * coarse, low[2] + (z + 0.5) * coarse]);
					if (Math.abs(middle) < coarse * 1.6)
						crossing.push([x, y, z]);
				}
			}
		}

		/* A fine cell the surface crosses has a corner of the skin: the mean of where it crosses the edges of the cell. */
		var edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

		function cell (i, j, k) {
			var key = i + nf[0] * (j + nf[1] * k);
			var corners;
			var inside = 0;
			var sum = [0, 0, 0];
			var count = 0;

			if (cells[key] !== undefined) return cells[key];

			if (i < 0 || j < 0 || k < 0 || i >= nf[0] - 1 || j >= nf[1] - 1 || k >= nf[2] - 1) {
				cells[key] = -1;

				return -1;
			}

			corners = [value(i, j, k), value(i + 1, j, k), value(i, j + 1, k), value(i + 1, j + 1, k), value(i, j, k + 1), value(i + 1, j, k + 1), value(i, j + 1, k + 1), value(i + 1, j + 1, k + 1)];

			corners.forEach(function (v) {
				if (v < 0)
					inside++;
			});

			if (!inside || inside === 8) {
				cells[key] = -1;

				return -1;
			}

			edges.forEach(function (edge) {
				var a = corners[edge[0]];
				var b = corners[edge[1]];
				if (a < 0 === b < 0) return;

				var t = a / (a - b);

				sum[0] += (edge[0] & 1) + ((edge[1] & 1) - (edge[0] & 1)) * t;
				sum[1] += (edge[0] >> 1 & 1) + ((edge[1] >> 1 & 1) - (edge[0] >> 1 & 1)) * t;
				sum[2] += (edge[0] >> 2 & 1) + ((edge[1] >> 2 & 1) - (edge[0] >> 2 & 1)) * t;
				count++;
			});

			cells[key] = positions.length / 3;

			made.push([i, j, k]);
			positions.push(low[0] + (i + sum[0] / count) * fine, low[1] + (j + sum[1] / count) * fine, low[2] + (k + sum[2] / count) * fine);

			return cells[key];
		}

		/*
		 * A quad for each edge of the grid the surface crosses: the edge from the lowest corner P of a cell along an axis a is
		 * shared by the cells P, P - b, P - b - c, P - c (b, c the other two axes in turn); that order goes round a, so the
		 * quad faces +a, turned when the inside is at the far end.
		 */
		crossing.forEach(function (c) {
			var i;
			var j;
			var k;

			for (k = c[2] * steps; k < (c[2] + 1) * steps; k++) {
				for (j = c[1] * steps; j < (c[1] + 1) * steps; j++) {
					for (i = c[0] * steps; i < (c[0] + 1) * steps; i++)
						cell(i, j, k);
				}
			}
		});

		/* Each cell of a corner, those its quads made too (the surface past the coarse cells found), until none is left. */
		var done;

		for (done = 0; done < made.length; done++) {
			var p = made[done];

			[0, 1, 2].forEach(function (a) {
				var b = (a + 1) % 3;
				var d = (a + 2) % 3;
				var far = p.slice();
				var near = value(p[0], p[1], p[2]);
				var quad;

				far[a]++;

				if (near < 0 === value(far[0], far[1], far[2]) < 0) return;

				quad = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (step) {
					var q = p.slice();

					q[b] -= step[0];
					q[d] -= step[1];

					return cell(q[0], q[1], q[2]);
				});

				if (quad.indexOf(-1) >= 0) return;

				if (near < 0) indices.push(quad[0], quad[1], quad[2], quad[0], quad[2], quad[3]);
				else indices.push(quad[0], quad[2], quad[1], quad[0], quad[3], quad[2]);
			});
		}

		/* Normals of the field: the way it grows. */
		var e = fine * 0.5;
		var p;

		for (p = 0; p < positions.length; p += 3) {
			var px = positions[p];
			var py = positions[p + 1];
			var pz = positions[p + 2];
			var g = [self.Distance(shapes, [px + e, py, pz]) - self.Distance(shapes, [px - e, py, pz]), self.Distance(shapes, [px, py + e, pz]) - self.Distance(shapes, [px, py - e, pz]), self.Distance(shapes, [px, py, pz + e]) - self.Distance(shapes, [px, py, pz - e])];
			var l = Math.hypot(g[0], g[1], g[2]) || 1;

			normals.push(g[0] / l, g[1] / l, g[2] / l);
		}

		return {Positions: positions, Normals: normals, Indices: indices};
	},

	/*
	 * The skin of the whole: the body of its Detail, each hand of cells of 3 mm at most (its fingers round) as a closed skin of
	 * its own over a palm of the body a little smaller, under it; their weights each of their own shapes.
	 */
	Body: function (shapes, o) {
		var self = this;
		var body = shapes.filter(function (shape) {
			return !shape.Hand || shape.Kind === 'box';
		}).map(function (shape) {
			var less = 0.0015 * o.Height;

			if (!shape.Hand) return shape;

			return Object.assign({}, shape, {Half: [shape.Half[0] - less, shape.Half[1] - less, shape.Half[2] - less], Round: Math.max(0, shape.Round - less)});
		});
		var parts = [body].concat(['Left', 'Right'].map(function (side) {
			return shapes.filter(function (shape) {
				return shape.Hand === side;
			});
		}));
		var made = {Positions: [], Normals: [], Indices: [], Joints: [], Weights: []};

		parts.forEach(function (list, index) {
			var skin = self.Skin(list, index ? Math.min(o.Detail, 0.003) : o.Detail);
			var weighted = self.Weights(list, skin.Positions, o.Height);
			var base = made.Positions.length / 3;

			function add (into, from, shift) {
				var i;

				for (i = 0; i < from.length; i++)
					into.push(from[i] + shift);
			}

			add(made.Positions, skin.Positions, 0);
			add(made.Normals, skin.Normals, 0);
			add(made.Joints, weighted.Joints, 0);
			add(made.Weights, weighted.Weights, 0);
			add(made.Indices, skin.Indices, base);
		});

		return {Positions: made.Positions, Normals: made.Normals, Indices: made.Indices, Weighted: {Joints: made.Joints, Weights: made.Weights}};
	},

	/* The weights of each corner: the 4 bones whose shapes it is nearest, by how near (Joints, Weights: 4 a corner). */
	Weights: function (shapes, positions, scale) {
		var joints = [];
		var weights = [];
		var i;

		for (i = 0; i < positions.length; i += 3) {
			var p = [positions[i], positions[i + 1], positions[i + 2]];
			var near = this.Near(shapes, p);
			var by = {};
			var list;
			var total = 0;

			near.forEach(function (one) {
				var w = Math.exp(-Math.max(0, one.Distance) / (one.Shape.Blend * 0.6 + scale * 0.002));

				by[one.Shape.Bone] = (by[one.Shape.Bone] || 0) + w;
			});

			list = Object.keys(by).map(function (bone) {
				return [Number(bone), by[bone]];
			}).sort(function (a, b) {
				return b[1] - a[1];
			}).slice(0, 4);

			if (!list.length)
				list = [[0, 1]];

			list.forEach(function (one) {
				total += one[1];
			});

			while (list.length < 4)
				list.push([0, 0]);

			list.forEach(function (one) {
				joints.push(one[0]);
				weights.push(total ? one[1] / total : 0);
			});
		}

		return {Joints: joints, Weights: weights};
	},

	/*
	 * A ball of its own (an eye): its positions round a middle, its triangles in three lists by where they look (+Z): the
	 * white of it, its iris and its pupil (Parts), each drawn of a material of its own.
	 */
	Ball: function (center, radius, rows) {
		var positions = [];
		var normals = [];
		var parts = [[], [], []];
		var r;
		var c;

		for (r = 0; r <= rows; r++) {
			var v = r / rows * Math.PI;

			for (c = 0; c <= rows * 2; c++) {
				var u = c / (rows * 2) * Math.PI * 2;
				var n = [Math.sin(v) * Math.sin(u), Math.cos(v), Math.sin(v) * Math.cos(u)];

				positions.push(center[0] + n[0] * radius, center[1] + n[1] * radius, center[2] + n[2] * radius);
				normals.push(n[0], n[1], n[2]);
			}
		}

		/* The rows go from the top down; turned so its pole looks forward, the iris is a cap of the ball round +Z. */
		function where (a, b, d) {
			var z = (normals[a * 3 + 2] + normals[b * 3 + 2] + normals[d * 3 + 2]) / 3;

			return z > 0.955 ? 2 : z > 0.82 ? 1 : 0;
		}

		for (r = 0; r < rows; r++) {
			for (c = 0; c < rows * 2; c++) {
				var a = r * (rows * 2 + 1) + c;
				var b = a + rows * 2 + 1;

				parts[where(a, b, a + 1)].push(a, b, a + 1);
				parts[where(a + 1, b, b + 1)].push(a + 1, b, b + 1);
			}
		}

		return {Positions: positions, Normals: normals, Parts: parts};
	},

	Asset: function (options) {
		var self = this;
		var o = this.Options(options);
		var bones = this.Skeleton(o);
		var shapes = this.Shapes(o, bones);
		var skin = this.Body(shapes, o);
		var weighted = skin.Weighted;
		var color = this.Color(o.Color);
		var iris = this.Color(o.Eyes);
		var nodes;
		var eyes;
		var skins;

		/* The nodes: each bone at its place in its parent (its rest standing as a T: no turn), then the skin and the eyes. */
		nodes = bones.map(function (bone) {
			var parent = bone.Parent === -1 ? [0, 0, 0] : bones[bone.Parent].At;

			return {Name: bone.Name, Parent: bone.Parent, Children: [], Translation: [bone.At[0] - parent[0], bone.At[1] - parent[1], bone.At[2] - parent[2]], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1};
		});

		nodes.forEach(function (node, index) {
			if (node.Parent !== -1)
				nodes[node.Parent].Children.push(index);
		});

		skins = [{Joints: bones.map(function (bone, index) {
			return index;
		}), Inverse: new Float32Array([].concat.apply([], bones.map(function (bone) {
			return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -bone.At[0], -bone.At[1], -bone.At[2], 1];
		})))}];

		nodes.push({Name: 'Body', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: 0});

		/* The eyes: balls on the bones of the eyes, wholly theirs. */
		eyes = ['LeftEye', 'RightEye'].map(function (name) {
			var index = self.Find(bones, name);
			var ball = self.Ball(bones[index].At, 0.0068 * o.Head * o.Height, 16);
			var count = ball.Positions.length / 3;
			var i;

			ball.Joints = [];
			ball.Weights = [];

			for (i = 0; i < count; i++) {
				ball.Joints.push(index, 0, 0, 0);
				ball.Weights.push(1, 0, 0, 0);
			}

			return ball;
		});

		nodes.push({Name: 'Eyes', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 1, Skin: 0});

		var clips = this.Clips(bones, o);
		var motions = {};

		clips.forEach(function (clip) {
			if (clip.Stride)
				motions[clip.Name] = {Animation: clip, Stride: clip.Stride};
		});

		return {
			Nodes: nodes,
			Meshes: [[{Geometry: {Positions: new Float32Array(skin.Positions), Normals: new Float32Array(skin.Normals), UVs: new Float32Array(skin.Positions.length / 3 * 2), Colors: null, Indices: skin.Positions.length / 3 > 65535 ? new Uint32Array(skin.Indices) : new Uint16Array(skin.Indices), Joints: new Float32Array(weighted.Joints), Weights: new Float32Array(weighted.Weights)}, Material: 0}], this.Joined(eyes).map(function (geometry, index) {
				return {Geometry: geometry, Material: 1 + index};
			})],
			Materials: [this.Material('Skin', color, 0.62), this.Material('Eyes', [0.92, 0.9, 0.88], 0.12), this.Material('Iris', iris, 0.1), this.Material('Pupil', [0.02, 0.02, 0.025], 0.05)],
			Images: [],
			Skins: skins,
			Animations: clips,
			Motions: motions,
			Lights: [],
			Scene: nodes.map(function (node, index) {
				return node.Parent === -1 ? index : -1;
			}).filter(function (index) {
				return index >= 0;
			})
		};
	},

	/* Balls as one: their corners shared, a geometry for each of their lists of triangles. */
	Joined: function (balls) {
		var made = {Positions: [], Normals: [], Joints: [], Weights: []};
		var lists = [[], [], []];

		balls.forEach(function (ball) {
			var base = made.Positions.length / 3;

			['Positions', 'Normals', 'Joints', 'Weights'].forEach(function (key) {
				made[key].push.apply(made[key], ball[key]);
			});

			ball.Parts.forEach(function (part, which) {
				part.forEach(function (index) {
					lists[which].push(base + index);
				});
			});
		});

		var shared = {Positions: new Float32Array(made.Positions), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.Positions.length / 3 * 2), Colors: null, Joints: new Float32Array(made.Joints), Weights: new Float32Array(made.Weights)};

		return lists.map(function (list) {
			return Object.assign({}, shared, {Indices: new Uint16Array(list)});
		});
	},

	Material: function (name, color, rough) {
		return {Name: name, BaseColor: [color[0], color[1], color[2], 1], Metallic: 0, Roughness: rough, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: false, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null};
	},

	Color: function (value) {
		var text = String(value || '').replace('#', '');

		if (Array.isArray(value))
			return value.slice(0, 3);

		return text.length === 6 ? [parseInt(text.slice(0, 2), 16) / 255, parseInt(text.slice(2, 4), 16) / 255, parseInt(text.slice(4, 6), 16) / 255] : [0.8, 0.75, 0.7];
	},

	/* SceneMannequin: poses and clips */

	/* A turn of degrees round x, then y, then z of the parent: a quaternion. */
	Turn: function (degrees) {
		var r = Math.PI / 360;
		var x = [Math.sin((degrees[0] || 0) * r), 0, 0, Math.cos((degrees[0] || 0) * r)];
		var y = [0, Math.sin((degrees[1] || 0) * r), 0, Math.cos((degrees[1] || 0) * r)];
		var z = [0, 0, Math.sin((degrees[2] || 0) * r), Math.cos((degrees[2] || 0) * r)];

		function times (a, b) {
			return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
		}

		/* The arm lowered first (z, its own), then swung (x) and turned (y). */
		return times(y, times(x, z));
	},

	/*
	 * The turns of the bones of a pose: {Bone: [x, y, z] degrees} by names without the prefix and the side (L, R for Left,
	 * Right: LArm), a hand of fingers (LFingers: how far they curl, degrees; LThumb), Root ([x, y, z] metres, the hips moved)
	 * and Body ([x, y, z] degrees, the whole turned at the hips). {Turns: [quaternion of each bone], Root}.
	 */
	Pose: function (bones, pose) {
		var self = this;
		var turns = bones.map(function () {
			return [0, 0, 0, 1];
		});

		Object.keys(pose).forEach(function (key) {
			var value = pose[key];
			var name = key.replace(/^L(?=[A-Z])/, 'Left').replace(/^R(?=[A-Z])/, 'Right');
			var index;

			if (key === 'Root') return;

			if (/^(Left|Right)(Fingers|Thumb)$/.test(name)) {
				var side = name.indexOf('Left') === 0 ? 'Left' : 'Right';
				var fingers = /Thumb$/.test(name) ? ['Thumb'] : ['Index', 'Middle', 'Ring', 'Pinky'];

				fingers.forEach(function (finger) {
					[1, 2, 3].forEach(function (k) {
						/* A finger curls down round the axis along the palm (z of a hand held out). */
						var at = self.Find(bones, side + 'Hand' + finger + k);
						if (at >= 0)
							turns[at] = self.Turn(finger === 'Thumb' ? [0, (side === 'Left' ? -1 : 1) * value * 0.6, 0] : [0, 0, (side === 'Left' ? -1 : 1) * value]);
					});
				});

				return;
			}

			index = self.Find(bones, name === 'Body' ? 'Hips' : name);

			if (index >= 0)
				turns[index] = self.Turn(value);
		});

		return {Turns: turns, Root: pose.Root || [0, 0, 0]};
	},

	/* A clip of poses at moments of it (a function of the part of it, 0 to 1): channels of rotation for each bone and the hips moved. */
	Clip: function (bones, name, length, count, poseAt, loop, stride, hold, upper) {
		var self = this;
		var rest = bones[0].At;
		var times = [];
		var rotations = bones.map(function () {
			return [];
		});
		var places = [];
		var i;

		for (i = 0; i <= count; i++) {
			var t = i / count;
			var made = this.Pose(bones, poseAt(loop ? t % 1 : t));

			times.push(t * length);

			made.Turns.forEach(function (turn, index) {
				rotations[index].push(turn[0], turn[1], turn[2], turn[3]);
			});

			places.push(rest[0] + made.Root[0], rest[1] + made.Root[1], rest[2] + made.Root[2]);
		}

		var channels = bones.map(function (bone, index) {
			return {Node: index, Path: 'rotation', Times: new Float32Array(times), Values: new Float32Array(rotations[index]), Size: 4, Step: false};
		}).filter(function (channel) {
			var v = channel.Values;
			var k;

			/* A bone that never turns needs no channel. */
			for (k = 0; k < v.length; k += 4) {
				if (Math.abs(v[k]) > 1e-6 || Math.abs(v[k + 1]) > 1e-6 || Math.abs(v[k + 2]) > 1e-6) return true;
			}

			return false;
		});

		channels.push({Node: 0, Path: 'translation', Times: new Float32Array(times), Values: new Float32Array(places), Size: 3, Step: false});

		return {Name: name, Length: length, Channels: channels, Stride: stride || 0, Loop: loop !== false, Hold: !!hold, Upper: !!upper, Made: self.Prefix};
	},

	/* SceneMannequin: gaits of graphs */

	/* The clips of graphs of the library (blueprints/animation/<name>): each its own graph, an Application's in its place. */
	Gaits: ['idle', 'walk', 'jog', 'sprint', 'walk-back', 'run-back', 'strafe-left', 'strafe-right', 'strafe-left-run', 'strafe-right-run', 'crouch', 'crouch-walk', 'jump', 'jump-forward', 'stairs-up', 'stairs-down'],

	/* The length of a leg of the mannequin of no options (hip to ankle, metres): the graphs are of its size. */
	LegOf: function (bones) {
		var self = this;
		var sum = 0;

		[['LeftUpLeg', 'LeftLeg'], ['LeftLeg', 'LeftFoot']].forEach(function (pair) {
			var a = bones[self.Find(bones, pair[0])].At;
			var b = bones[self.Find(bones, pair[1])].At;

			sum += Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]) + (a[2] - b[2]) * (a[2] - b[2]));
		});

		return sum;
	},

	/*
	 * The values of a graph of a gait at a phase (0 to 1 of its cycle), a function: its graph run (of the library by its name,
	 * ElemenxGraphics/animation/<name>, or a graph given), each phase once.
	 */
	GaitValues: function (graph) {
		var blueprints = this.$Service('Blueprints');
		var read = typeof graph === 'string' ? Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/' + graph) : graph;
		var made;
		var cache = {};

		if (!read)
			throw new Error('Elemenx SceneMannequin: no graph of the gait ' + graph);

		made = blueprints.Code(read) || blueprints.Compile(read);

		return function (phase) {
			var key = Math.round(phase * 1e6);
			if (!cache[key])
				cache[key] = made.Run({}, {Phase: phase});

			return cache[key];
		};
	},

	/*
	 * The pose of a gait at a phase ({Bone: [x, y, z] degrees, Root: [x, y, z] metres}): of the values of its graph, the legs
	 * of the path of the feet. A foot on the ground is a point of the ground (the heel while its toes are up, the joint of the
	 * toes while its heel is) going back at the speed of the body, so it never slides; in the air it goes on, lifted (Lift),
	 * leaving and landing at the speed of the ground. Its pitch is of the graph; its ankle follows of the point and the pitch;
	 * the thigh and the knee are two bones that reach it, the knee ahead (and out by Pole); the toes stay flat on the ground
	 * while the heel is up (no more than ToeBend). The rest of the body is of the graph: the right side is the left half a
	 * cycle on (turns round y and z turned over), or its own keys (Right...); the hips are turned by Yaw, the chest by Chest
	 * of the world and the head looks ahead. Still: in place (the feet where they stand, both of one phase: a crouch, a jump).
	 * Back: the cycle run back in time. Offset: the legs half a cycle on (a gait mirrored). Scale: of the legs, over those of
	 * the mannequin the graph is of (its metres).
	 */
	GaitPose: function (bones, values, phase, scale, size) {
		var self = this;
		var D = Math.PI / 180;
		var v0 = values(0);
		var still = !!v0.Still;
		var at = v0.Back ? ((1 - phase) % 1 + 1) % 1 : phase;
		var offset = v0.Offset || 0;
		var direction = (v0.Direction || 0) * D;
		var travel = [Math.sin(direction), 0, Math.cos(direction)];
		var pose = {};
		var now = values(at);
		var hipsRest = bones[0].At;
		var height = v0.Height === undefined ? 1 : v0.Height;
		var vectors = this.$Service('Math').Vectors;
		var add = vectors.Add;
		var sub = vectors.Subtract;
		var times3 = vectors.Scale;
		var dot = vectors.Dot;
		var cross = vectors.Cross;
		var unit = vectors.Normalize;

		function times (a, b) {
			return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
		}

		function back (q) {
			return [-q[0], -q[1], -q[2], q[3]];
		}

		function rotate (q, p) {
			var r = times(times(q, [p[0], p[1], p[2], 0]), back(q));

			return [r[0], r[1], r[2]];
		}

		function round (axis, angle) {
			var s = Math.sin(angle / 2);

			return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
		}

		/* The part of a direction across another (a side, of a front). */
		function across (a, b) {
			return unit(sub(a, times3(b, dot(a, b))));
		}

		/* A quaternion of the columns of a matrix. */
		function basis (x, y, z) {
			var trace = x[0] + y[1] + z[2];
			var k;

			if (trace > 0) {
				k = 0.5 / Math.sqrt(trace + 1);

				return [(y[2] - z[1]) * k, (z[0] - x[2]) * k, (x[1] - y[0]) * k, 0.25 / k];
			}

			if (x[0] > y[1] && x[0] > z[2]) {
				k = 2 * Math.sqrt(1 + x[0] - y[1] - z[2]);

				return [0.25 * k, (y[0] + x[1]) / k, (z[0] + x[2]) / k, (y[2] - z[1]) / k];
			}

			if (y[1] > z[2]) {
				k = 2 * Math.sqrt(1 + y[1] - x[0] - z[2]);

				return [(y[0] + x[1]) / k, 0.25 * k, (z[1] + y[2]) / k, (z[0] - x[2]) / k];
			}

			k = 2 * Math.sqrt(1 + z[2] - x[0] - y[1]);

			return [(z[0] + x[2]) / k, (z[1] + y[2]) / k, 0.25 * k, (x[1] - y[0]) / k];
		}

		/* The turn that lays a direction a (its side s0) along b, its side as near s as it may be. */
		function lay (a, s0, b, s) {
			var side = across(s, b);

			return times(basis(b, side, cross(b, side)), back(basis(a, s0, cross(a, s0))));
		}

		/* A turn as the degrees of Turn (y of x of z). */
		function degrees (q) {
			var x = q[0];
			var y = q[1];
			var z = q[2];
			var w = q[3];

			return [Math.asin(Math.max(-1, Math.min(1, -2 * (y * z - x * w)))) / D, Math.atan2(2 * (x * z + y * w), 1 - 2 * (x * x + y * y)) / D, Math.atan2(2 * (x * y + z * w), 1 - 2 * (x * x + z * z)) / D];
		}

		function rest (name) {
			return bones[self.Find(bones, name)].At;
		}

		function turn (name) {
			pose[name] = pose[name] || [0, 0, 0];

			return pose[name];
		}

		/*
		 * A pose (Pose: lying, sitting, swimming): every bone of its keys, no path of the feet; the right side its own keys or
		 * the left's of the same moment, mirrored; the hips moved by Root.
		 */
		if (v0.Pose) {
			Object.keys(now).forEach(function (key) {
				var found = /^([A-Za-z0-9]+)\.([xyz])$/.exec(key);
				var axis;

				if (/^(Left|Right)(Fingers|Thumb)$/.test(key)) {
					pose[key] = now[key];

					if (/^Left/.test(key) && now[key.replace('Left', 'Right')] === undefined)
						pose[key.replace('Left', 'Right')] = now[key];

					return;
				}

				if (!found || found[1] === 'Root') return;

				axis = 'xyz'.indexOf(found[2]);
				turn(found[1])[axis] = now[key];

				if (/^Left/.test(found[1]) && now[key.replace('Left', 'Right')] === undefined)
					turn(found[1].replace('Left', 'Right'))[axis] = (axis === 0 ? 1 : -1) * now[key];
			});

			pose.Root = [(now['Root.x'] || 0) * scale, (now['Root.y'] || 0) * scale, (now['Root.z'] || 0) * scale];

			return pose;
		}

		/* The turns of the graph: each Bone.axis, the right side the left's half a cycle on (or of one phase, in place). */
		Object.keys(now).forEach(function (key) {
			var found = /^([A-Za-z0-9]+)\.([xyz])$/.exec(key);
			var axis;
			var other;

			/* How far the fingers curl (a hand's, the other's half a cycle on): of one number each. */
			if (/^Left(Fingers|Thumb)$/.test(key)) {
				pose[key] = still ? now[key] : values((at + offset) % 1)[key];

				if (now[key.replace('Left', 'Right')] === undefined)
					pose[key.replace('Left', 'Right')] = still ? now[key] : values((at + 0.5 + offset) % 1)[key];

				return;
			}

			if (/^Right(Fingers|Thumb)$/.test(key)) {
				pose[key] = now[key];

				return;
			}

			if (!found || found[1] === 'Root') return;

			axis = 'xyz'.indexOf(found[2]);

			if (/^Left/.test(found[1])) {
				turn(found[1])[axis] = still ? now[key] : values((at + offset) % 1)[key];
				other = key.replace('Left', 'Right');

				if (now[other] === undefined)
					turn(found[1].replace('Left', 'Right'))[axis] = (axis === 0 ? 1 : -1) * (still ? now[key] : values((at + 0.5 + offset) % 1)[key]);
			}
			else {
				turn(found[1])[axis] = now[key];
			}
		});

		/* The body turned: the hips to the travel, the chest of the world, the head ahead. */
		if (v0.Yaw || v0.Chest) {
			turn('Hips')[1] += v0.Yaw || 0;
			['Spine', 'Spine1', 'Spine2'].forEach(function (name) {
				turn(name)[1] += ((v0.Chest || 0) - (v0.Yaw || 0)) / 3;
			});
			turn('Neck')[1] -= (v0.Chest || 0) * 0.3;
			turn('Head')[1] -= (v0.Chest || 0) * 0.7;
		}

		var hipsTurn = this.Turn(pose.Hips || [0, 0, 0]);
		var hipsAt = [(now['Root.x'] || 0) * scale, hipsRest[1] * height + (now['Root.y'] || 0) * scale, (now['Root.z'] || 0) * scale];

		pose.Root = sub(hipsAt, hipsRest);

		['Left', 'Right'].forEach(function (side, which) {
			var sign = which === 0 ? 1 : -1;
			var part = still ? at : (at + which * 0.5 + offset) % 1;
			var mine = values(part);
			var up = rest(side + 'UpLeg');
			var knee = rest(side + 'Leg');
			var ankle = rest(side + 'Foot');
			var ball = rest(side + 'ToeBase');
			var thigh = Math.sqrt(dot(sub(knee, up), sub(knee, up)));
			var shank = Math.sqrt(dot(sub(ankle, knee), sub(ankle, knee)));
			var stance = v0.Stance === undefined ? 1 : v0.Stance;
			var stride = (v0.Stride || 0) * scale;
			var reach = v0[side + 'Reach'] !== undefined ? v0[side + 'Reach'] : v0.Reach || 0;
			var width = (v0[side + 'Width'] !== undefined ? v0[side + 'Width'] : v0.Width || 0) * scale;
			var own = function (name) {
				return mine[side + name] !== undefined ? mine[side + name] : mine[name];
			};
			var pitch = (own('FootPitch') || 0) * D;
			var yaw = direction + sign * (v0.ToeOut || 0) * D;
			var footTurn = times(round([0, 1, 0], yaw), round([1, 0, 0], pitch));
			var toe = own('Toe') || 0;
			var bend = v0.ToeBend === undefined ? 30 : v0.ToeBend;
			var along;
			var lift = 0;
			var t;
			var swing;

			/* Where along the travel the heel's ground point is, and how high the ankle goes. */
			if (still) {
				along = reach * scale + (own('Along') || 0) * scale;
				lift = Math.max(0, (v0.Follow ? (now['Root.y'] || 0) : 0) + (own('Lift') || 0)) * scale;
			}
			else if (part < stance) {
				along = stride * (reach - part);
			}
			else {
				t = (part - stance) / (1 - stance);

				/* Forward of the body in the air: a curve of Hermite, leaving and landing at the speed of the ground. */
				var from = stride * (reach - stance);
				var to = stride * reach;
				var tangent = -stride * (1 - stance);

				along = (2 * t * t * t - 3 * t * t + 1) * from + (t * t * t - 2 * t * t + t) * tangent + (-2 * t * t * t + 3 * t * t) * to + (t * t * t - t * t) * tangent;

				/* Its Lift and Swing are keys of the part of the swing: the graph run at that part (else an arc of the number Lift). */
				swing = values(t);
				lift = (swing.Lift !== undefined ? Math.max(0, swing.Lift) : (v0.Lift || 0) * Math.pow(Math.sin(Math.PI * t), v0.LiftShape || 1.2)) * scale;

				/* The foot a little back or on of the plain path in the air (the heel kicked up behind), a part of the stride. */
				if (swing.Swing !== undefined)
					along += stride * swing.Swing * Math.sin(Math.PI * t);
			}

			/* The toes flat on the ground while the heel is up; off the ground they come back to the keys, the tip clear. */
			if ((still ? lift < 0.002 : part < stance) && pitch > 0)
				toe = Math.max(-bend, -pitch / D);

			if (!still && part >= stance)
				toe += (Math.max(-bend, Math.min(0, -pitch / D)) - toe) * Math.max(0, 1 - t / 0.3);

			/* The ground point, then the pivot of the foot on it: the heel while the toes are up, the joint of the toes while the heel is. */
			var ground = add(times3(travel, along), [sign * width, 0, 0]);
			var heel = [0, 0, ankle[2] - 0.035 * size];
			var restBall = [ball[0] - ankle[0], ball[1], ball[2]];
			var restAnkle = [0, ankle[1], ankle[2]];
			var pivot = pitch > 0 ? restBall : heel;
			var pivotAt = add(ground, rotate(round([0, 1, 0], yaw), sub(pivot, heel)));
			var ankleAt = add(add(pivotAt, rotate(footTurn, sub(restAnkle, pivot))), [0, lift, 0]);

			/* Two bones to the ankle: the hip of the hips turned, the knee ahead (out by Pole). */
			var hip = add(hipsAt, rotate(hipsTurn, sub(up, hipsRest)));
			var reachTo = sub(ankleAt, hip);
			var d = Math.min(Math.sqrt(dot(reachTo, reachTo)), (thigh + shank) * 0.9995);
			var dir = unit(reachTo);
			var poleYaw = direction + sign * (v0.Pole || 0) * D;
			var poleWant = [Math.sin(poleYaw), 0, Math.cos(poleYaw)];
			var alpha = Math.acos(Math.max(-1, Math.min(1, (thigh * thigh + d * d - shank * shank) / (2 * thigh * d))));
			var kneeAt = add(hip, add(times3(dir, thigh * Math.cos(alpha)), times3(across(poleWant, dir), thigh * Math.sin(alpha))));
			var ankleReached = add(hip, times3(dir, d));
			var thighDir = unit(sub(knee, up));
			var shankDir = unit(sub(ankle, knee));
			var thighWorld = lay(thighDir, across([0, 0, 1], thighDir), unit(sub(kneeAt, hip)), poleWant);
			var shankWorld = lay(shankDir, across([0, 0, 1], shankDir), unit(sub(ankleReached, kneeAt)), poleWant);

			pose[side + 'UpLeg'] = degrees(times(back(hipsTurn), thighWorld));
			pose[side + 'Leg'] = degrees(times(back(thighWorld), shankWorld));
			pose[side + 'Foot'] = degrees(times(back(shankWorld), footTurn));
			pose[side + 'ToeBase'] = [toe, 0, 0];
		});

		return pose;
	},

	/*
	 * A clip of a graph of a gait (a graph, or the name of one of the library: blueprints/animation/<name>) for these bones:
	 * its frames posed (GaitPose) at a rate of 30 a second, the hips moved, {Name, Length, Channels, Stride (metres a cycle
	 * over the height, what the feet travel: they do not slide), Loop, Made}. Options: those of Options (Height: its height),
	 * Name (of the clip).
	 */
	Gait: function (bones, graph, options) {
		var self = this;
		var o = this.Options(options);
		var values = this.GaitValues(graph);
		var v0 = values(0);
		var scale = this.LegOf(bones) / this.LegOf(this.Skeleton({}));
		var length = (v0.Length || 1) * Math.sqrt(scale);
		var name = (options && options.Name) || (typeof graph === 'string' ? graph : String(graph.name || 'gait').replace(/^animation-/, ''));
		var loop = v0.Loop === undefined || !!v0.Loop;

		return this.Clip(bones, name, length, Math.max(24, Math.round(length * 30)), function (t) {
			return self.GaitPose(bones, values, t, scale, o.Height);
		}, loop, v0.Still ? 0 : (v0.Stride || 0) * scale / o.Height, !!v0.Hold, !!v0.Upper);
	},

	/*
	 * A clip of a graph as the skeleton and the clip of a file of FBX are read (Fbx.Parse): {Bones: [{Name (with no prefix),
	 * Parent, Translation (metres, of its parent), Pre, Rotation (degrees, its rest: none)}], Length, Curves: {bone: {R: [x,
	 * y, z], T (the hips): [x, y, z]}}, Stride (metres a cycle), Leg (hip to ankle, metres), Loop, Hold, Upper}, the curves of
	 * degrees in the order of FBX (x turns first), unwrapped frame to frame. So SceneModels.Retarget lays it on any skeleton
	 * by the roles of its bones, as it lays a clip of Mixamo. Options: those of Gait.
	 */
	Source: function (graph, options) {
		var read = typeof graph === 'string' && !options ? Elemenx.Resources('Blueprints', 'ElemenxGraphics/animation/' + graph) : null;
		var text = read ? JSON.stringify(read) : '';
		/* Of a graph of the library as it is now, made once (a graph changed is made again: its text is another). */
		var kept = read && this.Sources ? this.Sources[graph] : null;
		if (kept && kept.Text === text) return kept.Clip;

		var bones = this.Skeleton(options || {});
		var clip = this.Gait(bones, graph, options);
		var curves = {};
		var degrees = 180 / Math.PI;

		/* A quaternion as degrees x, y, z of a matrix Rz Ry Rx (FBX: x turns first). */
		function euler (q) {
			var x = q[0];
			var y = q[1];
			var z = q[2];
			var w = q[3];
			var m20 = 2 * (x * z - y * w);

			return [Math.atan2(2 * (y * z + x * w), 1 - 2 * (x * x + y * y)) * degrees, Math.asin(Math.max(-1, Math.min(1, -m20))) * degrees, Math.atan2(2 * (x * y + z * w), 1 - 2 * (y * y + z * z)) * degrees];
		}

		clip.Channels.forEach(function (channel) {
			var times = Array.prototype.slice.call(channel.Times);
			var own = curves[channel.Node] = curves[channel.Node] || {};
			var axes = [[], [], []];
			var k;

			if (channel.Path === 'rotation') {
				for (k = 0; k < times.length; k++) {
					var turned = euler([channel.Values[k * 4], channel.Values[k * 4 + 1], channel.Values[k * 4 + 2], channel.Values[k * 4 + 3]]);

					turned.forEach(function (value, axis) {
						var last = axes[axis][k - 1];

						/* The short way from the frame before: no jump of 360 degrees between two keys. */
						axes[axis].push(last === undefined ? value : value + Math.round((last - value) / 360) * 360);
					});
				}

				own.R = axes.map(function (values) {
					return {Times: times, Values: values};
				});

				return;
			}

			for (k = 0; k < times.length; k++) {
				axes[0].push(channel.Values[k * 3]);
				axes[1].push(channel.Values[k * 3 + 1]);
				axes[2].push(channel.Values[k * 3 + 2]);
			}

			own.T = axes.map(function (values) {
				return {Times: times, Values: values};
			});
		});

		var source = {
			Bones: bones.map(function (bone) {
				var parent = bone.Parent === -1 ? [0, 0, 0] : bones[bone.Parent].At;

				return {ID: bone.Name, Name: bone.Name.replace(/^.*:/, ''), Parent: bone.Parent, Translation: [bone.At[0] - parent[0], bone.At[1] - parent[1], bone.At[2] - parent[2]], Pre: [0, 0, 0], Rotation: [0, 0, 0]};
			}),
			Length: clip.Length,
			Curves: curves,
			Stride: clip.Stride * this.Options(options).Height,
			Leg: this.LegOf(bones),
			Loop: clip.Loop,
			Hold: clip.Hold,
			Upper: clip.Upper
		};

		if (read) {
			this.Sources = this.Sources || {};
			this.Sources[graph] = {Text: text, Clip: source};
		}

		return source;
	},

	/* The poses, of graphs of the library too (blueprints/animation/<name>): standing, lying, crawling, aiming, seated, hanging, swimming. */
	Poses: ['t-pose', 'attention', 'lie-front', 'lie-back', 'lie-left', 'lie-right', 'crawl', 'aim-hip', 'aim-shoulder', 'aim-bow', 'sit', 'drive', 'hang', 'pull-up', 'swim-breaststroke', 'swim-crawl', 'swim-back'],

	/* The actions, of graphs of the library too, laid on a skeleton when first played (SceneModels): boarding, floating, falling, hits, death, blows, reloading, using, vaulting. */
	Actions: ['float', 'fall', 'land', 'hit', 'stagger', 'die', 'reload', 'punch', 'attack', 'sword-slash', 'sword-thrust', 'block', 'interact', 'pick-up', 'vault', 'cast', 'enter-car', 'climb-step', 'climb-ladder', 'canopy-in'],

	/* Every clip of the person, each of its graph: the gaits (Gaits), then the poses (Poses). */
	Clips: function (bones, options) {
		var self = this;
		var o = this.Options(options);

		return this.Gaits.concat(this.Poses).map(function (name) {
			return self.Gait(bones, name, o);
		});
	},

	/*
	 * A person of options as a model of SceneModels under a name, made the first time it is asked for (as a file is
	 * fetched), its clips named as they are (and idle, walk, run, jump as a Scene asks).
	 */
	Define: function (name, options) {
		var self = this;
		var o = this.Options(options);

		this.$Service('SceneModels').Define(name, {
			URL: 'mannequin:' + name,
			Group: 'characters',
			Type: 'unit',
			Size: o.Height,
			Clips: {run: 'jog'},
			Generate: function (callback) {
				var asset;

				try {
					asset = self.Asset(o);
				}
				catch (error) {
					callback(error, null);

					return;
				}

				callback(null, asset);
			}
		});

		return name;
	}
});
