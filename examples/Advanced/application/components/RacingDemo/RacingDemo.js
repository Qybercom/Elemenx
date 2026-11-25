/*
 * RacingDemo (Gaming): a car on a track of a seed (SceneRoads, Vehicles, GameRace): a click takes the mouse, W drives, S
 * goes back, A and D steer, Space brakes, Shift drifts, C is the hand brake, L the lights, Z and X the indicators, V
 * changes the camera; on a touch screen its gamepad drives (the lean of the phone steers).
 */
Elemenx.Component('RacingDemo', {
	$TemplateURL: 'RacingDemo.html',
	$StyleURL: 'RacingDemo.css',
	$Traits: ['SceneDemo'],
	$OnCreate: function () {
		var self = this;

		/* The cars (data/vehicles/cars, SceneCars), read once. */
		this.$Service('DemoData').CarsRead(function (error, list) {
			if (!error)
				self.RaceCars = list;
		});
	},
	/* Seconds as a clock of a race: 1:05.2. */
	RaceClockOf: function (seconds) {
		return Math.floor(seconds / 60) + ':' + ('0' + (seconds % 60).toFixed(1)).slice(-4);
	},
	/* A lap of the GameRace of the scene: its number, its time and the best one. */
	RaceLapped: function (event) {
		this.RaceLapText = 'lap ' + event.Lap + ' ' + this.RaceClockOf(event.Time) + ' · best ' + this.RaceClockOf(event.Best);
	},
	/* The board over the scene: the lap under way of all of them, its time and the best lap. */
	RaceBoard: {Lap: '–', Time: '0:00.0', Best: '–'},
	RaceLaps: 3,
	RaceLapText: '',
	/* The graph of the library open (vehicles/drives, vehicles/wheel): each change of it on the car at once. */
	RaceGraphOpen: '',
	RaceGraphOpened: function (name) {
		this.RaceGraphOpen = this.RaceGraphOpen === name ? '' : name;
	},
	RaceGraphChanged: function (event) {
		var given = event && event.detail ? event.detail : event;
		var scene = this.RaceScene ? this.RaceScene() : null;
		if (!scene) return;

		scene[{'vehicles/wheel': 'WheelGraph', 'vehicles/body': 'BodyGraph'}[given.Name] || 'DrivesGraph'] = given.Graph || null;
	},
	RaceReady: function (scene) {
		this.RaceScene = function () {
			return scene;
		};

		/* The demo alone on its page: its track at once. */
		this.RaceBuild();
	},
	/* A track of a seed, a road of kind track over rolling land with woods round it, and a car on its line. */
	RaceBuild: function () {
		var scene = this.RaceScene ? this.RaceScene() : null;
		var seed = 'track-' + this.RaceSeed;

		if (!scene) return;

		var long = this.RaceKind === 'mountains';
		var track = this.$Service('SceneRoadGenerator').Track(seed, long ? {Length: 8000, Scenery: true} : {Length: 2400});

		this.RaceTrack = track;

		scene.Objects().forEach(function (object) {
			scene.Remove(object.ID);
		});

		scene.Add('sun', {ID: 'day', Time: this.RaceHour, Latitude: 45, DayOfYear: 172, Color: '#fff4e0'});
		scene.Add('ground', {ID: 'land', World: this.$Service('SceneWorld').Library(long ? {Size: track.Size, Height: 40, Water: 0, Scale: 520, Ridges: 0.3, Rock: 0.75, Snow: 0.95, Seed: seed, Sketch: track.Sketch} : {Size: 2400, Height: 22, Water: 0, Scale: 420, Ridges: 0.15, Rock: false, Snow: false, Seed: seed})});
		scene.Add('forest', {ID: 'woods', Density: 1.2, Cover: 0.4, Patch: 120});
		scene.Add('grass', {ID: 'meadow', Density: 0.6, Height: 0.5});
		scene.Add('road', track.Spec);

		this.RaceWaiting = true;

		this.RaceWatch(scene);
	},
	/* What the ribbon and the dash show of the car: its speed, gear, revolutions and lights, five times a second. */
	RaceWatch: function (scene) {
		var self = this;

		window.clearInterval(this.RaceClock);

		this.RaceClock = window.setInterval(function () {
			var read;

			if (!self.$Element().isConnected) {
				window.clearInterval(self.RaceClock);

				return;
			}

			/* The figures of the line over the scene, of what the instruments of the car read (Readout). */
			read = scene.Readout('car');

			self.RaceSpeed = read ? Math.round(read.Speed) : 0;
			self.RaceGear = read && read.Rpm ? (read.Gear < 0 ? 'R' : read.Gear === 0 ? 'N' : String(read.Gear)) + ' · ' + Math.round(read.Rpm / 100) * 100 + ' rpm' : '';

			self.RaceBoardRead();
		}, 200);
	},
	RaceGear: '',
	RaceSpeed: 0,
	/* The board of the race read from its standings (GameRace.Standings): the car under the keys. */
	RaceBoardRead: function () {
		var scene = this.RaceScene ? this.RaceScene() : null;
		var element = scene ? scene.$Element().querySelector('.elemenx-game-race') : null;
		var race = element ? Elemenx.Instance(element) : null;
		var mine = race ? race.Standings().filter(function (one) {
			return one.ID === 'car';
		})[0] : null;
		if (!mine) return;

		this.RaceBoard = {Lap: mine.Finished ? 'Finished' : Math.min(this.RaceLaps, mine.Lap + 1) + '/' + this.RaceLaps, Time: this.RaceClockOf(mine.Finished ? mine.Last : mine.LapTime), Best: mine.Best ? this.RaceClockOf(mine.Best) : '–'};
	},
	/* Its ground came (ground of the Scene): the car on the track, once its roads are there. */
	RaceWaiting: false,
	RaceGrounded: function () {
		if (!this.RaceWaiting || !this.RaceScene || !this.RaceScene().Roads().length) return;

		var self = this;

		this.RaceWaiting = false;

		/* The car once the cars are read (data/vehicles/cars). */
		this.$Service('DemoData').CarsRead(function () {
			self.RaceCarPut();
		});
	},
	RaceCarPut: function () {
		var scene = this.RaceScene();
		var track = this.RaceTrack;
		var start = track.Start;

		if (scene.Get('car'))
			scene.Remove('car');

		scene.Add('unit', this.$Service('DemoData').Car(this.RaceCar, {ID: 'car', X: start.X, Y: start.Z, Heading: start.Heading}, {Tune: this.RaceTune, Wet: this.RaceWashed, Drops: this.RaceDrops}));

		/* Its doors and windows as the ribbon has them (their roles). */
		scene.OpenPart('car', 'role:doors', this.RaceDoors ? 1 : 0);
		scene.OpenPart('car', 'role:windows', this.RaceWindows);

		/* The driver: a character of its own, in the seat of the car (G or Get out: out by its side, in again). */
		if (scene.Get('driver'))
			scene.Remove('driver');

		scene.Add('unit', {ID: 'driver', Name: 'Driver', Model: 'soldier', Size: 1.75, X: start.X + 3, Y: start.Z});
		scene.Control('driver');
		scene.Board('driver', 'car');

		scene.Scene().Wanted = scene.Scene().Distance = 8;
		scene.Scene().Yaw = start.Heading + Math.PI;
		scene.Scene().Pitch = 0.16;

		this.RaceRestart();
	},
	/* The driver gets out of the car by its side (the car going on as it was), or into it again when it stands by it. */
	RaceAboard: true,
	RaceBoarded: function () {
		var scene = this.RaceScene ? this.RaceScene() : null;
		if (scene)
			scene.BoardKey();
	},
	RaceContext: function (event) {
		var given = event && event.detail ? event.detail : event;
		if (given && given.Actor === 'driver')
			this.RaceAboard = given.Kind === 'seat';
	},
	/* The race again from the line: a new track, a car put on it. */
	RaceRestart: function () {
		var scene = this.RaceScene ? this.RaceScene() : null;
		var element = scene ? scene.$Element().querySelector('.elemenx-game-race') : null;

		this.RaceLapText = '';
		this.RaceWrong = false;

		if (element && Elemenx.Instance(element))
			Elemenx.Instance(element).Start();
	},
	RaceWrong: false,
	RaceDrops: 1,
	RaceWashed: false,
	RaceTune: {Turn: [[14, 55], [28, 60], [56, 70], [83, 75]], Build: [0.45, 0.25], Brake: 36, Grip: 1.75, Downforce: 0.9, Power: 950000, Answer: 24, Agility: 2.5, Assist: 0.8, Rear: 1.15, Slide: 0.42, Ride: 0.7, Coast: 3},
	RaceWindows: 0,
	RaceDoors: false,
	/* The cars (DemoData.Cars): how each goes, and where its pipes are in its model. */
	RaceCars: [],
	RaceCar: 'mclaren',
	RaceHour: 15,
	RaceKind: 'short',
	RaceSeed: 1,
	RaceWindowsMoved: function (value) {
		var scene = this.RaceScene ? this.RaceScene() : null;

		this.RaceWindows = Number(value);

		if (scene)
			scene.OpenPart('car', 'role:windows', this.RaceWindows);
	},
	RaceBuilt: function (index, value) {
		var build = this.RaceTune.Build.slice();

		build[index] = Number(value);

		this.RaceTable('Build', build);
	},
	RaceTable: function (name, value) {
		var scene = this.RaceScene ? this.RaceScene() : null;
		var car = scene ? scene.Scene().Objects.car : null;

		this.RaceTune = Object.assign({}, this.RaceTune);
		this.RaceTune[name] = value;

		if (car)
			car.Values.Vehicle[name] = value;
	},
	RaceBuildOf: function (index) {
		return this.RaceTune.Build ? this.RaceTune.Build[index] : 0;
	},
	RaceTurned: function (index, value) {
		var turn = this.RaceTune.Turn.map(function (row) {
			return row.slice();
		});

		turn[index][1] = Number(value);

		this.RaceTable('Turn', turn);
	},
	/* A row of the table of the turn, or an end of how long the steering takes. */
	RaceTurnOf: function (index) {
		return this.RaceTune.Turn ? this.RaceTune.Turn[index][1] : 0;
	},
	/* What a slider of the ribbon says of the car: it goes so from now on. */
	RaceTuned: function (name, value) {
		var scene = this.RaceScene ? this.RaceScene() : null;
		var car = scene ? scene.Scene().Objects.car : null;

		this.RaceTune = Object.assign({}, this.RaceTune);
		this.RaceTune[name] = Number(value);

		if (car)
			car.Values.Vehicle[name] = Number(value);
	},
	/* The water on the car: just washed, it is wet whatever the weather; Drops, how much of it beads on its paint and glass. */
	RaceWet: function (key, value) {
		var scene = this.RaceScene ? this.RaceScene() : null;

		this['Race' + key] = value;

		if (scene && scene.Get('car'))
			scene.Change('car', {Wet: this.RaceWashed ? 1 : '', Drops: this.RaceDrops});
	},
	/* The hour on the track: at dusk and at night the lights come on by themselves. */
	RaceTimed: function (value) {
		var scene = this.RaceScene ? this.RaceScene() : null;

		this.RaceHour = value;

		if (scene && scene.Get('day'))
			scene.Change('day', {Time: value});
	},
	/* The doors of the car, each on its own hinge, as its model has them: out, up as scissors, or up and out as butterfly wings. */
	RaceDoorsOpened: function (value) {
		var scene = this.RaceScene ? this.RaceScene() : null;

		this.RaceDoors = value;

		if (scene && scene.Get('car'))
			scene.OpenPart('car', 'role:doors', value ? 1 : 0);
	},
	RaceNewTrack: function () {
		this.RaceSeed++;

		this.RaceBuild();
	},
	/* The other track: made at once. */
	RaceKindChosen: function (value) {
		this.RaceKind = value;

		this.RaceBuild();
	},
	/* The tracks: a short one over rolling land, a long one through mountains (its tunnels, bridges and a viaduct). */
	RaceTracks: [{Value: 'short', Label: 'Short · 2.4 km'}, {Value: 'mountains', Label: 'Mountains · 8 km'}],
	RacePerson: 'third',
	RaceCarChosen: function (value) {
		this.RaceCar = value;
		this.RaceTune = {};
		this.RaceTune = Object.assign({}, this.RaceCars.filter(function (each) {
			return each.Value === value;
		})[0].Tune);

		if (this.RaceTrack)
			this.RaceCarPut();
	},
	RibbonTab: 'home',
	RaceTab: 'drive',

	$OnDestroy: function () {
		window.clearInterval(this.RaceClock);
	}
});
