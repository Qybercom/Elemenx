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

	/* A slot in a *if of the template of the Component: the part of the *if is made from the template, where it was empty. */
	test('a slot in a *if takes the content of the tag each time the *if shows', function () {
		var parts = components();
		var panel = unique('ProjectionPanel');

		Elemenx.Component(panel, {
			$Template: '<article class="panel"><header><slot name="head"></slot></header><div class="body" *if="Open"><slot></slot></div></article>',
			Open: false
		});

		var owner = Elemenx.Component(unique('ProjectionPanelOwner'), {
			$Template: '<main><' + panel + ' [Open]="Show"><i slot="head" class="head">{{Text}}</i><b class="content">{{Text}}</b><' + parts.Child + ' [Label]="Text"></' + parts.Child + '></' + panel + '></main>',
			Show: false,
			Text: 'one'
		})();
		var element = owner.$Element();

		document.body.appendChild(element);

		expect(element.querySelector('.panel > header .head').textContent).toBe('one');
		expect(element.querySelector('.body')).toBe(null);

		owner.Show = true;

		expect(element.querySelector('.body .content').textContent).toBe('one');
		expect(element.querySelector('.body .child').textContent).toBe('one');

		owner.Text = 'two';

		expect(element.querySelector('.body .content').textContent).toBe('two');

		owner.Show = false;

		expect(element.querySelector('.body')).toBe(null);

		owner.Show = true;

		expect(element.querySelector('.body .content').textContent).toBe('two');
		expect(element.querySelectorAll('.body .child').length).toBe(1);
		expect(parts.Made.filter(function (entry) {
			return entry.indexOf('child') === 0;
		})).toEqual(['child one']);

		owner.$Destroy();
	});

	/* Hidden by a *if, a Component takes the content of its tag with it; shown again, the content is made again. */
	test('a Component hidden by a *if destroys the content of its tag, shown again makes it anew', function () {
		var parts = components();
		var clicks = [];
		var owner = Elemenx.Component(unique('ProjectionHidden'), {
			$Template: '<main><' + parts.Box + ' *if="Show"><b class="text">{{Text}}</b><button #Press (click)="Pressed">press</button><' + parts.Child + ' [Label]="Text"></' + parts.Child + '></' + parts.Box + '></main>',
			Show: true,
			Text: 'one',
			Pressed: function () {
				clicks.push(this.Text);
			}
		})();
		var element = owner.$Element();

		document.body.appendChild(element);

		owner.Show = false;

		expect(parts.Made).toEqual(['child one', 'box sees 1', 'gone one']);
		expect(element.querySelector('.box')).toBe(null);

		owner.Text = 'two';
		owner.Show = true;

		expect(parts.Made).toEqual(['child one', 'box sees 1', 'gone one', 'child two', 'box sees 1']);
		expect(element.querySelector('.box .text').textContent).toBe('two');
		expect(element.querySelectorAll('.box .child').length).toBe(1);

		owner.Text = 'three';

		expect(element.querySelector('.box .text').textContent).toBe('three');
		expect(element.querySelector('.box .child').textContent).toBe('three');

		element.querySelector('.box button').click();

		expect(clicks).toEqual(['three']);
		expect(owner.$Ref('Press')).toBe(element.querySelector('.box button'));

		owner.$Destroy();

		expect(parts.Made[parts.Made.length - 1]).toBe('gone three');
	});

	test('with *keep the content of the tag sleeps with its Component and comes back as it was', function () {
		var parts = components();
		var policy = Elemenx.Cache();

		Elemenx.Cache({Instances: {Scope: 'marked'}});

		try {
			var owner = Elemenx.Component(unique('ProjectionKept'), {
				$Template: '<main><' + parts.Box + ' *if="Show" *keep><' + parts.Child + ' [Label]="Text"></' + parts.Child + '></' + parts.Box + '></main>',
				Show: true,
				Text: 'one'
			})();

			document.body.appendChild(owner.$Element());

			owner.Show = false;
			owner.Show = true;

			expect(parts.Made).toEqual(['child one', 'box sees 1']);
			expect(owner.$Element().querySelectorAll('.box .child').length).toBe(1);

			owner.$Destroy();

			expect(parts.Made).toEqual(['child one', 'box sees 1', 'gone one']);
		}
		finally {
			Elemenx.Cache(policy);
		}
	});
});

