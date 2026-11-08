/*
 * SceneShards: how a solid thing breaks, as geometry. A thing is cut by the cells of points scattered in its box (a
 * Voronoi diagram: each cell the space nearer its point than any other), more of them near where it was hit, so it breaks
 * into smaller pieces there and larger far from it. Each piece keeps the faces of the thing inside its cell, and the faces
 * it was broken along (where the thing was not) are the hull of its corners, of the raw color of what is inside.
 *
 * - Seeds(min, max, count, hit, options): the points of the cells ([[x, y, z]...]) in the box min..max: half of them
 *   (options Near, 0.6) round hit (within options Reach of the size of the box, 0.35), the rest anywhere; options Seed
 *   (any number or text): the same points for the same seed.
 * - Clip(polygon, normal, offset): the part of a polygon ([[x, y, z]...]) where dot(normal, p) <= offset.
 * - Pieces(triangles, seeds): the pieces of triangles ([{Points: [a, b, c], Color}]) cut by the cells of seeds:
 *   [{Seed (its point), Surface: [{Points, Color}] (the faces of the thing in it, as triangles), Corners ([[x, y, z]...]:
 *   every corner of them)}], none for a cell with nothing of it.
 * - Hull(points): the convex hull of points, as triangles ([[a, b, c]...], their corners in turn round its outward
 *   normal); [] when they lie on a plane or are fewer than four.
 * - Random(seed): numbers from 0 to 1, the same for the same seed (a function).
 */
