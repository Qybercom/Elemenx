<!-- generated -->
# Jog

Джог диджея: платтер с пластинкой, которая вращается, пока играет трек (Playing, со скоростью Rpm оборотов в минуту: по умолчанию 33.3), её метка там, где Time (оборот — 60 / Rpm секунд). Рука на пластинке останавливает её и скретчит: touch (true, затем false, когда её отпускают) и scratch ({Delta, Time}: на сколько секунд повернули пластинку, вперёд — положительно), пока её крутят. Кольцо вокруг неё меняет темп: перетаскивание по нему или колесо мыши отправляют nudge ({Delta}, от -1 до 1 за четверть оборота). Клавиши: стрелки — nudge, со Shift они скретчат на двадцатую часть оборота. Title и Subtitle написаны на наклейке пластинки; Size — её ширина в пикселях. Трек принадлежит приложению: Time следует за ним, а между его обновлениями платтер вращается сам, пока Playing.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Time` | `0` |
| `Playing` | `false` |
| `Rpm` | `33.3` |
| `Title` | `''` |
| `Subtitle` | `''` |
| `Size` | `220` |
| `Disabled` | `false` |
| `Label` | `''` |

## События

- `touch`
- `nudge`
- `scratch`

## Пример

```example
<div class="docs-row" style="align-items: center;">
	<Jog [time]="Time" [playing]="Playing" Title="Deck A" [subtitle]="Bpm.toFixed(1) + ' BPM'" (touch)="Touched" (scratch)="Scratched" (nudge)="Nudged" />
	<div class="docs-stack">
		<Button [label]="Playing ? 'Pause' : 'Play'" [icon]="Playing ? 'pause' : 'play'" (click)="Toggle" />
		<p class="elemenx-text small">{{Held ? 'Scratching' : Playing ? 'Playing' : 'Paused'}}: {{Time.toFixed(2)}} s</p>
		<p class="elemenx-text small muted">Hold the record to scratch it; turn the ring, or the wheel, to bend the pitch.</p>
	</div>
</div>
<script>
(function () {
	var timer = null;
	var last = 0;

	return {
		Time: 0,
		Playing: false,
		Held: false,
		Bpm: 128,
		Bend: 0,

		$OnReady: function () {
			var self = this;

			/* The track of the page: its time goes on while it plays and no hand holds the record. */
			timer = setInterval(function () {
				var now = Date.now();

				if (self.Playing && !self.Held)
					self.Time += (now - last) / 1000 * (1 + self.Bend);

				/* The bend of the pitch fades back. */
				self.Bend *= 0.9;
				self.Bpm = 128 * (1 + self.Bend);
				last = now;
			}, 100);

			last = Date.now();
		},

		$OnDestroy: function () {
			clearInterval(timer);
		},

		Toggle: function () {
			this.Playing = !this.Playing;
		},

		Touched: function (held) {
			this.Held = held;
		},

		Scratched: function (move) {
			this.Time = Math.max(0, move.Time);
		},

		Nudged: function (nudge) {
			this.Bend = Math.max(-0.08, Math.min(0.08, this.Bend + nudge.Delta * 0.04));
		}
	};
})()
</script>
```

## Тесты

- [puts its marker where Time is, a turn every 60 / Rpm seconds, and turns by itself while Playing](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-jog.test.js#L44) — `tests/regression/library-jog.test.js`
- [a hand on the record touches and scratches it; on the ring, the wheel and the keys it nudges](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-jog.test.js#L104) — `tests/regression/library-jog.test.js`
