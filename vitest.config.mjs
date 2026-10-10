import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	publicDir: 'tests/public',
	test: {
		browser: {
			enabled: true,
			provider: playwright({
				launchOptions: {
					channel: 'chrome'
				}
			}),
			instances: [
				{browser: 'chromium'}
			],
			headless: true
		},
		include: ['tests/**/*.test.js'],
		exclude: ['tests/production/**', 'tests/history/**', 'tests/tools/**', 'tests/regression/cli-generator.test.js', 'tests/regression/builder-multi-application.test.js', 'tests/regression/server.test.js', 'tests/regression/package-release.test.js', 'tests/regression/es5-syntax.test.js', 'tests/regression/runtime-internals.test.js']
	}
});