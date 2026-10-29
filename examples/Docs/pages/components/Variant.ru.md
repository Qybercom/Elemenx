<!-- generated -->
# Variant

Вариант Experiment: его содержимое показывается, только когда эксперимент выбрал его для посетителя. <Variant ID="ads" Source="google" Campaign="spring">. Правило: Source, Medium, Campaign, Term, Content (метки UTM), Language, Device (phone, tablet, desktop), Referrer (часть хоста) — несколько значений через запятую; Params (name=value&other — параметр только задан); Returning (true — вернувшийся, false — первый визит). Вариант без правила участвует в сплите со своим Weight (1); Default показывается, когда не подошёл ни один.

## Свойства

| Свойство | По умолчанию |
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

## Слоты

по умолчанию

## Тесты

- [tells who came, from where, in which language and on what, and matches its rules](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L39) — `tests/regression/library-landing.test.js`
- [chooses a forced variant, then a rule, then the one kept, then a split by weight, else the default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L65) — `tests/regression/library-landing.test.js`
- [shows the Variant chosen, tells its view once and the conversion of an action with a Goal inside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L94) — `tests/regression/library-landing.test.js`
- [keeps the variant of a split for the visitor, and a link forces another one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L141) — `tests/regression/library-landing.test.js`
- [draws the blocks of a landing: a hero with its actions, features, numbers counted up, quotes and questions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-landing.test.js#L167) — `tests/regression/library-landing.test.js`
- [every Component of ElemenxUI declares $Meta with its group, its icon and a description of each prop](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-meta.test.js#L128) — `tests/regression/cli-meta.test.js`
- [normalizes the $Meta of a Component: props with their types, defaults, options and descriptions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/meta-contracts.test.js#L13) — `tests/regression/meta-contracts.test.js`
