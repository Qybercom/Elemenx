Elemenx.Component('HomePage', {
	Template: '<section><h1>Home</h1><div class="card"><p>This example uses Router, Service and Guard.</p><button data-ref="Login">Enable protected project</button></div></section>',

	ElemenxOnCreate: function () {
		var session = this.Service('Session');

		this.Ref('Login').addEventListener('click', function () {
			session.Login();
		});
	}
});