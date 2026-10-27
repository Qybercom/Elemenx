<!-- generated -->
# Countdown

The time left: to a moment (To: a date, a text of a date or a timestamp) or of a length (Duration, in seconds, that Running counts down and a pause keeps). It shows days, hours, minutes and seconds (Units: auto drops the days and the hours while they are 0; dhms, hms or ms keep them), each with its label under it, or one line with Compact. It emits end once at 0. Methods: Start(), Pause(), Reset(). It counts by the clock of the page, so a tab in the background and a sleep (Cache) show the right time when they come back.

## Properties

| Property | Default |
| --- | --- |
| `To` | `''` |
| `Duration` | `0` |
| `Running` | `true` |
| `Units` | `'auto'` |
| `Compact` | `false` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Events

- `end`: The time ran out.

## Methods

- `Reset()`
- `Start()`
- `Pause()`

## Example

```example
<Countdown [to]="Launch" (end)="Ended" />
<Countdown Duration="90" Compact="true" [running]="Running" />
<Button [label]="Running ? 'Pause' : 'Go on'" Size="small" (click)="Toggled" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Launch: Date.now() + (3 * 24 * 3600 + 5 * 3600 + 12) * 1000,
	Running: true,
	Note: 'Three days to the launch; the second one pauses.',

	Toggled: function () {
		this.Running = !this.Running;
	},

	Ended: function () {
		this.Note = 'Launched';
	}
})
</script>
```
