import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var temporary = [];

/* A project of its entry in src, its page and its config, in a folder of its own. */
function project () {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-out-'));

	temporary.push(folder);

	fs.mkdirSync(path.join(folder, 'src'));
	fs.writeFileSync(path.join(folder, 'src', 'app.js'), 'Elemenx.Application(\'Main\', {});\n');
	fs.writeFileSync(path.join(folder, 'index.html'), '<!doctype html><div id="app"></div>\n');
	fs.writeFileSync(path.join(folder, 'elemenx.config.js'), 'module.exports = {};\n');

	return folder;
}

/*
 * Regression: a build empties its folder first, and --out . (or .., or the root of a disk, or the folder of the entry)
 * removed the sources of the project with the rest. It refuses such a folder now, before it removes anything.
 */
describe('elemenx build --out: never the project, a folder that holds it, nor one of its sources', function () {
	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('refuses an output of the project, of a folder above it, of the root, or of the folder of its entry, and keeps them', function () {
		var folder = project();
		var outs = ['.', '..', path.parse(folder).root, 'src', path.join('src', '..')];

		outs.forEach(function (out) {
			expect(function () {
				Builder.Build(folder, {out: out, entry: 'src/app.js'});
			}).toThrow('would empty the project');
		});

		['extension', 'native'].forEach(function (kind) {
			expect(function () {
				Builder.Build(folder, Object.assign({out: '.', entry: 'src/app.js'}, kind === 'native' ? {native: 'desktop'} : {extension: true}));
			}).toThrow('would empty the project');
		});

		expect(fs.existsSync(path.join(folder, 'src', 'app.js'))).toBe(true);
		expect(fs.existsSync(path.join(folder, 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(folder, 'elemenx.config.js'))).toBe(true);
	});
});
