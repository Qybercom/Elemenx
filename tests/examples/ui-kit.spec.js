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

			await expect(page.locator('.ui-kit > .elemenx-section')).toHaveCount(9);

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
			await expect(page.locator('.elemenx-section-header', {hasText: 'File upload'})).toContainText('Selected: 2');
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

			await workspace.locator('.elemenx-tool-window', {hasText: 'Terminal'}).getByRole('button', {name: 'Hide'}).click();

			await expect(workspace.locator('.elemenx-workspace-panel.bottom')).toBeHidden();
		});
	});
}