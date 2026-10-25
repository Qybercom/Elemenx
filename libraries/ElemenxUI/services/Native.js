/*
 * The native features of the system around the Application, one API wherever it runs. In a program of elemenx build
 * --native (desktop: Electron, mobile: Capacitor) it asks the system through the bridge of the program
 * (window.ElemenxNative); in a browser it does what the web can: a file picker, a download, confirm, a new tab, the
 * full screen. Every call takes callback(error, result); a feature the place lacks calls back an error.
 *
 * Available() is true in a native program, Platform() 'electron', 'capacitor' or 'web', Has(feature) tells whether a feature
 * works here (window, dialogs, menu, tray, external, taskbar, hotkeys, autostart, links, power, update; files in a mobile
 * program).
 * - Window(action, callback): minimize, maximize, restore, toggle-maximize, fullscreen, focus, close, show (a window
 *   hidden in the tray comes back) and quit (the program quits, even with CloseToTray); the result is the state
 *   {Maximized, Minimized, Fullscreen, Focused}. Title(text, callback): the title of the window.
 * - Open({Accept, Multiple, Read, Title}, callback): files chosen by the user, [{Name, Path, Size, Text or Data}]; Read
 *   'text' (by default), 'data' (base64) or 'none'; [] when the user cancels. A mobile program picks them as the web.
 * - Save({Name, Text or Data, Accept, Title}, callback): a file written where the user says, {Path} (null on the web,
 *   where it is a download), null when the user cancels. A mobile program writes it in the Documents of the device
 *   (Name a path there; @capacitor/filesystem), {Path} its URI.
 * - Message({Title, Text, Buttons, Kind}, callback): a message with buttons, the index of the one pressed.
 * - Menu(items, callback): the menu of the program ([{Label, Items: [{ID, Label, Hotkey, Disabled, Checked,
 *   Separator, Items, Role}]}]; null removes it); a click is the menu event {ID}. ContextMenu(items, callback): a menu
 *   at the pointer, the ID chosen or null.
 * - Tray({Icon, Tooltip, Items}, callback): an icon in the tray (Icon a path in the Application; null removes it); the
 *   tray event {ID, Kind}: an item of its menu (Kind menu), or the icon itself (ID null, Kind click, double or right).
 *   With Native.Desktop.CloseToTray, closing the window hides the program in the tray and a click on the icon brings it
 *   back. With Window ({Component, Props, Element, Width, Height}, 320 by 420) a click on the icon opens a small window
 *   of the Application by it, as the tray windows of programs do (no frame, not on the taskbar, hidden when it loses the
 *   focus), and the menu opens with the right button; TrayWindow(show, callback) shows it (true) or hides it (false),
 *   after a choice in it say.
 * - External(url, callback): opens an http, https or mailto link in the browser of the system.
 * - Badge(count, callback): a number on the icon of the program (0 removes it; on Windows a small picture over the
 *   icon, drawn here). Progress(value, callback): a progress from 0 to 1 on the button of the window (null removes it),
 *   or {Value, State} with State normal, indeterminate (no value: it runs), paused or error.
 * - Attention(on, callback): the button of the window flashes (the dock bounces) until the window comes to the front;
 *   on the web the title of the page blinks while the page is hidden.
 * - Thumbar(buttons, callback): the buttons under the thumbnail of the window on Windows ([{ID, Icon, Tooltip,
 *   Disabled}], seven at most; [] removes them); a press is the thumbar event {ID}.
 * - Tasks(callback): the tasks of the jump list of the program (Native.Desktop.Tasks: [{ID, Label, Description}], on
 *   Windows) that started it or came since the last call; a task chosen later is the task event {ID}.
 * - Shortcuts(keys, callback): the global hotkeys of the program, heard even when another program has the focus
 *   (['CommandOrControl+Shift+K']; [] removes them); the result lists the ones the system gave (another program may
 *   hold one); a press is the shortcut event {Keys}.
 * - Autostart(enabled, callback): starts the program when the user signs in (true), or not (false); without enabled it
 *   only tells; the result is {Enabled} (Windows and macOS).
 * - Links(callback): the links of the scheme of the program (Native.Desktop.Protocol: myapp://...) that opened it or came
 *   since the last call; a link that comes later is the link event {URL}, and starts no second program.
 * - Power(callback): {OnBattery, Idle (seconds without input), State (active, idle, locked, unknown)}; the power event
 *   {State}: suspend, resume, lock-screen, unlock-screen, on-ac, on-battery, shutdown. Awake(on, callback) keeps the
 *   screen from sleeping (on the web through the Screen Wake Lock), the result {Awake}.
 * - Update(callback): asks the feed of the versions (Native.Desktop.Update: a JSON {Version, URL, Notes}) whether a newer
 *   version is out: {Current, Latest, Available, URL, Notes}; External(URL) then opens the download.
 * - OpenWindow({ID, Component, Props, Element, Title, Width, Height}, callback): one more window of the same
 *   Application: its Component (with its Props), or an Element, lives in a window of its own, with the styles, the
 *   theme and the direction of the page, the state and the Services of the one Application. A link of the Application
 *   pressed there routes the page. An ID open already comes to the front. callback(error, {ID, Window}); a browser
 *   opens one only after a press or a key of the user. Windows() lists the IDs open, FocusWindow(id) brings one to the
 *   front, CloseWindow(id) closes it; a window closed (by the user too) takes its Component away and is the closed
 *   event {ID}. In a program the windows close with the first one.
 * - On(name, callback) / Off(name, callback): the events menu, tray, window ({Maximized, Minimized, Fullscreen,
 *   Focused}), shortcut, link, task, thumbar, closed and power.
 */
