<!-- generated -->
# TimelineRange

Отрезок Timeline, объявленный внутри него: From и To, Label, Tone или Color и Lane (ID дорожки TimelineLane; без неё — первый свободный ряд). Содержимое внутри него заменяет Label как подпись. Сам ничего не показывает.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `From` | `''` |
| `To` | `''` |
| `Label` | `''` |
| `Tone` | `''` |
| `Color` | `''` |
| `Lane` | `''` |

## Слоты

по умолчанию

## Пример

```example
<Timeline Start="2026-01-01" End="2026-12-31">
	<TimelineRange ID="design" From="2026-01-10" To="2026-04-30" Label="Design" />
	<TimelineRange ID="build" From="2026-03-15" To="2026-09-30" Tone="info">Build <em>(v1)</em></TimelineRange>
	<TimelineRange ID="freeze" From="2026-10-01" To="2026-10-20" Label="Freeze" Color="#b4483f" />
</Timeline>
```
