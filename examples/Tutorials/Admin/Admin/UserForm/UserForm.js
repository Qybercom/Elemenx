/* The form of a user in the drawer: their name, email and role, checked; save and remove are the owner's. */
Elemenx.Component('UserForm', {
	$TemplateURL: 'UserForm.html',
	$Meta: {
		Events: {
			save: 'The form is valid and sent: the user with its new values.',
			remove: 'The remove button: the user.'
		}
	},
	User: null,
	Roles: [{Value: 'customer', Label: 'Customer'}, {Value: 'admin', Label: 'Admin'}],

	Submitted: function (event) {
		this.$Emit('save', {ID: this.User.ID, Name: event.Value.name, Email: event.Value.email, Role: event.Value.role});
	},

	Remove: function () {
		this.$Emit('remove', this.User);
	}
});
