<!-- generated -->
# InputDevices

InputDevices: what the player and the user press, lean and move, from every device at once, as a game or a page reads it.

- Keys: Down(code) whether a key is held now (its code: KeyW, Space, ShiftLeft...), Keys() the codes held. A window that loses the focus lets every key go.
- The pointer: Pointer() {X, Y (in the window), Buttons (a bit for each held: 1 the main one), Locked}; Moved() how far it went since the last call {X, Y} (with the pointer locked too); Lock(element) takes the pointer to an element (the browser asks for it within a press), Unlock() gives it back. Touches(): [{ID, X, Y}] of the fingers.
- Pads (the Gamepad API, standard mapping): Pads() lists [{Index, ID, Kind}]; Kind() is the kind of the pad used last (xbox, playstation, nintendo, generic, virtual, or '' when there is none); Label(button, kind) the name of a button on that kind of pad (A, ✕, B...). Axes() is the sticks and the triggers of all pads at once, {LeftX, LeftY, RightX, RightY, LeftTrigger, RightTrigger} (-1 to 1, up -1, as the Gamepad API has them; a small lean is 0). The buttons are a, b, x, y, lb, rb, lt, rt, select, start, ls, rs, up, down, left, right, home (the left stick leans as up, down, left and right too); on a pad without the standard mapping b0, b1... A pad reported twice (XInput and HID, Steam) presses once. Virtual(name, options) makes a pad of the page (a VirtualGamepad on the screen, the tilt of a phone): Press(button), Release(button), Stick('left' or 'right', x, y), Trigger('left' or 'right', value), Destroy(); it is a pad as any other, Kind virtual; options Navigate (false: the Gamepad Service of ElemenxUI moves no focus by it). Browsers report a pad once a button of it is pressed on the page.
- The motion of the device, its accelerometer and gyroscope (devicemotion) and its turn (deviceorientation): MotionSupported(), RequestMotion(callback(error, state)) (iOS asks, only within a press: granted, denied or unsupported), StartMotion(), StopMotion(); Motion() the last of it {Orientation {Alpha, Beta, Gamma, Absolute} (degrees), Acceleration and Gravity [x, y, z] m/s² (null where the device has none), Rotation {Alpha, Beta, Gamma} degrees a second}. Tilt(): the lean of the device as a controller, the way the screen is turned taken into account: Steer (-1 to 1: turned as a wheel, right +), Pitch (-1 to 1: its top leaned away +, from where Center() was), X and Y (-1 to 1: a device held flat, its right and its top down +), Up (the up of the world in the frame of the screen); Range degrees make 1 (35), TiltDead degrees make 0 (2). Center() makes the lean of now the middle.
- Actions: Bind(action, sources, {Context}) names what does an action: a key code (KeyW), a button of a pad (a, rb), a half of an axis (LeftX+, LeftY-, RightTrigger), a button of the mouse (Mouse0), a half of the tilt (Steer+, Pitch-); Unbind(action, context). Value(name) is how far an action is pressed, 0 to 1 (a key 1, an axis as far as it leans), Held(name) whether it is over a half; name may be a source as well (Held('a'), Value('LeftX+')). Axis(negative, positive) is Value(positive) - Value(negative). Context(name) sets the context of the actions (a game, a car, a menu: a binding of another context does nothing; one without a context always works); Context() gives it. Actions() lists [{Action, Sources, Context}].
- On(name, callback) / Off(callback): connect and disconnect ({Pad}), change ({Kind}: another kind of pad pressed), button ({Button, Pad, Quiet}: a button of a pad went down; a held direction repeats after Delay, every Repeat ms), orientation and motion (as Motion() has them).

The same functions run where there is no page (Node, a worker): nothing is held, nothing moves.

## Methods

- `Down(code)`
- `Keys()`
- `Pointer()`
- `Moved()`
- `Lock(element)`
- `Unlock()`
- `Touches()`
- `Virtual(name, options)`
- `Axes()`
- `Pads()`
- `Kind()`
- `Label(button, kind)`
- `Press(name, pad)`
- `MotionSupported()`
- `RequestMotion(callback)`
- `StartMotion()`
- `StopMotion()`
- `Motion()`
- `Tilt()`
- `Center()`
- `Bind(action, sources, options)`
- `Unbind(action, context)`
- `Context(name)`
- `Actions()`
- `Value(name)`
- `Held(name)`
- `Axis(negative, positive)`
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
		var gamepad = this.$Service('InputDevices');

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
		var gamepad = this.$Service('InputDevices');

		gamepad.Off(this.Pressed);
		gamepad.Off(this.Changed);
	}
})
</script>
```

## Tests

- [InputDevices: names the buttons of each kind of pad, and lists no pad while none is pressed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L260) — `tests/regression/library-services.test.js`
- [InputDevices: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L70) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the keys held, the pointer and how far it went, the fingers; a window left lets every key go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L139) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: actions bound to keys, buttons, halves of the sticks and the mouse; their contexts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L175) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L242) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L316) — `tests/regression/virtual-gamepad.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [walks, drives and looks by a pad as far as it leans: half a trigger is half the gas, the stick steers, A jumps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1708) — `tests/regression/library-scene.test.js`
