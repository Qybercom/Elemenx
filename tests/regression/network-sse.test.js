import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

var NativeEventSource;

function FakeEventSource (url, options) {
	this.url=url;
	this.withCredentials=options && options.withCredentials === true;
	this.readyState=0;
	this.Listeners={};
	this.Closed=false;
	FakeEventSource.Instances.push(this);
}

FakeEventSource.CONNECTING=0;
FakeEventSource.OPEN=1;
FakeEventSource.CLOSED=2;
FakeEventSource.Instances=[];

FakeEventSource.prototype.addEventListener=function (name,callback) {
	if (!this.Listeners[name]) this.Listeners[name]=[];
	this.Listeners[name].push(callback);
};

FakeEventSource.prototype.Emit=function (name,event) {
	var list=this.Listeners[name] || [];
	var i=0;
	while (i<list.length) {
		list[i](event || {});
		i++;
	}
};

FakeEventSource.prototype.Open=function () {
	this.readyState=FakeEventSource.OPEN;
	this.Emit('open',{});
};

FakeEventSource.prototype.Message=function (data,lastEventId,origin) {
	this.Emit('message',{
		data:data,
		lastEventId:lastEventId || '',
		origin:origin || 'http://example.test'
	});
};

FakeEventSource.prototype.Error=function () {
	this.Emit('error',{});
};

FakeEventSource.prototype.close=function () {
	this.Closed=true;
	this.readyState=FakeEventSource.CLOSED;
};

describe('Regression: Network SSE', function () {
	beforeAll(async function () {
		await loadElemenx();
		NativeEventSource=window.EventSource;
	});
	beforeEach(function () {
		resetDOM();
		FakeEventSource.Instances=[];
		window.EventSource=FakeEventSource;
	});
	afterEach(function () {
		window.EventSource=NativeEventSource;
	});

	it('Connect is coalesced and applies URL / WithCredentials to EventSource', function () {
		var types=[];
		var sse=Elemenx.Network.SSE({
			URL:'/events',
			WithCredentials:true
		});
		sse.On('Transport',function (event) { types.push(event.Type); });
		sse.Connect().Connect();

		expect(FakeEventSource.Instances.length).toBe(1);
		var source=FakeEventSource.Instances[0];
		expect(source.url).toBe('/events');
		expect(source.withCredentials).toBe(true);
		expect(types).toEqual(['BeforeConnect']);
		expect(sse.Source()).toBe(source);

		source.Open();
		expect(types).toEqual(['BeforeConnect','Open']);
	});

	it('Data exposes SSE metadata and Protocol decodes message payloads', function () {
		var name=unique('SSEProtocol');
		var packets=[];
		var data=[];
		Elemenx.Network.Protocol(name,{
			Decode:function (value) {
				return {Type:'Packet',Data:JSON.parse(value)};
			}
		});
		var sse=Elemenx.Network.SSE({URL:'/events',Protocol:name});
		sse.On('Transport.Data',function (event) { data.push(event.Data); });
		sse.On('Protocol.Packet',function (event) { packets.push(event.Data); });
		sse.Connect();
		var source=FakeEventSource.Instances[0];
		source.Open();
		source.Message('{"value":7}','event-42','http://origin.test');

		expect(data.length).toBe(1);
		expect(data[0].Data).toBe('{"value":7}');
		expect(data[0].LastEventID).toBe('event-42');
		expect(data[0].Origin).toBe('http://origin.test');
		expect(data[0].Source).toBe(source);
		expect(packets).toEqual([{value:7}]);
	});

	it('Error reports current readyState without implicitly closing the source', function () {
		var errors=[];
		var sse=Elemenx.Network.SSE({URL:'/events'});
		sse.On('Transport.Error',function (event) { errors.push(event.Data); });
		sse.Connect();
		var source=FakeEventSource.Instances[0];
		source.readyState=FakeEventSource.CONNECTING;
		source.Error();

		expect(errors.length).toBe(1);
		expect(errors[0].ReadyState).toBe(FakeEventSource.CONNECTING);
		expect(errors[0].Source).toBe(source);
		expect(sse.Source()).toBe(source);
		expect(source.Closed).toBe(false);
	});

	it('Close emits BeforeClose / Close, clears Source and permits reconnect', function () {
		var types=[];
		var sse=Elemenx.Network.SSE({URL:'/events'});
		sse.On('Transport',function (event) { types.push(event.Type); });
		sse.Connect();
		var first=FakeEventSource.Instances[0];
		first.Open();

		sse.Close();
		expect(first.Closed).toBe(true);
		expect(sse.Source()).toBeNull();
		expect(types).toEqual(['BeforeConnect','Open','BeforeClose','Close']);

		sse.Connect();
		expect(FakeEventSource.Instances.length).toBe(2);
		expect(sse.Source()).toBe(FakeEventSource.Instances[1]);
	});

	it('stale source events are ignored after Close and after reconnect', function () {
		var data=[];
		var sse=Elemenx.Network.SSE({URL:'/events'});
		sse.On('Transport.Data',function (event) { data.push(event.Data.Data); });
		sse.Connect();
		var first=FakeEventSource.Instances[0];
		first.Open();
		sse.Close();
		first.Message('stale-closed');

		sse.Connect();
		var second=FakeEventSource.Instances[1];
		second.Open();
		first.Message('stale-generation');
		second.Message('current');

		expect(data).toEqual(['current']);
	});

	it('configuration is immutable while connected and mutable again after Close', function () {
		var sse=Elemenx.Network.SSE({URL:'/one',WithCredentials:false});
		sse.Connect();
		var first=FakeEventSource.Instances[0];
		sse.URL('/two').WithCredentials(true);
		expect(first.url).toBe('/one');
		expect(first.withCredentials).toBe(false);
		sse.Close();

		sse.URL('/two').WithCredentials(true).Connect();
		var second=FakeEventSource.Instances[1];
		expect(second.url).toBe('/two');
		expect(second.withCredentials).toBe(true);
	});

	it('Network Context applies BeforeConnect and typed SSE listeners', function () {
		var name=unique('SSEContext');
		var seen=[];
		Elemenx.Network.Context(name,{
			BeforeConnect:function (event) { seen.push('before:'+event.Type); },
			On:{
				'Transport.Open':function (event) { seen.push('open:'+event.Type); },
				'Transport.Data':function (event) { seen.push('data:'+event.Type); }
			}
		});
		var sse=Elemenx.Network.SSE({URL:'/events'},name);
		sse.Connect();
		var source=FakeEventSource.Instances[0];
		source.Open();
		source.Message('hello');
		expect(seen).toEqual(['before:BeforeConnect','open:Open','data:Data']);
	});
	it('owner Destroy closes an active source and ignores stale source events', function () {
		var name=unique('SSEOwner');
		var data=[];
		Elemenx.Component(name,{$Template:'<div></div>'});
		var component=Elemenx.Component(name)();
		var sse=component.$Network().SSE({URL:'/events'});
		sse.On('Transport.Data',function (event) { data.push(event.Data.Data); });
		sse.Connect();
		var source=FakeEventSource.Instances[0];
		source.Open();

		component.$Destroy();
		expect(source.Closed).toBe(true);
		source.Message('stale');
		expect(data).toEqual([]);
	});
});