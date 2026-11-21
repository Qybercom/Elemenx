/*
 * An editor of a whole world, its levels one in another: a galaxy (Scene of Setting galaxy, GalaxyData), the system of a
 * star of it (SceneEditor of Setting space, SystemData), a planet of the system (PlanetEditor), a location of the planet
 * (SceneEditor of a ground). The path over it goes up to any level; Enter goes down into what is picked (a star, a
 * planet). At the level of the galaxy its panel searches round where the view looks (GalaxyData.Search: a type, a class,
 * what was edited, a mass and a temperature, a text; at most 500, the nearest first): a row chosen is picked and flown to,
 * chosen twice gone into. What a world uses is edited beside it, each in a tab of its own: models (ModelEditor), plants (FloraEditor),
 * cutscenes (CutsceneEditor, each of a location of the world: Location, the key of it, played in a scene of it beside
 * the cutscene; one added in a location is of it) and materials (Blueprint of type material), kept in the world by their names. The graphs
 * of the library its grounds and planets are made of (blueprints/planet, sketch, carve of ElemenxGraphics) are changed
 * for it alone, each in a tab of its own (Blueprint of type generator), a copy of the library's; Reset gives the
 * library's back. Its planets have those of planet/ (planet/relief: the option ReliefGraph...), the grounds of its
 * locations those of sketch/ and carve/ (Graphs of their Terrain trait); the scenes of its systems and locations those of
 * shader/ (Graphs of Scene: the bake of a body of noise, the weather of the surfaces of things, the shape of a lightning)
 * and planet/envelope (what lies over and under the surface of their bodies, read by the scene), made again as one of them
 * changes.
 * Value is the world: {Name, Galaxy (options of GalaxyData.Make, or its data), Planets ({'star/body': the options of a
 * planet}), Locations ({'star/body/location': a document of SceneEditor}), Resources ({Models, Plants, Cutscenes,
 * Materials}: {ID: {Name, Value}}; a cutscene with its Location too), Graphs ({'planet/relief', 'sketch/river'...: a graph})}. change emits it after
 * each edit, level the path ({Path: [{Level, ID}]}).
 * Its file (Pack, Open) is a zip: world.json, the parts of its galaxy under galaxy/ (its systems with them).
 * Methods: World(), Load(world), Galaxy(), Path(), Enter(level, id, callback), Up(index), AddResource(kind),
 * OpenResource(kind, id), GraphNames(), OpenGraph(name), ResetGraph(name), Pack(callback), Open(source, callback).
 */
