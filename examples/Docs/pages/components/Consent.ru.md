<!-- generated -->
# Consent

Запрос согласия любого рода: cookie и аналитика, условия сервиса, рассылка новостей. Key называет согласие, а Version — его текст (новая версия спрашивает снова); Purposes — то, о чём он спрашивает, [{ID, Label, Description, Required}] (обязательная цель включена всегда). Он показывается, пока сервис Consents не хранит решения этой версии (или так, как решает Open true или false): Принять всё, Отклонить (только обязательные цели) и Настроить (переключатель для каждой цели, затем Сохранить) сохраняют решение там и отправляют change с ним. Show() снова открывает его с сохранённым выбором (ссылка «Настройки cookie»). Placement: bottom (баннер поверх низа страницы), center (карточка посередине) или inline (на своём месте). Его текст — Text или содержимое тега; Policy ссылается на полный текст.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Key` | `'default'` |
| `Version` | `''` |
| `Purposes` | `[]` |
| `Title` | `''` |
| `Text` | `''` |
| `Policy` | `''` |
| `PolicyLabel` | `''` |
| `Placement` | `'bottom'` |
| `Reject` | `true` |
| `Customize` | `true` |
| `Open` | `null` |

## События

- `change`: Принято решение: {Version, Choices: {цель: true или false}, Time}.
- `close`: Он скрылся после решения.

## Слоты

по умолчанию

## Методы

- `Show()`

## Пример

```example
<Consent Key="docs-example" Placement="inline" [open]="Open" [purposes]="Purposes" Policy="#" (change)="Decided">
	<p>This site keeps a few things in your browser. Choose what it may use.</p>
</Consent>
<p class="elemenx-text small muted">{{Note}} <Button Label="Ask again" Variant="ghost" Size="small" (click)="Again" /></p>
<script>
({
	Open: true,
	Purposes: [
		{ID: 'necessary', Label: 'Necessary', Description: 'Your session and your settings', Required: true},
		{ID: 'analytics', Label: 'Analytics', Description: 'Which pages are read'},
		{ID: 'news', Label: 'News by mail'}
	],
	Note: 'No decision yet.',

	Decided: function (decision) {
		var choices = decision.Choices;

		this.Open = false;
		this.Note = 'Analytics ' + (choices.analytics ? 'on' : 'off') + ', news ' + (choices.news ? 'on' : 'off') + '.';
	},

	Again: function () {
		this.Open = true;
	}
})
</script>
```

## Тесты

- [Consent asks while no decision of its version is kept, keeps the choices in Consents and asks again for a new version](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L146) — `tests/regression/library-new.test.js`
