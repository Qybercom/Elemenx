/*
 * WeatherInfluences: what is done to the weather of a planet in a place for a while, over its forecast (SceneForecast):
 * a storm seeded, a rocket against hail, clouds seeded or dispersed, the fog a storm leaves. An influence is data, of no
 * state: {ID, Kind, Direction (the unit way of its middle in the frame of its body, as it began), Radius (km), Start and
 * Length (days of the scene), Strength, Seed}; what it does is the graph of its kind (resources/weather/influences.json:
 * Graph, Hours, Radius, Strength, Spawns), of the place (Near: its distance from the middle, a part of the radius), its
 * age (Age: a part of its life) and its Strength: what it adds to the forecast there (Cover, Rain, Kind, Cirrus, Fog).
 * Its middle drifts with the wind of the forecast (wind(way, days): the tangent way the air goes, radians a day). An
 * influence may leave others when it ends (Spawns: {Kind, At (a part of its life), Hours, Radius and Strength of its}),
 * made of it, never kept: the same list gives the same weather at any time, there and back.
 * - Kinds(): the kinds, of the resource.
 * - Make(kind, way, days, options): an influence of a kind from a way at a time (options Radius, Hours, Strength, ID, Seed).
 * - Center(one, days, wind): its middle at a time, drifted.
 * - Expand(list, days, wind): those going at a time, the ones they left among them.
 * - Apply(over, way, days, list, wind, radiusKm): a forecast of a place (Cover, Kind, Cirrus, Rain, Fog...) with what
 *   the influences over it do there.
 */
Elemenx.Service('WeatherInfluences', {
	$Meta: {
		Description: 'What is done to the weather of a planet in a place for a while (a storm seeded, a rocket against hail, clouds seeded or dispersed, fog): data of no state over its forecast, each kind a graph, drifting with the wind, leaving others.',
		Methods: ['Kinds()', 'Make(kind, way, days, options)', 'Center(one, days, wind)', 'Expand(list, days, wind)', 'Apply(over, way, days, list, wind, radiusKm)']
	},

	/* How deep influences left by influences go. */
	Depth: 3,

	Kinds: function () {
		return (Elemenx.Resources('Data', 'ElemenxGraphics/weather/influences') || {}).Kinds || {};
	},

	/* The graph of a kind as code ({Run}), made once. */
	Code: function (kind) {
		var told = this.Kinds()[kind];
		var graph;

		this.Codes = this.Codes || {};

		if (this.Codes[kind] !== undefined) return this.Codes[kind];

		graph = told ? Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + told.Graph) : null;
		this.Codes[kind] = graph ? this.$Service('Blueprints').Code(JSON.parse(JSON.stringify(graph))) : null;

		return this.Codes[kind];
	},

	Make: function (kind, way, days, options) {
		var given = options || {};
		var told = this.Kinds()[kind] || {};
		var length = Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]) || 1;

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		return {ID: given.ID || kind + ':' + days, Kind: kind, Direction: [way[0] / length, way[1] / length, way[2] / length], Radius: number(given.Radius, number(told.Radius, 20)), Start: days, Length: number(given.Hours, number(told.Hours, 4)) / 24, Strength: number(given.Strength, number(told.Strength, 1)), Seed: number(given.Seed, 0)};
	},

	Center: function (one, days, wind) {
		var at = one.Direction.slice();
		var end = Math.max(one.Start, Math.min(days, one.Start + one.Length));
		var steps = 6;
		var step = (end - one.Start) / steps;
		var i;

		if (!wind || step <= 0) return at;

		for (i = 0; i < steps; i++) {
			var v = wind(at, one.Start + step * (i + 0.5));
			var x = at[0] + v[0] * step;
			var y = at[1] + v[1] * step;
			var z = at[2] + v[2] * step;
			var length = Math.sqrt(x * x + y * y + z * z) || 1;

			at = [x / length, y / length, z / length];
		}

		return at;
	},

	Expand: function (list, days, wind) {
		var self = this;
		var kinds = this.Kinds();
		var going = [];

		function add (one, depth) {
			if (days < one.Start) return;

			if (days <= one.Start + one.Length)
				going.push(one);

			if (depth >= self.Depth) return;

			((kinds[one.Kind] || {}).Spawns || []).forEach(function (spawn, index) {
				var start = one.Start + one.Length * Number(spawn.At);
				if (days < start) return;

				add({ID: one.ID + '/' + index, Kind: spawn.Kind, Direction: self.Center(one, start, wind), Radius: one.Radius * Number(spawn.Radius || 1), Start: start, Length: Number(spawn.Hours || 4) / 24, Strength: one.Strength * Number(spawn.Strength === undefined ? 1 : spawn.Strength), Seed: one.Seed + index + 1}, depth + 1);
			});
		}

		(list || []).forEach(function (one) {
			add(one, 0);
		});

		return going;
	},

	Apply: function (over, way, days, list, wind, radiusKm) {
		var self = this;
		var made;

		if (!over || !list || !list.length) return over;

		made = Object.assign({Fog: 0}, over);

		this.Expand(list, days, wind).forEach(function (one) {
			var middle = self.Center(one, days, wind);
			var cos = Math.max(-1, Math.min(1, middle[0] * way[0] + middle[1] * way[1] + middle[2] * way[2]));
			var near = Math.acos(cos) * radiusKm / Math.max(1e-6, one.Radius);
			var code;
			var done;

			if (near >= 1) return;

			code = self.Code(one.Kind);

			if (!code) return;

			done = code.Run({}, {Near: near, Age: (days - one.Start) / Math.max(1e-9, one.Length), Strength: one.Strength});

			['Cover', 'Rain', 'Kind', 'Cirrus', 'Fog'].forEach(function (key) {
				made[key] = Math.max(0, Math.min(1, (Number(made[key]) || 0) + (Number(done[key]) || 0)));
			});
		});

		return made;
	}
});
