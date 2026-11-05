/*
 * SceneRoads: the roads of a scene, of any kind, and what they are made of: motorways, streets, country roads, tracks
 * of a race, paths, runways and railways. A road is a line through its points and a type: its cross-section, strips
 * from its left edge to its right one.
 *
 * - Surfaces: what a strip is made of, by name (asphalt, concrete, cobbles, paving, gravel, dirt, sand, grass, ballast,
 *   runoff, rumble, cycle, steel, wood): {Color, Rough, Metal, Grip (1 holds as dry asphalt does), Drag (0: none)}.
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
 *   Height(x, z), when given, is the height of a point with none of its own.
 * - Road(spec): a road made of {ID, Type, Points, Closed, Width (in place of the width of the type: its strips scaled),
 *   Height} with its Line, its Width and its strips at their offsets ({Left, Right} from the middle).
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
		Methods: ['Surface(name, surface)', 'Define(name, type)', 'Type(name)', 'Types()', 'Line(points, options)', 'Road(spec)', 'Network(specs, junctions, options)', 'JunctionAt(junctions, x, z)', 'Near(road, x, z, hint)', 'Under(roads, x, z, hints)', 'BarrierHit(roads, x, z, fromX, fromZ, hints, size)', 'FreeBarrier(spec, options)', 'Sketch(roads, junctions)', 'Asset(roads, options)', 'AssetOf(roads, options)', 'Work()']
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

		/* A knot with no height of its own takes the one of the ground, or the ones round it. */
		knots.forEach(function (knot) {
			if (knot[2] === null)
				knot[2] = height ? height(knot[0], knot[1]) : 0;
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

		return points;
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
		var road = {ID: spec.ID || '', Type: type, TypeName: spec.Type || 'road', Closed: !!spec.Closed, Width: width, Scale: scale, Strips: strips, Height: Number(spec.Height) || 0, Points: this.Line(spec.Points, Object.assign({Closed: spec.Closed, Straight: spec.Straight, Segments: spec.Segments, Radii: spec.Radii}, settings))};

		road.Spans = this.Spans(road, spec, settings.Height);
		road.Barriers = this.Barriers(road, spec.Barriers);
		road.Beside = (spec.Along || []).slice();
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
		var junctions = (given || []).map(function (one, index) {
			return {ID: one.ID || 'junction-' + index, X: Number(one.X) || 0, Z: Number(one.Z) || 0, Y: null, Radius: Number(one.Radius) || 0, Surface: one.Surface || 'asphalt', Roads: []};
		});

		if (settings.Junctions !== false)
			this.Crossings(made, junctions);

		/* Each junction: the roads it holds, as wide as the widest of them, at their mean level there. */
		junctions.forEach(function (junction) {
			var levels = [];
			var widest = 0;

			made.forEach(function (road) {
				var near = self.Near(road, junction.X, junction.Z);
				if (near.Far > road.Width / 2 + 1 || self.SpanAt(road, near.At)) return;

				junction.Roads.push(road.ID);
				levels.push(near.Y - road.Height);

				widest = Math.max(widest, road.Width);
			});

			junction.Radius = junction.Radius || widest * 0.75 + 1;
			junction.Y = levels.length ? levels.reduce(function (sum, one) {
				return sum + one;
			}, 0) / levels.length : settings.Height ? Math.max(0, settings.Height(junction.X, junction.Z)) : 0;
		});

		/* The roads come to the level of each junction they go through; what lies in one has no paint. */
		made.forEach(function (road) {
			junctions.forEach(function (junction) {
				if (junction.Roads.indexOf(road.ID) === -1) return;

				var near = self.Near(road, junction.X, junction.Z);
				var loop = road.Closed ? road.Points[road.Points.length - 1].Along : 0;

				road.Points.forEach(function (point) {
					var along = Math.abs(point.Along - near.At);
					var far = loop ? Math.min(along, loop - along) : along;
					var weight = far < junction.Radius ? 1 : far < junction.Radius + blend ? 1 - self.Smooth((far - junction.Radius) / blend) : 0;
					if (weight > 0)
						point.Y += (junction.Y - point.Y) * weight;

					if (Math.hypot(point.X - junction.X, point.Z - junction.Z) < junction.Radius)
						point.Cut = true;
				});
			});
		});

		return {Roads: made, Junctions: junctions};
	},

	Smooth: function (t) {
		var x = Math.max(0, Math.min(1, t));

		return x * x * (3 - 2 * x);
	},

	/* The junctions where two roads on the ground cross, or one ends on another, added to the list when none is there yet. */
	Crossings: function (roads, junctions) {
		var self = this;

		function put (x, z) {
			var known = junctions.some(function (one) {
				return Math.hypot(one.X - x, one.Z - z) < Math.max(8, one.Radius);
			});
			if (!known)
				junctions.push({ID: 'junction-' + junctions.length, X: x, Z: z, Y: null, Radius: 0, Surface: 'asphalt', Roads: []});
		}

		/* The bounds of the line of each road, once: two that do not meet need no look at their points. */
		var bounds = roads.map(function (road) {
			var box = {X0: Infinity, Z0: Infinity, X1: -Infinity, Z1: -Infinity};

			road.Points.forEach(function (point) {
				box.X0 = Math.min(box.X0, point.X);
				box.Z0 = Math.min(box.Z0, point.Z);
				box.X1 = Math.max(box.X1, point.X);
				box.Z1 = Math.max(box.Z1, point.Z);
			});

			return box;
		});

		roads.forEach(function (a, first) {
			roads.forEach(function (b, second) {
				var i;
				var j;

				if (second <= first || bounds[first].X1 < bounds[second].X0 || bounds[second].X1 < bounds[first].X0 || bounds[first].Z1 < bounds[second].Z0 || bounds[second].Z1 < bounds[first].Z0) return;

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

						/* A crossing of two on the ground: one over the other (a bridge, a tunnel) is no junction. */
						if (t < 0 || t > 1 || u < 0 || u > 1) continue;
						if (self.SpanAt(a, p.Along) || self.SpanAt(b, r.Along)) continue;
						if (Math.abs(p.Y + a.Height - r.Y - b.Height) > 3) continue;

						put(p.X + (q.X - p.X) * t, p.Z + (q.Z - p.Z) * t);
					}
				}
			});

			/* An end of a road on another one. */
			if (a.Closed) return;

			[a.Points[0], a.Points[a.Points.length - 1]].forEach(function (end) {
				roads.forEach(function (b) {
					if (b === a) return;

					var near = self.Near(b, end.X, end.Z);
					if (near.Far <= b.Width / 2 + 1 && !self.SpanAt(b, near.At))
						put(end.X - near.Way[1] * near.Offset, end.Z + near.Way[0] * near.Offset);
				});
			});
		});
	},

	/* The junction under a point: null off them. */
	JunctionAt: function (junctions, x, z) {
		return (junctions || []).filter(function (one) {
			return Math.hypot(one.X - x, one.Z - z) <= one.Radius;
		})[0] || null;
	},

	/* The square of a junction: a disc of its surface at its level. */
	JunctionPiece: function (junction) {
		var made = {Positions: [junction.X, junction.Y + 0.012, junction.Z], Normals: [0, 1, 0], UVs: [0, 0], Indices: []};
		var sides = 32;
		var i;

		for (i = 0; i <= sides; i++) {
			var angle = i / sides * Math.PI * 2;

			made.Positions.push(junction.X + Math.cos(angle) * junction.Radius, junction.Y + 0.012, junction.Z + Math.sin(angle) * junction.Radius);
			made.Normals.push(0, 1, 0);
			made.UVs.push(Math.cos(angle) * junction.Radius / 4, Math.sin(angle) * junction.Radius / 4);

			if (i < sides)
				made.Indices.push(0, i + 2, i + 1);
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
					items.push({Type: 'road', Road: road.ID, Points: piece, Width: road.Width, Shoulder: 2});

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
					var item = Object.assign({}, line, {Type: line.Type || 'row', Road: road.ID, Points: points.filter(function (point) {
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

		/* A junction: its ground level all round it, as a short piece of road as wide as it. */
		(junctions || []).forEach(function (junction) {
			items.push({Type: 'road', Road: junction.ID, Points: [[junction.X - junction.Radius, junction.Z, junction.Y], [junction.X + junction.Radius, junction.Z, junction.Y]], Width: junction.Radius * 2, Shoulder: 2});
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

	/* The barriers of a road as pieces of its model, by their kinds. */
	BarrierPieces: function (road) {
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

				put(barrier.Kind === 'fence' ? 'barrier-fence-post' : 'barrier-steel', self.Box([place.X + side[0] * (o + (o < 0 ? -0.08 : 0.08)), y + h / 2, place.Z + side[1] * (o + (o < 0 ? -0.08 : 0.08))], [0.1, h, 0.1], place.Way));
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

				var piers = Math.max(1, Math.round((span.To - span.From) / 30));

				for (at = 1; at < piers || piers === 1 && at === 1; at++) {
					var place = self.At(road, span.From + (span.To - span.From) * at / Math.max(2, piers));
					var bottom = height ? Math.max(0, height(place.X, place.Z)) - 1 : 0;
					var top = place.Y + road.Height - 1.2;
					if (top - bottom > 0.5)
						pieces.push(self.Box([place.X, (top + bottom) / 2, place.Z], [Math.max(2, (right - left) * 0.55), top - bottom, 1.8], place.Way));
				}

				return;
			}

			/* A tunnel: its walls and its vault over the road, as high as a lorry needs, and the portals. */
			pieces.push(self.Side(road, left, 6, 0, 1, keep));
			pieces.push(self.Side(road, right, 6, 0, -1, keep));
			pieces.push(self.Band(road, left, right, 6, keep));

			[span.From, span.To].forEach(function (metres) {
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

				materials.push({Name: name, BaseColor: surface.Color.concat([1]), Metallic: surface.Metal || 0, Roughness: surface.Rough, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: true, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null});
			}

			return named[name];
		}

		var parts = {};

		function add (name, surface, piece) {
			var key = material(name, surface);

			(parts[key] = parts[key] || []).push(piece);
		}

		(roads || []).forEach(function (road) {
			road.Strips.forEach(function (strip, index) {
				var surface = self.Surface(strip.Surface);
				var lift = strip.Height || 0;
				var before = road.Strips[index - 1];
				var after = road.Strips[index + 1];

				add(strip.Surface, surface, self.Band(road, strip.Left, strip.Right, lift + 0.005));

				/* What is raised over its neighbour (or over the ground at an edge) shows its side. */
				if (lift > (before ? before.Height || 0 : -0.3))
					add(strip.Surface, surface, self.Side(road, strip.Left, lift + 0.005, before ? before.Height || 0 : -0.3, -1));

				if (lift > (after ? after.Height || 0 : -0.3))
					add(strip.Surface, surface, self.Side(road, strip.Right, lift + 0.005, after ? after.Height || 0 : -0.3, 1));
			});

			self.Markings(road).forEach(function (piece) {
				add('marking', {Color: [0.92, 0.92, 0.88], Rough: 0.6}, piece);
			});

			var fenced = Object.assign(self.BarrierPieces(road), self.MarkPieces(road));
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
		var self = this;

		return this.$Service('Workers').Pool('SceneRoads', {Math: ['Noise', 'SeedOffset', 'Vectors'], Noise: ['Types', 'Fractals', 'Whole', 'Post', 'Finish', 'Hash', 'Make', 'Sampler', 'Read', 'Octaves', 'Base', 'Lattice', 'Fade', 'Value', 'Gradient', 'Perlin', 'Simplex', 'Worley'], Blueprints: ['Sizes', 'Numbers', 'Cast', 'Each'], ScenePlanet: ['Kinds', 'Direction', 'LatLon', 'Make', 'Planet', 'Color', 'Sphere'], SceneTerrainGenerator: ['Smoothstep', 'Relief', 'Climate', 'ClimateOf', 'Site', 'Biomes', 'BiomeOf', 'Grassy', 'Flat', 'Volume', 'Underground', 'WayUnder', 'Volumetric', 'Sphere', 'Paint', 'Painted', 'OnRoad', 'Mesh', 'Face', 'SpherePatch', 'Field', 'Piece', 'Grid', 'Free', 'Floor', 'Sketched', 'SketchTypes', 'SketchPlaced', 'SketchChanged', 'SettlementKinds', 'SettlementDistricts', 'SettlementSizes', 'SettlementPlan'], SceneRoads: Object.keys(this).filter(function (name) {
			return name.charAt(0) !== '$' && name !== 'Work' && name !== 'Source' && name !== 'Library' && (typeof self[name] === 'function' || name === 'Surfaces' || name === 'Defined');
		})});
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* SceneRoads: the library */

	Library: function () {
		var self = this;

		function lane (way, surface, width, left, right) {
			return {Kind: 'lane', Width: width || 3.5, Surface: surface || 'asphalt', Way: way, Left: left || 'none', Right: right || 'none'};
		}

		function strip (kind, width, surface, height, more) {
			return Object.assign({Kind: kind, Width: width, Surface: surface, Height: height || 0}, more || {});
		}

		[
			['asphalt', {Color: [0.2, 0.2, 0.21], Rough: 0.88, Grip: 1, Drag: 0}],
			['concrete', {Color: [0.58, 0.57, 0.54], Rough: 0.9, Grip: 0.95, Drag: 0}],
			['cobbles', {Color: [0.42, 0.4, 0.38], Rough: 0.95, Grip: 0.8, Drag: 0.06}],
			['paving', {Color: [0.62, 0.6, 0.57], Rough: 0.92, Grip: 0.9, Drag: 0.02}],
			['gravel', {Color: [0.56, 0.51, 0.43], Rough: 1, Grip: 0.62, Drag: 0.22}],
			['dirt', {Color: [0.45, 0.36, 0.26], Rough: 1, Grip: 0.58, Drag: 0.3}],
			['sand', {Color: [0.8, 0.72, 0.52], Rough: 1, Grip: 0.42, Drag: 0.55}],
			['grass', {Color: [0.3, 0.46, 0.2], Rough: 1, Grip: 0.5, Drag: 0.45}],
			['ballast', {Color: [0.43, 0.41, 0.39], Rough: 1, Grip: 0.5, Drag: 0.4}],
			['runoff', {Color: [0.32, 0.32, 0.33], Rough: 0.85, Grip: 0.95, Drag: 0.02}],
			['rumble', {Color: [0.78, 0.16, 0.12], Rough: 0.7, Grip: 0.85, Drag: 0.04}],
			['cycle', {Color: [0.5, 0.2, 0.17], Rough: 0.9, Grip: 0.95, Drag: 0}],
			['steel', {Color: [0.55, 0.55, 0.58], Rough: 0.35, Metal: 1, Grip: 0.4, Drag: 0}],
			['wood', {Color: [0.35, 0.25, 0.17], Rough: 1, Grip: 0.6, Drag: 0.1}]
		].forEach(function (pair) {
			self.Surface(pair[0], pair[1]);
		});

		/* Roads of cars. */
		self.Define('motorway', {Title: 'Motorway', Group: 'road', Speed: 130, Strips: [strip('shoulder', 3, 'asphalt', 0, {Right: 'solid'}), lane(-1, 'asphalt', 3.75, 'none', 'dashed'), lane(-1, 'asphalt', 3.75, 'none', 'dashed'), lane(-1, 'asphalt', 3.75, 'none', 'solid'), strip('median', 3, 'concrete', 0.15), lane(1, 'asphalt', 3.75, 'solid', 'dashed'), lane(1, 'asphalt', 3.75, 'none', 'dashed'), lane(1, 'asphalt', 3.75, 'none', 'solid'), strip('shoulder', 3, 'asphalt')]});
		self.Define('highway', {Title: 'Highway', Group: 'road', Speed: 110, Strips: [strip('verge', 1.5, 'grass'), strip('shoulder', 2, 'asphalt', 0, {Right: 'solid'}), lane(-1, 'asphalt', 3.6, 'none', 'dashed'), lane(-1, 'asphalt', 3.6, 'none', 'solid'), strip('median', 4, 'grass', 0.1), lane(1, 'asphalt', 3.6, 'solid', 'dashed'), lane(1, 'asphalt', 3.6, 'none', 'solid'), strip('shoulder', 2, 'asphalt'), strip('verge', 1.5, 'grass')]});
		self.Define('road', {Title: 'Road', Group: 'road', Speed: 90, Strips: [strip('shoulder', 1, 'gravel'), lane(-1, 'asphalt', 3.5, 'solid', 'dashed'), lane(1, 'asphalt', 3.5, 'none', 'solid'), strip('shoulder', 1, 'gravel')]});
		self.Define('country', {Title: 'Country road', Group: 'road', Speed: 70, Strips: [strip('verge', 0.8, 'grass'), lane(-1, 'asphalt', 2.9), lane(1, 'asphalt', 2.9), strip('verge', 0.8, 'grass')]});
		self.Define('lane', {Title: 'One-way lane', Group: 'road', Speed: 50, Strips: [lane(1, 'asphalt', 4, 'solid', 'solid')]});

		/* Streets of towns. */
		self.Define('street', {Title: 'Street', Group: 'street', Speed: 50, Strips: [strip('sidewalk', 2.5, 'paving', 0.15), strip('kerb', 0.2, 'concrete', 0.15), strip('parking', 2.2, 'asphalt', 0, {Right: 'dotted'}), lane(-1, 'asphalt', 3.2, 'none', 'dashed'), lane(1, 'asphalt', 3.2), strip('parking', 2.2, 'asphalt', 0, {Left: 'dotted'}), strip('kerb', 0.2, 'concrete', 0.15), strip('sidewalk', 2.5, 'paving', 0.15)]});
		self.Define('avenue', {Title: 'Avenue', Group: 'street', Speed: 60, Strips: [strip('sidewalk', 4, 'paving', 0.15), strip('kerb', 0.2, 'concrete', 0.15), lane(-1, 'asphalt', 3.3, 'none', 'dashed'), lane(-1, 'asphalt', 3.3), strip('median', 5, 'grass', 0.15), lane(1, 'asphalt', 3.3, 'none', 'dashed'), lane(1, 'asphalt', 3.3), strip('kerb', 0.2, 'concrete', 0.15), strip('sidewalk', 4, 'paving', 0.15)]});
		self.Define('alley', {Title: 'Alley', Group: 'street', Speed: 20, Strips: [lane(0, 'cobbles', 4)]});
		self.Define('boulevard', {Title: 'Boulevard', Group: 'street', Speed: 50, Strips: [strip('sidewalk', 3, 'paving', 0.15), lane(-1, 'asphalt', 3.3), strip('median', 8, 'paving', 0.15), lane(1, 'asphalt', 3.3), strip('sidewalk', 3, 'paving', 0.15)]});
		self.Define('tram', {Title: 'Street with a tram', Group: 'street', Speed: 50, Catenary: true, Rails: [{Offset: 0, Gauge: 1.435}], Sleepers: {Step: 0.75, Length: 0, Surface: 'concrete'}, Strips: [strip('sidewalk', 2.5, 'paving', 0.15), lane(-1, 'asphalt', 3.2, 'none', 'solid'), strip('bed', 3, 'concrete'), lane(1, 'asphalt', 3.2, 'solid'), strip('sidewalk', 2.5, 'paving', 0.15)]});

		/* Ways without a car. */
		self.Define('dirt', {Title: 'Dirt road', Group: 'path', Speed: 40, Strips: [lane(0, 'dirt', 4.5)]});
		self.Define('gravel', {Title: 'Gravel road', Group: 'path', Speed: 50, Strips: [lane(0, 'gravel', 5)]});
		self.Define('path', {Title: 'Path', Group: 'path', Speed: 6, Strips: [lane(0, 'dirt', 1.4)]});
		self.Define('footpath', {Title: 'Footpath', Group: 'path', Speed: 6, Strips: [lane(0, 'paving', 2)]});
		self.Define('cycle', {Title: 'Cycle path', Group: 'path', Speed: 25, Strips: [lane(-1, 'cycle', 1.25, 'none', 'dashed'), lane(1, 'cycle', 1.25)]});
		self.Define('sand', {Title: 'Sand track', Group: 'path', Speed: 30, Strips: [lane(0, 'sand', 4)]});

		/* Races. */
		self.Define('track', {Title: 'Race track', Group: 'race', Speed: 300, Strips: [strip('verge', 5, 'grass'), strip('runoff', 4, 'runoff'), strip('rumble', 1.2, 'rumble', 0.04), lane(0, 'asphalt', 14, 'solid', 'solid'), strip('rumble', 1.2, 'rumble', 0.04), strip('runoff', 4, 'runoff'), strip('verge', 5, 'grass')]});
		self.Define('rally', {Title: 'Rally stage', Group: 'race', Speed: 160, Strips: [strip('verge', 1, 'grass'), lane(0, 'gravel', 7), strip('verge', 1, 'grass')]});
		self.Define('kart', {Title: 'Kart track', Group: 'race', Speed: 100, Strips: [strip('rumble', 0.8, 'rumble', 0.03), lane(0, 'asphalt', 8, 'solid', 'solid'), strip('rumble', 0.8, 'rumble', 0.03)]});
		self.Define('drag', {Title: 'Drag strip', Group: 'race', Speed: 400, Strips: [strip('shoulder', 2, 'concrete'), lane(1, 'asphalt', 5, 'solid', 'solid'), strip('median', 1, 'concrete', 0.3), lane(1, 'asphalt', 5, 'solid', 'solid'), strip('shoulder', 2, 'concrete')]});

		/* Of aircraft. */
		self.Define('runway', {Title: 'Runway', Group: 'air', Speed: 300, Strips: [strip('shoulder', 7.5, 'asphalt', 0, {Right: 'solid'}), lane(0, 'concrete', 15, 'none', 'dashed'), lane(0, 'concrete', 15, 'none', 'solid'), strip('shoulder', 7.5, 'asphalt')]});
		self.Define('taxiway', {Title: 'Taxiway', Group: 'air', Speed: 40, Strips: [strip('shoulder', 3, 'asphalt'), lane(0, 'concrete', 23, 'none', 'none'), strip('shoulder', 3, 'asphalt')]});

		/* Railways. */
		self.Define('rail', {Title: 'Railway', Group: 'rail', Speed: 160, Catenary: false, Rails: [{Offset: 0, Gauge: 1.435}], Sleepers: {Step: 0.6, Length: 2.6, Surface: 'wood'}, Strips: [strip('ditch', 1, 'gravel', -0.2), strip('bed', 3.6, 'ballast', 0.3), strip('ditch', 1, 'gravel', -0.2)]});
		self.Define('rail-double', {Title: 'Double railway', Group: 'rail', Speed: 200, Catenary: true, Rails: [{Offset: -2.1, Gauge: 1.435}, {Offset: 2.1, Gauge: 1.435}], Sleepers: {Step: 0.6, Length: 2.6, Surface: 'concrete'}, Strips: [strip('ditch', 1, 'gravel', -0.2), strip('bed', 7.8, 'ballast', 0.3), strip('ditch', 1, 'gravel', -0.2)]});
		self.Define('rail-narrow', {Title: 'Narrow gauge railway', Group: 'rail', Speed: 50, Rails: [{Offset: 0, Gauge: 1}], Sleepers: {Step: 0.7, Length: 1.8, Surface: 'wood'}, Strips: [strip('bed', 2.6, 'ballast', 0.2)]});
		self.Define('rail-wide', {Title: 'Wide gauge railway', Group: 'rail', Speed: 160, Rails: [{Offset: 0, Gauge: 1.52}], Sleepers: {Step: 0.55, Length: 2.75, Surface: 'concrete'}, Strips: [strip('ditch', 1, 'gravel', -0.2), strip('bed', 3.8, 'ballast', 0.3), strip('ditch', 1, 'gravel', -0.2)]});
		self.Define('rail-yard', {Title: 'Yard track', Group: 'rail', Speed: 25, Rails: [{Offset: 0, Gauge: 1.435}], Sleepers: {Step: 0.65, Length: 2.6, Surface: 'wood'}, Strips: [strip('bed', 3.4, 'gravel', 0.1)]});
		self.Define('platform', {Title: 'Railway platform', Group: 'rail', Speed: 5, Strips: [strip('sidewalk', 6, 'concrete', 0.9, {Left: 'solid', Marking: [0.95, 0.85, 0.1]})]});
	}
});
