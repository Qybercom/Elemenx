import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

/* ELEMENX_SCRIPT runs the browser contracts against another build of the framework: npm run test:min uses dist/elemenx.min.js. */
export default defineConfig({
	publicDir: 'tests/public',
	define: {
		__ELEMENX_SCRIPT__: JSON.stringify(process.env.ELEMENX_SCRIPT || '/elemenx.js')
	},
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
		coverage: {
			provider: 'v8',
			include: ['elemenx.js'],
			reporter: ['text-summary', 'json-summary', 'json', 'html']
		},
		include: ['tests/**/*.test.js'],
		exclude: ['tests/production/**', 'tests/history/**', 'tests/tools/**', 'tests/regression/cli-generator.test.js', 'tests/regression/cli-icons.test.js', 'tests/regression/theming.test.js', 'tests/regression/emoji-data.test.js', 'tests/regression/minify.test.js', 'tests/regression/dist.test.js', 'tests/regression/builder-multi-application.test.js', 'tests/regression/server.test.js', 'tests/regression/package-release.test.js', 'tests/regression/es5-syntax.test.js', 'tests/regression/runtime-internals.test.js']
	}
});