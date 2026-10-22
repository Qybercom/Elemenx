<!-- generated -->
# GameKey

The prompt of a control: "[A] Continue". It shows the button of the gamepad in use (Button: a, b, x, y, lb, rb, lt, rt, select, start... drawn the way that kind of pad names it: A, ✕, B) and, without a gamepad, the key of the keyboard (Keyboard: 'Enter', 'E', 'Escape'). Label is the text after it. It follows the pad: plug one in or switch pads and it changes. Pad (xbox, playstation, nintendo, generic) shows the buttons of that kind of pad whatever is plugged in (a page of help). The button is drawn as on its pad: the colors and the symbols of the face buttons, the shoulders, the triggers, the sticks, the d-pad with its arm lit, the buttons of the menus.

## Properties

| Property | Default |
| --- | --- |
| `Button` | `'a'` |
| `Keyboard` | `''` |
| `Label` | `''` |
| `Pad` | `''` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<GameKey Button="a" Pad="xbox" Label="Jump" />
	<GameKey Button="a" Pad="playstation" Label="Jump" />
	<GameKey Button="a" Pad="nintendo" Label="Jump" />
	<GameKey Button="lt" Pad="xbox" Label="Aim" />
	<GameKey Button="up" Pad="generic" Label="Climb" />
	<GameKey Keyboard="E" Label="Use" />
	<GameKey Keyboard="Escape" Label="Menu" />
</div>
<p class="elemenx-text small muted">Without Pad, a GameKey follows the gamepad in use, and shows the key of the keyboard when there is none.</p>
```
