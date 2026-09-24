import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

var live=[];

function appWithTemplate (template, create) {
	var root=unique('DeferredRoot');
	Elemenx.Component(root,{
		Template:template,
		ElemenxOnCreate:create || function () {}
	});
	var app=Elemenx.Application(unique('DeferredApp'),{
		Component:root,
		Root:'/deferred-structural',
		Mount:'#mount'
	});
	live.push(app);
	return app;
}

async function appReady (app) {
	return await waitFor(function () {
		return app.Component && app.Component();
	},1500);
}

function destroy (app) {
	var i=live.indexOf(app);
	if (app && app.Destroy) app.Destroy();
	if (i!==-1) live.splice(i,1);
}

describe('Regression: deferred structural composition', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () {
		resetDOM();
		live=[];
		window.DeferredHeldChildCreates=0;
		window.DeferredFinalHeldChildCreates=0;
	});
	afterEach(function () {
		while (live.length) destroy(live[0]);
	});

	it('nested-chain: remote parent discovers child and grandchild', async function () {
		var app=appWithTemplate('<main><DeferredNestedParent value="{{value}}"></DeferredNestedParent></main>',function () { this.State.value='A'; });
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.deferred-nested-grand'); },1500)).not.toBe(false);
		expect(document.querySelector('.deferred-nested-grand').textContent).toBe('G:A');
		destroy(app);
	});

	it('nested-concurrent: keyed deferred children coalesce both child and nested-grandchild loads', async function () {
		var app=appWithTemplate('<div><DeferredConcurrentChild data-each="items" data-key="id"></DeferredConcurrentChild></div>',function () {
			this.State.items=[{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}];
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-concurrent-grand').length===3; },1500)).toBe(true);
		expect(window.DeferredConcurrentChildLoads).toBe(1);
		expect(window.DeferredConcurrentGrandLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.deferred-concurrent-child')).map(function (n) { return n.firstChild.nodeValue; })).toEqual(['A','B','C']);
		destroy(app);
	});

	it('nested-keyed-structural: data-if owns container and unresolved keyed children preserve identity and refresh', async function () {
		var app=appWithTemplate('<section data-if="show"><DeferredKeyedChild data-each="items" data-key="id"></DeferredKeyedChild></section>',function () {
			this.State.show=true;
			this.State.items=[{id:'a',name:'A'},{id:'b',name:'B'}];
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-keyed-child').length===2; },1500)).toBe(true);
		var root=app.Component(), nodes=document.querySelectorAll('.deferred-keyed-child'), a=nodes[0], b=nodes[1];
		root.State.items=[{id:'b',name:'B2'},{id:'a',name:'A2'}];
		await tick();
		nodes=document.querySelectorAll('.deferred-keyed-child');
		expect(nodes[0]).toBe(b);
		expect(nodes[1]).toBe(a);
		expect(Array.from(nodes).map(function (n) { return n.textContent; })).toEqual(['B2','A2']);
		root.State.show=false;
		await tick();
		expect(document.querySelectorAll('.deferred-keyed-child').length).toBe(0);
		root.State.show=true;
		await tick();
		expect(Array.from(document.querySelectorAll('.deferred-keyed-child')).map(function (n) { return n.textContent; })).toEqual(['B2','A2']);
		destroy(app);
	});

	it('nested-destroy-pending: destroying Application while nested deferred child script is held prevents resurrection', async function () {
		var head=document.head, append=head.appendChild, held=null;
		head.appendChild=function (node) {
			if (node.tagName==='SCRIPT' && String(node.src).toLowerCase().indexOf('deferredheldchild.js')!==-1) {
				held=node;
				return node;
			}
			return append.call(this,node);
		};
		try {
			var app=appWithTemplate('<div class="deferred-held-parent"><DeferredHeldChild value="X"></DeferredHeldChild></div>');
			expect(await appReady(app)).not.toBe(false);
			expect(await waitFor(function () { return held; },1500)).not.toBe(false);
			destroy(app);
			head.appendChild=append;
			append.call(head,held);
			await tick(120);
			expect(document.querySelector('.deferred-held-child')).toBeNull();
			expect(window.DeferredHeldChildCreates).toBe(0);
		}
		finally {
			head.appendChild=append;
		}
	});

	it('deferred-each-direct: unresolved component works directly under keyed data-each', async function () {
		var app=appWithTemplate('<div><DeferredDirectChild data-each="items" data-key="id"></DeferredDirectChild></div>',function () {
			this.State.items=[{id:1,name:'A'},{id:2,name:'B'}];
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-direct-child').length===2; },1500)).toBe(true);
		var nodes=document.querySelectorAll('.deferred-direct-child'), a=nodes[0], b=nodes[1];
		app.Component().State.items=[{id:2,name:'B2'},{id:1,name:'A2'},{id:3,name:'C'}];
		await tick();
		nodes=document.querySelectorAll('.deferred-direct-child');
		expect(nodes[0]).toBe(b);
		expect(nodes[1]).toBe(a);
		expect(Array.from(nodes).map(function (n) { return n.textContent; })).toEqual(['B2','A2','C']);
		expect(window.DeferredDirectChildLoads).toBe(1);
		destroy(app);
	});

	it('deferred-each-after-preload: remote keyed parent uses an already registered child definition', async function () {
		var app=appWithTemplate('<div class="deferred-preload-host"></div>');
		expect(await appReady(app)).not.toBe(false);

		var child=Elemenx.Component('DeferredPreloadChild')({name:'PRE'},null,{Application:app});
		document.querySelector('.deferred-preload-host').appendChild(child.Element());
		expect(await waitFor(function () { return document.querySelector('.deferred-preload-child'); },1500)).not.toBe(false);
		expect(window.DeferredPreloadChildLoads).toBe(1);
		child.Destroy();

		var parent=Elemenx.Component('DeferredPreloadParent')({},null,{Application:app});
		document.querySelector('.deferred-preload-host').appendChild(parent.Element());
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-preload-child').length===2; },1500)).toBe(true);
		expect(window.DeferredPreloadChildLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.deferred-preload-child')).map(function (n) { return n.textContent; })).toEqual(['A','B']);

		parent.Destroy();
		destroy(app);
	});

	it('public discovery path: two unresolved remote tags coalesce during one real root compilation', async function () {
		var app=appWithTemplate('<div><DeferredCompileRemote value="A"></DeferredCompileRemote><DeferredCompileRemote value="B"></DeferredCompileRemote></div>');
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.deferred-compile-remote').length===2; },1500)).toBe(true);
		expect(window.DeferredCompileRemoteLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.deferred-compile-remote')).map(function (n) { return n.textContent; })).toEqual(['A','B']);
		destroy(app);
	});

	it('public discovery path: second structural instance reuses loaded remote definition', async function () {
		var app=appWithTemplate('<div><section data-if="show"><DeferredCacheRemote value="{{value}}"></DeferredCacheRemote></section></div>',function () {
			this.State.show=true;
			this.State.value='A';
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.deferred-cache-remote'); },1500)).not.toBe(false);
		expect(window.DeferredCacheRemoteLoads).toBe(1);
		app.Component().State.show=false;
		await tick();
		app.Component().State.value='B';
		app.Component().State.show=true;
		await tick();
		expect(document.querySelector('.deferred-cache-remote').textContent).toBe('B');
		expect(window.DeferredCacheRemoteLoads).toBe(1);
		destroy(app);
	});

	it('public discovery path: Application Destroy while nested RemoteChild script is explicitly held', async function () {
		var head=document.head, append=head.appendChild, held=null;
		var file='DeferredFinalHeldChild.js';
		head.appendChild=function (node) {
			if (node.tagName==='SCRIPT' && String(node.src).toLowerCase().indexOf(file.toLowerCase())!==-1) {
				held=node;
				return node;
			}
			return append.call(this,node);
		};
		try {
			var app=appWithTemplate('<section><DeferredFinalHeldChild value="FINAL"></DeferredFinalHeldChild></section>');
			expect(await appReady(app)).not.toBe(false);
			expect(await waitFor(function () { return held; },1500)).not.toBe(false);
			destroy(app);
			head.appendChild=append;
			append.call(head,held);
			await tick(120);
			expect(document.querySelector('.deferred-final-held-child')).toBeNull();
			expect(window.DeferredFinalHeldChildCreates).toBe(0);
		}
		finally {
			head.appendChild=append;
		}
	});
	it('Application lazy root exposes its real outlet to Router', async function () {
		var route=unique('DeferredRouterRoute');
		Elemenx.Component(route,{Template:'<article class="deferred-router-route">Ready</article>'});

		var app=Elemenx.Application(unique('DeferredRouterApp'),{
			Component:'DeferredRouterRoot',
			Root:'/deferred-structural',
			Mount:'#mount'
		});
		live.push(app);

		expect(await waitFor(function () { return document.querySelector('[data-outlet="Content"]'); },1500)).not.toBe(false);

		var router=Elemenx.Router({
			Root:app.Component(),
			Routes:[{Path:'/',Component:route}]
		});
		router.Start();

		expect(await waitFor(function () { return document.querySelector('.deferred-router-route'); },1500)).not.toBe(false);
		expect(document.querySelector('.deferred-router-route').textContent).toBe('Ready');
		router.Destroy();
	});

});