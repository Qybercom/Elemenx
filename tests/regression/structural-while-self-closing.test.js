import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: self-closing components / data-for', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('expands XML-style self-closing component tags before HTML parsing', function () {
		var child=unique('SelfClosingChild'), root=unique('SelfClosingRoot');
		Elemenx.Component(child,{Template:'<strong class="self-closing-child">{{label}}</strong>'});
		Elemenx.Component(root,{Template:'<section><'+child+' label="OK" /><span class="after-child">AFTER</span></section>'});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		expect(document.querySelector('.self-closing-child').textContent).toBe('OK');
		expect(document.querySelector('.after-child').textContent).toBe('AFTER');
		c.Destroy();
	});

	it('data-for supports a local counter with initializer, condition and update', function () {
		var root=unique('WhileCounterRoot');
		Elemenx.Component(root,{
			Template:'<section><span class="while-counter" data-for="i = 0; i < 4; i++">{{i}}</span></section>'
		});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		var rows=document.querySelectorAll('.while-counter');
		expect(rows.length).toBe(4);
		expect(Array.prototype.map.call(rows,function (row) { return row.textContent; })).toEqual(['0','1','2','3']);
		c.Destroy();
	});


	it('does not HTML-decode entities inside Elemenx expressions', function () {
		var rawName=unique('RawExpressionRoot');
		var encodedName=unique('EncodedExpressionRoot');
		var raw;
		var encoded;
		
		Elemenx.Component(rawName,{
			Template:'<section><span class="raw-counter" data-for="i = 0; i < 2; i++">{{i}}</span></section>'
		});
		raw=Elemenx.Component(rawName)();
		document.getElementById('mount').appendChild(raw.Element());
		expect(document.querySelectorAll('.raw-counter').length).toBe(2);
		raw.Destroy();
		
		Elemenx.Component(encodedName,{
			Template:'<section><span class="encoded-counter" data-for="i = 0; i &lt; 2; i++">{{i}}</span></section>'
		});
		expect(function () {
			encoded=Elemenx.Component(encodedName)();
		}).toThrow(/i &lt; 2/);
	});

	it('data-for supports for..of and nested structural conditions', function () {
		var root=unique('ForOfRoot');
		Elemenx.Component(root,{Template:'<section><div class="for-of-row" data-for="item of Items"><span>{{$index}}:{{item.name}}</span><b data-if="item.hot">HOT</b></div></section>',ElemenxOnCreate:function () { this.State.Items=[{name:'A',hot:false},{name:'B',hot:true},{name:'C',hot:false}]; }});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		var rows=document.querySelectorAll('.for-of-row');
		expect(rows.length).toBe(3);
		expect(rows[0].textContent).toContain('0:A');
		expect(rows[1].textContent).toContain('1:B');
		expect(rows[1].textContent).toContain('HOT');
		c.Destroy();
	});

	it('data-for supports for..in', function () {
		var root=unique('ForInRoot');
		Elemenx.Component(root,{Template:'<section><span class="for-in-row" data-for="key in Values">{{key}}={{Values[key]}}</span></section>',ElemenxOnCreate:function () { this.State.Values={a:1,b:2}; }});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		expect(Array.prototype.map.call(document.querySelectorAll('.for-in-row'),function (row) { return row.textContent; })).toEqual(['a=1','b=2']);
		c.Destroy();
	});

	it('data-key preserves identity and reorders retained data-for instances', function () {
		var root=unique('KeyedForRoot');
		Elemenx.Component(root,{Template:'<section><button class="keyed-row" data-for="item of Items" data-key="item.id">{{item.id}}</button></section>',ElemenxOnCreate:function () { this.State.Items=[{id:'a'},{id:'b'},{id:'c'}]; }});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		var before=document.querySelectorAll('.keyed-row');
		var a=before[0],b=before[1],cNode=before[2];
		c.State.Items=[{id:'c'},{id:'a'},{id:'b'}];
		var after=document.querySelectorAll('.keyed-row');
		expect(after[0]).toBe(cNode);
		expect(after[1]).toBe(a);
		expect(after[2]).toBe(b);
		c.Destroy();
	});

	it('classic data-for keeps a condition assignment in the iteration local scope', function () {
		var root=unique('ForConditionLocal');
		Elemenx.Component(root,{
			Template:'<section><div class="condition-local" data-for="i = 0; item = QueueItem(i); i++">{{item.name}}<b data-if="item.ready">READY</b></div></section>',
			QueueItem:function (index) {
				return index < 2 ? {name:index === 0 ? 'A' : 'B',ready:index === 1} : null;
			}
		});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		var rows=document.querySelectorAll('.condition-local');
		expect(rows.length).toBe(2);
		expect(rows[0].textContent).toContain('A');
		expect(rows[1].textContent).toContain('B');
		expect(rows[1].querySelector('b').textContent).toBe('READY');
		expect(window.item).toBeUndefined();
		c.Destroy();
	});
});