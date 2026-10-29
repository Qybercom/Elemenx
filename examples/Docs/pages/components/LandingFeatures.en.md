<!-- generated -->
# LandingFeatures

The features of a product: an Overline, a Title and its Text over a grid of Items [{ID, Icon, Image, Title, Text, Href}] (an Href makes the card a link), Columns of them (3; fewer on a narrow room). Variant: cards (in frames) or plain. Align: start or center. The default slot adds cards of its own to the grid.

## Properties

| Property | Default |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Items` | `[]` |
| `Columns` | `3` |
| `Variant` | `'cards'` |
| `Align` | `'start'` |

## Slots

default

## Example

```example
<LandingFeatures Overline="Why" Title="Made for the long run" [items]="Items" />
<script>
({
	Items: [
		{ID: 'one', Icon: 'file-code', Title: 'One file', Text: 'No build step.'},
		{ID: 'library', Icon: 'grid', Title: 'A library', Text: 'Two hundred components.'},
		{ID: 'native', Icon: 'monitor', Title: 'Native', Text: 'A site, a PWA, a desktop application.'}
	]
})
</script>
```

## Tests

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
