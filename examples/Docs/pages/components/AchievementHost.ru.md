<!-- generated -->
# AchievementHost

Показывает достижения сервиса Achievements по одному поверх всей страницы, как это делает игровая консоль: круглый значок выскакивает, раскрывается в полосу с названием (по ней пробегает блик) и сворачивается обратно в значок, прежде чем исчезнуть. Поставьте один такой компонент в макет приложения. Placement: bottom (по умолчанию) или top, по центру окна. Нажатие на полосу закрывает её.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Placement` | `'bottom'` |

## Пример

```example
<Button Label="Unlock an achievement" Icon="trophy" Variant="primary" (click)="Unlock" />
<AchievementHost />
<script>
({
	Count: 0,

	Unlock: function () {
		var rarities = ['common', 'rare', 'epic', 'legendary'];

		this.Count++;

		this.$Service('Achievements').Show({
			Title: 'Reader ' + this.Count,
			Text: 'You opened ' + this.Count + ' pages of the reference.',
			Rarity: rarities[(this.Count - 1) % rarities.length],
			Points: this.Count * 10,
			Duration: 4000
		});
	}
})
</script>
```
