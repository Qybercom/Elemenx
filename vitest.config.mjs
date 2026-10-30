import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

var outside = ['tests/production/**', 'tests/history/**', 'tests/tools/**', 'tests/regression/cli-generator.test.js', 'tests/regression/cli-icons.test.js', 'tests/regression/theming.test.js', 'tests/regression/emoji-data.test.js', 'tests/regression/cities.test.js', 'tests/regression/achievements.test.js', 'tests/regression/diff.test.js', 'tests/regression/devices.test.js', 'tests/regression/formats.test.js', 'tests/regression/locales.test.js', 'tests/regression/minify.test.js', 'tests/regression/mangle.test.js', 'tests/regression/designer-cli.test.js', 'tests/regression/single-page-text.test.js', 'tests/regression/tutorials.test.js', 'tests/regression/split.test.js', 'tests/regression/build-languages.test.js', 'tests/regression/dist.test.js', 'tests/regression/expressions.test.js', 'tests/regression/electron.test.js', 'tests/regression/native.test.js', 'tests/regression/builder-multi-application.test.js', 'tests/regression/server.test.js', 'tests/regression/package-release.test.js', 'tests/regression/es5-syntax.test.js', 'tests/regression/runtime-internals.test.js', 'tests/regression/shake.test.js', 'tests/regression/syntax.test.js', 'tests/regression/form-order.test.js', 'tests/regression/cli-meta.test.js', 'tests/regression/cli-splash.test.js', 'tests/regression/cli-icon.test.js', 'tests/regression/library-names.test.js', 'tests/regression/language-server.test.js', 'tests/regression/editors-build.test.js', 'tests/regression/editors-branding.test.js', 'tests/regression/headless.test.js', 'tests/regression/frontend-style.test.js', 'tests/regression/docs-site.test.js', 'tests/regression/build-targets.test.js', 'tests/regression/build-base.test.js', 'tests/regression/build-inheritance.test.js'];
var graphics = ['tests/regression/library-scene.test.js', 'tests/regression/game-world.test.js'];

/* ELEMENX_SCRIPT runs the browser contracts against another build of the framework: npm run test:min uses dist/elemenx.min.js. */
export default defineConfig({
	publicDir: 'tests/public',
	define: {
		__ELEMENX_SCRIPT__: JSON.stringify(process.env.ELEMENX_SCRIPT || '/elemenx.js')
	},
	test: {
		/* 4 files at a time, as the end-to-end tests (ELEMENX_WORKERS sets it): all of the processors froze the machine. */
		maxWorkers: Number(process.env.ELEMENX_WORKERS) || 4,
		browser: {
			enabled: true,
			provider: playwright({
				/* Sound plays without a gesture of the user: the contracts of the Audio Service hear an oscillator. ELEMENX_SOFTWARE draws by the processor, as a runner of CI with no graphics card does. */
				launchOptions: {
					channel: 'chrome',
					args: ['--autoplay-policy=no-user-gesture-required'].concat(process.env.ELEMENX_SOFTWARE ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])
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
		/*
		 * The contracts share one page, so one that draws by the processor, as on a runner with no graphics card, holds up
		 * the others: what draws in 3D runs after them, a file at a time.
		 */
		projects: [
			{extends: true, test: {name: 'contracts', include: ['tests/**/*.test.js'], exclude: outside.concat(graphics), sequence: {groupOrder: 0}}},
			{extends: true, test: {name: 'graphics', include: graphics, exclude: outside, maxWorkers: 1, testTimeout: 90000, sequence: {groupOrder: 1}}}
		]
	}
});