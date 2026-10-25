'use strict';

/*
 * The main script of an Elemenx program, copied by elemenx build --native desktop next to elemenx-native.json (the
 * name, the window and the features of the program) and the folder app (the Application).
 *
 * The window loads the Application from app://bundle/, a scheme of its own: the files come from app only. The page
 * has no Node: it asks the main process through the bridge of preload.js, for the features of elemenx-native.json
 * only, and only from app://bundle/. A link out of the Application opens in the browser of the system.
 *
 * The events of the system reach the pages of every window: menu, tray ({ID, Kind}: an item of its menu, or a click,
 * a double click or a right click on its icon), window, shortcut (a global hotkey), link (a link of the scheme of the
 * program, Protocol of elemenx-native.json), task (a task of the jump list of the program, Tasks), thumbar (a button
 * under the thumbnail of the window) and power (sleep, the lock, the battery).
 *
 * The page opens more windows of the same Application (Native.OpenWindow): an empty page of its own origin named
 * elemenx-window-<ID>, which the Application fills; such a window never navigates (a link out of the Application opens in
 * the browser of the system) and opens no window, and all of them close with the first window.
 *
 * The window of the tray (Native.Tray with Window) is one of them too, named elemenx-tray: no frame, off the taskbar,
 * shown by the icon at a click (its menu then waits for the right button) and hidden when it loses the focus.
 *
 * CloseToTray keeps the program in its tray: while it has an icon there, closing the window hides it and a click on
 * the icon shows it again; the program quits by a quit of its menus (Role quit) or Window('quit').
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

/* The window of the tray (Native.Tray with Window): shown by the icon, and when it last hid on losing the focus. */
var trayWindow = null;

/* The items of the menu of the tray (Native.Tray, Native.TrayMenu): they stay when the icon comes again. */
var trayItems = null;
var trayMenuBuilt = null;
var trayHasWindow = false;

/* The window of the menu of the tray (Native.TrayPopup: a menu of ElemenxUI), which the right button opens at the pointer. */
var trayPopup = null;

/* The notifications of the system shown (kept, or they go before they are pressed), and the window of the cards of the Application. */
var notifications = {};
var notificationWindow = null;

/* The windows of the Application by their ID (OpenWindow): their own buttons act on them. */
var named = {};
var trayPopupHidden = 0;
var trayHidden = 0;

/* Whether the program is quitting: a window closed then goes, even when CloseToTray hides it. */
var quitting = false;

/* The tasks of the jump list (Tasks) that started the program or came since the page last asked. */
var tasks = [];

/* The links of the scheme of the program (Protocol) that opened it or came since the page last asked. */
var links = [];

/* One program answers the links of its scheme and the tasks of its jump list: a second start hands them to the first and quits. */
var single = !!settings.Protocol || !!(settings.Tasks && settings.Tasks.length);
var primary = !single || app.requestSingleInstanceLock();

