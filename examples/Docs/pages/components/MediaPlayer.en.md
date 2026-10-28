<!-- generated -->
# MediaPlayer

The controls of a video or a piece of sound over the player of the browser (<video> or <audio>, Kind): play and pause, the bar of the time (what is loaded shown on it), the time, the volume and mute, the speed (Speeds), the subtitles (Tracks [{Src, Lang, Label, Default}]), Picture-in-Picture and the full screen. It plays what the browser plays (Src, Poster); it brings no player of its own. Keys, the player focused: Space or K plays and pauses, the arrows Left and Right go 5 seconds back and on, Up and Down change the volume, M mutes, F goes full screen, C shows the subtitles. Methods: Play(), Pause(), Seek(seconds). Events: play, pause, ended, time ({Time, Duration}, four times a second at most), volume ({Volume, Muted}).

## Properties

| Property | Default |
| --- | --- |
| `Src` | `''` |
| `Kind` | `'video'` |
| `Poster` | `''` |
| `Title` | `''` |
| `Tracks` | `[]` |
| `Speeds` | `[0.5, 0.75, 1, 1.25, 1.5, 2]` |
| `Muted` | `false` |
| `Label` | `''` |
| `Time` | `0` |
| `Duration` | `0` |
| `Volume` | `1` |

## Events

- `play`: It started playing.
- `pause`: It paused.
- `ended`: It reached the end.
- `time`: The time moved: {Time, Duration} (four times a second at most).
- `volume`: The volume changed: {Volume, Muted}.

## Methods

- `Play()`
- `Pause()`
- `Seek(seconds)`

## Example

```example
<MediaPlayer Kind="audio" Title="A tone" [src]="Sound" (ended)="Ended" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'A sound the page makes: the keys Space, the arrows and M work.',
	Sound: '',

	/* Two seconds of a soft tone, as a WAV the page writes. */
	$OnCreate: function () {
		var rate = 8000;
		var length = rate * 2;
		var bytes = new Uint8Array(44 + length);
		var view = new DataView(bytes.buffer);
		var text = function (at, value) {
			var i;

			for (i = 0; i < value.length; i++)
				bytes[at + i] = value.charCodeAt(i);
		};
		var i;

		text(0, 'RIFF');
		view.setUint32(4, 36 + length, true);
		text(8, 'WAVEfmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, 1, true);
		view.setUint32(24, rate, true);
		view.setUint32(28, rate, true);
		view.setUint16(32, 1, true);
		view.setUint16(34, 8, true);
		text(36, 'data');
		view.setUint32(40, length, true);

		for (i = 0; i < length; i++)
			bytes[44 + i] = 128 + Math.round(24 * Math.sin(i / rate * 2 * Math.PI * 440));

		this.Sound = URL.createObjectURL(new Blob([bytes], {type: 'audio/wav'}));
	},

	Ended: function () {
		this.Note = 'The end';
	}
})
</script>
```

## Tests

- [MediaPlayer loads the sound, shows its time, mutes, changes the speed and follows the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L540) — `tests/regression/library-new.test.js`
