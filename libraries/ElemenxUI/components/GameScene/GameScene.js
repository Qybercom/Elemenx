/*
 * The scene of a game in three dimensions on WebGL2 (the Graphics3D Service): objects of any kind (the Kinds Service),
 * each made of what its kind extends, what it can do (its Traits, each run by a system of the scene) and what it is made
 * of (its Parts, objects of their own placed in it). The setting space (the default) brings the kinds of a star system
 * and its systems: stars and planets on Kepler orbits (the Astronomy Service), lit by their stars (night sides, the
 * shadows of moons and planets on each other and on rings), their surfaces of noise baked once into cube textures,
 * belts and rings, stations of modules, fleets of ships that hold their place by a body and travel to another.
 *
 * Kinds of space: star (Star: Mass, Radius, Temperature, Luminosity, Color), planet (Orbit: Distance, Eccentricity,
 * Inclination, Node, Periapsis, Anomaly, Period; Body: Radius, Mass, Day, Tilt, Albedo; Surface: Type, Colors, Water,
 * Ocean, Ice, Clouds, Atmosphere, Seed), moon (a planet, small, one face to its planet), belt (Belt: Inner, Outer, Count,
 * Inclination, Colors), ring (Ring: Inner, Outer, Inclination, Colors), station and outpost (an Orbit in radii of what
 * they go round, a Model and parts: modules, a dock), fighter, cruiser and freighter (ships: Model, Health), fleet
 * (Mover: Speed; Formation: Count, Ship, Spacing: its ships are parts). An application defines its own (Kinds.Define)
 * and systems of its own for traits of its own (Systems: {Trait: {Update(object, scene), Draw(object, scene)}}).
 *
 * The objects: System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (a whole system of it:
 * Astronomy.Generate) and GameObject declared inside (a GameObject in another goes round it when it moves, an Orbit or
 * a Mover, and is a part of it otherwise; Part="dock" changes a part of the kind of its parent). Every attribute of a
 * GameObject is a field of it or of a Trait, in any case. Time is the day (0), Speed the days of it a second (1),
 * Paused holds it; Scale compressed (the default: large bodies, short distances) or real.
 *
 * The view: a drag turns it round the object in focus, the wheel or two fingers zoom, a click selects an object (or
 * its label; a part of an object near enough), a double click flies to it (from its day side), Escape goes back, the
 * arrows turn, + and - zoom, Enter flies to the selected one, Space holds the time. Orbits, Labels, Details (a card of
 * the selected object), Background (the far stars), Team, the slot hud. Without WebGL2 it says so (and emits error).
 *
 * The surface: Land(id, {Latitude, Longitude, Altitude}) goes down to the ground of a body (not of a giant of gas),
 * the very ground its baked surface shows (Terrain.Sphere), in patches finer near the eye, under its sky (its
 * atmosphere and its star); a drag looks round, the wheel rises and comes down, WASD and the arrows walk, Escape or
 * TakeOff() goes back up. The time runs SurfaceSpeed days a second there (1/120).
 *
 * Kinds of the ground (the setting terrain): ground (Terrain: Size, Height, Water, Scale, Ridges, Seed: a ground of
 * noise, Terrain.Flat, in chunks finer near the eye, with its sea), sun (Sun: its light from far), unit (Walker: Speed,
 * MaxSlope, Swim; a Model), tree, rock and house (Model, Blocks: what stands in the way). An object of it stands at
 * X and Y of the ground; Move(id, [x, y]) walks a walker round what cannot be walked, a right click sends the selected
 * one; the view turns round a point of the ground and the keys move it. Every model of the Models Service is a kind of
 * the same name (knight, mech, wolf, oak, tower, reactor...), of the kind that fits it.
 *
 * The models stand in the light of their sun and cast shadows on each other and on the ground (Shadows); a Model plays
 * clips of its pieces (Clip: the one it plays when idle): walk on a way by itself, Play(id, clip, callback) the others
 * (attack, cast, work, die); the wind bends what grows. View top or isometric sees a ground in parallel rays, as a game
 * of two dimensions.
 *
 * A map of cells: Map, GameTerrain and GameLayer make the ground of a strategy game (see the trait Strategy): its objects
 * stand on cells, its units are selected in a frame and ordered, Fog, Grid and Minimap come with it.
 *
 * Events: ready (the scene, for its methods), select ({ID, Object, Info}: ID empty when none is), focus ({ID}),
 * arrive ({ID, At}), land ({ID}), takeoff ({ID}), error ({Reason: webgl2}).
 * Methods: Add(kind, props), Change(id, changes), Remove(id), Attach(parent, object), Detach(id), Get(id),
 * Objects(filter), Describe(id), Position(id), Select(id), FocusOn(id), Move(id, target), Now(), SetTime(days),
 * Play(id, clip, callback), ToScreen(id), Pick(clientX, clientY), Save(), Load(saved), Land(id, options), TakeOff(),
 * Surface(), Supported().
 */
