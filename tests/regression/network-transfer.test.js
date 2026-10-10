import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor } from '../setup.js';

function EventTransport () {
	this.Listeners = {};
	this.Sent = [];
	this.Peer = null;
	this.WritableValue = true;
	this.PausedValue = false;
	this.Executed = 0;
	this.DataValue = null;
}

EventTransport.prototype.On = function (name, callback) {
	if (!this.Listeners[name])
		this.Listeners[name] = [];

	this.Listeners[name].push(callback);

	return this;
};

EventTransport.prototype.Off = function (name, callback) {
	var list = this.Listeners[name] || [];
	var i = list.indexOf(callback);
	if (i !== -1)
		list.splice(i, 1);

	return this;
};

EventTransport.prototype.Emit = function (name, data) {
	var list = (this.Listeners[name] || []).slice();
	var event = {Type: name.substring(name.indexOf('.') + 1), Data: data};
	var i = 0;
	while (i < list.length) {
		list[i](event);

		i++;
	}
};

EventTransport.prototype.Send = function (packet) {
	if (!this.WritableValue) return false;

	this.Sent.push(packet);

	if (this.Peer)
		this.Peer.Emit('Protocol.Transfer', packet);

	return true;
};

EventTransport.prototype.Writable = function () {
	return this.WritableValue;
};

EventTransport.prototype.Data = function (value) {
	this.DataValue = value;

	return this;
};

EventTransport.prototype.Execute = function () {
	this.Executed++;

	return this;
};

EventTransport.prototype.Abort = function () {
	this.Emit('Transport.Abort', {});

	return this;
};

EventTransport.prototype.Pause = function () {
	this.PausedValue = true;

	return this;
};

EventTransport.prototype.Resume = function () {
	this.PausedValue = false;

	return this;
};

function pair () {
	var a = new EventTransport();
	var b = new EventTransport();

	a.Peer = b;
	b.Peer = a;

	return {A: a, B: b};
}

function WholeTransport () {
	this.Listeners = {};
	this.Executed = 0;
	this.DataValue = null;
}

WholeTransport.prototype.On = EventTransport.prototype.On;
WholeTransport.prototype.Off = EventTransport.prototype.Off;
WholeTransport.prototype.Emit = EventTransport.prototype.Emit;
WholeTransport.prototype.Data = EventTransport.prototype.Data;
WholeTransport.prototype.Execute = EventTransport.prototype.Execute;
WholeTransport.prototype.Abort = EventTransport.prototype.Abort;

