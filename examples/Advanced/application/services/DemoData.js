/*
 * DemoData: the data the demos share, read once: Get(url, callback(error, data)) a JSON file of data/ (kept after the first
 * read); Flat(objects, parent) the objects of a system (SystemData: {ID, Kind, Values, Traits, Children}) as a list of
 * Scene.Add, each child its Parent; Models(system, models) defines the models a system names (Models: {name: file of
 * data/models}); Ship(ship, more) the spec of a ship of data/vehicles/ships.json as Scene.Add takes it ({Vehicle, Traits}
 * of its systems: Power, Shields; its Sensors in its Vehicle), more over it. Regression: the system of Terra and the ships
 * were written in Orbit and in Universe each. CharactersRead(callback(error, list)) reads the walkers of the demos once
 * (data/characters/characters.json, a catalogue of SceneCharacters: their models, clips, bones, what they hold): Characters
 * [{Value, Label, File (of its model; '' for one of code), Model}]; Character(value) the one of that value as a unit takes
 * it ({Model, Hold, Size}). Regression: they were written in Locations, then here, and the walkers of Game are the same. Weapons those of a hero on foot ({Value, Label, Icon, Key});
 * RangeModels(models) defines the models of a range of targets (a crate of planks, a steel plate, a pane of glass, a wall
 * of stone); Range(at, ahead, prefix) its targets as Scene.Add takes them, laid out from a point [x, y] of the ground toward
 * a way [x, y] of it, their IDs after prefix. Regression: they were written in Combat, and Game lays the same range.
 * CarsRead(callback(error, list)) reads the cars of the demos once (data/vehicles/cars, a catalogue of SceneCars: a file a
 * car, its parts by their roles): Cars [{Value, Label, File, Tune}]; Car(value, place, options) the one of that value as
 * Scene.Add takes it. Regression: they were written in Racing, then here, and Game puts the same cars by its ship.
 */
