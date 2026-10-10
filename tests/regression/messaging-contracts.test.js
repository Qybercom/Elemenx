import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

var owned = [];

describe('Regression: Messaging contracts', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().Destroy();
	});

	it('Off removes a listener of the own channel, one channel listener or a whole channel', function () {
		var socket = Elemenx.Messaging().ID(unique('MessagingOff'));
		var channel = unique('MessagingChannel');
		var received = [];
		var own = function (message) {
			received.push(['own', message.Data]);
		};
		var first = function (message) {
			received.push(['first', message.Data]);
		};
		var second = function (message) {
			received.push(['second', message.Data]);
		};

		owned.push(socket);

		socket.On(own).On(channel, first).On(channel, second);

		expect(socket.Off(own)).toBe(socket);
		expect(socket.Off(channel, first)).toBe(socket);

		socket.Deliver('test', socket.ID(), 1);
		socket.Deliver('test', channel, 2);

		expect(received).toEqual([['second', 2]]);

		expect(socket.Off(channel)).toBe(socket);
		expect(socket.Off(unique('MessagingUnknown'), first)).toBe(socket);

		socket.Deliver('test', channel, 3);

		expect(received).toEqual([['second', 2]]);
	});

	it('Message.Is accepts a handler without pipes, and a pipeline needs a handler', function () {
		var socket = Elemenx.Messaging();
		var channel = unique('MessagingIs');
		var seen = [];
		var thrown = null;

		owned.push(socket);

		socket.On(channel, function (message) {
			message.Is(channel, function (matched) {
				seen.push(matched.Data);
			});

			try {
				message.Is(channel, [{Debouncer: 1}]);
			}
			catch (error) {
				thrown = error.message;
			}
		});

		socket.Deliver('test', channel, 'value');

		expect(seen).toEqual(['value']);
		expect(thrown).toBe('Elemenx Message.Is pipeline requires a handler');
	});

	it('Messaging Contexts report a missing context and a dependency cycle', function () {
		var a = unique('MessagingCycleA');
		var b = unique('MessagingCycleB');

		Elemenx.Messaging.Context(a, {Contexts: b});
		Elemenx.Messaging.Context(b, {Contexts: a});

		expect(function () {
			Elemenx.Messaging(unique('MessagingMissing'));
		}).toThrow('Elemenx Messaging Context not found: MessagingMissing');
		expect(function () {
			Elemenx.Messaging(a);
		}).toThrow('Elemenx Messaging Context cycle: ' + a);
	});

	it('Messaging.Window and a Component $Messaging declaration validate their arguments', function () {
		expect(function () {
			Elemenx.Messaging.Window('#no-such-frame');
		}).toThrow('Elemenx Messaging Window expects a Window, iframe or selector');
		expect(function () {
			Elemenx.Messaging.Window({});
		}).toThrow('Elemenx Messaging Window expects a Window, iframe or selector');

		var factory = Elemenx.Component(unique('MessagingDeclaration'), {
			$Template: '<div>messaging</div>',
			$Messaging: 42
		});

		expect(function () {
			factory();
		}).toThrow('Elemenx $Messaging expects an ID string, Channels array or configuration object');

		var declared = unique('DeclaredID');
		var received = [];
		var sender = Elemenx.Messaging();
		var identified = Elemenx.Component(unique('MessagingIdentified'), {
			$Template: '<div>messaging</div>',
			$Messaging: {ID: declared, Channels: []},
			$OnMessage: function (message) {
				received.push(message.Data);
			}
		})();

		owned.push(sender);

		sender.Send(declared, 'to the declared ID');

		expect(received).toEqual(['to the declared ID']);

		identified.$Destroy();
	});
});
