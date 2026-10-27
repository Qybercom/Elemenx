/*
 * The project of the tutorial on offline work. Server.Request is the API of the notes, for elemenx dev and
 * elemenx serve: GET /api/notes?since=N gives the notes changed after the version N and the version now, POST
 * /api/changes takes a list of notes changed in the browser (a deleted one has Deleted: true) and keeps the newest of
 * each (its Updated). A real project keeps them in its database; this one in memory.
 */
var notes = {};
var version = 0;

function answer (response, status, value) {
	response.writeHead(status, {'Content-Type': 'application/json'});
	response.end(JSON.stringify(value));
}

module.exports = {
	Application: 'Notes',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4323,
		ProductionPort: 4324,

		Request: function (request, response, pathname) {
			var body = '';
			var since;

			if (pathname === '/api/notes') {
				since = Number(new URL(request.url, 'http://localhost').searchParams.get('since')) || 0;

				answer(response, 200, {Version: version, Notes: Object.keys(notes).map(function (id) {
					return notes[id];
				}).filter(function (note) {
					return note.Version > since;
				})});

				return true;
			}

			if (pathname === '/api/changes' && request.method === 'POST') {
				request.on('data', function (chunk) {
					body += chunk;
				});

				request.on('end', function () {
					var changes = JSON.parse(body || '{}').Changes || [];

					/* The newest change of a note wins: one made offline long ago does not undo a newer one. */
					changes.forEach(function (note) {
						if (notes[note.ID] && notes[note.ID].Updated > note.Updated) return;

						version += 1;
						notes[note.ID] = {ID: note.ID, Text: note.Text, Updated: note.Updated, Deleted: !!note.Deleted, Version: version};
					});

					answer(response, 200, {Version: version});
				});

				return true;
			}

			return false;
		}
	}
};
