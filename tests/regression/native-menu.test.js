import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import menuItemSource from '../../libraries/ElemenxUI/components/MenuItem/MenuItem.js?raw';
import menuItemTemplate from '../../libraries/ElemenxUI/components/MenuItem/MenuItem.html?raw';
import nativeMenuSource from '../../libraries/ElemenxUI/components/NativeMenu/NativeMenu.js?raw';
import nativeMenuTemplate from '../../libraries/ElemenxUI/components/NativeMenu/NativeMenu.html?raw';
import panelSource from '../../libraries/ElemenxUI/components/NativeMenuPanel/NativeMenuPanel.js?raw';
import panelTemplate from '../../libraries/ElemenxUI/components/NativeMenuPanel/NativeMenuPanel.html?raw';

var calls;
var listeners;
var owned = [];

/* A component of the Library with its template inline: the page of the tests serves no Library. */
function define (source, name, template) {
	new Function(source.replace(/\$StyleURL: '[^']+',\n/, '').replace("$TemplateURL: '" + name + ".html'", function () {
		return '$Template: ' + JSON.stringify(template);
	}))();
}

/* A program that records the calls of the bridge and lets the test tell its events. */
function program () {
	calls = [];
	listeners = {};

	window.ElemenxNative = {
		Platform: 'electron',
		Features: ['menu', 'tray'],
		/* As the IPC of Electron: it clones what it sends. */
		Call: function (name, args, callback) {
			calls.push([name, structuredClone(args)]);

			callback(null, null);
		},
		On: function (name, callback) {
			(listeners[name] = listeners[name] || []).push(callback);

			return function () {};
		}
	};
}

function tell (name, value) {
	(listeners[name] || []).forEach(function (callback) {
		callback(value);
	});
}

