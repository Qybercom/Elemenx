<!-- generated -->
# Calculator

Калькулятор: клавиши обычного или, с Mode="scientific", инженерного (sin, cos, tan и обратные им по Shift, ln, log, корни и степени, факториал, pi и e, скобки, градусы или радианы — Angle). Формулу читает сервис Calculations, без eval. Верхняя строка — что набрано, нижняя — её значение по мере набора; = сохраняет результат, History показывает десять последних, нажатие возвращает выражение. Клавиатура тоже работает: цифры, + - * / ^ % ( ), Enter или =, Backspace, Escape. Число с % — сотая доля, а 200 + 10% — 220, как считает калькулятор магазина. Precision — значащие цифры (12), Value — набранное, Label — имя для экранного диктора. События: result ({Expression, Value}) при каждом =, change (Value) при наборе.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Mode` | `'basic'` |
| `Value` | `''` |
| `History` | `true` |
| `Precision` | `12` |
| `Label` | `''` |
| `Shift` | `false` |

## События

- `change`
- `result`

## Пример

```example
<Calculator Mode="scientific" (result)="Counted" />
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Type on the keys or the keyboard, then =.',

	Counted: function (result) {
		this.Text = result.Expression + ' = ' + result.Value;
	}
})
</script>
```

## Тесты

- [reads formulas without eval: precedence, powers, conditions, functions, names, and tells a mistake by its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L41) — `tests/regression/library-calculators.test.js`
- [counts on its keys and on the keyboard, a percent as a shop does, and keeps its history](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L71) — `tests/regression/library-calculators.test.js`
- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
