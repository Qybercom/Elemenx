import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Events', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('delivers local events synchronously and preserves object identity', function () {
		var channel = unique('event');
		var value = {Value: 1};
		var received = null;
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) { received = event; });
		sender.Emit(channel, value);
		expect(received.Data).toBe(value);
		expect(received.Channel).toBe(channel);
		expect(received.Source).toBe(sender);
		expect(received.Is(channel)).toBe(true);
		expect(received.Is(channel + '-other')).toBe(false);
		receiver.Destroy();
		sender.Destroy();
	});

	it('supports declarative Component $Events and one $OnEvent dispatcher', function () {
		var channel = unique('component-event');
		var name = unique('EventsComponent');
		var seen = [];
		Elemenx.Component(name, {
			$Template: '<div></div>',
			$Events: [channel],
			$OnEvent: function (event) {
				event.Is(channel, function (matched) { seen.push(matched.Data); });
			}
		});
		var component = Elemenx.Component(name)();
		var sender = Elemenx.Events();
		sender.Emit(channel, 'A');
		expect(seen).toEqual(['A']);
		component.$Destroy();
		sender.Emit(channel, 'B');
		expect(seen).toEqual(['A']);
		expect(function () { component.$Events(); }).toThrow();
		sender.Destroy();
	});

	it('supports declarative Service $Events with owner cleanup', function () {
		var channel = unique('service-event');
		var name = unique('EventsService');
		var seen = [];
		Elemenx.Service(name, {
			$Events: channel,
			$OnEvent: function (event) { seen.push(event.Data); },
			Ready: function () { return true; }
		});
		var service = Elemenx.Service(name);
		expect(service.Ready()).toBe(true);
		var sender = Elemenx.Events();
		sender.Emit(channel, 1);
		expect(seen).toEqual([1]);
		service.$Destroy();
		sender.Emit(channel, 2);
		expect(seen).toEqual([1]);
		sender.Destroy();
	});

	it('keeps independent Is handlers on the same event independent', function () {
		var channel = unique('is-event');
		var calls = [];
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) {
			event.Is(channel, function () { calls.push('first'); });
			event.Is(channel, function () { calls.push('second'); });
		});
		sender.Emit(channel, true);
		expect(calls).toEqual(['first', 'second']);
		receiver.Destroy();
		sender.Destroy();
	});
});
// Pipes are intentionally tested through Event.Is: their state belongs to a stable delivery rule,
// not to an individual Event object.
describe('Regression: Event Pipes', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('keeps Debouncer state across Event.Is deliveries', function () {
		var channel = unique('debouncer');
		var seen = [];
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) {
			event.Is(channel, [{Debouncer: 3}], function (matched) { seen.push(matched.Data); });
		});
		sender.Emit(channel, 'A');
		sender.Emit(channel, 'A');
		expect(seen).toEqual([]);
		sender.Emit(channel, 'A');
		expect(seen).toEqual(['A']);
		sender.Emit(channel, 'A');
		sender.Emit(channel, 'A');
		expect(seen).toEqual(['A']);
		sender.Emit(channel, 'B');
		sender.Emit(channel, 'B');
		expect(seen).toEqual(['A']);
		sender.Emit(channel, 'B');
		expect(seen).toEqual(['A', 'B']);
		receiver.Destroy();
		sender.Destroy();
	});

	it('resets Debouncer candidate when an unconfirmed value changes', function () {
		var channel = unique('debouncer-reset');
		var seen = [];
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) {
			event.Is(channel, [{Debouncer: 3}], function (matched) { seen.push(matched.Data); });
		});
		sender.Emit(channel, 'A');
		sender.Emit(channel, 'A');
		sender.Emit(channel, 'B');
		sender.Emit(channel, 'B');
		expect(seen).toEqual([]);
		sender.Emit(channel, 'B');
		expect(seen).toEqual(['B']);
		receiver.Destroy();
		sender.Destroy();
	});

	it('keeps multiple Is pipelines on one channel independent', function () {
		var channel = unique('independent-pipes');
		var first = [];
		var second = [];
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) {
			event.Is(channel, [{Debouncer: 2}], function (matched) { first.push(matched.Data); });
			event.Is(channel, [{Debouncer: 3}], function (matched) { second.push(matched.Data); });
		});
		sender.Emit(channel, 0);
		sender.Emit(channel, 0);
		sender.Emit(channel, 0);
		expect(first).toEqual([0]);
		expect(second).toEqual([0]);
		sender.Emit(channel, 1);
		sender.Emit(channel, 1);
		expect(first).toEqual([0, 1]);
		expect(second).toEqual([0]);
		sender.Emit(channel, 1);
		expect(first).toEqual([0, 1]);
		expect(second).toEqual([0, 1]);
		receiver.Destroy();
		sender.Destroy();
	});

	it('Filter emits the dominant value from each sample window', function () {
		var channel = unique('filter');
		var seen = [];
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) {
			event.Is(channel, [{Filter: 5}], function (matched) { seen.push(matched.Data); });
		});
		sender.Emit(channel, 'A');
		sender.Emit(channel, 'B');
		sender.Emit(channel, 'A');
		sender.Emit(channel, 'A');
		sender.Emit(channel, 'B');
		expect(seen).toEqual(['A']);
		receiver.Destroy();
		sender.Destroy();
	});

	it('Gate passes only after a true condition remains asserted for its timeout', async function () {
		var channel = unique('gate');
		var seen = [];
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) {
			event.Is(channel, [{Gate: 30}], function (matched) { seen.push(matched.Data); });
		});
		sender.Emit(channel, true);
		await new Promise(function (resolve) { setTimeout(resolve, 10); });
		sender.Emit(channel, false);
		await new Promise(function (resolve) { setTimeout(resolve, 30); });
		expect(seen).toEqual([]);
		sender.Emit(channel, true);
		await new Promise(function (resolve) { setTimeout(resolve, 40); });
		expect(seen).toEqual([true]);
		receiver.Destroy();
		sender.Destroy();
	});

	it('supports custom Pipes and destroys persistent instances with the Events socket', function () {
		var channel = unique('custom-pipe');
		var created = 0;
		var destroyed = 0;
		var seen = [];
		var pipeName = unique('EverySecond');
		Elemenx.Pipe(pipeName, function () {
			created++;
			var count = 0;
			return {
				Use: function (event, pass) {
					count++;
					if (count % 2 === 0) pass(event);
				},
				Destroy: function () { destroyed++; }
			};
		});
		var receiver = Elemenx.Events();
		var sender = Elemenx.Events();
		receiver.On(channel, function (event) {
			var descriptor = {};
			descriptor[pipeName] = true;
			event.Is(channel, [descriptor], function (matched) { seen.push(matched.Data); });
		});
		sender.Emit(channel, 1);
		sender.Emit(channel, 2);
		sender.Emit(channel, 3);
		sender.Emit(channel, 4);
		expect(created).toBe(1);
		expect(seen).toEqual([2, 4]);
		receiver.Destroy();
		expect(destroyed).toBe(1);
		sender.Destroy();
	});
});