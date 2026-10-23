/*
 * A block: content in a frame, with a title on a band set into the top of the frame. Note is a caption after the
 * title, the actions slot holds controls at the end of the band, the default slot the content. Padding: medium,
 * compact or spacious (the paddings of elemenx-block). HeaderShape 'trapezoid' makes the block a folder: the title
 * (and the note) on a tab as wide as their text, its end sloping down to the body, the actions beyond the slope. Its
 * look comes from the --elemenx-block-* tokens of the theme.
 */
Elemenx.Component('Block', {
	$TemplateURL: 'Block.html',
	$StyleURL: 'Block.css',
	$Meta: {
		Group: 'layout',
		Icon: 'panel-bottom',
		Description: 'A block: content in a frame, with a title on a band set into the top of the frame.',
		Container: true,
		Slots: ['actions'],
		Props: {
			Title: 'The title on the band at the top of the frame.',
			Note: 'A caption after the title.',
			Level: 'The level of the title as a heading for screen readers (aria-level).',
			Padding: {Options: ['medium', 'compact', 'spacious'], Description: 'The room inside the frame: compact, medium or spacious.'},
			HeaderShape: {Options: ['default', 'trapezoid'], Description: 'default (a band set into the frame) or trapezoid (a folder: the title on a tab).'}
		},
		Sample: {Title: 'Reactor', Note: 'Ring B'}
	},
	Title: '',
	Note: '',
	Level: 3,
	Padding: 'medium',
	HeaderShape: 'default',

	/* The width of the tab of a folder (HeaderShape trapezoid), where the top of the body begins. */
	$OnReady: function () {
		var header = this.$Element().querySelector('.elemenx-block-header');
		var tab = header.querySelector('.elemenx-block-tab');

		this.Measure = typeof ResizeObserver === 'function' ? new ResizeObserver(function () {
			header.style.setProperty('--elemenx-tab-width', tab.offsetWidth + 'px');
		}) : null;

		if (this.Measure)
			this.Measure.observe(tab);
	},

	$OnDestroy: function () {
		if (this.Measure)
			this.Measure.disconnect();
	}
});
