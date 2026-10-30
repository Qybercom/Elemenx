import { chromium } from '@playwright/test';
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

	Todo: async function (page) {
		var field = page.getByLabel('New task');

		await field.fill('Buy milk');
		await field.press('Enter');
		await field.fill('Call Ada');

		await page.getByRole('button', {name: 'Add'}).click();

		await expect(page.locator('.todo-title')).toHaveText(['Buy milk', 'Call Ada']);

		await page.getByText('Buy milk').click();

		await expect(page.locator('.todo-left')).toHaveText('1 left');

		await page.getByRole('button', {name: 'Clear done'}).click();
		await page.reload();

		await expect(page.locator('.todo-title')).toHaveText(['Call Ada']);
	},

	Collection: async function (page) {
		var hero = page.locator('.elemenx-media-hero');

		/* The home page: the featured film begun (Resume), a shelf of the titles begun and one of each kind. */
		await expect(hero.locator('h1')).toHaveText('The Long Light');
		await expect(hero.getByRole('button', {name: 'Resume'})).toBeVisible();
		await expect(page.locator('.elemenx-media-shelf')).toHaveCount(4);

		/* See all of the music: four albums; the facet of Jazz leaves two, its count told before. */
		await page.locator('.elemenx-media-shelf', {hasText: 'Music'}).getByRole('button', {name: 'See all'}).click();

		await expect(page).toHaveURL(/\/browse\/music$/);
		await expect(page.locator('h1')).toHaveText('Music');
		await expect(page.locator('.collection-count')).toHaveText('4 of 4');
		await expect(page.locator('[data-facet="genre"] .elemenx-facet-option', {hasText: 'Jazz'}).locator('.elemenx-facet-count')).toHaveText('2');

		await page.locator('[data-facet="genre"]').getByText('Jazz').click();

		await expect(page.locator('.collection-count')).toHaveText('2 of 4');
		await expect(page.locator('.elemenx-facet-filter-chip')).toHaveText('Genre: Jazz');

		/* An album: its tracks; a press plays one, a press on it again pauses it. */
		await page.locator('.elemenx-media-card', {hasText: 'Tides'}).click();

		await expect(page).toHaveURL(/\/title\/tides$/);
		await expect(hero.locator('h1')).toHaveText('Tides');
		await expect(page.locator('.elemenx-track')).toHaveCount(6);

		await page.locator('.elemenx-track', {hasText: 'Morning Tide'}).click();

		await expect(page.locator('.collection-status')).toHaveText('Playing Morning Tide');
		await expect(page.locator('.elemenx-track.playing')).toContainText('Morning Tide');

		await page.locator('.elemenx-track', {hasText: 'Morning Tide'}).click();

		await expect(page.locator('.collection-status')).toHaveText('Paused Morning Tide');

		/* Kept with the heart, still kept after a reload. */
		await hero.getByRole('button', {name: 'Favorite'}).click();

		await page.reload();

		await expect(page.locator('.elemenx-media-hero').getByRole('button', {name: 'Favorite'})).toHaveAttribute('aria-pressed', 'true');

		/* A film: its cast, and more of its genre. */
		await page.locator('.elemenx-media-shelf', {hasText: 'More like this'}).locator('.elemenx-media-card').first().click();

		await expect(page.locator('.elemenx-media-hero h1')).not.toHaveText('Tides');

		await page.goto(new URL(page.url()).origin + '/title/north');

		await expect(page.locator('.elemenx-cast-person')).toHaveCount(6);
	},

	Telemetry: async function (page) {
		/* What the board shows a second, and how far behind the feed its latest packet is (the server and the page share the clock). */
		var stats = function () {
			return page.evaluate(function () {
				var board = Elemenx.Instance(document.querySelector('.telemetry'));
				var feed = board.$Service('Feed');

				return Object.assign({Received: feed.Received, Behind: feed.Latest ? Date.now() - feed.Latest.Time : null}, board.Stats);
			});
		};

		/* The packets the page received a second over a few seconds, whatever one second of them was. */
		var rate = async function () {
			var first = await stats();

			await page.waitForTimeout(3000);

			return ((await stats()).Received - first.Received) / 3;
		};

		/* The race car: its channels, then the feed at 20 packets a second, each shown. */
		await expect(page.locator('.telemetry-group h2').first()).toHaveText('Drive');
		await expect(page.locator('.telemetry-channel')).toHaveCount(37);

		await expect.poll(async function () {
			return (await stats()).Updates;
		}, {timeout: 10000}).toBeGreaterThanOrEqual(10);

		expect(await rate()).toBeGreaterThanOrEqual(17);

		/* The cluster: sixty channels, its own theme gone from the board (the car had darcula). */
		await page.locator('.telemetry-header').getByText('Server cluster').click();

		await expect(page.locator('.telemetry-channel')).toHaveCount(60);
		await expect(page.locator('.telemetry')).not.toHaveAttribute('data-theme', 'darcula');

		/*
		 * 120 packets a second on a processor four times slower (a busy machine): they all come, the board keeps up
		 * with the feed (it skips frames rather than fall behind), and its updates follow its frames.
		 */
		var cdp = await page.context().newCDPSession(page);

		await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});

		await page.evaluate(function () {
			Elemenx.Instance(document.querySelector('.telemetry')).Rated(120);
		});

		await page.waitForTimeout(1000);

		/*
		 * The feed comes from a server in the process of this test: a stall of that process on a loaded machine (a
		 * second of it) costs a window of three seconds a third of its packets, while the page is fine. A page that
		 * does not keep up fails every window; a stall fails one, and the next one is measured.
		 */
		await expect(async function () {
			expect(await rate()).toBeGreaterThanOrEqual(100);
		}).toPass({timeout: 20000});

		var at;

		/*
		 * The page held up a moment (a busy machine) answers the test before the packets that wait for it, which come at
		 * once after: it is asked again. A page that does not keep up stays behind.
		 */
		await expect.poll(async function () {
			at = await stats();

			return at.Behind;
		}, {timeout: 10000}).toBeLessThan(500);

		/* The second just after it may have had no update: it shows that a second later. */
		await expect.poll(async function () {
			at = await stats();

			return at.Updates;
		}, {timeout: 5000}).toBeGreaterThanOrEqual(1);

		/* Half of the frames at most carry an update: the page keeps time for the rest (without it, every frame had one). */
		expect(at.Fps).toBeGreaterThanOrEqual(at.Updates * 2);

		await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});

		/*
		 * The page held up three seconds just after an update: the next one comes within a second, not three seconds
		 * later (a bug: the board took the frame held up for one of its own and waited as long as it lasted).
		 */
		var held = await page.evaluate(function () {
			var board = Elemenx.Instance(document.querySelector('.telemetry'));

			return new Promise(function (resolve) {
				function after () {
					var until;

					if (!board.Own().Drew) {
						window.requestAnimationFrame(after);

						return;
					}

					until = Date.now() + 3000;

					while (Date.now() < until) {
						/* The page held up. */
					}

					resolve(board.Own().Seq);
				}

				window.requestAnimationFrame(after);
			});
		});

		await expect.poll(function () {
			return page.evaluate(function () {
				return Elemenx.Instance(document.querySelector('.telemetry')).Own().Seq;
			});
		}, {timeout: 2000}).not.toBe(held);

		/* Paused: the packets go on, the board stays (a page just held up, on a busy machine, answers late). */
		await page.getByRole('button', {name: 'Pause'}).click();

		await expect.poll(async function () {
			return (await stats()).Updates;
		}, {timeout: 15000}).toBe(0);
	},

	Signup: async function (page) {
		var field = function (label) {
			return page.locator('.elemenx-field').filter({has: page.getByText(label, {exact: true})});
		};

		/* An empty form: every field shows its error, nothing is sent. */
		await page.getByRole('button', {name: 'Create my account'}).click();

		await expect(field('Name').locator('.elemenx-field-error')).toBeVisible();
		await expect(field('Email').locator('.elemenx-field-error')).toBeVisible();

		/* The server knows the name; a free one passes. */
		await page.getByLabel('Name', {exact: true}).fill('ada');

		await expect(field('Name').locator('.elemenx-field-error')).toHaveText('This name is taken');

		await page.getByLabel('Name', {exact: true}).fill('linus');

		await expect(field('Name').locator('.elemenx-field-error')).toHaveCount(0);

		await page.getByLabel('Email', {exact: true}).fill('ada@example.com');
		await page.getByLabel('Password', {exact: true}).fill('longenough');
		await page.getByLabel('Repeat the password').fill('different1');
		await page.getByLabel('Repeat the password').blur();

		await expect(field('Password').locator('.elemenx-field-error')).toHaveText('Add a digit');
		await expect(field('Repeat the password').locator('.elemenx-field-error')).toHaveText('The passwords differ');

		await page.getByLabel('Password', {exact: true}).fill('different1');

		await expect(field('Repeat the password').locator('.elemenx-field-error')).toHaveCount(0);

		/* The phones: a wrong one shows its error, a second row comes and goes. */
		await page.getByLabel('Phone').first().fill('call me');
		await page.getByLabel('Phone').first().blur();

		await expect(page.locator('.signup-phone .elemenx-field-error')).toHaveText('Digits, spaces and a + only');

		await page.getByLabel('Phone').first().fill('+44 20 7946 0000');
		await page.getByRole('button', {name: 'Add a phone'}).click();

		await expect(page.locator('.signup-phone')).toHaveCount(2);

		await page.getByRole('button', {name: 'Remove the phone'}).last().click();

		await expect(page.locator('.signup-phone')).toHaveCount(1);

		await page.getByText('I accept the terms').click();

		/* Valid in the browser, refused by the server: its error goes under the email, until the email changes. */
		await page.getByRole('button', {name: 'Create my account'}).click();

		await expect(field('Email').locator('.elemenx-field-error')).toHaveText('This email has an account already');

		await page.getByLabel('Email', {exact: true}).fill('linus@example.com');

		await expect(field('Email').locator('.elemenx-field-error')).toHaveCount(0);

		await page.getByRole('button', {name: 'Create my account'}).click();

		await expect(page.locator('.elemenx-callout.success')).toContainText('Welcome, linus!');
	},

	Dashboard: async function (page) {
		var visitors;

		/* The stream: the state, the numbers, the chart and the orders come as the server sends them. */
		await expect(page.locator('.live-state')).toHaveText('Live');
		await expect(page.locator('.live-orders')).not.toHaveText('0', {timeout: 10000});
		await expect(page.locator('.live-orders-list li').first()).toContainText('#1001');
		await expect(page.locator('.live-revenue')).toContainText('€');
		await expect(page.getByRole('img', {name: 'Visitors, the last minute'})).toBeVisible();

		/* Paused: nothing more comes; resumed: the server goes on after the last tick, so no order comes twice. */
		await page.getByRole('button', {name: 'Pause'}).click();

		await expect(page.locator('.live-state')).toHaveText('Paused');

		visitors = await page.locator('.live-orders').textContent();

		await page.waitForTimeout(1500);

		await expect(page.locator('.live-orders')).toHaveText(visitors);

		await page.getByRole('button', {name: 'Resume'}).click();

		await expect(page.locator('.live-state')).toHaveText('Live');
		await expect(page.locator('.live-orders')).not.toHaveText(visitors, {timeout: 10000});

		expect(await page.locator('.live-orders-list li').evaluateAll(function (rows) {
			var names = rows.map(function (row) {
				return row.textContent.split(' · ')[0];
			});

			return names.length === new Set(names).size;
		})).toBe(true);
	},

	Notes: async function (page) {
		var other;
		var compose = page.getByLabel('Note', {exact: true});
		var server = function () {
			return page.evaluate(async function () {
				return (await (await fetch('/api/notes')).json()).Notes.filter(function (note) {
					return !note.Deleted;
				}).map(function (note) {
					return note.Text;
				}).sort();
			});
		};

		await expect(page.locator('.notes-status')).toHaveText('Synced');

		await compose.fill('Online note');

		await page.getByRole('button', {name: 'Add'}).click();

		await expect(page.locator('.notes-text')).toHaveText(['Online note']);
		await expect(page.locator('.notes-status')).toHaveText('Synced');

		/* Offline: the notes still change, and the changes wait in the outbox. */
		await page.context().setOffline(true);

		await expect(page.locator('.notes-status')).toHaveText('Offline');

		await compose.fill('Written on a train');

		await page.getByRole('button', {name: 'Add'}).click();

		await page.locator('.notes-item').filter({hasText: 'Online note'}).getByRole('button', {name: 'Edit'}).click();

		await expect(compose).toHaveValue('Online note');

		await compose.fill('Online note, edited offline');

		await page.getByRole('button', {name: 'Save'}).click();

		await expect(page.locator('.notes-text')).toHaveText(['Online note, edited offline', 'Written on a train']);
		await expect(page.locator('.notes-status')).toHaveText('Offline · 2 waiting');

		/* Back online: the outbox goes to the server. */
		await page.context().setOffline(false);

		await expect(page.locator('.notes-status')).toHaveText('Synced');

		expect(await server()).toEqual(['Online note, edited offline', 'Written on a train']);

		await page.locator('.notes-item').filter({hasText: 'Written on a train'}).getByRole('button', {name: 'Delete'}).click();

		await expect(page.locator('.notes-text')).toHaveText(['Online note, edited offline']);
		await expect(page.locator('.notes-status')).toHaveText('Synced');

		expect(await server()).toEqual(['Online note, edited offline']);

		/* Another device, a browser with an empty database: it takes the notes from the server. */
		other = await page.context().browser().newPage();

		try {
			await other.goto(page.url());

			await expect(other.locator('.notes-text')).toHaveText(['Online note, edited offline']);
		}
		finally {
			await other.close();
		}
	},

	Auth: async function (page) {
		var origin = new URL(page.url()).origin;
		var refused = false;

		/* A guest who asks for the account goes to sign in, and comes back after it. */
		await page.goto(origin + '/account');

		await expect(page).toHaveURL(/\/login\?return=%2Faccount$/);

		await page.getByLabel('Email').fill('ada@example.com');
		await page.getByLabel('Password', {exact: true}).fill('wrong password');
		await page.getByRole('button', {name: 'Sign in'}).click();

		await expect(page.getByRole('alert').filter({hasText: 'The email or the password is wrong.'})).toBeVisible();

		await page.getByLabel('Password', {exact: true}).fill('correct horse 7');
		await page.getByRole('button', {name: 'Sign in'}).click();

		await expect(page).toHaveURL(/\/account$/);
		await expect(page.locator('.account-name')).toHaveText('Ada Lovelace');

		/* The refresh token is a cookie the page cannot read; a reload restores the session with it. */
		expect(await page.evaluate(function () {
			return document.cookie;
		})).not.toContain('refresh');

		/* And an access token that expired: the first answer of /api/me is 401, the Session renews it and asks again. */
		await page.route('**/api/me', function (route) {
			if (refused)
				return route.continue();

			refused = true;

			return route.fulfill({status: 401, contentType: 'application/json', body: '{"Error": "The token expired."}'});
		});

		await page.reload();

		await expect(page.locator('.account-name')).toHaveText('Ada Lovelace');
		await expect(page.locator('.auth-user')).toHaveText('Ada Lovelace');

		expect(refused).toBe(true);

		await page.unroute('**/api/me');

		/* Out: the cookie is forgotten, the account asks to sign in again, even after a reload. */
		await page.getByRole('button', {name: 'Sign out'}).click();

		await expect(page).toHaveURL(origin + '/');

		await page.goto(origin + '/account');

		await expect(page).toHaveURL(/\/login\?return=%2Faccount$/);

		/* A return to another site is refused. */
		await page.goto(origin + '/login?return=' + encodeURIComponent('//example.com/'));
		await page.getByLabel('Email').fill('ada@example.com');
		await page.getByLabel('Password', {exact: true}).fill('correct horse 7');
		await page.getByRole('button', {name: 'Sign in'}).click();

		await expect(page).toHaveURL(origin + '/account');
	},

	Languages: async function (page) {
		var language = async function (name) {
			await page.locator('.trip-header .elemenx-select-trigger, .trip-header [role="combobox"]').first().click();
			await page.getByRole('option', {name: name}).click();
		};
		var nights = async function (count) {
			var slider = page.getByRole('slider');

			await slider.focus();
			await slider.press('Home');

			for (var i = 1; i < count; i++)
				await slider.press('ArrowUp');
		};

		/* English: the plural of en, the dates and the price in its manner. */
		await expect(page.locator('h1')).toHaveText('Seaside');
		await expect(page.locator('.trip-nights')).toHaveText('3 nights');
		await expect(page.locator('.trip-dates')).toHaveText('July 14 – July 17');
		await expect(page.locator('.trip-total')).toHaveText('Total: €252.00');

		await nights(1);

		await expect(page.locator('.trip-nights')).toHaveText('1 night');

		/* Russian: one, few, many. */
		await language('Русский');

		await expect(page.locator('h1')).toHaveText('У моря');
		await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
		await expect(page.locator('.trip-nights')).toHaveText('1 ночь');
		await expect(page.locator('.trip-dates')).toHaveText('14 июля – 15 июля');

		await nights(3);

		await expect(page.locator('.trip-nights')).toHaveText('3 ночи');

		await nights(5);

		await expect(page.locator('.trip-nights')).toHaveText('5 ночей');
		await expect(page.locator('.trip-total')).toContainText('420,00');

		/* Arabic: right to left, its own plural forms, and the arrow keys that keep their meaning. */
		await language('العربية');

		await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
		await expect(page.locator('h1')).toHaveText('على البحر');

		await nights(2);

		await expect(page.locator('.trip-nights')).toHaveText('ليلتان');

		expect(await page.locator('.trip-next').evaluate(function (button) {
			return button.getBoundingClientRect().left < button.parentNode.getBoundingClientRect().left + 100;
		})).toBe(true);

		await page.locator('.trip-photo').focus();
		await page.keyboard.press('ArrowLeft');

		await expect(page.locator('.trip-photo-name')).toHaveText('الإطلالة');

		/* The page remembers the language. */
		await page.reload();

		await expect(page.locator('h1')).toHaveText('على البحر');

		await language('English');

		await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

		await page.locator('.trip-photo').focus();
		await page.keyboard.press('ArrowRight');

		await expect(page.locator('.trip-photo-name')).toHaveText('The view');
	},

	Extension: async function (page) {
		/* On a page of a site the storage of the page stands in for the one of the extension. */
		await expect(page.locator('.reading-count')).toHaveText('0');

		await page.getByRole('button', {name: 'Save this page'}).click();

		await expect(page.locator('.reading-name')).toHaveText(['Reading list']);
		await expect(page.locator('.reading-saved')).toHaveText('Saved: Reading list');

		await page.reload();

		await expect(page.locator('.reading-count')).toHaveText('1');

		await page.getByRole('button', {name: 'Remove'}).click();

		await expect(page.locator('.reading-item')).toHaveCount(0);
	},

	Call: async function (page) {
		var other = await page.context().newPage();
		var join = async function (tab, name) {
			await tab.getByLabel('Your name').fill(name);
			await tab.getByRole('button', {name: 'Join'}).click();
		};

		try {
			/* Alone in the room: the own tile only. */
			await join(page, 'Ada');

			await expect(page.locator('.call-alone')).toBeVisible();
			await expect(page.locator('.elemenx-call-tile.self')).toHaveAttribute('aria-label', 'Ada');

			/* A second one joins: each sees the other, through the signaling and then their own connection. */
			await other.goto(page.url());

			await join(other, 'Grace');

			await expect(page.locator('.elemenx-call-tile:not(.self)')).toHaveAttribute('aria-label', 'Grace');
			await expect(other.locator('.elemenx-call-tile:not(.self)')).toHaveAttribute('aria-label', 'Ada');
			await expect(page.locator('.call-status')).toHaveText('team · 2');

			/* The microphone of Grace goes off: the data channel tells Ada. */
			await other.locator('.elemenx-call-controls button').first().click();

			await expect(page.locator('.elemenx-call-tile[aria-label="Grace"] .elemenx-call-tile-name .elemenx-icon, .elemenx-call-tile[aria-label="Grace"] .elemenx-call-tile-name svg').first()).toBeVisible();

			/* Grace leaves: her tile goes. */
			await other.close();

			await expect(page.locator('.elemenx-call-tile:not(.self)')).toHaveCount(0);
		}
		finally {
			if (!other.isClosed())
				await other.close();
		}
	},

	Kit: async function (page) {
		/* The components of the library live: their phrases, their service, their events. */
		await expect(page.locator('.acme-stat')).toHaveCount(3);
		await expect(page.locator('.acme-stat-delta').first()).toHaveText('+12% vs last month');
		await expect(page.locator('.acme-stat-delta.good')).toHaveCount(2);
		await expect(page.locator('.acme-stat-delta.bad')).toHaveCount(1);
		await expect(page.locator('.acme-price-now').first()).toHaveText('€79.00');
		await expect(page.locator('.acme-price-off')).toHaveText('−20%');
		await expect(page.locator('.acme-copy-button')).toHaveText('Copy');

		await page.getByRole('button', {name: /Revenue/}).click();

		await expect(page.locator('.kit-said')).toHaveText('open: Revenue');

		/* The reference, made of $Meta: the props with their types and defaults, the events. */
		await expect(page.locator('.kit-reference')).toHaveCount(3);
		await expect(page.locator('[data-name="PriceTag"] .kit-props tbody tr')).toHaveCount(4);
		await expect(page.locator('[data-name="PriceTag"] .kit-props tbody tr').nth(1)).toContainText('select: EUR, USD, GBP, RUB');
		await expect(page.locator('[data-name="StatCard"] .kit-events')).toContainText('open');
		await expect(page.locator('[data-name="CopyField"] .kit-events')).toContainText('copy');
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
		var canvas = page.locator('.elemenx-game-scene-marks');
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

/* What the console of a tutorial may say: a refusal of its server that the tutorial shows on purpose. */
var Expected = {
	Signup: /status of 422/,
	Auth: /status of 401/
};

test.describe('Tutorials: every project of examples/Tutorials builds and does what its tutorial says', function () {
	fs.readdirSync(root).filter(function (name) {
		return fs.existsSync(path.join(root, name, 'elemenx.config.js'));
	}).forEach(function (name) {
		test(name, async function ({ page }) {
			var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-tutorial-'));
			var errors = [];
			var server;
			var settings;

			expect(Checks[name], 'the checks of ' + name).toBeTruthy();

			fs.cpSync(path.join(root, name), folder, {recursive: true, filter: function (file) {
				return path.basename(file) !== 'dist' && path.basename(file) !== 'node_modules';
			}});

			/* A project with an entry is built; a page without one (Backend) is served as it is, as elemenx dev does. */
			/* The server answers the paths of the project too (Server.Request of its elemenx.config.js: an API, a stream; its Server.WebSocket). */
			settings = require(path.join(folder, 'elemenx.config.js')).Server || {};

			if (/\n\s*Entry\s*:/.test(fs.readFileSync(path.join(folder, 'elemenx.config.js'), 'utf8'))) {
				childProcess.execFileSync(process.execPath, [cli, 'build', folder], {stdio: 'ignore'});

				server = Server.Create({Root: path.join(folder, 'dist'), Request: settings.Request || null, WebSocket: settings.WebSocket || null});
			}
			else {
				server = Server.Create({Root: folder, Request: settings.Request || null, WebSocket: settings.WebSocket || null});
			}

			await new Promise(function (resolve) {
				server.Listen(0, '127.0.0.1', resolve);
			});

			page.on('pageerror', function (error) {
				errors.push(error.message + ' ' + String(error.stack || '').split('\n').slice(1, 4).join(' | '));
			});
			page.on('console', function (message) {
				if (message.type() === 'error' && !(Expected[name] && Expected[name].test(message.text())))
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

/*
 * The tutorial on extensions, as an extension: built by elemenx build --extension (as a tab here: a popup has no page
 * of its own to open in a test), loaded into Edge, its list kept in chrome.storage. Where Edge is not installed the
 * test is skipped.
 */
test('Tutorials: Extension runs as an extension, its list in chrome.storage', async function () {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-tutorial-'));
	var profile = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-profile-'));
	var errors = [];
	var manifest;
	var context;
	var worker;
	var page;

	fs.cpSync(path.join(root, 'Extension'), folder, {recursive: true, filter: function (file) {
		return path.basename(file) !== 'dist' && path.basename(file) !== 'node_modules';
	}});

	try {
		childProcess.execFileSync(process.execPath, [cli, 'build', folder, '--extension', '--surface', 'tab'], {stdio: 'ignore'});

		manifest = JSON.parse(fs.readFileSync(path.join(folder, 'dist', 'extension', 'chrome', 'manifest.json'), 'utf8'));

		expect([manifest.name, manifest.permissions]).toEqual(['Reading list', ['activeTab', 'storage']]);

		try {
			context = await chromium.launchPersistentContext(profile, {channel: 'msedge', headless: true, args: ['--disable-extensions-except=' + path.join(folder, 'dist', 'extension', 'chrome'), '--load-extension=' + path.join(folder, 'dist', 'extension', 'chrome')]});
		}
		catch (error) {
			test.skip(true, 'Microsoft Edge is not installed: ' + error.message.split('\n')[0]);
		}

		worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
		page = await context.newPage();

		page.on('pageerror', function (error) {
			errors.push(error.message);
		});

		page.on('console', function (message) {
			if (message.type() === 'error')
				errors.push(message.text());
		});

		await page.goto('chrome-extension://' + worker.url().split('/')[2] + '/index.html');
		await page.getByRole('button', {name: 'Save this page'}).click();

		await expect(page.locator('.reading-item')).toHaveCount(1);

		expect(await page.evaluate(function () {
			return new Promise(function (resolve) {
				chrome.storage.sync.get({items: []}, function (value) {
					resolve(value.items.length);
				});
			});
		})).toBe(1);

		expect(errors).toEqual([]);
	}
	finally {
		if (context)
			await context.close();

		fs.rmSync(profile, {recursive: true, force: true});
		fs.rmSync(folder, {recursive: true, force: true});
	}
});

/*
 * The tutorial on calls with a camera and a microphone: the fake devices of Chrome stand in for them, and the video of
 * each one plays in the tile of the other, directly between the two pages.
 */
test('Tutorials: Call sends the video of each one to the other', async function () {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-tutorial-'));
	var settings;
	var server;
	var browser;
	var pages;

	fs.cpSync(path.join(root, 'Call'), folder, {recursive: true, filter: function (file) {
		return path.basename(file) !== 'dist' && path.basename(file) !== 'node_modules';
	}});

	childProcess.execFileSync(process.execPath, [cli, 'build', folder], {stdio: 'ignore'});

	settings = require(path.join(folder, 'elemenx.config.js')).Server;
	server = Server.Create({Root: path.join(folder, 'dist'), WebSocket: settings.WebSocket});

	await new Promise(function (resolve) {
		server.Listen(0, '127.0.0.1', resolve);
	});

	try {
		browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']});
		pages = [await browser.newPage(), await browser.newPage()];

		for (var i = 0; i < pages.length; i++) {
			await pages[i].goto('http://127.0.0.1:' + server.Server.address().port + '/');
			await pages[i].getByLabel('Your name').fill(['Ada', 'Grace'][i]);
			await pages[i].getByRole('button', {name: 'Join'}).click();
		}

		for (var j = 0; j < pages.length; j++) {
			await expect.poll(function () {
				return pages[j].locator('.elemenx-call-tile:not(.self) video').evaluate(function (video) {
					return video.videoWidth > 0 && !video.paused;
				}).catch(function () {
					return false;
				});
			}, {timeout: 20000}).toBe(true);
		}
	}
	finally {
		if (browser)
			await browser.close();

		await new Promise(function (resolve) {
			server.Close(resolve);
		});

		fs.rmSync(folder, {recursive: true, force: true});
	}
});
