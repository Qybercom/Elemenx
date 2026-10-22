<!-- generated -->
# ProductCard

The card of a product: its Images (dots switch them, and a swipe across on a touch screen) or Image, a Badge ('Sale', 'New'; BadgeVariant), the favorite heart (Favorable, Favorite), Brand, Title, Rating (halves) and Reviews, Price and OldPrice in Currency, the Colors ([{Value, Color, Label}]) and Sizes to choose (Color, Size), and the cart button (Cart, InCart). PriceStyle 'corner' puts the price on the image, as a tile of the Metro style. Ratio is the shape of the image ('1:1' by default). Variant and Href as in Card. Events: add ({Color, Size}), favorite ({Favorite}), color ({Color}), size ({Size}).

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Brand` | `''` |
| `Image` | `''` |
| `Images` | `[]` |
| `Ratio` | `'1:1'` |
| `Badge` | `''` |
| `BadgeVariant` | `'danger'` |
| `Favorable` | `true` |
| `Favorite` | `false` |
| `Rating` | `null` |
| `Reviews` | `null` |
| `Price` | `null` |
| `OldPrice` | `null` |
| `Currency` | `'USD'` |
| `PriceStyle` | `'default'` |
| `Colors` | `[]` |
| `Color` | `''` |
| `Sizes` | `[]` |
| `Size` | `''` |
| `Cart` | `true` |
| `InCart` | `false` |
| `Disabled` | `false` |
| `Variant` | `'outlined'` |
| `Href` | `''` |
| `AddLabel` | `''` |
| `InCartLabel` | `''` |
| `FavoriteLabel` | `''` |
| `RatingLabel` | `''` |
| `ColorLabel` | `''` |
| `SizeLabel` | `''` |
| `ImagesLabel` | `''` |
| `ImageLabel` | `''` |

## Events

`favorite`, `color`, `size`, `add`

## Slots

default

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<ProductCard Title="Studio headphones" Brand="Elemenx Audio" [images]="['/data/cards/headphones.svg', '/data/cards/watch.svg']" Badge="−20%" Rating="4.5" Reviews="1280" Price="79.99" OldPrice="99.99" [colors]="Colors" Color="coral" (add)="Added" (favorite)="Favorite" />
	<ProductCard Title="Field watch" Brand="Elemenx Time" Image="/data/cards/watch.svg" Badge="New" BadgeVariant="success" Rating="5" Reviews="42" Price="149" (add)="Added" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	Colors: [
		{Value: 'coral', Color: '#ff6b6b', Label: 'Coral'},
		{Value: 'ink', Color: '#2b2f3a', Label: 'Ink'},
		{Value: 'sky', Color: '#4f7dff', Label: 'Sky'}
	],

	Added: function (event) {
		this.Note = 'Added to the cart' + (event.Color ? ' in ' + event.Color : '');
	},

	Favorite: function (event) {
		this.Note = event.Favorite ? 'In the favorites' : 'Out of the favorites';
	}
})
</script>
```
