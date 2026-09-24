Elemenx.Component('HomePage', {
	TemplateURL: 'components/home/home.html',

	ElemenxOnCreate: function () {
		var session = this.Service('Session');

		this.Ref('Login').addEventListener('click', function () {
			session.Login();
		});
	}
});