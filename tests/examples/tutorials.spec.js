import { test, expect } from '../coverage/playwright.js';
import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Server from '../../tools/server.js';

var root = path.resolve(process.cwd(), 'examples', 'Tutorials');
var cli = path.resolve(process.cwd(), 'elemenx-cli.js');

/*
 * What each tutorial does in a browser, once its project is built by the CLI (its elemenx.config.js) and served as a
 * production server serves it: the steps of the tutorial, pressed and typed.
 */
var Checks = {
	Landing: async function (page) {
		await expect(page.locator('h1')).toHaveText('Notes that think with you');
		await expect(page.locator('#features .elemenx-card')).toHaveCount(4);

		await page.getByRole('button', {name: 'Watch the tour'}).click();

		await expect(page.locator('.elemenx-toast')).toContainText('A tour is on its way');

		/* The form refuses an empty email, then takes a valid one with the terms accepted. */
		await page.getByRole('button', {name: 'Create my account'}).click();

		await expect(page.locator('#signup .elemenx-field-error, #signup [role="alert"]').first()).toBeVisible();

		await page.locator('#signup input[type="email"]').fill('ada@example.com');
		await page.locator('#signup').getByText('I accept the terms').click();
		await page.getByRole('button', {name: 'Create my account'}).click();

		await expect(page.locator('#signup .elemenx-callout.success')).toHaveText('Thank you! Check your mail.');
	},

	Blog: async function (page) {
		await expect(page.locator('.blog-main h1')).toHaveText('All posts');
		await expect(page.locator('.blog-main .elemenx-card-title, .blog-main [class*="post"] h3, .blog-main h2, .blog-main h3').filter({hasText: 'A grid in five lines of CSS'}).first()).toBeVisible();

		/* A tag filters the list, through the router. */
		await page.locator('a[href="/tag/tools"]').click();

		await expect(page).toHaveURL(/\/tag\/tools$/);
		await expect(page.locator('.blog-main h1')).toHaveText('#tools');
		await expect(page.locator('.blog-main')).not.toContainText('A grid in five lines of CSS');

		/* A post: its Markdown, its title in the tab, and a comment kept after a reload. */
		await page.locator('a[href="/post/the-editor-i-use"]').first().click();

		await expect(page.locator('.blog-main table')).toBeVisible();
		await expect(page).toHaveTitle('The editor I use · Field notes');

		await page.locator('.blog-main textarea').fill('Which theme is that?');
		await page.getByRole('button', {name: 'Comment'}).click();

		await expect(page.locator('.blog-main')).toContainText('Comments (1)');

		await page.reload();

		await expect(page.locator('.blog-main')).toContainText('Which theme is that?');

		/* Back to the list by the history of the browser, and a path no route has. */
		await page.goBack();

		await expect(page.locator('.blog-main h1')).toHaveText('#tools');

		await page.goto(page.url().replace(/\/tag\/tools$/, '/nowhere'));

		await expect(page.locator('.blog-main')).toContainText('Nothing here');
	},

	Admin: async function (page) {
		var origin = new URL(page.url()).origin;

		/* A guest who asks for the users goes to the page to sign in, and back to the users after it. */
		await page.goto(origin + '/users');

		await expect(page).toHaveURL(/\/login\?return=%2Fusers$/);

		await page.locator('input[type="email"]').fill('ada@example.com');
		await page.locator('input[type="password"]').fill('short');
		await page.getByRole('button', {name: 'Sign in'}).click();

		await expect(page.locator('.elemenx-field-error, [role="alert"]').first()).toBeVisible();

		await page.locator('input[type="password"]').fill('long enough');
		await page.getByRole('button', {name: 'Sign in'}).click();

		await expect(page).toHaveURL(/\/users$/);
		await expect(page.locator('.admin-side')).toBeVisible();

		/* The table: five rows a page, filtered by a column, and a user removed after the dialog. */
		await expect(page.locator('.elemenx-table tbody tr')).toHaveCount(5);

		await page.locator('.elemenx-table thead input').first().fill('grace');

		await expect(page.locator('.elemenx-table tbody tr')).toHaveCount(1);

		await page.locator('.elemenx-table tbody tr').first().click();

		await expect(page.locator('dialog.elemenx-drawer input').first()).toHaveValue('Grace Hopper');

		await page.getByRole('button', {name: 'Remove'}).click();
		await page.locator('.elemenx-dialog-host [data-action="ok"] button').click();

		await expect(page.locator('.elemenx-toast')).toContainText('Grace Hopper is removed.');

		/* The dashboard from the sidebar, then out. */
		await page.locator('.admin-side .elemenx-nav-row').filter({hasText: 'Dashboard'}).click();

		await expect(page.locator('.admin-main h1')).toHaveText('Dashboard');
		await expect(page.locator('.admin-main svg').first()).toBeVisible();

		await page.locator('.admin-header .elemenx-menu-button, .admin-header button').filter({hasText: 'ada'}).click();
		await page.getByRole('menuitem', {name: 'Sign out'}).click();

		await expect(page).toHaveURL(/\/login$/);
		await expect(page.locator('.admin-side')).toHaveCount(0);
	},

	Shop: async function (page) {
		var origin = new URL(page.url()).origin;

		/* An empty cart keeps the checkout away. */
		await page.goto(origin + '/checkout');

		await expect(page).toHaveURL(origin + '/');

		/* A category, a product into the cart from its card, the badge of the cart. */
		await page.getByRole('tab', {name: 'Kitchen'}).click();

		await expect(page.locator('.shop-main .elemenx-product-card, .shop-main [class*="product"]').filter({hasText: 'Brass lamp'})).toHaveCount(0);

		await page.locator('.shop-main').getByRole('button', {name: /cart/i}).first().click();

		await expect(page.locator('.shop-header .elemenx-badge')).toHaveText('1');

		/* The page of a product, another one into the cart, and the cart kept after a reload. */
		await page.getByRole('tab', {name: 'All'}).click();
		await page.locator('a[href="/product/lamp"]').first().click();

		await expect(page.locator('.shop-main h1')).toHaveText('Brass lamp');

		await page.getByRole('button', {name: 'Add to the cart'}).click();

		await expect(page.locator('.shop-header .elemenx-badge')).toHaveText('2');

		await page.reload();

		await expect(page.locator('.shop-header .elemenx-badge')).toHaveText('2');

		/* The drawer of the cart, the checkout, a card refused and then accepted. */
		await page.locator('.shop-header').getByRole('button', {name: /Cart/}).click();
		await page.getByRole('button', {name: 'Checkout'}).click();

		await expect(page).toHaveURL(/\/checkout$/);

		await page.locator('.shop-main input').first().fill('Ada Lovelace');
		await page.locator('.shop-main input[type="tel"]').fill('7911123456');
		await page.locator('.shop-main textarea').fill('12 Old Street');
		await page.locator('.elemenx-card-input input[autocomplete="cc-number"]').fill('4111111111111111');
		await page.locator('input[autocomplete="cc-exp"]').fill('12' + String((new Date().getFullYear() + 2) % 100));
		await page.locator('input[autocomplete="cc-csc"]').fill('123');
		await page.getByRole('button', {name: 'Place the order'}).click();

		await expect(page.locator('.shop-main .elemenx-callout.success')).toContainText('is placed');
		await expect(page.locator('.shop-header .elemenx-badge')).toHaveCount(0);
	},

	Chat: async function (page) {
		var other = await page.context().newPage();

		async function join (tab, name) {
			await tab.locator('.talk-join input').fill(name);
			await tab.getByRole('button', {name: 'Join'}).click();

			await expect(tab.locator('.talk-room')).toHaveText('#general');
		}

		async function send (tab, text) {
			await tab.locator('.elemenx-chat-composer textarea, .elemenx-chat-composer [contenteditable]').first().fill(text);
			await tab.keyboard.press('Enter');
		}

		await other.goto(page.url());

		await join(page, 'Ada');

		/* The name is kept: the second tab knows it already. */
		await other.reload();

		await expect(other.locator('.talk-room')).toHaveText('#general');

		/* A message of one tab reaches the other through the BroadcastChannel. */
		await send(page, 'Hello from the first tab');

		await expect(other.locator('.elemenx-chat-message')).toContainText(['Hello from the first tab']);

		/* The bot of the room Help answers. */
		await page.locator('.elemenx-nav-row').filter({hasText: 'Help'}).click();

		await expect(page.locator('.talk-room')).toHaveText('#help');

		await send(page, 'What is the price?');

		await expect(page.locator('.elemenx-chat-message').last()).toContainText('It is free.');

		await other.close();
	},

	Game: async function (page) {
		var canvas = page.locator('.elemenx-game-world-canvas');
		var help = page.locator('.gems-help');
		var box;
		var at;

		/* The cell a press on the canvas reaches, as the HUD tells it. */
		async function press (x, y) {
			await page.mouse.click(box.x + x, box.y + y);

			await expect(help).toContainText('Going to');

			/* The HUD of this press, not of the one before (a cell off the map is negative). */
			await page.waitForTimeout(150);

			return (await help.textContent()).match(/Going to (-?\d+), (-?\d+)/).slice(1, 3).map(Number);
		}

		/* A press on the cell, found by trying: the HUD tells the cell each press reaches. */
		async function go (cell) {
			var point = {X: at.X + (cell[0] - at.Cell[0]) * at.Size, Y: at.Y + (cell[1] - at.Cell[1]) * at.Size};
			var tries = [];
			var reached;
			var i;

			for (i = 0; i < 4; i++) {
				reached = await press(point.X, point.Y);

				tries.push(Math.round(point.X) + ',' + Math.round(point.Y) + ' -> ' + reached.join(','));

				if (reached[0] === cell[0] && reached[1] === cell[1]) return;

				point.X += (cell[0] - reached[0]) * at.Size;
				point.Y += (cell[1] - reached[1]) * at.Size;
			}

			throw new Error('No press reached the cell ' + cell.join(', ') + ': ' + JSON.stringify(at) + ' ' + tries.join('; '));
		}

		await page.setViewportSize({width: 1280, height: 800});

		await expect(page.locator('.gems-menu')).toContainText('Gem hunt');

		await page.getByRole('button', {name: /Start/}).click();

		await expect(page.locator('.gems-menu')).toHaveCount(0);

		/* Two presses tell the size of a cell on the screen. */
		box = await canvas.boundingBox();

		var first = await press(box.width / 2 - 120, box.height / 2);
		var second = await press(box.width / 2 + 120, box.height / 2);

		at = {X: box.width / 2 - 120, Y: box.height / 2, Cell: first, Size: 240 / Math.max(1, second[0] - first[0])};

		/* The hero walks to the gem at 3, 6 and finds it. */
		await go([3, 6]);

		await expect(page.locator('.gems-score')).toContainText('1', {timeout: 20000});

		/* Escape pauses, Resume goes on. */
		await page.keyboard.press('Escape');

		await expect(page.locator('.gems-menu')).toContainText('Paused');

		await page.getByRole('button', {name: /Resume/}).click();

		await expect(page.locator('.gems-menu')).toHaveCount(0);
	},

	Editor: async function (page) {
		var editor = page.locator('.studio-code textarea');

		/* The first file is open; a file of the tree opens in a tab of its own. */
		await expect(page.locator('.elemenx-tabs [role="tab"]')).toHaveCount(1);

		await page.locator('.elemenx-tree [role="treeitem"]').filter({hasText: 'site.css'}).click();

		await expect(page.locator('.elemenx-tabs [role="tab"]')).toHaveCount(2);
		await expect(editor).toHaveValue(/font-family/);

		/* A change marks the tab, Mod+S saves it and the terminal says so; the file is there after a reload. */
		await editor.click();

		await page.keyboard.press('Control+End');
		await page.keyboard.type('/* edited */');

		await expect(page.locator('.elemenx-tabs [role="tab"][aria-selected="true"]')).toContainText('•');

		await page.keyboard.press('Control+s');

		await expect(page.locator('.elemenx-terminal')).toContainText('Saved styles/site.css');
		await expect(page.locator('.elemenx-tabs [role="tab"][aria-selected="true"]')).not.toContainText('•');

		/* The terminal runs its commands. */
		await page.locator('.elemenx-terminal input').fill('cat styles/site.css');
		await page.keyboard.press('Enter');

		await expect(page.locator('.elemenx-terminal')).toContainText('/* edited */');

		/* The palette opens a file by its name. */
		await page.keyboard.press('Control+k');
		await page.locator('.elemenx-palette-search input').fill('readme');
		await page.keyboard.press('Enter');

		await expect(page.locator('.elemenx-tabs [role="tab"][aria-selected="true"]')).toContainText('README.md');

		await page.reload();
		await page.locator('.elemenx-tree [role="treeitem"]').filter({hasText: 'site.css'}).click();

		await expect(editor).toHaveValue(/\/\* edited \*\//);
	},

	Backend: async function (page) {
		/* The part of the server stays; the part of Elemenx reads the data of the page. */
		await expect(page.locator('header h1')).toHaveText('Orders');
		await expect(page.locator('#orders .elemenx-table tbody tr')).toHaveCount(5);

		await page.locator('#orders').getByText('New', {exact: true}).click();

		await expect(page.locator('#orders .elemenx-table tbody tr')).toHaveCount(2);
		await expect(page.locator('#orders')).toContainText('2 orders · €301.00');

		await page.locator('#orders textarea').fill('Pack 1043 first');
		await page.getByRole('button', {name: 'Send'}).click();

		await expect(page.locator('#orders .elemenx-callout.success')).toContainText('Pack 1043 first');
	}
};

test.describe('Tutorials: every project of examples/Tutorials builds and does what its tutorial says', function () {
	fs.readdirSync(root).filter(function (name) {
		return fs.existsSync(path.join(root, name, 'elemenx.config.js'));
	}).forEach(function (name) {
		test(name, async function ({ page }) {
			var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-tutorial-'));
			var errors = [];
			var server;

			expect(Checks[name], 'the checks of ' + name).toBeTruthy();

			fs.cpSync(path.join(root, name), folder, {recursive: true, filter: function (file) {
				return path.basename(file) !== 'dist' && path.basename(file) !== 'node_modules';
			}});

			/* A project with an entry is built; a page without one (Backend) is served as it is, as elemenx dev does. */
			if (/\n\s*Entry\s*:/.test(fs.readFileSync(path.join(folder, 'elemenx.config.js'), 'utf8'))) {
				childProcess.execFileSync(process.execPath, [cli, 'build', folder], {stdio: 'ignore'});

				server = Server.Create({Root: path.join(folder, 'dist')});
			}
			else {
				server = Server.Create({Root: folder});
			}

			await new Promise(function (resolve) {
				server.Listen(0, '127.0.0.1', resolve);
			});

			page.on('pageerror', function (error) {
				errors.push(error.message + ' ' + String(error.stack || '').split('\n').slice(1, 4).join(' | '));
			});
			page.on('console', function (message) {
				if (message.type() === 'error')
					errors.push(message.text());
			});

			try {
				await page.goto('http://127.0.0.1:' + server.Server.address().port + '/');

				await Checks[name](page);

				expect(errors).toEqual([]);
			}
			finally {
				await new Promise(function (resolve) {
					server.Close(resolve);
				});

				fs.rmSync(folder, {recursive: true, force: true});
			}
		});
	});
});
