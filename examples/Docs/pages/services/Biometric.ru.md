<!-- generated -->
# Biometric

Отпечаток пальца, лицо или PIN устройства (Touch ID, Windows Hello, Android) через WebAuthn: HTTPS или localhost. Каждый метод принимает callback(error, result); error.name — имя ошибки браузера ('NotAllowedError', когда пользователь отменил, 'NotSupportedError' без WebAuthn).

- Available(callback): {Supported (WebAuthn), Platform (аутентификатор, встроенный в устройство)}.
- Register(options, callback): новый ключ этого устройства. options: {Challenge (от сервера: ArrayBuffer или base64url), User: {ID, Name, DisplayName}, RelyingParty: {ID, Name}, Timeout}. Результат {ID, Type, ClientData, AttestationObject, Transports} в base64url отправляется серверу на хранение.
- Verify(options, callback): пользователь подтверждает своё присутствие. options: {Challenge, Credentials (ID, хранимые сервером), RelyingParty ID, Timeout}. Результат {ID, ClientData, AuthenticatorData, Signature, UserHandle} отправляется серверу, который проверяет подпись: только эта проверка делает защиту настоящей.
- Check(callback): проверка пользователя этого устройства без сервера (первый Check регистрирует устройство в localStorage, StorageKey). Это удобство, а не мера безопасности: скрипт страницы может её обойти.
- Forget(): удаляет регистрацию Check.
- Guard(options): охранник для Reveal.Guard. Без options использует Check; с options.Challenge(done) (done(error, challenge, credentials)) и options.Confirm(result, done) (done(error, true)) спрашивает сервер.

## Методы

- `Available(callback)`
- `Register(options, callback)`
- `Verify(options, callback)`
- `Check(callback)`
- `Forget()`
- `Guard(options)`

## Пример

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
