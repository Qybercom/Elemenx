<!-- generated -->
# Diff

Различия двух текстов (алгоритм Майерса: кратчайший список изменений). CodeEditor показывает их в режиме сравнения; ими может пользоваться любой компонент.

- Lines(before, after) возвращает строки обоих текстов по порядку: [{Type: 'same', 'remove' или 'add', Text, Old, New}] (Old и New — номера строки в каждом тексте с 1 или null, если её там нет).
- Words(before, after) возвращает, где различаются две версии строки: {Before: [{Start, End}], After: [{Start, End}]} (смещения в каждом тексте; единицы — слова, пробелы и знаки).
- Hunks(lines, context) группирует строки в изменения со строками контекста вокруг (по умолчанию 3) и неизменённые участки между ними: [{Type: 'change', Lines}] и [{Type: 'fold', Lines}].
- Stats(lines): {Added, Removed}.

## Методы

- `Lines(before, after)`
- `Words(before, after)`
- `Hunks(lines, context)`
- `Stats(lines)`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<TextArea Rows="5" [value]="Before" (input)="TypedBefore" />
	<TextArea Rows="5" [value]="After" (input)="TypedAfter" />
</div>
<p class="elemenx-text small muted">+{{Stats(Before, After).Added}} −{{Stats(Before, After).Removed}}</p>
<pre class="elemenx-code"><span *for="line of Lines(Before, After)" *key="$index" [style.color]="line.Type === 'add' ? 'var(--elemenx-success)' : line.Type === 'remove' ? 'var(--elemenx-danger)' : ''">{{line.Type === 'add' ? '+ ' : line.Type === 'remove' ? '- ' : '  '}}{{line.Text}}
</span></pre>
<script>
({
	Before: 'one\ntwo\nthree\nfour',
	After: 'one\n2\nthree\nfour\nfive',

	$OnCreate: function () {
		var diff = this.$Service('Diff');

		this.Lines = function (before, after) {
			return diff.Lines(before, after);
		};

		this.Stats = function (before, after) {
			return diff.Stats(diff.Lines(before, after));
		};
	},

	TypedBefore: function (value) {
		this.Before = value;
	},

	TypedAfter: function (value) {
		this.After = value;
	}
})
</script>
```

## Тесты

- [lists the lines of two texts as kept, removed and added, with their numbers in each text](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L24) — `tests/regression/diff.test.js`
- [finds the shortest list of changes in long texts quickly](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L39) — `tests/regression/diff.test.js`
- [marks the words that differ in two versions of a line](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L60) — `tests/regression/diff.test.js`
- [groups the lines into changes with their context and the folds between them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L67) — `tests/regression/diff.test.js`
- [code editor shows a diff with the original text, in one column or side by side, with the words changed and folds that open](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6189) — `tests/examples/ui-kit.spec.js`
