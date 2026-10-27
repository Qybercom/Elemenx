import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('ControlsHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

function key (target, name, options) {
	target.dispatchEvent(new KeyboardEvent('keydown', Object.assign({key: name, bubbles: true, cancelable: true}, options || {})));
}

/* Controls and cards not tested elsewhere: a knob, a dial pad, a ruler, a navigation tree, a mixer, the switch of the theme, the plans and the cards of social and commerce pages. */
describe('Contract: the controls and cards of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Knob', 'DialPad', 'Ruler', 'NavList', 'Mixer', 'ThemeSwitch', 'PlanPicker', 'PostCard', 'ProfileCard', 'CommentCard', 'ProductCard', 'EmptyState', 'Chronicle', 'service:Theme']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('Knob turns by its keys in Steps within Min and Max, tells input and change, and goes back to Default on a double click', async function () {
		var events = [];
		var host = mount('<div><Knob [value]="Value" Min="0" Max="10" Step="1" Default="5" (input)="Turned" (change)="Changed" /></div>', {
			Value: 9,
			Turned: function (value) {
				events.push('input ' + value);

				this.Value = value;
			},
			Changed: function (value) {
				events.push('change ' + value);
			}
		});
		var dial = host.$Element().querySelector('.elemenx-knob-dial');

		await tick();

		key(dial, 'ArrowUp');
		key(dial, 'ArrowUp');
		key(dial, 'Home');

		await tick();

		expect(host.Value).toBe(0);
		expect(dial.getAttribute('aria-valuenow')).toBe('0');

		dial.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		await tick();

		expect(host.Value).toBe(5);
		expect(events).toContain('input 10');
		expect(events).not.toContain('input 11');
		expect(events.filter(function (event) {
			return event.indexOf('change') === 0;
		}).length).toBeGreaterThan(0);
	});

	it('DialPad puts the keys pressed into the number, erases the last one, and calls with it', async function () {
		var events = [];
		var host = mount('<div><DialPad [value]="Value" ShowCall="true" (input)="Typed" (press)="Pressed" (call)="Called" /></div>', {
			Value: '',
			Typed: function (value) {
				this.Value = value;
			},
			Pressed: function (detail) {
				events.push('press ' + detail.Value);
			},
			Called: function (number) {
				events.push('call ' + number);
			}
		});
		var keys;

		await tick();

		keys = host.$Element().querySelectorAll('.elemenx-dial-pad-key');

		keys[0].click();
		keys[1].click();
		keys[10].click();

		await tick();

		expect(host.Value).toBe('120');

		host.$Element().querySelector('.elemenx-dial-pad-erase').click();

		await tick();

		expect(host.Value).toBe('12');

		host.$Element().querySelector('.elemenx-dial-pad-call').click();

		await tick();

		expect(events).toEqual(['press 1', 'press 2', 'press 0', 'call 12']);
	});

	it('Ruler labels its Major ticks from Start at its Scale, and a press pulls a guide out with the value under the pointer', async function () {
		var pulls = [];
		var host = mount('<div style="width: 400px"><Ruler Start="100" Step="10" Major="50" Scale="2" (pull)="Pulled" /></div>', {
			Pulled: function (detail) {
				pulls.push(detail.Value);
			}
		});
		var ruler = host.$Element().querySelector('.elemenx-ruler');
		var labels;
		var box;

		await tick();

		labels = Array.prototype.map.call(ruler.querySelectorAll('.elemenx-ruler-label'), function (node) {
			return Number(node.textContent);
		});

		expect(labels.slice(0, 3)).toEqual([100, 150, 200]);

		box = ruler.getBoundingClientRect();

		ruler.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, clientX: box.left + 60, clientY: box.top + 5}));

		await tick();

		expect(pulls).toEqual([130]);
	});

	it('NavList opens a group, selects an item with the keys, and its search opens the branches that match', async function () {
		var events = [];
		var host = mount('<div><NavList Searchable="true" [items]="Items" [value]="Value" (select)="Selected" (expand)="Expanded" /></div>', {
			Value: null,
			Items: [
				{ID: 'mail', Label: 'Mail', Items: [{ID: 'inbox', Label: 'Inbox'}, {ID: 'sent', Label: 'Sent'}]},
				{ID: 'calendar', Label: 'Calendar'}
			],
			Selected: function (item) {
				events.push('select ' + item.ID);

				this.Value = item.ID;
			},
			Expanded: function (ids) {
				events.push('expand ' + ids.join(','));
			}
		});
		var labels = function () {
			return Array.prototype.map.call(host.$Element().querySelectorAll('.elemenx-nav-row'), function (row) {
				return row.textContent.replace(/\s+/g, ' ').trim();
			});
		};
		var rows;

		await tick();

		expect(labels()).toEqual(['Mail', 'Calendar']);

		rows = host.$Element().querySelectorAll('.elemenx-nav-row');

		rows[0].focus();

		key(rows[0], 'ArrowRight');

		await tick();

		expect(labels()).toEqual(['Mail', 'Inbox', 'Sent', 'Calendar']);

		rows = host.$Element().querySelectorAll('.elemenx-nav-row');

		key(rows[0], 'ArrowDown');
		key(document.activeElement, 'Enter');

		await tick();

		expect(events).toEqual(['expand mail', 'select inbox']);

		key(host.$Element().querySelectorAll('.elemenx-nav-row')[0], 'ArrowLeft');

		await tick();

		host.$Element().querySelector('.elemenx-nav-search input').value = 'sen';

		host.$Element().querySelector('.elemenx-nav-search input').dispatchEvent(new InputEvent('input', {bubbles: true}));

		await tick();

		expect(labels()).toEqual(['Mail', 'Sent']);
	});

	it('Mixer keeps what its strips change in their channels, tells it, and dims the others while one is on Solo', async function () {
		var changes = [];
		var host = mount('<div><Mixer [channels]="Channels" (change)="Changed" /></div>', {
			Channels: [{ID: 'drums', Label: 'Drums', Volume: -6}, {ID: 'bass', Label: 'Bass', Volume: -3}],
			Changed: function (detail) {
				changes.push(detail.ID + ' ' + detail.Key + ' ' + detail.Value);
			}
		});
		var strips;
		var solo;

		await tick();

		strips = host.$Element().querySelectorAll('.elemenx-mixer-channel');
		solo = Array.prototype.filter.call(strips[0].querySelectorAll('button'), function (button) {
			return /^S$|solo/i.test(button.textContent.trim() + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.title || ''));
		})[0];

		solo.click();

		await tick();

		expect(changes).toEqual(['drums Solo true']);
		expect(host.$Element().querySelectorAll('.elemenx-mixer-channel')[1].classList.contains('silenced')).toBe(true);
	});

	it('ThemeSwitch shows the policy of the Theme Service and sets it', async function () {
		var theme = Elemenx.Service('Theme');
		var host = mount('<div><ThemeSwitch /></div>');
		var before = theme.Policy();
		var buttons;

		await tick();

		buttons = host.$Element().querySelectorAll('button');

		buttons[2].click();

		await tick();

		expect(theme.Policy()).toBe('dark');
		expect(buttons[2].getAttribute('aria-pressed')).toBe('true');

		buttons[1].click();

		await tick();

		expect(theme.Policy()).toBe('light');

		theme.Policy(before);
	});

	it('PlanPicker chooses a plan as a group of radios, tells it with its period, and switches the yearly prices', async function () {
		var events = [];
		var host = mount('<div><PlanPicker [plans]="Plans" [value]="Value" Periods="true" [period]="Period" (change)="Changed" (period)="Switched" /></div>', {
			Value: 'free',
			Period: 'month',
			Plans: [{ID: 'free', Name: 'Free', Price: 0}, {ID: 'pro', Name: 'Pro', Price: 10, YearlyPrice: 96}],
			Changed: function (detail) {
				events.push('change ' + detail.ID + ' ' + detail.Period);

				this.Value = detail.ID;
			},
			Switched: function (detail) {
				events.push('period ' + detail.Period);

				this.Period = detail.Period;
			}
		});
		var cards;

		await tick();

		cards = host.$Element().querySelectorAll('.elemenx-plan');

		key(cards[0], 'ArrowRight');

		await tick();

		expect(events).toEqual(['change pro month']);

		Array.prototype.filter.call(host.$Element().querySelectorAll('.elemenx-plans-period button, .elemenx-plans-period label, .elemenx-plans-period input'), function (node) {
			return /year/i.test(node.textContent + (node.value || ''));
		})[0].click();

		await tick();

		expect(events).toEqual(['change pro month', 'period year']);
	});

	it('the cards of posts, profiles, comments and products tell their buttons, and a comment makes buttons of its mentions and tags', async function () {
		var events = [];
		var record = function (name) {
			return function (detail) {
				events.push(name + ' ' + JSON.stringify(detail || {}));
			};
		};
		var host = mount('<div>' +
			'<PostCard Title="Hello" Likes="3" (like)="Liked" />' +
			'<ProfileCard Name="Ada" (follow)="Followed" />' +
			'<CommentCard Author="Ada" Text="Hi @grace see #elemenx" (mention)="Mentioned" (tag)="Tagged" />' +
			'<ProductCard Title="Lamp" Price="89" Cart="true" (add)="Added" />' +
			'<EmptyState Title="Nothing yet" Description="Add the first item." />' +
			'</div>', {
			Liked: record('like'),
			Followed: record('follow'),
			Mentioned: record('mention'),
			Tagged: record('tag'),
			Added: record('add')
		});
		var root;
		var press = function (selector, pattern) {
			Array.prototype.filter.call(root.querySelectorAll(selector + ' button'), function (button) {
				return pattern.test(button.textContent + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.title || ''));
			})[0].click();
		};

		await tick();

		root = host.$Element();

		press('.elemenx-post-card, .elemenx-post', /like/i);
		press('.elemenx-profile-card, .elemenx-profile', /follow/i);
		press('.elemenx-comment-card, .elemenx-comment', /@grace/);
		press('.elemenx-comment-card, .elemenx-comment', /#elemenx/);
		press('.elemenx-product-card, .elemenx-product', /cart|add/i);

		await tick();

		expect(events).toEqual(['like {"Liked":true,"Likes":4}', 'follow {"Following":true}', 'mention {"Handle":"grace"}', 'tag {"Tag":"elemenx"}', 'add {"Color":"","Size":""}']);
		expect(root.textContent).toContain('Add the first item.');
	});
});
