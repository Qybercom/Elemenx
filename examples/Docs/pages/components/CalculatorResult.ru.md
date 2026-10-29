<!-- generated -->
# CalculatorResult

Объявление результата в шаблоне BusinessCalculator: <CalculatorResult ID="Total" Label="Итого" Formula="Area * Price" Format="money" Primary="true" />. Принимает свойства результата BusinessCalculator (ID, Label, Formula, Format, Precision, Unit, Primary, Hidden, Hint). Сам ничего не показывает: его читает BusinessCalculator.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Formula` | `''` |
| `Format` | `'number'` |
| `Precision` | `null` |
| `Unit` | `''` |
| `Primary` | `false` |
| `Hidden` | `false` |
| `Hint` | `''` |

## Тесты

- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
