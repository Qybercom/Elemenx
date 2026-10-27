# Signing in

Signing in as a real application does it: a password checked by the server, a short access token kept in memory, a refresh token in a cookie the page cannot read, a session that survives a reload, a token renewed by itself when it expires, and pages closed to guests. The finished project is `examples/Tutorials/Auth`; the user is `ada@example.com` with the password `correct horse 7`.

What you learn: access and refresh tokens and where each one lives, a JWT signed and checked on the server, rotation of the refresh token, a guard that waits for the session, a request that renews its token, a safe return after signing in, and what OAuth adds.

## 1. Two tokens

```text
 sign in ──► server: password ok ──► access token (JSON, 5 minutes)  ──► memory of the page
                                  └─► refresh token (30 days)        ──► cookie: HttpOnly, SameSite=Strict, Path=/api/auth

 a request ──► Authorization: Bearer <access token>
 401       ──► POST /api/auth/refresh (the cookie goes by itself) ──► a new access token and a new refresh token
```

- The **access token** goes with every request. It is short-lived: a stolen one is worth minutes. It lives in a variable of the Session Service, not in `localStorage`, where any script injected into the page (a bad dependency, an XSS) would read it.
- The **refresh token** only buys new access tokens. It lives in a cookie with `HttpOnly` (no script reads it), `SameSite=Strict` (no other site sends it) and `Path=/api/auth` (it goes to the endpoints of the session only). In production add `Secure`: HTTPS only.

## 2. The server

The project signs its tokens itself, with HMAC-SHA256: a JWT is three parts in base64url, a header, the claims (`sub`, the user; `exp`, the expiry) and the signature of both.

```js
function sign (payload) {
	var head = base64url(JSON.stringify({alg: 'HS256', typ: 'JWT'})) + '.' + base64url(JSON.stringify(payload));

	return head + '.' + base64url(crypto.createHmac('sha256', secret).update(head).digest());
}
```

`verify(token)` computes the signature again, compares it with `crypto.timingSafeEqual` (a plain comparison tells an attacker by its time how many characters are right), and refuses an expired token. A real server takes a library for JWT and keeps the secret out of the code.

Three more rules of the server, each one line in the project:

- A password is kept as a slow hash with a salt (`crypto.scryptSync`), never as it is.
- A wrong email and a wrong password get the same answer: nobody learns which emails have accounts.
- **Rotation**: each refresh replaces the refresh token, and the old one stops working. A stolen refresh token works once at most, and the next use of the real one shows the theft.

With no session, `/api/auth/refresh` answers 204: a guest is not an error.

## 3. The Session Service

```js
$OnCreate: function () {
	var token = '';

	this.User = null;

	this.Token = function (value) {
		if (value !== undefined)
			token = value;

		return token;
	};
}
```

The token is a variable of a closure, not a field of the state: it never renders, never reaches the developer tools of the state, and goes with the tab.

`Restore(callback)` trades the cookie for an access token after a reload. A guard and the header both want the user at the start: the first call asks the server, the others wait for its answer, and later calls know the answer already.

`Request(method, url, data, callback)` adds `Authorization: Bearer`; a 401 means the access token expired, so it restores once (`force`) and asks again:

```js
this.Call(method, url, data, function (error, status, value) {
	if (!error && status === 401) {
		self.Restore(function (signedIn) {
			if (!signedIn) {
				callback(new Error('Signed out.'));

				return;
			}

			self.Call(method, url, data, function (again, code, result) {
				callback(again || (code !== 200 ? new Error(result.Error || 'The server answered ' + code) : null), result);
			});
		}, true);

		return;
	}

	callback(error || (status !== 200 ? new Error(value.Error || 'The server answered ' + status) : null), value);
});
```

The pages never see a token: they call `Request`, and the Session does the rest.

## 4. The guard waits

After a reload the page has no access token yet. The guard of `/account` waits for `Restore` instead of sending a signed-in user to the page to sign in:

```js
Elemenx.Guard('SignedIn', function () {
	var session = this.$Service('Session');
	var to = this.$To.Path;

	if (session.SignedIn()) return true;

	return this.$Wait(function (done) {
		session.Restore(function (signedIn) {
			done(signedIn ? true : '/login?return=' + encodeURIComponent(to));
		});
	});
});
```

A guard keeps a page from showing; it protects no data. The data are protected by the server, which checks the token of every request.

## 5. Back where you were, and nowhere else

The page to sign in sends the user back to the page that asked (`?return=/account`). Take only a path of this site: `?return=//evil.example` in a link would otherwise make your own page send the user to a copy of it.

```js
self.$Router().Replace(/^\/(?!\/)/.test(self.$Query.return || '') ? self.$Query.return : '/account');
```

The form gives its fields `Autocomplete="username"` and `"current-password"`: the password manager of the browser fills and keeps them.

## 6. Signing out

`SignOut` asks the server to forget the refresh token and to clear the cookie, then forgets the access token. Clearing only the page would leave a refresh token that still works.

## 7. And OAuth?

"Sign in with Google" is OAuth 2.0 with OpenID Connect. Its flow for a web application is the **authorization code with PKCE**:

1. The page makes a random `code_verifier`, keeps it, and sends the user to the provider with its hash (`code_challenge`) and a random `state`.
2. The user signs in there; the provider sends them back with a `code` and the `state`.
3. Your server (or the page) trades the `code` and the `code_verifier` for the tokens of the provider; the `state` must be the one sent, or the answer is refused.

The safest place for the end of the flow is your server: it takes the tokens of the provider, finds or creates the user, and then gives the browser the same two tokens as in this tutorial. The page stays the same; only `SignIn` becomes a link to the provider. Use the library of your server for OAuth: the details (`state`, `nonce`, the checks of the ID token) are where the mistakes are.

## 8. Try it

```bash
cd examples/Tutorials/Auth
npm install
npm run dev
```

Open `/account`, sign in, reload: you stay signed in, and the developer tools show no token in the storages and a cookie the page cannot read. The end-to-end test of the project also answers the first `/api/me` with 401 and checks the page still shows the account.
