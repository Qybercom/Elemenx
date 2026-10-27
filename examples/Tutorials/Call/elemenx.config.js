/*
 * The project of the tutorial on video calls. Server.WebSocket is its signaling, for elemenx dev and elemenx serve: the
 * browsers of a room find each other through it and pass their offers, answers and candidates (WebRTC), then talk
 * directly. Messages are JSON: {Type: 'join', Room, Name} answered by {Type: 'welcome', ID, Peers: [{ID, Name}]} (the
 * others hear {Type: 'peer', ID, Name}), {Type: 'signal', To, Data} passed on as {Type: 'signal', From, Data}, and
 * {Type: 'left', ID} when one goes. A real call adds a TURN server for the networks where direct paths are closed.
 */
var rooms = {};
var next = 0;

function send (connection, message) {
	connection.Send(JSON.stringify(message));
}

function leave (connection) {
	var room = rooms[connection.Room];
	if (!room) return;

	delete room[connection.ID];

	Object.keys(room).forEach(function (id) {
		send(room[id], {Type: 'left', ID: connection.ID});
	});
}

module.exports = {
	Application: 'Call',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4331,
		ProductionPort: 4332,

		WebSocket: {
			Path: '/signal',

			Message: function (connection, text) {
				var message;
				var room;

				try {
					message = JSON.parse(text);
				}
				catch (error) {
					return;
				}

				if (message.Type === 'join' && !connection.ID) {
					next += 1;

					connection.ID = String(next);
					connection.Name = String(message.Name || 'Guest').substring(0, 40);
					connection.Room = String(message.Room || 'lobby');

					room = rooms[connection.Room] = rooms[connection.Room] || {};

					send(connection, {Type: 'welcome', ID: connection.ID, Peers: Object.keys(room).map(function (id) {
						return {ID: id, Name: room[id].Name};
					})});

					Object.keys(room).forEach(function (id) {
						send(room[id], {Type: 'peer', ID: connection.ID, Name: connection.Name});
					});

					room[connection.ID] = connection;

					return;
				}

				room = rooms[connection.Room] || {};

				if (message.Type === 'signal' && room[message.To])
					send(room[message.To], {Type: 'signal', From: connection.ID, Data: message.Data});
			},

			Close: leave
		}
	}
};
