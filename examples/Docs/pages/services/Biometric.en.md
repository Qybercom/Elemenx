<!-- generated -->
# Biometric

The fingerprint, face or PIN of the device (Touch ID, Windows Hello, Android) through WebAuthn: HTTPS or localhost. Every method takes callback(error, result); error.name is the name of the browser error ('NotAllowedError' when the user cancels, 'NotSupportedError' without WebAuthn).

- Available(callback): {Supported (WebAuthn), Platform (an authenticator built into the device)}.
- Register(options, callback): a new credential of this device. options: {Challenge (from the server: an ArrayBuffer or base64url), User: {ID, Name, DisplayName}, RelyingParty: {ID, Name}, Timeout}. The result, {ID, Type, ClientData, AttestationObject, Transports} in base64url, goes to the server to keep.
- Verify(options, callback): the user proves to be there. options: {Challenge, Credentials (the IDs kept by the server), RelyingParty ID, Timeout}. The result {ID, ClientData, AuthenticatorData, Signature, UserHandle} goes to the server, which checks the signature: only that check makes it secure.
- Check(callback): the user verification of this device without a server (the first Check registers the device in localStorage, StorageKey). It is a convenience, not a security measure: a script of the page can skip it.
- Forget(): drops the registration of Check.
- Guard(options): a guard for Reveal.Guard. Without options it uses Check; with options.Challenge(done) (done(error, challenge, credentials)) and options.Confirm(result, done) (done(error, true)) it asks the server.

## Methods

- `Available(callback)`
- `Register(options, callback)`
- `Verify(options, callback)`
- `Check(callback)`
- `Forget()`
- `Guard(options)`

## Example

```example
<Button Label="Is it available?" (click)="Check" />
<Button Label="Verify me on this device" Icon="lock" Variant="primary" (click)="Verify" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'WebAuthn needs HTTPS or localhost; the device asks for a fingerprint, a face or a PIN.',

	Check: function () {
		var self = this;

		this.$Service('Biometric').Available(function (error, result) {
			self.Note = error ? error.message : 'WebAuthn: ' + result.Supported + ' · a platform authenticator: ' + result.Platform;
		});
	},

	Verify: function () {
		var self = this;

		this.$Service('Biometric').Check(function (error) {
			self.Note = error ? 'Not verified: ' + error.name : 'Verified on this device';
		});
	}
})
</script>
```
