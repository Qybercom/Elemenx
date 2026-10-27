/*
 * The project of the tutorial on live data. Server.Request is its stream, for elemenx dev and elemenx serve:
 * GET /api/stream sends a tick of the shop every second as server-sent events, each with its number (id), and goes on
 * after the last number the browser received (Last-Event-ID when it reconnects, ?after= when it opens a new stream).
 * A real project streams from its own server; this one makes the numbers up, the same for the same tick.
 */

/* The tick of a number: the visitors on the site, and an order on every third tick. */
function tick (id) {
	var value = {ID: id, Time: Date.now(), Visitors: 120 + Math.round(30 * Math.sin(id / 4)) + (id * 7) % 11, Order: null};

	if (id % 3 === 0)
		value.Order = {ID: 1000 + id / 3, Customer: ['Ada', 'Grace', 'Alan', 'Barbara', 'Edsger'][id % 5], Amount: 20 + (id * 37) % 180};

	return value;
}

module.exports = {
	Application: 'Dashboard',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4321,
		ProductionPort: 4322,

		Request: function (request, response, pathname) {
			var id;
			var timer;

			if (pathname !== '/api/stream') return false;

			/* After the last tick the browser has: its Last-Event-ID when it reconnects, ?after= for a new stream. */
			id = Number(request.headers['last-event-id'] || new URL(request.url, 'http://localhost').searchParams.get('after')) || 0;

			response.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive'});

			/* After a break the browser asks again in a second. */
			response.write('retry: 1000\n\n');

			function send () {
				id += 1;

				response.write('id: ' + id + '\ndata: ' + JSON.stringify(tick(id)) + '\n\n');
			}

			send();

			timer = setInterval(send, 1000);

			request.on('close', function () {
				clearInterval(timer);
			});

			return true;
		}
	}
};
