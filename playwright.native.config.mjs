import { defineConfig } from '@playwright/test';

/*
 * The native programs of examples/Native, run for real: npm run test:native. It needs Electron in that example
 * (npx elemenx native add desktop examples/Native, about 100 MB), so npm test leaves it out.
 */
export default defineConfig({
	testDir: './tests/native',
	testMatch: ['**/*.spec.js'],
	timeout: 600000,
	expect: {timeout: 15000},
	workers: 1,
	reporter: 'list'
});
