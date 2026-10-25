import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

var library = path.resolve(process.cwd(), 'libraries', 'ElemenxUI');

/* The names the files of the Library register: Discovery refuses a name that two files give (a Service and a Component). */
function names () {
	var list = new Function('return ' + fs.readFileSync(path.join(library, 'index.js'), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''))();

	return list.map(function (file) {
		var match = /Elemenx\.(Component|Service|Directive|Guard)\('([^']+)'/.exec(fs.readFileSync(path.join(library, file), 'utf8'));

		return {File: file, Name: match ? match[2] : null};
	}).filter(function (entry) {
		return entry.Name;
	});
}

describe('Regression: the names of ElemenxUI', function () {
	it('gives every Component, Service, Directive and Guard of the Library a name of its own', function () {
		var seen = {};
		var twice = [];

		names().forEach(function (entry) {
			if (seen[entry.Name])
				twice.push(entry.Name + ': ' + seen[entry.Name] + ' and ' + entry.File);

			seen[entry.Name] = entry.File;
		});

		expect(Object.keys(seen).length).toBeGreaterThan(150);
		expect(twice).toEqual([]);
	});
});
