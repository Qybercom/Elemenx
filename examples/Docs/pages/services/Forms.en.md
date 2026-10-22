<!-- generated -->
# Forms

The models of forms: the values a form collects and their validation, as the forms of Angular have them. A model is a tree of plain objects, so a Component that keeps it in its state renders it as it changes:

- Control(value, validators): a value. Validators is a list of functions (control) -> null or {key: params} (the ones of Validators), or {Validators, Async, Disabled}: Async are functions (control, callback) that call back (errors or null) later; while they run the control is pending, and only the answer for its present value counts.
- Group({name: node}, validators): a named set of controls, groups and arrays; its validators see the whole group (Validators.Equal: two fields that must match). Array([node], validators): a list of them (Push, Insert, RemoveAt).

Every node has ID (a number of its own: the key of a list in a template), Value (setting it sets the value: a Group takes an object, an Array a list), Errors (null, or the errors of its own validators), Valid, Invalid, Pending, Status (valid, invalid, pending, disabled), Touched, Dirty, Disabled; Get(path) ('address.city', 'items.0' or a list of names), SetValue(value), Patch(value) (the names given only), Reset(value) (back to the first value, or to this one: untouched and clean), Touch() (with all inside: the errors show), Disable(), Enable(), Error(key), Message() (the phrase of its first error), Validate(callback) (calls back (null, {Valid, Errors}) once nothing is pending: errors by the path of each invalid node), OnChange(listener) and OffChange(listener) (listener(node) after a change of a value or a state inside). A disabled node is left out of the value of its group and of its validity.

- Validators: Required, RequiredTrue, Email, Min(number), Max(number), MinLength(length), MaxLength(length), Pattern(expression or text), Equal(name, other) for a group, and Custom(key, test(value, control)).
- Message(errors): the phrase of the first error (ui.forms.<key>, ui.forms.invalid for a key without one), or the text an error gives itself ({key: 'text'}).

Form and Field use these models: a Form gives Fields their controls by Name and validates them on submit.

## Methods

- `Control(value, validators)`
- `Group(controls, validators)`
- `Array(controls, validators)`
- `Message(errors)`

## Example

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
