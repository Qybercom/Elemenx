/*
 * Tracks: closed race tracks of a seed. A track is its middle line and what is built along it, as data, and a model that can be
 * laid in any scene.
 *
 * - Make(seed, options) returns {Seed, Points: [{X, Y, Z, Way: [x, z], Bend}], Length, Width, Margin, Start: {X, Y, Z, Heading}, Hills}. Options:
 *   Length (the way round, metres, default 2400), Width (default 14), Corners (how many bends the way has, default 9 to 14), Wild (how far
 *   it strays from a round, 0 to 1, default 0.55), Hills (how high the land rises, default 7), Margin (from the road to the barrier, default 7).
 * - Near(track, x, z, hint) returns {Offset, Along, Way}: how far a place is from the middle line (the left side is below 0) and where on it.
 *   With hint, the Along of a moment ago, it looks only there: where two sections lie close a car stays on the one it is on.
 * - Height(track, x, z) is the height of the land.
 * - Under(track, x, z, hint) is what a wheel stands on, as the model has it: {Height, Grip, Drag}, smooth along the road, the land off it.
 * - Asset(track) is a model of it, for Models.Define(name, {URL: name, Asset, Fit: false}) and a location: land, road, kerbs where it
 *   bends, barriers, a start line with a gantry, and stands by the longest straight.
 */
