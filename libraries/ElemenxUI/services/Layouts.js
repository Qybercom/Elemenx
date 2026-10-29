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
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Layouts', {
	$Meta: {
		Description: 'The places of tiles, cards and pictures in a box: a packed grid (bento), masonry, justified rows and a treemap.',
		Methods: ['Pack(items, options)', 'Masonry(items, options)', 'Justified(items, options)', 'Treemap(items, options)']
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
	}
});
