import {describe, expect, test, beforeEach} from 'vitest';
import '../../elemenx.js';

var serial=0;
function unique (prefix) {
	serial++;
	return prefix+Date.now()+serial;
}

describe('Regression: production bundle registry', function () {
	beforeEach(function () {
		document.body.innerHTML='';
	});

	test('bundled Component is resolved synchronously without Discovery', function () {
		var name=unique('BundledComponent');
		var bundle={Component:{}};
		var calls=0;

		bundle.Component[name]=function () {
			calls++;
			Elemenx.Component(name,{Template:'<strong class="bundled-component">bundle</strong>'});
		};
		Elemenx.Bundle(bundle);

		var factory=Elemenx.Component(name);
		var child=factory();
		expect(calls).toBe(1);
		expect(child.Element().classList.contains('bundled-component')).toBe(true);
		expect(child.Element().textContent).toBe('bundle');
		expect(Elemenx.Component(name)).toBe(factory);
		expect(calls).toBe(1);
		child.Destroy();
	});

	test('bundle lookup is case-insensitive like Component registry lookup', function () {
		var name=unique('BundledCase');
		var bundle={Component:{}};
		bundle.Component[name]=function () {
			Elemenx.Component(name,{Template:'<span>case</span>'});
		};
		Elemenx.Bundle(bundle);
		expect(Elemenx.Component(name.toLowerCase())).not.toBeNull();
	});

	test('Router resolves bundled NotFound Component without Discovery', async function () {
		var rootName=unique('BundledRouterRoot');
		var notFoundName=unique('BundledRouterNotFound');
		var bundle={Component:{}};

		Elemenx.Component(rootName,{
			Template:'<main><div *outlet="Content"></div></main>'
		});

		bundle.Component[notFoundName]=function () {
			Elemenx.Component(notFoundName,{
				Template:'<section class="bundled-not-found">missing</section>'
			});
		};

		Elemenx.Bundle(bundle);

		var root=Elemenx.Component(rootName)();
		document.body.appendChild(root.Element());

		var router=Elemenx.Router({
			Root:root,
			Routes:[],
			NotFound:notFoundName
		});

		router.Start();
		router.Go('/bundle-not-found-'+Date.now());

		await new Promise(function (resolve) {
			setTimeout(resolve,0);
		});

		expect(root.Element().querySelector('.bundled-not-found').textContent).toBe('missing');
		root.Destroy();
	});

});