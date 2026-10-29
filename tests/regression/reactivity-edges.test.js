import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mounted (component) {
	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Regression: the edges of reactivity and of the state of instances', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('a list given back as a copy of itself (Rows.slice()) keeps its items as they were, not wrapped again at each assignment', function () {
		var component = mounted(Elemenx.Component(unique('Copied'), {
			$Template: '<ul><li *for="row of Rows" *key="row.ID">{{row.Title}} {{row.Count}}</li></ul>',
			Rows: [{ID: 'a', Title: 'A', Count: 0}, {ID: 'b', Title: 'B', Count: 0}, {ID: 'c', Title: 'C', Count: 0}]
		})());
		var first = component.Rows[1];
		var times = [];
		var k;

		/* An item changes, the others come back as the proxies the state gave: each assignment costs the same. */
		for (k = 0; k < 40; k++) {
			var start = performance.now();
			var next = component.Rows.slice();

			next[0] = Object.assign({}, next[0], {Count: k});
			component.Rows = next;

			times.push(performance.now() - start);
		}

		expect(component.Rows[1]).toBe(first);
		expect(component.$Element().textContent).toBe('A 39B 0C 0');
		expect(Math.max.apply(null, times.slice(-5))).toBeLessThan(20);
	});

	it('the rows of a collection see the values of their owner named in a binding, a directive and a text', async function () {
		var component = mounted(Elemenx.Component(unique('Named'), {
			$Template: '<ul><li *for="row of Rows" *key="row" [title]="Prefix + row" [class.on]="row === Selected"><b *if="row === Shown">{{row}}{{Tag}}</b></li></ul>',
			Rows: ['a', 'b'],
			Prefix: 'p',
			Selected: 'a',
			Shown: 'a',
			Tag: 't'
		})());
		var items = function () {
			return component.$Element().querySelectorAll('li');
		};

		expect(items()[1].getAttribute('title')).toBe('pb');
		expect(items()[0].classList.contains('on')).toBe(true);
		expect(component.$Element().textContent).toBe('at');

		component.Prefix = 'q';
		component.Selected = 'b';
		component.Shown = 'b';
		component.Tag = 'u';

		await tick(10);

		expect(items()[1].getAttribute('title')).toBe('qb');
		expect(items()[0].classList.contains('on')).toBe(false);
		expect(items()[1].classList.contains('on')).toBe(true);
		expect(component.$Element().textContent).toBe('bu');
	});

	it('an array made shorter by its length renders its removed items again: {{Items[1]}} shows nothing', async function () {
		var component = mounted(Elemenx.Component(unique('Shorter'), {
			$Template: '<p>{{Items[1] || \'none\'}}|{{Items.length}}</p>',
			Items: ['a', 'b', 'c']
		})());

		expect(component.$Element().textContent).toBe('b|3');

		component.Items.length = 0;

		await tick(10);

		expect(component.$Element().textContent).toBe('none|0');

		component.Items.push('x', 'y');

		await tick(10);

		expect(component.$Element().textContent).toBe('y|2');
	});

	it('a key added to an object or taken away renders Object.keys of it and "in" again', async function () {
		var component = mounted(Elemenx.Component(unique('Keys'), {
			$Template: '<p>{{Object.keys(Data).length}}|{{\'b\' in Data}}</p>',
			Data: {a: 1}
		})());

		expect(component.$Element().textContent).toBe('1|false');

		component.Data.b = 2;

		await tick(10);

		expect(component.$Element().textContent).toBe('2|true');

		delete component.Data.b;

		await tick(10);

		expect(component.$Element().textContent).toBe('1|false');
	});

	it('two instances of one definition do not share the objects and the arrays of its values', async function () {
		var stamp = new Date(2026, 0, 1);
		var name = unique('Isolated');
		var first;
		var second;

		Elemenx.Component(name, {
			$Template: '<p>{{Data.x}}|{{Items.length}}|{{Nested.List.length}}</p>',
			Data: {x: 1},
			Items: [],
			Nested: {List: [1]},
			When: stamp
		});

		first = mounted(Elemenx.Component(name)());
		second = mounted(Elemenx.Component(name)());

		first.Data.x = 5;

		first.Items.push('a');
		first.Nested.List.push(2);

		await tick(10);

		expect(first.$Element().textContent).toBe('5|1|2');
		expect(second.$Element().textContent).toBe('1|0|1');
		expect(Elemenx.Component(name)().When).toBe(stamp);
	});
});
