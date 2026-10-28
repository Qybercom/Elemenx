<!-- generated -->
# VideoTimeline

The timeline of a video editor (its interface: it plays nothing itself). Tracks [{ID, Kind, Name, Muted, Locked, Hidden, Clips}] of a Kind video, audio or text, each with its Clips [{ID, Name, Start, Duration, In, Length, Color, Thumbnail, Peaks, Text}]: Start and Duration in seconds on the timeline, In the second of its source it starts at, Length the length of its source (a trim stops there), Thumbnail a picture repeated along a video clip, Peaks the levels (0 to 1) drawn along an audio clip, Text the words of a text clip. Time is the playhead, FPS the frames of a second (30: the timecode HH:MM:SS:FF and a step of the arrows), Scale the pixels of a second (zoomed between MinScale and MaxScale), Markers [{ID, Time, Label, Color}] the marks over the ruler, Snap draws a moved edge to the edges near it, the playhead and the marks. Follow keeps the playhead in view as Time changes.

The pointer: a press on the ruler or on an empty track seeks (a drag scrubs), a press on a clip selects it (Shift adds one) and a drag moves the clips selected (one clip goes to another track of its kind too), its edges trim it. The keys: Space asks to play or pause (the play event), the arrows move the playhead by a frame (Shift: a second), Alt with the arrows moves the clips selected, S splits at the playhead, Delete removes the selection, + and - zoom, Home and End go to the start and the end, Escape leaves the selection; Ctrl (or ⌘) with the wheel zooms at the pointer. The heads of the tracks mute, hide and lock them. A locked track keeps its clips as they are.

Methods: Split() (the clips selected, or the ones under the playhead, cut at it), Delete(), Select(ids), Selected(), Zoom(scale), Fit(), Timecode(seconds). Events: change (Tracks), seek ({Time}), select (the IDs), play, zoom ({Scale}).

## Properties

| Property | Default |
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

## Events

- `select`: The selection changed: the IDs of the clips.
- `change`: The tracks changed: Tracks.
- `seek`: The playhead was moved: {Time}.
- `zoom`: The scale changed: {Scale}.
- `play`: Space: play or pause.

## Methods

- `Timecode(seconds)`
- `Selected()`
- `Select(ids)`
- `Zoom(scale, anchor)`
- `Fit()`
- `Split()`
- `Delete()`

## Example

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

## Tests

- [draws the tracks, their clips in place, a wave, the ruler in seconds and the timecode](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L80) — `tests/regression/library-video-timeline.test.js`
- [seeks by a press and a drag on the ruler, steps by frames and seconds by the arrows, and asks to play by Space](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L105) — `tests/regression/library-video-timeline.test.js`
- [selects and moves a clip, carries it to another track of its kind, and keeps it off a track of another kind](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L137) — `tests/regression/library-video-timeline.test.js`
- [trims a clip by its edges, not past its source, and snaps an edge to the playhead](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L178) — `tests/regression/library-video-timeline.test.js`
- [splits at the playhead, deletes the selection, and keeps a locked track as it is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L218) — `tests/regression/library-video-timeline.test.js`
- [zooms by the keys and fits the timeline in view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-video-timeline.test.js#L267) — `tests/regression/library-video-timeline.test.js`
