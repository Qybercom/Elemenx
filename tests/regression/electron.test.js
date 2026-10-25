import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import url from 'url';
import { createRequire } from 'module';
import Builder from '../../tools/builder.js';

var require = createRequire(import.meta.url);
var project = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var output = path.resolve(process.cwd(), 'tests', 'dist', 'electron-output');
var modules = path.join(project, 'node_modules');

function write (file, text) {
	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, text);
}

/* Builds with the output of the builder captured. */
function build (options) {
	var written = '';
	var original = process.stdout.write;

	process.stdout.write = function (text) {
		written += text;

		return true;
	};

	try {
		Builder.Build(project, Object.assign({native: 'desktop', out: '../electron-output'}, options || {}));
	}
	finally {
		process.stdout.write = original;
	}

	return written;
}

/* A fake of the electron module for the main script: it records what the script asks and lets the test call back. */
function fakeElectron () {
	var fake = {Schemes: null, Protocols: {}, Handlers: {}, Windows: [], Fetched: [], Dialogs: [], Menus: [], External: [], Opened: [], AppEvents: {}, Power: {}, Shortcuts: {}, Login: false, Lock: true, Clients: [], Feed: null, Blockers: [], Trays: [], Tasks: null, Bounced: []};

	function Window (options) {
		var self = this;
		var listeners = {};
		var maximized = false;

		this.Options = options;
		this.Sent = [];
		this.webContents = {
			send: function () {
				self.Sent.push(Array.prototype.slice.call(arguments));
			},
			setWindowOpenHandler: function (handler) {
				self.OpenHandler = handler;
			},
			on: function (name, callback) {
				listeners[name] = callback;
			}
		};
		this.Contents = listeners;
		this.Bounds = {x: 0, y: 0, width: (options && options.width) || 800, height: (options && options.height) || 600};
		this.getBounds = function () {
			return self.Bounds;
		};
		this.setPosition = function (x, y) {
			self.Bounds = Object.assign({}, self.Bounds, {x: x, y: y});
		};
		this.Navigate = function (target, events) {
			listeners['will-navigate']({preventDefault: function () {
				events.push('prevented');
			}}, target);
		};
		this.loadURL = function (url) {
			self.Loaded = url;
		};
		this.Events = {};
		this.Visible = true;
		this.Taskbar = [];
		this.on = function (name, callback) {
			self.Events[name] = callback;
		};
		this.setProgressBar = function (value, options) {
			self.Taskbar.push(['progress', value, options ? options.mode : undefined]);
		};
		this.setOverlayIcon = function (image, text) {
			self.Taskbar.push(['overlay', image ? image.From : null, text]);
		};
		this.flashFrame = function (on) {
			self.Taskbar.push(['flash', on]);
		};
		this.setThumbarButtons = function (buttons) {
			self.Thumbar = buttons;

			return true;
		};
		this.hide = function () {
			self.Visible = false;
		};
		this.show = function () {
			self.Visible = true;
		};
		this.isVisible = function () {
			return self.Visible;
		};
		this.isDestroyed = function () {
			return false;
		};
		this.isMaximized = function () {
			return maximized;
		};
		this.isMinimized = function () {
			return false;
		};
		this.isFullScreen = function () {
			return false;
		};
		this.isFocused = function () {
			return true;
		};
		this.maximize = function () {
			maximized = true;
		};
		this.restore = function () {};
		this.focus = function () {
			self.Focused = true;
		};

		fake.Windows.push(this);
	}

	Window.getAllWindows = function () {
		return fake.Windows;
	};

	Window.fromWebContents = function (contents) {
		return fake.Windows.filter(function (item) {
			return item.webContents === contents;
		})[0];
	};

	fake.Event = function (index) {
		return {sender: fake.Windows[index].webContents, senderFrame: {url: 'app://bundle/index.html'}};
	};

	fake.Electron = {
		app: {
			whenReady: function () {
				return {then: function (callback) {
					callback();
				}};
			},
			on: function (name, callback) {
				fake.AppEvents[name] = callback;
			},
			quit: function () {
				fake.Quit = true;
			},
			setBadgeCount: function (count) {
				fake.Badge = count;
			},
			setUserTasks: function (tasks) {
				fake.Tasks = tasks;
			},
			dock: {
				bounce: function (kind) {
					fake.Bounced.push(kind);
				}
			},
			requestSingleInstanceLock: function () {
				return fake.Lock;
			},
			setAsDefaultProtocolClient: function (scheme) {
				fake.Clients.push(scheme);
			},
			getVersion: function () {
				return '1.2.9';
			},
			setLoginItemSettings: function (value) {
				fake.Login = value.openAtLogin;
			},
			getLoginItemSettings: function () {
				return {openAtLogin: fake.Login};
			}
		},
		globalShortcut: {
			register: function (keys, callback) {
				if (keys === 'Taken+K') return false;

				fake.Shortcuts[keys] = callback;

				return true;
			},
			unregisterAll: function () {
				fake.Shortcuts = {};
			}
		},
		powerMonitor: {
			on: function (name, callback) {
				fake.Power[name] = callback;
			},
			isOnBatteryPower: function () {
				return true;
			},
			getSystemIdleTime: function () {
				return 12;
			},
			getSystemIdleState: function () {
				return 'active';
			}
		},
		powerSaveBlocker: {
			start: function (kind) {
				fake.Blockers.push(kind);

				return 7;
			},
			stop: function (id) {
				fake.Blockers.push('stop ' + id);
			}
		},
		protocol: {
			registerSchemesAsPrivileged: function (schemes) {
				fake.Schemes = schemes;
			},
			handle: function (scheme, callback) {
				fake.Protocols[scheme] = callback;
			}
		},
		net: {
			fetch: function (url) {
				fake.Fetched.push(url);

				if (/feed\.json$/.test(url)) {
					return Promise.resolve({ok: true, json: function () {
						return Promise.resolve(fake.Feed);
					}});
				}

				return 'fetched';
			}
		},
		ipcMain: {
			handle: function (channel, callback) {
				fake.Handlers[channel] = callback;
			}
		},
		dialog: {
			showOpenDialog: function (window, options) {
				fake.Dialogs.push(options);

				return Promise.resolve({canceled: false, filePaths: fake.Opened});
			}
		},
		Menu: {
			buildFromTemplate: function (template) {
				fake.Menus.push(template);

				return {popup: function () {}};
			},
			setApplicationMenu: function () {}
		},
		shell: {
			openExternal: function (url) {
				fake.External.push(url);

				return Promise.resolve();
			}
		},
		nativeImage: {
			createFromDataURL: function (data) {
				return {From: 'data ' + data.substring(0, 15)};
			},
			createFromPath: function (file) {
				return {From: file};
			}
		},
		Tray: function (image) {
			var tray = this;

			this.Image = image.From;
			this.Events = {};
			this.on = function (name, callback) {
				tray.Events[name] = callback;
			};
			this.setToolTip = function (text) {
				tray.Tooltip = text;
			};
			this.setContextMenu = function (menu) {
				tray.Menu = menu;
			};
			this.destroy = function () {
				tray.Destroyed = true;
			};
			this.getBounds = function () {
				return {x: 1800, y: 1040, width: 24, height: 24};
			};
			this.popUpContextMenu = function (menu) {
				tray.Popped = menu;
			};

			fake.Trays.push(this);
		},
		screen: {
			getDisplayMatching: function () {
				return {workArea: {x: 0, y: 0, width: 1920, height: 1040}};
			},
			getCursorScreenPoint: function () {
				return {x: 0, y: 0};
			}
		},
		BrowserWindow: Window
	};

	return fake;
}

