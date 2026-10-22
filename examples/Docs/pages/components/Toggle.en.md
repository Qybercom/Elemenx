<!-- generated -->
# Toggle

A switch: a check box drawn as a track with a thumb (role switch). Checked is its state, Label and Description the text beside it; Size: small or medium. Name and Disabled as in a check box. Events: change (Checked).

## Properties

| Property | Default |
| --- | --- |
| `Checked` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Size` | `'medium'` |
| `Name` | `null` |
| `Disabled` | `false` |

## Events

`change`

## Example

```example
<div class="docs-stack">
	<Toggle Label="Notifications" Description="Get a message on every reply" [checked]="Notify" (change)="Notified" />
	<Toggle Label="Sound" Size="small" [checked]="Sound" [disabled]="!Notify" (change)="Sounded" />
	<Toggle Label="Always off" Disabled="true" />
</div>
<p class="elemenx-text small muted">Notifications {{Notify ? 'on' : 'off'}}, sound {{Notify && Sound ? 'on' : 'off'}}.</p>
<script>
({
	Notify: true,
	Sound: false,

	Notified: function (value) {
		this.Notify = value;
	},

	Sounded: function (value) {
		this.Sound = value;
	}
})
</script>
```
