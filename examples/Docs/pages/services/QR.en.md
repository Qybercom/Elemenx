<!-- generated -->
# QR

QR codes (ISO/IEC 18004): Encode(text, level) returns the modules of the code of a text, {Size, Version, Level, Modules: rows of true (dark) and false}: the text in UTF-8 (byte mode), the least version (1 to 40) it fits, level L, M (the default), Q or H of error correction (a code still reads with 7, 15, 25 or 30% of it damaged), and the mask with the least penalty. A text too long for version 40 throws. SVG(text, options) is the text of an SVG of it ({Level, Margin (4 modules), Dark, Light}), styled by Modules (square, dots, rounded or diamond), Eyes (the three finder patterns: square, rounded, circle or leaf), EyeColor, Gradient ({From, To, Angle}) and Logo (a URL in the middle, LogoSize: 0.22) or Text (a word there): with a Logo or a Text the level is H (LevelFor(options)), and the modules under them are left out. Raster(svg, width, height, callback) draws an SVG into a PNG, callback(error, data URL), a Logo of another place read in first. ModulePath(x, y, shape) is the path of a module of a shape.

## Methods

- `Encode(text, level)`
- `LevelFor(options)`
- `ModulePath(x, y, shape)`
- `SVG(text, options)`
- `Raster(svg, width, height, callback)`

## Example

```example
<p class="elemenx-text">Version {{Code.Version}}, {{Code.Size}} by {{Code.Size}} modules, level {{Code.Level}}, mask {{Code.Mask}}.</p>
<span style="display: inline-block; width: 120px;" [property.innerHTML]="Drawing"></span>
<script>
({
	Code: {},
	Drawing: '',

	$OnCreate: function () {
		var qr = this.$Service('QR');

		this.Code = qr.Encode('WIFI:T:WPA;S:Home;P:secret;;', 'Q');
		this.Drawing = qr.SVG('WIFI:T:WPA;S:Home;P:secret;;', {Level: 'Q'});
	}
})
</script>
```
