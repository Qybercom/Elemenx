/* The page to sign in: an email and a password, the Session, and back to the page that asked for it. */
Elemenx.Component('LoginPage', {
	$TemplateURL: 'LoginPage.html',
	$Title: 'Sign in · Northwind',
	Busy: false,
	Error: '',

	Submitted: function (event) {
		var self = this;

		this.Busy = true;
		this.Error = '';

		this.$Service('Session').SignIn(event.Value.email, event.Value.password, function (error) {
			self.Busy = false;

			if (error) {
				self.Error = error.message;

				return;
			}

			/* Only a path of this site: ?return=https://evil.example would send the user away. */
			self.$Router().Replace(/^\/(?!\/)/.test(self.$Query.return || '') ? self.$Query.return : '/account');
		});
	}
});
