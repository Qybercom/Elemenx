'use strict';

/*
 * The main script of an Elemenx program, copied by elemenx build --native desktop next to elemenx-native.json (the
 * name, the window and the features of the program) and the folder app (the Application).
 *
 * The window loads the Application from app://bundle/, a scheme of its own: the files come from app only. The page
 * has no Node: it asks the main process through the bridge of preload.js, for the features of elemenx-native.json
 * only, and only from app://bundle/. A link out of the Application opens in the browser of the system.
 *
 * The events of the system reach the pages of every window: menu, tray, window, shortcut (a global hotkey), link (a
 * link of the scheme of the program, Protocol of elemenx-native.json) and power (sleep, the lock, the battery).
 */

var electron = require('electron');
var fs = require('fs');
var path = require('path');
var url = require('url');

var app = electron.app;
var root = path.join(__dirname, 'app');
var settings = require('./elemenx-native.json');
var features = settings.Features || [];
var origin = 'app://bundle/';
var tray = null;
var awake = null;

/* The links of the scheme of the program (Protocol) that opened it or came since the page last asked. */
var links = [];

/* One program answers the links of its scheme: a second start hands its link to the first and quits. */
var primary = !settings.Protocol || app.requestSingleInstanceLock();

/* The group of features of each call of the bridge. */
var Groups = {
	window: 'window',
	title: 'window',
	open: 'dialogs',
	save: 'dialogs',
	message: 'dialogs',
	menu: 'menu',
	'context-menu': 'menu',
	tray: 'tray',
	external: 'external',
	badge: 'taskbar',
	progress: 'taskbar',
	shortcuts: 'hotkeys',
	autostart: 'autostart',
	links: 'links',
	power: 'power',
	awake: 'power',
	update: 'update'
};

/* The events of the power of the system that the page hears. */
var PowerEvents = ['suspend', 'resume', 'lock-screen', 'unlock-screen', 'on-ac', 'on-battery', 'shutdown'];

electron.protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: {standard: true, secure: true, supportFetchAPI: true, corsEnabled: true}}]);

/* A URL out of the Application that the browser of the system may open. */
function external (target) {
	return /^(https?|mailto):/i.test(String(target));
}

/* An event for the pages of every window. */
function broadcast (name, value) {
	electron.BrowserWindow.getAllWindows().forEach(function (window) {
		if (window.ElemenxSend)
			window.ElemenxSend(name, value);
	});
}

/* The links of the scheme of the program among the arguments of a start. */
function linksOf (argv) {
	return (argv || []).filter(function (argument) {
		return !!settings.Protocol && String(argument).toLowerCase().indexOf(settings.Protocol + ':') === 0;
	});
}

/* A link that came: kept for Links, and told to the pages. */
function deliver (link) {
	links.push(String(link));

	broadcast('link', {URL: String(link)});
}

/* Whether version a (1.2.10) is newer than b (1.2.9). */
function newer (a, b) {
	var left = String(a).split(/[.+-]/);
	var right = String(b).split(/[.+-]/);
	var i = 0;

	while (i < 3) {
		if ((Number(left[i]) || 0) !== (Number(right[i]) || 0))
			return (Number(left[i]) || 0) > (Number(right[i]) || 0);

		i++;
	}

	return false;
}

/* The state of a window, for the page. */
function state (window) {
	return {Maximized: window.isMaximized(), Minimized: window.isMinimized(), Fullscreen: window.isFullScreen(), Focused: window.isFocused()};
}

/* The items of a menu of the page as a template of Electron: a click sends the id of its item to the page. */
function template (items, choose) {
	return (items || []).map(function (item) {
		if (item.Separator)
			return {type: 'separator'};

		return {
			label: item.Label,
			id: item.ID,
			accelerator: item.Hotkey || undefined,
			enabled: !item.Disabled,
			type: item.Checked === undefined ? 'normal' : 'checkbox',
			checked: !!item.Checked,
			role: item.Role || undefined,
			submenu: item.Items ? template(item.Items, choose) : undefined,
			click: item.Items || item.Role ? undefined : function () {
				choose(item.ID);
			}
		};
	});
}

/* A file the page asked to read: its name, path, size, and its text or data (base64) as asked. */
function readFile (file, read) {
	var data = fs.readFileSync(file);
	var result = {Name: path.basename(file), Path: file, Size: data.length};

	if (read === 'text')
		result.Text = data.toString('utf8');

	if (read === 'data')
		result.Data = data.toString('base64');

	return result;
}

