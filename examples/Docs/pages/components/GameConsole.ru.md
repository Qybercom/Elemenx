<!-- generated -->
# GameConsole

Экран пульта корабля, объявленный внутри сцены (трейт SceneBehaviour). Положите его в слот screens сцены как data-screen с именем `console:<место>`, `console:<роль>` или `console`: он покажется на экранах пультов стоящего корабля (SceneAboard), и на нём можно нажимать мышью или пальцем.

Раз в Every секунд (0,25) он читает, где герой (Context сцены):

- корабль For (ID; пусто — тот, в котором герой сидит или находится);
- роль пульта Role: pilot, copilot, captain, engineer, tactical, gunner, sensors, commander (пусто — роль места, где сидит герой).

Показывает роль и корабль, его приборы (GameFlight: у пульта бортинженера — его руки, у пульта датчиков — больше известных мест), с Radar — радар корабля рядом с ними (GameRadar: карта на RadarRange метров шириной RadarSize пикселей) и, пока герой сидит за пультом, режимы его места (GameTactics) и кнопку «Встать» (Leave сцены). Size — small, medium или large, Label — название для экранного диктора. В слот по умолчанию можно положить свои кнопки.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `For` | `''` |
| `Role` | `''` |
| `Every` | `0.25` |
| `Radar` | `false` |
| `RadarRange` | `200` |
| `RadarSize` | `150` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Name` | `''` |

## Слоты

по умолчанию

## Пример

```example
<p class="elemenx-caption">GameConsole reads where the hero is of the Scene it stands in: here, as if the hero sat at the console of an engineer (Show takes a context as Context gives it).</p>
<GameConsole #console Role="engineer" />
<Button Label="Sit at the console" (click)="Sit" />
<script>
({
	Sit: function () {
		this.$Ref('console', true).Show({Kind: 'seat', Vehicle: 'tempest', Seat: 'engineer', Role: 'engineer', Controls: false});
	}
})
</script>
```

## Тесты

- [sits at a console: the view on its screen, the screens of the page on the consoles, a finger on one pressing it, a drag looking round within reach](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-aboard.test.js#L444) — `tests/regression/library-aboard.test.js`
