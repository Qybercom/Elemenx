import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var temporary = [];

/* The fixture with a Component of its own that extends one of ElemenxUI and takes a Trait of the project. */
function project () {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-inheritance-'));

	temporary.push(folder);

	fs.cpSync(source, folder, {recursive: true});
	fs.mkdirSync(path.join(folder, 'application', 'traits'));
	fs.mkdirSync(path.join(folder, 'application', 'components', 'FancyRating'));
	fs.writeFileSync(path.join(folder, 'application', 'index.js'), "[\n\t'traits/Glow.js',\n\t'components'\n];\n");
	fs.writeFileSync(path.join(folder, 'application', 'traits', 'Glow.js'), "Elemenx.Trait('Glow', {\n\tGlowing: true\n});\n");
	fs.writeFileSync(path.join(folder, 'application', 'components', 'FancyRating', 'FancyRating.js'), "Elemenx.Component('FancyRating', {\n\t$Extends: 'Rating',\n\t$Traits: ['Glow']\n});\n");
	fs.writeFileSync(path.join(folder, 'application', 'components', 'index.js'), "[\n\t'SingleRoot/SingleRoot.js',\n\t'SinglePage/SinglePage.js',\n\t'FancyRating/FancyRating.js'\n];\n");
	fs.writeFileSync(path.join(folder, 'application', 'components', 'SinglePage', 'SinglePage.js'), "Elemenx.Component('SinglePage', {\n\t$Template: '<section class=\"single-page\"><FancyRating /></section>'\n});\n");

	return folder;
}

function build (folder) {
	var original = process.stdout.write;

	process.stdout.write = function () {
		return true;
	};

	try {
		Builder.Build(folder, {out: 'dist', minify: false, split: false});
	}
	finally {
		process.stdout.write = original;
	}

	return fs.readFileSync(path.join(folder, 'dist', 'app.js'), 'utf8');
}

describe('elemenx build: Components of a base and of Traits', function () {
	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('takes the base a Component names in $Extends and the Traits of the project into the bundle, the Traits as their own type', function () {
		var bundle = build(project());

		expect(bundle).toContain("Elemenx.Component('FancyRating'");
		expect(bundle).toContain("Elemenx.Component('Rating'");

		/* The bundle installs the Trait under its type, loaded when a Component asks for it. */
		expect(bundle).toMatch(/\n\t"Trait": \{\n/);
		expect(bundle).toMatch(/\n\t\t"Glow": function \(\) \{\n\t\t\tElemenx\.Trait\('Glow'/);
		expect(bundle).toMatch(/\n\t\t"Declared": function \(\) \{\n[\s\S]*?Elemenx\.Trait\('Declared'/);
	});
});
