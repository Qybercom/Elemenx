<!-- generated -->
# Image

A picture that is easy to place. Src and Alt; Lazy (on by default) loads it when it comes near the viewport. Fit is the fit of the picture in its box (cover, contain, fill, none, scale-down) and Position the point it keeps in view (center, top, '30% 20%'...). Its box: Width and Height (a number of pixels or a length), Ratio ('16/9', '4:3', 1.5) and Stretch, how it follows its container: none (its own size, shrunk to the width of the container), width (as wide as the container), height (as high as it) or both (it fills it). Shape rounded or circle. While it loads a shimmer holds its place (Placeholder); a picture that does not load gives way to Fallback, then to the icon of a picture. Events load and error with {Src}.

## Properties

| Property | Default |
| --- | --- |
| `Src` | `''` |
| `Alt` | `''` |
| `Fit` | `'cover'` |
| `Position` | `'center'` |
| `Width` | `''` |
| `Height` | `''` |
| `Ratio` | `''` |
| `Stretch` | `'none'` |
| `Shape` | `''` |
| `Lazy` | `true` |
| `Placeholder` | `true` |
| `Fallback` | `''` |

## Events

- `load`: The picture loaded: {Src}.
- `error`: The picture did not load: {Src}.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Image Src="/data/cards/mountains.svg" Alt="Mountains" Width="200" Ratio="16:9" Shape="rounded" (load)="Loaded" />
	<Image Src="/data/cards/sea.svg" Alt="Sea" Width="120" Height="120" Shape="circle" Fit="cover" />
	<Image Src="/data/missing.png" Alt="A picture that does not load" Width="160" Ratio="4:3" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'A missing picture shows its fallback; pictures load near the viewport.',

	Loaded: function () {
		this.Note = 'The first picture is loaded.';
	}
})
</script>
```

## Tests

- [an image of src="{{Image}}" asks only for its image, never for the text {{Image}}](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/attribute-interpolation.test.js#L98) — `tests/regression/attribute-interpolation.test.js`
- [in a program gives the windows the icon drawn into a PNG at every change of Elemenx.Icon, and the count and the progress to the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L207) — `tests/regression/platform-icon.test.js`
- [rich editor reads and writes Markdown, edits tables, inserts images and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6517) — `tests/examples/ui-kit.spec.js`
- [exports the page as a template and imports a template back from the backstage, keeping the elements it does not know](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L317) — `tests/examples/designer.spec.js`
