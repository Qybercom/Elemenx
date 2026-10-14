import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

/*
 * Frozen public surface. Any added, removed or retyped member fails here on purpose:
 * a public API change must be a deliberate edit of this file and docs/PUBLIC-API.md.
 * Lifecycle hook slots ($On*) are copied from definitions, so only their presence is pinned.
 */

var owned = [];

function surface (value, prefix, depth, result) {
	var keys = Object.keys(value).sort();
	var i = 0;

	result = result || [];

	while (i < keys.length) {
		var item = value[keys[i]];
		var type = item === null ? 'null' : typeof item;

		result.push(prefix + keys[i] + (/^\$On[A-Z]/.test(keys[i]) ? '' : ':' + type));

		if (depth > 1 && item && (type === 'function' || type === 'object') && !item.nodeType)
			surface(item, prefix + keys[i] + '.', depth - 1, result);

		i++;
	}

	return result;
}

function systemSurface (value) {
	return surface(value, '', 1).filter(function (entry) { return entry.charAt(0) === '$'; });
}

var Storage = ['Clear', 'Get', 'Has', 'Namespace', 'Remove', 'Set'];

function storage (name) {
	return ['Elemenx.Storage.' + name + ':object'].concat(Storage.map(function (method) { return 'Elemenx.Storage.' + name + '.' + method + ':function'; }));
}

