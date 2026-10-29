<!-- generated -->
# LandingFAQ

Вопросы клиентов: Items [{ID, Question, Answer}], каждый — <details>, который браузер открывает и закрывает (поиск по странице открывает найденный). Single держит открытым один вопрос; Open — ID вопроса, открытого сначала. Overline, Title и Text над ними; слот по умолчанию добавляет свои. Событие toggle ({ID, Open}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Items` | `[]` |
| `Single` | `false` |
| `Open` | `''` |

## События

- `toggle`

## Слоты

по умолчанию

## Пример

```example
<LandingFAQ Title="Questions" Single="true" Open="free" [items]="Items" />
<script>
({
	Items: [
		{ID: 'free', Question: 'Is it free?', Answer: 'Yes: it is open source.'},
		{ID: 'deps', Question: 'Has it dependencies?', Answer: 'None.'}
	]
})
</script>
```

## Тесты

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
