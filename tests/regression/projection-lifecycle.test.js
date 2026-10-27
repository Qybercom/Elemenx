import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

function idle () {
	return new Promise(function (resolve) {
		setTimeout(resolve, 400);
	});
}

/*
 * The content of the tag of a Component (its slots) starts with the first instance of that Component. It started with
 * the template around it: <Section *if="false"><Window /></Section> made the Window in a tree no page held, and a *lazy
 * of that content rendered it when the browser was idle (the windows of a hidden section of the catalogue took the
 * active window from the one pressed).
 */
describe('Regression: the content of the tag of a Component', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	function components () {
		var made = [];
		var box = unique('ProjectionBox');
		var child = unique('ProjectionChild');

		Elemenx.Component(box, {
			$Template: '<article class="box"><slot></slot></article>',
			$OnReady: function () {
				made.push('box sees ' + this.$Element().querySelectorAll('.child').length);
			}
		});

		Elemenx.Component(child, {
			$Template: '<b class="child">{{Label}}</b>',
			Label: '',
			$OnCreate: function () {
				made.push('child ' + this.Label);
			},
			$OnDestroy: function () {
				made.push('gone ' + this.Label);
			}
		});

		return {Box: box, Child: child, Made: made};
	}

	test('a Component never shown makes nothing of its content; shown, its content is built before its hooks', function () {
		var parts = components();
		var owner = Elemenx.Component(unique('ProjectionOwner'), {
			$Template: '<main><' + parts.Box + ' *if="Show"><i><' + parts.Child + ' [Label]="Text"></' + parts.Child + '></i></' + parts.Box + '></main>',
			Show: false,
			Text: 'one'
		})();

		document.body.appendChild(owner.$Element());

		expect(parts.Made).toEqual([]);

		owner.Show = true;

		expect(parts.Made).toEqual(['child one', 'box sees 1']);
		expect(owner.$Element().querySelector('.box .child').textContent).toBe('one');

		owner.Text = 'two';

		expect(owner.$Element().querySelector('.box .child').textContent).toBe('two');

		owner.$Destroy();

		expect(parts.Made).toEqual(['child one', 'box sees 1', 'gone two']);
	});

	test('a *lazy in the content of a Component never shown does not render', async function () {
		var parts = components();
		var owner = Elemenx.Component(unique('ProjectionLazy'), {
			$Template: '<main><' + parts.Box + ' *if="Show"><div *lazy><' + parts.Child + ' Label="lazy"></' + parts.Child + '></div></' + parts.Box + '></main>',
			Show: false
		})();

		document.body.appendChild(owner.$Element());

		await idle();

		expect(parts.Made).toEqual([]);

		owner.Show = true;

		await idle();

		expect(parts.Made).toContain('child lazy');
		expect(owner.$Element().querySelectorAll('.box .child').length).toBe(1);

		owner.$Destroy();
	});

	test('the content of a Component shown at once is there, as before', function () {
		var parts = components();
		var owner = Elemenx.Component(unique('ProjectionShown'), {
			$Template: '<main><' + parts.Box + '><' + parts.Child + ' Label="at once"></' + parts.Child + '></' + parts.Box + '></main>'
		})();

		expect(parts.Made).toEqual(['child at once', 'box sees 1']);
		expect(owner.$Element().querySelector('.box .child').textContent).toBe('at once');

		owner.$Destroy();
	});
});
