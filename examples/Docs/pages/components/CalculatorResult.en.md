<!-- generated -->
# CalculatorResult

The declaration of a result in the template of a BusinessCalculator: <CalculatorResult ID="Total" Label="Total" Formula="Area * Price" Format="money" Primary="true" />. It takes the props of a result of BusinessCalculator (ID: the name other formulas read, Label, Formula, Format, Precision, Unit, Primary, Hidden, Hint). It shows nothing by itself.

## Properties

| Property | Default |
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

## Tests

- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
