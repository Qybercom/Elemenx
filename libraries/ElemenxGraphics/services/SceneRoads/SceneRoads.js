/*
 * SceneRoads: the roads of a scene, of any kind, and what they are made of: motorways, streets, country roads, tracks
 * of a race, paths, runways and railways. A road is a line through its points and a type: its cross-section, strips
 * from its left edge to its right one.
 *
 * - Surfaces: what a strip is made of, by name (asphalt, concrete, cobbles, paving, gravel, dirt, sand, grass, ballast,
 *   runoff, rumble, cycle, steel, wood): {Color, Rough, Metal, Grip (1 holds as dry asphalt does), Drag (0: none),
 *   Material (its pattern: a material of SceneMaterials, none: plain)}.
 *   Surface(name, surface) adds one or replaces it, Surface(name) gives it.
 * - Types: Define(name, type) adds one or replaces it, Type(name) gives it, Types() lists the names. A type is
 *   {Title, Group (road, street, path, race, air, rail), Strips: [{Kind (lane, shoulder, verge, kerb, sidewalk, median,
 *   parking, cycle, runoff, rumble, bed, ditch...), Width (m), Surface, Height (over the level of the road; a kerb,
 *   a sidewalk, the bed of a railway), Way (of a lane: 1 the way of the line, -1 back, 0 both), Left and Right (the
 *   marking of its edge: solid, dashed, double, dotted or none), Marking (its color)}], Rails ([{Offset (from the
 *   middle), Gauge (m)}]: rails on sleepers), Sleepers ({Step, Length, Surface}), Speed (km/h), Catenary (wires over
 *   it: a railway or a tram)}. Types of any Library come declared in $Provides ({SceneRoads: {Types: [...]}}).
 * - Line(points, options): a road's line made smooth and even: points [[x, z] or [x, z, y]] through which it goes
 *   (Closed: a ring), sampled every Step metres (2): [{X, Y, Z, Way [x, z], Along (metres from its start), Bend}];
 *   Height(x, z), when given, is the height of a point with none of its own; with Follow too (and no knot of a height of
 *   its own) the line keeps to the ground between its knots, smoothed over 40 m and no steeper than Grade.
 * - Class(type): air, rail, motorway (a road of 110 km/h or more) or local, for the rules of how roads meet.
 * - Grade(type): how steep a road of a type may climb (rise over run): its Grade, else by its kind and speed (a railway
 *   2.5%, a runway 1.5%, a race track 6%, a road 5% from 110 km/h, 7% from 80, 9% under, a street 10%, a path 15%).
 * - Meeting(a, b): what two roads of two types do where they cross: junction (streets and roads, at one level), crossing (a
 *   railway and a road: a level crossing), interchange (two motorways, 110 km/h or more), over (one over the other).
 * - Network(specs, junctions, options): roads that meet and their junctions ({ID, X, Y, Z, Radius, Surface, Roads, Arms
 *   [{Road, Angle, Half, Rail}], Kind (T, Y, X, star, ring, railway), Deck (a level crossing: the road at the heads of the
 *   rails), Closed (its barriers down), Under (under the ground: where roads in their tunnels meet or one ends in the
 *   tunnel of another, or told; at the level of the roads through it, a chamber cut and lined for it)}), the roads at the
 *   level of each; roads that meet one over the other get an
 *   overpass (Overpasses: false of options, none): the one over climbs by its grade to the Clearance of the other and a
 *   bridge over it, a road under an airfield or in a tunnel there goes down into a tunnel.
 * - Interchanges: where two roads meet one over the other (or one ends on a motorway) Network makes ramps between them
 *   (one-way roads of type ramp, Ramp: the ID of their interchange): stack, cloverleaf, diamond, roundabout, trumpet, by
 *   InterchangeForm(a, b, ending) or told by a junction given there of that Kind (none: no interchange); none where the
 *   crossing or a ramp's end is in a tunnel, nor of a road too short. Its result has Interchanges: [{ID, Form, X, Z, Roads,
 *   Ramps}]; Interchanges: false of options makes none.
 * - TunnelGraph(roads, junctions): the tunnels of roads as a graph of passages ({Nodes: portals and junctions under the
 *   ground, Ways}), for SceneTerrainGenerator.PassageRoute. Carves(roads, junctions): what their tunnels and chambers cut.
 * - Clearance(type): the room a road of a type needs over it (its Clearance, 5.5 m, 7 m over a railway with wires).
 * - Road(spec): a road made of {ID, Type, Points, Closed, Width (in place of the width of the type: its strips scaled),
 *   Height, Follow (false: not along the ground), Grade, Elevated ([[from, to, height]]: on a viaduct there, so high over
 *   the ground, 7), Viaducts (false: none found), Bank (8)} with its Line, its Width and its strips at their offsets
 *   ({Left, Right} from the middle). Over water (the ground under 0) a road keeps 5.5 m, on a bridge; on a bank higher
 *   than Bank it stands on a viaduct (Viaducts: false of the options of Network, none for all).
 * - Near(road, x, z, hint): {Offset (from the middle, left below 0, across the way), Far (how far the point is from
 *   the line: past an end, more than its Offset), Along (the index of the point nearest), At (the metres from its start),
 *   Way, Y (of the road there)}; hint, the Along of a moment ago, looks only round it.
 * - Under(roads, x, z, hints): what is under a point, the road on top: {Road (its ID), Strip (its kind), Surface,
 *   Height, Grip, Drag, Offset, Along} or null off every road.
 * - Sketch(roads): the lines a ground is made level under ({Type: road, Points, Width, Shoulder}).
 * - Asset(roads): the roads as a model of SceneModels (Define(name, {URL: name, Asset, Fit: false})): their strips,
 *   the sides of what is raised, the markings, the rails and sleepers.
 * - AssetOf(roads, options) is the same in a worker (Work(): the pool of its workers, made once, with the surfaces there are
 *   then): options {Ground (the options of the flat ground the piers of its bridges stand on, SceneTerrainGenerator.Flat, or
 *   the name a worker keeps them under by Share of Workers), Junctions}.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneRoads', {
	$Meta: {
		Description: 'The roads of a scene, of any kind: motorways, streets, country roads, race tracks, paths, runways and railways, their cross-sections, lines and models.',
		Methods: ['Surface(name, surface)', 'Define(name, type)', 'Type(name)', 'Types()', 'Line(points, options)', 'Road(spec)', 'Grade(type)', 'Class(type)', 'Meeting(a, b)', 'Clearance(type)', 'InterchangeForm(a, b, ending)', 'Network(specs, junctions, options)', 'JunctionAt(junctions, x, z)', 'Near(road, x, z, hint)', 'Under(roads, x, z, hints)', 'BarrierHit(roads, x, z, fromX, fromZ, hints, size)', 'FreeBarrier(spec, options)', 'Sketch(roads, junctions)', 'Carves(roads, junctions)', 'TunnelGraph(roads, junctions)', 'TunnelLamps(road)', 'Asset(roads, options)', 'AssetOf(roads, options)', 'Work()']
	},

	$OnCreate: function () {
		this.Surfaces = {};
		this.Defined = {};

		this.Library();
	},

	/* SceneRoads: surfaces and types */

	Surface: function (name, surface) {
		if (surface !== undefined) {
			this.Surfaces[name] = Object.assign({Color: [0.5, 0.5, 0.5], Rough: 0.9, Metal: 0, Grip: 1, Drag: 0}, surface);

			return this.Surfaces[name];
		}

		return this.Surfaces[name] || this.Surfaces.asphalt;
	},

	Define: function (name, type) {
		if (!name || !type || !Array.isArray(type.Strips) || !type.Strips.length)
			throw new Error('Elemenx SceneRoads: a type needs its Strips: ' + name);

		this.Defined[name] = Object.assign({Title: name, Group: 'road', Rails: [], Sleepers: null, Speed: 50, Catenary: false}, type);

		return this.Defined[name];
	},

	/* A type declared by a Service ($Provides: {SceneRoads: {Types: [...]}}) makes it first. */
	Type: function (name) {
		if (!this.Defined[name] && this.$Provide)
			this.$Provide('Types', name);

		return this.Defined[name] || null;
	},

	Types: function () {
		if (this.$Provide)
			this.$Provide('Types');

		return Object.keys(this.Defined);
	},

	/* SceneRoads: lines */

	/*
	 * The fine line of a road through its knots ([x, z, y]), part by part: parts[i] (Segments of a road) is the part from knot i to the next,
	 * 'line' (straight), 'arc' (of a circle; {Kind: 'arc', Bulge}: the metres its middle stands off the straight line, to
	 * the left above 0) or 'curve' (smooth through the knots round it); kind the one of a part not given. radii[i] rounds
	 * the corner at knot i between two straight parts by an arc of that radius, tangent to both (as far as half of each).
	 */
	Fine: function (knots, closed, step, parts, radii, kind) {
		var self = this;
		var count = knots.length;
		var parts2 = closed ? count : count - 1;
		var fine = [];
		var corners = {};
		var i;

		function knot (index) {
			if (closed)
				return knots[(index % count + count) % count];

			return knots[Math.max(0, Math.min(count - 1, index))];
		}

		function part (index) {
			var given = parts ? parts[(index % count + count) % count] : null;
			var name = given && typeof given === 'object' ? given.Kind : given;

			return {Kind: name === 'line' || name === 'arc' || name === 'curve' ? name : kind, Bulge: given && typeof given === 'object' ? Number(given.Bulge) || 0 : 0};
		}

		function lerp (a, b, t) {
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
		}

		function pieces (length) {
			return Math.max(8, Math.ceil(length / step * 4));
		}

		/* The corners rounded: where the part comes in and goes out of the arc, and the arc between, tangent to both. */
		for (i = 0; i < count; i++) {
			var radius = radii ? Number(radii[i]) || 0 : 0;
			var before = knot(i - 1);
			var at = knot(i);
			var after = knot(i + 1);

			if (radius <= 0 || !closed && (i === 0 || i === count - 1) || part(i - 1).Kind !== 'line' || part(i).Kind !== 'line') continue;

			var inLength = Math.hypot(at[0] - before[0], at[1] - before[1]);
			var outLength = Math.hypot(after[0] - at[0], after[1] - at[1]);
			var d1 = [(at[0] - before[0]) / (inLength || 1), (at[1] - before[1]) / (inLength || 1)];
			var d2 = [(after[0] - at[0]) / (outLength || 1), (after[1] - at[1]) / (outLength || 1)];
			var turn = d1[0] * d2[1] - d1[1] * d2[0];
			var angle = Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])));
			if (angle < 1e-3 || !inLength || !outLength) continue;

			/* As far along each part as the radius needs, no farther than half of it: a radius too big is made smaller. */
			var reach = Math.min(radius * Math.tan(angle / 2), inLength / 2, outLength / 2);
			var round = reach / Math.tan(angle / 2);
			var into = lerp(at, before, reach / inLength);
			var out = lerp(at, after, reach / outLength);
			var side = turn > 0 ? 1 : -1;
			var center = [into[0] - d1[1] * round * side, into[1] + d1[0] * round * side];
			var a0 = Math.atan2(into[1] - center[1], into[0] - center[0]);
			var sweep = angle * side;
			var arc = [];
			var n = pieces(round * angle);
			var j;

			for (j = 0; j < n; j++) {
				var a = a0 + sweep * j / n;

				arc.push([center[0] + Math.cos(a) * round, center[1] + Math.sin(a) * round, into[2] + (out[2] - into[2]) * j / n]);
			}

			corners[i] = {In: into, Out: out, Arc: arc};
		}

		for (i = 0; i < parts2; i++) {
			var here = part(i);
			var from = corners[i] ? corners[i].Out : knot(i);
			var end = (closed ? corners[(i + 1) % count] : corners[i + 1]) || null;
			var to = end ? end.In : knot(i + 1);
			var length = Math.hypot(to[0] - from[0], to[1] - from[1]);
			var k = pieces(length);
			var t;

			if (here.Kind === 'line') {
				for (t = 0; t < k; t++)
					fine.push(lerp(from, to, t / k));
			}
			else if (here.Kind === 'arc' && Math.abs(here.Bulge) > 1e-3) {
				append(fine, self.Arc(from, to, here.Bulge, k));
			}
			else if (here.Kind === 'arc') {
				for (t = 0; t < k; t++)
					fine.push(lerp(from, to, t / k));
			}
			else {
				for (t = 0; t < k; t++) {
					fine.push([0, 1, 2].map(function (axis) {
						return self.Curve(knot(i - 1)[axis], knot(i)[axis], knot(i + 1)[axis], knot(i + 2)[axis], t / k);
					}));
				}
			}

			if (end)
				append(fine, end.Arc);
		}

		function append (list, more) {
			more.forEach(function (one) {
				list.push(one);
			});
		}

		fine.push(closed ? fine[0].slice() : knot(count - 1).slice());

		return fine;
	},

	/* An arc from a to b ([x, z, y]) whose middle stands bulge metres off the straight line (to the left above 0): k points, a not b. */
	Arc: function (a, b, bulge, k) {
		var chord = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
		var way = [(b[0] - a[0]) / chord, (b[1] - a[1]) / chord];
		var left = [-way[1], way[0]];
		var s = Math.abs(bulge);
		var radius = (chord * chord / 4 + s * s) / (2 * s);
		var middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
		var sign = bulge > 0 ? 1 : -1;
		var center = [middle[0] - left[0] * sign * (radius - s), middle[1] - left[1] * sign * (radius - s)];
		var a0 = Math.atan2(a[1] - center[1], a[0] - center[0]);
		var a1 = Math.atan2(b[1] - center[1], b[0] - center[0]);
		var top = Math.atan2(middle[1] + left[1] * sign * s - center[1], middle[0] + left[0] * sign * s - center[0]);
		var sweep = a1 - a0;
		var made = [];
		var t;

		/* The way round that goes through its middle. */
		while (sweep > Math.PI * 2) sweep -= Math.PI * 2;

		while (sweep < -Math.PI * 2) sweep += Math.PI * 2;

		var mid = top - a0;

		while (mid > Math.PI) mid -= Math.PI * 2;

		while (mid < -Math.PI) mid += Math.PI * 2;

		if (sweep * mid < 0 || Math.abs(mid) > Math.abs(sweep))
			sweep = sweep > 0 ? sweep - Math.PI * 2 : sweep + Math.PI * 2;

		for (t = 0; t < k; t++) {
			var angle = a0 + sweep * t / k;

			made.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius, a[2] + (b[2] - a[2]) * t / k]);
		}

		return made;
	},

	/* A point of a Catmull-Rom curve between b and c. */
	Curve: function (a, b, c, d, t) {
		var tt = t * t;

		return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * tt + (3 * b - a - 3 * c + d) * tt * t);
	},

	Line: function (given, options) {
		var self = this;
		var settings = options || {};
		var closed = !!settings.Closed;
		var step = Number(settings.Step) > 0 ? Number(settings.Step) : 2;
		var height = typeof settings.Height === 'function' ? settings.Height : null;
		/* Straight: from point to point, its corners sharp (a fence, a wall); else a smooth curve through them. */
		var straight = settings.Straight === true || settings.Straight === 'true';
		var knots = (given || []).map(function (point) {
			return [Number(point[0]) || 0, Number(point[1]) || 0, point.length > 2 && point[2] !== null && point[2] !== undefined ? Number(point[2]) : null];
		});
		var count = knots.length;
		var fine = [];
		var points = [];
		var gone = 0;
		var last;
		var i;
		var t;

		if (count < 2)
			throw new Error('Elemenx SceneRoads: a line needs two points');

		/* Whether the line follows the ground between its knots (Follow, with a Height): none of them told its own height. */
		var follow = settings.Follow === true && !!height && knots.every(function (knot) {
			return knot[2] === null;
		});

		/* A knot with no height of its own takes the one of the ground, or the ones round it. */
		knots.forEach(function (knot) {
			if (knot[2] === null)
				knot[2] = height ? Math.max(0, height(knot[0], knot[1])) : 0;
		});

		/* Fine along the parts through the knots (each straight, an arc or a smooth curve), then even steps along it. */
		fine = self.Fine(knots, closed, step, settings.Segments || null, settings.Radii || null, straight ? 'line' : 'curve');

		for (i = 1; i < fine.length; i++)
			gone += Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]);

		/* The step that ends the line on its last point (on its first, of a ring): every step the same. */
		var steps = Math.max(closed ? 3 : 1, Math.round(gone / step));
		var even = gone / steps;
		var walked = 0;
		var next = 0;

		for (i = 1; i < fine.length && points.length < (closed ? steps : steps + 1); i++) {
			last = Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]);

			while (next * even <= walked + last + 1e-9 && points.length < (closed ? steps : steps + 1)) {
				t = last ? (next * even - walked) / last : 0;

				points.push({X: fine[i - 1][0] + (fine[i][0] - fine[i - 1][0]) * t, Z: fine[i - 1][1] + (fine[i][1] - fine[i - 1][1]) * t, Y: fine[i - 1][2] + (fine[i][2] - fine[i - 1][2]) * t});

				next++;
			}

			walked += last;
		}

		if (!closed && points.length < steps + 1)
			points.push({X: fine[fine.length - 1][0], Z: fine[fine.length - 1][1], Y: fine[fine.length - 1][2]});

		count = points.length;

		points.forEach(function (point, index) {
			var before = closed ? points[(index + count - 1) % count] : points[Math.max(0, index - 1)];
			var after = closed ? points[(index + 1) % count] : points[Math.min(count - 1, index + 1)];
			var size = Math.hypot(after.X - before.X, after.Z - before.Z) || 1;

			point.Way = [(after.X - before.X) / size, (after.Z - before.Z) / size];
			point.Along = index ? points[index - 1].Along + Math.hypot(point.X - points[index - 1].X, point.Z - points[index - 1].Z) : 0;
		});

		points.forEach(function (point, index) {
			var after = closed ? points[(index + 2) % count] : points[Math.min(count - 1, index + 2)];

			point.Bend = point.Way[0] * after.Way[1] - point.Way[1] * after.Way[0];
		});

		if (follow)
			self.Follow(points, height, Number(settings.Grade) > 0 ? Number(settings.Grade) : self.Grade({}), closed);

		return points;
	},

	/*
	 * A line that follows the ground between its knots: the heights of the ground under each of its points, smooth over
	 * about 40 metres, then no steeper than Grade (rise over run) either way. Regression: a street took the ground at its
	 * knots alone and went straight from one to the next, in a cut or on a bank across a hill, and two such streets crossed
	 * metres apart, one on its bank over the other. Where the ground is steeper than the grade the line keeps it, over the
	 * ground or under it: a bridge or a tunnel is found there. Over water (the ground under 0, the level of the sea: a sea, a
	 * river, a gorge down to it) it goes from bank to bank, on the straight between the dry ground of each, and never under
	 * 5.5 m, a bridge's room (Regression: a motorway ran on the sea at its level; a track went down into a canyon to its
	 * floor, and into tunnels in its walls).
	 */
	Follow: function (points, height, grade, closed) {
		var count = points.length;
		var wet = [];
		var ground = points.map(function (point) {
			var at = height(point.X, point.Z);

			wet.push(at < 0);

			return at < 0 ? 5.5 : at;
		});
		var step = count > 1 ? (points[count - 1].Along - points[0].Along) / (count - 1) || 2 : 2;
		var reach = Math.max(1, Math.round(20 / step));
		var smooth = [];
		var run;

		/* Each run over water: the straight between its banks. */
		for (run = 0; run < count; run++) {
			if (!wet[run]) continue;

			var end = run;

			while (end + 1 < count && wet[end + 1])
				end++;

			/* Its banks: the highest of the ground within 80 m of each side, the rim of a gorge, not the foot of its wall. */
			var near = Math.max(1, Math.round(80 / step));
			var before = run > 0 ? Math.max.apply(null, ground.slice(Math.max(0, run - near), run)) : null;
			var after = end + 1 < count ? Math.max.apply(null, ground.slice(end + 1, Math.min(count, end + 1 + near))) : null;

			before = before === null ? (after === null ? 5.5 : after) : before;
			after = after === null ? before : after;

			for (k = run; k <= end; k++)
				ground[k] = Math.max(5.5, before + (after - before) * (k - run + 1) / (end - run + 2));

			run = end;
		}

		var i;
		var k;
		var pass;

		for (i = 0; i < count; i++) {
			var sum = 0;
			var weight = 0;

			for (k = -reach; k <= reach; k++) {
				var at = closed ? (i + k + count) % count : Math.max(0, Math.min(count - 1, i + k));
				var w = reach + 1 - Math.abs(k);

				sum += ground[at] * w;
				weight += w;
			}

			smooth.push(sum / weight);
		}

		/*
		 * No steeper than the grade, both ways alike: its tops cut down from each side (under a hill: a tunnel), then its
		 * hollows filled up from each side (over a valley: a bridge), again till it holds (twice round a ring). Regression:
		 * one pass forth carried a hill on past its top, and the road came down the far side late, on a bank or a bridge.
		 */
		var run = step * grade;

		function limit (down) {
			var turns;
			var k;

			for (turns = 0; turns < (closed ? 2 : 1); turns++) {
				for (k = 1; k < count + (closed ? 1 : 0); k++)
					smooth[k % count] = down ? Math.min(smooth[k % count], smooth[(k - 1) % count] + run) : Math.max(smooth[k % count], smooth[(k - 1) % count] - run);

				for (k = count - 2 + (closed ? 1 : 0); k >= 0; k--)
					smooth[k] = down ? Math.min(smooth[k], smooth[(k + 1) % count] + run) : Math.max(smooth[k], smooth[(k + 1) % count] - run);
			}
		}

		/* Over water never under its room (5.5 m), however narrow the water: the smoothing and the cuts lower it no more. */
		for (pass = 0; pass < 4; pass++) {
			limit(true);

			wet.forEach(function (water, index) {
				if (water)
					smooth[index] = Math.max(smooth[index], 5.5);
			});

			limit(false);
		}

		points.forEach(function (point, index) {
			point.Y = smooth[index];
		});
	},

	/*
	 * How steep a road of a type may climb (rise over run): its Grade, or by its kind and speed: a railway 2.5%, a runway
	 * 1.5%, a race track 6%, a road 5% from 110 km/h, 7% from 80, 9% under, a street 10%, a path 15%.
	 */
	Grade: function (type) {
		var given = type || {};
		if (Number(given.Grade) > 0) return Number(given.Grade);
		if (given.Group === 'rail') return 0.025;
		if (given.Group === 'air') return 0.015;
		if (given.Group === 'race') return 0.06;
		if (given.Group === 'street') return 0.1;
		if (given.Group === 'path') return 0.15;

		return this.Class(given) === 'motorway' ? 0.05 : (given.Speed || 50) >= 80 ? 0.07 : 0.09;
	},

	/*
	 * The class of a road of a type, for the rules of how roads meet: air, rail, motorway (a road of 110 km/h or more) or
	 * local. Regression: the speed of a motorway was told in five places.
	 */
	Class: function (type) {
		var given = type || {};
		if (given.Group === 'air' || given.Group === 'rail') return given.Group;

		return given.Group === 'road' && (given.Speed || 50) >= 110 ? 'motorway' : 'local';
	},

	Road: function (spec, options) {
		var type = this.Type(spec.Type || 'road') || this.Type('road');
		var natural = type.Strips.reduce(function (sum, strip) {
			return sum + strip.Width;
		}, 0);
		var width = Number(spec.Width) > 0 ? Number(spec.Width) : natural;
		var scale = width / natural;
		var left = -width / 2;
		var strips = type.Strips.map(function (strip) {
			var made = Object.assign({}, strip, {Left: left, Right: left + strip.Width * scale});

			left = made.Right;

			return made;
		});

		var settings = options || {};
		/* Its own Grade, else the one of its type (Regression: the Grade of a road was told in its spec and never read). */
		var grade = Number(spec.Grade) > 0 ? Number(spec.Grade) : this.Grade(type);
		var road = {ID: spec.ID || '', Type: type, TypeName: spec.Type || 'road', Closed: !!spec.Closed, Width: width, Scale: scale, Strips: strips, Height: Number(spec.Height) || 0, Grade: grade, Points: this.Line(spec.Points, Object.assign({Closed: spec.Closed, Straight: spec.Straight, Segments: spec.Segments, Radii: spec.Radii, Follow: spec.Follow !== false && spec.Follow !== 'false' && !(spec.Bridges || []).length && !(spec.Tunnels || []).length, Grade: grade}, settings))};

		/* Elevated: on piers over the ground there, a viaduct. */
		if ((spec.Elevated || []).length && settings.Height)
			this.Elevate(road, spec.Elevated, settings.Height);

		road.Spans = this.Spans(road, spec, settings.Height);

		(road.Elevated || []).forEach(function (span) {
			this.Span(road, span);
		}, this);
		road.Barriers = this.Barriers(road, spec.Barriers);
		road.Beside = (spec.Along || type.Along || []).slice();
		road.Marks = (spec.Marks || []).slice();

		return road;
	},

	/*
	 * Where a road leaves the ground: bridges and tunnels, [{Kind, From, To}] in metres from its start. Given (Bridges and
	 * Tunnels: [[from, to]]), or found (Structures: true) where the road goes Clear (5) metres over the ground or Cover (8)
	 * under it, a span shorter than Shortest (12) left on the ground.
	 */
	Spans: function (road, spec, height) {
		var spans = [];
		var clear = Number(spec.Clear) > 0 ? Number(spec.Clear) : 5;
		var cover = Number(spec.Cover) > 0 ? Number(spec.Cover) : 8;
		var shortest = Number(spec.Shortest) > 0 ? Number(spec.Shortest) : 12;
		var open = null;

		[['bridge', spec.Bridges], ['tunnel', spec.Tunnels]].forEach(function (pair) {
			(pair[1] || []).forEach(function (range) {
				spans.push({Kind: pair[0], From: Math.min(range[0], range[1]), To: Math.max(range[0], range[1])});
			});
		});

		if ((spec.Structures === true || spec.Structures === 'true') && height) {
			road.Points.forEach(function (point, index) {
				var ground = Math.max(0, height(point.X, point.Z));
				var kind = point.Y - ground > clear ? 'bridge' : ground - point.Y > cover ? 'tunnel' : '';
				var last = index === road.Points.length - 1;

				if (open && (open.Kind !== kind || last)) {
					open.To = point.Along;

					if (open.To - open.From >= shortest)
						spans.push(open);

					open = null;
				}

				if (kind && !open && !last)
					open = {Kind: kind, From: point.Along};
			});
		}

		return spans.sort(function (a, b) {
			return a.From - b.From;
		});
	},

	/* The span a point of a road is in, at metres from its start: null on the ground. */
	SpanAt: function (road, metres) {
		return (road.Spans || []).filter(function (span) {
			return metres >= span.From && metres <= span.To;
		})[0] || null;
	},

	/* SceneRoads: networks */

	/*
	 * Roads that meet: Network(specs, junctions, options) makes the roads of specs (as Road) and their junctions, the ones
	 * given ([{ID, X, Z, Radius, Surface}]) and the ones found where two roads on the ground cross or one ends on another
	 * (Junctions: false of options finds none). The roads take the one level of each junction, coming to it smoothly over
	 * Blend (20) metres, and their markings stop at it. {Roads, Junctions: [{ID, X, Y, Z, Radius, Surface, Roads}]}.
	 */
	Network: function (specs, given, options) {
		var self = this;
		var settings = options || {};
		var blend = Number(settings.Blend) > 0 ? Number(settings.Blend) : 20;
		var made = (specs || []).map(function (spec) {
			return self.Road(spec, settings);
		});
		var forms = ['diamond', 'cloverleaf', 'trumpet', 'roundabout', 'stack', 'none'];
		/* A junction given of the form of an interchange (or none) is no junction: it tells the interchange there. */
		var told = (given || []).filter(function (one) {
			return forms.indexOf(one.Kind) !== -1;
		}).map(function (one, index) {
			return {ID: one.ID || 'interchange-told-' + index, X: Number(one.X) || 0, Z: Number(one.Z) || 0, Kind: one.Kind};
		});
		var junctions = (given || []).filter(function (one) {
			return forms.indexOf(one.Kind) === -1;
		}).map(function (one, index) {
			return {ID: one.ID || 'junction-' + index, X: Number(one.X) || 0, Z: Number(one.Z) || 0, Y: null, Radius: Number(one.Radius) || 0, Surface: one.Surface || 'asphalt', Roads: [], Kind: one.Kind || '', Under: one.Under === true || one.Under === 'true'};
		});

		if (settings.Junctions !== false)
			this.Crossings(made, junctions);

		/*
		 * Each junction: the roads it holds, as wide as the widest of them, at their mean level there. One under the ground
		 * (Under: found where roads in their tunnels meet, or told) holds the roads in their tunnels there, at the level of
		 * those that go through it (a road that ends in a tunnel comes to the one it ends on); one on the ground, the roads on
		 * the ground (not one in a tunnel under it).
		 */
		junctions.forEach(function (junction) {
			self.Settle(junction, made, settings, given);
		});

		/*
		 * The roads come to the level of each junction they go through; what lies in one has no paint. A road that is not a
		 * ring takes the corrections of its junctions together: level in each, from one to the next smoothly, and past its last
		 * over as long as its grade needs for the step (Blend at least). Regression: each junction pulled the road over Blend in
		 * turn, the later undoing the earlier where they were near, and a step of metres was left in 20 of them.
		 */
		made.forEach(function (road) {
			if (road.Closed) return;

			var grade = road.Grade || self.Grade(road.Type);
			var own = road.Points.map(function (point) {
				return point.Y;
			});
			var marks = junctions.filter(function (junction) {
				return junction.Roads.indexOf(road.ID) !== -1;
			}).map(function (junction) {
				var near = self.Near(road, junction.X, junction.Z);
				var level = self.LevelAt(junction, road);

				return {Junction: junction, At: near.At, Level: level, Fix: level - (near.Y - road.Height)};
			}).sort(function (a, b) {
				return a.At - b.At;
			});
			if (!marks.length) return;

			road.Points.forEach(function (point, index) {
				var before = null;
				var after = null;
				var fix = 0;
				var k;

				for (k = 0; k < marks.length; k++) {
					if (Math.abs(point.Along - marks[k].At) <= marks[k].Junction.Radius) {
						point.Y = marks[k].Level;

						return;
					}

					if (marks[k].At < point.Along) before = marks[k];
					else if (!after) after = marks[k];
				}

				if (before && after) {
					fix = before.Fix + (after.Fix - before.Fix) * self.Smooth((point.Along - before.At - before.Junction.Radius) / Math.max(1, after.At - after.Junction.Radius - before.At - before.Junction.Radius));
				}
				else {
					var one = before || after;
					var far = Math.abs(point.Along - one.At) - one.Junction.Radius;
					var reach = Math.max(blend, Math.abs(one.Fix) / grade);

					fix = one.Fix * (1 - self.Smooth(far / reach));
				}

				point.Y = own[index] + fix;
			});
		});

		made.forEach(function (road) {
			road.Points.forEach(function (point) {
				junctions.forEach(function (junction) {
					if (junction.Roads.indexOf(road.ID) !== -1 && Math.hypot(point.X - junction.X, point.Z - junction.Z) < junction.Radius)
						point.Cut = true;
				});
			});
		});

		/* A ring: each junction over Blend round it. */
		made.forEach(function (road) {
			if (!road.Closed) return;

			junctions.forEach(function (junction) {
				if (junction.Roads.indexOf(road.ID) === -1) return;

				var near = self.Near(road, junction.X, junction.Z);
				var loop = road.Closed ? road.Points[road.Points.length - 1].Along : 0;
				var level = self.LevelAt(junction, road);

				road.Points.forEach(function (point) {
					var along = Math.abs(point.Along - near.At);
					var far = loop ? Math.min(along, loop - along) : along;
					var weight = far < junction.Radius ? 1 : far < junction.Radius + blend ? 1 - self.Smooth((far - junction.Radius) / blend) : 0;
					if (weight > 0)
						point.Y += (level - point.Y) * weight;

					if (Math.hypot(point.X - junction.X, point.Z - junction.Z) < junction.Radius)
						point.Cut = true;
				});
			});
		});

		/*
		 * A road of Structures brought to the level of its junctions: its bridges and tunnels found again on its new line.
		 * Regression: they were found on its line before, and a road that ends in a tunnel came out of the hill on its way down to it.
		 */
		made.forEach(function (road, index) {
			var spec = (specs || [])[index] || {};
			if (!(spec.Structures === true || spec.Structures === 'true') || !settings.Height || !junctions.some(function (junction) {
				return junction.Roads.indexOf(road.ID) !== -1;
			})) return;

			road.Spans = self.Spans(road, spec, settings.Height);
		});

		if (settings.Overpasses !== false)
			this.Overpasses(made, specs || [], settings.Height || null);

		var interchanges = settings.Interchanges !== false ? this.Interchanges(made, junctions, told, settings).Interchanges : [];

		/* Where a road is left on a bank higher than Bank (8 m): a viaduct (Viaducts: false of its spec or of options, none). */
		if (settings.Viaducts !== false && settings.Height) {
			made.forEach(function (road, index) {
				var spec = (specs || [])[index] || {};
				if (spec.Viaducts !== false && spec.Viaducts !== 'false')
					self.Viaducts(road, settings.Height, Number(spec.Bank) > 0 ? Number(spec.Bank) : Number(settings.Bank) > 0 ? Number(settings.Bank) : 8, Number(spec.Shortest) > 0 ? Number(spec.Shortest) : 12);
			});
		}

		return {Roads: made, Junctions: junctions, Interchanges: interchanges};
	},

	/*
	 * The form of interchange two roads that meet one over the other get (or one that ends on the other, ending): stack (two
	 * motorways of 130 km/h), cloverleaf (two of a motorway, one slower), diamond (a motorway and a road of 80 km/h or more),
	 * trumpet (a road of 70 km/h or more that ends on a motorway); '' for none (an overpass alone, or a road that just ends
	 * by it). A motorway is a road of 110 km/h or more.
	 */
	InterchangeForm: function (a, b, ending) {
		var self = this;

		function motorway (type) {
			return self.Class(type) === 'motorway';
		}

		function road (type, speed) {
			return !!type && type.Group === 'road' && (type.Speed || 50) >= speed;
		}

		if (ending)
			return motorway(b) && road(a, 70) && !motorway(a) ? 'trumpet' : '';

		if (motorway(a) && motorway(b))
			return (a.Speed || 50) >= 130 && (b.Speed || 50) >= 130 ? 'stack' : 'cloverleaf';

		if (motorway(a) && road(b, 80) || motorway(b) && road(a, 80)) return 'diamond';

		return '';
	},

	/*
	 * Interchanges: where two roads meet one over the other, or one ends on the other, ramps between them by the form told
	 * (a junction given there of Kind diamond, cloverleaf, trumpet, roundabout, stack or none, within 40 m) or found
	 * (InterchangeForm). Each ramp a one-way road of type ramp (Ramp: the ID of its interchange, Structures: its bridges
	 * found), from the edge of the motorway, where it leaves it or comes onto it, to the other road: at its edge (a motorway
	 * too) or at a junction on it (diamond: one each side; roundabout: a ring each side; trumpet: one at the end of the road,
	 * cut back from the motorway). Its heights from those of the two roads, straight between. Made after the overpasses
	 * (Network), its ramps and junctions added to them. {Interchanges: [{ID, Form, X, Z, Roads, Ramps}]}.
	 */
	Interchanges: function (made, junctions, told, settings) {
		var self = this;
		var found = [];
		var count = 0;
		var roads = made.filter(function (road) {
			return !road.Ramp;
		});

		function kind (type) {
			return self.Class(type) === 'motorway' ? 3 : type.Group === 'road' ? 2 : 1;
		}

		/*
		 * The form told there, or the one found: of roads long enough for ramps alone (the main one 400 m, the other 200 m), not
		 * a short piece (a sample of a gallery).
		 */
		function formAt (x, z, auto, main, other) {
			var given = (told || []).filter(function (one) {
				return Math.hypot(one.X - x, one.Z - z) <= 40;
			})[0];
			var long = main.Points[main.Points.length - 1].Along >= 400 && other.Points[other.Points.length - 1].Along >= 200;

			return given ? {Form: given.Kind === 'none' ? '' : given.Kind, ID: given.ID} : {Form: long ? auto : '', ID: ''};
		}

		/* Once for a pair at a place: a crossing at a corner of their lines is found by two pieces of each. */
		function add (one) {
			if (!found.some(function (other) {
				return (other.A === one.A && other.B === one.B || other.A === one.B && other.B === one.A) && Math.hypot(other.X - one.X, other.Z - one.Z) < 40;
			}))
				found.push(one);
		}

		/* The point of a road at metres along it, so far aside of it (side: to the left of its way, below 0 to the right). */
		function at (road, metres, side) {
			var place = self.At(road, Math.max(0, Math.min(road.Points[road.Points.length - 1].Along, metres)));
			var left = [-place.Way[1], place.Way[0]];

			return {X: place.X + left[0] * side, Z: place.Z + left[1] * side, Y: place.Y + road.Height, Way: place.Way, Left: left};
		}

		function dot (u, v) {
			return u[0] * v[0] + u[1] * v[1];
		}

		function sign (value) {
			return value < 0 ? -1 : 1;
		}

		/*
		 * A ramp through its knots ({X, Z, Y}, or {X, Z} for a height on the straight between the knots of a height round it).
		 * Regression: between its ends alone, and a knot of a height of its own (over the motorway) made a step of a loop.
		 */
		function ramp (id, knots, end) {
			var gone = [0];
			var told = [];
			var i;

			for (i = 1; i < knots.length; i++)
				gone.push(gone[i - 1] + Math.hypot(knots[i].X - knots[i - 1].X, knots[i].Z - knots[i - 1].Z));

			knots.forEach(function (knot, index) {
				if (knot.Y !== undefined && knot.Y !== null)
					told.push(index);
			});

			var spec = {ID: id, Type: 'ramp', Viaducts: true, Points: knots.map(function (knot, index) {
				var before = told.filter(function (one) {
					return one <= index;
				}).pop();
				var after = told.filter(function (one) {
					return one >= index;
				})[0];
				var share = after === before ? 0 : (gone[index] - gone[before]) / (gone[after] - gone[before] || 1);

				return [knot.X, knot.Z, knots[before].Y + (knots[after].Y - knots[before].Y) * share];
			})};

			var road = self.Road(spec, settings);

			road.Ramp = end;

			made.push(road);

			return road;
		}

		/* A junction on a road at a point, of the ramps that end there (a ring of Radius of a roundabout). */
		function junctionOn (id, point, ring) {
			var junction = {ID: id, X: point.X, Z: point.Z, Y: null, Radius: ring ? 20 : 0, Surface: 'asphalt', Roads: [], Kind: ring ? 'ring' : '', Under: false};

			junctions.push(junction);

			return junction;
		}

		/* The places to make them: crossings of two roads that do not meet at one level, and ends of roads on others. */
		roads.forEach(function (a, first) {
			roads.forEach(function (b, second) {
				if (second <= first) return;

				var meeting = self.Meeting(a.Type, b.Type);
				if (meeting !== 'over' && meeting !== 'interchange') return;

				self.Cross(a, b).forEach(function (cross) {
					if (self.Ending(a, cross.AtA, b.Width / 2 + 4) || self.Ending(b, cross.AtB, a.Width / 2 + 4)) return;

					var main = kind(a.Type) >= kind(b.Type) ? a : b;
					var chosen = formAt(cross.X, cross.Z, self.InterchangeForm(a.Type, b.Type, false), main, main === a ? b : a);
					if (chosen.Form && chosen.Form !== 'trumpet')
						add({Form: chosen.Form, ID: chosen.ID, A: main, B: main === a ? b : a, AtA: main === a ? cross.AtA : cross.AtB, AtB: main === a ? cross.AtB : cross.AtA, X: cross.X, Z: cross.Z});
				});
			});

			if (a.Closed) return;

			[0, a.Points[a.Points.length - 1].Along].forEach(function (metres) {
				var end = self.At(a, metres);

				roads.forEach(function (b) {
					if (b === a) return;

					var near = self.Near(b, end.X, end.Z);
					var meeting = self.Meeting(a.Type, b.Type);
					var chosen;

					if (near.Far > b.Width / 2 + 4 || meeting !== 'over' && meeting !== 'interchange') return;

					chosen = formAt(end.X, end.Z, self.InterchangeForm(a.Type, b.Type, true), b, a);

					if (chosen.Form === 'trumpet')
						add({Form: 'trumpet', ID: chosen.ID, A: b, B: a, AtA: near.At, AtB: metres, X: end.X, Z: end.Z, End: metres ? 1 : -1});
				});
			});
		});

		/*
		 * None where the crossing, or a place a ramp comes onto a road or leaves it, is in a tunnel of it: the ramps would come
		 * onto it under a hill. Regression: a road over a hill that a motorway went under in a tunnel got ramps down to it. The
		 * places along the motorway of each form (metres from the crossing), and along the other road.
		 */
		var places = {diamond: [-260, 260], roundabout: [-260, 260], cloverleaf: [-260, -70, 70, 260], stack: [-430, -320, 320, 430], trumpet: [-215, -205, 98, 205]};

		found = found.filter(function (one) {
			var inTunnel = function (road, metres) {
				var span = self.SpanAt(road, metres);

				return !!span && span.Kind === 'tunnel';
			};
			var along = [0].concat(places[one.Form] || []);
			var across = one.Form === 'trumpet' ? [0] : [0].concat(places[one.Form] || []);

			return !along.some(function (metres) {
				return inTunnel(one.A, one.AtA + metres);
			}) && !across.some(function (metres) {
				return inTunnel(one.B, one.AtB + metres);
			});
		});

		found.forEach(function (one) {
			var id = one.ID || 'interchange-' + count++;
			var A = one.A;
			var B = one.B;
			var a = at(A, one.AtA, 0).Way;
			var b = at(B, one.AtB, 0).Way;
			var halfA = A.Width / 2;
			var halfB = B.Width / 2;
			var sine = Math.max(0.4, Math.abs(a[0] * b[1] - a[1] * b[0]));
			var ramps = [];
			var lasts = {};

			/* Each quadrant: sa along A, sb along B; the side of A it is on and the side of B. */
			function quadrant (sa, sb) {
				var onA = sign(dot([sb * b[0], sb * b[1]], at(A, one.AtA, 0).Left));
				var onB = sign(dot([sa * a[0], sa * a[1]], at(B, one.AtB, 0).Left));

				return {SA: sa, SB: sb, OnA: onA, OnB: onB};
			}

			var quadrants = [quadrant(1, 1), quadrant(1, -1), quadrant(-1, 1), quadrant(-1, -1)];

			if (one.Form === 'diamond' || one.Form === 'roundabout') {
				var reach = (halfA + 45) / sine;
				var ends = {};

				quadrants.forEach(function (q, index) {
					var mA = one.AtA + q.SA * 260;
					var mB = one.AtB + q.SB * reach;
					var start = at(A, mA, q.OnA * (halfA - 3));
					var bend = at(A, mA - q.SA * 70, q.OnA * (halfA + 10));
					var near = at(B, mB, q.OnB * (halfB + (one.Form === 'roundabout' ? 32 : 22)));
					var end = at(B, mB, 0);

					ramps.push(ramp(id + '-ramp-' + index, [start, {X: bend.X, Z: bend.Z}, {X: near.X, Z: near.Z}, end], id));

					ends[q.SB] = end;
				});

				Object.keys(ends).forEach(function (side) {
					lasts[side] = junctionOn(id + '-' + (side < 0 ? 'a' : 'b'), ends[side], one.Form === 'roundabout');
				});
			}
			else if (one.Form === 'cloverleaf') {
				var radius = 45;

				quadrants.forEach(function (q, index) {
					/* Its loop: round a middle in the quadrant, from the edge of A to the edge of B, three quarters of a turn. */
					var middleA = (halfB + radius + 12) / sine;
					var middleB = (halfA + radius + 12) / sine;
					var c = at(A, one.AtA, 0);
					var middle = {X: c.X + q.SA * a[0] * middleA + q.SB * b[0] * middleB, Z: c.Z + q.SA * a[1] * middleA + q.SB * b[1] * middleB};
					var from = at(A, one.AtA + q.SA * middleA, q.OnA * (halfA - 3));
					var to = at(B, one.AtB + q.SB * middleB, q.OnB * (halfB - 3));
					var start = Math.atan2(from.Z - middle.Z, from.X - middle.X);
					var stop = Math.atan2(to.Z - middle.Z, to.X - middle.X);
					var turn = stop - start;
					var knots = [from];
					var k;

					/* The long way round: three quarters of a turn, not one. */
					while (turn <= 0) turn += Math.PI * 2;

					if (turn < Math.PI)
						turn -= Math.PI * 2;

					for (k = 1; k < 10; k++) {
						var angle = start + turn * k / 10;

						knots.push({X: middle.X + Math.cos(angle) * radius, Z: middle.Z + Math.sin(angle) * radius});
					}

					knots.push(to);
					ramps.push(ramp(id + '-loop-' + index, knots, id));

					/* Its outer ramp: round the loop, from farther along A to farther along B. */
					var far = 2 * radius + 90;
					var out = Math.hypot(middle.X - c.X, middle.Z - c.Z) || 1;
					var corner = {X: middle.X + (middle.X - c.X) / out * (radius + 22), Z: middle.Z + (middle.Z - c.Z) / out * (radius + 22)};
					var outer = [at(A, one.AtA + q.SA * (far + middleA), q.OnA * (halfA - 3)), at(A, one.AtA + q.SA * (far * 0.6 + middleA), q.OnA * (halfA + 12)), corner, at(B, one.AtB + q.SB * (far * 0.6 + middleB), q.OnB * (halfB + 12)), at(B, one.AtB + q.SB * (far + middleB), q.OnB * (halfB - 3))];

					ramps.push(ramp(id + '-ramp-' + index, outer.map(function (knot, place) {
						return place === 0 || place === outer.length - 1 ? knot : {X: knot.X, Z: knot.Z};
					}), id));
				});
			}
			else if (one.Form === 'stack') {
				var top = Math.max(at(A, one.AtA, 0).Y, at(B, one.AtB, 0).Y);

				quadrants.forEach(function (q, index) {
					var c = at(A, one.AtA, 0);
					/* The higher a ramp, the farther it starts: no steeper than a ramp may climb. */
					var reach = 320 + (index === 2 ? 110 : 0);
					var start = at(A, one.AtA + q.SA * reach, q.OnA * (halfA - 3));
					var end = at(B, one.AtB + q.SB * reach, q.OnB * (halfB - 3));
					/* Two levels over the upper road: the two that turn left cross one over the other at the middle. */
					var lift = top + 7.5 * (index === 1 ? 1 : 2);
					var knots;

					/* Turning right: in its quadrant, low; turning left: over the middle on a level of its own. */
					if (index === 0 || index === 3) {
						knots = [start, {X: c.X + q.SA * a[0] * 70 + q.SB * b[0] * 70, Z: c.Z + q.SA * a[1] * 70 + q.SB * b[1] * 70}, end];
					}
					else {
						knots = [start, {X: c.X + q.SA * a[0] * 90 - q.SB * b[0] * 30, Z: c.Z + q.SA * a[1] * 90 - q.SB * b[1] * 30, Y: lift}, {X: c.X - q.SA * a[0] * 30 + q.SB * b[0] * 90, Z: c.Z - q.SA * a[1] * 30 + q.SB * b[1] * 90, Y: lift}, end];
					}

					ramps.push(ramp(id + '-ramp-' + index, knots, id));
				});
			}
			else if (one.Form === 'trumpet') {
				/* The road cut back from the motorway; its end where the ramps part. */
				var back = halfA + 150;
				var total = B.Points[B.Points.length - 1].Along;
				var keep = one.End > 0 ? total - back : back;

				B.Points = B.Points.filter(function (point) {
					return one.End > 0 ? point.Along <= keep : point.Along >= keep;
				});

				if (one.End < 0) {
					B.Points.forEach(function (point) {
						point.Along -= keep;
					});
				}

				B.Spans = (B.Spans || []).map(function (span) {
					return Object.assign({}, span, one.End < 0 ? {From: span.From - keep, To: span.To - keep} : {To: Math.min(span.To, keep)});
				}).filter(function (span) {
					return span.To > span.From && span.To > 0;
				});

				var head = at(B, one.End > 0 ? B.Points[B.Points.length - 1].Along : 0, 0);
				var c2 = at(A, one.AtA, 0);
				var nearSide = sign(dot([head.X - c2.X, head.Z - c2.Z], c2.Left));
				var over = c2.Y + 7.2;
				var loop = 40;
				var side = halfA + 14;
				var turn;

				/* A point by the motorway: u metres along it from the crossing, v aside of it, towards the road (v over 0) or away. */
				var uv = function (u, v, y) {
					var made = at(A, one.AtA + u, nearSide * v);

					return y === undefined ? {X: made.X, Z: made.Z} : {X: made.X, Z: made.Z, Y: y};
				};

				/*
				 * The loop on the far side: off the far carriageway, three quarters of a turn round a middle away from the motorway,
				 * then straight across over it, 8 m aside of the road, into the head of the road.
				 */
				var knots2 = [at(A, one.AtA + 8 - loop + 130, -nearSide * (halfA - 3)), uv(8 - loop + 55, -(halfA + 8))];

				for (turn = 0; turn <= 6; turn++) {
					var angle2 = Math.PI / 2 + Math.PI * 1.5 * turn / 6;

					knots2.push(uv(8 - loop + Math.cos(angle2) * loop, -(side + loop) + Math.sin(angle2) * loop));
				}

				knots2.push(uv(8, 0, over), uv(8, side), head);

				/* Near side: off it and onto it straight; far side, onto it: over the motorway 8 m the other side of the road, then out along it. */
				ramps.push(ramp(id + '-ramp-0', [at(A, one.AtA - 205, nearSide * (halfA - 3)), uv(-125, side), head], id));
				ramps.push(ramp(id + '-ramp-1', [head, uv(125, side), at(A, one.AtA + 205, nearSide * (halfA - 3))], id));
				ramps.push(ramp(id + '-ramp-2', [head, uv(-8, side), uv(-8, 0, over), uv(-30, -(side + 6)), uv(-115, -(halfA + 8)), at(A, one.AtA - 215, -nearSide * (halfA - 3))], id));
				ramps.push(ramp(id + '-loop-3', knots2, id));

				lasts.head = junctionOn(id + '-head', head, true);
			}

			/*
			 * A bridge of a ramp where it goes over a road of the interchange or another of its ramps (4 m over it or more), as
			 * wide as that one and 6 m on each side: they are not overpasses of the network (made before them).
			 */
			ramps.forEach(function (one) {
				[A, B].concat(ramps).forEach(function (other) {
					if (other === one) return;

					self.Cross(one, other).forEach(function (cross) {
						var high = self.At(one, cross.AtA).Y + one.Height - self.At(other, cross.AtB).Y - other.Height;
						var half = (other.Width / 2 + 6) / Math.max(0.3, cross.Sine);

						if (high >= 4)
							self.Span(one, {Kind: 'bridge', From: cross.AtA - half, To: cross.AtA + half, Over: other.ID, Clear: [[cross.AtA, (other.Width / 2 + 2) / Math.max(0.3, cross.Sine)]]});
					});
				});
			});

			/* The junctions of its ramps on the other road: made whole, the roads in them cut there. */
			Object.keys(lasts).forEach(function (key) {
				var junction = lasts[key];

				self.Settle(junction, made, settings, []);

				made.forEach(function (road) {
					if (junction.Roads.indexOf(road.ID) === -1) return;

					road.Points.forEach(function (point) {
						if (Math.hypot(point.X - junction.X, point.Z - junction.Z) < junction.Radius)
							point.Cut = true;
					});
				});
			});

			one.Ramps = ramps.map(function (road) {
				return road.ID;
			});
			one.ID = id;
		});

		return {Interchanges: found.map(function (one) {
			return {ID: one.ID, Form: one.Form, X: one.X, Z: one.Z, Roads: [one.A.ID, one.B.ID], Ramps: one.Ramps};
		})};
	},

	/*
	 * A road raised on piers (Elevated: [[from, to, height]] in metres along it, height over the ground, 7): within the
	 * range at least so high over the ground, coming up to it and down again by its grade; a viaduct over all of it that
	 * stands more than 2 m over the ground (its Elevated: spans of bridges, Viaduct). Regression: none, a road over a town
	 * or a marsh went on its ground or a bank.
	 */
	Elevate: function (road, ranges, height) {
		var self = this;
		var grade = road.Grade || this.Grade(road.Type);
		var points = road.Points;
		var ground = points.map(function (point) {
			return Math.max(0, height(point.X, point.Z));
		});

		road.Elevated = [];

		ranges.forEach(function (range) {
			var from = Math.min(Number(range[0]) || 0, Number(range[1]) || 0);
			var to = Math.max(Number(range[0]) || 0, Number(range[1]) || 0);
			var over = range.length > 2 && Number(range[2]) > 0 ? Number(range[2]) : 7;
			var start = null;
			var end = null;
			var i;

			points.forEach(function (point, index) {
				if (point.Along >= from && point.Along <= to)
					point.Y = Math.max(point.Y, ground[index] + over);
			});

			/* Up to it and down from it by its grade (90% of it): no steeper than it may climb. */
			for (i = 1; i < points.length; i++)
				points[i].Y = Math.max(points[i].Y, points[i - 1].Y - (points[i].Along - points[i - 1].Along) * grade * 0.9);

			for (i = points.length - 2; i >= 0; i--)
				points[i].Y = Math.max(points[i].Y, points[i + 1].Y - (points[i + 1].Along - points[i].Along) * grade * 0.9);

			/* Its viaduct: the run round the range where it stands more than 2 m over the ground. */
			points.forEach(function (point, index) {
				if (point.Along < from || point.Along > to) return;

				start = start === null ? index : start;
				end = index;
			});

			if (start === null) return;

			while (start > 0 && points[start - 1].Y - ground[start - 1] > 2)
				start--;

			while (end < points.length - 1 && points[end + 1].Y - ground[end + 1] > 2)
				end++;

			road.Elevated.push({Kind: 'bridge', From: points[start].Along, To: points[end].Along, Viaduct: true});
		});

		return self;
	},

	/*
	 * A viaduct where a road stands on a bank higher than bank (8 m) over the ground for shortest metres or more, out to
	 * where it is 3 m over it: a bridge of piers (Viaduct) in place of the bank; and a bridge wherever it goes over water
	 * (the ground under 0), however short. Regression: a road over a deep valley was carried on a bank tens of metres
	 * high, and one over a river on a bank through it.
	 */
	Viaducts: function (road, height, bank, shortest) {
		var self = this;
		var points = road.Points;
		var raw = points.map(function (point) {
			return height(point.X, point.Z);
		});
		var over = function (index) {
			return points[index].Y + road.Height - Math.max(0, raw[index]);
		};
		var high = function (index) {
			return (over(index) > bank || raw[index] < 0) && !self.SpanAt(road, points[index].Along);
		};
		var i = 0;

		while (i < points.length) {
			if (!high(i)) {
				i++;

				continue;
			}

			var start = i;
			var end = i;
			var wet = false;
			var k;

			while (end + 1 < points.length && high(end + 1))
				end++;

			i = end + 1;

			for (k = start; k <= end; k++)
				wet = wet || raw[k] < 0;

			if (!wet && points[end].Along - points[start].Along < shortest) continue;

			while (start > 0 && over(start - 1) > 3)
				start--;

			while (end < points.length - 1 && over(end + 1) > 3)
				end++;

			self.Span(road, {Kind: 'bridge', From: points[start].Along, To: points[end].Along, Viaduct: true});
		}
	},

	/* The level a road takes in a junction: its own, or on a level crossing the deck at the heads of the rails (not for the railway). */
	LevelAt: function (junction, road) {
		return junction.Y + (road && road.Type.Group === 'rail' ? 0 : junction.Deck || 0);
	},

	/*
	 * A junction made whole of the roads round it (Network): the roads it holds, its Radius, its level, its Arms and Kind, the
	 * Deck of a level crossing and whether its barriers are down (Closed of the junction given of that ID).
	 */
	Settle: function (junction, made, settings, given) {
		var self = this;
		var held = [];
		var widest = 0;

		made.forEach(function (road) {
			var near = self.Near(road, junction.X, junction.Z);
			var span = self.SpanAt(road, near.At);

			if (near.Far > road.Width / 2 + 1) return;

			held.push({Road: road, Near: near, Span: span});
		});

		/* Of nothing on the ground there but roads in tunnels: under it. */
		if (!junction.Under && held.length > 1 && held.every(function (one) {
			return one.Span && one.Span.Kind === 'tunnel';
		}))
			junction.Under = true;

		held = held.filter(function (one) {
			return junction.Under ? !one.Span || one.Span.Kind === 'tunnel' : !one.Span;
		});

		held.forEach(function (one) {
			junction.Roads.push(one.Road.ID);

			widest = Math.max(widest, one.Road.Width);
		});

		junction.Radius = junction.Radius || widest * 0.75 + 1;

		var through = held.filter(function (one) {
			return one.Road.Closed || one.Near.At > junction.Radius + 2 && one.Near.At < one.Road.Points[one.Road.Points.length - 1].Along - junction.Radius - 2;
		});
		var levels = (junction.Under && through.length ? through : held).map(function (one) {
			return one.Near.Y - one.Road.Height;
		});

		junction.Y = levels.length ? levels.reduce(function (sum, one) {
			return sum + one;
		}, 0) / levels.length : settings.Height ? Math.max(0, settings.Height(junction.X, junction.Z)) : 0;

		/*
		 * Its arms: each road out of it, one way for a road that ends in it, both ways for one through it ([{Road, Angle,
		 * Half}], round the junction). The kind of junction of them: T (three, two of them on one line), Y (three, none),
		 * X (four), star (more), ring (a roundabout: told, or of five arms or more); railway stays as found.
		 */
		junction.Arms = [];

		made.forEach(function (road) {
			if (junction.Roads.indexOf(road.ID) === -1) return;

			var near = self.Near(road, junction.X, junction.Z);
			var last = road.Points[road.Points.length - 1].Along;
			var angle = Math.atan2(near.Way[1], near.Way[0]);

			var rail = road.Type.Group === 'rail';

			if (road.Closed || near.At > junction.Radius + 2)
				junction.Arms.push({Road: road.ID, Angle: angle + Math.PI, Half: road.Width / 2, Rail: rail});

			if (road.Closed || near.At < last - junction.Radius - 2)
				junction.Arms.push({Road: road.ID, Angle: angle, Half: road.Width / 2, Rail: rail});
		});

		junction.Arms.forEach(function (arm) {
			arm.Angle = Math.atan2(Math.sin(arm.Angle), Math.cos(arm.Angle));
		});
		junction.Arms.sort(function (a, b) {
			return a.Angle - b.Angle;
		});

		if (junction.Arms.some(function (arm) {
			return arm.Rail;
		}))
			junction.Kind = 'railway';

		if (junction.Kind !== 'railway')
			junction.Kind = junction.Kind === 'ring' || junction.Arms.length >= 5 ? 'ring' : self.Shape(junction.Arms);

		/*
		 * A level crossing: its deck at the heads of the rails (the bed of the railway and its rails on it, 4.5 cm under their
		 * tops), the roads coming up to it, the railway at its own level. Regression: the road crossed at the foot of the bed,
		 * and the rails stood half a metre over it. Closed: its barriers down.
		 */
		junction.Deck = 0;

		if (junction.Kind === 'railway') {
			made.forEach(function (road) {
				if (junction.Roads.indexOf(road.ID) === -1 || road.Type.Group !== 'rail') return;

				var bed = road.Strips.filter(function (strip) {
					return strip.Kind === 'bed';
				})[0];

				junction.Deck = Math.max(junction.Deck, (bed ? bed.Height || 0 : 0) + (road.Type.Sleepers && road.Type.Sleepers.Length > 0 ? 0.17 : 0.012) - 0.045);
			});
		}

		junction.Closed = !!(given || []).filter(function (one) {
			return (one.ID || '') === junction.ID;
		}).map(function (one) {
			return one.Closed === true || one.Closed === 'true';
		})[0];
	},

	Smooth: function (t) {
		var x = Math.max(0, Math.min(1, t));

		return x * x * (3 - 2 * x);
	},

	/*
	 * How two roads of two types meet where they cross: junction (streets and roads, a runway and its taxiways, at one level
	 * whatever the ground: they are brought to it), crossing (a railway and a road of the ground: a level crossing with its barriers), over (one passes
	 * over the other: an airfield, two railways, a railway and a motorway, a motorway and a road of the ground), interchange
	 * (two motorways). A motorway is a road of 110 km/h or more.
	 */
	Meeting: function (a, b) {
		var pair = [this.Class(a), this.Class(b)].sort().join('+');
		if (pair === 'local+local' || pair === 'air+air') return 'junction';
		if (pair === 'local+rail') return 'crossing';
		if (pair === 'motorway+motorway') return 'interchange';

		return 'over';
	},

	/* The junctions where two roads on the ground cross, or one ends on another, added to the list when none is there yet. */
	Crossings: function (roads, junctions) {
		var self = this;

		/* Kind: railway for a level crossing of a railway and a road, empty for a junction of roads. */
		function put (x, z, kind, under) {
			var known = junctions.some(function (one) {
				return Math.hypot(one.X - x, one.Z - z) < Math.max(8, one.Radius);
			});
			if (!known)
				junctions.push({ID: 'junction-' + junctions.length, X: x, Z: z, Y: null, Radius: 0, Surface: 'asphalt', Roads: [], Kind: kind || '', Under: !!under});
		}

		/* In a tunnel at so many metres from the start of a road. */
		function tunnel (road, metres) {
			var span = self.SpanAt(road, metres);

			return !!span && span.Kind === 'tunnel';
		}

		roads.forEach(function (a, first) {
			roads.forEach(function (b, second) {
				if (second <= first) return;

				/*
				 * A crossing of two on the ground: one over the other (a bridge, a tunnel) is no junction. Two that meet at one
				 * level (Meeting: junction, crossing) do whatever their heights: they are brought to the level of the junction
				 * (Regression: two streets more than 3 m apart there met in nothing, one on its bank over the other).
				 */
				var meeting = self.Meeting(a.Type, b.Type);
				if (meeting !== 'junction' && meeting !== 'crossing') return;

				/* Both in their tunnels there: a junction under the ground (a chamber of it). */
				self.Cross(a, b).forEach(function (cross) {
					var under = tunnel(a, cross.AtA) && tunnel(b, cross.AtB);
					if (!under && (self.SpanAt(a, cross.AtA) || self.SpanAt(b, cross.AtB))) return;

					put(cross.X, cross.Z, meeting === 'crossing' ? 'railway' : '', under);
				});
			});

			/* An end of a road on another one. */
			if (a.Closed) return;

			[a.Points[0], a.Points[a.Points.length - 1]].forEach(function (end) {
				roads.forEach(function (b) {
					if (b === a) return;

					/* Of a road that meets it one over the other (a motorway): no junction; an interchange, or its end by it. */
					var meeting = self.Meeting(a.Type, b.Type);
					if (meeting !== 'junction' && meeting !== 'crossing') return;

					var near = self.Near(b, end.X, end.Z);
					/* Of one in its tunnel ending in the tunnel of the other: under the ground (a fork in a tunnel). */
					var under = tunnel(b, near.At) && tunnel(a, end === a.Points[0] ? 0 : end.Along);
					if (near.Far <= b.Width / 2 + 1 && (under || !self.SpanAt(b, near.At)))
						put(end.X - near.Way[1] * near.Offset, end.Z + near.Way[0] * near.Offset, '', under);
				});
			});
		});
	},

	/*
	 * Where the lines of two roads cross: [{X, Z, AtA, AtB (the metres from the start of each), Sine (of the angle between
	 * them)}]. Their bounds first: two that do not meet need no look at their points.
	 */
	Cross: function (a, b) {
		var found = [];
		var i;
		var j;

		function bounds (road) {
			var box = road.Bounds;
			if (box && box.Count === road.Points.length) return box;

			box = road.Bounds = {X0: Infinity, Z0: Infinity, X1: -Infinity, Z1: -Infinity, Count: road.Points.length};

			road.Points.forEach(function (point) {
				box.X0 = Math.min(box.X0, point.X);
				box.Z0 = Math.min(box.Z0, point.Z);
				box.X1 = Math.max(box.X1, point.X);
				box.Z1 = Math.max(box.Z1, point.Z);
			});

			return box;
		}

		var one = bounds(a);
		var two = bounds(b);
		if (one.X1 < two.X0 || two.X1 < one.X0 || one.Z1 < two.Z0 || two.Z1 < one.Z0) return found;

		for (i = 0; i + 1 < a.Points.length; i++) {
			for (j = 0; j + 1 < b.Points.length; j++) {
				var p = a.Points[i];
				var q = a.Points[i + 1];
				var r = b.Points[j];
				var s = b.Points[j + 1];
				var d = (q.X - p.X) * (s.Z - r.Z) - (q.Z - p.Z) * (s.X - r.X);
				var t;
				var u;

				if (!d)
					continue;

				t = ((r.X - p.X) * (s.Z - r.Z) - (r.Z - p.Z) * (s.X - r.X)) / d;
				u = ((r.X - p.X) * (q.Z - p.Z) - (r.Z - p.Z) * (q.X - p.X)) / d;

				if (t < 0 || t > 1 || u < 0 || u > 1) continue;

				found.push({X: p.X + (q.X - p.X) * t, Z: p.Z + (q.Z - p.Z) * t, AtA: p.Along + (q.Along - p.Along) * t, AtB: r.Along + (s.Along - r.Along) * u, Sine: Math.abs(d) / (Math.hypot(q.X - p.X, q.Z - p.Z) * Math.hypot(s.X - r.X, s.Z - r.Z))});
			}
		}

		return found;
	},

	/*
	 * How high a road needs the room over it to pass under another (its Clearance, or 5.5 m: a lorry; 7 m over a railway with
	 * wires), the deck of the bridge over it not counted.
	 */
	Clearance: function (type) {
		var given = type || {};
		if (Number(given.Clearance) > 0) return Number(given.Clearance);

		return given.Group === 'rail' && given.Catenary ? 7 : 5.5;
	},

	/*
	 * Two roads that meet one over the other (Meeting: over; interchange too, before its ramps): an overpass. The one to go
	 * over climbs to the clearance of the other and the deck of its bridge (1.2 m) and back, by its own grade, and a bridge
	 * span lies over the other with room on each side (its Over: the road under it). Which goes over: the one not in a tunnel
	 * there; a road over a railway, a road of the ground over a motorway, else the higher already; a road under an airfield
	 * goes down into a tunnel under it. Two roads far enough apart already only get their span. A road of Structures finds
	 * its other spans again on its new line. Regression: such roads crossed on the ground or metres apart, a motorway under
	 * a railway with 1.7 m over it.
	 */
	Overpasses: function (roads, specs, height) {
		var self = this;
		var crossings = [];
		var touched = [];

		function kind (type) {
			return self.Class(type);
		}

		roads.forEach(function (a, first) {
			roads.forEach(function (b, second) {
				if (second <= first) return;

				var meeting = self.Meeting(a.Type, b.Type);
				if (meeting !== 'over' && meeting !== 'interchange') return;

				/* A road that ends on the other does not cross it: its way onto it is a junction of an interchange. */
				self.Cross(a, b).forEach(function (cross) {
					if (self.Ending(a, cross.AtA, b.Width / 2 + 4) || self.Ending(b, cross.AtB, a.Width / 2 + 4)) return;

					crossings.push({A: a, B: b, Cross: cross});
				});
			});
		});

		roads.forEach(function (road) {
			road.Own = road.Points.map(function (point) {
				return point.Y;
			});
		});

		crossings.forEach(function (one) {
			var a = one.A;
			var b = one.B;
			var cross = one.Cross;
			var spanA = self.SpanAt(a, cross.AtA);
			var spanB = self.SpanAt(b, cross.AtB);
			var ya = self.At(a, cross.AtA).Y + a.Height;
			var yb = self.At(b, cross.AtB).Y + b.Height;
			var ka = kind(a.Type);
			var kb = kind(b.Type);
			var upper;

			if (spanA && spanA.Kind === 'tunnel') upper = b;
			else if (spanB && spanB.Kind === 'tunnel') upper = a;
			else if (ka === 'air' || kb === 'air') upper = ka === 'air' ? a : b;
			else if (ka === 'rail' && kb !== 'rail') upper = b;
			else if (kb === 'rail' && ka !== 'rail') upper = a;
			else if (ka === 'motorway' && kb === 'local') upper = b;
			else if (kb === 'motorway' && ka === 'local') upper = a;
			else upper = ya >= yb ? a : b;

			var lower = upper === a ? b : a;
			var atUpper = upper === a ? cross.AtA : cross.AtB;
			var atLower = upper === a ? cross.AtB : cross.AtA;
			var gap = upper === a ? ya - yb : yb - ya;
			var sine = Math.max(0.3, cross.Sine);
			var under = self.SpanAt(lower, atLower);
			/*
			 * Under an airfield, or in a tunnel there already: a tunnel, deep enough for its cut (7 m over the road) and a metre
			 * of ground over that. Regression: a railway out of its tunnel crossed a motorway still in its own 1.7 m over it,
			 * through its lining. Else the clearance and the deck of a bridge.
			 */
			var sinks = kind(upper.Type) === 'air' || !!under && under.Kind === 'tunnel';
			var need = sinks ? 9 : self.Clearance(lower.Type) + 1.2;

			if (sinks) {
				var down = (upper.Width / 2 + 3) / sine;

				if (gap < need)
					self.Lift(lower, atLower, gap - need, down);

				self.Span(lower, {Kind: 'tunnel', From: atLower - down, To: atLower + down, Under: upper.ID});

				touched.push(lower);

				return;
			}

			var half = (lower.Width / 2 + 6) / sine;

			if (gap < need)
				self.Lift(upper, atUpper, need - gap, half);

			self.Span(upper, {Kind: 'bridge', From: atUpper - half, To: atUpper + half, Over: lower.ID, Clear: [[atUpper, (lower.Width / 2 + 2) / sine]]});

			touched.push(upper);
		});

		/* A road of Structures: its bridges and tunnels found on its new line, with the spans of its crossings. */
		touched.forEach(function (road) {
			var spec = specs[roads.indexOf(road)] || {};
			if (!(spec.Structures === true || spec.Structures === 'true') || !height || road.Rescanned) return;

			var kept = road.Spans.filter(function (span) {
				return span.Over || span.Under;
			});

			road.Rescanned = true;
			road.Spans = [];

			self.Spans(road, spec, height).forEach(function (span) {
				self.Span(road, span);
			});

			kept.forEach(function (span) {
				self.Span(road, span);
			});
		});

		roads.forEach(function (road) {
			delete road.Own;
			delete road.Rescanned;
		});
	},

	/* Whether metres from the start of a road (not a ring) are within reach of one of its ends. */
	Ending: function (road, metres, reach) {
		return !road.Closed && (metres < reach || metres > road.Points[road.Points.length - 1].Along - reach);
	},

	/*
	 * A road raised (or lowered, fix below 0) by fix metres within half of a point at metres from its start, coming back to
	 * its line by its own grade: half again the length the step needs, the steepest of a smooth curve. Of two near, the
	 * greater keeps.
	 */
	Lift: function (road, metres, fix, half) {
		var self = this;
		var reach = Math.abs(fix) / (road.Grade || this.Grade(road.Type)) * 1.5;
		var loop = road.Closed ? road.Points[road.Points.length - 1].Along : 0;
		var own = road.Own || road.Points.map(function (point) {
			return point.Y;
		});

		road.Points.forEach(function (point, index) {
			var along = Math.abs(point.Along - metres);
			var far = (loop ? Math.min(along, loop - along) : along) - half;
			var weight = far <= 0 ? 1 : 1 - self.Smooth(far / reach);
			var y = own[index] + fix * weight;

			point.Y = fix > 0 ? Math.max(point.Y, y) : Math.min(point.Y, y);
		});
	},

	/*
	 * A span added to a road, joined to all of its kind it overlaps (taking their Over, Under, Viaduct and Clear), the spans
	 * kept in order. Regression: joined to the first alone, a long one over several left them overlapping it.
	 */
	Span: function (road, span) {
		var length = road.Points[road.Points.length - 1].Along;
		var spans = (road.Spans || []).concat([Object.assign({}, span, {From: Math.max(0, span.From), To: Math.min(length, span.To)})]);
		var joined = [];

		spans.sort(function (a, b) {
			return a.From - b.From;
		});

		spans.forEach(function (one) {
			var same = joined.filter(function (other) {
				return other.Kind === one.Kind && other.From <= one.To && one.From <= other.To;
			})[0];

			if (!same) {
				joined.push(Object.assign({}, one));

				return;
			}

			same.To = Math.max(same.To, one.To);
			same.Over = same.Over || one.Over;
			same.Under = same.Under || one.Under;
			same.Viaduct = same.Viaduct || one.Viaduct;
			same.Clear = (same.Clear || []).concat(one.Clear || []);
		});

		road.Spans = joined;
	},

	/* The junction under a point: null off them. */
	JunctionAt: function (junctions, x, z) {
		return (junctions || []).filter(function (one) {
			return Math.hypot(one.X - x, one.Z - z) <= one.Radius;
		})[0] || null;
	},

	/* The square of a junction: a disc of its surface at its level. */
	/* The kind of a junction of its arms (round it, by angle): T (three, two of them on one line), Y (three), X (four), star. */
	Shape: function (arms) {
		var count = (arms || []).length;
		var i;
		var j;

		if (count === 3) {
			for (i = 0; i < 3; i++) {
				for (j = i + 1; j < 3; j++) {
					if (Math.abs(Math.abs(Math.atan2(Math.sin(arms[i].Angle - arms[j].Angle), Math.cos(arms[i].Angle - arms[j].Angle))) - Math.PI) < 0.35) return 'T';
				}
			}

			return 'Y';
		}

		return count === 4 ? 'X' : count > 4 ? 'star' : count === 2 ? 'bend' : 'end';
	},

	/*
	 * The square of a junction at its level: of its arms, the ends of their roads at its Radius joined at each corner by a
	 * curve that bends in as a kerb does (round the corner of the two edges), so it covers the meeting of the roads and
	 * nothing past their sides; a ring, the band round its island; no arms (a junction given alone), a disc. Regression: a
	 * disc of the radius of the widest road lay over the corners of the sidewalks and the ground between the roads.
	 */
	JunctionPiece: function (junction) {
		var y = junction.Y + (junction.Deck || 0) + 0.012;
		var made = {Positions: [junction.X, y, junction.Z], Normals: [0, 1, 0], UVs: [0, 0], Indices: []};
		var arms = junction.Arms || [];
		var outline = [];
		var sides = 32;
		var i;

		if (junction.Kind === 'ring' || arms.length < 2) {
			var inner = junction.Kind === 'ring' ? this.IslandRadius(junction) : 0;

			for (i = 0; i <= sides; i++) {
				var angle = i / sides * Math.PI * 2;

				outline.push([junction.X + Math.cos(angle) * junction.Radius, junction.Z + Math.sin(angle) * junction.Radius]);
			}

			/* A band round the island: two rings of points, a quad between each pair. */
			if (inner > 0) {
				made = {Positions: [], Normals: [], UVs: [], Indices: []};

				for (i = 0; i <= sides; i++) {
					var turn = i / sides * Math.PI * 2;

					made.Positions.push(junction.X + Math.cos(turn) * junction.Radius, y, junction.Z + Math.sin(turn) * junction.Radius, junction.X + Math.cos(turn) * inner, y, junction.Z + Math.sin(turn) * inner);
					made.Normals.push(0, 1, 0, 0, 1, 0);
					made.UVs.push(Math.cos(turn) * junction.Radius / 4, Math.sin(turn) * junction.Radius / 4, Math.cos(turn) * inner / 4, Math.sin(turn) * inner / 4);

					if (i < sides)
						made.Indices.push(i * 2, i * 2 + 1, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 2);
				}

				return made;
			}
		}
		else {
			outline = this.Outline(junction).map(function (point) {
				return point.At;
			});

			outline.push(outline[0]);
		}

		outline.forEach(function (point, index) {
			made.Positions.push(point[0], y, point[1]);
			made.Normals.push(0, 1, 0);
			made.UVs.push((point[0] - junction.X) / 4, (point[1] - junction.Z) / 4);

			if (index < outline.length - 1)
				made.Indices.push(0, index + 2, index + 1);
		});

		return made;
	},

	/*
	 * The barriers of a level crossing: on each road into it (not the railway), a post on each side a metre out of the deck,
	 * its boom in red and white over half of the road when the junction is Closed, up when open; and a post of two lights
	 * beside it, with a white plate. {Red, White, Posts, Lights}: pieces of each look.
	 */
	CrossingGear: function (junction) {
		var self = this;
		var gear = {Red: [], White: [], Posts: [], Lights: []};
		var level = this.LevelAt(junction, null);

		(junction.Arms || []).forEach(function (arm) {
			if (arm.Rail) return;

			var way = [Math.cos(arm.Angle), Math.sin(arm.Angle)];
			var side = [way[1], -way[0]];
			var out = junction.Radius + 1;

			[-1, 1].forEach(function (sign) {
				var across = sign * (arm.Half + 0.6);
				var foot = [junction.X + way[0] * out + side[0] * across, junction.Z + way[1] * out + side[1] * across];
				var pieces = Math.max(2, Math.ceil(arm.Half / 0.5));
				var k;

				gear.Posts.push(self.Box([foot[0], level + 0.6, foot[1]], [0.18, 1.2, 0.18], way));

				for (k = 0; k < pieces; k++) {
					var middle = 0.25 + k * 0.5;
					var center = junction.Closed ? [foot[0] - side[0] * sign * middle, level + 1.05, foot[1] - side[1] * sign * middle] : [foot[0], level + 1.05 + middle, foot[1]];

					(k % 2 ? gear.White : gear.Red).push(self.Box(center, junction.Closed ? [0.5, 0.1, 0.1] : [0.1, 0.5, 0.1], way));
				}

				/* The lights a little further out, facing the road. */
				var light = [foot[0] + side[0] * sign * 0.6 + way[0] * 0.8, foot[1] + side[1] * sign * 0.6 + way[1] * 0.8];

				gear.Posts.push(self.Box([light[0], level + 1.4, light[1]], [0.12, 2.8, 0.12], way));
				gear.White.push(self.Box([light[0], level + 2.65, light[1]], [0.9, 0.22, 0.04], way));
				gear.Posts.push(self.Box([light[0], level + 2.05, light[1]], [0.75, 0.3, 0.06], way));

				[-0.24, 0.24].forEach(function (offset) {
					gear.Lights.push(self.Box([light[0] + side[0] * offset + way[0] * 0.05, level + 2.05, light[1] + side[1] * offset + way[1] * 0.05], [0.18, 0.18, 0.06], way));
				});
			});
		});

		return gear;
	},

	/*
	 * The outline of a junction of arms, round it: [{At [x, z], Wall}], Wall telling whether from this point to the next
	 * is a side (the kerb round a corner) or the mouth of an arm (the road out of it). Of each arm its end at the Radius,
	 * across its width, then the kerb to the next one, bent in towards their corner. Of none or one arm a circle of walls.
	 */
	Outline: function (junction) {
		var arms = junction.Arms || [];
		var outline = [];
		var i;

		function at (angle, distance, across) {
			return [junction.X + Math.cos(angle) * distance - Math.sin(angle) * across, junction.Z + Math.sin(angle) * distance + Math.cos(angle) * across];
		}

		if (arms.length < 2) {
			for (i = 0; i < 32; i++)
				outline.push({At: [junction.X + Math.cos(i / 32 * Math.PI * 2) * junction.Radius, junction.Z + Math.sin(i / 32 * Math.PI * 2) * junction.Radius], Wall: true});

			return outline;
		}

		arms.forEach(function (arm, index) {
			var next = arms[(index + 1) % arms.length];
			var gap = next.Angle - arm.Angle + (index === arms.length - 1 ? Math.PI * 2 : 0);
			var right = at(arm.Angle, junction.Radius, arm.Half);
			var left = at(next.Angle, junction.Radius, -next.Half);
			var corner = [junction.X + Math.cos(arm.Angle + gap / 2) * Math.max(arm.Half, next.Half) * 1.05, junction.Z + Math.sin(arm.Angle + gap / 2) * Math.max(arm.Half, next.Half) * 1.05];
			var k;

			outline.push({At: at(arm.Angle, junction.Radius, -arm.Half), Wall: false}, {At: right, Wall: true});

			/* The kerb round the corner: from the side of this road to the side of the next, bent in towards their corner. */
			for (k = 1; k < 8; k++) {
				var t = k / 8;

				outline.push({At: [(1 - t) * (1 - t) * right[0] + 2 * (1 - t) * t * corner[0] + t * t * left[0], (1 - t) * (1 - t) * right[1] + 2 * (1 - t) * t * corner[1] + t * t * left[1]], Wall: true});
			}
		});

		return outline;
	},

	/*
	 * The lining of a junction under the ground (Under), as the tunnels of its roads have theirs: a vault 6 m over it on its
	 * outline, and walls from the road up to it along the kerbs between its arms, none across the mouths of the arms (their
	 * tunnels go on from there). Regression: the walls of each tunnel went on across the junction, over the way of the others.
	 */
	JunctionVault: function (junction) {
		var outline = this.Outline(junction);
		var low = junction.Y;
		var high = junction.Y + 6;
		var made = {Positions: [junction.X, high, junction.Z], Normals: [0, -1, 0], UVs: [0, 0], Indices: []};
		var count = outline.length;

		outline.forEach(function (point, index) {
			made.Positions.push(point.At[0], high, point.At[1]);
			made.Normals.push(0, -1, 0);
			made.UVs.push((point.At[0] - junction.X) / 4, (point.At[1] - junction.Z) / 4);
			made.Indices.push(0, 1 + index, 1 + (index + 1) % count);
		});

		outline.forEach(function (point, index) {
			var next = outline[(index + 1) % count];
			var dx = next.At[0] - point.At[0];
			var dz = next.At[1] - point.At[1];
			var size = Math.hypot(dx, dz) || 1;
			/* Facing in: towards the middle of the junction. */
			var normal = [-dz / size, 0, dx / size];
			var at = made.Positions.length / 3;

			if (!point.Wall) return;

			if ((junction.X - point.At[0]) * normal[0] + (junction.Z - point.At[1]) * normal[2] < 0)
				normal = [-normal[0], 0, -normal[2]];

			made.Positions.push(point.At[0], low, point.At[1], next.At[0], low, next.At[1], next.At[0], high, next.At[1], point.At[0], high, point.At[1]);
			made.Normals.push(normal[0], 0, normal[2], normal[0], 0, normal[2], normal[0], 0, normal[2], normal[0], 0, normal[2]);
			made.UVs.push(0, 0, size / 4, 0, size / 4, 1.5, 0, 1.5);
			made.Indices.push(at, at + 1, at + 2, at, at + 2, at + 3);
		});

		/*
		 * A collar at the mouth of each arm, its vault and its walls on 2.2 m along it: the lining of its tunnel stops at the
		 * last point of the road out of the junction, up to a step of it away. Regression: it went on into the chamber.
		 */
		(junction.Arms || []).forEach(function (arm) {
			var way = [Math.cos(arm.Angle), Math.sin(arm.Angle)];
			var side = [-way[1], way[0]];
			var from = junction.Radius - 0.1;
			var to = junction.Radius + 2.2;

			function corner (along, across, y) {
				return [junction.X + way[0] * along + side[0] * across, y, junction.Z + way[1] * along + side[1] * across];
			}

			[[corner(from, -arm.Half, high), corner(to, -arm.Half, high), corner(to, arm.Half, high), corner(from, arm.Half, high), [0, -1, 0]], [corner(from, -arm.Half, low), corner(to, -arm.Half, low), corner(to, -arm.Half, high), corner(from, -arm.Half, high), [side[0], 0, side[1]]], [corner(from, arm.Half, low), corner(to, arm.Half, low), corner(to, arm.Half, high), corner(from, arm.Half, high), [-side[0], 0, -side[1]]]].forEach(function (quad) {
				var at = made.Positions.length / 3;

				quad.slice(0, 4).forEach(function (point) {
					made.Positions.push(point[0], point[1], point[2]);
					made.Normals.push(quad[4][0], quad[4][1], quad[4][2]);
				});

				made.UVs.push(0, 0, 0.6, 0, 0.6, 1.5, 0, 1.5);
				made.Indices.push(at, at + 1, at + 2, at, at + 2, at + 3);
			});
		});

		return made;
	},

	/* The radius of the island of a roundabout: what is left of it inside a carriageway of 7 m, 3 m at least. */
	IslandRadius: function (junction) {
		return Math.max(3, junction.Radius - 7);
	},

	/* The island of a roundabout: a disc a kerb high (15 cm), and its edge down to the road. */
	JunctionIsland: function (junction) {
		var radius = this.IslandRadius(junction);
		var top = junction.Y + 0.15;
		var made = {Positions: [junction.X, top, junction.Z], Normals: [0, 1, 0], UVs: [0, 0], Indices: []};
		var sides = 32;
		var ring = 1;
		var i;

		for (i = 0; i <= sides; i++) {
			var angle = i / sides * Math.PI * 2;

			made.Positions.push(junction.X + Math.cos(angle) * radius, top, junction.Z + Math.sin(angle) * radius);
			made.Normals.push(0, 1, 0);
			made.UVs.push(Math.cos(angle) * radius / 4, Math.sin(angle) * radius / 4);

			if (i < sides)
				made.Indices.push(0, ring + i + 1, ring + i);
		}

		/* Its kerb: the edge down to the road, facing out. */
		ring = made.Positions.length / 3;

		for (i = 0; i <= sides; i++) {
			var turn = i / sides * Math.PI * 2;

			made.Positions.push(junction.X + Math.cos(turn) * radius, top, junction.Z + Math.sin(turn) * radius, junction.X + Math.cos(turn) * radius, junction.Y, junction.Z + Math.sin(turn) * radius);
			made.Normals.push(Math.cos(turn), 0, Math.sin(turn), Math.cos(turn), 0, Math.sin(turn));
			made.UVs.push(i / 4, 0, i / 4, 0.04);

			if (i < sides)
				made.Indices.push(ring + i * 2, ring + i * 2 + 2, ring + i * 2 + 1, ring + i * 2 + 1, ring + i * 2 + 2, ring + i * 2 + 3);
		}

		return made;
	},

	/* SceneRoads: where on a road */

	Near: function (road, x, z, hint) {
		var points = road.Points;
		var count = points.length;
		var closed = road.Closed;
		var near = hint !== undefined && hint !== null;
		var best = near ? hint : 0;
		var least = Infinity;
		var offset = 0;
		var way = points[0].Way;
		var at = 0;
		var y = points[0].Y;
		var i;

		for (i = near ? -14 : 0; i < (near ? 15 : count); i++) {
			var index = near ? closed ? (hint + i + count) % count : Math.max(0, Math.min(count - 1, hint + i)) : i;
			var far = (points[index].X - x) * (points[index].X - x) + (points[index].Z - z) * (points[index].Z - z);

			if (far < least) {
				least = far;
				best = index;
			}
		}

		/* On the line between the points, not at the nearest of them: a kerb is met to the centimetre. */
		least = Infinity;
		way = points[best].Way;

		[best - 1, best].forEach(function (first) {
			var from;
			var to;
			var sx;
			var sz;
			var part;
			var px;
			var pz;
			var far;
			var wayX;
			var wayZ;
			var size;

			if (!closed && (first < 0 || first + 1 >= count)) return;

			from = points[(first + count) % count];
			to = points[(first + 1) % count];
			sx = to.X - from.X;
			sz = to.Z - from.Z;
			part = Math.max(0, Math.min(1, ((x - from.X) * sx + (z - from.Z) * sz) / (sx * sx + sz * sz || 1)));
			px = from.X + sx * part;
			pz = from.Z + sz * part;
			far = (x - px) * (x - px) + (z - pz) * (z - pz);
			wayX = from.Way[0] + (to.Way[0] - from.Way[0]) * part;
			wayZ = from.Way[1] + (to.Way[1] - from.Way[1]) * part;
			size = Math.hypot(wayX, wayZ) || 1;

			if (far < least) {
				least = far;
				way = [wayX / size, wayZ / size];
				offset = (x - px) * way[1] - (z - pz) * way[0];
				at = from.Along + Math.hypot(px - from.X, pz - from.Z);
				y = from.Y + (to.Y - from.Y) * part;
			}
		});

		return {Offset: offset, Far: Math.sqrt(least), Along: best, At: at, Way: way, Y: y + road.Height};
	},

	Under: function (roads, x, z, hints) {
		var self = this;
		var found = null;

		(roads || []).forEach(function (road, index) {
			var near;
			var strip;
			var surface;
			var height;

			if (!road || !road.Points || road.Points.length < 2 || !road.Strips.length) return;

			near = self.Near(road, x, z, hints ? hints[index] : undefined);

			if (hints)
				hints[index] = near.Along;

			if (near.Offset < road.Strips[0].Left || near.Offset > road.Strips[road.Strips.length - 1].Right) return;

			strip = road.Strips.filter(function (one) {
				return near.Offset >= one.Left && near.Offset <= one.Right;
			})[0];
			surface = self.Surface(strip.Surface);
			height = near.Y + (strip.Height || 0);

			/* Where roads lie over each other the higher one is under the wheel. */
			if (!found || height > found.Height)
				found = {Road: road.ID, Strip: strip.Kind, Surface: strip.Surface, Height: height, Grip: surface.Grip, Drag: surface.Drag, Offset: near.Offset, Along: near.Along};
		});

		return found;
	},

	/*
	 * The items of a sketch of the roads: the lines a ground is made level under, the parts of each road on the ground (none
	 * under a bridge or over a tunnel), the ground of each junction level, and the lines of things beside a road (its Along:
	 * [{Type (row, fence, hedge, wall, powerline), Side (left, right or both), Gap (metres out of its edge, 1.5), Shapes,
	 * Spacing}], street lamps, fences, hedges), sown by the scatter of a Scene.
	 */
	Sketch: function (roads, junctions) {
		var self = this;
		var items = [];

		(roads || []).filter(function (road) {
			return road.Strips.length;
		}).forEach(function (road) {
			var points = road.Points.concat(road.Closed ? [Object.assign({}, road.Points[0], {Along: road.Points[road.Points.length - 1].Along + Math.hypot(road.Points[0].X - road.Points[road.Points.length - 1].X, road.Points[0].Z - road.Points[road.Points.length - 1].Z)})] : []);
			var piece = [];

			function close () {
				if (piece.length > 1)
					/*
					 * A ramp: its ground level 3 m out of each side and on 4 m more. Regression: a ramp narrow and bent round a hill
					 * was under the coarse squares of the ground seen from afar, that went over it from the hill to its edge.
					 */
					items.push({Type: 'road', Road: road.ID, Points: piece, Width: road.Ramp ? road.Width + 6 : road.Width, Shoulder: road.Ramp ? 4 : 2});

				piece = [];
			}

			points.forEach(function (point) {
				if (self.SpanAt(road, point.Along)) {
					close();

					return;
				}

				piece.push([point.X, point.Z, point.Y + road.Height]);
			});

			close();

			(road.Beside || []).forEach(function (line) {
				var gap = line.Gap !== undefined ? Number(line.Gap) || 0 : 1.5;
				var sides = line.Side === 'left' ? [-1] : line.Side === 'right' ? [1] : [-1, 1];

				sides.forEach(function (sign) {
					var offset = sign < 0 ? road.Strips[0].Left - gap : road.Strips[road.Strips.length - 1].Right + gap;
					/* Beside the road wherever it goes, low as it may be. */
					var item = Object.assign({MinHeight: -1000}, line, {Type: line.Type || 'row', Road: road.ID, Points: points.filter(function (point) {
						return !self.SpanAt(road, point.Along);
					}).map(function (point) {
						return [point.X + point.Way[1] * offset, point.Z - point.Way[0] * offset];
					})});

					delete item.Side;
					delete item.Gap;

					if (item.Points.length > 1)
						items.push(item);
				});
			});
		});

		/* A junction: its ground level all round it, as a short piece of road as wide as it (Roads: those that meet at it). */
		(junctions || []).forEach(function (junction) {
			/* Under the ground: none (Regression: the ground of a mountain over one was levelled down to it, a pit). */
			if (junction.Under) return;

			/*
			 * A disc of its radius (a piece of no length): Regression: a piece from one side of it to the other, as wide as it,
			 * levelled the ground twice its radius out along X, over the roads coming to it there at their own heights.
			 */
			items.push({Type: 'road', Road: junction.ID, Roads: (junction.Roads || []).slice(), Points: [[junction.X - 0.01, junction.Z, junction.Y], [junction.X + 0.01, junction.Z, junction.Y]], Width: junction.Radius * 2, Shoulder: 2});
		});

		return items;
	},

	/*
	 * The barriers of a road, none unless asked for: [{Side (left, right or both), Kind (guardrail, wall, jersey, tyres, fence),
	 * Height, Gap (metres out of the edge of the road, 0.3), From and To (metres along it, all of it), Color (#rrggbb: of its
	 * rail, wall, mesh or tyres), Step (metres between its posts or tyres)}]; a barrier stops what drives into it from either
	 * side. Made into [{Kind, Offset (from the middle), Height, From, To, Color, Step}].
	 */
	Barriers: function (road, given) {
		var heights = {guardrail: 0.8, wall: 1.2, jersey: 0.9, tyres: 0.9, fence: 2};
		var made = [];
		var length = road.Points[road.Points.length - 1].Along;

		(given || []).forEach(function (barrier) {
			var kind = heights[barrier.Kind] ? barrier.Kind : 'guardrail';
			var gap = barrier.Gap !== undefined ? Number(barrier.Gap) || 0 : 0.3;
			/* A barrier of a line of its own stands on it: one. */
			var sides = !road.Strips.length || barrier.Side === 'left' ? [-1] : barrier.Side === 'right' ? [1] : [-1, 1];

			sides.forEach(function (sign) {
				var edge = !road.Strips.length ? 0 : sign < 0 ? road.Strips[0].Left - gap : road.Strips[road.Strips.length - 1].Right + gap;

				made.push({Kind: kind, Offset: edge, Height: Number(barrier.Height) > 0 ? Number(barrier.Height) : heights[kind], From: Number(barrier.From) || 0, To: barrier.To !== undefined && barrier.To !== null && barrier.To !== '' ? Number(barrier.To) : length, Color: barrier.Color || '', Step: Number(barrier.Step) > 0 ? Number(barrier.Step) : 0});
			});
		});

		return made;
	},

	/*
	 * A barrier of a line of its own, on no road: {ID, Points, Closed, Kind, Height, Color, Step} (Points as of Line; a point
	 * with no height takes the one of the ground, options.Height). A road of no strips: Under and Sketch pass it by, BarrierHit
	 * and Asset take it.
	 */
	FreeBarrier: function (spec, options) {
		var road = {ID: spec.ID || '', Type: {Rails: [], Sleepers: null, Catenary: false}, TypeName: 'barrier', Closed: !!spec.Closed, Width: 0, Scale: 1, Strips: [], Height: 0, Spans: [], Beside: [], Marks: [], Points: this.Line(spec.Points, Object.assign({Closed: spec.Closed, Straight: spec.Smooth !== true && spec.Smooth !== 'true'}, options || {}))};

		road.Barriers = this.Barriers(road, [Object.assign({}, spec, {Gap: 0})]);

		return road;
	},

	/*
	 * Whether a point (a corner of a car) went through a barrier of the roads from where it comes from (fromX, fromZ: the middle
	 * of the car): {Normal [x, z] back to its side, Depth} or null. hints as of Under.
	 */
	BarrierHit: function (roads, x, z, fromX, fromZ, hints, size) {
		var self = this;
		var hit = null;
		var thick = size || 0.25;

		(roads || []).forEach(function (road, index) {
			var near;
			var from;

			if (!road || !(road.Barriers || []).length) return;

			near = self.Near(road, x, z, hints ? hints[index] : undefined);
			from = self.Near(road, fromX, fromZ, near.Along);

			road.Barriers.forEach(function (barrier) {
				var side = from.Offset < barrier.Offset ? -1 : 1;
				var depth = (barrier.Offset - near.Offset) * side + thick;
				if (near.At < barrier.From || near.At > barrier.To || depth <= 0) return;

				/* Far beyond it is another place: a barrier holds only what is at it. */
				if (Math.abs(from.Offset - barrier.Offset) > 6) return;

				if (!hit || depth > hit.Depth)
					hit = {Normal: [near.Way[1] * side, -near.Way[0] * side], Depth: depth, Road: road.ID};
			});
		});

		return hit;
	},

	/* SceneRoads: models */

	/*
	 * The marks across a road (Marks: [{Kind, At: metres from its start}]): start, a chequered line with a gantry over it;
	 * line, a white line across; stop, a thick white line across the lanes of its way. As pieces of its model, by their looks.
	 */
	MarkPieces: function (road) {
		var self = this;
		var pieces = {};

		if (!road.Strips.length) return pieces;

		var left = road.Strips[0].Left;
		var right = road.Strips[road.Strips.length - 1].Right;
		var lanes = road.Strips.filter(function (strip) {
			return strip.Kind === 'lane';
		});
		var from = lanes.length ? lanes[0].Left : left;
		var to = lanes.length ? lanes[lanes.length - 1].Right : right;

		function put (name, piece) {
			(pieces[name] = pieces[name] || []).push(piece);
		}

		(road.Marks || []).forEach(function (mark) {
			var place = self.At(road, Number(mark.At) || 0);
			var side = [place.Way[1], -place.Way[0]];
			var y = place.Y + road.Height;

			function at (across, along) {
				return [place.X + side[0] * across + place.Way[0] * along, place.Z + side[1] * across + place.Way[1] * along];
			}

			if (mark.Kind === 'start') {
				var columns = Math.max(4, Math.round((to - from) / 1));
				var square = (to - from) / columns;
				var column;
				var row;

				for (column = 0; column < columns; column++) {
					for (row = 0; row < 2; row++) {
						var spot = at(from + (column + 0.5) * square, (row - 0.5) * square);

						put((column + row) % 2 ? 'mark-white' : 'mark-black', self.Box([spot[0], y + 0.02, spot[1]], [square, 0.02, square], place.Way));
					}
				}

				/* The gantry over it: a post at each side and a beam. */
				[left - 1, right + 1].forEach(function (across) {
					var post = at(across, 0);

					put('mark-gantry', self.Box([post[0], y + 3.5, post[1]], [0.6, 7, 0.6], place.Way));
				});

				put('mark-gantry-beam', self.Box([place.X + side[0] * (left + right) / 2, y + 7, place.Z + side[1] * (left + right) / 2], [right - left + 3, 1.3, 0.8], place.Way));

				return;
			}

			var thick = mark.Kind === 'stop' ? 0.5 : 0.25;
			var middle = at(mark.Kind === 'stop' ? (from + to) / 2 + (to - from) / 4 : (from + to) / 2, 0);

			put('mark-white', self.Box([middle[0], y + 0.02, middle[1]], [mark.Kind === 'stop' ? (to - from) / 2 : to - from, 0.02, thick], place.Way));
		});

		return pieces;
	},

	/*
	 * The barriers of a road as pieces of its model, by their kinds. height(x, z), the ground: a post or a tyre beside the road
	 * where the ground falls away goes down into it, never hangs over it.
	 */
	BarrierPieces: function (road, height) {
		var self = this;
		var pieces = {};

		function put (name, piece) {
			(pieces[name] = pieces[name] || []).push(piece);
		}

		(road.Barriers || []).forEach(function (barrier) {
			var keep = function (point, index) {
				var next = road.Points[(index + 1) % road.Points.length];

				return point.Along >= barrier.From && (index + 1 < road.Points.length ? next.Along : point.Along) <= barrier.To + 0.01;
			};
			var at;
			var o = barrier.Offset;
			var h = barrier.Height;
			var step = barrier.Step || {guardrail: 2, fence: 2.5, tyres: 0.75}[barrier.Kind];
			var tint = barrier.Color ? '#' + String(barrier.Color).replace('#', '') : '';

			/* A wall and a jersey barrier: two faces and a top; a guardrail its rail on posts; a fence its mesh on posts. */
			if (barrier.Kind === 'wall' || barrier.Kind === 'jersey') {
				var half = barrier.Kind === 'wall' ? 0.15 : 0.25;

				put('barrier-concrete' + tint, self.Side(road, o - half, h, -0.2, -1, keep));
				put('barrier-concrete' + tint, self.Side(road, o + half, h, -0.2, 1, keep));
				put('barrier-concrete' + tint, self.Band(road, o - half * 0.5, o + half * 0.5, h, keep));

				return;
			}

			if (barrier.Kind === 'guardrail')
				put('barrier-steel' + tint, self.Side(road, o, h, h - 0.32, o < 0 ? 1 : -1, keep));

			if (barrier.Kind === 'fence')
				put('barrier-fence' + tint, self.Side(road, o, h, 0.05, o < 0 ? 1 : -1, keep));

			for (at = barrier.From + step / 2; at < barrier.To; at += step) {
				var place = self.At(road, at);
				var side = [place.Way[1], -place.Way[0]];
				var y = place.Y + road.Height;

				if (barrier.Kind === 'tyres') {
					put(Math.round(at / step) % 2 ? 'barrier-tyres' : 'barrier-tyres-white' + tint, self.Box([place.X + side[0] * o, y + h / 2, place.Z + side[1] * o], [0.7, h, 0.7], place.Way));

					continue;
				}

				var px = place.X + side[0] * (o + (o < 0 ? -0.08 : 0.08));
				var pz = place.Z + side[1] * (o + (o < 0 ? -0.08 : 0.08));
				var foot = height && !self.SpanAt(road, at) ? Math.min(y, Math.max(0, height(px, pz))) - 0.3 : y;

				put(barrier.Kind === 'fence' ? 'barrier-fence-post' : 'barrier-steel', self.Box([px, (foot + y + h) / 2, pz], [0.1, y + h - foot, 0.1], place.Way));
			}
		});

		return pieces;
	},

	Typed: function (made) {
		return {Positions: new Float32Array(made.Positions), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: made.Indices};
	},

	/* A band along a road between two offsets, at a height over it; keep(point, index) leaves a step out when false. */
	Band: function (road, from, to, lift, keep) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: []};
		var points = road.Points;
		var count = points.length;
		var steps = road.Closed ? count : count - 1;
		var i;

		for (i = 0; i <= steps; i++) {
			var point = points[i % count];
			var way = point.Way;
			var y = point.Y + road.Height + lift;
			var at = made.Positions.length / 3;
			var along = road.Closed && i === count ? points[count - 1].Along + Math.hypot(points[0].X - points[count - 1].X, points[0].Z - points[count - 1].Z) : point.Along;

			made.Positions.push(point.X + way[1] * from, y, point.Z - way[0] * from, point.X + way[1] * to, y, point.Z - way[0] * to);
			made.Normals.push(0, 1, 0, 0, 1, 0);
			made.UVs.push(from / 4, along / 4, to / 4, along / 4);

			if (i < steps && (!keep || keep(point, i)))
				made.Indices.push(at, at + 2, at + 1, at + 1, at + 2, at + 3);
		}

		return made;
	},

	/* The side of what is raised over its neighbour: a wall from the road down to it, at an offset, facing out; keep as of a band. */
	Side: function (road, offset, top, bottom, out, keep) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: []};
		var points = road.Points;
		var count = points.length;
		var steps = road.Closed ? count : count - 1;
		var i;

		for (i = 0; i <= steps; i++) {
			var point = points[i % count];
			var way = point.Way;
			var x = point.X + way[1] * offset;
			var z = point.Z - way[0] * offset;
			var y = point.Y + road.Height;
			var at = made.Positions.length / 3;

			made.Positions.push(x, y + top, z, x, y + bottom, z);
			made.Normals.push(way[1] * out, 0, -way[0] * out, way[1] * out, 0, -way[0] * out);
			made.UVs.push(0, point.Along / 4, 1, point.Along / 4);

			if (i < steps && (!keep || keep(point, i))) {
				if (out > 0) made.Indices.push(at, at + 1, at + 2, at + 1, at + 3, at + 2);
				else made.Indices.push(at, at + 2, at + 1, at + 1, at + 2, at + 3);
			}
		}

		return made;
	},

	/* Many pieces made one. */
	Merged: function (list) {
		var sizes = {Positions: 0, Normals: 0, UVs: 0, Indices: 0};
		var made = {};
		var at = {Positions: 0, Normals: 0, UVs: 0, Indices: 0};

		/* As long as all of them, made at once: one by one into lists of their own length (push of a whole list overflows the stack). */
		list.forEach(function (part) {
			Object.keys(sizes).forEach(function (key) {
				sizes[key] += part[key].length;
			});
		});

		Object.keys(sizes).forEach(function (key) {
			made[key] = new Array(sizes[key]);
		});

		list.forEach(function (part) {
			var base = at.Positions / 3;

			Object.keys(sizes).forEach(function (key) {
				var source = part[key];
				var target = made[key];
				var offset = key === 'Indices' ? base : 0;
				var start = at[key];
				var i;

				for (i = 0; i < source.length; i++)
					target[start + i] = source[i] + offset;

				at[key] += source.length;
			});
		});

		return made;
	},

	/* A box of its size at a place, turned round the up by the way it faces. */
	Box: function (center, size, way) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: []};
		var side = [way[1], -way[0]];
		var faces = [[[0, 1, 0], [1, 0, 0], [0, 0, 1]], [[1, 0, 0], [0, 0, 1], [0, 1, 0]], [[-1, 0, 0], [0, 0, -1], [0, 1, 0]], [[0, 0, 1], [0, 1, 0], [1, 0, 0]], [[0, 0, -1], [1, 0, 0], [0, 1, 0]]];

		function turned (v) {
			return [side[0] * v[0] + way[0] * v[2], v[1], side[1] * v[0] + way[1] * v[2]];
		}

		faces.forEach(function (face) {
			var at = made.Positions.length / 3;
			var n = turned(face[0]);

			[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
				var local = [0, 1, 2].map(function (axis) {
					return (face[0][axis] + face[1][axis] * corner[0] + face[2][axis] * corner[1]) * size[axis] / 2;
				});
				var p = turned(local);

				made.Positions.push(center[0] + p[0], center[1] + p[1], center[2] + p[2]);
				made.Normals.push(n[0], n[1], n[2]);
				made.UVs.push(corner[0], corner[1]);
			});

			made.Indices.push(at, at + 1, at + 2, at, at + 2, at + 3);
		});

		return made;
	},

	/* The markings of the edges of the strips: lines of paint, solid, dashed, dotted or double. */
	Markings: function (road) {
		var self = this;
		var parts = [];

		road.Strips.forEach(function (strip, index) {
			[['Left', strip.Left], ['Right', strip.Right]].forEach(function (edge) {
				var kind = strip[edge[0]];
				var neighbour = road.Strips[index + (edge[0] === 'Left' ? -1 : 1)];
				var wide = 0.15 * Math.max(0.7, road.Scale);

				if (!kind || kind === 'none') return;

				/* An edge two strips share is painted once: by the one on its left. */
				if (edge[0] === 'Left' && neighbour && neighbour.Right) return;

				function dashes (on, off) {
					return function (point) {
						return point.Along % (on + off) < on;
					};
				}

				var pattern = kind === 'dashed' ? dashes(3, 6) : kind === 'dotted' ? dashes(1, 1.5) : null;
				/* No paint over a junction: its own way across is free. */
				var keep = function (point, index) {
					return !point.Cut && !road.Points[(index + 1) % road.Points.length].Cut && (!pattern || pattern(point));
				};
				var lift = (strip.Height || 0) + 0.025;

				if (kind === 'double') {
					parts.push(self.Band(road, edge[1] - wide * 1.6, edge[1] - wide * 0.6, lift, keep));
					parts.push(self.Band(road, edge[1] + wide * 0.6, edge[1] + wide * 1.6, lift, keep));
				}
				else {
					parts.push(self.Band(road, edge[1] - wide / 2, edge[1] + wide / 2, lift, keep));
				}
			});
		});

		return parts;
	},

	/* The rails of a railway and its sleepers. */
	Track: function (road) {
		var self = this;
		var rails = [];
		var sleepers = [];
		var bed = road.Strips.filter(function (strip) {
			return strip.Kind === 'bed';
		})[0];
		var top = (bed ? bed.Height || 0 : 0);
		var sleeper = road.Type.Sleepers || {Step: 0.6, Length: 2.6};
		var points = road.Points;
		var length = points[points.length - 1].Along;
		/* Rails on sleepers stand on them; the rails of a tram lie in the road, their heads at its level. */
		var head = sleeper.Length > 0 ? 0.17 : 0.012;
		var at;

		(road.Type.Rails || []).forEach(function (rail) {
			var offset = rail.Offset * road.Scale;
			var half = rail.Gauge / 2;

			[offset - half, offset + half].forEach(function (place) {
				rails.push(self.Band(road, place - 0.036, place + 0.036, top + head));
				rails.push(self.Side(road, place - 0.036, top + head, top, -1));
				rails.push(self.Side(road, place + 0.036, top + head, top, 1));
			});

			for (at = sleeper.Step / 2; sleeper.Length > 0 && at < length; at += sleeper.Step) {
				var near = self.At(road, at);

				sleepers.push(self.Box([near.X + near.Way[1] * offset, near.Y + road.Height + top + 0.06, near.Z - near.Way[0] * offset], [sleeper.Length, 0.12, 0.24], near.Way));
			}
		});

		return {Rails: rails, Sleepers: sleepers};
	},

	/*
	 * The wires over a railway or a tram (Catenary of its type, or {Step, Height} of its own): a mast at the edge about every
	 * Step (50) metres with an arm over the tracks, and a contact wire Height (5.5) metres over each track.
	 */
	Catenary: function (road) {
		var self = this;
		var given = road.Type.Catenary;
		var step = given && Number(given.Step) > 0 ? Number(given.Step) : 50;
		var high = given && Number(given.Height) > 0 ? Number(given.Height) : 5.5;
		var masts = [];
		var wires = [];
		var rails = road.Type.Rails || [];
		var edge = road.Strips[0].Left;
		var points = road.Points;
		var length = points[points.length - 1].Along;
		var far = rails.reduce(function (most, rail) {
			return Math.max(most, rail.Offset * road.Scale);
		}, edge);
		var at;

		if (!given || !rails.length)
			return {Masts: masts, Wires: wires};

		rails.forEach(function (rail) {
			var offset = rail.Offset * road.Scale;

			wires.push(self.Band(road, offset - 0.012, offset + 0.012, high));
			wires.push(self.Band(road, offset - 0.01, offset + 0.01, high + 1.1));
		});

		for (at = step / 2; at < length; at += step) {
			var place = self.At(road, at);
			var side = [place.Way[1], -place.Way[0]];
			var y = place.Y + road.Height;
			var reach = far - edge + 0.6;

			masts.push(self.Box([place.X + side[0] * edge, y + (high + 1.6) / 2, place.Z + side[1] * edge], [0.3, high + 1.6, 0.3], place.Way));
			masts.push(self.Box([place.X + side[0] * (edge + reach / 2), y + high + 1.25, place.Z + side[1] * (edge + reach / 2)], [reach, 0.12, 0.12], place.Way));
		}

		return {Masts: masts, Wires: wires};
	},

	/*
	 * What a road stands on and goes through where it leaves the ground: a bridge is a deck under it, a parapet at each edge and
	 * piers down to the ground (height(x, z): the ground, 0 without it) about every Pier (30) metres; a tunnel its walls, its
	 * vault and a portal at each end.
	 */
	Structures: function (road, height) {
		var self = this;
		var pieces = [];
		var left = road.Strips.length ? road.Strips[0].Left : 0;
		var right = road.Strips.length ? road.Strips[road.Strips.length - 1].Right : 0;

		(road.Spans || []).forEach(function (span) {
			var keep = function (point, index) {
				var next = road.Points[(index + 1) % road.Points.length];
				var end = index + 1 < road.Points.length ? next.Along : point.Along + 0.01;

				return point.Along >= span.From - 0.01 && end <= span.To + 0.01;
			};
			var at;

			if (span.Kind === 'bridge') {
				pieces.push(self.Band(road, left - 0.3, right + 0.3, -1.2, keep));
				pieces.push(self.Side(road, left - 0.3, 1, -1.2, -1, keep));
				pieces.push(self.Side(road, right + 0.3, 1, -1.2, 1, keep));
				pieces.push(self.Side(road, left, 1, 0, 1, keep));
				pieces.push(self.Side(road, right, 1, 0, -1, keep));
				pieces.push(self.Band(road, left - 0.3, left, 1, keep));
				pieces.push(self.Band(road, right, right + 0.3, 1, keep));

				/*
				 * Over a road (an overpass): an abutment at each end, as wide as the deck, none on the road under it. Regression: the
				 * one pier of a short bridge stood in its middle, on the road it crossed.
				 */
				if (span.Over) {
					[span.From, span.To].forEach(function (metres, end) {
						var place = self.At(road, metres + (end ? -0.9 : 0.9));
						var bottom = height ? Math.max(0, height(place.X, place.Z)) - 1 : place.Y - 2;
						var top = place.Y + road.Height - 0.1;
						if (top - bottom > 0.3)
							pieces.push(self.Box([place.X + place.Way[1] * (left + right) / 2, (top + bottom) / 2, place.Z - place.Way[0] * (left + right) / 2], [right - left + 0.6, top - bottom, 1.8], place.Way));
					});
				}

				/*
				 * A viaduct: piers every 25 m or so, each a cap under the deck on columns, two of a road wider than 12 m (one at
				 * a quarter of its width from each side), one of a narrower one; none on a road it goes over.
				 */
				if (span.Viaduct) {
					var count = Math.max(1, Math.round((span.To - span.From) / 25));
					var wide = right - left > 12;
					var n;

					for (n = 1; n < count; n++) {
						var along = span.From + (span.To - span.From) * n / count;
						var spot = self.At(road, along);
						var floor = height ? Math.max(0, height(spot.X, spot.Z)) - 1 : 0;
						var under = spot.Y + road.Height - 1.2;
						var middle = (left + right) / 2;

						if (under - floor < 1.5 || (span.Clear || []).some(function (clear) {
							return Math.abs(along - clear[0]) < clear[1] + 1;
						})) continue;

						pieces.push(self.Box([spot.X + spot.Way[1] * middle, under - 0.5, spot.Z - spot.Way[0] * middle], [right - left + 0.6, 1, 2.2], spot.Way));

						(wide ? [left + (right - left) / 4, right - (right - left) / 4] : [middle]).forEach(function (offset) {
							pieces.push(self.Box([spot.X + spot.Way[1] * offset, (under - 1 + floor) / 2, spot.Z - spot.Way[0] * offset], [1.6, under - 1 - floor, 1.6], spot.Way));
						});
					}

					return;
				}

				var piers = Math.max(1, Math.round((span.To - span.From) / 30));

				/* Piers under a long one, none on the roads it goes over (Clear: [[metres, half]] round each). */
				for (at = 1; at < piers || piers === 1 && at === 1; at++) {
					var metres = span.From + (span.To - span.From) * at / Math.max(2, piers);
					var place = self.At(road, metres);

					if (span.Over && (span.To - span.From < 60 || (span.Clear || []).some(function (clear) {
						return Math.abs(metres - clear[0]) < clear[1] + 1;
					}))) continue;

					var bottom = height ? Math.max(0, height(place.X, place.Z)) - 1 : 0;
					var top = place.Y + road.Height - 1.2;
					if (top - bottom > 0.5)
						pieces.push(self.Box([place.X, (top + bottom) / 2, place.Z], [Math.max(2, (right - left) * 0.55), top - bottom, 1.8], place.Way));
				}

				return;
			}

			/*
			 * A tunnel: its walls and its vault over the road, as high as a lorry needs, and the portals; none in a junction under
			 * the ground (its chamber has its own, JunctionVault), and no portal at an end in one.
			 */
			var lined = function (point, index) {
				return keep(point, index) && !point.Cut && !road.Points[(index + 1) % road.Points.length].Cut;
			};

			pieces.push(self.Side(road, left, 6, 0, 1, lined));
			pieces.push(self.Side(road, right, 6, 0, -1, lined));
			pieces.push(self.Band(road, left, right, 6, lined));

			[span.From, span.To].forEach(function (metres) {
				var nearest = road.Points.reduce(function (best, point) {
					return Math.abs(point.Along - metres) < Math.abs(best.Along - metres) ? point : best;
				});
				if (nearest.Cut) return;

				var place = self.At(road, metres);
				var side = [place.Way[1], -place.Way[0]];
				var y = place.Y + road.Height;

				[left - 0.6, right + 0.6].forEach(function (offset) {
					pieces.push(self.Box([place.X + side[0] * offset, y + 3.5, place.Z + side[1] * offset], [1.2, 7, 1.6], place.Way));
				});

				pieces.push(self.Box([place.X + side[0] * (left + right) / 2, y + 7.75, place.Z + side[1] * (left + right) / 2], [right - left + 2.4, 1.5, 1.6], place.Way));
			});
		});

		return pieces;
	},

	/* The lamps of the tunnels of a road: a row of them under the vault over its middle, every 10 metres. */
	TunnelLamps: function (road) {
		var self = this;
		var lamps = [];
		var left = road.Strips.length ? road.Strips[0].Left : 0;
		var right = road.Strips.length ? road.Strips[road.Strips.length - 1].Right : 0;

		(road.Spans || []).forEach(function (span) {
			var metres;

			if (span.Kind !== 'tunnel') return;

			for (metres = span.From + 5; metres < span.To - 2; metres += 10) {
				var place = self.At(road, metres);
				var middle = (left + right) / 2;

				lamps.push(self.Box([place.X + place.Way[1] * middle, place.Y + road.Height + 5.85, place.Z - place.Way[0] * middle], [0.35, 0.12, 1.6], place.Way));
			}
		});

		return lamps;
	},

	/*
	 * What the tunnels of roads cut out of the ground (Carves of a ground: tunnel), so a road goes into a hill through a
	 * hole of it, not along a cut open to the sky: a box round the box of its lining (walls and vault 6 m over the road, see
	 * Structures), a metre wider on each side, from a metre under the road to 7 m over it, its corners round. Regression:
	 * round bores side by side (one for each 12 m of a motorway) left the ground between them inside the lining, and a floor
	 * cut 0.2 m under the road came up through it. All of the box is cut, with no crust of earth kept: a hill lower than its
	 * vault shows the roof of the lining (Regression: a crust kept the ground over the box where the hill was low, and it hung
	 * inside the lining). On from each end by its half width, so the hole opens where the cut before it ends.
	 */
	Carves: function (roads, junctions) {
		var self = this;
		var carves = [];

		/*
		 * A junction under the ground: a chamber of it, a box as wide as it each way and as high as the tunnels, a metre under
		 * its road. Regression: the boxes of the tunnels met in it at their corners, and the ground stood between them.
		 */
		(junctions || []).forEach(function (junction) {
			if (!junction.Under) return;

			var reach = junction.Radius + 1;

			carves.push({Type: 'tunnel', Road: junction.ID, Points: [[junction.X - reach, junction.Z, junction.Y - 1 + 4], [junction.X + reach, junction.Z, junction.Y - 1 + 4]], Radius: 4, Width: reach * 2 + 2, Height: 8, Corner: 1.5});
		});

		(roads || []).forEach(function (road) {
			var left = road.Strips.length ? road.Strips[0].Left : -(road.Width || 8) / 2;
			var right = road.Strips.length ? road.Strips[road.Strips.length - 1].Right : (road.Width || 8) / 2;
			var width = Math.max(4, right - left) + 2;
			var height = 8;
			var middle = (left + right) / 2;
			var last = road.Points.length ? road.Points[road.Points.length - 1].Along : 0;

			(road.Spans || []).forEach(function (span) {
				var from;
				var to;
				var points = [];
				var metres;

				if (span.Kind !== 'tunnel') return;

				from = Math.max(0, span.From - width / 2);
				to = Math.min(last, span.To + width / 2);

				/* Every 6 metres, the last one at its very end: the axis of the box, half its height over its floor. */
				for (metres = from; metres < to + 6; metres += 6) {
					var place = self.At(road, Math.min(metres, to));

					points.push([place.X + place.Way[1] * middle, place.Z - place.Way[0] * middle, place.Y + road.Height - 1 + height / 2]);
				}

				if (points.length > 1)
					carves.push({Type: 'tunnel', Road: road.ID, Points: points, Radius: height / 2, Width: width, Height: height, Corner: 1.5});
			});
		});

		return carves;
	},

	/*
	 * The graph of the tunnels of roads, as SceneTerrainGenerator.Passages gives one (its PassageRoute finds a way through
	 * it): its Nodes, the portals of the tunnels (portal-<road>-<n>, where a tunnel opens to the sky) and the junctions under
	 * the ground (Under: their IDs), [{ID, At [x, y, z], Ways, Kind (end, bend, fork, cross), Portal (true of a portal),
	 * Road}]; its Ways, each a piece of a tunnel from a node to the next along its road, [{ID, From, To, Road, Points [[x, y,
	 * z]...] every 10 m, Length}].
	 */
	TunnelGraph: function (roads, junctions) {
		var self = this;
		var nodes = {};
		var list = [];
		var ways = [];

		function node (id, at, portal, road) {
			if (!nodes[id]) {
				nodes[id] = {ID: id, At: at, Ways: [], Kind: 'end', Portal: portal, Road: road};

				list.push(nodes[id]);
			}

			return nodes[id];
		}

		function point (road, metres) {
			var place = self.At(road, metres);

			return [place.X, place.Y + road.Height, place.Z];
		}

		(roads || []).forEach(function (road) {
			var under = (junctions || []).filter(function (junction) {
				return junction.Under && junction.Roads.indexOf(road.ID) !== -1;
			}).map(function (junction) {
				return {Junction: junction, At: self.Near(road, junction.X, junction.Z).At};
			});
			var count = 0;

			(road.Spans || []).forEach(function (span) {
				if (span.Kind !== 'tunnel') return;

				/* Its stops along it: its ends (a portal, or a junction an end lies in) and the junctions in it. */
				var stops = [span.From, span.To].map(function (metres) {
					var inside = under.filter(function (one) {
						return Math.abs(one.At - metres) <= one.Junction.Radius + 2;
					})[0];

					count++;

					return inside ? {At: inside.At, Node: node(inside.Junction.ID, [inside.Junction.X, inside.Junction.Y, inside.Junction.Z], false, '')} : {At: metres, Node: node('portal-' + road.ID + '-' + count, point(road, metres), true, road.ID)};
				});

				under.forEach(function (one) {
					if (one.At > span.From + one.Junction.Radius + 2 && one.At < span.To - one.Junction.Radius - 2)
						stops.push({At: one.At, Node: node(one.Junction.ID, [one.Junction.X, one.Junction.Y, one.Junction.Z], false, '')});
				});

				stops.sort(function (a, b) {
					return a.At - b.At;
				});

				stops.forEach(function (stop, index) {
					var next = stops[index + 1];
					var points = [];
					var metres;

					if (!next || next.Node === stop.Node) return;

					for (metres = stop.At; metres < next.At; metres += 10)
						points.push(point(road, metres));

					points.push(point(road, next.At));

					var way = {ID: road.ID + '-' + ways.length, From: stop.Node.ID, To: next.Node.ID, Road: road.ID, Points: points, Length: next.At - stop.At};

					ways.push(way);
					stop.Node.Ways.push(way.ID);
					next.Node.Ways.push(way.ID);
				});
			});
		});

		list.forEach(function (one) {
			var count = one.Ways.length;

			one.Kind = count >= 4 ? 'cross' : count === 3 ? 'fork' : count === 2 ? 'bend' : 'end';
		});

		return {Nodes: list, Ways: ways};
	},

	/* The point of a road at metres from its start. */
	At: function (road, metres) {
		var points = road.Points;
		var low = 0;
		var high = points.length - 1;
		var mid;
		var from;
		var to;
		var part;

		while (high - low > 1) {
			mid = (low + high) >> 1;

			if (points[mid].Along <= metres) low = mid;
			else high = mid;
		}

		from = points[low];
		to = points[high];
		part = Math.max(0, Math.min(1, (metres - from.Along) / ((to.Along - from.Along) || 1)));

		return {X: from.X + (to.X - from.X) * part, Y: from.Y + (to.Y - from.Y) * part, Z: from.Z + (to.Z - from.Z) * part, Way: from.Way};
	},

	Asset: function (roads, options) {
		var self = this;
		var settings = options || {};
		var materials = [];
		var meshes = [];
		var named = {};

		function material (name, surface) {
			if (named[name] === undefined) {
				named[name] = materials.length;

				materials.push({Name: name, Pattern: surface.Material || '', Along: true, BaseColor: surface.Color.concat([1]), Metallic: surface.Metal || 0, Roughness: surface.Rough, Emissive: surface.Glow || [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: true, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null});
			}

			return named[name];
		}

		var parts = {};

		function add (name, surface, piece) {
			var key = material(name, surface);

			(parts[key] = parts[key] || []).push(piece);
		}

		(roads || []).forEach(function (road) {
			/*
			 * Not inside a junction: its square lies there, and the roads stop at its edge. Regression: their strips went on
			 * through it, the sidewalks across a crossing and into a roundabout up to its island.
			 */
			var open = function (point, index) {
				return !point.Cut || !road.Points[(index + 1) % road.Points.length].Cut;
			};

			road.Strips.forEach(function (strip, index) {
				var surface = self.Surface(strip.Surface);
				var lift = strip.Height || 0;
				var before = road.Strips[index - 1];
				var after = road.Strips[index + 1];

				add(strip.Surface, surface, self.Band(road, strip.Left, strip.Right, lift + 0.005, open));

				/* What is raised over its neighbour (or over the ground at an edge) shows its side. */
				if (lift > (before ? before.Height || 0 : -0.3))
					add(strip.Surface, surface, self.Side(road, strip.Left, lift + 0.005, before ? before.Height || 0 : -0.3, -1, open));

				if (lift > (after ? after.Height || 0 : -0.3))
					add(strip.Surface, surface, self.Side(road, strip.Right, lift + 0.005, after ? after.Height || 0 : -0.3, 1, open));
			});

			self.Markings(road).forEach(function (piece) {
				add('marking', {Color: [0.92, 0.92, 0.88], Rough: 0.6}, piece);
			});

			var fenced = Object.assign(self.BarrierPieces(road, settings.Height), self.MarkPieces(road));
			var looks = {'barrier-concrete': {Color: [0.66, 0.65, 0.62], Rough: 0.9}, 'barrier-steel': {Color: [0.7, 0.72, 0.74], Rough: 0.35, Metal: 1}, 'barrier-fence': {Color: [0.3, 0.33, 0.3], Rough: 0.6, Metal: 0.6}, 'barrier-fence-post': {Color: [0.25, 0.27, 0.25], Rough: 0.6, Metal: 0.6}, 'barrier-tyres': {Color: [0.05, 0.05, 0.05], Rough: 0.95}, 'barrier-tyres-white': {Color: [0.85, 0.85, 0.85], Rough: 0.9}, 'mark-white': {Color: [0.93, 0.93, 0.93], Rough: 0.6}, 'mark-black': {Color: [0.05, 0.05, 0.06], Rough: 0.6}, 'mark-gantry': {Color: [0.2, 0.2, 0.22], Rough: 0.5, Metal: 0.6}, 'mark-gantry-beam': {Color: [0.92, 0.92, 0.95], Rough: 0.5}};

			Object.keys(fenced).forEach(function (name) {
				var base = looks[name.split('#')[0]];
				var color = name.split('#')[1];
				var look = color && color.length === 6 ? Object.assign({}, base, {Color: [0, 2, 4].map(function (at) {
					return parseInt(color.substr(at, 2), 16) / 255;
				})}) : base;

				fenced[name].forEach(function (piece) {
					add(name, look, piece);
				});
			});

			self.Structures(road, settings.Height).forEach(function (piece) {
				add('structure', self.Surface('concrete'), piece);
			});

			/*
			 * Over the vault of its tunnels, earth with grass: where a hill is lower than the vault its roof shows, covered as a
			 * cut and cover is. Regression: a long white roof of concrete lay over a low hill.
			 */
			(road.Spans || []).forEach(function (span) {
				if (span.Kind !== 'tunnel') return;

				var left = road.Strips.length ? road.Strips[0].Left : 0;
				var right = road.Strips.length ? road.Strips[road.Strips.length - 1].Right : 0;

				add('grass', self.Surface('grass'), self.Band(road, left - 0.6, right + 0.6, 6.25, function (point, index) {
					var next = road.Points[(index + 1) % road.Points.length];

					return point.Along >= span.From - 0.01 && next.Along <= span.To + 0.01 && index + 1 < road.Points.length && !point.Cut && !next.Cut;
				}));
			});

			/* The lamps of its tunnels: warm and glowing by themselves. */
			self.TunnelLamps(road).forEach(function (piece) {
				add('tunnel-lamp', {Color: [1, 0.94, 0.8], Rough: 0.4, Glow: [4, 3.4, 2.4]}, piece);
			});

			if ((road.Type.Rails || []).length) {
				var track = self.Track(road);

				track.Rails.forEach(function (piece) {
					add('steel', self.Surface('steel'), piece);
				});

				track.Sleepers.forEach(function (piece) {
					add(road.Type.Sleepers && road.Type.Sleepers.Surface || 'wood', self.Surface(road.Type.Sleepers && road.Type.Sleepers.Surface || 'wood'), piece);
				});

				var catenary = self.Catenary(road);

				catenary.Masts.forEach(function (piece) {
					add('mast', {Color: [0.42, 0.44, 0.46], Rough: 0.6, Metal: 0.8}, piece);
				});

				catenary.Wires.forEach(function (piece) {
					add('wire', {Color: [0.18, 0.15, 0.12], Rough: 0.5, Metal: 1}, piece);
				});
			}
		});

		(settings.Junctions || []).forEach(function (junction) {
			add(junction.Surface, self.Surface(junction.Surface), self.JunctionPiece(junction));

			/* A roundabout: its island in the middle, a kerb high, grass on it. */
			if (junction.Kind === 'ring')
				add('grass', self.Surface('grass'), self.JunctionIsland(junction));

			/* Under the ground: the lining of its chamber, as of the tunnels. */
			if (junction.Under)
				add('structure', self.Surface('concrete'), self.JunctionVault(junction));

			/* A level crossing: its barriers and lights on each road (lit while the barriers are down). */
			if (junction.Kind === 'railway') {
				var gear = self.CrossingGear(junction);
				var looks = {Red: {Color: [0.78, 0.08, 0.06], Rough: 0.5}, White: {Color: [0.92, 0.92, 0.9], Rough: 0.5}, Posts: {Color: [0.35, 0.36, 0.38], Rough: 0.5, Metal: 0.7}, Lights: junction.Closed ? {Color: [1, 0.15, 0.08], Rough: 0.3, Glow: [5, 0.25, 0.08]} : {Color: [0.25, 0.04, 0.03], Rough: 0.3}};

				Object.keys(looks).forEach(function (name) {
					gear[name].forEach(function (piece) {
						add('crossing-' + name.toLowerCase(), looks[name], piece);
					});
				});
			}
		});

		Object.keys(parts).forEach(function (key) {
			meshes.push({Geometry: self.Typed(self.Merged(parts[key])), Material: Number(key)});
		});

		return {
			Nodes: [{Name: 'roads', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}],
			Meshes: [meshes],
			Lights: [],
			Materials: materials,
			Images: [],
			Skins: [],
			Animations: [],
			Scene: [0]
		};
	},

	/* The model of roads made in a worker: the height of its ground of options given, or kept by the worker under a name. */
	AssetOf: function (roads, options) {
		var given = options || {};
		var ground = typeof given.Ground === 'string' ? this.$Shared(given.Ground) : given.Ground;
		var field = ground ? this.$Service('SceneTerrainGenerator').Field('Flat', ground) : null;

		return this.Asset(roads, {Junctions: given.Junctions || [], Height: field ? function (x, z) {
			return Math.max(0, field.Height(x, z));
		} : null});
	},

	/* The workers of the models of roads: all of this Service, the ground of noise for the height of their piers. */
	Work: function () {
		return this.$Service('Workers').Pool('SceneRoads', {Math: true, Noise: true, Random: true, Blueprints: true, ScenePlanet: true, SceneTerrainGenerator: true, SceneRoads: true});
	},

	/* What a worker carries of this Service besides its methods: the surfaces and the types the library defined. */
	Carried: ['Surfaces', 'Defined'],

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* SceneRoads: the library */

	Library: function () {
		var self = this;

		/* The data of a folder of its resources, in its Order, each without it. */
		function listed (folder) {
			return Elemenx.Resources('Data').filter(function (name) {
				return name.indexOf('ElemenxGraphics/' + folder + '/') === 0;
			}).map(function (name) {
				return {Name: name.substring(('ElemenxGraphics/' + folder + '/').length), Data: Elemenx.Resources('Data', name)};
			}).sort(function (a, b) {
				return (a.Data.Order || 0) - (b.Data.Order || 0);
			}).map(function (item) {
				delete item.Data.Order;

				return item;
			});
		}

		/*
		 * Its surfaces and its types: data of its resources (resources/road-surfaces and resources/road-types, named
		 * ElemenxGraphics/road-types/<name>); one an Application gives of that name takes its place.
		 */
		listed('road-surfaces').forEach(function (item) {
			self.Surface(item.Name, item.Data);
		});

		listed('road-types').forEach(function (item) {
			self.Define(item.Name, item.Data);
		});
	}
});
