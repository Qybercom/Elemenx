<!-- generated -->
# CalculatorField

The declaration of a field in the template of a BusinessCalculator: <CalculatorField ID="Area" Label="Area" Type="number" Value="50" Unit="m²" />. It takes the props of a field of BusinessCalculator (ID: the name its formulas read, Label, Type, Value, Min, Max, Step, Unit, Options, Hint). It shows nothing by itself.

## Properties

| Property | Default |
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

## Tests

- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
