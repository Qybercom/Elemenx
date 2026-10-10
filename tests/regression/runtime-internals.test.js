import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/*
 * Keeps docs/RUNTIME-INTERNALS.md and the table of contents of elemenx.js in sync with the code:
 * every Runtime field is documented under the section that assigns it, and every section header is listed.
 */

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var source = fs.readFileSync(path.join(root, 'elemenx.js'), 'utf8');
var lines = source.split('\n');
var documentation = fs.readFileSync(path.join(root, 'docs/RUNTIME-INTERNALS.md'), 'utf8');

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

function codeOwners () {
	var list = sections();
	var owners = {};

	lines.forEach(function (line, index) {
		var pattern = /Runtime\.([A-Za-z]+)(\s*=(?!=))?/g;
		var match;

		if (/^\s*\*/.test(line)) return;

		while ((match = pattern.exec(line))) {
			owners[match[1]] = owners[match[1]] || {};

			if (match[2])
				owners[match[1]][sectionAt(list, index + 1)] = true;
		}
	});

	return owners;
}

function documentedOwners () {
	var result = {};
	var section = null;

	documentation.split('\n').forEach(function (line) {
		var heading = /^## (.+)$/.exec(line);
		var row = /^\| `([A-Za-z]+)` \|/.exec(line);

		if (heading)
			section = heading[1];

		if (row)
			result[row[1]] = section;
	});

	return result;
}

describe('Regression: Runtime internals documentation', function () {
	it('documents every Runtime field under the section that assigns it, and nothing else', function () {
		var owners = codeOwners();
		var documented = documentedOwners();
		var problems = [];

		Object.keys(owners).forEach(function (field) {
			var assigned = Object.keys(owners[field]);

			if (!documented[field]) problems.push('undocumented: Runtime.' + field);
			else if (assigned.length !== 1) problems.push('Runtime.' + field + ' is assigned in several sections: ' + assigned.join(', '));
			else if (assigned[0] !== documented[field]) problems.push('Runtime.' + field + ' is assigned in "' + assigned[0] + '" but documented under "' + documented[field] + '"');
		});

		Object.keys(documented).forEach(function (field) {
			if (!owners[field])
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
});
