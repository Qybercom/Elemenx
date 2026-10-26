/*
 * A range of a Timeline, declared in it: From and To, its Label, Tone or Color, and Lane (the ID of a TimelineLane;
 * none: the first free row). What is inside it is its label instead of Label. It shows nothing by itself.
 */
Elemenx.Component('TimelineRange', {
	$TemplateURL: 'TimelineRange.html',
	$Meta: {
		Group: 'data',
		Icon: 'columns',
		Description: 'A range of a Timeline: from a moment to another, in a lane; any content inside it is its label.',
		Container: true,
		Props: {
			ID: 'The ID of the range.',
			From: 'Its start.',
			To: 'Its end.',
			Label: 'Its label.',
			Tone: 'Its color: accent, info, success, warning, danger or muted.',
			Color: 'A CSS color of its own.',
			Lane: 'The ID of its lane.'
		},
		Sample: {ID: 'sprint', From: '2026-11-02', To: '2026-11-13', Label: 'Sprint 1'}
	},
	ID: '',
	From: '',
	To: '',
	Label: '',
	Tone: '',
	Color: '',
	Lane: '',

	$OnCreate: function () {
		/* What it declares, as the Timeline reads it (a template calls it with its props). */
		this.Value = function (id, from, to, label, tone, color, lane) {
			return JSON.stringify({ID: id, From: from, To: to, Label: label, Tone: tone, Color: color, Lane: lane});
		};
	}
});
