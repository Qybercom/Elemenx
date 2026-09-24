import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, mount, tick } from '../setup.js';

describe('Router / Guards', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		history.replaceState({}, '', '/');
		mount();
	});

	it('reuses common route components while updating params', async function () {
		var made = 0;

		Elemenx.Component('PackageRoot', {Template:'<main data-outlet="Content"></main>'});
		Elemenx.Component('PackagePage', {
			Template:'<div id="route-value">{{Params.id}}|{{Query.q}}|{{Hash}}</div>',
			ElemenxOnCreate:function () { made++; }
		});

		var app = Elemenx.Application('PackageRouterApp', {Component:'PackageRoot', Mount:'#mount'});
		var router = Elemenx.Router({
			Root: app.Component(),
			Routes: [
				{Path:'/package/:id', Component:'PackagePage'}
			]
		});

		router.Start();
		router.Go('/package/1?q=a#x');
		await tick();
		router.Go('/package/2?q=b#y');
		await tick();

		expect(document.getElementById('route-value').textContent).toBe('2|b|y');
		expect(made).toBe(1);

		router.Destroy();
		app.Destroy();
	});

	it('supports asynchronous guard wait', async function () {
		Elemenx.Component('PackageGuardRoot', {Template:'<main data-outlet="Content"></main>'});
		Elemenx.Component('PackageGuardPage', {Template:'<div id="guard-ok">OK</div>'});

		Elemenx.Guard('PackageAsyncGuard', function (args) {
			return args.Wait(function (done) {
				setTimeout(function () { done(true); }, 20);
			});
		});

		var app = Elemenx.Application('PackageGuardApp', {Component:'PackageGuardRoot', Mount:'#mount'});
		var router = Elemenx.Router({
			Root: app.Component(),
			Routes: [
				{Path:'/guarded', Component:'PackageGuardPage', Guard:'PackageAsyncGuard'}
			]
		});

		router.Start();
		router.Go('/guarded');
		await tick(60);
		expect(document.getElementById('guard-ok')).not.toBeNull();

		router.Destroy();
		app.Destroy();
	});
});
// PLACEHOLDER