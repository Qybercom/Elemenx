/* Shows the toasts of the Toast Service. Placement: bottom-right (default), bottom-left, top-right, top-left, top, bottom. */
Elemenx.Component('ToastHost', {
	$TemplateURL: 'ToastHost.html',
	$StyleURL: 'ToastHost.css',
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