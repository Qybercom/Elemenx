/*
 * The scene of a game in three dimensions on WebGL2 (the Renderer Service): objects of any kind (the Kinds Service),
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
 * they go round, a Model and parts: modules, a dock), fighter, cruiser and freighter (ships: Model; their health is of a game: Vitals of ElemenxGaming), fleet
 * (Mover: Speed; Formation: Count, Ship, Spacing: its ships are parts). An application defines its own (SceneKinds.Define)
 * and systems of its own for traits of its own (Systems: {Trait: {Update(object, scene), Draw(object, scene)}}).
 *
 * The objects: System ({Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}), Seed (a whole system of it:
 * Astronomy.Generate) and SceneObject declared inside (a SceneObject in another goes round it when it moves, an Orbit or
 * a Mover, and is a part of it otherwise; Part="dock" changes a part of the kind of its parent). Every attribute of a
 * SceneObject is a field of it or of a Trait, in any case. Time is the day (0), Speed the days of it a second (1),
 * Paused holds it; Scale compressed (the default: large bodies, short distances) or real (crafts as long as their Length
 * in metres, of them or of their Vehicle). The scene starts behind a veil (Veiled, 0 to 1), its time still, until all the
 * view needs is made (the globes of its planets painted, the squares of its ground near the eye, what grows round it); a
 * location a ship comes into is made the same way, darker only if it keeps waiting: there, its ground, what grows on it
 * and the programs it needs, made by the card behind the page (no globe is drawn on a ground).
 *
 * The view: a drag turns it round the object in focus, the wheel or two fingers zoom, a click selects an object (or
 * its label; a part of an object near enough), a double click flies to it (from its day side), Escape goes back, the
 * arrows turn, + and - zoom, Enter flies to the selected one, Space holds the time. Orbits, Labels, Details (a card of
 * the selected object), Background (the far stars), Team, the slot hud, the slot screens (elements a car's screens show, out of sight). Without WebGL2 it says so (and emits error).
 *
 * The view is free in every 3D scene: a drag turns and tilts it, the wheel zooms, the middle button or a drag with Shift
 * carries it (two fingers on a screen), WASD or the arrows move it, Q and E turn it, R and F tilt it.
 *
 * The sky of a ground: a SceneObject of kind sun takes Time (18:30, or hours as a number) and goes on at the pace of
 * DaySeconds, Noon is the azimuth it passes at noon (180), Shade the color of the light of the sky and Disc how large
 * it is seen (degrees, 0.533: the Sun from the Earth; a location of a ship has that of its star). DayHours is how
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
 * the very ground its baked surface shows (SceneTerrainGenerator.Sphere), in patches finer near the eye, under its sky (its
 * atmosphere and its star); a drag looks round, the wheel rises and comes down, WASD and the arrows walk, Escape or
 * TakeOff() goes back up. The time runs SurfaceSpeed days a second there (1/120). A ship lands and takes off by itself
 * (its traits Entry and Flight, SceneLanding): Land(ship, {Marker} or {Latitude, Longitude}) takes it from its orbit
 * through the air to the location of the point, TakeOff(ship) back up to a low orbit; the command Landing of the scene
 * lists the markers of the body and lets a point be picked.
 *
 * Kinds of the ground (the setting terrain): ground (Terrain: World, the graph of its world (SceneWorld: its land, relief,
 * climate, biomes, sketch and what is made on it, the only place they are told; with none there is no ground), Swell (how
 * wild its sea, 0 to 1.5: SceneWaves; wilder in the rain), SwellWay (degrees the wind drives it): a ground of noise,
 * SceneTerrainGenerator.Flat, in chunks finer near the eye, with its sea; the objects its World makes are in the scene
 * as Generated, made again with it and never saved), sun (Sun: its light from far), unit (Walker: Speed,
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
 * A strategy game, a race and any other game is a component declared inside it (GameStrategy, GameRace of ElemenxGaming:
 * the trait SceneBehaviour).
 *
 * Events: ready (the scene, for its methods), select ({ID, Object, Info}: ID empty when none is), focus ({ID}),
 * arrive ({ID, At}), land ({ID}), takeoff ({ID}), error ({Reason: webgl2}); enter and leave of a trigger ({Trigger,
 * ID, Object}) and action ({Trigger, Name, Data}): kind trigger and kind zone (trait Triggers: Trigger(id),
 * TriggerActions(actions), ZonesAt(x, z)); touch ({ID, With, At, Normal, Impulse}) of solid things that fall and are
 * knocked over (trait Rigid: Push(id, impulse, at), CastRay(from, direction, max), RigidWorld()); crack ({ID, Integrity,
 * Point, Amount}) of a thing hurt as its material is, that breaks when nothing of it is whole (trait Fracture: Damage(id,
 * amount, hit), Integrity(id), Fractures(materials)). Kind pipe (trait Pipe: Points, Radius, Wall, Laid, Fluid...) is a pipe of
 * any size on supports, on the ground or buried in it, drawn outside and inside (trait Piping: Pipes()).
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
 * came, stage by stage (programs, models, globes, ground, plants), never back, a slot named loading takes the place of
 * the bar, and the event loading tells {Part (up to 100), Stage}. Behind the veil of its start nothing else shows; when
 * all the view needs is made the picture comes up (0.8 s) and the event prepared ({First}) tells it, at the start and
 * each time a location came. The globes of planets painted are kept in the browser (IndexedDB) for the next time.
 * Preload(list, callback) makes ready beforehand what a scene will need: names of models, Worlds of grounds, planets.
 */
Elemenx.Component('Scene', {
	$TemplateURL: 'Scene.html',
	$StyleURL: 'Scene.css',
	$Traits: ['SceneScatter', 'SceneLighting', 'SceneProbes', 'SceneEffects', 'SceneCosmos', 'SceneVehicles', 'SceneTriggers', 'ScenePhysics', 'SceneRoadNetwork', 'SceneFootings', 'SceneLanding', 'SceneCamera', 'SceneScreens', 'SceneCinema', 'SceneWeapons', 'SceneDebris', 'SceneFracture', 'ScenePiping', 'SceneDeepSpace'],
	$Meta: {
		Group: 'game',
		Icon: 'star',
		Description: 'The scene of a game in 3D: objects of any kind with their traits and parts; the setting space brings a star system on Kepler orbits, stations and fleets, with a landing on the surfaces of its bodies; the setting terrain a ground of noise and its walkers.',
		Container: true,
		Children: ['SceneObject'],
		Slots: ['hud', 'loading', 'screens'],
		Events: {
			ready: 'The scene is ready: the component itself, to call its methods.',
			select: 'The selection changed: {ID, Object, Info, IDs, Objects} (ID empty when none is).',
			focus: 'The view moved to an object: {ID}.',
			person: 'V took the view of a walker to another place: third, first or shoulder.',
			loading: 'What the scene waits for came a step nearer: {Part (up to 100, never back), Stage (programs, models, globes, ground, plants, view; empty when done)}.',
			prepared: 'All the view needs is made and the veil goes: {First (the start of the scene, not a location that came)}.',
			shoulder: 'B took the view over another shoulder: right or left.',
			arrive: 'An object reached where it was sent: {ID, At}.',
			land: 'The view went down to the surface of a body: {ID}.',
			takeoff: 'The view went back up to space: {ID}.',
			travel: 'A ship on its way far at once (Travel, H or J) came to a phase: {ID, Kind (warp or jump), Phase (enter, inside, exit, done)}.',
			enter: 'A walker, a vehicle or the hero came into a trigger: {Trigger (the trigger itself: ID, Inside(), Action(name, data), Enable(on)), ID, Object}.',
			leave: 'One went out of a trigger, or was removed: {Trigger, ID, Object}.',
			action: 'A trigger was sent an action (Action of the trigger): {Trigger, Name, Data}.',
			dig: 'A hole was dug in the ground (Dig): {At, Radius}.',
			fire: 'An object shot its weapon (SceneWeapons): {ID, Weapon, From, Way}.',
			hit: 'A shot hit something or the ground (SceneWeapons): {ID, Weapon, Type, Source, Team, Target, Part, Point, Normal, Material, Amount, Distance}.',
			lock: 'The hero locked a target under its aim (Lock of its weapon): {ID, Weapon}.',
			unlock: 'A lock was lost: {ID}.',
			break: 'A thing broke into pieces (Break, SceneDebris): {ID, Pieces, Point}.',
			teleport: 'A thing is beamed away or comes (Teleport): {ID, Phase (out or in), From, To}.',
			through: 'A ship flew into the mouth of a wormhole (SceneDeepSpace): {ID, Wormhole, Leads, To (the mouth it comes out of, empty: none)}.',
			hover: 'The pointer came over a selectable object, or left it: {ID (empty: none), Object, Info}.',
			cutscene: 'A cutscene started, ended or was stopped (SceneCinema): {Name, State: start, end or stop}.',
			cue: 'A cue of a cutscene came: {Cutscene, Name, Data, At}.',
			part: 'A part of an object was set by its role (Part(id, role).Set): {ID, Role, Value}.',
			touch: 'Two solid things began to touch (trait Rigid): {ID, With (null: the ground), At, Normal, Impulse}.',
			crack: 'A thing with the trait Fracture was hurt and still holds (SceneFracture): {ID, Integrity, Point, Amount}.',
			shader: 'A graph (or GLSL written by hand) made into a shader did not compile, and what the library has is drawn in its place: {Kind (material, vertex, land, water, wind, grass, effect, pass), Owner (the material, object or prop of the graph), Errors ([{Block, Line, Message}]: each on the block of GLSL it is in), Message}.',
			error: 'There is no WebGL2 ({Reason: webgl2}).'
		},
		Methods: ['Trigger(id)', 'TriggerActions(actions)', 'ZonesAt(x, z)', 'SurfaceAt(x, z)', 'Roads()', 'Junctions()', 'Interchanges()', 'Push(id, impulse, at)', 'CastRay(from, direction, max)', 'Colliders()', 'RigidWorld()', 'Burst(type, place, options)', 'AddBehaviour(behaviour)', 'PipelineGraph()', 'LibraryWind()', 'LibraryGrass()', 'LibrarySky()', 'LibraryLand()', 'LibraryWater()', 'EffectGraph(name)', 'Effects(types)', 'MountsOf(id, kind)', 'Travel(id, kind, options, callback)', 'OpenPart(id, name, amount)', 'Parts(id)', 'Part(id, role)', 'CosmosKinds()', 'Add(kind, props)', 'Change(id, changes)', 'UseCamera(id, options)', 'Cameras()', 'Fire(id, options)', 'Weapons(types)', 'HitRules(rules)', 'Locked()', 'Trace(from, way, range)', 'Marks()', 'Killed(id)', 'Break(id, options)', 'Debris()', 'Pipes()', 'Fluids()', 'Damage(id, amount, hit)', 'Integrity(id)', 'Fractures(materials)', 'Teleport(id, place, options, callback)', 'CastOn(type, at, options)', 'Dispel(id, seconds)', 'Lightning(kind)', 'Visibility()', 'SightOf(range)', 'SeasonState()', 'Visible(from, to, range)', 'PlayCutscene(cutscene, callback)', 'StopCutscene()', 'PauseCutscene(on)', 'SeekCutscene(seconds)', 'Cutscene()', 'Cinema(layer)', 'Record(options, callback)', 'ScreenAt(clientX, clientY)', 'Remove(id)', 'Attach(parent, object)', 'Detach(id)', 'Get(id)', 'Objects(filter)', 'Describe(id)', 'Position(id)', 'Select(id)', 'Selection()', 'FocusOn(id)', 'Control(id)', 'Move(id, target)', 'Play(id, clip, callback)', 'Now()', 'SetTime(days)', 'ToScreen(id)', 'Pick(clientX, clientY, all)', 'Viewpoint()', 'SetViewpoint(view)', 'Project(point)', 'Ray(clientX, clientY)', 'GroundAt(clientX, clientY)', 'OrbitAt(id, clientX, clientY)', 'Unlink(id)', 'Socket(id, name)', 'ChangeSown(key, changes)', 'UnlinkSown(key)', 'Save(options)', 'Load(saved)', 'Dig(at, radius)', 'FootingsOf()', 'Land(id, options)', 'TakeOff()', 'Surface()', 'Supported()', 'Preload(list, callback)', 'ToOrbit(id)'],
		Props: {
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
			Origin: 'Draws the three axes of the world at its middle (and the colliders as their outlines).',
			Wireframe: 'Draws the wire of the scene over it: each edge of the ground and of the models (--elemenx-scene-wire).',
			Edges: 'Draws the edges of the models: where their faces meet at an angle and their rims (--elemenx-scene-edges).',
			Hovered: 'The ID of the object under the pointer, outlined (--elemenx-scene-hover) as the selected one is (--elemenx-scene-outline).',
			HoverMark: 'How the object under the pointer is marked: none (the default: the hover event alone), ring, outline, or {Look, Color (#rrggbb), Width (pixels of an outline), Pulse (seconds of a beat, 0 still), Cursor (a CSS cursor over it)}.',
			SelectMark: 'How the selected object is marked: outline (the default, with a ring while it is small on the screen), ring, none, or {Look, Color, Width, Pulse}.',
			HoverCheck: 'A function (object, info) for what the pointer may mark: false passes it by, an object of the fields of HoverMark marks it so; without it all may be but the walker or the vehicle under the keys.',
			SelectCheck: 'A function (object, info) for what a press (on it or on its label) may select: false passes it by. Select(id) from code is not asked.',
			Orders: 'A right press on the ground sends the walker selected there (a game of its own, as GameStrategy, orders as it likes).',
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
			WaterGraph: 'What water looks like: a water graph of the Blueprints Service (or its JSON, or its GLSL) of its waves, the sky and the sun it mirrors, its depth, its foam and the fog over it; the one of the library (LibraryWater) when empty.',
			LandGraph: 'What the land is, its light and its wet and snow too: a land graph of the Blueprints Service (or its JSON, or GLSL with blueprintLand); empty, the one of the library (LibraryLand()). Its Blueprint (a material graph) still paints it, in LandPaint.',
			SkyGraph: 'What the sky is: a sky graph of the Blueprints Service (or its JSON, or GLSL with blueprintSky); empty, the one of the library (LibrarySky()).',
			GrassGraph: 'How the wind leans the grass: a vertex graph as WindGraph (or its JSON, or GLSL); empty, the one of the library (LibraryGrass()).',
			WindGraph: 'How the wind bends what grows and sways: a vertex graph of the Blueprints Service (or its JSON, or its GLSL), the one of the library (LibraryWind) when empty; the Vertex of a material runs after it.',
			Front: 'The seconds a change of the weather takes.',
			View: {Options: ['', 'top', 'isometric'], Description: 'A ground seen in parallel rays, as a game of two dimensions: from above or at an angle (empty: in perspective).'},
			Paused: 'Holds the time.',
			Loader: 'Shows how much of the scene has come; a slot named loading takes its place.',
			Focus: 'The ID of the object in the middle of the view.',
			Selected: 'The ID of the selected object.',
			Orbits: 'Draws the orbits.',
			Labels: 'Shows the names of the objects.',
			Exposure: 'What a view lets in: a number holds it, empty adapts to the light as an eye does.',
			Aurora: 'The northern lights, 0 to 1 (more is brighter): anywhere, at night; empty: by themselves at 55 to 68 degrees of Latitude of the sun, at night under a clear sky.',
			AuroraColors: 'The colors of the northern lights, under and over: [\'#3dff9a\', \'#c03cff\'].',
			Crosshair: {Options: ['', 'none', 'dot', 'cross', 'circle', 'chevron'], Description: 'The crosshair over the view while the hero holds a Weapon: empty as its weapon says, none for no crosshair.'},
			MarkCount: 'How many marks of shots stay at once (the oldest go first).',
			MarkSeconds: 'How long a mark of a shot stays, in seconds.',
			Season: 'The season the land and its plants show: spring, summer, autumn or winter; empty: of the sun (its DayOfYear of YearDays at its Latitude), passing with the days.',
			Rainbow: 'A rainbow, 0 to 1, where the sun stands low behind the view; empty: the weather\'s, in a light rain or as it ends.',
			Cutscenes: 'The cutscenes of the scene by name ({Name: {Tracks, Restore, Skip, Loop}}, SceneCinema): PlayCutscene(name) plays one; Save and Load keep them.',
			Camera: 'The camera of the scene (an object of kind camera) that shows the world; empty: the view of the scene.',
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
	Camera: '',
	Cutscenes: null,
	Aurora: null,
	AuroraColors: null,
	Rainbow: null,
	Season: '',
	Crosshair: '',
	MarkCount: 200,
	MarkSeconds: 60,
	Selected: '',
	Orbits: true,
	Labels: true,
	Person: 'third',
	Shoulder: 'right',
	Axes: '',
	WindGraph: null,
	GrassGraph: null,
	SkyGraph: null,
	LandGraph: null,
	WaterGraph: null,
	Origin: false,
	Wireframe: false,
	Edges: false,
	Hovered: '',
	HoverMark: '',
	SelectMark: '',
	HoverCheck: null,
	SelectCheck: null,
	Orders: false,
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
	/* The body the view landed on (Land), '' in space: what the button to take off waits for. */
	LandedOn: '',
	/* What the driven ship can do now (SceneLanding): land (near a body), takeoff (down in a location) or ''; the list of its command. */
	ShipCan: '',
	LandingOpen: false,
	LandingMarkers: null,
	/* Whether the driven ship may go to the parking orbit of the body near (SceneLanding), and the hint shown: orbit or ''. */
	ShipOrbit: false,
	ShipHint: '',
	/* How dark the view is (0 to 1): a veil while what the view needs is made, or a ship goes through a passage (SceneLanding). */
	Veiled: 0,
	/* The stage the loading is at (programs, models, globes, ground, plants, view; '' when none) and its words. */
	LoadingStage: '',
	LoadingText: '',

	$OnCreate: function () {
		var self = this;
		var kinds = this.$Service('SceneKinds');

		var behaviours = [];

		/* The behaviours, out of the state of the component: as they were given, not watched. */
		this.Behaviours = function () {
			return behaviours;
		};
		this.Behaving = false;

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

			return '';
		};
	},

	/* A kind of each model of the Models Service: a soldier walks like a unit, an oak stands like a tree, a tower like a house. */
	Catalogue: function () {
		var library = this.$Service('SceneModels');
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
	 * The kinds of the setting terrain: a ground of noise (Terrain: World, the graph of its world, Swell, SwellWay; its look Blueprint and Parameters), its sun
	 * (Sun: Elevation, Azimuth in degrees, Color; with Time, Noon: the azimuth at noon of its way, 180; Shade: the color of the light of the sky), units that walk (Walker: Speed, a second; X and Y their place on the
	 * map), trees, rocks and houses (a Model; Blocks: no way through them).
	 */
	Ground: function () {
		return {
			'ground': {Traits: {Terrain: {World: null, Swell: 0.35, SwellWay: 30, Blueprint: null, Parameters: null}}},
			'effect': {Traits: {Effect: {Type: 'campfire', Size: 1, Power: 1, Aim: null, Height: 0, Light: true, On: true, Color: '', Hot: '', Volume: 1, Intensity: 1, Length: 1, Width: 1, Spin: 1, Rings: null, Seed: '', Smoke: 1, Appear: 0.45, Draw: 0, Tune: null, Pulse: null, Where: 'body', Blueprint: null, Parameters: null}}},
			'mirror': {Traits: {Mirror: {Width: 2, Height: 2, Yaw: 0, Pitch: 0, Lift: 1, Tint: '#ffffff', Blur: 0, Strength: 0.92, Every: 1}}},
			'glass': {Traits: {Glass: {Width: 2, Height: 2, Yaw: 0, Pitch: 0, Lift: 1, Tint: '#cfe6f0', Clarity: 0.88, Frost: 0, Reflect: 0.35}}},
			'light': {Traits: {Light: {Color: '#ffd39a', Power: 1, Radius: 14, Height: 2.5, Spot: 0, Aim: null, Flicker: 0}}},
			'location': {Traits: {Model: {Shape: 'rock', Size: 1, Color: '#ffffff'}, Location: {}}},
			'sun': {Traits: {Sun: {Elevation: 35, Azimuth: 140, Color: '#fff4e0', Disc: 0.533, Time: '', Noon: 180, Shade: '#ffffff', DayHours: 24, Latitude: null, Tilt: 23.44, DayOfYear: 172, YearDays: 365, Moon: true, MoonLight: 1, MoonSize: 1, MoonPhase: 0.5, MoonElevation: null, MoonAzimuth: null, MoonTilt: 5.14, MoonNode: 80, NightLight: 1, SkyGlow: 0, SkyGlowColor: '#ffa860', SkyGlowAzimuth: null, Galaxy: 1}}},
			'unit': {Traits: {Walker: {Speed: 8, MaxSlope: 0.45}, Model: {Shape: 'soldier', Size: 1.8, Color: '#ffffff'}, Selectable: {}}},
			'tree': {Traits: {Model: {Shape: 'pine', Size: 8, Color: '#ffffff'}}, Values: {Blocks: true}},
			'rock': {Traits: {Model: {Shape: 'rock', Size: 2.5, Color: '#ffffff'}}, Values: {Blocks: true}},
			'house': {Traits: {Model: {Shape: 'house', Size: 8, Color: '#ffffff'}, Selectable: {}}, Values: {Blocks: true}},
			'building': {Extends: 'house'},
			'thing': {Traits: {Model: {Shape: 'crystal', Size: 1, Color: '#ffffff'}}},
			'collider': {Traits: {Collider: {Points: null, Height: null, Lift: 0, Model: ''}}},
			'screen': {Traits: {Screen: {Width: 1.6, Height: 0.9, Yaw: 0, Pitch: 0, Lift: 1.5, Camera: '', Image: '', Video: '', Canvas: '', Element: '', Pixels: null, Every: null, Bright: 1, Interactive: true}}},
			'marker': {Traits: {Marker: {Role: 'spawn', Team: ''}}},
			'camera': {Traits: {Camera: {Lift: 1.6, Yaw: 0, Pitch: 0, Roll: 0, Target: '', Follow: '', At: null, Rig: 'tripod', Shake: null, Smooth: null, Lag: null, Tilt: 0.3, PitchMin: -90, PitchMax: 30, Focal: 35, Sensor: 36, Aperture: null, Focus: null, ISO: null, Shutter: null, ND: 0, Compensation: 0, Polarizer: 0, Filter: '', Temperature: 6500, Tint: 0, Saturation: 1, Contrast: 1, LUT: '', Aberration: 0, Distortion: 0, Vignette: null, Grain: null}}},
			'trigger': {Traits: {Trigger: {Shape: '', Points: null, Radius: 4, Width: 4, Height: 0, Team: '', Kinds: null, Once: false, Enabled: true, Achievement: null, Blueprint: null, Parameters: null}}},
			'zone': {Traits: {Zone: {Points: null, Radius: 0, Tags: null, Team: ''}}},
			'road': {Traits: {Road: {Type: 'road', Points: null, Closed: false, Width: 0, Height: 0, Bridges: null, Tunnels: null, Structures: false, Clear: 5, Cover: 8, Shortest: 12, Follow: true, Grade: 0, Elevated: null, Viaducts: true, Bank: 8, Barriers: null, Along: null, Marks: null, Straight: false, Segments: null, Radii: null}, Model: {Shape: 'road', Size: 1, Color: '#ffffff'}}},
			'junction': {Traits: {Junction: {Radius: 0, Surface: 'asphalt', Form: '', Closed: false, Under: false}}},
			'pipe': {Traits: {Pipe: {Points: null, Radius: 0.3, Wall: null, Laid: 'above', Lift: 1.5, Depth: 1, Bend: null, Ends: null, Flanges: null, Spacing: null, Color: null, Inside: null, Metal: 0.6, Fluid: null, Leaks: null}, Model: {Shape: 'pipe', Size: 1, Color: '#ffffff'}}},
			'barrier': {Traits: {Barrier: {Road: '', Side: 'both', Type: 'guardrail', Height: 0, Gap: 0.3, From: 0, To: null, Points: null, Closed: false, Smooth: false, Color: '', Step: 0}, Model: {Shape: 'road', Size: 1, Color: '#ffffff'}}},
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
			'star': {Traits: {Star: {Mass: 1, Radius: null, Temperature: null, Luminosity: null, Color: '', Veil: 3, Corona: 1, Prominences: 1, Flares: 1}, Selectable: {}}},
			'planet': {Traits: {Orbit: orbit, Body: {Radius: 6371, Mass: null, Day: 24, Tilt: 0, Albedo: null}, Surface: {Type: 'rocky', Colors: '', Water: '', Ocean: null, Ice: null, Clouds: null, Planet: null, Atmosphere: '', Seed: ''}, Selectable: {}}},
			'moon': {Extends: 'planet', Traits: {Body: {Radius: 1737, Day: 0}, Surface: {Type: 'moon'}}},
			'blackhole': {Traits: {Orbit: Object.assign({}, orbit, {Distance: 40}), BlackHole: {Mass: 10, Disk: true, Inner: 3, Outer: 14, Tilt: 12, Color: '', Brightness: 1}, Selectable: {}}},
			'wormhole': {Traits: {Orbit: Object.assign({}, orbit, {Distance: 12}), Wormhole: {Radius: 1, Cosmos: 'nebula', Star: '#ffd9a0', Leads: '', To: '', Tilt: 0}, Selectable: {}}},
			'comet': {Traits: {Orbit: Object.assign({}, orbit, {Distance: 6, Eccentricity: 0.85, Inclination: 18}), Comet: {Radius: 5, Tail: 1, Color: '', Ion: ''}, Selectable: {}}},
			'quasar': {Traits: {Quasar: {Azimuth: 40, Elevation: 20, Color: '#bcd4ff', Brightness: 1, Jets: true}, Selectable: {}}},
			'planetoid': {Extends: 'moon', Traits: {Body: {Radius: 120, Day: 9}, Surface: {Type: 'dwarf', Atmosphere: 'none', Clouds: 0}}},
			'belt': {Traits: {Belt: {Inner: 2.2, Outer: 3.2, Count: 260, Inclination: 0, Colors: '', Rocks: 1}}},
			'ring': {Traits: {Ring: {Inner: 1.3, Outer: 2.3, Inclination: 0, Colors: ''}}},
			'module': {Traits: {Model: {Shape: 'box', Size: 1, Scale: [1, 1, 1], Color: '#d6d9e0'}}},
			'station': {
				Traits: {Orbit: {Distance: 1.8, Unit: 'radii', Period: 0.6, Inclination: 12}, Model: {Shape: '', Size: 0.11, Relative: true, Spin: 2}, Selectable: {}},
				Parts: [
					{ID: 'ring', Kind: 'module', Traits: {Model: {Shape: 'torus', Color: '#dcdfe6'}}},
					{ID: 'hub', Kind: 'module', Traits: {Model: {Shape: 'cylinder', Scale: [0.4, 0.8, 0.4], Color: '#8d929c'}}},
					{ID: 'panel-a', Kind: 'module', Position: [0, 0.55, 0], Traits: {Model: {Shape: 'box', Scale: [1.1, 0.03, 0.34], Color: '#1f3366'}}},
					{ID: 'panel-b', Kind: 'module', Position: [0, -0.55, 0], Traits: {Model: {Shape: 'box', Scale: [1.1, 0.03, 0.34], Color: '#1f3366'}}},
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
			'craft': {Traits: {Orbit: {Distance: 1.8, Unit: 'radii', Period: 0.6, Inclination: 12, Anomaly: null}, Model: {Shape: '', Size: 0.11, Relative: true}, Selectable: {}}},
			'ship': {Traits: {Model: {Shape: 'fighter', Size: 0.07, Relative: false}, Selectable: {}, Entry: {Mode: 'landing', Pace: 30, Cruise: 40, Parking: 400, Exit: 0.6}, Flight: {Airspeed: 160, Climb: 30, Hover: 40, Agility: 1}}},
			'fighter': {Extends: 'ship'},
			'cruiser': {Extends: 'ship', Traits: {Model: {Shape: 'cruiser'}}},
			'freighter': {Extends: 'ship', Traits: {Model: {Shape: 'freighter'}, Container: {Size: 80}}},
			'fleet': {Traits: {Mover: {Speed: 0.25}, Formation: {Count: 5, Ship: 'fighter', Spacing: 2.4}, Selectable: {}}}
		};
	},

	$OnReady: function () {
		var self = this;
		var element = this.$Element();

		/*
		 * What was put in the slot stands beside the bar of the scene, which then gives way. Regression: the bar not made yet
		 * when the scene was (its library still coming) was taken for something put in the slot, and never showed: an empty
		 * slot leaves its mark (a comment elemenx:slot) first.
		 */
		this.LoadingOwn = !Array.prototype.some.call(element.querySelector('.elemenx-scene-loading').childNodes, function (node) {
			return node.nodeType === 8 && node.data === 'elemenx:slot';
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

		var canvas = element.querySelector('.elemenx-scene-canvas');
		var labels = element.querySelector('.elemenx-scene-labels');
		var graphics = this.$Service('Renderer');
		var meshes = this.$Service('Meshes');
		var math = this.$Service('Math');
		var astronomy = this.$Service('Astronomy');
		var kinds = this.$Service('SceneKinds');
		var library = this.$Service('SceneModels');
		var random = this.$Service('Random');
		var vectors = math.Vectors;
		var view = element.ownerDocument.defaultView || window;
		var shaders = this.Landed(this.Skied(this.Watered(this.Winded(this.Shaders(graphics)))));
		var renderer = graphics.Create(canvas, {Patient: true, Restored: function () {
			build();
		}});
		var engine = {};
		var gpu = {};
		var KM = astronomy.Units.km;
		var UNIT = 100;
		/* A metre in the units of the view, in real sizes. */
		var METRE = KM * UNIT / 1000;
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
			/* What was dug out of the ground (Dig): spheres cut out of its volume. */
			Digs: [],
			Ways: {},
			Seconds: 0,
			Ground: null,
			Rocks: {},
			Lines: {},
			Rings: {},
			Baked: {},
			Rivers: {},
			Towns: {},
			Highways: {},
			Globes: {},
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
			Colors: {Background: [0.01, 0.02, 0.04, 1], Orbit: [0.55, 0.65, 0.85, 0.3], Selection: [0.5, 0.77, 1, 1], Wire: [0.35, 0.85, 0.45, 0.7], Outline: [1, 0.72, 0.15, 1], Hover: [0.5, 0.82, 1, 1], Edges: [0.88, 0.25, 0.98, 1], Collider: [1, 0.55, 0.15, 0.9]},
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

			scene.Colors.Background = paint(style.getPropertyValue('--elemenx-scene-background').trim(), [0.01, 0.02, 0.04, 1]);
			scene.Colors.Orbit = paint(style.getPropertyValue('--elemenx-scene-orbit').trim(), [0.55, 0.65, 0.85, 0.3]);
			scene.Colors.Selection = paint(style.getPropertyValue('--elemenx-scene-selection').trim(), [0.5, 0.77, 1, 1]);

			/* What the debug shows, each its own colour: the wire of all, the outline of the chosen one and of the one under the pointer, the edges of models, the colliders. */
			scene.Colors.Wire = paint(style.getPropertyValue('--elemenx-scene-wire').trim(), [0.35, 0.85, 0.45, 0.7]);
			scene.Colors.Outline = paint(style.getPropertyValue('--elemenx-scene-outline').trim(), [1, 0.72, 0.15, 1]);
			scene.Colors.Hover = paint(style.getPropertyValue('--elemenx-scene-hover').trim(), [0.5, 0.82, 1, 1]);
			scene.Colors.Edges = paint(style.getPropertyValue('--elemenx-scene-edges').trim(), [0.88, 0.25, 0.98, 1]);
			scene.Colors.Collider = paint(style.getPropertyValue('--elemenx-scene-collider').trim(), [1, 0.55, 0.15, 0.9]);
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
			var common = {clip: 'Clip', soft: 'Soft', footing: 'Footing', houses: 'Houses', radius: 'Radius', type: 'Type', health: 'Health', maxhealth: 'MaxHealth', sight: 'Sight', tall: 'Tall', model: 'Model', roof: 'Roof', speed: 'Speed', shapes: 'Shapes', density: 'Density', size: 'Size', minheight: 'MinHeight', maxheight: 'MaxHeight', maxslope: 'MaxSlope', cover: 'Cover', patch: 'Patch', clumps: 'Clumps', spread: 'Spread', follow: 'Follow', offset: 'Offset', facing: 'Facing', lift: 'Lift', wet: 'Wet', drops: 'Drops', seed: 'Seed', blocks: 'Blocks', root: 'Root', length: 'Length', weapon: 'Weapon', material: 'Material', shootable: 'Shootable', interactive: 'Interactive', death: 'Death', invulnerable: 'Invulnerable', debrisseconds: 'DebrisSeconds', at: 'At'};
			var spec = {ID: raw.ID, Kind: kind, Parent: raw.Parent, Part: raw.Part, Values: {}, Traits: {}, Parts: []};

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

		/* The objects declared inside the scene: the SceneObject of the template, their nesting their meaning. */
		function declarations () {
			var nodes = element.querySelectorAll('.elemenx-scene-sources .elemenx-scene-source[data-type="object"]');
			var specs = [];
			var byNode = [];
			var before = JSON.stringify(scene.Declared);

			Array.prototype.forEach.call(nodes, function (node, index) {
				var raw;
				var spec;
				var holder = node.parentElement ? node.parentElement.closest('.elemenx-scene-source[data-type="object"]') : null;
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

			if (kind && !kinds.Has(kind))
				throw new Error('Elemenx Scene: unknown kind ' + kind);

			object = kinds.Make(kind || '', props);
			object.Parent = override.Parent !== undefined ? override.Parent : spec.Parent;

			return object;
		}

		/* Every object, of the seed, the system, the template, a saved game and the methods; the later over the earlier. */
		function compose () {
			composeObjects();
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

			function build (spec) {
				var key = spec.Restored ? '' : JSON.stringify([spec.Kind, spec.Parent, spec.Values, spec.Traits, spec.Parts, scene.Overrides[spec.ID] || null]);
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
			}

			roots = specs.map(build);

			/* What the World of a ground makes: objects of the scene as any other (Generated: the ground), made again with it, never saved. */
			roots.slice().forEach(function (object) {
				if (!trait(object, 'Terrain')) return;

				worldOf(object).Things.forEach(function (thing) {
					var id = object.ID + '-' + thing.ID;
					var made;

					if (scene.Removed[id] || objects[id]) return;

					made = engine.Canonical(Object.assign({}, thing.Values, {Kind: thing.Kind}), null, true);

					roots.push(build({ID: id, Kind: thing.Kind, Parent: '', Values: Object.assign({}, made.Values, {Generated: object.ID}), Traits: made.Traits, Parts: []}));
				});
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

				/* In real sizes a craft is as long as it is: Length (metres) of it or of its Vehicle. */
				if (real && !object.Owner && lengthOf(object))
					object.Size = lengthOf(object) * METRE;
			}
			else if (!self.DeepSize || !self.DeepSize(object, real, KM * UNIT)) {
				object.Size = 0;
			}

			if (trait(object, 'Formation'))
				object.Size = 0.07 * (real ? 0.02 : 1);

			/* A ship down in a location is as long as it is, in metres (SceneLanding). */
			if (object.Located)
				object.Size = object.Located;
		}

		/* The length of a craft in metres (Length of it, else of its Vehicle); 0 for none. */
		function lengthOf (object) {
			var vehicle = object.Values.Vehicle;

			return number(object.Values.Length, 0) || (vehicle && typeof vehicle === 'object' ? number(vehicle.Length, 0) : 0);
		}

		/* A metre in the units of the view, in real sizes; null when compressed. */
		engine.Metre = function () {
			return self.Scale === 'real' ? METRE : null;
		};

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

			return math.Multiply(math.Rotation([0, 0, 1], (angles[2] || 0) * rad), math.Multiply(math.Rotation([0, 1, 0], (angles[1] || 0) * rad), math.Rotation([1, 0, 0], (angles[0] || 0) * rad)));
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

				object.Turn = math.Identity();

				if (scene.Ground && !object.Away && !object.Owner && !orbit && !trait(object, 'Terrain') && !trait(object, 'Sun')) {
					stand(object);
				}
				else if (object.Owner && !object.Generated) {
					offset = math.Apply(object.Owner.Turn || math.Identity(), vectors.Scale(object.Values.Position || [0, 0, 0], object.Owner.Size || 1));
					object.World = vectors.Add(base, offset);
					object.Position = position;
					object.Turn = math.Multiply(object.Owner.Turn || math.Identity(), turnOf(object.Values.Rotation));
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
					object.Turn = math.Multiply(math.Rotation([1, 0, 0], number(body.Tilt, 0) * Math.PI / 180), math.Rotation([0, 1, 0], angle));
				}
				else if (trait(object, 'Star')) {
					object.Turn = math.Rotation([0, 1, 0], turned * 0.1);
				}
				else if (model && !object.Owner && model.Spin) {
					object.Turn = math.Multiply(math.Rotation([1, 0, 0], 0.35), math.Rotation([0, 1, 0], time * number(model.Spin, 0)));
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

		/*
		 * Whether shaders made of a graph compile, asked of the card once: one that does not is told (the event shader, its
		 * errors on the blocks of GLSL they are in; and the console, once), and its owner draws what the library has.
		 */
		function shaderChecked (kind, owner, made, vertex, fragment) {
			var log = renderer ? renderer.Check(vertex, fragment) : null;
			var errors;

			if (!log)
				return true;

			errors = self.$Service('BlueprintShaders').Errors(made, log);

			shaderTold(kind, owner, errors, String(log).split('\n')[0]);

			return false;
		}

		/* A graph that cannot be made, or made into what does not compile: the event shader and the console, once for the same. */
		function shaderTold (kind, owner, errors, message, warning) {
			var key = kind + '\n' + owner + '\n' + message;

			scene.Told = scene.Told || {};

			if (scene.Told[key]) return;

			scene.Told[key] = true;

			if (window.console && window.console.warn)
				window.console.warn(warning || 'Elemenx Scene: the ' + kind + ' graph of ' + owner + ' does not compile, the one of the library is drawn: ' + message);

			self.$Emit('shader', {Kind: kind, Owner: owner, Errors: errors, Message: message});
		}

		engine.Checked = shaderChecked;
		engine.Told = shaderTold;

		/* The wind and the water of the scene: a graph of its own that does not compile gives way to the one of the library. */
		function checkScene () {
			if (self.WindGraph && self.WindMade && !shaderChecked('wind', 'WindGraph', self.WindMade, shaders.Instanced, shaders.Pbr))
				self.WindMade = self.Made(null, 'vertex', 'WindGraph', self.LibraryWind.bind(self));

			if (self.WaterGraph && self.WaterMade && !shaderChecked('water', 'WaterGraph', self.WaterMade, shaders.SeaVertex, shaders.Sea))
				self.WaterMade = self.Made(null, 'water', 'WaterGraph', self.LibraryWater.bind(self));

			if (self.SkyGraph && self.SkyMade && !shaderChecked('sky', 'SkyGraph', self.SkyMade, graphics.Shaders.Quad, shaders.Sky))
				self.SkyMade = self.Made(null, 'sky', 'SkyGraph', self.LibrarySky.bind(self));

			if (self.LandGraph && self.LandMade && !shaderChecked('land', 'LandGraph', self.LandMade, shaders.LandVertex, shaders.Land))
				self.LandMade = self.Made(null, 'land', 'LandGraph', self.LibraryLand.bind(self));

			shaders = self.Landed(self.Skied(self.Watered(self.Winded(self.Shaders(graphics)))));
		}

		/* The meshes and programs, made once (and again when the browser gives a lost context back). */
		function build () {
			if (!renderer) return;

			checkScene();

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
			/* The land of the materials of a ground (names), with the Blueprint of the ground (own) or none: each made once. */
			gpu.LandPrograms = {};
			gpu.LandOf = function (own, names) {
				var key = (names || []).join(',');
				var kept = own ? own.Programs : gpu.LandPrograms;
				var hook = 'void landMaterials(vec3 place, float px, inout vec3 color, inout float height) {}';

				kept['Land:' + key] = kept['Land:' + key] || renderer.Program(shaders.LandVertex, (own ? own.Fragments.Land : shaders.Land).replace(hook, function () {
					return self.$Service('SceneMaterials').Land(names || []);
				}));

				return kept['Land:' + key];
			};
			gpu.ManyDepth = renderer.Program(shaders.Instanced, shaders.Depth);
			gpu.Pbr = renderer.Program(shaders.Instanced, shaders.Pbr);
			gpu.PbrSkinned = renderer.Program(shaders.Skinned, shaders.Pbr);
			gpu.GlowMany = renderer.Program(shaders.Instanced, shaders.BodyGlow);
			gpu.Outline = renderer.Program(shaders.Instanced, shaders.Flat);
			gpu.OutlineSkinned = renderer.Program(shaders.Skinned, shaders.Flat);
			gpu.GlowSkinned = renderer.Program(shaders.Skinned, shaders.BodyGlow);
			gpu.SkinDepth = renderer.Program(shaders.Skinned, shaders.Depth);
			gpu.White = null;
			gpu.LandDepth = renderer.Program(shaders.LandVertex, shaders.Depth);
			gpu.GroundDepth = renderer.Program(shaders.GroundVertex, shaders.Depth);
			gpu.ShadowMap = null;
			gpu.Sea = renderer.Program(shaders.SeaVertex, shaders.Sea);
			gpu.Sky = renderer.Program(graphics.Shaders.Quad, shaders.Sky);
			gpu.Sphere = renderer.Mesh(meshes.Sphere({Segments: 64, Rings: 40}));
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
					return meshes.Box({});
				},
				sphere: function () {
					return meshes.Sphere({Radius: 0.5, Segments: 24, Rings: 16});
				},
				cylinder: function () {
					return meshes.Cylinder({Radius: 0.5, Height: 1, Segments: 20});
				},
				cone: function () {
					return meshes.Cylinder({Radius: 0.5, Top: 0, Height: 1, Segments: 20});
				},
				torus: function () {
					return meshes.Torus({Radius: 1, Tube: 0.1, Segments: 48, Sides: 10});
				},
				asteroid: function () {
					var noise = math.Noise('rock');

					return meshes.Displace(meshes.Icosphere({Radius: 1, Detail: 1}), function (point) {
						return (noise.Fbm(point[0] * 1.6 + 3, point[1] * 1.6, point[2] * 1.6, 3) - 0.5) * 0.9;
					});
				}
			};

			return simple[name] ? simple[name]() : meshes.Box({});
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
					Mesh: renderer.Mesh(meshes.Ring({Inner: round ? inner : vectors.Length(spread([inner, 0, 0], null)), Outer: round ? outer : vectors.Length(spread([outer, 0, 0], null)), Segments: 128})),
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
			var planet = planetOf(object);
			/* A planet is painted with its rivers: none before they are made. */
			var flowing = planet ? scene.Rivers[object.ID] : null;
			if (flowing && !flowing.Ready || planet && (scene.Towns[object.ID] && !scene.Towns[object.ID].Ready || scene.Highways[object.ID] && !scene.Highways[object.ID].Ready)) return null;

			var key = JSON.stringify([object.Look, object.Seed, planet]);
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
			made = {Key: key, Ground: renderer.Cube(size), Sky: renderer.Cube(size), Planet: !!planet};

			renderer.Bake(made.Ground, gpu.Bake, Object.assign({uLayer: 0}, uniforms));
			renderer.Bake(made.Sky, gpu.Bake, Object.assign({uLayer: 1}, uniforms));

			scene.Baked[object.ID] = made;

			/* A planet of ScenePlanet: its ground the very lands of its globe, drawn only when all of it is painted (the clouds stay baked). */
			if (planet)
				paintPlanet(object, made, planet, 0);

			return made;
		}

		var planets = self.$Service('ScenePlanet');

		/*
		 * The options of the planet of a body (Surface: Planet, ScenePlanet) at its radius, its rivers, then its settlements,
		 * then its highways named once made; null for none.
		 */
		function planetOf (object) {
			var base = planetBase(object);
			var made = base ? riversOf(object, base) : null;
			var towns;
			var roads;

			if (!base)
				return null;

			if (!made || !made.Key || !made.Ready) return base;

			base.Rivers = made.Key;

			/* Its settlements, of its land with its rivers; its highways between them. */
			towns = laid(object, 'Towns', base, 'Settlements');

			if (!towns || !towns.Ready) return base;

			base.Settlements = towns.Key;
			roads = laid(object, 'Highways', base, 'Highways');

			if (roads && roads.Ready)
				base.Highways = roads.Key;

			return base;
		}

		/*
		 * What is laid on a planet once its land is made: its settlements (kind Settlements: ScenePlanet.Settlements) or its
		 * highways (kind Highways: ScenePlanet.Highways), made in a worker once for its options and kept in the browser:
		 * scene.Towns or scene.Highways {Key, Ready}; none for a planet that says false for them, or brings its own.
		 */
		function laid (object, store, base, kind) {
			var held = scene[store][object.ID];
			var key;

			if (base[kind] === false || Array.isArray(base[kind]) || typeof base[kind] === 'string') return null;

			key = layKey(base, kind);

			if (held && held.Key === key) return held;

			held = scene[store][object.ID] = {Key: key, Ready: false};

			lay(base, kind, key, function () {
				if (!scene.Gone && scene[store][object.ID] === held)
					held.Ready = true;
			});

			return held;
		}

		function layKey (base, kind) {
			return (kind === 'Settlements' ? 'towns:' : 'highways:') + JSON.stringify(base) + ':' + String(kind === 'Settlements' ? planets.Settlements : planets.Highways).length;
		}

		/* Made (or taken from the store of the browser) and named by its key; done when it is. */
		function lay (base, kind, key, done) {
			var use = kind === 'Settlements' ? 'UseSettlements' : 'UseHighways';

			cachedGlobe(key, function (found) {
				if (scene.Gone) return;

				if (found) {
					planets[use](key, found);

					done();

					return;
				}

				planets.Work().Run('ScenePlanet', kind, kind === 'Settlements' ? [base, 20000] : [base, 20], function (failed, made) {
					var list = failed || !made ? [] : made[kind];

					if (scene.Gone) return;

					planets[use](key, list);

					if (!failed)
						keepGlobe(key, list);

					done();
				});
			});
		}

		function planetBase (object) {
			var surface = trait(object, 'Surface');
			var planet = surface && surface.Planet;
			if (!planet)
				return null;

			return Object.assign({}, typeof planet === 'string' ? JSON.parse(planet) : planet, {Radius: object.Radius});
		}

		engine.PlanetOptions = planetOf;

		/*
		 * The rivers of a planet (ScenePlanet: Heights, then Drainage, in the workers), made once for its options and kept in
		 * the browser: {Key, Ready, Done (of 25 steps)}; none for a planet that says Rivers: false, or brings its own.
		 */
		function riversOf (object, base) {
			var held = scene.Rivers[object.ID];
			var key;

			if (base.Rivers === false || Array.isArray(base.Rivers) || typeof base.Rivers === 'string' || !renderer) return null;

			key = riversKey(base);

			if (held && held.Key === key) return held;

			held = scene.Rivers[object.ID] = {Key: key, Ready: false, Done: 0};

			makeRivers(base, key, function () {
				if (scene.Rivers[object.ID] === held)
					held.Done++;
			}, function () {
				if (scene.Rivers[object.ID] !== held) return;

				held.Ready = true;
				held.Done = 25;
			});

			return held;
		}

		/*
		 * The rivers of a planet made (or taken from the store of the browser) under their key, given to ScenePlanet
		 * (UseRivers): step() each of the 24 strips of heights, done() once they are there. What failed is not kept.
		 */
		function makeRivers (base, key, step, done) {
			cachedGlobe(key, function (found) {
				var size = 256;
				var heights;
				var left = 24;
				var failed = false;
				var face;
				var row;

				if (scene.Gone) return;

				if (found) {
					planets.UseRivers(key, found);

					done();

					return;
				}

				heights = new Float32Array(6 * size * size);

				function came (face, row) {
					return function (error, piece) {
						if (scene.Gone) return;

						if (!error && piece && piece.Data) heights.set(piece.Data, face * size * size + row * size);
						else failed = true;

						step();

						if (--left) return;

						planets.Work().Run('ScenePlanet', 'Drainage', [heights, size, 40], function (wrong, made) {
							var rivers = wrong || !made ? [] : made.Rivers;

							if (scene.Gone) return;

							planets.UseRivers(key, rivers);

							if (!failed && !wrong)
								keepGlobe(key, rivers);

							done();
						});
					};
				}

				for (face = 0; face < 6; face++) {
					for (row = 0; row < size; row += size / 4)
						planets.Work().Run('ScenePlanet', 'Heights', [base, face, size, row, size / 4], came(face, row));
				}
			});
		}

		function riversKey (base) {
			var source = String(planets.Make) + String(planets.Heights) + String(planets.Drainage);
			var sum = 0;
			var i;

			for (i = 0; i < source.length; i++)
				sum = (sum * 31 + source.charCodeAt(i)) >>> 0;

			return 'rivers:' + sum + ':' + JSON.stringify(base);
		}

		/*
		 * Paints the ground of a globe of a planet into a cube of its own, in strips that workers make (ScenePlanet.Face): when
		 * all of it came, it is the ground the globe is drawn with (Painted); the globe is not drawn before (no picture of the
		 * noise of its look first, no coarse one: nothing jumps).
		 */
		function paintPlanet (object, made, planet, level) {
			var sizes = [256];
			var size = sizes[level];
			var strip = size / 4;
			var key = globeKey(planet, size);

			/* Painted before, in this browser: at once. */
			cachedGlobe(key, function (faces) {
				var cube;
				var face;

				if (scene.Gone || scene.Baked[object.ID] !== made || renderer.Lost) return;

				if (!faces || faces.length !== 6) {
					paintStrips(object, made, planet, size, strip, key);

					return;
				}

				cube = renderer.Cube(size);

				for (face = 0; face < 6; face++)
					cube.Write(face, faces[face], 0, face === 5);

				made.Ground.Destroy();

				made.Ground = cube;
				made.Painted = size;
				made.Strips = 24;

				paintLights(object, made, planet);
			});
		}

		/* The lights of the settlements of a planet at night, a cube of their own (ScenePlanet.Lights, in strips), when it has any. */
		function paintLights (object, made, planet) {
			var size = 256;
			var strip = size / 4;
			var left = 24;
			var cube;
			var face;
			var row;

			if (!planet.Settlements) {
				made.Lit = true;

				return;
			}

			cube = renderer.Cube(size);

			function done (face, row) {
				return function (error, piece) {
					var data;
					var k;

					if (scene.Gone || scene.Baked[object.ID] !== made || renderer.Lost) {
						if (!--left)
							cube.Destroy();

						return;
					}

					left--;
					made.LitStrips = 24 - left;

					if (!error && piece && piece.Data) {
						data = new Uint8Array(piece.Data.length * 4);

						for (k = 0; k < piece.Data.length; k++)
							data[k * 4] = data[k * 4 + 1] = data[k * 4 + 2] = data[k * 4 + 3] = piece.Data[k];

						cube.Write(face, data, row, !left);
					}

					if (left) return;

					if (made.Lights)
						made.Lights.Destroy();

					made.Lights = cube;
					made.Lit = true;
				};
			}

			for (face = 0; face < 6; face++) {
				for (row = 0; row < size; row += strip)
					planets.Work().Run('ScenePlanet', 'Lights', [planet, face, size, row, strip], done(face, row));
			}
		}

		function paintStrips (object, made, planet, size, strip, key) {
			var cube = renderer.Cube(size);
			var left = 24;
			var faces = [0, 1, 2, 3, 4, 5].map(function () {
				return new Uint8Array(size * size * 4);
			});
			var face;
			var row;

			function done (face, row) {
				return function (error, piece) {
					if (scene.Baked[object.ID] !== made || renderer.Lost) {
						if (!--left)
							cube.Destroy();

						return;
					}

					left--;
					made.Strips = 24 - left;

					/* The last strip makes the smaller levels of all of it. */
					if (!error && piece && piece.Data) {
						cube.Write(face, piece.Data, row, !left);

						faces[face].set(piece.Data, row * size * 4);
					}

					if (left) return;

					made.Ground.Destroy();

					made.Ground = cube;
					made.Painted = size;

					paintLights(object, made, planet);

					keepGlobe(key, faces);
				};
			}

			for (face = 0; face < 6; face++) {
				for (row = 0; row < size; row += strip)
					planets.Work().Run('ScenePlanet', 'Face', [planet, face, size, row, strip], done(face, row));
			}
		}

		/*
		 * The globes painted, kept in the browser (IndexedDB, elemenx-globes): by the planet, its size and what paints it (a
		 * sum of the source of ScenePlanet, so a globe of an older painter is never taken). None where there is no such store.
		 */
		function globeKey (planet, size) {
			var source = String(planets.Make) + String(planets.Face) + String(planets.Color);
			var sum = 0;
			var i;

			for (i = 0; i < source.length; i++)
				sum = (sum * 31 + source.charCodeAt(i)) >>> 0;

			/* Its settlements are lights of their own (paintLights): the ground is the same with them or not. */
			return sum + ':' + size + ':' + JSON.stringify(Object.assign({}, planet, {Settlements: undefined}));
		}

		function globeStore (mode, done) {
			var request;

			try {
				request = window.indexedDB.open('elemenx-globes', 1);
			}
			catch (error) {
				done(null);

				return;
			}

			request.onupgradeneeded = function () {
				request.result.createObjectStore('faces');
			};

			request.onsuccess = function () {
				try {
					done(request.result.transaction('faces', mode).objectStore('faces'));
				}
				catch (error) {
					done(null);
				}
			};

			request.onerror = function () {
				done(null);
			};
		}

		function cachedGlobe (key, callback) {
			globeStore('readonly', function (store) {
				var got;

				if (!store) {
					callback(null);

					return;
				}

				got = store.get(key);

				got.onsuccess = function () {
					callback(got.result || null);
				};

				got.onerror = function () {
					callback(null);
				};
			});
		}

		/* A globe painted into the store of the browser before a scene shows it (Preload): callback(error) once it is there. */
		engine.PreloadGlobe = function (given, callback) {
			var flowing = given.Rivers === false || given.Rivers ? '' : riversKey(given);

			/* Its rivers first, as a scene makes them, then its settlements and its highways; its globe with them named. */
			if (flowing) {
				makeRivers(given, flowing, function () {}, function () {
					engine.PreloadGlobe(Object.assign({}, given, {Rivers: flowing}), callback);
				});

				return;
			}

			if (given.Rivers && given.Settlements === undefined) {
				lay(given, 'Settlements', layKey(given, 'Settlements'), function () {
					engine.PreloadGlobe(Object.assign({}, given, {Settlements: layKey(given, 'Settlements')}), callback);
				});

				return;
			}

			if (typeof given.Settlements === 'string' && given.Highways === undefined) {
				lay(given, 'Highways', layKey(given, 'Highways'), function () {
					engine.PreloadGlobe(Object.assign({}, given, {Highways: layKey(given, 'Highways')}), callback);
				});

				return;
			}

			paintAhead(given, callback);
		};

		function paintAhead (planet, callback) {
			var size = 256;
			var key = globeKey(planet, size);

			cachedGlobe(key, function (found) {
				var faces;
				var left = 24;
				var face;
				var row;

				if (found) {
					callback(null);

					return;
				}

				faces = [0, 1, 2, 3, 4, 5].map(function () {
					return new Uint8Array(size * size * 4);
				});

				function done (face, row) {
					return function (error, piece) {
						if (!error && piece && piece.Data)
							faces[face].set(piece.Data, row * size * 4);

						if (--left) return;

						keepGlobe(key, faces, callback);
					};
				}

				for (face = 0; face < 6; face++) {
					for (row = 0; row < size; row += size / 4)
						planets.Work().Run('ScenePlanet', 'Face', [planet, face, size, row, size / 4], done(face, row));
				}
			});
		}

		function keepGlobe (key, faces, callback) {
			var done = callback || function () {};

			globeStore('readwrite', function (store) {
				var put;

				try {
					put = store ? store.put(faces, key) : null;
				}
				catch (error) {
					done(null);

					return;
				}

				if (!put) {
					done(null);

					return;
				}

				put.onsuccess = function () {
					done(null);
				};

				put.onerror = function () {
					done(null);
				};
			});
		}

		/* The lights: the stars, up to four, relative to the eye. */
		function lights () {
			var positions = [];
			var colors = [];
			var list = scene.Order.filter(function (object) {
				return trait(object, 'Star') && object.World && !object.Hidden;
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
				camera.Near = Math.max(1e-12, flown2.Size * 0.05);
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
			camera.Near = Math.max(1e-12, scene.Distance * 0.002);
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

			/* A camera of the scene that shows the world brings a lens of its own (SceneCamera). */
			var camera = engine.Lens ? engine.Lens() : null;
			if (camera)
				return {Bokeh: camera.Coc ? 1 : 0, Focus: camera.Focus, Lens: camera};

			return {Bokeh: Math.max(0, Math.min(1, number(self.Bokeh, 0))), Focus: given > 0 ? given : hero && hero.World && scene.Eye ? vectors.Distance(vectors.Add(hero.World, [0, (hero.Size || 1) * 0.6, 0]), scene.Eye) : 0, Lens: null};
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
		 * The keys of a frame with the pads in them (InputDevices: a pad on the screen, a phone that leans, a real one): A is Space,
		 * B KeyC, RB or the press of the left stick Shift (run, drift, boost), LB Alt; the sticks and the triggers as they
		 * lean, in Pad: {X (right), Y (ahead), LookX, LookY (up), Gas, Brake}, for what moves by how far (a walk, a wheel).
		 */
		engine.PadKeys = function (keys) {
			var input = self.$Service('InputDevices');
			var axes = input.Axes();
			var made = Object.assign({}, keys);
			var buttons = {a: 'Space', b: 'KeyC', rb: 'ShiftLeft', ls: 'ShiftLeft', lb: 'AltLeft'};

			Object.keys(buttons).forEach(function (button) {
				if (input.Held(button))
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
			var viewMatrix = math.LookAt([0, 0, 0], vectors.Subtract(camera.Target, camera.Position), camera.Up);
			var projection = camera.Projection(aspect);
			var plain = math.Multiply(projection, viewMatrix);
			var matrix = scene.Ground ? math.Multiply(engine.PostJitter(projection), viewMatrix) : plain;

			scene.NormalsMatrix = matrix;

			var right = [viewMatrix[0], viewMatrix[4], viewMatrix[8]];
			var up = [viewMatrix[1], viewMatrix[5], viewMatrix[9]];
			var light = lights();
			var background = scene.Colors.Background;
			var models = gather();
			var nodes;
			var shade;
			var posted;

			engine.CosmosBake();

			if (engine.DeepPlace)
				engine.DeepPlace();

			/* First: a village it lays out makes the ground again. */
			engine.ScatterFrame(matrix);

			nodes = scene.Ground ? groundPatches() : null;
			shade = shadowOfScene(models, nodes);

			if (scene.Ground)
				Object.assign(shade, engine.FieldLight(matrix), localLights(), scene.Camera.Ortho ? {uCloudShade: [0, 0, 1, 0], uSkyFloor: 0} : Object.assign(engine.CloudShade(groundClouds(), scene.Ground.Sun), {uSkyFloor: Math.max(0, 1 - scene.Ground.Day * 3) * 0.55}));

			/* The light of probes (SceneProbes), worked out with the lights of the frame: what each surface gets round it. */
			if (scene.Ground && engine.ProbeLight)
				Object.assign(shade, engine.ProbeLight(shade));

			/* What burns on a ship lights it in space as well. */
			if (!scene.Ground)
				Object.assign(shade, localLights());

			var common = Object.assign({uViewProjection: matrix, uCamera: [0, 0, 0], uLightPositions: light.Positions, uLightColors: light.Colors, uLightCount: light.Count, uSkyLight: scene.Ground ? scene.Ground.SkyLight : [0.004, 0.004, 0.006], uFloorLight: scene.Ground ? scene.Ground.FloorLight : [0.004, 0.004, 0.006], uAmbient: scene.Ground ? [0.17, 0.19, 0.23] : scene.CosmosShade ? [0.025 + scene.CosmosShade[0], 0.027 + scene.CosmosShade[1], 0.035 + scene.CosmosShade[2]] : [0.025, 0.027, 0.035], uOccluderCount: 0, uOccluders: new Array(16).fill(0), uTime: scene.Time, uHighlight: [0, 0, 0, 0], uWind: scene.Gust || 0, uWet: scene.Ground ? scene.Ground.Air.Wet : 0, uSnowed: snowed(), uRainDrops: scene.Ground ? scene.Ground.Air.Rain : 0, uEyeAt: scene.Eye || [0, 0, 0], uTime2: scene.Seconds % 1000, uNightGlow: scene.Ground ? scene.Ground.Night || 0 : 1, uScreenMirror: engine.ScreenMirror && engine.ScreenMirror() ? 1 : 0}, shade, self.WindValues(scene.Seconds));

			/* The arrays of the frame stay as they are till the next one: given again to each draw, they are not read again. */
			renderer.Hold(Object.keys(common).map(function (key) {
				return common[key];
			}));

			var selected = scene.Selected ? scene.Objects[scene.Selected] : null;

			scene.BakedThisFrame = 0;

			/* The uniforms of a draw: its own over the common ones of the frame (read through, never copied: a copy of all of them for each draw took milliseconds). */
			function uniforms (extra) {
				return Object.assign(Object.create(common), extra);
			}

			/* A turn of an object with its place relative to the eye and its size: its model matrix. */
			function placed (object, size) {
				var model = math.Multiply(math.Translation(0, 0, 0), object.Turn || math.Identity());

				model = math.Multiply(model, math.Scaling(size, size, size));
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
			/* Whether the eye is under the sea: lower than the waves over it. */
			if (scene.Ground)
				scene.Ground.Under = !!scene.Ground.Field.Water && !scene.Camera.Ortho && scene.Eye[1] < self.$Service('SceneWaves').At(scene.Ground.Waves, scene.Eye[0], scene.Eye[2], scene.Seconds).Height;

			var worldOf = function (vp, eye, small) {
				var mine = Object.assign(Object.create(common), {uViewProjection: vp, uCamera: eye, uMoving: 0, uSteady: 0, uCut: [0, 0, 0, 0]});

				drawGround(vp, nodes, shade, true);

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					/* The glass of a mirror is not in its own picture, nor in another's. */
					if (list.Material && seeThrough(list.Material) || list.MirrorKey) return;

					if (list.Material) renderer.Draw(shape(name), pbrOf(list), Object.assign(Object.create(mine), {uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft}, surface(list), blueprintValues(list), engine.SeasonValues(name), engine.DissolveValues(list)), {Cull: list.Material.DoubleSided ? 'none' : 'back'});
					else renderer.Draw(shape(name), gpu.Many, Object.assign(Object.create(mine), {uShine: list.Matte ? 8 : 36, uSpecular: list.Matte ? 0.05 : 0.5, uRough: list.Rough, uOrigin: originOf(list)}, engine.SeasonValues(name), engine.DissolveValues(list)));
				});

				/* A mirror of a car shows the trees and the grass too at high and ultra: its picture is as fine as the screen now, and no bigger than the mirror. */
				if (self.Graphics().Level !== 'low' && (!small || self.Graphics().Level === 'high' || self.Graphics().Level === 'ultra'))
					engine.ScatterDraw(mine, vp);
			};
			var mirrored = scene.Ground && !scene.Camera.Ortho ? mirrorsOf(projection, viewMatrix, worldOf) : {};

			/* What the cameras of the screens see (SceneScreens), drawn as the mirrors are. */
			if (scene.Ground && !scene.Camera.Ortho && engine.ScreensWorld)
				engine.ScreensWorld(projection, viewMatrix, worldOf);

			posted = engine.PostBegin();

			renderer.Clear([background[0], background[1], background[2], 1]);

			if (scene.Ground)
				drawGround(matrix, nodes, shade);

			/* The far sky through a view of its own depth: of the view of space, its inverse lost the way where the near plane is a metre and the far one beyond the stars. */
			var sky = math.Multiply(math.Perspective(camera.Fov, aspect, 0.1, 200), viewMatrix);

			if (!scene.Ground)
				engine.CosmosDraw(sky, plain);

			if (self.Background && self.Background !== 'false' && !scene.Ground) {
				renderer.Draw(gpu.Stars, gpu.Far, {uViewProjection: math.Multiply(math.Perspective(camera.Fov, aspect, 0.1, 200), viewMatrix), uRatio: renderer.Ratio}, {Depth: false, DepthWrite: false, Blend: 'add'});
			}

			/*
			 * Space in real sizes reaches from a ship a few metres from the eye to stars a hundred million kilometres away: more
			 * than a depth can tell apart. It is drawn in two parts split at a distance (half the way to the nearest body): the far
			 * one first, its depth in the back half, then the near one in the front half; each is cut at the split by its planes,
			 * so what lies across it is drawn in both, and what is far still hides what is behind it (a body the flare of a star).
			 */
			var split = !scene.Ground && !camera.Ortho ? splitOf(camera) : 0;
			/* What comes after all that stands (the engines burning, the warp, the mark of the selection) is near: in the near part. */
			var after = matrix;

			if (split) {
				after = math.Multiply(math.Perspective(camera.Fov, aspect, camera.Near, split * 1.0001), viewMatrix);

				passed(math.Multiply(math.Perspective(camera.Fov, aspect, split, camera.Far), viewMatrix), [0.5, 1], [split, camera.Far]);
				passed(after, [0, 0.5], [camera.Near, split * 1.0001]);

				common.uViewProjection = after;
			}
			else {
				passed(matrix, null, [camera.Near, camera.Far]);
			}

			/* All that stands, once, through a view (its matrix), its depth in a range of the buffer (null: all of it). */
			function passed (matrix, range, planes) {
				var later = [];

				common.uViewProjection = matrix;

				if (range)
					renderer.GL.depthRange(range[0], range[1]);

				scene.Active.forEach(function (object) {
					var parent = parentOf(object);
					var size = object.World && object.Size ? Math.max(object.Size, pixels(object.World, trait(object, 'Star') ? 4 : 1.5)) : object.Size;
					var model;
					var shade;
					var surface;
					var ring;

					if (!object.World || object.Hidden) return;

					if (trait(object, 'Star')) {
						model = placed(object, size);

						renderer.Draw(gpu.Sphere, gpu.Star, uniforms({uModel: model, uNormalMatrix: math.NormalMatrix(model), uColor: paint(object.Color).slice(0, 3), uSeed: object.Seed, uCells: object.Star.Radius > 8 ? 3 : object.Star.Radius > 2 ? 6 : 9}));

						later.push(function () {
							/* In real sizes its disc is small, its light is not: a halo of a size on the screen, as bright as it blinds. */
							var blind = self.Scale === 'real' ? starLight(object, vectors.Distance(object.World, scene.Eye)) : 0;
							var wide = Math.max(size * 11, pixels(object.World, 520 * blind));
							var close = Math.max(size * 4.2, pixels(object.World, 110 * blind));

							/* The wide veil first: the disc does not end at once at black space. */
							renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(object.World), uSize: wide, uRight: right, uUp: up, uColor: paint(object.Color).slice(0, 3).map(function (part) {
								return part * (0.3 + blind * 0.5);
							}), uInner: 0.09, uStyle: 0}), {Blend: 'add', DepthWrite: false, Cull: 'none'});

							renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(object.World), uSize: close, uRight: right, uUp: up, uColor: paint(object.Color).slice(0, 3).map(function (part) {
								return part * (1 + blind * 2);
							}), uInner: 0.18, uStyle: 0}), {Blend: 'add', DepthWrite: false, Cull: 'none'});
						});
					}
					else if (trait(object, 'Body')) {
						surface = baked(object);

						/* Near, a planet of ScenePlanet is its very ground, finer the nearer (drawGlobe), its clouds over it; far, its globe once all painted. */
						var near = !!surface && surface.Planet && !scene.Camera.Ortho && object.Size / pixels(object.World, 1) > 60;
						if (!surface || surface.Planet && !surface.Painted && !near) return;

						model = placed(object, size);
						shade = occluders(object);

						if (near && drawGlobe(object, planes)) {
							if (object.Look.Clouds && !scene.Globes[object.ID].CloudsOver) {
								var high = math.Compose(local(object.World), object.Turn, size * 1.004);

								later.push(function () {
									renderer.Draw(gpu.Sphere, gpu.Planet, uniforms({uModel: high, uNormalMatrix: math.NormalMatrix(high), uGround: surface.Ground, uSky: surface.Sky, uKind: object.Look.Kind, uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]), uClouds: object.Look.Clouds, uAtmosphere: object.Look.Atmosphere, uOccluders: shade.Data, uOccluderCount: shade.Count, uHighlight: [0, 0, 0, 0], uCloudsOnly: 1, uDrift: engine.CloudDrift(object), uLights: noLights(), uLightsOn: 0}), {Blend: 'alpha', DepthWrite: false});
								});
							}
						}
						else {
							renderer.Draw(gpu.Sphere, gpu.Planet, uniforms({uModel: model, uNormalMatrix: math.NormalMatrix(model), uGround: surface.Ground, uSky: surface.Sky, uKind: object.Look.Kind, uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]), uClouds: object.Look.Clouds, uAtmosphere: object.Look.Atmosphere, uOccluders: shade.Data, uOccluderCount: shade.Count, uHighlight: highlight(object), uCloudsOnly: 0, uDrift: engine.CloudDrift(object), uLights: surface.Lights || noLights(), uLightsOn: surface.Lights ? 1 : 0}));
						}

						if (object.Look.Atmosphere[3]) {
							later.push(function () {
								var shell = math.Compose(local(object.World), null, size * 1.07);

								renderer.Draw(gpu.Sphere, gpu.Air, uniforms({uModel: shell, uNormalMatrix: math.NormalMatrix(shell), uColor: object.Look.Atmosphere.slice(0, 3), uStrength: object.Look.Atmosphere[3], uBody: local(object.World).concat([size]), uShell: size * 1.07}), {Blend: 'add', DepthWrite: false, Cull: 'front'});
							});
						}
					}
					else if (trait(object, 'Ring')) {
						ring = ringOf(object);

						later.push(function () {
							var settings = trait(object, 'Ring');
							var round = parent && parent.Radius;
							var turn = math.Rotation([1, 0, 0], ((round ? number(trait(parent, 'Body').Tilt, 0) : 0) + number(settings.Inclination, 0)) * Math.PI / 180);
							var matrix = math.Compose(local(parent ? parent.World : [0, 0, 0]), turn, round ? parent.Size : 1);
							var planet = round ? local(parent.World).concat([parent.Size]).concat(new Array(12).fill(0)) : new Array(16).fill(0);

							renderer.Draw(ring.Mesh, gpu.Ring, uniforms({uModel: matrix, uNormalMatrix: math.NormalMatrix(matrix), uColors: [].concat(ring.Colors[0], ring.Colors[1], ring.Colors[2], ring.Colors[3]), uSeed: object.Seed, uOccluders: planet, uOccluderCount: round ? 1 : 0}), {Blend: 'alpha', DepthWrite: false, Cull: 'none'});
						});
					}

					if (self.Orbits && self.Orbits !== 'false' && trait(object, 'Orbit') && trait(object, 'Orbit').Unit !== 'radii' && !object.Owner && astronomy.Length(trait(object, 'Orbit').Distance))
						later.unshift(line(object, parent, uniforms));
				});

				/* Black holes, wormholes, comets and quasars (SceneDeepSpace): light bent and gas that glows, with what is seen through. */
				if (engine.DeepDraw)
					engine.DeepDraw(matrix, later, right, up, planes);

				Object.keys(models).forEach(function (name) {
					var list = models[name];

					/* The glass of a mirror of a car: the picture of its mirror in its own shape. */
					if (list.MirrorKey && mirrored[list.MirrorKey]) {
						renderer.Draw(shape(name), mirrorGlass(list), Object.assign(uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft}), mirrorValues(list.MirrorKey, mirrored[list.MirrorKey])), {Cull: 'none'});

						return;
					}

					if (list.Material) {
						var blended = seeThrough(list.Material);

						var drawn = function () {
							renderer.Draw(shape(name), pbrOf(list), Object.assign(uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft, uMoving: list.Still || blended ? 0 : 1, uSteady: list.Still ? 0 : 1, uCut: heroCut(list)}), surface(list), blueprintValues(list), engine.SeasonValues(name), engine.DissolveValues(list)), {Cull: list.Material.DoubleSided ? 'none' : 'back', Blend: blended ? 'over' : 'none', DepthWrite: !blended});
						};

						/* What is seen through comes after all it shows, and hides nothing of what is drawn after it. */
						if (blended) later.push(drawn);
						else drawn();

						return;
					}

					renderer.Draw(shape(name), gpu.Many, uniforms(Object.assign({uShine: list.Matte ? 8 : 36, uSpecular: list.Matte ? 0.05 : 0.5, uRough: list.Rough, uOrigin: originOf(list), uMoving: list.Still ? 0 : 1}, engine.SeasonValues(name), engine.DissolveValues(list))));
				});

				/* The mirrors as panes of what they show, the glass after all it shows through. */
				if (scene.Ground)
					drawPanes(uniforms, mirrored, later);

				/* What glows: its surfaces once more, their light added, brightest at their edges; bloom spreads it round them. */
				Object.keys(scene.GlowLists || {}).forEach(function (name) {
					var list = scene.GlowLists[name];
					if (list.Count)
						renderer.Draw(shape(name), moved(list, list.Skinned ? gpu.GlowSkinned : gpu.GlowMany, 'BodyGlow'), Object.assign(uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uTime: scene.Seconds, uFlat: list.Flat ? 1 : 0}), movedValues(list)), {Blend: 'add', DepthWrite: false, Depth: 'lequal', Cull: list.Material && list.Material.DoubleSided ? 'none' : 'back'});
				});

				/* The outlines: back faces grown by a few pixels, behind what they outline. */
				Object.keys(scene.OutlineLists || {}).forEach(function (name) {
					var list = scene.OutlineLists[name];
					if (list.Count)
						renderer.Draw(shape(name, list.Geometry), list.Skinned ? gpu.OutlineSkinned : gpu.Outline, Object.assign(uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uOutline: Math.tan(scene.Camera.Fov * Math.PI / 360) * 2 * (scene.OutlineWidth || 3) / Math.max(1, scene.Height), uColor: [list.Tints[0], list.Tints[1], list.Tints[2], 1], uBody: [0, 0, 0, 0]})), {Cull: 'front'});
				});

				/* The wire of all and the edges of the models, over them. */
				[['wire', wired(), scene.Colors.Wire], ['edges', edged(), scene.Colors.Edges]].forEach(function (one) {
					if (!one[1]) return;

					Object.keys(models).forEach(function (name) {
						var list = models[name];
						if (list.Count && list.Geometry !== undefined && !list.Skinned)
							renderer.Draw(linesMesh(one[0], name, list.Geometry), gpu.Outline, Object.assign(uniforms({uOrigin: originOf(list), uOutline: 0, uColor: one[2], uBody: [0, 0, 0, 0]})), {Blend: 'alpha', DepthWrite: false, Depth: 'lequal'});
					});
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

				/* The shots, their streaks and the marks they leave (SceneWeapons), before what is seen through. */
				if (engine.DebrisDraw)
					engine.DebrisDraw(matrix);

				if (engine.FractureDraw)
					engine.FractureDraw(matrix);

				/* What flows out of the pipes (ScenePiping). */
				if (engine.PipingDraw)
					engine.PipingDraw(matrix);

				if (engine.WeaponsDraw)
					engine.WeaponsDraw(matrix);

				later.forEach(function (each) {
					each();
				});
			}

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

				engine.CosmosWarp(plain, Object.assign({Depth: Math.min(0.99999, math.Apply(plain, vectors.Scale(forward, reach))[2])}, scene.Warp));
			}

			if (self.Origin && self.Origin !== 'false') {
				drawOrigin(matrix);

				drawColliders(matrix);
			}

			engine.EffectsDraw(after, {Right: right, Up: up, Forward: [-viewMatrix[2], -viewMatrix[6], -viewMatrix[10]], Near: camera.Near, Far: split ? split * 1.0001 : camera.Far, Split: !!split});

			/*
			 * The ring of what the pointer is over, with HoverMark ring: whatever its size, hidden by what stands before it. None by
			 * default: what the pointer marks and how is for the game to say (HoverMark, HoverCheck, the event hover).
			 */
			var hovering = scene.Hovering ? scene.Objects[scene.Hovering] : null;
			var pointed = engine.Mark('hover');
			/* A ring is drawn before the object, toward the eye: what stands before it hides it, the object itself does not. */
			var before = function (object) {
				var at = local(object.World);
				var far = vectors.Length(at);

				return far > object.Size ? vectors.Scale(at, 1 - object.Size * 0.75 / far) : at;
			};
			var chosen = engine.Mark('select');

			if (hovering && hovering.World && hovering !== selected && pointed.Look === 'ring')
				renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: before(hovering), uSize: Math.max(hovering.Size * 1.35, pixels(hovering.World, 16)), uRight: right, uUp: up, uColor: pointed.Color.slice(0, 3), uInner: 0, uStyle: 1}), {Blend: 'add', DepthWrite: false, Cull: 'none'});

			/* The mark of the selected object: a ring with SelectMark ring; with an outline, a ring while it is small on the screen (near, its outline shows it). */
			if (selected && selected.World && (chosen.Look === 'ring' || chosen.Look === 'outline' && Math.max(selected.Size, 0.001) < pixels(selected.World, 40))) {
				renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: chosen.Look === 'ring' ? before(selected) : local(selected.World), uSize: Math.max(selected.Size * 1.5, pixels(selected.World, 14)), uRight: right, uUp: up, uColor: chosen.Look === 'ring' ? chosen.Color.slice(0, 3) : scene.Colors.Selection.slice(0, 3), uInner: 0, uStyle: 1}), {Blend: 'add', DepthWrite: false, Depth: chosen.Look === 'ring', Cull: 'none'});
			}

			if (split) {
				renderer.GL.depthRange(0, 1);

				common.uViewProjection = matrix;
			}

			if (posted)
				engine.PostEnd(scene.Ground ? {Matrix: matrix, Plain: plain, Eye: scene.Eye, Shade: shade, Under: scene.Ground.Under ? 1 : 0, Sun: scene.Ground.Sun, SunColor: scene.Ground.SunColor, Night: scene.Ground.Night, Shimmer: engine.EffectHeat(matrix, width / Math.max(1, height)), Exposure: self.Exposure, Air: scene.Ground.AirTint, Veil: scene.Ground.Air.Fog * (scene.Ground.Air.Rain > 0.05 ? 1 : 0.6), Clouds: scene.Camera.Ortho ? null : groundClouds(), Glare: scene.Ground.Glare, AirLight: scene.Ground.AirLight, AirGlow: scene.Ground.Glow, AirGlowWay: scene.Ground.GlowWay, Fog: scene.Camera.Ortho ? 0 : (scene.Horizon ? 0.4 / 40000 : (scene.Ground.Field.Whole ? 0.12 : 0.4) / Math.max(scene.Ground.Field.Size, 300)) + scene.Ground.Air.Fog * 0.011, FogLow: scene.Camera.Ortho ? [0, 0, 0] : [Math.max(0, scene.Eye[1] - Math.max(0, scene.Ground.Field.Height(scene.Eye[0], scene.Eye[2]))), 1 / Math.max(6, scene.Ground.Field.Top * 0.2), scene.Ground.Air.Fog * 0.03], Sky: true, Reach: Math.max(1, scene.Distance * 0.05), Bokeh: lens().Bokeh, Focus: lens().Focus, Lens: lens().Lens} : Object.assign({Matrix: matrix, Plain: sky}, spaceSun(plain, camera), lens()));
		}

		/* Where space is split for its depth (Scene: draw): half the way to the surface of the nearest body or star, 0 when one view of depth is enough. */
		function splitOf (camera) {
			var nearest = Infinity;

			scene.Active.forEach(function (object) {
				if (!object.World || object.Hidden || !(trait(object, 'Body') || trait(object, 'Star'))) return;

				nearest = Math.min(nearest, vectors.Distance(object.World, camera.Position) - object.Size * 1.1);
			});

			if (!(nearest < Infinity) || nearest * 0.5 < camera.Near * 1000) return 0;

			return nearest * 0.5;
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

			/* In real sizes a star blinds by the light it sends (its luminosity over the square of the way, in AU), not by how large its disc is. */
			return {Sun: way, SunColor: paint(star.Color).slice(0, 3), Star: true, Ring: Math.abs(matrix[5]) * 0.5 * Math.max(star.Size / far, self.Scale === 'real' ? 0.006 : 0), Clear: Math.min(0.9999, (clip[0] / Math.max(clip[1], 1e-6)) * 0.5 + 0.5 - 1e-6), Glare: self.Scale === 'real' ? starLight(star, far) : Math.min(1, Math.pow(star.Size / far * 7, 1.3))};
		}

		/* How large a star is seen from a body (the angle of its radius): as it is in real sizes, else as the Sun from the Earth. */
		function discOf (star, body) {
			return self.Scale === 'real' && star && body && body.World ? Math.atan(star.Size / Math.max(1e-12, vectors.Distance(star.World, body.World))) : 0.00465;
		}

		engine.StarDisc = discOf;

		/* How a star of real size blinds at a distance (units of the view): 0.9 for the Sun from the Earth. */
		function starLight (star, far) {
			var au = far / UNIT;

			return Math.min(1, 0.9 * Math.sqrt(number(star.Star.Luminosity, 1) / Math.max(1e-6, au * au)));
		}

		/* The copies of the shapes of a frame: the rocks of the belts, the models of the objects, their pieces as they stand now. */
		function gather () {
			var models = scene.Lists = scene.Lists || {};
			var lined = wired() + ':' + edged();

			/* The wire or the edges turned on or off: what stands still and the squares of the ground are made again with their lines. */
			if (scene.Lined !== undefined && scene.Lined !== lined) {
				scene.StillLists = null;

				if (scene.Ground) {
					destroyNodes(scene.Ground.Nodes);

					scene.Ground.Nodes = {};
				}
			}

			scene.Lined = lined;

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
						var turn = math.Rotation(each.Axis, scene.Time * each.Spin);

						batch(models, 'asteroid', point, math.Multiply(turn, math.Scaling(each.Size, each.Size, each.Size)), each.Color, {Matte: true, Rough: 1});
					});
				}

				/* A model: of its own shape, or of its parts (a station of modules); a part drawn in its owner. */
				if (settings && (settings.Shape || object.Values.Model))
					gatherModel(models, object, settings);
			});

			Object.keys(models).forEach(function (name) {
				if (models[name].Count)
					upload(name, models[name]);

				if (models[name].Count) drawn[name] = models[name];
				else forgotten(models, name);
			});

			Object.keys(glows).forEach(function (name) {
				if (glows[name].Count) upload(name, glows[name]);
				else forgotten(glows, name);
			});

			outlines();

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

		/* How far the clouds of a body went round it (radians): a wind of 25 metres a second, in seconds of the clock, never in its days made fast. */
		engine.CloudDrift = function (object) {
			return scene.Seconds * 25 / (Math.max(1, number(object.Radius, 1000)) * 1000);
		};

		/*
		 * How the object under the pointer (hover) or the selected one (select) is marked: HoverMark or SelectMark, a word or
		 * {Look, Color, Width, Pulse, Cursor}, over them what HoverCheck gave the one under the pointer. Look: none, ring or
		 * outline; Color as the theme says when none is given; it beats once every Pulse seconds.
		 */
		engine.Mark = function (kind) {
			var hover = kind === 'hover';
			var given = hover ? self.HoverMark : self.SelectMark;
			var own = hover && scene.HoverOwn || {};
			var mark = given && typeof given === 'object' ? given : {Look: given};
			var look = String(own.Look || mark.Look || (hover ? 'none' : 'outline')).toLowerCase();
			var color = paint(own.Color || mark.Color || '', hover ? scene.Colors.Hover : scene.Colors.Outline);
			var pulse = number(own.Pulse !== undefined ? own.Pulse : mark.Pulse, 0);
			var beat = pulse > 0 ? 0.65 + 0.35 * Math.cos(performance.now() / 1000 / pulse * Math.PI * 2) : 1;

			return {Look: ['none', 'ring', 'outline'].indexOf(look) === -1 ? 'none' : look, Color: [color[0] * beat, color[1] * beat, color[2] * beat, 1], Width: Math.max(0.5, number(own.Width !== undefined ? own.Width : mark.Width, 3)), Cursor: String(own.Cursor || mark.Cursor || '')};
		};

		/*
		 * The outlines of the object chosen (Selected, as SelectMark says), of the one under the pointer (as HoverMark says) and
		 * of the one Hovered names: their models gathered once more, each in a list of its own, drawn grown along their normals,
		 * their back faces only, in the colour of each.
		 */
		function outlines () {
			var lists = scene.OutlineLists = scene.OutlineLists || {};
			var chosen = engine.Mark('select');
			var pointed = engine.Mark('hover');

			Object.keys(lists).forEach(function (name) {
				lists[name].Count = 0;
			});

			scene.OutlineWidth = Math.max(chosen.Look === 'outline' ? chosen.Width : 0, pointed.Look === 'outline' ? pointed.Width : 0, 3);

			[[chosen.Look === 'outline' ? scene.Selected : '', chosen.Color], [self.Hovered, scene.Colors.Hover], [pointed.Look === 'outline' && scene.Hovering !== self.Hovered ? scene.Hovering : '', pointed.Color]].forEach(function (pair) {
				var object = pair[0] ? scene.Objects[pair[0]] : null;
				var settings = object ? trait(object, 'Model') : null;
				if (!object || !object.World || object.Hidden || !settings || !(settings.Shape || object.Values.Model) || pair[1] !== chosen.Color && pair[0] === scene.Selected) return;

				scene.Outlining = {Color: pair[1]};

				gatherModel(lists, object, settings);

				scene.Outlining = null;
			});

			Object.keys(lists).forEach(function (name) {
				if (lists[name].Count) upload(name, lists[name]);
				else forgotten(lists, name);
			});
		}

		/* The lines of a geometry: each edge of its triangles once (all: its wire), or those where its faces meet at an angle and its rims (its edges). */
		function linesOf (geometry, edges) {
			var p = geometry.Positions;
			var count = p.length / 3;
			var index = geometry.Indices && geometry.Indices.length ? geometry.Indices : null;
			var triangles = index ? index.length / 3 : count / 3;
			var corners = {};
			var seen = {};
			var made = [];
			var t;

			function at (i) {
				return index ? index[i] : i;
			}

			/* Corners of the same place are one: a model of flat faces has a corner of each face. */
			function place (v) {
				var key = Math.round(p[v * 3] * 1e4) + ',' + Math.round(p[v * 3 + 1] * 1e4) + ',' + Math.round(p[v * 3 + 2] * 1e4);

				corners[key] = corners[key] === undefined ? v : corners[key];

				return corners[key];
			}

			function normal (a, b, c) {
				var u = [p[b * 3] - p[a * 3], p[b * 3 + 1] - p[a * 3 + 1], p[b * 3 + 2] - p[a * 3 + 2]];
				var w = [p[c * 3] - p[a * 3], p[c * 3 + 1] - p[a * 3 + 1], p[c * 3 + 2] - p[a * 3 + 2]];

				return vectors.Normalize(vectors.Cross(u, w));
			}

			for (t = 0; t < triangles; t++) {
				var v = [place(at(t * 3)), place(at(t * 3 + 1)), place(at(t * 3 + 2))];
				var n = normal(v[0], v[1], v[2]);

				[[0, 1], [1, 2], [2, 0]].forEach(function (pair) {
					var a = Math.min(v[pair[0]], v[pair[1]]);
					var b = Math.max(v[pair[0]], v[pair[1]]);
					var key = a + ':' + b;

					if (a === b) return;

					seen[key] = seen[key] || {A: a, B: b, Normals: []};

					seen[key].Normals.push(n);
				});
			}

			/* An edge of the shape: a rim (of one face) or where two faces meet at more than 30 degrees. */
			Object.keys(seen).forEach(function (key) {
				var edge = seen[key];
				if (edges && edge.Normals.length === 2 && vectors.Dot(edge.Normals[0], edge.Normals[1]) > 0.866) return;

				made.push(p[edge.A * 3], p[edge.A * 3 + 1], p[edge.A * 3 + 2], p[edge.B * 3], p[edge.B * 3 + 1], p[edge.B * 3 + 2]);
			});

			return made;
		}

		/* The lines mesh of a shape (kind wire or edges), made once, its copies those of the shape. */
		function linesMesh (kind, name, geometry) {
			var key = kind + ':' + name;

			gpu.LineShapes = gpu.LineShapes || {};

			if (!gpu.LineShapes[key])
				gpu.LineShapes[key] = renderer.Mesh({Positions: linesOf(geometry || shapeGeometry(name), kind === 'edges'), Indices: []}, 'lines');

			return gpu.LineShapes[key];
		}

		/*
		 * A list nothing was drawn of for ten seconds goes, with its mesh: a car changed for another left all its pieces
		 * behind, in the memory of the page and of the card. Each frame one is drawn of starts its count again.
		 */
		function forgotten (lists, name) {
			var list = lists[name];
			var moment = view.performance ? view.performance.now() : Date.now();

			list.Idle = list.Idle || moment;

			if (moment - list.Idle < 10000) return;

			if (gpu.Shapes[name]) {
				gpu.Shapes[name].Destroy();

				delete gpu.Shapes[name];
			}

			delete lists[name];
		}

		function upload (name, list) {
			list.Idle = 0;

			var size = list.Count * 4;
			var data = {aInstance: {Size: 4, Data: list.Places.subarray(0, size)}, aInstance2: {Size: 4, Data: list.X.subarray(0, size)}, aInstance3: {Size: 4, Data: list.Y.subarray(0, size)}, aInstance4: {Size: 4, Data: list.Z.subarray(0, size)}, aInstance5: {Size: 4, Data: list.Tints.subarray(0, size)}};

			if (list.Skinned)
				data.aFrames = {Size: 4, Data: list.Frames.subarray(0, size)};

			shape(name, list.Geometry).Instance(data, list.Count);

			/* The wire of the scene, the edges of its models: their lines copied as the shape is. */
			if (wired() && name.indexOf('outline:') !== 0)
				linesMesh('wire', name, list.Geometry).Instance(data, list.Count);

			if (edged() && name.indexOf('outline:') !== 0)
				linesMesh('edges', name, list.Geometry).Instance(data, list.Count);
		}

		function wired () {
			return !!self.Wireframe && self.Wireframe !== 'false';
		}

		function edged () {
			return !!self.Edges && self.Edges !== 'false';
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
		 * What a Blueprint of a material, a ground or a pass is: a graph (an object, or its JSON), GLSL written by hand (a
		 * text: {type: kind, glsl}), or the URL of a file of GLSL (one line ending in .glsl), read once by the scene: null till
		 * it has come (a file that does not come is told once and stays null).
		 */
		engine.Written = function (value, kind) {
			var texts = engine.Texts = engine.Texts || {};
			var request;
			var text;

			if (!value || typeof value !== 'string') return value;

			text = value.trim();

			if (text.charAt(0) === '{') return JSON.parse(text);

			if (!/^[^\n]+\.glsl(\?[^\n]*)?$/i.test(text)) return {type: kind, glsl: value};

			if (texts[text] && texts[text].Text !== null) return {type: kind, glsl: texts[text].Text};

			if (texts[text]) return null;

			texts[text] = {Text: null};

			request = new XMLHttpRequest();

			request.open('GET', text, true);

			request.onload = function () {
				if (request.status >= 200 && request.status < 300) texts[text].Text = request.responseText;
				else if (window.console && window.console.warn) window.console.warn('Elemenx Scene: the shader ' + text + ' did not come (' + request.status + ')');
			};
			request.onerror = function () {
				if (window.console && window.console.warn)
					window.console.warn('Elemenx Scene: the shader ' + text + ' did not come');
			};

			request.send();

			return null;
		};

		/*
		 * A material with a Blueprint (a material graph of the Blueprints Service, with its Parameters) is drawn by PBR with the
		 * surface of the graph in the place of its empty one: the color, the alpha, the roughness, the metal, the glow and the
		 * normal of each point. Its Texture blocks named Color, Normal, Metal, Emissive, Occlusion or Specular read the maps of
		 * the material. A ground with a Blueprint is drawn by Land the same way (its color, glow and normal). A graph that cannot be
		 * made, or made into what does not compile, is told (the event shader) and the material is drawn as it is. host: the
		 * shader it goes into, Pbr by default; owner: what it is told of (a ground: its ID; a material: its name).
		 */
		function blueprinted (material, host, owner) {
			var maps = {Color: 'uColorMap', Normal: 'uNormalMap', Metal: 'uMetalMap', Emissive: 'uEmissiveMap', Occlusion: 'uOcclusionMap', Specular: 'uSpecularMap'};
			var own;
			var made;
			var hook = 'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {}';
			var lines;
			var graph;

			/* A file of GLSL is drawn once it has come; till then the material is drawn as it is. */
			graph = engine.Written(material.Blueprint, 'material');

			if (graph === null) return null;

			gpu.Blueprinted = gpu.Blueprinted || new WeakMap();
			gpu.BlueprintTexts = gpu.BlueprintTexts || {};
			own = gpu.Blueprinted.get(material);

			/* The same GLSL written by hand (a Pattern of many materials) made once for all of them. */
			if (!own && typeof material.Blueprint === 'string' && gpu.BlueprintTexts[material.Blueprint]) {
				own = gpu.BlueprintTexts[material.Blueprint];

				gpu.Blueprinted.set(material, own);
			}

			host = host || 'Pbr';

			if (own && own.Source === material.Blueprint && (!own.Made || own.Fragments[host])) return own.Made ? own : null;

			if (!own || own.Source !== material.Blueprint) {
				own = {Source: material.Blueprint, Made: null, Programs: {}, Fragments: {}};

				if (typeof material.Blueprint === 'string')
					gpu.BlueprintTexts[material.Blueprint] = own;
			}

			gpu.Blueprinted.set(material, own);

			try {
				made = own.Made || self.$Service('Blueprints').Compile(graph);

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

				/* The lines of the GLSL blocks numbered in the shader they went into. */
				own.Fragments[host] = self.$Service('BlueprintShaders').Lined(shaders[host].replace(hook, function () {
					return lines.concat([made.Function]).join('\n');
				}));

				/* A ground with a Blueprint is a material of the land: drawn over the corners of the land. */
				if (!shaderChecked(host === 'Land' ? 'land' : 'material', owner || material.Name || '', made, host === 'Land' ? shaders.LandVertex : shaders.Instanced, own.Fragments[host])) {
					own.Made = null;
					own.Fragments[host] = null;

					return null;
				}

				own.Made = made;
			}
			catch (error) {
				shaderTold(host === 'Land' ? 'land' : 'material', owner || material.Name || '', [{Block: null, Line: 0, Message: error.message}], error.message, 'Elemenx Scene: the Blueprint of ' + (host === 'Land' ? 'the ground ' + (owner || '') : 'material ' + (material.Name || '')) + ' cannot be made: ' + error.message);

				return null;
			}

			return own;
		}

		/*
		 * A material with a Pattern (a material of SceneMaterials) and no Blueprint of its own: drawn by the pattern, its
		 * Blueprint the GLSL of it (SceneMaterials.Surface), once; Along: by its UV, as a band of a road is.
		 */
		function patterned (material) {
			var text;

			if (material.Pattern && !material.Blueprint && material.Patterned !== material.Pattern) {
				text = self.$Service('SceneMaterials').Surface(material.Pattern, !!material.Along);
				material.Patterned = material.Pattern;

				if (text)
					material.Blueprint = text;
			}

			return material;
		}

		/* The program of a material: PBR, or PBR with the surface of its Blueprint; its corners moved by its Vertex. */
		function pbrOf (list) {
			var own = patterned(list.Material).Blueprint ? blueprinted(list.Material) : null;
			var key = list.Skinned ? 'Skinned' : 'Plain';

			if (!own)
				return moved(list, list.Skinned ? gpu.PbrSkinned : gpu.Pbr, 'Pbr');

			if (vertexed(list.Material))
				return moved(list, null, 'Pbr', own.Fragments.Pbr);

			own.Programs[key] = own.Programs[key] || renderer.Program(list.Skinned ? shaders.Skinned : shaders.Instanced, own.Fragments.Pbr, !!list.Material.Pattern);

			/* A pattern is made behind the page: till it is, its surface is drawn plain, nothing waits for it. */
			if (list.Material.Pattern && !renderer.Ready(own.Programs[key])) return list.Skinned ? gpu.PbrSkinned : gpu.Pbr;

			return own.Programs[key];
		}

		/* The uniforms of the Blueprint and of the Vertex of a material: its parameters (those of the material over their values), the time, the tiles of its Pattern. */
		function blueprintValues (list) {
			var own = list.Material.Blueprint ? blueprinted(list.Material) : null;
			var tiles = own && list.Material.Pattern ? self.$Service('SceneMaterials').SurfaceTextures(renderer, list.Material.Pattern) : null;
			var made = own ? own.Made.Values(list.Material.Parameters || {}, {Time: scene.Seconds % 3000}) : null;
			var corners = movedValues(list);

			if (tiles)
				made = Object.assign(made || {}, tiles);

			return corners ? Object.assign(made || {}, corners) : made;
		}

		/*
		 * A material with a Vertex (a vertex graph of the Blueprints Service, GLSL written by hand or the URL of a file of it,
		 * with its Parameters) moves the corners of its shape in every pass that draws it, its shadows too: its
		 * blueprintVertex in the place of the empty one of the shaders of copies and of skeletons (the corner in the space of
		 * the model, its normal and uv, the place in the world and the normal it moves). One that cannot be made is told once,
		 * and the shape is drawn as it is.
		 */
		function vertexed (material) {
			var hook = 'void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}';
			var graph;
			var own;
			var made;

			if (!material || !material.Vertex) return null;

			graph = engine.Written(material.Vertex, 'vertex');

			if (graph === null) return null;

			gpu.Vertexed = gpu.Vertexed || new WeakMap();
			own = gpu.Vertexed.get(material);

			if (own && own.Source === material.Vertex) return own.Made ? own : null;

			own = {Source: material.Vertex, Made: null, Vertices: {}, Programs: {}};

			gpu.Vertexed.set(material, own);

			try {
				made = self.$Service('Blueprints').Compile(graph);

				if (made.Type !== 'vertex')
					throw new Error('a ' + made.Type + ' graph is no vertex graph');

				['Instanced', 'Skinned'].forEach(function (host) {
					var lines = made.Uniforms.filter(function (uniform) {
						return shaders[host].indexOf(' ' + uniform.Name + ';') === -1;
					}).map(function (uniform) {
						return 'uniform ' + uniform.Type + ' ' + uniform.Name + ';';
					}).concat(made.Needs.filter(function (need) {
						return shaders[host].indexOf(graphics.Chunks[need]) === -1;
					}).map(function (need) {
						return graphics.Chunks[need];
					}));

					own.Vertices[host] = self.$Service('BlueprintShaders').Lined(shaders[host].replace(hook, function () {
						return lines.concat([made.Function]).join('\n');
					}));
				});

				if (!shaderChecked('vertex', material.Name || '', made, own.Vertices.Instanced, shaders.Pbr) || !shaderChecked('vertex', material.Name || '', made, own.Vertices.Skinned, shaders.Pbr)) {
					own.Vertices = {};

					return null;
				}

				own.Made = made;
			}
			catch (error) {
				shaderTold('vertex', material.Name || '', [{Block: null, Line: 0, Message: error.message}], error.message, 'Elemenx Scene: the Vertex of material ' + (material.Name || '') + ' cannot be made: ' + error.message);

				return null;
			}

			return own;
		}

		/* The program of a pass for a list: base, or the shader of the pass (fragment) over the corners its material moves. */
		function moved (list, base, fragment, source) {
			var own = list.Material ? vertexed(list.Material) : null;
			var key = fragment + (source ? ':own' : '') + (list.Skinned ? ':skinned' : '');

			if (!own)
				return base;

			own.Programs[key] = own.Programs[key] || renderer.Program(own.Vertices[list.Skinned ? 'Skinned' : 'Instanced'], source || shaders[fragment]);

			return own.Programs[key];
		}

		/* The uniforms of the wind of the scene and of the Vertex of the material of a list. */
		function movedValues (list) {
			var own = list.Material ? vertexed(list.Material) : null;

			return Object.assign({}, self.WindValues(scene.Seconds), own ? own.Made.Values(list.Material.Parameters || {}, {Time: scene.Seconds % 3000}) : null);
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
			var base = math.Multiply(object.Turn || math.Identity(), math.Scaling(scale[0], scale[1], scale[2]));
			var color = paint(settings.Color || (made ? '#ffffff' : '#c8ccd4')).slice(0, 3);
			var team = paint(teamColor(object.Team)).slice(0, 3);
			/* Dissolving (Teleport): a list of its own, with how far it has gone. */
			var dissolve = object.Dissolve && object.Dissolve.Amount > 0 ? object.Dissolve : null;
			var dissolving = dissolve ? 'dissolve:' + object.ID + ':' : '';
			var pose;
			var plain;
			var rig;

			if (!made && library.Has(nameOf(object, settings))) return;

			if (!made) {
				plain = object.Team ? 0.35 : 0;

				batch(models, (still ? 'still:' : '') + settings.Shape, object.World, base, [color[0] * (1 - plain) + team[0] * plain, color[1] * (1 - plain) + team[1] * plain, color[2] * (1 - plain) + team[2] * plain], {Rough: 0.15, Still: still, Geometry: still ? shapeGeometry(settings.Shape) : null});

				return;
			}

			if (made.Type === 'ship' && object.Team)
				color = [color[0] * 0.65 + team[0] * 0.35, color[1] * 0.65 + team[1] * 0.35, color[2] * 0.65 + team[2] * 0.35];

			/* What moves on it (a vehicle, the roles of the parts of its model): its pieces cut once, again when its rig is another. */
			rig = engine.RigOf(object);

			if (rig && (!object.Wheels || object.RigCut !== rig || object.RigModel !== made)) {
				engine.OpeningsOf(made, rig);

				if (object.Values.Vehicle)
					engine.MirrorsOf(made, object.Values.Vehicle);

				object.Wheels = engine.WheelsOf(made, rig);
				object.RigCut = rig;
				object.RigModel = made;
			}

			pose = (made.Pieces.length > 1 || made.Moves) && !still ? poseOf(object, made, settings) : null;
			object.Worn = made.Asset;

			if (object.ID === scene.Hero && scene.Inside > 0.01 && pose && object.Clip && !object.Values.Vehicle) {
				var headBone = library.BoneMatrix(made, 'Head', object.Clip.Name, clipMoment(object.Clip));

				object.Head = headBone ? math.Apply(base, [headBone[12], headBone[13], headBone[14]]) : null;
			}

			if (pose && object.Values.Hold)
				gatherHeld(models, object, made, base);

			if (object.Values.Vehicle && object.Values.Vehicle.Mounts)
				gatherMounts(models, object, base);

			joinedOf(object, made).forEach(function (piece) {
				if (made.Asset) {
					var rest = pose && !piece.Joined ? pose[piece.ID] : piece.Rest;
					var wheel = piece.Joined ? piece.Wheel : object.Wheels ? object.Wheels[piece.ID] : null;
					var shifted = piece.Opening ? engine.OpeningMove(object, piece) : null;
					var whole = shifted ? math.Multiply(base, shifted) : base;
					var lit = piece.Opening ? engine.LampGlow(object, piece) : null;

					/* The glass of a mirror of the car that is driven shows its picture (MirrorKey): its own list, of that car alone. */
					var reflecting = piece.Mirror !== undefined && object.ID === scene.Hero ? 'car:' + object.ID + ':' + piece.Mirror : '';

					batch(models, (still ? 'still:' : '') + dissolving + made.Key + '/' + piece.ID + (reflecting ? '@' + object.ID : ''), object.World, piece.Skin !== -1 ? whole : math.Multiply(whole, wheel ? math.Multiply(engine.WheelTurn(object, wheel), rest) : rest), color, {Rough: 0, Geometry: piece.Geometry, Still: still, Material: piece.Material, Asset: made.Asset, Skinned: piece.Skin !== -1 ? made : null, Offset: piece.JointOffset, Frames: piece.Skin !== -1 ? object.Frames || [0, 0, 0, 0] : null, Soft: softOf(object, made, piece), Glow: object.Glow && object.Glow.Body ? object.Glow.Color : lit, Lit: !!lit && !(object.Glow && object.Glow.Body), Wet: object.Values.Wet, Drops: object.Values.Drops, MirrorKey: reflecting, Dissolve: dissolve});

					return;
				}

				/* A part of a model of shapes moves as its role says, as one of a file does; one of a material is drawn by its pattern (Regression: its material was not given, and it came out plain). */
				var moved = piece.Opening ? engine.OpeningMove(object, piece) : null;
				var placed = moved ? math.Multiply(base, moved) : base;

				batch(models, (still ? 'still:' : '') + dissolving + made.Key + '/' + piece.ID, object.World, pose ? math.Multiply(placed, pose[piece.ID]) : placed, piece.Team ? team : color, {Matte: made.Matte, Rough: made.Matte ? 0.5 : 0.15, Sway: made.Sway, Geometry: piece.Geometry, Material: piece.Material || null, Still: still, Glow: object.Glow && object.Glow.Body ? object.Glow.Color : null, Wet: object.Values.Wet, Drops: object.Values.Drops, Dissolve: dissolve});
			});
		}

		/*
		 * The pieces of a model of a file as they are drawn: those that move together (all that stands still, each wheel, each
		 * side of an opening or a lamp) as one for each material, made once. A car of a file of thousands of meshes was thousands
		 * of draws a frame, again in its shadow and in its mirrors. A model that plays clips, or Merge: false, keeps its pieces.
		 */
		function joinedOf (object, made) {
			var wheels = object.Wheels || {};
			var vehicle = object.Values.Vehicle || {};
			var key = made.Pieces.length + ':' + Object.keys(wheels).length + ':' + (vehicle.Wheels || '') + ':' + (vehicle.Held || '');
			var groups = {};
			var order = [];
			var materials = [];
			var kept;

			if (!made.Asset || made.Moves || Object.keys(made.Clips || {}).length || made.Merge === false || object.Values.Merge === false || made.Pieces.length < 2) return made.Pieces;

			made.Joined = made.Joined || {};

			if (made.Joined[key])
				return made.Joined[key];

			made.Pieces.forEach(function (piece) {
				var wheel = wheels[piece.ID];
				var material = materials.indexOf(piece.Material);
				var group;
				var name;

				if (material < 0) {
					material = materials.length;

					materials.push(piece.Material);
				}

				name = piece.Skin !== -1 ? 'own:' + piece.ID : (wheel ? 'wheel:' + wheel.Corner + ':' + (wheel.Held ? 1 : 0) : piece.Opening ? 'open:' + piece.Opening + ':' + (piece.Side || 1) : 'still') + (piece.Mirror !== undefined ? ':mirror-' + piece.Mirror : '') + ':' + material;
				group = groups[name];

				if (!group) {
					group = groups[name] = {Pieces: [], Wheel: wheel || null};

					order.push(name);
				}

				group.Pieces.push(piece);
			});

			kept = order.map(function (name, index) {
				var group = groups[name];
				var first = group.Pieces[0];

				if (group.Pieces.length === 1) return first;

				return Object.assign({}, first, {ID: 'joined-' + index, Joined: true, Wheel: group.Wheel, Node: undefined, Rest: math.Identity(), Placed: null, Geometry: joinedGeometry(group.Pieces)});
			});

			made.Joined[key] = kept;

			return kept;
		}

		/* The geometry of pieces as one, each in the place of its rest: only the corners their triangles use. */
		function joinedGeometry (pieces) {
			var corners = 0;
			var triangles = 0;
			var colors = 0;
			var positions;
			var normals;
			var uvs;
			var tints;
			var indices;
			var at = 0;
			var write = 0;

			pieces.forEach(function (piece) {
				var geometry = piece.Geometry;
				var count = geometry.Positions.length / 3;

				corners += Math.min(count, geometry.Indices.length);
				triangles += geometry.Indices.length;

				if (geometry.Colors && geometry.Colors.length)
					colors = Math.max(colors, geometry.Colors.length / count);
			});

			positions = new Float32Array(corners * 3);
			normals = new Float32Array(corners * 3);
			uvs = new Float32Array(corners * 2);
			tints = colors ? new Float32Array(corners * colors) : null;
			indices = new Uint32Array(triangles);

			pieces.forEach(function (piece) {
				var geometry = piece.Geometry;
				var m = piece.Rest;
				var n = math.NormalMatrix(m);
				var p = geometry.Positions;
				var q = geometry.Normals || [];
				var u = geometry.UVs || [];
				var c = geometry.Colors || [];
				var own = c.length ? c.length / (p.length / 3) : 0;
				var places = {};
				var j;

				geometry.Indices.forEach(function (index) {
					var x;
					var y;
					var z;
					var turned;
					var length;

					if (places[index] === undefined) {
						places[index] = at;
						x = p[index * 3];
						y = p[index * 3 + 1];
						z = p[index * 3 + 2];

						positions[at * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
						positions[at * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
						positions[at * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];

						x = q[index * 3] || 0;
						y = q[index * 3 + 1] || 0;
						z = q[index * 3 + 2] || 0;
						turned = [n[0] * x + n[3] * y + n[6] * z, n[1] * x + n[4] * y + n[7] * z, n[2] * x + n[5] * y + n[8] * z];
						length = Math.sqrt(turned[0] * turned[0] + turned[1] * turned[1] + turned[2] * turned[2]) || 1;

						normals[at * 3] = turned[0] / length;
						normals[at * 3 + 1] = turned[1] / length;
						normals[at * 3 + 2] = turned[2] / length;
						uvs[at * 2] = u[index * 2] || 0;
						uvs[at * 2 + 1] = u[index * 2 + 1] || 0;

						for (j = 0; tints && j < colors; j++)
							tints[at * colors + j] = own ? (j < own ? c[index * own + j] : 1) : 1;

						at++;
					}

					indices[write++] = places[index];
				});
			});

			return {Positions: positions.subarray(0, at * 3), Normals: normals.subarray(0, at * 3), UVs: uvs.subarray(0, at * 2), Colors: tints ? tints.subarray(0, at * colors) : [], Indices: indices};
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
				var place = math.Multiply(base, math.Multiply(math.Translation(at[0], at[1], at[2]), math.Multiply(math.Multiply(math.Rotation([0, 1, 0], turn[1] * degrees), math.Multiply(math.Rotation([1, 0, 0], turn[0] * degrees), math.Rotation([0, 0, 1], turn[2] * degrees))), math.Scaling(size, size, size))));

				item.Pieces.forEach(function (piece) {
					if (item.Asset) {
						batch(models, item.Key + '/' + piece.ID, object.World, math.Multiply(place, piece.Rest), [1, 1, 1], {Rough: 0, Geometry: piece.Geometry, Material: piece.Material, Asset: item.Asset, Soft: 0});

						return;
					}

					batch(models, item.Key + '/' + piece.ID, object.World, place, [1, 1, 1], {Matte: item.Matte, Rough: item.Matte ? 0.5 : 0.15, Geometry: piece.Geometry, Material: piece.Material || null});
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
				bone = math.Multiply(bone, library.GripTurn(made, hold.Bone || 'HandR', hold.Aim));

			place = math.Multiply(math.Translation(at[0], at[1], at[2]), math.Multiply(math.Rotation([0, 0, 1], turn[2] * degrees), math.Multiply(math.Rotation([0, 1, 0], turn[1] * degrees), math.Multiply(math.Rotation([1, 0, 0], turn[0] * degrees), math.Scaling(size, size, size)))));
			place = math.Multiply(base, math.Multiply(bone, place));

			item.Pieces.forEach(function (piece) {
				batch(models, item.Key + '/' + piece.ID, object.World, math.Multiply(place, piece.Rest), [1, 1, 1], {Rough: 0, Geometry: piece.Geometry, Material: piece.Material, Asset: item.Asset, Skinned: null, Offset: piece.JointOffset, Frames: null, Glow: object.Glow && object.Glow.Held ? object.Glow.Color : null, Wet: object.Values.Wet, Drops: object.Values.Drops});
			});
		}

		/* A copy of a shape for the one draw of all of them: its place relative to the eye, its axes, its colors. */
		function batch (models, name, world, matrix, color, options) {
			var list = models[name];
			var m = matrix;
			var settings = options || {};
			var at = settings.Still ? world : local(world);
			var i;

			/* An outline: a list of its own, of the same shape, in the colour of the outline. */
			if (scene.Outlining && models === scene.OutlineLists && name.indexOf('outline:') !== 0) {
				batch(models, 'outline:' + name, world, matrix, scene.Outlining.Color, Object.assign({}, settings, {Glow: null, Still: false, Geometry: settings.Geometry || shapeGeometry(name)}));

				return;
			}

			/* What glows is drawn once more, apart: its light added over it (Glow, the color of its light). */
			if (settings.Glow && !settings.Still)
				batch(scene.GlowLists, (settings.Lit ? 'lit:' : 'glow:') + name, world, matrix, settings.Glow, Object.assign({}, settings, {Glow: null}));

			if (!list) {
				list = models[name] = {Count: 0, Capacity: 0, Matte: !!settings.Matte, Rough: settings.Rough || 0, Geometry: settings.Geometry || null, Still: !!settings.Still, Material: settings.Material || null, Asset: settings.Asset || null, Skinned: settings.Skinned || null, Offset: settings.Offset || 0, Soft: settings.Soft || 0, Flat: !!settings.Lit, MirrorKey: settings.MirrorKey || ''};
			}

			if (list.Count === list.Capacity)
				grow(list);

			/* A body that is beamed away or comes (Teleport): drawn apart, dissolving. */
			list.Dissolve = settings.Dissolve || null;

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
			var matrix = math.Multiply(math.Orthographic(-extent, extent, -extent, extent, 0, depth * 2), math.LookAt(vectors.Add(target, vectors.Scale(direction, depth)), target, up));

			var nearMap = near ? gpu.ShadowClose = gpu.ShadowClose || renderer.Shadow(side) : null;

			if (!near && (!gpu.ShadowMap || gpu.ShadowMap.Size !== side))
				gpu.ShadowMap = renderer.Shadow(side);

			(nearMap || gpu.ShadowMap).Begin();

			casters(matrix);

			(nearMap || gpu.ShadowMap).End();

			return {uShadowMap: nearMap || gpu.ShadowMap, uShadowNear: nearMap || gpu.ShadowMap, uShadowRaw: (nearMap || gpu.ShadowMap).Raw, uShadowNearRaw: (nearMap || gpu.ShadowMap).Raw, uShadowSoft: [depth * side * sunWidth / extent, depth * side * sunWidth / extent, self.Graphics().Cascades > 1 ? 1 : 0], uBounce: gpu.NoBounce, uCloudMap: gpu.NoBounce, uBounceOn: 0, uGlow: gpu.NoBounce, uGlowOn: 0, uProbeOn: 0, uProbe: gpu.NoBounce, uLampShadow0: gpu.NoShadow, uLampShadow1: gpu.NoShadow, uShadowMatrix: matrix, uShadowBias: texel * 1.6, uShadowOn: 1, uCascadeOn: 0};
		}

		/*
		 * Four shadows of the sun, each of a slice of the view out to far, farther ones wider, in the quarters of one map.
		 * A slice is held in a ball whose size keeps as the eye turns, its middle kept to whole texels of the world: no edge
		 * crawls. The two near ones are drawn each frame, the third each second, the last each fourth; between, what they
		 * hold is kept where it was in the world, and only the eye it is seen from moves.
		 */
		function cascades (direction, depth, far, casters) {
			var camera = scene.Camera;
			var side = 2048;
			var aspect = renderer.Width / Math.max(1, renderer.Height);
			var tangent = Math.tan(camera.Fov * Math.PI / 360);
			var spread = tangent * tangent * (1 + aspect * aspect);
			var forward = vectors.Normalize(vectors.Subtract(camera.Target, camera.Position));
			var sunWidth = scene.Ground && scene.Ground.Night > 0.5 ? 0.05 : 0.012;
			var up = Math.abs(direction[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
			var x = vectors.Normalize(vectors.Cross(up, direction));
			var y = vectors.Cross(direction, x);
			var near = 0.5;
			var store = scene.Cascaded;
			var splits = [];
			var matrices = new Float32Array(64);
			var soft = [];
			var bias = [];
			var all;
			var i;

			if (!gpu.Cascades)
				gpu.Cascades = renderer.Shadow(side * 2);

			if (!store || store.Far !== far || vectors.Distance(store.Sun, direction) > 0.002) {
				store = scene.Cascaded = {Far: far, Sun: direction.slice(), Frame: 0, Slices: []};
				all = true;
			}

			store.Frame++;

			for (i = 0; i < 4; i++) {
				splits[i] = 0.9 * near * Math.pow(far / near, (i + 1) / 4) + 0.1 * (near + (far - near) * (i + 1) / 4);
			}

			for (i = 0; i < 4; i++) {
				drawn(i, i === 0 ? near : splits[i - 1], splits[i]);
			}

			return {uShadowMap: gpu.Cascades, uShadowNear: gpu.Cascades, uShadowRaw: gpu.Cascades.Raw, uShadowNearRaw: gpu.Cascades.Raw, uShadowSoft: [soft[3], soft[0], 1], uBounce: gpu.NoBounce, uCloudMap: gpu.NoBounce, uBounceOn: 0, uGlow: gpu.NoBounce, uGlowOn: 0, uProbeOn: 0, uProbe: gpu.NoBounce, uLampShadow0: gpu.NoShadow, uLampShadow1: gpu.NoShadow, uShadowMatrix: Array.prototype.slice.call(matrices, 32, 48), uShadowBias: bias[2], uShadowOn: 1, uCascadeOn: 1, uCascades: matrices, uCascadeSplits: splits, uCascadeSoft: soft, uCascadeBias: bias};

			/* A slice from a to b: its ball, its view of the sun from where it was last drawn, drawn again when its turn comes. */
			function drawn (index, a, b) {
				var middle = 0.5 * (a + b) * (1 + spread);
				var radius;
				var texel;
				var center;
				var along;
				var across;
				var slice = store.Slices[index];
				var target;
				var matrix;

				if (middle >= b) {
					middle = b;
					radius = b * Math.sqrt(spread);
				}
				else {
					radius = Math.sqrt((b - middle) * (b - middle) + b * b * spread);
				}

				/* Whole quarter metres: a little zoom does not change the size of a texel. */
				radius = Math.ceil(radius * 4) / 4;
				texel = radius * 2 / side;

				if (all || !slice || slice.Radius !== radius || index === 2 && store.Frame % 2 === 0 || index === 3 && store.Frame % 4 === 1 || index < 2) {
					center = vectors.Add(scene.Eye, vectors.Scale(forward, middle));
					along = vectors.Dot(center, x);
					across = vectors.Dot(center, y);
					slice = store.Slices[index] = {Radius: radius, Center: vectors.Add(vectors.Add(center, vectors.Scale(x, Math.round(along / texel) * texel - along)), vectors.Scale(y, Math.round(across / texel) * texel - across)), Draw: true};
				}

				target = vectors.Subtract(slice.Center, scene.Eye);
				matrix = math.Multiply(math.Orthographic(-radius, radius, -radius, radius, 0, Math.max(depth, radius) * 2), math.LookAt(vectors.Add(target, vectors.Scale(direction, Math.max(depth, radius))), target, up));

				if (slice.Draw) {
					gpu.Cascades.Begin([index % 2 * side, Math.floor(index / 2) * side, side, side]);

					casters(matrix);

					gpu.Cascades.End();

					slice.Draw = false;
				}

				matrices.set(matrix, index * 16);

				soft[index] = Math.max(depth, radius) * side * sunWidth / radius;
				bias[index] = texel * 1.6;
			}
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
				renderer.Draw(shape(name), moved(scene.StillLists[name], gpu.TopMany, 'Top'), Object.assign({uViewProjection: matrix, uOrigin: [0, 0, 0], uWind: 0}, movedValues(scene.StillLists[name])), {Cull: 'none'});
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
						renderer.Draw(shape(name), moved(models[name], gpu.BounceMany, 'Bounced'), Object.assign({uViewProjection: shade.uShadowMatrix, uWind: 0, uOrigin: originOf(models[name]), uSun: ground.Sun, uSunColor: ground.SunColor}, movedValues(models[name])), {Cull: 'back'});
				});

				gpu.Bounce.End();
			}

			shade.uBounce = gpu.Bounce.Textures[0];
			shade.uBounceOn = 1;

			return shade;
		}

		/* No shadow: the samplers still need textures of their own kinds. */
		/* The lights of the settlements of a body painted (paintLights), else none. */
		function lightsOf (object) {
			var made = scene.Baked[object.ID];

			return made && made.Lights ? made.Lights : noLights();
		}

		/* No lights of settlements: a cube of black. */
		function noLights () {
			gpu.NoLights = gpu.NoLights || renderer.Cube(1);

			return gpu.NoLights;
		}

		function idle () {
			if (!gpu.NoShadow) {
				gpu.NoShadow = renderer.Shadow(1);
				gpu.NoBounce = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([0, 0, 0, 255])}, {Nearest: true});
			}

			return {uShadowOn: 0, uShadowMap: gpu.NoShadow, uShadowNear: gpu.NoShadow, uShadowRaw: gpu.NoBounce, uShadowNearRaw: gpu.NoBounce, uShadowSoft: [0, 0, 0], uBounce: gpu.NoBounce, uCloudMap: gpu.NoBounce, uBounceOn: 0, uGlow: gpu.NoBounce, uGlowOn: 0, uProbeOn: 0, uProbe: gpu.NoBounce, uLampShadow0: gpu.NoShadow, uLampShadow1: gpu.NoShadow, uCascadeOn: 0};
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
			var aimed;

			/*
			 * A map of its own for the hero (the one Control gives the keys, on foot or in what it drives), else the model in the
			 * focus, while near the eye: its square round it, a few metres, a texel of millimetres: the folds of its clothes, its
			 * arms on its body, the arches over the wheels.
			 */
			function heroShadowed () {
				var object = scene.Objects[scene.Hero] || (scene.Focus ? scene.Objects[scene.Focus] : null);
				var size;

				/* scene.Tuned.Hero false: none, to see the picture without it. */
				if (!object || !object.World || !trait(object, 'Model') || vectors.Distance(object.World, scene.Eye) > 80 || scene.Tuned && scene.Tuned.Hero === false) return null;

				size = Math.max(0.5, Number(object.Size) || 1);

				return {Center: [object.World[0], object.World[1] + size * 0.4, object.World[2]], Extent: Math.max(2.5, Math.min(8, size * 1.4))};
			}

			function casters (matrix) {
				Object.keys(models).forEach(function (name) {
					var list = models[name];
					/* Light goes through glass. */
					if (list.Material && list.Material.Transmission && seeThrough(list.Material)) return;

					renderer.Draw(shape(name), moved(list, list.Skinned ? gpu.SkinDepth : gpu.ManyDepth, 'Depth'), Object.assign({uViewProjection: matrix, uWind: scene.Gust || 0, uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : undefined, uJointOffset: list.Offset}, movedValues(list)), {Cull: 'none'});
				});

				(nodes || []).forEach(function (node) {
					renderer.Draw(node.Mesh, gpu.LandDepth, {uViewProjection: matrix, uOffset: vectors.Subtract(node.Center, scene.Eye)}, {Cull: 'back'});
				});

				engine.ScatterShadow(matrix);
			}

			scene.Casters = casters;

			/*
			 * The same in their colors, for a slab of the voxels of the light of probes (SceneProbes): the ground, what stands
			 * still and what grows; what moves (what has a skeleton, a car) is gone from there at once: it gets light, it leaves none on the walls.
			 */
			/*
			 * The normals the models of files are drawn by (what is glossy: paint, metal, glass), for the reflections of the screen
			 * (SceneLighting): into a target of their own over the depth of the scene, where they are seen; the rest takes its
			 * normal from the depth. Not a second color of the scene: the graphics card made each program again for that.
			 */
			scene.Normals = function () {
				var matrix = scene.NormalsMatrix;
				if (!matrix) return;

				if (!gpu.NormalMany) {
					gpu.NormalMany = renderer.Program(shaders.Instanced, shaders.Normal);
					gpu.NormalSkin = renderer.Program(shaders.Skinned, shaders.Normal);
				}

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					if (!list.Material || list.Material.Transmission && seeThrough(list.Material)) return;

					renderer.Draw(shape(name), moved(list, list.Skinned ? gpu.NormalSkin : gpu.NormalMany, 'Normal'), Object.assign({uViewProjection: matrix, uWind: scene.Gust || 0, uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : undefined, uJointOffset: list.Offset}, movedValues(list)), {Cull: 'none', Depth: true, DepthWrite: false});
				});
			};

			scene.Voxels = function (matrix) {
				if (!gpu.VoxelLand) {
					gpu.VoxelLand = renderer.Program(shaders.LandVertex, shaders.Voxel);
					gpu.VoxelMany = renderer.Program(shaders.Instanced, shaders.Voxel);
				}

				(nodes || []).forEach(function (node) {
					/* A square far from the eye has nothing in the voxels (some 45 m round it). */
					if (vectors.Distance(node.Center, scene.Eye) > 120) return;

					renderer.Draw(node.Mesh, gpu.VoxelLand, {uViewProjection: matrix, uOffset: vectors.Subtract(node.Center, scene.Eye)}, {Cull: 'none', Depth: false, DepthWrite: false});
				});

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					if (list.Skinned || !list.Still || list.Material && list.Material.Transmission && seeThrough(list.Material)) return;

					renderer.Draw(shape(name), moved(list, gpu.VoxelMany, 'Voxel'), Object.assign({uViewProjection: matrix, uWind: 0, uOrigin: originOf(list)}, movedValues(list)), {Cull: 'none', Depth: false, DepthWrite: false});
				});

				if (engine.ScatterVoxels)
					engine.ScatterVoxels(matrix, shaders.Voxel);
			};

			if (!shadowsWanted()) return off;

			if (ground) {
				if (ground.Sun[1] < 0.04) return off;

				/* A location needs room: past the map of the shadows nothing is in shadow, and its edge shows as a square. */
				extent = Math.max(ground.Field.Whole ? ground.Field.Blocked ? Math.max(90, ground.Field.Size * 0.55) : 8 : 30, Math.min(ground.Field.Size, scene.Distance * 1.5));
				set = self.Graphics();
				/* Four cascades out to its far shadow, but in parallel rays (a view from above: one map). */
				made = set.Cascades >= 4 && !scene.Camera.Ortho ? cascades(ground.Sun, Math.max(60, ground.Field.Top * 2), Math.min(set.ShadowFar || 300, scene.Camera.Far || 5000), casters) : castShadow(ground.Sun, ground.Target, scene.Eye, extent, Math.max(extent * 2, ground.Field.Top * 4), casters);

				if (set.Cascades > 1 && !made.uCascadeOn) closer(made, ground.Sun, ground.Target, scene.Eye, Math.min(extent * 0.3, 30), Math.max(extent * 2, ground.Field.Top * 4), casters);
				else if (made.uCascadeOn && (aimed = heroShadowed())) closer(made, ground.Sun, aimed.Center, scene.Eye, aimed.Extent, Math.max(60, ground.Field.Top * 2), casters);

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
				renderer.Draw(one.Mesh, gpu.Line, {uViewProjection: math.Multiply(matrix, math.Scaling(far, far, far)), uOffset: vectors.Scale(local([0, 0, 0]), 1 / far), uBody: [0, 0, 0, 0], uColor: one.Color}, {Blend: 'alpha', Depth: false, DepthWrite: false});
			});
		}

		/* The colliders as their outlines, for the editor: made again when they change. */
		function drawColliders (matrix) {
			var lines = engine.ColliderLines ? engine.ColliderLines() : [];
			var key = JSON.stringify(lines);

			if (!lines.length) return;

			if (!gpu.ColliderLines || gpu.ColliderKey !== key) {
				if (gpu.ColliderLines)
					gpu.ColliderLines.Destroy();

				gpu.ColliderLines = renderer.Mesh({Positions: [].concat.apply([], lines), Indices: []}, 'lines');
				gpu.ColliderKey = key;
			}

			renderer.Draw(gpu.ColliderLines, gpu.Line, {uViewProjection: matrix, uOffset: local([0, 0, 0]), uBody: [0, 0, 0, 0], uColor: scene.Colors.Collider}, {Blend: 'alpha', DepthWrite: false});
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
					button.className = 'elemenx-scene-label';

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
			t = math.Hit(ray, other.World, other.Size);

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
		 * The ground of the setting terrain: the object of a Terrain trait is a flat map of noise (the Terrain Service) of its World
		 * drawn in squares, the finer the nearer; its water a plane, its sky of its sun (an object of a Sun trait). The
		 * other objects stand on it at X and Y (across and down the map); a Walker walks a way round
		 * the slopes, the sea and the things that block it. The view goes round a point of the ground.
		 */
		/* What the World of a ground makes (SceneWorld.Make), made again only when its graph is another. */
		function worldOf (object) {
			var graph = trait(object, 'Terrain').World || null;

			if (object.WorldGraph !== graph || !object.WorldMade) {
				object.WorldGraph = graph;
				object.WorldMade = self.$Service('SceneWorld').Make(graph);
			}

			return object.WorldMade;
		}

		function groundOf () {
			var object = scene.Roots.filter(function (each) {
				return trait(each, 'Terrain');
			})[0];
			var site = object ? null : scene.Roots.filter(function (each) {
				return trait(each, 'Location');
			})[0];
			var settings;
			var key;
			var world;
			var sketch;
			var sketched;
			var swell = null;
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
			var carvesOf;

			if (site && !locationReady(site))
				site = null;

			/* A ground is what its World makes: with no World, or none that runs, there is none. */
			world = object ? worldOf(object) : null;

			if (object && !world.Ground)
				object = null;

			if (!object && !site) {
				if (scene.Ground)
					dropGround();

				return null;
			}

			/*
			 * Its shape is the land of its World; the look of a ground (its Blueprint and its Parameters) and the waves of its sea
			 * are not its shape: they make no other ground. The sketch over it is not its shape either: a change of it makes the
			 * ground again only where it changed. The shape and its text are made once for a World.
			 */
			if (object) {
				swell = {Swell: trait(object, 'Terrain').Swell, Way: trait(object, 'Terrain').SwellWay, Seed: world.Ground.Seed};

				if (!world.Shape) {
					var shape = Object.assign({}, world.Ground);

					delete shape.Sketch;

					world.Shape = {Settings: shape, Key: JSON.stringify(shape)};
				}

				settings = Object.assign({}, world.Shape.Settings);
				sketch = world.Ground.Sketch || null;

				/* What was dug out of it (Dig): carves of its volume, not of its shape; a new one makes it again only round it. */
				if (scene.Digs.length)
					settings.Carves = (settings.Carves || []).concat(scene.Digs);
			}

			/* The roads over a ground of noise: the ground is made level under them. */
			if (settings && !site && engine.RoadsSketch)
				sketch = engine.RoadsSketch(settings, sketch);

			/* Their tunnels: holes cut in the ground, its volume made of them where they go. */
			if (settings && !site && engine.RoadsCarves && engine.RoadsCarves().length)
				settings.Carves = (settings.Carves || []).concat(engine.RoadsCarves());

			/* The buried pipes: what they cut out of it (ScenePiping). */
			if (settings && !site && engine.PipingCarves && engine.PipingCarves().length)
				settings.Carves = (settings.Carves || []).concat(engine.PipingCarves());

			/* What stands on it for good, on level places of their own (a World with the step Footings). */
			if (settings && !site && settings.Footings && engine.FootingsSketch)
				sketch = engine.FootingsSketch(settings, sketch);

			key = site ? 'location:' + site.ID + ':' + site.Values.Model : world.Shape.Key;

			/* The lists of what the roads and the pipes cut out of it: the same lists while they do not change. */
			carvesOf = site ? [] : [engine.RoadsCarves ? engine.RoadsCarves() : null, engine.PipingCarves ? engine.PipingCarves() : null];

			/* Its text, made again only when the sketch or the scene changed: with the roads over it it is long, and this runs every frame. */
			if (!sketch) sketched = '';
			else if (scene.Ground && scene.Ground.SketchOf === sketch && scene.Ground.SketchVersion === scene.Version) sketched = scene.Ground.Sketched;
			else sketched = JSON.stringify(sketch);

			if (!scene.Ground || scene.Ground.Shape !== key) {
				if (scene.Ground)
					dropGround();

				/* Made before it came (PrefetchGround): its field and the squares the eye needs first. */
				var options = site ? null : sketch ? Object.assign({}, settings, {Sketch: sketch}) : settings;
				var ahead = options && scene.Prefetch && scene.Prefetch.Text === JSON.stringify(options) ? scene.Prefetch : null;

				scene.Prefetch = null;
				scene.Ground = {Shape: key, Key: key + sketched + (scene.Digs.length ? '#dug' + scene.Digs.length : ''), Sketched: sketched, Dug: scene.Digs.length, CarvesOf: carvesOf, ID: object ? object.ID : '', Field: site ? locationField(site) : ahead ? ahead.Field : terrain.Flat(options), Nodes: {}, Frame: 0, Keys: {}, Prefetched: ahead ? ahead.Pieces : null};
			}
			else if ((scene.Ground.Sketched !== sketched || scene.Ground.Dug !== scene.Digs.length || !sameCarves(scene.Ground.CarvesOf, carvesOf)) && !site) {
				/* What the tunnels of roads and the pipes cut came or changed: the squares round them made again. */
				scene.Ground.Recarved = carvesBounds(scene.Ground.CarvesOf).concat(carvesBounds(carvesOf));
				scene.Ground.CarvesOf = carvesOf;

				resketch(settings, sketch, sketched);
			}

			scene.Ground.SketchOf = sketch;
			scene.Ground.SketchVersion = scene.Version;

			/* The waves of the sea, wilder in the rain (in steps of a tenth), made again only when its state changes. */
			if (swell)
				swell.Swell = Math.round((number(swell.Swell, 0.35) + (scene.Ground.Air ? scene.Ground.Air.Rain : 0) * 0.5) * 10) / 10;

			if (JSON.stringify(swell) !== scene.Ground.SwellKey) {
				scene.Ground.SwellKey = JSON.stringify(swell);
				scene.Ground.Waves = self.$Service('SceneWaves').Make(swell || {Swell: 0});
			}

			sun = scene.Roots.filter(function (each) {
				return trait(each, 'Sun');
			})[0];
			azimuth = number(sun ? trait(sun, 'Sun').Azimuth : 140, 140) * Math.PI / 180;
			elevation = number(sun ? trait(sun, 'Sun').Elevation : 35, 35) * Math.PI / 180;
			hour = sun ? hourOf(trait(sun, 'Sun').Time, dayHours(trait(sun, 'Sun'))) : null;
			scene.Ground.Hour = hour;

			if (hour !== null) {
				var place = skyPlace(trait(sun, 'Sun'), hour);

				elevation = place[0];
				azimuth = place[1];
			}

			scene.Ground.Sky = skyWay(elevation, azimuth);
			scene.Ground.Sun = scene.Ground.Sky;

			/* The disc of the sun as large as it is seen (Disc of the sun, degrees: the Sun from the Earth, 0.533, by default). */
			scene.Ground.SunRadius = number(sun ? trait(sun, 'Sun').Disc : 0, 0.533) / 2 * Math.PI / 180;

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
			scene.Ground.Night = night;
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

			/*
			 * The northern lights: by themselves far from the equator (55 to 68 degrees of Latitude), at night, under a clear
			 * sky; Aurora of the scene (0 to 1) sets them anywhere, as strong; the day hides them either way.
			 */
			var polar = sun ? number(trait(sun, 'Sun').Latitude, null) : null;
			var asked = number(self.Aurora, null);
			var colors = Array.isArray(self.AuroraColors) ? self.AuroraColors : [];

			scene.Ground.Aurora = (asked === null ? polar === null ? 0 : Math.min(1, Math.max(0, (Math.abs(polar) - 55) / 13)) : Math.max(0, Math.min(2, asked))) * night * (1 - shut) * (1 - Math.min(1, air.Fog));
			scene.Ground.AuroraLow = paint(colors[0] || '#3dff9a').slice(0, 3);
			scene.Ground.AuroraHigh = paint(colors[1] || '#c03cff').slice(0, 3);

			scene.Ground.Season = engine.SeasonNow(sun ? trait(sun, 'Sun') : null);

			/* A rainbow: the weather's (in a light rain, or as it ends), or Rainbow of the scene (0 to 1). */
			scene.Ground.Rainbow = number(self.Rainbow, null) === null ? air.Rainbow || 0 : Math.max(0, Math.min(1, number(self.Rainbow, 0)));
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
		/* Whether two lists of the lists of carves are the same lists (two empty ones, or none, are the same). */
		function sameCarves (a, b) {
			return !!a && !!b && a.length === b.length && a.every(function (one, index) {
				return one === b[index] || !(one && one.length) && !(b[index] && b[index].length);
			});
		}

		/* The squares of the ground [x0, z0, x1, z1] the carves of lists of them touch. */
		function carvesBounds (lists) {
			var made = [];

			(lists || []).forEach(function (list) {
				(list || []).forEach(function (carve) {
					var reach = (Number(carve.Radius) || 2) + 1;
					var box = [Infinity, Infinity, -Infinity, -Infinity];

					(carve.Points || []).forEach(function (point) {
						box = [Math.min(box[0], point[0]), Math.min(box[1], point[1]), Math.max(box[2], point[0]), Math.max(box[3], point[1])];
					});

					if (isFinite(box[0]))
						made.push([box[0] - reach, box[1] - reach, box[2] + reach, box[3] + reach]);
				});
			});

			return made;
		}

		function resketch (settings, sketch, sketched) {
			var ground = scene.Ground;
			var before = ground.Field.Options ? ground.Field.Options.Sketch : null;
			var changed = terrain.SketchChanged(before || null, sketch);

			/* Round what was dug since: the squares there, made again. */
			scene.Digs.slice(ground.Dug || 0).forEach(function (dug) {
				changed.push([dug.At[0] - dug.Radius - 1, dug.At[2] - dug.Radius - 1, dug.At[0] + dug.Radius + 1, dug.At[2] + dug.Radius + 1]);
			});

			ground.Dug = scene.Digs.length;

			(ground.Recarved || []).forEach(function (bounds) {
				changed.push(bounds);
			});

			ground.Recarved = null;

			ground.Field = terrain.Flat(sketch ? Object.assign({}, settings, {Sketch: sketch}) : settings);
			ground.Sketched = sketched;
			/* What was dug is of its key too: what stands and grows there is set again. */
			ground.Key = ground.Shape + sketched + (scene.Digs.length ? '#dug' + scene.Digs.length : '');
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
				var made = meshes.Transform(piece.Placed || piece.Geometry, math.Multiply(math.Scaling(scale, scale, scale), piece.Rest));

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
			if (engine.ScatterBlocked && engine.ScatterBlocked(x, z)) return true;

			/* A collider, as far as a walker is wide. */
			if (engine.ColliderHit && engine.ColliderHit(x, z, null, 0.4)) return true;

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

			/* What has parts that move by their roles (a door, a lamp) is drawn as it stands each frame. */
			if (engine.RigOf && engine.RigOf(object)) return false;

			made = modelOf(object, settings);

			return !made || !Object.keys(made.Clips).length;
		}

		/* Which objects move, after the scene changed: the others stand once. */
		function settle () {
			/* The roles of the parts of the models change what moves too. */
			var key = scene.Version + ':' + (scene.Ground ? scene.Ground.Key : '') + ':' + (engine.RigsVersion ? engine.RigsVersion() : '') + ':' + (scene.Location ? scene.Location.ID : '');
			if (scene.Settled === key) return;

			scene.Settled = key;
			scene.Active = [];
			scene.Still = [];
			scene.StillLists = null;

			/*
			 * A ship down in a location (SceneLanding): what is of space is away (Away), hidden, neither drawn nor met. Only
			 * what it made away it shows again: Hidden is told by others too (the fog of war of GameStrategy).
			 */
			scene.Order.forEach(function (object) {
				var away = !!scene.Location && ofSpace(object);
				if (away === !!object.Away) return;

				object.Away = away;
				object.Hidden = away;
			});

			/* What is away still goes round its star and turns (the sun of a location is where its star is), but is not drawn. */
			scene.Order.forEach(function (object) {
				if (object.Away) {
					scene.Active.push(object);

					return;
				}

				if (scene.Ground && stillOf(object)) scene.Still.push(object);
				else scene.Active.push(object);
			});

			scene.Still.forEach(function (object) {
				object.Turn = math.Identity();

				stand(object);
			});
		}

		/* What is of space: a star, a body, what goes round one or flies there (but the hero), and what is of them. */
		function ofSpace (object) {
			var traits = object.Traits || {};
			var parent = object.Owner || (object.Parent ? scene.Objects[object.Parent] : null);

			if (object.ID === scene.Hero) return false;

			if (traits.Star || traits.Body || traits.Ring || traits.Belt || traits.Orbit || traits.Formation || traits.Mover) return true;

			if (object.Values.Vehicle && object.Values.Vehicle.Kind === 'ship' && object.Values.Vehicle.Around) return true;

			return !!parent && parent !== object && ofSpace(parent);
		}

		/* A thing on the ground: at its X and Y, or along its way at the time of the scene; a road, a barrier, a pipe: its model is of the world itself. */
		function stand (object) {
			var field = scene.Ground.Field;

			if (trait(object, 'Road') || trait(object, 'Barrier') || trait(object, 'Pipe')) {
				object.World = [0, 0, 0];
				object.Position = object.World;
				object.Relative = [0, 0, 0];

				return;
			}

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

			/* The ground under it is noise: not again while it stands. Lift: how high over it (an editor sets it). */
			if (object.StoodX !== x || object.StoodZ !== z || object.StoodLift !== object.Values.Lift || !object.World) {
				object.StoodX = x;
				object.StoodZ = z;
				object.StoodLift = object.Values.Lift;

				/* Z: the floor it is told, where one stands over another. */
				object.World = [x, Math.max(0, field.Height(x, z, object.World ? object.World[1] - (object.Lifted || 0) : object.Values.Z === undefined ? undefined : number(object.Values.Z, 0))), z];

				/* In a pipe, or on one: its floor (ScenePiping). */
				if (engine.PipeFloor && object.World)
					object.World[1] = Math.max(object.World[1], engine.PipeFloor(x, z, object.World[1]));

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
			/* [x, z] or [x, z, y]: y the height of the floor it goes to, where one is over another (a cave under a hill). */
			var target = Array.isArray(point) ? {X: point[0], Z: point[1], Y: point[2]} : {X: number(point.X, 0), Z: number(point.Z !== undefined ? point.Z : point.Y, 0), Y: point.Height};
			var points;
			var lengths = [0];
			var i;

			if (!object || !walker || !field || !object.World) return false;

			points = field.Path({X: object.World[0], Z: object.World[2], Y: object.World[1] - (object.Lifted || 0)}, target, {MaxSlope: number(walker.MaxSlope, 0.45), Step: field.Size / 160, Blocked: function (x, z) {
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

			/* Over the ground, or, of a ground with a volume, in its air (a cave seen through its mouth). */
			function above (at) {
				var p = vectors.Add(ray.Origin, vectors.Scale(ray.Direction, at));

				if (field.Volume)
					return p[1] < 0 && field.Height(p[0], p[2]) < 0 ? p[1] : -field.Density(p[0], p[1], p[2]);

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

			/* The height too: the floor it is, where one is over another. */
			return [point[0], point[2], point[1]];
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

			/* Where it may step: the ground lets it, and no wall of a pipe stands there (ScenePiping). */
			function can (at, on) {
				return (!field.CanStep || field.CanStep(at, on, y)) && !(engine.PipeBlocks && engine.PipeBlocks(at, on, y, hero.Size * 0.15, [hero.Size * 0.3, hero.Size * 0.7]));
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

			var floor = Math.max(0, field.Height(x, z, y), engine.PipeFloor ? engine.PipeFloor(x, z, y) : -Infinity);

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

		/*
		 * The season of the sun (its DayOfYear of YearDays at its Latitude; Season of the scene fixes one): Warmth (-1 the middle
		 * of winter to 1 of summer, little of either near the equator), Rising (the days grow longer), and what it does to plants
		 * and the land: Bare (the part of their leaves the trees that lose them have lost), Turn (how far the leaves turned to the
		 * colors of autumn), Blossom (the flowers of spring), Dry (the grass burnt by the summer), Snow (the snow that lies,
		 * whatever the weather does, where winters are cold).
		 */
		engine.SeasonNow = function (sun) {
			var given = String(self.Season || '').toLowerCase();
			var fixed = {spring: [-0.3, true], summer: [1, true], autumn: [-0.35, false], winter: [-1, false]}[given];
			var latitude = sun ? number(sun.Latitude, null) : null;
			var days = sun ? Math.max(1, number(sun.YearDays, 365)) : 365;
			var day = sun ? number(sun.DayOfYear, 172) : 172;
			var far = latitude === null ? 0.75 : Math.max(0, Math.min(1, (Math.abs(latitude) - 15) / 20));
			var south = latitude !== null && latitude < 0 ? -1 : 1;
			var phase = (day - days * 172 / 365) / days * Math.PI * 2;
			var warmth = fixed ? fixed[0] : Math.cos(phase) * south * far + (1 - far) * 0.6;
			var rising = fixed ? fixed[1] : Math.sin(phase) * south < 0;
			var cold = latitude === null ? 0.7 : Math.max(0, Math.min(1, (Math.abs(latitude) - 30) / 20));
			var smooth = function (a, b, x) {
				var t = Math.max(0, Math.min(1, (x - a) / (b - a)));

				return t * t * (3 - 2 * t);
			};

			return {
				Warmth: warmth,
				Rising: rising,
				Bare: smooth(-0.2, -0.75, warmth),
				Turn: rising ? 0 : smooth(0.45, -0.25, warmth),
				Blossom: rising ? smooth(-0.6, -0.2, warmth) * smooth(0.45, 0.1, warmth) : 0,
				Dry: smooth(0.7, 1, warmth) * 0.3 + (rising ? 0 : smooth(0.3, -0.4, warmth) * 0.4),
				Snow: smooth(-0.55, -0.92, warmth) * cold
			};
		};

		/* The snow that covers things: of the weather, or of the winter. */
		function snowed () {
			var ground = scene.Ground;

			return ground ? Math.max(ground.Air.Cover || 0, ground.Season ? ground.Season.Snow : 0) : 0;
		}

		engine.Snowed = snowed;

		/* What the season does to a model of plants: none (0), its leaves (1: a tree that loses them), only its snow (2: green the year round). */
		engine.SeasonOf = function (name) {
			var models = self.$Service('SceneModels');
			var cache = scene.SeasonKinds = scene.SeasonKinds || {};
			/* The name of a list of draws: [still:]name~variant[/piece]. */
			var base = String(name || '').replace(/^still:/, '').replace(/^dissolve:[^:]*:/, '').split('~')[0];
			var info;

			if (cache[base] !== undefined) return cache[base];

			info = models && models.Has(base) ? models.Info(base) : null;
			cache[base] = !info || info.Type !== 'plant' ? 0 : /pine|fir|spruce|cedar|cypress|palm|cact|juniper|yew|sequoia|redwood|giant/i.test(base) ? 2 : 1;

			return cache[base];
		};

		/* The uniforms of a list dissolving (Teleport): how far, the foot and the height of the body, its color. */
		engine.DissolveValues = function (list) {
			var given = list && list.Dissolve;

			return given ? {uDissolve: [given.Amount, given.Base - (scene.Eye ? scene.Eye[1] : 0), given.Height, given.Seed || 0], uDissolveColor: given.Color || [0.6, 0.85, 1]} : {uDissolve: [0, 0, 1, 0], uDissolveColor: [0, 0, 0]};
		};

		/* The uniforms of the season for a model. */
		engine.SeasonValues = function (name) {
			var season = scene.Ground && scene.Ground.Season;

			return {uSeason: season ? [season.Bare, season.Turn, season.Blossom, season.Dry] : [0, 0, 0, 0], uSeasonOn: season ? engine.SeasonOf(name) : 0};
		};

		/* The steps of a walker on wet ground splash, at the pace of its steps, more running. */
		function puddled (hero, elapsed) {
			var wet = scene.Ground && scene.Ground.Air ? scene.Ground.Air.Wet || 0 : 0;
			var pace = hero.Walking || 0;

			hero.Stepped = (hero.Stepped || 0) + elapsed;

			if (wet < 0.35 || pace < 0.8 || !hero.World || hero.Stepped < Math.max(0.22, 0.6 - pace * 0.06)) return;

			hero.Stepped = 0;

			self.Burst('spray', [hero.World[0], hero.World[1] + 0.05, hero.World[2]], {Aim: [0, 1, 0], Size: Math.min(0.5, 0.12 + pace * 0.04) * Math.min(1, wet * 1.4)});
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

			if (!ground.Target)
				ground.Target = [0, Math.max(0, field.Height(0, 0)), 0];

			/* With a hero the keys walk it, and the view goes after it. */
			if (scene.Hero && scene.Objects[scene.Hero]) {
				if (!engine.VehicleStep(scene.Objects[scene.Hero], keys, elapsed)) {
					walkHero(scene.Objects[scene.Hero], keys, elapsed);

					puddled(scene.Objects[scene.Hero], elapsed);
				}
			}
			else {
				moveView();
			}

			turnKeys(keys, elapsed);

			/* The view eases to what it follows, but holds a hero at once: an easing that lags by the length of a frame shakes it. */
			if (focus && focus.World && keys.Follow !== false)
				ground.Target = scene.Hero === focus.ID ? [focus.World[0], ground.Target[1], focus.World[2]] : vectors.Lerp(ground.Target, focus.World, 1 - Math.exp(-elapsed * 6));

			ground.Target[0] = Math.max(-field.Size / 2, Math.min(field.Size / 2, ground.Target[0]));
			ground.Target[2] = Math.max(-field.Size / 2, Math.min(field.Size / 2, ground.Target[2]));

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

			/*
			 * The floor under the eye comes by steps in a location: the eye goes up and down smoothly. It keeps over the sea,
			 * unless what it looks at is under it (a diver, a wreck): then it goes down to the bed too.
			 */
			floor = field.Water && ground.Target[1] < -0.5 ? field.Height(camera.Position[0], camera.Position[2], ground.Target[1]) + 0.5 : Math.max(0, field.Height(camera.Position[0], camera.Position[2], ground.Target[1])) + (scene.Hero ? 0.15 : 1.5);
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
			scene.Pitch = view === 'top' ? Math.PI / 2 : Math.asin(0.5);

			camera.Ortho = scene.Distance;
			camera.Up = view === 'top' ? [0, 0, -1] : [0, 1, 0];

			camera.Orbit(ground.Target, scene.Yaw, scene.Pitch, far);

			scene.Eye = camera.Position.slice();
			scene.Target = ground.Target.slice();
			camera.Near = 1;
			camera.Far = far * 2;
		}

		/*
		 * A square of a ground of noise asked of a worker (args of SceneTerrainGenerator.Piece): until it comes it is missing, as one not
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

			self.$Service('SceneTerrainGenerator').Work().Run('SceneTerrainGenerator', 'Piece', [shape, field.Options, roads || null, args], function (error, piece) {
				if (scene.Gone || asked[key] !== token) return;

				delete asked[key];

				if (field.Roads !== roads || owner.Field !== field || owner !== scene.Ground && owner !== scene.Surface && owner !== scene.Horizon && !(owner.Globe && scene.Globes[owner.ID] === owner)) return;

				made(error ? null : piece);
			});
		}

		/* The squares of the ground in view, the finer the nearer the eye; each made once, a few a frame. */
		function groundPatches () {
			var ground = scene.Ground;
			var field = ground.Field;
			var wanted = [];
			var missing = [];

			/*
			 * Regression: a square made again at once (the whole ground, its sketch changed) destroyed the mesh of the one it
			 * replaced while that one was still to be drawn in the frame: what was replaced the frame before goes now.
			 */
			(ground.Retired || []).forEach(function (mesh) {
				mesh.Destroy();
			});

			ground.Retired = [];

			/* A map of cells is of one piece. */
			if (field.Whole) {
				ground.Missing = 0;

				if (!ground.Nodes.whole)
					ground.Nodes.whole = {Mesh: renderer.Mesh(field.Chunk()), Center: field.Center, Used: 0};

				ground.Nodes.whole.Used = ++ground.Frame;

				return [ground.Nodes.whole];
			}

			function keyOf (x, z, level) {
				return x.toFixed(3) + ':' + z.toFixed(3) + ':' + level;
			}

			/*
			 * How far the grid of a square (32 cells across) is from the ground it stands for, in metres: the ground at points
			 * between its corners against what the grid makes of them there, the most of nine. Level ground: nothing; a ridge,
			 * a cliff, a cut: much.
			 */
			function errorOf (x, z, size) {
				var cell = size / 32;
				var most = 0;
				var i;

				for (i = 0; i < 9; i++) {
					var gx = Math.floor((i % 3 + 0.5) / 3 * 32);
					var gz = Math.floor((Math.floor(i / 3) + 0.5) / 3 * 32);
					var x0 = x - size / 2 + gx * cell;
					var z0 = z - size / 2 + gz * cell;
					var grid = (field.Height(x0, z0) + field.Height(x0 + cell, z0) + field.Height(x0, z0 + cell) + field.Height(x0 + cell, z0 + cell)) / 4;

					most = Math.max(most, Math.abs(field.Height(x0 + cell / 2, z0 + cell / 2) - grid));
				}

				return most;
			}

			/* The first square at once, the others of noise by a worker; each knows the height of its middle. */
			function build (x, z, size, level) {
				var key = keyOf(x, z, level);
				var ready = ground.Prefetched && !field.Roads ? ground.Prefetched[key] : null;

				/* The one it takes the place of goes when this frame is drawn: it may be among what it draws already. */
				function replace () {
					if (ground.Nodes[key] && ground.Nodes[key].Mesh)
						ground.Retired.push(ground.Nodes[key].Mesh);

					if (ground.Nodes[key] && ground.Nodes[key].Wire)
						ground.Retired.push(ground.Nodes[key].Wire);
				}

				/* Made before the ground came (PrefetchGround). */
				if (ready) {
					delete ground.Prefetched[key];

					replace();

					ground.Nodes[key] = {Mesh: renderer.Mesh(ready), Center: [x, 0, z], Size: size, Top: Math.max(0, field.Height(x, z)), Span: spanOf(ready), Error: errorOf(x, z, size), Used: ground.Frame};

					return;
				}

				if (level && field.Options) {
					askPiece(ground, key, 'Flat', [x, z, size, 32], function (piece) {
						replace();

						var made = piece || field.Chunk(x, z, size, 32);

						ground.Nodes[key] = {Mesh: renderer.Mesh(made), Wire: wired() ? renderer.Mesh({Positions: linesOf(made, false), Indices: []}, 'lines') : null, Center: [x, 0, z], Size: size, Top: Math.max(0, field.Height(x, z)), Span: spanOf(made), Error: errorOf(x, z, size), Used: ground.Frame};
					});

					return;
				}

				replace();

				var first = field.Chunk(x, z, size, 32);

				ground.Nodes[key] = {Mesh: renderer.Mesh(first), Center: [x, 0, z], Size: size, Top: Math.max(0, field.Height(x, z)), Span: spanOf(first), Error: errorOf(x, z, size), Used: ground.Frame};
			}

			/* The lowest and the highest of a square as made ([y, y]): a square on a mountain, a cave under it. */
			function spanOf (made) {
				var low = Infinity;
				var high = -Infinity;
				var i;

				for (i = 1; made && made.Positions && i < made.Positions.length; i += 3) {
					low = Math.min(low, made.Positions[i]);
					high = Math.max(high, made.Positions[i]);
				}

				return low <= high ? [low, high] : null;
			}

			/*
			 * A square gives way to its four parts only when all of them are made: until then it stays, coarser, and there is
			 * never a hole in the ground. Squares in use keep their parents, so going back up needs nothing to be made.
			 */
			var focal = renderer.Height / Math.max(1, renderer.Ratio || 1) / (2 * Math.tan((scene.Camera.Fov || 45) * Math.PI / 360));

			function visit (x, z, size, level) {
				var node = ground.Nodes[keyOf(x, z, level)];
				var half = size / 2;
				/*
				 * Regression: measured to its middle, a large square the eye stood by the corner of was far, stayed coarse, and its
				 * edge with the fine ones beside it showed as a step: to the nearest point of it. Up and down too, from its lowest
				 * to its highest (Regression: measured to the height of its middle, the top of a mountain, a square the eye stood
				 * by in a cave under it was 160 m away, stayed coarse, and the eye saw out of the cave through it).
				 */
				var height = node.Span ? Math.max(node.Span[0], Math.min(node.Span[1], scene.Eye[1])) : node.Top;
				var near = vectors.Distance(scene.Eye, [Math.max(x - half, Math.min(x + half, scene.Eye[0])), height, Math.max(z - half, Math.min(z + half, scene.Eye[2]))]);
				var parts = [[x - half / 2, z - half / 2], [x + half / 2, z - half / 2], [x - half / 2, z + half / 2], [x + half / 2, z + half / 2]];
				var absent;

				node.Used = ground.Frame;

				/*
				 * Of a sketch that changed under it: made again first, drawn as it was meanwhile; asked at every visit until it comes (Regression:
				 * marked asked once, a square a full queue of the workers left out of that frame was never made again).
				 */
				if (node.Stale)
					missing.push({X: x, Z: z, Size: size, Level: level, Near: -1});

				/*
				 * Finer where the eye would see its grid: how far it is from the ground, in pixels of the screen (more than 1.5:
				 * its four parts), down to squares a 256th of the ground; and always near the eye, as near as half its size.
				 */
				/*
				 * And what touches the volume of the ground (a tunnel, a cave) near the eye, till its grid is of a metre: only that
				 * fine is it made of the volume (SceneTerrainGenerator, Chunk), its roof and floor whole.
				 */
				if (level < 8 && (near < size * 0.35 && level < 6 || near < size * 4 && (node.Error || 0) / Math.max(near, 1) * focal > 1.5 || size / 32 > 1 && near < size * 6 && field.Volume && field.Volume.Touches(x - half, z - half, x + half, z + half))) {
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

			/* How many squares the view still waits for (Preparing). */
			ground.Missing = missing.length;

			/*
			 * Its 4 ms counted from here, not from the walk over the squares. Regression: a walk of more than 4 ms (a volume of
			 * many carves to look at) left one square a frame, and the first of them, one already asked of a worker, asked
			 * nothing: the squares of a cave the eye stood in were never made, and it saw out of it through the coarse one.
			 */
			var building = window.performance.now();

			missing.some(function (one) {
				build(one.X, one.Z, one.Size, one.Level);

				return window.performance.now() - building > 4 || field.Options && terrain.Work().Waiting() > 8;
			});

			return wanted;
		}

		/*
		 * A ground about to come (a location beside, SceneLanding): its field made now and the squares an eye at a point of it
		 * needs, made by the workers, kept for it (scene.Prefetch): when it comes, they are there at once. world: its World;
		 * eye: [x, y, z] on it.
		 */
		engine.PrefetchGround = function (world, eye) {
			var made = self.$Service('SceneWorld').Make(world);
			var settings;
			var sketch;
			var options;
			var text;
			var ahead;

			if (!made.Ground || !renderer) return;

			settings = Object.assign({}, made.Ground);
			sketch = settings.Sketch || null;

			delete settings.Sketch;

			if (engine.RoadsSketch)
				sketch = engine.RoadsSketch(settings, sketch);

			if (settings.Footings && engine.FootingsSketch)
				sketch = engine.FootingsSketch(settings, sketch);

			options = sketch ? Object.assign({}, settings, {Sketch: sketch}) : settings;
			text = JSON.stringify(options);
			ahead = scene.Prefetch;

			if (!ahead || ahead.Text !== text)
				ahead = scene.Prefetch = {Text: text, Field: terrain.Flat(options), Pieces: {}, Asked: {}};

			if (ahead.Field.Whole) return;

			/* As groundPatches goes down to the eye: each square near enough asks for its four parts. */
			(function visit (x, z, size, level) {
				var half = size / 2;
				var near = vectors.Distance(eye, [x, Math.max(0, ahead.Field.Height(x, z)), z]);
				if (level >= 6 || near >= size * 1.4) return;

				[[x - half / 2, z - half / 2], [x + half / 2, z - half / 2], [x - half / 2, z + half / 2], [x + half / 2, z + half / 2]].forEach(function (part) {
					var key = part[0].toFixed(3) + ':' + part[1].toFixed(3) + ':' + (level + 1);

					if (!ahead.Asked[key]) {
						ahead.Asked[key] = true;

						terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', options, null, [part[0], part[1], half, 32]], function (error, piece) {
							if (!error && piece)
								ahead.Pieces[key] = piece;
						});
					}

					visit(part[0], part[1], half, level + 1);
				});
			})(0, 0, ahead.Field.Size, 0);
		};

		/* The water, over all else: it shows what was drawn before it, mirrored and through it. */
		function drawSea (matrix, posted) {
			var ground = scene.Ground;
			var field = ground.Field;
			var fog = scene.Camera.Ortho || posted ? 1e9 : field.Size * 0.9;
			var seen = posted ? engine.PostMiddle() : null;

			var waters = sketchWaters(ground);
			var values = Object.assign({uViewProjection: matrix, uSun: ground.Sun, uSunColor: ground.SunColor, uAir: [0.55, 0.72, 1, 0.95], uFog: fog, uSeen: seen ? seen.Color : gpu.NoBounce, uSeenDepth: seen ? seen.Depth : gpu.NoBounce, uSeenInverse: math.Invert(matrix), uMirror: seen ? 1 : 0, uPlanar: gpu.NoBounce, uPlanarOn: 0, uEyeUnder: ground.Under ? 1 : 0, uEye: scene.Eye, uTime: scene.Seconds, uDay: ground.Day * (1 - ground.Cover * ground.Cover * 0.5), uWild: 1 + ground.Air.Rain * 0.9, uFlow: 0}, self.WaterValues(scene.Seconds));

			/* The rivers and the lakes of a sketch: the same water, calmer, where they lie. */
			if (waters)
				renderer.Draw(waters, gpu.Sea, Object.assign({}, values, {uModel: math.Translation(-scene.Eye[0], -scene.Eye[1], -scene.Eye[2]), uWaves: 0, uWild: 0.45 + ground.Air.Rain * 0.5, uFlow: 1}), {Blend: 'veil', Cull: 'none'});

			if (!field.Water) return;

			/* The sea: the grid round the eye, as far as the plane of water reached (field.Size * 1.6 across), its waves on it. */
			if (!gpu.SeaGrid || gpu.SeaGrid.Reach !== field.Size * 1.15) {
				if (gpu.SeaGrid)
					gpu.SeaGrid.Destroy();

				gpu.SeaGrid = seaGrid(field.Size * 1.15);
			}

			var floor = seaFloor(ground);
			/* The world mirrored by the level of the sea, at high and ultra (mirrorsOf). */
			var planar = gpu.Mirrors && gpu.Mirrors.sea && gpu.Mirrors.sea.Drawn ? gpu.Mirrors.sea : null;

			renderer.Draw(gpu.SeaGrid, gpu.Sea, Object.assign({}, values, self.$Service('SceneWaves').Values(ground.Waves, scene.Seconds), {uModel: math.Identity(), uWaves: 1, uFloor: floor || gpu.NoBounce, uFloorSize: [field.Size, floor ? 256 : 0], uPlanar: planar ? planar.Textures[0] : gpu.NoBounce, uPlanarOn: planar ? 1 : 0, uBound: [field.Size / 2, scene.Horizon ? 1 : 0]}), {Blend: 'veil', Cull: 'none'});
		}

		/*
		 * The grid of a sea round the eye: rings each a little wider than the one inside it (a corner every half unit near
		 * the eye, wide far off), out to reach, and a fan in the middle.
		 */
		function seaGrid (reach) {
			var made = {Positions: [0, 0, 0], Normals: [0, 1, 0], UVs: [0, 0], Colors: [0, 0, 0], Indices: []};
			var sectors = 192;
			var radii = [];
			var radius = 0.5;
			var mesh;
			var i;
			var s;

			while (radius < reach) {
				radii.push(radius);

				radius *= 1.045;
			}

			radii.push(reach);

			radii.forEach(function (r) {
				for (s = 0; s < sectors; s++) {
					made.Positions.push(Math.cos(s / sectors * Math.PI * 2) * r, 0, Math.sin(s / sectors * Math.PI * 2) * r);
					made.Normals.push(0, 1, 0);
					made.UVs.push(0, 0);
					made.Colors.push(0, 0, 0);
				}
			});

			for (s = 0; s < sectors; s++)
				made.Indices.push(0, 1 + (s + 1) % sectors, 1 + s);

			for (i = 0; i + 1 < radii.length; i++) {
				for (s = 0; s < sectors; s++) {
					var a = 1 + i * sectors + s;
					var b = 1 + i * sectors + (s + 1) % sectors;

					made.Indices.push(a, b, a + sectors, b, b + sectors, a + sectors);
				}
			}

			mesh = renderer.Mesh(made);
			mesh.Reach = reach;

			return mesh;
		}

		/*
		 * The heights of the ground under the sea (256 by 256 over its size), made by a worker once for a ground: the waves
		 * calm down where it is shallow. null until then, and for a ground of no noise.
		 */
		function seaFloor (ground) {
			var field = ground.Field;

			if (ground.FloorKey === ground.Key) return ground.Floor;

			ground.FloorKey = ground.Key;
			ground.Floor = null;

			if (!field.Options) return null;

			terrain.Work().Run('SceneTerrainGenerator', 'Floor', [field.Options, 256], function (error, data) {
				if (error || scene.Ground !== ground || ground.FloorKey !== ground.Key) return;

				ground.Floor = renderer.Texture({Width: 256, Height: 256, Data: data}, {Float: true, Nearest: true});
			});

			return null;
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
			matrix = math.Multiply(math.Perspective(number(lamp.Settings.Spot, 0) || 150, 1, 0.1, number(lamp.Settings.Radius, 14) * 1.2), math.LookAt(at, vectors.Add(at, way), Math.abs(way[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0]));

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
			}).concat(builtLamps()).concat(engine.EffectLamps()).concat(engine.VehicleLamps()).concat(engine.ScatterLamps ? engine.ScatterLamps(from, 160) : []).map(function (lamp) {
				lamp.Far = vectors.Distance(lamp.At, from);

				return lamp;
			}).filter(function (lamp) {
				/* A lamp of the night is dark by day. */
				return !lamp.Settings.Night || !scene.Ground || (scene.Ground.Night || 0) > 0.01;
			}).sort(function (a, b) {
				return a.Far - b.Far;
			}).slice(0, 24);

			/* The last of them fade as they near the farthest taken: one more or one less is never a jump. */
			var reach = scene.Lamps.length >= 24 ? scene.Lamps[scene.Lamps.length - 1].Far : Infinity;

			if (scene.Ground)
				lampShadows();

			scene.Lamps.forEach(function (lamp, index) {
				var settings = lamp.Settings;
				var color = Array.isArray(settings.Color) ? settings.Color : paint(settings.Color);
				var flicker = 1 + number(settings.Flicker, 0) * (Math.sin(scene.Seconds * 11 + (lamp.Object.Seed || 0) * 40) * 0.5 + Math.sin(scene.Seconds * 23 + (lamp.Object.Seed || 0) * 13) * 0.3);
				var power = number(settings.Power, 1) * flicker * 6 * (settings.Night && scene.Ground ? scene.Ground.Night || 0 : 1) * (isFinite(reach) ? 1 - Math.max(0, Math.min(1, (lamp.Far - reach * 0.75) / (reach * 0.25))) : 1);
				var at = vectors.Subtract(lamp.At, scene.Eye);
				var spot = number(settings.Spot, 0);
				var aim = vectors.Normalize(settings.Aim || [0, -1, 0]);

				lamp.Color = color.slice(0, 3);

				data.push(at[0], at[1], at[2], number(settings.Radius, 14), color[0] * power, color[1] * power, color[2] * power, index < 2 && lampMaps[index] ? 1 : 0, aim[0], aim[1], aim[2], spot ? Math.cos(spot * Math.PI / 360) : -2);
			});

			while (data.length < 288)
				data.push(0);

			return {uLocal: data, uLocalCount: scene.Lamps.length, uLampShadow0: lampMaps[0] ? lampMaps[0].Map : gpu.NoShadow, uLampShadow1: lampMaps[1] ? lampMaps[1].Map : gpu.NoShadow, uLampMatrix0: lampMaps[0] ? lampMaps[0].Matrix : math.Identity(), uLampMatrix1: lampMaps[1] ? lampMaps[1].Matrix : math.Identity()};
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
				var base = math.Multiply(object.Turn || math.Identity(), math.Scaling(scale[0], scale[1], scale[2]));
				var world = object.World || [0, 0, 0];
				var grown = Math.max(scale[0], scale[1], scale[2]);

				made.Lamps.forEach(function (lamp) {
					var at = vectors.Add(world, math.Apply(base, lamp.Place));

					lamps.push({Object: object, Built: true, At: at, Far: vectors.Distance(at, scene.Eye), Settings: {Color: lamp.Color, Power: lamp.Power, Radius: lamp.Radius * grown, Spot: lamp.Spot, Aim: lamp.Aim ? math.Apply(object.Turn || math.Identity(), lamp.Aim) : null, Night: lamp.Night}});
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
			var turn = math.Multiply(math.Rotation([0, 1, 0], number(settings.Yaw, 0) * Math.PI / 180), math.Rotation([1, 0, 0], number(settings.Pitch, 0) * Math.PI / 180));
			var width = number(settings.Width, 2);
			var height = number(settings.Height, 2);
			var at = vectors.Subtract(center, scene.Eye);

			return {Center: center, Normal: math.Apply(turn, [0, 0, 1]), Width: width, Height: height, Model: math.Multiply(math.Translation(at[0], at[1], at[2]), math.Multiply(turn, math.Multiply(math.Rotation([1, 0, 0], Math.PI / 2), math.Scaling(width, 1, height))))};
		}

		/* A pane of an object (a mirror, a glass, a screen) for the traits: its middle, the ways of it, its size. */
		engine.PaneOf = function (object, settings) {
			var pane = paneOf(object, settings);
			var turn = math.Multiply(math.Rotation([0, 1, 0], number(settings.Yaw, 0) * Math.PI / 180), math.Rotation([1, 0, 0], number(settings.Pitch, 0) * Math.PI / 180));

			pane.Right = math.Apply(turn, [1, 0, 0]);
			pane.Up = math.Apply(turn, [0, 1, 0]);

			return pane;
		};

		/*
		 * A pane a vehicle carries (its Mirrors and Screens: {At, Normal, Up, Width, Height} in its model), where it stands now: in the
		 * size of the vehicle and turned with it.
		 */
		function carPane (object, part) {
			var size = object.Scaled || [object.Size || 1, object.Size || 1, object.Size || 1];
			var turn = object.Turn || math.Identity();
			var base = math.Multiply(turn, math.Scaling(size[0], size[1], size[2]));
			var center = vectors.Add(object.World, math.Apply(base, part.At || [0, 0, 0]));
			var normal = vectors.Normalize(vectors.Subtract(math.Apply(turn, part.Normal || [0, 0, -1]), math.Apply(turn, [0, 0, 0])));
			var up = vectors.Normalize(vectors.Subtract(math.Apply(turn, part.Up || [0, 1, 0]), math.Apply(turn, [0, 0, 0])));
			var right = vectors.Normalize(vectors.Cross(up, normal));
			var width = number(part.Width, 0.2) * size[0];
			var height = number(part.Height, 0.1) * size[1];
			var at = vectors.Subtract(center, scene.Eye);

			up = vectors.Cross(normal, right);

			return {Center: center, Normal: normal, Right: right, Up: up, Width: width, Height: height, Model: math.Multiply(math.Translation(at[0], at[1], at[2]), math.Multiply([right[0], right[1], right[2], 0, up[0], up[1], up[2], 0, normal[0], normal[1], normal[2], 0, 0, 0, 0, 1], math.Multiply(math.Rotation([1, 0, 0], Math.PI / 2), math.Scaling(width, 1, height))))};
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
				var shape = (car.Values.Vehicle.MirrorShapes || {})[index];
				var size = car.Scaled ? Math.max(car.Scaled[0], car.Scaled[1], car.Scaled[2]) : car.Size || 1;

				var turn = car.Turn || math.Identity();
				var back = vectors.Normalize([-turn[8], -turn[9], -turn[10]]);

				/* A mirror that sees as a camera: its plane behind the car, so the car is not in its picture, and it looks straight back. */
				return {Key: 'car:' + car.ID + ':' + index, Pane: carPane(car, mirror), Settings: Object.assign({Every: 2}, mirror), Small: true, Shift: shape && shape.Camera ? (shape.Rear + 0.05) * size : 0, Glass: !!shape && shape.Glass, Back: shape && shape.Camera ? back : null};
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
		 * drawn by world(viewProjection, eye, small) at half the size (a quarter for the mirrors of a car: small), made again every
		 * Every frames, each in a frame of its own. A mirror seen from behind shows nothing.
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
				var seen = math.Apply(math.Multiply(projection, view), one.At);

				return one.Seen && (one.Far < Math.max(one.Pane.Width, one.Pane.Height) * 2 || Math.abs(seen[0]) < 1.4 && Math.abs(seen[1]) < 1.4 && seen[2] < 1);
			}).sort(function (a, b) {
				return a.Far - b.Far;
			}).slice(0, most).forEach(function (one, index) {
				var settings = one.Settings;
				var target = kept[one.Key];
				var rect = screenRect(one, math.Multiply(projection, view));
				/* The part of the screen it covers, as finely as the screen (half as finely for a big one), in steps of 32 not to make it again at each move. */
				var scale = one.Small ? 1 : 0.5;
				var width = Math.min(2048, Math.max(32, Math.ceil((rect[2] - rect[0]) / 2 * renderer.Width * scale / 32) * 32));
				var height = Math.min(2048, Math.max(32, Math.ceil((rect[3] - rect[1]) / 2 * renderer.Height * scale / 32) * 32));
				var n = aimed(one);
				var d = vectors.Dot(n, one.At) + (one.Shift || 0);
				var crop = [2 / (rect[2] - rect[0]), 0, 0, 0, 0, 2 / (rect[3] - rect[1]), 0, 0, 0, 0, 1, 0, -(rect[2] + rect[0]) / (rect[2] - rect[0]), -(rect[3] + rect[1]) / (rect[3] - rect[1]), 0, 1];
				var reflection = [1 - 2 * n[0] * n[0], -2 * n[1] * n[0], -2 * n[2] * n[0], 0, -2 * n[0] * n[1], 1 - 2 * n[1] * n[1], -2 * n[2] * n[1], 0, -2 * n[0] * n[2], -2 * n[1] * n[2], 1 - 2 * n[2] * n[2], 0, 2 * d * n[0], 2 * d * n[1], 2 * d * n[2], 1];
				var inverse = math.Invert(view);
				var plane = [-n[0], -n[1], -n[2], d];
				var near = [0, 1, 2, 3].map(function (row) {
					return inverse[row * 4] * plane[0] + inverse[row * 4 + 1] * plane[1] + inverse[row * 4 + 2] * plane[2] + inverse[row * 4 + 3] * plane[3];
				});

				/* Each in a frame of its own: all of them on the same frames made every other frame a heavy one, and the view went by in jerks. */
				var waits = (tick + index) % Math.max(1, Math.round(number(settings.Every, 1))) !== 0;

				/*
				 * Made again only when it is too small, or twice too big, and on its own frame: a mirror that moves on the screen
				 * shows the picture it has until then.
				 */
				if (!target || !(target.Drawn && waits) && (width > target.Width || height > target.Height || width * 2 < target.Width || height * 2 < target.Height)) {
					if (target)
						target.Destroy();

					target = kept[one.Key] = renderer.Target(width, height, {Depth: true, Float: true, Mipmaps: true});
					target.Drawn = false;
				}

				made[one.Key] = target;

				if (target.Drawn && waits) return;

				target.Begin();

				renderer.Clear([0, 0, 0, 1]);

				/*
				 * A mirror that sees as a camera: a camera behind the car (where its plane would be), level, looking straight
				 * back; its picture lies on the mirror by the place on its pane, the sides turned as a mirror turns them.
				 */
				if (one.Back) {
					var camera = vectors.Add(one.At, vectors.Scale(one.Back, one.Shift));

					target.Rect = null;

					world(math.Multiply(math.Perspective(number(settings.Fov, 28), one.Pane.Width / one.Pane.Height, 0.1, number(scene.Camera.Far, 5000)), math.LookAt(camera, vectors.Add(camera, [one.Back[0], 0, one.Back[2]]), [0, 1, 0])), camera, !!one.Small);

					target.End();

					target.Drawn = true;

					return;
				}

				renderer.Winding(true);

				/* The picture holds the part of the view in its rect alone, as finely as its size. */
				target.Rect = rect;

				world(math.Multiply(crop, math.Multiply(oblique(projection, near), math.Multiply(view, reflection))), [2 * d * n[0], 2 * d * n[1], 2 * d * n[2]], !!one.Small);

				renderer.Winding(false);

				target.End();

				target.Drawn = true;
			});

			/* The sea at high and ultra, the eye over it: the world mirrored by its level, as fine as half the screen, at every frame. */
			if (scene.Ground && scene.Ground.Field.Water && !scene.Camera.Ortho && (level === 'high' || level === 'ultra') && scene.Eye[1] > 0.3 && !scene.Ground.Under) {
				keys.sea = true;
				made.sea = seaMirror(kept, projection, view, world);
			}

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
		 * The picture of the sea: the world drawn again as the level of the sea mirrors it, cut at it (what is under the water
		 * is not in it), at half the size of the screen. The waves bend it as it is read (Reflection of the water).
		 */
		function seaMirror (kept, projection, view, world) {
			var target = kept.sea;
			var width = Math.max(1, renderer.Width >> 1);
			var height = Math.max(1, renderer.Height >> 1);
			var d = -scene.Eye[1];
			var reflection = [1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 2 * d, 0, 1];
			var inverse = math.Invert(view);
			var plane = [0, -1, 0, d];
			var near = [0, 1, 2, 3].map(function (row) {
				return inverse[row * 4] * plane[0] + inverse[row * 4 + 1] * plane[1] + inverse[row * 4 + 2] * plane[2] + inverse[row * 4 + 3] * plane[3];
			});

			if (!target || target.Width !== width || target.Height !== height) {
				if (target)
					target.Destroy();

				target = kept.sea = renderer.Target(width, height, {Depth: true, Float: true, Mipmaps: true});
			}

			target.Begin();

			renderer.Clear([0, 0, 0, 1]);
			renderer.Winding(true);

			target.Rect = [-1, -1, 1, 1];

			world(math.Multiply(oblique(projection, near), math.Multiply(view, reflection)), [0, 2 * d, 0], false);

			renderer.Winding(false);

			target.End();

			target.Drawn = true;

			return target;
		}

		/*
		 * The part of the screen a mirror covers, [x0, y0, x1, y1] from -1 to 1, a few pixels round it: the corners of its pane
		 * (half as wide again for the glass of a model, which may reach past it) through vp; the whole screen when a corner is
		 * behind the eye.
		 */
		function screenRect (one, vp) {
			var reach = one.Glass ? 0.8 : 0.5;
			var m = one.Pane.Model;
			var low = [Infinity, Infinity];
			var high = [-Infinity, -Infinity];
			var margin = [8 / Math.max(1, renderer.Width), 8 / Math.max(1, renderer.Height)];
			var behind = false;

			[[-reach, -reach], [reach, -reach], [reach, reach], [-reach, reach]].forEach(function (corner) {
				var p = [m[0] * corner[0] + m[8] * corner[1] + m[12], m[1] * corner[0] + m[9] * corner[1] + m[13], m[2] * corner[0] + m[10] * corner[1] + m[14]];
				var w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
				var x = (vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12]) / w;
				var y = (vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13]) / w;

				if (w < 0.02)
					behind = true;

				low = [Math.min(low[0], x), Math.min(low[1], y)];
				high = [Math.max(high[0], x), Math.max(high[1], y)];
			});

			if (behind)
				return [-1, -1, 1, 1];

			low = [Math.max(-1, low[0] - margin[0]), Math.max(-1, low[1] - margin[1])];
			high = [Math.min(1, high[0] + margin[0]), Math.min(1, high[1] + margin[1])];

			if (high[0] - low[0] < 0.01 || high[1] - low[1] < 0.01) return [-1, -1, 1, 1];

			return [low[0], low[1], high[0], high[1]];
		}

		/*
		 * The plane a mirror reflects by: its own; that of a mirror of a car turned, while the eye is in the car, as a driver
		 * sets it: what the eye sees in it is level (the way it would look, its height left out), and straight back for one
		 * that sees as a camera (Back): the eye is not before the middle of the car, the camera is.
		 */
		function aimed (one) {
			var look;
			var seen;
			var level;

			if (!one.Small || (scene.Inside || 0) < 0.5) return one.Pane.Normal;

			look = vectors.Normalize(one.At);
			seen = one.Back || vectors.Subtract(look, vectors.Scale(one.Pane.Normal, 2 * vectors.Dot(look, one.Pane.Normal)));
			level = [seen[0], 0, seen[2]];

			if (vectors.Length(level) < 0.1) return one.Pane.Normal;

			return vectors.Normalize(vectors.Subtract(vectors.Normalize(level), look));
		}

		/* Where the picture of a mirror lies on the screen ([x0, y0, x1, y1] in -1 to 1): it holds that part of the view alone. */
		function rectOf (target) {
			return target && target.Rect || [-1, -1, 1, 1];
		}

		/* The program of the glass of a mirror of a model: the shader of copies (of skeletons for a skinned one), its picture in its shape. */
		function mirrorGlass (list) {
			if (list.Skinned) {
				gpu.MirrorGlassSkinned = gpu.MirrorGlassSkinned || renderer.Program(shaders.Skinned, shaders.MirrorGlass);

				return gpu.MirrorGlassSkinned;
			}

			gpu.MirrorGlass = gpu.MirrorGlass || renderer.Program(shaders.Instanced, shaders.MirrorGlass);

			return gpu.MirrorGlass;
		}

		/* The uniforms of the glass of a mirror of the car driven (key car:<id>:<index>): its picture and its settings. */
		function mirrorValues (key, target) {
			var parts = key.split(':');
			var car = scene.Objects[parts[1]];
			var mirror = car && car.Values.Vehicle && (car.Values.Vehicle.Mirrors || [])[Number(parts[2])] || {};

			var pane = car ? carPane(car, mirror) : null;

			return {uMirror: target.Textures[0], uRect: rectOf(target), uScreen: [renderer.Width, renderer.Height], uTint: paint(mirror.Tint || '#ffffff').slice(0, 3), uBlur: Math.max(0, Math.min(1, number(mirror.Blur, 0))), uStrength: Math.max(0, Math.min(1, number(mirror.Strength, 0.92))), uAsCamera: target.Rect ? 0 : 1, uCenter: pane ? vectors.Subtract(pane.Center, scene.Eye) : [0, 0, 0], uRight: pane ? pane.Right : [1, 0, 0], uUp: pane ? pane.Up : [0, 1, 0], uSize: pane ? [pane.Width, pane.Height] : [1, 1]};
		}

		/*
		 * The panes: a mirror opaque, as clear as Strength and as soft as Blur, Tint over it; glass after all, blended over what
		 * is behind it without touching its alpha (how glossy it is: the reflections of the screen read it).
		 */
		function drawPanes (uniforms, mirrored, later) {
			var ground = scene.Ground;
			var white = gpu.White = gpu.White || renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255, 255, 255, 255])}, {Nearest: true});

			gpu.Pane = gpu.Pane || renderer.Mesh(meshes.Plane({Width: 1, Depth: 1, Segments: 1}));
			gpu.Mirror = gpu.Mirror || renderer.Program(shaders.PaneVertex, shaders.Mirror);
			gpu.Glass = gpu.Glass || renderer.Program(shaders.PaneVertex, shaders.Glass);
			gpu.ScreenProgram = gpu.ScreenProgram || renderer.Program(shaders.PaneVertex, shaders.Screen);

			scene.Active.forEach(function (object) {
				var mirror = trait(object, 'Mirror');
				var glass = trait(object, 'Glass');
				var screen = trait(object, 'Screen');
				var pane;

				/*
				 * A screen: what its source shows (SceneScreens). A camera's picture is opaque, dark until it came; a picture of a page,
				 * an image, a video or a canvas has the clear places of its own (an element of no background): it is laid over what
				 * is behind it after all (what it covers no longer glossy: no reflection of the screen shows through it); its depth is written where it is not clear, or the air would lay the far over it. It is not there until it came.
				 */
				if (screen) {
					var picture = engine.ScreenPicture ? engine.ScreenPicture(object) : null;
					var camera = !!screen.Camera;

					if (camera || !picture) {
						if (!camera && !picture) return;

						pane = paneOf(object, screen);

						renderer.Draw(gpu.Pane, gpu.ScreenProgram, uniforms({uModel: pane.Model, uPicture: picture ? picture.Texture : white, uBright: picture ? number(screen.Bright, 1) : 0.02, uFlip: picture && picture.Flip ? 1 : 0, uClear: 0}), {Cull: 'none'});
					}
					else {
						later.push(function () {
							var shown = paneOf(object, screen);

							renderer.Draw(gpu.Pane, gpu.ScreenProgram, uniforms({uModel: shown.Model, uPicture: picture.Texture, uBright: number(screen.Bright, 1), uFlip: picture.Flip ? 1 : 0, uClear: 1}), {Blend: 'veil', Cull: 'none'});
						});
					}
				}

				if (mirror) {
					pane = paneOf(object, mirror);

					renderer.Draw(gpu.Pane, gpu.Mirror, uniforms({uModel: pane.Model, uMirror: mirrored[object.ID] ? mirrored[object.ID].Textures[0] : white, uOn: mirrored[object.ID] ? 1 : 0, uScreen: [renderer.Width, renderer.Height], uRect: rectOf(mirrored[object.ID]), uAsCamera: 0, uSize: [pane.Width, pane.Height], uSkyLight: ground.SkyLight, uTint: paint(mirror.Tint || '#ffffff').slice(0, 3), uBlur: Math.max(0, Math.min(1, number(mirror.Blur, 0))), uStrength: Math.max(0, Math.min(1, number(mirror.Strength, 0.92)))}), {Cull: 'none'});
				}

				if (glass) {
					later.push(function () {
						pane = paneOf(object, glass);

						renderer.Draw(gpu.Pane, gpu.Glass, uniforms({uModel: pane.Model, uSize: [pane.Width, pane.Height], uMirror: mirrored[object.ID] ? mirrored[object.ID].Textures[0] : white, uOn: mirrored[object.ID] ? 1 : 0, uScreen: [renderer.Width, renderer.Height], uRect: rectOf(mirrored[object.ID]), uTint: paint(glass.Tint || '#cfe6f0').slice(0, 3), uClarity: Math.max(0, Math.min(1, number(glass.Clarity, 0.88))), uFrost: Math.max(0, Math.min(1, number(glass.Frost, 0))), uReflect: Math.max(0, Math.min(1, number(glass.Reflect, 0.35))), uSun: ground.Sun, uSunColor: ground.SunColor, uSkyLight: ground.SkyLight}), {Blend: 'over', DepthWrite: false, Cull: 'none'});
					});
				}
			});

			var car = drivenCar();
			if (!car) return;

			/* The mirrors of the car that is driven, and its screens: pictures of what the page shows. */
			(car.Values.Vehicle.Mirrors || []).forEach(function (mirror, index) {
				var key = 'car:' + car.ID + ':' + index;
				var pane = carPane(car, mirror);
				/* A mirror whose glass the model has shows its picture in that glass: no pane. */
				var shapes = car.Values.Vehicle.MirrorShapes;
				if (shapes && shapes[index] && shapes[index].Glass) return;

				renderer.Draw(gpu.Pane, gpu.Mirror, uniforms({uModel: pane.Model, uMirror: mirrored[key] ? mirrored[key].Textures[0] : white, uOn: mirrored[key] ? 1 : 0, uScreen: [renderer.Width, renderer.Height], uRect: rectOf(mirrored[key]), uAsCamera: mirrored[key] && !mirrored[key].Rect ? 1 : 0, uSize: [pane.Width, pane.Height], uSkyLight: ground.SkyLight, uTint: paint(mirror.Tint || '#ffffff').slice(0, 3), uBlur: Math.max(0, Math.min(1, number(mirror.Blur, 0))), uStrength: Math.max(0, Math.min(1, number(mirror.Strength, 0.85)))}), {Cull: 'none'});
			});

			(car.Values.Vehicle.Screens || []).forEach(function (screen, index) {
				var picture = screenOf(car, screen, index);
				var pane = carPane(car, screen);

				if (picture)
					renderer.Draw(gpu.Pane, gpu.ScreenProgram, uniforms({uModel: pane.Model, uPicture: picture, uBright: number(screen.Bright, 1), uFlip: 0, uClear: 0}), {Cull: 'none'});
			});
		}

		/*
		 * The picture of a screen of a car: an element of the page ([data-screen] of its Source, in the screens slot), drawn as it
		 * is styled into a picture (SVG foreignObject) every Every seconds (0.15), Pixels [width, height] (512 by 256). Null before
		 * its first picture, or where the browser cannot draw it. It is drawn again only when it changed: the styles of an
		 * element are read again when a class or an attribute of it changed, all of them when an element came or went, when the
		 * page changed its theme, or after 10 seconds: reading every style of every node held a frame up for tens of milliseconds.
		 */
		function elementOf (node) {
			return node.nodeType === 1;
		}

		/* The screens stop watching their elements, with the scene. */
		engine.ScreensStop = function () {
			Object.keys(gpu.Screens || {}).forEach(function (key) {
				if (gpu.Screens[key].Watch)
					gpu.Screens[key].Watch.disconnect();

				if (gpu.Screens[key].Theme)
					gpu.Screens[key].Theme.disconnect();
			});
		};

		function screenOf (car, screen, index) {
			return engine.ElementPicture('screen:' + car.ID + ':' + index, screen.Source, screen.Pixels || [512, 256], number(screen.Every, 0.15));
		}

		/*
		 * The picture of an element of the page (source: the name of a data-screen in the slot screens, a selector of the page, or
		 * the element itself) as a texture of pixels [width, height], drawn again when it changed, every seconds at most; null
		 * until its first picture came. Changed(key) has it drawn again (a hover or a focus that is no change of the DOM).
		 */
		engine.ElementPicture = function (key, source, pixels, every) {
			var state = (gpu.Screens = gpu.Screens || {})[key] = gpu.Screens[key] || {At: 0, Changed: true, Styles: null};
			var moment = view.performance ? view.performance.now() : Date.now();
			var element = state.Element && state.Element.isConnected ? state.Element : engine.ScreenElement(source);

			if (element && element !== state.Element) {
				if (state.Watch)
					state.Watch.disconnect();

				state.Element = element;
				state.Changed = true;
				state.Styles = null;

				if (view.MutationObserver) {
					/*
					 * A text that changed keeps the styles; an attribute changed reads again those of its element and what is inside it
					 * (a light that turns on); an element come or gone reads them all again.
					 */
					state.Watch = new view.MutationObserver(function (changes) {
						changes.forEach(function (change) {
							/* A binding that writes the value it had changes nothing. */
							if (change.type === 'attributes' && change.oldValue === change.target.getAttribute(change.attributeName)) return;
							if (change.type === 'characterData' && change.oldValue === change.target.data) return;

							state.Changed = true;

							if (!state.Styles) return;

							if (Array.prototype.some.call(change.addedNodes || [], elementOf) || Array.prototype.some.call(change.removedNodes || [], elementOf)) state.Styles.List = null;
							else if (change.type === 'attributes') state.Styles.Dirty.push(change.target);
						});
					});

					state.Watch.observe(element, {subtree: true, childList: true, attributes: true, attributeOldValue: true, characterData: true, characterDataOldValue: true});

					/* A theme of the page changes the styles of all it holds. */
					state.Theme = state.Theme || new view.MutationObserver(function () {
						state.Changed = true;

						if (state.Styles)
							state.Styles.List = null;
					});

					state.Theme.observe(element.ownerDocument.documentElement, {attributes: true});
				}
			}

			if (state.Styles && state.Styles.List && moment - state.Styles.At > 10000) {
				state.Styles.List = null;
				state.Changed = true;
			}

			if (element && !state.Busy && !state.Failed && (state.Changed || !state.Texture || !view.MutationObserver) && moment - state.At > every * 1000) {
				state.Busy = true;
				state.Changed = false;
				state.Styles = state.Styles || {At: moment, List: null, Own: null, Dirty: [], Defaults: {}};

				if (!state.Styles.List)
					state.Styles.At = moment;

				engine.Rasterize(element, pixels[0], pixels[1], function (error, canvas) {
					state.Busy = false;
					state.At = moment;

					if (error) {
						state.Failed = error;

						return;
					}

					if (state.Texture) state.Texture.Update(canvas);
					else state.Texture = renderer.Texture(canvas, {Mipmaps: true});
				}, state.Styles);
			}

			return state.Texture || null;
		};

		/* The element a screen shows: itself, a data-screen of the slot screens, or one the selector finds in the page. */
		engine.ScreenElement = function (source) {
			if (!source)
				return null;

			if (typeof source === 'object')
				return source.nodeType === 1 ? source : null;

			return self.$Element().querySelector('[data-screen="' + String(source).replace(/"/g, '') + '"]') || (/^[#.\[]/.test(String(source)) ? self.$Element().ownerDocument.querySelector(String(source)) : null);
		};

		/* A picture of an element drawn again at its next turn. */
		engine.ElementChanged = function (key) {
			var state = gpu.Screens && gpu.Screens[key];
			if (state)
				state.Changed = true;
		};

		/*
		 * An element of the page as a picture: a copy of it written as XHTML with every style it is shown with on it, in an SVG
		 * foreignObject, drawn into a canvas of width by height. callback(error, canvas). styles ({List, Own, Pseudo, Dirty,
		 * Defaults}) keeps what was read for the next time: a List of the same nodes is written again without reading the styles
		 * of the page, but for the elements of Dirty and what is inside them. What ::before, ::after and the ::placeholder of a
		 * field show goes with it as rules of its own. The copy is written as text straight from the element and what was read:
		 * a copy of its nodes, its styles set and serialized, cost tens of milliseconds a picture of a big one.
		 */
		engine.Rasterize = function (element, width, height, callback, styles) {
			var document = element.ownerDocument;
			var canvas = document.createElement('canvas');
			var picture = new view.Image();
			var whole = !styles || !styles.List;
			var dirty = styles && !whole ? styles.Dirty : [];
			var list = whole ? [] : styles.List;
			var owns = whole || !styles.Own ? [] : styles.Own;
			var pseudos = whole || !styles.Pseudo ? [] : styles.Pseudo;
			var defaults = styles ? styles.Defaults = styles.Defaults || {} : {};
			var wanted = [];
			var at = 0;

			/*
			 * What an element of a tag is styled with by itself where no stylesheet of the page is (as in the picture), to leave out
			 * of a copy what it would have anyway: read in a page of its own, a blank frame. Read on the page itself, a rule of it
			 * for all (* {box-sizing: border-box}) made what it sets look like nothing, and the picture had none of it.
			 */
			function plain (tag, type) {
				var blank = clean();
				var key = type ? tag + ':' + type : tag;
				var probe;
				var style;
				var made = {};
				var i;

				if (defaults[key])
					return defaults[key];

				probe = blank.createElement(tag);

				if (type)
					probe.setAttribute('type', type);

				blank.body.appendChild(probe);

				style = blank.defaultView.getComputedStyle(probe);

				for (i = 0; i < style.length; i++)
					made[style[i]] = style.getPropertyValue(style[i]);

				blank.body.removeChild(probe);

				defaults[key] = made;

				return made;
			}

			/* What an element takes from its parent by itself: written only where it is not what the parent has. */
			var inherited = /^(color|cursor|direction|visibility|white-space|white-space-collapse|word-spacing|letter-spacing|line-height|quotes|orphans|widows|tab-size|hyphens|hyphenate-character|word-break|overflow-wrap|word-wrap|line-break|writing-mode|text-orientation|text-align|text-align-last|text-indent|text-transform|text-shadow|text-rendering|text-justify|text-underline-position|text-underline-offset|text-emphasis.*|text-wrap.*|text-size-adjust|text-spacing-trim|text-autospace|font.*|list-style.*|border-collapse|border-spacing|caption-side|empty-cells|caret-color|accent-color|color-scheme|pointer-events|image-rendering|image-orientation|paint-order|fill.*|stroke.*|marker.*|clip-rule|shape-rendering|color-interpolation.*|color-rendering|dominant-baseline|text-anchor|speak|ruby-.*|math-.*|forced-color-adjust|print-color-adjust|user-select|dynamic-range-limit|interpolate-size|-webkit-text-.*|-webkit-border-horizontal-spacing|-webkit-border-vertical-spacing|-webkit-locale|-webkit-rtl-ordering|-webkit-user-modify|-webkit-user-select|-webkit-tap-highlight-color|-webkit-hyphenate-character|-webkit-line-break|-webkit-font-smoothing|-webkit-print-color-adjust|-webkit-writing-mode|-webkit-highlight)$/;

			/* The properties of CSS, each once, and whether an element takes it from its parent: read of a blank page, once. */
			function properties () {
				var made = [];
				var flat = plain('span');

				if (engine.CssNames)
					return engine.CssNames;

				Object.keys(flat).forEach(function (name) {
					if (name.charAt(0) !== '-' || name.charAt(1) !== '-')
						made.push({Name: name, Inherited: inherited.test(name)});
				});

				engine.CssNames = made;

				return made;
			}

			/* A page of no stylesheet but the browser's: a frame out of sight, made once. */
			function clean () {
				var frame = engine.BlankFrame;

				if (!frame || !frame.isConnected || !frame.contentDocument || !frame.contentDocument.body) {
					frame = engine.BlankFrame = document.createElement('iframe');

					frame.setAttribute('aria-hidden', 'true');
					frame.setAttribute('tabindex', '-1');

					frame.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 10px; height: 10px; border: 0; visibility: hidden';

					document.body.appendChild(frame);

					/* In the standards mode a picture is drawn in: a page of no doctype keeps the quirks of old (a table of a size of its own). */
					frame.contentDocument.open();
					frame.contentDocument.write('<!DOCTYPE html><html><head></head><body></body></html>');
					frame.contentDocument.close();
				}

				return frame.contentDocument;
			}

			/* The rules of what the pseudo elements of an element show ([data-enx-p="index"]::before {...}), '' for none. */
			function pseudo (original, index, own) {
				var rules = '';
				var base = plain('span');
				var kinds = ['::before', '::after'];
				/* A pseudo element takes from its element what is inherited; the rest is its own. */

				if (/^(INPUT|TEXTAREA)$/.test(original.tagName) && original.getAttribute('placeholder'))
					kinds.push('::placeholder');

				kinds.forEach(function (kind) {
					var style = view.getComputedStyle(original, kind);
					var content = style.getPropertyValue('content');
					var text = '';
					var name;
					var value;
					var i;

					if (kind !== '::placeholder' && (!content || content === 'none' || content === 'normal')) return;

					for (i = 0; i < style.length; i++) {
						name = style[i];
						value = style.getPropertyValue(name);

						if (name.charAt(0) === '-' && name.charAt(1) === '-') continue;

						if (inherited.test(name) ? value !== own[name] : value !== base[name])
							text += name + ':' + value + ';';
					}

					rules += '[data-enx-p="' + index + '"]' + kind + '{' + text + '}';
				});

				return rules;
			}

			/*
			 * Each copy takes the styles its original is shown with: the picture has no stylesheet of the page. The first takes all
			 * of them; one inside it only what is not what its tag has by itself, nor what it takes from its parent: a copy of
			 * hundreds of properties on each node made a picture of tens of milliseconds.
			 */
			function styled (original, above, again) {
				var index = at;
				var fresh = whole || again || dirty.indexOf(original) >= 0;
				var style;
				var text;
				var own;
				var base;
				var table;
				var flat;
				var name;
				var value;
				var i;

				if (original.nodeType !== 1 || skipped(original)) return;

				at++;

				if (fresh) {
					style = view.getComputedStyle(original);
					table = /table$/.test(style.getPropertyValue('display'));
					flat = plain('span');
					base = above ? plain(original.tagName.toLowerCase(), original.tagName === 'INPUT' ? original.type : '') : null;
					text = '';
					own = {};
					changed = true;

					/*
					 * The first takes all; one inside it what it does not take from its parent, and what its tag has not by itself.
					 * Only the properties of CSS are read (no custom one: read only by var(), and every value here is computed
					 * already), and only what is inherited is kept for those inside.
					 */
					for (i = 0; i < names.length; i++) {
						name = names[i].Name;
						value = style.getPropertyValue(name);

						if (names[i].Inherited)
							own[name] = value;

						/* The height of a table is that of its caption too, which its height leaves out: its rows give it. */
						if (table && (name === 'height' || name === 'block-size')) continue;

						/* What is inherited goes unless the parent has it, or the browser gives the tag its own (a th centered, bold). */
						if (!base || (names[i].Inherited ? value !== above[name] || base[name] !== flat[name] : value !== base[name]))
							text += name + ':' + value + ';';
					}

					list[index] = text;
					owns[index] = own;
					pseudos[index] = pseudo(original, index, own);
				}

				/* A canvas or a video is written as a picture of it: what it holds is not. */
				if (/^(CANVAS|VIDEO)$/.test(original.tagName)) return;

				for (i = 0; i < original.childNodes.length; i++)
					styled(original.childNodes[i], owns[index] || {}, fresh && !whole);
			}

			/* What a picture cannot show nor needs: none of it is written. */
			function skipped (node) {
				return /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|IFRAME|OBJECT|EMBED|LINK|META)$/.test(node.tagName);
			}

			function text (value) {
				var made = String(value);

				return /[&<>]/.test(made) ? made.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : made;
			}

			function quoted (value) {
				var made = text(value);

				return made.indexOf('"') >= 0 ? made.replace(/"/g, '&quot;') : made;
			}

			/*
			 * The copy as text: each element with the styles read for it, and what a copy of nodes would not take of its original:
			 * what is typed into a field, what is ticked or chosen, how far it scrolled, the pictures it shows (a picture of an SVG
			 * fetches nothing: each goes in it as data), what a canvas or a video shows.
			 */
			function written (original, extra) {
				var index = at;
				var tag = original.tagName;
				var name = original.localName;
				var svg = original.namespaceURI === 'http://www.w3.org/2000/svg';
				var attributes = '';
				var inner = '';
				var source;
				var i;

				at++;

				if (tag === 'CANVAS' || tag === 'VIDEO') {
					try {
						source = tag === 'CANVAS' ? original.toDataURL() : frameOf(original);
					}
					catch (error) {
						source = '';
					}

					return '<img style="' + quoted((list[index] || '') + (extra || '')) + '"' + (source ? ' src="' + quoted(source) + '"' : '') + '></img>';
				}

				for (i = 0; i < original.attributes.length; i++) {
					var attribute = original.attributes[i];
					if (attribute.name === 'style' || !/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(attribute.name) || /^on/i.test(attribute.name)) continue;
					if (tag === 'IMG' && /^(src|srcset|loading)$/.test(attribute.name)) continue;
					if (tag === 'INPUT' && /^(value|checked)$/.test(attribute.name)) continue;
					if (tag === 'OPTION' && attribute.name === 'selected') continue;

					attributes += ' ' + attribute.name + '="' + quoted(attribute.value) + '"';
				}

				if (svg && name === 'svg' && !original.getAttribute('xmlns'))
					attributes += ' xmlns="http://www.w3.org/2000/svg"';

				if (tag === 'IMG') {
					source = original.currentSrc || original.src;

					if (source) {
						attributes += ' src="' + quoted(source) + '"';

						wanted.push(source);
					}
				}
				else if (tag === 'INPUT') {
					if (original.type === 'checkbox' || original.type === 'radio') {
						if (original.checked)
							attributes += ' checked="checked"';
					}
					else {
						attributes += ' value="' + quoted(original.value) + '"';
					}
				}
				else if (tag === 'OPTION' && original.selected) {
					attributes += ' selected="selected"';
				}

				if (pseudos[index])
					attributes += ' data-enx-p="' + index + '"';

				if (list[index] || extra)
					attributes += ' style="' + quoted((list[index] || '') + (extra || '')) + '"';

				if (tag === 'TEXTAREA') {
					inner = text(original.value);
				}
				else {
					for (i = 0; i < original.childNodes.length; i++) {
						var child = original.childNodes[i];

						if (child.nodeType === 3) inner += text(child.data);
						else if (child.nodeType === 1 && !skipped(child)) inner += written(child);
					}

					/* A copy does not scroll: what it holds is moved up and aside by as much. */
					if (original.scrollTop || original.scrollLeft)
						inner = '<div style="position: relative; top: ' + -original.scrollTop + 'px; left: ' + -original.scrollLeft + 'px">' + inner + '</div>';
				}

				return '<' + name + (index === 0 && !svg ? ' xmlns="http://www.w3.org/1999/xhtml"' : '') + attributes + '>' + inner + '</' + name + '>';
			}

			/* What a video shows now, as data. */
			function frameOf (video) {
				var still = document.createElement('canvas');

				still.width = video.videoWidth || video.width || 1;
				still.height = video.videoHeight || video.height || 1;

				still.getContext('2d').drawImage(video, 0, 0, still.width, still.height);

				return still.toDataURL();
			}

			/* The addresses of what the styles show (backgrounds, masks, borders of pictures), each once. */
			function addresses (texts) {
				var found = /url\("?([^")]+)"?\)/g;
				var made = [];
				var match;

				texts.forEach(function (text) {
					found.lastIndex = 0;

					while ((match = found.exec(text || '')))
						made.push(match[1]);
				});

				return made;
			}

			/* Each address fetched once as data (engine.Inlined): what cannot be is left out of the picture. */
			function inline (urls, done) {
				var kept = engine.Inlined = engine.Inlined || {};
				var left = 1;

				function one () {
					if (--left === 0)
						done();
				}

				urls.forEach(function (url) {
					var request;

					if (!url || /^data:/.test(url) || kept[url] !== undefined) return;

					kept[url] = null;
					left++;

					request = new view.XMLHttpRequest();

					request.open('GET', url);

					request.responseType = 'blob';

					request.onload = function () {
						var reader;

						if (request.status >= 400 || !request.response) {
							one();

							return;
						}

						reader = new view.FileReader();

						reader.onload = function () {
							kept[url] = reader.result;

							one();
						};

						reader.onerror = one;

						reader.readAsDataURL(request.response);
					};

					request.onerror = one;

					request.send();
				});

				one();
			}

			var names = properties();
			var changed = false;
			var addressed = styles && styles.Addresses;

			styled(element);

			if (styles) {
				styles.List = list;
				styles.Own = owns;
				styles.Pseudo = pseudos;
				styles.Dirty = [];
			}

			/* The rules of the pseudo elements, before the copy in the picture. */
			var rules = pseudos.join('');

			/* The copy stands at the corner of its picture, wherever the element is put out of sight on the page. */
			at = 0;

			var copy = written(element, 'margin: 0; position: relative; left: 0; top: 0; right: auto; bottom: auto; transform: none; width: ' + width + 'px; height: ' + height + 'px;');

			canvas.width = width;
			canvas.height = height;

			picture.onload = function () {
				canvas.getContext('2d').drawImage(picture, 0, 0, width, height);

				callback(null, canvas);
			};

			picture.onerror = function () {
				callback(new Error('Elemenx Scene: a screen could not be drawn'));
			};

			/* The addresses the styles show, found again only when a style was read again. */
			if (changed || !styles || !styles.Addresses)
				addressed = addresses(list.concat(pseudos));

			if (styles)
				styles.Addresses = addressed;

			var urls = wanted.concat(addressed);

			inline(urls, function () {
				var made = (rules ? '<style xmlns="http://www.w3.org/1999/xhtml">' + text(rules) + '</style>' : '') + copy;
				var kept = engine.Inlined || {};

				/* Each address as the data it came as (written as it is, or with its & escaped by the serializer). */
				urls.forEach(function (url) {
					if (!url || !kept[url]) return;

					made = made.split(url).join(kept[url]);
					made = made.split(url.replace(/&/g, '&amp;')).join(kept[url]);
				});

				picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><foreignObject width="100%" height="100%">' + made + '</foreignObject></svg>');
			});
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

				renderer.Draw(gpu.NightStars, gpu.StarsTurned, {uViewProjection: math.Multiply(math.Perspective(scene.Camera.Fov, aspect, 0.1, 200), math.LookAt([0, 0, 0], vectors.Subtract(scene.Camera.Target, scene.Camera.Position), scene.Camera.Up)), uRatio: renderer.Ratio, uTurn: ground.StarTurn, uLimit: ground.StarLimit, uTime: scene.Seconds}, {Depth: false, DepthWrite: false, Blend: 'add'});
			}

			if (!scene.Camera.Ortho)
				renderer.Draw(gpu.Quad, gpu.Sky, Object.assign({uInverse: math.Invert(matrix), uSun: ground.Sky, uSunColor: ground.SunColor, uAir: air, uUp: [0, 1, 0], uHigh: 0, uCover: ground.Shut, uEclipse: ground.Eclipse, uSunRadius: ground.SunRadius || 0.00465, uRainbow: ground.Rainbow || 0, uAurora: [ground.Aurora || 0, scene.Seconds % 3000, 0, 0], uAuroraLow: ground.AuroraLow || [0.2, 1, 0.55], uAuroraHigh: ground.AuroraHigh || [0.75, 0.25, 1], uMoonShade: ground.Moon ? ground.Moon.Shade : 0, uGlow: ground.Glow, uGlowWay: ground.GlowWay, uMoon: ground.Moon ? ground.Moon.Way : [0, 1, 0], uMoonLit: ground.Moon ? ground.Moon.Lit : [0, 1, 0], uMoonSize: ground.Moon ? ground.Moon.Size : 0, uMoonGlow: ground.Moon ? Math.min(1, ground.Moon.Glow) * Math.max(0, Math.min(1, ground.Moon.Way[1] / 0.15)) : 0}, self.SkyValues(scene.Seconds)), {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});

			/* Past the ground of a location: the far ground of its body. */
			if (!scene.Camera.Ortho && !mirror && scene.Horizon)
				drawHorizon();

			/* One set of uniforms for all the squares, their places set for each; a ground with a Blueprint drawn by its graph. */
			var settings = trait(scene.Objects[ground.ID], 'Terrain');
			var own = settings && settings.Blueprint ? blueprinted(settings, 'Land', ground.ID) : null;
			var program = gpu.LandOf(own, field.Materials);
			/* The tiles of its materials of a texture, the layers of two textures (SceneTextures.Array). */
			var tiles = self.$Service('SceneTextures').Array(renderer, self.$Service('SceneMaterials').Textured(field.Materials || []));
			var land = Object.assign({uViewProjection: matrix, uSun: ground.Sun, uSunColor: ground.SunColor, uAir: air, uFog: fog, uSea: field.Water ? 1 : 0, uSkyLight: ground.SkyLight, uFloorLight: ground.FloorLight, uWet: ground.Air.Wet, uSnowed: snowed(), uRainDrops: ground.Air.Rain, uTime2: scene.Seconds % 1000}, shade, own ? own.Made.Values(settings.Parameters || {}, {Time: scene.Seconds % 3000}) : null, self.LandValues(scene.Seconds));

			if (tiles) {
				land.uLandColor = tiles.Color;
				land.uLandSurface = tiles.Surface;
			}

			/*
			 * Regression: the program of the land of a location (its materials) is made when the location comes, and drawn at
			 * once: the page waited seconds for the card to make it, frozen, as the ship touched down. Till the card has it, the
			 * land is not drawn (the veil waits for it, see waiting).
			 */
			if (renderer.Ready(program)) {
				nodes.forEach(function (node) {
					land.uOffset = vectors.Subtract(node.Center, scene.Eye);
					land.uCenter = node.Center;

					renderer.Draw(node.Mesh, program, land, {Cull: 'back'});
				});
			}

			/* The wire of the ground: the edges of its squares over them. */
			if (wired() && !mirror) {
				gpu.LandWire = gpu.LandWire || renderer.Program(shaders.LandVertex, shaders.Flat);

				nodes.forEach(function (node) {
					if (node.Wire)
						renderer.Draw(node.Wire, gpu.LandWire, {uViewProjection: matrix, uOffset: vectors.Subtract(node.Center, scene.Eye), uCenter: node.Center, uColor: scene.Colors.Wire, uBody: [0, 0, 0, 0]}, {Blend: 'alpha', DepthWrite: false, Depth: 'lequal'});
				});
			}

			Object.keys(ground.Nodes).forEach(function (key) {
				if (ground.Frame - (ground.Nodes[key].Used || 0) > 240) {
					ground.Nodes[key].Mesh.Destroy();

					if (ground.Nodes[key].Wire)
						ground.Nodes[key].Wire.Destroy();

					delete ground.Nodes[key];
				}
			});
		}

		/*
		 * The surface of a body (Land): a frame of its own, its middle at the origin and its units kilometres, its ground
		 * of the noise of its baked surface (the Terrain Service) in squares of the faces of its cube, finer near the eye;
		 * its sky of its air, lit by its star. The eye stands on the ground at an altitude, turned by Yaw and Pitch.
		 */
		var terrain = self.$Service('SceneTerrainGenerator');

		/* The ground of a body: of its planet (Surface: Planet, ScenePlanet: the very ground of its globe), else of its baked look. */
		function surfaceField (object) {
			var surface = trait(object, 'Surface') || {};
			var type = surface.Type || 'rocky';
			var relief = {terran: 8, ocean: 6, desert: 7, rocky: 9, moon: 10, dwarf: 6, ice: 5, lava: 6};

			return surface.Planet ? terrain.Sphere({Planet: planetOf(object)}) : terrain.Sphere({Radius: object.Radius, Height: relief[type] || 6, Seed: object.Seed, Ocean: object.Look.Ocean, Type: type});
		}

		function land (id, options) {
			var object = scene.Objects[id];
			var settings = options || {};
			var surface = object ? trait(object, 'Surface') : null;
			var type = surface ? surface.Type : 'rocky';
			var up;
			var high;
			var arrive;
			var sweep = 0.5;

			if (!object || !trait(object, 'Body') || type === 'gas' || type === 'ice-giant') return false;

			place(scene.Time);

			/*
			 * A ship that comes down or goes up (SceneLanding): the surface is the frame it flies in, at Up (in the frame of the
			 * body) and Altitude (km); the ship says where the eye stands, and it is no visit of the scene.
			 */
			if (settings.Ship) {
				/* The horizon of the location it leaves is the surface it flies over: its squares made already. */
				var kept = scene.Horizon && scene.Horizon.ID === object.ID ? scene.Horizon : null;

				if (kept) scene.Horizon = null;
				else closeHorizon();

				scene.Surface = {ID: object.ID, Field: kept ? kept.Field : surfaceField(object), Nodes: kept ? kept.Nodes : {}, Up: vectors.Normalize(settings.Up), Yaw: 0, Pitch: 0.22, Altitude: Number(settings.Altitude) || 1, Wanted: Number(settings.Altitude) || 1, Way: null, Heat: 0, Rising: false, Keys: {}, Frame: 0, Ship: settings.Ship};
				labels.hidden = true;
				self.Card = null;

				return true;
			}

			/*
			 * The direction in the frame of the body: its own turn taken away from the eye, so the ground under it stays.
			 * Regression: a latitude and a longitude were taken as of space and turned too, the eye far from the place (by the
			 * tilt of its axis); they are of the body, as Surface tells them, its markers and its settlements.
			 */
			if (settings.Latitude !== undefined) {
				up = vectors.Normalize(toDirection(Number(settings.Latitude) || 0, Number(settings.Longitude) || 0));
			}
			else {
				up = math.Apply(math.Invert(object.Turn) || math.Identity(), vectors.Normalize(vectors.Subtract(scene.Camera.Position, object.World)));
			}

			/* It starts where the eye stands now: at the height from which the body looks as large as it does from here. */
			high = Math.max(object.Radius * 0.4, Math.min(object.Radius * 8, object.Radius * (vectors.Distance(scene.Camera.Position, object.World) / Math.max(object.Size, 1e-6) - 1)));
			arrive = settings.Altitude === undefined ? 0.6 : Math.max(0.0015, Number(settings.Altitude));

			/* A place it was told comes straight under it; else the ground passes under the eye on the way down. */
			if (settings.Latitude !== undefined)
				sweep = 0;

			scene.Surface = {
				ID: object.ID,
				/* A planet of ScenePlanet (Surface: Planet, its options): the very ground of its globe, at the radius of the body. */
				Field: surfaceField(object),
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
			self.LandedOn = object.ID;
			self.Card = null;

			self.$Emit('land', {ID: object.ID});

			return true;
		}

		function takeOff () {
			var surface = scene.Surface;
			if (!surface || surface.Ship) return false;

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

			/* A ship flies over it: it says where the eye stands (SceneLanding). */
			if (surface.Ship) {
				engine.LandingSurfaceStep(surface, keys, elapsed);

				return;
			}

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

			closeSurface();

			self.LandedOn = '';

			if (object) {
				focusOn(object.ID, true);

				/* The view of space takes over where the way up ended: the body as large, on the same side. */
				place(scene.Time);

				away = math.Apply(object.Turn || math.Identity(), surface.Up);
				scene.Yaw = Math.atan2(away[0], away[2]);
				scene.Pitch = Math.asin(Math.max(-1, Math.min(1, away[1])));
				scene.Distance = scene.Wanted = object.Size * (surface.Field.Radius + surface.Altitude) / surface.Field.Radius;
				scene.Moving = 1;
			}

			self.$Emit('takeoff', {ID: surface.ID});
		}

		/* The surface let go, its squares with it: space again (or a location a ship came down to). */
		/* The surface let go; kept (keep), its ground is the horizon of a location: what is past its ground, drawn behind it. */
		function closeSurface (keep) {
			var surface = scene.Surface;
			if (!surface) return;

			closeHorizon();

			if (keep) scene.Horizon = {ID: surface.ID, Field: surface.Field, Nodes: surface.Nodes, Frame: surface.Frame, Altitude: surface.Altitude, Eye: surface.Eye, Finest: 1.5};
			else destroyNodes(surface.Nodes);

			scene.Surface = null;
			labels.hidden = !!scene.Location;
		}

		function closeHorizon () {
			if (!scene.Horizon) return;

			destroyNodes(scene.Horizon.Nodes);

			scene.Horizon = null;
		}

		/*
		 * The picture of a square of a globe (PatchPicture) as its textures, mipmapped; none: as it was. square: [face, u, v,
		 * size, radius], where it is on its face: its corner in kilometres of the face, as the rest of 48 km and the number of
		 * those (the Ground shader lays the parcels of its fields and its houses by them, exact in its floats).
		 */
		function pictured (node, picture, square) {
			var km;
			var x;
			var y;

			if (!picture || !picture.Color) return node;

			unpictured(node);

			node.Colors = renderer.Texture({Width: picture.Size, Height: picture.Size, Data: picture.Color}, {Mipmaps: true});
			node.Relief = renderer.Texture({Width: picture.Size, Height: picture.Size, Data: picture.Normal}, {Mipmaps: true});
			node.Uses = picture.Use ? renderer.Texture({Width: picture.Size, Height: picture.Size, Data: picture.Use}, {Mipmaps: true}) : null;
			node.Texels = picture.Size;

			if (square) {
				km = Math.PI / 4 * square[4];
				x = (square[1] - square[3] / 2) * km;
				y = (square[2] - square[3] / 2) * km;
				node.Square = [x - Math.floor(x / 48) * 48, y - Math.floor(y / 48) * 48, square[3] * km, square[0]];
				node.Cell = [Math.floor(x / 48), Math.floor(y / 48)];
			}

			return node;
		}

		/*
		 * The tiles of the materials for a ground of a body near (the Ground shader): lawn, grassy soil, dirt and cliff, as the
		 * ground of a location draws them, laid in a plane touching the body at an anchor (the eye to 10 km): metres from it
		 * stay exact in the floats of the shader (a tile of 0.8 m in parts of a texel), and the plane is the same until the eye
		 * goes into the next 10 km, which it does not while it is low enough to see them. Over
		 * 40 km up: none (they are finer than a pixel).
		 */
		function groundTiles (eye, altitude) {
			var textures = self.$Service('SceneTextures');
			var names = ['lawn', 'grassy-soil', 'dirt', 'cliff'];
			var made;
			var anchor;
			var up;
			var east;

			anchor = eye.map(function (part) {
				return Math.round(part / 10) * 10;
			});
			up = vectors.Normalize(vectors.Length(anchor) > 1 ? anchor : eye);
			east = Math.abs(up[1]) > 0.99 ? [1, 0, 0] : vectors.Normalize(vectors.Cross([0, 1, 0], up));

			made = altitude > 40 || !names.every(function (name) {
				return textures.Has(name);
			}) ? null : textures.Array(renderer, names);
			gpu.NoArray = gpu.NoArray || made && made.Color;

			/* The anchor always: what is finer than a kilometre is of the point from it (see Ground), near or not. */
			return {uTextured: made ? 1 : 0, uLandColor: made ? made.Color : gpu.NoArray || null, uLandSurface: made ? made.Surface : gpu.NoArray || null, uAnchor: vectors.Subtract(eye, anchor), uUp: up, uEast: east, uNorth: vectors.Cross(up, east), uMetres: names.map(function (name) {
				return textures.Has(name) ? textures.Get(name).Metres : 1;
			})};
		}

		/* The uniforms of the picture of a square for the Ground shader: its textures, or none yet (its colors of its points). */
		function tiled (node) {
			var dwelt = node.Uses && node.Square && !(scene.Tuned && scene.Tuned.Fields === false);

			return {uTiled: node.Colors ? 1 : 0, uColorMap: node.Colors || gpu.NoBounce, uReliefMap: node.Relief || gpu.NoBounce, uTexels: node.Texels || 2, uWoods: scene.Tuned && scene.Tuned.Woods === false ? 0 : 1, uDwelt: dwelt ? 1 : 0, uUseMap: dwelt ? node.Uses : gpu.NoBounce, uSquare: dwelt ? node.Square : [0, 0, 1, 0], uSquareCell: dwelt ? node.Cell : [0, 0]};
		}

		function unpictured (node) {
			['Colors', 'Relief', 'Uses'].forEach(function (name) {
				if (node[name])
					node[name].Destroy();

				node[name] = null;
			});
		}

		function destroyNodes (nodes) {
			Object.keys(nodes).forEach(function (key) {
				unpictured(nodes[key]);

				if (nodes[key].Mesh)
					nodes[key].Mesh.Destroy();

				if (nodes[key].Wire)
					nodes[key].Wire.Destroy();
			});
		}

		/*
		 * A planet of ScenePlanet seen near from space: its ground as the surface of a Scene draws it (patches, finer the
		 * nearer, each of its colors), in the frame of the body, through the view of the pass it is drawn in (planes: its near
		 * and far, in the units of the view), its relief made steeper for the light from far. False when it cannot be drawn.
		 */
		/* The color of the clouds of a body: white, tinted by its air where they cover all of it. */
		function cloudTint (object) {
			var air = object.Look.Atmosphere;
			var tint = object.Look.Clouds >= 1 ? 0.55 * air[3] : 0;

			return [0.96 + (air[0] - 0.96) * tint, 0.96 + (air[1] - 0.96) * tint, 0.96 + (air[2] - 0.96) * tint];
		}

		function drawGlobe (object, planes) {
			var camera = scene.Camera;
			var clouds;
			var planet = planetOf(object);
			var key = JSON.stringify(planet);
			var globe = scene.Globes[object.ID];
			var scale = object.Size / object.Radius;
			var turn = math.Invert(object.Turn || math.Identity()) || math.Identity();
			var field;
			var eye;
			var view;
			var matrix;
			var star;
			var sun;
			var sunColor;
			var nodes;
			var laid;

			if (!globe || globe.Key !== key) {
				if (globe)
					destroyNodes(globe.Nodes);

				/* Finer squares and sooner than over a surface: from far all of its land is in view at once. */
				globe = scene.Globes[object.ID] = {ID: object.ID, Key: key, Field: surfaceField(object), Nodes: {}, Frame: 0, Finest: 0.4, Globe: true, Resolution: 48, Eager: 2.5};
			}

			field = globe.Field;
			eye = vectors.Scale(math.Apply(turn, vectors.Subtract(camera.Position, object.World)), 1 / scale);
			globe.Eye = eye;
			globe.Altitude = Math.max(0.002, vectors.Length(eye) - field.Radius - field.Elevation(vectors.Normalize(eye)));

			/* From over 60 kilometres its clouds are drawn on its ground (no shell of them: see Ground); nearer, as a shell. */
			clouds = !!object.Look.Clouds && !!scene.Baked[object.ID] && globe.Altitude > 60;
			globe.CloudsOver = clouds;
			view = math.LookAt([0, 0, 0], math.Apply(turn, vectors.Normalize(vectors.Subtract(camera.Target, camera.Position))), math.Apply(turn, camera.Up));
			matrix = math.Multiply(math.Perspective(camera.Fov, renderer.Width / Math.max(1, renderer.Height), Math.max(1e-7, planes[0] / scale), planes[1] / scale), view);
			star = scene.Order.filter(function (each) {
				return trait(each, 'Star') && each.World;
			})[0];
			sun = vectors.Normalize(star ? math.Apply(turn, vectors.Normalize(vectors.Subtract(star.World, object.World))) : [0, 1, 0]);
			sunColor = star ? paint(star.Color).slice(0, 3) : [1, 1, 1];
			nodes = patches(globe);
			laid = groundTiles(eye, globe.Altitude);

			nodes.forEach(function (node) {
				renderer.Draw(node.Mesh, gpu.Ground, Object.assign({
					uViewProjection: matrix,
					uOffset: vectors.Subtract(node.Center, eye),
					uCenter: node.Center,
					uSun: sun,
					uSunColor: sunColor,
					uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]),
					uPainted: field.Painted ? 1 : 0,
					uWater: object.Look.Water,
					uIce: object.Look.Ice,
					uAir: object.Look.Atmosphere,
					uRadius: field.Radius,
					uTime: scene.Seconds,
					uFog: Math.max(field.Radius * 0.02, globe.Altitude * 3),
					uHigh: Math.min(1, globe.Altitude / 100),
					uRelief: Math.max(1, Math.min(6, globe.Altitude / 150)),
					uLights: lightsOf(object),
					uLightsOn: lightsOf(object) === noLights() ? 0 : 1,
					uSky: clouds ? scene.Baked[object.ID].Sky : noLights(),
					uCloudsOn: clouds ? 1 : 0,
					uDrift: engine.CloudDrift(object),
					uCloudTint: clouds ? cloudTint(object) : [1, 1, 1]
				}, idle(), tiled(node), laid), {Cull: 'back'});
			});

			forget(globe);

			return nodes.length > 0;
		}

		/*
		 * The far ground round a location (scene.Horizon): the ground of its body, as it is drawn from over its surface, past
		 * the ground of the location. Behind all: drawn over the sky at one depth, that of the farthest point of the ground of
		 * the location (so all of that is over it), the farthest first; the air of the scene takes it as far as that, its own
		 * air the rest of the way.
		 */
		function drawHorizon () {
			var horizon = scene.Horizon;
			var located = scene.Location;
			var object = horizon && located ? scene.Objects[horizon.ID] : null;
			var frame = located && located.Frame;
			var camera = scene.Camera;
			var field;
			var up;
			var eye;
			var look;
			var view;
			var far;
			var matrix;
			var star;
			var sun;
			var sunColor;
			var nodes;
			var depth;
			var laid;

			if (!object || !frame || !object.Look) return;

			field = horizon.Field;

			/* A way of the location in the frame of the body: X, up (its middle) and Z (to its south). */
			function toBody (way) {
				return [0, 1, 2].map(function (axis) {
					return way[0] * frame.X[axis] + way[1] * frame.Middle[axis] - way[2] * frame.North[axis];
				});
			}

			up = frame.Direction(camera.Position[0], camera.Position[2]);
			eye = vectors.Scale(up, field.Radius + camera.Position[1] / 1000);
			look = toBody(vectors.Normalize(vectors.Subtract(camera.Target, camera.Position)));
			view = math.LookAt([0, 0, 0], look, toBody(camera.Up));

			horizon.Eye = eye;
			horizon.Up = up;
			horizon.Altitude = Math.max(0.002, vectors.Length(eye) - field.Radius - field.Elevation(up));

			far = Math.max(50, Math.sqrt(horizon.Altitude * (2 * field.Radius + horizon.Altitude)) * 3 + field.Radius * 0.1);
			matrix = math.Multiply(math.Perspective(camera.Fov, renderer.Width / Math.max(1, renderer.Height), 0.01, far), view);
			star = scene.Order.filter(function (each) {
				return trait(each, 'Star') && each.World;
			})[0];
			sun = vectors.Normalize(star && object.World ? math.Apply(math.Invert(object.Turn) || math.Identity(), vectors.Normalize(vectors.Subtract(star.World, object.World))) : [0, 1, 0]);
			sunColor = star ? paint(star.Color).slice(0, 3) : [1, 1, 1];

			/* The farthest first: all at the one depth of the farthest point of the ground of the location. */
			nodes = patches(horizon).map(function (node) {
				return {Node: node, Far: vectors.Distance(node.Center, eye)};
			}).sort(function (a, b) {
				return b.Far - a.Far;
			});

			depth = horizonDepth();
			laid = groundTiles(eye, horizon.Altitude);

			renderer.GL.depthRange(depth, depth);

			nodes.forEach(function (each) {
				renderer.Draw(each.Node.Mesh, gpu.Ground, Object.assign({
					uViewProjection: matrix,
					uOffset: vectors.Subtract(each.Node.Center, eye),
					uCenter: each.Node.Center,
					uSun: sun,
					uSunColor: sunColor,
					uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]),
					uPainted: field.Painted ? 1 : 0,
					uWater: object.Look.Water,
					uIce: object.Look.Ice,
					uAir: object.Look.Atmosphere,
					uRadius: field.Radius,
					uTime: scene.Seconds,
					uFog: Math.max(field.Radius * 0.02, far * 0.6),
					uHigh: Math.min(1, horizon.Altitude / 100),
					uRelief: 1,
					uLights: lightsOf(object),
					uLightsOn: lightsOf(object) === noLights() ? 0 : 1,
					uSky: noLights(),
					uCloudsOn: 0
				}, idle(), tiled(each.Node), laid), {Cull: 'back', Depth: 'lequal'});
			});

			renderer.GL.depthRange(0, 1);

			forget(horizon);
		}

		/* The depth (0 to 1) of the farthest corner of the ground of the location, its lowest under the eye, in the view now. */
		function horizonDepth () {
			var camera = scene.Camera;
			var half = scene.Ground.Field.Size / 2;
			var far = 0;
			var near = camera.Near;
			var end = camera.Far;

			[[-half, -half], [half, -half], [half, half], [-half, half]].forEach(function (corner) {
				far = Math.max(far, Math.hypot(corner[0] - camera.Position[0], corner[1] - camera.Position[2], Math.abs(camera.Position[1]) + 600));
			});

			far = Math.min(end * 0.999, far * 1.05);

			return Math.min(0.9999999, ((end + near) / (end - near) - 2 * end * near / ((end - near) * far) + 1) / 2);
		}

		/* The squares of the faces of the cube in view, the finer the nearer (no finer than Finest km); each made once, a few a frame. */
		function patches (given) {
			var surface = given || scene.Surface;
			var field = surface.Field;
			var wanted = [];
			var horizon = Math.acos(Math.min(1, field.Radius / (field.Radius + Math.max(0.001, surface.Altitude) + field.Height)));
			var missing = [];
			var started = window.performance.now();
			var face;
			var focal = renderer.Height / Math.max(1, renderer.Ratio || 1) / (2 * Math.tan((scene.Camera.Fov || 45) * Math.PI / 360));

			function keyOf (face, u, v, level) {
				return face + ':' + u.toFixed(6) + ':' + v.toFixed(6) + ':' + level;
			}

			/*
			 * How far the grid of a square of a face is from the ground of the body, in its units: its elevation between corners
			 * against what the grid makes of it there, the most of nine; a range of mountains much, a sea nothing.
			 */
			function errorOf (face, u, v, size) {
				var cells = surface.Resolution || 24;
				var cell = size / cells;
				var most = 0;
				var i;

				if (!field.Elevation) return 0;

				function at (a, b) {
					return field.Elevation(vectors.Normalize(terrain.Face(face, a, b)));
				}

				for (i = 0; i < 9; i++) {
					var a = u - size / 2 + Math.floor((i % 3 + 0.5) / 3 * cells) * cell;
					var b = v - size / 2 + Math.floor((Math.floor(i / 3) + 0.5) / 3 * cells) * cell;
					var grid = (at(a, b) + at(a + cell, b) + at(a, b + cell) + at(a + cell, b + cell)) / 4;

					most = Math.max(most, Math.abs(at(a + cell / 2, b + cell / 2) - grid));
				}

				return most;
			}

			/*
			 * The faces at once, their parts by a worker; a ground that paints itself (ScenePlanet) gives each its picture, PICTURE
			 * texels a side, its colors and its relief finer than its points (a face made at once gets it after, by a worker).
			 */
			function build (face, u, v, size, level) {
				var key = keyOf(face, u, v, level);
				var picture = field.Picture ? 64 : 0;
				var made;

				if (level) {
					askPiece(surface, key, 'Sphere', [face, u, v, size, surface.Resolution || 24, picture], function (piece) {
						made = piece || field.Patch(face, u, v, size, surface.Resolution || 24);

						surface.Nodes[key] = pictured({Mesh: renderer.Mesh(made.Geometry), Center: made.Center, Error: errorOf(face, u, v, size), Used: surface.Frame}, made.Picture, [face, u, v, size, field.Radius]);
					});

					return;
				}

				made = field.Patch(face, u, v, size, surface.Resolution || 24);

				surface.Nodes[key] = {Mesh: renderer.Mesh(made.Geometry), Center: made.Center, Error: errorOf(face, u, v, size), Used: surface.Frame};

				if (picture)
					askPiece(surface, key + ':picture', 'SpherePicture', [face, u, v, size, picture], function (piece) {
						if (surface.Nodes[key] && piece)
							pictured(surface.Nodes[key], piece.Picture, [face, u, v, size, field.Radius]);
					});
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

				/* By its distance; and finer still where its grid would show on the screen (more than 1.5 pixels from the ground). */
				if (level < 17 && (near < field.Radius * size * 0.75 * 2.2 * (surface.Eager || 1) || near < field.Radius * size * 6 && (node.Error || 0) / Math.max(near, 1e-6) * focal > 1.5) && size * Math.PI / 4 * field.Radius > (surface.Finest || 0)) {
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

			surface.Missing = missing.length;

			missing.some(function (one) {
				build(one.Face, one.U, one.V, one.Size, one.Level);

				return window.performance.now() - started > 5 || terrain.Work().Waiting() > 8;
			});

			return wanted;
		}

		/* Squares not drawn for a while are let go. */
		function forget (given) {
			var surface = given || scene.Surface;

			Object.keys(surface.Nodes).forEach(function (key) {
				if (surface.Frame - (surface.Nodes[key].Used || 0) > 240) {
					unpictured(surface.Nodes[key]);

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

		/*
		 * The ship that flies over a surface (Ship of it, SceneLanding): its model in the frame of the surface, in kilometres,
		 * where the ship stands (ShipAt), as large as it is (ShipSize) and turned as it flies (ShipTurn), lit by the star.
		 */
		function drawSurfaceShip (matrix, sun, sunColor) {
			var flying = scene.Surface;
			var hero = scene.Objects[flying.Ship];
			var settings = hero ? trait(hero, 'Model') : null;
			var lists = scene.SurfaceLists = scene.SurfaceLists || {};
			var kept;
			var day;
			var common;

			if (!hero || !settings || !flying.ShipAt || !flying.Eye) return;

			kept = {World: hero.World, Size: hero.Size, Turn: hero.Turn, Eye: scene.Eye};
			hero.World = flying.ShipAt;
			hero.Size = flying.ShipSize;
			hero.Turn = flying.ShipTurn;
			scene.Eye = flying.Eye;

			Object.keys(lists).forEach(function (name) {
				lists[name].Count = 0;
			});

			gatherModel(lists, hero, settings);

			/* What glows of it is not drawn over the surface: its lists start again each frame. */
			Object.keys(scene.GlowLists || {}).forEach(function (name) {
				scene.GlowLists[name].Count = 0;
			});

			day = Math.max(0, Math.min(1, vectors.Dot(sun, flying.Axes.Up) * 3 + 0.2));
			common = Object.assign({uViewProjection: matrix, uCamera: [0, 0, 0], uLightPositions: [sun[0] * 1e6, sun[1] * 1e6, sun[2] * 1e6, 0, 0, 0, 0, 0, 0, 0, 0, 0], uLightColors: [sunColor[0] * 1.15, sunColor[1] * 1.15, sunColor[2] * 1.15, 0, 0, 0, 0, 0, 0, 0, 0, 0], uLightCount: 1, uSkyLight: [0.3 * day + 0.01, 0.38 * day + 0.012, 0.5 * day + 0.02], uFloorLight: [0.12 * day, 0.11 * day, 0.1 * day], uAmbient: [0.05 + 0.12 * day, 0.055 + 0.13 * day, 0.07 + 0.16 * day], uOccluderCount: 0, uOccluders: new Array(16).fill(0), uTime: scene.Time, uHighlight: [0, 0, 0, 0], uWind: 0, uWet: 0, uSnowed: 0, uRainDrops: 0, uEyeAt: [0, 0, 0], uTime2: scene.Seconds % 1000, uMoving: 0, uSteady: 0, uCut: [0, 0, 0, 0]}, idle(), localLights(), self.WindValues(scene.Seconds));

			Object.keys(lists).forEach(function (name) {
				var list = lists[name];
				if (!list.Count) return;

				upload(name, list);

				if (list.Material) renderer.Draw(shape(name), pbrOf(list), Object.assign(Object.create(common), {uOrigin: [0, 0, 0], uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft, uSeasonOn: 0, uDissolve: [0, 0, 1, 0]}, surface(list), blueprintValues(list)), {Cull: list.Material.DoubleSided ? 'none' : 'back'});
				else renderer.Draw(shape(name), gpu.Many, Object.assign(Object.create(common), {uShine: list.Matte ? 8 : 36, uSpecular: list.Matte ? 0.05 : 0.5, uRough: list.Rough, uOrigin: [0, 0, 0], uSeasonOn: 0, uDissolve: [0, 0, 1, 0]}));
			});

			/* Its engines burn as they did in space: its own effects, where it is over the surface. */
			var forward = flying.Look;
			var right = vectors.Normalize(vectors.Cross(forward, flying.ViewUp || flying.Axes.Up));

			engine.EffectsDraw(matrix, {Right: right, Up: vectors.Cross(right, forward), Forward: forward, Near: flying.Near || 0.0001, Far: 1e6, Only: hero.ID});

			hero.World = kept.World;
			hero.Size = kept.Size;
			hero.Turn = kept.Turn;
			scene.Eye = kept.Eye;
		}

		function drawSurface () {
			var surface = scene.Surface;
			var object = scene.Objects[surface.ID];
			var field = surface.Field;
			var width = renderer.Width;
			var height = renderer.Height;
			var aspect = width / Math.max(1, height);
			var near = surface.Near || Math.max(0.0005, surface.Altitude * 0.25);
			var far = Math.max(50, Math.sqrt(surface.Altitude * (2 * field.Radius + surface.Altitude)) * 3 + field.Radius * 0.1);
			var view = math.LookAt([0, 0, 0], surface.Look, surface.ViewUp || surface.Axes.Up);
			var projection = math.Perspective(scene.Camera.Fov, aspect, near, far);
			var matrix = math.Multiply(projection, view);
			var star = scene.Order.filter(function (each) {
				return trait(each, 'Star') && each.World;
			})[0];
			var sun = star && object.World ? math.Apply(math.Invert(object.Turn) || math.Identity(), vectors.Normalize(vectors.Subtract(star.World, object.World))) : [0, 1, 0];
			var sunColor = star ? paint(star.Color).slice(0, 3) : [1, 1, 1];
			var air = object.Look.Atmosphere;
			var nodes = patches();
			var thickness = 100;
			var shade = idle();
			var extent;
			var posted;
			var laid;

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
				renderer.Draw(gpu.Stars, gpu.Far, {uViewProjection: math.Multiply(math.Perspective(scene.Camera.Fov, aspect, 0.1, 200), view), uRatio: renderer.Ratio}, {Depth: false, DepthWrite: false, Blend: 'add'});

			renderer.Draw(gpu.Quad, gpu.Sky, Object.assign({uInverse: math.Invert(matrix), uSun: sun, uSunColor: sunColor, uAir: air, uUp: surface.Axes.Up, uHigh: Math.min(1, surface.Altitude / thickness), uSunRadius: discOf(star, object)}, self.SkyValues(scene.Seconds)), {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});

			laid = groundTiles(surface.Eye, surface.Altitude);

			nodes.forEach(function (node) {
				renderer.Draw(node.Mesh, gpu.Ground, Object.assign({
					uViewProjection: matrix,
					uOffset: vectors.Subtract(node.Center, surface.Eye),
					uCenter: node.Center,
					uSun: sun,
					uSunColor: sunColor,
					uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]),
					uPainted: field.Painted ? 1 : 0,
					uWater: object.Look.Water,
					uIce: object.Look.Ice,
					uAir: air,
					uRadius: field.Radius,
					uTime: scene.Seconds,
					uFog: Math.max(field.Radius * 0.02, far * 0.6),
					uHigh: Math.min(1, surface.Altitude / thickness),
					uRelief: 1,
					uLights: lightsOf(object),
					uLightsOn: lightsOf(object) === noLights() ? 0 : 1,
					uSky: noLights(),
					uCloudsOn: 0
				}, shade, tiled(node), laid), {Cull: 'back'});
			});

			if (surface.Ship)
				drawSurfaceShip(matrix, sun, sunColor);

			if (posted)
				engine.PostEnd(Object.assign({Matrix: matrix, Sun: sun, SunColor: sunColor, Sky: false, Heat: surface.Heat, Clouds: surfaceClouds(surface, object, sun, sunColor)}, lens()));

			forget();
		}

		function frame (now, quiet, still) {
			/*
			 * The time of the game keeps to the clock on a slow machine too (up to a second, a page may have slept); what eases
			 * takes small steps. A clock that goes back (a frame given an earlier time) is no time: what eases backwards ran
			 * away to no number at all, and the view with it.
			 */
			var spent = scene.Last ? Math.max(0, Math.min(1, (now - scene.Last) / 1000)) : 0;
			var elapsed = Math.min(0.1, spent);

			scene.Last = now;

			/* Behind the veil while what the view needs is made (Preparing, the loop of the scene): the game does not go on yet. */
			if (still) {
				spent = 0;
				elapsed = 0;
			}

			self.RunBehaviours('Step', [elapsed, now]);

			if (self.Axes && Math.abs(scene.Yaw - self.ViewYaw) + Math.abs(scene.Pitch - self.ViewPitch) > 0.004) {
				self.ViewYaw = scene.Yaw;
				self.ViewPitch = scene.Pitch;
			}

			/* On a surface the days go at their own speed (a day of two minutes by default), not at the one of the orbits. */
			if (!self.Paused)
				scene.Time += spent * (scene.Surface || scene.Location ? number(self.SurfaceSpeed, 1 / 120) : number(self.Speed, 1));

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

			/* A cutscene sets what it moves first; then the camera that shows the world is placed. */
			if (engine.CinemaStep)
				engine.CinemaStep(elapsed);

			if (engine.CameraStep)
				engine.CameraStep(elapsed);

			engine.TriggersStep();

			if (engine.WeaponsStep)
				engine.WeaponsStep(elapsed);

			if (engine.DebrisStep)
				engine.DebrisStep(elapsed);

			if (engine.PipingStep)
				engine.PipingStep(elapsed);

			if (engine.RigsStep)
				engine.RigsStep(elapsed);

			if (!quiet && renderer && !renderer.Lost && scene.Width && scene.Height) {
				draw();

				adapt(elapsed);

				engine.PostTime(elapsed);

				scene.Painted++;

				/* A recording takes the picture now, while the canvas still holds it (SceneCinema). */
				if (engine.RecordFrame)
					engine.RecordFrame();
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

				if (!object.World || object.Hidden || object.Values.Interactive === false || !(object.Size || least)) return;

				t = math.Hit(ray, object.World, Math.max(object.Size, pixels(object.World, least)));

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
				return Elemenx.Locale.Text('graphics.scene.' + key);
			};
			var parent = parentOf(object);
			var info = describe(object.ID);
			var body = trait(object, 'Body');
			var orbit = trait(object, 'Orbit');
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
			else if (object.Info && object.Info.Rows) {
				/* What a kind of its own tells (SceneDeepSpace): [key, value, unit]. */
				object.Info.Rows.forEach(function (row) {
					add(row[0], row[1], row[2] === 'km' ? t('km') : row[2]);
				});

				kind = t('kinds.' + object.Info.Kind);
			}
			else {
				add('at', parent ? parent.Name : '—');
			}

			if (object.Team)
				add('team', object.Team);

			if (formation) add('ships', object.Parts.length);
			else if (object.Parts.length && !body) add('parts', object.Parts.length);

			if (scene.Travels[object.ID])
				add('heading', scene.Objects[scene.Travels[object.ID].Target].Name);

			if (body && trait(object, 'Surface'))
				kind = t('surfaces.' + trait(object, 'Surface').Type);

			/* What a game tells of it (its health, its orders...): the hook Card of its behaviours adds rows {Key, Label, Value}. */
			self.RunBehaviours('Card', [object, rows]);

			return {ID: object.ID, Name: object.Name, Kind: /^graphics\.scene\./.test(kind) ? object.Kind : kind, Rows: rows, Land: !!(body && !/gas|giant/.test(trait(object, 'Surface') ? trait(object, 'Surface').Type : ''))};
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
			var space = math.Vectors;
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var far = Math.max(scene.Distance * 40, 400);
			var step = Math.max(0.25, far / 600);
			var before = 0;
			var t = 0;
			var low;
			var high;
			var i;

			/* Over the ground, or, of a ground with a volume, in its air (a cave seen through its mouth). */
			function above (at) {
				var p = space.Add(ray.Origin, space.Scale(ray.Direction, at));

				if (field.Volume)
					return p[1] < 0 && field.Height(p[0], p[2]) < 0 ? p[1] : -field.Density(p[0], p[1], p[2]);

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
					return walk(id, [goal.World[0], goal.World[2], goal.World[1] - (goal.Lifted || 0)], callback);

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
		 * The pieces of a model at rest as triangles of its own space, once a model: what a ray is tested against and what a
		 * thing breaks into; the color of each (of its vertices, or of its material) and whether it is glass.
		 */
		function hitMesh (made) {
			var points = [];
			var pieces = [];
			var colors = [];
			var glass = [];
			var min = [Infinity, Infinity, Infinity];
			var max = [-Infinity, -Infinity, -Infinity];

			if (made.HitMesh)
				return made.HitMesh;

			made.Pieces.forEach(function (piece) {
				var g = piece.Geometry;
				var rest = piece.Rest || null;
				var i;
				var k;

				if (!g || !g.Positions) return;

				var material = piece.Material || null;
				var base = material && material.BaseColor ? material.BaseColor : null;
				var clear = !!material && (/glass|window|windscreen|windshield/i.test(material.Name || '') || material.Alpha === 'BLEND' && !material.DoubleSided);

				for (i = 0; i + 2 < (g.Indices ? g.Indices.length : g.Positions.length / 3); i += 3) {
					var tint = [0, 0, 0];

					for (k = 0; k < 3; k++) {
						var c = (g.Indices ? g.Indices[i + k] : i + k) * 3;

						tint[0] += (base ? base[0] : 1) * (g.Colors ? g.Colors[c] : base ? 1 : 0.7) / 3;
						tint[1] += (base ? base[1] : 1) * (g.Colors ? g.Colors[c + 1] : base ? 1 : 0.7) / 3;
						tint[2] += (base ? base[2] : 1) * (g.Colors ? g.Colors[c + 2] : base ? 1 : 0.7) / 3;
					}

					colors.push(tint[0], tint[1], tint[2]);
					glass.push(clear ? 1 : 0);

					for (k = 0; k < 3; k++) {
						var at = (g.Indices ? g.Indices[i + k] : i + k) * 3;
						var p = rest ? math.Apply(rest, [g.Positions[at], g.Positions[at + 1], g.Positions[at + 2]]) : [g.Positions[at], g.Positions[at + 1], g.Positions[at + 2]];

						points.push(p[0], p[1], p[2]);

						min = [Math.min(min[0], p[0]), Math.min(min[1], p[1]), Math.min(min[2], p[2])];
						max = [Math.max(max[0], p[0]), Math.max(max[1], p[1]), Math.max(max[2], p[2])];
					}

					pieces.push(piece);
				}
			});

			made.HitMesh = {Points: new Float32Array(points), Pieces: pieces, Colors: new Float32Array(colors), Glass: new Uint8Array(glass), Min: min, Max: max};

			return made.HitMesh;
		}

		/* The model of an object, how it is placed (turned and sized), and the box of it in the world: {Made, Base, Min, Max}. */
		engine.BodyOf = function (object) {
			var settings = trait(object, 'Model');
			var made = settings && object.World && (settings.Shape || object.Values.Model) ? modelOf(object, settings) : null;
			var mesh;
			var scale;
			var base;
			var min = [Infinity, Infinity, Infinity];
			var max = [-Infinity, -Infinity, -Infinity];

			if (!made)
				return null;

			mesh = hitMesh(made);

			if (!isFinite(mesh.Min[0])) return null;

			scale = object.Scaled || vectors.Scale(settings.Scale || [1, 1, 1], object.Size);
			base = math.Multiply(object.Turn || math.Identity(), math.Scaling(scale[0], scale[1], scale[2]));

			[0, 1].forEach(function (a) {
				[0, 1].forEach(function (b) {
					[0, 1].forEach(function (c) {
						var p = vectors.Add(object.World, math.Apply(base, [a ? mesh.Max[0] : mesh.Min[0], b ? mesh.Max[1] : mesh.Min[1], c ? mesh.Max[2] : mesh.Min[2]]));

						min = [Math.min(min[0], p[0]), Math.min(min[1], p[1]), Math.min(min[2], p[2])];
						max = [Math.max(max[0], p[0]), Math.max(max[1], p[1]), Math.max(max[2], p[2])];
					});
				});
			});

			return {Made: made, Base: base, Min: min, Max: max, Mesh: mesh};
		};

		/*
		 * Where a ray ({Origin, Direction}) meets the model of an object, nearer than far: its box first, then each triangle
		 * of its pieces at rest, in the space of the model. {Distance, Point, Normal, Piece, Height (0 its foot, 1 its top)}.
		 */
		engine.ModelHit = function (object, ray, far) {
			var body = engine.BodyOf(object);
			var inverse;
			var origin;
			var way;
			var mesh;
			var near = far;
			var best = null;
			var enter = 0;
			var leave = far;
			var axis;
			var i;

			if (!body)
				return null;

			mesh = body.Mesh;
			inverse = math.Invert(body.Base);

			if (!inverse) return null;

			origin = math.Apply(inverse, vectors.Subtract(ray.Origin, object.World));
			way = vectors.Subtract(math.Apply(inverse, ray.Direction), math.Apply(inverse, [0, 0, 0]));

			/* The box, in the space of the model: the same distance along the ray as in the world. */
			for (axis = 0; axis < 3; axis++) {
				if (Math.abs(way[axis]) < 1e-12) {
					if (origin[axis] < mesh.Min[axis] || origin[axis] > mesh.Max[axis]) return null;

					continue;
				}

				var t1 = (mesh.Min[axis] - origin[axis]) / way[axis];
				var t2 = (mesh.Max[axis] - origin[axis]) / way[axis];

				enter = Math.max(enter, Math.min(t1, t2));
				leave = Math.min(leave, Math.max(t1, t2));
			}

			if (enter > leave) return null;

			for (i = 0; i < mesh.Pieces.length; i++) {
				var p = mesh.Points;
				var o = i * 9;
				var e1 = [p[o + 3] - p[o], p[o + 4] - p[o + 1], p[o + 5] - p[o + 2]];
				var e2 = [p[o + 6] - p[o], p[o + 7] - p[o + 1], p[o + 8] - p[o + 2]];
				var h = vectors.Cross(way, e2);
				var a = vectors.Dot(e1, h);
				var f;
				var s;
				var u;
				var q;
				var v;
				var t;

				if (Math.abs(a) < 1e-12) continue;

				f = 1 / a;
				s = [origin[0] - p[o], origin[1] - p[o + 1], origin[2] - p[o + 2]];
				u = f * vectors.Dot(s, h);

				if (u < 0 || u > 1) continue;

				q = vectors.Cross(s, e1);
				v = f * vectors.Dot(way, q);

				if (v < 0 || u + v > 1) continue;

				t = f * vectors.Dot(e2, q);

				if (t > 1e-4 && t < near) {
					near = t;
					best = {Distance: t, Piece: mesh.Pieces[i], Local: vectors.Cross(e1, e2), Height: (origin[1] + way[1] * t - mesh.Min[1]) / Math.max(1e-6, mesh.Max[1] - mesh.Min[1])};
				}
			}

			if (!best)
				return null;

			/* The normal back in the world (by the inverse turned over), facing the ray. */
			var n = vectors.Normalize([inverse[0] * best.Local[0] + inverse[1] * best.Local[1] + inverse[2] * best.Local[2], inverse[4] * best.Local[0] + inverse[5] * best.Local[1] + inverse[6] * best.Local[2], inverse[8] * best.Local[0] + inverse[9] * best.Local[1] + inverse[10] * best.Local[2]]);
			if (vectors.Dot(n, ray.Direction) > 0)
				n = vectors.Scale(n, -1);

			return {Distance: best.Distance, Point: vectors.Add(ray.Origin, vectors.Scale(ray.Direction, best.Distance)), Normal: n, Piece: best.Piece, Height: best.Height};
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
		engine.SurfaceClose = closeSurface;
		engine.HorizonClose = closeHorizon;

		/* The names over the objects shown or not (a ship down in a location hides those of space). */
		engine.LabelsHidden = function (hidden) {
			labels.hidden = !!hidden;
		};

		engine.ToScreen = function (id) {
			var object = scene.Objects[id];
			var spot;

			if (!object || !object.World) return null;

			spot = scene.Camera.Project(object.World, scene.Width, scene.Height);

			return {X: spot.X, Y: spot.Y, Visible: spot.Visible};
		};

		build();

		scene.Watcher = new MutationObserver(declarations);

		scene.Watcher.observe(element.querySelector('.elemenx-scene-sources'), {subtree: true, childList: true, attributes: true, attributeFilter: ['data-value']});

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

		/* A scene out of view sleeps, and an expensive frame leaves the page as much time after it. */
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
			var stages = [{Name: 'programs', Done: left.Done, Total: left.Total}, {Name: 'models', Done: models.filter(function (name) {
				return library.Ready(name);
			}).length, Total: models.length}].concat(scene.Preparing ? preparing() : []);
			var shares = 0;
			var done = 0;
			var stage = '';
			var part;
			var shown;

			/* Each stage a like share of the way, whatever its count; the first not done is the one it is at. */
			stages.forEach(function (one) {
				if (!one.Total) return;

				shares++;
				done += Math.min(1, one.Done / one.Total);

				if (!stage && one.Done < one.Total)
					stage = one.Name;
			});

			if (!stage && scene.Preparing)
				stage = 'view';

			/* Never back: a stage that finds more to make holds the bar where it was. */
			part = stage ? Math.min(99, Math.max(scene.LoadingLeast || 0, Math.floor(done * 100 / Math.max(1, shares)))) : null;
			scene.LoadingLeast = part || 0;

			/*
			 * The bar shows while the scene is made ready, and while no picture can be drawn; what the play asks for later comes
			 * behind the page; a location coming on its own shows it only once it waits a while.
			 */
			shown = part !== null && (scene.Preparing ? !scene.Soft || window.performance.now() - (scene.PrepareSince || 0) > 500 : !scene.WasPrepared || left.Needed > 0) ? part : null;

			/* All that is left may be one long thing behind the page: a bar that stands still would look stuck. */
			self.LoadingEndless = left.Needed === 0 && left.Done < left.Total;

			if (self.Loading !== shown || self.LoadingStage !== stage) {
				self.Loading = shown;
				self.LoadingStage = stage;
				self.LoadingText = stageText(stage);

				self.$Emit('loading', {Part: part === null ? 100 : part, Stage: stage});
			}

			return left.Needed > 0;
		}

		/* What the view still waits for, stage by stage: the globes painted (strips of them), the squares of its ground, what grows round the eye. */
		function preparing () {
			var globes = {Name: 'globes', Done: 0, Total: 0};
			var flowing = {Name: 'rivers', Done: 0, Total: 0};
			var ground = scene.Ground;
			var made;
			var grown;

			scene.Order.forEach(function (object) {
				/* On the ground of a location no globe is drawn: none is waited for (see waiting). */
				if (ground || !object.World || object.Away || !trait(object, 'Body') || !planetOf(object)) return;

				if (scene.Rivers[object.ID]) {
					flowing.Total += 25;
					flowing.Done += scene.Rivers[object.ID].Done;
				}

				made = scene.Baked[object.ID];
				/* Its lands, then the lights of its settlements: 24 strips each. */
				globes.Total += 48;
				globes.Done += made ? (made.Painted ? 24 : made.Strips || 0) + (made.Lit ? 24 : made.LitStrips || 0) : 0;
			});

			if (!ground)
				return [flowing, globes];

			grown = engine.ScatterProgress ? engine.ScatterProgress(240) : {Done: 0, Total: 0};

			return [flowing, globes, {Name: 'ground', Done: Object.keys(ground.Nodes).length, Total: Object.keys(ground.Nodes).length + (ground.Missing === undefined ? 1 : ground.Missing)}, {Name: 'plants', Done: grown.Done, Total: grown.Total}];
		}

		/* The words of a stage of the loading. */
		function stageText (stage) {
			var words = {programs: Elemenx.Locale.Text('graphics.scene.stagePrograms'), models: Elemenx.Locale.Text('graphics.scene.stageModels'), rivers: Elemenx.Locale.Text('graphics.scene.stageRivers'), globes: Elemenx.Locale.Text('graphics.scene.stageGlobes'), ground: Elemenx.Locale.Text('graphics.scene.stageGround'), plants: Elemenx.Locale.Text('graphics.scene.stagePlants'), view: Elemenx.Locale.Text('graphics.scene.stageView')};

			return words[stage] || '';
		}

		var fps = this.$Service('FPS');
		var source = fps.Name('Scene');
		var timer = {Ext: undefined, Queries: [], Open: null};

		/* Gone, it tells no more: the meter leaves it out. */
		scene.FPSSource = source;

		/* The time the card spent on a frame, by a query of the GPU, told to the FPS Service a few frames later, when it is known. */
		function gpuBegin () {
			var gl = renderer && !renderer.Lost ? renderer.GL : null;
			if (!gl) return;

			if (timer.Ext === undefined)
				timer.Ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') || null;

			if (!timer.Ext || timer.Queries.length > 4) return;

			timer.Open = gl.createQuery();

			gl.beginQuery(timer.Ext.TIME_ELAPSED_EXT, timer.Open);
		}

		function gpuEnd () {
			var gl = renderer ? renderer.GL : null;
			var query;
			var spent;

			if (!gl || !timer.Open) return;

			gl.endQuery(timer.Ext.TIME_ELAPSED_EXT);

			timer.Queries.push(timer.Open);
			timer.Open = null;

			while (timer.Queries.length && gl.getQueryParameter(timer.Queries[0], gl.QUERY_RESULT_AVAILABLE)) {
				query = timer.Queries.shift();
				spent = gl.getQueryParameter(query, gl.QUERY_RESULT);

				gl.deleteQuery(query);

				/* A frame the card was taken from in the middle of is not told. */
				if (!gl.getParameter(timer.Ext.GPU_DISJOINT_EXT))
					fps.Report(source, {Gpu: spent / 1e6});
			}
		}

		/*
		 * What the view still waits for: the globes of planets not painted all, the squares of a ground not made as fine as
		 * the eye needs, what grows round the eye not sown. 0: all is there.
		 */
		function waiting () {
			var left = 0;

			/*
			 * Regression: on the ground of a location the globes are drawn no more, neither the near one of its body nor the
			 * paint of the others (a moon): what they still missed was never made, and the veil over the location never went.
			 * There, the view waits for its ground and what grows on it alone.
			 */
			if (scene.Ground)
				return (scene.Ground.Missing === undefined ? 1 : scene.Ground.Missing) + (engine.ScatterPending ? engine.ScatterPending(240) : 0) + (renderer ? renderer.Progress().Needed : 0);

			scene.Order.forEach(function (object) {
				var made;

				if (!object.World || object.Away || !trait(object, 'Body') || !planetOf(object)) return;

				made = scene.Baked[object.ID];

				if (!made || !made.Painted || !made.Lit)
					left++;
			});

			/* A globe near: its squares as fine as the eye needs. */
			Object.keys(scene.Globes).forEach(function (id) {
				left += scene.Globes[id].Missing || 0;
			});

			return left;
		}

		/*
		 * The scene starts (and goes on after engine.Prepare: a ship comes into a location) behind a veil, its time still,
		 * until all the view needs is made, three drawn frames in a row; then the veil goes in 0.4 s. The veil of the scene is
		 * the darker of it and the one of a passage (scene.Passing, SceneLanding).
		 */
		function prepareStep (now, drawn) {
			var spent = scene.Prepared ? Math.min(0.1, Math.max(0, (now - scene.Prepared) / 1000)) : 0;
			var veil;

			scene.Prepared = now;

			if (scene.Preparing && drawn) {
				scene.Ready = waiting() ? 0 : (scene.Ready || 0) + 1;

				if (scene.Ready >= 3) {
					scene.Preparing = false;

					self.$Emit('prepared', {First: !scene.WasPrepared});

					scene.WasPrepared = true;
				}
			}

			/* Soft (a location beside came on its own): dark only if it keeps waiting. */
			scene.Cover = scene.Preparing ? scene.Soft ? Math.min(1, (scene.Cover || 0) + spent / 0.3) : 1 : Math.max(0, (scene.Cover || 0) - spent / 0.8);
			veil = Math.round(Math.max(scene.Cover, scene.Passing || 0) * 100) / 100;

			if (self.Veiled !== veil)
				self.Veiled = veil;
		}

		/* What the view needs is made again before the game goes on (a location came): behind the veil. */
		engine.Prepare = function (soft) {
			scene.Preparing = true;
			scene.PrepareSince = window.performance.now();
			scene.LoadingLeast = 0;
			scene.Soft = !!soft;
			scene.Ready = 0;
		};

		engine.Waiting = waiting;

		scene.Preparing = !!renderer;
		scene.Cover = scene.Preparing ? 1 : 0;

		scene.Loop = this.$Service('Loop').Create({Window: view, Render: function (part, loop) {
			var started = view.performance ? view.performance.now() : Date.now();
			var watched = fps.Watching() && !scene.Gone;
			var ended;

			/* The time of the frame the screen shows, not of when its turn came: an uneven turn would shake all that moves. */
			var now = loop.Now === null ? started : loop.Now;

			if (renderer && !scene.Warmed) {
				scene.Warmed = true;

				engine.PostWarm();
				engine.ScatterWarm();
				engine.EffectsWarm();
			}

			/*
			 * Out of sight it sleeps: nothing moves, nothing is drawn, and seen again it goes on from where it stopped (its time
			 * does not run meanwhile). Many scenes of a page went on all the time, each a part of every frame.
			 */
			if (!scene.Seen) {
				scene.Last = now;

				return;
			}

			if (loading()) {
				frame(now, true, scene.Preparing && scene.Cover >= 1);

				prepareStep(now, false);

				if (watched)
					fps.Report(source, {Quiet: 1});

				return;
			}

			/* What a person steers skips no frame: a gap in the picture reads as a shake of the view. */
			if (started < scene.Rest && !scene.Hero) {
				frame(now, true, scene.Preparing && scene.Cover >= 1);

				if (watched)
					fps.Report(source, {Skipped: 1});

				return;
			}

			if (watched)
				gpuBegin();

			/* Here a frame need not wait for what the card makes behind it; one asked for by hand does. */
			scene.Looping = true;

			frame(now, false, scene.Preparing && scene.Cover >= 1);

			scene.Looping = false;

			prepareStep(now, true);

			ended = view.performance ? view.performance.now() : Date.now();
			scene.Rest = ended - started > 24 ? ended + Math.min(1000, ended - started) : 0;

			if (watched) {
				gpuEnd();

				fps.Report(source, {Cpu: ended - started, Quiet: 0, Skipped: 0});
			}
		}});

		/*
		 * Regression: with no WebGL (none given: a page past the contexts a browser keeps) there is no picture to make, and
		 * the frames ran what only a renderer starts (the vehicles, the weather) and threw at each. The scene says error and
		 * ready, shows that it cannot draw, and its methods answer, but no frame goes.
		 */
		if (renderer) scene.Loop.Start();
		else this.Unsupported = true;

		this.RoadsStart();
		this.FootingsStart();
		this.TriggersStart();
		this.RigidStart();
		this.FractureStart();
		this.PipingStart();
		this.CameraStart();
		this.CinemaStart();

		if (renderer) {
			this.ScatterStart();
			this.LightingStart();
			this.ProbesStart();
			this.EffectsStart();
			this.WeaponsStart();
			this.DebrisStart();
			this.DeepSpaceStart();
			this.CosmosStart();
			this.VehiclesStart();
			this.LandingStart();
			this.ScreensStart();
		}

		this.Behaving = true;

		this.RunBehaviours('Start', [this]);

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

		this.RunBehaviours('Stop', []);

		this.Behaving = false;
		this.Behaviours().length = 0;


		scene.Loop.Stop();
		scene.Watcher.disconnect();

		if (this.Engine().ScreensStop)
			this.Engine().ScreensStop();

		if (scene.FPSSource)
			this.$Service('FPS').Forget(scene.FPSSource);

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

	/*
	 * Behaviours of a scene: what a component inside it (a game: GameStrategy, GameRace; see the trait SceneBehaviour) or
	 * code adds to what the scene does, by hooks the scene itself needs none of: Start(scene) once it runs (at once, when it
	 * runs already), Step(elapsed, now) every frame before it is drawn (seconds since the last, the time of the frame),
	 * Pointer(kind, event) (kind down, move, up, wheel or double) and Key(event), KeyUp(event): true takes the press from
	 * the scene; Stop() as the scene goes. AddBehaviour(behaviour) returns the function that detaches it.
	 */
	AddBehaviour: function (behaviour) {
		var self = this;

		this.Behaviours().push(behaviour);

		if (this.Behaving && typeof behaviour.Start === 'function')
			behaviour.Start(this);

		return function () {
			var at = self.Behaviours().indexOf(behaviour);
			if (at === -1) return;

			self.Behaviours().splice(at, 1);

			if (self.Behaving && typeof behaviour.Stop === 'function')
				behaviour.Stop();
		};
	},

	/* A hook of every behaviour, in the order they came; whether one took it (returned true). */
	RunBehaviours: function (hook, args) {
		var taken = false;

		(this.Behaviours ? this.Behaviours() : []).slice().forEach(function (behaviour) {
			if (typeof behaviour[hook] === 'function' && behaviour[hook].apply(behaviour, args) === true)
				taken = true;
		});

		return taken;
	},

	PointerDown: function (event) {
		if (this.RunBehaviours('Pointer', ['down', event])) return;
		if (this.ScreenPointer && this.ScreenPointer('down', event)) return;
		if (this.WeaponsPointer && this.WeaponsPointer('down', event)) return;

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

		/* Over a surface a ship flies over, the view goes round it as round a ship in space. */
		var looking = scene.Surface && !scene.Surface.Ship;

		scene.Drag = {X: point.X, Y: point.Y, LastX: point.X, LastY: point.Y, Yaw: looking ? scene.Surface.Yaw : scene.Yaw, Pitch: looking ? scene.Surface.Pitch : scene.Pitch, Moved: false, Button: event.button, Pan: !scene.Hero && (event.button === 1 || event.shiftKey)};
	},

	PointerMove: function (event) {
		if (this.RunBehaviours('Pointer', ['move', event])) return;
		if (this.ScreenPointer && this.ScreenPointer('move', event)) return;

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

		if (!drag) {
			this.HoverAt(point);

			return;
		}

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

		/* On the ground the eye looks round: right to turn right, up to look up (a ship over it: round it, as in space). */
		if (scene.Surface && !scene.Surface.Ship) {
			scene.Surface.Yaw = drag.Yaw + (point.X - drag.X) * 0.004;
			scene.Surface.Pitch = Math.max(-1.55, Math.min(1.4, drag.Pitch - (point.Y - drag.Y) * 0.004));

			return;
		}

		scene.Looked = performance.now();
		scene.Yaw = drag.Yaw - (point.X - drag.X) * 0.006;
		scene.Pitch = Math.max(-1.5, Math.min(1.5, drag.Pitch + (point.Y - drag.Y) * 0.006));
	},

	/*
	 * What is under the pointer as it moves (no button down), looked for now and then: hover tells it ({ID, Object, Info};
	 * ID empty when it left). What may be marked is for HoverCheck to say (without it, all but the walker or the vehicle
	 * under the keys and their parts), how for HoverMark (none by default) and the cursor over it for its Cursor.
	 * Interactive: false on an object keeps it out.
	 */
	HoverAt: function (point) {
		var scene = this.Scene();
		var engine = this.Engine();
		var now = performance.now();
		var own = null;
		var hero;
		var id;
		var picked;

		if (now - (scene.HoverAt || 0) < 50 || scene.Hero && this.Captured()) return;

		scene.HoverAt = now;
		id = engine.Pick(point.X, point.Y, false) || '';
		picked = id ? scene.Objects[id] : null;

		if (id && typeof this.HoverCheck === 'function') {
			own = this.HoverCheck(this.Get(id), engine.Describe(id));

			if (own === false || own === null)
				id = '';
		}
		else if (id && scene.Hero) {
			hero = scene.Objects[scene.Hero];

			if (picked === hero || picked && hero && picked.Root === hero)
				id = '';
		}

		if (id === (scene.Hovering || '')) return;

		scene.Hovering = id;
		scene.HoverOwn = id && own && typeof own === 'object' ? own : null;
		this.$Element().querySelector('.elemenx-scene-canvas').style.cursor = id ? engine.Mark('hover').Cursor : '';

		this.$Emit('hover', {ID: id, Object: id ? this.Get(id) : null, Info: id ? engine.Describe(id) : null});
	},

	PointerUp: function (event) {
		if (this.RunBehaviours('Pointer', ['up', event])) return;
		if (this.ScreenPointer && this.ScreenPointer('up', event)) return;

		if (this.WeaponsPointer)
			this.WeaponsPointer('up', event);

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

		/* A point of a body picked to come down to (the command Landing). */
		if (scene.Picking && drag && !drag.Moved) {
			this.Engine().LandingPick(point.X, point.Y);

			return;
		}

		if (scene.Hero) return;

		if (drag && !drag.Moved && !scene.Surface && drag.Button === 2 && scene.Ground) this.OrderAt(point);
		else if (drag && !drag.Moved && !scene.Surface) this.Engine().Select(this.Allowed(this.Engine().Pick(point.X, point.Y)));
	},

	/* What a press may select, as SelectCheck says: the ID, or '' when it says no. */
	Allowed: function (id) {
		if (!id || typeof this.SelectCheck !== 'function') return id || '';

		return this.SelectCheck(this.Get(id), this.Engine().Describe(id)) === false ? '' : id;
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

	/* A right press on a ground: the selected walker goes there, with Orders. */
	OrderAt: function (point) {
		var scene = this.Scene();
		var at = this.Engine().GroundAt(point.X, point.Y);
		var walker = scene.Selected ? scene.Objects[scene.Selected] : null;
		if (!(this.Orders === true || this.Orders === 'true') || !at || !walker || !walker.Traits.Walker) return;

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
		if (this.RunBehaviours('Pointer', ['wheel', event])) return;
		if (this.ScreenPointer && this.ScreenPointer('wheel', event)) return;

		var amount = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
		var surface = this.Scene().Surface;

		event.preventDefault();

		/* On the ground the wheel is the altitude: down to the height of an eye, up to where the air ends (a ship over it: near or far, as in space). */
		if (surface && !surface.Ship) {
			if (!surface.Rising)
				surface.Wanted = Math.max(0.0015, Math.min(surface.Field.Radius, surface.Wanted * Math.exp(amount * 0.0015)));

			return;
		}

		this.ZoomTo(this.Scene().Wanted * Math.exp(amount * 0.0012));
	},

	Double: function (event) {
		if (this.RunBehaviours('Pointer', ['double', event])) return;

		var engine = this.Engine();
		var point = engine.Local(event);
		var id = engine.Pick(point.X, point.Y);
		if (id && !this.Scene().Hero)
			this.FocusOn(id);
	},

	LabelPressed: function (event) {
		var button = event.target.closest ? event.target.closest('[data-id]') : null;
		if (button && this.Allowed(button.getAttribute('data-id')))
			this.Engine().Select(button.getAttribute('data-id'));
	},

	LabelDouble: function (event) {
		var button = event.target.closest ? event.target.closest('[data-id]') : null;
		if (button && !this.Scene().Hero)
			this.FocusOn(button.getAttribute('data-id'));
	},

	Key: function (event) {
		if (this.RunBehaviours('Key', [event])) return;
		/* What is typed into a screen goes to it, not to the scene. */
		if (this.ScreenTyped && this.ScreenTyped(event)) return;
		if (this.CinemaKey && this.CinemaKey(event)) return;

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
		if (this.RunBehaviours('KeyUp', [event])) return;
		if (this.ScreenTyped && this.ScreenTyped(event)) return;

		var scene = this.Scene();

		delete scene.Keys[event.code];

		if (scene.Surface)
			delete scene.Surface.Keys[event.code];

		if (scene.Ground)
			delete scene.Ground.Keys[event.code];
	},

	Blurred: function () {
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

		scene.Added.push({ID: spec.ID, Kind: spec.Kind || '', Parent: spec.Parent, Values: Object.assign({}, spec.Values || {}, made.Values), Traits: this.$Service('SceneKinds').MergeTraits(made.Traits, spec.Traits || {}), Parts: spec.Parts || []});
	},

	/* Where a socket of the model of an object is (a part of the role socket, by its Name or ID): {At [x, y, z], Axis}, or null. */
	Socket: function (id, name) {
		var object = this.Scene().Objects[id];

		return object && this.Engine().SocketOf ? this.Engine().SocketOf(object, name) : null;
	},

	/*
	 * An object a World made (Generated: the houses of a village, a road of its Roads) made an object of the scene of its own,
	 * as it is now: its changes in it, made no more of the World, saved as any other. false for what was not made so.
	 */
	Unlink: function (id) {
		var scene = this.Scene();
		var object = scene.Objects[id];
		var values;

		if (!object || !object.Values.Generated) return false;

		values = JSON.parse(JSON.stringify(object.Values));

		delete values.Generated;
		delete scene.Overrides[id];

		scene.Added.push({ID: id, Kind: object.Kind || '', Parent: '', Values: values, Traits: JSON.parse(JSON.stringify(object.Traits || {})), Parts: []});

		this.Engine().Compose();

		return true;
	},

	/* Changes the fields of an object (or of a part): each to its trait by its name in any case, {Traits} as they are. */
	Change: function (id, changes) {
		var scene = this.Scene();
		var object = scene.Objects[id];
		var kinds = this.$Service('SceneKinds');
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
		var kinds = this.$Service('SceneKinds');
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
		var kinds = this.$Service('SceneKinds');
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
		return this.Scene().Objects[id] || null;
	},

	Objects: function (filter) {
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
		this.Engine().Select(Array.isArray(id) ? id[0] || '' : id || '');
	},

	Selection: function () {
		var selected = this.Scene().Selected;

		return selected ? [selected] : [];
	},

	Control: function (id) {
		return this.Engine().Control(id);
	},

	FocusOn: function (id) {
		return this.Engine().FocusOn(id || '');
	},

	Move: function (id, target, callback) {
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

	/* The season now: {Warmth, Rising, Bare, Turn, Blossom, Dry, Snow} (Season, or of the sun), null with no ground. */
	SeasonState: function () {
		var ground = this.Scene().Ground;

		return ground && ground.Season ? Object.assign({}, ground.Season) : null;
	},

	/* Where an object is on the canvas. */
	ToScreen: function (id) {
		this.Engine().Place(this.Scene().Time);

		return this.Engine().ToScreen(id);
	},

	/* The ID of what is at a point of the page: of what can be selected, or with all of any object (an editor's). */
	Pick: function (clientX, clientY, all) {
		var box = this.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();

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
		var box = this.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();
		var spot = this.Engine().Project(point);

		return {X: spot.X + box.left, Y: spot.Y + box.top, Depth: spot.Depth, Visible: spot.Visible};
	},

	/* The ray of the view through a point of the page ({Origin, Direction}), and the point of the ground it meets (null: none). */
	Ray: function (clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();

		return this.Engine().Ray(clientX - box.left, clientY - box.top);
	},

	GroundAt: function (clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();

		return this.Engine().GroundPoint(clientX - box.left, clientY - box.top);
	},

	/* The orbit of an object round its parent that puts it under a point of the page: {Distance, Anomaly}; null when none can. */
	OrbitAt: function (id, clientX, clientY) {
		var box = this.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();

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
		var kinds = this.$Service('SceneKinds');
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

		/* What was dug out of the ground, as it was dug; what was changed by hand of what is sown. */
		saved.Digs = JSON.parse(JSON.stringify(scene.Digs));

		/* Its cutscenes, as data. */
		if (this.Cutscenes && Object.keys(this.Cutscenes).length)
			saved.Cutscenes = JSON.parse(JSON.stringify(this.Cutscenes));

		if (this.Engine().SownEdits)
			saved.Sown = this.Engine().SownEdits();

		if (options && options.Baked || scene.Loaded) {
			/* What a World makes is made again of it. */
			saved.Objects = scene.Roots.filter(function (object) {
				return !object.Values.Generated;
			}).map(function (object) {
				return Object.assign(kinds.Diff(object), {Parent: object.Parent || ''});
			});

			/* What was changed of what a World makes: made again of it, the changes over it. */
			saved.Generated = {Removed: Object.keys(scene.Removed), Overrides: {}};

			Object.keys(scene.Overrides).forEach(function (id) {
				if (scene.Objects[id] && scene.Objects[id].Values.Generated)
					saved.Generated.Overrides[id] = JSON.parse(JSON.stringify(scene.Overrides[id]));
			});

			return saved;
		}

		/* What is made of another object (the houses of a village) is made again of it. */
		saved.Added = JSON.parse(JSON.stringify(scene.Added.filter(function (added) {
			return !(added.Values && added.Values.Generated);
		})));
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

	/*
	 * Digs a hole in the ground: a sphere of radius metres cut out of its volume round at ([x, y, z]), the squares round it
	 * made again, what stood there set down again; kept in Save. false where there is no ground of noise. Emits dig.
	 */
	Dig: function (at, radius) {
		var scene = this.Scene();
		var made;

		if (!scene.Ground || !scene.Ground.Field || scene.Ground.Field.Whole || !Array.isArray(at)) return false;

		made = {Type: 'sphere', At: [Number(at[0]) || 0, Number(at[1]) || 0, Number(at[2]) || 0], Radius: Math.max(0.2, Number(radius) || 2)};

		scene.Digs.push(made);

		this.$Emit('dig', {At: made.At.slice(), Radius: made.Radius});

		return true;
	},

	/* A saved game shown again: its objects alone, at its time; or a map (its JSON or its URL), called back when it came. */
	Load: function (saved, callback) {
		var scene = this.Scene();
		var kinds = this.$Service('SceneKinds');

		if (!saved) return;

		/* Baked: its objects as they were; a recipe: what the Seed and the template make, its changes over them. */
		if (saved.Objects) {
			scene.Loaded = saved.Objects.map(function (each) {
				return {ID: each.ID, Parent: each.Parent, Restored: kinds.Restore(each)};
			});
			scene.Added = [];
			scene.Removed = {};
			scene.Overrides = JSON.parse(JSON.stringify(saved.Generated && saved.Generated.Overrides || {}));

			(saved.Generated && saved.Generated.Removed || []).forEach(function (id) {
				scene.Removed[id] = true;
			});
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

		if (saved.Cutscenes)
			this.Cutscenes = JSON.parse(JSON.stringify(saved.Cutscenes));

		if (saved.Sown && this.Engine().SownEdits)
			this.Engine().SownEdits(saved.Sown);

		/* What was dug: another list makes the ground again. */
		if (JSON.stringify(saved.Digs || []) !== JSON.stringify(scene.Digs)) {
			scene.Digs = JSON.parse(JSON.stringify(saved.Digs || []));

			if (scene.Ground)
				scene.Ground.Shape = '';
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

	/* A ship near a body to its parking orbit, then round it by itself (SceneLanding); false when it cannot go. */
	ToOrbit: function (id) {
		var object = this.Scene().Objects[id];

		return !!object && !!this.Engine().ShipToOrbit && this.Engine().ShipToOrbit(object);
	},

	/*
	 * Makes ready beforehand what the scene will need, so it comes with no wait: names of models (loaded), {World} of a
	 * ground (made, and the squares an eye over its middle needs: the next ground of that World takes them), {Planet,
	 * Radius} of a planet of ScenePlanet (its globe painted into the store of the browser). callback(error, {Done}) once
	 * all came (the first error, if any).
	 */
	Preload: function (list, callback) {
		var engine = this.Engine();
		var library = this.$Service('SceneModels');
		var items = [].concat(list || []);
		var left = items.length + 1;
		var failed = null;
		var done = 0;

		function came (error) {
			failed = failed || error || null;

			if (!error)
				done++;

			if (!--left && callback)
				callback(failed, {Done: done - 1});
		}

		items.forEach(function (item) {
			if (typeof item === 'string') {
				library.Load(item, came);

				return;
			}

			if (item && item.World) {
				engine.PrefetchGround(item.World, [0, 60, 0]);

				came(null);

				return;
			}

			if (item && item.Planet) {
				engine.PreloadGlobe(Object.assign({}, typeof item.Planet === 'string' ? JSON.parse(item.Planet) : item.Planet, {Radius: Number(item.Radius) || 6371}), came);

				return;
			}

			came(new Error('Elemenx Scene: nothing to preload of ' + JSON.stringify(item)));
		});

		came(null);
	},

	/* Down to the surface of a body (not of a giant of gas): at a latitude and a longitude, or under the eye. */
	Land: function (id, options) {
		/* A ship comes down itself (SceneLanding): Body, Latitude and Longitude, or Marker; in a location, X and Y of it. */
		var object = this.Scene().Objects[id];
		if (object && object.Values.Vehicle && object.Values.Vehicle.Kind === 'ship')
			return this.Engine().LandShip ? this.Engine().LandShip(object, options || {}) : false;

		return this.Engine().Land(id, options);
	},

	TakeOff: function (id) {
		var scene = this.Scene();
		var ship = scene.Objects[id || scene.Hero];
		if (ship && ship.Values.Vehicle && ship.Values.Vehicle.Kind === 'ship' && !(scene.Surface && !scene.Surface.Ship)) return this.Engine().ShipTakeOff ? this.Engine().ShipTakeOff(ship) : false;

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

	/*
	 * The water of the library, a water graph: the waves of a lake or of a river (Waves), the normal they make, the sky
	 * and the sun it mirrors by its Fresnel, the depth under it (Body), white where it rushes (Foam), what is round it
	 * on the screen (Reflection) and the fog; it covers a little less where it faces the eye. Its blocks keep the very
	 * sums of the shader it came from.
	 */
	LibraryWater: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/water'));
	},

	/*
	 * The wind of the library, a vertex graph: what sways bends with the square of its height, as far as its Sway and
	 * its Size, each copy at its Phase; the gust of the scene (Wind) moves it round. Its blocks keep the very sums of the
	 * shader it came from.
	 */
	LibraryWind: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/wind'));
	},

	/*
	 * The wind of the grass, a vertex graph as the one of the scene, run for each corner of a blade (blueprintGrass): its
	 * Position the place of the blade on the ground (x and z) and how far up the blade the corner is (y, 0 to 1), its
	 * Normal the way the blade faces, its UV (near: 1 near the eye, 0 far; the reach of the grass), Phase the seed of the
	 * blade, Size how tall it is. It leans the blade (World) and gives the wave over the field in X of the Normal of its
	 * end, which lightens the crests. A wave over the field, one for all the blades of a place; a blade of its own
	 * stirs only near the eye:
	 * wave = sin(gust * 0.9 + x * 0.11 + z * 0.07) * 0.6 + sin(gust * 0.53 - x * 0.05 + z * 0.13) * 0.4,
	 * lean = across * (seed - 0.5) * 0.5 + (0.8, 0.6) * (0.14 + wave * 0.16 * near)
	 *   + (sin(gust * 2.6 + seed * 6.28), cos(gust * 2.1 + seed * 9)) * 0.05 * near * near,
	 * world.xz += lean * y * y * size.
	 */
	LibraryGrass: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/grass'));
	},

	/* The wind of the grass in its shader (blueprintGrass): GrassGraph of the scene, else LibraryGrass, made once. */
	Grassed: function (shaders) {
		if (this.GrassMade === undefined)
			this.GrassMade = this.Made(this.GrassGraph, 'vertex', 'GrassGraph', this.LibraryGrass.bind(this));

		return this.Install(shaders, 'void blueprintGrass(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}', this.GrassMade, 'void blueprintVertex(', 'void blueprintGrass(');
	},

	/*
	 * The wind of the scene in shaders that sway (blueprintWind of the shaders of copies, of skeletons, of what is sown):
	 * its WindGraph, else the one of the library, made once; its uniforms declared where a shader lacks them. A graph
	 * that cannot be made is told once, and nothing sways.
	 */
	Winded: function (shaders) {
		if (this.WindMade === undefined)
			this.WindMade = this.Made(this.WindGraph, 'vertex', 'WindGraph', this.LibraryWind.bind(this));

		return this.Install(shaders, 'void blueprintWind(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}', this.WindMade, 'void blueprintVertex(', 'void blueprintWind(');
	},

	/* The water of the scene in its shader of water: its WaterGraph, else the one of the library (LibraryWater), made once. */
	Watered: function (shaders) {
		if (this.WaterMade === undefined)
			this.WaterMade = this.Made(this.WaterGraph, 'water', 'WaterGraph', this.LibraryWater.bind(this));

		return this.Install(shaders, 'void blueprintWater(inout vec3 color, inout float alpha) {}', this.WaterMade);
	},

	/* The sky of the scene in its shader: its SkyGraph, else the one of the library (LibrarySky), made once. */
	Skied: function (shaders) {
		if (this.SkyMade === undefined)
			this.SkyMade = this.Made(this.SkyGraph, 'sky', 'SkyGraph', this.LibrarySky.bind(this));

		return this.Install(shaders, 'void blueprintSky(inout vec3 color, inout float alpha) {}', this.SkyMade);
	},

	/* The land of the scene in its shader: its LandGraph, else the one of the library (LibraryLand), made once. */
	Landed: function (shaders) {
		if (this.LandMade === undefined)
			this.LandMade = this.Made(this.LandGraph, 'land', 'LandGraph', this.LibraryLand.bind(this));

		return this.Install(shaders, 'void blueprintLand(inout vec3 color, inout float alpha) {}', this.LandMade);
	},

	/* The uniforms of the land of the scene: its parameters and the time. */
	LandValues: function (seconds) {
		return this.LandMade ? this.LandMade.Values({}, {Time: seconds || 0}) : null;
	},

	/*
	 * The land of the library as a graph of its blocks (SceneBlueprints), each the very GLSL of the shader of the land it was:
	 * the grain of the soil, the pools and their rings, the albedo wet or under snow, the Blueprint of the ground over it,
	 * the light of the sun, the sky, the bounce and the lamps, the sheen of what is wet, the haze and the pools that mirror.
	 */
	LibraryLand: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/land'));
	},

	/* The uniforms of the sky of the scene: its parameters and the time. */
	SkyValues: function (seconds) {
		return this.SkyMade ? this.SkyMade.Values({}, {Time: seconds || 0}) : null;
	},

	/*
	 * The sky of the library as a graph of its blocks (SceneBlueprints), each the very GLSL of the shader of the sky it was:
	 * the air by day, the warm band and the pink of dusk, the light round the sun, high wisps, the clouds over all, an
	 * eclipse, the glow of towns, a rainbow, the haze and the ball of the moon, the air over the stars and the disc of the sun.
	 */
	LibrarySky: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/sky'));
	},

	/* The uniforms of the water of the scene: its parameters and the time, as the shader of water has it. */
	WaterValues: function (seconds) {
		return this.WaterMade ? this.WaterMade.Values({}, {Time: seconds || 0}) : null;
	},

	/*
	 * A graph of a kind the scene puts in its shaders: what a prop gives (a graph, its JSON or its GLSL), else the one
	 * of the library (library()). One that cannot be made is told once (null).
	 */
	Made: function (given, kind, prop, library) {
		var made;

		try {
			if (typeof given === 'string')
				given = given.trim().charAt(0) === '{' ? JSON.parse(given) : {type: kind, glsl: given};

			made = this.$Service('Blueprints').Compile(given || library());

			if (made.Type !== kind)
				throw new Error('a ' + made.Type + ' graph is no ' + kind + ' graph');
		}
		catch (error) {
			made = null;

			if (window.console && window.console.warn)
				window.console.warn('Elemenx Scene: the ' + prop + ' cannot be made: ' + error.message);
		}

		return made;
	},

	/*
	 * A graph made in the place of an empty hook of shaders (its function renamed from to to, when given), with the
	 * uniforms and the parts of the shaders it lacks; its lines numbered in the whole shader.
	 */
	Install: function (shaders, hook, made, from, to) {
		var graphics = this.$Service('Renderer');
		var lining = this.$Service('BlueprintShaders');

		if (!made)
			return shaders;

		Object.keys(shaders).forEach(function (name) {
			var text = shaders[name];
			var lines;

			if (typeof text !== 'string' || text.indexOf(hook) === -1) return;

			lines = made.Uniforms.filter(function (uniform) {
				return text.indexOf(' ' + uniform.Name + ';') === -1;
			}).map(function (uniform) {
				return 'uniform ' + uniform.Type + ' ' + uniform.Name + ';';
			}).concat(made.Needs.filter(function (need) {
				return text.indexOf(graphics.Chunks[need]) === -1;
			}).map(function (need) {
				return graphics.Chunks[need];
			}));

			shaders[name] = lining.Lined(text.replace(hook, function () {
				return lines.concat([from ? made.Function.replace(from, to) : made.Function]).join('\n');
			}));
		});

		return shaders;
	},

	/* The uniforms of the wind of the scene: its parameters and the time. */
	WindValues: function (seconds) {
		return this.WindMade ? this.WindMade.Values({}, {Time: (seconds || 0) % 3000}) : null;
	},

	/* The shaders: lit things, copies, faces to the view, lines, far stars; the surfaces of bodies baked and lit. */
	Shaders: function (graphics) {
		var head = '#version 300 es\nprecision highp float;\n';
		var materials = this.$Service('SceneMaterials');

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

			/*
			 * The water: a sea of Gerstner waves (SceneWaves) over a grid round the eye, finer near it, its corners where
			 * the waves take them, calmer where it is shallow (uFloor, the heights of the ground over its size: uFloorSize
			 * [size, on]); a lake or a river (uWaves 0) flat where its mesh lays it. vSurface: the normal of the waves, vCrest
			 * where they break.
			 */
			SeaVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aColor;',
				'uniform mat4 uModel;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uEye;',
				'uniform float uWaves;',
				'uniform sampler2D uFloor;',
				'uniform vec2 uFloorSize;',
				this.$Service('SceneWaves').GLSL,
				'out vec3 vWorld;',
				'out vec3 vColor;',
				'out vec3 vSurface;',
				'out float vCrest;',
				'void main() {',
				'	vColor = aColor;',
				'	vSurface = vec3(0.0, 1.0, 0.0);',
				'	vCrest = 0.0;',
				'	if (uWaves < 0.5) {',
				'		vec4 level = uModel * vec4(aPosition, 1.0);',
				'		vWorld = level.xyz;',
				'		gl_Position = uViewProjection * level;',
				'		return;',
				'	}',
				'	vec2 place = aPosition.xz + uEye.xz;',
				'	float far = length(aPosition.xz);',
				/* How deep the water is there: the waves die away where it is shallow. */
				'	float fade = 1.0;',
				'	if (uFloorSize.y > 1.5) {',
				'		vec2 at = clamp((place / uFloorSize.x + 0.5) * (uFloorSize.y - 1.0), vec2(0.0), vec2(uFloorSize.y - 1.001));',
				'		ivec2 cell = ivec2(floor(at));',
				'		vec2 t = at - vec2(cell);',
				'		float a = mix(texelFetch(uFloor, cell, 0).r, texelFetch(uFloor, cell + ivec2(1, 0), 0).r, t.x);',
				'		float b = mix(texelFetch(uFloor, cell + ivec2(0, 1), 0).r, texelFetch(uFloor, cell + ivec2(1, 1), 0).r, t.x);',
				'		fade = smoothstep(0.0, 6.0, -mix(a, b, t.y));',
				'	}',
				'	vec3 normal;',
				'	float crest;',
				'	vec3 moved = gerstner(place, far, fade, normal, crest);',
				'	vSurface = normal;',
				'	vCrest = crest;',
				'	vWorld = vec3(aPosition.x + moved.x, moved.y - uEye.y, aPosition.z + moved.z);',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
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
				/* An outline: each corner pushed out along its normal, as far as a few pixels are where it is (0: none). */
				'uniform float uOutline;',
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
				/* What a vertex graph of Blueprints does to a corner of a shape: nothing here; a material with a Vertex puts its own in this place. */
				'void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				/* The wind: the vertex graph of the wind of the scene (WindGraph) in this place, run before the Vertex of a material. */
				'void blueprintWind(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				'void main() {',
				'	mat3 basis = mat3(aInstance2.xyz, aInstance3.xyz, aInstance4.xyz);',
				'	mat3 turn = mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz));',
				'	vBody = vec3(length(aInstance2.xyz), length(aInstance3.xyz), length(aInstance4.xyz)) * aPosition;',
				'	vBodyNormal = aNormal;',
				'	vDown = transpose(turn) * vec3(0.0, -1.0, 0.0);',
				'	vWet = vec2(aInstance2.w, aInstance3.w);',
				'	vec3 world = aInstance.xyz + uOrigin + basis * aPosition;',
				'	vec3 bent = normalize(mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz)) * aNormal);',
				'	blueprintWind(aPosition, aNormal, aUV, aInstance.w, aInstance5.a, length(aInstance3.xyz), world, bent);',
				'	blueprintVertex(aPosition, aNormal, aUV, aInstance.w, aInstance5.a, length(aInstance3.xyz), world, bent);',
				'	if (uOutline > 0.0) world += normalize(bent) * uOutline * length(world);',
				'	vWorld = world;',
				'	vNormal = normalize(bent);',
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
				/* An outline: each corner pushed out along its normal, as far as a few pixels are where it is (0: none). */
				'uniform float uOutline;',
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
				/* What a vertex graph of Blueprints does to a corner of a shape: nothing here; a material with a Vertex puts its own in this place. */
				'void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				/* The wind: the vertex graph of the wind of the scene (WindGraph) in this place, run before the Vertex of a material. */
				'void blueprintWind(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				'void main() {',
				'	mat4 moved = posed(aJoints.x) * aWeights.x + posed(aJoints.y) * aWeights.y + posed(aJoints.z) * aWeights.z + posed(aJoints.w) * aWeights.w;',
				'	mat3 basis = mat3(aInstance2.xyz, aInstance3.xyz, aInstance4.xyz);',
				'	mat3 turn = mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz));',
				'	vBody = vec3(length(aInstance2.xyz), length(aInstance3.xyz), length(aInstance4.xyz)) * (moved * vec4(aPosition, 1.0)).xyz;',
				'	vBodyNormal = mat3(moved) * aNormal;',
				'	vDown = transpose(turn) * vec3(0.0, -1.0, 0.0);',
				'	vWet = vec2(aInstance2.w, aInstance3.w);',
				'	vec3 world = aInstance.xyz + uOrigin + basis * (moved * vec4(aPosition, 1.0)).xyz;',
				'	vec3 bent = normalize(mat3(normalize(aInstance2.xyz), normalize(aInstance3.xyz), normalize(aInstance4.xyz)) * mat3(moved) * aNormal);',
				'	blueprintWind(aPosition, aNormal, aUV, 0.0, aInstance5.a, length(aInstance3.xyz), world, bent);',
				'	blueprintVertex(aPosition, aNormal, aUV, 0.0, aInstance5.a, length(aInstance3.xyz), world, bent);',
				'	if (uOutline > 0.0) world += normalize(bent) * uOutline * length(world);',
				'	vWorld = world;',
				'	vNormal = normalize(bent);',
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
				'uniform vec4 uRect;',
				'uniform vec2 uSize;',
				'uniform vec3 uTint;',
				'uniform vec3 uSkyLight;',
				'uniform float uBlur;',
				'uniform float uStrength;',
				'uniform float uOn;',
				/* A mirror that sees as a camera: its picture by the place on the pane, the sides turned. */
				'uniform float uAsCamera;',
				'out vec4 outColor;',
				'void main() {',
				'	vec2 at = uAsCamera > 0.5 ? vec2(1.0 - vUV.x, vUV.y) : (gl_FragCoord.xy / uScreen * 2.0 - 1.0 - uRect.xy) / (uRect.zw - uRect.xy);',
				'	vec3 seen = textureLod(uMirror, at, uBlur * 6.0).rgb;',
				'	float front = step(0.0, dot(vNormal, -vWorld));',
				'	vec2 edge = min(vUV, 1.0 - vUV) * uSize;',
				'	float bevel = 1.0 - smoothstep(0.012, 0.03, min(edge.x, edge.y));',
				'	vec3 back = vec3(0.04, 0.04, 0.045);',
				'	vec3 face = seen * uTint * uStrength + back * (1.0 - uStrength);',
				'	outColor = vec4(mix(back, mix(face, uSkyLight * 1.4 + 0.08, bevel * 0.7), front * uOn), 1.0);',
				'}'
			].join('\n'),

			/*
			 * The glass of a mirror of a model (drawn by the shader of copies): its picture where it is on the screen, in the
			 * shape of the glass, softened by Blur and tinted; it moves with the car, as what moves is told to the frames.
			 */
			MirrorGlass: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'uniform sampler2D uMirror;',
				'uniform vec2 uScreen;',
				'uniform vec4 uRect;',
				'uniform vec3 uTint;',
				'uniform float uBlur;',
				'uniform float uStrength;',
				/* A mirror that sees as a camera: its picture by the place on its pane (its middle, its axes and its size), the sides turned. */
				'uniform float uAsCamera;',
				'uniform vec3 uCenter;',
				'uniform vec3 uRight;',
				'uniform vec3 uUp;',
				'uniform vec2 uSize;',
				'out vec4 outColor;',
				'void main() {',
				'	vec3 off = vWorld - uCenter;',
				'	vec2 at = uAsCamera > 0.5 ? vec2(0.5 - dot(off, uRight) / uSize.x, 0.5 + dot(off, uUp) / uSize.y) : (gl_FragCoord.xy / uScreen * 2.0 - 1.0 - uRect.xy) / (uRect.zw - uRect.xy);',
				'	vec3 seen = textureLod(uMirror, at, uBlur * 6.0).rgb;',
				'	vec3 back = vec3(0.04, 0.04, 0.045);',
				'	outColor = vec4(seen * uTint * uStrength + back * (1.0 - uStrength), 0.0);',
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
				'uniform vec4 uRect;',
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
				'	sky = mix(sky, textureLod(uMirror, (gl_FragCoord.xy / uScreen * 2.0 - 1.0 - uRect.xy) / (uRect.zw - uRect.xy), uFrost * 6.0).rgb, uOn * front);',
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
				'uniform float uFlip;',
				'uniform float uClear;',
				'out vec4 outColor;',
				'void main() {',
				'	float front = step(0.0, dot(vNormal, -vWorld));',
				/* A picture of a canvas has its rows from the top, one the scene drew from the bottom (uFlip); one with clear places (uClear) is as clear there, and seen from behind is not there. */
				'	vec4 seen = texture(uPicture, vec2(vUV.x, uFlip > 0.5 ? vUV.y : 1.0 - vUV.y));',
				'	if (uClear > 0.5) {',
				'		if (front < 0.5 || seen.a < 0.004) discard;',
				'		outColor = vec4(seen.rgb * uBright, seen.a);',
				'		return;',
				'	}',
				'	outColor = vec4(seen.rgb * uBright * front, 1.0);',
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
				'uniform float uScreenMirror;',
				'uniform vec3 uEmissive;',
				'uniform float uClearcoat;',
				'uniform float uWet;',
				'uniform float uSnowed;',
				'uniform float uRainDrops;',
				'uniform float uWind;',
				'uniform vec3 uEyeAt;',
				'uniform float uTime2;',
				/* The season of a plant of a file, as of the Solid one: Bare, Turn, Blossom, Dry; uSeasonOn 1 its leaves turn and fall, 2 green the year round. */
				'uniform vec4 uSeason;',
				'uniform float uSeasonOn;',
				'uniform vec4 uDissolve;',
				'uniform vec3 uDissolveColor;',
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
				/*
				 * A body beamed away or coming (Teleport): it breaks up into sparkling grains in streaks up and down, from the
				 * top, glowing in the color of the beam where it goes; uDissolve [how far, foot, height, phase].
				 */
				'float dissolved(vec3 world, inout vec3 color) {',
				'	if (uDissolve.x <= 0.0) return 0.0;',
				'	float h = clamp((world.y - uDissolve.y) / max(uDissolve.z, 0.01), 0.0, 1.0);',
				'	float grain = noise3((world + uEyeAt) * vec3(30.0, 6.0, 30.0) + vec3(0.0, uDissolve.w, 0.0)) * 0.5 + 0.5;',
				'	float d = grain * 0.8 + (1.0 - h) * 0.2;',
				'	float gone = uDissolve.x * 1.3 - 0.15;',
				'	if (d < gone) discard;',
				'	color = mix(color, uDissolveColor, min(1.0, uDissolve.x * 1.6));',
				'	return max(1.0 - smoothstep(0.0, 0.1, d - gone), uDissolve.x * 0.6) * (0.6 + 0.4 * sin(uDissolve.w * 9.0 + grain * 20.0));',
				'}',
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
				'	ownGlow += uDissolveColor * dissolved(vWorld, albedo) * 3.0;',
				'	blueprintSurface(vWorld, n, vUV, albedo, base.a, ownRough, ownMetal, ownGlow, n);',
				/* The leaves of a tree of a file are what is green of its textures: they turn, thin out to bare branches, blossom. */
				'	if (uSeasonOn > 0.5 && uSeasonOn < 1.5) {',
				'		float leaf = smoothstep(0.01, 0.05, albedo.g - max(albedo.r, albedo.b) * 0.9);',
				'		float tree = fract(sin(dot(floor((vWorld.xz + uEyeAt.xz - vBody.xz) * 0.22), vec2(12.9898, 78.233))) * 43758.5453);',
				'		if (leaf > 0.0) {',
				'			vec3 fall = tree < 0.3 ? vec3(0.62, 0.42, 0.04) : tree < 0.55 ? vec3(0.55, 0.16, 0.02) : tree < 0.8 ? vec3(0.42, 0.05, 0.02) : vec3(0.25, 0.14, 0.05);',
				'			albedo = mix(albedo, fall * (0.7 + 0.6 * dot(albedo, vec3(0.33))), uSeason.y * leaf);',
				'			if (uSeason.x > 0.0 && noise3(vBody * 9.0 + tree * 7.0) * 0.5 + 0.5 < uSeason.x * leaf * 1.08) discard;',
				'			if (uSeason.z > 0.0 && tree < 0.45 && noise3(vBody * 26.0) > 0.35) albedo = mix(albedo, tree < 0.2 ? vec3(0.95, 0.62, 0.72) : vec3(0.95, 0.94, 0.9), uSeason.z * leaf);',
				'		}',
				'		albedo = mix(albedo, albedo * vec3(1.15, 1.0, 0.55), uSeason.w * leaf * 0.5);',
				'	}',
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
				'	vec3 around = aroundLight(vWorld, n, mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5));',
				'	vec3 mirrored = mix(uFloorLight, uSkyLight, reflected.y * 0.5 + 0.5);',
				'	vec3 fresnel = f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(1.0 - nv, 5.0);',
				/* With the reflections of the screen on (uScreenMirror), what a dielectric mirrors is theirs, added over it: not the sky here too. */
				'	float screened = uScreenMirror > 0.5 && (metallic < 0.5 || uClearcoat * (1.0 - uCoatRough) > 1.0 - roughness) ? 0.0 : 1.0;',
				'	total += (albedo * (1.0 - metallic) * around + fresnel * mirrored * screened) * occlusion;',
				'	total += ownGlow;',
				/* Glass lets through what lies behind it, a little darker, and shows the sky the more the flatter it is seen. */
				'	if (uGlass > 0.0) {',
				'		float edge = 0.04 + 0.96 * pow(1.0 - nv, 5.0);',
				'		vec3 shine = total + mirrored * 1.3 * edge;',
				'		float cover = clamp(base.a * (1.0 - uGlass * 0.72) + edge * 0.35 + dot(total, vec3(0.3)), 0.02, 0.8);',
				'		outColor = vec4(pow(min(shine / cover, vec3(8.0)), vec3(1.0 / 2.2)), cover);',
				'		return;',
				'	}',
				/*
				 * What it mirrors, for the picture (the alpha of the scene, MirrorCode): how smooth it is, a metal or not; its coat of
				 * lacquer as smooth as it is, what is wet and looks up as smooth as water. The reflections of the screen work out how much it mirrors from here and how
				 * blurred, of its roughness.
				 */
				'	float sleek = max(max(1.0 - roughness, uClearcoat * (1.0 - uCoatRough)), wet * 0.95 * smoothstep(0.55, 0.95, n.y));',
				'	float code = base.a < 0.99 ? 0.0 : metallic > 0.5 && 1.0 - roughness >= sleek ? 0.36 + sleek * 0.27 : sleek * 0.3;',
				'	outColor = vec4(pow(total, vec3(1.0 / 2.2)), uMoving > 0.5 ? (code > 0.004 ? 0.45 - code * 0.4 : 0.0) : base.a < 0.5 ? base.a : 1.0 - code * 0.45);',
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
				'uniform float uCloudsOnly;',
				'uniform float uDrift;',
				'uniform samplerCube uLights;',
				'uniform float uLightsOn;',
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
				/* The clouds go with the wind, metres a second of real time round the body (uDrift: radians so far), never with its days made fast. */
				'	float turn = uDrift;',
				'	vec3 drifted = vec3(p.x * cos(turn) - p.z * sin(turn), p.y, p.x * sin(turn) + p.z * cos(turn));',
				'	vec4 sky = texture(uSky, drifted);',
				/* Its clouds alone, over its ground drawn of its planet (a globe near): their light, as much of them as there is. */
				'	if (uCloudsOnly > 0.5) {',
				'		vec3 lit = mix(vec3(0.96), uAtmosphere.rgb, uClouds >= 1.0 ? 0.55 * uAtmosphere.a : 0.0) * lighting(vWorld, n, v, 1.0, 0.0);',
				'		outColor = vec4(lit, uClouds > 0.0 ? sky.r : 0.0);',
				'		return;',
				'	}',
				'	vec4 heat = texture(uSky, p);',
				'	if (uKind == 3) color += mix(uColors[2], uColors[3], heat.b) * heat.g * 1.6;',
				'	if (uClouds > 0.0) {',
				'		vec3 haze = mix(vec3(0.96), uAtmosphere.rgb, uClouds >= 1.0 ? 0.55 * uAtmosphere.a : 0.0);',
				'		color = mix(color, haze * lighting(vWorld, n, v, 1.0, 0.0), sky.r);',
				'	}',
				/* Its settlements at night: their light where its sun is down. */
				'	if (uLightsOn > 0.5) color += vec3(1.0, 0.72, 0.38) * texture(uLights, p).r * 1.6 * (1.0 - daylight(vWorld, n)) * (1.0 - (uClouds > 0.0 ? sky.r * 0.7 : 0.0));',
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
				/* How fine its cells of rising gas are: a dwarf boils in small ones, a giant in a few huge. */
				'uniform float uCells;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 p = normalize(vLocal);',
				'	float cells = fbm3(p * uCells + vec3(0.0, uTime * 0.08, uSeed), 4);',
				/* Spots keep to the belts of middle latitudes, each with a bright ring of faculae round it. */
				'	float belt = smoothstep(0.08, 0.2, abs(p.y)) * (1.0 - smoothstep(0.45, 0.62, abs(p.y)));',
				'	float field = fbm3(p * 2.6 + vec3(uSeed, uTime * 0.01, 0.0), 3);',
				'	float spots = smoothstep(0.66, 0.74, field) * belt;',
				'	float faculae = (smoothstep(0.58, 0.66, field) - spots) * belt;',
				'	float limb = pow(max(dot(n, v), 0.0), 0.45);',
				'	vec3 color = uColor * (0.7 + 0.6 * cells) * (0.5 + 0.6 * limb) * (1.0 - spots * 0.55) * (1.0 + faculae * 0.35 * (1.0 - limb));',
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
				/* How much of what glows by itself shows: all of it at night, little by day. */
				'uniform float uNightGlow;',
				/* The season of a plant: Bare, Turn, Blossom, Dry (uSeasonOn 1: its leaves fall and turn; 2: green the year round). */
				'uniform vec4 uSeason;',
				'uniform float uSeasonOn;',
				'uniform vec3 uEyeAt;',
				'uniform vec4 uDissolve;',
				'uniform vec3 uDissolveColor;',
				'out vec4 outColor;',
				'uniform float uSoft;',
				graphics.Chunks.Noise,
				graphics.Chunks.Lights,
				graphics.Chunks.Shadow,
				/*
				 * A body beamed away or coming (Teleport): it breaks up into sparkling grains in streaks up and down, from the
				 * top, glowing in the color of the beam where it goes; uDissolve [how far, foot, height, phase].
				 */
				'float dissolved(vec3 world, inout vec3 color) {',
				'	if (uDissolve.x <= 0.0) return 0.0;',
				'	float h = clamp((world.y - uDissolve.y) / max(uDissolve.z, 0.01), 0.0, 1.0);',
				'	float grain = noise3((world + uEyeAt) * vec3(30.0, 6.0, 30.0) + vec3(0.0, uDissolve.w, 0.0)) * 0.5 + 0.5;',
				'	float d = grain * 0.8 + (1.0 - h) * 0.2;',
				'	float gone = uDissolve.x * 1.3 - 0.15;',
				'	if (d < gone) discard;',
				'	color = mix(color, uDissolveColor, min(1.0, uDissolve.x * 1.6));',
				'	return max(1.0 - smoothstep(0.0, 0.1, d - gone), uDissolve.x * 0.6) * (0.6 + 0.4 * sin(uDissolve.w * 9.0 + grain * 20.0));',
				'}',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 color = pow(min(vColor, vec3(1.0)), vec3(2.2));',
				/*
				 * The leaves of a plant are what is green of it: in autumn they turn, each tree to a color of its own; they thin
				 * out to bare branches as the year goes cold, and come back in spring with the flowers of some trees.
				 */
				'	if (uSeasonOn > 0.5) {',
				'		float leaf = smoothstep(0.01, 0.05, color.g - max(color.r, color.b) * 0.9);',
				'		vec3 cell = floor((vWorld + uEyeAt) * 0.22);',
				'		float tree = fract(sin(dot(cell.xz, vec2(12.9898, 78.233))) * 43758.5453);',
				'		if (uSeasonOn < 1.5 && leaf > 0.0) {',
				'			vec3 fall = tree < 0.3 ? vec3(0.62, 0.42, 0.04) : tree < 0.55 ? vec3(0.55, 0.16, 0.02) : tree < 0.8 ? vec3(0.42, 0.05, 0.02) : vec3(0.25, 0.14, 0.05);',
				'			color = mix(color, fall * (0.7 + 0.6 * dot(color, vec3(0.33))), uSeason.y * leaf);',
				'			if (uSeason.x > 0.0 && noise3(vLocal * 9.0 + tree * 7.0) * 0.5 + 0.5 < uSeason.x * leaf * 1.08) discard;',
				'			if (uSeason.z > 0.0 && tree < 0.45 && noise3(vLocal * 26.0) > 0.35) color = mix(color, tree < 0.2 ? vec3(0.95, 0.62, 0.72) : vec3(0.95, 0.94, 0.9), uSeason.z * leaf);',
				'		}',
				'		color = mix(color, color * vec3(1.15, 1.0, 0.55), uSeason.w * leaf * 0.5);',
				'	}',
				'	color *= 1.0 - uRough * 0.45 + uRough * 0.45 * fbm3(vLocal * 3.0, 3);',
				/* Snow lies on what looks up, thicker where the noise piles it. */
				'	if (uSnowed > 0.0) {',
				/* A plant holds snow on its slopes too: on the cones of a fir, the tops of its blobs. */
				'		float laid = uSnowed * smoothstep(uSeasonOn > 0.5 ? 0.15 : 0.35, uSeasonOn > 0.5 ? 0.5 : 0.8, normalize(vNormal).y + (noise3((vWorld + uEyeAt) * 0.6) * 0.5 - 0.25) * 0.4);',
				'		color = mix(color, vec3(0.86, 0.9, 0.95), laid);',
				'	}',
				'	float beamed = dissolved(vWorld, color);',
				'	vec3 hot = max(vColor - vec3(1.0), 0.0) + uDissolveColor * beamed * 3.0;',
				'	lightShade = sunLit(vWorld, n);',
				'	vec3 sky = mix(uFloorLight, uSkyLight, n.y * 0.5 + 0.5);',
				'	vec3 light = lighting(vWorld, n, v, uShine, uSpecular) - sky + aroundLight(vWorld, n, sky);',
				'	light = (max(light, vec3(0.0)) + localLight(vWorld, n)) * (1.0 - (vWet.x > 0.5 ? clamp(vWet.x - 1.0, 0.0, 1.0) : uWet) * 0.25);',
				'	if (uSoft > 0.0 && uLightCount > 0) {',
				'		vec3 l = normalize(uLightPositions[0] - vWorld);',
				'		float through = pow(max(dot(v, -l), 0.0), 3.0) * 0.8 + max(-dot(n, l), 0.0) * 0.35;',
				'		light += uLightColors[0] * through * lightShade * uSoft * vec3(1.0, 1.05, 0.55);',
				'	}',
				/* What it mirrors (MirrorCode): a little where it shines, as water where it is wet and looks up. */
				'	float wetness = vWet.x > 0.5 ? clamp(vWet.x - 1.0, 0.0, 1.0) : uWet;',
				'	float sleek = max(uShine > 20.0 ? 0.45 : 0.1, wetness * 0.9 * smoothstep(0.55, 0.95, normalize(vNormal).y));',
				'	outColor = vec4(pow(color * light + hot * hot * 4.0 * (0.12 + 0.88 * uNightGlow), vec3(1.0 / 2.2)), uMoving > 0.5 ? 0.45 - sleek * 0.3 * 0.4 : 1.0 - sleek * 0.3 * 0.45);',
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
				/* The colors of a ground that tells them (ScenePlanet): its biomes, its snow, its seas by their depth. */
				'in vec3 aColor;',
				/* Where it is on its square, 0 to 1: for the picture of the square (PatchPicture). */
				'in vec4 aMaterials;',
				'out vec2 vPatch;',
				'out vec3 vPainted;',
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
				'	vPainted = aColor;',
				'	vPatch = aMaterials.xy;',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
				'}'
			].join('\n'),

			Ground: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vDirection;',
				'in vec2 vLand;',
				'in vec3 vPainted;',
				'in vec2 vPatch;',
				'uniform float uPainted;',
				/* The picture of its square (uTiled): colors and how much is water, and the normal of its ground, uTexels a side. */
				'uniform float uTiled;',
				'uniform sampler2D uColorMap;',
				'uniform sampler2D uReliefMap;',
				'uniform float uTexels;',
				'uniform float uWoods;',
				/* Where people live (uDwelt, PatchPicture Use: fields, houses, the kind of the settlement); uSquare: its corner (km of its face, the rest of 48), its size (km), its face; uSquareCell: the number of 48 km. */
				'uniform float uDwelt;',
				'uniform sampler2D uUseMap;',
				'uniform vec4 uSquare;',
				'uniform vec2 uSquareCell;',
				/* The tiles of materials near (uTextured): metres in the plane at the anchor (uAnchor: the eye from it, km; uEast, uUp, uNorth its axes), uMetres the tile of each. */
				'uniform float uTextured;',
				'uniform vec3 uAnchor;',
				'uniform vec3 uEast;',
				'uniform vec3 uUp;',
				'uniform vec3 uNorth;',
				'uniform vec4 uMetres;',
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
				'uniform float uRelief;',
				'uniform samplerCube uLights;',
				'uniform float uLightsOn;',
				'uniform samplerCube uSky;',
				'uniform float uCloudsOn;',
				'uniform float uDrift;',
				'uniform vec3 uCloudTint;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Shadow,
				waves,
				'precision highp sampler2DArray;',
				this.$Service('SceneTextures').Chunk(true),
				materials.LandSlope,
				materials.LandTexture,
				/*
				 * A tile of the materials at a point of a plane (metres), its gradients on the screen told: taken where all pixels
				 * go, never in a branch (there a gradient of D3D is any number, and the tile is read without its mipmaps, in
				 * specks). The hexagons of SceneTextures, the tile as it is (in the space of the colors of the globe), its light.
				 */
				'vec4 groundTile(float layer, float metres, vec2 at, vec2 gx, vec2 gy) {',
				'	vec2 uv = at / metres;',
				'	vec2 dx = gx / metres;',
				'	vec2 dy = gy / metres;',
				'	vec3 w;',
				'	vec2 v1;',
				'	vec2 v2;',
				'	vec2 v3;',
				'	vec4 c1;',
				'	vec4 c2;',
				'	vec4 c3;',
				'	vec4 s1;',
				'	vec4 s2;',
				'	vec4 s3;',
				'	tex_hexes_layer(uv / 1.6, w, v1, v2, v3);',
				'	tex_piece_layer(uLandColor, uLandSurface, layer, uv, dx, dy, v1, 1.0, c1, s1);',
				'	tex_piece_layer(uLandColor, uLandSurface, layer, uv, dx, dy, v2, 1.0, c2, s2);',
				'	tex_piece_layer(uLandColor, uLandSurface, layer, uv, dx, dy, v3, 1.0, c3, s3);',
				'	vec3 k = pow(max(w, 0.0), vec3(8.0)) * exp(vec3(s1.b, s2.b, s3.b) * 5.0);',
				'	k /= k.x + k.y + k.z;',
				/* Of its mean (its last mipmap): the tile brings its grain to the color of the place, never a color of its own. */
				'	vec3 mean = max(textureLod(uLandColor, vec3(0.5, 0.5, layer), 12.0).rgb, vec3(0.02));',
				'	return vec4((c1 * k.x + c2 * k.y + c3 * k.z).rgb / mean, s1.a * k.x + s2.a * k.y + s3.a * k.z);',
				'}',
				'float dwellHash(int x, int y, int z) {',
				'	uint h = uint(x) * 1597334677u ^ uint(y) * 3812015801u ^ uint(z) * 2798796415u;',
				'	h = (h ^ (h >> 15u)) * 2246822519u;',
				'	h = (h ^ (h >> 13u)) * 3266489917u;',
				'	return float((h ^ (h >> 16u)) & 16777215u) / 16777216.0;',
				'}',
				/*
				 * FIELDS: where people live, at a point of the face (f: km in its 48, cell: the number of those), over the mean color
				 * its picture has there (albedo; use: fields, houses, the kind of the settlement). Lands of 6 km, each its grid turned
				 * its way and its parcels of its width, tracks between them; each parcel a crop (wheat, young green, pasture, fallow,
				 * ploughed, hay) as a share of their mean, its furrows near, hedges round it in some lands. Houses in blocks between
				 * streets, as many lots built as it is built (gardens or the land between; a city of larger houses, paved, a park
				 * here and there), roofs of tiles or of slate (grey, light and flat in a city). Each as long as a pixel is finer than
				 * it (foot: km), farther the mean of the picture; its edges as wide as a pixel (aa), its lines (hedges, tracks, streets)
				 * as much as they cover of it; rise: km its hedges stand up.
				 */
				'float dwellHouse(vec2 q, ivec2 land, int face, float fill, float city, vec2 aa, out float h) {',
				'	vec2 lid = floor(q);',
				'	vec2 lot = q - lid;',
				'	h = dwellHash(int(lid.x) + land.x * 4099, int(lid.y) + land.y * 4099, face * 8 + 6);',
				'	vec2 low = mix(vec2(0.12), vec2(0.05), city) + vec2(fract(h * 31.0), fract(h * 57.0)) * mix(0.22, 0.12, city);',
				'	vec2 high = mix(vec2(0.12), vec2(0.05), city) + vec2(fract(h * 71.0), fract(h * 97.0)) * mix(0.22, 0.12, city);',
				'	vec2 inside = smoothstep(low, low + aa, lot) * smoothstep(high, high + aa, 1.0 - lot);',
				'	return inside.x * inside.y * step(1.0 - fill, h);',
				'}',
				'vec3 dwelling(vec3 albedo, vec2 f, ivec2 cell, int face, vec3 use, float aa, float foot, out float rise) {',
				'	vec2 rf = floor(f / 6.0);',
				'	ivec2 land = ivec2(rf) + cell * 8;',
				'	float turn = dwellHash(land.x, land.y, face * 8 + 1) * 3.14159;',
				'	vec2 l = f - rf * 6.0;',
				'	vec2 r = vec2(l.x * cos(turn) - l.y * sin(turn), l.x * sin(turn) + l.y * cos(turn));',
				'	rise = 0.0;',
				'	float seen = 1.0 - smoothstep(0.08, 0.25, foot);',
				'	if (use.x > 0.01 && seen > 0.0) {',
				'		float wide = 0.3 + dwellHash(land.x, land.y, face * 8 + 2) * 0.35;',
				'		vec2 size = vec2(wide, wide * (0.45 + dwellHash(land.x, land.y, face * 8 + 3) * 0.4));',
				'		vec2 p = r / size;',
				'		vec2 id = floor(p);',
				'		vec2 fr = p - id;',
				'		float k = dwellHash(int(id.x) + land.x * 97, int(id.y) + land.y * 97, face * 8 + 4);',
				'		vec3 crop = k < 0.2 ? vec3(0.66, 0.58, 0.32) : k < 0.38 ? vec3(0.36, 0.48, 0.2) : k < 0.58 ? vec3(0.42, 0.52, 0.26) : k < 0.72 ? vec3(0.5, 0.43, 0.3) : k < 0.84 ? vec3(0.42, 0.35, 0.26) : vec3(0.58, 0.56, 0.3);',
				'		crop *= 1.0 + sin((k > 0.5 ? r.x : r.y) * 523.6) * 0.07 * (1.0 - smoothstep(0.002, 0.006, foot)) * step(0.38, k);',
				'		float edge = min(min(fr.x, 1.0 - fr.x) * size.x, min(fr.y, 1.0 - fr.y) * size.y);',
				'		float hedges = step(0.55, dwellHash(land.x, land.y, face * 8 + 5));',
				'		float hedge = (1.0 - smoothstep(0.003, 0.003 + aa, edge)) * hedges * min(1.0, 0.006 / aa);',
				'		float track = (1.0 - smoothstep(0.004, 0.004 + aa, min(min(l.x, 6.0 - l.x), min(l.y, 6.0 - l.y)))) * min(1.0, 0.008 / aa);',
				'		crop = mix(crop, vec3(0.13, 0.2, 0.09), hedge * (1.0 - use.y));',
				'		crop = mix(crop, vec3(0.55, 0.5, 0.42), track * (1.0 - use.y));',
				'		albedo *= mix(vec3(1.0), crop / vec3(0.48, 0.47, 0.27), use.x * seen);',
				'		rise += hedge * 0.004 * use.x * seen;',
				'	}',
				'	float near = 1.0 - smoothstep(0.015, 0.05, foot);',
				'	if (use.y > 0.01 && near > 0.0) {',
				'		float city = step(0.9, use.z);',
				'		vec2 block = mix(vec2(0.12, 0.09), vec2(0.15, 0.11), city);',
				'		vec2 p = r / block;',
				'		vec2 bid = floor(p);',
				'		vec2 fr = p - bid;',
				'		float bh = dwellHash(int(bid.x) + land.x * 389, int(bid.y) + land.y * 389, face * 8 + 7);',
				'		float street = (1.0 - smoothstep(0.003, 0.003 + aa, min(min(fr.x, 1.0 - fr.x) * block.x, min(fr.y, 1.0 - fr.y) * block.y))) * smoothstep(0.12, 0.3, use.y) * min(1.0, 0.006 / aa);',
				'		float park = step(0.93, bh) * city;',
				'		vec2 split = mix(vec2(5.0, 4.0), vec2(3.0, 2.0), city);',
				'		vec2 lotAa = aa / (block / split);',
				'		vec2 at = (bid * 8.0 + fr) * split;',
				'		float fill = use.y * mix(0.75, 0.97, city);',
				'		float h;',
				'		float h2;',
				'		float house = dwellHouse(at, land, face, fill, city, lotAa, h) * (1.0 - park);',
				'		float shade = dwellHouse(at + vec2(0.18, -0.14) * mix(1.0, 1.8, city), land, face, fill, city, lotAa, h2) * (1.0 - house) * (1.0 - park);',
				'		float lots = 1.0 - smoothstep(0.005, 0.015, foot);',
				'		float hue = fract(h * 13.0);',
				'		vec3 roof = city > 0.5 ? (hue < 0.35 ? vec3(0.3, 0.3, 0.32) : hue < 0.7 ? vec3(0.47, 0.46, 0.44) : hue < 0.85 ? vec3(0.55, 0.54, 0.51) : vec3(0.42, 0.33, 0.28)) : (hue < 0.6 ? vec3(0.56, 0.3, 0.21) * (0.8 + hue * 0.4) : hue < 0.85 ? vec3(0.36, 0.35, 0.35) : vec3(0.5, 0.45, 0.38));',
				'		vec3 yard = mix(mix(vec3(0.26, 0.35, 0.16), vec3(0.4, 0.4, 0.38), city), vec3(0.2, 0.32, 0.13), park);',
				'		vec3 drawn = mix(albedo, yard, smoothstep(0.45, 0.8, use.y) * lots);',
				'		drawn *= 1.0 - shade * lots * 0.45;',
				'		drawn = mix(drawn, roof, house * lots);',
				'		drawn = mix(drawn, vec3(0.36, 0.36, 0.37), street * near);',
				'		albedo = drawn;',
				'	}',
				'	return albedo;',
				'}',
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
				/* From far its relief is told by its light: the slopes made steeper for the light (uRelief), as the eye reads mountains from orbit. */
				'	if (uRelief > 1.0) n = normalize(up + (n - up * dot(n, up)) * uRelief);',
				'	if (sea > 0.5) n = up;',
				'	float rock = 1.0 - smoothstep(0.55, 0.75, dot(n, up));',
				'	if (sea < 0.5) albedo = mix(albedo, uColors[1] * 0.8, rock * 0.6);',
				'	if (uPainted > 0.5) albedo = sea > 0.5 ? vPainted : mix(vPainted, vec3(0.42, 0.39, 0.35), rock * 0.55);',
				'	float water = sea;',
				/*
				 * Its picture: read a little aside by a noise of its texels, so the edges between its colors are ragged within a texel
				 * and never a row of steps; its relief of its own normals, finer than its points, the slopes made steeper as above.
				 */
				'	if (uTiled > 0.5) {',
				'		vec2 tc = vPatch * (uTexels - 1.0) / uTexels + 0.5 / uTexels;',
				'		vec2 grid = tc * uTexels;',
				'		vec2 aside = vec2(noise3(vec3(grid * 1.7, 3.1)) + noise3(vec3(grid * 4.3, 5.7)) * 0.5, noise3(vec3(grid * 1.7, 9.7)) + noise3(vec3(grid * 4.3, 1.3)) * 0.5) - 0.75;',
				'		vec4 painted = texture(uColorMap, tc + aside * 1.1 / uTexels);',
				'		albedo = painted.rgb;',
				'		water = painted.a;',
				'		n = normalize(texture(uReliefMap, tc).xyz * 2.0 - 1.0);',
				'		if (uRelief > 1.0) n = normalize(up + (n - up * dot(n, up)) * uRelief);',
				'		n = normalize(mix(n, up, water));',
				'	}',
				'	if (uIce > 0.0 && uPainted < 0.5) {',
				'		float pole = abs(up.y) + (fbm3(up * 6.6, 3) - 0.5) * 0.3;',
				'		float cap = uIce >= 1.0 ? 1.0 : smoothstep(1.0 - uIce, 1.0 - uIce + 0.04, pole);',
				'		albedo = mix(albedo, vec3(0.93, 0.95, 0.98), cap);',
				'	}',
				'	vec3 place = up * uRadius;',
				/* Kilometres a pixel covers: what is finer than two pixels is not drawn, or it shimmers as the view moves. */
				'	float foot = length(fwidth(place));',
				/* Its land mottled at kilometres, hundreds and tens of metres (fields, woods, stone), each as long as it is over two pixels. */
				/*
				 * Regression: the place of the very point (its direction times the radius, thousands of km) trembles in the floats by
				 * half a metre from pixel to pixel; noises of tens of metres of it, and their slopes, were specks. What is finer than
				 * a kilometre is of the point from the anchor (uAnchor, km), exact.
				 */
				'	vec3 near = vWorld + uAnchor;',
				'	float mottle = (noise3(place * 0.35) - 0.5) * 0.2 * (1.0 - smoothstep(1.2, 4.0, foot)) + (noise3(place * 1.9 + 7.0) - 0.5) * 0.14 * (1.0 - smoothstep(0.25, 0.8, foot)) + (noise3(near * 9.0 + 3.0) - 0.5) * 0.1 * (1.0 - smoothstep(0.05, 0.15, foot));',
				'	albedo *= 1.0 + mottle * (1.0 - water);',
				/*
				 * Near, finer than the ground of the body tells (a planet knows nothing under a kilometre): what grows there in
				 * crowns and gaps, dry ground in ripples, and the relief of tens of metres, by the slope of a noise of the place on
				 * the screen, each as long as it is over two pixels. Its derivatives taken where all pixels go.
				 */
				/*
				 * Its woods (the share trees cover, of its picture): stands of tens and hundreds of metres, as many as the share;
				 * from far their mean, a darker green; near, their edges, the crowns over the ground in the relief below.
				 */
				'	float cover = uTiled * uWoods > 0.5 ? texture(uReliefMap, vPatch * (uTexels - 1.0) / uTexels + 0.5 / uTexels).a : 0.0;',
				/* Each octave turned against the last, so no grid of the noise shows in the edges of the woods. */
				'	mat3 askew = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);',
				'	float stands = noise3(askew * place * 14.0 + 21.0) * 0.5 + noise3(place * 2.6 + 9.0) * 0.32 + noise3(askew * (askew * near) * 61.0 + 4.0) * 0.18 * (1.0 - smoothstep(0.004, 0.012, foot));',
				/* Its edges a pixel and a half wide at least: no specks along them near. */
				'	float spread = clamp(max(foot * 6.0, fwidth(stands) * 1.5), 0.02, 0.5);',
				'	float wooded = mix(smoothstep(0.5 + (0.5 - cover) * 0.5 - spread, 0.5 + (0.5 - cover) * 0.5 + spread, stands), cover, smoothstep(0.05, 0.2, foot)) * step(0.01, cover) * (1.0 - water);',
				'	albedo = mix(albedo, albedo * vec3(0.42, 0.56, 0.4) + vec3(0.0, 0.015, 0.0), wooded);',
				/* Its fields and houses (FIELDS), of the place on its face; the width of a pixel there taken where all pixels go. */
				'	vec2 dwellAt = uSquare.xy + vPatch * uSquare.z;',
				'	vec2 dwellWide = fwidth(dwellAt);',
				'	float standing = 0.0;',
				'	if (uDwelt > 0.5) {',
				'		vec3 use = texture(uUseMap, vPatch * (uTexels - 1.0) / uTexels + 0.5 / uTexels).rgb;',
				'		albedo = mix(dwelling(albedo, dwellAt, ivec2(uSquareCell), int(uSquare.w + 0.5), use, max(dwellWide.x, dwellWide.y) * 1.5, foot, standing), albedo, water);',
				'	}',
				'	float green = clamp((albedo.g - max(albedo.r, albedo.b)) * 6.0, 0.0, 1.0) * (1.0 - water);',
				'	float near1 = 1.0 - smoothstep(0.03, 0.09, foot);',
				'	float near2 = 1.0 - smoothstep(0.006, 0.02, foot);',
				'	float crowns = noise3(near * 34.0 + 11.0);',
				'	albedo *= mix(1.0, 0.7 + 0.55 * smoothstep(0.3, 0.75, crowns), green * near2);',
				'	float bumps = ((noise3(near * 11.0 + 5.0) - 0.5) * 0.04 * near1 + (noise3(near * 52.0 + 2.0) - 0.5) * 0.008 * near2 + (crowns - 0.5) * 0.006 * green * near2 + wooded * 0.006 * near1 + standing) * (1.0 - water);',
				/* The normal before them: what picks the ways the tiles are laid, the same over a few pixels (their derivatives are taken in branches by it). */
				'	vec3 smoothed = n;',
				'	vec3 px = dFdx(vWorld);',
				'	vec3 py = dFdy(vWorld);',
				'	vec3 across = cross(py, n);',
				'	float area = dot(px, across);',
				'	vec3 tilt = (dFdx(bumps) * across + dFdy(bumps) * cross(n, px)) / (abs(area) > 1e-12 ? area : 1e-12);',
				'	n = normalize(n - tilt * step(1e-12, abs(area)));',
				/*
				 * Nearer still: the tiles of the materials (uTextured), as the ground of a location draws them: grass where it is
				 * green, grassy soil under the woods, dirt where it is dry, cliff where it is steep, each tinted by the color of
				 * the place and only where a pixel is finer than its features; laid in the plane at the anchor (metres from it).
				 */
				'	vec3 q = near * 1000.0;',
				'	vec3 local = vec3(dot(q, uEast), dot(q, uUp), dot(q, uNorth));',
				'	vec2 topX = dFdx(local.xz);',
				'	vec2 topY = dFdy(local.xz);',
				'	vec2 alongX = dFdx(local.zy);',
				'	vec2 alongY = dFdy(local.zy);',
				'	vec2 acrossX = dFdx(local.xy);',
				'	vec2 acrossY = dFdy(local.xy);',
				'	if (uTextured > 0.5) {',
				'		landSlope = normalize(vec3(dot(smoothed, uEast), dot(smoothed, uUp), dot(smoothed, uNorth)));',
				'		float metresPx = foot * 1000.0;',
				'		float steep = 1.0 - smoothstep(0.6, 0.8, landSlope.y);',
				/* Woods show their crowns, not the ground under them: no tile there (the second, grassy soil, for none now). */
				'		vec4 parts = vec4(green, 0.0, 1.0 - green, 0.0) * (1.0 - wooded) * (1.0 - steep);',
				'		parts.w = steep * (1.0 - wooded * 0.5);',
				'		parts *= 1.0 - water;',
				'		bool side = abs(landSlope.x) > abs(landSlope.z);',
				'		vec3 laid = vec3(0.0);',
				'		float total = 0.0;',
				'		for (int k = 0; k < 4; k++) {',
				'			float seen = (1.0 - smoothstep(uMetres[k] * 0.6, uMetres[k] * 3.0, metresPx)) * parts[k];',
				'			if (seen > 0.01) {',
				'				vec4 tile = k < 3 ? groundTile(float(k), uMetres[k], local.xz, topX, topY) : side ? groundTile(3.0, uMetres[3], local.zy, alongX, alongY) : groundTile(3.0, uMetres[3], local.xy, acrossX, acrossY);',
				'				laid += albedo * mix(vec3(1.0), tile.rgb, 0.85) * mix(1.0, tile.a / 0.8, 0.4) * seen;',
				'				total += seen;',
				'			}',
				'		}',
				'		albedo = mix(albedo, laid / max(total, 1e-4), clamp(total, 0.0, 1.0));',
				'	}',
				'	float rise = dot(up, uSun);',
				'	float light = clamp(rise * 3.0 + 0.3, 0.0, 1.0);',
				'	float dusk = 1.0 - smoothstep(0.0, 0.35, abs(rise));',
				/* The sky lights what the sun does not reach: at sunset the land is dim and red, not black. */
				'	vec3 around = vec3(0.05, 0.06, 0.08) + uAir.rgb * uAir.a * 0.3 * smoothstep(-0.25, 0.3, rise) + vec3(0.5, 0.25, 0.15) * dusk * uAir.a * 0.35;',
				'	float day = max(dot(n, uSun), 0.0) * sunShadow(vWorld, n);',
				'	vec3 color = albedo * (uSunColor * day + around);',
				/* Water mirrors the sky, more at a glance; waves break the sun into a path of glints that reddens as it sets. */
				'	if (water > 0.01) {',
				/*
				 * Its waves: the slope of a noise of the very place (kilometres), seen where a pixel is smaller than a wave; past
				 * that the sun is not broken into glints but spread wide over the sea, as from high over it.
				 */
				'		float seen = 1.0 - smoothstep(0.015, 0.06, foot);',
				'		vec3 w = up;',
				'		if (seen > 0.0) {',
				'			vec3 q = place * 9.0 + vec3(0.0, uTime * 0.05, 0.0);',
				'			vec3 g = vec3(noise3(q + vec3(0.2, 0.0, 0.0)) - noise3(q - vec3(0.2, 0.0, 0.0)), noise3(q + vec3(0.0, 0.2, 0.0)) - noise3(q - vec3(0.0, 0.2, 0.0)), noise3(q + vec3(0.0, 0.0, 0.2)) - noise3(q - vec3(0.0, 0.0, 0.2))) * 2.5;',
				'			w = normalize(up - (g - up * dot(g, up)) * 0.22 * seen);',
				'		}',
				'		float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(w, v), 0.0), 5.0);',
				'		vec3 r = reflect(-v, w);',
				'		if (dot(r, up) < 0.0) r = r - up * 2.0 * dot(r, up);',
				'		float toward = max(dot(r, uSun), 0.0);',
				'		vec3 mirrored = mix(mix(uAir.rgb, vec3(1.0), 0.45), uAir.rgb * vec3(0.45, 0.6, 1.0), pow(max(dot(r, up), 0.0), 0.6)) * light + vec3(1.0, 0.5, 0.2) * dusk * exp(-max(dot(r, up), 0.0) * 5.0) * 0.8;',
				'		float shine = (pow(toward, mix(90.0, 1400.0, seen)) * mix(0.9, 7.0, seen) + pow(toward, 180.0) * 0.16) * smoothstep(-0.02, 0.1, rise);',
				'		color = mix(color, mix(color, mirrored, fresnel) + uSunColor * mix(vec3(1.0, 0.55, 0.25), vec3(1.0), smoothstep(0.0, 0.3, rise)) * shine, water);',
				'	}',
				/* Its settlements at night (of a globe near). */
				'	if (uLightsOn > 0.5) color += vec3(1.0, 0.72, 0.38) * texture(uLights, up).r * 1.6 * (1.0 - smoothstep(-0.05, 0.12, rise));',
				/*
				 * Its clouds, seen from high over them (uCloudsOn): laid over the ground where it is, as the shell of them would
				 * be; a shell so far over the ground fights it for the depth thousands of kilometres away, and flickers in stripes.
				 */
				'	if (uCloudsOn > 0.0) {',
				'		vec3 drifted = vec3(up.x * cos(uDrift) - up.z * sin(uDrift), up.y, up.x * sin(uDrift) + up.z * cos(uDrift));',
				'		float cover = texture(uSky, drifted).r * uCloudsOn;',
				/* Their own shape: heaps of tens of kilometres and their gaps, as far as a pixel is smaller than they are. */
				'		vec3 at = drifted * uRadius;',
				/* Each octave turned against the last, so no grid of the noise shows. */
				'		mat3 turned = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);',
				'		vec3 a1 = turned * at * 0.035;',
				'		vec3 a2 = turned * a1 * 3.1 + 7.0;',
				'		float heaps = noise3(a1) * 0.55 + noise3(a2) * 0.3 + noise3(turned * a2 * 2.7 + 3.0) * 0.15;',
				'		heaps = smoothstep(0.25, 0.75, heaps);',
				'		cover = clamp(cover * mix(1.0, 0.3 + 1.4 * heaps, 1.0 - smoothstep(4.0, 12.0, foot)), 0.0, 1.0);',
				'		vec3 cloud = uCloudTint * (uSunColor * clamp(rise * 1.4 + 0.1, 0.0, 1.0) + around);',
				'		color = mix(color, cloud, clamp(cover, 0.0, 1.0));',
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
				'uniform vec4 uAurora;',
				'uniform vec3 uAuroraLow;',
				'uniform vec3 uAuroraHigh;',
				'uniform float uEclipse;',
				'uniform float uSunRadius;',
				'uniform vec3 uGlow;',
				'uniform vec3 uGlowWay;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				'void blueprintSky(inout vec3 color, inout float alpha) {}',
				'void main() {',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 0.0;',
				'	blueprintSky(color, alpha);',
				'	outColor = vec4(color, alpha);',
				'}'
			].join('\n'),

			/* The ground of a map: its squares relative to the eye, the colors of their heights, its sun and its haze. */
			LandVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				/* Its height, and how much of the sky it sees (under rock of a volume: less). */
				'in vec2 aUV;',
				/* What it is made of: the weights of the 12 materials of its ground (SceneMaterials). */
				'in vec4 aMaterials;',
				'in vec4 aMaterials2;',
				'in vec4 aMaterials3;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOffset;',
				'uniform vec3 uCenter;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vColor;',
				'out vec3 vPlace;',
				'out float vOpen;',
				'out vec4 vMaterials;',
				'out vec4 vMaterials2;',
				'out vec4 vMaterials3;',
				'void main() {',
				'	vOpen = aUV.y;',
				'	vMaterials = aMaterials;',
				'	vMaterials2 = aMaterials2;',
				'	vMaterials3 = aMaterials3;',
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
				'in float vOpen;',
				'in vec4 vMaterials;',
				'in vec4 vMaterials2;',
				'in vec4 vMaterials3;',
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
				/* 1 where the ground has a sea: under its level the light of the waves plays on it. */
				'uniform float uSea;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Shadow,
				ripples,
				materials.Helpers,
				/* What its ground is made of: nothing here; a ground puts the materials of its slots in this place (SceneMaterials.Land). */
				'void landMaterials(vec3 place, float px, inout vec3 color, inout float height) {}',
				/* What a material graph of Blueprints does to the ground: nothing here; a ground with a Blueprint puts its own in this place. */
				'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {}',
				'void blueprintLand(inout vec3 color, inout float alpha) {}',
				'void main() {',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 1.0;',
				'	blueprintLand(color, alpha);',
				'	outColor = vec4(color, alpha);',
				'}'
			].join('\n'),

			Sea: head + [
				'in vec3 vWorld;',
				'in vec3 vSurface;',
				'in float vCrest;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec4 uAir;',
				'uniform float uFog;',
				'uniform mat4 uViewProjection;',
				'uniform sampler2D uSeen;',
				'uniform sampler2D uSeenDepth;',
				'uniform mat4 uSeenInverse;',
				'uniform float uMirror;',
				'uniform sampler2D uPlanar;',
				'uniform float uPlanarOn;',
				'uniform float uEyeUnder;',
				'uniform vec3 uEye;',
				'uniform float uTime;',
				'uniform float uDay;',
				'uniform float uWild;',
				'uniform float uFlow;',
				'uniform vec2 uBound;',
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
				/* How thick the water is along the ray to a point of the screen, from where it is (far from the eye): what the scene had there, behind it. */
				'float underDepth(vec2 screen, float far) {',
				'	float depth = texture(uSeenDepth, screen).r;',
				'	if (depth >= 1.0) return 1000.0;',
				'	vec4 at = uSeenInverse * vec4(screen * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);',
				'	return length(at.xyz / at.w) - far;',
				'}',
				/* The water: the graph of water of the scene (WaterGraph, else the one of the library) in this place. */
				'void blueprintWater(inout vec3 color, inout float alpha) {}',
				'void main() {',
				/* A ground with a horizon past it (a location of a planet): its sea ends where it ends, the horizon has the sea past it. */
				'	if (uBound.y > 0.5 && max(abs(vWorld.x + uEye.x), abs(vWorld.z + uEye.z)) > uBound.x) discard;',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 1.0;',
				'	blueprintWater(color, alpha);',
				'	outColor = vec4(color, alpha);',
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

			/* The normal a model is drawn by, for the reflections of the screen (scene.Normals). */
			Normal: head + [
				'in vec3 vNormal;',
				'out vec4 outColor;',
				'void main() {',
				'	outColor = vec4(normalize(vNormal), 1.0);',
				'}'
			].join('\n'),

			/* What a slab of the voxels of the light of probes holds (SceneProbes): the color of a surface, as it is, and that it is there. */
			Voxel: head + [
				'in vec3 vColor;',
				'out vec4 outColor;',
				'void main() {',
				'	outColor = vec4(clamp(vColor, vec3(0.02), vec3(0.85)), 1.0);',
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
