/*
 * The scene of a game in three dimensions on WebGL2 (the Renderer Service): objects of any kind (the Kinds Service),
 * each made of what its kind extends, what it can do (its Traits, each run by a system of the scene) and what it is made
 * of (its Parts, objects of their own placed in it). The setting space (the default) brings the kinds of a star system
 * and its systems: stars and planets on Kepler orbits (the Astronomy Service), lit by their stars (night sides, the
 * shadows of moons and planets on each other and on rings), their surfaces of noise baked once into cube textures,
 * belts and rings, stations of modules, fleets of ships that hold their place by a body and travel to another.
 *
 * Kinds of space: star (Star: Mass, Radius, Temperature, Luminosity, Color, Veil: how far from the disc, in its radii,
 * engines go in its light, 0 for not at all; Corona, Prominences, Flares: how much of each burns round it; Blueprint: its
 * look as a graph of the kind star run each frame, its Parameters given, LibraryStar() the one of the library),
 * cluster (Barycentre and Cluster: Type, Radius, Count, Seed: the swarm of its stars), nebula (Nebula: Type, Subtype,
 * Radius, Seed, Density, Glow, Colors; Blueprint: its look as a graph of the kind nebula, LibraryNebula() the one of the
 * library; SceneNebula), planet (Orbit: Distance, Eccentricity,
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
 * the band of the galaxy (Galaxy, 0 for none). Weather (clear, cloudy, overcast, rain, storm, snow, fog; none: no air) changes in a few
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
 * skeleton with no clips gets walk and idle of the graphs of the mannequin laid on it by its roles (SceneModels.Gait),
 * Motions of a recipe bring clips of FBX files.
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
 * wild its sea, 0 to 1.5: SceneWaves; wilder in the rain), SwellWay (degrees the wind drives it), Graphs (graphs of its
 * own of the types of its sketch and its carves: {'sketch/<type>', 'carve/<type>': a graph}, as a world gives them): a ground of noise,
 * SceneTerrainGenerator.Flat, in chunks finer near the eye, with its sea; the objects its World makes are in the scene
 * as Generated, made again with it and never saved), sun (Sun: its light from far), unit (Walker: Speed,
 * MaxSlope, Swim; a Model; Patrol: points [x, z] or [x, z, y] it goes round for good), tree, rock and house (Model,
 * Blocks: what stands in the way). An object of it stands at X and Y of the ground; Move(id, [x, y]) walks a walker round
 * what cannot be walked, a right click sends the selected one; the view turns round a point of the ground and the keys move it. Every model of the Models Service is a kind of
 * the same name (knight, mech, wolf, oak, tower, reactor...), of the kind that fits it.
 *
 * The models stand in the light of their sun and cast shadows on each other and on the ground (Shadows); a Model plays
 * clips of its pieces (Clip: the one it plays when idle; a change of clip fades as TransitionGraph says, a gait into a gait
 * in time with its steps; going, the gaits of its speed blended, BlendGraph; Walking: on the spot at that speed; a clip of
 * the arms played while it goes is a layer over its legs): walk on a way by itself, Play(id, clip, callback) the others
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
 * What a scene waits for, its programs and models, comes behind the page and holds no frame up: all the programs it may
 * draw are asked for when it starts (and when it is made ready again: a location, models came; engine.Warms of the
 * traits), so none is made in the play. Loader shows how far it came with its percent, stage by stage (programs, models,
 * the sky and the galaxy baked, globes, the surface near, ground, plants), each as much of the bar as it takes, never
 * back and never an endless bar; a slot named loading takes the place of the bar (all of the scene), and the event
 * loading tells {Part (up to 100), Stage, Stages}. A model asked for after it was shown makes it ready again (softly). Behind the veil of its start nothing else shows; when
 * all the view needs is made the picture comes up (0.8 s) and the event prepared ({First}) tells it, at the start and
 * each time a location came. The globes of planets painted are kept in the browser (IndexedDB) for the next time.
 * Preload(list, callback) makes ready beforehand what a scene will need: names of models, Worlds of grounds, planets.
 */
Elemenx.Component('Scene', {
	$TemplateURL: 'Scene.html',
	$StyleURL: 'Scene.css',
	/* The graphs of the models of the library (lazy in ElemenxGraphics): here before it is made. */
	$Needs: {Blueprints: ['ElemenxGraphics/models/*']},
	$Traits: ['SceneScatter', 'SceneLighting', 'SceneProbes', 'SceneEffects', 'SceneCosmos', 'SceneGiants', 'SceneVehicles', 'SceneShipSystems', 'SceneAboard', 'SceneTactics', 'SceneTriggers', 'ScenePhysics', 'SceneRoadNetwork', 'SceneFootings', 'SceneLanding', 'SceneCamera', 'SceneScreens', 'SceneCinema', 'SceneWeapons', 'SceneAgents', 'SceneMissiles', 'SceneDebris', 'SceneFracture', 'ScenePiping', 'SceneDeepSpace', 'SceneNebula', 'SceneGalaxy', 'SceneUniverse', 'SceneMarks'],
	$Meta: {
		Group: 'game',
		Icon: 'star',
		Description: 'The scene of a game in 3D: objects of any kind with their traits and parts; the setting space brings a star system on Kepler orbits, stations and fleets, with a landing on the surfaces of its bodies; the setting terrain a ground of noise and its walkers.',
		Container: true,
		Children: ['SceneObject'],
		Slots: ['hud', 'loading', 'screens'],
		Events: {
			ready: 'The scene is ready: the component itself, to call its methods.',
			gesture: 'A gesture of fingers on it (Gestures: tap, doubletap, press, pan, swipe, pinch, rotate, tilt), after the scene did its part: {Gesture, ID (what is under it; tap, doubletap and press), Point {X, Y} (in the scene)}.',
			select: 'The selection changed: {ID, Object, Info, IDs, Objects} (ID empty when none is).',
			focus: 'The view moved to an object: {ID}.',
			person: 'V took the view of a walker to another place: third, first or shoulder.',
			loading: 'What the scene waits for came a step nearer: {Part (up to 100, never back), Stage (programs, models, sky, galaxy, nebulae, rivers, globes, surface, ground, plants, view; empty when done), Stages ([{Name, Label, Done, Total}] of those it has)}.',
			prepared: 'All the view needs is made and the veil goes: {First (the start of the scene, not a location that came)}.',
			shield: 'A layer of the shield of an object took a hit (SceneShipSystems): {ID, Layer, Value, Capacity, Taken, Broken, Hit}.',
			discover: 'A place came within the sensors of a vehicle and is known now (SceneShipSystems, NavPoint): {ID, By, Kind, Name}.',
			context: 'An actor (the character of the player) sat in a seat of a vehicle or left it (SceneVehicles Board, Leave, BoardKey: G): {Actor, Kind (walk or seat), Vehicle, Seat, Role, Controls}.',
			agent: 'An agent (SceneAgents: Values.Agent, a tree of behaviour) began a task: {ID, Task, Enemy}.',
			autopilot: 'The autopilot of a ship took it, brought it there, or let it go (SceneVehicles Autopilot): {ID, Mode (hold, approach, follow), Phase (on, arrived, off), Reason (hand, asked, target)}.',
			eva: 'A step of going out of a ship in space and in again (SceneAboard: G by its airlock): {Actor, Vehicle, Step (cycle, out, in), Out}.',
			boarding: 'A step of getting in or out of a vehicle step by step (Board and Leave with Animate, G by a car): {Actor, Vehicle, Seat, Step (approach, open, enter, sit, exit, close, done), Out}.',
			influence: 'An influence on the weather of a planet began (Influence): {ID, Kind, Body, Direction, Radius, Start, Length, Strength}.',
			ground: 'A ground came, its field made (a ground of the scene, of a location, of a planet landed on): {Key (its shape: location:<id>:<model> for a location), ID (the object it is of), Location (true for a location)}.',
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
			lock: 'The hero locked a target under its aim (Lock of its weapon), or its ship with its missiles (SceneMissiles): {ID, Weapon, By}.',
			unlock: 'A lock was lost: {ID}.',
			missile: 'A missile (SceneMissiles) was launched, taken by a flare, lost its target, was brought down, hit or flew its range: {ID, Weapon, Source, Target, State (launch, decoyed, reacquired, lost, intercepted, hit, spent), By}.',
			flares: 'A ship released flares: {ID, Count, Left}.',
			charge: 'A weapon that charges (Charge: the lance) began to: {ID, Weapon, Seconds}.',
			tunnel: 'A railgun faster than light opened a tunnel of warp for its slug (no warning to the target): {ID, Weapon, Source, Target, Mode (predict, direct), Blocked}.',
			break: 'A thing broke into pieces (Break, SceneDebris): {ID, Pieces, Point}.',
			teleport: 'A thing is beamed away or comes (Teleport): {ID, Phase (out or in), From, To}.',
			through: 'A ship flew into the mouth of a wormhole (SceneDeepSpace): {ID, Wormhole, Leads, To (the mouth it comes out of, empty: none)}.',
			galaxy: 'A star of the galaxy was picked (Setting galaxy, SceneGalaxy): {ID (empty: none or the black hole), Centre (the black hole), Star}.',
			galaxyready: 'The galaxy of Galaxy came: {ID, Data}.',
			enter: 'The view went into the system of a star of the galaxy (EnterSystem): {ID, Star, Key (of SystemData.Use)}.',
			leave: 'The view went out of a system to its galaxy (LeaveSystem): {ID}.',
			universe: 'A galaxy of the universe was picked (Setting universe, SceneUniverse): {ID (empty: none), Galaxy}.',
			universeready: 'The universe of Universe came: {ID, Data, Home}.',
			entergalaxy: 'The view went into a galaxy of the universe (EnterGalaxy): {ID, Galaxy, Key (of GalaxyData.Use)}.',
			leavegalaxy: 'The view went out of a galaxy to its universe (LeaveGalaxy): {ID}.',
			entervoid: 'The scene stands between the galaxies of its universe, out of a warp on its way (EnterVoid): {Place (Mpc)}.',
			markcluster: 'A badge +N of a cluster of marks was pressed (Mark, Cluster): {Cluster, Keys}; the view goes to them.',
			hover: 'The pointer came over a selectable object, or left it: {ID (empty: none), Object, Info}.',
			cutscene: 'A cutscene started, ended or was stopped (SceneCinema): {Name, State: start, end or stop}.',
			cue: 'A cue of a cutscene came: {Cutscene, Name, Data, At}.',
			part: 'A part of an object was set by its role (Part(id, role).Set): {ID, Role, Value}.',
			touch: 'Two solid things began to touch (trait Rigid): {ID, With (null: the ground), At, Normal, Impulse}.',
			crack: 'A thing with the trait Fracture was hurt and still holds (SceneFracture): {ID, Integrity, Point, Amount}.',
			shader: 'A graph (or GLSL written by hand) made into a shader did not compile, and what the library has is drawn in its place: {Kind (material, vertex, land, water, wind, grass, effect, pass), Owner (the material, object or prop of the graph), Errors ([{Block, Line, Message}]: each on the block of GLSL it is in), Message}.',
			error: 'There is no WebGL2 ({Reason: webgl2}).'
		},
		Methods: ['Trigger(id)', 'TriggerActions(actions)', 'ZonesAt(x, z)', 'SurfaceAt(x, z)', 'Roads()', 'Junctions()', 'Interchanges()', 'Push(id, impulse, at)', 'CastRay(from, direction, max)', 'Colliders()', 'RigidWorld()', 'Burst(type, place, options)', 'AddBehaviour(behaviour)', 'PipelineGraph()', 'LibraryWind()', 'LibraryGrass()', 'LibrarySky()', 'LibraryStar()', 'LibraryNebula()', 'LibraryLand()', 'LibraryBake()', 'LibraryWeather()', 'LibraryAir()', 'LibraryClouds()', 'LibraryForecast()', 'LibraryCosmos()', 'LibraryRing()', 'LibraryPlanet()', 'LibraryGround()', 'LibraryEnvelope()', 'Probe(id, name)', 'Unprobe(id)', 'Environment(id)', 'WeatherOver(id, direction)', 'Influence(kind, place, options)', 'Influences()', 'BoltShape()', 'LibraryWater()', 'EffectGraph(name)', 'Effects(types)', 'MountsOf(id, kind)', 'Travel(id, kind, options, callback)', 'TravelStop(id)', 'TravelStep(id, step)', 'Aim(id)', 'AimAlign(on)', 'OpenPart(id, name, amount)', 'Parts(id)', 'Part(id, role)', 'CosmosKinds()', 'GalaxyData()', 'GalaxyView()', 'SetGalaxyView(view)', 'GalaxyStars()', 'GalaxyPicked()', 'GalaxyFocus(id)', 'EnterSystem(id, callback, options)', 'GalaxyNear(radius, limit)', 'LeaveSystem(callback)', 'GalaxyEntered()', 'Add(kind, props)', 'Change(id, changes)', 'UseCamera(id, options)', 'Cameras()', 'Fire(id, options)', 'Weapons(types)', 'HitRules(rules)', 'Locked()', 'Trace(from, way, range)', 'Marks()', 'Killed(id)', 'Break(id, options)', 'Debris()', 'Pipes()', 'Fluids()', 'Damage(id, amount, hit)', 'Integrity(id)', 'Fractures(materials)', 'Teleport(id, place, options, callback)', 'CastOn(type, at, options)', 'Dispel(id, seconds)', 'Lightning(kind)', 'Visibility()', 'SightOf(range)', 'SeasonState()', 'Visible(from, to, range)', 'PlayCutscene(cutscene, callback)', 'StopCutscene()', 'PauseCutscene(on)', 'SeekCutscene(seconds)', 'Cutscene()', 'Cinema(layer)', 'Record(options, callback)', 'ScreenAt(clientX, clientY)', 'Remove(id)', 'Attach(parent, object)', 'Detach(id)', 'Get(id)', 'Objects(filter)', 'Describe(id)', 'Position(id)', 'Select(id)', 'Selection()', 'FocusOn(id)', 'Control(id)', 'Move(id, target)', 'Play(id, clip, callback)', 'Now()', 'Drawn()', 'SetTime(days)', 'ToScreen(id)', 'Pick(clientX, clientY, all)', 'Viewpoint()', 'SetViewpoint(view)', 'Phone()', 'Device()', 'Project(point)', 'Ray(clientX, clientY)', 'GroundAt(clientX, clientY)', 'OrbitAt(id, clientX, clientY)', 'Unlink(id)', 'Socket(id, name)', 'ChangeSown(key, changes)', 'UnlinkSown(key)', 'Save(options)', 'Load(saved)', 'Dig(at, radius)', 'FootingsOf()', 'Land(id, options)', 'TakeOff()', 'Surface()', 'Supported()', 'Preload(list, callback)', 'ToOrbit(id)', 'ShipCommands(id)', 'ShipCommand(id, command, options)', 'Autopilot(id, mode, options)', 'AutopilotOf(id)', 'AgentOrder(ids, order, target)', 'AgentOf(id)', 'Launch(id, options)', 'Driver(id, target)', 'Lance(id, target)', 'Railgun(id, target, options)', 'Flares(id)', 'Defence(id, on)', 'Incoming(id)', 'ArmsOf(id)', 'Mark(key, options)', 'Unmark(key)', 'MarksOnScreen()'],
		Props: {
			Setting: {Options: ['space', 'terrain', 'galaxy', 'universe'], Description: 'The setting: its kinds and systems (space: a star system; terrain: a ground and its walkers; galaxy: a galaxy of Galaxy, SceneGalaxy; universe: the galaxies of Universe, SceneUniverse).'},
			Galaxy: 'The galaxy of Setting galaxy (SceneGalaxy, GalaxyData): a key of GalaxyData.Use, the URL of its file, its data, or options of GalaxyData.Make ({Seed, Kind, Radius, Arms}).',
			Universe: 'The universe of Setting universe (SceneUniverse, UniverseData): a key of UniverseData.Use, the URL of its file, its data, or options of UniverseData.Make ({Seed, Galaxies, Home}); the systems of its galaxies see the galaxies round them in their skies.',
			GalaxyTime: 'The time of the galaxy in millions of years: it turns as a galaxy turns, the inner stars sooner than the outer ones.',
			System: 'The objects: {Objects: [{ID, Kind, Parent, Values, Traits, Parts, Children}]}, or a system of data (SystemData): {Data: the URL of its file, or a key of SystemData.Use}.',
			Seed: 'A whole star system made of a seed (always the same for the same seed).',
			Systems: 'Systems of the application for traits of its own: {Trait: {Update(object, scene), Draw(object, scene)}}.',
			Time: 'The day of the scene.',
			Speed: 'The days of the scene a second.',
			Capture: 'With a walker under the keys (Control), a press takes the pointer: the mouse turns the view, Escape gives it back.',
			Person: {Options: ['third', 'first', 'shoulder'], Description: 'Where the view of a walker stands: behind it (third), in its eyes (first, its head hidden but its body and what it holds seen) or over its shoulder. V changes it while the pointer is taken.'},
			Cutaway: 'While a walker is inside a ship standing (SceneAboard), its hull and its ceilings are not drawn and the view looks in from over it, as at a house cut open; off, the hull stays round it, the view within its rooms.',
			Shoulder: {Options: ['right', 'left'], Description: 'Over which shoulder the view stands. B changes it while the pointer is taken.'},
			Axes: {Options: ['', 'top-left', 'top-right', 'bottom-left', 'bottom-right'], Description: 'The corner where the Axes of the view stand, none when empty; a press on one looks along it.'},
			Origin: 'Draws the three axes of the world at its middle (and the colliders as their outlines).',
			Wireframe: 'Draws the wire of the scene over it: each edge of the ground and of the models (--elemenx-scene-wire).',
			Levels: 'Colors each thing by the level of detail it is drawn at (near green to red, the proxies of far tiles cyan to pink, the squares of the ground by their depth), with the draws and triangles of a frame in a corner: to see where the detail goes. Ctrl+Shift+L turns it on and off.',
			Proxies: 'Far tiles of what is sown drawn each as one simpler shape (SceneProxies), as Voxy draws a far land; false: each thing by its own levels.',
			Clusters: 'Large models that stand alone (3000 faces or more) drawn by their clusters (SceneClusters, as Nanite): each part as fine as the screen needs; false: each at its finest.',
			CacheSize: 'Megabytes the browser keeps of what the scene made (SceneCache: the proxies of far tiles), the oldest gone over it; 0 keeps nothing.',
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
			PlantStyle: 'How its plants look: realistic (SceneFlora: grown trees, their bark and leaves drawn, the default) or simple (the models of code of few faces).',
			Shadows: 'The shadows of a sun on a ground, a surface and a model near the view (true).',
			Compute: {Options: ['auto', 'wasm', 'js'], Description: 'How its grounds compute their heights: auto and wasm by WebAssembly where it is made (the very same numbers, faster), js by JavaScript alone.'},
			Quality: {Options: ['', 'low', 'medium', 'high', 'ultra'], Description: 'What the light costs: empty chooses by the graphics card and steps down while frames are late.'},
			Pipeline: 'The render graph of the Blueprints Service that makes the picture of a frame (high, ultra and medium): its passes (Scene, Clouds, Occlusion, Air, Frames, Mirror, Rays, Exposure, Bokeh, Bloom, Picture, Shader: a pass graph of its own) up to Present; empty: PipelineGraph(), the passes of the library.',
			PipelineParameters: 'The values of the parameters of the Pipeline, by key.',
			Flare: 'How strongly the rings and the glow a lens makes of the sun show, at high and ultra: 0 to 2 (true is 1).',
			Weather: {Options: ['clear', 'cloudy', 'overcast', 'rain', 'storm', 'snow', 'fog', 'none', 'changing'], Description: 'What the air of a ground does; it changes in a few seconds, as a front comes; changing goes from one to the next by itself.'},
			Wind: 'How strong the wind is, 0 to 4, for clouds, rain, grass and trees (empty: as the weather has it).',
			WindWay: 'Where the wind blows to: an azimuth in degrees.',
			WaterGraph: 'What water looks like: a water graph of the Blueprints Service (or its JSON, or its GLSL) of its waves, the sky and the sun it mirrors, its depth, its foam and the fog over it; the one of the library (LibraryWater) when empty.',
			LandGraph: 'What the land is, its light and its wet and snow too: a land graph of the Blueprints Service (or its JSON, or GLSL with blueprintLand); empty, the one of the library (LibraryLand()). Its Blueprint (a material graph) still paints it, in LandPaint.',
			Graphs: 'The shader graphs of a world of its own by their names, the scene made again in place when one is given anew (its objects, its view and its time kept; behind a soft veil while its programs are made): shader/bake (BakeGraph), shader/weather (WeatherGraph), shader/bolt (BoltGraph), shader/air (AirGraph), shader/clouds (CloudsGraph), shader/forecast (ForecastGraph), shader/galaxy (GalaxyGraph), shader/cosmos (CosmosGraph), shader/ring (RingGraph), shader/planet (PlanetGraph), shader/ground (GroundGraph), planet/envelope (EnvelopeGraph), star (the stars with no Blueprint of their own: their surface, crown, beams and numbers); its props of them come first.',
			BoltGraph: 'The shape of its lightnings, of a storm and of its effects: a generator of the Blueprints Service of the jag of each step (its results X and Z; or its JSON); empty, the one of the library (SceneBlueprints.LibraryBolt()).',
			PlanetGraph: 'Its globes seen from far: a planet graph of the Blueprints Service of their picture lit, their clouds and the shadows of them and of a ring, their towns at night, their air at the edge (or its JSON, or GLSL with blueprintPlanet); empty, the one of the library (LibraryPlanet()).',
			EnvelopeGraph: 'What lies over and under the surface of its bodies (their air, decks of clouds, seas, the depths of a giant): a generator of numbers of the Blueprints Service of the blocks EnvelopeState and EnvelopeLight of the Envelope Service (its results Pressure, Temperature, Zone and Light; or its JSON); empty, the one of the library (LibraryEnvelope()).',
			GroundGraph: 'The ground of its globes near and from over them: a ground graph of the Blueprints Service of its picture, its woods, fields, snow and dunes, its relief, the tiles near, the shadows of its clouds and of a ring, its water, towns at night, clouds from over them and air (or its JSON, or GLSL with blueprintGround); empty, the one of the library (LibraryGround()).',
			GroundFarGraph: 'How a texel of the picture of the far ground of its planets looks (a generator graph of numbers, or the name of one: blueprints/shader/ground-far, of its land, sea, slope, warmth, wet, deserts, fields, houses, a river and a highway: R, G, B, Water, Trees, Farm, Built, Dune, Snow); empty, Graphs of shader/ground-far, else the one of the library. Made code in the page, it paints the planet in its workers.',
			SkyLightGraph: 'The light of the sky on all it lights and mirrors (a generator graph of numbers: blueprints/shader/sky-light, of WayY, SunDot, SunY, Spread, SkyR/G/B, FloorR/G/B, Gain: R, G, B): the sea, glass, the paint of a car, the objects, the grass, the land and the probes; empty, Graphs of shader/sky-light, else the one of the library. Read as the scene is made.',
			RingGraph: 'The rings round its bodies: a ring graph of the Blueprints Service of their bands, gaps, colors and light (or its JSON, or GLSL with blueprintRing); empty, the one of the library (LibraryRing()).',
			CosmosGraph: 'What lies far behind a system, the sky its Cosmos is baked of: a cosmos graph of the Blueprints Service of its parts (gas, dust, the band of a galaxy, bursts, galaxies far off, pillars, stars, clusters; or its JSON, or GLSL with blueprintCosmos); empty, the one of the library (LibraryCosmos()).',
			GalaxyGraph: 'The arms of a galaxy, its picture, its stars and the band of it across the sky of a system alike: a generator of the Blueprints Service of the blocks of GalaxyData (its results Turn, Bend, Wave and Arm; or its JSON); empty, the one of the library (SceneBlueprints.LibraryGalaxy()).',
			ReactorGraph: 'A step of a reactor of the systems of an object (SceneShipSystems): Heat, Tripped, Supply of Heat, Load, Rise, Cool, Elapsed, On, Tripped, Trip, Resume, Output; empty, the one of the library (blueprints/vehicles/reactor); of the Power of an object wins.',
			PowerGraph: 'What the power of the reactors gives each system (SceneShipSystems): Engines, Shields, Weapons, Load of Supply, the needs and the shares of each; empty, the one of the library (blueprints/vehicles/power).',
			ShieldGraph: 'A step of a layer of a shield (SceneShipSystems): Value of Value, Capacity, Regen, Power, Since, Delay, Elapsed; empty, the one of the library (blueprints/vehicles/shield).',
			ShipButtons: 'Its own buttons of the commands of a ship (Landing, Take off, To orbit) over the view; false: none, the commands given by a game (ShipCommands, ShipCommand: on its consoles, its panels).',
			MassLock: 'Ships near ships of another team go no faster than a fight goes, by the frame of their fight (the soft mass lock: MassLockGraph); off by default.',
			MassLockGraph: 'How fast a ship may go near ships of another team (Distance, Top -> Top, Lock): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/vehicles/masslock).',
			BoardGraph: 'How one gets into a vehicle and out of it step by step (Kind, Height, Door -> Open, Enter, Sit, Close: seconds; Clip, Duck): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/vehicles/board).',
			ReadoutGraph: 'What the instruments of a vehicle or of a character on foot read (Speed, TopSpeed, SpeedPart, RpmPart, Gear, Left, Right, Lights, HealthPart of Forward, Top, Rpm, Redline, Gear, Indicate, Hazard, Blink, Lights, Health, MaxHealth): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/vehicles/readout); ReadoutGraph of a vehicle wins.',
			DrivesGraph: 'What each moving part, lamp, emitter and pop of a vehicle is driven to of its state (steer, gas, wipers, stroke, lamp-brake... of Steer, Gas, Swept, Stroke...): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/vehicles/drives); DrivesGraph of a vehicle wins.',
			WheelGraph: 'How each wheel of a car turns of its state (SpinAngle, SteerAngle, Drop, Camber of Spin, Steer, Stroke, Size, Front, Held, Side): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/vehicles/wheel); WheelGraph of a vehicle wins.',
			ThrustGraph: 'How what burns on an engine looks of its thrust (Length, Intensity, Inside of Thrust): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/vehicles/thrust); ThrustGraph of a vehicle wins.',
			LandingLookGraph: 'How a landing looks as it goes (Heat, Fov, Thrust, Raise, TransferThrust, OrbitThrust, HoverThrust of Thick, Speed, Over, Going, Throttle, Manual, T, Landed, Pull, Flat, Top): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/landing/look).',
			FeetGraph: 'How the feet of one of legs keep to the ground (DownLeft, DownRight: metres the ground under each foot is above its own, Size, Speed, Grounded -> Drop: its hips down, Left, Right: each foot up or down, Rate): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/animation/feet).',
			BlendGraph: 'Which gaits a model goes in at a speed (Speed, Walk, Jog, Sprint: the speeds of its walk, jog and sprint at their own pace -> Low, High: 0 walk, 1 jog, 2 sprint; Weight of the high one, blended as one cycle): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/animation/blend). An object of Blend false keeps the gait it is given.',
			LookbackGraph: 'What the weather of hours ago left on the ground, a step of it (Wet, Snow, Warm, Hours, Was -> Wetness, Cover): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/weather/lookback).',
			LocalWeatherGraph: 'The weather of a place of a planet of its forecast there (Cover, Kind, Cirrus, Rain, Warm -> Clouds, Kind, High, Wind, Fog, Rain, Snow, Wet, Storm: the numbers of the weather of a scene): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/weather/local).',
			BodyGraph: 'How the body of a car leans on its springs (Accel, Lateral: m/s², Stiff, Grounded -> Pitch, Roll radians, Spring, Damp): a generator graph of the Blueprints Service (or its JSON); empty, BodyGraph of the vehicle, else the one of the library (blueprints/vehicles/body).',
			BankGraph: 'How a ship banks into a turn (Turn: rad/s, Speed, Top, Air, Landed -> Roll radians, View: the share of it every view banks with, Spring, Damp): a generator graph of the Blueprints Service (or its JSON); empty, BankGraph of the vehicle, else the one of the library (blueprints/vehicles/bank).',
			TransitionGraph: 'How a clip of a model gives way to the next (FromKnown, FromGait, ToGait, FromOnce, ToOnce, ToHold -> Fade: seconds, Ease: 1 eased, Sync: 1 the next goes on from the phase of the last, its steps in time): a generator graph of the Blueprints Service (or its JSON); empty, Transition of the recipe of the model, else the one of the library (blueprints/animation/transition).',
			ShakeGraph: 'How a view shakes (X, Y, Z, Pitch, Yaw, Roll of a rig; HeatRight, HeatUp; KickTaken; TraumaPitch, TraumaYaw, TraumaRoll, BlastLeft; WarpRight, WarpUp of Time, Seed, Shake, Hover, Walked, Stride, Heat, Size, Kick, Elapsed, Blast, Rpm, Jolt, Warp): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/camera/shake).',
			TravelLookGraph: 'How a warp and a jump look in each of their phases (Stretch, Tunnel, Flash, Shake, Wide, Lag, Pace of the Phase: 0 into it, 1 in it, 2 out of it; Warp: 1 a warp, 0 a jump; T of the phase; Time in it): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/vehicles/travel-look).',
			SeasonGraph: 'The season of the sun and what it does to plants and the land (Warmth, Rising, Bare, Turn, Blossom, Dry, Snow of its Fixed season, Latitude, YearDays and DayOfYear): a generator graph of the Blueprints Service (or its JSON); empty, the one of the library (blueprints/weather/season).',
			ForecastGraph: 'The weather of a planet, its clouds, cirrus and rain over its body as its days go: a graph of numbers of the Blueprints Service of the blocks of SceneForecast (or its JSON), read by its shader and the page alike; empty, the one of the library (LibraryForecast()).',
			CloudsGraph: 'The clouds (of the weather of a planet, its globe and round the eye over it, the layer of a scene): a clouds graph of the Blueprints Service (or its JSON); empty, the one of the library (LibraryClouds()).',
			AirGraph: 'The air between the eye and what it sees (the haze, the fog, the eye under the sea): an air graph of the Blueprints Service (or its JSON); empty, the one of the library (LibraryAir()).',
			WeatherGraph: 'What the weather and the year do to the surfaces of things (their leaves in autumn, snow, pools, a beam that takes a body away): a weather graph of the Blueprints Service (or its JSON); empty, the one of the library (LibraryWeather()).',
			BakeGraph: 'What the surface of a body of noise is, baked into its cubes (its land read by its ground too): a bake graph of the Blueprints Service (or its JSON, or GLSL with blueprintBake); empty, the one of the library (LibraryBake()).',
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
			Scale: {Options: ['compressed', 'real'], Description: 'Large bodies and short distances (compressed), or their real sizes, or a number between them: 0 compressed to 1 real (a slider, as their ratio goes).'},
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
	PlantStyle: 'realistic',
	Shadows: true,
	Compute: 'auto',
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
	Cutaway: false,
	Shoulder: 'right',
	Axes: '',
	WindGraph: null,
	GrassGraph: null,
	SkyGraph: null,
	BakeGraph: null,
	WeatherGraph: null,
	AirGraph: null,
	CloudsGraph: null,
	ForecastGraph: null,
	SeasonGraph: null,
	DrivesGraph: null,
	ReadoutGraph: null,
	BoardGraph: null,
	MassLock: false,
	MassLockGraph: null,
	ShipButtons: true,
	ReactorGraph: null,
	PowerGraph: null,
	ShieldGraph: null,
	WheelGraph: null,
	ThrustGraph: null,
	LandingLookGraph: null,
	ShakeGraph: null,
	TransitionGraph: null,
	BodyGraph: null,
	LocalWeatherGraph: null,
	LookbackGraph: null,
	BankGraph: null,
	BlendGraph: null,
	FeetGraph: null,
	TravelLookGraph: null,
	GalaxyGraph: null,
	CosmosGraph: null,
	RingGraph: null,
	PlanetGraph: null,
	GroundGraph: null,
	GroundFarGraph: null,
	SkyLightGraph: null,
	EnvelopeGraph: null,
	BoltGraph: null,
	Graphs: null,
	LandGraph: null,
	WaterGraph: null,
	Origin: false,
	Wireframe: false,
	Levels: false,
	Proxies: true,
	CacheSize: 200,
	Clusters: true,
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
	/* What Levels shows in its corner: the draws and triangles of a frame, the tiles and copies of what is sown. */
	LevelsText: '',

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
		var bases = library.Kinds;
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
			/* What a cave holds (Under: its roof or its floor): dripstones hanging and standing, stones fallen, crystals that glow. */
			'dripstones': {Traits: {Scatter: {Shapes: ['stalactite'], Under: 'ceiling', Density: 7, Cover: 0.7, Patch: 14, Size: [0.5, 1.5], Blocks: false}}},
			'cave-floor': {Traits: {Scatter: {Shapes: ['stalagmite', 'stalagmite', 'rock'], Under: 'floor', Density: 3, Cover: 0.6, Patch: 12, Size: [0.4, 1.2], Blocks: false}}},
			'cave-crystals': {Traits: {Scatter: {Shapes: ['cave-crystal'], Under: 'floor', Density: 0.5, Cover: 0.35, Patch: 16, Size: [0.6, 1.3], Blocks: false}}},
			'grass': {Traits: {Grass: {Density: 1, Height: 0.75, Color: '#7fae4a', Root: '#2f5a22', Clumps: 0, Patch: 24, Spread: 0.45}}},
			'village': {Traits: {Settlement: {Houses: 8, Radius: 30}}}
		};
	},

	/* The kinds of the setting space. */
	Space: function () {
		var orbit = {Distance: 1, Eccentricity: 0, Inclination: 0, Node: 0, Periapsis: 0, Anomaly: 0, Period: null, Unit: 'AU'};

		return {
			'star': {Traits: {Star: {Type: 'main', Mass: 1, Radius: null, Temperature: null, Luminosity: null, Color: '', Veil: 3, Corona: 1, Prominences: 1, Flares: 1, Blueprint: null, Parameters: null}, Selectable: {}}},
			/*
			 * Stars not of the main sequence (Astronomy.Types): swollen old ones, and what is left when a star ends. A neutron
			 * star turns once in Spin seconds; a pulsar sweeps its two Beams round with it, a magnetar glows along the lines
			 * of its Field and flares; a brown dwarf is banded (Bands) as a gas giant is. Each may go round another (an Orbit of no
			 * Distance till one is given: a star of its own at the middle).
			 */
			'giant': {Extends: 'star', Traits: {Orbit: Object.assign({}, orbit, {Distance: 0}), Star: {Type: 'giant', Mass: 1.3, Radius: 25, Temperature: 4300}}},
			'supergiant': {Extends: 'star', Traits: {Orbit: Object.assign({}, orbit, {Distance: 0}), Star: {Type: 'supergiant', Mass: 18, Radius: 650, Temperature: 3600, Prominences: 0.6}}},
			'white-dwarf': {Extends: 'star', Traits: {Orbit: Object.assign({}, orbit, {Distance: 0}), Star: {Type: 'white-dwarf', Mass: 0.6, Temperature: 22000, Veil: 1, Corona: 0.3, Prominences: 0, Flares: 0}}},
			'neutron-star': {Extends: 'star', Traits: {Orbit: Object.assign({}, orbit, {Distance: 0}), Star: {Type: 'neutron', Mass: 1.4, Temperature: 800000, Veil: 0, Corona: 0, Prominences: 0, Flares: 0, Spin: 0.8, Beams: 0, Field: 0}}},
			'pulsar': {Extends: 'neutron-star', Traits: {Star: {Type: 'pulsar', Beams: 1}}},
			'magnetar': {Extends: 'neutron-star', Traits: {Star: {Type: 'magnetar', Spin: 6, Beams: 0.3, Field: 1, Flares: 1}}},
			'brown-dwarf': {Extends: 'star', Traits: {Orbit: Object.assign({}, orbit, {Distance: 0}), Star: {Type: 'brown-dwarf', Mass: 0.05, Temperature: 1200, Veil: 0.5, Corona: 0, Prominences: 0, Flares: 0.2, Bands: 1}}},
			'planet': {Traits: {Orbit: orbit, Body: {Radius: 6371, Mass: null, Day: 24, Tilt: 0, Albedo: null}, Surface: {Type: 'rocky', Colors: '', Water: '', Ocean: null, Ice: null, Clouds: null, Planet: null, Atmosphere: '', Seed: ''}, Selectable: {}}},
			'moon': {Extends: 'planet', Traits: {Body: {Radius: 1737, Day: 0}, Surface: {Type: 'moon'}}},
			/* The common centre of stars and black holes going round one another (a binary, a triple): nothing is drawn of it. */
			'barycentre': {Traits: {Barycentre: {Mass: null, Members: null}}},
			/*
			 * A star cluster (open, globular, nuclear): the middle its stars go round as round a barycentre, and its stars too many
			 * to tell one by one (Count) a swarm round it Radius light-years across, of its Seed (GalaxyData.Cluster).
			 */
			/* A cloud of gas and dust (SceneNebula): Type hii, planetary, remnant (Subtype Ia, II, Ib, Ic) or dark, Radius in light years. */
			'nebula': {Traits: {Orbit: Object.assign({}, orbit, {Distance: 0}), Nebula: {Type: 'hii', Subtype: '', Radius: 3, Seed: '', Density: 1, Glow: 1, Colors: '', Blueprint: null, Parameters: null}, Selectable: {}}},
			'cluster': {Traits: {Barycentre: {Mass: null, Members: null}, Cluster: {Type: 'open', Radius: 6, Count: 0, Seed: ''}}},
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

		/* The fingers on it: their gestures (Gestures), what a finger does where a mouse has its buttons (Gesture). */
		this.GesturesStop = this.$Service('Gestures').Listen(element.querySelector('.elemenx-scene-canvas'), function (gesture) {
			self.Gesture(gesture);
		});

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
		/* Of the names this frame: which of the stars of a crowded cluster are named, whether the eye is in the rooms of a ship. */
		var labelFrame = {Walled: false, Named: {}};
		var graphics = this.$Service('Renderer');
		var meshes = this.$Service('Meshes');
		var math = this.$Service('Math');
		var astronomy = this.$Service('Astronomy');
		var kinds = this.$Service('SceneKinds');
		var library = this.$Service('SceneModels');
		var random = this.$Service('Random');
		var markup = this.$Service('Text');
		var vectors = math.Vectors;
		var view = element.ownerDocument.defaultView || window;
		var shaders = this.Globed(this.Forecasted(this.Clouded(this.Aired(this.Weathered(this.Baked(this.Landed(this.Skied(this.Watered(this.Winded(this.Shaders(graphics)))))))))));
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
		var places = {X: 0, Y: 0, Width: 1, Height: 1, Blocks: false, Opaque: false};
		var paints = {};
		var painter = element.ownerDocument.createElement('canvas').getContext('2d');
		var scene = {
			Objects: {},
			Order: [],
			Roots: [],
			Asked: {},
			Broken: {},
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
			Swarms: {},
			Baked: {},
			Rivers: {},
			Towns: {},
			Highways: {},
			PlanetData: {},
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
			DrawnCount: {Frames: 0, Cpu: 0, Draws: 0, Triangles: 0, At: 0},
			Focus: '',
			Selected: '',
			Pointers: {},
			Drag: null,
			Pinch: null,
			Width: 0,
			Height: 0,
			Patience: 90,
			Steady: 1000,
			/* A phone draws at most 1.5 pixels of its screen to a point of the page (its 2.6 cost its card three times as much). */
			Ratio: Math.min(this.Phone() ? 1.5 : 2, view.devicePixelRatio || 1),
			Most: Math.min(this.Phone() ? 1.5 : 2, view.devicePixelRatio || 1),
			Slow: 0,
			Fast: 0,
			Last: 0,
			Colors: {Background: [0.01, 0.02, 0.04, 1], Orbit: [0.55, 0.65, 0.85, 0.3], Selection: [0.5, 0.77, 1, 1], Wire: [0.35, 0.85, 0.45, 0.7], Outline: [1, 0.72, 0.15, 1], Hover: [0.5, 0.82, 1, 1], Edges: [0.88, 0.25, 0.98, 1], Collider: [1, 0.55, 0.15, 0.9]},
			Painted: 0
		};

		/* The light of the sky of its graph in each shader (SkyLit), before its programs are made. */
		if (renderer)
			renderer.Replaces[graphics.Chunks.SkyLight] = this.SkyLit();

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

		/*
		 * A color #rrggbb (or rrggbb) as [r, g, b] of 0 to 1, of no canvas: fallback of any other text. One for the traits
		 * (their own colors of effects, stars, nebulae...). Regression: eight of them, each its own way with a wrong text (a
		 * fallback, white or no number at all).
		 */
		function hex (text, fallback) {
			var value = String(text || '').trim().replace(/^#/, '');
			if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;

			return [parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255];
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

		/* The specs of a system of a seed: its bodies as objects of the kinds of space (SystemData.Seeded). */
		function seeded (seed) {
			return self.$Service('SystemData').Seeded(seed);
		}

		/*
		 * A system of data (System: {Data: the URL of its file, or a key of SystemData.Use}): opened once, the planets kept in
		 * it given to ScenePlanet, then its objects (SystemData.Objects); none while it comes.
		 */
		function systemData (key) {
			var systems = self.$Service('SystemData');
			var held = scene.SystemData;
			var data = systems.DataOf(key);
			var at = true;

			if (held && held.Key === key)
				return held.Ready ? systems.Objects(systems.DataOf(key), key) : [];

			held = scene.SystemData = {Key: key, Ready: false};

			/* Its planets given to ScenePlanet: at once (its objects now), or later (the scene made again then). */
			function bodies (made) {
				systems.UseBodies(key, made, function (failed) {
					if (scene.Gone || scene.SystemData !== held) return;

					if (failed)
						self.$Emit('error', failed);

					held.Ready = true;

					if (at)
						return;

					compose();

					/* Seen whole as it comes, unless the view was sent to an object of it. */
					place(scene.Time);

					if (!scene.Focus)
						scene.Wanted = scene.Distance = extent() * 1.6;

					scene.Version++;
				});
			}

			if (data) {
				bodies(data);
			}
			else {
				systems.Open(key, function (error, made) {
					if (scene.Gone || scene.SystemData !== held) return;

					if (error) {
						self.$Emit('error', error);

						return;
					}

					systems.Use(key, made);

					bodies(made);
				});
			}

			at = false;

			return held.Ready ? systems.Objects(data, key) : [];
		}

		/* The specs of the System prop: a body may hold its own in Children; or a system of data. */
		function given (system) {
			if (system && typeof system.Data === 'string' && system.Data) return systemData(system.Data);

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
		/* The layer of the marks of aiming (SceneVehicles) shown or not. */
		function sighted (shown) {
			var sight = element.querySelector('.elemenx-scene-sight');
			if (sight)
				sight.hidden = !shown;
		}

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
					object.Parent = trait(object, 'Star') || trait(object, 'Barycentre') || trait(object, 'Nebula') || !first ? '' : first.ID;
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
			scene.Crowds = {};

			/* How many go round each: the orbits of a crowd (the stars of a cluster) are drawn of the one chosen only. */
			order.forEach(function (object) {
				if (object.Parent)
					scene.Crowds[object.Parent] = (scene.Crowds[object.Parent] || 0) + 1;
			});

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
			var how = realness();
			var real = how >= 0.999;
			var distance = orbit && orbit.Unit !== 'radii' ? astronomy.Length(orbit.Distance) : 0;
			var far;
			var near;
			var kind;

			while (star && !trait(star, 'Star')) {
				/* Round a barycentre: the light of the most massive star of its group. */
				if (trait(star, 'Barycentre')) {
					star = Object.keys(objects).map(function (id) {
						return objects[id];
					}).filter(function (each) {
						return each.Parent === star.ID && trait(each, 'Star');
					}).sort(function (a, b) {
						return number(trait(b, 'Star').Mass, 1) - number(trait(a, 'Star').Mass, 1);
					})[0] || null;

					break;
				}

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
				object.Size = between(2 * Math.pow(object.Star.Radius, 0.35), object.Star.Radius * astronomy.SunRadius * KM * UNIT, how);
			}
			else if (body) {
				kind = astronomy.Kinds[surface ? surface.Type : 'rocky'] || astronomy.Kinds.rocky;
				object.Info = astronomy.Describe({Kind: surface ? surface.Type : 'rocky', Radius: body.Radius, Mass: body.Mass, Albedo: body.Albedo, Day: body.Day, Orbit: orbit && orbit.Unit !== 'radii' ? orbit : null}, {Star: star ? star.Star : astronomy.Star({}), Distance: distance, Mass: object.Around});
				object.Radius = object.Info.Radius;
				object.Look = look(surface || {Type: 'rocky'}, kind);
				object.Size = between(0.5 * Math.pow(object.Radius / astronomy.EarthRadius, 0.45), object.Radius * KM * UNIT, how);
			}
			else if (model) {
				/*
				 * What walks in a location of a system, and the inside of a ship standing there (SceneAboard): of the location, its
				 * size in metres, and so what was added in it (of its ground: Include). Regression: a pilot out of its ship was 3.6 cm
				 * tall, the inside of the ship a fiftieth of it; a crate set on the ground there 2.4 cm.
				 */
				var located = !!scene.Location && !object.Owner && (!!object.Values.Aboard || !!trait(object, 'Walker') || object.Parent === scene.Location.Ground);

				object.Size = object.Owner ? object.Owner.Size * number(model.Size, 1) : number(model.Size, 0.1) * (model.Relative && parent ? parent.Size : 1) * (model.Relative || located ? 1 : between(1, 0.02, how));

				/*
				 * In real sizes a craft is as long as it is: Length (metres) of it or of its Vehicle, its longest side (craftScale:
				 * of its model, once it came). Regression: its height was (a model of a file is fitted to a height of 1), a
				 * cruiser of 280 m was drawn 1.8 km long.
				 */
				if (real && !object.Owner && lengthOf(object)) {
					object.Size = lengthOf(object) * METRE / craftScale(object);
					object.Lengthed = true;
				}
			}
			else if (trait(object, 'Nebula')) {
				/* As wide as its Radius of light years laid out as the distances of the scene are. */
				object.Size = vectors.Length(spread([number(trait(object, 'Nebula').Radius, 3) * astronomy.Units.ly, 0, 0], null));
				object.Info = engine.NebulaInfo ? engine.NebulaInfo(object) : null;
			}
			else if (!self.DeepSize || !self.DeepSize(object, false, KM * UNIT)) {
				object.Size = 0;
			}
			else if (how > 0) {
				/* Between the sizes of the view and the real ones: of both, by how real the scale is. */
				near = object.Size;

				self.DeepSize(object, true, KM * UNIT);

				far = object.Size;
				object.Size = between(near, far, how);
			}

			if (trait(object, 'Formation'))
				object.Size = 0.07 * between(1, 0.02, how);

			/* A ship down in a location is as long as it is, in metres (SceneLanding). */
			if (object.Located)
				object.Size = object.Located;
		}

		/*
		 * The longest side of the model of a craft in its units (SceneModels.Extent), 1 before it came: a craft Length metres
		 * long is drawn at Length over it (engine.CraftScale, SceneLanding too).
		 */
		function craftScale (object) {
			var name = object.Values.Model || (trait(object, 'Model') || {}).Shape;
			var extent = name && typeof name === 'string' && library.Has(name) ? library.Extent(name) : null;

			return extent ? Math.max(extent[0], extent[1], extent[2], 1e-6) : 1;
		}

		engine.CraftScale = craftScale;

		/* The length of a craft in metres (Length of it, else of its Vehicle); 0 for none. */
		function lengthOf (object) {
			var vehicle = object.Values.Vehicle;

			return number(object.Values.Length, 0) || (vehicle && typeof vehicle === 'object' ? number(vehicle.Length, 0) : 0);
		}

		/*
		 * The color of a level of detail while Levels is on, over what is drawn at it ([r, g, b, how much]; nothing while it is
		 * off): near ones (a model and its simpler levels, the picture of the farthest) green, yellow, orange and red; the
		 * proxies of tiles (SceneProxies) cyan, blue, violet and pink as they are larger; the squares of a ground by their
		 * depth, from grey (the coarsest) through the same colors.
		 */
		engine.LevelColor = function (kind, level) {
			var near = [[0.2, 0.85, 0.3], [0.95, 0.85, 0.2], [1, 0.5, 0.1], [0.9, 0.2, 0.25]];
			var far = [[0.2, 0.8, 0.95], [0.25, 0.45, 1], [0.6, 0.3, 1], [0.95, 0.3, 0.85]];
			var ground = [[0.5, 0.5, 0.5], [0.95, 0.3, 0.85], [0.6, 0.3, 1], [0.25, 0.45, 1], [0.2, 0.8, 0.95], [0.9, 0.2, 0.25], [1, 0.5, 0.1], [0.95, 0.85, 0.2], [0.2, 0.85, 0.3]];
			var list = kind === 'proxy' ? far : kind === 'ground' ? ground : near;
			var color;

			if (!self.Levels || self.Levels === 'false') return [0, 0, 0, 0];

			color = list[Math.max(0, Math.min(list.length - 1, kind === 'proxy' ? level - 1 : level))];

			return [color[0], color[1], color[2], 0.7];
		};

		/*
		 * A fragment shader colored by its level: its main run as it was, then what it wrote mixed toward uLevel (by its
		 * alpha; 0, as it was), kept as light or as dark as it was, so the shapes are still seen.
		 */
		engine.Leveled = function (fragment) {
			var at = fragment.lastIndexOf('void main() {');

			return fragment.slice(0, at) + 'void leveledMain() {' + fragment.slice(at + 13) + '\nuniform vec4 uLevel;\nvoid main() {\n\tleveledMain();\n\tif (uLevel.a > 0.0) outColor.rgb = mix(outColor.rgb, uLevel.rgb * (0.3 + 0.9 * dot(outColor.rgb, vec3(0.333))), uLevel.a);\n}\n';
		};

		/* A metre in the units of the view, in real sizes; null when compressed. */
		engine.Metre = function () {
			return realness() >= 0.999 ? METRE : null;
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
				Kind: self.$Service('ScenePlanet').SurfaceType(surface.Type).Shader,
				Colors: (Array.isArray(surface.Colors) ? surface.Colors : surface.Colors ? String(surface.Colors).split(',') : kind.Colors).map(function (color) {
					return paint(String(color).trim()).slice(0, 3);
				}).concat([[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]]).slice(0, 4),
				Water: paint(surface.Water || kind.Water || '#1d4f8f').slice(0, 3),
				Ocean: number(surface.Ocean, kind.Ocean || 0),
				Ice: number(surface.Ice, kind.Ice || 0),
				Clouds: number(surface.Clouds, kind.Clouds || 0),
				Atmosphere: surface.Atmosphere === 'none' ? [0, 0, 0, 0] : surface.Atmosphere || kind.Atmosphere ? paint(surface.Atmosphere || kind.Atmosphere).slice(0, 3).concat([self.$Service('ScenePlanet').Giant(surface.Type) ? 0.6 : 0.9]) : [0, 0, 0, 0]
			};
		}

		/* The mass an object goes round, in masses of the Sun. */
		function massAround (object, parent, objects) {
			if (parent && trait(parent, 'Star'))
				return number(trait(parent, 'Star').Mass, 1);

			if (parent && trait(parent, 'BlackHole'))
				return number(trait(parent, 'BlackHole').Mass, 10);

			/*
			 * A barycentre: its Mass, or of its group going round it: its Members (stars and black holes: a star and a black
			 * hole in a pair), else the stars round it (a black hole round it further out goes round it as a planet does).
			 */
			if (parent && trait(parent, 'Barycentre'))
				return number(trait(parent, 'Barycentre').Mass, 0) || Object.keys(objects).reduce(function (sum, id) {
					var each = objects[id];
					var members = trait(parent, 'Barycentre').Members;

					if (each.Parent !== parent.ID) return sum;
					if (members && members.length ? members.indexOf(each.ID) === -1 : !trait(each, 'Star')) return sum;

					return sum + (trait(each, 'Star') ? number(trait(each, 'Star').Mass, 1) : trait(each, 'BlackHole') ? number(trait(each, 'BlackHole').Mass, 10) : 0);
				}, 0) || 1;

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

		/*
		 * How real the sizes and the distances are: 0 compressed (Scale compressed, large bodies, short distances, nothing
		 * crowded), 1 real (Scale real), and any number between (a slider from the one to the other).
		 */
		function realness () {
			var given = self.Scale;
			if (given === 'real') return 1;

			if (given === '' || given === null || given === undefined || given === 'compressed' || isNaN(Number(given))) return 0;

			return Math.max(0, Math.min(1, Number(given)));
		}

		/* Of a size or a distance of the view (a) and a real one (b): how far from the one to the other (t), as their ratio goes (a log step). */
		function between (a, b, t) {
			if (t <= 0) return a;

			if (t >= 1) return b;

			if (a > 0 && b > 0)
				return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);

			return a + (b - a) * t;
		}

		/* The length in the view of a distance a (km) round a parent, as compressed: the far shortened, the near round a body spread out. */
		function compressed (a, parent) {
			return parent && parent.Radius ? parent.Size * (1 + 0.6 * Math.sqrt(a / (parent.Radius * KM))) : 12 * Math.sqrt(a);
		}

		/* A place round a parent in the units of the view, between compressed and real (realness). */
		function spread (relative, parent) {
			var a = vectors.Length(relative);
			var how = realness();

			if (!a)
				return [0, 0, 0];

			if (how >= 1)
				return vectors.Scale(relative, UNIT);

			return vectors.Scale(relative, between(compressed(a, parent), a * UNIT, how) / a);
		}

		/* The distance (km) round a parent that spread lays out at a length of the view: of the two ways, or found between them. */
		function unspread (length, parent) {
			var how = realness();
			var low = 1e-9;
			var high = 1e12;
			var middle;
			var i;

			if (how >= 1)
				return length / UNIT;

			if (how <= 0)
				return parent && parent.Radius ? Math.pow(Math.max(0, (length / parent.Size - 1) / 0.6), 2) * parent.Radius * KM : Math.pow(length / 12, 2);

			for (i = 0; i < 80; i++) {
				middle = Math.sqrt(low * high);

				if (between(compressed(middle, parent), middle * UNIT, how) < length) low = middle;
				else high = middle;
			}

			return Math.sqrt(low * high);
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

			if (self.GraphOf('BakeGraph', 'shader/bake') && self.BakeMade && !shaderChecked('bake', 'BakeGraph', self.BakeMade, graphics.Shaders.Quad, shaders.Bake))
				self.BakeMade = self.Made(null, 'bake', 'BakeGraph', self.LibraryBake.bind(self));

			if (self.GraphOf('CloudsGraph', 'shader/clouds') && self.CloudsMade && !shaderChecked('clouds', 'CloudsGraph', self.CloudsMade, shaders.Lit, shaders.Planet))
				self.CloudsMade = self.Made(null, 'clouds', 'CloudsGraph', self.LibraryClouds.bind(self));

			if (self.GraphOf('AirGraph', 'shader/air') && self.AirMade && (!shaderChecked('air', 'AirGraph', self.AirMade, shaders.ThingsVertex, shaders.Things)))
				self.AirMade = self.Made(null, 'air', 'AirGraph', self.LibraryAir.bind(self));

			if (self.GraphOf('RingGraph', 'shader/ring') && self.RingMade && !shaderChecked('ring', 'RingGraph', self.RingMade, shaders.Lit, shaders.Ring))
				self.RingMade = self.Made(null, 'ring', 'RingGraph', self.LibraryRing.bind(self));

			if (self.GraphOf('PlanetGraph', 'shader/planet') && self.PlanetMade && !shaderChecked('planet', 'PlanetGraph', self.PlanetMade, shaders.Lit, shaders.Planet))
				self.PlanetMade = self.Made(null, 'planet', 'PlanetGraph', self.LibraryPlanet.bind(self));

			if (self.GraphOf('GroundGraph', 'shader/ground') && self.GroundMade && !shaderChecked('ground', 'GroundGraph', self.GroundMade, shaders.GroundVertex, shaders.Ground))
				self.GroundMade = self.Made(null, 'ground', 'GroundGraph', self.LibraryGround.bind(self));

			if (self.GraphOf('WeatherGraph', 'shader/weather') && self.WeatherMade && (!shaderChecked('weather', 'WeatherGraph', self.WeatherMade, shaders.Instanced, shaders.Pbr) || !shaderChecked('weather', 'WeatherGraph', self.WeatherMade, shaders.Instanced, shaders.Solid)))
				self.WeatherMade = self.Made(null, 'weather', 'WeatherGraph', self.LibraryWeather.bind(self));

			shaders = self.Globed(self.Forecasted(self.Clouded(self.Aired(self.Weathered(self.Baked(self.Landed(self.Skied(self.Watered(self.Winded(self.Shaders(graphics)))))))))));
		}

		/* The meshes and programs, made once (and again when the browser gives a lost context back). */
		function build () {
			if (!renderer) return;

			checkScene();

			/*
			 * Each program made the first time it is asked for: a scene in space does not wait for the card to make the programs
			 * of a ground, a sea or a sky it has none of. Regression: all of them were made at once, and the Orbit demo waited
			 * some 30 s more for programs it never drew (the card makes them one after another, slowly under load).
			 */
			function lazy (name, make) {
				var made = null;

				Object.defineProperty(gpu, name, {configurable: true, enumerable: true, get: function () {
					if (!made)
						made = make();

					return made;
				}, set: function (value) {
					made = value;
				}});
			}

			lazy('Planet', function () {
				return renderer.Program(shaders.Lit, shaders.Planet);
			});
			lazy('Bake', function () {
				return renderer.Program(graphics.Shaders.Quad, shaders.Bake);
			});
			lazy('Star', function () {
				return renderer.Program(shaders.Lit, shaders.Star);
			});
			lazy('Air', function () {
				return renderer.Program(shaders.Lit, shaders.Air);
			});
			lazy('AirAround', function () {
				return renderer.Program(shaders.AirAround, shaders.Air);
			});
			lazy('Ring', function () {
				return renderer.Program(shaders.Lit, shaders.Ring);
			});
			lazy('Many', function () {
				return renderer.Program(shaders.Instanced, engine.Leveled(shaders.Solid));
			});
			lazy('Glow', function () {
				return renderer.Program(shaders.Billboard, shaders.Glow);
			});
			lazy('Line', function () {
				return renderer.Program(shaders.Line, shaders.Flat);
			});
			lazy('Far', function () {
				return renderer.Program(shaders.Far, shaders.Dot);
			});
			lazy('StarsTurned', function () {
				return renderer.Program(shaders.FarTurned, shaders.Dot);
			});
			lazy('Ground', function () {
				return renderer.Program(shaders.GroundVertex, shaders.Ground);
			});

			/*
			 * The land of the materials of a ground (names), with the Blueprint of the ground (own) or none: each made once; behind,
			 * not waited for by the veil (the land of a location come in a flight: Renderer.Program behind).
			 */
			gpu.LandPrograms = {};
			gpu.LandOf = function (own, names, behind) {
				var key = (names || []).join(',');
				var kept = own ? own.Programs : gpu.LandPrograms;

				kept['Land:' + key] = kept['Land:' + key] || renderer.Program(shaders.LandVertex, engine.Leveled(gpu.LandText(own ? own.Fragments.Land : shaders.Land, names)), behind);

				return kept['Land:' + key];
			};

			/* The fragment of the land with the materials of a ground (names) in it (SceneMaterials.Land). */
			gpu.LandText = function (fragment, names) {
				return self.$Service('Renderer').Patch(fragment, 'void landMaterials(vec3 place, float px, inout vec3 color, inout float height) {}', self.$Service('SceneMaterials').Land(names || []));
			};

			lazy('ManyDepth', function () {
				return renderer.Program(shaders.Instanced, shaders.Depth);
			});
			lazy('Pbr', function () {
				return renderer.Program(shaders.Instanced, engine.Leveled(shaders.Pbr));
			});
			lazy('PbrSkinned', function () {
				return renderer.Program(shaders.Skinned, engine.Leveled(shaders.Pbr));
			});
			lazy('GlowMany', function () {
				return renderer.Program(shaders.Instanced, shaders.BodyGlow);
			});
			lazy('Shell', function () {
				return renderer.Program(shaders.Instanced, shaders.Shell);
			});
			lazy('ShellSkinned', function () {
				return renderer.Program(shaders.Skinned, shaders.Shell);
			});
			lazy('Outline', function () {
				return renderer.Program(shaders.Instanced, shaders.Flat);
			});
			lazy('OutlineSkinned', function () {
				return renderer.Program(shaders.Skinned, shaders.Flat);
			});
			lazy('GlowSkinned', function () {
				return renderer.Program(shaders.Skinned, shaders.BodyGlow);
			});
			lazy('SkinDepth', function () {
				return renderer.Program(shaders.Skinned, shaders.Depth);
			});

			gpu.White = null;

			lazy('LandDepth', function () {
				return renderer.Program(shaders.LandVertex, shaders.Depth);
			});
			lazy('GroundDepth', function () {
				return renderer.Program(shaders.GroundVertex, shaders.Depth);
			});
			lazy('Things', function () {
				return renderer.Program(shaders.ThingsVertex, shaders.Things, true);
			});
			lazy('ThingsDepth', function () {
				return renderer.Program(shaders.ThingsVertex, shaders.Depth, true);
			});

			gpu.ShadowMap = null;

			lazy('Sea', function () {
				return renderer.Program(shaders.SeaVertex, shaders.Sea);
			});
			lazy('Sky', function () {
				return renderer.Program(graphics.Shaders.Quad, shaders.Sky);
			});
			lazy('HorizonDepth', function () {
				return renderer.Program(graphics.Shaders.Quad, shaders.HorizonDepth);
			});

			gpu.Sphere = renderer.Mesh(meshes.Sphere({Segments: 64, Rings: 40}));
			gpu.Quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
			gpu.Shapes = {};
			gpu.ShadowShapes = {};
			gpu.VoxelShapes = {};
			gpu.Stars = stars();
			scene.Lines = {};
			scene.Rings = {};
			scene.Rocks = {};
			scene.Swarms = {};
			scene.Baked = {};
		}

		/* The plain shapes and the rocks of a belt, or the geometry of a piece of a model: each a mesh made the first time it is drawn. */
		function shape (name, geometry) {
			if (!gpu.Shapes[name])
				gpu.Shapes[name] = renderer.Mesh(geometry || shapeGeometry(name));

			return gpu.Shapes[name];
		}

		/*
		 * The shape a list casts its shadow by. Of a large model of a file that moves (a car), a simpler one, made once: its
		 * corners within a cell of a hundredth of its size or more become one (shadowGeometry). A map of the shadow sees only the outline, and
		 * the whole car drawn into it again was as many triangles as the car itself. One is made a frame; till then, the whole.
		 */
		function shadowShape (name, list) {
			var geometry = list.Geometry;
			var simple;
			var box;

			if (gpu.ShadowShapes[name] !== undefined)
				return gpu.ShadowShapes[name] || shape(name);

			if (list.Still || !list.Uploaded || !geometry || !geometry.Indices || geometry.Indices.length < 18000 || gpu.ShadowBudget < 1) return shape(name);

			gpu.Simpler = gpu.Simpler || new WeakMap();
			simple = gpu.Simpler.get(geometry);

			if (simple === undefined) {
				gpu.ShadowBudget--;
				box = extentsOf(geometry);
				/* A hundredth of its size, or twice the room between its corners where they are fewer: some four times fewer. */
				simple = shadowGeometry(geometry, Math.max(box[3] - box[0], box[4] - box[1], box[5] - box[2]) * Math.max(0.01, 4 / Math.sqrt(geometry.Indices.length / 6)));
				simple = simple.Indices.length < geometry.Indices.length * 0.6 ? simple : null;

				gpu.Simpler.set(geometry, simple);
			}

			gpu.ShadowShapes[name] = simple ? renderer.Mesh(simple).Instance(list.Uploaded, list.Count) : null;

			return gpu.ShadowShapes[name] || shape(name);
		}

		/*
		 * The shape the still pieces of a model cast their shadow by, as one (shadowJoined): drawn with its first list, as
		 * many copies as it has, and its box round all of theirs. False for the other pieces, then: they are in it. Null while
		 * one of them is not drawn this frame, or not as many times (a door taken away, two cars of one model not alike): each
		 * casts its own. Simpler when it is large (shadowGeometry), one made a frame, as shadowShape.
		 */
		function mergedShadow (models, merged, name) {
			var leader = models[merged.Leader];
			var key = 'merged:' + merged.Leader;
			var box = merged.Box = merged.Box || [0, 0, 0, 0, 0, 0];
			var shadow = merged.Shadow;
			var geometry;
			var extents;
			var simple;
			var i;
			var k;
			var one;

			if (!leader || !leader.Uploaded || !leader.Count) return null;

			for (i = 0; i < merged.Members.length; i++) {
				one = models[merged.Members[i]];

				if (!one || one.Count !== leader.Count || !one.Box) return null;
			}

			if (!gpu.ShadowShapes[key]) {
				if (!shadow.Simple) {
					if (gpu.ShadowBudget < 1) return null;

					gpu.ShadowBudget--;
					geometry = joinedGeometry(shadow.Pieces);
					extents = extentsOf(geometry);
					simple = geometry.Indices.length >= 18000 ? shadowGeometry(geometry, Math.max(extents[3] - extents[0], extents[4] - extents[1], extents[5] - extents[2]) * Math.max(0.01, 4 / Math.sqrt(geometry.Indices.length / 6))) : null;
					shadow.Simple = simple && simple.Indices.length < geometry.Indices.length * 0.6 ? simple : {Positions: geometry.Positions, Normals: null, UVs: null, Colors: null, Joints: null, Weights: null, Indices: geometry.Indices};
				}

				gpu.ShadowShapes[key] = renderer.Mesh(shadow.Simple).Instance(leader.Uploaded, leader.Count);
			}

			if (name !== merged.Leader) return false;

			for (i = 0; i < merged.Members.length; i++) {
				one = models[merged.Members[i]].Box;

				for (k = 0; k < 3; k++) {
					box[k] = i ? Math.min(box[k], one[k]) : one[k];
					box[k + 3] = i ? Math.max(box[k + 3], one[k + 3]) : one[k + 3];
				}
			}

			merged.Mesh = gpu.ShadowShapes[key];

			return merged;
		}

		/*
		 * A simpler shape for a map of a shadow: the corners within one cell of a grid become one, at the middle of them, with
		 * the joints and weights of the first (the body of a car of a file has a skeleton); a face that lost a corner goes. Its
		 * normals and colors are not there: the depth alone is drawn of it. With colored, the colors of the corners of a cell
		 * mixed, the normal and the uv of the first (the voxels of the light of the probes: what color a wall is).
		 */
		function shadowGeometry (geometry, cell, colored) {
			var p = geometry.Positions;
			var joints = geometry.Joints && geometry.Joints.length ? geometry.Joints : null;
			var weights = joints ? geometry.Weights : null;
			var cells = {};
			var map = new Int32Array(p.length / 3);
			var sums = [];
			var counts = [];
			var firsts = [];
			var indices = [];
			var made;
			var key;
			var one;
			var a;
			var b;
			var c;
			var i;
			var k;

			for (i = 0; i < p.length / 3; i++) {
				key = Math.round(p[i * 3] / cell) + ':' + Math.round(p[i * 3 + 1] / cell) + ':' + Math.round(p[i * 3 + 2] / cell);
				one = cells[key];

				if (one === undefined) {
					one = cells[key] = counts.length;

					counts.push(0);
					firsts.push(i);
					sums.push(0, 0, 0);
				}

				sums[one * 3] += p[i * 3];
				sums[one * 3 + 1] += p[i * 3 + 1];
				sums[one * 3 + 2] += p[i * 3 + 2];
				counts[one]++;
				map[i] = one;
			}

			for (i = 0; i < geometry.Indices.length; i += 3) {
				a = map[geometry.Indices[i]];
				b = map[geometry.Indices[i + 1]];
				c = map[geometry.Indices[i + 2]];

				if (a !== b && b !== c && a !== c)
					indices.push(a, b, c);
			}

			made = {Positions: new Float32Array(counts.length * 3), Normals: null, UVs: null, Colors: null, Joints: joints ? new Float32Array(counts.length * 4) : null, Weights: joints ? new Float32Array(counts.length * 4) : null, Indices: indices};

			if (colored)
				coloredOf(geometry, made, map, counts, firsts);

			for (i = 0; i < counts.length; i++) {
				made.Positions[i * 3] = sums[i * 3] / counts[i];
				made.Positions[i * 3 + 1] = sums[i * 3 + 1] / counts[i];
				made.Positions[i * 3 + 2] = sums[i * 3 + 2] / counts[i];

				for (k = 0; joints && k < 4; k++) {
					made.Joints[i * 4 + k] = joints[firsts[i] * 4 + k];
					made.Weights[i * 4 + k] = weights[firsts[i] * 4 + k];
				}
			}

			return made;
		}

		/* The colors of the corners of each cell mixed, the normal and the uv of the first (shadowGeometry colored). */
		function coloredOf (geometry, made, map, counts, firsts) {
			var colors = geometry.Colors;
			var normals = geometry.Normals;
			var uvs = geometry.UVs;
			var i;

			if (colors && colors.length) {
				made.Colors = new Float32Array(counts.length * 3);

				for (i = 0; i < map.length; i++) {
					made.Colors[map[i] * 3] += colors[i * 3] / counts[map[i]];
					made.Colors[map[i] * 3 + 1] += colors[i * 3 + 1] / counts[map[i]];
					made.Colors[map[i] * 3 + 2] += colors[i * 3 + 2] / counts[map[i]];
				}
			}

			if (normals && normals.length) {
				made.Normals = new Float32Array(counts.length * 3);

				for (i = 0; i < counts.length; i++)
					made.Normals.set(normals.subarray ? normals.subarray(firsts[i] * 3, firsts[i] * 3 + 3) : normals.slice(firsts[i] * 3, firsts[i] * 3 + 3), i * 3);
			}

			if (uvs && uvs.length) {
				made.UVs = new Float32Array(counts.length * 2);

				for (i = 0; i < counts.length; i++) {
					made.UVs[i * 2] = uvs[firsts[i] * 2];
					made.UVs[i * 2 + 1] = uvs[firsts[i] * 2 + 1];
				}
			}
		}

		/*
		 * The shape a still list is laid into the voxels of the light of the probes by (scene.Voxels): of cells of half a metre,
		 * its colors kept, reading the copies of its shape. A voxel is a metre: its finest corners laid there were all lost.
		 * Regression: drawn whole, a race track laid 1.8 million triangles a frame into them as the eye went on. One made a
		 * frame, the whole till then; the whole where it gives little (less than a third fewer).
		 */
		function voxelShape (name, list) {
			var geometry = list.Geometry;
			var made = gpu.VoxelShapes[name];
			var simple;
			var scale;

			if (made !== undefined)
				return made || shape(name);

			if (!geometry || !geometry.Indices || geometry.Indices.length < 3000 || !list.Uploaded) return shape(name);

			gpu.VoxelSimpler = gpu.VoxelSimpler || new WeakMap();
			simple = gpu.VoxelSimpler.get(geometry);

			if (simple === undefined) {
				if (gpu.VoxelBudget < 1) return shape(name);

				gpu.VoxelBudget--;
				/* Half a metre in the world: of the size of its first copy. */
				scale = Math.max(1e-3, Math.hypot(list.X[0], list.X[1], list.X[2]));
				simple = shadowGeometry(geometry, 0.5 / scale, true);
				simple = simple.Indices.length < geometry.Indices.length * 0.67 ? simple : null;

				gpu.VoxelSimpler.set(geometry, simple);
			}

			made = gpu.VoxelShapes[name] = simple ? renderer.Mesh(simple).Instance(list.Uploaded, list.Count, shape(name)) : null;

			return made || shape(name);
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
		/*
		 * Points of stars on a sphere of 50 round the eye, of a seed: count of them, their colours of the temperatures of stars,
		 * their brightness a random number to power, times scale and over low: the one way of the sky of space and the night
		 * of a ground.
		 */
		function starPoints (seed, count, power, scale, low) {
			var generator = astronomy.Random(seed);
			var positions = [];
			var colors = [];
			var i;

			for (i = 0; i < count; i++) {
				var z = generator.Float(-1, 1);
				var angle = generator.Float(0, Math.PI * 2);
				var radius = Math.sqrt(1 - z * z);
				var color = paint(astronomy.Color(generator.Pick([3200, 4500, 5600, 6500, 8000, 12000])));

				positions.push(Math.cos(angle) * radius * 50, z * 50, Math.sin(angle) * radius * 50);
				colors.push(color[0], color[1], color[2], Math.pow(generator.Next(), power) * scale + low);
			}

			return renderer.Points(positions, {aColor: {Size: 4, Data: colors}});
		}

		function stars () {
			return starPoints('sky', 2600, 3, 0.9, 0.1);
		}

		/* The stars of a night sky from the ground: the sky of a planet, faint ones by the thousand and a few bright. */
		function nightStars () {
			return starPoints('night', 9000, 6, 1, 0);
		}

		/* The meshes of the orbits, rings and belts, made again with the objects; the baked surfaces kept by their look. */
		function clear () {
			Object.keys(scene.Lines).forEach(function (id) {
				scene.Lines[id].Destroy();
			});

			Object.keys(scene.Rings).forEach(function (id) {
				scene.Rings[id].Mesh.Destroy();
			});

			Object.keys(scene.Swarms || {}).forEach(function (id) {
				if (scene.Swarms[id])
					scene.Swarms[id].Destroy();
			});

			scene.Lines = {};
			scene.Rings = {};
			scene.Rocks = {};
			scene.Swarms = {};
		}

		/*
		 * The meshes of the orbits, rings and belts are laid out by spread, as real as Scale is: made again when it changed.
		 * Regression: kept as they were, the bodies went out with a larger Scale and their orbits stayed where they had been.
		 */
		function spreadKept () {
			var how = realness();
			if (scene.SpreadOf === how) return;

			clear();

			scene.SpreadOf = how;
		}

		function orbitLine (object) {
			var parent = parentOf(object);

			spreadKept();

			if (!scene.Lines[object.ID])
				scene.Lines[object.ID] = renderer.Lines(astronomy.Path(trait(object, 'Orbit'), 180).map(function (point) {
					return spread(toView(point), parent);
				}), true);

			return scene.Lines[object.ID];
		}

		/*
		 * The stars of a cluster too many to tell one by one (Cluster Count): points round its middle of the profile of
		 * Plummer, of its Seed, laid out as the orbits of its stars are (spread round it); young blue and white ones in an open
		 * cluster, old yellow and red ones in a globular and a nuclear one.
		 */
		function swarmOf (object) {
			var settings = trait(object, 'Cluster');
			var count = Math.max(0, Math.min(20000, Math.round(number(settings.Count, 0))));
			var generator;
			var scale;
			var positions = [];
			var colors = [];
			var temperatures = settings.Type === 'open' ? [4200, 5600, 6500, 8500, 12000, 20000] : [3300, 3800, 4300, 4900, 5400, 6000];
			var place;
			var color;
			var u;
			var r;
			var z;
			var angle;
			var i;

			spreadKept();

			if (!count)
				return null;

			if (scene.Swarms[object.ID])
				return scene.Swarms[object.ID];

			generator = astronomy.Random(String(settings.Seed || object.ID));
			scale = number(settings.Radius, 6) * 0.35 * astronomy.Units.ly;

			for (i = 0; i < count; i++) {
				u = generator.Float(0.02, 0.97);
				r = scale / Math.sqrt(Math.pow(u, -2 / 3) - 1);
				z = generator.Float(-1, 1);
				angle = generator.Float(0, Math.PI * 2);
				place = spread([Math.cos(angle) * Math.sqrt(1 - z * z) * r, z * r, Math.sin(angle) * Math.sqrt(1 - z * z) * r], object);
				color = paint(astronomy.Color(generator.Pick(temperatures)));

				positions.push(place[0], place[1], place[2]);
				colors.push(color[0], color[1], color[2], Math.pow(generator.Next(), 3) * 0.75 + 0.08);
			}

			scene.Swarms[object.ID] = renderer.Points(positions, {aColor: {Size: 4, Data: colors}});

			return scene.Swarms[object.ID];
		}

		function ringOf (object) {
			var settings = trait(object, 'Ring');
			var parent = parentOf(object);
			var round = parent && parent.Radius;
			var inner = number(settings.Inner, round ? 1.3 : 2.2);
			var outer = number(settings.Outer, round ? 2.3 : 3.2);

			spreadKept();

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

		/*
		 * The ring round a body for the shadow it casts on it (RingShadow of the planet graph): its axis as it is turned, its
		 * edges (in the units of the scene), its seed; none, when it has none.
		 */
		function ringOver (object) {
			var ring = object.Radius ? scene.Order.filter(function (one) {
				return one.Parent === object.ID && trait(one, 'Ring');
			})[0] : null;
			var settings = ring ? trait(ring, 'Ring') : null;
			var turn;

			if (!ring)
				return {uRingOn: 0, uRingAxis: [0, 1, 0], uRingSpan: [1, 2], uRingSeed: 0, uRingColors: new Array(12).fill(0)};

			turn = math.Rotation([1, 0, 0], (number(trait(object, 'Body').Tilt, 0) + number(settings.Inclination, 0)) * Math.PI / 180);

			return {
				uRingOn: 1,
				uRingAxis: math.Apply(turn, [0, 1, 0]),
				uRingSpan: [number(settings.Inner, 1.3) * object.Size, number(settings.Outer, 2.3) * object.Size],
				uRingSeed: ring.Seed,
				uRingColors: [].concat.apply([], ringOf(ring).Colors)
			};
		}

		/*
		 * The ring of a body for its ground (GroundRing): its axis in the frame of its ground (the inverse of its Turn), its
		 * edges in km from its middle (radius: of its ground).
		 */
		function ringUnder (object, radius) {
			var over = ringOver(object);
			var size = object.Size || 1;

			if (!over.uRingOn) return over;

			return Object.assign(over, {uRingAxis: vectors.Normalize(math.Apply(math.Invert(object.Turn || math.Identity()) || math.Identity(), over.uRingAxis)), uRingSpan: [over.uRingSpan[0] / size * radius, over.uRingSpan[1] / size * radius]});
		}

		/*
		 * The envelope of a body (Envelope Service): its Surface Envelope (a name of a preset, an envelope, or {Preset, ...}),
		 * else the one of the type of its surface; none where its air is none. Made once for what it is now.
		 */
		function envelopeOf (object) {
			var surface = trait(object, 'Surface') || {};
			var presets = self.$Service('Envelope').Presets();
			var spec = surface.Envelope || (surface.Atmosphere === 'none' ? 'none' : (presets.Types || {})[surface.Type || 'rocky'] || 'none');
			var body = {Radius: number(object.Radius, 1000), Mass: number((trait(object, 'Body') || {}).Mass, 0) || undefined, Day: number((trait(object, 'Body') || {}).Day, 0)};
			var key = JSON.stringify([spec, body]);
			if (!object.EnvelopeMade || object.EnvelopeMade.Key !== key)
				object.EnvelopeMade = {Key: key, Made: self.$Service('Envelope').Make(spec, body)};

			return object.EnvelopeMade.Made;
		}

		engine.EnvelopeOf = envelopeOf;

		/*
		 * What is at a height of the envelope of a body, of its graph (EnvelopeGraph, Graphs['planet/envelope'], else the one of the
		 * library): {Zone, Phase, Pressure, Temperature, Density, Light, Glow, Inside, Solid}. A graph that cannot be made is told
		 * once, the Kernel of the Service read instead.
		 */
		function envelopeAt (made, height) {
			var run = envelopeRun();
			var out;
			var index;
			var count = made.Names.length;

			if (!run)
				return self.$Service('Envelope').At(made, height);

			out = run.Main.apply(null, run.Order.map(function (name) {
				return name === 'Zones' ? made.Zones : height;
			}));
			out = run.Keys.length === 1 ? [out] : out;
			index = Math.round(out[run.Keys.indexOf('Zone')]);

			return {
				Zone: index < 0 ? '' : index >= count ? 'core' : made.Names[index] || '',
				Phase: index < 0 ? 'space' : index >= count ? 'solid' : made.Phases[index] || 'gas',
				Pressure: out[run.Keys.indexOf('Pressure')] || 0,
				Temperature: out[run.Keys.indexOf('Temperature')] || 0,
				Density: densityOf(made, index, out[run.Keys.indexOf('Pressure')] || 0, out[run.Keys.indexOf('Temperature')] || 0),
				Light: run.Keys.indexOf('Light') >= 0 ? out[run.Keys.indexOf('Light')] : 1,
				Glow: self.$Service('Envelope').Glow(out[run.Keys.indexOf('Temperature')] || 0),
				Inside: index >= 0,
				Solid: index >= count || made.Phases[index] === 'solid'
			};
		}

		engine.EnvelopeAt = envelopeAt;

		/*
		 * The Earth the air round an eye is measured against: its envelope, the light at its ground, how far the layer of the
		 * clouds it was drawn with (3 to 9 km over the eye) stands from its deck of water. With it the air of the Earth is the
		 * one it was: no light taken, its sky as high, its clouds where they were.
		 */
		var earthAir = null;

		function earthOf () {
			var envelope = self.$Service('Envelope');
			var made;
			var deck;

			if (earthAir)
				return earthAir;

			made = envelope.Make('earth', {Radius: self.$Service('Astronomy').EarthRadius, Mass: 1, Day: 23.93});
			deck = made.Decks[0] || {Base: 3, Top: 9};
			earthAir = {Made: made, Light: envelope.At(made, 0).Light, Base: 3 - deck.Base, Top: 9 - deck.Top};

			return earthAir;
		}

		/*
		 * The air round an eye at a height (km) over a body, of its envelope: Dim (how much of the light of its star the eye sees
		 * there against the ground of the Earth, used to the dark: a power of 0.3; 1 where it is as light), Tint (its light of
		 * the colour of its air to the power of how deep in it the light went: its blue lost first), High (how high its sky is: the height of the Earth where the air is as
		 * thin, 0 at its ground and in all thicker air, 1 out of it), Layer (km: its main deck of clouds, the one that hides most,
		 * moved as the layer of the Earth was from its deck of water; null: none), Color (of that deck), Cover (how much of the sky
		 * its decks hide: 1 - e^-their depth of light; none on the Earth, whose clouds are of its weather), Diffuse (how much of its
		 * light comes from all the sky, not from its star: the light taken against the ground of the Earth).
		 */
		function airAround (object, altitude) {
			var envelope = self.$Service('Envelope');
			var made = envelopeOf(object);
			var earth = earthOf();
			var at = made.Names.length ? envelopeAt(made, altitude) : null;
			var pressure = at && at.Inside ? at.Pressure : 0;
			var dim = at ? Math.pow(Math.max(0, Math.min(1, at.Light / earth.Light)), 0.3) : 1;
			var air = object.Look && object.Look.Atmosphere || [1, 1, 1, 0];
			var most = Math.max(air[0], air[1], air[2], 1e-3);
			/* How deep in its air the light went (e-folds of what it lost against the Earth): its colour as much filtered, its blue first. */
			var depth = at ? Math.min(3, -Math.log(Math.max(1e-6, Math.min(1, at.Light / earth.Light)))) * 0.8 : 0;
			var deck = made.Decks.reduce(function (best, one) {
				return !best || one.Opacity * (one.Top - one.Base) > best.Opacity * (best.Top - best.Base) ? one : best;
			}, null);

			return {
				Dim: dim,
				Tint: [0, 1, 2].map(function (i) {
					return air[3] ? Math.pow(Math.max(1e-3, air[i] / most), depth) : 1;
				}),
				High: pressure > 0 ? Math.min(1, Math.max(0, envelope.HeightOf(earth.Made, pressure)) / (earth.Made.Sky || 100)) : 1,
				Layer: deck ? [deck.Base + earth.Base, deck.Top + earth.Top] : null,
				Color: deck && deck.Color ? paint(deck.Color).slice(0, 3) : [1, 1, 1],
				Cover: 1 - Math.exp(-made.Decks.reduce(function (sum, one) {
					return sum + (one.Opacity || 0) * Math.max(0, one.Top - one.Base);
				}, 0)),
				Diffuse: at ? 1 - Math.max(0, Math.min(1, at.Light / earth.Light)) : 0
			};
		}

		engine.AirAround = airAround;

		/*
		 * What kind of world a body is (Envelope Habitat, of its air at its ground: living, scorched, hydrocarbon, dust, frozen,
		 * barren) and its lands (resources/terrain/habitats: names of SceneBiomes; null: those of the Earth, as they were).
		 */
		var habitats = Elemenx.Resources('Data', 'ElemenxGraphics/terrain/habitats') || {};

		function habitatOf (object) {
			var surface = trait(object, 'Surface') || {};
			var kind = self.$Service('Envelope').Habitat(envelopeOf(object), surface.Type || 'rocky');

			return {Class: kind, Biomes: habitats[kind] ? habitats[kind].slice() : null};
		}

		engine.HabitatOf = habitatOf;

		/* How bright a colour is to the eye (its luminance). */
		function brightOf (color) {
			return color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
		}

		/*
		 * The lands of a location of a body with no planet of its own (SceneLanding) and the colours of its far ground
		 * (drawHorizon): {Biomes, Colors}. Its lands those of the kind of world it is (habitatOf), of the hue of the body (its
		 * Look Colors, as it is seen from space) and as bright as they are; its far ground of those colours, as bright as its
		 * lands. A world that lives keeps its lands (null) and its colours. Regression: grey lands under a beige far ground, the
		 * far ground far brighter.
		 */
		function locationLands (object) {
			var names = habitatOf(object).Biomes;
			var biomes = self.$Service('SceneBiomes');
			var colors = object.Look.Colors;
			var lights = [];
			var lands;
			var light;
			var mean = [0, 1, 2].map(function (axis) {
				return colors.reduce(function (sum, color) {
					return sum + color[axis];
				}, 0) / colors.length;
			});
			var bright = Math.max(1e-3, brightOf(mean));

			if (!names)
				return {Biomes: null, Colors: colors};

			lands = names.map(function (name) {
				var ground = JSON.parse(JSON.stringify((biomes.Get(name) || {}).Ground || {}));

				['Low', 'High', 'Sand', 'Rock', 'Snow', 'Deep', 'Road'].forEach(function (key) {
					if (!Array.isArray(ground[key])) return;

					ground[key] = ground[key].map(function (value, axis) {
						return Math.min(1, value * mean[axis] / bright);
					});

					if (key === 'Low' || key === 'High')
						lights.push(brightOf(ground[key]));
				});

				return {Biome: name, Ground: ground};
			});
			light = lights.length ? lights.reduce(function (sum, value) {
				return sum + value;
			}, 0) / lights.length : bright;

			return {Biomes: lands, Colors: colors.map(function (color) {
				return color.map(function (value) {
					return Math.min(1, value * light / bright);
				});
			})};
		}

		engine.LandsOf = locationLands;

		/*
		 * The colour of the air of a body seen from its ground: the blue of the sky of the Earth ([0.55, 0.72, 1]) as much
		 * changed as its air (Look Atmosphere) is from the one of the Earth (#7fb2ff); none: no air, the black of space.
		 */
		function airColorOf (object) {
			var air = object.Look.Atmosphere;
			var earth = [127 / 255, 178 / 255, 1];
			var most = Math.max(air[0], air[1], air[2], 1e-3);

			if (!air[3])
				return [0, 0, 0, 0];

			return [0.55, 0.72, 1].map(function (value, index) {
				return Math.min(1, value * air[index] / most / earth[index]);
			}).concat([0.95]);
		}

		/* The colour of the air over a ground (AirColor, of the body it lies on), else the one of the Earth: no body under it. */
		function groundAir (ground) {
			return ground.AirColor || [0.55, 0.72, 1, 0.95];
		}

		/* The density of a zone (kg/m3): a gas of its pressure and temperature (its molar mass), a liquid, a fluid or a solid its own. */
		function densityOf (made, index, pressure, temperature) {
			var at = 2 + index * made.Stride;

			if (index < 0 || index >= made.Names.length) return 0;
			if (made.Zones[at + 6] >= 2.5) return made.Zones[at + 7];

			return pressure * 100000 * made.Zones[at + 4] / (8.314462 * Math.max(1, temperature));
		}

		function envelopeRun () {
			var code;

			if (scene.EnvelopeRun !== undefined) return scene.EnvelopeRun;

			try {
				code = self.$Service('Blueprints').NumericCode(self.$Service('Blueprints').Read(self.GraphOf('EnvelopeGraph', 'planet/envelope') || self.LibraryEnvelope()), {}, {Zones: 'floats'});

				if (!code || ['Pressure', 'Temperature', 'Zone'].some(function (key) {
					return code.Keys.indexOf(key) === -1;
				}))
					throw new Error('an envelope graph is a generator of numbers of its results Pressure, Temperature, Zone and Light (its inputs Zones, a list of numbers, and Height)');

				scene.EnvelopeRun = {Main: new Function('B', 'M', 'N', code.Source)().Main, Order: code.Numeric.Inputs.map(function (one) {
					return one.Name;
				}), Keys: code.Keys};
			}
			catch (error) {
				scene.EnvelopeRun = null;

				if (window.console && window.console.warn)
					window.console.warn('Elemenx Scene: the EnvelopeGraph cannot be made, the envelope of the library is read: ' + error.message);
			}

			return scene.EnvelopeRun;
		}

		/*
		 * Where an object is over the body it is by (km over its Radius): on the ground of a location (its metres over the sea),
		 * flown over a surface (its altitude over the ground there), in space (the body it is nearest, for its size); the
		 * height of the ground there too (km, null where it is not known).
		 */
		function heightOf (object) {
			var located = scene.Location && scene.Ground ? scene.Objects[scene.Location.Body] : null;
			var surface = scene.Surface;
			var field;
			var best = null;
			var ground;

			if (located && object.World) {
				ground = scene.Ground.Field && scene.Ground.Field.Height ? scene.Ground.Field.Height(object.World[0], object.World[2]) / 1000 : null;

				return {Body: located, Height: object.World[1] / 1000, Ground: ground};
			}

			if (surface && scene.Objects[surface.ID]) {
				field = surface.Field;
				ground = field && field.Elevation ? Math.max(0, field.Elevation(surface.Up)) : 0;

				return {Body: scene.Objects[surface.ID], Height: surface.Altitude + ground, Ground: ground};
			}

			if (!object.World) return null;

			scene.Order.forEach(function (one) {
				var far;

				if (one === object || !one.World || !one.Size || !trait(one, 'Body')) return;

				far = vectors.Distance(one.World, object.World) / one.Size;

				if (!best || far < best.Far)
					best = {Body: one, Far: far};
			});

			return best ? {Body: best.Body, Height: (best.Far - 1) * radiusOf(best.Body), Ground: null} : null;
		}

		/* What is round each object asked for (Probe), in its slice of the Ether: once a frame, the same object of each. */
		function probeStep () {
			Object.keys(scene.Probed || {}).forEach(function (id) {
				var name = scene.Probed[id];
				var object = scene.Objects[id];
				var slice = self.$Ether(name);
				var where = object ? heightOf(object) : null;
				var made = where ? envelopeAt(envelopeOf(where.Body), where.Height) : null;
				var record = slice[id] = slice[id] || {};

				/* In a tunnel of warp: out of normal space, of no body (it goes through them), its tunnel. */
				if (object && object.Travel && object.Travel.Kind === 'warp' && object.Travel.Phase === 'inside') {
					Object.assign(record, {Body: '', Altitude: null, Ground: null, Zone: object.Travel.Tunnel || '', Phase: 'tunnel', Pressure: 0, Temperature: 0, Density: 0, Light: 0, Glow: [0, 0, 0], Inside: false, Solid: false});
				}
				else if (!made) {
					Object.assign(record, {Body: '', Altitude: null, Ground: null, Zone: '', Phase: 'space', Pressure: 0, Temperature: 0, Density: 0, Light: 1, Glow: [0, 0, 0], Inside: false, Solid: false});
				}
				else {
					/* Under the ground of a body of rock: in its ground, whatever its envelope tells there. */
					if (where.Ground !== null && where.Height < where.Ground)
						Object.assign(made, {Zone: 'ground', Phase: 'solid', Solid: true, Light: 0});

					Object.assign(record, made, {Body: where.Body.ID, Altitude: where.Height, Ground: where.Ground});
				}

				record.Radiation = object ? radiationAt(object) : {EM: 0, Ionizing: 0, Sources: []};

				self.$Ether.Touch(name, id);
			});
		}

		engine.ProbeStep = probeStep;

		/*
		 * The radiation round an object (what a game makes of it, its electronics and engines failing, is its own): of each
		 * source (the trait Radiation of any object: EM and Ionizing, how strong at its middle; Reach, km where it is half
		 * of that), as it falls with the square of the way past its reach. In a tunnel of warp only a source in the same tunnel
		 * reaches it. {EM, Ionizing, Sources: [IDs]}.
		 */
		function radiationAt (object) {
			var km = (engine.Metre ? engine.Metre() : 0) * 1000 || 1;
			var tunnel = object.Travel && object.Travel.Phase === 'inside' ? object.Travel.Tunnel || '' : '';
			var out = {EM: 0, Ionizing: 0, Sources: []};

			if (!object.World) return out;

			scene.Order.forEach(function (one) {
				var source = (one.Traits || {}).Radiation;
				var reach;
				var part;

				if (!source || !one.World || one === object) return;
				if ((one.Travel && one.Travel.Phase === 'inside' ? one.Travel.Tunnel || '' : '') !== tunnel) return;

				reach = number(source.Reach, 1000) * km;
				part = 1 / (1 + Math.pow(vectors.Distance(one.World, object.World) / reach, 2));
				out.EM += number(source.EM, 0) * part;
				out.Ionizing += number(source.Ionizing, 0) * part;

				if (part > 0.01)
					out.Sources.push(one.ID);
			});

			return out;
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

			spreadKept();

			if (scene.Rocks[object.ID])
				return scene.Rocks[object.ID];

			for (i = 0; i < count; i++) {
				rocks.push({
					Orbit: {Distance: round ? generator.Float(inner, outer) * parent.Radius * KM : generator.Float(inner, outer), Eccentricity: generator.Float(0, 0.12), Inclination: tilt + generator.Float(-6, 6), Node: generator.Float(0, 360), Periapsis: generator.Float(0, 360), Anomaly: generator.Float(0, 360)},
					Size: generator.Float(0.03, 0.11) * between(1, 0.02, realness()) * (round ? parent.Size : 1) * number(settings.Rocks, 1),
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
			var base = planetBase(object);
			/* A planet of data is not drawn as another till its data comes. */
			if (base && !planetData(object, base)) return null;

			var planet = planetOf(object);
			/* A planet is painted with its rivers: none before they are made. */
			var flowing = planet ? scene.Rivers[object.ID] : null;
			if (flowing && !flowing.Ready || planet && (scene.Towns[object.ID] && !scene.Towns[object.ID].Ready || scene.Highways[object.ID] && !scene.Highways[object.ID].Ready)) return null;

			var key = JSON.stringify([object.Look, object.Seed, planet]);
			var made = scene.Baked[object.ID];
			var size = object.Radius > 3000 ? 512 : object.Radius > 500 ? 256 : 128;
			var uniforms;

			if (made && made.Key === key) return made;

			/* Its program not made by the card yet: baked a frame after it is (a bake waits for it: the page would stand). */
			if (scene.BakedThisFrame >= 2 || scene.Looping && !programReady(gpu.Bake)) return made || null;

			scene.BakedThisFrame++;

			if (made) {
				made.Ground.Destroy();
				made.Sky.Destroy();

				if (made.Relief)
					made.Relief.Destroy();
			}

			uniforms = Object.assign(self.BakeValues() || {}, {uKind: object.Look.Kind, uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]), uWater: object.Look.Water, uOcean: object.Look.Ocean, uIce: object.Look.Ice, uClouds: object.Look.Clouds, uSeed: object.Seed});
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
		/*
		 * The options of the planet of an object, with what is laid on it once its land is made: its rivers, its settlements
		 * by them and its highways between those, each made in a worker, or those of its data (its vectors) when it has them.
		 */
		function planetOf (object) {
			var base = planetBase(object);
			var made;
			var towns;
			var roads;

			if (!base || !planetData(object, base)) return null;

			base = planets.Vectored(base);
			made = riversOf(object, base);

			if (made && !made.Ready) return base;

			if (made) base.Rivers = made.Key;
			else if (typeof base.Rivers !== 'string') return base;

			towns = laid(object, 'Towns', base, 'Settlements');

			if (towns && !towns.Ready) return base;

			if (towns) base.Settlements = towns.Key;
			else if (typeof base.Settlements !== 'string') return base;

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

				function made (failed, result) {
					var list = failed || !result ? [] : result[kind];

					if (scene.Gone) return;

					planets[use](key, list);

					if (!failed)
						keepGlobe(key, list);

					done();
				}

				if (kind === 'Settlements') {
					planets.Work().Run('ScenePlanet', kind, [base, 20000], made);

					return;
				}

				/*
				 * Its highways by parts, in the workers, put together in their order: the same as of one run. Regression: one
				 * worker laid them all (3 s alone), and the globe waited for them: under the load of the tests it took minutes.
				 */
				var parts = [];
				var left = 8;
				var wrong = null;

				/* Eight parts: the ways are not as long, two parts a worker even them out. */
				[0, 1, 2, 3, 4, 5, 6, 7].forEach(function (part) {
					planets.Work().Run('ScenePlanet', kind, [base, 20, part, 8], function (failed, piece) {
						parts[part] = piece;
						wrong = wrong || failed;

						if (--left) return;

						made(wrong, wrong ? null : planets.MergeHighways(parts));
					});
				});
			});
		}

		/*
		 * The data of a planet (Planet: {Data: the URL of its file or of its folder, or a key given to ScenePlanet.UseData;
		 * Levels: its tiles to that level read at once, the finer ones round the eye as it comes near, needData}): opened
		 * once (PlanetData.Open) and given to ScenePlanet under that key. False while it comes (the planet is not drawn till
		 * then: no other planet in its place), true once it is there or for a planet of options alone.
		 */
		function planetData (object, base) {
			var key = base.Data;
			var held = scene.PlanetData[object.ID];

			if (typeof key !== 'string' || !key || planets.DataSets[key]) return true;

			if (held && held.Key === key) return false;

			held = scene.PlanetData[object.ID] = {Key: key};

			self.$Service('PlanetData').Open(key, function (error, data) {
				if (scene.Gone || scene.PlanetData[object.ID] !== held) return;

				if (error) {
					self.$Emit('error', error);

					return;
				}

				planets.UseData(key, data);

				scene.Version++;
			}, {Levels: base.Levels});

			return false;
		}

		/*
		 * The tiles of the data of a planet read in part (Levels) round the eye as it comes near: those over three times its
		 * height round it, as fine as a twentieth of it, asked for once a second at most; given to the workers as they come.
		 */
		function needData (object, globe) {
			var base = planetBase(object);
			var data = base && typeof base.Data === 'string' ? planets.DataSets[base.Data] : null;
			var now = performance.now();
			if (!data || !data.Source || !globe.Eye || now - (globe.Needed || 0) < 1000) return;

			globe.Needed = now;

			self.$Service('PlanetData').Need(data, vectors.Normalize(globe.Eye), Math.max(200, globe.Altitude * 3), Math.max(1, globe.Altitude / 20), function (error, names) {
				if (!error && names.length && !scene.Gone)
					planets.AddTiles(base.Data, names);
			});
		}

		function planetBase (object) {
			var surface = trait(object, 'Surface');
			var planet = surface && surface.Planet;
			if (!planet)
				return null;

			/* Its rules of detail made code here, for the workers that make its ground (ScenePlanet.Ruled); its climate and winds of its air. */
			var own = typeof planet === 'string' ? JSON.parse(planet) : planet;
			/* Its far ground of the graph of the scene (GroundFarGraph, Graphs['shader/ground-far']), its own before it. */
			var far = own.GroundFarGraph || self.GraphOf('GroundFarGraph', 'shader/ground-far');

			return planets.Ruled(Object.assign({}, own, {Radius: object.Radius}, airOf(object), own.Biomes ? {Biomes: own.Biomes} : {}, far ? {GroundFarGraph: far} : {}));
		}

		engine.PlanetOptions = planetOf;

		/*
		 * The numbers of the climate and the winds of a planet of its envelope (Cells, Warm, Contrast, Lapse), only those not as
		 * the Earth's: the options of a planet like the Earth (its key, the ground made of it) stay as they were.
		 */
		function airOf (object) {
			var made = envelopeOf(object);
			var out = {};
			/* Its lands of the kind of world it is (habitatOf): none of the Earth where nothing lives. */
			var lands = habitatOf(object).Biomes;
			if (lands)
				out.Biomes = lands;

			/* A body of no air: its ground as it was (a climate of none is not one). */
			if (!(made.Pressure > 0)) return out;

			if (made.Cells !== 3)
				out.Cells = made.Cells;

			if (made.Warm)
				out.Warm = made.Warm;

			if (made.Contrast !== 1)
				out.Contrast = made.Contrast;

			if (made.Lapse && made.Lapse !== 6.5)
				out.Lapse = made.Lapse;

			return out;
		}

		/*
		 * The rivers of a planet (ScenePlanet: Heights, then Drainage, in the workers), made once for its options and kept in
		 * the browser: {Key, Ready, Done (of 25 steps)}; none for a planet that says Rivers: false, or brings its own.
		 */
		function riversOf (object, base) {
			var held = scene.Rivers[object.ID];
			var key;

			if (base.Rivers === false || Array.isArray(base.Rivers) || typeof base.Rivers === 'string' || !renderer) return null;

			/* Of its ground as it was made: what a developer changed of its rivers (Places) is laid over them when it is made (ScenePlanet). */
			base = Object.assign({}, base);
			delete base.Places;
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

						planets.Work().Run('ScenePlanet', 'Drainage', [heights, size], function (wrong, made) {
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

				/* Its colors and how its ground leans (Relief), six faces each; a globe kept without the second is painted again. */
				if (!faces || faces.length !== 12) {
					paintStrips(object, made, planet, size, strip, key);

					return;
				}

				cube = renderer.Cube(size);

				for (face = 0; face < 6; face++)
					cube.Write(face, faces[face], 0, face === 5);

				made.Ground.Destroy();

				made.Ground = cube;
				made.Relief = renderer.Cube(size);

				for (face = 0; face < 6; face++)
					made.Relief.Write(face, faces[6 + face], 0, face === 5);

				made.Painted = size;
				made.Strips = 24;

				paintLights(object, made, planet);

				paintClimate(object, made, planet);
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

		/*
		 * The climate of a planet, what its weather is made of (ScenePlanet.ClimateFace): a cube of 128 a face, in strips by
		 * its workers; then its weather, a cube of 256 a face baked of it on the card a face a frame (weatherStep).
		 */
		function paintClimate (object, made, planet) {
			var size = 128;
			var strip = size / 4;
			var left = 24;
			var cube = renderer.Cube(size);
			var bytes = [0, 1, 2, 3, 4, 5].map(function () {
				return new Uint8Array(size * size * 4);
			});
			var face;
			var row;

			function done (face, row) {
				return function (error, piece) {
					if (scene.Gone || scene.Baked[object.ID] !== made || renderer.Lost) {
						if (!--left)
							cube.Destroy();

						return;
					}

					left--;

					if (!error && piece && piece.Data) {
						cube.Write(face, piece.Data, row, !left);

						bytes[face].set(piece.Data, row * size * 4);
					}

					if (left) return;

					if (made.Climate)
						made.Climate.Destroy();

					made.Climate = cube;
					made.ClimateBytes = {Faces: bytes, Size: size};
					made.Weather = made.Weather || renderer.Cube(256);
					made.WeatherFaces = 0;
				};
			}

			for (face = 0; face < 6; face++) {
				for (row = 0; row < size; row += strip)
					planets.Work().Run('ScenePlanet', 'ClimateFace', [planet, face, size, row, strip], done(face, row));
			}
		}

		/*
		 * The weather of a planet as its time goes (WEATHER of the shaders): all six faces of its cube at once, of its climate,
		 * its days and its sun, when its time went on since. Regression: a face a frame, each of another time: where the time
		 * runs fast (from orbit) the faces did not meet, straight seams along the edges of the cube, and a face jumped each
		 * frame (the clouds flickered).
		 */
		/* The way to the star of a body in the frame of the body (its weather turns with it). */
		function sunOfBody (object) {
			var star = scene.Order.filter(function (each) {
				return trait(each, 'Star') && each.World;
			})[0];

			return star && object.World ? vectors.Normalize(math.Apply(math.Invert(object.Turn) || math.Identity(), vectors.Normalize(vectors.Subtract(star.World, object.World)))) : [0, 1, 0];
		}

		/*
		 * The weather of a planet over a direction of its body, in the page, of the very graph its shader bakes it of
		 * (ForecastGraph, its js): of its climate there (as it came to the page), its days, its sun and its seed. {Cover, Kind,
		 * Cirrus, Rain, Warm}; null before its climate is made.
		 */
		/* days: the moment of its forecast (days of the scene; none: now). */
		function weatherOver (object, direction, days) {
			var made = object ? scene.Baked[object.ID] : null;
			var kept = made && made.ClimateBytes;
			var p = vectors.Normalize(direction);
			var ax = Math.abs(p[0]);
			var ay = Math.abs(p[1]);
			var az = Math.abs(p[2]);
			var face;
			var a;
			var b;
			var at;
			var cl;
			var sun;
			var run;

			if (!kept)
				return null;

			/* Its face of the cube and the texel there, as ClimateFace lays them (cubeDirection of the shaders). */
			if (ax >= ay && ax >= az) {
				face = p[0] > 0 ? 0 : 1;
				a = (p[0] > 0 ? -p[2] : p[2]) / ax;
				b = -p[1] / ax;
			}
			else if (ay >= az) {
				face = p[1] > 0 ? 2 : 3;
				a = p[0] / ay;
				b = (p[1] > 0 ? p[2] : -p[2]) / ay;
			}
			else {
				face = p[2] > 0 ? 4 : 5;
				a = (p[2] > 0 ? p[0] : -p[0]) / az;
				b = -p[1] / az;
			}

			at = (Math.min(kept.Size - 1, Math.floor((b + 1) / 2 * kept.Size)) * kept.Size + Math.min(kept.Size - 1, Math.floor((a + 1) / 2 * kept.Size))) * 4;
			cl = [kept.Faces[face][at] / 255, kept.Faces[face][at + 1] / 255, kept.Faces[face][at + 2] / 255, kept.Faces[face][at + 3] / 255];
			sun = sunOfBody(object);
			run = self.ForecastCode();
			made = run({}, {PX: p[0], PY: p[1], PZ: p[2], Days: days === undefined ? scene.Time : days, Seed: Math.abs(Math.round(Number(object.Seed) || 0)) % 997, RadiusKm: radiusOf(object), Cells: envelopeOf(object).Cells, SunX: sun[0], SunY: sun[1], SunZ: sun[2], Cloudiness: Math.max(0, Math.min(1, Number(object.Look.Clouds) || 0)), Moist: cl[0], Warm: cl[1], Ground: cl[2], Climb: cl[3]});

			return influenced(object, p, days === undefined ? scene.Time : days, {Cover: made.Cover, Kind: made.Kind, Cirrus: made.Cirrus, Rain: made.Rain, Warm: cl[1], Fog: 0});
		}

		/*
		 * A forecast of a place of a body with what the influences on its weather do there (Influence: WeatherInfluences, their
		 * middles drifting with the wind of its forecast).
		 */
		function influenced (object, way, days, over) {
			var list = (scene.Influences || []).filter(function (one) {
				return one.Body === object.ID;
			});
			var forecast = self.$Service('SceneForecast');
			var seed = Math.abs(Math.round(Number(object.Seed) || 0)) % 997;
			var radius = radiusOf(object);
			var cells = envelopeOf(object).Cells;

			if (!list.length) return over;

			return self.$Service('WeatherInfluences').Apply(over, way, days, list, function (at, when) {
				return forecast.Wind(at, when, seed, radius, 1, cells).slice(0, 3);
			}, radius);
		}

		engine.WeatherOver = weatherOver;

		/*
		 * The weather of the place of the eye of a planet, of its forecast there (weatherOver: over its surface, or the middle of
		 * the location it stands in), as the numbers of the weather of a scene (LocalWeatherGraph, blueprints/weather/local),
		 * looked at twice a second; null where there is none (no planet, no map of its weather yet; a body of no air or of decks
		 * that hide its sky: their weather is a name, none or overcast). Regression: it was told by one of 8 names (the
		 * rain, the clouds), and the weather of a location was the one it was given as the ship came down, for ever.
		 */
		engine.WeatherWanted = function () {
			var kept = scene.WeatherWanted;
			if (kept && Math.abs(scene.Seconds - kept.At) <= 0.5 && kept.Surface === scene.Surface && kept.Location === scene.Location) return kept.Value;

			scene.WeatherWanted = {At: scene.Seconds, Surface: scene.Surface, Location: scene.Location, Value: weatherWanted()};

			return scene.WeatherWanted.Value;
		};

		function weatherWanted () {
			var surface = scene.Surface;
			var site = scene.Location && scene.Location.Planet && scene.Location.Frame ? scene.Location : null;
			var body = surface ? scene.Objects[surface.ID] : site ? scene.Objects[site.Body] : null;
			var aired;
			var over;
			var code;
			var made;

			if (!body || !body.Look) return null;

			aired = airAround(body, surface ? surface.Altitude : 0);

			if (!aired || aired.Cover > 0.85 || !(body.Look.Atmosphere && body.Look.Atmosphere[3])) return null;

			var way = surface ? surface.Up : site.Frame.Middle;
			var back;
			var wet = 0;
			var cover = 0;
			var k;

			over = surface ? surface.WeatherOver : weatherOver(body, way);

			code = over ? engine.GraphCode('LocalWeatherGraph', 'weather/local') : null;

			if (!code)
				return null;

			made = code.Run({}, {Cover: over.Cover, Kind: over.Kind, Cirrus: over.Cirrus, Rain: over.Rain, Warm: over.Warm, Fog: over.Fog || 0});

			/*
			 * What the weather of hours ago left on the ground, of the forecast of those hours (LookbackGraph,
			 * blueprints/weather/lookback): wet of the rain of the last 12 hours (every 2), drying; the snow of the last 3 days
			 * (every 6 hours, the oldest first), fallen and melted. Of the time alone: the same however the time came there.
			 * Regression: it was wet half a minute after a rain began and dry minutes after, however long it rained, and a day
			 * passed in a moment left the ground as it was.
			 */
			back = engine.GraphCode('LookbackGraph', 'weather/lookback');

			if (back) {
				for (k = 0; k <= 6; k++)
					wet = Math.max(wet, back.Run({}, lookOf(k === 0 ? over : weatherOver(body, way, scene.Time - k * 2 / 24), k * 2, 0)).Wetness);

				for (k = 12; k >= 0; k--)
					cover = back.Run({}, lookOf(k === 0 ? over : weatherOver(body, way, scene.Time - k * 6 / 24), k * 6, cover)).Cover;
			}

			/* What the weather of a moment Hours ago was, for a step of it. */
			function lookOf (then, hours, was) {
				var local = then ? code.Run({}, {Cover: then.Cover, Kind: then.Kind, Cirrus: then.Cirrus, Rain: then.Rain, Warm: then.Warm, Fog: then.Fog || 0}) : {Wet: 0, Snow: 0};

				return {Wet: local.Wet, Snow: local.Snow, Warm: then ? then.Warm : 1, Hours: hours, Was: was};
			}

			return {Clouds: made.Clouds, Kind: made.Kind, High: made.High, Wind: made.Wind, Fog: made.Fog, Rain: made.Rain, Snow: made.Snow, Wet: back ? wet : made.Wet, Cover: back ? cover : undefined, Storm: made.Storm, Flash: 0, Looked: !!back};
		}

		/* The influences going over a body at a time, for the shader of its weather (InfluencesGLSL): 16 at most. */
		function influencesOf (object, days) {
			var made = self.$Service('WeatherInfluences');
			var kinds = Object.keys(made.Kinds()).sort();
			var forecast = self.$Service('SceneForecast');
			var seed = Math.abs(Math.round(Number(object.Seed) || 0)) % 997;
			var radius = radiusOf(object);
			var cells = envelopeOf(object).Cells;
			var at = new Array(64).fill(0);
			var is = new Array(64).fill(0);
			var wind = function (way, when) {
				return forecast.Wind(way, when, seed, radius, 1, cells).slice(0, 3);
			};
			var going = made.Expand((scene.Influences || []).filter(function (one) {
				return one.Body === object.ID;
			}), days, wind).slice(0, 16);

			going.forEach(function (one, index) {
				var middle = made.Center(one, days, wind);

				at.splice(index * 4, 4, middle[0], middle[1], middle[2], one.Radius / radius);
				is.splice(index * 4, 4, (days - one.Start) / Math.max(1e-9, one.Length), one.Strength, kinds.indexOf(one.Kind), 0);
			});

			return {uInfluenceAt: at, uInfluenceIs: is, uInfluenceCount: going.length};
		}

		function weatherStep (object, made) {
			var sun;

			if (!made || !made.Climate || !made.Weather || made.WeatherFrame === (scene.DrawnCount || {}).Frames || made.WeatherFaces >= 6 && made.WeatherDays === scene.Time && made.WeatherNext === undefined) return;

			sun = sunOfBody(object);
			made.WeatherFrame = (scene.DrawnCount || {}).Frames;

			/* Its program made the first time a planet has a weather (a scene with none never compiles it). */
			gpu.Weather = gpu.Weather || renderer.Program(graphics.Shaders.Quad, shaders.Weather);

			/*
			 * Baked once the card made it, not before: a bake waits for its program, and the page stood 7 s in it (under load).
			 * Asked again the next frame.
			 */
			if (scene.Looping && !programReady(gpu.Weather)) {
				made.WeatherFrame = undefined;

				return;
			}

			var values = {uClimate: made.Climate, uDays: scene.Time, uSunAt: sun, uRadiusKm: radiusOf(object), uCells: envelopeOf(object).Cells, uWeatherSeed: Math.abs(Math.round(Number(object.Seed) || 0)) % 997, uCloudiness: Math.max(0, Math.min(1, Number(object.Look.Clouds) || 0))};

			Object.assign(values, influencesOf(object, scene.Time));

			var swap;

			/* The first: all at once. */
			if (!made.WeatherFaces) {
				renderer.Bake(made.Weather, gpu.Weather, values);

				made.WeatherDays = scene.Time;
				made.WeatherFaces = 6;

				return;
			}

			/*
			 * Then a face a frame into the other cube, all six of one time (no seams), shown when all are made; a new round only
			 * when the time of the body went on a minute and half a second went by. Regression: a face of 256 baked in every frame
			 * while the time ran, the card busy for nothing (the pages of other tests ran late).
			 */
			if (made.WeatherNext === undefined && (Math.abs(scene.Time - made.WeatherDays) < 1 / 1440 || performance.now() - (made.WeatherAt || 0) < 500)) return;

			if (made.WeatherNext === undefined) {
				made.WeatherAt = performance.now();
				made.WeatherBack = made.WeatherBack || renderer.Cube(256);
				made.WeatherNext = 0;
				made.WeatherNextDays = scene.Time;
			}

			values.uDays = made.WeatherNextDays;

			Object.assign(values, influencesOf(object, made.WeatherNextDays));

			renderer.Bake(made.WeatherBack, gpu.Weather, values, made.WeatherNext);

			made.WeatherNext++;

			if (made.WeatherNext < 6) return;

			swap = made.Weather;
			made.Weather = made.WeatherBack;
			made.WeatherBack = swap;
			made.WeatherDays = made.WeatherNextDays;
			made.WeatherNext = undefined;
			made.WeatherFaces += 6;
		}

		/* The weather of each body with one, a face of it, before what a frame draws (a bake draws to a cube, not to the frame). */
		function weathers () {
			Object.keys(scene.Baked || {}).forEach(function (id) {
				if (scene.Objects[id])
					weatherStep(scene.Objects[id], scene.Baked[id]);
			});
		}

		/* 0 under a, 1 over b, smooth between (as smoothstep of a shader). */
		function fadeBetween (a, b, x) {
			var t = Math.max(0, Math.min(1, (x - a) / (b - a)));

			return t * t * (3 - 2 * t);
		}

		/* The radius of a body, km. */
		function radiusOf (object) {
			var planet = planetOf(object);

			return planet && planet.Radius ? Number(planet.Radius) : number(object.Radius, 1000);
		}

		/* The values of the weather of a body for the Planet shader (CLOUDS SEEN): none until it is all made. */
		function weatherValues (object, made) {
			var ready = !!made && !!made.Weather && made.WeatherFaces >= 6;

			return {uWeather: ready ? made.Weather : noLights(), uWeatherOn: ready ? 1 : 0, uRadiusKm: radiusOf(object)};
		}

		function paintStrips (object, made, planet, size, strip, key) {
			var cube = renderer.Cube(size);
			var relief = renderer.Cube(size);
			var left = 24;
			var faces = [0, 1, 2, 3, 4, 5].map(function () {
				return new Uint8Array(size * size * 4);
			});
			var leans = [0, 1, 2, 3, 4, 5].map(function () {
				return new Uint8Array(size * size * 4);
			});
			var face;
			var row;

			function done (face, row) {
				return function (error, piece) {
					if (scene.Baked[object.ID] !== made || renderer.Lost) {
						if (!--left) {
							cube.Destroy();
							relief.Destroy();
						}

						return;
					}

					left--;
					made.Strips = 24 - left;

					/* The last strip makes the smaller levels of all of it. */
					if (!error && piece && piece.Data) {
						cube.Write(face, piece.Data, row, !left);

						faces[face].set(piece.Data, row * size * 4);
					}

					if (!error && piece && piece.Relief) {
						relief.Write(face, piece.Relief, row, !left);

						leans[face].set(piece.Relief, row * size * 4);
					}

					if (left) return;

					made.Ground.Destroy();

					made.Ground = cube;
					made.Relief = relief;
					made.Painted = size;

					paintLights(object, made, planet);

					paintClimate(object, made, planet);

					keepGlobe(key, faces.concat(leans));
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
			/* Arid and Desert: what Color paints deserts and basins by. */
			var source = String(planets.Make) + String(planets.Face) + String(planets.Color) + String(planets.Arid) + String(planets.Desert);
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

				/* Its colors and how its ground leans, six faces each, as a scene keeps them (paintStrips). */
				faces = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function () {
					return new Uint8Array(size * size * 4);
				});

				function done (face, row) {
					return function (error, piece) {
						if (!error && piece && piece.Data)
							faces[face].set(piece.Data, row * size * 4);

						if (!error && piece && piece.Relief)
							faces[6 + face].set(piece.Relief, row * size * 4);

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
			var all = scene.Order.filter(function (object) {
				return trait(object, 'Star') && object.World && !object.Hidden;
			});
			/*
			 * Among the many stars of a cluster: the four nearest the eye, each as much fainter than the nearest as it is farther
			 * (its light falls as the square of the way). Regression: the first four lit every planet as its own star did.
			 */
			var crowd = all.length > 4;
			var list = crowd ? all.sort(function (a, b) {
				return vectors.Distance(a.World, scene.Eye) - vectors.Distance(b.World, scene.Eye);
			}).slice(0, 4) : all.slice(0, 4);
			var nearest = list.length ? Math.max(1e-9, vectors.Distance(list[0].World, scene.Eye)) : 1;

			list.forEach(function (star) {
				var color = paint(star.Color);
				var falls = crowd ? Math.pow(nearest / Math.max(nearest, vectors.Distance(star.World, scene.Eye)), 2) : 1;
				/*
				 * In real sizes as much as it lights things so far from it (starShine: its luminosity over the square of the way),
				 * as it lights the ground of a body there. Regression: the light did not fall with the distance, a ship at Neptune
				 * as lit as one at the Earth.
				 */
				var strength = realness() >= 0.999 ? Math.min(1.6, 1.07 * starShine(star, vectors.Distance(star.World, scene.Eye))) : Math.min(1.6, 0.9 + 0.25 * Math.log(1 + star.Star.Luminosity)) * falls;
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

			/* In a giant (SceneGiants): its stars as much as their light gets there, the glow of its depth from below. */
			return {Positions: positions, Colors: colors, Count: engine.GiantLight ? engine.GiantLight(positions, colors, list.length) : list.length};
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
			scene.FrameTime = scene.FrameTime ? scene.FrameTime * 0.95 + elapsed * 0.05 : elapsed;

			if (elapsed > 0.026) {
				scene.Slow++;
				scene.Fast = 0;
			}
			else if (elapsed < 0.02) {
				scene.Fast++;
				scene.Slow = 0;
			}

			if (scene.Unshrunk > 0)
				scene.Unshrunk--;

			/*
			 * A step down tried: a second later, the frames not a tenth faster, the pixels were not what held it up (all that is
			 * drawn, the shadows, the work of the page): the resolution back, and not stepped down for half a minute, the quality
			 * of the light lowered instead (SceneLighting, PostTime: late frames). Regression: a race track, held up by what it
			 * draws, went down to the least resolution, as slow as before and blurred.
			 */
			if (scene.Trial && ++scene.Trial.Frames >= 60) {
				if (scene.FrameTime > scene.Trial.Before * 0.9) {
					scene.Ratio = scene.Trial.Ratio;
					scene.Unshrunk = 1800;

					renderer.Resize(scene.Width, scene.Height, scene.Ratio);
				}

				scene.Trial = null;
			}

			/* In steps of 0.85 of the screen: each step makes the targets of the picture again, not some each second. */
			if (scene.Slow > 20 && !scene.Trial && !(scene.Unshrunk > 0) && scene.Ratio > Math.max(0.7, scene.Most * 0.5)) {
				scene.Trial = {Ratio: scene.Ratio, Before: scene.FrameTime, Frames: 0};
				scene.Ratio = Math.max(0.7, scene.Most * 0.5, scene.Ratio * 0.85);
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
			var padded = flown2 && flown2.Values.Vehicle ? engine.PadKeys(scene.Keys) : null;
			/* A ship flown: the right stick turns the view round it (the left one flies it). */
			var stepped = !!padded && engine.VehicleStep(flown2, padded, elapsed);
			if (stepped && flown2.Seen)
				engine.PadLook(padded.Pad, elapsed);

			if (stepped && engine.ShipView(flown2, elapsed)) {
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
		 * B KeyC, RB or the press of the left stick Shift (run, drift, boost), LB Alt, X KeyH (a ship warps), Y KeyJ (a ship
		 * jumps while it is held); the sticks and the triggers as they
		 * lean, in Pad: {X (right), Y (ahead), LookX, LookY (up), Gas, Brake, DX, DY (the cross: right, up)}, for what moves
		 * by how far (a walk, a wheel).
		 */
		engine.PadKeys = function (keys) {
			var input = self.$Service('InputDevices');
			var axes = input.Axes();
			var made = Object.assign({}, keys);
			var buttons = {a: 'Space', b: 'KeyC', rb: 'ShiftLeft', ls: 'ShiftLeft', lb: 'AltLeft', x: 'KeyH', y: 'KeyJ'};

			Object.keys(buttons).forEach(function (button) {
				if (input.Held(button))
					made[buttons[button]] = true;
			});

			made.Pad = {X: axes.LeftX, Y: -axes.LeftY, LookX: axes.RightX, LookY: -axes.RightY, Gas: axes.RightTrigger, Brake: axes.LeftTrigger, DX: (input.Held('right') ? 1 : 0) - (input.Held('left') ? 1 : 0), DY: (input.Held('up') ? 1 : 0) - (input.Held('down') ? 1 : 0)};

			return made;
		};

		/*
		 * The right stick of a pad turns the view round what it follows as the mouse does: up looks up (the eye goes down), right
		 * looks right. Regression: up raised the eye, and the view looked down.
		 */
		engine.PadLook = function (pad, elapsed, least) {
			if (!pad || !pad.LookX && !pad.LookY) return;

			scene.Yaw -= pad.LookX * elapsed * 2;
			scene.Pitch = Math.max(least === undefined ? -1.5 : least, Math.min(1.5, scene.Pitch - pad.LookY * elapsed * 1.5));
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

			engine.PadLook(keys.Pad, elapsed, least);

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
				/* Round the middle of a system: its root, a star, a barycentre of stars, the middle of a cluster. */
				var middle = !parent || trait(parent, 'Star') || trait(parent, 'Barycentre') || trait(parent, 'Cluster');
				if (object.Relative && middle)
					far = Math.max(far, vectors.Length(object.Relative) * (1 + number(trait(object, 'Orbit') && trait(object, 'Orbit').Eccentricity, 0)));

				/* A nebula reaches as far as its edge. */
				if (trait(object, 'Nebula'))
					far = Math.max(far, vectors.Length(object.Relative || [0, 0, 0]) + object.Size);

				if (trait(object, 'Belt') && middle)
					far = Math.max(far, vectors.Length(spread([number(trait(object, 'Belt').Outer, 3), 0, 0], null)));
			});

			return far;
		}

		/* How far to stand from an object to see it and what goes round it. */
		function closeness (object) {
			var far = Math.max(object.Size, 0.02) * 4.5;

			if (trait(object, 'Star') && !object.Parent) return extent() * 1.6;

			if (trait(object, 'Nebula')) return object.Size * 2.6;

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

		/*
		 * How deep under the rock of a ground with a volume the eye is, 0 (under the sky) to 1 (deep in a cave), followed in a
		 * second or so: of 14 rays from it through the density, 30 m long, those that come out under the sky (over the ground
		 * there, in air). Asked every 8th frame. The eye takes in more of what is dim by it, and the haze of the sky is not in
		 * a cave.
		 */
		function eyeDeep () {
			var ground = scene.Ground;
			var volume = ground && ground.Field && ground.Field.Volume;
			var eye = scene.Eye;
			var out = 0;
			var weight = 0;

			if (!volume) return 0;

			ground.DeepFrame = (ground.DeepFrame || 0) + 1;

			if (ground.DeepAt === undefined || ground.DeepFrame % 8 === 0) {
				[[0, 1, 0], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0.7, 0, 0.7], [-0.7, 0, 0.7], [0.7, 0, -0.7], [-0.7, 0, -0.7], [0, -1, 0]].forEach(function (way) {
					var share = 1 + Math.max(0, way[1]);
					var step;

					weight += share;

					for (step = 1.5; step <= 30; step += 1.5) {
						var x = eye[0] + way[0] * step;
						var y = eye[1] + way[1] * step;
						var z = eye[2] + way[2] * step;
						if (volume.Density(x, y, z) > 0) return;

						if (y > volume.Ground(x, z) + 1) {
							out += share;

							return;
						}
					}
				});

				ground.DeepAt = 1 - out / weight;
			}

			ground.Deep = ground.Deep === undefined ? ground.DeepAt : ground.Deep + (ground.DeepAt - ground.Deep) * 0.05;

			return ground.Deep;
		}

		/*
		 * The rooms of the ship standing nearest the eye (engine.Indoor: {At, Yaw, Half, Leak}), within 300 m: the box
		 * indoorDaylight takes the day out of. Regression: the sky lit the rooms of a ship as a house with no roof.
		 */
		function indoorLight () {
			var box = scene.Ground && engine.Indoor ? engine.Indoor(scene.Eye, 300) : null;

			return box ? {uIndoorAt: local(box.At).concat([box.Yaw]), uIndoorHalf: box.Half.concat([1 + box.Leak])} : {uIndoorAt: [0, 0, 0, 0], uIndoorHalf: [0, 0, 0, 0]};
		}

		/*
		 * The daylight of a cave round the eye for what is not of the ground (models, what is sown, walkers): a box of 64 by 32
		 * by 64 m in points 2 m apart (SceneTerrainGenerator.Daylight, made in a worker as the eye goes 16 m on), in the texture
		 * of the probes, which it has no use for at a quality without them (Graphics().Probes 0): every program has it, and
		 * none a unit more free. aroundLight takes no more of the sky there than comes; with the probes on they do it themselves.
		 * Regression: the stones and dripstones deep in a cave were lit grey by the sky, as on the hill over it.
		 */
		/*
		 * The daylight of a cave in a box round the eye, 64 by 32 by 64 metres from its first corner (by default by whole 16
		 * metres round it): {Texture, Corner, Count, Cell} (Daylight of SceneTerrainGenerator, of the workers; the one before
		 * while it comes), null of a ground with no volume there. The light of probes (SceneProbes) asks it of its own box.
		 */
		function caveBox (given) {
			var ground = scene.Ground;
			var field = ground && ground.Field;
			var cell = 2;
			var count = [33, 17, 33];
			var corner;
			var key;

			if (!field || !field.Volume || !field.Options || scene.Camera.Ortho) return null;

			corner = given || [Math.round(scene.Eye[0] / 16) * 16 - 32, Math.round(scene.Eye[1] / 8) * 8 - 16, Math.round(scene.Eye[2] / 16) * 16 - 32];
			key = 'cave:' + corner.join(':') + ':' + (ground.Dug || 0);

			if (!field.Volume.Touches(corner[0], corner[2], corner[0] + 64, corner[2] + 64)) return null;

			ground.Caves = ground.Caves || {};

			if (!ground.Caves[key] && !ground.Caves[key + ':asked']) {
				ground.Caves[key + ':asked'] = true;

				askPiece(ground, key, 'Daylight', corner.concat(count, [cell]), function (piece) {
					var made = piece || terrain.Piece('Daylight', field.Options, null, corner.concat(count, [cell]));

					/* Only the box the eye is in, and the one before it while that comes. */
					Object.keys(ground.Caves).forEach(function (other) {
						if (other.indexOf(':asked') === -1 && other !== ground.CaveNow) {
							ground.Caves[other].Texture.Destroy();
							delete ground.Caves[other];
						}
					});

					ground.Caves[key] = {Corner: corner, Texture: renderer.Texture({Width: made.Width, Height: made.Height, Data: made.Data}, {Single: true})};
					delete ground.Caves[key + ':asked'];
				});
			}

			if (ground.Caves[key])
				ground.CaveNow = key;

			if (!ground.CaveNow || !ground.Caves[ground.CaveNow]) return null;

			return {Texture: ground.Caves[ground.CaveNow].Texture, Corner: ground.Caves[ground.CaveNow].Corner, Count: count, Cell: cell};
		}

		engine.CaveDaylight = caveBox;

		/* The daylight of a cave round the eye in the texture of the probes, with none (medium and low). */
		function caveLight () {
			var box = self.Graphics().Probes ? null : caveBox();
			if (!box)
				return {uCaveOn: 0};

			return {uCaveOn: 1, uProbe: box.Texture, uCaveBox: vectors.Subtract(box.Corner, scene.Eye).concat([box.Cell]), uCaveCount: box.Count};
		}

		/*
		 * Where a box of the ground is rock (SceneTerrainGenerator.Rock: a byte a voxel of a metre), for the grid of the light
		 * of probes (SceneProbes): done({Data, Width, Height}) when the workers made it, null of a ground they cannot make it
		 * of. Regression: the grid had only the surfaces, what was under the ground was air to it; the probes in the rock
		 * over a tunnel saw the sky through it, and what hung from its roof shone white.
		 */
		engine.GroundRock = function (corner, count, done) {
			var ground = scene.Ground;
			var field = ground && ground.Field;
			var args = corner.concat(count);

			if (!field || !field.Options) return done(null);

			askPiece(ground, 'rock:' + args.join(':') + ':' + (ground.Dug || 0), 'Rock', args, function (piece) {
				done(piece || terrain.Piece('Rock', field.Options, null, args));
			});
		};

		/* The layer of clouds over a ground: high over its hills, its noise as large as the land allows. */
		function groundClouds () {
			var ground = scene.Ground;
			/* As much higher than on the Earth as the main deck of the body is over the layer of the Earth (3 km: airAround). */
			var low = Math.max(ground.Field.Top * 1.6, 90) * (ground.Aired && ground.Aired.Layer ? Math.max(0.2, ground.Aired.Layer[0] / 3) : 1);
			var sky = ground.SkyLight;
			var light = ground.SunColor;

			var day = ground.Day;
			var rise = ground.Sky[1];
			var glow = (1 - Math.min(1, Math.abs(rise) / 0.3)) * day;
			var moonlit = rise < 0 ? 1.3 : 1.6;

			/* By night a cloud shows only by what lights it: without a moon or towns it is dark, and hides the stars. */
			var tone = (0.5 + 0.7 * day) * Math.min(1, day * 1.6 + ground.MoonLit * 0.6);

			/*
			 * A location a ship came down to on a planet of a weather (SceneLanding): its sky the shell of that weather, turned as
			 * the location lies on its body (its +X, its up, its -Z its north), in metres: the very clouds seen coming down.
			 * Regression: a layer of its own 90 to 200 units up, another sky than the one it came down through.
			 */
			var site = scene.Location && scene.Location.Frame ? scene.Location : null;
			var body = site ? scene.Objects[site.Body] : null;
			var made = body ? scene.Baked[body.ID] : null;
			var weather = made && made.Weather && made.WeatherFaces >= 6 && site.Planet ? made.Weather : null;
			var frame = site ? site.Frame : null;

			if (weather) {
				return {Turn: [frame.X[0], frame.Middle[0], -frame.North[0], frame.X[1], frame.Middle[1], -frame.North[1], frame.X[2], frame.Middle[2], -frame.North[2]], From: scene.Eye, Sun: ground.Sky[1] > -0.05 ? ground.Sky : ground.Sun, SunLight: [light[0] * moonlit, light[1] * moonlit, light[2] * moonlit], SkyTone: [sky[0] * tone, sky[1] * tone, sky[2] * tone], Under: [1.2 * glow, 0.42 * glow, 0.2 * glow], Below: ground.Glow, BelowWay: ground.GlowWay, Haze: hazeOf(ground), Layer: [low, low * 2.2, 1.1 / low], Over: false, Shell: [radiusOf(body), 0, 1, 1], ShellUnit: 0.001, Weather: weather};
			}

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

			/* What its clusters draw of each large model, for the eye where it is now. */
			Object.keys(scene.StillLists || {}).forEach(function (name) {
				if (scene.StillLists[name].Clustered)
					clusterStep(name, scene.StillLists[name], false);
			});

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

			/* With none, the daylight of a cave round the eye in their texture. */
			if (scene.Ground && !shade.uProbeOn)
				Object.assign(shade, caveLight());

			/* The rooms of a ship standing near: little of the day comes into them (SceneAboard). */
			Object.assign(shade, indoorLight());

			/* What burns on a ship lights it in space as well. */
			if (!scene.Ground)
				Object.assign(shade, localLights());

			var common = Object.assign({uViewProjection: matrix, uCamera: [0, 0, 0], uLightPositions: light.Positions, uLightColors: light.Colors, uLightCount: light.Count, uSkyLight: scene.Ground ? scene.Ground.SkyLight : [0.004, 0.004, 0.006], uFloorLight: scene.Ground ? scene.Ground.FloorLight : [0.004, 0.004, 0.006], uSkySun: scene.Ground ? scene.Ground.Sun : [0, 1, 0], uAmbient: scene.Ground ? [0.17, 0.19, 0.23] : scene.CosmosShade ? [0.025 + scene.CosmosShade[0], 0.027 + scene.CosmosShade[1], 0.035 + scene.CosmosShade[2]] : [0.025, 0.027, 0.035], uOccluderCount: 0, uOccluders: new Array(16).fill(0), uTime: scene.Time, uHighlight: [0, 0, 0, 0], uWind: scene.Gust || 0, uWet: scene.Ground ? scene.Ground.Air.Wet : 0, uSnowed: snowed(), uRainDrops: scene.Ground ? scene.Ground.Air.Rain : 0, uEyeAt: scene.Eye || [0, 0, 0], uTime2: scene.Seconds % 1000, uNightGlow: scene.Ground ? scene.Ground.Night || 0 : 1, uScreenMirror: engine.ScreenMirror && engine.ScreenMirror() ? 1 : 0, uLevel: engine.LevelColor('near', 0)}, shade, self.WindValues(scene.Seconds));

			/* What the draws of the frame share: set on a program once, then only what is their own (Renderer.Shared; marked again at each change). */
			renderer.Shared(common);

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
				var mine = renderer.Shared(Object.assign(Object.create(common), {uViewProjection: vp, uCamera: eye, uMoving: 0, uSteady: 0, uCut: [0, 0, 0, 0], uHoleAt: [0, 0, 0, 0], uHoleHalf: [0, 0, 0, 0], uHeroFade: 0}));

				var sees = frustum(vp, renderer.Width);

				drawGround(vp, nodes, shade, true);

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					/* The glass of a mirror is not in its own picture, nor in another's. */
					if (list.Material && seeThrough(list.Material) || list.MirrorKey || !seen(list, sees)) return;

					drawList(name, list, mine, {Origin: originOf(list)});
				});

				/* A mirror of a car shows the trees and the grass too at high and ultra: its picture is as fine as the screen now, and no bigger than the mirror. */
				if (self.Graphics().Mirrors.Scatter === 'all' || self.Graphics().Mirrors.Scatter === 'large' && !small)
					engine.ScatterDraw(mine, vp);
			};
			var mirrored = scene.Ground && !scene.Camera.Ortho ? mirrorsOf(projection, viewMatrix, worldOf) : {};

			/* What the cameras of the screens see (SceneScreens), drawn as the mirrors are. */
			if (scene.Ground && !scene.Camera.Ortho && engine.ScreensWorld)
				engine.ScreensWorld(projection, viewMatrix, worldOf);

			weathers();

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

				renderer.Shared(common);
			}
			else {
				passed(matrix, null, [camera.Near, camera.Far]);
			}

			/* All that stands, once, through a view (its matrix), its depth in a range of the buffer (null: all of it). */
			function passed (matrix, range, planes) {
				var later = [];

				common.uViewProjection = matrix;
				common.uDepthRange = range || [0, 1];

				renderer.Shared(common);

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

						drawReady(gpu.Sphere, starProgram(object), uniforms({uModel: model, uNormalMatrix: math.NormalMatrix(model), uColor: paint(object.Color).slice(0, 3), uSeed: object.Seed, uCells: object.Star.Radius > 8 ? 3 : object.Star.Radius > 2 ? 6 : 9, uBands: number(trait(object, 'Star').Bands, 0)}));

						later.push(function () {
							/* In real sizes its disc is small, its light is not: a halo of a size on the screen, as bright as it blinds (drawGlare). */
							drawGlare(object, local(object.World), right, up, size, pixels(object.World, 1), realness() >= 0.999 ? starLight(object, vectors.Distance(object.World, scene.Eye)) : 0, uniforms);
						});
					}
					else if (trait(object, 'Body')) {
						surface = baked(object);

						/* A giant the eye is in (SceneGiants): its air round the eye is all of it, not its globe from outside. */
						if (engine.GiantNow && engine.GiantNow() && engine.Giant.Body === object && engine.Giant.Fade > 0.5) return;

						/* Near, a planet of ScenePlanet is its very ground, finer the nearer (drawGlobe), its clouds over it; far, its globe once all painted. */
						var near = !!surface && surface.Planet && !scene.Camera.Ortho && object.Size / pixels(object.World, 1) > 60;
						if (!surface || surface.Planet && !surface.Painted && !near) return;

						model = placed(object, size);
						shade = occluders(object);

						if (near && drawGlobe(object, planes)) {
							if (object.Look.Clouds && !scene.Globes[object.ID].CloudsOver) {
								var high = math.Compose(local(object.World), object.Turn, size * 1.004);

								later.push(function () {
									drawReady(gpu.Sphere, gpu.Planet, uniforms(Object.assign({uModel: high, uNormalMatrix: math.NormalMatrix(high), uGround: surface.Ground, uSky: surface.Sky, uKind: object.Look.Kind, uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]), uClouds: object.Look.Clouds, uAtmosphere: object.Look.Atmosphere, uOccluders: shade.Data, uOccluderCount: shade.Count, uHighlight: [0, 0, 0, 0], uCloudsOnly: 1, uExact: 0, uBall: 0, uDrift: engine.CloudDrift(object), uLights: noLights(), uLightsOn: 0, uRelief: noLights(), uReliefOn: 0}, weatherValues(object, surface), ringOver(object))), {Blend: 'alpha', DepthWrite: false});
								});
							}
						}
						else {
							/*
							 * Large on the screen (near): its ball exact, its mesh a little larger to cover it (its flat faces are some 80 km
							 * off the ball of Jupiter, as much as the height of a ship over its tops). Within its mesh (some hundred km over a
							 * giant) its inner side covers the view: drawn too.
							 */
							var exact = size / pixels(object.World, 1) > 30;
							var apart = local(object.World);

							if (exact)
								model = placed(object, size * 1.003);

							drawReady(gpu.Sphere, gpu.Planet, uniforms(Object.assign({uExact: exact ? 1 : 0, uBall: exact ? (vectors.Length(apart) - size) * (vectors.Length(apart) + size) : 0, uModel: model, uNormalMatrix: math.NormalMatrix(model), uGround: surface.Ground, uSky: surface.Sky, uKind: object.Look.Kind, uColors: [].concat(object.Look.Colors[0], object.Look.Colors[1], object.Look.Colors[2], object.Look.Colors[3]), uClouds: object.Look.Clouds, uAtmosphere: object.Look.Atmosphere, uOccluders: shade.Data, uOccluderCount: shade.Count, uHighlight: highlight(object), uCloudsOnly: 0, uDrift: engine.CloudDrift(object), uLights: surface.Lights || noLights(), uLightsOn: surface.Lights ? 1 : 0, uRelief: surface.Relief || noLights(), uReliefOn: surface.Relief ? 1 : 0}, weatherValues(object, surface), ringOver(object))), exact && vectors.Length(apart) < size * 1.006 ? {Cull: 'none'} : undefined);
						}

						if (object.Look.Atmosphere[3]) {
							later.push(function () {
								var shell = math.Compose(local(object.World), null, size * 1.07);
								var reach = vectors.Length(local(object.World));

								/*
								 * From inside its shell: the rays of the screen, behind all that stands, not its mesh round the eye. Regression: from
								 * there (a ship near a giant) whole triangles of the shell went black over the stars.
								 */
								if (reach < size * 1.08) {
									drawReady(gpu.Quad, gpu.AirAround, uniforms({uInverse: math.Invert(sky), uReach: reach, uColor: object.Look.Atmosphere.slice(0, 3), uStrength: object.Look.Atmosphere[3], uBody: local(object.World).concat([size]), uShell: size * 1.07}), {Blend: 'add', DepthWrite: false, Depth: 'lequal', Cull: 'none'});

									return;
								}

								drawReady(gpu.Sphere, gpu.Air, uniforms({uModel: shell, uNormalMatrix: math.NormalMatrix(shell), uColor: object.Look.Atmosphere.slice(0, 3), uStrength: object.Look.Atmosphere[3], uBody: local(object.World).concat([size]), uShell: size * 1.07}), {Blend: 'add', DepthWrite: false, Cull: 'front'});
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

							drawReady(ring.Mesh, gpu.Ring, uniforms({uModel: matrix, uNormalMatrix: math.NormalMatrix(matrix), uColors: [].concat(ring.Colors[0], ring.Colors[1], ring.Colors[2], ring.Colors[3]), uSeed: object.Seed, uOccluders: planet, uOccluderCount: round ? 1 : 0}), {Blend: 'alpha', DepthWrite: false, Cull: 'none'});
						});
					}

					if (self.Orbits && self.Orbits !== 'false' && trait(object, 'Orbit') && trait(object, 'Orbit').Unit !== 'radii' && !object.Owner && astronomy.Length(trait(object, 'Orbit').Distance) && !crowded(object, parent))
						later.unshift(line(object, parent, uniforms));

					/* The swarm of a cluster: behind the bodies, hidden by them, its light added. */
					if (trait(object, 'Cluster') && swarmOf(object))
						later.unshift(function () {
							var at = local(object.World);

							drawReady(swarmOf(object), gpu.Far, {uViewProjection: math.Multiply(uniforms({}).uViewProjection, math.Translation(at[0], at[1], at[2])), uRatio: renderer.Ratio}, {Blend: 'add', DepthWrite: false, Cull: 'none'});
						});
				});

				/* Black holes, wormholes, comets and quasars (SceneDeepSpace): light bent and gas that glows, with what is seen through. */
				if (engine.DeepDraw)
					engine.DeepDraw(matrix, later, right, up, planes);

				/* Clouds of gas and dust (SceneNebula), through their balls. */
				if (engine.NebulaDraw)
					engine.NebulaDraw(matrix, later, planes);

				var sees = frustum(matrix, renderer.Width);

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					if (!seen(list, sees)) return;

					/* Its program not made by the card yet: waited for by the veil of the scene, not by the page (not drawn this frame). */
					if (scene.Looping && !list.MirrorKey && !programReady(list.Material ? pbrOf(list) : gpu.Many)) return;

					/* The glass of a mirror of a car: the picture of its mirror in its own shape. */
					if (list.MirrorKey && mirrored[list.MirrorKey]) {
						renderer.Draw(shape(name), mirrorGlass(list), Object.assign(uniforms({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft}), mirrorValues(list.MirrorKey, mirrored[list.MirrorKey])), {Cull: 'none'});

						return;
					}

					var blended = !!list.Material && seeThrough(list.Material);
					var drawn = function () {
						drawList(name, list, common, {Origin: originOf(list), Level: true, Blend: true, Values: list.Material ? {uMoving: list.Still || blended ? 0 : 1, uSteady: list.Still ? 0 : 1, uCut: heroCut(list)} : {uMoving: list.Still ? 0 : 1}});
					};

					/* What is seen through comes after all it shows, and hides nothing of what is drawn after it. */
					if (blended) later.push(drawn);
					else drawn();
				});

				/*
				 * The mirrors as panes of what they show, the glass after all it shows through; in space the screens alone (of the
				 * consoles of a ship in flight, SceneAboard). Regression: in space a console showed its glow, never its screen.
				 */
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

				/* The shells of the shields: their light added over all, the depth kept, their front faces. */
				drawShells(scene.ShellLists, uniforms);

				/* The wire of all and the edges of the models, over them. */
				[['wire', wired(), scene.Colors.Wire], ['edges', edged(), scene.Colors.Edges]].forEach(function (one) {
					if (!one[1]) return;

					Object.keys(models).forEach(function (name) {
						var list = models[name];
						if (list.Count && list.Geometry !== undefined && !list.Skinned && seen(list, sees))
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

				/*
				 * Its rays of the view of the sky (sky), its depth of the view of space. Regression: of the view of space of real sizes (a
				 * near plane of a metre, a far one past the stars) its inverse lost the way of each pixel, the tunnel and the stars drawn
				 * out a dim blur round the point ahead.
				 */
				engine.CosmosWarp(sky, Object.assign({Depth: Math.min(0.99999, math.Apply(plain, vectors.Scale(forward, reach))[2])}, scene.Warp));
			}

			/* In a giant (SceneGiants): its air round the eye over all that lies far, drops on the glass in the seat of a ship. */
			if (!scene.Ground && engine.GiantDraw)
				engine.GiantDraw(sky);

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

			/*
			 * The marks of the selected objects (the one selected and the others chosen with it): a ring with SelectMark ring;
			 * with an outline, a ring while it is small on the screen (near, its outline shows it). Regression: what was too
			 * small to be seen (a fleet far off) and had no place of its own showed nothing: the middle of its parts then.
			 */
			[selected].concat((scene.Chosen || []).filter(function (id) {
				return id !== scene.Selected;
			}).map(function (id) {
				return scene.Objects[id];
			})).forEach(function (one) {
				var at = one ? markPlace(one) : null;
				if (!at || chosen.Look === 'none' || !(chosen.Look === 'ring' || chosen.Look === 'outline' && Math.max(one.Size || 0, 0.001) < pixels(at, 40))) return;

				renderer.Draw(gpu.Quad, gpu.Glow, uniforms({uCenter: local(at), uSize: Math.max((one.Size || 0) * 1.5, pixels(at, 16)), uRight: right, uUp: up, uColor: chosen.Look === 'ring' ? chosen.Color.slice(0, 3) : scene.Colors.Selection.slice(0, 3), uInner: 0, uStyle: 1}), {Blend: 'add', DepthWrite: false, Depth: false, Cull: 'none'});
			});

			if (split) {
				renderer.GL.depthRange(0, 1);

				common.uViewProjection = matrix;

				renderer.Shared(common);
			}

			/* How deep in a cave the eye is: asked each frame, so it follows. */
			var deep = scene.Ground ? eyeDeep() : 0;

			if (posted)
				engine.PostEnd(scene.Ground ? {Matrix: matrix, Plain: plain, Eye: scene.Eye, Shade: shade, Under: scene.Ground.Under ? 1 : 0, Deep: deep, Sun: scene.Ground.Sun, SunColor: scene.Ground.SunColor, SkyLight: scene.Ground.SkyLight, FloorLight: scene.Ground.FloorLight, Night: scene.Ground.Night, Shimmer: engine.EffectHeat(matrix, width / Math.max(1, height)), Exposure: self.Exposure, Air: scene.Ground.AirTint, Veil: scene.Ground.Air.Fog * (scene.Ground.Air.Rain > 0.05 ? 1 : 0.6) * (1 - deep), Clouds: scene.Camera.Ortho ? null : groundClouds(), Glare: scene.Ground.Glare, AirLight: scene.Ground.AirLight * (1 - deep), AirGlow: scene.Ground.Glow, AirGlowWay: scene.Ground.GlowWay, Fog: scene.Camera.Ortho ? 0 : (scene.Horizon ? 0.4 / 40000 : (scene.Ground.Field.Whole ? 0.12 : 0.4) / Math.max(scene.Ground.Field.Size, 300)) + scene.Ground.Air.Fog * 0.011, FogLow: scene.Camera.Ortho ? [0, 0, 0] : [Math.max(0, scene.Eye[1] - Math.max(0, scene.Ground.Field.Height(scene.Eye[0], scene.Eye[2]))), 1 / Math.max(6, scene.Ground.Field.Top * 0.2), scene.Ground.Air.Fog * 0.03], Sky: true, Reach: Math.max(1, scene.Distance * 0.05), Bokeh: lens().Bokeh, Focus: lens().Focus, Lens: lens().Lens} : Object.assign({Matrix: matrix, Plain: sky}, spaceSun(plain, camera), lens()));
		}

		/* Where the mark of an object goes: its place, or (a fleet, a group with none of its own) the middle of its parts that have one. */
		function markPlace (object) {
			var parts;
			var sum;

			if (object.World && !object.Hidden) return object.World;

			parts = scene.Order.filter(function (one) {
				return one.World && !one.Hidden && (one.Root === object || one.Owner === object || String(one.ID).indexOf(object.ID + '/') === 0);
			});

			if (!parts.length) return null;

			sum = parts.reduce(function (total, one) {
				return [total[0] + one.World[0], total[1] + one.World[1], total[2] + one.World[2]];
			}, [0, 0, 0]);

			return [sum[0] / parts.length, sum[1] / parts.length, sum[2] / parts.length];
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
			return {Sun: way, SunColor: paint(star.Color).slice(0, 3), Star: true, Ring: Math.abs(matrix[5]) * 0.5 * Math.max(star.Size / far, realness() >= 0.999 ? 0.006 : 0), Clear: Math.min(0.9999, (clip[0] / Math.max(clip[1], 1e-6)) * 0.5 + 0.5 - 1e-6), Glare: realness() >= 0.999 ? starLight(star, far) : Math.min(1, Math.pow(star.Size / far * 7, 1.3))};
		}

		/* How large a star is seen from a body (the angle of its radius): as it is in real sizes, else as the Sun from the Earth. */
		function discOf (star, body) {
			return realness() >= 0.999 && star && body && body.World ? Math.atan(star.Size / Math.max(1e-12, vectors.Distance(star.World, body.World))) : 0.00465;
		}

		engine.StarDisc = discOf;

		/* How a star of real size blinds at a distance (units of the view): 0.9 for the Sun from the Earth. */
		function starLight (star, far) {
			var au = far / UNIT;

			return Math.min(1, 0.9 * Math.sqrt(number(star.Star.Luminosity, 1) / Math.max(1e-6, au * au)));
		}

		/*
		 * How much a star lights what is far from it (units of the view), to the Sun on the Earth: its luminosity over the square
		 * of the distance, as an eye taken to it sees it (a power of 0.35: a third of the light at Neptune, not a thousandth),
		 * 0.2 to 1.5. In sizes not real, 1. Of the light of things in space and on a body alike.
		 */
		function starShine (star, far) {
			var au = far / UNIT;

			if (realness() < 0.999) return 1;

			return Math.max(0.2, Math.min(1.5, Math.pow(number(star.Star.Luminosity, 1) / Math.max(1e-6, au * au), 0.35)));
		}

		engine.StarShine = starShine;

		/*
		 * The star graph of a star (its Blueprint of the trait Star: a graph, its JSON), made once a graph: Look (its numbers
		 * each frame: SceneDeepSpace), Surface and Crown (its parts in shaders); null with none. One that cannot be made is
		 * told once, the star drawn as the library has it.
		 */
		var starGraphs = {Graphs: typeof WeakMap === 'function' ? new WeakMap() : null, Texts: {}};

		function starMade (object) {
			var graph = trait(object, 'Star') ? trait(object, 'Star').Blueprint : null;
			var made;

			if (!graph)
				return null;

			made = typeof graph === 'string' ? starGraphs.Texts[graph] : starGraphs.Graphs ? starGraphs.Graphs.get(graph) : undefined;

			if (made !== undefined) return made;

			try {
				made = self.$Service('Blueprints').Compile(typeof graph === 'string' ? JSON.parse(graph) : graph);
			}
			catch (error) {
				made = null;

				if (engine.Told)
					engine.Told('star', object.Name || object.ID, [{Block: null, Line: 0, Message: error.message}], error.message, 'Elemenx Scene: the Blueprint of a star cannot be made: ' + error.message);
			}

			if (typeof graph === 'string') starGraphs.Texts[graph] = made;
			else if (starGraphs.Graphs) starGraphs.Graphs.set(graph, made);

			return made;
		}

		engine.StarMade = starMade;

		/* The program of the surface of a star: of its own star graph when it has one (StarSurface), else of the library. */
		function starProgram (object) {
			var own = starMade(object);
			var program;

			if (!own || !own.Surface || typeof WeakMap !== 'function') return gpu.Star;

			gpu.StarPrograms = gpu.StarPrograms || new WeakMap();
			program = gpu.StarPrograms.get(own);

			if (!program) {
				program = renderer.Program(shaders.Lit, self.Install({Star: self.Shaders(graphics).Star}, 'void blueprintSun(vec3 n, vec3 v, vec3 p, inout vec3 color) {}', own.Surface).Star);

				gpu.StarPrograms.set(own, program);
			}

			return program;
		}

		/*
		 * The glare of a star: a wide veil and a close one round its disc (size: the radius of its disc, pixel: a pixel there,
		 * in units of the view), as bright as it blinds (blind: starLight), a point of light of what is left of a star (tiny);
		 * the same seen from space and from a body (amount: how much passes, the clouds and a moon before it); wrap makes the
		 * uniforms of the view of them.
		 */
		function drawGlare (star, centre, right, up, size, pixel, blind, wrap, amount) {
			var color = paint(star.Color).slice(0, 3);
			var tiny = star.Star.Radius < 0.02 ? 1 : 0;
			var wide = Math.max(size * 11, pixel * Math.max(520 * blind, 36 * tiny));
			var close = Math.max(size * 4.2, pixel * Math.max(110 * blind, 9 * tiny));
			var through = amount === undefined ? 1 : amount;

			/* The wide veil first: the disc does not end at once at black space. */
			drawReady(gpu.Quad, gpu.Glow, wrap({uCenter: centre, uSize: wide, uRight: right, uUp: up, uColor: color.map(function (part) {
				return part * (0.3 + blind * 0.5) * through;
			}), uInner: 0.09, uStyle: 0}), {Blend: 'add', DepthWrite: false, Cull: 'none'});

			drawReady(gpu.Quad, gpu.Glow, wrap({uCenter: centre, uSize: close, uRight: right, uUp: up, uColor: color.map(function (part) {
				return part * (1 + blind * 2) * through;
			}), uInner: 0.18, uStyle: 0}), {Blend: 'add', DepthWrite: false, Cull: 'none'});
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

			shells();

			if (!scene.StillLists) {
				scene.StillLists = {};

				scene.Still.forEach(function (object) {
					if (object.Hidden) return;

					gatherModel(scene.StillLists, object, trait(object, 'Model'), true);
				});

				Object.keys(scene.StillLists).forEach(function (name) {
					upload(name, scene.StillLists[name]);

					clustered(name, scene.StillLists[name]);
				});
			}

			return Object.assign(drawn, scene.StillLists);
		}

		/*
		 * A large model that stands alone (one copy, no skeleton, of 3000 faces or more: a tower, a large model of a file) drawn
		 * by its clusters (SceneClusters, as Nanite): made once for its shape in a worker, its mesh then of all its levels,
		 * each part as fine as the screen needs (clusterStep). Clusters false: as it is.
		 */
		function clustered (name, list) {
			var geometry = list.Geometry;
			var faces = geometry && geometry.Positions ? (geometry.Indices && geometry.Indices.length ? geometry.Indices.length : geometry.Positions.length / 3) / 3 : 0;
			var known;

			if (list.Count !== 1 || list.Skinned || faces < 3000 || self.Clusters === false || self.Clusters === 'false') return;

			gpu.Clustered = gpu.Clustered || new WeakMap();
			known = gpu.Clustered.get(geometry);

			if (known && known.Built) {
				adopt(name, list, known.Built);

				return;
			}

			if (known) {
				known.Waiting.push([name, list]);

				return;
			}

			known = {Waiting: [[name, list]], Built: null};

			gpu.Clustered.set(geometry, known);

			self.$Service('SceneClusters').Work().Run('SceneClusters', 'Build', [{Positions: geometry.Positions, Normals: geometry.Normals, Colors: geometry.Colors, UVs: geometry.UVs, Indices: geometry.Indices}], function (error, built) {
				if (error || !built || scene.Gone || renderer.Lost) return;

				known.Built = built;

				known.Waiting.forEach(function (one) {
					adopt(one[0], one[1], built);
				});

				known.Waiting = [];
			});
		}

		/* The mesh of a list of its clusters, its copy as it was: from now on what its clusters choose is drawn. */
		function adopt (name, list, built) {
			if (!scene.StillLists || scene.StillLists[name] !== list) return;

			if (gpu.Shapes[name])
				gpu.Shapes[name].Destroy();

			/* What read the copies of the shape let go: made again of the new one. */
			if (gpu.VoxelShapes[name])
				gpu.VoxelShapes[name].Destroy();

			delete gpu.VoxelShapes[name];

			gpu.Shapes[name] = renderer.Mesh({Positions: built.Positions, Normals: built.Normals, Colors: built.Colors, UVs: built.UVs, Indices: built.Indices});
			list.Clustered = {Built: built, Key: '', Level: 0, Clusters: 0};

			upload(name, list);

			clusterStep(name, list, true);
		}

		/*
		 * The clusters of a list chosen again for the eye where it is (SceneClusters.Select, engine.ClusterPixels the error
		 * allowed, 1 pixel): only when it went a twentieth of the way to the model since, or the screen changed.
		 */
		function clusterStep (name, list, force) {
			var made = list.Clustered;
			var eye = scene.Eye || [0, 0, 0];
			var place = [list.Places[0], list.Places[1], list.Places[2]];
			var far = Math.hypot(eye[0] - place[0], eye[1] - place[1], eye[2] - place[2]);
			var step = Math.max(0.25, far * 0.05);
			var focal = renderer.Height / (2 * Math.tan((scene.Camera.Fov || 50) * Math.PI / 360));
			var key = Math.round(eye[0] / step) + ':' + Math.round(eye[1] / step) + ':' + Math.round(eye[2] / step) + ':' + Math.round(step * 4) + ':' + Math.round(focal);
			var chosen;

			if (!force && made.Key === key) return;

			made.Key = key;
			chosen = self.$Service('SceneClusters').Select(made.Built, [list.X[0], list.X[1], list.X[2], list.Y[0], list.Y[1], list.Y[2], list.Z[0], list.Z[1], list.Z[2], place[0], place[1], place[2]], eye, focal, engine.ClusterPixels);
			made.Level = chosen.Level;
			made.Clusters = chosen.Clusters;

			if (gpu.Shapes[name])
				gpu.Shapes[name].Triangles(chosen.Indices);
		}

		/* The error a cluster may have on the screen, pixels. */
		engine.ClusterPixels = 1;

		/* The color of the level a list is drawn at while Levels is on: of its clusters, the coarsest drawn. */
		/*
		 * What a list of models gives each draw of it, of its material, its graph, the season and its dissolving: made once a
		 * frame, the passes that draw it (the view, the mirrors) given the same. Regression: made again for each draw of each
		 * pass, objects and arrays of them, much of the garbage of a frame.
		 */
		function valuesOf (name, list) {
			if (list.ValuesAt === scene.Painted && list.ValuesName === name && list.Values) return list.Values;

			list.Values = Object.assign({}, list.Material ? surface(list) : null, list.Material ? blueprintValues(list) : null, engine.SeasonValues(name), engine.DissolveValues(list));
			list.ValuesAt = scene.Painted;
			list.ValuesName = name;

			return list.Values;
		}

		/*
		 * A list of models drawn over a set of values (base: of the pass, Shared), its material by its program or the plain one:
		 * the one way the view, the mirrors and a ship over a surface draw them. own: {Origin, Values (over those of the list),
		 * Level (its color of a level of detail), Blend (what is seen through over what is behind, not written in depth)}.
		 * Regression: written three times, they went apart (a ship over a surface drew no hole of its ramp).
		 */
		function drawList (name, list, base, own) {
			var made = Object.create(base);
			var blended = !!own.Blend && !!list.Material && seeThrough(list.Material);

			if (list.Material) {
				renderer.Draw(shape(name), pbrOf(list), Object.assign(made, {uOrigin: own.Origin, uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uSoftness: list.Soft}, valuesOf(name, list), own.Values, own.Level ? levelOf(list) : null), {Cull: list.Material.DoubleSided ? 'none' : 'back', Blend: blended ? 'over' : 'none', DepthWrite: !blended});

				return;
			}

			renderer.Draw(shape(name), gpu.Many, Object.assign(made, {uShine: list.Matte ? 8 : 36, uSpecular: list.Matte ? 0.05 : 0.5, uRough: list.Rough, uOrigin: own.Origin}, valuesOf(name, list), own.Values, own.Level ? levelOf(list) : null));
		}

		function levelOf (list) {
			return list.Clustered ? {uLevel: engine.LevelColor('near', list.Clustered.Level)} : null;
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
		 * The layers of the shields (SceneShipSystems: ShipState.Layers of what has them, a ship or a character), each a shell
		 * round its outline: its model gathered once more for each layer with something left, grown along its normals (the
		 * outer the farther: Grow of a layer, of its size, else 4 % and 4 % more each layer in), as bright as it is full, a
		 * flash a moment after a hit.
		 */
		function shells () {
			var lists = scene.ShellLists = scene.ShellLists || {};

			Object.keys(lists).forEach(function (name) {
				lists[name].Count = 0;
			});

			scene.Order.forEach(function (object) {
				shellsOf(lists, object);
			});

			Object.keys(lists).forEach(function (name) {
				if (lists[name].Count) upload(name, lists[name]);
				else forgotten(lists, name);
			});
		}

		/* The shells of the layers of the shield of an object, gathered into lists (those of the scene, of a ship over a surface). */
		function shellsOf (lists, object) {
			var state = object.ShipState;
			var settings = trait(object, 'Model');
			var count;
			var middle;
			/* Its hull a ghost round its rooms, while the hero looks at its schematic (SceneTactics): its shields round it still. */
			var ghost = !!(object.CutAway && engine.TacticCut && engine.TacticCut(object.ID));
			if (!object.World || object.Hidden && !ghost || !settings || !(settings.Shape || object.Values.Model)) return;

			/* Its middle: of a ship where it is, of what stands on the ground half its height up. */
			middle = object.Ship || !scene.Ground ? object.World : [object.World[0], object.World[1] + (object.Size || 1) * 0.5, object.World[2]];

			if (ghost) {
				scene.Shelling = {Key: object.ID + ':ghost', Color: [0.35, 0.75, 1, 0.3], Grow: 0, Flash: 0, Center: middle};

				gatherModel(lists, object, settings);

				scene.Shelling = null;
			}

			if (!state || !state.Layers || !state.Layers.length) return;

			count = state.Layers.length;

			state.Layers.forEach(function (layer, index) {
				var part = layer.Capacity > 0 ? layer.Value / layer.Capacity : 0;
				var flash = Math.max(0, 1 - state.Since * 3) * (layer.Struck || 0);
				var color = paint(layer.Color, [0.5, 0.83, 1, 1]);
				var grow = layer.Grow !== undefined ? Number(layer.Grow) : 0.04 + 0.04 * (count - 1 - index);

				if (part <= 0.001 && flash <= 0.001) return;

				scene.Shelling = {Key: object.ID + ':' + layer.ID, Color: [color[0], color[1], color[2], part], Grow: (object.Size || 1) * grow, Flash: flash, Center: middle};

				gatherModel(lists, object, settings);

				scene.Shelling = null;
			});
		}

		/* The shells of lists drawn: their light added over all, the depth kept, their front faces (values: the uniforms of the pass). */
		function drawShells (lists, values) {
			Object.keys(lists || {}).forEach(function (name) {
				var list = lists[name];
				if (list.Count && list.Shell)
					renderer.Draw(shape(name, list.Geometry), list.Skinned ? gpu.ShellSkinned : gpu.Shell, Object.assign(values({uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : gpu.White, uJointOffset: list.Offset, uGrow: list.Shell.Grow, uShellCenter: local(list.Shell.Center), uColor: list.Shell.Color, uFlash: list.Shell.Flash, uTime: scene.Seconds % 1000})), {Blend: 'add', DepthWrite: false, Depth: 'lequal', Cull: 'back'});
			});
		}

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

			if (gpu.ShadowShapes[name])
				gpu.ShadowShapes[name].Destroy();

			if (gpu.ShadowShapes['merged:' + name])
				gpu.ShadowShapes['merged:' + name].Destroy();

			delete gpu.ShadowShapes[name];

			if (gpu.VoxelShapes[name])
				gpu.VoxelShapes[name].Destroy();

			delete gpu.VoxelShapes[name];
			delete gpu.ShadowShapes['merged:' + name];
			delete lists[name];
		}

		function upload (name, list) {
			list.Idle = 0;
			list.Box = boxOf(list);

			var size = list.Count * 4;
			var data = {aInstance: {Size: 4, Data: list.Places.subarray(0, size)}, aInstance2: {Size: 4, Data: list.X.subarray(0, size)}, aInstance3: {Size: 4, Data: list.Y.subarray(0, size)}, aInstance4: {Size: 4, Data: list.Z.subarray(0, size)}, aInstance5: {Size: 4, Data: list.Tints.subarray(0, size)}};

			if (list.Skinned) {
				data.aFrames = {Size: 4, Data: list.Frames.subarray(0, size)};
				data.aLayer = {Size: 4, Data: list.Layers.subarray(0, size)};
			}

			var made = shape(name, list.Geometry).Instance(data, list.Count);

			list.Uploaded = data;

			/*
			 * Its shapes of the shadows and its lines read the copies of its shape (Instance from): sent to the card once.
			 * Regression: sent again for each, the same numbers three or four times a frame.
			 */
			if (gpu.ShadowShapes[name])
				gpu.ShadowShapes[name].Instance(data, list.Count, made);

			if (gpu.ShadowShapes['merged:' + name])
				gpu.ShadowShapes['merged:' + name].Instance(data, list.Count, made);

			/* The wire of the scene, the edges of its models: their lines copied as the shape is. */
			if (wired() && name.indexOf('outline:') !== 0)
				linesMesh('wire', name, list.Geometry).Instance(data, list.Count, made);

			if (edged() && name.indexOf('outline:') !== 0)
				linesMesh('edges', name, list.Geometry).Instance(data, list.Count, made);
		}

		/*
		 * The box round all the copies of a list, in the world: the box of its shape (extentsOf) turned and scaled as each
		 * copy stands (its matrix), a little more round it (what sways in the wind, a wheel that turns); what has a skeleton,
		 * twice as far round its place as its shape reaches (its pose may reach past its shape at rest). What a pass sees
		 * none of is not drawn there (seen). Regression: a box round the origin of the shape was the whole world for a shape
		 * made where it stands (a road, a wall of a sketch), never culled.
		 */
		function boxOf (list) {
			var extents = extentsOf(list.Geometry);
			var center = [(extents[0] + extents[3]) / 2, (extents[1] + extents[4]) / 2, (extents[2] + extents[5]) / 2];
			var half = [(extents[3] - extents[0]) / 2, (extents[4] - extents[1]) / 2, (extents[5] - extents[2]) / 2];
			var radius = list.Skinned ? Math.sqrt(Math.max(extents[0] * extents[0], extents[3] * extents[3]) + Math.max(extents[1] * extents[1], extents[4] * extents[4]) + Math.max(extents[2] * extents[2], extents[5] * extents[5])) * 2 : 0;
			var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
			var shift = list.Still ? [0, 0, 0] : scene.Eye || [0, 0, 0];
			var i;
			var j;
			var at;
			var middle;
			var reach;
			var scale;
			var axes;

			for (i = 0; i < list.Count; i++) {
				j = i * 4;
				axes = [list.X, list.Y, list.Z];

				for (at = 0; at < 3; at++) {
					if (radius) {
						scale = Math.max(Math.sqrt(list.X[j] * list.X[j] + list.X[j + 1] * list.X[j + 1] + list.X[j + 2] * list.X[j + 2]), Math.sqrt(list.Y[j] * list.Y[j] + list.Y[j + 1] * list.Y[j + 1] + list.Y[j + 2] * list.Y[j + 2]), Math.sqrt(list.Z[j] * list.Z[j] + list.Z[j + 1] * list.Z[j + 1] + list.Z[j + 2] * list.Z[j + 2]));
						middle = list.Places[j + at] + shift[at];
						reach = radius * scale;
					}
					else {
						middle = list.Places[j + at] + shift[at] + axes[0][j + at] * center[0] + axes[1][j + at] * center[1] + axes[2][j + at] * center[2];
						reach = Math.abs(axes[0][j + at]) * half[0] + Math.abs(axes[1][j + at]) * half[1] + Math.abs(axes[2][j + at]) * half[2];
					}

					reach = reach * 1.1 + 0.1;
					box[at] = Math.min(box[at], middle - reach);
					box[at + 3] = Math.max(box[at + 3], middle + reach);
				}
			}

			return list.Count ? box : null;
		}

		/* The box of a shape ([minX, minY, minZ, maxX, maxY, maxZ]), found once for each geometry; the plain shapes (no geometry) within 1.6. */
		function extentsOf (geometry) {
			var p = geometry && geometry.Positions;
			var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
			var i;

			if (!p || !p.length)
				return [-1.6, -1.6, -1.6, 1.6, 1.6, 1.6];

			gpu.Extents = gpu.Extents || new WeakMap();

			if (gpu.Extents.has(geometry))
				return gpu.Extents.get(geometry);

			for (i = 0; i < p.length; i += 3) {
				box[0] = Math.min(box[0], p[i]);
				box[1] = Math.min(box[1], p[i + 1]);
				box[2] = Math.min(box[2], p[i + 2]);
				box[3] = Math.max(box[3], p[i]);
				box[4] = Math.max(box[4], p[i + 1]);
				box[5] = Math.max(box[5], p[i + 2]);
			}

			gpu.Extents.set(geometry, box);

			return box;
		}

		/*
		 * What a matrix of a pass sees (relative to the eye, as all the passes draw): its six planes ([a, b, c, d], inside where
		 * a x + b y + c z + d >= 0; a pass of parallel rays, a shadow or the voxels, has them too), the matrix, and how many
		 * pixels (texels of a shadow) its picture is across (pixels; none: no list is too small for it).
		 */
		function frustum (m, pixels) {
			return {Planes: [[m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]], [m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]], [m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]], [m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]], [m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]], [m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]]], Matrix: m, Pixels: pixels || 0, Scale: Math.sqrt(m[0] * m[0] + m[4] * m[4] + m[8] * m[8])};
		}

		/*
		 * Whether a pass sees any of a list: its box against the planes of the pass. What it does not see the card would
		 * have thrown away, every triangle of it, after it went through all of them: a world of hundreds of models drew each
		 * in every pass (the picture, its mirror, the normals, each slice of the shadow, the voxels), thousands of draws.
		 * Nor what is less than a pixel and a half of it (Tiny): a draw of its own for a speck (a lamp a kilometre away, a
		 * bench in a far slice of the shadow).
		 */
		function seen (list, sees) {
			var box = list.Box;
			var eye = scene.Eye || [0, 0, 0];
			var planes = sees && sees.Planes;
			var m = sees && sees.Matrix;
			var w;
			var x;
			var y;
			var z;
			var hx;
			var hy;
			var hz;
			var i;
			var plane;

			if (!box || !planes) return true;

			/* Far, it is in the proxy of its tile (SceneScatter): drawn there, with all the rest of it. */
			if (list.Covered) return false;

			x = (box[0] + box[3]) / 2 - eye[0];
			y = (box[1] + box[4]) / 2 - eye[1];
			z = (box[2] + box[5]) / 2 - eye[2];
			hx = (box[3] - box[0]) / 2;
			hy = (box[4] - box[1]) / 2;
			hz = (box[5] - box[2]) / 2;

			for (i = 0; i < planes.length; i++) {
				plane = planes[i];

				if (plane[0] * x + plane[1] * y + plane[2] * z + plane[3] < -(Math.abs(plane[0]) * hx + Math.abs(plane[1]) * hy + Math.abs(plane[2]) * hz)) return false;
			}

			if (!sees.Pixels) return true;

			/*
			 * Its size on the picture: across its box (the largest half of a side: of one copy, as far as its shape reaches),
			 * by the scale of the matrix, over how far it is (w; 1 in parallel rays).
			 */
			w = m[3] * x + m[7] * y + m[11] * z + m[15];

			return w <= 0.5 || Math.max(hx, hy, hz) * sees.Scale / w * sees.Pixels >= engine.Tiny;
		}

		/*
		 * Whether a pass sees a square of the ground: its box (as wide as it is, as high as its heights go, Span) against the
		 * planes of the pass, never its size. Regression: each square of the ground was drawn in each slice of the shadow and
		 * in the picture wherever it was, 500 draws and a million triangles a frame of a world of three kilometres.
		 */
		function nodeSeen (node, sees) {
			var half = node.Size / 2;

			if (!node.Span || !node.Center) return true;

			node.Box = node.Box || [node.Center[0] - half, node.Span[0] - 1, node.Center[2] - half, node.Center[0] + half, node.Span[1] + 1, node.Center[2] + half];

			return seen(node, {Planes: sees.Planes});
		}

		/* How many pixels a list is at least, for a pass to draw it (seen). */
		engine.Tiny = 1.5;

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

		/*
		 * A model asked for: waited for by the loading. One asked for after the scene was shown (a location came, a model
		 * was put in) prepares it again (softly: a veil only if it waits a while). Regression: it came with no bar, the
		 * scene was told ready before it, and its programs were made in the play.
		 */
		function asked (name) {
			scene.Asked[name] = true;

			if (scene.WasPrepared && !scene.Preparing && engine.Prepare)
				engine.Prepare(true);
		}

		/* A name of a model, or the name of a file of one: it is fetched the first time, and the scene is made again when it came. */
		function known (name) {
			if (/\.(glb|gltf)(\?|$)/i.test(name || '') && !library.Has(name))
				library.Define(name, {URL: name});

			if (library.Has(name) && !library.Ready(name) && !scene.Asked[name]) {
				asked(name);

				library.Load(name, function (error) {
					if (error) {
						scene.Broken[name] = true;

						self.$Emit('error', error);
					}

					/* A craft as long as it is of its model now come (craftScale), unless it is down in a location. */
					scene.Order.forEach(function (object) {
						if (object.Lengthed && !object.Located && object.Values.Model === name)
							object.Size = lengthOf(object) * METRE / craftScale(object);
					});

					scene.Version++;
				});
			}

			return library.Has(name);
		}

		function nameOf (object, settings) {
			return engine.PlantShape(object.Shape || object.Values.Model || settings.Shape);
		}

		/*
		 * The plant of a name in the style of the scene (PlantStyle): realistic, a plant of SceneFlora of that species (pine,
		 * spruce, oak, birch, palm, bush: flora-<name>) once it has come (asked for the first time it is wanted, grown in
		 * workers; what is sown is sown again when it comes, an object drawn by it); simple, or a name of no species, the name
		 * (a species of no plant of the simple style, an aspen: the one it stands for, its Simple, a birch).
		 */
		engine.PlantShape = function (name) {
			var flora;
			var styled;
			var plain;

			if (!name || typeof name !== 'string') return name;

			flora = self.$Service('SceneFlora');

			/* No SceneFlora in this page (a library without it): the simple style. */
			if (!flora || flora.ElemenxDeferred || flora.Species().indexOf(name) === -1) return name;

			plain = !library.Has(name) && flora.Presets[name].Simple ? flora.Presets[name].Simple : name;

			if (self.PlantStyle === 'simple') return plain;

			styled = 'flora-' + name;

			if (!library.Has(styled))
				flora.Define(styled, name);

			if (library.Ready(styled)) return styled;

			if (!scene.Asked[styled]) {
				asked(styled);

				library.Load(styled, function (error) {
					if (error) {
						scene.Broken[styled] = true;

						self.$Emit('error', error);
					}

					scene.Version++;
				});
			}

			return plain;
		};

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

				/*
				 * A ground with a Blueprint is a material of the land: drawn over the corners of the land, checked as it is drawn,
				 * its materials in it (LandOf). Regression: checked without them, it read landUnder they declare, did not compile
				 * and the ground was drawn as the library's, whatever its Blueprint.
				 */
				if (!shaderChecked(host === 'Land' ? 'land' : 'material', owner || material.Name || '', made, host === 'Land' ? shaders.LandVertex : shaders.Instanced, host === 'Land' ? gpu.LandText(own.Fragments[host], []) : own.Fragments[host])) {
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

			/* The frames of standing and going made before the rest (SceneModels Partial): drawn of them till all are. */
			if (!baked && model.Partial) {
				if (textures.PartialOf !== model.Partial) {
					if (textures.Partial)
						textures.Partial.Destroy();

					textures.Partial = renderer.Texture({Width: model.Partial.Width, Height: model.Partial.Height, Data: model.Partial.Data}, {Float: true, Nearest: true});
					textures.PartialOf = model.Partial;
				}

				return textures.Partial;
			}

			/* While its frames are being made a model stands in the first of them. */
			if (!baked) {
				if (!textures.Standing)
					textures.Standing = renderer.Texture({Width: model.Joints * 3, Height: 1, Data: new Float32Array(model.Baking.Frames[0])}, {Float: true, Nearest: true});

				return textures.Standing;
			}

			if (!textures.Palette) {
				textures.Palette = renderer.Texture({Width: baked.Width, Height: baked.Height, Data: baked.Data}, {Float: true, Nearest: true});

				if (textures.Partial) {
					textures.Partial.Destroy();

					textures.Partial = textures.PartialOf = null;
				}
			}

			return textures.Palette;
		}

		/* The floor under a place: the ground, a pipe, a floor of an interior, as one on its feet stands on it. */
		function floorAt (x, z, y) {
			var field = scene.Ground.Field;

			return Math.max(0, field.Height(x, z, y), engine.PipeFloor ? engine.PipeFloor(x, z, y) : -Infinity, engine.InteriorFloor ? engine.InteriorFloor(x, z, y) : -Infinity);
		}

		/*
		 * The feet of one of legs set on the ground under them (the graph of the feet: blueprints/animation/feet, FeetGraph of
		 * the scene or Graphs['animation/feet']): how far the ground under each ankle of its clip (SceneModels.Feet) is above
		 * or below the ground it stands on; its hips go down (FootDrop) for the lower to reach, each foot goes to its ground
		 * (LayerFrame z, w: in its model, the shader bends the leg to it). None in a vehicle, in the air, far from the eye.
		 * Regression: on a slope or a step one foot hung in the air and the other went into the ground.
		 */
		function footing (object, made, base, scale) {
			var kept = object.Footing = object.Footing || {Left: 0, Right: 0, Drop: 0};
			var want = {Left: 0, Right: 0, Drop: 0, Rate: 14};
			var near = object.World && scene.Eye && vectors.Distance(object.World, scene.Eye) < 80;
			var feet = near && scene.Ground && made.Legs && made.Legs.length === 2 && object.Frames && !object.Values.Vehicle && !object.Aboard && object.Grounded !== false ? library.Feet(made, object.Frames[0]) : [];
			var ahead = object.Turn ? math.Apply(object.Turn, [0, 0, 1]) : [0, 0, 1];
			var flat = Math.hypot(ahead[0], ahead[2]) || 1;
			var reach = (object.Size || 1) * 0.07;
			var code;
			var step;
			var downs;
			var tilts = [0, 0];
			var lowest;

			if (feet.length === 2 && (code = engine.GraphCode('FeetGraph', 'animation/feet'))) {
				downs = feet.map(function (foot) {
					var at = vectors.Add(object.World, math.Apply(base, foot));

					return floorAt(at[0], at[2], object.World[1] + object.Size * 0.5) - object.World[1];
				});

				want = code.Run({}, {DownLeft: downs[0], DownRight: downs[1], Size: object.Size || 1, Speed: Math.abs(walkingOf(object)), Grounded: 1});

				/* Each foot near the ground in its clip turned to the slope of its ground along the way it faces (25 degrees at most). */
				lowest = Math.min(feet[0][1], feet[1][1]);
				tilts = feet.map(function (foot) {
					var at = vectors.Add(object.World, math.Apply(base, foot));
					var top = object.World[1] + object.Size * 0.5;
					var rise = floorAt(at[0] + ahead[0] / flat * reach, at[2] + ahead[2] / flat * reach, top) - floorAt(at[0] - ahead[0] / flat * reach, at[2] - ahead[2] / flat * reach, top);
					var low = 1 - Math.min(1, Math.max(0, (foot[1] - lowest) * (scale[1] || 1) / (object.Size * 0.06)));

					return Math.max(-0.436, Math.min(0.436, Math.atan2(rise, reach * 2))) * low;
				});
			}

			step = Math.min(1, (scene.FrameElapsed || 0) * (Number(want.Rate) || 14));

			kept.Left += ((Number(want.Left) || 0) - kept.Left) * step;
			kept.Right += ((Number(want.Right) || 0) - kept.Right) * step;
			kept.Drop += ((Number(want.Drop) || 0) - kept.Drop) * step;
			kept.TiltLeft = (kept.TiltLeft || 0) + (tilts[0] - (kept.TiltLeft || 0)) * step;
			object.Stairs = feet.length === 2 ? stairsAhead(object, ahead, flat) : 0;
			kept.TiltRight = (kept.TiltRight || 0) + (tilts[1] - (kept.TiltRight || 0)) * step;

			object.FootDrop = Math.abs(kept.Drop) > 1e-5 ? kept.Drop : 0;

			if (Math.abs(kept.Left) < 1e-5 && Math.abs(kept.Right) < 1e-5 && Math.abs(kept.TiltLeft) < 1e-3 && Math.abs(kept.TiltRight) < 1e-3) return;

			object.LayerFrame = object.LayerFrame || [0, 0, 0, 0];
			object.LayerFrame[2] = kept.Left / (scale[1] || 1);
			object.LayerFrame[3] = kept.Right / (scale[1] || 1);

			/* The turns of the feet in the parts of the lines past their whole (the shader reads lines whole): see tiltOf. */
			object.LayerFrame[0] = Math.round(object.LayerFrame[0]) + (Math.abs(kept.TiltLeft) < 1e-3 ? 0 : 0.225 + kept.TiltLeft * 0.45);
			object.Frames = object.Frames.slice();
			object.Frames[1] = Math.round(object.Frames[1]) + (Math.abs(kept.TiltRight) < 1e-3 ? 0 : 0.225 + kept.TiltRight * 0.45);
		}

		/*
		 * Stairs ahead of one that goes: 1 up, -1 down, 0 none. The floor along its way in steps of a fifth of a metre: stairs
		 * where it rises or falls by steps (the floor bends sharply along it), not a slope (it rises evenly).
		 */
		function stairsAhead (object, ahead, flat) {
			var size = (object.Size || 1) / 1.78;
			var top = object.World[1] + object.Size * 0.6;
			var heights = [0, 1, 2, 3, 4, 5].map(function (k) {
				var along = (k * 0.2 - 0.2) * size;

				return floorAt(object.World[0] + ahead[0] / flat * along, object.World[2] + ahead[2] / flat * along, top);
			});
			var sharp = 0;
			var rise = heights[5] - heights[1];
			var k;

			for (k = 1; k < 5; k++)
				sharp = Math.max(sharp, Math.abs(heights[k + 1] - 2 * heights[k] + heights[k - 1]));

			if (!walkingOf(object) && !scene.Ways[object.ID]) return 0;

			if (sharp < 0.06 * size || Math.abs(rise) < 0.08 * size || Math.abs(rise) > 0.8 * size) return 0;

			return rise > 0 ? 1 : -1;
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
			var hole = engine.HoleOf ? engine.HoleOf(object) : null;
			var fade = object.ID === scene.Hero && !object.Values.Vehicle ? scene.HeroFade || 0 : 0;
			/* Drawn apart: cut by a hole (over the ramp of a ship standing), faded (a hero the view is too close to), dissolving. */
			var dissolving = (dissolve ? 'dissolve:' + object.ID + ':' : '') + (hole ? 'hole:' + object.ID + ':' : '') + (fade > 0.01 ? 'fade:' + object.ID + ':' : '');
			var pose;
			var plain;
			var rig;

			if (!made && library.Has(nameOf(object, settings))) return;

			/* A ship seen from its seat (Person first): its hull is round the eye, not drawn over all the view. */
			if (object.ID === scene.Hero && object.Ship && (scene.Inside || 0) > 0.5 && !scene.Ground) return;

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

			if (pose && made.Joints)
				footing(object, made, base, scale);

			var standing = object.FootDrop ? [object.World[0], object.World[1] + object.FootDrop, object.World[2]] : object.World;

			if (object.ID === scene.Hero && scene.Inside > 0.01 && pose && object.Clip && !object.Values.Vehicle) {
				var headBone = library.BoneMatrix(made, 'Head', object.Clip.Name, clipMoment(object.Clip));

				object.Head = headBone ? math.Apply(base, [headBone[12], headBone[13], headBone[14]]) : null;
			}

			if (pose && object.Values.Hold)
				gatherHeld(models, object, made, base);

			if (object.Values.Vehicle && object.Values.Vehicle.Mounts)
				gatherMounts(models, object, base);

			var pieces = joinedOf(object, made);
			var shadow = pieces.Shadow ? shadowNames(pieces.Shadow, (still ? 'still:' : '') + dissolving + made.Key + '/') : null;

			pieces.forEach(function (piece) {
				if (made.Asset) {
					var rest = pose && !piece.Joined ? pose[piece.ID] : piece.Rest;
					var wheel = piece.Joined ? piece.Wheel : object.Wheels ? object.Wheels[piece.ID] : null;
					var shifted = piece.Opening ? engine.OpeningMove(object, piece) : null;
					var whole = shifted ? math.Multiply(base, shifted) : base;
					var lit = piece.Opening ? engine.LampGlow(object, piece) : null;

					/* The glass of a mirror of the car that is driven shows its picture (MirrorKey): its own list, of that car alone. */
					var reflecting = piece.Mirror !== undefined && object.ID === scene.Hero ? 'car:' + object.ID + ':' + piece.Mirror : '';

					batch(models, (still ? 'still:' : '') + dissolving + made.Key + '/' + piece.ID + (reflecting ? '@' + object.ID : ''), piece.Skin !== -1 ? standing : object.World, piece.Skin !== -1 ? whole : math.Multiply(whole, wheel ? math.Multiply(engine.WheelTurn(object, wheel), rest) : rest), color, {Rough: 0, Geometry: piece.Geometry, Still: still, Material: piece.Material, Asset: made.Asset, Skinned: piece.Skin !== -1 ? made : null, Offset: piece.JointOffset, Frames: piece.Skin !== -1 ? object.Frames || [0, 0, 0, 0] : null, Layer: piece.Skin !== -1 ? object.LayerFrame || null : null, Soft: softOf(object, made, piece), Glow: object.Glow && object.Glow.Body ? object.Glow.Color : lit, Lit: !!lit && !(object.Glow && object.Glow.Body), Wet: object.Values.Wet, Drops: object.Values.Drops, MirrorKey: reflecting, Dissolve: dissolve, Hole: hole, Fade: fade, Merged: shadow && !reflecting && shadow.Shadow.IDs.indexOf(piece.ID) >= 0 ? shadow : null});

					return;
				}

				/* A part of a model of shapes moves as its role says, as one of a file does; one of a material is drawn by its pattern (Regression: its material was not given, and it came out plain). */
				var moved = piece.Opening ? engine.OpeningMove(object, piece) : null;
				var placed = moved ? math.Multiply(base, moved) : base;

				batch(models, (still ? 'still:' : '') + dissolving + made.Key + '/' + piece.ID, object.World, pose ? math.Multiply(placed, pose[piece.ID]) : placed, piece.Team ? team : color, {Matte: made.Matte, Rough: made.Matte ? 0.5 : 0.15, Sway: made.Sway, Geometry: piece.Geometry, Material: piece.Material || null, Still: still, Glow: object.Glow && object.Glow.Body ? object.Glow.Color : null, Wet: object.Values.Wet, Drops: object.Values.Drops, Dissolve: dissolve, Hole: hole, Fade: fade});
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
			var resting = !!(made.Baked || made.Baking && made.Baking.Frames.length);
			var whole = true;
			var pieces;
			var kept;

			if (!made.Asset || made.Moves || Object.keys(made.Clips || {}).length || made.Merge === false || object.Values.Merge === false || made.Pieces.length < 2) return made.Pieces;

			made.Joined = made.Joined || {};
			key += resting ? ':rest' : '';

			if (made.Joined[key])
				return made.Joined[key];

			/* Its pieces of a skeleton that never moves where the skeleton stands: they join the others of their material. */
			pieces = made.Pieces.map(function (piece) {
				var still = piece.Skin !== -1 && resting ? unskinned(made, piece) : null;
				if (piece.Skin !== -1 && !still)
					whole = false;

				/* Placed already, as a piece joined is: the pose of its node is in its corners (Regression: placed twice, it flew off). */
				return still ? Object.assign({}, still, {Joined: true, Wheel: wheels[piece.ID] || null}) : piece;
			});

			pieces.forEach(function (piece) {
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

			kept.Shadow = shadowJoined(kept);

			/* Not kept while the skeleton is not there yet: its pieces join when it is. */
			if (whole)
				made.Joined[key] = kept;

			return kept;
		}

		/*
		 * The pieces of a model joined that stand still on it (not a wheel, a side of an opening, a mirror, a piece of a
		 * skeleton), of a material that casts a shadow as it stands (not glass, nothing its Vertex moves), as one shape for the
		 * maps of the shadow: a map draws only the depth, the material is nothing to it. Regression: the still body of a car of
		 * a file was some twenty draws of its materials in each slice of the shadow, more than a hundred a frame.
		 */
		function shadowJoined (pieces) {
			var casting = pieces.filter(function (piece) {
				var material = piece.Material;

				return piece.Joined && piece.Skin === -1 && !piece.Wheel && !piece.Opening && piece.Mirror === undefined && !(material && (material.Vertex || material.Transmission && seeThrough(material)));
			});
			if (casting.length < 2) return null;

			return {IDs: casting.map(function (piece) {
				return piece.ID;
			}), Pieces: casting, Names: {}};
		}

		/* The names of the lists of a model of shapes joined for its shadow, with its prefix (still:, dissolve:): the first leads. */
		function shadowNames (shadow, prefix) {
			if (!shadow.Names[prefix]) {
				shadow.Names[prefix] = {Leader: prefix + shadow.IDs[0], Members: shadow.IDs.map(function (id) {
					return prefix + id;
				}), Shadow: shadow};
			}

			return shadow.Names[prefix];
		}

		/*
		 * A piece of a skeleton that never moves (a model of no clips: the body of a car of a file) as a piece of its own: its
		 * corners where the first frame of the skeleton puts them, as the graphics card would, and no colors of its corners (a
		 * piece of a skeleton is drawn without them: the body of a car came out black). Regression: the body of a car was
		 * some eighty pieces of a skeleton, never joined, each drawn apart in each pass (450 draws a frame at high).
		 */
		function unskinned (made, piece) {
			var frame = made.Baked ? made.Baked.Data : made.Baking.Frames[0];
			var geometry = piece.Geometry;
			var p = geometry.Positions;
			var q = geometry.Normals || [];
			var joints = geometry.Joints;
			var weights = geometry.Weights;
			var positions;
			var normals;
			var i;
			var k;
			var w;
			var at;
			var x;
			var y;
			var z;
			var length;

			gpu.Unskinned = gpu.Unskinned || new WeakMap();

			if (gpu.Unskinned.has(piece))
				return gpu.Unskinned.get(piece);

			if (!frame || !joints || !weights || !joints.length) return null;

			positions = new Float32Array(p.length);
			normals = new Float32Array(p.length);

			for (i = 0; i < p.length / 3; i++) {
				for (k = 0; k < 4; k++) {
					w = weights[i * 4 + k];

					if (!w)
						continue;

					at = (joints[i * 4 + k] + (piece.JointOffset || 0)) * 12;
					x = p[i * 3];
					y = p[i * 3 + 1];
					z = p[i * 3 + 2];

					positions[i * 3] += w * (frame[at] * x + frame[at + 1] * y + frame[at + 2] * z + frame[at + 3]);
					positions[i * 3 + 1] += w * (frame[at + 4] * x + frame[at + 5] * y + frame[at + 6] * z + frame[at + 7]);
					positions[i * 3 + 2] += w * (frame[at + 8] * x + frame[at + 9] * y + frame[at + 10] * z + frame[at + 11]);

					if (q.length) {
						x = q[i * 3];
						y = q[i * 3 + 1];
						z = q[i * 3 + 2];

						normals[i * 3] += w * (frame[at] * x + frame[at + 1] * y + frame[at + 2] * z);
						normals[i * 3 + 1] += w * (frame[at + 4] * x + frame[at + 5] * y + frame[at + 6] * z);
						normals[i * 3 + 2] += w * (frame[at + 8] * x + frame[at + 9] * y + frame[at + 10] * z);
					}
				}

				length = Math.sqrt(normals[i * 3] * normals[i * 3] + normals[i * 3 + 1] * normals[i * 3 + 1] + normals[i * 3 + 2] * normals[i * 3 + 2]) || 1;

				normals[i * 3] /= length;
				normals[i * 3 + 1] /= length;
				normals[i * 3 + 2] /= length;
			}

			gpu.Unskinned.set(piece, Object.assign({}, piece, {Skin: -1, JointOffset: 0, Rest: math.Identity(), Geometry: Object.assign({}, geometry, {Positions: positions, Normals: q.length ? normals : geometry.Normals, Colors: null, Joints: null, Weights: null})}));

			return gpu.Unskinned.get(piece);
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
			var walking = walkingOf(object);
			var pace = object.Pace && made.Clips[object.Pace] ? object.Pace : object.Pace === 'fall' && made.Clips.jump ? 'jump' : 'walk';
			var wanted = way ? 'walk' : walking ? pace : object.Pose && made.Clips[object.Pose] ? object.Pose : object.Loop || object.Values.Clip || settings.Clip || 'idle';
			var clip = made.Clips[wanted];
			var seconds = scene.Seconds;
			var rate = wanted === 'jump' ? 1.8 : wanted === 'fall' ? 1 : wanted === pace && clip && (way || walking) ? (object.Back && !way ? -1 : 1) * (way ? way.Speed : walking) * (clip.Length || 1) / Math.max(0.01, object.Size * (clip.Stride || 1)) : 1;
			var blend = wanted === pace && clip && (way || walking) && /^(walk|jog|run|sprint)$/.test(wanted) && object.Values.Blend !== false ? blendOf(made, object, Math.abs(way ? way.Speed : walking)) : null;

			/* Going: the gait of its speed, the next one blended in (walk, jog, sprint), their steps as one. */
			if (blend) {
				wanted = blend.Main;
				clip = made.Clips[wanted];
				rate = (object.Back && !way ? -1 : 1) * Math.abs(way ? way.Speed : walking) * (clip.Length || 1) / Math.max(0.01, object.Size * blend.Stride);
			}

			/* Up or down stairs ahead (Stairs, of its feet): its gait of stairs, its feet set on the steps by the ground under them. */
			var stairs = object.Stairs > 0 ? 'stairs-up' : object.Stairs < 0 ? 'stairs-down' : '';

			if (stairs && made.Clips[stairs] && (way || walking) && /^(walk|jog|run)$/.test(wanted) && !object.Back) {
				blend = null;
				wanted = stairs;
				clip = made.Clips[wanted];
				rate = Math.abs(way ? way.Speed : walking) * (clip.Length || 1) / Math.max(0.01, object.Size * (clip.Stride || 1));
			}

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
				state = object.Clip = changeClip(made, state, wanted, rate, seconds);

				/* From one of the two it blends to the other: the same pose, no fade. */
				if (blend && state.From && (state.From === blend.Low || state.From === blend.High)) {
					state.From = '';
					state.Fade = 0;
				}
			}

			state.Partner = blend ? blend.Partner : '';
			state.Share = blend ? blend.Share : 0;

			/* Its time adds up by the rate of each moment: a rate that changes goes on from where it was. */
			state.At = (state.At || 0) + (seconds - (state.Seen === undefined ? state.Start : state.Seen)) * rate;
			state.Seen = seconds;
			state.Rate = rate;

			/* A loop starts at a place of its own for each copy: a crowd does not dance as one. */
			state.Phase = clip && clip.Loop ? (object.Seed || 0) * 7.13 % 1 * (clip.Length || 1) : 0;

			/* In time with the step it came from: its moment the same part of its cycle (once, as it begins). */
			if (state.Synced !== undefined && clip) {
				state.At = state.Synced * (clip.Length || 1) - state.Phase;

				delete state.Synced;
			}

			var past = state.FromTime + (seconds - state.Start) * (state.FromRate || 0);

			if (made.Joints) {
				var moment = clipMoment(state);

				/* All its frames made, or those of the clip it plays (Partly: standing and going are made first, then what is played: Want); a clip faded from not made yet: from rest. */
				if (!made.Baked)
					library.Want(made, state.Name);

				object.Frames = library.BakeStep(made, 4) || library.Partly(made, state.Name) ? [library.Frame(made, state.Name, moment), state.From && library.Partly(made, state.From) ? library.Frame(made, state.From, past) : 0, fadeOf(state), library.Between(made, state.Name, moment)] : [0, 0, 0, 0];

				object.LayerFrame = layerOf(object, made, seconds);

				/* No fade on: the second frame is of the gait blended in, at the same part of its cycle. */
				if (state.Partner && state.Share > 0 && !fadeOf(state) && library.Partly(made, state.Partner) && library.Partly(made, state.Name)) {
					var cycle = made.Clips[state.Name].Length || 1;

					object.Frames[1] = library.Frame(made, state.Partner, ((moment % cycle + cycle) % cycle) / cycle * (made.Clips[state.Partner].Length || 1));
					object.Frames[2] = state.Share;
				}
			}

			return library.Pose(made, state.Name, clipMoment(state), {From: state.From, FromTime: past, Fade: 1 - fadeOf(state)});
		}

		/*
		 * The frame of a layer of an object (a clip of the arms over its legs: Layer) and its share, faded in and out ([line,
		 * share, 0, 0]); null with none. It calls back as it ends, as a clip played once does.
		 */
		function layerOf (object, made, seconds) {
			var layer = object.Layer;
			var length;
			var t;
			var share;

			if (!layer)
				return null;

			length = library.Length(made, layer.Name);
			t = seconds - layer.Start;

			if (t >= length) {
				if (layer.Callback)
					window.setTimeout(layer.Callback.bind(null, null, {ID: object.ID, Clip: layer.Name}), 0);

				object.Layer = null;

				return null;
			}

			if (!library.Partly(made, layer.Name)) {
				library.Want(made, layer.Name);

				return null;
			}

			share = Math.min(1, t / 0.12, (length - t) / 0.2);

			return [library.Frame(made, layer.Name, t), share * share * (3 - 2 * share), 0, 0];
		}

		/* How fast an object goes on its feet (metres a second): as it is moved, or on the spot (its value Walking). */
		function walkingOf (object) {
			return object.Walking || Number(object.Values.Walking) || 0;
		}

		/* The second of its clip an object is at. */
		function clipMoment (state) {
			return (state.At || 0) + (state.Phase || 0);
		}

		/* A clip of steps: its feet go on in time with those of another (walk, jog, sprint, back, aside). */
		function stepping (made, name) {
			var clip = made.Clips[name];

			return !!clip && clip.Loop !== false && /^(walk|jog|run|sprint|walk-back|run-back|strafe-(left|right)(-run)?|crouch-walk|stairs-(up|down))$/.test(name);
		}

		/*
		 * How a clip gives way to the next, of the graph of transitions (TransitionGraph of the scene, Graphs['animation/
		 * transition'], Transition of the recipe of the model, else blueprints/animation/transition): {Fade (seconds), Ease
		 * (1: smoothstep), Sync (1: the next goes on from the phase of the last)}. Regression: every change faded evenly in
		 * 0.2 s, and a walk that became a run began its cycle again: its feet jumped.
		 */
		function transitionOf (made, from, to) {
			var own = library.Recipes && library.Recipes[made.Name] ? library.Recipes[made.Name].Transition : null;
			var code;
			var once = function (name) {
				return !!made.Clips[name] && made.Clips[name].Loop === false;
			};

			if (own && !self.GraphOf('TransitionGraph', 'animation/transition')) {
				if (!made.TransitionCode || made.TransitionCode.Given !== own)
					made.TransitionCode = {Given: own, Code: self.$Service('Blueprints').Code(typeof own === 'string' ? (own.charAt(0) === '{' ? JSON.parse(own) : Elemenx.Resources('Blueprints', own)) : JSON.parse(JSON.stringify(own)))};

				code = made.TransitionCode.Code;
			}
			else {
				code = engine.GraphCode('TransitionGraph', 'animation/transition');
			}

			if (!code)
				return {Fade: from ? 0.2 : 0, Ease: 0, Sync: 0};

			return code.Run({}, {FromKnown: from ? 1 : 0, FromGait: stepping(made, from) ? 1 : 0, ToGait: stepping(made, to) ? 1 : 0, FromOnce: once(from) ? 1 : 0, ToOnce: once(to) ? 1 : 0, ToHold: made.Clips[to] && made.Clips[to].Hold ? 1 : 0});
		}

		/* The state of the next clip of an object: faded from the last as its transition says, in time with it when it steps. */
		function changeClip (made, state, wanted, rate, seconds) {
			var from = state ? state.Name : '';
			var turn = transitionOf(made, from, wanted);
			var next = {Name: wanted, Start: seconds, Rate: rate, From: from, FromTime: state ? clipMoment(state) : 0, FromRate: state ? state.Rate : 0, Once: false, Fade: Math.max(0, Number(turn.Fade) || 0), Ease: Number(turn.Ease) || 0};
			var length;

			/* Of the same step: the part of the cycle of the last (its Phase taken off when the next one has its own). */
			if (turn.Sync > 0.5 && state && made.Clips[from] && made.Clips[wanted]) {
				length = made.Clips[from].Length || 1;
				next.Synced = ((clipMoment(state) % length + length) % length) / length;
			}

			return next;
		}

		/*
		 * The gaits of a speed, of the graph of blends (BlendGraph of the scene, Graphs['animation/blend'], else
		 * blueprints/animation/blend; Speed and the speeds of its walk, jog and sprint at their own pace -> Low, High: 0 walk,
		 * 1 jog, 2 sprint; Weight of the high one): {Low, High, Main (the more of the two), Partner (the other, '' with none),
		 * Share (of the partner, 0 to 0.5), Stride (of the two, by the weight)}. Null with only a walk. Regression: one that
		 * went at the speed of a run walked, its legs swinging fast.
		 */
		function blendOf (made, object, speed) {
			var names = ['walk', made.Clips.jog ? 'jog' : 'run', 'sprint'];
			var code = engine.GraphCode('BlendGraph', 'animation/blend');
			var natural = names.map(function (name) {
				var clip = made.Clips[name];

				return clip ? object.Size * (clip.Stride || 1) / (clip.Length || 1) : 0;
			});
			var given;
			var low;
			var high;
			var weight;

			if (!code || !made.Clips.walk || !natural[1]) return null;

			given = code.Run({}, {Speed: speed, Walk: natural[0], Jog: natural[1], Sprint: natural[2]});
			low = names[Math.max(0, Math.min(2, Math.round(given.Low) || 0))];
			high = names[Math.max(0, Math.min(2, Math.round(given.High) || 0))];
			weight = made.Clips[high] ? Math.max(0, Math.min(1, Number(given.Weight) || 0)) : 0;

			return {Low: low, High: high, Main: weight < 0.5 ? low : high, Partner: weight > 0.001 && weight < 0.999 ? (weight < 0.5 ? high : low) : '', Share: Math.min(weight, 1 - weight), Stride: (made.Clips[low].Stride || 1) * (1 - weight) + (made.Clips[high] ? made.Clips[high].Stride || 1 : 1) * weight};
		}

		/* How much of the last clip is still seen (0 to 1) as an object changes to the next one. */
		function fadeOf (state) {
			var s;

			if (!state || !state.From) return 0;

			s = state.Fade > 0 ? Math.max(0, Math.min(1, (scene.Seconds - state.Start) / state.Fade)) : 1;

			return 1 - (state.Ease ? s * s * (3 - 2 * s) : s);
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
			var fade = fadeOf(state);
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

			/* A shell of a shield: a list of its own for each layer, of the same shape, its color, how far it grows, its flash. */
			if (scene.Shelling && models === scene.ShellLists && name.indexOf('shell:') !== 0) {
				var shell = scene.Shelling;

				batch(models, 'shell:' + shell.Key + ':' + name, world, matrix, [1, 1, 1], Object.assign({}, settings, {Glow: null, Still: false, Geometry: settings.Geometry || shapeGeometry(name)}));

				models['shell:' + shell.Key + ':' + name].Shell = shell;

				return;
			}

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
			list.Hole = settings.Hole || null;
			list.Fade = settings.Fade || 0;

			/* Its shadow drawn by the shape of all the still pieces of its model, joined (shadowJoined). */
			list.Merged = settings.Merged || null;

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

			/* A clip of the arms over its legs: its frame and its share (none: 0). */
			if (settings.Frames)
				list.Layers.set(settings.Layer || [0, 0, 0, 0], i);

			list.Count++;
		}

		/* A number told: not empty, not null, a number. */
		function told (value) {
			return value !== undefined && value !== null && value !== '' && !isNaN(Number(value));
		}

		/* The arrays of a list twice as large, kept from frame to frame. */
		function grow (list) {
			var capacity = Math.max(16, list.Capacity * 2);

			['Places', 'X', 'Y', 'Z', 'Tints', 'Frames', 'Layers'].forEach(function (name) {
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
			var set = self.Graphics().Shadow;
			var whole = !near && scene.Ground && scene.Ground.Field.Blocked && set.Whole > 0;
			var side = whole ? set.Whole : set.Side;

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

			/* One map of all, or the map round the hero over the slices: what is sown simpler there (ShadowScatter). */
			scene.ShadowSlice = 'far';

			casters(matrix);

			scene.ShadowSlice = '';

			(nearMap || gpu.ShadowMap).End();

			return {uShadowMap: nearMap || gpu.ShadowMap, uShadowNear: nearMap || gpu.ShadowMap, uShadowRaw: (nearMap || gpu.ShadowMap).Raw, uShadowNearRaw: (nearMap || gpu.ShadowMap).Raw, uShadowSoft: [depth * side * sunWidth / extent, depth * side * sunWidth / extent, self.Graphics().Cascades > 1 ? 1 : 0], uBounce: gpu.NoBounce, uCloudMap: gpu.NoBounce, uBounceOn: 0, uGlow: gpu.NoBounce, uGlowOn: 0, uProbeOn: 0, uProbe: gpu.NoBounce, uLampShadow0: gpu.NoShadow, uLampShadow1: gpu.NoShadow, uShadowMatrix: matrix, uShadowBias: texel * 1.6, uShadowOn: 1, uCascadeOn: 0};
		}

		/*
		 * Four shadows of the sun, each of a slice of the view out to far, farther ones wider, in the quarters of one map.
		 * A slice is held in a ball whose size keeps as the eye turns, its middle kept to whole texels of the world: no edge
		 * crawls. The two nearest are drawn each frame, the third each second, the last each fourth, and at once when the
		 * eye left what they hold; between, what they hold is kept where it was in the world, and only the eye it is seen
		 * from moves (what moves far away casts its shadow a frame or three late).
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

			if (!store || store.Far !== far || store.Depth !== depth || vectors.Distance(store.Sun, direction) > 0.002) {
				store = scene.Cascaded = {Far: far, Depth: depth, Sun: direction.slice(), Frame: 0, Slices: []};
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
				var shift;
				var wide;
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
				center = vectors.Add(scene.Eye, vectors.Scale(forward, middle));

				/*
				 * A slice kept from an earlier frame still holds all of the ball of this one: drawn a little wider than its
				 * ball (a seventh), it is kept while the eye moves or turns within that. Regression: kept at the size of its ball,
				 * the edge of a slice lagged behind a car or a turn, and the shadows came on the things there a few frames late.
				 */
				if (slice && !all && slice.Need === radius && index > 1 && !(index === 2 && store.Frame % 2 === 0 || index === 3 && store.Frame % 4 === 1)) {
					shift = vectors.Subtract(center, slice.Center);

					if (Math.abs(vectors.Dot(shift, x)) + radius > slice.Radius || Math.abs(vectors.Dot(shift, y)) + radius > slice.Radius)
						slice = null;
				}
				else {
					slice = null;
				}

				/* The two nearest each frame: what moves near (the car driven, its shadow far behind it) is never late there. */
				if (!slice) {
					wide = index > 1 ? Math.ceil(radius * 4 * 8 / 7) / 4 : radius;
					texel = wide * 2 / side;
					along = vectors.Dot(center, x);
					across = vectors.Dot(center, y);
					slice = store.Slices[index] = {Need: radius, Radius: wide, Center: vectors.Add(vectors.Add(center, vectors.Scale(x, Math.round(along / texel) * texel - along)), vectors.Scale(y, Math.round(across / texel) * texel - across)), Draw: true};
				}

				radius = slice.Radius;
				texel = radius * 2 / side;

				target = vectors.Subtract(slice.Center, scene.Eye);
				matrix = math.Multiply(math.Orthographic(-radius, radius, -radius, radius, 0, Math.max(depth, radius) * 2), math.LookAt(vectors.Add(target, vectors.Scale(direction, Math.max(depth, radius))), target, up));

				if (slice.Draw) {
					gpu.Cascades.Begin([index % 2 * side, Math.floor(index / 2) * side, side, side]);

					/* The nearest slice its finest; the others what is sown simpler (ShadowScatter of the quality, SceneScatter). */
					scene.ShadowSlice = index === 0 ? 'near' : 'far';

					casters(matrix);

					scene.ShadowSlice = '';

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

				var sees = frustum(shade.uShadowMatrix, 128);

				Object.keys(models).forEach(function (name) {
					if (!models[name].Skinned && seen(models[name], sees))
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
				/* Nothing at all, its alpha too: the use of a square with none (no fields, no houses, no sand). */
				gpu.NoUse = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([0, 0, 0, 0])}, {Nearest: true});
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
			var far;
			var depth;

			/* One simpler shape of a shadow made a frame (shadowShape). */
			gpu.ShadowBudget = 1;
			gpu.VoxelBudget = 1;

			/*
			 * How far back along the sun its views must reach: to the highest of the ground within far of the eye, from a little
			 * under the eye (Top is only the height of the ground of its options: a mountain of a sketch stands far over it).
			 * Regression: the views of the sun stood under the hill over a hall of a cave, it was cut off at their near plane,
			 * and the sun shone on what stood in the hall.
			 */
			function sunReach (nodes, far) {
				var high = -Infinity;

				(nodes || []).forEach(function (node) {
					var half = (node.Size || 0) / 2;
					var dx = Math.max(0, Math.abs(node.Center[0] - scene.Eye[0]) - half);
					var dz = Math.max(0, Math.abs(node.Center[2] - scene.Eye[2]) - half);
					if (node.Span && dx * dx + dz * dz < far * far)
						high = Math.max(high, node.Span[1]);
				});

				return high > -Infinity ? Math.ceil(((high - scene.Eye[1] + 30) / Math.max(scene.Ground.Sun[1], 0.2) + 10) / 50) * 50 : 0;
			}

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
				/* A slice of the shadow is 2048 texels across (4096 for a whole ground): what is less than Tiny of them casts nothing seen. */
				var sees = frustum(matrix, 2048);

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					var merged = list.Merged && mergedShadow(models, list.Merged, name);
					/* The still pieces of a model as one: drawn with the first of them, the others not. */
					if (merged === false || merged && !seen(merged, sees)) return;

					/* Light goes through glass. */
					if (list.Material && list.Material.Transmission && seeThrough(list.Material) || !merged && !seen(list, sees)) return;

					renderer.Draw(merged ? merged.Mesh : shadowShape(name, list), moved(list, list.Skinned ? gpu.SkinDepth : gpu.ManyDepth, 'Depth'), Object.assign({uViewProjection: matrix, uWind: scene.Gust || 0, uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : undefined, uJointOffset: list.Offset}, movedValues(list)), {Cull: 'none'});
				});

				(nodes || []).forEach(function (node) {
					if (nodeSeen(node, sees))
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

				var sees = frustum(matrix, renderer.Width);

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					if (!list.Material || list.Material.Transmission && seeThrough(list.Material) || !seen(list, sees)) return;

					renderer.Draw(shape(name), moved(list, list.Skinned ? gpu.NormalSkin : gpu.NormalMany, 'Normal'), Object.assign({uViewProjection: matrix, uWind: scene.Gust || 0, uOrigin: originOf(list), uPalette: list.Skinned ? palette(list.Skinned) : undefined, uJointOffset: list.Offset}, movedValues(list)), {Cull: 'none', Depth: true, DepthWrite: false});
				});
			};

			/*
			 * box: the slab in the world ([x, y, z, x, y, z]); a square of the ground that does not reach into it is not drawn
			 * for it. Regression: each square near was drawn into each of the 160 slabs, 200 draws more a frame while they were
			 * laid, and the frame took twice as long.
			 */
			scene.Voxels = function (matrix, box) {
				if (!gpu.VoxelLand) {
					gpu.VoxelLand = renderer.Program(shaders.LandVertex, shaders.Voxel);
					gpu.VoxelMany = renderer.Program(shaders.Instanced, shaders.VoxelSurface);
				}

				(nodes || []).forEach(function (node) {
					var half = (node.Size || 0) / 2;

					/* A square far from the eye has nothing in the voxels (some 45 m round it). */
					if (vectors.Distance(node.Center, scene.Eye) > 120) return;

					if (box && node.Size && (node.Center[0] + half < box[0] || node.Center[0] - half > box[3] || node.Center[2] + half < box[2] || node.Center[2] - half > box[5] || node.Span && (node.Span[1] < box[1] || node.Span[0] > box[4]))) return;

					renderer.Draw(node.Mesh, gpu.VoxelLand, {uViewProjection: matrix, uOffset: vectors.Subtract(node.Center, scene.Eye)}, {Cull: 'none', Depth: false, DepthWrite: false});
				});

				var sees = frustum(matrix);

				Object.keys(models).forEach(function (name) {
					var list = models[name];
					if (list.Skinned || !list.Still || list.Material && list.Material.Transmission && seeThrough(list.Material) || !seen(list, sees)) return;

					renderer.Draw(voxelShape(name, list), moved(list, gpu.VoxelMany, 'VoxelSurface'), Object.assign({}, list.Material ? surface(list) : null, {uViewProjection: matrix, uWind: 0, uOrigin: originOf(list), uSurfaceOn: list.Material ? 1 : 0}, movedValues(list)), {Cull: 'none', Depth: false, DepthWrite: false});
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
				far = Math.min(set.ShadowFar || 300, scene.Camera.Far || 5000);
				depth = sunReach(nodes, far);
				/* Four cascades out to its far shadow, but in parallel rays (a view from above: one map). */
				made = set.Cascades >= 4 && !scene.Camera.Ortho ? cascades(ground.Sun, Math.max(60, ground.Field.Top * 2, depth), far, casters) : castShadow(ground.Sun, ground.Target, scene.Eye, extent, Math.max(extent * 2, ground.Field.Top * 4, depth), casters);

				if (set.Cascades > 1 && !made.uCascadeOn) closer(made, ground.Sun, ground.Target, scene.Eye, Math.min(extent * 0.3, 30), Math.max(extent * 2, ground.Field.Top * 4, depth), casters);
				else if (made.uCascadeOn && (aimed = heroShadowed())) closer(made, ground.Sun, aimed.Center, scene.Eye, aimed.Extent, Math.max(60, ground.Field.Top * 2, depth), casters);

				return set.Bounce && !engine.FieldOn() ? bounced(made, nodes, models) : made;
			}

			star = scene.Order.filter(function (object) {
				return trait(object, 'Star') && object.World;
			})[0];

			if (!star || !holder || !holder.World || !trait(holder, 'Model') || vectors.Distance(scene.Eye, holder.World) > holder.Size * 40) return off;

			extent = holder.Size * 3;

			return castShadow(vectors.Normalize(vectors.Subtract(star.World, holder.World)), holder.World, scene.Eye, extent, extent * 3, casters);
		}

		/* One of the many stars of a cluster: its orbit is drawn when it is chosen, else the orbits hide the cluster. */
		function crowded (object, parent) {
			return !!parent && !!trait(parent, 'Cluster') && (scene.Crowds && scene.Crowds[parent.ID] || 0) > 24 && object.ID !== scene.Selected && object.ID !== scene.Focus;
		}

		function line (object, parent, uniforms) {
			return function () {
				var chosen = object.ID === scene.Selected || object.ID === scene.Focus;

				drawReady(orbitLine(object), gpu.Line, uniforms({uOffset: local(parent ? parent.World : [0, 0, 0]), uBody: local(object.World).concat([object.Size]), uColor: chosen ? scene.Colors.Selection.slice(0, 3).concat([0.75]) : scene.Colors.Orbit}), {Blend: 'alpha', DepthWrite: false, Cull: 'none'});
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
					if (engine.MarkDrop)
						engine.MarkDrop('label:' + id);

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

		/*
		 * The names are marks (SceneMarks): each frame the dozen of the many stars of a cluster nearest the eye (and the one
		 * chosen) are named, the others hid all; whether the eye is in the rooms of a ship. Then the marks are laid out.
		 */
		function moveLabels () {
			var camera = scene.Camera;

			labelFrame.Walled = !!scene.Eye && !!engine.InsideOf && !!engine.InsideOf(scene.Eye);
			labelFrame.Named = {};

			/* A name a mark once the marks are there (they start after the first objects may be named). */
			Object.keys(scene.Labels).forEach(function (id) {
				if (scene.Labels[id].ElemenxMarked || !engine.MarkSet) return;

				scene.Labels[id].ElemenxMarked = true;

				engine.MarkSet('label:' + id, {Element: scene.Labels[id], At: labelPoint(id), Occlude: false, Shown: labelShown(id), Priority: labelPriority(id)});
			});

			scene.Roots.filter(function (object) {
				return object.World && crowded(object, parentOf(object));
			}).sort(function (a, b) {
				return vectors.Distance(camera.Position, a.World) - vectors.Distance(camera.Position, b.World);
			}).slice(0, 12).forEach(function (object) {
				labelFrame.Named[object.ID] = true;
			});

			if (engine.MarksMove)
				engine.MarksMove();
		}

		/* Where the name of an object stands: under a body in space, over the head of a thing that stands on a ground. */
		function labelPoint (id) {
			return function () {
				var object = scene.Objects[id];

				return object && object.World ? vectors.Add(object.World, [0, scene.Ground ? object.Size * 1.15 : -object.Size * 1.05, 0]) : null;
			};
		}

		/* Whether the name of an object is shown this frame (its place on the screen is of the marks). */
		function labelShown (id) {
			return function (mark) {
				var object = scene.Objects[id];
				var parent = object ? parentOf(object) : null;
				var star = parent && trait(parent, 'Star') ? parentOf(parent) : null;
				var near;

				mark.Align = scene.Ground ? 'bottom' : 'top';
				mark.Shift = scene.Ground ? [0, 0] : [0, 4];

				if (!object || !object.World || !self.Labels || self.Labels === 'false' || labels.hidden) return false;

				if (parent && crowded(object, parent) && !labelFrame.Named[object.ID]) return false;

				near = vectors.Distance(scene.Camera.Position, object.World);

				/* What goes round a star of a cluster, named near it only, as a moon is. */
				if (parent && (!trait(parent, 'Star') || star && crowded(parent, star)) && object.ID !== scene.Selected && object.ID !== scene.Focus && near >= Math.max(vectors.Length(object.Relative || [0, 0, 0]), parent.Size * 3) * 14) return false;

				/*
				 * What is not drawn is not named, nor what is outside the rooms of a ship the eye is in (SceneAboard). Regression: the
				 * name of a hero sitting in a ship stood over its hull; the names of the planets stood on the walls of its rooms.
				 */
				return !object.Hidden && !hidden(object, parent) && !hidden(object, scene.Focus ? scene.Objects[scene.Focus] : null) && !(labelFrame.Walled && !object.Values.Aboard && object.ID !== scene.Hero);
			};
		}

		/* The chosen first, then what is in focus: they keep their places when the names crowd. */
		function labelPriority (id) {
			return function () {
				return id === scene.Selected ? 2 : id === scene.Focus ? 1 : 0;
			};
		}

		/*
		 * The ground of the setting terrain: the object of a Terrain trait is a flat map of noise (the Terrain Service) of its World
		 * drawn in squares, the finer the nearer; its water a plane, its sky of its sun (an object of a Sun trait). The
		 * other objects stand on it at X and Y (across and down the map); a Walker walks a way round
		 * the slopes, the sea and the things that block it. The view goes round a point of the ground.
		 */
		/*
		 * What the World of a ground makes (SceneWorld.Make), made again only when its graph is another; the graphs of its own
		 * (Graphs of its trait: {'sketch/<type>', 'carve/<type>': a graph}, as a world gives them) go with its ground.
		 */
		function worldOf (object) {
			var graph = trait(object, 'Terrain').World || null;
			var graphs = trait(object, 'Terrain').Graphs || null;

			if (object.WorldGraph !== graph || object.WorldGraphs !== graphs || !object.WorldMade) {
				object.WorldGraph = graph;
				object.WorldGraphs = graphs;
				object.WorldMade = self.$Service('SceneWorld').Make(graph);

				if (graphs && object.WorldMade.Ground)
					object.WorldMade = Object.assign({}, object.WorldMade, {Ground: Object.assign({}, object.WorldMade.Ground, {Graphs: graphs})});
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
			var lit;
			var day;
			var night;
			var moon;
			var glow;
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
				var options = site ? null : Object.assign({}, settings, sketch ? {Sketch: sketch} : {}, {Compute: self.Compute || 'auto'});
				var ahead = options && scene.Prefetch && scene.Prefetch.Text === JSON.stringify(options) ? scene.Prefetch : null;

				scene.Prefetch = null;
				scene.Ground = {Shape: key, Key: key + sketched + (scene.Digs.length ? '#dug' + scene.Digs.length : ''), Sketched: sketched, Dug: scene.Digs.length, CarvesOf: carvesOf, ID: object ? object.ID : '', Field: site ? locationField(site) : ahead ? ahead.Field : terrain.Flat(options), Nodes: {}, Frame: 0, Keys: {}, Prefetched: ahead ? ahead.Pieces : null};

				tellGround(scene.Ground, !!site);
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
			scene.Ground.SunColor = sunThrough(paint(sun ? trait(sun, 'Sun').Color : '#fff4e0').slice(0, 3), Math.sin(elevation));

			/*
			 * The air of the body the location lies on (airAround, of its envelope at its ground): its light taken and tinted, its
			 * sky of the colour of its air, its decks that hide the sky an overcast; on the Earth none of that changes a thing.
			 */
			var body = scene.Location ? scene.Objects[scene.Location.Body] : null;
			var aired = body && body.Look ? airAround(body, 0) : null;

			scene.Ground.Aired = aired;
			/* Its air lit by its light as it gets there: of the colour that light is (Tint: none on the Earth). */
			scene.Ground.AirColor = aired ? airColorOf(body).map(function (value, index) {
				return index < 3 ? value * aired.Tint[index] : value;
			}) : groundAir({});

			if (aired) {
				scene.Ground.SunColor = scene.Ground.SunColor.map(function (value, index) {
					return value * aired.Dim * aired.Tint[index];
				});

				/* Decks that hide the sky an overcast; no air, none of any weather (no clouds, no wind). Regression: clouds over the Moon. */
				if (aired.Cover > 0.85) self.Weather = 'overcast';
				else if (!scene.Ground.AirColor[3]) self.Weather = 'none';
			}

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
			lit = skyOf(Math.sin(elevation), solar, (sun ? number(trait(sun, 'Sun').NightLight, 1) : 1) * 0.42 + glow * 0.5);
			day = lit.Day;
			scene.Ground.SkyLight = lit.Sky.map(function (value, index) {
				return value * paint(sun ? trait(sun, 'Sun').Shade || '#ffffff' : '#ffffff')[index];
			});
			scene.Ground.FloorLight = lit.Floor;

			if (aired) {
				scene.Ground.SkyLight = scene.Ground.SkyLight.map(function (value, index) {
					return value * aired.Dim * aired.Tint[index];
				});
				scene.Ground.FloorLight = scene.Ground.FloorLight.map(function (value, index) {
					return value * aired.Dim * aired.Tint[index];
				});
			}

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

			/* No air: the stars by day too, as in space; decks that hide the sky: none at night either. */
			if (aired)
				scene.Ground.StarLimit = scene.Ground.StarLimit * (1 - aired.High) + aired.Cover * 2;

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
			scene.Ground.AirTint = scene.Ground.AirColor.map(function (value, index) {
				var grey = [0.64, 0.65, 0.68, 0.95][index];

				/* Under thick air (airAround Diffuse) the grey of its clouds of the colour of its air. */
				if (aired && index < 3)
					grey += (value * 0.8 - grey) * aired.Diffuse;

				return value + (grey - value) * Math.min(1, air.Clouds * air.Clouds * 1.1 + air.Fog * 0.7);
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

			ground.Field = terrain.Flat(Object.assign({}, settings, sketch ? {Sketch: sketch} : {}, {Compute: self.Compute || 'auto'}));
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

				/* Whether it touches the volume, asked of the new field again. */
				delete node.Volumed;
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
				asked(name);

				library.Load(name, function (error) {
					if (error)
						scene.Broken[name] = true;
				});
			}

			return false;
		}

		/*
		 * A ground came (ground: {Key, ID, Location}), its field made: told after the frame it came in, while it is still the
		 * ground of the scene. Regression: the demos asked for it again and again on a timer.
		 */
		function tellGround (ground, location) {
			view.setTimeout(function () {
				if (scene.Ground === ground && element.isConnected)
					self.$Emit('ground', {Key: ground.Shape, ID: ground.ID, Location: location});
			}, 0);
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

			/* The inside of a ship (SceneAboard) goes with it. Regression: stood once in a location of a system, it was not drawn. */
			if (object.Values.Aboard) return false;

			/* What has parts that move by their roles (a door, a lamp) is drawn as it stands each frame. */
			if (engine.RigOf && engine.RigOf(object)) return false;

			made = modelOf(object, settings);

			return !made || !Object.keys(made.Clips).length;
		}

		/* Which objects move, after the scene changed: the others stand once. */
		function settle () {
			/*
			 * The roles of the parts of the models change what moves too. Regression: the key was one text of all of them, the
			 * key of the ground among them (its sketch: a megabyte and more), made and compared each frame: milliseconds a
			 * frame for nothing. Each part is compared as it is.
			 */
			var key = [scene.Version, scene.Ground ? scene.Ground.Key : '', engine.RigsVersion ? engine.RigsVersion() : '', scene.Location ? scene.Location.ID : ''];
			if (scene.Settled && key.every(function (part, index) {
				return scene.Settled[index] === part;
			})) return;

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

			/*
			 * A ship in the air of the location or down in it (its pilot out of it, walking in it), the inside of a ship (SceneAboard):
			 * of the location, not of space. Regression: a ship coming down with its pilot on foot in it was away, not drawn.
			 */
			if (object.Flying && scene.Location || object.Values.Aboard) return false;

			/* What was added in the location, of its ground. */
			if (scene.Location && object.Parent === scene.Location.Ground) return false;

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

			var patrol = object.Values.Patrol;

			/*
			 * Patrol: a walker goes round its points ([x, z] or [x, z, y]: y the floor, in a cave) one after another for good,
			 * each by its way over and under the ground; one it finds no way to is left for the next, tried again 10 s on.
			 */
			if (Array.isArray(patrol) && patrol.length > 1 && !scene.Ways[object.ID] && object.World && trait(object, 'Walker') && scene.Hero !== object.ID && !(scene.Seconds < (object.PatrolNext || 0))) {
				object.PatrolAt = ((object.PatrolAt === undefined ? -1 : object.PatrolAt) + 1) % patrol.length;

				if (!walk(object.ID, patrol[object.PatrolAt].map(Number)))
					object.PatrolNext = scene.Seconds + 10;
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
				var deck;

				object.World = [x, Math.max(0, field.Height(x, z, object.World ? object.World[1] - (object.Lifted || 0) : object.Values.Z === undefined ? undefined : number(object.Values.Z, 0))), z];

				/*
				 * A walker on a bridge stands on its deck, not on the bed of the river under it: where a deck is over the ground it
				 * is the floor, as its ways go (they come onto it at its ends only).
				 */
				if (engine.SurfaceAt && trait(object, 'Walker')) {
					deck = deckAt(field, x, z);

					if (deck !== null && deck > object.World[1])
						object.World[1] = deck;
				}

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

		/*
		 * The deck of a road over the ground at x, z (a bridge: SurfaceAt of SceneRoadNetwork), or null: none, or one under the
		 * ground (a tunnel). Asked of each point a way is looked for over: off the boxes round the roads at once.
		 */
		function deckAt (field, x, z) {
			var roads = engine.Roads ? engine.Roads() : null;
			var boxes;
			var on;

			if (!roads || !roads.length || !engine.SurfaceAt) return null;

			if (!scene.DeckBoxes || scene.DeckBoxes.Roads !== roads) {
				scene.DeckBoxes = {Roads: roads, Boxes: roads.map(function (road) {
					var half = (road.Width || 0) / 2 + 1;

					return (road.Points || []).reduce(function (box, point) {
						return [Math.min(box[0], point.X - half), Math.min(box[1], point.Z - half), Math.max(box[2], point.X + half), Math.max(box[3], point.Z + half)];
					}, [Infinity, Infinity, -Infinity, -Infinity]);
				})};
			}

			boxes = scene.DeckBoxes.Boxes;

			if (!boxes.some(function (box) {
				return x >= box[0] && x <= box[2] && z >= box[1] && z <= box[3];
			})) return null;

			on = engine.SurfaceAt(x, z);

			if (!on || !on.Road || on.Height < field.Height(x, z) - 0.3) return null;

			return on.Height;
		}

		/*
		 * The way found last, for a walker of the same group: one setting off within 8 m of where it set off, to within 8 m of
		 * where it went, a moment after, goes by its points between, if the lines to the first of them and from the last can be
		 * walked; null else. Not under the ground (floors over each other). Regression: each unit of a group sent over a river
		 * looked for the same way, a tenth of a second each.
		 */
		function sharedWay (field, from, to, rules, roads) {
			var last = scene.WayShared;
			var middle;
			var made;

			if (!last || field.Volume || to.Y !== undefined || last.Ground !== scene.Ground || last.Roads !== roads || Math.abs(scene.Seconds - last.Seconds) > 1) return null;
			if (Math.hypot(from.X - last.From.X, from.Z - last.From.Z) > 8 || Math.hypot(to.X - last.To.X, to.Z - last.To.Z) > 8) return null;

			middle = last.Points.slice(1, -1);
			made = [{X: from.X, Z: from.Z}].concat(middle, [{X: to.X, Z: to.Z}]);

			/* Over the ground, or a deck, as Way of the Terrain goes: no steeper step than a metre a metre and a half. */
			function clear (a, b) {
				var count = Math.max(1, Math.ceil(Math.hypot(b.X - a.X, b.Z - a.Z) / 0.5));
				var floor = function (x, z) {
					var deck = rules.Over(x, z);

					return deck === null ? Math.max(0, field.Height(x, z)) : deck;
				};
				var before = floor(a.X, a.Z);
				var at;

				for (at = 1; at <= count; at++) {
					var x = a.X + (b.X - a.X) * at / count;
					var z = a.Z + (b.Z - a.Z) * at / count;
					var here = floor(x, z);
					if (!field.Walkable(x, z, rules) || Math.abs(here - before) > 0.75) return false;

					before = here;
				}

				return true;
			}

			if (!clear(made[0], made[1]) || made.length > 2 && !clear(made[made.length - 2], made[made.length - 1])) return null;

			return made.map(function (point) {
				var deck = rules.Over(point.X, point.Z);

				return {X: point.X, Y: point.Y !== undefined ? point.Y : deck === null ? Math.max(0, field.Height(point.X, point.Z)) : deck, Z: point.Z};
			});
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
			var failed;
			var roads;
			var rules;
			var from;
			var i;

			if (!object || !walker || !field || !object.World) return false;

			/*
			 * Where no way was found a moment ago (from near here to near there, 5 s), none is looked for again. Regression: each
			 * unit of a group sent over a river, and each attacking one every second, looked for it over all the map. Of the same
			 * ground and the same roads only: a bridge made since is walked at once.
			 */
			failed = 'way:' + Math.round(object.World[0] / 16) + ':' + Math.round(object.World[2] / 16) + ':' + Math.round(target.X / 8) + ':' + Math.round(target.Z / 8) + ':' + (target.Y === undefined ? '' : Math.round(target.Y / 4));
			roads = engine.Roads ? engine.Roads() : null;

			if (!scene.WayFails || scene.WayFails.Ground !== scene.Ground || scene.WayFails.Roads !== roads)
				scene.WayFails = {Ground: scene.Ground, Roads: roads};

			if (scene.WayFails[failed] !== undefined && scene.Seconds - scene.WayFails[failed] < 5) return false;

			/*
			 * Its grid as fine as the way is short, a fiftieth of it (0.75 m at least, a 160th of the ground at most). Regression:
			 * of the ground alone, on one of 3 km a cell was 19 m, no way into a cave of 5 m was ever found, and looking for it
			 * over all the map held the page.
			 */
			from = {X: object.World[0], Z: object.World[2], Y: object.World[1] - (object.Lifted || 0)};
			rules = {MaxSlope: number(walker.MaxSlope, 0.45), Step: Math.max(0.75, Math.min(field.Size / 160, Math.hypot(target.X - object.World[0], target.Z - object.World[2]) / 50)), Blocked: function (x, z) {
				return blocked(x, z, object);
			}, Over: function (x, z) {
				return deckAt(field, x, z);
			}};
			points = sharedWay(field, from, target, rules, roads) || field.Path(from, target, rules);

			if (!points) {
				scene.WayFails[failed] = scene.Seconds;

				return false;
			}

			if (!field.Volume)
				scene.WayShared = {Ground: scene.Ground, Roads: roads, Seconds: scene.Seconds, From: from, To: target, Points: points};

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
				return (!field.CanStep || field.CanStep(at, on, y)) && !(engine.PipeBlocks && engine.PipeBlocks(at, on, y, hero.Size * 0.15, [hero.Size * 0.3, hero.Size * 0.7])) && !(engine.InteriorBlocks && engine.InteriorBlocks(at, on, y));
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

			var floor = Math.max(0, field.Height(x, z, y), engine.PipeFloor ? engine.PipeFloor(x, z, y) : -Infinity, engine.InteriorFloor ? engine.InteriorFloor(x, z, y) : -Infinity);

			if (keys.Space && landed)
				rise = hero.Size * 3;

			y += rise * elapsed;
			rise -= 18 * elapsed;

			/* A step up comes smoothly; a small one down too, and a seam of a map is no fall. Down from higher, it falls. */
			if (rise <= 0 && (y <= floor + 0.02 || landed && !keys.Space && y - floor < hero.Size * 0.3)) {
				/* Down from a fall, not a jump: the knees take it (land). */
				if (!hero.Grounded && (hero.Hang || 0) > 0.75)
					engine.Play(hero.ID, 'land');

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
				hero.Pace = hero.Hang > 0.75 && hero.Rise <= 0 ? 'fall' : 'jump';
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
			var fixed = ['', 'spring', 'summer', 'autumn', 'winter'].indexOf(String(self.Season || '').toLowerCase());
			var latitude = sun ? number(sun.Latitude, null) : null;
			/* Of the graph blueprints/weather/season (SeasonGraph of the scene: one of its own). Regression: in the code alone. */
			var made = seasonCode().Run({}, {
				Fixed: fixed > 0 ? fixed : 0,
				HasLatitude: latitude === null ? 0 : 1,
				Latitude: latitude === null ? 0 : latitude,
				YearDays: sun ? Math.max(1, number(sun.YearDays, 365)) : 365,
				DayOfYear: sun ? number(sun.DayOfYear, 172) : 172
			});

			return {Warmth: made.Warmth, Rising: made.Rising > 0.5, Bare: made.Bare, Turn: made.Turn, Blossom: made.Blossom, Dry: made.Dry, Snow: made.Snow};
		};

		/* The code of the graph of the season (SeasonGraph of the scene, else blueprints/weather/season), made once a graph. */
		function seasonCode () {
			return engine.GraphCode('SeasonGraph', 'weather/season');
		}

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
			cache[base] = !info || info.Type !== 'plant' ? 0 : new RegExp((Elemenx.Resources('Data', 'ElemenxGraphics/flora/seasons') || {}).Evergreen || '^$', 'i').test(base) ? 2 : 1;

			return cache[base];
		};

		/* The uniforms of a list dissolving (Teleport): how far, the foot and the height of the body, its color; its hole, its fade. */
		engine.DissolveValues = function (list) {
			var given = list && list.Dissolve;

			var hole = list && list.Hole;
			var values = given ? {uDissolve: [given.Amount, given.Base - (scene.Eye ? scene.Eye[1] : 0), given.Height, given.Seed || 0], uDissolveColor: given.Color || [0.6, 0.85, 1]} : {uDissolve: [0, 0, 1, 0], uDissolveColor: [0, 0, 0]};

			/* A hole cut in it (HoleOf: over the ramp of a ship standing), how far it fades (a hero the view is too close to). */
			values.uHoleAt = hole ? local(hole.At).concat([hole.Yaw]) : [0, 0, 0, 0];
			values.uHoleHalf = hole ? hole.Half.concat([1]) : [0, 0, 0, 0];
			/* Its box turned as the hull lies (Turn, of the scene into the box: a ship in flight lies any way), else by its Yaw. */
			values.uHoleTurn = hole && hole.Turn ? hole.Turn : hole ? [Math.cos(hole.Yaw), 0, Math.sin(hole.Yaw), 0, 1, 0, -Math.sin(hole.Yaw), 0, Math.cos(hole.Yaw)] : [1, 0, 0, 0, 1, 0, 0, 0, 1];
			values.uHeroFade = list && list.Fade || 0;

			return values;
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
		/* The walk and its view as they go on a ground, for a walk elsewhere (SceneAboard: on foot in a ship in flight). */
		engine.Leaning = leaning;
		engine.FaceView = faceView;
		engine.TurnKeys = turnKeys;
		engine.EasePerson = easePerson;

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

			/*
			 * Its point: the one a viewpoint set before the ground came held, else its middle. Regression: a viewpoint set as
			 * the scene was ready (its ground not made yet) went to the middle of the ground when it came.
			 */
			if (!ground.Target && scene.ViewHeld) {
				ground.Target = scene.Target.slice();
				ground.Held = true;
			}

			if (!ground.Target)
				ground.Target = [0, Math.max(0, field.Height(0, 0)), 0];

			scene.ViewHeld = false;

			/* With a hero the keys walk it, and the view goes after it. */
			if (scene.Hero && scene.Objects[scene.Hero]) {
				/* In a seat that drives nothing (a console): it sits; G stands it up. */
				if (scene.Objects[scene.Hero].Aboard) {
					keys = {Pad: keys.Pad};
				}
				else if (!engine.VehicleStep(scene.Objects[scene.Hero], keys, elapsed)) {
					/* Getting in or out step by step (SceneVehicles boarding): its steps walk it, not the keys. */
					if (!scene.Objects[scene.Hero].Boarding)
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
			if (scene.Hero && focus && scene.Pitch < 0 && inside < 0.5 && !scene.Tactic)
				/* Regression: a hero come up at once far over the point the view goes round made it the arcsine of less than -1: NaN. */
				lowest = Math.asin(Math.max(-0.9, Math.min(0.9, (ground.Target[1] - focus.World[1] - 0.15) / Math.max(0.1, away))));

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

			/*
			 * Behind a hero (or the vehicle it drives) what is solid comes before the eye (a wall, a collider, the hull and the
			 * walls and ceilings of a ship standing): it stays on the near side of it. Regression: only the walls of a location
			 * held it, and the view went through the hull of a ship, out of its rooms.
			 */
			if (scene.Hero && focus && focus.World)
				camera.Position = clearView(field, ground.Target, camera.Position, elapsed, focus.Values.Vehicle ? focus.ID : '');

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

				/* Its eyes before a wall come back toward its neck: the view never looks out of a wall it stands at. */
				eyes = vectors.Lerp(neck, eyes, freeWay(field, neck, eyes, 0.12, '') / Math.max(1e-6, vectors.Distance(neck, eyes)));

				scene.CutAt = vectors.Add(neck, [0, focus.Size * 0.05, 0]);
				camera.Position = vectors.Lerp(camera.Position, eyes, inside);
				camera.Target = vectors.Lerp(camera.Target, vectors.Add(eyes, vectors.Scale(ahead, 10)), inside);
			}

			deskView(focus, camera, elapsed);

			/* In a mode of its seat (SceneTactics: a turret, the view round its vehicle) the mode has the view. */
			if (scene.Tactic && engine.TacticView)
				engine.TacticView(focus, camera, elapsed);

			/* A walker the view comes too close to (a wall behind it, a ceiling over it) fades, gone at a third of a metre. */
			scene.HeroFade = scene.Hero && focus && !focus.Values.Vehicle && inside < 0.5 ? Math.max(0, Math.min(1, (focus.Size * 0.5 - vectors.Distance(camera.Position, ground.Target)) / (focus.Size * 0.3))) : 0;

			/* What shakes the hero (a blast near, its engine, the road under it): a turn of the view round the eye (engine.Trauma). */
			var shaken = scene.Hero ? engine.Trauma(focus, elapsed) : null;

			if (shaken) {
				var sight = vectors.Subtract(camera.Target, camera.Position);
				var side = vectors.Normalize(vectors.Cross(sight, [0, 1, 0]));

				sight = math.Apply(math.Multiply(math.Rotation([0, 1, 0], shaken.Yaw), math.Rotation(side, shaken.Pitch)), sight);
				camera.Target = vectors.Add(camera.Position, sight);
				camera.Up = math.Apply(math.Rotation(vectors.Normalize(sight), shaken.Roll), [0, 1, 0]);
			}

			scene.Eye = camera.Position.slice();
			scene.Target = ground.Target.slice();
			camera.Near = Math.max(0.05, scene.Distance * 0.01);
			camera.Far = field.Size * 3 + scene.Distance * 4;

			/*
			 * The view of a mode round a vehicle (SceneTactics) sees as far as it stands off and past. Regression: the far plane was
			 * of the distance of the hero, nearer than the eye of the radar over the ship, and nothing was drawn.
			 */
			if (scene.Tactic && scene.Tactic !== 'turret' && scene.TacticReach)
				camera.Far = Math.max(camera.Far, scene.TacticReach * 4 + field.Size);
		}

		/*
		 * At a console of a ship standing (SceneAboard): the eyes of who sits there, on the screen of the console, in a third of a
		 * second. The pointer is given back (its screen is pressed as the page is); a drag looks round, as far as a head turns.
		 */
		function deskView (focus, camera, elapsed) {
			var desk = focus && focus.Aboard && !scene.Tactic && engine.ConsoleView ? engine.ConsoleView(focus) : null;
			var key = desk ? focus.Aboard.Vehicle + ':' + focus.Aboard.Seat : '';
			var way;
			var turn;
			var ahead;

			scene.Desk = (scene.Desk || 0) + ((desk ? 1 : 0) - (scene.Desk || 0)) * (1 - Math.exp(-elapsed * 10));

			if (!desk) {
				scene.DeskOf = '';

				return;
			}

			way = vectors.Normalize(vectors.Subtract(desk.Screen, desk.Eye));

			/* Sat down: it looks at the screen, the mouse its own. */
			if (scene.DeskOf !== key) {
				scene.DeskOf = key;
				scene.DeskYaw = Math.atan2(-way[0], -way[2]);
				scene.Yaw = scene.DeskYaw;
				scene.Pitch = Math.asin(-way[1]);

				/* From a view far off (sat down at once): there at once, not through the walls between. */
				if (vectors.Distance(camera.Position, desk.Eye) > 6)
					scene.Desk = 1;

				if (self.Captured() && document.exitPointerLock)
					document.exitPointerLock();
			}

			turn = Math.atan2(Math.sin(scene.Yaw - scene.DeskYaw), Math.cos(scene.Yaw - scene.DeskYaw));
			scene.Yaw = scene.DeskYaw + Math.max(-1.4, Math.min(1.4, turn));
			scene.Pitch = Math.max(-0.9, Math.min(1, scene.Pitch));
			ahead = [-Math.sin(scene.Yaw) * Math.cos(scene.Pitch), -Math.sin(scene.Pitch), -Math.cos(scene.Yaw) * Math.cos(scene.Pitch)];

			camera.Position = vectors.Lerp(camera.Position, desk.Eye, scene.Desk);
			camera.Target = vectors.Lerp(camera.Target, vectors.Add(desk.Eye, vectors.Scale(ahead, 10)), scene.Desk);
		}

		/*
		 * Whether a ball of the view (radius metres round a point) is in what is solid: a wall of a location (a ray along the
		 * ground is measured from the ground under it, which is no wall), a collider, the hull, walls and ceilings of a ship
		 * standing (but the one of except: the vehicle the view goes round; round a vehicle the walls of a location hold it not: its
		 * view would shake along a barrier).
		 */
		function viewSolid (field, at, radius, except) {
			if (!except && field.Blocked && field.Blocked(at[0], at[2], Math.max(at[1] - 1, field.Height(at[0], at[2], at[1] + 1) + 0.1))) return true;

			if (engine.ColliderHit && engine.ColliderHit(at[0], at[2], at[1], radius)) return true;

			return !!(engine.InteriorSolid && engine.InteriorSolid(at, radius, except));
		}

		/* How far a ball of the view goes from a point toward another before it meets what is solid (all the way: their distance). */
		function freeWay (field, from, to, radius, except) {
			var far = vectors.Distance(from, to);
			var steps = Math.ceil(far / 0.15);
			var i;

			for (i = 1; i <= steps; i++) {
				if (viewSolid(field, vectors.Lerp(from, to, i / steps), radius, except)) {
					var near = (i - 1) / steps;
					var past = i / steps;

					/* Its face is found to a hair: steps of the ray would show as jumps of the eye along a wall. */
					for (var halves = 0; halves < 5; halves++) {
						if (viewSolid(field, vectors.Lerp(from, to, (near + past) / 2), radius, except)) past = (near + past) / 2;
						else near = (near + past) / 2;
					}

					return near * far;
				}
			}

			return far;
		}

		/*
		 * The eye on the near side of what is solid between it and what it follows: a ball as wide as what its near plane
		 * shows, so that no wall is cut by it. It comes in at once (never through a wall for a frame), and goes out slowly: no
		 * flicker on the edge of one.
		 */
		function clearView (field, from, to, elapsed, except) {
			var far = vectors.Distance(from, to);
			var free = Math.max(0.1, freeWay(field, from, to, 0.22, except));

			scene.Clear = scene.Clear === undefined || free < scene.Clear ? free : scene.Clear + (free - scene.Clear) * (1 - Math.exp(-elapsed * 2.5));

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
			var cache = self.$Service('SceneCache');
			var kept = self.CacheSize !== 0 && self.CacheSize !== '0' ? pieceKey(field, roads, shape, args) : null;

			if (asked[key]) return;

			asked[key] = token;

			function given (piece) {
				if (scene.Gone || asked[key] !== token) return false;

				delete asked[key];

				if (field.Roads !== roads || owner.Field !== field || owner !== scene.Ground && owner !== scene.Surface && owner !== scene.Horizon && !(owner.Globe && scene.Globes[owner.ID] === owner)) return false;

				made(piece);

				return true;
			}

			function work () {
				var pool = self.$Service('SceneTerrainGenerator').Work();

				pool.Run('SceneTerrainGenerator', 'Piece', [shape, shared(pool, field.Options), roads ? shared(pool, roads) : null, args], function (error, piece) {
					if (given(error ? null : piece) && piece && kept)
						cache.Put('ground', kept, piece);
				});
			}

			var hot = kept ? cache.Peek('ground', kept) : undefined;

			/* Made lately in this page (SceneCache.Peek): in this very frame. */
			if (hot) {
				scene.PiecesCached = (scene.PiecesCached || 0) + 1;

				given(hot);

				return;
			}

			/* Not kept in the browser: made at once, no wait for the database. */
			if (!kept || !cache.Knows('ground', kept)) {
				work();

				return;
			}

			/* Made on a visit before (SceneCache): read, no worker; else made, and kept for the next. */
			cache.Get('ground', kept, function (error, piece) {
				if (scene.Gone || asked[key] !== token) return;

				if (piece) {
					scene.PiecesCached = (scene.PiecesCached || 0) + 1;

					given(piece);

					return;
				}

				work();
			});
		}

		/*
		 * What a pool of workers keeps of a large thing of a field (its options, its roads), sent to each of its workers once:
		 * its name, to send in its place. With no workers, the thing itself.
		 */
		function shared (pool, data) {
			var name;

			if (pool.Inline() || !data || typeof data !== 'object') return data;

			/* The code and the wasm of the heights of a ground (ReliefKey, ReliefWasm of its options) go with them, once. */
			self.$Service('SceneTerrainGenerator').ShareGround(pool, data);

			gpu.SharedNames = gpu.SharedNames || new WeakMap();
			name = gpu.SharedNames.get(data);

			if (!name) {
				name = 'scene-shared:' + Math.random().toString(36).slice(2) + ':' + (gpu.SharedCount = (gpu.SharedCount || 0) + 1);

				gpu.SharedNames.set(data, name);

				pool.Share(name, data);
			}

			return name;
		}

		/* A number of a text (FNV-1a). */
		function digestOf (text, seed) {
			var value = seed === undefined ? 2166136261 : seed;
			var i;

			for (i = 0; i < text.length; i++)
				value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0;

			return value;
		}

		/*
		 * The key a square of a ground or of a planet is kept under (SceneCache): what makes it (the source of the generators
		 * and the graphs of Blueprints, summed once a page), its field (its options, once for each field), its roads, and the
		 * square itself. Another version of a generator, a graph changed, a road laid: another key.
		 */
		function pieceKey (field, roads, shape, args) {
			if (gpu.PieceMaker === undefined) {
				gpu.PieceMaker = digestOf(self.$Service('SceneTerrainGenerator').Source(true) + self.$Service('ScenePlanet').Source(true) + self.$Service('Noise').Source(true) + JSON.stringify(Elemenx.Resources('Blueprints') || null));
			}

			if (field.CacheDigest === undefined)
				field.CacheDigest = digestOf(JSON.stringify(field.Options || null), gpu.PieceMaker);

			if (roads && roads.CacheDigest === undefined)
				roads.CacheDigest = digestOf(JSON.stringify(roads));

			return shape + ':' + field.CacheDigest.toString(36) + ':' + (roads ? roads.CacheDigest.toString(36) : '-') + ':' + JSON.stringify(args);
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
				 * fine is it made of the volume (SceneTerrainGenerator, Chunk), its roof and floor whole. Never finer: Regression: by
				 * its Error a square of a cave went on to half a metre beside one of a metre, their surfaces met at other points,
				 * and the sky was seen through the slit between them in the walls of the cave.
				 */
				if (node.Volumed === undefined)
					node.Volumed = !!(field.Volume && field.Volume.Touches(x - half, z - half, x + half, z + half));

				if (level < 8 && (!node.Volumed || size / 32 > 1) && (near < size * 0.35 && level < 6 || near < size * 4 && (node.Error || 0) / Math.max(near, 1) * focal > 1.5 || node.Volumed && near < size * 6)) {
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

			options = Object.assign({}, settings, sketch ? {Sketch: sketch} : {}, {Compute: self.Compute || 'auto'});
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

						terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', shared(terrain.Work(), options), null, [part[0], part[1], half, 32]], function (error, piece) {
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
			var values = Object.assign({uViewProjection: matrix, uSun: ground.Sun, uSunColor: ground.SunColor, uAir: groundAir(ground), uFog: fog, uSeen: seen ? seen.Color : gpu.NoBounce, uSeenDepth: seen ? seen.Depth : gpu.NoBounce, uSeenInverse: math.Invert(matrix), uMirror: seen ? 1 : 0, uPlanar: gpu.NoBounce, uPlanarOn: 0, uEyeUnder: ground.Under ? 1 : 0, uEye: scene.Eye, uTime: scene.Seconds, uDay: ground.Day * (1 - ground.Cover * ground.Cover * 0.5), uWild: 1 + ground.Air.Rain * 0.9, uFlow: 0}, self.WaterValues(scene.Seconds));

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

			terrain.ShareGround(terrain.Work(), field.Options);

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
		 * shadow of the sun casts one of a lamp. A lamp of all round (no Spot) under the rock of a ground with a volume (a cave,
		 * a tunnel) sees all round: the six faces of a cube from it, side by side in one map (3 by 2 of a third of it each,
		 * the faces of +x, -x, +y, -y, +z and -z), so it lights no other way through the rock beside.
		 */
		var lampMaps = [];

		/* The faces of a cube round a lamp: the way each looks, and its up (the shader of the land takes them in this order). */
		var cubeFaces = [[[1, 0, 0], [0, 1, 0]], [[-1, 0, 0], [0, 1, 0]], [[0, 1, 0], [0, 0, 1]], [[0, -1, 0], [0, 0, -1]], [[0, 0, 1], [0, 1, 0]], [[0, 0, -1], [0, 1, 0]]];

		/* Whether a lamp is under rock: some of it over it within 12 m. */
		function underRock (lamp) {
			var volume = scene.Ground && scene.Ground.Field && scene.Ground.Field.Volume;
			var up;

			if (!volume || number(lamp.Settings.Spot, 0)) return false;

			for (up = 2; up <= 12; up += 2) {
				if (volume.Density(lamp.At[0], lamp.At[1] + up, lamp.At[2]) > 0) return true;
			}

			return false;
		}

		function lampShadows () {
			var which = scene.LampTurn = ((scene.LampTurn || 0) + 1) % 2;
			var lamp = scene.Lamps[which];
			var lit = self.Graphics().Lamps;
			/*
			 * A lamp a body carries is inside its shape, as one built into a model is: it has no shadow of its own. Under rock
			 * one carried has (Regression: a lantern carried in a cave lit the next passage through the rock); it is held over
			 * the body that carries it (Height), so that body only casts its shadow down.
			 */
			var omni = !!lamp && !lamp.Built && underRock(lamp);
			if (lamp && (lamp.Built || (lamp.Object.Values.Follow || lamp.Settings.Follow) && !omni))
				lamp = null;

			var at;
			var way;
			var matrix;
			var far;
			var side;

			lampMaps = lampMaps.slice(0, Math.min(lit ? 2 : 0, scene.Lamps.length));

			if (!lit || !lamp || !scene.Casters) return;

			at = vectors.Subtract(lamp.At, scene.Eye);

			if (omni) {
				far = number(lamp.Settings.Radius, 14) * 1.2;
				gpu.Omni = gpu.Omni || [renderer.Shadow(1536), renderer.Shadow(1536)];
				side = gpu.Omni[which].Size / 3;

				cubeFaces.forEach(function (face, index) {
					var region = [index % 3 * side, Math.floor(index / 3) * side, side, side];

					gpu.Omni[which].Begin(region);

					scene.Casters(math.Multiply(math.Perspective(90, 1, 0.1, far), math.LookAt(at, vectors.Add(at, face[0]), face[1])));

					gpu.Omni[which].End();
				});

				lampMaps[which] = {Map: gpu.Omni[which], Matrix: math.Identity(), Omni: far};

				return;
			}

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

				data.push(at[0], at[1], at[2], number(settings.Radius, 14), color[0] * power, color[1] * power, color[2] * power, index < 2 && lampMaps[index] ? lampMaps[index].Omni ? 1 + lampMaps[index].Omni : 1 : 0, aim[0], aim[1], aim[2], spot ? Math.cos(spot * Math.PI / 360) : -2);
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
			/* Turned as what carries it lies (PaneTurn: a screen of a console of a ship in flight, SceneAboard), else by Yaw and Pitch. */
			var turn = object.PaneTurn || math.Multiply(math.Rotation([0, 1, 0], number(settings.Yaw, 0) * Math.PI / 180), math.Rotation([1, 0, 0], number(settings.Pitch, 0) * Math.PI / 180));
			var width = number(settings.Width, 2);
			var height = number(settings.Height, 2);
			var at = vectors.Subtract(center, scene.Eye);

			return {Center: center, Normal: math.Apply(turn, [0, 0, 1]), Width: width, Height: height, Model: math.Multiply(math.Translation(at[0], at[1], at[2]), math.Multiply(turn, math.Multiply(math.Rotation([1, 0, 0], Math.PI / 2), math.Scaling(width, 1, height))))};
		}

		/* A pane of an object (a mirror, a glass, a screen) for the traits: its middle, the ways of it, its size. */
		engine.PaneOf = function (object, settings) {
			var pane = paneOf(object, settings);
			var turn = object.PaneTurn || math.Multiply(math.Rotation([0, 1, 0], number(settings.Yaw, 0) * Math.PI / 180), math.Rotation([1, 0, 0], number(settings.Pitch, 0) * Math.PI / 180));

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

		/* An eye in the car or by it: one that sees its screens and its mirrors at a size worth their pictures. */
		function inCar (car) {
			return !!car && !!car.World && !!scene.Eye && vectors.Distance(scene.Eye, car.World) <= Math.max(2, (car.Size || 4) * 0.75);
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
			var graphics = self.Graphics();
			var most = graphics.Mirrors.Most;
			var made = {};
			var kept = gpu.Mirrors = gpu.Mirrors || {};
			var tick = scene.MirrorTick = (scene.MirrorTick || 0) + 1;
			var all = reflectorsOf();
			var keys = {};
			var phone = self.Phone && self.Phone();

			all.map(function (one) {
				var at = vectors.Subtract(one.Pane.Center, scene.Eye);

				keys[one.Key] = true;

				return Object.assign(one, {At: at, Far: vectors.Length(at), Seen: vectors.Dot(at, one.Pane.Normal) < 0});
			}).filter(function (one) {
				var seen = math.Apply(math.Multiply(projection, view), one.At);

				/*
				 * A mirror of a car only from in it: seen from out of it, it is a few dots of the screen, its glass as its material
				 * is. Regression: all the world drawn once more for it (two million triangles), from behind the car too.
				 */
				if (one.Small && !inCar(drivenCar())) return false;

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

				/*
				 * Each in a frame of its own: all of them on the same frames made every other frame a heavy one, and the view went by
				 * in jerks. A mirror of the car seen from out of it is a few dots of the screen, and each picture of it is all the
				 * world drawn once more (Regression: two million triangles): made again four times less often, and on a phone not at all.
				 */
				var outside = !!one.Small && !inCar(drivenCar());
				var waits = (tick + index) % (Math.max(1, Math.round(number(settings.Every, 1))) * (outside ? 4 : 1)) !== 0 || outside && phone;

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
			if (scene.Ground && scene.Ground.Field.Water && !scene.Camera.Ortho && graphics.Mirror && scene.Eye[1] > 0.3 && !scene.Ground.Under) {
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

				if (!ground && (mirror || glass || !screen || object.Values.Z === undefined)) return;

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

						renderer.Draw(gpu.Pane, gpu.Glass, uniforms({uModel: pane.Model, uSize: [pane.Width, pane.Height], uMirror: mirrored[object.ID] ? mirrored[object.ID].Textures[0] : white, uOn: mirrored[object.ID] ? 1 : 0, uScreen: [renderer.Width, renderer.Height], uRect: rectOf(mirrored[object.ID]), uTint: paint(glass.Tint || '#cfe6f0').slice(0, 3), uClarity: Math.max(0, Math.min(1, number(glass.Clarity, 0.88))), uFrost: Math.max(0, Math.min(1, number(glass.Frost, 0))), uReflect: Math.max(0, Math.min(1, number(glass.Reflect, 0.35))), uSun: ground.Sun, uSunColor: ground.SunColor, uSkyLight: ground.SkyLight, uFloorLight: ground.FloorLight}), {Blend: 'over', DepthWrite: false, Cull: 'none'});
					});
				}
			});

			var car = ground ? drivenCar() : null;
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

			/*
			 * Its screens only to an eye in it or by it (one that sees them): a picture of an element of the page is costly.
			 * Regression: the dash of a car was drawn again five times a second behind it, the eye 8 m away (its frames late).
			 */
			if (!inCar(car)) return;

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
							else if (change.type === 'attributes' && styledAttribute(change.target, change.attributeName)) state.Styles.Dirty.push(change.target);
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

		/*
		 * Whether an attribute changed may change the styles of its element: any of an element of SVG (its presentation),
		 * any but aria-*, data-*, role, title, alt and tabindex, and those too when a selector of the page names them
		 * ([aria-pressed]). Regression: a Meter on a screen told its value by aria-valuenow at each change, and all it held
		 * was read again for the picture (8000 properties, 7 ms a picture).
		 */
		function styledAttribute (element, name) {
			var sheets = element.ownerDocument.styleSheets;
			var known = engine.StyledNames;
			var names;

			if (element.namespaceURI === 'http://www.w3.org/2000/svg' || !/^(aria-|data-|role$|title$|alt$|tabindex$)/.test(name)) return true;

			if (!known || known.Count !== sheets.length) {
				names = {};

				Array.prototype.forEach.call(sheets, function (sheet) {
					var rules;

					try {
						rules = sheet.cssRules;
					}
					catch (error) {
						/* A stylesheet of another origin may name any of them. */
						names['*'] = true;

						return;
					}

					(function walk (list) {
						Array.prototype.forEach.call(list || [], function (rule) {
							var found = /\[\s*([\w-]+)/g;
							var match;

							if (rule.cssRules && !rule.selectorText)
								walk(rule.cssRules);

							while (rule.selectorText && (match = found.exec(rule.selectorText)))
								names[match[1].toLowerCase()] = true;
						});
					})(rules);
				});

				known = engine.StyledNames = {Count: sheets.length, Names: names};
			}

			return !!(known.Names['*'] || known.Names[String(name).toLowerCase()]);
		}

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
				return markup.EscapeText(value);
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
			var air = groundAir(ground);
			var fog = scene.Camera.Ortho || self.Graphics().Post ? 1e9 : field.Size * 0.9;

			/* The stars first: the air, its sun and its moon come over them (not in a mirror: they keep to the view of the eye). */
			if (!scene.Camera.Ortho && ground.StarLimit < 1 && !mirror) {
				engine.CosmosNight(matrix, ground, ground.StarTurn, ground.GalaxyLight);

				var aspect = renderer.Width / Math.max(1, renderer.Height);

				gpu.NightStars = gpu.NightStars || nightStars();

				renderer.Draw(gpu.NightStars, gpu.StarsTurned, {uViewProjection: math.Multiply(math.Perspective(scene.Camera.Fov, aspect, 0.1, 200), math.LookAt([0, 0, 0], vectors.Subtract(scene.Camera.Target, scene.Camera.Position), scene.Camera.Up)), uRatio: renderer.Ratio, uTurn: ground.StarTurn, uLimit: ground.StarLimit, uTime: scene.Seconds}, {Depth: false, DepthWrite: false, Blend: 'add'});
			}

			if (!scene.Camera.Ortho)
				renderer.Draw(gpu.Quad, gpu.Sky, Object.assign({uInverse: math.Invert(matrix), uSun: ground.Sky, uSunColor: ground.SunColor, uAir: air, uUp: [0, 1, 0], uHigh: 0, uDip: 0, uCover: ground.Shut, uEclipse: ground.Eclipse, uSunRadius: ground.SunRadius || 0.00465, uRainbow: ground.Rainbow || 0, uAurora: [ground.Aurora || 0, scene.Seconds % 3000, 0, 0], uAuroraLow: ground.AuroraLow || [0.2, 1, 0.55], uAuroraHigh: ground.AuroraHigh || [0.75, 0.25, 1], uMoonShade: ground.Moon ? ground.Moon.Shade : 0, uGlow: ground.Glow, uGlowWay: ground.GlowWay, uMoon: ground.Moon ? ground.Moon.Way : [0, 1, 0], uMoonLit: ground.Moon ? ground.Moon.Lit : [0, 1, 0], uMoonSize: ground.Moon ? ground.Moon.Size : 0, uMoonGlow: ground.Moon ? Math.min(1, ground.Moon.Glow) * Math.max(0, Math.min(1, ground.Moon.Way[1] / 0.15)) : 0, uNoWisps: groundClouds().Shell ? 1 : 0, uDiffuse: 0}, self.SkyValues(scene.Seconds)), {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});

			/* Past the ground of a location: the far ground of its body. */
			if (!scene.Camera.Ortho && !mirror && scene.Horizon)
				drawHorizon(matrix);

			/* What the view sees of the squares: those wholly out of it are not drawn (nodeSeen). */
			var sees = frustum(matrix);

			/* One set of uniforms for all the squares, their places set for each; a ground with a Blueprint drawn by its graph. */
			var settings = trait(scene.Objects[ground.ID], 'Terrain');
			var own = settings && settings.Blueprint ? blueprinted(settings, 'Land', ground.ID) : null;
			/* Of a location come in a flight: made behind (gpu.LandOf), the land of no materials drawn till then (below). */
			var program = gpu.LandOf(own, field.Materials, !!scene.Location);
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
			 * land is not drawn (the veil waits for it, see waiting); one made behind (a location come in a flight), the land
			 * of no materials made at the start in its place. Regression: the veil over a ship hovering to land stood 15 s for it.
			 */
			if (!renderer.Ready(program) && program.Behind && renderer.Ready(gpu.LandOf(null, null)))
				program = gpu.LandOf(null, null);

			if (renderer.Ready(program)) {
				nodes.forEach(function (node) {
					if (!nodeSeen(node, sees)) return;

					land.uOffset = vectors.Subtract(node.Center, scene.Eye);
					land.uCenter = node.Center;
					/* Its depth in the tree of squares: the whole ground 0, each split one more. */
					land.uLevel = engine.LevelColor('ground', Math.round(Math.log(field.Size / node.Size) / Math.LN2));

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

			return surface.Planet ? terrain.Sphere({Planet: planetOf(object)}) : terrain.Sphere({Radius: object.Radius, Height: relief[type] || 6, Seed: object.Seed, Ocean: object.Look.Ocean, Type: type, BakeSource: bakeSource() || undefined});
		}

		/*
		 * The land of the BakeGraph of the scene made code (SceneTerrainGenerator.BakeCodeOf), once: the ground of a body of noise
		 * the land its picture shows; null for the one of the library, or a graph written by hand (its ground the one of the library).
		 */
		function bakeSource () {
			var given = self.GraphOf('BakeGraph', 'shader/bake');

			if (scene.BakeSource !== undefined) return scene.BakeSource;

			scene.BakeSource = null;

			try {
				if (typeof given === 'string')
					given = given.trim().charAt(0) === '{' ? JSON.parse(given) : null;

				if (given && self.BakeMade)
					scene.BakeSource = terrain.BakeCodeOf(given);
			}
			catch (error) {
				if (window.console && window.console.warn)
					window.console.warn('Elemenx Scene: the land of the BakeGraph cannot be made, the ground of the library is under it: ' + error.message);
			}

			return scene.BakeSource;
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

			if (!object || !trait(object, 'Body') || self.$Service('ScenePlanet').Giant(type)) return false;

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
			var was = surface.Altitude;

			surface.Altitude = Math.exp(Math.log(way.From) + (Math.log(Math.max(0.0005, surface.Wanted)) - Math.log(way.From)) * eased);
			surface.Up = vectors.Normalize(vectors.Add(surface.Up, vectors.Scale(heading, (eased - way.Done) * way.Sweep)));
			way.Done = eased;

			/*
			 * The view stays tilted where the player tilted it, all the way. The air heats as a ship's in it does (one heat, of the
			 * graph of a landing: engine.LandingLook), of how fast the view comes down. Regression: a formula of its own, its heat
			 * high at 80 km, a ship's at 65 km.
			 */
			surface.Heat = engine.LandingLook({Thick: air, Speed: elapsed > 0 && was !== undefined ? Math.abs(was - surface.Altitude) / elapsed : 0, Over: surface.Altitude, Going: surface.Rising ? 1 : 0}).Heat;

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

			/* A ship flies over it: it says where the eye stands (SceneLanding); with the hero in it on foot, the frame of the ship (SceneAboard). */
			if (surface.Ship) {
				if (engine.AfootSurface && engine.AfootSurface(surface, keys, elapsed)) return;

				engine.PadLook(keys.Pad, elapsed);
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
		/* The snow of a picture of a square (red) and how much of the sky its hills hide (green: Closed; none, 0: open). */
		function snowsOf (picture) {
			var count = picture.Size * picture.Size;
			var data = new Uint8Array(count * 4);
			var i;

			for (i = 0; i < count; i++) {
				data[i * 4] = picture.Snow[i];
				data[i * 4 + 1] = picture.Closed ? picture.Closed[i] : 0;
			}

			return data;
		}

		function pictured (node, picture, square, lands) {
			var km;
			var x;
			var y;

			if (!picture || !picture.Color) return node;

			unpictured(node);

			node.Colors = renderer.Texture({Width: picture.Size, Height: picture.Size, Data: picture.Color}, {Mipmaps: true});
			node.Lands = picture.Biomes && lands ? renderer.Texture({Width: picture.Size, Height: picture.Size, Data: landsOf(picture, lands)}, {Single: true, Nearest: true}) : null;
			node.Relief = renderer.Texture({Width: picture.Size, Height: picture.Size, Data: picture.Normal}, {Mipmaps: true});
			node.Uses = picture.Use ? renderer.Texture({Width: picture.Size, Height: picture.Size, Data: picture.Use}, {Mipmaps: true}) : null;
			node.Snows = picture.Snow ? renderer.Texture({Width: picture.Size, Height: picture.Size, Data: snowsOf(picture)}, {Mipmaps: true}) : null;
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

		/*
		 * The biomes of the texels of a picture of a square (PatchPicture: indices into its own Lands) as indices into the
		 * lands of the planet (lands: their names), 255 none.
		 */
		function landsOf (picture, lands) {
			var data = new Uint8Array(picture.Biomes.length);
			var map = picture.Lands.map(function (name) {
				var index = lands.indexOf(name);

				return index === -1 || index > 254 ? 255 : index;
			});
			var i;

			for (i = 0; i < data.length; i++)
				data[i] = picture.Biomes[i] === 255 ? 255 : map[picture.Biomes[i]];

			return data;
		}

		/*
		 * The materials of the near ground of a planet, as the ground of a location of each of its biomes is made: what each
		 * biome's ground is of (its Low, High, Rock and Sand, else those of every ground, SceneTerrainGenerator), all of them
		 * the slots of one program (12 at most); Slots, four of them for each of its first 15 lands (the 16th: the ground of
		 * none); Snows, the slot of the snow of each; Lands, their names. Made once for a field.
		 */
		function nearMaterials (field) {
			var defaults = self.$Service('SceneTerrainGenerator').GroundMaterials || {};
			var names = [];
			var slots = new Array(64).fill(0);
			var snows = new Array(16).fill(0);
			var canopy = new Array(48).fill(0);
			var lands = field.Planet.Lands || [];
			var flora = self.$Service('SceneFlora');

			function slot (name) {
				var at = names.indexOf(name);

				if (at === -1 && name && names.length < 12) {
					names.push(name);

					at = names.length - 1;
				}

				return Math.max(0, at);
			}

			function row (index, own) {
				['Low', 'High', 'Rock', 'Sand'].forEach(function (part, k) {
					slots[index * 4 + k] = slot(own[part] || defaults[part]);
				});

				/* Its snow: where its picture says snow lies (Snow of PatchPicture). */
				snows[index] = slot(own.Snow || defaults.Snow);
			}

			/*
			 * The green of the crowns of its woods: of the leaves of the trees it sows (SceneFlora.Far of the Shapes of its
			 * Scatter, by the weight of each rule), as the plants near are; none ([0, 0, 0]): its ground's.
			 */
			function canopyOf (land, index) {
				var sum = [0, 0, 0, 0];

				(land.Scatter || []).forEach(function (rule) {
					var weight = (rule.Cover === undefined ? 0.5 : Number(rule.Cover)) * Math.max(0.2, Number(rule.Density) || 1);

					(rule.Shapes || []).forEach(function (shape) {
						var far = flora && !flora.ElemenxDeferred && flora.Far ? flora.Far(shape) : null;
						if (!far) return;

						sum = [sum[0] + far.Color[0] * weight, sum[1] + far.Color[1] * weight, sum[2] + far.Color[2] * weight, sum[3] + weight];
					});
				});

				if (sum[3] > 0)
					canopy.splice(index * 3, 3, sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]);
			}

			if (field.NearGround)
				return field.NearGround;

			row(15, {});

			lands.slice(0, 15).forEach(function (land, index) {
				row(index, land.Ground && land.Ground.Materials || {});

				canopyOf(land, index);
			});

			field.NearGround = {Names: names, Slots: slots, Snows: snows, Canopy: canopy, Lands: lands.map(function (land) {
				return land.Name;
			}), Key: names.join(',')};

			return field.NearGround;
		}

		/*
		 * The ground of a planet near (40 km and lower): the materials of the ground of a location, by the biome of each texel
		 * of its picture (nearMaterials), its program of its own made once the eye is that low (the ground of the globe
		 * meanwhile, its four tiles): {Program, Values}. Higher, or before its tiles and its program have come: the Ground and
		 * its tiles (groundTiles).
		 */
		function groundNear (field, eye, altitude) {
			var textures = self.$Service('SceneTextures');
			var materials = self.$Service('SceneMaterials');
			var near;
			var program;
			var array;
			var laid;

			if (!field.Planet || altitude > 40)
				return {Program: gpu.Ground, Values: groundTiles(eye, altitude)};

			near = nearMaterials(field);
			gpu.NearGrounds = gpu.NearGrounds || {};
			program = gpu.NearGrounds[near.Key] = gpu.NearGrounds[near.Key] || renderer.Program(shaders.GroundVertex, nearGroundSource(near.Names));
			array = textures.Array(renderer, materials.Textured(near.Names));
			laid = groundTiles(eye, altitude);

			if (!array || !programReady(program))
				return {Program: gpu.Ground, Values: laid};

			return {Program: program, Values: Object.assign(laid, {uTextured: 1, uLandColor: array.Color, uLandSurface: array.Surface, uLandSlots: near.Slots, uLandSnow: near.Snows, uLandCanopy: near.Canopy, uCanopy: [engine.TreesReach - 0.3, engine.TreesReach]})};
		}

		/*
		 * The Ground shader for a ground near: the materials of a location (SceneMaterials.Land of names, its helpers before it)
		 * where the four tiles were, each texel's of its biome (uLandsMap, uLandSlots: Low, High, Rock and Sand of each land):
		 * the low ground of the one, the high of the other by its height, rock where it is steep, sand by the sea; their
		 * weights of a corner (vMaterials) worked out in the pixel. Its own slope is told (landSlope), in the plane at the
		 * anchor. They fade into the colors of its picture where a pixel is 30 to 120 m: from high the picture as it was.
		 */
		function nearGroundSource (names) {
			var materials = self.$Service('SceneMaterials');
			var land = materials.Land(names).replace('precision highp sampler2DArray;\n' + self.$Service('SceneTextures').Chunk(true) + '\n', '').replace('\tlandSlope = landSteeper(place);\n', '');
			var source = shaders.Ground.replace(materials.LandSlope + '\n' + materials.LandTexture, [materials.Helpers, 'vec4 vMaterials;', 'vec4 vMaterials2;', 'vec4 vMaterials3;', 'uniform sampler2D uLandsMap;', 'uniform vec4 uLandSlots[16];', 'uniform float uLandSnow[16];', 'uniform vec2 uCanopy;', 'uniform vec3 uLandCanopy[16];', land].join('\n'));
			var from = source.indexOf('\tif (uTextured > 0.5) {\n\t\tlandSlope = normalize(');
			var end = '\t\talbedo = mix(albedo, laid / max(total, 1e-4), clamp(total, 0.0, 1.0));\n\t}\n';
			var to = source.indexOf(end, from) + end.length;

			return source.slice(0, from) + [
				'\tif (uTextured > 0.5) {',
				'\t\tlandSlope = normalize(vec3(dot(smoothed, uEast), dot(smoothed, uUp), dot(smoothed, uNorth)));',
				'\t\tfloat metres = vLand.x * 1000.0;',
				'\t\tfloat w[12];',
				'\t\tfor (int k = 0; k < 12; k++) w[k] = 0.0;',
				/* Under its woods the ground of a wood: its high ground's (soil), no lawn under the trees. */
				'\t\tfloat part = max(smoothstep(150.0, 1800.0, metres), wooded);',
				'\t\tfloat steep = 1.0 - smoothstep(0.91, 0.98, landSlope.y);',
				'\t\tfloat sandy = 1.0 - smoothstep(0.6, 2.5, metres);',
				'\t\tfloat lush = (1.0 - steep) * (1.0 - sandy);',
				/* Its snow over them (of its picture), the snow of each biome; less on what is steep, its rock through it. */
				'\t\tfloat white = snow * (1.0 - steep * 0.7) * (1.0 - sandy);',
				'\t\tfloat bare = 1.0 - white;',
				/*
				 * The biomes of the four texels round it, each by its share (as its colors are read, ragged): the materials of
				 * the one go over into those of the next. Regression: of the nearest texel only, a land whose biome changes with
				 * its height from texel to texel (hills about a bound) was a chessboard of squares of two grounds.
				 */
				'\t\tvec2 lg = pictureSoft * uTexels - 0.5;',
				'\t\tvec2 lf = fract(lg);',
				'\t\tivec2 l0 = ivec2(floor(lg));',
				'\t\tivec2 lmax = ivec2(max(int(uTexels + 0.5) - 1, 0));',
				'\t\tint nearest = (lf.x > 0.5 ? 1 : 0) + (lf.y > 0.5 ? 2 : 0);',
				'\t\tint biome = 255;',
				'\t\tfor (int c = 0; c < 4; c++) {',
				'\t\t\tivec2 o = ivec2(c - (c / 2) * 2, c / 2);',
				'\t\t\tfloat cw = (o.x == 1 ? lf.x : 1.0 - lf.x) * (o.y == 1 ? lf.y : 1.0 - lf.y);',
				'\t\t\tint b = uTiled > 0.5 ? int(texelFetch(uLandsMap, clamp(l0 + o, ivec2(0), lmax), 0).r * 255.0 + 0.5) : 255;',
				'\t\t\tif (c == nearest) biome = b;',
				'\t\t\tvec4 slots = uLandSlots[min(b, 15)];',
				'\t\t\tw[int(slots.x)] += (1.0 - part) * lush * cw * bare;',
				'\t\t\tw[int(slots.y)] += part * lush * cw * bare;',
				'\t\t\tw[int(slots.z)] += steep * (1.0 - sandy) * cw * bare;',
				'\t\t\tw[int(slots.w)] += sandy * cw;',
				'\t\t\tw[int(uLandSnow[min(b, 15)])] += white * cw;',
				'\t\t}',
				'\t\tfloat dry = 1.0 - water;',
				'\t\tvMaterials = vec4(w[0], w[1], w[2], w[3]) * dry;',
				'\t\tvMaterials2 = vec4(w[4], w[5], w[6], w[7]) * dry;',
				'\t\tvMaterials3 = vec4(w[8], w[9], w[10], w[11]) * dry;',
				'\t\tvec3 made = albedo;',
				'\t\tfloat height = 0.0;',
				'\t\tlandMaterials(local, length(fwidth(local.xz)), made, height);',
				'\t\tfloat madeSeen = 1.0 - smoothstep(30.0, 120.0, foot * 1000.0);',
				'\t\talbedo = mix(albedo, made, madeSeen);',
				/*
				 * Its relief as a location bends its light by it (the height of its materials: grains, clods, ripples, stones).
				 * Regression: its height was left out, sand, clay and soil near were flat paint under any light.
				 */
				'\t\tn = normalize(mix(n, enx_bump(vWorld * 1000.0, n, height), madeSeen));',
				/*
				 * Its woods past where their trees are drawn (uCanopy: km, from and to, they come in): their crowns from over them,
				 * as thick as the trees nearer stand (each a cell of a few metres, there by its chance as its share of woods
				 * tells, a dome lit to its middle, its own green; between them the ground in their shade); as long as a pixel is
				 * under 1.5 to 4.5 m (a crown over two pixels), farther their mean. Regression: past 1.2 km woods were blotches
				 * of a darker green (stands of a noise much thinner than the trees nearer), the trees nearer ending in a line.
				 */
				'\t\tfloat canopy = step(0.01, cover) * (1.0 - water) * smoothstep(uCanopy.x, uCanopy.y, length(vWorld));',
				'\t\tif (canopy > 0.01) {',
				/*
				 * The green of the leaves of its trees (uLandCanopy of its biome), as the plants nearer come out (lit as models
				 * are: less green than this shader lights a green; matched to them on the screen), else of its ground.
				 */
				'\t\t\tvec3 leafy = uLandCanopy[min(biome, 15)];',
				'\t\t\tvec3 base = leafy.g > 0.0 ? leafy * vec3(2.2, 1.45, 2.1) : albedo;',
				'\t\t\tfloat thick = min(1.0, cover * 1.6);',
				'\t\t\tvec4 crown = enx_mc(local.xz / 7.5, 0.85);',
				/*
				 * Each crown and the gap round it as long as a crown is over five pixels, its edge as wide as a pixel and a half:
				 * no crowns of three pixels with hard gaps, a grain over the woods.
				 */
				'\t\t\tfloat seenCrowns = 1.0 - smoothstep(0.8, 1.8, foot * 1000.0);',
				'\t\t\tfloat crownEdge = foot * 1000.0 / 7.5 * 1.5;',
				'\t\t\tfloat there = step(crown.z, thick) * (1.0 - smoothstep(0.55 - crownEdge, 0.8 + crownEdge, crown.x));',
				'\t\t\tvec3 leaves = base * (0.85 + 0.3 * crown.w) * (1.15 - crown.x * 0.6);',
				'\t\t\tvec3 crowned = mix(albedo * mix(1.0, 0.55, thick), leaves, there);',
				'\t\t\talbedo = mix(albedo, mix(mix(albedo, base * 0.9, thick), crowned, seenCrowns), canopy);',
				'\t\t}',
				'\t}',
				''
			].join('\n') + source.slice(to);
		}

		/* The uniforms of the picture of a square for the Ground shader: its textures, or none yet (its colors of its points). */
		function tiled (node) {
			var dwelt = node.Uses && node.Square && !(scene.Tuned && scene.Tuned.Fields === false);

			/* Its use always (the sand of its dunes in it), none of a square with none. */
			if (!gpu.NoUse)
				idle();

			if (!gpu.NoLands)
				gpu.NoLands = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255])}, {Single: true, Nearest: true});

			return {uLandsMap: node.Lands || gpu.NoLands, uTiled: node.Colors ? 1 : 0, uColorMap: node.Colors || gpu.NoBounce, uReliefMap: node.Relief || gpu.NoBounce, uTexels: node.Texels || 2, uWoods: scene.Tuned && scene.Tuned.Woods === false ? 0 : 1, uDwelt: dwelt ? 1 : 0, uUseMap: node.Uses || gpu.NoUse, uSnowMap: node.Snows || gpu.NoUse, uEdges: node.Edges || [0, 0, 0, 0], uSquare: dwelt ? node.Square : [0, 0, 1, 0], uSquareCell: dwelt ? node.Cell : [0, 0]};
		}

		function unpictured (node) {
			['Colors', 'Relief', 'Uses', 'Lands', 'Snows'].forEach(function (name) {
				if (node[name])
					node[name].Destroy();

				node[name] = null;
			});

			if (node.Things)
				[node.Things.Mesh, node.Things.Trees].forEach(function (mesh) {
					if (mesh)
						mesh.Destroy();
				});

			node.Things = null;
		}

		/*
		 * What of what stands on a square of a planet is drawn now: its houses, and its trees while the eye is near them (within
		 * engine.TreesReach km of the square, 1.2): farther the Ground shader draws its woods.
		 */
		function standing (node) {
			var things = node.Things;
			var surface = scene.Surface || scene.Horizon;
			var list = things && things.Mesh ? [things.Mesh] : [];

			if (things && things.Trees && surface && surface.Eye && vectors.Distance(things.Center, surface.Eye) < engine.TreesReach + things.Size * 0.71)
				list.push(things.Trees);

			return list;
		}

		/* How near the trees of the squares of a planet are drawn, km (they fade out over the last 300 m of it). */
		engine.TreesReach = 1.2;

		/* How near the plants of SceneFlora stand for the trees of the squares of a planet: they fade out between these, km. */
		engine.PlantsReach = [0.7, 0.9];

		scene.ThingsMade = 0;

		/*
		 * The frame of the plants of a planet: metres, from a place on it near the eye (Anchor, km of the body), x east, y up
		 * there, z across them; Matrix from it to the body (km, round the eye). A new one when the eye is 3 km from it, its
		 * squares made again in it (ID).
		 */
		function plantFrame (surface) {
			var frame = surface.PlantFrame;
			var up;
			var east;
			var across;

			if (frame && vectors.Distance(frame.Anchor, surface.Eye) < 3) return frame;

			up = vectors.Normalize(surface.Eye);
			east = vectors.Normalize(vectors.Cross(Math.abs(up[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0], up));
			across = vectors.Cross(east, up);

			/*
			 * Its number of the scene, not of the surface. Regression: a surface made again (a landing anywhere) began its frames
			 * at 1 again, the keys of what was made in the frame of the last were the same, and its grass stood where it was.
			 */
			scene.PlantFrames = (scene.PlantFrames || 0) + 1;
			surface.PlantFrame = {Anchor: surface.Eye.slice(), X: east, Y: up, Z: across, ID: scene.PlantFrames, Matrix: [east[0] * 0.001, east[1] * 0.001, east[2] * 0.001, 0, up[0] * 0.001, up[1] * 0.001, up[2] * 0.001, 0, across[0] * 0.001, across[1] * 0.001, across[2] * 0.001, 0, 0, 0, 0, 1]};

			return surface.PlantFrame;
		}

		/* A point of the body (km) in the frame of the plants (metres); a way (free: not moved, not scaled to metres). */
		function inFrame (frame, point, free) {
			var d = free ? point : vectors.Subtract(point, frame.Anchor);
			var scale = free ? 1 : 1000;

			return [vectors.Dot(d, frame.X) * scale, vectors.Dot(d, frame.Y) * scale, vectors.Dot(d, frame.Z) * scale];
		}

		/*
		 * The plants of the trees of a square in the frame (made once for each frame): a list of copies for each model
		 * (flora-<species>~<variant>), as SceneScatter sows them: where (m), how tall (m), its turn, its tint.
		 */
		function plantSquare (node, frame) {
			var things = node.Things;
			var plants = things.Plants;
			var keys = {};
			var lists = {};
			var i;

			if (things.Square && things.Square.Frame === frame.ID) return things.Square;

			for (i = 0; i < plants.Places.length; i += 6) {
				var kind = Math.floor(plants.Places[i + 5]);
				var share = plants.Places[i + 5] - kind;
				var variant = Math.floor(share * 8);
				var key = keys[kind + ':' + variant] = keys[kind + ':' + variant] || library.Make(engine.PlantShape(plants.Species[kind]), {Variant: variant}).Key;
				var at = inFrame(frame, [things.Center[0] + plants.Places[i], things.Center[1] + plants.Places[i + 1], things.Center[2] + plants.Places[i + 2]]);
				var list = lists[key] = lists[key] || {Places: [], Extra: []};
				var tone = 0.88 + share * 0.2;

				list.Places.push(at[0], at[1], at[2], plants.Places[i + 3] * 1000);
				list.Extra.push(plants.Places[i + 4], tone, tone * (0.96 + share * 0.06), tone * 0.95);
			}

			Object.keys(lists).forEach(function (name) {
				lists[name] = {Places: new Float32Array(lists[name].Places), Extra: new Float32Array(lists[name].Extra), Count: lists[name].Places.length / 4};
			});

			things.Square = {Frame: frame.ID, Center: inFrame(frame, things.Center), Radius: things.Size * 1000 * 0.75 + 40, Lists: lists};

			return things.Square;
		}

		/*
		 * The ground of a planet round the eye in the frame of the plants (512 m a side, 128 texels, its middle where the eye
		 * was, made again once the eye is 100 m from it; a few rows a frame, the last made kept meanwhile): the height of the
		 * ground (metres of the frame) and how much grass, of the lands there (their Grass, SceneBiomes) and their cold;
		 * Grass, the rule of the grass of the land under the eye; Under, its undergrowth (the things of the rules of its
		 * lands no higher than 4 m: bushes, ferns, stumps, stones) within 200 m, a square of SceneScatter. Null till made.
		 */
		function nearField (surface, frame) {
			var field = surface.Field;
			var planet = field.Planet;
			var lands = planet.Lands || [];
			var registry = self.$Service('SceneBiomes');
			var side = 128;
			var size = 512;
			var coarse = 32;
			var eye = inFrame(frame, surface.Eye);
			var made = surface.NearField;
			var started = window.performance.now();
			var radius = field.Radius;
			var i;

			function landOf (name) {
				for (var k = 0; k < lands.length; k++) {
					if (lands[k].Name === name) return k;
				}

				return -1;
			}

			function grassOf (index) {
				var land = lands[index];
				var known = land ? registry.Get(land.Name) : null;

				/*
				 * The rule of its own if it has one, else its land's of SceneBiomes (a land of a planet tells only that it has
				 * grass, true). Regression: true taken for the rule, every land had the grass of none: thick and green in a semidesert.
				 */
				if (!land || land.Grass === false) return null;

				return land.Grass && typeof land.Grass === 'object' ? land.Grass : known && known.Grass || null;
			}

			/* The square of a face a direction is on and where on it ([face, u, v]: its inverse of SceneTerrainGenerator.Face). */
			function faceAt (d) {
				var ax = Math.abs(d[0]);
				var ay = Math.abs(d[1]);
				var az = Math.abs(d[2]);
				if (ax >= ay && ax >= az)
					return d[0] > 0 ? [0, -d[2] / ax, -d[1] / ax] : [1, d[2] / ax, -d[1] / ax];

				if (ay >= az)
					return d[1] > 0 ? [2, d[0] / ay, d[2] / ay] : [3, d[0] / ay, -d[2] / ay];

				return d[2] > 0 ? [4, d[0] / az, -d[1] / az] : [5, -d[0] / az, -d[1] / az];
			}

			/* A corner of the grid of a square as its mesh has it (SceneTerrainGenerator.SpherePatch): a point of the body (km). */
			function corner (face, u, v) {
				var key = face + ':' + u.toFixed(9) + ':' + v.toFixed(9);
				var d;

				/* Each once a field (texels beside each other share them). */
				if (made.Corners[key])
					return made.Corners[key];

				d = vectors.Normalize(terrain.Face(face, u, v));
				made.Corners[key] = vectors.Scale(d, radius + field.Raise(d, field.Land(d)));

				return made.Corners[key];
			}

			/*
			 * The point of the ground as it is drawn there (km): on the triangle of the finest square drawn now that holds it, as
			 * its mesh lays its two of each cell. Regression: of the very height of the planet, the grass was under the faces
			 * of the coarser grid of the ground, a blade showing here and there.
			 */
			function drawnAt (d) {
				var at = faceAt(d);
				var cells = surface.Resolution || 32;
				var level;

				for (level = Math.min(17, (made.Level || 17) + 1); level >= 0; level--) {
					var size = 2 / Math.pow(2, level);
					var cu = -1 + (Math.floor((at[1] + 1) / size) + 0.5) * size;
					var cv = -1 + (Math.floor((at[2] + 1) / size) + 0.5) * size;
					var node = surface.Nodes[at[0] + ':' + cu.toFixed(6) + ':' + cv.toFixed(6) + ':' + level];
					if (!node || node.Used !== surface.Frame) continue;

					var cell = size / cells;
					var s = (at[1] - (cu - size / 2)) / cell;
					var t = (at[2] - (cv - size / 2)) / cell;
					var i = Math.max(0, Math.min(cells - 1, Math.floor(s)));
					var j = Math.max(0, Math.min(cells - 1, Math.floor(t)));
					var u0 = cu - size / 2 + i * cell;
					var v0 = cv - size / 2 + j * cell;

					made.Level = level;
					s -= i;
					t -= j;

					/* Its triangles: a, a + 1, a + side and a + 1, a + side + 1, a + side (the diagonal from the second corner to the third). */
					if (s + t <= 1) {
						var p00 = corner(at[0], u0, v0);
						var p10 = corner(at[0], u0 + cell, v0);
						var p01 = corner(at[0], u0, v0 + cell);

						return [p00[0] + (p10[0] - p00[0]) * s + (p01[0] - p00[0]) * t, p00[1] + (p10[1] - p00[1]) * s + (p01[1] - p00[1]) * t, p00[2] + (p10[2] - p00[2]) * s + (p01[2] - p00[2]) * t];
					}

					var q11 = corner(at[0], u0 + cell, v0 + cell);
					var q10 = corner(at[0], u0 + cell, v0);
					var q01 = corner(at[0], u0, v0 + cell);

					return [q11[0] + (q01[0] - q11[0]) * (1 - s) + (q10[0] - q11[0]) * (1 - t), q11[1] + (q01[1] - q11[1]) * (1 - s) + (q10[1] - q11[1]) * (1 - t), q11[2] + (q01[2] - q11[2]) * (1 - s) + (q10[2] - q11[2]) * (1 - t)];
				}

				return vectors.Scale(d, radius + Math.max(0, field.Elevation(d)));
			}

			/* A point of the frame (metres) as a direction of the body. */
			function directionAt (x, z) {
				return vectors.Normalize([frame.Anchor[0] + (frame.X[0] * x + frame.Z[0] * z) / 1000, frame.Anchor[1] + (frame.X[1] * x + frame.Z[1] * z) / 1000, frame.Anchor[2] + (frame.X[2] * x + frame.Z[2] * z) / 1000]);
			}

			/* Made of squares coarser than those drawn now under its middle (they came as the eye went down): made again. */
			var stale = false;

			if (made && made.Done && surface.Frame % 30 === 0) {
				drawnAt(directionAt(made.Center[0], made.Center[1]));

				stale = made.Level !== made.CenterLevel;
			}

			if (!made || stale || made.Frame !== frame.ID || made.Row >= side && Math.hypot(eye[0] - made.Center[0], eye[2] - made.Center[1]) > 100) {
				made = surface.NearField = {Frame: frame.ID, Center: [Math.round(eye[0] / 16) * 16, Math.round(eye[2] / 16) * 16], Size: size, Side: side, Data: new Float32Array(side * side * 4), Climate: [], Corners: {}, Row: 0, Done: false};
				made.Key = frame.ID + ':' + made.Center.join(':');

				/* Its lands and their cold on a coarser grid (a land is kilometres wide): a sample of the planet is all of its climate. */
				for (i = 0; i < coarse * coarse; i++) {
					var sample = planet.Sample(directionAt(made.Center[0] + ((i % coarse) / (coarse - 1) - 0.5) * size, made.Center[1] + (Math.floor(i / coarse) / (coarse - 1) - 0.5) * size));

					made.Climate.push(sample.Land && sample.Elevation > 0.5 ? landOf(sample.Biome) : -1, sample.Celsius);
				}
			}

			while (made.Row < side && window.performance.now() - started < 3) {
				var row = made.Row++;

				for (i = 0; i < side; i++) {
					var x = made.Center[0] + (i / (side - 1) - 0.5) * size;
					var z = made.Center[1] + (row / (side - 1) - 0.5) * size;
					var direction = directionAt(x, z);
					/* Its point as the ground is drawn, and its metres over the sea of it (one sample of the ground a texel). */
					var drawn = drawnAt(direction);
					var height = (vectors.Length(drawn) - radius) * 1000;
					var point = [drawn[0] - frame.Anchor[0], drawn[1] - frame.Anchor[1], drawn[2] - frame.Anchor[2]];
					var cell = Math.min(coarse - 1, Math.round(row / (side - 1) * (coarse - 1))) * coarse + Math.min(coarse - 1, Math.round(i / (side - 1) * (coarse - 1)));
					var land = made.Climate[cell * 2];
					var cold = made.Climate[cell * 2 + 1];
					var at = (row * side + i) * 4;

					made.Data[at] = vectors.Dot(point, frame.Y) * 1000;
					/* Grass where its land has it, none under its snow nor under water. */
					made.Data[at + 1] = land >= 0 && height > 0.5 && grassOf(land) ? Math.max(0, Math.min(1, (cold + 4) / 4)) : 0;
					made.Data[at + 2] = land;
				}
			}

			if (made.Row >= side && !made.Done) {
				made.Done = true;
				made.Corners = {};

				drawnAt(directionAt(made.Center[0], made.Center[1]));

				made.CenterLevel = made.Level;

				/* None on what is steep (a wall of rock): of its own heights, a texel apart. */
				for (i = 0; i < side * side; i++) {
					var column = i % side;
					var line = Math.floor(i / side);
					var right = column < side - 1 ? i + 1 : i - 1;
					var below = line < side - 1 ? i + side : i - side;
					var step = size / (side - 1);
					var slope = Math.hypot(made.Data[right * 4] - made.Data[i * 4], made.Data[below * 4] - made.Data[i * 4]) / step;

					made.Data[i * 4 + 1] *= 1 - Math.max(0, Math.min(1, (slope - 0.5) / 0.3));
				}

				made.Grass = grassOf(made.Climate[(coarse / 2 * coarse + coarse / 2) * 2]);
				made.Under = undergrowth(made, lands);
				surface.NearReady = made;
			}

			return surface.NearReady && surface.NearReady.Frame === frame.ID ? surface.NearReady : null;
		}

		/*
		 * The undergrowth of a field near (nearField): of each rule of the lands there its things no higher than 4 m, as many
		 * as the rule's Density tells of them (its share of its shapes), within 200 m of its middle, on what is not steep nor
		 * snowed, each the same for the same place (a hash of the cell of 4 m). A square of SceneScatter: {Center, Radius, Lists}.
		 */
		function undergrowth (made, lands) {
			var lists = {};
			var cell = 4;
			var reach = 200;
			var count = Math.floor(reach / cell);
			var keys = {};
			var gx;
			var gz;

			function hash (a, b, salt) {
				var h = Math.imul(a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b) ^ salt, 0xc2b2ae35);

				h = Math.imul(h ^ (h >>> 15), 0x27d4eb2d);

				return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
			}

			function texel (x, z) {
				var last = made.Side - 1;
				var u = Math.max(0, Math.min(last, Math.round(((x - made.Center[0]) / made.Size + 0.5) * last)));
				var v = Math.max(0, Math.min(last, Math.round(((z - made.Center[1]) / made.Size + 0.5) * last)));

				return (v * made.Side + u) * 4;
			}

			for (gz = -count; gz <= count; gz++) {
				for (gx = -count; gx <= count; gx++) {
					var cx = Math.round(made.Center[0] / cell) + gx;
					var cz = Math.round(made.Center[1] / cell) + gz;
					var x = (cx + hash(cx, cz, 11)) * cell;
					var z = (cz + hash(cx, cz, 13)) * cell;
					var at = texel(x, z);
					var land = lands[made.Data[at + 2]];
					var rules = land && land.Scatter || [];
					var chance = hash(cx, cz, 17);
					var sum = 0;

					if (gx * gx + gz * gz > count * count || made.Data[at + 1] < 0.3 || !rules.length) continue;

					for (var r = 0; r < rules.length; r++) {
						var shapes = [].concat(rules[r].Shapes || []).filter(function (name) {
							var info = library.Info(engine.PlantShape(name));

							return info && info.Size <= 4;
						});
						var share = shapes.length / Math.max(1, [].concat(rules[r].Shapes || []).length);
						/* Density: things a hundred square metres; a cell is 16 of them. */
						var here = (Number(rules[r].Density === undefined ? 4 : rules[r].Density) * share * cell * cell / 100) * (rules[r].Cover === undefined ? 0.5 : Number(rules[r].Cover));

						if (!shapes.length) continue;

						sum += here;

						if (chance < sum) {
							var name = engine.PlantShape(shapes[Math.floor(hash(cx, cz, 19) * shapes.length)]);
							var variant = Math.floor(hash(cx, cz, 23) * 8);
							var key = keys[name + ':' + variant] = keys[name + ':' + variant] || library.Make(name, {Variant: variant}).Key;
							var list = lists[key] = lists[key] || {Places: [], Extra: []};
							var tone = 0.88 + hash(cx, cz, 29) * 0.2;

							list.Places.push(x, made.Data[at] - 0.05, z, library.Info(name).Size * (0.75 + hash(cx, cz, 31) * 0.5));
							list.Extra.push(hash(cx, cz, 37) * Math.PI * 2, tone, tone * 0.98, tone * 0.95);

							break;
						}
					}
				}
			}

			Object.keys(lists).forEach(function (name) {
				lists[name] = {Places: new Float32Array(lists[name].Places), Extra: new Float32Array(lists[name].Extra), Count: lists[name].Places.length / 4};
			});

			return {Center: [made.Center[0], made.Data[texel(made.Center[0], made.Center[1])], made.Center[1]], Radius: reach + 20, Lists: lists};
		}

		/*
		 * The plants of a planet round the eye (PlantStyle realistic, SceneScatter there): the squares within reach of it
		 * given to SceneScatter in the frame of the plants once all their species have come (asked for from three times as
		 * far, so they have come when they are near); till then the far trees of the squares stand for them. Gives {Frame,
		 * Eye (in it)} while they are drawn, else null.
		 */
		function planted (nodes) {
			var surface = scene.Surface;
			var reach = engine.PlantsReach;
			var ready = true;
			var near;
			var frame;
			var grown;
			var field;
			var key;

			if (!engine.ScatterPlanet || !surface || !surface.Eye || self.PlantStyle === 'simple') return null;

			field = surface.Field;

			near = nodes.filter(function (node) {
				var plants = node.Things && node.Things.Plants;
				var distance = plants ? vectors.Distance(node.Things.Center, surface.Eye) - node.Things.Size * 0.71 : Infinity;
				if (distance < reach[1] * 3)
					plants.Species.forEach(function (name) {
						if (engine.PlantShape(name).indexOf('flora-') !== 0)
							ready = ready && distance >= reach[1];
					});

				return distance < reach[1];
			});

			/* Its grass and its undergrowth round the eye, low over it (half a kilometre): of the field near it (nearField). */
			frame = surface.Altitude < 0.5 && field.Planet && field.Elevation ? plantFrame(surface) : null;
			grown = frame ? nearField(surface, frame) : null;

			if (engine.ScatterPlanetGrass)
				engine.ScatterPlanetGrass(grown && grown.Grass ? grown : null);

			if (!ready || !near.length && !grown) {
				if (surface.PlantsKey) {
					surface.PlantsKey = '';

					engine.ScatterPlanet(null);
				}

				return grown ? {Frame: frame, Eye: inFrame(frame, surface.Eye)} : null;
			}

			frame = plantFrame(surface);
			key = frame.ID + ':' + near.map(function (node) {
				return node.Things.ID;
			}).join(',') + ':' + (grown ? grown.Key : '');

			if (surface.PlantsKey !== key) {
				surface.PlantsKey = key;

				engine.ScatterPlanet(near.map(function (node) {
					return plantSquare(node, frame);
				}).concat(grown && grown.Under ? [grown.Under] : []));
			}

			return {Frame: frame, Eye: inFrame(frame, surface.Eye)};
		}

		/*
		 * The light on the plants of a planet as a location has it (its sun through the air, the light of its sky), of how
		 * high the sun stands over the eye: {Sun, Sky, Floor}. Regression: the color of the star itself and a sky of its own,
		 * and the trees near the eye were pale and grey where those of a location are green.
		 */
		function plantLight (sun, color) {
			var high = vectors.Dot(sun, scene.Surface.Axes.Up);
			var lit = skyOf(high, 0, 0.42);

			return {Sun: sunThrough(color, high), Sky: lit.Sky, Floor: lit.Floor};
		}

		/*
		 * The colour of a sun through the air (high: the sine of how high it stands): the more air the lower, the blue going
		 * first and the land turning gold; under the horizon none. One for a ground and for the plants of a planet.
		 */
		function sunThrough (color, high) {
			var through = 1 / (Math.max(0, high) + 0.045);

			return color.map(function (value, index) {
				return value * Math.exp(-[0.018, 0.05, 0.12][index] * through) * Math.min(1, Math.max(0, (high + 0.03) / 0.08));
			});
		}

		/*
		 * The light of a sky by a sun as high (sine) as it stands: Day, the light of the sky (Sky) and what the ground round gives
		 * back (Floor), on through the twilight; eclipse (0 to 1) the part of the sun a moon hides, dark the light of the night.
		 */
		function skyOf (high, eclipse, dark) {
			var day = Math.min(1, Math.max(0, (high + 0.2) / 0.45)) * (1 - eclipse * 0.93);
			var fill = day * (0.55 + 0.45 * Math.min(1, Math.max(0, (high - 0.06) / 0.34)));
			var dusk = 1 - Math.min(1, Math.abs(high) / 0.35);

			return {Day: day, Sky: [0.3 * fill + 0.05 * dark + 0.04 * dusk, 0.36 * fill + 0.06 * dark + 0.03 * dusk, 0.46 * fill + 0.1 * dark + 0.05 * dusk], Floor: [0.1 * fill + 0.016 * dark, 0.1 * fill + 0.019 * dark, 0.09 * fill + 0.03 * dark]};
		}

		/* The uniforms of the plants of a planet: the light of plantLight, its shadow (shade), all in the frame of the plants. */
		function plantValues (plants, sun, sunColor, shade) {
			var local = inFrame(plants.Frame, sun, true);
			var light = plantLight(sun, sunColor);
			var values = Object.assign({uCamera: [0, 0, 0], uLightPositions: [local[0] * 1e6, local[1] * 1e6, local[2] * 1e6, 0, 0, 0, 0, 0, 0, 0, 0, 0], uLightColors: [light.Sun[0] * 1.15, light.Sun[1] * 1.15, light.Sun[2] * 1.15, 0, 0, 0, 0, 0, 0, 0, 0, 0], uLightCount: 1, uSkyLight: light.Sky, uFloorLight: light.Floor, uSkySun: local, uAmbient: [0.17, 0.19, 0.23], uOccluderCount: 0, uOccluders: new Array(16).fill(0), uTime: scene.Time, uHighlight: [0, 0, 0, 0], uWet: 0, uSnowed: 0, uRainDrops: 0, uEyeAt: [0, 0, 0], uTime2: scene.Seconds % 1000, uMoving: 0, uSteady: 0, uCut: [0, 0, 0, 0], uHoleAt: [0, 0, 0, 0], uHoleHalf: [0, 0, 0, 0], uHeroFade: 0, uSeasonOn: 0, uDissolve: [0, 0, 1, 0], uSoft: 0}, shade, self.WindValues(scene.Seconds));

			if (shade.uShadowOn) {
				values.uShadowMatrix = math.Multiply(shade.uShadowMatrix, plants.Frame.Matrix);
				values.uShadowBias = shade.uShadowBias * 1000;
			}

			/*
			 * How much of the sky a leaf sees in a wood: half of it (a location has a map of it, its field light; a planet none).
			 * Regression: each leaf saw all of the sky, and the trees near the eye were pale, grey, as no tree of a location is.
			 */
			gpu.PlantSky = gpu.PlantSky || renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([0, 0, 0, 128])}, {Nearest: true});
			values.uGlowOn = 1;
			values.uGlow = gpu.PlantSky;
			values.uGlowPlace = [0, 0, 1];
			values.uSkyFloor = 0;
			/*
			 * What a leaf mirrors of the sky left out, as with the reflections of the screen on (a location: they show what a
			 * leaf as rough mirrors, little). Regression: the sky on each card of leaves seen aslant, the crowns grey.
			 */
			values.uScreenMirror = 1;

			return values;
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

		/*
		 * A draw of the view (never of a picture kept: a bake, a target) that leaves out a program the card has not made yet:
		 * the scene waits for it behind its veil (loading), the page does not; in a frame of its loop only (scene.Looping), one
		 * asked for by hand waits for it. Regression: a draw waited for the card, and
		 * the Orbit demo stood 29 s in one task while its globe's program was made (17 s under load).
		 * True when it drew: what keeps a draw (a bake a part at a frame) goes on only then.
		 */
		function drawReady (mesh, program, values, options) {
			if (scene.Looping && !programReady(program)) return false;

			renderer.Draw(mesh, program, values, options);

			return true;
		}

		/* Whether the card made a program (one not made for long is waited for then: Renderer, Patience). */
		function programReady (program) {
			return renderer.Ready(program);
		}

		engine.ProgramReady = programReady;

		/* The same for the traits: what they draw of the view each frame (not what they bake and keep). */
		engine.DrawReady = drawReady;

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

			needData(object, globe);

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

			/*
			 * Its program not made yet: the sphere of its picture meanwhile; its squares asked for all the same (above), made
			 * by the workers while the card makes the program.
			 */
			if (scene.Looping && !programReady(gpu.Ground)) return false;

			laid = groundTiles(eye, globe.Altitude);

			nodes.forEach(function (node) {
				groundDraw(node, gpu.Ground, object, field, eye, matrix, {
					uSun: sun,
					uSunColor: sunColor,
					uFog: Math.max(field.Radius * 0.02, globe.Altitude * 3),
					uHigh: Math.min(1, globe.Altitude / 100),
					uRelief: Math.max(1, Math.min(6, globe.Altitude / 150)),
					uSky: clouds ? scene.Baked[object.ID].Sky : noLights(),
					uCloudsOn: clouds ? 1 : 0,
					uDrift: engine.CloudDrift(object),
					uCloudTint: clouds ? cloudTint(object) : [1, 1, 1]
				}, idle(), laid);
			});

			forget(globe);

			return nodes.length > 0;
		}

		/*
		 * How far the ground of a body is seen from over it (km): three times as far as its horizon is at that height, and a
		 * tenth of its radius more (its hills over it). One for the ground of its surface and the far ground of a location.
		 */
		function farOf (field, altitude) {
			return Math.max(50, Math.sqrt(altitude * (2 * field.Radius + altitude)) * 3 + field.Radius * 0.1);
		}

		/*
		 * A square of the ground of a body drawn (the Ground shader): its globe, the far ground round a location and the ground
		 * of its surface alike, own the values of the one that draws it (its sun, its fog, how high, its clouds...) over those
		 * of the body, light its shadows (idle() or those of the surface), laid its tiles. Regression: the values of the body
		 * written three times, each draw of its own.
		 */
		function groundDraw (node, program, object, field, eye, matrix, own, light, laid) {
			var colors = object.Look.Colors;

			renderer.Draw(node.Mesh, program, Object.assign({
				uViewProjection: matrix,
				uOffset: vectors.Subtract(node.Center, eye),
				uCenter: node.Center,
				uColors: [].concat(colors[0], colors[1], colors[2], colors[3]),
				uPainted: field.Painted ? 1 : 0,
				uWater: object.Look.Water,
				uIce: object.Look.Ice,
				uAir: object.Look.Atmosphere,
				uRadius: field.Radius,
				uTime: scene.Seconds,
				uRelief: 1,
				uLights: lightsOf(object),
				uLightsOn: lightsOf(object) === noLights() ? 0 : 1,
				uSky: noLights(),
				uCloudsOn: 0,
				/* Its water mirrors its own sky (uMirror of the far ground round a location: drawHorizon sets it). */
				uMirror: [0, 0, 0, 0]
			}, own, light, tiled(node), laid, weatherValues(object, scene.Baked[object.ID]), ringUnder(object, field.Radius)), {Cull: 'back'});
		}

		/*
		 * The far ground round a location (scene.Horizon): the ground of its body, as it is drawn from over its surface, past
		 * the ground of the location. Behind all: drawn first (nothing of depth is drawn before it, the stars and the sky keep
		 * none) in all the depths of a view of its own, from about the edge of the location to the far end, its own hills
		 * hiding what lies behind them; then its depths are cleared, and all of the location comes over it. Regression: drawn
		 * after it in the depths past the farthest point of the location, a few steps of depth for all of it, the slopes
		 * behind a ridge were drawn over its slopes before them (dark blotches, then stripes, all over its hills). The air of
		 * the scene takes it as far as that, its own air the rest of the way.
		 */
		function drawHorizon (seen) {
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
			var sun;
			var sunColor;
			var nodes;
			var laid;
			var colors;
			var near;
			var depths;

			if (!object || !frame || !object.Look || !scene.Ground) return;

			field = horizon.Field;

			/* A way of the location in the frame of the body: X, up (its middle) and Z (to its south). */
			function toBody (way) {
				return [0, 1, 2].map(function (axis) {
					return way[0] * frame.X[axis] + way[1] * frame.Middle[axis] - way[2] * frame.North[axis];
				});
			}

			up = frame.Direction(camera.Position[0], camera.Position[2]);

			/*
			 * The eye as high over the far ground: on a planet of its own the heights of the location are those of the planet; a
			 * location of a ground of its own (a body with none) lies on its body as high as the highest of its ground under it and
			 * round it (horizonTop, once). Regression: there the eye stood under the far ground (kilometres of its relief over the
			 * location), then, of the height of its middle alone, under the squares round it (their grid coarser than its ground):
			 * of them only the skirts of its squares were seen from under them, a net of strips over the sky.
			 */
			if (!located.Planet && horizon.Top === undefined)
				horizon.Top = horizonTop(field, frame);

			eye = vectors.Scale(up, field.Radius + (located.Planet ? 0 : horizon.Top) + camera.Position[1] / 1000);
			look = toBody(vectors.Normalize(vectors.Subtract(camera.Target, camera.Position)));
			view = math.LookAt([0, 0, 0], look, toBody(camera.Up));

			horizon.Eye = eye;
			horizon.Up = up;
			horizon.Altitude = Math.max(0.002, vectors.Length(eye) - field.Radius - field.Elevation(up));

			far = farOf(field, horizon.Altitude);
			near = horizonNear();
			matrix = math.Multiply(math.Perspective(camera.Fov, renderer.Width / Math.max(1, renderer.Height), near, far), view);

			/*
			 * Lit as the ground of the location is, by its very sun (scene.Ground: its way, its colour through the air of the
			 * body, the moon at night); of the colours of the lands of the location on a body with no planet of its own (locationLands).
			 * Regression: lit by the star as it is in space and of the colours of the body, a white band round a location under
			 * the haze of Titan, a beige far ground far brighter than the grey lands round the eye.
			 */
			sun = vectors.Normalize(toBody(scene.Ground.Sun));
			sunColor = scene.Ground.SunColor;
			colors = located.Planet ? object.Look.Colors : horizon.Colors || (horizon.Colors = locationLands(object).Colors);

			/* The farthest first. */
			nodes = patches(horizon).map(function (node) {
				return {Node: node, Far: vectors.Distance(node.Center, eye)};
			}).sort(function (a, b) {
				return b.Far - a.Far;
			});

			laid = groundTiles(eye, horizon.Altitude);

			nodes.forEach(function (each) {
				groundDraw(each.Node, gpu.Ground, object, field, eye, matrix, {
					uSun: sun,
					uSunColor: sunColor,
					uColors: [].concat(colors[0], colors[1], colors[2], colors[3]),
					uFog: Math.max(field.Radius * 0.02, far * 0.6),
					uHigh: Math.min(1, horizon.Altitude / 100),
					/* Its water mirrors the sky of the location as the sea of the location does (drawSea: its air, its day). */
					uMirror: groundAir(scene.Ground).slice(0, 3).concat([Math.max(1e-4, scene.Ground.Day * (1 - scene.Ground.Cover * scene.Ground.Cover * 0.5))])
				}, idle(), laid);
			});

			/*
			 * Its depths of its own view gone, the location drawn over all of it (its draws wrote the depth: the mask is on), then
			 * those of the location's view put where it was (HorizonDepth): the fog, the clouds and the weather of the air after
			 * the scene see a ground there as far as it is, not the sky. Regression: of no depth, under the sky's weather (a grey
			 * band of a shower over its hills), the clouds of the sky over it and no haze, its horizon sharp and dark.
			 */
			if (nodes.length) {
				depths = renderer.CopyDepth();

				renderer.GL.clear(renderer.GL.DEPTH_BUFFER_BIT);

				if (depths)
					renderer.Draw(gpu.Quad, gpu.HorizonDepth, {uDepth: depths, uMatrix: seen, uInverse: math.Invert(seen), uForward: vectors.Normalize(vectors.Subtract(camera.Target, camera.Position)), uRange: [near * 1000, far * 1000], uPlace: [camera.Position[0], camera.Position[2]], uHalf: scene.Ground.Field.Size / 2 * 1.125}, {Blend: 'over', Cull: 'none'});
			}

			forget(horizon);
		}

		/*
		 * The highest of the ground of a body (km over its radius, no lower than it) under a location and round it, as far past
		 * its edges as its half: of 7 by 7 points of it.
		 */
		function horizonTop (field, frame) {
			var size = scene.Ground.Field.Size;
			var top = 0;
			var i;
			var j;

			for (i = -3; i <= 3; i++) {
				for (j = -3; j <= 3; j++)
					top = Math.max(top, field.Elevation(frame.Direction(i * size / 3, j * size / 3)));
			}

			return top;
		}

		/*
		 * The near plane of the view of the far ground (km): half the way to the circle within the ground of the location, however
		 * it is turned (what is nearer is under the location, at the side of the view too), no nearer than 10 m; the farther it
		 * is, the finer its depths are far off. Regression: of the way to its edges as if it were not turned, the far sea past its
		 * edge was cut away, the skirts of its squares seen under it, walls.
		 */
		function horizonNear () {
			var camera = scene.Camera;
			var edge = scene.Ground.Field.Size / 2 - Math.hypot(camera.Position[0], camera.Position[2]);

			return Math.max(0.01, edge / 2 / 1000);
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
				var cells = surface.Resolution || 32;
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
				/*
				 * Its picture 64 texels a side near the eye, 32 farther than three of its sides (toward the horizon, its texels as
				 * small on the screen): a quarter of the work. Regression: all of them 64, 0.45 s each under load, and a view from
				 * 200 m (some 350 squares) missed 110 to 150 of them for most of a minute.
				 */
				var far = vectors.Distance(vectors.Scale(vectors.Normalize(terrain.Face(face, u, v)), field.Radius), surface.Eye || [0, 0, 0]) > size * Math.PI / 4 * field.Radius * 3;
				var picture = field.Picture ? far ? 32 : 64 : 0;
				var made;

				if (level) {
					askPiece(surface, key, 'Sphere', [face, u, v, size, surface.Resolution || 32, picture, picture && standsOn(size) ? picture : 0], function (piece) {
						made = piece || field.Patch(face, u, v, size, surface.Resolution || 32);

						surface.Nodes[key] = pictured({Mesh: renderer.Mesh(made.Geometry), Center: made.Center, Error: errorOf(face, u, v, size), Used: surface.Frame, Place: [face, u, v, size, level]}, made.Picture, [face, u, v, size, field.Radius], field.Planet ? nearMaterials(field).Lands : null);

						if (made.Things)
							things(surface.Nodes[key], made.Things, size);
					});

					return;
				}

				made = field.Patch(face, u, v, size, surface.Resolution || 32);

				surface.Nodes[key] = {Mesh: renderer.Mesh(made.Geometry), Center: made.Center, Error: errorOf(face, u, v, size), Used: surface.Frame, Place: [face, u, v, size, level]};

				if (picture)
					askPiece(surface, key + ':picture', 'SpherePicture', [face, u, v, size, picture], function (piece) {
						if (surface.Nodes[key] && piece)
							pictured(surface.Nodes[key], piece.Picture, [face, u, v, size, field.Radius], field.Planet ? nearMaterials(field).Lands : null);
					});
			}

			/*
			 * What stands on a square of the surface of a planet that paints itself, as fine as 80 km across or finer (the
			 * squares round the eye low over it: its woods and its houses are seen from there, nearer a location is landed in):
			 * made with the square, of its picture (64 texels a side) in the same job of a worker, kept in the browser with it
			 * (SceneCache). Regression: a job of its own made the picture again, a square took twice as long to come.
			 */
			function standsOn (size) {
				return !!field.Planet && !surface.Globe && size * Math.PI / 4 * field.Radius <= 80;
			}

			function things (node, piece, size) {
				if (!piece.Geometry.Positions.length && !(piece.Trees && piece.Trees.Positions.length)) return;

				node.Things = {Mesh: piece.Geometry.Positions.length ? renderer.Mesh(piece.Geometry) : null, Trees: piece.Trees && piece.Trees.Positions.length ? renderer.Mesh(piece.Trees) : null, Center: piece.Center, Size: size * Math.PI / 4 * field.Radius, Woods: piece.Woods, Houses: piece.Houses, Plants: piece.Plants && piece.Plants.Places.length ? piece.Plants : null, ID: ++scene.ThingsMade};
			}

			/*
			 * The squares under the eye, of every level down to the finest it will want there, and the three beside each: asked
			 * at once, nearest first, kept while they wait. Regression: a square asked for its parts only when it was made, so
			 * a level came a job after the one over it, fourteen jobs one after another (some 20 s) before the ground under a
			 * landing was sharp, its workers idle between.
			 */
			function ahead () {
				var eye = vectors.Normalize(surface.Eye);
				var ax = Math.abs(eye[0]);
				var ay = Math.abs(eye[1]);
				var az = Math.abs(eye[2]);
				var at = ax >= ay && ax >= az ? (eye[0] > 0 ? [0, -eye[2] / ax, -eye[1] / ax] : [1, eye[2] / ax, -eye[1] / ax]) : ay >= az ? (eye[1] > 0 ? [2, eye[0] / ay, eye[2] / ay] : [3, eye[0] / ay, -eye[2] / ay]) : (eye[2] > 0 ? [4, eye[0] / az, -eye[1] / az] : [5, -eye[0] / az, -eye[1] / az]);
				var size = 2;
				var level = 0;
				var u = 0;
				var v = 0;

				while (level < 17 && size * Math.PI / 4 * field.Radius > (surface.Finest || 0) && vectors.Distance(vectors.Scale(vectors.Normalize(terrain.Face(at[0], u, v)), field.Radius), surface.Eye) < field.Radius * size * 0.75 * 2.2 * (surface.Eager || 1)) {
					var half = size / 2;

					[[u - half / 2, v - half / 2], [u + half / 2, v - half / 2], [u - half / 2, v + half / 2], [u + half / 2, v + half / 2]].forEach(function (part) {
						var key = keyOf(at[0], part[0], part[1], level + 1);
						var direction = vectors.Normalize(terrain.Face(at[0], part[0], part[1]));

						if (surface.Nodes[key]) surface.Nodes[key].Used = surface.Frame;
						else if (!hidden(direction, half)) missing.push({Face: at[0], U: part[0], V: part[1], Size: half, Level: level + 1, Near: vectors.Distance(vectors.Scale(direction, field.Radius), surface.Eye) - field.Radius * 8});
					});

					u = at[1] < u ? u - half / 2 : u + half / 2;
					v = at[2] < v ? v - half / 2 : v + half / 2;
					size = half;

					level++;
				}
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
				if (level < 17 && (near < field.Radius * size * 0.75 * 2.2 * (surface.Eager || 1) || near < field.Radius * size * 10 && (node.Error || 0) / Math.max(near, 1e-6) * focal > 1.5) && size * Math.PI / 4 * field.Radius > (surface.Finest || 0)) {
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

					/*
					 * Each by how near its nearest edge is, not its middle nor that of the square over it, after those under the
					 * eye (ahead, first of all). Regression: the parts of a square of thousands of kilometres waited behind all the
					 * small ones of the view (its middle far), so half a view from 300 km stayed of it, other in color, a straight
					 * edge across, for most of a minute.
					 */
					absent.forEach(function (part) {
						missing.push({Face: face, U: part[0], V: part[1], Size: half, Level: level + 1, Near: Math.max(0, vectors.Distance(vectors.Scale(vectors.Normalize(terrain.Face(face, part[0], part[1])), field.Radius), surface.Eye) - half * Math.PI / 4 * field.Radius * 0.71)});
					});
				}

				wanted.push(node);
			}

			surface.Frame++;

			for (face = 0; face < 6; face++)
				visit(face, 0, 0, 2, 0);

			ahead();

			/* The nearest first, for as long as a frame can spare. */
			missing.sort(function (a, b) {
				return a.Near - b.Near;
			});

			surface.Missing = missing.length;

			missing.some(function (one) {
				build(one.Face, one.U, one.V, one.Size, one.Level);

				return window.performance.now() - started > 5 || terrain.Work().Waiting() > 8;
			});

			coarserBeside(wanted);

			return wanted;
		}

		/*
		 * How many levels coarser the square drawn beside each edge of each square drawn is (Edges: its first column, its
		 * last, its first row, its last; at most 3, none over the edge of a face): its points there go to lie on that edge
		 * (uEdges, SpherePatch).
		 */
		function coarserBeside (wanted) {
			var drawn = {};

			function keyOf (face, u, v, level) {
				return face + ':' + u.toFixed(6) + ':' + v.toFixed(6) + ':' + level;
			}

			wanted.forEach(function (node) {
				if (node.Place)
					drawn[keyOf(node.Place[0], node.Place[1], node.Place[2], node.Place[4])] = true;
			});

			wanted.forEach(function (node) {
				var place = node.Place;

				node.Edges = [0, 0, 0, 0];

				if (!place) return;

				[[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (way, edge) {
					var u = place[1] + way[0] * place[3] * 0.501;
					var v = place[2] + way[1] * place[3] * 0.501;
					var level;

					if (Math.abs(u) > 1 || Math.abs(v) > 1) return;

					for (level = place[4] - 1; level >= 0; level--) {
						var size = 2 / Math.pow(2, level);

						if (drawn[keyOf(place[0], -1 + (Math.floor((u + 1) / size) + 0.5) * size, -1 + (Math.floor((v + 1) / size) + 0.5) * size, level)]) {
							node.Edges[edge] = Math.min(3, place[4] - level);

							return;
						}
					}
				});
			});
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
			var aired = surface.Aired || airAround(object, surface.Altitude);

			if (!cover || !object.Look.Atmosphere[3]) return null;

			self.Weather = cover > 0.7 ? 'overcast' : cover > 0.3 ? 'cloudy' : 'clear';

			/*
			 * Of the weather of its map when it has one (WeatherOver, the very graph its clouds are baked of): rain under its clouds
			 * that rain (snow where it is cold), a storm under its towers. Regression: none, it is new.
			 */
			if (!surface.WeatherSeen || scene.Seconds - surface.WeatherSeen > 0.5) {
				surface.WeatherSeen = scene.Seconds;
				surface.WeatherOver = weatherOver(object, surface.Up);
			}

			if (surface.WeatherOver)
				self.Weather = surface.WeatherOver.Rain > 0.3 ? surface.WeatherOver.Warm < 0.3 ? 'snow' : surface.WeatherOver.Kind > 0.75 ? 'storm' : 'rain' : surface.WeatherOver.Cover > 0.7 ? 'overcast' : surface.WeatherOver.Cover > 0.3 ? 'cloudy' : 'clear';

			/*
			 * Of the weather of the planet, when it has one: a shell of its clouds round it (SceneLighting), the very ones its
			 * globe shows from higher; else a layer of 3 to 9 km over the eye. Regression: a flat layer, cut 180 km away, its
			 * noise of the place of the eye: slabs and stripes from 20 to 60 km, another sky than the globe's above 60.
			 */
			var made = scene.Baked[object.ID];
			var weather = made && made.Weather && made.WeatherFaces >= 6 ? made.Weather : null;
			/* How fast the eye goes up or down, for the clouds of frames before: none of them while it comes down fast. */
			var moving = Math.min(1, Math.abs(surface.Altitude - (surface.CloudAltitude || surface.Altitude)) / Math.max(0.05, surface.Altitude) * 40);

			surface.CloudAltitude = surface.Altitude;

			/* Decks that hide nearly all the sky (airAround Cover: those of Venus) are an overcast, whatever its weather says. */
			if (aired.Cover > 0.85)
				self.Weather = 'overcast';

			/* Its main deck of clouds (airAround: 3 to 9 km on the Earth), of its colour, lit as much as light gets there. */			var layer = aired.Layer || [3, 9];
			var tint = [aired.Color[0] * aired.Tint[0], aired.Color[1] * aired.Tint[1], aired.Color[2] * aired.Tint[2]];
			var dim = aired.Dim;

			return {Turn: [axes.East[0], axes.Up[0], axes.North[0], axes.East[1], axes.Up[1], axes.North[1], axes.East[2], axes.Up[2], axes.North[2]], From: [surface.Eye[0] * 0, surface.Altitude, 0], Sun: [vectors.Dot(sun, axes.East), vectors.Dot(sun, axes.Up), vectors.Dot(sun, axes.North)], SunLight: [sunColor[0] * 2 * day * aired.Color[0], sunColor[1] * 2 * day * aired.Color[1], sunColor[2] * 2 * day * aired.Color[2]], SkyTone: [(0.34 * day + 0.01) * dim * tint[0], (0.4 * day + 0.012) * dim * tint[1], (0.5 * day + 0.02) * dim * tint[2]], Under: [0, 0, 0], Layer: [layer[0], layer[1], 0.25], Over: true, Shell: weather ? [surface.Field.Radius, Math.max(0, surface.Field.Elevation(surface.Up)), 1 - fadeBetween(80, 150, surface.Altitude), 1] : null, Weather: weather, Moving: moving};
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

			/* Its inside and who walks in it, of its frame (SceneAboard). */
			(engine.AfootSurfaceObjects ? engine.AfootSurfaceObjects(hero.ID) : []).forEach(function (object) {
				/* Not before it has a place (the first frame over the surface). */
				if (trait(object, 'Model') && !object.Hidden && object.World)
					gatherModel(lists, object, trait(object, 'Model'));
			});

			/* What glows of it is not drawn over the surface: its lists start again each frame. */
			Object.keys(scene.GlowLists || {}).forEach(function (name) {
				scene.GlowLists[name].Count = 0;
			});

			day = Math.max(0, Math.min(1, vectors.Dot(sun, flying.Axes.Up) * 3 + 0.2));

			var dim = flying.Aired ? flying.Aired.Dim : 1;

			common = Object.assign({uViewProjection: matrix, uCamera: [0, 0, 0], uLightPositions: [sun[0] * 1e6, sun[1] * 1e6, sun[2] * 1e6, 0, 0, 0, 0, 0, 0, 0, 0, 0], uLightColors: [sunColor[0] * 1.15, sunColor[1] * 1.15, sunColor[2] * 1.15, 0, 0, 0, 0, 0, 0, 0, 0, 0], uLightCount: 1, uSkyLight: [(0.3 * day + 0.01) * dim, (0.38 * day + 0.012) * dim, (0.5 * day + 0.02) * dim], uFloorLight: [0.12 * day * dim, 0.11 * day * dim, 0.1 * day * dim], uSkySun: sun, uAmbient: [0.05 + 0.12 * day * dim, 0.055 + 0.13 * day * dim, 0.07 + 0.16 * day * dim], uOccluderCount: 0, uOccluders: new Array(16).fill(0), uTime: scene.Time, uHighlight: [0, 0, 0, 0], uWind: 0, uWet: 0, uSnowed: 0, uRainDrops: 0, uEyeAt: [0, 0, 0], uTime2: scene.Seconds % 1000, uMoving: 0, uSteady: 0, uCut: [0, 0, 0, 0], uHoleAt: [0, 0, 0, 0], uHoleHalf: [0, 0, 0, 0], uHeroFade: 0, uNightGlow: scene.Ground ? scene.Ground.Night || 0 : 1, uScreenMirror: engine.ScreenMirror && engine.ScreenMirror() ? 1 : 0, uLevel: engine.LevelColor('near', 0)}, idle(), localLights(), self.WindValues(scene.Seconds));

			renderer.Shared(common);

			/*
			 * What is seen through (glass: the window of its inside, SceneAboard) after all the rest, over it, its depth not written.
			 * Regression: drawn as all the rest, the window was a pane of grey: nothing of the ground and the sky through it.
			 */
			Object.keys(lists).sort(function (a, b) {
				return (lists[a].Material && seeThrough(lists[a].Material) ? 1 : 0) - (lists[b].Material && seeThrough(lists[b].Material) ? 1 : 0);
			}).forEach(function (name) {
				var list = lists[name];
				if (!list.Count) return;

				upload(name, list);

				drawList(name, list, common, {Origin: [0, 0, 0], Blend: true, Values: {uSeasonOn: 0}});
			});

			/* The shells of its shield, where it is over the surface. Regression: drawn in space only, not of the ship over a planet. */
			var shellLists = scene.SurfaceShellLists = scene.SurfaceShellLists || {};

			Object.keys(shellLists).forEach(function (name) {
				shellLists[name].Count = 0;
			});

			shellsOf(shellLists, hero);

			Object.keys(shellLists).forEach(function (name) {
				if (shellLists[name].Count)
					upload(name, shellLists[name]);
			});

			drawShells(shellLists, function (values) {
				return Object.assign(Object.create(common), values, {uOrigin: [0, 0, 0]});
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
			var far = farOf(field, surface.Altitude);
			var view = math.LookAt([0, 0, 0], surface.Look, surface.ViewUp || surface.Axes.Up);
			var projection = math.Perspective(scene.Camera.Fov, aspect, near, far);
			var matrix = math.Multiply(projection, view);
			var star = scene.Order.filter(function (each) {
				return trait(each, 'Star') && each.World;
			})[0];
			var sun = star && object.World ? math.Apply(math.Invert(object.Turn) || math.Identity(), vectors.Normalize(vectors.Subtract(star.World, object.World))) : [0, 1, 0];
			/* As much light as the star gives so far from it (starShine), the same as in space. */
			var shine = star && object.World ? starShine(star, vectors.Distance(star.World, object.World)) : 1;
			var sunColor = star ? paint(star.Color).slice(0, 3).map(function (part) {
				return part * shine;
			}) : [1, 1, 1];
			var air = object.Look.Atmosphere;
			var nodes = patches();
			var plants = planted(nodes);
			var reach = [engine.PlantsReach[0] * 1000, engine.PlantsReach[1] * 1000];
			var aired = airAround(object, surface.Altitude);
			var thick = aired.High;
			var shade = idle();
			var extent;
			var posted;
			var laid;
			var landed;

			sun = vectors.Normalize(sun);

			/* Under thick air the light of its star as much as gets there, of the colour of its air (airAround: none taken on the Earth). */
			sunColor = sunColor.map(function (part, i) {
				return part * aired.Dim * aired.Tint[i];
			});
			surface.Aired = aired;

			var lit = vectors.Normalize(vectors.Lerp(sun, surface.Up, aired.Diffuse));

			/* The shadows of the relief round the eye, while the sun is up. */
			if (shadowsWanted() && vectors.Dot(sun, surface.Up) > 0.03 && aired.Diffuse < 0.6) {
				extent = Math.max(0.15, surface.Altitude * 4);

				shade = castShadow(sun, surface.Eye, surface.Eye, extent, Math.max(extent * 2, field.Height * 2), function (light) {
					nodes.forEach(function (node) {
						renderer.Draw(node.Mesh, gpu.GroundDepth, {uViewProjection: light, uOffset: vectors.Subtract(node.Center, surface.Eye)}, {Cull: 'back'});

						/* Its woods and houses cast their shadows too; not its trees where all of them are plants. */
						standing(node).forEach(function (mesh) {
							if (plants && mesh === node.Things.Trees && vectors.Distance(node.Things.Center, surface.Eye) + node.Things.Size * 0.71 < engine.PlantsReach[0]) return;

							renderer.Draw(mesh, gpu.ThingsDepth, {uViewProjection: light, uOffset: vectors.Subtract(node.Things.Center, surface.Eye), uCenter: node.Things.Center}, {Cull: 'none'});
						});
					});

					if (plants)
						engine.ScatterPlanetShadow(math.Multiply(light, plants.Frame.Matrix), plants.Eye, reach);
				});
			}

			engine.CosmosBake();

			weathers();

			posted = engine.PostBegin();

			renderer.Clear([0, 0, 0, 1]);

			engine.CosmosDraw(matrix, matrix);

			if (self.Background && self.Background !== 'false')
				renderer.Draw(gpu.Stars, gpu.Far, {uViewProjection: math.Multiply(math.Perspective(scene.Camera.Fov, aspect, 0.1, 200), view), uRatio: renderer.Ratio}, {Depth: false, DepthWrite: false, Blend: 'add'});

			renderer.Draw(gpu.Quad, gpu.Sky, Object.assign({uInverse: math.Invert(matrix), uSun: sun, uSunColor: sunColor, uAir: air, uUp: surface.Axes.Up, uHigh: thick, uDip: Math.sqrt(Math.max(0, 1 - Math.pow(radiusOf(object) / (radiusOf(object) + Math.max(0, surface.Altitude)), 2))), uSunRadius: discOf(star, object), uNoWisps: weatherValues(object, scene.Baked[object.ID]).uWeatherOn, uCover: aired.Layer && surface.Altitude < aired.Layer[0] ? aired.Cover : 0, uDiffuse: aired.Diffuse}, self.SkyValues(scene.Seconds)), {Depth: false, DepthWrite: false, Blend: 'alpha', Cull: 'none'});

			landed = groundNear(field, surface.Eye, surface.Altitude);
			laid = landed.Values;

			nodes.forEach(function (node) {
				groundDraw(node, landed.Program, object, field, surface.Eye, matrix, {
					uSun: lit,
					uSunColor: sunColor,
					uAir: air,
					uFog: Math.max(field.Radius * 0.02, far * 0.6),
					uHigh: thick,
					/* High over its clouds (from 80 km, all from 150), they are drawn on its ground as its globe draws them. */
					uCloudsOn: weatherValues(object, scene.Baked[object.ID]).uWeatherOn * fadeBetween(80, 150, surface.Altitude)
				}, shade, laid);
			});

			/*
			 * What stands on the squares near (ScenePlanet.PatchThings), lit and hazy as the ground under it; Levels shows it as a
			 * proxy. Its trees fade out over the last 300 m of their reach (into the woods the ground draws), and where the plants
			 * stand for them they give way to them, each pixel the one the plants leave (the same dither). Regression: the trees
			 * ended in a line 1.2 km from the eye, and near it they were cones and domes, no plant of their species.
			 */
			nodes.forEach(function (node) {
				standing(node).forEach(function (mesh) {
					/* Its trees not drawn at all where all of them are plants (not only their pixels: their corners cost too). */
					if (plants && mesh === node.Things.Trees && vectors.Distance(node.Things.Center, surface.Eye) + node.Things.Size * 0.71 < engine.PlantsReach[0]) return;

					var band = mesh !== node.Things.Trees ? [0, 0, 0, 0] : [plants ? engine.PlantsReach[0] : 0, plants ? engine.PlantsReach[1] : 0, engine.TreesReach - 0.3, engine.TreesReach];

					renderer.Draw(mesh, gpu.Things, Object.assign({uViewProjection: matrix, uOffset: vectors.Subtract(node.Things.Center, surface.Eye), uCenter: node.Things.Center, uSun: lit, uSunColor: sunColor, uAir: air, uFog: Math.max(field.Radius * 0.02, far * 0.6), uHigh: thick, uLevel: engine.LevelColor('proxy', 1), uBand: band, uDither: engine.PostStep ? engine.PostStep() : 0}, shade), {Cull: 'back'});
				});
			});

			/* The plants of SceneFlora near the eye, in their frame (SceneScatter). */
			if (plants)
				engine.ScatterPlanetDraw(plantValues(plants, lit, sunColor, shade), math.Multiply(matrix, plants.Frame.Matrix), plants.Eye, reach, inFrame(plants.Frame, sun, true), plantLight(sun, sunColor).Sun);

			/*
			 * The glare of the star as in space (drawGlare), far along its way, behind what stands before it; while it is over
			 * the horizon of the eye (from high up far under the level of the ground under it). Regression: from a body it was
			 * its disc of the sky alone, a white dot from orbit, never blinding as from space.
			 */
			if (star && object.World) {
				var glareAt = far * 0.5;
				var dip = Math.sqrt(Math.max(0, 1 - Math.pow(radiusOf(object) / (radiusOf(object) + Math.max(0, surface.Altitude)), 2)));
				var over = Math.max(0, Math.min(1, (vectors.Dot(sun, surface.Axes.Up) + dip + 0.03) / 0.04));
				if (over > 0)
					drawGlare(star, vectors.Scale(sun, glareAt), [view[0], view[4], view[8]], [view[1], view[5], view[9]], discOf(star, object) * glareAt, glareAt * Math.tan(scene.Camera.Fov * Math.PI / 360) * 2 / Math.max(1, height), realness() >= 0.999 ? starLight(star, vectors.Distance(star.World, object.World)) : 0, function (values) {
						values.uViewProjection = matrix;

						return values;
					}, over);
			}

			/*
			 * With the eye in the ship (SceneAboard: ShipNear) the ship is a pass of its own, of a near plane of centimetres, laid
			 * in the nearest part of the depth: nearer than all the world, whose depth stays its own (the air and the clouds after
			 * it read it). Regression: of one near plane of centimetres all past 2 km lay on the far plane, cut off: through the
			 * window of a ship coming down no ground, no sky.
			 */
			if (surface.Ship && surface.ShipNear) {
				renderer.DepthRange(0, 0.0005);

				drawSurfaceShip(math.Multiply(math.Perspective(scene.Camera.Fov, aspect, surface.ShipNear, surface.ShipFar || 5), view), lit, sunColor);

				renderer.DepthRange();
			}
			else if (surface.Ship) {
				drawSurfaceShip(matrix, lit, sunColor);
			}

			if (posted)
				engine.PostEnd(Object.assign({Matrix: matrix, Sun: sun, SunColor: sunColor, Sky: false, Heat: surface.Heat, Clouds: surfaceClouds(surface, object, sun, sunColor)}, lens()));

			forget();
		}

		function frame (now, quiet, still) {
			var started = view.performance ? view.performance.now() : Date.now();
			var before = !quiet && renderer ? renderer.Counts() : null;

			/*
			 * The time of the game keeps to the clock on a slow machine too (up to a second, a page may have slept); what eases
			 * takes small steps. A clock that goes back (a frame given an earlier time) is no time: what eases backwards ran
			 * away to no number at all, and the view with it.
			 */
			var spent = scene.Last ? Math.max(0, Math.min(1, (now - scene.Last) / 1000)) : 0;
			var elapsed = Math.min(0.1, spent);

			scene.Last = now;
			scene.FrameElapsed = elapsed;

			/* Behind the veil while what the view needs is made (Preparing, the loop of the scene): the game does not go on yet. */
			if (still) {
				spent = 0;
				elapsed = 0;
			}

			self.RunBehaviours('Step', [elapsed, now]);

			/* The ships on a way far at once no player drives go on (SceneVehicles). */
			if (engine.TravelersStep)
				engine.TravelersStep(elapsed);

			/* Its lightning in a deck of water (SceneGiants). */
			if (engine.GiantStep)
				engine.GiantStep(elapsed);

			/* What is round the objects asked for, into the Ether (Probe). */
			if (scene.Probed)
				probeStep();

			/* A galaxy (SceneGalaxy): what it draws is all of the frame; the system waits behind it. */
			/*
			 * The names over the objects of the system left and the marks of aiming of its ship (.elemenx-scene-sight) are not on
			 * the map; back in a system they are again (the names not over a surface, nor in a location). Regression: out of a
			 * system its names (planets, stations) and the frames of the sight round them stood over the galaxy.
			 */
			if ((self.Setting === 'galaxy' || self.Setting === 'universe') && !scene.LabelsOff) {
				scene.LabelsOff = true;
				labels.hidden = true;

				sighted(false);
			}
			else if (self.Setting !== 'galaxy' && self.Setting !== 'universe' && scene.LabelsOff) {
				scene.LabelsOff = false;
				labels.hidden = !!(scene.Surface || scene.Location);

				sighted(true);
			}

			/* Landing and To orbit are not offered on the map (SceneLanding). */
			if ((self.Setting === 'galaxy' || self.Setting === 'universe') && engine.LandingOffer)
				engine.LandingOffer();

			if (self.Setting === 'galaxy' && engine.GalaxyFrame) {
				if (!quiet && renderer && !renderer.Lost && scene.Width && scene.Height) {
					engine.GalaxyFrame(elapsed);

					scene.Painted++;

					drawnCounted(before, started);
				}

				return;
			}

			/* A universe (SceneUniverse): its galaxies are all of the frame, as a galaxy is. */
			if (self.Setting === 'universe' && engine.UniverseFrame) {
				if (!quiet && renderer && !renderer.Lost && scene.Width && scene.Height) {
					engine.UniverseFrame(elapsed);

					scene.Painted++;

					drawnCounted(before, started);
				}

				return;
			}

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

					drawnCounted(before, started);
				}

				return;
			}

			/* On foot in a ship in flight (SceneAboard): the walk and the view are of its frame. */
			if (!(engine.AfootView && engine.AfootView(elapsed))) {
				if (scene.Ground) aimGround(elapsed);
				else aim(elapsed);
			}

			/* A cutscene sets what it moves first; then the camera that shows the world is placed. */
			if (engine.CinemaStep)
				engine.CinemaStep(elapsed);

			if (engine.CameraStep)
				engine.CameraStep(elapsed);

			engine.TriggersStep();

			if (engine.WeaponsStep)
				engine.WeaponsStep(elapsed);

			if (engine.SystemsStep)
				engine.SystemsStep(elapsed);

			if (engine.AboardStep)
				engine.AboardStep(elapsed);

			if (engine.TacticsStep)
				engine.TacticsStep(elapsed);

			if (engine.DebrisStep)
				engine.DebrisStep(elapsed);

			if (engine.PipingStep)
				engine.PipingStep(elapsed);

			if (engine.RigsStep)
				engine.RigsStep(elapsed);

			if (engine.VehiclesIdle)
				engine.VehiclesIdle(elapsed);

			if (!quiet && renderer && !renderer.Lost && scene.Width && scene.Height) {
				draw();

				adapt(elapsed);

				engine.PostTime(elapsed);

				scene.Painted++;

				drawnCounted(before, started);

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

			scene.Chosen = [];
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

				/* Seen whole: where its objects are now, not where those before were (the view stood in the middle, close). */
				if (!scene.Focus) {
					place(scene.Time);

					focusOn('', true);
				}
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
		engine.Hex = hex;
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

			/* On a ground the view holds the height it is given, as long as it follows nothing; a ground to come takes it. */
			if (scene.Ground) {
				scene.Ground.Target = target.slice();
				scene.Ground.Held = true;
			}
			else {
				scene.ViewHeld = true;
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
			var e;
			var period;
			var mean;
			var eccentric;
			var truly;

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
			else distance = unspread(length, parent);

			e = Math.min(0.99, Math.max(0, number(orbit.Eccentricity, 0)));

			/*
			 * Regression: on a long orbit the distance from the middle was taken for the half of its long axis, and the angle
			 * turned for the mean anomaly: the orbit lost its shape under the pointer. The body goes on its ellipse there.
			 */
			if (e > 0 && orbit.Unit !== 'radii') {
				period = number(orbit.Period, 0) || astronomy.Period(astronomy.Length(orbit.Distance), object.Around);
				mean = anomaly * Math.PI / 180 + Math.PI * 2 * scene.Time / period;
				eccentric = astronomy.Eccentric((mean % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), e);
				truly = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(eccentric / 2), Math.sqrt(1 - e) * Math.cos(eccentric / 2)) + turned * Math.PI / 180;
				eccentric = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(truly / 2), Math.sqrt(1 + e) * Math.cos(truly / 2));
				turned = (eccentric - e * Math.sin(eccentric) - (mean - Math.PI * 2 * Math.floor(mean / Math.PI / 2))) * 180 / Math.PI;
				distance /= 1 - e * Math.cos(eccentric);
			}

			return {Distance: distance, Anomaly: ((anomaly + turned) % 360 + 360) % 360};
		};

		/*
		 * The nearest and the farthest points of an orbit round its parent (in AU, not in radii): {Periapsis, Apoapsis}, each
		 * {Distance (AU from the middle), World (where it is in the view)}, and Middle (where the parent is); null with none.
		 */
		engine.Apses = function (id) {
			var object = scene.Objects[id];
			var orbit = trait(object, 'Orbit');
			var parent = object ? parentOf(object) : null;
			var a;
			var e;

			if (!orbit || orbit.Unit === 'radii' || !parent || !parent.World) return null;

			a = astronomy.Length(orbit.Distance);
			e = Math.min(0.99, Math.max(0, number(orbit.Eccentricity, 0)));

			if (!a)
				return null;

			return {
				Middle: parent.World.slice(),
				Periapsis: {Distance: a * (1 - e), World: vectors.Add(parent.World, spread(toView(astronomy.Turn(orbit, a * (1 - e), 0)), parent))},
				Apoapsis: {Distance: a * (1 + e), World: vectors.Add(parent.World, spread(toView(astronomy.Turn(orbit, -a * (1 + e), 0)), parent))}
			};
		};

		/*
		 * How far from the middle (AU) a point of the canvas puts the nearest (which periapsis) or the farthest (apoapsis)
		 * point of an orbit, along the line from the middle through it: where the ray of the view comes nearest to that line.
		 */
		engine.ApseAt = function (id, which, x, y) {
			var apses = engine.Apses(id);
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var line;
			var length;
			var away;
			var b;
			var c;
			var d;
			var f;
			var under;
			var s;

			if (!apses || !apses[which]) return null;

			line = vectors.Subtract(apses[which].World, apses.Middle);
			length = vectors.Length(line);

			if (!length)
				return null;

			line = vectors.Scale(line, 1 / length);
			away = vectors.Subtract(apses.Middle, ray.Origin);
			b = vectors.Dot(line, ray.Direction);
			c = vectors.Dot(ray.Direction, ray.Direction);
			d = vectors.Dot(line, away);
			f = vectors.Dot(ray.Direction, away);
			under = c - b * b;

			/* Looked at along the line: nothing to take. */
			if (under < 1e-9 * c) return null;

			s = (b * f - c * d) / under;

			return {Distance: unspread(Math.max(length * 0.01, s), parentOf(scene.Objects[id]))};
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

			/*
			 * Nearer than this is where the ray begins, not a hit: a ten-thousandth of a unit, or of the size of the object
			 * where it is smaller. Regression: a ship of real sizes (35 m a few billionths of a unit) was never hit.
			 */
			var tiny = Math.min(1e-4, vectors.Distance(body.Max, body.Min) * 1e-4);

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

				if (t > tiny && t < near) {
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

		/*
		 * The code of a graph of the scene (its prop, or Graphs[name]), else of the library (blueprints/<name> of
		 * ElemenxGraphics), made once: again only when the scene is given another. Null with none. Regression: each was
		 * compared with a new copy of the library (Elemenx.Resources gives one each time) and made again at every call, up to
		 * a millisecond each, some of them every frame (the shake of the camera, the season, the look of a warp).
		 */
		engine.GraphCode = function (prop, name, own) {
			var given = own || self.GraphOf(prop, name);
			var codes = scene.GraphCodes = scene.GraphCodes || {};
			var owned = scene.OwnCodes = scene.OwnCodes || (typeof WeakMap === 'function' ? new WeakMap() : null);
			var kept;
			var graph;

			/* One of an object of its own (a vehicle's WheelGraph): made once for that graph. */
			if (own && typeof own === 'object' && owned) {
				if (!owned.has(own))
					owned.set(own, graphCode(own));

				return owned.get(own);
			}

			if (own) {
				kept = codes['own:' + own];

				return kept ? kept.Code : (codes['own:' + own] = {Given: own, Code: graphCode(own)}).Code;
			}

			kept = codes[name];

			if (kept && kept.Given === given) return kept.Code;

			graph = given || Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + name);

			codes[name] = {Given: given, Code: graph ? graphCode(graph) : null};

			return codes[name].Code;
		};

		function graphCode (graph) {
			return self.$Service('Blueprints').Code(typeof graph === 'string' ? JSON.parse(graph) : JSON.parse(JSON.stringify(graph)));
		}

		/* A clip of an object: one that ends calls back and goes back to what the object was doing, a loop stays. */
		engine.Play = function (id, name, callback) {
			var object = scene.Objects[id];
			var settings = object ? trait(object, 'Model') : null;
			var made = settings && settings.Shape ? modelOf(object, settings) : null;
			var clip = made ? made.Clips[name] : null;
			var state;

			if (!clip)
				return false;

			/*
			 * A clip of the arms (Upper: a reload, a blow) played once by one of a skeleton that goes: a layer over its legs,
			 * they go on (Layer). Standing, it is played whole.
			 */
			if (clip.Upper && !clip.Loop && made.Joints && (walkingOf(object) || scene.Ways[id])) {
				object.Layer = {Name: name, Start: scene.Seconds, Callback: callback || null};

				return true;
			}

			state = object.Clip;

			if (clip.Loop) {
				object.Loop = name;

				if (state)
					state.Once = false;

				return true;
			}

			/* Faded in as its transition says (changeClip). */
			object.Clip = Object.assign(changeClip(made, state, name, 1, scene.Seconds), {Once: true, Callback: callback || null});

			return true;
		};
		engine.Walk = walk;
		engine.GroundAt = function (x, y) {
			return scene.Ground ? groundAt(x, y) : null;
		};
		engine.TakeOff = takeOff;
		engine.SurfaceClose = closeSurface;

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
			var left;
			var models = Object.keys(scene.Asked);
			var stages;
			var shares = 0;
			var broken = scene.Broken;
			var done = 0;
			var stage = '';
			var part;
			var shown;

			/* Models came (their own programs) or a ground: all they may draw asked for at once too. */
			if (scene.Warmed && (Object.keys(scene.Lists || {}).length !== scene.WarmedLists || !!scene.Ground !== !!scene.WarmedGround))
				warm();

			left = renderer ? renderer.Progress() : {Done: 0, Total: 0, Needed: 0};
			/* A model that could not be read counts as come: it holds nothing up. */
			stages = [{Name: 'programs', Done: left.Done, Total: left.Total}, {Name: 'models', Done: models.filter(function (name) {
				return library.Ready(name) || broken[name];
			}).length, Total: models.length}].concat(bakes(), scene.Preparing ? preparing() : []);

			/*
			 * Each stage a share of the way as long as it takes (its weight: the programs and the ground longest); the first not
			 * done is the one it is at.
			 */
			stages.forEach(function (one) {
				var weight = loadingWeights[one.Name] || 1;

				one.Label = stageText(one.Name);

				if (!one.Total) return;

				shares += weight;
				done += Math.min(1, one.Done / one.Total) * weight;

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

			/*
			 * Always how far it is, never an endless bar. Regression: when what was left was only made behind the page, the bar
			 * turned into one that waits and tells nothing.
			 */
			scene.LoadingStages = stages;

			if (self.Loading !== shown || self.LoadingStage !== stage || stagesKey(stages) !== scene.LoadingKey) {
				self.Loading = shown;
				self.LoadingStage = stage;
				self.LoadingText = stageText(stage);
				scene.LoadingKey = stagesKey(stages);

				self.$Emit('loading', {Part: part === null ? 100 : part, Stage: stage, Stages: stages.filter(function (one) {
					return one.Total > 0;
				}).map(function (one) {
					return {Name: one.Name, Label: one.Label, Done: one.Done, Total: one.Total};
				})});
			}

			return left.Needed > 0;
		}

		/* How long each stage takes, as a share of the bar. */
		var loadingWeights = {programs: 5, models: 3, ground: 3, surface: 3, globes: 2, galaxy: 2, plants: 1, rivers: 1, sky: 1, nebulae: 1};

		function stagesKey (stages) {
			return stages.map(function (one) {
				return one.Done + '/' + one.Total;
			}).join(',');
		}

		/*
		 * What the traits bake before the view can be shown (engine.Bakes: each a function giving {Name, Done, Total} or null):
		 * the sky of a system (a face of its cube a frame), the plane of a galaxy, the shapes of nebulae.
		 */
		engine.Bakes = engine.Bakes || [];

		function bakes () {
			var made = [];

			engine.Bakes.forEach(function (one) {
				var stage = one();
				if (stage && stage.Total)
					made.push(stage);
			});

			return made;
		}

		function baking () {
			return bakes().reduce(function (sum, one) {
				return sum + Math.max(0, one.Total - one.Done);
			}, 0);
		}

		/* What the view still waits for, stage by stage: the globes painted (strips of them), the squares of its ground, what grows round the eye. */
		function preparing () {
			var globes = {Name: 'globes', Done: 0, Total: 0};
			var missing;
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

			/*
			 * The squares of a globe near, as fine as the eye needs: how many are missing goes up and down as they come and more
			 * are asked for; told of the most missing yet. Regression: not a stage, the bar stood at 99 (the view) for seconds.
			 */
			missing = 0;

			Object.keys(scene.Globes).forEach(function (id) {
				missing += scene.Globes[id].Missing || 0;
			});

			scene.GlobeMost = Math.max(scene.GlobeMost || 0, missing);

			/*
			 * A ground or a location declared but not made yet: its stages are there from the start, so the bar does not run to
			 * its end on the programs and stand there while the ground is made (regression: 98 for six seconds).
			 */
			if (!ground && scene.Order.some(function (object) {
				return !!(trait(object, 'Terrain') || trait(object, 'Location'));
			})) return [flowing, globes, {Name: 'ground', Done: 0, Total: 1}, {Name: 'plants', Done: 0, Total: 1}];

			if (!ground)
				return [flowing, globes, {Name: 'surface', Done: scene.GlobeMost - missing, Total: scene.GlobeMost}];

			grown = engine.ScatterProgress ? engine.ScatterProgress(240) : {Done: 0, Total: 0};

			return [flowing, globes, {Name: 'ground', Done: Object.keys(ground.Nodes).length, Total: Object.keys(ground.Nodes).length + (ground.Missing === undefined ? 1 : ground.Missing)}, {Name: 'plants', Done: grown.Done, Total: grown.Total}];
		}

		/* The words of a stage of the loading. */
		function stageText (stage) {
			var words = {surface: Elemenx.Locale.Text('graphics.scene.stageSurface'), sky: Elemenx.Locale.Text('graphics.scene.stageSky'), galaxy: Elemenx.Locale.Text('graphics.scene.stageGalaxy'), nebulae: Elemenx.Locale.Text('graphics.scene.stageNebulae'), programs: Elemenx.Locale.Text('graphics.scene.stagePrograms'), models: Elemenx.Locale.Text('graphics.scene.stageModels'), rivers: Elemenx.Locale.Text('graphics.scene.stageRivers'), globes: Elemenx.Locale.Text('graphics.scene.stageGlobes'), ground: Elemenx.Locale.Text('graphics.scene.stageGround'), plants: Elemenx.Locale.Text('graphics.scene.stagePlants'), view: Elemenx.Locale.Text('graphics.scene.stageView')};

			return words[stage] || '';
		}

		var fps = this.$Service('FPS');
		var source = fps.Name('Scene');
		var counted = {At: 0, Frames: 0, Draws: 0, Triangles: 0, Time: 0};

		/*
		 * The numbers in the corner of Levels, twice a second: the draws and triangles of a frame (what it drew from its start
		 * to its end, all of its passes), its milliseconds of CPU, the tiles drawn as proxies and the copies of what is sown.
		 */
		/*
		 * What a frame it drew cost, added to what it drew since it was made (Drawn): its CPU from its start, its draws and
		 * triangles. Not the frames it rested through. Levels shows the same in its corner.
		 */
		function drawnCounted (before, started) {
			var ended = view.performance ? view.performance.now() : Date.now();
			var after = renderer.Counts();

			scene.DrawnCount.Frames++;
			scene.DrawnCount.Cpu += ended - started;
			scene.DrawnCount.Draws += after.Draws - before.Draws;
			scene.DrawnCount.Triangles += after.Triangles - before.Triangles;
			scene.DrawnCount.At = ended;

			if (self.Levels && self.Levels !== 'false')
				levelsCounted(before, after, started, ended);
		}

		function levelsCounted (before, after, started, ended) {
			var sown;

			counted.Frames++;
			counted.Draws += after.Draws - before.Draws;
			counted.Triangles += after.Triangles - before.Triangles;
			counted.Time += ended - started;

			if (ended - counted.At < 500) return;

			sown = self.Sown();
			self.LevelsText = Math.round(counted.Draws / counted.Frames) + ' draws · ' + Math.round(counted.Triangles / counted.Frames / 1000) + 'k triangles · ' + (counted.Time / counted.Frames).toFixed(1) + ' ms CPU · ' + (sown.Tiles || 0) + ' tiles · ' + sown.Copies + ' copies';
			counted.At = ended;
			counted.Frames = 0;
			counted.Draws = 0;
			counted.Triangles = 0;
			counted.Time = 0;
		}
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
			var left = baking();

			/* A galaxy waits for its programs and what it bakes alone: the globes of a system behind it are not drawn. */
			if (self.Setting === 'galaxy' || self.Setting === 'universe') return left + (renderer ? renderer.Progress().Needed : 0);

			/* The models it asked for, each till it came. */
			Object.keys(scene.Asked).forEach(function (name) {
				if (!library.Ready(name) && !scene.Broken[name])
					left++;
			});

			/*
			 * Regression: on the ground of a location the globes are drawn no more, neither the near one of its body nor the
			 * paint of the others (a moon): what they still missed was never made, and the veil over the location never went.
			 * There, the view waits for its ground and what grows on it alone.
			 */
			if (scene.Ground)
				return left + (scene.Ground.Missing === undefined ? 1 : scene.Ground.Missing) + (engine.ScatterPending ? engine.ScatterPending(240) : 0) + (renderer ? renderer.Progress().Needed : 0);

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
			warm();

			scene.Preparing = true;
			scene.PrepareSince = window.performance.now();
			scene.LoadingLeast = 0;
			scene.GlobeMost = 0;
			scene.Soft = !!soft;
			scene.Ready = 0;
		};

		engine.Waiting = waiting;

		/*
		 * All the programs the scene may draw, asked of the card at once when it starts (and again when it is prepared once more:
		 * a location came, models came): the loading shows all that is left, none is made later in the play. What a trait
		 * draws it asks for itself (engine.Warms: each function (setting) makes its own). Regression: each program was made
		 * the first time it was drawn, after the scene was told ready: the ground, the sky, the models, the light of probes,
		 * the panes, the weather came seconds later, the bar came back, the picture waited, the count of the bar grew as it
		 * went and stood still. Of a galaxy only its own (a system it goes into is prepared then).
		 */
		engine.Warms = engine.Warms || [];

		/* What a field of a trait may be, to choose in an inspector (SceneEditor): 'Trait:Key' to its values (the traits add theirs). */
		engine.Options = engine.Options || {};
		engine.Options['Star:Type'] = this.$Service('Astronomy').Types.slice();
		engine.Options['Cluster:Type'] = ['open', 'globular', 'nuclear'];

		function warm () {
			var setting = self.Setting === 'galaxy' || self.Setting === 'universe' ? 'galaxy' : scene.Ground ? 'ground' : 'space';
			var count = Object.keys(scene.Lists || {}).length;
			var terrain;

			scene.WarmedLists = count;
			scene.WarmedGround = !!scene.Ground;

			if (!renderer || renderer.Lost) return;

			if (setting !== 'galaxy') {
				['Many', 'ManyDepth', 'Pbr', 'PbrSkinned', 'GlowMany', 'Outline', 'OutlineSkinned', 'GlowSkinned', 'SkinDepth', 'Line', 'Far', 'StarsTurned', 'Glow', 'Planet', 'Bake', 'Star', 'Air', 'Ring', 'Ground', 'LandDepth', 'GroundDepth', 'Things', 'ThingsDepth', 'Sea', 'Sky'].forEach(function (name) {
					return gpu[name];
				});

				gpu.LandOf(null, null);

				/* The ground of a location: of its own materials and its Blueprint. */
				if (scene.Ground && scene.Ground.Field) {
					terrain = trait(scene.Objects[scene.Ground.ID] || {Traits: {}}, 'Terrain');

					/* Of a location come in a flight: behind, the land of no materials till it is made (drawGround). */
					gpu.LandOf(terrain && terrain.Blueprint ? blueprinted(terrain, 'Land', scene.Ground.ID) : null, scene.Ground.Field.Materials, !!scene.Location);
				}

				[['TopLand', shaders.LandVertex, shaders.Top], ['TopMany', shaders.Instanced, shaders.Top], ['BounceLand', shaders.LandVertex, shaders.Bounced], ['BounceMany', shaders.Instanced, shaders.Bounced], ['NormalMany', shaders.Instanced, shaders.Normal], ['NormalSkin', shaders.Skinned, shaders.Normal], ['VoxelLand', shaders.LandVertex, shaders.Voxel], ['VoxelMany', shaders.Instanced, shaders.Voxel], ['MirrorGlass', shaders.Instanced, shaders.MirrorGlass], ['MirrorGlassSkinned', shaders.Skinned, shaders.MirrorGlass], ['Mirror', shaders.PaneVertex, shaders.Mirror], ['Glass', shaders.PaneVertex, shaders.Glass], ['ScreenProgram', shaders.PaneVertex, shaders.Screen], ['Weather', graphics.Shaders.Quad, shaders.Weather], ['LandWire', shaders.LandVertex, shaders.Flat]].forEach(function (one) {
					gpu[one[0]] = gpu[one[0]] || renderer.Program(one[1], one[2]);
				});

				engine.ScatterWarm({Top: shaders.Top, Voxel: shaders.Voxel});

				/* Each list of models: its own programs (its pattern, its Vertex), for each pass it is drawn in. */
				Object.keys(scene.Lists || {}).forEach(function (name) {
					var list = scene.Lists[name];
					if (!list || !list.Material) return;

					pbrOf(list);

					['Depth', 'BodyGlow', 'Normal', 'Voxel', 'Top', 'Bounced'].forEach(function (pass) {
						moved(list, null, pass);
					});
				});
			}

			engine.Warms.forEach(function (made) {
				made(setting);
			});
		}

		engine.Warm = warm;

		/*
		 * The shader graphs of the scene changed (Graphs, or a prop of one: a demo edits one as it goes): made again in place,
		 * the scene going on as it was, its objects, its view and its time; what they draw made again behind a soft veil
		 * (engine.Prepare), each trait its own (engine.Regraphs: a function of each). The graphs of numbers (of a vehicle, of
		 * the landing, of the shake) are read as they go and need none of it. Regression: a demo made the whole scene again
		 * for a change of a graph, and its view and all that went on in it were lost.
		 */
		var shaderProps = ['WindGraph', 'GrassGraph', 'SkyGraph', 'BakeGraph', 'WeatherGraph', 'AirGraph', 'CloudsGraph', 'ForecastGraph', 'GalaxyGraph', 'CosmosGraph', 'RingGraph', 'PlanetGraph', 'GroundGraph', 'SkyLightGraph', 'BoltGraph', 'LandGraph', 'WaterGraph', 'EnvelopeGraph'];
		var shaderMade = ['WindMade', 'GrassMade', 'SkyMade', 'BakeMade', 'WeatherMade', 'AirMade', 'CloudsMade', 'ForecastGLSL', 'RingMade', 'PlanetMade', 'GroundMade', 'BoltMade', 'LandMade', 'WaterMade', 'StarSceneMade', 'SpiralMade'];

		engine.Regraphs = engine.Regraphs || [];

		/* The shader graphs given (and the envelope, kept made once): the props of them, and those of Graphs by their names. */
		function graphsGiven () {
			var given = self.Graphs || {};
			var names = Object.keys(given).filter(function (name) {
				return name.indexOf('shader/') === 0 || name === 'star' || name === 'planet/envelope';
			}).sort();

			return {Names: shaderProps.concat(names), Values: shaderProps.map(function (name) {
				return self[name] || null;
			}).concat(names.map(function (name) {
				return given[name];
			}))};
		}

		/* Whether one is another than at the last frame (the first frame only notes them). */
		function graphsMoved () {
			var now = graphsGiven();
			var was = scene.GraphsGiven;

			scene.GraphsGiven = now;

			return !!was && (now.Names.join('|') !== was.Names.join('|') || now.Values.some(function (value, index) {
				return value !== was.Values[index];
			}));
		}

		function dropped (made) {
			if (made && typeof made.Destroy === 'function')
				made.Destroy();
		}

		engine.Regraph = function () {
			if (!renderer || renderer.Lost) return;

			shaderMade.forEach(function (name) {
				self[name] = undefined;
			});

			scene.Told = {};
			/* The envelope of the bodies of its graph (planet/envelope), made again as it is asked for. */
			scene.EnvelopeRun = undefined;
			renderer.Replaces[graphics.Chunks.SkyLight] = self.SkyLit();
			shaders = self.Globed(self.Forecasted(self.Clouded(self.Aired(self.Weathered(self.Baked(self.Landed(self.Skied(self.Watered(self.Winded(self.Shaders(graphics)))))))))));

			/* What build makes again: its meshes, and what was baked of the graphs before. */
			[gpu.Sphere, gpu.Quad, gpu.Stars].forEach(dropped);

			[gpu.Shapes, gpu.ShadowShapes, scene.Lines, scene.Rings, scene.Rocks, scene.Swarms].forEach(function (kept) {
				Object.keys(kept || {}).forEach(function (key) {
					dropped(kept[key]);
				});
			});

			Object.keys(scene.Baked || {}).forEach(function (id) {
				var made = scene.Baked[id];

				Object.keys(made || {}).forEach(function (key) {
					dropped(made[key]);
				});
			});

			/* The programs made of the shaders before, outside build (warm and as they were drawn). */
			['TopLand', 'TopMany', 'BounceLand', 'BounceMany', 'NormalMany', 'NormalSkin', 'VoxelLand', 'VoxelMany', 'MirrorGlass', 'MirrorGlassSkinned', 'Mirror', 'Glass', 'ScreenProgram', 'Weather', 'LandWire'].forEach(function (name) {
				gpu[name] = null;
			});

			gpu.NearGrounds = {};

			build();

			starGraphs.Texts = {};
			starGraphs.Graphs = typeof WeakMap === 'function' ? new WeakMap() : null;

			engine.Regraphs.forEach(function (made) {
				made();
			});

			/* All asked for again (the loop warms what the traits draw), the view made ready behind a soft veil. */
			scene.Warmed = false;

			engine.Prepare(true);
		};

		scene.Preparing = !!renderer;
		scene.Cover = scene.Preparing ? 1 : 0;

		scene.Loop = this.$Service('Loop').Create({Window: view, Render: function (part, loop) {
			var started = view.performance ? view.performance.now() : Date.now();
			var watched = fps.Watching() && !scene.Gone;
			var ended;

			/* The time of the frame the screen shows, not of when its turn came: an uneven turn would shake all that moves. */
			var now = loop.Now === null ? started : loop.Now;

			/* A shader graph given anew: made again in place (engine.Regraph). */
			if (renderer && scene.Warmed && graphsMoved())
				engine.Regraph();

			if (renderer && !scene.Warmed) {
				scene.Warmed = true;

				engine.PostWarm();
				engine.ScatterWarm();
				engine.EffectsWarm();

				warm();
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
				/*
				 * Of space: drawn all the same, as a frame of the loop (what the card has not made yet left out, see drawReady), so
				 * its globes ask for their squares while the card makes its programs. Regression: they waited for all of them,
				 * a quiet frame asks for nothing, and the squares of the Orbit demo began only after 35 s (under load).
				 */
				if (!scene.Ground && !scene.Surface && renderer && !renderer.Lost) {
					scene.Looping = true;

					frame(now, false, scene.Preparing && scene.Cover >= 1);

					scene.Looping = false;
				}
				else {
					frame(now, true, scene.Preparing && scene.Cover >= 1);
				}

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

			var before = watched && renderer ? renderer.Counts() : null;

			/* Here a frame need not wait for what the card makes behind it; one asked for by hand does. */
			scene.Looping = true;

			frame(now, false, scene.Preparing && scene.Cover >= 1);

			scene.Looping = false;

			prepareStep(now, true);

			ended = view.performance ? view.performance.now() : Date.now();
			scene.Rest = ended - started > 24 ? ended + Math.min(1000, ended - started) : 0;

			if (watched) {
				gpuEnd();

				/*
				 * What the frame drew: its draws and triangles (the copies of an instanced mesh counted), shown by an FPSMeter; and
				 * what the frames chose: the pixels of the screen to a point of the page (Ratio) and the level of the light (Level:
				 * 0 low to 3 ultra), so a picture that changes as it goes is seen.
				 */
				var after = before ? renderer.Counts() : null;

				fps.Report(source, {Cpu: ended - started, Quiet: 0, Skipped: 0, Draws: after ? after.Draws - before.Draws : 0, Triangles: after ? after.Triangles - before.Triangles : 0, Ratio: scene.Ratio, Level: ['low', 'medium', 'high', 'ultra'].indexOf(self.Graphics().Level)});
			}

		}});

		/*
		 * Regression: with no WebGL (none given: a page past the contexts a browser keeps) there is no picture to make, and
		 * the frames ran what only a renderer starts (the vehicles, the weather) and threw at each. The scene says error and
		 * ready, shows that it cannot draw, and its methods answer, but no frame goes.
		 */
		if (renderer) scene.Loop.Start();
		else this.Unsupported = true;

		this.MarksStart();
		this.RoadsStart();
		this.FootingsStart();
		this.TriggersStart();
		this.RigidStart();
		this.FractureStart();
		this.PipingStart();
		this.CameraStart();
		this.CinemaStart();
		this.SystemsStart();
		this.AboardStart();
		this.TacticsStart();

		if (renderer) {
			this.ScatterStart();
			this.LightingStart();
			this.ProbesStart();
			this.EffectsStart();
			this.WeaponsStart();
			this.AgentsStart();
			this.MissilesStart();
			this.DebrisStart();
			this.DeepSpaceStart();
			this.NebulaStart();
			this.GiantsStart();
			this.CosmosStart();
			this.GalaxyStart();
			this.UniverseStart();
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

		if (this.GesturesStop)
			this.GesturesStop();

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

		if (this.Engine().MarksStop)
			this.Engine().MarksStop();

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

	/* A finger: its gestures (Gesture), none of what a mouse does. */
	Fingered: function (event) {
		return event.pointerType === 'touch' && !!this.GesturesStop;
	},

	PointerDown: function (event) {
		/* A finger does its gestures, but on the screen of an element it presses it as a mouse does (SceneScreens). */
		if (this.Fingered(event)) {
			if (this.ScreenPointer)
				this.ScreenPointer('down', event);

			return;
		}

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

		/*
		 * With a hero the first press takes the pointer: the mouse then turns the view by itself, Escape gives it back. Not at a
		 * console (SceneAboard): its screen is pressed there; nor in a mode of a seat but a turret (SceneTactics).
		 */
		if (scene.Hero && !scene.DeskOf && (!scene.Tactic || scene.Tactic === 'turret') && self.Capture !== false && self.Capture !== 'false' && event.button === 0 && !this.Captured() && event.target.requestPointerLock)
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
		/* A finger does its gestures, but on the screen of an element it presses it as a mouse does (SceneScreens). */
		if (this.Fingered(event)) {
			if (this.ScreenPointer)
				this.ScreenPointer('move', event);

			return;
		}

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
		/* A finger does its gestures, but on the screen of an element it presses it as a mouse does (SceneScreens). */
		if (this.Fingered(event)) {
			if (this.ScreenPointer)
				this.ScreenPointer('up', event);

			return;
		}


		/*
		 * Taken by a behaviour (an order of GameStrategy) or by a screen: what the press began ends all the same.
		 * Regression: the drag a right press began stayed, and every move of the mouse after an order turned the view.
		 */
		if (this.RunBehaviours('Pointer', ['up', event]) || this.ScreenPointer && this.ScreenPointer('up', event)) {
			this.PointerCancel(event);

			return;
		}

		if (this.WeaponsPointer)
			this.WeaponsPointer('up', event);

		/* A press in a mode of a seat with the pointer free (SceneTactics): what it is on may be the target. */
		if (this.TacticsPointer && this.TacticsPointer('up', event)) {
			this.PointerCancel(event);

			return;
		}

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
		if (this.Fingered(event)) return;

		delete this.Scene().Pointers[event.pointerId];

		this.Scene().Drag = null;
		this.Scene().Pinch = null;
		this.Scene().LookHeld = false;
		this.Dragging = false;
	},

	/*
	 * What fingers do to the scene (Gestures), a behaviour first (its Gesture(gesture, scene) taking it with true): a tap
	 * selects (or picks the point of a landing); a press sends the selected walker there (Orders); one finger turns the
	 * view (over a surface it looks round); two carry it (pan), bring it nearer (pinch), turn it round the up (rotate) or
	 * tilt it (tilt). A walker or a vehicle under the keys is not turned by fingers: its pads (VirtualGamepad) do it.
	 * Then gesture tells it, with what is under it.
	 */
	Gesture: function (gesture) {
		var scene = this.Scene ? this.Scene() : null;
		var engine = scene ? this.Engine() : null;
		var point;
		var looking;
		var id = '';
		var hold;

		if (!scene || scene.Gone) return;

		point = engine.Local({clientX: gesture.X, clientY: gesture.Y});

		if (gesture.Type === 'tap' || gesture.Type === 'doubletap' || gesture.Type === 'press')
			id = this.Allowed(engine.Pick(point.X, point.Y));

		if (!this.RunBehaviours('Gesture', [gesture, this])) {
			looking = scene.Surface && !scene.Surface.Ship;
			hold = scene.Touch = gesture.Phase === 'start' ? {Yaw: looking ? scene.Surface.Yaw : scene.Yaw, Pitch: looking ? scene.Surface.Pitch : scene.Pitch, Wanted: scene.Wanted} : scene.Touch || {Yaw: scene.Yaw, Pitch: scene.Pitch, Wanted: scene.Wanted};

			if (gesture.Type === 'tap' && scene.Picking) engine.LandingPick(point.X, point.Y);
			else if (gesture.Type === 'tap' && !scene.Hero && !scene.Surface) engine.Select(id);
			else if (gesture.Type === 'press' && !scene.Hero && !scene.Surface && scene.Ground) this.OrderAt(point);
			else if (gesture.Type === 'pan' && gesture.Pointers === 1 && !scene.Hero) this.TouchTurn(hold, gesture.DX, gesture.DY, looking);
			else if (gesture.Type === 'pan' && gesture.Pointers === 2 && !scene.Hero && !looking) engine.PanView(gesture.MoveX, gesture.MoveY);
			else if (gesture.Type === 'pinch' && !looking) this.ZoomTo(hold.Wanted / gesture.Scale, true);
			else if (gesture.Type === 'rotate' || gesture.Type === 'tilt') this.TouchTurn({Yaw: looking ? scene.Surface.Yaw : scene.Yaw, Pitch: looking ? scene.Surface.Pitch : scene.Pitch}, gesture.Type === 'rotate' ? -gesture.Step / 0.006 : 0, gesture.Type === 'tilt' ? gesture.MoveY : 0, looking);
		}

		this.$Emit('gesture', {Gesture: gesture, ID: id, Point: point});
	},

	/*
	 * The view turned by fingers from where it was (from): dx and dy px, as a drag of the mouse turns it (a turn of two
	 * fingers as many px as turns it as much: the view goes round with them).
	 */
	TouchTurn: function (from, dx, dy, looking) {
		var scene = this.Scene();
		var yaw = from.Yaw;

		if (looking) {
			scene.Surface.Yaw = yaw + dx * 0.004;
			scene.Surface.Pitch = Math.max(-1.55, Math.min(1.4, from.Pitch - dy * 0.004));

			return;
		}

		scene.Looked = performance.now();
		scene.Yaw = yaw - dx * 0.006;
		scene.Pitch = Math.max(-1.5, Math.min(1.5, from.Pitch + dy * 0.006));
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

		/* In a mode of a seat round its vehicle (SceneTactics) the wheel brings the view nearer or farther. */
		if (this.Scene().Tactic && this.Scene().Tactic !== 'turret' && this.Scene().TacticReach) {
			this.Scene().TacticReach = Math.max(4, Math.min(5000, this.Scene().TacticReach * Math.exp(amount * 0.0015)));

			return;
		}

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
		if (this.TacticsKey && this.TacticsKey(event)) return;

		/* Ctrl+Shift+L: the colors of the levels of detail on and off, in any scene. */
		if (event.code === 'KeyL' && event.ctrlKey && event.shiftKey && !event.repeat) {
			event.preventDefault();

			this.Levels = !this.Levels || this.Levels === 'false';

			return;
		}

		var scene = this.Scene();

		/* With the pointer taken V goes from one place of the view of a walker to the next. */
		if (event.code === 'KeyV' && scene.Hero && this.Captured() && !event.repeat) {
			this.Person = {third: 'first', first: 'shoulder', shoulder: 'third'}[this.Person] || 'third';

			this.$Emit('person', this.Person);
		}

		/* G gets into the vehicle the hero stands by, or out of the one it drives (SceneVehicles.BoardKey); in space too, out of a ship with an inside in flight. */
		if (event.code === 'KeyG' && scene.Hero && (!scene.Surface || scene.Surface.Ship) && !event.repeat && this.BoardKey && this.BoardKey()) {
			event.preventDefault();

			return;
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

		/*
		 * What comes into a location (SceneLanding) with no parent told is of it, its ground, not of the first star of the
		 * system, and goes with it. Regression: things added on the ground of a ship landed went round the star, away, unseen.
		 */
		scene.Added.push({ID: spec.ID, Kind: spec.Kind || '', Parent: spec.Parent === undefined && scene.Location ? scene.Location.Ground : spec.Parent, Values: Object.assign({}, spec.Values || {}, made.Values), Traits: this.$Service('SceneKinds').MergeTraits(made.Traits, spec.Traits || {}), Parts: spec.Parts || []});
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
	/* One object selected, or many (a list: the first is the one the card and the gizmo are of, each of them marked). */
	Select: function (id) {
		var scene = this.Scene();
		var list = (Array.isArray(id) ? id : id ? [id] : []).filter(function (one) {
			return !!scene.Objects[one];
		});

		this.Engine().Select(list[0] || '');

		scene.Chosen = list.length > 1 ? list.slice() : [];
	},

	Selection: function () {
		var scene = this.Scene();
		var selected = scene.Selected;
		if (scene.Chosen && scene.Chosen.length > 1 && scene.Chosen[0] === selected) return scene.Chosen.slice();

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

	/*
	 * What the frames it drew cost, counted since it was made: {Frames, Cpu (ms in all), Draws, Triangles, At (the time of
	 * the last, performance.now())}. Not the frames of the browser: after a slow frame a scene rests through some, and they
	 * cost nothing. The difference of two of them is what a while drew: its frames a second, a frame's draws.
	 */
	Drawn: function () {
		return Object.assign({}, this.Scene().DrawnCount);
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

	/*
	 * What the scene is drawn on: {GPU (the name of the graphics card, '' when the browser hides it), Parallel (the card
	 * makes programs while frames go on: KHR_parallel_shader_compile; without it a program not made yet holds a frame up),
	 * Floats (pictures of floats: the light of medium and up), MaxTexture (px), Pixels (of the screen to a point of the page),
	 * Phone, Level, Ratio}; null with no WebGL.
	 */
	Device: function () {
		var engine = this.Engine ? this.Engine() : null;
		var gl = engine && engine.Renderer ? engine.Renderer.GL : null;
		var info;

		if (!gl)
			return null;

		info = gl.getExtension('WEBGL_debug_renderer_info');

		return {GPU: info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '', Parallel: !!gl.getExtension('KHR_parallel_shader_compile'), Floats: !!gl.getExtension('EXT_color_buffer_float'), MaxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE), Pixels: window.devicePixelRatio || 1, Phone: this.Phone(), Level: this.Graphics().Level, Ratio: this.Scene().Ratio};
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
			Influences: JSON.parse(JSON.stringify(scene.Influences || [])),
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

		this.Scene().Influences = saved.Influences ? JSON.parse(JSON.stringify(saved.Influences)) : [];
		this.Scene().WeatherWanted = null;

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
		var radius = this.$Service('ScenePlanet').Defaults.Radius;
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
				engine.PreloadGlobe(Object.assign({}, typeof item.Planet === 'string' ? JSON.parse(item.Planet) : item.Planet, {Radius: Number(item.Radius) || radius}), came);

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

	/*
	 * The surface of a body of noise in the shader that bakes it: its BakeGraph, else the one of the library (LibraryBake),
	 * made once. Its land the page reads too (SceneTerrainGenerator.Sphere: BakeSource).
	 */
	Baked: function (shaders) {
		if (this.BakeMade === undefined)
			this.BakeMade = this.Made(this.GraphOf('BakeGraph', 'shader/bake'), 'bake', 'BakeGraph', this.LibraryBake.bind(this));

		return this.Install(shaders, 'void blueprintBake(vec3 p, inout vec4 surface, inout vec4 sky) {}', this.BakeMade);
	},

	/*
	 * The light of the sky of the scene in its shaders: its SkyLightGraph (or Graphs['shader/sky-light']), else the one of
	 * the library, a graph of numbers made a function of GLSL (BlueprintShaders.NumericGLSL) in place of SkyLight of the
	 * Renderer: skyLight(way, spread, sky, ground, sun, gain), one model for all that mirrors it and that it lights. One that
	 * cannot be made is told, the one of the library drawn.
	 */
	SkyLit: function () {
		var shaders = this.$Service('BlueprintShaders');
		var chunks = this.$Service('Renderer').Chunks;
		var given = this.GraphOf('SkyLightGraph', 'shader/sky-light');
		var names = {WayY: 'way.y', SunDot: 'dot(way, sun)', SunY: 'sun.y', Spread: 'spread', SkyR: 'sky.r', SkyG: 'sky.g', SkyB: 'sky.b', FloorR: 'ground.r', FloorG: 'ground.g', FloorB: 'ground.b', Gain: 'gain'};
		var library = Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/sky-light');
		var made;

		try {
			made = shaders.NumericGLSL(typeof given === 'string' ? JSON.parse(given) : given || library, {});
		}
		catch (error) {
			if (window.console && window.console.warn)
				window.console.warn('Elemenx Scene: the SkyLightGraph cannot be made, the light of the sky of the library is drawn: ' + error.message);

			made = shaders.NumericGLSL(library, {});
		}

		return [chunks[made.Need], 'vec3 skyLight(vec3 way, float spread, vec3 sky, vec3 ground, vec3 sun, float gain) {', '	return vec3(' + made.Name + '(' + made.Inputs.map(function (input) {
			return names[input.Name] || '0.0';
		}).join(', ') + '));', '}'].join('\n');
	},

	/* A graph of the scene of its own: its prop, else the one of its Graphs of that name, else null. */
	GraphOf: function (prop, name) {
		return this[prop] || (this.Graphs && typeof this.Graphs === 'object' ? this.Graphs[name] : null) || null;
	},

	/*
	 * The shape of the lightnings of the scene, of a storm and of its effects (SceneBlueprints.Bolt): of its BoltGraph (or
	 * Graphs['shader/bolt']), else the one of the library; made once. One that cannot be made is told, the library one drawn.
	 */
	BoltShape: function () {
		var blueprints = this.$Service('SceneBlueprints');
		var given = this.GraphOf('BoltGraph', 'shader/bolt');

		if (this.BoltMade)
			return this.BoltMade;

		try {
			this.BoltMade = blueprints.Bolt(typeof given === 'string' ? JSON.parse(given) : given);
		}
		catch (error) {
			if (window.console && window.console.warn)
				window.console.warn('Elemenx Scene: the BoltGraph cannot be made, the bolt of the library is drawn: ' + error.message);

			this.BoltMade = blueprints.Bolt();
		}

		return this.BoltMade;
	},

	/*
	 * The graph of the arms of its galaxies (GalaxyData.Spiral: a Scene gives its galaxy this one): its GalaxyGraph (or
	 * Graphs['shader/galaxy']) read, null for the one of the library; one that cannot be made is told, and null.
	 */
	GalaxySpiral: function () {
		var given = this.GraphOf('GalaxyGraph', 'shader/galaxy');

		if (this.SpiralMade !== undefined) return this.SpiralMade;

		this.SpiralMade = null;

		if (!given)
			return null;

		try {
			given = typeof given === 'string' ? JSON.parse(given) : given;

			this.$Service('SceneBlueprints').Galaxy(given);

			this.SpiralMade = given;
		}
		catch (error) {
			if (window.console && window.console.warn)
				window.console.warn('Elemenx Scene: the GalaxyGraph cannot be made, the arms of the library are drawn: ' + error.message);
		}

		return this.SpiralMade;
	},

	/*
	 * The weather of a planet in the shader that bakes it (WEATHER): its ForecastGraph (or Graphs['shader/forecast']), else
	 * LibraryForecast, a graph of numbers made a function of GLSL (BlueprintShaders.NumericGLSL), called of the climate of
	 * each place (uClimate) and the time, the sun and the seed of the planet; the page reads the same graph (WeatherOver).
	 * One that cannot be made is told, the one of the library drawn.
	 */
	Forecasted: function (shaders) {
		var graphics = this.$Service('Renderer');
		var names = {PX: 'p.x', PY: 'p.y', PZ: 'p.z', Days: 'uDays', Seed: 'uWeatherSeed', RadiusKm: 'uRadiusKm', Cells: 'uCells', SunX: 'uSunAt.x', SunY: 'uSunAt.y', SunZ: 'uSunAt.z', Cloudiness: 'uCloudiness', Moist: 'cl.r', Warm: 'cl.g', Ground: 'cl.b', Climb: 'cl.a'};
		var made = this.ForecastMade();
		var text;

		if (!made || typeof shaders.Weather !== 'string') return shaders;

		text = [graphics.Chunks[made.Need], this.InfluencesGLSL(), 'vec4 blueprintForecast(vec3 p) {', '\t/* Its climate smoothed over a few texels: the climb of the wind over hills changes from one to the next (clouds in squares). */', '\tvec4 cl = textureLod(uClimate, p, 1.5);', '\treturn weatherInfluenced(p, ' + made.Name + '(' + made.Inputs.map(function (input) {
			return names[input.Name] || '0.0';
		}).join(', ') + '));', '}'].join('\n');

		shaders.Weather = this.$Service('BlueprintShaders').Lined(this.$Service('Renderer').Patch(shaders.Weather, 'vec4 blueprintForecast(vec3 p) { return vec4(0.0); }', text));

		return shaders;
	},

	/*
	 * The influences on the weather of a planet in its shader (WeatherInfluences): weatherInfluenced(p, w), the weather w
	 * (Cover, Kind, Cirrus, Rain) of a way p with what the influences over it add (uInfluenceAt: their middles and radii in
	 * radians, uInfluenceIs: their ages, strengths and kinds, of the kinds in their order of names, uInfluenceCount, 16 at
	 * most), each kind of its graph made GLSL (its fog left out: the map has none).
	 */
	InfluencesGLSL: function () {
		var shaders = this.$Service('BlueprintShaders');
		var graphics = this.$Service('Renderer');
		var kinds = this.$Service('WeatherInfluences').Kinds();
		var order = ['Cover', 'Kind', 'Cirrus', 'Rain'];
		var lines = ['uniform vec4 uInfluenceAt[16];', 'uniform vec4 uInfluenceIs[16];', 'uniform float uInfluenceCount;'];
		var calls = [];

		Object.keys(kinds).sort().forEach(function (kind, index) {
			var graph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + kinds[kind].Graph) || null));
			var made;
			var gone = {};

			if (!graph) return;

			graph.blocks = graph.blocks.filter(function (block) {
				var fog = block.type === 'Result' && (block.properties || []).some(function (property) {
					return property.key === 'Key' && property.value === 'Fog';
				});
				if (fog)
					gone[block.id] = true;

				return !fog;
			});
			graph.links = graph.links.filter(function (link) {
				return !gone[String(link.p2).split('-in-')[0]];
			});

			made = shaders.NumericGLSL(graph, {});

			lines.push(graphics.Chunks[made.Need]);
			calls.push('\t\tif (k == ' + index + ') {', '\t\t\tvec4 r = vec4(' + made.Name + '(' + made.Inputs.map(function (input) {
				return {Near: 'near', Age: 'is.x', Strength: 'is.y'}[input.Name] || '0.0';
			}).join(', ') + '));', '\t\t\td = vec4(' + order.map(function (key) {
				var at = made.Keys.indexOf(key);

				return at < 0 ? '0.0' : 'r.' + 'xyzw'.charAt(at);
			}).join(', ') + ');', '\t\t}');
		});

		return lines.concat(['vec4 weatherInfluenced(vec3 p, vec4 w) {', '\tfor (int i = 0; i < 16; i++) {', '\t\tif (float(i) >= uInfluenceCount) break;', '\t\tvec4 at = uInfluenceAt[i];', '\t\tvec4 is = uInfluenceIs[i];', '\t\tfloat near = acos(clamp(dot(p, at.xyz), -1.0, 1.0)) / max(at.w, 1e-6);', '\t\tif (near >= 1.0) continue;', '\t\tint k = int(is.z + 0.5);', '\t\tvec4 d = vec4(0.0);'], calls, ['\t\tw = clamp(w + d, 0.0, 1.0);', '\t}', '\treturn w;', '}']).join('\n');
	},

	/* The graph of the weather of the scene made GLSL (NumericGLSL), once; of the library where its own cannot be made. */
	ForecastMade: function () {
		var shaders = this.$Service('BlueprintShaders');
		var given = this.GraphOf('ForecastGraph', 'shader/forecast');

		if (this.ForecastGLSL !== undefined) return this.ForecastGLSL;

		try {
			this.ForecastGLSL = shaders.NumericGLSL(typeof given === 'string' ? JSON.parse(given) : given || this.LibraryForecast(), {});
		}
		catch (error) {
			if (window.console && window.console.warn)
				window.console.warn('Elemenx Scene: the ForecastGraph cannot be made, the weather of the library is drawn: ' + error.message);

			this.ForecastGLSL = shaders.NumericGLSL(this.LibraryForecast(), {});
		}

		return this.ForecastGLSL;
	},

	/*
	 * The weather of the map of a planet over a direction of its body (its direction, or none: over the eye on its surface),
	 * in the page, of the graph its shader bakes it of: {Cover, Kind, Cirrus, Rain (0 to 1), Warm (of its climate)}; null
	 * before its climate is made, or of a body of no weather.
	 */
	/*
	 * An influence on the weather of a planet (WeatherInfluences): of a kind (resources/weather/influences.json: storm-seed,
	 * anti-hail, seeding, dispersal, fog), at a place {Body, Latitude, Longitude (degrees) or Direction (a way of its body)}
	 * (none: under the eye, over the surface or in the location of a planet), from now, options {Radius (km), Hours,
	 * Strength, ID}. Its forecast there changes for that while (over the surface, in the location, the influences it leaves
	 * too), and it is kept (Save). The influence made, or null (no planet there, no such kind); event influence.
	 */
	Influence: function (kind, place, options) {
		var scene = this.Scene();
		var given = place || {};
		var body = given.Body || (scene.Surface ? scene.Surface.ID : scene.Location && scene.Location.Planet ? scene.Location.Body : null);
		var way = given.Direction;
		var one;

		if (!way && given.Latitude !== undefined && given.Longitude !== undefined) {
			var lat = Number(given.Latitude) * Math.PI / 180;
			var lon = Number(given.Longitude) * Math.PI / 180;

			way = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)];
		}

		if (!way)
			way = scene.Surface && scene.Surface.ID === body ? scene.Surface.Up : scene.Location && scene.Location.Body === body && scene.Location.Frame ? scene.Location.Frame.Middle : null;

		if (!body || !way || !scene.Objects[body] || !this.$Service('WeatherInfluences').Kinds()[kind]) return null;

		one = this.$Service('WeatherInfluences').Make(kind, way, scene.Time, options);
		one.Body = body;
		scene.Influences = (scene.Influences || []).concat([one]);
		scene.WeatherWanted = null;

		/* Its map of the weather baked again at once, its time standing or not. */
		if (scene.Baked && scene.Baked[body])
			scene.Baked[body].WeatherDays = NaN;

		this.$Emit('influence', JSON.parse(JSON.stringify(one)));

		return JSON.parse(JSON.stringify(one));
	},

	/* The influences on the weather of the planets of the scene (Influence), as they began (the ones they leave are made of them). */
	Influences: function () {
		return JSON.parse(JSON.stringify(this.Scene().Influences || []));
	},

	WeatherOver: function (id, direction) {
		var surface = this.Scene().Surface;
		var object = this.Scene().Objects[id];
		var engine = this.Engine();
		if (!object || !engine.WeatherOver) return null;

		return engine.WeatherOver(object, direction || (surface && surface.ID === id ? surface.Up : [0, 1, 0]));
	},

	/* The js of the graph of the weather of the scene (NumericCode of the ForecastGraph, else of the library), made once: its Run. */
	ForecastCode: function () {
		var given = this.GraphOf('ForecastGraph', 'shader/forecast');
		var made = null;

		if (this.ForecastRun)
			return this.ForecastRun;

		try {
			made = this.$Service('Blueprints').NumericCode(typeof given === 'string' ? JSON.parse(given) : given || this.LibraryForecast(), {});
		}
		catch (error) {
			made = null;
		}

		this.ForecastRun = (made || this.$Service('Blueprints').NumericCode(this.LibraryForecast(), {})).Run;

		return this.ForecastRun;
	},

	/* The weather of the library, a graph of numbers of SceneForecast (SceneBlueprints.LibraryForecast). */
	LibraryForecast: function () {
		return this.$Service('SceneBlueprints').LibraryForecast();
	},

	/*
	 * The clouds in the shaders that ask for them (#define ENX_CLOUDS_<FOR>: the globe and the shadows of its clouds, round
	 * the eye over a surface, the layer of a scene): its CloudsGraph (or Graphs['shader/clouds']), else LibraryClouds, made once.
	 */
	Clouded: function (shaders) {
		if (this.CloudsMade === undefined)
			this.CloudsMade = this.Made(this.GraphOf('CloudsGraph', 'shader/clouds'), 'clouds', 'CloudsGraph', this.LibraryClouds.bind(this));

		return this.Install(shaders, 'void blueprintClouds() {}', this.CloudsMade || this.Made(null, 'clouds', 'CloudsGraph', this.LibraryClouds.bind(this)));
	},

	/*
	 * The clouds of the library as a graph (the kind clouds of SceneBlueprints): the cover of the weather of a planet, its
	 * globe, its clouds round the eye over its surface, the layer of a scene.
	 */
	LibraryClouds: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/clouds'));
	},

	/*
	 * The air between the eye and what it sees in the shaders that ask for it (#define ENX_AIR_<FOR>: the things and the
	 * ground of a globe, the land and the water, the pass Air): its AirGraph (or Graphs['shader/air']), else LibraryAir, made once.
	 */
	Aired: function (shaders) {
		if (this.AirMade === undefined)
			this.AirMade = this.Made(this.GraphOf('AirGraph', 'shader/air'), 'air', 'AirGraph', this.LibraryAir.bind(this));

		return this.Install(shaders, 'void blueprintAir() {}', this.AirMade || this.Made(null, 'air', 'AirGraph', this.LibraryAir.bind(this)));
	},

	/*
	 * The air of the library as a graph (the kind air of SceneBlueprints): the haze of a globe and of a scene, the fog that
	 * lies low and the sheets of rain of the pass Air, the eye under the sea.
	 */
	LibraryAir: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/air'));
	},

	/* What the weather and the year do to the surfaces of things (Pbr, Solid): its WeatherGraph, else LibraryWeather, made once. */
	Weathered: function (shaders) {
		if (this.WeatherMade === undefined)
			this.WeatherMade = this.Made(this.GraphOf('WeatherGraph', 'shader/weather'), 'weather', 'WeatherGraph', this.LibraryWeather.bind(this));

		return this.Install(shaders, 'void blueprintWeather() {}', this.WeatherMade || this.Made(null, 'weather', 'WeatherGraph', this.LibraryWeather.bind(this)));
	},

	/*
	 * What the weather and the year do to a surface, of the library, as a graph (the kind weather of SceneBlueprints): the
	 * leaves of autumn, winter and spring, snow on things, on what is solid and on plants, a beam that takes a body away,
	 * pools where it is flat and wet.
	 */
	LibraryWeather: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/weather'));
	},

	/* The uniforms of the bake of the scene: its parameters. */
	BakeValues: function () {
		return this.BakeMade ? this.BakeMade.Values({}, {Time: 0}) : null;
	},

	/*
	 * The surface of a body of noise of the library as a graph (the kind bake of SceneBlueprints): its land of a noise of
	 * 6 octaves (craters on a rocky body without seas), its seas, the colors of each kind (rocky, icy, lava, gas), its
	 * caps of ice, its clouds, the glow of lava and its sparks.
	 */
	LibraryBake: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/bake'));
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
	/* The sky far behind a system of the library as a graph (the kind cosmos of SceneBlueprints): SceneCosmos bakes it. */
	LibraryCosmos: function () {
		return this.$Service('SceneBlueprints').LibraryCosmos();
	},

	/* A ring round a body of the library as a graph (the kind ring of SceneBlueprints): its bands, gaps, colors and light. */
	LibraryRing: function () {
		return this.$Service('SceneBlueprints').LibraryRing();
	},

	/*
	 * The star graph of the stars of the scene with no Blueprint of their own: its Graphs['star'] (a graph of the kind star, its
	 * JSON), else the one of the library (LibraryStar); made once, null if neither can be made.
	 */
	StarScene: function () {
		if (this.StarSceneMade === undefined)
			this.StarSceneMade = this.Made(this.GraphOf('StarGraph', 'star'), 'star', 'StarGraph', this.LibraryStar.bind(this));

		return this.StarSceneMade;
	},

	/* A globe from far of the library as a graph (the kind planet of SceneBlueprints): its picture lit, its clouds, its lights, its air. */
	LibraryPlanet: function () {
		return this.$Service('SceneBlueprints').LibraryPlanet();
	},

	/*
	 * The ground of a globe near of the library as a graph (the kind ground of SceneBlueprints): its picture, woods, fields,
	 * snow and dunes, its relief, the tiles near, its light and the shadows of clouds and of a ring, its water, towns at
	 * night, clouds from over them and air.
	 */
	/*
	 * What is round an object, written once a frame into a slice of the Ether (name: environment) under its ID, the same
	 * object, till Unprobe: {Body, Altitude (km over the Radius of the body), Ground (km, null where not known), Zone, Phase
	 * (space, gas, cloud, haze, liquid, supercritical, solid), Pressure (bar), Temperature (K), Density (kg/m3), Light (of its
	 * sun, 0 to 1), Glow ([r, g, b] of the heat there), Inside (in the envelope of the body), Solid}. Returns the record.
	 */
	Probe: function (id, name) {
		var scene = this.Scene();
		var slice = name || 'environment';

		scene.Probed = scene.Probed || {};
		scene.Probed[id] = slice;

		this.Engine().ProbeStep();

		return this.$Ether(slice)[id];
	},

	Unprobe: function (id) {
		var scene = this.Scene();
		if (scene.Probed)
			delete scene.Probed[id];
	},

	/* What is round an object now (Probe asks for it each frame): null when it is not asked for. */
	Environment: function (id) {
		var scene = this.Scene();

		return scene.Probed && scene.Probed[id] ? this.$Ether(scene.Probed[id])[id] || null : null;
	},

	/* The envelope of a body of the library as a graph (planet/envelope): its state and its light at a height of its zones. */
	LibraryEnvelope: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/envelope'));
	},

	LibraryGround: function () {
		return this.$Service('SceneBlueprints').LibraryGround();
	},

	/*
	 * The alpha of a ring graph alone (its shadow on a ground, groundRing): the blocks the Alpha of its end is made of, the
	 * rest left out (its light reads what a ground has not). A ring written by hand: none (null).
	 */
	RingAlpha: function (given) {
		var graph = typeof given === 'string' ? (given.trim().charAt(0) === '{' ? JSON.parse(given) : null) : given || this.LibraryRing();
		var ends;
		var kept = {};
		var grew = true;

		if (!graph || !graph.blocks) return null;

		ends = graph.blocks.filter(function (block) {
			return block.type === 'RingEnd';
		});

		if (!ends.length) return null;

		ends.forEach(function (block) {
			kept[block.id] = true;
		});

		function owner (pin, side) {
			return String(pin).slice(0, String(pin).lastIndexOf('-' + side + '-'));
		}

		function into (link) {
			var to = owner(link.p2, 'in');

			return kept[to] && !(ends.some(function (end) {
				return end.id === to;
			}) && !/-in-Alpha$/.test(link.p2));
		}

		while (grew) {
			grew = false;

			(graph.links || []).forEach(function (link) {
				var from = owner(link.p1, 'out');

				if (into(link) && !kept[from]) {
					kept[from] = true;
					grew = true;
				}
			});
		}

		return Object.assign({}, graph, {
			blocks: graph.blocks.filter(function (block) {
				return kept[block.id];
			}),
			links: (graph.links || []).filter(function (link) {
				return kept[owner(link.p1, 'out')] && into(link);
			})
		});
	},

	/*
	 * The globes of the scene in their shaders, each of its graph (RingGraph, PlanetGraph or their Graphs['shader/...']), else
	 * of the one of the library; the surface of a star of the star graph of the library; made once. The ring in the Planet shader too (planetRing: the shadow it casts), its color and
	 * seed of its own there.
	 */
	Globed: function (shaders) {
		var ring;

		if (this.RingMade === undefined)
			this.RingMade = this.Made(this.GraphOf('RingGraph', 'shader/ring'), 'ring', 'RingGraph', this.LibraryRing.bind(this));

		if (this.PlanetMade === undefined)
			this.PlanetMade = this.Made(this.GraphOf('PlanetGraph', 'shader/planet'), 'planet', 'PlanetGraph', this.LibraryPlanet.bind(this));

		if (this.GroundMade === undefined)
			this.GroundMade = this.Made(this.GraphOf('GroundGraph', 'shader/ground'), 'ground', 'GroundGraph', this.LibraryGround.bind(this));

		/* The shadow of a ring on a ground: the alpha of the ring graph alone (RingAlpha), its seed of its own there. */
		if (this.RingAlphaMade === undefined) {
			try {
				this.RingAlphaMade = this.RingAlpha(this.GraphOf('RingGraph', 'shader/ring'));
				this.RingAlphaMade = this.RingAlphaMade ? this.$Service('Blueprints').Compile(this.RingAlphaMade) : null;
			}
			catch (error) {
				this.RingAlphaMade = null;
			}
		}

		/* The surface of a star of the star graph of the library (a star of its own graph draws its own: starProgram). */
		if (this.SunMade === undefined)
			this.SunMade = (this.StarScene() || {}).Surface || null;

		this.Install(shaders, 'void blueprintSun(vec3 n, vec3 v, vec3 p, inout vec3 color) {}', this.SunMade);

		ring = this.RingMade ? Object.assign({}, this.RingMade, {Function: this.RingMade.Function.replace(/\buSeed\b/g, 'uRingSeed').replace(/\buColors\b/g, 'uRingColors')}) : null;

		this.Install(shaders, 'void planetRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {}', ring, 'void blueprintRing(', 'void planetRing(');
		this.Install(shaders, 'void blueprintPlanet(vec3 n, vec3 v, vec3 p, inout vec3 color, inout float alpha) {}', this.PlanetMade);
		this.Install(shaders, 'void groundRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {}', this.RingAlphaMade ? Object.assign({}, this.RingAlphaMade, {Function: this.RingAlphaMade.Function.replace(/\buSeed\b/g, 'uRingSeed').replace(/\buColors\b/g, 'uRingColors')}) : null, 'void blueprintRing(', 'void groundRing(');
		this.Install(shaders, 'void blueprintGround(inout vec3 color) {}', this.GroundMade);

		return this.Install(shaders, 'void blueprintRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {}', this.RingMade);
	},

	LibrarySky: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/sky'));
	},

	/*
	 * The look of a star of the library as a graph (the kind star of SceneBlueprints), for the Blueprint of its trait Star:
	 * its prominences rise and fall and stream faster and slower over a round of Cycle seconds (two Curves of the Time),
	 * as much of them and of its flares as its Activity.
	 */
	LibraryStar: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/star'));
	},

	/*
	 * The look of a nebula of the library as a graph (the kind nebula of SceneBlueprints), for the Blueprint of its trait
	 * Nebula: it breathes brighter and dimmer over a round of Cycle seconds (as much as its Pulse), turns round its axis
	 * Spin degrees a minute, its gas as torn as its Turbulence, its fine grain as much as its Detail.
	 */
	LibraryNebula: function () {
		return this.$Service('Blueprints').Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/nebula'));
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
		/*
		 * A voxel of the light of probes of a color (as its colors are, of 0 to 1) and of what it gives of itself (light, none: 0):
		 * that color, or the hue of the glow where it glows; alpha 1 less 0.45 of how bright the glow is (a quarter of it, 1 at
		 * most), so a voxel is there over a quarter and solid over a half (SceneProbes).
		 */
		var voxelOut = [
			'vec4 voxelOut(vec3 color, vec3 glow) {',
			'	float most = max(max(glow.r, glow.g), glow.b);',
			'	if (most < 0.02) return vec4(clamp(color, vec3(0.02), vec3(0.85)), 1.0);',
			'	return vec4(glow / most, 1.0 - 0.45 * min(most / 4.0, 1.0));',
			'}'
		].join('\n');

		/* The rings of the drops on standing water: each cell of the surface has its drop, at a moment of its own. */
		var ripples = [
			this.$Service('Noise').GLSLChunk(['enx_white2']),
			'float rings(vec2 p, float t) {',
			'	vec2 cell = floor(p);',
			'	float sum = 0.0;',
			'	for (int x = -1; x <= 1; x++) {',
			'		for (int y = -1; y <= 1; y++) {',
			'			vec2 at = cell + vec2(float(x), float(y));',
			'			float seed = enx_white2(at);',
			'			float age = fract(t * (0.8 + seed * 0.6) + seed * 7.0);',
			'			float far = length(p - at - vec2(0.5 + (seed - 0.5) * 0.7, 0.5 + (fract(seed * 13.0) - 0.5) * 0.7));',
			'			sum += sin((far - age * 1.1) * 34.0) * smoothstep(0.14, 0.0, abs(far - age * 1.1)) * (1.0 - age) * (1.0 - age);',
			'		}',
			'	}',
			'	return sum;',
			'}'
		].join('\n');

		/*
		 * The weather of a planet at a direction of its body (WEATHER): of its climate (uClimate, ScenePlanet.ClimateFace), its
		 * time (uDays, days of the body) and its sun (uSunAt, the way to it in the frame of the body). Its fronts go with the
		 * winds of their belts (trades west, westerlies east, polar easterlies), turned and changed every three days so they
		 * never smear; its storms of middle latitudes (and a few tropical ones) turn as they go east, grow and fade in a week;
		 * by day heaps rise over warm wet land, most at the low of the equator; wind up a range makes cloud on it, the deserts
		 * of 20 to 30 degrees have little. Gives cover (R), kind (G: 0 a sheet, 0.5 heaps, 1 towers of a storm), cirrus (B) and
		 * rain (A), 0 to 1.
		 */
		var weather = [
			'uniform samplerCube uClimate;',
			'uniform float uDays;',
			'uniform vec3 uSunAt;',
			'uniform float uRadiusKm;',
			'uniform float uWeatherSeed;',
			/* The cells of its winds over a half of it (its envelope: 3 of the Earth). */
			'uniform float uCells;',
			/* How cloudy the world is (Clouds of its surface, 0 to 1): none, dry with a few, as the Earth (0.5), wetter, a shroud (1). */
			'uniform float uCloudiness;',
			/* Its weather at a direction, of the graph of the scene (ForecastGraph): weatherAt(p) of the climate there. */
			'vec4 blueprintForecast(vec3 p) { return vec4(0.0); }'
		].join('\n');

		/*
		 * The clouds of the weather of a planet as they are seen from over it (uWeather, its WEATHER baked): sheets as they are,
		 * heaps a field of puffs of a few kilometres (as many as the cover), cirrus thin over all; foot the kilometres a pixel
		 * covers, what is finer than it its mean. CLOUDS SEEN.
		 */
		var cloudsSeen = [
			'uniform samplerCube uWeather;',
			'uniform float uWeatherOn;',
			'uniform float uRadiusKm;',
			/* Of the clouds of the scene (CloudsGraph): cloudSeen, cloudAt and the cover of the weather they are of. */
			'#define ENX_CLOUDS_GLOBE',
			'void blueprintClouds() {}'
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
			AirAround: head + [
				'in vec3 aPosition;',
				'uniform mat4 uInverse;',
				'uniform float uReach;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'void main() {',
				'	vec4 far = uInverse * vec4(aPosition.xy, 1.0, 1.0);',
				'	vec4 close = uInverse * vec4(aPosition.xy, -1.0, 1.0);',
				'	vWorld = (far.xyz / far.w - close.xyz / close.w) * (uReach / 200.0);',
				'	vNormal = -vWorld;',
				'	gl_Position = vec4(aPosition.xy, 1.0, 1.0);',
				'}'
			].join('\n'),

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
				/*
				 * A shell of a shield: each corner pushed this far (units of the scene; 0: none) out from the middle of what it guards
				 * (uShellCenter): by where it is, not by the normal of its face, so the faces of a model of corners stay joined.
				 */
				'uniform float uGrow;',
				'uniform vec3 uShellCenter;',
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
				'	if (uGrow > 0.0) {',
				'		vec3 outward = normalize(world - uShellCenter + bent * 0.001);',
				'		world += outward * uGrow;',
				'		bent = normalize(mix(bent, outward, 0.7));',
				'	}',
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
				'in vec4 aLayer;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOrigin;',
				/* An outline: each corner pushed out along its normal, as far as a few pixels are where it is (0: none). */
				'uniform float uOutline;',
				/*
				 * A shell of a shield: each corner pushed this far (units of the scene; 0: none) out from the middle of what it guards
				 * (uShellCenter): by where it is, not by the normal of its face, so the faces of a model of corners stay joined.
				 */
				'uniform float uGrow;',
				'uniform vec3 uShellCenter;',
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
				/*
				 * A layer (aLayer: its frame, its share): a clip of the arms over the legs that go, the joints above the waist (the
				 * line of the upper body, before the line of rest: 1 and the index of the spine) of it, hung on the spine of the
				 * legs (the spine of the layer moved to it).
				 */
				'mat4 blended(float index) {',
				'	mat4 m = joint(index, aFrames.x);',
				'	if (aFrames.w > 0.001) m = m * (1.0 - aFrames.w) + joint(index, aFrames.x + 1.0) * aFrames.w;',
				'	float layer = 0.0;',
				'	vec4 upper = vec4(0.0);',
				'	if (aLayer.y > 0.001) {',
				'		upper = texelFetch(uPalette, ivec2((int(index + 0.5) + int(uJointOffset)) * 3, textureSize(uPalette, 0).y - 2), 0);',
				'		layer = aLayer.y * upper.x;',
				'	}',
				'	if (aFrames.z <= 0.001 && layer <= 0.001) return m;',
				'	float size = length(joint(index, aFrames.x)[0].xyz);',
				'	if (aFrames.z > 0.001) m = m * (1.0 - aFrames.z) + joint(index, aFrames.y) * aFrames.z;',
				'	if (layer > 0.001) m = m * (1.0 - layer) + joint(upper.y, aFrames.x) * inverse(joint(upper.y, aLayer.x)) * joint(index, aLayer.x) * layer;',
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
				'vec3 boundOf(float index) {',
				'	return texelFetch(uPalette, ivec2((int(index + 0.5) + int(uJointOffset)) * 3, textureSize(uPalette, 0).y - 1), 0).xyz;',
				'}',
				/* The turn that takes a direction to another (the shortest), round a point. */
				'mat4 turnRound(vec3 from, vec3 to, vec3 at) {',
				'	vec3 a = normalize(from);',
				'	vec3 b = normalize(to);',
				'	vec3 c = cross(a, b);',
				'	float s = length(c);',
				'	if (s < 1e-6) return mat4(1.0);',
				'	vec3 k = c / s;',
				'	mat3 cross3 = mat3(0.0, k.z, -k.y, -k.z, 0.0, k.x, k.y, -k.x, 0.0);',
				'	mat3 r = mat3(1.0) + cross3 * s + cross3 * cross3 * (1.0 - dot(a, b));',
				'	return mat4(vec4(r[0], 0.0), vec4(r[1], 0.0), vec4(r[2], 0.0), vec4(at - r * at, 1.0));',
				'}',
				/*
				 * A joint with its foot on the ground (aLayer.z, aLayer.w: how far each ankle goes up or down, in its model; the line
				 * of the upper body tells of each joint its leg, its part and the thigh, knee and ankle of that leg): the leg bent to
				 * it as two bones, its knee in the plane it bent in; its foot moved there, turned as it was.
				 */
				/*
				 * The turn of a foot to the slope of its ground (radians, its toes up): in the part of its line past the whole of
				 * aLayer.x (the left) and aFrames.y (the right), lines read whole (0: none; else 0.225 + 0.45 of it).
				 */
				'float tiltOf(float coded) {',
				'	float part = fract(coded);',
				'	return part < 0.01 || part > 0.45 ? 0.0 : (part - 0.225) / 0.45;',
				'}',
				'mat4 posed(float index) {',
				'	mat4 m = blended(index);',
				'	float tilts = abs(tiltOf(aLayer.x)) + abs(tiltOf(aFrames.y));',
				'	if (abs(aLayer.z) < 1e-5 && abs(aLayer.w) < 1e-5 && tilts < 1e-5) return m;',
				'	ivec2 at = ivec2((int(index + 0.5) + int(uJointOffset)) * 3 + 1, textureSize(uPalette, 0).y - 2);',
				'	vec4 leg = texelFetch(uPalette, at, 0);',
				'	if (leg.x < 0.5) return m;',
				'	float lift = leg.x < 1.5 ? aLayer.z : aLayer.w;',
				'	float tilt = leg.x < 1.5 ? tiltOf(aLayer.x) : tiltOf(aFrames.y);',
				'	if (abs(lift) < 1e-5 && abs(tilt) < 1e-5) return m;',
				'	vec4 chain = texelFetch(uPalette, at + ivec2(1, 0), 0);',
				'	vec3 hip = (blended(chain.x) * vec4(boundOf(chain.x), 1.0)).xyz;',
				'	vec3 knee = (blended(chain.y) * vec4(boundOf(chain.y), 1.0)).xyz;',
				'	vec3 ankle = (blended(chain.z) * vec4(boundOf(chain.z), 1.0)).xyz;',
				'	vec3 goal = ankle + vec3(0.0, lift, 0.0);',
				'	float l1 = max(length(knee - hip), 1e-5);',
				'	float l2 = max(length(ankle - knee), 1e-5);',
				'	vec3 toGoal = goal - hip;',
				'	float d = clamp(length(toGoal), abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4);',
				'	vec3 dir = normalize(toGoal);',
				'	vec3 bend = (knee - hip) - dir * dot(knee - hip, dir);',
				'	bend = length(bend) > 1e-6 ? normalize(bend) : normalize(cross(dir, vec3(1.0, 0.0, 0.0)));',
				'	float ca = clamp((l1 * l1 + d * d - l2 * l2) / (2.0 * l1 * d), -1.0, 1.0);',
				'	vec3 kneeTo = hip + dir * (ca * l1) + bend * (sqrt(1.0 - ca * ca) * l1);',
				'	vec3 reached = hip + dir * d;',
				'	if (leg.y > 2.5) {',
				'		float c = cos(-tilt);',
				'		float s = sin(-tilt);',
				'		mat3 r = mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);',
				'		return mat4(vec4(r[0], 0.0), vec4(r[1], 0.0), vec4(r[2], 0.0), vec4(reached - r * ankle, 1.0)) * m;',
				'	}',
				'	mat4 first = turnRound(knee - hip, kneeTo - hip, hip);',
				'	if (leg.y < 1.5) return first * m;',
				'	vec3 moved = (first * vec4(ankle, 1.0)).xyz;',
				'	return turnRound(moved - kneeTo, reached - kneeTo, kneeTo) * first * m;',
				'}',
				/* What a vertex graph of Blueprints does to a corner of a shape: nothing here; a material with a Vertex puts its own in this place. */
				'void blueprintVertex(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				/* The wind: the vertex graph of the wind of the scene (WindGraph) in this place, run before the Vertex of a material. */
				'void blueprintWind(vec3 position, vec3 normal, vec2 uv, float sway, float phase, float size, inout vec3 world, inout vec3 bent) {}',
				'void main() {',
				/*
				 * Its four joints in a loop, one of no weight passed over. Regression: posed four times over, inlined (each poses its
				 * leg, blending up to six frames of three joints), took a card 13 s to make, for each of its programs.
				 */
				'	mat4 moved = mat4(0.0);',
				'	for (int k = 0; k < 4; k++) {',
				'		if (aWeights[k] > 0.0) moved += posed(aJoints[k]) * aWeights[k];',
				'	}',
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
				'	if (uGrow > 0.0) {',
				'		vec3 outward = normalize(world - uShellCenter + bent * 0.001);',
				'		world += outward * uGrow;',
				'		bent = normalize(mix(bent, outward, 0.7));',
				'	}',
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
				'uniform vec3 uFloorLight;',
				'out vec4 outColor;',
				graphics.Chunks.SkyLight,
				'void main() {',
				'	vec3 v = normalize(-vWorld);',
				'	vec3 n = normalize(vNormal);',
				'	float front = step(0.0, dot(n, v));',
				'	if (front < 0.5) n = -n;',
				'	float fresnel = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);',
				'	vec3 r = reflect(-v, n);',
				'	float glint = pow(max(dot(r, uSun), 0.0), mix(600.0, 24.0, uFrost)) * mix(6.0, 0.6, uFrost);',
				'	vec3 sky = skyLight(r, uFrost, uSkyLight, uFloorLight, uSun, 1.25);',
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
				'			float s = enx_white2(at);',
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
				'uniform vec4 uHoleAt;',
				'uniform vec4 uHoleHalf;',
				'uniform mat3 uHoleTurn;',
				'uniform float uHeroFade;',
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
				/* What the weather and the year do to its surface, a beam that takes it away (WeatherGraph: weather_season, weather_snow_..., weather_dissolve, weather_puddles). */
				'void blueprintWeather() {}',
				'void main() {',
				'	if (uCut.w > 0.0 && distance(vWorld, uCut.xyz) < uCut.w) discard;',
				/* A hole cut in a hull (over the ramp of a ship standing: SceneAboard), a box turned by its yaw. */
				'	if (uHoleHalf.w > 0.5) {',
				'		vec3 off = vWorld - uHoleAt.xyz;',
				'		vec3 inHole = uHoleTurn * off;',
				'		if (all(lessThan(abs(inHole), uHoleHalf.xyz))) discard;',
				'	}',
				/* A hero the view is too close to fades in a dither (its own TAA blends it). */
				'	if (uHeroFade > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < uHeroFade) discard;',
				'	vec4 base = uBaseColor * texture(uColorMap, vUV);',
				/*
				 * What is cut by its alpha keeps as much of it far as near: the alpha of each step of its mipmap, the mean of the one
				 * before, is under the cut the more the farther, and the leaves of a far tree thinned to a few (the sunlit ground
				 * through its crown, pale). Raised by a quarter a step (Golus).
				 */
				'	if (uCutoff > 0.0) {',
				'		vec2 texel = vUV * vec2(textureSize(uColorMap, 0));',
				'		float mip = max(0.0, 0.5 * log2(max(dot(dFdx(texel), dFdx(texel)), dot(dFdy(texel), dFdy(texel)))));',
				'		base.a = min(1.0, base.a * (1.0 + mip * 0.25));',
				'	}',
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
				'	ownGlow += uDissolveColor * weather_dissolve(vWorld, albedo) * 3.0;',
				'	blueprintSurface(vWorld, n, vUV, albedo, base.a, ownRough, ownMetal, ownGlow, n);',
				/* The leaves of a tree of a file are what is green of its textures: they turn, thin out to bare branches, blossom. */
				'	if (uSeasonOn > 0.5 && uSeasonOn < 1.5) weather_season(albedo, enx_white2(floor((vWorld.xz + uEyeAt.xz - vBody.xz) * 0.22)), vBody, true);',
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
				'	float pool = weather_puddles(wet, flat2 * (1.0 - smooth2), vWorld + uEyeAt);',
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
				'	float laid = uSnowed * weather_snow_things(n.y, vWorld + uEyeAt);',
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
				'	vec3 skyAround = skyLight(n, 1.0, uSkyLight, uFloorLight, uSkySun, 1.25);',
				'	vec3 around = aroundLight(vWorld, n, skyAround);',
				/*
				 * The sky it mirrors as much as the light round it is of what comes there in the open (the probes, the daylight of a
				 * cave, the rooms of a ship): little under a roof, none deep in a cave. Regression: a metal deep in a cave mirrored
				 * the whole sky.
				 */
				'	float skySeenHere = clamp(dot(around, vec3(0.3, 0.59, 0.11)) / max(dot(skyAround * skySeen(vWorld) + sunBounce(vWorld), vec3(0.3, 0.59, 0.11)), 0.0001), 0.0, 1.0);',
				'	vec3 mirrored = skyLight(reflected, roughness, uSkyLight, uFloorLight, uSkySun, 1.25) * skySeenHere;',
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

			/*
			 * The surface of a body of noise for its cubes, its graph (BakeGraph, else LibraryBake): layer 0 its ground (rgb) and
			 * gloss (a), layer 1 its clouds (r), the glow of its lava (g) and its sparks (b).
			 */
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
				/* The four colors of the body by a height of 0 to 1 (its blocks paint with it). */
				'vec3 bake_ground(float h) {',
				'	if (h < 0.33) return mix(uColors[0], uColors[1], h / 0.33);',
				'	if (h < 0.66) return mix(uColors[1], uColors[2], (h - 0.33) / 0.33);',
				'	return mix(uColors[2], uColors[3], (h - 0.66) / 0.34);',
				'}',
				'void blueprintBake(vec3 p, inout vec4 surface, inout vec4 sky) {}',
				'void main() {',
				'	vec4 surface = vec4(0.5, 0.5, 0.5, 0.04);',
				'	vec4 sky = vec4(0.0, 0.0, 0.0, 1.0);',
				'	blueprintBake(cubeDirection(uFace, vQuad), surface, sky);',
				'	outColor = uLayer == 1 ? sky : surface;',
				'}'
			].join('\n'),

			/* The weather of a planet, a face of its cube (WEATHER): baked a face a frame, as its time goes. */
			Weather: head + [
				'in vec2 vQuad;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				graphics.Chunks.Cube,
				weather,
				'void main() {',
				'	outColor = blueprintForecast(cubeDirection(uFace, vQuad));',
				'}'
			].join('\n'),

			/* A body lit: its baked ground and clouds, the light of the stars, the shadows of balls, the air at its edge. */
			Planet: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vLocal;',
				'uniform float uExact;',
				'uniform float uBall;',
				'uniform vec2 uDepthRange;',
				'uniform mat4 uViewProjection;',
				'vec3 planetWorld;',
				'vec3 planetMesh() { return vWorld; }',
				'#define vWorld planetWorld',
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
				'uniform samplerCube uRelief;',
				'uniform float uReliefOn;',
				'uniform mat4 uModel;',
				'out vec4 outColor;',
				graphics.Chunks.Lights,
				graphics.Chunks.Noise,
				cloudsSeen,
				'float daylight(vec3 position, vec3 normal) {',
				'	float day = 0.0;',
				'	for (int i = 0; i < 4; i++) {',
				'		if (i >= uLightCount) break;',
				'		day += clamp(dot(normal, normalize(uLightPositions[i] - position)) * 2.0 + 0.4, 0.0, 1.0);',
				'	}',
				'	return clamp(day, 0.0, 1.0);',
				'}',
				/* Its ring, for the shadow it casts (the ring graph, its color and seed of its own: uRingColors, uRingSeed; uRingOn: it has one). */
				'uniform float uRingOn;',
				'uniform vec3 uRingAxis;',
				'uniform vec2 uRingSpan;',
				'uniform float uRingSeed;',
				'uniform vec3 uRingColors[4];',
				'void planetRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {}',
				/* Its picture lit, its clouds, its lights at night, its air at its edge (PlanetGraph: blueprintPlanet). */
				'void blueprintPlanet(vec3 n, vec3 v, vec3 p, inout vec3 color, inout float alpha) {}',
				'void main() {',
				'	planetWorld = planetMesh();',
				'	vec3 n = normalize(vNormal);',
				'	vec3 p = normalize(vLocal);',
				'	if (uExact > 0.5) {',
				'		vec3 middle = uModel[3].xyz;',
				'		vec3 ray = normalize(planetWorld - uCamera);',
				'		float b = dot(uCamera - middle, ray);',
				'		float h = b * b - uBall;',
				'		if (h < -(dot(uCamera - middle, uCamera - middle) - uBall) * 4e-6) discard;',
				'		h = max(h, 0.0);',
				'		float t = -b - sqrt(h);',
				'		if (t <= 0.0) discard;',
				'		planetWorld = uCamera + ray * t;',
				'		n = normalize(planetWorld - middle);',
				'		p = normalize(transpose(mat3(uModel)) * n);',
				'		vec4 clip = uViewProjection * vec4(planetWorld, 1.0);',
				'		gl_FragDepth = clamp(mix(uDepthRange.x, uDepthRange.y, clip.z / clip.w * 0.5 + 0.5), uDepthRange.x, uDepthRange.y);',
				'	}',
				'	else gl_FragDepth = gl_FragCoord.z;',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 1.0;',
				'	blueprintPlanet(n, v, p, color, alpha);',
				'	outColor = vec4(color, alpha);',
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
				/* A brown dwarf: belts of cloud round it as a gas giant has, its spots gone. */
				'uniform float uBands;',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				/* Its cells, spots, belts, limb and burn (the star graph: blueprintSun, its StarSurface; LibraryStar() of the library). */
				'void blueprintSun(vec3 n, vec3 v, vec3 p, inout vec3 color) {}',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 p = normalize(vLocal);',
				'	vec3 color = vec3(0.0);',
				'	blueprintSun(n, v, p, color);',
				'	outColor = vec4(color, 1.0);',
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
				'	if (!(glow >= 0.0) || glow > 1e4) discard;',
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
				/* Its bands, its gaps, its colors and its light (RingGraph: blueprintRing). */
				'void blueprintRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {}',
				'void main() {',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 0.0;',
				'	blueprintRing(vUV.x, vWorld, normalize(vNormal), color, alpha);',
				'	outColor = vec4(color, alpha);',
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
				/* What the weather and the year do to its surface, a beam that takes it away (WeatherGraph: weather_season, weather_snow_..., weather_dissolve, weather_puddles). */
				'void blueprintWeather() {}',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	vec3 v = normalize(uCamera - vWorld);',
				'	vec3 color = pow(min(vColor, vec3(1.0)), vec3(2.2));',
				/*
				 * The leaves of a plant are what is green of it: in autumn they turn, each tree to a color of its own; they thin
				 * out to bare branches as the year goes cold, and come back in spring with the flowers of some trees.
				 */
				'	if (uSeasonOn > 0.5) weather_season(color, enx_white2(floor((vWorld + uEyeAt) * 0.22).xz), vLocal, uSeasonOn < 1.5);',
				'	color *= 1.0 - uRough * 0.45 + uRough * 0.45 * fbm3(vLocal * 3.0, 3);',
				/* Snow lies on what looks up, thicker where the noise piles it. */
				/* A plant holds snow on its slopes too: on the cones of a fir, the tops of its blobs. */
				'	if (uSnowed > 0.0) color = mix(color, vec3(0.86, 0.9, 0.95), uSnowed * (uSeasonOn > 0.5 ? weather_snow_plants(normalize(vNormal).y, vWorld + uEyeAt) : weather_snow_solid(normalize(vNormal).y, vWorld + uEyeAt)));',
				'	float beamed = weather_dissolve(vWorld, color);',
				'	vec3 hot = max(vColor - vec3(1.0), 0.0) + uDissolveColor * beamed * 3.0;',
				'	lightShade = sunLit(vWorld, n);',
				'	vec3 sky = skyLight(n, 1.0, uSkyLight, uFloorLight, uSkySun, 1.25);',
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

			/*
			 * A layer of a shield as a shell round the outline of what it guards: clear where it is seen square on, bright at its
			 * edges, a slow ripple of light going over it; brighter the fuller it is (uColor.a), a flash where it was just hit.
			 */
			Shell: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vLocal;',
				'uniform vec4 uColor;',
				'uniform float uFlash;',
				'uniform float uTime;',
				'out vec4 outColor;',
				'void main() {',
				'	vec3 n = normalize(vNormal);',
				'	float edge = pow(1.0 - abs(dot(n, normalize(-vWorld))), 2.5);',
				'	float ripple = 0.5 + 0.5 * sin(dot(vLocal, vec3(9.0, 7.0, 11.0)) - uTime * 3.0);',
				'	vec3 color = uColor.rgb * ((0.03 + edge * 0.55) * (0.75 + 0.25 * ripple) * uColor.a + uFlash * (0.35 + edge));',
				'	outColor = vec4(color, 1.0);',
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
			/* What stands on the ground of a planet (ScenePlanet.PatchThings): its woods and houses, relative to their square. */
			ThingsVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec3 aColor;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOffset;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vColor;',
				'out vec3 vUp;',
				'uniform vec3 uCenter;',
				'void main() {',
				'	vWorld = aPosition + uOffset;',
				'	vNormal = aNormal;',
				'	vColor = aColor;',
				'	vUp = normalize(aPosition + uCenter);',
				'	gl_Position = uViewProjection * vec4(vWorld, 1.0);',
				'}'
			].join('\n'),

			/* Lit as the ground is (the sun, the light of the sky round it, the shadow of the sun) and as hazy as it is far. */
			Things: head + [
				'in vec3 vWorld;',
				'in vec3 vNormal;',
				'in vec3 vColor;',
				'in vec3 vUp;',
				'uniform vec3 uSun;',
				'uniform vec3 uSunColor;',
				'uniform vec4 uAir;',
				'uniform float uFog;',
				'uniform float uHigh;',
				'uniform vec4 uLevel;',
				/*
				 * Its trees: where plants stand for them, fading out between uBand.x and y (km; 0: none), each pixel the one the
				 * plants leave (the dither of the frame, uDither); faded out between uBand.z and w, the end of their reach.
				 */
				'uniform vec4 uBand;',
				'uniform float uDither;',
				'out vec4 outColor;',
				graphics.Chunks.Shadow,
				/* The air of the scene (AirGraph): its functions this shader asks for. */
				'#define ENX_AIR_GLOBE',
				'void blueprintAir() {}',
				'void main() {',
				'	if (uBand.w > 0.0) {',
				'		float far = length(vWorld);',
				'		float hole = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uDither * 0.618034);',
				'		if (uBand.y > 0.0 && hole < 1.0 - smoothstep(uBand.x, uBand.y, far)) discard;',
				'		if (hole >= 1.0 - smoothstep(uBand.z, uBand.w, far)) discard;',
				'	}',
				'	vec3 n = normalize(vNormal);',
				'	float rise = dot(vUp, uSun);',
				'	float light = clamp(rise * 3.0 + 0.3, 0.0, 1.0);',
				'	float dusk = 1.0 - smoothstep(0.0, 0.35, abs(rise));',
				'	vec3 around = vec3(0.05, 0.06, 0.08) + uAir.rgb * uAir.a * 0.3 * smoothstep(-0.25, 0.3, rise) + vec3(0.5, 0.25, 0.15) * dusk * uAir.a * 0.35;',
				'	float day = max(dot(n, uSun), 0.0) * sunShadow(vWorld, n);',
				'	vec3 color = vColor * (uSunColor * day + around);',
				'	color = mix(color, air_horizon_globe(light), clamp(air_haze_globe(vWorld), 0.0, 1.0));',
				'	if (uLevel.a > 0.0) color = mix(color, uLevel.rgb * (0.3 + 0.9 * dot(color, vec3(0.333))), uLevel.a);',
				'	outColor = vec4(color, 1.0);',
				'}'
			].join('\n'),

			GroundVertex: head + [
				'in vec3 aPosition;',
				'in vec3 aNormal;',
				'in vec2 aUV;',
				/* The colors of a ground that tells them (ScenePlanet): its biomes, its snow, its seas by their depth. */
				'in vec3 aColor;',
				/*
				 * Where it is on its square, 0 to 1: for the picture of the square (PatchPicture); then, of a point of its edge,
				 * where it goes to lie on the edge of a square one level coarser (zw and the x of the next), two (its yzw) and
				 * three (xyz of the last).
				 */
				'in vec4 aMaterials;',
				'in vec4 aMaterials2;',
				'in vec4 aMaterials3;',
				'out vec2 vPatch;',
				'out vec3 vPainted;',
				'uniform mat4 uViewProjection;',
				'uniform vec3 uOffset;',
				'uniform vec3 uCenter;',
				/* How many levels coarser the square beside each of its edges is (its first column, its last, its first row, its last). */
				'uniform vec4 uEdges;',
				'out vec3 vWorld;',
				'out vec3 vNormal;',
				'out vec3 vDirection;',
				'out vec2 vLand;',
				'void main() {',
				'	float coarser = aMaterials.x < 0.001 ? uEdges.x : aMaterials.x > 0.999 ? uEdges.y : aMaterials.y < 0.001 ? uEdges.z : aMaterials.y > 0.999 ? uEdges.w : 0.0;',
				'	vec3 position = aPosition + (coarser > 2.5 ? aMaterials3.xyz : coarser > 1.5 ? aMaterials2.yzw : coarser > 0.5 ? vec3(aMaterials.zw, aMaterials2.x) : vec3(0.0));',
				'	vWorld = position + uOffset;',
				'	vNormal = aNormal;',
				'	vDirection = normalize(position + uCenter);',
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
				/* How much of each texel of its picture snow lies on (its ground near of the snow of its biome). */
				'uniform sampler2D uSnowMap;',
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
				/* The far ground round a location (drawHorizon): its water mirrors the sky of the location as its sea does (uMirror: the air of the location, the light of its day; a of 0 elsewhere). */
				'uniform vec4 uMirror;',
				graphics.Chunks.SkyLight,
				'uniform samplerCube uSky;',
				'uniform float uCloudsOn;',
				'uniform float uDrift;',
				'uniform vec3 uCloudTint;',
				/* Its ring (uRingOn): its axis in the frame of the ground, its edges (km from the middle), its seed and colors. */
				'uniform float uRingOn;',
				'uniform vec3 uRingAxis;',
				'uniform vec2 uRingSpan;',
				'uniform float uRingSeed;',
				'uniform vec3 uRingColors[4];',
				'out vec4 outColor;',
				graphics.Chunks.Noise,
				/* The noises of the ground itself, only drawn: of a sine (n_hash at each of some forty of them, 7 s for the card to make it). */
				this.$Service('Noise').GLSLChunk(['enx_fvalue3']),
				graphics.Chunks.Shadow,
				/* The air of the scene (AirGraph): its functions this shader asks for. */
				'#define ENX_AIR_GLOBE',
				'void blueprintAir() {}',
				cloudsSeen,
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
				/*
				 * The tiles of the materials near (uTextured), as the ground of a location draws them: grass where it is green, dirt
				 * where it is dry, cliff where it is steep, each tinted by the color of the place and only where a pixel is finer
				 * than its features; laid in the plane at the anchor (metres from it). Of the block GroundTiles of the ground graph;
				 * a ground near puts the materials of its biomes in the place of the tiles (nearGroundSource).
				 */
				'void groundLaid(inout vec3 albedo, inout vec3 n, vec3 smoothed, vec3 near, float foot, float green, float wooded, float snow, float water, float cover, vec2 pictureSoft) {',
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
				/* Under its snow none: the white of its picture. */
				'		parts *= (1.0 - water) * (1.0 - snow * (1.0 - steep * 0.7));',
				'		bool side = abs(landSlope.x) > abs(landSlope.z);',
				'		vec3 laid = vec3(0.0);',
				'		float total = 0.0;',
				'		for (int k = 0; k < 4; k++) {',
				'			float seen = (1.0 - smoothstep(uMetres[k] * 0.6, uMetres[k] * 3.0, metresPx)) * parts[k];',
				'			if (seen > 0.01) {',
				/*
				 * One groundTile a turn, its plane chosen before it. Regression: three of them in a choice, each made three
				 * times over the loop the card unrolls, and the card took 7 s more to make the program (17 s under load).
				 */
				'				vec2 tileAt = k < 3 ? local.xz : side ? local.zy : local.xy;',
				'				vec2 tileX = k < 3 ? topX : side ? alongX : acrossX;',
				'				vec2 tileY = k < 3 ? topY : side ? alongY : acrossY;',
				'				vec4 tile = groundTile(float(k), uMetres[k], tileAt, tileX, tileY);',
				'				laid += albedo * mix(vec3(1.0), tile.rgb, 0.85) * mix(1.0, tile.a / 0.8, 0.4) * seen;',
				'				total += seen;',
				'			}',
				'		}',
				'		albedo = mix(albedo, laid / max(total, 1e-4), clamp(total, 0.0, 1.0));',
				'	}',
				'}',
				/* The alpha of the ring of the body where the way to its sun crosses it (the ring graph: its shadow, GroundRing). */
				'void groundRing(float r, vec3 world, vec3 normal, inout vec3 color, inout float alpha) {}',
				/* Its ground of the ground graph (GroundGraph; LibraryGround() of the library): see Grounds of SceneBlueprints. */
				'void blueprintGround(inout vec3 color) {}',
				'void main() {',
				'	vec3 color = vec3(0.0);',
				'	blueprintGround(color);',
				'	outColor = vec4(color, 1.0);',
				'}'
			].join('\n'),

			/*
			 * The depths of the far ground in the view of the location (drawHorizon), of the depths of its own view (uDepth,
			 * CopyDepth; uRange its near and far plane, metres; uForward the way the eye looks): each as far as it truly is
			 * along its ray, never nearer than where the ray leaves the ground of the location (uHalf, uPlace: the eye over its
			 * middle; past its edge by as far as its sea melts away), no farther than its far plane. Writes no colour.
			 */
			HorizonDepth: head + [
				'in vec2 vQuad;',
				'uniform sampler2D uDepth;',
				'uniform mat4 uMatrix;',
				'uniform mat4 uInverse;',
				'uniform vec3 uForward;',
				'uniform vec2 uRange;',
				'uniform vec2 uPlace;',
				'uniform float uHalf;',
				'out vec4 outColor;',
				'void main() {',
				/*
				 * A pixel of its outline against the sky (the sky round it, or under its one sample of depth) of a colour of both: as
				 * far as the view goes, of the colour of the air there, as the sky by it is. Regression: of the depth of the ground,
				 * white specks along the horizon (the air of the ground over the colour of the sky); of none, a dark line.
				 */
				'	ivec2 at = ivec2(gl_FragCoord.xy);',
				'	ivec2 most = textureSize(uDepth, 0) - 1;',
				'	float depth = texelFetch(uDepth, at, 0).r;',
				'	float near = depth;',
				'	float around = depth;',
				'	float other;',
				'	other = texelFetch(uDepth, clamp(at + ivec2(1, 0), ivec2(0), most), 0).r;',
				'	near = min(near, other);',
				'	around = max(around, other);',
				'	other = texelFetch(uDepth, clamp(at - ivec2(1, 0), ivec2(0), most), 0).r;',
				'	near = min(near, other);',
				'	around = max(around, other);',
				'	other = texelFetch(uDepth, clamp(at + ivec2(0, 1), ivec2(0), most), 0).r;',
				'	near = min(near, other);',
				'	around = max(around, other);',
				'	other = texelFetch(uDepth, clamp(at - ivec2(0, 1), ivec2(0), most), 0).r;',
				'	near = min(near, other);',
				'	around = max(around, other);',
				'	if (near >= 1.0) discard;',
				'	if (around >= 1.0) {',
				'		gl_FragDepth = 0.9999995;',
				'		outColor = vec4(0.0);',
				'		return;',
				'	}',
				'	float z = 2.0 * uRange.x * uRange.y / (uRange.y + uRange.x - (depth * 2.0 - 1.0) * (uRange.y - uRange.x));',
				'	vec4 far = uInverse * vec4(vQuad, 1.0, 1.0);',
				'	vec3 way = normalize(far.xyz / far.w);',
				'	vec2 side = vec2(way.x >= 0.0 ? uHalf : -uHalf, way.z >= 0.0 ? uHalf : -uHalf);',
				'	vec2 across = vec2(way.x >= 0.0 ? max(way.x, 1e-6) : min(way.x, -1e-6), way.z >= 0.0 ? max(way.z, 1e-6) : min(way.z, -1e-6));',
				'	vec2 exits = (side - uPlace) / across;',
				'	float along = max(z / max(dot(way, uForward), 1e-4), min(exits.x, exits.y));',
				'	vec4 clip = uMatrix * vec4(way * along, 1.0);',
				'	gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 0.9999995);',
				'	outColor = vec4(0.0);',
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
				/* How much of the light comes from all the sky under thick air (airAround): its blue gone into the colour of its air. */
				'uniform float uDiffuse;',
				/* 1 where a shell of clouds of a weather draws its own cirrus (SceneLighting): none of the sky's own wisps. */
				'uniform float uNoWisps;',
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
				/* How far under the level the horizon is seen (the sine of the angle): from high over a body the Sun shows under it. */
				'uniform float uDip;',
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
				graphics.Chunks.SkyLight,
				ripples,
				materials.Helpers,
				/* What its ground is made of: nothing here; a ground puts the materials of its slots in this place (SceneMaterials.Land). */
				'void landMaterials(vec3 place, float px, inout vec3 color, inout float height) {}',
				/* What a material graph of Blueprints does to the ground: nothing here; a ground with a Blueprint puts its own in this place. */
				'void blueprintSurface(vec3 position, vec3 normal, vec2 uv, inout vec3 color, inout float alpha, inout float rough, inout float metal, inout vec3 emission, inout vec3 bent) {}',
				/* The air of the scene (AirGraph): its functions this shader asks for. */
				'#define ENX_AIR_GROUND',
				'void blueprintAir() {}',
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
				graphics.Chunks.SkyLight,
				'vec3 reflectedSky(vec3 way) {',
				'	return skyLight(way, 0.0, uAir.rgb, uAir.rgb * 0.3, uSun, 1.0);',
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
				/* The air of the scene (AirGraph): its functions this shader asks for. */
				'#define ENX_AIR_GROUND',
				'void blueprintAir() {}',
				/* The water: the graph of water of the scene (WaterGraph, else the one of the library) in this place. */
				'void blueprintWater(inout vec3 color, inout float alpha) {}',
				'void main() {',
				/*
				 * A ground with a horizon past it (a location of a planet): its sea ends where it ends, fading out over an eighth of
				 * its half past it, the sea of the horizon past it. Regression: cut off there, a seam of two seas, a straight line.
				 */
				'	float bound = max(abs(vWorld.x + uEye.x), abs(vWorld.z + uEye.z));',
				'	if (uBound.y > 0.5 && bound > uBound.x * 1.125) discard;',
				'	vec3 color = vec3(0.0);',
				'	float alpha = 1.0;',
				'	blueprintWater(color, alpha);',
				'	if (uBound.y > 0.5) alpha *= 1.0 - smoothstep(uBound.x, uBound.x * 1.125, bound);',
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

			/*
			 * What a slab of the voxels of the light of probes holds (SceneProbes): the color of a surface, as it is, and that it is
			 * there (alpha over a quarter); what of it glows (a color over 1: a flame, a lamp) in its place, as bright as alpha
			 * is under 1 (alpha 1 - 0.45 of its glow, a quarter of it at most: Merge, Lit of SceneProbes).
			 */
			Voxel: head + [
				'in vec3 vColor;',
				'out vec4 outColor;',
				voxelOut,
				'void main() {',
				'	vec3 hot = max(vColor - vec3(1.0), 0.0);',
				'	outColor = voxelOut(vColor, hot * hot * 4.0);',
				'}'
			].join('\n'),

			/*
			 * The same of a model of a material: the mean of the picture of its color (a far step of its mipmaps) times its color
			 * and its tint, what of it glows of its Emissive (uSurfaceOn); a model of colors as Voxel. Regression: of the colors of
			 * its corners alone (white for a model of a file), a red car lit the road round it white, a sign of neon lit nothing.
			 */
			VoxelSurface: head + [
				'in vec3 vColor;',
				'in vec2 vUV;',
				'in vec3 vTint;',
				'uniform float uSurfaceOn;',
				'uniform vec4 uBaseColor;',
				'uniform sampler2D uColorMap;',
				'uniform vec3 uEmissive;',
				'uniform sampler2D uEmissiveMap;',
				'out vec4 outColor;',
				voxelOut,
				'void main() {',
				'	if (uSurfaceOn < 0.5) {',
				'		vec3 hot = max(vColor - vec3(1.0), 0.0);',
				'		outColor = voxelOut(vColor, hot * hot * 4.0);',
				'		return;',
				'	}',
				'	vec3 albedo = (uBaseColor * textureLod(uColorMap, vUV, 5.0)).rgb * vTint;',
				'	outColor = voxelOut(pow(max(albedo, vec3(0.0)), vec3(1.0 / 2.2)), uEmissive * textureLod(uEmissiveMap, vUV, 5.0).rgb);',
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
