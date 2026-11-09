<!-- generated -->
# *tip

*tip показывает над элементом подсказку темы, как всплывающие подсказки Microsoft Office: *tip="'Сохранить страницу'" или *tip="{Title, Text, Placement, Delay, Class, Element, Render, Component, Props, Bare, Touch, Stay, Disabled}". Title пишется полужирным, Text — под ним; Element (узел DOM), Render(container) или Component (имя компонента, создаваемого с Props, пока подсказка видна: карточка предмета, человека) дают подсказке любое содержимое. У компонента свой вид, поэтому его подсказка голая — без собственной рамки (Bare: false её оставляет, Bare: true делает голой любую). Placement: bottom (по умолчанию), top, left или right, другая сторона, если места нет; Delay — время до появления под указателем (500 мс; фокус с клавиатуры показывает её сразу). Уход указателя, нажатие (кроме Stay — карточка предмета, по которому нажали, чтобы выбрать его) или Escape прячут её; пока она видна, она держится рядом с элементом, когда страница прокручивается или сдвигает элемент без прокрутки. Touch: касание тоже показывает её, а прокрутка или касание в другом месте прячут, как подсказки телефона. Одновременно видна одна подсказка — отдельный элемент (role tooltip, aria-describedby элемента) в верхнем слое, так что её не обрезают прокручиваемые области, transform и filter вокруг; она кладётся в ту часть страницы, у которой тема элемента (ближайший data-theme или data-scheme, иначе body), и берёт эту тему.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<button class="elemenx-button" *tip="'Save the page'">Plain</button>
	<button class="elemenx-button" *tip="{Title: 'Number input', Text: 'A number typed or stepped by its arrows, within Min and Max.'}">Rich</button>
	<button class="elemenx-button" *tip="{Title: 'Above', Text: 'Placement top, shown at once.', Placement: 'top', Delay: 0}">Top</button>
	<button class="elemenx-button" *tip="{Element: Card(), Placement: 'right', Delay: 0, Touch: true, Bare: true}">Card, a tap too</button>
</div>
<div data-theme="darcula" data-scheme="dark" style="margin-top: 8px; padding: 8px; display: inline-block;">
	<button class="elemenx-button" *tip="{Title: 'In its own theme', Text: 'The tip takes the theme of this part of the page.'}">Darcula part</button>
</div>
<script>
({
	Card: function () {
		var card = document.createElement('div');

		card.className = 'elemenx-card';
		card.style.padding = '12px';
		card.textContent = 'Content of its own, with its own look: the tip is bare.';

		return card;
	}
})
</script>
```

## Тесты

- [the card of a GameSlot and of a GameInventory shows by *tip and follows its element when the page moves it without a scroll](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L242) — `tests/regression/library-misc.test.js`
- [shows a *tip in the document of its element, not in the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/other-document.test.js#L62) — `tests/regression/other-document.test.js`
- [shows a bold title over its text after the delay, beside the element, and hides when the pointer leaves](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L33) — `tests/regression/tip.test.js`
- [takes a plain text, renders content of its own, and shows nothing when Disabled](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L66) — `tests/regression/tip.test.js`
- [hides when the pointer moves off an element that never heard it leave, and shows nothing for a hidden element](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L103) — `tests/regression/tip.test.js`
- [shows in the top layer, over a panel opened before it, and not for an element a panel covers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L135) — `tests/regression/tip.test.js`
- [shows a Component made with its Props in a bare tip, made again when they change, and destroyed when it hides](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L172) — `tests/regression/tip.test.js`
- [takes the theme of the part of the page its element is in, and keeps beside it when the page moves it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L217) — `tests/regression/tip.test.js`
- [with Touch shows on a tap and hides on a scroll or a tap elsewhere; one the mouse opened follows a scroll](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L249) — `tests/regression/tip.test.js`
- [hides on a press, but not with Stay (the card of an item pressed to choose it)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L285) — `tests/regression/tip.test.js`
- [completes the tags, props, bindings, events, directives and options of a template, and the fields of its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L74) — `tests/regression/language-server.test.js`
- [tells of a Component, a prop, a directive and a Service on hover, and finds their definitions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L106) — `tests/regression/language-server.test.js`

+6 ещё в тех же файлах
