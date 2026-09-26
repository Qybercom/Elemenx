Elemenx.Service('Session', {
	Authorized: false,
	ProjectAccess: false,

	IsAuthorized: function () {
		return this.Authorized;
	},

	Login: function () {
		this.Authorized = true;
	},

	Logout: function () {
		this.Authorized = false;
	},

	GrantProjectAccess: function () {
		this.ProjectAccess = true;
	},

	RevokeProjectAccess: function () {
		this.ProjectAccess = false;
	}
});