/*
 * A measurement within a known range, like <meter>: Value between Min and Max. Low and High split the range into
 * zones; Optimum tells which zone is good. The good zone shows success, the next one warning, the far one danger.
 */
Elemenx.Component('Meter', {
	$TemplateURL: 'Meter.html',
	$StyleURL: 'Meter.css',
	Value: 0,
	Min: 0,
	Max: 100,
	Low: null,
	High: null,
	Optimum: null,
	Label: '',
	Unit: '',
	Size: 'medium',
	ShowValue: true,

	$OnCreate: function () {
		var self = this;

		this.Percent = function (value) {
			var min = Number(self.Min);
			var max = Number(self.Max);

			return max === min ? 0 : (Math.max(min, Math.min(max, Number(value))) - min) / (max - min) * 100;
		};

		this.Zone = function (value) {
			var low = self.Low === null || self.Low === '' ? Number(self.Min) : Number(self.Low);
			var high = self.High === null || self.High === '' ? Number(self.Max) : Number(self.High);
			var optimum = self.Optimum === null || self.Optimum === '' ? (Number(self.Min) + Number(self.Max)) / 2 : Number(self.Optimum);
			var zone = function (number) {
				return number < low ? 0 : number > high ? 2 : 1;
			};
			var distance;

			value = Number(value);
			distance = Math.abs(zone(value) - zone(optimum));

			return distance === 0 ? 'success' : distance === 1 ? 'warning' : 'danger';
		};
	}
});