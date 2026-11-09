<!-- generated -->
# *tip

*tip shows a tip of the theme over an element, as the ScreenTips of Microsoft Office: *tip="'Save the page'", or *tip="{Title, Text, Placement, Delay, Class, Element, Render, Component, Props, Bare, Touch, Stay, Disabled}". Title is written in bold with Text under it; Element (a node), Render(container) or Component (the name of a Component, made with Props while the tip shows: the card of an item, a person) give the tip any content instead. A Component brings its own look, so its tip is bare (no frame of a tip of its own; Bare: false keeps it, Bare: true makes any tip bare). Placement: bottom (the default), top, left or right, the other side when there is no room; Delay the time before it shows under the pointer (500 ms; a focus from the keyboard shows it at once). Pointer away, a press (not with Stay), Escape hide it; while it shows it keeps beside its element, when the page scrolls or moves the element without a scroll (a part above that renders later). Touch: a tap shows it too, and a scroll or a tap elsewhere hides it, as the tooltips of a phone do. One tip shows at a time, an element of its own (role tooltip, the aria-describedby of the element) in the top layer, so no scrolling box, transform or filter around the element cuts it; it is put in the part of the page that has the theme of the element (the nearest data-theme or data-scheme, else the body), so it takes that theme. It is in the document the element is in: a window of its own (Platform.OpenWindow) shows its tips in itself.

## Example

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

## Tests

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

+6 more in the same files
