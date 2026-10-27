<!-- generated -->
# SignaturePad

A field to sign with a pen, a finger or the mouse: the strokes are smoothed, thinner where the pen moves fast or presses less. Value is the strokes ([[{X, Y, P}]] in pixels of the field, P the pressure), which redraw it at any size; change emits them after each stroke. Color and Width draw them; Clear() and Undo() (the buttons under it, unless Controls is false) take them away. Image(type) returns the signature as a data URL of a picture (image/png by default), SVG() as the text of an SVG; both are empty for no signature. ReadOnly shows a signature that cannot change.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `[]` |
| `Color` | `''` |
| `Width` | `2.5` |
| `Placeholder` | `''` |
| `Controls` | `true` |
| `ReadOnly` | `false` |
| `Label` | `''` |

## Events

- `change`: A stroke was drawn, or strokes were taken away: Value.

## Methods

- `Undo()`
- `Clear()`
- `Image(type)`
- `SVG()`

## Example

```example
<SignaturePad Height="160" (change)="Signed" />
<p class="elemenx-text small muted">{{Strokes}} strokes</p>
<script>
({
	Strokes: 0,

	Signed: function (value) {
		this.Strokes = value.length;
	}
})
</script>
```
