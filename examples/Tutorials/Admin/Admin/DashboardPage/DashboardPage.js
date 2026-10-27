/* The dashboard: the figures of the shop, the sales of the last months in a chart. */
Elemenx.Component('DashboardPage', {
	$TemplateURL: 'DashboardPage.html',
	$Title: 'Dashboard · Shop admin',
	Stats: null,

	$OnCreate: function () {
		var self = this;

		this.Money = function (value) {
			return new Intl.NumberFormat('en', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0}).format(value);
		};

		this.$Service('Api').Stats(function (error, stats) {
			self.Stats = stats;
		});
	}
});
