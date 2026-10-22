/*
 * The server of the reference answers the live examples of the network: a JSON resource, an echo of what a request
 * sends, server-sent events, a held long-polling response, a streamed response of lines of JSON, and an echo over a
 * WebSocket. Everything else is the files of the reference.
 */
var sequence = 0;

function json (response, status, value) {
	response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache'});
	response.end(JSON.stringify(value));
}

/* Reads the body of a request, then calls back with it as a Buffer. */
function body (request, callback) {
	var parts = [];

	request.on('data', function (part) {
		parts.push(part);
	});

	request.on('end', function () {
		callback(Buffer.concat(parts));
	});
}

/* Calls send every interval milliseconds, count times, then done; a closed request stops it. */
function every (request, interval, count, send, done) {
	var index = 0;
	var timer = setInterval(function () {
		index++;

		send(index);

		if (index >= count) {
			clearInterval(timer);
			timer = null;

			done();
		}
	}, interval);

	request.on('close', function () {
		if (timer)
			clearInterval(timer);

		timer = null;
	});
}

module.exports = {
	Application: 'application',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4177,
		ProductionPort: 4178,
		Request: function (request, response, pathname) {
			if (pathname === '/api/hello') {
				json(response, 200, {Message: 'Hello from the server', Time: new Date().toISOString()});

				return true;
			}

			if (pathname === '/api/echo') {
				body(request, function (data) {
					json(response, 200, {
						Method: request.method,
						Type: request.headers['content-type'] || null,
						Bytes: data.length,
						Text: data.length <= 4096 ? data.toString('utf8') : null
					});
				});

				return true;
			}

			if (pathname === '/api/events') {
				response.writeHead(200, {'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive'});
				response.write('retry: 2000\n\n');

				every(request, 400, 5, function (index) {
					response.write('id: ' + index + '\ndata: ' + JSON.stringify({Index: index, Time: new Date().toISOString()}) + '\n\n');
				}, function () {
					response.end();
				});

				return true;
			}

			if (pathname === '/api/poll') {
				setTimeout(function () {
					sequence++;

					json(response, 200, {Sequence: sequence, Time: new Date().toISOString()});
				}, 600);

				return true;
			}

			if (pathname === '/api/stream') {
				response.writeHead(200, {'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform'});

				every(request, 400, 10, function (index) {
					response.write(JSON.stringify({Index: index, Text: 'line ' + index}) + '\n');
				}, function () {
					response.end();
				});

				return true;
			}

			return false;
		},
		WebSocket: {
			Path: '/api/socket',
			Message: function (connection, message) {
				connection.Send(JSON.stringify({Echo: String(message), Time: new Date().toISOString()}));
			}
		}
	}
};
