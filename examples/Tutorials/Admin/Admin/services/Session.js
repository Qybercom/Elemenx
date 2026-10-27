/*
 * Who is signed in, kept for the tab (the session storage of the browser): SignIn(email, password, callback),
 * SignOut(), SignedIn(), User(); OnChange(callback) hears it change. A real panel asks its server in SignIn.
 */
Elemenx.Service('Session', {
	$OnCreate: function () {
		this.Store = this.$Storage.Session.Namespace('admin');
		this.Listeners = [];
	},

	User: function () {
		return this.Store.Get('user') || null;
	},

	SignedIn: function () {
		return !!this.User();
	},

	SignIn: function (email, password, callback) {
		var self = this;

		/* The server of a real panel checks them; here any password of 8 characters will do. */
		window.setTimeout(function () {
			if (String(password).length < 8) {
				callback(new Error('The email or the password is wrong.'));

				return;
			}

			self.Store.Set('user', {Email: email, Name: email.split('@')[0]});
			self.Changed();

			callback(null, self.User());
		}, 300);
	},

	SignOut: function () {
		this.Store.Remove('user');
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
		var user = this.User();

		this.Listeners.slice().forEach(function (callback) {
			callback(user);
		});
	}
});
