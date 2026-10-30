<!-- generated -->
# Variant

A variant of an Experiment: its content shows only when the Experiment chose it for the visitor. <Variant ID="ads" Source="google" Campaign="spring">. ID names it; its rule: Source, Medium, Campaign, Term, Content (the UTM tags), Language, Device, Referrer (texts, several separated by commas), Params (name=value&other=value, a name alone when it is only given), Returning (true or false). A variant without a rule takes part in the split by its Weight (1); Default shows when no other one does.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Weight` | `null` |
| `Default` | `false` |
| `Source` | `''` |
| `Medium` | `''` |
| `Campaign` | `''` |
| `Term` | `''` |
| `Content` | `''` |
| `Language` | `''` |
| `Device` | `''` |
| `Referrer` | `''` |
| `Params` | `''` |
| `Returning` | `null` |

## Slots

default

## Tests

- [tells who came, from where, in which language and on what, and matches its rules](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L39) — `tests/regression/library-landing.test.js`
- [chooses a forced variant, then a rule, then the one kept, then a split by weight, else the default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L65) — `tests/regression/library-landing.test.js`
- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
- [keeps the variant of a split for the visitor, and a link forces another one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L141) — `tests/regression/library-landing.test.js`
- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
- [every Component of ElemenxUI declares $Meta with its group, its icon and a description of each prop](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-meta.test.js#L158) — `tests/regression/cli-meta.test.js`
- [normalizes the $Meta of a Component: props with their types, defaults, options and descriptions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/meta-contracts.test.js#L13) — `tests/regression/meta-contracts.test.js`
