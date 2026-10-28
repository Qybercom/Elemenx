<!-- generated -->
# ImageCropper

The part of a picture to keep: a frame over Src that the pointer moves (inside it) and resizes (by its corners and sides), and the arrows move (with Shift, resize). Aspect keeps the shape of the frame (1 for a square, 16 / 9, 0 free); Round shows it as a circle (an avatar). Value is the frame in pixels of the picture, {X, Y, Width, Height} (by default the largest of its shape in the middle, MinSize at least); change emits it after each move. Image(type, quality, width) returns the part as a data URL of a picture (image/png, and width to scale it); a picture of another site needs CORS for it. Height is the height of the field; the picture fits in it.

## Properties

| Property | Default |
| --- | --- |
| `Src` | `''` |
| `Value` | `null` |
| `Aspect` | `0` |
| `Round` | `false` |
| `MinSize` | `32` |
| `Height` | `320` |
| `Disabled` | `false` |
| `Label` | `''` |

## Events

- `load`: The picture loaded: {Width, Height}.
- `change`: The frame moved or changed its size: Value.

## Methods

- `Image(type, quality, width)`

## Example

```example
<ImageCropper [src]="Picture" Aspect="1" Round="true" Height="260" (change)="Cropped" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Picture: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#5f7d95"/><circle cx="240" cy="140" r="70" fill="#f2c79a"/><rect x="150" y="220" width="180" height="100" rx="60" fill="#3b4a5a"/></svg>'),
	Note: 'Move the circle, or pull its handles.',

	Cropped: function (value) {
		this.Note = 'From ' + value.X + ', ' + value.Y + ': ' + value.Width + ' by ' + value.Height + ' pixels';
	}
})
</script>
```

## Tests

- [ImageCropper puts a frame of its shape in the middle, moves and resizes it inside the picture, by the pointer and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L295) — `tests/regression/library-new.test.js`
