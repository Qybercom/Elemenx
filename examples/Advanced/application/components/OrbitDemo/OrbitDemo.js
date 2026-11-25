/*
 * OrbitDemo (Gaming): a ship of its own flown round a planet, its moon, its rocks and its stations: through space, a warp
 * or a jump to a place, down into the air of the planet and onto its ground, and up to its orbit again. Keys: W and S set
 * the speed, A and D yaw, R and F pitch, Q and E roll, C and X lift, Shift boosts, Space stops it, H warps, J jumps, the
 * mouse looks round; on a touch screen its gamepad (VirtualGamepad): the sticks fly and look, X warps, Y jumps.
 */
Elemenx.Component('OrbitDemo', {
	$TemplateURL: 'OrbitDemo.html',
	$Traits: ['SceneDemo'],
	/* The ships to fly (data/vehicles/ships.json: what each is built of, in its own measures, and its systems), read once. */
	OrbitShips: [],
	OrbitShip: 'space_ship (1).glb',
	OrbitPlaces: [
		{Value: 'luna', Label: 'Luna'},
		{Value: 'terra', Label: 'Terra'},
		{Value: 'battleship', Label: 'Battleship'},
		{Value: '', Label: 'Straight ahead'}
	],
	OrbitPlace: 'luna',
	OrbitCosmos: {Kind: 'galaxy', Seed: 'orbit'},
	OrbitPhase: '',
	/* The step of warp (1 to 6: each ten times the last), what the ship goes by in warp (the Ether: travel), a blocker of warp on Luna. */
	OrbitSteps: [{Value: '1', Label: 'Step 1'}, {Value: '2', Label: 'Step 2'}, {Value: '3', Label: 'Step 3'}, {Value: '4', Label: 'Step 4'}, {Value: '5', Label: 'Step 5'}, {Value: '6', Label: 'Step 6'}],
	OrbitStep: '3',
	OrbitPassing: '',
	OrbitBlocked: false,
	/* What the ship aims at (T takes it, G turns to it; the Ether aim). */
	OrbitAiming: '',
	OrbitAimed: function (data) {
		this.OrbitAiming = data && data.Target ? 'aim: ' + data.Name + ' ' + Math.round(data.Angle) + '°' + (data.Ready ? ' ready' : data.Why ? ' (' + data.Why + ')' : '') + (data.Align ? ' · aligning' : '') : '';
	},
	OrbitStepChosen: function (value) {
		var scene = this.OrbitScene ? this.OrbitScene() : null;

		this.OrbitStep = value;

		if (scene)
			scene.TravelStep('me', Number(value));
	},
	OrbitBlocker: function () {
		var scene = this.OrbitScene ? this.OrbitScene() : null;

		this.OrbitBlocked = !this.OrbitBlocked;

		if (scene)
			scene.Change('luna', {Traits: {WarpBlocker: {Radius: 60, Active: this.OrbitBlocked}}});
	},
	/* What the ship goes by in warp, the nearest in time first: a name, how near it passes and in how many seconds. */
	OrbitPassed: function (data) {
		var record = data && data.me;

		this.OrbitPassing = record && record.Kind === 'warp' && record.Phase === 'inside' ? (record.Passing || []).slice(0, 3).map(function (one) {
			return one.Name + ' ' + (one.Seconds < 100 ? one.Seconds.toFixed(1) : Math.round(one.Seconds)) + ' s, ' + Math.round(one.Pass).toLocaleString() + ' km';
		}).join(' · ') : '';
	},
	/* The shader graph open (DemoGraph: '' none), those its scene is drawn with (Graphs of Scene), given to the scene as one changes (it makes its shaders again itself, its view kept). */
	OrbitGraphOpen: '',
	OrbitGraphs: null,
	OrbitGraphOpened: function (name) {
		this.OrbitGraphOpen = this.OrbitGraphOpen === name ? '' : name;
	},
	OrbitGraphChanged: function (event) {
		var given = event && event.detail ? event.detail : event;
		var graphs = Object.assign({}, this.OrbitGraphs || {});

		if (given.Graph) graphs[given.Name] = given.Graph;
		else delete graphs[given.Name];

		this.OrbitGraphs = Object.keys(graphs).length ? graphs : null;
	},
	OrbitReady: function (scene) {
		var self = this;
		var models = this.$Service('SceneModels');

		this.OrbitScene = function () {
			return scene;
		};

		/* The system of Terra and the ships of the demos of space (DemoData), then the ship chosen round Terra. */
		this.$Service('DemoData').Get('/data/systems/terra.json', function (error, system) {
			if (error || !scene.$Element().isConnected) return;

			self.$Service('DemoData').Models(system, models);

			scene.Add(self.$Service('DemoData').Flat(system.Objects));

			self.$Service('DemoData').Get('/data/vehicles/ships.json', function (failed, ships) {
				if (failed || !scene.$Element().isConnected) return;

				self.OrbitShips = ships;

				self.OrbitShipChosen(self.OrbitShip);
			});
		});

		this.$Ether.On('travel', 'me', this.OrbitPassed.bind(this));
		this.$Ether.On('aim', '', this.OrbitAimed.bind(this));
	},
	/* Another ship for the same pilot. */
	OrbitShipChosen: function (value) {
		var scene = this.OrbitScene ? this.OrbitScene() : null;
		var models = this.$Service('SceneModels');
		var name = 'ship-' + value;
		var ship = this.OrbitShips.filter(function (each) {
			return each.Value === value;
		})[0];

		this.OrbitShip = value;

		if (!scene || !ship) return;

		if (!models.Has(name))
			models.Define(name, {URL: '/data/models/' + value, Type: 'prop'});

		models.Load(name);

		if (scene.Get('me'))
			scene.Remove('me');

		/* Its systems (reactors, a shield of layers, sensors) of its data: DemoData.Ship. */
		scene.Add('ship', this.$Service('DemoData').Ship(ship, {ID: 'me', Name: '', Model: name, Size: ship.Size || 0.012, Parent: 'terra', Vehicle: {Top: 0.09, Speed: 3000, Around: 'terra', From: [-2.6, 0.3, 1.5], Facing: [1, -0.08, -0.5], Follow: [4.6, 1.1], Warp: {To: 'luna', Well: 0.25}}}));

		/* Its pilot: a character of its own in its seat, out of it once the ship is down (G), walking in its inside and on the ground. */
		if (scene.Get('pilot'))
			scene.Remove('pilot');

		scene.Add('unit', {ID: 'pilot', Name: 'Pilot', Model: 'soldier', Size: 1.8, X: 0, Y: 0});
		scene.Control('pilot');
		scene.Board('pilot', 'me');
	},
	/* Where H warps to, as the buttons do. */
	OrbitPlaced: function (value) {
		var scene = this.OrbitScene ? this.OrbitScene() : null;
		var hero = scene ? scene.Scene().Objects.me : null;

		this.OrbitPlace = value;

		if (hero)
			hero.Values.Vehicle.Warp = {To: value};
	},
	/* A way far at once to the place chosen: warp through its tunnel, or a jump on the afterburner. */
	OrbitTravel: function (kind) {
		var self = this;
		var scene = this.OrbitScene ? this.OrbitScene() : null;
		var hero = scene ? scene.Scene().Objects.me : null;

		/* Why it does not go, said where the phases are. */
		if (!scene || !scene.$Element().isConnected) {
			this.OrbitPhase = kind + ': no scene';

			return;
		}

		/* In warp already, H again comes out of it where it is. */
		if (kind === 'warp' && hero && hero.Travel && hero.Travel.Kind === 'warp') {
			scene.TravelStop('me');

			return;
		}

		scene.Travel('me', kind, kind === 'warp' ? {To: this.OrbitPlace, Step: Number(this.OrbitStep)} : {Length: 30}, function (error) {
			if (error)
				self.OrbitPhase = kind + ': ' + (!hero ? 'no ship' : hero.Travel ? 'already ' + hero.Travel.Kind + ' ' + hero.Travel.Phase : error.message.replace(/^Elemenx Scene: me /, ''));
		});
	},
	OrbitTravelled: function (event) {
		this.OrbitPhase = event.Phase === 'done' ? (event.Reason && event.Reason !== 'arrived' ? event.Kind + ' out: ' + event.Reason + (event.By ? ' (' + event.By + ')' : '') : '') : event.Kind + ': ' + event.Phase + (event.Reason ? ' (' + event.Reason + ')' : '');
	},
	/* The phases of a landing and of a take-off, where those of a warp are. */
	OrbitLanding: function (event) {
		this.OrbitPhase = event.Phase === 'orbit' || event.Phase === 'landed' ? '' : event.Phase;
	}
});
