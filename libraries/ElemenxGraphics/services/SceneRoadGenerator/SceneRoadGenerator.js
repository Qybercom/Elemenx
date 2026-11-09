/*
 * SceneRoadGenerator: roads made of a seed, the same each time. Track(seed, options) is a closed race track: the spec of a
 * road of kind road for a Scene ({ID, Type, Closed, Points, Barriers, Marks}) with where it starts, round a middle, nearer
 * and farther, so it never crosses itself. Options: Length (the way round, metres, 2400), Corners (how many bends, 9 to
 * 14), Wild (how far it strays from a round, 0 to 1, 0.55), Type (of SceneRoads, track), Barrier (the kind of its barriers,
 * tyres; none: no barriers), Gap (metres from the edge of the road to them, 2), Scenery (true: a land of mountains for it,
 * its tunnels and bridges found). It returns {Seed, Spec, Length, Start: {X, Z, Heading, At}}: Start is on the middle of
 * its longest straight, At metres from the start of its line; of Scenery also Sketch ({Layers} of a world for it: on its
 * line a mountain it goes under, a canyon and a wide valley it goes over, a ridge across it; mountains round it) and Size
 * (of a world that holds it all).
 */
Elemenx.Service('SceneRoadGenerator', {
	$Meta: {
		Description: 'Roads made of a seed, the same each time: closed race tracks as roads of a Scene, with where they start.',
		Methods: ['Track(seed, options)']
	},

	Track: function (seed, options) {
		var settings = options || {};
		var generator = this.$Service('Random').Create(String(seed === undefined ? 'track' : seed));
		var random = function () {
			return generator.Next();
		};
		var roads = this.$Service('SceneRoads');
		var length = Number(settings.Length) > 0 ? Number(settings.Length) : 2400;
		var corners = Number(settings.Corners) > 2 ? Number(settings.Corners) : 9 + Math.floor(random() * 6);
		var wild = settings.Wild === undefined ? 0.55 : Number(settings.Wild);
		var radius = length / (Math.PI * 2);
		var knots = [];
		var line;
		var total;
		var fit;
		var i;

		/* Round a middle, nearer and farther: so it never crosses itself. */
		for (i = 0; i < corners; i++) {
			var angle = (i + (random() - 0.5) * 0.5) / corners * Math.PI * 2;
			var far = radius * (1 + (random() - 0.5) * wild * 1.3);

			knots.push([Math.cos(angle) * far, Math.sin(angle) * far * (0.7 + wild * 0.2)]);
		}

		/* As long as it is asked to be. */
		line = roads.Line(knots, {Closed: true, Step: 6});
		total = line[line.length - 1].Along + Math.hypot(line[0].X - line[line.length - 1].X, line[0].Z - line[line.length - 1].Z);
		fit = length / total;
		knots = knots.map(function (knot) {
			return [Math.round(knot[0] * fit * 100) / 100, Math.round(knot[1] * fit * 100) / 100];
		});
		line = roads.Line(knots, {Closed: true, Step: 6});

		/* It starts on the middle of its longest straight. */
		var count = line.length;
		var best = 0;
		var longest = 0;
		var run = 0;

		for (i = 0; i < count * 2; i++) {
			run = Math.abs(line[i % count].Bend) < 0.05 ? run + 1 : 0;

			if (run > longest) {
				longest = run;
				best = (i - Math.floor(run / 2)) % count;
			}
		}

		var start = line[best];
		var barrier = settings.Barrier === undefined ? 'tyres' : settings.Barrier;
		var spec = {ID: settings.ID || 'track', Type: settings.Type || 'track', Closed: true, Points: knots, Marks: [{Kind: 'start', At: start.Along}]};

		if (barrier && barrier !== 'none')
			spec.Barriers = [{Side: 'both', Kind: barrier, Gap: settings.Gap === undefined ? 2 : Number(settings.Gap)}];

		var result = {Seed: seed, Spec: spec, Length: length, Start: {X: start.X, Z: start.Z, Heading: Math.atan2(start.Way[0], start.Way[1]), At: start.Along}};

		/*
		 * Scenery: a land of mountains for it to go through, its bridges and tunnels found (Structures). On its line, from its
		 * start: a mountain it goes under (a tunnel), a canyon across it (a bridge), a ridge across it (a tunnel or a deep cut),
		 * a wide valley (a viaduct); round it, mountains to look at. Sketch: {Layers} of a world for it (SceneWorld.Library).
		 */
		if (settings.Scenery) {
			var total2 = line[line.length - 1].Along + Math.hypot(line[0].X - line[line.length - 1].X, line[0].Z - line[line.length - 1].Z);
			var place = function (share) {
				var metres = (start.Along + total2 * share) % total2;

				return line.reduce(function (best, point) {
					return Math.abs(point.Along - metres) < Math.abs(best.Along - metres) ? point : best;
				});
			};
			var across = function (point, reach) {
				var side = [-point.Way[1], point.Way[0]];

				return [[point.X - side[0] * reach, point.Z - side[1] * reach], [point.X, point.Z], [point.X + side[0] * reach, point.Z + side[1] * reach]];
			};
			var mountain = place(0.22);
			var canyon = place(0.48);
			var ridge = place(0.72);
			var valley = place(0.88);
			var items = [
				{ID: 'track-mountain', Type: 'mountain', At: [mountain.X, mountain.Z], Radius: 320, Height: 160, Ridged: true},
				{ID: 'track-canyon', Type: 'canyon', Points: across(canyon, 420), Width: 70, Depth: 45},
				{ID: 'track-ridge', Type: 'ridge', Points: across(ridge, 600), Width: 160, Height: 70, Sharp: 0.5},
				{ID: 'track-valley', Type: 'valley', Points: across(valley, 700), Width: 260, Depth: 30}
			];

			/* Mountains round it, out of its way: out of the round it makes, between its corners. */
			for (i = 0; i < 6; i++) {
				var turn = (i + 0.5) / 6 * Math.PI * 2;
				var out = radius * fit * 1.85;

				items.push({ID: 'track-peak-' + i, Type: 'mountain', At: [Math.cos(turn) * out, Math.sin(turn) * out], Radius: 260 + random() * 160, Height: 160 + random() * 140, Ridged: random() > 0.5});
			}

			spec.Structures = true;
			result.Sketch = {Layers: [{ID: 'track-land', Name: 'Track land', Visible: true, Strength: 1, Items: items}]};
			result.Size = Math.ceil(radius * fit * 2.2 * 2 / 200) * 200;
		}

		return result;
	}
});
