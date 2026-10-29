'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var crypto = require('crypto');
var Templates = require('./templates');

var Types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2'
};

var Compressible = {
	'.html': true,
	'.js': true,
	'.css': true,
	'.json': true,
	'.svg': true,
	'.txt': true,
	'.xml': true
};

function etag (stat) {
	return '"' + stat.size.toString(16) + '-' + Math.floor(stat.mtimeMs).toString(16) + '"';
}

function notModified (request, stat, tag) {
	var match = request.headers['if-none-match'];
	var modified = request.headers['if-modified-since'];

	if (match && match === tag) return true;

	if (!match && modified) {
		var time = Date.parse(modified);
		if (!isNaN(time) && Math.floor(stat.mtimeMs / 1000) <= Math.floor(time / 1000)) return true;
	}

	return false;
}

function acceptsGzip (request) {
	return accepts(request, 'gzip');
}

/* Whether the browser takes a coding (Accept-Encoding: br, gzip), and not with a weight of 0. */
function accepts (request, coding) {
	var match = new RegExp('(?:^|,)\\s*' + coding + '\\s*(?:;\\s*q\\s*=\\s*([0-9.]+))?\\s*(?:,|$)', 'i').exec(request.headers['accept-encoding'] || '');

	return !!match && (match[1] === undefined || Number(match[1]) > 0);
}

/* The copy of a file a build compressed beside it that the browser takes: {File, Encoding, Stat}, Brotli first, or null. */
function precompressed (request, file, stat) {
	var found = null;

	[['br', '.br'], ['gzip', '.gz']].some(function (pair) {
		var copy;

		if (!accepts(request, pair[0])) return false;

		try {
			copy = fs.statSync(file + pair[1]);
		}
		catch (error) {
			return false;
		}

		if (!copy.isFile() || copy.mtimeMs < stat.mtimeMs) return false;

		found = {File: file + pair[1], Encoding: pair[0], Stat: copy};

		return true;
	});

	return found;
}


function websocketFrame (payload, opcode) {
	var data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
	var length = data.length;
	var header;

	if (length < 126) {
		header = Buffer.alloc(2);
		header[1] = length;
	}
	else if (length <= 65535) {
		header = Buffer.alloc(4);
		header[1] = 126;

		header.writeUInt16BE(length, 2);
	}
	else {
		header = Buffer.alloc(10);
		header[1] = 127;

		header.writeUInt32BE(0, 2);
		header.writeUInt32BE(length, 6);
	}

	header[0] = 0x80 | (opcode === undefined ? 1 : opcode);

	return Buffer.concat([header, data]);
}

function websocketConnection (socket, request, handler) {
	var buffer = Buffer.alloc(0);
	var closed = false;
	var fragmentOpcode = 0;
	var fragments = [];
	var connection = {Request: request, Send: function (data) {
		if (!closed && socket.writable)
			socket.write(websocketFrame(data, 1));

		return connection;
	}, Close: function () {
		if (!closed) {
			closed = true;

			if (socket.writable)
				socket.end(websocketFrame('', 8));
		}

		return connection;
	}};
	function message (opcode, payload) {
		if (typeof handler.Message !== 'function') return;

		handler.Message(connection, opcode === 1 ? payload.toString('utf8') : payload);
	}
	function consume () {
		while (buffer.length >= 2) {
			var final = (buffer[0] & 128) !== 0;
			var opcode = buffer[0] & 15;
			var masked = (buffer[1] & 128) !== 0;
			var length = buffer[1] & 127;
			var offset = 2;
			var mask;
			var payload;
			var i;

			if (length === 126) {
				if (buffer.length < 4) return;

				length = buffer.readUInt16BE(2);
				offset = 4;
			}
			else if (length === 127) {
				if (buffer.length < 10 || buffer.readUInt32BE(2) !== 0) {
					connection.Close();

					return;
				}

				length = buffer.readUInt32BE(6);
				offset = 10;
			}

			if (masked) {
				if (buffer.length < offset + 4) return;

				mask = buffer.subarray(offset, offset + 4);
				offset += 4;
			}

			if (buffer.length < offset + length) return;

			payload = Buffer.from(buffer.subarray(offset, offset + length));
			buffer = buffer.subarray(offset + length);

			if (masked) {
				i = 0;
				while (i < payload.length) {
					payload[i] ^= mask[i % 4];

					i++;
				}
			}

			if (opcode === 8) {
				connection.Close();

				return;
			}

			if (opcode === 9) {
				if (!closed && socket.writable)
					socket.write(websocketFrame(payload, 10));

				continue;
			}

			if (opcode === 10) continue;

			if (opcode === 1 || opcode === 2) {
				if (fragmentOpcode) {
					connection.Close();

					return;
				}

				if (final) {
					message(opcode, payload);
				}
				else {
					fragmentOpcode = opcode;
					fragments = [payload];
				}

				continue;
			}

			if (opcode === 0) {
				if (!fragmentOpcode) {
					connection.Close();

					return;
				}

				fragments.push(payload);

				if (final) {
					payload = Buffer.concat(fragments);
					opcode = fragmentOpcode;
					fragmentOpcode = 0;
					fragments = [];

					message(opcode, payload);
				}
			}
		}
	}
	socket.on('data', function (data) {
		if (!closed) {
			buffer = Buffer.concat([buffer, data]);

			consume();
		}
	});
	socket.on('close', function () {
		closed = true;

		if (typeof handler.Close === 'function')
			handler.Close(connection);
	});
	socket.on('error', function () { closed = true; });

	if (typeof handler.Open === 'function')
		handler.Open(connection);
}

