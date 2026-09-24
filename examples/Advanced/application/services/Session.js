Elemenx.Service('Session', {
	Authorized: false,

	Login: function () {
		this.Authorized = true;
	},

	Logout: function () {
		this.Authorized = false;
	}
});