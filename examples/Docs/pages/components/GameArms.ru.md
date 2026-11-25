<!-- generated -->
# GameArms

Вооружение корабля против кораблей, объявленное внутри сцены (трейт SceneBehaviour). Раз в Every секунд (0,2) компонент читает ArmsOf сцены (SceneMissiles) для корабля For. Если For пуст, берётся герой, когда он корабль, иначе корабль, в котором герой сидит или ходит.

Показывает:
- ракеты — сколько осталось из магазина, сколько в полёте, или «перезарядка»;
- захваты — сколько целей захвачено и сколько ещё захватывается;
- тяжёлые ракеты (Hunters) — сколько осталось, в полёте, кнопка «Тяжёлые» (клавиша Y, событие hunter);
- торпеды и масс-драйвер — сколько осталось из магазина, в полёте, перезарядка;
- ланс — заряжается (сколько процентов), бьёт, остывает (сколько секунд) или готов;
- сверхсветовой рельсотрон — сколько снарядов, зарядка, переключатель «прямо в цель»;
- ловушки — сколько осталось;
- переключатель ПРО (point defence);
- предупреждение: «Ракета ×N · через сколько секунд», пока ракеты летят в корабль, или «Вас захватили», когда его держит в захвате чужой.

Кнопки:
- «Пуск» — залп по захваченным целям (Launch сцены, клавиша M); событие launch — {Count};
- «Торпеда» — торпеда по захваченной цели (Launch с Kind torpedo, клавиша K); событие torpedo — {Count};
- «Огонь» — масс-драйвер по цели корабля с упреждением (Driver сцены, клавиша U); событие drive — {Done};
- «Ланс» — ланс по цели корабля (Lance сцены, клавиша I); событие lance — {Done};
- «Рельсотрон» — по цели корабля через варп-туннель (Railgun сцены, клавиша O): туда, где цель будет, или прямо в неё; событие railgun — {Done, Mode};
- «Ловушки» — отстрел ловушек (Flares сцены, клавиша N); событие flares — {Count};
- переключатель — ПРО вкл/выкл (Defence сцены).

Пока у корабля нет ни ракет, ни ловушек, ни ПРО, компонент скрыт. Кладите его на экран пульта стрелка (в GameConsole он есть у стрелка, тактического офицера, пилота и капитана) и в приборы поверх вида (GameFlight с Arms). Size — small, medium или large, Label — название для экранного диктора.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `For` | `''` |
| `Every` | `0.2` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Arms` | `null` |

## События

- `hunter`
- `torpedo`
- `drive`
- `lance`
- `railgun`
- `launch`
- `flares`

## Пример

```example
<p class="elemenx-caption">GameArms reads the arms of the ship of the Scene it stands in: here, as if the ship had locked a raider while two missiles came at it (Show takes them as ArmsOf gives them).</p>
<GameArms #arms />
<Button Label="In a fight" (click)="Fight" />
<script>
({
	Fight: function () {
		this.$Ref('arms', true).Show({Missiles: 'ship-missile', Left: 6, Magazine: 8, Reloading: false, Locks: [{ID: 'raider', Progress: 1, Locked: true}], Locked: ['raider'], Flares: {Left: 20, Count: 24}, Defence: {Weapon: 'ship-pd', On: true}, Incoming: 2, Soonest: 3.4, LockedBy: ['raider'], Flying: 2});
	}
})
</script>
```

## Тесты

- [GameArms shows what a ship has, its locks and the warning of a missile at it, and is hidden for a ship with none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L38) — `tests/regression/library-game-arms.test.js`
- [GameRadar marks missiles small, the one at the vehicle as incoming, flares as sparks](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L138) — `tests/regression/library-game-arms.test.js`
