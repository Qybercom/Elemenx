<!-- generated -->
# Presence

Присутствие: человека (online, away, busy, dnd — не беспокоить, offline) или соединения (online, connecting — кольцо, вращающееся в ожидании, offline). Status называет его; собственный статус — точка приглушённого цвета. Точка или, с ShowLabel, точка и её название (Label или фраза статуса). Size: small, medium или large. Точка без подписи — изображение, названное по статусу для экранных читалок.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Status` | `'online'` |
| `Label` | `''` |
| `ShowLabel` | `false` |
| `Size` | `'medium'` |

## Пример

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
