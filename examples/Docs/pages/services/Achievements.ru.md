<!-- generated -->
# Achievements

Достижения приложения любого рода (игры, курса, профиля, экскурсии) как данные: какие они есть, насколько продвинулось каждое, какие получены. Сервис ничего не показывает (их показывают AchievementQueue и AchievementHost из ElemenxUI, а перечисляет AchievementList) и ничего не хранит: приложение сохраняет Export() где хочет и возвращает его в Import(data). Работает на странице, в воркере и в Node.

- Define(achievement или список): {ID, Title, Text, Icon, Image, Rarity (common, uncommon, rare, epic, legendary), Points, Group, Goal (сколько нужно для получения, 1), Hidden (не показывается в списке, пока не получено), Secret (показывается, но Title и Text скрыты, пока не получено)}. Повторное определение с тем же ID заменяет его, сохраняя состояние.
- Progress(id, amount) прибавляет к продвижению (по умолчанию 1), Set(id, value) задаёт его; при достижении Goal достижение получено. Unlock(id) выдаёт его сразу, Reset(id) (без ID — все) сбрасывает с нуля. Каждый возвращает состояние.
- State(id): {ID, Value, Goal, Part (от 0 до 1), Unlocked, At (время получения, мс)}; null для неизвестного ID. List({Group, Unlocked: true или false}): определения с состояниями в порядке определения; Hidden — только после получения, у Secret до получения пустые Title и Text (Secret: true). Groups() — группы, Points() — очки полученных, Count() — {Unlocked, Total}.
- On(event, callback) и Off(event, callback): progress ({ID, Value, Goal, Achievement}), unlock ({ID, Achievement, State}), reset ({ID}: пусто — все), change ({ID}) после любого из них.
- Export(): {Version, States: {id: {Value, At}}}; Import(data) возвращает такую запись (состояние неизвестного ID ждёт его определения) и сообщает change, без unlock.

## Методы

- `Define(given)`
- `Progress(id, amount)`
- `Set(id, value)`
- `Unlock(id)`
- `Reset(id)`
- `State(id)`
- `List(filter)`
- `Groups()`
- `Points()`
- `Count()`
- `On(event, callback)`
- `Off(event, callback)`
- `Export()`
- `Import(data)`

## Пример

```example
<Button Label="Take a step" Icon="add" Variant="primary" (click)="Step" />
<Button Label="Unlock the secret" Icon="trophy" Variant="ghost" (click)="Secret" />
<Button Label="Start again" Variant="ghost" (click)="Reset" />
<AchievementList />
<AchievementHost />
<script>
({
	$OnCreate: function () {
		var achievements = this.$Service('Achievements');
		if (achievements.State('docs-walker')) return;

		achievements.Define([
			{ID: 'docs-walker', Title: 'Walker', Text: 'Take five steps.', Goal: 5, Points: 10, Rarity: 'rare'},
			{ID: 'docs-secret', Title: 'The secret', Text: 'Found what was hidden.', Secret: true, Points: 50, Rarity: 'legendary'}
		]);
	},

	Step: function () {
		this.$Service('Achievements').Progress('docs-walker');
	},

	Secret: function () {
		this.$Service('Achievements').Unlock('docs-secret');
	},

	Reset: function () {
		this.$Service('Achievements').Reset();
	}
})
</script>
```

## Тесты

- [counts progress to the goal, unlocks once at it, and tells each step](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L51) — `tests/regression/achievements-common.test.js`
- [lists them with their states: a hidden one only once unlocked, a secret one kept back until then; groups, points and counts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L81) — `tests/regression/achievements-common.test.js`
- [exports its states for the Application to keep, imports them back without unlock events, and resets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L103) — `tests/regression/achievements-common.test.js`
- [shows in the AchievementQueue each achievement unlocked, unless told not to follow](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L135) — `tests/regression/achievements-common.test.js`
- [unlocks an achievement of the Achievements Service as one comes in, and has the action achievement by itself](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-triggers.test.js#L273) — `tests/regression/library-triggers.test.js`
