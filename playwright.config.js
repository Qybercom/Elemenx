import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	testMatch: ['history/**/*.spec.js', 'production/**/*.spec.js', 'examples/**/*.spec.js'],
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: 'http://127.0.0.1:4273',
		channel: 'chrome',
		headless: true
	},
	webServer: [
		{
			command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4273 --strictPort --configLoader bundle',
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