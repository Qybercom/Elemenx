<!-- generated -->
# Gamepad

Gamepads (the Gamepad API, standard mapping): they work the page the way the keyboard does. Every component that follows the keys follows a gamepad too.

- The d-pad and the left stick send the arrow keys to the focused element; when no component takes an arrow (none prevents its default), the focus moves to the nearest control on that side (Move). A held direction repeats.
- A sends Enter and X Space, and either presses the focused control when no component took the key (a button, a check box, an option...; A follows a link too); B sends Escape, and cancels the dialog on top when no component took it (an open popup closes first); Y sends Delete; the other buttons are events only.
- Every press is the button event ({Button, Pad}): a, b, x, y, lb, rb, lt, rt, select, start, ls, rs, up, down, left, right, home; on a pad without the standard mapping, whose buttons mean nothing known, b0, b1... (the stick still moves). connect and disconnect report pads ({Pad}); change reports a new Kind.
- A pad reported twice (XInput and HID, Steam) presses once; the stick goes the way it leans most; the pad drives the page only while the page is shown and has the focus, and one Elemenx drives it when several Applications or widgets use pads (the first to start: window.ElemenxGamepad); the events reach all of them.

On(name, callback) / Off(callback). Pads() lists [{Index, ID, Kind}]; Kind() is the kind of the pad used last (xbox, playstation, nintendo, generic, or '' when there is none); Label(button, kind) the name of a button on that kind of pad (A, ✕, B...). Navigate (true) turns the keys and the focus off when false (the events stay). Move(direction, scope) moves the focus to the nearest control left, right, up or down (inside the open dialog, or scope); the keyboard may call it too. Browsers report a pad once a button of it is pressed on the page. For games: Axes() is the sticks and the triggers of all pads at once, {LeftX, LeftY, RightX, RightY, LeftTrigger, RightTrigger} (-1 to 1, up -1, as the Gamepad API has them; a small lean is 0), Held(button) whether a button is down now. Virtual(name, options) makes a pad of the page (a VirtualGamepad on the screen, the tilt of a phone): Press(button), Release(button), Stick('left' or 'right', x, y), Trigger('left' or 'right', value), Destroy(); it is a pad as any other, its events and its Axes, Kind virtual; options Navigate (false: it moves no focus and presses no control).

## Methods

- `Virtual(name, options)`
- `Axes()`
- `Held(button)`
- `Pads()`
- `Kind()`
- `Label(button, kind)`
- `Press(name, pad)`
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

- [Gamepad: names the buttons of each kind of pad, and lists no pad while none is pressed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L260) — `tests/regression/library-services.test.js`
- [Gamepad: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L67) — `tests/regression/virtual-gamepad.test.js`
- [walks, drives and looks by a pad as far as it leans: half a trigger is half the gas, the stick steers, A jumps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1637) — `tests/regression/library-scene.test.js`
