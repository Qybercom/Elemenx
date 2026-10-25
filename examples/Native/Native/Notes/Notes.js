/*
 * The notes of the program: one list for all its windows, as they are windows of one Application. Add(kind, text)
 * adds one; OnChange(callback) / OffChange(callback) tell the windows when the list changes.
 */
Elemenx.Service('Notes', {
	$OnCreate: function () {
		this.Items = [];
		this.Listeners = [];
		this.Next = 1;
	},

	Add: function (kind, text) {
		this.Items = this.Items.concat([{ID: this.Next, Kind: kind, Text: text}]);
		this.Next++;

		this.Listeners.slice().forEach(function (callback) {
			callback();
		});
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (item) {
			return item !== callback;
		});
	}
});
