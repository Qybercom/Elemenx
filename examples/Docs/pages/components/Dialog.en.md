<!-- generated -->
# Dialog

A modal dialog. Open shows it; the close event (with the reason: 'close', 'escape' or 'backdrop') asks the owner to set Open back to false. Slots: default (the body), footer (the actions). Size: small, medium, large or full. Dismissible: false keeps it open on Escape and backdrop presses, which shake it (for flows that need an explicit answer).

## Properties

| Property | Default |
| --- | --- |
| `Open` | `false` |
| `Title` | `''` |
| `Description` | `''` |
| `Icon` | `''` |
| `Size` | `'medium'` |
| `Closable` | `true` |
| `Dismissible` | `true` |
| `Padded` | `true` |

## Events

- `close`: It asks to close (the owner sets Open to false): the reason, close, escape or backdrop.

## Slots

default, `footer`

## Example

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
