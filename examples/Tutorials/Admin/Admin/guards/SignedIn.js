/* The pages of the panel are for a signed-in user: anyone else goes to the page to sign in, and comes back after it. */
Elemenx.Guard('SignedIn', function () {
	if (this.$Service('Session').SignedIn()) return true;

	return '/login?return=' + encodeURIComponent(this.$To.Path);
});
