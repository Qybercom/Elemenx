Elemenx.Guard('AuthorizedRedirect', function () {
	var session = this.Service('Session');

	if (session.Authorized) return true;

	return '/';
});