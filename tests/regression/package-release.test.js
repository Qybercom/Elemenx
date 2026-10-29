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
			return /^(examples|tests|scripts|packages|coverage|test-results|playwright-report|node_modules|eslint|stylelint|\.github)\//.test(file) || /^(AGENTS|CLAUDE)\.md$|\.config\.m?js$|^elemenx\.zip$/.test(file === 'docs-site/elemenx.config.js' ? 'the server of the Docs' : file);
		});

		expect(outside).toEqual([]);
	});

	it('keeps the package entry points valid and builds dist before it is packed', function () {
		expect(manifest.main).toBe('elemenx.js');
		expect(manifest.bin).toEqual({elemenx: 'elemenx-cli.js'});
		expect(manifest.unpkg).toBe('dist/elemenx.min.js');
		expect(manifest.jsdelivr).toBe('dist/elemenx.min.js');
		/* The package has no editors/: they go to the GitHub release (publish.yml), and npm publish waits for no IntelliJ IDEA. */
		/* The Docs too (docs-site/, with the elemenx.config.js of its server): npx elemenx docs serves it. */
		expect(manifest.scripts.prepack).toBe('npm run dist -- --no-editors && npm run docs:site && npm run designer:site');
		expect(manifest.exports).toBeUndefined();
		expect(files).toContain(manifest.main);
		expect(files).toContain(manifest.bin.elemenx);
		expect(files).toContain(manifest.unpkg);
	});

	it('ignores in git no source of the repository: a CI checkout has every file the tests and the tools need', function () {
		/* What builds and installs make, never sources: the outputs of the builds, and the packages and the native platforms of examples/Native. */
		var outputs = /^(tests\/dist\/(single(-cli|-packs)?|widget)-output|examples\/[^/]+\/dist|examples\/Native\/(node_modules|android|ios))\//;
		var ignored = childProcess.execFileSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '--', 'tests', 'tools', 'libraries', 'scripts', 'packages', 'docs', 'examples', 'eslint', 'stylelint', '.github'], {cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024});

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

		expect(steps).toEqual(['lint', 'test:browser', 'test:tools', 'dist', 'test:min', 'test:e2e']);

		steps.forEach(function (step) {
			expect(ci, step).toContain(step === 'test:e2e' ? 'npx playwright test' : 'run: npm run ' + step);
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
		expect(publish).toContain('if [ -n "$(npm view "@qybercom/elemenx@$version" version 2>/dev/null)" ]; then');
		expect(publish).toContain('if [ -n "$(npm view "elemenx@$version" version 2>/dev/null)" ]; then');
		expect(publish).toContain('if gh release view "$GITHUB_REF_NAME"');
		expect(publish).toContain('contents: write');
		expect(publish.indexOf('cd packages/elemenx')).toBeLessThan(publish.indexOf('gh release create'));
		expect(publish).toContain('gh release create "$GITHUB_REF_NAME" --verify-tag');
		expect(publish).toContain('dist/*.js dist/manifest.json');

		/* Regression: files of another version went out. The ones of the release are checked first, in every job. */
		expect(publish.indexOf('npm run version:built')).toBeGreaterThan(publish.indexOf('npm run dist -- --no-editors\n'));
		expect(publish.indexOf('npm run version:built')).toBeLessThan(publish.indexOf('gh release create'));
		expect(publish.lastIndexOf('npm run version:built')).toBeGreaterThan(publish.indexOf('node editors/build.js --only ${{ matrix.editor }}'));
		expect(publish.lastIndexOf('npm run version:built')).toBeLessThan(publish.indexOf('gh release upload'));

		/*
		 * Regression: the plugin of IntelliJ failed the publication. npm goes first, the release after it; then each
		 * extension in a job of its own, in parallel (VS Code and IntelliJ on Linux, Visual Studio on Windows).
		 */
		expect(publish.indexOf('npm publish --access public')).toBeLessThan(publish.indexOf('ELEMENX_INTELLIJ: download'));
		expect(publish).toMatch(/\n {2}release:\n(?:.*\n)*? {4}needs: publish\n/);
		expect(publish).toMatch(/\n {2}editors:\n(?:.*\n)*? {4}needs: release\n(?:.*\n)*? {4}runs-on: \$\{\{ matrix\.os \}\}\n(?:.*\n)*? {6}fail-fast: false\n/);
		expect(publish).toContain('          - editor: vscode\n            os: ubuntu-latest\n');
		expect(publish).toContain('          - editor: intellij\n            os: ubuntu-latest\n');
		expect(publish).toContain('          - editor: visualstudio\n            os: windows-latest\n');
		expect(publish).toContain('uses: gradle/actions/setup-gradle@');
		expect(publish).toContain('gh release upload "$GITHUB_REF_NAME" dist/editors/${{ matrix.file }} --clobber');

		/* Every push starts the Gradle of the plugin as the build does on Linux; a change of editors/ builds each extension in its job. */
		expect(ci).toContain('run: sh editors/intellij/gradlew --version');
		expect(ci).toContain('node editors/build.js --only ${{ matrix.editor }}');
		expect(ci).toContain('          - editor: visualstudio\n            os: windows-latest\n');
		expect(ci).toContain('&& !inputs.e2e');

		/* The marketplaces of the editors, each in the job of its extension when its secret is set, a version there already skipped. */
		expect(publish).toContain("if: matrix.editor == 'vscode' && env.VSCE_PAT != ''");
		expect(publish).toContain("if: matrix.editor == 'vscode' && env.OVSX_PAT != ''");
		expect(publish).toContain("if: matrix.editor == 'intellij' && env.JETBRAINS_TOKEN != ''");
		expect(publish).toContain("if: matrix.editor == 'visualstudio' && env.VSCE_PAT != ''");
		expect(publish).toContain('publish --packagePath dist/editors/elemenx-vscode.vsix --skip-duplicate');
		expect(publish).toContain('publishPlugin --no-daemon');
		expect(publish).toContain('-publishManifest editors\\visualstudio\\publishManifest.json');
	});

	it('describes the package: name, license, author, repository, Node version', function () {
		expect(manifest.name).toBe('@qybercom/elemenx');
		expect(manifest.license).toBe('LGPL-3.0-only');
		expect(manifest.author).toBe('Alex Furnica');
		expect(fs.readFileSync(path.join(root, 'elemenx.js'), 'utf8')).toContain('\n\tvar Version = \'' + manifest.version + '\';');
		expect(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8')).toContain('GNU LESSER GENERAL PUBLIC LICENSE');
		expect(manifest.repository).toEqual({type: 'git', url: 'git+https://github.com/Qybercom/Elemenx.git'});
		expect(manifest.engines.node).toBe('>=20');

		/* Every example that installs Elemenx from npm depends on the minor version of this release (regression: Simple on elemenx ^1.0.0). */
		fs.readdirSync(path.join(root, 'examples')).forEach(function (name) {
			var file = path.join(root, 'examples', name, 'package.json');
			var dependencies;

			if (!fs.existsSync(file)) return;

			dependencies = JSON.parse(fs.readFileSync(file, 'utf8')).dependencies || {};

			expect(dependencies.elemenx, file).toBeUndefined();

			if (dependencies['@qybercom/elemenx'])
				expect(dependencies['@qybercom/elemenx'], file).toBe('^' + manifest.version.replace(/\.\d+$/, '.0'));
		});

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
		expect(manifest.scripts.version).toBe('node scripts/version.js sync --add');
		expect(manifest.scripts['version:set']).toBe('node scripts/version.js set');
		expect(manifest.scripts['version:tag']).toBe('node scripts/version.js tag');

		/* A copy of the repository with the release files only. */
		fs.mkdirSync(path.join(site, 'scripts'));
		fs.mkdirSync(path.join(site, 'packages', 'elemenx'), {recursive: true});
		fs.copyFileSync(path.join(root, 'scripts', 'version.js'), path.join(site, 'scripts', 'version.js'));
		fs.copyFileSync(path.join(wrapper, 'package.json'), path.join(site, 'packages', 'elemenx', 'package.json'));
		fs.writeFileSync(path.join(site, 'elemenx.js'), '(function () {\n\tvar Version = \'' + manifest.version + '\';\n})();\n');
		fs.mkdirSync(path.join(site, 'examples', 'Advanced'), {recursive: true});
		/* The extensions of the editors, with the version of Elemenx. */
		fs.mkdirSync(path.join(site, 'editors', 'vscode'), {recursive: true});
		fs.mkdirSync(path.join(site, 'editors', 'intellij'), {recursive: true});
		fs.writeFileSync(path.join(site, 'editors', 'vscode', 'package.json'), '{\n\t"name": "elemenx",\n\t"version": "' + manifest.version + '",\n\t"engines": {\n\t\t"vscode": "^1.80.0"\n\t}\n}\n');
		fs.writeFileSync(path.join(site, 'editors', 'intellij', 'build.gradle.kts'), 'plugins {\n\tid("org.jetbrains.intellij.platform") version "2.19.0"\n}\n\ngroup = "com.qybercom"\nversion = "' + manifest.version + '"\n');

		/* The example on the range of the versions 0.9.x the test sets first: they leave it as it is. */
		fs.writeFileSync(path.join(site, 'examples', 'Advanced', 'package.json'), JSON.stringify({name: 'advanced', dependencies: {'@qybercom/elemenx': '^0.9.0'}}, null, '\t') + '\n');
		/* Regression: Simple depended on ^1.0.0, a version that does not exist; every example follows the release. */
		fs.mkdirSync(path.join(site, 'examples', 'Simple'), {recursive: true});
		fs.writeFileSync(path.join(site, 'examples', 'Simple', 'package.json'), JSON.stringify({name: 'simple', dependencies: {'@qybercom/elemenx': '^1.0.0'}}, null, '\t') + '\n');
		/* Regression: the README kept the links of an older minor version to the CDN. */
		fs.writeFileSync(path.join(site, 'README.md'), '<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.8/dist/elemenx.all.min.js"></script>\nnpm deprecate @qybercom/elemenx@0.8.1\n');
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
		expect(fs.readFileSync(path.join(site, 'elemenx.js'), 'utf8')).toContain("var Version = '0.9.7';");
		expect(git(['tag'])).toBe('v0.9.7');
		expect(git(['rev-list', '-n', '1', 'v0.9.7'])).toBe(git(['rev-parse', 'HEAD']));
		expect(git(['show', '--name-only', '--format=', 'HEAD']).split('\n').sort()).toEqual(['README.md', 'editors/intellij/build.gradle.kts', 'editors/vscode/package.json', 'elemenx.js', 'examples/Simple/package.json', 'package.json', 'packages/elemenx/package.json']);
		expect(read('examples/Simple/package.json').dependencies).toEqual({'@qybercom/elemenx': '^0.9.0'});
		expect(fs.readFileSync(path.join(site, 'README.md'), 'utf8')).toBe('<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.9/dist/elemenx.all.min.js"></script>\nnpm deprecate @qybercom/elemenx@0.8.1\n');
		expect(read('editors/vscode/package.json').version).toBe('0.9.7');
		expect(fs.readFileSync(path.join(site, 'editors', 'intellij', 'build.gradle.kts'), 'utf8')).toContain('\nversion = "0.9.7"\n');
		expect(fs.readFileSync(path.join(site, 'editors', 'intellij', 'build.gradle.kts'), 'utf8')).toContain('version "2.19.0"');
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

		/* The versions changed by hand, the dependency of the wrapper forgotten: no tag, the message names the dependency. */
		fs.writeFileSync(path.join(site, 'packages', 'elemenx', 'package.json'), JSON.stringify(Object.assign(read('packages/elemenx/package.json'), {version: '0.9.9'}), null, '\t') + '\n');
		fs.writeFileSync(path.join(site, 'package.json'), JSON.stringify(Object.assign(read('package.json'), {version: '0.9.9'}), null, '\t') + '\n');

		git(['commit', '-q', '-am', 'Versions by hand']);

		run = script('version:tag');

		expect(run.status).not.toBe(0);
		expect(run.stderr).toContain('Elemenx version: package.json has the version 0.9.9, but packages/elemenx/package.json depends on @qybercom/elemenx 0.9.8, elemenx.js has the version 0.9.8, editors/vscode/package.json has the version 0.9.8, editors/intellij/build.gradle.kts has the version 0.9.8. Run npm run version:set (it puts 0.9.9 everywhere), commit, then npm run version:tag');
		expect(git(['tag', '--list', 'v0.9.9'])).toBe('');

		/* version:set without a version puts the one of package.json everywhere. */
		run = script('version:set');

		expect(run.status, run.stderr).toBe(0);
		expect(read('package.json').version).toBe('0.9.9');
		expect(read('packages/elemenx/package.json').version).toBe('0.9.9');
		expect(read('packages/elemenx/package.json').dependencies).toEqual({'@qybercom/elemenx': '0.9.9'});

		git(['commit', '-q', '-am', 'version:set']);

		run = script('version:tag');

		expect(run.status, run.stderr).toBe(0);
		expect(git(['tag', '--list', 'v0.9.9'])).toBe('v0.9.9');

		/* A minor version: the example depends on it (regression: 0.10.0 left the example on ^0.9.0 and the tests of CI failed). */
		run = script('version:set', ['0.10.0']);

		expect(run.status, run.stderr).toBe(0);
		expect(read('examples/Advanced/package.json').dependencies).toEqual({'@qybercom/elemenx': '^0.10.0'});

		/* Changed back by hand: no tag, the message names it. */
		fs.writeFileSync(path.join(site, 'examples', 'Advanced', 'package.json'), JSON.stringify({name: 'advanced', dependencies: {'@qybercom/elemenx': '^0.9.0'}}, null, '\t') + '\n');

		git(['commit', '-q', '-am', '0.10.0']);

		run = script('version:tag');

		expect(run.status).not.toBe(0);
		expect(run.stderr).toContain('examples/Advanced/package.json depends on @qybercom/elemenx ^0.9.0');
	}, 60000);

	it('npm run release <version> checks first, then tests, sets the version, commits, tags and pushes, and stops at a step that fails', function () {
		var Release = require(path.join(root, 'scripts', 'release.js'));
		var answers = {'rev-parse --abbrev-ref HEAD': 'main\n', 'tag --list v0.9.5': '', 'ls-remote --tags origin refs/tags/v0.9.5': '', 'fetch --quiet origin main': '', 'rev-list --count HEAD..origin/main': '0\n', 'status --short': ' M elemenx.js\n'};
		var ran;
		var said;
		var result;

		function options (extra) {
			ran = [];
			said = '';

			return Object.assign({
				Version: '0.9.5',
				Current: '0.9.4',
				Npm: 'npm-cli.js',
				Git: function (args) {
					return answers[args.join(' ')] || '';
				},
				Run: function (command, args) {
					ran.push(args.filter(function (arg) {
						return arg !== 'npm-cli.js';
					}).join(' '));

					return true;
				},
				Ask: function (question, answer) {
					answer(false);
				},
				Say: function (text) {
					said += text;
				}
			}, extra || {});
		}

		function go (extra) {
			result = 'pending';

			Release.Release(options(extra), function (error) {
				result = error ? error.message : null;
			});

			return result;
		}

		/* The version is required, exact, and greater than the one of package.json. */
		expect(Release.Parse([]).Error).toBe('give the version: npm run release 0.9.5');
		expect(Release.Parse(['patch']).Error).toBe('the version must be exact, as 0.9.5 or 1.0.0-beta.1: patch');
		expect(Release.Parse(['v1.0.0-beta.1', '--yes', '--skip-tests'])).toEqual({Version: '1.0.0-beta.1', Yes: true, SkipTests: true});
		expect([Release.Compare('0.9.5', '0.9.4'), Release.Compare('1.0.0-beta.1', '1.0.0'), Release.Compare('0.10.0', '0.9.9'), Release.Compare('0.9.4', '0.9.4')]).toEqual([1, -1, 1, 0]);

		/* Not confirmed: it shows what it will commit and does nothing. */
		expect(go()).toBe('Elemenx release: nothing done, not confirmed (--yes makes it without the question)');
		expect(said).toContain(' M elemenx.js');
		expect(ran).toEqual([]);

		/* Confirmed: the whole of it, in this order. */
		expect(go({Yes: true})).toBe(null);
		expect(ran).toEqual(['test', 'run version:set -- 0.9.5', 'run dist', 'run version:built -- --all', 'add --all', 'commit -m v0.9.5', 'run version:tag', 'push --follow-tags']);

		expect(go({Yes: true, SkipTests: true})).toBe(null);
		expect(ran[0]).toBe('run version:set -- 0.9.5');

		/* A step that fails stops it, and it says what is done. */
		expect(go({Yes: true, Run: function (command, args) {
			ran.push(args.join(' '));

			return args.indexOf('version:tag') === -1;
		}})).toBe('Elemenx release: the tag failed. Done: the tests, the version, the build, the check of the build, git add, the commit. Fix it and go on by hand from the tag (docs/RELEASING.md).');

		/* A build not of the version stops it before the commit. */
		expect(go({Yes: true, SkipTests: true, Run: function (command, args) {
			ran.push(args.join(' '));

			return args.indexOf('version:built') === -1;
		}})).toBe('Elemenx release: the check of the build failed. Done: the version, the build. Fix it and go on by hand from the check of the build (docs/RELEASING.md).');

		/* What stops it before it changes anything. */
		answers['rev-parse --abbrev-ref HEAD'] = 'feature\n';
		answers['tag --list v0.9.5'] = 'v0.9.5\n';
		answers['rev-list --count HEAD..origin/main'] = '2\n';

		expect(go({Yes: true, Current: '0.9.5'})).toBe('Elemenx release: nothing done, the branch is feature, a release is made on main; the version 0.9.5 is not greater than 0.9.5 of package.json; the tag v0.9.5 exists already; main is 2 commit(s) behind origin/main: git pull first');
		expect(ran).toEqual([]);

		/* The command of package.json. */
		expect(manifest.scripts.release).toBe('node scripts/release.js');
	});

	/*
	 * A bug: the files of the machine of the maintainer kept the version before the release (the tests built them before
	 * version:set), and the incremental build of Visual Studio kept the manifest of 0.10.2 in 0.10.6.
	 */
	it('npm run version:built finds each file of dist, each extension of the editors and the elemenx.js in it, that is not of the version', function () {
		var Version = require(path.join(root, 'scripts', 'version.js'));
		var Zip = require(path.join(root, 'tools', 'zip.js'));
		var Build = fs.readFileSync(path.join(root, 'editors', 'build.js'), 'utf8');
		var directory = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-built-'));

		temporary.push(directory);

		function framework (version) {
			return '/*! Elemenx ' + version + ' | LGPL-3.0 */\n(function () {\n\tvar Version = \'' + version + '\';\n})();\n';
		}

		/* A dist of the versions: {Dist, Core, VSCode, IntelliJ, Jar, VisualStudio}, each 1.2.3 unless given. */
		function make (versions) {
			var v = Object.assign({Dist: '1.2.3', Core: '1.2.3', VSCode: '1.2.3', IntelliJ: '1.2.3', Jar: '1.2.3', VisualStudio: '1.2.3'}, versions);
			var jar = Zip.Archive([{Name: 'META-INF/plugin.xml', Data: '<idea-plugin>\n  <version>' + v.IntelliJ + '</version>\n</idea-plugin>\n'}, {Name: 'elemenx/core/elemenx.js', Data: framework(v.Core)}]);

			fs.rmSync(path.join(directory, 'dist'), {recursive: true, force: true});
			fs.mkdirSync(path.join(directory, 'dist', 'editors'), {recursive: true});
			fs.writeFileSync(path.join(directory, 'dist', 'manifest.json'), JSON.stringify({Name: '@qybercom/elemenx', Version: v.Dist}));
			fs.writeFileSync(path.join(directory, 'dist', 'elemenx.js'), framework(v.Dist));
			fs.writeFileSync(path.join(directory, 'dist', 'elemenx-ui.min.js'), '/*! ElemenxUI ' + v.Dist + ' | LGPL-3.0 */\n');
			fs.writeFileSync(path.join(directory, 'dist', 'editors', 'elemenx-vscode.vsix'), Zip.Archive([{Name: 'extension/package.json', Data: JSON.stringify({version: v.VSCode})}, {Name: 'extension/core/elemenx.js', Data: framework(v.Core)}]));
			fs.writeFileSync(path.join(directory, 'dist', 'editors', 'elemenx-intellij.zip'), Zip.Archive([{Name: 'elemenx-intellij/lib/elemenx-intellij-' + v.Jar + '.jar', Data: jar}]));
			fs.writeFileSync(path.join(directory, 'dist', 'editors', 'elemenx-visualstudio.vsix'), Zip.Archive([{Name: 'extension.vsixmanifest', Data: '<PackageManifest><Metadata><Identity Id="Qybercom.Elemenx" Version="' + v.VisualStudio + '" /></Metadata></PackageManifest>'}, {Name: 'core/elemenx.js', Data: framework(v.Core)}]));

			return path.join(directory, 'dist');
		}

		expect(Version.Built(make({}), '1.2.3', true)).toEqual([]);

		/* Visual Studio takes no prerelease: 1.2.3 is the version of 1.2.3-beta.1 there. */
		expect(Version.Built(make({Dist: '1.2.3-beta.1', Core: '1.2.3-beta.1', VSCode: '1.2.3-beta.1', IntelliJ: '1.2.3-beta.1', Jar: '1.2.3-beta.1'}), '1.2.3-beta.1', true)).toEqual([]);

		expect(Version.Built(make({Dist: '1.2.2'}), '1.2.3', true)).toEqual(['manifest.json has the version 1.2.2', 'elemenx-ui.min.js has the version 1.2.2', 'elemenx.js has the version 1.2.2']);
		expect(Version.Built(make({VSCode: '1.2.2', VisualStudio: '1.2.0'}), '1.2.3', true)).toEqual(['editors/elemenx-vscode.vsix has the version 1.2.2', 'editors/elemenx-visualstudio.vsix has the version 1.2.0']);
		expect(Version.Built(make({IntelliJ: '1.2.2'}), '1.2.3', true)).toEqual(['editors/elemenx-intellij.zip has the version 1.2.2 in plugin.xml']);
		expect(Version.Built(make({Jar: '1.2.2'}), '1.2.3', true)).toEqual(['editors/elemenx-intellij.zip has elemenx-intellij/lib/elemenx-intellij-1.2.2.jar']);
		expect(Version.Built(make({Core: '1.2.2'}), '1.2.3', true)).toEqual(['editors/elemenx-vscode.vsix carries elemenx.js 1.2.2', 'editors/elemenx-intellij.zip carries elemenx.js 1.2.2', 'editors/elemenx-visualstudio.vsix carries elemenx.js 1.2.2']);

		/* An extension not built: required by a release (--all), left out by the jobs of CI that build some of them. */
		fs.rmSync(path.join(make({}), 'editors', 'elemenx-visualstudio.vsix'));

		expect(Version.Built(path.join(directory, 'dist'), '1.2.3', true)).toEqual(['editors/elemenx-visualstudio.vsix is not built']);
		expect(Version.Built(path.join(directory, 'dist'), '1.2.3', false)).toEqual([]);
		expect(Version.Built(path.join(directory, 'nothing'), '1.2.3', true)).toEqual(['dist is not built']);

		/* The build of Visual Studio starts from nothing, before its MSBuild. */
		expect(Build.indexOf('path.join(visualstudio, \'obj\', \'Release\')')).toBeGreaterThan(-1);
		expect(Build.indexOf('path.join(visualstudio, \'obj\', \'Release\')')).toBeLessThan(Build.indexOf('Elemenx.VisualStudio.csproj\'), \'/restore\''));
		expect(manifest.scripts['version:built']).toBe('node scripts/version.js built');
	});

	afterAll(function () {
		temporary.forEach(function (directory) {
			fs.rmSync(directory, {recursive: true, force: true});
		});
	});
});
