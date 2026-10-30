<!-- generated -->
# Push

Web Push: сервер приложения отправляет сообщения, которые доходят до пользователя, даже когда страница закрыта (Service Worker показывает их как уведомления). HTTPS или localhost. Каждый метод принимает callback(error, result); error.name — имя ошибки браузера ('NotAllowedError', когда пользователь отказал, 'NotSupportedError', где в браузере нет push).

- Supported(): есть ли в браузере Web Push. Permission(): 'granted', 'denied' или 'default'.
- Subscribe({Key, Worker}, callback): спрашивает пользователя, затем подписывается; результат {Endpoint, Keys: {P256dh, Auth}, ExpirationTime, JSON} отправляется серверу, который отправляет на него сообщения (закрытым ключом пары Key: открытый ключ VAPID в base64url). Worker — URL Service Worker, принимающего сообщения; он регистрируется, если у страницы нет своего (в docs/LIBRARIES.md есть готовый для копирования: показывает {Title, Text, Icon, URL, Tag} как уведомление, нажатие открывает URL, и он сообщает открытым страницам).
- Subscription(callback): подписка этого браузера или null. Unsubscribe(callback): true, если она удалена.
- Notify(title, {Text, Icon, Tag, URL}, callback): уведомление от самой страницы (без сервера).
- On('message', callback) / Off('message', callback): сообщения, которые воркер передаёт открытым страницам ({Type: 'push' или 'click', Data}).

## Методы

- `Supported()`
- `Permission()`
- `Subscribe(options, callback)`
- `Subscription(callback)`
- `Unsubscribe(callback)`
- `Notify(title, options, callback)`
- `On(name, callback)`
- `Off(name, callback)`

## Пример

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

## Тесты

- [subscribes with the key of the server after the user allows it, and refuses without a key or a yes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L302) — `tests/regression/devices.test.js`
- [Protocol Push can emit multiple packets from a stream chunk](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/network-stream.test.js#L129) — `tests/regression/network-stream.test.js`
- [Protocol Push may return one packet or nothing, and Pause, Resume, Close and Off are safe on an idle stream](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/network-stream.test.js#L373) — `tests/regression/network-stream.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8884) — `tests/examples/ui-kit.spec.js`
