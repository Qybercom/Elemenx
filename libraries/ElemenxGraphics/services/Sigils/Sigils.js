/*
 * Sigils: magic circles of a seed, as data, for whatever draws them: a circle is a list of rings, from the rim to the middle.
 *
 * - Make(seed, options) returns {Seed, Rings: [{Kind, Radius, Width, Count, Step, Speed, Phase, Bright, Seed}]}. Kind: line, double,
 *   ticks, dots, arcs, runes or star. Radius and Width are parts of the radius of the circle, Count how many marks the ring has,
 *   Step how far a star's lines reach, Speed its turns a second (minus the other way), Phase its first turn. Options: Rings, how many
 *   (default 6 to 9); Speed, the speed of them all; Layout, a list of rings in the place of those of the seed: any field left out
 *   comes of the seed, so {Speed: 0.1} alone turns one ring as told.
 * - Uniforms(circle, seconds, spin) returns {uRings, uRingsMore, uRingCount}: what a shader reads, with each ring turned as far as the
 *   time has taken it. The most is Most rings.
 */
Elemenx.Service('Sigils', {
	$Meta: {
		Description: 'Magic circles of a seed, as data: rings of lines, ticks, dots, arcs, runes and stars, each with a turn of its own.',
		Methods: ['Make(seed, options)', 'Uniforms(circle, seconds, spin)']
	},

	$Provides: {Seeded: {Kinds: ['sigil']}},

	/* A circle is a kind of the Seeded Service, made again of its seed. */
	$OnCreate: function () {
		var self = this;

		this.$Service('Seeded').Define('sigil', {
			Version: 1,
			Make: function (params) {
				return self.Make(params.Seed, params);
			}
		});
	},

	Most: 12,

	Kinds: {line: 0, double: 1, ticks: 2, dots: 3, arcs: 4, runes: 5, star: 6},

	Random: function (text) {
		var value = 7;
		var i;

		for (i = 0; i < text.length; i++)
			value = (value * 31 + text.charCodeAt(i)) % 2147483647;

		value = value || 1;

		return function () {
			value = (value * 16807) % 2147483647;

			return value / 2147483647;
		};
	},

	Make: function (seed, options) {
		var settings = options || {};
		var next = this.Random(String(seed === undefined ? 'sigil' : seed));
		var count = Math.min(this.Most, settings.Layout ? settings.Layout.length : settings.Rings || 6 + Math.floor(next() * 4));
		var plans = [['double', 'ticks', 'runes', 'line', 'star', 'arcs', 'runes', 'star', 'dots'], ['double', 'runes', 'dots', 'star', 'line', 'runes', 'ticks', 'star'], ['line', 'arcs', 'runes', 'double', 'star', 'star', 'dots', 'line', 'runes'], ['double', 'dots', 'runes', 'ticks', 'star', 'runes', 'line', 'star', 'arcs']];
		var plan = plans[Math.floor(next() * plans.length)];
		var rings = [];
		var radius = 0.97;
		var way = next() < 0.5 ? 1 : -1;
		var i;

		for (i = 0; i < count; i++) {
			var told = settings.Layout ? settings.Layout[i] : {};
			var kind = told.Kind || plan[i % plan.length];
			var made = {
				Kind: kind,
				Radius: told.Radius === undefined ? radius : told.Radius,
				Width: told.Width === undefined ? (kind === 'runes' ? 0.05 : kind === 'star' ? 0.004 : 0.006) : told.Width,
				Count: told.Count === undefined ? (kind === 'star' ? 5 + Math.floor(next() * 7) : kind === 'runes' ? 12 + Math.floor(next() * 14) : 12 + Math.floor(next() * 48)) : told.Count,
				Step: told.Step === undefined ? 2 + Math.floor(next() * 2) : told.Step,
				Speed: told.Speed === undefined ? (settings.Speed === undefined ? 0.04 + next() * 0.1 : settings.Speed) * way : told.Speed,
				Phase: told.Phase === undefined ? next() : told.Phase,
				Bright: told.Bright === undefined ? 0.7 + next() * 0.3 : told.Bright,
				Seed: next() * 100
			};

			rings.push(made);

			way = -way;
			radius -= (kind === 'runes' ? 0.13 : kind === 'star' ? 0.03 : 0.05) + next() * 0.07;

			if (radius < 0.08)
				radius = 0.08;
		}

		return {Seed: seed, Rings: rings};
	},

	Uniforms: function (circle, seconds, spin) {
		var kinds = this.Kinds;
		var rings = [];
		var more = [];
		var turn = spin === undefined ? 1 : spin;
		var i;

		circle.Rings.slice(0, this.Most).forEach(function (ring) {
			rings.push(ring.Radius, ring.Width, kinds[ring.Kind], ring.Count);
			more.push(((ring.Phase + ring.Speed * turn * seconds) % 1) * Math.PI * 2, ring.Seed, ring.Bright, ring.Step);
		});

		for (i = circle.Rings.length; i < this.Most; i++) {
			rings.push(0, 0, 0, 0);
			more.push(0, 0, 0, 0);
		}

		return {uRings: rings, uRingsMore: more, uRingCount: Math.min(this.Most, circle.Rings.length)};
	}
});
