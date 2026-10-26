/*
 * Where things are on a plane, found fast: a grid of buckets (a spatial hash). The units of a map under a selection
 * frame, the enemies in the range of a tower, the nearest tree.
 * - Create({Cell}) returns an index (Cell: the side of a bucket, 64 by default; about the size of the things):
 *   - Set(id, x, y, width, height): puts a thing in it, or moves it (width and height 0: a point);
 *   - Remove(id), Has(id), Get(id) ({ID, X, Y, Width, Height}), Count(), Clear(), Each(callback);
 *   - Rect(x, y, width, height, filter): the IDs of the things that touch the rectangle;
 *   - Radius(x, y, radius, filter): the IDs of the things within radius of the point, the nearest first;
 *   - Nearest(x, y, max, filter): {ID, Distance} of the nearest thing (within max, when given), or null.
 *   filter(id, thing) keeps a thing when it returns true.
 * - Distance(x, y, thing): from a point to a thing ({X, Y, Width, Height}): 0 inside it.
 */
Elemenx.Service('Spatial', {
	$Meta: {
		Description: 'Where things are on a plane, found fast: a grid of buckets for the queries of a rectangle, a radius and the nearest.',
		Methods: ['Create(options)', 'Distance(x, y, thing)']
	},

	Distance: function (x, y, thing) {
		var dx = Math.max(thing.X - x, 0, x - (thing.X + (thing.Width || 0)));
		var dy = Math.max(thing.Y - y, 0, y - (thing.Y + (thing.Height || 0)));

		return Math.sqrt(dx * dx + dy * dy);
	},

	Create: function (options) {
		var self = this;
		var cell = options && Number(options.Cell) > 0 ? Number(options.Cell) : 64;
		var things = {};
		var buckets = {};
		var count = 0;

		/* The keys of the buckets a rectangle covers. */
		function keys (x, y, width, height) {
			var result = [];
			var left = Math.floor(x / cell);
			var top = Math.floor(y / cell);
			var right = Math.floor((x + width) / cell);
			var bottom = Math.floor((y + height) / cell);
			var column;
			var row;

			for (row = top; row <= bottom; row++) {
				for (column = left; column <= right; column++) {
					result.push(column + ',' + row);
				}
			}

			return result;
		}

		function unlink (thing) {
			thing.Keys.forEach(function (key) {
				delete buckets[key][thing.Key];

				if (!--buckets[key].$Count)
					delete buckets[key];
			});
		}

		function link (thing) {
			thing.Keys.forEach(function (key) {
				if (!buckets[key])
					buckets[key] = {$Count: 0};

				buckets[key][thing.Key] = thing;
				buckets[key].$Count++;
			});
		}

		function view (thing) {
			return {ID: thing.ID, X: thing.X, Y: thing.Y, Width: thing.Width, Height: thing.Height};
		}

		/* The things of the buckets of a rectangle, each once. */
		function gather (x, y, width, height, callback) {
			var seen = {};

			keys(x, y, width, height).forEach(function (key) {
				var bucket = buckets[key];
				var name;

				if (!bucket) return;

				for (name in bucket) {
					if (name !== '$Count' && !seen[name]) {
						seen[name] = true;

						callback(bucket[name]);
					}
				}
			});
		}

		function kept (filter, thing) {
			return typeof filter !== 'function' || !!filter(thing.ID, view(thing));
		}

		return {
			Set: function (id, x, y, width, height) {
				var key = String(id);
				var thing = things[key];
				var left = Number(x) || 0;
				var top = Number(y) || 0;
				var w = Math.max(0, Number(width) || 0);
				var h = Math.max(0, Number(height) || 0);
				var cells = keys(left, top, w, h);

				if (!thing) {
					thing = things[key] = {ID: id, Key: key, Keys: []};
					count++;
				}

				thing.X = left;
				thing.Y = top;
				thing.Width = w;
				thing.Height = h;

				/* Moved inside the buckets it was in: nothing to link again. */
				if (thing.Keys.join('|') === cells.join('|')) return;

				unlink(thing);

				thing.Keys = cells;

				link(thing);
			},
			Remove: function (id) {
				var thing = things[String(id)];
				if (!thing)
					return false;

				unlink(thing);

				delete things[thing.Key];
				count--;

				return true;
			},
			Has: function (id) {
				return Object.prototype.hasOwnProperty.call(things, String(id));
			},
			Get: function (id) {
				var thing = things[String(id)];

				return thing ? view(thing) : null;
			},
			Count: function () {
				return count;
			},
			Clear: function () {
				things = {};
				buckets = {};
				count = 0;
			},
			Each: function (callback) {
				Object.keys(things).forEach(function (key) {
					callback(things[key].ID, view(things[key]));
				});
			},
			Rect: function (x, y, width, height, filter) {
				var result = [];
				var left = Math.min(x, x + width);
				var top = Math.min(y, y + height);
				var w = Math.abs(width);
				var h = Math.abs(height);

				gather(left, top, w, h, function (thing) {
					if (thing.X <= left + w && thing.X + thing.Width >= left && thing.Y <= top + h && thing.Y + thing.Height >= top && kept(filter, thing))
						result.push(thing.ID);
				});

				return result;
			},
			Radius: function (x, y, radius, filter) {
				var found = [];

				gather(x - radius, y - radius, radius * 2, radius * 2, function (thing) {
					var distance = self.Distance(x, y, thing);
					if (distance <= radius && kept(filter, thing))
						found.push({ID: thing.ID, Distance: distance});
				});

				found.sort(function (a, b) {
					return a.Distance - b.Distance;
				});

				return found.map(function (item) {
					return item.ID;
				});
			},
			/* Rings of buckets round the point, wider and wider, until the nearest found is nearer than the next ring. */
			Nearest: function (x, y, max, filter) {
				var limit = Number(max) > 0 ? Number(max) : Infinity;
				var best = null;
				var seen = {};
				var looked = 0;
				var ring = 0;
				var column = Math.floor(x / cell);
				var row = Math.floor(y / cell);
				var span;
				var c;
				var r;

				function look (key) {
					var bucket = buckets[key];
					var name;
					var distance;

					if (!bucket) return;

					for (name in bucket) {
						if (name !== '$Count' && !seen[name]) {
							seen[name] = true;
							looked++;
							distance = self.Distance(x, y, bucket[name]);

							if (distance <= limit && (!best || distance < best.Distance) && kept(filter, bucket[name]))
								best = {ID: bucket[name].ID, Distance: distance};
						}
					}
				}

				while (count) {
					span = ring;

					for (r = row - span; r <= row + span; r++) {
						for (c = column - span; c <= column + span; c++) {
							if (Math.abs(r - row) === span || Math.abs(c - column) === span)
								look(c + ',' + r);
						}
					}

					/* The things not seen yet are at least ring cells away. */
					if (best && best.Distance <= ring * cell) break;
					if (ring * cell > limit || looked >= count) break;

					ring++;
				}

				return best;
			}
		};
	}
});
