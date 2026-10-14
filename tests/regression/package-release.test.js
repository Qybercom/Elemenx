import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var require = createRequire(import.meta.url);
var manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
var wrapper = path.join(root, 'packages', 'elemenx');
var temporary = [];
var files;

/* The files npm would publish. dist is built first, as prepack does on npm pack and npm publish. */
function packFiles (directory) {
	var npm = process.env.npm_execpath;
	if (!npm)
		throw new Error('npm_execpath is not available; run this test through an npm script');

	var output = childProcess.execFileSync(process.execPath, [npm, 'pack', '--dry-run', '--json', '--ignore-scripts'], {
		cwd: directory || root,
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
			return /^(examples|tests|scripts|packages|coverage|test-results|playwright-report|node_modules|eslint|stylelint|\.github)\//.test(file) || /^(AGENTS|CLAUDE)\.md$|\.config\.m?js$|^elemenx\.zip$/.test(file);
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

	it('ignores in git no source of the repository: a CI checkout has every file the tests and the tools need', function () {
		var outputs = /^(tests\/dist\/single(-cli|-packs)?-output|examples\/[^/]+\/dist)\//;
		var ignored = childProcess.execFileSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '--', 'tests', 'tools', 'libraries', 'scripts', 'packages', 'docs', 'examples', 'eslint', 'stylelint', '.github'], {cwd: root, encoding: 'utf8'});

		expect(ignored.split('\n').filter(function (file) {
			return file && !outputs.test(file);
		})).toEqual([]);
	});

	it('runs in CI every step of npm test, and publishes a version tag after the whole CI with the end-to-end tests', function () {
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
		expect(publish).toContain('uses: ./.github/workflows/ci.yml');
		expect(publish).toContain('e2e: true');
		expect(publish).toContain('needs: test');
		expect(publish.indexOf('uses: ./.github/workflows/ci.yml')).toBeLessThan(publish.indexOf('npm publish --access public'));
		expect(ci).toContain('workflow_call:');
		expect(ci).toContain('|| inputs.e2e)');
		expect(publish.indexOf('npm publish --access public')).toBeLessThan(publish.indexOf('cd packages/elemenx'));
		expect(publish).toContain('contents: write');
		expect(publish.indexOf('cd packages/elemenx')).toBeLessThan(publish.indexOf('gh release create'));
		expect(publish).toContain('gh release create "$GITHUB_REF_NAME" --verify-tag');
		expect(publish).toContain('dist/*.js dist/manifest.json');
	});

	it('describes the package: name, license, author, repository, Node version', function () {
		expect(manifest.name).toBe('@qybercom/elemenx');
		expect(manifest.license).toBe('LGPL-3.0-only');
		expect(manifest.author).toBe('Alex Furnica');
		expect(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8')).toContain('GNU LESSER GENERAL PUBLIC LICENSE');
		expect(manifest.repository).toEqual({type: 'git', url: 'git+https://github.com/Qybercom/Elemenx.git'});
		expect(manifest.engines.node).toBe('>=20');
		expect(JSON.parse(fs.readFileSync(path.join(root, 'examples', 'Advanced', 'package.json'), 'utf8')).dependencies['@qybercom/elemenx']).toBe('^' + manifest.version.replace(/\.\d+$/, '.0'));
	});

	it('publishes elemenx as the short name of @qybercom/elemenx: the same version, exactly, and its CLI', function () {
		var short = JSON.parse(fs.readFileSync(path.join(wrapper, 'package.json'), 'utf8'));
		var site = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-short-name-'));
		var modules = path.join(site, 'node_modules');
		var run;

		temporary.push(site);

		expect(short.name).toBe('elemenx');
		expect(short.version).toBe(manifest.version);
		expect(short.dependencies).toEqual({'@qybercom/elemenx': manifest.version});
		expect(short.license).toBe(manifest.license);
		expect(short.author).toBe(manifest.author);
		expect(short.bin).toEqual({elemenx: 'bin/elemenx.js'});
		expect(packFiles(wrapper).sort()).toEqual(['README.md', 'bin/elemenx.js', 'index.js', 'package.json']);
		expect(files.some(function (file) { return file.indexOf('packages/') === 0; })).toBe(false);

		/* An install of elemenx: its dependency is this repository. */
		fs.mkdirSync(path.join(modules, '@qybercom'), {recursive: true});
		fs.symlinkSync(root, path.join(modules, '@qybercom', 'elemenx'), 'junction');
		fs.cpSync(wrapper, path.join(modules, 'elemenx'), {recursive: true});

		run = childProcess.spawnSync(process.execPath, [path.join(modules, 'elemenx', 'bin', 'elemenx.js'), 'version'], {encoding: 'utf8'});

		expect(run.status).toBe(0);
		expect(run.stdout).toBe(manifest.version + '\n');

		run = childProcess.spawnSync(process.execPath, [path.join(modules, 'elemenx', 'bin', 'elemenx.js'), 'nothing'], {encoding: 'utf8'});

		expect(run.status).toBe(1);
		expect(run.stderr).toBe('Elemenx CLI: unknown command: nothing (use elemenx help)\n');
	});

	it('npm version, or version:set then version:tag, sets the version of both packages and tags it, only from a clean working tree', function () {
		var site = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-version-'));
		var npm = process.env.npm_execpath;
		var run;

		function git (args) {
			return childProcess.execFileSync('git', args, {cwd: site, encoding: 'utf8'}).trim();
		}

		function version (value) {
			return childProcess.spawnSync(process.execPath, [npm, 'version', value], {cwd: site, encoding: 'utf8'});
		}

		function script (name, args) {
			return childProcess.spawnSync(process.execPath, [npm, 'run', name, '--'].concat(args || []), {cwd: site, encoding: 'utf8'});
		}

		function read (file) {
			return JSON.parse(fs.readFileSync(path.join(site, file), 'utf8'));
		}

		temporary.push(site);

		expect(manifest.scripts.preversion).toBe('node scripts/version.js check');
		expect(manifest.scripts.version).toBe('node scripts/version.js sync && git add packages/elemenx/package.json');
		expect(manifest.scripts['version:set']).toBe('node scripts/version.js set');
		expect(manifest.scripts['version:tag']).toBe('node scripts/version.js tag');

		/* A copy of the repository with the release files only. */
		fs.mkdirSync(path.join(site, 'scripts'));
		fs.mkdirSync(path.join(site, 'packages', 'elemenx'), {recursive: true});
		fs.copyFileSync(path.join(root, 'scripts', 'version.js'), path.join(site, 'scripts', 'version.js'));
		fs.copyFileSync(path.join(wrapper, 'package.json'), path.join(site, 'packages', 'elemenx', 'package.json'));
		fs.writeFileSync(path.join(site, 'package.json'), JSON.stringify({name: manifest.name, version: manifest.version, scripts: {preversion: manifest.scripts.preversion, version: manifest.scripts.version, 'version:set': manifest.scripts['version:set'], 'version:tag': manifest.scripts['version:tag']}}, null, '\t') + '\n');

		git(['init', '-q']);
		git(['config', 'user.name', 'Elemenx test']);
		git(['config', 'user.email', 'test@elemenx.invalid']);
		git(['config', 'commit.gpgsign', 'false']);
		git(['config', 'tag.gpgsign', 'false']);
		git(['config', 'core.autocrlf', 'false']);
		git(['add', '-A']);
		git(['commit', '-q', '-m', 'start']);

		fs.writeFileSync(path.join(site, 'notes.txt'), 'not committed');

		run = version('0.9.7');

		expect(run.status).not.toBe(0);
		expect(run.stderr).toContain('Elemenx version: the working tree has changes, commit or remove them first:');
		expect(run.stderr).toContain('?? notes.txt');
		expect(read('package.json').version).toBe(manifest.version);
		expect(git(['tag'])).toBe('');

		fs.rmSync(path.join(site, 'notes.txt'));

		run = version('0.9.7');

		expect(run.status, run.stderr).toBe(0);
		expect(read('package.json').version).toBe('0.9.7');
		expect(read('packages/elemenx/package.json').version).toBe('0.9.7');
		expect(read('packages/elemenx/package.json').dependencies).toEqual({'@qybercom/elemenx': '0.9.7'});
		expect(git(['tag'])).toBe('v0.9.7');
		expect(git(['rev-list', '-n', '1', 'v0.9.7'])).toBe(git(['rev-parse', 'HEAD']));
		expect(git(['show', '--name-only', '--format=', 'HEAD']).split('\n').sort()).toEqual(['package.json', 'packages/elemenx/package.json']);
		expect(git(['status', '--porcelain'])).toBe('');

		/* The other way: the version in a commit of the author, then the tag. */
		var head = git(['rev-parse', 'HEAD']);

		run = script('version:set', ['0.9.8']);

		expect(run.status, run.stderr).toBe(0);
		expect(read('package.json').version).toBe('0.9.8');
		expect(read('packages/elemenx/package.json').version).toBe('0.9.8');
		expect(read('packages/elemenx/package.json').dependencies).toEqual({'@qybercom/elemenx': '0.9.8'});
		expect(git(['rev-parse', 'HEAD'])).toBe(head);
		expect(git(['tag'])).toBe('v0.9.7');

		run = script('version:tag');

		expect(run.status).not.toBe(0);
		expect(run.stderr).toContain('Elemenx version: the working tree has changes, commit or remove them first:');
		expect(git(['tag'])).toBe('v0.9.7');

		fs.writeFileSync(path.join(site, 'feature.txt'), 'the work of the release');

		git(['add', '-A']);
		git(['commit', '-q', '-m', 'Feature and 0.9.8']);

		run = script('version:tag');

		expect(run.status, run.stderr).toBe(0);
		expect(run.stdout).toContain('Elemenx version: tagged v0.9.8 on ');
		expect(git(['tag']).split('\n')).toEqual(['v0.9.7', 'v0.9.8']);
		expect(git(['rev-list', '-n', '1', 'v0.9.8'])).toBe(git(['rev-parse', 'HEAD']));
		expect(git(['cat-file', '-t', 'v0.9.8'])).toBe('tag');

		run = script('version:tag');

		expect(run.status).not.toBe(0);
		expect(run.stderr).toContain('Elemenx version: the tag v0.9.8 exists already: set a new version first');

		/* A wrapper with another version is not tagged. */
		fs.writeFileSync(path.join(site, 'packages', 'elemenx', 'package.json'), JSON.stringify(Object.assign(read('packages/elemenx/package.json'), {version: '0.9.0'}), null, '\t') + '\n');
		fs.writeFileSync(path.join(site, 'package.json'), JSON.stringify(Object.assign(read('package.json'), {version: '0.9.9'}), null, '\t') + '\n');

		git(['commit', '-q', '-am', 'Forgot version:set']);

		run = script('version:tag');

		expect(run.status).not.toBe(0);
		expect(run.stderr).toContain('Elemenx version: packages/elemenx has 0.9.0, not 0.9.9: npm run version:set -- 0.9.9, then commit');
		expect(git(['tag', '--list', 'v0.9.9'])).toBe('');
	}, 60000);

	afterAll(function () {
		temporary.forEach(function (directory) {
			fs.rmSync(directory, {recursive: true, force: true});
		});
	});
});
