import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/regression/cli-generator.test.js', 'tests/regression/builder-multi-application.test.js']
	}
});