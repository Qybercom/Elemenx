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
});
