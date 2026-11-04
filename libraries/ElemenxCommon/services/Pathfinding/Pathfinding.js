/*
 * The ways across a map: on a grid of cells, or on a graph of your own.
 * - Grid(width, height, cost) returns a grid of cells, each of a cost to enter (1 by default; Infinity: blocked).
 *   Grid(rows, legend) makes it of rows of text: '.' costs 1, '#' blocks, a digit is its cost, legend {char: cost}
 *   says more. A grid: Width, Height, Get(x, y) (Infinity outside), Set(x, y, cost), Block(x, y), Free(x, y),
 *   Passable(x, y), Clone().
 * - Path(grid, from, to, options): the cheapest way from {X, Y} to {X, Y} (A*), [{X, Y}] from the start to the goal,
 *   or null. Options: Diagonal (true: eight ways), Corners (false: no diagonal step past a blocked side), Nearest
 *   (true: to the reachable cell nearest the goal when the goal cannot be reached: a unit sent into a building),
 *   Limit (the most cells looked at). The costs are 1 or more.
 * - Distances(grid, targets, options): the cost from every cell to the nearest of the targets (Dijkstra), a list of
 *   Width * Height numbers (Infinity: no way).
 * - Flow(grid, targets, options): a flow field to the targets, for many units at once: {Distances, Next(x, y) (the
 *   next cell, or null), Direction(x, y) ({X, Y} of the step: -1, 0 or 1)}.
 * - Search({Start, Goal, Key, Neighbors, Heuristic, Limit}): A* on a graph of your own (Dijkstra without a
 *   Heuristic): Goal(node) is true at the goal (or is the goal, compared by Key), Key(node) its text, Neighbors(node)
 *   [{Node, Cost}]; returns {Path: [nodes], Cost} or null.
 * - Smooth(grid, path): the path without the cells it passes in a straight line: its corners only.
 */
