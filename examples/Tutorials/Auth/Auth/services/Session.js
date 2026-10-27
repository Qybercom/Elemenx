/*
 * Who is signed in, and the requests made in their name. The access token lives in memory only: a script injected into
 * the page cannot read it from a storage, and it ends with the tab. The refresh token is a cookie the page never sees;
 * Restore(callback) trades it for a new access token after a reload, and Request(...) does the same once when the
 * server answers 401 (the access token expired), then tries again.
 * User is {Email, Name} or null. SignIn(email, password, callback), SignOut(callback), SignedIn(), Restore(callback,
 * force) calls back (true or false), Request(method, url, data, callback) calls back (error, value).
 * OnChange(callback) hears the user change, OffChange(callback).
 */
Elemenx.Service('Session', {
	$OnCreate: function () {
		var token = '';

		this.User = null;
		this.Tried = false;
		this.Waiting = null;
		this.Listeners = [];

		this.Token = function (value) {
			if (value !== undefined)
				token = value;

			return token;
		};
	},

	SignedIn: function () {
		return !!this.User;
	},

	/* A request with a JSON answer: callback(error, status, value). */
	Call: function (method, url, data, callback) {
		var headers = {'Content-Type': 'application/json'};
		var request;

		if (this.Token())
			headers.Authorization = 'Bearer ' + this.Token();

		request = this.$Network().XHR({Method: method, URL: url, Data: data === null ? null : JSON.stringify(data), Headers: headers, ResponseType: 'text'});

		request.On('Transport.Success', function (event) {
			var value = {};

			try {
				value = JSON.parse(event.Data.Response || '{}');
			}
			catch (error) {
				value = {};
			}

			callback(null, event.Data.Status, value);
		});

		request.On('Transport.Error', function () {
			callback(new Error('The network failed.'));
		});

		request.Execute();
	},

	SignIn: function (email, password, callback) {
		var self = this;

		this.Call('POST', '/api/auth/login', {Email: email, Password: password}, function (error, status, value) {
			if (error) {
				callback(error);

				return;
			}

			if (status !== 200) {
				callback(new Error(value.Error || 'The server answered ' + status));

				return;
			}

			self.Start(value);

			callback(null, self.User);
		});
	},

	SignOut: function (callback) {
		var self = this;

		this.Call('POST', '/api/auth/logout', null, function () {
			self.End();

			if (callback)
				callback();
		});
	},

	/*
	 * A new access token for the cookie, once for every caller that asks meanwhile. Without force it asks the server
	 * only the first time: a guard and a header that both want the user after a reload make one request.
	 */
	Restore: function (callback, force) {
		var self = this;

		if (this.User && !force) {
			callback(true);

			return;
		}

		if (this.Tried && !force && !this.Waiting) {
			callback(false);

			return;
		}

		if (this.Waiting) {
			this.Waiting.push(callback);

			return;
		}

		this.Tried = true;
		this.Waiting = [callback];

		this.Call('POST', '/api/auth/refresh', null, function (error, status, value) {
			var waiting = self.Waiting;

			self.Waiting = null;

			if (!error && status === 200) self.Start(value);
			else self.End();

			waiting.forEach(function (each) {
				each(self.SignedIn());
			});
		});
	},

	/* A request in the name of the user: an expired access token is renewed once, and the request made again. */
	Request: function (method, url, data, callback) {
		var self = this;

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
	},

	Start: function (value) {
		this.Token(value.Token);

		this.User = value.User;

		this.Changed();
	},

	End: function () {
		this.Token('');

		this.User = null;

		this.Changed();
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	},

	Changed: function () {
		var user = this.User;

		this.Listeners.slice().forEach(function (callback) {
			callback(user);
		});
	}
});
