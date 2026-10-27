<!-- generated -->
# Формы и валидация

Форма регистрации, как у настоящего сервиса: правила каждого поля, правило всей формы, имя, которое сервер проверяет прямо при вводе, растущий список и ошибки, о которых знает только сервер. Готовый проект — `examples/Tutorials/Signup`.

Чему вы научитесь: модель формы в коде через сервис `Forms`, валидаторы поля, группы и асинхронные, ошибки поля и когда они видны, список полей и ответ сервера на том поле, к которому он относится.

## 1. Два способа, одна модель

Короткой форме код не нужен: `Form` сама строит модель из своих `Field` (`Required`, `Email`, `MinLength`, `Match`...), как в [руководстве по формам](/guide/forms). Как только у формы появляются свои правила, сервер, которого надо спросить, или список полей, создайте модель в коде и передайте её в `Form`: шаблон остаётся тем же, логика переезжает в компонент.

## 2. Модель

```js
$OnCreate: function () {
	var forms = this.$Service('Forms');
	var rules = forms.Validators;

	this.Account = forms.Group({
		Name: forms.Control('', {Validators: [rules.Required, rules.MinLength(3), rules.Pattern('[A-Za-z0-9_]+')], Async: [free]}),
		Email: forms.Control('', [rules.Required, rules.Email]),
		Password: forms.Control('', [rules.Required, rules.MinLength(8), digit]),
		Repeat: forms.Control('', [rules.Required]),
		Phones: forms.Array([forms.Control('', [rules.Pattern('\\+?[0-9 ]{6,}')])]),
		Terms: forms.Control(false, [rules.RequiredTrue])
	}, [rules.Equal('Password', 'Repeat')]);
}
```

- `Control` — одно значение и его валидаторы.
- `Group` — набор именованных узлов; её собственные валидаторы видят их все: `Equal('Password', 'Repeat')` — правило двух полей, поэтому оно принадлежит группе.
- `Array` — список узлов: телефоны.

Модель — обычный объект в состоянии компонента: её `Value`, `Valid`, `Status` (`valid`, `invalid`, `pending`) и `Errors` каждого узла отрисовываются по мере изменения.

## 3. Свои валидаторы

Валидатор — функция: на входе контрол, на выходе `null` или ошибки. Ошибка может нести свой текст:

```js
function digit (control) {
	return !control.Value || /[0-9]/.test(control.Value) ? null : {digit: 'Add a digit'};
}
```

Пустое значение оставьте `Required`: правило, которое тоже падает на пустом поле, покажет две ошибки по одной причине.

## 4. Вопрос серверу

Асинхронный валидатор принимает callback. Пока он работает, контрол в состоянии `pending` (форма ждёт его при отправке), и считается только ответ для текущего значения, поэтому старый ответ, пришедший поздно, ничего не меняет:

```js
function free (control, callback) {
	var name = control.Value;

	window.setTimeout(function () {
		if (control.Value !== name) {
			callback(null);

			return;
		}

		accounts.IsFree(name, function (error, isFree) {
			if (error) callback({network: 'The name could not be checked'});
			else callback(isFree ? null : {taken: 'This name is taken'});
		});
	}, 250);
}
```

Пауза спрашивает сервер, когда имя на мгновение перестало меняться, а не на каждую клавишу. Асинхронные валидаторы запускаются, только когда прошли остальные: имя из двух букв не отправляется.

Сервер проекта — несколько строк `elemenx.config.js`, `Server.Request`: `elemenx dev` и `elemenx serve` отвечают им на `/api/...`. Настоящий проект спрашивает свой сервер; сервис `Accounts` — единственное место, которое знает адреса.

## 5. Шаблон

