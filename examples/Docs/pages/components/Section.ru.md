<!-- generated -->
# Section

Раздел с заголовком. Collapsible позволяет свернуть тело; Collapsed — состояние, событие toggle сообщает о нём. Слоты: по умолчанию (тело), before и after (элементы по сторонам заголовка), actions (элементы на правом конце шапки), note (дополнительное содержимое рядом с подписью). NotePlacement: end (подпись справа в шапке, по умолчанию) или below (под линией шапки).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Note` | `''` |
| `NotePlacement` | `'end'` |
| `Level` | `2` |
| `Collapsible` | `false` |
| `Collapsed` | `false` |

## События

`toggle`

## Слоты

`before`, `after`, `note`, `actions`, по умолчанию

## Пример

```example
<Section Title="Settings" Collapsible="true" [collapsed]="Folded" (toggle)="Toggled">
	<Button slot="actions" Icon="refresh" Title="Reload" Size="small" Variant="ghost" />
	<span slot="note" class="elemenx-text small muted">{{Folded ? 'folded' : 'open'}}</span>
	<p class="elemenx-text">The body of the section: press the title to fold it.</p>
</Section>
<Section Title="Account" Icon="user" Note="Note with NotePlacement below: the caption goes under the header line." NotePlacement="below">
	<p class="elemenx-text">A section that does not fold.</p>
</Section>
<script>
({
	Folded: false,

	Toggled: function (value) {
		this.Folded = value;
	}
})
</script>
```
