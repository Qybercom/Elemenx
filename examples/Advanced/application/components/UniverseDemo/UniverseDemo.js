/*
 * UniverseDemo (Gaming): the galaxy, its systems and their grounds in one scene. It starts in the system of Terra, one star
 * of the galaxy (its home: SetSystem of GalaxyData on the star nearest where a system lies by default); the map of the
 * galaxy (Galaxy map) picks another star and goes into its system, made of its seed, its planets of a ground globes of
 * their seeds. A ship of its own in each system: W and S its speed, A and D yaw, R and F pitch, H warps (to what it aims
 * at, T, G turns to it), J jumps while held, [ and ] the step of warp; down to a planet and onto its ground as in Orbit.
 */
Elemenx.Component('UniverseDemo', {
	$TemplateURL: 'UniverseDemo.html',
	$Traits: ['SceneDemo'],
	UniverseGalaxy: {Seed: 'orbit', Kind: 'spiral'},
	UniverseHome: '',
	UniverseEntered: '',
	UniversePicked: '',
	UniverseNote: 'Starting in the system of Terra…',
	UniverseSteps: [{Value: '1', Label: 'Step 1'}, {Value: '2', Label: 'Step 2'}, {Value: '3', Label: 'Step 3'}, {Value: '4', Label: 'Step 4'}, {Value: '5', Label: 'Step 5'}, {Value: '6', Label: 'Step 6'}],
	UniverseStep: '3',
	UniverseCockpit: false,
	/* Where to go in the system of Terra: each aimed at, at a step of warp of some seconds there, what to see when there. */
	UniverseGoals: [
		{Value: '', Label: 'Go to...'},
		{Value: 'jove', Label: 'Jove (gas giant)', Step: '4', Note: 'down through its clouds of ammonia, of water (lightning), the dark and the glow of its depth, to its core'},
		{Value: 'nerid', Label: 'Nerid (ice giant)', Step: '5', Note: 'down through its clouds of methane and of hydrogen sulphide, the dark, the heat of its mantle of ices'},
		{Value: 'tidra', Label: 'Tidra (haze, as Titan)', Step: '5', Note: 'its orange haze and its clouds of methane, a tenth of the light of its sun on its ground'},
		{Value: 'vesper', Label: 'Vesper (thick air, as Venus)', Step: '4', Note: 'its clouds of sulphuric acid at 50 to 70 km, 92 bar and 737 K on its ground'},
		{Value: 'ferro', Label: 'Ferro (no air, as Mercury)', Step: '4', Note: 'no air: black sky down to its ground'},
		{Value: 'luna', Label: 'Luna (no air)', Step: '2', Note: 'no air: black sky down to its ground'}
	],
	UniverseGoal: '',
	/* The graph open (DemoGraph: '' none), those its scene is drawn with (Graphs of Scene), its scene made again as one changes. */
	UniverseGraphOpen: '',
	UniverseGraphs: null,
	UniverseFresh: true,

	UniverseGraphOpened: function (name) {
		this.UniverseGraphOpen = this.UniverseGraphOpen === name ? '' : name;
	},

	UniverseGraphChanged: function (event) {
		var self = this;
		var given = event && event.detail ? event.detail : event;
		var graphs = Object.assign({}, this.UniverseGraphs || {});

		if (given.Graph) graphs[given.Name] = given.Graph;
		else delete graphs[given.Name];

		this.UniverseGraphs = Object.keys(graphs).length ? graphs : null;
		this.UniverseFresh = false;

		setTimeout(function () {
			self.UniverseFresh = true;
		}, 0);
	},
	UniverseAir: '',
	UniverseTravel: '',
	UniverseAim: '',
	UniverseArriving: false,

	/* The ship of the demo, in its own measures (read off its model). */
	UniverseShip: {Model: 'space_ship (1).glb', Length: 89, Mounts: [
		{Kind: 'engine', At: [0.25, 0.485, -1.835], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1},
		{Kind: 'engine', At: [-0.25, 0.485, -1.835], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1},
		{Kind: 'engine', At: [0.25, 0.355, -1.75], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1},
		{Kind: 'engine', At: [-0.25, 0.355, -1.75], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1}
	]},

	/* The system of Terra, as data (SystemData: {Objects}): the one of Orbit. */
	UniverseTerra: [
		{ID: 'sol', Kind: 'star', Values: {Name: 'Sol'}, Traits: {Star: {Mass: 1}}, Children: [
			{ID: 'terra', Kind: 'planet', Values: {Name: 'Terra'}, Traits: {Surface: {Type: 'terran', Planet: {Data: '/data/planets/terra.planet', Levels: 2, Markers: [{ID: 'peaks', Name: 'High Peaks', Latitude: 45.756, Longitude: 5.376}, {ID: 'river', Name: 'Great River', Latitude: -31.5946, Longitude: 160.7077}, {ID: 'hills', Name: 'Green Hills', Latitude: 48.6706, Longitude: -88.7}, {ID: 'base', Name: 'Sea Base', Latitude: 18, Longitude: 32}]}}, Body: {Radius: 6371, Mass: 1, Day: 23.93, Tilt: 23.4}, Orbit: {Distance: 1}}, Children: [
				{ID: 'luna', Kind: 'moon', Values: {Name: 'Luna'}, Traits: {Surface: {Type: 'moon'}, Body: {Radius: 1737, Day: 0}, Orbit: {Distance: '384400 km'}}},
				{ID: 'rocks', Kind: 'belt', Values: {Name: 'Rocks'}, Traits: {Belt: {Inner: 1.3, Outer: 1.75, Count: 700, Inclination: 6, Rocks: 0.14}}},
				{ID: 'halcyon', Kind: 'craft', Values: {Name: 'Halcyon', Model: 'station-a', Length: 450}, Traits: {Model: {Size: 0.32}, Orbit: {Distance: 1.75, Period: 90, Inclination: 4, Anomaly: 196}}}
			]},
			/* A giant of gas to go into: through its decks of clouds, the dark under them, the glow of its depth, down to its core. */
			{ID: 'jove', Kind: 'planet', Values: {Name: 'Jove'}, Traits: {Surface: {Type: 'gas'}, Body: {Radius: 69911, Mass: 317.8, Day: 9.93, Tilt: 3.1}, Orbit: {Distance: 5.2, Anomaly: 40}}},
			/* The same model of air for all (Envelope): an ice giant and its moon of haze (as Titan), a world of thick air (as Venus), one of none (as Mercury). */
			{ID: 'nerid', Kind: 'planet', Values: {Name: 'Nerid'}, Traits: {Surface: {Type: 'ice-giant'}, Body: {Radius: 24622, Mass: 17.15, Day: 16.1, Tilt: 28}, Orbit: {Distance: 19, Anomaly: 120}}, Children: [
				{ID: 'tidra', Kind: 'moon', Values: {Name: 'Tidra'}, Traits: {Surface: {Type: 'ice', Envelope: 'titan', Atmosphere: '#d9a050', Clouds: 1, Colors: '#b07a38,#9a6a30,#c89850,#d8b070'}, Body: {Radius: 2575, Mass: 0.0225, Day: 382}, Orbit: {Distance: '1221870 km'}}}
			]},
			{ID: 'vesper', Kind: 'planet', Values: {Name: 'Vesper'}, Traits: {Surface: {Type: 'desert', Envelope: 'venus', Atmosphere: '#e8d8a8', Clouds: 1, Colors: '#c89858,#b08048,#d8b078,#e8d0a0'}, Body: {Radius: 6052, Mass: 0.815, Day: -5832}, Orbit: {Distance: 0.72, Anomaly: 250}}},
			{ID: 'ferro', Kind: 'planet', Values: {Name: 'Ferro'}, Traits: {Surface: {Type: 'rocky', Atmosphere: 'none'}, Body: {Radius: 2440, Mass: 0.055, Day: 1408}, Orbit: {Distance: 0.39, Anomaly: 300}}}
		]}
	],

	UniverseReady: function (scene) {
		var self = this;
		var models = this.$Service('SceneModels');

		this.UniverseScene = function () {
			return scene;
		};

		if (!models.Has('station-a'))
			models.Define('station-a', {URL: '/data/models/space_station_3.glb', Type: 'prop'});

		if (!models.Has('ship-universe'))
			models.Define('ship-universe', {URL: '/data/models/' + this.UniverseShip.Model, Type: 'prop'});

		models.Load('station-a');
		models.Load('ship-universe');

		/* What is round the ship, where it goes, what it aims at (the Ether). */
		this.$Ether.On('environment', 'me', this.UniverseAround.bind(this));
		this.$Ether.On('travel', 'me', this.UniverseGoing.bind(this));
		this.$Ether.On('aim', '', this.UniverseAimed.bind(this));

		this.UniverseWait(function () {
			return scene.GalaxyData();
		}, function () {
			self.UniverseHomeMade(scene);
		});
	},

	/* Calls then() once ready() is true, looked at four times a second while the demo is on the page. */
	UniverseWait: function (ready, then) {
		var self = this;
		var clock = window.setInterval(function () {
			if (!self.$Element().isConnected) {
				window.clearInterval(clock);

				return;
			}

			if (!ready()) return;

			window.clearInterval(clock);

			then();
		}, 250);
	},

	/*
	 * The home of the demo: the star nearest where a system lies by default (GalaxyData.Cosmos: 54% of the radius out),
	 * its system the one of Terra (SetSystem), gone into at once.
	 */
	UniverseHomeMade: function (scene) {
		var galaxies = this.$Service('GalaxyData');
		var data = scene.GalaxyData();
		var place = galaxies.Cosmos(data, '').Place;
		/* The nearest star of the main sequence (a sun as ours), the nearest first of a search round the place. */
		var best = (galaxies.Search(data, {Centre: place, Radius: 60, Type: 'main', Limit: 1}).Items || [])[0] || null;

		if (!best) {
			this.UniverseNote = 'No star near the home of the demo.';

			return;
		}

		this.UniverseHome = best.ID;

		galaxies.SetSystem(data, best.ID, this.$Service('SystemData').Make({Objects: this.UniverseTerra}, {ID: best.ID, Name: 'Sol'}));

		scene.EnterSystem(best.ID);
	},

	/* In a system: a ship of its own round its first planet (Terra at home), driven. */
	UniverseIn: function (event) {
		var self = this;
		var scene = this.UniverseScene();

		this.UniverseEntered = event.ID;
		this.UniverseNote = (event.ID === this.UniverseHome ? 'Home: the system of Terra. ' : 'The system of ' + (event.Star && event.Star.Name || event.ID) + '. ') + 'T aims (a star near too: H then jumps there), G turns to it, H warps, J jumps, [ and ] the step of warp; Galaxy map for another star.';

		this.UniverseWait(function () {
			return scene.Scene().Order.some(function (object) {
				return object.World && object.Kind === 'planet' || object.Kind === 'star' && object.World;
			});
		}, function () {
			self.UniverseShipMade(scene);
		});
	},

	UniverseShipMade: function (scene) {
		var ship = this.UniverseShip;
		var arriving = this.UniverseArriving;
		var planets = scene.Scene().Order.filter(function (object) {
			return object.Kind === 'planet' && object.World;
		});
		/* Round a planet of a ground of its own first (a globe to come down on), else the first; out of a jump between stars, its star. */
		var grounded = planets.filter(function (object) {
			return object.Traits.Surface && object.Traits.Surface.Planet;
		});
		var star = scene.Scene().Order.filter(function (object) {
			return object.Kind === 'star';
		})[0];
		var around = arriving && star ? star.ID : scene.Scene().Objects.terra ? 'terra' : grounded.length ? grounded[0].ID : planets.length ? planets[0].ID : star.ID;

		this.UniverseArriving = false;
		this.UniverseTravel = '';
		this.UniverseAim = '';

		if (scene.Get('me'))
			scene.Remove('me');

		scene.Add('ship', {ID: 'me', Name: '', Model: 'ship-universe', Size: 0.012, Parent: around, Vehicle: {Kind: 'ship', Yaw: 0, Mounts: ship.Mounts, Top: 0.09, Speed: 3000, Length: ship.Length, Around: around, From: arriving ? [0, 6, -150] : [-2.6, 0.3, 1.5], Facing: arriving ? [0, -0.04, 1] : [1, -0.08, -0.5], Follow: [4.6, 1.1], Warp: {Step: Number(this.UniverseStep), Well: 0.25}}});
		scene.Control('me');
		scene.Probe('me');
	},

	/* Out of a jump between stars: the ship of the system it came to at its edge, its star ahead (UniverseShipMade). */
	UniverseTravelled: function (event) {
		/* A warp goes at the step chosen. */
		if (event && event.Kind === 'warp' && event.Phase === 'enter')
			this.UniverseScene().TravelStep('me', Number(this.UniverseStep));

		if (event && event.Kind === 'hyper' && event.Phase === 'exit' && event.Reason === 'arrived')
			this.UniverseArriving = true;
	},

	UniverseOut: function () {
		this.UniverseEntered = '';
		this.UniverseNote = 'The galaxy: press a star to pick it, then Enter the system.';
	},

	UniversePick: function (event) {
		this.UniversePicked = event && event.ID || '';
	},

	UniverseMap: function () {
		this.UniverseScene().LeaveSystem();
	},

	UniverseEnter: function () {
		if (this.UniversePicked)
			this.UniverseScene().EnterSystem(this.UniversePicked);
	},

	UniverseGoHome: function () {
		/* From a system at once (the view of the map is not drawn there to fly). */
		if (this.UniverseHome)
			this.UniverseScene().EnterSystem(this.UniverseHome, null, {Now: !!this.UniverseEntered});
	},

	/* The view from the seat of the ship (Person first): drops on its glass in the clouds of a giant. */
	UniverseCockpitToggled: function (value) {
		this.UniverseCockpit = value && value.detail !== undefined ? !!value.detail : !!value;
		this.UniverseScene().Person = this.UniverseCockpit ? 'first' : 'third';
	},

	/* A body of the system of Terra: aimed at and turned to, its step of warp set; H warps there. */
	UniverseGoTo: function (value) {
		var goal = this.UniverseGoals.filter(function (one) {
			return one.Value === value;
		})[0];

		this.UniverseGoal = value;

		if (!goal || !goal.Value) return;

		this.UniverseScene().Aim(goal.Value);
		this.UniverseScene().AimAlign(true);

		this.UniverseStep = goal.Step;
		this.UniverseNote = goal.Label + ' aimed at: H warps there (step ' + goal.Step + '); then ' + goal.Note + '. The readout tells the air round the ship; Cockpit shows the glass.';
	},

	UniverseStepChosen: function (value) {
		this.UniverseStep = value;

		this.UniverseScene().TravelStep('me', Number(value));
	},

	UniverseAround: function (data) {
		var record = data && data.me;

		this.UniverseAir = record && record.Altitude !== null && record.Altitude !== undefined ? Math.round(record.Altitude).toLocaleString() + ' km · ' + (record.Zone || record.Phase) + (record.Pressure > 0 ? ' · ' + (record.Pressure >= 0.01 ? record.Pressure.toFixed(2) : record.Pressure.toExponential(1)) + ' bar' : '') : '';
	},

	UniverseGoing: function (data) {
		var record = data && data.me;

		this.UniverseTravel = record && record.Phase !== 'done' ? record.Kind + ' ' + record.Phase + (record.Light !== null && record.Light !== undefined ? ' · ' + record.Light.toFixed(1) + ' ly left' : record.Speed ? ' · ' + Math.round(record.Speed).toLocaleString() + ' km/s' : '') + (record.Passing && record.Passing.length ? ' · ' + record.Passing[0].Name + ' ' + record.Passing[0].Seconds.toFixed(1) + ' s' : '') : record && record.Reason && record.Reason !== 'arrived' ? record.Kind + ' out: ' + record.Reason : '';
	},

	UniverseAimed: function (data) {
		this.UniverseAim = data && data.Target ? 'aim: ' + data.Name + ' ' + Math.round(data.Angle) + '°' + (data.Ready ? ' ready' : data.Why ? ' (' + data.Why + ')' : '') : '';
	}
});
