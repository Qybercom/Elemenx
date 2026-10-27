import { describe, expect, test, beforeEach } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

/*
 * class and style on the tag of a Component go on the root of its instance, beside the ones of its template (they
 * were taken for props of no Component and dropped). A Component with props of those names keeps them as props.
 */
describe('Contract: class and style of the tag of a Component', function () {
	beforeEach(function () {
		document.body.innerHTML = '';
	});

	test('go on the root, beside its own, and follow their {{ }}', function () {
		var child = unique('RootChild');

		Elemenx.Component(child, {
			$Template: '<section class="own" style="color: red;">child</section>'
		});

		var owner = Elemenx.Component(unique('RootOwner'), {
			$Template: '<main><' + child + ' class="card {{Kind}}" style="margin: {{Gap}}px; padding: 2px"></' + child + '></main>',
			Kind: 'wide',
			Gap: 4
		})();
		var root = owner.$Element().querySelector('section');

		expect(root.className).toBe('own card wide');
		expect(root.style.color).toBe('red');
		expect(root.style.margin).toBe('4px');
		expect(root.style.padding).toBe('2px');

		owner.$Batch(function (state) {
			state.Kind = 'narrow';
			state.Gap = 8;
		});

		expect(root.className).toBe('own card narrow');
		expect(root.style.margin).toBe('8px');
		expect(root.style.color).toBe('red');

		owner.$Destroy();
	});

	test('a template of several elements is held by one root, which takes them', function () {
		var child = unique('RootMany');

		Elemenx.Component(child, {$Template: '<b>one</b><i>two</i>'});

		var owner = Elemenx.Component(unique('RootManyOwner'), {
			$Template: '<main><' + child + ' class="pair"></' + child + '></main>'
		})();

		expect(owner.$Element().querySelector('.pair').children.length).toBe(2);

		owner.$Destroy();
	});

	test('a Component with a prop Class keeps it as a prop', function () {
		var child = unique('RootProp');

		Elemenx.Component(child, {
			$Template: '<p class="text">{{Class}}</p>',
			Class: ''
		});

		var owner = Elemenx.Component(unique('RootPropOwner'), {
			$Template: '<main><' + child + ' class="given"></' + child + '></main>'
		})();
		var root = owner.$Element().querySelector('p');

		expect(root.className).toBe('text');
		expect(root.textContent).toBe('given');

		owner.$Destroy();
	});

	test('a Component that loads later takes them on its element', function () {
		var child = unique('RootLater');
		var id = unique('root-later');
		var finish;

		Elemenx.Template.Loader(function (name, done) {
			if (name === id)
				finish = done;
		});

		Elemenx.Component(child, {$TemplateID: id});

		var owner = Elemenx.Component(unique('RootLaterOwner'), {
			$Template: '<main><' + child + ' class="later {{Kind}}"></' + child + '></main>',
			Kind: 'a'
		})();

		finish('<article class="own">later</article>');

		expect(owner.$Element().querySelector('article').className).toBe('own later a');

		owner.Kind = 'b';

		expect(owner.$Element().querySelector('article').className).toBe('own later b');

		owner.$Destroy();
	});
});
