import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import bridgeSource from '../../tools/android-library/bridge.js?raw';

/* The door the ElemenxView of an Android program gives the page, as a stand-in that records the calls. */
function door (features, handled) {
	var calls = [];

	window.ElemenxAndroid = {
		features: function () {
			return JSON.stringify(features);
		},
		can: function (name) {
			return handled.indexOf(name) !== -1;
		},
		call: function (id, name, args) {
			calls.push([id, name, JSON.parse(args)]);
		}
	};

	new Function(bridgeSource)();

	return calls;
}

describe('Contract: the bridge of an Android program of its own (elemenx build --native android-library)', function () {
	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Native.js');
	});

	afterEach(function () {
		delete window.ElemenxNative;
		delete window.ElemenxAndroid;
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
		window.ElemenxNative.Reply('2', 'No name', null);
		window.ElemenxNative.Reply('1', null, 'Hello, Ada');
		window.ElemenxNative.Reply('1', null, 'Again');

		expect(answers).toEqual([['No name', null], [null, 'Hello, Ada']]);

		stop = window.ElemenxNative.On('server', function (value) {
			heard.push(value);
		});

		window.ElemenxNative.Emit('server', {State: 'running'});

		stop();

		window.ElemenxNative.Emit('server', {State: 'stopped'});

		expect(heard).toEqual([{State: 'running'}]);
	});

	it('is what the Native Service asks: its handlers in the program, the rest as on the web', function () {
		var calls = door(['dialogs'], ['message']);
		var native = Elemenx.Service('Native');
		var result = null;

		expect([native.Available(), native.Platform(), native.Has('dialogs'), native.Has('tray')]).toEqual([true, 'android', true, false]);

		native.Message({Title: 'Hi', Text: 'From the page'}, function (error, value) {
			result = [error, value];
		});

		expect(calls[0].slice(1)).toEqual(['message', {Title: 'Hi', Text: 'From the page'}]);

		window.ElemenxNative.Reply(calls[0][0], null, 0);

		expect(result).toEqual([null, 0]);

		/* No handler of title in the program: the Service does it as on the web. */
		native.Title('From Android');

		expect(document.title).toBe('From Android');
		expect(calls.length).toBe(1);
	});
});
