/* The name to write under, asked once: the join event gives it. */
Elemenx.Component('Join', {
	$TemplateURL: 'Join.html',
	$Meta: {
		Events: {join: 'A name was given: the name.'}
	},

	Submitted: function (event) {
		this.$Emit('join', event.Value.name.trim());
	}
});
