/*
 * Web Push: the server of the Application sends messages that reach the user even while the page is closed (a
 * Service Worker shows them as notifications). HTTPS or localhost. Every method takes callback(error, result);
 * error.name is the name of the browser error ('NotAllowedError' when the user refuses, 'NotSupportedError' where
 * the browser has no push).
 * - Supported(): whether the browser has Web Push. Permission(): 'granted', 'denied' or 'default'.
 * - Subscribe({Key, Worker}, callback): asks the user, then subscribes; the result {Endpoint, Keys: {P256dh, Auth},
 *   ExpirationTime, JSON} goes to the server, which sends to it (with the private key of the pair of Key: a VAPID
 *   public key in base64url). Worker is the URL of the Service Worker that receives the messages, registered when the
 *   page has none of its own (docs/LIBRARIES.md has one to copy: it shows {Title, Text, Icon, URL, Tag} as a
 *   notification, a press opens URL, and it tells the open pages).
 * - Subscription(callback): the subscription of this browser, or null. Unsubscribe(callback): true when it went.
 * - Notify(title, {Text, Icon, Tag, URL}, callback): a notification from the page itself (no server).
 * - On('message', callback) / Off('message', callback): the messages the worker passes to the open pages
 *   ({Type: 'push' or 'click', Data}).
 */
Elemenx.Service('Push', {
	$Meta: {
		Description: 'Web Push: the server of the Application sends messages that reach the user even while the page is closed (a Service Worker shows them as notifications).',
		Methods: ['Supported()', 'Permission()', 'Subscribe(options, callback)', 'Subscription(callback)', 'Unsubscribe(callback)', 'Notify(title, options, callback)', 'On(name, callback)', 'Off(name, callback)']
	},
	$OnCreate: function () {
		var self = this;

		this.Listeners = [];

		this.Received = function (event) {
			if (!event.data || event.data.Elemenx !== 'push') return;

			self.Listeners.slice().forEach(function (callback) {
				callback({Type: event.data.Type, Data: event.data.Data});
			});
		};

		if (this.Supported())
			navigator.serviceWorker.addEventListener('message', this.Received);
	},

	$OnDestroy: function () {
		if (this.Supported())
			navigator.serviceWorker.removeEventListener('message', this.Received);
	},

	Supported: function () {
		return typeof window !== 'undefined' && 'PushManager' in window && typeof navigator !== 'undefined' && !!navigator.serviceWorker && typeof Notification !== 'undefined';
	},

	Permission: function () {
		return typeof Notification === 'undefined' ? 'denied' : Notification.permission;
	},

	/* An error with the name of a browser error. */
	Fail: function (name, message) {
		var error = new Error(message);

		error.name = name;

		return error;
	},

	/* A VAPID key in base64url as the bytes the browser wants. */
	Bytes: function (text) {
		var base64 = String(text || '').replace(/-/g, '+').replace(/_/g, '/');
		var raw = window.atob(base64 + '===='.slice(0, (4 - base64.length % 4) % 4));
		var bytes = new Uint8Array(raw.length);
		var i = 0;

		while (i < raw.length) {
			bytes[i] = raw.charCodeAt(i);

			i++;
		}

		return bytes;
	},

	/* The registration of the worker: the page's own, or Worker registered now. */
	Registration: function (worker, callback) {
		var self = this;

		navigator.serviceWorker.getRegistration().then(function (registration) {
			if (registration)
				return registration;

			if (!worker)
				throw self.Fail('NotSupportedError', 'Elemenx Push: the page has no Service Worker; give Worker, the URL of one');

			return navigator.serviceWorker.register(worker).then(function (made) {
				return navigator.serviceWorker.ready.then(function () {
					return made;
				});
			});
		}).then(function (registration) {
			callback(null, registration);
		}, callback);
	},

	/* A subscription as plain data for the server. */
	Plain: function (subscription) {
		var json = subscription.toJSON ? subscription.toJSON() : {};

		return {Endpoint: subscription.endpoint, Keys: {P256dh: json.keys && json.keys.p256dh || '', Auth: json.keys && json.keys.auth || ''}, ExpirationTime: subscription.expirationTime == null ? null : subscription.expirationTime, JSON: json};
	},

	Subscribe: function (options, callback) {
		var self = this;

		options = options || {};

		if (!this.Supported()) {
			callback(this.Fail('NotSupportedError', 'Elemenx Push: this browser has no Web Push'));

			return;
		}

		if (!options.Key) {
			callback(this.Fail('TypeError', 'Elemenx Push.Subscribe needs Key (the VAPID public key of the server)'));

			return;
		}

		Notification.requestPermission().then(function (permission) {
			if (permission !== 'granted') {
				callback(self.Fail('NotAllowedError', 'Elemenx Push: the user did not allow notifications'));

				return;
			}

			self.Registration(options.Worker, function (error, registration) {
				if (error) {
					callback(error);

					return;
				}

				registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: self.Bytes(options.Key)}).then(function (subscription) {
					callback(null, self.Plain(subscription));
				}, callback);
			});
		}, callback);
	},

	Subscription: function (callback) {
		var self = this;

		if (!this.Supported()) {
			callback(null, null);

			return;
		}

		navigator.serviceWorker.getRegistration().then(function (registration) {
			return registration ? registration.pushManager.getSubscription() : null;
		}).then(function (subscription) {
			callback(null, subscription ? self.Plain(subscription) : null);
		}, callback);
	},

	Unsubscribe: function (callback) {
		if (!this.Supported()) {
			callback(null, false);

			return;
		}

		navigator.serviceWorker.getRegistration().then(function (registration) {
			return registration ? registration.pushManager.getSubscription() : null;
		}).then(function (subscription) {
			return subscription ? subscription.unsubscribe() : false;
		}).then(function (gone) {
			callback(null, !!gone);
		}, callback);
	},

	Notify: function (title, options, callback) {
		var self = this;
		var settings;

		options = options || {};
		callback = callback || function () {};

		if (typeof Notification === 'undefined') {
			callback(this.Fail('NotSupportedError', 'Elemenx Push: this browser has no notifications'));

			return;
		}

		settings = {body: options.Text || '', icon: options.Icon || undefined, tag: options.Tag || undefined, data: {URL: options.URL || null}};

		Notification.requestPermission().then(function (permission) {
			if (permission !== 'granted') {
				callback(self.Fail('NotAllowedError', 'Elemenx Push: the user did not allow notifications'));

				return;
			}

			if (navigator.serviceWorker && navigator.serviceWorker.controller) {
				navigator.serviceWorker.ready.then(function (registration) {
					return registration.showNotification(String(title || ''), settings);
				}).then(function () {
					callback(null, true);
				}, callback);

				return;
			}

			new Notification(String(title || ''), settings);

			callback(null, true);
		}, callback);
	},

	On: function (name, callback) {
		if (name === 'message')
			this.Listeners.push(callback);
	},

	Off: function (name, callback) {
		this.Listeners = this.Listeners.filter(function (item) {
			return item !== callback;
		});
	}
});
