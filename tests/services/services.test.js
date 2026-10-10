import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

describe('Services', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	it('keeps application-scoped service instances isolated', function () {
		Elemenx.Service('PackageStore', {
			Value: 0,
			Inc: function () {
				this.Value++;

				return this.Value;
			}
		});

		Elemenx.Component('PackageAppA', {$Template: '<div>A</div>'});
		Elemenx.Component('PackageAppB', {$Template: '<div>B</div>'});

		document.body.innerHTML = '<div id="a"></div><div id="b"></div>';

		var a = Elemenx.Application('PackageA', {$Component: 'PackageAppA', $Mount: '#a'});
		var b = Elemenx.Application('PackageB', {$Component: 'PackageAppB', $Mount: '#b'});
		var sa = a.$Service('PackageStore');
		var sb = b.$Service('PackageStore');

		expect(sa.Inc()).toBe(1);
		expect(sa.Inc()).toBe(2);
		expect(sb.Inc()).toBe(1);
		expect(sa.$Application()).toBe(a);
		expect(sb.$Application()).toBe(b);

		a.$Destroy();
		b.$Destroy();
	});
});