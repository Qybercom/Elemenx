import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';
import { Use } from '../library.js';

var screen;
var owned = [];

describe('Contract: Screen, how the screen of the page is held and how large it is', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Screen']);

		screen = Elemenx.Service('Screen');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		owned.forEach(function (component) {
			component.$Destroy();
		});

		owned = [];
	});

	it('tells its orientation, its size and its kind, and marks <html> by them', function () {
		var state = screen.State();
		var classes = document.documentElement.classList;

		expect(state.Orientation).toBe(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
		expect(state.Width).toBe(window.innerWidth);
		expect([0, 90, 180, 270]).toContain(state.Angle);
		expect(state.Narrow).toBe(Math.min(window.innerWidth, window.innerHeight) < 600);
		expect(state.Phone).toBe(state.Narrow && state.Coarse);
		expect(screen.Orientation()).toBe(state.Orientation);
		expect(classes.contains('elemenx-' + state.Orientation)).toBe(true);
		expect(classes.contains(state.Orientation === 'portrait' ? 'elemenx-landscape' : 'elemenx-portrait')).toBe(false);
		expect(classes.contains('elemenx-narrow')).toBe(state.Narrow);
	});

	it('tells a change of the screen once to its listeners and to the event (orientation) of templates', function () {
		var heard = [];
		var listener = function (state) {
			heard.push(state.Width);
		};
		var host = Elemenx.Component(unique('ScreenHost'), {
			$Template: '<div (orientation)="Turned"></div>',
			Turns: [],
			Turned: function (event) {
				this.Turns.push(event.detail.Orientation);
			}
		})();
		var width = window.innerWidth;

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		screen.On('change', listener);

		/* A change of nothing tells nothing; another width once. */
		window.dispatchEvent(new Event('resize'));

		expect(heard).toEqual([]);

		Object.defineProperty(window, 'innerWidth', {configurable: true, value: width + 37});

		try {
			window.dispatchEvent(new Event('resize'));
			window.dispatchEvent(new Event('resize'));
		}
		finally {
			delete window.innerWidth;
		}

		expect(heard).toEqual([width + 37]);
		expect(host.Turns.length).toBe(1);

		screen.Off(listener);

		window.dispatchEvent(new Event('resize'));

		expect(heard.length).toBe(1);
	});

	it('tells an error when nothing can be over the whole screen, and leaves it when nothing is', function () {
		var errors = [];

		screen.Fullscreen(null, {Landscape: true}, function (error) {
			errors.push(error && error.message);
		});

		screen.Exit(function (error) {
			errors.push(error);
		});

		expect(errors).toEqual(['Screen.Fullscreen needs an element of a page.', null]);
		expect(screen.Full()).toBe(false);
	});
});
