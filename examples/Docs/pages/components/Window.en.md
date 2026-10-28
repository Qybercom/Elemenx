<!-- generated -->
# Window

A window over the page or over its container: a header with its Title (and an Overline above it, an Icon), the body (the default slot) and a footer (slot footer); the slot header puts controls into the header.

- The header moves it (Draggable), the edges and the corners resize it (Resizable; MinWidth, MinHeight, MaxWidth, MaxHeight). The focus on the header takes the arrows: they move it, Shift with them resizes it.
- Minimize folds it to its header (Minimizable; again unfolds it), Maximize fills its bounds (Maximizable; a double press on the header too), Close hides it (Closable; the close event, Open false).
- X, Y, Width and Height place it (pixels); without X and Y it goes into a cascade of the new windows. Bounds: 'parent' (the positioned element it is in; the default) or 'viewport' (fixed to the window of the browser). Persist names a window whose place, size and state are remembered.
- A press or the focus puts it over the other windows (the Windows Service) and makes it active (class active).
- Variant: 'default', or 'game' for the look of the game theme (the --elemenx-game-* tokens). Level: 'primary' (the main windows), 'secondary' (the smaller ones) or 'plain' (a dialog, a message): a theme draws each its way.
- HeaderShape 'trapezoid' makes the window a folder: the Icon and the titles on a tab as wide as the title, its end sloping down to the body; the slot header and the buttons stand beyond the slope, and the header still moves it.
- PopOut adds a button that moves the body into a window of its own over the other windows of the system (Document Picture-in-Picture: Chrome and Edge; the PictureInPicture Service), and back; Popped tells it is there.
- Events: move ({X, Y}), resize ({Width, Height}), minimize, maximize, restore, close, front, popout, popin.
- Methods: Front(), Minimize(), Maximize(), Restore(), Close(), Center().

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Overline` | `''` |
| `Icon` | `''` |
| `Open` | `true` |
| `X` | `null` |
| `Y` | `null` |
| `Width` | `360` |
| `Height` | `null` |
| `MinWidth` | `200` |
| `MinHeight` | `120` |
| `MaxWidth` | `null` |
| `MaxHeight` | `null` |
| `Bounds` | `'parent'` |
| `Draggable` | `true` |
| `Resizable` | `true` |
| `Minimizable` | `true` |
| `Maximizable` | `true` |
| `Closable` | `true` |
| `Minimized` | `false` |
| `Maximized` | `false` |
| `Persist` | `''` |
| `Variant` | `'default'` |
| `Level` | `'primary'` |
| `PopOut` | `false` |
| `Popped` | `false` |
| `HeaderShape` | `'default'` |

## Events

- `front`: It came to the front of the other windows.
- `restore`: It came back from minimized or maximized.
- `close`: Its close button was pressed (Open becomes false).
- `resize`: Its size changed: {Width, Height}.
- `move`: It moved: {X, Y}.

## Slots

`header`, default, `footer`

## Methods

- `Front()`
- `Minimize()`
- `Maximize()`
- `Restore()`
- `Close()`
- `Center()`

## Example

```example
<div class="docs-frame" style="height: 320px;">
	<div style="position: relative; flex: 1 1 auto;">
		<Window *if="Shown" Title="Properties" Overline="Project" Icon="settings" X="16" Y="16" Width="300" Height="220" (close)="Close" (move)="Moved">
			<Properties>
				<Property Label="Name" Value="Elemenx" />
				<Property Label="Files" Value="128" />
			</Properties>
			<Button slot="footer" Label="OK" Variant="primary" (click)="Close" />
		</Window>
		<Window Title="Notes" Icon="edit" HeaderShape="trapezoid" X="340" Y="40" Width="280" Height="180">
			<p class="elemenx-text small">Drag a window by its header, resize it by its edges; a double press on the header maximizes it.</p>
		</Window>
	</div>
</div>
<Button Label="Show Properties" [disabled]="Shown" (click)="Show" />
<span class="elemenx-text small muted">{{Note}}</span>
<script>
({
	Shown: true,
	Note: '',

	Show: function () {
		this.Shown = true;
	},

	Close: function () {
		this.Shown = false;
	},

	Moved: function (place) {
		this.Note = 'Moved to ' + place.X + ', ' + place.Y;
	}
})
</script>
```

## Tests

- [Messaging.Window and a Component $Messaging declaration validate their arguments](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging-contracts.test.js#L95) — `tests/regression/messaging-contracts.test.js`
- [posts Messaging packets to a Window with the configured target origin](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L285) — `tests/regression/messaging.test.js`
- [does not inspect contentWindow on a Window-like target](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L304) — `tests/regression/messaging.test.js`
- [accepts an iframe directly instead of requiring contentWindow boilerplate](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L321) — `tests/regression/messaging.test.js`
- [accepts a document selector directly](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L336) — `tests/regression/messaging.test.js`
- [owner-aware $Messaging.Window resolves an iframe selector inside its owner](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L352) — `tests/regression/messaging.test.js`
- [deduplicates repeated Window bridge registration for the same target and origin](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L370) — `tests/regression/messaging.test.js`
- [automatically accepts a same-origin Window HELLO announcement](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L385) — `tests/regression/messaging.test.js`
- [requires explicit mutual trust before accepting a cross-origin Window announcement](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L408) — `tests/regression/messaging.test.js`
- [queues Window Messaging until a trusted discovery bridge becomes active](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L438) — `tests/regression/messaging.test.js`
- [accepts only messages from the attached Window and configured origin](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L475) — `tests/regression/messaging.test.js`
- [owner-aware $Messaging.Window is destroyed with its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/messaging.test.js#L510) — `tests/regression/messaging.test.js`

+2 more in the same files
