<!-- generated -->
# Формы

ElemenxUI собирает и проверяет формы двумя способами на одной модели, как Angular: объявлением в шаблоне через `Form` и `Field` или моделью, созданной в коде сервисом `Forms` и переданной шаблону. Оба дают одни и те же узлы: значение, его ошибки, его состояние (тронут, изменён, ожидает, отключён) и события изменений.

## В шаблоне

`Form` строит свою модель из своих `Field`. Поле с `Name` и валидаторами добавляет в неё элемент управления; значение берётся из элемента внутри поля — нативного или компонента ElemenxUI (`Input`, `Select`, `Checkbox`, `DateInput`...). Ошибки поля показываются, когда оно тронуто (потеряло фокус или форму отправили); отправка трогает каждое поле, ждёт долгих валидаторов и отправляет `submit` с `{Value, Model}`, только если форма корректна, иначе — `invalid` с `{Errors, Model}`, а первое поле с ошибкой получает фокус.

```example
<Form Label="Sign up" (submit)="Sent" (invalid)="Refused" (reset)="Cleared">
	<Field Label="Email" Name="email" Required="true" Email="true"><Input Type="email" /></Field>
	<Field Label="Password" Name="password" Required="true" MinLength="8" Hint="At least 8 characters"><Input Type="password" /></Field>
	<Field Label="Repeat it" Name="repeat" Required="true" Match="password" [messages]="{match: 'The passwords differ'}"><Input Type="password" /></Field>
	<Field Label="Age" Name="age" [min]="18"><NumberInput /></Field>
	<div class="elemenx-container" style="gap: 8px;">
		<Button Type="submit" Variant="primary" Label="Sign up" />
		<Button Type="reset" Variant="ghost" Label="Clear" />
	</div>
	<p class="elemenx-text small">{{Note}}</p>
</Form>
<script>
({
	Note: '',

	Sent: function (result) {
		this.Note = 'Sent: ' + JSON.stringify(result.Value);
	},

	Refused: function (result) {
		this.Note = 'Fix: ' + Object.keys(result.Errors).join(', ');
	},

	Cleared: function () {
		this.Note = 'Cleared';
	}
})
</script>
```

Валидаторы `Field`: `Required`, `Email`, `Min`, `Max`, `MinLength`, `MaxLength`, `Pattern` (регулярное выражение текстом) и `Match` (`Name` другого поля, значение которого должно совпадать). `Messages` заменяет текст ошибки по её ключу (`{required: 'Как вас зовут?'}`). Форма с `Disabled` отключает каждое поле; `Submit()` и `Reset()` делают в коде то же, что её кнопки.

## Имена из частей

`Name` читается так, как его читают формы на сервере: `user[name]` и `user[address][city]` (или `user.address.city`) кладут свои элементы в группу `user` и в группу `address` внутри неё, `items[2][title]` — в массив `items`, а каждое `tags[]` добавляет ещё один элемент в массив `tags`. Значение формы вложено так же: `{user: {name, address: {city}}, items: [{title}], tags: ['red', 'blue']}`; в массиве только элементы, у которых есть поле (`items[2]` в одиночку — первый элемент значения). Поле строки `*for` называет свой элемент по его ключу (`[name]="'items[' + item.ID + '][title]'"`): когда строка уходит, уходит и её элемент, а с последним — группа и массив, созданные для них. `Get` принимает те же имена (`Model.Get('items[2][title]')`), а ошибки `invalid` — по пути их элемента (`user.address.city`).

## В коде

Сервис `Forms` создаёт модель: `Control(value, validators)`, `Group({name: node}, validators)` и `Array([node], validators)`. Форма принимает её через `[model]`, а поле берёт её элемент по своему `Name` (путь: `'address.city'`) или через `[control]`.

```js
var forms = this.$Service('Forms');
var Validators = forms.Validators;

this.Profile = forms.Group({
	Name: forms.Control('', [Validators.Required, Validators.MaxLength(40)]),
	Age: forms.Control(18, [Validators.Min(18)]),
	Address: forms.Group({
		City: forms.Control(''),
		Zip: forms.Control('', [Validators.Pattern('^[0-9]{5}$')])
	}),
	Phones: forms.Array([forms.Control('')])
});

this.Profile.Value;                    /* {Name: '', Age: 18, Address: {City: '', Zip: ''}, Phones: ['']} */
this.Profile.Get('Address.City').Value = 'Riga';
this.Profile.Get('Phones').Push(forms.Control('+371'));
this.Profile.Valid;                    /* false: Name is required */
```

