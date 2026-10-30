<!-- generated -->
# Keyboard

A keyboard of a computer, drawn key by key (the look and the controls): to show hotkeys, the keys held, or to take presses on a screen. Layout: 'full' (with the number pad), 'tkl' (without it) or 'compact' (the main block alone). Keys are named by their code (KeyboardEvent.code: KeyA, Digit1, ShiftLeft, ArrowUp, Numpad7...).

- Pressed: the codes shown pressed; Live also shows the keys held on the keyboard of the user while the page has the focus (class held: a key that goes down or up changes its own button, not the whole keyboard), but for the keys a control in the focus takes for itself (a Piano that plays them, a hotkey: they prevent the default of the key). Marks: {code: class} marks keys (a hotkey, a group of keys of a game), true for the mark of the theme.
- Labels: {code: text} names keys of their own; Native names the keys of characters as the keyboard layout of the user writes them (navigator.keyboard, Chrome and Edge), US English otherwise.
- Alternate: a second layout on the keys of characters, as on the keyboards of countries with another alphabet: the first one large in the top left corner of a key, the second one smaller in its bottom right corner. A name of a layout of the Library ('ru' Russian, 'uk' Ukrainian, 'el' Greek, 'he' Hebrew), 'native' (the layout of the user, as Native reads it), or {code: text} for any other.
- Clickable: a press of a key emits press ({Code, Label}); a key of the screen keyboard is a button.

## Properties

| Property | Default |
| --- | --- |
| `Layout` | `'full'` |
| `Pressed` | `[]` |
| `Marks` | `{}` |
| `Labels` | `{}` |
| `Native` | `false` |
| `Alternate` | `''` |
| `Live` | `false` |
| `Clickable` | `false` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Events

- `press`: A key was pressed on the screen: {Code, Label}.

## Example

```example
<RadioGroup Variant="segmented" Label="Second layout" [options]="Layouts" [value]="Alternate" (change)="Chose" />
<Keyboard Layout="compact" [alternate]="Alternate" [pressed]="Pressed" [marks]="{KeyW: true, KeyA: true, KeyS: true, KeyD: true, Space: true}" Live="true" Clickable="true" (press)="Press" />
<p class="elemenx-text small muted">Press a key on the screen, or type while the page has the focus: {{Last}}</p>
<Keyboard Layout="full" Size="small" [pressed]="['ControlLeft', 'ShiftLeft', 'KeyP']" Label="A hotkey" />
<script>
({
	Pressed: [],
	Last: '—',
	Alternate: 'ru',
	Layouts: [{Value: '', Label: 'none'}, {Value: 'ru', Label: 'ru'}, {Value: 'uk', Label: 'uk'}, {Value: 'el', Label: 'el'}, {Value: 'he', Label: 'he'}],

	Chose: function (value) {
		this.Alternate = value;
	},

	Press: function (event) {
		this.Last = event.Label + ' (' + event.Code + ')';
	}
})
</script>
```

## Tests

- [a keyboard lays out its keys, marks hotkeys, shows the keys held and takes presses](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3406) — `tests/examples/ui-kit.spec.js`
- [a piano lights its black keys too and names its notes and the keys that play them; a keyboard shows a second layout](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3560) — `tests/examples/ui-kit.spec.js`
- [shows the keys held in the page when made in a template, and in another document once it is put there](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/other-document.test.js#L89) — `tests/regression/other-document.test.js`
