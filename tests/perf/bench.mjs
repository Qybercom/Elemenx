/*
 * The bench of the framework: node tests/perf/bench.mjs (npm run test:bench) serves the repository, opens Chrome on
 * tests/perf/page.html and runs each scenario of scenarios.js three times, keeping its median. It prints the times
 * beside the ones of tests/perf/baseline.json (the last saved), and --save writes them there. --min runs the minified
 * framework (dist/elemenx.min.js). It is a measure, not a test: npm test does not run it.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Server = require('../../tools/server.js');
var root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
var baselineFile = path.join(root, 'tests', 'perf', 'baseline.json');
var save = process.argv.indexOf('--save') !== -1;
var only = process.argv.filter(function (arg) {
	return arg.indexOf('--') !== 0;
}).slice(2);
var server = Server.Create({Root: root, FrameworkFallback: true});
var baseline = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : {};
var results = {};

await new Promise(function (resolve) {
	server.Listen(0, '127.0.0.1', resolve);
});

var browser = await chromium.launch({channel: 'chrome'});
var page = await browser.newPage({viewport: {width: 1280, height: 900}});
var errors = [];

page.on('pageerror', function (error) {
	errors.push(error.message);
});

page.on('console', function (message) {
	/* The page asks for a favicon it has not: no error of the framework. */
	if (message.type() === 'error' && !/status of 404/.test(message.text()))
		errors.push(message.text());
});

await page.goto('http://127.0.0.1:' + server.Server.address().port + '/tests/perf/page.html');
await page.waitForFunction(function () {
	return window.Bench && window.Elemenx;
});

var names = await page.evaluate(function () {
	return window.Bench.Names;
});

for (var name of names) {
	if (only.length && only.indexOf(name) === -1) continue;

	var runs = [];

	for (var k = 0; k < 3; k++) {
		runs.push((await page.evaluate(function (scenario) {
			return window.Bench.Run(scenario);
		}, name)).Ms);
	}

	runs.sort(function (a, b) {
		return a - b;
	});

	results[name] = runs[1];

	var before = baseline[name];
	var change = before ? ' (' + (results[name] / before * 100 - 100 >= 0 ? '+' : '') + Math.round(results[name] / before * 100 - 100) + '% of ' + before + ' ms)' : '';

	console.log(name.padEnd(24) + String(results[name]).padStart(9) + ' ms' + change);
}

if (errors.length)
	console.log('errors:', errors.slice(0, 5).join(' | '));

if (save) {
	fs.writeFileSync(baselineFile, JSON.stringify(Object.assign({}, baseline, results), null, '\t') + '\n');

	console.log('saved to tests/perf/baseline.json');
}

await browser.close();

await new Promise(function (resolve) {
	server.Close(resolve);
});
