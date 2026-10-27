<!-- generated -->
# TimelineMark

Отметка Timeline, объявленная внутри него: момент At с Label, Text, Icon, Tone (accent, info, success, warning, danger или muted) и Side (before — над осью или слева от вертикальной; after — под ней или справа). Содержимое внутри неё заменяет Label как подпись (любая разметка). Сама ничего не показывает: её рисует Timeline.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `At` | `''` |
| `Label` | `''` |
| `Text` | `''` |
| `Icon` | `''` |
| `Tone` | `''` |
| `Side` | `''` |

## Слоты

по умолчанию

## Пример

```example
<Timeline Start="2026-01-01" End="2026-12-31">
	<TimelineMark ID="kickoff" At="2026-01-15" Label="Kickoff" Icon="flag" />
	<TimelineMark ID="beta" At="2026-06-01" Tone="info" Side="after"><strong>Beta</strong> for testers</TimelineMark>
	<TimelineMark ID="release" At="2026-10-20" Label="Release" Tone="success" />
</Timeline>
```
