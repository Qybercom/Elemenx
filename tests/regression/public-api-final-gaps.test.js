import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

var applications = [];
var originalServiceWorker;

function application (name, definition) {
	var app = Elemenx.Application(name, definition);

	applications.push(app);

	return app;
}

function emitter () {
	var listeners = {};

	return {
		addEventListener: function (name, callback) {
			if (!listeners[name])
				listeners[name] = [];

			listeners[name].push(callback);
		},
		removeEventListener: function (name, callback) {
			var list = listeners[name] || [];
			var i = list.indexOf(callback);
			if (i !== -1)
				list.splice(i, 1);
		},
		emit: function (name, event) {
			var list = (listeners[name] || []).slice();
			var i = 0;
			while (i < list.length) {
				list[i](event || {});

				i++;
			}
		}
	};
}

function serviceWorkerEnvironment () {
	var container = emitter();
	var worker = emitter();
	var registration = emitter();

	worker.state = 'activated';
	worker.postMessage = function () {};
	registration.active = worker;
	registration.waiting = null;
	registration.installing = null;
	registration.update = function () { return Promise.resolve(); };
	registration.unregister = function () { return Promise.resolve(true); };
	container.controller = worker;
	container.register = function () { return Promise.resolve(registration); };
	container.getRegistration = function () { return Promise.resolve(registration); };

	Object.defineProperty(navigator, 'serviceWorker', {
		configurable: true,
		value: container
	});

	return {Container: container, Worker: worker, Registration: registration};
}

describe('Regression: final public API gap contracts', function () {
	beforeAll(async function () {
		await loadElemenx();

		originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
	});

	beforeEach(function () {
		resetDOM();

		applications = [];
	});

	afterEach(function () {
		while (applications.length) applications.pop().$Destroy();

		if (originalServiceWorker) Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
		else delete navigator.serviceWorker;
	});

	it('Application.ServiceWorker returns the owned handle and Application Destroy invalidates it', async function () {
		serviceWorkerEnvironment();

		var component = unique('ApplicationServiceWorkerRoot');
		var workerName = unique('ApplicationServiceWorker');

		Elemenx.Component(component, {$Template: '<div></div>'});

		var app = application(unique('ApplicationServiceWorkerApp'), {$Component: component, $Mount: '#mount'});
		var handle = app.$ServiceWorker(workerName, {
			Script: '/application-owned-service-worker.js',
			Scope: '/application-owned-service-worker/',
			Channel: unique('application-owned-service-worker-channel')
		});

		expect(app.$ServiceWorker(workerName)).toBe(handle);
		expect(await waitFor(function () { return handle.State() === 'Active'; }, 1000)).toBe(true);

		app.$Destroy();

		applications.splice(applications.indexOf(app), 1);

		expect(handle.Reachable()).toBe(false);
		expect(function () { handle.Register(); }).toThrow();
		expect(function () { handle.Update(); }).toThrow();
	});

	it('Application.Reload validates its public contract and reloads a discovered Component', async function () {
		var root = unique('ReloadApplicationRoot');

		Elemenx.Component(root, {$Template: '<div class="reload-application-root"></div>'});

		var app = application(unique('ReloadApplication'), {
			$Component: root,
			$Mount: '#mount',
			$Root: '/final-gap'
		});

		expect(await waitFor(function () { return app.$Component() !== null; }, 1000)).toBe(true);
		expect(function () { app.$Reload('Unknown', 'ReloadProbe'); }).toThrow();

		var result = 'pending';

		app.$Reload('Component', 'ReloadProbe', function (error) {
			result = error || null;
		});

		expect(await waitFor(function () { return result !== 'pending'; }, 1500)).toBe(true);
		expect(result).toBeNull();
		expect(Elemenx.Component('ReloadProbe')).not.toBeNull();
	});

	it('Component.Ref follows conditional structural recreation and never returns the removed node', async function () {
		var name = unique('RefLifecycle');
		var Component = Elemenx.Component(name, {
			$Template: '<main><section *if="show"><span #value>{{value}}</span></section></main>'
		});
		var component = Component({show: true, value: 'A'});

		document.getElementById('mount').appendChild(component.$Element());

		var first = component.$Ref('value');

		expect(first).not.toBeNull();
		expect(first.textContent).toBe('A');

		component.show = false;

		await tick();

		expect(component.$Ref('value')).toBeNull();
		expect(first.isConnected).toBe(false);

		component.value = 'B';
		component.show = true;

		await tick();

		var second = component.$Ref('value');

		expect(second).not.toBeNull();
		expect(second).not.toBe(first);
		expect(second.textContent).toBe('B');

		component.$Destroy();
	});

	it('Component.Router facade survives pre-attachment listeners and resolves the attached Router', async function () {
		var rootName = unique('RouterFacadeRoot');
		var pageName = unique('RouterFacadePage');
		var events = 0;

		Elemenx.Component(rootName, {$Template: '<main *outlet="Content"></main>'});
		Elemenx.Component(pageName, {$Template: '<div class="router-facade-page">PAGE</div>'});

		var app = application(unique('RouterFacadeApplication'), {$Component: rootName, $Mount: '#mount'});
		var component = app.$Component();
		var facade = component.$Router();

		expect(component.$Router()).toBe(facade);
		expect(facade.Current()).toEqual([]);

		facade.On('NavigationEnd', function () { events++; });

		var router = Elemenx.Router({
			Root: component,
			Routes: [{Path: '/final-router-facade', Component: pageName}]
		});

		router.Start();

		expect(component.$Router()).toBe(facade);

		facade.Go('/final-router-facade');

		await tick(60);

		expect(document.querySelector('.router-facade-page')).not.toBeNull();
		expect(events).toBe(1);
		expect(facade.Current().length).toBe(1);

		router.Destroy();

		expect(facade.Current()).toEqual([]);
	});
});