<!-- generated -->
# TimeInput

Поле времени в 24-часовом формате со своим выбором. Value — 'HH:MM' ('HH:MM:SS' с Seconds), '' когда пусто. При вводе часы остаются в 00–23, минуты и секунды — в 00–59; Min и Max ограничивают значение. MinuteStep задаёт шаг столбца минут в выборе; ввести можно любую минуту.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Seconds` | `false` |
| `MinuteStep` | `1` |
| `Min` | `''` |
| `Max` | `''` |
| `Placeholder` | `''` |
| `Locale` | `''` |
| `NowLabel` | `''` |
| `DoneLabel` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `ReadOnly` | `false` |
| `Invalid` | `false` |

## События

- `input`: Время изменилось при вводе или в выборе: Value ('HH:MM' или '').
- `change`: Время зафиксировано: Value.

## Пример

```example
<Field Label="Meeting" [hint]="Time || 'empty'"><TimeInput [value]="Time" MinuteStep="15" (change)="Changed" /></Field>
<Field Label="Working hours only" Hint="09:00 to 18:00"><TimeInput Min="09:00" Max="18:00" /></Field>
<Field Label="With seconds"><TimeInput Seconds="true" Value="12:30:15" /></Field>
<script>
({
	Time: '10:30',

	Changed: function (value) {
		this.Time = value;
	}
})
</script>
```
