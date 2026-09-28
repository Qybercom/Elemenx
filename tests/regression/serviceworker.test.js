import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

var originalDescriptor;
var handles=[];

function emitter () {
	var listeners={};
	return {
		addEventListener:function (name,callback) {
			if (!listeners[name]) listeners[name]=[];
			listeners[name].push(callback);
		},
		removeEventListener:function (name,callback) {
			var list=listeners[name] || [];
			var i=list.indexOf(callback);
			if (i!==-1) list.splice(i,1);
		},
		emit:function (name,event) {
			var list=(listeners[name] || []).slice();
			var i=0;
			while (i<list.length) {
				list[i](event || {});
				i++;
			}
		}
	};
}

function fakeEnvironment (options) {
	var container=emitter();
	var worker=emitter();
	var registration=emitter();
	var registered=true;

	options=options || {};
	worker.state='activated';
	worker.messages=[];
	worker.postMessage=function (packet) {
		worker.messages.push(packet);
	};

	registration.active=options.active===false ? null : worker;
	registration.waiting=null;
	registration.installing=null;
	registration.updateCalls=0;
	registration.unregisterCalls=0;
	registration.update=function () {
		registration.updateCalls++;
		return Promise.resolve();
	};
	registration.unregister=function () {
		registration.unregisterCalls++;
		registered=false;
		return Promise.resolve(true);
	};

	container.controller=options.controlled===false ? null : worker;
	container.registerCalls=[];
	container.register=function (url,value) {
		container.registerCalls.push({URL:url,Options:value});
		registered=true;
		return Promise.resolve(registration);
	};
	container.getRegistration=function () {
		return Promise.resolve(registered ? registration : undefined);
	};

	Object.defineProperty(navigator,'serviceWorker',{
		configurable:true,
		value:container
	});

	return {
		Container:container,
		Worker:worker,
		Registration:registration
	};
}

function service (environment, definition) {
	var name=unique('ServiceWorker');
	var handle=Elemenx.ServiceWorker(name,definition || {
		Script:'/sw-application.js',
		Scope:'/sw-scope/',
		Channel:name
	});
	handles.push(handle);
	return handle;
}

