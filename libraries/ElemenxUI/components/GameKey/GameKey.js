/*
 * The prompt of a control: "[A] Continue". It shows the button of the gamepad in use (Button: a, b, x, y, lb, rb, lt,
 * rt, select, start... drawn the way that kind of pad names it: A, ✕, B) and, without a gamepad, the key of the
 * keyboard (Keyboard: 'Enter', 'E', 'Escape'). Label is the text after it. It follows the pad: plug one in or switch
 * pads and it changes.
 */
Elemenx.Component('GameKey', {
	$TemplateURL: 'GameKey.html',
	$StyleURL: 'GameKey.css',
	Button: 'a',
	Keyboard: '',
	Label: '',
	Kind: '',

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

		this.Kind = gamepad.Kind();

		this.Listener = function () {
			self.Kind = gamepad.Kind();
		};

		gamepad.On('change', this.Listener);
		gamepad.On('connect', this.Listener);
		gamepad.On('disconnect', this.Listener);
	},

	$OnDestroy: function () {
		this.$Service('Gamepad').Off(this.Listener);
	}
});
