<!-- generated -->
# Drawer

Панель, выезжающая от края окна поверх страницы (модальная: страница за ней неактивна). Open показывает её; событие close (с причиной: 'close', 'escape' или 'backdrop') просит владельца вернуть Open в false. Side: right (по умолчанию), left, top или bottom. Size: small, medium, large или full (ширина, а для top и bottom — высота). Слоты: по умолчанию (тело), actions (рядом с заголовком), footer. Dismissible: false не закрывает её по Escape и нажатию на фон — панель вздрагивает.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Open` | `false` |
| `Title` | `''` |
| `Description` | `''` |
| `Icon` | `''` |
| `Side` | `'right'` |
| `Size` | `'medium'` |
| `Closable` | `true` |
| `Dismissible` | `true` |
| `Padded` | `true` |

## События

`close`

## Слоты

`actions`, по умолчанию, `footer`

## Пример

```example
<Button Label="Filters" Icon="filter" (click)="Open" />
<Button Label="Menu from the left" Icon="menu" Variant="ghost" (click)="OpenLeft" />
<Drawer [open]="Opened" [side]="Side" Title="Filters" Description="A drawer over the page" Icon="filter" (close)="Close">
	<Field Label="Status"><RadioGroup [options]="[{Value: 'all', Label: 'All'}, {Value: 'open', Label: 'Open'}, {Value: 'closed', Label: 'Closed'}]" Value="all" /></Field>
	<Toggle Label="Only mine" />
	<Button slot="footer" Label="Reset" Variant="ghost" (click)="Close" />
	<Button slot="footer" Label="Apply" Variant="primary" (click)="Close" />
</Drawer>
<script>
({
	Opened: false,
	Side: 'right',

	Open: function () {
		this.Side = 'right';
		this.Opened = true;
	},

	OpenLeft: function () {
		this.Side = 'left';
		this.Opened = true;
	},

	Close: function () {
		this.Opened = false;
	}
})
</script>
```
