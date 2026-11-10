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
 * - Pieces(tools, options, random, variant): its pieces, 1 tall (the model of Models takes its Size as its height): those
 *   of the graph of a building (resource ElemenxGraphics/building, the functions it calls in blueprints/buildings) for
 *   Parameters(options) (its numbers and colors as the graph takes them), the variant its windows lit.
 * - Define(name, options): a model of Models of that name; its Variants differ by the windows lit: SceneModels.Make(name, {Variant}).
 * - Random(options, seed): the options of a building of a class, varied by a seed within what the class allows.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneBuildingGenerator', {
	$Meta: {
		Description: 'Buildings of any size made of their numbers, from a shack to a business centre: models of the Models Service.',
		Methods: ['Classes()', 'Options(options)', 'Pieces(tools, options, random, variant)', 'Parameters(options)', 'Define(name, options)', 'Random(options, seed)']
	},

	/*
	 * Its classes and the colors of its walls: data of its resources (resources/buildings/<class> in their Order, and
	 * resources/building-walls), read as it is made; one an Application gives of that name takes its place.
	 */
	$OnCreate: function () {
		var self = this;

		Elemenx.Resources('Data').filter(function (name) {
			return name.indexOf('ElemenxGraphics/buildings/') === 0;
		}).map(function (name) {
			return {Name: name.substring('ElemenxGraphics/buildings/'.length), Data: Elemenx.Resources('Data', name)};
		}).sort(function (a, b) {
			return (a.Data.Order || 0) - (b.Data.Order || 0);
		}).forEach(function (item) {
			delete item.Data.Order;

			self.Defaults[item.Name] = item.Data;
		});

		Object.assign(this.Materials, Elemenx.Resources('Data', 'ElemenxGraphics/building-walls') || {});
	},

	/* What each class is: its size, its floors (from, to), its roof and its walls, how much glass. */
	Defaults: {},

	/* The colors of the materials of walls, and their gloss (glass and metal shine). */
	Materials: {},

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
	 * Its pieces: those the graph of a building gives (resource ElemenxGraphics/building and the functions it calls,
	 * blueprints/buildings) for its Parameters and the variant, assembled by SceneModels, 1 tall. Regression: none; it was
	 * code of its own, now all of it is the graph.
	 */
	Pieces: function (tools, options, random, variant) {
		var models = this.$Service('SceneModels');
		var recipe = this.$Service('ModelBlueprints').Recipe('ElemenxGraphics/building', this.Parameters(options), {Variant: variant || 0});

		return models.Assemble(recipe, tools, random, 0);
	},

	/*
	 * The parameters of the graph of a building (resource ElemenxGraphics/building) of its options: its numbers, the colors
	 * of its walls, roof and the ends of a vault, Band (walls of glass in bands), and Porch, Annex as 1, 0, or -1 for by chance.
	 */
	Parameters: function (options) {
		var made = this.Options(options);
		var wall = made.Color ? this.Color(made.Color) : this.Materials[made.Walls] || this.Materials.plaster;
		var styles = Elemenx.Resources('Data', 'ElemenxGraphics/building-styles') || {Walls: {}, Roofs: {}};
		var walls = styles.Walls[made.Walls] || {};
		var roof = styles.Roofs[made.Roof] || {};
		var details = made.Details === false ? {} : (styles.Details || {})[made.Class] || {};
		var palettes = styles.Palettes || {};

		return {
			Class: made.Class, Width: made.Width, Depth: made.Depth, Floors: made.Floors, FloorHeight: made.FloorHeight, Height: made.Height,
			Roof: made.Roof, Wall: wall, WallMaterial: this.WallMaterials[made.Walls] || 'plaster', RoofMaterial: made.RoofMaterial || '',
			/* What its walls and its roof may be of, and their colors (resource building-styles): the graph chooses by its seed. */
			WallMaterials: walls.Materials || [], WallColors: made.Color ? [] : walls.Colors || [], RoofMaterials: made.RoofMaterial ? [made.RoofMaterial] : roof.Materials || [], RoofColors: roof.Colors || [],
			/* The chances of its details by its class (building-styles Details), the colors they are chosen of (Palettes). */
			Shutters: details.Shutters || 0, AC: details.AC || 0, Chimneys: details.Chimneys || 0, Dormers: details.Dormers || 0, Rooftop: details.Rooftop || 0,
			Awning: details.Awning || 0, Downpipes: details.Downpipes || 0, Lamp: details.Lamp || 0,
			ShutterColors: palettes.Shutters || [], AwningColors: palettes.Awnings || [], SignColors: palettes.Signs || [], Trim: palettes.Trim || [0.84, 0.82, 0.77], HasColor: made.Color ? 1 : 0, RoofColor: made.Walls === 'glass' || made.Walls === 'concrete' || made.Walls === 'metal' ? [0.38, 0.39, 0.41] : [0.55, 0.26, 0.2],
			Shut: made.Color ? this.Color(made.Color) : this.Materials[made.Walls] || this.Materials.metal, Band: made.Windows > 0.6 ? 1 : 0, Windows: made.Windows,
			Lit: made.Lit, Balconies: made.Balconies ? 1 : 0, Setbacks: made.Setbacks, Podium: made.Podium, Crown: made.Crown || 'none', Plan: made.Plan,
			Cornice: made.Cornice ? 1 : 0, Porch: made.Porch === null ? -1 : made.Porch ? 1 : 0, Annex: made.Annex === null ? -1 : made.Annex ? 1 : 0, Special: made.Special || '',
			Seed: String(made.Seed === undefined || made.Seed === '' ? made.Class : made.Seed)
		};
	},

	/* The material of SceneMaterials each kind of walls is drawn of (walls of glass: their frames of metal). */
	WallMaterials: {wood: 'wood', log: 'wood', brick: 'brick', stone: 'stone', plaster: 'plaster', concrete: 'concrete', glass: 'metal', metal: 'metal'},

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
			Build: function (tools, random, variant) {
				return self.Pieces(tools, made, random, variant);
			}
		});

		return made;
	}
});
