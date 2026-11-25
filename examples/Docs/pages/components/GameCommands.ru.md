<!-- generated -->
# GameCommands

Команды корабля, объявленные внутри сцены (трейт SceneBehaviour). Раз в Every секунд (0,25) компонент читает ShipCommands сцены для корабля For. Если For пуст, берётся герой, когда он корабль, иначе корабль, в котором герой сидит или ходит.

Показывает кнопки:
- «Сесть» — в выбранное место из маркеров тела или под кораблём;
- «Взлететь»;
- «На орбиту» — с подсказкой, если корабль ниже 2000 км над телом.

Нажатие отдаёт команду через ShipCommand сцены, событие command сообщает {ID, Done}. Done — false, если корабль сейчас этого не может. Пока у корабля нет команд, компонент скрыт.

Кладите его на экран пульта пилота (в GameConsole он уже есть у пилота, второго пилота и капитана) и в приборы поверх вида (GameFlight с Commands). Встроенные кнопки самой сцены тогда можно выключить: ShipButtons="false". Size — small, medium или large, Label — название для экранного диктора.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `For` | `''` |
| `Every` | `0.25` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Commands` | `[]` |
| `Hint` | `false` |

## События

- `command`

## Пример

```example
<p class="elemenx-caption">GameCommands reads the commands of the ship of the Scene it stands in: here, as if the ship were near a planet with two sites to land at (Show takes the commands as ShipCommands gives them).</p>
<GameCommands #commands />
<Button Label="Near a planet" (click)="Near" />
<script>
({
	Near: function () {
		this.$Ref('commands', true).Show([{ID: 'land', Markers: [{ID: 'hills', Name: 'Green Hills', Day: true}, {ID: 'base', Name: 'Sea Base', Day: false}]}, {ID: 'orbit', Hint: 'orbit'}]);
	}
})
</script>
```

## Тесты

- [gives the commands of a ship as data and on GameCommands, the buttons of the scene only with ShipButtons](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L1184) — `tests/regression/library-scene-landing.test.js`
- [preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L162) — `tests/regression/library-scene-landing.test.js`
