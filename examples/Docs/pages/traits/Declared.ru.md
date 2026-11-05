<!-- generated -->
# Declared

Declared: компонент, который читает то, что объявлено внутри него (Pipeline — свои PipelineStage, Mosaic — MosaicItem, Quiz — QuizQuestion): дочерние компоненты, которые сами ничего не показывают, — скрытый элемент каждого со свойствами в data-item внутри элемента, который называет DeclaredSources. Он читает их, когда готов, и снова при каждом их изменении (MutationObserver источников: их элементов, их data-item и, с DeclaredText, их текстов) через Declarations(sources) компонента и передаёт изменившееся в его Declared(declared): по умолчанию список хранится в Own().Declared, а Version увеличивается, чтобы шаблон заново построил свою модель.

## Методы

- `Declarations(sources)`
- `Declared(declared)`

## Тесты

- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
