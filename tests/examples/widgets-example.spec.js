import { test, expect } from '../coverage/playwright.js';
import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Server from '../../tools/server.js';

var source = path.resolve(process.cwd(), 'examples', 'Widgets');
var cli = path.resolve(process.cwd(), 'elemenx-cli.js');

/* The example of widgets on a page of another site, built by the CLI with its elemenx.config.js (Widget: true). */
test.describe('Example: Widgets, a shop of another site with the widgets of one Application', function () {
	test.describe.configure({mode: 'serial'});

	var folder;
	var server;
	var origin;

	test.beforeAll(async function () {
		folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-widgets-example-'));

		fs.cpSync(source, folder, {recursive: true, filter: function (file) {
			return path.basename(file) !== 'dist' && path.basename(file) !== 'node_modules';
		}});

		childProcess.execFileSync(process.execPath, [cli, 'build', folder], {stdio: 'ignore'});

		server = Server.Create({Root: path.join(folder, 'dist')});

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		origin = 'http://127.0.0.1:' + server.Server.address().port;
	});

	test.afterAll(async function () {
		await new Promise(function (resolve) {
			server.Close(resolve);
		});

		fs.rmSync(folder, {recursive: true, force: true});
	});

	test('mounts its widgets in their places, apart from the styles of the page, one cart for all, and the places that come later', async function ({ page }) {
		var errors = [];
		var cart;
		var lamp;

		page.on('pageerror', function (error) {
			errors.push(error.message);
		});

		await page.goto(origin + '/');

		cart = page.locator('.shop-cart-place');
		lamp = page.locator('.shop-product').first();

		/* The page gets no Elemenx, only the widgets it can reach. */
		expect(await page.evaluate(function () {
			return [typeof window.Elemenx, typeof window.ShopWidgets, window.ShopWidgets.Names().sort().join(',')];
		})).toEqual(['undefined', 'object', 'AddToCart,Cart,Reviews']);

		/* Every place, in a shadow root of its own. */
		await expect(cart.locator('.shop-cart-count')).toHaveText('0');
		await expect(page.locator('[data-elemenx-widget-mounted]')).toHaveCount(4);
		await expect(lamp.locator('.shop-reviews-count')).toHaveText('2 reviews');

		expect(await page.evaluate(function () {
			return Array.prototype.every.call(document.querySelectorAll('[data-elemenx-widget]'), function (element) {
				return !!element.shadowRoot;
			});
		})).toBe(true);

		/* The red, uppercase buttons of the page do not reach the buttons of the widgets. */
		expect(await lamp.getByRole('button', {name: 'Add to cart'}).evaluate(function (button) {
			return getComputedStyle(button).textTransform;
		})).not.toBe('uppercase');

		/* One Application: the cart in the header hears the button of the product. */
		await lamp.getByRole('button', {name: 'Add to cart'}).click();

		await expect(cart.locator('.shop-cart-count')).toHaveText('1');
		await expect(lamp.locator('.shop-add-taken')).toHaveText('In the cart: 1');
		await expect(page.locator('.shop-log')).toContainText('added: Brass lamp');

		/* A product of the page added later gets its widget; removed, it goes. */
		await page.getByRole('button', {name: 'Show one more product'}).click();

		await expect(page.locator('.shop-product').last().getByRole('button', {name: 'Add to cart'})).toBeVisible();

		await page.locator('.shop-product').last().getByRole('button', {name: 'Add to cart'}).click();

		await expect(cart.locator('.shop-cart-count')).toHaveText('2');
		await expect(cart.locator('.shop-cart-total')).toHaveText('112.00 EUR');

		await page.getByRole('button', {name: 'Remove the last product'}).click();

		await expect(page.locator('[data-elemenx-widget-mounted]')).toHaveCount(4);

		/* Its events bubble from its place: the page hears the checkout. */
		await cart.getByRole('button', {name: 'Checkout'}).click();

		await expect(page.locator('.shop-log')).toContainText('checkout: 2 items, 112.00');
		await expect(cart.locator('.shop-cart-count')).toHaveText('0');

		/* The code of the widgets loaded once more: it runs once, nothing is mounted twice. */
		await page.evaluate(function () {
			return new Promise(function (resolve) {
				var script = document.createElement('script');

				script.src = 'widget.js';
				script.onload = resolve;

				document.head.appendChild(script);
			});
		});

		await expect(lamp.locator('.shop-add')).toHaveCount(1);
		await expect(page.locator('[data-elemenx-widget-mounted]')).toHaveCount(4);

		/* The page mounts one from its code too. */
		await page.evaluate(function () {
			var place = document.createElement('div');

			place.className = 'by-code';

			document.body.appendChild(place);

			window.ShopWidgets.Mount(place, 'Reviews', {Product: 'Lamp'});
		});

		await expect(page.locator('.by-code .shop-reviews-count')).toHaveText('2 reviews');

		expect(errors).toEqual([]);
	});
});