describe('Regression: ServiceWorker registration, lifecycle and messaging bridge', function () {
	beforeAll(async function () {
		await loadElemenx();
		originalDescriptor=Object.getOwnPropertyDescriptor(navigator,'serviceWorker');
	});
	beforeEach(function () {
		resetDOM();
		handles=[];
	});
	afterEach(function () {
		while (handles.length) handles.pop().Destroy();
		if (originalDescriptor) Object.defineProperty(navigator,'serviceWorker',originalDescriptor);
		else delete navigator.serviceWorker;
	});

	it('registers through the Elemenx service-worker bootstrap URL and exposes metadata', async function () {
		var env=fakeEnvironment();
		var name=unique('SWRegister');
		var handle=Elemenx.ServiceWorker(name,{
			Script:'/application-worker.js',
			Scope:'/worker-scope/',
			Channel:'jobs'
		});
		handles.push(handle);

		expect(handle.Name()).toBe(name);
		expect(handle.Channel()).toBe('jobs');
		expect(handle.Scope()).toBe('/worker-scope/');
		expect(handle.State()).toBe('Registering');
		expect(await waitFor(function () { return handle.State()==='Active'; },1000)).toBe(true);
		expect(env.Container.registerCalls.length).toBe(1);
		expect(env.Container.registerCalls[0].Options).toEqual({scope:'/worker-scope/'});
		expect(env.Container.registerCalls[0].URL).toContain('elemenx_service_worker=1');
		expect(env.Container.registerCalls[0].URL).toContain('elemenx_script=');
		expect(env.Container.registerCalls[0].URL).toContain('elemenx_name=' + encodeURIComponent(name));
		expect(env.Container.registerCalls[0].URL).toContain('elemenx_channel=jobs');
		expect(handle.Registration()).toBe(env.Registration);
		expect(handle.Reachable()).toBe(true);
	});

	it('reports Registered/Controlled and delegates Update to the native registration', async function () {
		var env=fakeEnvironment();
		var handle=service(env);
		expect(await waitFor(function () { return handle.State()==='Active'; },1000)).toBe(true);

		var registered=null;
		handle.Registered(function (value) { registered=value; });
		expect(await waitFor(function () { return registered!==null; },1000)).toBe(true);
		expect(registered).toBe(true);
		expect(handle.Controlled()).toBe(true);

		handle.Update();
		await tick();
		expect(env.Registration.updateCalls).toBe(1);
	});

	it('tracks updatefound Installing -> Waiting -> Active transitions', async function () {
		var env=fakeEnvironment();
		var handle=service(env);
		var states=[];
		expect(await waitFor(function () { return handle.State()==='Active'; },1000)).toBe(true);
		handle.On('Installing',function () { states.push('Installing'); });
		handle.On('Waiting',function () { states.push('Waiting'); });

		var installing=emitter();
		installing.state='installing';
		env.Registration.active=null;
		env.Registration.installing=installing;
		env.Registration.emit('updatefound');
		expect(handle.State()).toBe('Installing');

		installing.state='installed';
		env.Registration.waiting={};
		installing.emit('statechange');
		expect(handle.State()).toBe('Waiting');
		expect(states).toEqual(['Installing','Waiting']);

		var updatedWorker=emitter();
		updatedWorker.state='activated';
		updatedWorker.messages=[];
		updatedWorker.postMessage=function (packet) {
			updatedWorker.messages.push(packet);
		};
		env.Registration.active=updatedWorker;
		env.Registration.waiting=null;
		env.Container.controller=updatedWorker;
		env.Container.emit('controllerchange');
		expect(handle.State()).toBe('Active');
		expect(handle.Reachable()).toBe(true);
	});

	it('Unregister verifies the scope is gone and reaches Unregistered', async function () {
		var env=fakeEnvironment();
		var handle=service(env);
		expect(await waitFor(function () { return handle.State()==='Active'; },1000)).toBe(true);

		handle.Unregister();
		expect(handle.State()).toBe('Unregistering');
		expect(await waitFor(function () { return handle.State()==='Unregistered'; },1000)).toBe(true);
		expect(env.Registration.unregisterCalls).toBe(1);

		var registered=null;
		handle.Registered(function (value) { registered=value; });
		expect(await waitFor(function () { return registered!==null; },1000)).toBe(true);
		expect(registered).toBe(false);
	});

	it('active worker is attached to Messaging and Destroy detaches the bridge', async function () {
		var env=fakeEnvironment();
		var channel=unique('sw-channel');
		var handle=service(env,{Script:'/sw-application.js',Scope:'/sw-message/',Channel:channel});
		expect(await waitFor(function () { return handle.Reachable(); },1000)).toBe(true);

		var socket=Elemenx.Messaging();
		socket.Send(channel,{value:7});
		expect(env.Worker.messages.length).toBe(1);
		expect(env.Worker.messages[0].ElemenxMessaging).toBe(true);
		expect(env.Worker.messages[0].Channel).toBe(channel);
		expect(env.Worker.messages[0].Data).toEqual({value:7});

		handle.Destroy();
		handles.splice(handles.indexOf(handle),1);
		socket.Send(channel,{value:8});
		expect(env.Worker.messages.length).toBe(1);
		socket.Destroy();
	});

	it('routes worker messages back through Messaging and ignores a different worker source', async function () {
		var env=fakeEnvironment();
		var channel=unique('sw-receive');
		var handle=service(env,{Script:'/sw-application.js',Scope:'/sw-receive/',Channel:channel});
		expect(await waitFor(function () { return handle.Reachable(); },1000)).toBe(true);

		var socket=Elemenx.Messaging(), received=[];
		socket.On(channel,function (event) { received.push(event.Data); });
		env.Container.emit('message',{
			source:{},
			data:{ElemenxMessaging:true,ElemenxMessagingProtocol:1,Source:'remote',Channel:channel,Data:'wrong'}
		});
		env.Container.emit('message',{
			source:env.Worker,
			data:{ElemenxMessaging:true,ElemenxMessagingProtocol:1,Source:'remote',Channel:channel,Data:'right'}
		});
		expect(received).toEqual(['right']);
		socket.Destroy();
	});

	it('Destroy is idempotent and a destroyed handle cannot Register again', async function () {
		var env=fakeEnvironment();
		var handle=service(env);
		expect(await waitFor(function () { return handle.State()==='Active'; },1000)).toBe(true);
		handle.Destroy();
		handle.Destroy();
		handles.splice(handles.indexOf(handle),1);
		expect(handle.Reachable()).toBe(false);
		expect(function () { handle.Register(); }).toThrow();
	});

	it('component Destroy tears down ServiceWorker handles created through its owner accessor', async function () {
		var env=fakeEnvironment();
		var workerName=unique('OwnedComponentSW');
		var componentName=unique('OwnedServiceWorkerComponent');
		var owned=null;

		Elemenx.Component(componentName,{
			Template:'<div></div>',
			ElemenxOnCreate:function () {
				owned=this.ServiceWorker(workerName,{
					Script:'/owned-component-worker.js',
					Scope:'/owned-component/',
					Channel:workerName
				});
			}
		});

		var component=Elemenx.Component(componentName)();
		expect(await waitFor(function () { return owned && owned.Reachable(); },1000)).toBe(true);
		component.Destroy();
		expect(owned.Reachable()).toBe(false);
		expect(function () { owned.Register(); }).toThrow();
	});

	it('service Destroy tears down ServiceWorker handles created through its owner accessor', async function () {
		var env=fakeEnvironment();
		var workerName=unique('OwnedServiceSW');
		var serviceName=unique('ServiceWorkerOwnerService');
		var owned=null;

		Elemenx.Service(serviceName,{
			ElemenxOnCreate:function () {
				owned=this.ServiceWorker(workerName,{
					Script:'/owned-service-worker.js',
					Scope:'/owned-service/',
					Channel:workerName
				});
			}
		});

		var serviceHandle=Elemenx.Service(serviceName);
		serviceHandle.Application();
		expect(await waitFor(function () { return owned && owned.Reachable(); },1000)).toBe(true);
		serviceHandle.Destroy();
		expect(owned.Reachable()).toBe(false);
		expect(function () { owned.Register(); }).toThrow();
	});
});