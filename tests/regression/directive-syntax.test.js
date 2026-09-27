import {describe, expect, test, beforeEach} from 'vitest';
import { tick } from '../setup.js';
import '../../elemenx.js';

var serial=0;

function unique (prefix) {
	serial++;
	return prefix+Date.now()+serial;
}

describe('Regression: directive syntax', function () {
	beforeEach(function () {
		document.body.innerHTML='';
	});

	test('*if, *for and *key compile and disappear from live DOM', function () {
		var name=unique('DirectiveSyntax');
		var factory=Elemenx.Component(name,{
			Template:'<section><span *if="Visible">visible</span><b *for="item of Items" *key="item.id">{{item.name}}</b></section>'
		});
		var child=factory({Visible:true,Items:[{id:1,name:'one'},{id:2,name:'two'}]});
		document.body.appendChild(child.Element());

		expect(child.Element().textContent).toContain('visible');
		expect(child.Element().textContent).toContain('one');
		expect(child.Element().textContent).toContain('two');
		expect(child.Element().querySelector('[\\*if]')).toBe(null);
		expect(child.Element().querySelector('[\\*for]')).toBe(null);
		expect(child.Element().querySelector('[\\*key]')).toBe(null);
		child.Destroy();
	});

	test('*outlet and #ref register then disappear from live DOM', function () {
		var name=unique('MetadataSyntax');
		var factory=Elemenx.Component(name,{
			Template:'<section><main *outlet="Main"></main><input #search></section>'
		});
		var child=factory({});
		document.body.appendChild(child.Element());

		expect(child.Ref('search').tagName).toBe('INPUT');
		expect(child.Element().querySelector('[\\*outlet]')).toBe(null);
		expect(child.Element().querySelector('[\\#search]')).toBe(null);
		child.Destroy();
	});

	test('bindings and events are consumed from live DOM', function () {
		var name=unique('ConsumedSyntax');
		var hits=0;
		var factory=Elemenx.Component(name,{
			Template:'<button [title]="Tooltip" (click)="Hit">hit</button>',
			Hit:function () { hits++; }
		});
		var child=factory({Tooltip:'hello'});
		document.body.appendChild(child.Element());

		expect(child.Element().title).toBe('hello');
		expect(child.Element().hasAttribute('[title]')).toBe(false);
		expect(child.Element().hasAttribute('(click)')).toBe(false);
		child.Element().click();
		expect(hits).toBe(1);
		child.Destroy();
	});

	test('classic *for keeps raw less-than expression', function () {
		var name=unique('RawForSyntax');
		var factory=Elemenx.Component(name,{
			Template:'<div><i *for="i = 0; i < 3; i++">{{i}}</i></div>'
		});
		var child=factory({});
		document.body.appendChild(child.Element());

		expect(child.Element().textContent).toBe('012');
		child.Destroy();
	});
	test('[(value)], [(checked)] and [(selected)] are consumed and synchronize explicit targets', function () {
		var name=unique('TwoWaySyntax');
		var factory=Elemenx.Component(name,{
			Template:'<div><input class="value" [(value)]="Text"><input class="checked" type="checkbox" [(checked)]="Enabled"><select class="selected" [(selected)]="Choice"><option value="one">One</option><option value="two">Two</option></select></div>'
		});
		var child=factory({Text:'A',Enabled:true,Choice:'two'});
		var root=child.Element();
		var value=root.querySelector('.value');
		var checked=root.querySelector('.checked');
		var selected=root.querySelector('.selected');
		document.body.appendChild(root);

		expect(value.value).toBe('A');
		expect(checked.checked).toBe(true);
		expect(selected.value).toBe('two');
		expect(value.hasAttribute('[(value)]')).toBe(false);
		expect(checked.hasAttribute('[(checked)]')).toBe(false);
		expect(selected.hasAttribute('[(selected)]')).toBe(false);

		value.value='B';
		value.dispatchEvent(new Event('input',{bubbles:true}));
		checked.checked=false;
		checked.dispatchEvent(new Event('change',{bubbles:true}));
		selected.value='one';
		selected.dispatchEvent(new Event('change',{bubbles:true}));

		expect(child.Text).toBe('B');
		expect(child.Enabled).toBe(false);
		expect(child.Choice).toBe('one');

		child.Text='C';
		child.Enabled=true;
		child.Choice='two';
		expect(value.value).toBe('C');
		expect(checked.checked).toBe(true);
		expect(selected.value).toBe('two');
		child.Destroy();
	});

	test('explicit two-way bindings use flat component definition values as their initial reactive source', function () {
		var name=unique('TwoWayDefinitionState');
		var factory=Elemenx.Component(name,{
			Template:'<div><input class="value" [(value)]="Text"><input class="checked" type="checkbox" [(checked)]="Enabled"><select class="selected" [(selected)]="Choice"><option value="one">One</option><option value="two">Two</option></select><span class="state">{{Text}}|{{Enabled}}|{{Choice}}</span></div>',
			Text:'Initial',
			Enabled:true,
			Choice:'two'
		});
		var child=factory();
		var root=child.Element();
		var value=root.querySelector('.value');
		var checked=root.querySelector('.checked');
		var selected=root.querySelector('.selected');
		document.body.appendChild(root);

		expect(value.value).toBe('Initial');
		expect(checked.checked).toBe(true);
		expect(selected.value).toBe('two');
		expect(root.querySelector('.state').textContent).toBe('Initial|true|two');

		value.value='Changed';
		value.dispatchEvent(new Event('input',{bubbles:true}));
		checked.checked=false;
		checked.dispatchEvent(new Event('change',{bubbles:true}));
		selected.value='one';
		selected.dispatchEvent(new Event('change',{bubbles:true}));

		expect(root.querySelector('.state').textContent).toBe('Changed|false|one');
		child.Destroy();
	});

	test('runtime structural and projection hosts do not expose internal data-* metadata', function () {
		var childName=unique('ProjectionMetadataChild');
		var parentName=unique('ProjectionMetadataParent');
		Elemenx.Component(childName,{Template:'<section><slot></slot></section>'});
		var factory=Elemenx.Component(parentName,{
			Template:'<div><'+childName+'><span *if="Visible">Projected</span></'+childName+'></div>'
		});
		var component=factory({Visible:true});
		document.body.appendChild(component.Element());

		expect(component.Element().querySelector('[data-ui-slot-group]')).toBeNull();
		expect(component.Element().querySelector('[data-ui-structural-root]')).toBeNull();
		component.Destroy();
	});

	test('root structural host does not expose internal data-* metadata', function () {
		var name=unique('StructuralRootMetadata');
		var factory=Elemenx.Component(name,{Template:'<div *if="Visible">Visible</div>'});
		var component=factory({Visible:true});
		document.body.appendChild(component.Element());

		expect(component.Element().hasAttribute('data-ui-structural-root')).toBe(false);
		expect(component.Element().querySelector('[data-ui-structural-root]')).toBeNull();
		component.Destroy();
	});

	test('component definition values are reactive flat instance properties without public State', async function () {
		var name=unique('FlatComponentValues');
		var factory=Elemenx.Component(name,{
			Template:'<button (click)="Increment">{{Count}} / {{Label}}</button>',
			Count:1,
			Label:'Ready',
			Increment:function () {
				this.Count++;
				this.Label='Changed';
			}
		});
		var component=factory();

		expect(component.State).toBeUndefined();
		expect(component.Count).toBe(1);
		expect(component.Label).toBe('Ready');
		component.Element().click();
		await tick();
		expect(component.Count).toBe(2);
		expect(component.Label).toBe('Changed');
		expect(component.Element().textContent).toBe('2 / Changed');
		component.Destroy();
	});

	test('incoming component values override flat definition defaults and stay reactive', async function () {
		var name=unique('FlatComponentProps');
		var factory=Elemenx.Component(name,{
			Template:'<span>{{Value}} / {{Extra}}</span>',
			Value:'default'
		});
		var component=factory({Value:'prop',Extra:'extra'});

		expect(component.Value).toBe('prop');
		expect(component.Extra).toBe('extra');
		component.Extra='changed';
		await tick();
		expect(component.Element().textContent).toBe('prop / changed');
		component.Destroy();
	});

	test('component values cannot shadow the Component API', function () {
		var name=unique('FlatComponentCollision');
		var factory=Elemenx.Component(name,{Template:'<div></div>'});
		expect(function () {
			factory({Router:'value'});
		}).toThrow(/conflicts with Component API: Router/);
	});

});