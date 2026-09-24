Elemenx.Guard('Authorized', function (args) {
	var session = args.Context.Service('Session');

	if (session.Authorized) return true;

	return args.Fail('Login required');
});