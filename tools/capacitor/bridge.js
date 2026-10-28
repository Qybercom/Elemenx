/*
 * The bridge of an Elemenx program made with Capacitor (elemenx build --native mobile) between its page and the
 * device: window.ElemenxNative, as the preload of a desktop program gives it, for the Platform Service of ElemenxUI.
 * It answers with the plugins the project installed: external (@capacitor/browser, or the browser of the system),
 * message (@capacitor/dialog), title, links (@capacitor/app: the link that opened the program, the link event for
 * the next ones), power (@capacitor/app: the power event, suspend and resume, as the program goes to the back
 * and comes back) and save (@capacitor/filesystem: the file in the Documents of the device). What it has no handler
 * for (Can), the Service does as on the web: open is the file picker of the web view.
 */
(function () {
	var capacitor = window.Capacitor;
	var plugins;
	var features = ['external', 'window'];
	var listeners = {};
	var launched = [];

	if (!capacitor || window.ElemenxNative) return;

	plugins = capacitor.Plugins || {};

	if (plugins.Dialog)
		features.push('dialogs');

	if (plugins.App)
		features.push('links', 'power');

	if (plugins.Filesystem)
		features.push('files');

	/* The screen of the system goes once the page shows (its own splash, or the Application): @capacitor/splash-screen. */
	if (plugins.SplashScreen && typeof plugins.SplashScreen.hide === 'function')
		plugins.SplashScreen.hide({fadeOutDuration: 0}).catch(function () {});

	function emit (name, value) {
		(listeners[name] || []).slice().forEach(function (callback) {
			callback(value);
		});
	}

	if (plugins.App) {
		plugins.App.addListener('appUrlOpen', function (event) {
			launched.push(event.url);

			emit('link', {URL: event.url});
		});

		plugins.App.addListener('pause', function () {
			emit('power', {State: 'suspend'});
		});

		plugins.App.addListener('resume', function () {
			emit('power', {State: 'resume'});
		});

		if (typeof plugins.App.getLaunchUrl === 'function') {
			plugins.App.getLaunchUrl().then(function (result) {
				if (result && result.url)
					launched.push(result.url);
			}, function () {});
		}
	}

	var handlers = {
		external: function (args) {
			if (!/^(https?|mailto):/i.test(String(args.URL)))
				return Promise.reject(new Error('Elemenx Native opens only http, https and mailto links: ' + args.URL));

			if (plugins.Browser)
				return plugins.Browser.open({url: String(args.URL)}).then(function () {
					return null;
				});

			window.open(String(args.URL), '_system');

			return Promise.resolve(null);
		},
		window: function () {
			return Promise.resolve({Maximized: true, Minimized: false, Fullscreen: true, Focused: document.hasFocus()});
		},
		title: function (args) {
			document.title = String(args.Text || '');

			return Promise.resolve(null);
		},
		message: function (args) {
			var buttons = args.Buttons || ['OK'];

			if (buttons.length > 1) {
				return plugins.Dialog.confirm({title: args.Title || '', message: String(args.Text || ''), okButtonTitle: buttons[0], cancelButtonTitle: buttons[1]}).then(function (result) {
					return result.value ? 0 : 1;
				});
			}

			return plugins.Dialog.alert({title: args.Title || '', message: String(args.Text || ''), buttonTitle: buttons[0]}).then(function () {
				return 0;
			});
		},
		/* A file of the Application in the Documents of the device (a name of its own, folders made): {Path} its URI. */
		save: function (args) {
			var name = String(args.Name || 'file').replace(/[\\:*?"<>|]+/g, '-').replace(/^\/+/, '');
			var options = {path: name, directory: 'DOCUMENTS', recursive: true};

			if (args.Data !== undefined) {
				options.data = String(args.Data);
			}
			else {
				options.data = String(args.Text || '');
				options.encoding = 'utf8';
			}

			return plugins.Filesystem.writeFile(options).then(function (result) {
				return {Path: result && result.uri || name};
			});
		},
		links: function () {
			return Promise.resolve(launched.splice(0, launched.length));
		},
		power: function () {
			return Promise.resolve({OnBattery: null, Idle: null, State: document.visibilityState === 'visible' ? 'active' : 'idle'});
		}
	};
	var groups = {external: 'external', window: 'window', title: 'window', message: 'dialogs', save: 'files', links: 'links', power: 'power'};
	var plugin = {dialogs: '@capacitor/dialog', files: '@capacitor/filesystem', links: '@capacitor/app', power: '@capacitor/app'};

	window.ElemenxNative = {
		Platform: 'capacitor',
		System: capacitor.getPlatform ? capacitor.getPlatform() : 'mobile',
		Features: features,
		/* Whether the bridge answers a call; the Service does the others as on the web. */
		Can: function (name) {
			return Object.prototype.hasOwnProperty.call(handlers, name);
		},
		Call: function (name, args, callback) {
			var done = callback || function () {};

			if (!handlers[name] || features.indexOf(groups[name]) === -1) {
				done(new Error('Elemenx Native feature is off: ' + name + ' (install ' + (plugin[groups[name]] || 'its Capacitor plugin') + ')'));

				return;
			}

			handlers[name](args || {}).then(function (result) {
				done(null, result === undefined ? null : result);
			}, function (error) {
				done(error instanceof Error ? error : new Error(String(error && error.message || error)));
			});
		},
		On: function (name, callback) {
			(listeners[name] = listeners[name] || []).push(callback);

			return function () {
				listeners[name] = (listeners[name] || []).filter(function (item) {
					return item !== callback;
				});
			};
		}
	};
})();
