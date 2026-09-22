import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

var live=[];

function appWithTemplate (template, create) {
	var root=unique('P8Root');
	Elemenx.Component(root,{
		Template:template,
		ElemenxOnCreate:create || function () {}
	});
	var app=Elemenx.Application(unique('P8App'),{
		Component:root,
		Root:'/phase8',
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

describe('Regression: historical Phase 8 deferred structural composition', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () {
		resetDOM();
		live=[];
		window.P8HeldChildCreates=0;
		window.P8FinalHeldChildCreates=0;
	});
	afterEach(function () {
		while (live.length) destroy(live[0]);
	});

	it('nested-chain: remote parent discovers child and grandchild', async function () {
		var app=appWithTemplate('<main><P8NestedParent value="{{value}}"></P8NestedParent></main>',function () { this.State.value='A'; });
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.p8-nested-grand'); },1500)).not.toBe(false);
		expect(document.querySelector('.p8-nested-grand').textContent).toBe('G:A');
		destroy(app);
	});

	it('nested-concurrent: keyed deferred children coalesce both child and nested-grandchild loads', async function () {
		var app=appWithTemplate('<div><P8ConcurrentChild data-each="items" data-key="id"></P8ConcurrentChild></div>',function () {
			this.State.items=[{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}];
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.p8-concurrent-grand').length===3; },1500)).toBe(true);
		expect(window.P8ConcurrentChildLoads).toBe(1);
		expect(window.P8ConcurrentGrandLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.p8-concurrent-child')).map(function (n) { return n.firstChild.nodeValue; })).toEqual(['A','B','C']);
		destroy(app);
	});

	it('nested-keyed-structural: data-if owns container and unresolved keyed children preserve identity and refresh', async function () {
		var app=appWithTemplate('<section data-if="show"><P8KeyedChild data-each="items" data-key="id"></P8KeyedChild></section>',function () {
			this.State.show=true;
			this.State.items=[{id:'a',name:'A'},{id:'b',name:'B'}];
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.p8-keyed-child').length===2; },1500)).toBe(true);
		var root=app.Component(), nodes=document.querySelectorAll('.p8-keyed-child'), a=nodes[0], b=nodes[1];
		root.State.items=[{id:'b',name:'B2'},{id:'a',name:'A2'}];
		await tick();
		nodes=document.querySelectorAll('.p8-keyed-child');
		expect(nodes[0]).toBe(b);
		expect(nodes[1]).toBe(a);
		expect(Array.from(nodes).map(function (n) { return n.textContent; })).toEqual(['B2','A2']);
		root.State.show=false;
		await tick();
		expect(document.querySelectorAll('.p8-keyed-child').length).toBe(0);
		root.State.show=true;
		await tick();
		expect(Array.from(document.querySelectorAll('.p8-keyed-child')).map(function (n) { return n.textContent; })).toEqual(['B2','A2']);
		destroy(app);
	});

	it('nested-destroy-pending: destroying Application while nested deferred child script is held prevents resurrection', async function () {
		var head=document.head, append=head.appendChild, held=null;
		head.appendChild=function (node) {
			if (node.tagName==='SCRIPT' && String(node.src).toLowerCase().indexOf('p8heldchild.js')!==-1) {
				held=node;
				return node;
			}
			return append.call(this,node);
		};
		try {
			var app=appWithTemplate('<div class="p8-held-parent"><P8HeldChild value="X"></P8HeldChild></div>');
			expect(await appReady(app)).not.toBe(false);
			expect(await waitFor(function () { return held; },1500)).not.toBe(false);
			destroy(app);
			head.appendChild=append;
			append.call(head,held);
			await tick(120);
			expect(document.querySelector('.p8-held-child')).toBeNull();
			expect(window.P8HeldChildCreates).toBe(0);
		}
		finally {
			head.appendChild=append;
		}
	});

	it('deferred-each-direct: unresolved component works directly under keyed data-each', async function () {
		var app=appWithTemplate('<div><P8DirectChild data-each="items" data-key="id"></P8DirectChild></div>',function () {
			this.State.items=[{id:1,name:'A'},{id:2,name:'B'}];
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.p8-direct-child').length===2; },1500)).toBe(true);
		var nodes=document.querySelectorAll('.p8-direct-child'), a=nodes[0], b=nodes[1];
		app.Component().State.items=[{id:2,name:'B2'},{id:1,name:'A2'},{id:3,name:'C'}];
		await tick();
		nodes=document.querySelectorAll('.p8-direct-child');
		expect(nodes[0]).toBe(b);
		expect(nodes[1]).toBe(a);
		expect(Array.from(nodes).map(function (n) { return n.textContent; })).toEqual(['B2','A2','C']);
		expect(window.P8DirectChildLoads).toBe(1);
		destroy(app);
	});

	it('deferred-each-after-preload: remote keyed parent uses an already registered child definition', async function () {
		var app=appWithTemplate('<div class="p8-preload-host"></div>');
		expect(await appReady(app)).not.toBe(false);

		var child=Elemenx.Component('P8PreloadChild')({name:'PRE'},null,{Application:app});
		document.querySelector('.p8-preload-host').appendChild(child.Element());
		expect(await waitFor(function () { return document.querySelector('.p8-preload-child'); },1500)).not.toBe(false);
		expect(window.P8PreloadChildLoads).toBe(1);
		child.Destroy();

		var parent=Elemenx.Component('P8PreloadParent')({},null,{Application:app});
		document.querySelector('.p8-preload-host').appendChild(parent.Element());
		expect(await waitFor(function () { return document.querySelectorAll('.p8-preload-child').length===2; },1500)).toBe(true);
		expect(window.P8PreloadChildLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.p8-preload-child')).map(function (n) { return n.textContent; })).toEqual(['A','B']);

		parent.Destroy();
		destroy(app);
	});

	it('8.16 public path: two unresolved remote tags coalesce during one real root compilation', async function () {
		var app=appWithTemplate('<div><P8CompileRemote value="A"></P8CompileRemote><P8CompileRemote value="B"></P8CompileRemote></div>');
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelectorAll('.p8-compile-remote').length===2; },1500)).toBe(true);
		expect(window.P8CompileRemoteLoads).toBe(1);
		expect(Array.from(document.querySelectorAll('.p8-compile-remote')).map(function (n) { return n.textContent; })).toEqual(['A','B']);
		destroy(app);
	});

	it('8.16 public path: second structural instance reuses loaded remote definition', async function () {
		var app=appWithTemplate('<div><section data-if="show"><P8CacheRemote value="{{value}}"></P8CacheRemote></section></div>',function () {
			this.State.show=true;
			this.State.value='A';
		});
		expect(await appReady(app)).not.toBe(false);
		expect(await waitFor(function () { return document.querySelector('.p8-cache-remote'); },1500)).not.toBe(false);
		expect(window.P8CacheRemoteLoads).toBe(1);
		app.Component().State.show=false;
		await tick();
		app.Component().State.value='B';
		app.Component().State.show=true;
		await tick();
		expect(document.querySelector('.p8-cache-remote').textContent).toBe('B');
		expect(window.P8CacheRemoteLoads).toBe(1);
		destroy(app);
	});

	it('8.16 public path: Application Destroy while nested RemoteChild script is explicitly held', async function () {
		var head=document.head, append=head.appendChild, held=null;
		var file='P8FinalHeldChild.js';
		head.appendChild=function (node) {
			if (node.tagName==='SCRIPT' && String(node.src).toLowerCase().indexOf(file.toLowerCase())!==-1) {
				held=node;
				return node;
			}
			return append.call(this,node);
		};
		try {
			var app=appWithTemplate('<section><P8FinalHeldChild value="FINAL"></P8FinalHeldChild></section>');
			expect(await appReady(app)).not.toBe(false);
			expect(await waitFor(function () { return held; },1500)).not.toBe(false);
			destroy(app);
			head.appendChild=append;
			append.call(head,held);
			await tick(120);
			expect(document.querySelector('.p8-final-held-child')).toBeNull();
			expect(window.P8FinalHeldChildCreates).toBe(0);
		}
		finally {
			head.appendChild=append;
		}
	});
});