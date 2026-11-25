<!-- generated -->
# GameRadar

Радар транспорта, объявленный внутри сцены (трейт SceneBehaviour). Показывает, что транспорт знает вокруг себя (Contacts сцены, SceneTactics), в пределах Range метров, носом вверх.

- Shape `plan` — карта сверху (GameMinimap): метка на каждый контакт и кольца через треть дальности.
- Shape `bubble` — пространство вокруг, видимое сзади и сверху: диск колец на высоте транспорта, каждый контакт над или под ним на «ножке».

Противник (другая команда) отмечен красным, свой — зелёным, места (NavPoint) и глушилки варпа — точками; цель обведена. Ракеты (SceneMissiles) — маленькие треугольники, ракета в сам транспорт — красная, крупнее и мигает (incoming), ловушки — искры. Нажатие на метку делает её целью транспорта (SetTarget) и даёт событие `target` ({Vehicle, Target}).

For — транспорт (пусто — тот, где сидит или находится герой). Every — как часто читать (0,2 с). Size — ширина в пикселях, Zoomable добавляет кнопки + и − (дальность вдвое меньше или больше), Label — название для экранного диктора.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `For` | `''` |
| `Shape` | `'plan'` |
| `Range` | `150` |
| `Every` | `0.2` |
| `Size` | `180` |
| `Zoomable` | `false` |
| `Label` | `''` |
| `Vehicle` | `''` |
| `Contacts` | `[]` |

## События

- `target`

## Пример

```example
<p class="elemenx-caption">GameRadar reads what the vehicle of the hero knows of the Scene it stands in: here, as if it knew a foe ahead on its left, a friend behind and a station over it (Show takes the contacts as Contacts gives them).</p>
<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start">
	<GameRadar #plan Range="200" Zoomable="true" />
	<GameRadar #bubble Shape="bubble" Size="220" Range="200" />
</div>
<Button Label="Show the contacts" (click)="Fill" />
<script>
({
	Fill: function () {
		var contacts = [
			{ID: 'raider', Name: 'Raider', Kind: 'walker', Team: 'red', Hostile: true, Distance: 90, Bearing: -35, Elevation: -5, Target: true},
			{ID: 'mira', Name: 'Mira', Kind: 'walker', Team: 'blue', Hostile: false, Distance: 60, Bearing: 160, Elevation: 0, Target: false},
			{ID: 'station', Name: 'Station', Kind: 'place', Team: '', Hostile: false, Distance: 150, Bearing: 40, Elevation: 30, Target: false}
		];

		this.$Ref('plan', true).Show(contacts);
		this.$Ref('bubble', true).Show(contacts);
	}
})
</script>
```

## Тесты

- [GameArms shows what a ship has, its locks and the warning of a missile at it, and is hidden for a ship with none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L38) — `tests/regression/library-game-arms.test.js`
- [GameRadar marks missiles small, the one at the vehicle as incoming, flares as sparks](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L138) — `tests/regression/library-game-arms.test.js`
- [gives a seat the modes of its role and the command seat those of the roles no seat has; mans a turret, knows what is round, shares a target](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tactics.test.js#L47) — `tests/regression/library-tactics.test.js`
