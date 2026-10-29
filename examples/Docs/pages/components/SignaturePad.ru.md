<!-- generated -->
# SignaturePad

Поле для подписи пером, пальцем или мышью: штрихи сглаживаются и становятся тоньше, где перо движется быстро или давит слабее. Value — штрихи ([[{X, Y, P, T}]] в пикселях поля, P — нажим, T — миллисекунды от начала подписи, её ритм), по которым подпись перерисовывается в любом размере; change отправляет их после каждого штриха. Color и Width задают их вид; Clear() и Undo() (кнопки под полем, если Controls не false) убирают их. Image(type) возвращает подпись как data URL картинки (по умолчанию image/png), SVG() — как текст SVG; без подписи оба пусты. ReadOnly показывает подпись, которую нельзя изменить. Reference сравнивает подпись с образцом после каждого штриха (сервис Signatures): одна подпись, несколько (образцы человека, они объединяются через Enroll) или эталон Signatures.Enroll. Событие compare отправляет {Score, Parts, Match, Threshold}; ShowResult (true) пишет под полем, похожа ли подпись на образец. Threshold — оценка, которую подпись должна набрать (по умолчанию — порог эталона, иначе 0.75). Compare(reference) возвращает то же в любой момент. Это помощь интерфейсу, а не проверка безопасности: проверка, которая что-то решает, выполняется на сервере.

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
| `Reference` | `null` |
| `Threshold` | `null` |
| `ShowResult` | `true` |

## События

- `change`: Нарисован штрих или штрихи убраны: Value.
- `compare`

## Методы

- `Undo()`
- `Clear()`
- `Compare(reference)`
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

## Тесты

- [SignaturePad draws a stroke of the pointer, emits change with the strokes, undoes, clears and gives a picture and an SVG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L237) — `tests/regression/library-new.test.js`
- [scores a signature against another and against the samples of a person, its parts told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L61) — `tests/regression/library-signatures.test.js`
- [compares what is drawn with its Reference after each stroke, tells compare and says whether it looks like it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-signatures.test.js#L87) — `tests/regression/library-signatures.test.js`
