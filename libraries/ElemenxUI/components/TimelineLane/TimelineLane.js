/*
 * A lane of a Timeline, declared in it: a row of ranges with its Label at its start (the column of the names,
 * as in a Gantt chart). It shows nothing by itself.
 */
Elemenx.Component('TimelineLane', {
	$TemplateURL: 'TimelineLane.html',
	$Meta: {
		Group: 'data',
		Icon: 'list',
		Description: 'A lane of a Timeline: a row of ranges with its label at its start.',
		Props: {
			ID: 'The ID of the lane.',
			Label: 'Its label.'
		},
		Sample: {ID: 'design', Label: 'Design'}
	},
	ID: '',
	Label: '',

	$OnCreate: function () {
		/* What it declares, as the Timeline reads it (a template calls it with its props). */
		this.Value = function (id, label) {
			return JSON.stringify({ID: id, Label: label});
		};
	}
});
