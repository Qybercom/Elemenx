<!-- generated -->
# SplitButton

Кнопка с главным действием и стрелкой рядом, которая открывает меню остальных действий (Сохранить, а под стрелкой — Сохранить как, Экспорт...). Нажатие на кнопку отправляет click; пункт меню отправляет select с пунктом, как в Menu. Items и объявленные внутри MenuItem после них. Placement говорит, где открывается меню (по умолчанию bottom-end, под стрелкой); Sheet показывает его как лист снизу экрана, как это делает Menu.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Icon` | `''` |
| `Items` | `[]` |
| `Variant` | `'primary'` |
| `Size` | `'medium'` |
| `Placement` | `'bottom-end'` |
| `Sheet` | `false` |
| `Disabled` | `false` |

## События

- `click`: Нажата главная кнопка.
- `select`: Выбран пункт меню: пункт.

## Слоты

по умолчанию

## Пример

```example
<SplitButton Label="Save" Icon="save" [items]="Items" (click)="Saved" (select)="Picked" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Items: [{ID: 'copy', Label: 'Save a copy', Icon: 'copy'}, {ID: 'pdf', Label: 'Export PDF', Icon: 'download'}, {Separator: true}, {ID: 'discard', Label: 'Discard changes', Danger: true}],
	Note: 'Press Save, or the arrow for the other actions.',

	Saved: function () {
		this.Note = 'Saved';
	},

	Picked: function (item) {
		this.Note = item.Label;
	}
})
</script>
```
