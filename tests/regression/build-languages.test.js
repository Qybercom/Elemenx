import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var temporary = [];

/* The fixture in one file, its page and its entry changed first; the dictionaries of ElemenxUI it embeds. */
function embedded (change) {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-languages-'));
	var original = process.stdout.write;
	var page;

	temporary.push(folder);

	fs.cpSync(source, folder, {recursive: true});

	change(folder);

	process.stdout.write = function () {
		return true;
	};

	try {
		Builder.Build(folder, {single: true, out: 'dist'});
	}
	finally {
		process.stdout.write = original;
	}

	page = fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8');

	return ['en', 'ru'].filter(function (language) {
		return page.indexOf('/libraries/ElemenxUI/locales/' + language + '.json') !== -1;
	});
}

function edit (folder, file, from, to) {
	var target = path.join(folder, file);

	fs.writeFileSync(target, fs.readFileSync(target, 'utf8').replace(from, to));
}

/*
 * A build that carries the dictionaries of its Libraries inside it keeps those of the languages of the Application: of
 * its $Locales, of the lang of its page, en (the phrases a missing one falls back to); without any, all of them.
 */
describe('elemenx build: the dictionaries of the Libraries in a build in one file', function () {
	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('keeps every language when the Application names none: its language comes from the browser', function () {
		expect(embedded(function () {})).toEqual(['en', 'ru']);
	});

	it('keeps the language of the page, and en', function () {
		expect(embedded(function (folder) {
			edit(folder, 'index.html', '<html>', '<html lang="en">');
		})).toEqual(['en']);
	});

	it('keeps the languages of its $Locales', function () {
		expect(embedded(function (folder) {
			edit(folder, 'index.html', '<html>', '<html lang="en">');
			edit(folder, 'app.js', "Elemenx.Application('SingleFile', {", "Elemenx.Application('SingleFile', {\n\t$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']},");
		})).toEqual(['en', 'ru']);
	});
});
