<!-- generated -->
# *blur

*blur делает элемент поверхностью матового стекла: то, что за ним, размыто (backdrop-filter) и видно сквозь оттенок поверхности темы. *blur без значения берёт токены темы (--elemenx-blur-radius, -saturate, -tint); *blur="12" размывает на 12 пикселей; *blur="{Radius: 24, Saturate: 1.4, Tint: 0.5}" задаёт каждое (Saturate 1 оставляет цвета, Tint 0 — прозрачное стекло, 1 — сама поверхность). Там, где браузер не умеет размывать или читатель просит меньше прозрачности (prefers-reduced-transparency), у элемента сплошная поверхность. Класс — elemenx-blur.

## Пример

```example
<div style="position: relative; height: 220px; overflow: hidden; border-radius: 12px; background: linear-gradient(135deg, #ff7a59, #ffd166 35%, #06d6a0 65%, #118ab2);">
	<div style="position: absolute; top: 24px; left: 40px; width: 120px; height: 120px; border-radius: 50%; background: #ef476f;"></div>
	<div style="position: absolute; bottom: 20px; right: 60px; width: 160px; height: 90px; border-radius: 24px; background: #073b4c;"></div>
	<div class="elemenx-container wrappable" style="position: absolute; inset: 40px 24px; gap: 16px; align-items: stretch;">
		<div *blur style="flex: 1; padding: 16px; border-radius: 12px;"><strong>*blur</strong><p class="elemenx-text small">The tokens of the theme.</p></div>
		<div *blur="Light" style="flex: 1; padding: 16px; border-radius: 12px;"><strong>Light</strong><p class="elemenx-text small">{{Radius}} px, a clear tint.</p></div>
	</div>
</div>
<Field Label="Radius"><Slider Min="0" Max="40" [value]="Radius" (change)="Changed" /></Field>
<script>
({
	Radius: 8,
	Light: {Radius: 8, Tint: 0.3, Saturate: 1.2},

	Changed: function (value) {
		this.Radius = value;
		this.Light = {Radius: value, Tint: 0.3, Saturate: 1.2};
	}
})
</script>
```

## Тесты

- [*blur makes an element frosted glass: the tokens of the theme alone, its radius as a number, each part of an object](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L54) — `tests/regression/library-directives.test.js`
