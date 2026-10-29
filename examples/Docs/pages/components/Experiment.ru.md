<!-- generated -->
# Experiment

Эксперимент страницы: показывается один из его Variant — тот, что сервис Audience выбрал для посетителя: по правилам вариантов, по сплиту остальных (запоминается для посетителя) или по ссылке, которая его задаёт (?variant=ID или ?variant=эксперимент:ID). Name — имя (ключ запомненного варианта и его событий); Variants ([{ID, When, Weight, Default}]) добавляет варианты из кода — к объявленным с тем же ID или новыми. Param — имя параметра ссылки (variant). Track (true) сообщает Audience о просмотре выбранного варианта. Visitor ({URL, Referrer, Language, Width, UserAgent}) показывает страницу так, как её увидел бы такой посетитель, — превью кампании. Событие choose ({Experiment, ID, Reason}); методы Convert(goal, data) — конверсия показанного варианта, Choose() — выбрать заново, Forget() — забыть запомненный вариант.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Variants` | `[]` |
| `Param` | `''` |
| `Track` | `true` |
| `Visitor` | `null` |
| `Reason` | `''` |

## События

- `choose`

## Слоты

по умолчанию

## Методы

- `Choose()`
- `Convert(goal, data)`
- `Forget()`

## Пример

```example
<RadioGroup Variant="segmented" [options]="Sources" [value]="Source" (change)="Visited" />
<Experiment Name="docs-hero" [visitor]="Visitor" (choose)="Chosen">
	<Variant ID="ads" Source="google"><LandingHero Layout="center" Title="20% off for the spring" Text="Found us in a search? The code is applied at checkout." [actions]="Actions" /></Variant>
	<Variant ID="a"><LandingHero Layout="center" Title="Build interfaces in one file" [actions]="Actions" /></Variant>
	<Variant ID="b"><LandingHero Layout="center" Title="Ship the interface today" [actions]="Actions" /></Variant>
</Experiment>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: '',
	Source: 'direct',
	Sources: [{Value: 'direct', Label: 'Direct'}, {Value: 'google', Label: 'Google ads'}],
	Visitor: {URL: '/'},
	Actions: [{ID: 'start', Label: 'Start', Goal: 'start'}],

	Visited: function (value) {
		this.Source = value;
		this.Visitor = {URL: value === 'google' ? '/?utm_source=google' : '/'};
	},

	Chosen: function (event) {
		this.Text = 'Variant ' + event.ID + ' (' + event.Reason + ')';
	}
})
</script>
```

## Тесты

- [tells who came, from where, in which language and on what, and matches its rules](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L39) — `tests/regression/library-landing.test.js`
- [chooses a forced variant, then a rule, then the one kept, then a split by weight, else the default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L65) — `tests/regression/library-landing.test.js`
- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
- [keeps the variant of a split for the visitor, and a link forces another one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L141) — `tests/regression/library-landing.test.js`
- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
