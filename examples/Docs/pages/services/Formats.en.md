<!-- generated -->
# Formats

Formats of text fields: an Input with Preset="email" (url, semver, ipv4, ipv6, uuid, iban, postal-code, integer, decimal) gets the right keyboard and autofill, drops the characters the format cannot hold while the user types, and checks and normalizes the value when it is committed. A format is {Type, InputMode, Autocomplete, Direction, Filter, Normalize(text, options), Validate(value, options)}: Direction ltr keeps Latin text (an address, a code) from left to right on a right-to-left page; Filter is a RegExp of the characters it keeps; Validate returns '' or the message of the error. Options: {Country} for postal-code, {Min, Max} for integer and decimal. Check(name, text, options) returns {Valid, Value, Message}: Value normalized (an IBAN without spaces, a decimal with a point). Display(name, value) is the text a field shows for a value (an IBAN in groups of four). Register(name, format) adds a format of the Application, Find(name) returns one, Names() lists them.

## Methods

- `Register(name, format)`
- `Find(name)`
- `Names()`
- `Check(name, text, options)`
- `Display(name, value)`

## Example

```example
<Field Label="IBAN" Hint="Shown in groups of four, checked by its country"><Input Preset="iban" Value="DE89370400440532013000" /></Field>
<Field Label="Email"><Input Preset="email" Placeholder="you@example.com" /></Field>
<Field Label="Postal code of Germany"><Input Preset="postal-code" Country="DE" /></Field>
<ul class="elemenx-ul"><li *for="check of Checks" *key="check.Text">{{check.Name}} "{{check.Text}}" → {{check.Result}}</li></ul>
<script>
({
	Checks: [],

	$OnCreate: function () {
		var formats = this.$Service('Formats');

		this.Checks = [['email', ' Ada@Example.COM '], ['url', 'example.com/docs'], ['ipv4', '256.1.1.1'], ['decimal', '3,14']].map(function (pair) {
			var result = formats.Check(pair[0], pair[1]);

			return {Name: pair[0], Text: pair[1], Result: result.Valid ? 'valid: ' + result.Value : result.Message};
		});
	}
})
</script>
```
