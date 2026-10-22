<!-- generated -->
# Permissions

The permissions of the browser. Query(name, callback) tells the state: 'granted', 'denied', 'prompt' or 'unsupported'. Request(name, callback) asks the user the way that permission is asked (a notification permission, a position, a camera or microphone stream that is stopped at once, a read of the clipboard, persistent storage) and tells the state that follows. Watch(name, callback) reports each change of the state and returns the ID for Unwatch(id). Names: notifications, geolocation, camera, microphone, clipboard-read, clipboard-write, persistent-storage. callback(error, state).

## Methods

- `Query(name, callback)`
- `Request(name, callback)`
- `Watch(name, callback)`
- `Unwatch(id)`

## Example

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
