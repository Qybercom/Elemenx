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