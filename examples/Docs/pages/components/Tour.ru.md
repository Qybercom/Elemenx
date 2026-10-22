<!-- generated -->
# Tour

Обучающий тур: страница затемнена, кроме элемента текущего шага, а карточка рядом объясняет его. Steps: [{Target (селектор CSS или элемент), Title, Text, Placement (bottom, top, right, left; побеждает сторона, где есть место)}]. Open показывает его на шаге Step. «Назад», «Далее» и «Готово» переходят; «Пропустить», «Готово» и Escape закрывают его. Шаг, цель которого отсутствует, показывает карточку посередине. Пока тур открыт, страница за ним не принимает нажатия. События: change (новый Step), close (причина: 'skip', 'escape' или 'done'), finish (после последнего шага).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Steps` | `[]` |
| `Open` | `false` |
| `Step` | `0` |
| `Padding` | `6` |
| `BackLabel` | `''` |
| `NextLabel` | `''` |
| `DoneLabel` | `''` |
| `SkipLabel` | `''` |

## События

`change`, `finish`, `close`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Start the tour" Variant="primary" (click)="Start" />
	<span class="docs-tour-search"><Button Label="Search" Icon="search" /></span>
	<span class="docs-tour-share"><Button Label="Share" Icon="share" /></span>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<Tour [steps]="Steps" [open]="Open" [step]="Step" (change)="Changed" (close)="Closed" />
<script>
({
	Open: false,
	Step: 0,
	Note: '',
	Steps: [
		{Target: '.docs-tour-search', Title: 'Search', Text: 'Find anything of the page here.', Placement: 'bottom'},
		{Target: '.docs-tour-share', Title: 'Share', Text: 'Send a link to the page.', Placement: 'bottom'},
		{Target: '.docs-tour-missing', Title: 'The end', Text: 'A step whose target is missing shows its card in the middle.'}
	],

	Start: function () {
		this.Step = 0;
		this.Open = true;
	},

	Changed: function (step) {
		this.Step = step;
	},

	Closed: function (reason) {
		this.Open = false;
		this.Note = 'Closed: ' + reason;
	}
})
</script>
```
