import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var owned = [];

function mounted (component) {
	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function pointer (element, type) {
	element.dispatchEvent(new PointerEvent(type, {pointerType: 'mouse', bubbles: type !== 'pointerenter' && type !== 'pointerleave'}));
}

describe('Contract: the *tip directive of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/directives/Tip.js');
		await import('../../libraries/ElemenxUI/index.css');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('shows a bold title over its text after the delay, beside the element, and hides when the pointer leaves', async function () {
		var component = mounted(Elemenx.Component(unique('Tipped'), {
			$Template: '<button type="button" *tip="{Title: Name, Text: \'A number field.\', Delay: 20}">{{Name}}</button>',
			Name: 'NumberInput'
		})());
		var button = component.$Element();
		var tip;

		pointer(button, 'pointerenter');

		expect(document.getElementById('elemenx-tip') === null || document.getElementById('elemenx-tip').hidden).toBe(true);

		await tick(60);

		tip = document.getElementById('elemenx-tip');

		expect(tip.hidden).toBe(false);
		expect(tip.getAttribute('role')).toBe('tooltip');
		expect(tip.classList.contains('rich')).toBe(true);
		expect(tip.querySelector('.elemenx-tip-title').textContent).toBe('NumberInput');
		expect(tip.querySelector('.elemenx-tip-text').textContent).toBe('A number field.');
		expect(button.getAttribute('aria-describedby')).toBe('elemenx-tip');
		expect(['top', 'bottom']).toContain(tip.getAttribute('data-placement'));

		pointer(button, 'pointerleave');

		expect(tip.hidden).toBe(true);

		/* Hidden by the stylesheet of the Library too: a rich tip is a flex, which must not show it again. */
		expect(getComputedStyle(tip).display).toBe('none');
		expect(button.hasAttribute('aria-describedby')).toBe(false);
	});

	it('takes a plain text, renders content of its own, and shows nothing when Disabled', async function () {
		var component = mounted(Elemenx.Component(unique('TippedMore'), {
			$Template: '<div><span class="plain" *tip="\'Save\'">a</span><span class="own" *tip="{Render: Draw, Delay: 0}">b</span><span class="off" *tip="{Text: \'No\', Disabled: true, Delay: 0}">c</span></div>',
			$OnCreate: function () {
				this.Draw = function (container) {
					container.insertAdjacentHTML('beforeend', '<kbd>Ctrl+S</kbd>');
				};
			}
		})());
		var root = component.$Element();
		var tip;

		pointer(root.querySelector('.plain'), 'pointerenter');

		await tick(600);

		tip = document.getElementById('elemenx-tip');

		expect(tip.hidden).toBe(false);
		expect(tip.textContent).toBe('Save');
		expect(tip.classList.contains('rich')).toBe(false);

		pointer(root.querySelector('.plain'), 'pointerleave');
		pointer(root.querySelector('.own'), 'pointerenter');

		await tick(20);

		expect(tip.querySelector('kbd').textContent).toBe('Ctrl+S');

		pointer(root.querySelector('.own'), 'pointerleave');
		pointer(root.querySelector('.off'), 'pointerenter');

		await tick(20);

		expect(tip.hidden).toBe(true);
	});

	it('hides when the pointer moves off an element that never heard it leave, and shows nothing for a hidden element', async function () {
		var component = mounted(Elemenx.Component(unique('TippedLost'), {
			$Template: '<div><button type="button" class="first" *tip="{Text: \'First\', Delay: 0}">a</button><button type="button" class="second" *tip="{Text: \'Second\', Delay: 20}">b</button></div>'
		})());
		var root = component.$Element();
		var tip;

		pointer(root.querySelector('.first'), 'pointerenter');

		await tick(20);

		tip = document.getElementById('elemenx-tip');

		expect(tip.hidden).toBe(false);

		/* The element goes out of sight under the pointer: no leave comes, but the next move of the pointer elsewhere hides it. */
		root.querySelector('.first').style.display = 'none';

		document.body.dispatchEvent(new PointerEvent('pointermove', {pointerType: 'mouse', bubbles: true}));

		expect(tip.hidden).toBe(true);

		/* An element hidden before its delay is over shows no tip. */
		pointer(root.querySelector('.second'), 'pointerenter');

		root.querySelector('.second').style.display = 'none';

		await tick(60);

		expect(tip.hidden).toBe(true);
	});
});
