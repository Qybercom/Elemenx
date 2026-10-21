import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	testMatch: ['history/**/*.spec.js', 'production/**/*.spec.js', 'examples/**/*.spec.js', 'dist/**/*.spec.js'],
	/*
	 * The tests, not the files, are split between the workers and the shards of CI: most of them are in ui-kit.spec.js.
	 * ELEMENX_WORKERS sets the number of workers; by default half of the processors, and 2 on a runner of CI.
	 */
	fullyParallel: true,
	/*
	 * The long tests of the catalogue take 15 seconds alone and more beside the other workers; every test opens the whole
	 * catalogue, which grows with every component.
	 */
	timeout: 120000,
	expect: {timeout: 10000},
	workers: process.env.ELEMENX_WORKERS ? Number(process.env.ELEMENX_WORKERS) : (process.env.CI ? 2 : '50%'),
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
	use: {
		baseURL: 'http://127.0.0.1:4273',
		channel: 'chrome',
		headless: true
	},
	webServer: [
		{
			command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4273 --strictPort --configLoader bundle --config vite.e2e.config.mjs',
			url: 'http://127.0.0.1:4273/tests/history/fixture.html',
			reuseExistingServer: false,
			stdout: 'pipe',
			stderr: 'pipe'
		},
		{
			command: 'node tools/server.js examples/Advanced',
			url: 'http://127.0.0.1:4274/',
			env: {PORT: '4274'},
			reuseExistingServer: false,
			stdout: 'pipe',
			stderr: 'pipe'
		},
		{
			command: 'node tests/production/server.js',
			url: 'http://127.0.0.1:4275/',
			env: {PORT: '4275'},
			reuseExistingServer: false,
			stdout: 'pipe',
			stderr: 'pipe'
		},
		{
			command: 'node tests/examples/server.js',
			url: 'http://127.0.0.1:4276/',
			env: {PORT: '4276'},
			reuseExistingServer: false,
			stdout: 'pipe',
			stderr: 'pipe'
		}
	]
});