import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick } from '../setup.js';

function EventTransport () {
	this.Listeners={};
	this.Sent=[];
	this.Peer=null;
	this.WritableValue=true;
	this.PausedValue=false;
	this.Executed=0;
	this.DataValue=null;
}

EventTransport.prototype.On=function (name,callback) {
	if (!this.Listeners[name]) this.Listeners[name]=[];
	this.Listeners[name].push(callback);
	return this;
};

EventTransport.prototype.Off=function (name,callback) {
	var list=this.Listeners[name] || [];
	var i=list.indexOf(callback);
	if (i !== -1) list.splice(i,1);
	return this;
};

EventTransport.prototype.Emit=function (name,data) {
	var list=(this.Listeners[name] || []).slice();
	var event={Type:name.substring(name.indexOf('.')+1),Data:data};
	var i=0;
	while (i<list.length) {
		list[i](event);
		i++;
	}
};

EventTransport.prototype.Send=function (packet) {
	if (!this.WritableValue) return false;
	this.Sent.push(packet);
	if (this.Peer) this.Peer.Emit('Protocol.Transfer',packet);
	return true;
};

EventTransport.prototype.Writable=function () {
	return this.WritableValue;
};

EventTransport.prototype.Data=function (value) {
	this.DataValue=value;
	return this;
};

EventTransport.prototype.Execute=function () {
	this.Executed++;
	return this;
};

EventTransport.prototype.Abort=function () {
	this.Emit('Transport.Abort',{});
	return this;
};

EventTransport.prototype.Pause=function () {
	this.PausedValue=true;
	return this;
};

EventTransport.prototype.Resume=function () {
	this.PausedValue=false;
	return this;
};

function pair () {
	var a=new EventTransport();
	var b=new EventTransport();
	a.Peer=b;
	b.Peer=a;
	return {A:a,B:b};
}

function WholeTransport () {
	this.Listeners={};
	this.Executed=0;
	this.DataValue=null;
}

WholeTransport.prototype.On=EventTransport.prototype.On;
WholeTransport.prototype.Off=EventTransport.prototype.Off;
WholeTransport.prototype.Emit=EventTransport.prototype.Emit;
WholeTransport.prototype.Data=EventTransport.prototype.Data;
WholeTransport.prototype.Execute=EventTransport.prototype.Execute;
WholeTransport.prototype.Abort=EventTransport.prototype.Abort;

