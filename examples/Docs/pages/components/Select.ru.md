<!-- generated -->
# Select

Выпадающий список: кнопка, открывающая список Options и показывающая выбранный вариант. Options: [{Value, Label, Hint, Icon, Group, Disabled}]; варианты одной Group идут под её заголовком. Value — Value выбранного варианта с исходным типом или null. Placeholder показывается, пока ничего не выбрано, Empty — когда фильтр ничего не нашёл. Searchable добавляет поле фильтра вверху списка; Clearable — кнопку сброса значения. Клавиши: стрелки двигают, Enter (пробел без фильтра) выбирает, Escape закрывает, буква переходит к следующему варианту на неё. Icon, Size, Shape, Name, Disabled и Invalid — как в Input. События: change (Value; null при сбросе). Label — имя поля для скринридера, когда его не называет Field.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Options` | `[]` |
| `Value` | `null` |
| `Label` | `''` |
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

- `change`: Выбран другой вариант: Value со своим типом; null, если очищено.

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

## Тесты

- [Select with Searchable: its search field](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L64) — `tests/regression/focus-on-open.test.js`
- [nested structural recreation keeps keyed Components and behavioral directives lifecycle-safe](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-directive-integration.test.js#L119) — `tests/regression/component-directive-integration.test.js`
- [a component named like a native element receives \[prop\] inputs that the element would refuse](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/directive-syntax.test.js#L244) — `tests/regression/directive-syntax.test.js`
- [chat messages: a tap opens the menu, a long press starts a choice of several, the bar counts and deletes them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1549) — `tests/examples/ui-kit.spec.js`
- [chat messages show their state, open their menu by a right click or the dots, and sum up reactions and views](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5328) — `tests/examples/ui-kit.spec.js`
- [drawing: a rectangle drawn with its tool, selected, layers chosen and hidden](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L9423) — `tests/examples/ui-kit.spec.js`
- [Field names the control inside by its Label, unless the control has a name of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L327) — `tests/regression/library-forms.test.js`
