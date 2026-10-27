/*
 * The project of the tutorial on signing in. Server.Request is its API, for elemenx dev and elemenx serve:
 * - POST /api/auth/login {Email, Password}: the access token (a JWT signed with HMAC, valid for a few minutes) and the
 *   user; the refresh token goes in a cookie the page cannot read (HttpOnly), sent only to /api/auth;
 * - POST /api/auth/refresh: a new access token for the refresh token of the cookie, which is replaced by a new one
 *   (rotation: a stolen one works once at most), or 204 without a session;
 * - POST /api/auth/logout: forgets the refresh token and clears the cookie;
 * - GET /api/me: the data of the user of the access token (Authorization: Bearer), or 401.
 * A real server keeps the users and the refresh tokens in its database, the secret out of the code, and sends the
 * cookie with Secure over HTTPS. The user here: ada@example.com, the password "correct horse 7".
 */
var crypto = require('crypto');

var secret = crypto.randomBytes(32);
var lifetime = 5 * 60;
var refreshes = {};
var users = {};

/* A password is kept as a slow hash with a salt of its own, never as it is. */
function hash (password, salt) {
	return crypto.scryptSync(password, salt, 32).toString('hex');
}

users['ada@example.com'] = {Name: 'Ada Lovelace', Salt: 'f3a1c9', Hash: hash('correct horse 7', 'f3a1c9'), Plan: 'Pro'};

function base64url (value) {
	return Buffer.from(value).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign (payload) {
	var head = base64url(JSON.stringify({alg: 'HS256', typ: 'JWT'})) + '.' + base64url(JSON.stringify(payload));

	return head + '.' + base64url(crypto.createHmac('sha256', secret).update(head).digest());
}

/* The payload of a valid token that has not expired, or null. */
function verify (token) {
	var parts = String(token || '').split('.');
	var expected;
	var payload;

	if (parts.length !== 3) return null;

	expected = Buffer.from(base64url(crypto.createHmac('sha256', secret).update(parts[0] + '.' + parts[1]).digest()));

	if (expected.length !== parts[2].length || !crypto.timingSafeEqual(expected, Buffer.from(parts[2]))) return null;

	payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));

	return payload.exp > Date.now() / 1000 ? payload : null;
}

function answer (response, status, value, cookie) {
	var headers = {'Content-Type': 'application/json', 'Cache-Control': 'no-store'};

	if (cookie !== undefined)
		headers['Set-Cookie'] = 'refresh=' + cookie + '; HttpOnly; SameSite=Strict; Path=/api/auth' + (cookie ? '; Max-Age=2592000' : '; Max-Age=0');

	response.writeHead(status, headers);
	response.end(status === 204 ? undefined : JSON.stringify(value));
}

/* A session for an email: its access token, its user, and a new refresh token for the cookie. */
function session (response, email) {
	var refresh = crypto.randomBytes(32).toString('hex');
	var user = users[email];

	refreshes[refresh] = email;

	answer(response, 200, {Token: sign({sub: email, exp: Math.floor(Date.now() / 1000) + lifetime}), User: {Email: email, Name: user.Name}}, refresh);
}

function cookie (request) {
	var found = /(?:^|;\s*)refresh=([0-9a-f]+)/.exec(request.headers.cookie || '');

	return found ? found[1] : '';
}

function body (request, callback) {
	var text = '';

	request.on('data', function (chunk) {
		text += chunk;
	});

	request.on('end', function () {
		try {
			callback(JSON.parse(text || '{}'));
		}
		catch (error) {
			callback({});
		}
	});
}

module.exports = {
	Application: 'Auth',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4325,
		ProductionPort: 4326,

		Request: function (request, response, pathname) {
			var payload;
			var refresh;
			var owner;

			if (pathname === '/api/auth/login' && request.method === 'POST') {
				body(request, function (data) {
					var email = String(data.Email || '').toLowerCase();
					var user = users[email];

					/* The same answer for an unknown email and a wrong password: it tells nobody which emails have accounts. */
					if (!user || hash(String(data.Password || ''), user.Salt) !== user.Hash) answer(response, 401, {Error: 'The email or the password is wrong.'});
					else session(response, email);
				});

				return true;
			}

			if (pathname === '/api/auth/refresh' && request.method === 'POST') {
				refresh = cookie(request);

				/* No session is not an error: 204, nothing to say (a 401 would be an error in the console of every guest). */
				if (!refreshes[refresh]) {
					answer(response, 204, {}, '');

					return true;
				}

				owner = refreshes[refresh];

				delete refreshes[refresh];

				session(response, owner);

				return true;
			}

			if (pathname === '/api/auth/logout' && request.method === 'POST') {
				delete refreshes[cookie(request)];

				answer(response, 200, {}, '');

				return true;
			}

			if (pathname === '/api/me') {
				payload = verify(String(request.headers.authorization || '').replace(/^Bearer /, ''));

				if (!payload) answer(response, 401, {Error: 'The token is missing, wrong or expired.'});
				else answer(response, 200, {Email: payload.sub, Name: users[payload.sub].Name, Plan: users[payload.sub].Plan, Expires: payload.exp});

				return true;
			}

			return false;
		}
	}
};
