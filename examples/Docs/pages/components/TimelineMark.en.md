<!-- generated -->
# TimelineMark

A mark of a Timeline, declared in it: a moment (At) with its Label, Text, Icon, Tone (accent, info, success, warning, danger or muted) and Side (before: above the axis, or left of a vertical one; after: under it, or right). What is inside it is its label instead of Label (any content). It shows nothing by itself: the Timeline draws it.

## Properties

| Property | Default |
| --- | --- |
| `At` | `''` |
| `Label` | `''` |
| `Text` | `''` |
| `Icon` | `''` |
| `Tone` | `''` |
| `Side` | `''` |

## Slots

default

## Example

```example
<Timeline Start="2026-01-01" End="2026-12-31">
	<TimelineMark ID="kickoff" At="2026-01-15" Label="Kickoff" Icon="flag" />
	<TimelineMark ID="beta" At="2026-06-01" Tone="info" Side="after"><strong>Beta</strong> for testers</TimelineMark>
	<TimelineMark ID="release" At="2026-10-20" Label="Release" Tone="success" />
</Timeline>
```
