<!-- generated -->
# SignaturePad

Поле для подписи пером, пальцем или мышью: штрихи сглаживаются и становятся тоньше, где перо движется быстро или давит слабее. Value — штрихи ([[{X, Y, P}]] в пикселях поля, P — нажим), по которым подпись перерисовывается в любом размере; change отправляет их после каждого штриха. Color и Width задают их вид; Clear() и Undo() (кнопки под полем, если Controls не false) убирают их. Image(type) возвращает подпись как data URL картинки (по умолчанию image/png), SVG() — как текст SVG; без подписи оба пусты. ReadOnly показывает подпись, которую нельзя изменить.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `[]` |
| `Color` | `''` |
| `Width` | `2.5` |
| `Placeholder` | `''` |
| `Controls` | `true` |
| `ReadOnly` | `false` |
| `Label` | `''` |

## События

- `change`: Нарисован штрих или штрихи убраны: Value.

## Методы

- `Undo()`
- `Clear()`
- `Image(type)`
- `SVG()`

## Пример

```example
<SignaturePad Height="160" (change)="Signed" />
<p class="elemenx-text small muted">{{Strokes}} strokes</p>
<script>
({
	Strokes: 0,

	Signed: function (value) {
		this.Strokes = value.length;
	}
})
</script>
```
