import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

var NativeRTCPeerConnection;

function Emitter () {
	this.Listeners = {};
}
Emitter.prototype.addEventListener = function (name, callback) {
	if (!this.Listeners[name])
		this.Listeners[name] = [];

	this.Listeners[name].push(callback);
};
Emitter.prototype.Emit = function (name, event) {
	var list = (this.Listeners[name] || []).slice();
	var i = 0;
	while (i < list.length) {
		list[i](event || {});

		i++;
	}
};

function FakeDataChannel (label, configuration) {
	Emitter.call(this);

	var config = configuration || {};

	this.label = label;
	this.id = config.id === undefined ? null : config.id;
	this.ordered = config.ordered === undefined ? true : config.ordered;
	this.protocol = config.protocol || '';
	this.readyState = 'connecting';
	this.bufferedAmount = 0;
	this.bufferedAmountLowThreshold = 0;
	this.Sent = [];
	this.Closed = false;
}
FakeDataChannel.prototype = Object.create(Emitter.prototype);
FakeDataChannel.prototype.constructor = FakeDataChannel;
FakeDataChannel.prototype.Open = function () {
	this.readyState = 'open';

	this.Emit('open', {});
};
FakeDataChannel.prototype.Message = function (data) {
	this.Emit('message', {data: data});
};
FakeDataChannel.prototype.send = function (data) {
	this.Sent.push(data);
};
FakeDataChannel.prototype.close = function () {
	this.Closed = true;
	this.readyState = 'closed';

	this.Emit('close', {});
};
FakeDataChannel.prototype.Low = function (amount) {
	this.bufferedAmount = amount === undefined ? 0 : amount;

	this.Emit('bufferedamountlow', {});
};

function FakeRTCPeerConnection (configuration) {
	Emitter.call(this);

	this.Configuration = configuration || {};
	this.connectionState = 'new';
	this.iceConnectionState = 'new';
	this.signalingState = 'stable';
	this.localDescription = null;
	this.remoteDescription = null;
	this.Channels = [];
	this.Candidates = [];
	this.Closed = false;

	FakeRTCPeerConnection.Instances.push(this);
}
FakeRTCPeerConnection.prototype = Object.create(Emitter.prototype);
FakeRTCPeerConnection.prototype.constructor = FakeRTCPeerConnection;
FakeRTCPeerConnection.Instances = [];
FakeRTCPeerConnection.prototype.createDataChannel = function (label, configuration) {
	var channel = new FakeDataChannel(label, configuration);

	this.Channels.push(channel);

	return channel;
};
FakeRTCPeerConnection.prototype.createOffer = function () {
	return Promise.resolve({type: 'offer', sdp: 'fake-offer'});
};
FakeRTCPeerConnection.prototype.createAnswer = function () {
	return Promise.resolve({type: 'answer', sdp: 'fake-answer'});
};
FakeRTCPeerConnection.prototype.setLocalDescription = function (description) {
	this.localDescription = description;

	return Promise.resolve();
};
FakeRTCPeerConnection.prototype.setRemoteDescription = function (description) {
	this.remoteDescription = description;

	return Promise.resolve();
};
FakeRTCPeerConnection.prototype.addIceCandidate = function (candidate) {
	this.Candidates.push(candidate);

	return Promise.resolve();
};
FakeRTCPeerConnection.prototype.close = function () {
	this.Closed = true;
	this.connectionState = 'closed';
};
FakeRTCPeerConnection.prototype.RemoteChannel = function (channel) {
	this.Emit('datachannel', {channel: channel});
};
FakeRTCPeerConnection.prototype.ICE = function (candidate) {
	this.Emit('icecandidate', {candidate: candidate});
};
FakeRTCPeerConnection.prototype.State = function (connection, ice, signaling) {
	if (connection !== undefined) {
		this.connectionState = connection;

		this.Emit('connectionstatechange', {});
	}

	if (ice !== undefined) {
		this.iceConnectionState = ice;

		this.Emit('iceconnectionstatechange', {});
	}

	if (signaling !== undefined) {
		this.signalingState = signaling;

		this.Emit('signalingstatechange', {});
	}
};

