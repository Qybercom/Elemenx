<!-- generated -->
# Idle

Бездействие пользователя, как в банковском приложении, которое выходит из учётной записи через несколько минут. Start(options) начинает наблюдение: options {Timeout (миллисекунды без клавиш, нажатий, колеса и движений), Warning (за сколько миллисекунд до Timeout вызывается OnWarn), OnWarn(remaining), OnIdle(), OnActive()}. Учитывается и активность в другой вкладке того же сайта (localStorage, StorageKey). Reset() начинает отсчёт заново, Stop() завершает наблюдение, Remaining() — оставшееся время, State() — 'active', 'warning', 'idle' или 'stopped'. OnActive вызывается, когда пользователь возвращается после предупреждения или после бездействия.

## Методы

- `Start(options)`
- `Stop()`
- `Reset()`
- `State()`
- `Remaining()`

## Пример

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
