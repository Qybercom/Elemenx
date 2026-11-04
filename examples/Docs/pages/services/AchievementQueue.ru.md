<!-- generated -->
# AchievementQueue

Достижения, которые по очереди показывает AchievementHost (поставьте его в раскладку приложения, как ToastHost). Каждое достижение, полученное в сервисе Achievements из ElemenxCommon, попадает сюда само (Follow: false отключает это); любое другое можно показать через Show. Show(options) ставит достижение в очередь и возвращает его ID. Параметры: Title, Text, Icon или Image (по умолчанию кубок), Rarity (от common до legendary: цвет значка), Points, Overline (строка над заголовком: по умолчанию «Достижение получено»), Duration (6000 миллисекунд — время показа вместе с появлением и уходом; 0 оставляет его до закрытия). Dismiss(id) закрывает достижение (или убирает его из очереди), Clear() закрывает все; Current() — показанное, Queue() — ожидающие. OnChange(callback)/OffChange(callback) сообщают {Current, Queue}.

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

		this.$Service('AchievementQueue').OnChange(this.Changed);
	},

	$OnDestroy: function () {
		this.$Service('AchievementQueue').OffChange(this.Changed);
	},

	Unlock: function () {
		this.Count++;

		this.$Service('AchievementQueue').Show({Title: 'Explorer ' + this.Count, Text: 'Three in a row queue up.', Rarity: this.Count % 2 ? 'epic' : 'rare', Points: 25, Duration: 3000});
	},

	Clear: function () {
		this.$Service('AchievementQueue').Clear();
	}
})
</script>
```

## Тесты

- [counts progress to the goal, unlocks once at it, and tells each step](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L51) — `tests/regression/achievements-common.test.js`
- [lists them with their states: a hidden one only once unlocked, a secret one kept back until then; groups, points and counts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L81) — `tests/regression/achievements-common.test.js`
- [exports its states for the Application to keep, imports them back without unlock events, and resets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L103) — `tests/regression/achievements-common.test.js`
- [shows in the AchievementQueue each achievement unlocked, unless told not to follow](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L135) — `tests/regression/achievements-common.test.js`
- [shows the achievements one after another, each for its Duration, and reports every change](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements.test.js#L60) — `tests/regression/achievements.test.js`
- [keeps an achievement of Duration 0 until it is dismissed, takes one out of the queue, and clears all](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements.test.js#L94) — `tests/regression/achievements.test.js`
