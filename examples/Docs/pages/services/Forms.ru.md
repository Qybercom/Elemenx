<!-- generated -->
# Forms

Модели форм: значения, которые собирает форма, и их проверка, как в формах Angular. Модель — дерево простых объектов, поэтому компонент, хранящий её в своём состоянии, перерисовывает её по мере изменений:

- Control(value, validators): значение. Validators — список функций (control) -> null или {ключ: параметры} (из Validators), или {Validators, Async, Disabled}: Async — функции (control, callback), которые позже вызывают callback (ошибки или null); пока они работают, элемент в ожидании, и учитывается только ответ для его текущего значения.
- Group({имя: узел}, validators): именованный набор элементов, групп и массивов; его валидаторы видят всю группу (Validators.Equal: два поля, которые должны совпадать). Array([узел], validators): их список (Push, Insert, RemoveAt).

У каждого узла есть ID (собственный номер: ключ списка в шаблоне), Value (присваивание задаёт значение: Group принимает объект, Array — список), Errors (null или ошибки его собственных валидаторов), Valid, Invalid, Pending, Status (valid, invalid, pending, disabled), Touched, Dirty, Disabled; Get(path) ('address.city', 'items.0' или список имён), SetValue(value), Patch(value) (только указанные имена), Reset(value) (к первому значению или к этому: нетронутый и чистый), Touch() (вместе со всем внутри: ошибки становятся видны), Disable(), Enable(), Error(key), Message() (фраза его первой ошибки), Validate(callback) (вызывает callback (null, {Valid, Errors}), когда ничего не ожидается: ошибки по пути каждого недопустимого узла), OnChange(listener) и OffChange(listener) (listener(node) после изменения значения или состояния внутри). Отключённый узел не входит в значение своей группы и в её допустимость.

- Validators: Required, RequiredTrue, Email, Min(number), Max(number), MinLength(length), MaxLength(length), Pattern(выражение или текст), Equal(name, other) для группы и Custom(key, test(value, control)).
- Message(errors): фраза первой ошибки (ui.forms.<ключ>, ui.forms.invalid для ключа без своей фразы) или текст, который ошибка задаёт сама ({ключ: 'текст'}).
- Имена полей, как их читают формы на сервере: Path(name) даёт части user[address][city] (или user.address.city), items[2][name] и tags[] (['tags', '']: конец массива). Get тоже их принимает. Place(group, path, node) кладёт узел по такому пути, создавая группы и массивы по дороге (массив, если следующая часть — номер или []): тогда Value вложено, {user: {address: {city}}, items: [{name}], tags: [...]}, а в массиве нет мест, которые не заполнило ни одно поле (items[5] в одиночку — [value]). Detach(node) убирает узел (массив сохраняет места остальных) и группы и массивы, созданные Place, которые после этого пусты.

Form и Field используют эти модели: Form раздаёт полям Field их элементы по Name и проверяет их при отправке.

## Методы

- `Control(value, validators)`
- `Group(controls, validators)`
- `Array(controls, validators)`
- `Place(group, path, item)`
- `Detach(item)`
- `Path(name)`
- `Message(errors)`

## Пример

```example
<Form [model]="Model" (submit)="Sent">
	<Field Label="Name" Name="Name"><Input /></Field>
	<Field Label="Email" Name="Email"><Input Type="email" /></Field>
	<Button Type="submit" Label="Send" Variant="primary" />
</Form>
<p class="elemenx-text small muted">{{Status}} · {{Errors}}</p>
<script>
({
	Model: null,
	Status: '',
	Errors: '',

	$OnCreate: function () {
		var self = this;
		var forms = this.$Service('Forms');

		this.Model = forms.Group({
			Name: forms.Control('', [forms.Validators.Required, forms.Validators.MinLength(2)]),
			Email: forms.Control('', [forms.Validators.Required, forms.Validators.Email])
		});

		this.Show = function (model) {
			self.Status = model.Status;
			self.Errors = JSON.stringify({Name: model.Get('Name').Errors, Email: model.Get('Email').Errors});
		};

		this.Model.OnChange(this.Show);
		this.Show(this.Model);
	},

	Sent: function (result) {
		this.Status = 'Sent: ' + JSON.stringify(result.Value);
	}
})
</script>
```

## Тесты

- [phone input keeps to its mask and picks the country of a pasted number](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1319) — `tests/examples/ui-kit.spec.js`
- [forms collect their fields, validate them in the template or by a model in code, and submit only when valid](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L2472) — `tests/examples/ui-kit.spec.js`
- [phone guide keeps the template and lists every country](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5338) — `tests/examples/ui-kit.spec.js`
- [combobox filters, picks, creates a value, restores on Escape and loads options from a server](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L9115) — `tests/examples/ui-kit.spec.js`
