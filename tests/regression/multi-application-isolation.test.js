import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

var applications = [];

function application (name, definition) {
	var value = Elemenx.Application(name, definition);

	applications.push(value);

	return value;
}

function root (name, definition) {
	Elemenx.Component(name, definition || {$Template: '<div></div>'});

	return name;
}

describe('Regression: multiple Application isolation', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () {
		resetDOM();

		document.body.innerHTML = '<div id="app-a"></div><div id="app-b"></div>';
		applications = [];
	});

	afterEach(function () {
		while (applications.length) {
			if (applications[0] && applications[0].$Destroy)
				applications[0].$Destroy();

			applications.shift();
		}
	});

	it('keeps instances of the same Service definition isolated per Application and destroys only the owner instance', function () {
		var service = unique('SharedService');
		var created = 0;
		var destroyed = 0;

		Elemenx.Service(service, {
			$OnCreate: function () {
				this.Identity = ++created;
			},
			$OnDestroy: function () { destroyed++; }
		});

		var a = application(unique('AppA'), {$Component: root(unique('RootA')), $Mount: '#app-a'});
		var b = application(unique('AppB'), {$Component: root(unique('RootB')), $Mount: '#app-b'});
		var serviceA = a.$Service(service);
		var serviceB = b.$Service(service);
		var identityA = serviceA.Identity;
		var identityB = serviceB.Identity;

		expect(identityA).not.toBe(identityB);
		expect(serviceA.$Application()).toBe(a);
		expect(serviceB.$Application()).toBe(b);

		a.$Destroy();

		applications.splice(applications.indexOf(a), 1);

		expect(destroyed).toBe(1);
		expect(serviceB.Identity).toBe(identityB);
		expect(serviceB.$Application()).toBe(b);
	});

	it('destroying one Application does not invalidate another Application owner accessors', function () {
		var a = application(unique('AppA'), {$Component: root(unique('RootA')), $Mount: '#app-a'});
		var b = application(unique('AppB'), {$Component: root(unique('RootB')), $Mount: '#app-b'});
		var messagingB = b.$Messaging();
		var networkB = b.$Network();

		a.$Destroy();

		applications.splice(applications.indexOf(a), 1);

		expect(function () { messagingB.Send(unique('channel'), {Value: 1}); }).not.toThrow();
		expect(function () { b.$Messaging(); }).not.toThrow();
		expect(function () { b.$Network(); }).not.toThrow();
		expect(networkB).not.toBeNull();

		messagingB.Destroy();
	});

	it('a Component resolves the WebWorker owned by its own Application when another Application uses the same worker name', function () {
		var workerName = unique('SharedWorker');
		var rootA = unique('WorkerRootA');
		var rootB = unique('WorkerRootB');

		Elemenx.Component(rootA, {
			$Template: '<div>A</div>',
			ResolveWorker: function () { return this.$WebWorker(workerName); }
		});
		Elemenx.Component(rootB, {$Template: '<div>B</div>'});

		var workerA = null;
		var workerB = null;
		var a = application(unique('AppA'), {
			$Component: rootA,
			$Mount: '#app-a',
			$Bootstrap: function () {
				workerA = this.$WebWorker(workerName, {Script: '/workers/webworker-bridge.js', StartMode: 'manual'});
			}
		});
		var b = application(unique('AppB'), {
			$Component: rootB,
			$Mount: '#app-b',
			$Bootstrap: function () {
				workerB = this.$WebWorker(workerName, {Script: '/workers/webworker-bridge.js', StartMode: 'manual'});
			}
		});

		expect(workerA).not.toBe(workerB);
		expect(a.$Component().ResolveWorker()).toBe(workerA);
		expect(a.$Component().ResolveWorker()).not.toBe(workerB);
	});

	it('a destroyed Application cannot recreate a ServiceWorker through its saved public method', function () {
		var rootName = root(unique('RootA'));
		var applicationName = unique('AppA');
		var workerName = unique('OwnedServiceWorker');
		var a = application(applicationName, {$Component: rootName, $Mount: '#app-a'});
		var serviceWorker = a.$ServiceWorker;
		var handle = serviceWorker(workerName, {Script: '/serviceworker.js', Scope: '/multi-app-owner/'});

		handle.Destroy();

		a.$Destroy();

		applications.splice(applications.indexOf(a), 1);

		expect(function () {
			serviceWorker(unique('ResurrectedServiceWorker'), {Script: '/serviceworker.js', Scope: '/multi-app-owner-2/'});
		}).toThrow();
	});
});