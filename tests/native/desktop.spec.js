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

		/* Started by a task of its jump list, as the taskbar of Windows starts it. */
		app = await electron.launch({executablePath: executable(), args: ['--elemenx-task=compose']});
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
			return modules.BrowserWindow.getAllWindows()[0].isMaximized();
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
		expect(await app.evaluate(function (modules) {
			var all = modules.BrowserWindow.getAllWindows();
			var shown = all.filter(function (one) {
				return one.webContents.getURL().indexOf('app://') === 0;
			})[0];
			var panel = all.filter(function (one) {
				return one !== shown;
			})[0];

			global.shown = shown;
			global.panel = panel;

			shown.close();

			return {Windows: all.length, Visible: shown.isVisible(), Panel: panel.isVisible(), Tray: !global.tray.isDestroyed()};
		})).toEqual({Windows: 2, Visible: false, Panel: false, Tray: true});

		/* A click on the icon opens it by the icon; its button brings the program back and hides it. */
		expect(await app.evaluate(function () {
			global.tray.emit('click');

			return {Visible: global.shown.isVisible(), Panel: global.panel.isVisible()};
		})).toEqual({Visible: false, Panel: true});

		await expect(log.locator('li').first()).toContainText('tray: {"ID":null,"Kind":"click"}');

		await app.windows().filter(function (page) {
			return page.url() === 'about:blank';
		})[0].getByRole('button', {name: 'Open the program'}).click();

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
		var opened = app.waitForEvent('window');
		var child;

		await window.getByRole('button', {name: 'Open a window'}).click();

		child = await opened;

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

		await expect(child.locator('.native-note-list li')).toHaveText(['task: Write the docs']);
		await expect(window.locator('.native-notes-count')).toHaveText('Notes: 1');

		/* Closed by the user: its Component goes, the page hears it. */
		await child.close();

		await expect(log.locator('li').first()).toContainText('closed: {"ID":"notes"}');
	});
});