function mount (definition) {
	var component = Elemenx.Component(unique('NativeMenuHost'), definition)();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

describe('Contract: NativeMenu, the menu of the system declared with MenuItem', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Menus.js');
		await import('../../libraries/ElemenxUI/services/Platform.js');
		await import('../../libraries/ElemenxUI/directives/Mount.js');

		define(menuItemSource, 'MenuItem', menuItemTemplate);
		define(nativeMenuSource, 'NativeMenu', nativeMenuTemplate);
		define(panelSource, 'NativeMenuPanel', panelTemplate);

		await import('../../libraries/ElemenxUI/services/Hotkeys.js');

		/* The MenuBar, as a stand-in that shows each menu with its items, and chooses the first item of a menu at a press. */
		Elemenx.Component('MenuBar', {$Template: '<div><button class="stub-menu" *for="top of Items" [attribute.data-index]="$index" (click)="Press">{{top.Label}}: {{top.Items.map(function (item) { return item.Separator ? \'-\' : item.Label + (item.Shortcut ? \' \' + item.Shortcut : \'\'); }).join(\', \')}}</button></div>', Items: [], Caret: false, Variant: '', Size: '', Press: function (event, node) {
			this.$Emit('select', this.Items[Number(node.getAttribute('data-index'))].Items.filter(function (item) {
				return !item.Separator && !item.Items;
			})[0]);
		}});
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();

		delete window.ElemenxNative;
	});

	it('gives the system the menu of its MenuItems with Look system, their shortcuts and roles, and tells a choice to its MenuItem', async function () {
		var host;
		var chosen = [];

		program();

		host = mount({
			$Template: '<div><NativeMenu Look="system" (select)="Chosen"><MenuItem Label="File"><MenuItem ID="note" [label]="Name" Shortcut="Mod+N" (select)="Noted" /><MenuItem Separator="true" /><MenuItem Label="Quit" Role="quit" /></MenuItem></NativeMenu></div>',
			Name: 'New note',
			Notes: 0,
			Chosen: function (item) {
				chosen.push(item.ID);
			},
			Noted: function () {
				this.Notes++;
			}
		});

		await tick(20);

		expect(calls[calls.length - 1]).toEqual(['menu', {Items: [{ID: 'm0', Label: 'File', Disabled: false, Items: [
			{ID: 'm0.0', Label: 'New note', Disabled: false, Hotkey: 'CommandOrControl+N'},
			{Separator: true},
			{ID: 'm0.2', Label: 'Quit', Disabled: false, Role: 'quit'}
		]}]}]);

		/* The system tells the item chosen: its MenuItem hears it, the NativeMenu too. */
		tell('menu', {ID: 'm0.0'});

		expect(host.Notes).toBe(1);
		expect(chosen).toEqual(['note']);

		/* The menu follows the template. */
		host.Name = 'Note';

		await tick(20);

		expect(calls[calls.length - 1][1].Items[0].Items[0].Label).toBe('Note');

		/* Gone, the menu of the program goes too. */
		owned.pop().$Destroy();

		expect(calls[calls.length - 1]).toEqual(['menu', {Items: null}]);
	});

	it('draws the menu of the window of a program with ElemenxUI by default: a bar, the menu of the system taken away, a role done by the system', async function () {
		var host;
		var hotkeys = Elemenx.Service('Hotkeys');

		program();

		host = mount({
			$Template: '<div><NativeMenu><MenuItem Label="Edit"><MenuItem Label="Copy" Role="copy" /><MenuItem Label="Reload" Role="reload" /></MenuItem></NativeMenu></div>'
		});

		await tick(20);

		/* The bar has the items of the system too, with their usual shortcuts; the system has no menu of its own. */
		expect(calls[0]).toEqual(['menu', {Items: null}]);
		expect(host.$Element().querySelector('.stub-menu').textContent).toBe('Edit: Copy ' + hotkeys.Format('Mod+C') + ', Reload ' + hotkeys.Format('Mod+R'));

		/* An item of a role, chosen: the system does it. */
		host.$Element().querySelector('.stub-menu').click();

		expect(calls[calls.length - 1]).toEqual(['role', {Role: 'copy'}]);

		/* Its usual shortcut, but for the roles of editing, which the page does at their keys. */
		document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'r', code: 'KeyR', ctrlKey: !hotkeys.Mac, metaKey: hotkeys.Mac, bubbles: true}));

		expect(calls[calls.length - 1]).toEqual(['role', {Role: 'reload'}]);
	});

	it('draws the menu of the tray of a program in a window of its own at the right button, a choice told to its MenuItem', async function () {
		var frame = document.createElement('iframe');
		var open = window.open;
		var host;
		var panel;

		program();

		document.body.appendChild(frame);

		window.open = function (url, name) {
			expect(name).toBe('elemenx-traypopup');

			return frame.contentWindow;
		};

		try {
			host = mount({
				$Template: '<div><NativeMenu Target="tray"><MenuItem ID="show" Label="Show" (select)="Shown" /><MenuItem Separator="true" /><MenuItem Label="More"><MenuItem ID="note" Label="New note" /></MenuItem></NativeMenu></div>',
				Count: 0,
				Shown: function () {
					this.Count++;
				}
			});

			await tick(60);

			panel = frame.contentDocument.querySelector('.elemenx-native-menu-panel');

			expect(Array.prototype.map.call(panel.querySelectorAll('.elemenx-option-label'), function (node) {
				return node.textContent;
			})).toEqual(['Show', 'More']);

			/* The window takes the size of its list. */
			expect(calls.filter(function (call) {
				return call[0] === 'traypopup' && call[1].Width;
			}).length).toBeGreaterThan(0);

			/* The window is see-through, the list has the look of a menu of the page. */
			expect(frame.contentDocument.body.classList.contains('transparent')).toBe(true);

			/* The pointer lights an item, as in a menu of the page; leaving the list puts it out. */
			panel.querySelectorAll('.elemenx-option')[1].dispatchEvent(new MouseEvent('mouseenter'));

			await tick(20);

			expect(panel.querySelectorAll('.elemenx-option.active').length).toBe(1);
			expect(panel.querySelector('.elemenx-option.active').textContent).toContain('More');

			panel.dispatchEvent(new MouseEvent('mouseleave'));

			await tick(20);

			expect(panel.querySelectorAll('.elemenx-option.active').length).toBe(0);

			/* The arrows light the items round the level, past the separator. */
			panel.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));
			panel.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));

			await tick(20);

			expect(panel.querySelector('.elemenx-option.active').textContent).toContain('More');

			/* A submenu opens in its place; a choice hides the window and reaches its MenuItem. */
			panel.querySelectorAll('.elemenx-option')[1].click();

			await tick(20);

			expect(panel.querySelector('.elemenx-menu-back').textContent).toBe('More');

			panel.querySelector('.elemenx-menu-back').click();

			await tick(20);

			panel.querySelectorAll('.elemenx-option')[0].click();

			expect(host.Count).toBe(1);
			expect(calls[calls.length - 1]).toEqual(['traypopup', {Show: false}]);
		}
		finally {
			window.open = open;

			frame.remove();
		}
	});

	it('is a bar of menus on the web, without the items of the system, its shortcuts hotkeys of the page', async function () {
		var host;
		var hotkeys;

		await import('../../libraries/ElemenxUI/services/Hotkeys.js');

		hotkeys = Elemenx.Service('Hotkeys');

		host = mount({
			$Template: '<div><NativeMenu><MenuItem Label="File"><MenuItem ID="note" Label="New note" Shortcut="Mod+N" (select)="Noted" /><MenuItem Separator="true" /><MenuItem Label="Quit" Role="quit" /></MenuItem><MenuItem Label="Edit"><MenuItem Label="Copy" Role="copy" /></MenuItem></NativeMenu></div>',
			Notes: 0,
			Noted: function () {
				this.Notes++;
			}
		});

		await tick(20);

		/* File keeps its own command, Edit (the system only) goes. */
		expect(Array.prototype.map.call(host.$Element().querySelectorAll('.stub-menu'), function (node) {
			return node.textContent;
		})).toEqual(['File: New note ' + hotkeys.Format('Mod+N')]);

		/* Its shortcut, a hotkey of the page. */
		document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'n', code: 'KeyN', ctrlKey: !hotkeys.Mac, metaKey: hotkeys.Mac, bubbles: true}));

		expect(host.Notes).toBe(1);

		/* Gone, its hotkeys go too. */
		owned.pop().$Destroy();

		document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'n', code: 'KeyN', ctrlKey: !hotkeys.Mac, metaKey: hotkeys.Mac, bubbles: true}));

		expect(host.Notes).toBe(1);
	});

	it('gives the icon in the tray its menu of the system with Look system, and hears the choices of that menu only', async function () {
		var host;

		program();

		host = mount({
			$Template: '<div><NativeMenu Target="tray" Look="system"><MenuItem ID="show" Label="Show" (select)="Shown" /></NativeMenu></div>',
			Count: 0,
			Shown: function () {
				this.Count++;
			}
		});

		await tick(20);

		expect(calls[calls.length - 1]).toEqual(['traymenu', {Items: [{ID: 'm0', Label: 'Show', Disabled: false}]}]);

		tell('tray', {ID: null, Kind: 'click'});
		tell('tray', {ID: 'm0', Kind: 'menu'});

		expect(host.Count).toBe(1);
	});
});
