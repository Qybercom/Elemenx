import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

function hash (value) {
	var h = 5381;
	var i;

	for (i = 0; i < value.length; i++)
		h = (h * 33 + value[i]) >>> 0;

	return h.toString(16) + ':' + value.length;
}

/* The hashes of the bark, its normal map and the leaves the code of SceneFlora drew of each preset. */
var drawn = [['pine', '3646be5c:1048576', 'f73f6bd2:1048576', '334d77cf:2097152'], ['reed', 'b7889c8a:1048576', '84502b2d:1048576', '9dbdd13b:2097152'], ['sunflower', 'd6822bdb:1048576', '82524b50:1048576', 'bfc2733d:2097152']];

/*
 * Regression: the pictures of plants (their bark round the trunk, its normal map, the atlas of their leaves) were drawn in
 * the code alone, their sizes and the steepness of their relief there. They are graphs of pictures of the library now
 * (blueprints/image: bark, each pixel of the graph of its pattern; leaves, an atlas of its block), and each the very one
 * the code drew.
 */
describe('Regression: the pictures of plants, graphs of images of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneFlora', 'service:ImageBlueprints']);
	}, 60000);

	it('draws the bark and the leaves of plants as the code did', function () {
		var flora = Elemenx.Service('SceneFlora');

		drawn.forEach(function (told) {
			var made = flora.Textures(told[0]);

			expect([told[0], hash(made.Bark.Data), hash(made.BarkNormal.Data), hash(made.Leaves.Data)]).toEqual(told);
		});
	});

	it('runs the pictures of the library as code, carried to the workers of plants', function () {
		var flora = Elemenx.Service('SceneFlora');

		flora.Source(['ImageCode']);

		expect(Object.keys(flora.ImageCode).sort()).toEqual(['bark', 'leaves']);
		expect(flora.ImageCode.bark.Told).toEqual(['Color', 'Bump']);
		expect(flora.ImageCode.bark.Image).toEqual({Width: 256, Height: 1024, Strength: 2.5, Wrap: true});
		expect(flora.ImageCode.leaves.Told).toEqual(['Picture']);
		expect(flora.Carried).toContain('ImageCode');
	});
});
