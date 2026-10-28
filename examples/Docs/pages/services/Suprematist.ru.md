<!-- generated -->
# Suprematist

Картины в духе супрематизма (Малевич), сделанные из зерна и одинаковые для одного зерна: плоские фигуры чистого цвета вдоль одной диагонали, доминирующая фигура, пересекающие её полосы, мелкие элементы на свободном месте — для обложек, заглушек картинок, аватаров и пустых состояний.
- Generate({Seed, Width, Height, Palette, Density, Background, Title}): SVG текстом (400 на 400; Palette classic — красный, чёрный, синий, жёлтый и охра на цвете бумаги, theme — цвета темы для картины на странице, или список CSS-цветов; Density от 0 до 1; Title делает её изображением для экранного диктора, иначе это декор).
- DataURL(options): то же как data: URL, для <img src> или CSS-фона.
- Figures(options): фигуры, из которых она состоит.
Компонент Suprematism рисует её на странице, Avatar — с Generate suprematism.

## Методы

- `Figures(options)`
- `Generate(options)`
- `DataURL(options)`

## Пример

```example
<img [src]="Picture" alt="A composition" width="320" height="200" style="border-radius: 8px;" />
<Button Label="Another seed" Icon="refresh" (click)="Next" />
<p class="elemenx-text small muted">Seed {{Seed}}: {{Count}} figures. The same seed, the same picture.</p>
<script>
({
	Seed: 1,
	Picture: '',
	Count: 0,

	$OnCreate: function () {
		this.Draw();
	},

	Next: function () {
		this.Seed++;
		this.Draw();
	},

	Draw: function () {
		var suprematist = this.$Service('Suprematist');
		var options = {Seed: 'cover-' + this.Seed, Width: 320, Height: 200, Density: 0.6};

		this.Picture = suprematist.DataURL(options);
		this.Count = suprematist.Figures(options).length;
	}
})
</script>
```

## Тесты

- [Random: the same numbers for the same seed, its helpers in their bounds, a fork of its own, a smooth noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L27) — `tests/regression/game-services.test.js`
- [makes the same picture of the same seed, another of another, in its palette, as SVG text or a data URL](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/suprematism.test.js#L46) — `tests/regression/suprematism.test.js`
