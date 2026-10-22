<!-- generated -->
# Card

Карточка: медиа у края (Image или слот media), шапка, тело (Title, Text и слот по умолчанию) и подвал (слот footer, затем слот actions в его конце). Variant: outlined (по умолчанию), elevated, flat или filled (в цвете Color, по умолчанию — акцентном). Orientation: vertical или horizontal (медиа рядом с содержимым; на узком окне снова над ним). Ratio — пропорции медиа ('16:9' по умолчанию, '1:1', '4:3'...). Href делает всю карточку ссылкой (Target), а кнопки внутри остаются кнопками. Loading показывает скелетон вместо Title и Text. Карточки библиотеки (PostCard, ProfileCard, CommentCard, ProductCard, PlanCard) построены так же.

## Свойства

| Свойство | По умолчанию |
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

## Слоты

`media`, `header`, по умолчанию, `footer`, `actions`

## Пример

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
