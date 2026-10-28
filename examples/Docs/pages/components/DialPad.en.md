<!-- generated -->
# DialPad

A dial pad: the number in a field over a grid of keys, a key that erases and a key that calls. Value is the number. Keys is the layout, row by row in Columns columns: [{Value, Label, Sub, Hold, Icon, Class}]: Value goes into the number, Label shows on the key (Value when empty) with Sub under it (the letters of a phone), Hold goes in place of Value after a long press (+ on 0), Icon draws the key, Class gives it a look of its own. Without Keys it is the pad of a phone: 1 to 9, *, 0 and #. ShowInput shows the field (the keys of the keyboard and a paste go in too, of the characters of the keys), ShowCall the key that calls, CallLabel its name; Disabled locks it. The key that erases takes the last character back, and the whole number when held. Events: input (the number), press ({Value}): a key pressed, call (the number): the key that calls, or Enter.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Keys` | `null` |
| `Columns` | `3` |
| `ShowInput` | `true` |
| `ShowCall` | `true` |
| `CallLabel` | `''` |
| `Label` | `''` |
| `Hold` | `500` |
| `Disabled` | `false` |

## Events

- `input`: The number changed: the number.
- `press`: A key was pressed: {Value}.
- `call`: The key that calls (or Enter): the number.

## Example

```example
<DialPad [value]="Number" (input)="Typed" (call)="Called" />
<p class="elemenx-text">{{Note}}</p>
<script>
({
	Number: '',
	Note: 'Type a number with the keys or the keyboard.',

	Typed: function (value) {
		this.Number = value;
	},

	Called: function (value) {
		this.Note = 'Calling ' + value + '...';
	}
})
</script>
```

## Tests

- [DialPad puts the keys pressed into the number, erases the last one, and calls with it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L235) — `tests/regression/library-controls.test.js`
