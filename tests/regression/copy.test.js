import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mount (component) {
	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: $Copyable and $Copy', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('copies a tag of a template: the same bindings, events and content in the scope of its owner, a state of its own, the props given', async function () {
		var card = unique('CopyCard');
		var pressed = [];
		var host;
		var original;
		var copy;

		Elemenx.Component(card, {
			$Copyable: true,
			$Template: '<section class="card" [attribute.data-id]="ID"><h3>{{Title}}</h3><b class="count">{{Count}}</b><slot></slot></section>',
			ID: '',
			Title: '',
			Count: 0,

			Press: function () {
				this.Count++;

				this.$Emit('press', this.ID);
			}
		});

		host = mount(Elemenx.Component(unique('CopyHost'), {
			$Template: '<div><div class="place"><' + card + ' ID="first" [title]="Name" (press)="Pressed"><i class="inside">{{Name}} inside</i></' + card + '></div><div class="other"></div></div>',
			Name: 'Ada',

			Pressed: function (id) {
				pressed.push(id);
			}
		})());

		await tick(10);

		original = Elemenx.Instance(host.$Element().querySelector('.place .card'));
		copy = original.$Copy({ID: 'first:2'});

		/* Out of the page until it is placed; then the same title and content, its own ID. */
		expect(copy.$Element().isConnected).toBe(false);

		host.$Element().querySelector('.other').appendChild(copy.$Element());

		await tick(10);

		expect(copy.$Element().getAttribute('data-id')).toBe('first:2');
		expect(copy.$Element().querySelector('h3').textContent).toBe('Ada');
		expect(copy.$Element().querySelector('.inside').textContent).toBe('Ada inside');

		/* A state of its own; its events reach the handlers of the owner. */
		copy.Press();
		copy.Press();

		await tick(10);

		expect(copy.$Element().querySelector('.count').textContent).toBe('2');
		expect(original.$Element().querySelector('.count').textContent).toBe('0');
		expect(pressed).toEqual(['first:2', 'first:2']);

		/* The bindings of the owner reach the copy too. */
		host.Name = 'Grace';

		await tick(10);

		expect(copy.$Element().querySelector('h3').textContent).toBe('Grace');
		expect(copy.$Element().querySelector('.inside').textContent).toBe('Grace inside');

		/* A copy of the copy; then a copy destroyed alone, and the rest with the tag. */
		var again = copy.$Copy({ID: 'first:3'});

		host.$Element().querySelector('.other').appendChild(again.$Element());

		await tick(10);

		expect(again.$Element().getAttribute('data-id')).toBe('first:3');

		again.$Destroy();

		expect(Elemenx.Instance(again.$Element())).toBe(null);

		host.$Destroy();

		owned.pop();

		expect(Elemenx.Instance(copy.$Element())).toBe(null);
	});

	it('throws for a Component that is not $Copyable and for one not made from a tag', function () {
		var plain = unique('CopyPlain');
		var copyable = unique('CopyMade');
		var host;

		Elemenx.Component(plain, {$Template: '<p class="plain">a</p>'});
		Elemenx.Component(copyable, {$Copyable: true, $Template: '<p>b</p>'});

		host = mount(Elemenx.Component(unique('CopyThrows'), {$Template: '<div><' + plain + ' /></div>'})());

		expect(function () {
			Elemenx.Instance(host.$Element().querySelector('.plain')).$Copy();
		}).toThrow('Elemenx $Copy: ' + plain + ' is not $Copyable');

		expect(function () {
			mount(Elemenx.Component(copyable)({})).$Copy();
		}).toThrow('Elemenx $Copy: ' + copyable + ' was not made from a tag of a template');
	});
});
