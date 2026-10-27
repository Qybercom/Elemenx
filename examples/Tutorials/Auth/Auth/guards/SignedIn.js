/*
 * The pages for a signed-in user. After a reload the access token is gone: the guard waits while the Session trades the
 * cookie for a new one, and sends anyone not signed in to the page to sign in, to come back after it.
 */
Elemenx.Guard('SignedIn', function () {
	var session = this.$Service('Session');
	var to = this.$To.Path;

	if (session.SignedIn()) return true;

	return this.$Wait(function (done) {
		session.Restore(function (signedIn) {
			done(signedIn ? true : '/login?return=' + encodeURIComponent(to));
		});
	});
});
