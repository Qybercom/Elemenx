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
 * - Clips(bones, options): the clips of a person: idle, attention, walk, jog, sprint, strafe-left, strafe-right, walk-back,
 *   run-back, crouch, crouch-walk, lie-front, lie-back, lie-left, lie-right, crawl, aim-hip, aim-shoulder, aim-bow, sit,
 *   drive, jump, jump-forward, hang, pull-up, swim-breaststroke, swim-back, swim-crawl ([{Name, Length, Channels}]);
 *   Pose(bones, pose) the turns of the bones of a pose.
 * - Define(name, options): a model of SceneModels of that name, made when it is first asked for (Load), as a file is.
 * SceneModels has the model mannequin of it (Options of none). The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneMannequin', {
	$Meta: {
		Description: 'A person made wholly of code, as detailed as a model of a file: its skin, its skeleton of Mixamo and its clips.',
		Methods: ['Options(options)', 'Skeleton(options)', 'Shapes(options, bones)', 'Distance(shapes, point)', 'Near(shapes, point)', 'Asset(options)', 'Clips(bones, options)', 'Pose(bones, pose)', 'Define(name, options)']
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

		var top = 0.5 * legs + 0.03;
		var hips = add('Hips', -1, [0, top, 0]);
		var spine = add('Spine', hips, [0, top + 0.06, 0.004]);
		var spine1 = add('Spine1', spine, [0, top + 0.13, 0.006]);
		var spine2 = add('Spine2', spine1, [0, top + 0.2, 0.004]);
		var neck = add('Neck', spine2, [0, top + 0.3, -0.004]);
		var head = add('Head', neck, [0, top + 0.345, 0.004]);

		add('HeadTop_End', head, [0, top + 0.345 + 0.125 * o.Head, 0.004]);
		add('LeftEye', head, [0.0185 * o.Head, top + 0.403 + (o.Head - 1) * 0.06, 0.042 * o.Head]);
		add('RightEye', head, [-0.0185 * o.Head, top + 0.403 + (o.Head - 1) * 0.06, 0.042 * o.Head]);
		add('Jaw', head, [0, top + 0.37, 0.012]);

		[['Left', 1], ['Right', -1]].forEach(function (side) {
			var s = side[1];
			var name = side[0];
			var clavicle = add(name + 'Shoulder', spine2, [s * 0.022, top + 0.282, 0.002]);
			var arm = add(name + 'Arm', clavicle, [s * shoulder, top + 0.287, -0.004]);
			var fore = add(name + 'ForeArm', arm, [s * (shoulder + 0.158), top + 0.287, -0.006]);
			var wrist = shoulder + 0.158 + 0.135;
			var hand = add(name + 'Hand', fore, [s * wrist, top + 0.287, -0.004]);

			/* The fingers: three bones and an end each, from the knuckles of the palm; the thumb from its root at the wrist. */
			[['Thumb', 0.012, 0.018, [0.022, 0.016, 0.012], -0.006], ['Index', 0.054, 0.0135, [0.024, 0.015, 0.011], 0], ['Middle', 0.056, 0.0035, [0.027, 0.017, 0.012], 0.001], ['Ring', 0.054, -0.0065, [0.025, 0.016, 0.011], 0], ['Pinky', 0.049, -0.0155, [0.019, 0.012, 0.01], -0.001]].forEach(function (finger) {
				var x = wrist + finger[1];
				var z = finger[2];
				var parent = hand;
				var thumb = finger[0] === 'Thumb';
				var y = top + 0.287 + finger[4];
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

			var thigh = add(name + 'UpLeg', hips, [s * hip, top - 0.03, 0.002]);
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
	Clip: function (bones, name, length, count, poseAt, loop, stride) {
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

		return {Name: name, Length: length, Channels: channels, Stride: stride || 0, Loop: loop !== false, Made: self.Prefix};
	},

	Clips: function (bones, options) {
		var self = this;
		var o = this.Options(options);
		var h = o.Height;
		var clips = [];
		var sin = Math.sin;
		var cos = Math.cos;
		var tau = Math.PI * 2;

		function add (name, length, poseAt, loop, stride, count) {
			clips.push(self.Clip(bones, name, length, count || 24, poseAt, loop, stride));
		}

		/* Arms down at the sides, a little out and bent: the rest of a standing person. */
		function down (more) {
			return Object.assign({LArm: [0, 0, -76], RArm: [0, 0, 76], LForeArm: [0, -12, 0], RForeArm: [0, 12, 0], LFingers: 12, RFingers: 12, LThumb: 10, RThumb: 10}, more || {});
		}

		/* A gait: the legs swing by phase (a stride of Swing degrees), the knees bend as each comes through, the arms swing against them. */
		function gait (t, swing, knee, arms, bob, lean, back) {
			var a = t * tau;
			var dir = back ? -1 : 1;
			var lift = Math.max(0, sin(a + 0.6));
			var lift2 = Math.max(0, sin(a + Math.PI + 0.6));

			return down({
				Root: [sin(a) * 0.012 * h, -Math.abs(cos(a)) * bob * h, 0],
				Spine: [lean, sin(a) * 6, 0],
				Spine2: [0, -sin(a) * 8, 0],
				Neck: [-lean * 0.6, sin(a) * 3, 0],
				LUpLeg: [-dir * sin(a) * swing, 0, 0],
				RUpLeg: [dir * sin(a) * swing, 0, 0],
				LLeg: [knee * lift + 5, 0, 0],
				RLeg: [knee * lift2 + 5, 0, 0],
				LFoot: [-dir * sin(a) * swing * 0.25 - 5 * lift, 0, 0],
				RFoot: [dir * sin(a) * swing * 0.25 - 5 * lift2, 0, 0],
				LArm: [dir * sin(a) * arms, 0, -78],
				RArm: [-dir * sin(a) * arms, 0, 78],
				LForeArm: [0, -12 - arms * 0.5 * (1 + sin(a)) * 0.5, 0],
				RForeArm: [0, 12 + arms * 0.5 * (1 - sin(a)) * 0.5, 0]
			});
		}

		add('idle', 4, function (t) {
			var breath = sin(t * tau);

			return down({Root: [sin(t * tau) * 0.003 * h, breath * 0.002 * h, 0], Spine: [breath * 1.5, 0, 0], Spine2: [breath * 1.2, 0, 0], Head: [-breath, sin(t * tau) * 3, 0], LUpLeg: [0, 0, 2], RUpLeg: [0, 0, -2]});
		}, true);

		/* Its rest, standing as a T: what an editor or a retarget measures. */
		add('t-pose', 1, function () {
			return {};
		}, true, 0, 1);

		add('attention', 2, function () {
			return {LArm: [0, 0, -84], RArm: [0, 0, 84], LForeArm: [0, -4, 0], RForeArm: [0, 4, 0], LFingers: 6, RFingers: 6, Head: [-3, 0, 0]};
		}, true, 0, 2);

		add('walk', 1.1, function (t) {
			return gait(t, 26, 38, 18, 0.012, 3);
		}, true, 1.45);
		add('jog', 0.72, function (t) {
			return Object.assign(gait(t, 38, 70, 30, 0.022, 9), {LForeArm: [0, -80, 0], RForeArm: [0, 80, 0], LFingers: 40, RFingers: 40});
		}, true, 2.1);
		add('sprint', 0.56, function (t) {
			return Object.assign(gait(t, 52, 100, 48, 0.03, 16), {LForeArm: [0, -95, 0], RForeArm: [0, 95, 0], LFingers: 55, RFingers: 55});
		}, true, 3.4);
		add('walk-back', 1.2, function (t) {
			return gait(t, 20, 32, 12, 0.01, -2, true);
		}, true, 1.1);
		add('run-back', 0.8, function (t) {
			return Object.assign(gait(t, 30, 60, 22, 0.02, -4, true), {LForeArm: [0, -70, 0], RForeArm: [0, 70, 0]});
		}, true, 1.7);

		/* Strafes: the legs swing out and in, a step across. */
		[['strafe-left', 1], ['strafe-right', -1]].forEach(function (one) {
			add(one[0], 1, function (t) {
				var a = t * tau;
				var s = one[1];

				return down({Root: [0, -Math.abs(cos(a)) * 0.012 * h, 0], LUpLeg: [0, 0, s * Math.max(0, sin(a)) * 18 + 2], RUpLeg: [0, 0, -s * Math.max(0, -sin(a)) * 18 - 2], LLeg: [Math.max(0, sin(a)) * 25 + 4, 0, 0], RLeg: [Math.max(0, -sin(a)) * 25 + 4, 0, 0], Spine: [3, 0, s * sin(a) * 3]});
			}, true, 1.2);
		});

		/* Crouching: the hips low, knees deep. */
		function crouch (t, walk) {
			var a = t * tau;

			return down({Root: [0, -0.2 * h, 0.03 * h], Spine: [25, 0, 0], Spine1: [8, 0, 0], Neck: [-25, 0, 0], LUpLeg: [-80 - (walk ? sin(a) * 25 : 0), 0, 4], RUpLeg: [-70 + (walk ? sin(a) * 25 : 0), 0, -4], LLeg: [105 + (walk ? Math.max(0, sin(a + 0.6)) * 20 : 0), 0, 0], RLeg: [95 + (walk ? Math.max(0, -sin(a + 0.6)) * 20 : 0), 0, 0], LFoot: [-20, 0, 0], RFoot: [-22, 0, 0], LArm: [-20, 0, -70], RArm: [-20, 0, 70], LForeArm: [0, -35, 0], RForeArm: [0, 35, 0]});
		}

		add('crouch', 3, function (t) {
			return crouch(t, false);
		}, true);
		add('crouch-walk', 1.4, function (t) {
			return crouch(t, true);
		}, true, 0.9);

		/* Lying: the whole turned at the hips, its height near the ground, breathing. */
		[['lie-front', [90, 0, 0], 0.11], ['lie-back', [-90, 0, 0], 0.1], ['lie-left', [0, 0, 90], 0.15], ['lie-right', [0, 0, -90], 0.15]].forEach(function (one) {
			add(one[0], 4, function (t) {
				var breath = sin(t * tau);
				var front = one[0] === 'lie-front';

				return {Body: one[1], Root: [0, -(bones[0].At[1] - one[2] * h), front ? -0.0 : 0], Spine: [breath * 1.5, 0, 0], LArm: front ? [0, -20, -40] : [0, 0, -70], RArm: front ? [0, 20, 40] : [0, 0, 70], LForeArm: [0, front ? -80 : -20, 0], RForeArm: [0, front ? 80 : 20, 0], Head: front ? [-60, 0, 0] : [0, 0, 0], LUpLeg: [0, 0, 6], RUpLeg: one[0] === 'lie-left' ? [-30, 0, -6] : [0, 0, -6], RLeg: one[0] === 'lie-left' ? [40, 0, 0] : [0, 0, 0], LFingers: 20, RFingers: 20};
			}, true);
		});

		/* A crawl on the belly: elbows and knees by turns. */
		add('crawl', 1.6, function (t) {
			var a = t * tau;

			return {Body: [88, 0, sin(a) * 4], Root: [0, -(bones[0].At[1] - 0.12 * h), 0], Head: [-55, 0, 0], LArm: [-20 - sin(a) * 25, -40, -30], RArm: [-20 + sin(a) * 25, 40, 30], LForeArm: [0, -90 + sin(a) * 20, 0], RForeArm: [0, 90 + sin(a) * 20, 0], LUpLeg: [-sin(a) * 25 - 10, 0, 18], RUpLeg: [sin(a) * 25 - 10, 0, -18], LLeg: [40 + sin(a) * 30, 0, 0], RLeg: [40 - sin(a) * 30, 0, 0], LFingers: 25, RFingers: 25};
		}, true, 0.5);

		/* Aiming: from the hip, at the shoulder, a bow drawn. */
		add('aim-hip', 2, function (t) {
			var breath = sin(t * tau) * 0.6;

			return {Spine: [4 + breath, -10, 0], RArm: [-30, -30, 60], RForeArm: [0, 70, 0], LArm: [-50, 30, -50], LForeArm: [0, -50, 0], RFingers: 45, LFingers: 30, RUpLeg: [0, 0, -6], LUpLeg: [-8, 0, 6], LLeg: [8, 0, 0]};
		}, true);
		add('aim-shoulder', 2, function (t) {
			var breath = sin(t * tau) * 0.4;

			return {Spine: [6 + breath, -20, 0], Neck: [6, 18, 0], Head: [8, 6, 0], RArm: [-80, -20, 15], RForeArm: [0, 95, 0], LArm: [-85, 35, -10], LForeArm: [0, -35, 0], RFingers: 45, LFingers: 35, RUpLeg: [0, 0, -8], LUpLeg: [-10, 0, 8], LLeg: [10, 0, 0]};
		}, true);
		add('aim-bow', 2, function (t) {
			var breath = sin(t * tau) * 0.4;

			return {Spine: [2 + breath, -70, 0], Neck: [0, 60, 0], Head: [4, 10, 0], LArm: [0, 0, 0], LForeArm: [0, 0, 0], LFingers: 60, LThumb: 30, RArm: [0, 10, -10], RForeArm: [0, 150, 0], RHand: [0, 0, 0], RFingers: 70, RUpLeg: [0, 0, -12], LUpLeg: [0, 0, 12]};
		}, true);

		/* Seated: on a chair, at a wheel. */
		add('sit', 3, function (t) {
			var breath = sin(t * tau);

			return {Root: [0, -0.24 * h, -0.02 * h], Spine: [-4 + breath, 0, 0], LUpLeg: [-88, 0, 4], RUpLeg: [-88, 0, -4], LLeg: [88, 0, 0], RLeg: [88, 0, 0], LArm: [-30, 0, -74], RArm: [-30, 0, 74], LForeArm: [0, -55, 0], RForeArm: [0, 55, 0], LFingers: 18, RFingers: 18};
		}, true);
		add('drive', 3, function (t) {
			var breath = sin(t * tau);

			return {Root: [0, -0.26 * h, -0.05 * h], Spine: [-14 + breath, 0, 0], Neck: [12, 0, 0], LUpLeg: [-70, 0, 6], RUpLeg: [-74, 0, -6], LLeg: [60, 0, 0], RLeg: [70, 0, 0], LArm: [-55, 0, -40], RArm: [-55, 0, 40], LForeArm: [0, -45, 0], RForeArm: [0, 45, 0], LFingers: 65, RFingers: 65, LThumb: 25, RThumb: 25};
		}, true);

		/* Jumps: a crouch, the push, up, and down again. */
		function jump (t, forward) {
			var crouchAt = Math.max(0, 1 - Math.abs(t - 0.12) / 0.12) + Math.max(0, 1 - Math.abs(t - 0.9) / 0.1);
			var up = t > 0.2 && t < 0.85 ? sin((t - 0.2) / 0.65 * Math.PI) : 0;

			return down({Root: [0, (-crouchAt * 0.12 + up * 0.35) * h, forward ? t * 1.2 * h : 0], Spine: [crouchAt * 20 + (forward ? 10 : 0), 0, 0], LUpLeg: [-crouchAt * 60 - up * (forward ? 50 : 15), 0, 0], RUpLeg: [-crouchAt * 60 - up * (forward ? 10 : 15), 0, 0], LLeg: [crouchAt * 80 + up * 40, 0, 0], RLeg: [crouchAt * 80 + up * 60, 0, 0], LArm: [-up * 120 + crouchAt * 30, 0, -70], RArm: [-up * 120 + crouchAt * 30, 0, 70]});
		}

		add('jump', 1.1, function (t) {
			return jump(t, false);
		}, false);
		add('jump-forward', 1, function (t) {
			return jump(t, true);
		}, false);

		/* Hanging by the hands, and pulling up. */
		add('hang', 2, function (t) {
			var a = t * tau;

			return {Root: [0, 0.02 * h, 0], LArm: [0, 0, 70], RArm: [0, 0, -70], LShoulder: [0, 0, 18], RShoulder: [0, 0, -18], LForeArm: [0, 0, 8], RForeArm: [0, 0, -8], LFingers: 75, RFingers: 75, LUpLeg: [sin(a) * 6 - 5, 0, 0], RUpLeg: [-sin(a) * 6 - 5, 0, 0], LLeg: [12, 0, 0], RLeg: [12, 0, 0], Spine: [sin(a) * 2, 0, 0]};
		}, true);
		add('pull-up', 2.2, function (t) {
			var up = sin(t * Math.PI);

			return {Root: [0, up * 0.4 * h, 0], LArm: [-up * 30, 0, 70 - up * 75], RArm: [-up * 30, 0, -70 + up * 75], LShoulder: [0, 0, 18 - up * 10], RShoulder: [0, 0, -18 + up * 10], LForeArm: [0, -up * 120, 0], RForeArm: [0, up * 120, 0], LFingers: 75, RFingers: 75, LUpLeg: [-12, 0, 0], RUpLeg: [-12, 0, 0], LLeg: [25, 0, 0], RLeg: [25, 0, 0]};
		}, true);

		/* Swimming: on the belly (breaststroke, crawl) or on the back. */
		add('swim-breaststroke', 1.6, function (t) {
			var a = t * tau;
			var pull = Math.max(0, sin(a));
			var kick = Math.max(0, sin(a + 2));

			return {Body: [80, 0, 0], Root: [0, -0.05 * h, 0], Head: [-50 + pull * 20, 0, 0], LArm: [-90 + pull * 40, -pull * 60, -10], RArm: [-90 + pull * 40, pull * 60, 10], LForeArm: [0, -pull * 70, 0], RForeArm: [0, pull * 70, 0], LUpLeg: [-kick * 50, 0, kick * 25], RUpLeg: [-kick * 50, 0, -kick * 25], LLeg: [kick * 90, 0, 0], RLeg: [kick * 90, 0, 0], LFingers: 5, RFingers: 5};
		}, true, 0.8);
		add('swim-crawl', 1.2, function (t) {
			var a = t * tau;

			return {Body: [85, sin(a) * 25, 0], Root: [0, -0.05 * h, 0], Head: [-30, -sin(a) * 30, 0], LArm: [-90 + sin(a) * 180, 0, -15], RArm: [-90 - sin(a) * 180, 0, 15], LForeArm: [0, -20, 0], RForeArm: [0, 20, 0], LUpLeg: [sin(a * 3) * 18, 0, 3], RUpLeg: [-sin(a * 3) * 18, 0, -3], LLeg: [12, 0, 0], RLeg: [12, 0, 0], LFingers: 8, RFingers: 8};
		}, true, 1.3);
		add('swim-back', 1.5, function (t) {
			var a = t * tau;

			return {Body: [-85, sin(a) * 20, 0], Root: [0, -0.05 * h, 0], Head: [20, 0, 0], LArm: [-90 + sin(a) * 180, 0, -15], RArm: [-90 - sin(a) * 180, 0, 15], LUpLeg: [sin(a * 3) * 15, 0, 3], RUpLeg: [-sin(a * 3) * 15, 0, -3], LFingers: 8, RFingers: 8};
		}, true, 1.1);

		return clips;
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
