<!-- generated -->
# *tip

*tip показывает над элементом подсказку темы, как всплывающие подсказки Microsoft Office: *tip="'Сохранить страницу'" или *tip="{Title, Text, Placement, Delay, Class, Element, Render, Disabled}". Title пишется полужирным, Text — под ним; Element (узел DOM) или Render(container) дают подсказке любое содержимое. Placement: bottom (по умолчанию), top, left или right, другая сторона, если места нет; Delay — время до появления под указателем (500 мс; фокус с клавиатуры показывает её сразу). Уход указателя, нажатие, Escape или прокрутка прячут её. Одновременно видна одна подсказка — отдельный элемент в body (role tooltip, aria-describedby элемента).

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<button class="elemenx-button" *tip="'Save the page'">Plain</button>
	<button class="elemenx-button" *tip="{Title: 'Number input', Text: 'A number typed or stepped by its arrows, within Min and Max.'}">Rich</button>
	<button class="elemenx-button" *tip="{Title: 'Above', Text: 'Placement top, shown at once.', Placement: 'top', Delay: 0}">Top</button>
</div>
```

## Тесты

- [shows a *tip in the document of its element, not in the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/other-document.test.js#L62) — `tests/regression/other-document.test.js`
- [shows a bold title over its text after the delay, beside the element, and hides when the pointer leaves](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L33) — `tests/regression/tip.test.js`
- [takes a plain text, renders content of its own, and shows nothing when Disabled](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L66) — `tests/regression/tip.test.js`
- [hides when the pointer moves off an element that never heard it leave, and shows nothing for a hidden element](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L103) — `tests/regression/tip.test.js`
- [completes the tags, props, bindings, events, directives and options of a template, and the fields of its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L63) — `tests/regression/language-server.test.js`
- [tells of a Component, a prop, a directive and a Service on hover, and finds their definitions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L95) — `tests/regression/language-server.test.js`
- [goes from a directive to its definition (the core ones in elemenx.js), and from a prop or an event to its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L176) — `tests/regression/language-server.test.js`
- [goes to the sources the extension carries in a project that has only builds of dist, and reads no bundle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L190) — `tests/regression/language-server.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
