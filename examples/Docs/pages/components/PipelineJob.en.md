<!-- generated -->
# PipelineJob

The declaration of a job in the template of a Pipeline, inside a PipelineStage: <PipelineJob ID="unit" Name="Unit tests" Status="success" Duration="84" Needs="build" />. It takes the props of a job of Pipeline (ID, Name, Status, Duration, Started, Needs: IDs separated by commas, Group, Text, Href); markup inside it becomes the content of its card and keeps its bindings. It shows nothing by itself: Pipeline reads it.

## Properties

| Property | Default |
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

## Slots

default

## Tests

- [shows the stages given and declared, their jobs, a matrix as one card, the status of each stage and of the whole](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L38) — `tests/regression/library-pipeline.test.js`