describe('Regression: Network Transfer / TransferReceiver', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	it('chunked Transfer and TransferReceiver complete an end-to-end binary transfer', async function () {
		var link = pair();
		var completed = [];
		var phases = [];
		var receiver = Elemenx.Network.TransferReceiver({Transport: link.B});
		var transfer = Elemenx.Network.Transfer({
			Transport: link.A,
			Data: new Uint8Array([1, 2, 3, 4, 5]).buffer,
			ChunkSize: 2,
			WindowSize: 2,
			Retry: 50
		});

		receiver.On('Transfer.Complete', function (event) { completed.push(event.Data); });
		transfer.On('Transfer.Phase', function (event) { phases.push(event.Data.Phase); });
		transfer.Execute();

		await tick(30);

		expect(completed.length).toBe(1);
		expect(Array.from(new Uint8Array(await completed[0].Blob.arrayBuffer()))).toEqual([1, 2, 3, 4, 5]);
		expect(completed[0].Size).toBe(5);
		expect(transfer.Active()).toBe(false);
		expect(transfer.Phase()).toBe('Complete');
		expect(phases[0]).toBe('Sending');
		expect(phases[phases.length - 1]).toBe('Complete');
		expect(link.A.Sent.filter(function (packet) { return packet.Action === 'Chunk'; }).length).toBe(3);
		expect(link.B.Sent.filter(function (packet) { return packet.Action === 'Ack'; }).length).toBe(3);
	});


	it('high-level Send and Receive API hides transfer mechanics from application code', async function () {
		var link = pair();
		var received = [];
		var progress = [];
		var receiver = Elemenx.Network.TransferReceiver({Transport: link.B});
		var transfer = Elemenx.Network.Transfer({
			Transport: link.A,
			Data: new Uint8Array([11, 22, 33]).buffer
		});

		receiver.On('Transfer.Receive', function (event) { received.push(event.Data); });
		transfer.On('Transfer.Progress', function (event) { progress.push(event.Data); });
		transfer.Send();

		await tick(30);

		expect(received.length).toBe(1);
		expect(received[0].Size).toBe(3);
		expect(received[0].Blob.size).toBe(3);
		expect(progress.length).toBeGreaterThan(0);
		expect(transfer.Phase()).toBe('Complete');
	});

	it('high-level Transfer preserves structured data with nested binary media', async function () {
		var link = pair();
		var received = [];
		var receiver = Elemenx.Network.TransferReceiver({Transport: link.B});
		var media = new Blob([new Uint8Array([1, 2, 3, 4])], {type: 'video/mp4'});
		var transfer = Elemenx.Network.Transfer({
			Transport: link.A,
			Data: {ID: 42, Title: 'Structured media', Meta: {Tags: ['demo', 'media']}, Media: media}
		});

		receiver.On('Transfer.Receive', function (event) { received.push(event.Data); });

		transfer.Send();

		await tick(50);

		expect(received.length).toBe(1);
		expect(received[0].Data.ID).toBe(42);
		expect(received[0].Data.Title).toBe('Structured media');
		expect(received[0].Data.Meta.Tags).toEqual(['demo', 'media']);
		expect(received[0].Data.Media).toBeInstanceOf(Blob);
		expect(received[0].Data.Media.type).toBe('video/mp4');
		expect(Array.from(new Uint8Array(await received[0].Data.Media.arrayBuffer()))).toEqual([1, 2, 3, 4]);
	});

	it('TransferReceiver acknowledges duplicate chunks but stores them only once', async function () {
		var transport = new EventTransport();
		var chunks = [];
		var complete = [];
		var receiver = Elemenx.Network.TransferReceiver({Transport: transport});

		receiver.On('Transfer.Chunk', function (event) { chunks.push(event.Data); });
		receiver.On('Transfer.Complete', function (event) { complete.push(event.Data); });

		receiver.Receive({Type: 'Transfer', Action: 'Start', ID: 'dup', Name: 'x.bin', Mime: 'application/octet-stream', Size: 2});
		receiver.Receive({Type: 'Transfer', Action: 'Chunk', ID: 'dup', Index: 0, Data: new Uint8Array([7, 8]).buffer});
		receiver.Receive({Type: 'Transfer', Action: 'Chunk', ID: 'dup', Index: 0, Data: new Uint8Array([9, 9]).buffer});
		receiver.Receive({Type: 'Transfer', Action: 'End', ID: 'dup', Chunks: 1, Size: 2});

		expect(chunks.length).toBe(2);
		expect(transport.Sent.filter(function (packet) { return packet.Action === 'Ack'; }).length).toBe(2);
		expect(complete.length).toBe(1);
		expect(Array.from(new Uint8Array(await complete[0].Blob.arrayBuffer()))).toEqual([7, 8]);
	});

	it('TransferReceiver reports missing chunks and invalid non-binary chunk payloads', function () {
		var transport = new EventTransport();
		var errors = [];
		var receiver = Elemenx.Network.TransferReceiver({Transport: transport});

		receiver.On('Transfer.Error', function (event) { errors.push(event.Data.Error.message); });

		receiver.Receive({Type: 'Transfer', Action: 'Start', ID: 'bad', Size: 4});
		receiver.Receive({Type: 'Transfer', Action: 'Chunk', ID: 'bad', Index: 0, Data: 'not-binary'});
		receiver.Receive({Type: 'Transfer', Action: 'End', ID: 'bad', Chunks: 2, Size: 4});

		expect(errors.length).toBe(2);
		expect(errors[0]).toContain('binary');
		expect(errors[1]).toContain('missing chunks');
		expect(transport.Sent.length).toBe(0);
	});

	it('TransferReceiver Abort discards the partial transfer', function () {
		var transport = new EventTransport();
		var aborts = [];
		var completes = [];
		var receiver = Elemenx.Network.TransferReceiver({Transport: transport});

		receiver.On('Transfer.Abort', function (event) { aborts.push(event.Data.ID); });
		receiver.On('Transfer.Complete', function (event) { completes.push(event.Data); });

		receiver.Receive({Type: 'Transfer', Action: 'Start', ID: 'abort-me', Size: 1});
		receiver.Receive({Type: 'Transfer', Action: 'Chunk', ID: 'abort-me', Index: 0, Data: new Uint8Array([1]).buffer});
		receiver.Receive({Type: 'Transfer', Action: 'Abort', ID: 'abort-me'});
		receiver.Receive({Type: 'Transfer', Action: 'End', ID: 'abort-me', Chunks: 1, Size: 1});

		expect(aborts).toEqual(['abort-me']);
		expect(completes).toEqual([]);
	});

	it('whole Transfer packs structured data before delegating it to the transport', async function () {
		var transport = new WholeTransport();
		var transfer = Elemenx.Network.Transfer({
			Transport: transport,
			Data: {ID: 42, Title: 'Structured media', Media: new Blob([new Uint8Array([1, 2, 3, 4])], {type: 'video/mp4'})}
		});

		transfer.Execute();

		await tick(0);

		expect(transport.Executed).toBe(1);
		expect(transport.DataValue).toBeInstanceOf(Blob);
		expect(transport.DataValue.type).toBe('application/x-elemenx-structured');

		var buffer = await transport.DataValue.arrayBuffer();
		var view = new DataView(buffer);

		expect(view.getUint32(0)).toBe(0x45585354);
	});

	it('whole Transfer delegates payload to Execute transport and follows response lifecycle', async function () {
		var transport = new WholeTransport();
		var complete = [];
		var progress = [];
		var transfer = Elemenx.Network.Transfer({
			Transport: transport,
			Data: new Uint8Array([1, 2, 3]).buffer
		});

		transfer.On('Transfer.Progress', function (event) { progress.push(event.Data); });
		transfer.On('Transfer.Complete', function (event) { complete.push(event.Data); });
		transfer.Execute();

		await tick(0);

		expect(transport.Executed).toBe(1);
		expect(transport.DataValue.byteLength).toBe(3);

		transport.Emit('Transport.RequestProgress', {loaded: 3, total: 3, lengthComputable: true});
		transport.Emit('Transport.BeforeResponse', {});
		transport.Emit('Transport.ResponseProgress', {loaded: 2, total: 2, lengthComputable: true});
		transport.Emit('Transport.AfterResponse', {});
		transport.Emit('Transport.Success', {Response: 'ok'});

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
		var transport = new EventTransport();
		var data = [];
		var states = [];
		var transfer = Elemenx.Network.Transfer({Transport: transport});

		transfer.On('Transfer.Data', function (event) { data.push(event.Data.Bytes); });
		transfer.On('Transfer.Pause', function () { states.push('pause'); });
		transfer.On('Transfer.Resume', function () { states.push('resume'); });
		transfer.On('Transfer.Abort', function () { states.push('abort'); });
		transfer.Execute();

		transport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'Start', ID: 'in', Size: 3, Mime: 'application/octet-stream'});
		transport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'Chunk', ID: 'in', Index: 0, Data: new Uint8Array([1, 2, 3]).buffer});

		expect(data).toEqual([3]);

		transfer.Pause();

		expect(transfer.Paused()).toBe(true);
		expect(transport.PausedValue).toBe(true);

		transfer.Resume();

		expect(transfer.Paused()).toBe(false);
		expect(transport.PausedValue).toBe(false);

		transfer.Abort();

		expect(states).toEqual(['pause', 'resume', 'abort']);
		expect(transfer.Active()).toBe(false);
	});
});
function actions (transport, action) {
	return transport.Sent.filter(function (packet) {
		return packet.Action === action;
	});
}