/* The filters of a dialog from Accept (['.txt', '.md']). */
function filters (accept) {
	var extensions = (accept || []).map(function (item) {
		return String(item).replace(/^\./, '');
	}).filter(function (item) {
		return item && item.indexOf('/') === -1;
	});

	return extensions.length ? [{name: extensions.join(', '), extensions: extensions}] : [];
}

/* The calls of the bridge: (args, window, send) to a value for the page. */
var handlers = {
	window: function (args, window) {
		var action = args.Action;
		if (action === 'minimize')
			window.minimize();

		if (action === 'maximize')
			window.maximize();

		if (action === 'restore')
			window.restore();

		if (action === 'toggle-maximize')
			window[window.isMaximized() ? 'unmaximize' : 'maximize']();

		if (action === 'fullscreen')
			window.setFullScreen(!window.isFullScreen());

		if (action === 'focus')
			window.focus();

		if (action === 'close')
			window.close();

		return state(window);
	},
	title: function (args, window) {
		window.setTitle(String(args.Text || ''));

		return null;
	},
	open: function (args, window) {
		var properties = ['openFile'];

		if (args.Multiple)
			properties.push('multiSelections');

		return electron.dialog.showOpenDialog(window, {properties: properties, filters: filters(args.Accept), title: args.Title}).then(function (result) {
			return result.canceled ? [] : result.filePaths.map(function (file) {
				return readFile(file, args.Read || 'text');
			});
		});
	},
	save: function (args, window) {
		return electron.dialog.showSaveDialog(window, {defaultPath: args.Name, filters: filters(args.Accept), title: args.Title}).then(function (result) {
			if (result.canceled || !result.filePath) return null;

			fs.writeFileSync(result.filePath, args.Data !== undefined ? Buffer.from(String(args.Data), 'base64') : String(args.Text || ''));

			return {Path: result.filePath};
		});
	},
	message: function (args, window) {
		return electron.dialog.showMessageBox(window, {type: args.Kind || 'info', title: args.Title, message: String(args.Text || ''), buttons: args.Buttons || ['OK']}).then(function (result) {
			return result.response;
		});
	},
	menu: function (args, window, send) {
		electron.Menu.setApplicationMenu(args.Items ? electron.Menu.buildFromTemplate(template(args.Items, function (id) {
			send('menu', {ID: id});
		})) : null);

		return null;
	},
	'context-menu': function (args, window) {
		return new Promise(function (resolve) {
			var chosen = null;

			electron.Menu.buildFromTemplate(template(args.Items, function (id) {
				chosen = id;
			})).popup({window: window, callback: function () {
				resolve(chosen);
			}});
		});
	},
	tray: function (args, window, send) {
		if (tray) {
			tray.destroy();
			tray = null;
		}

		if (!args.Icon) return null;

		tray = new electron.Tray(electron.nativeImage.createFromPath(path.join(root, String(args.Icon))));

		if (args.Tooltip)
			tray.setToolTip(String(args.Tooltip));

		if (args.Items) {
			tray.setContextMenu(electron.Menu.buildFromTemplate(template(args.Items, function (id) {
				send('tray', {ID: id});
			})));
		}

		tray.on('click', function () {
			send('tray', {ID: null});
		});

		return null;
	},
	external: function (args) {
		if (!external(args.URL))
			throw new Error('Elemenx Native opens only http, https and mailto links: ' + args.URL);

		return electron.shell.openExternal(String(args.URL)).then(function () {
			return null;
		});
	},
	badge: function (args) {
		app.setBadgeCount(Math.max(0, Number(args.Count) || 0));

		return null;
	},
	progress: function (args, window) {
		window.setProgressBar(args.Value === null || args.Value === undefined ? -1 : Number(args.Value));

		return null;
	},
	shortcuts: function (args) {
		electron.globalShortcut.unregisterAll();

		return (args.Keys || []).filter(function (keys) {
			try {
				return electron.globalShortcut.register(String(keys), function () {
					broadcast('shortcut', {Keys: String(keys)});
				});
			}
			catch (error) {
				return false;
			}
		});
	},
	autostart: function (args) {
		if (process.platform === 'linux')
			throw new Error('Elemenx Native autostart needs Windows or macOS');

		if (typeof args.Enabled === 'boolean')
			app.setLoginItemSettings({openAtLogin: args.Enabled});

		return {Enabled: !!app.getLoginItemSettings().openAtLogin};
	},
	links: function () {
		if (!settings.Protocol)
			throw new Error('Elemenx Native links need Native.Desktop.Protocol (the scheme of the program)');

		return links.splice(0, links.length);
	},
	power: function () {
		return {OnBattery: electron.powerMonitor.isOnBatteryPower(), Idle: electron.powerMonitor.getSystemIdleTime(), State: electron.powerMonitor.getSystemIdleState(60)};
	},
	awake: function (args) {
		if (args.On && awake === null)
			awake = electron.powerSaveBlocker.start('prevent-display-sleep');

		if (!args.On && awake !== null) {
			electron.powerSaveBlocker.stop(awake);

			awake = null;
		}

		return {Awake: awake !== null};
	},
	update: function () {
		var current = app.getVersion();

		if (!settings.Update)
			throw new Error('Elemenx Native update needs Native.Desktop.Update (the URL of the feed of the versions)');

		return electron.net.fetch(settings.Update, {cache: 'no-store'}).then(function (response) {
			if (!response.ok)
				throw new Error('Elemenx Native update: the feed answered ' + response.status);

			return response.json();
		}).then(function (feed) {
			var latest = String(feed && feed.Version || '');

			return {Current: current, Latest: latest, Available: !!latest && newer(latest, current), URL: /^https:\/\//i.test(String(feed.URL || '')) ? String(feed.URL) : null, Notes: String(feed.Notes || '')};
		});
	}
};

function open () {
	var window = new electron.BrowserWindow({
		width: settings.Width || 1200,
		height: settings.Height || 800,
		title: settings.Name,
		frame: settings.Frame !== false,
		webPreferences: {contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js'), additionalArguments: ['--elemenx-features=' + features.join(',')]}
	});

	function send (name, value) {
		if (!window.isDestroyed())
			window.webContents.send('elemenx:native-event', name, value);
	}

	['maximize', 'unmaximize', 'minimize', 'restore', 'enter-full-screen', 'leave-full-screen', 'focus', 'blur'].forEach(function (name) {
		window.on(name, function () {
			send('window', state(window));
		});
	});

	window.webContents.setWindowOpenHandler(function (details) {
		if (external(details.url))
			electron.shell.openExternal(details.url);

		return {action: 'deny'};
	});

	window.webContents.on('will-navigate', function (event, target) {
		if (String(target).indexOf(origin) === 0) return;

		event.preventDefault();

		if (external(target))
			electron.shell.openExternal(target);
	});

	window.ElemenxSend = send;

	window.loadURL(origin + 'index.html');

	return window;
}

app.whenReady().then(function () {
	electron.protocol.handle('app', function (request) {
		var file = path.join(root, decodeURIComponent(new URL(request.url).pathname));
		if (file !== root && file.indexOf(root + path.sep) !== 0) return new Response('', {status: 403});

		return electron.net.fetch(url.pathToFileURL(file).toString());
	});

	electron.ipcMain.handle('elemenx:native', function (event, name, args) {
		var window = electron.BrowserWindow.fromWebContents(event.sender);

		if (!event.senderFrame || String(event.senderFrame.url).indexOf(origin) !== 0)
			throw new Error('Elemenx Native answers the Application only');

		if (!Object.prototype.hasOwnProperty.call(handlers, name) || features.indexOf(Groups[name]) === -1)
			throw new Error('Elemenx Native feature is off: ' + name + ' (Native.Desktop.Features of elemenx.config.js)');

		return handlers[name](args || {}, window, window.ElemenxSend);
	});

	if (!primary) return;

	if (features.indexOf('power') !== -1) {
		PowerEvents.forEach(function (name) {
			electron.powerMonitor.on(name, function () {
				broadcast('power', {State: name});
			});
		});
	}

	open();

	app.on('activate', function () {
		if (electron.BrowserWindow.getAllWindows().length === 0)
			open();
	});
});

if (!primary)
	app.quit();

/* The links of the scheme: the program answers them (registered for the system), from its start or a second one. */
if (primary && settings.Protocol) {
	if (process.defaultApp) app.setAsDefaultProtocolClient(settings.Protocol, process.execPath, [path.resolve(process.argv[1] || '.')]);
	else app.setAsDefaultProtocolClient(settings.Protocol);

	links = linksOf(process.argv);

	app.on('second-instance', function (event, argv) {
		var window = electron.BrowserWindow.getAllWindows()[0];

		linksOf(argv).forEach(deliver);

		if (window) {
			if (window.isMinimized())
				window.restore();

			window.focus();
		}
	});

	app.on('open-url', function (event, link) {
		event.preventDefault();

		deliver(link);
	});
}

app.on('will-quit', function () {
	if (features.indexOf('hotkeys') !== -1)
		electron.globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin')
		app.quit();
});
