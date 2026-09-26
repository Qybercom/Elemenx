import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: self-closing components / data-while', function () {
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

	it('data-while supports a local counter with initializer, condition and update', function () {
		var root=unique('WhileCounterRoot');
		Elemenx.Component(root,{
			Template:'<section><span class="while-counter" data-while="i = 0; i < 4; i++">{{i}}</span></section>'
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
			Template:'<section><span class="raw-counter" data-while="i = 0; i < 2; i++">{{i}}</span></section>'
		});
		raw=Elemenx.Component(rawName)();
		document.getElementById('mount').appendChild(raw.Element());
		expect(document.querySelectorAll('.raw-counter').length).toBe(2);
		raw.Destroy();
		
		Elemenx.Component(encodedName,{
			Template:'<section><span class="encoded-counter" data-while="i = 0; i &lt; 2; i++">{{i}}</span></section>'
		});
		encoded=Elemenx.Component(encodedName)();
		document.getElementById('mount').appendChild(encoded.Element());
		expect(document.querySelectorAll('.encoded-counter').length).toBe(0);
		encoded.Destroy();
	});

	it('data-while renders from an arbitrary iterator expression with local value and index', function () {
		var root=unique('WhileRoot');
		Elemenx.Component(root,{
			Template:'<section><div class="while-row" data-while="item = Next($index)"><span>{{$index}}:{{item.name}}</span><b data-if="item.hot">HOT</b></div></section>',
			ElemenxOnCreate:function () {
				var items=[{name:'A',hot:false},{name:'B',hot:true},{name:'C',hot:false}];
				this.State.Next=function (index) { return items[index] || null; };
			}
		});
		var c=Elemenx.Component(root)();
		document.getElementById('mount').appendChild(c.Element());
		var rows=document.querySelectorAll('.while-row');
		expect(rows.length).toBe(3);
		expect(rows[0].textContent).toContain('0:A');
		expect(rows[1].textContent).toContain('1:B');
		expect(rows[1].textContent).toContain('HOT');
		expect(rows[0].textContent).not.toContain('HOT');
		c.Destroy();
	});
});