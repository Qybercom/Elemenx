Elemenx.Component('Layout', {
	$TemplateURL: 'Layout.html',
	$StyleURL: 'Layout.css',

	$OnCreate: function () {
		var component = this;
		var session = this.$Service('Session');
		var theme = this.$Service('Theme');
		var names = {system: 'System', light: 'Light', dark: 'Dark'};

		function status () {
			var sessionStatus = component.$Ref('SessionStatus');
			var accessStatus = component.$Ref('AccessStatus');

			component.$Ref('SessionStatusText').textContent = session.Authorized ? 'Authorized' : 'Guest';
			component.$Ref('AccessStatusText').textContent = session.ProjectAccess ? 'Granted' : 'Denied';

			sessionStatus.classList.toggle('active', session.Authorized);
			accessStatus.classList.toggle('active', session.ProjectAccess);
		}

		this.$Batch(function (state) {
			state.Theme = names[theme.Policy()];
		});

		this.ThemeListener = theme.OnChange(function (state) {
			component.$Batch(function (values) {
				values.Theme = names[state.Policy];
			});
		});

		this.SessionStatusListener = session.OnChange(status);

		status();

		this.$Ref('Theme').addEventListener('click', function () {
			theme.Next();
		});
	},

	$OnDestroy: function () {
		this.$Service('Session').OffChange(this.SessionStatusListener);
		this.$Service('Theme').OffChange(this.ThemeListener);
	}
});