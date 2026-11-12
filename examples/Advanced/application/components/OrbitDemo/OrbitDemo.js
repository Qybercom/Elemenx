/*
 * OrbitDemo (Gaming): a ship of its own flown round a planet, its moon, its rocks and its stations: through space, a warp
 * or a jump to a place, down into the air of the planet and onto its ground, and up to its orbit again. Keys: W and S set
 * the speed, A and D yaw, R and F pitch, Q and E roll, C and X lift, Shift boosts, Space stops it, H warps, J jumps, the
 * mouse looks round; on a touch screen its gamepad (VirtualGamepad): the sticks fly and look, X warps, Y jumps.
 */
Elemenx.Component('OrbitDemo', {
	$TemplateURL: 'OrbitDemo.html',
	$Traits: ['SceneDemo'],
	/* What each ship is built of, in its own measures: the points are read off the model. */
	OrbitShips: [
		{Value: 'space_ship (1).glb', Label: 'Interceptor', Length: 22, Yaw: 0, Mounts: [
			{Kind: 'engine', At: [0.25, 0.485, -1.835], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1},
			{Kind: 'engine', At: [-0.25, 0.485, -1.835], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1},
			{Kind: 'engine', At: [0.25, 0.355, -1.75], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1},
			{Kind: 'engine', At: [-0.25, 0.355, -1.75], Aim: [0, 0, -1], Mouth: [0.06, 0.08], Size: 0.1}
		]},
		{Value: 'space_ship.glb', Label: 'Scout', Length: 35, Yaw: 0, Mounts: [
			{Kind: 'engine', At: [0, 0.84, -1.41], Aim: [0, 0, -1], Mouth: [0.13, 0.085], Size: 0.16}
		]},
		{Value: 'unsa_cruiser__spaceship.glb', Label: 'Cruiser', Length: 280, Yaw: 0, Mounts: [
			{Kind: 'engine', At: [0.317, 0.385, -2.66], Aim: [0, 0, -1], Mouth: [0.055, 0.075], Size: 0.12},
			{Kind: 'engine', At: [-0.317, 0.385, -2.66], Aim: [0, 0, -1], Mouth: [0.055, 0.075], Size: 0.12},
			{Kind: 'engine', At: [0.404, 0.385, -2.66], Aim: [0, 0, -1], Mouth: [0.055, 0.075], Size: 0.12},
			{Kind: 'engine', At: [-0.404, 0.385, -2.66], Aim: [0, 0, -1], Mouth: [0.055, 0.075], Size: 0.12},
			{Kind: 'engine', At: [0.49, 0.385, -2.66], Aim: [0, 0, -1], Mouth: [0.055, 0.075], Size: 0.12},
			{Kind: 'engine', At: [-0.49, 0.385, -2.66], Aim: [0, 0, -1], Mouth: [0.055, 0.075], Size: 0.12}
		]},
		{Value: 'space_battleship_aquamarine.glb', Label: 'Battleship', Length: 640, Yaw: 0, Mounts: [
			{Kind: 'engine', At: [0.3125, 0.522, -1.612], Aim: [0, 0, -1], Mouth: 0.05, Size: 0.22},
			{Kind: 'engine', At: [-0.3125, 0.522, -1.612], Aim: [0, 0, -1], Mouth: 0.05, Size: 0.22},
			{Kind: 'engine', At: [0.474, 0.517, -1.578], Aim: [0, 0, -1], Mouth: 0.039, Size: 0.18},
			{Kind: 'engine', At: [-0.474, 0.517, -1.578], Aim: [0, 0, -1], Mouth: 0.039, Size: 0.18},
			{Kind: 'engine', At: [0.6, 0.512, -1.557], Aim: [0, 0, -1], Mouth: 0.03, Size: 0.14},
			{Kind: 'engine', At: [-0.6, 0.512, -1.557], Aim: [0, 0, -1], Mouth: 0.03, Size: 0.14},
			{Kind: 'engine', At: [0.7075, 0.5, -1.512], Aim: [0, 0, -1], Mouth: 0.024, Size: 0.1},
			{Kind: 'engine', At: [-0.7075, 0.5, -1.512], Aim: [0, 0, -1], Mouth: 0.024, Size: 0.1}
		]},
		{Value: 'millenium_falcon_star_wars.glb', Label: 'Millennium Falcon', Length: 35, Yaw: 0, Mounts: [
			{Kind: 'engine', At: [0, 0.46, -2.06], Aim: [0, 0, -1], Mouth: [0.13, 0.05], Size: 0.2, Length: 0.45, Glare: 0.5},
			{Kind: 'engine', At: [0.253, 0.46, -2.034], Aim: [0.184, 0, -0.983], Mouth: [0.13, 0.05], Size: 0.2, Length: 0.45, Glare: 0.5, Light: false},
			{Kind: 'engine', At: [-0.253, 0.46, -2.034], Aim: [-0.184, 0, -0.983], Mouth: [0.13, 0.05], Size: 0.2, Length: 0.45, Glare: 0.5, Light: false},
			{Kind: 'engine', At: [0.505, 0.46, -1.962], Aim: [0.367, 0, -0.93], Mouth: [0.13, 0.05], Size: 0.2, Length: 0.45, Glare: 0.5, Light: false},
			{Kind: 'engine', At: [-0.505, 0.46, -1.962], Aim: [-0.367, 0, -0.93], Mouth: [0.13, 0.05], Size: 0.2, Length: 0.45, Glare: 0.5, Light: false},
			{Kind: 'engine', At: [0.758, 0.46, -1.851], Aim: [0.544, 0, -0.839], Mouth: [0.14, 0.05], Size: 0.2, Length: 0.45, Glare: 0.5},
			{Kind: 'engine', At: [-0.758, 0.46, -1.851], Aim: [-0.544, 0, -0.839], Mouth: [0.14, 0.05], Size: 0.2, Length: 0.45, Glare: 0.5},
			{Kind: 'engine', At: [1.01, 0.46, -1.664], Aim: [0.716, 0, -0.698], Mouth: [0.15, 0.05], Size: 0.2, Length: 0.4, Glare: 0.5, Light: false},
			{Kind: 'engine', At: [-1.01, 0.46, -1.664], Aim: [-0.716, 0, -0.698], Mouth: [0.15, 0.05], Size: 0.2, Length: 0.4, Glare: 0.5, Light: false}
		]},
		{Value: 'tempest.glb', Label: 'Tempest', Length: 60, Yaw: -90, Size: 0.007, Mounts: [
			{Kind: 'engine', At: [-3.25, 0.504, 0.802], Aim: [-1, 0, 0], Mouth: [0.2, 0.085], Size: 0.3, Twist: 31, Length: 0.5},
			{Kind: 'engine', At: [-3.25, 0.504, -0.802], Aim: [-1, 0, 0], Mouth: [0.2, 0.085], Size: 0.3, Twist: -31, Length: 0.5},
			{Kind: 'engine', At: [-3.015, 0.12, 1.432], Aim: [-1, 0, 0], Mouth: [0.135, 0.06], Size: 0.22, Twist: 31, Length: 0.5},
			{Kind: 'engine', At: [-3.015, 0.12, -1.432], Aim: [-1, 0, 0], Mouth: [0.135, 0.06], Size: 0.22, Twist: -31, Length: 0.5}
		]},
		{Value: 'uss_enterprise_star_trek_wrath_of_khan.glb', Label: 'USS Enterprise', Length: 305, Yaw: 180, Mounts: [
			{Kind: 'engine', At: [0.045, 0.875, -0.823], Aim: [0, 0.35, 1], Mouth: [0.04, 0.03], Size: 0.14, Length: 0.7, Color: '#ff3a24', Hot: '#ffd2a8'},
			{Kind: 'engine', At: [-0.045, 0.875, -0.823], Aim: [0, 0.35, 1], Mouth: [0.04, 0.03], Size: 0.14, Length: 0.7, Color: '#ff3a24', Hot: '#ffd2a8'},
			{Kind: 'engine', At: [0.673, 0.86, 2.05], Aim: [0, 0, 1], Mouth: 0.045, Size: 0.14},
			{Kind: 'engine', At: [-0.673, 0.86, 2.05], Aim: [0, 0, 1], Mouth: 0.045, Size: 0.14}
		]},
		{Value: 'star_trek_dedication_class_starship.glb', Label: 'USS Dedication', Length: 800, Yaw: 180, Size: 0.008, Mounts: [
			{Kind: 'engine', At: [0.34, 0.54, -0.37], Aim: [0, 0, 1], Mouth: [0.115, 0.018], Size: 0.14, Length: 0.35, Color: '#ff3a24', Hot: '#ffd2a8'},
			{Kind: 'engine', At: [-0.34, 0.54, -0.37], Aim: [0, 0, 1], Mouth: [0.115, 0.018], Size: 0.14, Length: 0.35, Color: '#ff3a24', Hot: '#ffd2a8'},
			{Kind: 'engine', At: [1.27, 0.86, 3.385], Aim: [0, 0, 1], Mouth: 0.035, Size: 0.14},
			{Kind: 'engine', At: [-1.27, 0.86, 3.385], Aim: [0, 0, 1], Mouth: 0.035, Size: 0.14}
		]},
		{Value: 'venator_class_star_destroyer.glb', Label: 'Venator', Yaw: 0, Mounts: [
			{Kind: 'engine', At: [0.4224, 0.248, -1.63], Aim: [0, 0, -1], Mouth: 0.05, Size: 0.22},
			{Kind: 'engine', At: [-0.4224, 0.248, -1.63], Aim: [0, 0, -1], Mouth: 0.05, Size: 0.22},
			{Kind: 'engine', At: [0.224, 0.168, -1.884], Aim: [0, 0, -1], Mouth: 0.05, Size: 0.22},
			{Kind: 'engine', At: [-0.224, 0.168, -1.884], Aim: [0, 0, -1], Mouth: 0.05, Size: 0.22},
			{Kind: 'engine', At: [0.3536, 0.357, -1.447], Aim: [0, 0, -1], Mouth: 0.016, Size: 0.08},
			{Kind: 'engine', At: [-0.3536, 0.357, -1.447], Aim: [0, 0, -1], Mouth: 0.016, Size: 0.08},
			{Kind: 'engine', At: [0.187, 0.357, -1.635], Aim: [0, 0, -1], Mouth: 0.022, Size: 0.1},
			{Kind: 'engine', At: [-0.187, 0.357, -1.635], Aim: [0, 0, -1], Mouth: 0.022, Size: 0.1},
			{Kind: 'engine', At: [0.099, 0.211, -1.49], Aim: [0, 0, -1], Mouth: 0.022, Size: 0.1},
			{Kind: 'engine', At: [-0.099, 0.211, -1.49], Aim: [0, 0, -1], Mouth: 0.022, Size: 0.1}
		]}
	],
	OrbitShip: 'space_ship (1).glb',
	OrbitPlaces: [
		{Value: 'luna', Label: 'Luna'},
		{Value: 'terra', Label: 'Terra'},
		{Value: 'battleship', Label: 'Battleship'},
		{Value: '', Label: 'Straight ahead'}
	],
	OrbitPlace: 'luna',
	OrbitCosmos: {Kind: 'galaxy', Seed: 'orbit'},
	OrbitSpeed: 0,
	OrbitPhase: '',
	OrbitReady: function (scene) {
		var models = this.$Service('SceneModels');

		this.OrbitScene = function () {
			return scene;
		};

		[['ship-cruiser', 'unsa_cruiser__spaceship.glb'], ['ship-battleship', 'space_battleship_aquamarine.glb'], ['station-a', 'space_station_3.glb'], ['station-b', 'i.s.f_space_station.glb'], ['station-c', 'giant_round_spacestation_by_jungle_jim.glb'], ['station-d', '1300_followers_celebration_-_space_station.glb']].forEach(function (one) {
			if (!models.Has(one[0]))
				models.Define(one[0], {URL: '/data/models/' + one[1], Type: 'prop'});

			models.Load(one[0]);
		});

		this.OrbitShipChosen(this.OrbitShip);

		this.OrbitWatch(scene);
	},
	/* The speed of the ship, four times a second. */
	OrbitWatch: function (scene) {
		var self = this;

		window.clearInterval(this.OrbitClock);

		this.OrbitClock = window.setInterval(function () {
			var hero = scene.Scene().Objects.me;

			if (!self.$Element().isConnected) {
				window.clearInterval(self.OrbitClock);

				return;
			}

			/* In the air of a location, metres a second; on its way down or up, its real speed; in space, of its way. */
			if (hero && hero.Flying) self.OrbitSpeed = Math.round(Math.sqrt(hero.Flying.Way[0] * hero.Flying.Way[0] + hero.Flying.Way[1] * hero.Flying.Way[1] + hero.Flying.Way[2] * hero.Flying.Way[2]));
			else if (hero && hero.Landing && hero.Landing.Real) self.OrbitSpeed = Math.round(hero.Landing.Real * 1000);
			else self.OrbitSpeed = hero && hero.Ship ? Math.round(Math.sqrt(hero.Ship.Way[0] * hero.Ship.Way[0] + hero.Ship.Way[1] * hero.Ship.Way[1] + hero.Ship.Way[2] * hero.Ship.Way[2]) / (scene.Engine().Metre() || 0.001)) : 0;
		}, 250);
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

		if (!scene) return;

		if (!models.Has(name))
			models.Define(name, {URL: '/data/models/' + value, Type: 'prop'});

		models.Load(name);

		if (scene.Get('me'))
			scene.Remove('me');

		scene.Add('ship', {ID: 'me', Name: '', Model: name, Size: ship.Size || 0.012, Parent: 'terra', Vehicle: {Kind: 'ship', Yaw: ship.Yaw, Mounts: ship.Mounts, Top: 0.09, Speed: 3000, Length: ship.Length, Around: 'terra', From: [-2.6, 0.3, 1.5], Facing: [1, -0.08, -0.5], Follow: [4.6, 1.1], Warp: {To: 'luna'}}});
		scene.Control('me');
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

		scene.Travel('me', kind, kind === 'warp' ? {To: this.OrbitPlace} : {}, function (error) {
			if (error)
				self.OrbitPhase = kind + ': ' + (!hero ? 'no ship' : !hero.Ship ? 'the ship has not flown yet' : hero.Travel ? 'already ' + hero.Travel.Kind + ' ' + hero.Travel.Phase : 'cannot now');
		});
	},
	OrbitTravelled: function (event) {
		this.OrbitPhase = event.Phase === 'done' ? '' : event.Kind + ': ' + event.Phase;
	},
	/* The phases of a landing and of a take-off, where those of a warp are. */
	OrbitLanding: function (event) {
		this.OrbitPhase = event.Phase === 'orbit' || event.Phase === 'landed' ? '' : event.Phase;
	},

	/* The buttons of the gamepad on the screen that keys have and a pad has not: X warps, Y jumps (H and J). */
	OrbitPad: function (event) {
		if (!event.Down) return;

		if (event.Button === 'x') this.OrbitTravel('warp');
		else if (event.Button === 'y') this.OrbitTravel('jump');
	},

	$OnDestroy: function () {
		window.clearInterval(this.OrbitClock);
	}
});
