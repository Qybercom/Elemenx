import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadElemenx } from '../setup.js';

var source;

/* The text of the framework the tests run, with another version when one is given. */
function framework (version) {
	return version ? source.replace(/Version\s*=\s*'[^']*'/, 'Version = \'' + version + '\'') : source;
}

describe('Regression: copies of Elemenx on one page', function () {
	beforeAll(async function () {
		await loadElemenx();

		source = await (await fetch(typeof __ELEMENX_SCRIPT__ === 'string' ? __ELEMENX_SCRIPT__ : '/elemenx.js')).text();
	});

	afterEach(function () {
		vi.restoreAllMocks();
	});

	it('names its version, and a second copy of the same version leaves the first in place', function () {
		var first = window.Elemenx;

		expect(first.Version).toMatch(/^\d+\.\d+\.\d+/);

		(0, eval)(framework());

		expect(window.Elemenx).toBe(first);
	});

	it('lets a copy of another version start without taking the name of the page: it warns', function () {
		var first = window.Elemenx;
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});

		(0, eval)(framework('99.0.0'));

		expect(window.Elemenx).toBe(first);
		expect(warn).toHaveBeenCalledWith('Elemenx 99.0.0 is not the Elemenx of this page: Elemenx ' + first.Version + ' is. A widget beside another Elemenx is an isolated build (elemenx build --widget).');
	});

	it('keeps an isolated copy to its build: its own registries, nothing on the window', function () {
		var first = window.Elemenx;
		var box = {};

		new Function('ElemenxIsolated', framework('99.1.0'))(box);

		expect(window.Elemenx).toBe(first);
		expect(box.Elemenx).not.toBe(first);
		expect(box.Elemenx.Version).toBe('99.1.0');

		box.Elemenx.Locale.Add('en', {isolatedPhrase: 'Only in the widget'});

		expect(box.Elemenx.Locale.Text('isolatedPhrase')).toBe('Only in the widget');
		expect(first.Locale.Text('isolatedPhrase')).toBe('isolatedPhrase');
		expect(box.Elemenx.NoConflict()).toBe(box.Elemenx);
		expect(window.Elemenx).toBe(first);
	});

	it('gives the name back with NoConflict and returns the copy', function () {
		var first = window.Elemenx;

		try {
			expect(first.NoConflict()).toBe(first);
			expect(window.Elemenx).toBe(undefined);
		}
		finally {
			window.Elemenx = first;
		}
	});
});
