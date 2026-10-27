import { describe, expect, it } from 'vitest';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import net from 'net';
import crypto from 'crypto';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Server = require('../../tools/server.js');

function request (port, method, headers) {
	return new Promise(function (resolve, reject) {
		var req = http.request({host: '127.0.0.1', port: port, path: '/', method: method || 'GET', headers: headers || {}}, function (response) {
			var chunks = [];

			response.on('data', function (chunk) { chunks.push(chunk); });
			response.on('end', function () { resolve({Status: response.statusCode, Headers: response.headers, Body: Buffer.concat(chunks)}); });
		});

		req.on('error', reject);
		req.end();
	});
}

function withServer (options, callback) {
	return new Promise(function (resolve, reject) {
		var server = Server.Create(options);

		server.Listen(0, '127.0.0.1', function () {
			var port = server.Server.address().port;

			Promise.resolve(callback(port)).then(function (value) {
				server.Close(function () { resolve(value); });
			}, function (error) {
				server.Close(function () { reject(error); });
			});
		});
	});
}

describe('Elemenx production server', function () {
	it('answers a path with a null byte with 400 and goes on serving, where the file system used to crash it', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-null-'));

		fs.writeFileSync(path.join(root, 'index.html'), '<main>still running</main>');

		try {
			await withServer({Root: root}, async function (port) {
				var paths = ['/%00', '/assets/file%00.txt', '/libraries/%00'];
				var i = 0;
				var answer;

				while (i < paths.length) {
					answer = await new Promise(function (resolve, reject) {
						http.get({host: '127.0.0.1', port: port, path: paths[i]}, function (response) {
							response.resume();
							response.on('end', function () {
								resolve(response.statusCode);
							});
						}).on('error', reject);
					});

					expect(answer, paths[i]).toBe(400);

					i++;
				}

				answer = await request(port, 'GET');

				expect(answer.Status).toBe(200);
				expect(answer.Body.toString('utf8')).toBe('<main>still running</main>');
			});
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});

	it('emits cache validators and Cache-Control and answers conditional GET with 304', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-'));

		fs.writeFileSync(path.join(root, 'index.html'), '<main>production</main>');

		try {
			await withServer({Root: root, CacheControl: 'public, max-age=60'}, async function (port) {
				var first = await request(port, 'GET');

				expect(first.Status).toBe(200);
				expect(first.Headers['cache-control']).toBe('public, max-age=60');
				expect(first.Headers.etag).toBeTruthy();

				var second = await request(port, 'GET', {'If-None-Match': first.Headers.etag});

				expect(second.Status).toBe(304);
				expect(second.Body.length).toBe(0);
			});
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});

	it('answers HEAD without sending the file body', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-head-'));
		var body = '<main>head</main>';

		fs.writeFileSync(path.join(root, 'index.html'), body);

		try {
			await withServer({Root: root}, async function (port) {
				var result = await request(port, 'HEAD');

				expect(result.Status).toBe(200);
				expect(Number(result.Headers['content-length'])).toBe(Buffer.byteLength(body));
				expect(result.Body.length).toBe(0);
			});
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});

	it('allows a configured request handler to serve dynamic endpoints before static files', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-request-'));

		fs.writeFileSync(path.join(root, 'index.html'), '<main>fallback</main>');

		try {
			await withServer({Root: root, Request: function (request, response, pathname) {
				if (pathname !== '/dynamic') return false;

				response.writeHead(200, {'Content-Type': 'application/json'});
				response.end(JSON.stringify({ok: true}));

				return true;
			}}, async function (port) {
				var result = await new Promise(function (resolve, reject) {
					var req = http.request({host: '127.0.0.1', port: port, path: '/dynamic', method: 'GET'}, function (response) {
						var chunks = [];

						response.on('data', function (chunk) { chunks.push(chunk); });
						response.on('end', function () { resolve({Status: response.statusCode, Body: Buffer.concat(chunks).toString('utf8')}); });
					});

					req.on('error', reject);
					req.end();
				});

				expect(result.Status).toBe(200);
				expect(JSON.parse(result.Body)).toEqual({ok: true});
			});
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});
	/* A bug: Close waited for every connection, and a stream (SSE) of a request handler never ends on its own. */
	it('closes while a response of a request handler stays open, and ends that response', async function () {
		var server = Server.Create({Root: os.tmpdir(), Request: function (request, response, pathname) {
			if (pathname !== '/stream') return false;

			response.writeHead(200, {'Content-Type': 'text/event-stream'});
			response.write('data: one\n\n');

			return true;
		}});
		var ended;
		var closed;

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		ended = await new Promise(function (resolve, reject) {
			var req = http.request({host: '127.0.0.1', port: server.Server.address().port, path: '/stream', method: 'GET'}, function (response) {
				response.once('data', function () {
					/* In an object: a promise given to resolve would be waited for. */
					resolve({Closed: new Promise(function (done) {
						response.on('close', done);
					})});
				});
			});

			req.on('error', function () {});
			req.end();
		});

		closed = await Promise.race([
			new Promise(function (resolve) {
				server.Close(function () {
					resolve('closed');
				});
			}),
			new Promise(function (resolve) {
				setTimeout(resolve, 2000, 'waiting');
			})
		]);

		expect(closed).toBe('closed');

		await ended.Closed;
	});

	it('reassembles fragmented WebSocket messages before dispatching them', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-websocket-fragment-'));

		fs.writeFileSync(path.join(root, 'index.html'), '<main>websocket</main>');

		try {
			await withServer({Root: root, WebSocket: {Path: '/ws', Message: function (connection, message) {
				connection.Send(message);
				connection.Close();
			}}}, async function (port) {
				var value = 'A'.repeat(128 * 1024);
				var received = await new Promise(function (resolve, reject) {
					var socket = net.connect(port, '127.0.0.1');
					var key = crypto.randomBytes(16).toString('base64');
					var response = Buffer.alloc(0);
					var upgraded = false;
					function frame (payload, opcode, final) {
						var data = Buffer.from(payload);
						var mask = Buffer.from([1, 2, 3, 4]);
						var header = Buffer.alloc(data.length < 126 ? 2 : data.length <= 65535 ? 4 : 10);
						var i = 0;

						header[0] = (final ? 128 : 0) | opcode;

						if (data.length < 126) {
							header[1] = 128 | data.length;
						}
						else if (data.length <= 65535) {
							header[1] = 128 | 126;

							header.writeUInt16BE(data.length, 2);
						}
						else {
							header[1] = 128 | 127;

							header.writeUInt32BE(0, 2);
							header.writeUInt32BE(data.length, 6);
						}

						while (i < data.length) {
							data[i] ^= mask[i % 4];

							i++;
						}

						return Buffer.concat([header, mask, data]);
					}
					socket.on('connect', function () {
						socket.write('GET /ws HTTP/1.1\r\nHost: 127.0.0.1:' + port + '\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ' + key + '\r\n\r\n');
					});
					socket.on('data', function (chunk) {
						response = Buffer.concat([response, chunk]);

						if (!upgraded) {
							var split = response.indexOf('\r\n\r\n');
							if (split === -1) return;

							upgraded = true;
							response = response.subarray(split + 4);

							socket.write(frame(value.slice(0, 60000), 1, false));
							socket.write(frame(value.slice(60000), 0, true));
						}

						if (response.length < 10) return;

						var length = response[1] & 127;
						var offset = 2;

						if (length === 126) {
							if (response.length < 4) return;

							length = response.readUInt16BE(2);
							offset = 4;
						}
						else if (length === 127) {
							if (response.length < 10) return;

							length = response.readUInt32BE(6);
							offset = 10;
						}

						if (response.length < offset + length) return;

						var result = response.subarray(offset, offset + length).toString('utf8');

						socket.end();

						resolve(result);
					});
					socket.on('error', reject);
				});

				expect(received).toBe(value);
			});
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});
});
describe('Templates of a page', function () {
	var Templates = require('../../tools/templates.js');

	it('writes a <template id> as a script of text, its tags as they were written', function () {
		var page = '<body><template id="app"><Table [rows]="Rows"><TableColumn Name="a" /></Table><TextArea /><p>after</p></template><main></main></body>';

		expect(Templates.Page(page)).toBe('<body><script type="text/html" id="app"><Table [rows]="Rows"><TableColumn Name="a" /></Table><TextArea /><p>after</p></script><main></main></body>');
	});

	it('keeps nested templates inside the text and finds the end of the outer one', function () {
		var page = '<template id="outer" class="x"><Tabs><template slot="a"><b>a</b></template></Tabs></template><template id="second"><i></i></template>';

		expect(Templates.Page(page)).toBe('<script type="text/html" id="outer" class="x"><Tabs><template slot="a"><b>a</b></template></Tabs></script><script type="text/html" id="second"><i></i></script>');
	});

	it('leaves templates with no id, of a shadow root, holding a script, or inside a script or a comment', function () {
		var page = [
			'<template><b></b></template>',
			'<template id="shadow" shadowrootmode="open"><b></b></template>',
			'<template id="scripted"><script>go()</script></template>',
			'<script>var html = \'<template id="text"></template>\';</script>',
			'<!-- <template id="comment"></template> -->',
			'<template id="open"><b>'
		].join('\n');

		expect(Templates.Page(page)).toBe(page);
	});

	it('serves the pages with their templates as scripts, and as files when the option is off', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-templates-'));
		var body = '<main></main><template id="app"><Input /><TextArea /></template>';

		fs.writeFileSync(path.join(root, 'index.html'), body);

		try {
			await withServer({Root: root}, async function (port) {
				var first = await request(port, 'GET');
				var second = await request(port, 'GET', {'If-None-Match': first.Headers.etag});

				expect(first.Status).toBe(200);
				expect(first.Body.toString('utf8')).toBe('<main></main><script type="text/html" id="app"><Input /><TextArea /></script>');
				expect(Number(first.Headers['content-length'])).toBe(first.Body.length);
				expect(second.Status).toBe(304);
			});

			await withServer({Root: root, Templates: false}, async function (port) {
				expect((await request(port, 'GET')).Body.toString('utf8')).toBe(body);
			});
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});
});
