<!-- generated -->
# CalculatorField

Объявление поля в шаблоне BusinessCalculator: <CalculatorField ID="Area" Label="Площадь" Value="50" Unit="м²" />. Принимает свойства поля BusinessCalculator (ID, Label, Type, Value, Min, Max, Step, Unit, Options, Hint). Сам ничего не показывает: его читает BusinessCalculator.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Type` | `'number'` |
| `Value` | `null` |
| `Min` | `null` |
| `Max` | `null` |
| `Step` | `null` |
| `Unit` | `''` |
| `Options` | `null` |
| `Hint` | `''` |

## Тесты

- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
