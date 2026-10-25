import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as espree from 'espree';

/*
 * Elemenx is ES5 by design. Runtime APIs (WeakMap, URL, TextEncoder...) are allowed, ES2015+ syntax is not.
 * Checked: every .js file outside tests/ and every inline <script> of HTML pages outside tests/.
 * Tests and root tool configs (*.config.js, *.config.mjs) may use modern syntax; their formatting is checked by `npm run lint`.
 */

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var Skipped = {'node_modules': true, 'dist': true, 'tests': true, '.git': true, '.idea': true, '.vitest': true, 'test-results': true, 'playwright-report': true, 'coverage': true};

/* The native projects Capacitor makes in examples/Native (git ignores them): their files are Capacitor's, not shipped by Elemenx. */
var SkippedPaths = ['examples/Native/android', 'examples/Native/ios'];

function files (directory, result) {
	var entries = fs.readdirSync(directory, {withFileTypes: true});
	var i = 0;

	result = result || [];

	while (i < entries.length) {
		var entry = entries[i];
		var file = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			if (!Skipped[entry.name] && SkippedPaths.indexOf(path.relative(root, file).replace(/\\/g, '/')) === -1)
				files(file, result);
		}
		else if (/\.(js|html)$/.test(entry.name) && !(directory === root && /\.config\.js$/.test(entry.name))) {
			result.push(path.relative(root, file).replace(/\\/g, '/'));
		}

		i++;
	}

	return result;
}

function checkScript (name, source, lineOffset) {
	try {
		espree.parse(source, {ecmaVersion: 5, sourceType: 'script'});

		return [];
	}
	catch (error) {
		return [name + ':' + (error.lineNumber + lineOffset) + ':' + error.column + ' ' + error.message];
	}
}

function checkHTML (name, source) {
	var pattern = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
	var errors = [];
	var match;

	while ((match = pattern.exec(source))) {
		var attributes = match[1] || '';
		var offset;

		if (/\ssrc\s*=/i.test(attributes)) continue;

		if (/\stype\s*=\s*["']?(?!text\/javascript|application\/javascript)/i.test(attributes)) continue;

		offset = source.slice(0, match.index + match[0].indexOf('>') + 1).split('\n').length - 1;
		errors = errors.concat(checkScript(name, match[2], offset));
	}

	return errors;
}

function check (name) {
	var source = fs.readFileSync(path.join(root, name), 'utf8').replace(/^#!.*/, '');

	if (/\.html$/.test(name))
		return checkHTML(name, source);

	return checkScript(name, source, 0);
}

describe('Regression: ES5 syntax', function () {
	it('every shipped JavaScript file and inline HTML script parses as ES5', function () {
		var list = files(root);

		expect(list).toContain('elemenx.js');
		expect(list).toContain('tools/builder.js');
		expect(list).toContain('examples/Simple/index.html');
		expect(list.map(check).reduce(function (all, errors) {
			return all.concat(errors);
		}, [])).toEqual([]);
	});
});
