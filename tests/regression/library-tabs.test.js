import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('TabsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function key (target, name) {
	target.dispatchEvent(new KeyboardEvent('keydown', {key: name, bubbles: true, cancelable: true}));
}

/* Tabs standing on a side of their content: their text on its side, their keys Up and Down. */
describe('Contract: vertical Tabs', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Tabs', 'Tab']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('stands the strip left or right of the panels, its text turned or level, and moves by Up and Down', async function () {
		var changes = [];
		var host = mount('<div style="width: 600px"><Tabs #Left Orientation="vertical" [value]="Current" (change)="Changed"><Tab ID="one" Label="One">First</Tab><Tab ID="two" Label="Two">Second</Tab><Tab ID="three" Label="Three" Disabled="true">Third</Tab></Tabs><Tabs #Right Orientation="vertical" Placement="right" [tabs]="Items" Value="b"><Tab ID="b" Label="B">Beside</Tab></Tabs><Tabs #Level Orientation="vertical" Rotate="false" [tabs]="Items" Value="a" /></div>', {
			Current: 'one',
			Items: [{ID: 'a', Label: 'Alpha'}],
			Changed: function (id) {
				changes.push(id);

				this.Current = id;
			}
		});
		var left;
		var right;
		var level;
		var list;
		var tabs;

		left = await waitFor(function () {
			var element = host.$Ref('Left');

			return element && element.querySelector('.elemenx-tab-panel.active') ? element : null;
		});

		right = host.$Ref('Right');
		level = host.$Ref('Level');
		list = left.querySelector('[role="tablist"]');
		tabs = left.querySelectorAll('[role="tab"]');

		expect(left.className).toContain('vertical left rotated');
		expect(right.className).toContain('vertical right rotated');
		expect(level.className).toContain('vertical left');
		expect(level.className).not.toContain('rotated');
		expect(list.getAttribute('aria-orientation')).toBe('vertical');

		/* The tabs in a column, their text on its side; the panel beside them, on the side of the content. */
		expect(tabs[1].getBoundingClientRect().top).toBeGreaterThan(tabs[0].getBoundingClientRect().bottom - 1);
		expect(getComputedStyle(tabs[0]).writingMode).toBe('vertical-rl');
		expect(getComputedStyle(level.querySelector('[role="tab"]')).writingMode).toBe('horizontal-tb');
		expect(left.querySelector('.elemenx-tab-panel.active').getBoundingClientRect().left).toBeGreaterThanOrEqual(list.getBoundingClientRect().right - 1);
		expect(right.querySelector('.elemenx-tab-panel.active').getBoundingClientRect().right).toBeLessThanOrEqual(right.querySelector('[role="tablist"]').getBoundingClientRect().left + 1);

		/* Down goes to the next tab, over a disabled one round to the first; Right does nothing in a column. */
		key(tabs[0], 'ArrowRight');
		key(tabs[0], 'ArrowDown');

		await tick();

		expect(changes).toEqual(['two']);

		key(left.querySelectorAll('[role="tab"]')[1], 'ArrowDown');

		await tick();

		expect(changes).toEqual(['two', 'one']);

		key(left.querySelectorAll('[role="tab"]')[0], 'ArrowUp');

		await tick();

		expect(changes).toEqual(['two', 'one', 'two']);
		expect(left.querySelector('.elemenx-tab-panel.active').textContent.trim()).toBe('Second');
	});
});