describe('Regression: public API surface', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () {
		resetDOM();

		owned = [];
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('global Elemenx namespace', function () {
		expect(surface(Elemenx, 'Elemenx.', 3)).toEqual([
			'Elemenx.Application:function',
			'Elemenx.Bundle:function',
			'Elemenx.Component:function',
			'Elemenx.Directive:function',
			'Elemenx.Events:function',
			'Elemenx.Guard:function',
			'Elemenx.Library:function',
			'Elemenx.Messaging:function',
			'Elemenx.Messaging.Context:function',
			'Elemenx.Messaging.Origins:function',
			'Elemenx.Messaging.Window:function',
			'Elemenx.Network:object',
			'Elemenx.Network.Context:function',
			'Elemenx.Network.LongPolling:function',
			'Elemenx.Network.Metrics:function',
			'Elemenx.Network.Protocol:function',
			'Elemenx.Network.SSE:function',
			'Elemenx.Network.Stream:function',
			'Elemenx.Network.Transfer:function',
			'Elemenx.Network.TransferReceiver:function',
			'Elemenx.Network.WebRTC:function',
			'Elemenx.Network.WebSocket:function',
			'Elemenx.Network.XHR:function',
			'Elemenx.Pipe:function',
			'Elemenx.Resource:function',
			'Elemenx.Resource.Load:function',
			'Elemenx.Router:function',
			'Elemenx.RuntimeID:function',
			'Elemenx.Service:function',
			'Elemenx.ServiceWorker:function',
			'Elemenx.StartedAt:function',
			'Elemenx.Storage:function',
			'Elemenx.Storage.Context:function'
		].concat(storage('Cookie'), ['Elemenx.Storage.IndexedDB:function'], storage('Local'), storage('Session'), [
			'Elemenx.Template:function',
			'Elemenx.Template.Has:function',
			'Elemenx.Template.Loader:function',
			'Elemenx.Template.Reload:function',
			'Elemenx.Template.Remove:function',
			'Elemenx.Title:function',
			'Elemenx.WebWorker:function'
		]));
	});

	it('Component, Service and Application system members', async function () {
		var componentName = unique('SurfaceComponent');
		var serviceName = unique('SurfaceService');
		var applicationName = unique('SurfaceApplication');
		var service = null;

		Elemenx.Service(serviceName, {$OnCreate: function () { service = this; }});
		Elemenx.Component(componentName, {$Template: '<main></main>'});

		var component = Elemenx.Component(componentName)();

		owned.push(component);

		var application = Elemenx.Application(applicationName, {$Component: componentName, $Mount: '#mount'});

		owned.push(application);
		application.$Service(serviceName).$Name;
		await tick();

		expect(systemSurface(component)).toEqual([
			'$Application:function',
			'$Batch:function',
			'$Destroy:function',
			'$Element:function',
			'$Emit:function',
			'$Events:function',
			'$Generation:function',
			'$Messaging:function',
			'$Network:function',
			'$On:function',
			'$Parent:function',
			'$Ref:function',
			'$Router:function',
			'$Service:function',
			'$ServiceWorker:function',
			'$StartedAt:function',
			'$Storage:function',
			'$Title:function',
			'$Update:function',
			'$WebWorker:function'
		]);
		expect(service).not.toBeNull();
		expect(systemSurface(service)).toEqual([
			'$Application:function',
			'$Destroy:function',
			'$Events:function',
			'$Generation:function',
			'$Messaging:function',
			'$Network:function',
			'$Service:function',
			'$ServiceWorker:function',
			'$StartedAt:function',
			'$Storage:function',
			'$WebWorker:function'
		]);
		expect(systemSurface(application)).toEqual([
			'$Application:function',
			'$Component:function',
			'$Destroy:function',
			'$Events:function',
			'$Libraries:function',
			'$Messaging:function',
			'$Mount:function',
			'$Name:function',
			'$Network:function',
			'$OnError',
			'$OnPending',
			'$OnReady',
			'$Reload:function',
			'$Root:function',
			'$Router:function',
			'$Service:function',
			'$ServiceWorker:function',
			'$StartedAt:function',
			'$Storage:function',
			'$Template:function',
			'$Title:function',
			'$WebWorker:function'
		]);
	});
	it('public instances keep their methods', async function () {
		var Network = Elemenx.Network;
		var transport = {On: function () {}, Off: function () {}, Send: function () {
			return true;
		}};
		var socket = Elemenx.Events();
		var event = null;
		var templateID = unique('SurfaceTemplate');
		var remoteName = unique('SurfaceRemote');
		var localName = unique('SurfaceLocal');

		function names (value) {
			return Object.keys(value).filter(function (key) {
				return key.charAt(0) !== '_';
			}).sort();
		}

		expect(names(Network.XHR({URL: '/x'}))).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'Abort', 'Context', 'Data', 'Execute', 'Header', 'Method', 'Off', 'On', 'Protocol', 'URL', 'XHR']);
		expect(names(Network.Stream({URL: '/x'}))).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'Close', 'Connect', 'Context', 'Data', 'Header', 'Method', 'Off', 'On', 'Pause', 'Protocol', 'Resume', 'URL']);
		expect(names(Network.LongPolling({URL: '/x'}))).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'Close', 'Connect', 'Context', 'Data', 'Header', 'Method', 'Off', 'On', 'Protocol', 'Retry', 'URL', 'XHR']);
		expect(names(Network.SSE({URL: '/x'}))).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'Close', 'Connect', 'Context', 'Off', 'On', 'Protocol', 'Source', 'URL', 'WithCredentials']);
		expect(names(Network.WebSocket({URL: 'ws://127.0.0.1:1/x'}))).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'BinaryType', 'BufferHighWaterMark', 'BufferLowWaterMark', 'Close', 'Connect', 'Context', 'DrainInterval', 'Off', 'On', 'Protocol', 'Protocols', 'Send', 'Socket', 'URL', 'Writable']);
		expect(names(Network.WebRTC())).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'AcceptAnswer', 'AcceptOffer', 'AddICECandidate', 'BufferHighWaterMark', 'BufferLowWaterMark', 'Channel', 'ChannelName', 'Close', 'Configuration', 'Connect', 'Connection', 'Context', 'CreateOffer', 'DataChannel', 'Off', 'On', 'Protocol', 'QueueHighWaterMark', 'QueueLowWaterMark', 'Send', 'Writable']);
		expect(names(Network.Metrics({Transport: transport}))).toEqual(['$StartedAt', 'Active', 'Begin', 'Context', 'Destroy', 'End', 'Off', 'On', 'Reset', 'Snapshot', 'Start', 'Stop', 'Transport']);
		expect(names(Network.Transfer({Transport: transport}))).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'Abort', 'Active', 'ChunkSize', 'Context', 'Data', 'Destroy', 'Encoder', 'Execute', 'MaxRetries', 'Off', 'On', 'Pause', 'Paused', 'Phase', 'Receive', 'Resume', 'Retry', 'Send', 'Transport', 'WindowSize']);
		expect(names(Network.Transfer({Transport: transport, Data: new ArrayBuffer(1)}))).toEqual(['$ClosedAt', '$ConnectedAt', '$StartedAt', 'Abort', 'Active', 'ChunkSize', 'Context', 'Data', 'Destroy', 'Encoder', 'Execute', 'MaxRetries', 'Off', 'On', 'Pause', 'Paused', 'Phase', 'Receive', 'Resume', 'Retry', 'Send', 'Transport', 'WindowSize']);
		expect(names(Network.TransferReceiver({Transport: transport}))).toEqual(['$StartedAt', 'Context', 'Destroy', 'Off', 'On', 'Receive', 'Transport']);
		expect(names(Elemenx.Storage.Local.Namespace('surface'))).toEqual(['Clear', 'Get', 'Has', 'Namespace', 'Remove', 'Set']);
		expect(names(Elemenx.Storage())).toEqual(['Cookie', 'IndexedDB', 'Local', 'Session']);
		expect(names(Elemenx.Storage.IndexedDB(unique('surface-db'), {Version: 1, Stores: {items: {}}}))).toEqual(['Close', 'Delete', 'Store', 'Transaction']);
		expect(names(Elemenx.Events())).toEqual(['Channels', 'Deliver', 'Destroy', 'Emit', 'ID', 'Off', 'On', 'Pipe']);
		expect(names(Elemenx.Messaging())).toEqual(['Channels', 'Deliver', 'Destroy', 'ID', 'Off', 'On', 'Pipe', 'Send']);

		socket.On('surface', function (value) {
			event = value;
		});
		socket.Emit('surface', 1);

		expect(names(event)).toEqual(['Channel', 'Data', 'Is', 'Source']);

		Elemenx.Template(templateID, '<b>remote</b>');
		Elemenx.Component(remoteName, {$TemplateID: templateID});
		Elemenx.Component(localName, {$Template: '<main></main>'});

		var remote = Elemenx.Component(remoteName)({});
		var local = Elemenx.Component(localName)({});

		owned.push(remote, local);

		await tick();

		expect(names(remote)).toEqual(['$Application', '$Destroy', '$Element', '$Generation', '$On', '$Parent', '$Ref', '$Update']);
		expect(names(local.$Network())).toEqual(['LongPolling', 'Metrics', 'Protocol', 'SSE', 'Stream', 'Transfer', 'TransferReceiver', 'WebRTC', 'WebSocket', 'XHR']);
		expect(names(local.$Storage())).toEqual(['Cookie', 'IndexedDB', 'Local', 'Session']);
		expect(names(local.$Events())).toEqual(['Channels', 'Deliver', 'Destroy', 'Emit', 'ID', 'Off', 'On', 'Pipe']);
		expect(names(local.$Messaging())).toEqual(['Channels', 'Deliver', 'Destroy', 'ID', 'Off', 'On', 'Pipe', 'Send']);
		expect(names(local.$Router())).toEqual(['Back', 'Current', 'Forward', 'Go', 'On', 'Pending', 'Replace']);

		var application = Elemenx.Application(unique('SurfaceInstances'), {$Component: localName, $Mount: '#mount'});

		owned.push(application);

		await tick();

		expect(names(application.$Network())).toEqual(['LongPolling', 'Metrics', 'Protocol', 'SSE', 'Stream', 'Transfer', 'TransferReceiver', 'WebRTC', 'WebSocket', 'XHR']);
		expect(names(application.$Template)).toEqual(['Has', 'Loader', 'Reload', 'Remove']);

		var router = Elemenx.Router({Root: application.$Component(), Routes: []});

		expect(names(router)).toEqual(['Back', 'Current', 'Destroy', 'Forward', 'Go', 'OffOwner', 'On', 'Owner', 'Replace', 'Start']);
		expect(names(router.Owner(local))).toEqual(['On']);
	});

});
