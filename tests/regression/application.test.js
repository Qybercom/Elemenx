import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';

var applications=[];

function createApplication (name, definition) {
	var app=Elemenx.Application(name,definition);
	applications.push(app);
	return app;
}

function destroyApplication (app) {
	var i=applications.indexOf(app);
	if (app && app.Destroy) app.Destroy();
	if (i!==-1) applications.splice(i,1);
}

describe('Regression: Application public facade and ownership', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () {
		resetDOM();
		applications=[];
	});
	afterEach(function () {
		while (applications.length) destroyApplication(applications[0]);
	});

	it('registers by name and exposes Name / Application / Component facade', function () {
		var component=unique('ApplicationRoot');
		var name=unique('Application');
		Elemenx.Component(component,{Template:'<main class="application-root">{{value}}</main>'});

		var app=createApplication(name,{
			Component:component,
			Mount:'#mount',
			State:{value:'ready'}
		});

		expect(Elemenx.Application(name)).toBe(app);
		expect(app.Name()).toBe(name);
		expect(app.Root()).toBeNull();
		expect(app.Application()).toBe(app);
		expect(app.Component()).not.toBeNull();
		expect(app.Component().Application()).toBe(app);
		expect(document.querySelector('.application-root').textContent).toBe('ready');
	});

	it('Bootstrap runs with the Application facade before root construction', function () {
		var component=unique('BootstrapRoot');
		var name=unique('BootstrapApplication');
		var seen=null;
		Elemenx.Component(component,{Template:'<div class="bootstrap-root"></div>'});

		var app=createApplication(name,{
			Component:component,
			Mount:'#mount',
			Bootstrap:function () {
				seen={
					This:this,
					Name:this.Name(),
					Component:this.Component()
				};
			}
		});

		expect(seen.This).toBe(app);
		expect(seen.Name).toBe(name);
		expect(seen.Component).toBeNull();
		expect(app.Component()).not.toBeNull();
	});

	it('keeps two Application component trees and state isolated', async function () {
		var ca=unique('ApplicationAComponent');
		var cb=unique('ApplicationBComponent');
		document.body.innerHTML='<div id="application-a"></div><div id="application-b"></div>';
		Elemenx.Component(ca,{Template:'<button class="application-a">{{value}}</button>'});
		Elemenx.Component(cb,{Template:'<button class="application-b">{{value}}</button>'});

		var a=createApplication(unique('ApplicationA'),{
			Component:ca,
			Mount:'#application-a',
			State:{value:'A'}
		});
		var b=createApplication(unique('ApplicationB'),{
			Component:cb,
			Mount:'#application-b',
			State:{value:'B'}
		});

		expect(a.Component().Application()).toBe(a);
		expect(b.Component().Application()).toBe(b);
		a.Component().State.value='A2';
		await tick();
		expect(document.querySelector('.application-a').textContent).toBe('A2');
		expect(document.querySelector('.application-b').textContent).toBe('B');
	});

	it('Destroy tears down only the owned component tree and is idempotent', function () {
		var destroyedA=0, destroyedB=0;
		var ca=unique('DestroyAComponent');
		var cb=unique('DestroyBComponent');
		document.body.innerHTML='<div id="destroy-a"></div><div id="destroy-b"></div>';
		Elemenx.Component(ca,{
			Template:'<div class="destroy-a">A</div>',
			ElemenxOnDestroy:function () { destroyedA++; }
		});
		Elemenx.Component(cb,{
			Template:'<div class="destroy-b">B</div>',
			ElemenxOnDestroy:function () { destroyedB++; }
		});

		var a=createApplication(unique('DestroyA'),{Component:ca,Mount:'#destroy-a'});
		var b=createApplication(unique('DestroyB'),{Component:cb,Mount:'#destroy-b'});
		destroyApplication(a);
		a.Destroy();

		expect(destroyedA).toBe(1);
		expect(destroyedB).toBe(0);
		expect(a.Component()).toBeNull();
		expect(b.Component()).not.toBeNull();
		expect(document.querySelector('.destroy-b')).not.toBeNull();
	});

	it('Application Service instances are owned/scoped independently and receive their Application', function () {
		var service=unique('ApplicationService');
		var ca=unique('ServiceAComponent');
		var cb=unique('ServiceBComponent');
		document.body.innerHTML='<div id="service-a"></div><div id="service-b"></div>';
		Elemenx.Component(ca,{Template:'<div>A</div>'});
		Elemenx.Component(cb,{Template:'<div>B</div>'});
		Elemenx.Service(service,{
			Value:0,
			Increment:function () { this.Value++; return this.Value; }
		});

		var a=createApplication(unique('ServiceA'),{Component:ca,Mount:'#service-a'});
		var b=createApplication(unique('ServiceB'),{Component:cb,Mount:'#service-b'});
		var sa=a.Service(service), sb=b.Service(service);

		expect(a.Service(service)).toBe(sa);
		expect(b.Service(service)).toBe(sb);
		expect(sa).not.toBe(sb);
		expect(sa.Application()).toBe(a);
		expect(sb.Application()).toBe(b);
		expect(sa.Increment()).toBe(1);
		expect(sa.Increment()).toBe(2);
		expect(sb.Increment()).toBe(1);
	});

	it('Application WebWorker handles are application-owned and Destroy removes only that owner', function () {
		var component=unique('WorkerOwnerRoot');
		var workerName=unique('OwnedWorker');
		Elemenx.Component(component,{Template:'<div></div>'});
		var app=createApplication(unique('WorkerOwner'),{Component:component,Mount:'#mount'});
		var worker=app.WebWorker(workerName,{
			Script:'/workers/webworker-bridge.js',
			StartMode:'manual',
			Channel:unique('owned-worker-channel')
		});

		expect(app.WebWorker(workerName)).toBe(worker);
		destroyApplication(app);
		expect(worker.State()).toBe('Stopped');
		expect(function () { worker.Start(); }).toThrow();
	});

	it('Network / Storage / Messaging facade setters resolve contexts and Application owns created resources', function () {
		var component=unique('ContextFacadeRoot');
		Elemenx.Component(component,{Template:'<div></div>'});
		var app=createApplication(unique('ContextFacadeApplication'),{Component:component,Mount:'#mount'});
		var network=unique('network-context');
		var storage=unique('storage-context');
		var messaging=unique('messaging-context');
		var channel=unique('application-message');

		expect(app.Network(network,{Configure:function (resource) { resource.__applicationContext=true; }})).toBe(app);
		expect(app.Storage(storage,{Namespace:'application'})).toBe(app);
		expect(app.Messaging(messaging,{Channels:[channel]})).toBe(app);

		var metrics=app.Network(network).Metrics();
		var local=app.Storage(storage).Local;
		var socket=app.Messaging(messaging);

		expect(metrics.__applicationContext).toBe(true);
		local.Set('value','ok');
		expect(localStorage.getItem('application.value')).not.toBeNull();
		expect(socket.Channels().indexOf(channel)).not.toBe(-1);

		destroyApplication(app);
		expect(function () { socket.Send(channel,'after-destroy'); }).toThrow();
		expect(metrics.Snapshot().Running).toBe(false);
		expect(metrics.Transport()).toBeNull();
	});
});