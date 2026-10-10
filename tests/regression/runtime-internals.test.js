import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/*
 * Keeps docs/RUNTIME-INTERNALS.md and the table of contents of elemenx.js in sync with the code:
 * every Runtime field is documented under the section that assigns it, with the sections that use it,
 * and every section header is listed in the table of contents.
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
});
