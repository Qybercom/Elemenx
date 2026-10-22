<!-- generated -->
# Achievements

The achievements of an Application (a game, a course, a profile...), shown one after another by an AchievementHost (place one in the layout of the Application, as a ToastHost). Show(options) queues one and returns its ID. Options: Title, Text, Icon or Image (a trophy by default), Rarity (common... legendary: the color of the badge), Points, Overline (the line above the title: "Achievement unlocked" by default), Duration (6000 milliseconds, the time it shows, its coming and going included; 0 keeps it until it is dismissed). Dismiss(id) closes it (or takes it out of the queue), Clear() closes all; Current() is the one shown, Queue() the ones waiting. OnChange(callback)/OffChange(callback) report {Current, Queue}.

## Methods

- `Show(options)`
- `Dismiss(id)`
- `Clear()`
- `Current()`
- `Queue()`
- `OnChange(callback)`
- `OffChange(callback)`

## Example

```example
<Button Label="Unlock" Icon="trophy" Variant="primary" (click)="Unlock" />
<Button Label="Dismiss all" Variant="ghost" (click)="Clear" />
<span class="elemenx-text small muted">Shown: {{Current}} · waiting: {{Waiting}}</span>
<AchievementHost />
<script>
({
	Current: '—',
	Waiting: 0,
	Count: 0,

	$OnCreate: function () {
		var self = this;

		this.Changed = function (state) {
			self.Current = state.Current ? state.Current.Title : '—';
			self.Waiting = state.Queue.length;
		};

		this.$Service('Achievements').OnChange(this.Changed);
	},

	$OnDestroy: function () {
		this.$Service('Achievements').OffChange(this.Changed);
	},

	Unlock: function () {
		this.Count++;

		this.$Service('Achievements').Show({Title: 'Explorer ' + this.Count, Text: 'Three in a row queue up.', Rarity: this.Count % 2 ? 'epic' : 'rare', Points: 25, Duration: 3000});
	},

	Clear: function () {
		this.$Service('Achievements').Clear();
	}
})
</script>
```
