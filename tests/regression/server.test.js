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

function request (port, method, headers, pathname) {
	return new Promise(function (resolve, reject) {
		var req = http.request({host: '127.0.0.1', port: port, path: pathname || '/', method: method || 'GET', headers: headers || {}}, function (response) {
			var chunks = [];

			response.on('data', function (chunk) { chunks.push(chunk); });
			response.on('end', function () { resolve({Status: response.statusCode, Headers: response.headers, Body: Buffer.concat(chunks)}); });
		});

		req.setTimeout(2000, function () {
			req.destroy(new Error('Test request timed out'));
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
	it.each(['/%00', '/assets/file%00.txt', '/libraries/%00', '/%'])('rejects malformed path %s and keeps serving requests', async function (pathname) {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-invalid-path-'));
		var handled = [];

		fs.writeFileSync(path.join(root, 'index.html'), '<main>still running</main>');

		try {
			await withServer({Root: root, Request: function (request, response, pathname) {
				handled.push(pathname);
			}}, async function (port) {
				var invalid = await request(port, 'GET', {}, pathname);

				expect(invalid.Status).toBe(400);
				expect(invalid.Body.toString('utf8')).toBe('Bad Request');
				expect(handled).toEqual([]);

				var healthy = await request(port, 'GET');

				expect(healthy.Status).toBe(200);
				expect(healthy.Body.toString('utf8')).toBe('<main>still running</main>');
				expect(handled).toEqual(['/']);
			});
		}
		finally {
			fs.rmSync(root, {recursive: true, force: true});
		}
	});

	it('allows an encoded percent sign in a filename and leaves the query out of path validation', async function () {
		var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-server-percent-path-'));

		fs.writeFileSync(path.join(root, '%00.txt'), 'literal filename');

		try {
			await withServer({Root: root, SPA: false}, async function (port) {
				var result = await request(port, 'GET', {}, '/%2500.txt?value=%00');

				expect(result.Status).toBe(200);
				expect(result.Body.toString('utf8')).toBe('literal filename');
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