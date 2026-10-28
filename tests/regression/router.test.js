import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

function boot (routes, events, notFound) {
	var root = unique('RouterRoot');
	var appName = unique('RouterApp');
	var trace = [];

	Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});

	var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
	var router = Elemenx.Router({Root: app.$Component(), Routes: routes, NotFound: notFound});
	var i = 0;
	while (events && i < events.length) {
		(function (n) { router.On(n, function () {trace.push(n);}); })(events[i]);

		i++;
	}

	router.Start();

	return {App: app, Router: router, Trace: trace};
}

describe('Regression: Router / Guards', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('stale pending guard cannot override a newer navigation', async function () {
		var slow = unique('Slow');
		var home = unique('Home');
		var sp = unique('SlowPage');
		var fp = unique('FastPage');
		var release = null;

		/* The guard answers when the test says so, after the newer navigation: timers raced on a loaded machine. */
		Elemenx.Guard(slow, function () {return this.$Wait(function (done) {release = done;});});
		Elemenx.Component(home, {$Template: '<div>HOME</div>'});
		Elemenx.Component(sp, {$Template: '<div id="slow">SLOW</div>'});
		Elemenx.Component(fp, {$Template: '<div id="fast">FAST</div>'});

		var x = boot([{Path: '/', Component: home}, {Path: '/slow', Component: sp, Guard: slow}, {Path: '/fast', Component: fp}]);

		x.Router.Go('/slow');

		expect(await waitFor(function () {return release;}, 3000)).toBeTruthy();

		x.Router.Go('/fast');

		expect(await waitFor(function () {return document.getElementById('fast');}, 3000)).toBeTruthy();

		release(true);

		await tick(20);

		expect(document.getElementById('fast')).not.toBeNull();
		expect(document.getElementById('slow')).toBeNull();
		expect(location.pathname).toBe('/fast');

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('Destroy invalidates a pending guarded navigation', async function () {
		var guard = unique('DestroyGuard');
		var page = unique('DestroyPage');
		var release = null;

		Elemenx.Guard(guard, function () {return this.$Wait(function (done) {release = done;});});
		Elemenx.Component(page, {$Template: '<div id="destroy-page">PAGE</div>'});

		var x = boot([{Path: '/destroy-pending', Component: page, Guard: guard}]);

		x.Router.Go('/destroy-pending');

		expect(await waitFor(function () {return release;}, 3000)).toBeTruthy();

		x.Router.Destroy();

		release(true);

		await tick(20);

		expect(document.getElementById('destroy-page')).toBeNull();

		x.App.$Destroy();
	});

	it('emits navigation event order around a guard', async function () {
		var guard = unique('OrderGuard');
		var page = unique('OrderPage');

		Elemenx.Guard(guard, function () {return true;});
		Elemenx.Component(page, {$Template: '<div id="order-page">OK</div>'});

		var events = ['NavigationStart', 'GuardStart', 'GuardEnd', 'NavigationCommit', 'NavigationEnd'];
		var x = boot([{Path: '/order', Component: page, Guard: guard}], events);

		x.Router.Go('/order');

		await tick(60);

		expect(x.Trace.join('|')).toBe(events.join('|'));

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('guard Context.Service resolves the Router Application service instance', async function () {
		var service = unique('GuardService');
		var guard = unique('GuardServiceCheck');
		var page = unique('GuardServicePage');

		Elemenx.Service(service, {Authorized: false});
		Elemenx.Guard(guard, function () {return this.$Service(service).Authorized;});
		Elemenx.Component(page, {$Template: '<div id="guard-service-page">OK</div>'});

		var x = boot([{Path: '/guard-service', Component: page, Guard: guard}]);

		x.App.$Service(service).Authorized = true;

		x.Router.Go('/guard-service');

		await tick(40);

		expect(document.getElementById('guard-service-page')).not.toBeNull();
		expect(location.pathname).toBe('/guard-service');

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('guard uses this as its complete execution context and receives no args', async function () {
		var guard = unique('GuardContext');
		var page = unique('GuardContextPage');
		var received = -1;
		var context = null;

		Elemenx.Guard(guard, function () {
			received = arguments.length;
			context = this;

			if (!this.$From || !this.$To || !this.$Route || !this.$Guard) return this.$Fail('missing context');

			return true;
		});
		Elemenx.Component(page, {$Template: '<div id="guard-context-page">OK</div>'});

		var x = boot([{Path: '/guard-context/:id', Component: page, Guard: guard}]);

		x.Router.Go('/guard-context/42?q=yes#hash');

		await tick(40);

		expect(received).toBe(0);
		expect(context.$To.Params.id).toBe('42');
		expect(context.$To.Query.q).toBe('yes');
		expect(context.$To.Hash).toBe('hash');
		expect(typeof context.$Service).toBe('function');
		expect(typeof context.$Wait).toBe('function');
		expect(typeof context.$Fail).toBe('function');
		expect(document.getElementById('guard-context-page')).not.toBeNull();

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('NotFound and Replace preserve expected route semantics', async function () {
		var home = unique('NFHome');
		var nf = unique('NFPage');
		var next = unique('NFNext');

		Elemenx.Component(home, {$Template: '<div>HOME</div>'});
		Elemenx.Component(nf, {$Template: '<div id="not-found">NF</div>'});
		Elemenx.Component(next, {$Template: '<div id="replace-page">NEXT</div>'});

		var x = boot([{Path: '/', Component: home}, {Path: '/next', Component: next}], null, nf);

		x.Router.Go('/missing');

		await tick(40);

		expect(document.getElementById('not-found')).not.toBeNull();

		x.Router.Replace('/next');

		await tick(40);

		expect(document.getElementById('replace-page')).not.toBeNull();
		expect(location.pathname).toBe('/next');

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('Waiting uses the Router component while an async guard is pending', async function () {
		var guard = unique('WaitingGuard');
		var home = unique('WaitingHome');
		var page = unique('WaitingPage');
		var waiting = unique('WaitingPageLoading');
		var release = null;

		/* The guard answers when the test says so: a timer of its own raced the checks of a loaded machine. */
		Elemenx.Guard(guard, function () {return this.$Wait(function (done) {release = done;});});
		Elemenx.Component(home, {$Template: '<div id="waiting-home">HOME</div>'});
		Elemenx.Component(page, {$Template: '<div id="waiting-target">TARGET</div>'});
		Elemenx.Component(waiting, {$Template: '<div id="waiting-global">WAIT</div>'});

		var root = unique('WaitingRoot');
		var appName = unique('WaitingApp');

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main><aside *outlet="Waiting"></aside>'});

		var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: app.$Component(), Waiting: waiting, Routes: [{Path: '/', Component: home}, {Path: '/waiting', Component: page, Guard: guard}]});

		router.Start();

		/* The first route renders after the browser has painted its waiting component. */
		await waitFor(function () {
			return !!document.getElementById('waiting-home') && !document.getElementById('waiting-global');
		}, 2000);

		router.Go('/waiting');

		expect(await waitFor(function () {return release;}, 3000)).toBeTruthy();
		expect(document.getElementById('waiting-global')).not.toBeNull();
		expect(document.getElementById('waiting-global').parentNode.hasAttribute('*outlet')).toBe(false);
		expect(document.getElementById('waiting-home')).not.toBeNull();
		expect(document.getElementById('waiting-target')).toBeNull();

		release(true);

		await waitFor(function () {
			return !document.getElementById('waiting-global');
		}, 2000);

		expect(document.getElementById('waiting-global')).toBeNull();
		expect(document.getElementById('waiting-target')).not.toBeNull();

		router.Destroy();

		app.$Destroy();
	});

	it('Waiting shows before the route renders, and stays until the deferred Components inside the route Component are ready', async function () {
		var page = unique('NestedWaitingPage');
		var child = unique('NestedWaitingChild');
		var template = unique('NestedWaitingTemplate');
		var waiting = unique('NestedWaitingLoading');
		var root = unique('NestedWaitingRoot');
		var trace = [];
		var deliver;

		Elemenx.Template.Loader(function (name, ready) {
			if (name === template)
				deliver = ready;
		});
		Elemenx.Component(child, {$TemplateID: template});
		Elemenx.Component(page, {$Template: '<div id="nested-waiting-page">PAGE <' + child + '></' + child + '></div>'});
		Elemenx.Component(waiting, {$Template: '<div id="nested-waiting">WAIT</div>'});
		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main><aside *outlet="Waiting"></aside>'});

		var app = Elemenx.Application(unique('NestedWaitingApp'), {$Component: root, $Mount: '#mount'});
		var home = unique('NestedWaitingHome');

		Elemenx.Component(home, {$Template: '<div>HOME</div>'});

		var router = Elemenx.Router({Root: app.$Component(), Waiting: waiting, Routes: [{Path: '/', Component: home}, {Path: '/nested-waiting', Component: page}]});

		router.Start();

		await waitFor(function () {
			return !document.querySelector('#mount aside').children.length;
		}, 2000);

		router.On('NavigationEnd', function () {
			trace.push('end');
		});

		router.Go('/nested-waiting');

		/* the waiting component is in the page at once, the route renders after a frame */
		expect(document.getElementById('nested-waiting')).not.toBeNull();
		expect(document.getElementById('nested-waiting-page')).toBeNull();

		await waitFor(function () {
			return !!document.getElementById('nested-waiting-page');
		}, 2000);

		await tick(30);

		expect(document.getElementById('nested-waiting')).not.toBeNull();
		expect(trace).toEqual([]);

		deliver('<b id="nested-waiting-child">CHILD</b>');

		await waitFor(function () {
			return !document.getElementById('nested-waiting');
		}, 2000);

		expect(document.getElementById('nested-waiting-child')).not.toBeNull();
		expect(trace).toEqual(['end']);

		router.Destroy();

		app.$Destroy();
	});

	it('Waiting does not wait for a deferred Component whose owner shows its own *pending status', async function () {
		var page = unique('OwnPendingPage');
		var child = unique('OwnPendingChild');
		var template = unique('OwnPendingTemplate');
		var waiting = unique('OwnPendingLoading');
		var root = unique('OwnPendingRoot');

		Elemenx.Template.Loader(function () {});
		Elemenx.Component(child, {$TemplateID: template});
		Elemenx.Component(page, {$Template: '<div id="own-pending-page"><' + child + ' *pending="Loading the child"></' + child + '></div>'});
		Elemenx.Component(waiting, {$Template: '<div id="own-pending-waiting">WAIT</div>'});
		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main><aside *outlet="Waiting"></aside>'});

		var app = Elemenx.Application(unique('OwnPendingApp'), {$Component: root, $Mount: '#mount'});
		var home = unique('OwnPendingHome');

		Elemenx.Component(home, {$Template: '<div>HOME</div>'});

		var router = Elemenx.Router({Root: app.$Component(), Waiting: waiting, Routes: [{Path: '/', Component: home}, {Path: '/own-pending', Component: page}]});

		router.Start();

		await tick(50);

		router.Go('/own-pending');

		await waitFor(function () {
			return !document.getElementById('own-pending-waiting');
		}, 2000);

		expect(document.getElementById('own-pending-page').textContent).toContain('Loading the child');

		router.Destroy();

		app.$Destroy();
	});

	it('route Waiting overrides Router Waiting', async function () {
		var guard = unique('RouteWaitingGuard');
		var page = unique('RouteWaitingPage');
		var globalWaiting = unique('GlobalWaiting');
		var routeWaiting = unique('RouteWaiting');
		var release = null;

		Elemenx.Guard(guard, function () {return this.$Wait(function (done) {release = done;});});
		Elemenx.Component(page, {$Template: '<div id="route-waiting-target">TARGET</div>'});
		Elemenx.Component(globalWaiting, {$Template: '<div id="global-waiting">GLOBAL</div>'});
		Elemenx.Component(routeWaiting, {$Template: '<div id="route-waiting">ROUTE</div>'});

		var root = unique('RouteWaitingRoot');
		var appName = unique('RouteWaitingApp');

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main><aside *outlet="Waiting"></aside>'});

		var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: app.$Component(), Waiting: globalWaiting, Routes: [{Path: '/route-waiting', Component: page, Guard: guard, Waiting: routeWaiting}]});

		router.Start();
		router.Go('/route-waiting');

		expect(await waitFor(function () {return release;}, 3000)).toBeTruthy();
		expect(document.getElementById('route-waiting')).not.toBeNull();
		expect(document.getElementById('global-waiting')).toBeNull();

		release(true);

		await waitFor(function () {
			return !document.getElementById('route-waiting');
		}, 2000);

		expect(document.getElementById('route-waiting')).toBeNull();
		expect(document.getElementById('route-waiting-target')).not.toBeNull();

		router.Destroy();

		app.$Destroy();
	});


	it('WaitingOutlet overrides the default Waiting outlet name', async function () {
		var guard = unique('CustomWaitingOutletGuard');
		var page = unique('CustomWaitingOutletPage');
		var waiting = unique('CustomWaitingOutletLoading');
		var release = null;

		Elemenx.Guard(guard, function () {return this.$Wait(function (done) {release = done;});});
		Elemenx.Component(page, {$Template: '<div id="custom-waiting-target">TARGET</div>'});
		Elemenx.Component(waiting, {$Template: '<div id="custom-waiting-loader">WAIT</div>'});

		var root = unique('CustomWaitingOutletRoot');
		var appName = unique('CustomWaitingOutletApp');

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main><aside *outlet="Busy"></aside>'});

		var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: app.$Component(), Waiting: waiting, WaitingOutlet: 'Busy', Routes: [{Path: '/custom-waiting', Component: page, Guard: guard}]});

		router.Start();
		router.Go('/custom-waiting');

		expect(await waitFor(function () {return release;}, 3000)).toBeTruthy();
		expect(document.getElementById('custom-waiting-loader')).not.toBeNull();
		expect(document.getElementById('custom-waiting-loader').parentNode.hasAttribute('*outlet')).toBe(false);

		release(true);

		await waitFor(function () {
			return !document.getElementById('custom-waiting-loader');
		}, 2000);

		expect(document.getElementById('custom-waiting-loader')).toBeNull();
		expect(document.getElementById('custom-waiting-target')).not.toBeNull();

		router.Destroy();

		app.$Destroy();
	});

	it('common-prefix navigation reuses nested component instances', async function () {
		var parent = unique('Parent');
		var child = unique('Child');
		var pm = 0;
		var cm = 0;
		var pi;
		var ci;

		Elemenx.Component(parent, {$Template: '<section id="parent">{{$Params.id}}<div *outlet="Content"></div></section>', $OnCreate: function () {
			pm++;
			pi = this;
		}});
		Elemenx.Component(child, {$Template: '<b id="child">{{$Query.q}}|{{$Hash}}</b>', $OnCreate: function () {
			cm++;
			ci = this;
		}});

		var x = boot([{Path: '/reuse/:id', Component: parent, Routes: [{Path: 'child', Component: child}]}]);

		x.Router.Go('/reuse/1/child?q=a#x');

		await tick(50);

		var p = pi;
		var c = ci;

		x.Router.Go('/reuse/2/child?q=b#y');

		await tick(50);

		expect(pi).toBe(p);
		expect(ci).toBe(c);
		expect(pm).toBe(1);
		expect(cm).toBe(1);
		expect(document.getElementById('child').textContent).toBe('b|y');

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('a method an expression calls reads this.$Params from the first render of a routed page', async function () {
		var page = unique('ParamsPage');
		var seen = [];
		var errors = [];
		var consoleError = console.error;

		Elemenx.Component(page, {
			$Template: '<p id="kind">{{Label()}}</p>',
			Label: function () {
				seen.push(this.$Params && this.$Params.kind);

				return 'kind ' + this.$Params.kind;
			}
		});

		console.error = function () {
			errors.push(Array.prototype.join.call(arguments, ' '));
		};

		try {
			var x = boot([{Path: '/kinds/:kind', Component: page}]);

			x.Router.Go('/kinds/music');

			await tick(50);

			expect(document.getElementById('kind').textContent).toBe('kind music');
			expect(seen[0]).toBe('music');
			expect(errors).toEqual([]);

			x.Router.Destroy();
			x.App.$Destroy();
		}
		finally {
			console.error = consoleError;
		}
	});

	it('failed leave guard cancels navigation and keeps current route', async function () {
		var a = unique('LeaveA');
		var b = unique('LeaveB');
		var failed = 0;

		Elemenx.Component(a, {
			$Template: '<div id="leave-a">A</div>',
			$OnRouteLeave: function (x) {return x.$Fail('stay');}
		});
		Elemenx.Component(b, {$Template: '<div id="leave-b">B</div>'});

		var x = boot([{Path: '/leave-a', Component: a}, {Path: '/leave-b', Component: b}]);

		x.Router.On('GuardFailed', function () {failed++;});
		x.Router.Go('/leave-a');

		await tick(40);

		x.Router.Go('/leave-b');

		await tick(60);

		expect(document.getElementById('leave-a')).not.toBeNull();
		expect(document.getElementById('leave-b')).toBeNull();
		expect(location.pathname).toBe('/leave-a');
		expect(failed).toBe(1);

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('$Wait refuses a Promise: navigation is denied with an InvalidWait failure', async function () {
		var page = unique('WaitPromisePage');
		var guard = unique('WaitPromiseGuard');
		var failures = [];

		Elemenx.Component(page, {$Template: '<div id="wait-promise">page</div>'});
		Elemenx.Guard(guard, function () {
			return this.$Wait(Promise.resolve(true));
		});

		var x = boot([{Path: '/wait-promise', Component: page, Guard: guard}]);

		x.Router.On('GuardFailed', function (failure) {
			failures.push(failure);
		});
		x.Router.Go('/wait-promise');

		await tick(60);

		expect(document.getElementById('wait-promise')).toBeNull();
		expect(failures.length).toBe(1);
		expect(failures[0].Reason).toBe('InvalidWait');
		expect(failures[0].Data.message).toBe('Elemenx $Wait expects a function (done), not a Promise');

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('stale async redirect cannot override a newer navigation', async function () {
		var guard = unique('RedirectGuard');
		var home = unique('RedirectHome');
		var slow = unique('RedirectSlow');
		var fast = unique('RedirectFast');
		var target = unique('RedirectTarget');
		var release = null;

		Elemenx.Guard(guard, function () {return this.$Wait(function (done) {release = done;});});
		Elemenx.Component(home, {$Template: '<div>HOME</div>'});
		Elemenx.Component(slow, {$Template: '<div id="redirect-slow">SLOW</div>'});
		Elemenx.Component(fast, {$Template: '<div id="redirect-fast">FAST</div>'});
		Elemenx.Component(target, {$Template: '<div id="redirect-target">TARGET</div>'});

		var x = boot([{Path: '/', Component: home}, {Path: '/redirect-slow', Component: slow, Guard: guard}, {Path: '/redirect-fast', Component: fast}, {Path: '/redirect-target', Component: target}]);

		x.Router.Go('/redirect-slow');

		expect(await waitFor(function () {return release;}, 3000)).toBeTruthy();

		x.Router.Go('/redirect-fast');

		expect(await waitFor(function () {return document.getElementById('redirect-fast');}, 3000)).toBeTruthy();

		release('/redirect-target');

		await tick(20);

		expect(document.getElementById('redirect-fast')).not.toBeNull();
		expect(document.getElementById('redirect-target')).toBeNull();
		expect(location.pathname).toBe('/redirect-fast');

		x.Router.Destroy();
		x.App.$Destroy();
	});


	it('GuardFailed renders a route fallback at the protected URL and exposes failure context', async function () {
		var guard = unique('FallbackGuard');
		var page = unique('FallbackPage');
		var denied = unique('FallbackDenied');
		var failure = null;

		Elemenx.Guard(guard, function () {return this.$Fail('blocked');});
		Elemenx.Component(page, {$Template: '<div id="fallback-page">PAGE</div>'});
		Elemenx.Component(denied, {$Template: '<div id="fallback-denied">DENIED</div>', $OnReady: function () {failure = this.$GuardFailure;}});

		var x = boot([{Path: '/guard-fallback/:id', Component: page, Guard: guard, GuardFailed: denied}]);

		x.Router.Go('/guard-fallback/42?q=yes#hash');

		await tick(60);

		expect(location.pathname).toBe('/guard-fallback/42');
		expect(location.search).toBe('?q=yes');
		expect(location.hash).toBe('#hash');
		expect(document.getElementById('fallback-denied')).not.toBeNull();
		expect(document.getElementById('fallback-page')).toBeNull();
		expect(failure.Reason).toBe('blocked');
		expect(failure.$Guard).toBe(guard);
		expect(failure.$To.Params.id).toBe('42');

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('GuardFailed map selects the fallback for the first failing guard in a composition', async function () {
		var auth = unique('MapAuth');
		var access = unique('MapAccess');
		var page = unique('MapPage');
		var login = unique('MapLogin');
		var denied = unique('MapDenied');
		var authorized = false;
		var allowed = false;

		Elemenx.Guard(auth, function () {return authorized ? true : this.$Fail('login');});
		Elemenx.Guard(access, function () {return allowed ? true : this.$Fail('access');});
		Elemenx.Component(page, {$Template: '<div id="map-page">PAGE</div>'});
		Elemenx.Component(login, {$Template: '<div id="map-login">LOGIN</div>'});
		Elemenx.Component(denied, {$Template: '<div id="map-denied">DENIED</div>'});

		var route = {Path: '/guard-map', Component: page, Guards: [auth, access], GuardFailed: {}};

		route.GuardFailed[auth] = login;
		route.GuardFailed[access] = denied;

		var x = boot([route]);

		x.Router.Go('/guard-map');

		await tick(50);

		expect(document.getElementById('map-login')).not.toBeNull();

		authorized = true;

		x.Router.Replace('/guard-map');

		await tick(50);

		expect(document.getElementById('map-denied')).not.toBeNull();

		allowed = true;

		x.Router.Replace('/guard-map');

		await tick(50);

		expect(document.getElementById('map-page')).not.toBeNull();

		x.Router.Destroy();
		x.App.$Destroy();
	});

});
describe('Regression: Router lifecycle hardening', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('Destroy removes a mounted Waiting component while a guard is pending', async function () {
		var guard = unique('DestroyWaitingGuard');
		var page = unique('DestroyWaitingPage');
		var waiting = unique('DestroyWaitingLoader');
		var release = null;

		Elemenx.Guard(guard, function () {return this.$Wait(function (done) {release = done;});});
		Elemenx.Component(page, {$Template: '<div id="destroy-waiting-target">TARGET</div>'});
		Elemenx.Component(waiting, {$Template: '<div id="destroy-waiting-loader">WAIT</div>'});

		var root = unique('DestroyWaitingRoot');
		var appName = unique('DestroyWaitingApp');

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main><aside *outlet="Waiting"></aside>'});

		var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: app.$Component(), Waiting: waiting, Routes: [{Path: '/destroy-waiting', Component: page, Guard: guard}]});

		router.Start();
		router.Go('/destroy-waiting');

		expect(await waitFor(function () {return release;}, 3000)).toBeTruthy();
		expect(document.getElementById('destroy-waiting-loader')).not.toBeNull();

		router.Destroy();

		expect(document.getElementById('destroy-waiting-loader')).toBeNull();

		/* The guard answers after the Router is gone: nothing comes back. */
		release(true);

		await tick(20);

		expect(document.getElementById('destroy-waiting-target')).toBeNull();

		app.$Destroy();
	});

	it('Application.Destroy cancels a pending service-backed guard without resurrecting route state', async function () {
		var service = unique('PendingGuardService');
		var guard = unique('PendingServiceGuard');
		var page = unique('PendingServicePage');
		var waiting = unique('PendingServiceWaiting');
		var destroyed = 0;
		var guarded = false;
		var frame = window.requestAnimationFrame;

		Elemenx.Service(service, {
			Authorized: true,
			$OnDestroy: function () {destroyed++;}
		});
		Elemenx.Guard(guard, function () {
			var session = this.$Service(service);
			var authorized = session.Authorized;

			guarded = true;

			return this.$Wait(function (done) {
				setTimeout(function () {done(authorized);}, 100);
			});
		});
		Elemenx.Component(page, {$Template: '<div id="pending-service-target">TARGET</div>'});
		Elemenx.Component(waiting, {$Template: '<div id="pending-service-waiting">WAIT</div>'});

		var root = unique('PendingServiceRoot');
		var appName = unique('PendingServiceApp');

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main><aside *outlet="Waiting"></aside>'});

		var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: app.$Component(), Waiting: waiting, Routes: [{Path: '/pending-service', Component: page, Guard: guard}]});

		/*
		 * A bug of the test: it took the guard as started 20 ms after Go, but the guard runs once the frame of the waiting
		 * component is painted (or 100 ms later), and a frame of a loaded machine came later (destroyed stayed 0). Here no
		 * frame comes at all, and the test waits for the guard itself.
		 */
		window.requestAnimationFrame = function () {return 0;};

		try {
			router.Start();
			router.Go('/pending-service');

			expect(await waitFor(function () {return guarded;}, 3000)).toBe(true);
		}
		finally {
			window.requestAnimationFrame = frame;
		}

		expect(document.getElementById('pending-service-waiting')).not.toBeNull();
		expect(destroyed).toBe(0);

		app.$Destroy();

		expect(destroyed).toBe(1);
		expect(document.getElementById('pending-service-waiting')).toBeNull();

		await tick(120);

		expect(document.getElementById('pending-service-target')).toBeNull();
		expect(destroyed).toBe(1);
	});

	it('a lazy service handle retained by a pending guard cannot resurrect its Application service after Destroy', async function () {
		var service = unique('LazyPendingGuardService');
		var guard = unique('LazyPendingServiceGuard');
		var page = unique('LazyPendingServicePage');
		var created = 0;
		var destroyed = 0;

		Elemenx.Service(service, {
			Authorized: true,
			$OnCreate: function () {created++;},
			$OnDestroy: function () {destroyed++;}
		});
		Elemenx.Guard(guard, function () {
			var session = this.$Service(service);

			return this.$Wait(function (done) {
				setTimeout(function () {done(session.Authorized);}, 100);
			});
		});
		Elemenx.Component(page, {$Template: '<div id="lazy-pending-service-target">TARGET</div>'});

		var root = unique('LazyPendingServiceRoot');
		var appName = unique('LazyPendingServiceApp');

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});

		var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: app.$Component(), Routes: [{Path: '/lazy-pending-service', Component: page, Guard: guard}]});

		router.Start();
		router.Go('/lazy-pending-service');

		await tick(20);

		expect(created).toBe(0);

		app.$Destroy();

		await tick(120);

		expect(created).toBe(0);
		expect(destroyed).toBe(0);
		expect(document.getElementById('lazy-pending-service-target')).toBeNull();

		router.Destroy();
	});
	it('clears the owning Outlet when a route is destroyed so the same route can be recreated after a guard failure', async function () {
		var guard = unique('OutletGuard');
		var home = unique('OutletHome');
		var protectedPage = unique('OutletProtected');
		var failed = unique('OutletFailed');
		var root = unique('OutletRoot');
		var allowed = false;

		Elemenx.Guard(guard, function () {return allowed ? true : this.$Fail();});
		Elemenx.Component(home, {$Template: '<section id="outlet-home">HOME</section>'});
		Elemenx.Component(protectedPage, {$Template: '<section id="outlet-protected">PROTECTED</section>'});
		Elemenx.Component(failed, {$Template: '<section id="outlet-failed"><a href="/">Return home</a></section>'});
		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});

		var appName = unique('OutletApp');
		var app = Elemenx.Application(appName, {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: app.$Component(), Routes: [{Path: '/', Component: home}, {Path: '/protected', Component: protectedPage, Guard: guard, GuardFailed: failed}]});

		router.Start();

		await tick();

		expect(document.getElementById('outlet-home')).not.toBeNull();

		router.Go('/protected');

		await tick();

		expect(document.getElementById('outlet-failed')).not.toBeNull();

		router.Go('/');

		await tick();

		expect(document.getElementById('outlet-home')).not.toBeNull();
		expect(document.getElementById('outlet-failed')).toBeNull();

		router.Destroy();

		app.$Destroy();
	});

	it('attaches the Router facade to a route Component resolved through a deferred TemplateID', async function () {
		var home = unique('DeferredRouterHome');
		var page = unique('DeferredRouterPage');
		var template = unique('DeferredRouterTemplate');

		Elemenx.Template.Loader(function (name, ready) {
			if (name !== template) return;

			setTimeout(function () {ready('<button id="deferred-router-next" (click)="GoNext">NEXT</button><span id="deferred-router-id">{{$Params.id}}</span>');}, 20);
		});
		Elemenx.Component(home, {$Template: '<div id="deferred-router-home">HOME</div>'});
		Elemenx.Component(page, {
			$TemplateID: template,
			GoNext: function () {
				var id = Number(this.$Params.id || 0) + 1;

				this.$Router().Go('/deferred-router/' + id);
			}
		});

		var x = boot([{Path: '/', Component: home}, {Path: '/deferred-router/:id', Component: page}]);

		x.Router.Go('/deferred-router/1');

		await tick(60);

		expect(document.getElementById('deferred-router-id').textContent).toBe('1');

		document.getElementById('deferred-router-next').click();

		await tick();

		expect(location.pathname).toBe('/deferred-router/2');
		expect(document.getElementById('deferred-router-id').textContent).toBe('2');

		x.Router.Destroy();
		x.App.$Destroy();
	});

	it('runs a deferred route Component leave hook on the resolved Component instance', async function () {
		var home = unique('DeferredLeaveHome');
		var page = unique('DeferredLeavePage');
		var template = unique('DeferredLeaveTemplate');

		Elemenx.Template.Loader(function (name, ready) {
			if (name !== template) return;

			setTimeout(function () {ready('<button id="deferred-leave-home" (click)="GoHome">HOME</button><button id="deferred-leave-toggle" (click)="Toggle">TOGGLE</button><span id="deferred-leave-status">{{Status}}:{{Attempts}}</span>');}, 20);
		});
		Elemenx.Component(home, {$Template: '<div id="deferred-leave-home-page">HOME</div>'});
		Elemenx.Component(page, {
			$TemplateID: template,
			Allow: false,
			Attempts: 0,
			Status: 'READY',
			GoHome: function () {this.$Router().Go('/');},
			Toggle: function () {this.Allow = !this.Allow;},
			$OnRouteLeave: function () {
				this.Attempts++;

				if (this.Allow) return true;

				this.Status = 'DENIED';

				return false;
			}
		});

		var x = boot([{Path: '/', Component: home}, {Path: '/deferred-leave', Component: page}]);

		x.Router.Go('/deferred-leave');

		await tick(60);

		document.getElementById('deferred-leave-home').click();

		await tick();

		expect(location.pathname).toBe('/deferred-leave');
		expect(document.getElementById('deferred-leave-status').textContent).toBe('DENIED:1');

		document.getElementById('deferred-leave-toggle').click();
		document.getElementById('deferred-leave-home').click();

		await tick();

		expect(location.pathname).toBe('/');
		expect(document.getElementById('deferred-leave-home-page')).not.toBeNull();

		x.Router.Destroy();
		x.App.$Destroy();
	});

});