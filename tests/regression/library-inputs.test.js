import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('InputsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* Types a text into a field as a user does: its value, then the input event (the *mask of a field takes it from there). */
function type (input, text) {
	input.focus();

	input.value = text;

	input.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: text}));
}

function commit (input) {
	input.dispatchEvent(new Event('change', {bubbles: true}));
}

/* The fields of payment cards, of codes and of one-time codes: what they take, what they tell and what they hide. */
describe('Contract: the payment and code fields of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['CardNumberInput', 'CardExpiryInput', 'CVVInput', 'OTPInput', 'service:Reveal']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		Elemenx.Service('Reveal').Guard(null);
	});

	it('CardNumberInput keeps the digits, finds the brand, checks the number by Luhn, and conceals its middle', async function () {
		var checks = [];
		var host = mount('<div><CardNumberInput Conceal="xxxx ???? ???? xxxx" (validate)="Checked" /></div>', {
			Checked: function (detail) {
				checks.push(detail);
			}
		});
		var field = host.$Element().querySelector('.elemenx-card-input');
		var input = field.querySelector('input');

		await tick();

		type(input, '4111 1111 1111 1111');

		await tick();

		expect(checks[checks.length - 1]).toEqual({Value: '4111111111111111', Brand: 'visa', Complete: true, Valid: true});
		expect(field.querySelector('.elemenx-card-brand').getAttribute('data-brand')).toBe('visa');

		input.blur();

		await tick();

		expect(field.querySelector('.elemenx-card-conceal').textContent.replace(/\s+/g, ' ').trim()).toMatch(/^4111 \S{4} \S{4} 1111$/);

		type(input, '4111 1111 1111 1112');

		await tick();

		expect(checks[checks.length - 1]).toMatchObject({Complete: true, Valid: false});
	});

	it('CardExpiryInput takes MMYY, keeps the month in 01-12, and finds a date already past invalid', async function () {
		var checks = [];
		var host = mount('<div><CardExpiryInput (validate)="Checked" /></div>', {
			Checked: function (detail) {
				checks.push(detail);
			}
		});
		var input = host.$Element().querySelector('input');
		var next = (new Date().getFullYear() + 2) % 100;

		await tick();

		type(input, '09' + next);

		await tick();

		expect(checks[checks.length - 1]).toEqual({Value: '09' + next, Complete: true, Valid: true});

		type(input, '0120');

		await tick();

		expect(checks[checks.length - 1]).toEqual({Value: '0120', Complete: true, Valid: false});
	});

	it('CVVInput keeps Length digits hidden, and shows them by its eye; a Guarded one only once the guard allows it', async function () {
		var asked = [];
		var host = mount('<div><CVVInput Guarded="true" /></div>');
		var input = host.$Element().querySelector('input');
		var eye = host.$Element().querySelector('.elemenx-input-action');

		Elemenx.Service('Reveal').Guard(function (request) {
			asked.push(request);
		});

		await tick();

		type(input, '12a34');

		await tick();

		expect(input.value).toBe('123');
		expect(input.type).toBe('password');

		eye.click();

		await tick();

		expect(asked.map(function (request) {
			return request.Kind;
		})).toEqual(['cvv']);
		expect(input.type).toBe('password');
		expect(eye.getAttribute('aria-busy')).toBe('true');

		asked[0].Allow();

		await tick();

		expect(input.type).toBe('text');

		eye.click();

		await tick();

		expect(input.type).toBe('password');
	});

	it('OTPInput drops what its Pattern refuses, changes the case, never grows past Length, and tells once it is complete', async function () {
		var completed = [];
		var host = mount('<div><OTPInput Length="6" Pattern="alphanumeric" Case="upper" (complete)="Done" /></div>', {
			Done: function (value) {
				completed.push(value);
			}
		});
		var input = host.$Element().querySelector('input');

		await tick();

		type(input, 'ab-12');

		await tick();

		expect(input.value).toBe('AB12');
		expect(completed).toEqual([]);

		type(input, 'AB12cd9x');

		await tick();

		expect(input.value).toBe('AB12CD');
		expect(completed).toEqual(['AB12CD']);

		commit(input);
	});
});
