<!-- generated -->
# *tip

*tip shows a tip of the theme over an element, as the ScreenTips of Microsoft Office: *tip="'Save the page'", or *tip="{Title, Text, Placement, Delay, Class, Element, Render, Disabled}". Title is written in bold with Text under it; Element (a node) or Render(container) give the tip any content instead. Placement: bottom (the default), top, left or right, the other side when there is no room; Delay the time before it shows under the pointer (500 ms; a focus from the keyboard shows it at once). Pointer away, a press, Escape or a scroll hide it. One tip shows at a time, an element of its own in the body (role tooltip, the aria-describedby of the element): the body of the document the element is in, so a window of its own (Platform.OpenWindow) shows its tips in itself.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<button class="elemenx-button" *tip="'Save the page'">Plain</button>
	<button class="elemenx-button" *tip="{Title: 'Number input', Text: 'A number typed or stepped by its arrows, within Min and Max.'}">Rich</button>
	<button class="elemenx-button" *tip="{Title: 'Above', Text: 'Placement top, shown at once.', Placement: 'top', Delay: 0}">Top</button>
</div>
```

## Tests

- [shows a *tip in the document of its element, not in the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/other-document.test.js#L62) — `tests/regression/other-document.test.js`
- [shows a bold title over its text after the delay, beside the element, and hides when the pointer leaves](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L33) — `tests/regression/tip.test.js`
- [takes a plain text, renders content of its own, and shows nothing when Disabled](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L66) — `tests/regression/tip.test.js`
- [hides when the pointer moves off an element that never heard it leave, and shows nothing for a hidden element](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/tip.test.js#L103) — `tests/regression/tip.test.js`
- [completes the tags, props, bindings, events, directives and options of a template, and the fields of its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L63) — `tests/regression/language-server.test.js`
- [tells of a Component, a prop, a directive and a Service on hover, and finds their definitions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L95) — `tests/regression/language-server.test.js`
- [goes from a directive to its definition (the core ones in elemenx.js), and from a prop or an event to its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L176) — `tests/regression/language-server.test.js`
- [goes to the sources the extension carries in a project that has only builds of dist, and reads no bundle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L190) — `tests/regression/language-server.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
