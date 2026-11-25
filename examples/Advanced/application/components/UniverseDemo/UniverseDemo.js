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
	/* The graph open (DemoGraph: '' none), those its scene is drawn with (Graphs of Scene), given to the scene as one changes (it makes its shaders again itself, its view kept). */
	UniverseGraphOpen: '',
	UniverseGraphs: null,

	UniverseGraphOpened: function (name) {
		this.UniverseGraphOpen = this.UniverseGraphOpen === name ? '' : name;
	},

	UniverseGraphChanged: function (event) {
		var given = event && event.detail ? event.detail : event;
		var graphs = Object.assign({}, this.UniverseGraphs || {});

		if (given.Graph) graphs[given.Name] = given.Graph;
		else delete graphs[given.Name];

		this.UniverseGraphs = Object.keys(graphs).length ? graphs : null;
	},
	UniverseTravel: '',
	UniverseAim: '',
	UniverseArriving: false,

	/* The ship of the demo (the first of data/vehicles/ships.json) and the system of Terra (data/systems/terra.json), read once. */
	UniverseShip: null,
	UniverseTerra: null,

	UniverseReady: function (scene) {
		var self = this;
		var models = this.$Service('SceneModels');

		this.UniverseScene = function () {
			return scene;
		};

		/* The ship and the system of Terra of the demos of space (DemoData), then the galaxy. */
		this.$Service('DemoData').Get('/data/vehicles/ships.json', function (error, ships) {
			if (error || !scene.$Element().isConnected) return;

			self.UniverseShip = ships[0];

			if (!models.Has('ship-universe'))
				models.Define('ship-universe', {URL: '/data/models/' + ships[0].Value, Type: 'prop'});

			models.Load('ship-universe');

			self.$Service('DemoData').Get('/data/systems/terra.json', function (failed, system) {
				if (failed || !scene.$Element().isConnected) return;

				self.$Service('DemoData').Models(system, models);

				self.UniverseTerra = system.Objects;

				self.UniverseWait(function () {
					return scene.GalaxyData();
				}, function () {
					self.UniverseHomeMade(scene);
				});
			});
		});

		/* What is round the ship, where it goes, what it aims at (the Ether). */
		this.$Ether.On('travel', 'me', this.UniverseGoing.bind(this));
		this.$Ether.On('aim', '', this.UniverseAimed.bind(this));
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

		scene.Add('ship', this.$Service('DemoData').Ship(ship, {ID: 'me', Name: '', Model: 'ship-universe', Size: 0.012, Parent: around, Vehicle: {Top: 0.09, Speed: 3000, Around: around, From: arriving ? [0, 6, -150] : [-2.6, 0.3, 1.5], Facing: arriving ? [0, -0.04, 1] : [1, -0.08, -0.5], Follow: [4.6, 1.1], Warp: {Step: Number(this.UniverseStep), Well: 0.25}}}));
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


	UniverseGoing: function (data) {
		var record = data && data.me;

		this.UniverseTravel = record && record.Phase !== 'done' ? record.Kind + ' ' + record.Phase + (record.Light !== null && record.Light !== undefined ? ' · ' + record.Light.toFixed(1) + ' ly left' : record.Speed ? ' · ' + Math.round(record.Speed).toLocaleString() + ' km/s' : '') + (record.Passing && record.Passing.length ? ' · ' + record.Passing[0].Name + ' ' + record.Passing[0].Seconds.toFixed(1) + ' s' : '') : record && record.Reason && record.Reason !== 'arrived' ? record.Kind + ' out: ' + record.Reason : '';
	},

	UniverseAimed: function (data) {
		this.UniverseAim = data && data.Target ? 'aim: ' + data.Name + ' ' + Math.round(data.Angle) + '°' + (data.Ready ? ' ready' : data.Why ? ' (' + data.Why + ')' : '') : '';
	}
});