```html
<Form *if="!Created" Label="Sign up" [model]="Account" [disabled]="Busy" (submit)="Submitted">
	<Field Label="Name" Name="Name" Required="true" Hint="Letters, digits and _" [messages]="{pattern: 'Letters, digits and _ only'}"><Input Autocomplete="username" /></Field>
	<Field Label="Email" Name="Email" Required="true" [error]="EmailError"><Input Type="email" Autocomplete="email" /></Field>
	<Field Label="Password" Name="Password" Required="true"><Input Type="password" Autocomplete="new-password" /></Field>
	<Field Label="Repeat the password" Name="Repeat" Required="true" [error]="Mismatch ? 'The passwords differ' : ''"><Input Type="password" Autocomplete="new-password" /></Field>
	<div class="signup-phone" *for="phone of Account.Get('Phones').Controls" *key="phone.ID" [attribute.data-id]="phone.ID">
		<Field [control]="phone"><Input Type="tel" Label="Phone" /></Field>
		<button type="button" aria-label="Remove the phone" (click)="RemovePhone"><Icon Name="close" /></button>
	</div>
	<Button Variant="ghost" Icon="add" Label="Add a phone" (click)="AddPhone" />
	<Field Name="Terms"><Checkbox Label="I accept the terms" /></Field>
	<Button Type="submit" Variant="primary" Label="Create my account" [loading]="Busy" />
</Form>
```

- `Field` берёт контрол своего `Name` из модели `Form` или контрол, переданный через `[control]` (телефон из списка).
- Его ошибки видны, когда поле покинуто или форма отправлена: ошибка, пока человек ещё печатает, — это шум. `Messages` даёт ошибке свой текст; `Required` здесь только помечает подпись, правило — в модели.
- `Label` у `Field` называет его контрол для скринридера; `Autocomplete` позволяет браузеру заполнить поле, а менеджеру паролей — сохранить пароль.
- При отправке все поля трогаются, поэтому видны все ошибки, фокус переходит на первое поле с ошибкой, а `submit` приходит, только когда вся модель верна.

## 6. Правило формы на поле

Ошибка `Equal` принадлежит группе, а не полю. Покажите её там, куда смотрит человек, — под повтором пароля, когда его покинули:

```js
this.Watch = function () {
	self.Mismatch = !!self.Account.Error('equal') && self.Account.Get('Repeat').Touched;
};

this.Account.OnChange(this.Watch);
```

`OnChange` слышит каждое изменение значения или состояния в модели; `$OnDestroy` убирает слушатель (`OffChange`).

## 7. Список полей

```js
AddPhone: function () {
	this.Account.Get('Phones').Push(this.$Service('Forms').Control('', [this.$Service('Forms').Validators.Pattern('\\+?[0-9 ]{6,}')]));
},

RemovePhone: function (event) {
	var phones = this.Account.Get('Phones');
	var id = Number(event.target.closest('[data-id]').getAttribute('data-id'));

	phones.Controls.forEach(function (control, index) {
		if (control.ID === id)
			phones.RemoveAt(index);
	});
}
```

У каждого узла есть свой `ID`: это `*key` строк и способ, которым кнопка находит свою строку.

## 8. Последнее слово за сервером

То, что проверил браузер, может обойти кто угодно, поэтому сервер проверяет снова и может отказать. Его ответ попадает на поле, к которому относится, и остаётся, пока это поле не изменится:

```js
Submitted: function (event) {
	var self = this;
	var value = event.Value;

	this.Busy = true;

	this.$Service('Accounts').Create({Name: value.Name, Email: value.Email, Password: value.Password, Phones: value.Phones.filter(Boolean)}, function (error, result) {
		self.Busy = false;

		if (result && result.Errors) {
			self.Refused = value.Email;
			self.EmailError = result.Errors.Email || '';

			return;
		}

		self.Created = value.Name;
	});
}
```

`[disabled]="Busy"` на `Form` выключает все поля на время отправки, а `[loading]` показывает это на кнопке: второе нажатие не отправит форму дважды.

## 9. Попробуйте

```bash
cd examples/Tutorials/Signup
npm install
npm run dev
```

Отправьте пустую форму, введите имя `ada` (занято), пароль без цифры, два разных пароля и почту `ada@example.com`: сервер её отклонит.
