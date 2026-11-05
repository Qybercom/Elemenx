<!-- generated -->
# Declared

Declared: a Component that reads what is declared inside it (Pipeline its PipelineStage, Mosaic its MosaicItem, Quiz its QuizQuestion): child Components that show nothing themselves, a hidden element of each with its props in data-item, inside the element DeclaredSources names. It reads them once it is ready and again whenever they change (a MutationObserver of the sources: their elements, their data-item and, with DeclaredText, their texts), through the Declarations(sources) of the Component, and gives what changed to its Declared(declared): by default the list is kept in Own().Declared and Version is counted up, for the template to make its model again.

## Methods

- `Declarations(sources)`
- `Declared(declared)`

## Tests

- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
