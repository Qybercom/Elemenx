<!-- generated -->
# Pipeline

A pipeline of CI, as GitHub and GitLab show one: its stages in columns, the jobs of each as cards with their status, their name, their time and an action, the links between them. Only the view: where the data comes from is the owner's.

Stages: [{ID, Name, Status, Jobs: [{ID, Name, Status, Duration, Started, Needs, Group, Text, Href, Actions, Element, Render}]}], or declared inside it: PipelineStage with its PipelineJob (the content of one is the content of its card). Status is created, pending, scheduled, running, success, failed, warning (failed, allowed to), canceled, skipped or manual; the one of a stage, without its own, is the one of its jobs (a failed job first). Duration is in seconds; a running job with Started (a date, or milliseconds) counts its time as it goes. Needs are the IDs of the jobs a job waits for. The jobs of one Group (a matrix) are one card, its count and its status, opened by a press.

Links: needs (from the jobs of Needs; the default when a job has some), stages (from each stage to the next one, as GitLab joins them) or none. Over a job its needs and the jobs that need it are marked, the others fade. A press or Enter on a job emits select ({Job, Stage}), the arrows go from job to job; Actions (true) shows the action of a job: retry (failed, canceled, success, warning), cancel (running, pending) or play (manual), which emits action ({Action, Job}); a job may list its own Actions ([{ID, Icon, Label}]). Title and Summary (true) show the name of the pipeline, its status and its time above it.

## Properties

| Property | Default |
| --- | --- |
| `Stages` | `[]` |
| `Links` | `''` |
| `Title` | `''` |
| `Summary` | `true` |
| `Actions` | `true` |
| `Label` | `''` |

## Events

- `select`: A job was pressed: {Job, Stage}.
- `action`: The action of a job was pressed: {Action, Job}.

## Slots

default

## Example

```example
<Pipeline Title="main" [stages]="Stages" (select)="Selected" (action)="Acted">
	<PipelineStage ID="deploy" Name="Deploy">
		<PipelineJob ID="ship" Name="Ship" Status="manual" Needs="unit, lint" />
	</PipelineStage>
</Pipeline>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Hover a job, press one or its action.',
	Stages: [
		{ID: 'build', Name: 'Build', Jobs: [{ID: 'compile', Name: 'Compile', Status: 'success', Duration: 72}]},
		{ID: 'test', Name: 'Test', Jobs: [
			{ID: 'unit', Name: 'Unit', Status: 'success', Duration: 125, Needs: ['compile']},
			{ID: 'node-20', Name: 'Node 20', Status: 'success', Group: 'node', Needs: ['compile']},
			{ID: 'node-22', Name: 'Node 22', Status: 'running', Started: Date.now() - 40000, Group: 'node', Needs: ['compile']},
			{ID: 'lint', Name: 'Lint', Status: 'failed', Duration: 9}
		]}
	],

	Selected: function (event) {
		this.Text = 'Selected ' + event.Job.Name;
	},

	Acted: function (event) {
		this.Text = event.Action + ' ' + event.Job.Name;
	}
})
</script>
```

## Tests

- [shows the stages given and declared, their jobs, a matrix as one card, the status of each stage and of the whole](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L38) — `tests/regression/library-pipeline.test.js`
- [marks the chain of a job under the pointer, selects a job, tells its action, and goes from job to job by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L84) — `tests/regression/library-pipeline.test.js`
- [counts the time of a running job from Started, and joins the stages without needs](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L134) — `tests/regression/library-pipeline.test.js`
- [pipeline shows its stages, opens a matrix, marks the chain of a job and tells its selection and its action](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L7914) — `tests/examples/ui-kit.spec.js`
