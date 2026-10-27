/*
 * Steps joined by lines. Items: [{ID, Label, Description, Icon, Status, Class, Disabled, Readonly, Element, Render}]; Status is
 * done, active, error or pending, or comes from Active and Done (lists of IDs): several steps may be active at once.
 * Without an Icon a step shows its number (a check when done). Element (a DOM node) or Render(container, item) add
 * custom content under the label; Class adds classes to the step. Direction: horizontal or vertical. Clickable (off
 * by default) makes the steps buttons that emit select with the item; a Disabled step does not, and looks disabled. A
 * step that is not Clickable, or Readonly, is no control at all (a timeline): it takes no pointer, focus or key and
 * looks as it is; its Status still comes from the code.
 */
Elemenx.Component('Steps', {
	$TemplateURL: 'Steps.html',
	$StyleURL: 'Steps.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'list-ordered',
		Description: 'Steps joined by lines.',
		Events: {
			select: 'A Clickable step was pressed: its item.'
		},
		Props: {
			Items: {Schema: {ID: 'text', Label: 'text', Description: 'text', Disabled: 'bool'}, Description: 'The steps: [{ID, Label, Description, Icon, Status, Class, Disabled, Readonly, Element, Render}].'},
			Active: 'The IDs of the active steps.',
			Done: 'The IDs of the steps done.',
			Direction: {Options: ['horizontal', 'vertical'], Description: 'horizontal or vertical.'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Clickable: 'Makes the steps buttons that emit select.'
		},
		Sample: {Items: [{ID: 'cart', Label: 'Cart'}, {ID: 'pay', Label: 'Payment'}, {ID: 'done', Label: 'Done'}], Active: ['pay'], Done: ['cart'], Clickable: true}
	},
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

		/* A button the user can press, or a plain mark (a timeline). */
		this.Interactive = function (item, clickable) {
			return !!clickable && clickable !== 'false' && !item.Readonly;
		};

		this.IconOf = function (item, status) {
			if (status === 'done') return 'check';
			if (status === 'error') return 'close';

			return item.Icon || '';
		};
	},

	Pick: function (event, node) {
		var item = this.Items[Number(node.getAttribute('data-index'))];
		if (item && this.Interactive(item, this.Clickable) && !item.Disabled)
			this.$Emit('select', item);
	}
});