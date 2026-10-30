<!-- generated -->
# Print

Печать части страницы: браузер печатает собственный фрейм с копией этой части и таблицами стилей страницы (и теневого корня, в котором находится часть), так что остальная страница не попадает в печать. PDF получается из диалога печати браузера («Сохранить как PDF»). Кнопки для этого нет: её вызывают компоненты и приложения.

- Element(target, options, callback) печатает target: узел DOM (копируется, сам остаётся на месте) или текст HTML. Параметры: Title (документа: имя, которое получит PDF), Theme (по умолчанию 'light'; другое имя сервиса Theme или false — тема страницы), Class (классы body фрейма), Style (дополнительный CSS), Margin (поля страницы, по умолчанию '16mm') и Language (lang документа; по умолчанию — страницы). callback(error), когда диалог браузера закрывается.
- Document(target, options) возвращает HTML документа, который печатает Element.

## Методы

- `Document(target, options)`
- `Element(target, options, callback)`

## Пример

```example
<div class="docs-invoice elemenx-card" style="padding: 16px;">
	<h3>Invoice 2026-104</h3>
	<table class="elemenx-table compact">
		<tr><th>Item</th><th>Price</th></tr>
		<tr><td>Hosting, October</td><td>€ 24.00</td></tr>
		<tr><td>Support</td><td>€ 60.00</td></tr>
	</table>
</div>
<Button Label="Print the invoice" Icon="print" Variant="primary" (click)="Print" />
<span class="elemenx-text small muted">Only the invoice prints, in the light theme; the dialog of the browser saves it as PDF.</span>
<script>
({
	Print: function () {
		this.$Service('Print').Element(this.$Element().querySelector('.docs-invoice'), {Title: 'Invoice 2026-104', Margin: '20mm'}, function () {});
	}
})
</script>
```

## Тесты

- [code editor finds and replaces, switches languages, wraps and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6324) — `tests/examples/ui-kit.spec.js`
- [rich editor reads and writes Markdown, edits tables, inserts images and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6544) — `tests/examples/ui-kit.spec.js`
