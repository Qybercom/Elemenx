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

	it('shows the percent the Application gives with Progress: its attribute, its CSS variable, its bar and its text', async function () {
		var node = splash();

		node.setAttribute('data-progress', '');

		node.innerHTML = '<span class="elemenx-splash-progress" role="progressbar"><span class="elemenx-splash-bar"></span></span><span class="elemenx-splash-percent"></span>';

		Elemenx.Splash.Hold();

		expect(Elemenx.Splash.Progress()).toBe(null);
		expect(Elemenx.Splash.Progress(42.4)).toBe(Elemenx.Splash);
		expect(Elemenx.Splash.Progress()).toBe(42);
		expect(node.getAttribute('data-progress')).toBe('42');
		expect(node.style.getPropertyValue('--elemenx-splash-progress')).toBe('42');
		expect(node.querySelector('.elemenx-splash-progress').getAttribute('aria-valuenow')).toBe('42');
		expect(node.querySelector('.elemenx-splash-percent').textContent).toBe('42%');

		Elemenx.Splash.Progress(150);

		expect(Elemenx.Splash.Progress()).toBe(100);

		Elemenx.Splash.Hide();

		await waitFor(function () {
			return node.classList.contains('elemenx-splash-out');
		});
	});

	it('counts the bytes of the page loaded of its data-total, at most 95 before the ready, then 100', async function () {
		var node = splash();
		var before;

		node.setAttribute('data-progress', '');
		node.setAttribute('data-total', String(1e9));

		Elemenx.Splash.Hold();

		await tick(20);

		before = Number(node.getAttribute('data-progress'));

		/* A file of about 300 KB: the framework itself, fetched again past the cache. */
		await fetch(__ELEMENX_SCRIPT__ + '?splash=' + Date.now()).then(function (response) {
			return response.text();
		});

		node.setAttribute('data-total', String(Math.round(performance.getEntriesByType('resource').reduce(function (sum, entry) {
			return sum + (entry.decodedBodySize || 0);
		}, 0) * 0.5)));

		await fetch(__ELEMENX_SCRIPT__ + '?splash=again' + Date.now()).then(function (response) {
			return response.text();
		});

		await waitFor(function () {
			return Number(node.getAttribute('data-progress')) === 95;
		});

		expect(before).toBeLessThan(95);

		start();

		Elemenx.Splash.Hide();

		expect(node.getAttribute('data-progress')).toBe('100');
	});

	it('goes when the Application fails, so its error shows', async function () {
		var node = splash();

		start({$Template: '<main>{{</main>'});

		await waitFor(function () {
			return node.classList.contains('elemenx-splash-out');
		});
	});
});
