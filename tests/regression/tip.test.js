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
		await import('../../libraries/ElemenxUI/directives/Tip/Tip.js');
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

	it('shows in the top layer, over a panel opened before it, and not for an element a panel covers', async function () {
		var component = mounted(Elemenx.Component(unique('TippedLayer'), {
			$Template: '<div><button type="button" class="beside" style="position: fixed; left: 10px; top: 10px; width: 80px; height: 30px" *tip="{Text: \x27Beside\x27, Delay: 0}">a</button><button type="button" class="under" style="position: fixed; left: 320px; top: 10px; width: 80px; height: 30px" *tip="{Text: \x27Under\x27, Delay: 0}">b</button><div class="panel" popover="manual" style="position: fixed; inset: auto; margin: 0; left: 300px; top: 0; width: 200px; height: 200px; padding: 0">A panel</div></div>'
		})());
		var root = component.$Element();
		var panel = root.querySelector('.panel');
		var tip;

		panel.showPopover();

		/* A tip shown after a panel of the top layer opened: in the top layer too, the last one, over it; at its own place. */
		pointer(root.querySelector('.beside'), 'pointerenter');

		await tick(20);

		tip = document.getElementById('elemenx-tip');

		expect(tip.hidden).toBe(false);
		expect(tip.matches(':popover-open')).toBe(true);
		expect(Math.round(tip.getBoundingClientRect().top)).toBeGreaterThanOrEqual(40);
		expect(Math.round(tip.getBoundingClientRect().left)).toBeLessThan(200);

		pointer(root.querySelector('.beside'), 'pointerleave');

		expect(tip.matches(':popover-open')).toBe(false);

		/* An element under the panel: no tip of what cannot be seen. */
		pointer(root.querySelector('.under'), 'pointerenter');

		await tick(20);

		expect(tip.hidden).toBe(true);

		panel.hidePopover();
	});

	/* What *itemcard did, for any content: the card of an item of a game is GameItemCard in a *tip. */
	it('shows a Component made with its Props in a bare tip, made again when they change, and destroyed when it hides', async function () {
		var card = unique('TipCard');
		var made = [];
		var component;
		var root;
		var tip;

		Elemenx.Component(card, {
			$Template: '<b class="probe">{{Name}}</b>',
			Name: '',

			$OnCreate: function () {
				made.push(this);
			}
		});

		component = mounted(Elemenx.Component(unique('TippedCard'), {
			$Template: '<div><button type="button" class="sword" *tip="{Component: \x27' + card + '\x27, Props: {Name: Name}, Delay: 0}">a</button></div>',
			Name: 'Old sword'
		})());
		root = component.$Element();

		pointer(root.querySelector('.sword'), 'pointerenter');

		await tick(20);

		tip = document.getElementById('elemenx-tip');

		expect(tip.querySelector('.probe').textContent).toBe('Old sword');
		expect(tip.classList.contains('bare')).toBe(true);
		expect(getComputedStyle(tip).paddingTop).toBe('0px');

		component.Name = 'New sword';

		await tick(20);

		expect(tip.querySelector('.probe').textContent).toBe('New sword');
		expect(made.length).toBe(2);

		pointer(root.querySelector('.sword'), 'pointerleave');

		expect(tip.hidden).toBe(true);
		expect(tip.querySelector('.probe')).toBe(null);
	});

	it('takes the theme of the part of the page its element is in, and keeps beside it when the page moves it', async function () {
		var component = mounted(Elemenx.Component(unique('TippedThemed'), {
			$Template: '<div data-theme="darcula" data-scheme="dark"><div class="above" style="height: 10px"></div><button type="button" class="themed" *tip="{Text: \x27Here\x27, Placement: \x27right\x27, Delay: 0}">a</button></div>'
		})());
		var root = component.$Element();
		var button = root.querySelector('.themed');
		var tip;

		pointer(button, 'pointerenter');

		await tick(20);

		tip = document.getElementById('elemenx-tip');

		expect(tip.parentNode).toBe(root);

		root.querySelector('.above').style.height = '120px';

		await new Promise(function (resolve) {
			requestAnimationFrame(function () {
				requestAnimationFrame(resolve);
			});
		});

		var box = button.getBoundingClientRect();

		expect(Math.abs(tip.getBoundingClientRect().top + tip.offsetHeight / 2 - (box.top + box.height / 2))).toBeLessThan(2);

		pointer(button, 'pointerleave');
	});

	/* A bug of *itemcard, kept fixed: on a tablet the card a tap opened went along with the page as it scrolled, over everything. */
	it('with Touch shows on a tap and hides on a scroll or a tap elsewhere; one the mouse opened follows a scroll', async function () {
		var component = mounted(Elemenx.Component(unique('TippedTouch'), {
			$Template: '<div><button type="button" class="tapped" *tip="{Text: \x27Tapped\x27, Delay: 0, Touch: true}">a</button><button type="button" class="other">b</button></div>'
		})());
		var root = component.$Element();
		var button = root.querySelector('.tapped');
		var tip;

		button.dispatchEvent(new PointerEvent('pointerdown', {pointerType: 'touch', bubbles: true}));

		tip = document.getElementById('elemenx-tip');

		expect(tip.hidden).toBe(false);

		window.dispatchEvent(new Event('scroll'));

		expect(tip.hidden).toBe(true);

		button.dispatchEvent(new PointerEvent('pointerdown', {pointerType: 'touch', bubbles: true}));
		root.querySelector('.other').dispatchEvent(new PointerEvent('pointerdown', {pointerType: 'touch', bubbles: true}));

		expect(tip.hidden).toBe(true);

		pointer(button, 'pointerenter');

		await tick(20);

		window.dispatchEvent(new Event('scroll'));

		expect(tip.hidden).toBe(false);

		pointer(button, 'pointerleave');

		expect(tip.hidden).toBe(true);
	});

	it('hides on a press, but not with Stay (the card of an item pressed to choose it)', async function () {
		var component = mounted(Elemenx.Component(unique('TippedStay'), {
			$Template: '<div><button type="button" class="plain" *tip="{Text: \x27Plain\x27, Delay: 0}">a</button><button type="button" class="stay" *tip="{Text: \x27Stays\x27, Delay: 0, Stay: true}">b</button></div>'
		})());
		var root = component.$Element();
		var tip;

		pointer(root.querySelector('.plain'), 'pointerenter');

		await tick(20);

		tip = document.getElementById('elemenx-tip');

		pointer(root.querySelector('.plain'), 'pointerdown');

		expect(tip.hidden).toBe(true);

		pointer(root.querySelector('.plain'), 'pointerleave');
		pointer(root.querySelector('.stay'), 'pointerenter');

		await tick(20);

		pointer(root.querySelector('.stay'), 'pointerdown');

		expect([tip.hidden, tip.textContent]).toEqual([false, 'Stays']);

		pointer(root.querySelector('.stay'), 'pointerleave');
	});
});
