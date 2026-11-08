<!-- generated -->
# SceneKinds

Виды объектов игры по трём осям: что вид расширяет (Extends, одна основа), что умеет (Traits: {Имя: параметры}, данные системы сцены: Orbit, Surface, Model, Mover…) и из чего состоит (Parts: [{ID, Kind, Position, Rotation, Traits…}], каждая часть — свой объект, размещённый в родителе). Слои сливаются по тем же правилам, что слои компонентов фреймворка: позже — сильнее, черты — по имени и полям, части — по ID. Define(name, kind), Get(name), Has(name), Names(), Resolve(name) — вид целиком ({Name, Chain, Traits, Parts, Values}), Make(kind, props) — объект вида с частями (их ID — родитель/часть), Field(object, name) и Fields(kind) — поле в любом регистре или имя черты и поля вместе, Diff(object) — то, что хранит сохранённая игра (вид и отличия от него), Restore(saved). Работает и в Node.

## Методы

- `Define(name, kind)`
- `Get(name)`
- `Has(name)`
- `Names()`
- `Resolve(name, chain)`
- `Make(kind, props)`
- `Fields(kind)`
- `Field(object, name)`
- `Diff(object)`
- `Restore(saved)`

## Пример

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var kinds = this.$Service('SceneKinds');
		var tank;

		kinds.Define('vehicle', {Traits: {Mover: {Speed: 2}, Health: {Max: 100}}, Values: {Team: 'neutral'}});
		kinds.Define('turret', {Traits: {Model: {Shape: 'cylinder'}, Health: {Max: 40}}});
		kinds.Define('tank', {Extends: 'vehicle', Traits: {Health: {Max: 400}}, Parts: [{ID: 'hull', Traits: {Model: {Shape: 'box'}}}, {ID: 'turret', Kind: 'turret', Position: [0, 0.6, 0]}]});

		tank = kinds.Make('tank', {ID: 'tank-1', Team: 'red', Parts: [{ID: 'turret', Traits: {Health: {Max: 60}}}]});
		tank.Parts.splice(0, 1);

		this.Text = 'Resolve(tank): ' + JSON.stringify(kinds.Resolve('tank').Traits) + '\n\nParts: ' + tank.Parts.map(function (part) {
			return part.ID + ' (' + part.Kind + ')';
		}).join(', ') + '\n\nDiff (a saved game): ' + JSON.stringify(kinds.Diff(tank));
	}
})
</script>
```

## Тесты

- [puts planets on their orbits and makes shapes of three dimensions with the Services of the system Libraries](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [makes the provider only as a name of it is wanted, in the Application that wants it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-provides.test.js#L47) — `tests/regression/library-provides.test.js`
- [makes the providers for a list, and none for a name no one declares](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-provides.test.js#L62) — `tests/regression/library-provides.test.js`
- [sows in clumps: thick groves and thin ground between them; grass in tufts and glades, its blades unlike by its spread](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L8790) — `tests/regression/library-scene.test.js`
- [gives the kinds of the scene their health, shows it on the card, and lets the weapons aim only at what lives](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L98) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