Elemenx.Component('WorldEditor', {
	$TemplateURL: 'WorldEditor.html',
	$StyleURL: 'WorldEditor.css',
	$Traits: ['EditorPanes'],
	$Meta: {
		Group: 'game',
		Icon: 'globe',
		Description: 'An editor of a whole world, level in level: a galaxy, the system of a star, a planet, a location; its models, plants, cutscenes, materials and graphs each in a tab beside it.',
		Events: {
			change: 'The world changed: {Name, Galaxy, Planets, Locations, Resources, Graphs}.',
			level: 'The level shown changed: {Path: [{Level, ID}]}.',
			error: 'A file of a world was not read: the error.'
		},
		Methods: ['World()', 'Load(world)', 'Galaxy()', 'Path()', 'Enter(level, id, callback)', 'Up(index)', 'AddResource(kind)', 'OpenResource(kind, id)', 'GraphNames()', 'OpenGraph(name)', 'ResetGraph(name)', 'ShaderGraphs()', 'Pack(callback)', 'Open(source, callback)'],
		Props: {
			Value: 'The world: {Name, Galaxy (options of GalaxyData.Make or its data), Planets, Locations, Resources, Graphs}.',
			Generator: 'A generator of models for its models (ModelEditor): function (description, callback (error, recipe)).',
			Label: 'What it shows, for screen readers.'
		}
	},
	PanesKey: 'world-editor',
	Value: null,
	Generator: null,
	Label: '',
	Version: 0,
	Tab: 'world',
	Time: 0,
	Picked: '',
	Body: '',
	Packing: false,
	GalaxyKey: '',
	SearchFilters: null,
	FoundList: null,
	Chosen: null,
	/* The graph of the library the panel would change next (GraphChosen). */
	GraphPicked: '',
	/* How many times its graphs changed: what the planet and the location are shown with is made again after. */
	GraphsVersion: 0,
	/* The scene shown is there (Remade takes it out for a frame). */
	Fresh: true,

	$OnCreate: function () {
		var own = {World: null, Path: [{Level: 'galaxy', ID: ''}], Tabs: [], Given: null, Shown: {}};

		this.Own = function () {
			return own;
		};

		this.Load(this.Value || {});
	},

	$OnRender: function () {
		/* A world given again from outside is taken; the one it emitted itself is not. */
		if (this.Value && this.Value !== this.Own().Given && this.Value !== this.Own().World)
			this.Load(this.Value);
	},

	/* The kinds of resources: the key in Resources, the kind of tab and the editor. */
	Kinds: function () {
		return [
			{Kind: 'model', Key: 'Models', Label: Elemenx.Locale.Text('graphics.worldEditor.models'), One: Elemenx.Locale.Text('graphics.worldEditor.model'), Add: Elemenx.Locale.Text('graphics.worldEditor.addModel')},
			{Kind: 'plant', Key: 'Plants', Label: Elemenx.Locale.Text('graphics.worldEditor.plants'), One: Elemenx.Locale.Text('graphics.worldEditor.plant'), Add: Elemenx.Locale.Text('graphics.worldEditor.addPlant')},
			{Kind: 'cutscene', Key: 'Cutscenes', Label: Elemenx.Locale.Text('graphics.worldEditor.cutscenes'), One: Elemenx.Locale.Text('graphics.worldEditor.cutscene'), Add: Elemenx.Locale.Text('graphics.worldEditor.addCutscene')},
			{Kind: 'material', Key: 'Materials', Label: Elemenx.Locale.Text('graphics.worldEditor.materials'), One: Elemenx.Locale.Text('graphics.worldEditor.material'), Add: Elemenx.Locale.Text('graphics.worldEditor.addMaterial')}
		];
	},

	KindOf: function (kind) {
		return this.Kinds().filter(function (one) {
			return one.Kind === kind;
		})[0] || null;
	},

	Load: function (world) {
		var own = this.Own();
		var galaxies = this.$Service('GalaxyData');
		var given = world || {};
		var resources = given.Resources || {};
		var galaxy = given.Galaxy && given.Galaxy.Manifest ? given.Galaxy : galaxies.Make(given.Galaxy || {Seed: 'world', Kind: 'spiral'});

		own.Given = world;
		own.World = {
			Name: given.Name || galaxy.Manifest.Name,
			Galaxy: galaxy,
			Planets: Object.assign({}, given.Planets || {}),
			Locations: Object.assign({}, given.Locations || {}),
			Resources: {Models: Object.assign({}, resources.Models || {}), Plants: Object.assign({}, resources.Plants || {}), Cutscenes: Object.assign({}, resources.Cutscenes || {}), Materials: Object.assign({}, resources.Materials || {})},
			Graphs: Object.assign({}, given.Graphs || {})
		};
		own.Path = [{Level: 'galaxy', ID: ''}];
		own.Tabs = [];

		this.GalaxyKey = 'world-editor:' + galaxy.Manifest.ID + ':' + (++this.Version);
		this.Tab = 'world';
		this.Picked = '';
		this.Body = '';
		this.FoundList = null;

		galaxies.Use(this.GalaxyKey, galaxy);
	},

	World: function () {
		return this.Own().World;
	},

	Galaxy: function () {
		return this.Own().World.Galaxy;
	},

	Path: function () {
		return this.Own().Path.map(function (step) {
			return {Level: step.Level, ID: step.ID};
		});
	},

	Level: function () {
		var path = this.Own().Path;

		return path[path.length - 1].Level;
	},

	Changed: function () {
		this.Version++;

		this.$Emit('change', this.Own().World);
	},

	/* The path as items of Breadcrumbs: the galaxy, the star, the body, the location. */
	PathItems: function () {
		var self = this;
		var world = this.Own().World;
		var galaxies = this.$Service('GalaxyData');

		return this.Own().Path.map(function (step, index) {
			var star;

			if (step.Level === 'galaxy')
				return {ID: String(index), Label: world.Galaxy.Manifest.Name, Icon: 'globe'};

			if (step.Level === 'system') {
				star = galaxies.Star(world.Galaxy, step.ID);

				return {ID: String(index), Label: star ? star.Name : step.ID, Icon: 'sun'};
			}

			return {ID: String(index), Label: step.Level === 'planet' ? self.BodyName(step.ID) : step.ID, Icon: step.Level === 'planet' ? 'circle' : 'map'};
		});
	},

	BodyName: function (id) {
		var system = this.SystemOf();
		var objects = system ? this.$Service('SystemData').Objects(system, 'world') : [];
		var found = objects.filter(function (spec) {
			return spec.ID === id;
		})[0];

		return found && found.Values && found.Values.Name ? found.Values.Name : id;
	},

	Went: function (event) {
		var detail = event && event.detail ? event.detail : event;
		var index = detail && detail.Item ? Number(detail.Item.ID) : Number(detail && detail.Index);
		if (!isNaN(index))
			this.Up(index);
	},

	/* Up to a level of the path (0: the galaxy). */
	Up: function (index) {
		var own = this.Own();
		if (index < 0 || index >= own.Path.length - 1) return;

		own.Path = own.Path.slice(0, index + 1);

		this.Tab = 'world';
		this.Body = '';
		this.Version++;

		this.$Emit('level', {Path: this.Path()});
	},

	/* The system of the star of the path (SystemData), or null. */
	SystemOf: function () {
		var step = this.Own().Path[1];

		return step ? this.$Service('GalaxyData').System(this.Own().World.Galaxy, step.ID) : null;
	},

	/* Down into a level: a system (id: a star), a planet (id: a body of the system), a location (id: its ID). */
	Enter: function (level, id, callback) {
		var self = this;
		var own = this.Own();
		var depth = {system: 1, planet: 2, location: 3}[level];
		var done = typeof callback === 'function' ? callback : function () {};

		if (!depth || own.Path.length < depth || !id) {
			done(new Error('WorldEditor: no level ' + level + ' here'));

			return;
		}

		own.Path = own.Path.slice(0, depth).concat([{Level: level, ID: String(id)}]);

		this.Tab = 'world';
		this.Picked = level === 'system' ? '' : this.Picked;
		this.Body = '';
		this.Version++;

		this.$Emit('level', {Path: this.Path()});

		if (level !== 'system') {
			done(null);

			return;
		}

		/* Its SceneEditor comes with the next drawing: the system is opened in it then. */
		this.Opening(0, function (editor) {
			editor.OpenSystem(self.SystemOf(), function (error) {
				done(error || null);
			});
		});
	},

	Opening: function (tries, then) {
		var self = this;
		var editor = this.$Ref('System', true);

		if (editor && editor.Scene && editor.Scene()) {
			then(editor);

			return;
		}

		if (tries < 200)
			window.setTimeout(function () {
				self.Opening(tries + 1, then);
			}, 25);
	},

	/* What Enter goes into now: the star picked in the galaxy, the body picked in a system. */
	CanEnter: function () {
		var level = this.Level();

		return this.Tab === 'world' && (level === 'galaxy' && !!this.Picked || level === 'system' && !!this.Body);
	},

	EnterLabel: function () {
		return this.Level() === 'galaxy' ? Elemenx.Locale.Text('graphics.worldEditor.enterSystem') : Elemenx.Locale.Text('graphics.worldEditor.enterPlanet');
	},

	EnterPicked: function () {
		if (this.Level() === 'galaxy' && this.Picked) this.Enter('system', this.Picked);
		else if (this.Level() === 'system' && this.Body) this.Enter('planet', this.Body);
	},

	/* The galaxy */

	GalaxyReady: function (scene) {
		this.GalaxyScene = function () {
			return scene;
		};
	},

	GalaxyName: function () {
		return this.Own().World.Galaxy.Manifest.Name;
	},

	GalaxyKind: function () {
		return this.Own().World.Galaxy.Manifest.Kind;
	},

	GalaxySeed: function () {
		return this.Own().World.Galaxy.Manifest.Seed;
	},

	KindOptions: function () {
		return this.$Service('GalaxyData').Kinds().map(function (kind) {
			return {Value: kind, Label: kind};
		});
	},

	GalaxyRenamed: function (name) {
		var value = name && name.target ? name.target.value : name;

		this.Own().World.Galaxy.Manifest.Name = String(value);
		this.Own().World.Name = String(value);

		this.Changed();
	},

	/* A galaxy of another kind or seed: made again, what was changed of it kept. */
	GalaxyRemade: function (key, value) {
		var galaxies = this.$Service('GalaxyData');
		var world = this.Own().World;
		var old = world.Galaxy;
		var options = {Seed: old.Manifest.Seed, Kind: old.Manifest.Kind, Name: old.Manifest.Name, ID: old.Manifest.ID};
		var made;

		options[key] = value && value.target ? value.target.value : value;
		made = galaxies.Make(options);
		made.Edits = old.Edits;
		made.Systems = old.Systems;
		made.Manifest.Systems = old.Manifest.Systems;
		world.Galaxy = made;

		this.GalaxyKey = 'world-editor:' + made.Manifest.ID + ':' + (this.Version + 1);
		this.Picked = '';

		galaxies.Use(this.GalaxyKey, made);

		this.Changed();
	},

	Timed: function (value) {
		this.Time = Number(value && value.detail !== undefined ? value.detail : value) || 0;
	},

	StarPicked: function (event) {
		this.Picked = event.ID || '';
		this.Version++;
	},

	/* The scene went into a star by itself (Enter of its keys): the system level. */
	Entered: function (event) {
		var scene = this.GalaxyScene ? this.GalaxyScene() : null;
		if (scene)
			scene.LeaveSystem();

		this.Enter('system', event.ID);
	},

	PickedStar: function () {
		return this.Picked ? this.$Service('GalaxyData').Star(this.Own().World.Galaxy, this.Picked) : null;
	},

	/* A body of no system picked (put in by hand), or null. */
	PickedBody: function () {
		var picked = this.Picked;

		return (this.Own().World.Galaxy.Edits.Added || []).filter(function (body) {
			return body.ID === picked && body.Kind !== 'star';
		})[0] || null;
	},

	PickedName: function () {
		var star = this.PickedStar();
		var body = this.PickedBody();

		return star ? star.Name : body ? body.Name || body.ID : '';
	},

	PickedNote: function () {
		var star = this.PickedStar();
		var body = this.PickedBody();

		/* A nebula or a cluster (GalaxyData.Objects): its kind and its size, not a class and a mass it has none of. */
		if (star && (star.Kind === 'nebula' || star.Kind === 'cluster'))
			return Elemenx.Locale.Text('graphics.worldEditor.objectNote', {type: Elemenx.Locale.Text('graphics.worldEditor.type-' + star.Type) + (star.Subtype ? ' ' + star.Subtype : ''), radius: star.Radius});

		if (star)
			return Elemenx.Locale.Text('graphics.worldEditor.starNote', {kind: star.Class, mass: star.Mass, temperature: Math.round(star.Temperature)});

		return body ? Elemenx.Locale.Text('graphics.worldEditor.bodyNote', {kind: body.Kind}) : '';
	},

	/* The search of the galaxy */

	/*
	 * What is searched for (GalaxyData.Search): Mass and Temperature as the logarithms the sliders go along (all of the
	 * slider: no bound); Radius ly round where the view looks, 0 all of the galaxy.
	 */
	Filters: function () {
		if (!this.SearchFilters)
			this.SearchFilters = {Text: '', Type: '', Class: '', Edited: '', Mass: [-2, 2], Temperature: [2.5, 5.3], Radius: 100};

		return this.SearchFilters;
	},

	SearchTypes: function () {
		var types = ['', 'star', 'main', 'giant', 'supergiant', 'white-dwarf', 'brown-dwarf', 'neutron', 'pulsar', 'magnetar', 'blackhole', 'nebula', 'hii', 'planetary', 'remnant', 'dark', 'cluster', 'open', 'globular'];

		return types.map(function (type) {
			return {Value: type, Label: Elemenx.Locale.Text('graphics.worldEditor.type-' + (type || 'any'))};
		});
	},

	EditedOptions: function () {
		return ['', 'renamed', 'written', 'any'].map(function (edited) {
			return {Value: edited, Label: Elemenx.Locale.Text('graphics.worldEditor.edited-' + (edited || 'all'))};
		});
	},

	RadiusOptions: function () {
		return [25, 100, 500, 2000, 10000, 0].map(function (radius) {
			return {Value: String(radius), Label: radius ? Elemenx.Locale.Text('graphics.worldEditor.within', {radius: radius}) : Elemenx.Locale.Text('graphics.worldEditor.everywhere')};
		});
	},

	RadiusValue: function () {
		return String(this.Filters().Radius);
	},

	MassText: function (value) {
		var mass = Math.pow(10, Number(value));

		return mass < 1 ? mass.toPrecision(2) : String(Math.round(mass * 10) / 10);
	},

	TemperatureText: function (value) {
		return String(Math.round(Math.pow(10, Number(value)) / 100) * 100);
	},

	/* A filter changed: searched again round where the view looks. */
	Searched: function (key, value) {
		var given = value && value.target ? value.target.value : value && value.detail !== undefined ? value.detail : value;

		this.Filters()[key] = key === 'Radius' ? Number(given) || 0 : given;

		this.RunSearch();
	},

	/* The search round where the view looks now (the place it looks at as it was at time 0: the stars are made so). */
	RunSearch: function () {
		var galaxies = this.$Service('GalaxyData');
		var galaxy = this.Own().World.Galaxy;
		var scene = this.GalaxyScene ? this.GalaxyScene() : null;
		var view = scene ? scene.GalaxyView() : null;
		var filters = this.Filters();
		var whole = filters.Mass[0] <= -2 && filters.Mass[1] >= 2;
		var hot = filters.Temperature[0] <= 2.5 && filters.Temperature[1] >= 5.3;

		this.FoundList = galaxies.Search(galaxy, {
			Centre: view ? galaxies.Position(galaxy, view.Target, -this.Time) : [0, 0, 0],
			Radius: filters.Radius || galaxy.Manifest.Radius * 1.5,
			Type: filters.Type,
			Class: filters.Class,
			Edited: filters.Edited,
			Mass: whole ? null : [Math.pow(10, filters.Mass[0]), Math.pow(10, filters.Mass[1])],
			Temperature: hot ? null : [Math.pow(10, filters.Temperature[0]), Math.pow(10, filters.Temperature[1])],
			Text: filters.Text,
			Limit: 500,
			/* A few tenths of a second at most: where stars are thick (its middle) a part of the region, told so. */
			Budget: 60000
		});

		this.Version++;
	},

	/* The rows of the list: its name, its class or its type, how far it is. */
	FoundItems: function () {
		var found = this.FoundList;

		return found ? found.Items.map(function (item) {
			var what = item.Class || Elemenx.Locale.Text('graphics.worldEditor.type-' + item.Type) + (item.Subtype ? ' ' + item.Subtype : '');

			return {ID: item.ID, Label: item.Name + ' · ' + what + ' · ' + Elemenx.Locale.Text('graphics.worldEditor.away', {distance: item.Distance < 10 ? item.Distance.toFixed(1) : Math.round(item.Distance)})};
		}) : [];
	},

	FoundNote: function () {
		var found = this.FoundList;
		var note = found ? Elemenx.Locale.Text('graphics.worldEditor.found', {count: found.Items.length}) : '';

		if (found && found.More)
			note += ' ' + Elemenx.Locale.Text('graphics.worldEditor.foundMore');

		if (found && found.Partial)
			note += ' ' + Elemenx.Locale.Text('graphics.worldEditor.foundPartial');

		return note;
	},

	/* A row chosen: picked and flown to; chosen again at once (a double press): gone into. */
	FoundChosen: function (event) {
		var item = event && event.detail && event.detail.ID ? event.detail : event;
		var scene = this.GalaxyScene ? this.GalaxyScene() : null;
		var now = Date.now();
		var found = (this.FoundList ? this.FoundList.Items : []).filter(function (one) {
			return one.ID === item.ID;
		})[0];
		var again = this.Chosen && this.Chosen.ID === item.ID && now - this.Chosen.At < 450 && !!found && ['star', 'nebula', 'cluster', 'blackhole'].indexOf(found.Kind) !== -1;

		this.Chosen = {ID: item.ID, At: now};

		if (again) {
			this.Enter('system', item.ID);

			return;
		}

		this.Picked = item.ID;

		if (scene)
			scene.GalaxyFocus(item.ID);

		this.Version++;

		/* The second press counted from when the first was done with (the flight begun takes a moment on a slow page). */
		this.Chosen.At = Date.now();
	},

	PickedRenamed: function (name) {
		var galaxies = this.$Service('GalaxyData');
		var galaxy = this.Own().World.Galaxy;
		var value = String(name && name.target ? name.target.value : name);
		var body = (galaxy.Edits.Added || []).filter(function (one) {
			return one.ID === this.Picked;
		}, this)[0];

		if (body) galaxies.AddBody(galaxy, Object.assign({}, body, {Name: value}));
		else galaxies.Rename(galaxy, this.Picked, value);

		this.Changed();
	},

	PickedRemoved: function () {
		this.$Service('GalaxyData').Remove(this.Own().World.Galaxy, this.Picked);

		this.Picked = '';

		this.Changed();
	},

	/* A velocity of the body picked (ly a Myr) along an axis. */
	Moved: function (axis, value) {
		var body = this.PickedBody();
		var velocity;

		if (!body) return;

		velocity = (body.Velocity || [0, 0, 0]).slice();
		velocity[axis] = Number(value && value.detail !== undefined ? value.detail : value) || 0;

		this.$Service('GalaxyData').AddBody(this.Own().World.Galaxy, Object.assign({}, body, {Velocity: velocity}));

		this.Changed();
	},

	/* A star or a body of no system put where the view looks. */
	AddedHere: function (kind) {
		var scene = this.GalaxyScene ? this.GalaxyScene() : null;
		var galaxy = this.Own().World.Galaxy;
		var view = scene ? scene.GalaxyView() : {Target: [0, 0, 0]};
		var galaxies = this.$Service('GalaxyData');
		var place = galaxies.Position(galaxy, view.Target, -this.Time);
		var count = (galaxy.Edits.Added || []).length + 1;
		var id = (kind === 'star' ? 'star-' : 'body-') + count + '-' + Date.now().toString(36);

		galaxies.AddBody(galaxy, {ID: id, Kind: kind, Name: (kind === 'star' ? 'Star ' : 'Body ') + count, Mass: kind === 'star' ? 1 : undefined, Place: place, Velocity: [0, 0, 0]});

		this.Picked = id;

		this.Changed();

		return id;
	},

	/* The system */

	SystemNote: function () {
		return this.Body ? Elemenx.Locale.Text('graphics.worldEditor.bodyPicked', {name: this.BodyName(this.Body)}) : Elemenx.Locale.Text('graphics.worldEditor.pickBody');
	},

	SystemChanged: function () {
		var editor = this.$Ref('System', true);
		var step = this.Own().Path[1];
		if (!editor || !step) return;

		this.$Service('GalaxyData').SetSystem(this.Own().World.Galaxy, step.ID, editor.System());

		this.Changed();
	},

	BodyPicked: function (event) {
		var editor = this.$Ref('System', true);
		var object = editor && event.ID ? editor.Scene().Get(event.ID) : null;

		/* A planet or a moon: a body with a surface to go down to. */
		this.Body = object && object.Traits && object.Traits.Body ? event.ID : '';
		this.Version++;
	},

	/* The planet */

	PlanetKey: function () {
		var path = this.Own().Path;

		return path[1].ID + '/' + path[2].ID;
	},

	/* The options of the planet with the graphs of the world (planet/relief: ReliefGraph...), the same object while neither changes. */
	PlanetValue: function () {
		var key = this.PlanetKey();
		var planet = this.Own().World.Planets[key] || null;
		var graphs = this.Own().World.Graphs;
		var shown = this.Own().Shown;
		var made;

		if (shown.Planet && shown.Planet.Key === key && shown.Planet.From === planet && shown.Planet.Graphs === this.GraphsText()) return shown.Planet.Value;

		made = Object.assign({}, planet || {Seed: key});

		this.$Service('ScenePlanet').ReliefNames.forEach(function (name) {
			if (graphs['planet/' + name.toLowerCase()])
				made[name + 'Graph'] = graphs['planet/' + name.toLowerCase()];
		});

		shown.Planet = {Key: key, From: planet, Graphs: this.GraphsText(), Value: made};

		return made;
	},

	/* A planet as it is kept: of no graphs of the world (they are the world's). */
	PlanetChanged: function (planet) {
		var kept = Object.assign({}, planet);

		this.$Service('ScenePlanet').ReliefNames.forEach(function (name) {
			delete kept[name + 'Graph'];
		});

		delete kept.ReliefSources;

		this.Own().World.Planets[this.PlanetKey()] = kept;
		this.Own().Shown.Planet = {Key: this.PlanetKey(), From: kept, Graphs: this.GraphsText(), Value: planet};

		this.Changed();
	},

	LocationOpened: function (opened) {
		var key = this.PlanetKey() + '/' + opened.ID;
		var place = opened.Location.Place;
		var locations = this.Own().World.Locations;
		if (!locations[key])
			locations[key] = {Version: 1, Name: opened.ID, Setting: 'ground', Scene: {Version: 1, Seed: '', Cosmos: '', Weather: 'clear', Time: 0, Travels: [], Removed: [], Overrides: {}, Added: [
				{ID: 'ground', Kind: 'ground', Values: {}, Traits: {Terrain: {World: opened.Location.World}}, Parts: []},
				{ID: 'sun', Kind: 'sun', Values: {}, Traits: {Sun: {Time: 11, Latitude: Math.round(place.Latitude * 100) / 100}}, Parts: []}
			]}};

		this.Enter('location', opened.ID);
	},

	/* The location */

	LocationKey: function () {
		var path = this.Own().Path;

		return path[1].ID + '/' + path[2].ID + '/' + path[3].ID;
	},

	/* The document of the location, its ground with the graphs of the world of sketch/ and carve/ (Graphs of its Terrain). */
	LocationValue: function () {
		var key = this.LocationKey();
		var document = this.Own().World.Locations[key] || null;
		var shown = this.Own().Shown;
		var graphs = this.GroundGraphs();

		if (!document) return null;

		if (shown.Location && shown.Location.Key === key && shown.Location.From === document && shown.Location.Graphs === this.GraphsText()) return shown.Location.Value;

		shown.Location = {Key: key, From: document, Graphs: this.GraphsText(), Value: this.Grounded(document, graphs)};

		return shown.Location.Value;
	},

	/* A copy of a document of a location, the Graphs of the Terrain of its grounds those given (none: none). */
	Grounded: function (document, graphs) {
		var copy = JSON.parse(JSON.stringify(document));

		((copy.Scene || {}).Added || []).forEach(function (object) {
			if (!object.Traits || !object.Traits.Terrain) return;

			if (graphs) object.Traits.Terrain.Graphs = graphs;
			else delete object.Traits.Terrain.Graphs;
		});

		return copy;
	},

	/* A location as it is kept: of no graphs of the world. */
	LocationChanged: function (document) {
		var kept = this.Grounded(document, null);

		this.Own().World.Locations[this.LocationKey()] = kept;
		this.Own().Shown.Location = {Key: this.LocationKey(), From: kept, Graphs: this.GraphsText(), Value: document};

		this.Changed();
	},

	/* The resources */

	Groups: function () {
		var resources = this.Own().World.Resources;

		return this.Kinds().map(function (kind) {
			var list = resources[kind.Key];

			return {Kind: kind.Kind, Label: kind.Label, Add: kind.Add, Items: Object.keys(list).map(function (id) {
				return {ID: id, Label: list[id].Name || id, Tab: kind.Kind + ':' + id};
			})};
		});
	},

	ModelNames: function () {
		var models = this.Own().World.Resources.Models;

		return Object.keys(models).map(function (id) {
			return models[id].Name || id;
		});
	},

	AddResource: function (kind) {
		var resources = this.Own().World.Resources;
		var known = this.KindOf(kind);
		var list;
		var id;
		var count;

		if (!known) return '';

		list = resources[known.Key];
		count = Object.keys(list).length + 1;
		id = kind + '-' + count;

		while (list[id])
			id = kind + '-' + (++count);

		list[id] = {Name: known.One + ' ' + count, Value: kind === 'model' ? {Version: 1, Name: id, Recipe: {Parts: []}} : kind === 'cutscene' ? {} : null};

		/* A cutscene added in a location is of it. */
		if (kind === 'cutscene' && this.Level() === 'location')
			list[id].Location = this.LocationKey();

		this.Changed();
		this.OpenResource(kind, id);

		return id;
	},

	OpenResource: function (kind, id) {
		var own = this.Own();
		var tab = kind + ':' + id;
		if (own.Tabs.indexOf(tab) === -1)
			own.Tabs.push(tab);

		this.Tab = tab;
		this.Version++;
	},

	ResourceKind: function (tab) {
		return tab && tab !== 'world' && String(tab).indexOf('graph:') !== 0 ? String(tab).split(':')[0] : '';
	},

	/* The resource of a tab: its list and its ID. */
	ResourceOf: function (tab) {
		var kind = this.KindOf(this.ResourceKind(tab));
		var id = String(tab).slice(String(tab).indexOf(':') + 1);

		return kind ? {List: this.Own().World.Resources[kind.Key], ID: id} : null;
	},

	ResourceValue: function (version, tab) {
		var found = this.ResourceOf(tab);

		return found && found.List[found.ID] ? found.List[found.ID].Value : null;
	},

	ResourceChanged: function (tab, value) {
		var found = this.ResourceOf(tab);
		if (!found || !found.List[found.ID]) return;

		found.List[found.ID].Value = value;

		this.$Emit('change', this.Own().World);
	},

	/* The cutscenes of the world */

	/* Its locations to choose for a cutscene: {Value (its key), Label (its name, its body)}. */
	LocationOptions: function () {
		var locations = this.Own().World.Locations;

		return Object.keys(locations).map(function (key) {
			var parts = key.split('/');

			return {Value: key, Label: (locations[key].Name || parts[2]) + ' (' + parts[1] + ')'};
		});
	},

	/* The location a cutscene of a tab is of: its key, '' of none (or of one no longer in the world). */
	CutsceneLocation: function (version, tab) {
		var found = this.ResourceOf(tab);
		var key = found && found.List[found.ID] ? found.List[found.ID].Location || '' : '';

		return key && this.Own().World.Locations[key] ? key : '';
	},

	CutsceneLocationChosen: function (tab, event) {
		var found = this.ResourceOf(tab);
		if (!found || !found.List[found.ID]) return;

		found.List[found.ID].Location = String(event && event.target ? event.target.value : event && event.detail !== undefined ? event.detail : event || '');

		this.Changed();
	},

	CutsceneSceneReady: function (scene) {
		this.Own().Cutscene = {Scene: scene, Key: ''};
		this.Version++;
	},

	/*
	 * The Scene a cutscene of the tab plays in: the one of its location (its document, of the graphs of the world), loaded
	 * again when another location is chosen. Regression: its tab gave CutsceneEditor no scene: Play, Record, the camera and
	 * the keys from the view did nothing.
	 */
	CutsceneScene: function (version, tab) {
		var own = this.Own().Cutscene;
		var key = this.CutsceneLocation(version, tab);
		var document = key ? this.Grounded(this.Own().World.Locations[key], this.GroundGraphs()) : null;

		/* None while its scene is made, nor one gone (its location taken away, the scene with it). */
		if (!own || !own.Scene || !key || own.Scene.Scene().Gone) return null;

		if (own.Key !== key) {
			own.Key = key;

			own.Scene.Load(document.Scene || {Version: 1, Seed: '', Time: 0, Travels: [], Added: [], Removed: [], Overrides: {}});
		}

		return own.Scene;
	},

	TabItems: function () {
		var self = this;

		return [{ID: 'world', Label: Elemenx.Locale.Text('graphics.worldEditor.world'), Icon: 'globe'}].concat(this.Own().Tabs.map(function (tab) {
			var found = self.ResourceOf(tab);

			if (self.GraphOf(tab))
				return {ID: tab, Label: self.GraphOf(tab), Icon: 'code', Closable: true};

			return {ID: tab, Label: found && found.List[found.ID] ? found.List[found.ID].Name : tab, Closable: true};
		}));
	},

	TabChosen: function (value) {
		this.Tab = value && value.detail !== undefined ? value.detail : value;
		/* What a tab shows is of the world as it is now (its graphs may have changed in another). */
		this.Version++;
	},

	TabClosed: function (value) {
		var tab = value && value.detail !== undefined ? value.detail : value;
		var own = this.Own();

		own.Tabs = own.Tabs.filter(function (one) {
			return one !== tab;
		});

		if (this.Tab === tab)
			this.Tab = 'world';

		this.Version++;
	},

	/* The graphs */

	/* The graphs of the library a world may change: planet/, sketch/, carve/ and shader/ of ElemenxGraphics, by their names. */
	GraphNames: function () {
		return (Elemenx.Resources('Blueprints') || []).filter(function (name) {
			return /^ElemenxGraphics\/(planet|sketch|carve|shader)\/[^/]+$/.test(name);
		}).map(function (name) {
			return name.slice('ElemenxGraphics/'.length);
		}).sort();
	},

	/* What the graphs of the world are now, as a text: what the planet and the location are shown with changes with it. */
	GraphsText: function () {
		var own = this.Own();

		if (own.GraphsOf !== own.World.Graphs || own.GraphsVersion !== this.GraphsVersion) {
			own.GraphsOf = own.World.Graphs;
			own.GraphsVersion = this.GraphsVersion;
			own.GraphsKey = JSON.stringify(own.World.Graphs);
		}

		return own.GraphsKey;
	},

	/*
	 * Its graphs of the scenes it shows (shader/, and planet/envelope: what lies over and under the surface of their bodies,
	 * read by the scene, not by the planet), the Graphs of those scenes; the same object while they stay, null with none.
	 */
	ShaderGraphs: function () {
		var self = this;
		var own = this.Own();
		var graphs = own.World.Graphs;
		var text = this.GraphsText();
		var made = null;

		if (own.ShadersKey === text) return own.Shaders;

		Object.keys(graphs).forEach(function (name) {
			if (self.Scened(name)) {
				made = made || {};
				made[name] = graphs[name];
			}
		});

		own.ShadersKey = text;
		own.Shaders = made;

		return made;
	},

	/* Whether a graph of the world is one of its scenes (shader/, planet/envelope). */
	Scened: function (name) {
		return String(name).indexOf('shader/') === 0 || name === 'planet/envelope';
	},

	/*
	 * A scene is drawn with its shader graphs as it is made: one of them changed, the scene of the system or the location
	 * shown is made again (out for a frame), the document it shows kept by the world.
	 */
	Remade: function (name) {
		var self = this;

		if (!this.Scened(name)) return;

		this.Fresh = false;
		this.Version++;

		setTimeout(function () {
			self.Fresh = true;
			self.Version++;
		}, 0);
	},

	/* Those of the grounds of its locations (sketch/, carve/), or null with none. */
	GroundGraphs: function () {
		var graphs = this.Own().World.Graphs;
		var made = null;

		Object.keys(graphs).forEach(function (name) {
			if (/^(sketch|carve)\//.test(name)) {
				made = made || {};
				made[name] = graphs[name];
			}
		});

		return made;
	},

	/* The groups of the panel: the graphs changed, each a button of its tab. */
	GraphItems: function () {
		return Object.keys(this.Own().World.Graphs).sort().map(function (name) {
			return {ID: name, Label: name, Tab: 'graph:' + name};
		});
	},

	/* The graphs of the library not changed yet, to change one. */
	GraphOptions: function () {
		var graphs = this.Own().World.Graphs;

		return [{Value: '', Label: Elemenx.Locale.Text('graphics.worldEditor.pickGraph')}].concat(this.GraphNames().filter(function (name) {
			return !graphs[name];
		}).map(function (name) {
			return {Value: name, Label: name};
		}));
	},

	GraphChosen: function (value) {
		this.GraphPicked = String(value && value.target ? value.target.value : value && value.detail !== undefined ? value.detail : value || '');
	},

	GraphChange: function () {
		if (this.GraphPicked)
			this.OpenGraph(this.GraphPicked);

		this.GraphPicked = '';
	},

	/* A graph of the world in its tab: changed for the first time, a copy of the library's. */
	OpenGraph: function (name) {
		var own = this.Own();
		var tab = 'graph:' + name;
		var library;

		if (!own.World.Graphs[name]) {
			library = Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + name);

			if (!library) return;

			own.World.Graphs[name] = JSON.parse(JSON.stringify(library));

			this.GraphsVersion++;

			this.Remade(name);

			this.Changed();
		}

		if (own.Tabs.indexOf(tab) === -1)
			own.Tabs.push(tab);

		this.Tab = tab;
		this.Version++;
	},

	/* The graph of the library back: the world's dropped, its tab closed. */
	ResetGraph: function (name) {
		var own = this.Own();
		if (!own.World.Graphs[name]) return;

		delete own.World.Graphs[name];

		this.GraphsVersion++;

		this.Remade(name);

		this.TabClosed('graph:' + name);
		this.Changed();
	},

	GraphOf: function (tab) {
		return String(tab).indexOf('graph:') === 0 ? String(tab).slice(6) : '';
	},

	GraphValue: function (version, tab) {
		return this.Own().World.Graphs[this.GraphOf(tab)] || null;
	},

	GraphChanged: function (tab, value) {
		var name = this.GraphOf(tab);
		if (!name || !this.Own().World.Graphs[name]) return;

		this.Own().World.Graphs[name] = value;
		this.GraphsVersion++;

		this.Remade(name);
		this.$Emit('change', this.Own().World);
	},

	/* The file */

	/* The bytes of the file of the world (a zip): world.json and the parts of its galaxy under galaxy/. */
	Pack: function (callback) {
		var galaxies = this.$Service('GalaxyData');
		var archive = this.$Service('Archive');
		var world = this.Own().World;
		var files = {};
		var store = galaxies.FilesStore(files);

		galaxies.Write(world.Galaxy, {
			Read: function (part, done) {
				store.Read(part, done);
			},
			Write: function (part, bytes, done) {
				files['galaxy/' + galaxies.Path(part)] = bytes;

				done(null);
			}
		}, function (error) {
			if (error) {
				callback(error);

				return;
			}

			files['world.json'] = new TextEncoder().encode(JSON.stringify({Format: 'elemenx-world', Version: 1, Name: world.Name, Planets: world.Planets, Locations: world.Locations, Resources: world.Resources, Graphs: world.Graphs}));

			archive.Compress(files, callback);
		}, true);
	},

	/* A world of its file (bytes, a Blob, or a File), shown from its galaxy. */
	Open: function (source, callback) {
		var self = this;
		var galaxies = this.$Service('GalaxyData');
		var done = typeof callback === 'function' ? callback : function () {};
		var reader;

		function expanded (bytes) {
			self.$Service('Archive').Expand(bytes, function (error, files) {
				var world;

				if (error) {
					self.$Emit('error', error);

					done(error);

					return;
				}

				try {
					world = JSON.parse(new TextDecoder().decode(files['world.json']));
				}
				catch (wrong) {
					self.$Emit('error', wrong);

					done(wrong);

					return;
				}

				galaxies.FromStore({
					Read: function (part, then) {
						then(null, files['galaxy/' + galaxies.Path(part)] || null);
					}
				}, function (failed, galaxy) {
					if (failed) {
						self.$Emit('error', failed);

						done(failed);

						return;
					}

					world.Galaxy = galaxy;

					self.Load(world);

					self.Own().Given = null;

					self.Changed();

					done(null, self.Own().World);
				});
			});
		}

		if (typeof Blob !== 'undefined' && source instanceof Blob) {
			reader = new FileReader();

			reader.onload = function () {
				expanded(reader.result);
			};
			reader.onerror = function () {
				done(reader.error);
			};

			reader.readAsArrayBuffer(source);

			return;
		}

		expanded(source);
	},

	Downloaded: function () {
		var self = this;

		this.Packing = true;

		this.Pack(function (error, bytes) {
			var link;

			self.Packing = false;

			if (error) {
				self.$Emit('error', error);

				return;
			}

			link = document.createElement('a');
			link.href = URL.createObjectURL(new Blob([bytes], {type: 'application/zip'}));
			link.download = (self.Own().World.Name || 'world') + '.world';

			link.click();

			window.setTimeout(function () {
				URL.revokeObjectURL(link.href);
			}, 1000);
		});
	},

	Uploaded: function (files) {
		var list = files && files.target ? files.target.files : files;
		if (list && list[0])
			this.Open(list[0]);

		if (files && files.target)
			files.target.value = '';
	}
});
