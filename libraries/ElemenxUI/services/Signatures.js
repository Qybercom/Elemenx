/*
 * How much a signature looks like another, or like the samples of a person: a help for an interface (a hint that a
 * signature is not the one on file, a second look for a person), not a check of security: a signature drawn in a
 * browser can be copied, and a page can be made to say anything. A check that matters runs on a server, the same
 * code in Node, against samples the client never sees.
 *
 * A signature is its strokes, [[{X, Y, P, T}]] as SignaturePad gives them (P the pressure, T the milliseconds from the
 * start of the signature; both may be missing). It is compared without its place and its size: centered, scaled, every
 * stroke resampled into points evenly apart.
 * - Compare(a, b): {Score (0 to 1), Parts: {Shape (the paths, by dynamic time warping), Strokes (their number and
 *   lengths), Proportions (its width over its height, the directions it goes), Dynamics (its rhythm and its pressure:
 *   null without T)}}. b may be a reference of Enroll: a against each of its samples, the best of them.
 * - Enroll(samples): a reference of several signatures of one person ({Samples, Mean, Spread, Threshold}): how alike
 *   its samples are to each other gives the score a signature of the person should reach (Threshold, 0.5 to 0.85).
 * - Match(signature, reference, threshold): {Score, Parts, Match (Score >= threshold: the one given, the Threshold of
 *   a reference, or 0.75), Threshold}.
 * - Normalize(signature): the signature as it is compared ({Points: [{X, Y, S, P, T}] (S the number of its stroke), Strokes,
 *   Ratio, Length, Duration}), null without a point.
 */
