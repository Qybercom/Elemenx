<!-- generated -->
# Button

Кнопка. Variant: primary, secondary (по умолчанию), ghost, danger или link; Size: small, medium, large или giant; Shape round делает её круглой. Icon и IconRight — иконки до и после подписи Label; без Label кнопка — только иконка, и её название берётся из Title. Loading показывает вращающийся индикатор и выключает кнопку, Disabled выключает её, Pressed (true или false) делает её переключателем (aria-pressed), Expanded (true или false) говорит, что она раскрывает и закрывает что-то (aria-expanded), AriaLabel — её имя для скринридера, когда текст его не передаёт (M — «Выключить звук барабанов»), Block растягивает на всю ширину. Type — тип нативной кнопки (button, submit, reset). Badge ставит в угол значок, как директива *badge: число, 'dot', 'busy', текст или {Value, Tone, Max, Label}. Событие click.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Variant` | `'secondary'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Icon` | `''` |
| `IconRight` | `''` |
| `Type` | `'button'` |
| `Title` | `''` |
| `Disabled` | `false` |
| `Loading` | `false` |
| `Block` | `false` |
| `Pressed` | `null` |
| `Expanded` | `null` |
| `AriaLabel` | `''` |
| `Badge` | `''` |

## События

- `click`: Нажата (не когда Disabled или Loading): DOM-событие нажатия.

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Primary" Variant="primary" (click)="Clicked" />
	<Button Label="Secondary" Icon="add" (click)="Clicked" />
	<Button Label="Ghost" Variant="ghost" (click)="Clicked" />
	<Button Label="Danger" Variant="danger" Icon="delete" (click)="Clicked" />
	<Button Label="A link" Variant="link" (click)="Clicked" />
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Small" Size="small" />
	<Button Label="Large" Size="large" />
	<Button Label="Giant" Size="giant" Variant="primary" />
	<Button Icon="bell" Title="Notifications" Badge="3" />
	<Button Icon="settings" Title="Settings" Shape="round" />
	<Button Label="Saving" [loading]="Saving" (click)="Save" />
	<Button Label="Bold" Icon="bold" [pressed]="Bold" (click)="ToggleBold" />
</div>
<Button Label="Block: the full width" Block="true" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	Saving: false,
	Bold: false,

	Clicked: function (event, button) {
		this.Note = 'Pressed: ' + button.Label;
	},

	Save: function () {
		var self = this;

		this.Saving = true;

		setTimeout(function () {
			self.Saving = false;
			self.Note = 'Saved';
		}, 1200);
	},

	ToggleBold: function () {
		this.Bold = !this.Bold;
	}
})
</script>
```
