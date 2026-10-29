<!-- generated -->
# MosaicItem

The declaration of an item in the template of a Mosaic: <MosaicItem ID="sea" Title="The sea" Image="sea.jpg" Ratio="1.5" />. It takes the props of an item of Mosaic (ID, Title, Text, Image, Color, Width, Height, Ratio, Span, Value, Row, Column, Class); markup inside it becomes the content of the item and keeps its bindings; MosaicItem inside another one is its child in a treemap. It shows nothing by itself: Mosaic reads it.

## Properties

| Property | Default |
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

## Slots

default

## Tests

- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
