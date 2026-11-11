/*
 * SceneFlora: realistic plants of code, a species a preset of numbers (and later of a picture of it: FloraEditor), each
 * plant of it another of its seed: no file, the same plant for the same seed.
 * - A plant grows as plants do: a trunk (or several stems) up to its crown, then its branches toward the light, by space
 *   colonization (points scattered in the shape of its crown draw the nearest buds toward them, each bud a step a time,
 *   a point reached is used up: Runions 2007); a spruce in whorls (a leader and its tiers of branches); a palm a curved
 *   trunk and its fronds. Its branches as thick as the pipes of what they carry (da Vinci: the sum of the children's
 *   radii to the power Pipe is the parent's), tubes with their bark laid along them; its leaves cards of clusters of
 *   leaves or tufts of needles, lit as the round of its crown is; dead stubs on its bare trunk.
 * - Its textures are drawn of code too: its bark (the height of the plant along it: a pine dark below, orange above; its
 *   relief a normal map) and its leaves (an atlas of four clusters, their alpha the cut, and below them the same in
 *   shade: the leaves deep in its crown). A preset may give its own
 *   pictures instead (Bark.Image, Leaves.Image: {Width, Height, Data} RGBA).
 * - Species() the names of its presets; Preset(name) a copy of one (with what it does not tell); Tree(preset, variant)
 *   the plant {Height, Bark: geometry, Leaves: geometry ({Positions, Normals, UVs, Indices}, metres, standing on 0),
 *   Triangles, Nodes}; Textures(preset) its pictures {Bark, BarkNormal, Leaves} ({Width, Height, Data}); Asset(tree,
 *   textures) the plant as Gltf gives a file (two materials: bark, leaves cut by their alpha and seen from both sides).
 * - FromPicture(picture, base) a species of a photograph of a plant on white or clear (its reference): its bare trunk,
 *   the profile, width, lean and holes of its crown, the colors of its leaves and of its bark; {Preset, Found}.
 * - Define(name, preset or species, options {Variants (8), Size, Sway, Group, Keep (false: not kept in the browser, a
 *   preview of FloraEditor)}) makes it a model of SceneModels: its
 *   Variants made in workers (Work) the first time one is asked for, each another plant of the species; kept in the
 *   browser (SceneCache, under Key(preset, variants)) and taken from there the next time.
 * The same in a page, a worker and Node: it reads no page.
 */
