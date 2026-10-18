import { test, expect } from '../coverage/playwright.js';

/*
 * The layouts that a scrollbar of their own may shift, with the scrollbars of a desktop browser: headless Chrome hides
 * them unless it is told not to.
 */
test.use({launchOptions: {ignoreDefaultArgs: ['--hide-scrollbars']}});

test.describe('ElemenxUI with the scrollbars of a desktop browser', function () {
	test('the days of the week of the calendar stand over their columns while the hours scroll', async function ({ page }) {
		var calendar;
		var offsets;

		await page.goto('http://127.0.0.1:4274/ui');

		await expect(page.locator('.ui-kit-intro')).toBeVisible({timeout: 30000});

		calendar = page.locator('.elemenx-cal').first();

		await calendar.scrollIntoViewIfNeeded();
		await calendar.getByRole('button', {name: 'Week'}).click();

		offsets = await calendar.evaluate(function (node) {
			var body = node.querySelector('.elemenx-cal-week-body');
			var heads = node.querySelectorAll('.elemenx-cal-week-day');
			var alldays = node.querySelectorAll('.elemenx-cal-allday');
			var columns = node.querySelectorAll('.elemenx-cal-column');

			return {
				Scrollbar: body.offsetWidth - body.clientWidth,
				Heads: Array.prototype.map.call(columns, function (column, index) {
					return Math.round(Math.abs(heads[index].getBoundingClientRect().right - column.getBoundingClientRect().right));
				}),
				AllDay: Array.prototype.map.call(columns, function (column, index) {
					return Math.round(Math.abs(alldays[index].getBoundingClientRect().left - column.getBoundingClientRect().left));
				})
			};
		});

		/* The hours have a real scrollbar here, and the columns above them still line up with the days. */
		expect(offsets.Scrollbar).toBeGreaterThan(0);
		expect(offsets.Heads).toEqual([0, 0, 0, 0, 0, 0, 0]);
		expect(offsets.AllDay).toEqual([0, 0, 0, 0, 0, 0, 0]);
	});
});
