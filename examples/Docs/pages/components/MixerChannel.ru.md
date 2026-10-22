<!-- generated -->
# MixerChannel

Полоса канала аудиомикшера (вид и управление; звук — дело приложения): Label, крутилки Knobs (эквалайзер, посылы: [{Label, Value, Min, Max, Origin, Default, Unit}]), панорама Pan (от −100 влево до 100 вправо), кнопки Mute и Solo, фейдер громкости Volume в децибелах между Min и Max и индикатор уровня Level рядом: уровень в децибелах или [left, right] для стерео, с удерживаемым пиком Peak. Master — полоса мастер-шины (без Solo); Silenced приглушает полосу, исключённую чужим Solo (задаёт Mixer); Color помечает полосу. События: change ({ID, Key, Value}): Key — Volume, Pan, Mute, Solo или Label крутилки.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `null` |
| `Label` | `''` |
| `Color` | `''` |
| `Volume` | `0` |
| `Min` | `-60` |
| `Max` | `6` |
| `Pan` | `0` |
| `ShowPan` | `true` |
| `Mute` | `false` |
| `Solo` | `false` |
| `Master` | `false` |
| `Silenced` | `false` |
| `Level` | `null` |
| `Peak` | `null` |
| `Knobs` | `[]` |
| `Disabled` | `false` |

## События

`change`

## Пример

```example
<div class="elemenx-container" style="gap: 8px;">
	<MixerChannel ID="guitar" Label="Guitar" Color="#30a46c" [volume]="Volume" [pan]="Pan" [level]="[-14, -16]" [peak]="[-8, -9]" [knobs]="[{Label: 'Gain', Value: 4, Min: 0, Max: 12, Unit: ' dB'}]" (change)="Changed" />
	<MixerChannel ID="master" Label="Master" Master="true" Volume="0" [level]="[-8, -9]" [peak]="[-3, -4]" />
</div>
<p class="elemenx-text small muted">Volume {{Volume}} dB · pan {{Pan}}</p>
<script>
({
	Volume: -6,
	Pan: 10,

	Changed: function (event) {
		if (event.Key === 'Volume') this.Volume = event.Value;
		else if (event.Key === 'Pan') this.Pan = event.Value;
	}
})
</script>
```
