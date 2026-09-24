Elemenx.Service('Session', {
	Authorized: false,

	IsAuthorized: function () {
		return this.Authorized;
	},

	Login: function () {
		this.Authorized = true;
	},

	Logout: function () {
		this.Authorized = false;
	}
});