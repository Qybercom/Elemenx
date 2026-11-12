<!-- generated -->
# Gamepad

Gamepads work the page the way the keyboard does: every component that follows the keys follows a pad too. The pads themselves (their buttons, sticks, kinds and labels, the pads of the page) are of the InputDevices Service of ElemenxCommon; this one moves the page by them.

- The d-pad and the left stick send the arrow keys to the focused element; when no component takes an arrow (none prevents its default), the focus moves to the nearest control on that side (Move). A held direction repeats.
- A sends Enter and X Space, and either presses the focused control when no component took the key (a button, a check box, an option...; A follows a link too); B sends Escape, and cancels the dialog on top when no component took it (an open popup closes first); Y sends Delete; the other buttons are events of InputDevices only.
- The pad drives the page only while the page is shown and has the focus, and one Elemenx drives it when several Applications or widgets use pads (the first to start: window.ElemenxGamepad); a pad of the page made with Navigate false (InputDevices.Virtual) drives nothing.

Navigate (true) turns the keys and the focus off when false. Move(direction, scope) moves the focus to the nearest control left, right, up or down (inside the open dialog, or scope); the keyboard may call it too.

## Methods

- `Move(direction, scope)`

## Tests

- [InputDevices: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L70) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the keys held, the pointer and how far it went, the fingers; a window left lets every key go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L139) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: actions bound to keys, buttons, halves of the sticks and the mouse; their contexts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L175) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L242) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L316) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: puts the shoulders of the left on the left and those of the right on the right](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L388) — `tests/regression/virtual-gamepad.test.js`
