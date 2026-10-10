import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

var owned = [];

/* Runs dispatch and returns the messages of the listener exceptions it reported (listeners are isolated like in the DOM). */
function reported (dispatch) {
	var messages = [];
	var consoleError = console.error;

	function capture (event) {
		messages.push(event.error.message);

		event.preventDefault();
	}

	/* the Vitest browser runner echoes window errors to console.error once a test listens for them */
	console.error = function () {};

	window.addEventListener('error', capture);

	try {
		dispatch();
	}
	finally {
		window.removeEventListener('error', capture);

		console.error = consoleError;
	}

	return messages;
}

describe('Regression: Events contracts', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().Destroy();
	});

	it('Event.Is validates its Pipe descriptors and requires a handler', function () {
		var noUse = unique('NoUsePipe');
		var channel = unique('PipeChannel');
		var sender = Elemenx.Events();
		var receiver = Elemenx.Events();
		var descriptors = [
			['Debouncer'],
			[{Debouncer: 1, Throttler: 1}],
			[{NeverRegisteredPipe: true}],
			[{}]
		];
		var current;

		Elemenx.Pipe(noUse, function () {
			return {};
		});

		descriptors[3][0][noUse] = true;

		owned.push(sender, receiver);

		receiver.On(channel, function (event) {
			if (current === 'no handler') event.Is(channel, [{Debouncer: 1}]);
			else event.Is(channel, current, function () {});
		});

		var messages = reported(function () {
			descriptors.forEach(function (value) {
				current = value;

				sender.Emit(channel, 1);
			});

			current = 'no handler';

			sender.Emit(channel, 2);
		});

		expect(messages).toEqual([
			'Elemenx Pipe descriptor must be an object',
			'Elemenx Pipe descriptor must contain exactly one Pipe',
			'Elemenx Pipe is not registered: NeverRegisteredPipe',
			'Elemenx Pipe must provide Use(value, pass)',
			'Elemenx Event.Is pipeline requires a handler'
		]);
	});

	it('a single Pipe descriptor does not need an array', function () {
		var pipe = unique('EveryOtherPipe');
		var channel = unique('SingleDescriptor');
		var sender = Elemenx.Events();
		var receiver = Elemenx.Events();
		var seen = [];
		var count = 0;
		var descriptor = {};

		Elemenx.Pipe(pipe, function () {
			return {
				Use: function (event, pass) {
					count++;

					if (count % 2 === 0)
						pass(event);
				}
			};
		});

		descriptor[pipe] = true;

		owned.push(sender, receiver);

		receiver.On(channel, function (event) {
			event.Is(channel, descriptor, function (matched) {
				seen.push(matched.Data);
			});
		});

		sender.Emit(channel, 1);
		sender.Emit(channel, 2);

		expect(seen).toEqual([2]);
	});

	it('On requires a function, and a destroyed socket refuses further use', function () {
		var socket = Elemenx.Events();

		expect(function () {
			socket.On('channel', 'not a function');
		}).toThrow('Elemenx Events.On callback must be a function');

		socket.Destroy();

		expect(function () {
			socket.On('channel', function () {});
		}).toThrow('Elemenx Events Socket is destroyed');
		expect(function () {
			socket.Emit('channel', 1);
		}).toThrow('Elemenx Events Socket is destroyed');
	});

	it('a Component $Events declaration accepts only channel names', function () {
		var factory = Elemenx.Component(unique('EventsChannels'), {
			$Template: '<div>events</div>',
			$Events: ['valid', 1],
			$OnEvent: function () {}
		});

		expect(function () {
			factory();
		}).toThrow('Elemenx $Events expects channel names as strings');
	});
});
