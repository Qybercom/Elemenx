Elemenx.Component('HomePage', {
	TemplateURL: 'HomePage.html',
	Title: 'Home - Elemenx',

	ElemenxOnCreate: function () {
		var component = this;
		var session = this.Service('Session');

		function status () {
			var login = component.Ref('Login');
			var grant = component.Ref('GrantProjectAccess');

			login.textContent = session.Authorized ? 'Session enabled' : 'Enable session';
			login.disabled = session.Authorized;
			grant.textContent = session.ProjectAccess ? 'Access granted' : 'Grant project access';
			grant.disabled = session.ProjectAccess;
		}

		this.SessionStatusListener = session.OnChange(status);
		status();

		this.Ref('Login').addEventListener('click', function () {
			session.Login();
		});

		this.Ref('GrantProjectAccess').addEventListener('click', function () {
			session.GrantProjectAccess();
		});
	},

	ElemenxOnDestroy: function () {
		this.Service('Session').OffChange(this.SessionStatusListener);
	}
});