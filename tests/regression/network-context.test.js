import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Network contexts / ownership', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('Network Context composes dependencies and applies Configure in deterministic order', function () {
		var base=unique('NetBase');
		var child=unique('NetChild');
		var order=[];

		Elemenx.Network.Context(base,{
			Configure:function (resource,type) {
				order.push('base:'+type);
				resource.__base=true;
			}
		});
		Elemenx.Network.Context(child,{
			Contexts:[base],
			Configure:function (resource,type) {
				order.push('child:'+type);
				resource.__child=true;
			}
		});

		var metrics=Elemenx.Network.Metrics({},child);
		expect(metrics.__base).toBe(true);
		expect(metrics.__child).toBe(true);
		expect(order).toEqual(['child:Metrics','base:Metrics']);
		metrics.Destroy();
	});

	it('Context Configure=false stops that definition without preventing local resource creation', function () {
		var name=unique('NetStop');
		var called=0;
		Elemenx.Network.Context(name,{
			Configure:function () {
				called++;
				return false;
			},
			Contexts:[unique('NeverResolved')]
		});
		var metrics=Elemenx.Network.Metrics({},name);
		expect(called).toBe(1);
		expect(metrics.Snapshot()).toBeTruthy();
		metrics.Destroy();
	});

	it('Metrics emits namespaced lifecycle events and tracks Active state', function () {
		var metrics=Elemenx.Network.Metrics();
		var events=[];
		metrics.On('Metrics.Start',function () { events.push('Start'); });
		metrics.On('Metrics.Begin',function () { events.push('Begin'); });
		metrics.On('Metrics.End',function () { events.push('End'); });
		metrics.On('Metrics.Stop',function () { events.push('Stop'); });

		expect(metrics.Active()).toBe(false);
		metrics.Start();
		metrics.Begin();
		expect(metrics.Active()).toBe(true);
		metrics.End();
		expect(metrics.Active()).toBe(false);
		metrics.Stop();
		expect(events).toEqual(['Start','Begin','End','Stop']);
		metrics.Destroy();
	});

	it('Metrics Reset clears directional counters while keeping a running meter usable', function () {
		var metrics=Elemenx.Network.Metrics();
		metrics.Start().Begin();
		metrics.Reset();
		var snapshot=metrics.Snapshot();
		expect(metrics.Active()).toBe(false);
		expect(snapshot.TX.Bytes).toBe(0);
		expect(snapshot.RX.Bytes).toBe(0);
		expect(snapshot.Total).toBe(0);
		expect(snapshot.Running).toBe(true);
		metrics.Begin().End().Stop().Destroy();
	});
});