import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('FocusHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* Presses a control as a person does: the focus on it, then its click. */
function press (node) {
	node.focus();
	node.click();
}

/*
 * A bug: the popups of these components took the focus a task after they opened, so a key pressed at once (a slow
 * machine, a quick hand, a screen reader) went to the button that opened them and was lost. The focus is in the popup
 * when the click returns.
 */
describe('Regression: a popup takes the focus as it opens', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['DateInput', 'DateRangeInput', 'TimeInput', 'Select', 'Menu', 'Ribbon', 'RibbonTab', 'RibbonGroup', 'RibbonButton']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('DateRangeInput: the day of the cursor', async function () {
		var host = mount('<div><DateRangeInput [value]="Range" /></div>', {Range: ['2024-11-10', '2024-11-20']});

		await tick();

		press(host.$Element().querySelector('.elemenx-range-toggle'));

		expect(document.activeElement.getAttribute('data-date')).toBe('2024-11-10');
	});

	it('TimeInput: the time chosen', async function () {
		var host = mount('<div><TimeInput Value="09:30" /></div>');

		await tick();

		press(host.$Element().querySelector('.elemenx-input-action'));

		expect(document.activeElement.closest('.elemenx-time-column')).toBeTruthy();
		expect(document.activeElement.classList.contains('selected')).toBe(true);
	});

	it('Select with Searchable: its search field', async function () {
		var host = mount('<div><Select Searchable="true" Label="Fruit" [options]="Options" /></div>', {Options: [{Value: 'a', Label: 'Apple'}, {Value: 'b', Label: 'Banana'}]});

		await tick();

		press(host.$Element().querySelector('.elemenx-select-trigger'));

		expect(document.activeElement.closest('.elemenx-popup-search')).toBeTruthy();
	});

	it('Menu: its first item', async function () {
		var host = mount('<div><Menu Label="File" [items]="Items" /></div>', {Items: [{ID: 'open', Label: 'Open'}, {ID: 'save', Label: 'Save'}]});

		await tick();

		press(host.$Element().querySelector('.elemenx-button'));

		expect(document.activeElement.textContent).toContain('Open');
	});

	it('Ribbon: the first control of the panel a person can see, after ArrowDown on its tab', async function () {
		var host = mount('<div><Ribbon><RibbonTab ID="home" Title="Home"><RibbonGroup Title="Clipboard"><RibbonButton ID="paste" Label="Paste" Icon="paste" /></RibbonGroup></RibbonTab></Ribbon></div>');
		var tab;

		await tick(50);

		tab = host.$Element().querySelector('.elemenx-ribbon-tab');

		tab.focus();
		tab.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true, cancelable: true}));

		expect(document.activeElement.closest('.elemenx-ribbon-panel, [role="tabpanel"]')).toBeTruthy();
		expect(document.activeElement.textContent).toContain('Paste');
	});
});
