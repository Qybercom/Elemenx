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

/* A finger on a touch screen drags the element by dx, dy in steps and lifts (pointer events of a touch, as a phone sends them). */
function swipe (locator, dx, dy, lift) {
	return locator.evaluate(function (node, move) {
		var box = node.getBoundingClientRect();
		var x = box.left + box.width / 2;
		var y = box.top + Math.min(box.height / 2, 12);
		var i = 0;

		function send (type, step) {
			node.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true, pointerId: 7, clientX: x + move.DX * step, clientY: y + move.DY * step}));
		}

		send('pointerdown', 0);

		while (i < 5) {
			i++;

			send('pointermove', i / 5);
		}

		if (move.Lift)
			send('pointerup', 1);

		return node.closest('.elemenx-gallery, .elemenx-menu') ? getComputedStyle(node.closest('.elemenx-gallery, .elemenx-menu.sheet')).getPropertyValue('--elemenx-gallery-drag') || node.closest('.elemenx-gallery, .elemenx-menu.sheet').style.transform : '';
	}, {DX: dx, DY: dy, Lift: lift !== false});
}

function section (page, title) {
	return page.locator('.ui-kit > .elemenx-section').filter({has: page.locator(':scope > .elemenx-section-header .elemenx-section-title', {hasText: new RegExp('^' + title + '$')})});
}

function field (page, label) {
	return page.locator('.elemenx-field').filter({has: page.locator('.elemenx-field-label', {hasText: new RegExp('^' + label + '$')})});
}

/*
 * Presses keys in target until shown is visible: a busy page (the catalogue beside the other workers) may take a key
 * before the element listens. It presses again only while shown is not there, never once it worked.
 */
async function hotkey (page, target, keys, shown) {
	await expect(async function () {
		if (!(await shown.count())) {
			await target.focus();

			await page.keyboard.press(keys);
		}

		await expect(shown).toBeVisible({timeout: 2000});
	}).toPass({timeout: 30000});
}

/*
 * Watches scope for a state that lasts a moment (a load of 300 ms, a reconnect): selector matching an element in it, or
 * its text starting with text. Call it before the action; it returns a function that waits until the state has been
 * seen. A busy page may show the state and leave it between two looks of an expect.
 */
async function became (page, scope, selector, text) {
	var key = 'became' + Math.random().toString(36).slice(2);

	await scope.evaluate(function (node, detail) {
		function look () {
			if (detail.Selector && (node.matches(detail.Selector) || node.querySelector(detail.Selector)))
				window[detail.Key] = true;

			if (detail.Text && node.textContent.indexOf(detail.Text) === 0)
				window[detail.Key] = true;
		}

		window[detail.Key] = false;

		look();

		new MutationObserver(look).observe(node, {subtree: true, childList: true, attributes: true, characterData: true});
	}, {Key: key, Selector: selector || null, Text: text || null});

	return function (timeout) {
		return expect.poll(function () {
			return page.evaluate(function (name) {
				return window[name];
			}, key);
		}, {timeout: timeout}).toBe(true);
	};
}

/*
 * The box of locator once it stays put and in view: the same twice, 200 ms apart, at least 80 pixels from the top and
 * the bottom of the window (else it is scrolled to the middle). Content built above it may move it meanwhile, a box at
 * the edge makes a drag scroll the page, and a gesture to a box read before that misses (regression: drags under load).
 */
async function settled (locator) {
	var box = null;

	await expect.poll(async function () {
		var height = locator.page().viewportSize().height;

		box = await locator.boundingBox();

		if (!box)
			return false;

		if (box.y < 80 || box.y + box.height > height - 80) {
			await locator.evaluate(function (node) {
				node.scrollIntoView({block: 'center'});
			});

			return false;
		}

		await new Promise(function (resolve) {
			setTimeout(resolve, 200);
		});

		return JSON.stringify(await locator.boundingBox()) === JSON.stringify(box);
	}).toBe(true);

	return box;
}

/*
 * Takes the item at box with the mouse: down at it, and a move of 12 pixels until the ghost of the drag shows. A busy
 * page may not start the drag of the first press (regression: no ghost, under load); the button is let go then, a
 * click of the item, and pressed again. The drag goes on from there with the button down.
 */
async function grab (page, box) {
	await expect(async function () {
		await page.mouse.move(box.x + 20, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x + 32, box.y + box.height / 2, {steps: 2});

		try {
			await expect(page.locator('.elemenx-drag-ghost')).toBeVisible({timeout: 2000});
		}
		catch (error) {
			await page.mouse.up();

			throw error;
		}
	}).toPass({timeout: 30000});
}

/* Types into the search field of the open popup of scope: the field takes the focus a task after the popup opens. */
async function search (page, scope, text) {
	await expect(scope.locator('.elemenx-popup-search input')).toBeFocused();

	await page.keyboard.type(text);
}

/*
 * Opens the catalogue: with sections, only those (?sections=: a test builds the part of the page it needs, not the
 * whole of it beside the other workers), all of them without.
 */
async function open (page, origin, sections) {
	/* The catalogue loads more resources than the default buffer of Resource Timing (250) keeps. */
	await page.addInitScript(function () {
		performance.setResourceTimingBufferSize(4000);
	});

	await page.goto(origin.URL + '/ui' + (sections ? '?sections=' + encodeURIComponent(sections.join('|')) : ''));

	await ready(page, !sections);
}

/* The catalogue is a large page: beside the other workers its development build may take more than 10 seconds. */
async function ready (page, whole) {
	/* The whole catalogue: its Workspace too (a part of it shows only its sections). */
	if (whole)
		await expect(page.locator('.elemenx-workspace').first()).toBeVisible({timeout: 60000});

	await expect(page.locator('.ui-kit-intro')).toBeVisible({timeout: 60000});

	/*
	 * The sections build their content near the viewport or in the background (*lazy, a placeholder until then): the
	 * tests start once none is left, twice in a row, since a content built may hold a *lazy of its own a task later.
	 */
	await expect(async function () {
		expect(await page.locator('[data-elemenx-lazy]').count()).toBe(0);

		await page.waitForTimeout(150);

		expect(await page.locator('[data-elemenx-lazy]').count()).toBe(0);
	}).toPass({timeout: 60000});
}

/* Reloads the catalogue and waits for it, as open does. */
async function reload (page) {
	await page.reload();

	await ready(page, page.url().indexOf('sections=') === -1);
}

for (const origin of origins) {
	test.describe('ElemenxUI catalogue (' + origin.Name + ')', function () {
		test('renders every section with icons and library styles and no errors', async function ({ page }) {
			var errors = captureErrors(page);
			var sprite;

			await open(page, origin);

			await expect(page.locator('.ui-kit > .elemenx-section')).toHaveCount(48);

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
					return /ElemenxUI\/index\.svg$/.test(name);
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

		test('icon sets load on demand, paint with the theme colors, come from markup and override library icons', async function ({ page }) {
			var icons;
			var weather;
			var sun;
			var save;

			await open(page, origin, ['Icons']);

			icons = section(page, 'Icons');
			weather = icons.locator('.ui-kit-set-weather');
			sun = weather.locator('[data-icon="weather:clear-day"] .sun').first();
			save = page.locator('svg[data-icon="save"]').first();

			await expect(icons.locator('svg[data-icon="mic-off"] path')).toHaveCount(1);
			await expect(icons.locator('svg[data-icon="headphones"] rect')).toHaveCount(2);

			await expect(icons.locator('.ui-kit-set-music .ui-kit-icon')).toHaveCount(32);
			await expect(weather.locator('.ui-kit-icon')).toHaveCount(44);
			await expect(icons.locator('.ui-kit-set-brands .ui-kit-icon')).toHaveCount(349);
			expect(await icons.locator('.ui-kit-set-brands svg[data-icon="brands:postgresql"] .brand').evaluate(function (node) {
				return getComputedStyle(node).fill;
			})).toBe('rgb(65, 105, 225)');
			expect(await icons.locator('.ui-kit-set-brands svg[data-icon="brands:telegram"] .brand').evaluate(function (node) {
				return getComputedStyle(node).fill;
			})).toBe('rgb(38, 165, 228)');
			await expect(icons.locator('svg[data-icon="files:docx"], .ui-kit-icon[title="letter.docx"] svg[data-icon="files:docx"]').first()).toBeAttached();
			await expect(page.locator('#elemenx-icons symbol#elemenx-icon-weather-rain[data-set="weather"]')).toHaveCount(1);
			await expect(icons.locator('svg[data-icon="music:guitar"]')).toHaveAttribute('viewBox', '0 0 24 24');
			await expect(weather.locator('.ui-kit-icon').first().locator('span')).toHaveText('clear-day');

			/* Colored: the parts take the weather colors of the theme; without it, the color of the text. */
			expect(await sun.evaluate(function (node) {
				return getComputedStyle(node).stroke;
			})).toBe('rgb(217, 146, 26)');

			await page.evaluate(function () {
				document.body.setAttribute('data-theme', 'dark');
			});

			expect(await sun.evaluate(function (node) {
				return getComputedStyle(node).stroke;
			})).toBe('rgb(240, 180, 64)');

			await icons.getByRole('button', {name: 'Theme colors'}).click();

			await expect(weather.locator('svg.colored')).toHaveCount(0);
			expect(await sun.evaluate(function (node) {
				return getComputedStyle(node).stroke === getComputedStyle(node).color;
			})).toBe(true);

			/* A filled set keeps the paint of its symbols. */
			await expect(icons.locator('svg[data-icon="brand:disk"] > g')).toHaveAttribute('fill', 'currentColor');
			await expect(icons.locator('svg[data-icon="brand:spark"] path')).toHaveAttribute('fill', '#e8a33d');

			/* An override redraws every icon of the name, and lets it go again. */
			await icons.getByRole('button', {name: 'Draw save as brand:disk'}).click();

			await expect(save.locator('g > path')).toHaveCount(1);
			await expect(save).toHaveAttribute('data-icon', 'save');

			await icons.getByRole('button', {name: 'Draw save as brand:disk'}).click();

			await expect(save.locator('g')).toHaveCount(0);
			await expect(save.locator('path')).toHaveCount(1);
			await expect(page.locator('svg.elemenx-icon use')).toHaveCount(0);
		});

		test('a right-to-left language mirrors the components: arrows, sliders, popups and the icons of a direction', async function ({ page }) {
			var feedback;
			var thumb;
			var tabs;
			var language;
			var box;
			var trigger;

			await open(page, origin, ['Feedback', 'Tabs', 'Selection', 'Inputs', 'Trees, tables and long lists']);

			await page.locator('.ui-kit-intro').getByRole('button', {name: 'العربية'}).click();

			await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
			await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

			/* The phrases without an Arabic dictionary are the English ones. */
			await expect(page.locator('.ui-kit-intro').getByRole('button', {name: 'Light theme'})).toBeVisible();

			/* A slider runs from right to left: the arrow to the right lowers it, and its fill starts at the right. */
			feedback = section(page, 'Feedback');
			thumb = feedback.getByRole('slider', {name: 'Volume'});

			await thumb.scrollIntoViewIfNeeded();
			await thumb.focus();

			await page.keyboard.press('ArrowRight');

			await expect(feedback.locator('.elemenx-section-header')).toContainText('Volume: 39');

			box = await feedback.locator('.elemenx-slider-track').first().boundingBox();

			expect(await feedback.locator('.elemenx-slider-fill').first().evaluate(function (node) {
				return Math.round(node.getBoundingClientRect().right);
			})).toBe(Math.round(box.x + box.width));

			/* The arrow to the left goes to the next tab. */
			tabs = section(page, 'Tabs').getByRole('tab');

			await tabs.first().click();

			await page.keyboard.press('ArrowLeft');

			await expect(tabs.nth(1)).toBeFocused();

			/* A list opens at the start of its field: the right edge. */
			language = field(page, 'Language');
			trigger = await language.locator('.elemenx-select-trigger').boundingBox();

			await language.locator('.elemenx-select-trigger').click();

			box = await language.locator('.elemenx-popup').boundingBox();

			expect(Math.abs(box.x + box.width - (trigger.x + trigger.width))).toBeLessThan(2);

			await page.keyboard.press('Escape');

			/* The icons of a direction point the other way; an address in a field stays from left to right. */
			expect(await page.locator('.elemenx-pagination .elemenx-icon[data-icon="chevron-right"]').first().evaluate(function (node) {
				return getComputedStyle(node).transform;
			})).toBe('matrix(-1, 0, 0, 1, 0, 0)');
			await expect(field(page, 'IPv6 address').locator('input')).toHaveAttribute('dir', 'ltr');

			await page.locator('.ui-kit-intro').getByRole('button', {name: 'English'}).click();

			await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
		});

		test('the phrases of the components follow the language of Elemenx.Locale', async function ({ page }) {
			var intro;
			var overlays;

			await open(page, origin, ['Overlays', 'Themes', 'Trees, tables and long lists']);

			intro = page.locator('.ui-kit-intro');
			overlays = section(page, 'Overlays');

			await expect(page.locator('html')).not.toHaveAttribute('lang', 'ru');
			await expect(intro.getByRole('button', {name: 'Light theme'})).toBeVisible();
			await expect(page.locator('.elemenx-pagination-range').first()).toContainText(' of ');

			await intro.getByRole('button', {name: 'Русский'}).click();

			await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
			await expect(intro.getByRole('button', {name: 'Русский'})).toHaveAttribute('aria-pressed', 'true');
			await expect(intro.getByRole('button', {name: 'Светлая тема'})).toBeVisible();
			await expect(page.locator('.elemenx-pagination-range').first()).toContainText(' из ');

			/* A phrase of the code (the actions of Dialogs.Alert) is in the language too. */
			await overlays.getByRole('button', {name: 'Alert'}).click();

			await expect(page.getByRole('dialog', {name: 'Saved'}).getByRole('button', {name: 'ОК'})).toBeVisible();

			await page.keyboard.press('Escape');

			await intro.getByRole('button', {name: 'English'}).click();

			await expect(page.locator('html')).toHaveAttribute('lang', 'en');
			await expect(intro.getByRole('button', {name: 'Light theme'})).toBeVisible();
			await expect(page.locator('.elemenx-pagination-range').first()).toContainText(' of ');
		});

		test('a part of the page takes a theme of its own, by its attribute or Theme.Scope, whatever the page shows', async function ({ page }) {
			var errors = captureErrors(page);
			var themes;
			var scope;
			var paint;

			await open(page, origin, ['Themes']);

			themes = section(page, 'Themes');
			scope = themes.locator('.ui-kit-theme-scope');
			paint = function () {
				return scope.evaluate(function (node) {
					var button = node.querySelector('.elemenx-button.primary');

					return [getComputedStyle(node).backgroundColor, getComputedStyle(node).color, getComputedStyle(button).backgroundColor, getComputedStyle(document.body).backgroundColor];
				});
			};

			/* The page is light; the part is Darcula by its markup, and the Components in it follow it. */
			await themes.locator('.elemenx-check-label', {hasText: /^Light$/}).click();

			await expect(page.locator('body')).toHaveAttribute('data-scheme', 'light');
			expect(await paint()).toEqual(['rgb(43, 43, 43)', 'rgb(187, 187, 187)', 'rgb(54, 88, 128)', 'rgb(242, 241, 239)']);

			/* The page goes dark; the part asks for the light scheme: it stays light. */
			await themes.locator('.elemenx-check-label', {hasText: /^Dark$/}).click();
			await scope.getByRole('button', {name: 'Light'}).click();

			await expect(scope).toHaveAttribute('data-theme', 'light');
			await expect(scope).toHaveAttribute('data-scheme', 'light');
			await expect.poll(async function () {
				var colors = await paint();

				return [colors[0], colors[3]];
			}).toEqual(['rgb(242, 241, 239)', 'rgb(21, 23, 27)']);

			/* A named theme of the Library: loaded first, then shown in the scheme of the page. */
			await scope.getByRole('button', {name: 'Contrast'}).click();

			await expect(scope).toHaveAttribute('data-theme', 'contrast');
			await expect(scope).toHaveAttribute('data-scheme', 'dark');
			await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');

			expect(errors).toEqual([]);
		});

		test('themes switch the tokens and the rules of the Components, keep to their schemes and are remembered', async function ({ page }) {
			var themes;
			var picker;
			var body;
			var input;
			var button;
			var style;

			await open(page, origin, ['Themes', 'Inputs', 'Layouts']);

			themes = section(page, 'Themes');
			picker = field(page, 'Theme');
			body = page.locator('body');
			input = section(page, 'Inputs').locator('.elemenx-input').first();
			button = themes.getByRole('button', {name: 'Show Mine'});
			/* Colors and sizes may come with a transition: they are read until they are the ones expected. */
			style = function (locator, name) {
				return locator.evaluate(function (node, property) {
					return getComputedStyle(node)[property];
				}, name);
			};

			await themes.locator('.elemenx-check-label', {hasText: /^Light$/}).click();

			await expect(body).toHaveAttribute('data-theme', 'light');
			await expect(body).toHaveAttribute('data-scheme', 'light');
			await expect.poll(function () {
				return style(input, 'height');
			}).toBe('32px');

			/* A Library theme: its tokens and its rules of the Components. */
			await picker.locator('.elemenx-select-trigger').click();
			await picker.locator('.elemenx-option', {hasText: 'Soft'}).click();

			await expect(body).toHaveAttribute('data-theme', 'soft');
			await expect(body).toHaveAttribute('data-scheme', 'light');
			await expect(themes.locator('.elemenx-section-header')).toContainText('Theme: soft · Scheme: light');
			await expect.poll(function () {
				return style(input, 'height');
			}).toBe('36px');
			await expect.poll(function () {
				return style(input, 'borderTopLeftRadius');
			}).toBe('8px');
			await expect.poll(function () {
				return style(button, 'borderTopLeftRadius');
			}).toBe('999px');
			await expect.poll(function () {
				return style(button, 'backgroundColor');
			}).toBe('rgb(107, 78, 255)');

			await themes.locator('.elemenx-check-label', {hasText: /^Dark$/}).click();

			await expect(body).toHaveAttribute('data-theme', 'soft');
			await expect(body).toHaveAttribute('data-scheme', 'dark');
			await expect.poll(function () {
				return style(button, 'backgroundColor');
			}).toBe('rgb(165, 148, 255)');

			/* A theme made for the dark scheme stays dark under the light policy. */
			await picker.locator('.elemenx-select-trigger').click();
			await picker.locator('.elemenx-option', {hasText: 'Darcula'}).click();
			await themes.locator('.elemenx-check-label', {hasText: /^Light$/}).click();

			await expect(body).toHaveAttribute('data-theme', 'darcula');
			await expect(body).toHaveAttribute('data-scheme', 'dark');
			await expect.poll(function () {
				return style(input, 'backgroundColor');
			}).toBe('rgb(60, 63, 65)');
			await expect.poll(function () {
				return style(button, 'backgroundColor');
			}).toBe('rgb(54, 88, 128)');

			/* A theme of the page, written by the editor, follows its edits and is remembered. */
			await themes.getByRole('slider', {name: 'Corners'}).focus();

			await page.keyboard.press('ArrowRight');

			await button.click();

			await page.mouse.move(0, 0);

			await expect(body).toHaveAttribute('data-theme', 'mine');
			await expect(themes.locator('.ui-kit-theme-css')).toContainText('--elemenx-radius: 7px;');
			await expect.poll(function () {
				return style(input, 'borderTopLeftRadius');
			}).toBe('7px');
			await expect.poll(function () {
				return style(input, 'height');
			}).toBe('36px');
			await expect.poll(function () {
				return style(button, 'backgroundColor');
			}).toBe('rgb(11, 110, 153)');

			await reload(page);

			await expect(section(page, 'Themes')).toBeVisible({timeout: 20000});

			await expect(body).toHaveAttribute('data-theme', 'mine');
			await expect(body).toHaveAttribute('data-scheme', 'light');

			/* Back to the default theme: the policy shows in data-theme again. */
			await picker.locator('.elemenx-select-trigger').click();
			await picker.locator('.elemenx-option', {hasText: 'Default'}).click();

			await expect(body).toHaveAttribute('data-theme', 'light');
			await expect.poll(function () {
				return style(input, 'height');
			}).toBe('32px');
		});

		test('ribbon switches tabs, runs commands, menus and galleries, and shows a contextual tab', async function ({ page }) {
			var ribbon;
			var note;
			var tab;
			var panel;

			await open(page, origin, ['Ribbon']);

			ribbon = section(page, 'Ribbon').locator('.elemenx-ribbon');
			note = section(page, 'Ribbon').locator('.elemenx-section-header');
			tab = function (title) {
				return ribbon.getByRole('tab', {name: title, exact: true});
			};
			panel = function (id) {
				return ribbon.locator('.elemenx-ribbon-panel[data-id="' + id + '"]');
			};

			await ribbon.scrollIntoViewIfNeeded();

			await expect(ribbon.getByRole('tab')).toHaveText(['Home', 'Insert', 'Review', 'View']);
			await expect(tab('Home')).toHaveAttribute('aria-selected', 'true');
			await expect(panel('home')).toBeVisible();
			await expect(panel('insert')).toBeHidden();

			await ribbon.getByRole('button', {name: 'Cut', exact: true}).click();

			await expect(note).toContainText('Last: cut');

			/* A split button: the button pastes, the arrow opens its menu. */
			await ribbon.getByRole('button', {name: 'More Paste'}).click();
			await ribbon.getByRole('menuitem', {name: 'Keep text only'}).click();

			await expect(note).toContainText('Last: paste → Keep text only');

			await ribbon.getByRole('button', {name: 'Bold'}).click();

			await expect(ribbon.getByRole('button', {name: 'Bold'})).toHaveAttribute('aria-pressed', 'true');
			await expect(note).toContainText('Last: bold');

			/* The gallery: a sample of the strip, and every sample in the panel of its last button. */
			await ribbon.locator('.elemenx-ribbon-gallery-items').getByRole('option', {name: 'Heading 1'}).click();

			await expect(note).toContainText('Last: style → Heading 1');

			await ribbon.getByRole('button', {name: 'All Styles'}).click();
			await page.locator('.elemenx-ribbon-gallery-popup').getByRole('option', {name: /Quote/}).click();

			await expect(note).toContainText('Last: style → Quote');
			await expect(ribbon.locator('.elemenx-ribbon-gallery-items [aria-selected="true"]')).toHaveAttribute('data-id', 'quote');

			await tab('Insert').click();

			await expect(tab('Insert')).toHaveAttribute('aria-selected', 'true');
			await expect(panel('insert')).toBeVisible();
			await expect(panel('home')).toBeHidden();

			/* A contextual tab shows with its object, in its color, and goes with it. */
			await section(page, 'Ribbon').getByText('A table is selected (contextual tab)').click();

			await expect(tab('Table design')).toHaveClass(/contextual/);
			await expect(tab('Table design')).toHaveAttribute('aria-selected', 'true');
			await expect(tab('Table design')).toHaveAttribute('title', 'Table tools');
			await expect(panel('table-design')).toBeVisible();

			await section(page, 'Ribbon').getByText('A table is selected (contextual tab)').click();

			await expect(tab('Table design')).toHaveCount(0);
			await expect(tab('Home')).toHaveAttribute('aria-selected', 'true');
		});

		test('ribbon shrinks its groups to fit, folds them into buttons and collapses to its tabs', async function ({ page }) {
			var ribbon;
			var frame;
			var note;
			var clipboard;

			await open(page, origin, ['Ribbon']);

			ribbon = section(page, 'Ribbon').locator('.elemenx-ribbon');
			frame = section(page, 'Ribbon').locator('.ui-kit-frame.ribbon');
			note = section(page, 'Ribbon').locator('.elemenx-section-header');
			clipboard = ribbon.locator('.elemenx-ribbon-group[aria-label="Clipboard"]');

			await ribbon.scrollIntoViewIfNeeded();

			await expect(ribbon.locator('.elemenx-ribbon-group.collapsed')).toHaveCount(0);

			/* The lowest priority first: Paragraph and Editing fold before Font, Font before Clipboard and Styles. */
			await frame.evaluate(function (node) {
				node.style.width = '760px';
			});

			await expect(ribbon.locator('.elemenx-ribbon-group.collapsed')).toHaveCount(3);
			await expect(ribbon.locator('.elemenx-ribbon-group[aria-label="Editing"]')).toHaveClass(/collapsed/);
			await expect(clipboard).not.toHaveClass(/collapsed/);

			await frame.evaluate(function (node) {
				node.style.width = '520px';
			});

			await expect(clipboard).toHaveClass(/collapsed/);
			await expect(ribbon).toHaveClass(/narrow/);

			await clipboard.getByRole('button', {name: 'Clipboard'}).click();

			await expect(clipboard.locator('.elemenx-ribbon-group-popup')).toBeVisible();

			await clipboard.getByRole('button', {name: 'Copy'}).click();

			await expect(note).toContainText('Last: copy');
			await expect(clipboard.locator('.elemenx-ribbon-group-popup')).toBeHidden();

			/* Without room for the tabs: a button with the title of the current tab lists them. */
			await frame.evaluate(function (node) {
				node.style.width = '300px';
			});

			await expect(ribbon).toHaveClass(/tabs-menu/);
			await expect(ribbon.getByRole('tab', {name: 'Home'})).toBeHidden();
			await expect(ribbon.locator('.elemenx-ribbon-tabs-button')).toHaveText('Home');

			await ribbon.locator('.elemenx-ribbon-tabs-button').click();

			await expect(ribbon.getByRole('option', {name: 'Home'})).toBeFocused();
			await expect(ribbon.getByRole('option', {name: 'Home'})).toHaveAttribute('aria-selected', 'true');

			await page.keyboard.press('ArrowDown');

			await expect(ribbon.getByRole('option', {name: 'Insert'})).toBeFocused();

			await page.keyboard.press('Enter');

			await expect(ribbon.locator('.elemenx-ribbon-tabs-list')).toBeHidden();
			await expect(ribbon.locator('.elemenx-ribbon-tabs-button')).toHaveText('Insert');
			await expect(ribbon.locator('.elemenx-ribbon-tabs-button')).toBeFocused();
			await expect(ribbon.locator('.elemenx-ribbon-panels')).toHaveAttribute('data-tab', 'insert');

			await ribbon.locator('.elemenx-ribbon-tabs-button').press('ArrowDown');
			await page.keyboard.press('Escape');

			await expect(ribbon.locator('.elemenx-ribbon-tabs-list')).toBeHidden();

			await ribbon.locator('.elemenx-ribbon-tabs-button').click();
			await ribbon.getByRole('option', {name: 'Home'}).click();

			await frame.evaluate(function (node) {
				node.style.width = '';
			});

			await expect(ribbon).not.toHaveClass(/tabs-menu/);
			await expect(ribbon.getByRole('tab', {name: 'Home'})).toBeVisible();
			await expect(ribbon.locator('.elemenx-ribbon-panel.active .elemenx-ribbon-group.collapsed')).toHaveCount(0);

			/* Collapsed: the tabs only; a tab opens its panel over the page until a command runs. */
			await ribbon.getByRole('tab', {name: 'Home'}).dblclick();

			await expect(ribbon).toHaveClass(/collapsed/);
			await expect(ribbon.locator('.elemenx-ribbon-panels')).toBeHidden();

			await ribbon.getByRole('tab', {name: 'Insert'}).click();

			await expect(ribbon.locator('.elemenx-ribbon-panels')).toBeVisible();

			await ribbon.getByRole('button', {name: 'Pictures'}).click();

			await expect(note).toContainText('Last: picture');
			await expect(ribbon.locator('.elemenx-ribbon-panels')).toBeHidden();

			await ribbon.getByRole('button', {name: 'Pin the ribbon'}).click();

			await expect(ribbon).not.toHaveClass(/collapsed/);
			await expect(ribbon.locator('.elemenx-ribbon-panels')).toBeVisible();

			await ribbon.getByRole('tab', {name: 'Insert'}).focus();

			await page.keyboard.press('Control+F1');

			await expect(ribbon).toHaveClass(/collapsed/);

			await page.keyboard.press('Control+F1');

			await expect(ribbon).not.toHaveClass(/collapsed/);
		});

		test('ribbon key tips open tabs and run commands from the keyboard, and the backstage opens over the window', async function ({ page }) {
			var ribbon;
			var note;
			var backstage;
			var tips;

			await open(page, origin, ['Ribbon']);

			ribbon = section(page, 'Ribbon').locator('.elemenx-ribbon');
			note = section(page, 'Ribbon').locator('.elemenx-section-header');
			backstage = page.locator('.elemenx-ribbon-backstage');
			tips = ribbon.locator('.elemenx-ribbon-keytip');

			await ribbon.scrollIntoViewIfNeeded();

			await section(page, 'Ribbon').locator('.ui-kit-page').click();

			/* Alt: the tabs, the File button and the quick access commands. */
			await page.keyboard.press('Alt');

			await expect(tips.filter({hasText: /^H$/})).toHaveCount(1);
			await expect(tips.filter({hasText: /^N$/})).toHaveCount(1);
			await expect(tips.filter({hasText: /^F$/})).toHaveCount(1);
			await expect(tips).toHaveCount(8);

			/* A letter opens its tab and shows the letters of its commands; Escape goes back. */
			await page.keyboard.press('n');

			await expect(ribbon.getByRole('tab', {name: 'Insert'})).toHaveAttribute('aria-selected', 'true');
			await expect(tips.filter({hasText: /^H$/})).toHaveCount(0);
			await expect(tips).toHaveCount(7);

			await page.keyboard.press('Escape');

			await expect(tips.filter({hasText: /^H$/})).toHaveCount(1);

			/* Two letters: H opens Home, F narrows to the commands of F (FP, FD), P runs Format painter. */
			await page.keyboard.press('h');

			await expect(tips.filter({hasText: /^X$/})).toHaveCount(1);

			await page.keyboard.press('f');

			await expect(tips.filter({hasText: /^FP$/})).not.toHaveClass(/dim/);
			await expect(tips.filter({hasText: /^X$/})).toHaveClass(/dim/);

			await page.keyboard.press('p');

			await expect(note).toContainText('Last: format-painter');
			await expect(tips).toHaveCount(0);

			await page.keyboard.press('Alt');
			await page.keyboard.press('h');

			await expect(tips.filter({hasText: /^X$/})).toHaveCount(1);

			await page.keyboard.press('x');

			await expect(note).toContainText('Last: cut');

			await page.keyboard.press('Alt');
			await page.keyboard.press('Escape');

			await expect(tips).toHaveCount(0);

			/* The backstage: pages on the side, commands that close it, Escape. */
			await ribbon.getByRole('button', {name: 'File'}).click();

			await expect(backstage).toBeVisible();
			await expect(backstage.getByRole('button', {name: 'Info'})).toHaveAttribute('aria-current', 'page');
			await expect(backstage.getByText('Report.docx · 12 KB')).toBeVisible();

			await backstage.getByRole('button', {name: 'Open'}).click();

			await expect(backstage.getByRole('button', {name: 'Open'})).toHaveAttribute('aria-current', 'page');
			await expect(backstage.locator('.elemenx-ribbon-page[data-id="open"]')).toBeVisible();
			await expect(backstage.locator('.elemenx-ribbon-page[data-id="info"]')).toBeHidden();

			await backstage.getByRole('button', {name: 'Save'}).click();

			await expect(backstage).toBeHidden();
			await expect(note).toContainText('Last: file-save');

			await ribbon.getByRole('button', {name: 'File'}).click();

			await page.keyboard.press('Escape');

			await expect(backstage).toBeHidden();
			await expect(ribbon.getByRole('button', {name: 'File'})).toBeFocused();
		});

		test('emoji picker searches in English and Russian, keeps a skin tone and the emoji used last', async function ({ page }) {
			var pickers;
			var picker;
			var search;
			var note;

			await open(page, origin, ['Emoji and stickers']);

			pickers = section(page, 'Emoji and stickers');
			picker = pickers.locator('.elemenx-emoji').first();
			search = picker.locator('.elemenx-picker-search input');
			note = pickers.locator('.elemenx-section-header');

			await picker.scrollIntoViewIfNeeded();

			await expect(picker.locator('.elemenx-emoji-item[data-char="😀"]')).toBeVisible();
			await expect(picker.getByRole('tab', {name: 'Smileys & emotion'})).toHaveAttribute('aria-selected', 'true');
			expect(await picker.getByRole('tab').count()).toBeGreaterThan(7);

			/* A tab scrolls its group to the top of the list, in a picker inside the page as in a popup. */
			await picker.getByRole('tab', {name: 'Food & drink'}).click();

			await expect(picker.getByRole('tab', {name: 'Food & drink'})).toHaveAttribute('aria-selected', 'true');
			await expect.poll(function () {
				return picker.locator('.elemenx-emoji-group[data-group="food"]').evaluate(function (node) {
					return Math.round(node.getBoundingClientRect().top - node.parentElement.closest('.elemenx-emoji-body').getBoundingClientRect().top);
				});
			}).toBe(0);

			await picker.getByRole('tab', {name: 'Smileys & emotion'}).click();

			await search.fill('cat');

			await expect(picker.locator('.elemenx-emoji-group')).toHaveCount(1);
			await expect(picker.locator('.elemenx-emoji-item[data-char="🐈"]')).toBeVisible();
			await expect(picker.getByRole('tab')).toHaveCount(0);

			await search.fill('кот');

			await expect(picker.locator('.elemenx-emoji-item[data-char="🐱"]')).toBeVisible();

			await search.fill('zzzxq');

			await expect(picker.locator('.elemenx-picker-empty')).toHaveText('No emoji found');

			await search.press('Escape');

			await expect(search).toHaveValue('');
			await expect(picker.locator('.elemenx-emoji-group').first()).toHaveAttribute('data-group', 'smileys');

			await picker.locator('.elemenx-emoji-item[data-char="😀"]').click();

			await expect(note).toContainText('Picked: 😀 Grinning face');
			await expect(picker.locator('.elemenx-emoji-group').first()).toHaveAttribute('data-group', 'recent');
			await expect(picker.locator('.elemenx-emoji-group[data-group="recent"] .elemenx-emoji-item').first()).toHaveAttribute('data-char', '😀');

			/* A skin tone shows on the emoji that take one and goes with the emoji picked. */
			await picker.getByRole('button', {name: 'Skin tone'}).click();

			/* Every tone shows in its sample, though the menu was drawn before the emoji data loaded. */
			await expect(page.getByRole('option', {name: 'No skin tone', exact: true})).toHaveText('✋');
			await expect(page.getByRole('option', {name: 'Medium skin tone', exact: true})).toHaveText('✋🏽');
			await expect(page.getByRole('option', {name: 'Dark skin tone', exact: true})).toHaveText('✋🏿');

			await page.getByRole('option', {name: 'Medium skin tone'}).click();

			await expect(picker.locator('.elemenx-emoji-group[data-group="people"] .elemenx-emoji-item[data-char="👍"]')).toHaveText('👍🏽');
			await expect(picker.locator('.elemenx-emoji-group[data-group="smileys"] .elemenx-emoji-item[data-char="😀"]')).toHaveText('😀');

			await picker.locator('.elemenx-emoji-group[data-group="people"] .elemenx-emoji-item[data-char="👍"]').click();

			await expect(note).toContainText('Picked: 👍🏽 Thumbs up');

			/* Keys: Down from the search, Enter on an emoji. */
			await search.fill('rocket');

			await expect(picker.locator('.elemenx-emoji-group')).toHaveCount(1);

			await search.press('ArrowDown');

			await expect(picker.locator('.elemenx-emoji-item[data-char="🚀"]')).toBeFocused();

			await page.keyboard.press('Enter');

			await expect(note).toContainText('Picked: 🚀 Rocket');

			/* The tone and the emoji used last are remembered. */
			await reload(page);

			await expect(section(page, 'Emoji and stickers')).toBeVisible({timeout: 20000});

			picker = section(page, 'Emoji and stickers').locator('.elemenx-emoji').first();

			await expect(picker.locator('.elemenx-emoji-group[data-group="recent"] .elemenx-emoji-item')).toHaveText(['🚀', '👍🏽', '😀']);
		});

		test('sticker picker shows the packs, stars favorites and remembers the stickers sent', async function ({ page }) {
			var pickers;
			var stickers;
			var note;

			await open(page, origin, ['Emoji and stickers']);

			pickers = section(page, 'Emoji and stickers');
			stickers = pickers.locator('.elemenx-stickers');
			note = pickers.locator('.elemenx-section-header');

			await stickers.scrollIntoViewIfNeeded();

			await expect(stickers.getByRole('tab', {name: 'Elemenx pals'})).toHaveAttribute('aria-selected', 'true');
			await expect(stickers.locator('.elemenx-sticker')).toHaveCount(8);
			expect(await stickers.getByRole('option', {name: 'Party'}).locator('img').evaluate(function (node) {
				return node.complete && node.naturalWidth;
			})).toBe(128);

			await stickers.getByRole('option', {name: 'Party'}).click();

			await expect(note).toContainText('Picked: sticker Party');
			await expect(pickers.locator('.ui-kit-picked-sticker')).toHaveAttribute('src', '/data/stickers/party.svg');

			await stickers.getByRole('tab', {name: 'Recently sent'}).click();

			await expect(stickers.locator('.elemenx-sticker')).toHaveCount(1);

			await stickers.getByRole('tab', {name: 'Favorites'}).click();

			await expect(stickers.locator('.elemenx-picker-empty')).toHaveText('Star a sticker to keep it here');

			await stickers.getByRole('tab', {name: 'Elemenx pals'}).click();
			await stickers.getByRole('option', {name: 'Love'}).hover();
			await stickers.locator('.elemenx-sticker', {has: page.getByRole('option', {name: 'Love'})}).getByRole('button', {name: 'Add to favorites'}).click();
			await stickers.getByRole('tab', {name: 'Favorites'}).click();

			await expect(stickers.locator('.elemenx-sticker')).toHaveCount(1);
			await expect(stickers.getByRole('button', {name: 'Remove from favorites'})).toHaveAttribute('aria-pressed', 'true');

			await stickers.locator('.elemenx-picker-search input').fill('кофе');

			await expect(stickers.locator('.elemenx-sticker')).toHaveCount(1);
			await expect(stickers.getByRole('option', {name: 'Coffee'})).toBeVisible();
		});

		test('chat composer puts emoji at the caret and sends stickers; messages take reactions', async function ({ page }) {
			var chat;
			var composer;
			var field;
			var popup;
			var mine;
			var box;
			var area;

			await open(page, origin, ['Chat']);

			chat = section(page, 'Chat');
			composer = chat.locator('.elemenx-chat-composer');
			field = composer.locator('textarea');
			popup = composer.locator('.elemenx-chat-picker');
			mine = chat.locator('.elemenx-chat-message.own').last();

			await composer.scrollIntoViewIfNeeded();

			await field.fill('Hello world');
			await field.press('Home');

			for (var step = 0; step < 5; step++)
				await field.press('ArrowRight');

			await composer.getByRole('button', {name: 'Emoji and stickers'}).click();

			await expect(popup.locator('.elemenx-emoji-item[data-char="😀"]')).toBeVisible();

			/* The picker opens above its button, at its full size, its right side at the right side of the button. */
			box = await popup.boundingBox();
			area = await composer.getByRole('button', {name: 'Emoji and stickers'}).boundingBox();

			expect(box.y + box.height).toBeLessThanOrEqual(area.y);
			expect(Math.abs(box.x + box.width - (area.x + area.width))).toBeLessThan(2);
			expect(box.height).toBeGreaterThan(300);

			await popup.locator('.elemenx-picker-search input').fill('waving');
			await popup.locator('.elemenx-emoji-item[data-char="👋"]').click();

			await expect(field).toHaveValue('Hello👋 world');
			await expect(popup).toBeHidden();
			await expect(field).toBeFocused();

			await composer.getByRole('button', {name: 'Emoji and stickers'}).click();
			await popup.getByRole('tab', {name: 'Stickers'}).click();
			await popup.getByRole('option', {name: 'Rocket'}).click();

			await expect(mine.locator('img.elemenx-chat-sticker')).toHaveAttribute('src', '/data/stickers/rocket.svg');
			await expect(mine.locator('.elemenx-chat-bubble')).toHaveClass(/sticker/);

			/* Reactions: take one back, add to another, add a new one with the picker of the message. */
			mine = chat.locator('.elemenx-chat-message.own', {hasText: 'Looks good'});

			await mine.getByRole('button', {name: '👍 1'}).click();

			await expect(mine.locator('.elemenx-chat-reaction')).toHaveCount(1);

			await mine.getByRole('button', {name: '🎉 2'}).click();

			await expect(mine.getByRole('button', {name: '🎉 3'})).toHaveAttribute('aria-pressed', 'true');

			await mine.hover();
			await mine.getByRole('button', {name: 'Add a reaction'}).click();
			await mine.locator('.elemenx-chat-react-picker .elemenx-picker-search input').fill('fire');
			await mine.locator('.elemenx-chat-react-picker .elemenx-emoji-item[data-char="🔥"]').click();

			await expect(mine.getByRole('button', {name: '🔥 1'})).toHaveAttribute('aria-pressed', 'true');
			await expect(mine.locator('.elemenx-chat-react-picker')).toBeHidden();
		});

		test('chat composer suggests emoji for a word and for :word, the stickers of a message of one emoji, and keeps to its setting', async function ({ page }) {
			var errors = captureErrors(page);
			var chat;
			var composer;
			var field;
			var hints;

			await open(page, origin, ['Chat']);

			chat = section(page, 'Chat');
			composer = chat.locator('.elemenx-chat-composer');
			field = composer.locator('textarea');
			hints = composer.locator('.elemenx-chat-hints');

			await composer.scrollIntoViewIfNeeded();

			/* A word at the caret offers its emoji; a pressed one takes the place of the word. */
			await field.click();

			await page.keyboard.type('I need coffee');

			await expect(hints.getByRole('option', {name: /hot beverage/i})).toBeVisible();
			await expect(field).not.toHaveAttribute('aria-activedescendant', /./);

			await hints.getByRole('option', {name: /hot beverage/i}).click();

			await expect(field).toHaveValue('I need ☕');
			await expect(field).toBeFocused();

			/* A word of two letters offers its emoji too, as :word does. */
			await field.fill('');

			await page.keyboard.type('Fine, ok');

			await expect(hints.getByRole('option', {name: /OK hand/i})).toBeVisible();

			/* :word is chosen by the keys; Escape hides the suggestions until the text changes. */
			await field.fill('');

			await page.keyboard.type('Sure :rock');

			await expect(hints.getByRole('option').first()).toBeVisible();
			await expect(field).toHaveAttribute('aria-activedescendant', /-0$/);

			await page.keyboard.press('Escape');

			await expect(hints).toHaveCount(0);

			await page.keyboard.type('et');

			await expect(hints.getByRole('option', {name: /rocket/i})).toBeVisible();

			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('ArrowUp');
			await page.keyboard.press('Enter');

			await expect(field).toHaveValue('Sure 🚀');

			/* A message of one emoji offers its stickers; a pressed one is sent in place of the message. */
			await field.fill('');

			await page.keyboard.type(':thumbs');

			await expect(hints.getByRole('option', {name: /thumbs up/i}).first()).toBeVisible();

			await page.keyboard.press('Enter');

			await expect(field).toHaveValue('👍');
			await expect(hints.locator('.elemenx-chat-hint.sticker')).toHaveCount(1);
			await expect(hints.getByRole('option', {name: 'Thumbs up'})).toBeVisible();

			await hints.getByRole('option', {name: 'Thumbs up'}).click();

			await expect(field).toHaveValue('');
			await expect(hints).toHaveCount(0);
			await expect(chat.locator('.elemenx-chat-message.own').last().locator('img')).toHaveAttribute('src', /thumbs-up\.svg$/);

			/* After : only :word; Never offers no emoji, but still the stickers of an emoji. */
			await chat.getByText('After :', {exact: true}).click();
			await field.click();

			await page.keyboard.type('more coffee');

			await expect(hints).toHaveCount(0);

			await page.keyboard.type(' :coffee');

			await expect(hints.getByRole('option', {name: /hot beverage/i})).toBeVisible();

			await chat.getByText('Never', {exact: true}).click();

			await field.fill('');

			await page.keyboard.type(':coffee');

			await expect(hints).toHaveCount(0);

			await field.fill('');

			await page.keyboard.type('🚀');

			await expect(hints.getByRole('option', {name: 'Rocket'})).toBeVisible();
			expect(errors).toEqual([]);
		});

		test('cards: posts, people and comments count what the reader does, comments keep their text as text', async function ({ page }) {
			var cards;
			var note;
			var post;
			var profile;
			var comment;
			var box;

			await open(page, origin, ['Cards']);

			cards = section(page, 'Cards');
			note = cards.locator('.elemenx-section-header');
			post = cards.locator('.elemenx-post', {hasText: 'Ten passes through the Caucasus'});
			profile = cards.locator('.elemenx-profile.card', {hasText: 'Ada Lovelace'});
			comment = cards.locator('.elemenx-comment', {hasText: 'cards are in'});

			await post.scrollIntoViewIfNeeded();

			/* A post: the date badge, the link over the whole card, likes that count. */
			await expect(post.locator('.elemenx-card-date strong')).toHaveText('2');
			await expect(post.locator('.elemenx-card-media .elemenx-post-category')).toHaveText('Travel');
			await expect(post.locator('a.elemenx-card-link')).toHaveAttribute('href', '#ui-kit-post');

			await post.getByRole('button', {name: 'Like (1240)'}).click();

			await expect(note).toContainText('Last: liked · 1241');
			await expect(post.getByRole('button', {name: 'Like (1241)'})).toHaveAttribute('aria-pressed', 'true');

			await post.getByRole('button', {name: 'Like (1241)'}).click();

			await expect(note).toContainText('Last: unliked · 1240');
			await expect(page).not.toHaveURL(/#ui-kit-post$/);

			/* The link covers the card: a press on its title follows it. */
			box = await post.getByRole('heading', {name: 'Ten passes through the Caucasus'}).boundingBox();

			await page.mouse.click(box.x + 10, box.y + box.height / 2);

			await expect(page).toHaveURL(/#ui-kit-post$/);

			/* A person: the stats shortened, follow and message. */
			await expect(profile.locator('.elemenx-profile-stat dt')).toHaveText(['Posts', 'Followers', 'Following']);
			/* Its Avatar: the presence of the person on its corner. */
			await expect(profile.locator('.elemenx-profile-avatar .elemenx-avatar-status .elemenx-presence')).toHaveClass(/online/);

			await profile.getByRole('button', {name: 'Follow'}).click();

			await expect(note).toContainText('Last: following');
			await expect(profile.getByRole('button', {name: 'Following'})).toBeVisible();

			await profile.getByRole('button', {name: 'Message'}).click();

			await expect(note).toContainText('Last: message to Ada Lovelace');

			/* A comment: mentions and tags are buttons, links are links, nothing is markup. */
			await expect(comment.locator('.elemenx-comment-token')).toHaveText(['#ElemenxUI', '@ada', 'example.com/elemenx/cards']);
			await expect(comment.locator('a.elemenx-comment-token')).toHaveAttribute('href', 'https://example.com/elemenx/cards');
			await expect(comment.locator('a.elemenx-comment-token')).toHaveAttribute('rel', 'noopener noreferrer');
			await expect(comment.locator('.elemenx-comment-time')).toHaveText(/5/);
			await expect(comment.locator('.elemenx-comment-line')).toBeVisible();

			await comment.getByRole('button', {name: '@ada'}).click();

			await expect(note).toContainText('Last: mention @ada');

			await comment.getByRole('button', {name: '#ElemenxUI'}).click();

			await expect(note).toContainText('Last: tag #ElemenxUI');

			await comment.getByRole('button', {name: 'Repost (12)'}).click();

			await expect(note).toContainText('Last: reposted · 13');
		});

		test('cards: products take a color, a size and the cart; plans are chosen as radios, by the month or the year', async function ({ page }) {
			var cards;
			var note;
			var headphones;
			var shoes;
			var plans;
			var standard;

			await open(page, origin, ['Cards']);

			cards = section(page, 'Cards');
			note = cards.locator('.elemenx-section-header');
			headphones = cards.locator('.elemenx-product', {hasText: 'Studio headphones'});
			shoes = cards.locator('.elemenx-product', {hasText: 'Running shoes'});
			plans = cards.locator('.elemenx-plans');
			standard = plans.getByRole('radio', {name: 'Standard'});

			await headphones.scrollIntoViewIfNeeded();

			await expect(headphones.locator('.elemenx-product-price s')).toBeVisible();
			await expect(headphones.locator('.elemenx-product-badge')).toHaveText('−20%');
			await expect(headphones.locator('img').first()).toHaveAttribute('src', '/data/cards/headphones.svg');

			await headphones.getByRole('tab', {name: 'Image 2'}).click();

			await expect(headphones.locator('img').first()).toHaveAttribute('src', '/data/cards/watch.svg');

			await headphones.getByRole('radio', {name: 'Sky'}).click();

			await expect(note).toContainText('Last: color sky');

			await headphones.getByRole('button', {name: 'Add to cart'}).click();

			await expect(note).toContainText('Last: added to the cart · sky');
			await expect(headphones.getByRole('button', {name: 'In the cart'})).toBeVisible();

			await shoes.getByRole('radio', {name: '43'}).click();

			await expect(note).toContainText('Last: size 43');

			await headphones.getByRole('button', {name: 'Favorite'}).click();

			await expect(note).toContainText('Last: favorite');
			await expect(cards.locator('.elemenx-product', {hasText: 'City backpack'}).locator('.elemenx-product-corner')).toBeVisible();

			/* Plans: the current one cannot be chosen; the arrows move the choice; the year changes the prices. */
			await plans.scrollIntoViewIfNeeded();

			await expect(standard).toHaveAttribute('aria-checked', 'true');
			await expect(plans.getByRole('radio', {name: 'Basic'}).getByRole('button', {name: 'Current plan'})).toBeDisabled();
			await expect(standard.locator('.elemenx-plan-price strong')).toContainText('12');

			await standard.focus();

			await page.keyboard.press('ArrowRight');

			await expect(plans.getByRole('radio', {name: 'Premium'})).toHaveAttribute('aria-checked', 'true');
			await expect(plans.getByRole('radio', {name: 'Premium'})).toBeFocused();
			await expect(note).toContainText('Last: plan team · month');

			await plans.locator('.elemenx-check-label', {hasText: /^Yearly$/}).click();

			await expect(standard.locator('.elemenx-plan-price strong')).toContainText('115');
			await expect(standard.locator('.elemenx-plan-price span')).toHaveText('/ year');

			await standard.click({position: {x: 20, y: 140}});

			await expect(note).toContainText('Last: plan pro · year');
		});

		test('phone input keeps to its mask and picks the country of a pasted number', async function ({ page }) {
			var phone;
			var input;

			await open(page, origin, ['Forms', 'Payment, phone and money']);

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

			await search(page, phone, 'serb');

			await page.keyboard.press('Enter');

			await expect(phone.locator('.elemenx-phone-country')).toContainText('RS');
			await expect(input).toHaveValue('+381 20 794 6095');
		});

		test('card inputs format, detect the brand and validate', async function ({ page }) {
			var card;
			var expiry;
			var saved;

			await open(page, origin, ['Payment, phone and money', 'Overlays']);

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

			/* The saved card is Guarded: the number shows once the page allows it. */
			await expect(saved.locator('.elemenx-card-conceal')).toHaveCount(1);

			await page.locator('.elemenx-toast', {hasText: 'card number'}).getByRole('button', {name: 'Use fingerprint'}).click();

			await expect(saved.locator('.elemenx-card-conceal')).toHaveCount(0);
			await expect(saved.locator('input')).not.toHaveClass(/concealed/);
			await expect(saved.getByRole('button', {name: 'Hide number'})).toHaveAttribute('aria-pressed', 'true');

			await saved.getByRole('button', {name: 'Hide number'}).click();

			await expect(saved.locator('.elemenx-card-conceal')).toHaveText('5555 •••• •••• 4444');
		});

		test('text formats keep their characters, normalize the value and show what is wrong', async function ({ page }) {
			var email;
			var iban;
			var quantity;
			var postal;

			await open(page, origin, ['Inputs']);

			email = field(page, 'Email address');
			iban = field(page, 'IBAN');
			quantity = field(page, 'Quantity');
			postal = field(page, 'Moldovan postal code');

			await email.scrollIntoViewIfNeeded();

			await expect(email.locator('input')).toHaveAttribute('type', 'email');
			await expect(email.locator('input')).toHaveAttribute('inputmode', 'email');
			await expect(email.locator('input')).toHaveAttribute('autocomplete', 'email');
			await expect(email.locator('input')).toHaveAttribute('spellcheck', 'false');

			/* Wrong on commit: the field looks invalid and the Field shows the message; right again as soon as it is typed. */
			await email.locator('input').fill('ada@example');
			await email.locator('input').press('Tab');

			await expect(email.locator('.elemenx-input')).toHaveClass(/invalid/);
			await expect(email.locator('.elemenx-field-error')).toHaveText('Enter an email address, like name@example.com');

			await email.locator('input').focus();

			await page.keyboard.type('.COM');

			await expect(email.locator('.elemenx-input')).not.toHaveClass(/invalid/);
			await expect(email.locator('.elemenx-field-error')).toHaveCount(0);

			await email.locator('input').press('Tab');

			await expect(email.locator('input')).toHaveValue('ada@example.com');
			await expect(email.locator('.elemenx-caption')).toHaveText('Value: ada@example.com');

			/* The characters a format cannot hold do not get in. */
			await quantity.locator('input').pressSequentially('4x2');

			await expect(quantity.locator('input')).toHaveValue('42');

			await quantity.locator('input').fill('120');
			await quantity.locator('input').press('Tab');

			await expect(quantity.locator('.elemenx-field-error')).toHaveText('Enter 100 or less');

			/* An IBAN: upper case, its check digits, groups of four in the field and none in the value. */
			await iban.locator('input').fill('de89370400440532013000');
			await iban.locator('input').press('Tab');

			await expect(iban.locator('input')).toHaveValue('DE89 3704 0044 0532 0130 00');
			await expect(iban.locator('.elemenx-caption')).toHaveText('Value: DE89370400440532013000');
			await expect(iban.locator('.elemenx-field-error')).toHaveCount(0);

			await postal.locator('input').fill('2001');
			await postal.locator('input').press('Tab');

			await expect(postal.locator('.elemenx-field-error')).toHaveCount(0);

			await postal.locator('input').fill('20011');
			await postal.locator('input').press('Tab');

			await expect(postal.locator('.elemenx-field-error')).toHaveText('Enter a postal code of MD');
		});

		test('number input steps inside its bounds', async function ({ page }) {
			var amount;

			await open(page, origin, ['Inputs']);

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

			await open(page, origin, ['Selection']);

			language = field(page, 'Language');

			await language.locator('.elemenx-select-trigger').click();

			await expect(language.locator('.elemenx-popup')).toBeVisible();

			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');

			await expect(language.locator('.elemenx-select-value')).toHaveText('CSS');
			await expect(language.locator('.elemenx-popup')).toBeHidden();

			await language.locator('.elemenx-select-trigger').click();

			await search(page, language, 'kot');

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

		test('chat messages: a tap opens the menu, a long press starts a choice of several, the bar counts and deletes them', async function ({ page }) {
			var errors = captureErrors(page);
			var chat;
			var messages;
			var bar;
			var count;
			var touch;

			/*
			 * A press of a finger on the bubble of a message: down, up, and the click that follows. A tap is all of it at once in
			 * the page; a long press (held, a locator) stays down until held shows. The time is the one of the page: a press held
			 * for a time of the test ended before its timer under load, and a tap became a long press (regression).
			 */
			touch = async function (message, held) {
				var bubble = message.locator('.elemenx-chat-bubble');
				var box = await bubble.boundingBox();
				var point = {pointerType: 'touch', isPrimary: true, button: 0, pointerId: 7, clientX: box.x + 12, clientY: box.y + box.height / 2};

				await bubble.evaluate(function (node, detail) {
					node.dispatchEvent(new PointerEvent('pointerdown', Object.assign({bubbles: true, cancelable: true}, detail.Point)));

					if (detail.Long) return;

					node.dispatchEvent(new PointerEvent('pointerup', Object.assign({bubbles: true, cancelable: true}, detail.Point)));
					node.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, clientX: detail.Point.clientX, clientY: detail.Point.clientY, button: 0}));
				}, {Point: point, Long: !!held});

				if (!held) return;

				await expect(held).toBeVisible();

				await bubble.dispatchEvent('pointerup', point);
				await bubble.dispatchEvent('click', {clientX: point.clientX, clientY: point.clientY, button: 0});
			};

			await open(page, origin, ['Chat']);

			chat = section(page, 'Chat');
			messages = chat.locator('.elemenx-chat-message');
			bar = chat.locator('.elemenx-chat-selection');

			await messages.first().scrollIntoViewIfNeeded();

			count = await messages.count();

			/* A tap opens the menu of the message at the finger. */
			await touch(messages.nth(0));

			await expect(chat.getByRole('menuitem', {name: 'Reply'}).first()).toBeVisible();
			await expect(bar).toBeHidden();

			/* Escape closes the menu that has the focus: the key waits for the focus in it (regression: a busy page took the key before). */
			await expect.poll(function () {
				return page.evaluate(function () {
					return !!document.activeElement.closest('.elemenx-popup');
				});
			}).toBe(true);

			/* The menu may listen a moment after it has the focus: the key again while it is open. */
			await expect(async function () {
				if (await chat.getByRole('menuitem', {name: 'Reply'}).count())
					await page.keyboard.press('Escape');

				await expect(chat.getByRole('menuitem', {name: 'Reply'})).toHaveCount(0, {timeout: 2000});
			}).toPass({timeout: 30000});

			/* A long press chooses the message: the bar takes the place of the header, every message shows its check. */
			await touch(messages.nth(0), bar);

			await expect(bar).toContainText('1 selected');
			await expect(chat.locator('.elemenx-chat-header')).toBeHidden();
			await expect(messages.nth(0)).toHaveClass(/selected/);
			await expect(messages.nth(0).getByRole('checkbox', {name: 'Select message'})).toHaveAttribute('aria-checked', 'true');
			await expect(messages.nth(1).getByRole('checkbox', {name: 'Select message'})).toHaveAttribute('aria-checked', 'false');
			await expect(chat.getByRole('menuitem', {name: 'Reply'})).toHaveCount(0);

			/* While choosing, a click turns the choice of a message, and so does its check. */
			await messages.nth(1).locator('.elemenx-chat-bubble').click();

			await expect(bar).toContainText('2 selected');

			await messages.nth(0).getByRole('checkbox').click();

			await expect(bar).toContainText('1 selected');
			await expect(messages.nth(0)).not.toHaveClass(/selected/);

			/* Escape lets the choice go. */
			await messages.nth(1).getByRole('checkbox').focus();

			await page.keyboard.press('Escape');

			await expect(bar).toBeHidden();
			await expect(chat.locator('.elemenx-chat-header')).toBeVisible();
			await expect(chat.getByRole('checkbox', {name: 'Select message'})).toHaveCount(0);

			/* With a mouse: Shift and a click start a choice, and the item Select of the menu adds to it. */
			await messages.nth(0).locator('.elemenx-chat-bubble').click({modifiers: ['Shift']});

			await expect(bar).toContainText('1 selected');

			await messages.nth(2).locator('.elemenx-chat-bubble').click({button: 'right'});
			await chat.getByRole('menuitem', {name: 'Select'}).click();

			await expect(bar).toContainText('2 selected');

			/* The actions of the bar act on the chosen messages. */
			await bar.getByRole('button', {name: 'Delete selected'}).click();

			await expect(bar).toBeHidden();
			await expect(messages).toHaveCount(count - 2);
			await expect(chat.locator('.elemenx-section-header')).toContainText('Deleted 2 messages');

			expect(errors).toEqual([]);
		});

		test('a workspace places its tool windows by their buttons on the stripes; in Customize they are dragged to another side, and the layout is kept', async function ({ page }) {
			var errors = captureErrors(page);
			var frame;
			var commits;
			var right;
			var from;
			var to;

			await open(page, origin, ['Workspace']);

			await page.evaluate(function () {
				localStorage.removeItem('elemenx-workspace:ui-kit-tools');
			});

			frame = page.locator('.ui-kit-tools-frame .elemenx-workspace');

			await frame.scrollIntoViewIfNeeded();

			/* Project is open at first; the buttons carry the badges of their tool windows. */
			await expect(frame.locator('.elemenx-workspace-panel.left .elemenx-workspace-tool-window-title')).toHaveText('Project');
			await expect(frame.getByRole('button', {name: 'Commits'}).locator('.elemenx-badge.overlay')).toHaveText('3');
			await expect(frame.getByRole('button', {name: 'Problems'}).locator('.elemenx-badge.overlay')).toHaveClass(/dot/);
			await expect(frame.getByRole('button', {name: 'Build'}).locator('.elemenx-badge.overlay')).toHaveClass(/busy/);

			/* A button opens its tool window in its area (one at a time), again closes it; the close button of the window too. */
			await frame.getByRole('button', {name: 'Commits'}).click();

			await expect(frame.locator('.elemenx-workspace-panel.left .elemenx-workspace-tool-window-title')).toHaveText('Commits');
			await expect(frame.getByRole('button', {name: 'Commits'})).toHaveAttribute('aria-pressed', 'true');

			await frame.getByRole('button', {name: 'Problems'}).click();

			await expect(frame.locator('.elemenx-workspace-panel.bottom .elemenx-workspace-tool-window-title')).toHaveText('Problems');

			await frame.locator('.elemenx-workspace-panel.bottom .elemenx-workspace-tool-window').getByRole('button', {name: 'Hide'}).click();

			await expect(frame.locator('.elemenx-workspace-panel.bottom')).toBeHidden();

			/* Customize: the button of Commits dragged onto the right stripe takes its open tool window there. */
			await page.getByText('Customize the layout').click();

			await expect(frame).toHaveClass(/customizing/);

			commits = frame.getByRole('button', {name: 'Commits'});
			right = frame.locator('.elemenx-workspace-dock[data-area="right"]');
			from = await commits.boundingBox();
			to = await right.boundingBox();

			await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
			await page.mouse.down();
			await page.mouse.move(to.x + to.width / 2, to.y + to.height - 4, {steps: 8});
			await page.mouse.up();

			await expect(right.getByRole('button', {name: 'Commits'})).toHaveCount(1);
			await expect(frame.locator('.elemenx-workspace-panel.right .elemenx-workspace-tool-window-title')).toHaveText('Commits');
			await expect(page.getByText(/Layout: .*"commits":"right"/)).toBeVisible();

			/* Kept: the next visit finds Commits on the right. */
			await page.reload();

			await ready(page, page.url().indexOf('sections=') === -1);

			await frame.scrollIntoViewIfNeeded();

			await expect(frame.locator('.elemenx-workspace-dock[data-area="right"]').getByRole('button', {name: 'Commits'})).toHaveCount(1);
			await expect(frame.locator('.elemenx-workspace-panel.right .elemenx-workspace-tool-window-title')).toHaveText('Commits');

			await page.evaluate(function () {
				localStorage.removeItem('elemenx-workspace:ui-kit-tools');
			});

			expect(errors).toEqual([]);
		});

		test('the buttons of a pad are drawn as on the pad of its kind: Xbox colors, PlayStation symbols, Nintendo letters, the places of a generic pad', async function ({ page }) {
			var errors = captureErrors(page);
			var pads;

			await open(page, origin, ['Game UI']);

			pads = page.locator('.ui-kit-pads');

			await pads.scrollIntoViewIfNeeded();

			expect(await pads.evaluate(function (node) {
				var rows = node.querySelectorAll('.ui-kit-pad');

				function glyph (row, button) {
					return rows[row].querySelector('.elemenx-game-key.button-' + button + ' .elemenx-game-key-glyph');
				}

				function token (name) {
					var probe = document.createElement('i');
					var color;

					probe.style.color = 'var(' + name + ')';

					node.appendChild(probe);

					color = getComputedStyle(probe).color;

					probe.remove();

					return color;
				}

				return [
					glyph(0, 'a').textContent, getComputedStyle(glyph(0, 'a')).backgroundColor === token('--elemenx-gamepad-green'), getComputedStyle(glyph(0, 'b')).backgroundColor === token('--elemenx-gamepad-red'),
					glyph(1, 'a').textContent, getComputedStyle(glyph(1, 'a')).color === token('--elemenx-gamepad-blue'), glyph(1, 'y').textContent,
					glyph(2, 'a').textContent, glyph(2, 'lt').textContent, glyph(2, 'start').textContent,
					getComputedStyle(glyph(3, 'a')).color, getComputedStyle(glyph(3, 'a'), '::before').maskImage.indexOf('svg') !== -1,
					getComputedStyle(glyph(0, 'up'), '::before').maskImage.indexOf('svg') !== -1, glyph(0, 'up').textContent,
					getComputedStyle(glyph(0, 'ls')).boxShadow.indexOf('inset') !== -1
				];
			})).toEqual(['A', true, true, '✕', true, '△', 'B', 'ZL', '+', 'rgba(0, 0, 0, 0)', true, true, '↑', true]);

			expect(errors).toEqual([]);
		});

		test('Mod+F finds and Mod+H replaces in the editors, Mod+F finds in a terminal; viewers show Markdown and code, formulas are drawn as MathML', async function ({ page }) {
			var errors = captureErrors(page);
			var code;
			var rich;
			var terminal;
			var bar;
			var viewers;
			var place;

			await open(page, origin, ['Code editor', 'Rich text editor', 'Terminal', 'Viewers and formulas']);

			/* The code editor: its own bar, the place of the match, the next one, a replacement, Escape back into the text. */
			code = section(page, 'Code editor').locator('.elemenx-code-editor').first();

			await code.scrollIntoViewIfNeeded();
			await code.locator('textarea').click();

			await expect(code.locator('textarea')).toBeFocused();

			bar = code.locator('.elemenx-find');

			/* Mod+R (Mod+H too, below) opens the replace row: in the editor it does not reload the page. */
			await page.evaluate(function () {
				window.stillHere = true;
			});

			await hotkey(page, code.locator('textarea'), 'ControlOrMeta+r', bar);

			expect(await page.evaluate(function () {
				return window.stillHere === true;
			})).toBe(true);
			await expect(bar.locator('.elemenx-find-replacement')).toBeVisible();

			await expect(bar.locator('.elemenx-find-query')).toBeFocused();

			await page.keyboard.type('this');

			await expect(bar.locator('.elemenx-find-count')).toHaveText(/^\d of [2-9]$/);
			await expect(bar.locator('.elemenx-find-query')).toBeFocused();

			place = Number((await bar.locator('.elemenx-find-count').textContent()).split(' ')[0]);

			await page.keyboard.press('Enter');

			await expect(bar.locator('.elemenx-find-count')).not.toHaveText(new RegExp('^' + place + ' of'));

			await bar.locator('.elemenx-find-replacement').fill('self');
			await bar.getByRole('button', {name: 'Replace all'}).click();

			await expect(bar.locator('.elemenx-find-count')).toHaveText('No results');
			expect(await code.locator('textarea').inputValue()).toContain('self.Count');

			await page.keyboard.press('Escape');

			await expect(bar).toHaveCount(0);
			await expect(code.locator('textarea')).toBeFocused();

			/* The rich editor: the matches marked by highlights of the browser, a replacement that undo takes back. */
			rich = section(page, 'Rich text editor').locator('.elemenx-rich-editor').first();

			await rich.scrollIntoViewIfNeeded();
			await rich.locator('.elemenx-rich-editor-content p').first().click();

			await expect(rich.locator('.elemenx-rich-editor-content')).toBeFocused();

			bar = rich.locator('.elemenx-find');

			await hotkey(page, rich.locator('.elemenx-rich-editor-content'), 'ControlOrMeta+h', bar);

			await expect(bar.locator('.elemenx-find-query')).toBeFocused();

			await page.keyboard.type('editor');

			await expect(bar.locator('.elemenx-find-count')).toHaveText(/ of /);
			expect(await page.evaluate(function () {
				return CSS.highlights.get('elemenx-find').size > 0 && CSS.highlights.get('elemenx-find-current').size === 1;
			})).toBe(true);

			await bar.locator('.elemenx-find-replacement').fill('writer');
			await bar.getByRole('button', {name: 'Replace', exact: true}).click();

			await expect(rich.locator('.elemenx-rich-editor-content')).toContainText('writer');

			await bar.getByRole('button', {name: 'Close'}).click();

			expect(await page.evaluate(function () {
				return CSS.highlights.get('elemenx-find').size;
			})).toBe(0);

			/* The terminal: its output, from the newest line. */
			terminal = section(page, 'Terminal').locator('.elemenx-terminal');

			await terminal.scrollIntoViewIfNeeded();
			await terminal.locator('.elemenx-terminal-input').click();

			await expect(terminal.locator('.elemenx-terminal-input')).toBeFocused();

			await hotkey(page, terminal.locator('.elemenx-terminal-input'), 'ControlOrMeta+f', terminal.locator('.elemenx-find'));

			await expect(terminal.locator('.elemenx-find-query')).toBeFocused();

			await page.keyboard.type('help');

			await expect(terminal.locator('.elemenx-find-count')).toHaveText('1 of 1');
			await expect(terminal.locator('.elemenx-find').getByRole('button', {name: 'Replace all'})).toHaveCount(0);

			await page.keyboard.press('Escape');

			await expect(terminal.locator('.elemenx-terminal-input')).toBeFocused();

			/* The viewers: Markdown with its code highlighted, code with numbers and marked lines, formulas in MathML. */
			viewers = section(page, 'Viewers and formulas');

			await viewers.scrollIntoViewIfNeeded();

			await expect(viewers.locator('.elemenx-markdown[aria-label="Release notes"] h2')).toHaveText('Elemenx 0.9');
			await expect(viewers.locator('.elemenx-markdown[aria-label="Release notes"] table tr')).toHaveCount(3);
			await expect(viewers.locator('.elemenx-markdown[aria-label="Release notes"] pre[data-language="js"] .elemenx-syntax-string').first()).toBeVisible();
			await expect(viewers.locator('.elemenx-code-view[aria-label="An example"] .elemenx-code-view-line')).toHaveCount(6);
			await expect(viewers.locator('.elemenx-code-view[aria-label="An example"] .elemenx-code-view-line.marked')).toHaveCount(2);
			await expect(viewers.locator('.elemenx-code-view[aria-label="An example"] .elemenx-code-view-line').first()).toHaveAttribute('data-line', '10');
			await expect(viewers.locator('.elemenx-formula math')).toHaveCount(5);
			await expect(viewers.locator('.elemenx-formula math mfrac').first()).toBeVisible();
			await expect(viewers.locator('.elemenx-formula merror')).toHaveCount(0);
			await expect(viewers.locator('.elemenx-formula.display').first()).toHaveAttribute('aria-label', /frac/);

			expect(errors).toEqual([]);
		});

		test('a Markdown document takes the classes of the interface with Look interface, and the look of a RichEditor by default', async function ({ page }) {
			var errors = captureErrors(page);
			var viewers;
			var plain;
			var styled;

			await open(page, origin, ['Viewers and formulas']);

			viewers = section(page, 'Viewers and formulas');
			plain = viewers.locator('.elemenx-markdown[aria-label="Release notes"]');
			styled = viewers.locator('.elemenx-markdown[aria-label="Release notes in the interface"]');

			await styled.scrollIntoViewIfNeeded();

			await expect(plain).toHaveClass(/elemenx-document/);
			await expect(plain.locator('table')).not.toHaveClass(/elemenx-table/);

			await expect(styled).toHaveClass(/interface/);
			await expect(styled).not.toHaveClass(/elemenx-document/);
			await expect(styled.locator('table')).toHaveClass('elemenx-table');
			await expect(styled.locator('ul').first()).toHaveClass('elemenx-ul');
			await expect(styled.locator('pre').first()).toHaveClass('elemenx-code');
			await expect(styled.locator('pre[data-language="js"] .elemenx-syntax-string').first()).toBeVisible();

			expect(errors).toEqual([]);
		});

		test('a code view folds the elements of HTML by their tags, but not the void ones nor the ones that close themselves', async function ({ page }) {
			var errors = captureErrors(page);
			var view;

			await open(page, origin, ['Viewers and formulas']);

			view = section(page, 'Viewers and formulas').locator('.elemenx-code-view[aria-label="A page"]');

			await view.scrollIntoViewIfNeeded();

			/* Two blocks: the section and the list; <img>, <br> and <Button /> open none. */
			await expect(view.locator('.elemenx-code-view-fold')).toHaveCount(2);
			await expect(view.locator('[data-line="1"]')).toHaveAttribute('data-end', '10');
			await expect(view.locator('[data-line="3"]')).toHaveAttribute('data-end', '6');

			await view.locator('[data-line="3"] .elemenx-code-view-fold').click();

			await expect(view.locator('[data-line="3"]')).toHaveText(/<ul>\s*…\s*<\/ul>$/);
			await expect(view.locator('[data-line="4"]')).toBeHidden();
			await expect(view.locator('[data-line="6"]')).toBeHidden();
			await expect(view.locator('[data-line="7"]')).toBeVisible();

			await view.locator('[data-line="1"] .elemenx-code-view-fold').click();

			await expect(view.locator('[data-line="1"]')).toHaveText(/<section class="card">\s*…\s*<\/section>$/);
			await expect(view.locator('.elemenx-code-view-line:visible')).toHaveCount(1);

			expect(errors).toEqual([]);
		});

		test('a code view folds the blocks of its brackets, and its copy button answers the pointer', async function ({ page }) {
			var errors = captureErrors(page);
			var view;
			var copy;
			var before;

			await open(page, origin, ['Viewers and formulas']);

			view = section(page, 'Viewers and formulas').locator('.elemenx-code-view[aria-label="A package"]');

			await view.scrollIntoViewIfNeeded();

			/* Three blocks: the object, its array and its object of scripts; the scripts start folded. */
			await expect(view.locator('.elemenx-code-view-fold')).toHaveCount(3);
			await expect(view.locator('[data-line="7"]')).toHaveClass(/folded/);
			await expect(view.locator('[data-line="8"]')).toBeHidden();
			await expect(view.locator('[data-line="10"]')).toBeHidden();
			await expect(view.locator('[data-line="7"]')).toHaveText(/"scripts": \{\s*…\s*\}$/);

			/* The array folds under its button: "keywords": [ … ], and the lines inside it hide. */
			await view.locator('[data-line="3"] .elemenx-code-view-fold').click();

			await expect(view.locator('[data-line="3"]')).toHaveText(/"keywords": \[\s*…\s*\],$/);
			await expect(view.locator('[data-line="3"] .elemenx-code-view-fold')).toHaveAttribute('aria-expanded', 'false');
			await expect(view.locator('[data-line="4"]')).toBeHidden();
			await expect(view.locator('[data-line="6"]')).toBeHidden();
			await expect(view.locator('[data-line="7"]')).toBeVisible();

			/* The whole object folds over its folded blocks; unfolded, the scripts are still folded, and … unfolds them. */
			await view.locator('[data-line="1"] .elemenx-code-view-fold').click();

			await expect(view.locator('.elemenx-code-view-line:visible')).toHaveCount(1);

			await view.locator('[data-line="1"] .elemenx-code-view-fold').click();

			await expect(view.locator('[data-line="8"]')).toBeHidden();

			await view.locator('[data-line="7"] .elemenx-code-view-more').click();

			await expect(view.locator('[data-line="8"]')).toBeVisible();
			await expect(view.locator('.elemenx-code-view-line:visible')).toHaveCount(8);

			/* The copy button: shown over the code under the pointer, and lit under the pointer itself. */
			copy = view.locator('.elemenx-code-view-copy .elemenx-button');

			await view.hover();

			before = await copy.evaluate(function (node) {
				return getComputedStyle(node).backgroundColor;
			});

			await copy.hover();

			await expect.poll(function () {
				return copy.evaluate(function (node) {
					return getComputedStyle(node).backgroundColor;
				});
			}).not.toBe(before);

			expect(errors).toEqual([]);
		});

		test('a start screen: tiles of any size, groups in one row that scrolls, actions declared in a group, heights and widths without a limit, kept between visits', async function ({ page }) {
			var errors = captureErrors(page);
			var start;
			var work;
			var rows;

			await open(page, origin, ['Tiles']);

			start = page.locator('.ui-kit-start .elemenx-tile-grid');
			work = start.locator('.elemenx-tile-group[data-group="work"]');

			await page.evaluate(function () {
				localStorage.removeItem('elemenx-tile-grid:ui-kit-start');
			});

			await start.scrollIntoViewIfNeeded();

			/* Width and Height in cells, the sizes tall and xlarge; the groups side by side in a grid that scrolls on its own. */
			expect(await start.evaluate(function (node) {
				function cells (id) {
					var box = node.querySelector('[data-id="' + id + '"]').getBoundingClientRect();

					return [Math.round((box.width + 8) / 56), Math.round((box.height + 8) / 56)];
				}

				return [cells('calendar'), cells('board'), cells('notes'), cells('games'), getComputedStyle(node).overflowX, getComputedStyle(node).flexWrap, node.scrollHeight > node.clientHeight];
			})).toEqual([[3, 2], [6, 4], [2, 4], [4, 4], 'auto', 'nowrap', true]);

			/* The button declared in the slot actions of the group stands in its header and keeps its binding. */
			await work.locator('.elemenx-tile-group-header').getByRole('button', {name: 'Add a tile'}).click();

			await expect(work.locator('[data-id="Draft 1"]')).toHaveCount(1);

			/* The bottom handle makes the group higher by whole rows; MaxColumns 0: the right one widens it past twelve. */
			rows = Number(await work.locator('.elemenx-tile-group-stretch.bottom').getAttribute('aria-valuenow'));

			await work.locator('.elemenx-tile-group-stretch.bottom').focus();

			await page.keyboard.press('ArrowDown');

			await expect(work.locator('.elemenx-tile-group-stretch.bottom')).toHaveAttribute('aria-valuenow', String(rows + 1));

			await work.locator('.elemenx-tile-group-resize').focus();

			for (var i = 0; i < 6; i++)
				await page.keyboard.press('ArrowRight');

			await expect(work.locator('.elemenx-tile-group-resize')).toHaveAttribute('aria-valuenow', '14');

			/* Kept: the arrangement is in the storage and comes back on the next visit. */
			expect(await page.evaluate(function () {
				var groups = JSON.parse(localStorage.getItem('elemenx-tile-grid:ui-kit-start'));

				return [groups[0].ID, groups[0].Columns, groups[0].Rows, groups[0].Tiles.map(function (tile) {
					return tile.ID;
				}).slice(0, 3)];
			})).toEqual(['work', 14, rows + 1, ['calendar', 'board', 'notes']]);

			await page.reload();

			await ready(page, page.url().indexOf('sections=') === -1);

			await start.scrollIntoViewIfNeeded();

			await expect(work.locator('.elemenx-tile-group-resize')).toHaveAttribute('aria-valuenow', '14');
			await expect(work.locator('.elemenx-tile-group-stretch.bottom')).toHaveAttribute('aria-valuenow', String(rows + 1));

			await page.evaluate(function () {
				localStorage.removeItem('elemenx-tile-grid:ui-kit-start');
			});

			expect(errors).toEqual([]);
		});

		test('a mouse drags a gallery and the pictures of a product card across, and the click that ends the drag presses nothing', async function ({ page }) {
			var errors = captureErrors(page);
			var gallery;
			var product;
			var box;
			var clicks;

			/* A drag of the mouse along x from the middle of a box, in steps, as a hand does. */
			async function drag (locator, dx) {
				box = await locator.boundingBox();

				await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
				await page.mouse.down();
				await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2, {steps: 8});
				await page.mouse.up();
			}

			await open(page, origin, ['Gallery', 'Cards']);

			gallery = section(page, 'Gallery').locator('.elemenx-gallery').first();

			await gallery.scrollIntoViewIfNeeded();

			/* The clicks that reach the page: none from the end of a drag. */
			await page.evaluate(function () {
				window.uiKitClicks = 0;

				document.addEventListener('click', function () {
					window.uiKitClicks++;
				});
			});

			await drag(gallery.locator('.elemenx-gallery-viewport'), -140);

			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('2 / 4');

			await drag(gallery.locator('.elemenx-gallery-viewport'), 140);

			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('1 / 4');

			clicks = await page.evaluate(function () {
				return window.uiKitClicks;
			});

			expect(clicks).toBe(0);

			/* The pictures of a product card go by a drag of the mouse too; a picture is not dragged away by the browser. */
			product = section(page, 'Cards').locator('.elemenx-product').filter({hasText: 'Studio headphones'});

			await product.scrollIntoViewIfNeeded();

			await drag(product.locator('.elemenx-product-media'), -100);

			await expect(product.locator('.elemenx-product-dot').nth(1)).toHaveClass(/active/);

			expect(await page.evaluate(function () {
				return window.uiKitClicks;
			})).toBe(0);

			expect(errors).toEqual([]);
		});

		test('a finger swipes a gallery and the pictures of a product card across, and drags a menu sheet down to close it', async function ({ page }) {
			var errors = captureErrors(page);
			var block;
			var gallery;
			var product;
			var menu;
			var sheet;

			await open(page, origin, ['Gallery', 'Cards', 'Buttons']);

			block = section(page, 'Gallery');
			gallery = block.locator('.elemenx-gallery').first();

			await gallery.scrollIntoViewIfNeeded();

			/* The picture follows the finger, then the swipe goes to the next one; a move too short goes back. */
			expect(await swipe(gallery.locator('.elemenx-gallery-viewport'), -120, 0, false)).toBe('-120px');

			await gallery.locator('.elemenx-gallery-viewport').evaluate(function (node) {
				node.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerType: 'touch', pointerId: 7, clientX: 0, clientY: 0}));
			});

			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('2 / 4');
			await expect(gallery).not.toHaveClass(/dragging/);

			await swipe(gallery.locator('.elemenx-gallery-viewport'), 120, 0);

			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('1 / 4');

			await swipe(gallery.locator('.elemenx-gallery-viewport'), -20, 0, false);

			await page.waitForTimeout(300);

			await gallery.locator('.elemenx-gallery-viewport').evaluate(function (node) {
				var box = node.getBoundingClientRect();

				node.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerType: 'touch', pointerId: 7, clientX: box.left + box.width / 2 - 20, clientY: box.top + 12}));
			});

			await page.waitForTimeout(200);

			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('1 / 4');

			/* A move up and down is the page's: no picture changes. */
			await swipe(gallery.locator('.elemenx-gallery-viewport'), 5, -120);

			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('1 / 4');

			/* The pictures of a product card. */
			product = section(page, 'Cards').locator('.elemenx-product').filter({hasText: 'Studio headphones'});

			await product.scrollIntoViewIfNeeded();

			await swipe(product.locator('.elemenx-product-media'), -100, 0);

			await expect(product.locator('.elemenx-product-dot').nth(1)).toHaveClass(/active/);

			/* The sheet of a menu follows a finger on its top down, and a swipe down closes it. */
			menu = page.locator('.elemenx-menu-root').filter({has: page.getByRole('button', {name: 'Mobile'})});

			await menu.getByRole('button', {name: 'Mobile'}).click();

			sheet = menu.locator('.elemenx-menu.sheet');

			await expect(sheet).toBeVisible();

			expect(await swipe(sheet.locator('.elemenx-menu-head'), 0, 90, false)).toBe('translateY(90px)');

			await sheet.locator('.elemenx-menu-head').evaluate(function (node) {
				node.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerType: 'touch', pointerId: 7, clientX: 0, clientY: 9999}));
			});

			await expect(sheet).toHaveCount(0);

			expect(errors).toEqual([]);
		});

		test('a menu takes items declared in its template: nested ones, a separator, a check, and the select of an item of its own', async function ({ page }) {
			var errors = captureErrors(page);
			var buttons;
			var menu;

			await open(page, origin, ['Buttons']);

			buttons = section(page, 'Buttons');
			menu = buttons.locator('.elemenx-menu-root').filter({has: page.getByRole('button', {name: 'Edit'})});

			await menu.scrollIntoViewIfNeeded();
			await menu.getByRole('button', {name: 'Edit'}).click();

			await expect(menu.getByRole('menuitem')).toHaveText([/Undo/, /Redo/, /Paste special/, /Wrap lines/]);
			await expect(menu.getByRole('menuitem', {name: /Redo/})).toHaveAttribute('aria-disabled', 'true');
			await expect(menu.locator('[role="separator"], .elemenx-menu-separator, hr')).toHaveCount(1);

			/* Undo emits select on the menu and on its MenuItem: Redo is enabled then. */
			await menu.getByRole('menuitem', {name: /Undo/}).click();

			await expect(buttons).toContainText('Menu: undo');

			await menu.getByRole('button', {name: 'Edit'}).click();

			await expect(menu.getByRole('menuitem', {name: /Redo/})).not.toHaveAttribute('aria-disabled', 'true');

			/* A MenuItem with MenuItems inside is a submenu. */
			await menu.getByRole('menuitem', {name: /Paste special/}).click();
			await menu.getByRole('menuitem', {name: 'Keep the format'}).click();

			await expect(buttons).toContainText('Menu: paste-format');

			expect(errors).toEqual([]);
		});

		test('a bar of menus opens the menu under the pointer while one is open, goes from menu to menu by the arrows, and has no carets', async function ({ page }) {
			var errors = captureErrors(page);
			var buttons;
			var bar;
			var entry;

			await open(page, origin, ['Buttons']);

			buttons = section(page, 'Buttons');
			bar = buttons.locator('.ui-kit-menu-bar .elemenx-menu-bar');

			entry = function (name) {
				return bar.locator('.elemenx-menu-bar-entry').filter({has: page.getByRole('button', {name: name, exact: true})});
			};

			await bar.scrollIntoViewIfNeeded();

			await expect(bar.locator('.elemenx-button')).toHaveText(['File', 'Edit', 'Help']);

			/* No arrow by the labels of the bar, nor by a Menu with Caret false; a Menu keeps its own by default. */
			await expect(bar.locator('.elemenx-button .elemenx-icon')).toHaveCount(0);
			await expect(buttons.locator('.ui-kit-menu-bar > .elemenx-menu-root .elemenx-button .elemenx-icon')).toHaveCount(0);
			await expect(buttons.locator('.elemenx-menu-root').filter({has: page.getByRole('button', {name: 'File', exact: true})}).first().locator('.elemenx-button .elemenx-icon')).not.toHaveCount(0);

			/* Closed, the pointer opens nothing; open, the menu under the pointer takes the place of the open one. */
			await entry('Edit').hover();

			await expect(bar.getByRole('menuitem').filter({visible: true})).toHaveCount(0);

			await entry('File').getByRole('button').click();

			await expect(entry('File').getByRole('menuitem').filter({visible: true})).toHaveText([/New/, /Open/]);

			await entry('Edit').getByRole('button').hover();

			await expect(entry('Edit').getByRole('menuitem').filter({visible: true})).toHaveText([/Copy/, /Paste special/]);
			await expect(entry('File').getByRole('menuitem').filter({visible: true})).toHaveCount(0);

			/* The arrows: right to the next menu, left back, round the bar; in a submenu they are the submenu's. */
			await entry('Edit').getByRole('menuitem', {name: /Copy/}).focus();

			await page.keyboard.press('ArrowRight');

			await expect(entry('Help').getByRole('menuitem').filter({visible: true})).toHaveText([/About/]);

			await page.keyboard.press('ArrowRight');

			await expect(entry('File').getByRole('menuitem').filter({visible: true})).toHaveText([/New/, /Open/]);

			await page.keyboard.press('ArrowLeft');

			await expect(entry('Help').getByRole('menuitem').filter({visible: true})).toHaveCount(1);

			/* Escape closes it, back on its button; a choice reaches the select of the bar. */
			await page.keyboard.press('Escape');

			await expect(bar.getByRole('menuitem').filter({visible: true})).toHaveCount(0);
			await expect(entry('Help').getByRole('button')).toBeFocused();

			await page.keyboard.press('ArrowLeft');

			await expect(entry('Edit').getByRole('button')).toBeFocused();

			await page.keyboard.press('ArrowDown');

			await expect(entry('Edit').getByRole('menuitem', {name: /Copy/})).toBeFocused();

			await page.keyboard.press('Enter');

			await expect(buttons).toContainText('Menu: bar-copy');

			/* Two arrows at once, the second before the focus came to the menu the first opened: two menus on, Edit to File. */
			await entry('Edit').getByRole('button').click();
			await entry('Edit').getByRole('menuitem', {name: /Copy/}).focus();

			await entry('Edit').getByRole('menuitem', {name: /Copy/}).evaluate(function (node) {
				node.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true, cancelable: true}));
				node.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true, cancelable: true}));
			});

			await expect(entry('File').getByRole('menuitem').filter({visible: true})).toHaveText([/New/, /Open/]);

			await page.keyboard.press('Escape');

			/* F10, or Alt alone, takes the first bar of the page to its first menu, and again gives the focus back. */
			await buttons.getByRole('button', {name: 'Primary'}).focus();

			await page.keyboard.press('F10');

			await expect(entry('File').getByRole('button')).toBeFocused();

			await page.keyboard.press('F10');

			await expect(buttons.getByRole('button', {name: 'Primary'})).toBeFocused();

			await page.keyboard.press('Alt');

			await expect(entry('File').getByRole('button')).toBeFocused();

			expect(errors).toEqual([]);
		});

		test('forms collect their fields, validate them in the template or by a model in code, and submit only when valid', async function ({ page }) {
			var errors = captureErrors(page);
			var pending;
			var forms;
			var header;
			var signUp;
			var profile;

			function error (form, label) {
				return form.locator('.elemenx-field').filter({has: page.locator('.elemenx-field-label', {hasText: new RegExp('^' + label + '$')})}).locator('.elemenx-field-error');
			}

			await open(page, origin, ['Forms']);

			forms = section(page, 'Forms');
			header = forms.locator(':scope > .elemenx-section-header');
			signUp = forms.locator('.ui-kit-sign-up');
			profile = forms.locator('.ui-kit-profile');

			await signUp.scrollIntoViewIfNeeded();

			/* Nothing shows before a field is touched; a submit touches them all and the first one in error takes the focus. */
			await expect(signUp.locator('.elemenx-field-error')).toHaveCount(0);

			await signUp.getByRole('button', {name: 'Sign up'}).click();

			await expect(header).toContainText('Fix: name, email, password, repeat, terms');
			await expect(error(signUp, 'Name')).toHaveText('Fill in this field');
			await expect(signUp.locator('.elemenx-field-error').last()).toHaveText('Accept the terms to go on');
			await expect(signUp.getByPlaceholder('Your name')).toBeFocused();

			/* Each field validates as it is typed. */
			await signUp.getByPlaceholder('Your name').fill('Ada');
			await signUp.getByPlaceholder('you@example.com').fill('ada@');

			await expect(error(signUp, 'Name')).toHaveCount(0);
			await expect(error(signUp, 'Email')).toHaveText('Enter an email address');

			await signUp.getByPlaceholder('you@example.com').fill('ada@example.com');
			await signUp.locator('input[type="password"]').first().fill('short');

			await expect(error(signUp, 'Password')).toHaveText('At least 8 characters');

			await signUp.locator('input[type="password"]').first().fill('long enough');
			await signUp.locator('input[type="password"]').last().fill('different');

			await expect(error(signUp, 'Repeat the password')).toHaveText('The passwords differ');

			await signUp.locator('input[type="password"]').last().fill('long enough');
			await signUp.locator('.elemenx-number-input input').fill('12');
			await signUp.locator('.elemenx-number-input input').blur();

			await expect(error(signUp, 'Age')).toHaveText('At least 18');

			await signUp.locator('.elemenx-number-input input').fill('36');
			await signUp.getByText('I accept the terms').click();
			await signUp.getByRole('button', {name: 'Sign up'}).click();

			await expect(header).toContainText('Signed up: Ada <ada@example.com>');

			/* A reset empties the fields and hides the errors. */
			await signUp.getByRole('button', {name: 'Clear'}).click();

			await expect(header).toContainText('Cleared');
			await expect(signUp.getByPlaceholder('Your name')).toHaveValue('');
			await expect(signUp.locator('.elemenx-field-error')).toHaveCount(0);

			/* A model in code: its value and status follow the fields; a server check waits, then refuses a name. */
			await profile.scrollIntoViewIfNeeded();

			await expect(profile.locator('.ui-kit-profile-value')).toHaveText('valid · {"Username":"ada","City":"Berlin","Phones":["+49 30 1234567"]}');

			await error(profile, 'Username').count();

			/* Pending while the server checks (300 ms). */
			pending = await became(page, profile.locator('.ui-kit-profile-value'), null, 'pending');

			await profile.locator('.elemenx-field').first().locator('input').fill('admin');

			await pending();

			await expect(profile.locator('.ui-kit-profile-value')).toContainText('invalid');

			/* Left, the field shows its error; the check of the server answers late beside the other workers, so it is left again until then. */
			await expect(async function () {
				await profile.locator('.elemenx-field').first().locator('input').focus();
				await profile.locator('.elemenx-field').first().locator('input').blur();

				await expect(error(profile, 'Username')).toHaveText('This name is taken', {timeout: 2000});
			}).toPass({timeout: 30000});

			await profile.locator('.elemenx-field').first().locator('input').fill('grace');

			/* A Component inside a Field (a Select) gives its value by its change. */
			await profile.locator('.elemenx-select-trigger').click();
			await page.getByRole('option', {name: 'Tokyo'}).click();

			/* An array of controls: a phone added is required, so the form does not submit until it is filled or removed. */
			await profile.getByRole('button', {name: 'Add a phone'}).click();

			await expect(profile.locator('.ui-kit-phone')).toHaveCount(2);

			await profile.getByRole('button', {name: 'Save'}).click();

			await expect(error(profile, 'Phone').last()).toHaveText('Fill in this field');

			await profile.locator('.ui-kit-phone').last().getByTitle('Remove the phone').click();
			await profile.getByRole('button', {name: 'Save'}).click();

			await expect(header).toContainText('Saved: {"Username":"grace","City":"Tokyo","Phones":["+49 30 1234567"]}');

			expect(errors).toEqual([]);
		});

		test('breadcrumbs lead back, fold the middle into a menu; avatars are made of names; presence, badges and pictures', async function ({ page }) {
			var errors = captureErrors(page);
			var connecting;
			var people;
			var crumbs;
			var short;
			var header;

			await open(page, origin, ['Navigation and people']);

			people = section(page, 'Navigation and people');
			header = people.locator(':scope > .elemenx-section-header');
			crumbs = people.getByRole('navigation', {name: 'Breadcrumbs'}).first();
			short = people.locator('.ui-kit-crumbs-short');

			await crumbs.scrollIntoViewIfNeeded();

			/* The path: the items are buttons, the last one the present page; the slots stand before and after it. */
			await expect(crumbs.locator('.elemenx-breadcrumbs-item')).toHaveCount(5);
			await expect(crumbs.locator('[aria-current="page"] .elemenx-breadcrumbs-label')).toHaveText('app.js');
			await expect(crumbs.locator('.elemenx-breadcrumbs-start').getByRole('button', {name: 'Home'})).toBeVisible();
			await expect(crumbs.locator('.elemenx-breadcrumbs-end .elemenx-presence')).toHaveText('Online');

			/* Signals: as many lit bars as they are strong, in the color of their level, named for a screen reader. */
			await expect(people.locator('.ui-kit-signals').getByRole('img', {name: 'Fair connection'}).locator('.elemenx-signal-bar.on')).toHaveCount(2);
			await expect(people.locator('.ui-kit-signals').getByRole('img', {name: 'Poor connection'})).toHaveClass(/danger/);
			await expect(people.locator('.ui-kit-signals').getByRole('img', {name: 'Signal 60%'}).locator('.elemenx-signal-bar')).toHaveCount(5);
			await expect(people.locator('.ui-kit-signals').getByRole('img', {name: 'Signal 60%'}).locator('.elemenx-signal-bar.on')).toHaveCount(3);
			await expect(people.locator('.ui-kit-signals').getByRole('img', {name: 'No network'}).locator('.elemenx-signal-bar.on')).toHaveCount(0);

			await crumbs.getByRole('button', {name: 'libraries'}).click();

			await expect(header).toContainText('Crumb: libraries (2)');

			/* Max 3: the first, a "…" menu of the hidden ones, the last two; slashes between them. */
			await expect(short.locator('.elemenx-breadcrumbs-item')).toHaveCount(4);
			await expect(short.locator('.elemenx-breadcrumbs-separator').first()).toHaveText('/');

			await short.locator('.elemenx-breadcrumbs-item.more .elemenx-button').click();
			await short.getByRole('menuitem', {name: 'Elemenx'}).click();

			await expect(header).toContainText('Crumb: Elemenx (1)');

			/* Avatars: initials of the name in a color of the name, the same for the same name; a pattern; shapes; a logo of letters; a dot of presence. */
			expect(await people.locator('.ui-kit-avatars .elemenx-avatar').evaluateAll(function (nodes) {
				return nodes.map(function (node) {
					var face = node.querySelector('.elemenx-avatar-face');

					return [node.getAttribute('aria-label'), node.textContent.trim(), face ? face.className.replace('elemenx-avatar-face ', '') : 'image', node.querySelectorAll('rect, circle, polygon').length > 0, !!node.querySelector('.elemenx-presence')];
				});
			})).toEqual([
				['Ada Lovelace', 'AL', 'initials', false, true],
				['Alan Turing', '', 'pattern', true, true],
				['Grace Hopper', '', 'shapes', true, true],
				['Elemenx', 'EX', 'initials', false, false],
				['Broken picture', 'BP', 'initials', false, false],
				['Linus', '', 'pattern', true, false]
			]);

			expect(await page.evaluate(function () {
				var faces = document.querySelectorAll('.ui-kit-avatars .elemenx-avatar-face');

				return [faces[0].style.background === faces[0].style.background && faces[0].style.background !== faces[4].style.background, getComputedStyle(document.querySelectorAll('.ui-kit-avatars .elemenx-avatar')[5]).width];
			})).toEqual([true, '72px']);

			/* Presence: a dot with its name; connecting turns until the server answers. */
			await expect(people.locator('.ui-kit-presence .elemenx-presence-label')).toHaveText(['Online', 'Away', 'Busy', 'Do not disturb', 'Offline', 'Connecting…']);

			connecting = await became(page, crumbs, '.elemenx-presence.connecting');

			await people.getByRole('button', {name: 'Reconnect'}).click();

			await connecting();

			await expect(crumbs.locator('.elemenx-presence')).toHaveClass(/online/, {timeout: 5000});

			/* Badges: a count (99+ past 99), a ring of a task, a dot, a text of a tone; on any element by *badge; 0 shows none. */
			expect(await people.locator('.ui-kit-badges .elemenx-badge.overlay').evaluateAll(function (nodes) {
				return nodes.map(function (node) {
					return [node.className.replace('elemenx-badge overlay ', ''), node.textContent, node.hidden];
				});
			})).toEqual([
				['count danger', '3', false],
				['count danger', '99+', false],
				['busy accent', 'In progress', false],
				['dot accent', 'New', false],
				['text success', 'new', false],
				['count danger', '3', false]
			]);

			await people.getByRole('button', {name: 'Notifications'}).click();

			await expect(header).toContainText('All read');
			await expect(people.locator('.ui-kit-badges .elemenx-badge.overlay:not([hidden])')).toHaveCount(4);

			/* Pictures: a box of a ratio filled by the picture, a circle, a fallback, and the icon of a picture when none loads. */
			await expect.poll(function () {
				return people.locator('.ui-kit-images .elemenx-image').evaluateAll(function (nodes) {
					return nodes.map(function (node) {
						var picture = node.querySelector('img');

						return [Math.round(node.getBoundingClientRect().width), Math.round(node.getBoundingClientRect().height), picture ? picture.getAttribute('src').split('/').pop() : null, !!node.querySelector('.elemenx-image-broken'), node.classList.contains('loading')];
					});
				});
			}).toEqual([[240, 135, 'mountains.svg', false, false], [120, 120, 'sea.svg', false, false], [120, 120, 'city.svg', false, false], [120, 90, null, true, false]]);

			expect(errors).toEqual([]);
		});

		test('a dial pad types its keys, puts + on a long press of 0, erases, takes only its characters, calls, and takes a layout of its own', async function ({ page }) {
			var errors = captureErrors(page);
			var dial;
			var phone;
			var tones;
			var field;
			var zero;
			var box;

			await open(page, origin, ['Dial pad']);

			dial = section(page, 'Dial pad');
			phone = dial.getByRole('group', {name: 'Phone'});
			tones = dial.getByRole('group', {name: 'Tones'});
			field = phone.getByRole('textbox', {name: 'Number'});

			await phone.scrollIntoViewIfNeeded();

			/* The pad of a phone: twelve keys in three columns, the letters under the digits. */
			await expect(phone.locator('.elemenx-dial-pad-key')).toHaveCount(12);
			await expect(phone.locator('.elemenx-dial-pad-key').nth(1)).toContainText('ABC');
			await expect(phone.getByRole('button', {name: 'Call'})).toBeDisabled();

			/* A long press of 0 puts +, the keys their digits. */
			zero = phone.locator('.elemenx-dial-pad-key').nth(10);
			box = await zero.boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			/* Held well past its Hold (500 ms): a busy page fires the timer late. */
			await page.mouse.down();
			await page.waitForTimeout(1500);
			await page.mouse.up();

			await phone.locator('.elemenx-dial-pad-key').nth(3).click();
			await phone.locator('.elemenx-dial-pad-key').nth(8).click();
			await phone.locator('.elemenx-dial-pad-key').nth(10).click();

			await expect(field).toHaveValue('+490');

			/* The key that erases takes the last one back. */
			await phone.getByRole('button', {name: 'Erase'}).click();

			await expect(field).toHaveValue('+49');

			/* The field takes what is typed, of the characters of the keys only; Enter calls. */
			await field.focus();
			await field.press('End');
			await field.pressSequentially('3x0#');

			await expect(field).toHaveValue('+4930#');

			await field.press('Enter');

			await expect(dial.locator('.elemenx-section-header')).toContainText('Calling +4930#');

			/* A character taken out leaves the caret where it was: what follows goes in at the same place. */
			await field.press('Home');
			await field.pressSequentially('x1');

			await expect(field).toHaveValue('1+4930#');

			/* A layout of its own: sixteen keys in four columns, no field and no call. */
			await expect(tones.locator('.elemenx-dial-pad-key')).toHaveCount(16);
			await expect(tones.locator('.elemenx-dial-pad-input')).toHaveCount(0);
			await expect(tones.locator('.elemenx-dial-pad-call')).toHaveCount(0);

			expect(await tones.locator('.elemenx-dial-pad-key').evaluateAll(function (keys) {
				return [keys[0].getBoundingClientRect().top === keys[3].getBoundingClientRect().top, keys[4].getBoundingClientRect().top > keys[3].getBoundingClientRect().top, keys[3].classList.contains('ui-kit-tone-key')];
			})).toEqual([true, true, true]);

			await tones.getByRole('button', {name: 'B'}).click();

			await expect(dial.locator('.elemenx-section-header')).toContainText('Tone B');

			expect(errors).toEqual([]);
		});

		test('a call stage pages its tiles, changes its layout with the bar of the call, pins a tile in front, opens its side panel and takes its own video to another corner', async function ({ page }) {
			var errors = captureErrors(page);
			var calls;
			var stage;
			var tiles;
			var bar;
			var own;
			var box;
			var area;
			var leave;
			var leaveBox;
			var frames;

			await page.setViewportSize({width: 1280, height: 900});

			await open(page, origin, ['Calls']);

			calls = section(page, 'Calls');
			stage = calls.locator('.elemenx-call-stage');
			tiles = stage.locator('.elemenx-call-stage-participants .elemenx-call-tile');
			bar = calls.getByRole('toolbar', {name: 'Call controls'});

			await stage.scrollIntoViewIfNeeded();

			/* Six people, four a page: the grid of two columns, the others on the next page. */
			await expect(tiles).toHaveCount(6);
			await expect(tiles.locator('visible=true')).toHaveCount(4);
			await expect(stage).toHaveClass(/\bgrid\b/);
			await expect(stage).not.toHaveClass(/has-main/);
			await expect(stage.locator('.elemenx-call-stage-participants')).toHaveAttribute('style', /--elemenx-call-columns: 2/);
			await expect(stage.getByRole('button', {name: 'Previous'})).toBeDisabled();

			await stage.getByRole('button', {name: 'Next'}).click();

			await expect(tiles.locator('visible=true')).toHaveCount(2);
			await expect(tiles.nth(4)).toBeVisible();
			await expect(stage.getByRole('button', {name: 'Next'})).toBeDisabled();
			await expect(calls.locator('.elemenx-section-header')).toContainText('Page 2');

			await stage.getByRole('button', {name: 'Previous'}).click();

			/* The tiles: the avatar of a camera off, the microphone off, the hand, the speaker framed. */
			await expect(tiles.nth(1).locator('.elemenx-call-tile-avatar')).toBeVisible();
			await expect(tiles.nth(1).locator('.elemenx-call-tile-video')).toHaveCount(0);
			await expect(tiles.nth(0)).toHaveClass(/speaking/);
			await expect(tiles.nth(2).locator('.elemenx-call-tile-hand')).toBeVisible();

			/* The microphone: its state from the Application, the label of what a press does. */
			await bar.getByRole('button', {name: 'Turn the microphone on'}).click();

			await expect(bar.getByRole('button', {name: 'Turn the microphone off'})).toHaveAttribute('aria-pressed', 'false');
			await expect(stage.locator('.elemenx-call-stage-self .elemenx-call-tile-name svg')).toHaveCount(0);

			/* The screen shared: main in front, the participants in a column beside it. */
			await bar.getByRole('button', {name: 'Share the screen'}).click();

			await expect(stage).toHaveClass(/\bscreen\b/);
			await expect(stage).toHaveClass(/has-main/);
			await expect(stage.locator('.elemenx-call-stage-main .elemenx-call-tile')).toHaveClass(/screen/);

			expect(await stage.evaluate(function (node) {
				var main = node.querySelector('.elemenx-call-stage-main').getBoundingClientRect();
				var list = node.querySelector('.elemenx-call-stage-participants').getBoundingClientRect();

				return [list.left >= main.right, main.width > list.width * 2];
			})).toEqual([true, true]);

			await bar.getByRole('button', {name: 'Stop sharing'}).click();

			await expect(stage).toHaveClass(/\bgrid\b/);

			/* A tile pinned with a double click: in front, the others in a strip under it. */
			await tiles.nth(2).dblclick();

			await expect(stage).toHaveClass(/\bspeaker\b/);
			await expect(stage.locator('.elemenx-call-stage-main .elemenx-call-tile')).toHaveAttribute('aria-label', 'Grace Hopper');
			await expect(tiles).toHaveCount(5);

			await stage.locator('.elemenx-call-stage-main').getByRole('button', {name: 'Unpin'}).click();

			await expect(stage).toHaveClass(/\bgrid\b/);
			await expect(tiles).toHaveCount(6);

			/* The layout from its menu, a device and a reaction told. */
			await bar.getByRole('button', {name: 'Layout', exact: true}).click();
			await page.getByRole('menuitem', {name: 'Speaker'}).click();

			await expect(stage).toHaveClass(/\bspeaker\b/);

			await bar.getByRole('button', {name: 'Camera', exact: true}).click();
			await page.getByRole('menuitem', {name: 'Front camera'}).click();

			await expect(calls.locator('.elemenx-section-header')).toContainText('camera: front');

			await bar.getByRole('button', {name: 'React'}).click();
			await page.getByRole('menuitem', {name: '🎉'}).click();

			await expect(calls.locator('.elemenx-section-header')).toContainText('Reaction 🎉');

			/* The chat: the side panel beside the stage. */
			await bar.getByRole('button', {name: 'Chat', exact: true}).click();

			await expect(stage.locator('.elemenx-call-stage-side')).toBeVisible();
			await expect(stage.locator('.elemenx-call-stage-side')).toContainText('the slides are up');

			await bar.getByRole('button', {name: 'Chat', exact: true}).click();

			await expect(stage.locator('.elemenx-call-stage-side')).toBeHidden();

			/* The own video dragged to the top left: it stays in that corner. */
			own = stage.locator('.elemenx-call-stage-self');
			box = await own.boundingBox();
			area = await stage.locator('.elemenx-call-stage-area').boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(area.x + 40, area.y + 40, {steps: 5});
			await page.mouse.up();

			await expect(own).toHaveClass(/top-left/);
			await expect(calls.locator('.elemenx-section-header')).toContainText('Own video: top-left');

			/* A red Button the pointer leaves stays red all along its transition: its shade lies over its own color, not over the text one. */
			leave = bar.getByRole('button', {name: 'Leave'});
			leaveBox = await leave.boundingBox();

			await page.mouse.move(leaveBox.x + leaveBox.width / 2, leaveBox.y + leaveBox.height / 2);
			await page.waitForTimeout(300);

			frames = leave.evaluate(function (node) {
				return new Promise(function (resolve) {
					var list = [];
					var start = performance.now();

					(function look () {
						list.push(getComputedStyle(node).backgroundColor);

						if (performance.now() - start < 400) requestAnimationFrame(look);
						else resolve(list);
					})();
				});
			});

			await page.mouse.move(leaveBox.x - 200, leaveBox.y - 200);

			expect(Array.from(new Set(await frames))).toHaveLength(1);

			/* The answers of the invitation take a shade under the pointer, accepting too (green). */
			await calls.locator('.elemenx-call-invite').getByRole('button', {name: 'Accept', exact: true}).hover();

			await expect.poll(function () {
				return calls.locator('.elemenx-call-invite').getByRole('button', {name: 'Accept', exact: true}).evaluate(function (node) {
					return getComputedStyle(node).backgroundImage;
				});
			}).toContain('linear-gradient');

			/* The invitation alone in a page: its events. */
			await calls.locator('.elemenx-call-invite').getByRole('button', {name: 'Accept with video'}).click();

			await expect(calls.locator('.elemenx-section-header')).toContainText('Accepted with the camera');

			expect(errors).toEqual([]);
		});

		test('a game world draws its declared map, selects the units of its team, orders them along their ways, recruits by code and hides the unexplored in the fog', async function ({ page }) {
			var errors = captureErrors(page);
			var game;
			var world;
			var canvas;
			var header;
			var box;
			var pixel;
			var recruited;

			await page.setViewportSize({width: 1280, height: 900});

			await open(page, origin, ['Game world']);

			game = section(page, 'Game world');
			world = game.locator('.elemenx-game-world');
			canvas = world.locator('.elemenx-game-world-canvas');
			header = game.locator('.elemenx-section-header');

			await world.scrollIntoViewIfNeeded();

			/* The declarations: a layer, two buildings, eight units, five trees and a rock. */
			await expect(world.locator('.elemenx-game-source')).toHaveCount(17);
			await expect(world).toHaveAttribute('role', 'application');

			pixel = async function (selector, x, y) {
				return world.locator(selector).evaluate(function (node, point) {
					return Array.prototype.slice.call(node.getContext('2d').getImageData(point.X, point.Y, 1, 1).data);
				}, {X: x, Y: y});
			};

			/* The map is drawn in the middle of the view. */
			await expect.poll(async function () {
				return (await pixel('.elemenx-game-world-canvas', 520, 240))[3];
			}).toBeGreaterThan(240);

			/* Ctrl+A: the units of the team; Escape: none. */
			await world.focus();

			await page.keyboard.press('Control+a');

			await expect(header).toContainText('5 selected: archer-1, archer-2, archer-3, sword-1, sword-2');

			await page.keyboard.press('Escape');

			await expect(header).toContainText('Nothing selected');

			/* A frame drawn over the view: the units in it. */
			box = await canvas.boundingBox();

			await page.mouse.move(box.x + 4, box.y + 4);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4, {steps: 6});
			await page.mouse.up();

			await expect(header).toContainText('5 selected');

			/* A right click in the middle: the order, then each walks its way there. */
			await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {button: 'right'});

			await expect(header).toContainText(/move to \d+, \d+: 5 units/);
			await expect(header).toContainText('Arrived:', {timeout: 20000});

			/* A unit of the code: added by the barracks, sent on its way (it arrives soon: its note lasts a moment). */
			recruited = await became(page, header.locator('.elemenx-caption'), null, 'Recruited recruit-1 · 6 blue units');

			await game.getByRole('button', {name: 'Recruit'}).click();

			await recruited();

			/* The fog: the far side of the river, unexplored, black on the minimap. */
			expect((await pixel('.elemenx-game-world-minimap', 170, 42)).slice(0, 3)).not.toEqual([6, 8, 12]);

			await game.locator('.elemenx-toggle').filter({hasText: 'Fog of war'}).click();

			await expect.poll(async function () {
				return (await pixel('.elemenx-game-world-minimap', 170, 42)).slice(0, 3);
			}).toEqual([6, 8, 12]);

			/* From above: the same world, drawn again. */
			await game.locator('.elemenx-check-label', {hasText: 'From above'}).click();

			await expect.poll(async function () {
				return (await pixel('.elemenx-game-world-canvas', 520, 240))[3];
			}).toBeGreaterThan(240);

			expect(errors).toEqual([]);
		});

		test('a panel with *keep sleeps out of the page with what is typed in it, and its live keyboard stops listening until it wakes', async function ({ page }) {
			var errors = captureErrors(page);
			var keep;
			var panel;
			var draft;

			await open(page, origin, ['Keep-alive']);

			keep = section(page, 'Keep-alive');
			panel = keep.locator('.ui-kit-keep-panel');
			draft = panel.getByRole('textbox');

			await keep.scrollIntoViewIfNeeded();

			await draft.fill('kept draft');

			await keep.getByRole('button', {name: 'Panel', exact: true}).click();

			await expect(panel).toHaveCount(0);

			await keep.getByRole('button', {name: 'Cache stats'}).click();

			await expect(keep.locator('.elemenx-section-header')).toContainText('Asleep: *if');

			/* Asleep, the keyboard does not hear the keys: a key held now is not shown when the panel comes back. */
			await page.keyboard.down('KeyQ');

			await keep.getByRole('button', {name: 'Panel', exact: true}).click();

			await expect(panel).toBeVisible();
			await expect(draft).toHaveValue('kept draft');
			await expect(panel.locator('[data-code="KeyQ"]')).not.toHaveClass(/held/);

			await page.keyboard.up('KeyQ');

			/* Awake, it hears them again. */
			await page.keyboard.down('KeyW');

			await expect(panel.locator('[data-code="KeyW"]')).toHaveClass(/held/);

			await page.keyboard.up('KeyW');

			await keep.getByRole('button', {name: 'Cache stats'}).click();

			await expect(keep.locator('.elemenx-section-header')).toContainText('Asleep: nothing');

			expect(errors).toEqual([]);
		});

		test('a mixer turns its faders, knobs and pans, mutes and solos its channels and shows their levels', async function ({ page }) {
			var errors = captureErrors(page);
			var music;
			var header;
			var mixer;
			var drums;
			var bass;

			await open(page, origin, ['Music and input']);

			music = section(page, 'Music and input');
			header = music.locator('.elemenx-section-header');
			mixer = music.getByRole('group', {name: 'Studio'});
			drums = mixer.getByRole('group', {name: 'Drums'});
			bass = mixer.getByRole('group', {name: 'Bass'});

			await mixer.scrollIntoViewIfNeeded();

			/* Four channels and the master bus, which has no Solo. */
			await expect(mixer.locator('.elemenx-mixer-channel')).toHaveCount(5);
			await expect(mixer.locator('.elemenx-mixer-channel.master').getByRole('button', {name: /^Solo/})).toHaveCount(0);
			await expect(drums.locator('.elemenx-mixer-readout')).toHaveText('-3.0');

			/* The fader: the arrows by half a decibel, Home to the bottom, where the readout says -∞. */
			await drums.getByRole('slider', {name: 'Volume Drums'}).focus();

			await page.keyboard.press('ArrowUp');

			await expect(header).toContainText('drums Volume: -2.5');
			await expect(drums.locator('.elemenx-mixer-readout')).toHaveText('-2.5');

			await page.keyboard.press('Home');

			await expect(drums.locator('.elemenx-mixer-readout')).toHaveText('-∞');

			/* The pan and a knob of the equalizer. */
			await bass.getByRole('slider', {name: 'Pan'}).focus();

			await page.keyboard.press('ArrowRight');

			await expect(header).toContainText('bass Pan: -19');

			await bass.getByRole('slider', {name: 'Lo'}).focus();

			await page.keyboard.press('ArrowDown');

			await expect(header).toContainText('bass Lo: 3');

			/* Mute dims its channel; Solo leaves the other channels out, not the master. */
			await drums.getByRole('button', {name: 'Mute Drums'}).click();

			await expect(drums.getByRole('button', {name: 'Mute Drums'})).toHaveAttribute('aria-pressed', 'true');
			await expect(drums).toHaveClass(/muted/);

			await bass.getByRole('button', {name: 'Solo Bass'}).click();

			await expect(header).toContainText('bass Solo: true');
			await expect(mixer.locator('.elemenx-mixer-channel.silenced')).toHaveCount(3);
			await expect(bass).not.toHaveClass(/silenced/);

			await bass.getByRole('button', {name: 'Solo Bass'}).click();

			await expect(mixer.locator('.elemenx-mixer-channel.silenced')).toHaveCount(0);

			/* The meter: a bar for each side of a stereo channel, filled to its level, the peak over it. */
			expect(await mixer.getByRole('group', {name: 'Keys'}).locator('.elemenx-mixer-bar').evaluateAll(function (bars) {
				return bars.map(function (bar) {
					var box = bar.getBoundingClientRect();
					var peak = bar.querySelector('.elemenx-mixer-peak').getBoundingClientRect();

					return [Math.round(parseFloat(getComputedStyle(bar).getPropertyValue('--elemenx-mixer-level')) * 100), Math.round((box.bottom - peak.bottom) / box.height * 100)];
				});
			})).toEqual([[55, 67], [58, 68]]);

			expect(errors).toEqual([]);
		});

		test('a keyboard lays out its keys, marks hotkeys, shows the keys held and takes presses', async function ({ page }) {
			var errors = captureErrors(page);
			var music;
			var full;
			var compact;
			var unit;

			await open(page, origin, ['Music and input']);

			music = section(page, 'Music and input');
			full = music.getByRole('group', {name: 'Hotkeys'});
			compact = music.getByRole('group', {name: 'Compact'});

			await full.scrollIntoViewIfNeeded();

			/* The full layout: the main block with its function keys, the navigation and the number pad. */
			await expect(full.locator('.elemenx-keyboard-block')).toHaveCount(3);
			await expect(full.locator('.elemenx-keyboard-key')).toHaveCount(104);
			await expect(compact.locator('.elemenx-keyboard-block')).toHaveCount(1);
			await expect(compact.locator('.elemenx-keyboard-key')).toHaveCount(61);

			/* Keys as wide as on a keyboard: the space bar six and a quarter keys, Enter of the number pad two rows. */
			expect(await full.evaluate(function (node) {
				var box = function (code) {
					return node.querySelector('[data-code="' + code + '"]').getBoundingClientRect();
				};

				return [Math.round((box('Space').width + 4) / (box('KeyQ').width + 4) * 100) / 100, Math.round((box('NumpadEnter').height + 4) / (box('Numpad3').height + 4)), Math.round(box('KeyA').left - box('KeyQ').left)];
			})).toEqual([6.25, 2, 10]);

			/* Marks: the moves in the accent, the jump and the run in the classes given. */
			await expect(full.locator('.elemenx-keyboard-key.marked')).toHaveCount(4);
			await expect(full.locator('[data-code="Space"]')).toHaveClass(/ui-kit-key-jump/);

			/* Pressed and held keys go down. */
			await expect(compact.locator('.elemenx-keyboard-key.pressed')).toHaveCount(2);

			await page.keyboard.down('KeyQ');

			await expect(full.locator('[data-code="KeyQ"]')).toHaveClass(/held/);
			await expect(full.locator('[data-code="KeyQ"]')).toHaveAttribute('aria-pressed', 'true');

			await page.keyboard.up('KeyQ');

			await expect(full.locator('[data-code="KeyQ"]')).not.toHaveClass(/held/);

			/* A press on a key of the screen. */
			await full.locator('[data-code="F5"]').click();

			await expect(music.locator('.elemenx-section-header')).toContainText('Key F5');

			unit = await compact.evaluate(function (node) {
				return getComputedStyle(node).getPropertyValue('--elemenx-keyboard-unit').trim();
			});

			expect(unit).toBe('28px');
			expect(errors).toEqual([]);
		});

		test('a piano plays the key pressed, louder lower on it, slides over keys, takes the keys of the computer and marks notes', async function ({ page }) {
			var errors = captureErrors(page);
			var music;
			var header;
			var piano;
			var c4;
			var d4;
			var box;

			await open(page, origin, ['Music and input']);

			music = section(page, 'Music and input');
			header = music.locator('.elemenx-section-header');
			piano = music.getByRole('group', {name: 'Piano', exact: true});

			await piano.scrollIntoViewIfNeeded();

			/* Two octaves from C3 and their last C: fifteen white keys, ten black ones over them. */
			await expect(piano.locator('.elemenx-piano-key.white')).toHaveCount(15);
			await expect(piano.locator('.elemenx-piano-key.black')).toHaveCount(10);
			await expect(piano.locator('.elemenx-piano-key.marked')).toHaveCount(3);
			await expect(piano.locator('.elemenx-piano-name')).toHaveText(['C3', 'C4', 'C5']);

			/* A black key stands over the line between its white keys. */
			expect(await piano.evaluate(function (node) {
				var c = node.querySelector('[data-note="C3"]').getBoundingClientRect();
				var sharp = node.querySelector('[data-note="C#3"]').getBoundingClientRect();

				return Math.abs((sharp.left + sharp.right) / 2 - c.right) < 2;
			})).toBe(true);

			/* A press low on a key is louder than one high on it. */
			c4 = piano.locator('[data-note="C4"]');
			d4 = piano.locator('[data-note="D4"]');

			/*
			 * In view, the box read again before each press: the content built above (the mixer) may move the keys meanwhile
			 * (regression: a press went beside the key under load). A press that played nothing is let go and made again.
			 */
			await expect(async function () {
				await c4.scrollIntoViewIfNeeded();

				box = await c4.boundingBox();

				await page.mouse.move(box.x + box.width / 2, box.y + box.height - 4);
				await page.mouse.down();

				try {
					await expect(header).toContainText('Playing C4 (velocity 1', {timeout: 2000});
				}
				catch (error) {
					await page.mouse.up();

					throw error;
				}
			}).toPass({timeout: 30000});
			await expect(c4).toHaveClass(/pressed/);

			/* A slide onto the next key plays it and lets the first one go. */
			box = await d4.boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height - 4, {steps: 4});

			await expect(header).toContainText('Playing D4');
			await expect(c4).not.toHaveClass(/pressed/);

			await page.mouse.up();

			await expect(header).toContainText('Released D4');

			/* The keys of the computer: A is the first C, X an octave up. */
			await piano.focus();

			await page.keyboard.down('KeyA');

			await expect(header).toContainText('Playing C3');
			await expect(piano.locator('[data-note="C3"]')).toHaveClass(/pressed/);

			await page.keyboard.up('KeyA');

			await expect(header).toContainText('Released C3');

			await page.keyboard.press('KeyX');
			await page.keyboard.down('KeyD');

			await expect(header).toContainText('Playing E4');

			/* The keys the piano in the focus plays are its own: the live keyboards of the page do not show them held. */
			expect(await page.locator('.elemenx-keyboard-key.held').count()).toBe(0);

			await page.keyboard.up('KeyD');

			expect(errors).toEqual([]);
		});

		test('a piano lights its black keys too and names its notes and the keys that play them; a keyboard shows a second layout', async function ({ page }) {
			var errors = captureErrors(page);
			var music;
			var piano;
			var keyboard;
			var colors;

			await open(page, origin, ['Music and input']);

			music = section(page, 'Music and input');
			piano = music.getByRole('group', {name: 'Piano with its keys'});
			keyboard = music.getByRole('group', {name: 'Two layouts'});

			await piano.scrollIntoViewIfNeeded();

			/* A played black key does not look as the others: it takes a tint of the accent over the surface. */
			colors = await piano.evaluate(function (node) {
				var color = function (note) {
					var style = getComputedStyle(node.querySelector('[data-note="' + note + '"]'));

					return style.backgroundImage + ' ' + style.backgroundColor;
				};

				return [color('C#4'), color('D#4')];
			});

			expect(colors[0]).not.toBe(colors[1]);
			await expect(piano.locator('[data-note="C#4"]')).toHaveClass(/pressed/);

			/* Labels 'both': every note by its name, and under it the key of the computer that plays it. */
			await expect(piano.locator('.elemenx-piano-name')).toHaveCount(13);
			await expect(piano.locator('[data-note="C4"] .elemenx-piano-name')).toHaveText('C');
			await expect(piano.locator('[data-note="C#4"] .elemenx-piano-name')).toHaveText('C#');
			await expect(piano.locator('[data-note="C4"] .elemenx-piano-typing')).toHaveText('A');
			await expect(piano.locator('[data-note="C#4"] .elemenx-piano-typing')).toHaveText('W');
			await expect(piano.locator('[data-note="C5"] .elemenx-piano-typing')).toHaveText('K');

			/* Z shifts the keys of the computer an octave down: the first C of this octave is then played by K, the last row. */
			await piano.focus();

			await page.keyboard.press('KeyZ');

			await expect(piano.locator('.elemenx-piano-typing')).toHaveCount(6);
			await expect(piano.locator('[data-note="C4"] .elemenx-piano-typing')).toHaveText('K');

			await page.keyboard.press('KeyX');

			await expect(piano.locator('[data-note="C4"] .elemenx-piano-typing')).toHaveText('A');

			/* Alternate 'ru': the Latin letter large at the top left, the Cyrillic one smaller at the bottom right. */
			await expect(keyboard.locator('[data-code="KeyQ"] .elemenx-keyboard-label')).toHaveText('Q');
			await expect(keyboard.locator('[data-code="KeyQ"] .elemenx-keyboard-second')).toHaveText('Й');
			await expect(keyboard.locator('[data-code="Backquote"] .elemenx-keyboard-second')).toHaveText('Ё');
			await expect(keyboard.locator('[data-code="Period"] .elemenx-keyboard-second')).toHaveText('Ю');
			await expect(keyboard.locator('[data-code="Digit1"] .elemenx-keyboard-second')).toHaveCount(0);
			await expect(keyboard.locator('[data-code="KeyQ"]')).toHaveAttribute('aria-label', 'Q Й');

			expect(await keyboard.evaluate(function (node) {
				var key = node.querySelector('[data-code="KeyQ"]').getBoundingClientRect();
				var first = node.querySelector('[data-code="KeyQ"] .elemenx-keyboard-label').getBoundingClientRect();
				var second = node.querySelector('[data-code="KeyQ"] .elemenx-keyboard-second').getBoundingClientRect();

				return [first.left - key.left < key.width / 2, first.top - key.top < key.height / 2, second.left - key.left > key.width / 2, second.top - key.top > key.height / 2, first.height > second.height];
			})).toEqual([true, true, true, true, true]);

			expect(errors).toEqual([]);
		});

		test('the six themed icon sets load as packs and draw every icon of theirs', async function ({ page }) {
			var errors = captureErrors(page);
			var sets;

			await open(page, origin, ['Icons']);

			sets = page.locator('.ui-kit-themed-set');

			await expect(sets).toHaveCount(6);

			expect(await sets.evaluateAll(function (nodes) {
				return nodes.map(function (node) {
					return node.getAttribute('data-set');
				});
			})).toEqual(['sport', 'racing', 'science', 'art', 'cinema', 'games']);

			await expect(sets.nth(0).locator('.ui-kit-icon')).toHaveCount(53);
			await expect(sets.nth(1).locator('.ui-kit-icon')).toHaveCount(51);
			await expect(sets.nth(2).locator('.ui-kit-icon')).toHaveCount(52);
			await expect(sets.nth(5).locator('.ui-kit-icon')).toHaveCount(50);

			/* Every icon draws the shapes of its symbol. */
			await sets.nth(5).scrollIntoViewIfNeeded();

			await expect.poll(function () {
				return sets.evaluateAll(function (nodes) {
					return nodes.reduce(function (empty, node) {
						return empty + Array.prototype.filter.call(node.querySelectorAll('svg.elemenx-icon'), function (svg) {
							return !svg.children.length;
						}).length;
					}, 0);
				});
			}).toBe(0);

			await expect(page.locator('#elemenx-icons symbol#elemenx-icon-games-gamepad[data-set="games"]')).toHaveCount(1);

			expect(errors).toEqual([]);
		});

		test('a popup opens in the top layer: an ancestor that clips or transforms neither cuts it nor moves it', async function ({ page }) {
			var errors = captureErrors(page);
			var field;
			var popup;

			await open(page, origin, ['Inputs']);

			field = page.locator('.elemenx-field').filter({has: page.locator('.elemenx-select-trigger')}).filter({hasText: 'Round select'}).first();

			await field.scrollIntoViewIfNeeded();

			/* A box that cuts its overflow, with a transform: a fixed panel inside it would be cut and placed by it. */
			await field.evaluate(function (node) {
				node.style.overflow = 'hidden';
				node.style.height = node.offsetHeight + 'px';
				node.style.transform = 'translateX(1px)';
			});

			await field.locator('.elemenx-select-trigger').click();

			popup = field.locator('.elemenx-popup');

			await expect(popup).toBeVisible();

			expect(await popup.evaluate(function (node) {
				var box = node.getBoundingClientRect();
				var anchor = node.closest('.elemenx-field').querySelector('.elemenx-select-trigger').getBoundingClientRect();
				var hit = document.elementFromPoint(box.left + box.width / 2, box.bottom - 6);

				return [node.matches(':popover-open'), node.contains(hit), Math.round(box.top - anchor.bottom), Math.round(box.left - anchor.left)];
			})).toEqual([true, true, 4, 0]);

			await page.keyboard.press('Escape');

			await expect(popup).toBeHidden();
			expect(await popup.evaluate(function (node) {
				return node.matches(':popover-open');
			})).toBe(false);

			expect(errors).toEqual([]);
		});

		test('a settings menu goes into submenus and back, chooses, turns switches, finds rows on every level and follows the keys', async function ({ page }) {
			var errors = captureErrors(page);
			var settings;
			var ios;
			var material;
			var header;

			await open(page, origin, ['Settings menu']);

			settings = section(page, 'Settings menu');
			header = settings.locator('.elemenx-section-header');
			ios = settings.locator('.elemenx-settings-menu.ios');
			material = settings.locator('.elemenx-settings-menu.material');

			await ios.scrollIntoViewIfNeeded();

			/* The two looks: rows on cards with square tiles, rows across with round tiles. */
			expect(await ios.evaluate(function (node) {
				var list = getComputedStyle(node.querySelector('.elemenx-settings-menu-list'));
				var tile = node.querySelector('.elemenx-settings-menu-tile');

				return [list.backgroundColor !== 'rgba(0, 0, 0, 0)', parseFloat(list.borderTopLeftRadius) > 0, tile.offsetWidth, getComputedStyle(tile).borderTopLeftRadius];
			})).toEqual([true, true, 29, '8px']);

			expect(await material.evaluate(function (node) {
				var tile = node.querySelector('.elemenx-settings-menu-tile');

				return [getComputedStyle(node.querySelector('.elemenx-settings-menu-list')).backgroundColor, tile.offsetWidth, getComputedStyle(tile).borderTopLeftRadius];
			})).toEqual(['rgba(0, 0, 0, 0)', 40, '50%']);

			/* A submenu of a choice: a press checks a row, and its label becomes the value of the row above. */
			await ios.getByRole('button', {name: /^Wi-Fi/}).click();

			await expect(ios.locator('.elemenx-settings-menu-title')).toHaveText('Wi-Fi');
			await expect(ios.locator('.elemenx-settings-menu-back')).toHaveText('Settings');
			await expect(ios.locator('.elemenx-settings-menu-group-title')).toHaveText('Networks');
			await expect(ios.getByRole('button', {name: 'Home'})).toHaveAttribute('aria-current', 'true');

			await ios.getByRole('button', {name: 'Office'}).click();

			await expect(header).toContainText('Chose: Office in wifi');
			await expect(ios.getByRole('button', {name: 'Office'})).toHaveAttribute('aria-current', 'true');
			await expect(ios.getByRole('button', {name: 'Home'})).not.toHaveAttribute('aria-current', 'true');

			await ios.locator('.elemenx-settings-menu-back').click();

			await expect(ios.getByRole('button', {name: /^Wi-Fi/}).locator('.elemenx-settings-menu-value')).toHaveText('Office');
			await expect(ios.getByRole('button', {name: /^Wi-Fi/})).toBeFocused();

			/* A switch: the row is the switch. */
			await ios.getByRole('switch', {name: 'Airplane mode'}).click();

			await expect(ios.getByRole('switch', {name: 'Airplane mode'})).toHaveAttribute('aria-checked', 'true');
			await expect(header).toContainText('Airplane mode: on');

			/* The search finds rows on every level, with the menus they are in; a found row does what it does in its menu. */
			await material.getByRole('searchbox', {name: 'Search settings'}).fill('previews');

			await expect(material.locator('.elemenx-settings-menu-row')).toHaveCount(1);
			await expect(material.locator('.elemenx-settings-menu-description')).toHaveText('Notifications');

			await material.locator('.elemenx-settings-menu-row').click();

			await expect(material.locator('.elemenx-settings-menu-title')).toHaveText('Show previews');
			await expect(material.locator('.elemenx-settings-menu-back')).toHaveText('Notifications');
			await expect(material.getByRole('searchbox', {name: 'Search settings'})).toHaveValue('');

			await material.getByRole('searchbox', {name: 'Search settings'}).fill('zzz');

			await expect(material.locator('.elemenx-settings-menu-note')).toHaveText('No settings found');

			await material.getByRole('searchbox', {name: 'Search settings'}).fill('');

			/* The keys: the arrows go through the rows, the right arrow opens a submenu, Escape goes back. */
			await material.getByRole('button', {name: /^Never/}).focus();

			await page.keyboard.press('Escape');

			await expect(material.locator('.elemenx-settings-menu-title')).toHaveText('Notifications');
			await expect(material.getByRole('button', {name: /^Show previews/})).toBeFocused();

			await page.keyboard.press('ArrowLeft');

			await expect(material.locator('.elemenx-settings-menu-title')).toHaveText('Settings');
			await expect(material.getByRole('button', {name: /^Notifications/})).toBeFocused();

			await page.keyboard.press('ArrowDown');

			await expect(material.getByRole('switch', {name: 'Dark mode'})).toBeFocused();

			await page.keyboard.press('ArrowUp');
			await page.keyboard.press('ArrowRight');

			await expect(material.locator('.elemenx-settings-menu-title')).toHaveText('Notifications');
			await expect(material.getByRole('switch', {name: 'Sounds'})).toBeFocused();

			/* A disabled row takes no press. */
			await page.keyboard.press('Escape');

			await expect(material.getByRole('button', {name: 'Beta features'})).toBeDisabled();

			expect(errors).toEqual([]);
		});

		test('a settings menu takes the look of the device when its variant is auto: ios on an Apple device, material on the others', async function ({ page }) {
			var settings;
			var first;

			await page.addInitScript(function () {
				if (sessionStorage.getItem('ui-kit-apple'))
					Object.defineProperty(navigator, 'userAgent', {get: function () {
						return 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
					}});
			});

			await open(page, origin, ['Settings menu']);

			settings = section(page, 'Settings menu');
			first = settings.locator('.elemenx-settings-menu').first();

			await settings.locator('.elemenx-check-label', {hasText: /^Auto$/}).click();

			await expect(first).toHaveClass(/\bmaterial\b/);

			await page.evaluate(function () {
				sessionStorage.setItem('ui-kit-apple', '1');
			});

			await open(page, origin, ['Settings menu']);

			await settings.locator('.elemenx-check-label', {hasText: /^Auto$/}).click();

			await expect(first).toHaveClass(/\bios\b/);
		});

		test('on a phone the catalogue works by touch: fields big enough for iOS not to zoom', async function ({ browser }) {
			var context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
			var page = await context.newPage();
			var errors = captureErrors(page);

			try {
				await open(page, origin);

				/* Under 16 pixels iOS zooms the page in at every focus of a field. */
				expect(await page.evaluate(function () {
					return Array.prototype.filter.call(document.querySelectorAll('.elemenx-input-control, .elemenx-terminal-input, .elemenx-settings-menu-query, .elemenx-table-filter-select, .elemenx-pagination-size, .elemenx-rich-editor-content, .elemenx-code-editor-input'), function (node) {
						return node.offsetWidth && parseFloat(getComputedStyle(node).fontSize) < 16;
					}).length;
				})).toBe(0);

				/* The note of a section never lies over its title: a narrow header puts it beside or under the title. */
				expect(await page.evaluate(function () {
					return Array.prototype.filter.call(document.querySelectorAll('.elemenx-section-header'), function (header) {
						var title = header.querySelector('.elemenx-section-title');
						var aside = header.querySelector('.elemenx-section-aside');
						var a;
						var b;

						if (!title || !aside || !aside.offsetWidth) return false;

						a = title.getBoundingClientRect();
						b = aside.getBoundingClientRect();

						return a.right > b.left + 1 && b.right > a.left + 1 && a.bottom > b.top + 1 && b.bottom > a.top + 1;
					}).length;
				})).toBe(0);

				/* Dashboard and Settings on a phone: the navigation keeps the room of its icons, or goes over the page. */
				expect(await page.evaluate(function () {
					var nav = document.querySelector('.elemenx-dashboard-nav');
					var settings = document.querySelector('.elemenx-settings-nav').getBoundingClientRect();
					var page = document.querySelector('.elemenx-settings-page').getBoundingClientRect();

					return [nav.offsetWidth, getComputedStyle(nav.querySelector('.elemenx-nav-label')).display, Math.round(page.top) >= Math.round(settings.bottom)];
				})).toEqual([64, 'none', true]);

				/* A finger presses 40 pixels: the controls are that tall, and a small button takes a press that far around it. */
				expect(await page.evaluate(function () {
					var button = document.querySelector('.elemenx-button.medium');
					var action = getComputedStyle(document.querySelector('.elemenx-input-action'), '::after');

					return [button.offsetHeight, parseFloat(action.width) >= 40, parseFloat(action.height) >= 40];
				})).toEqual([40, true, true]);

				/* A closed list builds no option: a phone pays for the hundreds of countries and currencies only when it opens. */
				expect(await page.evaluate(function () {
					return [document.querySelectorAll('.elemenx-phone-popup .elemenx-option').length, document.querySelectorAll('.elemenx-select > .elemenx-popup[hidden] .elemenx-popup-entry').length];
				})).toEqual([0, 0]);

				/* A window keeps to the width of its container: the windows of a desktop do not run out of a phone. */
				expect(await page.evaluate(function () {
					return Array.prototype.filter.call(document.querySelectorAll('.elemenx-window:not([hidden])'), function (node) {
						return node.offsetWidth > node.offsetParent.clientWidth + 1;
					}).length;
				})).toBe(0);

				/* No hover on a touch screen: the buttons that showed on hover show for good. */
				expect(await page.evaluate(function () {
					return [getComputedStyle(document.querySelector('.elemenx-chat-message .elemenx-chat-tools')).display !== 'none', getComputedStyle(document.querySelector('.elemenx-tab-close')).visibility];
				})).toEqual([true, 'visible']);

				/* A long press opens the context menu, with no contextmenu event (iOS sends none); the one Android sends after it opens no second menu. */
				await page.locator('[data-file="app.js"]').scrollIntoViewIfNeeded();

				await page.locator('[data-file="app.js"]').evaluate(function (node) {
					var box = node.getBoundingClientRect();
					var point = {bubbles: true, pointerType: 'touch', isPrimary: true, pointerId: 3, clientX: box.left + 20, clientY: box.top + box.height / 2};

					node.dispatchEvent(new PointerEvent('pointerdown', point));
				});

				await page.waitForTimeout(700);

				await page.locator('[data-file="app.js"]').evaluate(function (node) {
					var box = node.getBoundingClientRect();
					var point = {bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true, pointerId: 3, clientX: box.left + 20, clientY: box.top + box.height / 2};

					node.dispatchEvent(new MouseEvent('contextmenu', point));
					node.dispatchEvent(new PointerEvent('pointerup', point));
					node.dispatchEvent(new MouseEvent('click', point));
				});

				await expect(page.locator('#ui-kit-context .elemenx-context-point .elemenx-menu')).toBeVisible();

				await page.keyboard.press('Escape');

				/* Nothing is wider than the phone: the page does not scroll sideways (a long bar of buttons scrolls inside itself). */
				expect(await page.evaluate(function () {
					return [document.documentElement.scrollWidth, window.innerWidth];
				})).toEqual([390, 390]);

				/* A submenu without room beside its item opens under it, a step in, not over it. */
				await page.locator('.elemenx-menu-root').filter({has: page.getByRole('button', {name: 'Edit', exact: true})}).locator('.elemenx-button').first().click();
				await page.getByRole('menuitem', {name: /Paste special/}).click();

				expect(await page.getByRole('menuitem', {name: /Paste special/}).evaluate(function (node) {
					var item = node.getBoundingClientRect();
					var submenu = node.parentNode.querySelector('.elemenx-menu').getBoundingClientRect();

					return [submenu.top >= item.bottom, submenu.left > item.left, submenu.right <= window.innerWidth];
				})).toEqual([true, true, true]);

				await page.keyboard.press('Escape');
				await page.keyboard.press('Escape');

				/* The quick menu of a rich editor stands under the selection, out of the way of the menu of the system above it. */
				await page.locator('.elemenx-rich-editor-content').first().scrollIntoViewIfNeeded();

				expect(await page.locator('.elemenx-rich-editor-content').first().evaluate(async function (node) {
					var text = node.querySelector('p').firstChild;
					var range = document.createRange();
					var menu;

					range.setStart(text, 0);
					range.setEnd(text, 5);

					node.focus();

					getSelection().removeAllRanges();
					getSelection().addRange(range);

					await new Promise(function (resolve) {
						setTimeout(resolve, 300);
					});

					menu = node.closest('.elemenx-rich-editor').querySelector('.elemenx-rich-editor-menu');

					return !!menu && menu.getBoundingClientRect().top > range.getBoundingClientRect().bottom;
				})).toBe(true);

				/* Fit: no group of tiles is wider than the phone; the tiles that do not fit go below. */
				expect(await page.locator('.elemenx-tile-grid').first().evaluate(function (grid) {
					return Array.prototype.every.call(grid.querySelectorAll('.elemenx-tile-group[data-group]'), function (group) {
						return group.getBoundingClientRect().width <= grid.clientWidth + 1;
					});
				})).toBe(true);

				/* A finger that moves over a tile scrolls; held still, it takes the tile. */
				await page.locator('.elemenx-tile-grid').first().locator('.elemenx-tile:not(.locked)').first().scrollIntoViewIfNeeded();

				expect(await page.locator('.elemenx-tile-grid').first().locator('.elemenx-tile:not(.locked)').first().evaluate(async function (tile) {
					var box = tile.getBoundingClientRect();
					var result = [];

					function send (type, dy) {
						tile.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true, pointerId: 9, button: 0, clientX: box.left + 10, clientY: box.top + 10 + dy}));
					}

					function wait (time) {
						return new Promise(function (resolve) {
							setTimeout(resolve, time);
						});
					}

					send('pointerdown', 0);
					send('pointermove', 40);

					result.push(!!document.querySelector('.elemenx-drag-ghost'));

					send('pointerup', 40);

					send('pointerdown', 0);

					await wait(450);

					result.push(tile.classList.contains('held'));

					send('pointermove', 40);

					result.push(!!document.querySelector('.elemenx-drag-ghost'));

					document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));

					await wait(50);

					result.push(!!document.querySelector('.elemenx-drag-ghost'));

					return result;
				})).toEqual([false, true, true, false]);

				expect(errors).toEqual([]);
			}
			finally {
				await context.close();
			}
		});

		test('a mobile menu is a sheet from the bottom: large rows, levels inside it with a way back, Cancel and the shade close it', async function ({ page }) {
			var menu;
			var sheet;

			await open(page, origin, ['Chat', 'Buttons']);

			menu = page.locator('.elemenx-menu-root').filter({has: page.getByRole('button', {name: 'Mobile'})});

			await menu.getByRole('button', {name: 'Mobile'}).click();

			sheet = menu.locator('.elemenx-menu.sheet');

			/* Fixed to the bottom of the viewport, as wide as it, with the title of the menu and rows of 48 pixels. */
			await expect(sheet).toBeVisible();
			await expect(sheet.locator('.elemenx-menu-title')).toHaveText('Mobile');
			await expect(menu.getByRole('menuitem', {name: 'New'})).toBeFocused();
			expect(await sheet.evaluate(async function (node) {
				var box;

				await Promise.all(node.getAnimations().map(function (animation) {
					return animation.finished;
				}));

				box = node.getBoundingClientRect();

				return [Math.round(box.bottom) === window.innerHeight, Math.round(box.width) === document.documentElement.clientWidth, node.querySelector('.elemenx-option').getBoundingClientRect().height];
			})).toEqual([true, true, 48]);

			/* A level opens in the sheet, with a row back to the level above. */
			await sheet.getByRole('menuitem', {name: 'New'}).click();

			await expect(sheet.locator('.elemenx-menu-back')).toHaveText('New');
			await expect(sheet.getByRole('menuitem', {name: 'Folder'})).toBeVisible();

			await sheet.getByRole('menuitem', {name: 'From template'}).click();
			await sheet.getByRole('menuitem', {name: 'Component'}).click();

			await expect(page.getByText('Menu: tpl-component')).toBeVisible();
			await expect(sheet).toHaveCount(0);

			/* Escape goes back a level, then closes; Cancel and the shade close it too. */
			await menu.getByRole('button', {name: 'Mobile'}).click();
			await sheet.getByRole('menuitem', {name: 'New'}).click();

			await page.keyboard.press('Escape');

			await expect(sheet.locator('.elemenx-menu-back')).toHaveCount(0);

			/* A key pressed at once, before the next level renders, still reaches the sheet: it holds the focus meanwhile. */
			await sheet.evaluate(function (node) {
				var row = Array.prototype.filter.call(node.querySelectorAll('[role="menuitem"]'), function (item) {
					return item.textContent.trim() === 'New';
				})[0];

				row.click();

				document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));
			});

			await expect(sheet.locator('.elemenx-menu-back')).toHaveCount(0);
			await expect(sheet.getByRole('menuitem', {name: 'Save'})).toBeVisible();

			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Escape');

			await expect(sheet).toHaveCount(0);

			await menu.getByRole('button', {name: 'Mobile'}).click();
			await sheet.getByRole('button', {name: 'Cancel'}).click();

			await expect(sheet).toHaveCount(0);

			await menu.getByRole('button', {name: 'Mobile'}).click();
			await page.mouse.click(10, 10);

			await expect(sheet).toHaveCount(0);

			/* Sheet="auto" (the menu of a chat message): a sheet on a phone-wide screen. */
			await page.setViewportSize({width: 390, height: 800});

			/* Regression: on a phone the chat gives its width to the messages (no list of conversations beside them). */
			await expect(section(page, 'Chat').locator('.elemenx-chat-sidebar')).toBeHidden();

			await section(page, 'Chat').locator('.elemenx-chat-message .elemenx-chat-text').first().click({button: 'right'});

			await expect(section(page, 'Chat').locator('.elemenx-chat-menu-point .elemenx-menu.sheet')).toBeVisible();
			await expect(section(page, 'Chat').locator('.elemenx-chat-menu-point .elemenx-menu-title')).toHaveText('The build is green again.');
		});

		test('menu opens nested levels and reports the chosen item', async function ({ page }) {
			var menu;

			await open(page, origin, ['Buttons']);

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

		test('tabs declared with their content show the panel of the current one, and make the component of a tab when it first opens', async function ({ page }) {
			var errors = captureErrors(page);
			var tabs;
			var profile;
			var sales;

			await open(page, origin, ['Tabs']);

			tabs = page.getByRole('tablist', {name: 'Declared tabs'}).locator('xpath=..');
			profile = tabs.locator('.elemenx-tab-panel[data-id="profile"]');
			sales = tabs.locator('.elemenx-tab-panel[data-id="sales"]');

			await tabs.scrollIntoViewIfNeeded();

			/* The strip lists the declared tabs; the first one that is not disabled is current, its panel under the strip. */
			await expect(tabs.getByRole('tab')).toHaveText(['Profile', 'Sales', 'Archive']);
			await expect(tabs.getByRole('tab', {name: 'Profile'})).toHaveAttribute('aria-selected', 'true');
			await expect(tabs.getByRole('tab', {name: 'Archive'})).toHaveAttribute('aria-disabled', 'true');
			await expect(profile).toBeVisible();
			await expect(sales).toBeHidden();

			expect(await tabs.evaluate(function (node) {
				var strip = node.querySelector('.elemenx-tabs-list').getBoundingClientRect();
				var panel = node.querySelector('.elemenx-tab-panel.active').getBoundingClientRect();
				var add = node.querySelector('.elemenx-tabs-extra .elemenx-button').getBoundingClientRect();

				return [panel.top >= strip.bottom, Math.abs(add.top + add.height / 2 - (strip.top + strip.height / 2)) < 4];
			})).toEqual([true, true]);

			/* The component of a tab is made only when the tab first opens. */
			await expect(sales.locator('.elemenx-chart')).toHaveCount(0);

			await tabs.getByRole('tab', {name: 'Sales'}).click();

			await expect(sales).toBeVisible();
			await expect(profile).toBeHidden();
			await expect(sales.locator('.elemenx-chart')).toHaveCount(1);
			await expect(sales.locator('.elemenx-chart')).toBeVisible();

			/* Back and forth: the made component stays. */
			await tabs.getByRole('tab', {name: 'Profile'}).click();
			await tabs.getByRole('tab', {name: 'Sales'}).click();

			await expect(sales.locator('.elemenx-chart')).toHaveCount(1);

			/* A disabled tab is not reached by a press. */
			await tabs.getByRole('tab', {name: 'Archive'}).click({force: true});

			await expect(tabs.getByRole('tab', {name: 'Sales'})).toHaveAttribute('aria-selected', 'true');

			expect(errors).toEqual([]);
		});

		test('editor tabs switch and close', async function ({ page }) {
			var editor;

			await open(page, origin, ['Tabs']);

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
			var chooser;

			await open(page, origin, ['Files and drag and drop']);

			gallery = page.locator('.elemenx-upload.gallery');

			/* The Button of the inline variant opens the file dialog: its click event carries no node. */
			chooser = page.waitForEvent('filechooser');

			await page.locator('.elemenx-upload.inline').getByRole('button', {name: /Attach/}).click();

			expect(await chooser).toBeTruthy();

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

			await open(page, origin, ['Selection', 'Tabs', 'Workspace']);

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
			await expect(page.locator('.elemenx-tabs.pill').filter({hasNot: page.getByRole('tablist', {name: 'Declared tabs'})}).locator('.elemenx-tab.active')).toContainText('Billing');

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
			var forced = css.match(/\[data-theme='dark'\],\s*\[data-scheme='dark'\] \{([^}]*)\}/)[1];
			var system = css.match(/\[data-theme='system'\] \{([^}]*)\}/)[1];

			expect(system.replace(/\s+/g, ' ')).toBe(forced.replace(/\s+/g, ' '));

			await page.emulateMedia({colorScheme: 'dark'});

			await open(page, origin, ['Inputs']);

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'system');
			await expect(page.locator('body')).toHaveAttribute('data-scheme', 'dark');
			expect(await surface()).toBe('rgb(29, 32, 37)');

			await page.locator('.ui-kit-intro').getByRole('button', {name: 'Light theme'}).click();

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
			expect(await page.locator('.elemenx-button').first().evaluate(function (node) {
				return getComputedStyle(node).transitionProperty;
			})).not.toMatch(/(^|, )color/);
			expect(await surface()).toBe('rgb(255, 255, 255)');

			await reload(page);

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

			await open(page, origin, ['Dates and time']);

			date = field(page, 'Date');
			iso = field(page, 'ISO date, Monday first');

			await date.getByRole('button', {name: 'Choose a date'}).click();

			await expect(date.locator('.elemenx-calendar-day[data-cursor="true"]')).toBeFocused();
			await expect(date.locator('.elemenx-calendar-day[data-cursor="true"]')).toHaveText('22');

			/* The week starts on Monday by default, whatever the locale (en here would start it on Sunday). */
			await expect(date.locator('.elemenx-calendar-weekday').first()).toHaveText(/^Mo/);

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

			await open(page, origin, ['Dates and time']);

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

			await open(page, origin, ['Dates and time']);

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

			await open(page, origin, ['Section']);

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

			await open(page, origin, ['Table']);

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

		test('a dialog that needs an answer shakes on Escape and the backdrop; Dialogs asks from the code', async function ({ page }) {
			var overlays;
			var required;
			var confirm;
			var note;
			var shaken;

			await open(page, origin, ['Overlays']);

			overlays = section(page, 'Overlays');
			note = overlays.locator('.elemenx-section-header');
			required = page.getByRole('dialog', {name: 'Terms of the beta'});

			await overlays.getByRole('button', {name: 'Required answer'}).click();

			await expect(required).toBeVisible();
			await expect(required.getByRole('button', {name: 'Close'})).toHaveCount(0);

			/* A modal in the top layer at once (a popover, not showModal: no long pause on a large page), modal all the same: the focus goes in and Tab goes round inside it. */
			await expect(required).toHaveAttribute('aria-modal', 'true');
			expect(await required.evaluate(function (node) {
				return [node.matches(':popover-open'), node.contains(document.activeElement)];
			})).toEqual([true, true]);

			for (let i = 0; i < 6; i++)
				await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');

			for (let i = 0; i < 5; i++)
				await page.keyboard.press('Tab');

			expect(await required.evaluate(function (node) {
				return node.contains(document.activeElement);
			})).toBe(true);

			await required.evaluate(function (node) {
				node.testStarts = [];

				node.addEventListener('animationstart', function (event) {
					if (event.target === node)
						node.testStarts.push(event.animationName);
				});
			});

			/* The shake lasts a moment: watched from before the key, a busy page cannot end it between two looks (regression). */
			shaken = await became(page, required, '.refused');

			await page.keyboard.press('Escape');

			await expect(required).toBeVisible();

			await shaken();

			await expect(required).not.toHaveClass(/refused/);

			await page.waitForTimeout(300);

			/* The shake keeps the animation of the opening: when it ends, the dialog does not open again. */
			expect(await required.evaluate(function (node) {
				return node.testStarts;
			})).toEqual(['elemenx-dialog-refuse']);

			/* A press on the backdrop: outside the box of the dialog. */
			shaken = await became(page, required, '.refused');

			await page.mouse.click(5, 5);

			await expect(required).toBeVisible();

			await shaken();

			await required.getByRole('button', {name: 'Accept'}).click();

			await expect(required).toBeHidden();

			/* The focus goes back to the button that opened it. */
			await expect(overlays.getByRole('button', {name: 'Required answer'})).toBeFocused();
			await expect(note).toContainText('Dialog: terms accepted');

			/* Confirm: the actions of the call, no close button, and the answer in the callback. */
			confirm = page.getByRole('dialog', {name: 'Delete the project?'});

			await overlays.getByRole('button', {name: 'Confirm'}).click();

			await expect(confirm).toBeVisible();
			await expect(confirm).toContainText('Its files and its history go for good.');
			await expect(confirm.getByRole('button', {name: 'Close'})).toHaveCount(0);
			await expect(confirm.getByRole('button', {name: 'Delete'})).toHaveClass(/danger/);

			/* A busy page may take the key before the dialog listens: pressed again until it shakes (a shake changes nothing), the shake watched from before. */
			shaken = await became(page, confirm, '.refused');

			await expect(async function () {
				await page.keyboard.press('Escape');

				await shaken(1000);
			}).toPass({timeout: 15000});

			await confirm.getByRole('button', {name: 'Delete'}).click();

			await expect(confirm).toHaveCount(0);
			await expect(note).toContainText('Dialog: confirm: delete');

			/* Alert: dismissible, so Escape closes it with no answer. */
			await overlays.getByRole('button', {name: 'Alert'}).click();

			await expect(page.getByRole('dialog', {name: 'Saved'})).toBeVisible();

			await page.keyboard.press('Escape');

			await expect(page.getByRole('dialog', {name: 'Saved'})).toHaveCount(0);
			await expect(note).toContainText('Dialog: alert: null');
		});

		test('dialog, toast and popover open and close', async function ({ page }) {
			var overlays;
			var dialog;

			await open(page, origin, ['Overlays']);

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

			await open(page, origin, ['Feedback']);

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

		test('a knob turns by a drag up, the keys and the wheel, fills its ring from the origin and resets on a double click', async function ({ page }) {
			var feedback;
			var gain;
			var box;
			var arc;

			await open(page, origin, ['Feedback']);

			feedback = section(page, 'Feedback');
			gain = feedback.getByRole('slider', {name: 'Gain'});
			arc = gain.locator('.elemenx-knob-arc');

			await gain.scrollIntoViewIfNeeded();

			await expect(gain).toHaveAttribute('aria-valuenow', '0');

			/* At the origin the ring has no fill. */
			await expect(arc).toHaveAttribute('stroke-dasharray', '0 50 0 100');

			/* A drag up by a quarter of the sensitivity turns it up by a quarter of the range. */
			box = await gain.boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 50, {steps: 5});
			await page.mouse.up();

			await expect(gain).toHaveAttribute('aria-valuenow', '12');
			await expect(gain).toHaveAttribute('aria-valuetext', '12 dB');
			await expect(gain).toBeFocused();
			await expect(arc).toHaveAttribute('stroke-dasharray', '0 50 25 100');

			await page.keyboard.press('ArrowDown');

			await expect(gain).toHaveAttribute('aria-valuenow', '11');

			await page.keyboard.press('Home');

			await expect(gain).toHaveAttribute('aria-valuenow', '-24');
			await expect(arc).toHaveAttribute('stroke-dasharray', '0 0 50 100');

			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.wheel(0, -100);

			await expect(gain).toHaveAttribute('aria-valuenow', '-23');

			await gain.dblclick();

			await expect(gain).toHaveAttribute('aria-valuenow', '0');
		});

		test('a vertical slider stands upright: its minimum at the bottom, the pointer and the arrows move it up and down', async function ({ page }) {
			var feedback;
			var header;
			var level;
			var track;
			var box;
			var thumb;

			await open(page, origin, ['Feedback']);

			feedback = section(page, 'Feedback');
			header = feedback.locator('.elemenx-section-header');
			level = feedback.getByRole('slider', {name: 'Level'});
			track = feedback.locator('.elemenx-slider.vertical .elemenx-slider-track').first();

			await expect(level).toHaveAttribute('aria-orientation', 'vertical');

			await track.scrollIntoViewIfNeeded();

			box = await track.boundingBox();

			expect(box.height).toBeGreaterThan(box.width * 10);

			/* A press a quarter of the way up the track sets a quarter of the range; the thumb sits there. The box is read again before each press: content built above may move the track meanwhile (regression: a press went beside it under load). */
			await expect(async function () {
				box = await track.boundingBox();

				await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75);

				await expect(header).toContainText('Volume: 25', {timeout: 2000});
			}).toPass({timeout: 30000});

			thumb = await level.boundingBox();

			expect(Math.abs(thumb.y + thumb.height / 2 - (box.y + box.height * 0.75))).toBeLessThan(2);
			expect(Math.abs(thumb.x + thumb.width / 2 - (box.x + box.width / 2))).toBeLessThan(1);

			await level.focus();

			await page.keyboard.press('ArrowUp');

			await expect(header).toContainText('Volume: 26');

			await page.keyboard.press('ArrowRight');

			await expect(header).toContainText('Volume: 27');

			await page.keyboard.press('ArrowDown');

			await expect(header).toContainText('Volume: 26');

			/* The fill rises from the bottom to the thumb. */
			expect(await feedback.locator('.elemenx-slider.vertical .elemenx-slider-fill').first().evaluate(function (node) {
				var fill = node.getBoundingClientRect();
				var track = node.parentNode.getBoundingClientRect();

				return [Math.round(track.bottom - fill.bottom), Math.round((fill.height / track.height) * 100)];
			})).toEqual([0, 26]);
		});

		test('a block frames its content under a title on a band set into the frame, with a note, actions and paddings', async function ({ page }) {
			var errors = captureErrors(page);
			var blocks;

			await open(page, origin, ['Block']);

			blocks = section(page, 'Block').locator('.elemenx-block.framed');

			await blocks.first().scrollIntoViewIfNeeded();

			await expect(blocks).toHaveCount(3);

			expect(await blocks.first().evaluate(function (node) {
				var frame = node.getBoundingClientRect();
				var header = node.querySelector('.elemenx-block-header').getBoundingClientRect();
				var body = node.querySelector('.elemenx-block-body').getBoundingClientRect();

				return [node.querySelector('[role="heading"]').textContent, node.querySelector('[role="heading"]').getAttribute('aria-level'), node.querySelector('.elemenx-block-note').textContent, node.querySelectorAll('.elemenx-block-actions .elemenx-button').length, header.left - frame.left <= 1 && frame.right - header.right <= 1, Math.round(body.left - frame.left), node.querySelectorAll('.elemenx-block-body .elemenx-meter').length];
			})).toEqual(['Reactor', '3', 'Ring B', 1, true, 17, 2]);

			/*
			 * HeaderShape trapezoid: a folder. The title and the note on a tab as wide as their text, in the color of the
			 * band as the body below; the top of the body begins where the slope of the tab ends, the actions beyond it. The
			 * top edge is the border of the body itself: no line of the header of its own, that left a notch at its end.
			 */
			expect(await blocks.nth(1).evaluate(function (node) {
				var frame = node.getBoundingClientRect();
				var header = node.querySelector('.elemenx-block-header');
				var bar = header.getBoundingClientRect();
				var tab = node.querySelector('.elemenx-block-tab');
				var box = tab.getBoundingClientRect();
				var line = getComputedStyle(header, '::after');
				var body = getComputedStyle(node, '::before');
				var actions = node.querySelector('.elemenx-block-actions').getBoundingClientRect();

				return [node.classList.contains('trapezoid'), Math.round(box.top - frame.top), Math.round(box.left - frame.left), box.width < bar.width / 2, getComputedStyle(tab).backgroundColor === body.backgroundColor, line.content, body.borderTopStyle, Math.round(parseFloat(body.top) - bar.height), actions.left > box.right + 24, getComputedStyle(header).backgroundColor];
			})).toEqual([true, 0, 0, true, true, 'none', 'solid', 0, true, 'rgba(0, 0, 0, 0)']);

			/* The default shape keeps the tab out of the layout: the band runs across the frame. */
			expect(await blocks.first().evaluate(function (node) {
				return getComputedStyle(node.querySelector('.elemenx-block-tab')).display;
			})).toBe('contents');

			expect(await blocks.nth(2).evaluate(function (node) {
				return [node.classList.contains('compact'), Math.round(node.querySelector('.elemenx-block-body').getBoundingClientRect().left - node.getBoundingClientRect().left)];
			})).toEqual([true, 9]);

			expect(errors).toEqual([]);
		});

		test('properties set a value apart from its name, in one column or two, with tones and values of their own', async function ({ page }) {
			var errors = captureErrors(page);
			var list;

			await open(page, origin, ['Block', 'Properties']);

			list = section(page, 'Block').locator('.elemenx-properties[aria-label="Service"]');

			await list.scrollIntoViewIfNeeded();

			expect(await list.evaluate(function (node) {
				var rows = node.querySelectorAll('.elemenx-property');
				var first = rows[0].getBoundingClientRect();
				var second = rows[1].getBoundingClientRect();

				return [node.tagName, node.classList.contains('double'), rows.length, Math.round(first.top) === Math.round(second.top) && second.left > first.right, rows[0].querySelector('dt').textContent, rows[0].querySelector('dd').textContent.trim(), rows[3].querySelector('dd code').textContent, getComputedStyle(rows[3].querySelector('.elemenx-property-text')).display, getComputedStyle(rows[2].querySelector('dd')).textAlign];
			})).toEqual(['DL', true, 4, true, 'Uptime', '99.9%', 'v2.32', 'none', 'end']);

			/* Tones color the value with the colors of the theme. */
			expect(await list.evaluate(function (node) {
				var tone = function (name) {
					var probe = document.createElement('span');
					var color;

					probe.style.color = 'var(--elemenx-' + name + ')';

					node.appendChild(probe);

					color = getComputedStyle(probe).color;

					probe.remove();

					return color;
				};

				return [getComputedStyle(node.querySelector('.elemenx-property.success dd')).color === tone('success'), getComputedStyle(node.querySelector('.elemenx-property.danger dd')).color === tone('danger')];
			})).toEqual([true, true]);

			/* The section of their own: one column, two columns with every tone, values of their own in the slot. */
			expect(await section(page, 'Properties').evaluate(function (node) {
				var lists = node.querySelectorAll('.elemenx-properties');

				return [lists.length, lists[0].querySelectorAll('.elemenx-property').length, lists[1].classList.contains('double'), Array.prototype.map.call(lists[1].querySelectorAll('.elemenx-property'), function (row) {
					return row.className.replace('elemenx-property', '').trim();
				}), lists[2].querySelector('.elemenx-property dd code').textContent, lists[2].querySelector('dd .elemenx-badge').textContent];
			})).toEqual([3, 4, true, ['success', 'danger', 'warning', 'accent'], 'v2.32.0', 'Live']);

			expect(errors).toEqual([]);
		});

		test('native features fall back to the web in a browser: a file picker, a download, confirm, a new tab', async function ({ page }) {
			var errors = captureErrors(page);
			var native;
			var state;
			var chooser;
			var download;
			var popup;

			await page.context().route('https://example.com/**', function (route) {
				route.fulfill({contentType: 'text/html', body: '<title>Example</title>'});
			});

			await open(page, origin, ['Native']);

			native = section(page, 'Native');
			state = native.locator('.ui-kit-native-state');

			await native.scrollIntoViewIfNeeded();

			await expect(native.locator('.elemenx-section-header')).toContainText('Platform: web');

			/* Open: the file picker of the browser, the file read as text. */
			chooser = page.waitForEvent('filechooser');

			await native.getByRole('button', {name: 'Open a file'}).click();
			(await chooser).setFiles({name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Hello')});

			await expect(state).toHaveText('notes.txt · 5 characters');

			/* Save: a download of the text. */
			download = page.waitForEvent('download');

			await native.getByRole('button', {name: 'Save a file'}).click();

			expect((await download).suggestedFilename()).toBe('notes.txt');
			await expect(state).toHaveText('Saved as a download');

			/* Message: confirm, the first button for OK, the second for Cancel. */
			page.once('dialog', function (dialog) {
				dialog.dismiss();
			});

			await native.getByRole('button', {name: 'Ask'}).click();

			await expect(state).toHaveText('Pressed: Discard');

			/* External: a new tab. */
			popup = page.context().waitForEvent('page');

			await native.getByRole('button', {name: 'Open example.com'}).click();

			expect((await popup).url()).toBe('https://example.com/');
			await expect(state).toHaveText('Opened example.com');

			/* A feature the web has not: an error that says so. */
			await native.getByRole('button', {name: 'Set the menu'}).click();

			await expect(state).toHaveText('Elemenx Native menu needs a native program');

			await native.getByRole('button', {name: 'Global hotkey'}).click();

			await expect(state).toHaveText('Elemenx Native shortcuts needs a native program');

			/* Power on the web: the battery of the Battery Status API. */
			await native.getByRole('button', {name: 'Power'}).click();

			await expect(state).toHaveText(/^Power: (on battery|plugged in) · (active|unknown)$/);

			expect(errors).toEqual([]);
		});

		test('native features go through the bridge of a native program, and its events come back', async function ({ page }) {
			var errors = captureErrors(page);
			var native;
			var state;
			var calls;

			/* The bridge a program of elemenx build --native desktop gives the page (preload.js), faked. */
			await page.addInitScript(function () {
				var listeners = {};

				window.nativeCalls = [];
				window.nativeListeners = listeners;
				window.ElemenxNative = {
					Platform: 'electron',
					Features: ['window', 'dialogs', 'menu', 'tray', 'external', 'taskbar'],
					Call: function (name, args, callback) {
						window.nativeCalls.push({Name: name, Args: JSON.parse(JSON.stringify(args))});

						if (name === 'open') callback(null, [{Name: 'report.md', Path: 'C:/report.md', Size: 9, Text: '# Report!'}]);
						else if (name === 'save') callback(null, {Path: 'C:/notes.txt'});
						else if (name === 'message') callback(null, 0);
						else callback(null, null);
					},
					On: function (name, callback) {
						(listeners[name] = listeners[name] || []).push(callback);

						return function () {};
					}
				};
			});

			await open(page, origin, ['Native']);

			native = section(page, 'Native');
			state = native.locator('.ui-kit-native-state');

			await native.scrollIntoViewIfNeeded();

			await expect(native.locator('.elemenx-section-header')).toContainText('Platform: electron');

			await native.getByRole('button', {name: 'Open a file'}).click();

			await expect(state).toHaveText('report.md · 9 characters');

			await native.getByRole('button', {name: 'Save a file'}).click();

			await expect(state).toHaveText('Saved to C:/notes.txt');

			await native.getByRole('button', {name: 'Ask'}).click();

			await expect(state).toHaveText('Pressed: Keep');

			await native.getByRole('button', {name: 'Set the menu'}).click();

			await expect(state).toHaveText('The menu is set');

			/* The calls of the buttons; the Theme gives the program its scheme too (Native.Scheme), as it starts. */
			calls = await page.evaluate(function () {
				return window.nativeCalls.filter(function (call) {
					return call.Name !== 'scheme';
				});
			});

			expect(calls.map(function (call) {
				return call.Name;
			})).toEqual(['open', 'save', 'message', 'menu']);
			expect(calls[0].Args).toEqual({Accept: ['.txt', '.md', '.json'], Multiple: false, Read: 'text'});
			expect(calls[1].Args).toEqual({Name: 'notes.txt', Text: 'Saved by Elemenx Native'});
			expect(calls[2].Args).toEqual({Title: 'Elemenx', Text: 'Keep the changes?', Buttons: ['Keep', 'Discard'], Kind: 'question'});
			expect(calls[3].Args.Items[0].Items[0]).toEqual({ID: 'open', Label: 'Open', Hotkey: 'CmdOrCtrl+O'});

			/* A click of the menu of the program comes back as the menu event. */
			await page.evaluate(function () {
				window.nativeListeners.menu.forEach(function (callback) {
					callback({ID: 'about'});
				});
			});

			await expect(state).toHaveText('Menu: about');

			expect(errors).toEqual([]);
		});

		test('meters fill a bar across or upwards, or a dial with ticks, marks, a needle and a middle of their own', async function ({ page }) {
			var errors = captureErrors(page);
			var feedback;

			await open(page, origin, ['Feedback']);

			feedback = section(page, 'Feedback');

			await feedback.locator('.ui-kit-meters').scrollIntoViewIfNeeded();

			/* Upwards: the fill grows from the bottom, the value is over the bar and the label under it. */
			expect(await feedback.getByRole('meter', {name: 'Fuel'}).evaluate(function (node) {
				var track = node.querySelector('.elemenx-meter-track').getBoundingClientRect();
				var fill = node.querySelector('.elemenx-meter-fill').getBoundingClientRect();

				return [node.classList.contains('vertical'), Math.round(fill.height / track.height * 100), Math.round(fill.bottom) === Math.round(track.bottom), node.querySelector('.elemenx-meter-value').getBoundingClientRect().bottom <= track.top, node.querySelector('.elemenx-meter-label').getBoundingClientRect().top >= track.bottom];
			})).toEqual([true, 72, true, true, true]);

			/* A dial: the fill of its ring is the share of the range, its ticks spread along it, the value in its middle. */
			expect(await feedback.getByRole('meter', {name: 'Speed'}).evaluate(function (node) {
				return [node.classList.contains('dial'), Math.round(parseFloat(getComputedStyle(node.querySelector('.elemenx-meter-arc')).strokeDasharray.replace(/^calc\(/, ''))), node.querySelectorAll('.elemenx-meter-tick').length, node.querySelector('.elemenx-meter-needle') === null, node.querySelector('.elemenx-meter-center .elemenx-meter-value').textContent, getComputedStyle(node.querySelector('.elemenx-meter-center .elemenx-meter-value')).display !== 'none'];
			})).toEqual([true, 53, 9, true, '64', true]);

			/* With a needle turned to the value, the marks of Low and High, and its own middle in place of the value. */
			expect(await feedback.getByRole('meter', {name: 'Shields'}).evaluate(function (node) {
				var needle = new DOMMatrix(getComputedStyle(node.querySelector('.elemenx-meter-needle')).transform);

				return [node.getAttribute('aria-valuenow'), node.querySelectorAll('.elemenx-meter-face .elemenx-meter-mark').length, Math.round(Math.atan2(needle.b, needle.a) * 180 / Math.PI), node.querySelector('.elemenx-meter-content').textContent, getComputedStyle(node.querySelector('.elemenx-meter-center .elemenx-meter-value')).display];
			})).toEqual(['72', 2, Math.round(0.72 * 270 - 360), 'A1', 'none']);

			/* Without the marks of Low and High (the ticks stay), with Min and Max at the ends, the value in a frame below. */
			expect(await feedback.getByRole('meter', {name: 'Thrust'}).evaluate(function (node) {
				var face = node.querySelector('.elemenx-meter-face').getBoundingClientRect();
				var readout = node.querySelector('.elemenx-meter-readout');

				return [node.querySelectorAll('.elemenx-meter-face .elemenx-meter-mark').length, node.querySelectorAll('.elemenx-meter-tick').length, node.querySelector('.elemenx-meter-min').textContent, node.querySelector('.elemenx-meter-max').textContent, readout.textContent, Math.round(readout.getBoundingClientRect().left + readout.getBoundingClientRect().width / 2) === Math.round(face.left + face.width / 2), readout.getBoundingClientRect().top > face.top + face.height / 2, node.querySelector('.elemenx-meter-center .elemenx-meter-value') === null];
			})).toEqual([0, 3, '0', '100', '73%', true, true, true]);

			/* A bar with its value in the corner, over the end of the track (over Max), and Min and Max under it. */
			expect(await feedback.getByRole('meter', {name: 'Pressure'}).evaluate(function (node) {
				var track = node.querySelector('.elemenx-meter-track').getBoundingClientRect();
				var readout = node.querySelector('.elemenx-meter-readout').getBoundingClientRect();

				return [node.querySelector('.elemenx-meter-readout').textContent, Math.round(readout.right) === Math.round(track.right), readout.bottom <= track.top, node.querySelector('.elemenx-meter-range').textContent.replace(/\s+/g, ''), node.querySelector('.elemenx-meter-head .elemenx-meter-value') === null];
			})).toEqual(['42 kPa', true, true, '080', true]);

			/* A bar across stays as it was: its fill is as wide as the share. */
			expect(await feedback.getByRole('meter', {name: 'Battery'}).evaluate(function (node) {
				return [node.classList.contains('horizontal'), Math.round(node.querySelector('.elemenx-meter-fill').getBoundingClientRect().width / node.querySelector('.elemenx-meter-track').getBoundingClientRect().width * 100), node.querySelector('.elemenx-meter-dial').hidden];
			})).toEqual([true, 72, true]);

			expect(errors).toEqual([]);
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

			await open(page, origin, ['Files and drag and drop', 'Inputs']);

			files = section(page, 'Files and drag and drop');
			task = files.locator('.ui-kit-task', {hasText: 'Design tokens'});
			done = files.locator('.ui-kit-board', {hasText: 'Done'});

			await task.scrollIntoViewIfNeeded();

			/* Both in view: the target may scroll the item, which is read again then. */
			await settled(task);

			to = await settled(done);
			from = await settled(task);

			await grab(page, from);

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

			await settled(todo.locator('.ui-kit-task').last());

			to = await settled(todo.locator('.ui-kit-task').first());
			from = await settled(todo.locator('.ui-kit-task').last());

			await grab(page, from);

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

			await expect.poll(async function () {
				return (await notes.boundingBox()).height;
			}).toBeGreaterThan(before + 40);

			await handle.focus();

			await page.keyboard.press('ArrowUp');

			await expect.poll(async function () {
				return (await notes.boundingBox()).height;
			}).toBeLessThan(before + 48);
		});

		test('phone guide keeps the template and lists every country', async function ({ page }) {
			var skip;
			var input;
			var phone;
			var codes;

			await open(page, origin, ['Payment, phone and money', 'Forms']);

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

			await search(page, phone, 'Japan');

			await page.keyboard.press('Enter');

			await expect(phone.locator('.elemenx-phone-country')).toContainText('JP');
			await expect(phone.locator('input[type="tel"]')).toHaveValue(/^\+81 /);

			await phone.locator('.elemenx-phone-country').click();

			codes = await phone.locator('.elemenx-popup .elemenx-option .elemenx-phone-code').allTextContents();

			expect(codes.length).toBeGreaterThan(200);
			expect(codes.slice().sort()).toEqual(codes);

			await search(page, phone, 'Moldova');

			await page.keyboard.press('Enter');

			await phone.locator('input[type="tel"]').fill('');
			await phone.locator('input[type="tel"]').pressSequentially('69123456');

			await expect(phone.locator('input[type="tel"]')).toHaveValue('+373 69 12 34 56');
		});

		test('a phone number of another country shows in the country its code names, and stays in it while it is edited', async function ({ page }) {
			var errors = captureErrors(page);
			var phone;
			var input;

			await open(page, origin, ['Payment, phone and money']);

			phone = field(page, 'Phone of another country');
			input = phone.locator('input[type="tel"]');

			await phone.scrollIntoViewIfNeeded();

			await expect(phone.locator('.elemenx-phone-country')).toContainText('GB');
			await expect(input).toHaveValue(/^\+44 /);
			expect((await input.inputValue()).replace(/\D/g, '')).toBe('447911123456');

			await input.click();
			await input.press('End');
			await input.press('Backspace');

			await expect(phone.locator('.elemenx-phone-country')).toContainText('GB');
			expect((await input.inputValue()).replace(/\D/g, '')).toBe('44791112345');
			expect(errors).toEqual([]);
		});

		test('money input formats the amount of its currency and file icons follow the format', async function ({ page }) {
			var money;
			var icons;

			await open(page, origin, ['Icons', 'Payment, phone and money']);

			money = field(page, 'Money');
			icons = section(page, 'Icons');

			await money.locator('.elemenx-money-input input').fill('1234.567');
			await money.locator('.elemenx-money-input input').blur();

			await expect(money.locator('.elemenx-money-input input')).toHaveValue(/1.?234[.,]56/);
			await expect(money.locator('.elemenx-caption')).toHaveText('USD 1234.56');

			await money.locator('.elemenx-select-trigger').click();

			await search(page, money, 'JPY');

			await page.keyboard.press('Enter');

			await expect(money.locator('.elemenx-caption')).toHaveText('JPY 1235');

			await expect(icons.locator('.ui-kit-icon[title="pack.tar.gz"] svg')).toHaveAttribute('data-icon', 'files:tar-gz');
			await expect(icons.locator('.ui-kit-icon[title="Dockerfile"] svg')).toHaveAttribute('data-icon', 'files:dockerfile');
			await expect(icons.locator('.ui-kit-icon[title="unknown.xyz"] svg')).toHaveAttribute('data-icon', 'file');
			await expect(icons.locator('.ui-kit-icon[title="file.rb"] svg')).toHaveAttribute('data-icon', 'files:rb');
			await expect(icons.locator('.ui-kit-icon[title="CMakeLists.txt"] svg')).toHaveAttribute('data-icon', 'files:cmake');
			await expect(icons.locator('.ui-kit-icon[title="sketch.ino"] svg')).toHaveAttribute('data-icon', 'files:ino');
			await expect(icons.locator('.ui-kit-icon[title="sketch.ino"] svg text')).toHaveText('INO');
			expect(await icons.locator('.ui-kit-icon svg[data-icon^="files:"]').count()).toBeGreaterThan(170);
		});

		test('workspace shows the tool windows the page puts in it and resizes them', async function ({ page }) {
			var workspace;
			var left;
			var handle;
			var box;

			await open(page, origin, ['Workspace', 'Terminal']);

			workspace = section(page, 'Workspace').locator('.elemenx-workspace').first();
			left = workspace.locator('.elemenx-workspace-panel.left');
			handle = left.locator(':scope > .elemenx-resize-handle.right');

			await expect(left).toBeVisible();
			await expect.poll(async function () {
				return (await left.boundingBox()).width;
			}).toBe(280);

			/* A busy page may take the key before the handle listens: pressed again only while the width has not moved (regression: one press was lost under load). */
			await expect(async function () {
				if ((await left.boundingBox()).width === 280) {
					await handle.focus();

					await page.keyboard.press('ArrowRight');
				}

				await expect.poll(async function () {
					return (await left.boundingBox()).width;
				}, {timeout: 2000}).toBe(288);
			}).toPass({timeout: 30000});

			/* The handle in view and its box read once the width above is in place: a press where it was went beside it (regression: under load). */
			await handle.scrollIntoViewIfNeeded();

			box = await handle.boundingBox();

			await page.mouse.move(box.x + 2, box.y + 100);
			await page.mouse.down();
			await page.mouse.move(box.x + 42, box.y + 100, {steps: 4});
			await page.mouse.up();

			await expect.poll(async function () {
				return (await left.boundingBox()).width;
			}).toBe(328);

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

			await open(page, origin, ['Table']);

			wrap = page.locator('.elemenx-table-wrap').first();

			expect(await wrap.evaluate(function (node) {
				return node.scrollWidth - node.clientWidth;
			})).toBe(0);
		});

		test('chat keeps to its last message when what it holds grows later: a picture that loads, more messages', async function ({ page }) {
			var list;
			var atEnd;

			/* A sticker that comes a second late, after the message that shows it. */
			await page.route('**/data/stickers/love.svg?late', async function (route) {
				await new Promise(function (resolve) {
					setTimeout(resolve, 1000);
				});

				await route.continue();
			});

			await open(page, origin, ['Chat']);

			list = section(page, 'Chat').locator('.elemenx-chat-messages');
			atEnd = function () {
				return list.evaluate(function (node) {
					return node.scrollHeight - node.scrollTop - node.clientHeight < 2;
				});
			};

			await list.scrollIntoViewIfNeeded();

			/* Messages enough to scroll, then a late picture at the end. */
			await list.evaluate(function (node) {
				var i = 0;
				var picture = document.createElement('img');

				while (i < 12) {
					node.appendChild(document.createElement('p')).textContent = 'Earlier message ' + i;

					i++;
				}

				picture.src = '/data/stickers/love.svg?late';
				picture.style.display = 'block';
				picture.style.width = '200px';

				node.appendChild(picture);
			});

			await expect.poll(atEnd).toBe(true);
			await expect.poll(function () {
				return list.evaluate(function (node) {
					return node.lastElementChild.complete && node.lastElementChild.naturalWidth > 0;
				});
			}, {timeout: 10000}).toBe(true);
			await expect.poll(atEnd).toBe(true);
		});

		test('chat shows the avatar on the newest message of a run from one author', async function ({ page }) {
			var messages;

			await open(page, origin, ['Chat']);

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

		test('chat messages show their state, open their menu by a right click or the dots, and sum up reactions and views', async function ({ page }) {
			var chat;
			var messages;
			var merged;
			var summary;
			var box;

			await open(page, origin, ['Chat']);

			chat = section(page, 'Chat');
			messages = chat.locator('.elemenx-chat-message');
			merged = messages.filter({hasText: 'Looks good, merging it now.'});

			/* States: edited, delivered (two checks), read (two checks in the accent), and the views. */
			await expect(messages.filter({hasText: 'Can you check the new table?'}).locator('.elemenx-chat-edited')).toHaveText('edited');
			await expect(messages.filter({hasText: 'Can you check the new table?'}).locator('.elemenx-chat-edited')).toHaveAttribute('title', 'Edited at 10:04');
			await expect(messages.filter({hasText: 'The release notes are next.'}).locator('.elemenx-chat-status.delivered svg[data-icon="check-double"]')).toHaveCount(1);
			await expect(merged.locator('.elemenx-chat-status.read svg[data-icon="check-double"]')).toHaveCount(1);
			await expect(merged.locator('.elemenx-chat-views')).toHaveText('3');
			await expect(merged.locator('.elemenx-chat-reaction').first()).toHaveAttribute('title', 'Grace Hopper, Alan Turing');

			/*
			 * Regression: the buttons of a message touch its bubble (not the wider row of its reactions), and their box runs
			 * along the bubble, so the pointer gets to them from the middle of the bubble without the message losing it.
			 */
			await merged.locator('.elemenx-chat-bubble').hover();

			expect(await merged.evaluate(function (node) {
				var bubble = node.querySelector('.elemenx-chat-bubble').getBoundingClientRect();
				var tools = node.querySelector('.elemenx-chat-tools').getBoundingClientRect();
				var beside = document.elementFromPoint(bubble.left - 2, bubble.top + bubble.height * 0.75);

				return [Math.round(tools.right - bubble.left), Math.round(tools.height - bubble.height), !!beside && !!beside.closest('.elemenx-chat-tools')];
			})).toEqual([0, 0, true]);

			/* The summary: all reactions with who gave them, one emoji, and who has seen the message. */
			await merged.scrollIntoViewIfNeeded();
			await merged.locator('.elemenx-chat-views').click();

			summary = merged.locator('.elemenx-chat-summary');

			await expect(summary).toBeVisible();
			await expect(summary.getByRole('tab')).toHaveText(['All 3', '🎉 2', '👍 1', '3']);
			await expect(summary.locator('.elemenx-chat-summary-name')).toHaveText(['Grace Hopper', 'Alan Turing', 'Me']);

			await summary.getByRole('tab', {name: '🎉 2'}).click();

			await expect(summary.locator('.elemenx-chat-summary-name')).toHaveText(['Grace Hopper', 'Alan Turing']);

			await summary.getByRole('tab').last().click();

			await expect(summary.locator('.elemenx-chat-summary-name')).toHaveText(['Grace Hopper', 'Alan Turing', 'Ada Lovelace']);
			await expect(summary.locator('.elemenx-chat-summary-note')).toHaveText(['10:06', '10:11', '10:15']);

			await page.keyboard.press('Escape');

			await expect(summary).toBeHidden();

			/* The menu by a right click, at the pointer: an action of the author. */
			box = await merged.locator('.elemenx-chat-text').boundingBox();

			await page.mouse.click(box.x + 10, box.y + 5, {button: 'right'});

			await expect(merged.locator('.elemenx-chat-menu-point .elemenx-option')).toHaveText(['Reply', 'Copy text', 'Select', 'Edit', 'Delete', 'Reactions and views']);

			await merged.locator('.elemenx-chat-menu-point .elemenx-option', {hasText: 'Edit'}).click();

			await expect(chat.locator(':scope > .elemenx-section-header .elemenx-caption')).toHaveText('Edit: Looks good, merging it now.');
			await expect(messages.filter({hasText: 'merging it now. (updated)'}).locator('.elemenx-chat-edited')).toHaveAttribute('title', 'Edited now');

			/* The dots of a message of another author: no edit or delete; the summary from the menu. */
			await messages.first().hover();
			await messages.first().getByRole('button', {name: 'Message actions'}).click();

			await expect(messages.first().locator('.elemenx-chat-menu-point .elemenx-option')).toHaveText(['Reply', 'Copy text', 'Select', 'Reactions and views']);

			await messages.first().locator('.elemenx-chat-menu-point .elemenx-option', {hasText: 'Reactions and views'}).click();

			await expect(messages.first().locator('.elemenx-chat-summary-empty')).toBeVisible();
		});

		test('gallery shows one picture with its caption, goes by arrows, dots, thumbnails, keys and swipes, and plays by itself', async function ({ page }) {
			var block;
			var gallery;
			var plain;
			var note;

			await page.clock.install();

			await open(page, origin, ['Gallery']);

			block = section(page, 'Gallery');
			gallery = block.locator('.elemenx-gallery').first();
			plain = block.locator('.elemenx-gallery').nth(1);
			note = block.locator(':scope > .elemenx-section-header .elemenx-caption');

			await gallery.scrollIntoViewIfNeeded();

			/* The first picture with its title, description and tags; the others are hidden from the reader. */
			await expect(gallery.locator('.elemenx-gallery-slide.active .elemenx-gallery-title')).toHaveText('Mountains');
			await expect(gallery.locator('.elemenx-gallery-slide.active .elemenx-gallery-tag')).toHaveText(['nature', 'cold']);
			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('1 / 4');
			await expect(gallery.locator('.elemenx-gallery-slide').nth(1)).toHaveAttribute('aria-hidden', 'true');

			/* Next, a dot, a thumbnail, the keys; round the ends. */
			await gallery.getByRole('button', {name: 'Next picture'}).click();

			await expect(note).toHaveText('Picture 2');
			await expect(gallery.locator('.elemenx-gallery-slide.active .elemenx-gallery-title')).toHaveText('Sea');

			await gallery.locator('.elemenx-gallery-dot').nth(3).click();

			await expect(gallery.locator('.elemenx-gallery-counter')).toHaveText('4 / 4');
			await expect(gallery.locator('.elemenx-gallery-slide.active .elemenx-gallery-caption')).toHaveText('Cover');

			await gallery.locator('.elemenx-gallery-thumb').nth(2).click();

			await expect(gallery.locator('.elemenx-gallery-slide.active .elemenx-gallery-title')).toHaveText('City');

			await gallery.focus();

			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowRight');

			await expect(note).toHaveText('Picture 1');

			await page.keyboard.press('End');

			await expect(note).toHaveText('Picture 4');

			/* A press on the picture selects its item. */
			await gallery.locator('.elemenx-gallery-slide.active img').click();

			await expect(note).toHaveText('Picture 4 · Opened: Cover');

			/* The caption follows the options: no description, no tags. */
			await page.keyboard.press('Home');

			await block.locator('.elemenx-check-label', {hasText: /^Description$/}).click();
			await block.locator('.elemenx-check-label', {hasText: /^Tags$/}).click();

			await expect(gallery.locator('.elemenx-gallery-slide.active .elemenx-gallery-caption')).toHaveText('Mountains');

			/* Autoplay: the next picture every 3 s, the previous one backwards; a button pauses it (the clock runs only when told). */
			await page.clock.pauseAt(Date.now() + 1000);

			await block.locator('.elemenx-check-label', {hasText: /^Autoplay$/}).click();

			await page.mouse.move(0, 0);
			await page.clock.runFor(3300);

			await expect(note).toHaveText(/^Picture 2/);

			await block.locator('.elemenx-check-label', {hasText: /^Backwards$/}).click();

			await page.mouse.move(0, 0);
			await page.clock.runFor(3300);

			await expect(note).toHaveText(/^Picture 1/);

			await gallery.getByRole('button', {name: 'Pause'}).click();

			await page.mouse.move(0, 0);
			await page.clock.runFor(7000);

			await expect(note).toHaveText(/^Picture 1/);
			await expect(gallery.getByRole('button', {name: 'Play'})).toHaveAttribute('aria-pressed', 'true');

			/* The second gallery: the caption under the picture, no dots or counter, and no going round at the ends. */
			await expect(plain.locator('.elemenx-gallery-dots')).toHaveCount(0);
			await expect(plain.locator('.elemenx-gallery-counter')).toHaveCount(0);
			await expect(plain).toHaveClass(/caption-below/);
			await expect(plain.getByRole('button', {name: 'Previous picture'})).toBeDisabled();
		});

		test('steps show several active steps and the chronicle lists the activity', async function ({ page }) {
			var block;
			var steps;

			await open(page, origin, ['Steps and timeline']);

			block = section(page, 'Steps and timeline');
			steps = block.locator('.elemenx-steps').first().locator('.elemenx-step');

			await expect(steps).toHaveClass([/done/, /active/, /active/, /pending/]);
			await expect(block.locator('.elemenx-steps.vertical')).toHaveCount(1);

			await steps.nth(2).locator('.elemenx-step-node').click();

			await expect(steps).toHaveClass([/done/, /done/, /active/, /pending/]);
			await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step');

			/* A Readonly step is no control: no button, no focus, a press changes nothing; it does not look disabled. */
			await expect(steps.nth(3)).toHaveClass(/readonly/);
			await expect(steps.nth(3).locator('button')).toHaveCount(0);
			await expect(steps.nth(3).locator('.elemenx-step-node')).toHaveAttribute('role', 'img');

			await steps.nth(3).locator('.elemenx-step-node').click();

			await expect(steps).toHaveClass([/done/, /done/, /active/, /pending/]);
			await expect(steps.nth(3).locator('.elemenx-step-node')).not.toBeFocused();
			expect(await steps.nth(3).evaluate(function (node) {
				return getComputedStyle(node).opacity;
			})).toBe('1');

			/* Steps that are not Clickable are a timeline: no buttons at all. */
			await expect(block.locator('.elemenx-steps.vertical .elemenx-step')).toHaveCount(4);
			await expect(block.locator('.elemenx-steps.vertical button')).toHaveCount(0);

			await expect(block.locator('.elemenx-chronicle-item')).toHaveCount(8);
			await expect(block.locator('.elemenx-chronicle-item').nth(4)).toContainText('The table should keep its header while scrolling.');
			await expect(block.locator('.elemenx-chronicle-item.small')).toHaveCount(3);
			await expect(block.locator('.elemenx-chronicle-item.dot')).toHaveCount(2);
			await expect(block.locator('.elemenx-chronicle-item.dot .elemenx-icon')).toHaveCount(0);
			await expect.poll(async function () {
				return (await block.locator('.elemenx-chronicle-item.dot .elemenx-chronicle-node').first().boundingBox()).width;
			}).toBe(8);
		});

		test('timeline draws its scale, stacks close labels, edits ranges, zooms and seeks', async function ({ page }) {
			var block;
			var plan;
			var video;
			var boxes;
			var box;
			var core;
			var research;
			var lane;
			var ticks;

			await open(page, origin, ['Timeline']);

			block = section(page, 'Timeline');
			plan = block.getByRole('group', {name: 'The plan of the year'});
			video = block.getByRole('group', {name: 'A video'});

			await expect(plan.locator('.elemenx-timeline-lane-name')).toHaveText(['Design', 'Build', 'Launch']);
			await expect(plan.locator('.elemenx-timeline-range')).toHaveCount(5);
			await expect(plan.locator('.elemenx-timeline-point')).toHaveCount(5);
			await expect(plan.locator('.elemenx-timeline-tick.major').first()).toContainText('2026');
			await expect(plan.locator('.elemenx-timeline-now')).toHaveCount(1);

			/* The labels of marks close together stack in rows: none covers another. */
			boxes = await plan.locator('.elemenx-timeline-label.after').evaluateAll(function (labels) {
				return labels.map(function (label) {
					var rect = label.firstElementChild.getBoundingClientRect();

					return {Left: rect.left, Right: rect.right, Top: rect.top, Bottom: rect.bottom};
				});
			});

			expect(boxes.length).toBe(4);

			boxes.forEach(function (a, i) {
				boxes.slice(i + 1).forEach(function (b) {
					expect(a.Right <= b.Left || b.Right <= a.Left || a.Bottom <= b.Top || b.Bottom <= a.Top).toBe(true);
				});
			});

			/* A range dragged in time: the Timeline asks, the owner changes its data. */
			core = plan.getByRole('button', {name: /^Core,/});
			box = await core.boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, {steps: 5});
			await page.mouse.up();

			await expect(block).toContainText('Core: 2026-');
			await expect.poll(async function () {
				return (await core.boundingBox()).x;
			}).toBeGreaterThan(box.x + 20);

			/* By its end: only the end changes. */
			research = plan.getByRole('button', {name: /^Research,/});
			box = await research.boundingBox();

			await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width + 40, box.y + box.height / 2, {steps: 5});
			await page.mouse.up();

			await expect(block).toContainText('Research: 2026-01-12 – 2026-');
			expect(Math.abs((await research.boundingBox()).x - box.x)).toBeLessThan(2);

			/* A new range drawn on an empty part of a lane. */
			lane = plan.locator('.elemenx-timeline-lane[data-lane="launch"]');
			box = await lane.boundingBox();

			await page.mouse.move(box.x + 60, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(box.x + 160, box.y + box.height / 2, {steps: 5});
			await page.mouse.up();

			await expect(block).toContainText('Created: 2026-');
			await expect(plan.locator('.elemenx-timeline-range')).toHaveCount(6);

			/* The keys: Enter selects, the arrows go to the next mark, Alt with them moves it by its snap. */
			await plan.getByRole('button', {name: /^Alpha,/}).focus();

			await page.keyboard.press('Enter');

			await expect(block).toContainText('Selected: Alpha');
			await expect(plan.getByRole('button', {name: /^Alpha,/})).toHaveAttribute('aria-pressed', 'true');

			await page.keyboard.press('ArrowRight');

			await expect(plan.getByRole('button', {name: /^Demo day,/})).toBeFocused();

			await page.keyboard.press('Alt+ArrowRight');

			await expect(block).toContainText('Moved: Demo day to 2026-05-09');

			/* The zoom: Ctrl with the wheel at the pointer, the buttons, and back to all of it. */
			ticks = await plan.locator('.elemenx-timeline-tick').allTextContents();
			box = await plan.locator('.elemenx-timeline-axis').boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.keyboard.down('Control');
			await page.mouse.wheel(0, -400);
			await page.keyboard.up('Control');

			await expect.poll(function () {
				return plan.locator('.elemenx-timeline-tick').allTextContents();
			}).not.toEqual(ticks);

			await plan.getByRole('button', {name: 'Show all'}).click();

			await expect.poll(function () {
				return plan.locator('.elemenx-timeline-tick').allTextContents();
			}).toEqual(ticks);

			/* Declared inside it: marks (one with its own content as its label), a range, a progress; a press on the axis seeks. */
			await expect(video.locator('.elemenx-timeline-point')).toHaveCount(6);
			await expect(video.locator('.elemenx-timeline-label strong')).toHaveText('Goal!');
			await expect(video.getByRole('button', {name: /^Ad break,/})).toHaveCount(1);
			await expect(video.locator('.elemenx-timeline-buffer')).toHaveCount(1);
			await expect(video.getByRole('slider')).toHaveAttribute('aria-valuetext', '75 s');

			await video.scrollIntoViewIfNeeded();

			box = await video.locator('.elemenx-timeline-axis').boundingBox();

			await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

			await expect(video.getByRole('slider')).toHaveAttribute('aria-valuetext', /^(29\d|30\d)(\.\d+)? s$/);
			await expect.poll(async function () {
				return (await video.locator('.elemenx-timeline-progress').boundingBox()).width;
			}).toBeCloseTo(box.width / 2, -1);

			/* Vertical: the line goes down, the lanes go across. */
			await expect(block.locator('.elemenx-timeline.vertical')).toHaveCount(2);
			await expect(block.getByRole('group', {name: 'A day'}).locator('.elemenx-timeline-lane-name')).toHaveText(['Room']);

			box = await block.getByRole('group', {name: 'A day'}).getByRole('button', {name: /^Design review,/}).boundingBox();

			expect(box.height).toBeGreaterThan(60);
		});

		test('terminal runs commands and recalls its history', async function ({ page }) {
			var terminal;
			var input;
			var locked;

			await open(page, origin, ['Terminal']);

			terminal = section(page, 'Terminal').locator('.elemenx-terminal');
			input = terminal.locator('.elemenx-terminal-input');

			await input.fill('help');
			await input.press('Enter');

			await expect(terminal.locator('.elemenx-terminal-line')).toContainText(['Elemenx terminal. Type help.', 'help', /date\s+print the date/]);

			await input.fill('make coffee');

			/* While the command runs, the command line is read-only and keeps the focus: a moment, watched from before Enter (regression: a busy page ended it between two looks). */
			locked = await became(page, terminal, '.elemenx-terminal-input[readonly]');

			await input.press('Enter');

			await locked();

			await expect(input).toBeFocused();
			await expect(terminal.locator('.elemenx-terminal-line').last()).toHaveText('make: command not found');
			await expect(input).not.toHaveAttribute('readonly', '');
			await expect(input).toBeFocused();

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

		test('code editor highlights, keeps the indent, closes pairs, completes, comments and shows the messages of its markers', async function ({ page }) {
			var errors = captureErrors(page);
			var scope;
			var editor;
			var input;
			var box;
			var line = '\t\tvar next = this.Count + (step || 1);';

			await open(page, origin, ['Code editor']);

			scope = section(page, 'Code editor');
			editor = scope.locator('.elemenx-code-editor');
			input = editor.locator('textarea');

			await editor.scrollIntoViewIfNeeded();

			/* The layer under the field draws the text highlighted, with the markers of the page. */
			await expect(editor.locator('.elemenx-code-editor-row')).toHaveCount(16);
			await expect(editor.locator('.elemenx-syntax-keyword', {hasText: /^function$/})).toHaveCount(1);
			await expect(editor.locator('.elemenx-syntax-regex')).toHaveText('/^\\d+$/g');
			await expect(editor.locator('.elemenx-syntax-comment')).toHaveText('/* A component of the catalogue. */');
			await expect(editor.locator('.elemenx-code-editor-marker.warning')).toHaveText('unused');
			await expect(editor.locator('.elemenx-code-editor-marker.error')).toHaveText('`count: ${next}`');
			await expect(editor.locator('.elemenx-code-editor-row').nth(7)).toHaveClass(/marked warning/);
			await expect(input).toHaveAttribute('aria-label', 'Example code');

			/* The pointer over a marker shows its message and the hint of the page for the word (the field lies over the text). */
			box = await editor.locator('.elemenx-code-editor-marker.warning').boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

			await expect(editor.locator('.elemenx-code-editor-hint')).toHaveText('unused is never used.\nunused: 1 use in the text');

			await page.mouse.move(0, 0);

			await expect(editor.locator('.elemenx-code-editor-hint')).toHaveCount(0);

			/* Enter keeps the indent of the line; a bracket gets its pair and the completions fill the word. */
			await input.evaluate(function (node, text) {
				var end = node.value.indexOf(text) + text.length;

				node.focus();
				node.setSelectionRange(end, end);
			}, line);

			await page.keyboard.press('Enter');

			await expect(scope.locator(':scope > .elemenx-section-header .elemenx-caption')).toHaveText('Line 8, column 3');

			await page.keyboard.type('if (');

			expect(await input.inputValue()).toContain(line + '\n\t\tif ()\n');

			await page.keyboard.type('ne');

			await expect(editor.locator('.elemenx-code-editor-suggestion').first()).toContainText('next');
			await expect(input).toHaveAttribute('aria-activedescendant', /-0$/);

			await page.keyboard.press('Enter');

			await expect(editor.locator('.elemenx-code-editor-suggestion')).toHaveCount(0);

			/* A closing bracket typed before its pair steps over it. */
			await page.keyboard.type(') {');

			expect(await input.inputValue()).toContain('\n\t\tif (next) {}\n');

			await page.keyboard.press('Enter');

			expect(await input.inputValue()).toContain('\n\t\tif (next) {\n\t\t\t\n\t\t}\n');
			await expect(scope.locator(':scope > .elemenx-section-header .elemenx-caption')).toHaveText('Line 9, column 4');

			/* Backspace between a pair takes both; the brackets at the caret are marked. */
			await page.keyboard.type('[');

			await expect(editor.locator('.elemenx-code-editor-bracket')).toHaveCount(2);

			await page.keyboard.press('Backspace');

			expect(await input.inputValue()).toContain('\n\t\tif (next) {\n\t\t\t\n\t\t}\n');

			/* Mod+/ comments the line and takes the comment away again. */
			await page.keyboard.type('go();');
			await page.keyboard.press('ControlOrMeta+/');

			expect(await input.inputValue()).toContain('\n\t\t\t// go();\n');
			await expect(editor.locator('.elemenx-code-editor-row').nth(8).locator('.elemenx-syntax-comment')).toHaveText('// go();');

			await page.keyboard.press('ControlOrMeta+/');

			expect(await input.inputValue()).toContain('\n\t\t\tgo();\n');

			/* Shift+Tab and Mod+] move the lines; the undo of the browser keeps the edits. */
			await page.keyboard.press('Shift+Tab');

			expect(await input.inputValue()).toContain('\n\t\tgo();\n');

			await page.keyboard.press('ControlOrMeta+]');

			expect(await input.inputValue()).toContain('\n\t\t\tgo();\n');

			await scope.getByRole('button', {name: 'Undo'}).click();

			expect(await input.inputValue()).toContain('\n\t\tgo();\n');

			await scope.getByRole('button', {name: 'Redo'}).click();

			expect(await input.inputValue()).toContain('\n\t\t\tgo();\n');

			/* Escape, then Tab, leaves the editor. */
			await input.focus();

			await page.keyboard.press('Escape');
			await page.keyboard.press('Tab');

			await expect(input).not.toBeFocused();
			expect(errors).toEqual([]);
		});

		test('code editor shows a diff with the original text, in one column or side by side, with the words changed and folds that open', async function ({ page }) {
			var scope;
			var editor;
			var diff;

			await open(page, origin, ['Code editor']);

			scope = section(page, 'Code editor');
			editor = scope.locator('.elemenx-code-editor').first();

			await editor.scrollIntoViewIfNeeded();

			await scope.getByText('Diff', {exact: true}).click();

			diff = editor.locator('.elemenx-code-diff');

			/* One column: the counts, the line removed and the line added with the word changed in each, and the numbers. */
			await expect(diff).toBeVisible();
			await expect(editor.locator('.elemenx-code-editor-scroll')).toBeHidden();
			await expect(diff.locator('.elemenx-code-diff-stats')).toHaveText('+1 −2');
			await expect(scope.locator('.ui-kit-editor-tools .elemenx-caption')).toHaveText('+1 −2');
			await expect(diff.locator('.elemenx-code-diff-row.remove .elemenx-code-diff-word').first()).toHaveText('previous');
			await expect(diff.locator('.elemenx-code-diff-row.add .elemenx-code-diff-word')).toHaveText('Elemenx');
			await expect(diff.locator('.elemenx-code-diff-row.add .elemenx-code-diff-number')).toHaveText(['', '2']);
			await expect(diff.locator('.elemenx-code-diff-row.add .elemenx-syntax-string')).toHaveText('\'Counter\'');

			/* The unchanged run between the changes folds; a press opens it. */
			await expect(diff.locator('.elemenx-code-diff-fold')).toHaveText('8 unchanged lines');

			await diff.locator('.elemenx-code-diff-fold').click();

			await expect(diff.locator('.elemenx-code-diff-fold')).toHaveCount(0);
			await expect(diff.locator('.elemenx-code-diff-row')).toHaveCount(18);

			/* Side by side: the text before on the left, after on the right; the extra line has nothing beside it. */
			await scope.getByText('Side by side', {exact: true}).click();

			await expect(diff).toHaveClass(/split/);
			await expect(diff.locator('.elemenx-code-diff-code.remove .elemenx-code-diff-word').first()).toHaveText('previous');
			await expect(diff.locator('.elemenx-code-diff-code.add .elemenx-code-diff-word')).toHaveText('Elemenx');
			await expect(diff.locator('.elemenx-code-diff-code.empty')).toHaveCount(1);

			/* Back to editing. */
			await scope.getByText('Edit', {exact: true}).click();

			await expect(diff).toHaveCount(0);
			await expect(editor.locator('textarea')).toBeVisible();
		});

		test('code editor finds and replaces, switches languages, wraps and prints through its methods', async function ({ page }) {
			var errors = captureErrors(page);
			var scope;
			var editor;
			var input;
			var printed;

			await open(page, origin, ['Code editor']);

			scope = section(page, 'Code editor');
			editor = scope.locator('.elemenx-code-editor');
			input = editor.locator('textarea');

			await editor.scrollIntoViewIfNeeded();

			/* Find marks every match and selects the first one; the buttons of the page walk them. */
			await scope.getByPlaceholder('Find').fill('next');

			await expect(scope.locator(':scope > .elemenx-section-header .elemenx-caption')).toContainText('Matches: 4');
			await expect(editor.locator('.elemenx-code-editor-match')).toHaveCount(4);
			await expect(editor.locator('.elemenx-code-editor-match.current')).toHaveCount(1);

			expect(await input.evaluate(function (node) {
				return node.value.substring(node.selectionStart, node.selectionEnd);
			})).toBe('next');

			await scope.getByRole('button', {name: 'Next match'}).click();

			await expect(scope.locator(':scope > .elemenx-section-header .elemenx-caption')).toContainText('Line 10');

			await scope.getByRole('button', {name: 'Previous match'}).click();

			await expect(scope.locator(':scope > .elemenx-section-header .elemenx-caption')).toContainText('Line 7');

			/* Replace all is one edit: Undo brings the text back. */
			await scope.getByPlaceholder('Replace with').fill('value');
			await scope.getByRole('button', {name: 'Replace all'}).click();

			await expect(scope.locator(':scope > .elemenx-section-header .elemenx-caption')).toContainText('Matches: 0');
			expect(await input.inputValue()).not.toContain('next');
			expect(await input.inputValue()).toContain('var value = this.Count');

			await scope.getByRole('button', {name: 'Undo'}).click();

			expect(await input.inputValue()).toContain('var next = this.Count');

			await scope.getByPlaceholder('Find').fill('');

			await expect(editor.locator('.elemenx-code-editor-match')).toHaveCount(0);

			/* Another language draws with its grammar. */
			await scope.locator('.elemenx-select-trigger').click();
			await page.getByRole('option', {name: 'Python'}).click();

			await expect(editor.locator('.elemenx-syntax-keyword', {hasText: /^def$/})).toHaveCount(1);
			await expect(editor.locator('.elemenx-syntax-meta')).toHaveText('@dataclass');
			await expect(editor.locator('.elemenx-syntax-string')).toHaveText(/^"{3}The distance from the origin\."{3}$/);
			await expect(editor.locator('.elemenx-code-editor-marker')).toHaveCount(0);

			/* Wrap breaks the long lines in the field and in the layer alike. */
			await scope.getByText('Wrap', {exact: true}).click();

			await expect(editor).toHaveClass(/\bwrap\b/);
			await expect(input).toHaveAttribute('wrap', 'soft');

			/* Print prints a frame with the code, highlighted, and the stylesheets of the page. */
			await page.evaluate(function () {
				window.printed = [];

				new MutationObserver(function (records) {
					records.forEach(function (record) {
						record.addedNodes.forEach(function (node) {
							if (node.tagName === 'IFRAME')
								window.printed.push(node.srcdoc);
						});
					});
				}).observe(document.body, {childList: true});
			});

			await scope.getByRole('button', {name: 'Print'}).click();

			await expect.poll(function () {
				return page.evaluate(function () {
					return window.printed.length;
				});
			}).toBe(1);

			printed = await page.evaluate(function () {
				return window.printed[0];
			});

			expect(printed).toContain('<title>Example code</title>');
			expect(printed).toContain('class="elemenx-code-editor elemenx-code-editor-print numbered"');
			expect(printed).toContain('<span class="elemenx-syntax-keyword">def</span>');
			expect(printed).toContain('data-theme="light"');
			expect(printed).toMatch(/<link rel="stylesheet" href="[^"]*ElemenxUI\/index\.css"/);
			await expect(page.locator('body > iframe')).toHaveCount(0);
			expect(errors).toEqual([]);
		});

		test('rich editor formats from the toolbar of the page and from its menu, makes blocks of Markdown and pastes through its schema', async function ({ page }) {
			var errors = captureErrors(page);
			var scope;
			var content;

			await open(page, origin, ['Rich text editor']);

			scope = section(page, 'Rich text editor');
			content = scope.locator('.elemenx-rich-editor-content');

			await content.scrollIntoViewIfNeeded();

			await expect(content.locator('h2')).toHaveText('Release notes');
			await expect(content.locator('table tr')).toHaveCount(3);
			await expect(content).toHaveAttribute('aria-label', 'Example document');

			/* A selection shows the quick menu over it; its buttons style the selection. */
			await content.evaluate(function (node) {
				var text = node.querySelector('p').firstChild;
				var range = document.createRange();

				node.focus();

				range.setStart(text, 0);
				range.setEnd(text, 7);

				getSelection().removeAllRanges();
				getSelection().addRange(range);
			});

			await expect(scope.locator('.elemenx-rich-editor-menu')).toBeVisible();

			await scope.locator('.elemenx-rich-editor-menu').getByRole('button', {name: 'Bold'}).click();

			await expect(content.locator('p').first().locator('strong, b').first()).toHaveText('Elemenx');
			await expect(scope.locator('.elemenx-rich-editor-menu').getByRole('button', {name: 'Bold'})).toHaveAttribute('aria-pressed', 'true');
			await expect(scope.getByRole('button', {name: 'Bold', exact: true}).first()).toHaveAttribute('aria-pressed', 'true');

			/* The link of the menu takes a URL in its own field. */
			await scope.locator('.elemenx-rich-editor-menu').getByRole('button', {name: 'Link'}).click();

			await expect(scope.locator('.elemenx-rich-editor-link')).toBeFocused();

			await page.keyboard.type('https://example.com/a');
			await page.keyboard.press('Enter');

			await expect(content.locator('p').first().locator('a[href="https://example.com/a"]')).toHaveText('Elemenx');

			/* The toolbar of the page turns the paragraph at the caret into a heading. */
			await content.evaluate(function (node) {
				var text = node.querySelectorAll('p')[1].firstChild;
				var range = document.createRange();

				node.focus();

				range.setStart(text, 3);
				range.collapse(true);

				getSelection().removeAllRanges();
				getSelection().addRange(range);
			});

			await expect(scope.locator(':scope > .elemenx-section-header .elemenx-caption')).toHaveText('Quote');

			await scope.locator('.ui-kit-editor-tools .elemenx-select-trigger').click();
			await page.getByRole('option', {name: 'Heading 3'}).click();

			await expect(content.locator('h3')).toHaveText('Select some text to see the quick menu.');

			/* Markdown typed at the start of a paragraph makes a block; Mod+B styles what follows. */
			await content.evaluate(function (node) {
				var range = document.createRange();

				node.focus();

				range.selectNodeContents(node.querySelector('table').previousElementSibling);
				range.collapse(false);

				getSelection().removeAllRanges();
				getSelection().addRange(range);
			});

			await page.keyboard.press('Enter');
			await page.keyboard.type('## Plans');
			await page.keyboard.press('Enter');
			await page.keyboard.type('- one');

			await expect(content.locator('h2').nth(1)).toHaveText('Plans');
			await expect(content.locator('ul').nth(1).locator('li')).toHaveText(['one']);

			await page.keyboard.press('ControlOrMeta+b');
			await page.keyboard.type(' loud');

			await expect(content.locator('ul').nth(1).locator('strong, b')).toHaveText(/loud/);

			/* Paste keeps the text and the schema, not the scripts, handlers and unsafe links. */
			await content.evaluate(function (node) {
				var data = new DataTransfer();

				data.setData('text/html', '<p onclick="alert(1)">Pasted<script>window.bad = true</script> <b>bold</b> <a href="javascript:alert(1)">trap</a><img src="javascript:alert(1)"><iframe src="https://example.com"></iframe></p>');
				data.setData('text/plain', 'Pasted bold trap');

				node.dispatchEvent(new ClipboardEvent('paste', {clipboardData: data, bubbles: true, cancelable: true}));
			});

			await expect(content).toContainText('Pasted');
			expect(await content.evaluate(function (node) {
				return [!!node.querySelector('script, iframe, [onclick]'), !!node.querySelector('a[href^="javascript"]'), !!node.querySelector('img[src^="javascript"]'), window.bad === true];
			})).toEqual([false, false, false, false]);

			/* The undo of the browser keeps the edits made by the commands. */
			await scope.getByRole('button', {name: 'Undo'}).first().click();

			await expect(content).not.toContainText('Pasted');
			expect(errors).toEqual([]);
		});

		test('rich editor reads and writes Markdown, edits tables, inserts images and prints through its methods', async function ({ page }) {
			var errors = captureErrors(page);
			var scope;
			var content;
			var markdown;
			var printed;

			await open(page, origin, ['Rich text editor']);

			scope = section(page, 'Rich text editor');
			content = scope.locator('.elemenx-rich-editor-content');

			await content.scrollIntoViewIfNeeded();

			/* The document as Markdown, in a code editor of the page. */
			await scope.getByText('Markdown', {exact: true}).click();

			markdown = scope.locator('.elemenx-code-editor textarea');

			await expect(markdown).toHaveValue(/^## Release notes\n\nElemenx \*\*0\.9\*\* brings a \*rich text\* editor with \[no toolbar of its own\]\(https:\/\/github\.com\/Qybercom\/Elemenx\): the page calls `Command`\.\n\n- Markdown in and out\n- Paste through a schema\n\n> Select some text to see the quick menu\.\n\n\| Key \| Does \|\n\| --- \| --- \|\n\| Mod\+B \| Bold \|\n\| Mod\+K \| Link \|\n$/);

			/* Markdown typed there becomes the document. */
			await markdown.fill('# New\n\nText with **bold**, ~~old~~ and a [link](https://example.com).\n\n1. one\n2. two\n    - inner\n\n```\ncode <b>\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n');

			await expect(content.locator('h1')).toHaveText('New');
			await expect(content.locator('strong')).toHaveText('bold');
			await expect(content.locator('s')).toHaveText('old');
			await expect(content.locator('a')).toHaveAttribute('href', 'https://example.com');
			await expect(content.locator('ol > li')).toHaveCount(2);
			await expect(content.locator('ol ul > li')).toHaveText('inner');
			await expect(content.locator('pre')).toHaveText('code <b>');
			await expect(content.locator('td')).toHaveText(['1', '2']);

			/* Rows of a table come from the cell at the caret. */
			await content.evaluate(function (node) {
				var range = document.createRange();

				node.focus();

				range.selectNodeContents(node.querySelector('td'));
				range.collapse(true);

				getSelection().removeAllRanges();
				getSelection().addRange(range);
			});

			await expect(scope.getByRole('button', {name: 'Row below'})).toBeEnabled();

			await scope.getByRole('button', {name: 'Row below'}).click();

			await expect(content.locator('tbody tr')).toHaveCount(2);

			await scope.getByRole('button', {name: 'Image'}).click();

			await expect(content.locator('img[alt="Mountains"]')).toHaveAttribute('src', 'data/cards/mountains.svg');

			/* Print prints the document, in a frame with the stylesheets of the page. */
			await page.evaluate(function () {
				window.printed = [];

				new MutationObserver(function (records) {
					records.forEach(function (record) {
						record.addedNodes.forEach(function (node) {
							if (node.tagName === 'IFRAME')
								window.printed.push(node.srcdoc);
						});
					});
				}).observe(document.body, {childList: true});
			});

			await scope.getByRole('button', {name: 'Print'}).click();

			await expect.poll(function () {
				return page.evaluate(function () {
					return window.printed.length;
				});
			}).toBe(1);

			printed = await page.evaluate(function () {
				return window.printed[0];
			});

			expect(printed).toContain('<title>Example document</title>');
			expect(printed).toContain('class="elemenx-rich-editor-content elemenx-rich-editor-print"');
			expect(printed).toContain('<h1>New</h1>');
			await expect(page.locator('body > iframe')).toHaveCount(0);
			expect(errors).toEqual([]);
		});

		test('a window with a trapezoid header is a folder: the title on a tab, its slot and buttons beyond the slope, and the header still moves it', async function ({ page }) {
			var errors = captureErrors(page);
			var notes;
			var header;
			var shape;
			var point;
			var before;

			await open(page, origin, ['Windows', 'Game UI']);

			notes = section(page, 'Windows').locator('.elemenx-window.trapezoid').filter({hasText: 'Notes'});
			header = notes.locator('.elemenx-window-header');

			await notes.scrollIntoViewIfNeeded();

			/* The icon and the title on the tab; the body begins under the header, its top where the slope ends. */
			shape = await notes.evaluate(function (node) {
				var bar = node.querySelector('.elemenx-window-header');
				var tab = node.querySelector('.elemenx-window-tab');
				var box = tab.getBoundingClientRect();
				var pin = node.querySelector('.elemenx-window-extra .elemenx-button').getBoundingClientRect();
				var controls = node.querySelector('.elemenx-window-controls').getBoundingClientRect();

				return [tab.contains(node.querySelector('.elemenx-icon')), tab.contains(node.querySelector('.elemenx-window-title')), box.width < bar.getBoundingClientRect().width / 2, getComputedStyle(bar).backgroundColor, Math.round(parseFloat(getComputedStyle(node).getPropertyValue('--elemenx-tab-width')) - box.width), Math.round(parseFloat(getComputedStyle(node, '::before').top) - bar.getBoundingClientRect().height), getComputedStyle(tab).backgroundColor === getComputedStyle(node, '::before').backgroundColor, pin.left >= box.right + 24, controls.left > pin.right, Math.round(controls.right) === Math.round(node.getBoundingClientRect().right)];
			});

			expect(shape).toEqual([true, true, true, 'rgba(0, 0, 0, 0)', 0, 0, true, true, true, true]);

			/* The open part of the header, between the slot and the buttons, still moves the window. */
			point = await notes.evaluate(function (node) {
				var pin = node.querySelector('.elemenx-window-extra .elemenx-button').getBoundingClientRect();
				var controls = node.querySelector('.elemenx-window-controls').getBoundingClientRect();

				return {X: (pin.right + controls.left) / 2, Y: (pin.top + pin.bottom) / 2};
			});

			before = await notes.boundingBox();

			await page.mouse.move(point.X, point.Y);
			await page.mouse.down();
			await page.mouse.move(point.X + 40, point.Y + 30, {steps: 4});
			await page.mouse.up();

			await expect.poll(async function () {
				var after = await notes.boundingBox();

				return [Math.round(after.x - before.x), Math.round(after.y - before.y)];
			}).toEqual([40, 30]);

			await expect(header).toBeVisible();

			/*
			 * Moved, the window is active (it came to the front): its style is written again, and it keeps the width of its
			 * tab. The top edge of the body is the frame of the body itself, rounded at its corner, and the tab comes down
			 * over it: no line of the header under the tab, no step where the edge meets the side.
			 */
			await expect(notes).toHaveClass(/active/);

			expect(await notes.evaluate(function (node) {
				var tab = node.querySelector('.elemenx-window-tab');
				var bar = node.querySelector('.elemenx-window-header');
				var body = getComputedStyle(node, '::before');

				return [Math.round(parseFloat(getComputedStyle(node).getPropertyValue('--elemenx-tab-width')) - tab.offsetWidth), getComputedStyle(bar, '::after').content, body.borderTopWidth, body.borderTopRightRadius !== '0px', Math.round(tab.getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom)];
			})).toEqual([0, 'none', '1px', true, 1]);

			/*
			 * A game window: the tab is a plate of the panel and the frame of the theme that comes down over the top of the
			 * frame of the body, which leaves it that place; the decor frames the body, not the open header. In fantasy the
			 * plate is square and framed by the ornament of the theme on three sides (the frame of a secondary window: 5px).
			 */
			async function gameFolder () {
				return page.locator('.elemenx-window.game.trapezoid').filter({hasText: 'Bag'}).evaluate(function (node) {
					var frame = node.getBoundingClientRect();
					var header = node.querySelector('.elemenx-window-header').getBoundingClientRect();
					var element = node.querySelector('.elemenx-window-tab');
					var tab = element.getBoundingClientRect();
					var style = getComputedStyle(element);
					var decor = getComputedStyle(node, '::after');

					return [Math.round(tab.left - frame.left), Math.round(tab.top - frame.top), Math.round(tab.height - header.height), getComputedStyle(node, '::before').clipPath.indexOf('polygon') === 0, decor.clipPath.indexOf('polygon') === 0, Math.round(parseFloat(decor.top) - header.height), style.borderImageSource !== 'none', style.borderBottomWidth, Math.round(parseFloat(getComputedStyle(element, '::after').width))];
				});
			}

			expect(await gameFolder()).toEqual([0, 0, 1, true, true, 0, false, '0px', 24]);

			await section(page, 'Game UI').getByRole('button', {name: 'Fantasy', exact: true}).click();

			await expect.poll(gameFolder).toEqual([0, 0, 5, true, true, -10, true, '0px', 0]);

			await section(page, 'Game UI').getByRole('button', {name: 'Default', exact: true}).click();

			expect(errors).toEqual([]);
		});

		test('picture-in-picture moves the body of a window into a window of its own and back, and a video into its window', async function ({ page }) {
			var errors = captureErrors(page);
			var windows;
			var notes;
			var pop;
			var pip;

			/* The browser of the tests opens no window of the system: an iframe stands for it, and the video API answers as Chrome would. */
			await page.addInitScript(function () {
				Object.defineProperty(window, 'documentPictureInPicture', {configurable: true, value: {requestWindow: function (options) {
					var frame = document.createElement('iframe');
					var view;

					frame.id = 'test-pip';
					frame.style.cssText = 'position: fixed; right: 0; bottom: 0; z-index: 99999; width: ' + options.width + 'px; height: ' + options.height + 'px';

					document.body.appendChild(frame);

					view = frame.contentWindow;
					view.close = function () {
						view.dispatchEvent(new Event('pagehide'));

						frame.remove();
					};

					return Promise.resolve(view);
				}}});

				Object.defineProperty(document, 'pictureInPictureEnabled', {get: function () {
					return true;
				}});

				HTMLVideoElement.prototype.requestPictureInPicture = function () {
					var video = this;

					Object.defineProperty(document, 'pictureInPictureElement', {configurable: true, get: function () {
						return video;
					}});

					return Promise.resolve({});
				};

				document.exitPictureInPicture = function () {
					var video = document.pictureInPictureElement;

					Object.defineProperty(document, 'pictureInPictureElement', {configurable: true, get: function () {
						return null;
					}});

					video.dispatchEvent(new Event('leavepictureinpicture'));

					return Promise.resolve();
				};
			});

			await open(page, origin, ['Windows']);

			windows = section(page, 'Windows');
			notes = windows.locator('.elemenx-window').filter({hasText: 'Notes'});
			pop = notes.getByRole('button', {name: 'Picture in picture'});
			pip = page.frameLocator('#test-pip');

			await notes.scrollIntoViewIfNeeded();

			/* The body goes into the window, with the styles and the theme of the page; a frame takes its place. */
			await pop.click();

			await expect(pip.locator('.elemenx-window-body')).toContainText('A window keeps to its container');
			await expect(notes.locator('.elemenx-window-body')).toHaveCount(0);
			await expect(notes.locator('.elemenx-pip-placeholder')).toContainText('Shown in a picture-in-picture window');
			await expect(notes.getByRole('button', {name: 'Back into the page'})).toHaveAttribute('aria-pressed', 'true');

			expect(await page.evaluate(function () {
				var view = document.getElementById('test-pip').contentDocument;

				return [view.documentElement.getAttribute('data-theme') === document.documentElement.getAttribute('data-theme'), view.head.querySelectorAll('style, link[rel="stylesheet"]').length > 10, view.body.className, getComputedStyle(view.querySelector('.elemenx-window-body')).display !== 'inline'];
			})).toEqual([true, true, 'elemenx-pip-body', true]);

			/* The frame brings it back. */
			await notes.getByRole('button', {name: 'Bring it back'}).click();

			await expect(notes.locator('.elemenx-window-body')).toContainText('A window keeps to its container');
			await expect(notes.locator('.elemenx-pip-placeholder')).toHaveCount(0);
			await expect(page.locator('#test-pip')).toHaveCount(0);
			await expect(pop).toHaveAttribute('aria-pressed', 'false');

			/* Closing the window brings it back too. */
			await pop.click();

			await expect(pip.locator('.elemenx-window-body')).toBeAttached();

			await page.evaluate(function () {
				document.getElementById('test-pip').contentWindow.close();
			});

			await expect(notes.locator('.elemenx-window-body')).toContainText('A window keeps to its container');
			await expect(pop).toHaveAttribute('aria-pressed', 'false');

			/* A video goes into its window and back. */
			await windows.getByRole('button', {name: 'Video in a window'}).click();

			await expect(windows.locator('.elemenx-section-header')).toContainText('The video is in a window');

			await windows.getByRole('button', {name: 'Video in a window'}).click();

			await expect(windows.locator('.elemenx-section-header')).toContainText('The video is back in the page');

			expect(errors).toEqual([]);
		});

		test('windows move, resize, come to the front, minimize, maximize, follow the keys, close and remember their place', async function ({ page }) {
			var errors = captureErrors(page);
			var scope;
			var note;
			var properties;
			var notes;
			var header;
			var box;
			var area;

			async function place (window) {
				return window.evaluate(function (node) {
					return [node.offsetLeft, node.offsetTop, node.offsetWidth, node.offsetHeight];
				});
			}

			await open(page, origin, ['Windows']);

			scope = section(page, 'Windows');
			note = scope.locator(':scope > .elemenx-section-header .elemenx-caption');
			properties = scope.locator('.elemenx-window').filter({hasText: 'Properties'});
			notes = scope.locator('.elemenx-window').filter({hasText: 'Notes'});
			header = properties.locator('.elemenx-window-header');

			await scope.locator('.ui-kit-desktop').scrollIntoViewIfNeeded();

			expect(await place(properties)).toEqual([24, 24, 320, 260]);
			await expect(properties).toHaveAttribute('role', 'dialog');
			await expect(properties).toHaveAccessibleName('Properties');

			/* The header moves it; it keeps to its container. */
			box = await header.boundingBox();

			await page.mouse.move(box.x + 60, box.y + 10);
			await page.mouse.down();
			await page.mouse.move(box.x + 160, box.y + 60, {steps: 5});
			await page.mouse.up();

			expect((await place(properties)).slice(0, 2)).toEqual([124, 74]);
			await expect(note).toHaveText('Moved to 124, 74');

			box = await header.boundingBox();

			await page.mouse.move(box.x + 60, box.y + 10);
			await page.mouse.down();
			await page.mouse.move(box.x - 600, box.y - 600, {steps: 5});
			await page.mouse.up();

			expect((await place(properties)).slice(0, 2)).toEqual([0, 0]);

			/* A corner resizes it, within its least size. */
			box = await properties.boundingBox();

			await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width + 38, box.y + box.height + 28, {steps: 5});
			await page.mouse.up();

			expect((await place(properties)).slice(2)).toEqual([360, 290]);
			await expect(note).toHaveText('Resized to 360 × 290');

			box = await properties.boundingBox();

			await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
			await page.mouse.down();
			await page.mouse.move(box.x + 10, box.y + 10, {steps: 5});
			await page.mouse.up();

			expect((await place(properties)).slice(2)).toEqual([200, 120]);

			/* A press brings a window to the front and makes it the active one. */
			await notes.locator('.elemenx-window-body').click();

			await expect(notes).toHaveClass(/\bactive\b/);
			await expect(properties).not.toHaveClass(/\bactive\b/);
			expect(Number(await notes.evaluate(function (node) {
				return getComputedStyle(node).zIndex;
			}))).toBeGreaterThan(Number(await properties.evaluate(function (node) {
				return getComputedStyle(node).zIndex;
			})));

			/* Minimize folds it to its header; a double press on the header fills the container. */
			await properties.getByRole('button', {name: 'Minimize'}).click();

			await expect(properties).toHaveClass(/\bminimized\b/);
			await expect(properties.locator('.elemenx-window-body')).toBeHidden();
			await expect(note).toHaveText('Minimized');

			await properties.getByRole('button', {name: 'Unfold'}).click();

			await expect(properties.locator('.elemenx-window-body')).toBeVisible();

			await header.dblclick({position: {x: 80, y: 10}});

			area = await scope.locator('.ui-kit-desktop').evaluate(function (node) {
				return [node.clientWidth, node.clientHeight];
			});

			await expect(properties).toHaveClass(/\bmaximized\b/);
			expect((await place(properties)).slice(2)).toEqual(area);

			await properties.getByRole('button', {name: 'Restore'}).click();

			expect((await place(properties)).slice(2)).toEqual([200, 120]);

			/* The arrows on the focused header move it; with Shift they resize it. */
			await header.focus();

			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowDown');

			expect((await place(properties)).slice(0, 2)).toEqual([16, 16]);

			await page.keyboard.press('Shift+ArrowRight');

			expect((await place(properties)).slice(2)).toEqual([216, 120]);

			/* Close hides it; the page opens it again. */
			await properties.getByRole('button', {name: 'Close'}).click();

			await expect(properties).toHaveCount(0);
			await expect(note).toHaveText('Properties closed');

			await expect(scope.getByRole('button', {name: 'Properties', exact: true})).toHaveAttribute('aria-pressed', 'false');

			await scope.getByRole('button', {name: 'Properties', exact: true}).click();

			await expect(properties).toBeVisible();

			/* Notes remembers its place across a reload. */
			box = await notes.locator('.elemenx-window-header').boundingBox();

			await page.mouse.move(box.x + 60, box.y + 10);
			await page.mouse.down();
			await page.mouse.move(box.x + 20, box.y + 90, {steps: 5});
			await page.mouse.up();

			expect((await place(notes)).slice(0, 2)).toEqual([340, 140]);

			await reload(page);

			await expect.poll(function () {
				return place(section(page, 'Windows').locator('.elemenx-window').filter({hasText: 'Notes'}));
			}).toEqual([340, 140, 300, 200]);
			expect(errors).toEqual([]);
		});

		test('game extras: a quest log and its tracker, a minimap, a leaderboard and achievements one after another', async function ({ page }) {
			var errors = captureErrors(page);
			var game;
			var note;
			var quests;
			var tracker;
			var minimap;
			var ranking;
			var banner;

			await page.clock.install();

			await open(page, origin, ['Game UI', 'Overlays']);

			game = section(page, 'Game UI');
			note = game.locator(':scope > .elemenx-section-header .elemenx-caption');
			tracker = game.locator('.ui-kit-game-tracker');
			minimap = game.locator('.elemenx-game-minimap');

			await game.locator('.elemenx-game-hud').scrollIntoViewIfNeeded();

			/* The tracker lists the objectives of the tracked active quests; a press opens the log on that quest. */
			await expect(tracker.locator('.elemenx-game-tracker-title')).toHaveText(['Wolves at the gate', 'Herbs for the healer']);
			await expect(tracker.locator('.elemenx-game-tracker-objective').first()).toHaveText('Grey wolves slain 3 / 5');

			await tracker.getByRole('button', {name: /Herbs for the healer/}).click();

			quests = game.locator('.elemenx-window').filter({hasText: 'Quests'}).locator('.elemenx-game-quests');

			await expect(quests.locator('.elemenx-game-quests-title')).toHaveText('Herbs for the healer');
			await expect(quests.locator('.elemenx-game-quests-heading')).toHaveText(['Main story', 'Side quests']);
			await expect(quests.getByRole('option', {name: /Herbs for the healer/})).toHaveAttribute('aria-selected', 'true');
			await expect(quests.locator('.elemenx-game-quest.done .elemenx-game-quest-title')).toHaveText('A lost ring');
			await expect(quests.locator('.elemenx-game-quest.failed .elemenx-game-quest-title')).toHaveText('Hold the bridge');
			await expect(quests.locator('.elemenx-game-objective-count')).toHaveText('6 / 8');
			expect(await quests.locator('.elemenx-game-objective-bar > span').evaluate(function (node) {
				return node.style.width;
			})).toBe('75%');
			await expect(quests.locator('.elemenx-game-reward.uncommon .elemenx-game-reward-count')).toHaveText('3');

			/* The card of an item shows wherever the item is: a reward of a quest too, in the top layer, beside it. */
			await quests.locator('.elemenx-game-reward.uncommon').hover();

			await expect(quests.locator('.elemenx-item-card')).toContainText('Healing potion');
			await expect(quests.locator('.elemenx-item-card')).toContainText('Uncommon · Potion');
			await expect(quests.locator('.elemenx-item-card')).toContainText('Restores 30 health.');
			expect(await quests.locator('.elemenx-item-card').evaluate(function (node) {
				var reward = node.previousElementSibling.getBoundingClientRect();
				var card = node.getBoundingClientRect();

				return [node.matches(':popover-open'), Math.round(card.left - reward.right) === 8 || Math.round(reward.left - card.right) === 8, Math.abs(card.top - reward.top) < 220, document.getElementById(node.previousElementSibling.getAttribute('aria-describedby')) === node];
			})).toEqual([true, true, true, true]);

			/* Regression: a scroll of the page (the reader's, or the page that grows as more of it renders) closed the card; it follows its element. */
			await page.evaluate(function () {
				document.dispatchEvent(new Event('scroll'));
			});

			await expect(quests.locator('.elemenx-item-card')).toHaveCount(1);

			await page.mouse.move(0, 0);

			await expect(quests.locator('.elemenx-item-card')).toHaveCount(0);

			/* The arrows move through the quests; the button stops tracking one, and the tracker follows. */
			await quests.getByRole('option', {name: /Herbs for the healer/}).focus();

			await page.keyboard.press('ArrowDown');

			await expect(quests.locator('.elemenx-game-quests-title')).toHaveText('A lost ring');
			await expect(quests.getByRole('option', {name: /A lost ring/})).toBeFocused();
			await expect(quests.locator('.elemenx-game-quests-meta')).toHaveText('Side quests · Level 4 · Done');
			await expect(quests.getByRole('button', {name: 'Track'})).toHaveCount(0);

			await page.keyboard.press('Home');

			await expect(quests.locator('.elemenx-game-quests-title')).toHaveText('Wolves at the gate');

			await quests.getByRole('button', {name: 'Stop tracking'}).click();

			await expect(note).toHaveText('Stopped tracking: wolves');
			await expect(tracker.locator('.elemenx-game-tracker-title')).toHaveText(['Herbs for the healer']);
			await expect(quests.getByRole('button', {name: 'Track'})).toBeVisible();

			/* The minimap: markers on the map, the one off the map waits on its edge; zoom and markers emit. */
			await expect(minimap.locator('.elemenx-game-minimap-title')).toHaveText('Northern woods');
			await expect(minimap.locator('.elemenx-game-marker')).toHaveCount(4);
			await expect(minimap.locator('.elemenx-game-marker.edge')).toHaveCount(1);
			await expect(minimap.locator('.elemenx-game-marker.edge')).toHaveAttribute('aria-label', 'The pass');

			await minimap.getByRole('button', {name: 'Zoom in'}).click();

			await expect(note).toHaveText('Map zoom ×3');
			await expect(minimap.locator('.elemenx-game-minimap-note')).toHaveText('412, 88 · ×3');

			await minimap.getByRole('button', {name: 'Grey wolf'}).click();

			await expect(note).toHaveText('Marker: Grey wolf');

			/* The leaderboard: by score, medals for the first three, the player of the page apart after a gap. */
			await game.getByRole('button', {name: 'Ranking'}).click();

			ranking = game.locator('.elemenx-game-leaderboard');

			await expect(ranking.locator('.elemenx-game-leaderboard-rank')).toHaveText(['1', '2', '3', '4', '5', '6']);
			await expect(ranking.locator('.elemenx-game-leaderboard-row.gold strong')).toHaveText('Kael');
			await expect(ranking.locator('.elemenx-game-leaderboard-row.bronze strong')).toHaveText('Dorn');
			await expect(ranking.locator('.elemenx-game-leaderboard-row.gap')).toHaveCount(1);
			await expect(ranking.locator('.elemenx-game-leaderboard-row.me strong')).toHaveText('Aria');
			await expect(ranking.locator('.elemenx-game-leaderboard-row.me .elemenx-game-leaderboard-change.up')).toHaveAttribute('aria-label', 'up 3');
			await expect(ranking.locator('.elemenx-game-leaderboard-row.me .elemenx-game-leaderboard-score')).toHaveText('12,800');

			await ranking.locator('.elemenx-game-leaderboard-row').filter({hasText: 'Sela'}).click();

			await expect(note).toHaveText('Player: Sela');

			/*
			 * Achievements show one after another, over the whole page and its windows; a press dismisses one. The time is
			 * stopped a second after the one of the page (ahead of the one of the test once it was run forward).
			 */
			await page.clock.pauseAt(await page.evaluate(function () {
				return Date.now();
			}) + 1000);

			await game.getByRole('button', {name: 'Unlock an achievement'}).click();
			await game.getByRole('button', {name: 'Unlock an achievement'}).click();

			banner = page.locator('.elemenx-achievements .elemenx-achievement');

			await expect(banner).toHaveCount(1);
			await expect(banner.locator('.elemenx-achievement-title')).toHaveText('First blood');
			await expect(banner.locator('.elemenx-achievement-overline')).toHaveText('Achievement unlocked');
			await expect(banner.locator('.elemenx-achievement-points')).toHaveText('10');

			/* As on a console: the badge pops up and the band opens out of it, and it folds back at the end of its time. */
			expect(await banner.evaluate(function (node) {
				return node.getAnimations().map(function (animation) {
					return animation.animationName + ' ' + animation.effect.getTiming().delay;
				});
			})).toEqual(['elemenx-achievement-open 0', 'elemenx-achievement-close 5100']);

			await page.waitForTimeout(1300);

			expect(await banner.evaluate(function (node) {
				var box = node.getBoundingClientRect();

				return [getComputedStyle(node.parentNode).position, document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2).closest('.elemenx-achievement') === node, box.width > 200];
			})).toEqual(['fixed', true, true]);

			await page.clock.runFor(6100);

			await expect(banner.locator('.elemenx-achievement-title')).toHaveText('Pack hunter');
			await expect(banner).toHaveClass(/rare/);

			await banner.click();

			await expect(banner).toHaveCount(0);

			expect(errors).toEqual([]);
		});

		test('game windows take the look of the game themes: frames, ornaments, decor, a hologram, and numbered tabs', async function ({ page }) {
			var errors = captureErrors(page);
			var game;
			var status;
			var record;
			var tabs;
			var systems;

			await open(page, origin, ['Game UI']);

			game = section(page, 'Game UI');
			status = game.locator('.elemenx-window').filter({hasText: 'Status'});

			await game.locator('.elemenx-game-hud').scrollIntoViewIfNeeded();

			await expect(status).toHaveClass(/\bgame\b/);
			await expect(status.locator('.elemenx-property.success .elemenx-property-value')).toHaveText('ON');

			/* Fantasy: a rounded window in a thin line, a crest over the header, buttons with a light top edge. */
			await game.getByRole('button', {name: 'Fantasy'}).click();

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'fantasy');
			expect(await status.evaluate(function (node) {
				var frame = getComputedStyle(node, '::before');
				var header = node.querySelector('.elemenx-window-header');
				var button = getComputedStyle(node.querySelector('.elemenx-button'));

				var decor = getComputedStyle(node, '::after');

				return [node.classList.contains('primary'), frame.borderImageSource.indexOf('data:image/svg+xml') !== -1, decor.backgroundImage.split('data:image/svg+xml').length - 1, decor.top, getComputedStyle(header, '::before').backgroundImage, button.backgroundImage.split('linear-gradient').length - 1, button.borderRadius, button.minWidth, getComputedStyle(node.querySelector('.elemenx-window-body')).textShadow !== 'none'];
			})).toEqual([true, true, 1, '-16px', 'none', 2, '4px', '88px', true]);

			/*
			 * A secondary window: a thin frame of metal, a small crest and small corners (the Bag is a folder: its decor frames
			 * the body, under the tab of 36px, and the first corner of the body is square, the tab stands on it).
			 */
			expect(await game.locator('.elemenx-window.secondary').filter({hasText: 'Bag'}).evaluate(function (node) {
				var frame = getComputedStyle(node, '::before');
				var decor = getComputedStyle(node, '::after');

				return [frame.borderImageSource.indexOf('data:image/svg+xml') !== -1, frame.borderRadius, frame.borderTopWidth, decor.backgroundImage.split('data:image/svg+xml').length - 1, decor.top];
			})).toEqual([true, '0px 6px 6px', '5px', 1, '26px']);

			/* Gauges sit in a ring of metal rounded at both ends: the fill starts right at the curve, with a lattice in it. */
			expect(await status.locator('.elemenx-game-bar.health').evaluate(function (node) {
				var ornament = getComputedStyle(node.querySelector('.elemenx-game-bar-ornament'));

				var track = node.querySelector('.elemenx-game-bar-track').getBoundingClientRect();
				var caps = node.querySelector('.elemenx-game-bar-ornament').getBoundingClientRect();
				var fill = node.querySelector('.elemenx-game-bar-fill').getBoundingClientRect();

				return [ornament.backgroundImage.split('data:image/svg+xml').length - 1, caps.left === track.left && caps.height === track.height, fill.left === track.left, getComputedStyle(node.querySelector('.elemenx-game-bar-track')).borderTopLeftRadius, getComputedStyle(node.querySelector('.elemenx-game-bar-fill'), '::before').backgroundImage.indexOf('data:image/svg+xml') !== -1];
			})).toEqual([1, true, true, '7px', true]);

			/* Gauges of every size are as long: their caps do not grow with their height. */
			expect(await status.locator('.elemenx-game-bar-gauge').evaluateAll(function (nodes) {
				return nodes.map(function (node) {
					return Math.round(node.getBoundingClientRect().width);
				}).filter(function (width, index, list) {
					return list.indexOf(width) === index;
				}).length;
			})).toBe(1);

			/* The title is in the middle of the window, whatever room its buttons take. */
			expect(await status.evaluate(function (node) {
				var title = node.querySelector('.elemenx-window-title').getBoundingClientRect();
				var box = node.getBoundingClientRect();

				return Math.abs(title.left + title.width / 2 - (box.left + box.width / 2)) < 2;
			})).toBe(true);

			/* Sci-fi: glass in a thin line, the lines of a drawing around it, the body a dark well set into the panel, the overline an orange tag, the opening of a projection; the record of the fleet with numbered tabs. */
			await game.getByRole('button', {name: 'Sci-fi'}).click();

			/* Stats in pairs of cells, Sections with their heading in the letters of the theme, room in the window. */
			expect(await status.evaluate(function (node) {
				var name = getComputedStyle(node.querySelector('.elemenx-property-label'));
				var value = getComputedStyle(node.querySelector('.elemenx-property-value'));
				var title = getComputedStyle(node.querySelector('.elemenx-section-title'));

				return [name.backgroundColor !== 'rgba(0, 0, 0, 0)', value.borderTopWidth, title.textTransform, title.color, getComputedStyle(node.querySelector('.elemenx-section-header')).borderBottomWidth, getComputedStyle(node.querySelector('.elemenx-window-body')).paddingTop];
			})).toEqual([true, '1px', 'uppercase', 'rgb(242, 254, 255)', '1px', '10px']);

			/* The selected cell of the bag wears brackets of light apart from it; an active item and the active slot are filled in a double frame. */
			/* The brackets come in with a transition: read until it ended (regression: a page quicker than the whole catalogue read them halfway). */
			await expect.poll(function () {
				return game.locator('.elemenx-game-inventory-cell[aria-selected="true"]').evaluate(function (node) {
					var cell = node.getBoundingClientRect();
					var mark = node.querySelector('.elemenx-game-inventory-mark');
					var box = mark.getBoundingClientRect();

					return [getComputedStyle(mark).backgroundImage.split('linear-gradient').length - 1, Math.round(cell.left - box.left), Math.round(box.bottom - cell.bottom)];
				});
			}).toEqual([4, 3, 3]);
			expect(await game.getByRole('option', {name: /Ember rune/}).evaluate(function (node) {
				return [node.classList.contains('active'), getComputedStyle(node).boxShadow.split('rgb').length - 1, getComputedStyle(node.querySelector('.elemenx-game-inventory-mark')).backgroundImage];
			})).toEqual([true, 4, 'none']);
			expect(await game.locator('.elemenx-game-slot.active').evaluate(function (node) {
				return [node.getAttribute('aria-label'), getComputedStyle(node).boxShadow.split('rgb').length - 1];
			})).toEqual(['Blink', 4]);

			/* A window of systems: tabs, meters upwards and dials in sections, a table of cells set apart by gaps, its scrollbar a rail. */
			await game.getByRole('button', {name: 'Systems'}).click();

			systems = game.locator('.elemenx-window').filter({hasText: 'Systems'});

			await expect(systems.getByRole('tab', {name: 'Power'})).toHaveAttribute('aria-selected', 'true');
			await expect(systems.locator('.elemenx-meter.vertical')).toHaveCount(5);
			await expect(systems.locator('.elemenx-meter.dial')).toHaveCount(3);
			expect(await systems.getByRole('meter', {name: 'Core'}).evaluate(function (node) {
				return [node.classList.contains('warning'), getComputedStyle(node.querySelector('.elemenx-meter-value')).fontWeight, getComputedStyle(node.querySelector('.elemenx-meter-label')).textTransform];
			})).toEqual([true, '300', 'uppercase']);

			/* Regression: the scrollbars of a game window do not show the scrollbar the tabs hide. */
			expect(await systems.locator('.elemenx-tabs-list').evaluate(function (node) {
				return getComputedStyle(node).scrollbarWidth;
			})).toBe('none');

			await systems.getByRole('tab', {name: 'Files'}).click();

			/* The table is named by its Label. */
			await expect(systems.getByRole('table', {name: 'Files'})).toBeVisible();

			expect(await systems.locator('.elemenx-table').evaluate(function (node) {
				var head = getComputedStyle(node.querySelector('th'));
				var selected = node.querySelector('tbody tr.selected td');

				return [head.backgroundColor, selected.parentNode.querySelector('td').textContent.trim(), getComputedStyle(selected).backgroundImage.indexOf('linear-gradient') !== -1, getComputedStyle(node).borderSpacing, getComputedStyle(node.querySelector('tbody td + td')).borderInlineStartWidth, getComputedStyle(node.querySelector('tbody td')).borderBottomWidth, getComputedStyle(node.closest('.elemenx-table-box') || node.parentNode).scrollbarWidth];
			})).toEqual(['rgb(69, 201, 217)', '06', true, '2px', '0px', '0px', 'auto']);

			/* A Block in a game window takes the look of a section of the theme: a frame, its title on a band set into it. */
			await systems.getByRole('tab', {name: 'Log'}).click();

			expect(await systems.locator('.elemenx-block.framed').evaluate(function (node) {
				var header = node.querySelector('.elemenx-block-header').getBoundingClientRect();
				var frame = node.getBoundingClientRect();

				return [getComputedStyle(node).borderTopWidth, getComputedStyle(node.querySelector('.elemenx-block-header')).backgroundImage.indexOf('linear-gradient') !== -1, Math.round(header.left - frame.left), Math.round(header.top - frame.top), node.querySelector('.elemenx-block-title').textContent, getComputedStyle(node.querySelector('.elemenx-block-title')).textTransform];
			})).toEqual(['1px', true, 1, 1, 'Log', 'uppercase']);

			await systems.getByRole('button', {name: 'Close'}).click();

			await expect(systems).toHaveCount(0);

			await game.getByRole('button', {name: 'Record'}).click();

			record = game.locator('.elemenx-window').filter({hasText: 'Bureau of Fleet Personnel'});
			tabs = record.locator('.elemenx-game-tabs');

			await expect(record.locator('.elemenx-window-header .elemenx-window-overline')).toHaveText('Free Planets Fleets');
			expect(await record.evaluate(function (node) {
				var glass = getComputedStyle(node, '::before');

				var well = getComputedStyle(node.querySelector('.elemenx-window-body'));

				return [getComputedStyle(node).animationName, glass.backdropFilter.indexOf('blur') !== -1, glass.borderTopWidth, getComputedStyle(node, '::after').backgroundImage.indexOf('data:image/svg+xml') !== -1, well.backgroundColor !== 'rgba(0, 0, 0, 0)', well.borderTopWidth, well.marginLeft, getComputedStyle(node.querySelector('.elemenx-window-header .elemenx-window-overline')).backgroundColor, getComputedStyle(node.querySelector('.elemenx-window-title')).fontWeight];
			})).toEqual(['elemenx-window-hologram', true, '1px', true, true, '1px', '8px', 'rgb(232, 100, 42)', '300']);
			await expect(record).toHaveClass(/\bactive\b/);

			await expect(tabs.getByRole('tab')).toHaveText([/01\s*Service/, /02\s*Awards/, /03\s*Training/, /04\s*Remarks/]);
			await expect(tabs.getByRole('tab', {name: /Service/})).toHaveAttribute('aria-selected', 'true');

			await tabs.getByRole('tab', {name: /Service/}).focus();

			await page.keyboard.press('ArrowDown');

			await expect(tabs.getByRole('tab', {name: /Awards/})).toBeFocused();
			await expect(record.locator('.ui-kit-game-window .elemenx-window-overline')).toHaveText('Free Planets Defense Force · Awards');

			await page.keyboard.press('End');

			await expect(tabs.getByRole('tab', {name: /Remarks/})).toHaveAttribute('aria-selected', 'true');

			await record.getByRole('button', {name: 'Close'}).click();

			await expect(record).toHaveCount(0);

			await game.getByRole('button', {name: 'Default'}).click();

			expect(errors).toEqual([]);
		});

		test('game UI: bars, slots with keys and cooldowns, an inventory by keys and by dragging, a dialogue, a menu and the game themes', async function ({ page }) {
			/* The longest walk through the catalogue: beside the other workers it may take more than the usual time. */
			test.slow();

			var errors = captureErrors(page);
			var game;
			var health;
			var heal;
			var bag;
			var note;

			await open(page, origin, ['Game UI']);

			game = section(page, 'Game UI');
			note = game.locator(':scope > .elemenx-section-header .elemenx-caption');
			health = game.locator('.ui-kit-game-status .elemenx-game-bar.health');
			heal = game.locator('.elemenx-game-slot[title="Heal"]');
			bag = game.locator('.elemenx-window').filter({hasText: 'Bag'}).locator('.elemenx-game-inventory');

			await game.locator('.elemenx-game-hud').scrollIntoViewIfNeeded();

			/* A bar tells its value; a loss leaves its trail for a moment. */
			await expect(health).toHaveAttribute('aria-valuenow', '82');
			await expect(health).toHaveAttribute('aria-label', 'Health');

			await game.getByRole('button', {name: 'Take a hit'}).click();

			await expect(health).toHaveAttribute('aria-valuenow', '59');
			await expect(health.locator('.elemenx-game-bar-value')).toHaveText('59 / 100');
			expect(await health.evaluate(function (node) {
				return getComputedStyle(node).getPropertyValue('--elemenx-game-bar-value').trim();
			})).toBe('0.59');

			/* A slot runs by its key and then cools down: no second use until it is ready. */
			await page.locator('body').click({position: {x: 2, y: 2}});
			await page.keyboard.press('2');
			await page.keyboard.press('2');

			await expect(note).toHaveText('Healed for 25');
			await expect(health).toHaveAttribute('aria-valuenow', '84');
			await expect(heal).toHaveClass(/\bcooling\b/);
			await expect(heal.locator('.elemenx-game-slot-timer')).toHaveText(/^\d\.\d$/);
			await expect(heal).toHaveAttribute('aria-keyshortcuts', '2');
			await expect(heal).not.toHaveClass(/\bcooling\b/, {timeout: 8000});

			await page.keyboard.press('4');

			await expect(game.getByRole('button', {name: 'Health potion'}).locator('.elemenx-game-slot-count')).toHaveText('2');

			/* A slot of the hotbar shows the card of what it holds too, beside it, under the pointer or the focus. */
			await game.getByRole('button', {name: 'Fireball'}).hover();

			await expect(game.getByRole('button', {name: 'Fireball'}).locator('.elemenx-game-inventory-card')).toContainText('Fireball');
			await expect(game.getByRole('button', {name: 'Fireball'}).locator('.elemenx-game-inventory-card')).toContainText('Damage24–30');
			expect(await game.getByRole('button', {name: 'Fireball'}).evaluate(function (node) {
				var card = node.querySelector('.elemenx-game-inventory-card').getBoundingClientRect();
				var slot = node.getBoundingClientRect();

				return [card.width, card.left >= slot.right || card.right <= slot.left];
			})).toEqual([240, true]);

			/* A scroll of the page that leaves the pointer on the slot takes the card along with it. */
			await page.evaluate(function () {
				window.scrollBy(0, 10);
			});

			await expect.poll(function () {
				return game.getByRole('button', {name: 'Fireball'}).evaluate(function (node) {
					var card = node.querySelector('.elemenx-game-inventory-card');

					return card ? Math.round(card.getBoundingClientRect().top - Math.max(4, Math.min(node.getBoundingClientRect().top, window.innerHeight - 200))) + 0 : null;
				});
			}).toBe(0);

			await page.mouse.move(0, 0);

			await expect(game.locator('.elemenx-game-slot .elemenx-game-inventory-card')).toHaveCount(0);

			await game.getByRole('button', {name: 'Health potion'}).focus();

			await expect(game.getByRole('button', {name: 'Health potion'}).locator('.elemenx-game-inventory-card')).toContainText('Common · Potion');

			await game.getByRole('button', {name: 'Health potion'}).blur();

			/* The inventory: the card of an item, Space to pick it up and put it down, dragging, Delete. */
			await bag.getByRole('option', {name: 'Moonblade'}).click();

			await expect(bag.locator('.elemenx-game-inventory-card')).toContainText('Moonblade');
			await expect(bag.locator('.elemenx-game-inventory-card')).toContainText('Legendary · Sword');
			await expect(bag.locator('.elemenx-game-inventory-card')).toContainText('Damage42–58');

			/* The card is fixed to the viewport: the window that scrolls the bag does not cut it. */
			expect(await bag.locator('.elemenx-game-inventory-card').evaluate(function (node) {
				var card = node.getBoundingClientRect();
				var body = node.closest('.elemenx-window-body').getBoundingClientRect();

				return [getComputedStyle(node).position, card.right > body.right || card.left < body.left];
			})).toEqual(['fixed', true]);

			await page.keyboard.press('Space');
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('Space');

			await expect(bag.locator('.elemenx-game-inventory-cell').nth(2)).toHaveAttribute('aria-label', 'Moonblade');
			await expect(bag.locator('.elemenx-game-inventory-cell').nth(0)).toHaveAttribute('aria-label', 'Empty slot');
			await expect(bag.locator('.elemenx-game-inventory-cell').nth(2)).toBeFocused();

			await bag.getByRole('option', {name: 'Health potion × 5'}).dragTo(bag.locator('.elemenx-game-inventory-cell').nth(0));

			await expect(bag.locator('.elemenx-game-inventory-cell').nth(0)).toHaveAttribute('aria-label', 'Health potion × 5');

			await bag.getByRole('option', {name: 'Old map'}).focus();

			await page.keyboard.press('Enter');

			await expect(note).toHaveText('Used: Old map');

			await page.keyboard.press('Delete');

			await expect(note).toHaveText('Dropped: Old map');
			await expect(bag.getByRole('option', {name: 'Old map'})).toHaveCount(0);

			/* The dialogue types its line; a press shows the rest; then its choices. */
			await game.locator('.elemenx-game-dialogue-text').click();

			await expect(game.locator('.elemenx-game-dialogue-text')).toHaveText('Traveller! The northern road is closed: a storm came down from the peaks at dawn.');

			await game.getByRole('button', {name: 'Continue'}).click();
			await game.locator('.elemenx-game-dialogue-text').click();

			await expect(game.locator('.elemenx-game-dialogue-choice')).toHaveCount(3);
			await expect(game.getByRole('button', {name: /Hire a guide/})).toBeDisabled();

			await game.locator('.elemenx-game-dialogue').press('2');

			await expect(note).toHaveText('Chosen: Wait at the inn');

			/* The pause menu: the arrows go round its items, Escape goes back. */
			await game.getByRole('button', {name: 'Pause'}).click();

			await expect(game.getByRole('button', {name: /Resume/})).toBeFocused();

			await page.keyboard.press('ArrowUp');

			await expect(game.getByRole('button', {name: 'Quit to title'})).toBeFocused();

			await page.keyboard.press('Escape');

			await expect(game.locator('.elemenx-game-menu')).toHaveCount(0);

			/* The game themes set the tokens of the game components. */
			await game.getByRole('button', {name: 'Fantasy'}).click();

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'fantasy');

			/* The dialogue is a band set in the scene: no frame, lines of metal with flourishes over and under it. */
			expect(await game.locator('.elemenx-game-dialogue').evaluate(function (node) {
				var band = getComputedStyle(node, '::before');

				return [band.borderRadius, band.borderImageSource, getComputedStyle(node, '::after').backgroundImage.split('data:image/svg+xml').length - 1, getComputedStyle(node.querySelector('.elemenx-game-dialogue-speaker')).color];
			})).toEqual(['0px', 'none', 2, 'rgb(212, 190, 134)']);

			/* A light panel: a thin frame of metal and small figures. */
			expect(await game.locator('.elemenx-game-panel.light').first().evaluate(function (node) {
				return [getComputedStyle(node, '::before').borderImageSource.indexOf('data:image/svg+xml') !== -1, getComputedStyle(node, '::before').borderTopWidth, getComputedStyle(node, '::after').backgroundImage.indexOf('data:image/svg+xml') !== -1, getComputedStyle(node, '::after').top];
			})).toEqual([true, '3px', true, '-4px']);

			/* In the fantasy theme the menu takes the figures of a primary window, a flourish under its title, and its items a frame of metal with points standing out of their ends. */
			await game.getByRole('button', {name: 'Pause'}).click();

			expect(await game.locator('.elemenx-game-menu').evaluate(function (node) {
				var item = node.querySelector('.elemenx-game-menu-item');
				var ends = getComputedStyle(item, '::after');

				return [getComputedStyle(node, '::after').backgroundImage.split('data:image/svg+xml').length - 1, getComputedStyle(node.querySelector('.elemenx-game-menu-title'), '::after').height, getComputedStyle(item).borderImageSource.indexOf('data:image/svg+xml') !== -1, ends.backgroundImage.split('data:image/svg+xml').length - 1, ends.left, getComputedStyle(item).textAlign];
			})).toEqual([1, '20px', true, 1, '-19px', 'center']);

			/* Escape once the menu has the focus (it takes it a moment after it opens). */
			await expect(game.locator('.elemenx-game-menu :focus')).toHaveCount(1);

			await page.keyboard.press('Escape');

			await expect(game.locator('.elemenx-game-menu')).toHaveCount(0);

			await game.getByRole('button', {name: 'Sci-fi'}).click();

			await expect(page.locator('body')).toHaveAttribute('data-theme', 'scifi');
			expect(await game.locator('.elemenx-game-dialogue').evaluate(function (node) {
				return [getComputedStyle(node, '::before').borderTopWidth, getComputedStyle(node, '::after').backgroundImage.indexOf('data:image/svg+xml') !== -1, getComputedStyle(node.querySelector('.elemenx-game-dialogue-speaker')).textTransform];
			})).toEqual(['1px', true, 'uppercase']);

			await game.getByRole('button', {name: 'Default'}).click();

			await expect(page.locator('body')).not.toHaveAttribute('data-theme', 'scifi');
			expect(errors).toEqual([]);
		});

		test('items move between the bag and the hotbar, piles join, skills stay out of the bag, and items lie on glass of their color', async function ({ page }) {
			var errors = captureErrors(page);
			var game;
			var bag;
			var slots;
			var note;
			var cells;

			/* A drag with the pointer, slow enough for a frame to see each step, with the whole scene in view. */
			async function drag (from, to) {
				var start;
				var end;

				await game.locator('.elemenx-game-hud').evaluate(function (node) {
					node.scrollIntoView({block: 'start'});
				});

				start = await from.boundingBox();
				end = await to.boundingBox();

				await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
				await page.mouse.down();
				await page.mouse.move(start.x + start.width / 2 + 12, start.y + start.height / 2 + 12, {steps: 4});
				await page.waitForTimeout(60);
				await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {steps: 10});
				await page.waitForTimeout(120);
				await page.mouse.up();
			}

			await open(page, origin, ['Game UI']);

			game = section(page, 'Game UI');
			note = game.locator(':scope > .elemenx-section-header .elemenx-caption');
			bag = game.locator('.elemenx-window').filter({hasText: 'Bag'}).locator('.elemenx-game-inventory');
			cells = bag.locator('.elemenx-game-inventory-cell');
			slots = game.locator('.elemenx-game-hotbar .elemenx-game-slot');

			/* The bag and the hotbar both in view: a drop outside the viewport hits nothing. */
			await page.setViewportSize({width: 1280, height: 900});

			await game.locator('.elemenx-game-hud').evaluate(function (node) {
				node.scrollIntoView({block: 'start'});
			});

			await expect(slots).toHaveCount(6);
			await expect(slots.nth(4)).toHaveAccessibleName('Empty slot');

			/* In the fantasy theme an item is a painted tile of its color, lit from the middle, with a large light icon. */
			await game.getByRole('button', {name: 'Fantasy'}).click();

			expect(await bag.getByRole('option', {name: 'Health potion × 5'}).evaluate(function (node) {
				var glass = getComputedStyle(node, '::before');

				return [glass.backgroundColor, glass.opacity, getComputedStyle(node, '::after').backgroundImage.indexOf('radial-gradient') === 0, getComputedStyle(node.querySelector('.elemenx-icon')).scale];
			})).toEqual(['rgb(168, 40, 44)', '0.78', true, '1.25']);

			/* Items take a badge and classes of their own (the page frames the items of a quest). */
			await expect(bag.getByRole('option', {name: 'Moonblade'}).locator('.elemenx-game-inventory-badge')).toHaveText('+5');
			await expect(bag.getByRole('option', {name: 'Old map'})).toHaveClass(/\bquest\b/);
			expect(await bag.getByRole('option', {name: 'Moonblade'}).evaluate(function (node) {
				return getComputedStyle(node).boxShadow.indexOf('inset') !== -1;
			})).toBe(true);

			await game.getByRole('button', {name: 'Default'}).click();

			/* From the bag onto an empty slot the item moves: it leaves the bag. */
			await drag(bag.getByRole('option', {name: 'Ember rune × 2'}), slots.nth(4));

			await expect(slots.nth(4)).toHaveAttribute('title', 'Ember rune');
			await expect(slots.nth(4).locator('.elemenx-game-slot-count')).toHaveText('2');
			await expect(bag.getByRole('option', {name: /Ember rune/})).toHaveCount(0);
			await expect(note).toHaveText('Ember rune on 5');

			/* Its key uses it up, one at a time. */
			await page.locator('body').click({position: {x: 2, y: 2}});
			await page.keyboard.press('5');

			await expect(note).toHaveText('Used: Ember rune');
			await expect(slots.nth(4).locator('.elemenx-game-slot-count')).toHaveCount(0);
			await expect(slots.nth(4)).toHaveAttribute('title', 'Ember rune');

			/* From the slot back into an empty cell of the bag. */
			await drag(slots.nth(4), cells.nth(2));

			await expect(cells.nth(2)).toHaveAttribute('aria-label', 'Ember rune');
			await expect(slots.nth(4)).toHaveAccessibleName('Empty slot');

			/* Piles of the same item join: in the bag, and from the hotbar into the bag. */
			await drag(bag.getByRole('option', {name: 'Silverleaf × 4'}), bag.getByRole('option', {name: 'Silverleaf × 7'}));

			await expect(bag.getByRole('option', {name: 'Silverleaf × 11'})).toHaveCount(1);
			await expect(bag.getByRole('option', {name: /Silverleaf/})).toHaveCount(1);

			await drag(slots.nth(3), bag.getByRole('option', {name: 'Health potion × 5'}));

			await expect(bag.getByRole('option', {name: 'Health potion × 8'})).toHaveCount(1);
			await expect(slots.nth(3)).toHaveAccessibleName('Empty slot');

			/* A skill does not go into the bag; slots swap. */
			await drag(slots.nth(0), cells.nth(5));

			await expect(note).toHaveText('A skill does not go into the bag');
			await expect(slots.nth(0)).toHaveAttribute('title', 'Fireball');
			await expect(cells.nth(5)).toHaveAttribute('aria-label', 'Empty slot');

			await drag(slots.nth(0), slots.nth(1));

			await expect(slots.nth(0)).toHaveAttribute('title', 'Heal');
			await expect(slots.nth(1)).toHaveAttribute('title', 'Fireball');
			await expect(slots.nth(0)).toHaveAttribute('aria-keyshortcuts', '1');
			expect(errors).toEqual([]);
		});

		test('a gamepad drives the page: the d-pad moves the focus, A presses, B goes back, and the prompts show its buttons', async function ({ page }) {
			var errors = captureErrors(page);
			var game;

			/* A pad of the standard mapping that the test presses. */
			await page.addInitScript(function () {
				var pad = {id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], timestamp: 0, buttons: []};
				var i = 0;

				while (i < 17) {
					pad.buttons.push({pressed: false, value: 0});

					i++;
				}

				window.testPad = pad;

				Object.defineProperty(navigator, 'getGamepads', {configurable: true, value: function () {
					return [pad];
				}});
			});

			await open(page, origin, ['Game UI']);

			game = section(page, 'Game UI');

			await game.locator('.elemenx-game-hud').scrollIntoViewIfNeeded();

			/*
			 * A press: down until the next frame of the page, where the pad is read once, then up. Held from the test it lasted as
			 * long as the test was slow: past the 400 ms of the repeat of the d-pad, one press moved the focus two or three
			 * controls (regression: under load).
			 */
			async function press (index) {
				await page.evaluate(function (button) {
					window.testPad.buttons[button] = {pressed: true, value: 1};

					return new Promise(function (resolve) {
						requestAnimationFrame(function () {
							window.testPad.buttons[button] = {pressed: false, value: 0};

							requestAnimationFrame(function () {
								resolve();
							});
						});
					});
				}, index);
			}

			/* The prompts show the buttons of the pad in use. */
			await expect(game.locator('.elemenx-game-key-glyph').first()).toHaveText('A');
			await expect(game.locator('.elemenx-game-key').first()).toHaveClass(/\bxbox\b/);

			/* The d-pad moves the focus to the nearest control on its side; A presses it. */
			await game.getByRole('button', {name: 'Heal', exact: true}).focus();

			await press(15);

			await expect(game.getByRole('button', {name: 'Blink'})).toBeFocused();

			await press(0);

			await expect(game.locator(':scope > .elemenx-section-header .elemenx-caption')).toHaveText('Blink');

			/* A on the pause button opens the menu; the d-pad goes through its items; B goes back. */
			await game.getByRole('button', {name: 'Pause'}).focus();

			await press(0);

			await expect(game.getByRole('button', {name: /Resume/})).toBeFocused();

			await press(13);

			await expect(game.getByRole('button', {name: 'Save game'})).toBeFocused();

			await press(1);

			await expect(game.locator('.elemenx-game-menu')).toHaveCount(0);

			/* Another kind of pad: the prompts follow it. */
			await page.evaluate(function () {
				window.testPad.id = 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)';
			});

			await press(3);

			await expect(game.locator('.elemenx-game-key-glyph').first()).toHaveText('✕');
			expect(errors).toEqual([]);
		});

		test('a gamepad presses once when the system reports it twice, leans the stick one way, and B lets the focused control take Escape first', async function ({ page }) {
			var errors = captureErrors(page);
			var game;
			var overlays;
			var required;
			var shaken;

			/* One pad reported twice (XInput and HID), and a pad without the standard mapping. */
			await page.addInitScript(function () {
				function pad (index, mapping) {
					var value = {id: 'Xbox Wireless Controller (Vendor: 045e Product: 0b13)', index: index, connected: true, mapping: mapping, axes: [0, 0, 0, 0], timestamp: 0, buttons: []};

					while (value.buttons.length < 17)
						value.buttons.push({pressed: false, value: 0});

					return value;
				}

				window.testPads = [pad(0, 'standard'), pad(1, 'standard'), pad(2, '')];

				Object.defineProperty(navigator, 'getGamepads', {configurable: true, value: function () {
					return window.testPads;
				}});
			});

			/* Down until the next frame of the page, where the pads are read once, then up: no hold long enough to repeat (see press in the test before). */
			async function tap (pads, change) {
				await page.evaluate(function (detail) {
					function apply (down) {
						detail.Pads.forEach(function (index) {
							var pad = window.testPads[index];

							if (detail.Change.Button !== undefined)
								pad.buttons[detail.Change.Button] = {pressed: down, value: down ? 1 : 0};

							if (detail.Change.Axes)
								pad.axes = down ? detail.Change.Axes : [0, 0, 0, 0];
						});
					}

					apply(true);

					return new Promise(function (resolve) {
						requestAnimationFrame(function () {
							apply(false);

							requestAnimationFrame(function () {
								resolve();
							});
						});
					});
				}, {Pads: pads, Change: change});
			}

			/* A page with no game on it: the pad works there too, from the first control in view. */
			await page.goto(origin.URL + '/');

			await expect(page.locator('a[href="/ui"]').first()).toBeVisible({timeout: 30000});

			await tap([0], {Button: 13});

			expect(await page.evaluate(function () {
				return document.activeElement !== document.body;
			})).toBe(true);

			await open(page, origin, ['Game UI', 'Overlays']);

			game = section(page, 'Game UI');

			await game.locator('.elemenx-game-hud').scrollIntoViewIfNeeded();

			await expect(game.locator('.elemenx-game-key-glyph').first()).toHaveText('A');

			/* Both reports of the pad press the d-pad: the focus moves one control, not two. */
			await game.getByRole('button', {name: 'Heal', exact: true}).focus();

			await tap([0, 1], {Button: 15});

			await expect(game.getByRole('button', {name: 'Blink'})).toBeFocused();

			/* The stick down and to the right, leaning right: one move to the right, none down. */
			await tap([0], {Axes: [0.9, 0.6, 0, 0]});

			await expect(game.getByRole('button', {name: 'Potion'})).toBeFocused();

			/* A pad without the standard mapping: its button 0 is no A, nothing is pressed. */
			await tap([2], {Button: 0});

			await expect(game.locator(':scope > .elemenx-section-header .elemenx-caption')).toHaveText('Fireball 1 · Heal 2 · Blink 3 · Potion 4');

			/* B in a dialog: a control that takes Escape keeps it; otherwise the dialog is cancelled (and shakes). */
			overlays = section(page, 'Overlays');
			required = page.getByRole('dialog', {name: 'Terms of the beta'});

			await overlays.getByRole('button', {name: 'Required answer'}).click();

			await required.evaluate(function (node) {
				var button = node.querySelector('button');

				button.addEventListener('keydown', function (event) {
					if (event.key === 'Escape')
						event.preventDefault();
				});

				button.focus();
			});

			await tap([0], {Button: 1});

			await expect(required).not.toHaveClass(/refused/);

			await required.evaluate(function (node) {
				node.focus();
			});

			/* The shake lasts a moment: watched from before the press, a busy page cannot end it between two looks. */
			shaken = await became(page, required, '.refused');

			await tap([0], {Button: 1});

			await shaken();

			await expect(required).toBeVisible();

			expect(errors).toEqual([]);
		});

		test('tile grid places tiles in cells, keeps locked ones, starts groups and runs group actions', async function ({ page }) {
			var grid;
			var state;
			var drag;
			var from;
			var to;

			await open(page, origin, ['Tiles']);

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

			await open(page, origin, ['Tiles']);

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

		test('tile grid in columns stacks groups as the Start menu, starts a group under another and wraps its columns as the room narrows', async function ({ page }) {
			var frame;
			var grid;
			var stacks;
			var from;
			var gap;
			var boxes;

			await open(page, origin, ['Tiles']);

			frame = section(page, 'Tiles').locator('.ui-kit-start-columns');
			grid = frame.locator('.elemenx-tile-grid.columns');
			/* Read until they are as expected: the grid arranges its columns a frame after it is drawn or resized. */
			stacks = function () {
				return grid.locator('.elemenx-tile-stack').evaluateAll(function (nodes) {
					return nodes.map(function (node) {
						return Array.prototype.map.call(node.querySelectorAll('.elemenx-tile-group-title'), function (title) {
							return title.textContent;
						});
					});
				});
			};

			await frame.scrollIntoViewIfNeeded();

			await expect.poll(stacks).toEqual([['Productivity', 'Play'], ['Explore']]);

			/* The columns stand side by side while there is room. */
			boxes = await grid.locator('.elemenx-tile-stack').evaluateAll(function (nodes) {
				return nodes.map(function (node) {
					var box = node.getBoundingClientRect();

					return {Left: box.left, Right: box.right, Top: box.top, Bottom: box.bottom};
				});
			});

			expect(boxes[1].Left).toBeGreaterThan(boxes[0].Right);

			/* A tile dragged under the last group of the first column starts a group there, in that column. */
			from = await grid.locator('.elemenx-tile[data-id="c-maps"]').boundingBox();

			await page.mouse.move(from.x + 8, from.y + 8);
			await page.mouse.down();
			await page.mouse.move(from.x + 30, from.y + 30, {steps: 6});

			/*
			 * On the way the tile shows in the groups it passes, which grow and push the place under the column down: the
			 * pointer follows the place, as a hand does, until it is over it.
			 */
			await expect.poll(async function () {
				gap = await grid.locator('.elemenx-tile-stack').first().locator('.elemenx-tile-gap.below').boundingBox();

				await page.mouse.move(gap.x + gap.width / 2, gap.y + 12, {steps: 4});

				return grid.locator('.elemenx-tile-stack').first().locator('.elemenx-tile-gap.below').getAttribute('class');
			}, {timeout: 30000}).toMatch(/drop-over/);

			await page.mouse.up();

			await expect.poll(stacks).toEqual([['Productivity', 'Play', 'New group'], ['Explore']]);
			await expect(grid.locator('.elemenx-tile-stack').first().locator('.elemenx-tile[data-id="c-maps"]')).toHaveCount(1);

			/* Narrower than two columns: the second column goes, whole, under the first. */
			await frame.evaluate(function (node) {
				node.style.width = '300px';
			});

			await expect.poll(async function () {
				return grid.locator('.elemenx-tile-stack').evaluateAll(function (nodes) {
					return nodes[1].getBoundingClientRect().top > nodes[0].getBoundingClientRect().bottom;
				});
			}).toBe(true);
		});

		test('tile groups stretch by whole columns, and a press on a control inside a tile does not press the tile', async function ({ page }) {
			var grid;
			var tools;
			var handle;
			var width;
			var box;
			var play;

			await open(page, origin, ['Tiles']);

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

			await open(page, origin, ['Tiles']);

			grid = section(page, 'Tiles').locator('.elemenx-tile-grid').first();
			work = grid.locator('.elemenx-tile-group[data-group="work"]');
			columns = function () {
				return work.locator('.elemenx-tile-cells').evaluate(function (node) {
					return getComputedStyle(node).gridTemplateColumns.split(' ').length;
				});
			};

			await grid.scrollIntoViewIfNeeded();

			/* The edge shows the pause (class growing) only for GrowDelay, then the group grows: a record of it is kept, as a poll may miss it. */
			await work.evaluate(function (node) {
				window.sawGrowing = false;

				new MutationObserver(function () {
					if (node.classList.contains('growing'))
						window.sawGrowing = true;
				}).observe(node, {attributes: true, attributeFilter: ['class']});
			});

			box = await grid.locator('.elemenx-tile[data-id="tasks"]').boundingBox();

			await page.mouse.move(box.x + 10, box.y + 10);
			await page.mouse.down();
			await page.mouse.move(box.x + 70, box.y + 10, {steps: 6});

			await expect.poll(function () {
				return page.evaluate(function () {
					return window.sawGrowing;
				});
			}).toBe(true);

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

			await open(page, origin, ['Payment, phone and money']);

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

		test('a guarded field asks before the eye shows its value, and hides it again after HideAfter', async function ({ page }) {
			var cvv;
			var eye;
			var input;
			var ask;

			/* Its section and the one of the ToastHost alone: the whole catalogue builds the others meanwhile and a busy page held the timer of HideAfter back. */
			await open(page, origin, ['Payment, phone and money', 'Overlays']);

			cvv = field(page, 'CVV');
			eye = cvv.locator('.elemenx-input-action');
			input = cvv.locator('input');
			ask = page.locator('.elemenx-toast', {hasText: 'security code'});

			await cvv.scrollIntoViewIfNeeded();
			await cvv.getByRole('button', {name: 'Show code'}).click();

			await expect(ask).toBeVisible();
			await expect(eye).toHaveAttribute('aria-busy', 'true');
			await expect(input).toHaveAttribute('type', 'password');

			/* A second press while the request is open asks nothing more. */
			await eye.click();

			await expect(ask).toHaveCount(1);

			await ask.getByRole('button', {name: 'Cancel'}).click();

			await expect(input).toHaveAttribute('type', 'password');
			await expect(eye).not.toHaveAttribute('aria-busy', 'true');

			await cvv.getByRole('button', {name: 'Show code'}).click();
			await ask.getByRole('button', {name: 'Use fingerprint'}).click();

			await expect(input).toHaveAttribute('type', 'text');
			await expect(input).toHaveValue('123');

			/* Hiding needs no question; HideAfter would hide it anyway. */
			await cvv.getByRole('button', {name: 'Hide code'}).click();

			await expect(input).toHaveAttribute('type', 'password');

			await cvv.getByRole('button', {name: 'Show code'}).click();
			await ask.getByRole('button', {name: 'Use fingerprint'}).click();

			await expect(input).toHaveAttribute('type', 'text');
			/* HideAfter is 5 seconds; the wait ends as soon as it hides (regression: 8 seconds were too few under load). */
			await expect(input).toHaveAttribute('type', 'password', {timeout: 20000});

			/* An unguarded field shows at once. */
			await field(page, 'PIN').getByRole('button', {name: 'Show code'}).click();

			await expect(field(page, 'PIN').getByRole('button', {name: 'Hide code'})).toBeVisible();
		});

		test('command palette finds commands fuzzily, runs them, keeps the recent ones and lists the shortcuts', async function ({ page }) {
			var commands;
			var palette;
			var options;

			await open(page, origin, ['Commands and overlays', 'Overlays']);

			commands = section(page, 'Commands and overlays');
			palette = page.locator('dialog.elemenx-palette');
			options = function () {
				return palette.locator('.elemenx-option .elemenx-option-label').allInnerTexts();
			};

			await commands.scrollIntoViewIfNeeded();

			await expect(commands.locator('.ui-kit-shortcuts li')).toHaveText([/Toggle the theme\s*Alt\+T/, /Go to the tiles\s*G T/, /Show a toast\s*Alt\+N/]);

			/* A busy page may take the key before it listens: pressed again while the palette is closed (regression: one press was lost under load). */
			await expect(async function () {
				if (!(await palette.evaluate(function (node) {
					return node.open;
				})))
					await page.keyboard.press('Control+K');

				await expect(palette).toHaveJSProperty('open', true, {timeout: 2000});
			}).toPass({timeout: 30000});
			await expect(palette.getByRole('combobox')).toBeFocused();
			expect(await options()).toEqual(['Toggle the theme', 'Open the filters drawer', 'Take the tour', 'Show a success toast', 'Copy the API token', 'Publish (needs a reviewer)', 'Go to the tiles', 'Show a toast']);

			/* Fuzzy: the letters in order, marked; keywords count too. */
			await page.keyboard.type('tgth');

			expect(await options()).toEqual(['Toggle the theme']);
			await expect(palette.locator('.match')).toHaveText(['T', 'g', 'th']);

			await palette.getByRole('combobox').fill('onboarding');

			expect(await options()).toEqual(['Take the tour']);

			await palette.getByRole('combobox').fill('zzz');

			await expect(palette.locator('.elemenx-popup-empty')).toHaveText('No matching commands');

			await palette.getByRole('combobox').fill('show a toast');

			expect((await options())[0]).toBe('Show a toast');

			await page.keyboard.press('Enter');

			await expect(palette).toHaveJSProperty('open', false);
			await expect(commands.locator('.elemenx-section-header')).toContainText('Last: Show a toast');
			await expect(page.locator('.elemenx-toast', {hasText: 'A toast from Alt+N'})).toBeVisible();

			await commands.getByRole('button', {name: 'Command palette'}).click();

			await expect(palette.locator('.elemenx-popup-group').first()).toHaveText('Recent');
			expect((await options())[0]).toBe('Show a toast');

			/* A disabled command does not run. */
			await palette.getByRole('combobox').fill('publish');

			await page.keyboard.press('Enter');

			await expect(palette).toHaveJSProperty('open', true);

			await page.keyboard.press('Escape');

			await expect(palette).toHaveJSProperty('open', false);
		});

		test('shortcuts fire by their keys, also in another keyboard layout, sequences included, but not while typing', async function ({ page }) {
			var commands;

			await open(page, origin, ['Commands and overlays', 'Tiles', 'Payment, phone and money']);

			commands = section(page, 'Commands and overlays');

			await commands.scrollIntoViewIfNeeded();

			await page.locator('body').click({position: {x: 5, y: 300}});

			await page.keyboard.press('Alt+N');

			await expect(commands.locator('.elemenx-section-header')).toContainText('Last: Show a toast');

			/* Alt+N with a Cyrillic layout: the key reports 'т', its code still says KeyN. */
			await page.evaluate(function () {
				window.ThemeBefore = document.body.getAttribute('data-theme');

				document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'е', code: 'KeyT', altKey: true, bubbles: true}));
			});

			await expect(page.locator('body')).not.toHaveAttribute('data-theme', await page.evaluate(function () {
				return window.ThemeBefore;
			}));

			await page.keyboard.press('g');
			await page.keyboard.press('t');

			await expect.poll(function () {
				return section(page, 'Tiles').evaluate(function (node) {
					return Math.abs(node.getBoundingClientRect().top) < 200;
				});
			}).toBe(true);

			await field(page, 'Card number').locator('input').click();

			await page.keyboard.type('gt');

			await expect(field(page, 'Card number').locator('input')).toBeFocused();
		});

		test('context menu opens at the pointer and by the keyboard, and tells which item it was opened for', async function ({ page }) {
			var commands;
			var menu;

			await open(page, origin, ['Commands and overlays']);

			commands = section(page, 'Commands and overlays');
			menu = commands.locator('.elemenx-context-point .elemenx-menu');

			await commands.scrollIntoViewIfNeeded();
			await commands.locator('[data-file="app.js"]').click({button: 'right'});

			await expect(menu).toBeVisible();
			await expect(menu.getByRole('menuitem', {name: /Open/})).toBeFocused();

			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');

			await expect(menu).toBeHidden();
			await expect(commands.locator('.elemenx-section-header')).toContainText('Last: Rename app.js');

			await commands.locator('[data-file="logo.svg"]').focus();

			await page.keyboard.press('Shift+F10');

			await expect(menu).toBeVisible();

			await page.keyboard.press('Escape');

			await expect(menu).toBeHidden();
			await expect(commands.locator('[data-file="logo.svg"]')).toBeFocused();

			/* An item declared in its slot items comes after Items. */
			await commands.locator('[data-file="logo.svg"]').click({button: 'right'});
			await menu.getByRole('menuitem', {name: /Properties/}).click();

			await expect(commands.locator('.elemenx-section-header')).toContainText('Last: Properties logo.svg');
		});

		test('a drawer is a side menu from either side, and drawers stack: Escape closes the top one', async function ({ page }) {
			var commands;
			var menu;
			var filters;
			var box = null;

			await open(page, origin, ['Commands and overlays']);

			commands = section(page, 'Commands and overlays');
			menu = page.getByRole('dialog', {name: 'Elemenx'});
			filters = page.getByRole('dialog', {name: 'Filters'});

			await commands.scrollIntoViewIfNeeded();
			await commands.getByRole('button', {name: 'Menu', exact: true}).click();

			await expect(menu).toBeVisible();
			await expect(menu).toHaveClass(/left/);

			/* The drawer slides in: its place is checked once it is there. */
			await expect.poll(async function () {
				box = await menu.boundingBox();

				return Math.round(box.x);
			}).toBe(0);

			/* A second drawer opens over the menu; Escape closes it and leaves the menu open. */
			await menu.getByRole('button', {name: 'Filters'}).click();

			await expect(filters).toBeVisible();

			await page.keyboard.press('Escape');

			await expect(filters).toBeHidden();
			await expect(menu).toBeVisible();

			await menu.getByText('Builds').click();

			await expect(menu).toBeHidden();
			await expect(commands.locator('.elemenx-section-header')).toContainText('Last: Menu: Builds');

			await commands.locator('.elemenx-check-label', {hasText: /^Right$/}).click();
			await commands.getByRole('button', {name: 'Menu', exact: true}).click();

			await expect(menu).toHaveClass(/right/);

			await expect.poll(async function () {
				box = await menu.boundingBox();

				return Math.round(box.x + box.width);
			}).toBe(page.viewportSize().width);

			await page.keyboard.press('Escape');

			await expect(menu).toBeHidden();
		});

		test('copy, drawer and tour', async function ({ context, page }) {
			var commands;
			var tour;

			await context.grantPermissions(['clipboard-read', 'clipboard-write']);

			await open(page, origin, ['Commands and overlays', 'Overlays']);

			commands = section(page, 'Commands and overlays');

			await commands.scrollIntoViewIfNeeded();
			await commands.getByRole('button', {name: 'Copy the token'}).click();

			await expect(commands.getByRole('button', {name: 'Copy the token'})).toHaveAttribute('data-copied', 'true');
			await expect(page.locator('.elemenx-toast', {hasText: 'Token copied'})).toBeVisible();
			expect(await page.evaluate(function () {
				return navigator.clipboard.readText();
			})).toBe('exn_live_7f3a9c21b8d04e65');

			await commands.getByRole('button', {name: 'Open drawer'}).click();

			await expect(page.getByRole('dialog', {name: 'Filters'})).toBeVisible();

			/* The shake of a drawer that waits for an answer keeps its slide: it does not slide in again after it. */
			expect(await page.getByRole('dialog', {name: 'Filters'}).evaluate(async function (node) {
				var starts = [];

				await new Promise(function (resolve) {
					window.setTimeout(resolve, 400);
				});

				node.addEventListener('animationstart', function (event) {
					if (event.target === node)
						starts.push(event.animationName);
				});

				node.classList.add('refused');

				await new Promise(function (resolve) {
					window.setTimeout(resolve, 500);
				});

				node.classList.remove('refused');

				await new Promise(function (resolve) {
					window.setTimeout(resolve, 300);
				});

				return starts;
			})).toEqual(['elemenx-drawer-refuse']);

			await page.keyboard.press('Escape');

			await expect(page.getByRole('dialog', {name: 'Filters'})).toBeHidden();

			await commands.getByRole('button', {name: 'Take the tour'}).click();

			tour = page.locator('.elemenx-tour-card');

			await expect(tour).toContainText('1 / 3');
			await expect(tour).toContainText('Commands');
			await expect(tour.getByRole('button', {name: 'Next'})).toBeFocused();
			await expect.poll(async function () {
				var hole = await page.locator('.elemenx-tour-hole').boundingBox();
				var target = await page.locator('#ui-kit-commands').boundingBox();

				return Math.round(hole.x + 6) === Math.round(target.x) && Math.round(hole.width - 12) === Math.round(target.width);
			}).toBe(true);

			await page.keyboard.press('ArrowRight');

			await expect(tour).toContainText('2 / 3');

			await tour.getByRole('button', {name: 'Back'}).click();

			await expect(tour).toContainText('1 / 3');

			await tour.getByRole('button', {name: 'Next'}).click();
			await tour.getByRole('button', {name: 'Next'}).click();
			await tour.getByRole('button', {name: 'Done'}).click();

			await expect(tour).toHaveCount(0);
			await expect(commands.locator('.elemenx-section-header')).toContainText('Last: Tour: done');
		});

		test('devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error', async function ({ context, page }) {
			var devices;
			var state;
			var row;

			await context.grantPermissions(['notifications']);

			await open(page, origin, ['Security and device']);

			devices = page.locator('.ui-kit-devices');
			state = page.locator('#ui-kit-devices-state');
			row = function (name) {
				return devices.locator('li').filter({hasText: name});
			};

			await devices.scrollIntoViewIfNeeded();

			/* Desktop Chrome: push, serial ports and USB; NFC is for Android. */
			await expect(row('Push').locator('.elemenx-badge')).toHaveText('supported');
			await expect(row('Serial').locator('.elemenx-badge')).toHaveText('supported');
			await expect(row('USB').locator('.elemenx-badge')).toHaveText('supported');
			await expect(row('NFC').locator('.elemenx-badge')).toHaveText('not here');

			/* A notification from the page, allowed: done. */
			await row('Push').getByRole('button').click();

			await expect(state).toHaveText('Push: done');

			/* No NFC here: the error says so. */
			await row('NFC').getByRole('button').click();

			await expect(state).toHaveText('NFC: NotSupportedError · Elemenx NFC: this browser has no Web NFC');
		});

		test('biometric check, inactivity and permissions', async function ({ context, page }) {
			var cdp = await context.newCDPSession(page);
			var device;

			await cdp.send('WebAuthn.enable');
			await cdp.send('WebAuthn.addVirtualAuthenticator', {options: {protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true}});

			/* WebAuthn takes a domain, not an IP address, as the site: the page opens on localhost. */
			await page.goto(origin.URL.replace('127.0.0.1', 'localhost') + '/ui');

			await ready(page, page.url().indexOf('sections=') === -1);

			device = section(page, 'Security and device');

			await device.scrollIntoViewIfNeeded();

			await expect(page.locator('#ui-kit-biometric-state')).toHaveText('This device has a fingerprint, face or PIN check');

			/* The first check registers the device, the next ones verify it. */
			await device.getByRole('button', {name: 'Check this device'}).click();

			await expect(page.locator('#ui-kit-biometric-state')).toHaveText('Passed');

			await device.getByRole('button', {name: 'Check this device'}).click();

			await expect(page.locator('#ui-kit-biometric-state')).toHaveText('Passed');

			/* The fingerprint as the guard of the guarded card fields. */
			await device.getByText('Ask it for the guarded card fields').click();

			await field(page, 'CVV').scrollIntoViewIfNeeded();
			await field(page, 'CVV').getByRole('button', {name: 'Show code'}).click();

			await expect(field(page, 'CVV').locator('input')).toHaveAttribute('type', 'text');
			await expect(page.locator('.elemenx-toast', {hasText: 'Confirm it is you'})).toHaveCount(0);

			await device.scrollIntoViewIfNeeded();

			await expect(device.locator('.ui-kit-permissions li')).toHaveCount(4);
			await expect(device.locator('.ui-kit-permissions li').first().locator('.elemenx-badge')).not.toHaveText('…');

			await device.getByRole('button', {name: 'Watch 6 s'}).click();

			await expect(page.locator('#ui-kit-idle-state')).toHaveText(/warning: [1-3] s left/, {timeout: 6000});
			await expect(page.locator('#ui-kit-idle-state')).toHaveText(/idle/, {timeout: 6000});

			await page.mouse.click(5, 300);

			await expect(page.locator('#ui-kit-idle-state')).toHaveText('State: active');

			await device.getByRole('button', {name: 'Stop'}).click();

			await expect(page.locator('#ui-kit-idle-state')).toHaveText('State: stopped');
		});

		test('the arrows scroll a list of suggestions to the option they choose: tags and code completions', async function ({ page }) {
			var topics;
			var editor;
			var popup;

			/* Whether the active option of a list shows inside the list, and how far the list scrolled. */
			async function shown (list) {
				return list.evaluate(function (node) {
					var item = node.querySelector('.active');
					var box = node.getBoundingClientRect();
					var rect = item.getBoundingClientRect();

					return {Inside: rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1, Scrolled: node.scrollTop > 0};
				});
			}

			await open(page, origin, ['Selection', 'Code editor']);

			/* Tags: the arrow up from the first suggestion goes round to the last, out of view at first. */
			topics = field(page, 'Topics');

			await topics.scrollIntoViewIfNeeded();
			await topics.locator('input.elemenx-tags-control').click();

			await page.keyboard.press('ArrowDown');

			popup = page.locator('.elemenx-popup:not([hidden])');

			await expect(popup.locator('.elemenx-option').first()).toHaveClass(/active/);

			/* A short list, so that the last suggestion is out of view. */
			await popup.evaluate(function (node) {
				node.style.maxHeight = '80px';
			});

			await page.keyboard.press('ArrowUp');

			await expect(popup.locator('.elemenx-option').last()).toHaveClass(/active/);
			await expect.poll(function () {
				return shown(popup);
			}).toEqual({Inside: true, Scrolled: true});

			await page.keyboard.press('Escape');

			/* Code completions: Ctrl+Space lists all of them; the arrow up goes round to the last. */
			editor = page.locator('.elemenx-code-editor').first();

			await editor.scrollIntoViewIfNeeded();
			await editor.locator('textarea').evaluate(function (node) {
				node.focus();
				node.setSelectionRange(node.value.length, node.value.length);
			});

			await page.keyboard.press('Enter');
			await page.keyboard.press('Control+Space');

			popup = editor.locator('.elemenx-code-editor-popup');

			await expect(editor.locator('.elemenx-code-editor-suggestion').first()).toHaveClass(/active/);

			await page.keyboard.press('ArrowUp');

			await expect(editor.locator('.elemenx-code-editor-suggestion').last()).toHaveClass(/active/);
			await expect.poll(function () {
				return shown(popup);
			}).toEqual({Inside: true, Scrolled: true});
		});

		test('tag input adds tags by keys, separators, suggestions and paste, and refuses what it must not take', async function ({ page }) {
			var topics;
			var input;
			var chips;
			var invite;

			await open(page, origin, ['Selection']);

			topics = field(page, 'Topics');
			input = topics.locator('input.elemenx-tags-control');
			chips = function (owner) {
				return owner.locator('.elemenx-chip-label').allInnerTexts();
			};

			await topics.scrollIntoViewIfNeeded();

			await input.click();

			await page.keyboard.type('Perf');

			await expect(page.locator('.elemenx-popup:not([hidden]) .elemenx-option')).toHaveText(['performance']);

			await page.keyboard.press('Enter');

			expect(await chips(topics)).toEqual(['design', 'tokens', 'performance']);

			/* Case lower; a comma ends a tag. */
			await page.keyboard.type('API, Docs,');

			expect(await chips(topics)).toEqual(['design', 'tokens', 'performance', 'api', 'docs']);
			await expect(input).toHaveValue('');

			await page.keyboard.press('Backspace');

			expect(await chips(topics)).toEqual(['design', 'tokens', 'performance', 'api']);

			/* A pasted list, up to Max (6); what does not fit stays in the field. */
			await input.evaluate(function (node) {
				var data = new DataTransfer();

				data.setData('text/plain', 'x; y\nz');

				node.dispatchEvent(new ClipboardEvent('paste', {clipboardData: data, bubbles: true, cancelable: true}));
			});

			expect(await chips(topics)).toEqual(['design', 'tokens', 'performance', 'api', 'x', 'y']);
			await expect(input).toHaveValue('z');
			await expect(topics.locator('.elemenx-tags-field')).toHaveClass(/invalid/);

			await topics.getByRole('button', {name: 'Remove x'}).click();

			expect(await chips(topics)).toEqual(['design', 'tokens', 'performance', 'api', 'y']);

			invite = field(page, 'Invite');

			await invite.locator('input.elemenx-tags-control').click();

			await page.keyboard.type('bad-address');
			await page.keyboard.press('Enter');

			expect(await chips(invite)).toEqual([]);
			await expect(invite.locator('.elemenx-caption')).toHaveText('“bad-address”: not an e-mail address');

			await invite.locator('input.elemenx-tags-control').fill('');

			await page.keyboard.type('a@b.io');
			await page.keyboard.press('Enter');
			await page.keyboard.type('a@b.io');
			await page.keyboard.press('Enter');

			expect(await chips(invite)).toEqual(['a@b.io']);
			await expect(invite.locator('.elemenx-caption')).toHaveText('“a@b.io”: already there');
		});

		test('combobox filters, picks, creates a value, restores on Escape and loads options from a server', async function ({ page }) {
			var framework;
			var input;
			var options;
			var city;

			await open(page, origin, ['Selection', 'Forms']);

			framework = field(page, 'Framework');
			input = framework.locator('input[role="combobox"]');
			options = function () {
				return page.locator('.elemenx-popup:not([hidden]) .elemenx-option').allInnerTexts();
			};

			await framework.scrollIntoViewIfNeeded();

			await expect(input).toHaveValue('Elemenx');

			await input.click();

			await page.keyboard.type('v');

			expect(await options()).toEqual(['Vue', 'Svelte', 'Create “v”']);

			await page.keyboard.press('Enter');

			await expect(input).toHaveValue('Vue');
			await expect(framework.locator('.elemenx-caption')).toHaveText('Value: vue');

			/* A disabled option cannot be picked; a new text can be created. */
			await input.click();

			await page.keyboard.press('Control+A');
			await page.keyboard.type('ang');

			await expect(page.locator('.elemenx-popup:not([hidden]) .elemenx-option.disabled')).toHaveText('Angular');

			await page.keyboard.press('Control+A');
			await page.keyboard.type('Solid');

			expect(await options()).toEqual(['Create “Solid”']);

			await page.keyboard.press('Enter');

			await expect(input).toHaveValue('Solid');
			await expect(framework.locator('.elemenx-caption')).toHaveText('Value: Solid');

			await page.keyboard.press('Control+A');
			await page.keyboard.type('zz');
			await page.keyboard.press('Escape');
			await page.keyboard.press('Escape');

			await expect(input).toHaveValue('Solid');

			await framework.getByRole('button', {name: 'Clear'}).click();

			await expect(framework.locator('.elemenx-caption')).toHaveText('Value: —');

			city = field(page, 'City');

			await city.locator('input').click();

			await page.keyboard.type('ri');

			await expect(page.locator('.elemenx-popup:not([hidden]) .elemenx-option')).toHaveText(['Madrid', 'Paris', 'Riga']);

			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');

			await expect(city.locator('input')).toHaveValue('Riga');
		});

		test('city input finds the cities of GeoNames by name, without diacritics, and tells their time zone', async function ({ page }) {
			var city;

			await open(page, origin, ['Selection']);

			city = field(page, 'World city');

			await city.scrollIntoViewIfNeeded();
			await city.locator('input').click();

			await page.keyboard.press('ArrowDown');

			await expect(page.locator('.elemenx-popup:not([hidden]) .elemenx-popup-empty')).toHaveText('Type the name of a city');

			await page.keyboard.type('zurich');

			await expect(page.locator('.elemenx-popup:not([hidden]) .elemenx-option-label').first()).toHaveText('Zürich', {timeout: 15000});
			await expect(page.locator('.elemenx-popup:not([hidden]) .elemenx-option-hint').first()).toContainText('Switzerland · ');

			await page.keyboard.press('Enter');

			await expect(city.locator('input')).toHaveValue('Zürich');
			await expect(city.locator('.elemenx-caption')).toContainText('Zürich, Zurich, Switzerland · Europe/Zurich (UTC+0');

			await city.locator('input').click();

			await page.keyboard.press('Control+A');
			await page.keyboard.type('qqqzzz');

			await expect(page.locator('.elemenx-popup:not([hidden]) .elemenx-popup-empty')).toHaveText('No city found');
		});

		test('date range picks two days in either order, by pointer or keys, and from presets', async function ({ page }) {
			var period;
			var iso;
			var today;
			var later;
			var months;

			await open(page, origin, ['Selection']);

			period = field(page, 'Period');
			iso = function (date) {
				return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
			};
			today = new Date();
			later = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9);

			await period.scrollIntoViewIfNeeded();
			await period.locator('.elemenx-range-toggle').click();

			await expect(page.locator('.elemenx-range-month')).toHaveCount(2);
			await expect(page.locator('.elemenx-calendar-day[data-cursor="true"]')).toBeFocused();
			await expect(page.locator('.elemenx-calendar-day[data-cursor="true"]')).toHaveAttribute('data-date', iso(today));

			/* Keys: Enter on today, two days right and a week down, Enter. */
			await page.keyboard.press('Enter');
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowDown');

			await expect(page.locator('.elemenx-range-month .elemenx-calendar-day.within').first()).toBeVisible();

			await page.keyboard.press('Enter');

			await expect(period.locator('.elemenx-caption').last()).toHaveText(iso(today) + ' → ' + iso(later));

			/* The end first, then the start: the range comes out in order. */
			await period.locator('.elemenx-range-toggle').click();
			await page.locator('.elemenx-range-month .elemenx-calendar-day[data-date="' + iso(later) + '"]:not(.outside)').click();
			await page.locator('.elemenx-range-month .elemenx-calendar-day[data-date="' + iso(today) + '"]:not(.outside)').click();

			await expect(period.locator('.elemenx-caption').last()).toHaveText(iso(today) + ' → ' + iso(later));

			await period.locator('.elemenx-range-toggle').click();
			await page.locator('.elemenx-range-presets .elemenx-option', {hasText: 'Last 7 days'}).click();

			await expect(period.locator('.elemenx-caption').last()).toHaveText(iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)) + ' → ' + iso(today));

			/*
			 * A start picked in the second month keeps the first one in view, so an end before it can still be pressed
			 * (the months followed the picked day: a range across the end of a month could not be picked backwards).
			 */
			await period.locator('.elemenx-range-toggle').click();

			months = await page.locator('.elemenx-range-month').evaluateAll(function (nodes) {
				return nodes.map(function (node) {
					return node.querySelector('.elemenx-calendar-day:not(.outside)').getAttribute('data-date');
				});
			});

			await page.locator('.elemenx-range-month').nth(1).locator('.elemenx-calendar-day:not(.outside)').nth(2).click();

			await expect(page.locator('.elemenx-range-month').first().locator('.elemenx-calendar-day:not(.outside)').first()).toHaveAttribute('data-date', months[0]);

			await page.locator('.elemenx-range-month').first().locator('.elemenx-calendar-day:not(.outside)').nth(4).click();

			await expect(period.locator('.elemenx-caption').last()).toHaveText(months[0].substring(0, 8) + '05 → ' + months[1].substring(0, 8) + '03');
		});

		test('tree opens, selects, checks with parents, loads lazily, filters and moves by the keys', async function ({ page }) {
			var data;
			var busy;
			var tree;
			var rows;
			var row;

			await open(page, origin, ['Trees, tables and long lists', 'Overlays']);

			data = section(page, 'Trees, tables and long lists');
			tree = data.locator('.elemenx-tree');
			rows = function () {
				return tree.locator('.elemenx-tree-row').evaluateAll(function (nodes) {
					return nodes.map(function (node) {
						var state = node.getAttribute('aria-checked');

						return node.getAttribute('aria-level') + ':' + node.querySelector('.elemenx-tree-label').textContent + (state && state !== 'false' ? ' ' + state : '');
					});
				});
			};
			row = function (label) {
				return tree.locator('.elemenx-tree-row').filter({has: page.locator('.elemenx-tree-label', {hasText: new RegExp('^' + label + '$')})});
			};

			await tree.scrollIntoViewIfNeeded();

			expect(await rows()).toEqual(['1:src', '2:components', '2:services', '2:index.js', '1:remote (loads on open)', '1:locked.bin', '1:README.md']);

			await row('components').locator('.elemenx-tree-twisty').click();
			await row('Table.js').click();

			await expect(page.locator('#ui-kit-tree-state')).toHaveText('Selected: Table.js');
			await expect(row('Table.js')).toHaveAttribute('tabindex', '0');

			/* Keys: up to Button.js, Left twice (to the parent, then closes it), Right opens it again. */
			await page.keyboard.press('ArrowUp');

			await expect(row('Button.js')).toBeFocused();

			await page.keyboard.press('ArrowLeft');

			await expect(row('components')).toBeFocused();

			await page.keyboard.press('ArrowLeft');

			await expect(row('components')).toHaveAttribute('aria-expanded', 'false');

			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('i');

			await expect(row('index.js')).toBeFocused();

			/* Check boxes: two children make the parent mixed, the parent checks the rest. */
			await row('Button.js').locator('.elemenx-check').click();
			await row('Tree.js').locator('.elemenx-check').click();

			await expect(row('components')).toHaveAttribute('aria-checked', 'mixed');
			await expect(row('src')).toHaveAttribute('aria-checked', 'mixed');

			await row('components').focus();

			await page.keyboard.press(' ');

			await expect(row('components')).toHaveAttribute('aria-checked', 'true');
			await expect(row('Table.js')).toHaveAttribute('aria-checked', 'true');
			await expect(page.locator('#ui-kit-tree-state')).toHaveText('Checked: 4');

			/* A disabled item takes no check and no selection. */
			await row('locked.bin').click({force: true});

			await expect(page.locator('#ui-kit-tree-state')).toHaveText('Checked: 4');

			/* The row is busy while its items load (300 ms). */
			busy = await became(page, tree, '.elemenx-tree-row[aria-busy="true"]');

			await row('remote \\(loads on open\\)').locator('.elemenx-tree-twisty').click();

			await busy();

			await expect(row('backup-1.zip')).toBeVisible();
			await expect(row('remote')).toHaveAttribute('aria-expanded', 'true');

			await tree.locator('.elemenx-tree-search input').fill('toast');

			expect(await rows()).toEqual(['1:src mixed', '2:services', '3:Toast.js']);
		});

		test('virtual list draws only the rows in view of a hundred thousand and follows the keys', async function ({ page }) {
			var data;
			var list;
			var box;

			await open(page, origin, ['Trees, tables and long lists']);

			data = section(page, 'Trees, tables and long lists');
			list = data.locator('.elemenx-virtual-viewport');

			await list.scrollIntoViewIfNeeded();

			expect(await list.locator('.elemenx-virtual-row').count()).toBeLessThan(30);
			expect(await list.evaluate(function (node) {
				return node.scrollHeight;
			})).toBe(3200000);
			await expect.poll(async function () {
				return (await list.boundingBox()).width;
			}).toBeGreaterThan(200);

			await list.evaluate(function (node) {
				node.scrollTop = 32 * 50000;
			});

			await expect(list.locator('.elemenx-virtual-row', {hasText: 'Row 50003'})).toHaveCount(1);
			expect(await list.locator('.elemenx-virtual-row').count()).toBeLessThan(30);

			box = await list.locator('.elemenx-virtual-row', {hasText: 'Row 50003'}).boundingBox();

			await page.mouse.click(box.x + 20, box.y + box.height / 2);

			await expect(page.locator('#ui-kit-virtual-state')).toHaveText('Picked: Row 50003');

			await list.focus();

			await page.keyboard.press('End');

			await expect(list.locator('.elemenx-virtual-row.active')).toContainText('Row 100000');
			await expect(list.locator('.elemenx-virtual-row.active')).toHaveAttribute('aria-posinset', '100000');

			await page.keyboard.press('Enter');

			await expect(page.locator('#ui-kit-virtual-state')).toHaveText('Picked: Row 100000');
		});

		test('pagination shows its parts by choice and as many numbers around the page and at the ends as asked', async function ({ page }) {
			var data;
			var wide;
			var compact;

			await open(page, origin, ['Trees, tables and long lists']);

			data = section(page, 'Trees, tables and long lists');
			wide = data.getByRole('navigation', {name: 'Wide pages'});
			compact = data.getByRole('navigation', {name: 'Compact pages'});

			/* Two numbers at each end and two on each side of the page; a gap of a single page shows that page. */
			await expect(wide.locator('.elemenx-pagination-page:not([aria-label])')).toHaveText(['1', '2', '3', '11', '12']);
			await expect(wide.getByRole('button', {name: 'First page'})).toHaveCount(0);
			await expect(wide.getByRole('button', {name: 'Next page'})).toBeVisible();

			await wide.locator('.elemenx-pagination-page', {hasText: /^3$/}).click();

			await expect(page.locator('#ui-kit-results-page')).toHaveText('Results page 3');
			await expect(wide.locator('.elemenx-pagination-page:not([aria-label])')).toHaveText(['1', '2', '3', '4', '5', '11', '12']);

			await wide.locator('.elemenx-pagination-page', {hasText: /^5$/}).click();

			await expect(wide.locator('.elemenx-pagination-page:not([aria-label])')).toHaveText(['1', '2', '3', '4', '5', '6', '7', '11', '12']);
			await expect(wide.locator('.elemenx-pagination-gap')).toHaveCount(1);

			/* Without numbers: the range and the previous and next buttons. */
			await expect(compact.locator('.elemenx-pagination-pages')).toHaveCount(0);
			await expect(compact.locator('.elemenx-pagination-range')).toHaveText('81–100 of 240');

			await compact.getByRole('button', {name: 'Next page'}).click();

			await expect(page.locator('#ui-kit-results-page')).toHaveText('Results page 6');
			await expect(wide.locator('.elemenx-pagination-page[aria-current="page"]')).toHaveText('6');
		});

		test('table filters by text, list and number, pages its rows and shows tree rows', async function ({ page }) {
			var data;
			var table;
			var tree;
			var levels;
			var results;

			await open(page, origin, ['Trees, tables and long lists']);

			data = section(page, 'Trees, tables and long lists');
			table = data.locator('.elemenx-table-box').first();
			tree = data.locator('.elemenx-table-box').nth(1);
			levels = function () {
				return tree.locator('tbody tr').evaluateAll(function (rows) {
					return rows.map(function (row) {
						return row.getAttribute('aria-level') + ':' + row.querySelector('td').textContent.trim();
					});
				});
			};

			await table.scrollIntoViewIfNeeded();

			await expect(table.locator('.elemenx-pagination-range')).toHaveText('1–10 of 57');
			await expect(table.locator('tbody tr')).toHaveCount(10);
			await expect(table.locator('.elemenx-pagination-page:not([aria-label])')).toHaveText(['1', '2', '6']);

			await table.locator('.elemenx-pagination-page', {hasText: /^6$/}).click();

			await expect(table.locator('.elemenx-pagination-range')).toHaveText('51–57 of 57');
			await expect(table.locator('tbody tr')).toHaveCount(7);
			await expect(table.getByRole('button', {name: 'Next page'})).toBeDisabled();
			await expect(table.getByRole('button', {name: 'Last page'})).toBeDisabled();

			await table.getByRole('button', {name: 'First page'}).click();

			await expect(table.locator('.elemenx-pagination-range')).toHaveText('1–10 of 57');
			await expect(table.getByRole('button', {name: 'First page'})).toBeDisabled();
			await expect(table.getByRole('button', {name: 'Previous page'})).toBeDisabled();

			await table.getByRole('button', {name: 'Last page'}).click();

			await expect(table.locator('.elemenx-pagination-range')).toHaveText('51–57 of 57');

			/* The same Pagination on its own, under any list. */
			results = data.getByRole('navigation', {name: 'Search results'});

			await expect(results.locator('.elemenx-pagination-range')).toHaveText('1–20 of 240');
			await expect(results.locator('select')).toHaveCount(0);

			await results.getByRole('button', {name: 'Last page'}).click();

			await expect(page.locator('#ui-kit-results-page')).toHaveText('Results page 12');
			await expect(results.locator('.elemenx-pagination-range')).toHaveText('221–240 of 240');
			await expect(results.locator('.elemenx-pagination-page:not([aria-label])')).toHaveText(['1', '11', '12']);

			await results.locator('.elemenx-pagination-page', {hasText: /^11$/}).click();

			await expect(page.locator('#ui-kit-results-page')).toHaveText('Results page 11');

			await table.locator('select[aria-label="Filter Role"]').selectOption('Reviewer');

			await expect(table.locator('.elemenx-pagination-range')).toHaveText('1–10 of 19');

			await table.locator('input[aria-label="Filter Commits"]').fill('>500');

			await expect(table.locator('.elemenx-pagination-range')).toHaveText('1–9 of 9');

			for (const cell of await table.locator('tbody tr td:nth-child(3)').allInnerTexts())
				expect(Number(cell)).toBeGreaterThan(500);

			await table.locator('input[aria-label="Filter Commits"]').fill('100..300');
			await table.locator('select[aria-label="Filter Role"]').selectOption('');
			await table.locator('select[aria-label="Rows per page"]').selectOption('25');

			for (const cell of await table.locator('tbody tr td:nth-child(3)').allInnerTexts()) {
				expect(Number(cell)).toBeGreaterThanOrEqual(100);
				expect(Number(cell)).toBeLessThanOrEqual(300);
			}

			await table.locator('input[aria-label="Filter Name"]').fill('nobody');

			await expect(table.locator('.elemenx-table-empty')).toHaveText('No data');

			expect(await levels()).toEqual(['1:docs', '1:package.json', '1:src', '2:components', '2:index.js']);

			await tree.locator('tbody tr', {hasText: 'components'}).locator('.elemenx-table-twisty').click();
			await tree.getByRole('button', {name: 'Size'}).click();

			expect(await levels()).toEqual(['1:package.json', '1:docs', '1:src', '2:index.js', '2:components', '3:Button.js', '3:Tree.js', '3:Table.js']);

			await tree.locator('tbody tr', {hasText: 'docs'}).focus();

			await page.keyboard.press('ArrowRight');

			expect(await levels()).toContain('2:STYLE.md');
			await expect(tree.locator('tbody tr', {hasText: 'docs'})).toHaveAttribute('aria-expanded', 'true');
		});

		test('rating gives halves by pointer and keys; empty states show their variant', async function ({ page }) {
			var feedback;
			var rating;
			var stars;
			var box;

			await open(page, origin, ['Feedback']);

			feedback = section(page, 'Feedback');
			rating = feedback.locator('.elemenx-rating').first();
			stars = rating.locator('.elemenx-rating-star');

			await rating.scrollIntoViewIfNeeded();

			await expect(rating).toHaveAttribute('aria-valuenow', '3.5');
			await expect(stars.nth(3)).toHaveClass(/half/);

			box = await stars.nth(1).boundingBox();

			await page.mouse.click(box.x + 4, box.y + box.height / 2);

			await expect(page.locator('#ui-kit-stars')).toHaveText('1.5 / 5');

			await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);

			await expect(page.locator('#ui-kit-stars')).toHaveText('2 / 5');

			/* The same rating again clears it. */
			await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);

			await expect(page.locator('#ui-kit-stars')).toHaveText('0 / 5');

			await rating.focus();

			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowRight');

			await expect(page.locator('#ui-kit-stars')).toHaveText('1.5 / 5');

			await page.keyboard.press('End');

			await expect(page.locator('#ui-kit-stars')).toHaveText('5 / 5');
			await expect(feedback.locator('.elemenx-rating.readonly')).not.toHaveAttribute('tabindex', '0');

			await expect(feedback.locator('.elemenx-empty.search .elemenx-icon')).toHaveAttribute('data-icon', 'search');
			await expect(feedback.locator('.elemenx-empty.error')).toContainText('Could not load');
			await expect(feedback.locator('.elemenx-empty.error').getByRole('button', {name: 'Retry'})).toBeVisible();
			await expect(feedback.locator('.elemenx-empty.search .elemenx-empty-actions')).toBeHidden();
		});

		test('charts draw SVG, tell the values under the pointer, turn series off and keep a table for screen readers', async function ({ page }) {
			var charts;
			var line;
			var bars;
			var box;
			var errors;
			var svg = 'http://www.w3.org/2000/svg';

			await open(page, origin, ['Charts and calendar']);

			charts = section(page, 'Charts and calendar');
			line = charts.locator('.elemenx-chart').nth(0);
			bars = charts.locator('.elemenx-chart').nth(1);

			await line.scrollIntoViewIfNeeded();

			await expect(line.locator('path.elemenx-chart-line')).toHaveCount(2);
			expect(await line.locator('path.elemenx-chart-line').first().evaluate(function (node) {
				return node.namespaceURI + ' ' + (node.getTotalLength() > 100);
			})).toBe(svg + ' true');
			expect(await line.locator('svg').evaluate(function (node) {
				return node.viewBox.baseVal.width === node.width.baseVal.value;
			})).toBe(true);
			await expect(line.locator('.elemenx-chart-tick').first()).toHaveText('0 k$');

			box = await line.locator('svg').boundingBox();

			await page.mouse.move(box.x + 48 + (box.width - 56) * 8 / 11, box.y + 60);

			await expect(line.locator('.elemenx-chart-tooltip')).toContainText('Sep');
			await expect(line.locator('.elemenx-chart-tooltip')).toContainText('72 k$');
			await expect(line.locator('.elemenx-chart-point')).toHaveCount(2);

			await page.mouse.move(box.x + box.width / 2, box.y + box.height + 120);

			await expect(line.locator('.elemenx-chart-tooltip')).toHaveCount(0);

			await expect(bars.locator('.elemenx-chart-bar')).toHaveCount(12);

			await bars.locator('.elemenx-chart-key', {hasText: 'Desktop'}).click();

			await expect(bars.locator('.elemenx-chart-bar')).toHaveCount(8);
			await expect(bars.locator('.elemenx-chart-key', {hasText: 'Desktop'})).toHaveAttribute('aria-pressed', 'false');

			await expect(charts.locator('.elemenx-chart.donut .elemenx-chart-slice')).toHaveCount(5);

			/* The pointer over a donut: the slice under it shows in the tooltip, and nothing fails. */
			errors = captureErrors(page);

			await charts.locator('.elemenx-chart.donut svg').scrollIntoViewIfNeeded();

			box = await charts.locator('.elemenx-chart.donut svg').boundingBox();

			await page.mouse.move(box.x + 4, box.y + 4);
			await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, {steps: 6});

			await expect(charts.locator('.elemenx-chart.donut .elemenx-chart-tooltip')).toContainText('Chrome');
			await expect(charts.locator('.elemenx-chart.donut .elemenx-chart-tooltip')).toContainText('64 %');
			expect(errors).toEqual([]);
			await expect(charts.locator('.elemenx-chart.area .elemenx-chart-area')).toHaveCount(2);
			await expect(line.locator('table.elemenx-chart-data caption')).toHaveText('Revenue and costs');
			await expect(line.locator('table.elemenx-chart-data tbody tr')).toHaveCount(2);

			await expect(charts.locator('.elemenx-sparkline')).toHaveCount(3);
			await expect(charts.locator('.elemenx-sparkline.bar .elemenx-sparkline-bar')).toHaveCount(12);
			expect(await charts.locator('.elemenx-sparkline-line').first().getAttribute('d')).toMatch(/^M[\d.]+ [\d.]+ L/);
		});

		test('calendar lists the events of each day, switches to the week, places timed events and reports presses', async function ({ page }) {
			var charts;
			var calendar;
			var today;
			var iso;

			await open(page, origin, ['Charts and calendar']);

			charts = section(page, 'Charts and calendar');
			calendar = charts.locator('.elemenx-cal');
			iso = function (date) {
				return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
			};
			today = calendar.locator('.elemenx-cal-day[data-date="' + iso(new Date()) + '"]');

			await calendar.scrollIntoViewIfNeeded();

			await expect(today).toHaveClass(/today/);
			await expect(today.locator('.elemenx-cal-event')).toHaveText([/09:30\s*Stand-up/, /10:00\s*Design review/, /10:30\s*Pairing/]);
			await expect(today.locator('.elemenx-cal-more')).toHaveText('+2 more');

			await today.locator('.elemenx-cal-event', {hasText: 'Pairing'}).click();

			await expect(charts.locator('.elemenx-section-header')).toContainText('Event: Pairing');

			await today.click({position: {x: 6, y: 8}});

			await expect(charts.locator('.elemenx-section-header')).toContainText('Day: ' + iso(new Date()));

			await today.locator('.elemenx-cal-more').click();

			await expect(calendar).toHaveClass(/week/);
			await expect(calendar.getByRole('button', {name: 'Week'})).toHaveAttribute('aria-pressed', 'true');
			await expect(calendar.locator('.elemenx-cal-column.today .elemenx-cal-block')).toHaveCount(5);

			/* Design review and Pairing overlap: they share the column in two lanes. */
			expect(await calendar.locator('.elemenx-cal-block', {hasText: 'Pairing'}).evaluate(function (node) {
				return node.style.left;
			})).toBe('50%');

			await calendar.locator('.elemenx-cal-column').first().click({position: {x: 10, y: 4}});

			await expect(charts.locator('.elemenx-section-header')).toContainText(/Slot: \d{4}-\d{2}-\d{2} 07:00/);

			await calendar.getByRole('button', {name: 'Next'}).click();

			await expect(calendar.locator('.elemenx-cal-column.today')).toHaveCount(0);

			await calendar.getByRole('button', {name: 'Today'}).click();

			await expect(calendar.locator('.elemenx-cal-column.today')).toHaveCount(1);
		});

		test('calendar moves events by dragging and by Alt with the arrows, stretches their end and cancels on Escape', async function ({ page }) {
			var charts;
			var calendar;
			var note;
			var iso;
			var day;
			var box;
			var step;

			await open(page, origin, ['Charts and calendar']);

			charts = section(page, 'Charts and calendar');
			calendar = charts.locator('.elemenx-cal');

			note = charts.locator('.elemenx-section-header');
			iso = function (offset) {
				var date = new Date();

				date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);

				return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
			};
			day = function (title) {
				return calendar.locator('.elemenx-cal-event', {hasText: title}).locator('xpath=ancestor::div[contains(@class, "elemenx-cal-day")]').getAttribute('data-date');
			};

			await calendar.scrollIntoViewIfNeeded();

			/* The week starts on Monday by default (regression: it followed the locale, Sunday for en). */
			await expect(calendar.locator('.elemenx-cal-weekday').first()).toHaveText(/^Mo/);

			/* Month: a day aside keeps the times; to the right, or to the left from the last day of a week row. */
			box = await calendar.locator('.elemenx-cal-event', {hasText: 'Retrospective'}).boundingBox();
			step = await calendar.locator('.elemenx-cal-event', {hasText: 'Retrospective'}).evaluate(function (node) {
				var cell = node.closest('.elemenx-cal-day');

				return cell.nextElementSibling && cell.nextElementSibling.getBoundingClientRect().top === cell.getBoundingClientRect().top ? 1 : -1;
			});

			await page.mouse.move(box.x + 20, box.y + 8);
			await page.mouse.down();
			await page.mouse.move(box.x + 20 + step * (box.width + 12), box.y + 8, {steps: 8});

			await expect(calendar.locator('.elemenx-cal-day.drop')).toHaveAttribute('data-date', iso(2 + step));
			await expect(calendar.locator('.elemenx-cal-event.dragged')).toHaveCount(1);

			await page.mouse.up();

			await expect(note).toContainText('Moved: Retrospective → ' + iso(2 + step) + ' 15:00 – ' + iso(2 + step) + ' 16:00');
			expect(await day('Retrospective')).toBe(iso(2 + step));

			/* Week: another day and time, in quarters of an hour, with a shadow while dragging; to the right, or to the left from the last day of the week (regression: the test failed on the last day). */
			await calendar.getByRole('button', {name: 'Week'}).click();
			await calendar.locator('.elemenx-cal-week-body').scrollIntoViewIfNeeded();

			box = await calendar.locator('.elemenx-cal-block', {hasText: 'Lunch talk'}).boundingBox();
			step = await calendar.locator('.elemenx-cal-block', {hasText: 'Lunch talk'}).evaluate(function (node) {
				return node.closest('.elemenx-cal-column').nextElementSibling ? 1 : -1;
			});

			await page.mouse.move(box.x + 20, box.y + 6);
			await page.mouse.down();
			await page.mouse.move(box.x + 20 + step * (box.width + 12), box.y + 6 + 96, {steps: 10});

			await expect(calendar.locator('.elemenx-cal-shadow')).toHaveText('14:30 – 15:15');

			await page.mouse.up();

			await expect(note).toContainText('Moved: Lunch talk → ' + iso(step) + ' 14:30 – ' + iso(step) + ' 15:15');
			await expect(calendar.locator('.elemenx-cal-shadow')).toHaveCount(0);

			/* The lower edge: the end moves, the start stays. */
			box = await calendar.locator('.elemenx-cal-block', {hasText: 'Design review'}).boundingBox();

			await page.mouse.move(box.x + box.width / 2, box.y + box.height - 2);
			await page.mouse.down();
			await page.mouse.move(box.x + box.width / 2, box.y + box.height - 2 + 48, {steps: 6});
			await page.mouse.up();

			await expect(note).toContainText('Moved: Design review → ' + iso(0) + ' 10:00 – ' + iso(0) + ' 12:30');

			/* Escape cancels: nothing moves and the release does not select the event. */
			box = await calendar.locator('.elemenx-cal-block', {hasText: 'Pairing'}).boundingBox();

			await page.mouse.move(box.x + 10, box.y + 10);
			await page.mouse.down();
			await page.mouse.move(box.x + 10, box.y + 150, {steps: 5});
			await page.keyboard.press('Escape');
			await page.mouse.up();

			await expect(note).toContainText('Moved: Design review');
			await expect(calendar.locator('.elemenx-cal-shadow')).toHaveCount(0);

			await calendar.locator('.elemenx-cal-block', {hasText: 'Pairing'}).focus();

			await page.keyboard.press('Alt+ArrowDown');

			await expect(note).toContainText('Moved: Pairing → ' + iso(0) + ' 10:45 – ' + iso(0) + ' 12:15');

			await calendar.locator('.elemenx-cal-block', {hasText: 'Pairing'}).click();

			await expect(note).toContainText('Event: Pairing');
		});

		test('calendar draws events of several days as bars, cuts the night, repeats events, shows a day and plans a quarter', async function ({ page }) {
			var charts;
			var calendar;
			var note;
			var iso;
			var cell;
			var dates;
			var box;
			var target;

			await open(page, origin, ['Charts and calendar']);

			charts = section(page, 'Charts and calendar');
			calendar = charts.locator('.elemenx-cal');
			note = charts.locator('.elemenx-section-header');
			iso = function (offset) {
				var date = new Date();

				date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);

				return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
			};
			cell = function (offset) {
				return calendar.locator('.elemenx-cal-day[data-date="' + iso(offset) + '"]');
			};

			await calendar.scrollIntoViewIfNeeded();

			/* The month shows the days around today: the next one when today is late in its month. */
			if (await cell(10).count() === 0)
				await calendar.getByRole('button', {name: 'Next'}).click();

			/* An event of several days is a bar in the same row of each of its days, its title in its first day alone. */
			await expect(cell(3).locator('.elemenx-cal-event.bar', {hasText: 'Team offsite'})).toHaveCount(1);
			expect(await calendar.locator('.elemenx-cal-event.bar[data-id="offsite"]').evaluateAll(function (bars) {
				return bars.map(function (bar) {
					return Math.round(bar.getBoundingClientRect().top - bar.closest('.elemenx-cal-day').getBoundingClientRect().top);
				}).filter(function (top, index, all) {
					return all.indexOf(top) === index;
				}).length;
			})).toBe(1);

			/* An event that ends at midnight is not in the day after (regression: that day listed it). */
			await expect(cell(9).locator('.elemenx-cal-event', {hasText: 'Launch party'})).toHaveCount(1);
			await expect(cell(10).locator('.elemenx-cal-event[data-id="party"]')).toHaveCount(0);

			/* A recurring event: on its days of the week alone, from its first day on. */
			dates = await calendar.locator('.elemenx-cal-event', {hasText: 'Gym'}).evaluateAll(function (events) {
				return events.map(function (event) {
					return event.closest('.elemenx-cal-day').getAttribute('data-date');
				});
			});

			expect(dates.length).toBeGreaterThan(3);

			dates.forEach(function (date) {
				var parts = date.split('-');

				expect([2, 4, 6]).toContain(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay());
				expect(date > iso(0)).toBe(true);
			});

			/* Alt with an arrow moves one occurrence: the page leaves its day out of the series. */
			await calendar.locator('.elemenx-cal-day[data-date="' + dates[0] + '"] .elemenx-cal-event', {hasText: 'Gym'}).focus();

			await page.keyboard.press('Alt+ArrowRight');

			await expect(note).toContainText('Moved: Gym (' + dates[0] + ')');
			await expect(calendar.locator('.elemenx-cal-day[data-date="' + dates[0] + '"] .elemenx-cal-event', {hasText: 'Gym'})).toHaveCount(0);

			/* The end of a bar dragged to another day of its row: its last day moves, its first stays. */
			box = await cell(5).locator('.elemenx-cal-event[data-id="offsite"] .elemenx-cal-resize').boundingBox();
			target = Math.abs((await cell(6).boundingBox()).y - box.y) < 40 ? 6 : 4;

			await page.mouse.move(box.x + 2, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move((await cell(target).boundingBox()).x + 20, box.y + box.height / 2, {steps: 6});
			await page.mouse.up();

			await expect(note).toContainText('Moved: Team offsite → ' + iso(3) + ' – ' + iso(target));

			/* The weeks: the piece of the night deploy after midnight ends before StartHour, none in the hours (regression: half an hour at 07:00). */
			await calendar.getByRole('button', {name: 'Today'}).click();
			await calendar.getByRole('button', {name: 'Week'}).click();

			while (await calendar.locator('.elemenx-cal-column[data-date="' + iso(7) + '"]').count() === 0) {
				await calendar.getByRole('button', {name: 'Next'}).click();
			}

			await expect(calendar.locator('.elemenx-cal-column[data-date="' + iso(7) + '"] .elemenx-cal-block[data-id="deploy"]')).toHaveCount(0);

			/* An event of a day or more is a bar above the hours. */
			while (await calendar.locator('.elemenx-cal-allday[data-date="' + iso(8) + '"]').count() === 0) {
				await calendar.getByRole('button', {name: 'Next'}).click();
			}

			await expect(calendar.locator('.elemenx-cal-allday[data-date="' + iso(8) + '"] .elemenx-cal-event', {hasText: 'Conference'})).toHaveCount(1);
			await expect(calendar.locator('.elemenx-cal-block', {hasText: 'Conference'})).toHaveCount(0);

			/* The day: one column of hours. */
			await calendar.getByRole('button', {name: 'Today'}).click();
			await calendar.getByRole('button', {name: 'Day', exact: true}).click();

			await expect(calendar).toHaveClass(/day/);
			await expect(calendar.locator('.elemenx-cal-column')).toHaveCount(1);
			await expect(calendar.locator('.elemenx-cal-column.today .elemenx-cal-block')).toHaveCount(5);

			/* The quarter: a Timeline of the events by days; a press on one selects it, the arrows go to the next quarter. */
			await calendar.getByRole('button', {name: 'Quarter'}).click();

			await expect(calendar.locator('.elemenx-timeline')).toHaveCount(1);
			await expect(calendar.locator('.elemenx-cal-title')).toHaveText(new RegExp('^Q' + (Math.floor(new Date().getMonth() / 3) + 1) + ' '));

			await calendar.getByRole('button', {name: /^Design review,/}).click();

			await expect(note).toContainText('Event: Design review');

			await calendar.getByRole('button', {name: 'Next'}).click();

			await expect(calendar.locator('.elemenx-cal-title')).toHaveText(new RegExp('^Q' + ((Math.floor(new Date().getMonth() / 3) + 1) % 4 + 1) + ' '));
			await expect(calendar.locator('.elemenx-timeline-range[data-id="standup"]')).toHaveCount(0);

			await calendar.getByRole('button', {name: 'Year'}).click();

			await expect(calendar.locator('.elemenx-cal-title')).toHaveText(/^\d{4}$/);
		});

		test('steps take custom content and a disabled step is not clickable', async function ({ page }) {
			var custom;

			await open(page, origin, ['Steps and timeline']);

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

			await open(page, origin, ['Layouts']);

			layouts = section(page, 'Layouts');
			nav = layouts.locator('.elemenx-dashboard .elemenx-nav');

			await expect(layouts.locator('.elemenx-dashboard-widget')).toHaveCount(5);

			await nav.locator('.elemenx-nav-row', {hasText: 'Builds'}).click();

			await expect(nav.locator('.elemenx-nav-row.active')).toHaveText('Builds');

			await layouts.getByRole('button', {name: 'Collapse the navigation'}).click();

			await expect(nav).toHaveClass(/collapsed/);
			await expect.poll(async function () {
				return (await layouts.locator('.elemenx-dashboard-nav').boundingBox()).width;
			}).toBe(64);

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