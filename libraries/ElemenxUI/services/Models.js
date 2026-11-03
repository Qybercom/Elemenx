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
 *   A recipe may name a file instead of Build (glb, gltf, fbx or obj: ModelFormats): Define('hero', {URL: 'assets/hero.glb', Type, Size, Speed, Clips: {walk:
 *   'Run'}}) (Clips: the clips of the game and the animations of the file that play them; idle, walk, run, attack, die
 *   and work are found by their names). Load(name, callback) fetches it, (error, model), and Ready(name) tells whether
 *   it came; a model of a file stands on the ground and is 1 tall, as the others are. Make of one not come yet is null. Apart,
 *   a word of the name of a material or a node, cuts what a file keeps as one piece at its wide gaps: four wheels in one mesh.
 *   Bake(model) makes the moves of its skeletons an array of frames, for a shader that reads them. Soft (0 to 1, or
 *   {material: value}) lets light under its surface, as in skin. Surfaces(model) is its geometry material by material.
 * - The Lamps of a model of a file are what shines in it (BuiltLamps): a GameScene lights its world with them.
 * - BoneMatrix(model, bone, clip, time): the matrix of a bone at a second of a clip; Grip(bone, aim): where a thing in a hand stands.
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
		Methods: ['Names(filter)', 'Has(name)', 'Info(name)', 'Define(name, recipe)', 'Load(name, callback)', 'Ready(name)', 'Bake(model)', 'Make(name, options)', 'Surfaces(model)', 'Whole(model)', 'Bounds(geometry)', 'Levels(name, options)', 'Pose(model, clip, time, options)', 'Length(model, clip)']
	},

	$OnCreate: function () {
		this.Recipes = {};
		this.Made = {};

		this.Builtin();
	},

	Define: function (name, recipe) {
		var made = this.Made;

		if (!name || !recipe || typeof recipe.Build !== 'function' && !recipe.URL)
			throw new Error('Elemenx Models: Define expects (name, {Build}) or (name, {URL})');

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

	/* Whether a model is made of code, or of a file that came. */
	Ready: function (name) {
		var recipe = this.Recipes[name];

		return !!recipe && (!recipe.URL || !!recipe.Asset);
	},

	Load: function (name, callback) {
		var self = this;
		var recipe = this.Recipes[name];
		var done = callback || function () {};

		if (!recipe || !recipe.URL) {
			done(recipe ? null : new Error('Elemenx Models: unknown model ' + name), recipe ? this.Make(name) : null);

			return;
		}

		if (recipe.Asset) {
			done(null, this.Make(name));

			return;
		}

		recipe.Waiting = recipe.Waiting || [];

		recipe.Waiting.push(done);

		if (recipe.Waiting.length > 1) return;

		this.$Service('ModelFormats').Load(recipe.URL, function (error, asset) {
			/* Clips of other files (Motions: {clip: URL or {URL, Stride, Held}}) come before the model is said to be ready. */
			var motions = Object.keys(recipe.Motions || {});
			var left = motions.length;

			function ready () {
				var waiting = recipe.Waiting;

				recipe.Waiting = null;
				recipe.Asset = asset;

				if (error)
					recipe.Failed = error;

				waiting.forEach(function (each) {
					each(error, error ? null : self.Make(name));
				});
			}

			if (error || !left) {
				ready();

				return;
			}

			asset.Motions = {};

			motions.forEach(function (clip) {
				var given = recipe.Motions[clip];

				self.$Service('Fbx').Load(typeof given === 'string' ? given : given.URL, function (failed, source) {
					var made = failed ? null : self.Retarget(asset, source, clip, given);
					if (made)
						asset.Motions[clip] = {Animation: made, Stride: given.Stride || 1};

					left--;

					if (!left)
						ready();
				});
			});
		});
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

		if (recipe.URL) {
			if (!recipe.Asset) return null;

			this.Made[key] = this.FromFile(name, key, recipe);

			return this.Made[key];
		}

		pieces = recipe.Build(this.Tools(), this.Random(name + ':' + variant)).map(function (piece) {
			var geometry = graphics.Merge(piece.Parts);

			return {ID: piece.ID, Parent: piece.Parent || '', Pivot: piece.Pivot || [0, 0, 0], Team: !!piece.Team, Geometry: recipe.Smooth ? geometry : graphics.Facets(geometry)};
		});

		this.Made[key] = {Name: name, Key: key, Group: recipe.Group || '', Type: recipe.Type || '', Size: recipe.Size || 1, Speed: recipe.Speed || 0, Sway: recipe.Sway || 0, Matte: recipe.Matte !== false, Clips: recipe.Clips || {}, Pieces: pieces};

		return this.Made[key];
	},

	Whole: function (model) {
		var graphics = this.$Service('Graphics3D');

		return graphics.Merge(model.Pieces.map(function (piece) {
			return piece.Rest ? {Geometry: piece.Placed || piece.Geometry, Matrix: piece.Rest} : {Geometry: piece.Geometry};
		}));
	},

	/* A model of a file standing still, one geometry for each material: for what is sown near the eye. */
	Surfaces: function (model) {
		var graphics = this.$Service('Graphics3D');
		var soft = model.Soft;
		var list = [];

		model.Pieces.forEach(function (piece) {
			var made = list.filter(function (each) {
				return each.Material === piece.Material;
			})[0];

			if (!made) {
				made = {Material: piece.Material, Asset: model.Asset, Parts: [], Soft: typeof soft === 'number' ? soft : soft && soft[piece.Material.Name] || 0};

				list.push(made);
			}

			made.Parts.push({Geometry: piece.Placed || piece.Geometry, Matrix: piece.Rest});
		});

		return list.map(function (each) {
			each.Geometry = graphics.Merge(each.Parts);

			return each;
		});
	},

	/* The matrix of a node in the model, by its translation, rotation and scale. */
	NodeMatrix: function (t, r, s) {
		var x = r[0];
		var y = r[1];
		var z = r[2];
		var w = r[3];

		return [
			(1 - 2 * (y * y + z * z)) * s[0], 2 * (x * y + z * w) * s[0], 2 * (x * z - y * w) * s[0], 0,
			2 * (x * y - z * w) * s[1], (1 - 2 * (x * x + z * z)) * s[1], 2 * (y * z + x * w) * s[1], 0,
			2 * (x * z + y * w) * s[2], 2 * (y * z - x * w) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0,
			t[0], t[1], t[2], 1
		];
	},

	/* What a node of an asset is at a second of an animation: its translation, rotation and scale. */
	Sample: function (asset, animation, time) {
		var pose = asset.Nodes.map(function (node) {
			return {T: node.Translation, R: node.Rotation, S: node.Scale};
		});

		if (animation) {
			animation.Channels.forEach(function (channel) {
				var size = channel.Size;
				var times = channel.Times;
				var last = times.length - 1;
				var at = 0;
				var t = 0;
				var step = channel.Cubic ? 3 : 1;
				var skip = channel.Cubic ? size : 0;
				var value = [];
				var i;

				while (at < last && time >= times[at + 1])
					at++;

				if (at < last && !channel.Step)
					t = Math.max(0, Math.min(1, (time - times[at]) / (times[at + 1] - times[at])));

				for (i = 0; i < size; i++)
					value.push(channel.Values[at * step * size + skip + i]);

				if (t) {
					var next = [];
					var dot = 0;

					for (i = 0; i < size; i++) {
						next.push(channel.Values[(at + 1) * step * size + skip + i]);

						dot += value[i] * next[i];
					}

					/* A rotation goes the short way. */
					if (channel.Path === 'rotation' && dot < 0) {
						next = next.map(function (each) {
							return -each;
						});
					}

					value = value.map(function (each, index) {
						return each + (next[index] - each) * t;
					});

					if (channel.Path === 'rotation') {
						var length = Math.sqrt(value[0] * value[0] + value[1] * value[1] + value[2] * value[2] + value[3] * value[3]) || 1;

						value = value.map(function (each) {
							return each / length;
						});
					}
				}

				if (channel.Path === 'translation') pose[channel.Node].T = value;
				else if (channel.Path === 'rotation') pose[channel.Node].R = value;
				else if (channel.Path === 'scale') pose[channel.Node].S = value;
			});
		}

		return pose;
	},

	/* The matrices of the nodes in a pose: each in its parent, the parents first whatever their order. */
	NodeWorld: function (asset, pose, root) {
		var self = this;
		var graphics = this.$Service('Graphics3D');
		var world = [];

		function visit (index, parent) {
			var each = pose[index];

			world[index] = graphics.Multiply(parent, self.NodeMatrix(each.T, each.R, each.S));

			asset.Nodes[index].Children.forEach(function (child) {
				visit(child, world[index]);
			});
		}

		asset.Scene.forEach(function (index) {
			visit(index, root);
		});

		return world;
	},

	/* A model of a file: a piece of each primitive of its nodes, standing on the ground, 1 tall. */
	FromFile: function (name, key, recipe) {
		var self = this;
		var graphics = this.$Service('Graphics3D');
		var asset = recipe.Asset;
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), graphics.Identity());
		var box = {Low: [Infinity, Infinity, Infinity], High: [-Infinity, -Infinity, -Infinity]};
		var pieces = [];
		var joints = 0;

		/* Materials of a recipe, {word of a name: what to change of it}: a look of the file a game does not want. */
		Object.keys(recipe.Materials || {}).forEach(function (word) {
			asset.Materials.forEach(function (material) {
				if (new RegExp(word).test(material.Name))
					Object.assign(material, recipe.Materials[word]);
			});
		});

		var offsets = asset.Skins.map(function (skin) {
			var start = joints;

			joints += skin.Joints.length;

			return start;
		});
		var binds = asset.Skins.map(function (skin) {
			return skin.Joints.map(function (joint, index) {
				return graphics.Multiply(rest[joint], self.InverseOf(skin, index));
			});
		});
		var fit;
		var model;
		var scale;

		asset.Nodes.forEach(function (node, index) {
			if (node.Mesh === -1 || recipe.Without && new RegExp(recipe.Without, 'i').test(node.Name)) return;

			asset.Meshes[node.Mesh].forEach(function (primitive, part) {
				var material = asset.Materials[primitive.Material] || asset.Materials[0];
				var held = node.Skin === -1 && asset.Skins.length && !recipe.Merge && self.Loose(asset, index) ? self.Held(primitive.Geometry, rest[index], binds, asset, rest) : null;
				var skinned = !!held || node.Skin !== -1 && !!primitive.Geometry.Joints;
				var skin = held ? held.Skin : node.Skin;
				var geometry = self.Painted(held ? held.Geometry : primitive.Geometry, material, asset);
				var matrix = skinned ? graphics.Identity() : rest[index];
				var placed = skinned ? self.Placed(geometry, binds[skin]) : null;
				var seen = placed || geometry;
				var i;

				for (i = 0; i < seen.Positions.length; i += 3) {
					var point = graphics.Apply(matrix, [seen.Positions[i], seen.Positions[i + 1], seen.Positions[i + 2]]);

					[0, 1, 2].forEach(function (axis) {
						box.Low[axis] = Math.min(box.Low[axis], point[axis]);
						box.High[axis] = Math.max(box.High[axis], point[axis]);
					});
				}

				pieces.push({ID: 'node-' + index + '-' + part, Parent: '', Pivot: [0, 0, 0], Team: false, Geometry: geometry, Material: material, Node: index, Skin: skinned ? skin : -1, JointOffset: skinned ? offsets[skin] : 0, Rest: matrix, Placed: placed});
			});
		});

		scale = 1 / Math.max(box.High[1] - box.Low[1], 0.0001);

		if (recipe.Fit === false) {
			fit = graphics.Identity();
		}
		else {
			/* A body stands on its hips: what trails behind it is no reason to turn round another point. */
			var hips = this.HipsOf(asset);

			fit = graphics.Multiply(graphics.Scaling(scale, scale, scale), graphics.Translation(hips === -1 ? -(box.Low[0] + box.High[0]) / 2 : -rest[hips][12], -box.Low[1], hips === -1 ? -(box.Low[2] + box.High[2]) / 2 : -rest[hips][14]));
		}

		pieces.forEach(function (piece) {
			piece.Rest = graphics.Multiply(fit, piece.Rest);
		});

		if (recipe.Apart)
			pieces = this.Apart(asset, pieces, new RegExp(recipe.Apart));

		var lamps = this.BuiltLamps(asset, pieces, rest, fit, Math.max(box.High[0] - box.Low[0], box.High[1] - box.Low[1], box.High[2] - box.Low[2]) * (recipe.Fit === false ? 1 : scale));

		if (recipe.Merge)
			pieces = this.Merged(pieces);

		model = {Lamps: lamps, Name: name, Key: key, Group: recipe.Group || '', Type: recipe.Type || '', Size: recipe.Size || 1, Speed: recipe.Speed || 0, Sway: recipe.Sway || 0, Matte: false, Soft: recipe.Soft || 0, Clips: this.ClipsOf(asset, recipe), Pieces: pieces, Asset: asset, Fit: fit, Joints: joints, Moves: asset.Animations.length > 0};

		return model;
	},

	/* What a file keeps as one piece and stands apart, such as four wheels in one mesh: cut at the wide gaps across and along it. */
	Apart: function (asset, pieces, word) {
		var graphics = this.$Service('Graphics3D');
		var out = [];

		function gapOf (values) {
			var sorted = values.slice().sort(function (a, b) {
				return a - b;
			});
			var best = 0;
			var at = Infinity;
			var i;

			for (i = 1; i < sorted.length; i++) {
				if (sorted[i] - sorted[i - 1] > best) {
					best = sorted[i] - sorted[i - 1];
					at = (sorted[i] + sorted[i - 1]) / 2;
				}
			}

			return best > (sorted[sorted.length - 1] - sorted[0]) * 0.15 ? at : Infinity;
		}

		/* A part with the corners of its own, so that all that reads it finds it where it stands. */
		function partOf (geometry, indices) {
			var count = geometry.Positions.length / 3;
			var places = {};
			var kept = [];
			var part = {};

			var own = indices.map(function (index) {
				if (places[index] === undefined) {
					places[index] = kept.length;

					kept.push(index);
				}

				return places[index];
			});

			Object.keys(geometry).forEach(function (name) {
				var value = geometry[name];
				var size = value && value.length ? value.length / count : 0;

				part[name] = value;

				if (name === 'Indices' || !size || size !== Math.floor(size)) return;

				part[name] = new value.constructor(kept.length * size);

				kept.forEach(function (index, place) {
					var i;

					for (i = 0; i < size; i++)
						part[name][place * size + i] = value[index * size + i];
				});
			});

			part.Indices = Array.isArray(geometry.Indices) ? own : new geometry.Indices.constructor(own);

			return part;
		}

		pieces.forEach(function (piece) {
			var geometry = piece.Geometry;
			var count = geometry.Indices ? geometry.Indices.length : 0;
			var across = [];
			var along = [];
			var groups = {};
			var i;

			if (!count || piece.Skin !== -1 || !word.test(piece.Material ? piece.Material.Name : '') && !word.test(asset.Nodes[piece.Node].Name)) {
				out.push(piece);

				return;
			}

			for (i = 0; i < count; i += 3) {
				var a = geometry.Indices[i] * 3;
				var b = geometry.Indices[i + 1] * 3;
				var c = geometry.Indices[i + 2] * 3;
				var middle = graphics.Apply(piece.Rest, [0, 1, 2].map(function (axis) {
					return (geometry.Positions[a + axis] + geometry.Positions[b + axis] + geometry.Positions[c + axis]) / 3;
				}));

				across.push(middle[0]);
				along.push(middle[2]);
			}

			var side = gapOf(across);
			var end = gapOf(along);

			for (i = 0; i < across.length; i++) {
				var key = (across[i] > side ? 'r' : 'l') + (along[i] > end ? 'f' : 'b');

				groups[key] = groups[key] || [];

				groups[key].push(geometry.Indices[i * 3], geometry.Indices[i * 3 + 1], geometry.Indices[i * 3 + 2]);
			}

			Object.keys(groups).forEach(function (key) {
				out.push(Object.assign({}, piece, {ID: piece.ID + '-' + key, Geometry: partOf(geometry, groups[key])}));
			});
		});

		return out;
	},

	/*
	 * What shines in a model, as lamps in its own space {Place, Color, Power, Radius, Spot, Aim}: the lights of its file, and
	 * its surfaces that glow, gathered by where they stand, a lamp for each gathering, as strong as what glows there. What
	 * a skeleton moves is left to its own glow, and so is a sun of a file: the sky has its own.
	 */
	BuiltLamps: function (asset, pieces, rest, fit, extent) {
		var self = this;
		var graphics = this.$Service('Graphics3D');
		var vectors = graphics.Vectors;
		var cell = Math.max(extent, 1e-3) / 24;
		var cells = {};
		var lamps = [];

		asset.Nodes.forEach(function (node, index) {
			var light = node.Light === undefined || node.Light === -1 ? null : asset.Lights[node.Light];
			var world;

			if (!light || light.Type === 'directional') return;

			world = graphics.Multiply(fit, rest[index]);

			lamps.push({Place: [world[12], world[13], world[14]], Color: light.Color, Power: Math.min(3, 0.05 + light.Intensity * 0.02), Radius: light.Range ? light.Range * Math.hypot(fit[0], fit[1], fit[2]) : cell * 6, Spot: light.Type === 'spot' ? light.Outer * 180 / Math.PI : 0, Aim: vectors.Normalize([-world[8], -world[9], -world[10]]), Energy: Infinity});
		});

		pieces.forEach(function (piece) {
			var glow = piece.Material.Emissive || [0, 0, 0];
			var map = piece.Material.EmissiveMap ? self.Tiny(asset.Images[piece.Material.EmissiveMap.Image]) : null;
			var geometry = piece.Geometry;
			var count = geometry.Indices ? geometry.Indices.length : geometry.Positions.length / 3;
			var i;

			if (piece.Skin !== -1 || glow[0] + glow[1] + glow[2] < 0.02 || piece.Material.EmissiveMap && !map) return;

			function corner (at) {
				var index = geometry.Indices ? geometry.Indices[at] : at;

				return graphics.Apply(piece.Rest, [geometry.Positions[index * 3], geometry.Positions[index * 3 + 1], geometry.Positions[index * 3 + 2]]);
			}

			for (i = 0; i + 2 < count; i += 3) {
				var a = corner(i);
				var b = corner(i + 1);
				var c = corner(i + 2);
				var area = vectors.Length(vectors.Cross(vectors.Subtract(b, a), vectors.Subtract(c, a))) / 2;
				var seen = glow;

				if (map && geometry.UVs) {
					var index = geometry.Indices ? geometry.Indices[i] : i;
					var u = ((geometry.UVs[index * 2] % 1) + 1) % 1;
					var v = ((geometry.UVs[index * 2 + 1] % 1) + 1) % 1;
					var texel = (Math.floor(v * map.Size) * map.Size + Math.floor(u * map.Size)) * 4;

					seen = [glow[0] * map.Data[texel] / 255, glow[1] * map.Data[texel + 1] / 255, glow[2] * map.Data[texel + 2] / 255];
				}

				var strength = Math.max(seen[0], seen[1], seen[2]);

				if (strength > 0.15 && area > 0) {
					var place = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
					var key = Math.floor(place[0] / cell) + ':' + Math.floor(place[1] / cell) + ':' + Math.floor(place[2] / cell);
					var one = cells[key] = cells[key] || {Sum: [0, 0, 0], Tint: [0, 0, 0], Area: 0};
					var weight = area * strength;

					one.Sum = [one.Sum[0] + place[0] * weight, one.Sum[1] + place[1] * weight, one.Sum[2] + place[2] * weight];
					one.Tint = [one.Tint[0] + seen[0] * area, one.Tint[1] + seen[1] * area, one.Tint[2] + seen[2] * area];
					one.Area += area;
					one.Weight = (one.Weight || 0) + weight;
				}
			}
		});

		Object.keys(cells).forEach(function (key) {
			var one = cells[key];
			var top = Math.max(one.Tint[0], one.Tint[1], one.Tint[2]) || 1;

			lamps.push({Place: [one.Sum[0] / one.Weight, one.Sum[1] / one.Weight, one.Sum[2] / one.Weight], Color: [one.Tint[0] / top, one.Tint[1] / top, one.Tint[2] / top], Power: Math.min(1.2, 0.12 + Math.sqrt(one.Weight) / cell * 0.6), Radius: cell * 3 + Math.sqrt(one.Area) * 2, Spot: 0, Aim: [0, -1, 0], Energy: one.Weight});
		});

		return lamps.sort(function (a, b) {
			return b.Energy - a.Energy;
		}).slice(0, 64);
	},

	/* A picture in a few pixels, to read: its bytes by rows of Size; null with no page or no picture. */
	Tiny: function (image) {
		var size = 32;
		var context;
		var canvas;

		if (image && image.Tiny) return image.Tiny;

		if (!image || !image.Picture || typeof document === 'undefined') return null;

		canvas = document.createElement('canvas');
		canvas.width = canvas.height = size;
		context = canvas.getContext('2d', {willReadFrequently: true});

		if (!context) return null;

		context.drawImage(image.Picture, 0, 0, size, size);

		image.Tiny = {Size: size, Data: context.getImageData(0, 0, size, size).data};

		return image.Tiny;
	},

	/* The geometry of a primitive with the color of its material in its corners: for what is far, and has no pictures. */
	Painted: function (geometry, material, asset) {
		var image = material.ColorMap ? asset.Images[material.ColorMap.Image] : null;
		var mean = image && image.Mean ? image.Mean : [1, 1, 1];
		var color = [material.BaseColor[0] * mean[0], material.BaseColor[1] * mean[1], material.BaseColor[2] * mean[2]];
		var count = geometry.Positions.length / 3;
		var colors = new Array(count * 3);
		var i;

		for (i = 0; i < count; i++) {
			colors[i * 3] = color[0] * (geometry.Colors ? geometry.Colors[i * 3] : 1);
			colors[i * 3 + 1] = color[1] * (geometry.Colors ? geometry.Colors[i * 3 + 1] : 1);
			colors[i * 3 + 2] = color[2] * (geometry.Colors ? geometry.Colors[i * 3 + 2] : 1);
		}

		return Object.assign({}, geometry, {Colors: colors});
	},

	/* The inverse of the place a joint of a skin was bound at. */
	InverseOf: function (skin, index) {
		return skin.Inverse ? Array.prototype.slice.call(skin.Inverse, index * 16, index * 16 + 16) : this.$Service('Graphics3D').Identity();
	},

	/*
	 * What a bone of a role is called in skeletons of other tools: the word of the limb with its side on either end (L_Knee,
	 * bip_upperArm_L, arm1l). A sidekick of the role, as a skeleton with its own names; null for a role with no word.
	 */
	BoneWord: function (role) {
		var words = {Thigh: 'hip|thigh|leg1', Calf: 'knee|calf|leg2', Foot: 'foot1|foot', Toe: 'toe|foot2', Shoulder: 'clavicle|collar', Arm: 'upper[ _.]*arm|arm1|shoulder', Fore: 'lower[ _.]*arm|elbow|arm2', Hand: 'hand'};
		var found = /^(Thigh|Calf|Foot|Toe|Shoulder|Arm|Fore|Hand)([LR])$/.exec(role);

		if (role === 'Head')
			return /(^|[ _.:-])head(_\d+)?$/i;

		var spine = {Spine: 'spine_0', Spine1: 'spine_1', Spine2: 'spine_2'}[role];
		if (spine)
			return new RegExp(spine, 'i');

		if (!found)
			return null;

		var side = found[2].toLowerCase();
		var word = words[found[1]];

		return new RegExp('(^|[ _.-])' + side + '[ _.-]*(' + word + ')([ _.-]|\\d|$)|(^|[ _.-])(' + word + ')[ _.-]*' + side + '([ _.-]|\\d|$)', 'i');
	},

	/* The bone of the hips of a skeleton, by its name: -1 with none. */
	HipsOf: function (asset) {
		var found = -1;

		asset.Skins.forEach(function (skin) {
			skin.Joints.forEach(function (joint) {
				if (found === -1 && /pelvis|hips/i.test(asset.Nodes[joint].Name) && !/sfx/i.test(asset.Nodes[joint].Name))
					found = joint;
			});
		});

		return found;
	},

	/* Nothing moves a node: no clip, no bone above it, and no clip above it. */
	Loose: function (asset, index) {
		var moved = {};
		var at = index;

		asset.Skins.forEach(function (skin) {
			skin.Joints.forEach(function (joint) {
				moved[joint] = true;
			});
		});

		asset.Animations.forEach(function (clip) {
			clip.Channels.forEach(function (channel) {
				moved[channel.Node] = true;
			});
		});

		while (at !== -1 && at !== undefined) {
			if (moved[at]) return false;

			at = asset.Nodes[at].Parent;
		}

		return true;
	},

	/*
	 * A piece of a skinned model that no skin holds, as the eyes of a body often are: it goes with the bone nearest to it,
	 * or a clip leaves it hanging where the body stood. The same piece, in the terms of that bone, and the skin of the bone.
	 */
	Held: function (geometry, matrix, binds, asset, rest) {
		var graphics = this.$Service('Graphics3D');
		var count = geometry.Positions.length / 3;
		var middle = [0, 0, 0];
		var nearest = Infinity;
		var skin = 0;
		var joint = 0;
		var i;

		for (i = 0; i < count; i++) {
			var point = graphics.Apply(matrix, [geometry.Positions[i * 3], geometry.Positions[i * 3 + 1], geometry.Positions[i * 3 + 2]]);

			middle[0] += point[0] / count;
			middle[1] += point[1] / count;
			middle[2] += point[2] / count;
		}

		asset.Skins.forEach(function (each, one) {
			each.Joints.forEach(function (node, index) {
				var at = rest[node];
				var apart = (at[12] - middle[0]) * (at[12] - middle[0]) + (at[13] - middle[1]) * (at[13] - middle[1]) + (at[14] - middle[2]) * (at[14] - middle[2]);

				if (apart < nearest) {
					nearest = apart;
					skin = one;
					joint = index;
				}
			});
		});

		var to = graphics.Multiply(graphics.Invert(binds[skin][joint]), matrix);
		var positions = new Float32Array(count * 3);
		var normals = geometry.Normals ? new Float32Array(count * 3) : null;
		var joints = new Uint16Array(count * 4);
		var weights = new Float32Array(count * 4);

		for (i = 0; i < count; i++) {
			var x = geometry.Positions[i * 3];
			var y = geometry.Positions[i * 3 + 1];
			var z = geometry.Positions[i * 3 + 2];

			positions[i * 3] = to[0] * x + to[4] * y + to[8] * z + to[12];
			positions[i * 3 + 1] = to[1] * x + to[5] * y + to[9] * z + to[13];
			positions[i * 3 + 2] = to[2] * x + to[6] * y + to[10] * z + to[14];
			joints[i * 4] = joint;
			weights[i * 4] = 1;

			if (normals) {
				normals[i * 3] = to[0] * geometry.Normals[i * 3] + to[4] * geometry.Normals[i * 3 + 1] + to[8] * geometry.Normals[i * 3 + 2];
				normals[i * 3 + 1] = to[1] * geometry.Normals[i * 3] + to[5] * geometry.Normals[i * 3 + 1] + to[9] * geometry.Normals[i * 3 + 2];
				normals[i * 3 + 2] = to[2] * geometry.Normals[i * 3] + to[6] * geometry.Normals[i * 3 + 1] + to[10] * geometry.Normals[i * 3 + 2];
			}
		}

		return {Skin: skin, Geometry: Object.assign({}, geometry, {Positions: positions, Normals: normals || geometry.Normals, Joints: joints, Weights: weights})};
	},

	/*
	 * A skinned geometry where its skeleton holds it at rest. Its own numbers can be anything (an export from Z up in
	 * centimetres): only the skeleton says how tall a model is and where it stands, so that is what it is measured by.
	 */
	Placed: function (geometry, binds) {
		var positions = new Float32Array(geometry.Positions.length);
		var normals = geometry.Normals ? new Float32Array(geometry.Normals.length) : null;
		var count = positions.length / 3;
		var i;
		var j;
		var axis;

		for (i = 0; i < count; i++) {
			var x = geometry.Positions[i * 3];
			var y = geometry.Positions[i * 3 + 1];
			var z = geometry.Positions[i * 3 + 2];

			for (j = 0; j < 4; j++) {
				var weight = geometry.Weights[i * 4 + j];
				var m = binds[geometry.Joints[i * 4 + j]];

				if (!weight) continue;

				for (axis = 0; axis < 3; axis++) {
					positions[i * 3 + axis] += weight * (m[axis] * x + m[4 + axis] * y + m[8 + axis] * z + m[12 + axis]);

					if (normals)
						normals[i * 3 + axis] += weight * (m[axis] * geometry.Normals[i * 3] + m[4 + axis] * geometry.Normals[i * 3 + 1] + m[8 + axis] * geometry.Normals[i * 3 + 2]);
				}
			}

			if (normals) {
				var size = Math.sqrt(normals[i * 3] * normals[i * 3] + normals[i * 3 + 1] * normals[i * 3 + 1] + normals[i * 3 + 2] * normals[i * 3 + 2]) || 1;

				normals[i * 3] /= size;
				normals[i * 3 + 1] /= size;
				normals[i * 3 + 2] /= size;
			}
		}

		return Object.assign({}, geometry, {Positions: positions, Normals: normals || geometry.Normals});
	},

	/* The clips of a file: named by the recipe, or found in the names of its animations. */
	ClipsOf: function (asset, recipe) {
		var clips = {};
		var named = recipe.Clips || {};
		var gait;
		var look = {idle: /idle|stand|breath/i, walk: /walk/i, run: /run|sprint/i, attack: /attack|shoot|slash|punch/i, die: /die|death|dead/i, work: /work|gather|build/i};

		function add (name, animation) {
			clips[name] = {Length: animation.Length || 1, Loop: !/^(attack|die|cast|jump)$/.test(name), Hold: name === 'die', Stride: recipe.Stride || 1, Animation: animation};
		}

		asset.Animations.forEach(function (animation) {
			var key = animation.Name;

			add(key, animation);

			Object.keys(look).forEach(function (name) {
				if (look[name].test(key) && !clips[name])
					add(name, animation);
			});
		});

		Object.keys(named).forEach(function (name) {
			asset.Animations.forEach(function (animation) {
				if (animation.Name === named[name])
					add(name, animation);
			});
		});

		/* The only clip of a file, with a name that says nothing, is what the model does by itself. */
		if (asset.Animations.length === 1 && Object.keys(clips).length === 1)
			add('idle', asset.Animations[0]);

		if (!clips.walk && clips.run)
			clips.walk = clips.run;

		Object.keys(asset.Motions || {}).forEach(function (clip) {
			add(clip, asset.Motions[clip].Animation);

			clips[clip].Stride = asset.Motions[clip].Stride;
		});

		/* A skeleton that came with no way of walking gets one, made from its bones. */
		gait = (!clips.walk || !clips.idle) && recipe.Gait !== false ? this.Gait(asset) : null;

		if (gait) {
			if (!clips.walk) {
				add('walk', gait.Walk);

				clips.walk.Stride = recipe.Stride || 1.3;
			}

			if (!clips.idle)
				add('idle', gait.Idle);
		}

		return clips;
	},

	/*
	 * A clip of another skeleton on this one (source: Fbx.Parse): bones are matched by what they are, not by their names.
	 * Each turns in the world as its fellow turns from rest; first the bone is laid along its fellow, for a model that stands
	 * in another pose. The hips go up and down in the proportion of the legs, and the clip stays on the spot.
	 * Options: Held (the hands of the clip hold something: its arms are taken as they are, with the fingers), Calm ({role: how much of the
	 * move of that bone is kept, 0 to 1}: a clip made gentler for a body it asks too much of).
	 */
	Retarget: function (asset, source, name, options) {
		var self = this;
		var fbx = this.$Service('Fbx');
		var graphics = this.$Service('Graphics3D');
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), graphics.Identity());
		var degrees = Math.PI / 180;
		var joints = {};
		var roles = [
			['Hips', /hips$/i, /pelvis|hips/i], ['Spine', /spine$/i, /\bspine(_|$)/i], ['Spine1', /spine1$/i, /spine1/i], ['Spine2', /spine2$/i, /spine2/i], ['Neck', /neck$/i, /neck/i], ['Head', /head$/i, /head(_|$)/i],
			['ShoulderL', /leftshoulder$/i, /\bL[ _.]*Clavicle|left[ _.]*shoulder/i], ['ArmL', /leftarm$/i, /\bL[ _.]*Upper[ _.]*Arm|left[ _.]*arm(?!.*fore)/i], ['ForeL', /leftforearm$/i, /\bL[ _.]*Fore[ _.]*arm|left[ _.]*fore[ _.]*arm/i], ['HandL', /lefthand$/i, /\bL[ _.]*Hand|left[ _.]*hand/i],
			['ShoulderR', /rightshoulder$/i, /\bR[ _.]*Clavicle|right[ _.]*shoulder/i], ['ArmR', /rightarm$/i, /\bR[ _.]*Upper[ _.]*Arm|right[ _.]*arm(?!.*fore)/i], ['ForeR', /rightforearm$/i, /\bR[ _.]*Fore[ _.]*arm|right[ _.]*fore[ _.]*arm/i], ['HandR', /righthand$/i, /\bR[ _.]*Hand|right[ _.]*hand/i],
			['ThighL', /leftupleg$/i, /\bL[ _.]*Thigh|left[ _.]*up[ _.]*leg/i], ['CalfL', /leftleg$/i, /\bL[ _.]*Calf|left[ _.]*leg(?!.*up)/i], ['FootL', /leftfoot$/i, /\bL[ _.]*Foot|left[ _.]*foot/i], ['ToeL', /lefttoebase$/i, /\bL[ _.]*Toe0|left[ _.]*toe/i],
			['ThighR', /rightupleg$/i, /\bR[ _.]*Thigh|right[ _.]*up[ _.]*leg/i], ['CalfR', /rightleg$/i, /\bR[ _.]*Calf|right[ _.]*leg(?!.*up)/i], ['FootR', /rightfoot$/i, /\bR[ _.]*Foot|right[ _.]*foot/i], ['ToeR', /righttoebase$/i, /\bR[ _.]*Toe0|right[ _.]*toe/i]
		];
		var next = {Hips: 'Spine', Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head', ShoulderL: 'ArmL', ArmL: 'ForeL', ForeL: 'HandL', ThighL: 'CalfL', CalfL: 'FootL', FootL: 'ToeL', ShoulderR: 'ArmR', ArmR: 'ForeR', ForeR: 'HandR', ThighR: 'CalfR', CalfR: 'FootR', FootR: 'ToeR'};
		var pairs = {};
		var order = [];
		var held = !!(options && options.Held);
		var followers = {};

		asset.Skins.forEach(function (skin) {
			skin.Joints.forEach(function (joint) {
				joints[joint] = true;
			});
		});

		function times (a, b) {
			return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
		}

		function back (q) {
			return [-q[0], -q[1], -q[2], q[3]];
		}

		function round (axis, angle) {
			var s = Math.sin(angle / 2);

			return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
		}

		function turned (q, v) {
			var r = times(times(q, [v[0], v[1], v[2], 0]), back(q));

			return [r[0], r[1], r[2]];
		}

		function unit (v) {
			var size = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;

			return [v[0] / size, v[1] / size, v[2] / size];
		}

		function cross (a, b) {
			return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
		}

		/* The turn that takes a direction to another. */
		function between (a, b) {
			var axis = cross(a, b);
			var size = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);

			return size < 1e-5 ? [0, 0, 0, 1] : round(unit(axis), Math.atan2(size, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
		}

		function euler (v) {
			return times(times(round([0, 0, 1], v[2] * degrees), round([0, 1, 0], v[1] * degrees)), round([1, 0, 0], v[0] * degrees));
		}

		/* The bones of the source at a second: their turns in the world, and where they stand. */
		function pose (time) {
			var turns = [];
			var places = [];

			function bone (index) {
				var one = source.Bones[index];
				var curves = time === null ? {} : source.Curves[index] || {};
				var r = curves.R || [];
				var t = curves.T || [];
				var local = times(euler(one.Pre), euler([fbx.Sample(r[0], time, one.Rotation[0]), fbx.Sample(r[1], time, one.Rotation[1]), fbx.Sample(r[2], time, one.Rotation[2])]));
				var move = [fbx.Sample(t[0], time, one.Translation[0]), fbx.Sample(t[1], time, one.Translation[1]), fbx.Sample(t[2], time, one.Translation[2])];
				var parent = one.Parent;

				if (turns[index]) return;

				if (parent !== -1)
					bone(parent);

				turns[index] = parent === -1 ? local : times(turns[parent], local);

				var from = parent === -1 ? [0, 0, 0] : turned(turns[parent], move);

				places[index] = parent === -1 ? move : [places[parent][0] + from[0], places[parent][1] + from[1], places[parent][2] + from[2]];
			}

			source.Bones.forEach(function (one, index) {
				bone(index);
			});

			return {Turns: turns, Places: places};
		}

		function worldTurn (index) {
			var node = asset.Nodes[index];

			return node.Parent === -1 ? node.Rotation : times(worldTurn(node.Parent), node.Rotation);
		}

		function at (index) {
			return [rest[index][12], rest[index][13], rest[index][14]];
		}

		roles.forEach(function (role) {
			var from = source.Bones.map(function (bone, index) {
				return role[1].test(bone.Name) ? index : -1;
			}).filter(function (index) {
				return index !== -1;
			})[0];
			var bones = Object.keys(joints).filter(function (index) {
				return !/(^|_)IK|Target|Twst|Ndl|_end|sfx/i.test(asset.Nodes[index].Name);
			});
			var to = bones.filter(function (index) {
				return role[2].test(asset.Nodes[index].Name.replace(/-/g, ' '));
			})[0];
			var other = self.BoneWord(role[0]);
			if (to === undefined && other)
				to = bones.filter(function (index) {
					return other.test(asset.Nodes[index].Name) && !/twist/i.test(asset.Nodes[index].Name);
				})[0];

			if (from !== undefined && to !== undefined)
				pairs[role[0]] = {From: from, To: Number(to)};
		});

		if (!pairs.Hips || !pairs.ThighL || !pairs.ThighR || !pairs.FootL) return null;

		/*
		 * The flesh of a limb may hang on twist bones beside its bone (Bip001 LUpArmTwist under the clavicle, not under the upper
		 * arm): they go as it goes. A bone that stands away from its twist bone comes to it: that is where the limb bends.
		 */
		Object.keys(joints).forEach(function (index) {
			var named = asset.Nodes[index].Name;
			var found = /[ _.-]([LR])[ _.-]*(fore|up)/i.exec(named);
			var pair = found && /twist/i.test(named) ? pairs[(found[2].toLowerCase() === 'fore' ? 'Fore' : 'Arm') + found[1].toUpperCase()] : null;
			var above = asset.Nodes[index].Parent;

			while (pair && above !== -1 && above !== pair.To)
				above = asset.Nodes[above].Parent;

			if (!pair || above === pair.To) return;

			followers[index] = {To: pair.To};

			if (asset.Nodes[index].Parent === asset.Nodes[pair.To].Parent) {
				self.MoveBone(asset, pair.To, at(Number(index)));

				rest = self.NodeWorld(asset, self.Sample(asset, null, 0), graphics.Identity());
			}
		});

		if (held)
			['L', 'R'].forEach(function (side) {
				var hand = pairs['Hand' + side];
				var word = side === 'L' ? 'Left' : 'Right';

				['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].forEach(function (finger, number) {
					var from = hand ? asset.Nodes[hand.To].Children.filter(function (child) {
						return new RegExp(finger + '|Finger' + number + '(_|$)', 'i').test(asset.Nodes[child].Name);
					})[0] : undefined;
					var i;

					for (i = 1; i <= 3 && from !== undefined; i++) {
						var role = 'Finger' + side + finger + i;
						var there = source.Bones.map(function (bone, index) {
							return bone.Name.replace(/^.*:/, '') === word + 'Hand' + finger + i ? index : -1;
						}).filter(function (index) {
							return index !== -1;
						})[0];
						if (there !== undefined && joints[from])
							pairs[role] = {From: there, To: from};

						if (i > 1 && pairs[role])
							next['Finger' + side + finger + (i - 1)] = role;

						from = asset.Nodes[from].Children[0];
					}
				});
			});

		var start = pose(null);
		var thighs = [at(pairs.ThighR.To)[0] - at(pairs.ThighL.To)[0], 0, at(pairs.ThighR.To)[2] - at(pairs.ThighL.To)[2]];
		var forward = unit(cross([0, 1, 0], thighs));
		var hipsThere = start.Places[pairs.ThighR.From];
		var hipsLeft = start.Places[pairs.ThighL.From];
		var ahead = unit(cross([0, 1, 0], [hipsThere[0] - hipsLeft[0], 0, hipsThere[2] - hipsLeft[2]]));
		var face = between(ahead, forward);
		var height = Math.abs(at(pairs.Hips.To)[1] - at(pairs.FootL.To)[1]) / Math.max(1e-6, Math.abs(start.Places[pairs.Hips.From][1] - start.Places[pairs.FootL.From][1]));

		Object.keys(pairs).forEach(function (role) {
			var pair = pairs[role];
			var fellow = next[role] ? pairs[next[role]] : null;

			pair.Rest = worldTurn(pair.To);
			pair.Lay = null;

			if (fellow) {
				var mine = unit([at(fellow.To)[0] - at(pair.To)[0], at(fellow.To)[1] - at(pair.To)[1], at(fellow.To)[2] - at(pair.To)[2]]);
				var theirs = unit(turned(face, [start.Places[fellow.From][0] - start.Places[pair.From][0], start.Places[fellow.From][1] - start.Places[pair.From][1], start.Places[fellow.From][2] - start.Places[pair.From][2]]));

				pair.Lay = between(mine, theirs);
			}
		});

		/* A bone with none to point at (a hand, a head) goes as its parent was laid: it would be twisted against it. */
		Object.keys(pairs).forEach(function (role) {
			var above = Object.keys(next).filter(function (one) {
				return next[one] === role;
			})[0];
			var pair = pairs[role];

			while (!pair.Lay && above && pairs[above]) {
				pair.Lay = pairs[above].Lay;
				above = Object.keys(next).filter(function (one) {
					return next[one] === above;
				})[0];
			}

			pair.Lay = pair.Lay || [0, 0, 0, 1];
		});

		/*
		 * Arms that a model holds down at rest fit its own body as they are: the same direction as on another skeleton would
		 * push them through it. They count from a source with its arms down, and the clip gives only what it does from there.
		 */
		function droop (side) {
			var arm = pairs['Arm' + side];
			var fore = pairs['Fore' + side];

			return arm && fore ? unit([at(fore.To)[0] - at(arm.To)[0], at(fore.To)[1] - at(arm.To)[1], at(fore.To)[2] - at(arm.To)[2]])[1] : 0;
		}

		/* A pose of a model need not be even: the two arms go by what they do together. */
		var down = !held && droop('L') + droop('R') < -0.6;

		['L', 'R'].forEach(function (side) {
			var arm = pairs['Arm' + side];
			var fore = pairs['Fore' + side];
			if (!arm || !fore || !down) return;

			var theirs = unit(turned(face, [start.Places[fore.From][0] - start.Places[arm.From][0], start.Places[fore.From][1] - start.Places[arm.From][1], start.Places[fore.From][2] - start.Places[arm.From][2]]));

			var lowered = back(between(theirs, unit([theirs[0] * 0.25, -0.97, theirs[2] * 0.25])));

			[arm, fore, pairs['Hand' + side]].forEach(function (pair) {
				if (!pair) return;

				pair.Lay = lowered;
			});

			/* A wrist keeps its own pose: a clip was made for a hand that hangs another way. */
			if (pairs['Hand' + side]) {
				var hand = at(pairs['Hand' + side].To);
				var mine = unit([at(fore.To)[0] - at(arm.To)[0], at(fore.To)[1] - at(arm.To)[1], at(fore.To)[2] - at(arm.To)[2]]);
				var hinge = cross(mine, unit([hand[0] - at(fore.To)[0], hand[1] - at(fore.To)[1], hand[2] - at(fore.To)[2]]));

				pairs['Hand' + side].Still = true;

				/* The elbow a clip bends at rest is in the arm of the model already: that much comes off. */
				fore.Ease = round(unit(turned(back(fore.Rest), hinge)), -0.24);
			}
		});

		/* Parents first: each is turned in its parent as it stands then. */
		function visit (index) {
			order.push(index);

			asset.Nodes[index].Children.filter(function (child) {
				return !followers[child];
			}).concat(asset.Nodes[index].Children.filter(function (child) {
				return followers[child];
			})).forEach(visit);
		}

		asset.Scene.forEach(visit);

		var count = Math.max(2, Math.round(source.Length * 30));
		var channels = {};
		var moves = [];
		var keys = [];
		var yaws = [];
		var i;

		/* How far the clip turns the whole body round: that is for the game to do, or it turns twice. */
		for (i = 0; i <= count; i++) {
			var hipsTurn = times(times(times(face, times(pose(i / count * source.Length).Turns[pairs.Hips.From], back(start.Turns[pairs.Hips.From]))), back(face)), [0, 0, 0, 1]);
			var forward = turned(hipsTurn, [0, 0, 1]);
			var yaw = Math.atan2(forward[0], forward[2]);

			if (i)
				yaw += Math.round((yaws[i - 1] - yaw) / (Math.PI * 2)) * Math.PI * 2;

			yaws.push(yaw);
		}

		var spun = Math.abs(yaws[count] - yaws[0]) > 0.5 ? yaws[count] - yaws[0] : 0;

		Object.keys(pairs).forEach(function (role) {
			channels[pairs[role].To] = [];
		});

		Object.keys(followers).forEach(function (index) {
			followers[index].Rest = times(back(worldTurn(followers[index].To)), worldTurn(Number(index)));
			channels[index] = [];
		});

		for (i = 0; i <= count; i++) {
			var time = i / count * source.Length;
			var now = pose(time);
			var worlds = {};
			var unspin = round([0, 1, 0], -spun * i / count);

			keys.push(time);

			order.forEach(function (index) {
				var node = asset.Nodes[index];
				var parent = node.Parent === -1 ? [0, 0, 0, 1] : worlds[node.Parent];
				var pair = null;

				Object.keys(pairs).forEach(function (role) {
					if (pairs[role].To === index) {
						pair = pairs[role];
						pair.Role = role;
					}
				});

				if (followers[index]) {
					worlds[index] = times(worlds[followers[index].To], followers[index].Rest);

					var along = times(back(parent), worlds[index]);

					channels[index].push(along[0], along[1], along[2], along[3]);

					return;
				}

				if (!pair) {
					worlds[index] = times(parent, node.Rotation);

					return;
				}

				var delta = times(now.Turns[pair.From], back(start.Turns[pair.From]));

				worlds[index] = times(unspin, times(times(times(times(face, delta), back(face)), pair.Lay), pair.Rest));

				var local = times(back(parent), worlds[index]);

				if (pair.Ease)
					local = times(local, pair.Ease);

				/* Of what a clip does to this bone so much is kept: the way from where it stands at rest, the short way round. */
				if (options && options.Calm && options.Calm[pair.Role] !== undefined) {
					var kept = options.Calm[pair.Role];
					var sign = local[0] * node.Rotation[0] + local[1] * node.Rotation[1] + local[2] * node.Rotation[2] + local[3] * node.Rotation[3] < 0 ? -1 : 1;
					var eased = [0, 1, 2, 3].map(function (axis) {
						return node.Rotation[axis] * (1 - kept) + local[axis] * sign * kept;
					});
					var size = Math.hypot(eased[0], eased[1], eased[2], eased[3]);

					local = eased.map(function (value) {
						return value / size;
					});
				}

				if (pair.Still)
					local = node.Rotation;

				worlds[index] = times(parent, local);

				channels[index].push(local[0], local[1], local[2], local[3]);
			});

			var hips = now.Places[pairs.Hips.From];
			var first = start.Places[pairs.Hips.From];

			moves.push(turned(face, [hips[0] - first[0], hips[1] - first[1], hips[2] - first[2]]));
		}

		var made = Object.keys(channels).map(function (index) {
			return {Node: Number(index), Path: 'rotation', Times: new Float32Array(keys), Values: new Float32Array(channels[index]), Size: 4, Step: false};
		});
		var mover = pairs.Hips.To;
		var spine = pairs.Spine || pairs.Spine1;
		var up = spine ? spine.To : -1;

		while (up !== -1 && up !== undefined && up !== mover)
			up = asset.Nodes[up].Parent;

		/* Some rigs hang legs and spine side by side: what moves the body moves what holds them both, or the waist tears. */
		if (spine && up !== mover && asset.Nodes[mover].Parent !== -1)
			mover = asset.Nodes[mover].Parent;

		var pelvis = asset.Nodes[mover];
		var above = pelvis.Parent === -1 ? graphics.Identity() : graphics.Invert(rest[pelvis.Parent]) || graphics.Identity();
		var values = [];
		var lastMove = moves[moves.length - 1];
		var firstMove = moves[0];

		/* What it walks forward goes: the clip stays on the spot, the bounce of the hips is left. */
		moves.forEach(function (move, index) {
			var t = index / (moves.length - 1);
			var d = [(move[0] - firstMove[0] - (lastMove[0] - firstMove[0]) * t) * height, move[1] * height, (move[2] - firstMove[2] - (lastMove[2] - firstMove[2]) * t) * height];

			values.push(pelvis.Translation[0] + above[0] * d[0] + above[4] * d[1] + above[8] * d[2], pelvis.Translation[1] + above[1] * d[0] + above[5] * d[1] + above[9] * d[2], pelvis.Translation[2] + above[2] * d[0] + above[6] * d[1] + above[10] * d[2]);
		});

		made.push({Node: mover, Path: 'translation', Times: new Float32Array(keys), Values: new Float32Array(values), Size: 3, Step: false});

		return self.Named(name, source.Length, made);
	},

	/* A bone goes to a place of the world at rest, and what hangs on it stays where it was. */
	MoveBone: function (asset, index, place) {
		var graphics = this.$Service('Graphics3D');
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), graphics.Identity());
		var node = asset.Nodes[index];

		function within (matrix, point) {
			var m = graphics.Invert(matrix) || graphics.Identity();

			return [m[0] * point[0] + m[4] * point[1] + m[8] * point[2] + m[12], m[1] * point[0] + m[5] * point[1] + m[9] * point[2] + m[13], m[2] * point[0] + m[6] * point[1] + m[10] * point[2] + m[14]];
		}

		var hung = node.Children.map(function (child) {
			return [rest[child][12], rest[child][13], rest[child][14]];
		});

		node.Translation = node.Parent === -1 ? place : within(rest[node.Parent], place);
		rest = this.NodeWorld(asset, this.Sample(asset, null, 0), graphics.Identity());

		node.Children.forEach(function (child, order) {
			asset.Nodes[child].Translation = within(rest[index], hung[order]);
		});
	},

	Named: function (name, length, channels) {
		return {Name: name, Length: length, Channels: channels};
	},

	/*
	 * Clips made from a skeleton, for a model that came without them: its bones are known by their names (Biped, Mixamo,
	 * Blender). Each bone turns round an axis of the world, whichever way the file holds it, so one recipe fits all: legs
	 * that swing and knees that bend, arms let down and swinging against them, a spine that turns. null with no legs.
	 */
	Gait: function (asset) {
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), this.$Service('Graphics3D').Identity());
		var joints = {};
		var turns = [];

		asset.Skins.forEach(function (skin) {
			skin.Joints.forEach(function (joint) {
				joints[joint] = true;
			});
		});

		function find (pattern) {
			var found = Object.keys(joints).filter(function (index) {
				return pattern.test(asset.Nodes[index].Name);
			})[0];

			return found === undefined ? -1 : Number(found);
		}

		function times (a, b) {
			return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
		}

		function round (axis, angle) {
			var s = Math.sin(angle / 2);

			return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
		}

		function worldTurn (index) {
			var node = asset.Nodes[index];

			return node.Parent === -1 ? node.Rotation : times(worldTurn(node.Parent), node.Rotation);
		}

		function at (index) {
			return [rest[index][12], rest[index][13], rest[index][14]];
		}

		function unit (v) {
			var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;

			return [v[0] / length, v[1] / length, v[2] / length];
		}

		function cross (a, b) {
			return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
		}

		var bones = {
			ThighL: find(/\bL[ _.]*Thigh|Left[ _.]*Up[ _.]*Leg|thigh[._]l\b/i),
			ThighR: find(/\bR[ _.]*Thigh|Right[ _.]*Up[ _.]*Leg|thigh[._]r\b/i),
			CalfL: find(/\bL[ _.]*Calf|Left[ _.]*Leg(?!.*Up)|calf[._]l\b/i),
			CalfR: find(/\bR[ _.]*Calf|Right[ _.]*Leg(?!.*Up)|calf[._]r\b/i),
			ArmL: find(/\bL[ _.]*Upper[ _.]*Arm|Left[ _.]*Arm(?!.*Fore)|upper[ _]?arm[._]l\b/i),
			ArmR: find(/\bR[ _.]*Upper[ _.]*Arm|Right[ _.]*Arm(?!.*Fore)|upper[ _]?arm[._]r\b/i),
			ForeL: find(/\bL[ _.]*Fore[ _.]*arm|Left[ _.]*Fore[ _.]*Arm|fore[ _]?arm[._]l\b/i),
			ForeR: find(/\bR[ _.]*Fore[ _.]*arm|Right[ _.]*Fore[ _.]*Arm|fore[ _]?arm[._]r\b/i),
			HandL: find(/\bL[ _.]*Hand|Left[ _.]*Hand|hand[._]l\b/i),
			HandR: find(/\bR[ _.]*Hand|Right[ _.]*Hand|hand[._]r\b/i),
			Spine: find(/spine1?(_|$)|spine1?\b/i)
		};
		if (bones.ThighL < 0 || bones.ThighR < 0 || bones.CalfL < 0 || bones.CalfR < 0) return null;

		var thighs = [at(bones.ThighR)[0] - at(bones.ThighL)[0], 0, at(bones.ThighR)[2] - at(bones.ThighL)[2]];
		var forward = unit(cross([0, 1, 0], thighs));
		var axis = cross([0, 1, 0], forward);

		/* A turn of the world for a bone, at a place of the cycle, as the turn of its node in its parent. */
		function channel (bone, count, length, angle, first) {
			var node = asset.Nodes[bone];
			var parent = node.Parent === -1 ? [0, 0, 0, 1] : worldTurn(node.Parent);
			var back = [-parent[0], -parent[1], -parent[2], parent[3]];
			var values = [];
			var keys = [];
			var i;

			for (i = 0; i <= count; i++) {
				var turn = round(axis, angle(i / count * Math.PI * 2));

				if (first)
					turn = times(turn, first);

				var local = times(times(times(back, turn), parent), node.Rotation);

				values.push(local[0], local[1], local[2], local[3]);
				keys.push(i / count * length);
			}

			return {Node: bone, Path: 'rotation', Times: new Float32Array(keys), Values: new Float32Array(values), Size: 4, Step: false};
		}

		/* An arm held out is let down first: from where it points to the side of the body. */
		function lowered (arm, fore) {
			var way = fore < 0 ? [0, -1, 0] : unit([at(fore)[0] - at(arm)[0], at(fore)[1] - at(arm)[1], at(fore)[2] - at(arm)[2]]);
			var down = unit([way[0] * 0.4, -1, way[2] * 0.4]);

			return turnTo(way, down);
		}

		function turnTo (way, down) {
			var pivot = cross(way, down);
			var size = Math.sqrt(pivot[0] * pivot[0] + pivot[1] * pivot[1] + pivot[2] * pivot[2]);

			return size < 0.05 ? null : round(unit(pivot), Math.atan2(size, way[0] * down[0] + way[1] * down[1] + way[2] * down[2]));
		}

		/* A forearm goes on along the arm let down, or the elbow stays as a pose of arms held out left it. */
		function along (fore, hand, arm) {
			var turn;
			var way;
			var down;
			var r;

			if (fore < 0 || hand < 0 || !arm) return null;

			way = unit([at(hand)[0] - at(fore)[0], at(hand)[1] - at(fore)[1], at(hand)[2] - at(fore)[2]]);
			down = unit([way[0] * 0.4, -1, way[2] * 0.4]);
			turn = [-arm[0], -arm[1], -arm[2], arm[3]];
			r = times(times(turn, [down[0], down[1], down[2], 0]), arm);

			return turnTo(way, [r[0], r[1], r[2]]);
		}

		function clip (name, length, count, swing) {
			var channels = turns.map(function (one) {
				return channel(one.Bone, count, length, swing(one), one.First);
			});

			return {Name: name, Length: length, Channels: channels};
		}

		[['ThighL', 'Leg', 1], ['ThighR', 'Leg', -1], ['CalfL', 'Knee', 1], ['CalfR', 'Knee', -1], ['ArmL', 'Arm', -1], ['ArmR', 'Arm', 1], ['ForeL', 'Elbow', 1], ['ForeR', 'Elbow', 1]].forEach(function (one) {
			var bone = bones[one[0]];
			if (bone < 0) return;

			var left = /L$/.test(one[0]);
			var arm = bones[left ? 'ArmL' : 'ArmR'];
			var first = arm < 0 ? null : lowered(arm, bones[left ? 'ForeL' : 'ForeR']);

			turns.push({Bone: bone, Part: one[1], Side: one[2], First: one[1] === 'Arm' ? first : one[1] === 'Elbow' ? along(bone, bones[left ? 'HandL' : 'HandR'], first) : null});
		});

		return {
			Walk: clip('Walk (made)', 1, 24, function (one) {
				return function (phase) {
					if (one.Part === 'Leg')
						return -0.48 * one.Side * Math.sin(phase);

					if (one.Part === 'Knee')
						return 0.12 + 0.85 * Math.max(0, one.Side * Math.cos(phase));

					if (one.Part === 'Arm')
						return -0.34 * one.Side * Math.sin(phase);

					return -0.3 + 0.12 * Math.sin(phase);
				};
			}),
			Idle: clip('Idle (made)', 3, 12, function (one) {
				return function (phase) {
					if (one.Part === 'Elbow')
						return -0.14 + 0.02 * Math.sin(phase);

					if (one.Part === 'Arm')
						return 0.02 * Math.sin(phase);

					return 0;
				};
			})
		};
	},

	/* The pieces of a model with many, as one for each material: a location of thousands of meshes is a few draws. */
	Merged: function (pieces) {
		var graphics = this.$Service('Graphics3D');
		var groups = [];

		pieces.forEach(function (piece) {
			var group = groups.filter(function (each) {
				return each.Material === piece.Material;
			})[0];

			if (!group) {
				group = {Material: piece.Material, Parts: []};

				groups.push(group);
			}

			group.Parts.push({Geometry: piece.Geometry, Matrix: piece.Rest});
		});

		return groups.map(function (group, index) {
			return {ID: 'whole-' + index, Parent: '', Pivot: [0, 0, 0], Team: false, Geometry: graphics.Merge(group.Parts), Material: group.Material, Node: -1, Skin: -1, JointOffset: 0, Rest: graphics.Identity(), Placed: null};
		});
	},

	/*
	 * The skeletons of a model as an array of frames, thirty a second: three rows of a matrix for each joint, a line of
	 * the texture for each frame. Every copy of a model then only says which line it is at.
	 */
	Bake: function (model) {
		if (!model.Baked)
			this.BakeStep(model, Infinity);

		return model.Baked;
	},

	/* Some of the frames, for as long as it is given (milliseconds): true when all are there. A long clip stops no frame. */
	BakeStep: function (model, budget) {
		var self = this;
		var graphics = this.$Service('Graphics3D');
		var asset = model.Asset;
		var rate = 30;
		var started = performance.now();
		var work = model.Baking;
		var made;

		if (model.Baked) return true;

		function plan () {
			var done = [];
			var plain = {Frames: [], Starts: {}, Queue: [{Animation: null, Time: 0}]};

			Object.keys(model.Clips).forEach(function (name) {
				var clip = model.Clips[name];
				var count = Math.max(1, Math.ceil(clip.Length * rate));
				var same = done.filter(function (each) {
					return each.Animation === clip.Animation;
				})[0];
				var i;

				/* One animation under two names (idle and its own) is the same lines of the texture. */
				if (same) {
					plain.Starts[name] = same.Place;

					return;
				}

				plain.Starts[name] = {Start: plain.Queue.length, Count: count, Rate: rate};

				done.push({Animation: clip.Animation, Place: plain.Starts[name]});

				for (i = 0; i <= count; i++)
					plain.Queue.push({Animation: clip.Animation, Time: Math.min(clip.Length, i / rate)});
			});

			return plain;
		}

		function frame (step) {
			var world = self.NodeWorld(asset, self.Sample(asset, step.Animation, step.Time), model.Fit);
			var line = [];

			asset.Skins.forEach(function (skin) {
				skin.Joints.forEach(function (joint, index) {
					var m = graphics.Multiply(world[joint], self.InverseOf(skin, index));

					line.push(m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14]);
				});
			});

			work.Frames.push(line);
		}

		work = model.Baking = work || plan();

		while (work.Frames.length < work.Queue.length) {
			frame(work.Queue[work.Frames.length]);

			if (performance.now() - started > budget) return false;
		}

		/* The last line is where each joint stands at rest: a fade turns round it, so what it moves keeps its size. */
		var binds = [];

		asset.Skins.forEach(function (skin) {
			skin.Joints.forEach(function (joint, index) {
				var bound = graphics.Invert(self.InverseOf(skin, index));

				binds.push(bound[12], bound[13], bound[14], 0, 0, 0, 0, 0, 0, 0, 0, 0);
			});
		});

		made = new Float32Array((work.Frames.length + 1) * model.Joints * 12);

		work.Frames.forEach(function (line, index) {
			made.set(line, index * model.Joints * 12);
		});

		made.set(binds, work.Frames.length * model.Joints * 12);

		model.Baked = {Data: made, Width: Math.max(1, model.Joints * 3), Height: work.Frames.length + 1, Clips: work.Starts};
		model.Baking = null;

		return true;
	},

	/* The line of a clip at a second of it, and the fraction of the way to the next. */
	Frame: function (model, clip, time) {
		var baked = this.Bake(model);
		var made = model.Clips[clip];
		var place = baked.Clips[clip];
		var at;

		if (!made || !place) return 0;

		at = (made.Loop ? (time % made.Length + made.Length) % made.Length : Math.min(made.Length, time)) * place.Rate;

		return place.Start + Math.min(place.Count, Math.floor(at));
	},

	/* The matrix of a bone of a model of a file at a second of a clip, by its role (HandR, HandL...) or its name; null with none. */
	BoneMatrix: function (model, bone, clip, time) {
		var asset = model.Asset;
		var made = model.Clips[clip];
		var known = model.Bones = model.Bones || {};
		var word = this.BoneWord(bone);
		var side = /^Hand([LR])$/.exec(bone);
		var moment;

		if (!asset)
			return null;

		if (known[bone] === undefined) {
			known[bone] = -1;

			asset.Nodes.forEach(function (node, index) {
				if (known[bone] === -1 && (node.Name === bone || word && word.test(node.Name) || side && new RegExp('(^|[ _.:-])' + (side[1] === 'L' ? 'left' : 'right') + '[ _.-]*hand($|_)', 'i').test(node.Name)))
					known[bone] = index;
			});
		}

		if (known[bone] === -1) return null;

		moment = made ? (made.Loop ? (time % made.Length + made.Length) % made.Length : Math.min(made.Length, time)) : 0;

		return this.NodeWorld(asset, this.Sample(asset, made ? made.Animation : null, moment), model.Fit)[known[bone]];
	},

	/*
	 * Where a thing in a hand stands: the place and the turn of its bone, as a skeleton may be of any scale. With another bone
	 * to aim at, X goes from the one to the other and Y stays up: a rifle lies in two hands however they are turned.
	 */
	Grip: function (bone, aim) {
		var vectors = this.$Service('Graphics3D').Vectors;
		var x = vectors.Normalize([bone[0], bone[1], bone[2]]);
		var y = vectors.Normalize([bone[4], bone[5], bone[6]]);
		var z = vectors.Normalize([bone[8], bone[9], bone[10]]);

		if (aim) {
			x = vectors.Normalize([aim[12] - bone[12], aim[13] - bone[13], aim[14] - bone[14]]);
			z = vectors.Normalize(vectors.Cross(x, [0, 1, 0]));
			y = vectors.Cross(z, x);
		}

		return [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, bone[12], bone[13], bone[14], 1];
	},

	/* A hand with its place moved from the wrist into the palm, by its middle finger: what it holds lies there. */
	Palm: function (model, bone, clip, hand) {
		var asset = model.Asset;
		var node = asset && model.Bones && asset.Nodes[model.Bones[bone]];
		var finger = node ? node.Children.filter(function (child) {
			return /middle|finger2/i.test(asset.Nodes[child].Name);
		})[0] : undefined;
		var tip = finger === undefined ? null : this.BoneMatrix(model, asset.Nodes[finger].Name, clip, 0);
		var made = hand.slice();

		if (tip) {
			made[12] = hand[12] + (tip[12] - hand[12]) * 0.8;
			made[13] = hand[13] + (tip[13] - hand[13]) * 0.8;
			made[14] = hand[14] + (tip[14] - hand[14]) * 0.8;
		}

		return made;
	},

	/* The turn from a bone to a thing that lies from it to another, as they stand when idle: it holds through all that the bone does. */
	GripTurn: function (model, bone, aim) {
		var graphics = this.$Service('Graphics3D');
		var kept = model.GripTurns = model.GripTurns || {};
		var key = bone + '>' + aim;
		var clip = model.Clips.idle ? 'idle' : '';

		if (!kept[key]) {
			var hand = this.BoneMatrix(model, bone, clip, 0);
			var other = this.BoneMatrix(model, aim, clip, 0);
			var plain = hand ? this.Grip(hand, null) : graphics.Identity();
			var palm = hand ? this.Palm(model, bone, clip, hand) : null;
			var far = other ? this.Palm(model, aim, clip, other) : null;

			kept[key] = hand && other ? graphics.Multiply(graphics.Invert(plain), this.Grip(palm, far)) : graphics.Identity();
		}

		return kept[key];
	},

	/* How far a second of a clip is from its line to the next one: the frames are baked thirty a second, a screen shows more. */
	Between: function (model, clip, time) {
		var made = model.Clips[clip];
		var place = model.Baked && model.Baked.Clips[clip];
		var at;

		if (!made || !place) return 0;

		at = (made.Loop ? (time % made.Length + made.Length) % made.Length : Math.min(made.Length, time)) * place.Rate;

		return Math.floor(at) < place.Count ? at - Math.floor(at) : 0;
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
		if (model.Asset)
			return this.PoseOfFile(model, clip, time, options);

		return this.PoseOfPieces(model, clip, time, options);
	},

	/* The matrix of each piece of a model of a file, in the space of the model; a skeleton moves by its frames. */
	PoseOfFile: function (model, clip, time) {
		var made = model.Clips[clip];
		var moment = made ? (made.Loop ? (time % made.Length + made.Length) % made.Length : Math.min(made.Length, time)) : 0;
		var key = (made ? clip : '') + ':' + Math.floor(moment * 30);
		var kept = model.Poses = model.Poses || {};
		var world;
		var matrices;

		/* Copies at the same frame share their pose: a crowd costs no more than one. */
		if (kept[key])
			return kept[key];

		world = this.NodeWorld(model.Asset, this.Sample(model.Asset, made ? made.Animation : null, moment), model.Fit);
		matrices = {};

		model.Pieces.forEach(function (piece) {
			matrices[piece.ID] = piece.Node === -1 ? piece.Rest : piece.Skin === -1 ? world[piece.Node] : model.Fit;
		});

		kept[key] = matrices;

		return matrices;
	},

	PoseOfPieces: function (model, clip, time, options) {
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
				tools.Piece('dish', [tools.Lathe([[0.02, 0], [0.2, 0.05], [0.42, 0.2], [0.41, 0.215], [0.2, 0.085], [0, 0.05]], [0, 0.66, 0], hull, 14), tools.Cylinder(0.012, 0.004, 0.24, [0, 0.76, 0], dark)], {Parent: 'body', Pivot: [0, 0.6, 0]})
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
