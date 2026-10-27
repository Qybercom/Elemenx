import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('DirectiveHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function frame () {
	return new Promise(function (resolve) {
		requestAnimationFrame(function () {
			requestAnimationFrame(resolve);
		});
	});
}

function center (node) {
	var box = node.getBoundingClientRect();

	return {X: box.left + box.width / 2, Y: box.top + box.height / 2};
}

function pointer (target, type, point) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: point.X, clientY: point.Y}));
}

/* The Directives of ElemenxUI that had no test of their own: their contracts, as their heads describe them. */
describe('Contract: the Directives of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['*modal', '*hotkey', '*resizable', '*draggable', '*droppable', '*itemcard']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('*modal opens a dialog while its expression is true, puts the focus in it, and asks to close on Escape', async function () {
		var reasons = [];
		var opener;
		var host = mount('<div><button class="opener">Open</button><dialog *modal="Open" (dismiss)="Dismissed"><button class="inside">OK</button></dialog></div>', {
			Open: false,
			Dismissed: function (event) {
				reasons.push(event.detail.Reason);

				this.Open = false;
			}
		});
		var dialog = host.$Element().querySelector('dialog');

		opener = host.$Element().querySelector('.opener');

		opener.focus();

		host.Open = true;

		await frame();

		expect(dialog.getAttribute('aria-modal')).toBe('true');
		expect(dialog.matches(':popover-open') || dialog.open).toBe(true);
		expect(document.activeElement).toBe(dialog.querySelector('.inside'));

		document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));

		await frame();

		expect(reasons).toEqual(['escape']);
		expect(dialog.matches(':popover-open') || dialog.open).toBe(false);
		expect(document.activeElement).toBe(opener);
	});

	it('*hotkey clicks its element on the keys, tells them by aria-keyshortcuts, and leaves a disabled element alone', async function () {
		var clicks = [];
		var host = mount('<div><button class="save" *hotkey="\'Alt+Shift+S\'" (click)="Saved">Save</button><button class="off" disabled *hotkey="\'Alt+Shift+D\'" (click)="Off">Off</button></div>', {
			Saved: function () {
				clicks.push('save');
			},
			Off: function () {
				clicks.push('off');
			}
		});

		await tick();

		expect(host.$Element().querySelector('.save').getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+S');

		document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'S', code: 'KeyS', altKey: true, shiftKey: true, bubbles: true, cancelable: true}));
		document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'D', code: 'KeyD', altKey: true, shiftKey: true, bubbles: true, cancelable: true}));

		await tick();

		expect(clicks).toEqual(['save']);
	});

	it('*resizable adds its handles, and the arrow keys on a handle resize the element within its bounds', async function () {
		var sizes = [];
		var host = mount('<div><div class="box" style="width: 100px; height: 60px" *resizable="{Edges: \'right\', MaxWidth: 130}" (resize)="Resized"></div></div>', {
			Resized: function (event) {
				sizes.push(event.detail.Width);
			}
		});
		var box = host.$Element().querySelector('.box');
		var handle;

		await tick();

		handle = box.querySelector('.elemenx-resize-handle.right');

		expect(handle.getAttribute('role')).toBe('separator');

		handle.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true, cancelable: true}));
		handle.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true}));
		handle.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true}));
		handle.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true}));

		await tick();

		expect(sizes[0]).toBeGreaterThan(100);
		expect(box.offsetWidth).toBe(130);
	});

	it('*draggable and *droppable: an item dragged by the pointer onto a target that accepts its type is dropped with its data', async function () {
		var events = [];
		var host = mount('<div style="position: relative; height: 200px">' +
			'<div class="item" style="position: absolute; left: 0; top: 0; width: 60px; height: 40px" *draggable="{Data: Task, Type: \'task\'}" (dragfinish)="Finished">Task</div>' +
			'<div class="target" style="position: absolute; left: 200px; top: 100px; width: 120px; height: 80px" *droppable="{Accept: [\'task\']}" (dropped)="Dropped"></div>' +
			'<div class="other" style="position: absolute; left: 200px; top: 0; width: 120px; height: 80px" *droppable="{Accept: [\'note\']}" (dropped)="Other"></div>' +
			'</div>', {
			Task: {ID: 7},
			Dropped: function (event) {
				events.push(['dropped', event.detail.Kind, event.detail.Type, event.detail.Data.ID]);
			},
			Other: function () {
				events.push(['other']);
			},
			Finished: function (event) {
				events.push(['finished', event.detail.Dropped]);
			}
		});
		var item = host.$Element().querySelector('.item');
		var target = host.$Element().querySelector('.target');
		var start = center(item);
		var goal = center(target);

		await tick();

		pointer(item, 'pointerdown', start);
		pointer(document, 'pointermove', {X: start.X + 10, Y: start.Y + 10});

		await frame();

		pointer(document, 'pointermove', goal);

		await frame();

		expect(target.classList.contains('drop-target')).toBe(true);
		expect(host.$Element().querySelector('.other').classList.contains('drop-target')).toBe(false);

		pointer(document, 'pointerup', goal);

		await tick();

		expect(events).toEqual([['dropped', 'item', 'task', 7], ['finished', true]]);
	});

	it('*itemcard shows the card of an item with more than its name on the focus, and none for a name alone', async function () {
		var host = mount('<div><span class="sword" tabindex="0" *itemcard="Sword">Sword</span><span class="stone" tabindex="0" *itemcard="Stone">Stone</span></div>', {
			Sword: {Name: 'Old sword', Rarity: 'rare', Stats: [{Label: 'Damage', Value: 12}]},
			Stone: {Name: 'Stone'}
		});
		var card;

		await tick();

		host.$Element().querySelector('.sword').focus();

		card = await waitFor(function () {
			return Array.prototype.filter.call(document.querySelectorAll('.elemenx-game-inventory-card'), function (node) {
				return node.matches(':popover-open');
			})[0];
		});

		expect(card.textContent).toContain('Old sword');
		expect(card.textContent).toContain('Damage');

		host.$Element().querySelector('.stone').focus();

		await tick();

		expect(Array.prototype.some.call(document.querySelectorAll('.elemenx-game-inventory-card'), function (node) {
			return node.matches(':popover-open') && node.textContent.indexOf('Stone') !== -1;
		})).toBe(false);
	});
});