describe('Builder: a desktop program (Electron)', function () {
	afterEach(function () {
		fs.rmSync(output, {recursive: true, force: true});
		fs.rmSync(modules, {recursive: true, force: true});
	});

	it('makes the Application ready for Electron, and says what to type when the project has not Electron', function () {
		var text = build();
		var folder = path.join(output, 'native', 'desktop');

		expect(fs.readdirSync(folder).sort()).toEqual(['app', 'elemenx-native.json', 'main.js', 'package.json', 'preload.js']);
		expect(JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8'))).toEqual({name: 'single-project', productName: 'single-project', version: '1.0.0', description: '', main: 'main.js', private: true});
		expect(JSON.parse(fs.readFileSync(path.join(folder, 'elemenx-native.json'), 'utf8'))).toEqual({Name: 'single-project', Width: 1200, Height: 800, Frame: true, Features: ['window', 'dialogs', 'menu', 'tray', 'external', 'taskbar', 'hotkeys', 'autostart', 'links', 'power', 'update']});
		expect(fs.readFileSync(path.join(folder, 'app', 'app.js'), 'utf8')).toContain('Elemenx.Expressions({');
		expect(fs.existsSync(path.join(output, 'native-app'))).toBe(false);

		expect(text).toContain('it is not a program yet');
		expect(text).toContain('(missing: electron, @electron/packager)');
		expect(text).toContain('npm install --save-dev electron @electron/packager');
		expect(text).toContain('npx elemenx build --native desktop --out ../electron-output');
		expect(text).toContain('made in ../electron-output/native/desktop-bin');
		expect(text).toContain('npx electron ../electron-output/native/desktop');
	});

	it('makes the program with the Electron and the packager of the project', function () {
		var record = path.join(output, 'packager.json');
		var text;
		var call;

		write(path.join(modules, 'electron', 'package.json'), JSON.stringify({name: 'electron', version: '33.2.0'}));
		/* As the real packager, its exports leave out its package.json. */
		write(path.join(modules, '@electron', 'packager', 'package.json'), JSON.stringify({name: '@electron/packager', type: 'commonjs', exports: {'.': './index.js'}, bin: {'electron-packager': 'bin/cli.js'}}));
		write(path.join(modules, '@electron', 'packager', 'bin', 'cli.js'), 'require("fs").writeFileSync(' + JSON.stringify(record) + ', JSON.stringify(process.argv.slice(2)));');

		text = build({nativeSettings: {Desktop: {Name: 'Single', Platform: 'linux', Arch: 'x64'}}});
		call = JSON.parse(fs.readFileSync(record, 'utf8'));

		expect(call).toEqual([path.join(output, 'native', 'desktop'), 'Single', '--out=' + path.join(output, 'native', 'desktop-bin'), '--overwrite', '--electron-version=33.2.0', '--platform=linux', '--arch=x64']);

		/* A scheme of links goes into the program too (macOS reads it from the program, not at run time). */
		build({nativeSettings: {Desktop: {Name: 'Single', Platform: 'darwin', Arch: 'arm64', Protocol: 'single'}}});

		expect(JSON.parse(fs.readFileSync(record, 'utf8')).slice(-2)).toEqual(['--protocol=single', '--protocol-name=Single']);
		expect(text).toContain('the program is in ' + path.join(output, 'native', 'desktop-bin'));
		expect(text).not.toContain('not a program yet');
	});

	it('keeps the languages of Chromium the program speaks, and makes it into a zip, an installer and a portable program', function () {
		var record = path.join(output, 'builder.json');
		var program = path.join(output, 'native', 'desktop-bin', 'Single-win32-x64');
		var made = path.join(output, 'native', 'desktop-dist');
		var text;
		var call;
		var zip;
		var names = {};
		var at;

		write(path.join(modules, 'electron', 'package.json'), JSON.stringify({name: 'electron', version: '33.2.0'}));
		write(path.join(modules, '@electron', 'packager', 'package.json'), JSON.stringify({name: '@electron/packager', bin: {'electron-packager': 'bin/cli.js'}}));
		/* The packager makes the folder of the program, with the languages of Chromium. */
		write(path.join(modules, '@electron', 'packager', 'bin', 'cli.js'), [
			'var fs = require("fs"), path = require("path"), out = process.argv.find(function (a) { return a.indexOf("--out=") === 0; }).slice(6);',
			'var folder = path.join(out, "Single-win32-x64");',
			'fs.mkdirSync(path.join(folder, "locales"), {recursive: true});',
			'["en-US", "en-GB", "ru", "de", "pt-BR", "pt-PT"].forEach(function (l) { fs.writeFileSync(path.join(folder, "locales", l + ".pak"), l); });',
			'fs.writeFileSync(path.join(folder, "Single.exe"), "program");'
		].join('\n'));

		expect(function () {
			build({nativeSettings: {Desktop: {Name: 'Single', Platform: 'win32', Arch: 'x64', Targets: ['msi']}}});
		}).toThrow('Native.Desktop.Targets must be a list of zip, installer, portable');

		expect(function () {
			build({nativeSettings: {Desktop: {Name: 'Single', Platform: 'win32', Arch: 'x64', Languages: 'ru'}}});
		}).toThrow('Native.Desktop.Languages must be all or a list of languages');

		/* Without electron-builder: the zip, and what to type for the rest. */
		text = build({nativeSettings: {Desktop: {Name: 'Single', Platform: 'win32', Arch: 'x64', Languages: ['ru', 'pt'], Targets: ['zip', 'installer', 'portable']}}});

		expect(fs.readdirSync(path.join(program, 'locales')).sort()).toEqual(['en-US.pak', 'pt-BR.pak', 'pt-PT.pak', 'ru.pak']);
		expect(text).toContain('the program speaks en-US, ru, pt (Native.Desktop.Languages: all keeps the other 2)');
		expect(text).toContain('npm install --save-dev electron-builder');
		expect(fs.readdirSync(made)).toEqual(['single-1.0.0-win32-x64.zip']);

		/* The zip holds the folder of the program, its files with their rights. */
		zip = fs.readFileSync(path.join(made, 'single-1.0.0-win32-x64.zip'));
		at = zip.indexOf(Buffer.from([0x50, 0x4B, 0x01, 0x02]));

		while (at !== -1) {
			names[zip.toString('utf8', at + 46, at + 46 + zip.readUInt16LE(at + 28))] = (zip.readUInt32LE(at + 38) >>> 16) & 511;
			at = zip.indexOf(Buffer.from([0x50, 0x4B, 0x01, 0x02]), at + 46);
		}

		expect(Object.keys(names).sort()).toEqual(['Single-win32-x64/Single.exe', 'Single-win32-x64/locales/en-US.pak', 'Single-win32-x64/locales/pt-BR.pak', 'Single-win32-x64/locales/pt-PT.pak', 'Single-win32-x64/locales/ru.pak']);
		expect(names['Single-win32-x64/Single.exe']).toBe(fs.statSync(path.join(program, 'Single.exe')).mode & 511);

		/* With electron-builder: the installer and the portable program, from the program the packager made. */
		write(path.join(modules, 'electron-builder', 'package.json'), JSON.stringify({name: 'electron-builder', bin: {'electron-builder': './cli.js', 'install-app-deps': './install-app-deps.js'}}));
		write(path.join(modules, 'electron-builder', 'cli.js'), [
			'var fs = require("fs"), path = require("path"), args = process.argv.slice(2);',
			'var config = JSON.parse(fs.readFileSync(args[args.indexOf("--config") + 1], "utf8"));',
			'fs.writeFileSync(' + JSON.stringify(record) + ', JSON.stringify({Args: args, Config: config}));',
			'["Single-1.0.0-setup.exe", "Single-1.0.0-setup.exe.blockmap", "Single-1.0.0-portable.exe", "builder-debug.yml"].forEach(function (n) { fs.writeFileSync(path.join(config.directories.output, n), n); });'
		].join('\n'));

		text = build({nativeSettings: {Desktop: {Name: 'Single', Platform: 'win32', Arch: 'x64', Targets: ['installer', 'portable']}}});
		call = JSON.parse(fs.readFileSync(record, 'utf8'));

		expect(call.Args).toEqual(['--prepackaged', program, '--projectDir', path.join(output, 'native', 'desktop'), '--config', path.join(output, 'native', 'desktop', 'electron-builder.json'), '--win', 'nsis', 'portable', '--x64']);
		expect(call.Config).toMatchObject({productName: 'Single', electronVersion: '33.2.0', directories: {output: made}, publish: null});
		expect(fs.readdirSync(made).sort()).toEqual(['Single-1.0.0-portable.exe', 'Single-1.0.0-setup.exe']);
		expect(text).toContain(path.join(made, 'Single-1.0.0-setup.exe'));

		/* The program speaks every language with all; the folder alone, without Targets. */
		build({nativeSettings: {Desktop: {Name: 'Single', Platform: 'win32', Arch: 'x64', Languages: 'all'}}});

		expect(fs.readdirSync(path.join(program, 'locales')).length).toBe(6);
		expect(fs.existsSync(made)).toBe(false);
	});

	it('writes the settings of the program for its main script, and refuses features it does not know', function () {
		var folder = path.join(output, 'native', 'desktop');

		build({nativeSettings: {Desktop: {Name: 'Single', Width: 900, Height: 600, Frame: false, Features: ['window', 'dialogs']}}});

		expect(JSON.parse(fs.readFileSync(path.join(folder, 'elemenx-native.json'), 'utf8'))).toEqual({Name: 'Single', Width: 900, Height: 600, Frame: false, Features: ['window', 'dialogs']});

		expect(function () {
			build({nativeSettings: {Desktop: {Features: ['window', 'camera']}}});
		}).toThrow('unknown Native.Desktop.Features: camera');

		/* The window takes the color of the splash, so it opens without a white flash; a color of a variable it cannot read. */
		build({nativeSettings: {Desktop: {Name: 'Single'}}, splash: {Background: '#102030'}});

		expect(JSON.parse(fs.readFileSync(path.join(folder, 'elemenx-native.json'), 'utf8')).Background).toBe('#102030');
		expect(fs.readFileSync(path.join(folder, 'app', 'index.html'), 'utf8')).toContain('id="elemenx-splash"');

		build({nativeSettings: {Desktop: {Name: 'Single'}}, splash: {Background: 'var(--brand)'}});

		expect(JSON.parse(fs.readFileSync(path.join(folder, 'elemenx-native.json'), 'utf8')).Background).toBe(undefined);

		build({nativeSettings: {Desktop: {Protocol: 'single-app', Update: 'https://example.com/single/feed.json'}}});

		expect(JSON.parse(fs.readFileSync(path.join(folder, 'elemenx-native.json'), 'utf8'))).toMatchObject({Protocol: 'single-app', Update: 'https://example.com/single/feed.json'});

		expect(function () {
			build({nativeSettings: {Desktop: {Protocol: 'https'}}});
		}).toThrow('Native.Desktop.Protocol must be a scheme of the program of its own, as myapp: https');
		expect(function () {
			build({nativeSettings: {Desktop: {Protocol: 'My App'}}});
		}).toThrow('Native.Desktop.Protocol must be a scheme');
		expect(function () {
			build({nativeSettings: {Desktop: {Update: 'http://example.com/feed.json'}}});
		}).toThrow('Native.Desktop.Update must be an https URL: http://example.com/feed.json');
	});

	it('opens a window on app://bundle/, serves the files of the Application only, and answers the bridge for its features', async function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-electron-'));
		var fake = fakeElectron();
		var handler;
		var bridge;
		var answer;
		var events = [];

		try {
			build({nativeSettings: {Desktop: {Features: ['window', 'dialogs', 'menu', 'external']}}});

			fs.cpSync(path.join(output, 'native', 'desktop'), folder, {recursive: true});

			write(path.join(folder, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');
			write(path.join(folder, 'app', 'notes.txt'), 'Hello');

			fake.Opened = [path.join(folder, 'app', 'notes.txt')];
			global.fakeElectron = fake.Electron;

			require(path.join(folder, 'main.js'));

			/* The window: on the scheme of the Application, with the bridge of preload.js, its features in the arguments. */
			expect(fake.Schemes[0]).toEqual({scheme: 'app', privileges: {standard: true, secure: true, supportFetchAPI: true, corsEnabled: true}});
			expect(fake.Windows[0].Loaded).toBe('app://bundle/index.html');
			expect(fake.Windows[0].Options.webPreferences).toEqual({contextIsolation: true, sandbox: true, preload: path.join(folder, 'preload.js'), additionalArguments: ['--elemenx-features=window,dialogs,menu,external']});

			/* The files: from the folder of the Application only (a decoded slash cannot lead out of it). */
			handler = fake.Protocols.app;

			expect(handler({url: 'app://bundle/index.html'})).toBe('fetched');
			expect(fake.Fetched[0]).toBe(url.pathToFileURL(path.join(folder, 'app', 'index.html')).href);
			expect(handler({url: 'app://bundle/%2F..%2Fmain.js'}).status).toBe(403);

			/* The bridge: the page of the Application only, its features only. */
			bridge = fake.Handlers['elemenx:native'];

			expect(function () {
				bridge({sender: fake.Windows[0].webContents, senderFrame: {url: 'https://evil.example/'}}, 'window', {Action: 'minimize'});
			}).toThrow('Elemenx Native answers the Application only');
			expect(function () {
				bridge(fake.Event(0), 'tray', {Icon: 'icon.png'});
			}).toThrow('Elemenx Native feature is off: tray');

			expect(bridge(fake.Event(0), 'window', {Action: 'maximize'})).toEqual({Maximized: true, Minimized: false, Fullscreen: false, Focused: true});

			answer = await bridge(fake.Event(0), 'open', {Read: 'text', Accept: ['.txt']});

			expect(answer).toEqual([{Name: 'notes.txt', Path: path.join(folder, 'app', 'notes.txt'), Size: 5, Text: 'Hello'}]);
			expect(fake.Dialogs[0].filters).toEqual([{name: 'txt', extensions: ['txt']}]);

			/* The menu: a click sends its id to the page. */
			bridge(fake.Event(0), 'menu', {Items: [{Label: 'Help', Items: [{ID: 'about', Label: 'About', Hotkey: 'F1'}]}]});

			fake.Menus[0][0].submenu[0].click();

			expect(fake.Windows[0].Sent).toEqual([['elemenx:native-event', 'menu', {ID: 'about'}]]);
			expect(fake.Menus[0][0].submenu[0].accelerator).toBe('F1');

			/* Links out of the Application: the browser of the system, never the window. */
			await bridge(fake.Event(0), 'external', {URL: 'https://example.com/'});

			expect(function () {
				bridge(fake.Event(0), 'external', {URL: 'file:///etc/passwd'});
			}).toThrow('Elemenx Native opens only http, https and mailto links');
			expect(fake.Windows[0].OpenHandler({url: 'https://elemenx.dev/'})).toEqual({action: 'deny'});

			fake.Windows[0].Navigate('https://example.org/', events);

			expect(events).toEqual(['prevented']);
			expect(fake.External).toEqual(['https://example.com/', 'https://elemenx.dev/', 'https://example.org/']);
		}
		finally {
			delete global.fakeElectron;
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});

	it('answers global hotkeys, autostart, links of its scheme in one program, power and the feed of versions', async function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-electron-'));
		var fake = fakeElectron();
		var argv = process.argv;
		var platform = Object.getOwnPropertyDescriptor(process, 'platform');
		var bridge;
		var sent = [];

		try {
			build({nativeSettings: {Desktop: {Protocol: 'single', Update: 'https://example.com/single/feed.json'}}});

			fs.cpSync(path.join(output, 'native', 'desktop'), folder, {recursive: true});

			write(path.join(folder, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');

			global.fakeElectron = fake.Electron;
			process.argv = argv.concat(['single://open/42']);

			Object.defineProperty(process, 'platform', {value: 'win32'});

			require(path.join(folder, 'main.js'));

			bridge = fake.Handlers['elemenx:native'];
			fake.Windows[0].ElemenxSend = function (name, value) {
				sent.push([name, value]);
			};

			/* Links: the scheme is the program's; the link of the start waits for the page, a second start hands its link over. */
			expect(fake.Clients).toEqual(['single']);
			expect(bridge(fake.Event(0), 'links', {})).toEqual(['single://open/42']);
			expect(bridge(fake.Event(0), 'links', {})).toEqual([]);

			fake.AppEvents['second-instance']({}, ['program.exe', '--flag', 'single://open/7', 'other://x']);

			expect(sent).toEqual([['link', {URL: 'single://open/7'}]]);
			expect(fake.Windows[0].Focused).toBe(true);
			expect(bridge(fake.Event(0), 'links', {})).toEqual(['single://open/7']);

			/* Global hotkeys: the ones the system gives, a press told to the pages; all go when the program quits. */
			expect(bridge(fake.Event(0), 'shortcuts', {Keys: ['CommandOrControl+Shift+K', 'Taken+K']})).toEqual(['CommandOrControl+Shift+K']);

			fake.Shortcuts['CommandOrControl+Shift+K']();

			expect(sent[1]).toEqual(['shortcut', {Keys: 'CommandOrControl+Shift+K'}]);

			fake.AppEvents['will-quit']();

			expect(fake.Shortcuts).toEqual({});

			/* Autostart, power and keeping the screen awake. */
			expect(bridge(fake.Event(0), 'autostart', {Enabled: null})).toEqual({Enabled: false});
			expect(bridge(fake.Event(0), 'autostart', {Enabled: true})).toEqual({Enabled: true});
			expect(bridge(fake.Event(0), 'power', {})).toEqual({OnBattery: true, Idle: 12, State: 'active'});

			fake.Power['lock-screen']();

			expect(sent[2]).toEqual(['power', {State: 'lock-screen'}]);
			expect(Object.keys(fake.Power)).toEqual(['suspend', 'resume', 'lock-screen', 'unlock-screen', 'on-ac', 'on-battery', 'shutdown']);
			expect(bridge(fake.Event(0), 'awake', {On: true})).toEqual({Awake: true});
			expect(bridge(fake.Event(0), 'awake', {On: true})).toEqual({Awake: true});
			expect(bridge(fake.Event(0), 'awake', {On: false})).toEqual({Awake: false});
			expect(fake.Blockers).toEqual(['prevent-display-sleep', 'stop 7']);

			/* The feed of versions: newer by number, a download only over https. */
			fake.Feed = {Version: '1.2.10', URL: 'https://example.com/single/1.2.10.zip', Notes: 'Faster'};

			expect(await bridge(fake.Event(0), 'update', {})).toEqual({Current: '1.2.9', Latest: '1.2.10', Available: true, URL: 'https://example.com/single/1.2.10.zip', Notes: 'Faster'});

			fake.Feed = {Version: '1.2.9', URL: 'http://example.com/old.zip'};

			expect(await bridge(fake.Event(0), 'update', {})).toEqual({Current: '1.2.9', Latest: '1.2.9', Available: false, URL: null, Notes: ''});
			expect(fake.Fetched.slice(-1)).toEqual(['https://example.com/single/feed.json']);
		}
		finally {
			process.argv = argv;

			Object.defineProperty(process, 'platform', platform);
			delete global.fakeElectron;
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});

	it('quits a second start of a program with a scheme, and refuses links and updates it was not given', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-electron-'));
		var second = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-electron-'));
		var fake = fakeElectron();
		var other = fakeElectron();
		var platform = Object.getOwnPropertyDescriptor(process, 'platform');

		try {
			build({nativeSettings: {Desktop: {Protocol: 'single'}}});

			fs.cpSync(path.join(output, 'native', 'desktop'), folder, {recursive: true});

			write(path.join(folder, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');

			fake.Lock = false;
			global.fakeElectron = fake.Electron;

			require(path.join(folder, 'main.js'));

			expect(fake.Quit).toBe(true);
			expect(fake.Windows).toEqual([]);
			expect(fake.Clients).toEqual([]);

			build();

			fs.cpSync(path.join(output, 'native', 'desktop'), second, {recursive: true});

			write(path.join(second, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');

			global.fakeElectron = other.Electron;

			Object.defineProperty(process, 'platform', {value: 'linux'});

			require(path.join(second, 'main.js'));

			expect(function () {
				other.Handlers['elemenx:native'](other.Event(0), 'links', {});
			}).toThrow('Elemenx Native links need Native.Desktop.Protocol');
			expect(function () {
				other.Handlers['elemenx:native'](other.Event(0), 'update', {});
			}).toThrow('Elemenx Native update needs Native.Desktop.Update');
			expect(function () {
				other.Handlers['elemenx:native'](other.Event(0), 'autostart', {Enabled: true});
			}).toThrow('Elemenx Native autostart needs Windows or macOS');
		}
		finally {
			Object.defineProperty(process, 'platform', platform);
			delete global.fakeElectron;
			fs.rmSync(folder, {recursive: true, force: true});
			fs.rmSync(second, {recursive: true, force: true});
		}
	});

	it('shows a progress in its states, a count over the icon, the attention and the buttons under the thumbnail on the taskbar of Windows', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-electron-'));
		var fake = fakeElectron();
		var platform = Object.getOwnPropertyDescriptor(process, 'platform');
		var bridge;
		var sent = [];

		try {
			build();

			fs.cpSync(path.join(output, 'native', 'desktop'), folder, {recursive: true});

			write(path.join(folder, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');

			global.fakeElectron = fake.Electron;

			Object.defineProperty(process, 'platform', {value: 'win32'});

			require(path.join(folder, 'main.js'));

			bridge = fake.Handlers['elemenx:native'];
			fake.Windows[0].ElemenxSend = function (name, value) {
				sent.push([name, value]);
			};

			bridge(fake.Event(0), 'progress', {Value: 0.5, State: 'normal'});
			bridge(fake.Event(0), 'progress', {Value: 0.5, State: 'paused'});
			bridge(fake.Event(0), 'progress', {Value: null, State: 'indeterminate'});
			bridge(fake.Event(0), 'progress', {Value: null, State: 'normal'});

			/* On Windows a count is a picture over the icon (drawn by the page), not the badge of the system. */
			bridge(fake.Event(0), 'badge', {Count: 3, Image: 'data:image/png;base64,AAAA'});
			bridge(fake.Event(0), 'badge', {Count: 0, Image: null});
			bridge(fake.Event(0), 'attention', {On: true});

			expect(fake.Windows[0].Taskbar).toEqual([
				['progress', 0.5, 'normal'],
				['progress', 0.5, 'paused'],
				['progress', 2, 'indeterminate'],
				['progress', -1, undefined],
				['overlay', 'data data:image/png;', '3'],
				['overlay', null, ''],
				['flash', true]
			]);
			expect(fake.Badge).toBe(undefined);

			/* The buttons under the thumbnail: icons of the Application, a press told to the page. */
			bridge(fake.Event(0), 'thumbar', {Buttons: [{ID: 'play', Icon: 'icons/play.png', Tooltip: 'Play'}, {ID: 'next', Icon: 'icons/next.png', Disabled: true}]});

			expect(fake.Windows[0].Thumbar.map(function (button) {
				return [button.icon.From, button.tooltip, button.flags];
			})).toEqual([[path.join(folder, 'app', 'icons', 'play.png'), 'Play', ['enabled']], [path.join(folder, 'app', 'icons', 'next.png'), '', ['disabled']]]);

			fake.Windows[0].Thumbar[0].click();

			expect(sent).toEqual([['thumbar', {ID: 'play'}]]);

			/* Elsewhere: the badge of the system, a dock that bounces, no thumbnail buttons. */
			Object.defineProperty(process, 'platform', {value: 'darwin'});

			bridge(fake.Event(0), 'badge', {Count: 5, Image: 'data:image/png;base64,AAAA'});
			bridge(fake.Event(0), 'attention', {On: true});

			expect(fake.Badge).toBe(5);
			expect(fake.Bounced).toEqual(['informational']);
			expect(function () {
				bridge(fake.Event(0), 'thumbar', {Buttons: []});
			}).toThrow('Elemenx Native thumbnail buttons need Windows');
		}
		finally {
			Object.defineProperty(process, 'platform', platform);
			delete global.fakeElectron;
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});

	it('keeps the program in its tray when its window closes, tells the clicks of the icon, and answers the tasks of its jump list in one program', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-electron-'));
		var fake = fakeElectron();
		var argv = process.argv;
		var platform = Object.getOwnPropertyDescriptor(process, 'platform');
		var bridge;
		var sent = [];
		var closing;

		try {
			expect(function () {
				build({nativeSettings: {Desktop: {Tasks: [{ID: 'new mail', Label: 'New mail'}]}}});
			}).toThrow('Native.Desktop.Tasks must be a list of tasks {ID, Label, Description}');

			build({nativeSettings: {Desktop: {CloseToTray: true, Tasks: [{ID: 'compose', Label: 'New message', Description: 'Write a message'}, {ID: 'inbox', Label: 'Inbox'}]}}});

			expect(JSON.parse(fs.readFileSync(path.join(output, 'native', 'desktop', 'elemenx-native.json'), 'utf8'))).toMatchObject({CloseToTray: true, Tasks: [{ID: 'compose', Label: 'New message', Description: 'Write a message'}, {ID: 'inbox', Label: 'Inbox', Description: ''}]});

			fs.cpSync(path.join(output, 'native', 'desktop'), folder, {recursive: true});

			write(path.join(folder, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');

			global.fakeElectron = fake.Electron;
			process.argv = argv.concat(['--elemenx-task=inbox', '--elemenx-task=unknown']);

			Object.defineProperty(process, 'platform', {value: 'win32'});

			require(path.join(folder, 'main.js'));

			bridge = fake.Handlers['elemenx:native'];
			fake.Windows[0].ElemenxSend = function (name, value) {
				sent.push([name, value]);
			};

			/* The jump list: a task starts the program with its ID; the task of the start waits for the page, a second start hands its own over. */
			expect(fake.Tasks.map(function (task) {
				return [task.title, task.description, task.arguments.replace(/^"[^"]*" /, '')];
			})).toEqual([['New message', 'Write a message', '--elemenx-task=compose'], ['Inbox', 'Inbox', '--elemenx-task=inbox']]);
			expect(bridge(fake.Event(0), 'tasks', {})).toEqual(['inbox']);
			expect(bridge(fake.Event(0), 'tasks', {})).toEqual([]);

			fake.Windows[0].hide();
			fake.AppEvents['second-instance']({}, ['program.exe', '--elemenx-task=compose']);

			expect(sent).toEqual([['task', {ID: 'compose'}]]);
			expect(fake.Windows[0].Visible).toBe(true);
			expect(fake.Windows[0].Focused).toBe(true);

			/* Without an icon in the tray the window closes as any window. */
			closing = {Prevented: false, preventDefault: function () {
				closing.Prevented = true;
			}};

			fake.Windows[0].Events.close(closing);

			expect(closing.Prevented).toBe(false);

			/* With one, closing hides the window there; a click on the icon brings it back; the clicks are told by their kind. */
			bridge(fake.Event(0), 'tray', {Icon: 'icon.png', Tooltip: 'Mail', Items: [{ID: 'open', Label: 'Open'}, {Label: 'Quit', Role: 'quit'}]});

			expect([fake.Trays[0].Image, fake.Trays[0].Tooltip]).toEqual([path.join(folder, 'app', 'icon.png'), 'Mail']);

			fake.Windows[0].Events.close(closing);

			expect(closing.Prevented).toBe(true);
			expect(fake.Windows[0].Visible).toBe(false);

			fake.Trays[0].Events.click();
			fake.Trays[0].Events['double-click']();
			fake.Trays[0].Events['right-click']();
			fake.Menus[fake.Menus.length - 1][0].click();

			expect(fake.Windows[0].Visible).toBe(true);
			expect(sent.slice(-4)).toEqual([['tray', {ID: null, Kind: 'click'}], ['tray', {ID: null, Kind: 'double'}], ['tray', {ID: null, Kind: 'right'}], ['tray', {ID: 'open', Kind: 'menu'}]]);
			expect(fake.Menus[fake.Menus.length - 1][1].role).toBe('quit');

			/* Quitting: the window closes for good, Window quit asks it. */
			expect(bridge(fake.Event(0), 'window', {Action: 'quit'})).toBe(null);
			expect(fake.Quit).toBe(true);

			fake.AppEvents['before-quit']();

			closing.Prevented = false;

			fake.Windows[0].Events.close(closing);

			expect(closing.Prevented).toBe(false);
		}
		finally {
			process.argv = argv;

			Object.defineProperty(process, 'platform', platform);
			delete global.fakeElectron;
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});

	it('opens the window of the tray by its icon at a click, hides it when it loses the focus, and keeps the menu for the right button', function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-electron-'));
		var fake = fakeElectron();
		var bridge;
		var child;
		var main;
		var now = Date.now;
		var time = 1000000;

		try {
			build({});

			fs.cpSync(path.join(output, 'native', 'desktop'), folder, {recursive: true});

			write(path.join(folder, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');

			global.fakeElectron = fake.Electron;

			Date.now = function () {
				return time;
			};

			require(path.join(folder, 'main.js'));

			bridge = fake.Handlers['elemenx:native'];

			expect(function () {
				bridge(fake.Event(0), 'traywindow', {Show: true});
			}).toThrow('Elemenx Native has no window of the tray');

			/* The page opens the window of the tray hidden, without a frame and off the taskbar. */
			expect(fake.Windows[0].OpenHandler({url: 'about:blank', frameName: 'elemenx-tray'})).toMatchObject({action: 'allow', overrideBrowserWindowOptions: {show: false, frame: false, skipTaskbar: true, alwaysOnTop: true}});

			child = new fake.Electron.BrowserWindow({width: 320, height: 420});
			child.Visible = false;

			fake.Windows[0].Contents['did-create-window'](child, {frameName: 'elemenx-tray'});

			bridge(fake.Event(0), 'tray', {Icon: 'icon.png', Items: [{ID: 'open', Label: 'Open'}], Window: {Width: 320, Height: 420}});

			expect(fake.Trays[0].Menu).toBe(undefined);

			/* A click shows it above the icon on a taskbar at the bottom, within the screen. */
			fake.Trays[0].Events.click();

			expect(child.Visible).toBe(true);
			expect([child.Bounds.x, child.Bounds.y]).toEqual([1592, 612]);

			/* Losing the focus hides it; the click on the icon that took the focus does not bring it back at once. */
			child.Events.blur();

			fake.Trays[0].Events.click();

			expect(child.Visible).toBe(false);

			time += 1000;

			fake.Trays[0].Events.click();

			expect(child.Visible).toBe(true);

			fake.Trays[0].Events.click();

			expect(child.Visible).toBe(false);

			/* The right button opens the menu; the page shows and hides the window too. */
			fake.Trays[0].Events['right-click']();

			expect(fake.Trays[0].Popped).not.toBe(undefined);
			expect(bridge(fake.Event(0), 'traywindow', {Show: true})).toBe(null);
			expect(child.Visible).toBe(true);

			bridge(fake.Event(0), 'traywindow', {Show: false});

			expect(child.Visible).toBe(false);

			/* The window of the page comes back by Window show, though the window of the tray comes first among the windows. */
			main = fake.Windows[0];

			fake.Windows.unshift(fake.Windows.pop());

			main.hide();

			bridge({sender: main.webContents, senderFrame: {url: 'app://bundle/index.html'}}, 'window', {Action: 'show'});

			expect([main.Visible, child.Visible]).toEqual([true, false]);
		}
		finally {
			Date.now = now;

			delete global.fakeElectron;
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});

	it('gives the page a bridge with callbacks and events, its features from the main script', async function () {
		var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-preload-'));
		var exposed = {};
		var renderer = {};
		var heard = [];
		var argv = process.argv;
		var result;

		try {
			build();

			fs.copyFileSync(path.join(output, 'native', 'desktop', 'preload.js'), path.join(folder, 'preload.js'));

			write(path.join(folder, 'node_modules', 'electron', 'index.js'), 'module.exports = global.fakeElectron;');

			global.fakeElectron = {
				contextBridge: {
					exposeInMainWorld: function (name, value) {
						exposed[name] = value;
					}
				},
				ipcRenderer: {
					on: function (channel, callback) {
						renderer[channel] = callback;
					},
					invoke: function (channel, name, args) {
						if (name === 'tray')
							return Promise.reject(new Error('Error invoking remote method \'elemenx:native\': Error: Elemenx Native feature is off: tray'));

						return Promise.resolve({Channel: channel, Name: name, Args: args});
					}
				}
			};
			process.argv = argv.concat(['--elemenx-features=window,dialogs']);

			require(path.join(folder, 'preload.js'));

			expect([exposed.ElemenxNative.Platform, exposed.ElemenxNative.Features]).toEqual(['electron', ['window', 'dialogs']]);

			result = await new Promise(function (resolve) {
				exposed.ElemenxNative.Call('window', {Action: 'close'}, function (error, value) {
					resolve([error, value]);
				});
			});

			expect(result).toEqual([null, {Channel: 'elemenx:native', Name: 'window', Args: {Action: 'close'}}]);

			result = await new Promise(function (resolve) {
				exposed.ElemenxNative.Call('tray', {}, function (error) {
					resolve(error.message);
				});
			});

			expect(result).toBe('Elemenx Native feature is off: tray');

			exposed.ElemenxNative.On('menu', function (value) {
				heard.push(value);
			});

			renderer['elemenx:native-event']({}, 'menu', {ID: 'open'});

			expect(heard).toEqual([{ID: 'open'}]);
		}
		finally {
			process.argv = argv;
			delete global.fakeElectron;
			fs.rmSync(folder, {recursive: true, force: true});
		}
	});
});