Elemenx.Service('Pathfinding', {
	$Meta: {
		Description: 'The ways across a map: A*, Dijkstra and flow fields on a grid, A* on a graph of your own.',
		Methods: ['Grid(width, height, cost)', 'Path(grid, from, to, options)', 'Distances(grid, targets, options)', 'Flow(grid, targets, options)', 'Search(options)', 'Smooth(grid, path)']
	},

	/* A queue of the cheapest first: a binary heap of items and their priorities. */
	Heap: function () {
		var items = [];
		var priorities = [];

		return {
			Size: function () {
				return items.length;
			},
			Push: function (item, priority) {
				var index = items.length;
				var parent;

				items.push(item);
				priorities.push(priority);

				while (index > 0) {
					parent = (index - 1) >> 1;

					if (priorities[parent] <= priority) break;

					items[index] = items[parent];
					priorities[index] = priorities[parent];
					index = parent;
				}

				items[index] = item;
				priorities[index] = priority;
			},
			Pop: function () {
				var top = items[0];
				var last = items.pop();
				var weight = priorities.pop();
				var index = 0;
				var size = items.length;
				var child;

				if (!size)
					return top;

				while (true) {
					child = index * 2 + 1;

					if (child >= size) break;

					if (child + 1 < size && priorities[child + 1] < priorities[child])
						child++;

					if (priorities[child] >= weight) break;

					items[index] = items[child];
					priorities[index] = priorities[child];
					index = child;
				}

				items[index] = last;
				priorities[index] = weight;

				return top;
			}
		};
	},

	Grid: function (width, height, cost) {
		var rows = Array.isArray(width) ? width : null;
		var legend = rows ? height || {} : null;
		var w = rows ? rows.reduce(function (most, row) {
			return Math.max(most, String(row).length);
		}, 0) : Math.max(0, Math.floor(Number(width) || 0));
		var h = rows ? rows.length : Math.max(0, Math.floor(Number(height) || 0));
		var cells = new Float64Array(w * h);
		var fill = cost === undefined || cost === null ? 1 : Number(cost);
		var x;
		var y;
		var character;

		cells.fill(rows ? Infinity : fill);

		if (rows) {
			for (y = 0; y < h; y++) {
				for (x = 0; x < String(rows[y]).length; x++) {
					character = String(rows[y]).charAt(x);

					if (Object.prototype.hasOwnProperty.call(legend, character)) cells[y * w + x] = Number(legend[character]);
					else if (character === '#') cells[y * w + x] = Infinity;
					else if (/[1-9]/.test(character)) cells[y * w + x] = Number(character);
					else cells[y * w + x] = 1;
				}
			}
		}

		return this.Wrap(w, h, cells);
	},

	Wrap: function (width, height, cells) {
		var self = this;

		return {
			Width: width,
			Height: height,
			Cells: cells,
			Get: function (x, y) {
				return x < 0 || y < 0 || x >= width || y >= height || x % 1 || y % 1 ? Infinity : cells[y * width + x];
			},
			Set: function (x, y, cost) {
				if (x >= 0 && y >= 0 && x < width && y < height)
					cells[y * width + x] = cost === undefined || cost === null ? 1 : Number(cost);
			},
			Block: function (x, y) {
				this.Set(x, y, Infinity);
			},
			Free: function (x, y) {
				this.Set(x, y, 1);
			},
			Passable: function (x, y) {
				return this.Get(x, y) < Infinity;
			},
			Clone: function () {
				return self.Wrap(width, height, new Float64Array(cells));
			}
		};
	},

	/* The steps of a cell: four or eight, the diagonal ones only past open sides unless Corners. */
	Steps: function (grid, index, diagonal, corners, callback) {
		var width = grid.Width;
		var x = index % width;
		var y = (index - x) / width;
		var cells = grid.Cells;
		var open = [x > 0 && cells[index - 1] < Infinity, x < width - 1 && cells[index + 1] < Infinity, y > 0 && cells[index - width] < Infinity, y < grid.Height - 1 && cells[index + width] < Infinity];
		if (open[0])
			callback(index - 1, 1);

		if (open[1])
			callback(index + 1, 1);

		if (open[2])
			callback(index - width, 1);

		if (open[3])
			callback(index + width, 1);

		if (!diagonal) return;

		if (x > 0 && y > 0 && cells[index - width - 1] < Infinity && (corners ? open[0] || open[2] : open[0] && open[2]))
			callback(index - width - 1, Math.SQRT2);

		if (x < width - 1 && y > 0 && cells[index - width + 1] < Infinity && (corners ? open[1] || open[2] : open[1] && open[2]))
			callback(index - width + 1, Math.SQRT2);

		if (x > 0 && y < grid.Height - 1 && cells[index + width - 1] < Infinity && (corners ? open[0] || open[3] : open[0] && open[3]))
			callback(index + width - 1, Math.SQRT2);

		if (x < width - 1 && y < grid.Height - 1 && cells[index + width + 1] < Infinity && (corners ? open[1] || open[3] : open[1] && open[3]))
			callback(index + width + 1, Math.SQRT2);
	},

	Path: function (grid, from, to, options) {
		var settings = options || {};
		var diagonal = settings.Diagonal !== false;
		var corners = !!settings.Corners;
		var limit = Number(settings.Limit) > 0 ? Number(settings.Limit) : Infinity;
		var width = grid.Width;
		var size = width * grid.Height;
		var start = Math.round(from.Y) * width + Math.round(from.X);
		var goal = Math.round(to.Y) * width + Math.round(to.X);
		var gx = Math.round(to.X);
		var gy = Math.round(to.Y);
		var costs = new Float64Array(size);
		var parents = new Int32Array(size);
		var closed = new Uint8Array(size);
		var open = this.Heap();
		var looked = 0;
		var nearest = start;
		var nearestGuess = Infinity;
		var self = this;
		var current;

		function guess (index) {
			var x = index % width;
			var dx = Math.abs(x - gx);
			var dy = Math.abs((index - x) / width - gy);

			return diagonal ? dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy) : dx + dy;
		}

		if (!grid.Passable(Math.round(from.X), Math.round(from.Y))) return null;

		if (goal < 0 || goal >= size || gx < 0 || gx >= width)
			goal = -1;

		costs.fill(Infinity);
		parents.fill(-1);

		costs[start] = 0;

		open.Push(start, guess(start));

		while (open.Size() && looked < limit) {
			current = open.Pop();

			if (closed[current]) continue;

			closed[current] = 1;
			looked++;

			if (current === goal)
				return this.Trace(parents, current, width);

			if (guess(current) < nearestGuess) {
				nearestGuess = guess(current);
				nearest = current;
			}

			self.Steps(grid, current, diagonal, corners, function (next, step) {
				var cost = costs[current] + step * grid.Cells[next];
				if (closed[next] || cost >= costs[next]) return;

				costs[next] = cost;
				parents[next] = current;

				open.Push(next, cost + guess(next));
			});
		}

		return settings.Nearest ? this.Trace(parents, nearest, width) : null;
	},

	Trace: function (parents, index, width) {
		var path = [];
		var at = index;

		while (at !== -1) {
			path.push({X: at % width, Y: Math.floor(at / width)});

			at = parents[at];
		}

		return path.reverse();
	},

	Distances: function (grid, targets, options) {
		var settings = options || {};
		var diagonal = settings.Diagonal !== false;
		var corners = !!settings.Corners;
		var width = grid.Width;
		var distances = new Float64Array(width * grid.Height);
		var open = this.Heap();
		var self = this;
		var current;

		distances.fill(Infinity);

		(Array.isArray(targets) ? targets : [targets]).forEach(function (target) {
			var index = Math.round(target.Y) * width + Math.round(target.X);

			if (grid.Passable(Math.round(target.X), Math.round(target.Y))) {
				distances[index] = 0;

				open.Push(index, 0);
			}
		});

		while (open.Size()) {
			current = open.Pop();

			/* The cost of a step is the one of the cell it leaves: the way back to a target is the way there. */
			self.Steps(grid, current, diagonal, corners, function (next, step) {
				var cost = distances[current] + step * grid.Cells[current];

				if (cost < distances[next]) {
					distances[next] = cost;

					open.Push(next, cost);
				}
			});
		}

		return distances;
	},

	Flow: function (grid, targets, options) {
		var settings = options || {};
		var diagonal = settings.Diagonal !== false;
		var corners = !!settings.Corners;
		var distances = this.Distances(grid, targets, options);
		var width = grid.Width;
		var self = this;

		function next (x, y) {
			var index = y * width + x;
			var best = -1;
			var lowest;

			if (x < 0 || y < 0 || x >= width || y >= grid.Height || !(distances[index] < Infinity) || distances[index] === 0) return null;

			lowest = distances[index];

			self.Steps(grid, index, diagonal, corners, function (step) {
				if (distances[step] < lowest) {
					lowest = distances[step];
					best = step;
				}
			});

			return best === -1 ? null : {X: best % width, Y: Math.floor(best / width)};
		}

		return {
			Distances: distances,
			Next: next,
			Direction: function (x, y) {
				var step = next(x, y);

				return step ? {X: step.X - x, Y: step.Y - y} : {X: 0, Y: 0};
			}
		};
	},

	Search: function (options) {
		var key = typeof options.Key === 'function' ? options.Key : String;
		var heuristic = typeof options.Heuristic === 'function' ? options.Heuristic : function () {
			return 0;
		};
		var goal = typeof options.Goal === 'function' ? options.Goal : function (node) {
			return key(node) === key(options.Goal);
		};
		var limit = Number(options.Limit) > 0 ? Number(options.Limit) : Infinity;
		var records = {};
		var open = this.Heap();
		var looked = 0;
		var first = key(options.Start);
		var current;
		var path;
		var at;

		records[first] = {Node: options.Start, Cost: 0, Parent: null, Closed: false};

		open.Push(first, heuristic(options.Start));

		while (open.Size() && looked < limit) {
			current = records[open.Pop()];

			if (current.Closed) continue;

			current.Closed = true;
			looked++;

			if (goal(current.Node)) {
				path = [];

				for (at = current; at; at = at.Parent) {
					path.push(at.Node);
				}

				return {Path: path.reverse(), Cost: current.Cost};
			}

			(options.Neighbors(current.Node) || []).forEach(function (edge) {
				var name = key(edge.Node);
				var cost = current.Cost + (edge.Cost === undefined ? 1 : Number(edge.Cost));
				var record = records[name];
				if (record && (record.Closed || cost >= record.Cost)) return;

				records[name] = {Node: edge.Node, Cost: cost, Parent: current, Closed: false};

				open.Push(name, cost + heuristic(edge.Node));
			});
		}

		return null;
	},

	/* Whether the cells under the straight line between two cells are all open (a supercover line: every cell it touches). */
	Straight: function (grid, from, to) {
		var x = from.X;
		var y = from.Y;
		var dx = Math.abs(to.X - from.X);
		var dy = Math.abs(to.Y - from.Y);
		var sx = to.X > from.X ? 1 : -1;
		var sy = to.Y > from.Y ? 1 : -1;
		var i = 0;
		var j = 0;

		while (i < dx || j < dy) {
			if ((0.5 + i) / dx === (0.5 + j) / dy) {
				if (!grid.Passable(x + sx, y) || !grid.Passable(x, y + sy)) return false;

				x += sx;
				y += sy;
				i++;
				j++;
			}
			else if (dy === 0 || (dx && (0.5 + i) / dx < (0.5 + j) / dy)) {
				x += sx;
				i++;
			}
			else {
				y += sy;
				j++;
			}

			if (!grid.Passable(x, y)) return false;
		}

		return true;
	},

	Smooth: function (grid, path) {
		var result;
		var anchor = 0;
		var i;

		if (!path || path.length < 3)
			return path ? path.slice() : path;

		result = [path[0]];

		for (i = 2; i < path.length; i++) {
			if (!this.Straight(grid, path[anchor], path[i])) {
				result.push(path[i - 1]);

				anchor = i - 1;
			}
		}

		result.push(path[path.length - 1]);

		return result;
	}
});
