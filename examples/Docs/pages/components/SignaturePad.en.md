<!-- generated -->
# SignaturePad

A field to sign with a pen, a finger or the mouse: the strokes are smoothed, thinner where the pen moves fast or presses less. Value is the strokes ([[{X, Y, P}]] in pixels of the field, P the pressure), which redraw it at any size; change emits them after each stroke. Color and Width draw them; Clear() and Undo() (the buttons under it, unless Controls is false) take them away. Image(type) returns the signature as a data URL of a picture (image/png by default), SVG() as the text of an SVG; both are empty for no signature. ReadOnly shows a signature that cannot change. A point keeps T too, the milliseconds from the start of the signature (its rhythm, for a comparison).

Reference compares the signature with one on file after each stroke (the Signatures Service): a signature, several of them (the samples of a person, enrolled), or a reference of Signatures.Enroll. compare emits {Score, Parts, Match, Threshold}; ShowResult (true) says under the field whether it looks like the one on file. Threshold is the score it must reach (by default the one of the reference, else 0.75). Compare(reference) returns the same at any time. It is a help for an interface, not a check of security: a check that matters runs on a server.

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
| `Reference` | `null` |
| `Threshold` | `null` |
| `ShowResult` | `true` |

## Events

- `change`: A stroke was drawn, or strokes were taken away: Value.
- `compare`: The signature was compared with Reference: {Score, Parts, Match, Threshold}.

## Methods

- `Undo()`
- `Clear()`
- `Compare(reference)`
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

## Tests

- [SignaturePad draws a stroke of the pointer, emits change with the strokes, undoes, clears and gives a picture and an SVG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L237) — `tests/regression/library-new.test.js`
- [scores a signature against another and against the samples of a person, its parts told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L61) — `tests/regression/library-signatures.test.js`
- [compares what is drawn with its Reference after each stroke, tells compare and says whether it looks like it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L87) — `tests/regression/library-signatures.test.js`
