import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var NativeWebSocket;

function FakeWebSocket (url, protocols) {
	this.url=url;
	this.protocols=protocols;
	this.readyState=FakeWebSocket.CONNECTING;
	this.binaryType='blob';
	this.bufferedAmount=0;
	this.protocol='';
	this.extensions='';
	this.Listeners={};
	this.Sent=[];
	FakeWebSocket.Instances.push(this);
}

FakeWebSocket.CONNECTING=0;
FakeWebSocket.OPEN=1;
FakeWebSocket.CLOSING=2;
FakeWebSocket.CLOSED=3;
FakeWebSocket.Instances=[];

FakeWebSocket.prototype.addEventListener=function (name,callback) {
	if (!this.Listeners[name]) this.Listeners[name]=[];
	this.Listeners[name].push(callback);
};

FakeWebSocket.prototype.Emit=function (name,event) {
	var list=this.Listeners[name] || [];
	var i=0;
	while (i<list.length) {
		list[i](event || {});
		i++;
	}
};

FakeWebSocket.prototype.Open=function () {
	this.readyState=FakeWebSocket.OPEN;
	this.protocol='chat';
	this.extensions='permessage-deflate';
	this.Emit('open',{});
};

FakeWebSocket.prototype.Message=function (data) {
	this.Emit('message',{data:data,origin:'ws://example.test'});
};

FakeWebSocket.prototype.send=function (data) {
	this.Sent.push(data);
};

FakeWebSocket.prototype.close=function (code,reason) {
	this.CloseCode=code;
	this.CloseReason=reason;
	this.readyState=FakeWebSocket.CLOSING;
};

FakeWebSocket.prototype.FinishClose=function (code,reason,clean) {
	this.readyState=FakeWebSocket.CLOSED;
	this.Emit('close',{code:code || 1000,reason:reason || '',wasClean:clean !== false});
};

describe('Regression: Network WebSocket', function () {
	beforeAll(async function () {
		await loadElemenx();
		NativeWebSocket=window.WebSocket;
	});
	beforeEach(function () {
		resetDOM();
		FakeWebSocket.Instances=[];
		window.WebSocket=FakeWebSocket;
	});
	afterEach(function () {
		window.WebSocket=NativeWebSocket;
	});

	it('Connect is coalesced and emits BeforeConnect / Open with configured socket metadata', function () {
		var types=[];
		var ws=Elemenx.Network.WebSocket({
			URL:'ws://example.test/socket',
			Protocols:['one','two'],
			BinaryType:'arraybuffer'
		});
		ws.On('Transport',function (event) { types.push(event.Type); });
		ws.Connect().Connect();

		expect(FakeWebSocket.Instances.length).toBe(1);
		var native=FakeWebSocket.Instances[0];
		expect(native.url).toBe('ws://example.test/socket');
		expect(native.protocols).toEqual(['one','two']);
		expect(native.binaryType).toBe('arraybuffer');
		expect(types).toEqual(['BeforeConnect']);

		native.Open();
		expect(types).toEqual(['BeforeConnect','Open']);
		expect(ws.Socket()).toBe(native);
		expect(ws.Writable()).toBe(true);
	});

	it('Protocol encodes outgoing data and decodes incoming messages', function () {
		var name=unique('WSProtocol');
		var decoded=[];
		Elemenx.Network.Protocol(name,{
			Encode:function (value) { return JSON.stringify(value); },
			Decode:function (value) { return {Type:'Packet',Data:JSON.parse(value)}; }
		});
		var ws=Elemenx.Network.WebSocket({URL:'ws://example.test',Protocol:name});
		ws.On('Protocol.Packet',function (event) { decoded.push(event.Data); });
		ws.Connect();
		var native=FakeWebSocket.Instances[0];
		native.Open();

		expect(ws.Send({hello:'world'})).toBe(true);
		expect(native.Sent).toEqual(['{"hello":"world"}']);
		native.Message('{"ok":true}');
		expect(decoded).toEqual([{ok:true}]);
	});

	it('Send reports BeforeSend / AfterSend and refuses data while socket is not open', function () {
		var types=[];
		var ws=Elemenx.Network.WebSocket({URL:'ws://example.test'});
		ws.On('Transport',function (event) { types.push(event.Type); });
		expect(ws.Send('early')).toBe(false);
		ws.Connect();
		var native=FakeWebSocket.Instances[0];
		expect(ws.Send('connecting')).toBe(false);
		native.Open();
		expect(ws.Send('ready')).toBe(true);
		expect(native.Sent).toEqual(['ready']);
		expect(types).toEqual(['BeforeConnect','Open','BeforeSend','AfterSend']);
	});

	it('Backpressure blocks Send and Drain restores writability below low-water mark', async function () {
		var types=[];
		var ws=Elemenx.Network.WebSocket({
			URL:'ws://example.test',
			BufferHighWaterMark:10,
			BufferLowWaterMark:3,
			DrainInterval:1
		});
		ws.On('Transport',function (event) { types.push(event.Type); });
		ws.Connect();
		var native=FakeWebSocket.Instances[0];
		native.Open();
		native.bufferedAmount=8;

		expect(ws.Send('abcd')).toBe(false);
		expect(ws.Writable()).toBe(false);
		expect(types).toContain('Backpressure');

		native.bufferedAmount=2;
		await tick(10);
		expect(types).toContain('Drain');
		expect(ws.Writable()).toBe(true);
	});

	it('Close lifecycle resets the socket and allows a later reconnect', function () {
		var types=[];
		var ws=Elemenx.Network.WebSocket({URL:'ws://example.test'});
		ws.On('Transport',function (event) { types.push(event.Type); });
		ws.Connect();
		var first=FakeWebSocket.Instances[0];
		first.Open();

		ws.Close(1000,'done');
		expect(first.CloseCode).toBe(1000);
		expect(first.CloseReason).toBe('done');
		expect(types).toContain('BeforeClose');
		first.FinishClose(1000,'done',true);
		expect(types).toContain('Close');
		expect(ws.Socket()).toBeNull();
		expect(ws.Writable()).toBe(false);

		ws.Connect();
		expect(FakeWebSocket.Instances.length).toBe(2);
	});

	it('Network Context applies BeforeConnect and typed WebSocket listeners', function () {
		var name=unique('WSContext');
		var seen=[];
		Elemenx.Network.Context(name,{
			BeforeConnect:function (event) { seen.push('before:'+event.Type); },
			On:{
				'Transport.Open':function (event) { seen.push('open:'+event.Type); },
				'Transport.Data':function (event) { seen.push('data:'+event.Type); }
			}
		});
		var ws=Elemenx.Network.WebSocket({URL:'ws://example.test'},name);
		ws.Connect();
		var native=FakeWebSocket.Instances[0];
		native.Open();
		native.Message('hello');
		expect(seen).toEqual(['before:BeforeConnect','open:Open','data:Data']);
	});
});