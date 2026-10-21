import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

/* *lazy: a host renders near the viewport or when the browser is idle, one at a time in the order of the page. */
describe('Contract: *lazy', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	function page (count, child) {
		var name = unique('LazyPage');
		var items = [];
		var i = 0;
		var component;

		while (i < count) {
			items.push('<div class="lazy-block" style="height: 2000px"><' + child + ' *lazy Index="' + i + '" /></div>');

			i++;
		}

		component = Elemenx.Component(name, {$Template: '<main>' + items.join('') + '</main>'})();

		document.getElementById('mount').appendChild(component.$Element());

		return component;
	}

	it('renders the host near the viewport first, then the others in the order of the page while the browser is idle', async function () {
		var child = unique('LazyChild');
		var order = [];
		var component;

		Elemenx.Component(child, {
			$Template: '<p class="lazy-child">{{Index}}</p>',
			Index: '',
			$OnCreate: function () { order.push(Number(this.Index)); }
		});

		component = page(4, child);

		/* Nothing is built in the task that builds the page. */
		expect(document.querySelectorAll('.lazy-child').length).toBe(0);

		expect(await waitFor(function () { return document.querySelectorAll('.lazy-child').length === 4; }, 5000)).toBe(true);

		expect(order).toEqual([0, 1, 2, 3]);
		expect(document.querySelectorAll('[data-elemenx-lazy]').length).toBe(0);
		expect(document.querySelector('.lazy-block').firstElementChild.className).toBe('lazy-child');

		component.$Destroy();
	});

	/* Regression: the place of a lazy host put in at once moved the nodes after it, and their props were read from other nodes. */
	it('leaves the nodes after a lazy host where the compiler finds them: their props reach them', async function () {
		var child = unique('LazySibling');
		var name = unique('LazySiblings');
		var component;

		Elemenx.Component(child, {$Template: '<p class="lazy-sibling">{{Label}}</p>', Label: ''});

		component = Elemenx.Component(name, {
			$Template: '<main><' + child + ' *lazy Label="first" /><' + child + ' Label="second" /><' + child + ' Label="third" /></main>'
		})();

		document.getElementById('mount').appendChild(component.$Element());

		expect(Array.prototype.map.call(document.querySelectorAll('.lazy-sibling'), function (node) {
			return node.textContent;
		})).toEqual(['second', 'third']);

		expect(await waitFor(function () { return document.querySelectorAll('.lazy-sibling').length === 3; }, 5000)).toBe(true);
		expect(document.querySelector('.lazy-sibling').textContent).toBe('first');

		component.$Destroy();
	});

	it('renders nothing for a host whose page goes before its turn', async function () {
		var child = unique('LazyGone');
		var made = 0;
		var component;

		Elemenx.Component(child, {
			$Template: '<p class="lazy-gone">gone</p>',
			$OnCreate: function () { made++; }
		});

		component = page(3, child);

		component.$Destroy();

		await tick(300);

		expect([made, document.querySelectorAll('[data-elemenx-lazy]').length]).toEqual([0, 0]);
	});

	it('works on a plain element: its subtree renders later with the state of its component', async function () {
		var name = unique('LazyPlain');
		var component = Elemenx.Component(name, {
			$Template: '<main><section class="lazy-plain" *lazy>{{Text}}</section></main>',
			Text: 'later'
		})();

		document.getElementById('mount').appendChild(component.$Element());

		expect(document.querySelector('.lazy-plain')).toBeNull();
		expect(await waitFor(function () { return document.querySelector('.lazy-plain'); }, 5000)).not.toBe(false);
		expect(document.querySelector('.lazy-plain').textContent).toBe('later');

		component.Text = 'now';

		await tick();

		expect(document.querySelector('.lazy-plain').textContent).toBe('now');

		component.$Destroy();
	});
});
