/*
 * The differences between two texts (the algorithm of Myers: the shortest list of changes). CodeEditor shows them in
 * its diff view; any component may use them.
 * - Lines(before, after) returns the lines of both texts in order: [{Type: 'same', 'remove' or 'add', Text, Old, New}]
 *   (Old and New: the numbers of the line in each text, from 1, or null where it has none).
 * - Words(before, after) returns where two versions of a line differ: {Before: [{Start, End}], After: [{Start, End}]}
 *   (offsets in each text; words, spaces and signs are the units).
 * - Hunks(lines, context) groups the lines into the changes with context lines around them (3 by default) and the
 *   unchanged runs between them: [{Type: 'change', Lines}] and [{Type: 'fold', Lines}].
 * - Stats(lines): {Added, Removed}.
 */
Elemenx.Service('Diff', {
	/* The shortest edit between two lists (Myers): the operations in order, ['same' | 'remove' | 'add', index]. */
	Edit: function (a, b, equal) {
		var n = a.length;
		var m = b.length;
		var max = n + m;
		var offset = max + 1;
		var v = new Array(2 * max + 3);
		var trace = [];
		var d;
		var k;
		var x;
		var y;
		var result = [];
		var previous;
		var prevK;
		var prevX;
		var prevY;

		v[offset + 1] = 0;

		for (d = 0; d <= max; d++) {
			trace.push(v.slice());

			for (k = -d; k <= d; k += 2) {
				if (k === -d || k !== d && v[offset + k - 1] < v[offset + k + 1]) x = v[offset + k + 1];
				else x = v[offset + k - 1] + 1;

				y = x - k;

				while (x < n && y < m && equal(a[x], b[y])) {
					x++;

					y++;
				}

				v[offset + k] = x;

				if (x >= n && y >= m) {
					d = max + 1;

					break;
				}
			}
		}

		x = n;
		y = m;

		for (d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
			previous = trace[d];
			k = x - y;

			if (k === -d || k !== d && previous[offset + k - 1] < previous[offset + k + 1]) prevK = k + 1;
			else prevK = k - 1;

			prevX = previous[offset + prevK];
			prevY = prevX - prevK;

			while (x > prevX && y > prevY) {
				result.push(['same', x - 1, y - 1]);

				x--;

				y--;
			}

			if (d > 0) {
				if (x === prevX) result.push(['add', null, y - 1]);
				else result.push(['remove', x - 1, null]);
			}

			x = prevX;
			y = prevY;
		}

		return result.reverse();
	},

	Lines: function (before, after) {
		var a = String(before == null ? '' : before).split('\n');
		var b = String(after == null ? '' : after).split('\n');

		return this.Edit(a, b, function (left, right) {
			return left === right;
		}).map(function (step) {
			return {Type: step[0], Text: step[0] === 'add' ? b[step[2]] : a[step[1]], Old: step[1] === null ? null : step[1] + 1, New: step[2] === null ? null : step[2] + 1};
		});
	},

	Words: function (before, after) {
		var units = /\w+|\s+|[^\w\s]/g;
		var a = String(before || '').match(units) || [];
		var b = String(after || '').match(units) || [];
		var starts = function (list) {
			var at = 0;

			return list.map(function (unit) {
				var start = at;

				at += unit.length;

				return start;
			});
		};
		var aStarts = starts(a);
		var bStarts = starts(b);
		var result = {Before: [], After: []};
		var add = function (list, start, end) {
			var last = list[list.length - 1];

			if (last && last.End === start) last.End = end;
			else list.push({Start: start, End: end});
		};

		this.Edit(a, b, function (left, right) {
			return left === right;
		}).forEach(function (step) {
			if (step[0] === 'remove') add(result.Before, aStarts[step[1]], aStarts[step[1]] + a[step[1]].length);
			else if (step[0] === 'add') add(result.After, bStarts[step[2]], bStarts[step[2]] + b[step[2]].length);
		});

		return result;
	},

	Hunks: function (lines, context) {
		var around = context == null ? 3 : Math.max(0, Number(context) || 0);
		var keep = (lines || []).map(function () {
			return false;
		});
		var hunks = [];

		(lines || []).forEach(function (line, index) {
			var i;

			if (line.Type === 'same') return;

			for (i = Math.max(0, index - around); i <= Math.min(lines.length - 1, index + around); i++)
				keep[i] = true;
		});

		(lines || []).forEach(function (line, index) {
			var type = keep[index] ? 'change' : 'fold';
			var last = hunks[hunks.length - 1];

			if (last && last.Type === type) last.Lines.push(line);
			else hunks.push({Type: type, Lines: [line]});
		});

		return hunks;
	},

	Stats: function (lines) {
		var result = {Added: 0, Removed: 0};

		(lines || []).forEach(function (line) {
			if (line.Type === 'add') result.Added++;
			else if (line.Type === 'remove') result.Removed++;
		});

		return result;
	}
});
