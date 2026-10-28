<!-- generated -->
# ProductCard

Карточка товара: Images (переключаются точками и свайпом пальца или мыши) или Image, Badge ('Sale', 'New'; BadgeVariant), сердечко избранного (Favorable, Favorite), Brand, Title, Rating (с половинками) и Reviews, Price и OldPrice в Currency, цвета Colors ([{Value, Color, Label}]) и размеры Sizes на выбор (Color, Size) и кнопка корзины (Cart, InCart). PriceStyle 'corner' ставит цену на картинку, как плитку в стиле Metro. Ratio — пропорции картинки ('1:1' по умолчанию). Variant и Href — как в Card. События: add ({Color, Size}), favorite ({Favorite}), color ({Color}), size ({Size}).

## Свойства

| Свойство | По умолчанию |
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

## События

- `favorite`: Сердечко: {Favorite}.
- `color`: Выбран другой цвет: {Color}.
- `size`: Выбран другой размер: {Size}.
- `add`: Кнопка корзины: {Color, Size}.

## Слоты

по умолчанию

## Пример

```example
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; align-items: start;">
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

## Тесты

- [the cards of posts, profiles, comments and products tell their buttons, and a comment makes buttons of its mentions and tags](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L454) — `tests/regression/library-controls.test.js`
