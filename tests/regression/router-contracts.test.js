import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var running = [];

function boot (routes, notFound) {
	var root = unique('ContractRoot');
	var app;
	var router;

	Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});

	app = Elemenx.Application(unique('ContractApp'), {$Component: root, $Mount: '#mount'});
	router = Elemenx.Router({Root: app.$Component(), Routes: routes, NotFound: notFound});

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

		await tick(60);

		expect(location.pathname).toBe('/first');
		expect(document.getElementById('contract-first')).not.toBeNull();
		expect(facade.Forward()).toBe(x.Router);

		await tick(60);

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

		await tick(60);

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

	it('current behavior: a route Component that is not registered throws from Go after NavigationCommit and restores the URL', async function () {
		var trace = [];
		var x = boot([{Path: '/', Component: page('contract-home')}, {Path: '/ghost', Component: unique('NeverRegistered')}]);
		var thrown = null;

		['NavigationStart', 'NavigationCommit', 'NavigationEnd', 'NavigationCancel'].forEach(function (name) {
			x.Router.On(name, function () {
				trace.push(name);
			});
		});

		try {
			x.Router.Go('/ghost');
		}
		catch (error) {
			thrown = error.message;
		}

		await tick(40);

		expect(thrown).toMatch(/^Elemenx route component not found: NeverRegistered/);
		expect(trace).toEqual(['NavigationStart', 'NavigationCommit']);
		expect(location.pathname).toBe('/');
	});
});
