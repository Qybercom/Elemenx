import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/*
 * Playwright `test` with optional V8 coverage of elemenx.js.
 * When ELEMENX_COVERAGE names a directory (set by tests/coverage/run.mjs), the coverage of every page is written there
 * and later merged with the Vitest coverage by tests/coverage/merge.mjs. Without it, pages run exactly as before.
 */

var directory = process.env.ELEMENX_COVERAGE || '';
var sequence = 0;

export var test = base.extend({
	page: async function ({ page }, use) {
		if (!directory) {
			await use(page);

			return;
		}

		await page.coverage.startJSCoverage({resetOnNavigation: false});

		await use(page);

		var entries = (await page.coverage.stopJSCoverage()).filter(function (entry) {
			return /\/elemenx\.js(\?|#|$)/.test(entry.url);
		});

		sequence++;

		fs.mkdirSync(directory, {recursive: true});
		fs.writeFileSync(path.join(directory, process.pid + '-' + sequence + '.json'), JSON.stringify(entries));
	}
});

export { expect };
