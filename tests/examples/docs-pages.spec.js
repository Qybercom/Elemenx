import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/*
 * Every page of the reference, in English and in Russian: it opens, it is in its language (no English stand-in), its
 * examples run (no failure shown, no error in the console) and show something.
 */
var origin = 'http://127.0.0.1:4277';
var index = JSON.parse(fs.readFileSync(path.resolve('examples/Docs/pages/index.json'), 'utf8'));
var size = 24;

/* The pages of a section in parts of at most size pages, so the workers share the long sections. */
function parts () {
	var result = [];

	index.Sections.forEach(function (section) {
		var i = 0;

		while (i < section.Pages.length) {
			result.push({Section: section.ID, Pages: section.Pages.slice(i, i + size).map(function (page) {
				return section.ID + '/' + page.ID;
			}), From: i + 1});

			i += size;
		}
	});

	return result;
}

test.describe('Elemenx documentation: every page', function () {
	['en', 'ru'].forEach(function (language) {
		parts().forEach(function (part) {
			test(language + ': ' + part.Section + ' from ' + part.From, async function ({ page }) {
				var errors = [];
				var problems = [];
				var i = 0;
				var id;
				var state;
				var started;

				test.setTimeout(240000);

				page.on('pageerror', function (error) {
					errors.push(error.message);
				});

				page.on('console', function (message) {
					if (message.type() === 'error')
						errors.push(message.text());
				});

				await page.addInitScript(function (value) {
					localStorage.setItem('elemenx-docs:language', value);
				}, language);

				while (i < part.Pages.length) {
					id = part.Pages[i];
					errors.length = 0;

					await page.goto(origin + '/' + id);

					await expect(page.locator('.docs-article h1').first()).toBeVisible();

					await page.waitForTimeout(600);

					/* Read again while it is not clean, for up to 15 seconds: a busy page draws its examples late (regression: one look found one empty). */
					started = Date.now();
					state = null;

					do {
						if (state)
							await page.waitForTimeout(250);

						state = await page.evaluate(function () {
							return {
								Failures: Array.prototype.map.call(document.querySelectorAll('.docs-example .elemenx-callout.danger'), function (node) {
									return node.textContent;
								}),
								Missing: !!document.querySelector('.docs-missing'),
								Fallback: !!document.querySelector('.docs-fallback'),
								Empty: Array.prototype.filter.call(document.querySelectorAll('.docs-example-result'), function (node) {
									return !node.innerText.trim() && !node.querySelector('svg, img, canvas, input, button, textarea');
								}).length
							};
						});
					} while ((state.Failures.length || state.Missing || state.Fallback || state.Empty) && Date.now() - started < 15000);

					if (state.Failures.length || state.Missing || state.Fallback || state.Empty || errors.length)
						problems.push(id + ': ' + JSON.stringify({Failures: state.Failures, Missing: state.Missing, Fallback: state.Fallback, Empty: state.Empty, Errors: errors.slice()}));

					i++;
				}

				expect(problems).toEqual([]);
			});
		});
	});
});