function errorsOf (transfer) {
	var errors = [];

	transfer.On('Transfer.Error', function (event) {
		errors.push(event.Data.Error.message);
	});

	return errors;
}

describe('Regression: Network Transfer edge cases', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	it('chunked Transfer retries an unacknowledged chunk and fails after MaxRetries', async function () {
		var transport = new EventTransport();
		var chunks = [];
		var retries = [];
		var transfer = Elemenx.Network.Transfer({Transport: transport, Data: new Uint8Array([1, 2, 3]), ChunkSize: 3, Retry: 10, MaxRetries: 1});
		var errors = errorsOf(transfer);

		transfer.On('Transfer.Chunk', function (event) {
			chunks.push(event.Data.Index);
		});
		transfer.On('Transfer.Retry', function (event) {
			retries.push(event.Data.Retry);
		});
		transfer.Execute();

		await waitFor(function () {
			return errors.length;
		});

		expect(chunks).toEqual([0]);
		expect(retries).toEqual([1]);
		expect(errors[0]).toContain('acknowledgement timeout');
		expect(transfer.Active()).toBe(false);
		expect(transfer.Phase()).toBe('Error');
		expect(transport.Sent.map(function (packet) {
			return packet.Action;
		})).toEqual(['Start', 'Chunk', 'Chunk']);
	});

	it('chunked Transfer completes through acknowledgements passed to Receive', async function () {
		var transport = new EventTransport();
		var complete = [];
		var phases = [];
		var transfer = Elemenx.Network.Transfer({Transport: transport, Data: new Uint8Array([1, 2, 3, 4]).buffer, ChunkSize: 2, Retry: 1000});

		transfer.On('Transfer.Phase', function (event) {
			phases.push(event.Data.Phase);
		});
		transfer.On('Transfer.Complete', function (event) {
			complete.push(event.Data);
		});
		transfer.Execute();

		await waitFor(function () {
			return actions(transport, 'Chunk').length === 2;
		});

		var id = transport.Sent[0].ID;

		transfer.Receive({Type: 'Transfer', Action: 'Ack', ID: id, Index: 0});
		transfer.Receive({Type: 'Transfer', Action: 'Ack', ID: id, Index: 1});

		await waitFor(function () {
			return actions(transport, 'End').length;
		});

		transfer.Receive({Type: 'Transfer', Action: 'Complete', ID: id});

		expect(complete.length).toBe(1);
		expect(complete[0].Loaded).toBe(4);
		expect(complete[0].Mode).toBe('Chunked');
		expect(phases).toContain('WaitingComplete');
		expect(transfer.Phase()).toBe('Complete');
		expect(transfer.Active()).toBe(false);
	});

	it('chunked Transfer waits for Transport.Drain while the transport is not writable', async function () {
		var transport = new EventTransport();
		var transfer = Elemenx.Network.Transfer({Transport: transport, Data: new Uint8Array([1, 2]).buffer, Retry: 1000});

		transport.WritableValue = false;

		transfer.Execute();

		await tick(10);

		expect(transport.Sent.length).toBe(0);

		transport.WritableValue = true;

		transport.Emit('Transport.Drain', {});

		await waitFor(function () {
			return actions(transport, 'Chunk').length;
		});

		expect(transport.Sent[0].Action).toBe('Start');

		transfer.Destroy();
	});

	it('Encoder transforms every chunk, and an Encoder failure fails the transfer', async function () {
		var transport = new EventTransport();
		var contexts = [];
		var transfer = Elemenx.Network.Transfer({
			Transport: transport,
			Data: new Uint8Array([1, 2, 3]).buffer,
			ChunkSize: 3,
			Retry: 1000,
			Encoder: function (value, context) {
				contexts.push(context.Index);

				return new Uint8Array(value).reverse().buffer;
			}
		});

		transfer.Execute();

		await waitFor(function () {
			return actions(transport, 'Chunk').length;
		});

		expect(Array.from(new Uint8Array(actions(transport, 'Chunk')[0].Data))).toEqual([3, 2, 1]);
		expect(contexts).toEqual([0]);

		transfer.Destroy();

		var broken = Elemenx.Network.Transfer({
			Transport: new EventTransport(),
			Data: new Uint8Array([1]).buffer,
			Encoder: function () {
				throw new Error('encoder broke');
			}
		});
		var errors = errorsOf(broken);

		broken.Execute();

		await waitFor(function () {
			return errors.length;
		});

		expect(errors).toEqual(['encoder broke']);
		expect(broken.Phase()).toBe('Error');
	});

	it('an Encoder with done (error, value) encodes asynchronously, and done (error) fails the transfer', async function () {
		var transport = new EventTransport();
		var transfer = Elemenx.Network.Transfer({
			Transport: transport,
			Data: new Uint8Array([1, 2]).buffer,
			Retry: 1000,
			Encoder: function (value, context, done) {
				setTimeout(function () {
					done(null, new Uint8Array(value).map(function (byte) {
						return byte * 10;
					}).buffer);
				}, 5);
			}
		});

		transfer.Execute();

		await waitFor(function () {
			return actions(transport, 'Chunk').length;
		});

		expect(Array.from(new Uint8Array(actions(transport, 'Chunk')[0].Data))).toEqual([10, 20]);

		transfer.Destroy();

		var failing = Elemenx.Network.Transfer({
			Transport: new EventTransport(),
			Data: new Uint8Array([1]).buffer,
			Encoder: function (value, context, done) {
				done(new Error('async encoder broke'));
			}
		});
		var errors = errorsOf(failing);

		failing.Execute();

		await waitFor(function () {
			return errors.length;
		});

		expect(errors).toEqual(['async encoder broke']);
	});

	it('an Encoder that returns a Promise fails the transfer with an explicit error', async function () {
		var transfer = Elemenx.Network.Transfer({
			Transport: new EventTransport(),
			Data: new Uint8Array([1]).buffer,
			Encoder: function (value) {
				return Promise.resolve(value);
			}
		});
		var errors = errorsOf(transfer);

		transfer.Execute();

		await waitFor(function () {
			return errors.length;
		});

		expect(errors).toEqual(['Elemenx Transfer Encoder must return a value or call done (error, value), not return a Promise']);
		expect(transfer.Phase()).toBe('Error');
	});

	it('Transfer reports configuration errors as Error events', function () {
		var missingSource = Elemenx.Network.Transfer({Transport: new EventTransport(), Data: null});
		var wholeWithoutExecute = Elemenx.Network.Transfer({Transport: {}, Data: new ArrayBuffer(1)});
		var inboundWithoutTransport = Elemenx.Network.Transfer({});
		var missingSourceErrors = errorsOf(missingSource);
		var wholeErrors = errorsOf(wholeWithoutExecute);
		var inboundErrors = errorsOf(inboundWithoutTransport);

		missingSource.Execute();
		wholeWithoutExecute.Execute();
		inboundWithoutTransport.Execute();

		expect(missingSourceErrors).toEqual(['Elemenx Transfer source is not set']);
		expect(wholeErrors).toEqual(['Elemenx whole transfer transport must provide Data(data) and Execute()']);
		expect(inboundErrors).toEqual(['Elemenx inbound transfer transport must provide On()']);
	});

	it('whole Transfer turns transport Error, Timeout and Abort into its own lifecycle', async function () {
		var types = ['Error', 'Timeout', 'Abort'];
		var i = 0;

		while (i < types.length) {
			var transport = new WholeTransport();
			var seen = [];
			var transfer = Elemenx.Network.Transfer({Transport: transport, Data: new Uint8Array([1]).buffer});

			transfer.On('Transfer.' + types[i], function (event) {
				seen.push(event.Data.Mode);
			});
			transfer.Execute();

			await tick(0);

			transport.Emit('Transport.' + types[i], {});

			expect(seen).toEqual(['Whole']);
			expect(transfer.Phase()).toBe(types[i]);
			expect(transfer.Active()).toBe(false);

			i++;
		}
	});

	it('inbound Transfer follows a response download: progress, data and completion', function () {
		var transport = new EventTransport();
		var progress = [];
		var data = [];
		var complete = [];
		var transfer = Elemenx.Network.Transfer({Transport: transport});

		transfer.On('Transfer.Progress', function (event) {
			progress.push(event.Data);
		});
		transfer.On('Transfer.Data', function (event) {
			data.push(event.Data);
		});
		transfer.On('Transfer.Complete', function (event) {
			complete.push(event.Data);
		});
		transfer.Execute();

		expect(transport.Executed).toBe(1);

		transport.Emit('Transport.ResponseProgress', {loaded: 2, total: 4, lengthComputable: true});
		transport.Emit('Transport.Success', {Response: new Uint8Array([1, 2, 3, 4]).buffer});

		expect(progress[0]).toMatchObject({Loaded: 2, Total: 4, Mode: 'Inbound'});
		expect(data[0].Bytes).toBe(4);
		expect(complete.length).toBe(1);
		expect(complete[0]).toMatchObject({Size: 4, Total: 4, Mode: 'Inbound'});
		expect(transfer.Phase()).toBe('Complete');
	});

	it('inbound Transfer counts a string response as UTF-8 bytes', function () {
		var transport = new EventTransport();
		var data = [];
		var transfer = Elemenx.Network.Transfer({Transport: transport});

		transfer.On('Transfer.Data', function (event) {
			data.push(event.Data.Bytes);
		});
		transfer.Execute();

		transport.Emit('Transport.Success', {Response: 'ыы'});

		expect(data).toEqual([4]);
	});

	it('inbound Transfer collects a binary stream until Transport.End and ignores non-binary data', function () {
		var transport = new EventTransport();
		var bytes = [];
		var complete = [];
		var transfer = Elemenx.Network.Transfer({Transport: transport});

		transfer.On('Transfer.Data', function (event) {
			bytes.push(event.Data.Bytes);
		});
		transfer.On('Transfer.Complete', function (event) {
			complete.push(event.Data);
		});
		transfer.Execute();

		transport.Emit('Transport.Data', {Data: new Uint8Array([1, 2])});
		transport.Emit('Transport.Data', {Data: 'not binary'});
		transport.Emit('Transport.Data', {Data: new Uint8Array([3, 4]).buffer});
		transport.Emit('Transport.End', {});

		expect(bytes).toEqual([2, 2]);
		expect(complete.length).toBe(1);
		expect(complete[0].Loaded).toBe(4);
	});

	it('inbound Transfer fails on transport Timeout and on non-binary protocol chunks', function () {
		var timeoutTransport = new EventTransport();
		var timeouts = [];
		var timed = Elemenx.Network.Transfer({Transport: timeoutTransport});

		timed.On('Transfer.Timeout', function (event) {
			timeouts.push(event.Data.Mode);
		});
		timed.Execute();

		timeoutTransport.Emit('Transport.Timeout', {});

		expect(timeouts).toEqual(['Inbound']);
		expect(timed.Phase()).toBe('Timeout');

		var protocolTransport = new EventTransport();
		var decoded = Elemenx.Network.Transfer({Transport: protocolTransport});
		var errors = errorsOf(decoded);

		decoded.Execute();

		protocolTransport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'Start', ID: 'bad', Size: 2});
		protocolTransport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'Chunk', ID: 'bad', Index: 0, Data: 'text'});

		expect(errors[0]).toContain('binary');
		expect(decoded.Active()).toBe(false);
	});

	it('inbound Transfer completes on protocol End and ignores packets of another transfer', function () {
		var transport = new EventTransport();
		var bytes = [];
		var complete = [];
		var transfer = Elemenx.Network.Transfer({Transport: transport});

		transfer.On('Transfer.Data', function (event) {
			bytes.push(event.Data.Bytes);
		});
		transfer.On('Transfer.Complete', function (event) {
			complete.push(event.Data);
		});
		transfer.Execute();

		transport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'Start', ID: 'a', Size: 2, Name: 'file.bin'});
		transport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'Chunk', ID: 'b', Index: 0, Data: new Uint8Array([9]).buffer});
		transport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'Chunk', ID: 'a', Index: 0, Data: new Uint8Array([1, 2]).buffer});
		transport.Emit('Protocol.Transfer', {Type: 'Transfer', Action: 'End', ID: 'a'});

		expect(bytes).toEqual([2]);
		expect(complete.length).toBe(1);
		expect(complete[0]).toMatchObject({Name: 'file.bin', Size: 2, Total: 2});
	});

	it('fluent configuration feeds a chunked transfer, and Off stops event delivery', async function () {
		var link = pair();
		var received = [];
		var progress = 0;
		var receiver = Elemenx.Network.TransferReceiver({Transport: link.B});
		var countProgress = function () {
			progress++;
		};
		var transfer = Elemenx.Network.Transfer()
			.Transport(link.A)
			.Data(new Uint8Array([5, 6, 7]).buffer)
			.ChunkSize(1)
			.WindowSize(1)
			.Retry(50)
			.MaxRetries(2)
			.Encoder(null);

		receiver.On('Transfer.Receive', function (event) {
			received.push(event.Data);
		});
		transfer.On('Transfer.Progress', countProgress);
		transfer.Off('Transfer.Progress', countProgress);
		transfer.Send();

		await waitFor(function () {
			return received.length;
		});

		expect(received[0].Size).toBe(3);
		expect(actions(link.A, 'Chunk').length).toBe(3);
		expect(progress).toBe(0);
		expect(transfer.ChunkSize(8)).toBe(transfer);
	});

	it('Destroy releases every transport listener in both directions', async function () {
		var inboundTransport = new EventTransport();
		var inbound = Elemenx.Network.Transfer({Transport: inboundTransport});
		var outboundTransport = new EventTransport();
		var outbound = Elemenx.Network.Transfer({Transport: outboundTransport, Data: new Uint8Array([1]).buffer, Retry: 1000});

		function listening (transport) {
			return Object.keys(transport.Listeners).filter(function (name) {
				return transport.Listeners[name].length;
			});
		}

		inbound.Execute();
		outbound.Execute();

		await waitFor(function () {
			return actions(outboundTransport, 'Chunk').length;
		});

		expect(listening(inboundTransport).length).toBeGreaterThan(0);
		expect(listening(outboundTransport).length).toBeGreaterThan(0);

		inbound.Destroy();
		outbound.Destroy();

		expect(listening(inboundTransport)).toEqual([]);
		expect(listening(outboundTransport)).toEqual([]);
		expect(inbound.Active()).toBe(false);
		expect(actions(outboundTransport, 'Abort').length).toBe(1);
	});
});
