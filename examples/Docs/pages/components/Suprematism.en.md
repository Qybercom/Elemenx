<!-- generated -->
# Suprematism

A picture in the manner of Suprematism, made of Seed: always the same for the same seed (the Suprematist Service). Width and Height (400) are its proportions, it fills the width of its place; Palette classic (red, black, blue, yellow on the ground of the paper), theme (the colors of the theme) or a list of CSS colors; Density 0 to 1; Title the text of its role img (none: it is decoration).

## Properties

| Property | Default |
| --- | --- |
| `Seed` | `''` |
| `Width` | `400` |
| `Height` | `400` |
| `Palette` | `'classic'` |
| `Density` | `0.5` |
| `Title` | `''` |

## Example

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
