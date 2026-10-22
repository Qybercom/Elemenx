<!-- generated -->
# Mixer

An audio mixer (the look and the controls; the sound is the application's): a row of MixerChannel strips and the strip of the master bus at the end. Channels: [{ID, Label, Color, Volume, Pan, Mute, Solo, Level, Peak, Knobs}]; Master: the same for the master bus, or null. Min and Max bound the faders in decibels. While a channel is on Solo, the others are left out of the mix and dim (Silenced). The mixer keeps what its strips change in their channels. Events: change ({ID, Key, Value}): ID is the ID of the channel, or 'master'.

## Properties

| Property | Default |
| --- | --- |
| `Channels` | `[]` |
| `Master` | `null` |
| `Min` | `-60` |
| `Max` | `6` |
| `Label` | `''` |

## Events

`change`

## Example

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
