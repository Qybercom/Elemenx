import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

/* $OnProps(changed): a Component hears the new values its tag gives it, once its state holds them. */
describe('Contract: $OnProps', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('hears the props that changed, not the first ones, after its state holds them', function () {
		var heard = [];
		var child = unique('PropsChild');

		Elemenx.Component(child, {
			$Template: '<b>{{Label}} {{Count}}</b>',
			Label: '',
			Count: 0,
			$OnProps: function (changed) {
				heard.push({Changed: changed, Label: this.Label, Count: this.Count});
			}
		});

		var owner = Elemenx.Component(unique('PropsOwner'), {
			$Template: '<main><' + child + ' [Label]="Text" [Count]="Total"></' + child + '></main>',
			Text: 'one',
			Total: 1,
			Other: 0
		})();

		expect(heard).toEqual([]);

		owner.Text = 'two';
		owner.Other = 5;

		owner.$Batch(function (state) {
			state.Text = 'three';
			state.Total = 2;
		});

		expect(heard).toEqual([
			{Changed: {Label: 'two'}, Label: 'two', Count: 1},
			{Changed: {Label: 'three', Count: 2}, Label: 'three', Count: 2}
		]);
		expect(owner.$Element().textContent).toBe('three 2');

		owner.$Destroy();
	});

	test('a Component that loads later hears the props that change once it is made', function () {
		var heard = [];
		var child = unique('PropsLater');
		var id = unique('props-later');
		var finish;

		Elemenx.Template.Loader(function (name, done) {
			if (name === id)
				finish = done;
		});

		Elemenx.Component(child, {
			$TemplateID: id,
			Label: '',
			$OnProps: function (changed) {
				heard.push(changed);
			}
		});

		var owner = Elemenx.Component(unique('PropsLaterOwner'), {
			$Template: '<main><' + child + ' [Label]="Text"></' + child + '></main>',
			Text: 'one'
		})();

		owner.Text = 'two';

		finish('<b class="later">{{Label}}</b>');

		expect(owner.$Element().querySelector('.later').textContent).toBe('two');
		expect(heard).toEqual([]);

		owner.Text = 'three';

		expect(heard).toEqual([{Label: 'three'}]);

		owner.$Destroy();
	});
});
