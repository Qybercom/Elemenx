import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, waitFor, unique } from '../setup.js';

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

describe('Regression: WebWorker real execution and Messaging bridge', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('starts a real Worker, executes its script and reaches Running only after Ready', async function () {
		var name=unique('WorkerReal');
		var states=[];
		var worker=Elemenx.WebWorker(name,{
			Script:'/workers/webworker-bridge.js',
			StartMode:'manual',
			Channel:unique('real-channel')
		});
		worker.On('Starting',function () { states.push('Starting'); });
		worker.On('Running',function () { states.push('Running'); });
		worker.Start();
		expect(worker.State()).toBe('Starting');
		expect(worker.Native()).not.toBeNull();
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		expect(states).toEqual(['Starting','Running']);
		worker.Destroy();
	});

	it('bridges page Messaging to the real Worker and routes its reply to the sender own channel', async function () {
		var channel=unique('worker-rpc');
		var worker=Elemenx.WebWorker(unique('WorkerRPC'),{
			Script:'/workers/webworker-bridge.js',
			StartMode:'auto',
			Channel:channel
		});
		var socket=Elemenx.Messaging();
		var reply=null;
		socket.On(function (event) { reply=event.Data; });

		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		socket.Send(channel,{Command:'ping',Value:73});
		expect(await waitFor(function () { return reply!==null; },2000)).toBe(true);
		expect(reply.Type).toBe('pong');
		expect(reply.Value).toBe(73);
		expect(reply.WorkerName).toBe(worker.Name());
		expect(reply.Channel).toBe(channel);

		socket.Destroy();
		worker.Destroy();
	});

	it('lazy worker starts automatically on first Messaging send to its channel', async function () {
		var channel=unique('worker-lazy');
		var worker=Elemenx.WebWorker(unique('WorkerLazyReal'),{
			Script:'/workers/webworker-bridge.js',
			StartMode:'lazy',
			Channel:channel
		});
		var socket=Elemenx.Messaging();
		var reply=null;
		socket.On(function (event) { reply=event.Data; });
		expect(worker.State()).toBe('Stopped');

		socket.Send(channel,{Command:'ping',Value:'lazy'});
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		expect(await waitFor(function () { return reply!==null; },2000)).toBe(true);
		expect(reply.Value).toBe('lazy');

		socket.Destroy();
		worker.Destroy();
	});

	it('Stop terminates the native Worker, detaches the bridge and allows an explicit restart', async function () {
		var channel=unique('worker-restart');
		var worker=Elemenx.WebWorker(unique('WorkerRestart'),{
			Script:'/workers/webworker-bridge.js',
			StartMode:'manual',
			Channel:channel
		});
		var socket=Elemenx.Messaging();
		var replies=[];
		socket.On(function (event) { replies.push(event.Data); });

		worker.Start();
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		var first=worker.Native();
		socket.Send(channel,{Command:'ping',Value:1});
		expect(await waitFor(function () { return replies.length===1; },2000)).toBe(true);

		worker.Stop();
		expect(worker.State()).toBe('Stopped');
		expect(worker.Native()).toBeNull();
		socket.Send(channel,{Command:'ping',Value:2});
		await tick(100);
		expect(replies.length).toBe(1);

		worker.Start();
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		expect(worker.Native()).not.toBe(first);
		socket.Send(channel,{Command:'ping',Value:3});
		expect(await waitFor(function () { return replies.length===2; },2000)).toBe(true);
		expect(replies[1].Value).toBe(3);

		socket.Destroy();
		worker.Destroy();
	});

	it('manual Stop suppresses lazy auto-start until Start is explicitly called again', async function () {
		var channel=unique('worker-manual-stop');
		var worker=Elemenx.WebWorker(unique('WorkerManualStop'),{
			Script:'/workers/webworker-bridge.js',
			StartMode:'lazy',
			Channel:channel
		});
		var socket=Elemenx.Messaging();

		worker.Stop();
		socket.Send(channel,{Command:'ping',Value:1});
		await tick(100);
		expect(worker.State()).toBe('Stopped');
		expect(worker.Native()).toBeNull();

		worker.Start();
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);

		socket.Destroy();
		worker.Destroy();
	});

	it('Destroy terminates a running Worker and stale native events cannot resurrect the handle', async function () {
		var worker=Elemenx.WebWorker(unique('WorkerDestroyRunning'),{
			Script:'/workers/webworker-bridge.js',
			StartMode:'auto',
			Channel:unique('destroy-channel')
		});
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		var native=worker.Native();
		worker.Destroy();
		expect(worker.State()).toBe('Stopped');
		expect(worker.Native()).toBeNull();

		native.dispatchEvent(new MessageEvent('message',{
			data:{ElemenxWorker:true,Type:'Ready'}
		}));
		await tick();
		expect(worker.State()).toBe('Stopped');
		expect(function () { worker.Start(); }).toThrow();
	});

	it('restart detaches the previous native Messaging bridge and ignores stale replies', async function () {
		var channel=unique('worker-stale-bridge');
		var worker=Elemenx.WebWorker(unique('WorkerStaleBridge'),{
			Script:'/workers/webworker-bridge.js',
			StartMode:'manual',
			Channel:channel
		});
		var socket=Elemenx.Messaging(), replies=[];
		socket.On(function (event) { replies.push(event.Data); });
		worker.Start();
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		var first=worker.Native();
		worker.Stop();
		worker.Start();
		expect(await waitFor(function () { return worker.State()==='Running'; },2000)).toBe(true);
		first.dispatchEvent(new MessageEvent('message',{
			data:{ElemenxMessaging:true,ElemenxMessagingProtocol:1,Source:'stale',Channel:socket.ID(),Data:'stale'}
		}));
		await tick();
		expect(replies).toEqual([]);
		socket.Destroy();
		worker.Destroy();
	});

	it('owner Destroy invalidates a saved WebWorker accessor and prevents handle resurrection', function () {
		var componentName=unique('WebWorkerOwner');
		var workerName=unique('OwnedWorker');
		Elemenx.Component(componentName,{$Template:'<div></div>'});
		var component=Elemenx.Component(componentName)();
		var webWorker=component.$WebWorker;
		var owned=webWorker(workerName,{Script:'/workers/webworker-bridge.js',StartMode:'manual'});
		component.$Destroy();
		expect(function () { owned.Start(); }).toThrow();
		expect(function () {
			webWorker(unique('ResurrectedWorker'),{Script:'/workers/webworker-bridge.js',StartMode:'manual'});
		}).toThrow();
	});

});