У каждого узла есть:

| Член | Значение |
| --- | --- |
| `Value` | его значение; присваивание задаёт значение (группа принимает объект, массив — список) |
| `Errors` | `null` или `{key: params}` его собственных валидаторов |
| `Valid`, `Invalid`, `Pending`, `Status` | `Status` — `valid`, `invalid`, `pending` или `disabled` |
| `Touched`, `Dirty`, `Disabled` | его покинули, его изменили, он выключен (выключенный узел не входит в значение и корректность своей группы) |
| `Get(path)` | узел внутри: `'address.city'`, `'items.0'` или список имён |
| `SetValue(value)`, `Patch(value)`, `Reset(value)` | задаёт всё, задаёт данные имена, возвращается к первому значению (или к этому) — нетронутым и чистым |
| `Touch()`, `Disable()`, `Enable()` | вместе со всем внутри |
| `Error(key)`, `Message()` | параметры одной ошибки, фраза первой ошибки |
| `Validate(callback)` | вызывает `(null, {Valid, Errors})`, когда ни один валидатор не ожидает; `Errors` — по пути каждого некорректного узла |
| `OnChange(listener)`, `OffChange(listener)` | `listener(node)` после изменения значения или состояния внутри |
| `ID` | собственный номер — для `*key` списка |

У массива есть ещё `Push(node)`, `Insert(index, node)`, `RemoveAt(index)` и `Clear()`; у группы — `Add(name, node)` и `Remove(name)`.

## Валидаторы

`forms.Validators` содержит `Required`, `RequiredTrue` (флажок, который должен быть отмечен), `Email`, `Min(number)`, `Max(number)`, `MinLength(length)`, `MaxLength(length)`, `Pattern(expression)`, `Equal(name, other)` (для группы: два её элемента должны совпадать) и `Custom(key, test(value, control))`. Валидатор — любая функция `(control) -> null или {key: params}`.

Асинхронный валидатор — `function (control, callback)`, который позже вызывает callback с ошибками или `null`; пока он работает, элемент в состоянии `pending`, и учитывается только ответ для его текущего значения:

```js
var name = forms.Control('', {
	Validators: [Validators.Required],
	Async: [function (control, callback) {
		api.IsFree(control.Value, function (error, free) {
			callback(free ? null : {taken: true});
		});
	}]
});
```

`forms.Message(errors)` — фраза первой ошибки на языке страницы (`ui.forms.<key>`) или текст, который ошибка задаёт сама (`{taken: 'Это имя занято'}`).

## Пример

Модель, созданная в коде, её значение и статус, показанные по мере изменения, и растущий список телефонов:

```example
<Form [model]="Profile" (submit)="Saved">
	<Field Label="Name" Name="Name"><Input /></Field>
	<Field Label="City" Name="Address.City"><Input /></Field>
	<Field *for="phone of Profile.Get('Phones').Controls" *key="phone.ID" Label="Phone" [control]="phone"><Input /></Field>
	<div class="elemenx-container" style="gap: 8px;">
		<Button Label="Add a phone" Icon="add" (click)="AddPhone" />
		<Button Type="submit" Variant="primary" Label="Save" />
	</div>
</Form>
<p class="elemenx-text small muted">{{Status}} · {{Json}}</p>
<script>
({
	Profile: null,
	Status: '',
	Json: '',

	$OnCreate: function () {
		var self = this;
		var forms = this.$Service('Forms');

		this.Profile = forms.Group({
			Name: forms.Control('Ada', [forms.Validators.Required]),
			Address: forms.Group({City: forms.Control('London')}),
			Phones: forms.Array([forms.Control('+44 20 7946 0000')])
		});

		this.Show = function () {
			self.Status = self.Profile.Status;
			self.Json = JSON.stringify(self.Profile.Value);
		};

		this.Profile.OnChange(this.Show);
		this.Show();
	},

	AddPhone: function () {
		this.Profile.Get('Phones').Push(this.$Service('Forms').Control(''));
	},

	Saved: function (result) {
		this.Status = 'Saved';
	}
})
</script>
```
