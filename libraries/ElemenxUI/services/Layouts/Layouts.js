/*
 * The places of tiles, cards and pictures in a box: four ways of laying them out, as numbers (nothing is drawn here).
 * - Pack(items, options): a grid of cells packed without holes (a bento, a start screen). An item is {ID, Width, Height}
 *   in cells (1 by default, no wider than the grid), with Row and Column to keep it in its place (when it fits and is
 *   free); the others take the first free place, row by row (Dense false: never before the place of the one before).
 *   Options: Columns (the width of the grid in cells). Returns {Items: [{ID, Item, Row, Column, Width, Height}] in the
 *   order of the items, Rows}.
 * - Masonry(items, options): columns of one width, each item into the shortest one (a wall of cards). An item is {ID,
 *   Height} in pixels, or {ID, Ratio} (its width over its height), with Span (columns it takes, 1 by default). Options:
 *   Width (of the box), Columns, or ColumnWidth (the least width of a column: as many columns as fit), Gap. Returns
 *   {Items: [{ID, Item, Column, X, Y, Width, Height}], Columns, ColumnWidth, Height}.
 * - Justified(items, options): rows of one height filling the width, each picture keeping its shape (a gallery of
 *   photographs). An item is {ID, Ratio}. Options: Width, RowHeight (wanted, 200), MaxRowHeight (a row of few items
 *   grows no taller: 1.5 times RowHeight), Gap, LastRow ('left': at RowHeight, the default; 'justify': filling the
 *   width; 'hide'). Returns {Items: [{ID, Item, Row, X, Y, Width, Height}], Rows: [{Y, Height, Count}], Height}.
 * - Treemap(items, options): rectangles of areas by their Value (squarified: as square as they can be), Children in
 *   the rectangle of their parent (Value the sum of theirs without one). An item is {ID, Value, Children}. Options:
 *   Width, Height, Gap (between siblings), Padding (inside a parent around its children), Header (room on top of a
 *   parent for its name). Returns {Items: [{ID, Item, Depth, Parent, X, Y, Width, Height, Value, Leaf}], Width, Height},
 *   the parents before their children.
 * - Graph(nodes, links, options): the places of the nodes of a graph and the lines of its links, in layers (what depends
 *   on what), a tree, a star, a circle, a grid or by force; auto chooses by the shape of the graph (see Graph below).
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Layouts', {
	$Meta: {
		Description: 'The places of tiles, cards and pictures in a box: a packed grid (bento), masonry, justified rows, a treemap and the nodes of a graph.',
		Methods: ['Pack(items, options)', 'Masonry(items, options)', 'Justified(items, options)', 'Treemap(items, options)', 'Graph(nodes, links, options)']
	},

	/* A number of an option, or a default (a value below the least taken as the least). */
	Number: function (value, fallback, least) {
		var number = Number(value);
		if (!isFinite(number) || value === '' || value === null || value === undefined)
			number = fallback;

		return least !== undefined ? Math.max(least, number) : number;
	},

	Pack: function (items, options) {
		var self = this;
		var columns = Math.floor(this.Number((options || {}).Columns, 8, 1));
		var dense = (options || {}).Dense !== false;
		var rows = [];
		var result = [];
		var waiting = [];
		var cursor = {Row: 0, Column: 0};
		var height = 0;

		/* Whether the cells of a spot are all inside the grid and free. */
		function free (row, column, width, tall) {
			var r;
			var c;

			if (column < 0 || row < 0 || column + width > columns) return false;

			for (r = row; r < row + tall; r++) {
				if (!rows[r]) continue;

				for (c = column; c < column + width; c++) {
					if (rows[r][c]) return false;
				}
			}

			return true;
		}

		function take (spot) {
			var r;
			var c;

			for (r = spot.Row; r < spot.Row + spot.Height; r++) {
				rows[r] = rows[r] || [];

				for (c = spot.Column; c < spot.Column + spot.Width; c++)
					rows[r][c] = true;
			}

			height = Math.max(height, spot.Row + spot.Height);
		}

		(items || []).forEach(function (item, index) {
			var spot = {
				ID: item.ID !== undefined ? item.ID : index,
				Item: item,
				Width: Math.min(columns, Math.floor(self.Number(item.Width, 1, 1))),
				Height: Math.floor(self.Number(item.Height, 1, 1)),
				Row: -1,
				Column: -1
			};
			var row = Number(item.Row);
			var column = Number(item.Column);

			result[index] = spot;

			if (item.Row !== undefined && item.Row !== null && item.Column !== undefined && item.Column !== null && free(row, column, spot.Width, spot.Height)) {
				spot.Row = row;
				spot.Column = column;

				take(spot);
			}
			else {
				waiting.push(spot);
			}
		});

		waiting.forEach(function (spot) {
			var row = dense ? 0 : cursor.Row;
			var column = dense ? 0 : cursor.Column;

			while (!free(row, column, spot.Width, spot.Height)) {
				column++;

				if (column + spot.Width > columns) {
					column = 0;
					row++;
				}
			}

			spot.Row = row;
			spot.Column = column;
			cursor = {Row: row, Column: column + spot.Width};

			take(spot);
		});

		return {Items: result, Rows: height};
	},

	Masonry: function (items, options) {
		var self = this;
		var settings = options || {};
		var width = this.Number(settings.Width, 0, 0);
		var gap = this.Number(settings.Gap, 16, 0);
		var count = settings.Columns ? Math.floor(this.Number(settings.Columns, 1, 1)) : Math.max(1, Math.floor((width + gap) / (this.Number(settings.ColumnWidth, 240, 1) + gap)));
		var column = count ? (width - gap * (count - 1)) / count : 0;
		var heights = [];
		var i;

		for (i = 0; i < count; i++)
			heights.push(0);

		return {
			Items: (items || []).map(function (item, index) {
				var span = Math.min(count, Math.floor(self.Number(item.Span, 1, 1)));
				var wide = column * span + gap * (span - 1);
				var tall = item.Height !== undefined ? self.Number(item.Height, 0, 0) : wide / self.Number(item.Ratio, 1, 0.01);
				var best = 0;
				var top = Infinity;
				var start;
				var at;

				/* The place of the span whose columns end the highest. */
				for (start = 0; start + span <= count; start++) {
					at = Math.max.apply(Math, heights.slice(start, start + span));

					if (at < top) {
						top = at;
						best = start;
					}
				}

				for (i = best; i < best + span; i++)
					heights[i] = top + tall + gap;

				return {ID: item.ID !== undefined ? item.ID : index, Item: item, Column: best, X: best * (column + gap), Y: top, Width: wide, Height: tall};
			}),
			Columns: count,
			ColumnWidth: column,
			Height: Math.max(0, Math.max.apply(Math, heights) - gap)
		};
	},

	Justified: function (items, options) {
		var self = this;
		var settings = options || {};
		var width = this.Number(settings.Width, 0, 0);
		var wanted = this.Number(settings.RowHeight, 200, 1);
		var highest = this.Number(settings.MaxRowHeight, wanted * 1.5, wanted);
		var gap = this.Number(settings.Gap, 8, 0);
		var last = settings.LastRow || 'left';
		var result = [];
		var rows = [];
		var row = [];
		var top = 0;

		/* A row of items at a height: their places from the left. */
		function lay (list, height) {
			var x = 0;

			list.forEach(function (entry) {
				var wide = entry.Ratio * height;

				result[entry.Index] = {ID: entry.ID, Item: entry.Item, Row: rows.length, X: x, Y: top, Width: wide, Height: height};
				x += wide + gap;
			});

			rows.push({Y: top, Height: height, Count: list.length});

			top += height + gap;
		}

		/* The height that makes a row exactly as wide as the box. */
		function fill (list) {
			var ratios = list.reduce(function (sum, entry) {
				return sum + entry.Ratio;
			}, 0);

			return (width - gap * (list.length - 1)) / ratios;
		}

		(items || []).forEach(function (item, index) {
			var entry = {ID: item.ID !== undefined ? item.ID : index, Item: item, Ratio: self.Number(item.Ratio, 1, 0.01), Index: index};
			var before = row.length ? fill(row) : Infinity;

			row.push(entry);

			/*
			 * The row is full when at the wanted height it would be wider than the box: it ends with the item or before it,
			 * at whichever of the two heights is nearer the wanted one.
			 */
			if (fill(row) > wanted) return;

			if (row.length > 1 && Math.abs(before - wanted) < Math.abs(fill(row) - wanted)) {
				row.pop();

				lay(row, Math.min(highest, before));

				row = [entry];
			}
			else {
				lay(row, Math.min(highest, fill(row)));

				row = [];
			}
		});

		if (row.length && last !== 'hide')
			lay(row, last === 'justify' ? Math.min(highest, fill(row)) : Math.min(wanted, fill(row)));

		return {Items: result.filter(Boolean), Rows: rows, Height: Math.max(0, top - gap)};
	},

	Treemap: function (items, options) {
		var self = this;
		var settings = options || {};
		var gap = this.Number(settings.Gap, 2, 0);
		var padding = this.Number(settings.Padding, 4, 0);
		var header = this.Number(settings.Header, 0, 0);
		var width = this.Number(settings.Width, 0, 0);
		var height = this.Number(settings.Height, 0, 0);
		var result = [];

		/* The value of an item: its own, or the sum of those of its children. */
		function value (item) {
			if (item.Children && item.Children.length)
				return item.Children.reduce(function (sum, child) {
					return sum + value(child);
				}, 0);

			return self.Number(item.Value, 0, 0);
		}

		/* The worst ratio of the sides of a row of areas laid along a side of a length. */
		function worst (row, side) {
			var sum = 0;
			var most = 0;
			var least = Infinity;

			row.forEach(function (entry) {
				sum += entry.Area;
				most = Math.max(most, entry.Area);
				least = Math.min(least, entry.Area);
			});

			if (!sum || !least) return Infinity;

			return Math.max(side * side * most / (sum * sum), sum * sum / (side * side * least));
		}

		/* Squarified: rows of areas along the shorter side of what is left, while they do not get thinner. */
		function squarify (entries, box, depth, parent) {
			var left = {X: box.X, Y: box.Y, Width: box.Width, Height: box.Height};
			var row = [];
			var queue = entries.slice();
			var side;
			var next;

			function place (list) {
				var sum = list.reduce(function (total, entry) {
					return total + entry.Area;
				}, 0);
				var across = left.Width >= left.Height;
				var thick = across ? sum / Math.max(1e-9, left.Height) : sum / Math.max(1e-9, left.Width);
				var at = across ? left.Y : left.X;

				list.forEach(function (entry) {
					var length = sum ? entry.Area / thick : 0;
					var rect = across ? {X: left.X, Y: at, Width: thick, Height: length} : {X: at, Y: left.Y, Width: length, Height: thick};

					at += length;

					emit(entry.Item, rect, depth, parent);
				});

				if (across) {
					left.X += thick;
					left.Width -= thick;
				}
				else {
					left.Y += thick;
					left.Height -= thick;
				}
			}

			while (queue.length) {
				side = Math.min(left.Width, left.Height);
				next = queue[0];

				if (!row.length || worst(row.concat(next), side) <= worst(row, side)) {
					row.push(queue.shift());
				}
				else {
					place(row);

					row = [];
				}
			}

			if (row.length)
				place(row);
		}

		/* An item at its rectangle (less half a gap on each side), then its children inside it. */
		function emit (item, rect, depth, parent) {
			var x = rect.X + gap / 2;
			var y = rect.Y + gap / 2;
			var wide = Math.max(0, rect.Width - gap);
			var tall = Math.max(0, rect.Height - gap);
			var children = item.Children && item.Children.length ? item.Children : null;
			var id = item.ID !== undefined ? item.ID : result.length;

			result.push({ID: id, Item: item, Depth: depth, Parent: parent, X: x, Y: y, Width: wide, Height: tall, Value: value(item), Leaf: !children});

			if (children)
				layout(children, {X: x + padding, Y: y + padding + header, Width: Math.max(0, wide - padding * 2), Height: Math.max(0, tall - padding * 2 - header)}, depth + 1, id);
		}

		/* The items of a level in a box: their areas in proportion to their values, the largest first. */
		function layout (list, box, depth, parent) {
			var total = list.reduce(function (sum, item) {
				return sum + value(item);
			}, 0);
			var area = box.Width * box.Height;

			squarify(list.map(function (item) {
				return {Item: item, Area: total ? value(item) / total * area : 0};
			}).filter(function (entry) {
				return entry.Area > 0;
			}).sort(function (a, b) {
				return b.Area - a.Area;
			}), box, depth, parent);
		}

		layout(items || [], {X: -gap / 2, Y: -gap / 2, Width: width + gap, Height: height + gap}, 0, null);

		return {Items: result, Width: width, Height: height};
	},

	/*
	 * The places of the nodes of a graph and the lines of its links. A node is {ID, Width, Height} (in pixels, 120 by 40 by
	 * default), a link {From, To} (the IDs of its nodes; a link to no node is left out). Options: Layout, Direction (right or
	 * down: where layers and a tree go), Gap (40), Center (the node in the middle of a star, else the one with the most
	 * links; at the root of a tree, else one nothing comes into), Directed (false: its links go no way, as the cables of a
	 * network: auto lays it out in no layers), Iterations (of force, 300), Seed (of force).
	 * - layers: a graph of what depends on what, each node a layer after all it comes from (a cycle is broken where it closes
	 *   again), in a layer by the middle of its neighbours, to cross as few links as it can;
	 * - tree: from the root down its links, each parent over the middle of its children (each part of a forest beside the one
	 *   before);
	 * - star: the center in the middle, the others in rings by how many links away they are, each near the one it hangs on
	 *   (those it does not reach in a ring of their own outside);
	 * - circle: all of them round one circle; grid: in rows of a square; force: pulled by their links and pushed apart by each
	 *   other, the same places for the same graph and Seed;
	 * - auto: layers when it has no cycle, a star when one node has links to half of the others or more (three at least), a
	 *   tree when it is one, else force.
	 * Returns {Items: [{ID, Item, X, Y, Width, Height, Layer, Ring}] in the order of the nodes (X and Y their top left, from 0),
	 * Links: [{From, To, Link, Points: [[x, y], [x, y]]}] (from the edge of one to the edge of the other), Width, Height,
	 * Layout (the one used)}.
	 */
	Graph: function (nodes, links, options) {
		var self = this;
		var settings = options || {};
		var gap = this.Number(settings.Gap, 40, 0);
		var down = settings.Direction === 'down';
		var list = (nodes || []).map(function (node, index) {
			return {ID: String(node.ID), Item: node, Index: index, Width: self.Number(node.Width, 120, 1), Height: self.Number(node.Height, 40, 1), X: 0, Y: 0, Layer: 0, Ring: 0};
		});
		var byID = {};
		var edges = [];
		var out = {};
		var into = {};
		var near = {};
		var layout = settings.Layout || 'auto';

		list.forEach(function (node) {
			byID[node.ID] = node;
			out[node.ID] = [];
			into[node.ID] = [];
			near[node.ID] = [];
		});

		(links || []).forEach(function (link) {
			var from = String(link.From);
			var to = String(link.To);
			if (!byID[from] || !byID[to] || from === to) return;

			edges.push({From: from, To: to, Link: link});
			out[from].push(to);
			into[to].push(from);
			near[from].push(to);
			near[to].push(from);
		});

		/* The order of a graph with no cycle (its nodes, the first with nothing coming in first); null when it has one. */
		function sorted () {
			var count = {};
			var queue = [];
			var order = [];

			list.forEach(function (node) {
				count[node.ID] = into[node.ID].length;

				if (!count[node.ID])
					queue.push(node.ID);
			});

			while (queue.length) {
				var id = queue.shift();

				order.push(id);

				out[id].forEach(function (to) {
					count[to]--;

					if (!count[to])
						queue.push(to);
				});
			}

			return order.length === list.length ? order : null;
		}

		function hub () {
			var best = list[0];

			if (settings.Center !== undefined && byID[String(settings.Center)]) return byID[String(settings.Center)];

			list.forEach(function (node) {
				if (near[node.ID].length > near[best.ID].length)
					best = node;
			});

			return best;
		}

		/* How many links away from a node each other is, and the one it was reached from. */
		function rings (start) {
			var seen = {};
			var queue = [start.ID];

			seen[start.ID] = {Ring: 0, From: null};

			while (queue.length) {
				var id = queue.shift();

				near[id].forEach(function (other) {
					if (seen[other]) return;

					seen[other] = {Ring: seen[id].Ring + 1, From: id};

					queue.push(other);
				});
			}

			return seen;
		}

		function connected () {
			return !list.length || Object.keys(rings(list[0])).length === list.length;
		}

		if (layout === 'auto') {
			if (!list.length) layout = 'grid';
			else if (edges.length && settings.Directed !== false && sorted()) layout = 'layers';
			else if (list.length > 3 && near[hub().ID].length >= Math.max(3, (list.length - 1) / 2)) layout = 'star';
			else if (edges.length === list.length - 1 && connected()) layout = 'tree';
			else layout = edges.length ? 'force' : 'grid';
		}

		/* Rows of nodes placed along the way of the layers (or a tree): x along it, y across it, turned when it goes down. */
		function along (node, at, across) {
			if (down) {
				node.X = across;
				node.Y = at;
			}
			else {
				node.X = at;
				node.Y = across;
			}
		}

		function lengthOf (node) {
			return down ? node.Height : node.Width;
		}

		function breadthOf (node) {
			return down ? node.Width : node.Height;
		}

		function layered () {
			var order = sorted();
			var layers = [];
			var place = {};
			var step = 0;
			var pass;

			/* With a cycle: the links that close one again are left out of the layers, by a walk from each node in turn. */
			if (!order) {
				var state = {};
				var kept = {};

				order = [];

				list.forEach(function (node) {
					kept[node.ID] = [];
				});

				(function walk (ids) {
					ids.forEach(function (id) {
						if (state[id]) return;

						state[id] = 1;

						out[id].forEach(function (to) {
							if (state[to] !== 1)
								kept[to].push(id);
						});

						walk(out[id]);

						state[id] = 2;

						order.unshift(id);
					});
				})(list.map(function (node) {
					return node.ID;
				}));

				order.forEach(function (id) {
					byID[id].Layer = kept[id].reduce(function (layer, from) {
						return Math.max(layer, byID[from].Layer + 1);
					}, 0);
				});
			}
			else {
				order.forEach(function (id) {
					byID[id].Layer = into[id].reduce(function (layer, from) {
						return Math.max(layer, byID[from].Layer + 1);
					}, 0);
				});
			}

			list.forEach(function (node) {
				(layers[node.Layer] = layers[node.Layer] || []).push(node);
			});

			layers = layers.filter(Boolean);

			/* Each layer by the middle of the places of its neighbours in the layer before, then in the one after. */
			function number () {
				layers.forEach(function (layer) {
					layer.forEach(function (node, index) {
						place[node.ID] = index;
					});
				});
			}

			number();

			for (pass = 0; pass < 4; pass++) {
				(pass % 2 ? layers.slice().reverse() : layers).forEach(function (layer, index) {
					if (!index) return;

					layer.forEach(function (node) {
						var others = (pass % 2 ? out : into)[node.ID];

						node.Middle = others.length ? others.reduce(function (sum, id) {
							return sum + place[id];
						}, 0) / others.length : place[node.ID];
					});

					layer.sort(function (a, b) {
						return a.Middle - b.Middle || a.Index - b.Index;
					});

					number();
				});
			}

			/* Each layer as long as its longest node, its nodes across it in the middle of the widest layer. */
			var widest = 0;

			layers.forEach(function (layer) {
				widest = Math.max(widest, layer.reduce(function (sum, node) {
					return sum + breadthOf(node);
				}, 0) + gap * (layer.length - 1));
			});

			layers.forEach(function (layer) {
				var size = layer.reduce(function (sum, node) {
					return sum + breadthOf(node);
				}, 0) + gap * (layer.length - 1);
				var across = (widest - size) / 2;
				var longest = 0;

				layer.forEach(function (node) {
					longest = Math.max(longest, lengthOf(node));
				});

				layer.forEach(function (node) {
					along(node, step + (longest - lengthOf(node)) / 2, across);

					across += breadthOf(node) + gap;
				});

				step += longest + gap * 2;
			});
		}

		/* A tree from its root (a forest: from each node not reached yet), leaves side by side, each parent over its children. */
		function treed () {
			var seen = {};
			var children = {};
			var next = 0;
			var depthAt = [];
			var roots = (settings.Center !== undefined && byID[String(settings.Center)] ? [byID[String(settings.Center)]] : []).concat(list.filter(function (node) {
				return !into[node.ID].length;
			}), [hub()], list);

			function grow (root) {
				var queue = [root.ID];

				seen[root.ID] = true;
				root.Layer = 0;

				while (queue.length) {
					var id = queue.shift();

					children[id] = [];

					near[id].forEach(function (other) {
						if (seen[other]) return;

						seen[other] = true;
						byID[other].Layer = byID[id].Layer + 1;

						children[id].push(other);
						queue.push(other);
					});
				}
			}

			function shift (id, by) {
				byID[id].Across += by;

				children[id].forEach(function (child) {
					shift(child, by);
				});
			}

			function across (id) {
				var node = byID[id];
				var start = next;
				var first;
				var last;

				if (!children[id].length) {
					node.Across = next + breadthOf(node) / 2;
					next += breadthOf(node) + gap;

					return;
				}

				children[id].forEach(across);

				first = byID[children[id][0]];
				last = byID[children[id][children[id].length - 1]];
				node.Across = (first.Across + last.Across) / 2;

				/* A parent wider than its children: they and it go on until it starts where they started, and what follows after it. */
				if (node.Across - breadthOf(node) / 2 < start) {
					next += start - (node.Across - breadthOf(node) / 2);

					shift(id, start - (node.Across - breadthOf(node) / 2));
				}

				next = Math.max(next, node.Across + breadthOf(node) / 2 + gap);
			}

			roots.forEach(function (root) {
				if (seen[root.ID]) return;

				grow(root);

				across(root.ID);
			});

			list.forEach(function (node) {
				depthAt[node.Layer] = Math.max(depthAt[node.Layer] || 0, lengthOf(node));
			});

			list.forEach(function (node) {
				var at = 0;
				var level;

				for (level = 0; level < node.Layer; level++)
					at += depthAt[level] + gap * 2;

				along(node, at + (depthAt[node.Layer] - lengthOf(node)) / 2, node.Across - breadthOf(node) / 2);
			});
		}

		function size (node) {
			return Math.max(node.Width, node.Height);
		}

		/* Round a middle: each ring as far out as its nodes need room, each node near the angle of the one it hangs on. */
		function starred () {
			var center = hub();
			var seen = rings(center);
			var groups = [];
			var angle = {};
			var radius = 0;
			var biggest = 0;
			var outer = 0;

			list.forEach(function (node) {
				var ring = seen[node.ID] ? seen[node.ID].Ring : -1;

				biggest = Math.max(biggest, size(node));
				outer = Math.max(outer, ring);
			});

			list.forEach(function (node) {
				node.Ring = seen[node.ID] ? seen[node.ID].Ring : outer + 1;
				(groups[node.Ring] = groups[node.Ring] || []).push(node);
			});

			angle[center.ID] = 0;
			center.X = -center.Width / 2;
			center.Y = -center.Height / 2;

			groups.forEach(function (group, ring) {
				var spread;
				var wanted = {};
				var siblings = {};
				var i;

				if (!ring || !group) return;

				radius = Math.max(radius + biggest + gap, group.length * (biggest + gap) / (Math.PI * 2));
				spread = Math.min(Math.PI * 2 / group.length, (biggest + gap) / radius);

				/* The first ring all round; a ring farther out by the ones it hangs on, its siblings side by side round that angle. */
				group.forEach(function (node, index) {
					var from = seen[node.ID] && ring > 1 && seen[node.ID].Ring === ring ? seen[node.ID].From : '';

					(siblings[from] = siblings[from] || []).push(node);
					node.Order = index;
				});

				Object.keys(siblings).forEach(function (from) {
					siblings[from].forEach(function (node, index) {
						wanted[node.ID] = from ? angle[from] + (index - (siblings[from].length - 1) / 2) * spread : node.Order / group.length * Math.PI * 2;
					});
				});

				group.sort(function (a, b) {
					return wanted[a.ID] - wanted[b.ID] || a.Index - b.Index;
				});

				/* Each at least the room of a node after the one before it, round the whole ring. */
				for (i = 1; i < group.length; i++)
					wanted[group[i].ID] = Math.max(wanted[group[i].ID], wanted[group[i - 1].ID] + spread);

				if (group.length > 1 && wanted[group[group.length - 1].ID] - wanted[group[0].ID] > Math.PI * 2 - spread) {
					group.forEach(function (node, index) {
						wanted[node.ID] = wanted[group[0].ID] + index * Math.PI * 2 / group.length;
					});
				}

				group.forEach(function (node) {
					var turn = wanted[node.ID] - Math.PI / 2;

					angle[node.ID] = wanted[node.ID];
					node.X = Math.cos(turn) * radius - node.Width / 2;
					node.Y = Math.sin(turn) * radius - node.Height / 2;
				});
			});
		}

		function circled () {
			var biggest = list.reduce(function (most, node) {
				return Math.max(most, size(node));
			}, 0);
			var radius = list.length > 1 ? Math.max(biggest, list.length * (biggest + gap) / (Math.PI * 2)) : 0;

			list.forEach(function (node, index) {
				var turn = index / list.length * Math.PI * 2 - Math.PI / 2;

				node.X = Math.cos(turn) * radius - node.Width / 2;
				node.Y = Math.sin(turn) * radius - node.Height / 2;
			});
		}

		function gridded () {
			var columns = Math.max(1, Math.ceil(Math.sqrt(list.length)));
			var width = 0;
			var height = 0;

			list.forEach(function (node) {
				width = Math.max(width, node.Width);
				height = Math.max(height, node.Height);
			});

			list.forEach(function (node, index) {
				node.X = index % columns * (width + gap) + (width - node.Width) / 2;
				node.Y = Math.floor(index / columns) * (height + gap) + (height - node.Height) / 2;
			});
		}

		/* Springs on the links, every node pushing the others away (at rest a node and more apart), cooling as it goes. */
		function forced () {
			var biggest = list.reduce(function (most, node) {
				return Math.max(most, size(node));
			}, 0);
			var k = biggest + gap;
			var count = Math.floor(self.Number(settings.Iterations, 300, 1));
			var seed = 0;
			var text = String(settings.Seed === undefined ? 'graph' : settings.Seed);
			var heat = k * Math.sqrt(list.length);
			var i;
			var step;

			for (i = 0; i < text.length; i++)
				seed = (seed * 31 + text.charCodeAt(i)) >>> 0;

			list.forEach(function (node, index) {
				var turn = index / list.length * Math.PI * 2;

				seed = (seed * 1664525 + 1013904223) >>> 0;

				node.Px = Math.cos(turn) * k * Math.sqrt(list.length) + (seed / 4294967296 - 0.5) * k * 0.1;
				node.Py = Math.sin(turn) * k * Math.sqrt(list.length) + (seed / 4294967296 - 0.5) * k * 0.1;
			});

			for (step = 0; step < count; step++) {
				list.forEach(function (node) {
					node.Dx = 0;
					node.Dy = 0;
				});

				list.forEach(function (a, index) {
					list.slice(index + 1).forEach(function (b) {
						var dx = a.Px - b.Px;
						var dy = a.Py - b.Py;
						var d = Math.max(0.01, Math.hypot(dx, dy));
						var push = k * k / d;

						a.Dx += dx / d * push;
						a.Dy += dy / d * push;
						b.Dx -= dx / d * push;
						b.Dy -= dy / d * push;
					});
				});

				edges.forEach(function (edge) {
					var a = byID[edge.From];
					var b = byID[edge.To];
					var dx = a.Px - b.Px;
					var dy = a.Py - b.Py;
					var d = Math.max(0.01, Math.hypot(dx, dy));
					var pull = d * d / k;

					a.Dx -= dx / d * pull;
					a.Dy -= dy / d * pull;
					b.Dx += dx / d * pull;
					b.Dy += dy / d * pull;
				});

				list.forEach(function (node) {
					var d = Math.max(0.01, Math.hypot(node.Dx, node.Dy));
					var move = Math.min(d, heat);

					node.Px += node.Dx / d * move;
					node.Py += node.Dy / d * move;
				});

				heat = Math.max(k * 0.01, heat * 0.96);
			}

			list.forEach(function (node) {
				node.X = node.Px - node.Width / 2;
				node.Y = node.Py - node.Height / 2;
			});
		}

		if (layout === 'layers') layered();
		else if (layout === 'tree') treed();
		else if (layout === 'star') starred();
		else if (layout === 'circle') circled();
		else if (layout === 'force') forced();
		else gridded();

		/* All of it from 0, 0. */
		var left = Infinity;
		var top = Infinity;
		var right = 0;
		var bottom = 0;

		list.forEach(function (node) {
			left = Math.min(left, node.X);
			top = Math.min(top, node.Y);
		});

		list.forEach(function (node) {
			node.X = Math.round((node.X - left) * 100) / 100;
			node.Y = Math.round((node.Y - top) * 100) / 100;
			right = Math.max(right, node.X + node.Width);
			bottom = Math.max(bottom, node.Y + node.Height);
		});

		/* The point of the edge of a node on the way to another point. */
		function edge (node, to) {
			var cx = node.X + node.Width / 2;
			var cy = node.Y + node.Height / 2;
			var dx = to[0] - cx;
			var dy = to[1] - cy;
			var scale = Math.min(dx ? node.Width / 2 / Math.abs(dx) : Infinity, dy ? node.Height / 2 / Math.abs(dy) : Infinity, 1);

			return [Math.round((cx + dx * scale) * 100) / 100, Math.round((cy + dy * scale) * 100) / 100];
		}

		return {
			Items: list.map(function (node) {
				return {ID: node.ID, Item: node.Item, X: node.X, Y: node.Y, Width: node.Width, Height: node.Height, Layer: node.Layer, Ring: node.Ring};
			}),
			Links: edges.map(function (one) {
				var a = byID[one.From];
				var b = byID[one.To];

				return {From: one.From, To: one.To, Link: one.Link, Points: [edge(a, [b.X + b.Width / 2, b.Y + b.Height / 2]), edge(b, [a.X + a.Width / 2, a.Y + a.Height / 2])]};
			}),
			Width: list.length ? Math.round(right * 100) / 100 : 0,
			Height: list.length ? Math.round(bottom * 100) / 100 : 0,
			Layout: layout
		};
	}
});
