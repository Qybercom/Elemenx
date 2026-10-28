/*
 * The window of the tray (Platform.Tray with Window): a press on the icon opens it by the icon, as the tray windows of
 * programs do. It shows the last notes of the one list and brings the program back or quits it.
 */
Elemenx.Component('TrayPanel', {
	$TemplateURL: 'TrayPanel.html',
	Items: [],

	$OnCreate: function () {
		var self = this;
		var notes = this.$Service('Notes');

		this.Changed = function () {
			self.Items = notes.Items.slice(-3).reverse();
		};

		this.Changed();

		notes.OnChange(this.Changed);
	},

	$OnDestroy: function () {
		this.$Service('Notes').OffChange(this.Changed);
	},

	/* The main window comes back; the window of the tray hides. */
	Shown: function () {
		var native = this.$Service('Platform');

		native.TrayWindow(false);
		native.Window('show');
	},

	Quitted: function () {
		this.$Service('Platform').Window('quit');
	}
});
