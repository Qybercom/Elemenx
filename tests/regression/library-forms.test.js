import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('FormsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function type (input, text) {
	input.focus();

	input.value = text;

	input.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: text}));
}

function commit (input) {
	input.dispatchEvent(new Event('change', {bubbles: true}));
	input.blur();
}

/* The fields of forms not tested elsewhere: dates, times, phones, money, a choice of several, files and long text. */
describe('Contract: the form fields of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['DateInput', 'TimeInput', 'PhoneInput', 'MoneyInput', 'MultiSelect', 'FileUpload', 'TextArea', 'Field', 'Input', 'Select', 'Form', 'service:Forms']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('DateInput takes the digits of its Format, gives an ISO date, and refuses a date out of Min and Max', async function () {
		var changes = [];
		var host = mount('<div><DateInput Format="DD.MM.YYYY" Min="2024-01-01" Max="2024-12-31" (change)="Changed" /></div>', {
			Changed: function (value) {
				changes.push(value);
			}
		});
		var input = host.$Element().querySelector('.elemenx-input-control');

		await tick();

		type(input, '24112024');

		commit(input);

		await tick();

		expect(input.value).toBe('24.11.2024');
		expect(changes[changes.length - 1]).toBe('2024-11-24');

		type(input, '01012030');

		commit(input);

		await tick();

		expect(changes[changes.length - 1]).not.toBe('2030-01-01');
	});

	/* A bug: the focus went into the calendar a task later, so a key pressed at once (PageDown) went to the button and was lost. */
	it('DateInput puts the focus on the day of its calendar as it opens, so the next key moves it', async function () {
		var host = mount('<div><DateInput Value="2024-11-30" /></div>');
		var toggle;

		await tick();

		toggle = host.$Element().querySelector('.elemenx-input-action');

		toggle.focus();
		toggle.click();

		expect(document.activeElement.getAttribute('data-date')).toBe('2024-11-30');

		document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'PageDown', bubbles: true}));

		await tick();

		expect(host.$Element().querySelector('.elemenx-calendar-day[data-cursor="true"]').getAttribute('data-date')).toBe('2024-12-30');
	});

	it('TimeInput keeps 24 hours, gives HH:MM, and Seconds adds them', async function () {
		var changes = [];
		var host = mount('<div><TimeInput (change)="Changed" /><TimeInput Seconds="true" (change)="Changed" /></div>', {
			Changed: function (value) {
				changes.push(value);
			}
		});
		var inputs = host.$Element().querySelectorAll('.elemenx-input-control');

		await tick();

		type(inputs[0], '0930');

		commit(inputs[0]);

		type(inputs[1], '235959');

		commit(inputs[1]);

		await tick();

		expect(inputs[0].value).toBe('09:30');
		expect(changes).toEqual(['09:30', '23:59:59']);
	});

	it('PhoneInput writes the national number in the mask of its Country and gives the international one', async function () {
		var values = [];
		var host = mount('<div><PhoneInput Country="RU" (input)="Typed" /></div>', {
			Typed: function (value) {
				values.push(value);
			}
		});
		var input = host.$Element().querySelector('input[type="tel"]');

		await tick();

		type(input, '9991234567');

		await tick();

		expect(values[values.length - 1]).toBe('+79991234567');
		expect(input.value.replace(/\D/g, '')).toBe('79991234567');
	});

	it('MoneyInput takes no more digits than its currency has, bounds the amount, and groups it when not edited', async function () {
		var changes = [];
		var host = mount('<div><MoneyInput Currency="USD" Locale="en" Max="5000" (change)="Changed" /></div>', {
			Changed: function (detail) {
				changes.push(detail);
			}
		});
		var input = host.$Element().querySelector('.elemenx-input-control');

		await tick();

		input.dispatchEvent(new FocusEvent('focus'));

		type(input, '1234.567');

		commit(input);

		await tick();

		/* A third digit after the point is not taken: a dollar has two. */
		expect(changes[changes.length - 1]).toEqual({Amount: 1234.56, Currency: 'USD'});
		expect(input.value).toBe('1,234.56');

		input.dispatchEvent(new FocusEvent('focus'));

		type(input, '9999');

		commit(input);

		await tick();

		expect(changes[changes.length - 1].Amount).toBe(5000);
	});

	it('MultiSelect toggles its options and gives the list of the Values chosen', async function () {
		var lists = [];
		var host = mount('<div><MultiSelect [options]="Options" [value]="Value" (change)="Changed" /></div>', {
			Value: ['a'],
			Options: [{Value: 'a', Label: 'Apples'}, {Value: 'b', Label: 'Bananas'}, {Value: 'c', Label: 'Cherries'}],
			Changed: function (value) {
				lists.push(value);

				this.Value = value;
			}
		});
		var option;

		host.$Element().querySelector('.elemenx-select-trigger, button').click();

		option = await waitFor(function () {
			return Array.prototype.filter.call(host.$Element().querySelectorAll('.elemenx-option'), function (node) {
				return node.textContent.indexOf('Cherries') !== -1;
			})[0];
		});

		option.click();

		await tick();

		Array.prototype.filter.call(host.$Element().querySelectorAll('.elemenx-option'), function (node) {
			return node.textContent.indexOf('Apples') !== -1;
		})[0].click();

		await tick();

		expect(lists).toEqual([['a', 'c'], ['c']]);
	});

	it('FileUpload gives the files chosen and rejects the ones over MaxSize or past MaxFiles, with the reason', async function () {
		var changes = [];
		var rejects = [];
		var host = mount('<div><FileUpload Multiple="true" MaxSize="10" MaxFiles="2" (change)="Changed" (reject)="Rejected" /></div>', {
			Changed: function (files) {
				changes.push(files.map(function (file) {
					return file.name;
				}));
			},
			Rejected: function (errors) {
				rejects.push(errors.map(function (error) {
					return error.Name + ' ' + error.Reason;
				}));
			}
		});
		var input = host.$Element().querySelector('input[type="file"]');
		var transfer = new DataTransfer();

		transfer.items.add(new File(['tiny'], 'a.txt', {type: 'text/plain'}));
		transfer.items.add(new File(['far too large for it'], 'big.txt', {type: 'text/plain'}));
		transfer.items.add(new File(['b'], 'b.txt', {type: 'text/plain'}));
		transfer.items.add(new File(['c'], 'c.txt', {type: 'text/plain'}));

		input.files = transfer.files;

		input.dispatchEvent(new Event('change', {bubbles: true}));

		await tick();

		expect(changes[changes.length - 1]).toEqual(['a.txt', 'b.txt']);
		expect(rejects[0].length).toBe(2);
		expect(rejects[0][0]).toMatch(/^big\.txt /);
		expect(rejects[0][1]).toMatch(/^c\.txt /);
	});

	it('TextArea tells its text while typing and when it is committed, and AutoSize grows with it', async function () {
		var events = [];
		var host = mount('<div><TextArea AutoSize="true" Rows="2" (input)="Typed" (change)="Changed" /></div>', {
			Typed: function (value) {
				events.push('input ' + value.length);
			},
			Changed: function (value) {
				events.push('change ' + value.length);
			}
		});
		var area = host.$Element().querySelector('textarea');
		var before;

		await tick();

		before = area.offsetHeight;

		type(area, 'one\ntwo\nthree\nfour\nfive\nsix');

		commit(area);

		await tick();

		expect(events).toEqual(['input 27', 'change 27']);
		expect(area.offsetHeight).toBeGreaterThan(before);
	});

	it('Form nests the values of Fields named by parts (user[name], items[ID][title], tags[]) and follows the rows of a *for that come and go', async function () {
		var sent = [];
		var host = mount('<div><Form (submit)="Sent"><Field Name="user[name]" Label="Name"><Input Value="Ada" /></Field><Field Name="user[address][city]" Label="City"><Input Value="London" /></Field><Field *for="item of Items" *key="item.ID" [name]="\'items[\' + item.ID + \'][title]\'" Label="Title"><Input [value]="item.Title" /></Field><Field Name="tags[]" Label="Tag"><Input Value="red" /></Field><Field Name="tags[]" Label="Tag"><Input Value="blue" /></Field><button type="submit">Send</button></Form></div>', {
			Items: [{ID: 1, Title: 'Pen'}, {ID: 4, Title: 'Ink'}],
			Sent: function (detail) {
				sent.push(JSON.parse(JSON.stringify(detail.Value)));
			}
		});
		var send = function () {
			host.$Element().querySelector('button[type="submit"]').click();
		};

		/* The Fields join the Form once they are in the page, a task later: until the last of them has, the value lacks it. */
		expect(await waitFor(function () {
			sent = [];

			send();

			return sent.length && sent[0].tags && sent[0].tags.length === 2;
		}, 3000)).toBeTruthy();

		type(host.$Element().querySelectorAll('.elemenx-input-control')[1], 'Paris');

		sent = [];

		send();

		expect(await waitFor(function () {
			return sent.length === 1;
		})).toBe(true);
		expect(sent[0]).toEqual({user: {name: 'Ada', address: {city: 'Paris'}}, items: [{title: 'Pen'}, {title: 'Ink'}], tags: ['red', 'blue']});

		/* A row that goes takes its value with it; one that comes adds its own; the last one takes the list. */
		host.Items = [{ID: 4, Title: 'Ink'}, {ID: 9, Title: 'Nib'}];

		await tick();

		send();

		expect(await waitFor(function () {
			return sent.length === 2;
		})).toBe(true);
		expect(sent[1].items).toEqual([{title: 'Ink'}, {title: 'Nib'}]);

		host.Items = [];

		await tick();

		send();

		expect(await waitFor(function () {
			return sent.length === 3;
		})).toBe(true);
		expect(sent[2]).toEqual({user: {name: 'Ada', address: {city: 'Paris'}}, tags: ['red', 'blue']});
	});

	/* A bug: the Label of a Field named nothing, so a screen reader read a field without a name (and getByLabel found none). */
	it('Field names the control inside by its Label, unless the control has a name of its own', async function () {
		var host = mount('<div><Field Label="Email" Required="true"><Input Type="email" /></Field><Field Label="Password"><Input Type="password" /></Field><Field Label="Field"><Input Label="Its own" /></Field><Field Label="Plan"><Select [options]="Plans" /></Field></div>', {
			Plans: [{Value: 'free', Label: 'Free'}]
		});
		var root = host.$Element();
		var labels;
		var inputs;

		await waitFor(function () {
			return root.querySelector('.elemenx-input-control[aria-labelledby]');
		});

		labels = root.querySelectorAll('.elemenx-field-label');
		inputs = root.querySelectorAll('.elemenx-input-control');

		expect(labels[0].id).toBeTruthy();
		expect(labels[0].id).not.toBe(labels[1].id);
		expect(inputs[0].getAttribute('aria-labelledby')).toBe(labels[0].id);
		expect(inputs[1].getAttribute('aria-labelledby')).toBe(labels[1].id);
		expect(inputs[0].getAttribute('aria-required')).toBe('true');
		expect(inputs[1].getAttribute('aria-required')).toBe(null);
		expect(inputs[2].getAttribute('aria-labelledby')).toBe(null);
		expect(inputs[2].getAttribute('aria-label')).toBe('Its own');
		expect(root.querySelectorAll('.elemenx-field')[3].querySelector('[aria-labelledby="' + labels[3].id + '"]')).toBeTruthy();
	});
});
