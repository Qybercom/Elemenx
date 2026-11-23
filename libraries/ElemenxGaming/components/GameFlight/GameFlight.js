/*
 * The instruments of a ship over a Scene, declared inside it (the trait SceneBehaviour): what Readout of the scene reads of
 * For (an ID; empty: the hero) each Every seconds (0.15): its speed, its height and the air round it (Probe of the scene),
 * its travel (warp, jump: its phase, its step), its throttle; of its systems (SceneShipSystems) its reactors (their heat,
 * what they give, shut down by their heat), what each system is given of the power, the layers of its shield, a blocker of
 * warp its sensors see, and the places it knows of, the nearest first (Nav of them shown). Engineer adds the hands of an
 * engineer (or of a pilot alone): the shares of the power, each reactor on or off, venting their heat. Size small, medium or
 * large; Label names it for screen readers; its default slot holds buttons of its own. Regression: the demos of space each
 * wrote their own lines of the flight.
 */
Elemenx.Component('GameFlight', {
	$TemplateURL: 'GameFlight.html',
	$StyleURL: 'GameFlight.css',
	$Traits: ['SceneBehaviour'],
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The instruments of a ship over a Scene: speed, height and air, travel, throttle, reactors, power, layers of its shield, a blocker of warp, the places it knows.',
		Container: true,
		Props: {
			For: 'The ID of the ship it reads; empty: the hero.',
			Every: 'How often it reads, in seconds.',
			Nav: 'How many places it knows it shows, the nearest first.',
			Engineer: 'Adds the hands of an engineer: the shares of the power, the reactors on and off, venting their heat.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'Its name for screen readers.'
		},
		Sample: {Engineer: true}
	},
	For: '',
	Every: 0.15,
	Nav: 5,
	Engineer: false,
	Size: 'medium',
	Label: '',
	Shown: false,
	Speed: '',
	Height: '',
	Travel: '',
	Throttle: 0,
	Reactors: [],
	Power: null,
	Shares: null,
	Layers: [],
	Jam: '',
	Places: [],

	$OnCreate: function () {
		this.FlightClock = 0;
	},

	SceneStep: function (elapsed) {
		var scene = this.ParentScene();
		var id;

		this.FlightClock += elapsed;

		if (this.FlightClock < Number(this.Every || 0) || !scene || typeof scene.Readout !== 'function') return;

		this.FlightClock = 0;
		id = this.For || scene.Scene().Hero;

		/* The air round it, written each frame once it is asked for. */
		if (id && typeof scene.Probe === 'function' && !scene.Environment(id))
			scene.Probe(id);

		this.Show(id ? scene.Readout(id) : null);
	},

	/* What a readout says, as it shows (Readout of a Scene: of a ship, its Systems, its Environment). */
	Show: function (read) {
		var self = this;
		var systems = read && read.Systems;
		var air = read && read.Environment;
		var metres = read ? (read.Speed || 0) / 3.6 : 0;

		this.Shown = !!read && read.Kind === 'ship';

		if (!this.Shown) return;

		this.Speed = metres >= 1000 ? (metres / 1000).toFixed(metres >= 100000 ? 0 : 2) + ' km/s' : Math.round(metres) + ' m/s';
		this.Height = air && air.Altitude !== null && air.Altitude !== undefined ? Math.round(air.Altitude).toLocaleString() + ' km · ' + (air.Zone || air.Phase || '') + (air.Pressure > 0 ? ' · ' + (air.Pressure >= 0.01 ? air.Pressure.toFixed(2) : air.Pressure.toExponential(1)) + ' bar' : '') : '';
		this.Travel = read.Travel ? read.Travel.Kind + ' · ' + read.Travel.Phase + (read.Travel.Step ? ' · ' + read.Travel.Step : '') : '';
		this.Throttle = Math.round(Math.abs(read.Throttle || 0) * 100);
		this.Reactors = systems ? systems.Reactors.map(function (one) {
			return {ID: one.ID, Heat: Math.round(Math.min(1, one.Heat) * 100), Supply: Math.round(one.Supply), On: one.On, Tripped: one.Tripped};
		}) : [];
		this.Power = systems && systems.Shares ? {Engines: Math.round(systems.Power.Engines * 100), Shields: Math.round(systems.Power.Shields * 100), Weapons: Math.round(systems.Power.Weapons * 100)} : null;
		this.Shares = systems && systems.Shares ? Object.assign({}, systems.Shares) : null;
		this.Layers = systems ? systems.Shields.map(function (one) {
			return {ID: one.ID, Part: Math.round(one.Part * 100)};
		}) : [];
		this.Jam = systems && systems.Jam ? systems.Jam.Inside ? Elemenx.Locale.Text('gaming.flight.jammedIn', {id: systems.Jam.ID}) : Elemenx.Locale.Text('gaming.flight.jammed', {id: systems.Jam.ID, km: self.Far(systems.Jam.Distance)}) : '';
		this.Places = systems ? systems.Nav.slice(0, Math.max(0, Number(this.Nav) || 0)).map(function (one) {
			return {ID: one.ID, Name: one.Name, Kind: one.Kind, Far: self.Far(one.Distance) + ' km', Bearing: Math.round(one.Bearing)};
		}) : [];
	},

	/* Kilometres as they show: a tenth under ten, whole past. */
	Far: function (km) {
		return km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString();
	},

	/* The ship it reads. */
	Ship: function () {
		var scene = this.ParentScene();

		return this.For || (scene ? scene.Scene().Hero : '');
	},

	/* The hands of an engineer: the share of the power of a system, a reactor on or off, the heat of the reactors vented. */
	Shared: function (system, value) {
		var scene = this.ParentScene();
		var shares = {};

		shares[system] = Number(value);

		if (scene && scene.SetPower)
			scene.SetPower(this.Ship(), shares);
	},

	Turned: function (reactor, on) {
		var scene = this.ParentScene();
		if (scene && scene.SetReactor)
			scene.SetReactor(this.Ship(), reactor, !!on);
	},

	Vented: function () {
		var scene = this.ParentScene();
		if (scene && scene.Vent)
			scene.Vent(this.Ship());
	}
});
