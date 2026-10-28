<!-- generated -->
# VideoTimeline

Монтажный стол видеоредактора (его интерфейс: сам он ничего не воспроизводит). Tracks [{ID, Kind, Name, Muted, Locked, Hidden, Clips}] вида video, audio или text, у каждой — свои Clips [{ID, Name, Start, Duration, In, Length, Color, Thumbnail, Peaks, Text}]: Start и Duration — секунды на шкале, In — секунда источника, с которой клип начинается, Length — длина источника (на ней обрезка останавливается), Thumbnail — картинка, повторённая вдоль видеоклипа, Peaks — уровни (от 0 до 1), нарисованные вдоль аудиоклипа, Text — слова текстового клипа. Time — указатель воспроизведения, FPS — кадров в секунду (30: таймкод ЧЧ:ММ:СС:КК и шаг стрелок), Scale — пикселей на секунду (масштаб между MinScale и MaxScale), Markers [{ID, Time, Label, Color}] — метки над линейкой, Snap притягивает двигаемый край к ближним краям, указателю и меткам. Follow держит указатель в поле зрения, пока меняется Time.

Указатель мыши: нажатие на линейку или на пустую дорожку перематывает (протяжка — скраб), нажатие на клип выделяет его (Shift добавляет ещё один), протяжка двигает выделенные клипы (один клип переходит и на другую дорожку своего вида), а его края обрезают его. Клавиши: Space просит воспроизвести или остановить (событие play), стрелки двигают указатель на кадр (с Shift — на секунду), Alt со стрелками двигает выделенные клипы, S режет по указателю, Delete удаляет выделенное, + и - меняют масштаб, Home и End идут в начало и в конец, Escape снимает выделение; Ctrl (или ⌘) с колесом меняет масштаб у указателя мыши. Заголовки дорожек выключают звук, скрывают и блокируют их. Заблокированная дорожка не даёт менять свои клипы.

Методы: Split() (выделенные клипы, а без них — те, что под указателем, разрезаются по нему), Delete(), Select(ids), Selected(), Zoom(scale), Fit(), Timecode(seconds). События: change (Tracks), seek ({Time}), select (ID), play, zoom ({Scale}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Tracks` | `[]` |
| `Time` | `0` |
| `Duration` | `null` |
| `Scale` | `40` |
| `MinScale` | `2` |
| `MaxScale` | `400` |
| `FPS` | `30` |
| `Markers` | `[]` |
| `Snap` | `true` |
| `Follow` | `true` |
| `ReadOnly` | `false` |
| `Label` | `''` |

## События

- `select`: Выделение изменилось: ID клипов.
- `change`: Дорожки изменились: Tracks.
- `seek`: Указатель передвинут: {Time}.
- `zoom`: Масштаб изменился: {Scale}.
- `play`: Space: воспроизвести или остановить.

## Методы

- `Timecode(seconds)`
- `Selected()`
- `Select(ids)`
- `Zoom(scale, anchor)`
- `Fit()`
- `Split()`
- `Delete()`

## Пример

```example
<div class="docs-stack">
	<VideoTimeline [tracks]="Tracks" [time]="Time" [markers]="Markers" Scale="24" (change)="Changed" (seek)="Sought" (play)="Toggle" (select)="Selected" />
	<div class="docs-row">
		<Button [label]="Playing ? 'Pause' : 'Play'" [icon]="Playing ? 'pause' : 'play'" (click)="Toggle" />
		<span class="elemenx-text small muted">{{Note}}</span>
	</div>
</div>
<script>
(function () {
	var timer = null;
	var thumbnail = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 45"><rect width="80" height="45" fill="#2f4f7f"/><circle cx="58" cy="14" r="8" fill="#ffe08a"/><path d="M0 45L22 20l14 14 10-8 34 19z" fill="#1b2f4d"/><rect width="80" height="45" fill="none" stroke="#000" stroke-opacity="0.35"/></svg>');
	var peaks = [];
	var k;

	for (k = 0; k < 120; k++) peaks.push(0.25 + Math.abs(Math.sin(k / 5)) * 0.5 + (k % 7) / 40);

	return {
		Time: 3,
		Playing: false,
		Note: 'Drag a clip or its edges, S cuts at the playhead, Space plays.',
		Markers: [{ID: 'cut', Time: 12, Label: 'Cut to the interview'}],
		Tracks: [
			{ID: 'titles', Kind: 'text', Name: 'Titles', Clips: [{ID: 't1', Name: 'Title', Text: 'The Long Light', Start: 1, Duration: 4}]},
			{ID: 'v1', Kind: 'video', Name: 'Video 1', Clips: [
				{ID: 'intro', Name: 'Intro', Start: 0, Duration: 12, Length: 20, Thumbnail: thumbnail},
				{ID: 'interview', Name: 'Interview', Start: 12, Duration: 16, In: 4, Length: 60, Thumbnail: thumbnail}
			]},
			{ID: 'v2', Kind: 'video', Name: 'Video 2', Clips: [{ID: 'broll', Name: 'B-roll', Start: 18, Duration: 6, Length: 10}]},
			{ID: 'a1', Kind: 'audio', Name: 'Music', Clips: [{ID: 'music', Name: 'Theme', Start: 0, Duration: 30, Length: 180, Peaks: peaks}]}
		],

		$OnDestroy: function () {
			clearInterval(timer);
		},

		Changed: function (tracks) {
			this.Tracks = tracks;
		},

		Sought: function (value) {
			this.Time = value.Time;
		},

		Selected: function (ids) {
			this.Note = ids.length ? 'Selected: ' + ids.join(', ') : 'Nothing selected';
		},

		/* Playing here moves the playhead only: the timeline is an interface. */
		Toggle: function () {
			var self = this;

			this.Playing = !this.Playing;

			clearInterval(timer);

			if (this.Playing)
				timer = setInterval(function () {
					self.Time = Math.round((self.Time + 0.1) * 10) / 10;

					if (self.Time >= 40) self.Time = 0;
				}, 100);
		}
	};
})()
</script>
```

## Тесты

- [draws the tracks, their clips in place, a wave, the ruler in seconds and the timecode](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L80) — `tests/regression/library-video-timeline.test.js`
- [seeks by a press and a drag on the ruler, steps by frames and seconds by the arrows, and asks to play by Space](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L105) — `tests/regression/library-video-timeline.test.js`
- [selects and moves a clip, carries it to another track of its kind, and keeps it off a track of another kind](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L137) — `tests/regression/library-video-timeline.test.js`
- [trims a clip by its edges, not past its source, and snaps an edge to the playhead](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L178) — `tests/regression/library-video-timeline.test.js`
- [splits at the playhead, deletes the selection, and keeps a locked track as it is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L218) — `tests/regression/library-video-timeline.test.js`
- [zooms by the keys and fits the timeline in view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L267) — `tests/regression/library-video-timeline.test.js`
