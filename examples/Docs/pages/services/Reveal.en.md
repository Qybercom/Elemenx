<!-- generated -->
# Reveal

Showing what a field hides: a password (Input), a card number (CardNumberInput), a security code (CVVInput) or a one-time code (OTPInput). Their eye buttons call Toggle(field, kind). Hiding needs nothing; showing a Guarded field first asks: the field emits reveal with a request {Kind ('password', 'card', 'cvv' or 'code'), Element (the root of the field), Allow(), Deny()}, and the guard of the page, set with Guard(callback), gets the same request, as in a banking application that asks for a fingerprint before it shows a card number. The eye spins until Allow or Deny; an answer that comes after the field was hidden again or destroyed counts for nothing. HideAfter (milliseconds) on the field hides it again by itself. Guard(null) removes the guard.

## Methods

- `Guard(callback)`
- `Toggle(field, kind)`

## Example

```example
<Field Label="Password" Hint="Guarded: the eye asks before it shows; it hides again after 5 seconds"><Input Type="password" Value="correct horse battery" Guarded="true" HideAfter="5000" /></Field>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',

	$OnCreate: function () {
		var self = this;
		var dialogs = this.$Service('Dialogs');

		this.Guard = function (request) {
			dialogs.Confirm({Title: 'Show the ' + request.Kind + '?', Message: 'A bank would ask for a fingerprint here.'}, function (action) {
				if (action === 'ok') request.Allow();
				else request.Deny();

				self.Note = action === 'ok' ? 'Allowed' : 'Denied';
			});
		};

		this.$Service('Reveal').Guard(this.Guard);
	},

	$OnDestroy: function () {
		this.$Service('Reveal').Guard(null);
	}
})
</script>
```
