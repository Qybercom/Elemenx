/*
 * What can be seen on a grid: lines, the line of sight, the field of view and the fog of war. opaque is a function
 * (x, y) that is true where a cell hides what is behind it, or a grid of Pathfinding (its blocked cells hide).
 * - Line(x0, y0, x1, y1): the cells of the straight line between two cells, [{X, Y}] (Bresenham).
 * - Sight(opaque, x0, y0, x1, y1): whether one cell sees the other: nothing hides between them.
 * - Field(opaque, x, y, radius): the cells seen from a cell within radius (shadowcasting; the walls that hide are
 *   seen): {Cells: [{X, Y}], Count, Has(x, y)}.
 * - Fog(width, height): the fog of war of a map, each cell unknown (0), explored (1) or seen now (2): Get(x, y),
 *   Seen(x, y), Explored(x, y), Show(field) (the cells of a Field seen, and explored for good), Hide() (all that
 *   is seen goes back to explored: before the fields of a new frame), Reveal(opaque, x, y, radius) (Show of a Field),
 *   Reset(), Width, Height, State (the list of the states, row by row).
 */
Elemenx.Service('Visibility', {
	$Meta: {
		Description: 'What can be seen on a grid: lines, the line of sight, the field of view and the fog of war.',
		Methods: ['Line(x0, y0, x1, y1)', 'Sight(opaque, x0, y0, x1, y1)', 'Field(opaque, x, y, radius)', 'Fog(width, height)']
	},

	/* The test of a hiding cell: a function, or a grid with Passable. */
	Opaque: function (opaque) {
		if (typeof opaque === 'function') return opaque;

		if (opaque && typeof opaque.Passable === 'function') {
			return function (x, y) {
				return !opaque.Passable(x, y);
			};
		}

		return function () {
			return false;
		};
	},

	Line: function (x0, y0, x1, y1) {
		var cells = [];
		var x = Math.round(x0);
		var y = Math.round(y0);
		var tx = Math.round(x1);
		var ty = Math.round(y1);
		var dx = Math.abs(tx - x);
		var dy = -Math.abs(ty - y);
		var sx = x < tx ? 1 : -1;
		var sy = y < ty ? 1 : -1;
		var error = dx + dy;
		var twice;

		while (true) {
			cells.push({X: x, Y: y});

			if (x === tx && y === ty) break;

			twice = 2 * error;

			if (twice >= dy) {
				error += dy;
				x += sx;
			}

			if (twice <= dx) {
				error += dx;
				y += sy;
			}
		}

		return cells;
	},

	Sight: function (opaque, x0, y0, x1, y1) {
		var hides = this.Opaque(opaque);
		var cells = this.Line(x0, y0, x1, y1);
		var i;

		for (i = 1; i < cells.length - 1; i++) {
			if (hides(cells[i].X, cells[i].Y)) return false;
		}

		return true;
	},

	/* Recursive shadowcasting, octant by octant: the rows away from the eye, the shadows of the hiding cells cast on the next ones. */
	Field: function (opaque, x, y, radius) {
		var hides = this.Opaque(opaque);
		var range = Math.max(0, Number(radius) || 0);
		var seen = {};
		var cells = [];
		var octants = [[1, 0, 0, 1], [0, 1, 1, 0], [0, -1, 1, 0], [-1, 0, 0, 1], [-1, 0, 0, -1], [0, -1, -1, 0], [0, 1, -1, 0], [1, 0, 0, -1]];
		var ox = Math.round(x);
		var oy = Math.round(y);

		function mark (cx, cy) {
			var key = cx + ',' + cy;
			if (seen[key]) return;

			seen[key] = true;

			cells.push({X: cx, Y: cy});
		}

		function cast (row, start, end, xx, xy, yx, yy) {
			var blocked = false;
			var next = start;
			var distance;
			var dx;
			var dy;
			var cx;
			var cy;
			var left;
			var right;

			if (start < end) return;

			for (distance = row; distance <= range && !blocked; distance++) {
				dy = -distance;

				for (dx = -distance; dx <= 0; dx++) {
					cx = ox + dx * xx + dy * xy;
					cy = oy + dx * yx + dy * yy;
					left = (dx - 0.5) / (dy + 0.5);
					right = (dx + 0.5) / (dy - 0.5);

					if (start < right) continue;
					if (end > left) break;

					if (dx * dx + dy * dy <= range * range)
						mark(cx, cy);

					if (blocked) {
						if (hides(cx, cy)) {
							next = right;

							continue;
						}

						blocked = false;
						start = next;
					}
					else if (hides(cx, cy) && distance < range) {
						blocked = true;

						cast(distance + 1, start, left, xx, xy, yx, yy);

						next = right;
					}
				}
			}
		}

		mark(ox, oy);

		octants.forEach(function (octant) {
			cast(1, 1, 0, octant[0], octant[1], octant[2], octant[3]);
		});

		return {
			Cells: cells,
			Count: cells.length,
			Has: function (cx, cy) {
				return !!seen[cx + ',' + cy];
			}
		};
	},

	Fog: function (width, height) {
		var self = this;
		var w = Math.max(0, Math.floor(Number(width) || 0));
		var h = Math.max(0, Math.floor(Number(height) || 0));
		var state = new Uint8Array(w * h);

		function get (x, y) {
			return x < 0 || y < 0 || x >= w || y >= h ? 0 : state[y * w + x];
		}

		return {
			Width: w,
			Height: h,
			State: state,
			Get: get,
			Seen: function (x, y) {
				return get(x, y) === 2;
			},
			Explored: function (x, y) {
				return get(x, y) > 0;
			},
			Show: function (field) {
				(field && field.Cells || []).forEach(function (cell) {
					if (cell.X >= 0 && cell.Y >= 0 && cell.X < w && cell.Y < h)
						state[cell.Y * w + cell.X] = 2;
				});
			},
			Hide: function () {
				var i;

				for (i = 0; i < state.length; i++) {
					if (state[i] === 2)
						state[i] = 1;
				}
			},
			Reveal: function (opaque, x, y, radius) {
				this.Show(self.Field(opaque, x, y, radius));
			},
			Reset: function () {
				state.fill(0);
			}
		};
	}
});
