import { beforeAll, describe, expect, it } from 'vitest';
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var require = createRequire(import.meta.url);
var manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
var files;

/* The files npm would publish. dist is built first, as prepack does on npm pack and npm publish. */
function packFiles () {
	var npm = process.env.npm_execpath;
	if (!npm)
		throw new Error('npm_execpath is not available; run this test through an npm script');

	var output = childProcess.execFileSync(process.execPath, [npm, 'pack', '--dry-run', '--json', '--ignore-scripts'], {
		cwd: root,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});
	var result = JSON.parse(output);
	var pack = result;

	if (!Array.isArray(pack)) {
		var keys = Object.keys(pack);

		pack = keys.length ? pack[keys[0]] : null;
	}
	else {
		pack = pack[0];
	}

	if (!pack || !Array.isArray(pack.files))
		throw new Error('npm pack returned an unsupported JSON format');

	return pack.files.map(function (file) { return file.path; });
}

describe('Elemenx npm release surface', function () {
	beforeAll(function () {
		require('../../tools/dist.js').Build();

		files = packFiles();
	}, 60000);

	it('ships the runtime, the CLI, the tooling, ElemenxUI, the documentation and the built dist', function () {
		expect(files).toContain('package.json');
		expect(files).toContain('README.md');
		expect(files).toContain('LICENSE');
		expect(files).toContain('elemenx.js');
		expect(files).toContain('elemenx-cli.js');
		expect(files).toContain('tools/builder.js');
		expect(files).toContain('tools/dist.js');
		expect(files).toContain('tools/generator.js');
		expect(files).toContain('tools/minify.js');
		expect(files).toContain('tools/server.js');
		expect(files).toContain('libraries/ElemenxUI/index.js');
		expect(files).toContain('libraries/ElemenxUI/packs.json');
		expect(files).toContain('docs/BUILDER.md');
		expect(files).toContain('docs/PUBLIC-API.md');
		expect(files).toContain('dist/elemenx.min.js');
		expect(files).toContain('dist/elemenx.all.min.js');
		expect(files).toContain('dist/elemenx-ui.emoji.min.js');
		expect(files).toContain('dist/elemenx-ui/index.js');
		expect(files).toContain('dist/manifest.json');
	});

	it('leaves out the examples, the tests and the development files', function () {
		var outside = files.filter(function (file) {
			return /^(examples|tests|coverage|test-results|playwright-report|node_modules|eslint|stylelint|\.github)\//.test(file) || /^(AGENTS|CLAUDE)\.md$|\.config\.m?js$|^elemenx\.zip$/.test(file);
		});

		expect(outside).toEqual([]);
	});

	it('keeps the package entry points valid and builds dist before it is packed', function () {
		expect(manifest.main).toBe('elemenx.js');
		expect(manifest.bin).toEqual({elemenx: 'elemenx-cli.js'});
		expect(manifest.unpkg).toBe('dist/elemenx.min.js');
		expect(manifest.jsdelivr).toBe('dist/elemenx.min.js');
		expect(manifest.scripts.prepack).toBe('npm run dist');
		expect(manifest.exports).toBeUndefined();
		expect(files).toContain(manifest.main);
		expect(files).toContain(manifest.bin.elemenx);
		expect(files).toContain(manifest.unpkg);
	});

	it('runs in CI every step of npm test, and publishes a version tag after npm test', function () {
		var ci = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
		var publish = fs.readFileSync(path.join(root, '.github', 'workflows', 'publish.yml'), 'utf8');
		var steps = manifest.scripts.test.split('&&').map(function (step) {
			return step.trim().replace(/^npm run /, '');
		});

		expect(steps).toEqual(['lint', 'test:browser', 'test:tools', 'dist', 'test:min', 'test:history']);

		steps.forEach(function (step) {
			expect(ci, step).toContain(step === 'test:history' ? 'npx playwright test' : 'run: npm run ' + step);
		});

		expect(publish).toContain('tags: [\'v*\']');
		expect(publish).toContain('id-token: write');
		expect(publish.indexOf('run: npm test')).toBeGreaterThan(-1);
		expect(publish.indexOf('run: npm test')).toBeLessThan(publish.indexOf('npm publish --tag next'));
	});

	it('describes the package: license, repository, Node version', function () {
		expect(manifest.license).toBe('LGPL-3.0-only');
		expect(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8')).toContain('GNU LESSER GENERAL PUBLIC LICENSE');
		expect(manifest.repository).toEqual({type: 'git', url: 'git+https://github.com/Qybercom/Elemenx.git'});
		expect(manifest.engines.node).toBe('>=20');
		expect(JSON.parse(fs.readFileSync(path.join(root, 'examples', 'Advanced', 'package.json'), 'utf8')).dependencies.elemenx).toBe('^' + manifest.version.replace(/\.\d+$/, '.0'));
	});
});
