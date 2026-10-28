<!-- generated -->
# Badges

Значки *badge и свойства Badge у Button. Describe(value) читает значение: число (счётчик: 0 ничего не показывает, больше Max (99) показывает 99+), 'dot' (что-то новое), 'busy' (выполняется задача), другой текст или {Value, Tone, Max, Label}. Возвращает {Shown, Kind (count, dot, busy, text), Tone (accent, info, success, warning, danger: для счётчика по умолчанию danger, иначе accent), Text (что показывает значок), Label (что вместо этого скажет экранная читалка: Label или фраза точки или кольца)}. Classes(value) — классы значка для этого значения.

## Методы

- `Describe(value)`
- `Classes(value)`

## Пример

```example
<table class="elemenx-table compact">
	<tr><th>Value</th><th>Kind</th><th>Text</th><th>Tone</th><th>Label</th></tr>
	<tr *for="row of Rows" *key="row.Value"><td><code class="elemenx-code">{{row.Value}}</code></td><td>{{row.Kind}}</td><td>{{row.Text}}</td><td>{{row.Tone}}</td><td>{{row.Label}}</td></tr>
</table>
<script>
({
	Rows: [],

	$OnCreate: function () {
		var badges = this.$Service('Badges');

		this.Rows = [3, 120, 'dot', 'busy', 'new', {Value: 7, Tone: 'success', Label: '7 builds'}].map(function (value) {
			var badge = badges.Describe(value);

			return {Value: JSON.stringify(value), Kind: badge.Kind, Text: badge.Text, Tone: badge.Tone, Label: badge.Label};
		});
	}
})
</script>
```

## Тесты

- [Badges: a count (none at 0, 99+ past Max), a dot, a busy ring and a text, with their tones and labels](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L63) — `tests/regression/library-services.test.js`
