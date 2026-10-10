Elemenx.Guard('Authorized', function () {
	var session = this.$Service('Session');
	if (session.Authorized) return true;

	return this.$Fail('Login required');
});