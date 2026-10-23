import { test, expect } from '../coverage/playwright.js';
import fs from 'fs';
import path from 'path';

import Builder from '../../tools/builder.js';

var project = path.resolve(process.cwd(), 'tests', 'dist', 'widget-project');
var output = path.resolve(process.cwd(), 'tests', 'dist', 'widget-output');

function errors (page) {
	var list = [];

	page.on('pageerror', function (error) {
		list.push(error.message);
	});

	page.on('console', function (message) {
		if (message.type() === 'error')
			list.push(message.text());
	});

	return list;
}

test.describe('elemenx build --widget', function () {
	/* One build into widget-output for the tests of the file: they run one after the other, in one worker. */
	test.describe.configure({mode: 'serial'});

	test.beforeAll(function () {
		Builder.Build(project, {widget: true, out: '../widget-output'});
	});

	test('builds one isolated widget.js and a page that loads it', function () {
		var script = fs.readFileSync(path.join(output, 'widget.js'), 'utf8');
		var page = fs.readFileSync(path.join(output, 'index.html'), 'utf8');

		expect(fs.readdirSync(output).sort()).toEqual(['index.html', 'widget.js']);
		expect(script).toMatch(/^\/\*! widget-project \| Elemenx \d+\.\d+\.\d+, isolated \*\/\n\(function \(\) \{\nvar ElemenxIsolated = \{\};\n/);
		expect(script).toContain('Elemenx.Style("library:/libraries/ElemenxUI/index.css",');
		expect(script).toContain('})(ElemenxIsolated.Elemenx);');

		/* The widget uses no router, network, storage, events or workers: the framework comes without them. */
		expect(script).not.toContain('Elemenx.Network=');
		expect(script).not.toContain('Elemenx.Router=');
		expect(script).not.toContain('Elemenx.WebWorker=');

		/* Nor what the components tell the tools of themselves ($Meta): the widget asks nothing of it. */
		expect(script).not.toContain('Two panes with a draggable divider.');
		expect(Buffer.byteLength(script)).toBeLessThan(336 * 1024);

		/* The game themes are packs: the widget names none of them, so they stay out. */
		expect(script).not.toContain('themes/fantasy.css');
		expect(script).not.toContain('themes/scifi.css');
		expect(script).toContain('themes/darcula.css');
		expect(page.match(/<script/g).length).toBe(1);
		expect(page).toContain('<script src="widget.js"></script>');
	});

	test('runs on a page of another site with an Elemenx of its own: neither touches the other', async function ({ page }) {
		var list = errors(page);
		var widget;

		await page.goto('/tests/dist/widget-host.html');

		widget = page.locator('#widget');

		await expect(widget.locator('.widget-title')).toHaveText('Widget');

		/* The Elemenx of the page stays; the widget renders in a shadow root. */
		expect(await page.evaluate(function () {
			return [window.Elemenx.Mine, window.Elemenx.Version, !!document.getElementById('widget').shadowRoot, document.querySelectorAll('.widget-title').length];
		})).toEqual([true, '0.1.0', true, 0]);

		/* The styles of the page do not reach the widget, and the ones of the widget do not reach the page. */
		expect(await widget.locator('.widget-title').evaluate(function (node) {
			return [getComputedStyle(node).color !== 'rgb(255, 0, 0)', getComputedStyle(node).fontSize !== '50px', getComputedStyle(node).fontFamily.indexOf('serif') !== 0];
		})).toEqual([true, true, true]);
		expect(await widget.getByRole('button', {name: 'Count'}).evaluate(function (node) {
			return getComputedStyle(node).backgroundColor;
		})).not.toBe('rgb(255, 0, 0)');
		expect(await page.locator('.page-title').evaluate(function (node) {
			return [getComputedStyle(node).fontSize, getComputedStyle(document.body).color, getComputedStyle(document.body).marginTop];
		})).toEqual(['50px', 'rgb(255, 0, 0)', '8px']);

		/* The page keeps its language and direction. */
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		expect(await page.locator('html').getAttribute('dir')).toBe(null);

		/* The controls work in the shadow root: a button, an icon, a list that opens and closes. */
		await widget.getByRole('button', {name: 'Count'}).click();

		await expect(widget.locator('.widget-clicks')).toHaveText('1');
		await expect(widget.locator('svg[data-icon="add"] path')).toHaveCount(1);

		await widget.locator('.elemenx-select-trigger').click();

		await expect(widget.locator('.elemenx-popup')).toBeVisible();

		await widget.getByRole('option', {name: 'Team'}).click();

		await expect(widget.locator('.widget-plan')).toHaveText('team');
		await expect(widget.locator('.elemenx-popup')).toBeHidden();

		/* A press on the page closes an open list. */
		await widget.locator('.elemenx-select-trigger').click();

		await expect(widget.locator('.elemenx-popup')).toBeVisible();

		await page.locator('.page-text').click();

		await expect(widget.locator('.elemenx-popup')).toBeHidden();
		expect(list).toEqual([]);
	});
});
