var transferLongPollingIndex = 0;
var transferEnvelopeCurrent = null;
var transferWebSocketReceivers = [];

function transferEnvelope () {
	if (transferEnvelopeCurrent)
		return transferEnvelopeCurrent;

	var size = 2 * 1024 * 1024;
	var media = Buffer.alloc(size);
	var i = 0;
	while (i < size) {
		media[i] = i % 251;

		i++;
	}

	var manifest = {Value: {ID: 42, Title: 'Elemenx structured media object', Description: 'Business object transferred without manual chunk handling', Published: true, Tags: ['advanced', 'network', 'media'], Author: {ID: 7, Name: 'Elemenx Advanced'}, Media: {$ElemenxBinary: 0}}, Parts: [{Index: 0, Name: null, Mime: 'video/mp4', File: false, Size: size}]};
	var manifestBytes = Buffer.from(JSON.stringify(manifest));
	var header = Buffer.alloc(8);

	header.writeUInt32BE(0x45585354, 0);
	header.writeUInt32BE(manifestBytes.length, 4);

	return Buffer.concat([header, manifestBytes, media]);
}

function transferPackets () {
	var envelope = transferEnvelope();
	var id = 'advanced-all-transports';
	var chunkSize = 64 * 1024;
	var packets = [{Type: 'Transfer', Action: 'Start', ID: id, Name: null, Mime: 'application/x-elemenx-structured', Size: envelope.length}];
	var offset = 0;
	var index = 0;

	while (offset < envelope.length) {
		var end = Math.min(offset + chunkSize, envelope.length);

		packets.push({Type: 'Transfer', Action: 'Chunk', ID: id, Index: index, Offset: offset, Data: envelope.subarray(offset, end).toString('base64')});

		offset = end;

		index++;
	}

	packets.push({Type: 'Transfer', Action: 'End', ID: id, Chunks: index});

	return packets;
}

function inspectEnvelope (buffer) {
	if (!buffer || buffer.length < 8 || buffer.readUInt32BE(0) !== 0x45585354) return null;

	var manifestLength = buffer.readUInt32BE(4);
	var manifest;
	var value;
	var parts;
	var files = {};
	var i = 0;

	if (8 + manifestLength > buffer.length) return null;

	manifest = JSON.parse(buffer.subarray(8, 8 + manifestLength).toString('utf8'));
	value = manifest.Value || {};
	parts = manifest.Parts || [];
	while (i < parts.length) {
		files[i === 0 ? 'A' : 'B'] = {name: parts[i].Name, size: parts[i].Size, type: parts[i].Mime};

		i++;
	}

	return {ID: value.ID, Title: value.Title, Author: value.Author, Tags: value.Tags, Files: files};
}

