Elemenx.Component('Layout', {
	$TemplateURL: 'Layout.html',
	$StyleURL: 'Layout.css',

	$OnCreate: function () {
		var component = this;
		var storage = this.$Storage.Local.Namespace('AdvancedExample');
		var session = this.$Service('Session');
		var theme = storage.Get('Theme') || 'light';

		function status () {
			var sessionStatus = component.$Ref('SessionStatus');
			var accessStatus = component.$Ref('AccessStatus');

			component.$Ref('SessionStatusText').textContent = session.Authorized ? 'Authorized' : 'Guest';
			component.$Ref('AccessStatusText').textContent = session.ProjectAccess ? 'Granted' : 'Denied';

			sessionStatus.classList.toggle('active', session.Authorized);
			accessStatus.classList.toggle('active', session.ProjectAccess);
		}

		this.$Batch(function (state) {
			state.Theme = theme === 'dark' ? 'Dark' : 'Light';
		});

		document.body.setAttribute('data-theme', theme);

		this.SessionStatusListener = session.OnChange(status);
		status();

		this.$Ref('Theme').addEventListener('click', function () {
			theme = theme === 'dark' ? 'light' : 'dark';

			document.body.setAttribute('data-theme', theme);

			storage.Set('Theme', theme);

			component.$Batch(function (state) {
				state.Theme = theme === 'dark' ? 'Dark' : 'Light';
			});
		});
	},

	$OnDestroy: function () {
		this.$Service('Session').OffChange(this.SessionStatusListener);
	}
});