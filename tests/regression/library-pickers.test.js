import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('PickersHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function type (input, text) {
	input.focus();

	input.value = text;

	input.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: text}));
}

function key (target, name, options) {
	target.dispatchEvent(new KeyboardEvent('keydown', Object.assign({key: name, bubbles: true, cancelable: true}, options || {})));
}

/* Fields that pick and suggest, a palette of commands, a bar of find and a long list: what they take and what they tell. */
describe('Contract: the pickers of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['TagInput', 'Combobox', 'CommandPalette', 'FindBar', 'VirtualList']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('TagInput adds a tag on Enter and on its separators, refuses one its Pattern refuses or a duplicate, and removes one on Backspace', async function () {
		var events = [];
		var host = mount('<div><TagInput [value]="Tags" Pattern="^[a-z]+$" (add)="Added" (remove)="Removed" (invalid)="Refused" (change)="Changed" /></div>', {
			Tags: ['red'],
			Added: function (tag) {
				events.push('add ' + tag);
			},
			Removed: function (tag) {
				events.push('remove ' + tag);
			},
			Refused: function (detail) {
				events.push('invalid ' + detail.Text + ' ' + detail.Reason);
			},
			Changed: function (tags) {
				this.Tags = tags;
			}
		});
		var input = host.$Element().querySelector('.elemenx-tags-control');

		await tick();

		type(input, 'green');

		key(input, 'Enter');

		type(input, 'blue,');

		await tick();

		expect(host.Tags).toEqual(['red', 'green', 'blue']);

		type(input, 'Red1');

		key(input, 'Enter');

		type(input, 'red');

		key(input, 'Enter');

		await tick();

		expect(host.Tags).toEqual(['red', 'green', 'blue']);

		input.value = '';

		key(input, 'Backspace');

		await tick();

		expect(host.Tags).toEqual(['red', 'green']);
		expect(events).toEqual(['add green', 'add blue', 'invalid Red1 pattern', 'invalid red duplicate', 'remove blue']);
	});

	it('Combobox filters its options as the text is typed, tells every text, picks with the keys, and creates a text of its own', async function () {
		var events = [];
		var host = mount('<div><Combobox [options]="Options" [value]="Value" AllowCustom="true" (search)="Searched" (change)="Changed" (create)="Created" /></div>', {
			Value: null,
			Options: [{Value: 'ber', Label: 'Berlin'}, {Value: 'bel', Label: 'Belgrade'}, {Value: 'osl', Label: 'Oslo'}],
			Searched: function (text) {
				events.push('search ' + text);
			},
			Changed: function (value) {
				events.push('change ' + value);

				this.Value = value;
			},
			Created: function (text) {
				events.push('create ' + text);
			}
		});
		var input = host.$Element().querySelector('.elemenx-combobox-control');
		var labels;

		await tick();

		type(input, 'be');

		await tick();

		labels = Array.prototype.map.call(host.$Element().querySelectorAll('.elemenx-option:not(.elemenx-combobox-create) .elemenx-option-label'), function (node) {
			return node.textContent.trim();
		});

		expect(labels).toEqual(['Berlin', 'Belgrade']);

		/* Typing opened the list on its first option: one step down is the second. */
		key(input, 'ArrowDown');
		key(input, 'Enter');

		await tick();

		expect(host.Value).toBe('bel');

		type(input, 'Bergen');

		await tick();

		key(input, 'Enter');

		await tick();

		expect(events).toEqual(['search be', 'change bel', 'search Bergen', 'change Bergen', 'create Bergen']);
	});

	it('CommandPalette finds the commands by the letters of the query in their order, runs one with Enter, and closes', async function () {
		var ran = [];
		var host = mount('<div><CommandPalette Hotkey="" [open]="Open" [commands]="Commands" (run)="Ran" (close)="Closed" /></div>', {
			Open: true,
			Commands: [
				{ID: 'new', Label: 'New file', Group: 'File'},
				{ID: 'save', Label: 'Save all', Group: 'File', Keys: 'Mod+Shift+S'},
				{ID: 'theme', Label: 'Switch theme', Keywords: 'dark light'}
			],
			Ran: function (command) {
				ran.push(command.ID);
			},
			Closed: function () {
				this.Open = false;
			}
		});
		var input;
		var labels;

		input = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-palette-search input');
		});

		type(input, 'sva');

		await tick();

		labels = Array.prototype.map.call(host.$Element().querySelectorAll('.elemenx-palette .elemenx-option .elemenx-option-label'), function (node) {
			return node.textContent.replace(/\s+/g, ' ').trim();
		});

		expect(labels).toEqual(['Save all']);

		type(input, 'dark');

		await tick();

		expect(host.$Element().querySelector('.elemenx-palette .elemenx-option .elemenx-option-label').textContent).toContain('Switch theme');

		key(input, 'Enter');

		await tick();

		expect(ran).toEqual(['theme']);
		expect(host.Open).toBe(false);
	});

	it('FindBar tells what to find as the text and the options change, the next and previous match by Enter, and its close by Escape', async function () {
		var events = [];
		var host = mount('<div><FindBar [count]="3" [index]="0" CanReplace="true" Replacing="true" (find)="Found" (next)="Next" (previous)="Previous" (replace)="Replaced" (replaceall)="All" (close)="Closed" /></div>', {
			Found: function (detail) {
				events.push('find ' + detail.Query + ' ' + detail.Case + ' ' + detail.Word + ' ' + detail.RegExp);
			},
			Next: function () {
				events.push('next');
			},
			Previous: function () {
				events.push('previous');
			},
			Replaced: function (detail) {
				events.push('replace ' + detail.Text);
			},
			All: function (detail) {
				events.push('all ' + detail.Text);
			},
			Closed: function () {
				events.push('close');
			}
		});
		var bar = host.$Element().querySelector('.elemenx-find');
		var query = bar.querySelector('.elemenx-find-query');
		var replacement = bar.querySelector('.elemenx-find-replacement');

		await tick();

		type(query, 'cat');

		bar.querySelector('[data-option="Case"] button').click();

		key(query, 'Enter');
		key(query, 'Enter', {shiftKey: true});

		type(replacement, 'dog');

		key(replacement, 'Enter');
		key(replacement, 'Enter', {ctrlKey: true});
		key(query, 'Escape');

		await tick();

		expect(events).toEqual(['find cat false false false', 'find cat true false false', 'next', 'previous', 'replace dog', 'all dog', 'close']);
		expect(bar.querySelector('.elemenx-find-count').textContent).toBe('1 of 3');
	});

	it('VirtualList draws only the rows in view of a long list, tells their range, and selects one with the keys', async function () {
		var ranges = [];
		var selected = [];
		var items = [];
		var host;
		var list;
		var i;

		for (i = 0; i < 100000; i++)
			items.push({ID: i, Label: 'Row ' + i});

		host = mount('<div><VirtualList [items]="Items" ItemKey="ID" ItemHeight="30" Height="300" Overscan="2" (range)="Ranged" (select)="Selected" /></div>', {
			Items: items,
			Ranged: function (range) {
				ranges.push(range);
			},
			Selected: function (item) {
				selected.push(item.ID);
			}
		});

		await tick(60);

		list = host.$Element().querySelector('.elemenx-virtual-viewport');

		expect(host.$Element().querySelectorAll('.elemenx-virtual-row').length).toBeLessThan(20);

		list.scrollTop = 30 * 50000;

		list.dispatchEvent(new Event('scroll'));

		await tick(60);

		expect(ranges[ranges.length - 1].Start).toBeGreaterThan(49980);
		expect(host.$Element().textContent).toContain('Row 50000');

		key(list, 'Home');
		key(list, 'ArrowDown');
		key(list, 'Enter');

		await tick();

		expect(selected).toEqual([1]);
	});
});
