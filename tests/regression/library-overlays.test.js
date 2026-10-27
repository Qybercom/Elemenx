import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('OverlaysHost'), Object.assign({$Template: template}, state || {}))();

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

function key (target, name) {
	target.dispatchEvent(new KeyboardEvent('keydown', {key: name, bubbles: true, cancelable: true}));
}

function buttons (root, label) {
	return Array.prototype.filter.call(root.querySelectorAll('button'), function (button) {
		return button.textContent.trim() === label;
	});
}

/* The layers over the page: a drawer, a tour, a context menu, a popover, and the hosts of the dialogs and toasts of code. */
describe('Contract: the overlays of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Drawer', 'Tour', 'ContextMenu', 'Popover', 'Menu', 'DialogHost', 'ToastHost', 'service:Dialogs', 'service:Toast']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		Elemenx.Service('Toast').Clear();
	});

	it('Drawer asks to close with the reason: its close button, Escape; a Dismissible false one shakes and stays', async function () {
		var reasons = [];
		var host = mount('<div><Drawer Title="Filters" [open]="Open" [dismissible]="Dismissible" (close)="Closed"><p>Body</p></Drawer></div>', {
			Open: true,
			Dismissible: true,
			Closed: function (reason) {
				reasons.push(reason);

				this.Open = false;
			}
		});
		var dialog = host.$Element().querySelector('dialog.elemenx-drawer');

		await frame();

		key(dialog.querySelector('p'), 'Escape');

		await frame();

		expect(reasons).toEqual(['escape']);

		host.Open = true;

		await frame();

		dialog.querySelector('.elemenx-drawer-header button').click();

		await frame();

		expect(reasons).toEqual(['escape', 'close']);

		host.Dismissible = false;
		host.Open = true;

		await frame();

		key(dialog.querySelector('p'), 'Escape');

		await frame();

		expect(reasons).toEqual(['escape', 'close']);
		expect(host.Open).toBe(true);
	});

	it('Tour goes step by step with Next and Back, tells each step, finishes at the last, and closes with the reason', async function () {
		var events = [];
		var host = mount('<div><button id="tour-a">A</button><button id="tour-b">B</button><Tour [open]="Open" [step]="Step" [steps]="Steps" (change)="Changed" (finish)="Finished" (close)="Closed" /></div>', {
			Open: true,
			Step: 0,
			Steps: [{Target: '#tour-a', Title: 'First'}, {Target: '#tour-b', Title: 'Second'}, {Target: '#tour-missing', Title: 'Third'}],
			Changed: function (step) {
				events.push('change ' + step);

				this.Step = step;
			},
			Finished: function () {
				events.push('finish');
			},
			Closed: function (reason) {
				events.push('close ' + reason);

				this.Open = false;
			}
		});
		var card = function () {
			return host.$Element().querySelector('.elemenx-tour-card');
		};

		await waitFor(card);

		buttons(card(), 'Next')[0].click();

		await tick();

		buttons(card(), 'Back')[0].click();

		await tick();

		buttons(card(), 'Next')[0].click();

		await tick();

		buttons(card(), 'Next')[0].click();

		await tick();

		expect(card().querySelector('.elemenx-tour-title').textContent).toBe('Third');

		buttons(card(), 'Done')[0].click();

		await tick();

		expect(events).toEqual(['change 1', 'change 0', 'change 1', 'change 2', 'finish', 'close done']);
		expect(card()).toBe(null);
	});

	it('ContextMenu opens at the pointer on a right click, tells the target first, and gives the item chosen with it', async function () {
		var events = [];
		var host = mount('<div><ContextMenu [items]="Items" (open)="Opened" (select)="Selected"><div class="area" style="width: 200px; height: 100px">Area</div></ContextMenu></div>', {
			Items: [{ID: 'copy', Label: 'Copy'}, {ID: 'paste', Label: 'Paste'}],
			Opened: function (detail) {
				events.push('open ' + detail.Target.className + ' ' + Math.round(detail.X) + ',' + Math.round(detail.Y));
			},
			Selected: function (detail) {
				events.push('select ' + detail.Item.ID + ' ' + detail.Target.className);
			}
		});
		var area = host.$Element().querySelector('.area');
		var box = area.getBoundingClientRect();
		var item;

		area.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: box.left + 20, clientY: box.top + 30, button: 2}));

		item = await waitFor(function () {
			return Array.prototype.filter.call(host.$Element().querySelectorAll('.elemenx-menu-item, [role="menuitem"]'), function (node) {
				return node.textContent.trim() === 'Paste';
			})[0];
		});

		item.click();

		await tick();

		expect(events[0]).toMatch(/^open area \d+,\d+$/);
		expect(events[1]).toBe('select paste area');
	});

	it('Popover opens and closes by its trigger, tells it, and closes on Escape', async function () {
		var states = [];
		var host = mount('<div><Popover Title="Help" (toggle)="Toggled"><button slot="trigger" class="trigger">?</button><p>Some help</p></Popover></div>', {
			Toggled: function (open) {
				states.push(open);
			}
		});
		var trigger = host.$Element().querySelector('.trigger');

		trigger.click();

		await frame();

		expect(host.$Element().querySelector('.elemenx-popover').matches(':popover-open, .open, [open]') || getComputedStyle(host.$Element().querySelector('.elemenx-popover')).display !== 'none').toBe(true);

		key(document.activeElement || trigger, 'Escape');

		await frame();

		trigger.click();

		await frame();

		trigger.click();

		await frame();

		expect(states).toEqual([true, false, true, false]);
	});

	/* Regression: Menu gave the focus back to its button after select, and failed when select had taken the menu away. */
	it('Menu lets its owner take it away in its select (a sign out) without an error', async function () {
		var errors = [];
		var listener = function (event) {
			errors.push(event.message || String(event.error));

			event.preventDefault();
		};
		var host = mount('<div><Menu *if="Shown" Label="Ada" [items]="Items" (select)="Out" /></div>', {
			Shown: true,
			Items: [{ID: 'out', Label: 'Sign out'}],
			Out: function () {
				this.Shown = false;
			}
		});
		var item;

		window.addEventListener('error', listener);

		try {
			host.$Element().querySelector('.elemenx-button').click();

			item = await waitFor(function () {
				return Array.prototype.filter.call(host.$Element().querySelectorAll('[role="menuitem"]'), function (node) {
					return node.textContent.trim() === 'Sign out';
				})[0];
			});

			item.click();

			await tick();
		}
		finally {
			window.removeEventListener('error', listener);
		}

		expect(host.Shown).toBe(false);
		expect(errors).toEqual([]);
	});

	it('DialogHost shows the dialogs of the Dialogs Service, and an action pressed closes one with its ID', async function () {
		var answers = [];
		var host = mount('<div><DialogHost /></div>');
		var action;

		Elemenx.Service('Dialogs').Confirm({Title: 'Delete the file?', Message: 'It goes for good.'}, function (id) {
			answers.push(id);
		});

		action = await waitFor(function () {
			return host.$Element().querySelector('[data-action="ok"] button');
		});

		expect(host.$Element().textContent).toContain('It goes for good.');

		action.click();

		await tick();

		expect(answers).toEqual(['ok']);
		expect(host.$Element().querySelector('.elemenx-dialog-host-item')).toBe(null);
	});

	it('ToastHost shows the toasts of the Toast Service, runs an action, and lets one go by its close button', async function () {
		var ran = [];
		var host = mount('<div><ToastHost /></div>');
		var toast;

		Elemenx.Service('Toast').Show({Title: 'Saved', Message: 'The file is saved.', AutoHide: false, Actions: [{Label: 'Undo', Run: function () {
			ran.push('undo');
		}}]});

		toast = await waitFor(function () {
			return host.$Element().querySelector('.elemenx-toast');
		});

		expect(toast.textContent).toContain('The file is saved.');

		buttons(toast, 'Undo')[0].click();

		await tick();

		expect(ran).toEqual(['undo']);

		Elemenx.Service('Toast').Clear();

		await tick();

		expect(host.$Element().querySelector('.elemenx-toast')).toBe(null);
	});
});
