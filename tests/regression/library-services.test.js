import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, tick, waitFor } from '../setup.js';
import { Use } from '../library.js';

function service (name) {
	return Elemenx.Service(name);
}

/* The Services of ElemenxUI that had no test of their own: their contracts, as their heads describe them. */
describe('Contract: the Services of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Format', 'service:Countries', 'service:Currencies', 'service:Badges', 'service:Formulas', 'service:GameItems', 'service:Dialogs', 'service:Idle', 'service:Permissions', 'service:Panels', 'service:Gamepad', 'service:ElemenxHelpers']);
	});

	afterEach(function () {
		service('Idle').Stop();
	});

	it('Format: counts in short, dates, the parts of a date badge, the time from now, and nothing of an invalid date', function () {
		var format = service('Format');
		var now = new Date(2026, 9, 27, 12, 0, 0);

		format.Locale = 'en';

		expect(format.Count(12400)).toBe('12.4K');
		expect(format.Count(950)).toBe('950');
		expect(format.Date('2026-10-27T10:00:00', 'long')).toBe('October 27, 2026');
		expect(format.Day(new Date(2026, 9, 27))).toEqual({Day: '27', Month: 'Oct'});
		expect(format.Relative(new Date(now.getTime() - 5 * 60000), now)).toBe('5 minutes ago');
		expect(format.Relative(new Date(now.getTime() + 2 * 86400000), now)).toBe('in 2 days');
		expect(format.Date('not a date')).toBe('');
		expect(format.Day(null)).toEqual({Day: '', Month: ''});
		expect(format.Money(1234.5, 'USD')).toBe('$1,234.50');

		format.Locale = '';
	});

	it('ElemenxHelpers: the text of a body without its indentation, the first day of a week, and listeners that throw apart', function () {
		var helpers = service('ElemenxHelpers');
		var node = document.createElement('pre');
		var listeners = helpers.Listeners();
		var heard = [];
		var errors = [];
		var reported = window.reportError;
		var first;

		node.textContent = '\n\t\t\tline one\n\t\t\t\tindented\n\n\t\t\tline three\n\t\t';

		expect(helpers.BodyText(node)).toBe('line one\n\tindented\n\nline three');
		expect([helpers.FirstDay(null), helpers.FirstDay(''), helpers.FirstDay(0), helpers.FirstDay('6'), helpers.FirstDay(7)]).toEqual([1, 1, 0, 6, 0]);
		expect([0, 1, 6]).toContain(helpers.FirstDay('locale', 'en-US'));

		window.reportError = function (error) {
			errors.push(error.message);
		};

		try {
			first = listeners.On(function (value) {
				heard.push('first ' + value);

				throw new Error('broken listener');
			});

			listeners.On(first);
			listeners.On(function (value, other) {
				heard.push('second ' + value + ' ' + other);
			});
			listeners.Tell(1, 2);

			expect(heard).toEqual(['first 1', 'second 1 2']);
			expect(errors).toEqual(['broken listener']);
			expect(listeners.Count()).toBe(2);

			listeners.Off(first);
			listeners.Tell(3, 4);

			expect(heard).toEqual(['first 1', 'second 1 2', 'second 3 4']);

			listeners.Clear();

			expect(listeners.Count()).toBe(0);
		}
		finally {
			window.reportError = reported;
		}
	});

	it('Countries: finds a country, and the country of an international number by the longest code, then the preferred one', function () {
		var countries = service('Countries');

		expect(countries.Find('GB', 'en')).toMatchObject({Code: 'GB', Name: 'United Kingdom', Dial: '44', Currency: 'GBP'});
		expect(countries.Match('79991234567').Code).toBe('RU');
		expect(countries.Match('77011234567', 'KZ').Code).toBe('KZ');
		expect(countries.Match('12025550123').Code).toBe('US');
		expect(countries.Match('447911123456', 'US').Code).toBe('GB');
		expect(countries.Match('')).toBe(null);
		expect(countries.List('en').length).toBeGreaterThan(200);
	});

	it('Currencies: lists the ISO 4217 currencies with their names and digits, and formats an amount', function () {
		var currencies = service('Currencies');

		expect(currencies.Find('JPY', 'en')).toMatchObject({Code: 'JPY', Digits: 0});
		expect(currencies.Find('EUR', 'en')).toMatchObject({Code: 'EUR', Name: 'Euro', Symbol: '€', Digits: 2});
		expect(currencies.Format(1234.5, 'EUR', 'en')).toBe('€1,234.50');
		expect(currencies.List('en').map(function (currency) {
			return currency.Code;
		})).toEqual(expect.arrayContaining(['USD', 'EUR', 'RUB', 'GBP']));
	});

	it('Badges: a count (none at 0, 99+ past Max), a dot, a busy ring and a text, with their tones and labels', function () {
		var badges = service('Badges');

		expect(badges.Describe(0)).toMatchObject({Shown: false, Kind: 'count'});
		expect(badges.Describe(7)).toEqual({Shown: true, Kind: 'count', Tone: 'danger', Text: '7', Label: ''});
		expect(badges.Describe(150).Text).toBe('99+');
		expect(badges.Describe({Value: 12, Max: 9, Tone: 'info'})).toMatchObject({Text: '9+', Tone: 'info'});
		expect(badges.Describe('dot')).toMatchObject({Shown: true, Kind: 'dot', Tone: 'accent', Text: '', Label: 'New'});
		expect(badges.Describe('busy')).toMatchObject({Kind: 'busy', Label: 'In progress'});
		expect(badges.Describe('Beta')).toMatchObject({Kind: 'text', Text: 'Beta', Tone: 'accent'});
		expect(badges.Describe('')).toMatchObject({Shown: false});
	});

	it('Formulas: LaTeX as MathML, a fraction, a root, powers and indices, a display formula, and an error for what it cannot read', function () {
		var formulas = service('Formulas');
		var inline = formulas.MathML('\\frac{a}{b} + \\sqrt{x^2 + y_1}');
		var display = formulas.MathML('\\sum_{i=1}^{n} i', true);

		expect(inline).toMatch(/^<math\b/);
		expect(inline).toContain('<mfrac>');
		expect(inline).toContain('<msqrt>');
		expect(inline).toContain('<msup>');
		expect(inline).toContain('<msub>');
		expect(display).toContain('display="block"');
		expect(display).toContain('<munderover>');
		expect(formulas.MathML('\\frac{a}')).toContain('<merror>');
	});

	it('GameItems: piles join up to their Stack and the rest goes back, other items swap, and an item is used up', function () {
		var items = service('GameItems');
		var arrows = {ID: 'arrow', Count: 30, Stack: 50};
		var quiver = {ID: 'arrow', Count: 40, Stack: 50};
		var moved = items.Move(arrows, quiver);

		expect(items.Stacks(quiver, arrows)).toBe(true);
		expect(moved.To).toEqual({ID: 'arrow', Count: 50, Stack: 50});
		expect(moved.From).toEqual({ID: 'arrow', Count: 20, Stack: 50});
		expect(arrows.Count).toBe(30);
		expect(items.Move({ID: 'sword', Count: 1}, {ID: 'shield', Count: 1})).toEqual({To: {ID: 'sword', Count: 1}, From: {ID: 'shield', Count: 1}});
		expect(items.Move({ID: 'sword', Count: 1}, null)).toEqual({To: {ID: 'sword', Count: 1}, From: null});
		expect(items.Take({ID: 'potion', Count: 2})).toEqual({ID: 'potion', Count: 1});
		expect(items.Take({ID: 'potion', Count: 1})).toBe(null);
	});

	it('Dialogs: a confirmation and an alert in the list, closed with the action pressed or with none', function () {
		var dialogs = service('Dialogs');
		var lists = [];
		var answers = [];
		var listener = dialogs.OnChange(function (items) {
			lists.push(items.length);
		});
		var confirm = dialogs.Confirm({Title: 'Delete?', Variant: 'danger'}, function (action) {
			answers.push(action);
		});
		var alert = dialogs.Alert('Saved', function (action) {
			answers.push(action);
		});

		expect(dialogs.Find(confirm).Actions.map(function (action) {
			return action.ID + ':' + action.Variant;
		})).toEqual(['cancel:secondary', 'ok:danger']);
		expect(dialogs.Find(alert)).toMatchObject({Message: 'Saved', Dismissible: true});

		dialogs.Close(confirm, 'ok');
		dialogs.Close(alert);
		dialogs.Close('dialog-none', 'ok');
		dialogs.OffChange(listener);

		expect(answers).toEqual(['ok', null]);
		expect(lists).toEqual([1, 2, 1, 0]);
	});

	it('Idle: warns before the timeout, goes idle, and comes back active at the next activity', async function () {
		var idle = service('Idle');
		var calls = [];

		idle.Start({Timeout: 300, Warning: 150, StorageKey: 'elemenx-idle-test', OnWarn: function () {
			calls.push('warn');
		}, OnIdle: function () {
			calls.push('idle');
		}, OnActive: function () {
			calls.push('active');
		}});

		expect(idle.State()).toBe('active');
		expect(idle.Remaining()).toBeGreaterThan(200);
		expect(await waitFor(function () {
			return idle.State() === 'warning';
		}, 1000)).toBe(true);
		expect(await waitFor(function () {
			return idle.State() === 'idle';
		}, 1000)).toBe(true);

		document.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true}));

		await tick(20);

		expect(idle.State()).toBe('active');
		expect(calls).toEqual(['warn', 'idle', 'active']);

		idle.Stop();

		expect(idle.State()).toBe('stopped');
	});

	it('Permissions: a name the browser does not know is unsupported', async function () {
		var permissions = service('Permissions');
		var state = await new Promise(function (resolve) {
			permissions.Query('telepathy', function (error, value) {
				resolve(value);
			});
		});

		expect(state).toBe('unsupported');
	});

	it('Panels: reads the panels of a root but not those of a nested owner, their data-* attributes, and hears them change', async function () {
		var panels = service('Panels');
		var root = document.createElement('div');
		var calls = 0;
		var stop;

		root.innerHTML = '<i class="panel" data-id="a" data-key-tip="A"></i><div class="owner"><i class="panel" data-id="nested"></i></div><i class="panel" data-id="b"></i>';

		document.body.appendChild(root);

		expect(panels.Read(root, '.panel', '.owner').map(function (panel) {
			return panels.Data(panel);
		})).toEqual([{Id: 'a', KeyTip: 'A'}, {Id: 'b'}]);

		stop = panels.Watch(root, '.panel', function () {
			calls++;
		});

		root.querySelector('[data-id="b"]').setAttribute('data-label', 'B');

		root.appendChild(document.createElement('i')).className = 'panel';

		expect(await waitFor(function () {
			return calls > 0;
		})).toBe(true);

		stop();

		root.remove();
	});

	it('Gamepad: names the buttons of each kind of pad, and lists no pad while none is pressed', function () {
		var gamepad = service('Gamepad');

		expect(gamepad.Label('a', 'xbox')).toBe('A');
		expect(gamepad.Label('a', 'playstation')).toBe('✕');
		expect(gamepad.Label('start', 'playstation')).toBe('Options');
		expect(gamepad.Label('b7', 'generic')).toBe('B7');
		expect(gamepad.Pads()).toEqual([]);
	});
});
