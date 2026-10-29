import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('PlanHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/*
 * The plan of a template (where its bindings, refs, events, directives and Components are, found once): every instance
 * of the template reads only those places, and Structural passes by its parts with none of them. The instances of one
 * template share the plan whatever fills their slots.
 */
describe('Regression: the plan of a template', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('binds every instance of a template with a slot, filled or not, the content of the slot by its owner', async function () {
		var card = unique('PlanCard');
		var host;

		Elemenx.Component(card, {
			$Template: '<article class="card"><header><h3 #head>{{Title}}</h3></header><div class="static"><p>Plain <b>text</b></p></div><section><slot></slot></section><button (click)="Pressed">{{Presses}}</button></article>',
			Title: '',
			Presses: 0,
			Pressed: function () {
				this.Presses++;
			}
		});

		host = mount('<div><' + card + ' [title]="\'First\'"><em class="given">{{Word}}</em></' + card + '><' + card + ' [title]="\'Second\'" /></div>', {Word: 'hello'});

		await tick(20);

		var cards = host.$Element().querySelectorAll('.card');

		expect(cards.length).toBe(2);
		expect(cards[0].querySelector('h3').textContent).toBe('First');
		expect(cards[1].querySelector('h3').textContent).toBe('Second');
		expect(cards[0].querySelector('.given').textContent).toBe('hello');
		expect(cards[0].querySelector('h3').hasAttribute('#head')).toBe(false);
		expect(Elemenx.Instance(cards[1]).$Ref('head')).toBe(cards[1].querySelector('h3'));

		host.Word = 'again';

		cards[1].querySelector('button').click();

		await tick(20);

		expect(cards[0].querySelector('.given').textContent).toBe('again');
		expect(cards[1].querySelector('button').textContent).toBe('1');
		expect(cards[0].querySelector('button').textContent).toBe('0');
	});

	it('makes the Components inside parts of plain markup, and the structural root of a template, in every instance', async function () {
		var leaf = unique('PlanLeaf');
		var shell = unique('PlanShell');
		var host;

		Elemenx.Component(leaf, {$Template: '<i class="leaf">{{Name}}</i>', Name: ''});
		Elemenx.Component(shell, {
			$Template: '<div class="shell"><div class="plain"><div class="deep"><' + leaf + ' [name]="Name" /></div></div><p class="more">Nothing here</p><span *if="Shown" class="shown">Shown</span></div>',
			Name: '',
			Shown: false
		});

		host = mount('<div><' + shell + ' *for="item of Items" *key="item" [name]="item" [shown]="item === \'b\'" /></div>', {Items: ['a', 'b', 'c']});

		await tick(20);

		expect(Array.prototype.map.call(host.$Element().querySelectorAll('.leaf'), function (node) {
			return node.textContent;
		})).toEqual(['a', 'b', 'c']);
		expect(host.$Element().querySelectorAll('.shown').length).toBe(1);

		host.Items = ['c', 'd'];

		await tick(20);

		expect(Array.prototype.map.call(host.$Element().querySelectorAll('.leaf'), function (node) {
			return node.textContent;
		})).toEqual(['c', 'd']);
	});

	it('keeps the {{ }} of a slot that is not filled out of the instance (the slot goes with what it holds)', async function () {
		var box = unique('PlanBox');
		var host;

		Elemenx.Component(box, {
			$Template: '<div class="box"><slot><span class="fallback">{{Missing.Deep}}</span></slot><b class="label">{{Label}}</b></div>',
			Label: 'Box'
		});

		host = mount('<div><' + box + ' /></div>');

		await tick(20);

		expect(host.$Element().querySelector('.label').textContent).toBe('Box');
		expect(host.$Element().querySelector('.fallback')).toBe(null);
	});
});
