import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Style = require('../../tools/frontend-style.js');
var document = fs.readFileSync(path.resolve('docs/FRONTEND-CODE-STYLE.md'), 'utf8');

describe('docs/FRONTEND-CODE-STYLE.md', function () {
	it('carries the rules of the linters of this repository, made generic (node tools/frontend-style.js writes them again)', function () {
		var files = Style.Appendix(document);
		var sources = Style.Sources();

		expect(Object.keys(files)).toEqual(expect.arrayContaining(['.editorconfig', 'eslint.config.mjs', 'stylelint.config.mjs'].concat(Object.keys(sources))));

		Object.keys(sources).forEach(function (name) {
			expect(Style.Generic(fs.readFileSync(path.resolve(sources[name]), 'utf8')), name).toBe(files[name]);
		});
	});

	it('turns on in its configurations every rule this repository turns on', function () {
		var files = Style.Appendix(document);
		var eslint = fs.readFileSync(path.resolve('eslint.config.mjs'), 'utf8');
		var stylelint = fs.readFileSync(path.resolve('stylelint.config.mjs'), 'utf8');

		(eslint.match(/'[@\w/-]+': (?:\[?'error'|true)/g) || []).concat(stylelint.match(/'[@\w/-]+': (?:true|'[\w]+')/g) || []).forEach(function (rule) {
			var name = Style.Generic(rule.split(':')[0]);

			expect(files['eslint.config.mjs'] + files['stylelint.config.mjs'], name).toContain(name);
		});
	});

	it('has no line with whitespace at its end, and no carriage return', function () {
		expect(document.split('\n').filter(function (line) {
			return /[ \t]$/.test(line);
		})).toEqual([]);
		expect(document).not.toContain('\r');
	});
});
