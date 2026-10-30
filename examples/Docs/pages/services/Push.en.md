<!-- generated -->
# Push

Web Push: the server of the Application sends messages that reach the user even while the page is closed (a Service Worker shows them as notifications). HTTPS or localhost. Every method takes callback(error, result); error.name is the name of the browser error ('NotAllowedError' when the user refuses, 'NotSupportedError' where the browser has no push).

- Supported(): whether the browser has Web Push. Permission(): 'granted', 'denied' or 'default'.
- Subscribe({Key, Worker}, callback): asks the user, then subscribes; the result {Endpoint, Keys: {P256dh, Auth}, ExpirationTime, JSON} goes to the server, which sends to it (with the private key of the pair of Key: a VAPID public key in base64url). Worker is the URL of the Service Worker that receives the messages, registered when the page has none of its own (docs/LIBRARIES.md has one to copy: it shows {Title, Text, Icon, URL, Tag} as a notification, a press opens URL, and it tells the open pages).
- Subscription(callback): the subscription of this browser, or null. Unsubscribe(callback): true when it went.
- Notify(title, {Text, Icon, Tag, URL}, callback): a notification from the page itself (no server).
- On('message', callback) / Off('message', callback): the messages the worker passes to the open pages ({Type: 'push' or 'click', Data}).

## Methods

- `Supported()`
- `Permission()`
- `Subscribe(options, callback)`
- `Subscription(callback)`
- `Unsubscribe(callback)`
- `Notify(title, options, callback)`
- `On(name, callback)`
- `Off(name, callback)`

## Example

```example
<Properties>
	<Property Label="Web Push here" [value]="Supported ? 'yes' : 'no'" />
	<Property Label="Permission" [value]="Permission" />
</Properties>
<Button Label="A notification from the page" Icon="bell" (click)="Notify" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Supported: false,
	Permission: '',
	Note: 'Subscribe needs the VAPID key of your server: Push.Subscribe({Key}, callback).',

	$OnCreate: function () {
		var push = this.$Service('Push');

		this.Supported = push.Supported();
		this.Permission = push.Permission();
	},

	Notify: function () {
		var self = this;

		this.$Service('Push').Notify('Hello', {Text: 'A notification of the reference.'}, function (error) {
			self.Permission = self.$Service('Push').Permission();
			self.Note = error ? error.name : 'Shown';
		});
	}
})
</script>
```

## Tests

- [subscribes with the key of the server after the user allows it, and refuses without a key or a yes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L302) — `tests/regression/devices.test.js`
- [Protocol Push can emit multiple packets from a stream chunk](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/network-stream.test.js#L129) — `tests/regression/network-stream.test.js`
- [Protocol Push may return one packet or nothing, and Pause, Resume, Close and Off are safe on an idle stream](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/network-stream.test.js#L373) — `tests/regression/network-stream.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8975) — `tests/examples/ui-kit.spec.js`
