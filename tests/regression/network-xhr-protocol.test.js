import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

var NativeXHR;

function FakeTarget () {
	this.Listeners={};
}

FakeTarget.prototype.addEventListener=function (name,callback) {
	if (!this.Listeners[name]) this.Listeners[name]=[];
	this.Listeners[name].push(callback);
};

FakeTarget.prototype.Emit=function (name,event) {
	var list=this.Listeners[name] || [];
	var i=0;
	while (i<list.length) {
		list[i](event || {});
		i++;
	}
};

function FakeXHR () {
	FakeTarget.call(this);
	this.upload=new FakeTarget();
	this.readyState=0;
	this.status=200;
	this.statusText='OK';
	this.responseURL='http://example.test/result';
	this.responseType='';
	this.response='';
	this.responseText='';
	this.RequestHeaders=[];
	FakeXHR.Instances.push(this);
}

FakeXHR.Instances=[];
FakeXHR.prototype=Object.create(FakeTarget.prototype);
FakeXHR.prototype.constructor=FakeXHR;
FakeXHR.prototype.open=function (method,url,async) {
	this.Method=method;
	this.URL=url;
	this.Async=async;
};
FakeXHR.prototype.setRequestHeader=function (name,value) {
	this.RequestHeaders.push([name,value]);
};
FakeXHR.prototype.getAllResponseHeaders=function () {
	return 'x-test: yes';
};
FakeXHR.prototype.send=function (data) {
	this.Sent=data;
};
FakeXHR.prototype.abort=function () {
	this.Emit('abort',{Type:'abort'});
};
FakeXHR.prototype.Headers=function () {
	return this.RequestHeaders.slice();
};
FakeXHR.prototype.Respond=function (body) {
	this.response=body;
	this.responseText=body;
	this.readyState=2;
	this.Emit('readystatechange',{});
	this.Emit('progress',{loaded:String(body).length,total:String(body).length});
	this.Emit('load',{});
};

describe('Regression: Network XHR / Protocol', function () {
	beforeAll(async function () {
		await loadElemenx();
		NativeXHR=window.XMLHttpRequest;
	});
	beforeEach(function () {
		resetDOM();
		FakeXHR.Instances=[];
		window.XMLHttpRequest=FakeXHR;
	});
	afterEach(function () {
		window.XMLHttpRequest=NativeXHR;
	});

	it('Protocol registry resolves named protocols and XHR Encode/Decode events', function () {
		var name=unique('Protocol');
		var decoded=[];
		var protocol=Elemenx.Network.Protocol(name,{
			Encode:function (value) { return JSON.stringify(value); },
			Decode:function (value) { return {Type:'Packet',Data:JSON.parse(value)}; }
		});
		expect(Elemenx.Network.Protocol(name)).toBe(protocol);
		expect(Elemenx.Network.Protocol(unique('MissingProtocol'))).toBeNull();

		var xhr=Elemenx.Network.XHR({Method:'POST',URL:'/api',Data:{a:1},Protocol:name});
		xhr.On('Protocol.Packet',function (event) { decoded.push(event.Data); });
		xhr.Execute();
		var native=FakeXHR.Instances[0];
		expect(native.Sent).toBe('{"a":1}');
		native.Respond('{"ok":true}');
		expect(decoded).toEqual([{ok:true}]);
	});

	it('XHR preserves repeated headers and emits the transport lifecycle in order', function () {
		var types=[];
		var xhr=Elemenx.Network.XHR({
			Method:'POST',
			URL:'/upload',
			Data:'body',
			Headers:{'X-One':['a','b']}
		});
		xhr.Header('X-Two','c');
		xhr.On('Transport',function (event) { types.push(event.Type); });
		xhr.Execute();

		var native=FakeXHR.Instances[0];
		expect(native.Method).toBe('POST');
		expect(native.URL).toBe('/upload');
		expect(native.Headers()).toEqual([['X-One','a'],['X-One','b'],['X-Two','c']]);
		expect(types).toEqual(['BeforeRequest']);

		native.upload.Emit('progress',{loaded:2,total:4});
		native.upload.Emit('load',{});
		native.Respond('done');
		expect(types).toEqual([
			'BeforeRequest','RequestProgress','AfterRequest',
			'BeforeResponse','ResponseProgress','AfterResponse','Success'
		]);
	});

	it('XHR configuration is immutable while executing and reusable after completion', function () {
		var xhr=Elemenx.Network.XHR({Method:'GET',URL:'/one'});
		xhr.Execute();
		var first=FakeXHR.Instances[0];
		xhr.Method('POST').URL('/two').Data('changed');
		expect(first.Method).toBe('GET');
		expect(first.URL).toBe('/one');
		first.Respond('one');

		xhr.Method('POST').URL('/two').Data('changed').Execute();
		var second=FakeXHR.Instances[1];
		expect(second.Method).toBe('POST');
		expect(second.URL).toBe('/two');
		expect(second.Sent).toBe('changed');
		second.Respond('two');
	});

	it('Abort emits one terminal Abort and ignores stale events from that execution', function () {
		var types=[];
		var xhr=Elemenx.Network.XHR({URL:'/abort'});
		xhr.On('Transport',function (event) { types.push(event.Type); });
		xhr.Execute();
		var native=FakeXHR.Instances[0];
		xhr.Abort();
		native.Emit('error',{});
		native.Emit('load',{});
		expect(types).toEqual(['BeforeRequest','Abort']);
	});

	it('Timeout and Error are terminal events and Execute while active is coalesced', function () {
		var types=[];
		var xhr=Elemenx.Network.XHR({URL:'/terminal'});
		xhr.On('Transport',function (event) { types.push(event.Type); });
		xhr.Execute().Execute();
		expect(FakeXHR.Instances.length).toBe(1);
		FakeXHR.Instances[0].Emit('timeout',{});
		expect(types).toEqual(['BeforeRequest','Timeout']);

		xhr.Execute();
		expect(FakeXHR.Instances.length).toBe(2);
		FakeXHR.Instances[1].Emit('error',{});
		expect(types).toEqual(['BeforeRequest','Timeout','BeforeRequest','Error']);
	});

	it('Network Context On listeners attach to resources by namespace and typed event', function () {
		var name=unique('XHRContext');
		var seen=[];
		Elemenx.Network.Context(name,{
			On:{
				'Transport.BeforeRequest':function (event) { seen.push(event.Type); },
				'Transport.Success':function (event) { seen.push(event.Type); }
			}
		});
		var xhr=Elemenx.Network.XHR({URL:'/context'},name);
		xhr.Execute();
		FakeXHR.Instances[0].Respond('ok');
		expect(seen).toEqual(['BeforeRequest','Success']);
	});

	it('owner Destroy aborts an active XHR, ignores stale completion and prevents Network resurrection', function () {
		var name=unique('NetworkOwner');
		var success=0;
		var abort=0;
		Elemenx.Component(name,{Template:'<div></div>'});
		var component=Elemenx.Component(name)();
		var network=component.Network();
		var xhr=network.XHR({URL:'/owned'});
		xhr.On('Transport.Success',function () { success++; });
		xhr.On('Transport.Abort',function () { abort++; });
		xhr.Execute();
		var native=FakeXHR.Instances[0];

		component.Destroy();
		expect(abort).toBe(1);

		native.Emit('load',{});
		native.Emit('error',{});
		expect(success).toBe(0);
		expect(abort).toBe(1);
		expect(function () { network.XHR({URL:'/after-destroy'}); }).toThrow(/owner is destroyed/);
		expect(FakeXHR.Instances.length).toBe(1);
	});
});