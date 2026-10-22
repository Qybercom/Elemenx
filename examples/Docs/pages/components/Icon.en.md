<!-- generated -->
# Icon

An icon of a sprite: <Icon Name="add" />, or of another icon set: <Icon Name="weather:rain" /> (see the Icons Service). The symbols of a set are copied into the page once (as elemenx-icon-<name>), and every icon draws the shapes of its symbol itself (*glyph), with no <use>: Chrome rebuilds the shadow tree of every <use> on a restyle of the page, and with the developer tools open all the icons stay blank until a theme change is over. data-icon names the icon. Ready is true once the library sprite is copied. Sprite names another sprite file, drawn with <use>. Colored paints the named parts of a set (sun, moon, cloud, rain, snow, bolt, wind, fog, thermometer in the weather set) with the --elemenx-weather-* colors of the theme.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Size` | `16` |
| `Label` | `''` |
| `Sprite` | `''` |
| `Colored` | `false` |
| `Ready` | `false` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Icon Name="home" Size="24" />
	<Icon Name="settings" Size="24" />
	<Icon Name="heart" Size="24" Label="Liked" />
	<Icon Name="loader" Size="24" Spin="true" />
	<Icon Name="files:pdf" Size="32" />
	<Icon Name="brands:github" Size="32" Colored="true" />
	<Icon Name="weather:snow" Size="32" Colored="true" />
	<Icon Name="games:gamepad" Size="32" />
</div>
<div class="elemenx-container" style="gap: 12px; align-items: center;">
	<Field Label="An icon name" Hint="home, star-filled, files:zip, weather:sun..."><Input [value]="Name" (input)="Typed" /></Field>
	<Icon [name]="Name" Size="48" />
</div>
<script>
({
	Name: 'trophy',

	Typed: function (value) {
		this.Name = value;
	}
})
</script>
```
