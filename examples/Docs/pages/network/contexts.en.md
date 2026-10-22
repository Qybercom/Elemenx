# Network contexts

A context is what several resources share: a Protocol, listeners (headers of authorization, logging, error reports), and any setting a function gives them. It is declared once and named when a resource is made.

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

## A definition

| Member | Meaning |
| --- | --- |
| `Contexts` | a name or a list of the contexts this one builds on: they apply first |
| `Configure(resource, type)` | called with every resource and its type (`'XHR'`, `'WebSocket'`...) before anything else; returning `false` leaves the context out for that resource |
| `Protocol` | the Protocol every resource takes |
| `On` | `{eventName: listener}`: listeners added to every resource |
| `BeforeRequest(event)` | a listener of `Transport.BeforeRequest` (requests: headers, signatures) |
| `BeforeConnect(event)` | a listener of `Transport.BeforeConnect` (connections) |

A context that names itself through its `Contexts` (directly or through others) is applied once: the cycle stops there.

## Using a context

- `Elemenx.Network.Context(name, definition)` declares it; `Elemenx.Network.Context(name)` returns it.
- An Application declares one for its components: `this.$Network('API', definition)` in its definition.
- `this.$Network('API')` returns a facade whose every resource takes the context; `Elemenx.Network.XHR(settings, 'API')` does it for one resource, and `resource.Context('API')` adds a context to a resource made before.
- A context may also be a definition object instead of a name, for a single use.

## Example

A context that counts the requests of the page and adds a header to each one:

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
