import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/*
 * Playwright `test` with optional V8 coverage of elemenx.js.
 * When ELEMENX_COVERAGE names a directory (set by tests/coverage/run.mjs), the coverage of every page is written there
 * and later merged with the Vitest coverage by tests/coverage/merge.mjs. Without it, pages run exactly as before.
 *
 * The workers of the page (a WebWorker) run elemenx.js too, out of the reach of page.coverage: a session of the
 * DevTools protocol attaches to each before its script starts (it waits for us), starts the coverage there, and takes
 * it when the test ends. A worker terminated before that keeps nothing.
 */

var directory = process.env.ELEMENX_COVERAGE || '';
var sequence = 0;
var framework = /\/elemenx\.js(\?|#|$)/;

/* The workers of a page: their sessions, messages to them, and their coverage when the test ends. */
async function workerCoverage (page) {
	var context = page.context();
	var cdp = await context.newCDPSession(page);
	var offline = context.setOffline;
	var sessions = {};
	var pending = {};
	var id = 0;

	/* A command to the target of a session: its result, or null when the target is gone (after 5 seconds at most). */
	function send (sessionId, method, params) {
		var key;

		id++;
		key = sessionId + ':' + id;

		return new Promise(function (resolve) {
			var timer = setTimeout(function () {
				delete pending[key];
				resolve(null);
			}, 5000);

			pending[key] = function (result) {
				clearTimeout(timer);

				resolve(result);
			};

			cdp.send('Target.sendMessageToTarget', {sessionId: sessionId, message: JSON.stringify({id: id, method: method, params: params || {}})}).catch(function () {
				pending[key](null);
				delete pending[key];
			});
		});
	}

	cdp.on('Target.receivedMessageFromTarget', function (event) {
		var message = JSON.parse(event.message);
		var key = event.sessionId + ':' + message.id;

		if (message.method === 'Debugger.scriptParsed' && sessions[event.sessionId] && framework.test(message.params.url))
			sessions[event.sessionId].Scripts[message.params.scriptId] = message.params.url;

		if (message.id && pending[key]) {
			pending[key](message.result || null);
			delete pending[key];
		}
	});

	cdp.on('Target.detachedFromTarget', function (event) {
		delete sessions[event.sessionId];
	});

	/* Every target waits for its clients: a frame is let go at once, a worker once its coverage runs. */
	cdp.on('Target.attachedToTarget', async function (event) {
		var type = event.targetInfo.type;

		if (type === 'worker' || type === 'shared_worker') {
			sessions[event.sessionId] = {Scripts: {}};

			await send(event.sessionId, 'Profiler.enable');
			await send(event.sessionId, 'Profiler.startPreciseCoverage', {callCount: true, detailed: true});
			await send(event.sessionId, 'Debugger.enable');
		}

		await send(event.sessionId, 'Runtime.runIfWaitingForDebugger');
	});

	/*
	 * A second client of the page keeps it online: context.setOffline is told to this session as well (regression: the
	 * PWA example stayed online under coverage).
	 */
	context.setOffline = async function (value) {
		await offline.call(context, value);

		await cdp.send('Network.emulateNetworkConditions', {offline: !!value, latency: 0, downloadThroughput: -1, uploadThroughput: -1}).catch(function () {});
	};

	/* The workers alone: a second client of the service worker or of a frame broke the network Playwright emulates (setOffline). */
	await cdp.send('Target.setAutoAttach', {autoAttach: true, waitForDebuggerOnStart: true, flatten: false, filter: [{type: 'worker'}, {type: 'shared_worker'}]});

	return async function () {
		var entries = [];
		var sessionIds = Object.keys(sessions);
		var i = 0;
		var j;
		var taken;
		var source;

		while (i < sessionIds.length) {
			taken = await send(sessionIds[i], 'Profiler.takePreciseCoverage');
			j = 0;

			while (taken && j < taken.result.length) {
				if (framework.test(taken.result[j].url)) {
					source = await send(sessionIds[i], 'Debugger.getScriptSource', {scriptId: taken.result[j].scriptId});

					if (source)
						entries.push({url: taken.result[j].url, source: source.scriptSource, functions: taken.result[j].functions});
				}

				j++;
			}

			i++;
		}

		context.setOffline = offline;

		await cdp.detach().catch(function () {});

		return entries;
	};
}

export var test = base.extend({
	page: async function ({ page }, use) {
		var workers;

		if (!directory) {
			await use(page);

			return;
		}

		await page.coverage.startJSCoverage({resetOnNavigation: false});

		workers = await workerCoverage(page);

		await use(page);

		var entries = (await page.coverage.stopJSCoverage()).filter(function (entry) {
			return framework.test(entry.url);
		}).concat(await workers());

		sequence++;

		fs.mkdirSync(directory, {recursive: true});
		fs.writeFileSync(path.join(directory, process.pid + '-' + sequence + '.json'), JSON.stringify(entries));
	}
});

export { expect };
