<!-- generated -->
# LandingStats

Цифры продукта в ряд: Items [{ID, Value, Prefix, Suffix, Label, Precision}] (10 000+ пользователей, 99,9% доступности). При первом появлении на экране считаются от нуля (Animate, за Duration миллисекунд; сразу, если система просит меньше движения). Locale — язык чисел (по умолчанию язык страницы). Title — заголовок над ними.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Items` | `[]` |
| `Animate` | `true` |
| `Duration` | `1200` |
| `Locale` | `''` |

## Пример

```example
<LandingStats [items]="Items" />
<script>
({
	Items: [{ID: 'users', Value: 12000, Suffix: '+', Label: 'Users'}, {ID: 'uptime', Value: 99.9, Suffix: '%', Label: 'Uptime'}, {ID: 'countries', Value: 48, Label: 'Countries'}]
})
</script>
```

## Тесты

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
