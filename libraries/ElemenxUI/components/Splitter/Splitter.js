/*
 * Two panes with a draggable divider. Direction: horizontal (side by side) or vertical (stacked).
 * Size is the size of the first pane in pixels; Min and Max bound it. Slots: first, second.
 * The resize event reports the new Size when the divider is released.
 */
Elemenx.Component('Splitter', {
	$TemplateURL: 'Splitter.html',
	$StyleURL: 'Splitter.css',
	$Meta: {
		Group: 'layout',
		Icon: 'columns',
		Description: 'Two panes with a draggable divider.',
		Container: true,
		Slots: ['first', 'second'],
		Events: ['resize'],
		Props: {
			Direction: {Options: ['horizontal', 'vertical'], Description: 'horizontal (side by side) or vertical (stacked).'},
			Size: 'The size of the first pane, in pixels.',
			Min: 'The least size of the first pane.',
			Max: 'The greatest size of the first pane.'
		},
		Sample: {Size: 180, Min: 80, Max: 400}
	},
	Direction: 'horizontal',
	Size: 240,
	Min: 64,
	Max: null,

	Resized: function (event) {
		this.Size = this.Direction === 'vertical' ? event.detail.Height : event.detail.Width;

		this.$Emit('resize', this.Size);
	}
});