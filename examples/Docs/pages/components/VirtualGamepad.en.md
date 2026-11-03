<!-- generated -->
# VirtualGamepad

A gamepad on the screen for the fingers: a stick, buttons and the triggers of a game over what is under it (a GameScene, in its slot hud). It is a pad of the Gamepad Service (Virtual): a GameScene and every listener of pads take it as a real one (its stick walks and steers as far as it leans, A jumps...). Buttons: the ones it shows (a, b, x, y, lb, rb, lt, rt, start, select: a list or a text with commas); Right: a second stick, to look round; Show: auto (where the screen is touched, a phone), always or never; Tilt: the left stick across follows the lean of the device as a wheel (Motion), asked for at the first touch; Navigate: its buttons also move the focus of the page and press its controls, as a real pad does (false: a game only). Size of its stick in pixels. Event button ({Button, Down}).

## Properties

| Property | Default |
| --- | --- |
| `Buttons` | `['a', 'b', 'x', 'y']` |
| `Right` | `false` |
| `Show` | `'auto'` |
| `Tilt` | `false` |
| `Navigate` | `false` |
| `Size` | `120` |
| `Label` | `''` |
| `Down` | `{}` |

## Events

- `button`: A button went down or up: {Button, Down}.

## Tests

- [Gamepad: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L67) — `tests/regression/virtual-gamepad.test.js`
- [Motion: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L136) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L210) — `tests/regression/virtual-gamepad.test.js`
