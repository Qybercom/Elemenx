<!-- generated -->
# Dialog

Модальный диалог. Open показывает его; событие close (с причиной: 'close', 'escape' или 'backdrop') просит владельца вернуть Open в false. Слоты: по умолчанию (тело), footer (действия). Size: small, medium, large или full. Dismissible: false не закрывает его по Escape и нажатию на фон — диалог вздрагивает (для сценариев, где нужен явный ответ).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Open` | `false` |
| `Title` | `''` |
| `Description` | `''` |
| `Icon` | `''` |
| `Size` | `'medium'` |
| `Closable` | `true` |
| `Dismissible` | `true` |
| `Padded` | `true` |

## События

`close`

## Слоты

по умолчанию, `footer`

## Пример

```example
<Button Label="Open the dialog" Variant="primary" (click)="Open" />
<span class="elemenx-text small muted">{{Note}}</span>
<Dialog Title="Project settings" Description="Changes apply to every member." Icon="settings" [open]="Opened" (close)="Close">
	<Field Label="Name"><Input [value]="Name" (input)="Typed" /></Field>
	<Button slot="footer" Label="Cancel" (click)="Close" />
	<Button slot="footer" Label="Save" Variant="primary" (click)="Save" />
</Dialog>
<script>
({
	Opened: false,
	Name: 'Elemenx',
	Note: '',

	Open: function () {
		this.Opened = true;
	},

	Typed: function (value) {
		this.Name = value;
	},

	Close: function (reason) {
		this.Opened = false;
		this.Note = 'Closed' + (typeof reason === 'string' ? ': ' + reason : '');
	},

	Save: function () {
		this.Opened = false;
		this.Note = 'Saved: ' + this.Name;
	}
})
</script>
```
