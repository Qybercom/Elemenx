<!-- generated -->
# Button

A button. Variant: primary, secondary (default), ghost, danger or link; Size: small, medium, large or giant; Shape round makes it round. Icon and IconRight are icons before and after its Label; without a Label it is an icon only, named by its Title. Loading shows a spinner and disables it, Disabled disables it, Pressed (true or false) makes it a toggle button (aria-pressed), Expanded (true or false) tells it opens something (aria-expanded), AriaLabel is its name for a screen reader when its text does not say it (M for Mute the drums), Block stretches it to the full width. Type is the type of the native button (button, submit, reset). Badge puts a badge over its corner, as *badge does: a count, 'dot', 'busy', a text or {Value, Tone, Max, Label}. Events: click.

## Properties

| Property | Default |
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

## Events

`click`

## Slots

default

## Example

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
