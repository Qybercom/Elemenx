import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var components = [];
var messaging = [];

describe('Regression: final public API contract edges', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();

		components = [];
		messaging = [];

		Elemenx.Storage.Cookie.Clear({Path: '/'});
	});

	afterEach(function () {
		while (components.length) components.pop().$Destroy();

		while (messaging.length) messaging.pop().Destroy();

		Elemenx.Storage.Cookie.Clear({Path: '/'});
	});

	it('Component Generation and Parent expose live component identity and hierarchy', async function () {
		var childName = unique('FinalAPIChild');
		var parentName = unique('FinalAPIParent');
		var childComponent = null;

		Elemenx.Component(childName, {
			$Template: '<b class="final-api-child">child</b>',
			$OnCreate: function () { childComponent = this; }
		});

		var Parent = Elemenx.Component(parentName, {$Template: '<section><' + childName + '></' + childName + '></section>'});
		var parent = Parent();

		components.push(parent);

		document.getElementById('mount').appendChild(parent.$Element());

		await tick();

		expect(typeof parent.$Generation()).toBe('number');
		expect(parent.$Generation()).toBeGreaterThanOrEqual(0);
		expect(parent.$Parent()).toBeNull();
		expect(childComponent).not.toBeNull();
		expect(childComponent.$Parent()).toBe(parent);
		expect(childComponent.$Element()).toBe(parent.$Element().querySelector('.final-api-child'));
	});

	it('Messaging Deliver injects only subscribed channels and preserves source/data', function () {
		var socket = Elemenx.Messaging();
		var channel = unique('final-api-deliver');
		var received = [];

		messaging.push(socket);

		socket.On(channel, function (event) { received.push(event); });

		socket.Deliver('external-source', channel, {Value: 7});
		socket.Deliver('external-source', channel + '-other', {Value: 9});

		expect(received.length).toBe(1);
		expect(received[0].Channel).toBe(channel);
		expect(received[0].Source).toBe('external-source');
		expect(received[0].Data).toEqual({Value: 7});
	});

	it('Storage Cookie stringifies values, preserves namespaces and removal isolation', function () {
		var root = Elemenx.Storage.Cookie;
		var a = root.Namespace(unique('cookie-a'));
		var b = root.Namespace(unique('cookie-b'));

		a.Set('value', {Text: 'hello world', Number: 7}, {Path: '/'});
		b.Set('value', 'other', {Path: '/'});

		expect(a.Has('value')).toBe(true);
		expect(a.Get('value')).toBe('[object Object]');
		expect(b.Get('value')).toBe('other');

		a.Remove('value', {Path: '/'});

		expect(a.Get('value')).toBeNull();
		expect(b.Get('value')).toBe('other');

		b.Clear({Path: '/'});

		expect(b.Has('value')).toBe(false);
	});

	it('TransferReceiver reconstructs chunks, acknowledges them and emits Complete Blob', async function () {
		var sent = [];
		var transport = {
			On: function () { return this; },
			Off: function () { return this; },
			Send: function (packet) {
				sent.push(packet);

				return true;
			}
		};
		var receiver = Elemenx.Network.TransferReceiver({Transport: transport});
		var complete = null;

		receiver.On('Transfer.Complete', function (event) { complete = event.Data; });

		receiver.Receive({Type: 'Transfer', Action: 'Start', ID: 'rx1', Name: 'x.txt', Mime: 'text/plain', Size: 5});
		receiver.Receive({Type: 'Transfer', Action: 'Chunk', ID: 'rx1', Index: 0, Data: new TextEncoder().encode('he')});
		receiver.Receive({Type: 'Transfer', Action: 'Chunk', ID: 'rx1', Index: 1, Data: new TextEncoder().encode('llo')});
		receiver.Receive({Type: 'Transfer', Action: 'End', ID: 'rx1', Chunks: 2});

		expect(sent.map(function (packet) { return packet.Action; })).toEqual(['Ack', 'Ack', 'Complete']);
		expect(complete.Name).toBe('x.txt');
		expect(complete.Size).toBe(5);
		expect(await complete.Blob.text()).toBe('hello');

		receiver.Destroy();
	});

	it('TransferReceiver reports missing chunks instead of completing corrupted input', function () {
		var receiver = Elemenx.Network.TransferReceiver();
		var error = null;
		var complete = false;

		receiver.On('Transfer.Error', function (event) { error = event.Data.Error; });
		receiver.On('Transfer.Complete', function () { complete = true; });
		receiver.Receive({Type: 'Transfer', Action: 'Start', ID: 'rx2', Name: 'bad.bin', Mime: 'application/octet-stream', Size: 2});
		receiver.Receive({Type: 'Transfer', Action: 'Chunk', ID: 'rx2', Index: 0, Data: new Uint8Array([1])});
		receiver.Receive({Type: 'Transfer', Action: 'End', ID: 'rx2', Chunks: 2});

		expect(error).toBeInstanceOf(Error);
		expect(complete).toBe(false);

		receiver.Destroy();
	});
});