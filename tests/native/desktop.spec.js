import { _electron as electron, expect, test } from '@playwright/test';
import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/*
 * The desktop program of examples/Native, built by elemenx build --native desktop and run: the Application in its
 * window, from app://bundle/, reaching the system through the bridge of the program (the Native Service of ElemenxUI).
 * The dialogs of the system and the browser are stood in for in the main process, so nothing waits for a hand.
 */
var project = path.resolve('examples/Native');
var program = path.join(project, 'dist', 'native', 'desktop-bin');
var ready = fs.existsSync(path.join(project, 'node_modules', 'electron', 'package.json'));

/* The program made for this system: its executable in the folder the packager wrote. */
function executable () {
	var folder = fs.readdirSync(program).map(function (name) {
		return path.join(program, name);
	}).filter(function (entry) {
		return fs.statSync(entry).isDirectory();
	})[0];
	var names = fs.readdirSync(folder);

	if (process.platform === 'win32')
		return path.join(folder, names.filter(function (name) {
			return /\.exe$/.test(name);
		})[0]);

	if (process.platform === 'darwin')
		return path.join(folder, names[0], 'Contents', 'MacOS', names[0].replace(/\.app$/, ''));

	return path.join(folder, 'elemenx-native');
}

test.describe('Elemenx native: the desktop program', function () {
	/* The window of the program whose page has an element: the windows of the tray and of its menu are about:blank too. */
	async function page (selector) {
		var found = null;

		await expect.poll(async function () {
			var pages = app.windows();
			var i;

			for (i = 0; i < pages.length; i++) {
				if (await pages[i].locator(selector).count()) {
					found = pages[i];

					return true;
				}
			}

			return false;
		}).toBe(true);

		return found;
	}

	test.skip(!ready, 'Electron is not in examples/Native: npx elemenx native add desktop examples/Native');

	var app;
	var window;
	var folder;

	test.beforeAll(async function () {
		var run = childProcess.spawnSync(process.execPath, ['elemenx-cli.js', 'build', project, '--native', 'desktop'], {encoding: 'utf8'});

		expect(run.status, run.stderr || run.stdout).toBe(0);
		expect(run.stdout).toContain('the program is in');

		/* Only the packs it uses, the languages it speaks, and its Targets: a zip, an installer and a portable program. */
		expect(fs.existsSync(path.join(project, 'dist', 'native', 'desktop', 'app', 'libraries', 'ElemenxUI', 'data'))).toBe(false);
		expect(run.stdout).toContain('the program speaks en-US');

		if (process.platform === 'win32') {
			expect(fs.readdirSync(path.join(project, 'dist', 'native', 'desktop-dist')).sort()).toEqual(['Elemenx native-1.0.0-portable.exe', 'Elemenx native-1.0.0-setup.exe', 'elemenx-native-1.0.0-win32-x64.zip']);
		}

		folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-native-'));

		fs.writeFileSync(path.join(folder, 'note.txt'), 'A note.');

		/*
		 * Started by a task of its jump list, as the taskbar of Windows starts it; in English, whatever the language of the
		 * system, and with data of its own (no language or theme a user chose in the program).
		 */
		app = await electron.launch({executablePath: executable(), args: ['--elemenx-task=compose', '--lang=en-US', '--user-data-dir=' + path.join(folder, 'data')]});
		window = await app.firstWindow();

		/* The dialogs and the browser of the system, stood in for: what they were asked is kept in the main process. */
		await app.evaluate(function (modules, files) {
			global.asked = [];
			global.taskbar = [];

			/* The taskbar and the tray, recorded as the main script asks them; the tray stays a real one. */
			var progress = modules.BrowserWindow.prototype.setProgressBar;
			var flash = modules.BrowserWindow.prototype.flashFrame;
			var tip = modules.Tray.prototype.setToolTip;

			modules.BrowserWindow.prototype.setProgressBar = function (value, options) {
				global.taskbar.push(['progress', value, options ? options.mode : null]);

				return progress.apply(this, arguments);
			};

			modules.BrowserWindow.prototype.flashFrame = function (on) {
				global.taskbar.push(['flash', on]);

				return flash.apply(this, arguments);
			};

			/* The tray made by the main script, taken as it gets its tooltip (the module of Electron cannot be changed). */
			modules.Tray.prototype.setToolTip = function () {
				global.tray = this;

				return tip.apply(this, arguments);
			};


			modules.dialog.showMessageBox = function (owner, options) {
				global.asked.push({Message: options.message, Buttons: options.buttons});

				return Promise.resolve({response: 1});
			};

			modules.dialog.showOpenDialog = function () {
				return Promise.resolve({canceled: false, filePaths: [files.Note]});
			};

			modules.dialog.showSaveDialog = function () {
				return Promise.resolve({canceled: false, filePath: files.Saved});
			};

			modules.shell.openExternal = function (url) {
				global.asked.push({External: url});

				return Promise.resolve();
			};
		}, {Note: path.join(folder, 'note.txt'), Saved: path.join(folder, 'saved.txt')});
	});

	/* The program closed, and its main process ended for sure: a program left running holds the files of the next build. */
	test.afterAll(async function () {
		var main = app ? app.process() : null;

		if (app)
			await app.close();

		if (main && main.exitCode === null && !main.killed)
			main.kill();

		if (folder)
			fs.rmSync(folder, {recursive: true, force: true});
	});

	test('opens the Application in its window, from its own scheme, with the features of the system', async function () {
		expect(await window.title()).toBe('Elemenx native');
		expect(window.url()).toBe('app://bundle/index.html');

		await expect(window.locator('.native-platform')).toHaveText('electron');
		await expect(window.locator('.native-features .elemenx-chip')).toContainText(['window', 'dialogs', 'external']);

		/* The page has no Node: only the bridge of the program. */
		expect(await window.evaluate(function () {
			return {Require: typeof require, Process: typeof process, Bridge: typeof window.ElemenxNative};
		})).toEqual({Require: 'undefined', Process: 'undefined', Bridge: 'object'});
	});

	test('has its menu, the buttons under its thumbnail and its icon in the tray from the start, their commands told to the page', async function () {
		var log = window.locator('.native-log');

		/* The menu of the window, a NativeMenu of the template drawn by ElemenxUI: a bar of menus, the system with none. */
		expect(await app.evaluate(function (modules) {
			return modules.Menu.getApplicationMenu();
		})).toBe(null);

		await expect(window.locator('.elemenx-native-menu-bar > .elemenx-menu-host > .elemenx-button, .elemenx-native-menu-bar .elemenx-button').filter({visible: true})).toHaveText(['File', 'Edit', 'View', 'Window', 'Help']);

		await expect(log).toContainText('Tray: null');

		if (process.platform === 'win32')
			await expect(log).toContainText('Thumbar: true');

		/* A command of the menu: a new note, which the page counts; an item of a role, with its usual shortcut. */
		await window.locator('.elemenx-native-menu-bar .elemenx-button').filter({hasText: 'Edit'}).click();

		await expect(window.getByRole('menuitem', {name: /Copy/})).toContainText('Ctrl+C');

		await window.keyboard.press('Escape');
		await window.locator('.elemenx-native-menu-bar .elemenx-button').filter({hasText: 'File'}).click();
		await window.getByRole('menuitem', {name: /New note/}).click();

		await expect(window.locator('.native-notes-count')).toHaveText('Notes: 1');
		await expect(log.locator('li').first()).toContainText('menu: note');

		/* The menu of the tray drawn by ElemenxUI: its window at the pointer at the right button, Show there brings the window back. */
		await window.getByRole('button', {name: 'Tray'}).click();

		await expect(log.locator('li').first()).toContainText('Tray: null');

		await app.evaluate(function () {
			global.tray.emit('right-click');
		});

		await expect.poll(function () {
			return app.windows().filter(function (page) {
				return page.url() === 'about:blank';
			}).length;
		}).toBe(2);

		var popup = null;

		for (var page of app.windows()) {
			if (page.url() === 'about:blank' && await page.locator('.elemenx-native-menu-panel').count())
				popup = page;
		}

		await expect(popup.locator('.elemenx-native-menu-panel .elemenx-option-label')).toHaveText(['Show', 'New note', 'Quit']);

		expect(await app.evaluate(function (modules) {
			return modules.BrowserWindow.getAllWindows().filter(function (one) {
				return one.isVisible() && !one.ElemenxSend;
			}).length;
		})).toBe(1);

		await popup.locator('.elemenx-native-menu-panel .elemenx-option').filter({hasText: 'Show'}).click();

		await expect(log.locator('li').first()).toContainText('menu: show');
		await expect.poll(function () {
			return app.evaluate(function (modules) {
				return modules.BrowserWindow.getAllWindows().filter(function (one) {
					return one.isVisible() && !one.ElemenxSend;
				}).length;
			});
		}).toBe(0);

		/* A thumbnail button pressed, as the taskbar tells the main script. */
		await app.evaluate(function (modules) {
			modules.BrowserWindow.getAllWindows().filter(function (one) {
				return !!one.ElemenxSend;
			})[0].ElemenxSend('thumbar', {ID: 'note'});
		});

		await expect(window.locator('.native-notes-count')).toHaveText('Notes: 2');
		await expect(log.locator('li').first()).toContainText('thumbar: {"ID":"note"}');
	});

	test('asks the system: a message, a file opened and one saved, a link in the browser, the window', async function () {
		var log = window.locator('.native-log li');
		var asked;

		await window.getByRole('button', {name: 'Message'}).click();

		await expect(log.first()).toContainText('Message: 1');

		await window.getByRole('button', {name: 'Open a file'}).click();

		await expect(log.first()).toContainText('Open: note.txt (7 bytes)');

		await window.getByRole('button', {name: 'Save a file'}).click();

		await expect(log.first()).toContainText('Save: {"Path":');

		expect(fs.readFileSync(path.join(folder, 'saved.txt'), 'utf8')).toMatch(/^Saved by Elemenx at /);

		await window.getByRole('button', {name: 'Open example.com'}).click();

		await expect(log.first()).toContainText('External: null');

		asked = await app.evaluate(function () {
			return global.asked;
		});

		expect(asked).toEqual([{Message: 'A message of the system.', Buttons: ['OK', 'Cancel']}, {External: 'https://example.com/'}]);

		await window.getByRole('button', {name: 'Maximize'}).click();

		await expect(log.first()).toContainText('"Maximized":true');

		expect(await app.evaluate(function (modules) {
			/* The window of the page: the window of the tray is one of the windows of the program too. */
			return modules.BrowserWindow.getAllWindows().filter(function (one) {
				return !!one.ElemenxSend;
			})[0].isMaximized();
		})).toBe(true);
	});

	test('heard the task of its jump list, shows a progress and asks for attention on the taskbar, and hides in its tray', async function () {
		var log = window.locator('.native-log');

		await expect(log).toContainText('Tasks: ["compose"]');

		await window.getByRole('button', {name: 'Progress'}).click();
		await window.getByRole('button', {name: 'Progress'}).click();
		await window.getByRole('button', {name: 'Progress'}).click();
		await window.getByRole('button', {name: 'Progress'}).click();
		await window.getByRole('button', {name: 'Progress'}).click();
		await window.getByRole('button', {name: 'Attention'}).click();

		await expect(log.locator('li').first()).toContainText('Attention: null');

		expect(await app.evaluate(function () {
			return global.taskbar;
		})).toEqual([['progress', 0.25, 'normal'], ['progress', 0.5, 'paused'], ['progress', 0.75, 'error'], ['progress', 2, 'indeterminate'], ['progress', -1, null], ['flash', true]]);

		/* The tray: closing the window hides it there, a click on the icon brings it back, its menu is told to the page. */
		await window.getByRole('button', {name: 'Tray'}).click();

		await expect(log.locator('li').first()).toContainText('Tray: null');

		/* The window of the tray, made hidden by the page, off the taskbar. */
		expect(await app.evaluate(async function (modules) {
			var all = modules.BrowserWindow.getAllWindows();
			var shown = all.filter(function (one) {
				return one.webContents.getURL().indexOf('app://') === 0;
			})[0];
			var panel = null;
			var i;

			/* The window of the tray among the windows of the Application (the menu of the tray is one too): the one of its panel. */
			for (i = 0; i < all.length; i++) {
				if (all[i] !== shown && await all[i].webContents.executeJavaScript('!!document.querySelector(".native-tray")'))
					panel = all[i];
			}

			global.shown = shown;
			global.panel = panel;

			shown.close();

			return {Windows: all.length, Visible: shown.isVisible(), Panel: panel.isVisible(), Tray: !global.tray.isDestroyed()};
		})).toEqual({Windows: 3, Visible: false, Panel: false, Tray: true});

		/* A click on the icon opens it by the icon; its button brings the program back and hides it. */
		expect(await app.evaluate(function () {
			global.tray.emit('click');

			return {Visible: global.shown.isVisible(), Panel: global.panel.isVisible()};
		})).toEqual({Visible: false, Panel: true});

		await expect(log.locator('li').first()).toContainText('tray: {"ID":null,"Kind":"click"}');

		/* The window of the tray among the windows of the program: the one with its panel (the menu of the tray is one too). */
		await (await page('.native-tray')).getByRole('button', {name: 'Open the program'}).click();

		await expect.poll(function () {
			return app.evaluate(function () {
				return {Visible: global.shown.isVisible(), Panel: global.panel.isVisible()};
			});
		}).toEqual({Visible: true, Panel: false});

		await app.evaluate(function () {
			global.tray.emit('double-click');
		});

		await expect(log.locator('li').first()).toContainText('tray: {"ID":null,"Kind":"double"}');
	});

	test('opens one more window of the same Application: its state, its lists, its tips and its own document, closed with its event', async function () {
		var log = window.locator('.native-log');
		var child;
		var maximized;
		var before;

		await window.getByRole('button', {name: 'Open a window'}).click();

		child = await page('.native-notes');

		await expect(log.locator('li').first()).toContainText('OpenWindow: notes');
		await expect(child.locator('.native-notes h2')).toHaveText('Notes');

		expect(await child.title()).toBe('Notes');

		/* The styles of the page came along: the body of the window is themed as the page. */
		expect(await child.evaluate(function () {
			return getComputedStyle(document.body).backgroundColor === getComputedStyle(window.opener.document.body).backgroundColor && document.styleSheets.length > 0;
		})).toBe(true);

		/* A list of the window opens in the window, under its field, and is chosen there. */
		await child.locator('.native-note-kind .elemenx-select-trigger').click();

		await expect(child.getByRole('option', {name: 'Task'})).toBeVisible();

		await child.getByRole('option', {name: 'Task'}).click();
		await child.locator('.native-note-form input').fill('Write the docs');

		/* A tip of the window shows in the window. */
		await child.locator('.native-note-add').hover();

		await expect(child.locator('#elemenx-tip')).toBeVisible();
		await expect(child.locator('#elemenx-tip')).toContainText('Adds the note');
		await expect(window.locator('#elemenx-tip')).toBeHidden();

		/* One Application: the note added there is in the state the main window shows. */
		await child.locator('.native-note-add').click();

		/* After the two notes the menu and the thumbnail button added (see above). */
		await expect(child.locator('.native-note-list li')).toHaveText(['idea: A note #1', 'idea: A note #2', 'task: Write the docs']);
		await expect(window.locator('.native-notes-count')).toHaveText('Notes: 3');

		/* No frame of the system (Frame none): its TitleBar draws the buttons, and they act on it, not on the main window. */
		await expect(child.locator('.elemenx-title-bar-control')).toHaveCount(3);

		maximized = function () {
			return app.evaluate(function (modules) {
				return modules.BrowserWindow.getAllWindows().filter(function (item) {
					return item.isVisible() && item.isMaximized();
				}).map(function (item) {
					return item.getTitle();
				}).sort();
			});
		};

		before = await maximized();

		await child.locator('.elemenx-title-bar-control').nth(1).click();

		await expect.poll(maximized).toEqual(before.concat(['Notes']).sort());

		await child.locator('.elemenx-title-bar-control').nth(1).click();

		/* Its close button closes it: its Component goes, the page hears it. */
		await child.locator('.elemenx-title-bar-control.close').click();

		await expect(log.locator('li').first()).toContainText('closed: {"ID":"notes"}');

		/* The main window has its title bar under the buttons of the system (Frame hidden). */
		await expect(window.locator('.elemenx-title-bar.overlay')).toHaveCount(1);
		await expect(window.locator('.elemenx-title-bar .elemenx-menu-bar .elemenx-button')).toHaveText(['File', 'Edit', 'View', 'Window', 'Help']);
	});

	test('shows a card of ElemenxUI by the corner of the screen, in a window that takes no focus, its button told to the page', async function () {
		var log = window.locator('.native-log');
		var cards;
		var state;

		await window.getByRole('button', {name: 'Notify in ElemenxUI'}).click();

		cards = await page('.elemenx-notification-host');

		await expect(cards.locator('.elemenx-notification-title')).toHaveText('Elemenx native');

		/* Over the others, not focused, in the corner of the work area, as large as its card. */
		await expect.poll(function () {
			return app.evaluate(function (modules) {
				var found = modules.BrowserWindow.getAllWindows().filter(function (item) {
					return item.isVisible() && !item.isFocusable();
				})[0];
				var area = modules.screen.getPrimaryDisplay().workArea;
				var bounds = found ? found.getBounds() : null;

				return bounds ? {Top: found.isAlwaysOnTop(), Focused: found.isFocused(), Right: bounds.x + bounds.width === area.x + area.width, Bottom: process.platform === 'darwin' || bounds.y + bounds.height === area.y + area.height, Small: bounds.height < 260} : null;
			});
		}).toEqual({Top: true, Focused: false, Right: true, Bottom: true, Small: true});

		/* Its button: the action event in the page; the last card gone, the window hides. */
		await cards.locator('.elemenx-notification-actions button').filter({hasText: 'Later'}).click();

		await expect(log.locator('li').first()).toContainText('notification: {"ID":"card","Kind":"action","Action":"later"}');

		state = await app.evaluate(function (modules) {
			return modules.BrowserWindow.getAllWindows().filter(function (item) {
				return !item.isFocusable();
			}).map(function (item) {
				return item.isVisible();
			});
		});

		expect(state).toEqual([false]);
	});
	test('after a reload of its page its windows of the tray hold the new page only: one content, a menu that answers, cards of their size', async function () {
		var log = window.locator('.native-log');
		var popup;
		var tray;
		var cards;

		await window.reload();

		await expect(window.locator('.elemenx-title-bar .elemenx-menu-bar .elemenx-button')).toHaveText(['File', 'Edit', 'View', 'Window', 'Help']);

		/* The windows of the page before went with it: the new page has its own, with one content each. */
		tray = await page('.native-tray');

		await expect(tray.locator('body > *')).toHaveCount(1);

		await app.evaluate(function () {
			global.tray.emit('right-click');
		});

		popup = await page('.elemenx-native-menu-panel');

		await expect(popup.locator('.elemenx-native-menu-panel')).toHaveCount(1);

		/* Its items light under the pointer and are chosen. */
		await popup.locator('.elemenx-option').filter({hasText: 'New note'}).hover();

		await expect(popup.locator('.elemenx-option.active')).toHaveText(/New note/);

		await popup.locator('.elemenx-option').filter({hasText: 'New note'}).click();

		await expect(log.locator('li').first()).toContainText('menu: note');

		/* A card: its window as wide as the card, every time. */
		for (var i = 0; i < 2; i++) {
			await window.getByRole('button', {name: 'Notify in ElemenxUI'}).click();

			cards = await page('.elemenx-notification');

			await expect(cards.locator('.elemenx-notification')).toHaveCount(1);

			await expect.poll(function () {
				return app.evaluate(function (modules) {
					var found = modules.BrowserWindow.getAllWindows().filter(function (item) {
						return !item.isFocusable() && item.isVisible();
					})[0];

					return found ? found.getBounds().width >= 340 && found.getBounds().height >= 80 : false;
				});
			}).toBe(true);

			await cards.locator('.elemenx-notification-close').click();

			await expect(log.locator('li').first()).toContainText('"Kind":"close"');
		}
	});
});
