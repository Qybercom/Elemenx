import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mounted (component) {
	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* An (event) that is no name is an expression, run when the event comes, with $event and $node. */
describe('Contract: expressions of (event) handlers', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('an assignment and a call with arguments run on the state of the Component', async function () {
		var picked = [];
		var component = mounted(Elemenx.Component(unique('Counter'), {
			$Template: '<p><button class="add" (click)="Count = Count + 1">+</button><button class="pick" (click)="Pick(Count * 10, \'x\')">pick</button><b>{{Count}}</b></p>',
			Count: 0,
			Pick: function (value, tag) {
				picked.push([value, tag, this === component]);
			}
		})());

		component.$Element().querySelector('.add').click();
		component.$Element().querySelector('.add').click();

		await tick(10);

		expect(component.Count).toBe(2);
		expect(component.$Element().querySelector('b').textContent).toBe('2');

		component.$Element().querySelector('.pick').click();

		expect(picked).toEqual([[20, 'x', true]]);
	});

	it('$event is the DOM event and $node the element; a name the state does not have yet lands in the state, not in the window', function () {
		var component = mounted(Elemenx.Component(unique('Told'), {
			$Template: '<p><button class="told" (click)="Last = $event.type + \':\' + $node.className">told</button><button class="fresh" (click)="FreshName = 7">fresh</button></p>',
			Last: ''
		})());

		component.$Element().querySelector('.told').click();
		component.$Element().querySelector('.fresh').click();

		expect(component.Last).toBe('click:told');
		expect(component.FreshName).toBe(7);
		expect('FreshName' in window).toBe(false);
	});

	it('a row of a *for writes a value of its owner to the owner', async function () {
		var component = mounted(Elemenx.Component(unique('Rows'), {
			$Template: '<ul><li *for="row of Rows" *key="row" [class.on]="row === Selected" (click)="Selected = row">{{row}}</li></ul>',
			Rows: ['a', 'b', 'c'],
			Selected: ''
		})());
		var items = function () {
			return component.$Element().querySelectorAll('li');
		};

		items()[1].click();

		await tick(10);

		expect(component.Selected).toBe('b');
		expect(items()[1].classList.contains('on')).toBe(true);
		expect(items()[0].classList.contains('on')).toBe(false);
	});

	it('a row that assigns its own name changes the row only, and a part of a *if writes to the state of its owner', async function () {
		var component = mounted(Elemenx.Component(unique('Local'), {
			$Template: '<div><ul><li *for="row of Rows" *key="$index" (click)="row = row + \'!\'">{{row}}</li></ul><p *if="Open"><button class="close" (click)="Open = false">close</button></p></div>',
			Rows: ['a'],
			Open: true
		})());

		component.$Element().querySelector('li').click();

		await tick(10);

		expect(component.Rows).toEqual(['a']);
		expect(component.$Element().querySelector('li').textContent).toBe('a!');

		component.$Element().querySelector('.close').click();

		await tick(10);

		expect(component.Open).toBe(false);
		expect(component.$Element().querySelector('.close')).toBe(null);
	});

	it('$event of a Component event is the value it told', async function () {
		var child = unique('Teller');
		var component;

		Elemenx.Component(child, {
			$Template: '<b>teller</b>',
			$OnReady: function () {
				this.$Emit('told', {Value: 5});
			}
		});

		component = mounted(Elemenx.Component(unique('Hearer'), {
			$Template: '<div><' + child + ' (told)="Heard = $event.Value * 2"></' + child + '></div>',
			Heard: 0
		})());

		await tick(20);

		expect(component.Heard).toBe(10);
	});

	it('a plain name still calls the handler with (event, node), and an expression that fails is told, not thrown', function () {
		var calls = [];
		var error = vi.spyOn(console, 'error').mockImplementation(function () {});
		var component = mounted(Elemenx.Component(unique('Plain'), {
			$Template: '<p><button class="plain" (click)=" Clicked ">plain</button><button class="broken" (click)="Missing.Deep = 1">broken</button></p>',
			Clicked: function (event, node) {
				calls.push([event.type, node.className]);
			}
		})());

		component.$Element().querySelector('.plain').click();
		component.$Element().querySelector('.broken').click();

		expect(calls).toEqual([['click', 'plain']]);
		expect(error.mock.calls.some(function (call) {
			return /handler expression failed: Missing\.Deep = 1/.test(call[0]);
		})).toBe(true);

		error.mockRestore();
	});
});
