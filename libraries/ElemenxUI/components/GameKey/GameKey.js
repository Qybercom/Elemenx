/*
 * The prompt of a control: "[A] Continue". It shows the button of the gamepad in use (Button: a, b, x, y, lb, rb, lt,
 * rt, select, start... drawn the way that kind of pad names it: A, ✕, B) and, without a gamepad, the key of the
 * keyboard (Keyboard: 'Enter', 'E', 'Escape'). Label is the text after it. It follows the pad: plug one in or switch
 * pads and it changes. Pad (xbox, playstation, nintendo, generic) shows the buttons of that kind of pad whatever is
 * plugged in (a page of help). The button is drawn as on its pad: the colors and the symbols of the face buttons, the
 * shoulders, the triggers, the sticks, the d-pad with its arm lit, the buttons of the menus.
 */
Elemenx.Component('GameKey', {
	$TemplateURL: 'GameKey.html',
	$StyleURL: 'GameKey.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The prompt of a control: "[A] Continue".',
		Props: {
			Button: 'The button of the gamepad: a, b, x, y, lb, rb, lt, rt, select, start...',
			Keyboard: 'The key of the keyboard shown without a gamepad: Enter, E, Escape.',
			Label: 'The text after the button.',
			Pad: {Options: ['', 'xbox', 'playstation', 'nintendo', 'generic'], Description: 'Shows the buttons of a kind of pad whatever is plugged in: xbox, playstation, nintendo or generic.'}
		},
		Sample: {Label: 'Jump', Pad: 'xbox'}
	},
	Button: 'a',
	Keyboard: '',
	Label: '',
	Kind: '',
	Pad: '',

	$OnCreate: function () {
		var self = this;

		/* The text of the glyph: the button on a pad of kind, or the key on this keyboard. */
		this.Glyph = function (button, keyboard, kind) {
			if (kind)
				return self.$Service('Gamepad').Label(button, kind);

			return keyboard ? self.$Service('Hotkeys').Format(keyboard) : self.$Service('Gamepad').Label(button, 'xbox');
		};
	},

	$OnReady: function () {
		var self = this;
		var gamepad = this.$Service('Gamepad');

		this.Kind = this.Pad || gamepad.Kind();

		this.Listener = function () {
			self.Kind = self.Pad || gamepad.Kind();
		};

		gamepad.On('change', this.Listener);
		gamepad.On('connect', this.Listener);
		gamepad.On('disconnect', this.Listener);
	},

	$OnDestroy: function () {
		this.$Service('Gamepad').Off(this.Listener);
	}
});
