/*
 * ScenePipes: pipes of any size, from a tube of a few centimetres to a sewer a man walks in, as geometry and as what is
 * in them. Nothing here knows a scene: a pipe goes in ({ID, Points [[x, z] or [x, z, y]...], Radius (0.3), Wall (the
 * thickness of its wall, a tenth of the radius), Laid (above: on supports Lift (1.5) metres over the ground; ground: on
 * it; buried: Depth (1) under it), Bend (the radius of its bends, three of its own), Ends ([start, end]: open or closed,
 * open both), Flanges (metres between its joints, 6; 0 none), Spacing (metres between its supports), Color, Inside (the
 * color in it), Metal (0 to 1), Fluid ({Type, Fill (how much of it the fluid fills, 0 to 1), Flow (metres a second along
 * its points; below 0 back), Pressure (bars)}), Leaks ([{Along (metres), Angle (degrees round it from its top), Size (the
 * radius of the hole, metres)}]: holes in its wall)}) and comes out laid out, as a model or as what it cuts out of the ground.
 *
 * - Fluids(): the fluids a pipe may hold, {name: {Kind (liquid or gas), Density (kg/m3), Viscosity (as many times as
 *   water), Color, Opacity, Burns, Hot}}: water, sewage, mud, oil, fuel, gas, steam, air.
 * - Lay(spec, height): the pipe laid out: {ID, Radius, Wall, Laid, Ends, Fluid, Points: [{X, Y (of its axis), Z, Along,
 *   Tangent, Normal, Binormal}]}, height(x, z) the ground (0 with none); its corners rounded by its Bend.
 * - Asset(pipes, options): the model of pipes laid out (options Height: the ground, for the supports): its wall outside
 *   and inside (the inside darker), the rims of its open ends and the caps of its closed ones, its flanges, its supports,
 *   and the face of the liquid in it at the height its Fill says.
 * - Carves(pipes): what buried pipes cut out of the ground (Carves of tunnel, as round as they are): all of one a man may
 *   go in (Radius 0.4 and more), only its open ends of a smaller one.
 * - At(pipe, metres): its point at metres from its start ({X, Y, Z, Tangent, Normal, Binormal}).
 * - Near(pipe, point): the nearest point of its axis to a point: {Along, Distance (from the axis), At, Tangent, End (past its
 *   first or its last point: none of its wall there)}.
 * - Floor(pipes, x, z, y, climb): the floor a thing stands on at x, z, y of pipes: the bottom inside one it is in, the top of
 *   one it is on, no higher than climb (0.6) over y; -Infinity with none.
 * - Mouth(pipe): where what flows in a pipe comes out of it: the open end its Flow goes to ({At (in its mouth, in the
 *   middle of what the fluid fills), Way (out along it), Across (how wide the stream is), Rate (cubic metres a second)}), or
 *   null (closed there, nothing in it, nothing flowing).
 * - Hole(pipe, along, angle): a point of its wall, metres along it and degrees round it from its top: {At, Normal (out),
 *   Wet (whether the fluid in it reaches there: a liquid only under its level, a gas anywhere)}.
 * - Spurt(pipe, size): how fast what is in a pipe comes out of a hole of a radius (metres), and how much a second: {Speed
 *   (m/s, of its pressure over the air: as from a tap, at most 20), Rate (cubic metres a second)}.
 * - Blocks(pipes, x, z, y, round, heights): whether a body round as round, its points at heights over y (its knees and its
 *   chest, [0.5, 1.2]), goes into the wall of a pipe (from out of it or from in it; past its open ends nothing holds it).
 */