function create (options) {
	options = options || {};

	var root = path.resolve(options.Root || process.cwd());
	var framework = path.resolve(options.Framework || path.join(__dirname, '..', 'elemenx.js'));
	var compression = options.Compression !== false;
	var threshold = options.CompressionThreshold === undefined ? 1024 : Number(options.CompressionThreshold);

	/*
	 * A page whose text the server changes: the page of the root (index.html) through options.Page (text in, text out),
	 * the splash of development, and the <template id> of every page as scripts of text (see templates.js), unless
	 * options.Templates is false. A page neither changes is sent as a file.
	 */
	function page (request, response, file, index) {
		fs.readFile(file, 'utf8', function (error, text) {
			var changed;
			var body;
			var tag;
			var headers;

			if (error) {
				response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
				response.end('Not Found');

				return;
			}

			changed = options.Templates === false ? text : Templates.Page(text);

			if (index)
				changed = options.Page(changed);

			if (!index && changed === text) {
				sendFile(request, response, file);

				return;
			}

			body = Buffer.from(changed, 'utf8');
			tag = '"' + crypto.createHash('sha1').update(body).digest('hex').substring(0, 20) + '"';
			headers = {'Content-Type': Types['.html'], 'ETag': tag, 'Cache-Control': index ? 'no-cache' : String(options.CacheControl || 'no-cache')};

			if (request.headers['if-none-match'] === tag) {
				response.writeHead(304, headers);
				response.end();

				return;
			}

			if (compression && body.length >= threshold && acceptsGzip(request)) {
				body = zlib.gzipSync(body);
				headers['Content-Encoding'] = 'gzip';
				headers.Vary = 'Accept-Encoding';
			}

			headers['Content-Length'] = body.length;

			response.writeHead(200, headers);
			response.end(request.method === 'HEAD' ? undefined : body);
		});
	}

	function send (request, response, file) {
		var index = typeof options.Page === 'function' && path.resolve(file) === path.join(root, 'index.html');

		if (index || (options.Templates !== false && path.extname(file).toLowerCase() === '.html')) {
			page(request, response, file, index);

			return;
		}

		sendFile(request, response, file);
	}

	function sendFile (request, response, file) {
		fs.stat(file, function (error, stat) {
			if (error || !stat.isFile()) {
				response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
				response.end('Not Found');

				return;
			}

			var ext = path.extname(file).toLowerCase();
			var tag = etag(stat);
			var headers = {
				'Content-Type': Types[ext] || 'application/octet-stream',
				'ETag': tag,
				'Last-Modified': stat.mtime.toUTCString()
			};

			if (options.CacheControl)
				headers['Cache-Control'] = String(options.CacheControl);

			var coded = compression && Compressible[ext] ? precompressed(request, file, stat) : null;
			var useGzip = !coded && compression && Compressible[ext] && stat.size >= threshold && acceptsGzip(request);

			if (Compressible[ext])
				headers.Vary = 'Accept-Encoding';

			/* A file a build compressed beside it (file.br, file.gz, newer than it): sent as it is, with a tag of its own. */
			if (coded) {
				headers.ETag = etag(coded.Stat).replace(/"$/, '-' + coded.Encoding + '"');
				headers['Content-Encoding'] = coded.Encoding;
			}

			if (notModified(request, stat, headers.ETag)) {
				response.writeHead(304, headers);
				response.end();

				return;
			}

			if (request.method === 'HEAD') {
				headers['Content-Length'] = coded ? coded.Stat.size : stat.size;

				response.writeHead(200, headers);
				response.end();
			}
			else if (coded) {
				headers['Content-Length'] = coded.Stat.size;

				response.writeHead(200, headers);

				fs.createReadStream(coded.File).pipe(response);
			}
			else if (useGzip) {
				headers['Content-Encoding'] = 'gzip';

				response.writeHead(200, headers);

				fs.createReadStream(file).pipe(zlib.createGzip()).pipe(response);
			}
			else {
				headers['Content-Length'] = stat.size;

				response.writeHead(200, headers);

				fs.createReadStream(file).pipe(response);
			}
		});
	}

	var server = http.createServer(function (request, response) {
		var pathname;

		try {
			pathname = decodeURIComponent(request.url.split('?')[0]);

			/* A null byte in a path (/%00) makes the file system throw: such a request is answered, the server goes on. */
			if (pathname.indexOf('\0') !== -1)
				throw new Error('Elemenx server path holds a null byte');
		}
		catch (error) {
			response.writeHead(400);
			response.end('Bad Request');

			return;
		}

		if (typeof options.Request === 'function' && options.Request(request, response, pathname) === true) return;

		if (pathname === '/elemenx.js' && options.FrameworkFallback !== false && !fs.existsSync(path.join(root, 'elemenx.js'))) {
			send(request, response, framework);

			return;
		}

		if (pathname.indexOf('/libraries/') === 0) {
			var libraryRoot = path.resolve(path.dirname(framework), 'libraries');
			var libraryFile = path.resolve(libraryRoot, pathname.substring('/libraries/'.length));
			var libraryPrefix = libraryRoot.charAt(libraryRoot.length - 1) === path.sep ? libraryRoot : libraryRoot + path.sep;

			if (libraryFile.indexOf(libraryPrefix) === 0 && fs.existsSync(libraryFile)) {
				send(request, response, libraryFile);

				return;
			}
		}

		var relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
		var file = path.resolve(root, relative);
		var prefix = root.charAt(root.length - 1) === path.sep ? root : root + path.sep;

		if (file !== root && file.indexOf(prefix) !== 0) {
			response.writeHead(403);
			response.end('Forbidden');

			return;
		}

		fs.stat(file, function (error, stat) {
			if (!error && stat.isFile()) {
				send(request, response, file);

				return;
			}

			if (options.SPA === false) {
				response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
				response.end('Not Found');

				return;
			}

			send(request, response, path.join(root, 'index.html'));
		});
	});

	var sockets = [];

	/* The connections open, so Close can end the ones that would not end on their own (a stream, a WebSocket). */
	server.on('connection', function (socket) {
		sockets.push(socket);

		socket.on('close', function () {
			sockets.splice(sockets.indexOf(socket), 1);
		});
	});


	if (options.WebSocket) {
		server.on('upgrade', function (request, socket) {
			var handler = options.WebSocket;
			var pathname;
			var key = request.headers['sec-websocket-key'];
			var expected = handler.Path || null;

			try {
				pathname = decodeURIComponent(request.url.split('?')[0]);
			}
			catch (error) {
				socket.destroy();

				return;
			}

			if ((expected && pathname !== expected) || !key || String(request.headers.upgrade || '').toLowerCase() !== 'websocket') {
				socket.destroy();

				return;
			}

			var accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');

			socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');

			websocketConnection(socket, request, handler);
		});
	}

	return {
		Server: server,
		Listen: function (port, host, callback) {
			server.listen(Number(port === undefined || port === null ? 4173 : port), host || '127.0.0.1', callback);

			return this;
		},
		Close: function (callback) {
			server.close(callback);

			sockets.slice().forEach(function (socket) {
				socket.destroy();
			});
		}
	};
}

module.exports = {
	Create: create
};

if (require.main === module) {
	var root = path.resolve(process.argv[2] || process.cwd());
	var port = Number(process.argv[3] || process.env.PORT || 4173);
	var configFile = path.join(root, 'elemenx.config.js');
	var settings = fs.existsSync(configFile) ? require(configFile) : {};
	var serverSettings = settings.Server || {};

	create({Root: root, Request: serverSettings.Request || null, Templates: serverSettings.Templates !== false, WebSocket: serverSettings.WebSocket || null}).Listen(port, '127.0.0.1', function () {
		console.log('Elemenx server: http://127.0.0.1:' + port + '/');
	});
}