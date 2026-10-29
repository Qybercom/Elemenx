/*
 * A CPU profile of a scenario of the bench: node tests/perf/profile.mjs <scenario> prints the functions that take the
 * most time under it (inclusive, then self), with their lines in elemenx.js. A tool to find what to make faster.
 */
import { chromium } from '@playwright/test';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Server = require('../../tools/server.js');
var root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
var scenario = process.argv[2] || 'update-one-prop';
var server = Server.Create({Root: root, FrameworkFallback: true});

await new Promise(function (resolve) {
	server.Listen(0, '127.0.0.1', resolve);
});

var browser = await chromium.launch({channel: 'chrome'});
var page = await browser.newPage({viewport: {width: 1280, height: 900}});

await page.goto('http://127.0.0.1:' + server.Server.address().port + '/tests/perf/page.html');
await page.waitForFunction(function () {
	return window.Bench && window.Elemenx;
});

var client = await page.context().newCDPSession(page);

await client.send('Profiler.enable');
await client.send('Profiler.setSamplingInterval', {interval: 50});
await client.send('Profiler.start');

var result = await page.evaluate(function (name) {
	return window.Bench.Run(name);
}, scenario);

var profile = (await client.send('Profiler.stop')).profile;
var byId = {};
var parent = {};
var times = {};
var total = 0;

profile.nodes.forEach(function (node) {
	byId[node.id] = node;

	(node.children || []).forEach(function (child) {
		parent[child] = node.id;
	});
});

profile.samples.forEach(function (id, index) {
	times[id] = (times[id] || 0) + (profile.timeDeltas[index] || 0);
	total += profile.timeDeltas[index] || 0;
});

function key (node) {
	return (node.callFrame.functionName || '(anonymous)') + ' ' + node.callFrame.url.split('/').pop() + ':' + (node.callFrame.lineNumber + 1);
}

var inclusive = {};
var self = {};

Object.keys(times).forEach(function (id) {
	var seen = {};
	var at = Number(id);

	self[key(byId[at])] = (self[key(byId[at])] || 0) + times[id];

	while (at !== undefined) {
		if (!seen[key(byId[at])]) {
			seen[key(byId[at])] = true;
			inclusive[key(byId[at])] = (inclusive[key(byId[at])] || 0) + times[id];
		}

		at = parent[at];
	}
});

function print (title, map, count) {
	console.log('--- ' + title);

	Object.keys(map).filter(function (name) {
		return /\.js:/.test(name);
	}).sort(function (a, b) {
		return map[b] - map[a];
	}).slice(0, count).forEach(function (name) {
		console.log((map[name] / 1000).toFixed(1).padStart(8) + ' ms ' + (map[name] / total * 100).toFixed(1).padStart(5) + ' %  ' + name);
	});
}

console.log(scenario, result.Ms, 'ms');

print('inclusive', inclusive, 30);
print('self', self, 20);

await browser.close();

await new Promise(function (resolve) {
	server.Close(resolve);
});
