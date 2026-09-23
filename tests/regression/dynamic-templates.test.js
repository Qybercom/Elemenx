import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

describe('Regression: dynamic templates / structural composition', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('Function Template creates independent reactive instances', async function () {
		var name=unique('DynamicTemplateBasic'), source='<section class="remote">{{message}}</section>';
		Elemenx.Component(name,{
			Template:function () { return source; },
			ElemenxOnCreate:function (data) { this.State.message=data.message; }
		});
		var factory=Elemenx.Component(name), a=factory({message:'A'}), b=factory({message:'B'}), mount=document.getElementById('mount');
		mount.appendChild(a.Element());
		mount.appendChild(b.Element());
		await tick();
		var nodes=document.querySelectorAll('.remote');
		expect(nodes.length).toBe(2);
		expect(nodes[0].textContent).toBe('A');
		expect(nodes[1].textContent).toBe('B');
		a.State.message='A2';
		await tick();
		expect(nodes[0].textContent).toBe('A2');
		expect(nodes[1].textContent).toBe('B');
		a.Destroy();
		b.Destroy();
	});

	it('Function Template recreates nested data-if with current state', async function () {
		var name=unique('DynamicTemplateIf'), owner, source='<div><section data-if="outer"><b data-if="inner" class="leaf">{{text}}</b></section></div>';
		Elemenx.Component(name,{
			Template:function () { return source; },
			ElemenxOnCreate:function () {
				owner=this;
				this.State.outer=true;
				this.State.inner=true;
				this.State.text='A';
			}
		});
		var c=Elemenx.Component(name)({});
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		expect(document.querySelector('.leaf').textContent).toBe('A');
		owner.State.inner=false;
		await tick();
		expect(document.querySelector('.leaf')).toBeNull();
		owner.State.inner=true;
		owner.State.text='B';
		await tick();
		expect(document.querySelector('.leaf').textContent).toBe('B');
		owner.State.outer=false;
		await tick();
		expect(document.querySelector('.leaf')).toBeNull();
		owner.State.outer=true;
		await tick();
		expect(document.querySelector('.leaf').textContent).toBe('B');
		c.Destroy();
	});

	it('Function Template preserves keyed data-each identity and events', async function () {
		var row=unique('DynamicTemplateRow'), root=unique('DynamicTemplateEach'), owner, hits='', source='<div><'+row+' data-each="items" data-key="id"></'+row+'></div>';
		Elemenx.Component(row,{
			Template:'<button class="row" data-on-click="Hit">{{name}}</button>',
			Hit:function () { hits+=this.State.name; }
		});
		Elemenx.Component(root,{
			Template:function () { return source; },
			ElemenxOnCreate:function () {
				owner=this;
				this.State.items=[{id:1,name:'A'},{id:2,name:'B'},{id:3,name:'C'}];
			}
		});
		var c=Elemenx.Component(root)({});
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		var nodes=document.querySelectorAll('.row'), a=nodes[0], cc=nodes[2];
		owner.State.items=[{id:3,name:'C2'},{id:4,name:'D'},{id:1,name:'A2'}];
		await tick();
		nodes=document.querySelectorAll('.row');
		expect(nodes.length).toBe(3);
		expect(nodes[0]).toBe(cc);
		expect(nodes[2]).toBe(a);
		expect(nodes[0].textContent).toBe('C2');
		expect(nodes[2].textContent).toBe('A2');
		nodes[0].click();
		nodes[2].click();
		expect(hits).toBe('C2A2');
		c.Destroy();
	});

	it('Function Template composes data-if with keyed component collection', async function () {
		var cell=unique('DynamicTemplateCell'), root=unique('DynamicTemplateMix'), owner, made=0, gone=0, source='<div><section data-if="show"><'+cell+' data-each="items" data-key="id"></'+cell+'></section></div>';
		Elemenx.Component(cell,{
			Template:'<span class="cell">{{name}}</span>',
			ElemenxOnCreate:function () { made++; },
			ElemenxOnDestroy:function () { gone++; }
		});
		Elemenx.Component(root,{
			Template:function () { return source; },
			ElemenxOnCreate:function () {
				owner=this;
				this.State.show=true;
				this.State.items=[{id:1,name:'A'},{id:2,name:'B'}];
			}
		});
		var c=Elemenx.Component(root)({});
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		expect(document.querySelectorAll('.cell').length).toBe(2);
		owner.State.show=false;
		await tick();
		expect(document.querySelectorAll('.cell').length).toBe(0);
		owner.State.items=[{id:2,name:'B2'},{id:3,name:'C'}];
		owner.State.show=true;
		await tick();
		var nodes=document.querySelectorAll('.cell');
		expect(nodes.length).toBe(2);
		expect(nodes[0].textContent).toBe('B2');
		expect(nodes[1].textContent).toBe('C');
		expect(made).toBe(4);
		expect(gone).toBe(2);
		c.Destroy();
	});

	it('Function Template destroy/recreate detaches dead listeners', async function () {
		var name=unique('DynamicTemplateDead'), made=0, gone=0, hits=0, source='<button class="dead" data-on-click="Hit">{{text}}</button>';
		Elemenx.Component(name,{
			Template:function () { return source; },
			ElemenxOnCreate:function (data) { made++; this.State.text=data.text; },
			ElemenxOnDestroy:function () { gone++; },
			Hit:function () { hits++; }
		});
		var factory=Elemenx.Component(name), mount=document.getElementById('mount'), a=factory({text:'A'});
		mount.appendChild(a.Element());
		await tick();
		var old=document.querySelector('.dead');
		old.click();
		a.Destroy();
		old.click();
		var b=factory({text:'B'});
		mount.appendChild(b.Element());
		await tick();
		document.querySelector('.dead').click();
		expect(made).toBe(2);
		expect(gone).toBe(1);
		expect(hits).toBe(2);
		expect(old.isConnected).toBe(false);
		expect(document.querySelector('.dead').textContent).toBe('B');
		b.Destroy();
	});

	it('Function Template composes slot projection with structural content', async function () {
		var box=unique('DynamicTemplateBox'), root=unique('DynamicTemplateSlot'), owner, source='<div><'+box+'><b data-if="show" class="projected">{{text}}</b></'+box+'></div>';
		Elemenx.Component(box,{Template:'<div class="box"><slot></slot></div>'});
		Elemenx.Component(root,{
			Template:function () { return source; },
			ElemenxOnCreate:function () {
				owner=this;
				this.State.show=true;
				this.State.text='A';
			}
		});
		var c=Elemenx.Component(root)({});
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		var projected=document.querySelector('.projected');
		expect(projected.closest('.box')).not.toBeNull();
		owner.State.show=false;
		await tick();
		expect(document.querySelector('.projected')).toBeNull();
		owner.State.text='B';
		owner.State.show=true;
		await tick();
		projected=document.querySelector('.projected');
		expect(projected).not.toBeNull();
		expect(projected.textContent).toBe('B');
		c.Destroy();
	});

	it('Function Template survives deep model / nested-if / keyed / event composition', async function () {
		var row=unique('DynamicTemplateDeepRow');
		var root=unique('DynamicTemplateDeep');
		var owner;
		var hits='';
		var source='<div><input class="edit" data-model="title"><section data-if="outer"><div data-if="inner">'+
			'<'+row+' data-each="items" data-key="id"></'+row+'></div></section></div>';
		Elemenx.Component(row,{
			Template:'<button class="deep-row" data-on-click="Hit">{{name}}</button>',
			Hit:function () { hits+=this.State.name; }
		});
		Elemenx.Component(root,{
			Template:function () { return source; },
			ElemenxOnCreate:function () {
				owner=this;
				this.State.title='T';
				this.State.outer=true;
				this.State.inner=true;
				this.State.items=[{id:1,name:'A'},{id:2,name:'B'}];
			}
		});
		var c=Elemenx.Component(root)({});
		document.getElementById('mount').appendChild(c.Element());
		await tick();
		var input=document.querySelector('.edit');
		expect(input.value).toBe('T');
		input.value='T2';
		input.dispatchEvent(new Event('input',{bubbles:true}));
		await tick();
		expect(owner.State.title).toBe('T2');
		var rows=document.querySelectorAll('.deep-row'), a=rows[0];
		owner.State.items=[{id:2,name:'B2'},{id:1,name:'A2'}];
		await tick();
		rows=document.querySelectorAll('.deep-row');
		expect(rows[1]).toBe(a);
		rows[1].click();
		owner.State.inner=false;
		await tick();
		expect(document.querySelectorAll('.deep-row').length).toBe(0);
		owner.State.inner=true;
		await tick();
		rows=document.querySelectorAll('.deep-row');
		expect(rows.length).toBe(2);
		expect(rows[0].textContent).toBe('B2');
		expect(rows[1].textContent).toBe('A2');
		rows[0].click();
		expect(hits).toBe('A2B2');
		c.Destroy();
	});
});