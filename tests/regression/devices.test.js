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

	vm.runInNewContext(fs.readFileSync(path.join(import.meta.dirname, '../../libraries/ElemenxUI/services/' + name + '.js'), 'utf8'), context);

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

describe('ElemenxUI Serial Service', function () {
	it('asks for a port by its filters, reads text and lines, writes, and closes', async function () {
		var chunks = [new TextEncoder().encode('hello\nwor'), new TextEncoder().encode('ld\n')];
		var written = [];
		var asked;
		var port = {
			getInfo: function () {
				return {usbVendorId: 9025, usbProductId: 67};
			},
			open: function (options) {
				port.Options = options;
				port.readable = {getReader: function () {
					return {
						read: function () {
							return Promise.resolve(chunks.length ? {done: false, value: chunks.shift()} : {done: true});
						},
						releaseLock: function () {},
						cancel: function () {
							return Promise.resolve();
						}
					};
				}};
				port.writable = {getWriter: function () {
					return {
						write: function (bytes) {
							written.push(new TextDecoder().decode(bytes));

							return Promise.resolve();
						},
						releaseLock: function () {}
					};
				}};

				return Promise.resolve();
			},
			close: function () {
				port.Closed = true;

				return Promise.resolve();
			}
		};
		var serial = Object.assign(target(), {
			requestPort: function (options) {
				asked = options;

				return Promise.resolve(port);
			},
			getPorts: function () {
				return Promise.resolve([port]);
			}
		});
		var service = load('Serial', {navigator: {serial: serial}});
		var result = await call(service.Request.bind(service), {Filters: [{VendorID: 9025}]});
		var handle = result[1];
		var lines = [];
		var data = [];
		var ports;

		expect(asked).toEqual({filters: [{usbVendorId: 9025}]});
		expect(handle.Info).toEqual({VendorID: 9025, ProductID: 67});

		handle.On('line', function (line) {
			lines.push(line);
		});
		handle.On('data', function (text) {
			data.push(text);
		});

		expect((await call(handle.Open, {BaudRate: 115200}))[0]).toBe(null);
		expect(port.Options).toEqual({baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none'});

		await new Promise(function (resolve) {
			setTimeout(resolve, 10);
		});

		expect(data).toEqual(['hello\nwor', 'ld\n']);
		expect(lines).toEqual(['hello', 'world']);
		expect(await call(handle.Write, 'ping\n')).toEqual([null, 5]);
		expect(written).toEqual(['ping\n']);

		ports = await call(service.Ports.bind(service));

		expect(ports[1][0]).toBe(handle);
		expect(await call(handle.Close)).toEqual([null, true]);
		expect(port.Closed).toBe(true);
		expect((await call(handle.Write, 'x'))[0].message).toBe('Elemenx Serial: the port is not open');
	});

	it('calls back NotSupportedError without Web Serial, and reports the ports that come and go', async function () {
		var serial = Object.assign(target(), {});
		var heard = [];
		var service = load('Serial', {navigator: {serial: serial}});
		var plain = load('Serial', {navigator: {}});

		service.On('connect', function (event) {
			heard.push(event.Port.Info);
		});

		serial.Fire('connect', {target: {getInfo: function () {
			return {usbVendorId: 1};
		}}, type: 'connect'});

		expect(heard).toEqual([{VendorID: 1, ProductID: null}]);
		expect(plain.Supported()).toBe(false);
		expect((await call(plain.Request.bind(plain), {}))[0].name).toBe('NotSupportedError');
		expect(await call(plain.Ports.bind(plain))).toEqual([null, []]);
	});
});

describe('ElemenxUI USB Service', function () {
	it('asks for a device, opens and claims it, and transfers data in, out and by control', async function () {
		var steps = [];
		var device = {
			vendorId: 4660,
			productId: 22136,
			productName: 'Board',
			manufacturerName: 'Maker',
			serialNumber: 'S1',
			configuration: null,
			open: function () {
				steps.push('open');

				return Promise.resolve();
			},
			selectConfiguration: function (value) {
				steps.push('configuration ' + value);

				return Promise.resolve();
			},
			claimInterface: function (value) {
				steps.push('claim ' + value);

				return Promise.resolve();
			},
			releaseInterface: function (value) {
				steps.push('release ' + value);

				return Promise.resolve();
			},
			close: function () {
				steps.push('close');

				return Promise.resolve();
			},
			transferIn: function (endpoint, length) {
				return Promise.resolve({data: new DataView(new Uint8Array([endpoint, length]).buffer)});
			},
			transferOut: function (endpoint, bytes) {
				return Promise.resolve({bytesWritten: bytes.length});
			},
			controlTransferIn: function (setup, length) {
				steps.push('control in ' + setup.request + ' ' + length);

				return Promise.resolve({data: new DataView(new Uint8Array([7]).buffer)});
			},
			controlTransferOut: function (setup, bytes) {
				steps.push('control out ' + setup.requestType + ' ' + bytes.length);

				return Promise.resolve({bytesWritten: bytes.length});
			}
		};
		var usb = Object.assign(target(), {
			requestDevice: function (options) {
				steps.push(JSON.stringify(options));

				return Promise.resolve(device);
			}
		});
		var service = load('USB', {navigator: {usb: usb}});
		var handle = (await call(service.Request.bind(service), {Filters: [{VendorID: 4660, ClassCode: 255}]}))[1];

		expect(handle.Info).toEqual({VendorID: 4660, ProductID: 22136, Name: 'Board', Manufacturer: 'Maker', Serial: 'S1'});
		expect(await call(handle.Open, {Interface: 2})).toEqual([null, handle]);
		expect(Array.from((await call(handle.TransferIn, 1, 16))[1])).toEqual([1, 16]);
		expect(await call(handle.TransferOut, 2, 'abc')).toEqual([null, 3]);
		expect(Array.from((await call(handle.Control, {Request: 9}, 4))[1])).toEqual([7]);
		expect(await call(handle.Control, {Type: 'class', Request: 1}, 'hi')).toEqual([null, 2]);
		expect(await call(handle.Close)).toEqual([null, true]);
		expect(steps).toEqual(['{"filters":[{"vendorId":4660,"classCode":255}]}', 'open', 'configuration 1', 'claim 2', 'control in 9 4', 'control out class 2', 'release 2', 'close']);
	});
});

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
