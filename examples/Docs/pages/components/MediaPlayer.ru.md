<!-- generated -->
# MediaPlayer

Элементы управления видео или звуком поверх плеера браузера (<video> или <audio>, Kind): воспроизведение и пауза, полоса времени (на ней видно загруженное), время, громкость и выключение звука, скорость (Speeds), субтитры (Tracks [{Src, Lang, Label, Default}]), картинка в картинке и полный экран. Он проигрывает то, что проигрывает браузер (Src, Poster); собственного плеера в нём нет. Клавиши, когда плеер в фокусе: Пробел или K — воспроизведение и пауза, стрелки влево и вправо — на 5 секунд назад и вперёд, вверх и вниз — громкость, M — звук, F — полный экран, C — субтитры. Методы: Play(), Pause(), Seek(seconds). События: play, pause, ended, time ({Time, Duration}, не чаще четырёх раз в секунду), volume ({Volume, Muted}).

## Свойства

| Свойство | По умолчанию |
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

## События

- `play`: Началось воспроизведение.
- `pause`: Воспроизведение на паузе.
- `ended`: Воспроизведение дошло до конца.
- `time`: Время сдвинулось: {Time, Duration} (не чаще четырёх раз в секунду).
- `volume`: Громкость изменилась: {Volume, Muted}.

## Методы

- `Play()`
- `Pause()`
- `Seek(seconds)`

## Пример

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

## Тесты

- [MediaPlayer loads the sound, shows its time, mutes, changes the speed and follows the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L540) — `tests/regression/library-new.test.js`
