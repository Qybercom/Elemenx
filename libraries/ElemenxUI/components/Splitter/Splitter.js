/*
 * Two panes with a draggable divider. Direction: horizontal (side by side) or vertical (stacked).
 * Size is the size of the first pane in pixels; Min and Max bound it. Slots: first, second.
 * The resize event reports the new Size when the divider is released.
 */
Elemenx.Component('Splitter', {
	$TemplateURL: 'Splitter.html',
	$StyleURL: 'Splitter.css',
	Direction: 'horizontal',
	Size: 240,
	Min: 64,
	Max: null,

	Resized: function (event) {
		this.Size = this.Direction === 'vertical' ? event.detail.Height : event.detail.Width;

		this.$Emit('resize', this.Size);
	}
});