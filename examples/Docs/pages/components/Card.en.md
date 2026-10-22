<!-- generated -->
# Card

A card: media at the edge (Image, or the media slot), a header, a body (Title, Text and the default slot) and a footer (the footer slot, then the actions slot at its end). Variant: outlined (default), elevated, flat or filled (in Color, the accent by default). Orientation: vertical or horizontal (the media beside the content; under it again on a narrow window). Ratio is the shape of the media ('16:9' by default, '1:1', '4:3'...). Href makes the whole card a link (Target), and the buttons inside it stay buttons. Loading shows skeleton lines in place of Title and Text. The cards of the Library (PostCard, ProfileCard, CommentCard, ProductCard, PlanCard) are built the same way.

## Properties

| Property | Default |
| --- | --- |
| `Variant` | `'outlined'` |
| `Orientation` | `'vertical'` |
| `Title` | `''` |
| `Text` | `''` |
| `Image` | `''` |
| `Ratio` | `''` |
| `Color` | `''` |
| `Href` | `''` |
| `Target` | `''` |
| `Label` | `''` |
| `Loading` | `false` |

## Slots

`media`, `header`, default, `footer`, `actions`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 280px;"><Card Title="Mountains" Text="The northern range at dawn." Image="/data/cards/mountains.svg" Ratio="16:9" Variant="elevated">
		<p class="elemenx-text small">Three days of hiking, two huts.</p>
		<Button slot="actions" Label="Book" Variant="primary" Size="small" />
	</Card></div>
	<div style="width: 420px;"><Card Title="Sea" Image="/data/cards/sea.svg" Orientation="horizontal" Variant="outlined" Href="#sea">
		<p class="elemenx-text small">A calm bay in the south. The whole card is a link.</p>
	</Card></div>
	<div style="width: 200px;"><Card Title="Loading" Loading="true" Variant="filled" /></div>
</div>
```
