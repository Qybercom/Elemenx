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

	test('two bundled Applications start independently when their source graphs are unavailable', async function () {
		document.body.innerHTML='<div id="bundle-app-a"></div><div id="bundle-app-b"></div>';
		var aName=unique('BundledApplicationA');
		var bName=unique('BundledApplicationB');
		var bundle={Component:{}};

		bundle.Component[aName]=function () {
			Elemenx.Component(aName,{Template:'<section class="bundle-app-a">A</section>'});
		};
		bundle.Component[bName]=function () {
			Elemenx.Component(bName,{Template:'<section class="bundle-app-b">B</section>'});
		};
		Elemenx.Bundle(bundle);

		var a=Elemenx.Application(unique('BundledApplicationInstanceA'),{
			Component:aName,
			Root:'/missing-bundle-source-a-'+Date.now(),
			Mount:'#bundle-app-a'
		});
		var b=Elemenx.Application(unique('BundledApplicationInstanceB'),{
			Component:bName,
			Root:'/missing-bundle-source-b-'+Date.now(),
			Mount:'#bundle-app-b'
		});

		await new Promise(function (resolve) {
			setTimeout(resolve,100);
		});

		expect(document.querySelector('.bundle-app-a').textContent).toBe('A');
		expect(document.querySelector('.bundle-app-b').textContent).toBe('B');
		expect(a.Component().Application()).toBe(a);
		expect(b.Component().Application()).toBe(b);

		a.Destroy();
		expect(document.querySelector('.bundle-app-a')).toBeNull();
		expect(document.querySelector('.bundle-app-b').textContent).toBe('B');
		b.Destroy();
	});

});