Elemenx.Service('Tracks', {
	$Meta: {
		Description: 'Closed race tracks of a seed: a middle line, its land, road, kerbs, barriers and stands, as data and as a model.',
		Methods: ['Make(seed, options)', 'Near(track, x, z, hint)', 'Height(track, x, z)', 'Under(track, x, z, hint)', 'Asset(track)']
	},

	/* How many squares a side of the land has. */
	Side: 128,

	Random: function (text) {
		var value = 11;
		var i;

		for (i = 0; i < text.length; i++)
			value = (value * 31 + text.charCodeAt(i)) % 2147483647;

		value = value || 1;

		return function () {
			value = (value * 16807) % 2147483647;

			return value / 2147483647;
		};
	},

	/* A closed curve through its points. */
	Curve: function (a, b, c, d, t) {
		var tt = t * t;

		return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * tt + (3 * b - a - 3 * c + d) * tt * t);
	},

	Make: function (seed, options) {
		var settings = options || {};
		var next = this.Random(String(seed === undefined ? 'track' : seed));
		var length = settings.Length || 2400;
		var width = settings.Width || 14;
		var corners = settings.Corners || 9 + Math.floor(next() * 6);
		var wild = settings.Wild === undefined ? 0.55 : settings.Wild;
		var hills = settings.Hills === undefined ? 7 : settings.Hills;
		var radius = length / (Math.PI * 2);
		var knots = [];
		var points = [];
		var total = 0;
		var i;
		var j;

		/* Round a middle, nearer and farther: so it never crosses itself. */
		for (i = 0; i < corners; i++) {
			var angle = (i + (next() - 0.5) * 0.5) / corners * Math.PI * 2;
			var far = radius * (1 + (next() - 0.5) * wild * 1.3);

			knots.push([Math.cos(angle) * far, Math.sin(angle) * far * (0.7 + wild * 0.2)]);
		}

		/* Even steps of about a road's half width along it. */
		var fine = [];

		for (i = 0; i < corners; i++) {
			for (j = 0; j < 24; j++) {
				var p0 = knots[(i + corners - 1) % corners];
				var p1 = knots[i];
				var p2 = knots[(i + 1) % corners];
				var p3 = knots[(i + 2) % corners];

				fine.push([this.Curve(p0[0], p1[0], p2[0], p3[0], j / 24), this.Curve(p0[1], p1[1], p2[1], p3[1], j / 24)]);
			}
		}

		for (i = 0; i < fine.length; i++)
			total += Math.hypot(fine[(i + 1) % fine.length][0] - fine[i][0], fine[(i + 1) % fine.length][1] - fine[i][1]);

		var fit = length / total;
		var step = 6;
		var gone = 0;
		var last = fine[0];

		points.push({X: last[0] * fit, Z: last[1] * fit});

		for (i = 1; i <= fine.length; i++) {
			var here = fine[i % fine.length];
			var part = Math.hypot(here[0] - last[0], here[1] - last[1]) * fit;

			gone += part;

			if (gone >= step) {
				points.push({X: here[0] * fit, Z: here[1] * fit});

				gone = 0;
			}

			last = here;
		}

		/* The way ends where it began: a last point on the first would be a step of nothing, and turn the road there. */
		var end = points[points.length - 1];
		if (Math.hypot(end.X - points[0].X, end.Z - points[0].Z) < step * 0.6)
			points.pop();

		var track = {Seed: seed, Points: points, Length: length, Width: width, Margin: settings.Margin === undefined ? 7 : settings.Margin, Hills: hills, Phase: next() * 6, Size: radius * 3.4};
		var count = points.length;
		var self = this;

		points.forEach(function (point, index) {
			var before = points[(index + count - 1) % count];
			var after = points[(index + 1) % count];
			var size = Math.hypot(after.X - before.X, after.Z - before.Z) || 1;

			point.Way = [(after.X - before.X) / size, (after.Z - before.Z) / size];
			point.Y = self.Land(track, point.X, point.Z);
		});

		points.forEach(function (point, index) {
			var after = points[(index + 2) % count];

			point.Bend = Math.abs(point.Way[0] * after.Way[1] - point.Way[1] * after.Way[0]);
		});

		/* It starts on the middle of its longest straight. */
		var best = 0;
		var longest = 0;
		var run = 0;

		for (i = 0; i < count * 2; i++) {
			run = points[i % count].Bend < 0.05 ? run + 1 : 0;

			if (run > longest) {
				longest = run;
				best = (i - Math.floor(run / 2)) % count;
			}
		}

		track.Line = best;
		track.Start = {X: points[best].X, Y: points[best].Y, Z: points[best].Z, Heading: Math.atan2(points[best].Way[0], points[best].Way[1])};

		return track;
	},

	/* The land by itself: long waves. */
	Land: function (track, x, z) {
		var phase = track.Phase;

		return track.Hills * (Math.sin(x * 0.0041 + phase) * 0.6 + Math.sin(z * 0.0053 + phase * 2.1) * 0.5 + Math.sin((x + z) * 0.0097 + phase * 0.7) * 0.25);
	},

	Near: function (track, x, z, hint) {
		var points = track.Points;
		var count = points.length;
		var near = hint !== undefined;
		var best = near ? hint : 0;
		var least = Infinity;
		var i;

		for (i = near ? -14 : 0; i < (near ? 15 : count); i++) {
			var index = near ? (hint + i + count) % count : i;
			var dx = points[index].X - x;
			var dz = points[index].Z - z;
			var far = dx * dx + dz * dz;

			if (far < least) {
				least = far;
				best = index;
			}
		}

		/* On the line between the points, not at the nearest of them: the barrier is there, and a car meets it to the centimetre. */
		var offset = 0;
		var way = points[best].Way;

		least = Infinity;

		[(best + count - 1) % count, best].forEach(function (first) {
			var from = points[first];
			var to = points[(first + 1) % count];
			var sx = to.X - from.X;
			var sz = to.Z - from.Z;
			var part = Math.max(0, Math.min(1, ((x - from.X) * sx + (z - from.Z) * sz) / (sx * sx + sz * sz || 1)));
			var px = from.X + sx * part;
			var pz = from.Z + sz * part;
			var far = (x - px) * (x - px) + (z - pz) * (z - pz);
			var wayX = from.Way[0] + (to.Way[0] - from.Way[0]) * part;
			var wayZ = from.Way[1] + (to.Way[1] - from.Way[1]) * part;
			var size = Math.hypot(wayX, wayZ) || 1;

			if (far < least) {
				least = far;
				way = [wayX / size, wayZ / size];
				offset = (x - px) * way[1] - (z - pz) * way[0];
			}
		});

		return {Offset: offset, Along: best, Way: way};
	},

	/* The land, drawn under the road where it comes near it. */
	Height: function (track, x, z) {
		var near = this.Near(track, x, z);
		var point = track.Points[near.Along];
		var half = track.Width / 2 + track.Margin + 8;
		var mix = Math.min(1, Math.max(0, (Math.abs(near.Offset) - half) / 30));

		return (point.Y - 0.25) * (1 - mix) + this.Land(track, x, z) * mix;
	},

	/* The land as the sheet of the model has it, between its corners. */
	Land2: function (track, x, z) {
		var side = this.Side;
		var cell = track.Size / side;
		var px = (x + track.Size / 2) / cell;
		var pz = (z + track.Size / 2) / cell;
		var ix = Math.max(0, Math.min(side - 1, Math.floor(px)));
		var iz = Math.max(0, Math.min(side - 1, Math.floor(pz)));
		var fx = px - ix;
		var fz = pz - iz;
		var keep = track.Heights;

		if (!keep) {
			var row;
			var column;

			keep = track.Heights = [];

			for (row = 0; row <= side; row++) {
				for (column = 0; column <= side; column++)
					keep.push(this.Height(track, (column / side - 0.5) * track.Size, (row / side - 0.5) * track.Size));
			}
		}

		function at (column2, row2) {
			return keep[row2 * (side + 1) + column2];
		}

		return (at(ix, iz) * (1 - fx) + at(ix + 1, iz) * fx) * (1 - fz) + (at(ix, iz + 1) * (1 - fx) + at(ix + 1, iz + 1) * fx) * fz;
	},

	Under: function (track, x, z, hint) {
		var near = this.Near(track, x, z, hint);
		var points = track.Points;
		var point = points[near.Along];
		var half = track.Width / 2;
		var edge = Math.abs(near.Offset);
		var count = points.length;
		var along = (x - point.X) * near.Way[0] + (z - point.Z) * near.Way[1];

		/* Between the two points it lies by, however far apart they are, on a curve: a straight line between them breaks at each. */
		var first = along > 0 ? near.Along : (near.Along + count - 1) % count;
		var from = points[first];
		var to = points[(first + 1) % count];
		var span = Math.hypot(to.X - from.X, to.Z - from.Z) || 1;
		var part = Math.max(0, Math.min(1, ((x - from.X) * (to.X - from.X) + (z - from.Z) * (to.Z - from.Z)) / (span * span)));
		var road = this.Curve(points[(first + count - 1) % count].Y, from.Y, to.Y, points[(first + 2) % count].Y, part) + 0.02;

		if (edge < half + 1.3)
			return {Height: road, Grip: 1, Drag: 0};

		var land = this.Land2(track, x, z);

		return {Height: edge < half + 2.3 ? road + (land - road) * (edge - half - 1.3) : land, Grip: 0.55, Drag: 0.55};
	},

	/* A strip along the line between two offsets from it, each at a height over the road. */
	Strip: function (track, from, to, lift, keep, color) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: [], Colors: color ? [] : null};
		var points = track.Points;
		var count = points.length;
		var run = 0;
		var i;

		for (i = 0; i <= count; i++) {
			var point = points[i % count];
			var way = point.Way;
			var shown = !keep || keep(point, i % count);
			var at = made.Positions.length / 3;

			made.Positions.push(point.X + way[1] * from, point.Y + lift, point.Z - way[0] * from, point.X + way[1] * to, point.Y + lift, point.Z - way[0] * to);
			made.Normals.push(0, 1, 0, 0, 1, 0);
			made.UVs.push(0, run / track.Width, 1, run / track.Width);

			/* Colors change sharply from a step to the next: each has corners of its own. */
			if (color) {
				var ahead = points[(i + 1) % count];
				var over = ahead.Way;
				var tint = color(i);

				if (i < count) {
					made.Positions.push(ahead.X + over[1] * from, ahead.Y + lift, ahead.Z - over[0] * from, ahead.X + over[1] * to, ahead.Y + lift, ahead.Z - over[0] * to);
					made.Normals.push(0, 1, 0, 0, 1, 0);
					made.UVs.push(0, 0, 0, 0);
				}

				made.Colors.push(tint[0], tint[1], tint[2], tint[0], tint[1], tint[2], tint[0], tint[1], tint[2], tint[0], tint[1], tint[2]);
			}

			run += 6;

			if (color) {
				if (i < count && shown)
					made.Indices.push(at, at + 2, at + 1, at + 1, at + 2, at + 3);
			}
			else if (i < count && shown && (!keep || keep(points[(i + 1) % count], (i + 1) % count))) {
				made.Indices.push(at, at + 2, at + 1, at + 1, at + 2, at + 3);
			}
		}

		return this.Typed(made);
	},

	/* A wall along the line. */
	Wall: function (track, offset, height, color) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: [], Colors: []};
		var points = track.Points;
		var count = points.length;
		var side = offset < 0 ? -1 : 1;
		var i;

		for (i = 0; i <= count; i++) {
			var point = points[i % count];
			var way = point.Way;
			var x = point.X + way[1] * offset;
			var z = point.Z - way[0] * offset;
			var after = points[(i + 1) % count];
			var nextX = after.X + after.Way[1] * offset;
			var nextZ = after.Z - after.Way[0] * offset;
			var at = made.Positions.length / 3;
			var tint = color(i);

			if (i === count) break;

			made.Positions.push(x, point.Y - 0.3, z, x, point.Y + height, z, nextX, after.Y - 0.3, nextZ, nextX, after.Y + height, nextZ);

			for (var corner = 0; corner < 4; corner++) {
				made.Normals.push(-way[1] * side, 0, way[0] * side);
				made.UVs.push(0, 0);
				made.Colors.push(tint[0], tint[1], tint[2]);
			}

			made.Indices.push(at, at + 1, at + 2, at + 1, at + 3, at + 2);
		}

		return this.Typed(made);
	},

	Typed: function (made) {
		return {Positions: new Float32Array(made.Positions), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: made.Colors ? new Float32Array(made.Colors) : null, Joints: null, Weights: null, Indices: made.Indices};
	},

	/* The land round the track, a sheet of squares. */
	Sheet: function (track) {
		var size = track.Size;
		var side = this.Side;
		var made = {Positions: [], Normals: [], UVs: [], Indices: [], Colors: null};
		var x;
		var z;

		for (z = 0; z <= side; z++) {
			for (x = 0; x <= side; x++) {
				var px = (x / side - 0.5) * size;
				var pz = (z / side - 0.5) * size;
				var y = this.Land2(track, px, pz);
				var dx = this.Height(track, px + 6, pz) - y;
				var dz = this.Height(track, px, pz + 6) - y;
				var length = Math.hypot(dx, 6, dz);

				made.Positions.push(px, y, pz);
				made.Normals.push(-dx / length, 6 / length, -dz / length);
				made.UVs.push(px / 40, pz / 40);

				if (x < side && z < side) {
					var at = z * (side + 1) + x;

					made.Indices.push(at, at + side + 1, at + 1, at + 1, at + side + 1, at + side + 2);
				}
			}
		}

		return this.Typed(made);
	},

	/* Boxes, each [x, y, z, width, height, depth, turn, [r, g, b]]. */
	Boxes: function (list) {
		var made = {Positions: [], Normals: [], UVs: [], Indices: [], Colors: []};

		list.forEach(function (box) {
			var c = Math.cos(box[6]);
			var s = Math.sin(box[6]);
			var faces = [[[0, 1, 0], [1, 0, 0], [0, 0, 1]], [[0, -1, 0], [1, 0, 0], [0, 0, -1]], [[1, 0, 0], [0, 0, 1], [0, 1, 0]], [[-1, 0, 0], [0, 0, -1], [0, 1, 0]], [[0, 0, 1], [0, 1, 0], [1, 0, 0]], [[0, 0, -1], [1, 0, 0], [0, 1, 0]]];

			faces.forEach(function (face) {
				var at = made.Positions.length / 3;
				var n = face[0];
				var u = face[1];
				var v = face[2];

				[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
					var lx = (n[0] + u[0] * corner[0] + v[0] * corner[1]) * box[3] / 2;
					var ly = (n[1] + u[1] * corner[0] + v[1] * corner[1]) * box[4] / 2;
					var lz = (n[2] + u[2] * corner[0] + v[2] * corner[1]) * box[5] / 2;

					made.Positions.push(box[0] + lx * c + lz * s, box[1] + ly, box[2] - lx * s + lz * c);
					made.Normals.push(n[0] * c + n[2] * s, n[1], n[2] * c - n[0] * s);
					made.UVs.push(corner[0], corner[1]);
					made.Colors.push(box[7][0], box[7][1], box[7][2]);
				});

				made.Indices.push(at, at + 1, at + 2, at, at + 2, at + 3);
			});
		});

		return this.Typed(made);
	},

	/* What stands by the line: the gantry over the start, stands along the straight, a pit row. */
	Built: function (track) {
		var points = track.Points;
		var line = points[track.Line];
		var turn = track.Start.Heading;
		var half = track.Width / 2 + 1.5;
		var side = [line.Way[1], -line.Way[0]];
		var boxes = [];
		var i;

		boxes.push([line.X + side[0] * half, line.Y + 3.5, line.Z + side[1] * half, 0.6, 7, 0.6, turn, [0.2, 0.2, 0.22]]);
		boxes.push([line.X - side[0] * half, line.Y + 3.5, line.Z - side[1] * half, 0.6, 7, 0.6, turn, [0.2, 0.2, 0.22]]);
		boxes.push([line.X, line.Y + 7, line.Z, half * 2 + 1, 1.3, 0.8, turn, [0.92, 0.92, 0.95]]);

		/* The line itself, in squares. */
		var columns = 14;
		var square = track.Width / columns;
		var row2;

		for (i = 0; i < columns; i++) {
			for (row2 = 0; row2 < 3; row2++) {
				var across = (i - (columns - 1) / 2) * square;
				var along = (row2 - 1) * square;

				boxes.push([line.X + side[0] * across + line.Way[0] * along, line.Y + 0.05, line.Z + side[1] * across + line.Way[1] * along, square, 0.02, square, turn, (i + row2) % 2 ? [0.95, 0.95, 0.95] : [0.06, 0.06, 0.07]]);
			}
		}

		for (i = -6; i <= 6; i++) {
			var at = points[(track.Line + i * 7 + points.length) % points.length];
			var far = track.Width / 2 + track.Margin + 9;
			var left = [at.Way[1], -at.Way[0]];
			var angle = Math.atan2(at.Way[0], at.Way[1]);
			var row;

			for (row = 0; row < 4; row++)
				boxes.push([at.X + left[0] * (far + row * 2.4), at.Y + 0.6 + row * 1.5, at.Z + left[1] * (far + row * 2.4), 2.4, 1.3 + row * 3, 40, angle, [[0.22, 0.34, 0.6], [0.62, 0.2, 0.18], [0.72, 0.6, 0.22]][(i + 6) % 3]]);
		}

		return this.Boxes(boxes);
	},

	/* The picture of a road: dark grain, a white line along each edge. */
	RoadPicture: function () {
		if (typeof document === 'undefined') return null;

		var canvas = document.createElement('canvas');
		var size = 256;
		var paint = canvas.getContext('2d');
		var next = this.Random('road');
		var i;

		canvas.width = canvas.height = size;
		paint.fillStyle = '#3c3d40';

		paint.fillRect(0, 0, size, size);

		for (i = 0; i < 9000; i++) {
			var shade = 44 + Math.floor(next() * 40);

			paint.fillStyle = 'rgb(' + shade + ',' + shade + ',' + (shade + 2) + ')';

			paint.fillRect(next() * size, next() * size, 1.6, 1.6);
		}

		paint.fillStyle = '#e8e8ea';

		paint.fillRect(6, 0, 6, size);
		paint.fillRect(size - 12, 0, 6, size);

		return canvas;
	},

	GrassPicture: function () {
		if (typeof document === 'undefined') return null;

		var canvas = document.createElement('canvas');
		var size = 256;
		var paint = canvas.getContext('2d');
		var next = this.Random('grass');
		var i;

		canvas.width = canvas.height = size;
		paint.fillStyle = '#4a6a2e';

		paint.fillRect(0, 0, size, size);

		for (i = 0; i < 16000; i++) {
			paint.fillStyle = 'rgb(' + Math.floor(50 + next() * 40) + ',' + Math.floor(84 + next() * 56) + ',' + Math.floor(30 + next() * 24) + ')';

			paint.fillRect(next() * size, next() * size, 2, 3);
		}

		return canvas;
	},

	Palette: function (colors) {
		if (typeof document === 'undefined') return null;

		var canvas = document.createElement('canvas');
		var paint = canvas.getContext('2d');

		canvas.width = colors.length * 8;
		canvas.height = 4;

		colors.forEach(function (key, index) {
			var color = key.split(',').map(function (value) {
				return Math.round(Number(value) * 255);
			});

			paint.fillStyle = 'rgb(' + color.join(',') + ')';

			paint.fillRect(index * 8, 0, 8, 4);
		});

		return canvas;
	},

	Asset: function (track) {
		var half = track.Width / 2;
		var kerb = half + 1.3;
		var wall = half + track.Margin;
		var colors = [];
		var self = this;

		function material (name, color, map, rough) {
			return {Name: name, BaseColor: color.concat([1]), Metallic: 0, Roughness: rough, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: map === null ? null : {Image: map}, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: true, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null};
		}

		function stripes (i) {
			return i % 2 ? [0.82, 0.1, 0.08] : [0.92, 0.92, 0.92];
		}

		function bends (point) {
			return point.Bend > 0.05;
		}

		/* What has colors reads them from a picture of all the colors of the track, a cell each. */
		function painted (geometry) {
			var count = geometry.Positions.length / 3;
			var i;

			for (i = 0; i < count; i++) {
				var key = [geometry.Colors[i * 3], geometry.Colors[i * 3 + 1], geometry.Colors[i * 3 + 2]].join();
				if (colors.indexOf(key) === -1)
					colors.push(key);

				geometry.UVs[i * 2] = colors.indexOf(key);
				geometry.UVs[i * 2 + 1] = 0.5;
			}

			geometry.Colors = null;

			return geometry;
		}

		var parts = [
			{Geometry: this.Sheet(track), Material: 0},
			{Geometry: this.Strip(track, -half, half, 0.02), Material: 1},
			{Geometry: this.Strip(track, -kerb, -half, 0.05, bends, stripes), Material: 2},
			{Geometry: this.Strip(track, half, kerb, 0.05, bends, stripes), Material: 2},
			{Geometry: this.Wall(track, -wall, 1.1, function (i) {
				return i % 4 < 2 ? [0.9, 0.9, 0.92] : [0.78, 0.12, 0.1];
			}), Material: 2},
			{Geometry: this.Wall(track, wall, 1.1, function (i) {
				return i % 4 < 2 ? [0.9, 0.9, 0.92] : [0.78, 0.12, 0.1];
			}), Material: 2},
			{Geometry: this.Built(track), Material: 2}
		];

		parts.forEach(function (part) {
			if (part.Geometry.Colors)
				painted(part.Geometry);
		});

		parts.forEach(function (part) {
			var uvs = part.Geometry.UVs;
			var i;

			if (part.Material !== 2) return;

			for (i = 0; i < uvs.length; i += 2)
				uvs[i] = (uvs[i] + 0.5) / colors.length;
		});

		return {
			Nodes: [{Name: 'track', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}],
			Meshes: [parts],
			Lights: [],
			Materials: [material('land', [1, 1, 1], 0, 1), material('road', [1, 1, 1], 1, 0.82), material('painted', [1, 1, 1], 2, 0.7)],
			Images: [{Picture: this.GrassPicture(), Mean: [0.3, 0.45, 0.2]}, {Picture: this.RoadPicture(), Mean: [0.25, 0.25, 0.26]}, {Picture: self.Palette(colors), Mean: [0.6, 0.6, 0.6]}],
			Skins: [],
			Animations: [],
			Scene: [0]
		};
	}
});