describe('Regression: Network Transfer / TransferReceiver', function () {
	beforeAll(async function () {
		await loadElemenx();
	});
	beforeEach(function () {
		resetDOM();
	});

	it('chunked Transfer and TransferReceiver complete an end-to-end binary transfer', async function () {
		var link=pair();
		var completed=[];
		var phases=[];
		var receiver=Elemenx.Network.TransferReceiver({Transport:link.B});
		var transfer=Elemenx.Network.Transfer({
			Transport:link.A,
			Data:new Uint8Array([1,2,3,4,5]).buffer,
			ChunkSize:2,
			WindowSize:2,
			Retry:50
		});

		receiver.On('Transfer.Complete',function (event) { completed.push(event.Data); });
		transfer.On('Transfer.Phase',function (event) { phases.push(event.Data.Phase); });
		transfer.Execute();
		await tick(30);

		expect(completed.length).toBe(1);
		expect(Array.from(new Uint8Array(await completed[0].Blob.arrayBuffer()))).toEqual([1,2,3,4,5]);
		expect(completed[0].Size).toBe(5);
		expect(transfer.Active()).toBe(false);
		expect(transfer.Phase()).toBe('Complete');
		expect(phases[0]).toBe('Sending');
		expect(phases[phases.length-1]).toBe('Complete');
		expect(link.A.Sent.filter(function (packet) { return packet.Action === 'Chunk'; }).length).toBe(3);
		expect(link.B.Sent.filter(function (packet) { return packet.Action === 'Ack'; }).length).toBe(3);
	});


	it('high-level Send and Receive API hides transfer mechanics from application code', async function () {
		var link=pair();
		var received=[];
		var progress=[];
		var receiver=Elemenx.Network.TransferReceiver({Transport:link.B});
		var transfer=Elemenx.Network.Transfer({
			Transport:link.A,
			Data:new Uint8Array([11,22,33]).buffer
		});

		receiver.On('Transfer.Receive',function (event) { received.push(event.Data); });
		transfer.On('Transfer.Progress',function (event) { progress.push(event.Data); });
		transfer.Send();
		await tick(30);

		expect(received.length).toBe(1);
		expect(received[0].Size).toBe(3);
		expect(received[0].Blob.size).toBe(3);
		expect(progress.length).toBeGreaterThan(0);
		expect(transfer.Phase()).toBe('Complete');
	});

	it('TransferReceiver acknowledges duplicate chunks but stores them only once', async function () {
		var transport=new EventTransport();
		var chunks=[];
		var complete=[];
		var receiver=Elemenx.Network.TransferReceiver({Transport:transport});
		receiver.On('Transfer.Chunk',function (event) { chunks.push(event.Data); });
		receiver.On('Transfer.Complete',function (event) { complete.push(event.Data); });

		receiver.Receive({Type:'Transfer',Action:'Start',ID:'dup',Name:'x.bin',Mime:'application/octet-stream',Size:2});
		receiver.Receive({Type:'Transfer',Action:'Chunk',ID:'dup',Index:0,Data:new Uint8Array([7,8]).buffer});
		receiver.Receive({Type:'Transfer',Action:'Chunk',ID:'dup',Index:0,Data:new Uint8Array([9,9]).buffer});
		receiver.Receive({Type:'Transfer',Action:'End',ID:'dup',Chunks:1,Size:2});

		expect(chunks.length).toBe(2);
		expect(transport.Sent.filter(function (packet) { return packet.Action === 'Ack'; }).length).toBe(2);
		expect(complete.length).toBe(1);
		expect(Array.from(new Uint8Array(await complete[0].Blob.arrayBuffer()))).toEqual([7,8]);
	});

	it('TransferReceiver reports missing chunks and invalid non-binary chunk payloads', function () {
		var transport=new EventTransport();
		var errors=[];
		var receiver=Elemenx.Network.TransferReceiver({Transport:transport});
		receiver.On('Transfer.Error',function (event) { errors.push(event.Data.Error.message); });

		receiver.Receive({Type:'Transfer',Action:'Start',ID:'bad',Size:4});
		receiver.Receive({Type:'Transfer',Action:'Chunk',ID:'bad',Index:0,Data:'not-binary'});
		receiver.Receive({Type:'Transfer',Action:'End',ID:'bad',Chunks:2,Size:4});

		expect(errors.length).toBe(2);
		expect(errors[0]).toContain('binary');
		expect(errors[1]).toContain('missing chunks');
		expect(transport.Sent.length).toBe(0);
	});

	it('TransferReceiver Abort discards the partial transfer', function () {
		var transport=new EventTransport();
		var aborts=[];
		var completes=[];
		var receiver=Elemenx.Network.TransferReceiver({Transport:transport});
		receiver.On('Transfer.Abort',function (event) { aborts.push(event.Data.ID); });
		receiver.On('Transfer.Complete',function (event) { completes.push(event.Data); });

		receiver.Receive({Type:'Transfer',Action:'Start',ID:'abort-me',Size:1});
		receiver.Receive({Type:'Transfer',Action:'Chunk',ID:'abort-me',Index:0,Data:new Uint8Array([1]).buffer});
		receiver.Receive({Type:'Transfer',Action:'Abort',ID:'abort-me'});
		receiver.Receive({Type:'Transfer',Action:'End',ID:'abort-me',Chunks:1,Size:1});

		expect(aborts).toEqual(['abort-me']);
		expect(completes).toEqual([]);
	});

	it('whole Transfer delegates payload to Execute transport and follows response lifecycle', async function () {
		var transport=new WholeTransport();
		var complete=[];
		var progress=[];
		var transfer=Elemenx.Network.Transfer({
			Transport:transport,
			Data:new Uint8Array([1,2,3]).buffer
		});
		transfer.On('Transfer.Progress',function (event) { progress.push(event.Data); });
		transfer.On('Transfer.Complete',function (event) { complete.push(event.Data); });
		transfer.Execute();
		await tick(0);

		expect(transport.Executed).toBe(1);
		expect(transport.DataValue.byteLength).toBe(3);
		transport.Emit('Transport.RequestProgress',{loaded:3,total:3,lengthComputable:true});
		transport.Emit('Transport.BeforeResponse',{});
		transport.Emit('Transport.ResponseProgress',{loaded:2,total:2,lengthComputable:true});
		transport.Emit('Transport.AfterResponse',{});
		transport.Emit('Transport.Success',{Response:'ok'});

		expect(progress.length).toBe(1);
		expect(progress[0].Loaded).toBe(3);
		expect(complete.length).toBe(1);
		expect(complete[0].Mode).toBe('Whole');
		expect(complete[0].Loaded).toBe(3);
		expect(complete[0].Response.Response).toBe('ok');
		expect(transfer.Active()).toBe(false);
		expect(transfer.Phase()).toBe('Complete');
	});

	it('inbound Transfer consumes protocol packets and supports Pause / Resume / Abort', function () {
		var transport=new EventTransport();
		var data=[];
		var states=[];
		var transfer=Elemenx.Network.Transfer({Transport:transport});
		transfer.On('Transfer.Data',function (event) { data.push(event.Data.Bytes); });
		transfer.On('Transfer.Pause',function () { states.push('pause'); });
		transfer.On('Transfer.Resume',function () { states.push('resume'); });
		transfer.On('Transfer.Abort',function () { states.push('abort'); });
		transfer.Execute();

		transport.Emit('Protocol.Transfer',{Type:'Transfer',Action:'Start',ID:'in',Size:3,Mime:'application/octet-stream'});
		transport.Emit('Protocol.Transfer',{Type:'Transfer',Action:'Chunk',ID:'in',Index:0,Data:new Uint8Array([1,2,3]).buffer});
		expect(data).toEqual([3]);
		transfer.Pause();
		expect(transfer.Paused()).toBe(true);
		expect(transport.PausedValue).toBe(true);
		transfer.Resume();
		expect(transfer.Paused()).toBe(false);
		expect(transport.PausedValue).toBe(false);
		transfer.Abort();
		expect(states).toEqual(['pause','resume','abort']);
		expect(transfer.Active()).toBe(false);
	});
});