Elemenx.Service('SceneFlora', {
	$Meta: {
		Description: 'Realistic plants of code: trunks and branches grown by space colonization (whorls for spruces, fronds for palms), bark and leaves drawn of code, each plant of a species another.',
		Methods: ['Species()', 'Preset(name)', 'Tree(preset, variant)', 'Textures(preset)', 'Asset(tree, textures)', 'Define(name, preset, options)', 'FromPicture(picture, base)', 'Key(preset, variants)', 'Work()', 'Source(names)']
	},

	/*
	 * The species: Grow (colonize, whorls, palm), Height [low, high] metres; Trunk {Bare (of the height, under the
	 * crown), Radius (of the base, of the height), Lean, Wander, Stems, Flare, Stubs, Leader (the trunk goes on through the
	 * crown)}; Crown {Profile [[0 its foot to 1 its top, radius 0 to 1]...], Width (its widest radius, of the height),
	 * Lean, Clumps, Hollow (how much its points keep to its outside), Points}; Growth {Step, Reach, Kill (of the height),
	 * Up, Droop, Pipe, Cut (twigs thinner than Cut times the thinnest left to the leaves)}; Leaves {Kind (broad, needles,
	 * frond), Size (metres), Each (cards a twig), Color, Shade, Light}; Bark {Pattern (plates, birch, ridges, rings,
	 * smooth), Low, High (colors), Split (where the high one begins, of the height)}.
	 */
	Presets: {
		pine: {Grow: 'colonize', Height: [16, 26], Trunk: {Bare: 0.6, Radius: 0.016, Lean: 0.04, Wander: 0.25, Stems: 1, Flare: 0.35, Stubs: 0.55, Leader: true}, Crown: {Profile: [[0, 0.35], [0.25, 0.85], [0.55, 1], [0.85, 0.7], [1, 0.25]], Width: 0.2, Lean: 0.25, Clumps: 0.6, Hollow: 0.35, Points: 1600}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.25, Droop: 0.05, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'needles', Size: 1.2, Each: 5, Color: [0.16, 0.3, 0.16], Shade: [0.07, 0.15, 0.08], Light: [0.32, 0.45, 0.24]}, Bark: {Pattern: 'plates', Low: [0.27, 0.22, 0.19], High: [0.74, 0.45, 0.28], Split: 0.35}},
		spruce: {Grow: 'whorls', Height: [14, 24], Trunk: {Bare: 0.08, Radius: 0.014, Lean: 0.01, Wander: 0.05, Stems: 1, Flare: 0.35, Stubs: 0.3, Leader: true}, Crown: {Profile: [[0, 1], [0.5, 0.62], [1, 0.04]], Width: 0.2, Lean: 0.05, Clumps: 0.25, Hollow: 0.5, Points: 0}, Growth: {Step: 0.02, Reach: 0, Kill: 0, Up: 0.15, Droop: 0.35, Pipe: 2.3, Cut: 1.2}, Leaves: {Kind: 'needles', Size: 1.1, Each: 3, Color: [0.11, 0.24, 0.15], Shade: [0.04, 0.11, 0.07], Light: [0.2, 0.36, 0.22]}, Bark: {Pattern: 'ridges', Low: [0.3, 0.24, 0.2], High: [0.42, 0.33, 0.26], Split: 0.6}},
		oak: {Grow: 'colonize', Height: [14, 22], Trunk: {Bare: 0.28, Radius: 0.035, Lean: 0.05, Wander: 0.35, Stems: 1, Flare: 0.6, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.45], [0.2, 0.9], [0.5, 1], [0.8, 0.8], [1, 0.3]], Width: 0.48, Lean: 0.2, Clumps: 0.45, Hollow: 0.4, Points: 1600}, Growth: {Step: 0.017, Reach: 0.12, Kill: 0.024, Up: 0.08, Droop: 0.12, Pipe: 2.4, Cut: 2.4}, Leaves: {Kind: 'broad', Size: 1.6, Each: 4, Color: [0.15, 0.26, 0.09], Shade: [0.05, 0.11, 0.04], Light: [0.28, 0.4, 0.14]}, Bark: {Pattern: 'ridges', Low: [0.28, 0.25, 0.22], High: [0.36, 0.33, 0.29], Split: 0.5}},
		birch: {Grow: 'colonize', Height: [15, 24], Trunk: {Bare: 0.35, Radius: 0.013, Lean: 0.05, Wander: 0.3, Stems: 1, Flare: 0.25, Stubs: 0.45, Leader: true}, Crown: {Profile: [[0, 0.5], [0.3, 0.95], [0.6, 0.85], [1, 0.25]], Width: 0.24, Lean: 0.25, Clumps: 0.55, Hollow: 0.45, Points: 1500}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.12, Droop: 0.3, Pipe: 2.3, Cut: 1.5}, Leaves: {Kind: 'broad', Size: 1.2, Each: 4, Color: [0.24, 0.4, 0.12], Shade: [0.09, 0.18, 0.05], Light: [0.42, 0.56, 0.2]}, Bark: {Pattern: 'birch', Low: [0.2, 0.19, 0.18], High: [0.88, 0.87, 0.83], Split: 0.08}},
		palm: {Grow: 'palm', Height: [9, 15], Trunk: {Bare: 1, Radius: 0.02, Lean: 0.18, Wander: 0.1, Stems: 1, Flare: 0.45, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.3, Lean: 0, Clumps: 0, Hollow: 0, Points: 26}, Growth: {Step: 0.05, Reach: 0, Kill: 0, Up: 0, Droop: 0.45, Pipe: 2, Cut: 1}, Leaves: {Kind: 'frond', Size: 4.6, Each: 1, Color: [0.24, 0.38, 0.13], Shade: [0.1, 0.18, 0.06], Light: [0.45, 0.56, 0.22]}, Bark: {Pattern: 'rings', Low: [0.4, 0.35, 0.29], High: [0.52, 0.46, 0.37], Split: 0.5}},
		bush: {Grow: 'colonize', Height: [1.4, 2.6], Trunk: {Bare: 0.08, Radius: 0.012, Lean: 0.3, Wander: 0.4, Stems: 5, Flare: 0, Stubs: 0, Leader: false}, Crown: {Profile: [[0, 0.55], [0.35, 1], [0.75, 0.85], [1, 0.3]], Width: 0.55, Lean: 0.2, Clumps: 0.4, Hollow: 0.4, Points: 450}, Growth: {Step: 0.035, Reach: 0.2, Kill: 0.045, Up: 0.15, Droop: 0.05, Pipe: 2.2, Cut: 1.3}, Leaves: {Kind: 'broad', Size: 0.55, Each: 4, Color: [0.17, 0.29, 0.1], Shade: [0.06, 0.13, 0.04], Light: [0.32, 0.44, 0.17]}, Bark: {Pattern: 'smooth', Low: [0.3, 0.26, 0.22], High: [0.38, 0.33, 0.27], Split: 0.5}}
	},

	/* What a worker carries of it besides its methods: its presets. */
	Carried: ['Presets'],

	Species: function () {
		return Object.keys(this.Presets);
	},

	/* A preset by name, or one given, with all it does not tell from the pine (a copy: changing it changes nothing here). */
	Preset: function (name) {
		var given = typeof name === 'string' ? this.Presets[name] : name;
		var base = this.Presets.pine;
		var made;

		if (!given)
			throw new Error('Elemenx Flora: unknown species ' + name);

		made = JSON.parse(JSON.stringify(given));
		made.Name = made.Name || (typeof name === 'string' ? name : 'plant');

		['Trunk', 'Crown', 'Growth', 'Leaves', 'Bark'].forEach(function (part) {
			made[part] = Object.assign({}, base[part], made[part] || {});
		});

		made.Grow = made.Grow || 'colonize';
		made.Height = made.Height || base.Height;

		/* Its own pictures are not copied as JSON: kept as given. */
		if (typeof name !== 'string') {
			if (given.Bark && given.Bark.Image)
				made.Bark.Image = given.Bark.Image;

			if (given.Leaves && given.Leaves.Image)
				made.Leaves.Image = given.Leaves.Image;
		}

		return made;
	},

	Work: function () {
		return this.$Service('Workers').Pool('SceneFlora', {Math: true, Noise: true, Random: true, SceneFlora: true});
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* The plant of a preset, of its variant. */
	Tree: function (preset, variant) {
		var p = this.Preset(preset);
		var random = this.$Service('Random').Sequence(p.Name + ':' + (variant || 0));
		var height = p.Height[0] + (p.Height[1] - p.Height[0]) * random();
		var nodes = [];
		var grown;

		if (p.Grow === 'palm') grown = this.Palm(p, height, random, nodes);
		else if (p.Grow === 'whorls') grown = this.Whorls(p, height, random, nodes);
		else grown = this.Colonize(p, height, random, nodes);

		return this.Mesh(p, height, random, nodes, grown);
	},

	/* A node of a plant: where it is, its parent, its children, its radius (metres). */
	Node: function (nodes, at, parent, extra) {
		var node = Object.assign({P: at, Parent: parent, Kids: [], R: 0}, extra || {});

		nodes.push(node);

		if (parent >= 0)
			nodes[parent].Kids.push(nodes.length - 1);

		return nodes.length - 1;
	},

	/* Its radius of its crown at t (0 its foot, 1 its top), 0 to 1, of the Profile. */
	Profile: function (profile, t) {
		var k;

		for (k = 1; k < profile.length; k++) {
			if (t <= profile[k][0] || k === profile.length - 1) {
				var a = profile[k - 1];
				var b = profile[k];
				var u = Math.max(0, Math.min(1, (t - a[0]) / ((b[0] - a[0]) || 1)));

				return a[1] + (b[1] - a[1]) * u;
			}
		}

		return profile[0][1];
	},

	/*
	 * A trunk from a foot up to a height, a node every step, wandering and leaning (a stem of a bush leans out more): the
	 * index of its last node.
	 */
	Stem: function (nodes, foot, top, step, lean, wander, random, noise, from) {
		var at = foot.slice();
		var parent = from === undefined ? -1 : from;
		var dir = [lean[0], 1, lean[1]];
		var k = 0;
		var length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);

		dir = [dir[0] / length, dir[1] / length, dir[2] / length];

		if (parent === -1)
			parent = this.Node(nodes, at.slice(), -1, {Trunk: true});

		while (at[1] < top && k < 400) {
			var wx = (noise.At(at[1] * 0.35, k * 0.0 + foot[0] * 3, 1.7) - 0.5) * wander;
			var wz = (noise.At(at[1] * 0.35, foot[2] * 3 + 5.1, 9.3) - 0.5) * wander;
			var d = [dir[0] + wx, dir[1], dir[2] + wz];
			var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

			at = [at[0] + d[0] / l * step, at[1] + d[1] / l * step, at[2] + d[2] / l * step];
			parent = this.Node(nodes, at.slice(), parent, {Trunk: true});

			k++;
		}

		return parent;
	},

	/*
	 * A tree of points drawing its buds (space colonization): its stems to the foot of its crown (its leader through it
	 * when Leader), then points scattered in its crown each draw its nearest bud within Reach a Step toward it, a point
	 * reached within Kill is used up; up toward the light by Up, the far ones bending down by Droop.
	 */
	Colonize: function (p, height, random, nodes) {
		var noise = this.$Service('Noise').Make({Type: 'simplex', Seed: p.Name + ':' + random(), Fractal: 'fbm', Octaves: 2});
		var step = p.Growth.Step * height;
		var reach = p.Growth.Reach * height;
		var kill = p.Growth.Kill * height;
		var foot = p.Trunk.Bare * height;
		var width = p.Crown.Width * height;
		var side = random() * Math.PI * 2;
		var tops = [];
		var points = [];
		var grid = {};
		var cell = reach;
		var s;
		var i;

		function key (at) {
			return Math.floor(at[0] / cell) + ':' + Math.floor(at[1] / cell) + ':' + Math.floor(at[2] / cell);
		}

		function put (index) {
			var k = key(nodes[index].P);

			(grid[k] = grid[k] || []).push(index);
		}

		/* Its stems: one, or a bush of several leaning out from its foot. */
		for (s = 0; s < Math.max(1, p.Trunk.Stems); s++) {
			var turn = side + s * 2.39996 + random() * 0.6;
			var out = p.Trunk.Stems > 1 ? p.Trunk.Lean * (0.6 + random() * 0.8) : p.Trunk.Lean * random();
			var base = p.Trunk.Stems > 1 ? [Math.cos(turn) * height * 0.03, 0, Math.sin(turn) * height * 0.03] : [0, 0, 0];

			tops.push(this.Stem(nodes, base, p.Trunk.Leader ? height * 0.93 : foot, step, [Math.cos(turn) * out, Math.sin(turn) * out], p.Trunk.Wander, random, noise));
		}

		/* The points of its crown: its profile round, lumpy by Clumps, leaning by Lean, kept to its outside by Hollow. */
		for (i = 0; i < p.Crown.Points; i++) {
			var t = Math.pow(random(), 0.85);
			var a = random() * Math.PI * 2;
			var lump = 1 + (noise.At(Math.cos(a) * 2, t * 3, Math.sin(a) * 2) - 0.5) * 2 * p.Crown.Clumps;
			var r = width * this.Profile(p.Crown.Profile, t) * (1 + p.Crown.Lean * Math.cos(a - side)) * Math.max(0.2, lump);
			var far = r * Math.pow(random(), p.Crown.Hollow);
			var y = foot + (height - foot) * t;

			points.push({P: [Math.cos(a) * far, y, Math.sin(a) * far], Alive: true});
		}

		for (i = 0; i < nodes.length; i++)
			put(i);

		/* Grown a step at a time while a point still draws a bud. */
		for (var round = 0; round < 260; round++) {
			var pulls = {};
			var any = false;

			points.forEach(function (point) {
				var best = -1;
				var nearest = reach;
				var cx;
				var cy;
				var cz;

				if (!point.Alive) return;

				cx = Math.floor(point.P[0] / cell);
				cy = Math.floor(point.P[1] / cell);
				cz = Math.floor(point.P[2] / cell);

				for (var dx = -1; dx <= 1; dx++) {
					for (var dy = -1; dy <= 1; dy++) {
						for (var dz = -1; dz <= 1; dz++) {
							(grid[(cx + dx) + ':' + (cy + dy) + ':' + (cz + dz)] || []).forEach(function (index) {
								var q = nodes[index].P;
								var d = Math.sqrt((q[0] - point.P[0]) * (q[0] - point.P[0]) + (q[1] - point.P[1]) * (q[1] - point.P[1]) + (q[2] - point.P[2]) * (q[2] - point.P[2]));

								if (d < nearest) {
									nearest = d;
									best = index;
								}
							});
						}
					}
				}

				if (best < 0) return;

				if (nearest < kill) {
					point.Alive = false;

					return;
				}

				var q = nodes[best].P;
				var pull = pulls[best] = pulls[best] || [0, 0, 0, 0];

				pull[0] += (point.P[0] - q[0]) / nearest;
				pull[1] += (point.P[1] - q[1]) / nearest;
				pull[2] += (point.P[2] - q[2]) / nearest;
				pull[3]++;
			});

			Object.keys(pulls).forEach(function (index) {
				var from = nodes[index];
				var pull = pulls[index];
				var out = Math.sqrt(from.P[0] * from.P[0] + from.P[2] * from.P[2]) / Math.max(1e-6, width);
				var d = [pull[0] / pull[3], pull[1] / pull[3] + p.Growth.Up - p.Growth.Droop * out, pull[2] / pull[3]];
				var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
				var at;
				var near;

				if (l < 1e-6) return;

				at = [from.P[0] + d[0] / l * step, from.P[1] + d[1] / l * step, from.P[2] + d[2] / l * step];

				/* Not twice the same way. */
				near = from.Kids.some(function (kid) {
					var q = nodes[kid].P;

					return (q[0] - at[0]) * (q[0] - at[0]) + (q[1] - at[1]) * (q[1] - at[1]) + (q[2] - at[2]) * (q[2] - at[2]) < step * step * 0.09;
				});

				if (near) return;

				put(this.Node(nodes, at, Number(index)));

				any = true;
			}, this);

			if (!any) break;
		}

		return {Tops: tops, Width: width, Foot: foot};
	},

	/*
	 * A spruce, a fir: its leader to the top, its branches in whorls a step of a few decimetres apart, as long as its
	 * profile there (a cone), sloping down by Droop and turning up at their tips, each with its side shoots by twos.
	 */
	Whorls: function (p, height, random, nodes) {
		var noise = this.$Service('Noise').Make({Type: 'simplex', Seed: p.Name + ':' + random(), Fractal: 'fbm', Octaves: 2});
		var step = p.Growth.Step * height;
		var foot = p.Trunk.Bare * height;
		var width = p.Crown.Width * height;
		var leader = [];
		var y;
		var i;

		this.Stem(nodes, [0, 0, 0], height, step, [p.Trunk.Lean * (random() - 0.5), p.Trunk.Lean * (random() - 0.5)], p.Trunk.Wander, random, noise);

		for (i = 0; i < nodes.length; i++)
			leader.push(i);

		for (y = foot; y < height * 0.96; y += height * (0.022 + random() * 0.012)) {
			var t = (y - foot) / (height - foot);
			var length = width * this.Profile(p.Crown.Profile, t) * (0.8 + random() * 0.4);
			var count = 4 + Math.floor(random() * 3);
			var twist = random() * Math.PI * 2;
			var at = leader.reduce(function (best, index) {
				return Math.abs(nodes[index].P[1] - y) < Math.abs(nodes[best].P[1] - y) ? index : best;
			}, leader[0]);
			var b;

			if (length < step) continue;

			for (b = 0; b < count; b++) {
				var a = twist + b / count * Math.PI * 2 + (random() - 0.5) * 0.5;
				var slope = -p.Growth.Droop * (1 - t * 0.7) + (random() - 0.5) * 0.15;

				this.Bough(nodes, at, [Math.cos(a), slope, Math.sin(a)], length, step, p.Growth.Up, random, 2);
			}
		}

		return {Tops: [leader[leader.length - 1]], Width: width, Foot: foot};
	},

	/* A branch of a whorl: steps along its way bending up toward its tip, side shoots by twos on its way (depth more levels). */
	Bough: function (nodes, from, way, length, step, up, random, depth) {
		var l = Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]);
		var d = [way[0] / l, way[1] / l, way[2] / l];
		var at = nodes[from].P.slice();
		var parent = from;
		var steps = Math.max(2, Math.round(length / step));
		var k;

		for (k = 0; k < steps; k++) {
			var bend = up * k / steps;
			var e = [d[0], d[1] + bend, d[2]];
			var el = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);

			at = [at[0] + e[0] / el * step, at[1] + e[1] / el * step, at[2] + e[2] / el * step];
			parent = this.Node(nodes, at.slice(), parent);

			if (depth > 1 && k > 0 && k < steps - 1 && random() < 0.75) {
				var sideways = [-d[2], 0, d[0]];
				var sign = k % 2 ? 1 : -1;

				this.Bough(nodes, parent, [d[0] * 0.6 + sideways[0] * sign, d[1] - 0.15, d[2] * 0.6 + sideways[2] * sign], (steps - k) * step * 0.45, step * 0.8, up * 0.5, random, depth - 1);
			}
		}
	},

	/* A palm: its trunk curving up (a bow and a lean), its fronds from its top arching out and down. */
	Palm: function (p, height, random, nodes) {
		var noise = this.$Service('Noise').Make({Type: 'simplex', Seed: p.Name + ':' + random(), Fractal: 'fbm', Octaves: 2});
		var turn = random() * Math.PI * 2;
		var lean = p.Trunk.Lean * (0.4 + random() * 0.8);
		var top = this.Stem(nodes, [0, 0, 0], height, p.Growth.Step * height, [Math.cos(turn) * lean, Math.sin(turn) * lean], p.Trunk.Wander, random, noise);

		return {Tops: [top], Width: p.Crown.Width * height, Foot: height, Fronds: Math.max(8, Math.round(p.Crown.Points * (0.8 + random() * 0.4)))};
	},

	/*
	 * Its nodes as meshes: smoothed, as thick as what they carry (Pipe), the trunk flared at its foot; each branch a tube
	 * (its main child going on, the others branches of their own) of as many sides as its thickness needs, its bark
	 * along it (u round it, v up the plant: the height of the plant where it starts and its length after); the twigs
	 * thinner than Cut times the thinnest are left to its leaves; dead stubs on its bare trunk; its leaves cards at its
	 * tips and twigs (a palm its fronds).
	 */
	Mesh: function (p, height, random, nodes, grown) {
		var bark = {Positions: [], Normals: [], UVs: [], Indices: []};
		var leaves = {Positions: [], Normals: [], UVs: [], Indices: []};
		var base = p.Trunk.Radius * height;
		var centre = [0, grown.Foot + (height - grown.Foot) * 0.5, 0];
		var count = nodes.length;
		var i;

		/* Smoothed twice: no zigzag of its steps (its foot and its forks stay). */
		for (var pass = 0; pass < 2; pass++) {
			var moved = nodes.map(function (node) {
				if (node.Parent < 0 || node.Kids.length !== 1) return node.P;

				var a = nodes[node.Parent].P;
				var b = nodes[node.Kids[0]].P;

				return [node.P[0] * 0.5 + (a[0] + b[0]) * 0.25, node.P[1] * 0.5 + (a[1] + b[1]) * 0.25, node.P[2] * 0.5 + (a[2] + b[2]) * 0.25];
			});

			nodes.forEach(function (node, index) {
				node.P = moved[index];
			});
		}

		/* As thick as the pipes of what they carry (children after their parents: from the last). */
		for (i = count - 1; i >= 0; i--) {
			var node = nodes[i];

			node.R = node.Kids.length ? Math.pow(node.Kids.reduce(function (sum, kid) {
				return sum + Math.pow(nodes[kid].R, p.Growth.Pipe);
			}, 0), 1 / p.Growth.Pipe) : 1;
		}

		var roots = nodes.filter(function (node) {
			return node.Parent < 0;
		});
		var widest = roots.reduce(function (most, node) {
			return Math.max(most, node.R);
		}, 1);
		var scale = base / widest;
		var thinnest = scale;

		nodes.forEach(function (node) {
			node.R *= scale;

			/* A palm: as thick all its height. */
			if (p.Grow === 'palm')
				node.R = base * (1 - node.P[1] / height * 0.25);

			/* Flared at the foot. */
			if (node.Trunk && node.P[1] < height * 0.08)
				node.R *= 1 + p.Trunk.Flare * Math.pow(1 - node.P[1] / (height * 0.08), 2);
		});

		/* Its dead stubs on its bare trunk: short, thin, out and a little down. */
		if (p.Trunk.Stubs > 0) {
			for (i = 0; i < count; i++) {
				var stem = nodes[i];
				if (!stem.Trunk || stem.P[1] < height * 0.12 || stem.P[1] > grown.Foot || random() > p.Trunk.Stubs * 0.35) continue;

				var a = random() * Math.PI * 2;
				var long = height * (0.02 + random() * 0.05);
				var tip = [stem.P[0] + Math.cos(a) * long, stem.P[1] + long * (random() - 0.6) * 0.5, stem.P[2] + Math.sin(a) * long];
				var stub = this.Node(nodes, tip, i, {Dead: true});

				nodes[stub].R = Math.max(thinnest * 0.6, stem.R * 0.06);

				nodes[i].Kids.pop();

				nodes[i].Stubs = (nodes[i].Stubs || []).concat([stub]);
			}
		}

		this.Tubes(nodes, bark, height, thinnest * p.Growth.Cut, p.Grow === 'palm', 9);

		if (p.Leaves.Kind === 'frond') this.Fronds(p, nodes[grown.Tops[0]], grown, height, random, leaves, 10);
		else this.Cards(p, nodes, thinnest * p.Growth.Cut * 1.6, centre, random, leaves, 1, 1);

		/*
		 * Its simpler levels, of the same branches (for what is far, SceneScatter): its branches thicker than four and ten
		 * times the cut, of 4 and 3 sides; its leaves fewer and larger cards on the same twigs (as much of them seen).
		 */
		var lods = [[4, 4, 0.22, 1.9], [10, 3, 0.07, 3.2]].map(function (level, index) {
			var simpler = {Positions: [], Normals: [], UVs: [], Indices: []};
			var cards = {Positions: [], Normals: [], UVs: [], Indices: []};
			var again = this.$Service('Random').Sequence(p.Name + ':level:' + index);

			this.Tubes(nodes, simpler, height, thinnest * p.Growth.Cut * level[0], p.Grow === 'palm', level[1], true);

			if (p.Leaves.Kind === 'frond') this.Fronds(p, nodes[grown.Tops[0]], grown, height, again, cards, index ? 3 : 5);
			else this.Cards(p, nodes, thinnest * p.Growth.Cut * 1.6, centre, again, cards, level[2], level[3]);

			return {Bark: this.Typed(simpler), Leaves: this.Typed(cards)};
		}, this);

		return {
			Name: p.Name,
			Height: height,
			Bark: this.Typed(bark),
			Leaves: this.Typed(leaves),
			Lods: lods,
			Triangles: (bark.Indices.length + leaves.Indices.length) / 3,
			Nodes: nodes.length
		};
	},

	Typed: function (geometry) {
		return {Positions: new Float32Array(geometry.Positions), Normals: new Float32Array(geometry.Normals), UVs: new Float32Array(geometry.UVs), Indices: geometry.Positions.length / 3 > 65535 ? new Uint32Array(geometry.Indices) : new Uint16Array(geometry.Indices)};
	},

	/* Its branches as tubes: each chain of its main children one tube, a frame carried along it (no twist). */
	/* sides: the most a tube has; bare: no dead stubs (a simpler level). */
	Tubes: function (nodes, out, height, cut, ringed, sides, bare) {
		var self = this;

		function chains (start) {
			var list = [];
			var chain = [start];
			var at = start;

			for (;;) {
				var node = nodes[at];
				var kids = node.Kids.slice().sort(function (x, y) {
					return nodes[y].R - nodes[x].R;
				});

				if (!bare)
					(node.Stubs || []).forEach(function (stub) {
						list.push([at, stub]);
					});

				if (!kids.length) break;

				kids.slice(1).forEach(function (kid) {
					if (nodes[kid].R >= cut)
						list = list.concat(chains(kid).map(function (one) {
							return one[0] === kid ? [at].concat(one) : one;
						}));
				});

				/* A trunk goes on however thin (a palm's is as thick all its height). */
				if (nodes[kids[0]].R < cut && !nodes[kids[0]].Trunk) break;

				chain.push(kids[0]);

				at = kids[0];
			}

			return [chain].concat(list);
		}

		nodes.forEach(function (node, index) {
			if (node.Parent >= 0) return;

			chains(index).forEach(function (chain) {
				if (chain.length > 1)
					self.Tube(nodes, chain, out, height, ringed, sides);
			});
		});
	},

	Tube: function (nodes, chain, out, height, ringed, most) {
		var start = out.Positions.length / 3;
		var widest = nodes[chain[1]].R;
		var sides = Math.max(3, Math.min(most || 12, Math.round(3 + widest / height * 500)));
		var normal = null;
		var v = nodes[chain[0]].P[1] / height;
		var k;
		var s;

		for (k = 0; k < chain.length; k++) {
			var node = nodes[chain[k]];
			var ahead = nodes[chain[Math.min(chain.length - 1, k + 1)]].P;
			var behind = nodes[chain[Math.max(0, k - 1)]].P;
			var d = [ahead[0] - behind[0], ahead[1] - behind[1], ahead[2] - behind[2]];
			var dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;
			/* The first ring of a branch as thick as it is, not as its parent. */
			var r = k === 0 ? nodes[chain[1]].R : k === chain.length - 1 && !nodes[chain[k]].Kids.length ? node.R * 0.4 : node.R;
			var binormal;

			d = [d[0] / dl, d[1] / dl, d[2] / dl];

			if (k > 0) {
				var q = nodes[chain[k - 1]].P;

				v += Math.sqrt((node.P[0] - q[0]) * (node.P[0] - q[0]) + (node.P[1] - q[1]) * (node.P[1] - q[1]) + (node.P[2] - q[2]) * (node.P[2] - q[2])) / height;
			}

			/* The frame carried along: its normal the last one made square to the way now. */
			if (!normal)
				normal = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];

			var dot = normal[0] * d[0] + normal[1] * d[1] + normal[2] * d[2];

			normal = [normal[0] - d[0] * dot, normal[1] - d[1] * dot, normal[2] - d[2] * dot];

			var nl = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]) || 1;

			normal = [normal[0] / nl, normal[1] / nl, normal[2] / nl];
			binormal = [d[1] * normal[2] - d[2] * normal[1], d[2] * normal[0] - d[0] * normal[2], d[0] * normal[1] - d[1] * normal[0]];

			/* A palm: the scars of its old leaves in rings. */
			if (ringed)
				r *= 1 + 0.06 * Math.pow(Math.abs(Math.sin(node.P[1] / height * 140)), 6);

			for (s = 0; s <= sides; s++) {
				var a = s / sides * Math.PI * 2;
				var n = [normal[0] * Math.cos(a) + binormal[0] * Math.sin(a), normal[1] * Math.cos(a) + binormal[1] * Math.sin(a), normal[2] * Math.cos(a) + binormal[2] * Math.sin(a)];

				out.Positions.push(node.P[0] + n[0] * r, node.P[1] + n[1] * r, node.P[2] + n[2] * r);
				out.Normals.push(n[0], n[1], n[2]);
				out.UVs.push(s / sides, v);
			}

			if (k > 0) {
				for (s = 0; s < sides; s++) {
					var a0 = start + (k - 1) * (sides + 1) + s;
					var b0 = start + k * (sides + 1) + s;

					out.Indices.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
				}
			}
		}
	},

	/*
	 * Its leaves: cards at its twigs (those thinner than twig) and tips, Each a twig, Size metres, along the twig and
	 * turned round it, one of the four of the atlas; their normals mostly those of the round of the crown (its middle
	 * out), so it is lit as a mass, not card by card.
	 */
	/* keep: the share of its cards made (larger by scale, as much of the crown covered). */
	Cards: function (p, nodes, twig, centre, random, output, keep, scale) {
		var size = p.Leaves.Size;
		/* How far its crown goes from its middle: the leaves this far out are in the light. */
		var reach = nodes.reduce(function (most, node) {
			return node.Kids.length ? most : Math.max(most, Math.sqrt((node.P[0] - centre[0]) * (node.P[0] - centre[0]) + (node.P[1] - centre[1]) * (node.P[1] - centre[1]) * 0.49 + (node.P[2] - centre[2]) * (node.P[2] - centre[2])));
		}, 0) * 0.8;

		nodes.forEach(function (node) {
			if (node.Dead || node.R > twig || node.Parent < 0) return;

			var tip = !node.Kids.length;
			var each = tip ? p.Leaves.Each : 1 + (random() < 0.5 ? 1 : 0);

			if (keep < 1)
				each = Math.floor(each * keep + random());

			var from = nodes[node.Parent].P;
			var d = [node.P[0] - from[0], node.P[1] - from[1], node.P[2] - from[2]];
			var dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;
			var c;

			d = [d[0] / dl, d[1] / dl, d[2] / dl];

			for (c = 0; c < each; c++) {
				var s = size * (0.75 + random() * 0.5) * (scale || 1);
				/* Along the twig, a little up or down, turned round it. */
				var way = [d[0] + (random() - 0.5) * 0.8, d[1] + (random() - 0.5) * 0.8 - (p.Leaves.Kind === 'needles' ? 0 : 0.25), d[2] + (random() - 0.5) * 0.8];
				var wl = Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]) || 1;
				var up = [way[0] / wl, way[1] / wl, way[2] / wl];
				var spin = random() * Math.PI * 2;
				var helper = Math.abs(up[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
				var across = [up[1] * helper[2] - up[2] * helper[1], up[2] * helper[0] - up[0] * helper[2], up[0] * helper[1] - up[1] * helper[0]];
				var al = Math.sqrt(across[0] * across[0] + across[1] * across[1] + across[2] * across[2]) || 1;
				var third;
				var out;
				var face;
				var round;
				var rl;
				var n;
				var tile = Math.floor(random() * 4);
				var u0 = tile % 2 * 0.5;
				var v0 = Math.floor(tile / 2) * 0.25;
				var start = output.Positions.length / 3;
				var corners = [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]];

				across = [across[0] / al, across[1] / al, across[2] / al];
				third = [up[1] * across[2] - up[2] * across[1], up[2] * across[0] - up[0] * across[2], up[0] * across[1] - up[1] * across[0]];
				face = [across[0] * Math.cos(spin) + third[0] * Math.sin(spin), across[1] * Math.cos(spin) + third[1] * Math.sin(spin), across[2] * Math.cos(spin) + third[2] * Math.sin(spin)];
				round = [node.P[0] - centre[0], (node.P[1] - centre[1]) * 0.7, node.P[2] - centre[2]];
				rl = Math.sqrt(round[0] * round[0] + round[1] * round[1] + round[2] * round[2]) || 1;
				/*
				 * Deep in the crown its leaves are in the shade of the others: their normals turned down, as far as they are in
				 * (out: 1 at its outside), so the sun and the sky light them less (no color of corners in a material of a file).
				 */
				out = Math.min(1, rl / Math.max(1e-6, reach));
				n = [round[0] / rl * 0.75 + up[0] * 0.1, round[1] / rl * 0.75 + 0.25, round[2] / rl * 0.75 + up[2] * 0.1];

				/* The deeper in, the likelier of the darker half of the atlas (a normal turned down is turned back up to the eye). */
				if (random() > out * out)
					v0 += 0.5;

				rl = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
				n = [n[0] / rl, n[1] / rl, n[2] / rl];

				corners.forEach(function (corner) {
					var x = corner[0] * s;
					var y = (corner[1] - 0.15) * s;

					output.Positions.push(node.P[0] + face[0] * x + up[0] * y, node.P[1] + face[1] * x + up[1] * y, node.P[2] + face[2] * x + up[2] * y);
					output.Normals.push(n[0], n[1], n[2]);
					output.UVs.push(u0 + (corner[0] + 0.5) * 0.5, v0 + corner[1] * 0.25);
				});

				output.Indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
			}
		});
	},

	/* The fronds of a palm: from its top, arching out and drooping, each a strip folded down its rib (a V), the frond of the atlas along it. */
	/* segments: along each frond (fewer for a simpler level). */
	Fronds: function (p, top, grown, height, random, out, segments) {
		var count = grown.Fronds;
		var f;

		for (f = 0; f < count; f++) {
			var a = f * 2.39996 + random() * 0.4;
			var rise = 0.9 - f / count * 1.4 + (random() - 0.5) * 0.3;
			var length = p.Leaves.Size * (0.75 + random() * 0.45) * (f < count * 0.25 ? 0.7 : 1);
			var d = [Math.cos(a) * Math.cos(Math.atan(rise)), Math.sin(Math.atan(rise)), Math.sin(a) * Math.cos(Math.atan(rise))];
			var side = [-Math.sin(a), 0, Math.cos(a)];
			var at = top.P.slice();
			var start = out.Positions.length / 3;
			var k;
			var tile = Math.floor(random() * 4);
			var u0 = tile % 2 * 0.5;
			var v0 = Math.floor(tile / 2) * 0.25;

			for (k = 0; k <= segments; k++) {
				var t = k / segments;
				var half = length * 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08));
				var fold = half * 0.35;
				var n = [d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0]];
				if (n[1] < 0)
					n = [-n[0], -n[1], -n[2]];

				[[-1, 0], [0, 1], [1, 2]].forEach(function (corner) {
					var off = corner[0];

					out.Positions.push(at[0] + side[0] * half * off, at[1] - fold * Math.abs(off), at[2] + side[2] * half * off);
					out.Normals.push(n[0] * 0.7 + side[0] * off * 0.3, n[1] * 0.7 + 0.3, n[2] * 0.7 + side[2] * off * 0.3);
					out.UVs.push(u0 + (off + 1) * 0.25, v0 + t * 0.25);
				});

				if (k > 0) {
					var a0 = start + (k - 1) * 3;
					var b0 = start + k * 3;

					out.Indices.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1, a0 + 1, b0 + 1, a0 + 2, a0 + 2, b0 + 1, b0 + 2);
				}

				at = [at[0] + d[0] * length / segments, at[1] + d[1] * length / segments, at[2] + d[2] * length / segments];
				/* Drooping more the farther out. */
				d = [d[0], d[1] - p.Growth.Droop * 0.22, d[2]];

				var dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

				d = [d[0] / dl, d[1] / dl, d[2] / dl];
			}
		}
	},

	/*
	 * Its pictures: its bark (Width 256, Height 1024: round its trunk and up the plant; its colors from Low below to High
	 * from Split up, its pattern; its relief as a normal map) and its leaves (an atlas of four clusters, 512 by 1024: the
	 * four in the light above, in the shade below).
	 */
	Textures: function (preset) {
		var p = this.Preset(preset);
		var bark = p.Bark.Image ? {Picture: p.Bark.Image, Normal: this.Flat(p.Bark.Image.Width, p.Bark.Image.Height)} : this.BarkPicture(p);

		return {Bark: bark.Picture, BarkNormal: bark.Normal, Leaves: p.Leaves.Image || this.LeafPicture(p)};
	},

	/* A normal map of nothing: what the bark of its own picture has. */
	Flat: function (width, height) {
		var data = new Uint8Array(width * height * 4);
		var i;

		for (i = 0; i < width * height; i++) {
			data[i * 4] = 128;
			data[i * 4 + 1] = 128;
			data[i * 4 + 2] = 255;
			data[i * 4 + 3] = 255;
		}

		return {Width: width, Height: height, Data: data};
	},

	BarkPicture: function (p) {
		var width = 256;
		var height = 1024;
		var noise = this.$Service('Noise');
		var fine = noise.Make({Type: 'simplex', Seed: p.Name + ':bark', Fractal: 'fbm', Octaves: 4});
		var cells = noise.Make({Type: 'worley', Seed: p.Name + ':plates', Cell: {Return: 'edge', Jitter: 0.9}});
		var bumps = new Float32Array(width * height);
		var data = new Uint8Array(width * height * 4);
		var normal = new Uint8Array(width * height * 4);
		var pattern = p.Bark.Pattern;
		var x;
		var y;

		function smooth (a, b, v) {
			var t = Math.max(0, Math.min(1, (v - a) / (b - a)));

			return t * t * (3 - 2 * t);
		}

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				/* Round the trunk: seamless along u (a circle of the noise), up the plant along v. */
				var a = x / width * Math.PI * 2;
				var cx = Math.cos(a);
				var cz = Math.sin(a);
				var t = y / height;
				var n = fine.At(cx * 3, t * 40, cz * 3);
				var high = smooth(p.Bark.Split - 0.08, p.Bark.Split + 0.08, t + (n - 0.5) * 0.12);
				var color = [p.Bark.Low[0] + (p.Bark.High[0] - p.Bark.Low[0]) * high, p.Bark.Low[1] + (p.Bark.High[1] - p.Bark.Low[1]) * high, p.Bark.Low[2] + (p.Bark.High[2] - p.Bark.Low[2]) * high];
				var bump = n;
				var shade = 1;

				if (pattern === 'plates') {
					/* Plates between deep cracks below; thin flakes peeling above. */
					var edge = cells.At(cx * 2.2, t * 34, cz * 2.2);
					var crack = 1 - smooth(0.02, 0.12, edge);

					bump = (1 - crack) * (0.6 + n * 0.4) * (1 - high * 0.7) + high * n * 0.5;
					shade = 1 - crack * 0.55 * (1 - high * 0.8) + (n - 0.5) * 0.25;
				}
				else if (pattern === 'birch') {
					/* White, dashes of black across it, black fissured at its foot. */
					var dash = fine.At(cx * 9, t * 900, cz * 9);
					var lenticel = smooth(0.72, 0.8, dash) * smooth(0.4, 0.6, fine.At(cx * 2, t * 60, cz * 2));
					var foot = 1 - smooth(0.04, 0.14, t + (n - 0.5) * 0.06);
					var crack2 = 1 - smooth(0.03, 0.1, cells.At(cx * 2, t * 30, cz * 2));

					color = [p.Bark.High[0], p.Bark.High[1], p.Bark.High[2]];
					color = color.map(function (part, index) {
						var black = p.Bark.Low[index];
						var dark = Math.max(lenticel * 0.9, foot * (0.55 + crack2 * 0.4));

						return part + (black - part) * dark;
					});
					bump = 0.5 + (n - 0.5) * 0.3 - lenticel * 0.2 + foot * (1 - crack2) * 0.4;
					shade = 1 + (n - 0.5) * 0.12;
				}
				else if (pattern === 'ridges') {
					/* Deep ridges up the trunk, wandering and joining. */
					var ridge = Math.abs(fine.At(cx * 6, t * 22, cz * 6) - 0.5) * 2;

					bump = 1 - Math.pow(ridge, 0.6);
					shade = 0.7 + bump * 0.45 + (n - 0.5) * 0.2;
				}
				else if (pattern === 'rings') {
					/* The rings of the scars of old leaves. */
					var ring = Math.pow(Math.abs(Math.sin(t * 140 * Math.PI + (n - 0.5) * 2)), 4);

					bump = 1 - ring * 0.7 + (n - 0.5) * 0.3;
					shade = 0.8 + bump * 0.25;
				}
				else {
					shade = 0.9 + (n - 0.5) * 0.3;
				}

				var o = (y * width + x) * 4;

				bumps[y * width + x] = bump;
				data[o] = Math.round(Math.max(0, Math.min(1, color[0] * shade)) * 255);
				data[o + 1] = Math.round(Math.max(0, Math.min(1, color[1] * shade)) * 255);
				data[o + 2] = Math.round(Math.max(0, Math.min(1, color[2] * shade)) * 255);
				data[o + 3] = 255;
			}
		}

		/* Its relief: the slopes of its bumps (round its trunk wrapped), as a normal map of tangent space. */
		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				var dx = bumps[y * width + (x + 1) % width] - bumps[y * width + (x + width - 1) % width];
				var dy = bumps[Math.min(height - 1, y + 1) * width + x] - bumps[Math.max(0, y - 1) * width + x];
				var nx = -dx * 2.5;
				var ny = -dy * 2.5;
				var l = Math.sqrt(nx * nx + ny * ny + 1);
				var q = (y * width + x) * 4;

				normal[q] = Math.round((nx / l * 0.5 + 0.5) * 255);
				normal[q + 1] = Math.round((ny / l * 0.5 + 0.5) * 255);
				normal[q + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
				normal[q + 3] = 255;
			}
		}

		/* Its mean color (0 to 1): what a far copy of the plant is painted (SceneModels.Painted). */
		var mean = [0, 0, 0];

		for (x = 0; x < width * height; x += 7) {
			mean[0] += data[x * 4] / 255;
			mean[1] += data[x * 4 + 1] / 255;
			mean[2] += data[x * 4 + 2] / 255;
		}

		mean = mean.map(function (part) {
			return part / Math.ceil(width * height / 7);
		});

		return {Picture: {Width: width, Height: height, Data: data, Mean: mean}, Normal: {Width: width, Height: height, Data: normal}};
	},

	/*
	 * Its leaves: four clusters in an atlas, each a twig from the foot of its tile up with its leaves (broad: ovals with
	 * a darker rib, lighter where they face up; needles: fans of thin lines; a frond: a rib with leaflets each side),
	 * their colors between Shade and Light; where there is no leaf its color is the leaves' mean (no dark rims in its
	 * smaller levels), its alpha 0.
	 */
	LeafPicture: function (p) {
		var size = 512;
		var tall = 1024;
		var tile = 256;
		var data = new Uint8Array(size * tall * 4);
		var random = this.$Service('Random').Sequence(p.Name + ':leaves');
		var kind = p.Leaves.Kind;
		var mean = [0, 0, 0, 0];
		var t;

		function mix (a, b, k) {
			return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
		}

		function line (px, py, ax, ay, bx, by) {
			var abx = bx - ax;
			var aby = by - ay;
			var k = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1)));
			var qx = ax + abx * k - px;
			var qy = ay + aby * k - py;

			return {Far: Math.sqrt(qx * qx + qy * qy), Along: k};
		}

		for (t = 0; t < 4; t++) {
			var ox = t % 2 * tile;
			var oy = Math.floor(t / 2) * tile;
			var parts = [];
			var stem = {A: [0.5 + (random() - 0.5) * 0.1, 0.02], B: [0.5 + (random() - 0.5) * 0.2, 0.9]};
			var k;
			var x;
			var y;

			/*
			 * A spray: its twig up the tile and side twigs off it (a frond: a rib up its middle), its leaves along all of them,
			 * overlapping as on a branch (broad: ovals; needles: a bottle brush of thin lines); about half the tile covered.
			 */
			var twigs = [stem];

			if (kind !== 'frond') {
				for (k = 0; k < 4; k++) {
					var on = 0.18 + k * 0.17 + random() * 0.05;
					var from = [stem.A[0] + (stem.B[0] - stem.A[0]) * on, stem.A[1] + (stem.B[1] - stem.A[1]) * on];
					var turn = (k % 2 ? 1 : -1) * (0.55 + random() * 0.35);
					var reach = 0.2 + random() * 0.14;

					twigs.push({A: from, B: [Math.max(0.06, Math.min(0.94, from[0] + Math.sin(turn) * reach)), Math.min(0.96, from[1] + Math.cos(turn) * reach)]});
				}
			}

			if (kind === 'needles') {
				twigs.forEach(function (twig, index) {
					var dx = twig.B[0] - twig.A[0];
					var dy = twig.B[1] - twig.A[1];
					var dl = Math.sqrt(dx * dx + dy * dy) || 1;
					var count = index ? 55 : 120;
					var n;

					for (n = 0; n < count; n++) {
						var along = 0.04 + random() * 0.96;
						var bx = twig.A[0] + dx * along;
						var by = twig.A[1] + dy * along;
						var a = Math.atan2(dx / dl, dy / dl) + (random() < 0.5 ? -1 : 1) * (0.55 + random() * 0.55);
						var long = (0.08 + random() * 0.07) * (1 - along * 0.35);

						parts.push({Kind: 'needle', A: [bx, by], B: [bx + Math.sin(a) * long, by + Math.cos(a) * long], Width: 0.0042, Tone: random()});
					}
				});
			}
			else if (kind === 'frond') {
				for (k = 0; k < 46; k++) {
					var f = 0.04 + k / 46 * 0.92;
					var sideA = k % 2 ? 1 : -1;
					var len = 0.42 * Math.sin(Math.PI * Math.min(1, f * 1.1 + 0.05)) + 0.04;

					parts.push({Kind: 'needle', A: [0.5, f], B: [0.5 + sideA * len, f + len * 0.35], Width: 0.016 + 0.01 * random(), Tone: random()});
				}

				stem = {A: [0.5, 0], B: [0.5, 1]};
				twigs = [stem];
			}
			else {
				twigs.forEach(function (twig) {
					var dx = twig.B[0] - twig.A[0];
					var dy = twig.B[1] - twig.A[1];
					var dl = Math.sqrt(dx * dx + dy * dy) || 1;
					var count = Math.max(3, Math.round(dl / 0.055));
					var n;

					for (n = 1; n <= count; n++) {
						var along = n / count;
						var sx = twig.A[0] + dx * along;
						var sy = twig.A[1] + dy * along;
						var a = Math.atan2(dx / dl, dy / dl) + (n === count ? 0 : (n % 2 ? 1 : -1) * (0.6 + random() * 0.45));
						var leaf = 0.12 + random() * 0.07;

						parts.push({Kind: 'leaf', A: [sx, sy], B: [sx + Math.sin(a) * leaf, sy + Math.cos(a) * leaf], Width: leaf * 0.24, Tone: random()});
					}
				});
			}

			/* Each part a box round it: a pixel tests only those near it. */
			parts.forEach(function (part) {
				part.Box = [Math.min(part.A[0], part.B[0]) - part.Width, Math.min(part.A[1], part.B[1]) - part.Width, Math.max(part.A[0], part.B[0]) + part.Width, Math.max(part.A[1], part.B[1]) + part.Width];
			});

			for (y = 0; y < tile; y++) {
				for (x = 0; x < tile; x++) {
					var u = (x + 0.5) / tile;
					var v = (y + 0.5) / tile;
					var cover = 0;
					var color = null;
					var o = ((oy + y) * size + ox + x) * 4;
					var twig = twigs.reduce(function (best, one, index) {
						var hit = line(u, v, one.A[0], one.A[1], one.B[0], one.B[1]);

						return Math.min(best, hit.Far / (index ? 0.7 : 1));
					}, Infinity);

					parts.forEach(function (part) {
						if (u < part.Box[0] || u > part.Box[2] || v < part.Box[1] || v > part.Box[3]) return;

						var hit = line(u, v, part.A[0], part.A[1], part.B[0], part.B[1]);
						var width = part.Kind === 'leaf' ? part.Width * Math.sin(Math.PI * Math.min(1, hit.Along * 0.95 + 0.05)) : part.Width * (1 - hit.Along * 0.5);
						var inside = Math.max(0, Math.min(1, (width - hit.Far) * tile * 0.7 + 0.5));
						if (inside <= cover) return;

						var light = (1 - hit.Far / Math.max(1e-4, width)) * 0.6 + part.Tone * 0.4;
						var tone = mix(p.Leaves.Shade, p.Leaves.Light, Math.max(0, Math.min(1, light)));

						/* A darker rib down a broad leaf. */
						if (part.Kind === 'leaf' && hit.Far < width * 0.12)
							tone = mix(tone, p.Leaves.Shade, 0.5);

						cover = inside;
						color = mix(p.Leaves.Color, tone, 0.7);
					});

					/* The twig itself, brown. */
					if (kind !== 'frond' && twig < 0.007) {
						cover = 1;
						color = [0.3, 0.24, 0.18];
					}
					else if (kind === 'frond' && Math.abs(u - 0.5) < 0.012) {
						cover = 1;
						color = mix(p.Leaves.Color, [0.55, 0.5, 0.3], 0.4);
					}

					if (color) {
						data[o] = Math.round(color[0] * 255);
						data[o + 1] = Math.round(color[1] * 255);
						data[o + 2] = Math.round(color[2] * 255);
						mean[0] += color[0] * cover;
						mean[1] += color[1] * cover;
						mean[2] += color[2] * cover;
						mean[3] += cover;
					}

					data[o + 3] = Math.round(cover * 255);
				}
			}
		}

		/* Where there is no leaf, the color of the leaves (alpha 0): no dark rims as it is made smaller. */
		mean = [mean[0] / Math.max(1, mean[3]), mean[1] / Math.max(1, mean[3]), mean[2] / Math.max(1, mean[3])];

		for (t = 0; t < size * size; t++) {
			if (data[t * 4 + 3] < 8) {
				data[t * 4] = Math.round(mean[0] * 255);
				data[t * 4 + 1] = Math.round(mean[1] * 255);
				data[t * 4 + 2] = Math.round(mean[2] * 255);
			}
		}

		/* Its lower half the same clusters in the shade of a crown: what its leaves deep in are cut of. */
		for (t = 0; t < size * size; t++) {
			var q = (size * size + t) * 4;

			data[q] = Math.round(data[t * 4] * 0.45);
			data[q + 1] = Math.round(data[t * 4 + 1] * 0.5);
			data[q + 2] = Math.round(data[t * 4 + 2] * 0.45);
			data[q + 3] = data[t * 4 + 3];
		}

		return {Width: size, Height: tall, Data: data, Mean: [mean[0] * 0.75, mean[1] * 0.78, mean[2] * 0.75]};
	},

	/*
	 * A plant as Gltf gives a file: one node, its mesh of two primitives (its bark; its leaves cut by their alpha, seen
	 * from both sides), their materials and the pictures (shared: a species draws them once).
	 */
	Asset: function (tree, textures) {
		function map (image, scale) {
			return {Image: image, Sampler: null, Set: 0, Offset: [0, 0], Repeat: [1, 1], Scale: scale === undefined ? 1 : scale, Strength: 1};
		}

		function material (name, color, rough, cut) {
			return {Name: name, BaseColor: [1, 1, 1, 1], Metallic: 0, Roughness: rough, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: map(color), MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: cut ? 'MASK' : 'OPAQUE', Cutoff: 0.45, DoubleSided: !!cut, Unlit: false, Specular: cut ? 0.25 : 0.3, SpecularColor: [1, 1, 1], SpecularMap: null};
		}

		function image (picture) {
			return {Data: null, Type: '', URI: '', Picture: picture, Mean: picture.Mean || null};
		}

		var bark = material('Bark', 0, 0.9, false);
		var leaves = material('Leaves', 2, 0.85, true);
		var images = [image(textures.Bark), image(textures.BarkNormal), image(textures.Leaves)];

		function primitives (made) {
			return [{Geometry: Object.assign({Colors: null}, made.Bark), Material: 0}, {Geometry: Object.assign({Colors: null}, made.Leaves), Material: 1}].filter(function (primitive) {
				return primitive.Geometry.Positions.length > 0;
			});
		}

		bark.NormalMap = map(1, 1);

		return {
			Nodes: [{Name: tree.Name || 'Plant', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}],
			Meshes: [primitives(tree)],
			/* Its simpler levels, primitives as its mesh's (in the space of its node): what SceneScatter draws farther. */
			Lods: (tree.Lods || []).map(primitives),
			/*
			 * How many times nearer its levels come than those of a thing as large (SceneScatter): one for each 1500 triangles
			 * of it near, 1 to 16 (an oak of 29 000 drawn whole to some 25 m, a bush to 6).
			 */
			Detail: Math.max(1, Math.min(16, tree.Triangles / 1500)),
			Materials: [bark, leaves],
			Images: images,
			Skins: [],
			Animations: [],
			Lights: [],
			Scene: [0]
		};
	},

	/*
	 * A species of a picture of a plant (a photograph on white or clear: its reference), from a preset to start of (base,
	 * the oak by default): {Preset (base with what the picture tells: its bare trunk, the profile of its crown, how wide,
	 * leaning and lumpy it is, the colors of its leaves and of its bark), Found {Box [x0, y0, x1, y1] (pixels of the plant:
	 * the largest of several), Foot (the row where its crown begins), Trunk (its column at its foot), Rows: [[row, left,
	 * right]...] (of its crown, every few rows), Holes (0 to 1, the sky through its crown)}}; null when no plant is found.
	 * picture {Width, Height, Data (RGBA)}.
	 */
	FromPicture: function (picture, base) {
		var width = picture.Width;
		var height = picture.Height;
		var data = picture.Data;
		var preset = this.Preset(base || 'oak');
		var background = [0, 0, 0];
		var mask = new Uint8Array(width * height);
		var columns = new Array(width).fill(0);
		var x;
		var y;
		var k;

		function at (px, py) {
			return (py * width + px) * 4;
		}

		function mean (list) {
			var sum = [0, 0, 0];

			list.forEach(function (color) {
				sum[0] += color[0];
				sum[1] += color[1];
				sum[2] += color[2];
			});

			return sum.map(function (part) {
				return Math.round(part / Math.max(1, list.length) / 255 * 1000) / 1000;
			});
		}

		/* Its background: the mean of its corners; a pixel of the plant is not clear and other than it. */
		[[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]].forEach(function (corner) {
			var o = at(corner[0], corner[1]);

			background[0] += data[o] / 4;
			background[1] += data[o + 1] / 4;
			background[2] += data[o + 2] / 4;
		});

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				var o = at(x, y);
				var far = Math.abs(data[o] - background[0]) + Math.abs(data[o + 1] - background[1]) + Math.abs(data[o + 2] - background[2]);

				if (data[o + 3] > 128 && far > 60) {
					mask[y * width + x] = 1;
					columns[x]++;
				}
			}
		}

		/*
		 * The plants side by side (a row of them, their crowns meeting): their trunks at the foot of all of them, each plant
		 * the columns nearer its trunk than the next one's; the plant is the one of most pixels.
		 */
		var lowest = -1;
		var highest = height;

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				if (!mask[y * width + x]) continue;

				lowest = Math.max(lowest, y);
				highest = Math.min(highest, y);
			}
		}

		if (lowest < 0) return null;

		var feet = [];
		var footing = new Array(width).fill(0);

		for (y = Math.max(highest, Math.round(lowest - (lowest - highest) * 0.08)); y <= lowest; y++) {
			for (x = 0; x < width; x++)
				footing[x] += mask[y * width + x];
		}

		for (x = 0; x < width; x++) {
			if (!footing[x]) continue;

			if (!feet.length || feet[feet.length - 1].To < x - Math.max(2, width * 0.01)) feet.push({From: x, To: x});
			else feet[feet.length - 1].To = x;
		}

		if (!feet.length)
			feet.push({From: 0, To: width - 1});

		/*
		 * Only what stands on its foot as thick as a trunk and goes up from it (a tenth of the height and more): no text by
		 * it (a mark of the picture), nor the tips of hanging leaves that touch the ground.
		 */
		feet.forEach(function (one) {
			/* Its thickest column (a trunk and a figure by it are one foot: not the gap between them). */
			var middle = one.From;
			var row;

			one.Weight = 0;

			for (var c = one.From; c <= one.To; c++) {
				one.Weight += footing[c];

				if (footing[c] > footing[middle])
					middle = c;
			}

			for (row = lowest; row >= highest; row--) {
				var any = false;

				for (var d = Math.max(0, middle - 2); d <= Math.min(width - 1, middle + 2) && !any; d++)
					any = !!mask[row * width + d];

				if (!any) break;
			}

			one.Column = middle;

			if (lowest - row < (lowest - highest) * 0.12)
				one.Weight = 0;
		});

		var heaviest = feet.reduce(function (most, one) {
			return Math.max(most, one.Weight);
		}, 0);

		feet = feet.filter(function (one) {
			return one.Weight >= heaviest * 0.12;
		});

		feet.forEach(function (one, index) {
			var middle = (one.From + one.To) / 2;
			var before = index ? (feet[index - 1].From + feet[index - 1].To) / 2 : -Infinity;
			var after = index < feet.length - 1 ? (feet[index + 1].From + feet[index + 1].To) / 2 : Infinity;

			one.From = Math.max(0, Math.ceil((before + middle) / 2));
			one.To = Math.min(width - 1, Math.floor((middle + after) / 2));
			one.Count = 0;

			for (var c = one.From; c <= one.To; c++)
				one.Count += columns[c];
		});

		var run = feet.reduce(function (best, one) {
			return one.Count > best.Count ? one : best;
		});
		var top = height;
		var bottom = -1;
		var rows = [];
		/*
		 * The plant itself: what is joined to its trunk in its columns (its crown by its branches), not a mark of the picture
		 * nor grass beside it.
		 */
		var plant = new Uint8Array(width * height);
		var seed = run.Column === undefined ? Math.round((run.From + run.To) / 2) : run.Column;
		var stack = [];
		var start = lowest;

		while (start > highest && !mask[start * width + seed])
			start--;

		stack.push(start * width + seed);

		while (stack.length) {
			var cell = stack.pop();
			var cx = cell % width;
			var cy = (cell - cx) / width;

			if (plant[cell] || !mask[cell] || cx < run.From || cx > run.To) continue;

			plant[cell] = 1;

			/* Its eight neighbours: a thin twig of a picture is joined by its corners. */
			for (var dy = -1; dy <= 1; dy++) {
				for (var dx = -1; dx <= 1; dx++) {
					if ((dx || dy) && cx + dx >= 0 && cx + dx < width && cy + dy >= 0 && cy + dy < height)
						stack.push(cell + dy * width + dx);
				}
			}
		}

		mask = plant;

		for (y = 0; y < height; y++) {
			var left = -1;
			var right = -1;

			for (x = run.From; x <= run.To; x++) {
				if (!mask[y * width + x]) continue;

				if (left < 0)
					left = x;

				right = x;
			}

			rows.push(left < 0 ? null : [left, right]);

			if (left >= 0) {
				top = Math.min(top, y);
				bottom = Math.max(bottom, y);
			}
		}

		var tall = bottom - top + 1;
		if (tall < 8) return null;

		/* Its widest row; its crown begins (from below) where a row is a quarter as wide as that. */
		var widest = 0;

		for (y = top; y <= bottom; y++) {
			if (rows[y])
				widest = Math.max(widest, rows[y][1] - rows[y][0] + 1);
		}

		/* Wide as a crown for a band of rows (a twentieth of its height and more): no text nor grass at its foot taken for it. */
		var foot = top;
		var band = Math.max(2, Math.round(tall * 0.06));

		function wide (row) {
			return rows[row] && rows[row][1] - rows[row][0] + 1 > widest * 0.25;
		}

		for (y = bottom; y >= top; y--) {
			var all = true;

			for (k = 0; k < band && all; k++)
				all = y - k < top || wide(y - k);

			if (all) {
				foot = y;

				break;
			}
		}

		/* Its trunk at its foot: the middle of its lowest rows. */
		var trunk = 0;
		var counted = 0;

		for (y = bottom; y > bottom - Math.max(2, tall * 0.04); y--) {
			if (!rows[y]) continue;

			trunk += (rows[y][0] + rows[y][1]) / 2;
			counted++;
		}

		trunk = counted ? trunk / counted : (run.From + run.To) / 2;

		/* The profile of its crown: its half width round its trunk, in nine steps from its foot to its top, each the most of a band. */
		var half = Math.max(1, widest / 2);
		var profile = [];
		var crown = foot - top + 1;
		var found = [];
		var holes = 0;
		var inside = 0;
		var middle = 0;
		var weight = 0;

		for (k = 0; k <= 8; k++) {
			var from = Math.round(foot - crown * Math.max(0, k - 0.5) / 8);
			var to = Math.round(foot - crown * Math.min(8, k + 0.5) / 8);
			var most = 0;

			for (y = Math.max(top, to); y <= Math.min(foot, from); y++) {
				if (rows[y])
					most = Math.max(most, Math.max(trunk - rows[y][0], rows[y][1] - trunk));
			}

			profile.push([Math.round(k / 8 * 1000) / 1000, Math.round(Math.min(1, most / half) * 1000) / 1000]);
		}

		/* The colors of its leaves (its crown, by how light: the darkest fifth its shade, the lightest its light) and the holes in it. */
		var leaves = [];

		for (y = top; y <= foot; y++) {
			if (!rows[y]) continue;

			if ((y - top) % Math.max(1, Math.round(crown / 24)) === 0)
				found.push([y, rows[y][0], rows[y][1]]);

			for (x = rows[y][0]; x <= rows[y][1]; x++) {
				inside++;

				if (!mask[y * width + x]) {
					holes++;

					continue;
				}

				var q = at(x, y);

				leaves.push([data[q], data[q + 1], data[q + 2], data[q] * 0.3 + data[q + 1] * 0.59 + data[q + 2] * 0.11]);

				middle += x;
				weight++;
			}
		}

		leaves.sort(function (a, b) {
			return a[3] - b[3];
		});

		/* The colors of its bark: its bare trunk below its crown, the lower third and the upper. */
		var low = [];
		var high = [];

		for (y = foot + 1; y <= bottom; y++) {
			if (!rows[y]) continue;

			for (x = rows[y][0]; x <= rows[y][1]; x++) {
				if (!mask[y * width + x]) continue;

				var b = at(x, y);

				(y > bottom - (bottom - foot) / 3 ? low : high).push([data[b], data[b + 1], data[b + 2]]);
			}
		}

		var fifth = Math.max(1, Math.floor(leaves.length / 5));
		var made = this.Preset(preset);

		made.Trunk.Bare = Math.round(Math.max(0.03, Math.min(0.9, (bottom - foot) / tall)) * 1000) / 1000;
		made.Trunk.Lean = Math.round(Math.max(-0.3, Math.min(0.3, ((weight ? middle / weight : trunk) - trunk) / tall)) * 1000) / 1000;
		made.Crown.Profile = profile;
		made.Crown.Width = Math.round(Math.max(0.05, Math.min(0.8, half / tall)) * 1000) / 1000;
		/* The sky through its crown: lumpy and open (a pine of tufts), or a dense round (a linden). */
		made.Crown.Clumps = Math.round(Math.max(0.1, Math.min(0.8, holes / Math.max(1, inside) * 1.6)) * 1000) / 1000;
		made.Crown.Hollow = Math.round(Math.max(0.25, Math.min(0.6, 0.6 - holes / Math.max(1, inside) * 0.5)) * 1000) / 1000;

		if (leaves.length > 20) {
			made.Leaves.Shade = mean(leaves.slice(0, fifth));
			made.Leaves.Light = mean(leaves.slice(-fifth));
			made.Leaves.Color = mean(leaves.slice(fifth * 2, fifth * 3));
		}

		if (low.length > 4)
			made.Bark.Low = mean(low);

		if (high.length > 4)
			made.Bark.High = mean(high);

		return {Preset: made, Found: {Box: [run.From, top, run.To, bottom], Foot: foot, Trunk: Math.round(trunk), Rows: found, Holes: Math.round(holes / Math.max(1, inside) * 1000) / 1000}};
	},

	/* The key a species is kept under (SceneCache): its preset, its variants, a sum of the code that grows it. */
	Key: function (preset, variants) {
		var self = this;
		var text;
		var sum = 0;
		var i;

		if (this.Code === undefined) {
			this.Code = 0;

			text = Object.keys(this).filter(function (name) {
				return typeof self[name] === 'function';
			}).sort().map(function (name) {
				return String(self[name]);
			}).join('\n');

			for (i = 0; i < text.length; i++)
				this.Code = (this.Code * 31 + text.charCodeAt(i)) >>> 0;
		}

		text = JSON.stringify(preset);

		for (i = 0; i < text.length; i++)
			sum = (sum * 31 + text.charCodeAt(i)) >>> 0;

		return preset.Name + ':' + variants + ':' + this.Code.toString(36) + ':' + sum.toString(36);
	},

	/*
	 * A species as a model of SceneModels: its Variants (8) made in workers the first time one is asked for (or taken as
	 * they were kept in the browser, SceneCache), its pictures once for all of them. Gives the name.
	 */
	Define: function (name, preset, options) {
		var self = this;
		var given = options || {};
		var p = this.Preset(preset);
		var variants = Math.max(1, Math.round(Number(given.Variants) || 8));
		var info = p.Grow === 'palm' ? 0.8 : p.Leaves.Kind === 'needles' ? 0.45 : 0.4;

		this.$Service('SceneModels').Define(name, {
			URL: 'flora:' + name,
			Group: given.Group || 'nature',
			Type: 'plant',
			Size: given.Size || (p.Height[0] + p.Height[1]) / 2,
			Sway: given.Sway === undefined ? info : given.Sway,
			Variants: variants,
			Flora: p.Name,
			Generate: function (callback) {
				var pool = self.Work();
				var trees = [];
				var textures = null;
				var left = variants + 1;
				var failed = null;
				var cache = self.$Service('SceneCache');
				var kept = p.Bark.Image || p.Leaves.Image || cache.ElemenxDeferred || given.Keep === false ? null : self.Key(p, variants);
				var hot;
				var v;

				function give () {
					/* One set of pictures for all its variants: drawn once on the screen. */
					var images = [textures.Bark, textures.BarkNormal, textures.Leaves].map(function (picture) {
						return {Data: null, Type: '', URI: '', Picture: picture, Mean: picture.Mean || null};
					});

					callback(null, trees.map(function (tree) {
						var asset = self.Asset(tree, textures);

						asset.Images = images;

						return asset;
					}));
				}

				function finish () {
					if (--left) return;

					if (failed) {
						callback(failed, null);

						return;
					}

					if (kept)
						cache.Put('flora', kept, {Trees: trees, Textures: textures});

					give();
				}

				function grow (variant) {
					pool.Run('SceneFlora', 'Tree', [p, variant], function (error, made) {
						failed = failed || error;
						trees[variant] = made;

						finish();
					});
				}

				function make () {
					pool.Run('SceneFlora', 'Textures', [p], function (error, made) {
						failed = failed || error;
						textures = made;

						finish();
					});

					for (v = 0; v < variants; v++)
						grow(v);
				}

				function found (value) {
					trees = value.Trees;
					textures = value.Textures;

					give();
				}

				/*
				 * Grown before (SceneCache, by its preset, its variants and the code that grows it): at once; this page's own
				 * copy first. Not of pictures of its own (they would be its key).
				 */
				hot = kept ? cache.Peek('flora', kept) : undefined;

				if (hot) {
					found(hot);

					return;
				}

				if (!kept || !cache.Knows('flora', kept)) {
					make();

					return;
				}

				cache.Get('flora', kept, function (error, value) {
					if (value && value.Trees && value.Trees.length === variants) found(value);
					else make();
				});
			}
		});

		return name;
	}
});
