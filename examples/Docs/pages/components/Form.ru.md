<!-- generated -->
# Form

Форма: <form>, собирающая свои поля в Model — группу сервиса Forms — и проверяющая их. Model — группа, созданная в коде (Forms.Group, Forms.Control и их валидаторы), или, если её нет, группа, которую Form строит из своих Field: Field с Name и валидаторами (Required, Email, Min, Max, MinLength, MaxLength, Pattern, Match) добавляет в неё свой элемент; Field, чьё Name есть в модели, берёт элемент модели. Name из частей, как его читают формы на сервере (user[address][city], items[2][name], tags[] для следующего элемента списка или user.address.city), вкладывает свой элемент в группы и массивы: Value — {user: {address: {city}}, items: [{name}], tags: [...]}, а группы, которые опустели с уходом Field, уходят вместе с ним. При отправке (кнопка типа submit, Enter в поле или Submit()) все поля помечаются затронутыми, чтобы показать ошибки, и, когда ничего не ожидается, форма отправляет submit с {Value, Model}, если корректна, или invalid с {Errors, Model}, а фокус переходит к первому полю с ошибкой. Сброс (кнопка типа reset или Reset()) возвращает модели начальные значения; событие reset. Disabled выключает fieldset формы.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Model` | `null` |
| `Label` | `''` |
| `Disabled` | `false` |

## События

- `submit`: Отправлена и верна: {Value, Model}, значения полей и группа.
- `invalid`: Отправлена с ошибками: {Errors, Model}; фокус переходит на первое поле с ошибкой.
- `reset`: Сброшена к первым значениям: {Model}.

## Слоты

по умолчанию

## Методы

- `Submit()`
- `Reset()`

## Пример

```example
<Form Label="Sign up" (submit)="Submitted" (invalid)="Refused" (reset)="Cleared">
	<Field Label="Email" Name="email" Required="true" Email="true"><Input Type="email" Placeholder="ada@example.com" /></Field>
	<Field Label="Password" Name="password" Required="true" MinLength="8" Hint="At least 8 characters"><Input Type="password" /></Field>
	<Field Label="Repeat the password" Name="repeat" Required="true" Match="password"><Input Type="password" /></Field>
	<Field Label="Age" Name="age" Min="18" Max="120"><NumberInput /></Field>
	<div class="elemenx-container" style="gap: 8px;">
		<Button Type="submit" Variant="primary" Label="Sign up" />
		<Button Type="reset" Label="Reset" />
	</div>
</Form>
<pre class="elemenx-code">{{Result}}</pre>
<script>
({
	Result: 'Press Sign up with empty fields to see the errors.',

	Submitted: function (event) {
		this.Result = 'submit: ' + JSON.stringify(event.Value, null, 2);
	},

	Refused: function (event) {
		this.Result = 'invalid: ' + JSON.stringify(event.Errors, null, 2);
	},

	Cleared: function () {
		this.Result = 'reset';
	}
})
</script>
```
