<!-- generated -->
# GameFlight

Приборы корабля над сценой, объявленные внутри неё (трейт SceneBehaviour). Что Readout сцены читает у For (ID; пусто — герой), раз в Every секунд (0,15):

- скорость, высота и воздух вокруг (Probe сцены);
- путь (варп, прыжок: фаза и шаг) и газ;
- системы (SceneShipSystems): реакторы (нагрев, сколько дают, выключен ли перегревом), сколько энергии получает каждая система, слои щита, блокировщик варпа в зоне датчиков;
- известные места, ближние первыми (показывается Nav штук).

Engineer добавляет руки бортинженера (или пилота, если он один): доли энергии, включение и выключение реакторов, сброс тепла. Size — small, medium или large, Label — название для экранного диктора. В слот по умолчанию можно положить свои кнопки.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `For` | `''` |
| `Every` | `0.15` |
| `Nav` | `5` |
| `Engineer` | `false` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Слоты

по умолчанию

## Пример

```example
<p class="elemenx-caption">GameFlight reads the Readout of the Scene it stands in: here, what it shows of a ship (Show takes a readout as Readout gives it).</p>
<GameFlight #flight Engineer="true" />
<Button Label="A ship in warp, a layer hit" (click)="Ship" />
<script>
({
	Ship: function () {
		this.$Ref('flight', true).Show({Kind: 'ship', Speed: 3600 * 12.5, Throttle: 0.8, Travel: {Kind: 'warp', Phase: 'inside', Step: 4}, Environment: null, Systems: {
			Reactors: [{ID: 'main', Output: 80, Supply: 80, Heat: 0.62, On: true, Tripped: false}, {ID: 'aux', Output: 20, Supply: 0, Heat: 1.1, On: true, Tripped: true}],
			Power: {Engines: 0.7, Shields: 1, Weapons: 0.4},
			Shares: {Engines: 2, Shields: 1, Weapons: 1},
			Shields: [{ID: 'outer', Part: 0.2}, {ID: 'inner', Part: 1}],
			Jam: {ID: 'interdictor', Distance: 42, Inside: false},
			Nav: [{ID: 'halcyon', Name: 'Halcyon', Kind: 'station', Distance: 1200, Bearing: 12}, {ID: 'luna', Name: 'Luna', Kind: 'moon', Distance: 384400, Bearing: -40}]
		}});
	}
})
</script>
```

## Тесты

- [shows the systems of a ship and gives an engineer the hands of its power](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-dash.test.js#L134) — `tests/regression/library-game-dash.test.js`
