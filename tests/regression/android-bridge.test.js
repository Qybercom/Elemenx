import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import bridgeSource from '../../tools/android-library/bridge.js?raw';

/*
 * The door the ElemenxView of an Android program gives the frames of the Application (a listener of messages), as a
 * stand-in that records the calls, and what it puts in the page before it (ElemenxAndroidState).
 */
function door (features, handled) {
	var calls = [];

	window.ElemenxAndroidState = {Features: features, Handlers: handled};
	window.ElemenxAndroid = {
		onmessage: null,
		postMessage: function (text) {
			var message = JSON.parse(text);

			if (message.Type === 'call') calls.push([message.ID, message.Name, message.Args]);
			else calls.push([message.Type]);
		}
	};

	new Function(bridgeSource)();

	calls.splice(0, 1);

	return calls;
}

/* A message of the program to the page, as the view posts it. */
function told (message) {
	window.ElemenxAndroid.onmessage({data: JSON.stringify(message)});
}

describe('Contract: the bridge of an Android program of its own (elemenx build --native android-library)', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Platform/Platform.js');
	});

	afterEach(function () {
		delete window.ElemenxNative;
		delete window.ElemenxAndroid;
		delete window.ElemenxAndroidState;
	});

	it('gives the page window.ElemenxNative over the door of the view: calls, their answers and the events of the program', function () {
		var calls = door(['dialogs'], ['greet']);
		var answers = [];
		var heard = [];
		var stop;

		expect([window.ElemenxNative.Platform, window.ElemenxNative.Features, window.ElemenxNative.Can('greet'), window.ElemenxNative.Can('open')]).toEqual(['android', ['dialogs'], true, false]);

		window.ElemenxNative.Call('greet', {Name: 'Ada'}, function (error, value) {
			answers.push([error, value]);
		});
		window.ElemenxNative.Call('greet', undefined, function (error) {
			answers.push([error.message, null]);
		});

		expect(calls).toEqual([['1', 'greet', {Name: 'Ada'}], ['2', 'greet', {}]]);

		/* The answers of the program by their ID, in any order; an ID answered once. */
		told({Type: 'reply', ID: '2', Error: 'No name', Value: null});
		told({Type: 'reply', ID: '1', Error: null, Value: 'Hello, Ada'});
		told({Type: 'reply', ID: '1', Error: null, Value: 'Again'});

		expect(answers).toEqual([['No name', null], [null, 'Hello, Ada']]);

		stop = window.ElemenxNative.On('server', function (value) {
			heard.push(value);
		});

		told({Type: 'event', Name: 'server', Value: {State: 'running'}});

		stop();

		told({Type: 'event', Name: 'server', Value: {State: 'stopped'}});

		expect(heard).toEqual([{State: 'running'}]);
	});

	/*
	 * Regression: the door was a JavaScript interface in every frame, one of another origin too (an advert in the page
	 * called the handlers of the program). It is a listener of messages for the origin of the Application alone: the
	 * bridge opens it (hello), its features and handlers come before the page and again as the program registers more.
	 */
	it('opens the door with a hello, takes the features and handlers the program registers later, and is none without a door', function () {
		var opened = [];

		window.ElemenxAndroidState = {Features: [], Handlers: []};
		window.ElemenxAndroid = {
			onmessage: null,
			postMessage: function (text) {
				opened.push(JSON.parse(text));
			}
		};

		new Function(bridgeSource)();

		expect(opened).toEqual([{Type: 'hello'}]);
		expect(window.ElemenxNative.Can('scan')).toBe(false);

		told({Type: 'state', State: {Features: ['dialogs'], Handlers: ['scan']}});

		expect(window.ElemenxNative.Can('scan')).toBe(true);
		expect(window.ElemenxNative.Features).toEqual(['dialogs']);
		expect(Elemenx.Service('Platform').Has('dialogs')).toBe(true);

		delete window.ElemenxNative;
		window.ElemenxAndroid = {features: function () {
			return '[]';
		}};

		new Function(bridgeSource)();

		expect(window.ElemenxNative).toBeUndefined();
	});

	it('is what the Platform Service asks: its handlers in the program, the rest as on the web', function () {
		var calls = door(['dialogs'], ['message']);
		var native = Elemenx.Service('Platform');
		var result = null;

		expect([native.Available(), native.Platform(), native.Has('dialogs'), native.Has('tray')]).toEqual([true, 'android', true, false]);

		native.Message({Title: 'Hi', Text: 'From the page'}, function (error, value) {
			result = [error, value];
		});

		expect(calls[0].slice(1)).toEqual(['message', {Title: 'Hi', Text: 'From the page'}]);

		told({Type: 'reply', ID: calls[0][0], Error: null, Value: 0});

		expect(result).toEqual([null, 0]);

		/* No handler of title in the program: the Service does it as on the web. */
		native.Title('From Android');

		expect(document.title).toBe('From Android');
		expect(calls.length).toBe(1);
	});
});
