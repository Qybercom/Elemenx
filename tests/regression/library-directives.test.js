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

		Use(['*modal', '*hotkey', '*resizable', '*draggable', '*droppable', '*itemcard', '*layer', '*blur']);

		/* As the stylesheet of the library: an element of *layer keeps its own place, not the one of a popover. */
		document.head.appendChild(document.createElement('style')).textContent = ':where(.elemenx-layer[popover]) { inset: auto; margin: 0; }';
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('*blur makes an element frosted glass: the tokens of the theme alone, its radius as a number, each part of an object', async function () {
		var host = mount('<div><div class="plain" *blur></div><div class="radius" *blur="Radius"></div><div class="parts" *blur="Parts"></div></div>', {
			Radius: 12,
			Parts: {Radius: 24, Saturate: 1.4, Tint: 0.5}
		});
		var root;
		var parts;

		await tick();

		root = host.$Element();
		parts = root.querySelector('.parts');

		expect(root.querySelector('.plain').classList.contains('elemenx-blur')).toBe(true);
		expect(root.querySelector('.plain').getAttribute('style')).toBe(null);
		expect(root.querySelector('.radius').style.getPropertyValue('--elemenx-blur-radius')).toBe('12px');
		expect(parts.style.getPropertyValue('--elemenx-blur-radius')).toBe('24px');
		expect(parts.style.getPropertyValue('--elemenx-blur-saturate')).toBe('140%');
		expect(parts.style.getPropertyValue('--elemenx-blur-tint')).toBe('0.5');

		host.Parts = {Tint: 2};

		await tick();

		expect(parts.style.getPropertyValue('--elemenx-blur-radius')).toBe('');
		expect(parts.style.getPropertyValue('--elemenx-blur-tint')).toBe('1');
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

	it('*layer puts its element in the top layer, placed by the viewport inside a box with containment and a transform', async function () {
		var host = mount('<div style="margin-top: 200px; content-visibility: auto; contain: strict; height: 50px; transform: translateX(30px)"><span class="point" *layer style="position: fixed; top: 7px; left: 9px; width: 4px; height: 4px"></span></div>');
		var point = host.$Element().querySelector('.point');

		expect(await waitFor(function () {
			return point.matches(':popover-open');
		})).toBe(true);

		expect([Math.round(point.getBoundingClientRect().top), Math.round(point.getBoundingClientRect().left), point.classList.contains('elemenx-layer')]).toEqual([7, 9, true]);
	});

	it('*layer="Open" is a popover only while it is true, and a new value brings it on top of the others again, the focus kept', async function () {
		var host = mount('<div><div class="a" *layer="A" style="position: fixed; top: 0; left: 0; width: 40px; height: 40px"><button class="inside">a</button></div><div class="b" *layer="B" style="position: fixed; top: 0; left: 0; width: 40px; height: 40px">b</div></div>', {
			A: 0,
			B: 0
		});
		var a = host.$Element().querySelector('.a');
		var b = host.$Element().querySelector('.b');
		var top = function () {
			var node = document.elementFromPoint(20, 20);

			return node && node.closest('.a, .b') ? node.closest('.a, .b').className.split(' ')[0] : null;
		};

		await tick();

		expect([a.hasAttribute('popover'), b.hasAttribute('popover')]).toEqual([false, false]);

		host.A = 1;
		host.B = 2;

		await tick();

		expect([a.matches(':popover-open'), b.matches(':popover-open'), top()]).toEqual([true, true, 'b']);

		a.querySelector('.inside').focus();

		host.A = 3;

		await tick();

		expect(top()).toBe('a');
		expect(document.activeElement).toBe(a.querySelector('.inside'));

		host.A = 0;

		await tick();

		expect([a.hasAttribute('popover'), top()]).toEqual([false, 'b']);
	});

	it('*layer on a part of a *if is in the top layer at the end of the task that opened it, not a frame later', async function () {
		var host = mount('<div><div class="sheet" *if="Open" *layer style="position: fixed; inset: 0">sheet</div></div>', {
			Open: false
		});

		await tick();

		host.Open = true;

		await null;

		expect(host.$Element().querySelector('.sheet').matches(':popover-open')).toBe(true);
	});

	it('*itemcard follows its element when the page moves it without a scroll (a part above that renders later)', async function () {
		var host = mount('<div><div class="above" style="height: 10px"></div><span class="sword" tabindex="0" *itemcard="Sword" style="display: inline-block">Sword</span></div>', {
			Sword: {Name: 'Old sword', Rarity: 'rare', Stats: [{Label: 'Damage', Value: 12}]}
		});
		var sword;
		var card;

		await tick();

		sword = host.$Element().querySelector('.sword');

		sword.focus();

		card = await waitFor(function () {
			return Array.prototype.filter.call(document.querySelectorAll('.elemenx-game-inventory-card'), function (node) {
				return node.matches(':popover-open');
			})[0];
		});

		host.$Element().querySelector('.above').style.height = '120px';

		await frame();
		await frame();

		expect(Math.round(card.getBoundingClientRect().top)).toBe(Math.round(sword.getBoundingClientRect().top));
	});

	/* A bug: on a tablet the card a tap opened went along with the page as it scrolled, over everything it passed. */
	it('*itemcard opened by a finger closes when the page scrolls, one opened by the mouse follows its element', async function () {
		var host = mount('<div><span class="sword" tabindex="0" *itemcard="Sword">Sword</span></div>', {
			Sword: {Name: 'Old sword', Rarity: 'rare', Stats: [{Label: 'Damage', Value: 12}]}
		});
		var sword;
		var open = function () {
			return Array.prototype.filter.call(document.querySelectorAll('.elemenx-game-inventory-card'), function (node) {
				return node.matches(':popover-open');
			}).length;
		};

		await tick();

		sword = host.$Element().querySelector('.sword');

		sword.dispatchEvent(new PointerEvent('pointerdown', {pointerType: 'touch', bubbles: true}));
		sword.dispatchEvent(new MouseEvent('mouseenter'));

		expect(open()).toBe(1);

		window.dispatchEvent(new Event('scroll'));

		expect(open()).toBe(0);

		sword.dispatchEvent(new PointerEvent('pointerdown', {pointerType: 'mouse', bubbles: true}));
		sword.dispatchEvent(new MouseEvent('mouseenter'));
		window.dispatchEvent(new Event('scroll'));

		expect(open()).toBe(1);

		sword.dispatchEvent(new MouseEvent('mouseleave'));
	});
});

