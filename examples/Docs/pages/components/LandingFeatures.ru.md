<!-- generated -->
# LandingFeatures

Возможности продукта: Overline, Title и Text над сеткой карточек Items [{ID, Icon, Image, Title, Text, Href}] (с Href карточка — ссылка), не больше Columns в ряд (3; меньше на узком месте). Variant: cards (в рамках) или plain. Align: start или center. Слот по умолчанию добавляет свои карточки в сетку.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Items` | `[]` |
| `Columns` | `3` |
| `Variant` | `'cards'` |
| `Align` | `'start'` |

## Слоты

по умолчанию

## Пример

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

## Тесты

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
