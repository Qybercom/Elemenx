<!-- generated -->
# GameTactics

Режимы места, где сидит герой, объявленные внутри сцены (трейт SceneBehaviour). На каждый режим из Tactics сцены (SceneTactics: пульт, штурвал, турель, радар, схема, командование) — кнопка, текущий режим отмечен. Нажатие переключает режим (Tactic сцены). Пока герой нигде не сидит или у его места нет режимов, кроме самого пульта, компонент пуст.

Он читает режимы раз в Every секунд (0,25). Size — small, medium или large, Label — название для экранного диктора.

Кладите его на экран пульта (в GameConsole он уже есть) и поверх вида, например в слот hud сцены: так из любого режима можно вернуться обратно.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Every` | `0.25` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Пример

```example
<p class="elemenx-caption">GameTactics reads the modes of the seat the hero sits in of the Scene it stands in: here, as if the hero sat at the seat of command of a ship with no gunner and no sensors (Show takes the modes as Tactics gives them, and the one it is in).</p>
<GameTactics #tactics />
<Button Label="Sit at the helm" (click)="Sit" />
<script>
({
	Sit: function () {
		this.$Ref('tactics', true).Show(['', 'helm', 'turret', 'radar'], 'radar');
	}
})
</script>
```

## Тесты

- [gives a seat the modes of its role and the command seat those of the roles no seat has; mans a turret, knows what is round, shares a target](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tactics.test.js#L47) — `tests/regression/library-tactics.test.js`
