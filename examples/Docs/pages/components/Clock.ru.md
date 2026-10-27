<!-- generated -->
# Clock

Текущее время: цифровые часы (время так, как его пишет язык страницы) или стрелочные (циферблат со стрелками). TimeZone показывает время часового пояса IANA (Europe/Paris), а Label подписывает его под временем (город); Seconds показывает секунды; Hour12 задаёт 12 или 24 часа (по умолчанию — как принято в языке). ShowDate добавляет дату под цифровыми часами. Часы идут раз в секунду и останавливаются, пока спят (Cache).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `TimeZone` | `''` |
| `Seconds` | `false` |
| `Hour12` | `null` |
| `ShowDate` | `false` |
| `Label` | `''` |
| `Size` | `'medium'` |

## Пример

```example
<div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
	<Clock Seconds="true" ShowDate="true" />
	<Clock Mode="analog" Seconds="true" />
	<Clock TimeZone="America/New_York" Label="New York" Size="small" />
	<Clock TimeZone="Asia/Tokyo" Label="Tokyo" Size="small" />
</div>
```
