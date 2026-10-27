# A grid in five lines of CSS

A grid of cards that fills the width, as many columns as fit, each at least 220 pixels wide:

```css
.cards {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 16px;
}
```

- `auto-fit` makes as many columns as fit;
- `minmax(220px, 1fr)` keeps each at least 220 pixels, and shares the rest.

No media query: the grid follows the width of its container.
