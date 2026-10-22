<!-- generated -->
# Permissions

Разрешения браузера. Query(name, callback) сообщает состояние: 'granted', 'denied', 'prompt' или 'unsupported'. Request(name, callback) спрашивает пользователя так, как запрашивается это разрешение (разрешение на уведомления, местоположение, поток камеры или микрофона, который сразу останавливается, чтение буфера обмена, постоянное хранилище), и сообщает полученное состояние. Watch(name, callback) сообщает о каждом изменении состояния и возвращает ID для Unwatch(id). Имена: notifications, geolocation, camera, microphone, clipboard-read, clipboard-write, persistent-storage. callback(error, state).

## Методы

- `Query(name, callback)`
- `Request(name, callback)`
- `Watch(name, callback)`
- `Unwatch(id)`

## Пример

```example
<table class="elemenx-table compact">
	<tr><th>Permission</th><th>State</th><th></th></tr>
	<tr *for="permission of List" *key="permission.Name"><td>{{permission.Name}}</td><td>{{permission.State}}</td><td><button type="button" class="elemenx-link" [attribute.data-name]="permission.Name" (click)="Ask">ask</button></td></tr>
</table>
<script>
({
	List: [{Name: 'notifications', State: '…'}, {Name: 'geolocation', State: '…'}, {Name: 'camera', State: '…'}, {Name: 'clipboard-read', State: '…'}],

	$OnReady: function () {
		var self = this;

		this.List.forEach(function (permission) {
			self.Query(permission.Name);
		});
	},

	Query: function (name) {
		var self = this;

		this.$Service('Permissions').Query(name, function (error, state) {
			self.Set(name, error ? 'error' : state);
		});
	},

	Set: function (name, state) {
		this.List = this.List.map(function (permission) {
			return permission.Name === name ? {Name: name, State: state} : permission;
		});
	},

	Ask: function (event, button) {
		var self = this;
		var name = button.getAttribute('data-name');

		this.$Service('Permissions').Request(name, function (error, state) {
			self.Set(name, error ? error.name : state);
		});
	}
})
</script>
```