module.exports = {
	Application: 'application',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4173,
		ProductionPort: 4175,
		Compression: true,
		CompressionThreshold: 1024,
		Request: function (request, response, pathname) {
			if (pathname === '/elemenx-runtime-deferred-error') {
				response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache'});
				response.end('Deferred child showcase error');

				return true;
			}

			if (pathname === '/elemenx-network-transfer-stage') {
				var staged = [];

				request.on('data', function (chunk) { staged.push(chunk); });
				request.on('end', function () {
					var buffer = Buffer.concat(staged);
					var data = inspectEnvelope(buffer);
					if (data)
						transferEnvelopeCurrent = buffer;

					transferLongPollingIndex = 0;

					response.writeHead(data ? 200 : 400, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache'});
					response.end(JSON.stringify({ok: !!data}));
				});

				return true;
			}

			if (pathname === '/elemenx-network-transfer-xhr') {
				var body = [];

				request.on('data', function (chunk) { body.push(chunk); });
				request.on('end', function () {
					var buffer = Buffer.concat(body);
					var data = inspectEnvelope(buffer);
					if (data)
						transferEnvelopeCurrent = buffer;

					transferLongPollingIndex = 0;

					response.writeHead(data ? 200 : 400, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache'});
					response.end(JSON.stringify({ok: !!data, data: data}));
				});

				return true;
			}

			if (pathname === '/elemenx-network-transfer-sse') {
				var packets = transferPackets();
				var packetIndex = 0;

				response.writeHead(200, {'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive'});

				var transferTimer = setInterval(function () {
					if (packetIndex >= packets.length) {
						clearInterval(transferTimer);
						transferTimer = null;

						return;
					}

					response.write('data: ' + JSON.stringify(packets[packetIndex++]) + '\n\n');
				}, 5);

				request.on('close', function () {
					if (transferTimer) {
						clearInterval(transferTimer);
						transferTimer = null;
					}
				});

				return true;
			}

			if (pathname === '/elemenx-network-transfer-longpolling') {
				var longPackets = transferPackets();
				if (transferLongPollingIndex >= longPackets.length)
					transferLongPollingIndex = 0;

				response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache'});
				response.end(JSON.stringify(longPackets[transferLongPollingIndex++]));

				return true;
			}

			if (pathname === '/elemenx-network-transfer-stream') {
				var streamPackets = transferPackets();
				var streamIndex = 0;

				response.writeHead(200, {'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive'});

				var streamTimer = setInterval(function () {
					if (streamIndex >= streamPackets.length) {
						clearInterval(streamTimer);
						streamTimer = null;

						response.end();

						return;
					}

					response.write(JSON.stringify(streamPackets[streamIndex++]) + '\n');
				}, 5);

				request.on('close', function () {
					if (streamTimer) {
						clearInterval(streamTimer);
						streamTimer = null;
					}
				});

				return true;
			}

			if (pathname === '/elemenx-network-stream') {
				response.writeHead(200, {
					'Content-Type': 'application/x-ndjson; charset=utf-8',
					'Cache-Control': 'no-cache, no-transform',
					'Connection': 'keep-alive'
				});

				var sequence = 0;
				var timer = setInterval(function () {
					sequence++;

					response.write(JSON.stringify({sequence: sequence, message: 'Elemenx Stream packet #' + sequence}) + '\n');

					if (sequence >= 3) {
						clearInterval(timer);
						timer = null;

						response.end();
					}
				}, 250);

				request.on('close', function () {
					if (timer) {
						clearInterval(timer);
						timer = null;
					}
				});

				return true;
			}

			if (pathname === '/elemenx-network-longpolling') {
				var closed = false;
				var timer = setTimeout(function () {
					if (closed) return;

					timer = null;

					response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache'});
					response.end(JSON.stringify({message: 'Elemenx LongPolling event', time: Date.now()}));
				}, 250);

				response.on('close', function () {
					closed = true;

					if (timer) {
						clearTimeout(timer);
						timer = null;
					}
				});

				return true;
			}

			if (pathname !== '/elemenx-network-sse') return false;

			response.writeHead(200, {
				'Content-Type': 'text/event-stream; charset=utf-8',
				'Cache-Control': 'no-cache, no-transform',
				'Connection': 'keep-alive'
			});

			var sequence = 0;
			var timer = setInterval(function () {
				sequence++;

				response.write('id: ' + sequence + '\n');
				response.write('data: ' + JSON.stringify({sequence: sequence, message: 'Elemenx SSE event #' + sequence}) + '\n\n');

				if (sequence >= 3) {
					clearInterval(timer);
					timer = null;
				}
			}, 250);

			request.on('close', function () {
				if (timer) {
					clearInterval(timer);
					timer = null;
				}
			});

			return true;
		},
		WebSocket: {
			Path: '/elemenx-network-showcase',
			Message: function (connection, message) {
				var packet;
				var event;
				var i;

				try {
					packet = JSON.parse(message);
				}
				catch (error) {
					return;
				}

				if (!packet || packet.url !== '/api/media' || !packet.data) return;

				if (packet.data.type === 'TransferReceiver' && packet.data.action === 'Register') {
					if (transferWebSocketReceivers.indexOf(connection) === -1)
						transferWebSocketReceivers.push(connection);

					connection.Send(JSON.stringify({response: '/api/media', data: {status: 200, correlationID: packet.data.correlationID}}));

					return;
				}

				event = JSON.stringify({event: '/api/media', data: packet.data});
				i = 0;
				while (i < transferWebSocketReceivers.length) {
					try {
						transferWebSocketReceivers[i].Send(event);

						i++;
					}
					catch (error) {
						transferWebSocketReceivers.splice(i, 1);
					}
				}

				connection.Send(JSON.stringify({response: '/api/media', data: {status: 200, correlationID: packet.data.correlationID}}));
			}
		}
	}
};