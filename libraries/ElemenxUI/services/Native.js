/*
 * The native features of the system around the Application, one API wherever it runs. In a program of elemenx build
 * --native (desktop: Electron, mobile: Capacitor) it asks the system through the bridge of the program
 * (window.ElemenxNative); in a browser it does what the web can: a file picker, a download, confirm, a new tab, the
 * full screen. Every call takes callback(error, result); a feature the place lacks calls back an error.
 *
 * Available() is true in a native program, Platform() 'electron', 'capacitor' or 'web', Has(feature) tells whether a feature
 * works here (window, dialogs, menu, tray, external, taskbar, hotkeys, autostart, links, power, update).
 * - Window(action, callback): minimize, maximize, restore, toggle-maximize, fullscreen, focus, close; the result is
 *   the state {Maximized, Minimized, Fullscreen, Focused}. Title(text, callback): the title of the window.
 * - Open({Accept, Multiple, Read, Title}, callback): files chosen by the user, [{Name, Path, Size, Text or Data}]; Read
 *   'text' (by default), 'data' (base64) or 'none'; [] when the user cancels.
 * - Save({Name, Text or Data, Accept, Title}, callback): a file written where the user says, {Path} (null on the web,
 *   where it is a download), null when the user cancels.
 * - Message({Title, Text, Buttons, Kind}, callback): a message with buttons, the index of the one pressed.
 * - Menu(items, callback): the menu of the program ([{Label, Items: [{ID, Label, Hotkey, Disabled, Checked,
 *   Separator, Items, Role}]}]; null removes it); a click is the menu event {ID}. ContextMenu(items, callback): a menu
 *   at the pointer, the ID chosen or null.
 * - Tray({Icon, Tooltip, Items}, callback): an icon in the tray (Icon a path in the Application; null removes it); a
 *   click is the tray event {ID} (null for the icon itself).
 * - External(url, callback): opens an http, https or mailto link in the browser of the system.
 * - Badge(count, callback): a number on the icon of the program (0 removes it). Progress(value, callback): a progress
 *   from 0 to 1 on it (null removes it).
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
 * - On(name, callback) / Off(name, callback): the events menu, tray, window ({Maximized, Minimized, Fullscreen,
 *   Focused}), shortcut, link and power.
 */
Elemenx.Service('Native', {
	$Meta: {
		Description: 'The native features of the system around the Application, one API wherever it runs.',
		Methods: ['Available()', 'Platform()', 'Has(feature)', 'Window(action, callback)', 'Title(text, callback)', 'Open(options, callback)', 'Save(options, callback)', 'Message(options, callback)', 'Menu(items, callback)', 'ContextMenu(items, callback)', 'Tray(options, callback)', 'External(url, callback)', 'Badge(count, callback)', 'Progress(value, callback)', 'Shortcuts(keys, callback)', 'Autostart(enabled, callback)', 'Links(callback)', 'Power(callback)', 'Awake(on, callback)', 'Update(callback)', 'On(name, callback)', 'Off(name, callback)']
	},
	$OnCreate: function () {
		var self = this;

		this.Listeners = {};
		this.Detach = {};

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

	/* A call of the bridge, or the fallback of the web (or an error where the web has none). */
	Ask: function (name, args, callback, web) {
		var bridge = this.Bridge();

		callback = callback || function () {};

		if (bridge) {
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

	Tray: function (options, callback) {
		this.Ask('tray', options || {}, callback);
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

	Badge: function (count, callback) {
		this.Ask('badge', {Count: Number(count) || 0}, callback, typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function' ? function (done) {
			(Number(count) ? navigator.setAppBadge(Number(count)) : navigator.clearAppBadge()).then(function () {
				done(null, null);
			}, done);
		} : null);
	},

	Progress: function (value, callback) {
		this.Ask('progress', {Value: value === null || value === undefined ? null : Math.max(0, Math.min(1, Number(value)))}, callback);
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
