/*
 * The declaration of a job in the template of a Pipeline, inside a PipelineStage: <PipelineJob ID="unit" Name="Unit
 * tests" Status="success" Duration="84" Needs="build" />. It takes the props of a job of Pipeline (ID, Name, Status,
 * Duration, Started, Needs: IDs separated by commas, Group, Text, Href); markup inside it becomes the content of its
 * card and keeps its bindings. It shows nothing by itself: Pipeline reads it.
 */
Elemenx.Component('PipelineJob', {
	$TemplateURL: 'PipelineJob.html',
	$Meta: {
		Group: 'data',
		Icon: 'play',
		Description: 'The declaration of a job in the template of a Pipeline: <PipelineJob ID="unit" Name="Unit tests" Status="success" />.',
		Container: true,
		Props: {
			ID: 'The ID of the job.',
			Name: 'Its name.',
			Status: {Options: ['created', 'pending', 'scheduled', 'running', 'success', 'failed', 'warning', 'canceled', 'skipped', 'manual'], Description: 'Its status.'},
			Duration: 'How long it ran, in seconds.',
			Started: 'When it started (a date, or milliseconds): a running job counts its time from it.',
			Needs: 'The IDs of the jobs it waits for, separated by commas.',
			Group: 'The group of jobs it is one of (a matrix): one card for all of them.',
			Text: 'A text under its name.',
			Href: 'A link to the job (its log).'
		},
		Sample: {ID: 'unit', Name: 'Unit tests', Status: 'success', Duration: 84}
	},
	ID: '',
	Name: '',
	Status: 'created',
	Duration: null,
	Started: null,
	Needs: '',
	Group: '',
	Text: '',
	Href: '',

	$OnCreate: function () {
		this.Declared = function (id, name, status, duration, started, needs, group, text, href) {
			var item = {ID: id, Name: name, Status: status};

			if (duration !== null && duration !== undefined && duration !== '')
				item.Duration = Number(duration);

			if (started !== null && started !== undefined && started !== '')
				item.Started = started;

			if (needs)
				item.Needs = String(needs).split(',').map(function (each) {
					return each.trim();
				}).filter(Boolean);

			if (group)
				item.Group = group;

			if (text)
				item.Text = text;

			if (href)
				item.Href = href;

			return JSON.stringify(item);
		};
	}
});
