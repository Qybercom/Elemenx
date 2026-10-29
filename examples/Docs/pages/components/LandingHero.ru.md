<!-- generated -->
# LandingHero

Первый экран лендинга: Overline, крупный Title, Text, действия и картинка. Layout: split (картинка рядом, на телефоне под текстом), center (текст по центру, картинка под ним) или cover (картинка за текстом, затемнённая). Image и ImageAlt, слот media — видео, форма или макет на месте картинки. Actions: [{ID, Label, Href, Variant (primary, secondary, ghost), Icon, Goal, Experiment}] — ссылка, если есть Href, иначе кнопка; Goal сообщает Audience о конверсии эксперимента, внутри которого стоит блок (или того, что назван в Experiment). Слот по умолчанию — под действиями. Событие action ({ID, Label, Href, Goal}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Overline` | `''` |
| `Title` | `''` |
| `Text` | `''` |
| `Image` | `''` |
| `ImageAlt` | `''` |
| `Layout` | `'split'` |
| `Actions` | `[]` |

## События

- `action`

## Слоты

по умолчанию, `media`

## Пример

```example
<LandingHero Overline="New" Title="Ship faster" Text="One file, no build step, two hundred components." [actions]="Actions" (action)="Acted" />
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Press an action.',
	Actions: [{ID: 'start', Label: 'Start free'}, {ID: 'docs', Label: 'Read the docs', Variant: 'secondary'}],

	Acted: function (event) {
		this.Text = 'Pressed ' + event.ID;
	}
})
</script>
```

## Тесты

- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
