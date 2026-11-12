/*
 * DemoFrame: the frame of the pages of demos (Graphics, Gaming): a Workspace with the list of its demos in a tool
 * window on the left (closed at first on a phone: the demo has the screen), the title of the page and the note of the
 * demo shown in its header, a button that takes the demo over the whole screen (Landscape: kept in landscape while it
 * is, a game on a phone), a link to the other page. A phone shows the scene alone, its controls behind a button on the
 * stripe (on its side no header either). FPS shows how the frames go over the demo (FPSMeter: its times, and of a scene
 * the pixels to a point and the level of its light), kept for the next visit. Quality is the one of the scenes of all the
 * demos (SceneDemo: kept in the browser, told to the demo shown), in the header and in the list of the demos. The demo is
 * what is put in it. Events: choose ({Name}) as a demo is picked.
 */
Elemenx.Component('DemoFrame', {
	$TemplateURL: 'DemoFrame.html',
	$StyleURL: 'DemoFrame.css',
	Title: '',
	Demos: [],
	Current: '',
	Other: '/',
	OtherLabel: '',
	Landscape: false,
	Phone: false,
	/* A phone: the controls of the demo shown over it (else the scene has the whole screen). */
	Tools: false,
	FPS: false,
	/* What the scene of the demo is drawn on (Scene.Device), shown under the meter of the frames. */
	DeviceLine: '',
	Quality: 'auto',
	Qualities: [{Value: 'auto', Label: 'Auto'}, {Value: 'low', Label: 'Low'}, {Value: 'medium', Label: 'Medium'}, {Value: 'high', Label: 'High'}, {Value: 'ultra', Label: 'Ultra'}],

	$OnCreate: function () {
		var self = this;
		var screen = this.$Service('Screen');

		this.Phone = screen.Phone();

		try {
			this.FPS = window.localStorage.getItem('demo-fps') === '1';
			this.Quality = window.localStorage.getItem('ui-kit-quality') || 'auto';
		}
		catch (error) {
			this.FPS = false;
		}

		/* A demo that chose its quality itself: the choice shown here too. */
		this.QualityHeard = function (event) {
			self.Quality = event.detail;
		};

		window.addEventListener('scene-demo-quality', this.QualityHeard);

		/* The page has the whole screen while it is shown (Layout hides its header and its footer). */
		document.documentElement.classList.add('demo-page');

		this.Turned = function (state) {
			self.Phone = state.Phone;
		};

		screen.On('change', this.Turned);
	},

	$OnReady: function () {
		var self = this;

		this.DeviceClock = window.setInterval(function () {
			self.DeviceRead();
		}, 2000);
	},

	$OnDestroy: function () {
		window.clearInterval(this.DeviceClock);

		document.documentElement.classList.remove('demo-page');

		this.$Service('Screen').Off(this.Turned);

		window.removeEventListener('scene-demo-quality', this.QualityHeard);
	},

	/* The quality of the scenes of all the demos: kept in the browser and told to the demo shown. */
	QualityChosen: function (value) {
		this.Quality = value;

		try {
			window.localStorage.setItem('ui-kit-quality', value);
		}
		catch (error) {
			value = String(value);
		}

		window.dispatchEvent(new CustomEvent('scene-demo-quality', {detail: value}));
	},

	NoteOf: function (name) {
		var demo = (this.Demos || []).filter(function (one) {
			return one.Name === name;
		})[0];

		return demo ? demo.Note : '';
	},

	/* The card of the scene of the demo, its compiling of programs, its pictures of floats, its pixels and its level. */
	DeviceRead: function () {
		var node = this.FPS ? this.$Element().querySelector('.elemenx-scene') : null;
		var scene = node ? Elemenx.Instance(node) : null;
		var device = scene && scene.Device ? scene.Device() : null;

		this.DeviceLine = device ? (device.GPU || 'GPU hidden') + ' · parallel compile ' + (device.Parallel ? 'yes' : 'NO') + ' · float targets ' + (device.Floats ? 'yes' : 'NO') + ' · max texture ' + device.MaxTexture + ' · device pixels ' + Math.round(device.Pixels * 100) / 100 + ' · drawn ' + device.Ratio + ' · ' + device.Level + (device.Phone ? ' · touch device' : '') : '';
	},

	/* The meter of the frames over the demo, on or off, kept for the next visit. */
	Timed: function () {
		this.FPS = !this.FPS;

		this.DeviceRead();

		try {
			window.localStorage.setItem('demo-fps', this.FPS ? '1' : '0');
		}
		catch (error) {
			return;
		}
	},

	Chosen: function (name) {
		this.$Emit('choose', {Name: name});
	},

	/* The demo over the whole screen (the browser asks for it within a press); a game kept in landscape on a phone. */
	Full: function () {
		var screen = this.$Service('Screen');
		var main = this.$Ref('Main');

		if (screen.Full()) {
			screen.Exit();

			return;
		}

		screen.Fullscreen(main, {Landscape: this.Landscape === true || this.Landscape === 'true', Navigation: 'hide'});
	}
});
