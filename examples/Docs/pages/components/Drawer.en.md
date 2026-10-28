<!-- generated -->
# Drawer

A panel that slides in from an edge of the window over the page (modal: the page behind is inert). Open shows it; the close event (with the reason: 'close', 'escape' or 'backdrop') asks the owner to set Open back to false. Side: right (default), left, top or bottom. Size: small, medium, large or full (the width, or the height for top and bottom). Slots: default (the body), actions (beside the title), footer. Dismissible: false keeps it open on Escape and backdrop presses, which shake it.

## Properties

| Property | Default |
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

## Events

- `close`: It asks to close (the owner sets Open to false): the reason, close, escape or backdrop.

## Slots

`actions`, default, `footer`

## Example

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

## Tests

- [Drawer asks to close with the reason: its close button, Escape; a Dismissible false one shakes and stays](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L53) — `tests/regression/library-overlays.test.js`
