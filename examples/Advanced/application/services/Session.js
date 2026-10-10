Elemenx.Service('Session', {
	Authorized: false,
	ProjectAccess: false,
	Listeners: [],

	IsAuthorized: function () {
		return this.Authorized;
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);

		return callback;
	},

	OffChange: function (callback) {
		var index = this.Listeners.indexOf(callback);
		if (index !== -1)
			this.Listeners.splice(index, 1);
	},

	Changed: function () {
		var listeners = this.Listeners.slice();
		var i = 0;

		while (i < listeners.length) {
			listeners[i](this);

			i++;
		}
	},

	Login: function () {
		if (this.Authorized) return;

		this.Authorized = true;

		this.Changed();
	},

	Logout: function () {
		if (!this.Authorized) return;

		this.Authorized = false;

		this.Changed();
	},

	GrantProjectAccess: function () {
		if (this.ProjectAccess) return;

		this.ProjectAccess = true;

		this.Changed();
	},

	RevokeProjectAccess: function () {
		if (!this.ProjectAccess) return;

		this.ProjectAccess = false;

		this.Changed();
	}
});