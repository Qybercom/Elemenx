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

	$OnCreate: function () {
		var component = this;
		var session = this.$Service('Session');

		function status () {
			var login = component.$Ref('Login');
			var grant = component.$Ref('GrantProjectAccess');

			login.textContent = session.Authorized ? 'Session enabled' : 'Enable session';
			login.disabled = session.Authorized;
			grant.textContent = session.ProjectAccess ? 'Access granted' : 'Grant project access';
			grant.disabled = session.ProjectAccess;
		}

		this.SessionStatusListener = session.OnChange(status);
		status();

		this.$Ref('Login').addEventListener('click', function () {
			session.Login();
		});

		this.$Ref('GrantProjectAccess').addEventListener('click', function () {
			session.GrantProjectAccess();
		});
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