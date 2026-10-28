<!-- generated -->
# Suprematism

Картина в духе супрематизма, сделанная из Seed: для одного и того же зерна всегда одна и та же (сервис Suprematist). Width и Height (400) задают её пропорции, по ширине она заполняет своё место; Palette — classic (красный, чёрный, синий, жёлтый на цвете бумаги), theme (цвета темы) или список CSS-цветов; Density — от 0 до 1; Title — текст для экранного диктора (без него картина — декор).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Seed` | `''` |
| `Width` | `400` |
| `Height` | `400` |
| `Palette` | `'classic'` |
| `Density` | `0.5` |
| `Title` | `''` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 12px;">
	<Suprematism [seed]="Seed" Width="320" Height="200" Title="A composition" />
	<Suprematism [seed]="Seed" Width="200" Height="200" Palette="theme" Density="0.3" />
</div>
<Field Label="Seed: the same seed, the same picture">
	<Input [value]="Seed" (input)="Typed" />
</Field>
<script>
({
	Seed: 'Elemenx',

	Typed: function (value) {
		this.Seed = value;
	}
})
</script>
```

## Тесты

- [makes the same picture of the same seed, another of another, in its palette, as SVG text or a data URL](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/suprematism.test.js#L46) — `tests/regression/suprematism.test.js`
- [draws it in the page as a component, again when its seed changes, and as an avatar](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/suprematism.test.js#L74) — `tests/regression/suprematism.test.js`
