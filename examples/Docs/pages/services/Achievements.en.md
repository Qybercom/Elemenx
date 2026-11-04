<!-- generated -->
# Achievements

Achievements: the achievements of an Application of any kind (a game, a course, a profile, a tour), as data: what they are, how far each has come, which are unlocked. It shows nothing (AchievementQueue and AchievementHost of ElemenxUI show them, AchievementList lists them) and keeps nothing: the Application stores Export() where it likes and gives it back to Import(data). It runs in a page, a worker and Node.

- Define(achievement or list): {ID, Title, Text, Icon, Image, Rarity (common, uncommon, rare, epic, legendary), Points, Group, Goal (how much unlocks it, 1), Hidden (not listed until it is unlocked), Secret (listed, its Title and Text kept back until it is unlocked)}. Again under its ID it is replaced, its state kept.
- Progress(id, amount) adds to how far it has come (1 by default), Set(id, value) sets it; at its Goal it unlocks. Unlock(id) unlocks it at once, Reset(id) (all without one) locks it again from nothing. Each returns its state.
- State(id): {ID, Value, Goal, Part (0 to 1), Unlocked, At (the time it was unlocked, milliseconds)}; null for an ID never defined. List({Group, Unlocked: true or false}): the definitions with their states, in the order they were defined, a Hidden one only once unlocked, a Secret one with its Title and Text empty (Secret: true) until then. Groups() its groups; Points() the points of what is unlocked; Count() {Unlocked, Total} (Hidden ones counted).
- On(event, callback) and Off(event, callback): progress ({ID, Value, Goal, Achievement}), unlock ({ID, Achievement, State}: the achievement and its state), reset ({ID}: empty, all of them), change ({ID}) after any of them.
- Export(): {Version, States: {id: {Value, At}}}; Import(data) takes such a record back (an unknown ID is kept for when it is defined) and tells change, no unlock.

## Methods

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

## Example

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

## Tests

- [counts progress to the goal, unlocks once at it, and tells each step](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L51) — `tests/regression/achievements-common.test.js`
- [lists them with their states: a hidden one only once unlocked, a secret one kept back until then; groups, points and counts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L81) — `tests/regression/achievements-common.test.js`
- [exports its states for the Application to keep, imports them back without unlock events, and resets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L103) — `tests/regression/achievements-common.test.js`
- [shows in the AchievementQueue each achievement unlocked, unless told not to follow](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/achievements-common.test.js#L135) — `tests/regression/achievements-common.test.js`
- [unlocks an achievement of the Achievements Service as one comes in, and has the action achievement by itself](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-triggers.test.js#L273) — `tests/regression/library-triggers.test.js`
