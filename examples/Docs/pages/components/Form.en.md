<!-- generated -->
# Form

A form: a <form> that collects its fields into Model, a Group of the Forms Service, and validates them. Model is a Group made in code (Forms.Group, Forms.Control and their validators), or, without one, a Group the Form makes of its Fields: a Field with a Name and its validators (Required, Email, Min, Max, MinLength, MaxLength, Pattern, Match) adds its control to it; a Field whose Name is in the Model takes the control of the Model. A Name of parts, as the forms of a server read them (user[address][city], items[2][name], tags[] for the next item of a list, or user.address.city), nests its control in groups and arrays: Value is {user: {address: {city}}, items: [{name}], tags: [...]}, and the groups a Field leaving empties go with it. On submit (a button of type submit, Enter in a field, or Submit()) every field is touched, so their errors show, and once nothing is pending the form emits submit with {Value, Model} if it is valid, or invalid with {Errors, Model} and the focus goes to the first field in error. A reset (a button of type reset, or Reset()) brings the Model back to its first values; event reset. Disabled disables the fieldset of the form.

## Properties

| Property | Default |
| --- | --- |
| `Model` | `null` |
| `Label` | `''` |
| `Disabled` | `false` |

## Events

- `submit`: Submitted and valid: {Value, Model}, the values of the fields and the Group.
- `invalid`: Submitted with errors: {Errors, Model}; the focus goes to the first field in error.
- `reset`: Reset to its first values: {Model}.

## Slots

default

## Methods

- `Submit()`
- `Reset()`

## Example

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

## Tests

- [keeps the controls of its Fields in their order on the page, whatever order they register in](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/form-order.test.js#L40) — `tests/regression/form-order.test.js`
- [nests the controls of names of parts (user\[address\]\[city\], items\[2\]\[name\], tags\[\]) and takes the groups made for them out with the last](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/form-order.test.js#L73) — `tests/regression/form-order.test.js`
- [Form nests the values of Fields named by parts (user\[name\], items\[ID\]\[title\], tags\[\]) and follows the rows of a *for that come and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L270) — `tests/regression/library-forms.test.js`
