Elemenx.Component('HomePage', {
	TemplateURL: 'HomePage.html',
	Title: 'Home - Elemenx',

	ElemenxOnCreate: function () {
		var session = this.Service('Session');

		this.Ref('Login').addEventListener('click', function () {
			session.Login();
		});
	}
});