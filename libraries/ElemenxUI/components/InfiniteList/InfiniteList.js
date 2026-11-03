/*
 * A list that asks for more as its end comes near (the directive *infinite): its rows in its slot, a spinner while Busy,
 * a word at its end when Done. Direction up (a chat: the older messages above) asks at its start and keeps what the
 * reader sees in its place when they come. Height (a CSS length or pixels) makes it scroll inside; without it the page
 * scrolls. Margin: how near the end it asks, in pixels. Event more ({Direction}): set Busy while it comes.
 */
Elemenx.Component('InfiniteList', {
	$TemplateURL: 'InfiniteList.html',
	$StyleURL: 'InfiniteList.css',
	$Meta: {
		Group: 'layout',
		Icon: 'list',
		Description: 'A list that asks for more as its end comes near: its rows in its slot, a spinner while Busy, a word at its end when Done.',
		Container: true,
		Events: {
			more: 'Its end (up: its start) came near, or it is too short to scroll: {Direction}.'
		},
		Props: {
			Busy: 'What was asked is coming: a spinner shows, and nothing more is asked.',
			Done: 'There is no more: a word shows at its end.',
			Direction: {Options: ['down', 'up'], Description: 'down: more at the end; up: more at the start, as the older messages of a chat.'},
			Margin: 'How near the end it asks, in pixels.',
			Height: 'A CSS length (or pixels) makes it scroll inside; without it the page scrolls.',
			Label: 'The name of the list for screen readers.',
			EndText: 'The word at its end when Done (That is all, by default).'
		},
		Sample: {Height: '240px', Label: 'News'}
	},
	Busy: false,
	Done: false,
	Direction: 'down',
	Margin: 300,
	Height: '',
	Label: '',
	EndText: '',

	/* A height: a number is pixels. */
	Length: function (value) {
		if (value === '' || value === null || value === undefined) return null;

		return typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value)) ? value + 'px' : value;
	},

	More: function (event) {
		this.$Emit('more', event.detail);
	}
});
