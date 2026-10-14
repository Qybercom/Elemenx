import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

var running = [];

function boot (routes, notFound, mode) {
	var root = unique('ContractRoot');
	var app;
	var router;

	Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});

	app = Elemenx.Application(unique('ContractApp'), {$Component: root, $Mount: '#mount'});
	router = Elemenx.Router({Root: app.$Component(), Routes: routes, NotFound: notFound, Mode: mode});

	running.push({App: app, Router: router});

	router.Start();

	return {App: app, Router: router};
}

function page (id, extra) {
	var name = unique('ContractPage');

	Elemenx.Component(name, Object.assign({$Template: '<div id="' + id + '">{{$Path}}|{{JSON.stringify($Query)}}</div>'}, extra || {}));

	return name;
}

/* A click that the Router does not take over must not navigate the test page away. */
function click (anchor, options) {
	var intercepted = null;

	function after (event) {
		intercepted = event.defaultPrevented;

		event.preventDefault();
	}

	window.addEventListener('click', after);

	anchor.dispatchEvent(new MouseEvent('click', Object.assign({bubbles: true, cancelable: true, button: 0}, options || {})));

	window.removeEventListener('click', after);

	return intercepted;
}

describe('Regression: Router contracts', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		history.replaceState({}, '', '/');

		resetDOM();
	});

	afterEach(function () {
		while (running.length) {
			var entry = running.pop();

			entry.Router.Destroy();
			entry.App.$Destroy();
		}

		history.replaceState({}, '', '/');
	});

	it('route paths without a leading slash and URLs with a trailing slash match the same route; a query key without = is empty', async function () {
		var about = page('contract-about');
		var x = boot([{Path: 'about', Component: about}]);

		x.Router.Go('/about/?flag&x=1');

		await tick(20);

		expect(document.getElementById('contract-about').textContent).toBe('/about|{"flag":"","x":"1"}');
	});

	it('Mode hash keeps the route after the # of the page: #/path?query#hash, links to #/path and to a #name of the route', async function () {
		var first = page('contract-hash-first', {$Template: '<div id="contract-hash-first">{{$Path}}|{{JSON.stringify($Query)}}|{{$Hash}}</div>'});
		var second = page('contract-hash-second', {$Template: '<div id="contract-hash-second">{{$Path}}|{{JSON.stringify($Query)}}|{{$Hash}}</div>'});
		var x;
		var link;

		history.replaceState({}, '', '/page?app=1#/first?x=1#part');

		x = boot([{Path: '/first', Component: first}, {Path: '/second', Component: second}], undefined, 'hash');

		await tick(20);

		expect(document.getElementById('contract-hash-first').textContent).toBe('/first|{"x":"1"}|part');

		x.Router.Go('/second?y=2');

		await tick(20);

		expect(location.pathname + location.search + location.hash).toBe('/page?app=1#/second?y=2');
		expect(document.getElementById('contract-hash-second').textContent).toBe('/second|{"y":"2"}|');

		link = document.createElement('a');

		link.setAttribute('href', '#comments');

		document.body.appendChild(link);

		expect(click(link)).toBe(true);

		await tick(20);

		expect(location.hash).toBe('#/second?y=2#comments');
		expect(document.getElementById('contract-hash-second').textContent).toBe('/second|{"y":"2"}|comments');

		link.setAttribute('href', '#/first');

		expect(click(link)).toBe(true);

		await tick(20);

		expect(location.hash).toBe('#/first');
		expect(document.getElementById('contract-hash-first')).not.toBeNull();

		x.Router.Back();

		await waitFor(function () {
			return !!document.getElementById('contract-hash-second');
		}, 2000);

		expect(location.hash).toBe('#/second?y=2#comments');

		link.remove();
	});

	it('Mode hash reads a page URL without a route as /, and a # alone as the Hash of /', async function () {
		var home = page('contract-hash-home', {$Template: '<div id="contract-hash-home">{{$Path}}|{{$Hash}}</div>'});

		history.replaceState({}, '', '/page#top');

		boot([{Path: '/', Component: home}], undefined, 'hash');

		await tick(20);

		expect(document.getElementById('contract-hash-home').textContent).toBe('/|top');
		expect(location.pathname + location.hash).toBe('/page#/#top');
	});

	it('Mode memory keeps the route in the history entry: the page URL and its hash belong to the Application', async function () {
		var first = page('contract-memory-first');
		var second = page('contract-memory-second');
		var x;
		var link;

		history.replaceState({}, '', '/page?app=1#own');

		x = boot([{Path: '/page', Component: first}, {Path: '/second', Component: second}], undefined, 'memory');

		await tick(20);

		expect(document.getElementById('contract-memory-first').textContent).toBe('/page|{"app":"1"}');

		x.Router.Go('second?y=2');

		await tick(20);

		expect(location.pathname + location.search + location.hash).toBe('/page?app=1#own');
		expect(history.state.ElemenxRouterURL).toBe('/second?y=2');
		expect(document.getElementById('contract-memory-second').textContent).toBe('/second|{"y":"2"}');

		link = document.createElement('a');

		link.setAttribute('href', '#section');

		document.body.appendChild(link);

		expect(click(link)).toBe(false);

		link.setAttribute('href', '/page?app=2');

		expect(click(link)).toBe(true);

		await tick(20);

		expect(document.getElementById('contract-memory-first').textContent).toBe('/page|{"app":"2"}');
		expect(location.search).toBe('?app=1');

		x.Router.Back();

		await waitFor(function () {
			return !!document.getElementById('contract-memory-second');
		}, 2000);

		expect(location.pathname + location.search + location.hash).toBe('/page?app=1#own');

		link.remove();
	});

	it('Mode memory leaves a history entry made by the Application with its own # to the page', async function () {
		var first = page('contract-memory-own');
		var x = boot([{Path: '/', Component: first}, {Path: '/second', Component: page('contract-memory-own-second')}], undefined, 'memory');

		await tick(20);

		x.Router.Go('/second');

		await tick(20);

		history.pushState(null, '', '#own');
		history.back();

		await tick(50);

		expect(location.hash).toBe('');
		expect(document.getElementById('contract-memory-own-second')).not.toBeNull();
	});

	it('Mode is history, hash or memory', function () {
		expect(function () {
			Elemenx.Router({Routes: [], Mode: 'path'});
		}).toThrow('Elemenx.Router Mode must be history, hash or memory');
	});

	it('Start is idempotent and requires a Root component', function () {
		var x = boot([{Path: '/', Component: page('contract-home')}]);

		expect(x.Router.Start()).toBe(x.Router);
		expect(function () {
			Elemenx.Router({Routes: []}).Start();
		}).toThrow('Elemenx.Router requires Root component');
	});

	it('the Component $Router facade navigates through the attached Router while its Component lives', async function () {
		var routeFacade = null;
		var first = page('contract-first', {
			$OnReady: function () {
				routeFacade = this.$Router();
			}
		});
		var second = page('contract-second');
		var third = page('contract-third');
		var x = boot([{Path: '/first', Component: first}, {Path: '/second', Component: second}, {Path: '/third', Component: third}]);
		var facade = x.App.$Component().$Router();

		x.Router.Go('/first');

		await tick(20);

		expect(facade.Current().map(function (route) {
			return route.Path;
		})).toEqual(['/first']);
		expect(routeFacade.Go('/second')).toBe(x.Router);

		await tick(20);

		expect(document.getElementById('contract-second')).not.toBeNull();

		/* the /first Component is destroyed: its facade no longer reaches the Router */
		expect(routeFacade.Go('/third')).toBe(routeFacade);
		expect(routeFacade.Current()).toEqual([]);
		expect(facade.Replace('/third')).toBe(x.Router);

		await tick(20);

		expect(location.pathname).toBe('/third');
		expect(facade.Back()).toBe(x.Router);

		await waitFor(function () {
			return location.pathname === '/first' && !!document.getElementById('contract-first');
		}, 2000);

		expect(location.pathname).toBe('/first');
		expect(document.getElementById('contract-first')).not.toBeNull();
		expect(facade.Forward()).toBe(x.Router);

		await waitFor(function () {
			return location.pathname === '/third' && !!document.getElementById('contract-third');
		}, 2000);

		expect(location.pathname).toBe('/third');
		expect(document.getElementById('contract-third')).not.toBeNull();
	});

	it('the Router takes over plain same-origin links only', async function () {
		var x = boot([{Path: '/', Component: page('contract-home')}, {Path: '/target', Component: page('contract-target')}]);
		var mount = document.getElementById('mount');

		mount.insertAdjacentHTML('beforeend', [
			'<a id="plain" href="/target">plain</a>',
			'<a id="blank" href="/target" target="_blank">blank</a>',
			'<a id="download" href="/target" download>download</a>',
			'<a id="external" href="https://example.test/target">external</a>',
			'<a id="unknown" href="/unknown">unknown</a>'
		].join(''));

		expect(click(document.getElementById('plain'), {ctrlKey: true})).toBe(false);
		expect(click(document.getElementById('plain'), {button: 1})).toBe(false);
		expect(click(document.getElementById('blank'))).toBe(false);
		expect(click(document.getElementById('download'))).toBe(false);
		expect(click(document.getElementById('external'))).toBe(false);
		expect(click(document.getElementById('unknown'))).toBe(false);
		expect(location.pathname).toBe('/');

		expect(click(document.getElementById('plain'))).toBe(true);

		await tick(20);

		expect(location.pathname).toBe('/target');
		expect(document.getElementById('contract-target')).not.toBeNull();
	});

	it('with NotFound, links to unknown paths and history steps to them render the NotFound component', async function () {
		var x = boot([{Path: '/', Component: page('contract-home')}], page('contract-missing'));
		var mount = document.getElementById('mount');

		mount.insertAdjacentHTML('beforeend', '<a id="unknown" href="/unknown">unknown</a>');

		expect(click(document.getElementById('unknown'))).toBe(true);

		await tick(20);

		expect(document.getElementById('contract-missing')).not.toBeNull();

		x.Router.Go('/');

		await tick(20);

		expect(document.getElementById('contract-home')).not.toBeNull();

		history.back();

		await waitFor(function () {
			return location.pathname === '/unknown' && !!document.getElementById('contract-missing');
		}, 2000);

		expect(location.pathname).toBe('/unknown');
		expect(document.getElementById('contract-missing')).not.toBeNull();
	});

	it('$OnRouteLeave returning a path redirects instead of the requested navigation', async function () {
		var trace = [];
		var a = page('contract-leave', {
			$OnRouteLeave: function () {
				return '/elsewhere';
			}
		});
		var x = boot([{Path: '/leave', Component: a}, {Path: '/target', Component: page('contract-target')}, {Path: '/elsewhere', Component: page('contract-elsewhere')}]);

		x.Router.On('NavigationCancel', function () {
			trace.push('cancel');
		});
		x.Router.Go('/leave');

		await tick(20);

		trace.length = 0;

		x.Router.Go('/target');

		await tick(40);

		expect(trace).toEqual(['cancel']);
		expect(location.pathname).toBe('/elsewhere');
		expect(document.getElementById('contract-elsewhere')).not.toBeNull();
		expect(document.getElementById('contract-target')).toBeNull();
	});

	it('a redirect from an enter guard does not ask the leave hooks a second time', async function () {
		var guard = unique('ContractRedirect');
		var leaves = 0;
		var a = page('contract-leave', {
			$OnRouteLeave: function () {
				leaves++;

				return true;
			}
		});

		Elemenx.Guard(guard, function () {
			return '/elsewhere';
		});

		var x = boot([{Path: '/leave', Component: a}, {Path: '/target', Component: page('contract-target'), Guard: guard}, {Path: '/elsewhere', Component: page('contract-elsewhere')}]);

		x.Router.Go('/leave');

		await tick(20);

		x.Router.Go('/target');

		await tick(40);

		expect(leaves).toBe(1);
		expect(location.pathname).toBe('/elsewhere');
		expect(document.getElementById('contract-elsewhere')).not.toBeNull();
	});

	it('a route Component that is not registered ends the navigation with NavigationError and restores the URL', async function () {
		var trace = [];
		var errors = [];
		var x = boot([{Path: '/', Component: page('contract-home')}, {Path: '/ghost', Component: unique('NeverRegistered')}]);

		['NavigationStart', 'NavigationCommit', 'NavigationEnd', 'NavigationCancel', 'NavigationError'].forEach(function (name) {
			x.Router.On(name, function () {
				trace.push(name);
			});
		});
		x.Router.On('NavigationError', function (context) {
			errors.push([context.$Error.message, context.$To.Path, context.$From.Path]);
		});

		await tick(20);

		trace.length = 0;

		expect(x.Router.Go('/ghost')).toBe(x.Router);

		await tick(40);

		expect(trace).toEqual(['NavigationStart', 'NavigationCommit', 'NavigationError']);
		expect(errors.length).toBe(1);
		expect(errors[0][0]).toMatch(/^Elemenx route component not found: NeverRegistered/);
		expect(errors[0].slice(1)).toEqual(['/ghost', '/']);
		expect(location.pathname).toBe('/');
		expect(document.getElementById('contract-home')).not.toBeNull();
	});

	it('without a NavigationError listener the error is reported as uncaught, and Go does not throw', async function () {
		var reported = [];
		var consoleError = console.error;
		var x = boot([{Path: '/', Component: page('contract-home')}, {Path: '/ghost', Component: unique('NeverRegistered')}]);

		function capture (event) {
			reported.push(event.error.message);

			event.preventDefault();
		}

		/* the Vitest browser runner echoes window errors to console.error once a test listens for them */
		console.error = function () {};

		window.addEventListener('error', capture);

		try {
			x.Router.Go('/ghost');

			await tick(40);
		}
		finally {
			window.removeEventListener('error', capture);

			console.error = consoleError;
		}

		expect(reported.length).toBe(1);
		expect(reported[0]).toMatch(/^Elemenx route component not found/);
		expect(location.pathname).toBe('/');
	});

	it('a missing guard, Waiting component, GuardFailed fallback or NotFound component ends with NavigationError', async function () {
		var denied = unique('ContractDenied');
		var x;
		var errors = [];

		Elemenx.Guard(denied, function () {
			return this.$Fail('blocked');
		});

		x = boot([
			{Path: '/', Component: page('contract-home')},
			{Path: '/guarded', Component: page('contract-guarded'), Guard: unique('NoSuchGuard')},
			{Path: '/waiting', Component: page('contract-waiting'), Wait: unique('NoSuchWaiting')},
			{Path: '/fallback', Component: page('contract-fallback'), Guard: denied, GuardFailed: unique('NoSuchFallback')}
		], unique('NoSuchNotFound'));

		x.Router.On('NavigationError', function (context) {
			errors.push(context.$Error.message);
		});

		await tick(20);

		x.Router.Go('/guarded');

		await tick(20);

		x.Router.Go('/waiting');

		await tick(20);

		x.Router.Go('/fallback');

		await tick(20);

		x.Router.Go('/nowhere');

		await tick(20);

		expect(errors.length).toBe(4);
		expect(errors[0]).toBe('Elemenx route guard not found');
		expect(errors[1]).toMatch(/^Elemenx route waiting component not found: NoSuchWaiting/);
		expect(errors[2]).toMatch(/^Elemenx route component not found: NoSuchFallback/);
		expect(errors[3]).toMatch(/^Elemenx NotFound component not found: NoSuchNotFound/);
		expect(document.getElementById('contract-home')).not.toBeNull();
	});
});