describe('Regression: Network WebRTC', function () {
	beforeAll(async function () {
		await loadElemenx();

		NativeRTCPeerConnection = window.RTCPeerConnection;
	});

	beforeEach(function () {
		resetDOM();

		FakeRTCPeerConnection.Instances = [];
		window.RTCPeerConnection = FakeRTCPeerConnection;
	});

	afterEach(function () {
		window.RTCPeerConnection = NativeRTCPeerConnection;
	});

	it('Connect creates one peer/channel, exposes channel metadata and coalesces repeated connect', function () {
		var types = [];
		var rtc = Elemenx.Network.WebRTC({
			Configuration: {iceServers: [{urls: 'stun:test'}]},
			ChannelName: 'chat',
			Channel: {ordered: false, protocol: 'elemenx-test'}
		});

		rtc.On('Transport', function (event) { types.push(event.Type); });
		rtc.Connect().Connect();

		expect(FakeRTCPeerConnection.Instances.length).toBe(1);

		var peer = FakeRTCPeerConnection.Instances[0];
		var channel = peer.Channels[0];

		expect(peer.Configuration.iceServers[0].urls).toBe('stun:test');
		expect(channel.label).toBe('chat');
		expect(channel.ordered).toBe(false);
		expect(channel.protocol).toBe('elemenx-test');
		expect(rtc.Connection()).toBe(peer);
		expect(rtc.DataChannel()).toBe(channel);
		expect(types).toEqual(['BeforeConnect', 'Channel']);

		channel.Open();

		expect(types).toEqual(['BeforeConnect', 'Channel', 'Open']);
	});

	it('Send measures strings as UTF-8 bytes for backpressure', function () {
		var pressure = [];
		var rtc = Elemenx.Network.WebRTC({QueueHighWaterMark: 3});

		rtc.On('Transport.Backpressure', function (event) {
			pressure.push(event.Data.Bytes);
		});
		rtc.Connect();
		rtc.DataChannel().Open();

		expect(rtc.Send('ыы')).toBe(false);
		expect(pressure).toEqual([4]);
	});

	it('negotiation methods return the WebRTC object and no Promise', function () {
		var rtc = Elemenx.Network.WebRTC({ChannelName: 'data'});
		var returned = [rtc.CreateOffer(), rtc.AcceptOffer({type: 'offer', sdp: 'x'}), rtc.AcceptAnswer({type: 'answer', sdp: 'x'}), rtc.AddICECandidate({candidate: 'x'})];

		expect(returned.filter(function (value) {
			return value === rtc;
		}).length).toBe(4);
		expect(returned.some(function (value) {
			return typeof value.then === 'function';
		})).toBe(false);
	});

	it('CreateOffer / AcceptOffer / AcceptAnswer deliver results through (error, result) callbacks', async function () {
		var initiator = Elemenx.Network.WebRTC({ChannelName: 'data'});
		var responder = Elemenx.Network.WebRTC();
		var results = [];
		var descriptions = [];

		function record (side) {
			return function (event) {
				if (event.Type === 'LocalDescription' || event.Type === 'RemoteDescription')
					descriptions.push([side, event.Type, event.Data.Description.type]);
			};
		}

		initiator.On('Transport', record('initiator'));
		responder.On('Transport', record('responder'));

		await new Promise(function (resolve) {
			initiator.CreateOffer(function (offerError, offer) {
				results.push(['offer', offerError, offer]);

				responder.AcceptOffer(offer, function (answerError, answer) {
					results.push(['answer', answerError, answer]);

					initiator.AcceptAnswer(answer, function (acceptError, accepted) {
						results.push(['accepted', acceptError, accepted]);

						resolve();
					});
				});
			});
		});

		expect(results).toEqual([
			['offer', null, {type: 'offer', sdp: 'fake-offer'}],
			['answer', null, {type: 'answer', sdp: 'fake-answer'}],
			['accepted', null, {type: 'answer', sdp: 'fake-answer'}]
		]);
		expect(responder.Connection().remoteDescription).toEqual({type: 'offer', sdp: 'fake-offer'});
		expect(initiator.Connection().remoteDescription).toEqual({type: 'answer', sdp: 'fake-answer'});
		expect(descriptions).toEqual([
			['initiator', 'LocalDescription', 'offer'],
			['responder', 'RemoteDescription', 'offer'],
			['responder', 'LocalDescription', 'answer'],
			['initiator', 'RemoteDescription', 'answer']
		]);
	});

	it('negotiation failures go to the callback, or to Transport.Error without one', async function () {
		var withCallback = Elemenx.Network.WebRTC();
		var withoutCallback = Elemenx.Network.WebRTC();
		var events = [];
		var result = await new Promise(function (resolve) {
			withCallback.AcceptAnswer({type: 'answer', sdp: 'early'}, function (error, value) {
				resolve({Error: error, Value: value});
			});
		});

		expect(result.Error.message).toContain('not active');
		expect(result.Value).toBeUndefined();

		withoutCallback.On('Transport.Error', function (event) {
			events.push(event.Data);
		});
		withoutCallback.AcceptAnswer({type: 'answer', sdp: 'early'});

		await waitFor(function () {
			return events.length;
		});

		expect(events[0].Operation).toBe('AcceptAnswer');
		expect(events[0].Error.message).toContain('not active');
	});

	it('AddICECandidate reports completion through its callback', async function () {
		var rtc = Elemenx.Network.WebRTC();
		var candidate = {candidate: 'candidate:1'};

		rtc.Connect(false);

		var result = await new Promise(function (resolve) {
			rtc.AddICECandidate(candidate, function (error) {
				resolve(error);
			});
		});

		expect(result).toBeNull();
		expect(rtc.Connection().Candidates).toEqual([candidate]);
	});

	it('ICE/state events and AddICECandidate are surfaced while the generation is active', async function () {
		var seen = [];
		var rtc = Elemenx.Network.WebRTC();

		rtc.On('Transport', function (event) {
			if (event.Type === 'ICECandidate')
				seen.push(['candidate', event.Data.Candidate]);

			if (event.Type === 'ConnectionState')
				seen.push(['connection', event.Data.State]);

			if (event.Type === 'ICEConnectionState')
				seen.push(['ice', event.Data.State]);

			if (event.Type === 'SignalingState')
				seen.push(['signaling', event.Data.State]);
		});
		rtc.Connect(false);

		var peer = rtc.Connection();
		var candidate = {candidate: 'candidate:1'};

		peer.ICE(candidate);
		peer.State('connected', 'completed', 'stable');

		await new Promise(function (resolve) {
			rtc.AddICECandidate(candidate, resolve);
		});

		expect(peer.Candidates).toEqual([candidate]);
		expect(seen).toEqual([
			['candidate', candidate],
			['connection', 'connected'],
			['ice', 'completed'],
			['signaling', 'stable']
		]);
	});

	it('remote datachannel receives data and Protocol decodes messages', function () {
		var protocol = unique('RTCProtocol');
		var packets = [];
		var raw = [];

		Elemenx.Network.Protocol(protocol, {
			Encode: function (value) { return JSON.stringify(value); },
			Decode: function (value) { return {Type: 'Packet', Data: JSON.parse(value)}; }
		});

		var rtc = Elemenx.Network.WebRTC({Protocol: protocol});

		rtc.On('Transport.Data', function (event) { raw.push(event.Data.Data); });
		rtc.On('Protocol.Packet', function (event) { packets.push(event.Data); });
		rtc.Connect(false);

		var remote = new FakeDataChannel('remote', {});

		rtc.Connection().RemoteChannel(remote);

		remote.Open();
		remote.Message('{"value":7}');

		expect(rtc.DataChannel()).toBe(remote);
		expect(raw).toEqual(['{"value":7}']);
		expect(packets).toEqual([{value: 7}]);
		expect(rtc.Send({reply: 8})).toBe(true);
		expect(remote.Sent).toEqual(['{"reply":8}']);
	});

	it('queue pressure reports Backpressure and BufferedAmountLow restores Drain/Writable', function () {
		var types = [];
		var rtc = Elemenx.Network.WebRTC({
			BufferHighWaterMark: 4,
			BufferLowWaterMark: 1,
			QueueHighWaterMark: 6,
			QueueLowWaterMark: 1
		});

		rtc.On('Transport', function (event) { types.push(event.Type); });
		rtc.Connect();

		var channel = rtc.DataChannel();

		channel.Open();

		channel.bufferedAmount = 5;

		expect(rtc.Send('ab')).toBe(false);
		expect(rtc.Writable()).toBe(false);
		expect(types).toContain('Backpressure');

		channel.Low(0);

		expect(types).toContain('BufferedAmountLow');
		expect(types).toContain('Drain');
		expect(rtc.Writable()).toBe(true);
	});

	it('Close invalidates stale peer/channel events and permits a clean reconnect', function () {
		var data = [];
		var types = [];
		var rtc = Elemenx.Network.WebRTC();

		rtc.On('Transport.Data', function (event) { data.push(event.Data.Data); });
		rtc.On('Transport', function (event) { types.push(event.Type); });
		rtc.Connect();

		var firstPeer = rtc.Connection();
		var firstChannel = rtc.DataChannel();

		firstChannel.Open();

		rtc.Close();

		expect(firstChannel.Closed).toBe(true);
		expect(firstPeer.Closed).toBe(true);
		expect(rtc.Connection()).toBeNull();
		expect(rtc.DataChannel()).toBeNull();

		firstChannel.Message('stale');

		firstPeer.ICE({candidate: 'stale'});

		expect(data).toEqual([]);

		rtc.Connect();

		var secondChannel = rtc.DataChannel();

		secondChannel.Open();
		secondChannel.Message('current');

		expect(FakeRTCPeerConnection.Instances.length).toBe(2);
		expect(data).toEqual(['current']);
		expect(types).toContain('BeforeClose');
		expect(types).toContain('Close');
	});

	it('Network Context applies protocol and WebRTC lifecycle listeners', function () {
		var protocol = unique('RTCContextProtocol');
		var context = unique('RTCContext');
		var seen = [];

		Elemenx.Network.Protocol(protocol, {
			Decode: function (value) { return {Type: 'Packet', Data: value}; }
		});
		Elemenx.Network.Context(context, {
			Protocol: protocol,
			BeforeConnect: function (event) { seen.push('before:' + event.Type); },
			On: {
				'Transport.Open': function (event) { seen.push('open:' + event.Type); },
				'Protocol.Packet': function (event) { seen.push('packet:' + event.Data); }
			}
		});

		var rtc = Elemenx.Network.WebRTC({}, context);

		rtc.Connect();

		var channel = rtc.DataChannel();

		channel.Open();
		channel.Message('hello');

		expect(seen).toEqual(['before:BeforeConnect', 'open:Open', 'packet:hello']);
	});
	it('owner Destroy closes peer/channel and ignores stale WebRTC events', function () {
		var name = unique('RTCOwner');
		var data = [];

		Elemenx.Component(name, {$Template: '<div></div>'});

		var component = Elemenx.Component(name)();
		var rtc = component.$Network().WebRTC();

		rtc.On('Transport.Data', function (event) { data.push(event.Data.Data); });
		rtc.Connect();

		var peer = FakeRTCPeerConnection.Instances[0];
		var channel = peer.Channels[0];

		channel.Open();

		component.$Destroy();

		expect(peer.Closed).toBe(true);
		expect(channel.Closed).toBe(true);

		channel.Message('stale');

		expect(data).toEqual([]);
	});
});