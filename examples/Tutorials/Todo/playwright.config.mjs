import { defineConfig } from '@playwright/test';

/* The tests of the whole application: elemenx serves the build, a browser uses it as a person would. */
export default defineConfig({
	testDir: 'tests',
	testMatch: '**/*.spec.js',
	use: {
		baseURL: 'http://127.0.0.1:4318'
	},
	webServer: {
		command: 'npx elemenx build && npx elemenx serve',
		url: 'http://127.0.0.1:4318',
		reuseExistingServer: true
	}
});
