<!-- generated -->
# GameTabs

Вкладки игрового окна: Items [{ID, Label, Disabled}] в столбик (Orientation 'vertical', по умолчанию) или в ряд, пронумерованные 01, 02... (Numbered). Value — ID открытой вкладки; нажатие или стрелки (Home, End) открывают другую и отправляют change с её ID. Label называет список для экранных читалок.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Numbered` | `true` |
| `Orientation` | `'vertical'` |
| `Label` | `''` |

## События

- `change`: Открыта другая вкладка: её ID.

## Пример

```example
<div class="elemenx-game-panel elemenx-container" style="gap: 16px; padding: 12px; align-items: flex-start;">
	<GameTabs [items]="Tabs" [value]="Tab" Numbered="true" Label="Record" (change)="Chose" />
	<div class="elemenx-column" style="gap: 4px;">
		<strong>{{Pages[Tab].Title}}</strong>
		<p class="elemenx-text small">{{Pages[Tab].Text}}</p>
	</div>
</div>
<GameTabs Orientation="horizontal" [items]="Tabs" [value]="Tab" Label="Record in a row" (change)="Chose" />
<script>
({
	Tab: 'service',
	Tabs: [
		{ID: 'service', Label: 'Service'},
		{ID: 'awards', Label: 'Awards'},
		{ID: 'training', Label: 'Training'},
		{ID: 'remarks', Label: 'Remarks', Disabled: true}
	],
	Pages: {
		service: {Title: 'Service', Text: 'Twelve years with the northern guard.'},
		awards: {Title: 'Awards', Text: 'The silver wolf, for the defence of the gate.'},
		training: {Title: 'Training', Text: 'Sword, bow and the old tongue.'},
		remarks: {Title: 'Remarks', Text: 'Sealed.'}
	},

	Chose: function (id) {
		this.Tab = id;
	}
})
</script>
```
