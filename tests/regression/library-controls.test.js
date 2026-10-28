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

		Use(['Knob', 'DialPad', 'Ruler', 'NavList', 'Mixer', 'ThemeSwitch', 'PlanPicker', 'PostCard', 'ProfileCard', 'CommentCard', 'ProductCard', 'EmptyState', 'Chronicle', 'Toggle', 'service:Theme']);
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

	it('Toggle takes Values of its own: two for a switch, three for three positions, given back by change and to a form', async function () {
		var changes = [];
		var host = mount('<form><Toggle Label="Mode" Name="mode" [values]="[\'light\', \'dark\']" [value]="Mode" (change)="Moded" /><Toggle Name="level" Values="low,mid,high" [value]="Level" (change)="Leveled" /><Toggle [values]="[0, 5, 10]" [value]="Speed" (change)="Sped" /></form>', {
			Mode: 'dark',
			Level: 'nothing',
			Speed: 10,
			Moded: function (value) {
				changes.push(value);

				this.Mode = value;
			},
			Leveled: function (value) {
				changes.push(value);

				this.Level = value;
			},
			Sped: function (value) {
				changes.push(value);

				this.Speed = value;
			}
		});
		var toggles;
		var mode;
		var level;
		var speed;

		await tick();

		toggles = host.$Element().querySelectorAll('.elemenx-toggle');
		mode = toggles[0];
		level = toggles[1].querySelector('[role="slider"]');
		speed = toggles[2].querySelector('[role="slider"]');

		/* Two values: on is the second one, the form gets its text, change gives the value. */
		expect(mode.querySelector('input[type="checkbox"]').checked).toBe(true);
		expect(mode.querySelector('input[type="checkbox"]').getAttribute('name')).toBe(null);
		expect(mode.querySelector('input[type="hidden"]').value).toBe('dark');

		mode.querySelector('input[type="checkbox"]').click();

		await tick();

		expect(changes).toEqual(['light']);
		expect(host.Mode).toBe('light');
		expect(mode.querySelector('input[type="hidden"]').value).toBe('light');

		/* Three values (three positions without States): a value that is none of them stands in the middle. */
		expect(level.getAttribute('aria-valuenow')).toBe('1');

		key(level, 'Home');

		await tick();

		expect(changes[1]).toBe('low');
		expect(toggles[1].querySelector('input[type="hidden"]').value).toBe('low');

		/* Values of any kind: the numbers come back as numbers. */
		expect(speed.getAttribute('aria-valuenow')).toBe('2');

		key(speed, 'ArrowLeft');

		await tick();

		expect(changes[2]).toBe(5);
		expect(host.Speed).toBe(5);
	});

	it('Toggle stands vertical with on at the top, and with States 3 goes from false to null to true by its keys, a press on its text and on its track', async function () {
		var changes = [];
		var host = mount('<form><Toggle Orientation="vertical" Label="Light" [checked]="Light" (change)="Lit" /><Toggle States="3" Label="Sync" Name="sync" [value]="Sync" ShowLabels="true" (change)="Synced" /><Toggle States="3" Orientation="vertical" Labels="Low,Mid,High" [value]="Level" (change)="Leveled" /></form>', {
			Light: false,
			Sync: false,
			Level: true,
			Lit: function (value) {
				this.Light = value;
			},
			Synced: function (value) {
				changes.push(value);

				this.Sync = value;
			},
			Leveled: function (value) {
				changes.push('level ' + value);

				this.Level = value;
			}
		});
		var toggles;
		var light;
		var sync;
		var level;
		var thumb;
		var box;

		await tick();

		toggles = host.$Element().querySelectorAll('.elemenx-toggle');
		light = toggles[0];
		sync = toggles[1].querySelector('[role="slider"]');
		level = toggles[2].querySelector('[role="slider"]');

		/* Vertical: the track stands, and on moves the thumb up. */
		expect(light.classList.contains('vertical')).toBe(true);
		expect(light.querySelector('.elemenx-toggle-track').offsetHeight).toBeGreaterThan(light.querySelector('.elemenx-toggle-track').offsetWidth);

		thumb = light.querySelector('.elemenx-toggle-thumb').getBoundingClientRect().top;

		light.querySelector('input').click();

		await tick(250);

		expect(host.Light).toBe(true);
		expect(light.querySelector('.elemenx-toggle-thumb').getBoundingClientRect().top).toBeLessThan(thumb);

		/* Three positions: a slider of 0 to 2, named by the language of the page, its value in the form. */
		expect([sync.getAttribute('aria-valuenow'), sync.getAttribute('aria-valuetext'), sync.getAttribute('aria-label')]).toEqual(['0', 'Off', 'Sync']);
		expect(toggles[1].querySelector('input[type="hidden"]').value).toBe('false');
		expect(Array.prototype.map.call(toggles[1].querySelectorAll('.elemenx-toggle-name'), function (node) {
			return node.textContent + (node.classList.contains('current') ? '*' : '');
		})).toEqual(['Off*', 'Auto', 'On']);

		key(sync, 'ArrowRight');

		await tick();

		expect([sync.getAttribute('aria-valuenow'), sync.getAttribute('aria-valuetext'), toggles[1].querySelector('input[type="hidden"]').value]).toEqual(['1', 'Auto', 'null']);

		key(sync, 'End');
		key(sync, 'End');
		key(sync, ' ');

		await tick();

		/* The text cycles to the next position; the track takes the one under the pointer. */
		toggles[1].querySelector('.elemenx-check-label').click();

		await tick();

		box = sync.getBoundingClientRect();

		sync.dispatchEvent(new MouseEvent('click', {bubbles: true, clientX: box.right - 2, clientY: box.top + box.height / 2}));

		await tick();

		/* Vertical: the bottom is off, ArrowDown goes down; Labels name the positions. */
		expect(level.getAttribute('aria-valuetext')).toBe('High');

		key(level, 'ArrowDown');

		box = level.getBoundingClientRect();

		level.dispatchEvent(new MouseEvent('click', {bubbles: true, clientX: box.left + box.width / 2, clientY: box.bottom - 2}));

		await tick();

		expect(changes).toEqual([null, true, false, null, true, 'level null', 'level false']);
		expect(level.getAttribute('aria-orientation')).toBe('vertical');
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
