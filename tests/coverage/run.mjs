import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* npm run test:coverage:all — Vitest coverage, Playwright coverage, then the combined report in coverage/all. */

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

fs.rmSync(raw, {recursive: true, force: true});

run('npx', ['playwright', 'test'], {ELEMENX_COVERAGE: raw});
run('node', [path.join('tests', 'coverage', 'merge.mjs')]);
