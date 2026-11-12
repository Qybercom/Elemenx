/*
 * DemoFrame: the frame of the pages of demos (Graphics, Gaming): a Workspace with the list of its demos in a tool
 * window on the left (closed at first on a phone: the demo has the screen), the title of the page and the note of the
 * demo shown in its header, a button that takes the demo over the whole screen (Landscape: kept in landscape while it
 * is, a game on a phone), a link to the other page. A phone shows the scene alone, its controls behind a button on the
 * stripe (on its side no header either). The demo is what is put in it. Events: choose ({Name}) as a demo is picked.
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

	$OnCreate: function () {
		var self = this;
		var screen = this.$Service('Screen');

		this.Phone = screen.Phone();

		/* The page has the whole screen while it is shown (Layout hides its header and its footer). */
		document.documentElement.classList.add('demo-page');

		this.Turned = function (state) {
			self.Phone = state.Phone;
		};

		screen.On('change', this.Turned);
	},

	$OnDestroy: function () {
		document.documentElement.classList.remove('demo-page');

		this.$Service('Screen').Off(this.Turned);
	},

	NoteOf: function (name) {
		var demo = (this.Demos || []).filter(function (one) {
			return one.Name === name;
		})[0];

		return demo ? demo.Note : '';
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
