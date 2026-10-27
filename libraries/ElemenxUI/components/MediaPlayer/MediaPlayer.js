/*
 * The controls of a video or a piece of sound over the player of the browser (<video> or <audio>, Kind): play and
 * pause, the bar of the time (what is loaded shown on it), the time, the volume and mute, the speed (Speeds), the
 * subtitles (Tracks [{Src, Lang, Label, Default}]), Picture-in-Picture and the full screen. It plays what the browser
 * plays (Src, Poster); it brings no player of its own. Keys, the player focused: Space or K plays and pauses, the
 * arrows Left and Right go 5 seconds back and on, Up and Down change the volume, M mutes, F goes full screen, C shows
 * the subtitles. Methods: Play(), Pause(), Seek(seconds). Events: play, pause, ended, time ({Time, Duration}, four times
 * a second at most), volume ({Volume, Muted}).
 */
Elemenx.Component('MediaPlayer', {
	$TemplateURL: 'MediaPlayer.html',
	$StyleURL: 'MediaPlayer.css',
	$Meta: {
		Group: 'media',
		Icon: 'play',
		Description: 'The controls of a video or a piece of sound over the player of the browser.',
		Events: {
			play: 'It started playing.',
			pause: 'It paused.',
			ended: 'It reached the end.',
			time: 'The time moved: {Time, Duration} (four times a second at most).',
			volume: 'The volume changed: {Volume, Muted}.'
		},
		Props: {
			Src: 'The address of the video or the sound.',
			Kind: {Options: ['video', 'audio'], Description: 'video or audio.'},
			Poster: 'A picture shown before a video plays.',
			Title: 'The title over the controls.',
			Tracks: {Schema: {Src: 'text', Lang: 'text', Label: 'text', Default: 'bool'}, Description: 'The subtitles: [{Src, Lang, Label, Default}].'},
			Speeds: 'The speeds offered: [0.5, 1, 1.5, 2].',
			Autoplay: 'Starts playing when it can (muted, as the browsers allow).',
			Loop: 'Starts again at the end.',
			Muted: 'Starts without sound.',
			Ratio: 'The shape of a video: width / height (16 / 9).',
			Label: 'The name of the player for screen readers (the Title by default).'
		},
		Sample: {Kind: 'audio', Title: 'A piece of sound'}
	},
	Src: '',
	Kind: 'video',
	Poster: '',
	Title: '',
	Tracks: [],
	Speeds: [0.5, 0.75, 1, 1.25, 1.5, 2],
	Autoplay: false,
	Loop: false,
	Muted: false,
	Ratio: 16 / 9,
	Label: '',
	Playing: false,
	Time: 0,
	Duration: 0,
	Buffered: 0,
	Volume: 1,
	Silent: false,
	Speed: 1,
	Captions: false,
	Full: false,
	SpeedOpen: false,

	$OnCreate: function () {
		var self = this;
		var own = {Told: 0};

		this.Own = function () {
			return own;
		};

		/* A time as 1:05 or 1:02:05. */
		this.Clock = function (seconds) {
			var total = Math.max(0, Math.floor(Number(seconds) || 0));
			var hours = Math.floor(total / 3600);
			var minutes = Math.floor(total % 3600 / 60);
			var rest = total % 60;

			return (hours ? hours + ':' + (minutes < 10 ? '0' : '') : '') + minutes + ':' + (rest < 10 ? '0' : '') + rest;
		};

		/* The background of the bar of the time: played, then loaded, then the rest. */
		this.Track = function (time, buffered, duration) {
			var played = duration ? time / duration * 100 : 0;
			var loaded = duration ? Math.max(played, buffered / duration * 100) : 0;

			return '--elemenx-media-played: ' + played + '%; --elemenx-media-loaded: ' + loaded + '%;';
		};

		this.SpeedItems = function (speeds, speed) {
			return (speeds || []).map(function (value) {
				return {ID: String(value), Label: value + '×', Checked: Number(value) === Number(speed)};
			});
		};

		this.PipSupported = function () {
			return self.Kind !== 'audio' && self.$Service('PictureInPicture').Supported('video');
		};

		this.Fullscreen = function () {
			self.Full = document.fullscreenElement === self.$Element();
		};
	},

	$OnReady: function () {
		document.addEventListener('fullscreenchange', this.Fullscreen);

		this.Silent = this.Muted === true || this.Muted === 'true';
		this.Media().muted = this.Silent;
	},

	$OnSleep: function () {
		this.Pause();
	},

	$OnDestroy: function () {
		document.removeEventListener('fullscreenchange', this.Fullscreen);
	},

	Media: function () {
		return this.$Element().querySelector('video, audio');
	},

	Play: function () {
		var playing = this.Media().play();
		/* A play the browser refuses (no press of the user yet) leaves it paused: the button says so. */
		if (playing && playing.catch)
			playing.catch(function () {});

		return this;
	},

	Pause: function () {
		this.Media().pause();

		return this;
	},

	Seek: function (seconds) {
		var media = this.Media();

		media.currentTime = Math.max(0, Math.min(Number(seconds) || 0, media.duration || 0));
		this.Time = media.currentTime;

		return this;
	},

	Toggle: function () {
		if (this.Media().paused) this.Play();
		else this.Pause();
	},

	/* The events of the media element. */
	Played: function () {
		this.Playing = true;

		this.$Emit('play');
	},

	Paused: function () {
		this.Playing = false;

		this.$Emit('pause');
	},

	Ended: function () {
		this.Playing = false;

		this.$Emit('ended');
	},

	Metadata: function (event, media) {
		this.Duration = isFinite(media.duration) ? media.duration : 0;
	},

	Progress: function (event, media) {
		var ranges = media.buffered;

		this.Buffered = ranges && ranges.length ? ranges.end(ranges.length - 1) : 0;
	},

	Timed: function (event, media) {
		var now = Date.now();

		this.Time = media.currentTime;

		if (now - this.Own().Told < 250) return;

		this.Own().Told = now;

		this.$Emit('time', {Time: media.currentTime, Duration: this.Duration});
	},

	Volumed: function (event, media) {
		this.Volume = media.volume;
		this.Silent = media.muted;

		this.$Emit('volume', {Volume: media.volume, Muted: media.muted});
	},

	/* The controls. */
	Sought: function (event, node) {
		this.Seek(node.value);
	},

	Loudness: function (event, node) {
		var media = this.Media();

		media.volume = Number(node.value);
		media.muted = Number(node.value) === 0;
	},

	Mute: function () {
		var media = this.Media();

		media.muted = !media.muted;

		if (!media.muted && media.volume === 0)
			media.volume = 0.5;
	},

	SpeedMenu: function () {
		this.SpeedOpen = !this.SpeedOpen;
	},

	SpeedPicked: function (item) {
		this.Speed = Number(item.ID);
		this.Media().playbackRate = this.Speed;
		this.SpeedOpen = false;
	},

	SpeedClosed: function () {
		this.SpeedOpen = false;
	},

	Subtitles: function () {
		var tracks = this.Media().textTracks;
		var i;

		this.Captions = !this.Captions;

		for (i = 0; tracks && i < tracks.length; i++)
			tracks[i].mode = this.Captions && i === this.DefaultTrack() ? 'showing' : 'disabled';
	},

	DefaultTrack: function () {
		var index = 0;

		(this.Tracks || []).forEach(function (track, i) {
			if (track.Default)
				index = i;
		});

		return index;
	},

	Pip: function () {
		this.$Service('PictureInPicture').Video(this.Media());
	},

	FullScreen: function () {
		if (document.fullscreenElement) document.exitFullscreen();
		else if (this.$Element().requestFullscreen) this.$Element().requestFullscreen();
	},

	Key: function (event) {
		var media = this.Media();
		var key = event.key.toLowerCase();

		if (event.target && event.target.closest && event.target.closest('.elemenx-menu')) return;

		if (key === ' ' || key === 'k') {
			if (event.target && event.target.tagName === 'BUTTON' && key === ' ') return;

			this.Toggle();
		}
		else if (key === 'arrowleft' && event.target.type !== 'range') {
			this.Seek(media.currentTime - 5);
		}
		else if (key === 'arrowright' && event.target.type !== 'range') {
			this.Seek(media.currentTime + 5);
		}
		else if (key === 'arrowup' && event.target.type !== 'range') {
			media.volume = Math.min(1, media.volume + 0.1);
		}
		else if (key === 'arrowdown' && event.target.type !== 'range') {
			media.volume = Math.max(0, media.volume - 0.1);
		}
		else if (key === 'm') {
			this.Mute();
		}
		else if (key === 'f' && this.Kind !== 'audio') {
			this.FullScreen();
		}
		else if (key === 'c' && (this.Tracks || []).length) {
			this.Subtitles();
		}
		else {
			return;
		}

		event.preventDefault();
	}
});
