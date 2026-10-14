import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/* The browser contracts again, against the minified framework of dist (npm run dist builds it). */
var script = path.resolve(process.cwd(), 'dist', 'elemenx.min.js');

if (!fs.existsSync(script)) {
	console.error('dist/elemenx.min.js not found: run npm run dist first');

	process.exit(1);
}

var result = spawnSync(process.execPath, [path.resolve(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs'), 'run'], {
	stdio: 'inherit',
	env: Object.assign({}, process.env, {ELEMENX_SCRIPT: '/dist/elemenx.min.js'})
});

process.exit(result.status === null ? 1 : result.status);
