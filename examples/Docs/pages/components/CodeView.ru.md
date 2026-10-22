<!-- generated -->
# CodeView

Исходный код для показа, без редактирования: Value с подсветкой сервиса Syntax на языке Language, как рисует CodeEditor. LineNumbers (и Start — номер первой строки), Wrap, Highlight ([3, '7-9']: помеченные строки), Copy (кнопка копирования кода, включена по умолчанию), Label. Текст можно выделять; Rows ограничивает высоту числом строк (дальше — прокрутка). Fold: скобка ({, [ или (), которая закрывается на одной из следующих строк, образует сворачиваемый блок: кнопка у его первой строки прячет строки до закрывающей, а первая строка заканчивается … и остатком последней ("items": [ … ],). Нажатие на … тоже разворачивает блок. Folded — номера строк, чьи блоки свёрнуты сначала; событие fold сообщает {Line, Folded} при каждом нажатии.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Language` | `'text'` |
| `LineNumbers` | `false` |
| `Start` | `1` |
| `Wrap` | `false` |
| `Highlight` | `[]` |
| `Copy` | `true` |
| `Rows` | `0` |
| `Label` | `''` |
| `Fold` | `false` |
| `Folded` | `[]` |

## События

`fold`

## Пример

```example
<CodeView Language="javascript" LineNumbers="true" [highlight]="[4]" Label="A function" Value="function greet (name) {&#10;&#9;var text = 'Hello, ' + name;&#10;&#10;&#9;return text.toUpperCase();&#10;}" />
<CodeView Language="json" Fold="true" [folded]="[7]" Label="A package" [value]="Package" (fold)="Folded" />
<p class="elemenx-text small muted">{{Note}}</p>
<CodeView Language="css" Rows="3" Value=".card {&#10;&#9;color: var(--elemenx-accent);&#10;&#9;padding: 12px;&#10;&#9;border-radius: 8px;&#10;}" />
<script>
({
	Note: 'Fold: the arrows fold the blocks, … unfolds them; the copy button shows under the pointer.',
	Package: '{\n\t"name": "elemenx",\n\t"keywords": [\n\t\t"ui",\n\t\t"es5"\n\t],\n\t"scripts": {\n\t\t"test": "vitest",\n\t\t"lint": "eslint ."\n\t}\n}\n',

	Folded: function (event) {
		this.Note = 'Line ' + event.Line + (event.Folded ? ' folded' : ' unfolded');
	}
})
</script>
```
