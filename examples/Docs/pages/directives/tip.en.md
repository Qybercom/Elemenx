<!-- generated -->
# *tip

*tip shows a tip of the theme over an element, as the ScreenTips of Microsoft Office: *tip="'Save the page'", or *tip="{Title, Text, Placement, Delay, Class, Element, Render, Disabled}". Title is written in bold with Text under it; Element (a node) or Render(container) give the tip any content instead. Placement: bottom (the default), top, left or right, the other side when there is no room; Delay the time before it shows under the pointer (500 ms; a focus from the keyboard shows it at once). Pointer away, a press, Escape or a scroll hide it. One tip shows at a time, an element of its own in the body (role tooltip, the aria-describedby of the element): the body of the document the element is in, so a window of its own (Native.OpenWindow) shows its tips in itself.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<button class="elemenx-button" *tip="'Save the page'">Plain</button>
	<button class="elemenx-button" *tip="{Title: 'Number input', Text: 'A number typed or stepped by its arrows, within Min and Max.'}">Rich</button>
	<button class="elemenx-button" *tip="{Title: 'Above', Text: 'Placement top, shown at once.', Placement: 'top', Delay: 0}">Top</button>
</div>
```
