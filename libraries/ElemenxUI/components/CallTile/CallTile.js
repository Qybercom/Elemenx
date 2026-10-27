/*
 * The tile of a participant of a call: their video, or their avatar while the camera is off. The video is Stream (a
 * MediaStream, shown by a <video> of the tile) or Element (an element of your own, a <video> of another media layer
 * say), placed in it. Name, Image (the picture of the avatar), Muted (the microphone off), Camera (on, by default),
 * Speaking (a frame while they talk; Level 0 to 1 makes it breathe with the voice), Quality (good, fair or poor: the
 * bars of the connection), Hand (raised), Pinned, Self (the own video, mirrored), Screen (a screen shared: the video
 * kept whole). A double click or the pin button tells pin ({Pinned, Name}).
 */
Elemenx.Component('CallTile', {
	$TemplateURL: 'CallTile.html',
	$StyleURL: 'CallTile.css',
	$Meta: {
		Group: 'social',
		Icon: 'user',
		Description: 'The tile of a participant of a call: their video, or their avatar while the camera is off.',
		Events: {
			pin: 'Its pin button or a double click: {Pinned, Name}, the state it asks for.'
		},
		Props: {
			Name: 'The name of the participant.',
			Image: 'The picture of their avatar.',
			Stream: 'Their video: a MediaStream.',
			Element: 'Their video: an element of your own (a <video> of another media layer).',
			Muted: 'Their microphone is off.',
			Camera: 'Their camera is on (true by default).',
			Speaking: 'They talk: a frame round the tile.',
			Level: 'How loud they talk, 0 to 1.',
			Quality: {Options: ['good', 'fair', 'poor'], Description: 'The connection: good, fair or poor.'},
			Hand: 'Their hand is raised.',
			Pinned: 'The tile is pinned.',
			Self: 'The own video: mirrored, as a mirror shows it.',
			Screen: 'A screen shared: the video kept whole.'
		},
		Sample: {Name: 'Ada Lovelace', Camera: false, Speaking: true, Quality: 'good'}
	},
	Name: '',
	Image: '',
	Stream: null,
	Element: null,
	Muted: false,
	Camera: true,
	Speaking: false,
	Level: 0,
	Quality: '',
	Hand: false,
	Pinned: false,
	Self: false,
	Screen: false,

	$OnCreate: function () {
		var self = this;

		/* The video of the tile: its stream in its <video>, or its element placed in it (a template calls it). */
		this.Video = function (stream, element) {
			if (element && element.nodeType) return {Element: element};

			return {Render: function (container) {
				var video = container.ownerDocument.createElement('video');

				video.autoplay = true;
				video.muted = true;
				video.playsInline = true;
				video.className = 'elemenx-call-tile-stream';

				if (stream)
					video.srcObject = stream;

				container.appendChild(video);

				self.Playing = video;
			}};
		};

		this.Shows = function (camera, stream, element) {
			return camera !== false && camera !== 'false' && !!(stream || element);
		};
	},

	PinPressed: function () {
		this.$Emit('pin', {Pinned: !this.Pinned, Name: this.Name});
	}
});
