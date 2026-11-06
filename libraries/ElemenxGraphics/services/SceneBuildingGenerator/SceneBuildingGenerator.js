/*
 * Buildings of any size, made of their numbers: from a shack to a tower of offices, each a model of the Models Service,
 * so a SceneObject, a Scatter and a settlement place it as any other.
 * - Classes(): the classes and what each one is by default: shack, cabin, cottage, house, villa, townhouse, shop, warehouse,
 *   factory, apartments, office, tower, skyscraper, business (a business centre: a podium, a tower of glass in setbacks),
 *   school, church (a nave and its bell tower), station (a hall, its clock tower, a canopy over its platform), fuel (a
 *   canopy over the pumps, a shop behind), hangar (a vault of metal), garage, barn (a gambrel roof), watertower (a tank on
 *   legs), parking (open floors of a car park).
 * - Options(options): the whole of a building: its Class gives what is not told. Width and Depth (metres), Floors and
 *   FloorHeight (metres), Roof (gable, hip, shed, flat, dome, spire, gambrel, vault), Walls (wood, log, brick, stone,
 *   plaster, concrete, glass, metal), Windows (0 to 1: how much of a wall is glass), Plan (rect, L, U, court: its wings
 *   within its Width and Depth), Annex (a lower wing on its side: true, false, or by chance), Porch (a roof over its door
 *   on posts), Cornice (a band under its roof and a plinth: true by default for walls of masonry), Setbacks (how many times
 *   a tall one steps in), Podium (the floors of a wider base), Crown (none, spire, antenna, helipad), Balconies, Lit (0 to
 *   1: the windows lit, as at night), Color (of the walls, over their material), Seed.
 * - Pieces(tools, options, random): its pieces, in metres over its height (the model of Models takes its Size as its height).
 * - Define(name, options): a model of Models of that name; its Variants differ by the windows lit: SceneModels.Make(name, {Variant}).
 * - Random(options, seed): the options of a building of a class, varied by a seed within what the class allows.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneBuildingGenerator', {
	$Meta: {
		Description: 'Buildings of any size made of their numbers, from a shack to a business centre: models of the Models Service.',
		Methods: ['Classes()', 'Options(options)', 'Pieces(tools, options, random)', 'Define(name, options)', 'Random(options, seed)']
	},

	/* What each class is: its size, its floors (from, to), its roof and its walls, how much glass. */
	Defaults: {
		shack: {Width: 3.5, Depth: 3, Floors: [1, 1], FloorHeight: 2.4, Roof: 'shed', Walls: 'wood', Windows: 0.1},
		cabin: {Width: 5, Depth: 4, Floors: [1, 1], FloorHeight: 2.6, Roof: 'gable', Walls: 'log', Windows: 0.15},
		cottage: {Width: 7, Depth: 6, Floors: [1, 2], FloorHeight: 2.8, Roof: 'gable', Walls: 'plaster', Windows: 0.2},
		house: {Width: 9, Depth: 8, Floors: [2, 2], FloorHeight: 3, Roof: 'hip', Walls: 'brick', Windows: 0.25},
		villa: {Width: 16, Depth: 12, Floors: [2, 3], FloorHeight: 3.3, Roof: 'flat', Walls: 'plaster', Windows: 0.45, Balconies: true},
		townhouse: {Width: 6, Depth: 10, Floors: [3, 4], FloorHeight: 3, Roof: 'gable', Walls: 'brick', Windows: 0.3},
		shop: {Width: 10, Depth: 10, Floors: [1, 2], FloorHeight: 3.6, Roof: 'flat', Walls: 'plaster', Windows: 0.4},
		warehouse: {Width: 30, Depth: 20, Floors: [1, 1], FloorHeight: 8, Roof: 'gable', Walls: 'metal', Windows: 0.05},
		factory: {Width: 40, Depth: 28, Floors: [1, 2], FloorHeight: 7, Roof: 'shed', Walls: 'brick', Windows: 0.2},
		apartments: {Width: 24, Depth: 14, Floors: [5, 12], FloorHeight: 3, Roof: 'flat', Walls: 'concrete', Windows: 0.35, Balconies: true},
		office: {Width: 30, Depth: 24, Floors: [6, 14], FloorHeight: 3.6, Roof: 'flat', Walls: 'glass', Windows: 0.7},
		tower: {Width: 26, Depth: 26, Floors: [20, 35], FloorHeight: 3.6, Roof: 'flat', Walls: 'glass', Windows: 0.8, Setbacks: 2, Crown: 'antenna'},
		skyscraper: {Width: 34, Depth: 34, Floors: [40, 70], FloorHeight: 3.8, Roof: 'flat', Walls: 'glass', Windows: 0.85, Setbacks: 3, Crown: 'spire'},
		business: {Width: 40, Depth: 32, Floors: [25, 45], FloorHeight: 3.8, Roof: 'flat', Walls: 'glass', Windows: 0.85, Setbacks: 2, Podium: 3, Crown: 'helipad'},
		school: {Width: 40, Depth: 30, Floors: [2, 3], FloorHeight: 3.6, Roof: 'hip', Walls: 'brick', Windows: 0.45, Plan: 'U'},
		church: {Width: 12, Depth: 26, Floors: [1, 1], FloorHeight: 9, Roof: 'gable', Walls: 'stone', Windows: 0.15, Special: 'church'},
		station: {Width: 46, Depth: 16, Floors: [1, 2], FloorHeight: 5, Roof: 'hip', Walls: 'brick', Windows: 0.35, Special: 'station'},
		fuel: {Width: 22, Depth: 20, Floors: [1, 1], FloorHeight: 3.4, Roof: 'flat', Walls: 'plaster', Windows: 0.5, Special: 'fuel'},
		hangar: {Width: 30, Depth: 40, Floors: [1, 1], FloorHeight: 6, Roof: 'vault', Walls: 'metal', Windows: 0.04},
		garage: {Width: 6, Depth: 7, Floors: [1, 1], FloorHeight: 2.8, Roof: 'flat', Walls: 'brick', Windows: 0, Special: 'garage'},
		barn: {Width: 14, Depth: 22, Floors: [1, 1], FloorHeight: 5, Roof: 'gambrel', Walls: 'wood', Windows: 0.05},
		watertower: {Width: 9, Depth: 9, Floors: [1, 1], FloorHeight: 26, Roof: 'flat', Walls: 'metal', Windows: 0, Special: 'watertower'},
		parking: {Width: 36, Depth: 32, Floors: [3, 5], FloorHeight: 3, Roof: 'flat', Walls: 'concrete', Windows: 0, Special: 'parking'}
	},

	/* The colors of the materials of walls, and their gloss (glass and metal shine). */
	Materials: {
		wood: [0.5, 0.37, 0.24], log: [0.44, 0.31, 0.2], brick: [0.6, 0.3, 0.22], stone: [0.62, 0.6, 0.56], plaster: [0.9, 0.86, 0.78],
		concrete: [0.66, 0.66, 0.64], glass: [0.34, 0.46, 0.56], metal: [0.6, 0.63, 0.66]
	},

	Classes: function () {
		return Object.keys(this.Defaults);
	},

	Options: function (options) {
		var given = options || {};
		var base = this.Defaults[given.Class] || this.Defaults.house;
		var made = Object.assign({Class: this.Defaults[given.Class] ? given.Class : 'house', Setbacks: 0, Podium: 0, Crown: 'none', Balconies: false, Lit: 0, Color: null, Seed: '', Plan: 'rect', Annex: null, Porch: null, Cornice: null, Special: ''}, base, given);

		made.Class = this.Defaults[given.Class] ? given.Class : 'house';
		made.Floors = Math.max(1, Math.round(Array.isArray(made.Floors) ? made.Floors[0] : Number(made.Floors) || 1));
		made.Width = Math.max(1.5, Number(made.Width) || base.Width);
		made.Depth = Math.max(1.5, Number(made.Depth) || base.Depth);
		made.FloorHeight = Math.max(2, Number(made.FloorHeight) || base.FloorHeight);
		made.Windows = Math.max(0, Math.min(1, Number(made.Windows)));
		made.Setbacks = Math.max(0, Math.round(Number(made.Setbacks) || 0));
		made.Podium = Math.max(0, Math.min(made.Floors - 1, Math.round(Number(made.Podium) || 0)));
		made.Lit = Math.max(0, Math.min(1, Number(made.Lit) || 0));
		made.Plan = ['L', 'U', 'court'].indexOf(made.Plan) >= 0 && !made.Setbacks && !made.Podium ? made.Plan : 'rect';
		made.Cornice = made.Cornice === null || made.Cornice === undefined ? ['brick', 'stone', 'plaster', 'concrete'].indexOf(made.Walls) >= 0 && made.Windows <= 0.6 : !!made.Cornice;
		made.Height = made.Floors * made.FloorHeight + this.RoofHeight(made);

		/* What stands over its roof: the bell tower of a church, the clock of a station. */
		if (made.Special === 'church')
			made.Height = Math.max(made.Height, made.Floors * made.FloorHeight * 2.6);

		if (made.Special === 'station')
			made.Height = Math.max(made.Height, made.Floors * made.FloorHeight + made.Depth * 0.9);

		return made;
	},

	RoofHeight: function (made) {
		var crown = made.Crown === 'spire' ? made.Floors * made.FloorHeight * 0.18 : made.Crown === 'antenna' ? 12 : made.Crown === 'helipad' ? 1.2 : 0;
		var roof = {gable: 0.45, hip: 0.35, shed: 0.18, dome: 0.5, spire: 1.2, flat: 0.04, gambrel: 0.5, vault: 0.5}[made.Roof];

		/* A building of wings: the roof of a wing, as wide as it. */
		var span = made.Plan && made.Plan !== 'rect' ? Math.max(6, Math.min(made.Width, made.Depth) * 0.32) : Math.min(made.Width, made.Depth);

		return span * (roof === undefined ? 0.04 : roof) + crown;
	},

	/* The options of a building of a class, varied by a seed: its floors within the range of its class, its size by a fifth. */
	Random: function (options, seed) {
		var given = options || {};
		var base = this.Defaults[given.Class] || this.Defaults.house;
		var random = this.$Service('SceneModels').Random(String(seed === undefined ? given.Seed || '' : seed) + ':' + (given.Class || 'house'));
		var floors = Array.isArray(given.Floors || base.Floors) ? given.Floors || base.Floors : [given.Floors || base.Floors, given.Floors || base.Floors];

		return this.Options(Object.assign({}, given, {
			Floors: Math.round(random(floors[0], floors[1] + 0.999) - 0.499),
			Width: (Number(given.Width) || base.Width) * random(0.85, 1.15),
			Depth: (Number(given.Depth) || base.Depth) * random(0.85, 1.15),
			Lit: given.Lit === undefined ? 0 : given.Lit
		}));
	},

	/*
	 * Its pieces, in metres divided by its height (the model is as tall as its Size): the walls of each tier, the windows of each
	 * floor on each side (glass of tall ones in bands, with the slabs between floors), balconies, the roof, the crown.
	 */
	Pieces: function (tools, options, random) {
		var made = this.Options(options);
		if (made.Special === 'watertower' || made.Special === 'parking' || made.Special === 'fuel') return [tools.Piece('body', this.Special(tools, made, random))];

		if (made.Plan !== 'rect')
			return [tools.Piece('body', this.Wings(tools, made, random))];

		var unit = 1 / made.Height;
		var wall = made.Color ? this.Color(made.Color) : this.Materials[made.Walls] || this.Materials.plaster;
		var glass = [0.16, 0.22, 0.28];
		var lit = [2.2, 1.9, 1.3];
		var frame = [0.32, 0.33, 0.35];
		var roofColor = made.Walls === 'glass' || made.Walls === 'concrete' || made.Walls === 'metal' ? [0.38, 0.39, 0.41] : [0.55, 0.26, 0.2];
		var parts = [];
		var tiers = made.Setbacks + 1;
		var podium = made.Podium;
		var floor = 0;
		var width = made.Width;
		var depth = made.Depth;
		var band = made.Windows > 0.6;
		var t;

		function box (w, h, d, at, color) {
			parts.push(tools.Box(w * unit, h * unit, d * unit, [at[0] * unit, at[1] * unit, at[2] * unit], color));
		}

		/* The windows of a floor on the four sides: in bands of glass, or panes a step apart, some of them lit. */
		function windows (w, d, y, h) {
			var high = h * (band ? 0.8 : 0.5);
			var middle = y + h * (band ? 0.5 : 0.55);

			[[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (side) {
				var along = side[0] ? d : w;
				var count;
				var i;

				/* A wall of glass: panels of about three metres between thin mullions, each lit or not of its own. */
				if (band) {
					count = Math.max(1, Math.round(along / 3));

					for (i = 0; i < count; i++) {
						var offset = (i + 0.5) / count * along - along / 2;
						var panel = along / count - 0.12;

						box(side[0] ? 0.06 : panel, high, side[0] ? panel : 0.06, [side[0] * (w / 2 + 0.02) + (side[0] ? 0 : offset), middle, side[1] * (d / 2 + 0.02) + (side[0] ? offset : 0)], random(0, 1) < made.Lit ? lit : glass);
					}

					return;
				}

				count = Math.max(1, Math.round(along * made.Windows / 1.2));

				for (i = 0; i < count; i++) {
					var at = (i + 0.5) / count * along - along / 2;
					var pane = Math.min(1.4, along / count * 0.6);

					box(side[0] ? 0.06 : pane, high, side[0] ? pane : 0.06, [side[0] * (w / 2 + 0.02) + (side[0] ? 0 : at), middle, side[1] * (d / 2 + 0.02) + (side[0] ? at : 0)], random(0, 1) < made.Lit ? lit : glass);
				}
			});
		}

		/* The tiers: a podium of its own, then the tower stepping in at each setback. */
		for (t = 0; t < (podium ? 1 : 0) + tiers; t++) {
			var isPodium = podium && t === 0;
			var step = t - (podium ? 1 : 0);
			var share = Math.max(1, Math.floor((made.Floors - podium) / tiers));
			var floors = isPodium ? podium : step === tiers - 1 ? made.Floors - floor : share;
			var tierWidth = isPodium ? made.Width : made.Width * (podium ? 0.62 : 1) * Math.pow(0.82, step);
			var tierDepth = isPodium ? made.Depth : made.Depth * (podium ? 0.62 : 1) * Math.pow(0.82, step);
			var f;

			floors = Math.min(floors, made.Floors - floor);

			if (floors <= 0) break;

			box(tierWidth, floors * made.FloorHeight, tierDepth, [0, (floor + floors / 2) * made.FloorHeight, 0], band ? frame : wall);

			for (f = 0; f < floors; f++) {
				windows(tierWidth, tierDepth, (floor + f) * made.FloorHeight, made.FloorHeight);

				/* Balconies on the front of each floor over the first. */
				if (made.Balconies && floor + f > 0)
					box(tierWidth * 0.5, 0.15, 1.2, [0, (floor + f) * made.FloorHeight + 0.08, tierDepth / 2 + 0.6], frame);
			}

			/* A slab between tiers, a little wider than the one over it. */
			box(tierWidth + 0.3, 0.25, tierDepth + 0.3, [0, (floor + floors) * made.FloorHeight, 0], frame);

			floor += floors;
			width = tierWidth;
			depth = tierDepth;
		}

		this.Roof(tools, made, parts, width, depth, floor * made.FloorHeight, unit, roofColor);

		/* What crowns a tall one. */
		if (made.Crown === 'spire')
			parts.push(tools.Cylinder(Math.min(width, depth) * 0.12 * unit, 0, made.Floors * made.FloorHeight * 0.18 * unit, [0, (floor * made.FloorHeight + made.Floors * made.FloorHeight * 0.09) * unit, 0], frame));

		if (made.Crown === 'antenna')
			parts.push(tools.Cylinder(0.3 * unit, 0.1 * unit, 12 * unit, [0, (floor * made.FloorHeight + 6) * unit, 0], frame));

		if (made.Crown === 'helipad')
			parts.push(tools.Cylinder(Math.min(width, depth) * 0.4 * unit, Math.min(width, depth) * 0.4 * unit, 0.4 * unit, [0, (floor * made.FloorHeight + 0.6) * unit, 0], [0.3, 0.32, 0.3]));

		/* A door at the middle of its front. */
		box(Math.min(2, made.Width * 0.25), Math.min(2.2, made.FloorHeight * 0.8), 0.1, [0, Math.min(2.2, made.FloorHeight * 0.8) / 2, made.Depth / 2 + 0.05], made.Special === 'garage' ? [0.42, 0.43, 0.45] : [0.3, 0.22, 0.16]);

		/* A garage: its door as wide as it. */
		if (made.Special === 'garage')
			box(made.Width * 0.8, Math.min(2.4, made.FloorHeight * 0.85), 0.08, [0, Math.min(2.4, made.FloorHeight * 0.85) / 2, made.Depth / 2 + 0.05], [0.5, 0.51, 0.53]);

		this.Dress(tools, made, parts, unit, random, wall, roofColor);

		return [tools.Piece('body', parts)];
	},

	/*
	 * What a building of masonry has on it, and a house beside it: a cornice under its roof and a plinth (Cornice), a porch over
	 * its door (Porch: houses by chance), a lower wing behind it (Annex: houses and shops by chance); a church its bell tower,
	 * a station its clock tower and the canopy of its platform.
	 */
	Dress: function (tools, made, parts, unit, random, wall, roofColor) {
		var top = made.Floors * made.FloorHeight;
		var homely = ['cottage', 'house', 'villa', 'townhouse', 'cabin'].indexOf(made.Class) >= 0;
		var stone = [Math.min(1, wall[0] * 0.78), Math.min(1, wall[1] * 0.78), Math.min(1, wall[2] * 0.78)];
		var porch = made.Porch === null ? homely && random(0, 1) < 0.6 : !!made.Porch;
		var annex = made.Annex === null ? (homely || made.Class === 'shop') && random(0, 1) < 0.45 : !!made.Annex;
		var side;

		function box (w, h, d, at, color, turn) {
			parts.push(tools.Box(w * unit, h * unit, d * unit, [at[0] * unit, at[1] * unit, at[2] * unit], color, turn));
		}

		if (made.Cornice) {
			box(made.Width + 0.5, 0.35, made.Depth + 0.5, [0, top - 0.25, 0], stone);
			box(made.Width + 0.16, 0.6, made.Depth + 0.16, [0, 0.3, 0], stone);
		}

		if (porch) {
			box(Math.min(4, made.Width * 0.5), 0.15, 1.8, [0, 0.07, made.Depth / 2 + 0.9], stone);
			box(Math.min(4.2, made.Width * 0.52), 0.12, 2, [0, 2.6, made.Depth / 2 + 1], roofColor);
			box(0.15, 2.5, 0.15, [-Math.min(1.9, made.Width * 0.24), 1.3, made.Depth / 2 + 1.8], [0.9, 0.9, 0.88]);
			box(0.15, 2.5, 0.15, [Math.min(1.9, made.Width * 0.24), 1.3, made.Depth / 2 + 1.8], [0.9, 0.9, 0.88]);
		}

		/* A lower wing behind it, to one side: away from the street, off the lots beside. */
		if (annex) {
			side = random(0, 1) < 0.5 ? -1 : 1;

			box(made.Width * 0.5, Math.min(made.FloorHeight, 3), made.Depth * 0.45, [side * made.Width * 0.25, Math.min(made.FloorHeight, 3) / 2, -made.Depth * 0.72], wall);
			box(made.Width * 0.52, 0.2, made.Depth * 0.48, [side * made.Width * 0.25, Math.min(made.FloorHeight, 3) + 0.1, -made.Depth * 0.72], roofColor, [-6, 0, 0]);
			box(Math.min(1.4, made.Width * 0.2), 1.1, 0.06, [side * made.Width * 0.25, 1.6, -made.Depth * 0.945 - 0.03], [0.16, 0.22, 0.28]);
		}

		/* A church: its bell tower at its front, a spire over it. */
		if (made.Special === 'church') {
			var tower = made.Width * 0.42;
			var high = top * 1.75;

			box(tower, high, tower, [0, high / 2, made.Depth / 2 - tower / 2], wall);
			box(tower * 0.5, tower * 0.5, 0.1, [0, high * 0.82, made.Depth / 2 + 0.06], [0.12, 0.12, 0.13]);

			parts.push(tools.Cylinder(tower * 0.72 * unit, 0, (made.Height - high) * unit, [0, (high + (made.Height - high) / 2) * unit, (made.Depth / 2 - tower / 2) * unit], roofColor, null, 4));
		}

		/* A station: a clock tower at its middle, the canopy of its platform along its back. */
		if (made.Special === 'station') {
			var clock = made.Depth * 0.4;
			var rise = made.Height - top;

			box(clock, rise * 0.8 + top, clock, [0, (rise * 0.8 + top) / 2, 0], wall);
			box(clock * 0.6, clock * 0.6, 0.1, [0, top + rise * 0.55, clock / 2 + 0.06], [0.95, 0.94, 0.88]);

			parts.push(tools.Cylinder(clock * 0.72 * unit, 0, rise * 0.2 * unit, [0, (top + rise * 0.9) * unit, 0], roofColor, null, 4));

			box(made.Width * 0.95, 0.25, 6, [0, 4.2, -made.Depth / 2 - 3], [0.3, 0.32, 0.34]);
			box(made.Width * 0.95, 0.9, 5, [0, 0.45, -made.Depth / 2 - 3.5], [0.62, 0.6, 0.57]);

			[-0.4, -0.2, 0, 0.2, 0.4].forEach(function (at) {
				box(0.2, 4.1, 0.2, [at * made.Width, 2.1, -made.Depth / 2 - 5.6], [0.3, 0.32, 0.34]);
			});
		}
	},

	/*
	 * A building of wings within its Width and Depth (Plan): L (its front and one side), U (its front and both sides, open
	 * behind), court (all round a yard); each wing its walls, its windows and its roof, the door at the middle of the front.
	 */
	Wings: function (tools, made, random) {
		var self = this;
		var unit = 1 / made.Height;
		var wall = made.Color ? this.Color(made.Color) : this.Materials[made.Walls] || this.Materials.plaster;
		var roofColor = made.Walls === 'glass' || made.Walls === 'concrete' || made.Walls === 'metal' ? [0.38, 0.39, 0.41] : [0.55, 0.26, 0.2];
		var w = made.Width;
		var d = made.Depth;
		var arm = Math.max(6, Math.min(w, d) * 0.32);
		var top = made.Floors * made.FloorHeight;
		var parts = [];
		var wings = [[0, d / 2 - arm / 2, w, arm]];

		if (made.Plan === 'L')
			wings.push([-w / 2 + arm / 2, 0, arm, d]);

		if (made.Plan === 'U' || made.Plan === 'court')
			wings.push([-w / 2 + arm / 2, 0, arm, d], [w / 2 - arm / 2, 0, arm, d]);

		if (made.Plan === 'court')
			wings.push([0, -d / 2 + arm / 2, w, arm]);

		function box (bw, bh, bd, at, color) {
			parts.push(tools.Box(bw * unit, bh * unit, bd * unit, [at[0] * unit, at[1] * unit, at[2] * unit], color));
		}

		wings.forEach(function (wing) {
			var x = wing[0];
			var z = wing[1];
			var ww = wing[2];
			var wd = wing[3];
			var f;

			box(ww, top, wd, [x, top / 2, z], wall);

			/* Its cornice and its plinth, of its own. */
			if (made.Cornice) {
				box(ww + 0.5, 0.35, wd + 0.5, [x, top - 0.25, z], [wall[0] * 0.78, wall[1] * 0.78, wall[2] * 0.78]);
				box(ww + 0.16, 0.6, wd + 0.16, [x, 0.3, z], [wall[0] * 0.78, wall[1] * 0.78, wall[2] * 0.78]);
			}

			/* Its windows on its long sides, a floor at a time; some lit. */
			for (f = 0; f < made.Floors; f++) {
				[[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (side) {
					var along = side[0] ? wd : ww;
					var count = Math.max(1, Math.round(along * made.Windows / 1.2));
					var i;

					for (i = 0; i < count; i++) {
						var at = (i + 0.5) / count * along - along / 2;
						var pane = Math.min(1.4, along / count * 0.6);

						box(side[0] ? 0.06 : pane, made.FloorHeight * 0.5, side[0] ? pane : 0.06, [x + side[0] * (ww / 2 + 0.02) + (side[0] ? 0 : at), (f + 0.55) * made.FloorHeight, z + side[1] * (wd / 2 + 0.02) + (side[0] ? at : 0)], random(0, 1) < made.Lit ? [2.2, 1.9, 1.3] : [0.16, 0.22, 0.28]);
					}
				});
			}

			self.Roof(tools, made, parts, ww, wd, top, unit, roofColor, [x, z]);
		});

		box(Math.min(2.4, w * 0.2), Math.min(2.4, made.FloorHeight * 0.8), 0.1, [0, Math.min(2.4, made.FloorHeight * 0.8) / 2, d / 2 + 0.05], [0.3, 0.22, 0.16]);

		this.Dress(tools, Object.assign({}, made, {Porch: false, Annex: false, Special: '', Cornice: false}), parts, unit, random, wall, roofColor);

		return parts;
	},

	/* What is no house: a water tower on its legs, the open floors of a car park, the canopy of a fuel station. */
	Special: function (tools, made, random) {
		var unit = 1 / made.Height;
		var parts = [];
		var steel = [0.42, 0.44, 0.46];
		var w = made.Width;
		var d = made.Depth;
		var f;

		function box (bw, bh, bd, at, color) {
			parts.push(tools.Box(bw * unit, bh * unit, bd * unit, [at[0] * unit, at[1] * unit, at[2] * unit], color));
		}

		if (made.Special === 'watertower') {
			var tank = made.Height * 0.3;
			var legs = made.Height - tank * 1.25;

			[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
				box(0.5, legs, 0.5, [corner[0] * w * 0.32, legs / 2, corner[1] * d * 0.32], steel);
			});

			box(w * 0.7, 0.3, 0.3, [0, legs * 0.5, 0], steel);
			box(0.3, 0.3, d * 0.7, [0, legs * 0.5, 0], steel);

			parts.push(tools.Cylinder(w / 2 * unit, w / 2 * unit, tank * unit, [0, (legs + tank / 2) * unit, 0], made.Color ? this.Color(made.Color) : [0.62, 0.66, 0.7], null, 16));
			parts.push(tools.Cylinder(w / 2 * 1.04 * unit, 0, tank * 0.25 * unit, [0, (legs + tank * 1.125) * unit, 0], steel, null, 16));

			return parts;
		}

		if (made.Special === 'parking') {
			for (f = 0; f <= made.Floors; f++) {
				box(w, 0.3, d, [0, f * made.FloorHeight + 0.15, 0], [0.6, 0.6, 0.58]);

				/* A parapet round each floor over the ground. */
				if (f > 0) {
					box(w, 0.9, 0.2, [0, f * made.FloorHeight + 0.75, d / 2], [0.66, 0.66, 0.64]);
					box(w, 0.9, 0.2, [0, f * made.FloorHeight + 0.75, -d / 2], [0.66, 0.66, 0.64]);
					box(0.2, 0.9, d, [w / 2, f * made.FloorHeight + 0.75, 0], [0.66, 0.66, 0.64]);
					box(0.2, 0.9, d, [-w / 2, f * made.FloorHeight + 0.75, 0], [0.66, 0.66, 0.64]);
				}
			}

			/* Its columns on a grid of 8 metres, a ramp at its side. */
			var x;
			var z;

			for (x = -w / 2 + 1; x <= w / 2 - 1 + 1e-6; x += (w - 2) / Math.max(1, Math.round((w - 2) / 8))) {
				for (z = -d / 2 + 1; z <= d / 2 - 1 + 1e-6; z += (d - 2) / Math.max(1, Math.round((d - 2) / 8)))
					box(0.5, made.Floors * made.FloorHeight, 0.5, [x, made.Floors * made.FloorHeight / 2, z], [0.62, 0.62, 0.6]);
			}

			parts.push(tools.Box(4 * unit, 0.3 * unit, 14 * unit, [(w / 2 + 2) * unit, made.FloorHeight / 2 * unit, 0], [0.6, 0.6, 0.58], [Math.atan2(made.FloorHeight, 14) * 57.3, 0, 0]));

			return parts;
		}

		/* A fuel station: its shop at the back, a canopy over the pumps in front, lit under it. */
		var shop = d * 0.35;
		var high = made.Height - 0.6;

		box(w * 0.55, made.FloorHeight, shop, [0, made.FloorHeight / 2, -d / 2 + shop / 2], made.Color ? this.Color(made.Color) : this.Materials[made.Walls] || this.Materials.plaster);
		box(w * 0.4, made.FloorHeight * 0.6, 0.06, [0, made.FloorHeight * 0.45, -d / 2 + shop + 0.03], random(0, 1) < 0.5 ? [1.8, 1.7, 1.4] : [0.2, 0.26, 0.3]);
		box(w * 0.57, 0.25, shop + 0.3, [0, made.FloorHeight + 0.12, -d / 2 + shop / 2], [0.38, 0.39, 0.41]);
		box(w, 0.8, d * 0.5, [0, high, d * 0.12], [0.9, 0.9, 0.88]);
		box(w * 0.96, 0.05, d * 0.46, [0, high - 0.42, d * 0.12], [2.4, 2.3, 2.1]);
		box(w, 0.25, d * 0.5, [0, high + 0.5, d * 0.12], [0.78, 0.14, 0.12]);

		[[-0.3, -0.05], [0.3, -0.05], [-0.3, 0.3], [0.3, 0.3]].forEach(function (at) {
			box(0.4, high - 0.4, 0.4, [at[0] * w, (high - 0.4) / 2, at[1] * d], [0.85, 0.85, 0.83]);
		});

		[-0.15, 0.15].forEach(function (at) {
			box(1.2, 1.7, 0.6, [at * w, 0.85, d * 0.12], [0.75, 0.15, 0.12]);
		});

		return parts;
	},

	/* Its roof over walls of width and depth whose top is at top, their middle at at ([x, z], the middle of the building by default). */
	Roof: function (tools, made, parts, width, depth, top, unit, color, at) {
		var height = Math.min(width, depth) * ({gable: 0.45, hip: 0.35, shed: 0.18, dome: 0.5, spire: 1.2, flat: 0.04, gambrel: 0.5, vault: 0.5}[made.Roof] || 0.04);
		var x = (at ? at[0] : 0) * unit;
		var z = (at ? at[1] : 0) * unit;
		var across = width > depth ? [0, 90, 0] : null;
		/* A wedge turned across is as long as the building is wide: its sides told the other way round. */
		var wide = width > depth;

		function wedge (w, h, d, y) {
			parts.push(tools.Wedge((wide ? d : w) * unit, h * unit, (wide ? w : d) * unit, [x, y * unit, z], color, across));
		}

		if (made.Roof === 'gable' || made.Roof === 'hip') {
			wedge(wide ? width * (made.Roof === 'hip' ? 0.9 : 1.06) : width * 1.06, height, wide ? depth * 1.06 : depth * (made.Roof === 'hip' ? 0.9 : 1.06), top + height / 2);
		}
		else if (made.Roof === 'shed') {
			parts.push(tools.Box(width * 1.04 * unit, height * 0.3 * unit, depth * 1.06 * unit, [x, (top + height / 2) * unit, z], color, [Math.atan2(height, depth) * 57.3, 0, 0]));
		}
		else if (made.Roof === 'dome') {
			parts.push(tools.Lathe([[Math.min(width, depth) * 0.48 * unit, 0], [Math.min(width, depth) * 0.4 * unit, height * 0.6 * unit], [0, height * unit]], [x, top * unit, z], color, 16));
		}
		else if (made.Roof === 'spire') {
			parts.push(tools.Cylinder(Math.min(width, depth) * 0.6 * unit, 0, height * unit, [x, (top + height / 2) * unit, z], color, null, 4));
		}
		else if (made.Roof === 'gambrel') {
			/* A barn's: steep low, gentle high. */
			parts.push(tools.Box((width > depth ? width : width * 1.04) * unit, height * 0.45 * unit, (width > depth ? depth * 1.04 : depth) * unit, [x, (top + height * 0.225) * unit, z], color));

			wedge(width * (wide ? 1 : 1.04), height * 0.55, depth * (wide ? 1.04 : 1), top + height * 0.45 + height * 0.275);
		}
		else if (made.Roof === 'vault') {
			/* A hangar's: an arch of slabs over its short side, along its long one. */
			var half = Math.min(width, depth) / 2 * 1.02;
			var long = Math.max(width, depth) * 1.02;
			var count = 10;
			var k;

			for (k = 0; k < count; k++) {
				var a0 = Math.PI * k / count;
				var a1 = Math.PI * (k + 1) / count;
				var p0 = [Math.cos(a0) * half, Math.sin(a0) * height];
				var p1 = [Math.cos(a1) * half, Math.sin(a1) * height];
				var tilt = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI;
				var span = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.05;
				var mx = (p0[0] + p1[0]) / 2;
				var my = top + (p0[1] + p1[1]) / 2;

				if (width > depth) parts.push(tools.Box(long * unit, 0.3 * unit, span * unit, [x, my * unit, z + mx * unit], color, [-tilt, 0, 0]));
				else parts.push(tools.Box(span * unit, 0.3 * unit, long * unit, [x + mx * unit, my * unit, z], color, [0, 0, tilt]));
			}

			/* Its ends shut: a wall of half a disc at each, of upright strips, of its walls. */
			var shut = made.Color ? this.Color(made.Color) : this.Materials[made.Walls] || this.Materials.metal;

			[-1, 1].forEach(function (end) {
				var strips = 12;
				var j;

				for (j = 0; j < strips; j++) {
					var u = -1 + (j + 0.5) * 2 / strips;
					var rise = height * Math.sqrt(Math.max(0, 1 - u * u));
					var wideStrip = half * 2 / strips + 0.02;

					if (wide) parts.push(tools.Box(0.2 * unit, rise * unit, wideStrip * unit, [x + end * long / 2 * unit, (top + rise / 2) * unit, z + u * half * unit], shut));
					else parts.push(tools.Box(wideStrip * unit, rise * unit, 0.2 * unit, [x + u * half * unit, (top + rise / 2) * unit, z + end * long / 2 * unit], shut));
				}
			});
		}
		else {
			parts.push(tools.Box(width * 1.02 * unit, Math.max(0.3, height) * unit, depth * 1.02 * unit, [x, (top + Math.max(0.3, height) / 2) * unit, z], color));
		}
	},

	Color: function (value) {
		var text = String(value).replace('#', '');

		return Array.isArray(value) ? value : [parseInt(text.slice(0, 2), 16) / 255, parseInt(text.slice(2, 4), 16) / 255, parseInt(text.slice(4, 6), 16) / 255];
	},

	/* A model of Models of a building: its Size is its height, its variants are buildings of its class of other seeds. */
	Define: function (name, options) {
		var self = this;
		var made = this.Options(options);

		this.$Service('SceneModels').Define(name, {
			Group: 'buildings',
			Type: 'building',
			Size: made.Height,
			Variants: Number(options && options.Variants) || 1,
			Matte: made.Walls !== 'glass' && made.Walls !== 'metal',
			Build: function (tools, random) {
				return self.Pieces(tools, made, random);
			}
		});

		return made;
	}
});
