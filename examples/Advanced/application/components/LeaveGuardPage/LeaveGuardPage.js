Elemenx.Component('LeaveGuardPage', {
	$TemplateURL: 'LeaveGuardPage.html',
	$Title: 'Leave guard - Elemenx',
	AllowLeave: false,
	LeaveAttempts: 0,
	LeaveStatus: 'Leaving is blocked.',

	ToggleLeave: function () {
		this.AllowLeave = !this.AllowLeave;
		this.LeaveStatus = this.AllowLeave ? 'Leaving is allowed.' : 'Leaving is blocked.';
	},

	GoHome: function () {
		this.$Router().Go('/');
	},

	$OnRouteLeave: function () {
		this.LeaveAttempts++;

		if (this.AllowLeave) return true;

		this.LeaveStatus = 'Leave denied. Enable leaving and try again.';

		return false;
	}
});