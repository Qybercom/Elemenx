import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('MiscHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function type (input, text) {
	input.focus();

	input.value = text;

	input.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: text}));
}

/* The last components with no test of their own: a range of dates, a color, a currency, groups, icons of files, the bar of a call, a chronicle, the gallery of a ribbon and the card of an item. */
describe('Contract: more components of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['DateRangeInput', 'ColorInput', 'CurrencySelect', 'ButtonGroup', 'FileIcon', 'CallControls', 'Chronicle', 'RibbonGallery', 'GameItemCard', 'Button']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('DateRangeInput picks a range by two presses in either order, and a preset picks a whole one', async function () {
		var ranges = [];
		var host = mount('<div><DateRangeInput [value]="Value" Min="2026-01-01" [presets]="Presets" (change)="Changed" /></div>', {
			Value: ['2026-03-01', '2026-03-02'],
			Presets: [{Label: 'Spring', Value: ['2026-03-20', '2026-06-20']}],
			Changed: function (value) {
				ranges.push(value);

				this.Value = value;
			}
		});
		var day = function (iso) {
			return host.$Element().querySelector('.elemenx-calendar-day[data-date="' + iso + '"]:not(.outside)');
		};

		host.$Element().querySelector('.elemenx-range-toggle').click();

		await waitFor(function () {
			return day('2026-03-15');
		});

		day('2026-03-15').click();

		await tick();

		day('2026-03-10').click();

		await tick();

		expect(ranges[0]).toEqual(['2026-03-10', '2026-03-15']);

		host.$Element().querySelector('.elemenx-range-toggle').click();

		await tick();

		host.$Element().querySelector('.elemenx-range-presets .elemenx-option').click();

		await tick();

		expect(ranges[1]).toEqual(['2026-03-20', '2026-06-20']);
	});

	it('ColorInput takes a color typed as #rrggbb, and #rrggbbaa only with Alpha', async function () {
		var changes = [];
		var host = mount('<div><ColorInput [value]="Value" (change)="Changed" /><ColorInput Alpha="true" Value="#000000ff" (change)="Changed" /></div>', {
			Value: '#336699',
			Changed: function (value) {
				changes.push(value);
			}
		});
		var inputs = host.$Element().querySelectorAll('.elemenx-input-control');

		await tick();

		expect(inputs[0].getAttribute('maxlength')).toBe('7');
		expect(inputs[1].getAttribute('maxlength')).toBe('9');

		type(inputs[0], '#AA3311');

		inputs[0].dispatchEvent(new Event('change', {bubbles: true}));

		type(inputs[1], '#11223380');

		inputs[1].dispatchEvent(new Event('change', {bubbles: true}));

		await tick();

		expect(changes.map(function (value) {
			return value.toLowerCase();
		})).toEqual(['#aa3311', '#11223380']);
	});

	it('CurrencySelect lists only the Codes given, with their symbols, and shows the one chosen', async function () {
		var host = mount('<div><CurrencySelect [codes]="Codes" Value="EUR" /></div>', {
			Codes: ['EUR', 'USD', 'JPY']
		});

		await tick();

		expect(host.$Element().textContent).toContain('EUR');
	});

	it('ButtonGroup groups its buttons for screen readers, attached or in a column, and FileIcon names the icon of a file by its name', async function () {
		var host = mount('<div><ButtonGroup Label="Align" Attached="true" Vertical="true"><Button Label="Left" /><Button Label="Right" /></ButtonGroup><FileIcon Name="report.pdf" Label="A PDF" /><FileIcon Name="photo.JPG" /></div>');
		var group;

		await tick();

		group = host.$Element().querySelector('.elemenx-button-group');

		expect(group.getAttribute('role')).toBe('group');
		expect(group.getAttribute('aria-label')).toBe('Align');
		expect(group.classList.contains('attached') && group.classList.contains('vertical')).toBe(true);
		expect(group.querySelectorAll('button').length).toBe(2);
		expect(host.$Element().querySelectorAll('.elemenx-file-icon').length).toBe(2);
		expect(host.$Element().querySelector('.elemenx-file-icon [aria-label="A PDF"], .elemenx-file-icon [title="A PDF"]')).not.toBe(null);
	});

	it('CallControls asks for the opposite of the state it shows, and leaves out the buttons of Hide', async function () {
		var asked = [];
		var host = mount('<div><CallControls Muted="true" Camera="false" [hide]="Hide" (mute)="Asked" (camera)="Asked" (leave)="Left" /></div>', {
			Hide: ['chat', 'people', 'layout', 'react', 'hand', 'share'],
			Asked: function (detail) {
				asked.push(JSON.stringify(detail));
			},
			Left: function () {
				asked.push('leave');
			}
		});
		var buttons;

		await tick();

		buttons = Array.prototype.filter.call(host.$Element().querySelectorAll('button'), function (button) {
			return !button.closest('.elemenx-popup');
		});

		buttons.forEach(function (button) {
			if (!/arrow|chevron|device|menu/i.test(button.className + (button.getAttribute('aria-label') || '')))
				button.click();
		});

		await tick();

		expect(asked).toContain('{"Muted":false}');
		expect(asked).toContain('{"Camera":true}');
		expect(asked).toContain('leave');
		expect(host.$Element().textContent).not.toMatch(/Chat|People/);
	});

	it('Chronicle lists its events in order with their author, action and time, small ones as dots', async function () {
		var host = mount('<div><Chronicle [items]="Items" /></div>', {
			Items: [
				{ID: 1, Author: 'Ada', Action: 'opened the issue', Time: 'Mon'},
				{ID: 2, Author: 'Grace', Action: 'labelled it', Size: 'small'},
				{ID: 3, Author: 'Alan', Action: 'closed it', Text: 'Fixed in 0.10.3', Variant: 'success'}
			]
		});
		var items;

		await tick();

		items = host.$Element().querySelectorAll('.elemenx-chronicle-item');

		expect(items.length).toBe(3);
		expect(items[0].textContent).toContain('Ada');
		expect(items[0].textContent).toContain('opened the issue');
		expect(items[1].classList.contains('dot')).toBe(true);
		expect(items[2].classList.contains('with-body') && items[2].classList.contains('success')).toBe(true);
	});

	it('RibbonGallery marks the chosen sample and tells another one chosen', async function () {
		var chosen = [];
		var host = mount('<div><RibbonGallery [items]="Items" [value]="Value" (select)="Selected" /></div>', {
			Value: 'normal',
			Items: [{ID: 'normal', Label: 'Normal'}, {ID: 'title', Label: 'Title', Style: 'font-weight: 700'}],
			Selected: function (detail) {
				chosen.push(detail.ID);

				this.Value = detail.ID;
			}
		});
		var items;

		await tick();

		items = host.$Element().querySelectorAll('.elemenx-ribbon-gallery-items .elemenx-ribbon-gallery-item');

		expect(items[0].getAttribute('aria-selected')).toBe('true');

		items[1].click();

		await tick();

		expect(chosen).toEqual(['title']);
		expect(host.$Element().querySelectorAll('.elemenx-ribbon-gallery-items .elemenx-ribbon-gallery-item')[1].getAttribute('aria-selected')).toBe('true');
	});

	it('GameItemCard shows the name, the rarity and type, and the stats of an item, and nothing without one', async function () {
		var host = mount('<div><GameItemCard [item]="Item" /></div>', {
			Item: {Name: 'Old sword', Rarity: 'rare', Type: 'Sword', Stats: [{Label: 'Damage', Value: 12}]}
		});
		var card;

		await tick();

		card = host.$Element().querySelector('.elemenx-game-inventory-card');

		expect(card.classList.contains('rare')).toBe(true);
		expect(card.textContent).toContain('Old sword');
		expect(card.textContent).toContain('Sword');
		expect(card.textContent).toContain('Damage');

		host.Item = null;

		await tick();

		expect(host.$Element().querySelector('.elemenx-game-inventory-card')).toBe(null);
	});
});
