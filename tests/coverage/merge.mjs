import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { parseAstAsync } from 'vitest/node';
import convert from 'ast-v8-to-istanbul';
import { createCoverageMap } from '@vitest/istanbul-lib-coverage';
import { createContext, create } from '@vitest/istanbul-lib-report';

/*
 * Adds the Playwright V8 coverage of elemenx.js (coverage/playwright) to the Vitest coverage
 * (coverage/coverage-final.json) and writes the combined report to coverage/all.
 *
 * Both sides are converted the way Vitest does it (vitest parseAstAsync + ast-v8-to-istanbul), so they describe the
 * same statements, functions and branches in the same order. Their end positions may be written differently, so the
 * counters are added by index, after checking that every item starts at the same place.
 */

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var file = path.join(root, 'elemenx.js');
var code = fs.readFileSync(file, 'utf8');
var raw = path.join(root, 'coverage', 'playwright');
var vitestFile = path.join(root, 'coverage', 'coverage-final.json');
var output = path.join(root, 'coverage', 'all');

if (!fs.existsSync(vitestFile))
	throw new Error('Vitest coverage not found: run vitest with --coverage first');

/* the served file must be elemenx.js itself; the Vite dev server only appends a source map comment */
function sameSource (source) {
	return source === code || (source.indexOf(code) === 0 && /^\s*\/\/# sourceMappingURL=\S+\s*$/.test(source.slice(code.length)));
}

function sameStart (a, b) {
	return a.start.line === b.start.line && a.start.column === b.start.column;
}

function addCounters (target, source) {
	var statements = Object.keys(target.statementMap);
	var functions = Object.keys(target.fnMap);
	var branches = Object.keys(target.branchMap);
	if (statements.length !== Object.keys(source.statementMap).length || functions.length !== Object.keys(source.fnMap).length || branches.length !== Object.keys(source.branchMap).length)
		throw new Error('Vitest and Playwright coverage maps differ in size');

	statements.forEach(function (key) {
		if (!sameStart(target.statementMap[key], source.statementMap[key]))
			throw new Error('statement ' + key + ' starts at a different place');

		target.s[key] += source.s[key];
	});

	functions.forEach(function (key) {
		if (!sameStart(target.fnMap[key].loc, source.fnMap[key].loc))
			throw new Error('function ' + key + ' starts at a different place');

		target.f[key] += source.f[key];
	});

	branches.forEach(function (key) {
		if (!sameStart(target.branchMap[key].loc, source.branchMap[key].loc) || target.b[key].length !== source.b[key].length)
			throw new Error('branch ' + key + ' differs');

		target.b[key] = target.b[key].map(function (count, index) {
			return count + source.b[key][index];
		});
	});
}

var vitest = JSON.parse(fs.readFileSync(vitestFile, 'utf8'));
var key = Object.keys(vitest).filter(function (name) {
	return path.resolve(name) === file;
})[0];
if (!key)
	throw new Error('elemenx.js is missing from the Vitest coverage');

var playwright = createCoverageMap({});
var ast = await parseAstAsync(code);
var merged = 0;
var skipped = 0;
var names = fs.existsSync(raw) ? fs.readdirSync(raw) : [];
var i = 0;

while (i < names.length) {
	var entries = JSON.parse(fs.readFileSync(path.join(raw, names[i]), 'utf8'));
	var j = 0;

	while (j < entries.length) {
		if (!sameSource(entries[j].source)) {
			skipped++;
		}
		else {
			playwright.merge(await convert({
				code: code,
				ast: ast,
				wrapperLength: 0,
				coverage: {functions: entries[j].functions, url: pathToFileURL(file).href}
			}));

			merged++;
		}

		j++;
	}

	i++;
}

if (merged)
	addCounters(vitest[key], playwright.fileCoverageFor(playwright.files()[0]).toJSON());

console.log('Playwright page coverages added: ' + merged + (skipped ? ', skipped (another source): ' + skipped : ''));

var context = createContext({dir: output, coverageMap: createCoverageMap(vitest)});

['text-summary', 'json-summary', 'json', 'html'].forEach(function (name) {
	create(name).execute(context);
});

console.log('Combined report: ' + path.relative(root, output));
