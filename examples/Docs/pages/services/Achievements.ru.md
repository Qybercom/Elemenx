<!-- generated -->
# Achievements

Достижения приложения (игры, курса, профиля...), которые по очереди показывает AchievementHost (поставьте его в раскладку приложения, как ToastHost). Show(options) ставит достижение в очередь и возвращает его ID. Параметры: Title, Text, Icon или Image (по умолчанию кубок), Rarity (от common до legendary: цвет значка), Points, Overline (строка над заголовком: по умолчанию «Достижение получено»), Duration (6000 миллисекунд — время показа вместе с появлением и уходом; 0 оставляет его до закрытия). Dismiss(id) закрывает достижение (или убирает его из очереди), Clear() закрывает все; Current() — показанное, Queue() — ожидающие. OnChange(callback)/OffChange(callback) сообщают {Current, Queue}.

## Методы

- `Show(options)`
- `Dismiss(id)`
- `Clear()`
- `Current()`
- `Queue()`
- `OnChange(callback)`
- `OffChange(callback)`

## Пример

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
