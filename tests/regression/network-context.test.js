import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Network contexts / ownership', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('Network Context composes dependencies and applies Configure in deterministic order', function () {
		var base = unique('NetBase');
		var child = unique('NetChild');
		var order = [];

		Elemenx.Network.Context(base, {
			Configure: function (resource, type) {
				order.push('base:' + type);

				resource.__base = true;
			}
		});
		Elemenx.Network.Context(child, {
			Contexts: [base],
			Configure: function (resource, type) {
				order.push('child:' + type);

				resource.__child = true;
			}
		});

		var metrics = Elemenx.Network.Metrics({}, child);

		expect(metrics.__base).toBe(true);
		expect(metrics.__child).toBe(true);
		expect(order).toEqual(['child:Metrics', 'base:Metrics']);

		metrics.Destroy();
	});

	it('Context Configure=false stops that definition without preventing local resource creation', function () {
		var name = unique('NetStop');
		var called = 0;

		Elemenx.Network.Context(name, {
			Configure: function () {
				called++;

				return false;
			},
			Contexts: [unique('NeverResolved')]
		});

		var metrics = Elemenx.Network.Metrics({}, name);

		expect(called).toBe(1);
		expect(metrics.Snapshot()).toBeTruthy();

		metrics.Destroy();
	});

	it('Metrics with a Transport starts monitoring automatically', function () {
		var callbacks = {};
		var transport = {
			On: function (name, callback) { callbacks[name] = callback; },
			Off: function (name, callback) {
				if (callbacks[name] === callback)
					delete callbacks[name];
			}
		};
		var metrics = Elemenx.Network.Metrics({Transport: transport});

		expect(metrics.Snapshot().Running).toBe(true);

		callbacks['Transport.AfterSend']({Data: {Data: 'hello'}});

		expect(metrics.Snapshot().TX.Bytes).toBe(5);

		metrics.Destroy();
	});

	it('Metrics counts strings as UTF-8 bytes', function () {
		var callbacks = {};
		var metrics = Elemenx.Network.Metrics({Transport: {
			On: function (name, callback) {
				callbacks[name] = callback;
			},
			Off: function () {}
		}});

		callbacks['Transport.AfterSend']({Data: {Data: 'ыы'}});
		callbacks['Transport.Data']({Data: {Data: new Uint8Array(3)}});

		expect(metrics.Snapshot().TX.Bytes).toBe(4);
		expect(metrics.Snapshot().RX.Bytes).toBe(3);

		metrics.Destroy();
	});

	it('Metrics emits namespaced lifecycle events and tracks Active state', function () {
		var metrics = Elemenx.Network.Metrics();
		var events = [];

		metrics.On('Metrics.Start', function () { events.push('Start'); });
		metrics.On('Metrics.Begin', function () { events.push('Begin'); });
		metrics.On('Metrics.End', function () { events.push('End'); });
		metrics.On('Metrics.Stop', function () { events.push('Stop'); });

		expect(metrics.Active()).toBe(false);

		metrics.Start();
		metrics.Begin();

		expect(metrics.Active()).toBe(true);

		metrics.End();

		expect(metrics.Active()).toBe(false);

		metrics.Stop();

		expect(events).toEqual(['Start', 'Begin', 'End', 'Stop']);

		metrics.Destroy();
	});

	it('Metrics Reset clears directional counters while keeping a running meter usable', function () {
		var metrics = Elemenx.Network.Metrics();

		metrics.Start().Begin();
		metrics.Reset();

		var snapshot = metrics.Snapshot();

		expect(metrics.Active()).toBe(false);
		expect(snapshot.TX.Bytes).toBe(0);
		expect(snapshot.RX.Bytes).toBe(0);
		expect(snapshot.Total).toBe(0);
		expect(snapshot.Running).toBe(true);

		metrics.Begin().End().Stop().Destroy();
	});

	function direction (bytes, speed, average, min, max, elapsed, active) {
		return {Bytes: bytes, Speed: speed, SpeedAvg: average, SpeedMin: min, SpeedMax: max, MeasureElapsed: elapsed, Active: active};
	}

	function totals (total, elapsed, measured, active, running) {
		return {Total: total, Elapsed: elapsed, MeasureElapsed: measured, Active: active, Running: running};
	}

	it('Metrics measures directional bytes, speeds and measured time against the performance clock', function () {
		var clock = 1000;
		var callbacks = {};
		var updates = 0;
		var spy = vi.spyOn(performance, 'now').mockImplementation(function () {
			return clock;
		});
		var metrics = Elemenx.Network.Metrics({Window: 250, Interval: 50, Transport: {
			On: function (name, callback) {
				callbacks[name] = callback;
			},
			Off: function (name, callback) {
				if (callbacks[name] === callback)
					delete callbacks[name];
			}
		}});
		var snapshots = [];

		metrics.On('Metrics.Update', function () {
			updates++;
		});
		metrics.Begin();

		clock = 1010;

		callbacks['Transport.BeforeRequest']();
		callbacks['Transport.RequestProgress']({Data: {loaded: 100}});

		clock = 1060;

		callbacks['Transport.RequestProgress']({Data: {loaded: 300}});

		clock = 1100;

		callbacks['Transport.AfterRequest']();

		clock = 1110;

		callbacks['Transport.ResponseProgress']({Data: {loaded: 50}});

		clock = 1120;

		callbacks['Transport.Data']({Data: {Data: 'abc'}});

		clock = 1130;

		snapshots.push(metrics.Snapshot());

		clock = 1200;

		metrics.End();

		snapshots.push(metrics.Snapshot());

		callbacks['Transport.AfterSend']({Data: 'xy'});

		snapshots.push(metrics.Snapshot());

		clock = 1300;

		metrics.Reset();

		snapshots.push(metrics.Snapshot());

		clock = 1400;

		metrics.Stop();

		snapshots.push(metrics.Snapshot());

		metrics.Destroy();

		spy.mockRestore();

		expect(callbacks).toEqual({});

		/* while measuring: TX finished after 90 ms, RX is still receiving */
		expect(snapshots[0]).toEqual(Object.assign({
			TX: direction(300, 0, 300 * 1000 / 90, 2000, 3000, 90, false),
			RX: direction(53, 311.7647058823529, 53 * 1000 / 20, 331.25, 333.3333333333333, 20, true)
		}, totals(353, 130, 130, true, true)));

		/* End closes RX with at least one Interval and freezes the live speed */
		expect(snapshots[1]).toEqual(Object.assign({
			TX: direction(300, 0, 300 * 1000 / 90, 2000, 3000, 90, false),
			RX: direction(53, 0, 53 * 1000 / 90, 331.25, 333.3333333333333, 90, false)
		}, totals(353, 200, 200, false, true)));

		/* traffic after End still counts bytes */
		expect(snapshots[2].TX.Bytes).toBe(302);
		expect(snapshots[2].Total).toBe(355);

		/* Reset clears everything but keeps the meter running; Stop freezes Elapsed */
		expect(snapshots[3]).toEqual(Object.assign({
			TX: direction(0, 0, 0, 0, 0, 0, false),
			RX: direction(0, 0, 0, 0, 0, 0, false)
		}, totals(0, 0, 0, false, true)));
		expect(snapshots[4]).toEqual(Object.assign({
			TX: direction(0, 0, 0, 0, 0, 0, false),
			RX: direction(0, 0, 0, 0, 0, 0, false)
		}, totals(0, 0, 0, false, false), {Elapsed: 100}));
		expect(updates).toBe(6);
	});
});