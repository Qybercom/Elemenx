<!-- generated -->
# PipelineStage

The declaration of a stage in the template of a Pipeline: <PipelineStage ID="test" Name="Test"> with its PipelineJob inside. It takes the props of a stage of Pipeline (ID, Name, Status: by default the one of its jobs). It shows nothing by itself: Pipeline reads it.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Name` | `''` |
| `Status` | `''` |

## Slots

default

## Tests

- [shows the stages given and declared, their jobs, a matrix as one card, the status of each stage and of the whole](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pipeline.test.js#L38) — `tests/regression/library-pipeline.test.js`
