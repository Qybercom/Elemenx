/*
 * The static server of the Playwright tests (playwright.config.js). The tests build into these folders while it runs:
 * watching them lets Windows lock a file mid-build (EBUSY), and the error stops the server under the other tests.
 */
export default {
	server: {
		watch: {
			ignored: ['**/tests/dist/*-output/**', '**/examples/*/dist/**', '**/test-results/**', '**/playwright-report/**']
		}
	}
};
