<!-- generated -->
# TimelineProgress

The progress of a Timeline, declared in it: the axis filled from its start to To (a moment), Buffer a second, lighter fill (what is loaded, as a player shows it). It shows nothing by itself.

## Properties

| Property | Default |
| --- | --- |
| `To` | `''` |
| `Buffer` | `''` |

## Example

```example
<Timeline Start="0" End="300" Unit="s" [playhead]="At" Seekable="true" (seek)="Seek">
	<TimelineProgress [to]="At" [buffer]="Buffer" />
	<TimelineMark At="95" Label="Goal" Tone="success" />
</Timeline>
<p class="elemenx-text small muted">Played to {{At}} s, loaded to {{Buffer}} s: press the line to seek.</p>
<script>
({
	At: 40,
	Buffer: 120,

	Seek: function (event) {
		this.At = Math.round(event.At);
		this.Buffer = Math.max(this.Buffer, this.At + 60);
	}
})
</script>
```
