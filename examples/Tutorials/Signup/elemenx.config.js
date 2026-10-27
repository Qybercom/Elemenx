/*
 * The project of the tutorial on forms. Server.Request is the API of the form, for elemenx dev and elemenx serve:
 * GET /api/names?name= tells whether a name is free, POST /api/accounts makes an account or refuses an email that has
 * one. A real project asks its own server; this one keeps the accounts in memory.
 */
var taken = ['ada', 'admin', 'grace'];
var emails = ['ada@example.com'];

function answer (response, status, value) {
	response.writeHead(status, {'Content-Type': 'application/json'});
	response.end(JSON.stringify(value));
}

module.exports = {
	Application: 'Signup',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4319,
		ProductionPort: 4320,

		Request: function (request, response, pathname) {
			var body = '';
			var name;

			if (pathname === '/api/names') {
				name = new URL(request.url, 'http://localhost').searchParams.get('name') || '';

				/* A pause, as a real server has: the field shows that it checks. */
				setTimeout(function () {
					answer(response, 200, {Free: taken.indexOf(name.trim().toLowerCase()) === -1});
				}, 300);

				return true;
			}

			if (pathname === '/api/accounts' && request.method === 'POST') {
				request.on('data', function (chunk) {
					body += chunk;
				});

				request.on('end', function () {
					var account = JSON.parse(body || '{}');
					var email = String(account.Email || '').toLowerCase();

					/* The server checks again: what the browser checked, anyone may skip. */
					if (emails.indexOf(email) !== -1) {
						answer(response, 422, {Errors: {Email: 'This email has an account already'}});

						return;
					}

					emails.push(email);
					taken.push(String(account.Name || '').trim().toLowerCase());

					answer(response, 201, {ID: emails.length});
				});

				return true;
			}

			return false;
		}
	}
};
