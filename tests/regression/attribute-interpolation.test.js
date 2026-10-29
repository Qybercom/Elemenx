import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mounted (component) {
	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* {{ }} in the attributes of plain elements: a value, a text, the base of [class.x] and [style.x]; \{{ for a {{ itself. */
describe('Contract: {{ }} in the attributes of elements', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('an attribute that is one {{ }} is the value: null, undefined and false take it away, true leaves it empty', async function () {
		var component = mounted(Elemenx.Component(unique('Whole'), {
			$Template: '<p><span title="{{Hint}}" data-on="{{On}}">x</span></p>',
			Hint: 'Help',
			On: true
		})());
		var span = component.$Element().querySelector('span');

		expect(span.getAttribute('title')).toBe('Help');
		expect(span.getAttribute('data-on')).toBe('');

		component.Hint = null;
		component.On = false;

		await tick(10);

		expect(span.hasAttribute('title')).toBe(false);
		expect(span.hasAttribute('data-on')).toBe(false);

		component.Hint = 0;

		await tick(10);

		expect(span.getAttribute('title')).toBe('0');
	});

	it('an attribute of texts and {{ }} is a text, a missing value nothing in it', async function () {
		var component = mounted(Elemenx.Component(unique('Mixed'), {
			$Template: '<p><a href="/users/{{ID}}/edit" title="{{Name}}, {{Year}}">edit</a></p>',
			ID: 7,
			Name: 'Ada',
			Year: null
		})());
		var link = component.$Element().querySelector('a');

		expect(link.getAttribute('href')).toBe('/users/7/edit');
		expect(link.getAttribute('title')).toBe('Ada, ');

		component.ID = 8;
		component.Year = 1843;

		await tick(10);

		expect(link.getAttribute('href')).toBe('/users/8/edit');
		expect(link.getAttribute('title')).toBe('Ada, 1843');
	});

	it('class and style with {{ }} are the base that [class.x] and [style.x] of the element add to', async function () {
		var component = mounted(Elemenx.Component(unique('Styled'), {
			$Template: '<p><span class="card {{Kind}}" [class.on]="On" style="width: {{W}}px; color: red" [style.height]="H">x</span></p>',
			Kind: 'wide',
			On: true,
			W: 40,
			H: '10px'
		})());
		var span = component.$Element().querySelector('span');

		expect(Array.prototype.slice.call(span.classList).sort()).toEqual(['card', 'on', 'wide']);
		expect([span.style.width, span.style.color, span.style.height]).toEqual(['40px', 'red', '10px']);

		component.Kind = 'narrow';
		component.On = false;
		component.W = 20;

		await tick(10);

		expect(Array.prototype.slice.call(span.classList).sort()).toEqual(['card', 'narrow']);
		expect([span.style.width, span.style.color, span.style.height]).toEqual(['20px', 'red', '10px']);
	});

	it('an image of src="{{Image}}" asks only for its image, never for the text {{Image}}', async function () {
		var component = mounted(Elemenx.Component(unique('Pictured'), {
			$Template: '<p><img src="{{Image}}" alt=""></p>',
			Image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
		})());

		await tick(20);

		expect(component.$Element().querySelector('img').getAttribute('src')).toBe('data:image/gif;base64,R0lGODlhAQABAAAAACw=');
		expect(performance.getEntriesByType('resource').some(function (entry) {
			return /%7B%7B|\{\{/.test(entry.name);
		})).toBe(false);
	});

	it('the rows of a *for interpolate their own names in attributes', async function () {
		var component = mounted(Elemenx.Component(unique('Rowed'), {
			$Template: '<ul><li *for="row of Rows" *key="row" data-name="row-{{row}}-{{Suffix}}">{{row}}</li></ul>',
			Rows: ['a', 'b'],
			Suffix: 's'
		})());

		expect(Array.prototype.map.call(component.$Element().querySelectorAll('li'), function (item) {
			return item.getAttribute('data-name');
		})).toEqual(['row-a-s', 'row-b-s']);

		component.Suffix = 't';

		await tick(10);

		expect(component.$Element().querySelector('li').getAttribute('data-name')).toBe('row-a-t');
	});

	it('\\{{ shows {{ itself, in a text and in an attribute', function () {
		var component = mounted(Elemenx.Component(unique('Escaped'), {
			$Template: '<p title="\\{{Name}}">\\{{Name}} is {{Name}}</p>',
			Name: 'Ada'
		})());

		expect(component.$Element().textContent).toBe('{{Name}} is Ada');
		expect(component.$Element().getAttribute('title')).toBe('{{Name}}');
	});

	it('a prop of a Component of texts and {{ }} is a text, and one {{ }} is the value as it is', async function () {
		var child = unique('Shown');
		var seen = null;
		var component;

		Elemenx.Component(child, {
			$Template: '<b>{{Label}}</b>',
			Label: '',
			Data: null,
			$OnReady: function () {
				seen = this;
			}
		});

		component = mounted(Elemenx.Component(unique('Giver'), {
			$Template: '<div><' + child + ' Label="Hello, {{Name}}!" Data="{{Item}}"></' + child + '></div>',
			Name: 'Ada',
			Item: {ID: 1}
		})());

		await tick(20);

		expect(component.$Element().querySelector('b').textContent).toBe('Hello, Ada!');
		expect(seen.Data.ID).toBe(1);

		component.Name = 'Linus';

		await tick(20);

		expect(component.$Element().querySelector('b').textContent).toBe('Hello, Linus!');
	});
});
