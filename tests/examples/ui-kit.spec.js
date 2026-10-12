import { test, expect } from '../coverage/playwright.js';

var origins = [
	{Name: 'development', URL: 'http://127.0.0.1:4274'},
	{Name: 'production', URL: 'http://127.0.0.1:4276'}
];

function captureErrors (page) {
	var errors = [];

	page.on('pageerror', function (error) {
		errors.push(error.message);
	});

	page.on('console', function (message) {
		if (message.type() === 'error')
			errors.push(message.text());
	});

	return errors;
}

function section (page, title) {
	return page.locator('.ui-kit > .elemenx-section').filter({has: page.locator(':scope > .elemenx-section-header .elemenx-section-title', {hasText: new RegExp('^' + title + '$')})});
}

function field (page, label) {
	return page.locator('.elemenx-field').filter({has: page.locator('.elemenx-field-label', {hasText: new RegExp('^' + label + '$')})});
}

async function open (page, origin) {
	await page.goto(origin.URL + '/ui');

	/* The catalogue is a large page: under a full parallel run its development build may take more than 5 seconds. */
	await expect(page.locator('.elemenx-workspace')).toBeVisible({timeout: 20000});
}

for (const origin of origins) {
	test.describe('ElemenxUI catalogue (' + origin.Name + ')', function () {
		test('renders every section with icons and library styles and no errors', async function ({ page }) {
			var errors = captureErrors(page);
			var sprite;

			await open(page, origin);

			await expect(page.locator('.ui-kit > .elemenx-section')).toHaveCount(22);

			await expect(page.locator('#elemenx-icons')).toHaveAttribute('data-ready', 'true');
			await expect(page.locator('.ui-kit-icon svg').first()).toHaveAttribute('data-icon', 'add');
			await expect(page.locator('.ui-kit-icon svg').first()).toHaveAttribute('viewBox', '0 0 24 24');
			await expect(page.locator('.ui-kit-icon svg').first().locator('path')).toHaveCount(1);
			await expect(page.locator('#elemenx-icons symbol#elemenx-icon-add')).toHaveCount(1);
			await expect(page.locator('svg.elemenx-icon use')).toHaveCount(0);

			sprite = await page.evaluate(function () {
				return performance.getEntriesByType('resource').map(function (entry) {
					return entry.name;
				}).filter(function (name) {
					return /icons\.svg$/.test(name);
				})[0];
			});

			expect((await page.request.get(sprite)).status()).toBe(200);

			expect(await page.locator('.elemenx-button.primary').first().evaluate(function (node) {
				return getComputedStyle(node).backgroundColor;
			})).not.toBe('rgba(0, 0, 0, 0)');

			await page.evaluate(function () {
				document.body.setAttribute('data-theme', 'dark');
			});

			expect(await page.locator('.elemenx-input').first().evaluate(function (node) {
				return getComputedStyle(node).backgroundColor;
			})).toBe('rgb(29, 32, 37)');

			expect(errors).toEqual([]);
		});

		test('phone input keeps to its mask and picks the country of a pasted number', async function ({ page }) {
			var phone;
			var input;

			await open(page, origin);

			phone = field(page, 'Phone');
			input = phone.locator('input[type="tel"]');

			await expect(input).toHaveValue('+7 (999) 123-45-67');

			await input.fill('');
			await input.pressSequentially('9a1b2-3 4567890123');

			await expect(input).toHaveValue('+7 (912) 345-67-89');
			await expect(phone.locator('.elemenx-caption')).toContainText('+79123456789');

			await input.fill('');
			await input.evaluate(function (node) {
				var data = new DataTransfer();

				data.setData('text', '+44 20 7946 0958');

				node.dispatchEvent(new ClipboardEvent('paste', {clipboardData: data, bubbles: true, cancelable: true}));
			});

			await expect(phone.locator('.elemenx-phone-country')).toContainText('GB');
			await expect(input).toHaveValue('+44 2079 460958');

			await phone.locator('.elemenx-phone-country').click();

			await page.keyboard.type('serb');
			await page.keyboard.press('Enter');

			await expect(phone.locator('.elemenx-phone-country')).toContainText('RS');
			await expect(input).toHaveValue('+381 20 794 6095');
		});

		test('card inputs format, detect the brand and validate', async function ({ page }) {
			var card;
			var expiry;
			var saved;

			await open(page, origin);

			card = field(page, 'Card number').locator('input');
			expiry = field(page, 'Expires').locator('input');

			await card.pressSequentially('4242x4242-4242 4242');

			await expect(card).toHaveValue('4242 4242 4242 4242');
			await expect(field(page, 'Card number').locator('.elemenx-card-brand')).toHaveText('Visa');
			await expect(field(page, 'Card number').locator('.elemenx-caption')).toContainText('visa · valid');

			await card.fill('');
			await card.pressSequentially('378282246310005');

			await expect(card).toHaveValue('3782 822463 10005');
			await expect(field(page, 'Card number').locator('.elemenx-card-brand')).toHaveText('American Express');

			await expiry.pressSequentially('13');

			await expect(expiry).toHaveValue('1');

			await expiry.fill('');
			await expiry.pressSequentially('530');

			await expect(expiry).toHaveValue('05/30');

			saved = field(page, 'Saved card');

			await expect(saved.locator('.elemenx-card-conceal')).toHaveText('5555 •••• •••• 4444');
			await expect(saved.locator('input')).toHaveClass(/concealed/);

			await saved.locator('input').click();

			await expect(saved.locator('input')).toBeFocused();
			await expect(saved.locator('input')).toHaveValue('5555 5555 5555 4444');
			await expect(saved.locator('.elemenx-card-conceal')).toHaveText('5555 •••• •••• 4444');

			await saved.getByRole('button', {name: 'Show number'}).click();

			await expect(saved.locator('.elemenx-card-conceal')).toHaveCount(0);
			await expect(saved.locator('input')).not.toHaveClass(/concealed/);
			await expect(saved.getByRole('button', {name: 'Hide number'})).toHaveAttribute('aria-pressed', 'true');

			await saved.getByRole('button', {name: 'Hide number'}).click();

			await expect(saved.locator('.elemenx-card-conceal')).toHaveText('5555 •••• •••• 4444');
		});

		test('number input steps inside its bounds', async function ({ page }) {
			var amount;

			await open(page, origin);

			amount = field(page, 'Amount');

			await amount.getByRole('button', {name: 'Increase'}).click();

			await expect(amount.locator('input')).toHaveValue('43');

			await amount.locator('input').fill('500');
			await amount.locator('input').blur();

			await expect(amount.locator('input')).toHaveValue('100');
			await expect(amount.getByRole('button', {name: 'Increase'})).toBeDisabled();
		});

		test('select and multiselect pick values with mouse and keyboard', async function ({ page }) {
			var language;
			var tags;

			await open(page, origin);

			language = field(page, 'Language');

			await language.locator('.elemenx-select-trigger').click();

			await expect(language.locator('.elemenx-popup')).toBeVisible();

			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');

			await expect(language.locator('.elemenx-select-value')).toHaveText('CSS');
			await expect(language.locator('.elemenx-popup')).toBeHidden();

			await language.locator('.elemenx-select-trigger').click();

			await page.keyboard.type('kot');
			await page.keyboard.press('Enter');

			await expect(page.locator('.elemenx-section-header', {hasText: 'Selection'})).toContainText('Language: kotlin');

			await language.locator('.elemenx-select-trigger').click();
			await page.mouse.click(5, 5);

			await expect(language.locator('.elemenx-popup')).toBeHidden();

			tags = field(page, 'Tags');

			await tags.getByRole('button', {name: 'Remove Bug'}).click();

			await expect(tags.locator('.elemenx-chip')).toHaveCount(1);

			await tags.locator('.elemenx-select-trigger').click();
			await tags.locator('.elemenx-option', {hasText: 'Select all'}).click();

			await expect(tags.locator('.elemenx-chip')).toHaveCount(6);

			await page.keyboard.press('Escape');

			await expect(tags.locator('.elemenx-popup')).toBeHidden();
		});

		test('menu opens nested levels and reports the chosen item', async function ({ page }) {
			var menu;

			await open(page, origin);

			menu = page.locator('.ui-kit-row .elemenx-menu-root').first();

			await menu.getByRole('button', {name: 'File'}).click();
			await menu.getByRole('menuitem', {name: 'New'}).hover();
			await menu.getByRole('menuitem', {name: 'From template'}).hover();
			await menu.getByRole('menuitem', {name: 'Service'}).click();

			await expect(page.getByText('Menu: tpl-service')).toBeVisible();
			await expect(menu.locator('.elemenx-menu').first()).toBeHidden();

			await menu.getByRole('button', {name: 'File'}).click();

			await expect(menu.getByRole('menuitem', {name: 'New'})).toBeFocused();

			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');

			await expect(page.getByText('Menu: save')).toBeVisible();

			await menu.getByRole('button', {name: 'File'}).click();

			await expect(menu.getByRole('menuitem', {name: 'New'})).toBeFocused();

			await page.keyboard.press('ArrowRight');

			await expect(menu.getByRole('menuitem', {name: 'Folder'})).toBeVisible();

			await page.keyboard.press('Escape');

			await expect(menu.getByRole('menuitem', {name: 'Folder'})).toBeHidden();
			await expect(menu.getByRole('menuitem', {name: 'Save'})).toBeVisible();

			await page.keyboard.press('Escape');

			await expect(menu.getByRole('menuitem', {name: 'Save'})).toBeHidden();
		});

		test('editor tabs switch and close', async function ({ page }) {
			var editor;

			await open(page, origin);

			editor = page.locator('.ui-kit-editor .elemenx-tabs.editor');

			await editor.getByRole('tab', {name: 'index.html'}).click();

			await expect(page.getByText('Content of index.')).toBeVisible();

			await editor.getByRole('tab', {name: 'index.html'}).getByRole('button', {name: 'Close tab'}).click();

			await expect(editor.getByRole('tab')).toHaveCount(2);
			await expect(page.getByText('Content of app.')).toBeVisible();

			await editor.getByRole('tab', {name: 'app.js'}).focus();

			await page.keyboard.press('ArrowRight');

			await expect(page.getByText('Content of readme.')).toBeVisible();
		});

		test('file upload previews images and rejects files it does not accept', async function ({ page }) {
			var png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
			var gallery;

			await open(page, origin);

			gallery = page.locator('.elemenx-upload.gallery');

			await gallery.locator('input[type="file"]').setInputFiles([
				{name: 'pixel.png', mimeType: 'image/png', buffer: png},
				{name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('text')}
			]);

			await expect(gallery.locator('.elemenx-upload-tile img')).toHaveCount(1);
			await expect(gallery.locator('.elemenx-upload-errors')).toContainText('notes.txt');

			await gallery.locator('.elemenx-upload-tile').hover();
			await gallery.getByRole('button', {name: 'Remove pixel.png'}).click();

			await expect(gallery.locator('.elemenx-upload-tile')).toHaveCount(0);

			await page.locator('.elemenx-upload.dropzone input[type="file"]').setInputFiles([
				{name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a')},
				{name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('bb')}
			]);

			await expect(page.locator('.elemenx-upload.dropzone .elemenx-upload-item')).toHaveCount(2);
			await expect(page.locator('.elemenx-section-header', {hasText: 'Files and drag and drop'})).toContainText('Selected: 2');
		});

		test('radio groups and tab strips with their own state do not affect each other', async function ({ page }) {
			var checked = function (group) {
				return section(page, 'Selection').locator('.elemenx-radio-group.' + group + ' .elemenx-radio.checked .elemenx-check-label');
			};

			await open(page, origin);

			await section(page, 'Selection').locator('.elemenx-radio-group.default').getByText('Free', {exact: true}).click();

			await expect(checked('default')).toHaveText('Free');
			await expect(checked('tile')).toHaveText('Free');

			await section(page, 'Selection').locator('.elemenx-radio-group.tile').getByText('Team', {exact: true}).click();

			await expect(checked('tile')).toHaveText('Team');
			await expect(checked('default')).toHaveText('Free');

			await section(page, 'Selection').locator('.elemenx-radio-group.horizontal').getByText('Tree', {exact: true}).click();

			await expect(checked('horizontal')).toHaveText('Tree');
			await expect(checked('segmented')).toHaveText('List');
			await expect(page.locator('.elemenx-section-header', {hasText: 'Selection'})).toContainText('Plan: free · View: list');

			await page.locator('.elemenx-tabs.line').getByRole('tab', {name: 'Members'}).click();

			await expect(page.locator('.elemenx-tabs.line .elemenx-tab.active')).toContainText('Members');
			await expect(page.locator('.elemenx-tabs.pill .elemenx-tab.active')).toContainText('Billing');

			await page.locator('.ui-kit-editor').getByRole('tab', {name: 'index.html'}).click();

			await expect(page.locator('.ui-kit-editor .elemenx-tab.active')).toContainText('index.html');
			await expect(page.locator('.elemenx-workspace .elemenx-tab.active')).toContainText('app.js');
		});

		test('theme follows the system unless a policy is chosen, and remembers the policy', async function ({ page }) {
			var surface = function () {
				return page.locator('.elemenx-input').first().evaluate(function (node) {
					return getComputedStyle(node).backgroundColor;
				});
			};
			var css = await (await page.request.get(origin.URL + '/libraries/ElemenxUI/index.css')).text();
			var forced = css.match(/body\[data-theme='dark'\] \{([^}]*)\}/)[1];
			var system = css.match(/body\[data-theme='system'\] \{([^}]*)\}/)[1];

			expect(system.replace(/\s+/g, ' ')).toBe(forced.replace(/\s+/g, ' '));

			await page.emulateMedia({colorScheme: 'dark'});

			await open(page, origin);

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'system');
			expect(await surface()).toBe('rgb(29, 32, 37)');

			await page.locator('.ui-kit-intro').getByRole('button', {name: 'Light theme'}).click();

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
			expect(await page.locator('.elemenx-button').first().evaluate(function (node) {
				return getComputedStyle(node).transitionProperty;
			})).not.toMatch(/(^|, )color/);
			expect(await surface()).toBe('rgb(255, 255, 255)');

			await page.reload();

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
			await expect(page.locator('.ui-kit-intro').getByRole('button', {name: 'Light theme'})).toHaveAttribute('aria-pressed', 'true');

			await page.locator('.ui-kit-intro').getByRole('button', {name: 'System theme'}).click();

			expect(await surface()).toBe('rgb(29, 32, 37)');

			await page.emulateMedia({colorScheme: 'light'});

			expect(await surface()).toBe('rgb(255, 255, 255)');
			await expect(page.getByRole('button', {name: 'System theme'}).first()).toBeVisible();
		});

		test('date input picks from its calendar with the keyboard and refuses impossible dates', async function ({ page }) {
			var date;
			var iso;

			await open(page, origin);

			date = field(page, 'Date');
			iso = field(page, 'ISO date, Monday first');

			await date.getByRole('button', {name: 'Choose a date'}).click();

			await expect(date.locator('.elemenx-calendar-day[data-cursor="true"]')).toBeFocused();
			await expect(date.locator('.elemenx-calendar-day[data-cursor="true"]')).toHaveText('22');

			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowDown');

			await expect(date.locator('.elemenx-calendar-day[data-cursor="true"]')).toBeFocused();

			await page.keyboard.press('Enter');

			await expect(date.locator('.elemenx-caption')).toHaveText('Value: 2024-11-30');
			await expect(date.locator('.elemenx-calendar')).toBeHidden();

			await date.getByRole('button', {name: 'Choose a date'}).click();

			await page.keyboard.press('PageDown');

			await expect(date.locator('.elemenx-calendar-title')).toContainText('2024');
			await expect(date.locator('.elemenx-calendar-day[data-cursor="true"]')).toHaveAttribute('data-date', '2024-12-30');

			await date.locator('.elemenx-calendar-title').click();
			await date.locator('.elemenx-calendar-cell[data-month="2024-03"]').click();
			await date.locator('.elemenx-calendar-day[data-date="2024-03-08"]').click();

			await expect(date.locator('.elemenx-caption')).toHaveText('Value: 2024-03-08');

			await iso.locator('input').pressSequentially('2024a0231');

			await expect(iso.locator('input')).toHaveValue('2024-02-31');
			await expect(iso.locator('input')).toHaveAttribute('aria-invalid', 'true');

			await iso.locator('input').press('Backspace');
			await iso.locator('input').press('Backspace');
			await iso.locator('input').pressSequentially('29');

			await expect(iso.locator('input')).toHaveValue('2024-02-29');
			await expect(iso.locator('input')).not.toHaveAttribute('aria-invalid', 'true');

			await iso.locator('input').fill('');
			await iso.locator('input').pressSequentially('20191231');

			await expect(iso.locator('input')).toHaveAttribute('aria-invalid', 'true');
		});

		test('time input keeps its digits in range and limits its picker', async function ({ page }) {
			var time;
			var bounded;

			await open(page, origin);

			time = field(page, 'Time');
			bounded = field(page, 'Time with seconds');

			await time.locator('input').fill('');
			await time.locator('input').pressSequentially('7');

			await expect(time.locator('input')).toHaveValue('07');

			await time.locator('input').pressSequentially('92');

			await expect(time.locator('input')).toHaveValue('07:09');

			await time.locator('input').fill('');
			await time.locator('input').pressSequentially('2915');

			await expect(time.locator('input')).toHaveValue('21:5');

			await time.locator('input').fill('');
			await time.locator('input').pressSequentially('2345');

			await expect(time.locator('.elemenx-caption')).toHaveText('Value: 23:45');

			await time.getByRole('button', {name: 'Choose a time'}).click();
			await time.locator('.elemenx-time-column[aria-label="Minutes"] button[data-unit="05"]').click();

			await expect(time.locator('.elemenx-caption')).toHaveText('Value: 23:05');
			await expect(time.locator('.elemenx-time-column[aria-label="Minutes"] button')).toHaveCount(12);

			await page.keyboard.press('Escape');

			await bounded.getByRole('button', {name: 'Choose a time'}).click();

			await expect(bounded.locator('.elemenx-time-column[aria-label="Hours"] button[data-unit="07"]')).toBeDisabled();
			await expect(bounded.locator('.elemenx-time-column[aria-label="Hours"] button[data-unit="21"]')).toBeDisabled();
			await expect(bounded.locator('.elemenx-time-column[aria-label="Hours"] button[data-unit="12"]')).toBeEnabled();

			await bounded.locator('.elemenx-time-column[aria-label="Hours"] button[data-unit="20"]').click();

			await expect(bounded.locator('input')).toHaveValue('20:00:00');
			await expect(bounded.locator('.elemenx-time-column[aria-label="Minutes"] button[data-unit="01"]')).toBeDisabled();
		});

		test('color input picks from swatches, sliders and text', async function ({ page }) {
			var color;
			var before;

			await open(page, origin);

			color = field(page, 'Color with opacity');

			await color.getByRole('button', {name: 'Pick a color'}).click();
			await color.locator('.elemenx-color-preset[data-color="#3d7a54"]').click();

			await expect(color.locator('input[type="text"]')).toHaveValue('#3d7a54ff');

			await color.getByRole('slider', {name: 'Opacity'}).focus();

			await page.keyboard.press('Shift+ArrowLeft');

			await expect(color.locator('input[type="text"]')).toHaveValue(/^#[0-9a-f]{6}e6$/);

			before = await color.locator('input[type="text"]').inputValue();

			await color.getByRole('slider', {name: 'Hue'}).click();

			expect(await color.locator('input[type="text"]').inputValue()).not.toBe(before);

			await page.keyboard.press('Escape');

			await expect(color.locator('.elemenx-color-popup')).toBeHidden();

			await color.locator('input[type="text"]').fill('');
			await color.locator('input[type="text"]').pressSequentially('zz12ab34');

			await expect(color.locator('input[type="text"]')).toHaveValue('#12ab34');
		});

		test('section folds its body and keeps its actions', async function ({ page }) {
			var outer;
			var heading;
			var below;

			await open(page, origin);

			outer = section(page, 'Section');

			await expect(outer.getByText('The body of a collapsible section.')).toBeVisible();
			await expect(outer.getByRole('button', {name: 'Edit'})).toBeVisible();

			await outer.getByRole('button', {name: 'Project settings'}).click();

			await expect(outer.getByText('The body of a collapsible section.')).toBeHidden();
			await expect(outer.getByRole('button', {name: 'Project settings'})).toHaveAttribute('aria-expanded', 'false');

			await outer.getByRole('button', {name: 'Project settings'}).click();

			await expect(outer.getByText('State: expanded')).toBeVisible();

			heading = outer.locator('.elemenx-section', {hasText: 'Project settings'}).locator('.elemenx-section-heading').first();

			expect(await heading.evaluate(function (node) {
				return Array.prototype.map.call(node.querySelectorAll('.elemenx-badge, .elemenx-section-toggle'), function (child) {
					return child.textContent.trim();
				});
			})).toEqual(['Before', 'Project settings', 'After']);

			below = outer.locator('.elemenx-section', {hasText: 'Caption under the line'});

			await expect(below.locator('.elemenx-section-note').last()).toContainText('puts the caption under the header line');
			expect((await below.locator('p.elemenx-section-note').boundingBox()).y).toBeGreaterThan((await below.getByRole('button', {name: 'Action'}).boundingBox()).y);
		});

		test('table sorts, selects and opens rows', async function ({ page }) {
			var table;
			var header;
			var striped;
			var stripe;
			var plain;
			var firstName = function () {
				return table.locator('tbody tr').first().locator('td').nth(1);
			};

			await open(page, origin);

			table = section(page, 'Table').locator('.elemenx-table').first();
			header = section(page, 'Table').locator('.elemenx-section-header');
			striped = section(page, 'Table').locator('.elemenx-table.striped');
			stripe = striped.locator('tbody tr').nth(1).locator('td').nth(1);

			await striped.scrollIntoViewIfNeeded();

			plain = await stripe.evaluate(function (node) {
				return getComputedStyle(node).backgroundColor;
			});

			await stripe.hover();

			expect(await stripe.evaluate(function (node) {
				return getComputedStyle(node).backgroundColor;
			})).not.toBe(plain);

			await table.getByRole('button', {name: 'Commits'}).click();

			await expect(firstName()).toHaveText('Linus Torvalds');
			await expect(table.locator('th[aria-sort="ascending"]')).toContainText('Commits');

			await table.getByRole('button', {name: 'Commits'}).click();

			await expect(firstName()).toHaveText('Grace Hopper');

			await table.locator('tbody tr', {hasText: 'Alan Turing'}).locator('label.elemenx-check').click();

			await expect(header).toContainText('Selected: 3, 2');

			await table.locator('tbody tr', {hasText: 'Ada Lovelace'}).click();

			await expect(header).toContainText('Selected: 1');

			await table.locator('tbody tr', {hasText: 'Ada Lovelace'}).dblclick();

			await expect(header).toContainText('Opened: Ada Lovelace');

			await table.locator('thead label.elemenx-check').click();

			await expect(header).toContainText('Selected: 1, 2, 3, 4, 5');
		});

		test('dialog, toast and popover open and close', async function ({ page }) {
			var overlays;
			var dialog;

			await open(page, origin);

			overlays = section(page, 'Overlays');
			dialog = page.getByRole('dialog', {name: 'Project settings'});

			await overlays.getByRole('button', {name: 'Open dialog'}).click();

			await expect(dialog).toBeVisible();

			await page.keyboard.press('Escape');

			await expect(dialog).toBeHidden();
			await expect(overlays.locator('.elemenx-section-header')).toContainText('Dialog: escape');
			await expect(overlays.getByRole('button', {name: 'Open dialog'})).toBeFocused();

			await overlays.getByRole('button', {name: 'Open dialog'}).click();
			await dialog.getByRole('button', {name: 'Save'}).click();

			await expect(dialog).toBeHidden();
			await expect(page.locator('.elemenx-toast', {hasText: 'Saved'})).toBeVisible();

			await overlays.getByRole('button', {name: 'Show toast'}).click();
			await page.locator('.elemenx-toast', {hasText: 'Build failed'}).getByRole('button', {name: 'Retry'}).click();

			await expect(page.locator('.elemenx-toast', {hasText: 'Build failed'})).toHaveCount(0);
			await expect(page.locator('.elemenx-toast', {hasText: 'Retrying'})).toBeVisible();
			await expect(page.locator('.elemenx-toast', {hasText: 'Retrying'}).locator('.elemenx-toast-timer')).toHaveCount(1);

			await overlays.getByRole('button', {name: 'Sticky toast'}).click();

			await expect(page.locator('.elemenx-toast', {hasText: 'Stays until closed'})).toBeVisible();
			await expect(page.locator('.elemenx-toast', {hasText: 'Stays until closed'}).locator('.elemenx-toast-timer')).toHaveCount(0);

			await overlays.getByRole('button', {name: 'Custom toast'}).click();

			await expect(page.locator('.elemenx-toast', {hasText: 'Uploading 3 files'}).locator('.ui-kit-toast-bar')).toBeVisible();
			await expect(page.locator('.elemenx-toast', {hasText: 'Uploading 3 files'})).toHaveClass(/ui-kit-upload-toast/);

			await page.locator('.elemenx-toast', {hasText: 'Uploading 3 files'}).getByRole('button', {name: 'Cancel'}).click();

			await expect(page.locator('.elemenx-toast', {hasText: 'Uploading 3 files'})).toHaveCount(0);
			await expect(page.locator('.elemenx-toast', {hasText: 'Retrying'})).toHaveCount(0, {timeout: 8000});
			await expect(page.locator('.elemenx-toast', {hasText: 'Stays until closed'})).toBeVisible();

			await page.locator('.elemenx-toast', {hasText: 'Stays until closed'}).getByRole('button', {name: 'Close'}).click();

			await expect(page.locator('.elemenx-toast', {hasText: 'Stays until closed'})).toHaveCount(0);

			await overlays.getByRole('button', {name: 'Click popover'}).click();

			await expect(page.getByPlaceholder('Inside a popover')).toBeVisible();

			await page.mouse.click(5, 5);

			await expect(page.getByPlaceholder('Inside a popover')).toBeHidden();
		});

		test('slider moves with the keyboard and keeps a range ordered', async function ({ page }) {
			var feedback;
			var header;

			await open(page, origin);

			feedback = section(page, 'Feedback');
			header = feedback.locator('.elemenx-section-header');

			await feedback.getByRole('slider', {name: 'Volume'}).focus();

			await page.keyboard.press('ArrowRight');

			await expect(header).toContainText('Volume: 41');

			await page.keyboard.press('End');

			await expect(header).toContainText('Volume: 100');

			await feedback.getByRole('slider', {name: 'Budget (from)'}).focus();

			await page.keyboard.press('End');

			await expect(header).toContainText('Budget: 800–800');
		});

		test('drag and drop moves items and resizable elements grow', async function ({ page }) {
			var files;
			var task;
			var done;
			var from;
			var to;
			var notes;
			var handle;
			var before;
			var box;
			var todo;

			await open(page, origin);

			files = section(page, 'Files and drag and drop');
			task = files.locator('.ui-kit-task', {hasText: 'Design tokens'});
			done = files.locator('.ui-kit-board', {hasText: 'Done'});

			await task.scrollIntoViewIfNeeded();

			from = await task.boundingBox();
			to = await done.boundingBox();

			await page.mouse.move(from.x + 20, from.y + from.height / 2);
			await page.mouse.down();
			await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {steps: 8});

			await expect(done).toHaveClass(/drop-over/);
			expect(await page.evaluate(function () {
				return String(window.getSelection());
			})).toBe('');

			box = await page.locator('.elemenx-drag-ghost').boundingBox();

			expect(Math.round(box.x)).toBe(Math.round(to.x + to.width / 2 - 20));
			expect(Math.round(box.height)).toBe(Math.round(from.height));

			await page.mouse.up();

			await expect(done.locator('.ui-kit-task', {hasText: 'Design tokens'})).toBeVisible();
			await expect(files.locator('.elemenx-section-header')).toContainText('Dropped: Design tokens → Done');

			todo = files.locator('.ui-kit-board', {hasText: 'To do'});
			from = await todo.locator('.ui-kit-task').last().boundingBox();
			to = await todo.locator('.ui-kit-task').first().boundingBox();

			await page.mouse.move(from.x + 20, from.y + from.height / 2);
			await page.mouse.down();
			await page.mouse.move(to.x + 40, to.y + 4, {steps: 8});

			await expect(page.locator('.elemenx-drop-marker')).toBeVisible();

			await page.mouse.up();

			await expect(todo.locator('.ui-kit-task')).toHaveText(['Chat layout', 'Table component']);
			await expect(files.locator('.elemenx-section-header')).toContainText('Dropped: Chat layout → Todo #1');
			await expect(page.locator('.elemenx-drop-marker')).toHaveCount(0);

			notes = field(page, 'Notes \\(resizable\\)').locator('.elemenx-textarea');
			handle = notes.locator('.elemenx-resize-handle.bottom');

			await notes.scrollIntoViewIfNeeded();

			before = (await notes.boundingBox()).height;
			box = await handle.boundingBox();

			await page.mouse.move(box.x + 40, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(box.x + 40, box.y + box.height / 2 + 48, {steps: 4});
			await page.mouse.up();

			expect((await notes.boundingBox()).height).toBeGreaterThan(before + 40);

			await handle.focus();

			await page.keyboard.press('ArrowUp');

			expect((await notes.boundingBox()).height).toBeLessThan(before + 48);
		});

		test('phone guide keeps the template and lists every country', async function ({ page }) {
			var skip;
			var input;
			var phone;
			var codes;

			await open(page, origin);

			skip = field(page, 'Phone, skip separators');
			input = skip.locator('input[type="tel"]');

			await input.click();

			await expect(input).toHaveValue('+1 (___) ___-____');

			await input.pressSequentially('5551234');

			await expect(input).toHaveValue('+1 (555) 123-4___');

			await input.evaluate(function (node) {
				node.setSelectionRange(9, 9);
			});
			await input.press('Backspace');

			await expect(input).toHaveValue('+1 (555) 123-4___');
			expect(await input.evaluate(function (node) {
				return node.selectionStart;
			})).toBe(8);

			await input.fill('');
			await input.blur();

			await expect(input).toHaveValue('');

			phone = field(page, 'Phone');

			await phone.locator('.elemenx-phone-country').click();

			expect(await phone.locator('.elemenx-popup .elemenx-option').count()).toBeGreaterThan(200);

			await page.keyboard.type('Japan');
			await page.keyboard.press('Enter');

			await expect(phone.locator('.elemenx-phone-country')).toContainText('JP');
			await expect(phone.locator('input[type="tel"]')).toHaveValue(/^\+81 /);

			await phone.locator('.elemenx-phone-country').click();

			codes = await phone.locator('.elemenx-popup .elemenx-option .elemenx-phone-code').allTextContents();

			expect(codes.length).toBeGreaterThan(200);
			expect(codes.slice().sort()).toEqual(codes);

			await page.keyboard.type('Moldova');
			await page.keyboard.press('Enter');

			await phone.locator('input[type="tel"]').fill('');
			await phone.locator('input[type="tel"]').pressSequentially('69123456');

			await expect(phone.locator('input[type="tel"]')).toHaveValue('+373 69 12 34 56');
		});

		test('money input formats the amount of its currency and file icons follow the format', async function ({ page }) {
			var money;
			var icons;

			await open(page, origin);

			money = field(page, 'Money');
			icons = section(page, 'Icons');

			await money.locator('.elemenx-money-input input').fill('1234.567');
			await money.locator('.elemenx-money-input input').blur();

			await expect(money.locator('.elemenx-money-input input')).toHaveValue(/1.?234[.,]56/);
			await expect(money.locator('.elemenx-caption')).toHaveText('USD 1234.56');

			await money.locator('.elemenx-select-trigger').click();

			await page.keyboard.type('JPY');
			await page.keyboard.press('Enter');

			await expect(money.locator('.elemenx-caption')).toHaveText('JPY 1235');

			await expect(icons.locator('.ui-kit-icon[title="pack.tar.gz"] svg')).toHaveAttribute('data-icon', 'file-tar-gz');
			await expect(icons.locator('.ui-kit-icon[title="Dockerfile"] svg')).toHaveAttribute('data-icon', 'file-dockerfile');
			await expect(icons.locator('.ui-kit-icon[title="unknown.xyz"] svg')).toHaveAttribute('data-icon', 'file');
			await expect(icons.locator('.ui-kit-icon[title="file.rb"] svg')).toHaveAttribute('data-icon', 'file-rb');
			await expect(icons.locator('.ui-kit-icon[title="CMakeLists.txt"] svg')).toHaveAttribute('data-icon', 'file-cmake');
			await expect(icons.locator('.ui-kit-icon[title="sketch.ino"] svg')).toHaveAttribute('data-icon', 'file-ino');
			await expect(icons.locator('.ui-kit-icon[title="sketch.ino"] svg text')).toHaveText('INO');
			expect(await icons.locator('.ui-kit-icon svg[data-icon^="file-"]').count()).toBeGreaterThan(170);
		});

		test('workspace shows the tool windows the page puts in it and resizes them', async function ({ page }) {
			var workspace;
			var left;
			var handle;
			var box;

			await open(page, origin);

			workspace = page.locator('.elemenx-workspace');
			left = workspace.locator('.elemenx-workspace-panel.left');
			handle = left.locator(':scope > .elemenx-resize-handle.right');

			await expect(left).toBeVisible();
			expect((await left.boundingBox()).width).toBe(280);

			await handle.focus();

			await page.keyboard.press('ArrowRight');

			expect((await left.boundingBox()).width).toBe(288);

			box = await handle.boundingBox();

			await page.mouse.move(box.x + 2, box.y + 100);
			await page.mouse.down();
			await page.mouse.move(box.x + 42, box.y + 100, {steps: 4});
			await page.mouse.up();

			expect((await left.boundingBox()).width).toBe(328);

			await workspace.getByRole('button', {name: 'Project'}).click();

			await expect(left).toBeHidden();

			await workspace.getByRole('button', {name: 'Database'}).click();

			await expect(workspace.locator('.elemenx-workspace-panel.right')).toBeVisible();

			for (const command of ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']) {
				await workspace.locator('.elemenx-terminal-input').fill(command);
				await workspace.locator('.elemenx-terminal-input').press('Enter');
			}

			await expect(workspace.locator('.elemenx-terminal-line').last()).toHaveText('eight: command not found');
			expect((await workspace.locator('.elemenx-terminal').boundingBox()).height).toBeLessThanOrEqual((await workspace.locator('.elemenx-workspace-panel.bottom').boundingBox()).height);
			await expect(section(page, 'Terminal').locator('.elemenx-terminal-line')).toHaveText(['Elemenx terminal. Type help.']);

			await workspace.locator('.elemenx-terminal').getByRole('button', {name: 'Hide'}).click();

			await expect(workspace.locator('.elemenx-workspace-panel.bottom')).toBeHidden();
		});

		test('tables fit their container without a horizontal scroll', async function ({ page }) {
			var wrap;

			await open(page, origin);

			wrap = page.locator('.elemenx-table-wrap').first();

			expect(await wrap.evaluate(function (node) {
				return node.scrollWidth - node.clientWidth;
			})).toBe(0);
		});

		test('chat shows the avatar on the newest message of a run from one author', async function ({ page }) {
			var messages;

			await open(page, origin);

			messages = section(page, 'Chat').locator('.elemenx-chat-message:not(.own)');

			await expect(messages).toHaveCount(3);
			await expect(messages.nth(0)).toHaveClass(/first/);
			await expect(messages.nth(2)).toHaveClass(/last/);
			await expect(messages.nth(0).locator('.elemenx-chat-author')).toHaveText('Grace Hopper');
			await expect(messages.nth(0).locator('.elemenx-chat-avatar')).toHaveText('');
			await expect(messages.nth(1).locator('.elemenx-chat-avatar')).toHaveText('');
			await expect(messages.nth(2).locator('.elemenx-chat-avatar')).toHaveText('GH');
			await expect(messages.nth(2).locator('.elemenx-chat-author')).toHaveCount(0);
		});

		test('steps show several active steps and timeline lists the activity', async function ({ page }) {
			var block;
			var steps;

			await open(page, origin);

			block = section(page, 'Steps and timeline');
			steps = block.locator('.elemenx-steps').first().locator('.elemenx-step');

			await expect(steps).toHaveClass([/done/, /active/, /active/, /pending/]);
			await expect(block.locator('.elemenx-steps.vertical')).toHaveCount(1);

			await steps.nth(3).locator('.elemenx-step-node').click();

			await expect(steps).toHaveClass([/done/, /done/, /done/, /active/]);
			await expect(steps.nth(3)).toHaveAttribute('aria-current', 'step');

			await expect(block.locator('.elemenx-timeline-item')).toHaveCount(8);
			await expect(block.locator('.elemenx-timeline-item').nth(4)).toContainText('The table should keep its header while scrolling.');
			await expect(block.locator('.elemenx-timeline-item.small')).toHaveCount(3);
			await expect(block.locator('.elemenx-timeline-item.dot')).toHaveCount(2);
			await expect(block.locator('.elemenx-timeline-item.dot .elemenx-icon')).toHaveCount(0);
			expect((await block.locator('.elemenx-timeline-item.dot .elemenx-timeline-node').first().boundingBox()).width).toBe(8);
		});

		test('terminal runs commands and recalls its history', async function ({ page }) {
			var terminal;
			var input;

			await open(page, origin);

			terminal = section(page, 'Terminal').locator('.elemenx-terminal');
			input = terminal.locator('.elemenx-terminal-input');

			await input.fill('help');
			await input.press('Enter');

			await expect(terminal.locator('.elemenx-terminal-line')).toContainText(['Elemenx terminal. Type help.', 'help', /date\s+print the date/]);

			await input.fill('make coffee');
			await input.press('Enter');

			await expect(terminal.locator('.elemenx-terminal-line').last()).toHaveText('make: command not found');

			await input.press('ArrowUp');

			await expect(input).toHaveValue('make coffee');

			await input.press('ArrowUp');

			await expect(input).toHaveValue('help');

			await input.press('ArrowDown');
			await input.press('ArrowDown');

			await expect(input).toHaveValue('');

			await terminal.getByRole('button', {name: 'Clear'}).click();

			await expect(terminal.locator('.elemenx-terminal-line')).toHaveCount(0);
		});

		test('tile grid places tiles in cells, keeps locked ones, starts groups and runs group actions', async function ({ page }) {
			var grid;
			var state;
			var drag;
			var from;
			var to;

			await open(page, origin);

			grid = section(page, 'Tiles').locator('.elemenx-tile-grid').first();
			state = function () {
				return grid.locator('.elemenx-tile-group').evaluateAll(function (groups) {
					return groups.map(function (group) {
						return group.querySelector('.elemenx-tile-group-title').textContent + ':' + Array.prototype.map.call(group.querySelectorAll('.elemenx-tile'), function (tile) {
							return tile.getAttribute('data-id') + '@' + tile.style.gridArea.split(' / ').slice(0, 2).join(',');
						}).join(' ');
					});
				});
			};
			drag = async function (id, x, y) {
				var box = await grid.locator('.elemenx-tile[data-id="' + id + '"]').boundingBox();

				await page.mouse.move(box.x + 8, box.y + 8);
				await page.mouse.down();
				await page.mouse.move(x + 8, y + 8, {steps: 10});
			};

			await grid.scrollIntoViewIfNeeded();
			await grid.locator('.elemenx-tile[data-id="calendar"]').click();

			await expect(section(page, 'Tiles').locator('.elemenx-section-header')).toContainText('Opened: Calendar');
			await expect(grid.locator('.elemenx-tile[data-id="clock"] .elemenx-tile-content strong')).toHaveText(/\d/);

			expect(await state()).toEqual([
				'Work:mail@1,1 calendar@3,1 tasks@3,3 chat@5,1 phone@5,2',
				'Tools:terminal@1,1 settings@1,3 database@1,4 cloud@3,1',
				'Pinned:clock@1,1'
			]);

			/* Under the tile at the right edge of the group: the cell stays where the ghost is, a hole is left. */
			from = await grid.locator('.elemenx-tile[data-id="phone"]').boundingBox();

			await drag('phone', from.x + 112, from.y);

			await expect(grid.locator('.elemenx-tile[data-id="phone"]')).toHaveClass(/dragging/);

			await page.mouse.up();

			expect((await state())[0]).toBe('Work:mail@1,1 calendar@3,1 tasks@3,3 chat@5,1 phone@5,4');

			/* Into another group under its right edge tile: the tiles in the way move down; Escape restores. */
			to = await grid.locator('.elemenx-tile[data-id="database"]').boundingBox();

			await drag('calendar', to.x - 56, to.y + 56);

			expect((await state())[1]).toBe('Tools:terminal@1,1 settings@1,3 database@1,4 calendar@2,3 cloud@4,1');

			await page.keyboard.press('Escape');
			await page.mouse.up();

			expect((await state())[1]).toBe('Tools:terminal@1,1 settings@1,3 database@1,4 cloud@3,1');

			await drag('calendar', to.x - 56, to.y + 56);

			await page.mouse.up();

			expect(await state()).toEqual([
				'Work:mail@1,1 tasks@3,3 chat@5,1 phone@5,4',
				'Tools:terminal@1,1 settings@1,3 database@1,4 calendar@2,3 cloud@4,1',
				'Pinned:clock@1,1'
			]);

			/* A locked tile does not move, and a locked group takes no tiles. */
			await expect(grid.locator('.elemenx-tile[data-id="settings"]')).toHaveCSS('cursor', 'pointer');

			to = await grid.locator('.elemenx-tile[data-id="cloud"]').boundingBox();

			await drag('settings', to.x, to.y);

			await page.mouse.up();

			to = await grid.locator('.elemenx-tile[data-id="clock"]').boundingBox();

			await drag('chat', to.x, to.y + 56);

			await page.mouse.up();

			expect((await state())[1]).toBe('Tools:terminal@1,1 settings@1,3 database@1,4 calendar@2,3 cloud@4,1');
			expect((await state())[2]).toBe('Pinned:clock@1,1');

			/* GroupPolicy between: a new group between two groups. */
			await drag('chat', from.x, from.y);

			to = await grid.locator('.elemenx-tile-gap').nth(1).boundingBox();

			await page.mouse.move(to.x + to.width / 2, to.y + 40, {steps: 10});
			await page.mouse.up();

			expect(await state()).toEqual([
				'Work:mail@1,1 tasks@3,3 phone@5,4',
				'New group:chat@1,1',
				'Tools:terminal@1,1 settings@1,3 database@1,4 calendar@2,3 cloud@4,1',
				'Pinned:clock@1,1'
			]);

			await grid.locator('.elemenx-tile-group', {hasText: 'Tools'}).getByRole('button', {name: 'Rename'}).click();

			await expect(section(page, 'Tiles').locator('.elemenx-section-header')).toContainText('Opened: Rename Tools');
			await expect(page.locator('.elemenx-drag-ghost')).toHaveCount(0);
		});

		test('tile grid takes groups and tiles declared in the template and follows the template', async function ({ page }) {
			var grid;
			var tiles;
			var from;

			await open(page, origin);

			grid = section(page, 'Tiles').locator('.elemenx-tile-grid').nth(1);
			tiles = function () {
				return grid.locator('.elemenx-tile').evaluateAll(function (nodes) {
					return nodes.map(function (node) {
						return node.getAttribute('data-id') + '@' + node.style.gridArea.split(' / ').slice(0, 2).join(',');
					});
				});
			};

			await grid.scrollIntoViewIfNeeded();

			await expect(grid.locator('.elemenx-tile-group-title')).toHaveText(['Media']);
			expect(await tiles()).toEqual(['music@1,1', 'photos@3,1', 'player@1,3']);
			await expect(grid.locator('.elemenx-tile[data-id="photos"]')).toContainText('128 new');
			await expect(grid.locator('.elemenx-tile[data-id="player"]')).toHaveClass(/custom/);
			await expect(grid.locator('.elemenx-tile[data-id="player"]')).toHaveClass(/ui-kit-player-tile/);
			await expect(grid.locator('.elemenx-tile[data-id="music"] .elemenx-tile-badge')).toHaveCount(0);

			/* The markup inside a declared tile keeps its bindings, and its controls do not open the tile. */
			await grid.getByRole('button', {name: 'Play', exact: true}).click();
			await grid.getByRole('button', {name: 'Play', exact: true}).click();

			await expect(grid.locator('.elemenx-tile[data-id="player"]')).toContainText('2 plays');
			await expect(grid.locator('.elemenx-tile[data-id="music"] .elemenx-tile-badge')).toHaveText('2');
			await expect(section(page, 'Tiles').locator('.elemenx-section-header')).not.toContainText('Opened: Player');

			/* A tile moved by the user keeps its place when the template changes. */
			from = await grid.locator('.elemenx-tile[data-id="music"]').boundingBox();

			await page.mouse.move(from.x + 8, from.y + 8);
			await page.mouse.down();
			await page.mouse.move(from.x + 8, from.y + 8 + 112 + 112, {steps: 10});
			await page.mouse.up();

			expect(await tiles()).toEqual(['player@1,3', 'photos@3,1', 'music@5,1']);

			await section(page, 'Tiles').getByText('News tile').click();

			expect(await tiles()).toEqual(['player@1,3', 'photos@3,1', 'music@5,1', 'news@1,1']);
			await expect(grid.locator('.elemenx-tile[data-id="news"]')).toHaveAttribute('aria-label', 'News');

			await grid.getByRole('button', {name: 'Play', exact: true}).click();

			await expect(grid.locator('.elemenx-tile[data-id="music"] .elemenx-tile-badge')).toHaveText('3');
			expect(await tiles()).toEqual(['player@1,3', 'photos@3,1', 'music@5,1', 'news@1,1']);

			await section(page, 'Tiles').getByText('News tile').click();

			expect(await tiles()).toEqual(['player@1,3', 'photos@3,1', 'music@5,1']);
		});

		test('tile groups stretch by whole columns, and a press on a control inside a tile does not press the tile', async function ({ page }) {
			var grid;
			var tools;
			var handle;
			var width;
			var box;
			var play;

			await open(page, origin);

			grid = section(page, 'Tiles').locator('.elemenx-tile-grid').first();
			tools = grid.locator('.elemenx-tile-group[data-group="tools"]');
			handle = tools.locator('.elemenx-tile-group-resize');
			width = async function () {
				return Math.round((await tools.locator('.elemenx-tile-cells').boundingBox()).width);
			};

			await grid.scrollIntoViewIfNeeded();

			expect(await width()).toBe(216);
			await expect(grid.locator('.elemenx-tile-group[data-group="pinned"] .elemenx-tile-group-resize')).toHaveCount(0);

			box = await handle.boundingBox();

			await page.mouse.move(box.x + 4, box.y + 20);
			await page.mouse.down();
			await page.mouse.move(box.x + 4 + 112, box.y + 20, {steps: 8});
			await page.mouse.up();

			expect(await width()).toBe(328);
			await expect(handle).toHaveAttribute('aria-valuenow', '6');

			await handle.focus();

			await page.keyboard.press('ArrowLeft');

			expect(await width()).toBe(272);

			/* Not narrower than the widest tile (Deployments, four columns). */
			await page.keyboard.press('ArrowLeft');
			await page.keyboard.press('ArrowLeft');

			await expect(handle).toHaveAttribute('aria-valuenow', '4');
			expect(await width()).toBe(216);

			play = section(page, 'Tiles').locator('.elemenx-tile-grid').nth(1).getByRole('button', {name: 'Play', exact: true});

			await play.scrollIntoViewIfNeeded();

			box = await play.boundingBox();

			await page.mouse.move(box.x + 5, box.y + 5);
			await page.mouse.down();

			expect(await grid.page().locator('.elemenx-tile[data-id="player"]').evaluate(function (node) {
				return getComputedStyle(node).transform;
			})).toBe('none');

			await page.mouse.up();
		});

		test('a tile dragged past the right edge of its group widens the group after a pause, and the drop keeps only the width it needs', async function ({ page }) {
			var grid;
			var work;
			var columns;
			var box;

			await open(page, origin);

			grid = section(page, 'Tiles').locator('.elemenx-tile-grid').first();
			work = grid.locator('.elemenx-tile-group[data-group="work"]');
			columns = function () {
				return work.locator('.elemenx-tile-cells').evaluate(function (node) {
					return getComputedStyle(node).gridTemplateColumns.split(' ').length;
				});
			};

			await grid.scrollIntoViewIfNeeded();

			box = await grid.locator('.elemenx-tile[data-id="tasks"]').boundingBox();

			await page.mouse.move(box.x + 10, box.y + 10);
			await page.mouse.down();
			await page.mouse.move(box.x + 70, box.y + 10, {steps: 6});

			await expect(work).toHaveClass(/growing/);

			await expect.poll(columns).toBe(5);
			await expect(grid.locator('.elemenx-tile[data-id="tasks"]')).toHaveAttribute('style', /grid-area: 3 \/ 4 \//);

			await page.mouse.up();

			expect(await columns()).toBe(5);

			/* Taken back inside before the drop, the group keeps the width it had before this drag, no more. */
			box = await grid.locator('.elemenx-tile[data-id="tasks"]').boundingBox();

			await page.mouse.move(box.x + 10, box.y + 10);
			await page.mouse.down();
			await page.mouse.move(box.x + 70, box.y + 10, {steps: 6});

			await expect.poll(columns).toBe(6);

			await page.mouse.move(box.x - 106, box.y + 10, {steps: 6});
			await page.mouse.up();

			expect(await columns()).toBe(5);
		});

		test('one-time code takes its pattern from typing and paste, fills cells, masks and completes', async function ({ page }) {
			var otp;
			var input;
			var cells;
			var tap;
			var pin;
			var recovery;

			await open(page, origin);

			otp = field(page, 'One-time code');
			input = otp.locator('input');
			cells = function () {
				return otp.locator('.elemenx-otp-cell').allTextContents();
			};
			tap = async function (locator) {
				var box = await locator.boundingBox();

				await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
			};

			await otp.scrollIntoViewIfNeeded();

			await expect(otp.locator('.elemenx-otp-cell')).toHaveCount(6);
			await expect(otp.locator('.elemenx-otp-separator')).toHaveCount(1);
			await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
			await expect(input).toHaveAttribute('inputmode', 'numeric');

			await tap(otp.locator('.elemenx-otp-cell').nth(0));

			await page.keyboard.type('12a3');

			await expect(input).toHaveValue('123');
			expect(await cells()).toEqual(['1', '2', '3', '', '', '']);
			await expect(otp.locator('.elemenx-otp-cell').nth(3)).toHaveClass(/active/);
			await expect(otp.locator('.elemenx-caption')).toHaveText('3 of 6');

			await input.evaluate(function (node) {
				var data = new DataTransfer();

				data.setData('text/plain', ' 987-654 ');

				node.setSelectionRange(0, node.value.length);
				node.dispatchEvent(new ClipboardEvent('paste', {clipboardData: data, bubbles: true, cancelable: true}));
			});

			await expect(input).toHaveValue('987654');
			await expect(otp.locator('.elemenx-caption')).toHaveText('Complete: 987654');

			await tap(otp.locator('.elemenx-otp-cell').nth(2));

			await page.keyboard.type('0');

			await expect(input).toHaveValue('980654');

			await page.keyboard.press('Backspace');

			await expect(input).toHaveValue('98654');

			await page.locator('body').click({position: {x: 5, y: 5}});

			await expect(otp.locator('.elemenx-otp')).toHaveClass(/invalid/);

			pin = field(page, 'PIN');

			await pin.scrollIntoViewIfNeeded();

			await tap(pin.locator('.elemenx-otp-cell').first());

			await page.keyboard.type('43210');

			await expect(pin.locator('input')).toHaveValue('4321');
			expect(await pin.locator('.elemenx-otp-cell').allTextContents()).toEqual(['•', '•', '•', '•']);
			expect(await pin.locator('input').evaluate(function (node) {
				var event = new ClipboardEvent('copy', {bubbles: true, cancelable: true});

				node.dispatchEvent(event);

				return event.defaultPrevented;
			})).toBe(true);

			await pin.getByRole('button', {name: 'Show code'}).click();

			expect(await pin.locator('.elemenx-otp-cell').allTextContents()).toEqual(['4', '3', '2', '1']);

			recovery = field(page, 'Recovery code');

			await recovery.locator('input').click();

			await page.keyboard.type('ab-cd ef12345');

			await expect(recovery.locator('input')).toHaveValue('ABCDEF12');
			await expect(recovery.locator('.elemenx-otp-cell')).toHaveCount(0);

			await field(page, 'Hex code').locator('input').click();

			await page.keyboard.type('fgz09a');

			await expect(field(page, 'Hex code').locator('input')).toHaveValue('F09A');
			await expect(field(page, 'Hex code').locator('input')).toHaveAttribute('type', 'password');
		});

		test('steps take custom content and a disabled step is not clickable', async function ({ page }) {
			var custom;

			await open(page, origin);

			custom = section(page, 'Steps and timeline').locator('.elemenx-steps').nth(2);

			await expect(custom.locator('.elemenx-step.custom .elemenx-step-content .ui-kit-toast-bar')).toHaveCount(1);
			await expect(custom.locator('.elemenx-step').nth(0)).toHaveClass(/ui-kit-upload-step/);
			await expect(custom.locator('.elemenx-step').nth(1)).toHaveClass(/disabled/);

			await custom.locator('.elemenx-step-node').nth(1).click({force: true});

			await expect(custom.locator('.elemenx-step').nth(0)).toHaveClass(/active/);

			await custom.locator('.elemenx-step-node').nth(2).click();

			await expect(custom.locator('.elemenx-step').nth(2)).toHaveClass(/active/);
			await expect(custom.locator('.elemenx-step').nth(0)).toHaveClass(/pending/);
		});

		test('layouts: dashboard, settings, master-detail and centered pages', async function ({ page }) {
			var layouts;
			var nav;
			var settings;
			var master;

			await open(page, origin);

			layouts = section(page, 'Layouts');
			nav = layouts.locator('.elemenx-dashboard .elemenx-nav');

			await expect(layouts.locator('.elemenx-dashboard-widget')).toHaveCount(5);

			await nav.locator('.elemenx-nav-row', {hasText: 'Builds'}).click();

			await expect(nav.locator('.elemenx-nav-row.active')).toHaveText('Builds');

			await layouts.getByRole('button', {name: 'Collapse the navigation'}).click();

			await expect(nav).toHaveClass(/collapsed/);
			expect((await layouts.locator('.elemenx-dashboard-nav').boundingBox()).width).toBe(64);

			settings = layouts.locator('.elemenx-settings');

			await expect(settings.locator('.elemenx-settings-title')).toHaveText('General');

			await settings.locator('.elemenx-nav-row', {hasText: 'Version Control'}).click();
			await settings.locator('.elemenx-nav-row', {hasText: 'Git'}).click();

			await expect(settings.locator('.elemenx-settings-path')).toHaveText('Version Control');
			await expect(settings.locator('.elemenx-settings-title')).toHaveText('Git');

			await settings.locator('.elemenx-nav-search input').fill('scheme');

			await expect(settings.locator('.elemenx-nav-row')).toHaveText(['Editor', 'Color Scheme']);

			master = layouts.locator('.elemenx-master-detail');

			await expect(master).toContainText('Select a person');

			await master.locator('.elemenx-master-row', {hasText: 'Grace Hopper'}).click();

			await expect(master).toContainText('Commits: 2048');
			await expect(master.locator('.elemenx-master-row.active')).toContainText('Grace Hopper');

			await expect(layouts.locator('.elemenx-centered')).toHaveCount(3);
			await expect(layouts.locator('.elemenx-centered', {hasText: 'Page not found'}).locator('.elemenx-centered-code')).toHaveText('404');
		});
	});
}