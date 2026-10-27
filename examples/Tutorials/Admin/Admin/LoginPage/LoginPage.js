/* The page to sign in: a Form of an email and a password, the Session, and back to the page that asked for it. */
Elemenx.Component('LoginPage', {
	$TemplateURL: 'LoginPage.html',
	$Title: 'Sign in · Shop admin',
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

			self.$Router().Replace(self.$Query.return || '/');
		});
	}
});
