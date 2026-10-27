<!-- generated -->
# Accordion

Sections that fold, one under the other: the Sections inside it (Collapsible). Exclusive (true by default) keeps one open at a time: opening a section folds the others, each with its own toggle event. Bordered draws them as one block with lines between them.

## Properties

| Property | Default |
| --- | --- |
| `Exclusive` | `true` |
| `Bordered` | `true` |
| `Label` | `''` |

## Slots

default

## Example

```example
<Accordion>
	<Section Title="Shipping" Collapsible="true">Delivery in 2 to 4 days, free from 50 €.</Section>
	<Section Title="Returns" Collapsible="true" Collapsed="true">30 days to send it back, in its box.</Section>
	<Section Title="Warranty" Collapsible="true" Collapsed="true">Two years, on the parts and the work.</Section>
</Accordion>
```
