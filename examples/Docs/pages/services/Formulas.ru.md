<!-- generated -->
# Formulas

Формулы, записанные как в LaTeX, которые браузер рисует как MathML. MathML(text, display) возвращает разметку <math> (display: true — формула на отдельной строке); текст, который не удалось прочитать, возвращается в <merror>. Поддерживаемая часть LaTeX: числа, буквы (курсивом) и имена функций (\sin, \log, \lim...), операторы (+ - = < > ( ) [ ] | ! , и \cdot \times \div \pm \mp \le \ge \ne \approx \equiv \to \infty \partial \nabla \in \notin \subset \cup \cap \forall \exists \ldots \cdots...), греческие буквы (\alpha... \Omega), группы { }, ^ и _ (степени, индексы, оба сразу), \frac и \dfrac, \sqrt и \sqrt[n], \sum, \prod, \int, \oint и \lim с пределами (снизу и сверху в выделенной формуле), \left и \right, \hat, \bar, \vec, \dot, \tilde, \overline, \underline, \text, \mathrm, \mathbf, \mathbb, пробелы (\, \: \; \quad \qquad) и матрицы \begin{matrix}, pmatrix, bmatrix, vmatrix и cases (& между ячейками, \\ между строками).

## Методы

- `MathML(text, display)`

## Пример

```example
<TextArea Rows="2" [value]="Text" (input)="Typed" />
<div [property.innerHTML]="MathML(Text)"></div>
<script>
({
	Text: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',

	$OnCreate: function () {
		var formulas = this.$Service('Formulas');

		this.MathML = function (text) {
			return formulas.MathML(text, true);
		};
	},

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```

## Тесты

- [Formulas: LaTeX as MathML, a fraction, a root, powers and indices, a display formula, and an error for what it cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L126) — `tests/regression/library-services.test.js`
