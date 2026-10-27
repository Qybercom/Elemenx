<!-- generated -->
# TimelineRange

A range of a Timeline, declared in it: From and To, its Label, Tone or Color, and Lane (the ID of a TimelineLane; none: the first free row). What is inside it is its label instead of Label. It shows nothing by itself.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `From` | `''` |
| `To` | `''` |
| `Label` | `''` |
| `Tone` | `''` |
| `Color` | `''` |
| `Lane` | `''` |

## Slots

default

## Example

```example
<Timeline Start="2026-01-01" End="2026-12-31">
	<TimelineRange ID="design" From="2026-01-10" To="2026-04-30" Label="Design" />
	<TimelineRange ID="build" From="2026-03-15" To="2026-09-30" Tone="info">Build <em>(v1)</em></TimelineRange>
	<TimelineRange ID="freeze" From="2026-10-01" To="2026-10-20" Label="Freeze" Color="#b4483f" />
</Timeline>
```