Elemenx.Service('Native', {
	$Meta: {
		Description: 'The native features of the system around the Application, one API wherever it runs.',
		Methods: ['Available()', 'Platform()', 'Has(feature)', 'Window(action, callback)', 'Title(text, callback)', 'Open(options, callback)', 'Save(options, callback)', 'Message(options, callback)', 'Menu(items, callback)', 'ContextMenu(items, callback)', 'Tray(options, callback)', 'TrayWindow(show, callback)', 'External(url, callback)', 'Badge(count, callback)', 'Progress(value, callback)', 'Attention(on, callback)', 'Thumbar(buttons, callback)', 'Tasks(callback)', 'OpenWindow(options, callback)', 'Windows()', 'FocusWindow(id)', 'CloseWindow(id)', 'Shortcuts(keys, callback)', 'Autostart(enabled, callback)', 'Links(callback)', 'Power(callback)', 'Awake(on, callback)', 'Update(callback)', 'On(name, callback)', 'Off(name, callback)']
	},
	$OnCreate: function () {
		var self = this;

		this.Listeners = {};
		this.Detach = {};
		this.Opened = {};

		/* The web reports the window from the full screen and the focus. */
		this.WebState = function () {
			self.Emit('window', self.State());
		};
	},

	/* The bridge of a native program, or null in a browser. */
	Bridge: function () {
		var bridge = typeof window !== 'undefined' ? window.ElemenxNative : null;

		return bridge && typeof bridge.Call === 'function' ? bridge : null;
	},

	Available: function () {
		return this.Bridge() !== null;
	},

	Platform: function () {
		var bridge = this.Bridge();

		return bridge ? String(bridge.Platform || 'native') : 'web';
	},

	Has: function (feature) {
		var bridge = this.Bridge();
		if (bridge)
			return (bridge.Features || []).indexOf(feature) !== -1;

		if (feature === 'power')
			return typeof navigator !== 'undefined' && (typeof navigator.getBattery === 'function' || !!navigator.wakeLock);

		return ['window', 'dialogs', 'external'].indexOf(feature) !== -1 || (feature === 'taskbar' && typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function');
	},

	/*
	 * A call of the bridge, or the fallback of the web (or an error where the web has none). A bridge with Can(name)
	 * leaves to the web the calls it does not answer (a mobile program picks a file in its web view).
	 */
	Ask: function (name, args, callback, web) {
		var bridge = this.Bridge();

		callback = callback || function () {};

		if (bridge && (typeof bridge.Can !== 'function' || bridge.Can(name) || !web)) {
			bridge.Call(name, args, callback);

			return;
		}

		if (!web) {
			callback(new Error('Elemenx Native ' + name + ' needs a native program'));

			return;
		}

		web(callback);
	},

	/* The state of the window of the web. */
	State: function () {
		return {Maximized: false, Minimized: false, Fullscreen: !!document.fullscreenElement, Focused: document.hasFocus()};
	},

	Window: function (action, callback) {
		var self = this;

		this.Ask('window', {Action: action}, callback, function (done) {
			if (action === 'fullscreen') {
				if (document.fullscreenElement) document.exitFullscreen();
				else document.documentElement.requestFullscreen();
			}
			else if (action === 'focus') {
				window.focus();
			}
			else if (action === 'close') {
				window.close();
			}
			else {
				done(new Error('Elemenx Native window ' + action + ' needs a native program'));

				return;
			}

			done(null, self.State());
		});
	},

	Title: function (text, callback) {
		document.title = String(text == null ? '' : text);

		this.Ask('title', {Text: document.title}, callback, function (done) {
			done(null, null);
		});
	},

	Open: function (options, callback) {
		var self = this;

		options = options || {};

		this.Ask('open', {Accept: options.Accept, Multiple: !!options.Multiple, Read: options.Read || 'text', Title: options.Title}, callback, function (done) {
			var input = document.createElement('input');

			input.type = 'file';
			input.multiple = !!options.Multiple;
			input.accept = (options.Accept || []).join(',');
			input.hidden = true;
			input.className = 'elemenx-native-picker';

			input.addEventListener('change', function () {
				var files = Array.prototype.slice.call(input.files || []);

				input.remove();

				self.Read(files, options.Read || 'text', done);
			});

			input.addEventListener('cancel', function () {
				input.remove();

				done(null, []);
			});

			document.body.appendChild(input);

			input.click();
		});
	},

	/* The files of a picker of the web as the bridge gives them: {Name, Path, Size, Text or Data}. */
	Read: function (files, read, callback) {
		var result = [];
		var left = files.length;
		var failed = false;

		if (!left) {
			callback(null, result);

			return;
		}

		files.forEach(function (file, index) {
			var reader = new FileReader();

			result[index] = {Name: file.name, Path: null, Size: file.size};

			if (read === 'none') {
				left--;

				if (!left)
					callback(null, result);

				return;
			}

			reader.onload = function () {
				if (read === 'data') result[index].Data = String(reader.result).replace(/^[^,]*,/, '');
				else result[index].Text = reader.result;

				left--;

				if (!left && !failed)
					callback(null, result);
			};

			reader.onerror = function () {
				if (failed) return;

				failed = true;

				callback(reader.error || new Error('Elemenx Native could not read ' + file.name));
			};

			if (read === 'data') reader.readAsDataURL(file);
			else reader.readAsText(file);
		});
	},

	Save: function (options, callback) {
		options = options || {};

		this.Ask('save', {Name: options.Name, Text: options.Text, Data: options.Data, Accept: options.Accept, Title: options.Title}, callback, function (done) {
			var bytes;
			var blob;
			var link = document.createElement('a');
			var i = 0;

			if (options.Data !== undefined) {
				bytes = atob(String(options.Data));
				blob = new Uint8Array(bytes.length);

				while (i < bytes.length) {
					blob[i] = bytes.charCodeAt(i);

					i++;
				}

				blob = new Blob([blob]);
			}
			else {
				blob = new Blob([String(options.Text || '')], {type: 'text/plain'});
			}

			link.href = URL.createObjectURL(blob);
			link.download = options.Name || 'file';
			link.hidden = true;

			document.body.appendChild(link);

			link.click();
			link.remove();

			setTimeout(function () {
				URL.revokeObjectURL(link.href);
			}, 0);

			done(null, {Path: null});
		});
	},

	Message: function (options, callback) {
		options = options || {};

		this.Ask('message', {Title: options.Title, Text: options.Text, Buttons: options.Buttons, Kind: options.Kind}, callback, function (done) {
			var text = (options.Title ? options.Title + '\n\n' : '') + String(options.Text || '');

			if ((options.Buttons || []).length > 1) {
				done(null, window.confirm(text) ? 0 : 1);

				return;
			}

			window.alert(text);

			done(null, 0);
		});
	},

	Menu: function (items, callback) {
		this.Ask('menu', {Items: items || null}, callback);
	},

	ContextMenu: function (items, callback) {
		this.Ask('context-menu', {Items: items || []}, callback);
	},

	/*
	 * The icon of the program in the tray. With Window ({Component, Props, Element, Width, Height}) a press on it opens a
	 * small window of the Application by the icon instead (its menu then opens with a press of the right button): made
	 * here at once, hidden, and shown by the program.
	 */
	Tray: function (options, callback) {
		var self = this;
		var view = options && options.Window;
		var width = Math.round(Number(view && view.Width) || 320);
		var height = Math.round(Number(view && view.Height) || 420);
		var args;
		var entry;

		options = options || {};
		callback = callback || function () {};

		this.Untray();

		args = {Icon: options.Icon, Tooltip: options.Tooltip, Items: options.Items};

		if (view && options.Icon && this.Bridge()) {
			entry = this.Spawn('elemenx-tray', view, width, height);

			if (!entry) {
				callback(new Error('Elemenx Native could not open the window of the tray'));

				return;
			}

			this.TrayEntry = entry;

			entry.Window.addEventListener('pagehide', function () {
				if (self.TrayEntry !== entry) return;

				self.TrayEntry = null;

				entry.Release();
			});

			document.dispatchEvent(new CustomEvent('elemenx-window', {detail: {ID: 'tray', Window: entry.Window}}));

			args.Window = {Width: width, Height: height};
		}

		this.Ask('tray', args, callback);
	},

	/* The window of the tray goes with its icon. */
	Untray: function () {
		var entry = this.TrayEntry;
		if (!entry) return;

		this.TrayEntry = null;

		entry.Release();

		if (!entry.Window.closed)
			entry.Window.close();
	},

	/* Shows the window of the tray by its icon (true) or hides it (false). */
	TrayWindow: function (show, callback) {
		this.Ask('traywindow', {Show: show !== false}, callback);
	},

	External: function (url, callback) {
		if (!/^(https?|mailto):/i.test(String(url))) {
			(callback || function () {})(new Error('Elemenx Native opens only http, https and mailto links: ' + url));

			return;
		}

		this.Ask('external', {URL: String(url)}, callback, function (done) {
			window.open(String(url), '_blank', 'noopener');

			done(null, null);
		});
	},

	/* The picture of a count over the icon of the program (Windows): a red disc with the number, as a data URL. */
	BadgeImage: function (count) {
		var canvas;
		var context;
		var text = count > 99 ? '99+' : String(count);

		if (!count || typeof document === 'undefined') return null;

		canvas = document.createElement('canvas');
		canvas.width = 32;
		canvas.height = 32;
		context = canvas.getContext('2d');

		if (!context) return null;

		context.fillStyle = '#d93025';

		context.beginPath();
		context.arc(16, 16, 16, 0, Math.PI * 2);
		context.fill();

		context.fillStyle = '#ffffff';
		context.font = 'bold ' + (text.length > 2 ? 13 : text.length > 1 ? 17 : 20) + 'px sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';

		context.fillText(text, 16, 17);

		return canvas.toDataURL('image/png');
	},

	Badge: function (count, callback) {
		this.Ask('badge', {Count: Number(count) || 0, Image: this.Bridge() ? this.BadgeImage(Number(count) || 0) : null}, callback, typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function' ? function (done) {
			(Number(count) ? navigator.setAppBadge(Number(count)) : navigator.clearAppBadge()).then(function () {
				done(null, null);
			}, done);
		} : null);
	},

	Progress: function (value, callback) {
		var options = value !== null && typeof value === 'object' ? value : {Value: value};
		var part = options.Value === null || options.Value === undefined ? null : Math.max(0, Math.min(1, Number(options.Value)));

		this.Ask('progress', {Value: part, State: options.State || 'normal'}, callback);
	},

	/* The window asks for attention; on the web the title of the page blinks while the page is hidden, and stops when it is seen. */
	Attention: function (on, callback) {
		var self = this;

		this.Ask('attention', {On: !!on}, callback, function (done) {
			self.Blink(!!on);

			done(null, null);
		});
	},

	Blink: function (on) {
		var self = this;

		if (this.Blinking) {
			window.clearInterval(this.Blinking.Timer);

			document.removeEventListener('visibilitychange', this.Blinking.Seen);

			document.title = this.Blinking.Title;
			this.Blinking = null;
		}

		if (!on || document.visibilityState === 'visible') return;

		this.Blinking = {Title: document.title, Timer: 0, Seen: function () {
			if (document.visibilityState === 'visible')
				self.Blink(false);
		}};

		this.Blinking.Timer = window.setInterval(function () {
			document.title = document.title === self.Blinking.Title ? '\u2022 ' + self.Blinking.Title : self.Blinking.Title;
		}, 1000);

		document.addEventListener('visibilitychange', this.Blinking.Seen);
	},

	Thumbar: function (buttons, callback) {
		this.Ask('thumbar', {Buttons: (buttons || []).map(function (button) {
			return {ID: button.ID, Icon: button.Icon, Tooltip: button.Tooltip || '', Disabled: !!button.Disabled};
		})}, callback);
	},

	Tasks: function (callback) {
		this.Ask('tasks', {}, callback);
	},

	Shortcuts: function (keys, callback) {
		this.Ask('shortcuts', {Keys: (keys || []).map(String)}, callback);
	},

	Autostart: function (enabled, callback) {
		if (typeof enabled === 'function') {
			callback = enabled;
			enabled = null;
		}

		this.Ask('autostart', {Enabled: typeof enabled === 'boolean' ? enabled : null}, callback);
	},

	Links: function (callback) {
		this.Ask('links', {}, callback);
	},

	Power: function (callback) {
		this.Ask('power', {}, callback, typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function' ? function (done) {
			navigator.getBattery().then(function (battery) {
				done(null, {OnBattery: !battery.charging, Idle: null, State: document.visibilityState === 'visible' ? 'active' : 'unknown'});
			}, done);
		} : null);
	},

	Awake: function (on, callback) {
		var self = this;

		this.Ask('awake', {On: !!on}, callback, typeof navigator !== 'undefined' && navigator.wakeLock ? function (done) {
			if (!on) {
				if (self.WakeLock)
					self.WakeLock.release();

				self.WakeLock = null;

				done(null, {Awake: false});

				return;
			}

			if (self.WakeLock) {
				done(null, {Awake: true});

				return;
			}

			navigator.wakeLock.request('screen').then(function (sentinel) {
				self.WakeLock = sentinel;

				sentinel.addEventListener('release', function () {
					if (self.WakeLock === sentinel)
						self.WakeLock = null;
				});

				done(null, {Awake: true});
			}, done);
		} : null);
	},

	Update: function (callback) {
		this.Ask('update', {}, callback);
	},

	/*
	 * One more window of the Application (see OpenWindow above): window.open of an empty page of the same origin, the
	 * look of the page copied into it and kept in step, and the Component made by the Application put in its body.
	 */
	OpenWindow: function (options, callback) {
		var self = this;
		var id = String(options && options.ID || '');
		var open = this.Opened[id];
		var width = Math.round(Number(options && options.Width) || 640);
		var height = Math.round(Number(options && options.Height) || 480);
		var child;
		var entry;

		options = options || {};
		callback = callback || function () {};

		if (!/^[\w-]+$/.test(id)) {
			callback(new Error('Elemenx Native OpenWindow needs an ID of letters, digits, _ and -'));

			return;
		}

		if (open && !open.Window.closed) {
			open.Window.focus();

			callback(null, {ID: id, Window: open.Window});

			return;
		}

		entry = this.Spawn('elemenx-window-' + id, options, width, height);

		if (!entry) {
			callback(new Error('Elemenx Native could not open the window ' + id + ' (a browser opens one only after a press or a key)'));

			return;
		}

		entry.ID = id;
		child = entry.Window;

		/* The window closed: its Component goes, the look stops following the page. */
		entry.Close = function () {
			if (self.Opened[id] !== entry) return;

			delete self.Opened[id];

			entry.Release();

			self.Emit('closed', {ID: id});
		};

		child.addEventListener('pagehide', entry.Close);

		this.Opened[id] = entry;

		/* The page hears of the window (the Hotkeys of the Library take its keys too). */
		document.dispatchEvent(new CustomEvent('elemenx-window', {detail: {ID: id, Window: child}}));

		callback(null, {ID: id, Window: child});
	},

	/*
	 * A window of the Application named name (window.open of an empty page of the same origin): the look of the page in
	 * it, options.Element or the options.Component of the Application (with options.Props) in its body, the links of the
	 * Application routing the page. {Window, Instance, Release (takes the Component away)}, or null when it did not open.
	 */
	Spawn: function (name, options, width, height) {
		var self = this;
		var child = window.open('', name, 'popup=yes,width=' + width + ',height=' + height);
		var entry;

		if (!child)
			return null;

		entry = {Window: child, Instance: null, Stop: this.Mirror(child)};

		child.document.title = String(options.Title || document.title);
		child.document.body.className = 'elemenx-native-window';

		if (options.Element) {
			child.document.body.appendChild(options.Element);
		}
		else if (options.Component) {
			entry.Instance = Elemenx.Component(String(options.Component))(options.Props || {}, null, {Application: this.$Application()});

			child.document.body.appendChild(entry.Instance.$Element());
		}

		/* The links of the Application route the one page; other links open as they would. */
		entry.Link = function (event) {
			var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
			var application = self.$Application();
			var router = application && application.$Router ? application.$Router() : null;
			var href = link ? link.getAttribute('href') : '';

			if (!link || !router || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

			if (link.target || link.hasAttribute('download') || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(href)) return;

			event.preventDefault();

			router.Go(href);
		};

		entry.Release = function () {
			entry.Stop();

			if (entry.Instance)
				entry.Instance.$Destroy();

			entry.Instance = null;
		};

		child.document.addEventListener('click', entry.Link);

		return entry;
	},

	/* The styles of the page and the attributes of its root (the theme, the language, the direction) in another window, kept in step; the function that stops it. */
	Mirror: function (child) {
		var copy = function () {
			Array.prototype.forEach.call(document.documentElement.attributes, function (attribute) {
				child.document.documentElement.setAttribute(attribute.name, attribute.value);
			});
		};
		var style = function (node) {
			if (node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && /stylesheet/i.test(node.rel)))
				child.document.head.appendChild(node.cloneNode(true));
		};
		var watch = new MutationObserver(function (records) {
			records.forEach(function (record) {
				if (record.type === 'attributes') copy();
				else Array.prototype.forEach.call(record.addedNodes, style);
			});
		});

		Array.prototype.forEach.call(document.head.childNodes, style);

		copy();

		watch.observe(document.head, {childList: true});
		watch.observe(document.documentElement, {attributes: true});

		return function () {
			watch.disconnect();
		};
	},

	Windows: function () {
		var opened = this.Opened;

		return Object.keys(opened).filter(function (id) {
			return !opened[id].Window.closed;
		});
	},

	FocusWindow: function (id) {
		var entry = this.Opened[String(id)];
		if (!entry || entry.Window.closed) return false;

		entry.Window.focus();

		return true;
	},

	CloseWindow: function (id) {
		var entry = this.Opened[String(id)];
		if (!entry)
			return false;

		entry.Close();

		if (!entry.Window.closed)
			entry.Window.close();

		return true;
	},

	On: function (name, callback) {
		var self = this;
		var bridge = this.Bridge();

		(this.Listeners[name] = this.Listeners[name] || []).push(callback);

		if (this.Detach[name]) return;

		if (bridge && typeof bridge.On === 'function') {
			this.Detach[name] = bridge.On(name, function (value) {
				self.Emit(name, value);
			});
		}
		else if (name === 'window') {
			document.addEventListener('fullscreenchange', this.WebState);
			window.addEventListener('focus', this.WebState);
			window.addEventListener('blur', this.WebState);

			this.Detach[name] = function () {
				document.removeEventListener('fullscreenchange', self.WebState);
				window.removeEventListener('focus', self.WebState);
				window.removeEventListener('blur', self.WebState);
			};
		}
		else if (name === 'power' && typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
			this.Detach[name] = true;

			navigator.getBattery().then(function (battery) {
				var changed = function () {
					self.Emit('power', {State: battery.charging ? 'on-ac' : 'on-battery'});
				};

				if (self.Detach[name] !== true) return;

				battery.addEventListener('chargingchange', changed);

				self.Detach[name] = function () {
					battery.removeEventListener('chargingchange', changed);
				};
			});
		}
	},

	Off: function (name, callback) {
		this.Listeners[name] = (this.Listeners[name] || []).filter(function (item) {
			return item !== callback;
		});

		if (!this.Listeners[name].length && this.Detach[name]) {
			if (typeof this.Detach[name] === 'function')
				this.Detach[name]();

			this.Detach[name] = null;
		}
	},

	Emit: function (name, value) {
		(this.Listeners[name] || []).slice().forEach(function (callback) {
			callback(value);
		});
	}
});