Elemenx.Service('Signatures', {
	$Meta: {
		Description: 'How much a signature looks like another or like the samples of a person: a help for an interface, not a check of security.',
		Methods: ['Compare(a, b)', 'Enroll(samples)', 'Match(signature, reference, threshold)', 'Normalize(signature)']
	},

	/* The points of a signature after resampling: enough to follow a hand, few enough for a quick comparison. */
	Count: 96,

	/* How much each part weighs in the score (Dynamics only when both have it). */
	Weights: {Shape: 0.5, Strokes: 0.15, Proportions: 0.15, Dynamics: 0.2},

	Normalize: function (signature) {
		var strokes = (signature || []).filter(function (stroke) {
			return stroke && stroke.length;
		});
		var all = [];
		var lengths;
		var total;
		var left = Infinity;
		var top = Infinity;
		var right = -Infinity;
		var bottom = -Infinity;
		var size;
		var center;
		var points = [];
		var count = this.Count;
		var timed;

		strokes.forEach(function (stroke) {
			stroke.forEach(function (point) {
				all.push(point);

				left = Math.min(left, point.X);
				right = Math.max(right, point.X);
				top = Math.min(top, point.Y);
				bottom = Math.max(bottom, point.Y);
			});
		});

		if (!all.length) return null;

		size = Math.max(right - left, bottom - top) || 1;
		center = {X: (left + right) / 2, Y: (top + bottom) / 2};
		timed = all.every(function (point) {
			return typeof point.T === 'number';
		});

		/* The length of each stroke (a dot has a little, so that it keeps a point). */
		lengths = strokes.map(function (stroke) {
			var length = 0;
			var i;

			for (i = 1; i < stroke.length; i++)
				length += Math.sqrt(Math.pow(stroke[i].X - stroke[i - 1].X, 2) + Math.pow(stroke[i].Y - stroke[i - 1].Y, 2));

			return Math.max(length, size * 0.01);
		});
		total = lengths.reduce(function (sum, length) {
			return sum + length;
		}, 0);

		/* Each stroke resampled into points evenly apart, as many as its share of the length. */
		strokes.forEach(function (stroke, index) {
			var wanted = Math.max(2, Math.round(count * lengths[index] / total));
			var step = lengths[index] / (wanted - 1);
			var at = 0;
			var i = 1;
			var walked = 0;
			var piece;
			var share;
			var from;
			var to;
			var k;

			for (k = 0; k < wanted; k++) {
				at = k * step;

				while (i < stroke.length - 1 && walked + Math.sqrt(Math.pow(stroke[i].X - stroke[i - 1].X, 2) + Math.pow(stroke[i].Y - stroke[i - 1].Y, 2)) < at) {
					walked += Math.sqrt(Math.pow(stroke[i].X - stroke[i - 1].X, 2) + Math.pow(stroke[i].Y - stroke[i - 1].Y, 2));

					i++;
				}

				from = stroke[Math.max(0, i - 1)];
				to = stroke[Math.min(stroke.length - 1, i)];
				piece = Math.sqrt(Math.pow(to.X - from.X, 2) + Math.pow(to.Y - from.Y, 2));
				share = piece ? Math.max(0, Math.min(1, (at - walked) / piece)) : 0;

				points.push({
					X: (from.X + (to.X - from.X) * share - center.X) / size,
					Y: (from.Y + (to.Y - from.Y) * share - center.Y) / size,
					S: index,
					P: typeof from.P === 'number' ? from.P + ((typeof to.P === 'number' ? to.P : from.P) - from.P) * share : 0.5,
					T: timed ? from.T + (to.T - from.T) * share : null
				});
			}
		});

		return {
			Points: points,
			Strokes: lengths.map(function (length) {
				return length / total;
			}),
			Ratio: (right - left) / Math.max(1e-9, bottom - top),
			Length: total / size,
			Duration: timed ? all[all.length - 1].T - all[0].T : null
		};
	},

	/* The distance of two paths of points by dynamic time warping (a band of a fifth around the diagonal), per point. */
	Warp: function (a, b) {
		var n = a.length;
		var m = b.length;
		var band = Math.max(Math.abs(n - m), Math.ceil(Math.max(n, m) / 5));
		var previous = [];
		var current;
		var i;
		var j;
		var cost;

		for (j = 0; j <= m; j++)
			previous.push(j ? Infinity : 0);

		for (i = 1; i <= n; i++) {
			current = [Infinity];

			for (j = 1; j <= m; j++) {
				if (Math.abs(i * m / n - j) > band) {
					current.push(Infinity);

					continue;
				}

				cost = Math.sqrt(Math.pow(a[i - 1].X - b[j - 1].X, 2) + Math.pow(a[i - 1].Y - b[j - 1].Y, 2));

				current.push(cost + Math.min(previous[j], previous[j - 1], current[j - 1]));
			}

			previous = current;
		}

		return previous[m] / (n + m);
	},

	/* The directions a path goes, in eight sectors, as shares of its length. */
	Directions: function (points) {
		var bins = [0, 0, 0, 0, 0, 0, 0, 0];
		var total = 0;
		var i;
		var dx;
		var dy;
		var length;

		for (i = 1; i < points.length; i++) {
			if (points[i].S !== points[i - 1].S) continue;

			dx = points[i].X - points[i - 1].X;
			dy = points[i].Y - points[i - 1].Y;
			length = Math.sqrt(dx * dx + dy * dy);
			bins[Math.floor(((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * 8) % 8] += length;
			total += length;
		}

		return bins.map(function (value) {
			return total ? value / total : 0;
		});
	},

	/* How alike two signatures already normalized are: the parts and the score. */
	Alike: function (a, b) {
		var self = this;
		var shape = Math.exp(-this.Warp(a.Points, b.Points) / 0.045);
		var counts = Math.min(a.Strokes.length, b.Strokes.length) / Math.max(a.Strokes.length, b.Strokes.length);
		var shares = 1 - Math.min(1, Math.abs(Math.max.apply(Math, a.Strokes) - Math.max.apply(Math, b.Strokes)));
		var directions = this.Directions(a.Points);
		var others = this.Directions(b.Points);
		var turned = 1 - directions.reduce(function (sum, value, index) {
			return sum + Math.abs(value - others[index]);
		}, 0) / 2;
		var ratio = Math.exp(-Math.abs(Math.log(Math.max(0.05, a.Ratio) / Math.max(0.05, b.Ratio))) * 1.5);
		var parts = {
			Shape: shape,
			Strokes: counts * 0.7 + shares * 0.3,
			Proportions: ratio * 0.5 + turned * 0.5,
			Dynamics: null
		};
		var weights = {};
		var total = 0;
		var score = 0;

		/* The rhythm (the time of each stretch of the path, against the other) and the pressure, when both have a time. */
		if (a.Duration && b.Duration) {
			parts.Dynamics = Math.exp(-Math.abs(Math.log(a.Duration / b.Duration)) * 1.2) * 0.5 + this.Rhythm(a.Points, b.Points) * 0.5;
		}

		Object.keys(this.Weights).forEach(function (name) {
			if (parts[name] === null) return;

			weights[name] = self.Weights[name];
			total += weights[name];
		});

		Object.keys(weights).forEach(function (name) {
			score += parts[name] * weights[name] / total;
		});

		Object.keys(parts).forEach(function (name) {
			if (parts[name] !== null)
				parts[name] = Math.round(parts[name] * 1000) / 1000;
		});

		return {Score: Math.round(score * 1000) / 1000, Parts: parts};
	},

	/* How alike the shares of the time two paths spend on each tenth of their points are, with their pressure. */
	Rhythm: function (a, b) {
		function profile (points) {
			var parts = [];
			var start = points[0].T;
			var end = points[points.length - 1].T;
			var i;

			for (i = 1; i <= 10; i++)
				parts.push(((points[Math.min(points.length - 1, Math.round(i * (points.length - 1) / 10))].T - start) / Math.max(1, end - start)));

			return parts;
		}

		function pressure (points) {
			return points.reduce(function (sum, point) {
				return sum + point.P;
			}, 0) / points.length;
		}

		var left = profile(a);
		var right = profile(b);
		var difference = left.reduce(function (sum, value, index) {
			return sum + Math.abs(value - right[index]);
		}, 0) / left.length;

		return Math.max(0, 1 - difference * 3) * 0.8 + (1 - Math.min(1, Math.abs(pressure(a) - pressure(b)) * 2)) * 0.2;
	},

	Compare: function (a, b) {
		var self = this;
		var left = a && a.Points ? a : this.Normalize(a);
		var samples;
		var best = null;

		if (!left)
			return {Score: 0, Parts: {Shape: 0, Strokes: 0, Proportions: 0, Dynamics: null}};

		samples = b && b.Samples ? b.Samples : [b && b.Points ? b : this.Normalize(b)];

		samples.forEach(function (sample) {
			var result = sample ? self.Alike(left, sample) : null;
			if (result && (!best || result.Score > best.Score))
				best = result;
		});

		return best || {Score: 0, Parts: {Shape: 0, Strokes: 0, Proportions: 0, Dynamics: null}};
	},

	Enroll: function (samples) {
		var self = this;
		var normalized = (samples || []).map(function (sample) {
			return self.Normalize(sample);
		}).filter(Boolean);
		var scores = [];
		var mean;
		var spread;
		var i;
		var j;

		for (i = 0; i < normalized.length; i++) {
			for (j = i + 1; j < normalized.length; j++)
				scores.push(self.Alike(normalized[i], normalized[j]).Score);
		}

		mean = scores.length ? scores.reduce(function (sum, score) {
			return sum + score;
		}, 0) / scores.length : 0.85;
		spread = scores.length > 1 ? Math.sqrt(scores.reduce(function (sum, score) {
			return sum + Math.pow(score - mean, 2);
		}, 0) / scores.length) : 0.05;

		return {
			Samples: normalized,
			Mean: Math.round(mean * 1000) / 1000,
			Spread: Math.round(spread * 1000) / 1000,
			/* A signature of the person scores against its best sample about what the samples score against each other. */
			Threshold: Math.round(Math.max(0.5, Math.min(0.85, mean - 2 * spread - 0.05)) * 1000) / 1000
		};
	},

	Match: function (signature, reference, threshold) {
		var result = this.Compare(signature, reference);
		var limit = typeof threshold === 'number' ? threshold : reference && typeof reference.Threshold === 'number' ? reference.Threshold : 0.75;

		return {Score: result.Score, Parts: result.Parts, Match: result.Score >= limit, Threshold: limit};
	}
});
