/* The page of the user, behind the SignedIn guard: its data come from the server, asked with the access token. */
Elemenx.Component('AccountPage', {
	$TemplateURL: 'AccountPage.html',
	$Title: 'Your account · Northwind',
	Data: null,
	Error: '',

	$OnCreate: function () {
		this.Load();
	},

	Load: function () {
		var self = this;

		this.$Service('Session').Request('GET', '/api/me', null, function (error, data) {
			if (error) {
				self.Error = error.message;

				return;
			}

			self.Data = data;
		});
	},

	Expires: function (seconds) {
		return new Date(seconds * 1000).toLocaleTimeString();
	}
});
