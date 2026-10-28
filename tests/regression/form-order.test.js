import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

/* A definition of ElemenxUI, run outside a page: the value it passes to Elemenx.Component or Elemenx.Service. */
function definition (file) {
	var value = null;
	var context = {
		Node: {DOCUMENT_POSITION_FOLLOWING: 4, DOCUMENT_POSITION_PRECEDING: 2},
		Elemenx: {
			Locale: {Text: function (key) {
				return key;
			}},
			Component: function (name, given) {
				value = given;
			},
			Service: function (name, given) {
				value = given;
			}
		}
	};

	vm.runInNewContext(fs.readFileSync(path.resolve(process.cwd(), 'libraries', 'ElemenxUI', file), 'utf8'), context);

	return value;
}

/* An element at a place on the page: compareDocumentPosition by that place. */
function element (place) {
	return {
		Place: place,
		compareDocumentPosition: function (other) {
			return other.Place > place ? 4 : 2;
		}
	};
}

describe('ElemenxUI Form', function () {
	it('keeps the controls of its Fields in their order on the page, whatever order they register in', function () {
		var forms = definition('services/Forms.js');
		var form = Object.assign({}, definition('components/Form/Form.js'));
		var fields = [['name', 1], ['email', 2], ['terms', 5], ['password', 3]];

		forms.$OnCreate.call(forms);

		form.$Service = function () {
			return forms;
		};

		form.$OnCreate.call(form);

		/* The terms register first: the Field that found its place in the Form last comes first. */
		[fields[2], fields[0], fields[3], fields[1]].forEach(function (field) {
			form.Registered({
				target: element(field[1]),
				detail: {Name: field[0], Value: '', Validators: [forms.Validators.Required]},
				stopPropagation: function () {}
			});
		});

		expect(Object.keys(form.Model.Controls)).toEqual(['name', 'email', 'password', 'terms']);
		expect(Object.keys(form.Model.Value)).toEqual(['name', 'email', 'password', 'terms']);

		form.Model.Touch();

		form.Model.Validate(function (error, result) {
			expect(Object.keys(result.Errors)).toEqual(['name', 'email', 'password', 'terms']);
		});
	});

	/* The names of the forms of a server: their parts nest the controls in groups and arrays, and Value with them. */
	it('nests the controls of names of parts (user[address][city], items[2][name], tags[]) and takes the groups made for them out with the last', function () {
		var forms = definition('services/Forms.js');
		var form = Object.assign({}, definition('components/Form/Form.js'));
		var controls = {};
		var place = 0;

		forms.$OnCreate.call(forms);

		form.$Service = function () {
			return forms;
		};

		form.$OnCreate.call(form);

		function field (name, value) {
			var detail = {Name: name, Value: value, Validators: name === 'user.email' ? [forms.Validators.Email] : [], Control: null};

			form.Registered({target: element(++place), detail: detail, stopPropagation: function () {}});

			controls[name + '#' + place] = detail.Control;

			return detail.Control;
		}

		function leave (control, name) {
			form.Unregistered({detail: {Name: name, Control: control}, stopPropagation: function () {}});
		}

		expect(forms.Path('user[address][city]')).toEqual(['user', 'address', 'city']);
		expect(forms.Path('user.address.city')).toEqual(['user', 'address', 'city']);
		expect(forms.Path('items[2].name')).toEqual(['items', '2', 'name']);
		expect(forms.Path('tags[]')).toEqual(['tags', '']);
		expect(forms.Path('myField[foo][5][bar][some]')).toEqual(['myField', 'foo', '5', 'bar', 'some']);

		field('user[name]', 'Ada');
		field('user[address][city]', 'London');
		field('user.email', 'not an email');
		field('items[2][name]', 'Pen');
		field('items[0][name]', 'Ink');
		field('items[0][count]', 3);
		field('tags[]', 'red');
		field('tags[]', 'blue');
		field('myField[foo][5][bar][some]', 'deep');

		/* The value is nested; an array has no empty places. */
		expect(form.Model.Value).toEqual({
			user: {name: 'Ada', address: {city: 'London'}, email: 'not an email'},
			items: [{name: 'Ink', count: 3}, {name: 'Pen'}],
			tags: ['red', 'blue'],
			myField: {foo: [{bar: {some: 'deep'}}]}
		});

		/* A name of parts finds its control, an index the place it was given; errors by the path of their control. */
		expect(form.Model.Get('user[address][city]').Value).toBe('London');
		expect(form.Model.Get('items[2][name]').Value).toBe('Pen');
		expect(form.Model.Get('items.2.name').Value).toBe('Pen');
		expect(form.Model.Get('tags[]')).toBe(null);
		expect(form.Model.Get('user[email]').Invalid).toBe(true);

		form.Model.Validate(function (error, result) {
			expect(Object.keys(result.Errors)).toEqual(['user.email']);
		});

		/* A Field of the same name finds the control there; a [] Field adds one more. */
		expect(field('user[name]', '')).toBe(form.Model.Get('user.name'));

		/* Patch and Reset go to the controls by their names, and in their order in an array. */
		form.Model.Patch({items: [{name: 'Ink 2'}, {name: 'Pen 2'}], tags: ['green']});

		expect([form.Model.Get('items.0.name').Value, form.Model.Get('items.2.name').Value, form.Model.Value.tags]).toEqual(['Ink 2', 'Pen 2', ['green', 'blue']]);

		/* The Fields that go take their controls out, and the groups and arrays made for them once empty; the others keep their places. */
		leave(form.Model.Get('items.0.name'));
		leave(form.Model.Get('items.0.count'));

		expect(form.Model.Get('items.0')).toBe(null);
		expect(form.Model.Get('items.2.name').Value).toBe('Pen 2');
		expect(form.Model.Value.items).toEqual([{name: 'Pen 2'}]);

		leave(form.Model.Get('items.2.name'));
		leave(form.Model.Get('myField.foo.5.bar.some'));

		expect(Object.keys(form.Model.Controls)).toEqual(['user', 'tags']);

		/* A value cannot hold a group: the name that would nest in it is refused, with both names. */
		expect(function () {
			field('user[name][first]', '');
		}).toThrow('Elemenx Forms: user.name is a value, not a group, in user.name.first');
	});
});
