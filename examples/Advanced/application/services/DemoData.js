/*
 * DemoData: the data the demos share, read once: Get(url, callback(error, data)) a JSON file of data/ (kept after the first
 * read); Flat(objects, parent) the objects of a system (SystemData: {ID, Kind, Values, Traits, Children}) as a list of
 * Scene.Add, each child its Parent; Models(system, models) defines the models a system names (Models: {name: file of
 * data/models}); Ship(ship, more) the spec of a ship of data/vehicles/ships.json as Scene.Add takes it ({Vehicle, Traits}
 * of its systems: Power, Shields; its Sensors in its Vehicle), more over it. Regression: the system of Terra and the ships
 * were written in Orbit and in Universe each.
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

	Ship: function (ship, more) {
		var systems = ship.Systems || {};
		var given = more || {};

		return Object.assign({}, given, {
			Vehicle: Object.assign({Kind: 'ship', Yaw: ship.Yaw || 0, Mounts: ship.Mounts, Length: ship.Length, Sensors: systems.Sensors || null}, given.Vehicle || {}),
			Traits: Object.assign({}, systems.Power ? {Power: systems.Power} : {}, systems.Shields ? {Shields: systems.Shields} : {}, given.Traits || {})
		});
	}
});
