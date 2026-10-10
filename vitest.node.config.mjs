import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/regression/cli-generator.test.js', 'tests/regression/builder-multi-application.test.js', 'tests/regression/server.test.js', 'tests/regression/package-release.test.js', 'tests/regression/es5-syntax.test.js', 'tests/regression/runtime-internals.test.js']
	}
});