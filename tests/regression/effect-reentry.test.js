import { describe, expect, test, beforeEach } from 'vitest';
import { tick } from '../setup.js';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

describe('Regression: an effect that writes what it has read runs again after it ends, not inside itself', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('a method of a prop that keeps what it made in a field: the child tag is made once, no crash', async function () {
		var child = unique('ReentryChild');
		var parent = unique('ReentryParent');
		var made = 0;

		Elemenx.Component(child, {
			Items: [],
			$Template: '<ul><li *for="item of Items" *key="item">{{item}}</li></ul>'
		});

		var factory = Elemenx.Component(parent, {
			Kept: null,
			$Template: '<div><' + child + ' [items]="ItemsOf(\'a\')" /></div>',

			/* As the UI kit demo made its data center: made once, kept in a field while the props are read. */
			ItemsOf: function () {
				if (!this.Kept)
					made++;

				return this.Kept || (this.Kept = ['one', 'two']);
			}
		});

		var host = factory({});

		document.body.appendChild(host.$Element());

		await tick(20);

		expect(host.$Element().querySelectorAll('ul').length).toBe(1);
		expect(host.$Element().textContent).toContain('two');
		expect(made).toBe(1);
	});

	test('the effect sees the new value in the run after, once', function () {
		var runs = [];
		var factory = Elemenx.Component(unique('ReentryCount'), {
			Count: 0,
			$Template: '<p>{{Mark()}}</p>',

			Mark: function () {
				runs.push(this.Count);

				if (this.Count < 2)
					this.Count++;

				return String(this.Count);
			}
		});
		var host = factory({});

		document.body.appendChild(host.$Element());

		expect(host.$Element().textContent).toBe('2');
		expect(runs).toEqual([0, 1, 2]);
	});
});
