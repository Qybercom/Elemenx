/*
 * Shows the toasts of the Toast Service: place one in the layout of the Application. Placement: bottom-right (the
 * default), bottom-left, top-right, top-left, top or bottom. A toast closes by itself after its Duration, and its timer
 * pauses while the pointer or the focus is on it; the newest is nearest the edge.
 */
Elemenx.Component('ToastHost', {
	$TemplateURL: 'ToastHost.html',
	$StyleURL: 'ToastHost.css',
	$Meta: {
		Group: 'overlays',
		Icon: 'bell',
		Description: 'Shows the toasts of the Toast Service: place one in the layout of the Application.',
		Props: {
			Placement: {Options: ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'top', 'bottom'], Description: 'Where the toasts show: bottom-right, bottom-left, top-right, top-left, top or bottom.'}
		}
	},
	Placement: 'bottom-right',
	Items: [],

	$OnCreate: function () {
		var self = this;
		var toast = this.$Service('Toast');

		this.Items = toast.Items.slice();

		this.Listener = toast.OnChange(function (items) {
			self.Items = items;
		});
	},

	$OnDestroy: function () {
		this.$Service('Toast').OffChange(this.Listener);
	},

	Id: function (node) {
		return node.closest('.elemenx-toast').getAttribute('data-id');
	},

	Close: function (event, node) {
		this.$Service('Toast').Dismiss(this.Id(node));
	},

	Act: function (event, node) {
		this.$Service('Toast').Run(this.Id(node), Number(node.getAttribute('data-index')));
	},

	Hold: function (event, node) {
		this.$Service('Toast').Pause(node.getAttribute('data-id'));
	},

	Release: function (event, node) {
		this.$Service('Toast').Resume(node.getAttribute('data-id'));
	}
});