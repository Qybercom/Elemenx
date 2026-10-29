<!-- generated -->
# PipelineJob

Объявление задачи в шаблоне Pipeline внутри PipelineStage: <PipelineJob ID="unit" Name="Юнит-тесты" Status="success" Duration="84" Needs="build" />. Принимает свойства задачи Pipeline (ID, Name, Status, Duration, Started, Needs — ID через запятую, Group, Text, Href); разметка внутри становится содержимым её карточки и сохраняет привязки. Сам ничего не показывает: его читает Pipeline.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Name` | `''` |
| `Status` | `'created'` |
| `Duration` | `null` |
| `Started` | `null` |
| `Needs` | `''` |
| `Group` | `''` |
| `Text` | `''` |
| `Href` | `''` |

## Слоты

по умолчанию

## Тесты

- [shows the stages given and declared, their jobs, a matrix as one card, the status of each stage and of the whole](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L38) — `tests/regression/library-pipeline.test.js`
