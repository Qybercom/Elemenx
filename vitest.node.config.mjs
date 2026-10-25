import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/regression/cli-generator.test.js', 'tests/regression/cli-icons.test.js', 'tests/regression/theming.test.js', 'tests/regression/emoji-data.test.js', 'tests/regression/cities.test.js', 'tests/regression/achievements.test.js', 'tests/regression/diff.test.js', 'tests/regression/devices.test.js', 'tests/regression/formats.test.js', 'tests/regression/locales.test.js', 'tests/regression/minify.test.js', 'tests/regression/dist.test.js', 'tests/regression/expressions.test.js', 'tests/regression/electron.test.js', 'tests/regression/native.test.js', 'tests/regression/builder-multi-application.test.js', 'tests/regression/server.test.js', 'tests/regression/package-release.test.js', 'tests/regression/es5-syntax.test.js', 'tests/regression/runtime-internals.test.js', 'tests/regression/shake.test.js', 'tests/regression/syntax.test.js', 'tests/regression/form-order.test.js', 'tests/regression/cli-meta.test.js', 'tests/regression/cli-splash.test.js', 'tests/regression/cli-icon.test.js', 'tests/regression/library-names.test.js']
	}
});