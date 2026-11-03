/*
 * Buildings of any size, made of their numbers: from a shack to a tower of offices, each a model of the Models Service,
 * so a GameObject, a Scatter and a settlement place it as any other.
 * - Classes(): the classes and what each one is by default: shack, cabin, cottage, house, villa, townhouse, shop, warehouse,
 *   factory, apartments, office, tower, skyscraper, business (a business centre: a podium, a tower of glass in setbacks).
 * - Options(options): the whole of a building: its Class gives what is not told. Width and Depth (metres), Floors and
 *   FloorHeight (metres), Roof (gable, hip, shed, flat, dome, spire), Walls (wood, log, brick, stone, plaster, concrete,
 *   glass, metal), Windows (0 to 1: how much of a wall is glass), Setbacks (how many times a tall one steps in), Podium (the
 *   floors of a wider base), Crown (none, spire, antenna, helipad), Balconies, Lit (0 to 1: the windows lit, as at night),
 *   Color (of the walls, over their material), Seed.
 * - Pieces(tools, options, random): its pieces, in metres over its height (the model of Models takes its Size as its height).
 * - Define(name, options): a model of Models of that name; its Variants differ by the windows lit: Models.Make(name, {Variant}).
 * - Random(options, seed): the options of a building of a class, varied by a seed within what the class allows.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Buildings', {
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
		business: {Width: 40, Depth: 32, Floors: [25, 45], FloorHeight: 3.8, Roof: 'flat', Walls: 'glass', Windows: 0.85, Setbacks: 2, Podium: 3, Crown: 'helipad'}
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
		var made = Object.assign({Class: this.Defaults[given.Class] ? given.Class : 'house', Setbacks: 0, Podium: 0, Crown: 'none', Balconies: false, Lit: 0, Color: null, Seed: ''}, base, given);

		made.Class = this.Defaults[given.Class] ? given.Class : 'house';
		made.Floors = Math.max(1, Math.round(Array.isArray(made.Floors) ? made.Floors[0] : Number(made.Floors) || 1));
		made.Width = Math.max(1.5, Number(made.Width) || base.Width);
		made.Depth = Math.max(1.5, Number(made.Depth) || base.Depth);
		made.FloorHeight = Math.max(2, Number(made.FloorHeight) || base.FloorHeight);
		made.Windows = Math.max(0, Math.min(1, Number(made.Windows)));
		made.Setbacks = Math.max(0, Math.round(Number(made.Setbacks) || 0));
		made.Podium = Math.max(0, Math.min(made.Floors - 1, Math.round(Number(made.Podium) || 0)));
		made.Lit = Math.max(0, Math.min(1, Number(made.Lit) || 0));
		made.Height = made.Floors * made.FloorHeight + this.RoofHeight(made);

		return made;
	},

	RoofHeight: function (made) {
		var crown = made.Crown === 'spire' ? made.Floors * made.FloorHeight * 0.18 : made.Crown === 'antenna' ? 12 : made.Crown === 'helipad' ? 1.2 : 0;
		var roof = {gable: 0.45, hip: 0.35, shed: 0.18, dome: 0.5, spire: 1.2, flat: 0.04}[made.Roof];

		return Math.min(made.Width, made.Depth) * (roof === undefined ? 0.04 : roof) + crown;
	},

	/* The options of a building of a class, varied by a seed: its floors within the range of its class, its size by a fifth. */
	Random: function (options, seed) {
		var given = options || {};
		var base = this.Defaults[given.Class] || this.Defaults.house;
		var random = this.$Service('Models').Random(String(seed === undefined ? given.Seed || '' : seed) + ':' + (given.Class || 'house'));
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
		box(Math.min(2, made.Width * 0.25), Math.min(2.2, made.FloorHeight * 0.8), 0.1, [0, Math.min(2.2, made.FloorHeight * 0.8) / 2, made.Depth / 2 + 0.05], [0.3, 0.22, 0.16]);

		return [tools.Piece('body', parts)];
	},

	Roof: function (tools, made, parts, width, depth, top, unit, color) {
		var height = Math.min(width, depth) * ({gable: 0.45, hip: 0.35, shed: 0.18, dome: 0.5, spire: 1.2, flat: 0.04}[made.Roof] || 0.04);

		if (made.Roof === 'gable' || made.Roof === 'hip') parts.push(tools.Wedge(width * 1.06 * unit, height * unit, depth * (made.Roof === 'hip' ? 0.9 : 1.06) * unit, [0, (top + height / 2) * unit, 0], color, width > depth ? [0, 90, 0] : null));
		else if (made.Roof === 'shed') parts.push(tools.Box(width * 1.04 * unit, height * 0.3 * unit, depth * 1.06 * unit, [0, (top + height / 2) * unit, 0], color, [Math.atan2(height, depth) * 57.3, 0, 0]));
		else if (made.Roof === 'dome') parts.push(tools.Lathe([[Math.min(width, depth) * 0.48 * unit, 0], [Math.min(width, depth) * 0.4 * unit, height * 0.6 * unit], [0, height * unit]], [0, top * unit, 0], color, 16));
		else if (made.Roof === 'spire') parts.push(tools.Cylinder(Math.min(width, depth) * 0.6 * unit, 0, height * unit, [0, (top + height / 2) * unit, 0], color, null, 4));
		else parts.push(tools.Box(width * 1.02 * unit, Math.max(0.3, height) * unit, depth * 1.02 * unit, [0, (top + Math.max(0.3, height) / 2) * unit, 0], color));
	},

	Color: function (value) {
		var text = String(value).replace('#', '');

		return Array.isArray(value) ? value : [parseInt(text.slice(0, 2), 16) / 255, parseInt(text.slice(2, 4), 16) / 255, parseInt(text.slice(4, 6), 16) / 255];
	},

	/* A model of Models of a building: its Size is its height, its variants are buildings of its class of other seeds. */
	Define: function (name, options) {
		var self = this;
		var made = this.Options(options);

		this.$Service('Models').Define(name, {
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
