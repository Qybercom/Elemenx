/*
 * The models of a game, made of code: no files, the same shape for the same seed. A model is a tree of pieces that move
 * on their pivots (a body, its arms, a turret, the sails of a mill), each a geometry of Graphics3D, about 1 tall (or
 * 1 wide when it is a building); the Size of a kind makes it as large as it should be.
 * - Names(filter) lists the models: filter {Group: fantasy, scifi, nature, space; Type: unit, animal, vehicle, plant,
 *   rock, building, ship}; Has(name), Info(name) ({Name, Group, Type, Size, Speed, Variants, Clips}).
 * - Define(name, recipe) adds one or replaces it: recipe {Group, Type, Size (in a game), Speed (a second), Variants,
 *   Sway (how far the wind bends it), Matte (false: it shines), Smooth (no flat faces), Clips, Build(tools, random)}.
 *   Build returns its pieces, tools.Piece(id, parts, {Parent, Pivot, Team}), of parts made by tools.Box(width, height,
 *   depth, at, color, turn), Cylinder(radius, top, height, at, color, turn, segments), Ball(radius, at, color, scale),
 *   Blob(radius, at, color, rough, scale), Lathe(points, at, color, segments) and Wedge(width, height, depth, at, color,
 *   turn); at is [x, y, z] in the space of the model, turn degrees round x, y and z, a piece with Team takes the color
 *   of its team; tools.Graphics and tools.Rigs (Biped, Quadruped, Tracked: clips to reuse) are at hand.
 * - Make(name, {Variant}) returns a model, made once: {Name, Key, Group, Type, Size, Speed, Sway, Matte, Clips, Pieces:
 *   [{ID, Parent, Pivot, Team, Geometry}]}.
 * - Whole(model) is a model as one geometry, Bounds(geometry) its {Radius, Middle} and Levels(name, {Variant}) its
 *   geometries from the finest down: for what is sown in masses and seen from afar.
 * - Pose(model, clip, time, {From, FromTime, Fade}) returns the matrix of each piece at a second of a clip, in the space
 *   of the model; Fade (0 to 1) mixes it from the pose of the clip From. Length(model, clip) is the seconds of a clip.
 * A clip is {Length, Loop, Hold, Stride, Tracks: {piece: [[time 0 to 1, rx, ry, rz, mx, my, mz]...]}, Spins: {piece:
 * [x, y, z] degrees a second}}; Hold keeps the last pose when it ends, Stride is how far a walk goes in one cycle, in
 * sizes of the model.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Models', {
	$Meta: {
		Description: 'The models of a game made of code: units, animals, plants, buildings and ships of pieces that move, fantasy and sci-fi, and their clips.',
		Methods: ['Names(filter)', 'Has(name)', 'Info(name)', 'Define(name, recipe)', 'Make(name, options)', 'Whole(model)', 'Bounds(geometry)', 'Levels(name, options)', 'Pose(model, clip, time, options)', 'Length(model, clip)']
	},

	$OnCreate: function () {
		this.Recipes = {};
		this.Made = {};

		this.Builtin();
	},

	Define: function (name, recipe) {
		var made = this.Made;

		if (!name || !recipe || typeof recipe.Build !== 'function')
			throw new Error('Elemenx Models: Define expects (name, {Build})');

		this.Recipes[name] = recipe;

		Object.keys(made).forEach(function (key) {
			if (key.split('~')[0] === name)
				delete made[key];
		});

		return this;
	},

	Has: function (name) {
		return !!this.Recipes[name];
	},

	Names: function (filter) {
		var recipes = this.Recipes;
		var wanted = filter || {};

		return Object.keys(recipes).filter(function (name) {
			return (!wanted.Group || recipes[name].Group === wanted.Group) && (!wanted.Type || recipes[name].Type === wanted.Type);
		}).sort();
	},

	Info: function (name) {
		var recipe = this.Recipes[name];
		if (!recipe)
			return null;

		return {Name: name, Group: recipe.Group || '', Type: recipe.Type || '', Size: recipe.Size || 1, Speed: recipe.Speed || 0, Variants: recipe.Variants || 1, Clips: Object.keys(recipe.Clips || {})};
	},

	Make: function (name, options) {
		var recipe = this.Recipes[name];
		var settings = options || {};
		var variants = recipe ? recipe.Variants || 1 : 1;
		var variant = Math.abs(Math.floor(Number(settings.Variant) || 0)) % variants;
		var key = name + '~' + variant;
		var graphics = this.$Service('Graphics3D');
		var pieces;

		if (!recipe)
			throw new Error('Elemenx Models: unknown model ' + name);

		if (this.Made[key])
			return this.Made[key];

		pieces = recipe.Build(this.Tools(), this.Random(name + ':' + variant)).map(function (piece) {
			var geometry = graphics.Merge(piece.Parts);

			return {ID: piece.ID, Parent: piece.Parent || '', Pivot: piece.Pivot || [0, 0, 0], Team: !!piece.Team, Geometry: recipe.Smooth ? geometry : graphics.Facets(geometry)};
		});

		this.Made[key] = {Name: name, Key: key, Group: recipe.Group || '', Type: recipe.Type || '', Size: recipe.Size || 1, Speed: recipe.Speed || 0, Sway: recipe.Sway || 0, Matte: recipe.Matte !== false, Clips: recipe.Clips || {}, Pieces: pieces};

		return this.Made[key];
	},

	Whole: function (model) {
		return this.$Service('Graphics3D').Merge(model.Pieces.map(function (piece) {
			return {Geometry: piece.Geometry};
		}));
	},

	Bounds: function (geometry) {
		var p = geometry.Positions;
		var top = -Infinity;
		var bottom = Infinity;
		var wide = 0;
		var i;

		for (i = 0; i < p.length; i += 3) {
			top = Math.max(top, p[i + 1]);
			bottom = Math.min(bottom, p[i + 1]);
			wide = Math.max(wide, Math.abs(p[i]), Math.abs(p[i + 2]));
		}

		return {Radius: Math.max(wide, (top - bottom) / 2) * 1.05, Middle: (top + bottom) / 2};
	},

	/* The whole model, then two simpler ones: cells of a thirtieth and of a tenth of its size. */
	Levels: function (name, options) {
		var graphics = this.$Service('Graphics3D');
		var whole = this.Whole(this.Make(name, options));
		var bounds = this.Bounds(whole);

		return [whole, graphics.Simplify(whole, bounds.Radius / 15), graphics.Simplify(whole, bounds.Radius / 5)];
	},

	Length: function (model, clip) {
		var made = model.Clips[clip];

		return made ? made.Length || 1 : 0;
	},

	/* The angles and the moves of each piece at a second of a clip. */
	Local: function (model, clip, time) {
		var made = model.Clips[clip];
		var state = {};
		var length;
		var phase;

		if (!made)
			return state;

		length = made.Length || 1;
		phase = time / length;
		phase = made.Loop ? phase - Math.floor(phase) : Math.max(0, Math.min(1, phase));

		Object.keys(made.Tracks || {}).forEach(function (piece) {
			var keys = made.Tracks[piece];
			var at = 0;
			var from;
			var to;
			var t;
			var channel;
			var values = [];

			while (at < keys.length - 2 && phase > keys[at + 1][0])
				at++;

			from = keys[at];
			to = keys[Math.min(at + 1, keys.length - 1)];
			t = to[0] > from[0] ? Math.max(0, Math.min(1, (phase - from[0]) / (to[0] - from[0]))) : 0;
			t = t * t * (3 - 2 * t);

			for (channel = 1; channel <= 6; channel++)
				values.push((from[channel] || 0) * (1 - t) + (to[channel] || 0) * t);

			state[piece] = values;
		});

		Object.keys(made.Spins || {}).forEach(function (piece) {
			var values = state[piece] || [0, 0, 0, 0, 0, 0];

			values[0] += made.Spins[piece][0] * time % 360;
			values[1] += made.Spins[piece][1] * time % 360;
			values[2] += made.Spins[piece][2] * time % 360;

			state[piece] = values;
		});

		return state;
	},

	Pose: function (model, clip, time, options) {
		var graphics = this.$Service('Graphics3D');
		var settings = options || {};
		var state = this.Local(model, clip, time);
		var from = settings.From ? this.Local(model, settings.From, settings.FromTime || 0) : null;
		var fade = settings.Fade === undefined ? 1 : Math.max(0, Math.min(1, settings.Fade));
		var matrices = {};
		var degrees = Math.PI / 180;

		model.Pieces.forEach(function (piece) {
			var values = state[piece.ID];
			var before = from ? from[piece.ID] : null;
			var parent = piece.Parent ? matrices[piece.Parent] : null;
			var pivot = piece.Pivot;
			var mixed;
			var local;
			var i;

			if (from && fade < 1 && (values || before)) {
				mixed = [];

				for (i = 0; i < 6; i++)
					mixed.push((before ? before[i] : 0) * (1 - fade) + (values ? values[i] : 0) * fade);

				values = mixed;
			}

			if (!values) {
				matrices[piece.ID] = parent || graphics.Identity();

				return;
			}

			local = graphics.Translation(pivot[0] + values[3], pivot[1] + values[4], pivot[2] + values[5]);
			local = graphics.Multiply(local, graphics.Rotation([0, 1, 0], values[1] * degrees));
			local = graphics.Multiply(local, graphics.Rotation([1, 0, 0], values[0] * degrees));
			local = graphics.Multiply(local, graphics.Rotation([0, 0, 1], values[2] * degrees));
			local = graphics.Multiply(local, graphics.Translation(-pivot[0], -pivot[1], -pivot[2]));

			matrices[piece.ID] = parent ? graphics.Multiply(parent, local) : local;
		});

		return matrices;
	},

	/* The numbers of a shape: always the same for the same text. */
	Random: function (text) {
		var value = 2166136261;
		var i;

		for (i = 0; i < text.length; i++)
			value = Math.imul(value ^ text.charCodeAt(i), 16777619);

		return function (low, high) {
			value = Math.imul(value ^ value >>> 15, 2246822519) + 1 | 0;

			return (low || 0) + ((value >>> 0) / 4294967296) * ((high === undefined ? 1 : high) - (low || 0));
		};
	},

	/* What a recipe builds with. */
	Tools: function () {
		var graphics = this.$Service('Graphics3D');
		var degrees = Math.PI / 180;

		function matrix (at, turn) {
			var result = graphics.Translation(at ? at[0] : 0, at ? at[1] : 0, at ? at[2] : 0);

			if (turn) {
				result = graphics.Multiply(result, graphics.Rotation([0, 1, 0], (turn[1] || 0) * degrees));
				result = graphics.Multiply(result, graphics.Rotation([1, 0, 0], (turn[0] || 0) * degrees));
				result = graphics.Multiply(result, graphics.Rotation([0, 0, 1], (turn[2] || 0) * degrees));
			}

			return result;
		}

		return {
			Graphics: graphics,
			Rigs: this.Rigs(),

			Piece: function (id, parts, options) {
				return Object.assign({ID: id, Parts: parts}, options || {});
			},

			Box: function (width, height, depth, at, color, turn) {
				return {Geometry: graphics.Box({Width: width, Height: height, Depth: depth}), Matrix: matrix(at, turn), Color: color};
			},

			Cylinder: function (radius, top, height, at, color, turn, segments) {
				return {Geometry: graphics.Cylinder({Radius: radius, Top: top, Height: height, Segments: segments || 8}), Matrix: matrix(at, turn), Color: color};
			},

			Ball: function (radius, at, color, scale) {
				return {Geometry: graphics.Sphere({Radius: radius, Segments: 10, Rings: 7}), Matrix: graphics.Multiply(matrix(at), scale ? graphics.Scaling(scale[0], scale[1], scale[2]) : graphics.Identity()), Color: color};
			},

			/* A lump of faces: leaves, a stone. */
			Blob: function (radius, at, color, rough, scale) {
				var noise = graphics.Noise(String(radius) + at.join(','));
				var shaped = graphics.Displace(graphics.Icosphere({Radius: radius, Detail: 1}), function (point) {
					return (noise.Fbm(point[0] * 3 / radius, point[1] * 3 / radius, point[2] * 3 / radius, 2) - 0.5) * radius * (rough === undefined ? 0.8 : rough);
				});

				return {Geometry: shaped, Matrix: graphics.Multiply(matrix(at), scale ? graphics.Scaling(scale[0], scale[1], scale[2]) : graphics.Identity()), Color: color};
			},

			Lathe: function (points, at, color, segments) {
				return {Geometry: graphics.Lathe({Points: points, Segments: segments || 12}), Matrix: matrix(at), Color: color};
			},

			Wedge: function (width, height, depth, at, color, turn) {
				return {Geometry: graphics.Wedge({Width: width, Height: height, Depth: depth}), Matrix: matrix(at, turn), Color: color};
			}
		};
	},

	/* The clips of the bodies that share their joints: of two legs, of four, of tracks. */
	Rigs: function () {
		return {
			Biped: {
				idle: {Length: 2.6, Loop: true, Tracks: {
					'body': [[0, 0, 0, 0, 0, 0, 0], [0.5, 1, 0, 0, 0, -0.006, 0], [1, 0, 0, 0, 0, 0, 0]],
					'arm-l': [[0, 0, 0, 3], [0.5, 2, 0, 5], [1, 0, 0, 3]],
					'arm-r': [[0, 0, 0, -3], [0.5, 2, 0, -5], [1, 0, 0, -3]],
					'head': [[0, 0, -6, 0], [0.5, 0, 6, 0], [1, 0, -6, 0]]
				}},
				walk: {Length: 0.8, Loop: true, Stride: 1, Tracks: {
					'leg-l': [[0, -32], [0.5, 32], [1, -32]],
					'leg-r': [[0, 32], [0.5, -32], [1, 32]],
					'arm-l': [[0, 26], [0.5, -26], [1, 26]],
					'arm-r': [[0, -26], [0.5, 26], [1, -26]],
					'body': [[0, -4, 0, 0, 0, 0, 0], [0.25, -4, 0, 0, 0, 0.018, 0], [0.5, -4, 0, 0, 0, 0, 0], [0.75, -4, 0, 0, 0, 0.018, 0], [1, -4, 0, 0, 0, 0, 0]]
				}},
				attack: {Length: 0.7, Tracks: {
					'arm-r': [[0, 0], [0.35, -135], [0.6, -25], [1, 0]],
					'body': [[0, 0], [0.35, 4, -22], [0.6, -10, 24], [1, 0]]
				}},
				cast: {Length: 1.1, Tracks: {
					'arm-l': [[0, 0], [0.4, -150, 0, 15], [0.75, -150, 0, 15], [1, 0]],
					'arm-r': [[0, 0], [0.4, -150, 0, -15], [0.75, -150, 0, -15], [1, 0]],
					'body': [[0, 0], [0.4, 8], [0.75, -6], [1, 0]]
				}},
				work: {Length: 1, Loop: true, Tracks: {
					'arm-r': [[0, -30], [0.45, -130], [0.65, -20], [1, -30]],
					'arm-l': [[0, -30], [0.45, -60], [0.65, -30], [1, -30]],
					'body': [[0, -8], [0.45, 6], [0.65, -16], [1, -8]]
				}},
				die: {Length: 1, Hold: true, Tracks: {
					'body': [[0, 0], [0.3, 12, 0, 0, 0, -0.04, 0], [1, -86, 0, 0, 0, -0.46, 0]],
					'arm-l': [[0, 0], [1, -40, 0, 30]],
					'arm-r': [[0, 0], [1, -40, 0, -30]],
					'leg-l': [[0, 0], [0.6, 25], [1, 8]],
					'leg-r': [[0, 0], [0.6, 10], [1, -6]]
				}}
			},

			Quadruped: {
				idle: {Length: 3, Loop: true, Tracks: {
					'head': [[0, 0, -8, 0], [0.5, 8, 8, 0], [1, 0, -8, 0]],
					'tail': [[0, 0, -12, 0], [0.5, 0, 12, 0], [1, 0, -12, 0]]
				}},
				walk: {Length: 0.6, Loop: true, Stride: 1.5, Tracks: {
					'leg-fl': [[0, -28], [0.5, 28], [1, -28]],
					'leg-fr': [[0, 28], [0.5, -28], [1, 28]],
					'leg-bl': [[0, 28], [0.5, -28], [1, 28]],
					'leg-br': [[0, -28], [0.5, 28], [1, -28]],
					'tail': [[0, 0, -18, 0], [0.5, 0, 18, 0], [1, 0, -18, 0]],
					'body': [[0, 0, 0, 0, 0, 0, 0], [0.25, 0, 0, 0, 0, 0.02, 0], [0.5, 0, 0, 0, 0, 0, 0], [0.75, 0, 0, 0, 0, 0.02, 0], [1, 0, 0, 0, 0, 0, 0]]
				}},
				attack: {Length: 0.6, Tracks: {
					'head': [[0, 0], [0.4, -30], [0.6, 25], [1, 0]],
					'body': [[0, 0], [0.4, -10, 0, 0, 0, 0.04, -0.1], [0.6, 6, 0, 0, 0, 0, 0.12], [1, 0]]
				}},
				die: {Length: 0.9, Hold: true, Tracks: {
					'body': [[0, 0], [1, 0, 0, 84, 0, -0.26, 0]]
				}}
			},

			Tracked: {
				idle: {Length: 8, Loop: true, Tracks: {
					'turret': [[0, 0, -14, 0], [0.5, 0, 14, 0], [1, 0, -14, 0]]
				}},
				walk: {Length: 0.5, Loop: true, Stride: 1.5, Tracks: {
					'body': [[0, 0.6], [0.5, -0.6], [1, 0.6]]
				}},
				attack: {Length: 0.5, Tracks: {
					'turret': [[0, 0, 0, 0, 0, 0, 0], [0.12, 0, 0, 0, 0, 0, -0.1], [1, 0, 0, 0, 0, 0, 0]],
					'body': [[0, 0], [0.12, 3], [1, 0]]
				}},
				die: {Length: 0.8, Hold: true, Tracks: {
					'turret': [[0, 0, 0, 0, 0, 0, 0], [0.4, 40, 60, 20, 0.1, 0.5, 0.2], [1, 70, 120, 40, 0.3, -0.05, 0.4]]
				}}
			}
		};
	},

	Builtin: function () {
		var self = this;
		var rigs = this.Rigs();
		var skin = [0.9, 0.74, 0.6];
		var steel = [0.72, 0.75, 0.8];
		var iron = [0.34, 0.36, 0.41];
		var leather = [0.42, 0.3, 0.2];
		var wood = [0.5, 0.36, 0.23];
		var bark = [0.36, 0.26, 0.18];
		var stone = [0.62, 0.6, 0.57];
		var plaster = [0.9, 0.86, 0.78];
		var tile = [0.62, 0.28, 0.22];
		var hull = [0.78, 0.8, 0.84];
		var dark = [0.27, 0.29, 0.34];
		var light = [2.2, 2.5, 3];
		var flame = [2.4, 1.8, 1];

		/* A body of two legs, 1 tall; extra has what it wears on its pieces: Body, Head, ArmL, ArmR, Legs, Cloth. */
		function biped (tools, colors, extra, wide) {
			var breadth = wide || 1;
			var x = 0.075 * breadth;
			var shoulder = 0.175 * breadth;

			return [
				tools.Piece('body', [tools.Box(0.26 * breadth, 0.32, 0.15, [0, 0.66, 0], colors.Torso), tools.Box(0.22 * breadth, 0.06, 0.14, [0, 0.49, 0], colors.Belt || colors.Torso)].concat(extra.Body || []), {Pivot: [0, 0.5, 0]}),
				tools.Piece('head', [tools.Box(0.14, 0.15, 0.14, [0, 0.9, 0], colors.Skin || skin)].concat(extra.Head || []), {Parent: 'body', Pivot: [0, 0.82, 0]}),
				tools.Piece('arm-l', [tools.Box(0.08, 0.3, 0.08, [-shoulder, 0.65, 0], colors.Arms || colors.Torso), tools.Box(0.07, 0.07, 0.07, [-shoulder, 0.47, 0], colors.Skin || skin)].concat(extra.ArmL || []), {Parent: 'body', Pivot: [-shoulder, 0.78, 0]}),
				tools.Piece('arm-r', [tools.Box(0.08, 0.3, 0.08, [shoulder, 0.65, 0], colors.Arms || colors.Torso), tools.Box(0.07, 0.07, 0.07, [shoulder, 0.47, 0], colors.Skin || skin)].concat(extra.ArmR || []), {Parent: 'body', Pivot: [shoulder, 0.78, 0]}),
				tools.Piece('leg-l', [tools.Box(0.1, 0.44, 0.11, [-x, 0.25, 0], colors.Legs), tools.Box(0.11, 0.05, 0.17, [-x, 0.025, 0.03], colors.Boots || iron)], {Parent: 'body', Pivot: [-x, 0.47, 0]}),
				tools.Piece('leg-r', [tools.Box(0.1, 0.44, 0.11, [x, 0.25, 0], colors.Legs), tools.Box(0.11, 0.05, 0.17, [x, 0.025, 0.03], colors.Boots || iron)], {Parent: 'body', Pivot: [x, 0.47, 0]}),
				tools.Piece('cloth', extra.Cloth || [tools.Box(0.18 * breadth, 0.3, 0.02, [0, 0.62, 0.08], [1, 1, 1])], {Parent: 'body', Team: true})
			];
		}

		/* A body of four legs, along Z, about 0.8 tall. */
		function quadruped (tools, coat, belly, extra) {
			function leg (id, x, z) {
				return tools.Piece(id, [tools.Box(0.08, 0.36, 0.08, [x, 0.18, z], coat)], {Parent: 'body', Pivot: [x, 0.36, z]});
			}

			return [
				tools.Piece('body', [tools.Box(0.26, 0.26, 0.8, [0, 0.46, 0], coat), tools.Box(0.2, 0.06, 0.66, [0, 0.33, 0], belly)], {Pivot: [0, 0.46, 0]}),
				tools.Piece('head', [tools.Box(0.16, 0.2, 0.2, [0, 0.72, 0.5], coat), tools.Box(0.1, 0.1, 0.16, [0, 0.68, 0.66], belly)].concat(extra || []), {Parent: 'body', Pivot: [0, 0.56, 0.38]}),
				tools.Piece('tail', [tools.Box(0.05, 0.05, 0.26, [0, 0.54, -0.52], coat, [18, 0, 0])], {Parent: 'body', Pivot: [0, 0.56, -0.4]}),
				leg('leg-fl', -0.09, 0.32),
				leg('leg-fr', 0.09, 0.32),
				leg('leg-bl', -0.09, -0.32),
				leg('leg-br', 0.09, -0.32)
			];
		}

		function define (group, type, size, speed, clips, list) {
			Object.keys(list).forEach(function (name) {
				self.Define(name, {Group: group, Type: type, Size: size, Speed: speed, Clips: clips, Build: list[name]});
			});
		}

		define('fantasy', 'unit', 1.8, 8, rigs.Biped, {
			knight: function (tools) {
				return biped(tools, {Torso: steel, Arms: steel, Legs: iron}, {
					Head: [tools.Box(0.16, 0.13, 0.16, [0, 0.93, 0], steel), tools.Box(0.15, 0.02, 0.01, [0, 0.91, 0.08], dark)],
					ArmR: [tools.Box(0.03, 0.42, 0.015, [0.175, 0.56, 0.2], [0.85, 0.87, 0.92], [80, 0, 0]), tools.Box(0.12, 0.02, 0.03, [0.175, 0.46, 0.05], leather)],
					ArmL: [tools.Box(0.03, 0.3, 0.24, [-0.24, 0.56, 0.02], wood)]
				});
			},

			archer: function (tools) {
				return biped(tools, {Torso: [0.3, 0.42, 0.26], Legs: leather}, {
					Head: [tools.Cylinder(0.11, 0, 0.17, [0, 1, 0], [0.24, 0.34, 0.2]), tools.Box(0.15, 0.04, 0.15, [0, 0.96, 0], [0.24, 0.34, 0.2])],
					ArmL: [tools.Box(0.02, 0.62, 0.02, [-0.2, 0.5, 0.12], wood, [14, 0, 0])],
					Body: [tools.Cylinder(0.04, 0.04, 0.34, [0.05, 0.72, -0.1], leather, [0, 0, 18])]
				});
			},

			mage: function (tools) {
				return biped(tools, {Torso: [0.26, 0.2, 0.5], Legs: [0.22, 0.17, 0.42], Boots: [0.22, 0.17, 0.42]}, {
					Body: [tools.Cylinder(0.24, 0.13, 0.42, [0, 0.34, 0], [0.26, 0.2, 0.5])],
					Head: [tools.Cylinder(0.14, 0, 0.3, [0, 1.1, 0], [0.26, 0.2, 0.5]), tools.Cylinder(0.17, 0.17, 0.02, [0, 0.97, 0], [0.26, 0.2, 0.5]), tools.Box(0.08, 0.1, 0.02, [0, 0.8, 0.08], [0.9, 0.9, 0.92])],
					ArmR: [tools.Cylinder(0.014, 0.014, 0.95, [0.19, 0.5, 0.06], wood), tools.Ball(0.04, [0.19, 1, 0.06], [1.3, 1.5, 2.6])]
				});
			},

			orc: function (tools) {
				var green = [0.36, 0.5, 0.26];

				return biped(tools, {Torso: leather, Arms: green, Skin: green, Legs: [0.3, 0.24, 0.17]}, {
					Head: [tools.Box(0.04, 0.05, 0.02, [-0.05, 0.84, 0.08], [0.95, 0.92, 0.82]), tools.Box(0.04, 0.05, 0.02, [0.05, 0.84, 0.08], [0.95, 0.92, 0.82])],
					ArmR: [tools.Cylinder(0.02, 0.02, 0.48, [0.21, 0.5, 0.14], wood, [70, 0, 0]), tools.Box(0.2, 0.15, 0.03, [0.21, 0.44, 0.34], iron)]
				}, 1.3);
			},

			villager: function (tools) {
				return biped(tools, {Torso: [0.72, 0.62, 0.42], Legs: [0.4, 0.34, 0.28], Boots: leather}, {
					Head: [tools.Box(0.15, 0.05, 0.15, [0, 0.99, 0], [0.5, 0.33, 0.2])],
					ArmR: [tools.Cylinder(0.014, 0.014, 0.46, [0.175, 0.47, 0.16], wood, [75, 0, 0]), tools.Box(0.11, 0.09, 0.02, [0.175, 0.42, 0.37], iron)]
				});
			}
		});

		define('scifi', 'unit', 1.8, 9, rigs.Biped, {
			soldier: function (tools) {
				var armor = [0.4, 0.45, 0.42];

				return biped(tools, {Torso: armor, Arms: armor, Legs: [0.28, 0.31, 0.3]}, {
					Head: [tools.Box(0.16, 0.14, 0.16, [0, 0.92, 0], armor), tools.Box(0.13, 0.04, 0.01, [0, 0.92, 0.08], [0.3, 1.1, 1.6])],
					ArmR: [tools.Box(0.04, 0.06, 0.42, [0.17, 0.5, 0.18], dark), tools.Box(0.03, 0.1, 0.04, [0.17, 0.42, 0.06], dark)],
					Body: [tools.Box(0.22, 0.26, 0.09, [0, 0.68, -0.11], dark)]
				});
			},

			robot: function (tools) {
				return biped(tools, {Torso: hull, Arms: dark, Skin: hull, Legs: dark, Boots: hull}, {
					Head: [tools.Box(0.1, 0.03, 0.01, [0, 0.92, 0.075], [3, 0.8, 0.5]), tools.Cylinder(0.008, 0.008, 0.1, [0.05, 1.02, 0], dark)],
					Body: [tools.Box(0.14, 0.1, 0.01, [0, 0.72, 0.08], [0.5, 1.8, 2.2])]
				}, 1.1);
			}
		});

		this.Define('mech', {Group: 'scifi', Type: 'unit', Size: 7, Speed: 7, Clips: Object.assign({}, rigs.Biped, {walk: Object.assign({}, rigs.Biped.walk, {Length: 1.2, Stride: 0.9})}), Matte: false, Build: function (tools) {
			return biped(tools, {Torso: hull, Arms: dark, Skin: dark, Legs: [0.5, 0.52, 0.56], Boots: dark}, {
				Head: [tools.Box(0.16, 0.05, 0.02, [0, 0.9, 0.08], [3, 1.4, 0.4])],
				Body: [tools.Box(0.5, 0.16, 0.3, [0, 0.74, 0], dark), tools.Box(0.14, 0.2, 0.14, [-0.17, 0.92, -0.06], [0.5, 0.52, 0.56]), tools.Box(0.14, 0.2, 0.14, [0.17, 0.92, -0.06], [0.5, 0.52, 0.56])],
				ArmR: [tools.Box(0.08, 0.08, 0.5, [0.26, 0.47, 0.2], iron), tools.Cylinder(0.03, 0.03, 0.08, [0.26, 0.47, 0.48], dark, [90, 0, 0])],
				ArmL: [tools.Box(0.08, 0.08, 0.5, [-0.26, 0.47, 0.2], iron)]
			}, 1.5);
		}});

		this.Define('tank', {Group: 'scifi', Type: 'vehicle', Size: 6, Speed: 12, Clips: rigs.Tracked, Matte: false, Build: function (tools) {
			return [
				tools.Piece('body', [tools.Box(0.56, 0.16, 0.92, [0, 0.2, 0], [0.42, 0.46, 0.36]), tools.Box(0.16, 0.16, 1, [-0.33, 0.12, 0], dark), tools.Box(0.16, 0.16, 1, [0.33, 0.12, 0], dark), tools.Wedge(0.5, 0.1, 0.2, [0, 0.3, 0.42], [0.42, 0.46, 0.36], [0, 90, 0])], {Pivot: [0, 0.2, 0]}),
				tools.Piece('turret', [tools.Lathe([[0.25, 0], [0.22, 0.14], [0.08, 0.17], [0, 0.17]], [0, 0.28, -0.02], [0.46, 0.5, 0.4], 10), tools.Cylinder(0.024, 0.024, 0.62, [0, 0.36, 0.48], iron, [90, 0, 0])], {Parent: 'body', Pivot: [0, 0.3, 0]}),
				tools.Piece('stripe', [tools.Box(0.2, 0.012, 0.12, [0, 0.455, -0.1], [1, 1, 1])], {Parent: 'turret', Team: true})
			];
		}});

		this.Define('rover', {Group: 'scifi', Type: 'vehicle', Size: 4, Speed: 14, Clips: {
			idle: {Length: 1, Loop: true, Spins: {'dish': [0, 60, 0]}},
			walk: {Length: 1, Loop: true, Stride: 1.5, Spins: {'dish': [0, 60, 0], 'wheels-f': [360, 0, 0], 'wheels-b': [360, 0, 0]}}
		}, Matte: false, Build: function (tools) {
			function wheels (z) {
				return [tools.Cylinder(0.11, 0.11, 0.08, [-0.33, 0, z], dark, [0, 0, 90], 10), tools.Cylinder(0.11, 0.11, 0.08, [0.33, 0, z], dark, [0, 0, 90], 10)];
			}

			return [
				tools.Piece('body', [tools.Box(0.56, 0.16, 0.9, [0, 0.24, 0], hull), tools.Box(0.4, 0.14, 0.36, [0, 0.38, 0.14], dark)]),
				tools.Piece('wheels-f', wheels(0.3).map(function (wheel) {
					wheel.Matrix[13] = 0.11;

					return wheel;
				}), {Parent: 'body', Pivot: [0, 0.11, 0.3]}),
				tools.Piece('wheels-b', wheels(-0.3).map(function (wheel) {
					wheel.Matrix[13] = 0.11;

					return wheel;
				}), {Parent: 'body', Pivot: [0, 0.11, -0.3]}),
				tools.Piece('dish', [tools.Cylinder(0.012, 0.012, 0.2, [0, 0.42, -0.26], dark), tools.Cylinder(0.12, 0.02, 0.05, [0, 0.54, -0.26], hull, [20, 0, 0], 10)], {Parent: 'body', Pivot: [0, 0.4, -0.26]}),
				tools.Piece('stripe', [tools.Box(0.5, 0.01, 0.12, [0, 0.325, -0.26], [1, 1, 1])], {Parent: 'body', Team: true})
			];
		}});

		this.Define('drone', {Group: 'scifi', Type: 'vehicle', Size: 2.4, Speed: 16, Clips: {
			idle: {Length: 2, Loop: true, Tracks: {'body': [[0, 0, 0, 0, 0, 0, 0], [0.5, 0, 0, 0, 0, 0.05, 0], [1, 0, 0, 0, 0, 0, 0]]}, Spins: {'rotor-a': [0, 1400, 0], 'rotor-b': [0, -1400, 0], 'rotor-c': [0, 1400, 0], 'rotor-d': [0, -1400, 0]}},
			walk: {Length: 1, Loop: true, Stride: 2, Tracks: {'body': [[0, 8], [1, 8]]}, Spins: {'rotor-a': [0, 1800, 0], 'rotor-b': [0, -1800, 0], 'rotor-c': [0, 1800, 0], 'rotor-d': [0, -1800, 0]}}
		}, Matte: false, Build: function (tools) {
			function rotor (id, x, z) {
				return tools.Piece(id, [tools.Box(0.34, 0.008, 0.03, [x, 0.72, z], dark), tools.Box(0.03, 0.008, 0.34, [x, 0.72, z], dark)], {Parent: 'body', Pivot: [x, 0.72, z]});
			}

			return [
				tools.Piece('body', [tools.Box(0.22, 0.09, 0.3, [0, 0.66, 0], hull), tools.Box(0.72, 0.02, 0.03, [0, 0.69, 0], dark, [0, 40, 0]), tools.Box(0.72, 0.02, 0.03, [0, 0.69, 0], dark, [0, -40, 0]), tools.Ball(0.05, [0, 0.62, 0.13], [0.4, 1.4, 2.2])], {Pivot: [0, 0.66, 0]}),
				rotor('rotor-a', 0.24, 0.2),
				rotor('rotor-b', -0.24, 0.2),
				rotor('rotor-c', -0.24, -0.2),
				rotor('rotor-d', 0.24, -0.2),
				tools.Piece('stripe', [tools.Box(0.1, 0.01, 0.2, [0, 0.71, 0], [1, 1, 1])], {Parent: 'body', Team: true})
			];
		}});

		define('nature', 'animal', 2.2, 11, rigs.Quadruped, {
			wolf: function (tools) {
				return quadruped(tools, [0.46, 0.46, 0.48], [0.72, 0.7, 0.68], [tools.Box(0.04, 0.09, 0.03, [-0.05, 0.85, 0.46], [0.46, 0.46, 0.48]), tools.Box(0.04, 0.09, 0.03, [0.05, 0.85, 0.46], [0.46, 0.46, 0.48])]);
			},

			deer: function (tools) {
				return quadruped(tools, [0.56, 0.38, 0.24], [0.84, 0.76, 0.66], [tools.Box(0.02, 0.26, 0.02, [-0.06, 0.94, 0.46], [0.84, 0.76, 0.6], [0, 0, -20]), tools.Box(0.02, 0.26, 0.02, [0.06, 0.94, 0.46], [0.84, 0.76, 0.6], [0, 0, 20]), tools.Box(0.02, 0.14, 0.02, [-0.1, 0.98, 0.5], [0.84, 0.76, 0.6], [30, 0, -40]), tools.Box(0.02, 0.14, 0.02, [0.1, 0.98, 0.5], [0.84, 0.76, 0.6], [30, 0, 40])]);
			}
		});

		function plant (name, size, sway, variants, build) {
			self.Define(name, {Group: 'nature', Type: 'plant', Size: size, Sway: sway, Variants: variants, Build: build});
		}

		plant('pine', 8, 0.5, 4, function (tools, random) {
			var green = [0.17 + random(0, 0.06), 0.36 + random(0, 0.1), 0.2];
			var bend = random(-6, 6);
			var parts = [tools.Cylinder(0.05, 0.03, 0.34, [0, 0.17, 0], bark)];
			var level;

			for (level = 0; level < 4; level++)
				parts.push(tools.Cylinder(0.3 - level * 0.06 + random(-0.02, 0.02), 0, 0.42 - level * 0.05, [0, 0.42 + level * 0.17, 0], [green[0] + level * 0.02, green[1] + level * 0.03, green[2]], [bend, level * 40, 0]));

			return [tools.Piece('body', parts)];
		});

		plant('oak', 8, 0.35, 4, function (tools, random) {
			var green = [0.27 + random(0, 0.1), 0.45 + random(0, 0.1), 0.2];
			var parts = [tools.Cylinder(0.09, 0.05, 0.5, [0, 0.25, 0], bark), tools.Cylinder(0.03, 0.02, 0.3, [0.1, 0.5, 0], bark, [0, 0, -35]), tools.Cylinder(0.03, 0.02, 0.3, [-0.1, 0.48, 0.03], bark, [0, 0, 35])];
			var count = 5;
			var i;
			var angle;

			parts.push(tools.Blob(0.3, [0, 0.74, 0], green));

			for (i = 0; i < count; i++) {
				angle = i / count * Math.PI * 2 + random(0, 1);

				parts.push(tools.Blob(0.17 + random(0, 0.07), [Math.cos(angle) * 0.24, 0.6 + random(0, 0.14), Math.sin(angle) * 0.24], [green[0] + random(-0.04, 0.04), green[1] + random(-0.05, 0.05), green[2]]));
			}

			return [tools.Piece('body', parts)];
		});

		plant('birch', 8, 0.5, 3, function (tools, random) {
			var parts = [tools.Cylinder(0.035, 0.018, 0.74, [0, 0.37, 0], [0.86, 0.85, 0.8])];
			var i;

			for (i = 0; i < 4; i++) {
				parts.push(tools.Box(0.07, 0.015, 0.07, [0, 0.12 + i * 0.16, 0], dark, [0, i * 37, 0]));
				parts.push(tools.Blob(0.13 + random(0, 0.05), [random(-0.08, 0.08), 0.62 + i * 0.09, random(-0.08, 0.08)], [0.5 + random(0, 0.14), 0.62 + random(0, 0.1), 0.26], 0.7, [1, 1.3, 1]));
			}

			return [tools.Piece('body', parts)];
		});

		plant('palm', 9, 0.8, 3, function (tools, random) {
			var parts = [];
			var lean = random(0.05, 0.14);
			var i;
			var y;

			for (i = 0; i < 7; i++) {
				y = i * 0.11;

				parts.push(tools.Cylinder(0.042 - i * 0.003, 0.036 - i * 0.003, 0.12, [lean * y * y * 3, y + 0.06, 0], [0.5, 0.42, 0.3], [0, 0, -i * 2]));
			}

			for (i = 0; i < 7; i++)
				parts.push(tools.Box(0.5, 0.012, 0.09, [lean * 1.1 + Math.cos(i / 7 * 6.28) * 0.23, 0.76, Math.sin(i / 7 * 6.28) * 0.23], [0.24, 0.5 + random(0, 0.14), 0.22], [0, -i / 7 * 360, -18]));

			return [tools.Piece('body', parts)];
		});

		plant('bush', 1.6, 0.4, 3, function (tools, random) {
			var green = [0.24 + random(0, 0.1), 0.42 + random(0, 0.1), 0.2];

			return [tools.Piece('body', [tools.Blob(0.34, [0, 0.3, 0], green), tools.Blob(0.24, [0.24, 0.22, 0.08], [green[0] + 0.04, green[1] + 0.04, green[2]]), tools.Blob(0.22, [-0.22, 0.2, -0.1], [green[0] - 0.03, green[1] - 0.03, green[2]])])];
		});

		plant('stump', 1.2, 0, 1, function (tools) {
			return [tools.Piece('body', [tools.Cylinder(0.36, 0.28, 0.5, [0, 0.25, 0], bark), tools.Cylinder(0.27, 0.27, 0.01, [0, 0.505, 0], [0.74, 0.6, 0.42])])];
		});

		plant('mushroom', 0.9, 0, 3, function (tools, random) {
			var cap = [0.7 + random(0, 0.2), 0.2 + random(0, 0.14), 0.16];

			return [tools.Piece('body', [tools.Cylinder(0.1, 0.07, 0.5, [0, 0.25, 0], [0.92, 0.88, 0.8]), tools.Lathe([[0.36, 0], [0.33, 0.1], [0.18, 0.24], [0, 0.28]], [0, 0.46, 0], cap, 10), tools.Ball(0.04, [0.12, 0.66, 0.06], [0.95, 0.95, 0.9]), tools.Ball(0.03, [-0.1, 0.62, 0.14], [0.95, 0.95, 0.9])])];
		});

		function rock (name, size, color, scale) {
			self.Define(name, {Group: 'nature', Type: 'rock', Size: size, Variants: 3, Build: function (tools, random) {
				return [tools.Piece('body', [tools.Blob(0.5 + random(0, 0.1), [0, 0.2, 0], color, 1.1, scale)])];
			}});
		}

		rock('rock', 2.5, [0.56, 0.54, 0.52], [1, 0.7, 0.9]);
		rock('boulder', 6, [0.48, 0.46, 0.45], [1.1, 0.85, 1]);

		self.Define('crystal', {Group: 'nature', Type: 'rock', Size: 3, Variants: 3, Build: function (tools, random) {
			var parts = [];
			var i;
			var tall;

			for (i = 0; i < 5; i++) {
				tall = random(0.4, 1);

				parts.push(tools.Lathe([[0, 0], [0.09, 0.08], [0.09, tall * 0.8], [0, tall]], [random(-0.2, 0.2), 0, random(-0.2, 0.2)], [0.5 + random(0, 0.3), 0.9, 1.4], 6));

				parts[i].Matrix = tools.Graphics.Multiply(parts[i].Matrix, tools.Graphics.Rotation([random(-1, 1), 0.01, random(-1, 1)], random(0, 0.35)));
			}

			return [tools.Piece('body', parts)];
		}});

		function building (group, name, size, recipe) {
			self.Define(name, typeof recipe === 'function' ? {Group: group, Type: 'building', Size: size, Build: recipe} : Object.assign({Group: group, Type: 'building', Size: size}, recipe));
		}

		function banner (tools, x, y, z) {
			return tools.Piece('banner', [tools.Box(0.012, 0.3, 0.012, [x, y, z], wood), tools.Box(0.14, 0.09, 0.008, [x + 0.075, y + 0.1, z], [1, 1, 1])], {Team: true});
		}

		building('fantasy', 'house', 8, function (tools) {
			return [tools.Piece('body', [tools.Box(0.96, 0.5, 0.74, [0, 0.25, 0], plaster), tools.Wedge(1.1, 0.36, 0.84, [0, 0.68, 0], tile, [0, 90, 0]), tools.Box(0.18, 0.3, 0.02, [0, 0.15, 0.38], wood), tools.Box(0.16, 0.14, 0.02, [0.3, 0.3, 0.38], [0.3, 0.42, 0.56]), tools.Box(0.16, 0.14, 0.02, [-0.3, 0.3, 0.38], [0.3, 0.42, 0.56]), tools.Box(0.1, 0.34, 0.1, [0.28, 0.82, 0], stone), tools.Box(0.98, 0.04, 0.76, [0, 0.03, 0], stone)])];
		});

		building('fantasy', 'tower', 10, function (tools) {
			var parts = [tools.Lathe([[0.3, 0], [0.26, 0.1], [0.24, 0.84], [0.3, 0.9], [0.3, 1], [0, 1]], [0, 0, 0], stone, 12), tools.Cylinder(0.32, 0, 0.3, [0, 1.15, 0], tile, null, 12), tools.Box(0.14, 0.26, 0.02, [0, 0.13, 0.26], wood)];
			var i;

			for (i = 0; i < 3; i++)
				parts.push(tools.Box(0.05, 0.12, 0.02, [Math.sin(i * 2.1) * 0.245, 0.36 + i * 0.16, Math.cos(i * 2.1) * 0.245], dark, [0, i * 120, 0]));

			return [tools.Piece('body', parts), banner(tools, 0, 1.45, 0)];
		});

		building('fantasy', 'wall', 6, function (tools) {
			var parts = [tools.Box(1, 0.56, 0.24, [0, 0.28, 0], stone)];
			var i;

			for (i = 0; i < 4; i++)
				parts.push(tools.Box(0.14, 0.1, 0.24, [-0.375 + i * 0.25, 0.61, 0], stone));

			return [tools.Piece('body', parts)];
		});

		building('fantasy', 'castle', 26, function (tools) {
			var parts = [tools.Box(0.5, 0.5, 0.5, [0, 0.25, 0], stone), tools.Box(0.12, 0.2, 0.02, [0, 0.1, 0.51], wood)];

			[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (corner) {
				var x = corner[0] * 0.46;
				var z = corner[1] * 0.46;

				parts.push(tools.Lathe([[0.1, 0], [0.09, 0.42], [0.12, 0.46], [0.12, 0.52], [0, 0.52]], [x, 0, z], stone, 10));
				parts.push(tools.Cylinder(0.13, 0, 0.16, [x, 0.6, z], tile, null, 10));
			});

			parts.push(tools.Box(0.92, 0.26, 0.06, [0, 0.13, 0.46], stone), tools.Box(0.92, 0.26, 0.06, [0, 0.13, -0.46], stone), tools.Box(0.06, 0.26, 0.92, [0.46, 0.13, 0], stone), tools.Box(0.06, 0.26, 0.92, [-0.46, 0.13, 0], stone), tools.Box(0.14, 0.2, 0.02, [0, 0.1, 0.495], wood), tools.Cylinder(0.3, 0, 0.26, [0, 0.63, 0], tile, [0, 45, 0], 4));

			return [tools.Piece('body', parts), banner(tools, 0, 0.92, 0)];
		});

		building('fantasy', 'barracks', 12, function (tools) {
			return [tools.Piece('body', [tools.Box(1, 0.36, 0.56, [0, 0.18, 0], wood), tools.Wedge(0.68, 0.22, 1.08, [0, 0.47, 0], [0.42, 0.34, 0.26]), tools.Box(0.2, 0.26, 0.02, [0, 0.13, 0.29], bark), tools.Box(1.04, 0.05, 0.6, [0, 0.025, 0], stone)]), banner(tools, 0.46, 0.5, 0.3)];
		});

		building('fantasy', 'windmill', 12, {Clips: {idle: {Length: 1, Loop: true, Spins: {'sails': [0, 0, 55]}}}, Build: function (tools) {
			var sails = [tools.Cylinder(0.03, 0.03, 0.08, [0, 0.72, 0.28], wood, [90, 0, 0])];
			var i;

			for (i = 0; i < 4; i++) {
				sails.push(tools.Box(0.03, 0.56, 0.02, [Math.sin(i * Math.PI / 2) * 0.28, 0.72 + Math.cos(i * Math.PI / 2) * 0.28, 0.32], wood, [0, 0, -i * 90]));
				sails.push(tools.Box(0.14, 0.42, 0.01, [Math.sin(i * Math.PI / 2) * 0.3 + Math.cos(i * Math.PI / 2) * 0.07, 0.72 + Math.cos(i * Math.PI / 2) * 0.3 - Math.sin(i * Math.PI / 2) * 0.07, 0.33], plaster, [0, 0, -i * 90]));
			}

			return [
				tools.Piece('body', [tools.Lathe([[0.3, 0], [0.24, 0.5], [0.17, 0.72], [0, 0.72]], [0, 0, 0], plaster, 10), tools.Cylinder(0.2, 0, 0.2, [0, 0.82, 0], tile, null, 10), tools.Box(0.12, 0.2, 0.02, [0, 0.1, 0.285], wood)]),
				tools.Piece('sails', sails, {Parent: 'body', Pivot: [0, 0.72, 0.3]})
			];
		}});

		building('scifi', 'hangar', 16, {Matte: false, Build: function (tools) {
			return [tools.Piece('body', [tools.Lathe([[0.5, 0], [0.46, 0.14], [0.34, 0.3], [0.16, 0.4], [0, 0.42]], [0, 0, 0], hull, 12), tools.Box(0.42, 0.22, 0.02, [0, 0.11, 0.47], dark), tools.Box(0.44, 0.015, 0.024, [0, 0.235, 0.47], light), tools.Box(1.1, 0.02, 1.1, [0, 0.01, 0], [0.4, 0.42, 0.46])]), tools.Piece('stripe', [tools.Box(0.46, 0.012, 0.03, [0, 0.27, 0.42], [1, 1, 1])], {Team: true})];
		}});

		building('scifi', 'dome', 12, {Matte: false, Smooth: true, Build: function (tools) {
			return [tools.Piece('body', [tools.Lathe([[0.5, 0], [0.47, 0.17], [0.35, 0.35], [0.17, 0.47], [0, 0.5]], [0, 0.04, 0], [0.56, 0.74, 0.86], 24), tools.Cylinder(0.53, 0.53, 0.05, [0, 0.025, 0], hull, null, 24), tools.Box(0.16, 0.16, 0.2, [0, 0.08, 0.5], dark)])];
		}});

		building('scifi', 'reactor', 12, {Matte: false, Clips: {idle: {Length: 1, Loop: true, Spins: {'rotor': [0, 40, 0]}}}, Build: function (tools) {
			return [
				tools.Piece('body', [tools.Lathe([[0.42, 0], [0.34, 0.08], [0.26, 0.48], [0.3, 0.72], [0.3, 0.74], [0, 0.74]], [0, 0, 0], hull, 12), tools.Cylinder(0.18, 0.18, 0.02, [0, 0.75, 0], [0.8, 2.2, 2.8], null, 12), tools.Box(0.5, 0.02, 0.5, [0, 0.01, 0], dark)]),
				tools.Piece('rotor', [tools.Box(0.8, 0.03, 0.06, [0, 0.36, 0], dark), tools.Box(0.06, 0.03, 0.8, [0, 0.36, 0], dark)], {Parent: 'body', Pivot: [0, 0.36, 0]})
			];
		}});

		building('scifi', 'radar', 8, {Matte: false, Clips: {idle: {Length: 1, Loop: true, Spins: {'dish': [0, 36, 0]}}}, Build: function (tools) {
			return [
				tools.Piece('body', [tools.Lathe([[0.26, 0], [0.2, 0.06], [0.05, 0.14], [0.04, 0.6], [0, 0.6]], [0, 0, 0], hull, 8), tools.Box(0.6, 0.02, 0.6, [0, 0.01, 0], dark)]),
				tools.Piece('dish', [tools.Lathe([[0.02, 0], [0.2, 0.05], [0.42, 0.2]], [0, 0.66, 0], hull, 14), tools.Cylinder(0.012, 0.004, 0.24, [0, 0.76, 0], dark)], {Parent: 'body', Pivot: [0, 0.6, 0]})
			];
		}});

		building('scifi', 'silo', 12, {Matte: false, Build: function (tools) {
			return [tools.Piece('body', [tools.Lathe([[0.2, 0], [0.2, 0.84], [0.14, 0.94], [0, 0.98]], [-0.2, 0, 0], hull, 12), tools.Lathe([[0.2, 0], [0.2, 0.62], [0.14, 0.72], [0, 0.76]], [0.24, 0, 0.1], [0.66, 0.68, 0.72], 12), tools.Box(0.8, 0.02, 0.6, [0, 0.01, 0], dark), tools.Box(0.14, 0.06, 0.06, [0.02, 0.5, 0.02], dark)])];
		}});

		building('scifi', 'gun', 5, {Matte: false, Clips: {
			idle: {Length: 10, Loop: true, Tracks: {'turret': [[0, 0, -60, 0], [0.5, 0, 60, 0], [1, 0, -60, 0]]}},
			attack: {Length: 0.4, Tracks: {'barrel': [[0, 0, 0, 0, 0, 0, 0], [0.15, 0, 0, 0, 0, 0, -0.12], [1, 0, 0, 0, 0, 0, 0]]}}
		}, Build: function (tools) {
			return [
				tools.Piece('body', [tools.Lathe([[0.32, 0], [0.26, 0.1], [0.16, 0.34], [0, 0.34]], [0, 0, 0], dark, 8)]),
				tools.Piece('turret', [tools.Box(0.36, 0.22, 0.4, [0, 0.46, 0], hull)], {Parent: 'body', Pivot: [0, 0.34, 0]}),
				tools.Piece('barrel', [tools.Cylinder(0.03, 0.03, 0.56, [-0.07, 0.48, 0.44], iron, [90, 0, 0]), tools.Cylinder(0.03, 0.03, 0.56, [0.07, 0.48, 0.44], iron, [90, 0, 0])], {Parent: 'turret'}),
				tools.Piece('stripe', [tools.Box(0.2, 0.01, 0.1, [0, 0.575, 0], [1, 1, 1])], {Parent: 'turret', Team: true})
			];
		}});

		function ship (name, size, build) {
			self.Define(name, {Group: 'space', Type: 'ship', Size: size, Matte: false, Smooth: true, Build: build});
		}

		ship('fighter', 0.07, function (tools) {
			return [tools.Piece('body', [tools.Cylinder(0.28, 0, 1.6, [0, 0, 0], hull, [90, 0, 0], 10), tools.Box(1.5, 0.05, 0.5, [0, 0, -0.45], dark), tools.Box(0.06, 0.4, 0.4, [0, 0.2, -0.55], dark), tools.Cylinder(0.1, 0.1, 0.16, [0, 0, -0.85], flame, [90, 0, 0])])];
		});

		ship('cruiser', 0.07, function (tools) {
			return [tools.Piece('body', [tools.Box(0.5, 0.34, 2, [0, 0, 0], hull), tools.Cylinder(0.25, 0, 0.7, [0, 0, 1.35], hull, [90, 0, 0], 10), tools.Box(0.24, 0.3, 0.5, [0, 0.3, -0.3], dark), tools.Box(1.2, 0.06, 0.5, [0, 0, -0.6], dark), tools.Cylinder(0.12, 0.12, 0.2, [0, 0, -1.08], flame, [90, 0, 0])])];
		});

		ship('freighter', 0.07, function (tools) {
			return [tools.Piece('body', [tools.Box(0.8, 0.6, 1.4, [0, 0, 0], dark), tools.Box(0.6, 0.5, 0.5, [0, 0, 0.95], hull), tools.Box(0.36, 0.36, 0.4, [0.22, 0.48, -0.2], hull), tools.Box(0.36, 0.36, 0.4, [-0.22, 0.48, 0.25], hull), tools.Cylinder(0.15, 0.15, 0.2, [0, 0, -0.8], flame, [90, 0, 0])])];
		});
	}
});
