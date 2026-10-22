<!-- generated -->
# Select

Выпадающий список: кнопка, открывающая список Options и показывающая выбранный вариант. Options: [{Value, Label, Hint, Icon, Group, Disabled}]; варианты одной Group идут под её заголовком. Value — Value выбранного варианта с исходным типом или null. Placeholder показывается, пока ничего не выбрано, Empty — когда фильтр ничего не нашёл. Searchable добавляет поле фильтра вверху списка; Clearable — кнопку сброса значения. Клавиши: стрелки двигают, Enter (пробел без фильтра) выбирает, Escape закрывает, буква переходит к следующему варианту на неё. Icon, Size, Shape, Name, Disabled и Invalid — как в Input. События: change (Value; null при сбросе).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Options` | `[]` |
| `Value` | `null` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `Icon` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Searchable` | `false` |
| `Clearable` | `false` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

`change`

## Пример

```example
<Field Label="Language"><Select [options]="Languages" [value]="Language" (change)="Changed" /></Field>
<Field Label="Time zone" Hint="Searchable, with groups; Clearable"><Select Placeholder="Pick a zone" [options]="Zones" Searchable="true" Clearable="true" (change)="Zoned" /></Field>
<p class="elemenx-text small muted">Language: {{Language}} · zone: {{Zone === null ? 'none' : Zone}}</p>
<script>
({
	Language: 'en',
	Zone: null,
	Languages: [{Value: 'en', Label: 'English', Icon: 'globe'}, {Value: 'ru', Label: 'Русский'}, {Value: 'de', Label: 'Deutsch', Disabled: true}],
	Zones: [
		{Value: 'Europe/London', Label: 'London', Group: 'Europe', Hint: 'UTC+0'},
		{Value: 'Europe/Berlin', Label: 'Berlin', Group: 'Europe', Hint: 'UTC+1'},
		{Value: 'Europe/Moscow', Label: 'Moscow', Group: 'Europe', Hint: 'UTC+3'},
		{Value: 'America/New_York', Label: 'New York', Group: 'America', Hint: 'UTC-5'},
		{Value: 'Asia/Tokyo', Label: 'Tokyo', Group: 'Asia', Hint: 'UTC+9'}
	],

	Changed: function (value) {
		this.Language = value;
	},

	Zoned: function (value) {
		this.Zone = value;
	}
})
</script>
```
