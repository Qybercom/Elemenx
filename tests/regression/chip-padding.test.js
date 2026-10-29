import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component('ChipPaddingHost' + Math.random().toString(36).slice(2), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function sides (chip) {
	var style = getComputedStyle(chip);

	return style.paddingLeft + ' ' + style.paddingRight;
}

/*
 * A chip of a text alone (the genres of a MediaHero, the tags of a PostCard) has as much room on its right as on its
 * left; only a chip with its button to remove it keeps less on the right, for that button (it had less on every chip).
 */
describe('Regression: the padding of a chip', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/index.css');

		Use(['MediaHero', 'TagInput']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		owned.splice(0).forEach(function (component) {
			component.$Destroy();
		});
	});

	it('is the same on both sides of a text, smaller on the right of a button to remove it', async function () {
		var host = mount('<div><MediaHero Title="The Long Light" [tags]="[\'Drama\', \'Mystery\']" /><TagInput [value]="Tags" /></div>', {Tags: ['design']});
		var element = host.$Element();

		expect(await waitFor(function () {
			return !!element.querySelector('.elemenx-media-hero .elemenx-chip') && !!element.querySelector('.elemenx-tags .elemenx-chip, .elemenx-input .elemenx-chip');
		})).toBe(true);

		expect(sides(element.querySelector('.elemenx-media-hero .elemenx-chip'))).toBe('8px 8px');
		expect(sides(element.querySelector('.elemenx-input .elemenx-chip'))).toBe('8px 4px');
	});
});
