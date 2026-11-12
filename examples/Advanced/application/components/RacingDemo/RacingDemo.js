/*
 * RacingDemo (Gaming): a car on a track of a seed (SceneRoads, Vehicles, GameRace): a click takes the mouse, W drives, S
 * goes back, A and D steer, Space brakes, Shift drifts, C is the hand brake, L the lights, Z and X the indicators, V
 * changes the camera; on a touch screen its gamepad drives (the lean of the phone steers).
 */
Elemenx.Component('RacingDemo', {
	$TemplateURL: 'RacingDemo.html',
	$StyleURL: 'RacingDemo.css',
	$Traits: ['SceneDemo'],
	/* A lap of the GameRace of the scene: its number, its time and the best one. */
	RaceLapped: function (event) {
		function clock (seconds) {
			return Math.floor(seconds / 60) + ':' + ('0' + (seconds % 60).toFixed(1)).slice(-4);
		}

		this.RaceLapText = 'lap ' + event.Lap + ' ' + clock(event.Time) + ' · best ' + clock(event.Best);
	},
	RaceLapText: '',
	RaceRpmPart: 0,
	RaceGearOnly: 'N',
	RaceSignals: {Left: false, Right: false, Lights: false},
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

		this.RaceWait(0);

		this.RaceWatch(scene);
	},
	/* What the ribbon and the dash show of the car: its speed, gear, revolutions and lights, five times a second. */
	RaceWatch: function (scene) {
		var self = this;

		window.clearInterval(this.RaceClock);

		this.RaceClock = window.setInterval(function () {
			var hero = scene.Scene().Objects.car;

			if (!self.$Element().isConnected) {
				window.clearInterval(self.RaceClock);

				return;
			}

			self.RaceSpeed = hero && hero.Car ? Math.round(Math.abs(hero.Car.Forward) * 3.6) : 0;
			self.RaceGearOnly = hero && hero.Car && hero.Car.Gear !== undefined ? (hero.Car.Gear < 0 ? 'R' : hero.Car.Gear === 0 ? 'N' : String(hero.Car.Gear)) : 'N';
			self.RaceRpmPart = hero && hero.Car && hero.Car.Rpm ? Math.round(Math.min(1, hero.Car.Rpm / 7500) * 100) : 0;
			self.RaceSignals = {Left: !!(hero && hero.Signals && (hero.Signals.Indicate === -1 || hero.Signals.Hazard) && Math.floor((hero.Blink || 0) / 0.36) % 2 === 0), Right: !!(hero && hero.Signals && (hero.Signals.Indicate === 1 || hero.Signals.Hazard) && Math.floor((hero.Blink || 0) / 0.36) % 2 === 0), Lights: !!(hero && hero.Signals && hero.Signals.Lights)};
			self.RaceGear = hero && hero.Car && hero.Car.Gear !== undefined ? (hero.Car.Gear < 0 ? 'R' : hero.Car.Gear === 0 ? 'N' : String(hero.Car.Gear)) + ' · ' + Math.round(hero.Car.Rpm / 100) * 100 + ' rpm' : '';
		}, 200);
	},
	RaceGear: '',
	RaceSpeed: 0,
	RaceWait: function (tries) {
		var self = this;
		var scene = this.RaceScene();
		var ground = scene.Scene().Ground;

		if (!ground || !ground.Field || !scene.Roads().length) {
			if (tries < 400)
				window.setTimeout(function () {
					self.RaceWait(tries + 1);
				}, 50);

			return;
		}

		this.RaceCarPut();
	},
	RaceCarPut: function () {
		var scene = this.RaceScene();
		var models = this.$Service('SceneModels');
		var track = this.RaceTrack;
		var start = track.Start;
		var chosen = this.RaceCar;
		var car = this.RaceCars.filter(function (each) {
			return each.Value === chosen;
		})[0];
		var name = 'car-' + chosen;
		var doors = this.RaceDoors ? 1 : 0;
		var mounts = car.Pipes.map(function (at) {
			return {Kind: 'engine', Type: 'fumes', At: at, Aim: [0, 0, -1], Size: 0.5, Pop: true, Light: false};
		});

		if (!models.Has(name))
			models.Define(name, {URL: '/data/models/' + car.File, Type: 'prop', Apart: car.Apart, Materials: {'GrilleNoAlpha[89]A': {ColorMap: null, BaseColor: [0.03, 0.03, 0.035, 1]}}});

		models.Load(name);

		if (scene.Get('car'))
			scene.Remove('car');

		scene.Add('unit', {ID: 'car', Name: '', Model: name, Size: car.Size || 1.25, X: start.X, Y: start.Z, Vehicle: Object.assign({Kind: 'car', Heading: start.Heading, Wheels: car.Wheels, Held: car.Held, Yaw: car.Yaw, Seat: car.Seat || [0.3, 0.95, 0], Mass: 1400, Base: 2.85, Width: 1.75, Mounts: mounts, Openings: (car.Windows ? [{Name: 'windows', Match: 'Window', Both: true, Low: car.Windows, High: [0.7, 0.95, 0.65], Way: [0, -1, 0], Reach: 0.26, Open: this.RaceWindows, Follow: (car.Controls || []).some(function (each) {
			return each.Name === 'doors';
		}) ? 'doors' : ''}] : []).concat((car.Controls || []).map(function (each) {
			return each.Name === 'doors' ? Object.assign({}, each, {Open: doors}) : each;
		})), Gears: car.Gears || [0.3, 0.45, 0.58, 0.7, 0.81, 0.91, 1], Shift: car.Shift || 'auto', Lamps: car.Lamps || [], Mirrors: car.Mirrors || null, Screens: car.Screens || null}, car.Tune, this.RaceTune), Wet: this.RaceWashed ? 1 : '', Drops: this.RaceDrops});
		scene.Control('car');

		scene.Scene().Wanted = scene.Scene().Distance = 8;
		scene.Scene().Yaw = start.Heading + Math.PI;
		scene.Scene().Pitch = 0.16;

		this.RaceRestart();
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
	/* What each car is: how it goes, and where its pipes are in its model. */
	RaceCars: [
		{Value: 'mclaren', Label: 'McLaren W1', Mirrors: [
			{At: [-0.004, 0.839, 0.356], Normal: [0, 0, -1], Width: 0.2, Height: 0.044},
			{At: [0.841, 0.712, 0.508], Normal: [-0.4, 0.03, -0.92], Width: 0.115, Height: 0.064},
			{At: [-0.841, 0.712, 0.508], Normal: [0.4, 0.03, -0.92], Width: 0.115, Height: 0.064}
		], Screens: [{Source: 'dash', At: [0.25, 0.648, 0.468], Normal: [0.02, 0.03, -1], Width: 0.23, Height: 0.052, Pixels: [512, 116]}], Lamps: [{Kind: 'indicator', Match: 'LightEmissiveA|light_glass', Both: true, Low: [0.72, 0.15, 1.2], High: [1, 1, 2.1]}, {Kind: 'head', Match: 'LightEmissiveA|light_glass|LightA', Both: true, Low: [0.05, 0.15, 1.2], High: [1, 1, 2.1]}, {Kind: 'rear', Match: 'red_glass|LightEmissiveA', Both: true, Low: [0.05, 0.15, -2.1], High: [1, 1, -1.4]}], Controls: [
			{Name: 'steering', Match: 'InteriorA|Carbon1M', Disc: {At: [0.255, 0.632, 0.29], Axis: [-0.006, -0.124, 0.992], Radius: 0.2, Depth: 0.075}, Hinge: [0.255, 0.632, 0.29], Axis: [0.006, 0.124, -0.992], Angle: 140, Drive: 'steer'},
			{Name: 'paddle-up', Match: 'InteriorA', Disc: {At: [0.144, 0.636, 0.337], Axis: [-0.006, -0.124, 0.992], Radius: 0.05, Depth: 0.03}, Way: [0.006, 0.124, -0.992], Reach: 0.012, Drive: 'paddle', Sign: 1, Follow: 'steering'},
			{Name: 'paddle-down', Match: 'InteriorA', Disc: {At: [0.362, 0.644, 0.336], Axis: [-0.006, -0.124, 0.992], Radius: 0.05, Depth: 0.03}, Way: [0.006, 0.124, -0.992], Reach: 0.012, Drive: 'paddle', Sign: -1, Follow: 'steering'},
			{Name: 'doors', Match: 'Paint|Carbon1M|InteriorA', Both: true, Low: [0.5, 0.25, -0.45], High: [0.95, 1, 0.6], Hinge: [0.6, 0.84, 0.5], Axis: [0.835, -0.313, 0.467], Angle: 75}
		], File: '2025_mclaren_w1.glb', Tune: {Turn: [[14, 55], [28, 60], [56, 70], [83, 75]], Build: [0.45, 0.25], Brake: 36, Bite: 2, Coast: 3, Grip: 1.75, Downforce: 0.9, Power: 950000, Answer: 24, Agility: 2.5, Assist: 0.8, Rear: 1.15, Slide: 0.42, Ride: 0.7, Lock: 0.6, Keep: 115, AntiRoll: 120000, Balance: 0.32}, Pipes: [[0.09, 0.53, -1.94], [-0.09, 0.53, -1.94]], Windows: [0.42, 0.52, -0.33]},
		{Value: 'aston', Label: 'Aston Martin V12 Vantage', Lamps: [{Kind: 'indicator', Match: 'orange_glass', Both: true}, {Kind: 'head', Match: 'LightA', Both: true, Low: [0.05, 0.15, 1.2], High: [1, 1, 2]}, {Kind: 'rear', Match: 'red_glass', Both: true}], Controls: [
			{Name: 'doors', Match: '^material$|Paint|Window|InteriorA', Both: true, Low: [0.47, 0.22, -0.62], High: [0.95, 1, 0.56], Hinge: [0.69, 0.5, 0.56], Axis: [0, -0.96, -0.28], Angle: 65}
		], File: '2023_aston_martin_v12_vantage.glb', Tune: {Turn: [[14, 52], [28, 56], [56, 64], [83, 68]], Build: [0.5, 0.3], Brake: 28, Bite: 1.8, Coast: 2.5, Grip: 1.35, Downforce: 0.3, Power: 620000, Answer: 20, Agility: 2, Assist: 0.7, Rear: 1.1, Slide: 0.38, Ride: 1, Lock: 0.56, Keep: 95, AntiRoll: 80000, Balance: 0.36}, Pipes: [[0.06, 0.19, -1.54], [-0.06, 0.19, -1.54]]},
		{Value: 'veneno', Label: 'Lamborghini Veneno', Lamps: [{Kind: 'indicator', Match: 'LightA', Both: true, Low: [0.7, 0.15, 1.2], High: [1, 1, 2.2]}, {Kind: 'head', Match: 'LightA', Both: true, Low: [0.05, 0.15, 1.2], High: [1, 1, 2.2]}, {Kind: 'rear', Match: 'LightA', Both: true, Low: [0.05, 0.15, -2.2], High: [1, 1, -1.5]}], Controls: [
			{Name: 'doors', Match: 'phong1|Paint|Coloured|Window|InteriorA', Both: true, Low: [0.5, 0.22, -0.4], High: [0.95, 1, 0.74], Hinge: [0.82, 0.35, 0.72], Axis: [1, 0, 0], Angle: 75}
		], File: '2013_lamborghini_veneno.glb', Size: 1.17, Tune: {Turn: [[14, 54], [28, 58], [56, 67], [83, 72]], Build: [0.45, 0.27], Mass: 1490, Brake: 32, Bite: 1.9, Coast: 2.8, Grip: 1.5, Downforce: 0.6, Power: 620000, Answer: 22, Agility: 2.2, Assist: 0.75, Rear: 1.12, Slide: 0.42, Ride: 0.8, Lock: 0.58, Keep: 105, AntiRoll: 110000, Balance: 0.34}, Pipes: [[0.037, 0.255, -2.04], [-0.037, 0.255, -2.04], [0.037, 0.155, -2], [-0.037, 0.155, -2]]},
		{Value: 'porsche', Label: 'Porsche 911 GT3 R', Lamps: [{Kind: 'head', Match: 'Emissive_Light_Front|Glass_Emissive_Front', Both: true}, {Kind: 'rear', Match: 'Emissive_Light_Rear|Glass_Emissive_Rear', Both: true}], Controls: [
			{Name: 'steering', Match: 'steer', Nodes: true, Hinge: [0.24, 0.564, 0.165], Axis: [0, 0.33, -0.944], Angle: 140, Drive: 'steer'},
			{Name: 'wiper', Match: '^WIPER', Nodes: true, Hinge: [-0.01, 0.596, 0.93], Axis: [0, 0.9, 0.436], Angle: 60, Drive: 'wipers'},
			{Name: 'doors', Match: '^DOOR_(L|R)', Nodes: true, Both: true, Hinge: [0.78, 0.5, 0.6], Axis: [0, -1, 0], Angle: 65}
		], File: '2024_porsche_992_gt3_r.glb', Size: 1.28, Wheels: 'EXT_RIM|Tyre', Seat: [0.31, 0.97, -0.25], Tune: {Turn: [[14, 58], [28, 64], [56, 74], [83, 78]], Build: [0.38, 0.22], Mass: 1250, Top: 82, Brake: 40, Bite: 2.2, Coast: 3.2, Grip: 1.85, Downforce: 1, Power: 420000, Answer: 26, Agility: 2.6, Assist: 0.75, Rear: 1.1, Slide: 0.4, Ride: 0.55, Lock: 0.6, Keep: 120, AntiRoll: 150000, Balance: 0.3}, Pipes: [[0.042, 0.257, -1.81], [-0.042, 0.257, -1.81]]},
		{Value: 'revuelto', Label: 'Lamborghini Revuelto', Lamps: [{Kind: 'head', Match: '^HeadLights$', Both: true}, {Kind: 'rear', Match: 'Emission_Red', Both: true}], Controls: [
			{Name: 'steering', Match: '^SteeringWheel', Nodes: true, Hinge: [0.322, 0.613, 0.342], Axis: [0, 0.243, -0.97], Angle: 140, Drive: 'steer'},
			{Name: 'paddle-up', Match: '^PaddleShifterR', Nodes: true, Way: [0, 0.243, -0.97], Reach: 0.012, Drive: 'paddle', Sign: 1, Follow: 'steering'},
			{Name: 'paddle-down', Match: '^PaddleShifterL', Nodes: true, Way: [0, 0.243, -0.97], Reach: 0.012, Drive: 'paddle', Sign: -1, Follow: 'steering'},
			{Name: 'gas', Match: '^PedalGas', Nodes: true, Hinge: [0.16, 0.349, 0.86], Axis: [-1, 0, 0], Angle: 16, Drive: 'gas'},
			{Name: 'brake', Match: '^PedalBrake', Nodes: true, Hinge: [0.302, 0.541, 0.88], Axis: [-1, 0, 0], Angle: 14, Drive: 'brake'},
			{Name: 'wiper-left', Match: '^Wiper(ArmL|BladeL|L_)', Nodes: true, Hinge: [0.46, 0.66, 1.27], Axis: [0.154, 0.89, 0.429], Angle: 95, Drive: 'wipers'},
			{Name: 'wiper-right', Match: '^Wiper(ArmR|BladeR|R_)', Nodes: true, Hinge: [0.035, 0.65, 1.33], Axis: [0.154, 0.89, 0.429], Angle: 95, Drive: 'wipers'},
			{Name: 'doors', Match: '^((Door|Glass|DoorCard)(LF|RF)|WingMirror(L|R)|MirrorBase(L|R))', Nodes: true, Both: true, Hinge: [0.75, 0.42, 0.85], Axis: [1, 0, 0], Angle: 75}
		], File: 'lamborghini_revuelto.glb', Size: 1.16, Wheels: 'Wheel\\.001|M_WheelRim', Held: 'M_Caliper', Tune: {Turn: [[14, 53], [28, 57], [56, 66], [83, 70]], Build: [0.48, 0.28], Mass: 1770, Brake: 34, Bite: 1.9, Coast: 2.8, Grip: 1.6, Downforce: 0.55, Power: 750000, Answer: 22, Agility: 2.2, Assist: 0.8, Rear: 1.2, Slide: 0.45, Ride: 0.85, Lock: 0.58, Keep: 110, AntiRoll: 130000, Balance: 0.33}, Pipes: [[0.106, 0.662, -2.08], [-0.106, 0.662, -2.08], [0.184, 0.662, -2.08], [-0.184, 0.662, -2.08]]},
		{Value: 'mp420', Label: 'McLaren MP4-20', File: '2005_mclaren_mp4-20 (1).glb', Size: 0.95, Wheels: 'Tyre|MCLARENRIM|MCLHUB|SPOKES|Brake_Disk', Apart: 'Tyre|MCLARENRIM|MCLHUB|SPOKES|Brake_Disk|Caliper', Seat: [0, 0.72, -0.1], Tune: {Turn: [[14, 60], [28, 70], [56, 85], [83, 95]], Build: [0.3, 0.16], Mass: 600, Top: 100, Base: 3.1, Width: 1.5, Brake: 52, Bite: 2.6, Coast: 5, Grip: 2.1, Downforce: 1.6, Power: 690000, Answer: 30, Agility: 3, Assist: 0.85, Rear: 1.1, Slide: 0.5, Ride: 0.45, Lock: 0.5, Keep: 140, AntiRoll: 90000, Balance: 0.24}, Pipes: [[0.135, 0.37, -1.35], [-0.135, 0.37, -1.35]]},
		{Value: 'mp45', Label: 'McLaren MP4/5', File: 'mclaren_mp45_formula_one.glb', Size: 1, Wheels: 'Object_(18|46)$', Apart: 'Object_(18|46)$', Seat: [0, 0.72, 0.1], Tune: {Turn: [[14, 58], [28, 66], [56, 78], [83, 86]], Build: [0.34, 0.2], Mass: 540, Base: 2.95, Width: 1.5, Brake: 44, Bite: 2.3, Coast: 4.5, Grip: 1.85, Downforce: 1.1, Power: 510000, Answer: 28, Agility: 2.8, Assist: 0.75, Rear: 1.08, Slide: 0.45, Ride: 0.5, Lock: 0.5, Keep: 130, AntiRoll: 80000, Balance: 0.25}, Pipes: [[0.228, 0.14, -1.78], [-0.228, 0.14, -1.78]]},
		{Value: '350z', Label: 'Nissan 350Z', Lamps: [{Kind: 'head', Match: 'Lights_160', Both: true, Low: [0.05, 0.15, 1.2], High: [1, 1, 2]}, {Kind: 'rear', Match: 'Lights_160', Both: true, Low: [0.05, 0.15, -2], High: [1, 1, -1.3]}], Controls: [
			{Name: 'doors', Match: '350Z_Base|Glass|Interior|Door', Both: true, Low: [0.5, 0.2, -0.54], High: [0.95, 0.95, 0.58], Hinge: [0.68, 0.45, 0.58], Axis: [0, -0.96, -0.2], Angle: 65}
		], File: 'rachels_nissan_350z_nfs_underground_2 (1).glb', Size: 1.31, Seat: [0.33, 1.1, -0.25], Tune: {Turn: [[14, 56], [28, 58], [56, 62], [83, 64]], Build: [0.5, 0.32], Mass: 1500, Top: 78, Base: 2.65, Width: 1.6, Brake: 26, Bite: 1.7, Coast: 2.2, Grip: 1.25, Downforce: 0.2, Power: 340000, Answer: 18, Agility: 2, Assist: 0.65, Rear: 0.98, Slide: 0.3, Angle: 0.95, Ride: 1.1, Lock: 0.62, Keep: 90, AntiRoll: 70000, Balance: 0.4}, Pipes: [[0.258, 0.184, -1.63], [-0.258, 0.184, -1.63], [0.338, 0.184, -1.63], [-0.338, 0.184, -1.63]]}
	],
	RaceCar: 'mclaren',
	RaceHour: 15,
	RaceKind: 'short',
	RaceSeed: 1,
	RaceWindowsMoved: function (value) {
		var scene = this.RaceScene ? this.RaceScene() : null;

		this.RaceWindows = Number(value);

		if (scene)
			scene.OpenPart('car', 'windows', this.RaceWindows);
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
			scene.OpenPart('car', 'doors', value ? 1 : 0);
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
	RaceNote: '',

	$OnDestroy: function () {
		window.clearInterval(this.RaceClock);
	}
});
