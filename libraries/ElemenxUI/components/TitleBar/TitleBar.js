/*
 * The title bar of a window of a program drawn by the Application (Native.Desktop.Frame hidden, none or transparent),
 * the header of the page on the web. Its empty places move the window (elemenx-native-drag; a double click maximizes
 * it there), what it holds stays clickable. Icon (a name of an icon) or Image (the URL of a picture) and Title; the
 * default slot holds its content after the icon (a NativeMenu or a MenuBar, a search...), the actions slot buttons
 * before the buttons of the window. Controls: auto (by default) draws the buttons of the window (minimize, maximize or
 * restore, close) where the system draws none (Frame none or transparent), true in every program, false never. With
 * Frame hidden the buttons of the system stay over the bar, its content clear of them (env(titlebar-area-*)), and
 * they take the colors of the bar, which follow the theme. Window: the ID of the window of OpenWindow it is the bar
 * of (the first window without).
 */
Elemenx.Component('TitleBar', {
	$TemplateURL: 'TitleBar.html',
	$StyleURL: 'TitleBar.css',
	$Meta: {
		Group: 'layout',
		Icon: 'window-maximize',
		Description: 'The title bar of a window of a program drawn by the Application, the header of the page on the web.',
		Container: true,
		Slots: ['actions'],
		Props: {
			Title: 'The title of the window.',
			Icon: 'An icon before the title.',
			Image: 'The URL of a picture before the title (the icon of the program).',
			Controls: {Options: ['auto', 'true', 'false'], Description: 'The buttons of the window: where the system draws none (auto), always, or never.'},
			Window: 'The ID of the window of OpenWindow it is the bar of.'
		},
		Sample: {Title: 'Notes', Icon: 'file-text', Controls: 'true'}
	},
	Title: '',
	Icon: '',
	Image: '',
	Controls: 'auto',
	Window: '',
	Frame: 'web',
	Maximized: false,

	$OnCreate: function () {
		var self = this;
		var native = this.$Service('Platform');

		this.Frame = native.Frame(this.Window || null);

		/* Whether it draws the buttons of the window: in a program only, where the system draws none (auto). */
		this.Own = function (controls, frame) {
			if (frame === 'web' || controls === false || controls === 'false') return false;

			if (controls === true || controls === 'true') return true;

			return frame === 'none' || frame === 'transparent';
		};

		/* The state of its window, from the window event: the one of the first window has no ID. */
		this.Heard = function (state) {
			if (state && (state.ID || '') === String(self.Window || ''))
				self.Maximized = !!state.Maximized;
		};

		native.On('window', this.Heard);
	},

	/* With Frame hidden the buttons of the system take the colors of the bar, now and as the theme changes. */
	$OnReady: function () {
		var self = this;

		if (this.Frame !== 'hidden') return;

		this.Paint = function () {
			/* The window of the element; one still in the inert document of its template is in the page. */
			var view = self.$Element().ownerDocument && self.$Element().ownerDocument.defaultView || window;

			view.requestAnimationFrame(function () {
				var style = view.getComputedStyle(self.$Element().querySelector('.elemenx-title-bar'));

				self.$Service('Platform').TitleBarOverlay({Color: self.Hex(style.backgroundColor), Symbol: self.Hex(style.color), Height: self.$Element().querySelector('.elemenx-title-bar').getBoundingClientRect().height});
			});
		};

		this.Listener = this.$Service('Theme').OnChange(this.Paint);

		this.Paint();
	},

	/* A color of CSS (rgb() or rgba()) as #rrggbb, the form the system takes; transparent as the page, or white. */
	Hex: function (color, page) {
		var parts = String(color || '').match(/[\d.]+/g) || [];
		var view = this.$Element().ownerDocument && this.$Element().ownerDocument.defaultView || window;
		var hex = function (value) {
			var text = Math.max(0, Math.min(255, Math.round(Number(value) || 0))).toString(16);

			return text.length === 1 ? '0' + text : text;
		};

		if (parts.length === 4 && Number(parts[3]) === 0)
			return page ? '#ffffff' : this.Hex(view.getComputedStyle(view.document.body).backgroundColor, true);

		return '#' + hex(parts[0]) + hex(parts[1]) + hex(parts[2]);
	},

	Minimize: function () {
		this.$Service('Platform').Window('minimize', null, this.Window || null);
	},

	Maximize: function () {
		var self = this;

		this.$Service('Platform').Window('toggle-maximize', function (error, state) {
			if (!error && state)
				self.Maximized = !!state.Maximized;
		}, this.Window || null);
	},

	Close: function () {
		this.$Service('Platform').Window('close', null, this.Window || null);
	},

	$OnDestroy: function () {
		this.$Service('Platform').Off('window', this.Heard);

		if (this.Listener)
			this.$Service('Theme').OffChange(this.Listener);
	}
});
