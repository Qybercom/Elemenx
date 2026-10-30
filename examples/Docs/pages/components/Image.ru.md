<!-- generated -->
# Image

Картинка, которую легко разместить. Src и Alt; Lazy (по умолчанию включено) загружает её, когда она приближается к экрану. Fit — как картинка вписана в рамку (cover, contain, fill, none, scale-down), Position — точка, которая остаётся видимой (center, top, '30% 20%'...). Рамка: Width и Height (число пикселей или длина), Ratio ('16/9', '4:3', 1.5) и Stretch — как она следует за контейнером: none (свой размер, сжатый до ширины контейнера), width (во всю ширину), height (во всю высоту) или both (заполняет его). Shape: rounded или circle. Пока картинка грузится, её место держит мерцание (Placeholder); не загрузившаяся уступает место Fallback, затем значку картинки. События load и error с {Src}.

## Свойства

| Свойство | По умолчанию |
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

## События

- `load`: Картинка загрузилась: {Src}.
- `error`: Картинка не загрузилась: {Src}.

## Пример

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

## Тесты

- [an image of src="{{Image}}" asks only for its image, never for the text {{Image}}](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/attribute-interpolation.test.js#L98) — `tests/regression/attribute-interpolation.test.js`
- [in a program gives the windows the icon drawn into a PNG at every change of Elemenx.Icon, and the count and the progress to the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L207) — `tests/regression/platform-icon.test.js`
- [rich editor reads and writes Markdown, edits tables, inserts images and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6517) — `tests/examples/ui-kit.spec.js`
- [exports the page as a template and imports a template back from the backstage, keeping the elements it does not know](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L317) — `tests/examples/designer.spec.js`
