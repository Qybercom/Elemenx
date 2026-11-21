/*
 * The models of a game, made of graphs and of code: no files, the same shape for the same seed. A model is a tree of pieces that move
 * on their pivots (a body, its arms, a turret, the sails of a mill), each a geometry of Renderer, about 1 tall (or
 * 1 wide when it is a building); the Size of a kind makes it as large as it should be.
 * - Names(filter) lists the models: filter {Group: fantasy, scifi, nature, space; Type: unit, animal, vehicle, plant,
 *   rock, building, ship}; Has(name), Info(name) ({Name, Group, Type, Size, Speed, Variants, Clips}).
 * - Define(name, recipe) adds one or replaces it: recipe {Group, Type, Size (in a game), Speed (a second), Variants,
 *   Sway (how far the wind bends it), Matte (false: it shines), Smooth (no flat faces), Clips, Build(tools, random)}.
 *   Build returns its pieces, tools.Piece(id, parts, {Parent, Pivot, Team}), of parts made by tools.Box(width, height,
 *   depth, at, color, turn), Cylinder(radius, top, height, at, color, turn, segments), Ball(radius, at, color, scale),
 *   Blob(radius, at, color, rough, scale), Lathe(points, at, color, segments) and Wedge(width, height, depth, at, color,
 *   turn); at is [x, y, z] in the space of the model, turn degrees round x, y and z, a piece with Team takes the color
 *   of its team; tools.Meshes (the shapes), tools.Math and tools.Rigs (Biped, Quadruped, Tracked: clips to reuse) are at hand.
 *   A recipe of data has Parts in place of Build (Assemble: shapes with their Piece, Tags, Mirror, Chance and Vary, its
 *   Pieces, Rig for its clips, Seed: its variants of it, not of its name), JSON to keep and to edit (ModelEditor);
 *   Tagged(name, tag) gives the pieces of a tag.
 *   A recipe of a graph has Graph in place of Build (a graph of the kind model of ModelBlueprints, or the name of one of
 *   the resources), its Parameters and Seed: the graph gives its parts for each variant.
 *   A recipe may name a file instead of Build (glb, gltf, fbx or obj: ModelFormats): Define('hero', {URL: 'assets/hero.glb', Type, Size, Speed, Clips: {walk:
 *   'Run'}}) (Clips: the clips of the game and the animations of the file that play them; idle, walk, run, attack, die
 *   and work are found by their names). Load(name, callback) fetches it, (error, model), and Ready(name) tells whether
 *   it came; a model of a file stands on the ground and is 1 tall, as the others are. With Generate(callback) instead of
 *   a file it is made by that function, (error, asset) as Gltf gives one (SceneMannequin: the model mannequin), or a list
 *   of assets, one for each of its Variants (SceneFlora: a tree, each variant another). Make of one not come yet is null. Apart,
 *   a word of the name of a material or a node, cuts what a file keeps as one piece at its wide gaps: four wheels in one mesh.
 *   Merge: true makes its pieces one for each material when it is made; a Scene draws what moves together of a model
 *   that plays no clips as one for each material anyway (each wheel, each opening), but for Merge: false.
 *   Bake(model) makes the moves of its skeletons an array of frames, for a shader that reads them. Soft (0 to 1, or
 *   {material: value}) lets light under its surface, as in skin. Surfaces(model) is its geometry material by material.
 * - The Lamps of a model of a file are what shines in it (BuiltLamps): a Scene lights its world with them. A model built of
 *   parts tells its own: recipe Lamps [{Place [x, y, z] (in its units: its height is 1), Color, Power, Radius (in its
 *   units), Spot (degrees of its cone; none: all round), Aim, Night (true: lit only at night)}].
 * - BoneMatrix(model, bone, clip, time): the matrix of a bone at a second of a clip; Grip(bone, aim): where a thing in a hand stands.
 * - Make(name, {Variant}) returns a model, made once: {Name, Key, Group, Type, Size, Speed, Sway, Matte, Clips, Pieces:
 *   [{ID, Parent, Pivot, Team, Geometry}]}. Remake(name) has it made again on the next Make, under a Key of its own (what
 *   cut its pieces, the roles of its parts, changed).
 * - Whole(model) is a model as one geometry, Bounds(geometry) its {Radius, Middle} and Levels(name, {Variant}) its
 *   geometries from the finest down: for what is sown in masses and seen from afar. Extent(name): how large it stands,
 *   [x, y, z] in its units, once ready (a craft is drawn as long as its Length of its longest side).
 * - Pose(model, clip, time, {From, FromTime, Fade}) returns the matrix of each piece at a second of a clip, in the space
 *   of the model; Fade (0 to 1) mixes it from the pose of the clip From. Length(model, clip) is the seconds of a clip.
 * A clip is {Length, Loop, Hold, Stride, Tracks: {piece: [[time 0 to 1, rx, ry, rz, mx, my, mz]...]}, Spins: {piece:
 * [x, y, z] degrees a second}}; Hold keeps the last pose when it ends, Stride is how far a walk goes in one cycle, in
 * sizes of the model.
 * - Kinds, KindOf(type): the kind of a Scene a model of a type stands as (resources/models/kinds.json: a plant a tree, a
 *   building a house...), null for one not told. Rigs(): the clips of the rigs (resources/models/rigs.json).
 * - The models of the library (Builtin): each a graph of the kind model (blueprints/models/<name>; the loops of one graphs
 *   <name>-<loop> its Repeat calls, the bodies of two legs and of four the graphs biped and quadruped), told in
 *   resources/models/builtin.json (Group, Type, Size, Speed, Sway, Variants, Matte, Smooth, Lamps, Clips: {Rig} the clips of
 *   a rig and what is its own, Graph); the mannequin is of code (SceneMannequin).
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneModels', {
	$Meta: {
		Description: 'The models of a game made of graphs and code: units, animals, plants, buildings and ships of pieces that move, fantasy and sci-fi, and their clips.',
		Methods: ['Names(filter)', 'Has(name)', 'Info(name)', 'Define(name, recipe)', 'Remake(name)', 'Edits(name)', 'SetEdits(name, edits)', 'Edit(name, edit)', 'PieceList(name)', 'Extract(name, ids, newName)', 'Combine(newName, parts, options)', 'Assemble(recipe, tools, random, variant)', 'Tagged(name, tag)', 'Load(name, callback)', 'Ready(name)', 'Bake(model)', 'Make(name, options)', 'Surfaces(model)', 'Whole(model)', 'Extent(name)', 'Bounds(geometry)', 'Levels(name, options)', 'Pose(model, clip, time, options)', 'Length(model, clip)', 'KindOf(type)']
	},

	$Provides: {Seeded: {Kinds: ['model']}},

	/*
	 * The kind of a scene a model of a Type is, of resources/models/kinds alone (unit, animal and vehicle a unit, plant a tree...),
	 * read as it is made. Regression: a copy of it here, the two to keep alike.
	 */
	Kinds: {},

	/* The kind of a model of a Type: of Kinds, null for a type of none. */
	KindOf: function (type) {
		return Object.prototype.hasOwnProperty.call(this.Kinds, type) ? this.Kinds[type] : null;
	},

	$OnCreate: function () {
		this.Kinds = Object.assign({}, this.Kinds, typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Data', 'ElemenxGraphics/models/kinds') || {} : {});

		var self = this;

		this.Recipes = {};
		this.Made = {};

		this.Builtin();

		/* A model of code is a kind of the Seeded Service: made again of its name, or baked as its pieces. */
		this.$Service('Seeded').Define('model', {
			Version: 1,
			Make: function (params) {
				var made = self.Make(params.Name, {Variant: params.Variant});
				if (made && made.Asset)
					throw new Error('Elemenx Seeded: a model of a file is not made of a recipe: ' + params.Name);

				return made;
			},
			Bake: function (made) {
				return {Name: made.Name, Group: made.Group, Type: made.Type, Size: made.Size, Speed: made.Speed, Sway: made.Sway, Matte: made.Matte, Clips: made.Clips, Pieces: made.Pieces.map(function (piece) {
					return {ID: piece.ID, Parent: piece.Parent, Pivot: piece.Pivot, Team: piece.Team, Geometry: piece.Geometry};
				})};
			}
		});
	},

	Define: function (name, recipe) {
		var self = this;
		var made = this.Made;
		var given = recipe;

		if (!name || !recipe || typeof recipe.Build !== 'function' && !recipe.URL && !Array.isArray(recipe.Parts) && !Array.isArray(recipe.Of) && !recipe.Graph)
			throw new Error('Elemenx Models: Define expects (name, {Build}) or (name, {URL})');

		/*
		 * A recipe of a graph (Graph: a graph of the kind model, its JSON or the name of one of the resources): its parts
		 * those the graph gives for its Parameters, its Seed (the name, else) and the variant (inputs Seed and Variant).
		 */
		if (recipe.Graph && typeof recipe.Build !== 'function') {
			recipe = Object.assign({}, given, {Build: function (tools, random, variant) {
				return self.Assemble(self.$Service('ModelBlueprints').Recipe(given.Graph, given.Parameters, {Seed: given.Seed === undefined || given.Seed === '' ? name : given.Seed, Variant: variant || 0}), tools, random, 0);
			}});
		}

		/*
		 * A recipe of data (an editor's): its Build made of its Parts, its clips of its Rig; with a Seed its variants are of
		 * it, whatever name it is defined under (the editor shows the very variants a game gets).
		 */
		if (typeof recipe.Build !== 'function' && !recipe.URL && !Array.isArray(recipe.Of)) {
			recipe = Object.assign({}, given, {Build: function (tools, random, variant) {
				return self.Assemble(given, tools, given.Seed !== undefined && given.Seed !== '' ? self.Random(String(given.Seed) + ':' + variant) : random, variant);
			}});

			if (!recipe.Clips && recipe.Rig)
				recipe.Clips = this.Rigs()[recipe.Rig] || recipe.Clips;
		}

		/* A model made again under its name has a Key of its own: what drew the one before (a scene keeps it) does not draw this one. */
		this.Revisions = this.Revisions || {};

		if (this.Recipes[name])
			this.Revisions[name] = (this.Revisions[name] || 0) + 1;

		this.Recipes[name] = recipe;

		Object.keys(made).forEach(function (key) {
			if (key.split('~')[0] === name)
				delete made[key];
		});

		return this;
	},

	/* Made again on the next Make, under a Key of its own: what cut its pieces changed (the roles of its parts). */
	Remake: function (name) {
		var made = this.Made;

		if (!this.Recipes[name]) return;

		this.Revisions = this.Revisions || {};
		this.Revisions[name] = (this.Revisions[name] || 0) + 1;

		Object.keys(made).forEach(function (key) {
			if (key.split('~')[0] === name)
				delete made[key];
		});
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

		/* A model made of code as a file is (Generate(callback (error, asset))): made when first asked for, as one is fetched. */
		(typeof recipe.Generate === 'function' ? function (url, then) {
			recipe.Generate(then);
		} : function (url, then) {
			self.$Service('ModelFormats').Load(url, then);
		})(recipe.URL, function (error, asset) {
			/* Clips of other files (Motions: {clip: URL or {URL, Stride, Held}}) come before the model is said to be ready. */
			var motions = Object.keys(recipe.Motions || {});
			var left = motions.length;

			function ready () {
				var waiting = recipe.Waiting;

				recipe.Waiting = null;
				/* A list: an asset for each variant (the first the asset of the model). */
				recipe.Assets = Array.isArray(asset) ? asset : null;
				recipe.Asset = Array.isArray(asset) ? asset[0] || null : asset;

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
		var self = this;
		var recipe = this.Recipes[name];
		var settings = options || {};
		var variants = recipe ? recipe.Variants || 1 : 1;
		var variant = Math.abs(Math.floor(Number(settings.Variant) || 0)) % variants;
		var key = name + '~' + variant;
		var revision = this.Revisions && this.Revisions[name];
		var shown = revision ? key + '~' + revision : key;
		var meshes = this.$Service('Meshes');
		var pieces;
		var own;

		if (!recipe)
			throw new Error('Elemenx Models: unknown model ' + name);

		if (this.Made[key])
			return this.Made[key];

		if (recipe.URL) {
			/* A model generated is made when it is asked for: a Generate that calls back at once gives it now. */
			if (!recipe.Asset && typeof recipe.Generate === 'function' && !recipe.Waiting && !recipe.Failed)
				this.Load(name);

			if (!recipe.Asset) return null;

			if (this.Made[key])
				return this.Made[key];

			/* Of a variant of its own: the asset of that variant (Generate gave a list). */
			own = recipe.Assets && recipe.Assets.length > 1 ? Object.assign(Object.create(recipe), {Asset: recipe.Assets[variant % recipe.Assets.length]}) : recipe;

			this.Made[key] = this.Finished(name, this.FromFile(name, shown, own), recipe);

			return this.Made[key];
		}

		/* Of several models: their pieces where each is put. */
		if (Array.isArray(recipe.Of)) {
			pieces = this.Combined(recipe);

			if (!pieces)
				return null;

			this.Made[key] = this.Finished(name, {Name: name, Key: shown, Group: recipe.Group || '', Type: recipe.Type || '', Size: recipe.Size || 1, Speed: 0, Sway: 0, Matte: false, Soft: 0, Clips: {}, Pieces: pieces, Lamps: [], Asset: {Nodes: [], Meshes: [], Materials: [], Images: [], Skins: [], Animations: []}, Fit: null, Joints: 0, Moves: false}, recipe);

			return this.Made[key];
		}

		pieces = [];

		recipe.Build(this.Tools(), this.Random(name + ':' + variant), variant).forEach(function (piece) {
			self.Patterned(piece).forEach(function (group, index) {
				var geometry = meshes.Merge(group.Parts);

				pieces.push({ID: index ? piece.ID + '#' + group.Key : piece.ID, Parent: index ? piece.ID : piece.Parent || '', Pivot: piece.Pivot || [0, 0, 0], Team: !!piece.Team, Geometry: recipe.Smooth ? geometry : meshes.Facets(geometry), Material: group.Material});
			});
		});

		this.Made[key] = this.Finished(name, {Name: name, Key: shown, Group: recipe.Group || '', Type: recipe.Type || '', Size: recipe.Size || 1, Speed: recipe.Speed || 0, Sway: recipe.Sway || 0, Matte: recipe.Matte !== false, Clips: recipe.Clips || {}, Pieces: pieces, Lamps: (recipe.Lamps || []).slice()}, recipe);

		return this.Made[key];
	},

	/*
	 * The parts of a piece by what they are drawn of: those of no material first (drawn by the colors of their corners),
	 * then one group for each material and color (PatternMaterial: a material of that pattern, that color its base); each
	 * group after the first a piece of its own under the first, at its pivot. A piece of a team stays one.
	 */
	Patterned: function (piece) {
		var self = this;
		var groups = [];
		var found = {};

		piece.Parts.forEach(function (part) {
			var color = part.Color || [1, 1, 1];
			var key = part.Material && !piece.Team ? part.Material + ':' + color.map(function (one) {
				return Math.round(one * 1000);
			}).join(',') : '';

			if (!Object.prototype.hasOwnProperty.call(found, key)) {
				found[key] = {Key: key, Parts: [], Material: key ? self.PatternMaterial(part.Material, color) : null};

				groups[key ? 'push' : 'unshift'](found[key]);
			}

			found[key].Parts.push(part);
		});

		return groups.length ? groups : [{Key: '', Parts: [], Material: null}];
	},

	/* A material of a model drawn by a pattern of SceneMaterials, its base the color given: one for each, shared by the models. */
	PatternMaterial: function (pattern, color) {
		var key = pattern + ':' + color.join(',');

		this.PatternMaterials = this.PatternMaterials || {};

		if (!this.PatternMaterials[key])
			this.PatternMaterials[key] = {Name: key, Pattern: pattern, BaseColor: [color[0], color[1], color[2], 1], Metallic: pattern === 'metal' ? 1 : 0, Roughness: 1, Emissive: [0, 0, 0], Alpha: 'OPAQUE', DoubleSided: false};

		return this.PatternMaterials[key];
	},

	/* SceneModels: edits of models (what is done to a model and its pieces, over its source) */

	/* A model made, its edits done over its pieces: those of its recipe (Edits), then those kept for it (SetEdits). */
	Finished: function (name, model, recipe) {
		var edits = (recipe.Edits || []).concat(this.Edits(name));
		if (!edits.length) return model;

		model.Unedited = model.Pieces;
		model.Pieces = this.Edited(model.Pieces, edits).filter(function (piece) {
			return !piece.Hidden;
		});

		return model;
	},

	EditSets: null,

	/* The edits kept for a model (of a file or of a recipe), in the storage of the browser: a list of operations. */
	Edits: function (name) {
		var sets = this.EditSets || this.EditsLoaded();

		return JSON.parse(JSON.stringify(sets[name] || []));
	},

	EditsLoaded: function () {
		var text = null;

		try {
			text = typeof localStorage !== 'undefined' ? localStorage.getItem('elemenx-model-edits') : null;
		}
		catch (error) {
			text = null;
		}

		try {
			this.EditSets = text ? JSON.parse(text) || {} : {};
		}
		catch (error) {
			this.EditSets = {};
		}

		return this.EditSets;
	},

	/* The edits of a model set (none: forgotten), kept, the model made again with them. */
	SetEdits: function (name, edits) {
		var sets = this.EditSets || this.EditsLoaded();

		if (edits && edits.length) sets[name] = JSON.parse(JSON.stringify(edits));
		else delete sets[name];

		try {
			if (typeof localStorage !== 'undefined')
				localStorage.setItem('elemenx-model-edits', JSON.stringify(sets));
		}
		catch (error) {
			/* No storage: they last as long as the page. */
		}

		this.Remake(name);

		return this.Edits(name);
	},

	/* One edit more of a model: its list with it. */
	Edit: function (name, edit) {
		return this.SetEdits(name, this.Edits(name).concat([edit]));
	},

	/* The pieces of a model as an editor lists them: {ID, Name, Parent, Group, Hidden, Triangles, Material, Skinned}. */
	PieceList: function (name) {
		var model = this.Make(name);
		var pieces;

		if (!model) return [];

		pieces = model.Unedited ? this.Edited(model.Unedited, (this.Recipes[name].Edits || []).concat(this.Edits(name))) : model.Pieces;

		return pieces.map(function (piece) {
			var g = piece.Geometry;

			return {ID: piece.ID, Name: piece.Name || piece.ID, Parent: piece.Parent || '', Group: piece.Group || '', Hidden: !!piece.Hidden, Triangles: Math.floor((g.Indices && g.Indices.length ? g.Indices.length : g.Positions.length / 3) / 3), Material: piece.Material ? piece.Material.Name || '' : '', Skinned: piece.Skin !== undefined && piece.Skin !== -1};
		});
	},

	/*
	 * Pieces of a model taken out into a model of their own (newName: the same source, those pieces only), and gone from it.
	 * Gives the new name.
	 */
	Extract: function (name, ids, newName) {
		var recipe = this.Recipes[name];
		var edits = (recipe.Edits || []).concat(this.Edits(name));
		var own = Object.assign({}, recipe, {Edits: edits.concat([{Op: 'keep', Pieces: ids.slice()}])});

		delete own.Asset;

		if (recipe.URL)
			own.Asset = recipe.Asset;

		this.Define(newName, own);
		this.Edit(name, {Op: 'remove', Pieces: ids.slice()});

		return newName;
	},

	/*
	 * Several models made one (parts: [{Model, At [x, y, z], Turn [degrees round x, y, z], Scale}], in the units of each, its
	 * height 1): a model of their pieces under newName, of Size (options). Gives the new name.
	 */
	Combine: function (newName, parts, options) {
		this.Define(newName, Object.assign({Group: 'combined', Type: 'prop', Size: 1}, options || {}, {Of: JSON.parse(JSON.stringify(parts || []))}));

		return newName;
	},

	/* The pieces of a model of several: each of its models made, its pieces put where it is put; null till all are ready. */
	Combined: function (recipe) {
		var self = this;
		var math = this.$Service('Math');
		var pieces = [];
		var ready = recipe.Of.every(function (part) {
			return self.Has(part.Model) && self.Ready(part.Model);
		});
		if (!ready)
			return null;

		recipe.Of.forEach(function (part, index) {
			var made = self.Make(part.Model);
			var turn = part.Turn || [0, 0, 0];
			var at = part.At || [0, 0, 0];
			var scale = Number(part.Scale) || 1;
			var degrees = Math.PI / 180;
			var matrix = math.Multiply(math.Translation(at[0], at[1], at[2]), math.Multiply(math.Rotation([0, 1, 0], turn[1] * degrees), math.Multiply(math.Rotation([1, 0, 0], turn[0] * degrees), math.Multiply(math.Rotation([0, 0, 1], turn[2] * degrees), math.Scaling(scale, scale, scale)))));

			(made ? made.Pieces : []).forEach(function (piece) {
				if (piece.Skin !== undefined && piece.Skin !== -1) return;

				pieces.push(Object.assign({}, piece, {ID: index + ':' + piece.ID, Name: (part.Name || part.Model) + ' · ' + (piece.Name || piece.ID), Rest: math.Multiply(matrix, piece.Rest || math.Identity()), Material: piece.Material || null, Skin: -1, Placed: null}));
			});
		});

		return pieces;
	},

	/*
	 * Edits done over pieces, in their order, each over what the ones before left: a new list (the geometries it changes are
	 * new; the others shared). An edit is {Op, ...}:
	 * - split: Piece, By (connected: each part of it that hangs together; vertices: the triangles all of whose corners are in
	 *   Vertices, ranges of them, a piece of its own, ID); the new pieces <ID>#1..., or ID;
	 * - group (Pieces, Name: they are of that group), ungroup (Name), merge (Pieces, ID: one piece of them, of the material
	 *   of the first), rename (Piece, Name), parent (Piece, Parent), pivot (Piece, Pivot), remove (Pieces), hide (Pieces,
	 *   Hidden: true, false shows them), keep (Pieces: those only), duplicate (Piece, ID, Move [x, y, z]), mirror (Pieces,
	 *   Axis x, y or z), transform (Pieces, Move, Turn [degrees], Scale, round Pivot or the origin), origin (To: bottom,
	 *   center: the model moved so its middle stands there).
	 */
	Edited: function (pieces, edits) {
		var self = this;
		var math = this.$Service('Math');
		var list = pieces.slice();

		function find (id) {
			return list.filter(function (piece) {
				return piece.ID === id;
			})[0];
		}

		function among (ids) {
			return list.filter(function (piece) {
				return (ids || []).indexOf(piece.ID) >= 0;
			});
		}

		function skinned (piece) {
			return piece.Skin !== undefined && piece.Skin !== -1;
		}

		/* A geometry moved by a matrix of the space of the model: through the rest of its piece and back. */
		function moved (piece, matrix, flip) {
			var rest = piece.Rest || math.Identity();
			var into = math.Multiply(math.Invert(rest) || math.Identity(), math.Multiply(matrix, rest));
			var turn = math.NormalMatrix ? math.NormalMatrix(into) : null;
			var g = piece.Geometry;
			var made = Object.assign({}, g);
			var n = g.Positions.length / 3;
			var i;

			made.Positions = new Float32Array(g.Positions.length);
			made.Normals = g.Normals ? new Float32Array(g.Normals.length) : g.Normals;

			for (i = 0; i < n; i++) {
				var p = math.Apply(into, [g.Positions[i * 3], g.Positions[i * 3 + 1], g.Positions[i * 3 + 2]]);

				made.Positions[i * 3] = p[0];
				made.Positions[i * 3 + 1] = p[1];
				made.Positions[i * 3 + 2] = p[2];

				if (g.Normals && g.Normals.length) {
					var q = turn ? [turn[0] * g.Normals[i * 3] + turn[3] * g.Normals[i * 3 + 1] + turn[6] * g.Normals[i * 3 + 2], turn[1] * g.Normals[i * 3] + turn[4] * g.Normals[i * 3 + 1] + turn[7] * g.Normals[i * 3 + 2], turn[2] * g.Normals[i * 3] + turn[5] * g.Normals[i * 3 + 1] + turn[8] * g.Normals[i * 3 + 2]] : [g.Normals[i * 3], g.Normals[i * 3 + 1], g.Normals[i * 3 + 2]];
					var l = Math.hypot(q[0], q[1], q[2]) || 1;

					made.Normals[i * 3] = q[0] / l;
					made.Normals[i * 3 + 1] = q[1] / l;
					made.Normals[i * 3 + 2] = q[2] / l;
				}
			}

			/* Turned inside out by a mirror: its triangles wound the other way. */
			if (flip) {
				var index = g.Indices && g.Indices.length ? Array.prototype.slice.call(g.Indices) : null;

				if (index) {
					for (i = 0; i + 2 < index.length; i += 3) {
						var t = index[i + 1];

						index[i + 1] = index[i + 2];
						index[i + 2] = t;
					}

					made.Indices = index;
				}
			}

			return Object.assign({}, piece, {Geometry: made});
		}

		edits.forEach(function (edit) {
			var piece;
			var chosen;

			switch (edit.Op) {
				case 'split':
					piece = find(edit.Piece);

					if (!piece) return;

					var parts = edit.By === 'vertices' ? self.SplitVertices(piece, edit.Vertices || []) : self.SplitConnected(piece);
					var at = list.indexOf(piece);

					if (parts.length < 2) return;

					list.splice.apply(list, [at, 1].concat(parts.map(function (part, index) {
						var id = edit.By === 'vertices' ? index === 0 ? edit.ID || piece.ID + '#sel' : piece.ID : piece.ID + '#' + (index + 1);

						return Object.assign({}, piece, part, {ID: id, Name: id === piece.ID ? piece.Name : edit.Name && index === 0 ? edit.Name : id});
					})));

					break;
				case 'group':
					among(edit.Pieces).forEach(function (each) {
						list[list.indexOf(each)] = Object.assign({}, each, {Group: edit.Name || 'group'});
					});

					break;
				case 'ungroup':
					list = list.map(function (each) {
						return each.Group === edit.Name ? Object.assign({}, each, {Group: ''}) : each;
					});

					break;
				case 'merge':
					chosen = among(edit.Pieces).filter(function (each) {
						return !skinned(each);
					});

					if (chosen.length < 2) return;

					var merged = self.$Service('Meshes').Merge(chosen.map(function (each) {
						return {Geometry: each.Geometry, Matrix: each.Rest || math.Identity()};
					}));
					var first = list.indexOf(chosen[0]);

					list = list.filter(function (each) {
						return chosen.indexOf(each) === -1 || each === chosen[0];
					});
					list[list.indexOf(chosen[0])] = Object.assign({}, chosen[0], {ID: edit.ID || chosen[0].ID, Name: edit.Name || edit.ID || chosen[0].Name, Geometry: merged, Rest: chosen[0].Rest ? math.Identity() : undefined, Placed: null});

					if (first < 0) return;

					break;
				case 'rename':
					piece = find(edit.Piece);

					if (piece)
						list[list.indexOf(piece)] = Object.assign({}, piece, {Name: edit.Name});

					break;
				case 'parent':
					piece = find(edit.Piece);

					if (piece)
						list[list.indexOf(piece)] = Object.assign({}, piece, {Parent: edit.Parent || ''});

					break;
				case 'pivot':
					piece = find(edit.Piece);

					if (piece)
						list[list.indexOf(piece)] = Object.assign({}, piece, {Pivot: (edit.Pivot || [0, 0, 0]).slice()});

					break;
				case 'remove':
					list = list.filter(function (each) {
						return (edit.Pieces || []).indexOf(each.ID) === -1;
					});

					break;
				case 'keep':
					list = list.filter(function (each) {
						return (edit.Pieces || []).indexOf(each.ID) >= 0;
					});

					break;
				case 'hide':
					list = list.map(function (each) {
						return (edit.Pieces || []).indexOf(each.ID) >= 0 ? Object.assign({}, each, {Hidden: edit.Hidden !== false}) : each;
					});

					break;
				case 'duplicate':
					piece = find(edit.Piece);

					if (!piece || skinned(piece)) return;

					var move = edit.Move || [0, 0, 0];
					var copy = moved(piece, math.Translation(move[0], move[1], move[2]));

					copy.ID = edit.ID || piece.ID + '#copy';
					copy.Name = edit.Name || copy.ID;

					list.splice(list.indexOf(piece) + 1, 0, copy);

					break;
				case 'mirror':
					var axis = {x: 0, y: 1, z: 2}[edit.Axis || 'x'];
					var flip = [1, 1, 1];

					flip[axis] = -1;

					among(edit.Pieces).forEach(function (each) {
						if (!skinned(each))
							list[list.indexOf(each)] = moved(each, math.Scaling(flip[0], flip[1], flip[2]), true);
					});

					break;
				case 'transform':
					var pivot = edit.Pivot || [0, 0, 0];
					var t = edit.Move || [0, 0, 0];
					var r = edit.Turn || [0, 0, 0];
					var k = Number(edit.Scale) || 1;
					var degrees = Math.PI / 180;
					var matrix = math.Multiply(math.Translation(pivot[0] + t[0], pivot[1] + t[1], pivot[2] + t[2]), math.Multiply(math.Rotation([0, 1, 0], r[1] * degrees), math.Multiply(math.Rotation([1, 0, 0], r[0] * degrees), math.Multiply(math.Rotation([0, 0, 1], r[2] * degrees), math.Multiply(math.Scaling(k, k, k), math.Translation(-pivot[0], -pivot[1], -pivot[2]))))));

					among(edit.Pieces).forEach(function (each) {
						if (!skinned(each))
							list[list.indexOf(each)] = moved(each, matrix);
					});

					break;
				case 'origin':
					var low = [Infinity, Infinity, Infinity];
					var high = [-Infinity, -Infinity, -Infinity];

					list.forEach(function (each) {
						var g = each.Placed || each.Geometry;
						var rest = each.Rest || math.Identity();
						var i;

						for (i = 0; i < g.Positions.length; i += 3) {
							var p = math.Apply(rest, [g.Positions[i], g.Positions[i + 1], g.Positions[i + 2]]);

							low = [Math.min(low[0], p[0]), Math.min(low[1], p[1]), Math.min(low[2], p[2])];
							high = [Math.max(high[0], p[0]), Math.max(high[1], p[1]), Math.max(high[2], p[2])];
						}
					});

					if (!isFinite(low[0])) return;

					var shift = math.Translation(-(low[0] + high[0]) / 2, edit.To === 'center' ? -(low[1] + high[1]) / 2 : -low[1], -(low[2] + high[2]) / 2);

					list = list.map(function (each) {
						return skinned(each) ? each : moved(each, shift);
					});

					break;
				default:
					break;
			}
		});

		return list;
	},

	/* The parts of a piece that hang together: its triangles grouped by the corners they share (by place). */
	SplitConnected: function (piece) {
		var g = piece.Geometry;
		var p = g.Positions;
		var index = g.Indices && g.Indices.length ? g.Indices : null;
		var triangles = index ? index.length / 3 : p.length / 9;
		var places = {};
		var parent = [];
		var groups = {};
		var t;

		function at (i) {
			return index ? index[i] : i;
		}

		function root (a) {
			while (parent[a] !== a) {
				parent[a] = parent[parent[a]];
				a = parent[a];
			}

			return a;
		}

		for (t = 0; t < triangles; t++)
			parent[t] = t;

		for (t = 0; t < triangles; t++) {
			[0, 1, 2].forEach(function (corner) {
				var v = at(t * 3 + corner);
				var key = Math.round(p[v * 3] * 1e4) + ',' + Math.round(p[v * 3 + 1] * 1e4) + ',' + Math.round(p[v * 3 + 2] * 1e4);

				if (places[key] === undefined) places[key] = t;
				else parent[root(t)] = root(places[key]);
			});
		}

		for (t = 0; t < triangles; t++)
			(groups[root(t)] = groups[root(t)] || []).push(t);

		return Object.keys(groups).map(function (key) {
			return this.Subset(piece, groups[key]);
		}, this);
	},

	/* A piece cut in two: the triangles all of whose corners are in ranges of vertices, and the rest (when both have any). */
	SplitVertices: function (piece, ranges) {
		var g = piece.Geometry;
		var index = g.Indices && g.Indices.length ? g.Indices : null;
		var triangles = index ? index.length / 3 : g.Positions.length / 9;
		var inside = [];
		var outside = [];
		var t;

		function within (v) {
			return ranges.some(function (range) {
				return v >= range[0] && v <= range[1];
			});
		}

		for (t = 0; t < triangles; t++) {
			var a = index ? index[t * 3] : t * 3;
			var b = index ? index[t * 3 + 1] : t * 3 + 1;
			var c = index ? index[t * 3 + 2] : t * 3 + 2;

			(within(a) && within(b) && within(c) ? inside : outside).push(t);
		}

		return inside.length && outside.length ? [this.Subset(piece, inside), this.Subset(piece, outside)] : [];
	},

	/* The geometry of some triangles of a piece (and of its placed geometry, of a skin): each corner they use once. */
	Subset: function (piece, triangles) {
		function cut (g) {
			var count = g.Positions.length / 3;
			var index = g.Indices && g.Indices.length ? g.Indices : null;
			var map = {};
			var used = [];
			var made = {};
			var keys = Object.keys(g).filter(function (key) {
				return key !== 'Indices' && g[key] && g[key].length && g[key].length % count === 0;
			});

			made.Indices = [];

			triangles.forEach(function (t) {
				[0, 1, 2].forEach(function (corner) {
					var v = index ? index[t * 3 + corner] : t * 3 + corner;

					if (map[v] === undefined) {
						map[v] = used.length;

						used.push(v);
					}

					made.Indices.push(map[v]);
				});
			});

			keys.forEach(function (key) {
				var stride = g[key].length / count;
				var values = new (g[key] instanceof Float32Array ? Float32Array : g[key].constructor === Array ? Array : g[key].constructor)(used.length * stride);
				var i;
				var j;

				for (i = 0; i < used.length; i++) {
					for (j = 0; j < stride; j++)
						values[i * stride + j] = g[key][used[i] * stride + j];
				}

				made[key] = values;
			});

			return Object.assign({}, g, made);
		}

		return {Geometry: cut(piece.Geometry), Placed: piece.Placed ? cut(piece.Placed) : piece.Placed};
	},

	Whole: function (model) {
		var meshes = this.$Service('Meshes');

		return meshes.Merge(model.Pieces.map(function (piece) {
			return piece.Rest ? {Geometry: piece.Placed || piece.Geometry, Matrix: piece.Rest} : {Geometry: piece.Geometry};
		}));
	},

	/*
	 * How large a model is standing still, [x, y, z] in its units (a model of a file fitted as it is drawn), once it is
	 * ready; null before. Made once a model (and again when it is made again: Remake). A craft as long as its Length is
	 * drawn of it (Scene: Length over its longest side).
	 */
	Extent: function (name) {
		var recipe = this.Recipes[name];
		var revision = this.Revisions ? this.Revisions[name] || 0 : 0;
		var positions;
		var low = [Infinity, Infinity, Infinity];
		var high = [-Infinity, -Infinity, -Infinity];
		var i;
		var axis;

		if (!recipe || !this.Ready(name)) return null;

		if (recipe.Extent && recipe.Extent.Revision === revision) return recipe.Extent.Size.slice();

		positions = this.Whole(this.Make(name)).Positions;

		for (i = 0; i < positions.length; i += 3)
			for (axis = 0; axis < 3; axis++) {
				low[axis] = Math.min(low[axis], positions[i + axis]);
				high[axis] = Math.max(high[axis], positions[i + axis]);
			}

		recipe.Extent = {Revision: revision, Size: positions.length ? [high[0] - low[0], high[1] - low[1], high[2] - low[2]] : [1, 1, 1]};

		return recipe.Extent.Size.slice();
	},

	/* A model of a file standing still, one geometry for each material: for what is sown near the eye. */
	Surfaces: function (model) {
		var meshes = this.$Service('Meshes');
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
			each.Geometry = meshes.Merge(each.Parts);

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
		var math = this.$Service('Math');
		var world = [];

		function visit (index, parent) {
			var each = pose[index];

			world[index] = math.Multiply(parent, self.NodeMatrix(each.T, each.R, each.S));

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
		var math = this.$Service('Math');
		var asset = recipe.Asset;
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), math.Identity());
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
				return math.Multiply(rest[joint], self.InverseOf(skin, index));
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
				var matrix = skinned ? math.Identity() : rest[index];
				var placed = skinned ? self.Placed(geometry, binds[skin]) : null;
				var seen = placed || geometry;
				var i;

				for (i = 0; i < seen.Positions.length; i += 3) {
					var point = math.Apply(matrix, [seen.Positions[i], seen.Positions[i + 1], seen.Positions[i + 2]]);

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
			fit = math.Identity();
		}
		else {
			/* A body stands on its hips: what trails behind it is no reason to turn round another point. */
			var hips = this.HipsOf(asset);

			fit = math.Multiply(math.Scaling(scale, scale, scale), math.Translation(hips === -1 ? -(box.Low[0] + box.High[0]) / 2 : -rest[hips][12], -box.Low[1], hips === -1 ? -(box.Low[2] + box.High[2]) / 2 : -rest[hips][14]));
		}

		pieces.forEach(function (piece) {
			piece.Rest = math.Multiply(fit, piece.Rest);
		});

		if (recipe.Apart)
			pieces = this.Apart(asset, pieces, new RegExp(recipe.Apart));

		var lamps = this.BuiltLamps(asset, pieces, rest, fit, Math.max(box.High[0] - box.Low[0], box.High[1] - box.Low[1], box.High[2] - box.Low[2]) * (recipe.Fit === false ? 1 : scale));

		if (recipe.Merge)
			pieces = this.Merged(pieces);

		model = {Lamps: lamps, Name: name, Key: key, Group: recipe.Group || '', Type: recipe.Type || '', Size: recipe.Size || 1, Speed: recipe.Speed || 0, Sway: recipe.Sway || 0, Matte: false, Soft: recipe.Soft || 0, Clips: this.ClipsOf(asset, recipe), Pieces: pieces, Asset: asset, Fit: fit, Joints: joints, Moves: asset.Animations.length > 0, Merge: recipe.Merge};

		return model;
	},

	/* What a file keeps as one piece and stands apart, such as four wheels in one mesh: cut at the wide gaps across and along it. */
	Apart: function (asset, pieces, word) {
		var math = this.$Service('Math');
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
				var middle = math.Apply(piece.Rest, [0, 1, 2].map(function (axis) {
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
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var cell = Math.max(extent, 1e-3) / 24;
		var cells = {};
		var lamps = [];

		asset.Nodes.forEach(function (node, index) {
			var light = node.Light === undefined || node.Light === -1 ? null : asset.Lights[node.Light];
			var world;

			if (!light || light.Type === 'directional') return;

			world = math.Multiply(fit, rest[index]);

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

				return math.Apply(piece.Rest, [geometry.Positions[index * 3], geometry.Positions[index * 3 + 1], geometry.Positions[index * 3 + 2]]);
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
		return skin.Inverse ? Array.prototype.slice.call(skin.Inverse, index * 16, index * 16 + 16) : this.$Service('Math').Identity();
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
		var math = this.$Service('Math');
		var count = geometry.Positions.length / 3;
		var middle = [0, 0, 0];
		var nearest = Infinity;
		var skin = 0;
		var joint = 0;
		var i;

		for (i = 0; i < count; i++) {
			var point = math.Apply(matrix, [geometry.Positions[i * 3], geometry.Positions[i * 3 + 1], geometry.Positions[i * 3 + 2]]);

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

		var to = math.Multiply(math.Invert(binds[skin][joint]), matrix);
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
		var math = this.$Service('Math');
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), math.Identity());
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

				rest = self.NodeWorld(asset, self.Sample(asset, null, 0), math.Identity());
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
		var above = pelvis.Parent === -1 ? math.Identity() : math.Invert(rest[pelvis.Parent]) || math.Identity();
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
		var math = this.$Service('Math');
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), math.Identity());
		var node = asset.Nodes[index];

		function within (matrix, point) {
			var m = math.Invert(matrix) || math.Identity();

			return [m[0] * point[0] + m[4] * point[1] + m[8] * point[2] + m[12], m[1] * point[0] + m[5] * point[1] + m[9] * point[2] + m[13], m[2] * point[0] + m[6] * point[1] + m[10] * point[2] + m[14]];
		}

		var hung = node.Children.map(function (child) {
			return [rest[child][12], rest[child][13], rest[child][14]];
		});

		node.Translation = node.Parent === -1 ? place : within(rest[node.Parent], place);
		rest = this.NodeWorld(asset, this.Sample(asset, null, 0), math.Identity());

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
		var rest = this.NodeWorld(asset, this.Sample(asset, null, 0), this.$Service('Math').Identity());
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
		var meshes = this.$Service('Meshes');
		var math = this.$Service('Math');
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
			return {ID: 'whole-' + index, Parent: '', Pivot: [0, 0, 0], Team: false, Geometry: meshes.Merge(group.Parts), Material: group.Material, Node: -1, Skin: -1, JointOffset: 0, Rest: math.Identity(), Placed: null};
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
		var math = this.$Service('Math');
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
					var m = math.Multiply(world[joint], self.InverseOf(skin, index));

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
				var bound = math.Invert(self.InverseOf(skin, index));

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
		var vectors = this.$Service('Math').Vectors;
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
		var math = this.$Service('Math');
		var kept = model.GripTurns = model.GripTurns || {};
		var key = bone + '>' + aim;
		var clip = model.Clips.idle ? 'idle' : '';

		if (!kept[key]) {
			var hand = this.BoneMatrix(model, bone, clip, 0);
			var other = this.BoneMatrix(model, aim, clip, 0);
			var plain = hand ? this.Grip(hand, null) : math.Identity();
			var palm = hand ? this.Palm(model, bone, clip, hand) : null;
			var far = other ? this.Palm(model, aim, clip, other) : null;

			kept[key] = hand && other ? math.Multiply(math.Invert(plain), this.Grip(palm, far)) : math.Identity();
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
		var meshes = this.$Service('Meshes');
		var whole = this.Whole(this.Make(name, options));
		var bounds = this.Bounds(whole);

		return [whole, meshes.Simplify(whole, bounds.Radius / 15), meshes.Simplify(whole, bounds.Radius / 5)];
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
		var math = this.$Service('Math');
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
				matrices[piece.ID] = parent || math.Identity();

				return;
			}

			local = math.Translation(pivot[0] + values[3], pivot[1] + values[4], pivot[2] + values[5]);
			local = math.Multiply(local, math.Rotation([0, 1, 0], values[1] * degrees));
			local = math.Multiply(local, math.Rotation([1, 0, 0], values[0] * degrees));
			local = math.Multiply(local, math.Rotation([0, 0, 1], values[2] * degrees));
			local = math.Multiply(local, math.Translation(-pivot[0], -pivot[1], -pivot[2]));

			matrices[piece.ID] = parent ? math.Multiply(parent, local) : local;
		});

		return matrices;
	},

	/* The numbers of a shape: always the same for the same text. */
	Random: function (text) {
		return this.$Service('Random').Seeded(text);
	},

	/*
	 * The pieces of a recipe of data: its Parts [{ID, Shape (box, wedge, cylinder, ball, blob, lathe), Piece (the piece it
	 * belongs to: body by default; a rig moves its pieces by their names), Tags, At, Size [x, y, z], Turn (degrees), Color
	 * (#rrggbb or [r, g, b]), Top (of a cylinder, a part of its radius: 0 a cone), Segments, Rough (of a blob), Points (of a
	 * lathe: [[radius, height]...]), Mirror (a copy on the other side of X too, its piece -l and -r swapped), Chance (0 to 1:
	 * how often a variant has it), Vary {At, Size, Turn (as much either way), Color (lighter or darker by as much)}}] and its
	 * Pieces [{ID, Parent, Pivot, Team}]. Variant 0 is the parts as they are; the others are varied by their seed.
	 */
	Assemble: function (recipe, tools, random, variant) {
		var math = tools.Math;
		var degrees = Math.PI / 180;
		var pieces = {};
		var order = [];
		var varied = variant > 0;

		function color (value) {
			var text = String(value || '#c8c8c8');

			if (Array.isArray(value))
				return value.slice(0, 3);

			return [parseInt(text.slice(1, 3), 16) / 255, parseInt(text.slice(3, 5), 16) / 255, parseInt(text.slice(5, 7), 16) / 255];
		}

		/* A list of three, each as much either way as its vary says: always the same draws, so a part keeps its seed. */
		function vary (list, amount, fallback) {
			return [0, 1, 2].map(function (i) {
				var base = list && list[i] !== undefined ? Number(list[i]) : fallback[i];
				var spread = Array.isArray(amount) ? Number(amount[i]) || 0 : Number(amount) || 0;
				var drawn = random(-1, 1);

				return varied ? base + spread * drawn : base;
			});
		}

		function matrix (at, turn, scale) {
			var result = math.Translation(at[0], at[1], at[2]);

			result = math.Multiply(result, math.Rotation([0, 1, 0], turn[1] * degrees));
			result = math.Multiply(result, math.Rotation([1, 0, 0], turn[0] * degrees));
			result = math.Multiply(result, math.Rotation([0, 0, 1], turn[2] * degrees));

			return scale ? math.Multiply(result, math.Scaling(scale[0], scale[1], scale[2])) : result;
		}

		function shape (part, at, size, turn, tint) {
			var made;

			if (part.Shape === 'wedge')
				return tools.Wedge(size[0], size[1], size[2], at, tint, turn);

			if (part.Shape === 'cylinder')
				return tools.Cylinder(size[0] / 2, size[0] / 2 * (part.Top === undefined ? 1 : Number(part.Top)), size[1], at, tint, turn, Number(part.Segments) || 12);

			if (part.Shape === 'ball') made = tools.Ball(0.5, [0, 0, 0], tint);
			else if (part.Shape === 'blob') made = tools.Blob(0.5, at, tint, part.Rough === undefined ? 0.6 : Number(part.Rough));
			else if (part.Shape === 'lathe') made = tools.Lathe(part.Points && part.Points.length > 1 ? part.Points : [[0, 0], [0.5, 0], [0.5, 1], [0, 1]], [0, 0, 0], tint, Number(part.Segments) || 12);
			else return tools.Box(size[0], size[1], size[2], at, tint, turn);

			made.Matrix = matrix(at, turn, size);

			return made;
		}

		/* A part of a material of SceneMaterials (Material: its name) keeps it: the model draws it by its pattern. */
		function put (id, made, part) {
			if (part && part.Material)
				made.Material = String(part.Material);

			if (!pieces[id]) {
				pieces[id] = [];

				order.push(id);
			}

			pieces[id].push(made);
		}

		(recipe.Parts || []).forEach(function (part) {
			/* What a variant makes of it: always the same draws, so the parts after it keep theirs whatever it is. */
			var change = part.Vary || {};
			var drawn = random(0, 1);
			var at = vary(part.At, change.At, [0, 0.5, 0]);
			var size = vary(part.Size, change.Size, [1, 1, 1]).map(function (one) {
				return Math.max(0.001, one);
			});
			var turn = vary(part.Turn, change.Turn, [0, 0, 0]);
			var shade = 1 + (varied ? Number(change.Color) || 0 : 0) * random(-1, 1);
			/* Over 1 it glows (a window lit): not cut to 1 (Regression: the lit windows of a building of a graph came out white). */
			var tint = color(part.Color).map(function (one) {
				return Math.max(0, one * shade);
			});
			var id = part.Piece || 'body';

			/* A part a variant may leave out, by its chance. */
			if (varied && part.Chance !== undefined && part.Chance !== '' && drawn >= Number(part.Chance)) return;

			put(id, shape(part, at, size, turn, tint), part);

			/* Its mirror: the same, on the other side of X, in the piece of that side. */
			if (part.Mirror)
				put(/-l$/.test(id) ? id.slice(0, -2) + '-r' : /-r$/.test(id) ? id.slice(0, -2) + '-l' : id, shape(part, [-at[0], at[1], at[2]], size, [turn[0], -turn[1], -turn[2]], tint), part);
		});

		return order.map(function (id) {
			var given = (recipe.Pieces || []).filter(function (piece) {
				return piece.ID === id;
			})[0] || {};

			return tools.Piece(id, pieces[id], {Parent: given.Parent || '', Pivot: given.Pivot || [0, 0, 0], Team: !!given.Team});
		});
	},

	/* The pieces of a model of data whose parts carry a tag, or its part names with it: what a game finds of a model. */
	Tagged: function (name, tag) {
		var recipe = this.Recipes[name];
		var found = [];

		(recipe && recipe.Parts || []).forEach(function (part) {
			var id = part.Piece || 'body';

			if ((part.Tags || []).indexOf(tag) === -1) return;

			[id].concat(part.Mirror ? [/-l$/.test(id) ? id.slice(0, -2) + '-r' : /-r$/.test(id) ? id.slice(0, -2) + '-l' : id] : []).forEach(function (one) {
				if (found.indexOf(one) === -1)
					found.push(one);
			});
		});

		return found;
	},

	/* What a recipe builds with. */
	Tools: function () {
		var meshes = this.$Service('Meshes');
		var math = this.$Service('Math');
		var degrees = Math.PI / 180;

		function matrix (at, turn) {
			var result = math.Translation(at ? at[0] : 0, at ? at[1] : 0, at ? at[2] : 0);

			if (turn) {
				result = math.Multiply(result, math.Rotation([0, 1, 0], (turn[1] || 0) * degrees));
				result = math.Multiply(result, math.Rotation([1, 0, 0], (turn[0] || 0) * degrees));
				result = math.Multiply(result, math.Rotation([0, 0, 1], (turn[2] || 0) * degrees));
			}

			return result;
		}

		return {
			Meshes: meshes,
			Math: this.$Service('Math'),
			Rigs: this.Rigs(),

			Piece: function (id, parts, options) {
				return Object.assign({ID: id, Parts: parts}, options || {});
			},

			Box: function (width, height, depth, at, color, turn) {
				return {Geometry: meshes.Box({Width: width, Height: height, Depth: depth}), Matrix: matrix(at, turn), Color: color};
			},

			Cylinder: function (radius, top, height, at, color, turn, segments) {
				return {Geometry: meshes.Cylinder({Radius: radius, Top: top, Height: height, Segments: segments || 8}), Matrix: matrix(at, turn), Color: color};
			},

			Ball: function (radius, at, color, scale) {
				return {Geometry: meshes.Sphere({Radius: radius, Segments: 10, Rings: 7}), Matrix: math.Multiply(matrix(at), scale ? math.Scaling(scale[0], scale[1], scale[2]) : math.Identity()), Color: color};
			},

			/* A lump of faces: leaves, a stone. */
			Blob: function (radius, at, color, rough, scale) {
				var noise = math.Noise(String(radius) + at.join(','));
				var shaped = meshes.Displace(meshes.Icosphere({Radius: radius, Detail: 1}), function (point) {
					return (noise.Fbm(point[0] * 3 / radius, point[1] * 3 / radius, point[2] * 3 / radius, 2) - 0.5) * radius * (rough === undefined ? 0.8 : rough);
				});

				return {Geometry: shaped, Matrix: math.Multiply(matrix(at), scale ? math.Scaling(scale[0], scale[1], scale[2]) : math.Identity()), Color: color};
			},

			Lathe: function (points, at, color, segments) {
				return {Geometry: meshes.Lathe({Points: points, Segments: segments || 12}), Matrix: matrix(at), Color: color};
			},

			Wedge: function (width, height, depth, at, color, turn) {
				return {Geometry: meshes.Wedge({Width: width, Height: height, Depth: depth}), Matrix: matrix(at, turn), Color: color};
			}
		};
	},

	/* The clips of the bodies that share their joints: of two legs, of four, of tracks (resources/models/rigs.json, a copy at each call). */
	Rigs: function () {
		return Elemenx.Resources('Data', 'ElemenxGraphics/models/rigs') || {};
	},

	Builtin: function () {
		var self = this;
		var rigs = this.Rigs();
		var table = Elemenx.Resources('Data', 'ElemenxGraphics/models/builtin') || {};

		/* The mannequin of SceneMannequin: a person of code, made the first time it is asked for. */
		this.Define('mannequin', {URL: 'mannequin:mannequin', Group: 'characters', Type: 'unit', Size: 1.78, Clips: {run: 'jog'}, Generate: function (callback) {
			var asset;

			try {
				asset = self.$Service('SceneMannequin').Asset({});
			}
			catch (error) {
				callback(error, null);

				return;
			}

			callback(null, asset);
		}});

		/*
		 * The other models of the library: graphs of the kind model (blueprints/models/<name>, of ModelBlueprints; a loop of one
		 * a graph <name>-<loop> its Repeat calls, the bodies of two legs and of four the graphs biped and quadruped), each told
		 * in resources/models/builtin: Group, Type, Size, Speed, Sway, Variants, Matte, Smooth, Lamps, Clips ({Rig}: the clips
		 * of a rig, and what is its own) and Graph. Regression: their parts were written out here in code, 750 lines.
		 */
		Object.keys(table).forEach(function (name) {
			var recipe = Object.assign({}, table[name]);
			var clips = recipe.Clips;

			if (clips && clips.Rig) {
				recipe.Clips = Object.assign({}, rigs[clips.Rig], clips);

				delete recipe.Clips.Rig;
			}

			self.Define(name, recipe);
		});
	}
});
