/*
 * Steps joined by lines. Items: [{ID, Label, Description, Icon, Status}]; Status is done, active, error or pending,
 * or comes from Active and Done (lists of IDs): several steps may be active at once. Without an Icon a step shows
 * its number (a check when done). Direction: horizontal or vertical. Clickable makes the steps buttons that emit
 * select with the item.
 */
Elemenx.Component('Steps', {
	$TemplateURL: 'Steps.html',
	$StyleURL: 'Steps.css',
	Items: [],
	Active: [],
	Done: [],
	Direction: 'horizontal',
	Size: 'medium',
	Clickable: false,

	$OnCreate: function () {
		this.StatusOf = function (item, active, done) {
			if (item.Status)
				return item.Status;

			if ((active || []).indexOf(item.ID) !== -1) return 'active';
			if ((done || []).indexOf(item.ID) !== -1) return 'done';

			return 'pending';
		};

		this.IconOf = function (item, status) {
			if (status === 'done') return 'check';
			if (status === 'error') return 'close';

			return item.Icon || '';
		};
	},

	Pick: function (event, node) {
		var item = this.Items[Number(node.getAttribute('data-index'))];
		if (item && this.Clickable)
			this.$Emit('select', item);
	}
});