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