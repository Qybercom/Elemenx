# Forms

ElemenxUI collects and validates forms in two ways on one model, as Angular does: declared in the template with `Form` and `Field`, or made in code with the `Forms` service and handed to the template. Both give the same nodes: a value, its errors, its state (touched, dirty, pending, disabled) and the events of its changes.

## In the template

A `Form` makes its model of its `Field`s. A field with a `Name` and validators adds a control to it; its value comes from the control inside it, a native field or a component of ElemenxUI (`Input`, `Select`, `Checkbox`, `DateInput`...). The errors of a field show once it is touched (it lost the focus, or the form was submitted); a submit touches every field, waits for the validators that take time, and emits `submit` with `{Value, Model}` only when the form is valid, `invalid` with `{Errors, Model}` otherwise, and the first field in error takes the focus.

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

The validators of a `Field`: `Required`, `Email`, `Min`, `Max`, `MinLength`, `MaxLength`, `Pattern` (a regular expression as a text) and `Match` (the `Name` of another field that must hold the same value). `Messages` replaces the text of an error by its key (`{required: 'Tell us your name'}`). A form with `Disabled` disables every field; `Submit()` and `Reset()` do in code what its buttons do.

## In code

The `Forms` service makes the model: `Control(value, validators)`, `Group({name: node}, validators)` and `Array([node], validators)`. A form takes it by `[model]`, and a field takes a control of it by its `Name` (a path: `'address.city'`) or by `[control]`.

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

Every node has:

| Member | Meaning |
| --- | --- |
| `Value` | its value; setting it sets the value (a group takes an object, an array a list) |
| `Errors` | `null`, or `{key: params}` of its own validators |
| `Valid`, `Invalid`, `Pending`, `Status` | `Status` is `valid`, `invalid`, `pending` or `disabled` |
| `Touched`, `Dirty`, `Disabled` | it was left, it was changed, it is off (a disabled node is left out of the value and the validity of its group) |
| `Get(path)` | a node inside: `'address.city'`, `'items.0'`, or a list of names |
| `SetValue(value)`, `Patch(value)`, `Reset(value)` | sets all, sets the names given, goes back to the first value (or to this one), untouched and clean |
| `Touch()`, `Disable()`, `Enable()` | with everything inside |
| `Error(key)`, `Message()` | the params of one error, the phrase of the first error |
| `Validate(callback)` | calls back `(null, {Valid, Errors})` once no validator is pending; `Errors` by the path of each invalid node |
| `OnChange(listener)`, `OffChange(listener)` | `listener(node)` after a change of a value or a state inside |
| `ID` | a number of its own, for the `*key` of a list |

An array also has `Push(node)`, `Insert(index, node)`, `RemoveAt(index)` and `Clear()`; a group `Add(name, node)` and `Remove(name)`.

## Validators

`forms.Validators` holds `Required`, `RequiredTrue` (a check box that must be checked), `Email`, `Min(number)`, `Max(number)`, `MinLength(length)`, `MaxLength(length)`, `Pattern(expression)`, `Equal(name, other)` (for a group: two of its controls must match) and `Custom(key, test(value, control))`. A validator is any function `(control) -> null or {key: params}`.

An async validator is `function (control, callback)`, calling back the errors or `null` later; while it runs the control is `pending`, and only the answer for its present value counts:

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

`forms.Message(errors)` is the phrase of the first error in the language of the page (`ui.forms.<key>`), or the text an error gives itself (`{taken: 'This name is taken'}`).

## Example

A model made in code, its value and status shown as they change, and a list of phones that grows:

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
