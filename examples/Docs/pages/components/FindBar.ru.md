<!-- generated -->
# FindBar

Панель поиска и замены редактора (CodeEditor, RichEditor) или терминала: поле для текста, параметры Case, Word и RegExp, место совпадения («3 из 12», из Index и Count) с переходом к предыдущему и следующему, а с Replacing — поле замены с кнопками «Заменить» и «Заменить все» (CanReplace: false убирает их). Сама она ничего не ищет: отправляет find ({Query, Case, Word, RegExp}) при изменении текста или параметра, next и previous (Enter и Shift+Enter в поле), replace и replaceall ({Text}; Enter и Ctrl+Enter в поле замены) и close (Escape или её кнопка). Focus() ставит фокус в поле и выделяет текст; Autofocus делает это, как только панель готова.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Query` | `''` |
| `Case` | `false` |
| `Word` | `false` |
| `RegExp` | `false` |
| `Replacing` | `false` |
| `CanReplace` | `true` |
| `Count` | `0` |
| `Index` | `-1` |
| `Label` | `''` |
| `Autofocus` | `false` |

## События

`find`, `close`, `next`, `previous`, `replace`, `replaceall`

## Методы

- `Focus()`

## Пример

```example
<FindBar [query]="Query" [count]="Count" [index]="Index" Replacing="true" (find)="Found" (next)="Next" (previous)="Previous" (replace)="Replaced" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Query: 'elemenx',
	Count: 12,
	Index: 2,
	Note: 'The bar of an editor: it only reports; the editor finds.',

	Found: function (event) {
		this.Note = 'Find: ' + JSON.stringify(event);
	},

	Next: function () {
		this.Index = (this.Index + 1) % this.Count;
	},

	Previous: function () {
		this.Index = (this.Index + this.Count - 1) % this.Count;
	},

	Replaced: function (event) {
		this.Note = 'Replace with ' + JSON.stringify(event);
	}
})
</script>
```
