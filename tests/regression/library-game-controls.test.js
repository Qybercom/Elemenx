import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (template, state) {
	var component = Elemenx.Component(unique('GameControlsHost'), Object.assign({$Template: '<div>' + template + '</div>'}, state))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(20);

	return component;
}

function key (target, name) {
	target.dispatchEvent(new KeyboardEvent('keydown', {key: name, bubbles: true, cancelable: true}));
}

describe('Contract: the controls of a game made of Button and Tabs, and the keys of a list (ElemenxHelpers.Rove)', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['GameMenu', 'GameDialogue', 'GameTabs', 'Button', 'Tabs', 'Icon', 'service:ElemenxHelpers']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('Rove moves the focus by the arrows round a list, to its ends by Home and End, and lets other keys be', async function () {
		var helpers = Elemenx.Service('ElemenxHelpers');
		var host = await mount('<button class="one">1</button><button class="one">2</button><button class="one">3</button>', {});
		var list = host.$Element().querySelectorAll('.one');
		var event = function (target, name) {
			return {key: name, target: target, preventDefault: function () {
				this.Prevented = true;
			}};
		};
		var press;

		list[0].focus();

		expect(helpers.Rove(event(list[0], 'ArrowDown'), list)).toBe(list[1]);
		expect(document.activeElement).toBe(list[1]);
		expect(helpers.Rove(event(list[2], 'ArrowDown'), list)).toBe(list[0]);
		expect(helpers.Rove(event(list[2], 'ArrowDown'), list, {Wrap: false})).toBe(null);
		expect(helpers.Rove(event(list[0], 'ArrowUp'), list)).toBe(list[2]);
		expect(helpers.Rove(event(list[1], 'End'), list)).toBe(list[2]);
		expect(helpers.Rove(event(list[1], 'Home'), list)).toBe(list[0]);
		expect(helpers.Rove(event(list[0], 'ArrowRight'), list, {Orientation: 'horizontal'})).toBe(list[1]);

		press = event(list[0], 'a');

		expect(helpers.Rove(press, list)).toBe(null);
		expect(press.Prevented).toBeUndefined();
	});

	it('numbers the tabs of Tabs when it is told', async function () {
		var host = await mount('<Tabs [Tabs]="Tabs" Value="b" Numbered="true" /><Tabs [Tabs]="Tabs" Value="a" />', {Tabs: [{ID: 'a', Label: 'Gear'}, {ID: 'b', Label: 'Skills'}]});
		var all = host.$Element().querySelectorAll('.elemenx-tabs');

		expect(Array.prototype.map.call(all[0].querySelectorAll('.elemenx-tab-number'), function (node) {
			return node.textContent;
		})).toEqual(['01', '02']);
		expect(all[1].querySelector('.elemenx-tab-number')).toBe(null);
	});

	/* Its items were bare buttons of the page: Buttons of ElemenxUI now, in the look of the menu of the theme. */
	it('GameMenu: its items are Buttons, the arrows go round them, a press tells select and Escape back', async function () {
		var told = [];
		var host = await mount('<GameMenu Title="Paused" AutoFocus="false" [items]="Items" (select)="Picked" (back)="Back" />', {Items: [{ID: 'go', Label: 'Continue', Hint: 'Enter'}, {ID: 'off', Label: 'Off', Disabled: true}, {ID: 'quit', Label: 'Quit'}], Picked: function (data) {
			told.push(data.ID);
		}, Back: function () {
			told.push('back');
		}});
		var items = host.$Element().querySelectorAll('.elemenx-game-menu-item');

		expect(items.length).toBe(3);
		expect(Array.prototype.every.call(items, function (node) {
			return node.classList.contains('elemenx-button') && node.tagName === 'BUTTON';
		})).toBe(true);
		expect(items[1].disabled).toBe(true);

		items[0].focus();

		key(items[0], 'ArrowDown');

		/* The one that is off is passed over. */
		expect(document.activeElement).toBe(items[2]);

		key(items[2], 'ArrowDown');

		expect(document.activeElement).toBe(items[0]);

		items[2].click();
		items[1].click();

		key(items[0], 'Escape');

		expect(told).toEqual(['quit', 'back']);
	});

	it('GameDialogue: its choices and its next are Buttons that tell choose and next', async function () {
		var told = [];
		var host = await mount('<GameDialogue Speaker="Smith" Text="Hi" Speed="0" [choices]="Choices" (choose)="Chose" /><GameDialogue Speaker="Smith" Text="Bye" Speed="0" [choices]="[]" (next)="Next" />', {Choices: [{ID: 'yes', Text: 'Yes'}, {ID: 'no', Text: 'No', Disabled: true}], Chose: function (data) {
			told.push(data.ID);
		}, Next: function () {
			told.push('next');
		}});
		var choices = host.$Element().querySelectorAll('.elemenx-game-dialogue-choice');
		var next = host.$Element().querySelector('.elemenx-game-dialogue-next');

		expect(choices[0].classList.contains('elemenx-button')).toBe(true);
		expect(choices[0].textContent).toContain('Yes');
		expect(next.classList.contains('elemenx-button')).toBe(true);

		choices[0].click();
		choices[1].click();
		next.click();

		expect(told).toEqual(['yes', 'next']);
	});

	/* Its own tabs were bare buttons with keys of their own: Tabs of ElemenxUI now, numbered, in the look of the game. */
	it('GameTabs: Tabs of ElemenxUI, numbered, that open another by a press or the arrows and tell change', async function () {
		var told = [];
		var host = await mount('<GameTabs [items]="Items" Value="a" (change)="Changed" />', {Items: [{ID: 'a', Label: 'Service'}, {ID: 'b', Label: 'Awards'}, {ID: 'c', Label: 'Map', Disabled: true}], Changed: function (id) {
			told.push(id);
		}});
		var game = host.$Element().querySelector('.elemenx-game-tabs');
		var tabs = game.querySelectorAll('.elemenx-tabs [role="tab"]');

		expect(game.classList.contains('vertical')).toBe(true);
		expect(tabs[0].textContent).toMatch(/01\s*Service/);
		expect(tabs[0].getAttribute('aria-selected')).toBe('true');
		expect(tabs[0].getAttribute('title')).toBe('Service');

		tabs[1].click();

		await tick();

		expect(told).toEqual(['b']);

		tabs = game.querySelectorAll('.elemenx-tabs [role="tab"]');

		tabs[1].focus();

		key(tabs[1], 'ArrowDown');

		await tick();

		/* The one that is off is passed over: round to the first. */
		expect(told).toEqual(['b', 'a']);
	});
});