Elemenx.Service('DemoData', {
	Kept: {},

	Get: function (url, callback) {
		var self = this;
		var kept = this.Kept[url];
		var request;

		if (kept && kept.Data)
			return callback(null, kept.Data);

		if (kept) {
			kept.Waiting.push(callback);

			return;
		}

		kept = this.Kept[url] = {Data: null, Waiting: [callback]};
		request = new XMLHttpRequest();

		request.open('GET', url);

		request.onload = function () {
			var data = null;
			var error = null;

			try {
				data = request.status === 200 ? JSON.parse(request.responseText) : null;
			}
			catch (failed) {
				error = failed;
			}

			if (!data && !error)
				error = new Error('DemoData: ' + url + ' is not there (' + request.status + ')');

			if (error) delete self.Kept[url];
			else kept.Data = data;

			kept.Waiting.splice(0).forEach(function (waiting) {
				waiting(error, data);
			});
		};

		request.onerror = function () {
			delete self.Kept[url];

			kept.Waiting.splice(0).forEach(function (waiting) {
				waiting(new Error('DemoData: ' + url + ' could not be read'), null);
			});
		};

		request.send();
	},

	Flat: function (objects, parent) {
		var self = this;
		var list = [];

		(objects || []).forEach(function (one) {
			var made = Object.assign({}, one);

			delete made.Children;

			if (parent)
				made.Parent = parent;

			list.push(made);

			list = list.concat(self.Flat(one.Children, one.ID));
		});

		return list;
	},

	Models: function (system, models) {
		Object.keys(system && system.Models || {}).forEach(function (name) {
			if (!models.Has(name))
				models.Define(name, {URL: '/data/models/' + system.Models[name], Type: 'prop'});

			models.Load(name);
		});
	},

	Characters: [],

	/* The walkers of the demos read once (data/characters/characters.json, SceneCharacters), then given to each who waits. */
	CharactersRead: function (callback) {
		var self = this;
		var characters = this.$Service('SceneCharacters');

		if (this.Characters.length) {
			callback(null, this.Characters);

			return;
		}

		this.CharactersWaiting = (this.CharactersWaiting || []).concat([callback]);

		if (this.CharactersWaiting.length > 1) return;

		characters.Load('/data/characters/characters.json', function (error, names) {
			var waiting = self.CharactersWaiting;

			self.CharactersWaiting = null;

			if (!error)
				self.Characters = names.map(function (name) {
					var made = characters.Get(name);

					return {Value: name, Label: made.Label, File: made.File, Model: made.File ? '' : made.Model};
				});

			waiting.forEach(function (one) {
				one(error, self.Characters);
			});
		});
	},

	/* The walker of that value (else the first) as a unit takes it: {Model, Hold, Size}, its models asked for. */
	Character: function (value) {
		var characters = this.$Service('SceneCharacters');
		var name = characters.Get(value) ? value : this.Characters.length ? this.Characters[0].Value : value;

		return characters.Unit(name) || {Model: 'mannequin', Hold: undefined, Size: 1.8};
	},

	Weapons: [
		{Value: 'rifle', Label: 'Rifle', Icon: 'games:crosshair', Key: '1'},
		{Value: 'pistol', Label: 'Pistol', Icon: 'games:joystick', Key: '2'},
		{Value: 'shotgun', Label: 'Shotgun', Icon: 'games:star-power', Key: '3'},
		{Value: 'sniper', Label: 'Sniper rifle', Icon: 'science:telescope', Key: '4'},
		{Value: 'laser', Label: 'Laser', Icon: 'science:prism', Key: '5'},
		{Value: 'railgun', Label: 'Railgun', Icon: 'science:magnet', Key: '6'},
		{Value: 'plasma', Label: 'Plasma', Icon: 'science:atom', Key: '7'},
		{Value: 'rocket', Label: 'Rocket (locks)', Icon: 'science:rocket', Key: '8'},
		{Value: 'mortar', Label: 'Mortar', Icon: 'games:bomb', Key: '9'},
		{Value: 'bow', Label: 'Bow', Icon: 'games:bow', Key: '0'}
	],

	RangeModels: function (models) {
		if (models.Has('demo-crate')) return;

		models.Define('demo-crate', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			var wood = [0.62, 0.45, 0.26];
			var dark = [0.42, 0.29, 0.16];

			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], wood), tools.Box(1.02, 0.12, 1.02, [0, 0.08, 0], dark), tools.Box(1.02, 0.12, 1.02, [0, 0.92, 0], dark), tools.Box(0.12, 1.02, 1.02, [-0.45, 0.5, 0], dark), tools.Box(0.12, 1.02, 1.02, [0.45, 0.5, 0], dark)])];
		}});

		models.Define('demo-plate', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			var steel = [0.58, 0.6, 0.64];

			return [tools.Piece('body', [tools.Box(1.2, 0.9, 0.06, [0, 0.95, 0], steel), tools.Box(0.08, 1.4, 0.08, [-0.5, 0.7, 0.06], [0.3, 0.3, 0.32]), tools.Box(0.08, 1.4, 0.08, [0.5, 0.7, 0.06], [0.3, 0.3, 0.32])])];
		}});

		models.Define('demo-pane', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			var frame = [0.25, 0.25, 0.28];

			return [tools.Piece('body', [tools.Box(1, 1.3, 0.02, [0, 0.95, 0], [0.7, 0.85, 0.95]), tools.Box(1.1, 0.06, 0.06, [0, 0.3, 0], frame), tools.Box(1.1, 0.06, 0.06, [0, 1.6, 0], frame), tools.Box(0.06, 1.36, 0.06, [-0.55, 0.95, 0], frame), tools.Box(0.06, 1.36, 0.06, [0.55, 0.95, 0], frame), tools.Box(0.06, 0.3, 0.06, [0, 0.15, 0], frame)])];
		}});

		models.Define('demo-wall', {Group: 'buildings', Type: 'building', Size: 1, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(4, 2.5, 0.4, [0, 1.25, 0], [0.62, 0.6, 0.56]), tools.Box(4.1, 0.2, 0.5, [0, 2.5, 0], [0.5, 0.48, 0.45])])];
		}});
	},

	Range: function (at, ahead, prefix) {
		var length = Math.hypot(ahead[0], ahead[1]) || 1;
		var forward = [ahead[0] / length, ahead[1] / length];
		var right = [forward[1], -forward[0]];
		/* Turned with the way they are laid out toward (Facing: none toward +y, as they were made), a robot to the point. */
		var turn = Math.atan2(forward[0], forward[1]) * 180 / Math.PI;
		var spots = [
			{ID: 'crate', Kind: 'thing', Model: 'demo-crate', Size: 1.2, Side: -6, Ahead: 14, Material: 'wood', Traits: {Fracture: {Material: 'wood', Pieces: 7}}},
			{ID: 'plate', Kind: 'thing', Model: 'demo-plate', Size: 1.6, Side: -2, Ahead: 14, Material: 'metal', Traits: {Health: {Max: 400, Death: 'keep'}, Fracture: {Material: 'metal', Pattern: 'parts'}}},
			{ID: 'pane', Kind: 'thing', Model: 'demo-pane', Size: 1.7, Side: 2, Ahead: 14, Material: 'glass', Traits: {Fracture: {Material: 'glass'}}},
			{ID: 'wall', Kind: 'thing', Model: 'demo-wall', Size: 2.5, Side: 7, Ahead: 16, Material: 'stone', Traits: {Fracture: {Material: 'stone', Pieces: 14}}},
			{ID: 'robot-1', Kind: 'unit', Model: 'robot', Side: -3, Ahead: 24, Team: 'red', Damage: 0, Sight: 1},
			{ID: 'robot-2', Kind: 'unit', Model: 'robot', Side: 3, Ahead: 26, Team: 'red', Damage: 0, Sight: 1}
		];

		return spots.map(function (spot) {
			var made = Object.assign({}, spot, {ID: (prefix || '') + spot.ID, X: at[0] + right[0] * spot.Side + forward[0] * spot.Ahead, Y: at[1] + right[1] * spot.Side + forward[1] * spot.Ahead});

			if (turn)
				made.Facing = spot.Kind === 'unit' ? turn + 180 : turn;

			delete made.Side;
			delete made.Ahead;

			return made;
		});
	},

	Cars: [],

	/* The cars of the demos read once (data/vehicles/cars/cars.json, a catalogue of SceneCars), then given to each who waits. */
	CarsRead: function (callback) {
		var self = this;
		var cars = this.$Service('SceneCars');

		if (this.Cars.length) {
			callback(null, this.Cars);

			return;
		}

		this.CarsWaiting = (this.CarsWaiting || []).concat([callback]);

		if (this.CarsWaiting.length > 1) return;

		cars.Load('/data/vehicles/cars/cars.json', function (error, names) {
			var waiting = self.CarsWaiting;

			self.CarsWaiting = null;

			if (!error)
				self.Cars = names.map(function (name) {
					var made = cars.Get(name);

					return {Value: name, Label: made.Label, File: made.File, Tune: made.Car.Tune || {}};
				});

			waiting.forEach(function (one) {
				one(error, self.Cars);
			});
		});
	},

	/*
	 * The car of that value (else the first) as Scene.Add('unit', ...) takes it, at place {ID, X, Y, Heading}; options {Tune
	 * (over its own), Wet, Drops}. What its roles open (its doors, its windows) is set after it is added: Scene.Part.
	 */
	Car: function (value, place, options) {
		var cars = this.$Service('SceneCars');
		var given = options || {};
		var name = cars.Get(value) ? value : this.Cars.length ? this.Cars[0].Value : value;

		return cars.Unit(name, Object.assign({}, place, {Wet: given.Wet ? 1 : '', Drops: given.Drops === undefined ? 1 : given.Drops}), given.Tune);
	},

	Ship: function (ship, more) {
		var systems = ship.Systems || {};
		var given = more || {};

		return Object.assign({}, given, {
			Vehicle: Object.assign({Kind: 'ship', Yaw: ship.Yaw || 0, Mounts: ship.Mounts, Length: ship.Length, Sensors: systems.Sensors || null}, given.Vehicle || {}),
			Traits: Object.assign({}, systems.Power ? {Power: systems.Power} : {}, systems.Shields ? {Shields: systems.Shields} : {}, given.Traits || {})
		});
	}
});
