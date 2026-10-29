<!-- generated -->
# MosaicItem

Объявление элемента в шаблоне Mosaic: <MosaicItem ID="sea" Title="Море" Image="sea.jpg" Ratio="1.5" />. Принимает свойства элемента Mosaic (ID, Title, Text, Image, Color, Width, Height, Ratio, Span, Value, Row, Column, Class); разметка внутри становится содержимым элемента и сохраняет свои привязки; MosaicItem внутри другого — его ребёнок в treemap. Сам ничего не показывает: его читает Mosaic.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Image` | `''` |
| `Color` | `''` |
| `Width` | `null` |
| `Height` | `null` |
| `Ratio` | `null` |
| `Span` | `null` |
| `Value` | `null` |
| `Row` | `null` |
| `Column` | `null` |
| `Class` | `''` |

## Слоты

по умолчанию

## Тесты

- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
