Elemenx.Component('HomePage', {
	$TemplateURL: 'HomePage.html',
	$Title: 'Home - Elemenx',

	BindingValue: 'Elemenx',
	BindingChecked: true,
	BindingSelected: 'staging',
	DirectiveTooltip: 'This title is maintained by a custom Elemenx directive.',
	DirectiveHighlighted: true,
	DirectiveBlocked: false,
	DirectiveStructuralAction: 'Unmount structural child',

	/* The buttons of the session: their words and whether they are done. */
	LoginLabel: 'Enable session',
	LoginDone: false,
	GrantLabel: 'Grant project access',
	GrantDone: false,

	$OnCreate: function () {
		var component = this;
		var session = this.$Service('Session');

		function status () {
			component.LoginLabel = session.Authorized ? 'Session enabled' : 'Enable session';
			component.LoginDone = !!session.Authorized;
			component.GrantLabel = session.ProjectAccess ? 'Access granted' : 'Grant project access';
			component.GrantDone = !!session.ProjectAccess;
		}

		this.SessionStatusListener = session.OnChange(status);

		status();
	},

	Login: function () {
		this.$Service('Session').Login();
	},

	Grant: function () {
		this.$Service('Session').GrantProjectAccess();
	},

	ToggleDirectiveHighlight: function () {
		this.DirectiveHighlighted = !this.DirectiveHighlighted;
	},

	ToggleDirectiveStructural: function () {
		this.DirectiveBlocked = !this.DirectiveBlocked;
		this.DirectiveStructuralAction = this.DirectiveBlocked ? 'Mount structural child' : 'Unmount structural child';
	},

	$OnDestroy: function () {
		this.$Service('Session').OffChange(this.SessionStatusListener);
	}
});