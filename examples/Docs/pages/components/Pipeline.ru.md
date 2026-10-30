<!-- generated -->
# Pipeline

Пайплайн CI так, как его показывают GitHub и GitLab: стадии колонками, задачи каждой — карточками со статусом, именем, временем и действием, связи между ними. Только вид: откуда берутся данные — дело владельца. Stages: [{ID, Name, Status, Jobs: [{ID, Name, Status, Duration, Started, Needs, Group, Text, Href, Actions, Element, Render}]}] или объявленные внутри PipelineStage со своими PipelineJob (содержимое задачи — содержимое её карточки). Status — created, pending, scheduled, running, success, failed, warning (упала, но это разрешено), canceled, skipped или manual; статус стадии без своего — статус её задач (сначала упавшая). Duration — в секундах; у выполняющейся задачи со Started (дата или миллисекунды) время идёт. Needs — ID задач, которых она ждёт. Задачи одной Group (матрица) — одна карточка с числом и общим статусом, открывается нажатием. Links: needs (по Needs; по умолчанию, если они есть), stages (от стадии к следующей, как в GitLab) или none. Под указателем отмечаются задачи, которых ждёт задача, и те, что ждут её, остальные бледнеют. Нажатие или Enter на задаче — событие select ({Job, Stage}), стрелки переходят от задачи к задаче; Actions (true) показывает действие задачи: retry (failed, canceled, success, warning), cancel (running, pending) или play (manual) — событие action ({Action, Job}); у задачи могут быть свои Actions ([{ID, Icon, Label}]). Title и Summary (true) показывают над ним имя пайплайна, его статус и время.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Stages` | `[]` |
| `Links` | `''` |
| `Title` | `''` |
| `Summary` | `true` |
| `Actions` | `true` |
| `Label` | `''` |

## События

- `select`
- `action`

## Слоты

по умолчанию

## Пример

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

## Тесты

- [shows the stages given and declared, their jobs, a matrix as one card, the status of each stage and of the whole](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L38) — `tests/regression/library-pipeline.test.js`
- [marks the chain of a job under the pointer, selects a job, tells its action, and goes from job to job by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L84) — `tests/regression/library-pipeline.test.js`
- [counts the time of a running job from Started, and joins the stages without needs](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L134) — `tests/regression/library-pipeline.test.js`
- [pipeline shows its stages, opens a matrix, marks the chain of a job and tells its selection and its action](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L7928) — `tests/examples/ui-kit.spec.js`
