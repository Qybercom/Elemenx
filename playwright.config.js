import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	testMatch: ['history/**/*.spec.js', 'production/**/*.spec.js', 'examples/**/*.spec.js', 'dist/**/*.spec.js'],
	/*
	 * The tests, not the files, are split between the workers and the shards of CI: most of them are in ui-kit.spec.js.
	 * ELEMENX_WORKERS sets the number of workers; by default 4 (each runs a browser: more froze a machine of 16 threads),
	 * and 2 on a runner of CI.
	 */
	fullyParallel: true,
	/*
	 * The long tests of the catalogue take 15 seconds alone and more beside the other workers. An expect ends as soon as it
	 * holds; its limit is for a busy machine, where one development server answers every worker and a pack of icons or
	 * the data of a chat came after 10 seconds.
	 */
	timeout: 120000,
	expect: {timeout: 20000},
	workers: process.env.ELEMENX_WORKERS ? Number(process.env.ELEMENX_WORKERS) : (process.env.CI ? 2 : 4),
	forbidOnly: !!process.env.CI,
	/*
	 * In CI a failed test runs once more: one that passes then is reported flaky (an annotation of the github reporter),
	 * not hidden. Locally a test runs once; npm run test:stress -- <file or -g name> runs tests five times on every
	 * processor, to find the flaky ones on purpose.
	 */
	retries: process.env.CI ? 1 : 0,
	/*
	 * In CI the github reporter makes every failed test an annotation of its job (its file, line and error): readable
	 * through the public API of GitHub, where the logs and the reports need the rights of an admin of the repository.
	 */
	reporter: process.env.CI ? [['list'], ['github'], ['html', {open: 'never'}]] : 'list',
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
		},
		{
			command: 'node tools/server.js examples/Docs',
			url: 'http://127.0.0.1:4277/',
			env: {PORT: '4277'},
			reuseExistingServer: false,
			stdout: 'pipe',
			stderr: 'pipe'
		},
		{
			command: 'node tools/server.js examples/Designer',
			url: 'http://127.0.0.1:4278/',
			env: {PORT: '4278'},
			reuseExistingServer: false,
			stdout: 'pipe',
			stderr: 'pipe'
		}
	]
});