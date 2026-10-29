<!-- generated -->
# LandingCTA

Призыв к действию: полоса с Title, Text и Actions ([{ID, Label, Href, Variant, Icon, Goal, Experiment}], как у LandingHero: Goal — конверсия эксперимента, внутри которого он стоит, или названного в Experiment). Tone: accent (в цвете темы) или neutral. Layout: row (действия рядом с текстом) или center. Слот по умолчанию — под действиями (форма почты, примечание). Событие action ({ID, Label, Href, Goal}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Text` | `''` |
| `Actions` | `[]` |
| `Tone` | `'accent'` |
| `Layout` | `'row'` |

## События

- `action`

## Слоты

по умолчанию

## Пример

```example
<LandingCTA Title="Ready to start?" Text="It takes a minute." [actions]="Actions" />
<script>
({
	Actions: [{ID: 'signup', Label: 'Create an account'}, {ID: 'sales', Label: 'Talk to us', Variant: 'secondary'}]
})
</script>
```

## Тесты

- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
