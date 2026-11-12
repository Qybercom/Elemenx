<!-- generated -->
# VirtualGamepad

A gamepad on the screen for the fingers: a stick, buttons and the triggers of a game over what is under it (a Scene, in its slot hud). It is a pad of the InputDevices Service (Virtual): a Scene and every listener of pads take it as a real one (its stick walks and steers as far as it leans, A jumps...). Buttons: the ones it shows (a, b, x, y, lb, rb, lt, rt, start, select, and up, down, left, right of its cross, dpad for all four: a list or a text with commas); Right: a second stick, to look round; Show: auto (where the screen is touched, a phone), always or never; Tilt: the left stick across follows the lean of the device as a wheel (InputDevices.Tilt), asked for at the first touch; Navigate: its buttons also move the focus of the page and press its controls, as a real pad does (false: a game only). Size of its stick in pixels. DeadZone: the part of a lean round the middle that gives nothing (0.12), the rest from 0 to 1; LookCurve: the power of the lean of the right stick (2: fine near the middle to aim, fast at the rim). Floating: a stick comes where a finger touches its half of the screen (its lower part), and goes back as the finger lifts. A finger the page takes away (the capture lost) lets its stick go. Event button ({Button, Down}).

## Properties

| Property | Default |
| --- | --- |
| `Buttons` | `['a', 'b', 'x', 'y']` |
| `Right` | `false` |
| `Show` | `'auto'` |
| `Tilt` | `false` |
| `Navigate` | `false` |
| `Size` | `120` |
| `DeadZone` | `0.12` |
| `LookCurve` | `2` |
| `Floating` | `false` |
| `Label` | `''` |
| `Down` | `{}` |

## Events

- `button`: A button went down or up: {Button, Down}.

## Tests

- [InputDevices: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L70) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the keys held, the pointer and how far it went, the fingers; a window left lets every key go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L139) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: actions bound to keys, buttons, halves of the sticks and the mouse; their contexts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L175) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L242) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L316) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: puts the shoulders of the left on the left and those of the right on the right](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L388) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: shows a cross of up, down, left and right (dpad for all four) whose buttons hold the pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L406) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: gives nothing within its dead zone, the right stick by its curve, lets go of a finger taken away, and floats](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L448) — `tests/regression/virtual-gamepad.test.js`
