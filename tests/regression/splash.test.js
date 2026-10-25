import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

var applications = [];

/* The splash a build puts at the top of the body. */
function splash (min) {
	var node = document.createElement('div');

	node.id = 'elemenx-splash';

	node.setAttribute('data-min', String(min || 0));
	node.setAttribute('data-timeout', '0');

	document.body.insertBefore(node, document.body.firstChild);

	return node;
}

function start (definition) {
	var component = unique('SplashRoot');
	var app;

	Elemenx.Component(component, definition || {$Template: '<main class="splash-root">ready</main>'});

	app = Elemenx.Application(unique('SplashApplication'), {$Component: component, $Mount: '#mount'});

	applications.push(app);

	return app;
}

describe('Contract: Elemenx.Splash, the splash of the page', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		var node = document.getElementById('elemenx-splash');

		while (applications.length) applications.pop().$Destroy();

		if (node)
			node.remove();
	});

	it('fades and leaves the page when the first Application is ready', async function () {
		var node = splash();

		expect(Elemenx.Splash.Visible()).toBe(true);

		start();

		await waitFor(function () {
			return node.classList.contains('elemenx-splash-out');
		});

		expect(Elemenx.Splash.Visible()).toBe(false);

		await waitFor(function () {
			return !node.isConnected;
		});
	});

	it('stays while it is held, past the ready, until Hide', async function () {
		var node = splash();

		expect(Elemenx.Splash.Hold()).toBe(Elemenx.Splash);

		start();

		await tick(80);

		expect(document.querySelector('.splash-root')).not.toBe(null);
		expect(node.classList.contains('elemenx-splash-out')).toBe(false);
		expect(Elemenx.Splash.Visible()).toBe(true);

		expect(Elemenx.Splash.Hide()).toBe(Elemenx.Splash);

		await waitFor(function () {
			return node.classList.contains('elemenx-splash-out');
		});
	});

	it('stays its least time, counted from the start of the page', async function () {
		var node = splash(performance.now() + 150);

		start();

		await tick(60);

		expect(node.classList.contains('elemenx-splash-out')).toBe(false);

		await waitFor(function () {
			return node.classList.contains('elemenx-splash-out');
		});
	});

	it('goes when the Application fails, so its error shows', async function () {
		var node = splash();

		start({$Template: '<main>{{</main>'});

		await waitFor(function () {
			return node.classList.contains('elemenx-splash-out');
		});
	});
});
