Elemenx.Guard('DelayedAccess', function () {
	return this.$Wait(function (done) {
		setTimeout(function () {
			done(true);
		}, 350);
	});
});