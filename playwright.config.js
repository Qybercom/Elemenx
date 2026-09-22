import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/history',
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: 'http://127.0.0.1:4173',
		channel: 'chrome',
		headless: true
	},
	webServer: {
		command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort --configLoader bundle',
		url: 'http://127.0.0.1:4173/tests/history/fixture.html',
		reuseExistingServer: false,
		stdout: 'pipe',
		stderr: 'pipe'
	}
});