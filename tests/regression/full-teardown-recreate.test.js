import {afterEach,beforeAll,beforeEach,describe,expect,it} from 'vitest';
import {loadElemenx,resetDOM,unique} from '../setup.js';

var applications=[];

function track (application) {
	applications.push(application);
	return application;
}

function forget (application) {
	var index=applications.indexOf(application);
	if (index !== -1) applications.splice(index,1);
}

describe('Regression: full Application teardown and recreate',function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () {
		resetDOM();
		document.body.innerHTML='<div id="app"></div>';
		applications=[];
	});
	afterEach(function () {
		while (applications.length) {
			if (applications[0] && applications[0].Destroy) applications[0].Destroy();
			applications.shift();
		}
	});

	it('releases the Application registry name so the same Application can be created again',function () {
		var applicationName=unique('RecreateApplication');
		var componentName=unique('RecreateRoot');
		Elemenx.Component(componentName,{Template:'<div>root</div>'});
		var first=track(Elemenx.Application(applicationName,{Component:componentName,Mount:'#app'}));
		first.Destroy();
		forget(first);
		expect(Elemenx.Application(applicationName)).toBeNull();
		var second=null;
		expect(function () {
			second=track(Elemenx.Application(applicationName,{Component:componentName,Mount:'#app'}));
		}).not.toThrow();
		expect(second).not.toBe(first);
		expect(second.Component()).not.toBeNull();
	});

	it('creates fresh owned resources after teardown while old handles remain permanently inert',function () {
		var applicationName=unique('ResourceRecreateApplication');
		var componentName=unique('ResourceRecreateRoot');
		var serviceName=unique('ResourceRecreateService');
		var serviceCreated=0;
		var serviceDestroyed=0;
		Elemenx.Component(componentName,{Template:'<div>resources</div>'});
		Elemenx.Service(serviceName,{
			ElemenxOnCreate:function () { this.Generation=++serviceCreated; },
			ElemenxOnDestroy:function () { serviceDestroyed++; }
		});
		var first=track(Elemenx.Application(applicationName,{Component:componentName,Mount:'#app'}));
		var oldService=first.Service(serviceName);
		var oldGeneration=oldService.Generation;
		var oldMessaging=first.Messaging();
		var oldNetwork=first.Network();
		first.Destroy();
		forget(first);
		expect(serviceDestroyed).toBe(1);
		expect(function () { first.Messaging(); }).toThrow();
		expect(function () { first.Network(); }).toThrow();
		expect(function () { oldMessaging.Send(unique('dead-channel'),{Value:1}); }).toThrow();
		expect(function () { oldNetwork.XHR({URL:'/dead'}); }).toThrow();
		var second=track(Elemenx.Application(applicationName,{Component:componentName,Mount:'#app'}));
		var newService=second.Service(serviceName);
		var newGeneration=newService.Generation;
		expect(newGeneration).not.toBe(oldGeneration);
		expect(serviceCreated).toBe(2);
		expect(function () { second.Messaging(); }).not.toThrow();
		expect(function () { second.Network(); }).not.toThrow();
	});

	it('releases the mount completely so a recreated Application owns a clean root tree',function () {
		var applicationName=unique('MountRecreateApplication');
		var componentName=unique('MountRecreateRoot');
		var created=0;
		var destroyed=0;
		Elemenx.Component(componentName,{
			Template:'<button @click="Increment">{{Count}}</button>',
			Count:0,
			ElemenxOnCreate:function () { created++; },
			ElemenxOnDestroy:function () { destroyed++; },
			Increment:function () { this.Count++; }
		});
		var first=track(Elemenx.Application(applicationName,{Component:componentName,Mount:'#app'}));
		var firstRoot=first.Component();
		firstRoot.Increment();
		expect(document.querySelector('#app').textContent).toBe('1');
		first.Destroy();
		forget(first);
		expect(destroyed).toBe(1);
		expect(document.querySelector('#app').textContent).toBe('');
		var second=track(Elemenx.Application(applicationName,{Component:componentName,Mount:'#app'}));
		expect(second.Component()).not.toBe(firstRoot);
		expect(created).toBe(2);
		expect(document.querySelector('#app').textContent).toBe('0');
		second.Component().Increment();
		expect(document.querySelector('#app').textContent).toBe('1');
	});
});