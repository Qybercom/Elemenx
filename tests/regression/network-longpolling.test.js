import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var NativeXHR;

function FakeXHR () {
	this.Listeners = {};
	this.readyState = 0;
	this.status = 200;
	this.statusText = 'OK';
	this.responseText = '';
	this.Headers = [];

	FakeXHR.Instances.push(this);
}
FakeXHR.Instances = [];
FakeXHR.prototype.addEventListener = function (name, callback) {
	if (!this.Listeners[name])
		this.Listeners[name] = [];

	this.Listeners[name].push(callback);
};
FakeXHR.prototype.Emit = function (name, event) {
	var list = this.Listeners[name] || [];
	var i = 0;
	while (i < list.length) {
		list[i](event || {});

		i++;
	}
};
FakeXHR.prototype.open = function (method, url, async) {
	this.Method = method;
	this.URL = url;
	this.Async = async;
};
FakeXHR.prototype.setRequestHeader = function (name, value) {
	this.Headers.push([name, value]);
};
FakeXHR.prototype.send = function (body) { this.Body = body; };
FakeXHR.prototype.abort = function () { this.Emit('abort', {}); };
FakeXHR.prototype.HeadersCopy = function () { return this.Headers.slice(); };
FakeXHR.prototype.Respond = function (body) {
	this.responseText = body;
	this.readyState = 2;

	this.Emit('readystatechange', {});
	this.Emit('load', {});
};
FakeXHR.prototype.Fail = function () { this.Emit('error', {}); };
FakeXHR.prototype.Timeout = function () { this.Emit('timeout', {}); };

describe('Regression: Network LongPolling', function () {
	beforeAll(async function () {
		await loadElemenx();

		NativeXHR = window.XMLHttpRequest;
	});

	beforeEach(function () {
		resetDOM();

		FakeXHR.Instances = [];
		window.XMLHttpRequest = FakeXHR;
	});

	afterEach(function () { window.XMLHttpRequest = NativeXHR; });

	it('Connect starts polling immediately and successful responses continue the poll loop', function () {
		var types = [];
		var values = [];
		var lp = Elemenx.Network.LongPolling({Method: 'POST', URL: '/poll', Data: 'request', Headers: {'X-Test': ['a', 'b']}});

		lp.On('Transport', function (event) { types.push(event.Type); });
		lp.On('Transport.Data', function (event) { values.push(event.Data.Data); });
		lp.Connect().Connect();

		expect(FakeXHR.Instances.length).toBe(1);

		var first = FakeXHR.Instances[0];

		expect(first.Method).toBe('POST');
		expect(first.URL).toBe('/poll');
		expect(first.Body).toBe('request');
		expect(first.HeadersCopy()).toEqual([['X-Test', 'a'], ['X-Test', 'b']]);
		expect(types).toEqual(['BeforeConnect', 'Open', 'BeforeRequest']);

		first.Respond('one');

		expect(values).toEqual(['one']);
		expect(types).toEqual(['BeforeConnect', 'Open', 'BeforeRequest', 'BeforeResponse', 'Data', 'AfterResponse', 'BeforeRequest']);
		expect(FakeXHR.Instances.length).toBe(2);

		lp.Close();
	});

	it('Protocol encodes request data and decodes every poll response', function () {
		var name = unique('LPProtocol');
		var packets = [];

		Elemenx.Network.Protocol(name, {
			Encode: function (value) { return JSON.stringify(value); },
			Decode: function (value) { return {Type: 'Packet', Data: JSON.parse(value)}; }
		});

		var lp = Elemenx.Network.LongPolling({URL: '/poll', Data: {hello: 'world'}, Protocol: name});

		lp.On('Protocol.Packet', function (event) { packets.push(event.Data); });
		lp.Connect();

		var first = FakeXHR.Instances[0];

		expect(first.Body).toBe('{"hello":"world"}');

		first.Respond('{"value":7}');

		expect(packets).toEqual([{value: 7}]);

		lp.Close();
	});

	it('Error and Timeout retry after configured delay without duplicating active requests', async function () {
		var types = [];
		var lp = Elemenx.Network.LongPolling({URL: '/poll', Retry: 1});

		lp.On('Transport', function (event) { types.push(event.Type); });
		lp.Connect();

		FakeXHR.Instances[0].Fail();

		expect(types).toContain('Error');

		await tick(10);

		expect(FakeXHR.Instances.length).toBe(2);

		FakeXHR.Instances[1].Timeout();

		expect(types).toContain('Timeout');

		await tick(10);

		expect(FakeXHR.Instances.length).toBe(3);

		lp.Close();
	});

	it('Close aborts the current request, cancels retries and permits reconnect', async function () {
		var types = [];
		var lp = Elemenx.Network.LongPolling({URL: '/poll', Retry: 1});

		lp.On('Transport', function (event) { types.push(event.Type); });
		lp.Connect();

		var first = FakeXHR.Instances[0];

		expect(lp.XHR()).toBe(first);

		lp.Close();

		expect(lp.XHR()).toBeNull();
		expect(types).toEqual(['BeforeConnect', 'Open', 'BeforeRequest', 'BeforeClose', 'Close']);

		first.Respond('stale');

		await tick(5);

		expect(FakeXHR.Instances.length).toBe(1);

		lp.Connect();

		expect(FakeXHR.Instances.length).toBe(2);

		lp.Close();
	});
	it('owner Destroy closes active polling, cancels retry and ignores stale completion', async function () {
		var name = unique('LPOwner');
		var data = [];

		Elemenx.Component(name, {$Template: '<div></div>'});

		var component = Elemenx.Component(name)();
		var lp = component.$Network().LongPolling({URL: '/poll', Retry: 1});

		lp.On('Transport.Data', function (event) { data.push(event.Data.Data); });
		lp.Connect();

		var request = FakeXHR.Instances[0];

		component.$Destroy();

		request.Respond('stale');

		await tick(10);

		expect(data).toEqual([]);
		expect(FakeXHR.Instances.length).toBe(1);
	});
});