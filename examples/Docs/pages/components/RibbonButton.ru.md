<!-- generated -->
# RibbonButton

Команда RibbonGroup: <RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" />. Size: large (иконка 32px над подписью, целая колонка группы), small (иконка и подпись в одну строку) или icon (только иконка; Label — её название). Toggle делает её кнопкой, остающейся нажатой (Pressed). Items открывает их меню (пункты MenuList); со Split кнопка выполняет свою команду, а меню открывает только стрелка. KeyTip задаёт её подсказку клавиши. События: click ({ID, Pressed}), select (выбранный пункт). Лента сообщает и о каждой команде: command ({ID, Item}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Icon` | `''` |
| `Size` | `'small'` |
| `Title` | `''` |
| `KeyTip` | `''` |
| `Toggle` | `false` |
| `Pressed` | `false` |
| `Split` | `false` |
| `Items` | `[]` |
| `Disabled` | `false` |

## События

- `click`: Нажата: {ID, Pressed}.
- `select`: Выбран пункт её меню: сам пункт.

## Пример

```example
<div class="docs-frame" style="height: 150px;">
	<Ribbon Collapsible="false" (command)="Command">
		<RibbonTab ID="home" Title="Home">
			<RibbonGroup Title="Sizes">
				<RibbonButton ID="paste" Label="Large" Icon="paste" Size="large" />
				<RibbonButton ID="cut" Label="Small" Icon="cut" />
				<RibbonButton ID="copy" Label="Icon" Icon="copy" Size="icon" />
			</RibbonGroup>
			<RibbonGroup Title="Menus">
				<RibbonButton ID="new" Label="Split" Icon="add" Size="large" Split="true" [items]="[{ID: 'document', Label: 'Document'}, {ID: 'sheet', Label: 'Sheet'}]" />
				<RibbonButton ID="export" Label="Menu" Icon="download" Size="large" [items]="[{ID: 'pdf', Label: 'PDF'}, {ID: 'html', Label: 'HTML'}]" />
			</RibbonGroup>
			<RibbonGroup Title="Toggle">
				<RibbonButton ID="bold" Label="Bold" Icon="bold" Size="large" Toggle="true" [pressed]="Bold" (click)="Toggled" />
			</RibbonGroup>
		</RibbonTab>
	</Ribbon>
</div>
<p class="elemenx-text small">Last command: {{Last}} · Bold: {{Bold ? 'on' : 'off'}}</p>
<script>
({
	Last: '—',
	Bold: false,

	Command: function (event) {
		this.Last = event.ID + (event.Item && event.Item.ID ? ' / ' + event.Item.ID : '');
	},

	Toggled: function (event) {
		this.Bold = event.Pressed;
	}
})
</script>
```

## Тесты

- [Ribbon: the first control of the panel a person can see, after ArrowDown on its tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L84) — `tests/regression/focus-on-open.test.js`
