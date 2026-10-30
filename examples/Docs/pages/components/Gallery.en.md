<!-- generated -->
# Gallery

A gallery: one picture at a time out of Items [{ID, Image, Thumb, Alt, Title, Description, Tags}], with buttons to the previous and the next one, dots, a counter and thumbnails. Index is the picture shown; change emits the new one, select the item of a press on the picture.

- What shows: ShowTitle, ShowDescription, ShowTags (the caption: Caption 'overlay' over the picture, the default, or 'below' it), ShowArrows, ShowDots, ShowCounter, ShowThumbs. A caption with nothing to show is left out.
- Autoplay goes to the next picture (Direction 'next') or the previous one ('previous') every Interval milliseconds; it waits while the pointer or the focus is on the gallery and while the page is hidden, and a button pauses and plays it. Loop (true) goes round at the ends.
- Effect: slide (the default) or fade. Fit: cover (the default) or contain. Ratio: the shape of the picture ('16 / 9').
- The arrows (Home, End) change the picture when the gallery has the focus; the picture follows a finger across, or the mouse that drags it (*swipe), and a swipe goes to the next or the previous one (held back at the ends without Loop).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Index` | `0` |
| `ShowTitle` | `true` |
| `ShowDescription` | `true` |
| `ShowTags` | `true` |
| `ShowArrows` | `true` |
| `ShowDots` | `true` |
| `ShowCounter` | `true` |
| `ShowThumbs` | `false` |
| `Caption` | `'overlay'` |
| `Autoplay` | `false` |
| `Interval` | `5000` |
| `Direction` | `'next'` |
| `Loop` | `true` |
| `Effect` | `'slide'` |
| `Fit` | `'cover'` |
| `Ratio` | `'16 / 9'` |
| `Label` | `''` |

## Events

- `change`: Another picture is shown: its Index.
- `select`: The picture was pressed: its item.

## Example

```example
<Gallery [items]="Pictures" ShowThumbs="true" Label="Places" (change)="Changed" />
<p class="elemenx-text small muted">Picture {{Index + 1}} of {{Pictures.length}}</p>
<script>
({
	Index: 0,
	Pictures: [
		{ID: 'mountains', Image: '/data/cards/mountains.svg', Title: 'Mountains', Description: 'The northern range at dawn.', Tags: ['nature', 'cold']},
		{ID: 'sea', Image: '/data/cards/sea.svg', Title: 'Sea', Description: 'A calm bay in the south.', Tags: ['nature', 'water']},
		{ID: 'city', Image: '/data/cards/city.svg', Title: 'City', Description: 'Lights of the old town.', Tags: ['night']}
	],

	Changed: function (index) {
		this.Index = index;
	}
})
</script>
```

## Tests

- [a mouse drags a gallery and the pictures of a product card across, and the click that ends the drag presses nothing](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L2196) — `tests/examples/ui-kit.spec.js`
- [a finger swipes a gallery and the pictures of a product card across, and drags a menu sheet down to close it](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L2258) — `tests/examples/ui-kit.spec.js`
- [gallery shows one picture with its caption, goes by arrows, dots, thumbnails, keys and swipes, and plays by itself](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5769) — `tests/examples/ui-kit.spec.js`
