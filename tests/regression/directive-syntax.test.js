import {describe, expect, test, beforeEach} from 'vitest';
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
			Template:'<button [title]="Title" (click)="Hit">hit</button>',
			Hit:function () { hits++; }
		});
		var child=factory({Title:'hello'});
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
});