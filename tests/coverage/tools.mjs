import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseAstAsync } from 'vitest/node';
import convert from 'ast-v8-to-istanbul';
import { createCoverageMap } from '@vitest/istanbul-lib-coverage';
import { createContext, create } from '@vitest/istanbul-lib-report';

/*
 * npm run test:coverage:tools — the coverage of the CLI and of tools/ under the tests in Node, the processes those
 * tests start included. The coverage of Vitest sees the code the tests run in their own process; the CLI
 * (elemenx-cli.js) and the builds run as processes of their own, which Node measures itself: it writes the V8 coverage
 * of every process to NODE_V8_COVERAGE when it ends. Both are added up, for elemenx-cli.js and tools/, into the report
 * coverage/tools.
 */

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var raw = path.join(root, 'coverage', 'tools-raw');
var inProcess = path.join(root, 'coverage', 'tools-vitest');
var output = path.join(root, 'coverage', 'tools');
var tools = path.join(root, 'tools') + path.sep;
var cli = path.join(root, 'elemenx-cli.js');

fs.rmSync(raw, {recursive: true, force: true});
fs.rmSync(inProcess, {recursive: true, force: true});

var result = spawnSync('npx', ['vitest', 'run', '--config', 'vitest.node.config.mjs', '--coverage', '--coverage.include=tools/*.js', '--coverage.include=elemenx-cli.js', '--coverage.reporter=json', '--coverage.reportsDirectory=coverage/tools-vitest'], {
	cwd: root,
	stdio: 'inherit',
	shell: true,
	env: Object.assign({}, process.env, {NODE_V8_COVERAGE: raw})
});
if (result.status !== 0)
	process.exit(result.status || 1);

/* A file of the CLI or of tools/ (not tools/electron and tools/capacitor, which run inside the native programs). */
function measured (file) {
	return file === cli || (file.indexOf(tools) === 0 && /\.js$/.test(file) && file.substring(tools.length).indexOf(path.sep) === -1);
}

function sameStart (a, b) {
	return a.start.line === b.start.line && a.start.column === b.start.column;
}

/*
 * The counters of source added to target, item by item: both are made by ast-v8-to-istanbul from the same code, but
 * their end positions may be written differently (as in merge.mjs), so they are matched by index and start.
 */
function addCounters (target, source) {
	Object.keys(target.statementMap).forEach(function (key) {
		if (source.statementMap[key] && sameStart(target.statementMap[key], source.statementMap[key]))
			target.s[key] += source.s[key];
	});

	Object.keys(target.fnMap).forEach(function (key) {
		if (source.fnMap[key] && sameStart(target.fnMap[key].loc, source.fnMap[key].loc))
			target.f[key] += source.f[key];
	});

	Object.keys(target.branchMap).forEach(function (key) {
		if (source.branchMap[key] && sameStart(target.branchMap[key].loc, source.branchMap[key].loc) && target.b[key].length === source.b[key].length) {
			target.b[key] = target.b[key].map(function (count, index) {
				return count + source.b[key][index];
			});
		}
	});
}

var vitest = JSON.parse(fs.readFileSync(path.join(inProcess, 'coverage-final.json'), 'utf8'));
var processes = createCoverageMap({});
var sources = {};
var asts = {};
var names = fs.readdirSync(raw);
var count = 0;
var i = 0;

while (i < names.length) {
	var entries = JSON.parse(fs.readFileSync(path.join(raw, names[i]), 'utf8')).result || [];
	var j = 0;

	count++;

	while (j < entries.length) {
		var url = entries[j].url;
		var file = /^file:/.test(url) ? fileURLToPath(url) : null;

		if (file && measured(file) && fs.existsSync(file)) {
			if (!sources[file]) {
				/* The #! line of the CLI as a comment of the same length: the offsets of V8 stay right. */
				sources[file] = fs.readFileSync(file, 'utf8').replace(/^#!/, '//');
				asts[file] = await parseAstAsync(sources[file]);
			}

			processes.merge(await convert({
				code: sources[file],
				ast: asts[file],
				wrapperLength: 0,
				coverage: {functions: entries[j].functions, url: url}
			}));
		}

		j++;
	}

	i++;
}

console.log('Node processes measured: ' + count);

/* The files of the processes added to the ones of Vitest, or taken as they are when Vitest has none. */
processes.files().forEach(function (file) {
	var known = Object.keys(vitest).filter(function (name) {
		return path.resolve(name) === path.resolve(file);
	})[0];

	if (known) addCounters(vitest[known], processes.fileCoverageFor(file).toJSON());
	else vitest[file] = processes.fileCoverageFor(file).toJSON();
});

var map = createCoverageMap(vitest);

var context = createContext({dir: output, coverageMap: map});

['text', 'text-summary', 'json-summary', 'html'].forEach(function (name) {
	create(name).execute(context);
});

console.log('Report: ' + path.relative(root, output));
