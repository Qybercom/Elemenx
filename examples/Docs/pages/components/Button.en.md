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

- `click`: Pressed (not while Disabled or Loading): the DOM event of the press.

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

## Tests

- [AriaLabel names it whatever its text; without one its text names it, and an icon button its Title](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/button-names.test.js#L45) — `tests/regression/button-names.test.js`
- [Expanded true or false is its aria-expanded, as it changes; empty, it has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/button-names.test.js#L54) — `tests/regression/button-names.test.js`
- [Rove moves the focus by the arrows round a list, to its ends by Home and End, and lets other keys be](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L38) — `tests/regression/library-game-controls.test.js`
- [numbers the tabs of Tabs when it is told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L66) — `tests/regression/library-game-controls.test.js`
- [GameMenu: its items are Buttons, the arrows go round them, a press tells select and Escape back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L77) — `tests/regression/library-game-controls.test.js`
- [GameDialogue: its choices and its next are Buttons that tell choose and next](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L111) — `tests/regression/library-game-controls.test.js`
- [GameTabs: Tabs of ElemenxUI, numbered, that open another by a press or the arrows and tell change](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-controls.test.js#L133) — `tests/regression/library-game-controls.test.js`
- [Component tags preserve case and do not capture native HTML tags](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/templates.test.js#L69) — `tests/regression/templates.test.js`
- [adds components from the Insert tab of its Ribbon, edits their props and text, and undoes and redoes the changes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L150) — `tests/examples/designer.spec.js`
- [drops components from the Ribbon where the line shows, with words saying where, and moves elements by the grip of the selection](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L221) — `tests/examples/designer.spec.js`
- [declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L478) — `tests/examples/designer.spec.js`
- [sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L514) — `tests/examples/designer.spec.js`

+9 more in the same files
