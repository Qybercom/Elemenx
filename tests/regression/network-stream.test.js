import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var NativeFetch;
var NativeAbortController;

function FakeAbortController () {
	this.signal={};
	this.aborted=false;
	FakeAbortController.Instances.push(this);
}
FakeAbortController.Instances=[];
FakeAbortController.prototype.abort=function () { this.aborted=true; };

function Reader () {
	this.Queue=[];
	this.Waiters=[];
	this.Cancelled=false;
}
Reader.prototype.read=function () {
	var self=this;
	return new Promise(function (resolve,reject) {
		if (self.Queue.length) {
			var item=self.Queue.shift();
			if (item.Error) reject(item.Error);
			else resolve(item);
			return;
		}
		self.Waiters.push({Resolve:resolve,Reject:reject});
	});
};
Reader.prototype.Push=function (value) {
	var item={done:false,value:value};
	if (this.Waiters.length) this.Waiters.shift().Resolve(item);
	else this.Queue.push(item);
};
Reader.prototype.End=function () {
	var item={done:true,value:undefined};
	if (this.Waiters.length) this.Waiters.shift().Resolve(item);
	else this.Queue.push(item);
};
Reader.prototype.Fail=function (error) {
	if (this.Waiters.length) this.Waiters.shift().Reject(error);
	else this.Queue.push({Error:error});
};
Reader.prototype.cancel=function () { this.Cancelled=true; return Promise.resolve(); };

function makeResponse (reader) {
	return {
		status:200,
		statusText:'OK',
		headers:{get:function () { return null; }},
		url:'http://example.test/stream',
		body:{getReader:function () { return reader; }}
	};
}

describe('Regression: Network Stream', function () {
	beforeAll(async function () {
		await loadElemenx();
		NativeFetch=window.fetch;
		NativeAbortController=window.AbortController;
	});
	beforeEach(function () {
		resetDOM();
		FakeAbortController.Instances=[];
		window.AbortController=FakeAbortController;
	});
	afterEach(function () {
		window.fetch=NativeFetch;
		window.AbortController=NativeAbortController;
	});

	it('Connect configures fetch and streams Data until End', async function () {
		var reader=new Reader();
		var calls=[];
		var types=[];
		var bytes=[];
		window.fetch=function (url,options) {
			calls.push({URL:url,Options:options});
			return Promise.resolve(makeResponse(reader));
		};
		var stream=Elemenx.Network.Stream({Method:'POST',URL:'/stream',Data:'body',Headers:{'X-One':['a','b']}});
		stream.On('Transport',function (event) { types.push(event.Type); });
		stream.On('Transport.Data',function (event) { bytes.push(event.Data.Bytes); });
		stream.Connect().Connect();
		await tick(0);
		expect(calls.length).toBe(1);
		expect(calls[0].URL).toBe('/stream');
		expect(calls[0].Options.method).toBe('POST');
		expect(calls[0].Options.body).toBe('body');
		expect(calls[0].Options.headers['X-One']).toBe('a, b');
		expect(types.slice(0,2)).toEqual(['BeforeConnect','Open']);
		reader.Push(new Uint8Array([1,2,3]));
		await tick(0);
		expect(bytes).toEqual([3]);
		reader.End();
		await tick(0);
		expect(types).toContain('End');
	});

	it('Protocol Push can emit multiple packets from a stream chunk', async function () {
		var reader=new Reader();
		var name=unique('StreamProtocol');
		var packets=[];
		window.fetch=function () { return Promise.resolve(makeResponse(reader)); };
		Elemenx.Network.Protocol(name,{
			Push:function (value) {
				return [
					{Type:'Packet',Data:value[0]},
					{Type:'Packet',Data:value[1]}
				];
			}
		});
		var stream=Elemenx.Network.Stream({URL:'/stream',Protocol:name});
		stream.On('Protocol.Packet',function (event) { packets.push(event.Data); });
		stream.Connect();
		await tick(0);
		reader.Push(new Uint8Array([7,8]));
		await tick(0);
		expect(packets).toEqual([7,8]);
		stream.Close();
	});

	it('Pause stops the read loop and Resume continues it', async function () {
		var reader=new Reader();
		var types=[];
		var data=[];
		window.fetch=function () { return Promise.resolve(makeResponse(reader)); };
		var stream=Elemenx.Network.Stream({URL:'/stream'});
		stream.On('Transport',function (event) { types.push(event.Type); });
		stream.On('Transport.Data',function (event) { data.push(event.Data.Bytes); });
		stream.Connect();
		await tick(0);
		stream.Pause();
		reader.Push(new Uint8Array([1]));
		await tick(0);
		expect(data).toEqual([1]);
		expect(types).toContain('Pause');
		reader.Push(new Uint8Array([1,2]));
		await tick(0);
		expect(data).toEqual([1]);
		stream.Resume();
		await tick(0);
		expect(data).toEqual([1,2]);
		expect(types).toContain('Resume');
		stream.Close();
	});

	it('Close cancels reader, aborts fetch generation and ignores stale data', async function () {
		var reader=new Reader();
		var data=[];
		window.fetch=function () { return Promise.resolve(makeResponse(reader)); };
		var stream=Elemenx.Network.Stream({URL:'/stream'});
		stream.On('Transport.Data',function (event) { data.push(event.Data.Bytes); });
		stream.Connect();
		await tick(0);
		stream.Close();
		expect(reader.Cancelled).toBe(true);
		expect(FakeAbortController.Instances[0].aborted).toBe(true);
		reader.Push(new Uint8Array([1,2,3]));
		await tick(0);
		expect(data).toEqual([]);
	});
	it('owner Destroy cancels an active stream and ignores stale reader data', async function () {
		var name=unique('StreamOwner');
		var reader=new Reader();
		var data=[];
		window.fetch=function () { return Promise.resolve(makeResponse(reader)); };
		Elemenx.Component(name,{Template:'<div></div>'});
		var component=Elemenx.Component(name)();
		var stream=component.Network().Stream({URL:'/stream'});
		stream.On('Transport.Data',function (event) { data.push(event.Data.Bytes); });
		stream.Connect();
		await tick(0);

		component.Destroy();
		expect(reader.Cancelled).toBe(true);
		expect(FakeAbortController.Instances[0].aborted).toBe(true);
		reader.Push(new Uint8Array([1,2,3]));
		await tick(0);
		expect(data).toEqual([]);
	});
});