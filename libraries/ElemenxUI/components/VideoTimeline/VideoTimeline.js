/*
 * The timeline of a video editor (its interface: it plays nothing itself). Tracks [{ID, Kind, Name, Muted, Locked,
 * Hidden, Clips}] of a Kind video, audio or text, each with its Clips [{ID, Name, Start, Duration, In, Length, Color,
 * Thumbnail, Peaks, Text}]: Start and Duration in seconds on the timeline, In the second of its source it starts at,
 * Length the length of its source (a trim stops there), Thumbnail a picture repeated along a video clip, Peaks the
 * levels (0 to 1) drawn along an audio clip, Text the words of a text clip. Time is the playhead, FPS the frames of a
 * second (30: the timecode HH:MM:SS:FF and a step of the arrows), Scale the pixels of a second (zoomed between
 * MinScale and MaxScale), Markers [{ID, Time, Label, Color}] the marks over the ruler, Snap draws a moved edge to the
 * edges near it, the playhead and the marks. Follow keeps the playhead in view as Time changes.
 *
 * The pointer: a press on the ruler or on an empty track seeks (a drag scrubs), a press on a clip selects it (Shift adds
 * one) and a drag moves the clips selected (one clip goes to another track of its kind too), its edges trim it. The
 * keys: Space asks to play or pause (the play event), the arrows move the playhead by a frame (Shift: a second), Alt
 * with the arrows moves the clips selected, S splits at the playhead, Delete removes the selection, + and - zoom, Home
 * and End go to the start and the end, Escape leaves the selection; Ctrl (or ⌘) with the wheel zooms at the pointer.
 * The heads of the tracks mute, hide and lock them. A locked track keeps its clips as they are.
 *
 * Methods: Split() (the clips selected, or the ones under the playhead, cut at it), Delete(), Select(ids), Selected(),
 * Zoom(scale), Fit(), Timecode(seconds). Events: change (Tracks), seek ({Time}), select (the IDs), play, zoom ({Scale}).
 */
