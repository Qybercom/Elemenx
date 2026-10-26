/*
 * Random numbers of a seed: always the same numbers for the same seed (a map made again, a replay, a picture of
 * Suprematism), or of the time without one.
 * - Create(seed) returns a generator: Next() (0 to 1), Int(min, max) (both in), Float(min, max), Chance(probability),
 *   Pick(list), Weighted(list, weight) (weight: a function of an item, or the name of its field; Weight by default),
 *   Shuffle(list) (a new list), Fork(name) (a generator of its own for a part: the same for the same seed and name),
 *   Seed.
 * - Hash(text): a number of 32 bits of a text.
 * - Noise(seed, size) returns a smooth noise of a plane, noise(x, y) 0 to 1 (size: the cells of one wave, 16 by
 *   default): the ground of a map, clouds.
 */
Elemenx.Service('Random', {
	$Meta: {
		Description: 'Random numbers of a seed: always the same numbers for the same seed.',
		Methods: ['Create(seed)', 'Hash(text)', 'Noise(seed, size)']
	},

	Hash: function (text) {
		var value = String(text === undefined || text === null ? '' : text);
		var hash = 1779033703 ^ value.length;
		var i;

		for (i = 0; i < value.length; i++) {
			hash = Math.imul(hash ^ value.charCodeAt(i), 3432918353);
			hash = (hash << 13) | (hash >>> 19);
		}

		hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
		hash = Math.imul(hash ^ (hash >>> 13), 3266489909);

		return (hash ^ (hash >>> 16)) >>> 0;
	},

	Create: function (seed) {
		var self = this;
		var key = seed === undefined || seed === null ? String(Date.now()) + ':' + Math.random() : String(seed);
		var state = this.Hash(key);
		var generator;

		/* Mulberry32: fast, and its numbers spread well enough for games and pictures. */
		function next () {
			var value;

			state = (state + 0x6D2B79F5) >>> 0;
			value = state;
			value = Math.imul(value ^ (value >>> 15), value | 1);
			value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		}

		generator = {
			Seed: key,
			Next: next,
			Int: function (min, max) {
				var low = Math.ceil(Math.min(min, max));
				var high = Math.floor(Math.max(min, max));

				return low + Math.floor(next() * (high - low + 1));
			},
			Float: function (min, max) {
				return min + next() * (max - min);
			},
			Chance: function (probability) {
				return next() < probability;
			},
			Pick: function (list) {
				return list && list.length ? list[Math.floor(next() * list.length)] : undefined;
			},
			Weighted: function (list, weight) {
				var of = typeof weight === 'function' ? weight : function (item) {
					return item ? Number(item[weight || 'Weight']) : 0;
				};
				var total = 0;
				var point;
				var i;

				for (i = 0; i < (list || []).length; i++) {
					total += Math.max(0, of(list[i]) || 0);
				}

				if (!total)
					return undefined;

				point = next() * total;

				for (i = 0; i < list.length; i++) {
					point -= Math.max(0, of(list[i]) || 0);

					if (point < 0)
						return list[i];
				}

				return list[list.length - 1];
			},
			Shuffle: function (list) {
				var copy = (list || []).slice();
				var i;
				var j;
				var swap;

				for (i = copy.length - 1; i > 0; i--) {
					j = Math.floor(next() * (i + 1));
					swap = copy[i];
					copy[i] = copy[j];
					copy[j] = swap;
				}

				return copy;
			},
			Fork: function (name) {
				return self.Create(key + '/' + name);
			}
		};

		return generator;
	},

	/* Value noise: random heights at the corners of the cells, smoothed between them; two octaves. */
	Noise: function (seed, size) {
		var base = this.Hash(seed);
		var cell = Number(size) > 0 ? Number(size) : 16;

		function corner (x, y) {
			var hash = Math.imul(x, 374761393) + Math.imul(y, 668265263) + base;

			hash = Math.imul(hash ^ (hash >>> 13), 1274126177);

			return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
		}

		function smooth (x, y) {
			var left = Math.floor(x);
			var top = Math.floor(y);
			var u = x - left;
			var v = y - top;
			var a;
			var b;

			u = u * u * (3 - 2 * u);
			v = v * v * (3 - 2 * v);
			a = corner(left, top) + (corner(left + 1, top) - corner(left, top)) * u;
			b = corner(left, top + 1) + (corner(left + 1, top + 1) - corner(left, top + 1)) * u;

			return a + (b - a) * v;
		}

		return function (x, y) {
			return (smooth(x / cell, y / cell) * 2 + smooth(x * 2 / cell + 31.7, y * 2 / cell + 17.3)) / 3;
		};
	}
});
