/*
 * The dashboard: what the Live Service hears, shown. It takes a copy of the numbers at each change, so the template
 * reads its own state; the stream starts with the component and pauses when it goes.
 */
Elemenx.Component('LiveBoard', {
	$TemplateURL: 'LiveBoard.html',
	$StyleURL: 'LiveBoard.css',
	State: 'paused',
	Visitors: 0,
	Orders: 0,
	Revenue: 0,
	Labels: [],
	Values: [],
	Recent: [],
	States: {connecting: 'Connecting', live: 'Live', reconnecting: 'Reconnecting', paused: 'Paused'},

	$OnCreate: function () {
		var self = this;

		this.Listener = function (live) {
			self.Show(live);
		};

		this.$Service('Live').OnChange(this.Listener);
		this.$Service('Live').Start();
	},

	$OnDestroy: function () {
		this.$Service('Live').OffChange(this.Listener);
		this.$Service('Live').Pause();
	},

	Show: function (live) {
		var last = live.Points[live.Points.length - 1];

		this.State = live.State;
		this.Visitors = last ? last.Visitors : 0;
		this.Orders = live.Orders;
		this.Revenue = live.Revenue;
		this.Recent = live.Recent;
		this.Labels = live.Points.map(function (point) {
			return new Date(point.Time).toLocaleTimeString();
		});
		this.Values = live.Points.map(function (point) {
			return point.Visitors;
		});
	},

	Money: function (amount) {
		return this.$Service('Format').Money(amount, 'EUR');
	},

	Toggle: function () {
		if (this.State === 'paused') this.$Service('Live').Start();
		else this.$Service('Live').Pause();
	}
});
