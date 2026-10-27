<!-- generated -->
# TimelineProgress

Прогресс Timeline, объявленный внутри него: ось залита от начала до момента To, Buffer — вторая, более светлая заливка (загруженное, как у проигрывателя). Сам ничего не показывает.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `To` | `''` |
| `Buffer` | `''` |

## Пример

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
