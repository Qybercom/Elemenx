import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

/*
 * Keeps docs/RUNTIME-INTERNALS.md and the table of contents of elemenx.js in sync with the code:
 * every Runtime field is documented under the section that assigns it, with the sections that use it,
 * and every section header is listed in the table of contents.
 * Also guards the structure: strict modules, and no free name outside the known runtime globals.
 */

var KnownGlobals = [
	'Array', 'ArrayBuffer', 'Blob', 'DataView', 'Date', 'Error', 'Function', 'JSON', 'Map', 'Math',
	'MutationObserver', 'NodeFilter', 'Number', 'Object', 'Proxy', 'Reflect', 'RegExp', 'Set', 'String', 'Symbol',
	'TextDecoder', 'TextEncoder', 'TypeError', 'URL', 'Uint32Array', 'Uint8Array', 'WeakMap', 'WeakSet', 'XMLHttpRequest',
	'clearTimeout', 'console', 'decodeURIComponent', 'document', 'encodeURIComponent', 'globalThis', 'parseInt', 'self',
	'setTimeout', 'undefined'
];

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/* A checkout on Windows may have CRLF line breaks (core.autocrlf). */
var source = fs.readFileSync(path.join(root, 'elemenx.js'), 'utf8').replace(/\r\n/g, '\n');
var lines = source.split('\n');
var documentation = fs.readFileSync(path.join(root, 'docs/RUNTIME-INTERNALS.md'), 'utf8').replace(/\r\n/g, '\n');

function sections () {
	var result = [];

	lines.forEach(function (line, index) {
		var match = /^\t\/\* ([A-Z][^*]*?) \*\/$/.exec(line);
		if (match)
			result.push({Name: match[1], Line: index + 1});
	});

	return result;
}

function sectionAt (list, line) {
	var name = null;

	list.forEach(function (section) {
		if (section.Line <= line)
			name = section.Name;
	});

	return name;
}

function codeFields () {
	var list = sections();
	var fields = {};

	lines.forEach(function (line, index) {
		var pattern = /Runtime\.([A-Za-z]+)(\s*=(?!=))?/g;
		var section = sectionAt(list, index + 1);
		var match;

		if (/^\s*\*/.test(line)) return;

		while ((match = pattern.exec(line))) {
			fields[match[1]] = fields[match[1]] || {Owner: {}, Users: {}};

			if (match[2]) fields[match[1]].Owner[section] = true;
			else fields[match[1]].Users[section] = true;
		}
	});

	return fields;
}

function users (column) {
	if (/^not /.test(column) || / only$/.test(column)) return [];

	return column.split(', ').sort();
}

function documentedFields () {
	var result = {};
	var section = null;

	documentation.split('\n').forEach(function (line) {
		var heading = /^## (.+)$/.exec(line);
		var row = /^\| `([A-Za-z]+)` \|/.exec(line);

		if (heading)
			section = heading[1];

		if (row)
			result[row[1]] = {Section: section, Users: users(line.split('|')[3].trim())};
	});

	return result;
}

describe('Regression: Runtime internals documentation', function () {
	it('documents every Runtime field under the section that assigns it, with its users, and nothing else', function () {
		var fields = codeFields();
		var documented = documentedFields();
		var problems = [];

		Object.keys(fields).forEach(function (field) {
			var assigned = Object.keys(fields[field].Owner);
			var used = Object.keys(fields[field].Users).filter(function (name) {
				return !fields[field].Owner[name];
			}).sort();

			if (!documented[field]) problems.push('undocumented: Runtime.' + field);
			else if (assigned.length !== 1) problems.push('Runtime.' + field + ' is assigned in several sections: ' + assigned.join(', '));
			else if (assigned[0] !== documented[field].Section) problems.push('Runtime.' + field + ' is assigned in "' + assigned[0] + '" but documented under "' + documented[field].Section + '"');
			else if (used.join(', ') !== documented[field].Users.join(', ')) problems.push('Runtime.' + field + ' is used by "' + used.join(', ') + '" but documented as used by "' + documented[field].Users.join(', ') + '"');
		});

		Object.keys(documented).forEach(function (field) {
			if (!fields[field])
				problems.push('documented but missing in code: Runtime.' + field);
		});

		expect(problems).toEqual([]);
	});

	it('lists every section header in the table of contents of elemenx.js', function () {
		var contents = source.slice(0, source.indexOf('(function () {'));
		var missing = sections().filter(function (section) {
			return !new RegExp('^ \\*   ' + section.Name + ' {2,}', 'm').test(contents);
		}).map(function (section) {
			return section.Name;
		});

		expect(missing).toEqual([]);
	});

	it('wraps every section except Runtime in a strict module', function () {
		var loose = sections().filter(function (section) {
			if (section.Name === 'Runtime') return false;

			return !/^\t\(function \((global)?\) \{$/.test(lines[section.Line]) || lines[section.Line + 1] !== '\t\t\'use strict\';';
		}).map(function (section) {
			return section.Name;
		});

		expect(loose).toEqual([]);
	});
});

describe('Regression: elemenx.js free names', function () {
	it('references no global beyond the known runtime globals', function () {
		var ast = espree.parse(source, {ecmaVersion: 5, sourceType: 'script', loc: true, range: true});
		var manager = eslintScope.analyze(ast, {ecmaVersion: 5});
		var unknown = manager.globalScope.through.filter(function (reference) {
			return KnownGlobals.indexOf(reference.identifier.name) === -1;
		}).map(function (reference) {
			return reference.identifier.name + ' at line ' + reference.identifier.loc.start.line;
		});

		expect(unknown).toEqual([]);
	});
});

describe('Regression: elemenx.js and Promises', function () {
	it('creates no Promise of its own: Promises only come from browser APIs and never reach the caller', function () {
		var code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/'(?:[^'\\n]|\.)*'/g, '\'\'');
		var found = code.split('\n').map(function (line, index) {
			return /\bnew\s+(global\.)?Promise\b|\bPromise\s*\.|global\.Promise\b/.test(line) ? 'line ' + (index + 1) + ': ' + line.trim() : null;
		}).filter(Boolean);

		expect(found).toEqual([]);
	});
});
