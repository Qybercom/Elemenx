import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

/*
 * Listeners are isolated like DOM event listeners: an exception thrown by one listener is reported as an
 * uncaught error, the next listeners still run, and the code that dispatched the event is not interrupted.
 */

var reported = [];

function capture (event) {
	if (event.error && /^listener broke/.test(event.error.message)) {
		reported.push(event.error.message);

		event.preventDefault();
	}
}

function breaking (label) {
	return function () {
		throw new Error('listener broke: ' + label);
	};
}

function expectIsolated (label, dispatch, received) {
	var thrown = null;

	try {
		dispatch();
	}
	catch (error) {
		thrown = error;
	}

	expect(thrown).toBeNull();
	expect(received.length).toBe(1);

	return waitFor(function () {
		return reported.indexOf('listener broke: ' + label) !== -1;
	}).then(function (found) {
		expect(found).toBeTruthy();
	});
}

describe('Regression: listener isolation', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();

		reported = [];

		window.addEventListener('error', capture);
	});

	afterEach(function () {
		window.removeEventListener('error', capture);
	});

	it('Elemenx.Events', async function () {
		var socket = Elemenx.Events();
		var received = [];

		socket.On('isolation', breaking('events'));
		socket.On('isolation', function (event) {
			received.push(event.Data);
		});

		await expectIsolated('events', function () {
			socket.Emit('isolation', 1);
		}, received);

		socket.Destroy();
	});

	it('Elemenx.Messaging', async function () {
		var socket = Elemenx.Messaging();
		var channel = unique('isolation');
		var received = [];

		socket.On(channel, breaking('messaging'));
		socket.On(channel, function (message) {
			received.push(message.Data);
		});

		await expectIsolated('messaging', function () {
			socket.Deliver('external', channel, 1);
		}, received);

		socket.Destroy();
	});

	it('Network transports', async function () {
		var transfer = Elemenx.Network.Transfer({Transport: {}, Data: new ArrayBuffer(1)});
		var received = [];

		transfer.On('Transfer.Error', breaking('network'));
		transfer.On('Transfer.Error', function (event) {
			received.push(event.Data);
		});

		await expectIsolated('network', function () {
			transfer.Execute();
		}, received);
	});

	it('Component events', async function () {
		var name = unique('IsolationComponent');
		var received = [];

		Elemenx.Component(name, {$Template: '<main></main>'});

		var component = Elemenx.Component(name)();

		component.$On('isolation', breaking('component'));
		component.$On('isolation', function (data) {
			received.push(data);
		});

		await expectIsolated('component', function () {
			component.$Emit('isolation', 1);
		}, received);

		component.$Destroy();
	});

	it('Router events', async function () {
		var root = unique('IsolationRoot');
		var page = unique('IsolationPage');
		var received = [];

		Elemenx.Component(root, {$Template: '<main *outlet="Content"></main>'});
		Elemenx.Component(page, {$Template: '<div id="isolation-page">page</div>'});

		var application = Elemenx.Application(unique('IsolationApplication'), {$Component: root, $Mount: '#mount'});
		var router = Elemenx.Router({Root: application.$Component(), Routes: [{Path: '/isolation', Component: page}]});

		router.On('NavigationStart', breaking('router'));
		router.On('NavigationStart', function (data) {
			received.push(data);
		});
		router.Start();

		await expectIsolated('router', function () {
			router.Go('/isolation');
		}, received);

		await tick(30);

		expect(document.getElementById('isolation-page')).not.toBeNull();

		router.Destroy();

		application.$Destroy();
	});

	it('Storage operations', async function () {
		var operation = Elemenx.Storage.IndexedDB(unique('isolation-db'), {Version: 1, Stores: {items: {}}}).Store('items').Put('a', 1);
		var received = [];

		operation.On('Success', breaking('storage'));
		operation.On('Success', function (event) {
			received.push(event.Type);
		});

		operation.Execute();

		await waitFor(function () {
			return received.length;
		});

		expect(received).toEqual(['Success']);

		await waitFor(function () {
			return reported.indexOf('listener broke: storage') !== -1;
		});

		expect(reported).toContain('listener broke: storage');
	});
});
