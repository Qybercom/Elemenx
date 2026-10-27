/* The form to sign up: an email and a plan, checked by the Form, and a toast once it is sent. */
Elemenx.Component('Signup', {
	$TemplateURL: 'Signup.html',
	Sent: false,
	Plans: [{Value: 'free', Label: 'Free'}, {Value: 'pro', Label: 'Pro'}, {Value: 'team', Label: 'Team'}],

	Submitted: function (event) {
		this.Sent = true;

		this.$Service('Toast').Show({Title: 'Welcome!', Message: 'We sent a link to ' + event.Value.email + '.', Variant: 'success'});
	}
});
