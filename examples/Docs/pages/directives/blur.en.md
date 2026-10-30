<!-- generated -->
# *blur

*blur makes an element a surface of frosted glass: what is behind it blurred (backdrop-filter) and seen through the tint of the surface of the theme. *blur alone takes the tokens of the theme (--elemenx-blur-radius, -saturate, -tint); *blur="12" blurs 12 pixels; *blur="{Radius: 24, Saturate: 1.4, Tint: 0.5}" sets each (Saturate: 1 keeps the colors, Tint: 0 clear glass, 1 the surface itself). Where the browser cannot blur, or the reader asks for less transparency (prefers-reduced-transparency), the element has the surface, solid. The class is elemenx-blur.

## Example

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

## Tests

- [*blur makes an element frosted glass: the tokens of the theme alone, its radius as a number, each part of an object](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L54) — `tests/regression/library-directives.test.js`