Elemenx.Component('VideoTimeline', {
	$TemplateURL: 'VideoTimeline.html',
	$StyleURL: 'VideoTimeline.css',
	$Meta: {
		Group: 'media',
		Icon: 'video',
		Description: 'The timeline of a video editor: tracks of video, audio and text with their clips, a ruler in timecode, a playhead, moves, trims, cuts, snapping and zoom.',
		Events: {
			change: 'The tracks changed: Tracks.',
			seek: 'The playhead was moved: {Time}.',
			select: 'The selection changed: the IDs of the clips.',
			play: 'Space: play or pause.',
			zoom: 'The scale changed: {Scale}.'
		},
		Methods: ['Split()', 'Delete()', 'Select(ids)', 'Selected()', 'Zoom(scale)', 'Fit()', 'Timecode(seconds)'],
		Props: {
			Tracks: 'The tracks: [{ID, Kind, Name, Muted, Locked, Hidden, Clips: [{ID, Name, Start, Duration, In, Length, Color, Thumbnail, Peaks, Text}]}].',
			Time: 'The playhead, in seconds.',
			Duration: 'The length of the timeline (its clips and 10 seconds more by default).',
			Scale: 'The pixels of a second.',
			MinScale: 'The lowest scale (2).',
			MaxScale: 'The highest scale (400).',
			FPS: 'The frames of a second (30).',
			Markers: 'The marks over the ruler: [{ID, Time, Label, Color}].',
			Snap: 'Draws a moved edge to the edges, the playhead and the marks near it.',
			Follow: 'Keeps the playhead in view as Time changes.',
			ReadOnly: 'Shows the timeline without letting the clips change.',
			Label: 'The name of the timeline for screen readers.'
		},
		Sample: {Time: 4, Tracks: [{ID: 'v1', Kind: 'video', Name: 'Video 1', Clips: [{ID: 'a', Name: 'Intro', Start: 0, Duration: 6}, {ID: 'b', Name: 'Interview', Start: 6, Duration: 10}]}, {ID: 'a1', Kind: 'audio', Name: 'Music', Clips: [{ID: 'm', Name: 'Theme', Start: 0, Duration: 16, Peaks: [0.2, 0.6, 0.4, 0.8, 0.5, 0.3]}]}]}
	},
	Tracks: [],
	Time: 0,
	Duration: null,
	Scale: 40,
	MinScale: 2,
	MaxScale: 400,
	FPS: 30,
	Markers: [],
	Snap: true,
	Follow: true,
	ReadOnly: false,
	Label: '',
	Chosen: [],
	Guide: null,

	$OnCreate: function () {
		var own = {Drag: null, Sequence: 0, Wheel: null};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();

		own.Wheel = function (event) {
			self.Wheeled(event);
		};

		this.Scroller().addEventListener('wheel', own.Wheel, {passive: false});
	},

	$OnProps: function (changed) {
		if ((!changed || changed.Time) && this.Follow !== false && this.Follow !== 'false')
			this.Reveal();
	},

	$OnDestroy: function () {
		this.Scroller().removeEventListener('wheel', this.Own().Wheel);
	},

	Scroller: function () {
		return this.$Element().querySelector('.elemenx-video-timeline-scroller');
	},

	Editable: function () {
		return !(this.ReadOnly && this.ReadOnly !== 'false');
	},

	/* Numbers and text. */
	FrameRate: function () {
		return Math.max(1, Number(this.FPS) || 30);
	},

	Pixels: function () {
		return Math.max(Number(this.MinScale) || 2, Math.min(Number(this.MaxScale) || 400, Number(this.Scale) || 40));
	},

	/* A moment as a timecode: HH:MM:SS:FF. */
	Timecode: function (seconds) {
		var fps = this.FrameRate();
		var frames = Math.max(0, Math.round((Number(seconds) || 0) * fps));
		var pad = function (value) {
			return (value < 10 ? '0' : '') + value;
		};

		return pad(Math.floor(frames / (fps * 3600))) + ':' + pad(Math.floor(frames / (fps * 60)) % 60) + ':' + pad(Math.floor(frames / fps) % 60) + ':' + pad(frames % fps);
	},

	/* A label of the ruler: m:ss, or the frame past the second when a tick falls inside one. */
	Clock: function (seconds) {
		var whole = Math.floor(seconds + 1e-6);
		var frame = Math.round((seconds - whole) * this.FrameRate());
		var text = Math.floor(whole / 60) + ':' + (whole % 60 < 10 ? '0' : '') + whole % 60;

		return frame ? text + ':' + (frame < 10 ? '0' : '') + frame : text;
	},

	End: function (clip) {
		return Number(clip.Start) + Number(clip.Duration);
	},

	/* The length of the timeline: Duration, or the end of the last clip and 10 seconds more. */
	Total: function () {
		var self = this;
		var last = 0;

		if (Number(this.Duration) > 0) return Number(this.Duration);

		(this.Tracks || []).forEach(function (track) {
			(track.Clips || []).forEach(function (clip) {
				last = Math.max(last, self.End(clip));
			});
		});

		return Math.max(30, last + 10);
	},

	Width: function () {
		return Math.ceil(this.Total() * this.Pixels());
	},

	/* The ticks of the ruler: a step whose labels stand 80 pixels apart or more, and four smaller ticks between. */
	Ticks: function () {
		var scale = this.Pixels();
		var steps = [1 / this.FrameRate(), 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];
		var step = steps.filter(function (each) {
			return each * scale >= 80;
		})[0] || 3600;
		var minor = step / 5;
		var total = this.Total();
		var ticks = [];
		var k;

		for (k = 0; k * minor <= total + 1e-6; k++) {
			ticks.push({Key: k, X: Math.round(k * minor * scale), Major: k % 5 === 0, Label: k % 5 === 0 ? this.Clock(k * minor) : ''});
		}

		return ticks;
	},

	/* The style of a clip: its place, its width and its color. */
	Place: function (clip, track) {
		var color = clip.Color || (track.Kind === 'audio' ? 'var(--elemenx-success)' : track.Kind === 'text' ? 'var(--elemenx-warning)' : 'var(--elemenx-accent)');

		return 'left: ' + Math.round(Number(clip.Start) * this.Pixels()) + 'px; width: ' + Math.max(2, Math.round(Number(clip.Duration) * this.Pixels())) + 'px; --elemenx-clip: ' + color + (clip.Thumbnail ? '; --elemenx-clip-picture: url("' + String(clip.Thumbnail).replace(/"/g, '%22') + '")' : '');
	},

	/* The levels of an audio clip as a path of a box of 100 by 100, mirrored around its middle. */
	Wave: function (clip) {
		var peaks = clip.Peaks || [];
		var top = [];
		var bottom = [];

		if (!peaks.length) return '';

		peaks.forEach(function (peak, index) {
			var x = peaks.length > 1 ? index / (peaks.length - 1) * 100 : 50;
			var level = Math.max(0.02, Math.min(1, Number(peak) || 0)) * 46;

			top.push(Math.round(x * 10) / 10 + ' ' + Math.round((50 - level) * 10) / 10);

			bottom.unshift(Math.round(x * 10) / 10 + ' ' + Math.round((50 + level) * 10) / 10);
		});

		return 'M' + top.join('L') + 'L' + bottom.join('L') + 'Z';
	},

	KindIcon: function (kind) {
		return kind === 'audio' ? 'volume' : kind === 'text' ? 'type' : 'video';
	},

	Head: function () {
		return Math.round(this.Time * this.Pixels());
	},

	Marked: function (marker) {
		return 'left: ' + Math.round(Number(marker.Time) * this.Pixels()) + 'px' + (marker.Color ? '; --elemenx-marker: ' + marker.Color : '');
	},

	/* Finding. */
	Copy: function () {
		return JSON.parse(JSON.stringify(this.Tracks || []));
	},

	/* A clip of tracks by its ID: {Clip, Track, Index}, or null. */
	Find: function (id, tracks) {
		var list = tracks || this.Tracks || [];
		var i;
		var k;

		for (i = 0; i < list.length; i++) {
			for (k = 0; k < (list[i].Clips || []).length; k++) {
				if (String(list[i].Clips[k].ID) === String(id))
					return {Clip: list[i].Clips[k], Track: list[i], Index: k};
			}
		}

		return null;
	},

	Selected: function () {
		return this.Chosen.slice();
	},

	Select: function (ids) {
		var self = this;
		var list = (ids || []).filter(function (id) {
			return !!self.Find(id);
		});

		if (list.join('|') !== this.Chosen.join('|')) {
			this.Chosen = list;

			this.$Emit('select', list.slice());
		}

		return this;
	},

	IsChosen: function (clip) {
		return this.Chosen.indexOf(clip.ID) !== -1;
	},

	/* Changes: the tracks given back, and change. */
	Commit: function (tracks) {
		this.Tracks = tracks;

		this.$Emit('change', JSON.parse(JSON.stringify(tracks)));
	},

	/* The playhead at a moment: seek. */
	Seek: function (time) {
		var at = Math.max(0, Math.min(this.Total(), Math.round(Number(time) * this.FrameRate()) / this.FrameRate()));

		this.Time = at;

		this.$Emit('seek', {Time: at});
		this.Reveal();
	},

	/* The playhead in view: the view moves when it leaves it. */
	Reveal: function () {
		var scroller = this.Scroller();
		var x;

		if (!scroller) return;

		x = this.Time * this.Pixels();

		if (x < scroller.scrollLeft || x > scroller.scrollLeft + scroller.clientWidth - 24)
			scroller.scrollLeft = Math.max(0, x - scroller.clientWidth / 3);
	},

	Zoom: function (scale, anchor) {
		var scroller = this.Scroller();
		var before = this.Pixels();
		var at = anchor === undefined ? this.Time : anchor;
		var offset = at * before - scroller.scrollLeft;
		var next = Math.max(Number(this.MinScale) || 2, Math.min(Number(this.MaxScale) || 400, Number(scale) || before));
		if (next === before) return this;

		this.Scale = next;

		/* The moment at the anchor stays where it was on the screen. */
		scroller.scrollLeft = Math.max(0, at * next - offset);

		this.$Emit('zoom', {Scale: next});

		return this;
	},

	ZoomIn: function () {
		this.Zoom(this.Pixels() * 1.5);
	},

	ZoomOut: function () {
		this.Zoom(this.Pixels() / 1.5);
	},

	/* The whole timeline in view. */
	Fit: function () {
		var scroller = this.Scroller();

		this.Zoom(Math.max(1, scroller.clientWidth - 8) / this.Total(), 0);

		scroller.scrollLeft = 0;

		return this;
	},

	Wheeled: function (event) {
		var rect;

		if (!event.ctrlKey && !event.metaKey) return;

		event.preventDefault();

		rect = this.Scroller().getBoundingClientRect();

		this.Zoom(this.Pixels() * (event.deltaY < 0 ? 1.25 : 0.8), (event.clientX - rect.left + this.Scroller().scrollLeft) / this.Pixels());
	},

	/* Cuts. The clips selected (or, without, the ones under the playhead), cut in two at the playhead. */
	Split: function () {
		var self = this;
		var tracks = this.Copy();
		var time = this.Time;
		var ids = this.Chosen.length ? this.Chosen : [];
		var made = [];

		tracks.forEach(function (track) {
			if (track.Locked) return;

			track.Clips = (track.Clips || []).reduce(function (clips, clip) {
				var inside = time > Number(clip.Start) + 1e-6 && time < self.End(clip) - 1e-6;
				var wanted = ids.length ? ids.indexOf(clip.ID) !== -1 : true;
				var second;

				if (!inside || !wanted)
					return clips.concat([clip]);

				second = JSON.parse(JSON.stringify(clip));
				second.ID = clip.ID + '-' + Date.now().toString(36) + (++self.Own().Sequence);
				second.Start = time;
				second.Duration = Math.round((self.End(clip) - time) * 1000) / 1000;
				second.In = Math.round(((Number(clip.In) || 0) + time - Number(clip.Start)) * 1000) / 1000;
				clip.Duration = Math.round((time - Number(clip.Start)) * 1000) / 1000;

				made.push(second.ID);

				return clips.concat([clip, second]);
			}, []);
		});

		if (!made.length) return this;

		this.Commit(tracks);
		this.Select(made);

		return this;
	},

	Delete: function () {
		var self = this;
		var tracks = this.Copy();
		var removed = false;

		tracks.forEach(function (track) {
			if (track.Locked) return;

			track.Clips = (track.Clips || []).filter(function (clip) {
				var keep = self.Chosen.indexOf(clip.ID) === -1;

				removed = removed || !keep;

				return keep;
			});
		});

		if (!removed) return this;

		this.Commit(tracks);
		this.Select([]);

		return this;
	},

	/* The heads of the tracks: mute, hide, lock. */
	Toggle: function (event, key) {
		var row = event.target.closest('[data-track]');
		var id = row ? row.getAttribute('data-track') : null;
		var tracks = this.Copy();

		tracks.forEach(function (track) {
			if (String(track.ID) === id)
				track[key] = !track[key];
		});

		this.Commit(tracks);
	},

	Muted: function (event) {
		this.Toggle(event, 'Muted');
	},

	Hid: function (event) {
		this.Toggle(event, 'Hidden');
	},

	Locked: function (event) {
		this.Toggle(event, 'Locked');
	},

	/* The pointer. The moment of a pointer event over the tracks. */
	At: function (event) {
		var rect = this.Scroller().getBoundingClientRect();

		return Math.max(0, (event.clientX - rect.left + this.Scroller().scrollLeft) / this.Pixels());
	},

	/* The track under a pointer event, by the rows of the lanes. */
	LaneAt: function (event) {
		var lanes = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-video-timeline-lane'));
		var i;
		var rect;

		for (i = 0; i < lanes.length; i++) {
			rect = lanes[i].getBoundingClientRect();

			if (event.clientY >= rect.top && event.clientY < rect.bottom) return lanes[i].getAttribute('data-track');
		}

		return null;
	},

	/* The edges a moved edge snaps to: the other clips, the playhead, the marks, the start. */
	Targets: function (skip) {
		var self = this;
		var list = [0, Number(this.Time) || 0];

		(this.Markers || []).forEach(function (marker) {
			list.push(Number(marker.Time));
		});

		(this.Tracks || []).forEach(function (track) {
			(track.Clips || []).forEach(function (clip) {
				if (skip.indexOf(clip.ID) !== -1) return;

				list.push(Number(clip.Start), self.End(clip));
			});
		});

		return list;
	},

	/* The nearest target within 8 pixels of a moment, or null. */
	Snapped: function (time, targets) {
		var reach = 8 / this.Pixels();
		var best = null;

		if (this.Snap === false || this.Snap === 'false') return null;

		targets.forEach(function (target) {
			if (Math.abs(target - time) <= reach && (best === null || Math.abs(target - time) < Math.abs(best - time)))
				best = target;
		});

		return best;
	},

	Frame: function (time) {
		return Math.round(time * this.FrameRate()) / this.FrameRate();
	},

	Down: function (event) {
		var own = this.Own();
		var clip = event.target.closest('.elemenx-video-timeline-clip');
		var edge = event.target.closest('.elemenx-video-timeline-edge');
		var found;
		var ids;

		if (event.button !== undefined && event.button > 0) return;

		this.$Element().focus();

		if (clip && this.Editable()) {
			found = this.Find(clip.getAttribute('data-clip'));

			if (event.shiftKey) {
				this.Select(this.IsChosen(found.Clip) ? this.Chosen.filter(function (id) {
					return id !== found.Clip.ID;
				}) : this.Chosen.concat([found.Clip.ID]));

				return;
			}

			if (!this.IsChosen(found.Clip))
				this.Select([found.Clip.ID]);

			if (found.Track.Locked) return;

			event.preventDefault();

			ids = edge ? [found.Clip.ID] : this.Chosen.slice();
			own.Drag = {Mode: edge ? (edge.classList.contains('start') ? 'trim-start' : 'trim-end') : 'move', X: event.clientX, Y: event.clientY, ID: found.Clip.ID, Track: found.Track.ID, IDs: ids, Original: this.Copy(), Moved: false};

			if (event.pointerId !== undefined && this.Scroller().setPointerCapture)
				this.Scroller().setPointerCapture(event.pointerId);

			return;
		}

		/* The ruler, an empty track or the playhead: seek, and scrub while the pointer is held. */
		if (!event.shiftKey && !event.target.closest('.elemenx-video-timeline-ruler'))
			this.Select([]);

		event.preventDefault();

		own.Drag = {Mode: 'scrub'};

		if (event.pointerId !== undefined && this.Scroller().setPointerCapture)
			this.Scroller().setPointerCapture(event.pointerId);

		this.Seek(this.At(event));
	},

	Move: function (event) {
		var self = this;
		var own = this.Own();
		var drag = own.Drag;
		var delta;
		var tracks;
		var found;
		var original;
		var snapped;
		var guide = null;

		if (!drag) return;

		if (drag.Mode === 'scrub') {
			this.Seek(this.At(event));

			return;
		}

		delta = (event.clientX - drag.X) / this.Pixels();

		/* A press that does not go 3 pixels away is a press, not a drag. */
		if (!drag.Moved && Math.abs(event.clientX - drag.X) < 3 && Math.abs(event.clientY - drag.Y) < 3) return;

		drag.Moved = true;
		tracks = JSON.parse(JSON.stringify(drag.Original));
		found = this.Find(drag.ID, tracks);
		original = this.Find(drag.ID, drag.Original).Clip;

		if (drag.Mode === 'move') {
			/* The first clip leads: its start or its end snaps, and the others move with it. */
			delta = Math.max(-Math.min.apply(null, drag.IDs.map(function (id) {
				return Number(self.Find(id, drag.Original).Clip.Start);
			})), delta);

			snapped = this.Snapped(Number(original.Start) + delta, this.Targets(drag.IDs));

			if (snapped !== null) {
				delta = snapped - Number(original.Start);
				guide = snapped;
			}
			else {
				snapped = this.Snapped(this.End(original) + delta, this.Targets(drag.IDs));

				if (snapped !== null) {
					delta = snapped - this.End(original);
					guide = snapped;
				}
			}

			delta = guide === null ? this.Frame(delta) : delta;

			drag.IDs.forEach(function (id) {
				var each = self.Find(id, tracks);
				if (each && !each.Track.Locked)
					each.Clip.Start = Math.round(Math.max(0, Number(self.Find(id, drag.Original).Clip.Start) + delta) * 1000) / 1000;
			});

			/* One clip goes to the track under the pointer, of the same kind and not locked, where it does not cover another. */
			if (drag.IDs.length === 1)
				this.Carry(tracks, found, this.LaneAt(event));
		}
		else {
			this.Trim(found.Clip, original, delta, drag.Mode, drag.IDs);

			guide = this.Guide;
		}

		this.Guide = guide;
		this.Tracks = tracks;
	},

	/* A clip moved to another track (its kind, unlocked, room for it there). */
	Carry: function (tracks, found, id) {
		var self = this;
		var target = tracks.filter(function (track) {
			return String(track.ID) === String(id);
		})[0];
		var clip = found.Clip;
		var free;

		if (!target || target === found.Track || target.Locked || (target.Kind || 'video') !== (found.Track.Kind || 'video')) return;

		free = (target.Clips || []).every(function (other) {
			return self.End(other) <= Number(clip.Start) + 1e-6 || Number(other.Start) >= self.End(clip) - 1e-6;
		});

		if (!free) return;

		found.Track.Clips.splice(found.Track.Clips.indexOf(clip), 1);

		target.Clips = (target.Clips || []).concat([clip]);
	},

	/* An edge of a clip moved by delta seconds: not past its source (In, Length), nor shorter than a frame. */
	Trim: function (clip, original, delta, mode, skip) {
		var frame = 1 / this.FrameRate();
		var start = Number(original.Start);
		var end = this.End(original);
		var source = Number(original.In) || 0;
		var length = Number(original.Length);
		var snapped;
		var at;

		this.Guide = null;

		if (mode === 'trim-start') {
			at = start + delta;
			snapped = this.Snapped(at, this.Targets(skip));
			at = snapped === null ? this.Frame(at) : snapped;
			at = Math.max(0, start - source, Math.min(end - frame, at));

			clip.Start = Math.round(at * 1000) / 1000;
			clip.Duration = Math.round((end - at) * 1000) / 1000;
			clip.In = Math.round((source + at - start) * 1000) / 1000;

			this.Guide = snapped !== null && at === snapped ? snapped : null;

			return;
		}

		at = end + delta;
		snapped = this.Snapped(at, this.Targets(skip));
		at = snapped === null ? this.Frame(at) : snapped;
		at = Math.max(start + frame, at);

		if (length > 0)
			at = Math.min(at, start + length - source);

		clip.Duration = Math.round((at - start) * 1000) / 1000;

		this.Guide = snapped !== null && at === snapped ? snapped : null;
	},

	Up: function () {
		var own = this.Own();
		var drag = own.Drag;
		if (!drag) return;

		own.Drag = null;
		this.Guide = null;

		if (drag.Mode !== 'scrub' && drag.Moved)
			this.Commit(this.Tracks);
	},

	/* The clips selected moved by a number of frames (Alt with the arrows). */
	Nudge: function (frames) {
		var self = this;
		var tracks = this.Copy();
		var step = frames / this.FrameRate();

		this.Chosen.forEach(function (id) {
			var found = self.Find(id, tracks);
			if (found && !found.Track.Locked)
				found.Clip.Start = Math.round(Math.max(0, Number(found.Clip.Start) + step) * 1000) / 1000;
		});

		this.Commit(tracks);
	},

	Key: function (event) {
		var key = Elemenx.Locale.Key(event);
		var frame = 1 / this.FrameRate();

		if (event.target.closest('button')) return;

		if (key === ' ') this.$Emit('play');
		else if ((key === 'ArrowLeft' || key === 'ArrowRight') && event.altKey && this.Chosen.length && this.Editable()) this.Nudge((key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? this.FrameRate() : 1));
		else if (key === 'ArrowLeft') this.Seek(this.Time - (event.shiftKey ? 1 : frame));
		else if (key === 'ArrowRight') this.Seek(this.Time + (event.shiftKey ? 1 : frame));
		else if (key === 'Home') this.Seek(0);
		else if (key === 'End') this.Seek(this.Total());
		else if ((key === 's' || key === 'S') && this.Editable()) this.Split();
		else if ((key === 'Delete' || key === 'Backspace') && this.Chosen.length && this.Editable()) this.Delete();
		else if (key === '+' || key === '=') this.ZoomIn();
		else if (key === '-') this.ZoomOut();
		else if (key === 'Escape' && this.Chosen.length) this.Select([]);
		else return;

		event.preventDefault();
	}
});
