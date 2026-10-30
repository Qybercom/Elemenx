import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var temporary = [];

/* The fixture with relative paths in its page, a picture and a template linking a page of its own, built with the options given. */
function build (options) {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-base-'));
	var original = process.stdout.write;
	var page = path.join(folder, 'index.html');

	temporary.push(folder);

	fs.cpSync(source, folder, {recursive: true});
	fs.writeFileSync(page, fs.readFileSync(page, 'utf8')
		.replace('<script src="/elemenx.js"></script>', '<script src="elemenx.js"></script>')
		.replace('<script src="/app.js"></script>', '<script src="./app.js"></script>\n\t<link rel="stylesheet" href="https://example.com/font.css" />')
		.replace('<div id="app"></div>', '<img src="logo.svg" alt="" />\n\t<a href="#top">Top</a>\n\t<template id="Row"><a href="item.html">{{Name}}</a></template>\n\t<div id="app"></div>'));

	process.stdout.write = function () {
		return true;
	};

	try {
		Builder.Build(folder, Object.assign({out: 'dist'}, options));
	}
	finally {
		process.stdout.write = original;
	}

	return fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8');
}

/* A bug: a site in a folder loaded at /ui (no slash) took the relative paths of its page from the root. */
describe('elemenx build --base: a site served from a folder', function () {
	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('takes the relative paths of the page and the stylesheets of its Libraries from the base, and leaves its templates', function () {
		var page = build({base: 'ui'});

		expect(page).toContain('<script src="/ui/elemenx.js"></script>');
		expect(page).toContain('<script src="/ui/app.js"></script>');
		expect(page).toContain('<img src="/ui/logo.svg"');
		expect(page).toContain('href="https://example.com/font.css"');
		expect(page).toContain('<link rel="icon" href="data:," />');
		expect(page).toContain('<a href="#top">Top</a>');
		expect(page).toContain('<a href="item.html">{{Name}}</a>');
		expect(page).toMatch(/href="\/ui\/libraries\/ElemenxUI\/index\.css"/);
		expect(page).not.toMatch(/href="\/libraries\//);
	});

	it('keeps the page as it is without a base, and takes a URL of another site as its base', function () {
		expect(build({})).toContain('<script src="elemenx.js"></script>');
		expect(build({base: 'https://cdn.example.com/app'})).toContain('<script src="https://cdn.example.com/app/elemenx.js"></script>');
	});
});