Elemenx.Service('ScenePipes', {
	$Meta: {
		Description: 'Pipes of any size laid on supports, on the ground or under it: their model outside and inside, flanges and supports, what they cut out of the ground, the fluids they hold.',
		Methods: ['Fluids()', 'Lay(spec, height)', 'Asset(pipes, options)', 'Carves(pipes)', 'At(pipe, metres)', 'Near(pipe, point)', 'Floor(pipes, x, z, y, climb)', 'Blocks(pipes, x, z, y, round, heights)', 'Mouth(pipe)', 'Hole(pipe, along, angle)', 'Spurt(pipe, size)']
	},

	Fluids: function () {
		return {
			water: {Kind: 'liquid', Density: 1000, Viscosity: 1, Color: [0.32, 0.5, 0.62], Opacity: 0.55},
			sewage: {Kind: 'liquid', Density: 1020, Viscosity: 3, Color: [0.33, 0.29, 0.18], Opacity: 0.92},
			mud: {Kind: 'liquid', Density: 1600, Viscosity: 60, Color: [0.36, 0.27, 0.17], Opacity: 1},
			oil: {Kind: 'liquid', Density: 870, Viscosity: 30, Color: [0.06, 0.05, 0.03], Opacity: 0.98, Burns: true},
			fuel: {Kind: 'liquid', Density: 750, Viscosity: 0.6, Color: [0.72, 0.58, 0.24], Opacity: 0.5, Burns: true},
			gas: {Kind: 'gas', Density: 0.8, Viscosity: 0, Color: [0.85, 0.9, 1], Opacity: 0.05, Burns: true},
			steam: {Kind: 'gas', Density: 0.6, Viscosity: 0, Color: [0.95, 0.96, 0.97], Opacity: 0.6, Hot: true},
			air: {Kind: 'gas', Density: 1.2, Viscosity: 0, Color: [1, 1, 1], Opacity: 0}
		};
	},

	Number: function (value, fallback) {
		return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
	},

	Lay: function (spec, height) {
		var self = this;
		var number = this.Number;
		var radius = Math.max(0.005, number(spec.Radius, 0.3));
		var laid = spec.Laid === 'ground' || spec.Laid === 'buried' ? spec.Laid : 'above';
		var lift = number(spec.Lift, 1.5);
		var depth = number(spec.Depth, 1);
		var bend = Math.max(radius * 1.5, number(spec.Bend, radius * 3));
		var ends = Array.isArray(spec.Ends) ? spec.Ends : [spec.Ends || 'open', spec.Ends || 'open'];
		var ground = height || function () {
			return 0;
		};
		var corners;
		var points = [];
		var along = 0;
		var i;

		/* Its axis at each point: the height given, else as it is laid. */
		corners = (spec.Points || []).map(function (point) {
			var y = point[2];

			if (y === undefined || y === null || y === '') {
				y = ground(point[0], point[1]);
				y = laid === 'buried' ? y - depth - radius : laid === 'ground' ? y + radius : y + lift + radius;
			}

			return [Number(point[0]), Number(y), Number(point[1])];
		});

		function sub (a, b) {
			return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
		}

		function length (a) {
			return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
		}

		function unit (a) {
			var size = length(a) || 1;

			return [a[0] / size, a[1] / size, a[2] / size];
		}

		function push (p) {
			var last = points[points.length - 1];
			if (last && length(sub(p, last)) < 1e-6) return;

			points.push(p);
		}

		/* Each corner rounded: a curve from as far before it as its bend to as far after (a curve of a quarter of its length a step). */
		for (i = 0; i < corners.length; i++) {
			var p = corners[i];
			var before = corners[i - 1];
			var after = corners[i + 1];
			var a;
			var b;
			var reach;
			var steps;
			var k;

			if (!before || !after) {
				push(p);

				continue;
			}

			reach = Math.min(bend, length(sub(p, before)) / 2, length(sub(after, p)) / 2);
			a = sub(p, unit(sub(p, before)).map(function (v) {
				return v * reach;
			}));
			b = [p[0] + unit(sub(after, p))[0] * reach, p[1] + unit(sub(after, p))[1] * reach, p[2] + unit(sub(after, p))[2] * reach];
			steps = Math.max(2, Math.min(12, Math.ceil(reach / Math.max(radius * 0.5, 0.05))));

			for (k = 0; k <= steps; k++) {
				var t = k / steps;

				push([0, 1, 2].map(function (axis) {
					return (1 - t) * (1 - t) * a[axis] + 2 * (1 - t) * t * p[axis] + t * t * b[axis];
				}));
			}
		}

		/* Along it, and a frame at each point carried on from the last, so its rings never twist. */
		points = points.map(function (point, index) {
			var next = points[Math.min(points.length - 1, index + 1)];
			var last = points[Math.max(0, index - 1)];

			if (index)
				along += length(sub(point, last));

			return {X: point[0], Y: point[1], Z: point[2], Along: along, Tangent: unit(sub(next, last))};
		});

		points.forEach(function (point, index) {
			var up = index ? points[index - 1].Normal : Math.abs(point.Tangent[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
			var t = point.Tangent;
			var dot = up[0] * t[0] + up[1] * t[1] + up[2] * t[2];

			point.Normal = unit([up[0] - t[0] * dot, up[1] - t[1] * dot, up[2] - t[2] * dot]);
			point.Binormal = [t[1] * point.Normal[2] - t[2] * point.Normal[1], t[2] * point.Normal[0] - t[0] * point.Normal[2], t[0] * point.Normal[1] - t[1] * point.Normal[0]];
		});

		return {
			ID: spec.ID || '',
			Radius: radius,
			Wall: Math.min(radius * 0.9, Math.max(0.002, number(spec.Wall, radius * 0.1))),
			Laid: laid,
			Ends: [ends[0] === 'closed' ? 'closed' : 'open', ends[1] === 'closed' ? 'closed' : 'open'],
			Flanges: Math.max(0, number(spec.Flanges, radius >= 0.05 ? 6 : 0)),
			Spacing: Math.max(1, number(spec.Spacing, Math.max(3, radius * 12))),
			Color: spec.Color || null,
			Inside: spec.Inside || null,
			Metal: number(spec.Metal, 0.6),
			Fluid: self.Fluid(spec.Fluid),
			Leaks: (Array.isArray(spec.Leaks) ? spec.Leaks : []).map(function (leak) {
				return {Along: number(leak.Along, 0), Angle: number(leak.Angle, 0), Size: Math.max(0.002, number(leak.Size, 0.02))};
			}),
			Points: points
		};
	},

	/* What a pipe holds, its type known (water by default) or none: {Type, Fill, Flow, Pressure}. */
	Fluid: function (given) {
		var fluid = given || {};
		var type = this.Fluids()[fluid.Type] ? fluid.Type : 'water';

		return {Type: type, Fill: Math.max(0, Math.min(1, this.Number(fluid.Fill, given ? 1 : 0))), Flow: this.Number(fluid.Flow, 0), Pressure: Math.max(0, this.Number(fluid.Pressure, 1))};
	},

	At: function (pipe, metres) {
		var points = pipe.Points;
		var low = 0;
		var high = points.length - 1;
		var a;
		var b;
		var t;

		if (points.length < 2) return points[0];

		while (high - low > 1) {
			var middle = (low + high) >> 1;

			if (points[middle].Along <= metres) low = middle;
			else high = middle;
		}

		a = points[low];
		b = points[high];
		t = Math.max(0, Math.min(1, (metres - a.Along) / Math.max(1e-9, b.Along - a.Along)));

		return {X: a.X + (b.X - a.X) * t, Y: a.Y + (b.Y - a.Y) * t, Z: a.Z + (b.Z - a.Z) * t, Tangent: a.Tangent, Normal: a.Normal, Binormal: a.Binormal};
	},

	Near: function (pipe, point) {
		var best = {Along: 0, Distance: Infinity, At: null, Tangent: [1, 0, 0], End: false};
		var points = pipe.Points;
		var i;

		for (i = 0; i + 1 < points.length; i++) {
			var a = points[i];
			var b = points[i + 1];
			var d = [b.X - a.X, b.Y - a.Y, b.Z - a.Z];
			var size = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] || 1;
			var raw = ((point[0] - a.X) * d[0] + (point[1] - a.Y) * d[1] + (point[2] - a.Z) * d[2]) / size;
			var t = Math.max(0, Math.min(1, raw));
			var at = [a.X + d[0] * t, a.Y + d[1] * t, a.Z + d[2] * t];
			var far = Math.sqrt((point[0] - at[0]) * (point[0] - at[0]) + (point[1] - at[1]) * (point[1] - at[1]) + (point[2] - at[2]) * (point[2] - at[2]));
			if (far < best.Distance)
				best = {Along: a.Along + (b.Along - a.Along) * t, Distance: far, At: at, Tangent: a.Tangent, End: i === 0 && raw < 0 || i === points.length - 2 && raw > 1};
		}

		return best;
	},

	Floor: function (pipes, x, z, y, climb) {
		var self = this;
		var reach = climb === undefined ? 0.6 : climb;
		var best = -Infinity;

		(pipes || []).forEach(function (pipe) {
			var near = self.Near(pipe, [x, y + 0.3, z]);
			var inner = pipe.Radius - pipe.Wall;
			var aside;
			var floor;

			if (!near.At || near.End) return;

			/* Across the axis on the level: how far from under it. */
			aside = Math.sqrt(Math.max(0, near.Distance * near.Distance - (y + 0.3 - near.At[1]) * (y + 0.3 - near.At[1])));

			if (near.Distance < inner && aside < inner) floor = near.At[1] - Math.sqrt(inner * inner - aside * aside);
			else if (y + 0.3 >= near.At[1] && aside < pipe.Radius) floor = near.At[1] + Math.sqrt(pipe.Radius * pipe.Radius - aside * aside);
			else return;

			if (floor <= y + reach)
				best = Math.max(best, floor);
		});

		return best;
	},

	Mouth: function (pipe) {
		var fluid = pipe.Fluid;
		var inner = pipe.Radius - pipe.Wall;
		var end = fluid.Flow >= 0 ? pipe.Points.length - 1 : 0;
		var point = pipe.Points[end];
		var way = fluid.Flow >= 0 ? point.Tangent : point.Tangent.map(function (v) {
			return -v;
		});
		var liquid = this.Fluids()[fluid.Type].Kind === 'liquid';
		var fill = liquid ? fluid.Fill : 1;
		var level = liquid ? inner * (fill - 1) : 0;

		if (!fluid.Flow || fill <= 0 || pipe.Ends[end ? 1 : 0] !== 'open') return null;

		return {At: [point.X, point.Y + level, point.Z], Way: way, Across: inner * Math.sqrt(Math.max(0.05, fill)), Rate: Math.abs(fluid.Flow) * Math.PI * inner * inner * fill};
	},

	Hole: function (pipe, along, angle) {
		var point = this.At(pipe, Math.max(0, Math.min(pipe.Points[pipe.Points.length - 1].Along, along)));
		var a = (angle || 0) * Math.PI / 180;
		/* Round the pipe from its top: the up of its frame (its normal, or its binormal where that looks up more). */
		var up = Math.abs(point.Normal[1]) >= Math.abs(point.Binormal[1]) ? point.Normal : point.Binormal;
		var side = up === point.Normal ? point.Binormal : point.Normal;
		var sign = up[1] < 0 ? -1 : 1;
		var n = [0, 1, 2].map(function (axis) {
			return up[axis] * sign * Math.cos(a) + side[axis] * Math.sin(a);
		});
		var inner = pipe.Radius - pipe.Wall;
		var liquid = this.Fluids()[pipe.Fluid.Type].Kind === 'liquid';

		return {At: [point.X + n[0] * pipe.Radius, point.Y + n[1] * pipe.Radius, point.Z + n[2] * pipe.Radius], Normal: n, Wet: liquid ? pipe.Fluid.Fill > 0 && n[1] * inner < inner * (pipe.Fluid.Fill * 2 - 1) : pipe.Fluid.Fill > 0 || pipe.Fluid.Pressure > 0};
	},

	Spurt: function (pipe, size) {
		var fluid = this.Fluids()[pipe.Fluid.Type];
		var speed = Math.min(20, Math.sqrt(2 * Math.max(0, pipe.Fluid.Pressure) * 1e5 / Math.max(0.5, fluid.Density)) * (fluid.Kind === 'liquid' ? 1 : 0.05));
		var area = Math.PI * size * size;

		return {Speed: speed, Rate: speed * area * 0.6};
	},

	Blocks: function (pipes, x, z, y, round, heights) {
		var self = this;

		return (pipes || []).some(function (pipe) {
			var inner = pipe.Radius - pipe.Wall;

			return (heights || [0.5, 1.2]).some(function (height) {
				var near = self.Near(pipe, [x, y + height, z]);

				return !!near.At && !near.End && near.Distance > inner - round && near.Distance < pipe.Radius + round;
			});
		});
	},

	/* A tube round the axis of a pipe from one point to another of it: radius, its normals out (sign 1) or in (-1). */
	Tube: function (points, radius, sign, sides) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: []};

		points.forEach(function (point, index) {
			var k;

			for (k = 0; k <= sides; k++) {
				var a = k / sides * Math.PI * 2;
				var n = [0, 1, 2].map(function (axis) {
					return point.Normal[axis] * Math.cos(a) + point.Binormal[axis] * Math.sin(a);
				});

				made.Positions.push(point.X + n[0] * radius, point.Y + n[1] * radius, point.Z + n[2] * radius);
				made.Normals.push(n[0] * sign, n[1] * sign, n[2] * sign);
				made.UVs.push(k / sides, point.Along / (Math.PI * 2 * Math.max(radius, 0.05)));

				if (index && k < sides) {
					var row = (sides + 1) * index;
					var last = row - sides - 1;

					if (sign > 0) made.Indices.push(last + k, row + k, last + k + 1, last + k + 1, row + k, row + k + 1);
					else made.Indices.push(last + k, last + k + 1, row + k, last + k + 1, row + k + 1, row + k);
				}
			}
		});

		return made;
	},

	/* A ring between two radii across a point of a pipe, facing way (1: on along it, -1: back): a rim, a cap (inner 0), a face of a flange. */
	Ring: function (point, outer, inner, way, sides) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: []};
		var n = point.Tangent.map(function (v) {
			return v * way;
		});
		var k;

		for (k = 0; k <= sides; k++) {
			var a = k / sides * Math.PI * 2;
			var r = [0, 1, 2].map(function (axis) {
				return point.Normal[axis] * Math.cos(a) + point.Binormal[axis] * Math.sin(a);
			});

			made.Positions.push(point.X + r[0] * outer, point.Y + r[1] * outer, point.Z + r[2] * outer, point.X + r[0] * inner, point.Y + r[1] * inner, point.Z + r[2] * inner);
			made.Normals.push(n[0], n[1], n[2], n[0], n[1], n[2]);
			made.UVs.push(k / sides, 0, k / sides, 1);

			if (k < sides) {
				if (way > 0) made.Indices.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
				else made.Indices.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
			}
		}

		return made;
	},

	/* A box standing at a point, size [x, y, z], turned so its z goes along way [x, z]. */
	Box: function (center, size, way) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: []};
		var length = Math.sqrt(way[0] * way[0] + way[1] * way[1]) || 1;
		var w = [way[0] / length, way[1] / length];
		var side = [w[1], -w[0]];
		var faces = [[[0, 1, 0], [1, 0, 0], [0, 0, 1]], [[0, -1, 0], [0, 0, 1], [1, 0, 0]], [[1, 0, 0], [0, 0, 1], [0, 1, 0]], [[-1, 0, 0], [0, 1, 0], [0, 0, 1]], [[0, 0, 1], [0, 1, 0], [1, 0, 0]], [[0, 0, -1], [1, 0, 0], [0, 1, 0]]];

		function turned (v) {
			return [side[0] * v[0] + w[0] * v[2], v[1], side[1] * v[0] + w[1] * v[2]];
		}

		faces.forEach(function (face) {
			var at = made.Positions.length / 3;
			var n = turned(face[0]);

			[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
				var p = turned([0, 1, 2].map(function (axis) {
					return (face[0][axis] + face[1][axis] * corner[0] + face[2][axis] * corner[1]) * size[axis] / 2;
				}));

				made.Positions.push(center[0] + p[0], center[1] + p[1], center[2] + p[2]);
				made.Normals.push(n[0], n[1], n[2]);
				made.UVs.push(corner[0] * 0.5 + 0.5, corner[1] * 0.5 + 0.5);
			});

			made.Indices.push(at, at + 1, at + 2, at, at + 2, at + 3);
		});

		return made;
	},

	/* Pieces of geometry as one: their indices after the ones before. */
	Merged: function (list) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: []};

		list.forEach(function (one) {
			var base = made.Positions.length / 3;
			var i;

			for (i = 0; i < one.Positions.length; i++) {
				made.Positions.push(one.Positions[i]);
				made.Normals.push(one.Normals[i]);
			}

			for (i = 0; i < one.UVs.length; i++)
				made.UVs.push(one.UVs[i]);

			for (i = 0; i < one.Indices.length; i++)
				made.Indices.push(one.Indices[i] + base);
		});

		return {Positions: new Float32Array(made.Positions), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: made.Indices};
	},

	Asset: function (pipes, options) {
		var self = this;
		var settings = options || {};
		var ground = settings.Height || function () {
			return 0;
		};
		var materials = [];
		var parts = {};
		var named = {};
		var meshes = [];

		function material (name, color, metal, rough, alpha) {
			if (named[name] === undefined) {
				named[name] = materials.length;

				materials.push({Name: name, Pattern: '', BaseColor: color.concat([alpha === undefined ? 1 : alpha]), Metallic: metal, Roughness: rough, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: alpha === undefined || alpha >= 1 ? 'OPAQUE' : 'BLEND', Cutoff: 0.5, DoubleSided: true, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null});
			}

			return named[name];
		}

		function add (key, piece) {
			(parts[key] = parts[key] || []).push(piece);
		}

		(pipes || []).forEach(function (pipe) {
			var points = pipe.Points;
			var sides = Math.max(8, Math.min(32, Math.round(pipe.Radius * 40) + 8));
			var inner = pipe.Radius - pipe.Wall;
			var outside = material('pipe-' + (pipe.Color || []).join(',') + '-' + pipe.Metal, pipe.Color || [0.55, 0.56, 0.58], pipe.Metal, 0.45);
			var inside = material('inside-' + (pipe.Inside || []).join(','), pipe.Inside || [0.22, 0.21, 0.2], 0, 0.85);
			var fluids = self.Fluids();
			var metres;

			if (points.length < 2) return;

			add(outside, self.Tube(points, pipe.Radius, 1, sides));
			add(inside, self.Tube(points, inner, -1, sides));

			/* Its ends: the rim of an open one (and its inside shows), the cap of a closed one. */
			[[points[0], -1, pipe.Ends[0]], [points[points.length - 1], 1, pipe.Ends[1]]].forEach(function (end) {
				add(outside, self.Ring(end[0], pipe.Radius, end[2] === 'closed' ? 0 : inner, end[1], sides));
			});

			/* Its joints: a flange as wide as a fifth more, at every Flanges metres. */
			if (pipe.Flanges > 0) {
				for (metres = pipe.Flanges; metres < points[points.length - 1].Along - pipe.Flanges * 0.25; metres += pipe.Flanges) {
					var wide = pipe.Radius * 1.2 + 0.01;
					var thick = pipe.Radius * 0.12 + 0.01;
					var from = self.At(pipe, metres - thick / 2);
					var to = self.At(pipe, metres + thick / 2);

					from.Along = metres - thick / 2;
					to.Along = metres + thick / 2;

					add(outside, self.Tube([from, to], wide, 1, sides));
					add(outside, self.Ring(from, wide, pipe.Radius, -1, sides));
					add(outside, self.Ring(to, wide, pipe.Radius, 1, sides));
				}
			}

			/* On supports: a post from the ground to under it, and a saddle under it, every Spacing metres. */
			if (pipe.Laid === 'above') {
				for (metres = pipe.Spacing / 2; metres < points[points.length - 1].Along; metres += pipe.Spacing) {
					var at = self.At(pipe, metres);
					var floor = ground(at.X, at.Z);
					var under = at.Y - pipe.Radius;
					var post = Math.max(0.08, pipe.Radius * 0.35);
					var way = [at.Tangent[0], at.Tangent[2]];

					if (under - floor > 0.05)
						add(material('support', [0.52, 0.51, 0.49], 0, 0.9), self.Box([at.X, (under + floor) / 2 - 0.02, at.Z], [post, under - floor + 0.04, post], way));

					add(material('support', [0.52, 0.51, 0.49], 0, 0.9), self.Box([at.X, under + pipe.Radius * 0.15, at.Z], [pipe.Radius * 2.2, pipe.Radius * 0.3, post * 1.4], way));
				}
			}

			/* The face of the liquid in it, at the height its fill says: a strip across it, level, of the color of the fluid. */
			if (pipe.Fluid.Fill > 0.01 && fluids[pipe.Fluid.Type].Kind === 'liquid' && pipe.Fluid.Fill < 0.99) {
				var level = inner * (pipe.Fluid.Fill * 2 - 1);
				var half = Math.sqrt(Math.max(0, inner * inner - level * level)) * 0.995;
				var surface = {Positions: [], Normals: [], UVs: [], Indices: []};
				var fluid = fluids[pipe.Fluid.Type];

				points.forEach(function (point, index) {
					/* Across it level: the side of its frame that lies flattest. */
					var across = Math.abs(point.Binormal[1]) < Math.abs(point.Normal[1]) ? point.Binormal : point.Normal;
					var up = [0, 1, 0];

					[-1, 1].forEach(function (s) {
						surface.Positions.push(point.X + across[0] * half * s, point.Y + level, point.Z + across[2] * half * s);
						surface.Normals.push(up[0], up[1], up[2]);
						surface.UVs.push(s * 0.5 + 0.5, point.Along);
					});

					if (index)
						surface.Indices.push(index * 2 - 2, index * 2, index * 2 - 1, index * 2 - 1, index * 2, index * 2 + 1);
				});

				add(material('fluid-' + pipe.Fluid.Type, fluid.Color, 0, 0.08, Math.max(0.5, fluid.Opacity)), surface);
			}
		});

		Object.keys(parts).forEach(function (key) {
			meshes.push({Geometry: self.Merged(parts[key]), Material: Number(key)});
		});

		return {
			Nodes: [{Name: 'pipes', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}],
			Meshes: [meshes],
			Lights: [],
			Materials: materials,
			Images: [],
			Skins: [],
			Animations: [],
			Scene: [0]
		};
	},

	Carves: function (pipes) {
		var carves = [];

		(pipes || []).forEach(function (pipe) {
			var points = pipe.Points;
			var first;
			var last;

			if (pipe.Laid !== 'buried' || points.length < 2) return;

			/* One a man may go in: all of it, a little wider than it, round; the ground over it kept. */
			if (pipe.Radius >= 0.4) {
				carves.push({Type: 'tunnel', Pipe: pipe.ID, Points: points.map(function (point) {
					return [point.X, point.Z, point.Y];
				}), Radius: pipe.Radius + 0.03, Flat: 0, Crust: 0.15});

				return;
			}

			/* A smaller one: only its open ends, as far into the ground as two of its widths. */
			first = points[0];
			last = points[points.length - 1];

			[[first, 1, pipe.Ends[0]], [last, -1, pipe.Ends[1]]].forEach(function (end) {
				var p = end[0];
				var t = end[0].Tangent;
				var reach = pipe.Radius * 4 + 0.2;

				if (end[2] !== 'open') return;

				carves.push({Type: 'tunnel', Pipe: pipe.ID, Points: [[p.X - t[0] * end[1] * 0.3, p.Z - t[2] * end[1] * 0.3, p.Y - t[1] * end[1] * 0.3], [p.X + t[0] * end[1] * reach, p.Z + t[2] * end[1] * reach, p.Y + t[1] * end[1] * reach]], Radius: pipe.Radius + 0.02, Flat: 0});
			});
		});

		return carves;
	}
});
