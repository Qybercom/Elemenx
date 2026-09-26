Elemenx.Guard('ProjectAccess', function () {
	var session = this.Service('Session');

	if (session.ProjectAccess) return true;

	return this.Fail('Project access denied');
});