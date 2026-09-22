import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: WebWorker definitions and lifecycle', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('manual worker exposes definition metadata without starting', function () {
		var name=unique('WorkerManual');
		var worker=Elemenx.WebWorker(name,{Script:'/worker.js',StartMode:'manual',Channel:'jobs'});
		expect(worker.Name()).toBe(name);
		expect(worker.Channel()).toBe('jobs');
		expect(worker.StartMode()).toBe('manual');
		expect(worker.State()).toBe('Stopped');
		expect(worker.Native()).toBeNull();
		worker.Destroy();
	});

	it('lazy worker stays stopped until explicitly started', function () {
		var name=unique('WorkerLazy');
		var worker=Elemenx.WebWorker(name,{Script:'/worker.js',StartMode:'lazy'});
		expect(worker.StartMode()).toBe('lazy');
		expect(worker.State()).toBe('Stopped');
		worker.Stop();
		expect(worker.State()).toBe('Stopped');
		worker.Destroy();
	});

	it('rejects invalid StartMode and unknown definitions', function () {
		var bad=unique('WorkerBad');
		var missing=unique('WorkerMissing');
		expect(function () {
			Elemenx.WebWorker(bad,{Script:'/worker.js',StartMode:'sometimes'});
		}).toThrow();
		expect(function () {
			Elemenx.WebWorker(missing);
		}).toThrow();
	});

	it('Destroy is idempotent and a destroyed handle cannot Start', function () {
		var name=unique('WorkerDestroyed');
		var worker=Elemenx.WebWorker(name,{Script:'/worker.js',StartMode:'manual'});
		worker.Destroy();
		worker.Destroy();
		expect(worker.State()).toBe('Stopped');
		expect(function () { worker.Start(); }).toThrow();
	});
});