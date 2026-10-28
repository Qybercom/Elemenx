<!-- generated -->
# Gamepad

Gamepads (the Gamepad API, standard mapping): they work the page the way the keyboard does. Every component that follows the keys follows a gamepad too.

- The d-pad and the left stick send the arrow keys to the focused element; when no component takes an arrow (none prevents its default), the focus moves to the nearest control on that side (Move). A held direction repeats.
- A sends Enter and X Space, and either presses the focused control when no component took the key (a button, a check box, an option...; A follows a link too); B sends Escape, and cancels the dialog on top when no component took it (an open popup closes first); Y sends Delete; the other buttons are events only.
- Every press is the button event ({Button, Pad}): a, b, x, y, lb, rb, lt, rt, select, start, ls, rs, up, down, left, right, home; on a pad without the standard mapping, whose buttons mean nothing known, b0, b1... (the stick still moves). connect and disconnect report pads ({Pad}); change reports a new Kind.
- A pad reported twice (XInput and HID, Steam) presses once; the stick goes the way it leans most; the pad drives the page only while the page is shown and has the focus, and one Elemenx drives it when several Applications or widgets use pads (the first to start: window.ElemenxGamepad); the events reach all of them.

On(name, callback) / Off(callback). Pads() lists [{Index, ID, Kind}]; Kind() is the kind of the pad used last (xbox, playstation, nintendo, generic, or '' when there is none); Label(button, kind) the name of a button on that kind of pad (A, ✕, B...). Navigate (true) turns the keys and the focus off when false (the events stay). Move(direction, scope) moves the focus to the nearest control left, right, up or down (inside the open dialog, or scope); the keyboard may call it too. Browsers report a pad once a button of it is pressed on the page.

## Methods

- `Pads()`
- `Kind()`
- `Label(button, kind)`
- `Move(direction, scope)`
- `On(name, callback)`
- `Off(callback)`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<GameKey Button="a" [pad]="Kind || 'xbox'" />
	<GameKey Button="b" [pad]="Kind || 'xbox'" />
	<GameKey Button="x" [pad]="Kind || 'xbox'" />
	<GameKey Button="y" [pad]="Kind || 'xbox'" />
</div>
<p class="elemenx-text">{{Kind ? 'A ' + Kind + ' pad is connected.' : 'Connect a gamepad and press a button.'}} Last button: <strong>{{Last}}</strong></p>
<p class="elemenx-text small muted">The pad works the page as the keys do: the d-pad moves the focus, A presses.</p>
<script>
({
	Kind: '',
	Last: '—',

	$OnCreate: function () {
		var self = this;
		var gamepad = this.$Service('Gamepad');

		this.Kind = gamepad.Kind();

		this.Pressed = function (event) {
			self.Last = gamepad.Label(event.Button, gamepad.Kind()) + ' (' + event.Button + ')';
		};

		this.Changed = function () {
			self.Kind = gamepad.Kind();
		};

		gamepad.On('button', this.Pressed);
		gamepad.On('change', this.Changed);
		gamepad.On('connect', this.Changed);
	},

	$OnDestroy: function () {
		var gamepad = this.$Service('Gamepad');

		gamepad.Off(this.Pressed);
		gamepad.Off(this.Changed);
	}
})
</script>
```

## Tests

- [Gamepad: names the buttons of each kind of pad, and lists no pad while none is pressed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L210) — `tests/regression/library-services.test.js`
