<!-- generated -->
# Presence

A presence: of a person (online, away, busy, dnd: do not disturb, offline) or of a connection (online, connecting: a ring that turns while it waits, offline). Status names it; a status of its own is a dot of the muted color. A dot, or with ShowLabel the dot and its name (Label, or the phrase of the status). Size small, medium or large. The dot alone is an image named by its status for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `Status` | `'online'` |
| `Label` | `''` |
| `ShowLabel` | `false` |
| `Size` | `'medium'` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Presence Status="online" ShowLabel="true" />
	<Presence Status="away" ShowLabel="true" />
	<Presence Status="busy" ShowLabel="true" />
	<Presence Status="dnd" ShowLabel="true" />
	<Presence Status="offline" ShowLabel="true" />
	<Presence Status="connecting" ShowLabel="true" Label="Reconnecting" />
</div>
<div class="elemenx-container" style="gap: 8px;">
	<Presence Status="online" Size="small" />
	<Presence Status="online" />
	<Presence Status="online" Size="large" />
</div>
```
