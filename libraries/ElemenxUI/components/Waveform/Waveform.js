/*
 * The shape of a sound file, to see it and to move in it: Src is the file (a URL, a Blob or a File, an ArrayBuffer or an
 * AudioBuffer: the Audio Service reads it), or Peaks gives its shape ([{Min, Max}] from -1 to 1, or levels from 0 to 1)
 * and Duration its length in seconds. Time is the place of the playhead in seconds: the part before it is drawn in
 * the accent. A press moves it (seek); with Selectable, a drag selects a part ({Start, End} in seconds: Selection, and
 * select), Escape takes it away. Keys: the arrows move by a second (Shift extends the selection), Home and End.
 * Media is an <audio> or a <video> it follows (its time) and moves; without Src it draws the file the element plays.
 * Mode: bars (the default; Bar and Gap their widths in pixels) or wave (a filled line). ShowTime writes the time and
 * the selection. Seek(time), Select(selection) and Buffer() (the AudioBuffer read) are its methods. Events: load
 * ({Duration, Channels, SampleRate}), seek (seconds), select ({Start, End} or null), error, ready (the component itself).
 */
Elemenx.Component('Waveform', {
	$TemplateURL: 'Waveform.html',
	$StyleURL: 'Waveform.css',
	$Meta: {
		Group: 'music',
		Icon: 'volume',
		Description: 'The shape of a sound file: the playhead, a part selected, the time; it follows an audio or video element.',
		Methods: ['Seek(time)', 'Select(selection)', 'Buffer()'],
		Events: {
			load: 'The file is read: {Duration, Channels, SampleRate}.',
			seek: 'The playhead was moved: the time in seconds.',
			select: 'A part was selected: {Start, End} in seconds, or null.',
			error: 'The file cannot be read: the error.',
			ready: 'It is made: the component itself, to call Seek, Select or Buffer.'
		},
		Props: {
			Src: 'The sound: a URL, a Blob, an ArrayBuffer or an AudioBuffer.',
			Peaks: 'Its shape given instead: [{Min, Max}] from -1 to 1, or levels from 0 to 1.',
			Duration: 'Its length in seconds (read from Src).',
			Time: 'The place of the playhead in seconds.',
			Selection: 'The part selected: {Start, End} in seconds, or null.',
			Selectable: 'A drag selects a part.',
			Media: 'An audio or video element it follows and moves.',
			Mode: {Options: ['bars', 'wave'], Description: 'Bars, or a filled line.'},
			Bar: 'The width of a bar in pixels (2).',
			Gap: 'The space between the bars in pixels (1).',
			ShowTime: 'Writes the time and the selection.',
			Height: 'The height in pixels (96).',
			Label: 'What it shows, for screen readers.'
		},
		Sample: {Peaks: [0.1, 0.3, 0.5, 0.42, 0.8, 0.95, 0.62, 0.7, 0.4, 0.55, 0.9, 0.75, 0.35, 0.5, 0.65, 0.3, 0.45, 0.2, 0.25, 0.1], Duration: 20, Time: 7}
	},
	Src: '',
	Peaks: null,
	Duration: 0,
	Time: 0,
	Selection: null,
	Selectable: true,
	Media: null,
	Mode: 'bars',
	Bar: 2,
	Gap: 1,
	ShowTime: true,
	Height: 96,
	Label: '',

	$OnCreate: function () {
		/* What renders nothing: the sound read, the element followed, a drag, the frame of the playhead. */
		var own = {Buffer: null, Read: null, Followed: null, Listeners: null, Drag: null, Frame: 0, Observer: null, Sequence: 0};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();

		own.Observer = typeof ResizeObserver === 'function' ? new ResizeObserver(function () {
			self.Draw();
		}) : null;

		if (own.Observer)
			own.Observer.observe(this.Canvas());

		this.Follow();
		this.Load();
		this.Draw();

		this.$Emit('ready', this);
	},

	$OnProps: function () {
		this.Follow();
		this.Load();
		this.Draw();
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Observer)
			own.Observer.disconnect();

		this.Unfollow();
	},

	Canvas: function () {
		return this.$Element().querySelector('.elemenx-waveform-canvas');
	},

	Round: function (value) {
		return Math.round((Number(value) || 0) * 10) / 10;
	},

	/* A time as m:ss.t (h:mm:ss past an hour). */
	Clock: function (value) {
		var seconds = Math.max(0, Number(value) || 0);
		var hours = Math.floor(seconds / 3600);
		var minutes = Math.floor(seconds % 3600 / 60);
		var rest = seconds % 60;
		var whole = Math.floor(rest);
		var tenth = Math.floor((rest - whole) * 10);
		var pad = function (n) {
			return (n < 10 ? '0' : '') + n;
		};

		if (hours)
			return hours + ':' + pad(minutes) + ':' + pad(whole);

		return minutes + ':' + pad(whole) + '.' + tenth;
	},

	/* The file of Src (or of Media without one), read once for each source; load or error after. */
	Load: function () {
		var self = this;
		var own = this.Own();
		var source = this.Src || (this.Media && !this.Peaks ? this.Media.currentSrc || this.Media.src : '');
		var sequence;

		if (!source || own.Read === source) return;

		own.Read = source;
		sequence = ++own.Sequence;

		this.$Service('Audio').Decode(source, function (error, buffer) {
			if (sequence !== own.Sequence) return;

			if (error) {
				own.Buffer = null;

				self.$Emit('error', error);

				return;
			}

			own.Buffer = buffer;
			self.Duration = buffer.duration;

			self.$Emit('load', {Duration: buffer.duration, Channels: buffer.numberOfChannels, SampleRate: buffer.sampleRate});

			self.Draw();
		});
	},

	Buffer: function () {
		return this.Own().Buffer;
	},

	/* The element of Media: its time is the playhead, a frame at a time while it plays. */
	Follow: function () {
		var self = this;
		var own = this.Own();
		var media = this.Media;
		if (own.Followed === media) return;

		this.Unfollow();

		if (!media || typeof media.addEventListener !== 'function') return;

		own.Followed = media;

		function tick () {
			own.Frame = 0;

			if (own.Followed !== media) return;

			if (Math.abs(self.Time - media.currentTime) > 0.01)
				self.Time = media.currentTime;

			if (!media.paused && !media.ended)
				own.Frame = window.requestAnimationFrame(tick);
		}

		own.Listeners = {
			play: function () {
				if (!own.Frame)
					own.Frame = window.requestAnimationFrame(tick);
			},
			timeupdate: tick,
			seeked: tick,
			loadedmetadata: function () {
				if (!self.Src && !self.Peaks)
					self.Load();

				if (!self.Duration && isFinite(media.duration))
					self.Duration = media.duration;
			}
		};

		Object.keys(own.Listeners).forEach(function (name) {
			media.addEventListener(name, own.Listeners[name]);
		});

		if (media.readyState >= 1)
			own.Listeners.loadedmetadata();

		if (!media.paused)
			own.Listeners.play();
	},

	Unfollow: function () {
		var own = this.Own();

		if (own.Followed && own.Listeners) {
			Object.keys(own.Listeners).forEach(function (name) {
				own.Followed.removeEventListener(name, own.Listeners[name]);
			});
		}

		if (own.Frame)
			window.cancelAnimationFrame(own.Frame);

		own.Followed = null;
		own.Listeners = null;
		own.Frame = 0;
	},

	/* The time at a point of the screen. */
	At: function (event) {
		var rect = this.Canvas().getBoundingClientRect();
		var part = rect.width ? (event.clientX - rect.left) / rect.width : 0;

		return Math.max(0, Math.min(1, part)) * (Number(this.Duration) || 0);
	},

	/* Moves the playhead (and the element of Media): seek. */
	Seek: function (time) {
		var value = Math.max(0, Math.min(Number(this.Duration) || 0, Number(time) || 0));

		this.Time = value;

		if (this.Media && typeof this.Media.currentTime === 'number') {
			try {
				this.Media.currentTime = value;
			}
			catch (error) {
				/* An element without its data yet: it starts there when it can. */
			}
		}

		this.$Emit('seek', value);
	},

	Select: function (selection) {
		this.Selection = selection;

		this.$Emit('select', selection);
	},

	Down: function (event) {
		if (!this.Duration || (event.button !== undefined && event.button !== 0)) return;

		this.Own().Drag = {X: event.clientX, From: this.At(event), Moved: false};

		try {
			this.Canvas().setPointerCapture(event.pointerId);
		}
		catch (error) {
			/* A pointer the browser does not know (made by a script): the drag works without the capture. */
		}
	},

	Move: function (event) {
		var drag = this.Own().Drag;
		var at;

		if (!drag || this.Selectable === false || this.Selectable === 'false') return;

		if (!drag.Moved && Math.abs(event.clientX - drag.X) < 4) return;

		drag.Moved = true;
		at = this.At(event);

		this.Selection = {Start: Math.min(drag.From, at), End: Math.max(drag.From, at)};
	},

	Up: function (event) {
		var drag = this.Own().Drag;
		if (!drag) return;

		this.Own().Drag = null;

		if (event.type === 'pointercancel') return;

		if (drag.Moved) {
			this.Select({Start: this.Selection.Start, End: this.Selection.End});

			return;
		}

		this.Seek(drag.From);
	},

	Key: function (event) {
		var time = Number(this.Time) || 0;
		var duration = Number(this.Duration) || 0;
		var step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
		var selection = this.Selection;
		var next;

		if (!duration) return;

		if (event.key === 'Escape' && selection) {
			event.preventDefault();

			this.Select(null);

			return;
		}

		if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();

			this.Seek(event.key === 'Home' ? 0 : duration);

			return;
		}

		if (!step) return;

		event.preventDefault();

		next = Math.max(0, Math.min(duration, time + step));

		/* Shift extends the selection from the playhead (or from the end of it the playhead is at). */
		if (event.shiftKey && this.Selectable !== false && this.Selectable !== 'false') {
			var anchor = selection && Math.abs(selection.End - time) < 0.001 ? selection.Start : selection && Math.abs(selection.Start - time) < 0.001 ? selection.End : time;

			this.Select({Start: Math.min(anchor, next), End: Math.max(anchor, next)});
		}

		this.Seek(next);
	},

	/* The shape in count columns: from the sound read, or from Peaks taken to count. */
	Columns: function (count) {
		var own = this.Own();
		var given = this.Peaks;
		var columns = [];
		var k;

		if (own.Buffer && !given)
			return this.$Service('Audio').Peaks(own.Buffer, count);

		if (!given || !given.length) return [];

		for (k = 0; k < count; k++) {
			var from = Math.floor(k * given.length / count);
			var to = Math.max(from + 1, Math.floor((k + 1) * given.length / count));
			var min = 0;
			var max = 0;
			var i;

			for (i = from; i < to && i < given.length; i++) {
				var entry = given[i];

				if (typeof entry === 'number') {
					min = Math.min(min, -Math.abs(entry));
					max = Math.max(max, Math.abs(entry));
				}
				else if (entry) {
					min = Math.min(min, Number(entry.Min) || 0);
					max = Math.max(max, Number(entry.Max) || 0);
				}
			}

			columns.push({Min: min, Max: max});
		}

		return columns;
	},

	Draw: function () {
		var canvas = this.Canvas();
		var ratio = window.devicePixelRatio || 1;
		var width = canvas ? canvas.clientWidth : 0;
		var height = canvas ? canvas.clientHeight : 0;
		var style = this.$Element() ? getComputedStyle(this.$Element()) : null;
		var duration = Number(this.Duration) || 0;
		var bars = this.Mode !== 'wave';
		var bar = Math.max(1, Number(this.Bar) || 2);
		var gap = Math.max(0, Number(this.Gap) || 0);
		var count;
		var columns;
		var loudest = 0;
		var middle = height / 2;
		var played;
		var context;
		var k;

		if (!width || !height || !style) return;

		if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
			canvas.width = Math.round(width * ratio);
			canvas.height = Math.round(height * ratio);
		}

		context = canvas.getContext('2d');

		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		context.clearRect(0, 0, width, height);

		count = bars ? Math.max(1, Math.floor((width + gap) / (bar + gap))) : Math.max(1, Math.round(width));
		columns = this.Columns(count);

		columns.forEach(function (column) {
			loudest = Math.max(loudest, -column.Min, column.Max);
		});

		played = duration ? Math.max(0, Math.min(1, (Number(this.Time) || 0) / duration)) * width : 0;

		var accent = style.getPropertyValue('--elemenx-accent').trim() || '#3f6c9e';
		var muted = style.color;

		/* The selection under the shape. */
		if (this.Selection && duration && this.Selection.End > this.Selection.Start) {
			var left = this.Selection.Start / duration * width;
			var right = this.Selection.End / duration * width;

			context.globalAlpha = 0.18;
			context.fillStyle = accent;

			context.fillRect(left, 0, right - left, height);

			context.globalAlpha = 1;

			context.fillRect(left, 0, 1, height);
			context.fillRect(right - 1, 0, 1, height);
		}

		/* Each column as tall as its sound, the loudest the full height. */
		var scale = loudest > 0 ? (middle - 3) / loudest : 0;

		if (bars) {
			for (k = 0; k < columns.length; k++) {
				var x = k * (bar + gap);
				var top = Math.max(0.5, columns[k].Max * scale);
				var bottom = Math.max(0.5, -columns[k].Min * scale);

				context.fillStyle = x + bar / 2 <= played ? accent : muted;

				context.fillRect(x, middle - top, bar, top + bottom);
			}
		}
		else if (columns.length) {
			var shape = function () {
				context.beginPath();
				context.moveTo(0, middle - columns[0].Max * scale);

				for (k = 1; k < columns.length; k++) context.lineTo(k * width / columns.length, middle - columns[k].Max * scale);

				for (k = columns.length - 1; k >= 0; k--) context.lineTo(k * width / columns.length, middle - columns[k].Min * scale);

				context.closePath();
			};

			context.fillStyle = muted;

			shape();

			context.fill();

			context.save();
			context.beginPath();
			context.rect(0, 0, played, height);
			context.clip();

			context.fillStyle = accent;

			shape();

			context.fill();
			context.restore();
		}

		/* The playhead. */
		if (duration) {
			context.fillStyle = style.getPropertyValue('--elemenx-text').trim() || '#1f2328';

			context.fillRect(Math.min(width - 2, Math.max(0, played - 1)), 0, 2, height);
		}
	}
});
