<!-- generated -->
# Mixer

Аудиомикшер (вид и управление; звук — дело приложения): ряд полос MixerChannel и полоса мастер-шины в конце. Channels: [{ID, Label, Color, Volume, Pan, Mute, Solo, Level, Peak, Knobs}]; Master — то же для мастер-шины или null. Min и Max ограничивают фейдеры в децибелах. Пока какой-то канал в Solo, остальные выведены из микса и приглушены (Silenced). Микшер хранит то, что полосы меняют в своих каналах. События: change ({ID, Key, Value}): ID — ID канала или 'master'.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Channels` | `[]` |
| `Master` | `null` |
| `Min` | `-60` |
| `Max` | `6` |
| `Label` | `''` |

## События

- `change`: Изменился элемент полосы: {ID (канал или 'master'), Key, Value}.

## Пример

```example
<Mixer [channels]="Channels" [master]="Master" Label="Studio" (change)="Changed" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Move a fader, turn a knob, mute or solo a strip.',
	Channels: [
		{ID: 'drums', Label: 'Drums', Color: '#e5484d', Volume: -3, Pan: 0, Level: [-12, -14], Peak: [-6, -8], Knobs: [{Label: 'Hi', Value: 2, Unit: ' dB'}, {Label: 'Lo', Value: -1, Unit: ' dB'}]},
		{ID: 'bass', Label: 'Bass', Color: '#f76b15', Volume: -6, Pan: -20, Level: -18, Peak: -10, Knobs: [{Label: 'Hi', Value: 0, Unit: ' dB'}, {Label: 'Lo', Value: 4, Unit: ' dB'}]},
		{ID: 'vocals', Label: 'Vocals', Color: '#0090ff', Volume: 0, Pan: 0, Level: -9, Peak: -4, Knobs: [{Label: 'Hi', Value: 3, Unit: ' dB'}, {Label: 'Lo', Value: -2, Unit: ' dB'}]}
	],
	Master: {Label: 'Master', Volume: 0, Level: [-8, -9], Peak: [-3, -4]},

	Changed: function (event) {
		this.Note = event.ID + ' · ' + event.Key + ' = ' + event.Value;
	}
})
</script>
```

## Тесты

- [Mixer keeps what its strips change in their channels, tells it, and dims the others while one is on Solo](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L364) — `tests/regression/library-controls.test.js`
