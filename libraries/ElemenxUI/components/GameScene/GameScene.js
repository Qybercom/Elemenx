/*
 * The scene of a game in three dimensions on WebGL2 (the Graphics3D Service): objects of any kind (the Kinds Service),
 * each made of what its kind extends, what it can do (its Traits, each run by a system of the scene) and what it is made
 * of (its Parts, objects of their own placed in it). The setting space (the default) brings the kinds of a star system
 * and its systems: stars and planets on Kepler orbits (the Astronomy Service), lit by their stars (night sides, the
 * shadows of moons and planets on each other and on rings), their surfaces of noise baked once into cube textures,
 * belts and rings, stations of modules, fleets of ships that hold their place by a body and travel to another.
 *
 * Kinds of space: star (Star: Mass, Radius, Temperature, Luminosity, Color, Veil: how far from the disc, in its radii,
 * engines go in its light, 0 for not at all), planet (Orbit: Distance, Eccentricity,
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
 * the selected object), Background (the far stars), Team, the slot hud, the slot screens (elements a car's screens show, out of sight). Without WebGL2 it says so (and emits error).
 *
 * The view is free in every 3D scene: a drag turns and tilts it, the wheel zooms, the middle button or a drag with Shift
 * carries it (two fingers on a screen), WASD or the arrows move it, Q and E turn it, R and F tilt it.
 *
 * The sky of a ground: a GameObject of kind sun takes Time (18:30, or hours as a number) and goes on at the pace of
 * DaySeconds, Noon is the azimuth it passes at noon (180) and Shade the color of the light of the sky. DayHours is how
 * long a day is (24); with a Latitude the sun goes as the planet turns: Tilt of its axis (23.44), DayOfYear (172) of a
 * year of YearDays (365) give the length of the light of the day, the polar days and nights too. At night the moon
 * lights the land: Moon (false: a sky without one), MoonLight, MoonSize, MoonPhase (0 new, 0.5 full, it goes late by that
 * part of a day), MoonElevation with MoonAzimuth to hold it in a place, MoonTilt with MoonNode (the day of a year its way crosses
 * the sun's: an eclipse, of the sun at a new moon, of the moon at a full one), and NightLight, the light of the air in the dark.
 * SkyGlow (0 to 1) is the light towns throw on the air, of SkyGlowColor, from SkyGlowAzimuth or all round: it lights the clouds
 * from under and hides the faint stars. The stars turn with the planet, round its pole at the height of Latitude, and with them
 * the band of the galaxy (Galaxy, 0 for none). Weather (clear, cloudy, overcast, rain, storm, snow, fog) changes in a few
 * seconds, and rain wets what stands in it (pools on what is level, drops on what is smooth; Wet and Drops of an object, 0 to
 * 1, its own); Flare (0 to 2) is how strongly a lens shows the sun; Bokeh (0 to 1) blurs what is out of focus (BokehFocus, a distance; else the hero, or the middle of the view). At high and ultra what is glossy
 * or wet mirrors what is on the screen, and past it the sky. Kind light (Color, Power, Radius, Height, Spot, Aim, Flicker,
 * Follow, Z) is a lamp: any number, the nearest 24 at once, the nearest 2 with shadows; what shines in a model of a file is
 * a lamp too (Lamps of the Models Service; Lights: false on an object leaves them out). Kind mirror (Width, Height, Yaw and
 * Pitch in degrees, Lift over the ground or Z, Tint, Blur, Strength, Every: the frames between two of its pictures) shows the
 * world reflected by its plane, drawn again at half the size (the nearest one at low and medium, two at high, three at
 * ultra); kind glass (the same place and size, Tint, Clarity, Frost, Reflect) is a pane blended over what is behind it, the
 * sky, the sun and, while Reflect is above 0, the world on it by its angle. Kind location (Model, Size, Without,
 * Plane) makes a ground of a model of a file, its floors and walls read from its triangles; Control(id) gives the keys to a
 * walker: a press takes the mouse (Capture), it faces the view, A and D step aside, Shift runs, Shift and Alt sprint, Space
 * jumps, a drag with the right button turns the view and leaves the walk as it was. A
 * skeleton with no clips gets walk and idle made from the names of its bones, Motions of a recipe bring clips of FBX files.
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
 * arrive ({ID, At}), land ({ID}), takeoff ({ID}), error ({Reason: webgl2}); enter, active and leave of a trigger ({Trigger,
 * ID, Object}) and action ({Trigger, Name, Data}): kind trigger and kind zone (trait Triggers: Trigger(id),
 * TriggerActions(actions), ZonesAt(x, z)); touch ({ID, With, At, Normal, Impulse}) of solid things that fall and are
 * knocked over (trait Rigid: Push(id, impulse, at), CastRay(from, direction, max), RigidWorld()).
 * Cosmos (nebula, pillars, galaxy, galaxies, cluster, void, or {Kind, Seed, Colors, Gas, Dust, Stars, Pillars, Band, Galaxies, Clusters, Beacon}) is what lies far behind a system (trait Cosmos).
 * Kind effect (Type: spark, torch, campfire, smoke, steam, dust, exhaust; Size, Power, Aim, Height, Light, Follow, Offset) burns
 * and smokes where it stands, or goes with an object; Burst(type, place, options) happens once, as an explosion (trait Effects).
 * Methods: Add(kind, props), Change(id, changes), Remove(id), Attach(parent, object), Detach(id), Get(id),
 * Objects(filter), Describe(id), Position(id), Select(id), FocusOn(id), Move(id, target), Now(), SetTime(days),
 * Play(id, clip, callback), ToScreen(id), Pick(clientX, clientY), Save(options), Load(saved), Land(id, options), TakeOff(),
 * Surface(), Supported(). Save gives the recipe of a game (Seed, Cosmos, Weather, Time and what the methods changed:
 * Added, Removed, Overrides), made again by Load; Save({Baked: true}) every object as it is.
 *
 * What a scene waits for, its programs and models, comes behind the page and holds no frame up: Loader shows how far it
 * came, a slot named loading takes the place of the bar, and the event loading tells {Part}, up to 100.
 */
