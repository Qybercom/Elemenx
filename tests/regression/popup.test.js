import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import popupSource from '../../libraries/ElemenxUI/directives/Popup.js?raw';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('PopupHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: *popup', function () {
	beforeAll(async function () {
		await loadElemenx();

		new Function(popupSource)();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * Regression: a panel open while its element was out of the page (a component built, then placed; a menu drawn in a
	 * busy page) stayed out of the top layer, and Escape did not close it.
	 */
	it('opens in the top layer and closes on Escape when it was open before its element was in the page', async function () {
		var reasons = [];
		var host = mount('<span class="elemenx-popup-anchor"><button type="button">Anchor</button><div class="elemenx-popup" *popup="Open" (dismiss)="Closed"><button type="button" class="item">Item</button></div></span>', {
			Open: true,
			Closed: function (event) {
				reasons.push(event.detail.Reason);

				this.Open = false;
			}
		});
		var panel = host.$Element().querySelector('.elemenx-popup');

		await tick(50);

		expect(panel.hidden).toBe(false);

		if (typeof panel.showPopover === 'function')
			expect(panel.matches(':popover-open')).toBe(true);

		panel.querySelector('.item').focus();
		panel.querySelector('.item').dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));

		await tick(50);

		expect(reasons).toEqual(['escape']);
		expect(panel.hidden).toBe(true);
	});
});