Elemenx.Service('SceneShards', {
	$Meta: {
		Description: 'How a solid thing breaks: Voronoi cells denser near the hit, its triangles cut by them, the convex hull of each piece.',
		Methods: ['Seeds(min, max, count, hit, options)', 'Clip(polygon, normal, offset)', 'Pieces(triangles, seeds)', 'Hull(points)', 'Random(seed)']
	},

	Random: function (seed) {
		var text = String(seed === undefined ? Math.random() : seed);
		var state = 2166136261;
		var i;

		for (i = 0; i < text.length; i++)
			state = Math.imul(state ^ text.charCodeAt(i), 16777619) >>> 0;

		return function () {
			var t;

			state = state + 0x6d2b79f5 >>> 0;
			t = state;
			t = Math.imul(t ^ t >>> 15, t | 1);
			t ^= t + Math.imul(t ^ t >>> 7, t | 61);

			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	},

	Seeds: function (min, max, count, hit, options) {
		var settings = options || {};
		var random = this.Random(settings.Seed);
		var size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
		var largest = Math.max(size[0], size[1], size[2], 1e-6);
		var near = settings.Near === undefined ? 0.6 : Number(settings.Near);
		var reach = (settings.Reach === undefined ? 0.35 : Number(settings.Reach)) * largest;
		var made = [];
		var i;

		for (i = 0; i < Math.max(1, count); i++) {
			var point;

			/* Near the hit: a point in a ball round it, more of them nearer, kept inside the box. */
			if (hit && i < Math.round(count * near)) {
				var r = reach * Math.pow(random(), 1.5);
				var a = random() * Math.PI * 2;
				var z = random() * 2 - 1;
				var s = Math.sqrt(1 - z * z);

				point = [hit[0] + Math.cos(a) * s * r, hit[1] + Math.sin(a) * s * r, hit[2] + z * r];
				point = [0, 1, 2].map(function (k) {
					return Math.max(min[k], Math.min(max[k], point[k]));
				});
			}
			else {
				point = [min[0] + random() * size[0], min[1] + random() * size[1], min[2] + random() * size[2]];
			}

			made.push(point);
		}

		return made;
	},

	Clip: function (polygon, normal, offset) {
		var made = [];
		var count = polygon.length;
		var i;

		function side (p) {
			return normal[0] * p[0] + normal[1] * p[1] + normal[2] * p[2] - offset;
		}

		for (i = 0; i < count; i++) {
			var a = polygon[i];
			var b = polygon[(i + 1) % count];
			var da = side(a);
			var db = side(b);

			if (da <= 0)
				made.push(a);

			/* The edge goes through the plane: the point where it does. */
			if (da <= 0 !== db <= 0) {
				var t = da / (da - db);

				made.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
			}
		}

		return made;
	},

	Pieces: function (triangles, seeds) {
		var self = this;
		var pieces = [];

		seeds.forEach(function (seed, i) {
			var planes = [];
			var piece = {Seed: seed, Surface: [], Corners: []};

			/* The cell of a seed: the side of each plane halfway to another seed that is its own. */
			seeds.forEach(function (other, j) {
				var normal;

				if (i === j) return;

				normal = [other[0] - seed[0], other[1] - seed[1], other[2] - seed[2]];

				if (normal[0] === 0 && normal[1] === 0 && normal[2] === 0) return;

				planes.push({Normal: normal, Offset: normal[0] * (seed[0] + other[0]) / 2 + normal[1] * (seed[1] + other[1]) / 2 + normal[2] * (seed[2] + other[2]) / 2});
			});

			triangles.forEach(function (triangle) {
				var polygon = triangle.Points;
				var k;

				for (k = 0; k < planes.length && polygon.length >= 3; k++)
					polygon = self.Clip(polygon, planes[k].Normal, planes[k].Offset);

				if (polygon.length < 3) return;

				/* A fan of triangles, the polygon being convex. */
				for (k = 1; k + 1 < polygon.length; k++)
					piece.Surface.push({Points: [polygon[0], polygon[k], polygon[k + 1]], Color: triangle.Color});

				polygon.forEach(function (point) {
					piece.Corners.push(point);
				});
			});

			if (piece.Surface.length)
				pieces.push(piece);
		});

		return pieces;
	},

	Hull: function (points) {
		var list = [];
		var faces = [];
		var eps;
		var box = [Infinity, -Infinity];
		var a;
		var b;
		var c;
		var d;
		var i;

		function sub (p, q) {
			return [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
		}

		function cross (p, q) {
			return [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
		}

		function dot (p, q) {
			return p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
		}

		function length (p) {
			return Math.sqrt(dot(p, p));
		}

		function face (x, y, z) {
			var normal = cross(sub(list[y], list[x]), sub(list[z], list[x]));
			var size = length(normal) || 1;

			return {A: x, B: y, C: z, Normal: [normal[0] / size, normal[1] / size, normal[2] / size]};
		}

		function above (one, p) {
			return dot(one.Normal, sub(p, list[one.A])) > eps;
		}

		/* Each point once: corners shared by the faces of a piece come many times. */
		points.forEach(function (p) {
			var seen = list.some(function (q) {
				return Math.abs(p[0] - q[0]) < 1e-7 && Math.abs(p[1] - q[1]) < 1e-7 && Math.abs(p[2] - q[2]) < 1e-7;
			});
			if (!seen)
				list.push(p);

			box[0] = Math.min(box[0], p[0], p[1], p[2]);
			box[1] = Math.max(box[1], p[0], p[1], p[2]);
		});

		if (list.length < 4) return [];

		eps = Math.max(1e-9, (box[1] - box[0]) * 1e-7);

		/* A first tetrahedron: two far apart, the farthest from their line, the farthest from their plane. */
		a = 0;
		b = 0;

		for (i = 1; i < list.length; i++) {
			if (list[i][0] < list[a][0])
				a = i;

			if (list[i][0] > list[b][0])
				b = i;
		}

		if (a === b)
			b = a === 0 ? 1 : 0;

		c = -1;

		for (i = 0, d = 0; i < list.length; i++) {
			var off = length(cross(sub(list[b], list[a]), sub(list[i], list[a])));

			if (off > d) {
				d = off;
				c = i;
			}
		}

		if (c < 0 || d <= eps) return [];

		var base = face(a, b, c);
		var highest = eps * 10;

		d = -1;

		for (i = 0; i < list.length; i++) {
			var height = Math.abs(dot(base.Normal, sub(list[i], list[a])));

			if (height > highest) {
				highest = height;
				d = i;
			}
		}

		if (d < 0)
			return [];

		/* Its faces turned out: away from the fourth corner. */
		if (dot(base.Normal, sub(list[d], list[a])) > 0) {
			faces = [face(a, c, b), face(a, b, d), face(b, c, d), face(c, a, d)];
		}
		else {
			faces = [face(a, b, c), face(a, d, b), face(b, d, c), face(c, d, a)];
		}

		/* Every other point: the faces it sees go, new ones join it to the edge round them. */
		for (i = 0; i < list.length; i++) {
			var p = list[i];
			var seen;
			var edges = {};
			var horizon = [];

			if (i === a || i === b || i === c || i === d) continue;

			seen = faces.filter(function (one) {
				return above(one, p);
			});

			if (!seen.length) continue;

			seen.forEach(function (one) {
				[[one.A, one.B], [one.B, one.C], [one.C, one.A]].forEach(function (edge) {
					edges[edge[0] + ':' + edge[1]] = edge;
				});
			});

			Object.keys(edges).forEach(function (key) {
				var edge = edges[key];
				if (!edges[edge[1] + ':' + edge[0]])
					horizon.push(edge);
			});

			faces = faces.filter(function (one) {
				return seen.indexOf(one) === -1;
			});

			horizon.forEach(function (edge) {
				faces.push(face(edge[0], edge[1], i));
			});
		}

		return faces.map(function (one) {
			return [list[one.A], list[one.B], list[one.C]];
		});
	}
});
