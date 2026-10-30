import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		/* 4 files at a time, as the end-to-end tests (ELEMENX_WORKERS sets it): all of the processors froze the machine. */
		maxWorkers: Number(process.env.ELEMENX_WORKERS) || 4,
		/*
		 * These tests build Applications, minify, spawn the CLI and servers: real work, not units. Alone a build takes a
		 * quarter of a second, beside the browser tests of a full run (or a second run) more than the 5 seconds of Vitest
		 * by default, and the test failed without a fault of its own.
		 */
		testTimeout: 60000,
		/* The dist tests build the whole framework once, before them. */
		hookTimeout: 120000,
		include: ['tests/regression/cli-generator.test.js', 'tests/regression/cli-icons.test.js', 'tests/regression/theming.test.js', 'tests/regression/emoji-data.test.js', 'tests/regression/cities.test.js', 'tests/regression/achievements.test.js', 'tests/regression/diff.test.js', 'tests/regression/devices.test.js', 'tests/regression/formats.test.js', 'tests/regression/locales.test.js', 'tests/regression/minify.test.js', 'tests/regression/mangle.test.js', 'tests/regression/designer-cli.test.js', 'tests/regression/single-page-text.test.js', 'tests/regression/tutorials.test.js', 'tests/regression/split.test.js', 'tests/regression/build-languages.test.js', 'tests/regression/dist.test.js', 'tests/regression/expressions.test.js', 'tests/regression/electron.test.js', 'tests/regression/native.test.js', 'tests/regression/builder-multi-application.test.js', 'tests/regression/server.test.js', 'tests/regression/package-release.test.js', 'tests/regression/es5-syntax.test.js', 'tests/regression/runtime-internals.test.js', 'tests/regression/shake.test.js', 'tests/regression/syntax.test.js', 'tests/regression/form-order.test.js', 'tests/regression/cli-meta.test.js', 'tests/regression/cli-splash.test.js', 'tests/regression/cli-icon.test.js', 'tests/regression/library-names.test.js', 'tests/regression/language-server.test.js', 'tests/regression/editors-build.test.js', 'tests/regression/editors-branding.test.js', 'tests/regression/headless.test.js', 'tests/regression/frontend-style.test.js', 'tests/regression/docs-site.test.js', 'tests/regression/build-targets.test.js', 'tests/regression/build-base.test.js', 'tests/regression/build-inheritance.test.js']
	}
});