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
