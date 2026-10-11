import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

var live = [];

function appWithTemplate (template, create) {
	var root = unique('DeferredRoot');

	Elemenx.Component(root, {
		$Template: template,
		$OnCreate: create || function () {}
	});

	var app = Elemenx.Application(unique('DeferredApp'), {
		$Component: root,
		$Root: '/deferred-structural',
		$Mount: '#mount'
	});

	live.push(app);

	return app;
}

async function appReady (app) {
	return await waitFor(function () {
		return app.$Component();
	}, 1500);
}

function destroy (app) {
	var i = live.indexOf(app);

	if (app && app.$Destroy)
		app.$Destroy();

	if (i !== -1)
		live.splice(i, 1);
}

describe('Regression: deferred structural composition', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () {
		resetDOM();

		live = [];
		window.DeferredHeldChildCreates = 0;
		window.DeferredFinalHeldChildCreates = 0;
		window.DeferredNestedParentLoads = 0;
		window.DeferredNestedChildLoads = 0;
		window.DeferredNestedGrandLoads = 0;
	});

	afterEach(function () {
		while (live.length) destroy(live[0]);
	});

	it('nested-chain: remote parent discovers child and grandchild', async function () {
		var app = appWithTemplate('<main><DeferredNestedParent value="{{value}}"></DeferredNestedParent></main>', function () { this.value = 'A'; });

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.deferred-nested-grand'); }, 5000)).not.toBe(false);
		expect(document.querySelector('.deferred-nested-grand').textContent).toBe('G:A');
		expect(window.DeferredNestedParentLoads).toBe(1);
		expect(window.DeferredNestedChildLoads).toBe(1);
		expect(window.DeferredNestedGrandLoads).toBe(1);

		destroy(app);
	});

	it('discovered child keeps its (events) and receives later [prop] updates under the declared spelling', async function () {
		var root = unique('DeferredInputRoot');
		var received = [];
		var app;

		Elemenx.Component(root, {
			$Template: '<main><DeferredInputChild [label]="Text" (ping)="Pinged"></DeferredInputChild></main>',
			Text: 'first',

			Pinged: function (value) {
				received.push(value);
			}
		});

		app = Elemenx.Application(unique('DeferredInputApp'), {
			$Component: root,
			$Root: '/deferred-structural',
			$Mount: '#mount'
		});

		live.push(app);

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.deferred-input-label'); }, 1500)).not.toBe(false);
		expect(document.querySelector('.deferred-input-label').textContent).toBe('first');

		app.$Component().$Update({Text: 'second'});

		expect(document.querySelector('.deferred-input-label').textContent).toBe('second');

		document.querySelector('.deferred-input-ping').click();

		expect(received).toEqual(['second']);

		destroy(app);
	});

	it('nested-concurrent: keyed deferred children coalesce both child and nested-grandchild loads', async function () {
		var app = appWithTemplate('<div><DeferredConcurrentChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredConcurrentChild></div>', function () {
			this.items = [{id: 'a', name: 'A'}, {id: 'b', name: 'B'}, {id: 'c', name: 'C'}];
		});

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-concurrent-grand').length === 3; }, 1500)).toBe(true);
		expect(window.DeferredConcurrentChildLoads).toBe(1);
		expect(window.DeferredConcurrentGrandLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.deferred-concurrent-child')).map(function (n) { return n.firstChild.nodeValue; })).toEqual(['A', 'B', 'C']);

		destroy(app);
	});

	it('nested-keyed-structural: *if owns container and unresolved keyed children preserve identity and refresh', async function () {
		var app = appWithTemplate('<section *if="show"><DeferredKeyedChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredKeyedChild></section>', function () {
			this.show = true;
			this.items = [{id: 'a', name: 'A'}, {id: 'b', name: 'B'}];
		});

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-keyed-child').length === 2; }, 1500)).toBe(true);

		var root = app.$Component();
		var nodes = document.querySelectorAll('.deferred-keyed-child');
		var a = nodes[0];
		var b = nodes[1];

		root.items = [{id: 'b', name: 'B2'}, {id: 'a', name: 'A2'}];

		await tick();

		nodes = document.querySelectorAll('.deferred-keyed-child');

		expect(nodes[0]).toBe(b);
		expect(nodes[1]).toBe(a);
		expect(Array.from(nodes).map(function (n) { return n.textContent; })).toEqual(['B2', 'A2']);

		root.show = false;

		await tick();

		expect(document.querySelectorAll('.deferred-keyed-child').length).toBe(0);

		root.show = true;

		await tick();

		expect(Array.from(document.querySelectorAll('.deferred-keyed-child')).map(function (n) { return n.textContent; })).toEqual(['B2', 'A2']);

		destroy(app);
	});

	it('nested-destroy-pending: destroying Application while nested deferred child script is held prevents resurrection', async function () {
		var head = document.head;
		var append = head.appendChild;
		var held = null;

		head.appendChild = function (node) {
			if (node.tagName === 'SCRIPT' && String(node.src).toLowerCase().indexOf('deferredheldchild.js') !== -1) {
				held = node;

				return node;
			}

			return append.call(this, node);
		};

		try {
			var app = appWithTemplate('<div class="deferred-held-parent"><DeferredHeldChild value="X"></DeferredHeldChild></div>');

			expect(await appReady(app)).not.toBe(false);
			expect(await waitFor(function () { return held; }, 1500)).not.toBe(false);

			destroy(app);

			head.appendChild = append;

			append.call(head, held);

			await tick(120);

			expect(document.querySelector('.deferred-held-child')).toBeNull();
			expect(window.DeferredHeldChildCreates).toBe(0);
		}
		finally {
			head.appendChild = append;
		}
	});

	it('deferred-for-direct: unresolved component works directly under keyed data-for', async function () {
		var app = appWithTemplate('<div><DeferredDirectChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredDirectChild></div>', function () {
			this.items = [{id: 1, name: 'A'}, {id: 2, name: 'B'}];
		});

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-direct-child').length === 2; }, 1500)).toBe(true);

		var nodes = document.querySelectorAll('.deferred-direct-child');
		var a = nodes[0];
		var b = nodes[1];

		app.$Component().items = [{id: 2, name: 'B2'}, {id: 1, name: 'A2'}, {id: 3, name: 'C'}];

		await tick();

		nodes = document.querySelectorAll('.deferred-direct-child');

		expect(nodes[0]).toBe(b);
		expect(nodes[1]).toBe(a);
		expect(Array.from(nodes).map(function (n) { return n.textContent; })).toEqual(['B2', 'A2', 'C']);
		expect(window.DeferredDirectChildLoads).toBe(1);

		destroy(app);
	});

	it('deferred-for-after-preload: remote keyed parent uses an already registered child definition', async function () {
		var app = appWithTemplate('<div class="deferred-preload-host"></div>');

		expect(await appReady(app)).not.toBe(false);

		var child = Elemenx.Component('DeferredPreloadChild')({name: 'PRE'}, null, {Application: app});

		document.querySelector('.deferred-preload-host').appendChild(child.$Element());

		expect(await waitFor(function () { return document.querySelector('.deferred-preload-child'); }, 1500)).not.toBe(false);
		expect(window.DeferredPreloadChildLoads).toBe(1);

		child.$Destroy();

		var parent = Elemenx.Component('DeferredPreloadParent')({}, null, {Application: app});

		document.querySelector('.deferred-preload-host').appendChild(parent.$Element());

		expect(await waitFor(function () { return document.querySelectorAll('.deferred-preload-child').length === 2; }, 1500)).toBe(true);
		expect(window.DeferredPreloadChildLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.deferred-preload-child')).map(function (n) { return n.textContent; })).toEqual(['A', 'B']);

		parent.$Destroy();

		destroy(app);
	});

	it('public discovery path: two unresolved remote tags coalesce during one real root compilation', async function () {
		var app = appWithTemplate('<div><DeferredCompileRemote value="A"></DeferredCompileRemote><DeferredCompileRemote value="B"></DeferredCompileRemote></div>');

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-compile-remote').length === 2; }, 1500)).toBe(true);
		expect(window.DeferredCompileRemoteLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.deferred-compile-remote')).map(function (n) { return n.textContent; })).toEqual(['A', 'B']);

		destroy(app);
	});

	it('public discovery path: second structural instance reuses loaded remote definition', async function () {
		var app = appWithTemplate('<div><section *if="show"><DeferredCacheRemote value="{{value}}"></DeferredCacheRemote></section></div>', function () {
			this.show = true;
			this.value = 'A';
		});

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.deferred-cache-remote'); }, 1500)).not.toBe(false);
		expect(window.DeferredCacheRemoteLoads).toBe(1);

		app.$Component().show = false;

		await tick();

		app.$Component().value = 'B';
		app.$Component().show = true;

		await tick();

		expect(document.querySelector('.deferred-cache-remote').textContent).toBe('B');
		expect(window.DeferredCacheRemoteLoads).toBe(1);

		destroy(app);
	});

	it('public discovery path: Application Destroy while nested RemoteChild script is explicitly held', async function () {
		var head = document.head;
		var append = head.appendChild;
		var held = null;
		var file = 'DeferredFinalHeldChild.js';

		head.appendChild = function (node) {
			if (node.tagName === 'SCRIPT' && String(node.src).toLowerCase().indexOf(file.toLowerCase()) !== -1) {
				held = node;

				return node;
			}

			return append.call(this, node);
		};

		try {
			var app = appWithTemplate('<section><DeferredFinalHeldChild value="FINAL"></DeferredFinalHeldChild></section>');

			expect(await appReady(app)).not.toBe(false);
			expect(await waitFor(function () { return held; }, 1500)).not.toBe(false);

			destroy(app);

			head.appendChild = append;

			append.call(head, held);

			await tick(120);

			expect(document.querySelector('.deferred-final-held-child')).toBeNull();
			expect(window.DeferredFinalHeldChildCreates).toBe(0);
		}
		finally {
			head.appendChild = append;
		}
	});
	it('hybrid bundle parent falls back to Discovery for an unbundled nested child', async function () {
		var parent = unique('DeferredHybridBundledParent');
		var bundle = {Component: {}};

		bundle.Component[parent] = function () {
			Elemenx.Component(parent, {
				$Template: '<section class="deferred-hybrid-bundled-parent"><DeferredHybridRemoteChild value="{{value}}"></DeferredHybridRemoteChild></section>'
			});
		};

		Elemenx.Bundle(bundle);

		window.DeferredHybridRemoteChildLoads = 0;

		var app = appWithTemplate('<main><' + parent + ' value="{{value}}"></' + parent + '></main>', function () {
			this.value = 'HYBRID';
		});

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.deferred-hybrid-remote-child'); }, 1500)).not.toBe(false);
		expect(document.querySelector('.deferred-hybrid-remote-child').textContent).toBe('HYBRID');
		expect(window.DeferredHybridRemoteChildLoads).toBe(1);

		destroy(app);
	});

	it('hybrid discovered parent resolves an unregistered nested child from Bundle without another Discovery request', async function () {
		var bundle = {Component: {}};
		var bundledLoads = 0;

		bundle.Component.DeferredHybridBundledChild = function () {
			bundledLoads++;

			Elemenx.Component('DeferredHybridBundledChild', {
				$Template: '<strong class="deferred-hybrid-bundled-child">{{value}}</strong>'
			});
		};

		Elemenx.Bundle(bundle);

		window.DeferredHybridRemoteParentLoads = 0;

		var app = appWithTemplate('<main><DeferredHybridRemoteParent value="BUNDLE"></DeferredHybridRemoteParent></main>');

		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.deferred-hybrid-bundled-child'); }, 1500)).not.toBe(false);
		expect(document.querySelector('.deferred-hybrid-bundled-child').textContent).toBe('BUNDLE');
		expect(window.DeferredHybridRemoteParentLoads).toBe(1);
		expect(bundledLoads).toBe(1);

		destroy(app);
	});

	it('two Applications keep Bundle and Discovery resolution independent while sharing the global registries', async function () {
		document.body.innerHTML = '<div id="multi-app-a"></div><div id="multi-app-b"></div>';

		var bundledRoot = unique('DeferredMultiAppBundledRoot');
		var bundle = {Component: {}};

		bundle.Component[bundledRoot] = function () {
			Elemenx.Component(bundledRoot, {
				$Template: '<section class="deferred-multi-app-a"><DeferredMultiAppRemoteChild value="A"></DeferredMultiAppRemoteChild></section>'
			});
		};

		Elemenx.Bundle(bundle);

		window.DeferredMultiAppRemoteChildLoads = 0;
		window.DeferredMultiAppRemoteRootLoads = 0;

		var a = Elemenx.Application(unique('DeferredMultiAppA'), {
			$Component: bundledRoot,
			$Root: '/deferred-structural',
			$Mount: '#multi-app-a'
		});
		var b = Elemenx.Application(unique('DeferredMultiAppB'), {
			$Component: 'DeferredMultiAppRemoteRoot',
			$Root: '/deferred-structural',
			$Mount: '#multi-app-b'
		});

		live.push(a);
		live.push(b);

		expect(await waitFor(function () {
			return document.querySelector('.deferred-multi-app-child') && document.querySelector('.deferred-multi-app-b');
		}, 1500)).not.toBe(false);
		expect(document.querySelector('.deferred-multi-app-child').textContent).toBe('A');
		expect(document.querySelector('.deferred-multi-app-b').textContent).toBe('B');
		expect(a.$Component().$Application()).toBe(a);
		expect(b.$Component().$Application()).toBe(b);
		expect(window.DeferredMultiAppRemoteChildLoads).toBe(1);
		expect(window.DeferredMultiAppRemoteRootLoads).toBe(1);

		destroy(a);

		expect(document.querySelector('.deferred-multi-app-a')).toBeNull();
		expect(document.querySelector('.deferred-multi-app-b').textContent).toBe('B');

		destroy(b);
	});

	it('Application lazy TemplateURL root is ready before Router starts', async function () {
		var route = unique('DeferredRouterRoute');
		var router = null;

		Elemenx.Component(route, {$Template: '<article class="deferred-router-route">Ready</article>'});

		var app = Elemenx.Application(unique('DeferredRouterApp'), {
			$Component: 'DeferredRouterRoot',
			$Root: '/deferred-structural',
			$Mount: '#mount',
			$OnReady: function () {
				if (router) return;

				router = Elemenx.Router({
					Root: this.$Component(),
					Routes: [{Path: '/', Component: route}]
				});

				router.Start();
			}
		});

		live.push(app);

		expect(await waitFor(function () { return document.querySelector('.deferred-router-route'); }, 1500)).not.toBe(false);
		expect(document.querySelector('.deferred-router-route').textContent).toBe('Ready');

		if (router)
			router.Destroy();
	});

});