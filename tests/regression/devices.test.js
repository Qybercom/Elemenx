import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

/* A Service of the Library run against a fake browser: {Service, Window}. */
function load (name, browser) {
	var definition;
	var window = Object.assign({atob: atob}, browser.window || {});
	var context = Object.assign({
		Elemenx: {
			Service: function (key, value) {
				definition = value;
			}
		},
		window: window,
		navigator: browser.navigator || {},
		Notification: browser.Notification,
		Promise: Promise,
		Uint8Array: Uint8Array,
		TextEncoder: TextEncoder,
		TextDecoder: TextDecoder,
		AbortController: AbortController,
		Array: Array,
		Number: Number,
		String: String,
		Error: Error
	}, browser.globals || {});
	var service;

	vm.runInNewContext(fs.readFileSync(path.join(import.meta.dirname, '../../libraries/ElemenxUI/services/' + name + '/' + name + '.js'), 'utf8'), context);

	service = Object.assign({}, definition);

	service.$OnCreate();

	return service;
}

/* An event target of the fake browser. */
function target () {
	var listeners = {};

	return {
		addEventListener: function (name, callback) {
			(listeners[name] = listeners[name] || []).push(callback);
		},
		removeEventListener: function () {},
		Fire: function (name, event) {
			(listeners[name] || []).forEach(function (callback) {
				callback(event);
			});
		}
	};
}

/* Calls a method that takes callback(error, result) and resolves to [error, result]. */
function call (method) {
	var args = Array.prototype.slice.call(arguments, 1);

	return new Promise(function (resolve) {
		method.apply(null, args.concat([function (error, result) {
			resolve([error || null, result]);
		}]));
	});
}

describe('ElemenxUI NFC Service', function () {
	it('reads the records of the tags until it stops, and writes texts, links and records', async function () {
		var readers = [];
		var NDEFReader = function () {
			var self = this;

			readers.push(this);

			this.scan = function (options) {
				self.Signal = options.signal;

				return Promise.resolve();
			};
			this.write = function (message, options) {
				self.Written = [message, options];

				return Promise.resolve();
			};
		};
		var service = load('NFC', {window: {NDEFReader: NDEFReader}});
		var tags = [];

		service.Scan(function (error, tag) {
			tags.push(tag);
		});

		readers[0].onreading({serialNumber: '04:a2', message: {records: [
			{recordType: 'text', lang: 'en', data: new DataView(new TextEncoder().encode('hello').buffer)},
			{recordType: 'url', data: new DataView(new TextEncoder().encode('https://example.com/').buffer)}
		]}});

		expect(tags[0].Serial).toBe('04:a2');
		expect(tags[0].Records.map(function (record) {
			return [record.Type, record.Text || record.URL, record.Language];
		})).toEqual([['text', 'hello', 'en'], ['url', 'https://example.com/', null]]);

		service.Stop();

		expect(readers[0].Signal.aborted).toBe(true);

		await call(service.Write.bind(service), {URL: 'https://example.com/a'}, {Overwrite: false});

		expect(readers[1].Written).toEqual([{records: [{recordType: 'url', data: 'https://example.com/a'}]}, {overwrite: false}]);

		await call(service.Write.bind(service), 'plain');

		expect(readers[2].Written).toEqual(['plain', {overwrite: true}]);
		expect((await call(load('NFC', {}).Write.bind(load('NFC', {})), 'x'))[0].name).toBe('NotSupportedError');
	});
});

describe('ElemenxUI Push Service', function () {
	it('subscribes with the key of the server after the user allows it, and refuses without a key or a yes', async function () {
		var subscribed = [];
		var permission = 'granted';
		var subscription = {
			endpoint: 'https://push.example/1',
			expirationTime: null,
			toJSON: function () {
				return {endpoint: 'https://push.example/1', keys: {p256dh: 'P', auth: 'A'}};
			}
		};
		var registration = {pushManager: {
			subscribe: function (options) {
				subscribed.push(options);

				return Promise.resolve(subscription);
			},
			getSubscription: function () {
				return Promise.resolve(subscription);
			}
		}};
		var browser = {
			window: {PushManager: function () {}},
			navigator: {serviceWorker: Object.assign(target(), {
				getRegistration: function () {
					return Promise.resolve(registration);
				}
			})},
			Notification: {
				permission: 'default',
				requestPermission: function () {
					return Promise.resolve(permission);
				}
			}
		};
		var service = load('Push', browser);
		var result;

		browser.window.PushManager = function () {};
		service = load('Push', Object.assign(browser, {globals: {}}));

		result = await call(service.Subscribe.bind(service), {Key: 'AQID'});

		expect(result[0]).toBe(null);
		expect(result[1]).toEqual({Endpoint: 'https://push.example/1', Keys: {P256dh: 'P', Auth: 'A'}, ExpirationTime: null, JSON: {endpoint: 'https://push.example/1', keys: {p256dh: 'P', auth: 'A'}}});
		expect(subscribed[0].userVisibleOnly).toBe(true);
		expect(Array.from(subscribed[0].applicationServerKey)).toEqual([1, 2, 3]);
		expect((await call(service.Subscription.bind(service)))[1].Endpoint).toBe('https://push.example/1');
		expect((await call(service.Subscribe.bind(service), {}))[0].message).toBe('Elemenx Push.Subscribe needs Key (the VAPID public key of the server)');

		permission = 'denied';

		expect((await call(service.Subscribe.bind(service), {Key: 'AQID'}))[0].name).toBe('NotAllowedError');
	});
});
