import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: Random.Seeded, the one seeded generator of the models, the sowing and the villages', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Random', 'service:SceneModels', 'service:SceneSower', 'service:SceneBiomes']);
	});

	/* The generator written out before in each of them: FNV-1a of the text, then a multiply and xor-shift. */
	function old (text) {
		var value = 2166136261;
		var i;

		for (i = 0; i < text.length; i++)
			value = Math.imul(value ^ text.charCodeAt(i), 16777619);

		return function () {
			value = Math.imul(value ^ value >>> 15, 2246822519) + 1 | 0;

			return (value >>> 0) / 4294967296;
		};
	}

	it('gives the very numbers it gave, in a range too, the same in each Service that had its own', function () {
		var made = Elemenx.Service('Random').Seeded('oak:3');
		var before = old('oak:3');
		var models = Elemenx.Service('SceneModels').Random('oak:3');
		var sower = Elemenx.Service('SceneSower').Random('oak:3');
		var biomes = Elemenx.Service('SceneBiomes').Random('oak:3');
		var i;

		for (i = 0; i < 50; i++) {
			var value = before();

			expect(made()).toBe(value);
			expect(models()).toBe(value);
			expect(sower()).toBe(value);
			expect(biomes()).toBe(value);
		}

		expect(Elemenx.Service('Random').Seeded('x')(2, 4)).toBe(2 + old('x')() * 2);
	});
});
