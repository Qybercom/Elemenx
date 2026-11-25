/*
 * SceneCars: the cars of a game as data, each a file of its own (or many in a catalogue): its model and what its parts
 * are by their roles (ModelRoles: its wheels and what stops them, its doors and windows, its steering wheel, paddles,
 * pedals and wipers, its lamps), how it goes, where its pipes, mirrors and screens are. Of it a model is made (SceneModels,
 * its Roles in its recipe), and Scene.Add('unit', ...) takes what Unit gives to have it driven.
 *
 * A car: {Name, Model (a file of a model: glb, gltf or fbx), Size (how large it stands: 1.25), Apart (a word of the names
 * of what its file keeps as one piece to cut at its gaps: four wheels in one mesh), Materials (SceneModels Materials of
 * its recipe), Roles ([ModelRoles roles]), Yaw (degrees its model is turned from ahead), Seat ([x, y, z] of the driver),
 * Mass, Base (between its axles, metres), Width, Gears, Shift (auto or manual), Tune ({...} of a Vehicle: Turn, Brake, Grip,
 * Power...), Pipes ([[x, y, z]]: where its exhaust pops), Mirrors and Screens (of a Vehicle)}. A file is read from the
 * folder of the file of the car (Base) when its path is not absolute.
 *
 * - Define(name, car, base) makes its model ('car-<name>'), once: {Name, Label, Model, File, Car}.
 * - Load(url, callback(error, names)) reads a car ({Name, Model...}: its name the name of its file) or a catalogue
 *   ({Cars: {name: a car, or the path of the file of one}}) and defines each; its files from the folder of the file.
 * - Get(name) is what Define made, Names() the names of all in the order they came, Unit(name, more, tune) what
 *   Scene.Add('unit', ...) takes ({Model, Size, Vehicle} over more: Heading of more is the way it faces; tune over its own
 *   Tune), its model asked for. What its roles open is set by Scene.Part(id, role).Set (doors: Part(id, 'doors')).
 *
 * Regression: the cars of Racing were written in the demo, their parts found by words of the names of their materials and
 * boxes round them (Match, Low, High), a copy in each demo that drove them.
 */
Elemenx.Service('SceneCars', {
	$Meta: {
		Description: 'The cars of a game as data: a car a file of its own (its model, its parts by their roles, how it goes, its pipes, mirrors and screens), made a unit of a Scene.',
		Methods: ['Define(name, car, base)', 'Load(url, callback)', 'Get(name)', 'Names()', 'Unit(name, more, tune)']
	},

	$OnCreate: function () {
		this.Kept = {};
		this.Order = [];
	},

	/* A path of a file: as it is when absolute (/, a scheme), else from the folder given. */
	Path: function (path, base) {
		var given = String(path || '');
		if (!base || /^(\/|[a-z][a-z0-9+.-]*:)/i.test(given)) return given;

		return String(base).replace(/[^/]*$/, '') + given;
	},

	Define: function (name, car, base) {
		var models = this.$Service('SceneModels');
		var given = car || {};
		var made;

		if (!name || !given.Model)
			throw new Error('Elemenx SceneCars: Define expects (name, {Model})');

		made = {Name: String(name), Label: given.Name || String(name), Model: 'car-' + name, File: this.Path(given.Model, base), Car: given};

		if (!models.Has(made.Model))
			models.Define(made.Model, Object.assign({URL: made.File, Type: 'prop'}, given.Apart ? {Apart: given.Apart} : {}, given.Materials ? {Materials: given.Materials} : {}, given.Roles ? {Roles: given.Roles} : {}));

		if (!this.Kept[made.Name])
			this.Order.push(made.Name);

		this.Kept[made.Name] = made;

		return made;
	},

	/* A file of JSON, read: callback(error, data). */
	Read: function (url, callback) {
		var request = new XMLHttpRequest();

		request.open('GET', url);

		request.onload = function () {
			var data;

			if (request.status !== 200) {
				callback(new Error('Elemenx SceneCars: ' + url + ' gave ' + request.status), null);

				return;
			}

			try {
				data = JSON.parse(request.responseText);
			}
			catch (error) {
				callback(error, null);

				return;
			}

			callback(null, data);
		};

		request.onerror = function () {
			callback(new Error('Elemenx SceneCars: ' + url + ' could not be read'), null);
		};

		request.send();
	},

	Load: function (url, callback) {
		var self = this;
		var done = callback || function () {};

		this.Read(url, function (error, data) {
			var names;
			var left;
			var failed = null;

			if (error) {
				done(error, null);

				return;
			}

			/* One car: named after its file. */
			if (!data.Cars) {
				names = [String(url).replace(/^.*\//, '').replace(/\.json(\?.*)?$/i, '')];

				try {
					self.Define(names[0], data, url);
				}
				catch (made) {
					done(made, null);

					return;
				}

				done(null, names);

				return;
			}

			/* A catalogue: each car in it, or read from its own file; defined in the order of the catalogue. */
			names = Object.keys(data.Cars);
			left = names.length;

			var read = {};

			function finish () {
				if (failed) {
					done(failed, null);

					return;
				}

				try {
					names.forEach(function (name) {
						self.Define(name, read[name].Car, read[name].Base);
					});
				}
				catch (made) {
					done(made, null);

					return;
				}

				done(null, names);
			}

			if (!left) {
				finish();

				return;
			}

			names.forEach(function (name) {
				var given = data.Cars[name];

				if (typeof given !== 'string') {
					read[name] = {Car: given, Base: url};

					if (!--left)
						finish();

					return;
				}

				self.Read(self.Path(given, url), function (wrong, car) {
					if (wrong) failed = failed || wrong;
					else read[name] = {Car: car, Base: self.Path(given, url)};

					if (!--left)
						finish();
				});
			});
		});
	},

	Get: function (name) {
		return this.Kept[name] || null;
	},

	Names: function () {
		return this.Order.slice();
	},

	Unit: function (name, more, tune) {
		var made = this.Get(name);
		var given = more || {};
		var car;
		var unit;

		if (!made)
			return null;

		car = made.Car;

		this.$Service('SceneModels').Load(made.Model);

		unit = Object.assign({}, given, {Name: given.Name || '', Model: made.Model, Size: given.Size || Number(car.Size) || 1.25, Vehicle: Object.assign({
			Kind: 'car',
			Heading: Number(given.Heading) || 0,
			Yaw: Number(car.Yaw) || 0,
			Seat: car.Seat || [0.3, 0.95, 0],
			Mass: Number(car.Mass) || 1400,
			Base: Number(car.Base) || 2.85,
			Width: Number(car.Width) || 1.75,
			Mounts: (car.Pipes || []).map(function (at) {
				return {Kind: 'engine', Type: 'fumes', At: at, Aim: [0, 0, -1], Size: 0.5, Pop: true, Light: false};
			}),
			Gears: car.Gears || [0.3, 0.45, 0.58, 0.7, 0.81, 0.91, 1],
			Shift: car.Shift || 'auto',
			Mirrors: car.Mirrors || null,
			Screens: car.Screens || null
		}, car.Tune || {}, tune || {})});

		delete unit.Heading;

		return unit;
	}
});
