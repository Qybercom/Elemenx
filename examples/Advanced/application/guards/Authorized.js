Elemenx.Guard('Authorized', function (args) {
	var session = this.Service('Session');

	if (session.Authorized) return true;

	return args.Fail('Login required');
});