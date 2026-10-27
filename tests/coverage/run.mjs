import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/*
 * npm run test:coverage:all — Vitest coverage, the one of elemenx.js without a DOM (headless.test.js, in Node), Playwright
 * coverage, then the combined report in coverage/all.
 */

var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var raw = path.join(root, 'coverage', 'playwright');

function run (command, args, env) {
	var result = spawnSync(command, args, {
		cwd: root,
		stdio: 'inherit',
		shell: true,
		env: Object.assign({}, process.env, env || {})
	});
	if (result.status !== 0)
		process.exit(result.status || 1);
}

run('npx', ['vitest', 'run', '--coverage']);
run('npx', ['vitest', 'run', '--config', 'vitest.node.config.mjs', 'tests/regression/headless.test.js', '--coverage', '--coverage.include=elemenx.js', '--coverage.reporter=json', '--coverage.reportsDirectory=coverage/headless']);

fs.rmSync(raw, {recursive: true, force: true});

run('npx', ['playwright', 'test'], {ELEMENX_COVERAGE: raw});
run('node', [path.join('tests', 'coverage', 'merge.mjs')]);
