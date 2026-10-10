import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;
function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

describe('Regression: production bundle registry', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('bundled Component is resolved synchronously without Discovery', function () {
		var name = unique('BundledComponent');
		var bundle = {Component: {}};
		var calls = 0;

		bundle.Component[name] = function () {
			calls++;

			Elemenx.Component(name, {$Template: '<strong class="bundled-component">bundle</strong>'});
		};

		Elemenx.Bundle(bundle);

		var factory = Elemenx.Component(name);
		var child = factory();

		expect(calls).toBe(1);
		expect(child.$Element().classList.contains('bundled-component')).toBe(true);
		expect(child.$Element().textContent).toBe('bundle');
		expect(Elemenx.Component(name)).toBe(factory);
		expect(calls).toBe(1);

		child.$Destroy();
	});

	test('bundle Component lookup is case-sensitive', function () {
		var name = unique('BundledCase');
		var bundle = {Component: {}};
		var calls = 0;

		bundle.Component[name] = function () {
			calls++;

			Elemenx.Component(name, {$Template: '<span>case</span>'});
		};

		Elemenx.Bundle(bundle);
		Elemenx.Component(name.toLowerCase());

		expect(calls).toBe(0);
		expect(Elemenx.Component(name)).not.toBeNull();
		expect(calls).toBe(1);
	});

	test('Router resolves bundled NotFound Component without Discovery', async function () {
		var rootName = unique('BundledRouterRoot');
		var notFoundName = unique('BundledRouterNotFound');
		var bundle = {Component: {}};

		Elemenx.Component(rootName, {
			$Template: '<main><div *outlet="Content"></div></main>'
		});

		bundle.Component[notFoundName] = function () {
			Elemenx.Component(notFoundName, {
				$Template: '<section class="bundled-not-found">missing</section>'
			});
		};

		Elemenx.Bundle(bundle);

		var root = Elemenx.Component(rootName)();

		document.body.appendChild(root.$Element());

		var router = Elemenx.Router({
			Root: root,
			Routes: [],
			NotFound: notFoundName
		});

		router.Start();
		router.Go('/bundle-not-found-' + Date.now());

		await new Promise(function (resolve) {
			setTimeout(resolve, 0);
		});

		expect(root.$Element().querySelector('.bundled-not-found').textContent).toBe('missing');

		root.$Destroy();
	});

	test('two bundled Applications start independently when their source graphs are unavailable', async function () {
		document.body.innerHTML = '<div id="bundle-app-a"></div><div id="bundle-app-b"></div>';

		var aName = unique('BundledApplicationA');
		var bName = unique('BundledApplicationB');
		var bundle = {Component: {}};

		bundle.Component[aName] = function () {
			Elemenx.Component(aName, {$Template: '<section class="bundle-app-a">A</section>'});
		};
		bundle.Component[bName] = function () {
			Elemenx.Component(bName, {$Template: '<section class="bundle-app-b">B</section>'});
		};

		Elemenx.Bundle(bundle);

		var a = Elemenx.Application(unique('BundledApplicationInstanceA'), {
			$Component: aName,
			$Root: '/missing-bundle-source-a-' + Date.now(),
			$Mount: '#bundle-app-a'
		});
		var b = Elemenx.Application(unique('BundledApplicationInstanceB'), {
			$Component: bName,
			$Root: '/missing-bundle-source-b-' + Date.now(),
			$Mount: '#bundle-app-b'
		});

		await new Promise(function (resolve) {
			setTimeout(resolve, 100);
		});

		expect(document.querySelector('.bundle-app-a').textContent).toBe('A');
		expect(document.querySelector('.bundle-app-b').textContent).toBe('B');
		expect(a.$Component().$Application()).toBe(a);
		expect(b.$Component().$Application()).toBe(b);

		a.$Destroy();

		expect(document.querySelector('.bundle-app-a')).toBeNull();
		expect(document.querySelector('.bundle-app-b').textContent).toBe('B');

		b.$Destroy();
	});

	test('bundled Application does not probe Discovery when its graph is satisfied by registry and Bundle', async function () {
		document.body.innerHTML = '<div id="bundled-no-discovery-app"></div>';

		var name = unique('BundledNoDiscoveryRoot');
		var bundle = {Component: {}};
		var requests = [];
		var open = XMLHttpRequest.prototype.open;

		bundle.Component[name] = function () {
			Elemenx.Component(name, {$Template: '<section class="bundled-no-discovery-root">bundle</section>'});
		};

		XMLHttpRequest.prototype.open = function (method, url) {
			requests.push(String(url));

			return open.apply(this, arguments);
		};

		try {
			Elemenx.Bundle(bundle);

			var app = Elemenx.Application(unique('BundledNoDiscoveryApplication'), {
				$Component: name,
				$Root: '/bundled-no-discovery-source-' + Date.now(),
				$Mount: '#bundled-no-discovery-app'
			});

			await new Promise(function (resolve) { setTimeout(resolve, 20); });

			expect(document.querySelector('.bundled-no-discovery-root').textContent).toBe('bundle');
			expect(requests).toEqual([]);

			app.$Destroy();
		}
		finally {
			XMLHttpRequest.prototype.open = open;
		}
	});


	test('builds Discovery lazily only when an explicit missing Component is requested', async function () {
		document.body.innerHTML = '<div id="bundle-lazy-mount"></div>';

		var shell = unique('BundleLazyRoot');
		var requests = [];
		var open = XMLHttpRequest.prototype.open;

		Elemenx.Component(shell, {$Template: '<main class="bundle-lazy-root"></main>'});

		XMLHttpRequest.prototype.open = function (method, url) {
			requests.push(String(url));

			return open.apply(this, arguments);
		};

		try {
			var app = Elemenx.Application(unique('BundleLazyApplication'), {
				$Component: shell,
				$Root: '/network',
				$Mount: '#bundle-lazy-mount'
			});

			await new Promise(function (resolve) { setTimeout(resolve, 20); });

			expect(document.querySelector('.bundle-lazy-root')).not.toBeNull();
			expect(requests.some(function (url) { return /network\/index\.js/.test(url); })).toBe(false);

			var remote = Elemenx.Component('RemoteBasic')({value: 'L'}, null, {Application: app});

			document.querySelector('.bundle-lazy-root').appendChild(remote.$Element());

			var found = false;
			var started = Date.now();
			while (!found && Date.now() - started < 1500) {
				found = !!document.querySelector('.remote-basic');

				if (!found)
					await new Promise(function (resolve) { setTimeout(resolve, 10); });
			}

			expect(found).toBe(true);
			expect(requests.some(function (url) { return /network\/index\.js/.test(url); })).toBe(true);

			remote.$Destroy();
			app.$Destroy();
		}
		finally {
			XMLHttpRequest.prototype.open = open;
		}
	});

	test('Application Reload uses Bundle in dist without probing Discovery', function () {
		document.body.innerHTML = '<div id="bundle-reload-mount"></div>';

		var rootName = unique('BundleReloadRoot');
		var componentName = unique('BundleReloadComponent');
		var serviceName = unique('BundleReloadService');
		var componentRevision = 0;
		var serviceRevision = 0;
		var bundle = {Component: {}, Service: {}};
		var requests = [];
		var open = XMLHttpRequest.prototype.open;

		Elemenx.Component(rootName, {$Template: '<main class="bundle-reload-root"></main>'});

		bundle.Component[componentName] = function () {
			componentRevision++;

			Elemenx.Component(componentName, {$Template: '<span class="bundle-reload-child">component ' + componentRevision + '</span>'});
		};
		bundle.Service[serviceName] = function () {
			serviceRevision++;

			Elemenx.Service(serviceName, {Revision: serviceRevision});
		};

		Elemenx.Bundle(bundle);

		XMLHttpRequest.prototype.open = function (method, url) {
			requests.push(String(url));

			return open.apply(this, arguments);
		};

		try {
			var app = Elemenx.Application(unique('BundleReloadApplication'), {
				$Component: rootName,
				$Root: '/missing-bundle-reload-source-' + Date.now(),
				$Mount: '#bundle-reload-mount'
			});
			var child = Elemenx.Component(componentName)({}, null, {Application: app});

			app.$Component().$Element().appendChild(child.$Element());

			var service = app.$Service(serviceName);

			expect(child.$Element().textContent).toBe('component 1');
			expect(service.Revision).toBe(1);

			app.$Reload('Component', componentName);
			app.$Reload('Service', serviceName);

			expect(child.$Element().textContent).toBe('component 1');

			var reloadedChild = Elemenx.Component(componentName)({}, null, {Application: app});

			expect(reloadedChild.$Element().textContent).toBe('component 2');
			expect(app.$Service(serviceName).Revision).toBe(2);
			expect(requests).toEqual([]);

			reloadedChild.$Destroy();
			child.$Destroy();
			app.$Destroy();
		}
		finally {
			XMLHttpRequest.prototype.open = open;
		}
	});
});