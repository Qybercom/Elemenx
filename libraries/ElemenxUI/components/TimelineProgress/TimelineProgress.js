/*
 * The progress of a Timeline, declared in it: the axis filled from its start to To (a moment), Buffer a second,
 * lighter fill (what is loaded, as a player shows it). It shows nothing by itself.
 */
Elemenx.Component('TimelineProgress', {
	$TemplateURL: 'TimelineProgress.html',
	$Meta: {
		Group: 'data',
		Icon: 'loader',
		Description: 'The progress of a Timeline: its axis filled up to a moment.',
		Props: {
			To: 'Up to where: a moment.',
			Buffer: 'Up to where the lighter fill goes.'
		},
		Sample: {To: '2026-11-08'}
	},
	To: '',
	Buffer: '',

	$OnCreate: function () {
		/* What it declares, as the Timeline reads it (a template calls it with its props). */
		this.Value = function (to, buffer) {
			return JSON.stringify({To: to, Buffer: buffer});
		};
	}
});