describe('Contract: infinite scroll, *infinite and InfiniteList, more of VirtualList and the history of Chat', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['*infinite', 'InfiniteList', 'VirtualList', 'Chat']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function rows (count, from) {
		return Array.from({length: count}, function (value, index) {
			return {ID: (from || 0) + index};
		});
	}

	it('*infinite asks once near the end, again when the list grew, never while Busy or Done, and at once when too short', async function () {
		var asked = [];
		var host = mount('<div class="list" style="height: 100px; overflow-y: auto" *infinite="{Margin: 30, Busy: Busy, Done: Done}" (more)="More"><div style="height: 20px" *for="row of Rows" *key="row.ID">{{row.ID}}</div></div>', {
			Rows: rows(10),
			Busy: false,
			Done: false,
			More: function (event) {
				asked.push(event.detail.Direction);
			}
		});
		var list;

		await frame();

		list = host.$Element().querySelector('.list') || host.$Element();

		/* 200 high in a box of 100: the end is 100 pixels away. */
		expect(asked).toEqual([]);

		list.scrollTop = 80;

		list.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toEqual(['down']);

		list.scrollTop = 90;

		list.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toEqual(['down']);

		/* Away from the end and back: it asks again; a list that grew and is still near its end too. */
		list.scrollTop = 0;

		list.dispatchEvent(new Event('scroll'));

		await frame();

		list.scrollTop = 100;

		list.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toEqual(['down', 'down']);

		host.Rows = host.Rows.concat(rows(1, 20));

		await frame();
		await frame();

		expect(asked).toEqual(['down', 'down', 'down']);

		asked.length = 0;

		asked.push('down');

		/* What came while it was busy is asked for again only when it is not. */
		host.Busy = true;
		host.Rows = host.Rows.concat(rows(2, 10));

		await frame();

		list.scrollTop = 1000;

		list.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toEqual(['down']);

		host.Busy = false;

		await frame();

		expect(asked).toEqual(['down', 'down']);

		/* Nothing came: it does not ask again by itself. */
		await frame();
		await frame();

		expect(asked).toHaveLength(2);

		host.Done = true;
		host.Rows = host.Rows.concat(rows(1, 12));

		await frame();

		expect(asked).toHaveLength(2);

		/* A list too short to scroll asks at once. */
		var short = [];

		mount('<div style="height: 100px; overflow-y: auto" *infinite (more)="More"><div style="height: 20px">one</div></div>', {
			More: function () {
				short.push(1);
			}
		});

		await frame();

		expect(short).toEqual([1]);
	});

	it('*infinite up asks at the start, and keeps what the reader sees when rows come above', async function () {
		var asked = 0;
		var host = mount('<div class="list" style="height: 100px; overflow-y: auto; overflow-anchor: none" *infinite="{Direction: \'up\', Margin: 30}" (more)="More"><div style="height: 20px" *for="row of Rows" *key="row.ID" [attribute.data-id]="row.ID">{{row.ID}}</div></div>', {
			Rows: rows(10, 100),
			More: function () {
				asked++;
			}
		});
		var list;
		var before;

		await frame();

		list = host.$Element().querySelector('.list') || host.$Element();
		list.scrollTop = 100;

		list.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toBe(0);

		list.scrollTop = 10;

		list.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toBe(1);

		before = list.querySelector('[data-id="100"]').getBoundingClientRect().top;

		host.Rows = rows(5, 95).concat(host.Rows);

		await frame();

		/* Five rows of 20 came above: the row that was in view is where it was (by itself: Safari keeps no anchor). */
		expect(list.scrollTop).toBe(110);
		expect(list.querySelector('[data-id="100"]').getBoundingClientRect().top).toBeCloseTo(before, 0);
	});

	it('InfiniteList shows a spinner while busy and a word at its end, and tells more; up its spinner takes no room', async function () {
		var asked = [];
		var host = mount('<InfiniteList Height="120" [busy]="Busy" [done]="Done" (more)="More"><div style="height: 30px" *for="row of Rows" *key="row.ID">{{row.ID}}</div></InfiniteList>', {
			Rows: rows(2),
			Busy: false,
			Done: false,
			More: function (detail) {
				asked.push(detail.Direction);
			}
		});
		var element;

		await frame();
		await frame();

		element = host.$Element().querySelector('.elemenx-infinite');

		expect(asked).toEqual(['down']);
		expect(element.getAttribute('role')).toBe('feed');
		expect(element.style.height).toBe('120px');

		host.Busy = true;

		await frame();

		expect(element.getAttribute('aria-busy')).toBe('true');
		expect(element.querySelector('.elemenx-infinite-status').textContent).toContain('Loading more');

		host.Busy = false;
		host.Done = true;

		await frame();

		expect(element.querySelector('.elemenx-infinite-status')).toBe(null);
		expect(element.querySelector('.elemenx-infinite-end').textContent).toContain('That is all');

		var up = mount('<InfiniteList Height="120" Direction="up" [busy]="true"><div style="height: 30px">a</div></InfiniteList>');

		await frame();

		expect(up.$Element().querySelector('.elemenx-infinite-above').getBoundingClientRect().height).toBe(0);
		expect(up.$Element().querySelector('.elemenx-infinite-above .elemenx-infinite-status')).toBeTruthy();
	});

	it('VirtualList asks for more when its last rows are drawn, once for each length; Chat asks for its history at its start', async function () {
		var asked = [];
		var host = mount('<VirtualList [items]="Items" ItemHeight="20" Height="100" Overscan="2" (more)="More" />', {
			Items: rows(50),
			More: function (detail) {
				asked.push(detail.Count);
			}
		});
		var viewport;

		await frame();

		viewport = host.$Element().querySelector('.elemenx-virtual-viewport');

		expect(asked).toEqual([]);

		viewport.scrollTop = 1000;

		viewport.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toEqual([50]);

		viewport.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toEqual([50]);

		host.Items = host.Items.concat(rows(20, 50));

		await frame();

		viewport.scrollTop = 2000;

		viewport.dispatchEvent(new Event('scroll'));

		await frame();

		expect(asked).toEqual([50, 70]);

		/* The page of the tests has no stylesheet of the library: the list of messages gets the height a page gives it. */
		document.head.appendChild(document.createElement('style')).textContent = '.elemenx-chat-messages { height: 200px; overflow-y: auto; }';

		var history = 0;
		var chat = mount('<div style="height: 300px; display: grid"><Chat [sidebarOpen]="false" (history)="Older"><div style="height: 40px" *for="row of Rows" *key="row.ID">{{row.ID}}</div></Chat></div>', {
			Rows: rows(30),
			Older: function () {
				history++;
			}
		});
		var messages;

		await frame();
		await frame();

		messages = chat.$Element().querySelector('.elemenx-chat-messages');

		/* It opens at its end, far from the first message. */
		expect(history).toBe(0);

		messages.scrollTop = 0;

		messages.dispatchEvent(new Event('scroll'));

		await frame();

		expect(history).toBe(1);
	});
});
