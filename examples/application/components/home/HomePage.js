Elemenx.Component('HomePage', {
	TemplateURL: 'HomePage.html',

	ElemenxOnCreate: function () {
		var session = this.Service('Session');

		this.Ref('Login').addEventListener('click', function () {
			session.Login();
		});
	}
});