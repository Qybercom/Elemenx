<!-- generated -->
# TimeInput

A 24-hour time field with its own picker. Value is 'HH:MM' ('HH:MM:SS' with Seconds), '' when empty. The text keeps hours in 00-23 and minutes and seconds in 00-59 while typing; Min and Max limit the value. MinuteStep sets the step of the minute column of the picker; any minute can still be typed.

## Properties

| Property | Default |
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

## Events

`input`, `change`

## Example

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
