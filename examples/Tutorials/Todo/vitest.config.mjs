import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

/* The unit tests run in a real browser (Chromium): Elemenx needs a DOM, its storage and its events. */
export default defineConfig({
	test: {
		include: ['tests/**/*.test.js'],
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{browser: 'chromium'}],
			headless: true
		}
	}
});
