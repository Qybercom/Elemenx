<!-- generated -->
# Toggle

A switch: a check box drawn as a track with a thumb (role switch). Checked is its state, Label and Description the text beside it; Size: small or medium; Orientation: horizontal (on to the end of the line) or vertical (on at the top, as the switch of a light). Name and Disabled as in a check box. Events: change (Checked).

- States 3: a switch of three positions (role slider), Value false, null (the middle: auto, inherit, either) or true, from the start (the bottom when vertical) to the end. Labels names them ([off, middle, on]; by default Off, Auto and On in the language of the page) for screen readers, and ShowLabels writes them along the track. A press on the track takes the position under the pointer, a press on the text or Space the next one; the arrows, Home and End move it. With a Name, a form gets 'false', 'null' or 'true'. Events: change (Value).

## Properties

| Property | Default |
| --- | --- |
| `Checked` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Size` | `'medium'` |
| `Orientation` | `'horizontal'` |
| `States` | `2` |
| `Value` | `false` |
| `Labels` | `null` |
| `ShowLabels` | `false` |
| `Name` | `null` |
| `Disabled` | `false` |

## Events

- `change`: It was switched: Checked (Value with States 3).

## Example

```example
<div class="docs-stack">
	<Toggle Label="Notifications" Description="Get a message on every reply" [checked]="Notify" (change)="Notified" />
	<Toggle Label="Sound" Size="small" [checked]="Sound" [disabled]="!Notify" (change)="Sounded" />
	<Toggle Label="Always off" Disabled="true" />
	<Toggle Label="Dark theme" States="3" ShowLabels="true" Labels="Light,System,Dark" [value]="Dark" (change)="Darkened" />
	<div class="docs-row">
		<Toggle Label="Light" Orientation="vertical" [checked]="Light" (change)="Lit" />
		<Toggle Label="Fan" Orientation="vertical" States="3" ShowLabels="true" Labels="Off,Low,High" [value]="Fan" (change)="Fanned" />
	</div>
</div>
<p class="elemenx-text small muted">Notifications {{Notify ? 'on' : 'off'}}, sound {{Notify && Sound ? 'on' : 'off'}}, theme {{Dark === null ? 'of the system' : Dark ? 'dark' : 'light'}}, fan {{Fan === null ? 'low' : Fan ? 'high' : 'off'}}.</p>
<script>
({
	Notify: true,
	Sound: false,
	Dark: null,
	Light: true,
	Fan: false,

	Notified: function (value) {
		this.Notify = value;
	},

	Sounded: function (value) {
		this.Sound = value;
	},

	Darkened: function (value) {
		this.Dark = value;
	},

	Lit: function (value) {
		this.Light = value;
	},

	Fanned: function (value) {
		this.Fan = value;
	}
})
</script>
```
