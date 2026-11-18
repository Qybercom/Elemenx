import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: Astronomy, the colour of a body by how hot it is', function () {
	var astronomy;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Astronomy']);

		astronomy = Elemenx.Service('Astronomy');
	});

	/* One fit of the colour of a hot body: Color as #rrggbb, the white balance of a camera as light (SceneCamera). */
	it('gives the colour of a body as hot as it is told, and the same as text', function () {
		var sun = astronomy.Blackbody(5772);
		var red = astronomy.Blackbody(2000);
		var blue = astronomy.Blackbody(20000);

		expect(sun[0]).toBe(255);
		expect(red[2]).toBeLessThan(red[1]);
		expect(blue[2]).toBe(255);
		expect(blue[0]).toBeLessThan(255);
		expect(astronomy.Blackbody(500)).toEqual(astronomy.Blackbody(1000));
		expect(astronomy.Color(5772)).toBe('#' + sun.map(function (value) {
			var byte = Math.max(0, Math.min(255, Math.round(value)));

			return (byte < 16 ? '0' : '') + byte.toString(16);
		}).join(''));
	});
});
