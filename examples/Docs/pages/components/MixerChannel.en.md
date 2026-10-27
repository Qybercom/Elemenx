<!-- generated -->
# MixerChannel

A channel strip of an audio mixer (the look and the controls; the sound is the application's): its Label, Knobs (an equalizer, sends: [{Label, Value, Min, Max, Origin, Default, Unit}]), the Pan (-100 left to 100 right), the buttons Mute and Solo, the fader of its Volume in decibels between Min and Max, and the meter of its Level beside it: a level in decibels, or [left, right] for stereo, with the Peak held over it. Master is the strip of the master bus (no Solo); Silenced dims a strip another one's Solo leaves out (the Mixer sets it); Color marks the strip. Events: change ({ID, Key, Value}): Key is Volume, Pan, Mute, Solo or the Label of a knob.

## Properties

| Property | Default |
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

## Events

- `change`: A control of the strip changed: {ID, Key (Volume, Pan, Mute, Solo or the Label of a knob), Value}.

## Example

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