/* The group of features of each call of the bridge. */
var Groups = {
	window: 'window',
	title: 'window',
	titlebar: 'window',
	scheme: 'window',
	open: 'dialogs',
	save: 'dialogs',
	message: 'dialogs',
	menu: 'menu',
	'context-menu': 'menu',
	tray: 'tray',
	traywindow: 'tray',
	traymenu: 'tray',
	traypopup: 'tray',
	role: 'window',
	external: 'external',
	notify: 'notifications',
	notifications: 'notifications',
	badge: 'taskbar',
	progress: 'taskbar',
	attention: 'taskbar',
	thumbar: 'taskbar',
	tasks: 'taskbar',
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

/* The tasks of the jump list among the arguments of a start (--elemenx-task=ID). */
function tasksOf (argv) {
	return (argv || []).filter(function (argument) {
		return String(argument).indexOf('--elemenx-task=') === 0;
	}).map(function (argument) {
		return String(argument).substring('--elemenx-task='.length);
	}).filter(function (id) {
		return (settings.Tasks || []).some(function (task) {
			return task.ID === id;
		});
	});
}

/*
 * The first window of the program, shown and in front (hidden in the tray, or minimized): the window of the page, not
 * one the Application opened (the window of the tray among them), whatever their order.
 */
function surface () {
	var window = electron.BrowserWindow.getAllWindows().filter(function (one) {
		return !!one.ElemenxSend;
	})[0];
	if (!window) return;

	if (window.isMinimized())
		window.restore();

	if (!window.isVisible())
		window.show();

	window.focus();
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

		if (args.Window && named[args.Window] && !named[args.Window].isDestroyed())
			window = named[args.Window];

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

		if (action === 'show')
			surface();

		if (action === 'quit') {
			app.quit();

			return null;
		}

		return state(window);
	},
	/* A notification of the system: its press, its buttons (macOS) and its close go to the page as the notification event. */
	notify: function (args, window, send) {
		var id = String(args.ID);
		var actions = args.Actions || [];
		var notification;

		if (!electron.Notification || (typeof electron.Notification.isSupported === 'function' && !electron.Notification.isSupported()))
			throw new Error('Elemenx Native: this system shows no notifications');

		notification = new electron.Notification({
			title: String(args.Title || ''),
			body: String(args.Text || ''),
			icon: args.Icon ? path.join(root, String(args.Icon)) : (settings.Icon ? path.join(root, settings.Icon) : undefined),
			silent: !!args.Silent,
			urgency: ['low', 'normal', 'critical'].indexOf(args.Urgency) === -1 ? 'normal' : args.Urgency,
			actions: actions.map(function (action) {
				return {type: 'button', text: String(action.Label)};
			})
		});

		notification.on('click', function () {
			send('notification', {ID: id, Kind: 'click', Action: null});
		});

		notification.on('action', function (event, index) {
			send('notification', {ID: id, Kind: 'action', Action: actions[index] ? actions[index].ID : null});
		});

		notification.on('close', function () {
			delete notifications[id];

			send('notification', {ID: id, Kind: 'close', Action: null});
		});

		notifications[id] = notification;

		notification.show();

		return {ID: id};
	},
	/* The window of the cards of the Application (Notify with Look elemenx): its size, by the corner of the screen, or hidden. */
	notifications: function (args) {
		if (!notificationWindow || notificationWindow.isDestroyed())
			throw new Error('Elemenx Native has no window of its notifications: Native.Notify with Look elemenx makes it');

		if (args.Width && args.Height)
			notificationWindow.setContentSize(Math.round(args.Width), Math.round(args.Height));

		if (args.Show === false) {
			notificationWindow.hide();

			return null;
		}

		placeNotifications();

		if (args.Show && !notificationWindow.isVisible())
			notificationWindow.showInactive();

		return null;
	},
	/* The scheme of the parts of the system (dialogs, menus, the buttons of the window): the one of the theme of the page. */
	scheme: function (args) {
		electron.nativeTheme.themeSource = ['light', 'dark'].indexOf(args.Scheme) === -1 ? 'system' : args.Scheme;

		return true;
	},
	/* The buttons of the system over a page with Frame hidden: their colors, as the title bar of the page has them. */
	titlebar: function (args, window) {
		if (typeof window.setTitleBarOverlay !== 'function' || process.platform === 'darwin') return false;

		try {
			window.setTitleBarOverlay({color: args.Color, symbolColor: args.Symbol, height: args.Height ? Math.round(args.Height) : undefined});
		}
		catch (error) {
			return false;
		}

		return true;
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
		})) : bareMenu());

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

		/* Its Items, or the ones of Native.TrayMenu (a NativeMenu of the tray) when it gives none. */
		if (args.Items !== undefined)
			trayItems = args.Items || null;

		trayHasWindow = !!args.Window;

		trayMenu(send);

		tray.on('click', function () {
			if (args.Window) showTray(!(trayWindow && trayWindow.isVisible()) && Date.now() - trayHidden > 250);
			else if (settings.CloseToTray) surface();

			send('tray', {ID: null, Kind: 'click'});
		});

		tray.on('double-click', function () {
			send('tray', {ID: null, Kind: 'double'});
		});

		tray.on('right-click', function () {
			if (trayPopup && !trayPopup.isDestroyed()) showTrayPopup(!trayPopup.isVisible() && Date.now() - trayPopupHidden > 250);
			else if (trayMenuBuilt && trayHasWindow) tray.popUpContextMenu(trayMenuBuilt);

			send('tray', {ID: null, Kind: 'right'});
		});

		return null;
	},
	/* The menu of the icon in the tray in its place: the icon and its window stay. */
	traymenu: function (args, window, send) {
		trayItems = args.Items || null;

		if (tray)
			trayMenu(send);

		return null;
	},
	/* The window of the menu of the tray: its size (it measures its list), or shown at the pointer, or hidden. */
	traypopup: function (args) {
		if (!trayPopup || trayPopup.isDestroyed())
			throw new Error('Elemenx Native has no menu of the tray of its own: Native.TrayPopup makes it');

		if (args.Width && args.Height)
			trayPopup.setContentSize(Math.round(args.Width), Math.round(args.Height));

		if (args.Show !== undefined)
			showTrayPopup(!!args.Show);

		return null;
	},
	/* What the system does for an item of a menu of ElemenxUI with a Role (a NativeMenu drawn by the page). */
	role: function (args, window) {
		var contents = window.webContents;
		var role = String(args.Role || '');
		var edit = ['undo', 'redo', 'cut', 'copy', 'paste', 'pasteAndMatchStyle', 'delete', 'selectAll'];

		if (edit.indexOf(role) !== -1) contents[role]();
		else if (role === 'reload' || role === 'forceReload') contents[role === 'reload' ? 'reload' : 'reloadIgnoringCache']();
		else if (role === 'toggleDevTools') contents.toggleDevTools();
		else if (role === 'resetZoom') contents.setZoomLevel(0);
		else if (role === 'zoomIn' || role === 'zoomOut') contents.setZoomLevel(contents.getZoomLevel() + (role === 'zoomIn' ? 0.5 : -0.5));
		else if (role === 'togglefullscreen') window.setFullScreen(!window.isFullScreen());
		else if (role === 'minimize') window.minimize();
		else if (role === 'close') window.close();
		else if (role === 'quit') app.quit();
		else throw new Error('Elemenx Native does not know the role ' + role);

		return null;
	},
	traywindow: function (args) {
		if (!tray || !trayWindow)
			throw new Error('Elemenx Native has no window of the tray: Native.Tray with Window makes it');

		showTray(args.Show !== false);

		return null;
	},
	external: function (args) {
		if (!external(args.URL))
			throw new Error('Elemenx Native opens only http, https and mailto links: ' + args.URL);

		return electron.shell.openExternal(String(args.URL)).then(function () {
			return null;
		});
	},
	/* The count on the icon of the program: on Windows a small picture over it (Image, drawn by the page), elsewhere the badge of the system. */
	badge: function (args, window) {
		var count = Math.max(0, Number(args.Count) || 0);

		if (process.platform === 'win32') {
			window.setOverlayIcon(count && args.Image ? electron.nativeImage.createFromDataURL(String(args.Image)) : null, count ? String(count) : '');

			return null;
		}

		app.setBadgeCount(count);

		return null;
	},
	/* The progress on the button of the window: a part from 0 to 1, in a state (normal, indeterminate, paused, error); null takes it away. */
	progress: function (args, window) {
		var mode = ['normal', 'indeterminate', 'paused', 'error'].indexOf(args.State) === -1 ? 'normal' : args.State;

		if ((args.Value === null || args.Value === undefined) && mode !== 'indeterminate') {
			window.setProgressBar(-1);

			return null;
		}

		window.setProgressBar(mode === 'indeterminate' ? 2 : Number(args.Value), {mode: mode});

		return null;
	},
	/* The button of the window asks for attention (it flashes, the dock bounces) until the window is in front, or On false. */
	attention: function (args, window) {
		window.flashFrame(!!args.On);

		if (args.On && process.platform === 'darwin' && app.dock)
			app.dock.bounce('informational');

		return null;
	},
	/* The buttons under the thumbnail of the window (Windows, seven at most): a press is the thumbar event {ID}; [] takes them away. */
	thumbar: function (args, window, send) {
		if (process.platform !== 'win32')
			throw new Error('Elemenx Native thumbnail buttons need Windows');

		var buttons = (args.Buttons || []).slice(0, 7).map(function (button) {
			return {
				icon: electron.nativeImage.createFromPath(path.join(root, String(button.Icon || ''))),
				tooltip: String(button.Tooltip || ''),
				/* An enabled button has no flag: with the flag enabled, Electron 45 refuses all of them. */
				flags: button.Disabled ? ['disabled'] : undefined,
				click: function () {
					send('thumbar', {ID: button.ID});
				}
			};
		});

		/* Windows drops the buttons of a window hidden and shown again (in the tray): they come back with it. */
		if (!window.ElemenxThumbar)
			window.on('show', function () {
				window.setThumbarButtons(window.ElemenxThumbar);
			});

		window.ElemenxThumbar = buttons;

		if (window.setThumbarButtons(buttons)) return true;

		/* A window whose button is not on the taskbar yet (at the start of the program) takes them a moment later. */
		return new Promise(function (resolve) {
			var tries = 0;
			var timer = setInterval(function () {
				var done = !window.isDestroyed() && window.ElemenxThumbar === buttons && window.setThumbarButtons(buttons);

				tries++;

				if (done || tries >= 20 || window.isDestroyed() || window.ElemenxThumbar !== buttons) {
					clearInterval(timer);

					resolve(!!done);
				}
			}, 250);
		});
	},
	/* The tasks of the jump list that started the program or came since the last call. */
	tasks: function () {
		if (!(settings.Tasks && settings.Tasks.length))
			throw new Error('Elemenx Native tasks need Native.Desktop.Tasks (the jump list of the program)');

		return tasks.splice(0, tasks.length);
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

/*
 * The menu of the icon in the tray, of its items: set on the icon, or, with a window of the tray, kept for the right
 * button (macOS would open a menu set on the icon at a click, in the place of the window).
 */
function trayMenu (send) {
	trayMenuBuilt = trayItems ? electron.Menu.buildFromTemplate(template(trayItems, function (id) {
		send('tray', {ID: id, Kind: 'menu'});
	})) : null;

	tray.setContextMenu(trayHasWindow || trayPopup ? null : trayMenuBuilt);
}

/* The window of the tray by its icon, within the screen (above the icon on a taskbar at the bottom, below it at the top), or hidden. */
function showTray (show) {
	var icon;
	var size;
	var area;
	var x;
	var y;

	if (!trayWindow || trayWindow.isDestroyed()) return;

	if (!show) {
		trayWindow.hide();

		return;
	}

	icon = tray && tray.getBounds ? tray.getBounds() : null;

	if (!icon || !icon.width) {
		icon = electron.screen.getCursorScreenPoint();
		icon = {x: icon.x, y: icon.y, width: 0, height: 0};
	}

	size = trayWindow.getBounds();
	area = electron.screen.getDisplayMatching(icon).workArea;
	x = Math.round(icon.x + icon.width / 2 - size.width / 2);
	y = icon.y > area.y + area.height / 2 ? icon.y - size.height - 8 : icon.y + icon.height + 8;

	x = Math.max(area.x + 8, Math.min(x, area.x + area.width - size.width - 8));
	y = Math.max(area.y + 8, Math.min(y, area.y + area.height - size.height - 8));

	trayWindow.setPosition(x, y);
	trayWindow.show();
	trayWindow.focus();
}

/* The window of the tray, made hidden by the page: it hides when it loses the focus, and closes with its icon. */
function holdTray (child) {
	trayWindow = child;

	child.on('blur', function () {
		trayHidden = Date.now();

		child.hide();
	});

	child.on('closed', function () {
		if (trayWindow === child)
			trayWindow = null;
	});
}

/* The frame of a window: Frame of the settings (system, hidden, none, transparent; true and false of older builds). */
function frameOf (frame) {
	if (frame === false) return 'none';

	return ['hidden', 'none', 'transparent'].indexOf(frame) === -1 ? 'system' : frame;
}

/* The frame a window of the Application asks for in the features of window.open (elemenx-frame=none), or null. */
function asked (features) {
	var match = /(?:^|,)elemenx-frame=(\w+)/.exec(String(features || ''));

	return match ? match[1] : null;
}

/*
 * The options of a window of a frame: hidden keeps the buttons of the system over the page (Window Controls Overlay: the
 * page reads their place in env(titlebar-area-*); the traffic lights of macOS inside the page), none draws none,
 * transparent is none and see-through. A Material (mica, acrylic, tabbed) is the background of Windows 11, the vibrancy
 * of macOS, under a page that lets it show.
 */
function framed (frame, material) {
	var options = {};

	if (frame === 'hidden') {
		options.titleBarStyle = 'hidden';

		if (process.platform === 'darwin') options.trafficLightPosition = {x: 12, y: 10};
		else options.titleBarOverlay = {color: settings.Background || '#ffffff', symbolColor: '#1f1f1f', height: 32};
	}

	if (frame === 'none' || frame === 'transparent')
		options.frame = false;

	if (frame === 'transparent') {
		options.transparent = true;
		options.backgroundColor = '#00000000';
	}

	if (material && material !== 'none') {
		options.backgroundColor = '#00000000';

		if (process.platform === 'win32')
			options.backgroundMaterial = material;

		if (process.platform === 'darwin')
			options.vibrancy = 'under-window';
	}

	return options;
}

/*
 * The menu of the system when the Application has none: nothing, its bar of menus (if any) a part of its page; on macOS
 * the menu of the application and of editing, which the keys of editing and Quit need there.
 */
function bareMenu () {
	return process.platform === 'darwin' ? electron.Menu.buildFromTemplate([{role: 'appMenu'}, {role: 'editMenu'}]) : null;
}

/* The menu of the tray at the pointer (above it on a taskbar at the bottom), within the screen, or hidden. */
function showTrayPopup (show) {
	var point;
	var size;
	var area;

	if (!trayPopup || trayPopup.isDestroyed()) return;

	if (!show) {
		trayPopup.hide();

		return;
	}

	point = electron.screen.getCursorScreenPoint();
	size = trayPopup.getBounds();
	area = electron.screen.getDisplayNearestPoint(point).workArea;

	trayPopup.setPosition(
		Math.round(Math.max(area.x, Math.min(point.x, area.x + area.width - size.width))),
		Math.round(Math.max(area.y, Math.min(point.y > area.y + area.height / 2 ? point.y - size.height : point.y, area.y + area.height - size.height)))
	);
	trayPopup.show();
	trayPopup.focus();
}

/* A window of the Application by its ID: its state goes to the page as the window event with its ID. */
function holdNamed (child, id, send) {
	named[id] = child;

	['maximize', 'unmaximize', 'minimize', 'restore', 'enter-full-screen', 'leave-full-screen', 'focus', 'blur'].forEach(function (name) {
		child.on(name, function () {
			send('window', Object.assign(state(child), {ID: id}));
		});
	});

	child.on('closed', function () {
		if (named[id] === child)
			delete named[id];
	});
}

/* The window of the cards in the corner of the work area of the screen: the bottom right (the top right on macOS). */
function placeNotifications () {
	var area = electron.screen.getPrimaryDisplay().workArea;
	var bounds = notificationWindow.getBounds();

	notificationWindow.setPosition(Math.round(area.x + area.width - bounds.width), Math.round(process.platform === 'darwin' ? area.y : area.y + area.height - bounds.height));
}

/* The window of the menu of the tray, made hidden by the page: it hides when it loses the focus, as a menu does. */
function holdTrayPopup (child) {
	trayPopup = child;

	child.on('blur', function () {
		trayPopupHidden = Date.now();

		child.hide();
	});

	child.on('closed', function () {
		if (trayPopup === child)
			trayPopup = null;

		if (tray && !tray.isDestroyed())
			tray.setContextMenu(trayHasWindow ? null : trayMenuBuilt);
	});

	if (tray && !tray.isDestroyed())
		tray.setContextMenu(null);
}

/* A window the Application opened: it stays on its empty page, and what it would open goes to the browser of the system. */
function guard (child) {
	child.webContents.setWindowOpenHandler(function (details) {
		if (external(details.url))
			electron.shell.openExternal(details.url);

		return {action: 'deny'};
	});

	child.webContents.on('will-navigate', function (event, target) {
		event.preventDefault();

		if (external(target))
			electron.shell.openExternal(target);
	});
}

function open () {
	var window = new electron.BrowserWindow(Object.assign({
		width: settings.Width || 1200,
		height: settings.Height || 800,
		title: settings.Name,
		backgroundColor: settings.Background || undefined,
		icon: settings.Icon ? path.join(root, settings.Icon) : undefined,
		webPreferences: {contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js'), additionalArguments: ['--elemenx-features=' + features.join(','), '--elemenx-frame=' + frameOf(settings.Frame), '--elemenx-material=' + (settings.Material || 'none')]}
	}, framed(frameOf(settings.Frame), settings.Material)));

	/* The windows its page opened (window.open): they go with the page. */
	var children = [];

	function send (name, value) {
		if (!window.isDestroyed())
			window.webContents.send('elemenx:native-event', name, value);
	}

	['maximize', 'unmaximize', 'minimize', 'restore', 'enter-full-screen', 'leave-full-screen', 'focus', 'blur'].forEach(function (name) {
		window.on(name, function () {
			send('window', state(window));
		});
	});

	/* A window of the Application (an empty page named elemenx-window-<ID>); a link out of it, in the browser of the system. */
	window.webContents.setWindowOpenHandler(function (details) {
		if (details.url === 'about:blank' && /^elemenx-window-[\w-]+$/.test(String(details.frameName)))
			return {action: 'allow', overrideBrowserWindowOptions: Object.assign({title: settings.Name, autoHideMenuBar: true}, framed(frameOf(asked(details.features) || settings.Frame), settings.Material))};

		/* The window of the tray: no frame, not on the taskbar, over the others, shown by the icon. */
		if (details.url === 'about:blank' && details.frameName === 'elemenx-traypopup')
			return {action: 'allow', overrideBrowserWindowOptions: {title: settings.Name, show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false, skipTaskbar: true, alwaysOnTop: true, width: 240, height: 120}};

		/* The window of the cards of the notifications: see-through, over the others, takes no focus, not on the taskbar. */
		if (details.url === 'about:blank' && details.frameName === 'elemenx-notifications')
			return {action: 'allow', overrideBrowserWindowOptions: {title: settings.Name, show: false, frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false, resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false, focusable: false, skipTaskbar: true, alwaysOnTop: true, width: 360, height: 120}};

		if (details.url === 'about:blank' && details.frameName === 'elemenx-tray')
			return {action: 'allow', overrideBrowserWindowOptions: {title: settings.Name, show: false, frame: false, resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false, skipTaskbar: true, alwaysOnTop: true}};

		if (external(details.url))
			electron.shell.openExternal(details.url);

		return {action: 'deny'};
	});

	/*
	 * The page loads again (a reload, another address): the windows it opened (of the tray, of its menu, of the
	 * notifications, of the Application) hold its dead content; they close, and the new page opens its own.
	 */
	window.webContents.on('did-start-navigation', function (details) {
		var main = details && details.isMainFrame !== undefined ? details.isMainFrame : arguments[3];
		var same = details && details.isSameDocument !== undefined ? details.isSameDocument : arguments[2];
		if (!main || same) return;

		children.splice(0).forEach(function (child) {
			if (!child.isDestroyed())
				child.destroy();
		});
	});

	window.webContents.on('did-create-window', function (child, details) {
		guard(child);

		children.push(child);

		if (details && details.frameName === 'elemenx-tray')
			holdTray(child);

		if (details && details.frameName === 'elemenx-traypopup')
			holdTrayPopup(child);

		if (details && details.frameName === 'elemenx-notifications') {
			notificationWindow = child;

			child.on('closed', function () {
				if (notificationWindow === child)
					notificationWindow = null;
			});
		}

		if (details && /^elemenx-window-[\w-]+$/.test(String(details.frameName)))
			holdNamed(child, String(details.frameName).replace('elemenx-window-', ''), send);
	});

	window.webContents.on('will-navigate', function (event, target) {
		if (String(target).indexOf(origin) === 0) return;

		event.preventDefault();

		if (external(target))
			electron.shell.openExternal(target);
	});

	/* CloseToTray: while the program has its icon in the tray, closing the window hides it there. */
	window.on('close', function (event) {
		if (!settings.CloseToTray || !tray || quitting) return;

		event.preventDefault();

		window.hide();
	});

	/* The windows of the Application close with the first one: their page lives in it. */
	window.on('closed', function () {
		electron.BrowserWindow.getAllWindows().forEach(function (other) {
			if (other !== window && !other.isDestroyed())
				other.close();
		});
	});

	window.ElemenxSend = send;

	window.loadURL(origin + 'index.html');

	return window;
}

app.whenReady().then(function () {
	/* No menu of the system (not the one of Electron, File, Edit, View...) until the Application gives one. */
	electron.Menu.setApplicationMenu(bareMenu());

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
}

/*
 * The jump list of the program on Windows (Tasks): each task starts the program with --elemenx-task=ID, a second start
 * that hands it to the first one.
 */
if (primary && settings.Tasks && settings.Tasks.length) {
	tasks = tasksOf(process.argv);

	if (process.platform === 'win32' && typeof app.setUserTasks === 'function')
		app.setUserTasks(settings.Tasks.map(function (task) {
			return {
				program: process.execPath,
				arguments: (process.defaultApp ? '"' + path.resolve(process.argv[1] || '.') + '" ' : '') + '--elemenx-task=' + task.ID,
				title: task.Label,
				description: task.Description || task.Label,
				iconPath: process.execPath,
				iconIndex: 0
			};
		}));
}

/* A second start: its links and tasks go to the pages of the first, which comes to the front. */
if (primary && single) {
	app.on('second-instance', function (event, argv) {
		linksOf(argv).forEach(deliver);

		tasksOf(argv).forEach(function (id) {
			tasks.push(id);

			broadcast('task', {ID: id});
		});

		surface();
	});

	app.on('open-url', function (event, link) {
		event.preventDefault();

		deliver(link);
	});
}

app.on('before-quit', function () {
	quitting = true;
});

app.on('will-quit', function () {
	if (features.indexOf('hotkeys') !== -1)
		electron.globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin')
		app.quit();
});
