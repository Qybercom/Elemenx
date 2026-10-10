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
});
