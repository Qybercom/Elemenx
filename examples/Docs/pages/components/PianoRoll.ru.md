<!-- generated -->
# PianoRoll

Ноты партии, чтобы видеть и править их: клавиши пианино слева (от Low до High, номера MIDI: по умолчанию от C3 до C6), доли поперёк (Bars тактов по Beats долей). Notes: [{ID, Note (MIDI), Start, Length (в долях), Velocity (от 0 до 1)}]. Нажатие на сетку ставит туда ноту (длиной как последняя; перетаскивание удлиняет её), перетаскивание двигает выделенные ноты (по времени и по высоте), перетаскивание конца ноты меняет её длину; двойное нажатие убирает ноту. Время привязывается к шагу Snap долей (четверть: шестнадцатая нота). Нажатие выделяет ноту, Shift добавляет к выделению. Клавиши: Delete убирает выделенные ноты, стрелки двигают их (на Snap, на полутон; Shift со стрелкой вверх или вниз — на октаву), Shift со стрелкой влево или вправо меняет их длину, Mod+A выделяет все ноты, Escape снимает выделение. Position — курсор воспроизведения (в долях; -1 — нет), Loop ({Start, End}) отмечен на линейке; нажатие на линейку — seek. Нажатие на клавишу пианино отправляет key. События: change (Notes), select (ID выделенных), key (её номер MIDI), seek (доля).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Notes` | `[]` |
| `Low` | `48` |
| `High` | `84` |
| `Bars` | `4` |
| `Beats` | `4` |
| `Snap` | `0.25` |
| `Position` | `-1` |
| `Loop` | `null` |
| `ReadOnly` | `false` |
| `Label` | `''` |

## События

- `change`
- `select`
- `key`
- `seek`

## Пример

```example
<div class="docs-stack">
	<div class="docs-row">
		<Button [label]="Playing ? 'Stop' : 'Play'" [icon]="Playing ? 'pause' : 'play'" (click)="Toggle" />
		<Checkbox Label="Metronome" [checked]="Metronome" (change)="Clicked" />
		<Checkbox Label="Loop" [checked]="Looping" (change)="Looped" />
	</div>
	<PianoRoll [notes]="Notes" Bars="2" [position]="Position" [loop]="Looping ? {Start: 0, End: 8} : null" Height="260" (change)="Changed" (key)="Preview" (seek)="Seek" />
	<p class="elemenx-text small muted">Press the grid to put a note, drag it to move it, drag its end to resize it; a double press takes it away. Delete, the arrows and Shift edit the notes selected.</p>
</div>
<script>
(function () {
	var transport = null;
	var synth = null;
	var frame = 0;

	return {
		Notes: [
			{ID: 'a', Note: 60, Start: 0, Length: 1}, {ID: 'b', Note: 64, Start: 1, Length: 1}, {ID: 'c', Note: 67, Start: 2, Length: 1},
			{ID: 'd', Note: 72, Start: 3, Length: 1}, {ID: 'e', Note: 71, Start: 4, Length: 0.5}, {ID: 'f', Note: 67, Start: 4.5, Length: 0.5},
			{ID: 'g', Note: 64, Start: 5, Length: 1}, {ID: 'h', Note: 62, Start: 6, Length: 2}
		],
		Playing: false,
		Metronome: false,
		Looping: true,
		Position: -1,

		/* The instrument and the transport of the Audio Service, made at the first sound (after a press: the browser asks it). */
		Audio: function () {
			var audio = this.$Service('Audio');

			if (!transport) {
				synth = audio.Instrument({Wave: 'triangle', Envelope: {Attack: 0.01, Decay: 0.2, Sustain: 0.5, Release: 0.3}, Gain: 0.3});
				transport = audio.Transport({Bpm: 110, Instrument: synth});
				transport.On('end', this.Ended.bind(this));
			}

			transport.Set({Notes: this.Notes, Metronome: this.Metronome, Loop: this.Looping ? {Start: 0, End: 8} : null});

			return transport;
		},

		$OnDestroy: function () {
			cancelAnimationFrame(frame);

			if (transport)
				transport.Destroy();

			if (synth)
				synth.Destroy();
		},

		/* The playhead follows the transport, a frame at a time. */
		Follow: function () {
			var self = this;

			cancelAnimationFrame(frame);

			(function step () {
				if (!transport || !transport.Playing) return;

				self.Position = transport.Position();
				frame = requestAnimationFrame(step);
			})();
		},

		Toggle: function () {
			if (this.Playing) {
				transport.Stop();
				this.Ended();

				return;
			}

			this.Audio().Play();
			this.Playing = true;
			this.Follow();
		},

		Ended: function () {
			this.Playing = false;
			this.Position = -1;
		},

		Changed: function (notes) {
			this.Notes = notes;

			if (transport)
				transport.Set({Notes: notes});
		},

		Preview: function (note) {
			this.Audio();
			synth.Play(note, {Duration: 0.3});
		},

		Seek: function (beat) {
			this.Audio().Seek(beat);
			this.Position = beat;
		},

		Clicked: function (value) {
			this.Metronome = value;

			if (transport)
				transport.Set({Metronome: value});
		},

		Looped: function (value) {
			this.Looping = value;

			if (transport)
				transport.Set({Loop: value ? {Start: 0, End: 8} : null});
		}
	};
})()
</script>
```
