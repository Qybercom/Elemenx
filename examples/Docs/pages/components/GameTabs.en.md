<!-- generated -->
# GameTabs

The tabs of a game window: Items [{ID, Label, Disabled}] in a column (Orientation 'vertical', the default) or a row, numbered 01, 02... (Numbered). Value is the ID of the open tab; a press or the arrows (Home, End) open another and emit change with its ID. Label names the list for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Numbered` | `true` |
| `Orientation` | `'vertical'` |
| `Label` | `''` |

## Events

- `change`: Another tab was opened: its ID.

## Example

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
