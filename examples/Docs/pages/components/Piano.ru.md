<!-- generated -->
# Piano

Клавиши фортепиано (вид и управление; звук — дело приложения). From — первая нота (C3), Octaves — сколько октав за ней (и их последнее «до»). Нажатие играет ноту, скольжение по клавишам играет пройденные, несколько пальцев — аккорд; чем ниже нажатие на клавише, тем громче (Velocity от 1 до 127). Пока клавиши в фокусе, на них играет и клавиатура компьютера: A W S E D F T G Y H U J K O L P ; ' от первого «до», Z и X сдвигают на октаву вниз и вверх.

- Pressed — ноты, показанные звучащими (мелодия, MIDI-клавиатура); Marks: {нота: класс} помечает ноты (гамма, аккорд), true — метка темы. Ноты пишутся как C4, C#4, Db4 или номерами MIDI.
- Labels — подписи клавиш: 'none'; 'c' (название каждого «до», по умолчанию); 'notes' (название каждой ноты без октавы: C, C#, D...); 'all' (с октавой: C4, C#4...); 'keys' (клавиша компьютера, которая играет ноту сейчас, с учётом Z и X); 'both' (нота и эта клавиша). Size: small, medium или large.

События: noteon ({Note, Midi, Velocity}), noteoff ({Note, Midi}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `From` | `'C3'` |
| `Octaves` | `2` |
| `Pressed` | `[]` |
| `Marks` | `{}` |
| `Labels` | `'c'` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Disabled` | `false` |

## События

- `noteon`: Нота началась: {Note, Midi, Velocity}.
- `noteoff`: Нота закончилась: {Note, Midi}.

## Пример

```example
<RadioGroup Variant="segmented" Label="Labels" [options]="Modes" [value]="Labels" (change)="Labelled" />
<Piano From="C4" Octaves="2" [labels]="Labels" [pressed]="Down" [marks]="Scale" (noteon)="NoteOn" (noteoff)="NoteOff" />
<p class="elemenx-text small muted">{{Note}} · the marked notes are the C major scale; with the focus, A W S E D... play it, Z and X shift an octave.</p>
<Piano From="C4" Octaves="1" Size="small" Labels="all" [pressed]="['C#4', 'F#4', 'A#4']" />
<script>
({
	Note: 'Press a key',
	Labels: 'both',
	Modes: [{Value: 'none', Label: 'none'}, {Value: 'c', Label: 'c'}, {Value: 'notes', Label: 'notes'}, {Value: 'all', Label: 'all'}, {Value: 'keys', Label: 'keys'}, {Value: 'both', Label: 'both'}],
	Down: [],
	Scale: {C4: true, D4: true, E4: true, F4: true, G4: true, A4: true, B4: true, C5: true},

	Labelled: function (value) {
		this.Labels = value;
	},

	NoteOn: function (event) {
		this.Down = this.Down.concat([event.Note]);
		this.Note = event.Note + ' (MIDI ' + event.Midi + ', velocity ' + event.Velocity + ')';
	},

	NoteOff: function (event) {
		this.Down = this.Down.filter(function (note) {
			return note !== event.Note;
		});
	}
})
</script>
```

## Тесты

- [a piano plays the key pressed, louder lower on it, slides over keys, takes the keys of the computer and marks notes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3447) — `tests/examples/ui-kit.spec.js`
