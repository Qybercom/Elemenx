import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Services lifecycle ownership', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	function application (service) {
		var component=unique('ServiceLifecycleComponent');
		Elemenx.Component(component,{$Template:'<div></div>'});
		return Elemenx.Application(unique('ServiceLifecycleApplication'),{$Component:component,$Mount:'#mount'});
	}

	it('destroys an instantiated application service when its Application is destroyed', function () {
		var service=unique('OwnedService'), destroyed=0;
		Elemenx.Service(service,{$OnDestroy:function () { destroyed++; }});
		var app=application(service);
		var instance=app.$Service(service);
		instance.$Application();
		app.$Destroy();
		expect(destroyed).toBe(1);
	});

	it('does not create or destroy an application service that was never instantiated', function () {
		var service=unique('UnusedService'), created=0, destroyed=0;
		Elemenx.Service(service,{
			$OnCreate:function () { created++; },
			$OnDestroy:function () { destroyed++; }
		});
		var app=application(service);
		app.$Destroy();
		expect(created).toBe(0);
		expect(destroyed).toBe(0);
	});

	it('Service.Destroy is idempotent and does not instantiate a replacement on repeated destroy', function () {
		var service=unique('DestroyService'), created=0, destroyed=0;
		Elemenx.Service(service,{
			$OnCreate:function () { created++; },
			$OnDestroy:function () { destroyed++; }
		});
		var app=application(service);
		var handle=app.$Service(service);
		handle.$Application();
		expect(created).toBe(1);
		handle.$Destroy();
		handle.$Destroy();
		expect(created).toBe(1);
		expect(destroyed).toBe(1);
		app.$Destroy();
		expect(created).toBe(1);
		expect(destroyed).toBe(1);
	});

	it('removes destroyed application instances from service redefinition lifecycle', function () {
		var service=unique('RedefinedService'), destroyed=0;
		Elemenx.Service(service,{$OnDestroy:function () { destroyed++; }});
		var app=application(service);
		var handle=app.$Service(service);
		handle.$Application();
		handle.$Destroy();
		expect(destroyed).toBe(1);
		Elemenx.Service(service,{Value:2});
		expect(destroyed).toBe(1);
		app.$Destroy();
	});
});