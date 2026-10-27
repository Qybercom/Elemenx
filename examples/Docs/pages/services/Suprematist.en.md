<!-- generated -->
# Suprematist

Pictures in the manner of Suprematism (Malevich, 1915-1920s): flat figures of pure color on a light ground, set along one diagonal, a dominant figure, bars that cross it, small elements in the free space. A picture is made of a seed, always the same for the same seed: covers, placeholders of pictures, avatars, empty states.

- Generate({Seed, Width, Height, Palette, Density, Background, Title}): the SVG as text. Width and Height (400) are its size; Palette 'classic' (red, black, blue, yellow, ochre on the ground of the paper), 'theme' (the colors of the theme, var(--elemenx-*): for a picture in the page) or a list of CSS colors; Density 0 to 1 (0.5) the number of figures; Background a color of its own; Title the text of its role img.
- DataURL(options): the same picture as a data: URL, for an <img src> or a CSS background.
- Figures(options): the figures it is made of, [{Kind (rect, circle, triangle, line, arc), X, Y, Width, Height, R, Turn, Fill}], to draw them otherwise.

## Methods

- `Figures(options)`
- `Generate(options)`
- `DataURL(options)`

## Example

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
