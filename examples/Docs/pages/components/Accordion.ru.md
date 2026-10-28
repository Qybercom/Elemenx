<!-- generated -->
# Accordion

Сворачиваемые секции одна под другой: секции Section внутри него (Collapsible). Exclusive (по умолчанию true) оставляет открытой одну секцию: раскрытие одной сворачивает остальные, каждую со своим событием toggle. Bordered рисует их одним блоком с линиями между ними.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Exclusive` | `true` |
| `Bordered` | `true` |
| `Label` | `''` |

## Слоты

по умолчанию

## Пример

```example
<Accordion>
	<Section Title="Shipping" Collapsible="true">Delivery in 2 to 4 days, free from 50 €.</Section>
	<Section Title="Returns" Collapsible="true" Collapsed="true">30 days to send it back, in its box.</Section>
	<Section Title="Warranty" Collapsible="true" Collapsed="true">Two years, on the parts and the work.</Section>
</Accordion>
```

## Тесты

- [Accordion keeps one section open: opening one folds the others, each with its toggle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L76) — `tests/regression/library-new.test.js`
