<!-- generated -->
# Сетевые контексты

Контекст — то, что разделяют несколько ресурсов: протокол, слушатели (заголовки авторизации, журналирование, отчёты об ошибках) и любые настройки, которые даёт функция. Его объявляют один раз и называют при создании ресурса.

```js
Elemenx.Network.Context('API', {
	Protocol: 'JSON',
	On: {
		'Transport.Error': function (event) {
			console.warn('Network error', event.Target);
		}
	},
	BeforeRequest: function (event) {
		event.Data.XHR.setRequestHeader('Authorization', 'Bearer ' + Session.Token());
	},
	Configure: function (resource, type) {
		if (type === 'XHR')
			resource.Header('Accept', 'application/json');
	}
});

var orders = this.$Network('API').XHR({URL: '/api/orders'});
var live = this.$Network('API').WebSocket({URL: 'wss://example.com/live'});
```

## Определение

| Член | Значение |
| --- | --- |
| `Contexts` | имя или список контекстов, на которых строится этот: они применяются первыми |
| `Configure(resource, type)` | вызывается с каждым ресурсом и его типом (`'XHR'`, `'WebSocket'`...) раньше всего остального; `false` в ответ исключает контекст для этого ресурса |
| `Protocol` | протокол, который получает каждый ресурс |
| `On` | `{eventName: listener}`: слушатели, добавляемые каждому ресурсу |
| `BeforeRequest(event)` | слушатель `Transport.BeforeRequest` (запросы: заголовки, подписи) |
| `BeforeConnect(event)` | слушатель `Transport.BeforeConnect` (соединения) |

Контекст, который через свои `Contexts` ссылается сам на себя (напрямую или через другие), применяется один раз: цикл на этом обрывается.

## Использование

- `Elemenx.Network.Context(name, definition)` объявляет контекст; `Elemenx.Network.Context(name)` возвращает его.
- Приложение объявляет контекст для своих компонентов: `this.$Network('API', definition)` в своём определении.
- `this.$Network('API')` возвращает фасад, каждый ресурс которого получает контекст; `Elemenx.Network.XHR(settings, 'API')` делает это для одного ресурса, а `resource.Context('API')` добавляет контекст созданному ранее ресурсу.
- Контекстом может быть и объект определения вместо имени — для однократного использования.

## Пример

Контекст, который считает запросы страницы и добавляет каждому заголовок:

```example
<Button Label="Two requests through the context" Variant="primary" (click)="Run" />
<p>{{Log}}</p>
<script>
({
	Log: '',

	$OnCreate: function () {
		var self = this;

		Elemenx.Network.Context('DocsCounted', {
			Configure: function (resource) {
				resource.Header('X-Docs', 'counted');
			},
			On: {
				'Transport.Success': function (event) {
					self.Log += event.Target.XHR().responseURL.replace(location.origin, '') + ' ' + event.Data.Status + '; ';
				}
			}
		});
	},

	Run: function () {
		var network = this.$Network('DocsCounted');

		this.Log = '';

		network.XHR({URL: '/api/hello'}).Execute();
		network.XHR({Method: 'POST', URL: '/api/echo', Data: 'text'}).Execute();
	}
})
</script>
```
