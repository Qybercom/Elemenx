import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

describe('Regression: core / lifecycle / structural state', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('Destroy is idempotent and removes owned DOM listeners', function () {
		var made = 0, gone = 0, hits = 0, name = unique('Life');
		Elemenx.Component(name, {
			Template:'<button #B>go</button>',
			ElemenxOnCreate:function () {
				var self = this;
				made++;
				this.Ref('B').addEventListener('click', function () { hits++; self.State.x = hits; });
			},
			ElemenxOnDestroy:function () { gone++; }
		});
		var c = Elemenx.Component(name)();
		var b = c.Ref('B');
		document.getElementById('mount').appendChild(c.Element());
		b.click();
		c.Destroy();
		c.Destroy();
		b.click();
		expect(made).toBe(1);
		expect(gone).toBe(1);
		expect(hits).toBe(2);
		expect(document.body.contains(c.Element())).toBe(false);
	});

	it('data-if destroys and recreates child with current parent state', async function () {
		var child = unique('IfChild'), root = unique('IfRoot'), made = 0, gone = 0;
		Elemenx.Component(child, {
			Template:'<b class="if-child">{{value}}</b>',
			ElemenxOnCreate:function () { made++; },
			ElemenxOnDestroy:function () { gone++; }
		});
		Elemenx.Component(root, {
			Template:'<section><'+child+' *if="show" value="{{value}}"></'+child+'></section>',
			ElemenxOnCreate:function () { this.State.show = true; this.State.value = 'A'; window.__root = this; }
		});
		var c = Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		expect(document.querySelector('.if-child').textContent).toBe('A');
		window.__root.State.show = false;
		await tick();
		window.__root.State.value = 'B';
		window.__root.State.show = true;
		await tick();
		expect(document.querySelector('.if-child').textContent).toBe('B');
		expect(made).toBe(2);
		expect(gone).toBe(1);
		c.Destroy();
	});

	it('keyed reorder preserves surviving DOM identity', async function () {
		var row = unique('KeyRow'), root = unique('KeyRoot');
		Elemenx.Component(row, {
			Template:'<input class="row" [(value)]="label">'
		});
		Elemenx.Component(root, {
			Template:'<section><'+row+' *for="item of items" *key="item.id" id="{{item.id}}" label="{{item.label}}"></'+row+'></section>',
			ElemenxOnCreate:function () {
				this.State.items = [{id:'a',label:'A'},{id:'b',label:'B'}];
				window.__keyRoot = this;
			}
		});
		var c = Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		var n = document.querySelectorAll('.row'), a = n[0], b = n[1];
		expect(n.length).toBe(2);
		window.__keyRoot.State.items = [{id:'b',label:'B2'},{id:'a',label:'A2'}];
		await tick();
		n = document.querySelectorAll('.row');
		expect(n[0]).toBe(b);
		expect(n[1]).toBe(a);
		expect(n[0].value).toBe('B2');
		expect(n[1].value).toBe('A2');
		c.Destroy();
	});

	it('Batch applies structural and scalar state together', async function () {
		var root = unique('BatchRoot');
		Elemenx.Component(root, {
			Template:'<section><span *if="show" id="batch-value">{{value}}</span></section>',
			ElemenxOnCreate:function () { this.State.show=false; this.State.value='A'; window.__batchRoot=this; }
		});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		window.__batchRoot.Batch(function (s) { s.value='B'; s.show=true; });
		await tick();
		expect(document.getElementById('batch-value').textContent).toBe('B');
		c.Destroy();
	});

	it('parent Destroy recursively destroys structural descendants', async function () {
		var child=unique('DeepChild'), root=unique('DeepRoot'), gone=0;
		Elemenx.Component(child,{Template:'<i class="deep-child">{{label}}</i>',ElemenxOnDestroy:function () {gone++;}});
		Elemenx.Component(root,{Template:'<div><'+child+' *for="item of items" *key="item.id" id="{{item.id}}" label="{{item.label}}"></'+child+'></div>',ElemenxOnCreate:function () {this.State.items=[{id:1,label:'A'},{id:2,label:'B'}];}});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		expect(document.querySelectorAll('.deep-child').length).toBe(2);
		c.Destroy();
		expect(gone).toBe(2);
		expect(document.querySelectorAll('.deep-child').length).toBe(0);
	});

	it('keyed remove/add/reorder preserves survivors and lifecycle', async function () {
		var row=unique('ChurnRow'),root=unique('ChurnRoot'),made=0,gone=0,instances={};
		Elemenx.Component(row,{
			Template:'<span class="churn-row">{{label}}</span>',
			ElemenxOnCreate:function () {made++;instances[this.State.id]=this;},
			ElemenxOnDestroy:function () {gone++;}
		});
		Elemenx.Component(root,{
			Template:'<div><'+row+' *for="item of items" *key="item.id" id="{{item.id}}" label="{{item.label}}"></'+row+'></div>',
			ElemenxOnCreate:function () {this.State.items=[{id:'a',label:'A'},{id:'b',label:'B'},{id:'c',label:'C'}];window.__churn=this;}
		});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		var a=instances.a,c0=instances.c;
		window.__churn.State.items=[{id:'c',label:'C2'},{id:'a',label:'A2'},{id:'d',label:'D'}];
		await tick();
		expect(instances.a).toBe(a);
		expect(instances.c).toBe(c0);
		expect(made).toBe(4);
		expect(gone).toBe(1);
		expect(Array.from(document.querySelectorAll('.churn-row')).map(function (n) {return n.textContent;}).join('|')).toBe('C2|A2|D');
		c.Destroy();
		expect(gone).toBe(4);
	});

	it('parent and child state stay isolated across destroy/recreate', async function () {
		var child=unique('IsoChild'),root=unique('IsoRoot'),made=0,last=null;
		Elemenx.Component(child,{
			Template:'<div class="iso-child">{{value}}/{{local}}</div>',
			ElemenxOnCreate:function () {made++;this.State.local='L'+made;last=this;}
		});
		Elemenx.Component(root,{
			Template:'<section><'+child+' *if="show" value="{{value}}"></'+child+'><b id="iso-parent">{{value}}</b></section>',
			ElemenxOnCreate:function () {this.State.show=true;this.State.value='P1';window.__iso=this;}
		});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		var first=last;
		first.State.value='CHILD';
		await tick();
		expect(document.getElementById('iso-parent').textContent).toBe('P1');
		window.__iso.State.show=false;
		await tick();
		window.__iso.State.value='P2';
		window.__iso.State.show=true;
		await tick();
		expect(last).not.toBe(first);
		expect(document.querySelector('.iso-child').textContent).toBe('P2/L2');
		expect(document.getElementById('iso-parent').textContent).toBe('P2');
		c.Destroy();
	});

	it('deep keyed/if/model/event lifecycle composition remains coherent', async function () {
		var row=unique('ComboRow'),root=unique('ComboRoot'),made=0,gone=0;
		Elemenx.Component(row,{
			Template:'<div class="combo-row"><input class="combo-input" [(value)]="label"><button (click)="Remove">x</button><i *if="enabled">{{label}}</i></div>',
			Remove:function () {this.Emit('remove',{id:this.State.id});},
			ElemenxOnCreate:function () {made++;},
			ElemenxOnDestroy:function () {gone++;}
		});
		Elemenx.Component(root,{
			Template:'<section><'+row+' *for="item of items" *key="item.id" id="{{item.id}}" label="{{item.label}}" enabled="{{item.enabled}}" (remove)="Remove"></'+row+'></section>',
			ElemenxOnCreate:function () {this.State.items=[{id:'a',label:'A',enabled:true},{id:'b',label:'B',enabled:false}];window.__combo=this;},
			Remove:function (e) {var next=[],i=0;while (i<this.State.items.length) {if (this.State.items[i].id!==e.id)next.push(this.State.items[i]);i++;}this.State.items=next;}
		});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		var inputs=document.querySelectorAll('.combo-input'),b=inputs[1];
		b.value='B2';
		b.dispatchEvent(new Event('input',{bubbles:true}));
		expect(b.value).toBe('B2');
		window.__combo.State.items[1].enabled=true;
		await tick();
		expect(document.querySelectorAll('.combo-row i').length).toBe(2);
		document.querySelector('.combo-row button').click();
		await tick();
		expect(document.querySelectorAll('.combo-row').length).toBe(1);
		expect(document.querySelector('.combo-input')).toBe(b);
		expect(made).toBe(2);
		expect(gone).toBe(1);
		c.Destroy();
		expect(gone).toBe(2);
	});

});