Elemenx.Component('GameScene', {
	$TemplateURL: 'GameScene.html',
	$StyleURL: 'GameScene.css',
	$Traits: ['Strategy', 'Scatter', 'Lighting'],
	$Meta: {
		Group: 'game',
		Icon: 'star',
		Description: 'The scene of a game in 3D: objects of any kind with their traits and parts; the setting space brings a star system on Kepler orbits, stations and fleets, with a landing on the surfaces of its bodies; the setting terrain a ground of noise and its walkers.',
		Container: true,
		Children: ['GameObject', 'GameTerrain', 'GameLayer'],
		Slots: ['hud'],
		Events: {
			ready: 'The scene is ready: the component itself, to call its methods.',
			select: 'The selection changed: {ID, Object, Info, IDs, Objects} (ID empty when none is).',
			focus: 'The view moved to an object: {ID}.',
			arrive: 'An object reached where it was sent: {ID, At} (with a map, X and Y too).',
			load: 'A map was loaded: {Width, Height} in cells.',
			order: 'The selected units of a map were ordered: {Kind (move, attack or stop), IDs, X, Y, Target}.',
			cell: 'A cell of a map was pressed: {X, Y, Button, Object}, the object on it or null.',
			view: 'The view of a map moved or zoomed: {X, Y, Zoom}.',
			land: 'The view went down to the surface of a body: {ID}.',
			takeoff: 'The view went back up to space: {ID}.',
			error: 'There is no WebGL2 ({Reason: webgl2}), or a map could not be loaded (the error).'
		},
		Methods: ['Add(kind, props)', 'Change(id, changes)', 'Remove(id)', 'Attach(parent, object)', 'Detach(id)', 'Get(id)', 'Objects(filter)', 'Describe(id)', 'Position(id)', 'Select(id)', 'Selection()', 'FocusOn(id)', 'Move(id, target)', 'Play(id, clip, callback)', 'Now()', 'SetTime(days)', 'ToScreen(id)', 'Pick(clientX, clientY)', 'Save()', 'Load(saved)', 'Land(id, options)', 'TakeOff()', 'Surface()', 'Supported()', 'Order(ids, target, kind)', 'Stop(ids)', 'Cell(x, y)', 'Paint(x, y, key, layer)', 'Near(x, y, radius, filter)', 'Route(from, to)', 'PathGrid()', 'FogOfWar()', 'CenterOn(x, y)', 'ToCell(clientX, clientY)'],
		Props: {
			Map: 'A map of cells: its JSON ({Width, Height, Projection, Terrain, Layers, Objects}), or the URL of a JSON of its own or of Tiled.',
			Projection: {Options: ['', 'isometric', 'orthogonal'], Description: 'A map from above (orthogonal) or at an angle (isometric); the one of the map by default.'},
			Fog: 'The fog of war of a map: what the team does not see is hidden, what it explored is dimmed.',
			Grid: 'Draws the lines of the cells of a map.',
			Minimap: 'Shows the whole map in a corner.',
			X: 'The point of a map at the left of the view (null: the map in the middle).',
			Y: 'The point of a map at the top of the view.',
			Zoom: 'The scale of the view of a map.',
			MinZoom: 'The smallest zoom of a map.',
			MaxZoom: 'The largest zoom of a map.',
			Biome: 'On a ground: what it looks like and what grows on it, by itself (the Biomes Service: temperate, taiga, tundra, desert, savanna, swamp, alien).',
			Setting: {Options: ['space', 'terrain'], Description: 'The setting: its kinds and systems (space: a star system; terrain: a ground and its walkers).'},
			System: 'The objects: {Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}.',
			Seed: 'A whole star system made of a seed (always the same for the same seed).',
			Systems: 'Systems of the application for traits of its own: {Trait: {Update(object, scene), Draw(object, scene)}}.',
			Time: 'The day of the scene.',
			Speed: 'The days of the scene a second.',
			SurfaceSpeed: 'The days a second on the surface of a body (1/120: a day of two minutes).',
			Shadows: 'The shadows of a sun on a ground, a surface and a model near the view (true).',
			Quality: {Options: ['', 'low', 'medium', 'high', 'ultra'], Description: 'What the light costs: empty chooses by the graphics card and steps down while frames are late.'},
			View: {Options: ['', 'top', 'isometric'], Description: 'A ground seen in parallel rays, as a game of two dimensions: from above or at an angle (empty: in perspective).'},
			Paused: 'Holds the time.',
			Focus: 'The ID of the object in the middle of the view.',
			Selected: 'The ID of the selected object.',
			Orbits: 'Draws the orbits.',
			Labels: 'Shows the names of the objects.',
			Details: 'Shows a card of the selected object.',
			Background: 'Draws the stars far away.',
			Scale: {Options: ['compressed', 'real'], Description: 'Large bodies and short distances (compressed), or their real sizes.'},
			Team: 'The team of the player.',
			Label: 'The name of the scene for screen readers.'
		},
		Sample: {Seed: 'kepler'}
	},
	Setting: 'space',
	System: null,
	Seed: '',
	Systems: null,
	Time: 0,
	Speed: 1,
	SurfaceSpeed: 1 / 120,
	Shadows: true,
	View: '',
	Paused: false,
	Focus: '',
	Selected: '',
	Orbits: true,
	Labels: true,
	Details: true,
	Background: true,
	Scale: 'compressed',
	Team: '',
	Label: '',
	Status: '',
	Unsupported: false,
	Dragging: false,
	Card: null,
	Landed: '',

	$OnCreate: function () {
		var self = this;
		var kinds = this.$Service('Kinds');
		var space = Object.assign(this.Space(), this.Ground(), this.Catalogue());

		/* The kinds of the settings, once: an application may have defined some of the same names first. */
		Object.keys(space).forEach(function (name) {
			if (!kinds.Has(name))
				kinds.Define(name, space[name]);
		});

		/* The props that change the scene, given again (a template calls it): the scene takes them after the drawing. */
		this.Changed = function () {
			if (self.Engine && self.Engine().Props)
				window.setTimeout(self.Engine().Props, 0);

			if (self.Strategy && self.Strategy().Props)
				window.setTimeout(self.Strategy().Props, 0);

			return '';
		};
	},

	/* A kind of each model of the Models Service: a soldier walks like a unit, an oak stands like a tree, a tower like a house. */
	Catalogue: function () {
		var library = this.$Service('Models');
		var bases = {unit: 'unit', animal: 'unit', vehicle: 'unit', plant: 'tree', rock: 'rock', building: 'house'};
		var list = {};

		library.Names().forEach(function (name) {
			var info = library.Info(name);
			var traits = {Model: {Shape: name, Size: info.Size, Color: '#ffffff'}};

			if (!bases[info.Type] || bases[info.Type] === name) return;

			if (info.Speed)
				traits.Walker = {Speed: info.Speed};

			list[name] = {Extends: bases[info.Type], Traits: traits};
		});

		return list;
	},

	/*
	 * The kinds of the setting terrain: a ground of noise (Terrain: Size, Height, Water, Scale, Ridges, Seed), its sun
	 * (Sun: Elevation, Azimuth in degrees, Color), units that walk (Walker: Speed, a second; X and Y their place on the
	 * map), trees, rocks and houses (a Model; Blocks: no way through them).
	 */
	Ground: function () {
		return {
			'ground': {Traits: {Terrain: {Size: 1000, Height: 60, Water: 0.35, Scale: 180, Ridges: 0.4, Seed: 'ground'}}},
			'sun': {Traits: {Sun: {Elevation: 35, Azimuth: 140, Color: '#fff4e0'}}},
			'unit': {Traits: {Walker: {Speed: 8, MaxSlope: 0.45}, Model: {Shape: 'soldier', Size: 1.8, Color: '#ffffff'}, Health: {Max: 100}, Selectable: {}}},
			'tree': {Traits: {Model: {Shape: 'pine', Size: 8, Color: '#ffffff'}}, Values: {Blocks: true}},
			'rock': {Traits: {Model: {Shape: 'rock', Size: 2.5, Color: '#ffffff'}}, Values: {Blocks: true}},
			'house': {Traits: {Model: {Shape: 'house', Size: 8, Color: '#ffffff'}, Health: {Max: 800}, Selectable: {}}, Values: {Blocks: true}},
			'building': {Extends: 'house'},
			'thing': {Traits: {Model: {Shape: 'crystal', Size: 1, Color: '#ffffff'}}},
			'forest': {Traits: {Scatter: {Shapes: ['pine', 'pine', 'oak', 'birch', 'bush', 'stump'], Density: 3, Cover: 0.55, Patch: 70, MaxSlope: 0.3}}},
			'grove': {Traits: {Scatter: {Shapes: ['oak', 'birch', 'bush'], Density: 0.8, Cover: 0.45, Patch: 40, MaxSlope: 0.25}}},
			'thicket': {Traits: {Scatter: {Shapes: ['bush', 'bush', 'mushroom', 'stump'], Density: 5, Cover: 0.5, Patch: 25, MaxSlope: 0.3, Size: [0.6, 1.2]}}},
			'rocks': {Traits: {Scatter: {Shapes: ['rock', 'rock', 'boulder'], Density: 0.5, MinHeight: 0, MaxSlope: 0.8, Size: [0.5, 1.4]}}},
			'grass': {Traits: {Grass: {Density: 1, Height: 0.75, Color: '#7fae4a', Root: '#2f5a22'}}},
			'village': {Traits: {Settlement: {Houses: 8, Radius: 30}}}
		};
	},

	/* The kinds of the setting space. */
	Space: function () {
		var orbit = {Distance: 1, Eccentricity: 0, Inclination: 0, Node: 0, Periapsis: 0, Anomaly: 0, Period: null, Unit: 'AU'};

		return {
			'star': {Traits: {Star: {Mass: 1, Radius: null, Temperature: null, Luminosity: null, Color: ''}, Selectable: {}}},
			'planet': {Traits: {Orbit: orbit, Body: {Radius: 6371, Mass: null, Day: 24, Tilt: 0, Albedo: null}, Surface: {Type: 'rocky', Colors: '', Water: '', Ocean: null, Ice: null, Clouds: null, Atmosphere: '', Seed: ''}, Selectable: {}}},
			'moon': {Extends: 'planet', Traits: {Body: {Radius: 1737, Day: 0}, Surface: {Type: 'moon'}}},
			'belt': {Traits: {Belt: {Inner: 2.2, Outer: 3.2, Count: 260, Inclination: 0, Colors: ''}}},
			'ring': {Traits: {Ring: {Inner: 1.3, Outer: 2.3, Inclination: 0, Colors: ''}}},
			'module': {Traits: {Model: {Shape: 'box', Size: 1, Scale: [1, 1, 1], Color: '#d6d9e0'}, Health: {Max: 200}}},
			'station': {
				Traits: {Orbit: {Distance: 1.8, Unit: 'radii', Period: 0.6, Inclination: 12}, Model: {Shape: '', Size: 0.11, Relative: true, Spin: 2}, Health: {Max: 1000}, Selectable: {}},
				Parts: [
					{ID: 'ring', Kind: 'module', Traits: {Model: {Shape: 'torus', Color: '#dcdfe6'}}},
					{ID: 'hub', Kind: 'module', Traits: {Model: {Shape: 'cylinder', Scale: [0.4, 0.8, 0.4], Color: '#8d929c'}}},
					{ID: 'panel-a', Kind: 'module', Position: [0, 0.55, 0], Traits: {Model: {Shape: 'box', Scale: [1.1, 0.03, 0.34], Color: '#1f3366'}, Health: {Max: 80}}},
					{ID: 'panel-b', Kind: 'module', Position: [0, -0.55, 0], Traits: {Model: {Shape: 'box', Scale: [1.1, 0.03, 0.34], Color: '#1f3366'}, Health: {Max: 80}}},
					{ID: 'dock', Kind: 'module', Position: [0, 0, 1.1], Traits: {Model: {Shape: 'box', Scale: [0.3, 0.2, 0.3], Color: '#aeb3bd'}, Container: {Size: 20}}}
				]
			},
			'outpost': {
				Extends: 'station',
				Parts: [
					{ID: 'ring', Removed: true},
					{ID: 'hub', Traits: {Model: {Shape: 'cylinder', Scale: [0.32, 1.4, 0.32]}}, Rotation: [0, 0, 90]},
					{ID: 'lab', Kind: 'module', Position: [0.7, 0, 0], Traits: {Model: {Shape: 'box', Scale: [0.5, 0.36, 0.36], Color: '#8d929c'}}},
					{ID: 'panel-a', Position: [-0.75, 0, 0], Rotation: [0, 0, 90], Traits: {Model: {Scale: [1.6, 0.06, 0.5]}}},
					{ID: 'panel-b', Removed: true}
				]
			},
			'ship': {Traits: {Model: {Shape: 'fighter', Size: 0.07, Relative: false}, Health: {Max: 100}, Selectable: {}}},
			'fighter': {Extends: 'ship'},
			'cruiser': {Extends: 'ship', Traits: {Model: {Shape: 'cruiser'}, Health: {Max: 600}}},
			'freighter': {Extends: 'ship', Traits: {Model: {Shape: 'freighter'}, Health: {Max: 300}, Container: {Size: 80}}},
			'fleet': {Traits: {Mover: {Speed: 0.25}, Formation: {Count: 5, Ship: 'fighter', Spacing: 2.4}, Selectable: {}}}
		};
	},

	$OnReady: function () {
		var self = this;
		var element = this.$Element();

		/* A map is known before the first objects are made: on it a kind may be of no kind of the scene. */
		this.Cells = !!this.Map || !!element.querySelector('.elemenx-game-scene-sources .elemenx-game-source[data-type="layer"], .elemenx-game-scene-sources .elemenx-game-source[data-type="terrain"]');

		var canvas = element.querySelector('.elemenx-game-scene-canvas');
		var labels = element.querySelector('.elemenx-game-scene-labels');
		var graphics = this.$Service('Graphics3D');
		var astronomy = this.$Service('Astronomy');
		var kinds = this.$Service('Kinds');
		var library = this.$Service('Models');
		var random = this.$Service('Random');
		var vectors = graphics.Vectors;
		var view = element.ownerDocument.defaultView || window;
		var shaders = this.Shaders(graphics);
		var renderer = graphics.Create(canvas, {Restored: function () {
			build();
		}});
		var engine = {};
		var gpu = {};
		var KM = astronomy.Units.km;
		var UNIT = 100;
		var teams = {blue: '#3d7be0', red: '#d8453c', green: '#3fa34d', yellow: '#e2a915', purple: '#8f5bd6', orange: '#ec7a2c', teal: '#22a39a', gray: '#8a8f98'};
		var surfaces = {rocky: 0, desert: 0, dwarf: 0, moon: 0, terran: 1, ocean: 1, ice: 2, lava: 3, gas: 4, 'ice-giant': 4};
		var places = {X: 0, Y: 0, Width: 1, Height: 1, Blocks: false, Opaque: false};
		var paints = {};
		var painter = element.ownerDocument.createElement('canvas').getContext('2d');
		var scene = {
			Objects: {},
			Order: [],
			Roots: [],
			Asked: {},
			Active: [],
			Still: [],
			Declared: [],
			Added: [],
			Removed: {},
			Overrides: {},
			Loaded: null,
			Travels: {},
			Ways: {},
			Seconds: 0,
			Ground: null,
			Rocks: {},
			Lines: {},
			Rings: {},
			Baked: {},
			Labels: {},
			Time: Number(this.Time) || 0,
			Given: {},
			Camera: graphics.Camera({Fov: 45}),
			Eye: [0, 0, 0],
			Yaw: 0.7,
			Pitch: 0.45,
			Distance: 60,
			Wanted: 60,
			Target: [0, 0, 0],
			From: [0, 0, 0],
			Moving: 1,
			Focus: '',
			Selected: '',
			Pointers: {},
			Drag: null,
			Pinch: null,
			Width: 0,
			Height: 0,
			Ratio: Math.min(2, view.devicePixelRatio || 1),
			Most: Math.min(2, view.devicePixelRatio || 1),
			Slow: 0,
			Fast: 0,
			Last: 0,
			Colors: {Background: [0.01, 0.02, 0.04, 1], Orbit: [0.55, 0.65, 0.85, 0.3], Selection: [0.5, 0.77, 1, 1]},
			Painted: 0
		};

		this.Engine = function () {
			return engine;
		};

		this.Scene = function () {
			return scene;
		};

		/* A CSS color as [r, g, b, a] from 0 to 1: the canvas of 2D reads every form of it. */
		function paint (color, fallback) {
			var text;
			var match;

			if (!color)
				return fallback || [1, 1, 1, 1];

			if (paints[color])
				return paints[color];

			painter.fillStyle = '#000000';
			painter.fillStyle = color;
			text = String(painter.fillStyle);
			match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(text);

			if (match) {
				paints[color] = [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255, 1];
			}
			else {
				match = /rgba?\(([^)]+)\)/.exec(text);
				paints[color] = match ? match[1].split(',').map(function (part, index) {
					return index < 3 ? Number(part) / 255 : Number(part);
				}) : fallback || [1, 1, 1, 1];

				if (paints[color].length === 3)
					paints[color].push(1);
			}

			return paints[color];
		}

		function teamColor (team) {
			var names = Object.keys(teams);

			if (!team)
				return teams.gray;

			if (teams[team])
				return teams[team];

			if (/^#|^rgb|^hsl/.test(team)) return team;

			return teams[names[random.Hash(team) % names.length]];
		}

		function theme () {
			var style = view.getComputedStyle(element);

			scene.Colors.Background = paint(style.getPropertyValue('--elemenx-game-scene-background').trim(), [0.01, 0.02, 0.04, 1]);
			scene.Colors.Orbit = paint(style.getPropertyValue('--elemenx-game-scene-orbit').trim(), [0.55, 0.65, 0.85, 0.3]);
			scene.Colors.Selection = paint(style.getPropertyValue('--elemenx-game-scene-selection').trim(), [0.5, 0.77, 1, 1]);
		}

		function number (value, fallback) {
			var result = Number(value);

			return value === '' || value === null || value === undefined || !isFinite(result) ? fallback : result;
		}

		/* A value of an attribute: a number, true and false, a list or an object of JSON as such, else the text. */
		function parsed (value) {
			if (typeof value !== 'string') return value;
			if (/^-?\d+(?:\.\d+)?(?:e[-+]?\d+)?$/i.test(value.trim())) return Number(value);
			if (value === 'true' || value === 'false') return value === 'true';

			/* A list or an object written as JSON: Position="[0, 1, 0]". */
			if (/^\s*[\[{]/.test(value)) {
				try {
					return JSON.parse(value);
				}
				catch (error) {
					return value;
				}
			}

			return value;
		}

		/* What the object goes round or belongs to: for a part its owner. */
		function parentOf (object) {
			return object.Owner || (object.Parent ? scene.Objects[object.Parent] : null) || null;
		}

		function trait (object, name) {
			return object && object.Traits ? object.Traits[name] || null : null;
		}

		/* A spec of an object ({ID, Kind, Parent, Values, Traits, Parts}) of a declaration: each field to its trait, in any case. */
		function canonical (raw, of) {
			var kind = raw.Kind && kinds.Has(raw.Kind) ? raw.Kind : '';
			var fields = kind || of ? kinds.Fields(kind || of) : {};
			var common = {clip: 'Clip', soft: 'Soft', biome: 'Biome', houses: 'Houses', radius: 'Radius', type: 'Type', health: 'Health', maxhealth: 'MaxHealth', sight: 'Sight', tall: 'Tall', model: 'Model', roof: 'Roof', speed: 'Speed', shapes: 'Shapes', density: 'Density', size: 'Size', minheight: 'MinHeight', maxheight: 'MaxHeight', maxslope: 'MaxSlope', cover: 'Cover', patch: 'Patch', seed: 'Seed', blocks: 'Blocks', root: 'Root'};
			var spec = {ID: raw.ID, Kind: self.Cells ? raw.Kind || '' : kind, Parent: raw.Parent, Part: raw.Part, Values: {}, Traits: {}, Parts: []};

			Object.keys(raw).forEach(function (key) {
				var field;
				var value;

				if (key === 'ID' || key === 'Kind' || key === 'Parent' || key === 'Part') return;
				if (own(places, key) && raw[key] === places[key]) return;

				value = parsed(raw[key]);
				field = fields[key.toLowerCase()];

				if (field && field.Trait) {
					spec.Traits[field.Trait] = spec.Traits[field.Trait] || {};
					spec.Traits[field.Trait][field.Name] = value;
				}
				else {
					spec.Values[field ? field.Name : common[key.toLowerCase()] || key] = value;
				}
			});

			return spec;
		}

		function own (object, key) {
			return Object.prototype.hasOwnProperty.call(object, key);
		}

		/* The kind of a part of the kind of a spec (Part="dock" in a station is a module). */
		function partKind (owner, part) {
			var found;

			if (!owner.Kind || !kinds.Has(owner.Kind)) return '';

			found = kinds.Resolve(owner.Kind).Parts.filter(function (each) {
				return String(each.ID) === String(part);
			})[0];

			return found && found.Kind ? found.Kind : '';
		}

		/* Whether a kind moves on its own (an Orbit, a Mover): declared in another, it goes round it, not a part of it. */
		function moving (kind) {
			var resolved;

			if (!kind || !kinds.Has(kind)) return false;

			resolved = kinds.Resolve(kind);

			return !!(resolved.Traits.Orbit || resolved.Traits.Mover || resolved.Traits.Star || resolved.Traits.Belt || resolved.Traits.Ring);
		}

		/* The objects declared inside the scene: the GameObject of the template, their nesting their meaning. */
		function declarations () {
			var nodes = element.querySelectorAll('.elemenx-game-scene-sources .elemenx-game-source[data-type="object"]');
			var specs = [];
			var byNode = [];
			var before = JSON.stringify(scene.Declared);

			Array.prototype.forEach.call(nodes, function (node, index) {
				var raw;
				var spec;
				var holder = node.parentElement ? node.parentElement.closest('.elemenx-game-source[data-type="object"]') : null;
				var owner;

				try {
					raw = JSON.parse(node.getAttribute('data-value') || '{}');
				}
				catch (error) {
					raw = {};
				}

				owner = holder ? byNode[Array.prototype.indexOf.call(nodes, holder)] : null;
				spec = canonical(raw, raw.Part && !raw.Kind && owner ? partKind(owner, raw.Part) : '');
				spec.ID = spec.ID ? String(spec.ID) : spec.Part ? String(spec.Part) : (spec.Kind || 'object') + '-' + index;

				byNode[index] = spec;

				/* Inside another: going round it, or a part of it (the one of its Part, or a new one). */
				if (owner && !spec.Parent && (moving(spec.Kind) || !spec.Kind && !spec.Part)) {
					spec.Parent = owner.Root ? owner.Root : owner.ID;

					specs.push(spec);
				}
				else if (owner && !spec.Parent) {
					owner.Parts.push(Object.assign({}, spec.Values, {ID: spec.Part || spec.ID, Kind: spec.Kind || undefined, Traits: spec.Traits}));

					spec.Root = owner.Root || owner.ID;
				}
				else {
					specs.push(spec);
				}
			});

			scene.Declared = specs.map(function (spec) {
				return {ID: spec.ID, Kind: spec.Kind, Parent: spec.Parent, Values: spec.Values, Traits: spec.Traits, Parts: spec.Parts.map(function (part) {
					var made = Object.assign({}, part, {ID: String(part.ID)});
					if (!made.Kind)
						delete made.Kind;

					return made;
				})};
			});

			if (JSON.stringify(scene.Declared) !== before)
				compose();
		}

		/* The specs of a system of a seed: its bodies as objects of the kinds of space. */
		function seeded (seed) {
			return astronomy.Generate(seed).Bodies.map(function (body) {
				if (body.Type === 'star')
					return {ID: body.ID, Kind: 'star', Parent: '', Values: {Name: body.Name}, Traits: {Star: {Mass: body.Mass, Radius: body.Radius, Temperature: body.Temperature}}};

				if (body.Type === 'belt' && body.Kind === 'ring')
					return {ID: body.ID, Kind: 'ring', Parent: body.Parent, Values: {Name: body.Name}, Traits: {Ring: {Inner: body.Inner, Outer: body.Outer}}};

				if (body.Type === 'belt')
					return {ID: body.ID, Kind: 'belt', Parent: body.Parent, Values: {Name: body.Name}, Traits: {Belt: {Inner: body.Inner, Outer: body.Outer, Count: body.Count}}};

				return {ID: body.ID, Kind: body.Parent === 'star' ? 'planet' : 'moon', Parent: body.Parent, Values: {Name: body.Name}, Traits: {Orbit: body.Orbit, Body: {Radius: body.Radius, Day: body.Day, Tilt: body.Tilt || 0}, Surface: {Type: body.Kind}}};
			});
		}

		/* The specs of the System prop: a body may hold its own in Children. */
		function given (system) {
			var list = [];

			function put (spec, parent) {
				var copy = {};

				Object.keys(spec).forEach(function (key) {
					if (key !== 'Children')
						copy[key] = spec[key];
				});

				if (copy.Parent === undefined && parent)
					copy.Parent = parent;

				list.push(copy);

				(spec.Children || []).forEach(function (child) {
					put(child, copy.ID);
				});
			}

			((system || {}).Objects || []).forEach(function (spec) {
				put(spec, '');
			});

			return list;
		}

		/* A spec made an object of its kind, the changes made by the methods over it. */
		function make (spec) {
			var override = scene.Overrides[spec.ID] || {};
			var props = Object.assign({ID: spec.ID}, spec.Values || {}, override.Values || {});
			var kind = spec.Kind;
			var object;

			props.Traits = kinds.MergeTraits(spec.Traits || {}, override.Traits || {});
			props.Parts = kinds.MergeParts(spec.Parts || [], override.Parts || []);

			/* On a map a thing of no kind is a tree, and a thing of a kind of its own a thing of that Type. */
			if (self.Cells && (!kind || !kinds.Has(kind))) {
				props.Type = props.Type || kind;
				kind = kind ? 'thing' : 'tree';
			}

			if (kind && !kinds.Has(kind))
				throw new Error('Elemenx GameScene: unknown kind ' + kind);

			object = kinds.Make(kind || '', props);
			object.Parent = override.Parent !== undefined ? override.Parent : spec.Parent;

			return object;
		}

		/* Every object, of the seed, the system, the template, a saved game and the methods; the later over the earlier. */
		function compose () {
			composeObjects();

			if (self.Strategy)
				self.Strategy().Reconcile();
		}

		function composeObjects () {
			var specs = [];
			var byID = {};
			var objects = {};
			var order = [];
			var seen = {};
			var made = scene.Made || {};
			var fresh = {};
			var first;
			var roots;

			function put (spec) {
				if (!spec || spec.ID === undefined || spec.ID === null) return;

				spec.ID = String(spec.ID);

				if (byID[spec.ID]) specs[specs.indexOf(byID[spec.ID])] = spec;
				else specs.push(spec);

				byID[spec.ID] = spec;
			}

			if (scene.Loaded) {
				scene.Loaded.forEach(put);
			}
			else {
				if (self.Seed !== '' && self.Seed !== null && self.Seed !== undefined)
					seeded(self.Seed).forEach(put);

				given(self.System).forEach(put);
				scene.Declared.forEach(put);
			}

			scene.Added.forEach(put);

			specs = specs.filter(function (spec) {
				return !scene.Removed[spec.ID];
			});

			roots = specs.map(function (spec) {
				var key = spec.Restored ? '' : JSON.stringify([spec.Kind, spec.Parent, spec.Values, spec.Traits, spec.Parts, scene.Overrides[spec.ID] || null, self.Cells]);
				var kept = key && made[spec.ID] && made[spec.ID].Key === key ? made[spec.ID].Object : null;
				var object = kept || (spec.Restored ? JSON.parse(JSON.stringify(spec.Restored)) : make(spec));

				if (spec.Restored)
					object.Parent = spec.Parent;

				if (!kept)
					crew(object);

				if (key)
					fresh[spec.ID] = {Key: key, Object: object};

				objects[object.ID] = object;

				return object;
			});

			first = roots.filter(function (object) {
				return trait(object, 'Star');
			})[0];

			/* What an object goes round: the one it names, or the first star (a star: the middle of the system). */
			roots.forEach(function (object) {
				if (object.Parent && !objects[object.Parent])
					object.Parent = null;

				if (object.Parent === null || object.Parent === undefined || object.Parent === object.ID)
					object.Parent = trait(object, 'Star') || !first ? '' : first.ID;
			});

			function visit (object, seen) {
				if (seen[object.ID]) return;

				seen[object.ID] = true;

				if (object.Parent && objects[object.Parent])
					visit(objects[object.Parent], seen);

				order.push(object);

				(function parts (owner) {
					owner.Parts.forEach(function (part) {
						part.Owner = owner;
						part.Root = owner.Root || owner;
						objects[part.ID] = part;

						order.push(part);

						parts(part);
					});
				})(object);
			}

			roots.forEach(function (object) {
				visit(object, seen);
			});

			scene.StarMass = null;

			order.forEach(function (object) {
				derive(object, objects);
			});

			scene.Made = fresh;
			scene.Objects = objects;
			scene.Order = order;
			scene.Roots = roots;
			scene.Version = (scene.Version || 0) + 1;

			Object.keys(scene.Travels).forEach(function (id) {
				if (!objects[id] || !objects[scene.Travels[id].Target])
					delete scene.Travels[id];
			});

			if (scene.Focus && !objects[scene.Focus])
				scene.Focus = '';

			if (scene.Selected && !objects[scene.Selected])
				select('', true);

			clear();

			sync();
		}

		/* The numbers of an object: of a star its light, of a body its gravity and year; its size in the view. */
		function derive (object, objects) {
			var parent = object.Owner || (object.Parent ? objects[object.Parent] : null);
			var star = parent;
			var orbit = trait(object, 'Orbit');
			var body = trait(object, 'Body');
			var model = trait(object, 'Model');
			var surface = trait(object, 'Surface');
			var real = self.Scale === 'real';
			var distance = orbit && orbit.Unit !== 'radii' ? astronomy.Length(orbit.Distance) : 0;
			var kind;

			while (star && !trait(star, 'Star')) {
				distance = trait(star, 'Orbit') ? astronomy.Length(trait(star, 'Orbit').Distance) : distance;
				star = star.Owner || (star.Parent ? objects[star.Parent] : null);
			}

			object.Name = object.Values.Name || object.Part || object.ID;
			object.Team = object.Values.Team || (object.Owner ? object.Owner.Team : '') || '';
			object.Seed = random.Hash(surface && surface.Seed || object.ID) % 1000 / 37;
			object.Around = massAround(object, parent, objects);

			if (trait(object, 'Star')) {
				object.Star = astronomy.Star(trait(object, 'Star'));
				object.Color = trait(object, 'Star').Color || object.Star.Color;
				object.Size = real ? object.Star.Radius * astronomy.SunRadius * KM * UNIT : 2 * Math.pow(object.Star.Radius, 0.35);
			}
			else if (body) {
				kind = astronomy.Kinds[surface ? surface.Type : 'rocky'] || astronomy.Kinds.rocky;
				object.Info = astronomy.Describe({Kind: surface ? surface.Type : 'rocky', Radius: body.Radius, Mass: body.Mass, Albedo: body.Albedo, Day: body.Day, Orbit: orbit && orbit.Unit !== 'radii' ? orbit : null}, {Star: star ? star.Star : astronomy.Star({}), Distance: distance, Mass: object.Around});
				object.Radius = object.Info.Radius;
				object.Look = look(surface || {Type: 'rocky'}, kind);
				object.Size = real ? object.Radius * KM * UNIT : 0.5 * Math.pow(object.Radius / astronomy.EarthRadius, 0.45);
			}
			else if (model) {
				object.Size = object.Owner ? object.Owner.Size * number(model.Size, 1) : number(model.Size, 0.1) * (model.Relative && parent ? parent.Size : 1) * (real && !model.Relative ? 0.02 : 1);
			}
			else {
				object.Size = 0;
			}

			if (trait(object, 'Formation'))
				object.Size = 0.07 * (real ? 0.02 : 1);
		}

		/* A formation has its ships as parts: as many as Count, of its Ship kind, the ones its object has not. */
		function crew (object) {
			var settings = trait(object, 'Formation');
			var count;
			var have;
			var i;
			var ship;

			if (!settings) return;

			count = Math.max(0, Math.min(60, Math.round(number(settings.Count, 5))));
			have = {};

			object.Parts.forEach(function (part) {
				have[part.Part] = true;
			});

			for (i = 1; i <= count; i++) {
				if (have['ship-' + i]) continue;

				ship = kinds.Make(settings.Ship || 'fighter', {ID: object.ID + '/ship-' + i});
				ship.Part = 'ship-' + i;

				object.Parts.push(ship);
			}

			object.Parts.forEach(function (part) {
				if (/^ship-\d+$/.test(part.Part))
					part.Generated = true;
			});
		}

		/* The look of a surface: its kind's colors over its own, the numbers of its shader. */
		function look (surface, kind) {
			return {
				Kind: surfaces[surface.Type] === undefined ? 0 : surfaces[surface.Type],
				Colors: (Array.isArray(surface.Colors) ? surface.Colors : surface.Colors ? String(surface.Colors).split(',') : kind.Colors).map(function (color) {
					return paint(String(color).trim()).slice(0, 3);
				}).concat([[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]]).slice(0, 4),
				Water: paint(surface.Water || kind.Water || '#1d4f8f').slice(0, 3),
				Ocean: number(surface.Ocean, kind.Ocean || 0),
				Ice: number(surface.Ice, kind.Ice || 0),
				Clouds: number(surface.Clouds, kind.Clouds || 0),
				Atmosphere: surface.Atmosphere === 'none' ? [0, 0, 0, 0] : surface.Atmosphere || kind.Atmosphere ? paint(surface.Atmosphere || kind.Atmosphere).slice(0, 3).concat([surface.Type === 'gas' || surface.Type === 'ice-giant' ? 0.6 : 0.9]) : [0, 0, 0, 0]
			};
		}

		/* The mass an object goes round, in masses of the Sun. */
		function massAround (object, parent, objects) {
			if (parent && trait(parent, 'Star'))
				return number(trait(parent, 'Star').Mass, 1);

			if (parent && parent.Info)
				return number(parent.Info.Mass, 1) * astronomy.EarthMass;

			if (parent)
				return astronomy.EarthMass;

			/* Of all the stars, once when the scene is made: it asks for every object. */
			if (scene.StarMass === null) {
				scene.StarMass = 0;

				Object.keys(objects).forEach(function (id) {
					if (trait(objects[id], 'Star') && !objects[id].Parent && !objects[id].Owner)
						scene.StarMass += number(trait(objects[id], 'Star').Mass, 1);
				});
			}

			return scene.StarMass || 1;
		}

		function toView (point) {
			return [point[0], point[2], -point[1]];
		}

		/* A place round a parent in the units of the view: compressed, the far shortened and the near round a body spread out. */
		function spread (relative, parent) {
			var a = vectors.Length(relative);
			var d;

			if (!a)
				return [0, 0, 0];

			if (self.Scale === 'real')
				return vectors.Scale(relative, UNIT);

			if (parent && parent.Radius) d = parent.Size * (1 + 0.6 * Math.sqrt(a / (parent.Radius * KM)));
			else d = 12 * Math.sqrt(a);

			return vectors.Scale(relative, d / a);
		}

		/* A turn in degrees about X, then Y, then Z, as a matrix. */
		function turnOf (degrees) {
			var rad = Math.PI / 180;
			var angles = degrees || [0, 0, 0];

			return graphics.Multiply(graphics.Rotation([0, 0, 1], (angles[2] || 0) * rad), graphics.Multiply(graphics.Rotation([0, 1, 0], (angles[1] || 0) * rad), graphics.Rotation([1, 0, 0], (angles[0] || 0) * rad)));
		}

		/* A turn that looks along a heading (the nose of a model along Z). */
		function heading (direction) {
			var z = vectors.Normalize(direction);
			var x = vectors.Normalize(vectors.Cross([0, 1, 0], z));
			var y;

			if (!vectors.Length(x))
				x = [1, 0, 0];

			y = vectors.Cross(z, x);

			return [x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, 0, 0, 0, 1];
		}

		/* Where every object is at a time: in AU (Position) and in the view (World), with its turn (Turn). */
		function place (time) {
			settle();

			scene.Active.forEach(function (object) {
				var parent = parentOf(object);
				var base = parent ? parent.World || [0, 0, 0] : [0, 0, 0];
				var position = parent ? parent.Position || [0, 0, 0] : [0, 0, 0];
				var orbit = trait(object, 'Orbit');
				var body = trait(object, 'Body');
				var model = trait(object, 'Model');
				var relative;
				var angle;
				var tilt;
				var radius;
				var offset;
				var day;

				object.Turn = graphics.Identity();

				if (scene.Ground && !object.Owner && !orbit && !trait(object, 'Terrain') && !trait(object, 'Sun')) {
					stand(object);
				}
				else if (object.Owner && !object.Generated) {
					offset = graphics.Apply(object.Owner.Turn || graphics.Identity(), vectors.Scale(object.Values.Position || [0, 0, 0], object.Owner.Size || 1));
					object.World = vectors.Add(base, offset);
					object.Position = position;
					object.Turn = graphics.Multiply(object.Owner.Turn || graphics.Identity(), turnOf(object.Values.Rotation));
				}
				else if (object.Owner) {
					object.World = object.World || base;
					object.Position = position;
				}
				else if (trait(object, 'Mover') && (scene.Travels[object.ID] || !orbit)) {
					hold(object, time);
				}
				else if (orbit && orbit.Unit === 'radii') {
					angle = Math.PI * 2 * time / Math.max(0.01, number(orbit.Period, 0.6)) + object.Seed;
					tilt = number(orbit.Inclination, 12) * Math.PI / 180;
					radius = (parent ? parent.Size : 1) * number(orbit.Distance, 1.8);
					object.World = vectors.Add(base, [Math.cos(angle) * radius, Math.sin(angle) * Math.sin(tilt) * radius, -Math.sin(angle) * Math.cos(tilt) * radius]);
					object.Relative = vectors.Subtract(object.World, base);
					object.Position = position;
				}
				else if (orbit && astronomy.Length(orbit.Distance)) {
					relative = astronomy.Position(orbit, time, object.Around);
					object.Position = vectors.Add(position, relative);
					object.Relative = spread(toView(relative), parent);
					object.World = vectors.Add(base, object.Relative);
				}
				else {
					object.Position = position;
					object.Relative = [0, 0, 0];
					object.World = base;
				}

				/* Its own turn: a body by its day and tilt (one face to its parent without a day), a model by its spin. */
				if (body) {
					day = number(body.Day, 24);
					angle = day ? Math.PI * 2 * time * 24 / day : Math.atan2(object.Relative ? object.Relative[0] : 0, object.Relative ? object.Relative[2] : 1) + Math.PI;
					object.Turn = graphics.Multiply(graphics.Rotation([1, 0, 0], number(body.Tilt, 0) * Math.PI / 180), graphics.Rotation([0, 1, 0], angle));
				}
				else if (trait(object, 'Star')) {
					object.Turn = graphics.Rotation([0, 1, 0], time * 0.1);
				}
				else if (model && !object.Owner && model.Spin) {
					object.Turn = graphics.Multiply(graphics.Rotation([1, 0, 0], 0.35), graphics.Rotation([0, 1, 0], time * number(model.Spin, 0)));
				}

				if (trait(object, 'Formation'))
					formation(object);
			});

			custom('Update');
		}

		/* The place an object of a Mover holds beside the one it is at, or its way to where it was sent. */
		function holdAt (object, at, time) {
			var target = at ? scene.Objects[at] : null;
			var center = target ? target.World || [0, 0, 0] : [0, 0, 0];
			var radius = (target ? target.Size : 1) * 2.6 + 0.35;
			var angle = Math.PI * 2 * time / 3 + object.Seed;

			return {Point: vectors.Add(center, [Math.cos(angle) * radius, 0.12 * radius, -Math.sin(angle) * radius]), Heading: [-Math.sin(angle), 0, -Math.cos(angle)]};
		}

		function hold (object, time) {
			var travel = scene.Travels[object.ID];
			var goal;
			var progress;
			var eased;
			var spot;

			if (!travel) {
				spot = holdAt(object, object.Parent, time);
				object.World = spot.Point;
				object.Heading = spot.Heading;
				object.Position = object.Parent && scene.Objects[object.Parent] ? scene.Objects[object.Parent].Position || [0, 0, 0] : [0, 0, 0];

				return;
			}

			goal = holdAt(object, travel.Target, time).Point;
			progress = Math.max(0, Math.min(1, (time - travel.Start) / travel.Duration));
			eased = progress * progress * (3 - 2 * progress);
			object.World = vectors.Lerp(travel.From, goal, eased);
			object.Heading = vectors.Normalize(vectors.Subtract(goal, travel.From));
			object.Position = vectors.Lerp(travel.Position, scene.Objects[travel.Target].Position || [0, 0, 0], eased);

			if (progress >= 1) {
				delete scene.Travels[object.ID];

				object.Parent = travel.Target;
				scene.Overrides[object.ID] = scene.Overrides[object.ID] || {};
				scene.Overrides[object.ID].Parent = travel.Target;

				window.setTimeout(function () {
					self.$Emit('arrive', {ID: object.ID, At: travel.Target});

					if (travel.Callback)
						travel.Callback(null, {ID: object.ID, At: travel.Target});
				}, 0);
			}
		}

		/* The ships of a formation in a wedge behind the first one, all heading along the way of the formation. */
		function formation (object) {
			var settings = trait(object, 'Formation');
			var spacing = number(settings.Spacing, 2.4);
			var direction = vectors.Normalize(object.Heading || [0, 0, 1]);
			var side = vectors.Normalize(vectors.Cross([0, 1, 0], direction));
			var turn = heading(direction);
			var index = 0;

			object.Turn = turn;

			object.Parts.forEach(function (part) {
				var row;
				var across;
				var size = part.Size || object.Size;

				if (!/^ship-\d+$/.test(part.Part)) return;

				row = Math.ceil(index / 2);
				across = index === 0 ? 0 : index % 2 ? -row : row;
				part.World = vectors.Add(object.World, vectors.Add(vectors.Scale(side, across * size * spacing), vectors.Scale(direction, -row * size * spacing * 1.08)));
				part.Turn = turn;
				part.Heading = direction;

				index++;
			});
		}

		/* The systems of the application for traits of their own: Update after the places, Draw after the scene. */
		function custom (stage) {
			var systems = self.Systems || {};

			Object.keys(systems).forEach(function (name) {
				var system = systems[name];
				if (!system || typeof system[stage] !== 'function') return;

				scene.Order.forEach(function (object) {
					if (trait(object, name))
						system[stage](object, engine.Context);
				});
			});
		}

		/* The meshes and programs, made once (and again when the browser gives a lost context back). */
		function build () {
			if (!renderer) return;

			gpu.Planet = renderer.Program(shaders.Lit, shaders.Planet);
			gpu.Bake = renderer.Program(graphics.Shaders.Quad, shaders.Bake);
			gpu.Star = renderer.Program(shaders.Lit, shaders.Star);
			gpu.Air = renderer.Program(shaders.Lit, shaders.Air);
			gpu.Ring = renderer.Program(shaders.Lit, shaders.Ring);
			gpu.Many = renderer.Program(shaders.Instanced, shaders.Solid);
			gpu.Glow = renderer.Program(shaders.Billboard, shaders.Glow);
			gpu.Line = renderer.Program(shaders.Line, shaders.Flat);
			gpu.Far = renderer.Program(shaders.Far, shaders.Dot);
			gpu.Ground = renderer.Program(shaders.GroundVertex, shaders.Ground);
			gpu.Land = renderer.Program(shaders.LandVertex, shaders.Land);
			gpu.ManyDepth = renderer.Program(shaders.Instanced, shaders.Depth);
			gpu.Pbr = renderer.Program(shaders.Instanced, shaders.Pbr);
			gpu.PbrSkinned = renderer.Program(shaders.Skinned, shaders.Pbr);
			gpu.SkinDepth = renderer.Program(shaders.Skinned, shaders.Depth);
			gpu.White = null;
			gpu.LandDepth = renderer.Program(shaders.LandVertex, shaders.Depth);
			gpu.GroundDepth = renderer.Program(shaders.GroundVertex, shaders.Depth);
			gpu.ShadowMap = null;
			gpu.Sea = renderer.Program(shaders.Lit, shaders.Sea);
			gpu.Sky = renderer.Program(graphics.Shaders.Quad, shaders.Sky);
			gpu.Sphere = renderer.Mesh(graphics.Sphere({Segments: 64, Rings: 40}));
			gpu.Quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
			gpu.Shapes = {};
			gpu.Stars = stars();
			scene.Lines = {};
			scene.Rings = {};
			scene.Rocks = {};
			scene.Baked = {};
		}

		/* The plain shapes and the rocks of a belt, or the geometry of a piece of a model: each a mesh made the first time it is drawn. */
		function shape (name, geometry) {
			if (!gpu.Shapes[name])
				gpu.Shapes[name] = renderer.Mesh(geometry || shapeGeometry(name));

			return gpu.Shapes[name];
		}

		function shapeGeometry (name) {
			var simple = {
				box: function () {
					return graphics.Box({});
				},
				sphere: function () {
					return graphics.Sphere({Radius: 0.5, Segments: 24, Rings: 16});
				},
				cylinder: function () {
					return graphics.Cylinder({Radius: 0.5, Height: 1, Segments: 20});
				},
				cone: function () {
					return graphics.Cylinder({Radius: 0.5, Top: 0, Height: 1, Segments: 20});
				},
				torus: function () {
					return graphics.Torus({Radius: 1, Tube: 0.1, Segments: 48, Sides: 10});
				},
				asteroid: function () {
					var noise = graphics.Noise('rock');

					return graphics.Displace(graphics.Icosphere({Radius: 1, Detail: 1}), function (point) {
						return (noise.Fbm(point[0] * 1.6 + 3, point[1] * 1.6, point[2] * 1.6, 3) - 0.5) * 0.9;
					});
				}
			};

			return simple[name] ? simple[name]() : graphics.Box({});
		}

		/* The stars far away: points on a ball round the view, of the colors of their temperatures. */
		function stars () {
			var generator = astronomy.Random('sky');
			var positions = [];
			var colors = [];
			var i;
			var z;
			var angle;
			var radius;
			var color;

			for (i = 0; i < 2600; i++) {
				z = generator.Float(-1, 1);
				angle = generator.Float(0, Math.PI * 2);
				radius = Math.sqrt(1 - z * z);
				color = paint(astronomy.Color(generator.Pick([3200, 4500, 5600, 6500, 8000, 12000])));

				positions.push(Math.cos(angle) * radius * 50, z * 50, Math.sin(angle) * radius * 50);
				colors.push(color[0], color[1], color[2], Math.pow(generator.Next(), 3) * 0.9 + 0.1);
			}

			return renderer.Points(positions, {aColor: {Size: 4, Data: colors}});
		}

		/* The meshes of the orbits, rings and belts, made again with the objects; the baked surfaces kept by their look. */
		function clear () {
			Object.keys(scene.Lines).forEach(function (id) {
				scene.Lines[id].Destroy();
			});

			Object.keys(scene.Rings).forEach(function (id) {
				scene.Rings[id].Mesh.Destroy();
			});

			scene.Lines = {};
			scene.Rings = {};
			scene.Rocks = {};
		}

		function orbitLine (object) {
			var parent = parentOf(object);

			if (!scene.Lines[object.ID])
				scene.Lines[object.ID] = renderer.Lines(astronomy.Path(trait(object, 'Orbit'), 180).map(function (point) {
					return spread(toView(point), parent);
				}), true);

			return scene.Lines[object.ID];
		}

		function ringOf (object) {
			var settings = trait(object, 'Ring');
			var parent = parentOf(object);
			var round = parent && parent.Radius;
			var inner = number(settings.Inner, round ? 1.3 : 2.2);
			var outer = number(settings.Outer, round ? 2.3 : 3.2);

			if (!scene.Rings[object.ID]) {
				scene.Rings[object.ID] = {
					Mesh: renderer.Mesh(graphics.Ring({Inner: round ? inner : vectors.Length(spread([inner, 0, 0], null)), Outer: round ? outer : vectors.Length(spread([outer, 0, 0], null)), Segments: 128})),
					Colors: (settings.Colors ? String(settings.Colors).split(',') : []).concat(['#c9b48f', '#a89070', '#e0d2b4', '#8c7a60']).slice(0, 4).map(function (color) {
						return paint(String(color).trim()).slice(0, 3);
					})
				};
			}

			return scene.Rings[object.ID];
		}

		/* The rocks of a belt: each on an orbit of its own, between the edges of the belt. */
		function rocksOf (object) {
			var settings = trait(object, 'Belt');
			var parent = parentOf(object);
			var round = parent && parent.Radius;
			var generator = astronomy.Random(object.ID + ':' + object.Seed);
			var count = Math.max(1, Math.min(4000, Math.round(number(settings.Count, 260))));
			var inner = number(settings.Inner, round ? 2 : 2.2);
			var outer = number(settings.Outer, round ? 4 : 3.2);
			var tilt = number(settings.Inclination, 0);
			var colors = (settings.Colors ? String(settings.Colors).split(',') : ['#8a7f74', '#6f655c', '#a39684', '#5d5650']).map(function (color) {
				return paint(String(color).trim()).slice(0, 3);
			});
			var rocks = [];
			var i;

			if (scene.Rocks[object.ID])
				return scene.Rocks[object.ID];

			for (i = 0; i < count; i++) {
				rocks.push({
					Orbit: {Distance: round ? generator.Float(inner, outer) * parent.Radius * KM : generator.Float(inner, outer), Eccentricity: generator.Float(0, 0.12), Inclination: tilt + generator.Float(-6, 6), Node: generator.Float(0, 360), Periapsis: generator.Float(0, 360), Anomaly: generator.Float(0, 360)},
					Size: generator.Float(0.03, 0.11) * (self.Scale === 'real' ? 0.02 : 1) * (round ? parent.Size : 1),
					Axis: vectors.Normalize([generator.Float(-1, 1), generator.Float(-1, 1), generator.Float(-1, 1)]),
					Spin: generator.Float(0.5, 3),
					Color: generator.Pick(colors)
				});
			}

			scene.Rocks[object.ID] = {Rocks: rocks};

			return scene.Rocks[object.ID];
		}

		/* The surface of a body baked once into two cubes: its ground (color and gloss), its clouds and the glow of its lava. */
		function baked (object) {
			var key = JSON.stringify([object.Look, object.Seed]);
			var made = scene.Baked[object.ID];
			var size = object.Radius > 3000 ? 512 : object.Radius > 500 ? 256 : 128;
			var uniforms;

			if (made && made.Key === key) return made;

			if (scene.BakedThisFrame >= 2) return made || null;

			scene.BakedThisFrame++;

			if (made) {
				made.Ground.Destroy();
				made.Sky.Destroy();
			}

			uniforms = {uKind: object.Look.Kind, uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]), uWater: object.Look.Water, uOcean: object.Look.Ocean, uIce: object.Look.Ice, uClouds: object.Look.Clouds, uSeed: object.Seed};
			made = {Key: key, Ground: renderer.Cube(size), Sky: renderer.Cube(size)};

			renderer.Bake(made.Ground, gpu.Bake, Object.assign({uLayer: 0}, uniforms));
			renderer.Bake(made.Sky, gpu.Bake, Object.assign({uLayer: 1}, uniforms));

			scene.Baked[object.ID] = made;

			return made;
		}

		/* The lights: the stars, up to four, relative to the eye. */
		function lights () {
			var positions = [];
			var colors = [];
			var list = scene.Order.filter(function (object) {
				return trait(object, 'Star') && object.World;
			}).slice(0, 4);

			list.forEach(function (star) {
				var color = paint(star.Color);
				var strength = Math.min(1.6, 0.9 + 0.25 * Math.log(1 + star.Star.Luminosity));
				var at = vectors.Subtract(star.World, scene.Eye);

				positions.push(at[0], at[1], at[2]);
				colors.push(color[0] * strength, color[1] * strength, color[2] * strength);
			});

			/* The sun of a ground: a light so far along its direction that its rays are parallel. */
			if (!list.length && scene.Ground) {
				positions.splice(0, 0, scene.Ground.Sun[0] * 1e6, scene.Ground.Sun[1] * 1e6, scene.Ground.Sun[2] * 1e6);
				colors.splice(0, 0, scene.Ground.SunColor[0] * 1.15, scene.Ground.SunColor[1] * 1.15, scene.Ground.SunColor[2] * 1.15);

				list = [null];
			}

			while (positions.length < 12) {
				positions.push(0, 0, 0);
				colors.push(0, 0, 0);
			}

			return {Positions: positions, Colors: colors, Count: list.length};
		}

		/* The balls that may shade a body: what it goes round, and its moons (the largest ones), relative to the eye. */
		function occluders (object) {
			var list = [];
			var parent = parentOf(object);
			var data = [];

			if (parent && parent.Radius)
				list.push(parent);

			scene.Order.forEach(function (other) {
				if (other.Parent === object.ID && other.Radius && !other.Owner)
					list.push(other);
			});

			list.sort(function (a, b) {
				return b.Size - a.Size;
			}).slice(0, 4).forEach(function (other) {
				var at = vectors.Subtract(other.World, scene.Eye);

				data.push(at[0], at[1], at[2], other.Size);
			});

			while (data.length < 16)
				data.push(0, 0, 0, 0);

			return {Data: data, Count: Math.min(4, list.length)};
		}

		function resize () {
			scene.Width = element.clientWidth;
			scene.Height = element.clientHeight;

			theme();

			if (renderer)
				renderer.Resize(scene.Width, scene.Height, scene.Ratio);
		}

		/* The resolution follows the time of a frame: lower while frames are slow, back up while they are fast. */
		function adapt (elapsed) {
			if (!elapsed || !renderer) return;

			if (elapsed > 0.026) {
				scene.Slow++;
				scene.Fast = 0;
			}
			else if (elapsed < 0.014) {
				scene.Fast++;
				scene.Slow = 0;
			}

			if (scene.Slow > 20 && scene.Ratio > 0.5) {
				scene.Ratio = Math.max(0.5, scene.Ratio * 0.8);
				scene.Slow = 0;

				renderer.Resize(scene.Width, scene.Height, scene.Ratio);
			}
			else if (scene.Fast > 90 && scene.Ratio < scene.Most) {
				scene.Ratio = Math.min(scene.Most, scene.Ratio * 1.15);
				scene.Fast = 0;

				renderer.Resize(scene.Width, scene.Height, scene.Ratio);
			}
		}

		/* The view: smoothly to the object in focus (following it as it goes), then round it. */
		function aim (elapsed) {
			var focus = scene.Focus ? scene.Objects[scene.Focus] : null;
			var wanted = focus && focus.World ? focus.World : [0, 0, 0];
			var camera = scene.Camera;
			var eased;

			scene.Moving = Math.min(1, scene.Moving + elapsed / 0.9);
			eased = scene.Moving * scene.Moving * (3 - 2 * scene.Moving);
			scene.Target = vectors.Lerp(scene.From, wanted, eased);
			scene.Distance += (scene.Wanted - scene.Distance) * (1 - Math.exp(-elapsed * 9));

			camera.Orbit(scene.Target, scene.Yaw, scene.Pitch, scene.Distance);

			scene.Eye = camera.Position.slice();
			camera.Near = Math.max(1e-6, scene.Distance * 0.002);
			camera.Far = scene.Distance * 40 + extent() * 6;
		}

		/* How far the scene reaches: the farthest object round the middle. */
		function extent () {
			var far = 4;

			scene.Roots.forEach(function (object) {
				var parent = parentOf(object);
				var middle = !parent || trait(parent, 'Star');
				if (object.Relative && middle)
					far = Math.max(far, vectors.Length(object.Relative) * (1 + number(trait(object, 'Orbit') && trait(object, 'Orbit').Eccentricity, 0)));

				if (trait(object, 'Belt') && middle)
					far = Math.max(far, vectors.Length(spread([number(trait(object, 'Belt').Outer, 3), 0, 0], null)));
			});

			return far;
		}

		/* How far to stand from an object to see it and what goes round it. */
		function closeness (object) {
			var far = Math.max(object.Size, 0.02) * 4.5;

			if (trait(object, 'Star') && !object.Parent) return extent() * 1.6;

			if (scene.Ground)
				return Math.max(far, 45);

			scene.Roots.forEach(function (other) {
				if (other.Parent === object.ID && other.Relative)
					far = Math.max(far, vectors.Length(other.Relative) * 1.7);
			});

			return far;
		}

		function focusOn (id, quiet) {
			var object = id ? scene.Objects[id] : null;
			var star;

			if (id && !object) return false;

			scene.From = scene.Target.slice();
			scene.Moving = 0;
			scene.Focus = object ? object.ID : '';
			scene.Wanted = object ? closeness(object) : scene.Ground ? scene.Ground.Field.Size * 0.45 : extent() * 1.6;
			scene.Given.Focus = scene.Focus;
			self.Focus = scene.Focus;

			/* An object is seen from its day side, a little aside from its star. */
			if (object && !trait(object, 'Star') && object.World) {
				star = scene.Order.filter(function (each) {
					return trait(each, 'Star') && each.World;
				})[0];

				if (star && (star.World[0] - object.World[0] || star.World[2] - object.World[2]))
					scene.Yaw = Math.atan2(star.World[0] - object.World[0], star.World[2] - object.World[2]) + 0.75;
			}

			if (!quiet)
				self.$Emit('focus', {ID: scene.Focus});

			return true;
		}

		/* A matrix of an object relative to the eye: what the view draws is near the origin, where floats are exact. */
		function local (point) {
			return vectors.Subtract(point, scene.Eye);
		}

		function draw () {
			var camera = scene.Camera;
			var width = renderer.Width;
			var height = renderer.Height;
			var aspect = width / Math.max(1, height);
			var viewMatrix = graphics.LookAt([0, 0, 0], vectors.Subtract(camera.Target, camera.Position), camera.Up);
			var matrix = graphics.Multiply(engine.PostJitter(camera.Projection(aspect)), viewMatrix);
			var right = [viewMatrix[0], viewMatrix[4], viewMatrix[8]];
			var up = [viewMatrix[1], viewMatrix[5], viewMatrix[9]];
			var light = lights();
			var background = scene.Colors.Background;
			var models = gather();
			var nodes;
			var shade;
			var posted;

			/* First: a village it lays out makes the ground again. */
			engine.ScatterFrame(matrix);

			nodes = scene.Ground ? groundPatches() : null;
			shade = shadowOfScene(models, nodes);
			posted = engine.PostBegin();

			var common = Object.assign({uViewProjection: matrix, uCamera: [0, 0, 0], uLightPositions: light.Positions, uLightColors: light.Colors, uLightCount: light.Count, uSkyLight: scene.Ground ? [0.3, 0.36, 0.46] : [0.004, 0.004, 0.006], uFloorLight: scene.Ground ? [0.1, 0.1, 0.09] : [0.004, 0.004, 0.006], uAmbient: scene.Ground ? [0.17, 0.19, 0.23] : [0.025, 0.027, 0.035], uOccluderCount: 0, uOccluders: new Array(16).fill(0), uTime: scene.Time, uHighlight: [0, 0, 0, 0], uWind: scene.Seconds}, shade);
			var selected = scene.Selected ? scene.Objects[scene.Selected] : null;
			var later = [];

			scene.BakedThisFrame = 0;

			function uniforms (extra) {
				return Object.assign({}, common, extra);
			}

			/* A turn of an object with its place relative to the eye and its size: its model matrix. */
			function placed (object, size) {
				var model = graphics.Multiply(graphics.Translation(0, 0, 0), object.Turn || graphics.Identity());

				model = graphics.Multiply(model, graphics.Scaling(size, size, size));
				model[12] = object.World[0] - scene.Eye[0];
				model[13] = object.World[1] - scene.Eye[1];
				model[14] = object.World[2] - scene.Eye[2];

				return model;
			}

			/* The glow of the selection on the edge of a body near enough to fill much of the view. */
			function highlight (object) {
				var color = scene.Colors.Selection;

				return selected && (selected === object || selected.Root === object) ? [color[0], color[1], color[2], 0.9] : [0, 0, 0, 0];
			}

			renderer.Clear([background[0], background[1], background[2], 1]);

			if (scene.Ground)
				drawGround(matrix, nodes, shade);

			if (self.Background && self.Background !== 'false' && !scene.Ground) {
				renderer.Draw(gpu.Stars, gpu.Far, {uViewProjection: graphics.Multiply(graphics.Perspective(camera.Fov, aspect, 0.1, 200), viewMatrix), uRatio: renderer.Ratio}, {Depth: false, DepthWrite: false, Blend: 'add'});
			}

			scene.Active.forEach(function (object) {
				var parent = parentOf(object);
				var size = object.World && object.Size ? Math.max(object.Size, pixels(object.World, trait(object, 'Star') ? 4 : 1.5)) : object.Size;
				var model;
				var shade;
				var surface;
				var ring;

				if (!object.World) return;

				if (trait(object, 'Star')) {
					model = placed(object, size);

					renderer.Draw(gpu.Sphere, gpu.Star, uniforms({uModel: model, uNormalMatrix: graphics.NormalMatrix(model), uColor: paint(object.Color).slice(0, 3), uSeed: object.Seed}));

					later.push(function () {
						renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(object.World), uSize: size * 4.2, uRight: right, uUp: up, uColor: paint(object.Color).slice(0, 3), uInner: 0.18, uStyle: 0}), {Blend: 'add', DepthWrite: false, Cull: 'none'});
					});
				}
				else if (trait(object, 'Body')) {
					surface = baked(object);

					if (!surface) return;

					model = placed(object, size);
					shade = occluders(object);

					renderer.Draw(gpu.Sphere, gpu.Planet, uniforms({uModel: model, uNormalMatrix: graphics.NormalMatrix(model), uGround: surface.Ground, uSky: surface.Sky, uKind: object.Look.Kind, uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]), uClouds: object.Look.Clouds, uAtmosphere: object.Look.Atmosphere, uOccluders: shade.Data, uOccluderCount: shade.Count, uHighlight: highlight(object)}));

					if (object.Look.Atmosphere[3]) {
						later.push(function () {
							var shell = graphics.Compose(local(object.World), null, size * 1.07);

							renderer.Draw(gpu.Sphere, gpu.Air, uniforms({uModel: shell, uNormalMatrix: graphics.NormalMatrix(shell), uColor: object.Look.Atmosphere.slice(0, 3), uStrength: object.Look.Atmosphere[3], uBody: local(object.World).concat([size]), uShell: size * 1.07}), {Blend: 'add', DepthWrite: false, Cull: 'front'});
						});
					}
				}
				else if (trait(object, 'Ring')) {
					ring = ringOf(object);

					later.push(function () {
						var settings = trait(object, 'Ring');
						var round = parent && parent.Radius;
						var turn = graphics.Rotation([1, 0, 0], ((round ? number(trait(parent, 'Body').Tilt, 0) : 0) + number(settings.Inclination, 0)) * Math.PI / 180);
						var matrix = graphics.Compose(local(parent ? parent.World : [0, 0, 0]), turn, round ? parent.Size : 1);
						var planet = round ? local(parent.World).concat([parent.Size]).concat(new Array(12).fill(0)) : new Array(16).fill(0);

						renderer.Draw(ring.Mesh, gpu.Ring, uniforms({uModel: matrix, uNormalMatrix: graphics.NormalMatrix(matrix), uColors: [].concat(ring.Colors[0], ring.Colors[1], ring.Colors[2], ring.Colors[3]), uSeed: object.Seed, uOccluders: planet, uOccluderCount: round ? 1 : 0}), {Blend: 'alpha', DepthWrite: false, Cull: 'none'});
					});
				}

				if (self.Orbits && self.Orbits !== 'false' && trait(object, 'Orbit') && trait(object, 'Orbit').Unit !== 'radii' && !object.Owner && astronomy.Length(trait(object, 'Orbit').Distance))
					later.unshift(line(object, parent, uniforms));
			});

			Object.keys(models).forEach(function (name) {
				var list = models[name];

				if (list.Material) {
					renderer.Draw(shape(name), list.Skinned ? gpu.PbrSkinned : gpu.Pbr, Object.assign(uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft}), surface(list)), {Cull: list.Material.DoubleSided ? 'none' : 'back', Blend: list.Material.Alpha === 'BLEND' ? 'alpha' : 'none'});

					return;
				}

				renderer.Draw(shape(name), gpu.Many, uniforms({uShine: list.Matte ? 8 : 36, uSpecular: list.Matte ? 0.05 : 0.5, uRough: list.Rough, uOrigin: originOf(list)}));
			});

			engine.ScatterDraw(common, matrix);

			custom('Draw');

			if (scene.Ground)
				drawSea(matrix, posted);

			later.forEach(function (each) {
				each();
			});

			/* The mark of the selected object while it is small on the screen: near, its own glow shows it. */
			if (selected && selected.World && Math.max(selected.Size, 0.001) < pixels(selected.World, 40)) {
				renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(selected.World), uSize: Math.max(selected.Size * 1.5, pixels(selected.World, 14)), uRight: right, uUp: up, uColor: scene.Colors.Selection.slice(0, 3), uInner: 0, uStyle: 1}), {Blend: 'add', DepthWrite: false, Depth: false, Cull: 'none'});
			}

			if (posted)
				engine.PostEnd(scene.Ground ? {Matrix: matrix, Eye: scene.Eye, Sun: scene.Ground.Sun, SunColor: scene.Ground.SunColor, Air: [0.55, 0.72, 1, 0.95], Fog: scene.Camera.Ortho ? 0 : 0.4 / scene.Ground.Field.Size, Sky: true, Reach: Math.max(1, scene.Distance * 0.05)} : {Matrix: matrix});
		}

		/* The copies of the shapes of a frame: the rocks of the belts, the models of the objects, their pieces as they stand now. */
		function gather () {
			var models = scene.Lists = scene.Lists || {};
			var drawn = {};

			Object.keys(models).forEach(function (name) {
				models[name].Count = 0;
			});

			scene.Active.forEach(function (object) {
				var parent = parentOf(object);
				var settings = trait(object, 'Model');

				if (!object.World || object.Hidden) return;

				if (trait(object, 'Belt')) {
					rocksOf(object).Rocks.forEach(function (each) {
						var point = vectors.Add(parent ? parent.World : [0, 0, 0], spread(toView(astronomy.Position(each.Orbit, scene.Time, object.Around)), parent));
						var turn = graphics.Rotation(each.Axis, scene.Time * each.Spin);

						batch(models, 'asteroid', point, graphics.Multiply(turn, graphics.Scaling(each.Size, each.Size, each.Size)), each.Color, {Matte: true, Rough: 1});
					});
				}

				/* A model: of its own shape, or of its parts (a station of modules); a part drawn in its owner. */
				if (settings && settings.Shape)
					gatherModel(models, object, settings);
			});

			Object.keys(models).forEach(function (name) {
				if (models[name].Count)
					upload(name, models[name]);

				if (models[name].Count)
					drawn[name] = models[name];
			});

			if (!scene.StillLists) {
				scene.StillLists = {};

				scene.Still.forEach(function (object) {
					if (object.Hidden) return;

					gatherModel(scene.StillLists, object, trait(object, 'Model'), true);
				});

				Object.keys(scene.StillLists).forEach(function (name) {
					upload(name, scene.StillLists[name]);
				});
			}

			return Object.assign(drawn, scene.StillLists);
		}

		function upload (name, list) {
			var size = list.Count * 4;
			var data = {aInstance: {Size: 4, Data: list.Places.subarray(0, size)}, aInstance2: {Size: 4, Data: list.X.subarray(0, size)}, aInstance3: {Size: 4, Data: list.Y.subarray(0, size)}, aInstance4: {Size: 4, Data: list.Z.subarray(0, size)}, aInstance5: {Size: 4, Data: list.Tints.subarray(0, size)}};

			if (list.Skinned)
				data.aFrames = {Size: 4, Data: list.Frames.subarray(0, size)};

			shape(name, list.Geometry).Instance(data, list.Count);
		}

		/* What is kept in buffers stands in the world: the eye is taken away from it in the shader. */
		function originOf (list) {
			return list.Still ? vectors.Subtract([0, 0, 0], scene.Eye) : [0, 0, 0];
		}

		/* A name of a model, or the name of a file of one: it is fetched the first time, and the scene is made again when it came. */
		function known (name) {
			if (/\.(glb|gltf)(\?|$)/i.test(name || '') && !library.Has(name))
				library.Define(name, {URL: name});

			if (library.Has(name) && !library.Ready(name) && !scene.Asked[name]) {
				scene.Asked[name] = true;

				library.Load(name, function (error) {
					if (error)
						self.$Emit('error', error);

					scene.Version++;
				});
			}

			return library.Has(name);
		}

		function nameOf (object, settings) {
			return object.Shape || object.Values.Model || settings.Shape;
		}

		function modelOf (object, settings) {
			var name = nameOf(object, settings);

			return known(name) && library.Ready(name) ? library.Make(name, {Variant: random.Hash(object.ID)}) : null;
		}

		/* How much light goes under a surface: told by its object, or by its model, by the name of its material or for all. */
		function softOf (object, made, piece) {
			var given = object.Values.Soft === undefined ? made.Soft : object.Values.Soft;

			return Number(given && typeof given === 'object' ? given[piece.Material.Name] : given) || 0;
		}

		/* The textures of a material on this renderer, made once; a white one for what it has none of. */
		function surface (list) {
			var material = list.Material;
			var asset = list.Asset;

			function texture (map, srgb) {
				var image = map ? asset.Images[map.Image] : null;

				if (!gpu.White)
					gpu.White = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255, 255, 255, 255])}, {Nearest: true});

				if (!image || !image.Picture) return gpu.White;

				if (!image.Made)
					image.Made = {};

				if (!image.Made[srgb ? 'Srgb' : 'Plain'])
					image.Made[srgb ? 'Srgb' : 'Plain'] = renderer.Texture(image.Picture, {Srgb: srgb, Mipmaps: true, Repeat: true});

				return image.Made[srgb ? 'Srgb' : 'Plain'];
			}

			if (!material.Uniforms) {
				material.Uniforms = {
					uBaseColor: material.BaseColor,
					uMetallic: material.Metallic,
					uRoughness: material.Roughness,
					uEmissive: material.Emissive,
					uCutoff: material.Alpha === 'MASK' ? material.Cutoff : 0,
					uUnlit: material.Unlit ? 1 : 0,
					uNormalScale: material.NormalMap ? material.NormalMap.Scale : 0,
					uOcclusion: material.OcclusionMap ? material.OcclusionMap.Strength : 0,
					uSpecularLevel: material.Specular,
					uSpecularColor: material.SpecularColor,
					uSpecularOn: material.SpecularMap ? 1 : 0,
					uSpecularMap: texture(material.SpecularMap, false),
					uColorMap: texture(material.ColorMap, true),
					uNormalMap: texture(material.NormalMap, false),
					uMetalMap: texture(material.MetalMap, false),
					uOcclusionMap: texture(material.OcclusionMap, false),
					uEmissiveMap: texture(material.EmissiveMap, true)
				};
			}

			return material.Uniforms;
		}

		/* The frames of the skeleton of a model, as a texture. */
		function palette (model) {
			var baked = library.Bake(model);

			if (!model.Palette)
				model.Palette = renderer.Texture({Width: baked.Width, Height: baked.Height, Data: baked.Data}, {Float: true, Nearest: true});

			return model.Palette;
		}

		/* An object as copies of its pieces, each in its pose; a piece of a team takes its color. */
		function gatherModel (models, object, settings, still) {
			var made = modelOf(object, settings);
			var scale = object.Scaled || vectors.Scale(settings.Scale || [1, 1, 1], object.Size);
			var base = graphics.Multiply(object.Turn || graphics.Identity(), graphics.Scaling(scale[0], scale[1], scale[2]));
			var color = paint(settings.Color || (made ? '#ffffff' : '#c8ccd4')).slice(0, 3);
			var team = paint(teamColor(object.Team)).slice(0, 3);
			var pose;
			var plain;

			if (!made && library.Has(nameOf(object, settings))) return;

			if (!made) {
				plain = object.Team ? 0.35 : 0;

				batch(models, (still ? 'still:' : '') + settings.Shape, object.World, base, [color[0] * (1 - plain) + team[0] * plain, color[1] * (1 - plain) + team[1] * plain, color[2] * (1 - plain) + team[2] * plain], {Rough: 0.15, Still: still, Geometry: still ? shapeGeometry(settings.Shape) : null});

				return;
			}

			if (made.Type === 'ship' && object.Team)
				color = [color[0] * 0.65 + team[0] * 0.35, color[1] * 0.65 + team[1] * 0.35, color[2] * 0.65 + team[2] * 0.35];

			pose = (made.Pieces.length > 1 || made.Moves) && !still ? poseOf(object, made, settings) : null;

			made.Pieces.forEach(function (piece) {
				if (made.Asset) {
					batch(models, (still ? 'still:' : '') + made.Key + '/' + piece.ID, object.World, piece.Skin !== -1 ? base : graphics.Multiply(base, pose ? pose[piece.ID] : piece.Rest), color, {Rough: 0, Geometry: piece.Geometry, Still: still, Material: piece.Material, Asset: made.Asset, Skinned: piece.Skin !== -1 ? made : null, Offset: piece.JointOffset, Frames: piece.Skin !== -1 ? object.Frames || [0, 0, 0, 0] : null, Soft: softOf(object, made, piece)});

					return;
				}

				batch(models, (still ? 'still:' : '') + made.Key + '/' + piece.ID, object.World, pose ? graphics.Multiply(base, pose[piece.ID]) : base, piece.Team ? team : color, {Matte: made.Matte, Rough: made.Matte ? 0.5 : 0.15, Sway: made.Sway, Geometry: piece.Geometry, Still: still});
			});
		}

		/* The clip an object plays: what it was told, or walking on a way, or its own; a change fades from the last one. */
		function poseOf (object, made, settings) {
			var way = scene.Ways[object.ID];
			var state = object.Clip;
			var wanted = way || object.Walking ? 'walk' : object.Loop || object.Values.Clip || settings.Clip || 'idle';
			var clip = made.Clips[wanted];
			var seconds = scene.Seconds;
			var rate = wanted === 'walk' && clip && (way || object.Walking) ? (way ? way.Speed : object.Walking) * (clip.Length || 1) / Math.max(0.01, object.Size * (clip.Stride || 1)) : 1;

			if (state && state.Once) {
				if ((seconds - state.Start) * state.Rate < library.Length(made, state.Name)) {
					wanted = state.Name;
					rate = state.Rate;
				}
				else {
					if (state.Callback) {
						window.setTimeout(state.Callback.bind(null, null, {ID: object.ID, Clip: state.Name}), 0);

						state.Callback = null;
					}

					if (made.Clips[state.Name] && made.Clips[state.Name].Hold) {
						wanted = state.Name;
						rate = state.Rate;
					}
					else {
						state.Once = false;
					}
				}
			}

			if (!state || state.Name !== wanted) {
				state = object.Clip = {Name: wanted, Start: seconds, Rate: rate, From: state ? state.Name : '', FromTime: state ? (seconds - state.Start) * state.Rate : 0, Once: false};
			}

			state.Rate = rate;

			if (made.Joints) {
				object.Frames = [library.Frame(made, state.Name, (seconds - state.Start) * rate), state.From ? library.Frame(made, state.From, state.FromTime) : 0, state.From ? Math.max(0, 1 - (seconds - state.Start) / 0.2) : 0, 0];
			}

			return library.Pose(made, state.Name, (seconds - state.Start) * rate, {From: state.From, FromTime: state.FromTime, Fade: (seconds - state.Start) / 0.2});
		}

		/* A copy of a shape for the one draw of all of them: its place relative to the eye, its axes, its colors. */
		function batch (models, name, world, matrix, color, options) {
			var list = models[name];
			var m = matrix;
			var settings = options || {};
			var at = settings.Still ? world : local(world);
			var i;

			if (!list) {
				list = models[name] = {Count: 0, Capacity: 0, Matte: !!settings.Matte, Rough: settings.Rough || 0, Geometry: settings.Geometry || null, Still: !!settings.Still, Material: settings.Material || null, Asset: settings.Asset || null, Skinned: settings.Skinned || null, Offset: settings.Offset || 0, Soft: settings.Soft || 0};
			}

			if (list.Count === list.Capacity)
				grow(list);

			i = list.Count * 4;

			list.Places[i] = at[0] + m[12];
			list.Places[i + 1] = at[1] + m[13];
			list.Places[i + 2] = at[2] + m[14];
			list.Places[i + 3] = settings.Sway || 0;
			list.X[i] = m[0];
			list.X[i + 1] = m[1];
			list.X[i + 2] = m[2];
			list.Y[i] = m[4];
			list.Y[i + 1] = m[5];
			list.Y[i + 2] = m[6];
			list.Z[i] = m[8];
			list.Z[i + 1] = m[9];
			list.Z[i + 2] = m[10];
			list.Tints[i] = color[0];
			list.Tints[i + 1] = color[1];
			list.Tints[i + 2] = color[2];
			list.Tints[i + 3] = world[0] * 0.13 + world[2] * 0.17;

			if (settings.Frames)
				list.Frames.set(settings.Frames, i);

			list.Count++;
		}

		/* The arrays of a list twice as large, kept from frame to frame. */
		function grow (list) {
			var capacity = Math.max(16, list.Capacity * 2);

			['Places', 'X', 'Y', 'Z', 'Tints', 'Frames'].forEach(function (name) {
				var next = new Float32Array(capacity * 4);

				if (list[name])
					next.set(list[name]);

				list[name] = next;
			});

			list.Capacity = capacity;
		}

		/*
		 * The shadow map of a light from a direction over a square round a point, its depth drawn by casters(matrix). It
		 * keeps to whole texels of the world, so a moving view does not make the edges of the shadows crawl.
		 */
		function castShadow (direction, center, eye, extent, depth, casters, near) {
			var side = self.Graphics().Level === 'low' ? 1024 : 2048;
			var up = Math.abs(direction[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
			var x = vectors.Normalize(vectors.Cross(up, direction));
			var y = vectors.Cross(direction, x);
			var texel = extent * 2 / side;
			var along = vectors.Dot(center, x);
			var across = vectors.Dot(center, y);
			var snapped = vectors.Add(vectors.Add(center, vectors.Scale(x, Math.round(along / texel) * texel - along)), vectors.Scale(y, Math.round(across / texel) * texel - across));
			var target = vectors.Subtract(snapped, eye);
			var matrix = graphics.Multiply(graphics.Orthographic(-extent, extent, -extent, extent, 0, depth * 2), graphics.LookAt(vectors.Add(target, vectors.Scale(direction, depth)), target, up));

			var nearMap = near ? gpu.ShadowClose = gpu.ShadowClose || renderer.Shadow(side) : null;

			if (!gpu.ShadowMap)
				gpu.ShadowMap = renderer.Shadow(side);

			(nearMap || gpu.ShadowMap).Begin();

			casters(matrix);

			(nearMap || gpu.ShadowMap).End();

			return {uShadowMap: gpu.ShadowMap, uShadowNear: nearMap || gpu.ShadowMap, uBounce: gpu.NoBounce, uBounceOn: 0, uShadowMatrix: matrix, uShadowBias: texel * 1.6, uShadowOn: 1};
		}

		/* A second map, of what is near the eye: its shadows are as sharp as a texel of it is small. */
		function closer (shade, direction, center, eye, extent, depth, casters) {
			var near = castShadow(direction, center, eye, extent, depth, casters, true);

			shade.uShadowNear = gpu.ShadowClose;
			shade.uShadowNearMatrix = near.uShadowMatrix;
			shade.uShadowNearBias = near.uShadowBias;
			shade.uShadowOn = 2;

			return shade;
		}

		/* What the sun sees, in colors and blurred: the light that bounces off it into what is near. */
		function bounced (shade, nodes, models) {
			var ground = scene.Ground;

			if (!gpu.Bounce) {
				gpu.Bounce = renderer.Target(128, 128, {Depth: true, Mipmaps: true});
				gpu.BounceLand = renderer.Program(shaders.LandVertex, shaders.Bounced);
				gpu.BounceMany = renderer.Program(shaders.Instanced, shaders.Bounced);
			}

			scene.Bounces = (scene.Bounces || 0) + 1;

			if (scene.Bounces % 6 === 1) {
				gpu.Bounce.Begin();

				renderer.Clear([0, 0, 0, 1]);

				(nodes || []).forEach(function (node) {
					renderer.Draw(node.Mesh, gpu.BounceLand, {uViewProjection: shade.uShadowMatrix, uOffset: vectors.Subtract(node.Center, scene.Eye), uSun: ground.Sun, uSunColor: ground.SunColor}, {Cull: 'back'});
				});

				Object.keys(models).forEach(function (name) {
					if (!models[name].Skinned)
						renderer.Draw(shape(name), gpu.BounceMany, {uViewProjection: shade.uShadowMatrix, uWind: 0, uOrigin: originOf(models[name]), uSun: ground.Sun, uSunColor: ground.SunColor}, {Cull: 'back'});
				});

				gpu.Bounce.End();
			}

			shade.uBounce = gpu.Bounce.Textures[0];
			shade.uBounceOn = 1;

			return shade;
		}

		/* No shadow: the samplers still need textures of their own kinds. */
		function idle () {
			if (!gpu.NoShadow) {
				gpu.NoShadow = renderer.Shadow(1);
				gpu.NoBounce = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([0, 0, 0, 255])}, {Nearest: true});
			}

			return {uShadowOn: 0, uShadowMap: gpu.NoShadow, uShadowNear: gpu.NoShadow, uBounce: gpu.NoBounce, uBounceOn: 0};
		}

		function shadowsWanted () {
			return self.Shadows !== false && self.Shadows !== 'false';
		}

		/* The shadows of a frame: of the sun on a ground, or of a star on the model in the focus while near it. */
		function shadowOfScene (models, nodes) {
			var off = idle();
			var ground = scene.Ground;
			var holder = scene.Focus ? scene.Objects[scene.Focus] : null;
			var star;
			var extent;
			var set;
			var made;

			function casters (matrix) {
				Object.keys(models).forEach(function (name) {
					var list = models[name];

					renderer.Draw(shape(name), list.Skinned ? gpu.SkinDepth : gpu.ManyDepth, {uViewProjection: matrix, uWind: scene.Seconds, uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : undefined, uJointOffset: list.Offset}, {Cull: 'none'});
				});

				(nodes || []).forEach(function (node) {
					renderer.Draw(node.Mesh, gpu.LandDepth, {uViewProjection: matrix, uOffset: vectors.Subtract(node.Center, scene.Eye)}, {Cull: 'back'});
				});

				engine.ScatterShadow(matrix);
			}

			if (!shadowsWanted()) return off;

			if (ground) {
				if (ground.Sun[1] < 0.04) return off;

				extent = Math.max(ground.Field.Whole ? 8 : 30, Math.min(ground.Field.Size, scene.Distance * 1.5));
				set = self.Graphics();
				made = castShadow(ground.Sun, ground.Target, scene.Eye, extent, Math.max(extent * 2, ground.Field.Top * 4), casters);

				if (set.Cascades > 1)
					closer(made, ground.Sun, ground.Target, scene.Eye, extent * 0.3, Math.max(extent * 2, ground.Field.Top * 4), casters);

				return set.Bounce ? bounced(made, nodes, models) : made;
			}

			star = scene.Order.filter(function (object) {
				return trait(object, 'Star') && object.World;
			})[0];

			if (!star || !holder || !holder.World || !trait(holder, 'Model') || vectors.Distance(scene.Eye, holder.World) > holder.Size * 40) return off;

			extent = holder.Size * 3;

			return castShadow(vectors.Normalize(vectors.Subtract(star.World, holder.World)), holder.World, scene.Eye, extent, extent * 3, casters);
		}

		function line (object, parent, uniforms) {
			return function () {
				var chosen = object.ID === scene.Selected || object.ID === scene.Focus;

				renderer.Draw(orbitLine(object), gpu.Line, uniforms({uOffset: local(parent ? parent.World : [0, 0, 0]), uBody: local(object.World).concat([object.Size]), uColor: chosen ? scene.Colors.Selection.slice(0, 3).concat([0.75]) : scene.Colors.Orbit}), {Blend: 'alpha', DepthWrite: false, Cull: 'none'});
			};
		}

		/* The size in the view of some pixels of the screen at a point. */
		function pixels (point, count) {
			return vectors.Distance(scene.Camera.Position, point) * Math.tan(scene.Camera.Fov * Math.PI / 360) * 2 * count / Math.max(1, scene.Height);
		}

		/* The labels: a button of each object that can be selected, over its place on the screen. */
		function sync () {
			var wanted = {};

			scene.Roots.forEach(function (object) {
				var button;

				if (!trait(object, 'Selectable')) return;

				wanted[object.ID] = true;
				button = scene.Labels[object.ID];

				if (!button) {
					button = element.ownerDocument.createElement('button');
					button.type = 'button';
					button.className = 'elemenx-game-scene-label';

					button.setAttribute('data-id', object.ID);

					labels.appendChild(button);

					scene.Labels[object.ID] = button;
				}

				button.textContent = object.Name;

				button.setAttribute('data-kind', object.Kind);
				button.setAttribute('aria-pressed', String(object.ID === scene.Selected));
			});

			Object.keys(scene.Labels).forEach(function (id) {
				if (!wanted[id]) {
					labels.removeChild(scene.Labels[id]);

					delete scene.Labels[id];
				}
			});
		}

		function hidden (object, other) {
			var ray;
			var t;

			if (!other || other === object || !other.World || !other.Size || !other.Radius) return false;

			ray = {Origin: scene.Camera.Position, Direction: vectors.Normalize(vectors.Subtract(object.World, scene.Camera.Position))};
			t = graphics.Hit(ray, other.World, other.Size);

			return t >= 0 && t < vectors.Distance(scene.Camera.Position, object.World) - object.Size;
		}

		function moveLabels () {
			var camera = scene.Camera;

			scene.Roots.forEach(function (object) {
				var button = scene.Labels[object.ID];
				var parent = parentOf(object);
				var spot;
				var near;
				var shown;

				if (!button || !object.World) return;

				/* Under a body in space; over the head of a thing that stands on a ground. */
				spot = camera.Project(vectors.Add(object.World, [0, scene.Ground ? object.Size * 1.15 : -object.Size * 1.05, 0]), scene.Width, scene.Height);
				near = vectors.Distance(camera.Position, object.World);
				shown = spot.Visible && spot.X > -40 && spot.X < scene.Width + 40 && spot.Y > -20 && spot.Y < scene.Height + 20;

				if (shown && parent && !trait(parent, 'Star') && object.ID !== scene.Selected && object.ID !== scene.Focus)
					shown = near < Math.max(vectors.Length(object.Relative || [0, 0, 0]), parent.Size * 3) * 14;

				if (shown)
					shown = !hidden(object, parent) && !hidden(object, scene.Focus ? scene.Objects[scene.Focus] : null);

				if (!shown) {
					if (!button.hidden)
						button.hidden = true;

					return;
				}

				if (button.hidden)
					button.hidden = false;

				button.style.transform = 'translate(' + Math.round(spot.X) + 'px, ' + Math.round(spot.Y) + 'px) translate(-50%, ' + (scene.Ground ? '-100%' : '4px') + ')';
			});
		}

		/*
		 * The ground of the setting terrain: the object of a Terrain trait is a flat map of noise (the Terrain Service)
		 * drawn in squares, the finer the nearer; its water a plane, its sky of its sun (an object of a Sun trait). The
		 * other objects stand on it at X and Y (across and down the map); a Walker walks a way round
		 * the slopes, the sea and the things that block it. The view goes round a point of the ground.
		 */
		function groundOf () {
			var object = scene.Roots.filter(function (each) {
				return trait(each, 'Terrain');
			})[0];
			var settings;
			var key;
			var biome;
			var sun;
			var azimuth;
			var elevation;

			if (!object && !scene.Driven) {
				if (scene.Ground)
					dropGround();

				return null;
			}

			settings = object ? trait(object, 'Terrain') : null;
			biome = object && self.$Service('Biomes').Get(object.Values.Biome);

			if (biome)
				settings = Object.assign({}, settings, {Palette: biome.Ground});

			key = scene.Driven ? scene.Driven.Key : JSON.stringify(settings);

			if (!scene.Ground || scene.Ground.Key !== key) {
				if (scene.Ground)
					dropGround();

				scene.Ground = {Key: key, ID: object ? object.ID : '', Field: scene.Driven ? scene.Driven.Field : terrain.Flat(settings), Nodes: {}, Frame: 0, Keys: {}};
			}

			sun = scene.Roots.filter(function (each) {
				return trait(each, 'Sun');
			})[0];
			azimuth = number(sun ? trait(sun, 'Sun').Azimuth : 140, 140) * Math.PI / 180;
			elevation = number(sun ? trait(sun, 'Sun').Elevation : scene.Driven && scene.Driven.Elevation || 35, 35) * Math.PI / 180;
			scene.Ground.Sun = [Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation), -Math.cos(elevation) * Math.cos(azimuth)];
			scene.Ground.SunColor = paint(sun ? trait(sun, 'Sun').Color : '#fff4e0').slice(0, 3);

			return scene.Ground;
		}

		function dropGround () {
			Object.keys(scene.Ground.Nodes).forEach(function (key) {
				scene.Ground.Nodes[key].Mesh.Destroy();
			});

			scene.Ground = null;
		}

		/* What blocks the way at a point: a thing that Blocks, within its size. */
		function blocked (x, z, mover) {
			if (engine.ScatterBlocked(x, z)) return true;

			return scene.Roots.some(function (object) {
				var size;

				if (object === mover || !object.Values.Blocks || !object.World) return false;

				size = (object.Size || 1) * 0.45 + 0.6;

				return Math.abs(object.World[0] - x) < size && Math.abs(object.World[2] - z) < size;
			});
		}

		/* What stands still on a ground and has no moves of its own: it is placed once, and drawn from buffers that stay. */
		function stillOf (object) {
			var settings = trait(object, 'Model');
			var made;

			if (!settings || !settings.Shape || object.Owner || object.Hidden) return false;
			if (trait(object, 'Orbit') || trait(object, 'Walker') || trait(object, 'Mover') || trait(object, 'Formation')) return false;

			made = modelOf(object, settings);

			return !made || !Object.keys(made.Clips).length;
		}

		/* Which objects move, after the scene changed: the others stand once. */
		function settle () {
			var key = scene.Version + ':' + (scene.Ground ? scene.Ground.Key : '');
			if (scene.Settled === key) return;

			scene.Settled = key;
			scene.Active = [];
			scene.Still = [];
			scene.StillLists = null;

			scene.Order.forEach(function (object) {
				if (scene.Ground && stillOf(object)) scene.Still.push(object);
				else scene.Active.push(object);
			});

			scene.Still.forEach(function (object) {
				object.Turn = graphics.Identity();

				stand(object);
			});
		}

		/* A thing on the ground: at its X and Y, or along its way at the time of the scene. */
		function stand (object) {
			var field = scene.Ground.Field;
			var way = scene.Ways[object.ID];
			var x = number(object.Values.X, 0);
			var z = number(object.Values.Y, 0);
			var covered;
			var at;
			var length;
			var from;
			var to;
			var t;

			if (way) {
				covered = (scene.Seconds - way.Start) * way.Speed;
				at = 0;

				while (at < way.Lengths.length - 1 && covered > way.Lengths[at + 1])
					at++;

				if (at >= way.Lengths.length - 1) {
					from = way.Points[way.Points.length - 1];
					x = from.X;
					z = from.Z;

					finishWay(object, way, x, z);
				}
				else {
					from = way.Points[at];
					to = way.Points[at + 1];
					length = way.Lengths[at + 1] - way.Lengths[at];
					t = length ? (covered - way.Lengths[at]) / length : 1;
					x = from.X + (to.X - from.X) * t;
					z = from.Z + (to.Z - from.Z) * t;
					object.Heading = vectors.Normalize([to.X - from.X, 0, to.Z - from.Z]);
				}
			}

			/* On a map X and Y are the corner of its cells. */
			if (scene.Driven && object.Footprint) {
				x += object.Footprint[0] / 2;
				z = (z + object.Footprint[1] / 2) * (scene.Driven.Depth || 1);
			}

			/* The ground under it is noise: not again while it stands. */
			if (object.StoodX !== x || object.StoodZ !== z || !object.World) {
				object.StoodX = x;
				object.StoodZ = z;
				object.World = [x, Math.max(0, field.Height(x, z)), z];
			}

			object.Position = object.World;
			object.Relative = [0, 0, 0];

			if (object.Heading && vectors.Length(object.Heading))
				object.Turn = heading(object.Heading);
		}

		function finishWay (object, way, x, z) {
			delete scene.Ways[object.ID];

			scene.Overrides[object.ID] = scene.Overrides[object.ID] || {};
			scene.Overrides[object.ID].Values = Object.assign(scene.Overrides[object.ID].Values || {}, {X: x, Y: z});
			object.Values.X = x;
			object.Values.Y = z;

			window.setTimeout(function () {
				self.$Emit('arrive', {ID: object.ID, At: [x, z]});

				if (way.Callback)
					way.Callback(null, {ID: object.ID, At: [x, z]});
			}, 0);
		}

		/* Sends a walker to a point of the ground: a way of the Terrain round what it cannot walk; false without one. */
		function walk (id, point, callback) {
			var object = scene.Objects[id];
			var walker = object ? trait(object, 'Walker') : null;
			var field = scene.Ground ? scene.Ground.Field : null;
			var target = Array.isArray(point) ? {X: point[0], Z: point[1]} : {X: number(point.X, 0), Z: number(point.Z !== undefined ? point.Z : point.Y, 0)};
			var points;
			var lengths = [0];
			var i;

			if (!object || !walker || !field || !object.World) return false;

			points = field.Path({X: object.World[0], Z: object.World[2]}, target, {MaxSlope: number(walker.MaxSlope, 0.45), Step: field.Size / 160, Blocked: function (x, z) {
				return blocked(x, z, object);
			}});

			if (!points)
				return false;

			for (i = 1; i < points.length; i++)
				lengths.push(lengths[i - 1] + Math.sqrt(Math.pow(points[i].X - points[i - 1].X, 2) + Math.pow(points[i].Z - points[i - 1].Z, 2)));

			scene.Ways[id] = {Points: points, Lengths: lengths, Start: scene.Seconds, Speed: number(walker.Speed, 8), Callback: callback || null};

			return true;
		}

		/* Where a ray of a point of the canvas meets the ground: [x, z], or null. */
		function groundAt (x, y) {
			var field = scene.Ground.Field;
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var far = scene.Distance * 6 + field.Size;
			var step = far / 400;
			var t = 0;
			var low;
			var high;
			var point;
			var i;

			function above (at) {
				var p = vectors.Add(ray.Origin, vectors.Scale(ray.Direction, at));

				return p[1] - Math.max(0, field.Height(p[0], p[2]));
			}

			while (t < far && above(t) > 0)
				t += step;

			if (t >= far) return null;

			low = Math.max(0, t - step);
			high = t;

			for (i = 0; i < 12; i++) {
				if (above((low + high) / 2) > 0) low = (low + high) / 2;
				else high = (low + high) / 2;
			}

			point = vectors.Add(ray.Origin, vectors.Scale(ray.Direction, high));

			return [point[0], point[2]];
		}

		/* The view over the ground: round its point (or the object in focus), never under the ground; the keys move it. */
		function aimGround (elapsed) {
			var ground = scene.Ground;
			var field = ground.Field;
			var camera = scene.Camera;
			var focus = scene.Focus ? scene.Objects[scene.Focus] : null;
			var keys = ground.Keys;
			var forward = [-Math.sin(scene.Yaw), 0, -Math.cos(scene.Yaw)];
			var right = [Math.cos(scene.Yaw), 0, -Math.sin(scene.Yaw)];
			var speed = scene.Distance * 0.9 * elapsed;
			var view = self.View;
			var floor;

			if (scene.Driven) {
				ground.Target = scene.Driven.Target;
				scene.Distance = scene.Wanted = scene.Driven.Height;
				view = scene.Driven.View;
				keys = {};
			}

			if (!ground.Target)
				ground.Target = [0, Math.max(0, field.Height(0, 0)), 0];

			if (keys.ArrowUp || keys.KeyW)
				ground.Target = vectors.Add(ground.Target, vectors.Scale(forward, speed));

			if (keys.ArrowDown || keys.KeyS)
				ground.Target = vectors.Add(ground.Target, vectors.Scale(forward, -speed));

			if (keys.ArrowRight || keys.KeyD)
				ground.Target = vectors.Add(ground.Target, vectors.Scale(right, speed));

			if (keys.ArrowLeft || keys.KeyA)
				ground.Target = vectors.Add(ground.Target, vectors.Scale(right, -speed));

			if (focus && focus.World && keys.Follow !== false)
				ground.Target = vectors.Lerp(ground.Target, focus.World, 1 - Math.exp(-elapsed * 6));

			if (!scene.Driven) {
				ground.Target[0] = Math.max(-field.Size / 2, Math.min(field.Size / 2, ground.Target[0]));
				ground.Target[2] = Math.max(-field.Size / 2, Math.min(field.Size / 2, ground.Target[2]));
			}

			ground.Target[1] = Math.max(0, field.Height(ground.Target[0], ground.Target[2]));
			scene.Distance += (scene.Wanted - scene.Distance) * (1 - Math.exp(-elapsed * 9));
			scene.Pitch = Math.max(0.08, Math.min(1.5, scene.Pitch));

			/* In parallel rays the distance is the height of the view; the eye stands far enough to see all of it. */
			if (view) {
				parallel(view, ground, field);

				return;
			}

			camera.Ortho = 0;
			camera.Up = [0, 1, 0];

			camera.Orbit(ground.Target, scene.Yaw, scene.Pitch, scene.Distance);

			floor = Math.max(0, field.Height(camera.Position[0], camera.Position[2])) + 1.5;

			if (camera.Position[1] < floor)
				camera.Position[1] = floor;

			scene.Eye = camera.Position.slice();
			scene.Target = ground.Target.slice();
			camera.Near = Math.max(0.05, scene.Distance * 0.01);
			camera.Far = field.Size * 3 + scene.Distance * 4;
		}

		/* A ground in parallel rays: from above, or at the angle that makes a cell a rhombus of the given proportion. */
		function parallel (view, ground, field) {
			var camera = scene.Camera;
			var far = Math.max(field.Size * 3, scene.Distance * 4);

			scene.Yaw = view === 'top' ? 0 : Math.PI / 4;
			scene.Pitch = view === 'top' ? Math.PI / 2 : Math.asin(scene.Driven && scene.Driven.Slant || 0.5);

			camera.Ortho = scene.Distance;
			camera.Up = view === 'top' ? [0, 0, -1] : [0, 1, 0];

			camera.Orbit(ground.Target, scene.Yaw, scene.Pitch, far);

			scene.Eye = camera.Position.slice();
			scene.Target = ground.Target.slice();
			camera.Near = 1;
			camera.Far = far * 2;
		}

		/* The squares of the ground in view, the finer the nearer the eye; each made once, a few a frame. */
		function groundPatches () {
			var ground = scene.Ground;
			var field = ground.Field;
			var wanted = [];
			var built = 0;

			/* A map of cells is of one piece. */
			if (field.Whole) {
				if (!ground.Nodes.whole)
					ground.Nodes.whole = {Mesh: renderer.Mesh(field.Chunk()), Center: field.Center, Used: 0};

				ground.Nodes.whole.Used = ++ground.Frame;

				return [ground.Nodes.whole];
			}

			function visit (x, z, size, level) {
				var key = x.toFixed(3) + ':' + z.toFixed(3) + ':' + level;
				var near = vectors.Distance(scene.Eye, [x, Math.max(0, field.Height(x, z)), z]);
				var half = size / 2;

				if (level < 6 && near < size * 1.4) {
					visit(x - half / 2, z - half / 2, half, level + 1);
					visit(x + half / 2, z - half / 2, half, level + 1);
					visit(x - half / 2, z + half / 2, half, level + 1);
					visit(x + half / 2, z + half / 2, half, level + 1);

					return;
				}

				wanted.push({Key: key, X: x, Z: z, Size: size});
			}

			visit(0, 0, field.Size, 0);

			ground.Frame++;

			return wanted.map(function (want) {
				var node = ground.Nodes[want.Key];

				if (!node && built < 3) {
					node = ground.Nodes[want.Key] = {Mesh: renderer.Mesh(field.Chunk(want.X, want.Z, want.Size, 32)), Center: [want.X, 0, want.Z]};
					built++;
				}

				if (node)
					node.Used = ground.Frame;

				return node;
			}).filter(Boolean);
		}

		/* The water, over all else: it shows what was drawn before it, mirrored and through it. */
		function drawSea (matrix, posted) {
			var ground = scene.Ground;
			var field = ground.Field;
			var fog = scene.Camera.Ortho || posted ? 1e9 : field.Size * 0.9;
			var seen = posted ? engine.PostMiddle() : null;

			if (!field.Water) return;

			if (!gpu.Water)
				gpu.Water = renderer.Mesh(graphics.Plane({Width: 1, Depth: 1, Segments: 1}));

			renderer.Draw(gpu.Water, gpu.Sea, {uViewProjection: matrix, uModel: graphics.Compose(vectors.Subtract([0, 0, 0], scene.Eye), null, field.Size * 1.6), uSun: ground.Sun, uSunColor: ground.SunColor, uAir: [0.55, 0.72, 1, 0.95], uFog: fog, uSeen: seen ? seen.Color : gpu.NoBounce, uSeenDepth: seen ? seen.Depth : gpu.NoBounce, uMirror: seen ? 1 : 0}, {Blend: 'alpha', DepthWrite: false, Cull: 'none'});
		}

		/* The sky, the ground and its water, under the things that stand on it. */
		function drawGround (matrix, nodes, shade) {
			var ground = scene.Ground;
			var field = ground.Field;
			var air = [0.55, 0.72, 1, 0.95];
			var fog = scene.Camera.Ortho || self.Graphics().Post ? 1e9 : field.Size * 0.9;

			if (!scene.Camera.Ortho)
				renderer.Draw(gpu.Quad, gpu.Sky, {uInverse: graphics.Invert(matrix), uSun: ground.Sun, uSunColor: ground.SunColor, uAir: air, uUp: [0, 1, 0], uHigh: 0}, {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});

			nodes.forEach(function (node) {
				renderer.Draw(node.Mesh, gpu.Land, Object.assign({uViewProjection: matrix, uOffset: vectors.Subtract(node.Center, scene.Eye), uSun: ground.Sun, uSunColor: ground.SunColor, uAir: air, uFog: fog, uSkyLight: [0.3, 0.36, 0.46], uFloorLight: [0.1, 0.1, 0.09]}, shade), {Cull: 'back'});
			});

			Object.keys(ground.Nodes).forEach(function (key) {
				if (ground.Frame - (ground.Nodes[key].Used || 0) > 240) {
					ground.Nodes[key].Mesh.Destroy();

					delete ground.Nodes[key];
				}
			});
		}

		/*
		 * The surface of a body (Land): a frame of its own, its middle at the origin and its units kilometres, its ground
		 * of the noise of its baked surface (the Terrain Service) in squares of the faces of its cube, finer near the eye;
		 * its sky of its air, lit by its star. The eye stands on the ground at an altitude, turned by Yaw and Pitch.
		 */
		var terrain = self.$Service('Terrain');

		function land (id, options) {
			var object = scene.Objects[id];
			var settings = options || {};
			var surface = object ? trait(object, 'Surface') : null;
			var type = surface ? surface.Type : 'rocky';
			var up;
			var relief = {terran: 8, ocean: 6, desert: 7, rocky: 9, moon: 10, dwarf: 6, ice: 5, lava: 6};

			if (!object || !trait(object, 'Body') || type === 'gas' || type === 'ice-giant') return false;

			place(scene.Time);

			up = vectors.Normalize(settings.Latitude !== undefined ? toDirection(Number(settings.Latitude) || 0, Number(settings.Longitude) || 0) : vectors.Subtract(scene.Camera.Position, object.World));

			/* The direction in the frame of the body: its own turn taken away, so the ground under the eye stays. */
			up = graphics.Apply(graphics.Invert(object.Turn) || graphics.Identity(), up);

			scene.Surface = {
				ID: object.ID,
				Field: terrain.Sphere({Radius: object.Radius, Height: relief[type] || 6, Seed: object.Seed, Ocean: object.Look.Ocean, Type: type}),
				Nodes: {},
				Up: vectors.Normalize(up),
				Yaw: 0,
				Pitch: -1.3,
				Altitude: object.Radius * 1.4,
				Wanted: settings.Altitude === undefined ? 0.6 : Math.max(0.0015, Number(settings.Altitude)),
				Rising: false,
				Keys: {},
				Frame: 0
			};

			labels.hidden = true;
			self.Landed = object.ID;
			self.Card = null;

			self.$Emit('land', {ID: object.ID});

			return true;
		}

		function takeOff () {
			var surface = scene.Surface;
			if (!surface)
				return false;

			surface.Rising = true;
			surface.Wanted = surface.Field.Radius * 1.6;

			return true;
		}

		/* A direction of a latitude and a longitude (degrees), Y to the north. */
		function toDirection (latitude, longitude) {
			var lat = latitude * Math.PI / 180;
			var lon = longitude * Math.PI / 180;

			return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)];
		}

		/* The axes of the ground under the eye: up, north along the surface, east. */
		function ground (up) {
			var pole = Math.abs(up[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
			var east = vectors.Normalize(vectors.Cross(pole, up));
			var north = vectors.Cross(up, east);

			return {Up: up, East: east, North: north};
		}

		/* The eye on the surface: its place, where it looks, and a step of its altitude, its keys and its rising. */
		function surfaceStep (elapsed) {
			var surface = scene.Surface;
			var field = surface.Field;
			var axes;
			var forward;
			var heading;
			var speed;
			var move = [0, 0];
			var keys = surface.Keys;
			var eye;
			var look;

			surface.Altitude = Math.exp(Math.log(Math.max(0.0005, surface.Altitude)) + (Math.log(Math.max(0.0005, surface.Wanted)) - Math.log(Math.max(0.0005, surface.Altitude))) * (1 - Math.exp(-elapsed * (surface.Rising ? 1.6 : 1.2))));

			if (surface.Pitch < -0.2 && !surface.Rising && surface.Altitude < field.Radius * 0.2)
				surface.Pitch += (-0.2 - surface.Pitch) * (1 - Math.exp(-elapsed * 1.5));

			if (surface.Rising && surface.Altitude > field.Radius * 1.5) {
				leave();

				return;
			}

			axes = ground(surface.Up);
			heading = vectors.Add(vectors.Scale(axes.North, Math.cos(surface.Yaw)), vectors.Scale(axes.East, Math.sin(surface.Yaw)));

			if (keys.ArrowUp || keys.KeyW)
				move[0] += 1;

			if (keys.ArrowDown || keys.KeyS)
				move[0] -= 1;

			if (keys.ArrowRight || keys.KeyD)
				move[1] += 1;

			if (keys.ArrowLeft || keys.KeyA)
				move[1] -= 1;

			/* Walking or flying over the ground: the faster the higher, the way along the surface. */
			if (move[0] || move[1]) {
				speed = Math.max(0.004, surface.Altitude) * 0.8 * elapsed / field.Radius;
				forward = vectors.Add(vectors.Scale(heading, move[0]), vectors.Scale(vectors.Cross(heading, axes.Up), -move[1]));
				surface.Up = vectors.Normalize(vectors.Add(surface.Up, vectors.Scale(forward, speed)));
			}

			eye = vectors.Scale(surface.Up, field.Radius + field.Elevation(surface.Up) + surface.Altitude);

			look = vectors.Add(vectors.Scale(heading, Math.cos(surface.Pitch)), vectors.Scale(axes.Up, Math.sin(surface.Pitch)));
			surface.Eye = eye;
			surface.Look = look;
			surface.Axes = axes;
		}

		function leave () {
			var surface = scene.Surface;
			var object = surface ? scene.Objects[surface.ID] : null;

			Object.keys(surface.Nodes).forEach(function (key) {
				if (surface.Nodes[key].Mesh)
					surface.Nodes[key].Mesh.Destroy();
			});

			scene.Surface = null;
			labels.hidden = false;
			self.Landed = '';

			if (object)
				focusOn(object.ID, true);

			self.$Emit('takeoff', {ID: surface.ID});
		}

		/* The squares of the faces of the cube in view, the finer the nearer; each made once, a few a frame. */
		function patches () {
			var surface = scene.Surface;
			var field = surface.Field;
			var wanted = [];
			var horizon = Math.acos(Math.min(1, field.Radius / (field.Radius + Math.max(0.001, surface.Altitude) + field.Height)));
			var built = 0;
			var face;

			function visit (face, u, v, size, level) {
				var key = face + ':' + u.toFixed(6) + ':' + v.toFixed(6) + ':' + level;
				var direction = vectors.Normalize(terrain.Face(face, u, v));
				var middle = vectors.Scale(direction, field.Radius);
				var span = field.Radius * size * 0.75;
				var angle = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(direction, vectors.Normalize(surface.Eye)))));
				var near = vectors.Distance(middle, surface.Eye);
				var half = size / 2;

				/* Behind the horizon: not drawn. */
				if (angle - size * 0.9 > horizon + 0.05) return;

				if (level < 17 && near < span * 2.2) {
					visit(face, u - half / 2, v - half / 2, half, level + 1);
					visit(face, u + half / 2, v - half / 2, half, level + 1);
					visit(face, u - half / 2, v + half / 2, half, level + 1);
					visit(face, u + half / 2, v + half / 2, half, level + 1);

					return;
				}

				wanted.push({Key: key, Face: face, U: u, V: v, Size: size});
			}

			for (face = 0; face < 6; face++)
				visit(face, 0, 0, 2, 0);

			surface.Frame++;

			return wanted.map(function (want) {
				var node = surface.Nodes[want.Key];
				var made;

				if (!node && built < 4) {
					made = field.Patch(want.Face, want.U, want.V, want.Size, 24);
					node = surface.Nodes[want.Key] = {Mesh: renderer.Mesh(made.Geometry), Center: made.Center};
					built++;
				}

				if (node)
					node.Used = surface.Frame;

				return node;
			}).filter(Boolean);
		}

		/* Squares not drawn for a while are let go. */
		function forget () {
			var surface = scene.Surface;

			Object.keys(surface.Nodes).forEach(function (key) {
				if (surface.Frame - (surface.Nodes[key].Used || 0) > 240) {
					surface.Nodes[key].Mesh.Destroy();

					delete surface.Nodes[key];
				}
			});
		}

		function drawSurface () {
			var surface = scene.Surface;
			var object = scene.Objects[surface.ID];
			var field = surface.Field;
			var width = renderer.Width;
			var height = renderer.Height;
			var aspect = width / Math.max(1, height);
			var near = Math.max(0.0005, surface.Altitude * 0.25);
			var far = Math.max(50, Math.sqrt(surface.Altitude * (2 * field.Radius + surface.Altitude)) * 3 + field.Radius * 0.1);
			var view = graphics.LookAt([0, 0, 0], surface.Look, surface.Axes.Up);
			var projection = graphics.Perspective(scene.Camera.Fov, aspect, near, far);
			var matrix = graphics.Multiply(projection, view);
			var star = scene.Order.filter(function (each) {
				return trait(each, 'Star') && each.World;
			})[0];
			var sun = star && object.World ? graphics.Apply(graphics.Invert(object.Turn) || graphics.Identity(), vectors.Normalize(vectors.Subtract(star.World, object.World))) : [0, 1, 0];
			var sunColor = star ? paint(star.Color).slice(0, 3) : [1, 1, 1];
			var air = object.Look.Atmosphere;
			var nodes = patches();
			var thickness = 100;
			var shade = idle();
			var extent;
			var posted;

			sun = vectors.Normalize(sun);

			/* The shadows of the relief round the eye, while the sun is up. */
			if (shadowsWanted() && vectors.Dot(sun, surface.Up) > 0.03) {
				extent = Math.max(0.15, surface.Altitude * 4);

				shade = castShadow(sun, surface.Eye, surface.Eye, extent, Math.max(extent * 2, field.Height * 2), function (light) {
					nodes.forEach(function (node) {
						renderer.Draw(node.Mesh, gpu.GroundDepth, {uViewProjection: light, uOffset: vectors.Subtract(node.Center, surface.Eye)}, {Cull: 'back'});
					});
				});
			}

			posted = engine.PostBegin();

			renderer.Clear([0, 0, 0, 1]);

			if (self.Background && self.Background !== 'false')
				renderer.Draw(gpu.Stars, gpu.Far, {uViewProjection: graphics.Multiply(graphics.Perspective(scene.Camera.Fov, aspect, 0.1, 200), view), uRatio: renderer.Ratio}, {Depth: false, DepthWrite: false, Blend: 'add'});

			renderer.Draw(gpu.Quad, gpu.Sky, {uInverse: graphics.Invert(matrix), uSun: sun, uSunColor: sunColor, uAir: air, uUp: surface.Axes.Up, uHigh: Math.min(1, surface.Altitude / thickness)}, {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});

			nodes.forEach(function (node) {
				renderer.Draw(node.Mesh, gpu.Ground, Object.assign({
					uViewProjection: matrix,
					uOffset: vectors.Subtract(node.Center, surface.Eye),
					uCenter: node.Center,
					uSun: sun,
					uSunColor: sunColor,
					uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]),
					uWater: object.Look.Water,
					uIce: object.Look.Ice,
					uAir: air,
					uFog: Math.max(field.Radius * 0.02, far * 0.6),
					uHigh: Math.min(1, surface.Altitude / thickness)
				}, shade), {Cull: 'back'});
			});

			if (posted)
				engine.PostEnd({Matrix: matrix, Sun: sun, SunColor: sunColor, Sky: false});

			forget();
		}

		function frame (now, quiet) {
			/* The time of the game keeps to the clock on a slow machine too (up to a second, a page may have slept); what eases takes small steps. */
			var spent = scene.Last ? Math.min(1, (now - scene.Last) / 1000) : 0;
			var elapsed = Math.min(0.1, spent);

			scene.Last = now;

			/* On a surface the days go at their own speed (a day of two minutes by default), not at the one of the orbits. */
			if (!self.Paused)
				scene.Time += spent * (scene.Surface ? number(self.SurfaceSpeed, 1 / 120) : number(self.Speed, 1));

			if (!self.Paused)
				scene.Seconds += spent;

			groundOf();

			place(scene.Time);

			if (scene.Surface) {
				surfaceStep(elapsed);

				if (scene.Surface && !quiet && renderer && !renderer.Lost && scene.Width && scene.Height) {
					drawSurface();

					adapt(elapsed);

					scene.Painted++;
				}

				return;
			}

			if (scene.Ground) aimGround(elapsed);
			else aim(elapsed);

			if (!quiet && renderer && !renderer.Lost && scene.Width && scene.Height) {
				draw();

				adapt(elapsed);

				engine.PostTime(elapsed);

				scene.Painted++;
			}

			moveLabels();

			if (now - (scene.Themed || 0) > 1000) {
				scene.Themed = now;

				theme();
			}
		}

		/* The object under a point of the canvas: a part of one near enough to be seen as made of parts. */
		function pick (x, y) {
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var best = null;
			var nearest = Infinity;

			function test (object, least) {
				var t;

				if (!object.World || !(object.Size || least)) return;

				t = graphics.Hit(ray, object.World, Math.max(object.Size, pixels(object.World, least)));

				if (t >= 0 && t < nearest) {
					nearest = t;
					best = object;
				}
			}

			scene.Roots.forEach(function (object) {
				if (!trait(object, 'Selectable')) return;

				if (object.Parts.length && object.Size > pixels(object.World || [0, 0, 0], 80)) {
					object.Parts.forEach(function (part) {
						test(part, 0);
					});
				}
				else {
					test(object, trait(object, 'Model') || trait(object, 'Formation') ? 12 : 8);
				}
			});

			return best ? best.ID : '';
		}

		function localPoint (event) {
			var box = canvas.getBoundingClientRect();

			return {X: event.clientX - box.left, Y: event.clientY - box.top};
		}

		/* The numbers of an object for its card and for select. */
		function card (object) {
			var rows = [];
			var language = Elemenx.Locale.Language() || undefined;
			var t = function (key) {
				return Elemenx.Locale.Text('ui.gameScene.' + key);
			};
			var parent = parentOf(object);
			var info = describe(object.ID);
			var body = trait(object, 'Body');
			var orbit = trait(object, 'Orbit');
			var health = trait(object, 'Health');
			var formation = trait(object, 'Formation');
			var kind = object.Kind ? t('kinds.' + object.Kind) : '';

			function add (key, value, unit) {
				var text = typeof value === 'number' ? value.toLocaleString(language, {maximumFractionDigits: Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : 2}) : value;

				rows.push({Key: key, Label: t(key), Value: unit ? text + ' ' + unit : text});
			}

			if (trait(object, 'Star')) {
				add('class', info.Class);
				add('temperature', info.Temperature, 'K');
				add('mass', info.Mass, 'M☉');
				add('radius', info.Radius, 'R☉');
				add('luminosity', info.Luminosity, 'L☉');
			}
			else if (body) {
				add('radius', info.Radius, t('km'));
				add('mass', info.Mass, 'M⊕');
				add('gravity', info.Gravity, t('ms2'));
				add('temperature', info.Temperature, 'K');

				if (parent && parent.Radius) add('distance', astronomy.Length(orbit && orbit.Distance) / KM, t('km'));
				else add('distance', astronomy.Length(orbit && orbit.Distance), t('au'));

				add('period', info.Period, t('days'));
				add('day', number(body.Day, 24) ? number(body.Day, 24) : t('locked'), number(body.Day, 24) ? t('hours') : '');

				if (info.Habitable && (!parent || trait(parent, 'Star')))
					add('habitable', t('yes'));
			}
			else {
				add('at', parent ? parent.Name : '—');
			}

			if (object.Team)
				add('team', object.Team);

			if (health)
				add('health', number(object.Values.Health, number(health.Max, 0)) + ' / ' + number(health.Max, 0));

			if (formation) add('ships', object.Parts.length);
			else if (object.Parts.length && !body) add('parts', object.Parts.length);

			if (scene.Travels[object.ID])
				add('heading', scene.Objects[scene.Travels[object.ID].Target].Name);

			if (body && trait(object, 'Surface'))
				kind = t('surfaces.' + trait(object, 'Surface').Type);

			return {ID: object.ID, Name: object.Name, Kind: /^ui\.gameScene\./.test(kind) ? object.Kind : kind, Rows: rows, Land: !!(body && !/gas|giant/.test(trait(object, 'Surface') ? trait(object, 'Surface').Type : ''))};
		}

		function describe (id) {
			var object = scene.Objects[id];
			if (!object)
				return null;

			if (object.Star)
				return object.Star;

			if (object.Info)
				return Object.assign({}, object.Info);

			return {Kind: object.Kind, At: object.Parent || (object.Owner ? object.Owner.ID : ''), Team: object.Team, Parts: object.Parts.length};
		}

		function select (id, quiet) {
			var object = id ? scene.Objects[id] : null;

			scene.Selected = object ? object.ID : '';
			scene.Given.Selected = scene.Selected;
			self.Selected = scene.Selected;
			self.Card = object ? card(object) : null;
			self.Status = object ? object.Name + ', ' + self.Card.Kind : '';

			Object.keys(scene.Labels).forEach(function (key) {
				scene.Labels[key].setAttribute('aria-pressed', String(key === scene.Selected || object && object.Root && object.Root.ID === key));
			});

			if (!quiet)
				self.$Emit('select', {ID: scene.Selected, Object: object, Info: object ? describe(object.ID) : null});
		}

		/* The root an address names and the path of parts under it: gateway/dock is the part dock of gateway. */
		function rootOf (id) {
			var object = scene.Objects[id];

			return object ? object.Root || object : null;
		}

		/* The changes of the methods for one object: of a root its own, of a part those of its root, by the path of parts. */
		function overrideOf (id) {
			var object = scene.Objects[id];
			var root = rootOf(id);
			var path = [];
			var at = object;
			var target;
			var list;

			if (!root)
				return null;

			scene.Overrides[root.ID] = scene.Overrides[root.ID] || {};
			target = scene.Overrides[root.ID];

			while (at && at.Owner) {
				path.unshift(at.Part);

				at = at.Owner;
			}

			path.forEach(function (part) {
				target.Parts = target.Parts || [];
				list = target.Parts.filter(function (each) {
					return String(each.ID) === part;
				});

				if (!list.length) {
					list = [{ID: part}];

					target.Parts.push(list[0]);
				}

				target = list[0];
			});

			return target;
		}

		/* What the template declares inside the scene. */
		engine.Props = function () {
			var givenProps = scene.Given;

			if (self.System !== givenProps.System || String(self.Seed) !== givenProps.Seed || self.Scale !== givenProps.Scale) {
				givenProps.System = self.System;
				givenProps.Seed = String(self.Seed);
				givenProps.Scale = self.Scale;

				compose();

				if (!scene.Focus)
					focusOn('', true);
			}

			if (number(self.Time, 0) !== givenProps.Time) {
				givenProps.Time = number(self.Time, 0);
				scene.Time = givenProps.Time;
			}

			if ((self.Focus || '') !== givenProps.Focus) {
				givenProps.Focus = self.Focus || '';

				focusOn(givenProps.Focus, true);
			}

			if ((self.Selected || '') !== givenProps.Selected) {
				givenProps.Selected = self.Selected || '';

				select(givenProps.Selected, true);
			}
		};

		engine.Compose = compose;
		engine.Paint = paint;
		engine.Place = place;
		engine.Frame = frame;
		engine.Pick = pick;
		engine.Local = localPoint;
		engine.Select = select;
		engine.FocusOn = focusOn;
		engine.Describe = describe;
		engine.Renderer = renderer;
		engine.Card = card;
		engine.OverrideOf = overrideOf;
		engine.RootOf = rootOf;
		engine.Context = {Scene: self, Graphics: graphics, Renderer: renderer, Objects: function () {
			return scene.Objects;
		}, Eye: function () {
			return scene.Eye;
		}, Time: function () {
			return scene.Time;
		}};

		engine.Move = function (id, target, callback) {
			var object = scene.Objects[id];
			var goal = typeof target === 'string' ? scene.Objects[target] : null;
			var distance;

			/* A walker of a ground: to a point ([x, y] or {X, Y}), or to an object. */
			if (object && trait(object, 'Walker') && scene.Ground) {
				if (goal && goal.World)
					return walk(id, [goal.World[0], goal.World[2]], callback);

				return target && typeof target === 'object' ? walk(id, target, callback) : false;
			}

			if (!object || !trait(object, 'Mover') || !goal || goal.ID === object.Parent && !scene.Travels[id]) return false;

			place(scene.Time);

			distance = vectors.Distance(object.Position || [0, 0, 0], goal.Position || [0, 0, 0]);
			scene.Travels[id] = {From: object.World.slice(), Position: (object.Position || [0, 0, 0]).slice(), Start: scene.Time, Duration: Math.max(0.2, distance / Math.max(0.0001, number(trait(object, 'Mover').Speed, 0.25))), Target: goal.ID, Callback: callback || null};

			return true;
		};

		engine.Land = land;
		engine.Known = known;
		engine.Surface = surface;

		/*
		 * What leads the scene from outside (a map of cells): a ground of cells to draw and its view, {Key, Field, View, Slant,
		 * Target, Height, Elevation}, given again when any of it changes; each object is put where it stands with Stand.
		 */
		engine.Drive = function (given) {
			scene.Driven = given;
		};

		engine.Stand = function (id, state) {
			var object = scene.Objects[id];
			if (!object) return;

			/* What stands still is in a buffer: seen or hidden, it is drawn again. */
			if (!!state.Hidden !== !!object.Hidden || object.Values.X !== state.X || object.Values.Y !== state.Y)
				scene.Settled = scene.Settled && scene.Still.indexOf(object) !== -1 ? '' : scene.Settled;

			object.Values.X = state.X;
			object.Values.Y = state.Y;
			object.Heading = state.Heading || object.Heading;
			object.Walking = state.Walking || 0;
			object.Hidden = !!state.Hidden;
		};

		/* A clip of an object: one that ends calls back and goes back to what the object was doing, a loop stays. */
		engine.Play = function (id, name, callback) {
			var object = scene.Objects[id];
			var settings = object ? trait(object, 'Model') : null;
			var made = settings && settings.Shape ? modelOf(object, settings) : null;
			var clip = made ? made.Clips[name] : null;
			var state;

			if (!clip)
				return false;

			state = object.Clip;

			if (clip.Loop) {
				object.Loop = name;

				if (state)
					state.Once = false;

				return true;
			}

			object.Clip = {Name: name, Start: scene.Seconds, Rate: 1, From: state ? state.Name : '', FromTime: state ? (scene.Seconds - state.Start) * state.Rate : 0, Once: true, Callback: callback || null};

			return true;
		};
		engine.Walk = walk;
		engine.GroundAt = function (x, y) {
			return scene.Ground ? groundAt(x, y) : null;
		};
		engine.TakeOff = takeOff;

		engine.ToScreen = function (id) {
			var object = scene.Objects[id];
			var spot;

			if (!object || !object.World) return null;

			spot = scene.Camera.Project(object.World, scene.Width, scene.Height);

			return {X: spot.X, Y: spot.Y, Visible: spot.Visible};
		};

		build();

		scene.Watcher = new MutationObserver(declarations);

		scene.Watcher.observe(element.querySelector('.elemenx-game-scene-sources'), {subtree: true, childList: true, attributes: true, attributeFilter: ['data-value']});

		if (typeof view.ResizeObserver === 'function') {
			scene.Sizes = new view.ResizeObserver(resize);

			scene.Sizes.observe(element);
		}

		scene.Given = {System: this.System, Seed: String(this.Seed), Scale: this.Scale, Time: number(this.Time, 0), Focus: this.Focus || '', Selected: this.Selected || ''};

		declarations();

		compose();

		resize();

		place(scene.Time);

		scene.Focus = this.Focus || '';
		scene.Wanted = scene.Focus && scene.Objects[scene.Focus] ? closeness(scene.Objects[scene.Focus]) : extent() * 1.6;
		scene.Distance = scene.Wanted;
		scene.From = scene.Focus && scene.Objects[scene.Focus] && scene.Objects[scene.Focus].World ? scene.Objects[scene.Focus].World.slice() : [0, 0, 0];

		if (this.Selected)
			select(this.Selected, true);

		/* A scene out of view goes on but draws nothing, and an expensive frame leaves the page as much time after it. */
		scene.Seen = true;

		if (typeof view.IntersectionObserver === 'function') {
			scene.Sight = new view.IntersectionObserver(function (entries) {
				scene.Seen = entries[entries.length - 1].isIntersecting;
			});

			scene.Sight.observe(element);
		}

		scene.Loop = this.$Service('GameLoop').Create({Window: view, Render: function () {
			var now = view.performance ? view.performance.now() : Date.now();
			var ended;

			if (!scene.Seen || now < scene.Rest) {
				frame(now, true);

				return;
			}

			frame(now);

			ended = view.performance ? view.performance.now() : Date.now();
			scene.Rest = ended - now > 24 ? ended + Math.min(1000, ended - now) : 0;
		}});

		scene.Loop.Start();

		if (!renderer)
			this.Unsupported = true;

		this.StrategyStart();

		if (renderer) {
			this.ScatterStart();
			this.LightingStart();
		}

		window.setTimeout(function () {
			resize();

			if (!renderer)
				self.$Emit('error', {Reason: 'webgl2'});

			self.$Emit('ready', self);
		}, 0);
	},

	$OnDestroy: function () {
		var scene = this.Scene ? this.Scene() : null;
		var renderer = this.Engine ? this.Engine().Renderer : null;

		if (!scene || !scene.Loop) return;

		this.StrategyStop();

		scene.Loop.Stop();
		scene.Watcher.disconnect();

		if (scene.Sight)
			scene.Sight.disconnect();

		if (scene.Sizes)
			scene.Sizes.disconnect();

		if (renderer)
			renderer.Destroy();
	},

	/* Pointers: a drag turns the view, two fingers zoom, a press selects. */
	PointerDown: function (event) {
		var scene = this.Scene();
		var point = this.Engine().Local(event);
		var pointers = scene.Pointers;
		var ids;

		event.preventDefault();

		this.$Element().focus({preventScroll: true});

		if (event.target.setPointerCapture)
			event.target.setPointerCapture(event.pointerId);

		pointers[event.pointerId] = point;
		ids = Object.keys(pointers);

		if (ids.length === 2) {
			scene.Drag = null;
			scene.Pinch = {Distance: Math.max(1, Math.sqrt(Math.pow(pointers[ids[0]].X - pointers[ids[1]].X, 2) + Math.pow(pointers[ids[0]].Y - pointers[ids[1]].Y, 2))), Wanted: scene.Wanted};

			return;
		}

		scene.Drag = {X: point.X, Y: point.Y, Yaw: scene.Surface ? scene.Surface.Yaw : scene.Yaw, Pitch: scene.Surface ? scene.Surface.Pitch : scene.Pitch, Moved: false, Button: event.button};
	},

	PointerMove: function (event) {
		var scene = this.Scene();
		var point = this.Engine().Local(event);
		var pointers = scene.Pointers;
		var drag = scene.Drag;
		var ids;
		var distance;

		if (pointers[event.pointerId])
			pointers[event.pointerId] = point;

		ids = Object.keys(pointers);

		if (scene.Pinch && ids.length === 2) {
			distance = Math.max(1, Math.sqrt(Math.pow(pointers[ids[0]].X - pointers[ids[1]].X, 2) + Math.pow(pointers[ids[0]].Y - pointers[ids[1]].Y, 2)));

			this.ZoomTo(scene.Pinch.Wanted * scene.Pinch.Distance / distance, true);

			return;
		}

		if (!drag) return;

		if (Math.abs(point.X - drag.X) + Math.abs(point.Y - drag.Y) > 4)
			drag.Moved = true;

		if (!drag.Moved) return;

		this.Dragging = true;

		/* On the ground the eye looks round: right to turn right, up to look up. */
		if (scene.Surface) {
			scene.Surface.Yaw = drag.Yaw + (point.X - drag.X) * 0.004;
			scene.Surface.Pitch = Math.max(-1.55, Math.min(1.4, drag.Pitch - (point.Y - drag.Y) * 0.004));

			return;
		}

		scene.Yaw = drag.Yaw - (point.X - drag.X) * 0.006;
		scene.Pitch = Math.max(-1.5, Math.min(1.5, drag.Pitch + (point.Y - drag.Y) * 0.006));
	},

	PointerUp: function (event) {
		var scene = this.Scene();
		var drag = scene.Drag;
		var point = this.Engine().Local(event);

		delete scene.Pointers[event.pointerId];

		if (scene.Pinch) {
			if (!Object.keys(scene.Pointers).length)
				scene.Pinch = null;

			return;
		}

		scene.Drag = null;
		this.Dragging = false;

		if (drag && !drag.Moved && !scene.Surface && drag.Button === 2 && scene.Ground) this.OrderAt(point);
		else if (drag && !drag.Moved && !scene.Surface) this.Engine().Select(this.Engine().Pick(point.X, point.Y));
	},

	PointerCancel: function (event) {
		delete this.Scene().Pointers[event.pointerId];

		this.Scene().Drag = null;
		this.Scene().Pinch = null;
		this.Dragging = false;
	},

	Menu: function (event) {
		event.preventDefault();
	},

	/* A right press on a ground: the selected walker goes there. */
	OrderAt: function (point) {
		var scene = this.Scene();
		var at = this.Engine().GroundAt(point.X, point.Y);
		var walker = scene.Selected ? scene.Objects[scene.Selected] : null;
		if (!at || !walker || !walker.Traits.Walker) return;

		this.Move(walker.ID, at);
	},

	/* The distance of the view, kept between near the object in focus and far beyond the scene. */
	ZoomTo: function (wanted, exact) {
		var scene = this.Scene();
		var focus = scene.Focus ? scene.Objects[scene.Focus] : null;
		var least = scene.Ground ? 4 : focus && focus.Size ? focus.Size * 1.4 : 0.05;
		var most = scene.Ground ? scene.Ground.Field.Size * 1.2 : this.Reach();

		scene.Wanted = Math.max(least, Math.min(most, wanted));

		if (exact)
			scene.Distance = scene.Wanted;
	},

	/* The farthest the view goes: four times the scene. */
	Reach: function () {
		var far = 40;

		this.Scene().Roots.forEach(function (object) {
			if (object.Relative)
				far = Math.max(far, Math.sqrt(object.Relative[0] * object.Relative[0] + object.Relative[1] * object.Relative[1] + object.Relative[2] * object.Relative[2]) * 4);
		});

		return far;
	},

	Wheel: function (event) {
		var amount = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
		var surface = this.Scene().Surface;

		event.preventDefault();

		/* On the ground the wheel is the altitude: down to the height of an eye, up to where the air ends. */
		if (surface) {
			if (!surface.Rising)
				surface.Wanted = Math.max(0.0015, Math.min(surface.Field.Radius, surface.Wanted * Math.exp(amount * 0.0015)));

			return;
		}

		this.ZoomTo(this.Scene().Wanted * Math.exp(amount * 0.0012));
	},

	Double: function (event) {
		var engine = this.Engine();
		var point = engine.Local(event);
		var id = engine.Pick(point.X, point.Y);
		if (id)
			this.FocusOn(id);
	},

	LabelPressed: function (event) {
		var button = event.target.closest ? event.target.closest('[data-id]') : null;
		if (button)
			this.Engine().Select(button.getAttribute('data-id'));
	},

	LabelDouble: function (event) {
		var button = event.target.closest ? event.target.closest('[data-id]') : null;
		if (button)
			this.FocusOn(button.getAttribute('data-id'));
	},

	Key: function (event) {
		if (this.Cells) {
			this.MarksKey(event);

			return;
		}

		var scene = this.Scene();

		/* Over a map: the keys move the view (the arrows, WASD), + and - zoom, Escape lets the object in focus go. */
		if (scene.Ground && !scene.Surface) {
			if (event.key === '+' || event.key === '=') this.ZoomTo(scene.Wanted / 1.25);
			else if (event.key === '-' || event.key === '_') this.ZoomTo(scene.Wanted * 1.25);
			else if (event.key === 'Escape') this.FocusOn('');
			else scene.Ground.Keys[event.code] = true;

			if (/^(Arrow|Key[WASD])/.test(event.code))
				event.preventDefault();

			return;
		}

		/* On the ground: the keys walk (the arrows, WASD), Escape takes off. */
		if (scene.Surface) {
			if (event.key === 'Escape') this.TakeOff();
			else scene.Surface.Keys[event.code] = true;

			if (/^(Arrow|Key[WASD])/.test(event.code) || event.key === 'Escape')
				event.preventDefault();

			return;
		}

		var focus = scene.Focus ? scene.Objects[scene.Focus] : null;
		var parent = focus ? focus.Owner || (focus.Parent ? scene.Objects[focus.Parent] : null) : null;
		var handled = true;

		if (event.target !== this.$Element() && event.key !== 'Escape') return;

		if (event.key === 'ArrowLeft') scene.Yaw += 0.08;
		else if (event.key === 'ArrowRight') scene.Yaw -= 0.08;
		else if (event.key === 'ArrowUp') scene.Pitch = Math.min(1.5, scene.Pitch + 0.06);
		else if (event.key === 'ArrowDown') scene.Pitch = Math.max(-1.5, scene.Pitch - 0.06);
		else if (event.key === '+' || event.key === '=') this.ZoomTo(scene.Wanted / 1.25);
		else if (event.key === '-' || event.key === '_') this.ZoomTo(scene.Wanted * 1.25);
		else if (event.key === 'Enter' && scene.Selected) this.FocusOn(scene.Selected);
		else if (event.key === ' ') this.Paused = !this.Paused;
		else if (event.key === 'Escape' && focus) this.FocusOn(parent && (parent.Owner || parent.Parent) ? parent.ID : '');
		else handled = false;

		if (handled)
			event.preventDefault();
	},

	KeyUp: function (event) {
		if (this.Cells) {
			this.MarksKeyUp(event);

			return;
		}

		var scene = this.Scene();
		if (scene.Surface)
			delete scene.Surface.Keys[event.code];

		if (scene.Ground)
			delete scene.Ground.Keys[event.code];
	},

	Blurred: function () {
		if (this.Cells) {
			this.MarksBlurred();

			return;
		}

		var scene = this.Scene();
		if (scene.Surface)
			scene.Surface.Keys = {};

		if (scene.Ground)
			scene.Ground.Keys = {};
	},

	Unselect: function () {
		this.Select('');
	},

	LandSelected: function () {
		if (this.Scene().Selected)
			this.Land(this.Scene().Selected);
	},

	FocusSelected: function () {
		if (this.Scene().Selected)
			this.FocusOn(this.Scene().Selected);
	},

	/* The methods of the scene. */
	Add: function (kind, props) {
		var self = this;
		var spec = kind && typeof kind === 'object' ? kind : Object.assign({}, props || {}, {Kind: kind});

		/* A list at once: the scene is made again once. */
		if (Array.isArray(kind)) {
			kind.forEach(function (each) {
				self.Include(each);
			});

			this.Engine().Compose();

			return kind.map(function (each) {
				return each.ID;
			});
		}

		this.Include(spec);

		this.Engine().Compose();

		return spec.ID;
	},

	Include: function (spec) {
		var scene = this.Scene();
		var values = {};

		spec.ID = spec.ID ? String(spec.ID) : (spec.Kind || 'object') + '-' + Math.random().toString(36).slice(2, 8);

		Object.keys(spec).forEach(function (key) {
			if (['ID', 'Kind', 'Parent', 'Values', 'Traits', 'Parts', 'Children'].indexOf(key) === -1)
				values[key] = spec[key];
		});

		delete scene.Removed[spec.ID];

		scene.Added.push({ID: spec.ID, Kind: spec.Kind || '', Parent: spec.Parent, Values: Object.assign({}, spec.Values || {}, values), Traits: spec.Traits || {}, Parts: spec.Parts || []});
	},

	/* Changes the fields of an object (or of a part): each to its trait by its name in any case, {Traits} as they are. */
	Change: function (id, changes) {
		var scene = this.Scene();
		var object = scene.Objects[id];
		var kinds = this.$Service('Kinds');
		var target = this.Engine().OverrideOf(id);
		if (!object || !target) return false;

		Object.keys(changes || {}).forEach(function (key) {
			var field = key === 'Traits' ? null : kinds.Field(object, key);

			if (key === 'Traits') {
				target.Traits = kinds.MergeTraits(target.Traits || {}, changes.Traits);
			}
			else if (key === 'Parent') {
				target.Parent = changes.Parent;
			}
			else if (field && field.Trait) {
				target.Traits = target.Traits || {};
				target.Traits[field.Trait] = Object.assign(target.Traits[field.Trait] || {}, {});
				target.Traits[field.Trait][field.Name] = changes[key];
			}
			else if (object.Owner) {
				target[field ? field.Name : key] = changes[key];
			}
			else {
				target.Values = target.Values || {};
				target.Values[field ? field.Name : key] = changes[key];
			}
		});

		this.Engine().Compose();

		if (scene.Selected === id)
			this.Engine().Select(id, true);

		return true;
	},

	/* Removes an object, or a part of one (the part of its root is taken away). */
	Remove: function (id) {
		var scene = this.Scene();
		var object = scene.Objects[id];
		var target;

		if (!object)
			return false;

		if (object.Owner) {
			target = this.Engine().OverrideOf(id);
			target.Removed = true;
		}
		else {
			scene.Removed[id] = true;
		}

		this.Engine().Compose();

		return true;
	},

	/* Makes an object (or a new one of a spec) a part of another, placed in it: what it was elsewhere it is no more. */
	Attach: function (parent, object, place) {
		var scene = this.Scene();
		var owner = scene.Objects[parent];
		var kinds = this.$Service('Kinds');
		var existing = typeof object === 'string' ? scene.Objects[object] : null;
		var spec = existing ? kinds.Diff(existing) : object;
		var target;
		var part;

		if (!owner || !spec) return false;

		target = this.Engine().OverrideOf(owner.ID);
		/* A part is written flat, its fields beside its ID, as the parts of a kind are. */
		part = Object.assign({}, spec.Values || {}, place ? {Position: place} : {}, {ID: String(existing ? existing.Part || existing.ID : spec.ID || 'part-' + owner.Parts.length), Traits: spec.Traits || {}, Parts: spec.Parts || []});

		if (spec.Kind)
			part.Kind = spec.Kind;

		target.Parts = (target.Parts || []).concat([part]);

		if (existing && existing.Owner) this.Engine().OverrideOf(existing.ID).Removed = true;
		else if (existing) scene.Removed[existing.ID] = true;

		this.Engine().Compose();

		return owner.ID + '/' + part.ID;
	},

	/* A part taken out of its object: an object of its own from now, where its object is. */
	Detach: function (id) {
		var scene = this.Scene();
		var part = scene.Objects[id];
		var kinds = this.$Service('Kinds');
		var root;
		var saved;
		var made;

		if (!part || !part.Owner) return '';

		root = part.Root || part.Owner;
		saved = kinds.Diff(part);
		made = String(part.Part) + '-' + Math.random().toString(36).slice(2, 6);

		this.Engine().OverrideOf(id).Removed = true;

		scene.Added.push({ID: made, Kind: part.Kind, Parent: root.Parent || root.ID, Values: Object.assign({}, part.Values, saved.Values || {}), Traits: kinds.MergeTraits(part.Traits, {}), Parts: []});

		this.Engine().Compose();

		return made;
	},

	Get: function (id) {
		var item = this.Cells ? this.World().Objects[String(id)] : null;
		if (item)
			return this.Strategy().Outward(item);

		return this.Scene().Objects[id] || null;
	},

	Objects: function (filter) {
		var world = this.World();
		var strategy = this.Strategy();

		if (this.Cells) {
			return world.Order.map(function (id) {
				return strategy.Outward(world.Objects[id]);
			}).filter(function (item) {
				return typeof filter !== 'function' || !!filter(item);
			});
		}

		return this.Scene().Order.filter(function (object) {
			if (typeof filter === 'function') return filter(object);

			if (typeof filter === 'string')
				return object.Kind === filter || !!(object.Traits && object.Traits[filter]);

			return !object.Owner;
		});
	},

	Describe: function (id) {
		return this.Engine().Describe(id);
	},

	Position: function (id) {
		var object = this.Scene().Objects[id];

		this.Engine().Place(this.Scene().Time);

		return object && object.Position ? [object.Position[0], object.Position[1], object.Position[2]] : null;
	},

	/* An object, or several on a map. */
	Select: function (id) {
		if (this.Cells) {
			this.Strategy().Select(Array.isArray(id) ? id : id ? [id] : []);

			return;
		}

		this.Engine().Select(Array.isArray(id) ? id[0] || '' : id || '');
	},

	Selection: function () {
		var selected = this.Scene().Selected;

		if (this.Cells)
			return this.World().Selection.slice();

		return selected ? [selected] : [];
	},

	FocusOn: function (id) {
		return this.Engine().FocusOn(id || '');
	},

	Move: function (id, target, callback) {
		if (this.Cells)
			return this.Order(Array.isArray(id) ? id : [id], target);

		return this.Engine().Move(id, target, callback);
	},

	/* A clip of a model (Models): idle, walk, attack, die... */
	Play: function (id, clip, callback) {
		return this.Engine().Play(id, clip, callback);
	},

	Now: function () {
		return this.Scene().Time;
	},

	SetTime: function (days) {
		this.Scene().Time = Number(days) || 0;

		this.Engine().Place(this.Scene().Time);
	},

	/* Where an object is on the canvas, or a point of a map (x and y) on the page. */
	ToScreen: function (id, y) {
		var box;
		var point;

		if (typeof id === 'number') {
			box = this.$Element().querySelector('.elemenx-game-scene-marks').getBoundingClientRect();
			point = this.Strategy().ToScreen(id, y);

			return {X: point.X + box.left, Y: point.Y + box.top};
		}

		this.Engine().Place(this.Scene().Time);

		return this.Engine().ToScreen(id);
	},

	Pick: function (clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-game-scene-canvas').getBoundingClientRect();

		return this.Engine().Pick(clientX - box.left, clientY - box.top);
	},

	/* A saved game: each object as its kind and what differs from it, with what it goes round, the time and the journeys. */
	Save: function () {
		var scene = this.Scene();
		var kinds = this.$Service('Kinds');

		return {
			Time: scene.Time,
			Objects: scene.Roots.map(function (object) {
				return Object.assign(kinds.Diff(object), {Parent: object.Parent || ''});
			}),
			Travels: Object.keys(scene.Travels).map(function (id) {
				var travel = scene.Travels[id];

				return {ID: id, Target: travel.Target, Start: travel.Start, Duration: travel.Duration, From: travel.From, Position: travel.Position};
			})
		};
	},

	/* A saved game shown again: its objects alone, at its time; or a map (its JSON or its URL), called back when it came. */
	Load: function (saved, callback) {
		var scene = this.Scene();
		var kinds = this.$Service('Kinds');

		if (!saved || typeof saved === 'string' || saved.Width !== undefined || saved.width !== undefined || saved.tiledversion) {
			this.World().Given = saved;

			this.Strategy().Load(saved, callback);

			return;
		}

		scene.Loaded = (saved && saved.Objects || []).map(function (each) {
			return {ID: each.ID, Parent: each.Parent, Restored: kinds.Restore(each)};
		});
		scene.Added = [];
		scene.Removed = {};
		scene.Overrides = {};
		scene.Travels = {};
		scene.Time = Number(saved && saved.Time) || 0;

		(saved && saved.Travels || []).forEach(function (travel) {
			scene.Travels[travel.ID] = {Target: travel.Target, Start: travel.Start, Duration: travel.Duration, From: travel.From, Position: travel.Position, Callback: null};
		});

		this.Engine().Compose();
		this.Engine().Place(scene.Time);
	},

	Supported: function () {
		return !!this.Engine().Renderer;
	},

	/* Down to the surface of a body (not of a giant of gas): at a latitude and a longitude, or under the eye. */
	Land: function (id, options) {
		return this.Engine().Land(id, options);
	},

	TakeOff: function () {
		return this.Engine().TakeOff();
	},

	/* Where the eye is on the surface, or null in space: {ID, Latitude, Longitude, Altitude}. */
	Surface: function () {
		var surface = this.Scene().Surface;
		var up;

		if (!surface) return null;

		up = surface.Up;

		return {ID: surface.ID, Latitude: Math.asin(Math.max(-1, Math.min(1, up[1]))) * 180 / Math.PI, Longitude: Math.atan2(-up[2], up[0]) * 180 / Math.PI, Altitude: surface.Altitude};
	},

	/* The shaders: lit things, copies, faces to the view, lines, far stars; the surfaces of bodies baked and lit. */
	Shaders: function (graphics) {
		var head = '#version 300 es\nprecision highp float;\n';

		return {
			Lit: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				'in vec3 aColor;',
				'uniform mat4 uModel;',
				'uniform mat4 uViewProjection;',
				'uniform mat3 uNormalMatrix;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vLocal;',
				'out vec2 vUV;',
				'out vec3 vColor;',
				'void main() {',
				'	vec4 world = uModel * vec4(aPosition, 1.0);',
				'	vWorld = world.xyz;',
				'	vNormal = normalize(uNormalMatrix * aNormal);',
				'	vLocal = aPosition;',
				'	vUV = aUV;',
				'	vColor = aColor;',
				'	gl_Position = uViewProjection * world;',
				'}'
			].join('\n'),

			Instanced: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'in vec2 aUV;',
				'in vec4 aInstance;',
				'in vec4 aInstance2;',
				'in vec4 aInstance3;',
				'in vec4 aInstance4;',
				'in vec4 aInstance5;',
				'uniform mat4 uViewProjection;',
				'uniform float uWind;',
				'uniform vec3 uOrigin;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vLocal;',
				'out vec2 vUV;',
				'out vec3 vColor;',
				'out vec3 vTint;',
				'void main() {',
				'	mat3 basis = mat3(aInstance2.xyz, aInstance3.xyz, aInstance4.xyz);',
				'	vec3 world = aInstance.xyz + uOrigin + basis * aPosition;',
				'	float bend = aInstance.w * aPosition.y * aPosition.y * length(aInstance3.xyz) * 0.035;',
				'	world.xz += vec2(sin(uWind * 1.3 + aInstance5.a), cos(uWind * 0.9 + aInstance5.a * 1.7)) * bend;',
				'	vWorld = world;',
				'	vNormal = normalize(mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz)) * aNormal);',
				'	vLocal = aPosition;',
				'	vUV = aUV;',
				'	vColor = aColor * aInstance5.rgb;',
				'	vTint = aInstance5.rgb;',
				'	gl_Position = uViewProjection * vec4(world, 1.0);',
				'}'
			].join('\n'),

			/* A copy of a model with a skeleton: its joints are read from a texture of frames, at the frame of the copy. */
			Skinned: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				'in vec4 aJoints;',
				'in vec4 aWeights;',
				'in vec4 aInstance;',
				'in vec4 aInstance2;',
				'in vec4 aInstance3;',
				'in vec4 aInstance4;',
				'in vec4 aInstance5;',
				'in vec4 aFrames;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				'uniform sampler2D uPalette;',
				'uniform float uJointOffset;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vLocal;',
				'out vec2 vUV;',
				'out vec3 vColor;',
				'out vec3 vTint;',
				'mat4 joint(float index, float frame) {',
				'	ivec2 at = ivec2((int(index + 0.5) + int(uJointOffset)) * 3, int(frame + 0.5));',
				'	vec4 a = texelFetch(uPalette, at, 0);',
				'	vec4 b = texelFetch(uPalette, at + ivec2(1, 0), 0);',
				'	vec4 c = texelFetch(uPalette, at + ivec2(2, 0), 0);',
				'	return mat4(a.x, b.x, c.x, 0.0, a.y, b.y, c.y, 0.0, a.z, b.z, c.z, 0.0, a.w, b.w, c.w, 1.0);',
				'}',
				'mat4 skin(float frame) {',
				'	return joint(aJoints.x, frame) * aWeights.x + joint(aJoints.y, frame) * aWeights.y + joint(aJoints.z, frame) * aWeights.z + joint(aJoints.w, frame) * aWeights.w;',
				'}',
				'void main() {',
				'	mat4 moved = skin(aFrames.x);',
				'	if (aFrames.z > 0.001) moved = moved * (1.0 - aFrames.z) + skin(aFrames.y) * aFrames.z;',
				'	mat3 basis = mat3(aInstance2.xyz, aInstance3.xyz, aInstance4.xyz);',
				'	vec3 world = aInstance.xyz + uOrigin + basis * (moved * vec4(aPosition, 1.0)).xyz;',
				'	vWorld = world;',
				'	vNormal = normalize(mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz)) * mat3(moved) * aNormal);',
				'	vLocal = aPosition;',
				'	vUV = aUV;',
				'	vColor = aInstance5.rgb;',
				'	vTint = aInstance5.rgb;',
				'	gl_Position = uViewProjection * vec4(world, 1.0);',
				'}'
			].join('\n'),

			/* The surface of a material of glTF: metal and roughness by GGX, its maps, and the light of the scene. */
			Pbr: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec2 vUV;',
				'in vec3 vTint;',
				'uniform vec3 uCamera;',
				'uniform vec4 uBaseColor;',
				'uniform float uMetallic;',
				'uniform float uRoughness;',
				'uniform vec3 uEmissive;',
				'uniform float uCutoff;',
				'uniform float uUnlit;',
				'uniform float uNormalScale;',
				'uniform float uOcclusion;',
				'uniform float uSpecularLevel;',
				'uniform vec3 uSpecularColor;',
				'uniform float uSpecularOn;',
				'uniform float uSoftness;',
				'uniform sampler2D uSpecularMap;',
				'uniform sampler2D uColorMap;',
				'uniform sampler2D uNormalMap;',
				'uniform sampler2D uMetalMap;',
				'uniform sampler2D uOcclusionMap;',
				'uniform sampler2D uEmissiveMap;',
				'out vec4 outColor;',
				graphics.Chunks.Lights,
				graphics.Chunks.Shadow,
				'vec3 bump(vec3 n, vec3 v) {',
				'	vec3 m = texture(uNormalMap, vUV).xyz * 2.0 - 1.0;',
				'	m.xy *= uNormalScale;',
				'	m.y = -m.y;',
				'	vec3 dpx = dFdx(vWorld);',
				'	vec3 dpy = dFdy(vWorld);',
				'	vec2 dtx = dFdx(vUV);',
				'	vec2 dty = dFdy(vUV);',
				'	vec3 side = cross(dpy, n);',
				'	vec3 over = cross(n, dpx);',
				'	vec3 t = side * dtx.x + over * dty.x;',
				'	vec3 b = side * dtx.y + over * dty.y;',
				'	float scale = max(length(t), length(b));',
				'	if (scale < 1e-8) return n;',
				'	return normalize(mat3(t / scale, b / scale, n) * m);',
				'}',
				'float ggx(float nh, float a) {',
				'	float d = nh * nh * (a * a - 1.0) + 1.0;',
				'	return a * a / (3.14159265 * d * d);',
				'}',
				'float smith(float nv, float nl, float a) {',
				'	float k = (a + 1.0) * (a + 1.0) / 8.0;',
				'	return nv / (nv * (1.0 - k) + k) * nl / (nl * (1.0 - k) + k);',
				'}',
				'void main() {',
				'	vec4 base = uBaseColor * texture(uColorMap, vUV);',
				'	if (base.a < uCutoff) discard;',
				'	vec3 albedo = base.rgb * vTint;',
				'	if (uUnlit > 0.5) {',
				'		outColor = vec4(pow(albedo, vec3(1.0 / 2.2)), base.a);',
				'		return;',
				'	}',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 n = normalize(vNormal);',
				'	if (!gl_FrontFacing) n = -n;',
				'	if (uNormalScale > 0.0) n = bump(n, v);',
				'	vec4 surface = texture(uMetalMap, vUV);',
				'	float roughness = clamp(uRoughness * surface.g, 0.04, 1.0);',
				'	float metallic = clamp(uMetallic * surface.b, 0.0, 1.0);',
				'	float a = roughness * roughness;',
				'	float level = uSpecularLevel * (uSpecularOn > 0.5 ? texture(uSpecularMap, vUV).a : 1.0);',
				'	vec3 f0 = mix(min(vec3(0.04) * uSpecularColor, vec3(1.0)) * level, albedo, metallic);',
				'	vec3 total = vec3(0.0);',
				'	float nv = max(dot(n, v), 0.001);',
				'	lightShade = sunShadow(vWorld, n);',
				'	for (int i = 0; i < 4; i++) {',
				'		if (i >= uLightCount) break;',
				'		vec3 l = normalize(uLightPositions[i] - vWorld);',
				'		float facing = dot(n, l);',
				'		float nl = max(facing, 0.0);',
				'		float wrapped = max((facing + uSoftness * 0.6) / (1.0 + uSoftness * 0.6), 0.0);',
				'		if (wrapped <= 0.0) continue;',
				'		vec3 under = albedo * mix(vec3(1.0), vec3(1.0, 0.42, 0.28), uSoftness) * (wrapped - nl) * uLightColors[i] * (i == 0 ? mix(lightShade, 1.0, uSoftness * 0.4) : 1.0);',
				'		total += under;',
				'		if (nl <= 0.0) continue;',
				'		vec3 h = normalize(l + v);',
				'		vec3 f = f0 + (1.0 - f0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);',
				'		vec3 specular = f * ggx(max(dot(n, h), 0.0), a) * smith(nv, nl, a) / max(4.0 * nv * nl, 0.001);',
				'		vec3 diffuse = (1.0 - f) * (1.0 - metallic) * albedo / 3.14159265;',
				'		total += (diffuse + specular) * uLightColors[i] * 3.14159265 * nl * shadow(vWorld, uLightPositions[i]) * (i == 0 ? lightShade : 1.0);',
				'	}',
				'	float occlusion = mix(1.0, texture(uOcclusionMap, vUV).r, uOcclusion);',
				'	vec3 reflected = reflect(-v, n);',
				'	vec3 around = mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5) + sunBounce(vWorld);',
				'	vec3 mirrored = mix(uFloorLight, uSkyLight, reflected.y * 0.5 + 0.5);',
				'	vec3 fresnel = f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(1.0 - nv, 5.0);',
				'	total += (albedo * (1.0 - metallic) * around + fresnel * mirrored) * occlusion;',
				'	total += uEmissive * texture(uEmissiveMap, vUV).rgb;',
				'	outColor = vec4(pow(total, vec3(1.0 / 2.2)), base.a);',
				'}'
			].join('\n'),

			Billboard: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uCenter;',
				'uniform vec3 uRight;',
				'uniform vec3 uUp;',
				'uniform float uSize;',
				'out vec2 vQuad;',
				'void main() {',
				'	vQuad = aPosition.xy;',
				'	gl_Position = uViewProjection * vec4(uCenter + (uRight * aPosition.x + uUp * aPosition.y) * uSize, 1.0);',
				'}'
			].join('\n'),

			Line: head + [
				'in vec3 aPosition;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOffset;',
				'out vec3 vWorld;',
				'void main() {',
				'	vWorld = aPosition + uOffset;',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
				'}'
			].join('\n'),

			Far: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform float uRatio;',
				'out vec4 vColor;',
				'void main() {',
				'	vColor = aColor;',
				'	gl_PointSize = (1.0 + aColor.a * 2.2) * uRatio;',
				'	gl_Position = uViewProjection * vec4(aPosition, 1.0);',
				'}'
			].join('\n'),

			/* The surface of a body for its cubes: layer 0 its ground (rgb) and gloss (a), layer 1 its clouds (r) and glow (g). */
			Bake: head + [
				'in vec2 vQuad;',
				'uniform int uLayer;',
				'uniform int uKind;',
				'uniform vec3 uColors[4];',
				'uniform vec3 uWater;',
				'uniform float uOcean;',
				'uniform float uIce;',
				'uniform float uClouds;',
				'uniform float uSeed;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Cube,
				'vec3 ground(float h) {',
				'	if (h < 0.33) return mix(uColors[0], uColors[1], h / 0.33);',
				'	if (h < 0.66) return mix(uColors[1], uColors[2], (h - 0.33) / 0.33);',
				'	return mix(uColors[2], uColors[3], (h - 0.66) / 0.34);',
				'}',
				'void main() {',
				'	vec3 p = cubeDirection(uFace, vQuad);',
				'	vec3 q = p * 2.2 + vec3(uSeed, uSeed * 0.7, uSeed * 1.3);',
				'	vec3 albedo;',
				'	float gloss = 0.04;',
				'	float glow = 0.0;',
				'	if (uLayer == 1) {',
				'		float cloud = fbm3(p * 3.2 + vec3(0.0, uSeed * 2.0, 0.0), 5);',
				'		float edge = 0.5 + (0.5 - uClouds) * 0.4;',
				'		float cover = uClouds > 0.0 ? smoothstep(edge, edge + 0.12, cloud) * (uClouds >= 1.0 ? 1.0 : 0.85) : 0.0;',
				'		if (uKind == 3) glow = smoothstep(0.8, 0.93, ridge3(q * 1.6 + 4.0, 5));',
				'		outColor = vec4(cover, glow, smoothstep(0.88, 0.97, ridge3(q * 1.6 + 4.0, 5)), 1.0);',
				'		return;',
				'	}',
				'	if (uKind == 4) {',
				'		float warp = fbm3(vec3(p.x * 3.0, p.y * 9.0, p.z * 3.0) + uSeed, 4);',
				'		float band = sin((p.y * 6.5 + warp * 2.4 + uSeed) * 3.14159);',
				'		float fine = fbm3(vec3(p.x * 2.0, p.y * 38.0, p.z * 2.0) + uSeed, 3);',
				'		albedo = mix(uColors[0], uColors[1], band * 0.5 + 0.5);',
				'		albedo = mix(albedo, uColors[2], smoothstep(0.5, 0.78, fine) * 0.7);',
				'		float storm = 1.0 - smoothstep(0.0, 0.16, length(vec2((atan(p.z, p.x) - uSeed) * 0.5, (p.y + 0.3) * 1.6)) + (warp - 0.5) * 0.08);',
				'		albedo = mix(albedo, uColors[3], storm * 0.85);',
				'		gloss = 0.08;',
				'	}',
				'	else {',
				'		float h = fbm3(q, 6);',
				'		if (uKind == 3) {',
				'			albedo = mix(uColors[0], uColors[1], smoothstep(0.3, 0.7, h));',
				'		}',
				'		else if (uKind == 2) {',
				'			float ridges = ridge3(q * 1.4, 5);',
				'			albedo = mix(ground(h), uColors[0], smoothstep(0.7, 0.9, ridges) * 0.6);',
				'			gloss = 0.25;',
				'		}',
				'		else {',
				'			float land = uOcean > 0.0 ? (h - uOcean * 0.55 - 0.2) / max(0.05, 0.8 - uOcean * 0.55) : h;',
				'			if (uKind == 0) {',
				'				float craters = ridge3(q * 2.6 + 9.0, 3);',
				'				land += (smoothstep(0.86, 0.96, craters) - 0.4) * 0.18;',
				'			}',
				'			albedo = ground(clamp(land, 0.0, 1.0));',
				'			if (uOcean > 0.0 && land < 0.0) {',
				'				albedo = mix(uWater * 1.25, uWater * 0.55, clamp(-land * 4.0, 0.0, 1.0));',
				'				gloss = 0.7;',
				'			}',
				'		}',
				'		if (uIce > 0.0) {',
				'			float pole = abs(p.y) + (fbm3(q * 3.0, 3) - 0.5) * 0.3;',
				'			float cap = uIce >= 1.0 ? 1.0 : smoothstep(1.0 - uIce, 1.0 - uIce + 0.04, pole);',
				'			albedo = mix(albedo, vec3(0.93, 0.95, 0.98), cap * (uKind == 2 ? 0.35 : 1.0));',
				'		}',
				'	}',
				'	outColor = vec4(albedo, gloss);',
				'}'
			].join('\n'),

			/* A body lit: its baked ground and clouds, the light of the stars, the shadows of balls, the air at its edge. */
			Planet: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vLocal;',
				'uniform vec3 uCamera;',
				'uniform int uKind;',
				'uniform vec3 uColors[4];',
				'uniform float uClouds;',
				'uniform vec4 uAtmosphere;',
				'uniform vec4 uHighlight;',
				'uniform float uTime;',
				'uniform samplerCube uGround;',
				'uniform samplerCube uSky;',
				'out vec4 outColor;',
				graphics.Chunks.Lights,
				'float daylight(vec3 position, vec3 normal) {',
				'	float day = 0.0;',
				'	for (int i = 0; i < 4; i++) {',
				'		if (i >= uLightCount) break;',
				'		day += clamp(dot(normal, normalize(uLightPositions[i] - position)) * 2.0 + 0.4, 0.0, 1.0);',
				'	}',
				'	return clamp(day, 0.0, 1.0);',
				'}',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 p = normalize(vLocal);',
				'	vec4 surface = texture(uGround, p);',
				'	float gloss = surface.a;',
				'	vec3 light = lighting(vWorld, n, v, 12.0 + gloss * 70.0, gloss);',
				'	vec3 color = surface.rgb * light;',
				'	float turn = uTime * 0.01;',
				'	vec3 drifted = vec3(p.x * cos(turn) - p.z * sin(turn), p.y, p.x * sin(turn) + p.z * cos(turn));',
				'	vec4 sky = texture(uSky, drifted);',
				'	vec4 heat = texture(uSky, p);',
				'	if (uKind == 3) color += mix(uColors[2], uColors[3], heat.b) * heat.g * 1.6;',
				'	if (uClouds > 0.0) {',
				'		vec3 haze = mix(vec3(0.96), uAtmosphere.rgb, uClouds >= 1.0 ? 0.55 * uAtmosphere.a : 0.0);',
				'		color = mix(color, haze * lighting(vWorld, n, v, 1.0, 0.0), sky.r);',
				'	}',
				'	float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);',
				'	color += uAtmosphere.rgb * rim * uAtmosphere.a * daylight(vWorld, n);',
				'	color += uHighlight.rgb * pow(1.0 - max(dot(n, v), 0.0), 6.0) * uHighlight.a;',
				'	outColor = vec4(color, 1.0);',
				'}'
			].join('\n'),

			Star: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vLocal;',
				'uniform vec3 uCamera;',
				'uniform vec3 uColor;',
				'uniform float uSeed;',
				'uniform float uTime;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 p = normalize(vLocal);',
				'	float cells = fbm3(p * 9.0 + vec3(0.0, uTime * 0.08, uSeed), 4);',
				'	float spots = smoothstep(0.7, 0.78, fbm3(p * 2.6 + vec3(uSeed, uTime * 0.01, 0.0), 3));',
				'	float limb = pow(max(dot(n, v), 0.0), 0.45);',
				'	vec3 color = uColor * (0.7 + 0.6 * cells) * (0.5 + 0.6 * limb) * (1.0 - spots * 0.45);',
				'	outColor = vec4(mix(color, vec3(1.0), 0.28 * limb), 1.0);',
				'}'
			].join('\n'),

			Air: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'uniform vec3 uCamera;',
				'uniform vec3 uColor;',
				'uniform float uStrength;',
				'uniform vec4 uBody;',
				'uniform float uShell;',
				'uniform vec3 uLightPositions[4];',
				'uniform int uLightCount;',
				'out vec4 outColor;',
				'void main() {',
				'	vec3 n = -normalize(vNormal);',
				'	vec3 look = normalize(vWorld - uCamera);',
				'	float miss = length(cross(uBody.xyz - uCamera, look));',
				'	float edge = pow(1.0 - clamp((miss - uBody.w) / (uShell - uBody.w), 0.0, 1.0), 2.4);',
				'	float day = 0.0;',
				'	for (int i = 0; i < 4; i++) {',
				'		if (i >= uLightCount) break;',
				'		day += clamp(dot(-n, normalize(uLightPositions[i] - vWorld)) * 1.5 + 0.35, 0.0, 1.0);',
				'	}',
				'	float glow = edge * clamp(day, 0.0, 1.0) * uStrength;',
				'	outColor = vec4(uColor * glow, glow);',
				'}'
			].join('\n'),

			Ring: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec2 vUV;',
				'uniform vec3 uCamera;',
				'uniform vec3 uColors[4];',
				'uniform float uSeed;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Lights,
				'void main() {',
				'	float r = vUV.x;',
				'	float wide = noise3(vec3(r * 22.0, uSeed, 0.5));',
				'	float fine = noise3(vec3(r * 140.0, uSeed, 3.5));',
				'	float gap = 1.0 - (1.0 - smoothstep(0.0, 0.015, abs(r - 0.62))) * 0.9;',
				'	float alpha = (0.2 + 0.55 * wide + 0.25 * fine) * smoothstep(0.0, 0.05, r) * (1.0 - smoothstep(0.92, 1.0, r)) * gap;',
				'	vec3 albedo = mix(mix(uColors[0], uColors[1], wide), mix(uColors[2], uColors[3], fine), fine * 0.6);',
				'	vec3 n = normalize(vNormal);',
				'	vec3 total = uAmbient;',
				'	for (int i = 0; i < 4; i++) {',
				'		if (i >= uLightCount) break;',
				'		vec3 toLight = normalize(uLightPositions[i] - vWorld);',
				'		total += uLightColors[i] * (0.35 + 0.65 * abs(dot(n, toLight))) * shadow(vWorld, uLightPositions[i]);',
				'	}',
				'	outColor = vec4(albedo * total, alpha);',
				'}'
			].join('\n'),

			Solid: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vLocal;',
				'in vec3 vColor;',
				'uniform vec3 uCamera;',
				'uniform float uShine;',
				'uniform float uSpecular;',
				'uniform float uRough;',
				'out vec4 outColor;',
				'uniform float uSoft;',
				graphics.Chunks.Noise,
				graphics.Chunks.Lights,
				graphics.Chunks.Shadow,
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 color = pow(min(vColor, vec3(1.0)), vec3(2.2));',
				'	color *= 1.0 - uRough * 0.45 + uRough * 0.45 * fbm3(vLocal * 3.0, 3);',
				'	vec3 hot = max(vColor - vec3(1.0), 0.0);',
				'	lightShade = sunShadow(vWorld, n);',
				'	vec3 light = lighting(vWorld, n, v, uShine, uSpecular) + sunBounce(vWorld);',
				'	if (uSoft > 0.0 && uLightCount > 0) {',
				'		vec3 l = normalize(uLightPositions[0] - vWorld);',
				'		float through = pow(max(dot(v, -l), 0.0), 3.0) * 0.8 + max(-dot(n, l), 0.0) * 0.35;',
				'		light += uLightColors[0] * through * lightShade * uSoft * vec3(1.0, 1.05, 0.55);',
				'	}',
				'	outColor = vec4(pow(color * light + hot * hot * 4.0, vec3(1.0 / 2.2)), 1.0);',
				'}'
			].join('\n'),

			Glow: head + [
				'in vec2 vQuad;',
				'uniform vec3 uColor;',
				'uniform float uInner;',
				'uniform int uStyle;',
				'out vec4 outColor;',
				'void main() {',
				'	float d = length(vQuad);',
				'	float a;',
				'	if (uStyle == 1) {',
				'		a = smoothstep(0.86, 0.9, d) * (1.0 - smoothstep(0.93, 0.97, d));',
				'	}',
				'	else {',
				'		a = pow(clamp(1.0 - (d - uInner) / (1.0 - uInner), 0.0, 1.0), 2.6) * 0.85;',
				'	}',
				'	outColor = vec4(uColor * a, a);',
				'}'
			].join('\n'),

			Flat: head + [
				'in vec3 vWorld;',
				'uniform vec4 uColor;',
				'uniform vec4 uBody;',
				'out vec4 outColor;',
				'void main() {',
				'	float near = uBody.w > 0.0 ? smoothstep(uBody.w * 1.3, uBody.w * 4.0, distance(vWorld, uBody.xyz)) : 1.0;',
				'	outColor = vec4(uColor.rgb, uColor.a * near);',
				'}'
			].join('\n'),

			/* The ground of a body seen from its surface: its squares relative to the eye, the colors of its baked surface. */
			GroundVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOffset;',
				'uniform vec3 uCenter;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vDirection;',
				'out vec2 vLand;',
				'void main() {',
				'	vWorld = aPosition + uOffset;',
				'	vNormal = aNormal;',
				'	vDirection = normalize(aPosition + uCenter);',
				'	vLand = aUV;',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
				'}'
			].join('\n'),

			Ground: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vDirection;',
				'in vec2 vLand;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uColors[4];',
				'uniform vec3 uWater;',
				'uniform float uIce;',
				'uniform vec4 uAir;',
				'uniform float uFog;',
				'uniform float uHigh;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Shadow,
				'vec3 ground(float h) {',
				'	if (h < 0.33) return mix(uColors[0], uColors[1], h / 0.33);',
				'	if (h < 0.66) return mix(uColors[1], uColors[2], (h - 0.33) / 0.33);',
				'	return mix(uColors[2], uColors[3], (h - 0.66) / 0.34);',
				'}',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(-vWorld);',
				'	float sea = vLand.y;',
				'	vec3 albedo = sea > 0.5 ? mix(uWater * 1.25, uWater * 0.55, clamp(-vLand.x * 4.0, 0.0, 1.0)) : ground(clamp(vLand.x, 0.0, 1.0));',
				'	vec3 up = vDirection;',
				'	if (sea > 0.5) n = up;',
				'	float rock = 1.0 - smoothstep(0.55, 0.75, dot(n, up));',
				'	if (sea < 0.5) albedo = mix(albedo, uColors[1] * 0.8, rock * 0.6);',
				'	if (uIce > 0.0) {',
				'		float pole = abs(up.y) + (fbm3(up * 6.6, 3) - 0.5) * 0.3;',
				'		float cap = uIce >= 1.0 ? 1.0 : smoothstep(1.0 - uIce, 1.0 - uIce + 0.04, pole);',
				'		albedo = mix(albedo, vec3(0.93, 0.95, 0.98), cap);',
				'	}',
				'	albedo *= 0.85 + 0.3 * noise3(vWorld * 2.0 + up * 300.0);',
				'	float day = max(dot(n, uSun), 0.0) * sunShadow(vWorld, n);',
				'	float shine = sea > 0.5 ? pow(max(dot(n, normalize(uSun + v)), 0.0), 80.0) * 0.8 : 0.0;',
				'	vec3 color = albedo * (uSunColor * day + vec3(0.05, 0.06, 0.08)) + uSunColor * shine;',
				'	float light = clamp(dot(up, uSun) * 3.0 + 0.3, 0.0, 1.0);',
				'	float haze = (1.0 - exp(-length(vWorld) / uFog)) * uAir.a * (1.0 - uHigh * 0.7);',
				'	color = mix(color, mix(uAir.rgb, vec3(0.9), 0.35) * light, clamp(haze, 0.0, 1.0));',
				'	outColor = vec4(color, 1.0);',
				'}'
			].join('\n'),

			/* The sky of a body from its surface: blue of its air by day, red at sunset, black above its air or without one. */
			Sky: head + [
				'in vec2 vQuad;',
				'uniform mat4 uInverse;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec4 uAir;',
				'uniform vec3 uUp;',
				'uniform float uHigh;',
				'out vec4 outColor;',
				'void main() {',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec4 close = uInverse * vec4(vQuad, -1.0, 1.0);',
				'	vec3 ray = normalize(far.xyz / far.w - close.xyz / close.w);',
				'	float h = dot(ray, uUp);',
				'	float s = dot(uSun, uUp);',
				'	float toward = max(dot(ray, uSun), 0.0);',
				'	float day = smoothstep(-0.3, 0.25, s);',
				'	vec3 zenith = uAir.rgb * vec3(0.45, 0.6, 1.0);',
				'	vec3 horizon = mix(uAir.rgb, vec3(1.0), 0.45);',
				'	vec3 sky = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.45)) * day;',
				'	float dusk = (1.0 - smoothstep(0.0, 0.35, abs(s))) * exp(-max(h, 0.0) * 5.0);',
				'	sky += vec3(1.0, 0.45, 0.2) * dusk * (0.4 + 0.6 * pow(toward, 4.0));',
				'	sky += uSunColor * pow(toward, 48.0) * 0.5 * day;',
				'	float density = uAir.a * (1.0 - uHigh);',
				'	float disk = smoothstep(0.99996, 0.99999, toward);',
				'	float alpha = clamp(density * (day * 0.97 + dusk * 0.6), 0.0, 1.0);',
				'	outColor = vec4(sky * density + uSunColor * disk * 4.0, max(alpha, disk));',
				'}'
			].join('\n'),

			/* The ground of a map: its squares relative to the eye, the colors of their heights, its sun and its haze. */
			LandVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOffset;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vColor;',
				'out vec3 vPlace;',
				'void main() {',
				'	vWorld = aPosition + uOffset;',
				'	vNormal = aNormal;',
				'	vColor = aColor;',
				'	vPlace = aPosition;',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
				'}'
			].join('\n'),

			Land: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vColor;',
				'in vec3 vPlace;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec4 uAir;',
				'uniform float uFog;',
				'uniform vec3 uSkyLight;',
				'uniform vec3 uFloorLight;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Shadow,
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	float grain = 0.88 + 0.24 * noise3(vWorld * 0.35 + vPlace * 0.01);',
				'	vec3 albedo = pow(vColor * grain, vec3(2.2));',
				'	vec3 light = uSunColor * 1.35 * max(dot(n, uSun), 0.0) * sunShadow(vWorld, n) + mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5) + sunBounce(vWorld);',
				'	vec3 horizon = mix(uAir.rgb, vec3(1.0), 0.45) * clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0);',
				'	vec3 color = mix(pow(albedo * light, vec3(1.0 / 2.2)), horizon, 1.0 - exp(-length(vWorld) / uFog));',
				'	outColor = vec4(color, 1.0);',
				'}'
			].join('\n'),

			Sea: head + [
				'in vec3 vWorld;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec4 uAir;',
				'uniform float uFog;',
				'uniform mat4 uViewProjection;',
				'uniform sampler2D uSeen;',
				'uniform sampler2D uSeenDepth;',
				'uniform float uMirror;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				'vec4 mirrored(vec3 from, vec3 way) {',
				'	vec3 at = from;',
				'	float step = max(length(from) * 0.02, 0.4);',
				'	for (int i = 0; i < 28; i++) {',
				'		at += way * step;',
				'		step *= 1.09;',
				'		vec4 p = uViewProjection * vec4(at, 1.0);',
				'		vec3 s = p.xyz / p.w * 0.5 + 0.5;',
				'		if (p.w <= 0.0 || s.x < 0.0 || s.y < 0.0 || s.x > 1.0 || s.y > 1.0) break;',
				'		float depth = texture(uSeenDepth, s.xy).r;',
				'		if (depth < 1.0 && s.z > depth) {',
				'			vec2 edge = smoothstep(vec2(0.0), vec2(0.08), min(s.xy, 1.0 - s.xy));',
				'			return vec4(texture(uSeen, s.xy).rgb, edge.x * edge.y * (1.0 - float(i) / 28.0));',
				'		}',
				'	}',
				'	return vec4(0.0);',
				'}',
				'void main() {',
				'	vec3 v = normalize(-vWorld);',
				'	vec3 n = normalize(vec3((noise3(vWorld * 0.2) - 0.5) * 0.08, 1.0, (noise3(vWorld * 0.2 + 7.0) - 0.5) * 0.08));',
				'	float shine = pow(max(dot(n, normalize(uSun + v)), 0.0), 90.0);',
				'	float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);',
				'	vec3 color = vec3(0.07, 0.26, 0.38) * (0.4 + 0.6 * max(uSun.y, 0.0)) + mix(uAir.rgb, vec3(1.0), 0.4) * fresnel * 0.5 + uSunColor * shine;',
				'	vec3 horizon = mix(uAir.rgb, vec3(1.0), 0.45) * clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0);',
				'	if (uMirror > 0.5) {',
				'		vec4 image = mirrored(vWorld, reflect(-v, n));',
				'		color = mix(color, image.rgb, image.a * clamp(0.35 + fresnel, 0.0, 1.0));',
				'	}',
				'	color = mix(color, horizon, 1.0 - exp(-length(vWorld) / uFog));',
				'	outColor = vec4(color, 0.82 + fresnel * 0.15);',
				'}'
			].join('\n'),

			/* What the sun sees of a surface: for the light that bounces. */
			Bounced: head + [
				'in vec3 vNormal;',
				'in vec3 vColor;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'out vec4 outColor;',
				'void main() {',
				'	outColor = vec4(min(vColor, vec3(1.0)) * uSunColor * max(dot(normalize(vNormal), uSun), 0.0), 1.0);',
				'}'
			].join('\n'),

			/* What draws a shadow map: only the depth of what its vertex shader places. */
			Depth: head + 'void main() {}',

			Dot: head + [
				'in vec4 vColor;',
				'out vec4 outColor;',
				'void main() {',
				'	float d = length(gl_PointCoord - vec2(0.5));',
				'	float a = (1.0 - smoothstep(0.1, 0.5, d)) * vColor.a;',
				'	outColor = vec4(vColor.rgb * a, a);',
				'}'
			].join('\n')
		};
	}
});