Elemenx.Component('GameScene', {
	$TemplateURL: 'GameScene.html',
	$StyleURL: 'GameScene.css',
	$Traits: ['Strategy', 'Scatter', 'Lighting', 'Effects', 'Cosmos', 'Vehicles', 'Triggers', 'Rigid'],
	$Meta: {
		Group: 'game',
		Icon: 'star',
		Description: 'The scene of a game in 3D: objects of any kind with their traits and parts; the setting space brings a star system on Kepler orbits, stations and fleets, with a landing on the surfaces of its bodies; the setting terrain a ground of noise and its walkers.',
		Container: true,
		Children: ['GameObject', 'GameTerrain', 'GameLayer'],
		Slots: ['hud', 'loading', 'screens'],
		Events: {
			ready: 'The scene is ready: the component itself, to call its methods.',
			select: 'The selection changed: {ID, Object, Info, IDs, Objects} (ID empty when none is).',
			focus: 'The view moved to an object: {ID}.',
			person: 'V took the view of a walker to another place: third, first or shoulder.',
			loading: 'What the scene waits for came a step nearer: {Part}, up to 100.',
			shoulder: 'B took the view over another shoulder: right or left.',
			arrive: 'An object reached where it was sent: {ID, At} (with a map, X and Y too).',
			load: 'A map was loaded: {Width, Height} in cells.',
			order: 'The selected units of a map were ordered: {Kind (move, attack or stop), IDs, X, Y, Target}.',
			cell: 'A cell of a map was pressed: {X, Y, Button, Object}, the object on it or null.',
			view: 'The view of a map moved or zoomed: {X, Y, Zoom}.',
			land: 'The view went down to the surface of a body: {ID}.',
			takeoff: 'The view went back up to space: {ID}.',
			travel: 'A ship on its way far at once (Travel, H or J) came to a phase: {ID, Kind (warp or jump), Phase (enter, inside, exit, done)}.',
			enter: 'A walker, a vehicle or the hero came into a trigger: {Trigger (the trigger itself: ID, Inside(), Action(name, data), Enable(on)), ID, Object}.',
			active: 'One stays in a trigger, every Every seconds of it: {Trigger, ID, Object}.',
			leave: 'One went out of a trigger, or was removed: {Trigger, ID, Object}.',
			action: 'A trigger was sent an action (Action of the trigger): {Trigger, Name, Data}.',
			touch: 'Two solid things began to touch (trait Rigid): {ID, With (null: the ground), At, Normal, Impulse}.',
			error: 'There is no WebGL2 ({Reason: webgl2}), or a map could not be loaded (the error).'
		},
		Methods: ['Trigger(id)', 'TriggerActions(actions)', 'ZonesAt(x, z)', 'Push(id, impulse, at)', 'CastRay(from, direction, max)', 'RigidWorld()', 'Burst(type, place, options)', 'PipelineGraph()', 'EffectGraph(name)', 'Effects(types)', 'MountsOf(id, kind)', 'Travel(id, kind, options, callback)', 'OpenPart(id, name, amount)', 'CosmosKinds()', 'Add(kind, props)', 'Change(id, changes)', 'Remove(id)', 'Attach(parent, object)', 'Detach(id)', 'Get(id)', 'Objects(filter)', 'Describe(id)', 'Position(id)', 'Select(id)', 'Selection()', 'FocusOn(id)', 'Control(id)', 'Move(id, target)', 'Play(id, clip, callback)', 'Now()', 'SetTime(days)', 'ToScreen(id)', 'Pick(clientX, clientY, all)', 'Viewpoint()', 'SetViewpoint(view)', 'Project(point)', 'Ray(clientX, clientY)', 'GroundAt(clientX, clientY)', 'OrbitAt(id, clientX, clientY)', 'Save(options)', 'Load(saved)', 'Land(id, options)', 'TakeOff()', 'Surface()', 'Supported()', 'Order(ids, target, kind)', 'Stop(ids)', 'Cell(x, y)', 'Paint(x, y, key, layer)', 'Near(x, y, radius, filter)', 'Route(from, to)', 'PathGrid()', 'FogOfWar()', 'CenterOn(x, y)', 'ToCell(clientX, clientY)'],
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
			Capture: 'With a walker under the keys (Control), a press takes the pointer: the mouse turns the view, Escape gives it back.',
			Person: {Options: ['third', 'first', 'shoulder'], Description: 'Where the view of a walker stands: behind it (third), in its eyes (first, its head hidden but its body and what it holds seen) or over its shoulder. V changes it while the pointer is taken.'},
			Shoulder: {Options: ['right', 'left'], Description: 'Over which shoulder the view stands. B changes it while the pointer is taken.'},
			Axes: {Options: ['', 'top-left', 'top-right', 'bottom-left', 'bottom-right'], Description: 'The corner where the Axes of the view stand, none when empty; a press on one looks along it.'},
			Origin: 'Draws the three axes of the world at its middle.',
			FreeLook: 'A walker that stands does not turn with the view, so it can be looked at from all sides: it comes round when it sets off.',
			DaySeconds: 'The seconds a day of 24 hours takes, on a body and from space alike, however fast the orbits go (0: as Speed says).',
			SurfaceSpeed: 'The days a second on the surface of a body (1/120: a day of two minutes).',
			Shadows: 'The shadows of a sun on a ground, a surface and a model near the view (true).',
			Quality: {Options: ['', 'low', 'medium', 'high', 'ultra'], Description: 'What the light costs: empty chooses by the graphics card and steps down while frames are late.'},
			Pipeline: 'The render graph of the Blueprints Service that makes the picture of a frame (high, ultra and medium): its passes (Scene, Clouds, Occlusion, Air, Frames, Mirror, Rays, Exposure, Bokeh, Bloom, Picture, Shader: a pass graph of its own) up to Present; empty: PipelineGraph(), the passes of the library.',
			PipelineParameters: 'The values of the parameters of the Pipeline, by key.',
			Flare: 'How strongly the rings and the glow a lens makes of the sun show, at high and ultra: 0 to 2 (true is 1).',
			Weather: {Options: ['clear', 'cloudy', 'overcast', 'rain', 'storm', 'snow', 'fog', 'changing'], Description: 'What the air of a ground does; it changes in a few seconds, as a front comes; changing goes from one to the next by itself.'},
			Wind: 'How strong the wind is, 0 to 4, for clouds, rain, grass and trees (empty: as the weather has it).',
			WindWay: 'Where the wind blows to: an azimuth in degrees.',
			Front: 'The seconds a change of the weather takes.',
			View: {Options: ['', 'top', 'isometric'], Description: 'A ground seen in parallel rays, as a game of two dimensions: from above or at an angle (empty: in perspective).'},
			Paused: 'Holds the time.',
			Loader: 'Shows how much of the scene has come; a slot named loading takes its place.',
			Focus: 'The ID of the object in the middle of the view.',
			Selected: 'The ID of the selected object.',
			Orbits: 'Draws the orbits.',
			Labels: 'Shows the names of the objects.',
			Exposure: 'What a view lets in: a number holds it, empty adapts to the light as an eye does.',
			Bokeh: 'The depth of field, 0 to 1: how wide the lens is open; what is far from the focus is blurred, a bright point of it a disc.',
			BokehFocus: 'The distance in focus; empty: the hero, or what the middle of the view shows, followed slowly.',
			Details: 'Shows a card of the selected object.',
			Background: 'Draws the stars far away.',
			Cosmos: 'What lies far behind a system, made of a seed: nebula, pillars, galaxy, galaxies, cluster, void, or {Kind, Seed, Colors, Gas, Dust, Stars, Pillars, Band, Galaxies, Clusters, Beacon}: a kind is a set of these amounts, and what is told comes on top of it.',
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
	DaySeconds: 0,
	Capture: true,
	FreeLook: false,
	SurfaceSpeed: 1 / 120,
	Shadows: true,
	View: '',
	Paused: false,
	Focus: '',
	Bokeh: 0,
	BokehFocus: '',
	Selected: '',
	Orbits: true,
	Labels: true,
	Person: 'third',
	Shoulder: 'right',
	Axes: '',
	Origin: false,
	ViewYaw: 0,
	ViewPitch: 0,
	Details: true,
	Background: true,
	Scale: 'compressed',
	Team: '',
	Label: '',
	Status: '',
	Loader: true,
	Loading: null,
	LoadingEndless: false,
	LoadingOwn: false,
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
	 * (Sun: Elevation, Azimuth in degrees, Color; with Time, Noon: the azimuth at noon of its way, 180; Shade: the color of the light of the sky), units that walk (Walker: Speed, a second; X and Y their place on the
	 * map), trees, rocks and houses (a Model; Blocks: no way through them).
	 */
	Ground: function () {
		return {
			'ground': {Traits: {Terrain: {Size: 1000, Height: 60, Water: 0.35, Scale: 180, Ridges: 0.4, Seed: 'ground', Blueprint: null, Parameters: null, Sketch: null}}},
			'effect': {Traits: {Effect: {Type: 'campfire', Size: 1, Power: 1, Aim: null, Height: 0, Light: true, On: true, Color: '', Hot: '', Volume: 1, Intensity: 1, Length: 1, Width: 1, Spin: 1, Rings: null, Seed: '', Smoke: 1, Appear: 0.45, Tune: null, Pulse: null, Where: 'body', Blueprint: null, Parameters: null}}},
			'mirror': {Traits: {Mirror: {Width: 2, Height: 2, Yaw: 0, Pitch: 0, Lift: 1, Tint: '#ffffff', Blur: 0, Strength: 0.92, Every: 1}}},
			'glass': {Traits: {Glass: {Width: 2, Height: 2, Yaw: 0, Pitch: 0, Lift: 1, Tint: '#cfe6f0', Clarity: 0.88, Frost: 0, Reflect: 0.35}}},
			'light': {Traits: {Light: {Color: '#ffd39a', Power: 1, Radius: 14, Height: 2.5, Spot: 0, Aim: null, Flicker: 0}}},
			'location': {Traits: {Model: {Shape: 'rock', Size: 1, Color: '#ffffff'}, Location: {}}},
			'sun': {Traits: {Sun: {Elevation: 35, Azimuth: 140, Color: '#fff4e0', Time: '', Noon: 180, Shade: '#ffffff', DayHours: 24, Latitude: null, Tilt: 23.44, DayOfYear: 172, YearDays: 365, Moon: true, MoonLight: 1, MoonSize: 1, MoonPhase: 0.5, MoonElevation: null, MoonAzimuth: null, MoonTilt: 5.14, MoonNode: 80, NightLight: 1, SkyGlow: 0, SkyGlowColor: '#ffa860', SkyGlowAzimuth: null, Galaxy: 1}}},
			'unit': {Traits: {Walker: {Speed: 8, MaxSlope: 0.45}, Model: {Shape: 'soldier', Size: 1.8, Color: '#ffffff'}, Health: {Max: 100}, Selectable: {}}},
			'tree': {Traits: {Model: {Shape: 'pine', Size: 8, Color: '#ffffff'}}, Values: {Blocks: true}},
			'rock': {Traits: {Model: {Shape: 'rock', Size: 2.5, Color: '#ffffff'}}, Values: {Blocks: true}},
			'house': {Traits: {Model: {Shape: 'house', Size: 8, Color: '#ffffff'}, Health: {Max: 800}, Selectable: {}}, Values: {Blocks: true}},
			'building': {Extends: 'house'},
			'thing': {Traits: {Model: {Shape: 'crystal', Size: 1, Color: '#ffffff'}}},
			'marker': {Traits: {Marker: {Role: 'spawn', Team: ''}}},
			'trigger': {Traits: {Trigger: {Shape: '', Points: null, Radius: 4, Width: 4, Height: 0, Team: '', Kinds: null, Every: 0.5, Once: false, Enabled: true, Blueprint: null, Parameters: null}}},
			'zone': {Traits: {Zone: {Points: null, Radius: 0, Tags: null, Team: ''}}},
			'forest': {Traits: {Scatter: {Shapes: ['pine', 'pine', 'oak', 'birch', 'bush', 'stump'], Density: 3, Cover: 0.55, Patch: 70, MaxSlope: 0.3}}},
			'grove': {Traits: {Scatter: {Shapes: ['oak', 'birch', 'bush'], Density: 0.8, Cover: 0.45, Patch: 40, MaxSlope: 0.25}}},
			'thicket': {Traits: {Scatter: {Shapes: ['bush', 'bush', 'mushroom', 'stump'], Density: 5, Cover: 0.5, Patch: 25, MaxSlope: 0.3, Size: [0.6, 1.2]}}},
			'rocks': {Traits: {Scatter: {Shapes: ['rock', 'rock', 'boulder'], Density: 0.5, MinHeight: 0, MaxSlope: 0.8, Size: [0.5, 1.4]}}},
			'grass': {Traits: {Grass: {Density: 1, Height: 0.75, Color: '#7fae4a', Root: '#2f5a22', Clumps: 0, Patch: 24, Spread: 0.45}}},
			'village': {Traits: {Settlement: {Houses: 8, Radius: 30}}}
		};
	},

	/* The kinds of the setting space. */
	Space: function () {
		var orbit = {Distance: 1, Eccentricity: 0, Inclination: 0, Node: 0, Periapsis: 0, Anomaly: 0, Period: null, Unit: 'AU'};

		return {
			'star': {Traits: {Star: {Mass: 1, Radius: null, Temperature: null, Luminosity: null, Color: '', Veil: 3}, Selectable: {}}},
			'planet': {Traits: {Orbit: orbit, Body: {Radius: 6371, Mass: null, Day: 24, Tilt: 0, Albedo: null}, Surface: {Type: 'rocky', Colors: '', Water: '', Ocean: null, Ice: null, Clouds: null, Atmosphere: '', Seed: ''}, Selectable: {}}},
			'moon': {Extends: 'planet', Traits: {Body: {Radius: 1737, Day: 0}, Surface: {Type: 'moon'}}},
			'belt': {Traits: {Belt: {Inner: 2.2, Outer: 3.2, Count: 260, Inclination: 0, Colors: '', Rocks: 1}}},
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
			'craft': {Traits: {Orbit: {Distance: 1.8, Unit: 'radii', Period: 0.6, Inclination: 12, Anomaly: null}, Model: {Shape: '', Size: 0.11, Relative: true}, Health: {Max: 1000}, Selectable: {}}},
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

		/* What was put in the slot stands beside the bar of the scene, which then gives way. */
		this.LoadingOwn = Array.prototype.some.call(element.querySelector('.elemenx-game-scene-loading').children, function (child) {
			return child.getAttribute('role') !== 'progressbar' && !child.querySelector('[role="progressbar"]');
		});

		/* What a press had begun ends when the pointer is taken or given back: its place on the screen means nothing any more. */
		this.LockChanged = function () {
			if (!self.Scene) return;

			var scene = self.Scene();
			var now = performance.now();
			var looks = (scene.Looks || []).filter(function (look) {
				return now - look.At > 90;
			});

			/* Given back, the last moves may be the leap of a pointer that comes back to where it was. */
			if (!document.pointerLockElement && looks.length) {
				scene.Yaw = looks[looks.length - 1].Yaw;
				scene.Pitch = looks[looks.length - 1].Pitch;
			}

			scene.Looks = [];
			scene.LockAt = now;
			scene.Drag = null;
			scene.Pinch = null;
			scene.Pointers = {};
			self.Dragging = false;
		};

		document.addEventListener('pointerlockchange', this.LockChanged);

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
		var renderer = graphics.Create(canvas, {Patient: true, Restored: function () {
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
			Asked: {},
			Flight: null,
			Pan: [0, 0, 0],
			Keys: {},
			Focus: '',
			Selected: '',
			Pointers: {},
			Drag: null,
			Pinch: null,
			Width: 0,
			Height: 0,
			Patience: 90,
			Steady: 1000,
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
		function canonical (raw, of, given) {
			var kind = raw.Kind && kinds.Has(raw.Kind) ? raw.Kind : '';
			var fields = kind || of ? kinds.Fields(kind || of) : {};
			var common = {clip: 'Clip', soft: 'Soft', biome: 'Biome', houses: 'Houses', radius: 'Radius', type: 'Type', health: 'Health', maxhealth: 'MaxHealth', sight: 'Sight', tall: 'Tall', model: 'Model', roof: 'Roof', speed: 'Speed', shapes: 'Shapes', density: 'Density', size: 'Size', minheight: 'MinHeight', maxheight: 'MaxHeight', maxslope: 'MaxSlope', cover: 'Cover', patch: 'Patch', clumps: 'Clumps', spread: 'Spread', follow: 'Follow', offset: 'Offset', facing: 'Facing', lift: 'Lift', wet: 'Wet', drops: 'Drops', seed: 'Seed', blocks: 'Blocks', root: 'Root'};
			var spec = {ID: raw.ID, Kind: self.Cells ? raw.Kind || '' : kind, Parent: raw.Parent, Part: raw.Part, Values: {}, Traits: {}, Parts: []};

			Object.keys(raw).forEach(function (key) {
				var field;
				var value;

				if (key === 'ID' || key === 'Kind' || key === 'Parent' || key === 'Part') return;
				if (!given && own(places, key) && raw[key] === places[key]) return;

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

				/*
				 * A hero made again by the change of its place goes on as it was: where it stands, where it faces, what it plays; a
				 * vehicle its speed, its gear, what opens on it, its lights and its way far at once. Regression: a change of anything
				 * in the scene (the hour) stopped a car that was driven.
				 */
				if (!kept && made[spec.ID] && spec.ID === scene.Hero) {
					['Air', 'Rise', 'Grounded', 'Facing', 'Heading', 'Spin', 'Clip', 'Frames', 'Pose', 'Pace', 'Walking', 'Back', 'Car', 'Ship', 'Clock', 'Last', 'Opens', 'Controls', 'Signals', 'LightsSet', 'SignalKeys', 'Blink', 'Turned', 'Swept', 'Shifts', 'Pressed', 'Travel', 'Strokes', 'Thrust', 'Popped'].forEach(function (name) {
						object[name] = made[spec.ID].Object[name];
					});
				}

				if (spec.Restored)
					object.Parent = spec.Parent;

				/* Its values as they were made: what changed of them while it lived goes into a recipe (Save). */
				if (!kept) {
					object.Composed = JSON.parse(JSON.stringify(object.Values));

					crew(object);
				}

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
			/* The days bodies have turned: by the time of the scene, or at the pace of DaySeconds. */
			var turned = number(self.DaySeconds, 0) ? scene.Seconds / number(self.DaySeconds, 0) : time;

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
					angle = Math.PI * 2 * time / Math.max(0.01, number(orbit.Period, 0.6)) + (orbit.Anomaly === undefined || orbit.Anomaly === null ? object.Seed : number(orbit.Anomaly, 0) * Math.PI / 180);
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

				/* What is driven says itself where it is and how it lies. */
				if (object.Flight && object.Flight.At) {
					object.World = object.Flight.At;
					object.Position = object.World;
					object.Relative = vectors.Subtract(object.World, base);
				}

				if (object.Flight && object.Flight.Turn)
					object.Turn = object.Flight.Turn;

				/* Its own turn: a body by its day and tilt (one face to its parent without a day), a model by its spin. */
				if (body) {
					day = number(body.Day, 24);
					angle = day ? Math.PI * 2 * turned * 24 / day : Math.atan2(object.Relative ? object.Relative[0] : 0, object.Relative ? object.Relative[2] : 1) + Math.PI;
					object.Turn = graphics.Multiply(graphics.Rotation([1, 0, 0], number(body.Tilt, 0) * Math.PI / 180), graphics.Rotation([0, 1, 0], angle));
				}
				else if (trait(object, 'Star')) {
					object.Turn = graphics.Rotation([0, 1, 0], turned * 0.1);
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
			gpu.StarsTurned = renderer.Program(shaders.FarTurned, shaders.Dot);
			gpu.Ground = renderer.Program(shaders.GroundVertex, shaders.Ground);
			gpu.Land = renderer.Program(shaders.LandVertex, shaders.Land);
			gpu.LandOf = function (own) {
				own.Programs.Land = own.Programs.Land || renderer.Program(shaders.LandVertex, own.Fragments.Land);

				return own.Programs.Land;
			};
			gpu.ManyDepth = renderer.Program(shaders.Instanced, shaders.Depth);
			gpu.Pbr = renderer.Program(shaders.Instanced, shaders.Pbr);
			gpu.PbrSkinned = renderer.Program(shaders.Skinned, shaders.Pbr);
			gpu.GlowMany = renderer.Program(shaders.Instanced, shaders.BodyGlow);
			gpu.GlowSkinned = renderer.Program(shaders.Skinned, shaders.BodyGlow);
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

		/* The stars of a night sky from the ground: the sky of a planet, faint ones by the thousand and a few bright. */
		function nightStars () {
			var generator = astronomy.Random('night');
			var positions = [];
			var colors = [];
			var i;

			for (i = 0; i < 9000; i++) {
				var z = generator.Float(-1, 1);
				var angle = generator.Float(0, Math.PI * 2);
				var radius = Math.sqrt(1 - z * z);
				var color = paint(astronomy.Color(generator.Pick([3200, 4500, 5600, 6500, 8000, 12000])));

				positions.push(Math.cos(angle) * radius * 50, z * 50, Math.sin(angle) * radius * 50);
				colors.push(color[0], color[1], color[2], Math.pow(generator.Next(), 6));
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
					Size: generator.Float(0.03, 0.11) * (self.Scale === 'real' ? 0.02 : 1) * (round ? parent.Size : 1) * number(settings.Rocks, 1),
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
			if (!elapsed || !renderer || scene.Seconds < 6 || self.Sown && self.Sown().Waiting) return;

			/* A quality that was chosen is kept: the picture stays as sharp as it can be. */
			if (self.Quality) {
				if (scene.Ratio !== scene.Most) {
					scene.Ratio = scene.Most;

					renderer.Resize(scene.Width, scene.Height, scene.Ratio);
				}

				return;
			}

			scene.Steady++;

			if (elapsed > 0.026) {
				scene.Slow++;
				scene.Fast = 0;
			}
			else if (elapsed < 0.02) {
				scene.Fast++;
				scene.Slow = 0;
			}

			if (scene.Slow > 20 && scene.Ratio > Math.max(0.7, scene.Most * 0.5)) {
				scene.Ratio = Math.max(0.7, scene.Most * 0.5, scene.Ratio * 0.8);
				scene.Slow = 0;

				/* It went up and could not hold it: longer before the next try, so the picture does not pump. */
				if (scene.Steady < 300)
					scene.Patience = Math.min(3600, scene.Patience * 2);

				renderer.Resize(scene.Width, scene.Height, scene.Ratio);
			}
			else if (scene.Fast > scene.Patience && scene.Ratio < scene.Most) {
				scene.Ratio = Math.min(scene.Most, scene.Ratio * 1.15);
				scene.Fast = 0;
				scene.Steady = 0;

				renderer.Resize(scene.Width, scene.Height, scene.Ratio);
			}
		}

		/* The view: smoothly to the object in focus (following it as it goes), then round it. */
		function aim (elapsed) {
			var focus = scene.Focus ? scene.Objects[scene.Focus] : null;
			var camera = scene.Camera;
			var flight = scene.Flight;
			var wanted;
			var moved = scene.Moving;
			var eased;

			var flown2 = scene.Objects[scene.Hero];

			if (flown2 && flown2.Values.Vehicle && engine.VehicleStep(flown2, engine.PadKeys(scene.Keys), elapsed) && engine.ShipView(flown2, elapsed)) {
				scene.Eye = camera.Position.slice();
				camera.Near = Math.max(1e-6, flown2.Size * 0.05);
				camera.Far = Math.max(scene.Distance * 40, extent() * 6);

				return;
			}

			steer(elapsed);

			wanted = vectors.Add(focus && focus.World ? focus.World : [0, 0, 0], scene.Pan);
			scene.Moving = moved = Math.min(1, moved + elapsed / (flight ? flight.Length : 0.9));

			if (flight) {
				eased = moved * moved * moved * (moved * (moved * 6 - 15) + 10);

				flown(flight, wanted, eased, Math.min(1, moved * 2.5));
			}
			else {
				eased = moved * moved * (3 - 2 * moved);
				scene.Target = vectors.Lerp(scene.From, wanted, eased);
				scene.Distance += (scene.Wanted - scene.Distance) * (1 - Math.exp(-elapsed * 9));

				camera.Orbit(scene.Target, scene.Yaw, scene.Pitch, scene.Distance);
			}

			scene.Eye = camera.Position.slice();
			camera.Near = Math.max(1e-6, scene.Distance * 0.002);
			camera.Far = scene.Distance * 40 + extent() * 6;
		}

		/* The axes of the view: where it looks, to its right, up from it. */
		function viewAxes () {
			var forward = vectors.Normalize(vectors.Subtract(scene.Camera.Target, scene.Camera.Position));
			var right = vectors.Normalize(vectors.Cross(forward, [0, 1, 0]));

			return {Forward: forward, Right: right, Up: vectors.Cross(right, forward)};
		}

		/* The lens: how wide it is open (Bokeh) and the distance in focus: the one given, the body of the hero, or 0 (the middle of the view). */
		function lens () {
			var hero = scene.Hero ? scene.Objects[scene.Hero] : null;
			var given = number(self.BokehFocus, 0);

			return {Bokeh: Math.max(0, Math.min(1, number(self.Bokeh, 0))), Focus: given > 0 ? given : hero && hero.World && scene.Eye ? vectors.Distance(vectors.Add(hero.World, [0, (hero.Size || 1) * 0.6, 0]), scene.Eye) : 0};
		}

		/* The keys of a free view in space: WASD go, Q and E turn, R and F tilt. */
		function steer (elapsed) {
			var keys = engine.PadKeys(scene.Keys);
			var axes = viewAxes();
			var speed = scene.Distance * 0.8 * elapsed;
			var pad = keys.Pad;

			turnKeys(keys, elapsed);

			if (keys.KeyW)
				scene.Pan = vectors.Add(scene.Pan, vectors.Scale(axes.Forward, speed));

			if (keys.KeyS)
				scene.Pan = vectors.Add(scene.Pan, vectors.Scale(axes.Forward, -speed));

			if (keys.KeyD)
				scene.Pan = vectors.Add(scene.Pan, vectors.Scale(axes.Right, speed));

			if (keys.KeyA)
				scene.Pan = vectors.Add(scene.Pan, vectors.Scale(axes.Right, -speed));

			if (pad.X || pad.Y)
				scene.Pan = vectors.Add(scene.Pan, vectors.Add(vectors.Scale(axes.Forward, speed * pad.Y), vectors.Scale(axes.Right, speed * pad.X)));
		}

		/*
		 * The keys of a frame with the pads in them (Gamepad: a pad on the screen, a phone that leans, a real one): A is Space,
		 * B KeyC, RB or the press of the left stick Shift (run, drift, boost), LB Alt; the sticks and the triggers as they
		 * lean, in Pad: {X (right), Y (ahead), LookX, LookY (up), Gas, Brake}, for what moves by how far (a walk, a wheel).
		 */
		engine.PadKeys = function (keys) {
			var gamepad = self.$Service('Gamepad');
			var axes = gamepad.Axes();
			var made = Object.assign({}, keys);
			var buttons = {a: 'Space', b: 'KeyC', rb: 'ShiftLeft', ls: 'ShiftLeft', lb: 'AltLeft'};

			Object.keys(buttons).forEach(function (button) {
				if (gamepad.Held(button))
					made[buttons[button]] = true;
			});

			made.Pad = {X: axes.LeftX, Y: -axes.LeftY, LookX: axes.RightX, LookY: -axes.RightY, Gas: axes.RightTrigger, Brake: axes.LeftTrigger};

			return made;
		};

		/* How far ahead and aside: the keys, and the left stick of a pad as far as it leans. */
		function leaning (keys) {
			var pad = keys.Pad || {X: 0, Y: 0};
			var ahead = (keys.ArrowUp || keys.KeyW ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0) + pad.Y;
			var aside = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0) + pad.X;

			return [Math.max(-1, Math.min(1, ahead)), Math.max(-1, Math.min(1, aside))];
		}

		/* Q and E turn the view, R and F tilt it; the right stick of a pad as far as it leans. */
		function turnKeys (keys, elapsed) {
			var least = scene.Ground ? -1.3 : -1.5;
			var pad = keys.Pad;

			if (pad && (pad.LookX || pad.LookY)) {
				scene.Yaw -= pad.LookX * elapsed * 2;
				scene.Pitch = Math.max(least, Math.min(1.5, scene.Pitch + pad.LookY * elapsed * 1.5));
			}

			if (keys.KeyQ)
				scene.Yaw += elapsed * 1.3;

			if (keys.KeyE)
				scene.Yaw -= elapsed * 1.3;

			if (keys.KeyR)
				scene.Pitch = Math.min(1.5, scene.Pitch + elapsed);

			if (keys.KeyF)
				scene.Pitch = Math.max(least, scene.Pitch - elapsed);
		}

		/* The view moved along the screen by pixels: over a ground it lets the object in focus go; a hero it never leaves. */
		engine.PanView = function (dx, dy) {
			var axes = viewAxes();
			var step = scene.Distance * Math.tan(scene.Camera.Fov * Math.PI / 360) * 2 / Math.max(1, scene.Height);
			var flat = vectors.Normalize([axes.Forward[0] || 1e-6, 0, axes.Forward[2]]);

			if (scene.Surface || scene.Hero) return;

			if (scene.Ground && scene.Ground.Target) {
				scene.Focus = '';
				scene.Given.Focus = '';
				self.Focus = '';
				scene.Ground.Target = vectors.Add(scene.Ground.Target, vectors.Add(vectors.Scale(axes.Right, -dx * step), vectors.Scale(flat, dy * step / Math.max(0.3, Math.abs(axes.Forward[1])))));

				return;
			}

			scene.Pan = vectors.Add(scene.Pan, vectors.Add(vectors.Scale(axes.Right, -dx * step), vectors.Scale(axes.Up, dy * step)));
		};

		/*
		 * A flight: the eye goes through space from where it was to where it will orbit, over an arc, while the view turns to
		 * the target in the first part of the way. Nothing else moves, so the system does not seem to turn.
		 */
		function flown (flight, wanted, eased, turned) {
			var camera = scene.Camera;
			var look = vectors.Lerp(flight.Target, wanted, turned * turned * (3 - 2 * turned));
			var eye;

			camera.Orbit(wanted, scene.Yaw, scene.Pitch, scene.Wanted);

			eye = vectors.Lerp(flight.Eye, camera.Position, eased);
			eye[1] += Math.sin(eased * Math.PI) * flight.Arc;

			camera.Position = eye;
			camera.Target = look;
			scene.Target = look;
			scene.Distance = Math.max(1e-6, vectors.Distance(eye, look));

			if (eased >= 1) {
				scene.Flight = null;
				scene.Distance = scene.Wanted;
			}
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
			var travel;

			if (id && !object) return false;

			scene.From = scene.Target.slice();
			scene.Moving = 0;
			scene.Pan = [0, 0, 0];
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

			scene.Flight = null;

			if (!quiet && !scene.Ground && !scene.Surface) {
				travel = vectors.Distance(scene.Eye, object && object.World ? object.World : [0, 0, 0]);
				scene.Flight = {Eye: scene.Eye.slice(), Target: scene.Target.slice(), Length: Math.min(3.6, 1.4 + Math.log(1 + travel / Math.max(scene.Wanted, 1e-6)) * 0.3), Arc: travel * 0.08};
			}

			if (!quiet)
				self.$Emit('focus', {ID: scene.Focus});

			return true;
		}

		/* The air far off under clouds, in the light of the picture: the bellies of the clouds in rain go to it, so there is no line. */
		function hazeOf (ground) {
			var tint = ground.AirTint || [0.55, 0.72, 1];
			var veil = ground.Air.Fog * (ground.Air.Rain > 0.05 ? 1 : 0.6);

			return [0, 1, 2].map(function (index) {
				return Math.pow(tint[index] * 0.6 + 0.4, 2.2) * ground.AirLight + Math.pow(ground.Glow[index], 2.2) * 0.3;
			}).concat([Math.min(0.62, veil * 1.8)]);
		}

		/* The layer of clouds over a ground: high over its hills, its noise as large as the land allows. */
		function groundClouds () {
			var ground = scene.Ground;
			var low = Math.max(ground.Field.Top * 1.6, 90);
			var sky = ground.SkyLight;
			var light = ground.SunColor;

			var day = ground.Day;
			var rise = ground.Sky[1];
			var glow = (1 - Math.min(1, Math.abs(rise) / 0.3)) * day;
			var moonlit = rise < 0 ? 1.3 : 1.6;

			/* By night a cloud shows only by what lights it: without a moon or towns it is dark, and hides the stars. */
			var tone = (0.5 + 0.7 * day) * Math.min(1, day * 1.6 + ground.MoonLit * 0.6);

			/* The moon lights a cloud faintly; a low sun lights it from under, red over gold. */
			return {Turn: [1, 0, 0, 0, 1, 0, 0, 0, 1], From: scene.Eye, Sun: ground.Sky[1] > -0.05 ? ground.Sky : ground.Sun, SunLight: [light[0] * moonlit, light[1] * moonlit, light[2] * moonlit], SkyTone: [sky[0] * tone, sky[1] * tone, sky[2] * tone], Under: [1.2 * glow, 0.42 * glow, 0.2 * glow], Below: ground.Glow, BelowWay: ground.GlowWay, Haze: hazeOf(ground), Layer: [low, low * 2.2, 1.1 / low], Over: false};
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
			var projection = camera.Projection(aspect);
			var plain = graphics.Multiply(projection, viewMatrix);
			var matrix = scene.Ground ? graphics.Multiply(engine.PostJitter(projection), viewMatrix) : plain;
			var right = [viewMatrix[0], viewMatrix[4], viewMatrix[8]];
			var up = [viewMatrix[1], viewMatrix[5], viewMatrix[9]];
			var light = lights();
			var background = scene.Colors.Background;
			var models = gather();
			var nodes;
			var shade;
			var posted;

			engine.CosmosBake();

			/* First: a village it lays out makes the ground again. */
			engine.ScatterFrame(matrix);

			nodes = scene.Ground ? groundPatches() : null;
			shade = shadowOfScene(models, nodes);

			if (scene.Ground)
				Object.assign(shade, engine.FieldLight(matrix), localLights(), scene.Camera.Ortho ? {uCloudShade: [0, 0, 1, 0], uSkyFloor: 0} : Object.assign(engine.CloudShade(groundClouds(), scene.Ground.Sun), {uSkyFloor: Math.max(0, 1 - scene.Ground.Day * 3) * 0.55}));

			/* What burns on a ship lights it in space as well. */
			if (!scene.Ground)
				Object.assign(shade, localLights());

			var common = Object.assign({uViewProjection: matrix, uCamera: [0, 0, 0], uLightPositions: light.Positions, uLightColors: light.Colors, uLightCount: light.Count, uSkyLight: scene.Ground ? scene.Ground.SkyLight : [0.004, 0.004, 0.006], uFloorLight: scene.Ground ? scene.Ground.FloorLight : [0.004, 0.004, 0.006], uAmbient: scene.Ground ? [0.17, 0.19, 0.23] : scene.CosmosShade ? [0.025 + scene.CosmosShade[0], 0.027 + scene.CosmosShade[1], 0.035 + scene.CosmosShade[2]] : [0.025, 0.027, 0.035], uOccluderCount: 0, uOccluders: new Array(16).fill(0), uTime: scene.Time, uHighlight: [0, 0, 0, 0], uWind: scene.Gust || 0, uWet: scene.Ground ? scene.Ground.Air.Wet : 0, uSnowed: scene.Ground ? scene.Ground.Air.Cover || 0 : 0, uRainDrops: scene.Ground ? scene.Ground.Air.Rain : 0, uEyeAt: scene.Eye || [0, 0, 0], uTime2: scene.Seconds % 1000}, shade);
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

			/*
			 * The mirrors first, each the world drawn again as its plane reflects it, from the eye at the origin: the world through
			 * the reflection, a near plane laid along the mirror (what is behind it is not in it), the triangles turning the other way.
			 */
			var mirrored = scene.Ground && !scene.Camera.Ortho ? mirrorsOf(projection, viewMatrix, function (vp, eye) {
				var mine = Object.assign({}, common, {uViewProjection: vp, uCamera: eye, uMoving: 0, uSteady: 0, uCut: [0, 0, 0, 0]});

				drawGround(vp, nodes, shade, true);

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					if (list.Material && seeThrough(list.Material)) return;

					if (list.Material) renderer.Draw(shape(name), pbrOf(list), Object.assign({}, mine, {uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft}, surface(list), blueprintValues(list)), {Cull: list.Material.DoubleSided ? 'none' : 'back'});
					else renderer.Draw(shape(name), gpu.Many, Object.assign({}, mine, {uShine: list.Matte ? 8 : 36, uSpecular: list.Matte ? 0.05 : 0.5, uRough: list.Rough, uOrigin: originOf(list)}));
				});

				if (self.Graphics().Level !== 'low')
					engine.ScatterDraw(mine, vp);
			}) : {};

			posted = engine.PostBegin();

			renderer.Clear([background[0], background[1], background[2], 1]);

			if (scene.Ground)
				drawGround(matrix, nodes, shade);

			if (!scene.Ground)
				engine.CosmosDraw(plain, plain);

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
						/* The wide veil first: the disc does not end at once at black space. */
						renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(object.World), uSize: size * 11, uRight: right, uUp: up, uColor: paint(object.Color).slice(0, 3).map(function (part) {
							return part * 0.3;
						}), uInner: 0.09, uStyle: 0}), {Blend: 'add', DepthWrite: false, Cull: 'none'});

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
					var blended = seeThrough(list.Material);

					var drawn = function () {
						renderer.Draw(shape(name), pbrOf(list), Object.assign(uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft, uMoving: list.Still || blended ? 0 : 1, uSteady: list.Still ? 0 : 1, uCut: heroCut(list)}), surface(list), blueprintValues(list)), {Cull: list.Material.DoubleSided ? 'none' : 'back', Blend: blended ? 'over' : 'none', DepthWrite: !blended});
					};

					/* What is seen through comes after all it shows, and hides nothing of what is drawn after it. */
					if (blended) later.push(drawn);
					else drawn();

					return;
				}

				renderer.Draw(shape(name), gpu.Many, uniforms({uShine: list.Matte ? 8 : 36, uSpecular: list.Matte ? 0.05 : 0.5, uRough: list.Rough, uOrigin: originOf(list), uMoving: list.Still ? 0 : 1}));
			});

			/* The mirrors as panes of what they show, the glass after all it shows through. */
			if (scene.Ground)
				drawPanes(uniforms, mirrored, later);

			/* What glows: its surfaces once more, their light added, brightest at their edges; bloom spreads it round them. */
			Object.keys(scene.GlowLists || {}).forEach(function (name) {
				var list = scene.GlowLists[name];
				if (list.Count)
					renderer.Draw(shape(name), list.Skinned ? gpu.GlowSkinned : gpu.GlowMany, uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uTime: scene.Seconds, uFlat: list.Flat ? 1 : 0}), {Blend: 'add', DepthWrite: false, Depth: 'lequal', Cull: list.Material && list.Material.DoubleSided ? 'none' : 'back'});
			});

			engine.ScatterDraw(common, matrix);

			/* What shines has a glow of its own where it stands, but a lamp a body carries: it would hang over it. */
			(scene.Ground ? scene.Lamps || [] : []).forEach(function (lamp) {
				if (lamp.Built || lamp.Effect || lamp.Object.Values.Follow || lamp.Settings.Follow) return;

				later.push(function () {
					renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(lamp.At), uSize: (0.5 + number(lamp.Settings.Radius, 14) * 0.03) * (1 + scene.Ground.Air.Fog * 3), uRight: right, uUp: up, uColor: lamp.Color, uInner: 0, uStyle: 0}), {Blend: 'add', DepthWrite: false, Cull: 'none'});
				});
			});

			custom('Draw');

			if (scene.Ground)
				drawSea(matrix, posted);

			if (scene.Ground && posted)
				engine.FallDraw(matrix, scene.Eye, scene.Ground);

			engine.BoltDraw(matrix, scene.Eye, scene.Ground);

			later.forEach(function (each) {
				each();
			});

			/*
			 * A ship on its way far at once: the stars drawn out behind all that stands; as the tunnel opens it comes nearer, to
			 * just behind the ship, and hides what it goes by.
			 */
			if (!scene.Ground && scene.Warp && scene.Objects[scene.Warp.ID] && scene.Objects[scene.Warp.ID].Travel) {
				var traveller = scene.Objects[scene.Warp.ID];
				var forward = vectors.Normalize(vectors.Subtract(camera.Target, camera.Position));
				var furthest = camera.Far * 0.9;
				var opened = Math.min(1, scene.Warp.Tunnel * 2);
				var reach = furthest + (vectors.Distance(traveller.World, camera.Position) * 2.5 - furthest) * opened * opened * (3 - 2 * opened);

				engine.CosmosWarp(plain, Object.assign({Depth: Math.min(0.99999, graphics.Apply(plain, vectors.Scale(forward, reach))[2])}, scene.Warp));
			}

			if (self.Origin && self.Origin !== 'false')
				drawOrigin(matrix);

			engine.EffectsDraw(matrix, {Right: right, Up: up, Forward: [-viewMatrix[2], -viewMatrix[6], -viewMatrix[10]], Near: camera.Near, Far: camera.Far});

			/* The mark of the selected object while it is small on the screen: near, its own glow shows it. */
			if (selected && selected.World && Math.max(selected.Size, 0.001) < pixels(selected.World, 40)) {
				renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(selected.World), uSize: Math.max(selected.Size * 1.5, pixels(selected.World, 14)), uRight: right, uUp: up, uColor: scene.Colors.Selection.slice(0, 3), uInner: 0, uStyle: 1}), {Blend: 'add', DepthWrite: false, Depth: false, Cull: 'none'});
			}

			if (posted)
				engine.PostEnd(scene.Ground ? {Matrix: matrix, Plain: plain, Eye: scene.Eye, Sun: scene.Ground.Sun, SunColor: scene.Ground.SunColor, Night: scene.Ground.Night, Shimmer: engine.EffectHeat(matrix, width / Math.max(1, height)), Exposure: self.Exposure, Air: scene.Ground.AirTint, Veil: scene.Ground.Air.Fog * (scene.Ground.Air.Rain > 0.05 ? 1 : 0.6), Clouds: scene.Camera.Ortho ? null : groundClouds(), Glare: scene.Ground.Glare, AirLight: scene.Ground.AirLight, AirGlow: scene.Ground.Glow, AirGlowWay: scene.Ground.GlowWay, Fog: scene.Camera.Ortho ? 0 : (scene.Ground.Field.Whole ? 0.12 : 0.4) / Math.max(scene.Ground.Field.Size, 300) + scene.Ground.Air.Fog * 0.011, FogLow: scene.Camera.Ortho ? [0, 0, 0] : [Math.max(0, scene.Eye[1] - Math.max(0, scene.Ground.Field.Height(scene.Eye[0], scene.Eye[2]))), 1 / Math.max(6, scene.Ground.Field.Top * 0.2), scene.Ground.Air.Fog * 0.03], Sky: true, Reach: Math.max(1, scene.Distance * 0.05), Bokeh: lens().Bokeh, Focus: lens().Focus} : Object.assign({Matrix: matrix, Plain: plain}, spaceSun(plain, camera), lens()));
		}

		function nearestStar () {
			return scene.Active.filter(function (object) {
				return trait(object, 'Star') && object.World;
			}).sort(function (a, b) {
				return vectors.Distance(a.World, scene.Eye) - vectors.Distance(b.World, scene.Eye);
			})[0];
		}

		/* The star that shuts the eye to what stands beside it. */
		engine.NearestStar = function () {
			var star = scene.Ground ? null : nearestStar();

			return star ? {At: star.World, Size: star.Size, Veil: number(trait(star, 'Star').Veil, 3)} : null;
		};

		/*
		 * The sun of a system to the picture of it: where it is, how large it looks, and from what depth on nothing hides it. It blinds as a
		 * sun over a ground does, the less the farther off it is.
		 */
		function spaceSun (matrix, camera) {
			var star = nearestStar();
			if (!star)
				return {};

			var to = vectors.Subtract(star.World, scene.Eye);
			var far = vectors.Length(to);
			var way = vectors.Normalize(to);
			var front = vectors.Scale(way, Math.max(far - star.Size, camera.Near * 2));
			var clip = [matrix[2] * front[0] + matrix[6] * front[1] + matrix[10] * front[2] + matrix[14], matrix[3] * front[0] + matrix[7] * front[1] + matrix[11] * front[2] + matrix[15]];

			return {Sun: way, SunColor: paint(star.Color).slice(0, 3), Star: true, Ring: Math.abs(matrix[5]) * 0.5 * star.Size / far, Clear: Math.min(0.9999, (clip[0] / Math.max(clip[1], 1e-6)) * 0.5 + 0.5 - 1e-6), Glare: Math.min(1, Math.pow(star.Size / far * 7, 1.3))};
		}

		/* The copies of the shapes of a frame: the rocks of the belts, the models of the objects, their pieces as they stand now. */
		function gather () {
			var models = scene.Lists = scene.Lists || {};
			var glows = scene.GlowLists = scene.GlowLists || {};
			var drawn = {};

			Object.keys(models).forEach(function (name) {
				models[name].Count = 0;
			});

			Object.keys(glows).forEach(function (name) {
				glows[name].Count = 0;
			});

			if (engine.EffectGlow)
				engine.EffectGlow();

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
				if (settings && (settings.Shape || object.Values.Model))
					gatherModel(models, object, settings);
			});

			Object.keys(models).forEach(function (name) {
				if (models[name].Count)
					upload(name, models[name]);

				if (models[name].Count)
					drawn[name] = models[name];
			});

			Object.keys(glows).forEach(function (name) {
				if (glows[name].Count)
					upload(name, glows[name]);
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

		/* Leaves come as blended surfaces of two sides: cut by their alpha they need no order. Glass stays blended. */
		function cutOut (material) {
			return material.Alpha === 'BLEND' && material.DoubleSided && !material.Transmission && !/glass/i.test(material.Name);
		}

		function seeThrough (material) {
			return material.Alpha === 'BLEND' && !cutOut(material);
		}

		/* The textures of a material on this renderer, made once; a white one for what it has none of. */
		function surface (list) {
			var material = list.Material;
			var asset = list.Asset;

			function texture (map, srgb) {
				var image = map ? asset.Images[map.Image] : null;
				var made;

				if (!gpu.White)
					gpu.White = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255, 255, 255, 255])}, {Nearest: true});

				if (!image || !image.Picture) return gpu.White;

				/* A model is shared by the scenes of a page, a texture belongs to one of them. */
				gpu.Pictures = gpu.Pictures || new WeakMap();

				if (!gpu.Pictures.has(image))
					gpu.Pictures.set(image, {});

				made = gpu.Pictures.get(image);

				if (!made[srgb ? 'Srgb' : 'Plain'])
					made[srgb ? 'Srgb' : 'Plain'] = renderer.Texture(image.Picture, {Srgb: srgb, Mipmaps: true, Repeat: true});

				return made[srgb ? 'Srgb' : 'Plain'];
			}

			/* A material is shared by the scenes of a page; what it holds of a renderer is not. */
			gpu.Surfaces = gpu.Surfaces || new WeakMap();

			if (!gpu.Surfaces.has(material)) {
				gpu.Surfaces.set(material, {
					uBaseColor: material.BaseColor,
					uMetallic: material.Metallic,
					uRoughness: material.Roughness,
					uEmissive: material.Emissive,
					uClearcoat: material.Clearcoat || 0,
					uGlass: material.Alpha === 'BLEND' ? material.Transmission || 0 : 0,
					uCoatRough: material.CoatRoughness || 0,
					uCutoff: material.Alpha === 'MASK' ? material.Cutoff : cutOut(material) ? 0.4 : 0,
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
				});
			}

			return gpu.Surfaces.get(material);
		}

		/*
		 * A material with a Blueprint (a material graph of the Blueprints Service, with its Parameters) is drawn by PBR with the
		 * surface of the graph in the place of its empty one: the color, the alpha, the roughness, the metal, the glow and the
		 * normal of each point. Its Texture blocks named Color, Normal, Metal, Emissive, Occlusion or Specular read the maps of
		 * the material. A ground with a Blueprint is drawn by Land the same way (its color, glow and normal). A graph that cannot be
		 * made is told once, and the material is drawn as it is. host: the shader it goes into, Pbr by default.
		 */
		function blueprinted (material, host) {
			var maps = {Color: 'uColorMap', Normal: 'uNormalMap', Metal: 'uMetalMap', Emissive: 'uEmissiveMap', Occlusion: 'uOcclusionMap', Specular: 'uSpecularMap'};
			var own;
			var made;
			var hook = 'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {}';
			var lines;

			gpu.Blueprinted = gpu.Blueprinted || new WeakMap();
			own = gpu.Blueprinted.get(material);

			host = host || 'Pbr';

			if (own && own.Source === material.Blueprint && (!own.Made || own.Fragments[host])) return own.Made ? own : null;

			if (!own || own.Source !== material.Blueprint)
				own = {Source: material.Blueprint, Made: null, Programs: {}, Fragments: {}};

			gpu.Blueprinted.set(material, own);

			try {
				made = own.Made || self.$Service('Blueprints').Compile(typeof material.Blueprint === 'string' ? JSON.parse(material.Blueprint) : material.Blueprint);

				if (made.Type !== 'material')
					throw new Error('a ' + made.Type + ' graph is no material');

				/* What the shader has already (its uniforms, its parts of shaders) is not declared again. */
				lines = made.Uniforms.filter(function (uniform) {
					return shaders[host].indexOf(' ' + uniform.Name + ';') === -1;
				}).map(function (uniform) {
					return 'uniform ' + uniform.Type + ' ' + uniform.Name + ';';
				}).concat(made.Textures.map(function (texture) {
					return maps[texture.Name] ? '#define ' + texture.Uniform + ' ' + maps[texture.Name] : 'uniform sampler2D ' + texture.Uniform + ';';
				})).concat(made.Needs.filter(function (need) {
					return shaders[host].indexOf(graphics.Chunks[need]) === -1;
				}).map(function (need) {
					return graphics.Chunks[need];
				}));

				own.Fragments[host] = shaders[host].replace(hook, function () {
					return lines.concat([made.Function]).join('\n');
				});
				own.Made = made;
			}
			catch (error) {
				if (window.console && window.console.warn)
					window.console.warn('Elemenx GameScene: the Blueprint of material ' + (material.Name || '') + ' cannot be made: ' + error.message);

				return null;
			}

			return own;
		}

		/* The program of a material: PBR, or PBR with the surface of its Blueprint. */
		function pbrOf (list) {
			var own = list.Material.Blueprint ? blueprinted(list.Material) : null;
			var key = list.Skinned ? 'Skinned' : 'Plain';

			if (!own)
				return list.Skinned ? gpu.PbrSkinned : gpu.Pbr;

			own.Programs[key] = own.Programs[key] || renderer.Program(list.Skinned ? shaders.Skinned : shaders.Instanced, own.Fragments.Pbr);

			return own.Programs[key];
		}

		/* The uniforms of the Blueprint of a material: its parameters (those of the material over their values) and the time. */
		function blueprintValues (list) {
			var own = list.Material.Blueprint ? blueprinted(list.Material) : null;

			return own ? own.Made.Values(list.Material.Parameters || {}, {Time: scene.Seconds % 3000}) : null;
		}

		/* The frames of the skeleton of a model, as a texture. */
		function palette (model) {
			var baked = model.Baked;
			var textures;

			gpu.Palettes = gpu.Palettes || {};
			gpu.Palettes[model.Key] = gpu.Palettes[model.Key] || {};
			textures = gpu.Palettes[model.Key];

			/* While its frames are being made a model stands in the first of them. */
			if (!baked) {
				if (!textures.Standing)
					textures.Standing = renderer.Texture({Width: model.Joints * 3, Height: 1, Data: new Float32Array(model.Baking.Frames[0])}, {Float: true, Nearest: true});

				return textures.Standing;
			}

			if (!textures.Palette)
				textures.Palette = renderer.Texture({Width: baked.Width, Height: baked.Height, Data: baked.Data}, {Float: true, Nearest: true});

			return textures.Palette;
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

			if (object.Values.Vehicle && !object.Wheels) {
				engine.OpeningsOf(made, object.Values.Vehicle);

				object.Wheels = engine.WheelsOf(made, object.Values.Vehicle);
			}

			pose = (made.Pieces.length > 1 || made.Moves) && !still ? poseOf(object, made, settings) : null;
			object.Worn = made.Asset;

			if (object.ID === scene.Hero && scene.Inside > 0.01 && pose && object.Clip && !object.Values.Vehicle) {
				var headBone = library.BoneMatrix(made, 'Head', object.Clip.Name, clipMoment(object.Clip));

				object.Head = headBone ? graphics.Apply(base, [headBone[12], headBone[13], headBone[14]]) : null;
			}

			if (pose && object.Values.Hold)
				gatherHeld(models, object, made, base);

			if (object.Values.Vehicle && object.Values.Vehicle.Mounts)
				gatherMounts(models, object, base);

			made.Pieces.forEach(function (piece) {
				if (made.Asset) {
					var rest = pose ? pose[piece.ID] : piece.Rest;
					var wheel = object.Wheels ? object.Wheels[piece.ID] : null;
					var shifted = piece.Opening ? engine.OpeningMove(object, piece) : null;
					var whole = shifted ? graphics.Multiply(base, shifted) : base;
					var lit = piece.Opening ? engine.LampGlow(object, piece) : null;

					batch(models, (still ? 'still:' : '') + made.Key + '/' + piece.ID, object.World, piece.Skin !== -1 ? whole : graphics.Multiply(whole, wheel ? graphics.Multiply(engine.WheelTurn(object, wheel), rest) : rest), color, {Rough: 0, Geometry: piece.Geometry, Still: still, Material: piece.Material, Asset: made.Asset, Skinned: piece.Skin !== -1 ? made : null, Offset: piece.JointOffset, Frames: piece.Skin !== -1 ? object.Frames || [0, 0, 0, 0] : null, Soft: softOf(object, made, piece), Glow: object.Glow && object.Glow.Body ? object.Glow.Color : lit, Lit: !!lit && !(object.Glow && object.Glow.Body), Wet: object.Values.Wet, Drops: object.Values.Drops});

					return;
				}

				batch(models, (still ? 'still:' : '') + made.Key + '/' + piece.ID, object.World, pose ? graphics.Multiply(base, pose[piece.ID]) : base, piece.Team ? team : color, {Matte: made.Matte, Rough: made.Matte ? 0.5 : 0.15, Sway: made.Sway, Geometry: piece.Geometry, Still: still, Glow: object.Glow && object.Glow.Body ? object.Glow.Color : null, Wet: object.Values.Wet, Drops: object.Values.Drops});
			});
		}

		/* What of a hero stands round the eye in its head is not drawn; its shadow is, for that comes of another pass. */
		function heroCut (list) {
			var hero = scene.Objects[scene.Hero];

			return hero && !hero.Values.Vehicle && scene.Inside > 0.6 && scene.CutAt && list.Asset && list.Asset === hero.Worn ? local(scene.CutAt).concat([hero.Size * 0.17]) : [0, 0, 0, 0];
		}

		/* The clip an object plays: what it was told, or walking on a way, or its own; a change fades from the last one. */
		function poseOf (object, made, settings) {
			var way = scene.Ways[object.ID];
			var state = object.Clip;
			var pace = object.Pace && made.Clips[object.Pace] ? object.Pace : 'walk';
			var wanted = way ? 'walk' : object.Walking ? pace : object.Pose && made.Clips[object.Pose] ? object.Pose : object.Loop || object.Values.Clip || settings.Clip || 'idle';
			var clip = made.Clips[wanted];
			var seconds = scene.Seconds;
			var rate = wanted === 'jump' ? 1.8 : wanted === pace && clip && (way || object.Walking) ? (object.Back && !way ? -1 : 1) * (way ? way.Speed : object.Walking) * (clip.Length || 1) / Math.max(0.01, object.Size * (clip.Stride || 1)) : 1;

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
				state = object.Clip = {Name: wanted, Start: seconds, Rate: rate, From: state ? state.Name : '', FromTime: state ? clipMoment(state) : 0, FromRate: state ? state.Rate : 0, Once: false};
			}

			/* Its time adds up by the rate of each moment: a rate that changes goes on from where it was. */
			state.At = (state.At || 0) + (seconds - (state.Seen === undefined ? state.Start : state.Seen)) * rate;
			state.Seen = seconds;
			state.Rate = rate;

			/* A loop starts at a place of its own for each copy: a crowd does not dance as one. */
			state.Phase = clip && clip.Loop ? (object.Seed || 0) * 7.13 % 1 * (clip.Length || 1) : 0;

			var past = state.FromTime + (seconds - state.Start) * (state.FromRate || 0);

			if (made.Joints) {
				var moment = clipMoment(state);

				object.Frames = library.BakeStep(made, 4) ? [library.Frame(made, state.Name, moment), state.From ? library.Frame(made, state.From, past) : 0, state.From ? Math.max(0, 1 - (seconds - state.Start) / 0.2) : 0, library.Between(made, state.Name, moment)] : [0, 0, 0, 0];
			}

			return library.Pose(made, state.Name, clipMoment(state), {From: state.From, FromTime: past, Fade: (seconds - state.Start) / 0.2});
		}

		/* The second of its clip an object is at. */
		function clipMoment (state) {
			return (state.At || 0) + (state.Phase || 0);
		}

		/*
		 * What an object holds (Hold: {Model, Bone, Aim, At, Turn, Size}): a model that goes with a bone of its skeleton, frame by
		 * frame. With Aim, a second bone, it lies as the two stand at rest, X from the one to the other, and turns with the first.
		 */
		/* What stands on a vehicle, each model where its mount says, in the size of the vehicle. */
		function gatherMounts (models, object, base) {
			var degrees = Math.PI / 180;

			object.Values.Vehicle.Mounts.forEach(function (mount) {
				var turn = mount.Turn || [0, 0, 0];
				var at = mount.At || [0, 0, 0];
				var size = number(mount.Size, 1);

				if (!mount.Model || mount.On === false || !known(mount.Model) || !library.Ready(mount.Model)) return;

				var item = library.Make(mount.Model);
				var place = graphics.Multiply(base, graphics.Multiply(graphics.Translation(at[0], at[1], at[2]), graphics.Multiply(graphics.Multiply(graphics.Rotation([0, 1, 0], turn[1] * degrees), graphics.Multiply(graphics.Rotation([1, 0, 0], turn[0] * degrees), graphics.Rotation([0, 0, 1], turn[2] * degrees))), graphics.Scaling(size, size, size))));

				item.Pieces.forEach(function (piece) {
					if (item.Asset) {
						batch(models, item.Key + '/' + piece.ID, object.World, graphics.Multiply(place, piece.Rest), [1, 1, 1], {Rough: 0, Geometry: piece.Geometry, Material: piece.Material, Asset: item.Asset, Soft: 0});

						return;
					}

					batch(models, item.Key + '/' + piece.ID, object.World, place, [1, 1, 1], {Matte: item.Matte, Rough: item.Matte ? 0.5 : 0.15, Geometry: piece.Geometry});
				});
			});
		}

		function gatherHeld (models, object, made, base) {
			var hold = object.Values.Hold;
			var state = object.Clip;
			var degrees = Math.PI / 180;
			var turn = hold.Turn || [0, 0, 0];
			var at = hold.At || [0, 0, 0];
			var size = number(hold.Size, 1);
			var fade = state.From ? Math.max(0, 1 - (scene.Seconds - state.Start) / 0.2) : 0;
			var bone;
			var item;
			var place;

			/* A bone as the clip has it, and through the fade from the last one. */
			function boneNow (name) {
				var now = library.BoneMatrix(made, name, state.Name, clipMoment(state));
				var from = fade && now ? library.BoneMatrix(made, name, state.From, state.FromTime + (scene.Seconds - state.Start) * (state.FromRate || 0)) : null;

				return from ? now.map(function (value, index) {
					return value * (1 - fade) + from[index] * fade;
				}) : now;
			}

			if (!known(hold.Model)) return;

			if (!library.Ready(hold.Model)) return;

			item = library.Make(hold.Model);
			bone = boneNow(hold.Bone || 'HandR');

			if (!bone) return;

			bone = library.Grip(bone, null);

			if (hold.Aim)
				bone = graphics.Multiply(bone, library.GripTurn(made, hold.Bone || 'HandR', hold.Aim));

			place = graphics.Multiply(graphics.Translation(at[0], at[1], at[2]), graphics.Multiply(graphics.Rotation([0, 0, 1], turn[2] * degrees), graphics.Multiply(graphics.Rotation([0, 1, 0], turn[1] * degrees), graphics.Multiply(graphics.Rotation([1, 0, 0], turn[0] * degrees), graphics.Scaling(size, size, size)))));
			place = graphics.Multiply(base, graphics.Multiply(bone, place));

			item.Pieces.forEach(function (piece) {
				batch(models, item.Key + '/' + piece.ID, object.World, graphics.Multiply(place, piece.Rest), [1, 1, 1], {Rough: 0, Geometry: piece.Geometry, Material: piece.Material, Asset: item.Asset, Skinned: null, Offset: piece.JointOffset, Frames: null, Glow: object.Glow && object.Glow.Held ? object.Glow.Color : null, Wet: object.Values.Wet, Drops: object.Values.Drops});
			});
		}

		/* A copy of a shape for the one draw of all of them: its place relative to the eye, its axes, its colors. */
		function batch (models, name, world, matrix, color, options) {
			var list = models[name];
			var m = matrix;
			var settings = options || {};
			var at = settings.Still ? world : local(world);
			var i;

			/* What glows is drawn once more, apart: its light added over it (Glow, the color of its light). */
			if (settings.Glow && !settings.Still)
				batch(scene.GlowLists, (settings.Lit ? 'lit:' : 'glow:') + name, world, matrix, settings.Glow, Object.assign({}, settings, {Glow: null}));

			if (!list) {
				list = models[name] = {Count: 0, Capacity: 0, Matte: !!settings.Matte, Rough: settings.Rough || 0, Geometry: settings.Geometry || null, Still: !!settings.Still, Material: settings.Material || null, Asset: settings.Asset || null, Skinned: settings.Skinned || null, Offset: settings.Offset || 0, Soft: settings.Soft || 0, Flat: !!settings.Lit};
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

			/* Its own wet and drops, 1 + them; 0, those of the weather. */
			list.X[i + 3] = told(settings.Wet) ? 1 + Math.max(0, Math.min(1, Number(settings.Wet))) : 0;
			list.Y[i + 3] = told(settings.Drops) ? 1 + Math.max(0, Math.min(1, Number(settings.Drops))) : 0;

			if (settings.Frames)
				list.Frames.set(settings.Frames, i);

			list.Count++;
		}

		/* A number told: not empty, not null, a number. */
		function told (value) {
			return value !== undefined && value !== null && value !== '' && !isNaN(Number(value));
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
			var whole = !near && scene.Ground && scene.Ground.Field.Blocked && self.Graphics().Level !== 'low';
			var side = self.Graphics().Level === 'low' ? 1024 : whole ? 4096 : 2048;

			/* The moon gives a wider light than the sun: it is the air that lights the night, and its shadows are soft. */
			var sunWidth = scene.Ground && scene.Ground.Night > 0.5 ? 0.05 : 0.012;
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

			if (!near && (!gpu.ShadowMap || gpu.ShadowMap.Size !== side))
				gpu.ShadowMap = renderer.Shadow(side);

			(nearMap || gpu.ShadowMap).Begin();

			casters(matrix);

			(nearMap || gpu.ShadowMap).End();

			return {uShadowMap: gpu.ShadowMap, uShadowNear: nearMap || gpu.ShadowMap, uShadowRaw: gpu.ShadowMap.Raw, uShadowNearRaw: (nearMap || gpu.ShadowMap).Raw, uShadowSoft: [depth * side * sunWidth / extent, depth * side * sunWidth / extent, self.Graphics().Cascades > 1 ? 1 : 0], uBounce: gpu.NoBounce, uCloudMap: gpu.NoBounce, uBounceOn: 0, uGlow: gpu.NoBounce, uGlowOn: 0, uLampShadow0: gpu.NoShadow, uLampShadow1: gpu.NoShadow, uShadowMatrix: matrix, uShadowBias: texel * 1.6, uShadowOn: 1};
		}

		/* A second map, of what is near the eye: its shadows are as sharp as a texel of it is small. */
		function closer (shade, direction, center, eye, extent, depth, casters) {
			var near = castShadow(direction, center, eye, extent, depth, casters, true);

			shade.uShadowNear = gpu.ShadowClose;
			shade.uShadowNearRaw = gpu.ShadowClose.Raw;
			shade.uShadowSoft = [shade.uShadowSoft[0], near.uShadowSoft[1], shade.uShadowSoft[2]];
			shade.uShadowNearMatrix = near.uShadowMatrix;
			shade.uShadowNearBias = near.uShadowBias;
			shade.uShadowOn = 2;

			return shade;
		}

		/*
		 * A map of all of a ground from above, colors and heights: of the land alone, or with all that stands on it. It is
		 * what the light of a field is worked out on.
		 */
		/* All the ground in one piece, for the map from above: of noise, asked of a worker; true once it is there. */
		engine.GroundTopReady = function () {
			var ground = scene.Ground;
			var field = ground.Field;
			if (ground.TopMesh || !field.Options) return true;

			askPiece(ground, 'top', 'Flat', [0, 0, field.Size, 128], function (piece) {
				ground.TopMesh = renderer.Mesh(piece || field.Chunk(0, 0, field.Size, 128));
			});

			return !!ground.TopMesh;
		};

		engine.GroundTop = function (matrix, things, view) {
			var ground = scene.Ground;
			var field = ground.Field;

			if (!gpu.TopLand) {
				gpu.TopLand = renderer.Program(shaders.LandVertex, shaders.Top);
				gpu.TopMany = renderer.Program(shaders.Instanced, shaders.Top);
			}

			if (!ground.TopMesh)
				ground.TopMesh = renderer.Mesh(field.Chunk(0, 0, field.Size, 128));

			renderer.Draw(ground.TopMesh, gpu.TopLand, {uViewProjection: matrix, uOffset: [0, 0, 0], uCenter: [0, 0, 0]}, {Cull: 'none'});

			if (!things) return;

			Object.keys(scene.StillLists || {}).forEach(function (name) {
				renderer.Draw(shape(name), gpu.TopMany, {uViewProjection: matrix, uOrigin: [0, 0, 0], uWind: 0}, {Cull: 'none'});
			});

			engine.ScatterAll(matrix, shaders.Top, view);
		};

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

			return {uShadowOn: 0, uShadowMap: gpu.NoShadow, uShadowNear: gpu.NoShadow, uShadowRaw: gpu.NoBounce, uShadowNearRaw: gpu.NoBounce, uShadowSoft: [0, 0, 0], uBounce: gpu.NoBounce, uCloudMap: gpu.NoBounce, uBounceOn: 0, uGlow: gpu.NoBounce, uGlowOn: 0, uLampShadow0: gpu.NoShadow, uLampShadow1: gpu.NoShadow};
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
					/* Light goes through glass. */
					if (list.Material && list.Material.Transmission && seeThrough(list.Material)) return;

					renderer.Draw(shape(name), list.Skinned ? gpu.SkinDepth : gpu.ManyDepth, {uViewProjection: matrix, uWind: scene.Gust || 0, uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : undefined, uJointOffset: list.Offset}, {Cull: 'none'});
				});

				(nodes || []).forEach(function (node) {
					renderer.Draw(node.Mesh, gpu.LandDepth, {uViewProjection: matrix, uOffset: vectors.Subtract(node.Center, scene.Eye)}, {Cull: 'back'});
				});

				engine.ScatterShadow(matrix);
			}

			scene.Casters = casters;

			if (!shadowsWanted()) return off;

			if (ground) {
				if (ground.Sun[1] < 0.04) return off;

				/* A location needs room: past the map of the shadows nothing is in shadow, and its edge shows as a square. */
				extent = Math.max(ground.Field.Blocked ? Math.max(90, ground.Field.Size * 0.55) : ground.Field.Whole ? 8 : 30, Math.min(ground.Field.Size, scene.Distance * 1.5));
				set = self.Graphics();
				made = castShadow(ground.Sun, ground.Target, scene.Eye, extent, Math.max(extent * 2, ground.Field.Top * 4), casters);

				if (set.Cascades > 1)
					closer(made, ground.Sun, ground.Target, scene.Eye, Math.min(extent * 0.3, 30), Math.max(extent * 2, ground.Field.Top * 4), casters);

				return set.Bounce && !engine.FieldOn() ? bounced(made, nodes, models) : made;
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

		/* The three axes of the world at its middle: X red, Y green, Z blue. */
		function drawOrigin (matrix) {
			var far = scene.Ground ? scene.Ground.Field.Size * 0.12 : extent();

			gpu.Origin = gpu.Origin || [[1, 0, 0, 0.9, 0.3, 0.3], [0, 1, 0, 0.35, 0.85, 0.4], [0, 0, 1, 0.3, 0.55, 1]].map(function (axis) {
				return {Mesh: renderer.Lines([[0, 0, 0], [axis[0], axis[1], axis[2]]]), Color: [axis[3], axis[4], axis[5], 1], Axis: axis};
			});

			gpu.Origin.forEach(function (one) {
				renderer.Draw(one.Mesh, gpu.Line, {uViewProjection: graphics.Multiply(matrix, graphics.Scaling(far, far, far)), uOffset: vectors.Scale(local([0, 0, 0]), 1 / far), uBody: [0, 0, 0, 0], uColor: one.Color}, {Blend: 'alpha', Depth: false, DepthWrite: false});
			});
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
			if (object.Values.Vehicle) return true;

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
			var site = object ? null : scene.Roots.filter(function (each) {
				return trait(each, 'Location');
			})[0];
			var settings;
			var key;
			var biome;
			var sketch;
			var sketched;
			var sun;
			var azimuth;
			var elevation;
			var hour;
			var through;
			var day;
			var fill;
			var dusk;
			var night;
			var moon;
			var glow;
			var dark;
			var air;
			var shut;

			if (site && !locationReady(site))
				site = null;

			if (!object && !site && !scene.Driven) {
				if (scene.Ground)
					dropGround();

				return null;
			}

			settings = object ? trait(object, 'Terrain') : null;
			biome = object && self.$Service('Biomes').Get(object.Values.Biome);

			/* The look of a ground (its Blueprint and its Parameters) is not its shape: it makes no other ground. */
			if (settings) {
				settings = Object.assign({}, settings);

				delete settings.Blueprint;
				delete settings.Parameters;
			}

			if (biome)
				settings = Object.assign({}, settings, {Palette: biome.Ground});

			/* The sketch over it is not its shape either: a change of it makes the ground again only where it changed. */
			sketch = settings && settings.Sketch || null;

			if (settings)
				delete settings.Sketch;

			key = scene.Driven ? scene.Driven.Key : site ? 'location:' + site.ID + ':' + site.Values.Model : JSON.stringify(settings);
			sketched = sketch ? JSON.stringify(sketch) : '';

			if (!scene.Ground || scene.Ground.Shape !== key) {
				if (scene.Ground)
					dropGround();

				scene.Ground = {Shape: key, Key: key + sketched, Sketched: sketched, ID: object ? object.ID : '', Field: scene.Driven ? scene.Driven.Field : site ? locationField(site) : terrain.Flat(sketch ? Object.assign({}, settings, {Sketch: sketch}) : settings), Nodes: {}, Frame: 0, Keys: {}};
			}
			else if (scene.Ground.Sketched !== sketched && !scene.Driven && !site) {
				resketch(settings, sketch, sketched);
			}

			sun = scene.Roots.filter(function (each) {
				return trait(each, 'Sun');
			})[0];
			azimuth = number(sun ? trait(sun, 'Sun').Azimuth : 140, 140) * Math.PI / 180;
			elevation = number(sun ? trait(sun, 'Sun').Elevation : scene.Driven && scene.Driven.Elevation || 35, 35) * Math.PI / 180;
			hour = sun ? hourOf(trait(sun, 'Sun').Time, dayHours(trait(sun, 'Sun'))) : null;

			if (hour !== null) {
				var place = skyPlace(trait(sun, 'Sun'), hour);

				elevation = place[0];
				azimuth = place[1];
			}

			scene.Ground.Sky = skyWay(elevation, azimuth);
			scene.Ground.Sun = scene.Ground.Sky;

			/* Through more air the lower it is: the blue goes first, and the land turns gold; under the horizon it is gone. */
			through = 1 / (Math.max(0, Math.sin(elevation)) + 0.045);
			scene.Ground.SunColor = paint(sun ? trait(sun, 'Sun').Color : '#fff4e0').slice(0, 3).map(function (value, index) {
				return value * Math.exp(-[0.018, 0.05, 0.12][index] * through) * Math.min(1, Math.max(0, (Math.sin(elevation) + 0.03) / 0.08));
			});

			/* The moon: how much of it is lit and over the horizon; under the horizon of the sun it lights the land instead. */
			moon = sun ? moonOf(trait(sun, 'Sun'), hour) : null;
			night = Math.min(1, Math.max(0, (-Math.sin(elevation) - 0.03) / 0.1));

			/* A moon before the sun takes its light; in the shadow of the planet it goes dark and red. */
			var solar = 0;
			var lunar = 0;

			if (moon) {
				var parted = Math.acos(Math.max(-1, Math.min(1, vectors.Dot(moon.Way, scene.Ground.Sky))));
				var breadth = 0.018 * moon.Size;

				solar = moon.Size ? Math.min(1, Math.max(0, 1 - parted / (0.0195 + breadth)) * 1.15) : 0;
				lunar = 1 - Math.min(1, Math.max(0, (Math.PI - parted - 0.035 + breadth) / (2 * breadth || 1)));
				moon.Shade = lunar;
				moon.Glow *= 1 - 0.96 * lunar;
			}

			glow = moon ? moon.Glow * Math.min(1, Math.max(0, moon.Way[1] / 0.15)) : 0;
			scene.Ground.Moon = moon;
			scene.Ground.Eclipse = solar;
			scene.Ground.SunColor = scene.Ground.SunColor.map(function (value) {
				return value * (1 - solar * 0.995);
			});

			/*
			 * The light of the sky goes with the day and on through the twilight, to where the sun is 12 degrees under. A low
			 * sun is seen against an air that gives less and is cooler: the side it does not reach goes deep.
			 */
			day = Math.min(1, Math.max(0, (Math.sin(elevation) + 0.2) / 0.45)) * (1 - solar * 0.93);
			fill = day * (0.55 + 0.45 * Math.min(1, Math.max(0, (Math.sin(elevation) - 0.06) / 0.34)));
			dusk = 1 - Math.min(1, Math.abs(Math.sin(elevation)) / 0.35);
			dark = (sun ? number(trait(sun, 'Sun').NightLight, 1) : 1) * 0.42 + glow * 0.5;
			scene.Ground.SkyLight = [0.3 * fill + 0.05 * dark + 0.04 * dusk, 0.36 * fill + 0.06 * dark + 0.03 * dusk, 0.46 * fill + 0.1 * dark + 0.05 * dusk].map(function (value, index) {
				return value * paint(sun ? trait(sun, 'Sun').Shade || '#ffffff' : '#ffffff')[index];
			});
			scene.Ground.FloorLight = [0.1 * fill + 0.016 * dark, 0.1 * fill + 0.019 * dark, 0.09 * fill + 0.03 * dark];
			scene.Ground.Day = day;
			scene.Ground.Glare = (1 - night) * (1 - solar);

			/* What lights the air itself, and the towns: at night there is nothing to see in it but what they give. */
			var towns = sun ? Math.max(0, Math.min(1, number(trait(sun, 'Sun').SkyGlow, 0))) : 0;
			var townColor = paint(sun ? trait(sun, 'Sun').SkyGlowColor || '#ffa860' : '#ffa860');
			var townWay = sun ? number(trait(sun, 'Sun').SkyGlowAzimuth, null) : null;
			var shines = Math.min(1, Math.max(0, Math.sin(elevation) * 2.5 + 0.2)) * (1 - solar * 0.93);

			scene.Ground.AirLight = Math.max(shines, 0.05 * glow + 0.002);
			scene.Ground.MoonLit = glow * night;
			scene.Ground.Glow = [townColor[0] * towns, townColor[1] * towns, townColor[2] * towns];
			scene.Ground.GlowWay = townWay === null ? [0, 0, 0] : [Math.sin(townWay * Math.PI / 180), -Math.cos(townWay * Math.PI / 180), 1];

			/* The faintest star that is seen: the sun, the moon and the towns hide the rest. */
			scene.Ground.StarLimit = 0.02 + Math.min(1, glow) * 0.22 + towns * 0.72 + Math.min(1, Math.max(0, (Math.sin(elevation) + 0.2) / 0.16)) * (1 - solar) * 1.1;
			scene.Ground.GalaxyLight = sun ? number(trait(sun, 'Sun').Galaxy, 1) : 1;
			scene.Ground.StarTurn = sun && hour !== null ? skyTurn(trait(sun, 'Sun'), hour) : [1, 0, 0, 0, 1, 0, 0, 0, 1];

			/* Far fainter than the sun, and the air fills what it leaves dark: a night has a soft contrast. */
			if (night > 0) {
				scene.Ground.Sun = moon && moon.Way[1] > 0.02 ? moon.Way : vectors.Normalize([-scene.Ground.Sky[0] * 0.5, 0.75, -scene.Ground.Sky[2] * 0.5 + 0.3]);
				scene.Ground.SunColor = [0.045 * night * glow, 0.058 * night * glow, 0.095 * night * glow];
			}

			scene.Ground.Night = night;

			/* Clouds take the sun, grey the sky and leave the light flat. */
			air = engine.WeatherNow();
			shut = 0.93 * Math.min(1, Math.max(0, (air.Clouds - 0.45) / 0.37));
			shut = shut * shut * (3 - 2 * shut / 0.93) / 0.93;
			scene.Ground.Shut = shut;
			scene.Ground.SunColor = scene.Ground.SunColor.map(function (value) {
				return value * (1 - shut) * (1 - air.Fog * 0.5);
			});
			scene.Ground.Cover = air.Clouds;
			scene.Ground.AirLight *= Math.max(0.32, 1 - shut * 0.75);
			scene.Ground.Glare *= (1 - shut) * Math.pow(1 - Math.min(1, air.Fog), 3);
			scene.Ground.SkyLight = scene.Ground.SkyLight.map(function (value) {
				return value * (1 - shut * 0.35);
			});
			scene.Ground.FloorLight = scene.Ground.FloorLight.map(function (value) {
				return value * (1 - shut * 0.35);
			});

			/* Under clouds the air loses the blue of the sky. */
			scene.Ground.AirTint = [0.55, 0.72, 1, 0.95].map(function (value, index) {
				return value + ([0.64, 0.65, 0.68, 0.95][index] - value) * Math.min(1, air.Clouds * air.Clouds * 1.1 + air.Fog * 0.7);
			});
			scene.Ground.Air = air;

			return scene.Ground;
		}

		/*
		 * A new sketch over the same ground: its field again (in the page and in the workers, by its options), the squares that lie
		 * where it changed made again, the far mesh of all of it again, what stands there set on it again; what reads the ground by
		 * its Key (the grass, the scatter, the light of the field) takes the new one.
		 */
		function resketch (settings, sketch, sketched) {
			var ground = scene.Ground;
			var before = ground.Field.Options ? ground.Field.Options.Sketch : null;
			var changed = terrain.SketchChanged(before || null, sketch);

			ground.Field = terrain.Flat(sketch ? Object.assign({}, settings, {Sketch: sketch}) : settings);
			ground.Sketched = sketched;
			ground.Key = ground.Shape + sketched;
			ground.Changed = changed;

			Object.keys(ground.Nodes).forEach(function (key) {
				var node = ground.Nodes[key];
				var half = (node.Size || 0) / 2;
				var center = node.Center || [0, 0, 0];
				/* Drawn as it was until its new one comes: no hole in the ground while it is made. */
				var touched = changed.some(function (bounds) {
					return center[0] + half >= bounds[0] && center[0] - half <= bounds[2] && center[2] + half >= bounds[1] && center[2] - half <= bounds[3];
				});
				if (touched)
					node.Stale = true;

			});

			/* What was asked for the sketch before is let go when it comes: asked again of this one at once. */
			ground.Asked = {};

			if (ground.TopMesh) {
				ground.TopMesh.Destroy();
				ground.TopMesh = null;
			}

			scene.Order.forEach(function (object) {
				object.StoodX = undefined;
			});
		}

		function dropGround () {
			Object.keys(scene.Ground.Nodes).forEach(function (key) {
				scene.Ground.Nodes[key].Mesh.Destroy();
			});

			if (scene.Ground.TopMesh)
				scene.Ground.TopMesh.Destroy();

			if (scene.Ground.WaterMesh)
				scene.Ground.WaterMesh.Destroy();

			scene.Ground = null;
		}

		/* A location is a model of a file, at its own size: true when it has come. */
		function locationReady (site) {
			var name = site.Values.Model;
			if (!name)
				return false;

			if (!library.Has(name))
				library.Define(name, {URL: name, Fit: false, Merge: true, Without: site.Values.Without});

			if (library.Ready(name)) return true;

			if (!scene.Asked[name]) {
				scene.Asked[name] = true;

				library.Load(name);
			}

			return false;
		}

		/* The floors and the walls of a location, from where its triangles stand. */
		function locationField (site) {
			var model = library.Make(site.Values.Model);
			var scale = number(trait(site, 'Model').Size, 1);

			return terrain.FromModel(model.Pieces.map(function (piece) {
				var made = graphics.Transform(piece.Placed || piece.Geometry, graphics.Multiply(graphics.Scaling(scale, scale, scale), piece.Rest));

				return {Positions: made.Positions, Normals: made.Normals, Indices: made.Indices, Soft: piece.Material.Alpha === 'BLEND'};
			}), {Plane: site.Values.Plane});
		}

		/* The hour of a sun: Time as 18:30 or a number, going on at the pace of DaySeconds; null when it has none. */
		function hourOf (time, hours) {
			var parts = String(time === undefined || time === null ? '' : time).split(':');
			var pace = number(self.DaySeconds, 0);

			if (parts[0] === '' || isNaN(Number(parts[0]))) return null;

			return (Number(parts[0]) + (Number(parts[1]) || 0) / 60 + (pace ? scene.Seconds / pace * hours : 0)) % hours;
		}

		/* How long a day of a sun is: a planet need not turn in 24 hours. */
		function dayHours (values) {
			return Math.max(1, number(values.DayHours, 24));
		}

		/*
		 * Where a sun stands at an hour, as [elevation, azimuth] in radians. With a Latitude it is the turn of the planet: the
		 * Tilt of its axis and the DayOfYear of a year of YearDays give how far from its equator the sun stands, and with the
		 * latitude that gives the length of the light of the day, polar days and nights too. Without one it rises at a quarter
		 * of the day in the east and sets at three quarters. Noon is the azimuth of its noon where the sun stands in the south.
		 */
		function skyPlace (values, hour, wander) {
			var hours = dayHours(values);
			var noon = number(values.Noon, 180);
			var latitude = number(values.Latitude, null);

			if (latitude === null) {
				var part = hour / hours * 24;

				return [number(values.Elevation, 35) * 1.6 * Math.sin((part - 6) / 12 * Math.PI) * Math.PI / 180, (noon - 90 + (part - 6) * 15) * Math.PI / 180];
			}

			var from = latitude * Math.PI / 180;
			var aside = wander === undefined ? sunAside(values) : wander;
			var turn = (hour / hours - 0.5) * Math.PI * 2;
			var rise = Math.sin(from) * Math.sin(aside) + Math.cos(from) * Math.cos(aside) * Math.cos(turn);

			return [Math.asin(Math.max(-1, Math.min(1, rise))), Math.atan2(-Math.sin(turn) * Math.cos(aside), Math.sin(aside) * Math.cos(from) - Math.cos(aside) * Math.sin(from) * Math.cos(turn)) + (noon - 180) * Math.PI / 180];
		}

		/* How far from the equator of its planet a sun stands on a day of its year. */
		function sunAside (values) {
			return Math.asin(Math.sin(number(values.Tilt, 23.44) * Math.PI / 180) * Math.sin((number(values.DayOfYear, 172) - 80) / number(values.YearDays, 365) * Math.PI * 2));
		}

		/*
		 * The stars of a planet at an hour: a matrix from the sky, its pole along Y, to the ground. They go round the pole, which
		 * stands as high as the latitude, once a day and a little more for the turn round the sun.
		 */
		function skyTurn (values, hour) {
			var latitude = number(values.Latitude, 45) * Math.PI / 180;
			var round = (hour / dayHours(values) + number(values.DayOfYear, 172) / number(values.YearDays, 365)) * Math.PI * 2;
			var aside = (number(values.Noon, 180) - 180) * Math.PI / 180;
			var c = Math.cos(round);
			var s = Math.sin(round);
			var up = Math.sin(latitude);
			var north = Math.cos(latitude);

			/* The axes of the sky on the ground: Y is the pole, X and Z turn with the hour. */
			var turned = [[c, s * north, s * up], [0, up, -north], [-s, c * north, c * up]];

			return [0, 1, 2].reduce(function (made, column) {
				var x = turned[column][0];
				var z = turned[column][2];

				return made.concat([x * Math.cos(aside) + z * Math.sin(aside), turned[column][1], -x * Math.sin(aside) + z * Math.cos(aside)]);
			}, []);
		}

		/* The way to a place of the sky from the ground. */
		function skyWay (elevation, azimuth) {
			return [Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation), -Math.cos(elevation) * Math.cos(azimuth)];
		}

		/*
		 * The moon of a sun: it goes the way of the sun, late by its MoonPhase of a day (0 new: by the sun, its dark side to
		 * us; 0.5 full: across the sky), unless MoonElevation and MoonAzimuth hold it. Way, Size (0: none to draw), Glow (the
		 * light it gives), Lit (where its own sun seems to stand, for the shape of the phase). Moon false: a sky without one.
		 */
		function moonOf (values, hour) {
			var moon = values.Moon;
			var phase = (number(values.MoonPhase, 0.5) % 1 + 1) % 1;
			var size = Math.max(0, number(values.MoonSize, 1));

			if (moon === false || moon === 'false') return null;

			var held = number(values.MoonElevation, null);
			var round = phase * Math.PI * 2;

			/* Over the sun at a new moon, across the sky from it at a full one, and off its way but for the days of its nodes. */
			var off = number(values.MoonTilt, 5.14) * Math.PI / 180 * Math.sin((number(values.DayOfYear, 172) - number(values.MoonNode, 80)) / number(values.YearDays, 365) * Math.PI * 2);
			var place = skyPlace(values, (hour || 0) - phase * dayHours(values), sunAside(values) * Math.cos(round) + off);

			if (number(values.Latitude, null) === null)
				place[0] += off;

			var way = skyWay(held === null ? place[0] : held * Math.PI / 180, held === null ? place[1] : number(values.MoonAzimuth, 180) * Math.PI / 180);
			var side = vectors.Cross(way, Math.abs(way[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]);
			var over = vectors.Normalize(vectors.Cross(side, way));

			return {Way: way, Size: size, Lit: vectors.Add(vectors.Scale(way, Math.cos(round)), vectors.Scale(over, Math.sin(round))), Glow: Math.max(0, number(values.MoonLight, 1)) * (1 - Math.cos(round)) / 2};
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
			if (trait(object, 'Orbit') || trait(object, 'Walker') || trait(object, 'Mover') || trait(object, 'Formation') || trait(object, 'Rigid')) return false;

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

			if (trait(object, 'Location')) {
				object.World = [0, field.Lift || 0, 0];
				object.Position = object.World;
				object.Relative = [0, 0, 0];

				return;
			}

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

			/* The ground under it is noise: not again while it stands. Lift: how high over it (an editor sets it). */
			if (object.StoodX !== x || object.StoodZ !== z || object.StoodLift !== object.Values.Lift || !object.World) {
				object.StoodX = x;
				object.StoodZ = z;
				object.StoodLift = object.Values.Lift;

				/* Z: the floor it is told, where one stands over another. */
				object.World = [x, Math.max(0, field.Height(x, z, object.World ? object.World[1] - (object.Lifted || 0) : object.Values.Z === undefined ? undefined : number(object.Values.Z, 0))), z];
				object.Lifted = number(object.Values.Lift, 0);
				object.World[1] += object.Lifted;
			}

			/* Facing: the way it is turned while it stands, in degrees from the axis Z (an editor sets it); a hero turns itself. */
			if (!way && scene.Hero !== object.ID && object.Values.Facing !== undefined && object.Values.Facing !== '')
				object.Heading = [Math.sin(number(object.Values.Facing, 0) * Math.PI / 180), 0, Math.cos(number(object.Values.Facing, 0) * Math.PI / 180)];

			/* The hero stands where its own steps and falls took it. */
			if (object.Air !== undefined)
				object.World = [x, object.Air, z];

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

		/*
		 * The hero goes where the keys say and faces where the view looks: A and D step aside, S steps back; the right button
		 * turns the view and leaves the way as it was. Standing, it turns on the spot once the view went far enough to the side
		 * (with FreeLook it stands as it stood, and comes round when it sets off).
		 * It goes in small steps, so no wall is passed at speed; a wall lets it slide along it; off a floor it falls. Space jumps.
		 * The clips of a model name what it does: walk, run, sprint, idle, jump, strafe-left, strafe-right, the same with -run,
		 * turn-left, turn-right; a model without one of them walks.
		 */
		function walkHero (hero, keys, elapsed) {
			var field = scene.Ground.Field;
			var yaw = scene.Drag && scene.Drag.Button === 2 ? scene.Drag.Yaw : scene.Yaw;
			var forward = [-Math.sin(yaw), 0, -Math.cos(yaw)];
			var right = [Math.cos(yaw), 0, -Math.sin(yaw)];
			var running = keys.ShiftLeft || keys.ShiftRight;
			var sprint = running && (keys.AltLeft || keys.AltRight);
			var ahead = leaning(keys)[0];
			var aside = leaning(keys)[1];
			var way = vectors.Add(vectors.Scale(forward, ahead), vectors.Scale(right, aside));
			var x = number(hero.Values.X, 0);
			var z = number(hero.Values.Y, 0);
			var y = hero.Air === undefined ? hero.World[1] : hero.Air;
			var rise = hero.Rise || 0;
			var landed = !rise && hero.Grounded !== false;
			var moved = false;
			var pace = hero.Size * (sprint ? 3.6 : running ? 2.4 : ahead < 0 ? 0.8 : 1.1);
			var free;
			var steps;
			var i;

			function can (at, on) {
				return !field.CanStep || field.CanStep(at, on, y);
			}

			/* A body by what stands round it: in a location it goes as far as its sides let it, and slides along what it meets. */
			var round = hero.Size * 0.15;
			var knee = Math.max(0.5, hero.Size * 0.22);
			var tall = hero.Size * 0.9;

			function going (at, on) {
				var out = field.Push(at, on, y, round, knee, tall);

				if (field.Stands(out[0], out[1], y)) {
					x = out[0];
					z = out[1];
					moved = true;
				}
			}

			/* What already stands in a wall may always leave it. */
			free = !can(x, z);

			if (vectors.Length(way)) {
				way = vectors.Normalize(way);
				steps = Math.ceil(pace * elapsed / 0.15) || 1;

				for (i = 0; i < steps; i++) {
					var nextX = x + way[0] * pace * elapsed / steps;
					var nextZ = z + way[2] * pace * elapsed / steps;

					if (field.Push) {
						going(nextX, nextZ);
					}
					else if (free || can(nextX, nextZ)) {
						x = nextX;
						z = nextZ;
						moved = true;
					}
					else if (can(nextX, z)) {
						x = nextX;
						moved = true;
					}
					else if (can(x, nextZ)) {
						z = nextZ;
						moved = true;
					}
				}
			}

			var floor = Math.max(0, field.Height(x, z, y));

			if (keys.Space && landed)
				rise = hero.Size * 3;

			y += rise * elapsed;
			rise -= 18 * elapsed;

			/* A step up comes smoothly; a small one down too, and a seam of a map is no fall. Down from higher, it falls. */
			if (rise <= 0 && (y <= floor + 0.02 || landed && !keys.Space && y - floor < hero.Size * 0.3)) {
				hero.Grounded = true;
				hero.Rise = 0;
				hero.Hang = 0;
				y = Math.abs(y - floor) > 0.02 ? y + (floor - y) * Math.min(1, elapsed * 16) : floor;
			}
			else {
				hero.Grounded = false;
				hero.Rise = rise;
				hero.Hang = (hero.Hang || 0) + elapsed;
			}

			hero.Air = y;
			hero.Walking = moved ? pace : 0;
			hero.Back = ahead < 0;

			/* It jumps when told; a moment over a gap of the ground is not worth the clip. */
			if (!hero.Grounded && (hero.Rise > 0 || hero.Hang > 0.22)) {
				hero.Pace = 'jump';
				hero.Walking = hero.Walking || pace;
			}
			else if (!ahead && aside) {
				hero.Pace = 'strafe-' + (aside < 0 ? 'left' : 'right') + (running ? '-run' : '');
			}
			else {
				hero.Pace = sprint ? 'sprint' : running ? 'run' : 'walk';
			}

			faceView(hero, yaw, moved || !hero.Grounded || self.Person === 'first', elapsed);

			if (!moved) return;

			hero.Values.X = x;
			hero.Values.Y = z;

			scene.Overrides[hero.ID] = scene.Overrides[hero.ID] || {};
			scene.Overrides[hero.ID].Values = Object.assign(scene.Overrides[hero.ID].Values || {}, {X: x, Y: z});
		}

		/* The body comes round to where the view looks: at once on the way, on the spot by a turn of its own when it stands. */
		function faceView (hero, yaw, moving, elapsed) {
			var wanted = yaw + Math.PI;
			var facing = hero.Facing === undefined ? wanted : hero.Facing;
			var apart = Math.atan2(Math.sin(wanted - facing), Math.cos(wanted - facing));

			hero.Pose = '';

			/* With a free look it stands as it stood, to be looked at from all sides. */
			if (!moving && self.FreeLook && self.FreeLook !== 'false') {
				hero.Spin = 0;
				hero.Facing = facing;
				hero.Heading = [Math.sin(facing), 0, Math.cos(facing)];

				return;
			}

			if (moving) {
				facing += apart * Math.min(1, elapsed * 12);
				hero.Spin = 0;
			}
			else {
				if (Math.abs(apart) > 0.9)
					hero.Spin = apart > 0 ? 1 : -1;

				if (hero.Spin) {
					facing += hero.Spin * Math.min(Math.abs(apart), elapsed * 2.4);
					hero.Pose = hero.Spin > 0 ? 'turn-left' : 'turn-right';

					if (Math.abs(apart) < 0.08)
						hero.Spin = 0;
				}
			}

			hero.Facing = facing;
			hero.Heading = [Math.sin(facing), 0, Math.cos(facing)];
		}

		/* Where the view of a hero stands now: each way of it comes and goes in a quarter of a second. */
		function easePerson (elapsed) {
			var step = 1 - Math.exp(-elapsed * 10);

			scene.Inside = (scene.Inside || 0) + ((self.Person === 'first' ? 1 : 0) - (scene.Inside || 0)) * step;
			scene.Aside = (scene.Aside || 0) + ((self.Person === 'shoulder' ? 1 : 0) - (scene.Aside || 0)) * step;
			scene.Side = (scene.Side === undefined ? 1 : scene.Side) + ((self.Shoulder === 'left' ? -1 : 1) - (scene.Side === undefined ? 1 : scene.Side)) * step;
		}

		/* The view over the ground: round its point (or the object in focus), never under the ground; the keys move it. */
		function aimGround (elapsed) {
			var ground = scene.Ground;
			var field = ground.Field;
			var camera = scene.Camera;
			var focus = scene.Objects[scene.Hero] || (scene.Focus ? scene.Objects[scene.Focus] : null);
			var keys = engine.PadKeys(ground.Keys);
			var forward = [-Math.sin(scene.Yaw), 0, -Math.cos(scene.Yaw)];
			var right = [Math.cos(scene.Yaw), 0, -Math.sin(scene.Yaw)];
			var speed = scene.Distance * 0.9 * elapsed;
			var view = self.View;
			var lowest = null;
			var look;
			var floor;

			function moveView () {
				if (keys.ArrowUp || keys.KeyW)
					ground.Target = vectors.Add(ground.Target, vectors.Scale(forward, speed));

				if (keys.ArrowDown || keys.KeyS)
					ground.Target = vectors.Add(ground.Target, vectors.Scale(forward, -speed));

				if (keys.ArrowRight || keys.KeyD)
					ground.Target = vectors.Add(ground.Target, vectors.Scale(right, speed));

				if (keys.ArrowLeft || keys.KeyA)
					ground.Target = vectors.Add(ground.Target, vectors.Scale(right, -speed));

				if (keys.Pad && (keys.Pad.X || keys.Pad.Y))
					ground.Target = vectors.Add(ground.Target, vectors.Add(vectors.Scale(forward, speed * keys.Pad.Y), vectors.Scale(right, speed * keys.Pad.X)));
			}

			if (scene.Driven) {
				ground.Target = scene.Driven.Target;
				scene.Distance = scene.Wanted = scene.Driven.Height;
				view = scene.Driven.View;
				keys = {};
			}

			if (!ground.Target)
				ground.Target = [0, Math.max(0, field.Height(0, 0)), 0];

			/* With a hero the keys walk it, and the view goes after it. */
			if (scene.Hero && scene.Objects[scene.Hero]) {
				if (!engine.VehicleStep(scene.Objects[scene.Hero], keys, elapsed))
					walkHero(scene.Objects[scene.Hero], keys, elapsed);
			}
			else {
				moveView();
			}

			turnKeys(keys, elapsed);

			/* The view eases to what it follows, but holds a hero at once: an easing that lags by the length of a frame shakes it. */
			if (focus && focus.World && keys.Follow !== false)
				ground.Target = scene.Hero === focus.ID ? [focus.World[0], ground.Target[1], focus.World[2]] : vectors.Lerp(ground.Target, focus.World, 1 - Math.exp(-elapsed * 6));

			if (!scene.Driven) {
				ground.Target[0] = Math.max(-field.Size / 2, Math.min(field.Size / 2, ground.Target[0]));
				ground.Target[2] = Math.max(-field.Size / 2, Math.min(field.Size / 2, ground.Target[2]));
			}

			ground.Target[1] = scene.Hero && focus ? ground.Target[1] + (focus.World[1] + focus.Size * 0.8 - ground.Target[1]) * (1 - Math.exp(-elapsed * 8)) : ground.Held && !focus ? ground.Target[1] : Math.max(0, field.Height(ground.Target[0], ground.Target[2]));
			scene.Distance += (scene.Wanted - scene.Distance) * (1 - Math.exp(-elapsed * 9));
			scene.Pitch = Math.max(-1.3, Math.min(1.5, scene.Pitch));
			look = scene.Pitch;

			if (scene.Hero) easePerson(elapsed);
			else scene.Inside = scene.Aside = 0;

			var inside = focus ? scene.Inside : 0;
			var aside = focus ? scene.Aside : 0;
			var round = aside ? vectors.Add(ground.Target, vectors.Scale([Math.cos(scene.Yaw) * 0.42 * scene.Side, 0.14, -Math.sin(scene.Yaw) * 0.42 * scene.Side], aside * focus.Size)) : ground.Target;
			var away = scene.Distance * (1 - aside * 0.5);

			/* In parallel rays the distance is the height of the view; the eye stands far enough to see all of it. */
			if (view) {
				parallel(view, ground, field);

				return;
			}

			camera.Ortho = 0;
			camera.Up = [0, 1, 0];

			/* Round a hero the eye comes down to the ground at its distance, and from there it only looks up. */
			if (scene.Hero && focus && scene.Pitch < 0 && inside < 0.5)
				lowest = Math.asin(Math.min(0.9, (ground.Target[1] - focus.World[1] - 0.15) / Math.max(0.1, away)));

			camera.Orbit(round, scene.Yaw, lowest === null ? scene.Pitch : Math.max(scene.Pitch, -lowest), away);

			/* The floor under the eye comes by steps in a location: the eye goes up and down smoothly. */
			floor = Math.max(0, field.Height(camera.Position[0], camera.Position[2], ground.Target[1])) + (scene.Hero ? 0.15 : 1.5);
			scene.Floor = scene.Floor === undefined ? floor : scene.Floor + (floor - scene.Floor) * (1 - Math.exp(-elapsed * 5));
			floor = Math.min(floor, scene.Floor);

			if (camera.Position[1] < floor)
				camera.Position[1] = floor;

			/* Behind a hero a wall comes before the eye: it stays on the near side of it. */
			if (scene.Hero && field.Blocked && !(focus && focus.Values.Vehicle))
				camera.Position = clearView(field, round, camera.Position, elapsed);

			/* From the ground a hero stays in the frame: the view rises only as far as it keeps the knees at its lower edge. */
			if (lowest !== null) {
				var flat = Math.max(0.3, Math.sqrt(Math.pow(focus.World[0] - camera.Position[0], 2) + Math.pow(focus.World[2] - camera.Position[2], 2)));
				var rise = Math.atan2(focus.World[1] + focus.Size * 0.25 - camera.Position[1], flat) + camera.Fov * Math.PI / 360 * 0.9;

				scene.Pitch = Math.max(scene.Pitch, -Math.max(lowest, rise));
				look = Math.max(scene.Pitch, -rise);
			}

			/* Below the point it turns round the eye stops at the ground and looks up, as far as the sky. */
			if (scene.Pitch < 0) {
				var skyward = Math.min(1, -scene.Pitch / 0.22);
				var towards = vectors.Normalize(vectors.Subtract(camera.Target, camera.Position));

				/* From what it looks at to where it looks by degrees: where the eye stands raised the two are not the same way. */
				camera.Target = vectors.Add(camera.Position, vectors.Lerp(towards, [-Math.sin(scene.Yaw) * Math.cos(look), -Math.sin(look), -Math.cos(scene.Yaw) * Math.cos(look)], skyward * skyward * (3 - 2 * skyward)));
			}

			/*
			 * In its eyes: they go with its head, calmed, and turn round its neck as eyes do: to look down is to bring them forward
			 * and down, so the view leaves the head and stays out of the body.
			 */
			var seat = inside > 0.001 && focus.Values.Vehicle ? engine.SeatView(focus, elapsed) : null;

			if (seat) {
				camera.Position = vectors.Lerp(camera.Position, seat.At, inside);
				camera.Target = vectors.Lerp(camera.Target, vectors.Add(seat.At, vectors.Scale(seat.Ahead, 10)), inside);
			}
			else if (inside > 0.001) {
				var ahead = [-Math.sin(scene.Yaw) * Math.cos(scene.Pitch), -Math.sin(scene.Pitch), -Math.cos(scene.Yaw) * Math.cos(scene.Pitch)];
				var over = [-Math.sin(scene.Yaw) * Math.sin(scene.Pitch), Math.cos(scene.Pitch), -Math.cos(scene.Yaw) * Math.sin(scene.Pitch)];
				var head = focus.Head || [0, focus.Size * 0.93, 0];

				scene.HeadAt = scene.HeadAt ? vectors.Lerp(scene.HeadAt, head, 1 - Math.exp(-elapsed * 14)) : head;

				var neck = vectors.Add([focus.World[0], ground.Target[1] - focus.Size * 0.8, focus.World[2]], scene.HeadAt);
				var eyes = vectors.Add(neck, vectors.Add(vectors.Scale(ahead, focus.Size * 0.15), vectors.Scale(over, focus.Size * 0.07)));

				scene.CutAt = vectors.Add(neck, [0, focus.Size * 0.05, 0]);
				camera.Position = vectors.Lerp(camera.Position, eyes, inside);
				camera.Target = vectors.Lerp(camera.Target, vectors.Add(eyes, vectors.Scale(ahead, 10)), inside);
			}

			scene.Eye = camera.Position.slice();
			scene.Target = ground.Target.slice();
			camera.Near = Math.max(0.05, scene.Distance * 0.01);
			camera.Far = field.Size * 3 + scene.Distance * 4;
		}

		/* The last place on the way from what the eye follows to the eye that no wall stands on. */
		function clearView (field, from, to, elapsed) {
			var far = vectors.Distance(from, to);
			var steps = Math.ceil(far / 0.3);
			var free = far;
			var i;

			/* A wall at a part of the way: a ray along the ground is measured from the ground under it, which is no wall. */
			function walled (part) {
				var at = vectors.Lerp(from, to, part);

				return field.Blocked(at[0], at[2], Math.max(at[1] - 1, field.Height(at[0], at[2], at[1] + 1) + 0.1));
			}

			for (i = 1; i <= steps; i++) {
				if (walled(i / steps)) {
					var near = (i - 1) / steps;
					var past = i / steps;

					/* Its face is found to a hair: steps of the ray would show as jumps of the eye along a wall. */
					for (var halves = 0; halves < 5; halves++) {
						if (walled((near + past) / 2)) past = (near + past) / 2;
						else near = (near + past) / 2;
					}

					free = Math.max(0.6, near * far - 0.2);

					break;
				}
			}

			/* It comes in fast, and goes out slowly: no flicker on the edge of a wall. */
			scene.Clear = scene.Clear === undefined ? free : scene.Clear + (free - scene.Clear) * (1 - Math.exp(-elapsed * (free < scene.Clear ? 30 : 2.5)));

			return scene.Clear < far ? vectors.Lerp(from, to, scene.Clear / far) : to;
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

		/*
		 * A square of a ground of noise asked of a worker (args of Terrain.Piece): until it comes it is missing, as one not
		 * made yet. What came for a ground gone, or before its roads or its field (a sketch) changed, is let go; a worker that failed leaves it to
		 * the page.
		 */
		function askPiece (owner, key, shape, args, made) {
			var field = owner.Field;
			var roads = field.Roads;
			var asked = owner.Asked = owner.Asked || {};
			var token = {};

			if (asked[key]) return;

			asked[key] = token;

			self.$Service('Terrain').Work().Run('Terrain', 'Piece', [shape, field.Options, roads || null, args], function (error, piece) {
				if (scene.Gone || asked[key] !== token) return;

				delete asked[key];

				if (field.Roads !== roads || owner.Field !== field || owner !== scene.Ground && owner !== scene.Surface) return;

				made(error ? null : piece);
			});
		}

		/* The squares of the ground in view, the finer the nearer the eye; each made once, a few a frame. */
		function groundPatches () {
			var ground = scene.Ground;
			var field = ground.Field;
			var wanted = [];
			var missing = [];
			var started = window.performance.now();

			/* A map of cells is of one piece. */
			if (field.Whole) {
				if (!ground.Nodes.whole)
					ground.Nodes.whole = {Mesh: renderer.Mesh(field.Chunk()), Center: field.Center, Used: 0};

				ground.Nodes.whole.Used = ++ground.Frame;

				return [ground.Nodes.whole];
			}

			function keyOf (x, z, level) {
				return x.toFixed(3) + ':' + z.toFixed(3) + ':' + level;
			}

			/* The first square at once, the others of noise by a worker; each knows the height of its middle. */
			function build (x, z, size, level) {
				var key = keyOf(x, z, level);

				function replace () {
					if (ground.Nodes[key] && ground.Nodes[key].Mesh)
						ground.Nodes[key].Mesh.Destroy();
				}

				if (level && field.Options) {
					askPiece(ground, key, 'Flat', [x, z, size, 32], function (piece) {
						replace();

						ground.Nodes[key] = {Mesh: renderer.Mesh(piece || field.Chunk(x, z, size, 32)), Center: [x, 0, z], Size: size, Top: Math.max(0, field.Height(x, z)), Used: ground.Frame};
					});

					return;
				}

				replace();

				ground.Nodes[key] = {Mesh: renderer.Mesh(field.Chunk(x, z, size, 32)), Center: [x, 0, z], Size: size, Top: Math.max(0, field.Height(x, z)), Used: ground.Frame};
			}

			/*
			 * A square gives way to its four parts only when all of them are made: until then it stays, coarser, and there is
			 * never a hole in the ground. Squares in use keep their parents, so going back up needs nothing to be made.
			 */
			function visit (x, z, size, level) {
				var node = ground.Nodes[keyOf(x, z, level)];
				var near = vectors.Distance(scene.Eye, [x, node.Top, z]);
				var half = size / 2;
				var parts = [[x - half / 2, z - half / 2], [x + half / 2, z - half / 2], [x - half / 2, z + half / 2], [x + half / 2, z + half / 2]];
				var absent;

				node.Used = ground.Frame;

				/*
				 * Of a sketch that changed under it: made again first, drawn as it was meanwhile; asked at every visit until it comes (Regression:
				 * marked asked once, a square a full queue of the workers left out of that frame was never made again).
				 */
				if (node.Stale)
					missing.push({X: x, Z: z, Size: size, Level: level, Near: -1});

				if (level < 6 && near < size * 1.4) {
					absent = parts.filter(function (part) {
						return !ground.Nodes[keyOf(part[0], part[1], level + 1)];
					});

					if (!absent.length) {
						parts.forEach(function (part) {
							visit(part[0], part[1], half, level + 1);
						});

						return;
					}

					absent.forEach(function (part) {
						missing.push({X: part[0], Z: part[1], Size: half, Level: level + 1, Near: near});
					});
				}

				wanted.push(node);
			}

			ground.Frame++;

			if (!ground.Nodes[keyOf(0, 0, 0)])
				build(0, 0, field.Size, 0);

			visit(0, 0, field.Size, 0);

			/* The nearest first, for as long as a frame can spare. */
			missing.sort(function (a, b) {
				return a.Near - b.Near;
			});

			missing.some(function (one) {
				build(one.X, one.Z, one.Size, one.Level);

				return window.performance.now() - started > 4 || field.Options && terrain.Work().Waiting() > 8;
			});

			return wanted;
		}

		/* The water, over all else: it shows what was drawn before it, mirrored and through it. */
		function drawSea (matrix, posted) {
			var ground = scene.Ground;
			var field = ground.Field;
			var fog = scene.Camera.Ortho || posted ? 1e9 : field.Size * 0.9;
			var seen = posted ? engine.PostMiddle() : null;

			var waters = sketchWaters(ground);
			var values = {uViewProjection: matrix, uSun: ground.Sun, uSunColor: ground.SunColor, uAir: [0.55, 0.72, 1, 0.95], uFog: fog, uSeen: seen ? seen.Color : gpu.NoBounce, uSeenDepth: seen ? seen.Depth : gpu.NoBounce, uMirror: seen ? 1 : 0, uEye: scene.Eye, uTime: scene.Seconds, uDay: ground.Day * (1 - ground.Cover * ground.Cover * 0.5), uWild: 1 + ground.Air.Rain * 0.9, uFlow: 0};

			/* The rivers and the lakes of a sketch: the same water, calmer, where they lie. */
			if (waters)
				renderer.Draw(waters, gpu.Sea, Object.assign({}, values, {uModel: graphics.Translation(-scene.Eye[0], -scene.Eye[1], -scene.Eye[2]), uWild: 0.45 + ground.Air.Rain * 0.5, uFlow: 1}), {Blend: 'alpha', Cull: 'none'});

			if (!field.Water) return;

			if (!gpu.Water)
				gpu.Water = renderer.Mesh(graphics.Plane({Width: 1, Depth: 1, Segments: 1}));

			renderer.Draw(gpu.Water, gpu.Sea, Object.assign({}, values, {uModel: graphics.Compose(vectors.Subtract([0, 0, 0], scene.Eye), null, field.Size * 1.6)}), {Blend: 'alpha', Cull: 'none'});
		}

		/*
		 * The mesh of the waters of the sketch of a ground (Terrain: Waters of its field), made again as its sketch changes: a strip
		 * along each river at its levels, the area of each lake at its level (none under the sea, which covers it). null: none.
		 */
		function sketchWaters (ground) {
			var made = {Positions: [], Normals: [], UVs: [], Colors: [], Indices: []};
			var waters;

			if (ground.WaterKey === ground.Sketched) return ground.WaterMesh;

			if (ground.WaterMesh)
				ground.WaterMesh.Destroy();

			ground.WaterKey = ground.Sketched;
			ground.WaterMesh = null;
			waters = ground.Field.Sketch ? ground.Field.Sketch.Waters() : [];

			/* A point of the water and how it runs there: its way down the river and its speed in its color (none: still water). */
			function vertex (x, y, z, flow) {
				made.Positions.push(x, y, z);
				made.Normals.push(0, 1, 0);
				made.UVs.push(x, z);
				made.Colors.push(flow ? flow[0] : 0, flow ? flow[1] : 0, flow ? flow[2] : 0);

				return made.Positions.length / 3 - 1;
			}

			waters.forEach(function (water) {
				var points = water.Points;
				var i;

				if (water.Kind === 'lake') {
					if (water.Level <= 0 && ground.Field.Water) return;

					triangles(points).forEach(function (index) {
						made.Indices.push(vertex(points[index][0], water.Level, points[index][1]));
					});

					return;
				}

				/*
				 * Along each segment by steps of two metres, the level between its ends, the width across its way. It runs from its
				 * first point to its last (its bed never rises that way), as fast as its Flow, else the steeper the faster.
				 */
				var last = null;

				for (i = 0; i + 1 < points.length; i++) {
					var dx = points[i + 1][0] - points[i][0];
					var dz = points[i + 1][1] - points[i][1];
					var length = Math.max(1e-6, Math.hypot(dx, dz));
					var steps = Math.max(1, Math.ceil(length / 2));
					var speed = water.Flow > 0 ? water.Flow : Math.max(0.8, Math.min(4, 1 + (water.Levels[i] - water.Levels[i + 1]) / length * 60));
					var flow = [dx / length, dz / length, speed];
					var j;

					for (j = i ? 1 : 0; j <= steps; j++) {
						var t = j / steps;
						var x = points[i][0] + dx * t;
						var z = points[i][1] + dz * t;
						var y = water.Levels[i] + (water.Levels[i + 1] - water.Levels[i]) * t;
						var left = vertex(x - dz / length * water.Width / 2, y, z + dx / length * water.Width / 2, flow);
						var right = vertex(x + dz / length * water.Width / 2, y, z - dx / length * water.Width / 2, flow);

						if (last)
							made.Indices.push(last[0], last[1], left, left, last[1], right);

						last = [left, right];
					}
				}
			});

			if (made.Indices.length)
				ground.WaterMesh = renderer.Mesh(made);

			return ground.WaterMesh;
		}

		/* The triangles of an area (ear by ear), as indices of its points. */
		function triangles (points) {
			var left = points.map(function (point, index) {
				return index;
			});
			var made = [];
			var area = 0;
			var guard = 0;
			var i;

			for (i = 0; i < points.length; i++)
				area += points[i][0] * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * points[i][1];

			while (left.length > 3 && guard++ < 10000) {
				var cut = -1;

				for (i = 0; i < left.length && cut < 0; i++) {
					var a = points[left[(i + left.length - 1) % left.length]];
					var b = points[left[i]];
					var c = points[left[(i + 1) % left.length]];
					var turn = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
					if (turn * area <= 0) continue;

					/* An ear holds no other point of the area. */
					var empty = left.every(function (index) {
						var p = points[index];
						var d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
						var d2 = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0]);
						var d3 = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0]);

						return p === a || p === b || p === c || !(d1 * area > 0 && d2 * area > 0 && d3 * area > 0);
					});
					if (empty)
						cut = i;
				}

				if (cut < 0)
					cut = 0;

				made.push(left[(cut + left.length - 1) % left.length], left[cut], left[(cut + 1) % left.length]);

				left.splice(cut, 1);
			}

			if (left.length === 3)
				made.push(left[0], left[1], left[2]);

			return made;
		}

		/* Where a light stands: over the ground at its place, or over what it follows. */
		function lightPlace (object, settings) {
			var follows = object.Values.Follow ? scene.Objects[object.Values.Follow] : null;
			var x = number(object.Values.X, 0);
			var z = number(object.Values.Y, 0);
			var height = number(settings.Height, 2.5);

			if (follows && follows.World)
				return [follows.World[0] + x, follows.World[1] + height, follows.World[2] + z];

			return [x, Math.max(0, scene.Ground.Field.Height(x, z, object.Values.Z === undefined ? undefined : number(object.Values.Z, 0))) + height, z];
		}

		/*
		 * The shadows of the two nearest lamps: a wide view down from each, one of them made new each frame. All that casts a
		 * shadow of the sun casts one of a lamp.
		 */
		var lampMaps = [];

		function lampShadows () {
			var which = scene.LampTurn = ((scene.LampTurn || 0) + 1) % 2;
			var lamp = scene.Lamps[which];
			var lit = self.Graphics().Lamps;

			/* A lamp a body carries is inside its shape, as one built into a model is: it has no shadow of its own. */
			if (lamp && (lamp.Built || lamp.Object.Values.Follow || lamp.Settings.Follow))
				lamp = null;

			var at;
			var way;
			var matrix;

			lampMaps = lampMaps.slice(0, Math.min(lit ? 2 : 0, scene.Lamps.length));

			if (!lit || !lamp || !scene.Casters) return;

			at = vectors.Subtract(lamp.At, scene.Eye);
			way = vectors.Normalize(lamp.Settings.Aim || [0, -1, 0]);
			matrix = graphics.Multiply(graphics.Perspective(number(lamp.Settings.Spot, 0) || 150, 1, 0.1, number(lamp.Settings.Radius, 14) * 1.2), graphics.LookAt(at, vectors.Add(at, way), Math.abs(way[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0]));

			gpu.Lamps = gpu.Lamps || [renderer.Shadow(1024), renderer.Shadow(1024)];

			gpu.Lamps[which].Begin();

			scene.Casters(matrix);

			gpu.Lamps[which].End();

			lampMaps[which] = {Map: gpu.Lamps[which], Matrix: matrix};
		}

		/* The lights of a scene for the shaders: any number of them, the nearest two dozen at once. */
		function localLights () {
			var data = [];

			var hero = scene.Objects[scene.Hero];
			var from = hero && hero.World ? hero.World : scene.Eye;

			/* Those nearest what the view follows, not the eye: to come closer does not change which lamps cast their shadows. */
			scene.Lamps = scene.Order.filter(function (object) {
				return trait(object, 'Light') && number(trait(object, 'Light').Power, 1) > 0;
			}).map(function (object) {
				var settings = trait(object, 'Light');
				var at = lightPlace(object, settings);

				return {Object: object, Settings: settings, At: at, Far: vectors.Distance(at, scene.Eye)};
			}).concat(builtLamps()).concat(engine.EffectLamps()).concat(engine.VehicleLamps()).map(function (lamp) {
				lamp.Far = vectors.Distance(lamp.At, from);

				return lamp;
			}).sort(function (a, b) {
				return a.Far - b.Far;
			}).slice(0, 24);

			if (scene.Ground)
				lampShadows();

			scene.Lamps.forEach(function (lamp, index) {
				var settings = lamp.Settings;
				var color = Array.isArray(settings.Color) ? settings.Color : paint(settings.Color);
				var flicker = 1 + number(settings.Flicker, 0) * (Math.sin(scene.Seconds * 11 + (lamp.Object.Seed || 0) * 40) * 0.5 + Math.sin(scene.Seconds * 23 + (lamp.Object.Seed || 0) * 13) * 0.3);
				var power = number(settings.Power, 1) * flicker * 6;
				var at = vectors.Subtract(lamp.At, scene.Eye);
				var spot = number(settings.Spot, 0);
				var aim = vectors.Normalize(settings.Aim || [0, -1, 0]);

				lamp.Color = color.slice(0, 3);

				data.push(at[0], at[1], at[2], number(settings.Radius, 14), color[0] * power, color[1] * power, color[2] * power, index < 2 && lampMaps[index] ? 1 : 0, aim[0], aim[1], aim[2], spot ? Math.cos(spot * Math.PI / 360) : -2);
			});

			while (data.length < 288)
				data.push(0);

			return {uLocal: data, uLocalCount: scene.Lamps.length, uLampShadow0: lampMaps[0] ? lampMaps[0].Map : gpu.NoShadow, uLampShadow1: lampMaps[1] ? lampMaps[1].Map : gpu.NoShadow, uLampMatrix0: lampMaps[0] ? lampMaps[0].Matrix : graphics.Identity(), uLampMatrix1: lampMaps[1] ? lampMaps[1].Matrix : graphics.Identity()};
		}

		/* The lamps of the models in the scene, where their objects stand: Lights false on an object leaves them out. */
		function builtLamps () {
			var lamps = [];

			scene.Order.forEach(function (object) {
				var settings = trait(object, 'Model');
				var made;

				if (!settings || object.Values.Lights === false || object.Values.Lights === 'false') return;

				made = modelOf(object, settings);

				if (!made || !made.Lamps || !made.Lamps.length) return;

				var scale = object.Scaled || vectors.Scale(settings.Scale || [1, 1, 1], object.Size || 1);
				var base = graphics.Multiply(object.Turn || graphics.Identity(), graphics.Scaling(scale[0], scale[1], scale[2]));
				var world = object.World || [0, 0, 0];
				var grown = Math.max(scale[0], scale[1], scale[2]);

				made.Lamps.forEach(function (lamp) {
					var at = vectors.Add(world, graphics.Apply(base, lamp.Place));

					lamps.push({Object: object, Built: true, At: at, Far: vectors.Distance(at, scene.Eye), Settings: {Color: lamp.Color, Power: lamp.Power, Radius: lamp.Radius * grown, Spot: lamp.Spot, Aim: lamp.Aim}});
				});
			});

			return lamps;
		}

		/* The sky, the ground and its water, under the things that stand on it. */
		/*
		 * A pane of a mirror or of glass: its middle at X and Y, Lift over the ground (or at Z), turned by Yaw and then
		 * leaned by Pitch (degrees); Width and Height. {Center, Normal, Model (relative to the eye), Width, Height}.
		 */
		function paneOf (object, settings) {
			var x = number(object.Values.X, 0);
			var z = number(object.Values.Y, 0);
			var center = object.Values.Z !== undefined && object.Values.Z !== '' ? [x, number(object.Values.Z, 0), z] : [x, Math.max(0, scene.Ground.Field.Height(x, z)) + number(settings.Lift, 1), z];
			var turn = graphics.Multiply(graphics.Rotation([0, 1, 0], number(settings.Yaw, 0) * Math.PI / 180), graphics.Rotation([1, 0, 0], number(settings.Pitch, 0) * Math.PI / 180));
			var width = number(settings.Width, 2);
			var height = number(settings.Height, 2);
			var at = vectors.Subtract(center, scene.Eye);

			return {Center: center, Normal: graphics.Apply(turn, [0, 0, 1]), Width: width, Height: height, Model: graphics.Multiply(graphics.Translation(at[0], at[1], at[2]), graphics.Multiply(turn, graphics.Multiply(graphics.Rotation([1, 0, 0], Math.PI / 2), graphics.Scaling(width, 1, height))))};
		}

		/*
		 * A pane a vehicle carries (its Mirrors and Screens: {At, Normal, Up, Width, Height} in its model), where it stands now: in the
		 * size of the vehicle and turned with it.
		 */
		function carPane (object, part) {
			var size = object.Scaled || [object.Size || 1, object.Size || 1, object.Size || 1];
			var turn = object.Turn || graphics.Identity();
			var base = graphics.Multiply(turn, graphics.Scaling(size[0], size[1], size[2]));
			var center = vectors.Add(object.World, graphics.Apply(base, part.At || [0, 0, 0]));
			var normal = vectors.Normalize(vectors.Subtract(graphics.Apply(turn, part.Normal || [0, 0, -1]), graphics.Apply(turn, [0, 0, 0])));
			var up = vectors.Normalize(vectors.Subtract(graphics.Apply(turn, part.Up || [0, 1, 0]), graphics.Apply(turn, [0, 0, 0])));
			var right = vectors.Normalize(vectors.Cross(up, normal));
			var width = number(part.Width, 0.2) * size[0];
			var height = number(part.Height, 0.1) * size[1];
			var at = vectors.Subtract(center, scene.Eye);

			up = vectors.Cross(normal, right);

			return {Center: center, Normal: normal, Width: width, Height: height, Model: graphics.Multiply(graphics.Translation(at[0], at[1], at[2]), graphics.Multiply([right[0], right[1], right[2], 0, up[0], up[1], up[2], 0, normal[0], normal[1], normal[2], 0, 0, 0, 0, 1], graphics.Multiply(graphics.Rotation([1, 0, 0], Math.PI / 2), graphics.Scaling(width, 1, height))))};
		}

		/* The vehicle the keys drive, if it carries mirrors or screens: only its own are drawn, the others' are too small to see. */
		function drivenCar () {
			var hero = scene.Objects[scene.Hero];

			return hero && hero.World && hero.Values.Vehicle && (hero.Values.Vehicle.Mirrors || hero.Values.Vehicle.Screens) ? hero : null;
		}

		/* What reflects the world: mirrors and glass that reflects, each with its pane; the mirrors of the car that is driven, small. */
		function reflectorsOf () {
			var car = drivenCar();

			return scene.Active.filter(reflects).map(function (object) {
				var settings = trait(object, 'Mirror') || trait(object, 'Glass');

				return {Key: object.ID, Pane: paneOf(object, settings), Settings: settings};
			}).concat(car ? (car.Values.Vehicle.Mirrors || []).map(function (mirror, index) {
				return {Key: 'car:' + car.ID + ':' + index, Pane: carPane(car, mirror), Settings: Object.assign({Every: 2}, mirror), Small: true};
			}) : []);
		}

		/* What has a picture of the world reflected: a mirror, glass that reflects at all (Reflect). */
		function reflects (object) {
			var glass = trait(object, 'Glass');

			return !!trait(object, 'Mirror') || !!glass && number(glass.Reflect, 0.35) > 0;
		}

		/* A projection whose near plane is a plane of the view ([a, b, c, d], what it keeps on its side): Lengyel's oblique frustum. */
		function oblique (projection, plane) {
			var m = projection.slice();
			var q = [(Math.sign(plane[0]) + m[8]) / m[0], (Math.sign(plane[1]) + m[9]) / m[5], -1, (1 + m[10]) / m[14]];
			var s = 2 / (plane[0] * q[0] + plane[1] * q[1] + plane[2] * q[2] + plane[3] * q[3]);

			m[2] = plane[0] * s;
			m[6] = plane[1] * s;
			m[10] = plane[2] * s + 1;
			m[14] = plane[3] * s;

			return m;
		}

		/*
		 * The mirrors and the glass in view, the nearest first (one at low and medium, two at high, three at ultra): each its picture, the world
		 * drawn by world(viewProjection, eye) at half the size (a quarter for the mirrors of a car), made again every Every frames. A
		 * mirror seen from behind shows nothing.
		 */
		function mirrorsOf (projection, view, world) {
			var level = self.Graphics().Level;
			var most = level === 'ultra' ? 3 : level === 'high' ? 2 : 1;
			var made = {};
			var kept = gpu.Mirrors = gpu.Mirrors || {};
			var tick = scene.MirrorTick = (scene.MirrorTick || 0) + 1;
			var all = reflectorsOf();
			var keys = {};

			all.map(function (one) {
				var at = vectors.Subtract(one.Pane.Center, scene.Eye);

				keys[one.Key] = true;

				return Object.assign(one, {At: at, Far: vectors.Length(at), Seen: vectors.Dot(at, one.Pane.Normal) < 0});
			}).filter(function (one) {
				var seen = graphics.Apply(graphics.Multiply(projection, view), one.At);

				return one.Seen && (one.Far < Math.max(one.Pane.Width, one.Pane.Height) * 2 || Math.abs(seen[0]) < 1.4 && Math.abs(seen[1]) < 1.4 && seen[2] < 1);
			}).sort(function (a, b) {
				return a.Far - b.Far;
			}).slice(0, most).forEach(function (one) {
				var settings = one.Settings;
				var target = kept[one.Key];
				var width = Math.max(1, renderer.Width >> (one.Small ? 2 : 1));
				var height = Math.max(1, renderer.Height >> (one.Small ? 2 : 1));
				var n = one.Pane.Normal;
				var d = vectors.Dot(n, one.At);
				var reflection = [1 - 2 * n[0] * n[0], -2 * n[1] * n[0], -2 * n[2] * n[0], 0, -2 * n[0] * n[1], 1 - 2 * n[1] * n[1], -2 * n[2] * n[1], 0, -2 * n[0] * n[2], -2 * n[1] * n[2], 1 - 2 * n[2] * n[2], 0, 2 * d * n[0], 2 * d * n[1], 2 * d * n[2], 1];
				var inverse = graphics.Invert(view);
				var plane = [-n[0], -n[1], -n[2], d];
				var near = [0, 1, 2, 3].map(function (row) {
					return inverse[row * 4] * plane[0] + inverse[row * 4 + 1] * plane[1] + inverse[row * 4 + 2] * plane[2] + inverse[row * 4 + 3] * plane[3];
				});

				if (!target || target.Width !== width || target.Height !== height) {
					if (target)
						target.Destroy();

					target = kept[one.Key] = renderer.Target(width, height, {Depth: true, Float: true, Mipmaps: true});
					target.Drawn = false;
				}

				made[one.Key] = target;

				if (target.Drawn && tick % Math.max(1, Math.round(number(settings.Every, 1)))) return;

				target.Begin();

				renderer.Clear([0, 0, 0, 1]);
				renderer.Winding(true);

				world(graphics.Multiply(oblique(projection, near), graphics.Multiply(view, reflection)), [2 * d * n[0], 2 * d * n[1], 2 * d * n[2]]);

				renderer.Winding(false);

				target.End();

				target.Drawn = true;
			});

			/* What no longer reflects lets its picture go. */
			Object.keys(kept).forEach(function (id) {
				if (!keys[id]) {
					kept[id].Destroy();

					delete kept[id];
				}
			});

			return made;
		}

		/*
		 * The panes: a mirror opaque, as clear as Strength and as soft as Blur, Tint over it; glass after all, blended over what
		 * is behind it without touching its alpha (how glossy it is: the reflections of the screen read it).
		 */
		function drawPanes (uniforms, mirrored, later) {
			var ground = scene.Ground;
			var white = gpu.White = gpu.White || renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255, 255, 255, 255])}, {Nearest: true});

			gpu.Pane = gpu.Pane || renderer.Mesh(graphics.Plane({Width: 1, Depth: 1, Segments: 1}));
			gpu.Mirror = gpu.Mirror || renderer.Program(shaders.PaneVertex, shaders.Mirror);
			gpu.Glass = gpu.Glass || renderer.Program(shaders.PaneVertex, shaders.Glass);

			scene.Active.forEach(function (object) {
				var mirror = trait(object, 'Mirror');
				var glass = trait(object, 'Glass');
				var pane;

				if (mirror) {
					pane = paneOf(object, mirror);

					renderer.Draw(gpu.Pane, gpu.Mirror, uniforms({uModel: pane.Model, uMirror: mirrored[object.ID] ? mirrored[object.ID].Textures[0] : white, uOn: mirrored[object.ID] ? 1 : 0, uScreen: [renderer.Width, renderer.Height], uSize: [pane.Width, pane.Height], uSkyLight: ground.SkyLight, uTint: paint(mirror.Tint || '#ffffff').slice(0, 3), uBlur: Math.max(0, Math.min(1, number(mirror.Blur, 0))), uStrength: Math.max(0, Math.min(1, number(mirror.Strength, 0.92)))}), {Cull: 'none'});
				}

				if (glass) {
					later.push(function () {
						pane = paneOf(object, glass);

						renderer.Draw(gpu.Pane, gpu.Glass, uniforms({uModel: pane.Model, uSize: [pane.Width, pane.Height], uMirror: mirrored[object.ID] ? mirrored[object.ID].Textures[0] : white, uOn: mirrored[object.ID] ? 1 : 0, uScreen: [renderer.Width, renderer.Height], uTint: paint(glass.Tint || '#cfe6f0').slice(0, 3), uClarity: Math.max(0, Math.min(1, number(glass.Clarity, 0.88))), uFrost: Math.max(0, Math.min(1, number(glass.Frost, 0))), uReflect: Math.max(0, Math.min(1, number(glass.Reflect, 0.35))), uSun: ground.Sun, uSunColor: ground.SunColor, uSkyLight: ground.SkyLight}), {Blend: 'over', DepthWrite: false, Cull: 'none'});
					});
				}
			});

			var car = drivenCar();
			if (!car) return;

			/* The mirrors of the car that is driven, and its screens: pictures of what the page shows. */
			(car.Values.Vehicle.Mirrors || []).forEach(function (mirror, index) {
				var key = 'car:' + car.ID + ':' + index;
				var pane = carPane(car, mirror);

				renderer.Draw(gpu.Pane, gpu.Mirror, uniforms({uModel: pane.Model, uMirror: mirrored[key] ? mirrored[key].Textures[0] : white, uOn: mirrored[key] ? 1 : 0, uScreen: [renderer.Width, renderer.Height], uSize: [pane.Width, pane.Height], uSkyLight: ground.SkyLight, uTint: paint(mirror.Tint || '#ffffff').slice(0, 3), uBlur: Math.max(0, Math.min(1, number(mirror.Blur, 0))), uStrength: Math.max(0, Math.min(1, number(mirror.Strength, 0.85)))}), {Cull: 'none'});
			});

			gpu.ScreenProgram = gpu.ScreenProgram || renderer.Program(shaders.PaneVertex, shaders.Screen);

			(car.Values.Vehicle.Screens || []).forEach(function (screen, index) {
				var picture = screenOf(car, screen, index);
				var pane = carPane(car, screen);

				if (picture)
					renderer.Draw(gpu.Pane, gpu.ScreenProgram, uniforms({uModel: pane.Model, uPicture: picture, uBright: number(screen.Bright, 1)}), {Cull: 'none'});
			});
		}

		/*
		 * The picture of a screen of a car: an element of the page ([data-screen] of its Source, in the screens slot), drawn as it
		 * is styled into a picture (SVG foreignObject) every Every seconds (0.15), Pixels [width, height] (512 by 256). Null before
		 * its first picture, or where the browser cannot draw it.
		 */
		function screenOf (car, screen, index) {
			var key = 'screen:' + car.ID + ':' + index;
			var state = (gpu.Screens = gpu.Screens || {})[key] = gpu.Screens[key] || {At: 0};
			var moment = view.performance ? view.performance.now() : Date.now();
			var element = self.$Element().querySelector('[data-screen="' + String(screen.Source || '') + '"]');
			var pixels = screen.Pixels || [512, 256];

			if (element && !state.Busy && !state.Failed && moment - state.At > number(screen.Every, 0.15) * 1000) {
				state.Busy = true;

				engine.Rasterize(element, pixels[0], pixels[1], function (error, canvas) {
					state.Busy = false;
					state.At = moment;

					if (error) {
						state.Failed = error;

						return;
					}

					if (state.Texture) state.Texture.Update(canvas);
					else state.Texture = renderer.Texture(canvas, {Mipmaps: true});
				});
			}

			return state.Texture || null;
		}

		/*
		 * An element of the page as a picture: a copy of it with every style it is shown with written on it, in an SVG foreignObject,
		 * drawn into a canvas of width by height. callback(error, canvas).
		 */
		engine.Rasterize = function (element, width, height, callback) {
			var document = element.ownerDocument;
			var copy = element.cloneNode(true);
			var canvas = document.createElement('canvas');
			var picture = new view.Image();

			/* Each copy takes the styles its original is shown with: the picture has no stylesheet of the page. */
			function styled (original, made) {
				var style;
				var i;

				if (original.nodeType !== 1) return;

				style = view.getComputedStyle(original);

				for (i = 0; i < style.length; i++)
					made.style.setProperty(style[i], style.getPropertyValue(style[i]));

				for (i = 0; i < original.childNodes.length; i++)
					styled(original.childNodes[i], made.childNodes[i]);
			}

			styled(element, copy);

			copy.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

			copy.style.margin = '0';
			copy.style.width = width + 'px';
			copy.style.height = height + 'px';

			canvas.width = width;
			canvas.height = height;

			picture.onload = function () {
				canvas.getContext('2d').drawImage(picture, 0, 0, width, height);

				callback(null, canvas);
			};

			picture.onerror = function () {
				callback(new Error('Elemenx GameScene: a screen could not be drawn'));
			};

			picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><foreignObject width="100%" height="100%">' + new view.XMLSerializer().serializeToString(copy) + '</foreignObject></svg>');
		};

		function drawGround (matrix, nodes, shade, mirror) {
			var ground = scene.Ground;
			var field = ground.Field;
			var air = [0.55, 0.72, 1, 0.95];
			var fog = scene.Camera.Ortho || self.Graphics().Post ? 1e9 : field.Size * 0.9;

			/* The stars first: the air, its sun and its moon come over them (not in a mirror: they keep to the view of the eye). */
			if (!scene.Camera.Ortho && ground.StarLimit < 1 && !mirror) {
				engine.CosmosNight(matrix, ground, ground.StarTurn, ground.GalaxyLight);

				var aspect = renderer.Width / Math.max(1, renderer.Height);

				gpu.NightStars = gpu.NightStars || nightStars();

				renderer.Draw(gpu.NightStars, gpu.StarsTurned, {uViewProjection: graphics.Multiply(graphics.Perspective(scene.Camera.Fov, aspect, 0.1, 200), graphics.LookAt([0, 0, 0], vectors.Subtract(scene.Camera.Target, scene.Camera.Position), scene.Camera.Up)), uRatio: renderer.Ratio, uTurn: ground.StarTurn, uLimit: ground.StarLimit, uTime: scene.Seconds}, {Depth: false, DepthWrite: false, Blend: 'add'});
			}

			if (!scene.Camera.Ortho)
				renderer.Draw(gpu.Quad, gpu.Sky, {uInverse: graphics.Invert(matrix), uSun: ground.Sky, uSunColor: ground.SunColor, uAir: air, uUp: [0, 1, 0], uHigh: 0, uCover: ground.Shut, uEclipse: ground.Eclipse, uRainbow: ground.Air.Rainbow || 0, uMoonShade: ground.Moon ? ground.Moon.Shade : 0, uGlow: ground.Glow, uGlowWay: ground.GlowWay, uMoon: ground.Moon ? ground.Moon.Way : [0, 1, 0], uMoonLit: ground.Moon ? ground.Moon.Lit : [0, 1, 0], uMoonSize: ground.Moon ? ground.Moon.Size : 0, uMoonGlow: ground.Moon ? Math.min(1, ground.Moon.Glow) * Math.max(0, Math.min(1, ground.Moon.Way[1] / 0.15)) : 0}, {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});

			/* One set of uniforms for all the squares, their places set for each; a ground with a Blueprint drawn by its graph. */
			var settings = trait(scene.Objects[ground.ID], 'Terrain');
			var own = settings && settings.Blueprint ? blueprinted(settings, 'Land') : null;
			var program = own ? gpu.LandOf(own) : gpu.Land;
			var land = Object.assign({uViewProjection: matrix, uSun: ground.Sun, uSunColor: ground.SunColor, uAir: air, uFog: fog, uSkyLight: ground.SkyLight, uFloorLight: ground.FloorLight, uWet: ground.Air.Wet, uSnowed: ground.Air.Cover || 0, uRainDrops: ground.Air.Rain, uTime2: scene.Seconds % 1000}, shade, own ? own.Made.Values(settings.Parameters || {}, {Time: scene.Seconds % 3000}) : null);

			nodes.forEach(function (node) {
				land.uOffset = vectors.Subtract(node.Center, scene.Eye);
				land.uCenter = node.Center;

				renderer.Draw(node.Mesh, program, land, {Cull: 'back'});
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
			var high;
			var arrive;
			var sweep = 0.5;
			var relief = {terran: 8, ocean: 6, desert: 7, rocky: 9, moon: 10, dwarf: 6, ice: 5, lava: 6};

			if (!object || !trait(object, 'Body') || type === 'gas' || type === 'ice-giant') return false;

			place(scene.Time);

			up = vectors.Normalize(settings.Latitude !== undefined ? toDirection(Number(settings.Latitude) || 0, Number(settings.Longitude) || 0) : vectors.Subtract(scene.Camera.Position, object.World));

			/* The direction in the frame of the body: its own turn taken away, so the ground under the eye stays. */
			up = graphics.Apply(graphics.Invert(object.Turn) || graphics.Identity(), up);

			/* It starts where the eye stands now: at the height from which the body looks as large as it does from here. */
			high = Math.max(object.Radius * 0.4, Math.min(object.Radius * 8, object.Radius * (vectors.Distance(scene.Camera.Position, object.World) / Math.max(object.Size, 1e-6) - 1)));
			arrive = settings.Altitude === undefined ? 0.6 : Math.max(0.0015, Number(settings.Altitude));

			/* A place it was told comes straight under it; else the ground passes under the eye on the way down. */
			if (settings.Latitude !== undefined)
				sweep = 0;

			scene.Surface = {
				ID: object.ID,
				Field: terrain.Sphere({Radius: object.Radius, Height: relief[type] || 6, Seed: object.Seed, Ocean: object.Look.Ocean, Type: type}),
				Nodes: {},
				Up: vectors.Normalize(up),
				Yaw: 0,
				Pitch: settings.Instant ? -0.2 : -1.52,
				Altitude: settings.Instant ? arrive : high,
				Wanted: arrive,
				Way: settings.Instant ? null : {Time: 0, Length: 9, From: high, Sweep: sweep, Done: 0, Pitch: -1.52},
				Heat: 0,
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
			surface.Way = {Time: 0, Length: 8, From: surface.Altitude, Sweep: 0.3, Done: 0, Pitch: surface.Pitch};

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

		/*
		 * The way down or up, in one piece: the altitude goes evenly on its scale, the ground passes under the eye, and the
		 * eye looks at the body from high up and at the horizon near the ground (going up: ahead first, then back at the body).
		 */
		function flyWay (surface, elapsed) {
			var way = surface.Way;
			var field = surface.Field;
			var t = Math.min(1, (way.Time += elapsed) / way.Length);
			var eased = t * t * (3 - 2 * t);
			var axes = ground(surface.Up);
			var heading = vectors.Add(vectors.Scale(axes.North, Math.cos(surface.Yaw)), vectors.Scale(axes.East, Math.sin(surface.Yaw)));
			var air = scene.Objects[surface.ID] ? scene.Objects[surface.ID].Look.Atmosphere[3] : 0;
			var turned;

			surface.Altitude = Math.exp(Math.log(way.From) + (Math.log(Math.max(0.0005, surface.Wanted)) - Math.log(way.From)) * eased);
			surface.Up = vectors.Normalize(vectors.Add(surface.Up, vectors.Scale(heading, (eased - way.Done) * way.Sweep)));
			way.Done = eased;

			if (surface.Rising) {
				turned = Math.max(0, Math.min(1, (t - 0.4) / 0.55));
				surface.Heat = 0;

				if (!scene.Drag)
					surface.Pitch = t < 0.3 ? way.Pitch + (0.15 - way.Pitch) * (t / 0.3) : 0.15 + (-1.52 - 0.15) * turned * turned * (3 - 2 * turned);
			}
			else {
				turned = Math.max(0, Math.min(1, (t - 0.35) / 0.5));
				surface.Heat = air * 0.2 * Math.pow(Math.max(0, 1 - Math.abs(Math.log(surface.Altitude / 80)) / 1.4), 2);

				if (!scene.Drag)
					surface.Pitch = way.Pitch + (-0.15 - way.Pitch) * turned * turned * (3 - 2 * turned);
			}

			if (t >= 1) {
				surface.Way = null;
				surface.Heat = 0;
			}

			return field;
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
			var keys = engine.PadKeys(surface.Keys);
			var eye;
			var look;

			if (surface.Way) flyWay(surface, elapsed);
			else surface.Altitude = Math.exp(Math.log(Math.max(0.0005, surface.Altitude)) + (Math.log(Math.max(0.0005, surface.Wanted)) - Math.log(Math.max(0.0005, surface.Altitude))) * (1 - Math.exp(-elapsed * 1.2)));

			if (keys.KeyQ)
				surface.Yaw -= elapsed * 1.3;

			if (keys.KeyE)
				surface.Yaw += elapsed * 1.3;

			if (keys.KeyR)
				surface.Pitch = Math.min(1.4, surface.Pitch + elapsed);

			if (keys.KeyF)
				surface.Pitch = Math.max(-1.55, surface.Pitch - elapsed);

			/* The right stick of a pad looks round. */
			surface.Yaw += keys.Pad.LookX * elapsed * 1.3;
			surface.Pitch = Math.max(-1.55, Math.min(1.4, surface.Pitch + keys.Pad.LookY * elapsed));

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

			move = [Math.max(-1, Math.min(1, move[0] + keys.Pad.Y)), Math.max(-1, Math.min(1, move[1] + keys.Pad.X))];

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
			var away;

			Object.keys(surface.Nodes).forEach(function (key) {
				if (surface.Nodes[key].Mesh)
					surface.Nodes[key].Mesh.Destroy();
			});

			scene.Surface = null;
			labels.hidden = false;
			self.Landed = '';

			if (object) {
				focusOn(object.ID, true);

				/* The view of space takes over where the way up ended: the body as large, on the same side. */
				place(scene.Time);

				away = graphics.Apply(object.Turn || graphics.Identity(), surface.Up);
				scene.Yaw = Math.atan2(away[0], away[2]);
				scene.Pitch = Math.asin(Math.max(-1, Math.min(1, away[1])));
				scene.Distance = scene.Wanted = object.Size * (surface.Field.Radius + surface.Altitude) / surface.Field.Radius;
				scene.Moving = 1;
			}

			self.$Emit('takeoff', {ID: surface.ID});
		}

		/* The squares of the faces of the cube in view, the finer the nearer; each made once, a few a frame. */
		function patches () {
			var surface = scene.Surface;
			var field = surface.Field;
			var wanted = [];
			var horizon = Math.acos(Math.min(1, field.Radius / (field.Radius + Math.max(0.001, surface.Altitude) + field.Height)));
			var missing = [];
			var started = window.performance.now();
			var face;

			function keyOf (face, u, v, level) {
				return face + ':' + u.toFixed(6) + ':' + v.toFixed(6) + ':' + level;
			}

			/* The faces at once, their parts by a worker. */
			function build (face, u, v, size, level) {
				var key = keyOf(face, u, v, level);
				var made;

				if (level) {
					askPiece(surface, key, 'Sphere', [face, u, v, size, 24], function (piece) {
						made = piece || field.Patch(face, u, v, size, 24);

						surface.Nodes[key] = {Mesh: renderer.Mesh(made.Geometry), Center: made.Center, Used: surface.Frame};
					});

					return;
				}

				made = field.Patch(face, u, v, size, 24);

				surface.Nodes[key] = {Mesh: renderer.Mesh(made.Geometry), Center: made.Center, Used: surface.Frame};
			}

			/* Behind the horizon: not drawn. */
			function hidden (direction, size) {
				return Math.acos(Math.max(-1, Math.min(1, vectors.Dot(direction, vectors.Normalize(surface.Eye))))) - size * 0.9 > horizon + 0.05;
			}

			/* As on a map: a square gives way to its parts only when all those in view are made, so there is never a hole. */
			function visit (face, u, v, size, level) {
				var direction = vectors.Normalize(terrain.Face(face, u, v));
				var near = vectors.Distance(vectors.Scale(direction, field.Radius), surface.Eye);
				var node;
				var half = size / 2;
				var parts;
				var absent;

				if (hidden(direction, size)) return;

				node = surface.Nodes[keyOf(face, u, v, level)];

				if (!node) {
					build(face, u, v, size, level);

					node = surface.Nodes[keyOf(face, u, v, level)];
				}

				node.Used = surface.Frame;

				if (level < 17 && near < field.Radius * size * 0.75 * 2.2) {
					parts = [[u - half / 2, v - half / 2], [u + half / 2, v - half / 2], [u - half / 2, v + half / 2], [u + half / 2, v + half / 2]].filter(function (part) {
						return !hidden(vectors.Normalize(terrain.Face(face, part[0], part[1])), half);
					});

					absent = parts.filter(function (part) {
						return !surface.Nodes[keyOf(face, part[0], part[1], level + 1)];
					});

					if (!absent.length) {
						parts.forEach(function (part) {
							visit(face, part[0], part[1], half, level + 1);
						});

						return;
					}

					absent.forEach(function (part) {
						missing.push({Face: face, U: part[0], V: part[1], Size: half, Level: level + 1, Near: near});
					});
				}

				wanted.push(node);
			}

			surface.Frame++;

			for (face = 0; face < 6; face++)
				visit(face, 0, 0, 2, 0);

			/* The nearest first, for as long as a frame can spare. */
			missing.sort(function (a, b) {
				return a.Near - b.Near;
			});

			missing.some(function (one) {
				build(one.Face, one.U, one.V, one.Size, one.Level);

				return window.performance.now() - started > 5 || terrain.Work().Waiting() > 8;
			});

			return wanted;
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

		/* The clouds of a body, as low over its ground as they are from space: a layer of kilometres, in the axes of the eye. */
		function surfaceClouds (surface, object, sun, sunColor) {
			var axes = surface.Axes;
			var cover = Number(object.Look.Clouds) || 0;
			var day = Math.max(0, Math.min(1, vectors.Dot(sun, axes.Up) * 3 + 0.2));

			if (!cover || !object.Look.Atmosphere[3]) return null;

			self.Weather = cover > 0.7 ? 'overcast' : cover > 0.3 ? 'cloudy' : 'clear';

			return {Turn: [axes.East[0], axes.Up[0], axes.North[0], axes.East[1], axes.Up[1], axes.North[1], axes.East[2], axes.Up[2], axes.North[2]], From: [surface.Eye[0] * 0, surface.Altitude, 0], Sun: [vectors.Dot(sun, axes.East), vectors.Dot(sun, axes.Up), vectors.Dot(sun, axes.North)], SunLight: [sunColor[0] * 2 * day, sunColor[1] * 2 * day, sunColor[2] * 2 * day], SkyTone: [0.34 * day + 0.01, 0.4 * day + 0.012, 0.5 * day + 0.02], Under: [0, 0, 0], Layer: [3, 9, 0.25], Over: true};
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

			engine.CosmosBake();

			posted = engine.PostBegin();

			renderer.Clear([0, 0, 0, 1]);

			engine.CosmosDraw(matrix, matrix);

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
					uRadius: field.Radius,
					uTime: scene.Seconds,
					uFog: Math.max(field.Radius * 0.02, far * 0.6),
					uHigh: Math.min(1, surface.Altitude / thickness)
				}, shade), {Cull: 'back'});
			});

			if (posted)
				engine.PostEnd(Object.assign({Matrix: matrix, Sun: sun, SunColor: sunColor, Sky: false, Heat: surface.Heat, Clouds: surfaceClouds(surface, object, sun, sunColor)}, lens()));

			forget();
		}

		function frame (now, quiet) {
			/* The time of the game keeps to the clock on a slow machine too (up to a second, a page may have slept); what eases takes small steps. */
			var spent = scene.Last ? Math.min(1, (now - scene.Last) / 1000) : 0;
			var elapsed = Math.min(0.1, spent);

			scene.Last = now;

			if (self.Axes && Math.abs(scene.Yaw - self.ViewYaw) + Math.abs(scene.Pitch - self.ViewPitch) > 0.004) {
				self.ViewYaw = scene.Yaw;
				self.ViewPitch = scene.Pitch;
			}

			/* On a surface the days go at their own speed (a day of two minutes by default), not at the one of the orbits. */
			if (!self.Paused)
				scene.Time += spent * (scene.Surface ? number(self.SurfaceSpeed, 1 / 120) : number(self.Speed, 1));

			if (!self.Paused)
				scene.Seconds += spent;

			engine.WeatherStep(spent);

			groundOf();

			engine.RigidStep(elapsed);

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

			engine.TriggersStep(spent);

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

		/* The object at a point of the canvas: of those that can be selected, or with all of any of them (an editor's). */
		function pick (x, y, all) {
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
				if (all && !trait(object, 'Selectable')) {
					if (!trait(object, 'Terrain') && !trait(object, 'Sun') && !trait(object, 'Location'))
						test(object, 14);

					return;
				}

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

		/* The view: what it looks at, from where, its angles (radians) and distance. */
		engine.Viewpoint = function () {
			return {Target: (scene.Ground && scene.Ground.Target || scene.Target || [0, 0, 0]).slice(), Eye: scene.Camera.Position.slice(), Yaw: scene.Yaw, Pitch: scene.Pitch, Distance: scene.Wanted};
		};

		/* The view set at once (an editor's): round Target from Yaw and Pitch at Distance, no object in focus. */
		engine.SetViewpoint = function (view) {
			var target = view.Target || scene.Target || [0, 0, 0];

			scene.Focus = '';
			scene.Flight = null;
			scene.Pan = target.slice();
			scene.From = target.slice();
			scene.Target = target.slice();
			scene.Moving = 1;

			/* On a ground the view holds the height it is given, as long as it follows nothing. */
			if (scene.Ground) {
				scene.Ground.Target = target.slice();
				scene.Ground.Held = true;
			}

			if (view.Yaw !== undefined)
				scene.Yaw = view.Yaw;

			if (view.Pitch !== undefined)
				scene.Pitch = Math.max(-1.55, Math.min(1.55, view.Pitch));

			if (view.Distance !== undefined)
				scene.Distance = scene.Wanted = Math.max(0.05, view.Distance);

			scene.Camera.Orbit(scene.Target, scene.Yaw, scene.Pitch, scene.Distance);

			scene.Eye = scene.Camera.Position.slice();
			scene.Rest = 0;
		};

		/* Where a point of the world is on the canvas, in its pixels: {X, Y, Depth, Visible}. */
		engine.Project = function (point) {
			return scene.Camera.Project(point, scene.Width, scene.Height);
		};

		engine.Ray = function (x, y) {
			return scene.Camera.Ray(x, y, scene.Width, scene.Height);
		};

		/* The point of the ground a point of the canvas shows: along the ray in steps, then halved down to the surface; null where it shows none. */
		engine.GroundPoint = function (x, y) {
			var field = scene.Ground ? scene.Ground.Field : null;
			var space = graphics.Vectors;
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var far = Math.max(scene.Distance * 40, 400);
			var step = Math.max(0.25, far / 600);
			var before = 0;
			var t = 0;
			var low;
			var high;
			var i;

			function above (at) {
				var p = space.Add(ray.Origin, space.Scale(ray.Direction, at));

				return p[1] - Math.max(0, field.Height(p[0], p[2]));
			}

			if (!field)
				return null;

			while (t < far) {
				if (above(t) <= 0) {
					low = before;
					high = t;

					for (i = 0; i < 24; i++) {
						if (above((low + high) / 2) > 0) low = (low + high) / 2;
						else high = (low + high) / 2;
					}

					return space.Add(ray.Origin, space.Scale(ray.Direction, high));
				}

				before = t;

				t += step;
			}

			return null;
		};

		/*
		 * The orbit that puts an object under a point of the canvas, round its parent in the plane of its parent's middle: its
		 * Distance (in AU, or in radii of the parent for an orbit in radii) and its Anomaly in degrees, turned on from the one it
		 * has by the angle between where it is and that point; null with no orbit, no parent, or a ray along the plane.
		 */
		engine.OrbitAt = function (id, x, y) {
			var object = scene.Objects[id];
			var orbit = trait(object, 'Orbit');
			var parent = object ? parentOf(object) : null;
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var base;
			var t;
			var relative;
			var now;
			var length;
			var turned;
			var anomaly;
			var distance;

			if (!orbit || !parent || !parent.World || !object.World || Math.abs(ray.Direction[1]) < 1e-6) return null;

			base = parent.World;
			t = (base[1] - ray.Origin[1]) / ray.Direction[1];

			if (!(t > 0)) return null;

			relative = [ray.Origin[0] + ray.Direction[0] * t - base[0], 0, ray.Origin[2] + ray.Direction[2] * t - base[2]];
			now = vectors.Subtract(object.World, base);
			length = Math.max(1e-6, vectors.Length(relative));

			/* The angle in the plane, as an orbit goes: from X toward -Z of the view. */
			turned = (Math.atan2(-relative[2], relative[0]) - Math.atan2(-now[2], now[0])) * 180 / Math.PI;
			anomaly = orbit.Anomaly === undefined || orbit.Anomaly === null || orbit.Anomaly === '' ? object.Seed * 180 / Math.PI : number(orbit.Anomaly, 0);

			/* The length of the view back into AU, as spread lays it out. */
			if (orbit.Unit === 'radii') distance = length / (parent.Size || 1);
			else if (self.Scale === 'real') distance = length / UNIT;
			else if (parent.Radius) distance = Math.pow(Math.max(0, (length / parent.Size - 1) / 0.6), 2) * parent.Radius * KM;
			else distance = Math.pow(length / 12, 2);

			return {Distance: distance, Anomaly: ((anomaly + turned) % 360 + 360) % 360};
		};

		engine.Local = localPoint;
		engine.Select = select;
		engine.FocusOn = focusOn;

		/* No renderer, no Lighting: a browser out of contexts still runs the frames of the scene, under a calm sky. */
		engine.WeatherStep = function () {};

		engine.WeatherNow = function () {
			return {Clouds: 0, Fog: 0, Rain: 0, Snow: 0, Wet: 0, Storm: 0, Flash: 0};
		};

		/* The keys walk this object and the view goes after it, close; none gives the view back. */
		engine.Control = function (id) {
			var object = id ? scene.Objects[id] : null;
			var same = !!object && scene.Hero === object.ID;
			var wanted = scene.Wanted;

			scene.Hero = object ? object.ID : '';

			if (object)
				focusOn(object.ID, true);

			/* Another body under the same name keeps the view as it is. */
			if (same) {
				scene.Wanted = wanted;
			}
			else if (object) {
				scene.Wanted = Math.max(2.5, object.Size * 3.2);
				scene.Pitch = 0.2;
			}

			return !!object || !id;
		};
		engine.Canonical = canonical;
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

			object.Clip = {Name: name, Start: scene.Seconds, Rate: 1, From: state ? state.Name : '', FromTime: state ? (state.At || 0) + (state.Phase || 0) : 0, FromRate: state ? state.Rate : 0, Once: true, Callback: callback || null};

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

		/*
		 * What the scene is still waiting for: its programs, made by the card behind the page, and the models it asked for. Told as
		 * a part of a hundred, null when nothing is left. True while no picture can be drawn yet.
		 */
		function loading () {
			var left = renderer ? renderer.Progress() : {Done: 0, Total: 0, Needed: 0};
			var models = Object.keys(scene.Asked);
			var done = left.Done + models.filter(function (name) {
				return library.Ready(name);
			}).length;
			var total = left.Total + models.length;
			var part = done < total ? Math.floor(done * 100 / total) : null;

			/* All that is left may be one long thing behind the page: a bar that stands still would look stuck. */
			self.LoadingEndless = left.Needed === 0 && left.Done < left.Total;

			if (self.Loading !== part) {
				self.Loading = part;

				self.$Emit('loading', {Part: part === null ? 100 : part});
			}

			return left.Needed > 0;
		}

		scene.Loop = this.$Service('GameLoop').Create({Window: view, Render: function (part, loop) {
			var started = view.performance ? view.performance.now() : Date.now();
			var ended;

			/* The time of the frame the screen shows, not of when its turn came: an uneven turn would shake all that moves. */
			var now = loop.Now === null ? started : loop.Now;

			if (renderer && !scene.Warmed) {
				scene.Warmed = true;

				engine.PostWarm();
				engine.ScatterWarm();
				engine.EffectsWarm();
			}

			if (loading()) {
				frame(now, true);

				return;
			}

			/* What a person steers skips no frame: a gap in the picture reads as a shake of the view. */
			if (!scene.Seen || started < scene.Rest && !scene.Hero) {
				frame(now, true);

				return;
			}

			/* Here a frame need not wait for what the card makes behind it; one asked for by hand does. */
			scene.Looping = true;

			frame(now);

			scene.Looping = false;

			ended = view.performance ? view.performance.now() : Date.now();
			scene.Rest = ended - started > 24 ? ended + Math.min(1000, ended - started) : 0;
		}});

		scene.Loop.Start();

		if (!renderer)
			this.Unsupported = true;

		this.StrategyStart();
		this.TriggersStart();
		this.RigidStart();

		if (renderer) {
			this.ScatterStart();
			this.LightingStart();
			this.EffectsStart();
			this.CosmosStart();
			this.VehiclesStart();
		}

		window.setTimeout(function () {
			resize();

			if (!renderer)
				self.$Emit('error', {Reason: 'webgl2'});

			self.$Emit('ready', self);
		}, 0);
	},

	$OnDestroy: function () {
		document.removeEventListener('pointerlockchange', this.LockChanged);

		var scene = this.Scene ? this.Scene() : null;
		var renderer = this.Engine ? this.Engine().Renderer : null;

		if (!scene || !scene.Loop) return;

		scene.Gone = true;

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

	/* A press on an axis looks along it, at the middle of the view. */
	AxisChosen: function (event) {
		var scene = this.Scene();
		var yaw = {X: Math.PI / 2, Z: 0}[event.Axis];

		if (yaw === undefined) {
			scene.Pitch = event.Sign * 1.5;

			return;
		}

		scene.Pitch = 0;
		scene.Yaw = event.Sign > 0 ? yaw : yaw + Math.PI;
	},

	/* Pointers: a drag turns the view, two fingers zoom, a press selects. */
	Captured: function () {
		return !!document.pointerLockElement && this.$Element().contains(document.pointerLockElement);
	},

	PointerDown: function (event) {
		var self = this;
		var scene = this.Scene();
		var held = null;
		var point = this.Engine().Local(event);
		var pointers = scene.Pointers;
		var ids;

		event.preventDefault();

		this.$Element().focus({preventScroll: true});

		if (event.target.setPointerCapture && !document.pointerLockElement)
			event.target.setPointerCapture(event.pointerId);

		/* With a hero the first press takes the pointer: the mouse then turns the view by itself, Escape gives it back. */
		if (scene.Hero && self.Capture !== false && self.Capture !== 'false' && event.button === 0 && !this.Captured() && event.target.requestPointerLock)
			held = event.target.requestPointerLock();

		if (held && held.catch)
			held.catch(function () {});

		pointers[event.pointerId] = point;
		ids = Object.keys(pointers);

		if (ids.length === 2) {
			scene.Drag = null;
			scene.Pinch = {Distance: Math.max(1, Math.sqrt(Math.pow(pointers[ids[0]].X - pointers[ids[1]].X, 2) + Math.pow(pointers[ids[0]].Y - pointers[ids[1]].Y, 2))), Wanted: scene.Wanted, X: (pointers[ids[0]].X + pointers[ids[1]].X) / 2, Y: (pointers[ids[0]].Y + pointers[ids[1]].Y) / 2};

			return;
		}

		scene.Drag = {X: point.X, Y: point.Y, LastX: point.X, LastY: point.Y, Yaw: scene.Surface ? scene.Surface.Yaw : scene.Yaw, Pitch: scene.Surface ? scene.Surface.Pitch : scene.Pitch, Moved: false, Button: event.button, Pan: !scene.Hero && (event.button === 1 || event.shiftKey)};
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

		if (this.Captured()) {
			var driven = scene.Objects[scene.Hero];

			/* From the seat of a car the mouse is still, but with the right button down it turns the head. */
			scene.LookHeld = !!(event.buttons & 2);

			if (driven && driven.Values.Vehicle && driven.Values.Vehicle.Kind === 'car' && this.Person === 'first' && !scene.LookHeld) return;

			/* A browser reports a leap when the pointer is taken or given back: no hand moves so far in one event, or so suddenly. */
			var far = Math.max(Math.abs(event.movementX || 0), Math.abs(event.movementY || 0));
			var moment = performance.now();
			if (far > 400 || moment - (scene.LockAt || 0) < 80 || far > 120 && far > (scene.Flow || 0) * 5) return;

			scene.Looked = moment;
			scene.Flow = (scene.Flow || 0) * 0.8 + far * 0.2;
			scene.Looks = (scene.Looks || []).slice(-30).concat([{At: moment, Yaw: scene.Yaw, Pitch: scene.Pitch}]);
			scene.Yaw -= (event.movementX || 0) * 0.0035;
			scene.Pitch = Math.max(-1.3, Math.min(1.5, scene.Pitch + (event.movementY || 0) * 0.0035));

			return;
		}

		ids = Object.keys(pointers);

		if (scene.Pinch && ids.length === 2) {
			distance = Math.max(1, Math.sqrt(Math.pow(pointers[ids[0]].X - pointers[ids[1]].X, 2) + Math.pow(pointers[ids[0]].Y - pointers[ids[1]].Y, 2)));

			this.ZoomTo(scene.Pinch.Wanted * scene.Pinch.Distance / distance, true);

			/* Two fingers that go together carry the view. */
			this.Engine().PanView((pointers[ids[0]].X + pointers[ids[1]].X) / 2 - scene.Pinch.X, (pointers[ids[0]].Y + pointers[ids[1]].Y) / 2 - scene.Pinch.Y);

			scene.Pinch.X = (pointers[ids[0]].X + pointers[ids[1]].X) / 2;
			scene.Pinch.Y = (pointers[ids[0]].Y + pointers[ids[1]].Y) / 2;

			return;
		}

		if (!drag) return;

		if (Math.abs(point.X - drag.X) + Math.abs(point.Y - drag.Y) > 4)
			drag.Moved = true;

		if (!drag.Moved) return;

		this.Dragging = true;

		/* The middle button, or a drag with Shift, carries the view along the screen. */
		if (drag.Pan) {
			this.Engine().PanView(point.X - drag.LastX, point.Y - drag.LastY);

			drag.LastX = point.X;
			drag.LastY = point.Y;

			return;
		}

		/* On the ground the eye looks round: right to turn right, up to look up. */
		if (scene.Surface) {
			scene.Surface.Yaw = drag.Yaw + (point.X - drag.X) * 0.004;
			scene.Surface.Pitch = Math.max(-1.55, Math.min(1.4, drag.Pitch - (point.Y - drag.Y) * 0.004));

			return;
		}

		scene.Looked = performance.now();
		scene.Yaw = drag.Yaw - (point.X - drag.X) * 0.006;
		scene.Pitch = Math.max(-1.5, Math.min(1.5, drag.Pitch + (point.Y - drag.Y) * 0.006));
	},

	PointerUp: function (event) {
		var scene = this.Scene();
		var drag = scene.Drag;
		var point = this.Engine().Local(event);

		scene.LookHeld = false;

		delete scene.Pointers[event.pointerId];

		if (scene.Pinch) {
			if (!Object.keys(scene.Pointers).length)
				scene.Pinch = null;

			return;
		}

		scene.Drag = null;
		this.Dragging = false;

		if (scene.Hero) return;

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
		var least = scene.Ground ? 1.5 : focus && focus.Size ? focus.Size * 1.4 : 0.05;
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
		if (id && !this.Scene().Hero)
			this.FocusOn(id);
	},

	LabelPressed: function (event) {
		var button = event.target.closest ? event.target.closest('[data-id]') : null;
		if (button)
			this.Engine().Select(button.getAttribute('data-id'));
	},

	LabelDouble: function (event) {
		var button = event.target.closest ? event.target.closest('[data-id]') : null;
		if (button && !this.Scene().Hero)
			this.FocusOn(button.getAttribute('data-id'));
	},

	Key: function (event) {
		if (this.Cells) {
			this.MarksKey(event);

			return;
		}

		var scene = this.Scene();

		/* With the pointer taken V goes from one place of the view of a walker to the next. */
		if (event.code === 'KeyV' && scene.Hero && this.Captured() && !event.repeat) {
			this.Person = {third: 'first', first: 'shoulder', shoulder: 'third'}[this.Person] || 'third';

			this.$Emit('person', this.Person);
		}

		/* And B from one shoulder to the other. */
		if (event.code === 'KeyB' && scene.Hero && this.Captured() && !event.repeat) {
			this.Shoulder = this.Shoulder === 'left' ? 'right' : 'left';

			this.$Emit('shoulder', this.Shoulder);
		}

		/* Over a map: the keys move the view (the arrows, WASD), + and - zoom, Escape lets the object in focus go, but a hero: for it the key only gives the pointer back. */
		if (scene.Ground && !scene.Surface) {
			if (event.key === '+' || event.key === '=') this.ZoomTo(scene.Wanted / 1.25);
			else if (event.key === '-' || event.key === '_') this.ZoomTo(scene.Wanted * 1.25);
			else if (event.key === 'Escape' && !scene.Hero) this.FocusOn('');
			else if (event.key !== 'Escape') scene.Ground.Keys[event.code] = true;

			if (/^(Arrow|Key[WASDQERF]|Space|Alt)/.test(event.code))
				event.preventDefault();

			return;
		}

		/* On the ground: the keys walk (the arrows, WASD), Escape takes off. */
		if (scene.Surface) {
			if (event.key === 'Escape') this.TakeOff();
			else scene.Surface.Keys[event.code] = true;

			if (/^(Arrow|Key[WASDQERF])/.test(event.code) || event.key === 'Escape')
				event.preventDefault();

			return;
		}

		var focus = scene.Focus ? scene.Objects[scene.Focus] : null;
		var parent = focus ? focus.Owner || (focus.Parent ? scene.Objects[focus.Parent] : null) : null;
		var handled = true;

		if (event.target !== this.$Element() && event.key !== 'Escape') return;

		if (scene.Hero && /^Shift/.test(event.code))
			scene.Keys[event.code] = true;

		if (/^Key[WASDQERF]$/.test(event.code) || scene.Hero && /^(Arrow|Space|KeyC|KeyX|KeyH|KeyJ)/.test(event.code)) {
			scene.Keys[event.code] = true;

			event.preventDefault();

			return;
		}

		if (event.key === 'ArrowLeft') scene.Yaw += 0.08;
		else if (event.key === 'ArrowRight') scene.Yaw -= 0.08;
		else if (event.key === 'ArrowUp') scene.Pitch = Math.min(1.5, scene.Pitch + 0.06);
		else if (event.key === 'ArrowDown') scene.Pitch = Math.max(-1.5, scene.Pitch - 0.06);
		else if (event.key === '+' || event.key === '=') this.ZoomTo(scene.Wanted / 1.25);
		else if (event.key === '-' || event.key === '_') this.ZoomTo(scene.Wanted * 1.25);
		else if (event.key === 'Enter' && scene.Selected) this.FocusOn(scene.Selected);
		else if (event.key === ' ') this.Paused = !this.Paused;
		else if (event.key === 'Escape' && focus && !scene.Hero) this.FocusOn(parent && (parent.Owner || parent.Parent) ? parent.ID : '');
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

		delete scene.Keys[event.code];

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

		scene.Keys = {};

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
		var made;

		spec.ID = spec.ID ? String(spec.ID) : (spec.Kind || 'object') + '-' + Math.random().toString(36).slice(2, 8);

		Object.keys(spec).forEach(function (key) {
			if (['ID', 'Kind', 'Parent', 'Values', 'Traits', 'Parts', 'Children'].indexOf(key) === -1)
				values[key] = spec[key];
		});

		/* What comes anew starts from what it is told, not from where its namesake walked to. */
		delete scene.Removed[spec.ID];
		delete scene.Overrides[spec.ID];

		/* Each field to its trait, as in a declaration: Size of a unit is the size of its Model. */
		made = this.Engine().Canonical(Object.assign({}, values, {Kind: spec.Kind}), null, true);

		scene.Added.push({ID: spec.ID, Kind: spec.Kind || '', Parent: spec.Parent, Values: Object.assign({}, spec.Values || {}, made.Values), Traits: this.$Service('Kinds').MergeTraits(made.Traits, spec.Traits || {}), Parts: spec.Parts || []});
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

	Control: function (id) {
		return this.Engine().Control(id);
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

	/* The ID of what is at a point of the page: of what can be selected, or with all of any object (an editor's). */
	Pick: function (clientX, clientY, all) {
		var box = this.$Element().querySelector('.elemenx-game-scene-canvas').getBoundingClientRect();

		return this.Engine().Pick(clientX - box.left, clientY - box.top, !!all);
	},

	/* The view: {Target, Eye, Yaw, Pitch (radians), Distance}; SetViewpoint sets it at once, no object in focus (an editor flies so). */
	Viewpoint: function () {
		return this.Engine().Viewpoint();
	},

	SetViewpoint: function (view) {
		this.Engine().SetViewpoint(view || {});
	},

	/* Where a point [x, y, z] of the world is on the page: {X, Y (of the page), Depth, Visible}. */
	Project: function (point) {
		var box = this.$Element().querySelector('.elemenx-game-scene-canvas').getBoundingClientRect();
		var spot = this.Engine().Project(point);

		return {X: spot.X + box.left, Y: spot.Y + box.top, Depth: spot.Depth, Visible: spot.Visible};
	},

	/* The ray of the view through a point of the page ({Origin, Direction}), and the point of the ground it meets (null: none). */
	Ray: function (clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-game-scene-canvas').getBoundingClientRect();

		return this.Engine().Ray(clientX - box.left, clientY - box.top);
	},

	GroundAt: function (clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-game-scene-canvas').getBoundingClientRect();

		return this.Engine().GroundPoint(clientX - box.left, clientY - box.top);
	},

	/* The orbit of an object round its parent that puts it under a point of the page: {Distance, Anomaly}; null when none can. */
	OrbitAt: function (id, clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-game-scene-canvas').getBoundingClientRect();

		return this.Engine().OrbitAt(id, clientX - box.left, clientY - box.top);
	},

	/*
	 * A saved game, its recipe by default: the Seed and the sky it is made of (Seed, Cosmos, Weather), its time, its journeys
	 * and what the methods changed (Added, Removed, Overrides); Load makes it again of the Seed, the System and what the
	 * template declares, with the changes over them. Save({Baked: true}) keeps each object instead (Objects: its kind and
	 * what differs from it), read back as it is; a scene loaded of one stays baked.
	 */
	Save: function (options) {
		var scene = this.Scene();
		var kinds = this.$Service('Kinds');
		var saved = {
			Version: 1,
			Seed: this.Seed === null || this.Seed === undefined ? '' : this.Seed,
			Cosmos: this.Cosmos === undefined ? null : JSON.parse(JSON.stringify(this.Cosmos)),
			Weather: this.Weather === undefined ? null : this.Weather,
			Time: scene.Time,
			Travels: Object.keys(scene.Travels).map(function (id) {
				var travel = scene.Travels[id];

				return {ID: id, Target: travel.Target, Start: travel.Start, Duration: travel.Duration, From: travel.From, Position: travel.Position};
			})
		};

		if (options && options.Baked || scene.Loaded) {
			saved.Objects = scene.Roots.map(function (object) {
				return Object.assign(kinds.Diff(object), {Parent: object.Parent || ''});
			});

			return saved;
		}

		saved.Added = JSON.parse(JSON.stringify(scene.Added));
		saved.Removed = Object.keys(scene.Removed);
		saved.Overrides = JSON.parse(JSON.stringify(scene.Overrides));

		/* What changed of the values of an object while it lived (a unit that walked, a car driven), over its changes. */
		scene.Roots.forEach(function (object) {
			var made = object.Composed;
			if (!made) return;

			Object.keys(object.Values).forEach(function (key) {
				var value = object.Values[key];
				var own;

				if (value === undefined || JSON.stringify(value) === JSON.stringify(made[key])) return;

				own = saved.Overrides[object.ID] = saved.Overrides[object.ID] || {};
				own.Values = own.Values || {};
				own.Values[key] = JSON.parse(JSON.stringify(value));
			});
		});

		return saved;
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

		/* Baked: its objects as they were; a recipe: what the Seed and the template make, its changes over them. */
		if (saved.Objects) {
			scene.Loaded = saved.Objects.map(function (each) {
				return {ID: each.ID, Parent: each.Parent, Restored: kinds.Restore(each)};
			});
			scene.Added = [];
			scene.Removed = {};
			scene.Overrides = {};
		}
		else {
			scene.Loaded = null;
			scene.Added = JSON.parse(JSON.stringify(saved.Added || []));
			scene.Removed = {};
			scene.Overrides = JSON.parse(JSON.stringify(saved.Overrides || {}));

			(saved.Removed || []).forEach(function (id) {
				scene.Removed[id] = true;
			});
		}

		if (saved.Seed !== undefined && String(saved.Seed) !== String(this.Seed))
			this.Seed = saved.Seed;

		if (saved.Cosmos !== undefined && saved.Cosmos !== null)
			this.Cosmos = saved.Cosmos;

		if (saved.Weather !== undefined && saved.Weather !== null)
			this.Weather = saved.Weather;

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

		/* The rings of the drops on standing water: each cell of the surface has its drop, at a moment of its own. */
		var ripples = [
			'float rings(vec2 p, float t) {',
			'	vec2 cell = floor(p);',
			'	float sum = 0.0;',
			'	for (int x = -1; x <= 1; x++) {',
			'		for (int y = -1; y <= 1; y++) {',
			'			vec2 at = cell + vec2(float(x), float(y));',
			'			float seed = fract(sin(dot(at, vec2(127.1, 311.7))) * 43758.5453);',
			'			float age = fract(t * (0.8 + seed * 0.6) + seed * 7.0);',
			'			float far = length(p - at - vec2(0.5 + (seed - 0.5) * 0.7, 0.5 + (fract(seed * 13.0) - 0.5) * 0.7));',
			'			sum += sin((far - age * 1.1) * 34.0) * smoothstep(0.14, 0.0, abs(far - age * 1.1)) * (1.0 - age) * (1.0 - age);',
			'		}',
			'	}',
			'	return sum;',
			'}'
		].join('\n');

		/* The slope of water at a point: waves with sharp crests that each bend the next, so lines run together and part, as on water. */
		var waves = [
			'vec2 wavesAt(vec2 p, float t, int count) {',
			'	float frequency = 1.0;',
			'	float weight = 1.0;',
			'	float turn = 0.0;',
			'	float total = 0.0;',
			'	vec2 sum = vec2(0.0);',
			'	for (int i = 0; i < count; i++) {',
			'		vec2 d = vec2(sin(turn), cos(turn));',
			'		float x = dot(d, p) * frequency + t * (1.0 + float(i) * 0.09);',
			'		float crest = exp(sin(x) - 1.0);',
			'		vec2 g = d * crest * cos(x);',
			'		sum += g * weight;',
			'		total += weight;',
			'		p -= g * weight * 0.42;',
			'		weight *= 0.82;',
			'		frequency *= 1.18;',
			'		turn += 1232.4;',
			'	}',
			'	return sum / total;',
			'}'
		].join('\n');

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
				/* A place on the body in metres, its normal and the way down in the axes of the body, and its own wet and drops: what water does on it. */
				'out vec3 vBody;',
				'out vec3 vBodyNormal;',
				'out vec3 vDown;',
				'out vec2 vWet;',
				'void main() {',
				'	mat3 basis = mat3(aInstance2.xyz, aInstance3.xyz, aInstance4.xyz);',
				'	mat3 turn = mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz));',
				'	vBody = vec3(length(aInstance2.xyz), length(aInstance3.xyz), length(aInstance4.xyz)) * aPosition;',
				'	vBodyNormal = aNormal;',
				'	vDown = transpose(turn) * vec3(0.0, -1.0, 0.0);',
				'	vWet = vec2(aInstance2.w, aInstance3.w);',
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
				'out vec3 vBody;',
				'out vec3 vBodyNormal;',
				'out vec3 vDown;',
				'out vec2 vWet;',
				'mat4 joint(float index, float frame) {',
				'	ivec2 at = ivec2((int(index + 0.5) + int(uJointOffset)) * 3, int(frame + 0.5));',
				'	vec4 a = texelFetch(uPalette, at, 0);',
				'	vec4 b = texelFetch(uPalette, at + ivec2(1, 0), 0);',
				'	vec4 c = texelFetch(uPalette, at + ivec2(2, 0), 0);',
				'	return mat4(a.x, b.x, c.x, 0.0, a.y, b.y, c.y, 0.0, a.z, b.z, c.z, 0.0, a.w, b.w, c.w, 1.0);',
				'}',
				/*
				 * A joint at this moment. Two poses mixed as matrices shrink what they turn (half of a right angle leaves 0.7 of a limb):
				 * a fade between clips makes it a turn again, of the size it had, round the place where the joint comes to.
				 */
				'mat4 posed(float index) {',
				'	mat4 m = joint(index, aFrames.x);',
				'	if (aFrames.w > 0.001) m = m * (1.0 - aFrames.w) + joint(index, aFrames.x + 1.0) * aFrames.w;',
				'	if (aFrames.z <= 0.001) return m;',
				'	float size = length(joint(index, aFrames.x)[0].xyz);',
				'	m = m * (1.0 - aFrames.z) + joint(index, aFrames.y) * aFrames.z;',
				'	vec3 bound = texelFetch(uPalette, ivec2((int(index + 0.5) + int(uJointOffset)) * 3, textureSize(uPalette, 0).y - 1), 0).xyz;',
				'	vec3 pivot = (m * vec4(bound, 1.0)).xyz;',
				'	vec3 x = m[0].xyz;',
				'	vec3 y = m[1].xyz;',
				'	float off = dot(x, y) / max(dot(x, x), 1e-12) * 0.5;',
				'	vec3 side = normalize(x - y * off);',
				'	vec3 up = normalize(y - x * off);',
				'	vec3 ahead = normalize(cross(side, up));',
				'	mat3 turn = mat3(side, up, sign(dot(ahead, m[2].xyz)) * ahead) * size;',
				'	return mat4(vec4(turn[0], 0.0), vec4(turn[1], 0.0), vec4(turn[2], 0.0), vec4(pivot - turn * bound, 1.0));',
				'}',
				'void main() {',
				'	mat4 moved = posed(aJoints.x) * aWeights.x + posed(aJoints.y) * aWeights.y + posed(aJoints.z) * aWeights.z + posed(aJoints.w) * aWeights.w;',
				'	mat3 basis = mat3(aInstance2.xyz, aInstance3.xyz, aInstance4.xyz);',
				'	mat3 turn = mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz));',
				'	vBody = vec3(length(aInstance2.xyz), length(aInstance3.xyz), length(aInstance4.xyz)) * (moved * vec4(aPosition, 1.0)).xyz;',
				'	vBodyNormal = mat3(moved) * aNormal;',
				'	vDown = transpose(turn) * vec3(0.0, -1.0, 0.0);',
				'	vWet = vec2(aInstance2.w, aInstance3.w);',
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

			/* A pane of a mirror or of glass, relative to the eye. */
			PaneVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				'uniform mat4 uViewProjection;',
				'uniform mat4 uModel;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec2 vUV;',
				'void main() {',
				'	vec4 world = uModel * vec4(aPosition, 1.0);',
				'	vWorld = world.xyz;',
				'	vUV = aUV;',
				'	vNormal = normalize(mat3(uModel) * aNormal);',
				'	gl_Position = uViewProjection * world;',
				'}'
			].join('\n'),

			/*
			 * A mirror: what its picture shows where it is on the screen, softened by Blur, tinted, a thin bright bevel round it;
			 * dark from behind, or with no picture.
			 */
			Mirror: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec2 vUV;',
				'uniform sampler2D uMirror;',
				'uniform vec2 uScreen;',
				'uniform vec2 uSize;',
				'uniform vec3 uTint;',
				'uniform vec3 uSkyLight;',
				'uniform float uBlur;',
				'uniform float uStrength;',
				'uniform float uOn;',
				'out vec4 outColor;',
				'void main() {',
				'	vec3 seen = textureLod(uMirror, gl_FragCoord.xy / uScreen, uBlur * 6.0).rgb;',
				'	float front = step(0.0, dot(vNormal, -vWorld));',
				'	vec2 edge = min(vUV, 1.0 - vUV) * uSize;',
				'	float bevel = 1.0 - smoothstep(0.012, 0.03, min(edge.x, edge.y));',
				'	vec3 back = vec3(0.04, 0.04, 0.045);',
				'	vec3 face = seen * uTint * uStrength + back * (1.0 - uStrength);',
				'	outColor = vec4(mix(back, mix(face, uSkyLight * 1.4 + 0.08, bevel * 0.7), front * uOn), 1.0);',
				'}'
			].join('\n'),

			/*
			 * Glass: as clear as Clarity, milky by Frost; the world (its picture, as a mirror's, or the sky) and the sun on it by its
			 * angle (Fresnel), a glint as sharp as it is clear; Tint colors what shows through it, and its edge, where the light goes
			 * through the thickness of the pane.
			 */
			Glass: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec2 vUV;',
				'uniform sampler2D uMirror;',
				'uniform vec2 uScreen;',
				'uniform float uOn;',
				'uniform vec2 uSize;',
				'uniform vec3 uTint;',
				'uniform float uClarity;',
				'uniform float uFrost;',
				'uniform float uReflect;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec3 uSkyLight;',
				'out vec4 outColor;',
				'void main() {',
				'	vec3 v = normalize(-vWorld);',
				'	vec3 n = normalize(vNormal);',
				'	float front = step(0.0, dot(n, v));',
				'	if (front < 0.5) n = -n;',
				'	float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);',
				'	vec3 r = reflect(-v, n);',
				'	float glint = pow(max(dot(r, uSun), 0.0), mix(600.0, 24.0, uFrost)) * mix(6.0, 0.6, uFrost);',
				'	vec3 sky = uSkyLight * (0.7 + 0.6 * max(r.y, 0.0)) + vec3(0.18, 0.22, 0.28) * max(r.y, 0.0);',
				'	sky = mix(sky, textureLod(uMirror, gl_FragCoord.xy / uScreen, uFrost * 6.0).rgb, uOn * front);',
				'	vec2 side = min(vUV, 1.0 - vUV) * uSize;',
				'	float rim = 1.0 - smoothstep(0.01, 0.035, min(side.x, side.y));',
				'	vec3 color = uTint * (0.08 + uFrost * 0.55) * (uSkyLight + 0.3) + sky * uReflect * fresnel * 3.0 + uSunColor * glint + uTint * rim * 0.35;',
				'	float alpha = clamp(1.0 - uClarity + uFrost * 0.6 + fresnel * uReflect + glint * 0.2 + rim * 0.55, 0.0, 1.0);',
				'	outColor = vec4(color / max(alpha, 0.05), alpha);',
				'}'
			].join('\n'),

			/* A screen: its picture, lit by itself as bright as Bright, the right way up; dark from behind. */
			Screen: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec2 vUV;',
				'uniform sampler2D uPicture;',
				'uniform float uBright;',
				'out vec4 outColor;',
				'void main() {',
				'	float front = step(0.0, dot(vNormal, -vWorld));',
				'	outColor = vec4(texture(uPicture, vec2(vUV.x, 1.0 - vUV.y)).rgb * uBright * front, 1.0);',
				'}'
			].join('\n'),

			/* The light of what glows: its color, more where its surface turns away from the eye, a slow breath; a lamp's glass (uFlat) evenly. */
			BodyGlow: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vTint;',
				'uniform float uTime;',
				'uniform float uFlat;',
				'out vec4 outColor;',
				'void main() {',
				'	float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(-vWorld))), 2.0);',
				'	float breath = 0.85 + 0.15 * sin(uTime * 3.0 + vWorld.y * 4.0);',
				'	outColor = vec4(vTint * mix((0.06 + 1.1 * rim) * breath, 1.0, uFlat), 1.0);',
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
				'uniform float uClearcoat;',
				'uniform float uWet;',
				'uniform float uSnowed;',
				'uniform float uRainDrops;',
				'uniform float uWind;',
				'uniform vec3 uEyeAt;',
				'uniform float uTime2;',
				ripples,
				'in vec3 vBody;',
				'in vec3 vBodyNormal;',
				'in vec3 vDown;',
				'in vec2 vWet;',
				/*
				 * Drops on what water beads on, held to the body (in metres of it, in the plane of its side that faces most): round where
				 * it lies flat, drawn out down where it stands up, and in the rain slipping down a little and coming again. The height
				 * of the drop here, in metres; none where a drop is smaller than a few pixels.
				 */
				'float drops(float amount, float rain) {',
				'	vec3 a = abs(vBodyNormal);',
				'	vec2 q;',
				'	vec2 d;',
				'	if (a.x > a.y && a.x > a.z) { q = vBody.yz; d = vDown.yz; }',
				'	else if (a.y > a.z) { q = vBody.xz; d = vDown.xz; }',
				'	else { q = vBody.xy; d = vDown.xy; }',
				'	float steep = length(d);',
				'	vec2 along = steep > 0.05 ? d / steep : vec2(0.0, 1.0);',
				'	vec2 p = vec2(dot(q, vec2(-along.y, along.x)), dot(q, along)) / 0.03;',
				'	vec2 width = fwidth(p);',
				'	float seen = 1.0 - smoothstep(0.12, 0.35, max(width.x, width.y));',
				'	if (seen <= 0.0 || amount <= 0.0) return 0.0;',
				'	vec2 cell = floor(p);',
				'	float height = 0.0;',
				'	for (int x = -1; x <= 1; x++) {',
				'		for (int y = -1; y <= 1; y++) {',
				'			vec2 at = cell + vec2(float(x), float(y));',
				'			float s = fract(sin(dot(at, vec2(127.1, 311.7))) * 43758.5453);',
				'			if (s > amount) continue;',
				'			float s2 = fract(s * 91.7 + 0.31);',
				'			float slip = rain * steep * fract(uTime2 * (0.08 + 0.12 * s2) + s * 5.0) * 0.7;',
				'			vec2 off = p - at - vec2(0.2 + 0.6 * s2, 0.15 + 0.5 * fract(s * 7.3) + slip);',
				'			float radius = 0.1 + 0.26 * pow(fract(s * 13.1), 2.0);',
				'			off.y /= 1.0 + steep * (off.y < 0.0 ? 2.2 : 0.6);',
				'			float k = 1.0 - dot(off, off) / (radius * radius);',
				'			if (k > 0.0) height = max(height, sqrt(k) * radius * 0.03 * 0.7);',
				'		}',
				'	}',
				'	return height * seen;',
				'}',
				'uniform float uCoatRough;',
				'uniform float uCutoff;',
				'uniform float uUnlit;',
				'uniform float uNormalScale;',
				'uniform float uOcclusion;',
				'uniform float uSpecularLevel;',
				'uniform vec3 uSpecularColor;',
				'uniform float uSpecularOn;',
				'uniform float uSoftness;',
				'uniform float uMoving;',
				'uniform float uGlass;',
				'uniform vec4 uCut;',
				'uniform sampler2D uSpecularMap;',
				'uniform sampler2D uColorMap;',
				'uniform sampler2D uNormalMap;',
				'uniform sampler2D uMetalMap;',
				'uniform sampler2D uOcclusionMap;',
				'uniform sampler2D uEmissiveMap;',
				'out vec4 outColor;',
				graphics.Chunks.Lights,
				graphics.Chunks.Noise,
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
				/* What a material graph of Blueprints does to the surface: nothing here; a material with a Blueprint puts its own in this place. */
				'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {}',
				'void main() {',
				'	if (uCut.w > 0.0 && distance(vWorld, uCut.xyz) < uCut.w) discard;',
				'	vec4 base = uBaseColor * texture(uColorMap, vUV);',
				'	if (base.a < uCutoff) discard;',
				'	vec3 albedo = base.rgb * vTint;',
				'	if (uUnlit > 0.5) {',
				'		outColor = vec4(pow(albedo, vec3(1.0 / 2.2)), uMoving > 0.5 ? 0.0 : base.a);',
				'		return;',
				'	}',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 n = normalize(vNormal);',
				/* The side that shows is the one that faces the eye: exports wind their triangles either way. A normal that only just looks away is smoothed over an edge, and stays. */
				'	if (dot(n, v) < -0.3) n = -n;',
				'	if (uNormalScale > 0.0) n = bump(n, v);',
				'	vec4 surface = texture(uMetalMap, vUV);',
				'	float ownRough = uRoughness * surface.g;',
				'	float ownMetal = uMetallic * surface.b;',
				'	vec3 ownGlow = uEmissive * texture(uEmissiveMap, vUV).rgb;',
				'	blueprintSurface(vWorld, n, vUV, albedo, base.a, ownRough, ownMetal, ownGlow, n);',
				/* Its own wet (1 + it, 0 for the weather's) and how much water beads on it (1 + it, 0 for all). */
				'	float wet = vWet.x > 0.5 ? clamp(vWet.x - 1.0, 0.0, 1.0) : uWet;',
				'	float beads = vWet.y > 0.5 ? clamp(vWet.y - 1.0, 0.0, 1.0) : 1.0;',
				/* Water beads on what is smooth (lacquer, glass), not on what is rough or looks down; the height of a drop bends the light as a lens. */
				'	float smooth2 = max(1.0 - smoothstep(0.35, 0.6, ownRough), max(step(0.01, uClearcoat), step(0.01, uGlass)));',
				'	float drop = wet > 0.01 ? drops(wet * beads * smooth2 * smoothstep(-0.5, 0.1, n.y) * 0.55 * step(0.99, max(base.a, uGlass)), step(0.01, uRainDrops)) : 0.0;',
				'	float dropX = dFdx(drop);',
				'	float dropY = dFdy(drop);',
				'	vec3 dpx = dFdx(vWorld);',
				'	vec3 dpy = dFdy(vWorld);',
				'	if (abs(dropX) + abs(dropY) > 0.0) {',
				'		vec3 r1 = cross(dpy, n);',
				'		vec3 r2 = cross(n, dpx);',
				'		float det = dot(dpx, r1);',
				'		if (abs(det) > 1e-14) n = normalize(abs(det) * n - sign(det) * (dropX * r1 + dropY * r2));',
				'	}',
				'	float inDrop = step(1e-5, drop);',
				/* Water stands where a surface lies flat and does not bead, and rain makes rings on it, gone where they are smaller than a pixel; snow lies on what looks up. Pools grow as it rains and shrink as it dries. */
				'	float flat2 = smoothstep(0.86, 0.97, n.y) * step(0.99, base.a);',
				'	float pool = wet * flat2 * (1.0 - smooth2) * smoothstep(0.66 - 0.18 * wet, 0.8 - 0.18 * wet, noise3((vWorld + uEyeAt) * vec3(0.13, 0.0, 0.13)) + noise3((vWorld + uEyeAt) * vec3(0.6, 0.0, 0.6)) * 0.08);',
				'	float ringSeen = 1.0 - smoothstep(0.03, 0.09, length(fwidth((vWorld.xz + uEyeAt.xz) * 1.7)));',
				'	if (pool > 0.02 && uRainDrops > 0.0 && ringSeen > 0.0) {',
				'		vec2 ring = (vWorld.xz + uEyeAt.xz) * 1.7;',
				'		float h0 = rings(ring, uTime2);',
				'		n = normalize(n + vec3(rings(ring + vec2(0.03, 0.0), uTime2) - h0, 0.0, rings(ring + vec2(0.0, 0.03), uTime2) - h0) * 1.1 * uRainDrops * pool * ringSeen);',
				'	}',
				'	float roughness = clamp(mix(ownRough * (1.0 - wet * 0.45), 0.06, pool), 0.04, 1.0);',
				/* Where the normal turns within a pixel a sharp highlight falls between pixels and flickers as things move: the surface is taken rougher by as much. */
				'	vec3 stepX = dFdx(n);',
				'	vec3 stepY = dFdy(n);',
				'	float spread = min(0.25, (dot(stepX, stepX) + dot(stepY, stepY)) * 1.5);',
				'	roughness = sqrt(min(1.0, roughness * roughness + spread));',
				'	roughness = mix(roughness, 0.05, inDrop);',
				/* Wet things lose their color first: water darkens them and takes the dust off the light. */
				'	albedo *= (1.0 - wet * 0.38 - pool * 0.3) * (1.0 - inDrop * 0.12);',
				'	float laid = uSnowed * smoothstep(0.3, 0.75, n.y + (noise3((vWorld + uEyeAt) * 0.23) + noise3((vWorld + uEyeAt) * 0.9) * 0.5 - 0.75) * 0.3);',
				'	albedo = mix(albedo, vec3(0.86, 0.9, 0.95) * (0.72 + dot(albedo, vec3(0.5))), laid);',
				'	roughness = mix(roughness, 0.7, laid);',
				'	float metallic = clamp(ownMetal, 0.0, 1.0);',
				'	float a = roughness * roughness;',
				'	float level = uSpecularLevel * (uSpecularOn > 0.5 ? texture(uSpecularMap, vUV).a : 1.0);',
				'	vec3 f0 = mix(min(vec3(0.04) * uSpecularColor, vec3(1.0)) * level, albedo, metallic);',
				'	vec3 total = vec3(0.0);',
				'	float nv = max(dot(n, v), 0.001);',
				'	lightShade = sunLit(vWorld, n);',
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
				/* A coat of lacquer over the surface: a second, clear gloss. */
				'		float coatA = max(uCoatRough * uCoatRough, max(0.002, sqrt(spread)));',
				'		float coat = uClearcoat * (0.04 + 0.96 * pow(1.0 - max(dot(h, v), 0.0), 5.0)) * ggx(max(dot(n, h), 0.0), coatA) * smith(nv, nl, coatA) / max(4.0 * nv * nl, 0.001);',
				'		total += ((diffuse + specular) * (1.0 - uClearcoat * 0.04) + vec3(coat)) * uLightColors[i] * 3.14159265 * nl * shadow(vWorld, uLightPositions[i]) * (i == 0 ? lightShade : 1.0);',
				'	}',
				'	total += albedo * (1.0 - metallic) * localLight(vWorld, n);',
				'	float occlusion = mix(1.0, texture(uOcclusionMap, vUV).r, uOcclusion);',
				'	vec3 reflected = reflect(-v, n);',
				'	vec3 around = mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5) * skySeen(vWorld) + sunBounce(vWorld);',
				'	vec3 mirrored = mix(uFloorLight, uSkyLight, reflected.y * 0.5 + 0.5);',
				'	vec3 fresnel = f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(1.0 - nv, 5.0);',
				'	total += (albedo * (1.0 - metallic) * around + fresnel * mirrored) * occlusion;',
				'	total += ownGlow;',
				/* Glass lets through what lies behind it, a little darker, and shows the sky the more the flatter it is seen. */
				'	if (uGlass > 0.0) {',
				'		float edge = 0.04 + 0.96 * pow(1.0 - nv, 5.0);',
				'		vec3 shine = total + mirrored * 1.3 * edge;',
				'		float cover = clamp(base.a * (1.0 - uGlass * 0.72) + edge * 0.35 + dot(total, vec3(0.3)), 0.02, 0.8);',
				'		outColor = vec4(pow(min(shine / cover, vec3(8.0)), vec3(1.0 / 2.2)), cover);',
				'		return;',
				'	}',
				/* How much it mirrors, seen from here: the alpha of the scene carries it to the picture. */
				'	float gloss = base.a < 0.99 ? 0.0 : max(pow(1.0 - roughness, 2.0) * max(fresnel.r, max(fresnel.g, fresnel.b)), wet * 0.6 * smoothstep(0.55, 0.95, n.y) * (0.04 + 0.96 * pow(1.0 - nv, 5.0)));',
				'	outColor = vec4(pow(total, vec3(1.0 / 2.2)), uMoving > 0.5 ? 0.0 : base.a < 0.5 ? base.a : 1.0 - gloss * 0.45);',
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

			/* The stars from a ground: they turn with the planet, the air takes them at the horizon and they twinkle there. */
			FarTurned: head + [
				'in vec3 aPosition;',
				'in vec4 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform float uRatio;',
				'uniform mat3 uTurn;',
				'uniform float uLimit;',
				'uniform float uTime;',
				'out vec4 vColor;',
				'void main() {',
				'	vec3 place = uTurn * aPosition;',
				'	float high = place.y / 50.0;',
				'	float seen = smoothstep(uLimit, uLimit + 0.08, aColor.a + 0.02) * smoothstep(0.0, 0.14, high);',
				'	float seed = fract(aPosition.x * 7.13 + aPosition.z * 3.71);',
				'	float twinkle = 1.0 + 0.35 * (1.0 - high) * sin(uTime * (4.0 + seed * 7.0) + seed * 40.0);',
				'	vColor = vec4(aColor.rgb, seen * twinkle * (0.32 + aColor.a * 1.4));',
				'	gl_PointSize = (0.8 + aColor.a * 1.7) * uRatio;',
				'	gl_Position = seen > 0.0 ? uViewProjection * vec4(place, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);',
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
				/* A sun is far brighter than white: what shows of it to the eye is only that it burns. */
				'	outColor = vec4(mix(color, vec3(1.0), 0.28 * limb) * 2.4, 1.0);',
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
				/* The nearest the ray comes to the body, on the way it goes: from inside the shell what lies behind the eye is no part of it. */
				'	vec3 closest = uCamera + look * max(dot(uBody.xyz - uCamera, look), 0.0) - uBody.xyz;',
				'	float miss = length(closest);',
				'	float edge = pow(1.0 - clamp((miss - uBody.w) / (uShell - uBody.w), 0.0, 1.0), 2.4);',
				/* The air glows where the light reaches it: at the point of the limb the ray passes, not on the far side of its shell. */
				'	vec3 limb = normalize(closest);',
				'	float day = 0.0;',
				'	for (int i = 0; i < 4; i++) {',
				'		if (i >= uLightCount) break;',
				'		day += smoothstep(-0.06, 0.45, dot(limb, normalize(uLightPositions[i] - vWorld)));',
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
				'in vec2 vWet;',
				'uniform vec3 uCamera;',
				'uniform float uShine;',
				'uniform float uMoving;',
				'uniform float uWet;',
				'uniform float uSnowed;',
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
				'	lightShade = sunLit(vWorld, n);',
				'	vec3 light = lighting(vWorld, n, v, uShine, uSpecular) - mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5) * (1.0 - skySeen(vWorld));',
				'	light = (max(light, vec3(0.0)) + sunBounce(vWorld) + localLight(vWorld, n)) * (1.0 - (vWet.x > 0.5 ? clamp(vWet.x - 1.0, 0.0, 1.0) : uWet) * 0.25);',
				'	if (uSoft > 0.0 && uLightCount > 0) {',
				'		vec3 l = normalize(uLightPositions[0] - vWorld);',
				'		float through = pow(max(dot(v, -l), 0.0), 3.0) * 0.8 + max(-dot(n, l), 0.0) * 0.35;',
				'		light += uLightColors[0] * through * lightShade * uSoft * vec3(1.0, 1.05, 0.55);',
				'	}',
				'	outColor = vec4(pow(color * light + hot * hot * 4.0, vec3(1.0 / 2.2)), uMoving > 0.5 ? 0.0 : 1.0);',
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
				'uniform float uRadius;',
				'uniform float uTime;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Shadow,
				waves,
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
				'	vec3 place = up * uRadius;',
				'	albedo *= 0.85 + 0.3 * noise3(place * 2.0);',
				'	float rise = dot(up, uSun);',
				'	float light = clamp(rise * 3.0 + 0.3, 0.0, 1.0);',
				'	float dusk = 1.0 - smoothstep(0.0, 0.35, abs(rise));',
				/* The sky lights what the sun does not reach: at sunset the land is dim and red, not black. */
				'	vec3 around = vec3(0.05, 0.06, 0.08) + uAir.rgb * uAir.a * 0.3 * smoothstep(-0.25, 0.3, rise) + vec3(0.5, 0.25, 0.15) * dusk * uAir.a * 0.35;',
				'	float day = max(dot(n, uSun), 0.0) * sunShadow(vWorld, n);',
				'	vec3 color = albedo * (uSunColor * day + around);',
				/* Water mirrors the sky, more at a glance; waves break the sun into a path of glints that reddens as it sets. */
				'	if (sea > 0.5) {',
				'		vec3 side = normalize(cross(up, vec3(0.13, 1.0, 0.07)));',
				'		vec2 flat2 = vec2(dot(place, side), dot(place, cross(up, side)));',
				'		vec2 slope = wavesAt(flat2 * 9.0, uTime * 1.2, 10) / (1.0 + length(vWorld) * 0.25);',
				'		vec3 w = normalize(up - (side * slope.x + cross(up, side) * slope.y) * 0.22);',
				'		float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(w, v), 0.0), 5.0);',
				'		vec3 r = reflect(-v, w);',
				'		if (dot(r, up) < 0.0) r = r - up * 2.0 * dot(r, up);',
				'		float toward = max(dot(r, uSun), 0.0);',
				'		vec3 mirrored = mix(mix(uAir.rgb, vec3(1.0), 0.45), uAir.rgb * vec3(0.45, 0.6, 1.0), pow(max(dot(r, up), 0.0), 0.6)) * light + vec3(1.0, 0.5, 0.2) * dusk * exp(-max(dot(r, up), 0.0) * 5.0) * 0.8;',
				'		float shine = (pow(toward, 1400.0) * 7.0 + pow(toward, 180.0) * 0.16) * smoothstep(-0.02, 0.1, rise);',
				'		color = mix(color, mirrored, fresnel) + uSunColor * mix(vec3(1.0, 0.55, 0.25), vec3(1.0), smoothstep(0.0, 0.3, rise)) * shine;',
				'	}',
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
				'uniform float uCover;',
				'uniform vec3 uMoon;',
				'uniform vec3 uMoonLit;',
				'uniform float uMoonSize;',
				'uniform float uMoonGlow;',
				'uniform float uMoonShade;',
				'uniform float uRainbow;',
				'uniform float uEclipse;',
				'uniform vec3 uGlow;',
				'uniform vec3 uGlowWay;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				'void main() {',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec4 close = uInverse * vec4(vQuad, -1.0, 1.0);',
				'	vec3 ray = normalize(far.xyz / far.w - close.xyz / close.w);',
				'	float h = dot(ray, uUp);',
				'	float s = dot(uSun, uUp);',
				'	float toward = max(dot(ray, uSun), 0.0);',
				'	float day = smoothstep(-0.3, 0.25, s);',
				'	float up = clamp(h, 0.0, 1.0);',
				'	vec3 zenith = uAir.rgb * vec3(0.38, 0.55, 1.0);',
				'	vec3 horizon = mix(uAir.rgb, vec3(1.0), 0.5);',
				'	vec3 sky = mix(horizon, zenith, pow(up, 0.5)) * day;',
				/* The sun low: the air takes its blue, the band of the horizon warms all round, most of all under it. */
				'	float low = 1.0 - smoothstep(0.0, 0.5, abs(s));',
				'	vec3 warm = vec3(1.0, 0.54, 0.2);',
				'	sky *= mix(vec3(1.0), vec3(0.86, 0.74, 0.72), low);',
				'	float dusk = low * exp(-up * 5.5);',
				'	sky += warm * dusk * (0.3 + 1.1 * pow(dot(ray, uSun) * 0.5 + 0.5, 4.0));',
				/* The light the air spreads round the sun: wide and faint, then narrow and bright. */
				'	vec3 tint = mix(warm * 1.5, vec3(1.0), smoothstep(0.05, 0.5, s));',
				'	sky += tint * (pow(toward, 6.0) * 0.2 + pow(toward, 48.0) * 0.38 + pow(toward, 500.0) * 1.1) * smoothstep(-0.12, 0.02, s) * (1.0 - uCover);',
				/* The pink over the gold of a sunset, and high thin clouds drawn out by the wind. */
				'	sky += vec3(0.85, 0.3, 0.42) * low * exp(-up * 2.2) * 0.42 * smoothstep(-0.2, 0.02, s);',
				'	if (h > 0.02) {',
				'		vec2 high = ray.xz / (h + 0.12);',
				'		float wisp = noise3(vec3(high.x * 1.1, high.y * 3.4, uSun.x * 0.0)) * 0.65 + noise3(vec3(high.x * 3.1, high.y * 7.0, 3.0)) * 0.35;',
				'		float thin = smoothstep(0.52, 0.8, wisp) * smoothstep(0.02, 0.2, h) * (1.0 - uCover);',
				'		sky = mix(sky, mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.62, 0.42), low) * max(day, 0.04), thin * 0.42);',
				'	}',
				'	sky = mix(sky, vec3(0.62, 0.65, 0.7) * day, uCover * 0.8);',
				/* The moon before the sun: the air goes dark round it, and the crown of the sun shows. */
				'	sky *= 1.0 - 0.96 * uEclipse;',
				'	vec3 crown = vec3(0.85, 0.9, 1.0) * smoothstep(0.8, 1.0, uEclipse) * (pow(toward, 2400.0) * 1.3 + pow(toward, 320.0) * 0.3);',
				/* The towns light the air from the horizon up. */
				'	float towns = (exp(-max(h, 0.0) * 5.0) * 0.5 + 0.03) * (uGlowWay.z > 0.5 ? pow(dot(normalize(ray.xz + vec2(1e-5)), uGlowWay.xy) * 0.5 + 0.5, 2.0) : 1.0);',
				'	sky += uGlow * towns;',
				'	float density = uAir.a * (1.0 - uHigh);',
				'	float disk = smoothstep(0.99972, 0.99990, toward) * (1.0 - uCover);',
				/* A moon up lights the air round it a little, more the fuller it is. */
				/* Past the rain, across the sky from the sun: red outside, violet inside. */
				'	if (uRainbow > 0.0 && s > 0.0 && h > 0.0) {',
				'		float bow = (acos(clamp(-dot(ray, uSun), -1.0, 1.0)) - 0.70) / 0.05;',
				'		if (bow > 0.0 && bow < 1.0) sky += (0.5 + 0.5 * cos(6.28 * (bow * 0.8 + vec3(0.62, 0.33, 0.0)))) * sin(bow * 3.14) * 0.16 * uRainbow * smoothstep(0.0, 0.1, h);',
				'	}',
				'	float haze = uMoonGlow * (1.0 - day) * (0.1 + 0.5 * pow(max(dot(ray, uMoon), 0.0), 24.0));',
				'	sky += vec3(0.32, 0.4, 0.62) * haze;',
				'	float alpha = clamp(density * (day * 0.97 * (1.0 - uEclipse) + dusk * 0.6 + haze + towns * max(uGlow.r, uGlow.g)), 0.0, 1.0);',
				/* The ball of the moon, lit from where its sun stands: that is the shape of its phase; what is dark hides the stars. */
				'	vec3 moon = vec3(0.0);',
				'	float moonShape = 0.0;',
				'	float moonFar = dot(ray, uMoon);',
				'	if (uMoonSize > 0.0 && moonFar > 0.0) {',
				'		float radius = 0.018 * uMoonSize;',
				'		vec3 across = (ray - uMoon * moonFar) / radius;',
				'		float off = length(across);',
				'		if (off < 1.0) {',
				'			vec3 face = across - uMoon * sqrt(1.0 - off * off);',
				'			float lit = smoothstep(-0.04, 0.1, dot(face, uMoonLit));',
				'			float seas = 0.68 + 0.5 * noise3(face * 3.5 + 11.0);',
				'			float edge = 1.0 - smoothstep(0.95, 1.0, off);',
				'			moon = mix(vec3(0.98, 0.98, 1.0), vec3(0.42, 0.11, 0.05), uMoonShade) * lit * seas * edge * (1.0 - uCover) * mix(1.5, 0.5, day);',
				'			moonShape = edge * max(max(1.0 - day, lit), min(1.0, uEclipse * 4.0)) * (1.0 - uCover);',
				'		}',
				'	}',
				/* A moon before the sun hides it and all its glow in the air. */
				'	float hidden = moonShape * smoothstep(0.0, 0.05, uEclipse);',
				'	outColor = vec4((sky + crown) * density * (1.0 - hidden) + tint * disk * (1.0 - smoothstep(0.0, 0.25, moonShape)) * 9.0 * smoothstep(-0.03, 0.01, s) + moon, max(max(alpha, disk), moonShape));',
				'}'
			].join('\n'),

			/* The ground of a map: its squares relative to the eye, the colors of their heights, its sun and its haze. */
			LandVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOffset;',
				'uniform vec3 uCenter;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vColor;',
				'out vec3 vPlace;',
				'void main() {',
				'	vWorld = aPosition + uOffset;',
				'	vNormal = aNormal;',
				'	vColor = aColor;',
				'	vPlace = aPosition + uCenter;',
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
				'uniform float uWet;',
				'uniform float uSnowed;',
				'uniform float uRainDrops;',
				'uniform float uTime2;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Shadow,
				ripples,
				/* What a material graph of Blueprints does to the ground: nothing here; a ground with a Blueprint puts its own in this place. */
				'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {}',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	float grain = 0.88 + 0.24 * noise3(vPlace * 0.35);',
				/* Water stands in the hollows of what is level: the pools grow while it rains and shrink as it dries. */
				'	float pool = uWet * smoothstep(0.64 - 0.2 * uWet, 0.74 - 0.2 * uWet, noise3(vPlace * 0.09) + noise3(vPlace * 0.41) * 0.07) * smoothstep(0.9, 0.97, n.y);',
				'	vec3 water = vec3(0.0, 1.0, 0.0);',
				'	float ringSeen = 1.0 - smoothstep(0.03, 0.09, length(fwidth(vPlace.xz * 1.7)));',
				'	if (pool > 0.02 && uRainDrops > 0.0 && ringSeen > 0.0) {',
				'		vec2 ring = vPlace.xz * 1.7;',
				'		float h0 = rings(ring, uTime2);',
				'		water = normalize(water + vec3(rings(ring + vec2(0.03, 0.0), uTime2) - h0, 0.0, rings(ring + vec2(0.0, 0.03), uTime2) - h0) * 0.9 * min(1.0, uRainDrops) * ringSeen);',
				'	}',
				'	vec3 albedo = pow(vColor * grain, vec3(2.2)) * (1.0 - uWet * 0.42) * (1.0 - pool * 0.35);',
				'	albedo = mix(albedo, vec3(0.86, 0.9, 0.95), uSnowed * smoothstep(0.55, 0.85, n.y + (grain - 1.0)));',
				'	float ownAlpha = 1.0;',
				'	float ownRough = 1.0;',
				'	float ownMetal = 0.0;',
				'	vec3 ownGlow = vec3(0.0);',
				'	blueprintSurface(vPlace, n, vPlace.xz, albedo, ownAlpha, ownRough, ownMetal, ownGlow, n);',
				'	float lit2 = sunLit(vWorld, n);',
				'	vec3 light = uSunColor * 1.35 * max(dot(n, uSun), 0.0) * lit2 + mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5) * skySeen(vWorld) + sunBounce(vWorld) + localLight(vWorld, n);',
				'	vec3 horizon = mix(uAir.rgb, vec3(1.0), 0.45) * clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0);',
				/*
				 * Wet ground darkens and takes a sheen: the sun on it, wide where it is only wet, a sharp glint where water stands and its
				 * rings break it. Water mirrors the sky at a glance.
				 */
				'	vec3 v = normalize(-vWorld);',
				'	vec3 surface = normalize(mix(n, water, pool));',
				'	vec3 h = normalize(uSun + v);',
				'	float glance = 0.02 + 0.98 * pow(1.0 - max(dot(surface, v), 0.0), 5.0);',
				'	float sheen = pow(max(dot(surface, h), 0.0), mix(28.0, 1400.0, pool)) * mix(0.35, 60.0, pool) * (0.1 + glance) * uWet * step(0.0, uSun.y);',
				'	vec3 linear = albedo * light + uSunColor * sheen * lit2 + ownGlow;',
				'	vec3 lit = pow(linear, vec3(1.0 / 2.2));',
				'	lit = mix(lit, mix(uAir.rgb, vec3(1.0), 0.5) * clamp(uSkyLight.b * 2.4, 0.03, 1.0), pool * (0.25 + 0.65 * pow(1.0 - max(v.y, 0.0), 3.0)));',
				'	vec3 color = mix(lit, horizon, 1.0 - exp(-length(vWorld) / uFog));',
				'	outColor = vec4(color, 1.0 - pool * (0.25 + 0.65 * pow(1.0 - max(v.y, 0.0), 3.0)) * 0.45 - uWet * 0.12 * (1.0 - pool));',
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
				'uniform vec3 uEye;',
				'uniform float uTime;',
				'uniform float uDay;',
				'uniform float uWild;',
				'uniform float uFlow;',
				'in vec3 vColor;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				waves,
				'vec3 reflectedSky(vec3 way) {',
				'	float up = clamp(way.y, 0.0, 1.0);',
				'	float low = 1.0 - smoothstep(0.0, 0.5, abs(uSun.y));',
				'	vec3 sky = mix(mix(uAir.rgb, vec3(1.0), 0.5), uAir.rgb * vec3(0.38, 0.55, 1.0), pow(up, 0.5));',
				'	return sky + vec3(1.0, 0.54, 0.2) * low * exp(-up * 5.5) * (0.3 + 1.1 * pow(dot(way, uSun) * 0.5 + 0.5, 4.0));',
				'}',
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
				'	vec3 place = vWorld + uEye;',
				/* The farther, the less of the waves a pixel can tell: they calm down instead of shimmering. */
				'	float far = length(vWorld);',
				'	float speed = vColor.z * uFlow;',
				'	vec2 slope;',
				'	float rush = 0.0;',
				/*
				 * Running water: waves drawn out along the way it runs, carried down it in two phases that take over from each other
				 * (each starts again while the other shows), so the pattern runs on and never stretches.
				 */
				'	if (speed > 0.01) {',
				'		vec2 along = normalize(vColor.xy);',
				'		vec2 side = vec2(-along.y, along.x);',
				'		vec2 q = vec2(dot(place.xz, along) * 0.6, dot(place.xz, side) * 2.2);',
				'		float phase = fract(uTime * 0.2);',
				'		vec2 a = wavesAt(q - vec2(speed * phase * 3.0, 0.0), uTime * 0.5, 6);',
				'		vec2 b = wavesAt(q - vec2(speed * fract(phase + 0.5) * 3.0, 0.0) + vec2(17.0, 3.0), uTime * 0.5, 6);',
				'		vec2 s = mix(a, b, abs(phase * 2.0 - 1.0));',
				'		slope = (along * s.x * 0.6 + side * s.y * 2.2) * 0.45 / (1.0 + far * 0.012);',
				'		rush = smoothstep(1.8, 4.0, speed) * smoothstep(0.6, 1.6, length(s));',
				'	}',
				'	else {',
				'		slope = wavesAt(place.xz * 1.5, uTime * 1.6, uMirror > 0.5 ? 14 : 7) / (1.0 + far * 0.012);',
				'	}',
				'	vec3 n = normalize(vec3(-slope.x * 0.22 * uWild, 1.0, -slope.y * 0.22 * uWild));',
				'	float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);',
				'	vec3 r = reflect(-v, n);',
				'	r.y = abs(r.y);',
				'	float toward = max(dot(r, uSun), 0.0);',
				/* What a wave turns to the eye is the sky it faces, and the sun: so the path of light is made of the waves. */
				'	float shine = (pow(toward, 1400.0) * 7.0 + pow(toward, 180.0) * 0.16) * smoothstep(-0.02, 0.06, uSun.y);',
				'	vec3 mirror = reflectedSky(r) * uDay + vec3(0.012, 0.016, 0.03);',
				/* A river carries its silt: greener and duller than a lake or the sea, white where it rushes. */
				'	vec3 body = speed > 0.01 ? vec3(0.05, 0.13, 0.11) : vec3(0.02, 0.11, 0.17);',
				'	vec3 color = mix(body * (0.25 + 0.75 * clamp(uSun.y * 2.0, 0.0, 1.0)), mirror, fresnel) + uSunColor * shine;',
				'	color = mix(color, vec3(0.82, 0.86, 0.85) * (0.3 + 0.7 * clamp(uSun.y * 2.0, 0.0, 1.0)), rush * 0.45);',
				'	vec3 horizon = mix(uAir.rgb, vec3(1.0), 0.45) * clamp(uSun.y * 3.0 + 0.3, 0.0, 1.0);',
				'	if (uMirror > 0.5) {',
				'		vec4 image = mirrored(vWorld, reflect(-v, n));',
				'		color = mix(color, image.rgb, image.a * clamp(0.3 + fresnel, 0.0, 1.0));',
				'	}',
				'	color = mix(color, horizon, 1.0 - exp(-length(vWorld) / uFog));',
				'	outColor = vec4(color, 0.86 + fresnel * 0.14);',
				'}'
			].join('\n'),

			/* A surface seen from above for the map of a field: its color and how high it stands. */
			Top: head + [
				'in vec3 vWorld;',
				'in vec3 vColor;',
				'out vec4 outColor;',
				'void main() {',
				'	outColor = vec4(vWorld.y < 0.0 ? vec3(0.1, 0.22, 0.3) : min(vColor, vec3(1.0)), max(vWorld.y, 0.0));',
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
