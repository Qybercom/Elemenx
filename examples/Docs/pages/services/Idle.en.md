<!-- generated -->
# Idle

The inactivity of the user, as a banking application that signs out after some minutes. Start(options) watches: options {Timeout (milliseconds without a key, a press, a wheel or a move), Warning (milliseconds before Timeout when OnWarn is called), OnWarn(remaining), OnIdle(), OnActive()}. Activity in another tab of the same site counts too (localStorage, StorageKey). Reset() counts from now, Stop() ends the watch, Remaining() is the time left, State() is 'active', 'warning', 'idle' or 'stopped'. OnActive is called when the user comes back after a warning or after going idle.

## Methods

- `Start(options)`
- `Stop()`
- `Reset()`
- `State()`
- `Remaining()`

## Example

```example
<Button Label="Watch for 10 seconds" Variant="primary" (click)="Start" />
<Button Label="Stop" Variant="ghost" (click)="Stop" />
<p class="elemenx-text">{{State}} · {{Note}}</p>
<script>
({
	State: 'stopped',
	Note: 'Start, then leave the mouse and the keys alone.',

	Start: function () {
		var self = this;
		var idle = this.$Service('Idle');

		idle.Start({
			Timeout: 10000,
			Warning: 5000,
			OnWarn: function (remaining) {
				self.State = idle.State();
				self.Note = 'Idle in ' + Math.round(remaining / 1000) + ' s';
			},
			OnIdle: function () {
				self.State = idle.State();
				self.Note = 'You were away; a bank would sign you out now.';
			},
			OnActive: function () {
				self.State = idle.State();
				self.Note = 'Welcome back';
			}
		});

		this.State = idle.State();
	},

	Stop: function () {
		this.$Service('Idle').Stop();
		this.State = 'stopped';
	},

	$OnDestroy: function () {
		this.$Service('Idle').Stop();
	}
})
</script>
```

## Tests

- [Idle: warns before the timeout, goes idle, and comes back active at the next activity](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L185) — `tests/regression/library-services.test.js`
