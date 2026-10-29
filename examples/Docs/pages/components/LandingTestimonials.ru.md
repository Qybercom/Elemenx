<!-- generated -->
# LandingTestimonials

Отзывы клиентов: Items [{ID, Text, Name, Role, Avatar, Rating}] — цитаты в сетке (Columns, 3) с аватаром (картинка или сделанный из имени), именем, ролью и звёздами Rating. Overline, Title и Text над ними; слот по умолчанию добавляет свои.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Items` | `[]` |
| `Columns` | `3` |

## Слоты

по умолчанию

## Пример

```example
<LandingTestimonials Title="What the teams say" Columns="2" [items]="Items" />
<script>
({
	Items: [
		{ID: 'ada', Text: 'We moved a back office in a week.', Name: 'Ada Lovelace', Role: 'CTO', Rating: 5},
		{ID: 'alan', Text: 'The tables cover what we used three libraries for.', Name: 'Alan Turing', Role: 'Lead', Rating: 4.5}
	]
})
</script>
```

## Тесты

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
