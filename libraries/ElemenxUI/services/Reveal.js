/*
 * Showing what a field hides: a password (Input), a card number (CardNumberInput), a security code (CVVInput) or a
 * one-time code (OTPInput). Their eye buttons call Toggle(field, kind). Hiding needs nothing; showing a Guarded field
 * first asks: the field emits reveal with a request {Kind ('password', 'card', 'cvv' or 'code'), Element (the root of
 * the field), Allow(), Deny()}, and the guard of the page, set with Guard(callback), gets the same request, as in a
 * banking application that asks for a fingerprint before it shows a card number. The eye spins until Allow or Deny;
 * an answer that comes after the field was hidden again or destroyed counts for nothing. HideAfter (milliseconds) on
 * the field hides it again by itself. Guard(null) removes the guard.
 */
Elemenx.Service('Reveal', {
	$Meta: {
		Description: 'Showing what a field hides: a password (Input), a card number (CardNumberInput), a security code (CVVInput) or a one-time code (OTPInput).',
		Methods: ['Guard(callback)', 'Toggle(field, kind)']
	},
	$OnCreate: function () {
		this.Check = null;
		this.Sequence = 0;
	},

	$OnDestroy: function () {
		this.Check = null;
	},

	Guard: function (callback) {
		this.Check = typeof callback === 'function' ? callback : null;
	},

	Toggle: function (field, kind) {
		var self = this;
		var id;
		var request;

		if (field.Revealed) {
			this.Hide(field);

			return;
		}

		if (field.Asking) return;

		if (!field.Guarded || field.Guarded === 'false') {
			this.Show(field);

			return;
		}

		this.Sequence++;

		id = this.Sequence;
		field.Asking = id;

		request = {
			Kind: kind,
			Element: field.$Element(),
			Allow: function () {
				if (self.Settle(field, id))
					self.Show(field);
			},
			Deny: function () {
				self.Settle(field, id);
			}
		};

		field.$Emit('reveal', request);

		if (this.Check)
			this.Check(request);
	},

	/* Closes the request id of field: false when it is no longer the open one (answered, or the field is gone). */
	Settle: function (field, id) {
		try {
			if (field.Asking !== id) return false;

			field.Asking = 0;

			return true;
		}
		catch (error) {
			return false;
		}
	},

	Show: function (field) {
		var self = this;
		var delay = Number(field.HideAfter) || 0;

		window.clearTimeout(field.RevealTimer);

		field.Revealed = true;

		if (delay > 0) {
			field.RevealTimer = window.setTimeout(function () {
				try {
					self.Hide(field);
				}
				catch (error) {
					/* The field was destroyed meanwhile. */
				}
			}, delay);
		}
	},

	Hide: function (field) {
		window.clearTimeout(field.RevealTimer);

		field.RevealTimer = 0;
		field.Revealed = false;
	},

	/* For the $OnDestroy of a field: no timer and no open request outlive it. */
	Forget: function (field) {
		window.clearTimeout(field.RevealTimer);

		field.RevealTimer = 0;
		field.Asking = 0;
	}
});
