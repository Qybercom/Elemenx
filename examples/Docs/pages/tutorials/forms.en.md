# Forms and validation

A form to sign up, as a real service has it: the rules of each field, a rule of the whole form, a name the server checks while it is typed, a list that grows, and the errors only the server knows. The finished project is `examples/Tutorials/Signup`.

What you learn: a model of a form made in code with the `Forms` Service, validators of a field, of a group and async ones, the errors of a field and when they show, a list of fields, and the answer of a server shown on the field it is about.

## 1. Two ways, one model

A short form needs no code: a `Form` makes its model of its `Field`s (`Required`, `Email`, `MinLength`, `Match`...), as in [the guide on forms](/guide/forms). Once a form has rules of its own, a server to ask or a list of fields, make the model in code and hand it to the `Form`: the template stays the same, the logic moves to the component.

## 2. The model

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

- A `Control` is one value and its validators.
- A `Group` is a set of named nodes; its own validators see all of them: `Equal('Password', 'Repeat')` is a rule of two fields, so it belongs to the group.
- An `Array` is a list of nodes: the phones.

The model is a plain object in the state of the component: its `Value`, `Valid`, `Status` (`valid`, `invalid`, `pending`) and the `Errors` of each node render as they change.

## 3. Validators of your own

A validator is a function: the control in, `null` or the errors out. An error may carry its own text:

```js
function digit (control) {
	return !control.Value || /[0-9]/.test(control.Value) ? null : {digit: 'Add a digit'};
}
```

Leave the empty value to `Required`: a rule that also fails on an empty field shows two errors for one cause.

## 4. Asking the server

An async validator takes a callback. While it runs, the control is `pending` (the form waits for it on submit), and only the answer for the present value counts, so an old answer that comes late changes nothing:

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

The pause asks the server once the name stays the same for a moment, not at each key. Async validators run only once the others pass: a name of two letters is not sent.

The server of the project is a few lines of `elemenx.config.js`, `Server.Request`: `elemenx dev` and `elemenx serve` answer `/api/...` with it. A real project asks its own server; the `Accounts` Service is the only place that knows the URLs.

## 5. The template

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

- A `Field` takes the control of its `Name` from the model of the `Form`, or a control given by `[control]` (a phone of the list).
- Its errors show once the field is left, or the form is submitted: an error while a person still types is noise. `Messages` gives an error a text of its own; `Required` here only marks the label, the rule is in the model.
- The `Label` of a `Field` names its control for a screen reader; `Autocomplete` lets the browser fill it and its password manager keep the password.
- On submit every field is touched, so all the errors show, the focus goes to the first field in error, and `submit` comes only when the whole model is valid.

## 6. A rule of the form on a field

The error of `Equal` belongs to the group, not to a field. Show it where a person looks, under the repetition, once it was left:

```js
this.Watch = function () {
	self.Mismatch = !!self.Account.Error('equal') && self.Account.Get('Repeat').Touched;
};

this.Account.OnChange(this.Watch);
```

`OnChange` hears every change of a value or a state in the model; `$OnDestroy` takes the listener away (`OffChange`).

## 7. A list of fields

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

Each node has an `ID` of its own: the `*key` of the rows, and the way a button finds its row.

## 8. The server has the last word

What the browser checked, anyone may skip, so the server checks again and may refuse. Its answer goes on the field it is about, and stays until that field changes:

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

`[disabled]="Busy"` on the `Form` turns every field off while it is sent, and `[loading]` shows it on the button: a second press does not send it twice.

## 9. Try it

```bash
cd examples/Tutorials/Signup
npm install
npm run dev
```

Send it empty, type `ada` as the name (taken), a password without a digit, two different passwords, and `ada@example.com` as the email: the server refuses it.
