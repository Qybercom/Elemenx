/* The page anyone sees: it says who is signed in, or offers to sign in. */
Elemenx.Component('HomePage', {
	$Template: '<section class="elemenx-card spacious" style="width: min(480px, 100%);"><div class="elemenx-card-body">' +
		'<h1 class="elemenx-title">Welcome</h1>' +
		'<p class="elemenx-text" *if="User">Signed in as {{User.Name}}. <a class="elemenx-link" href="/account">Your account</a></p>' +
		'<p class="elemenx-text" *if="!User">This page is for everyone; <a class="elemenx-link" href="/account">your account</a> asks you to sign in first.</p>' +
		'</div></section>',
	$Title: 'Northwind',
	User: null,

	$OnCreate: function () {
		var self = this;

		this.Listener = function (user) {
			self.User = user;
		};

		this.User = this.$Service('Session').User;

		this.$Service('Session').OnChange(this.Listener);
	},

	$OnDestroy: function () {
		this.$Service('Session').OffChange(this.Listener);
	}
});
