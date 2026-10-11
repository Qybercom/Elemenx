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

	await expect(page.locator('.elemenx-workspace')).toBeVisible();
}

for (const origin of origins) {
	test.describe('ElemenxUI catalogue (' + origin.Name + ')', function () {
		test('renders every section with icons and library styles and no errors', async function ({ page }) {
			var errors = captureErrors(page);
			var sprite;

			await open(page, origin);

			await expect(page.locator('.ui-kit > .elemenx-section')).toHaveCount(18);

			sprite = await page.locator('.ui-kit-icon svg use').first().getAttribute('href');

			expect(sprite).toMatch(/icons\.svg#add$/);
			expect((await page.request.get(origin.URL + sprite.split('#')[0])).status()).toBe(200);

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

			await open(page, origin);

			outer = section(page, 'Section');

			await expect(outer.getByText('The body of a collapsible section.')).toBeVisible();
			await expect(outer.getByRole('button', {name: 'Edit'})).toBeVisible();

			await outer.getByRole('button', {name: 'Project settings'}).click();

			await expect(outer.getByText('The body of a collapsible section.')).toBeHidden();
			await expect(outer.getByRole('button', {name: 'Project settings'})).toHaveAttribute('aria-expanded', 'false');

			await outer.getByRole('button', {name: 'Project settings'}).click();

			await expect(outer.getByText('State: expanded')).toBeVisible();
		});

		test('table sorts, selects and opens rows', async function ({ page }) {
			var table;
			var header;
			var firstName = function () {
				return table.locator('tbody tr').first().locator('td').nth(1);
			};

			await open(page, origin);

			table = section(page, 'Table').locator('.elemenx-table').first();
			header = section(page, 'Table').locator('.elemenx-section-header');

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

			await page.mouse.up();

			await expect(done.locator('.ui-kit-task', {hasText: 'Design tokens'})).toBeVisible();
			await expect(files.locator('.elemenx-section-header')).toContainText('Dropped: Design tokens → Done');

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

			await expect(icons.locator('.ui-kit-icon[title="pack.tar.gz"] use')).toHaveAttribute('href', /#file-tar-gz$/);
			await expect(icons.locator('.ui-kit-icon[title="Dockerfile"] use')).toHaveAttribute('href', /#file-dockerfile$/);
			await expect(icons.locator('.ui-kit-icon[title="unknown.xyz"] use')).toHaveAttribute('href', /#file$/);
		});

		test('workspace toggles tool windows and resizes them with the keyboard and the pointer', async function ({ page }) {
			var workspace;
			var left;
			var splitter;
			var box;

			await open(page, origin);

			workspace = page.locator('.elemenx-workspace');
			left = workspace.locator('.elemenx-workspace-panel.left');
			splitter = workspace.locator('.elemenx-workspace-splitter[data-panel="left"]');

			await expect(left).toBeVisible();
			expect((await left.boundingBox()).width).toBe(240);

			await splitter.focus();

			await page.keyboard.press('ArrowRight');

			expect((await left.boundingBox()).width).toBe(256);

			box = await splitter.boundingBox();

			await page.mouse.move(box.x + 1, box.y + 100);
			await page.mouse.down();
			await page.mouse.move(box.x + 41, box.y + 100, {steps: 4});
			await page.mouse.up();

			expect((await left.boundingBox()).width).toBe(296);

			await workspace.getByRole('button', {name: 'Project'}).click();

			await expect(left).toBeHidden();
			await expect(splitter).toBeHidden();

			await workspace.getByRole('button', {name: 'Database'}).click();

			await expect(workspace.locator('.elemenx-workspace-panel.right')).toBeVisible();

			await workspace.locator('.elemenx-workspace-tool-window', {hasText: 'Terminal'}).getByRole('button', {name: 'Hide'}).click();

			await expect(workspace.locator('.elemenx-workspace-panel.bottom')).toBeHidden();
		});
	});
}