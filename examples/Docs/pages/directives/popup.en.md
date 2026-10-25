<!-- generated -->
# *popup

*popup="Open" shows the element as a floating panel next to its anchor while the expression is truthy. The anchor is the closest .elemenx-popup-anchor ancestor, or the parent element. data-placement: bottom-start (default), bottom-end, top-start, top-end, right-start; start and end, and the side of right-start, follow the direction of the page (on a right-to-left page start is the right edge). A right-start panel without room on either side (a submenu on a phone) goes under its anchor, a step in. The panel dispatches a "dismiss" DOM event on an outside pointer press and on Escape; the owner closes it. The panel keeps to its anchor while the page scrolls or resizes and while its own size changes. It opens in the top layer (a popover of the browser): no overflow, transform or stacking of the parts of the page around it cuts or hides it; a browser without popovers places it as a fixed panel over the page. It works in the document of its element: in a window of its own (Native.OpenWindow), its window measures it and hears the presses and the keys.

## Example

```example
<span class="elemenx-popup-anchor">
	<Button Label="Options" Icon="chevron-down" (click)="Toggle" />
	<div class="elemenx-card" style="padding: 12px; width: 220px;" *popup="Opened" data-placement="bottom-start" (dismiss)="Close">
		<p class="elemenx-text">A floating panel next to its anchor, over everything.</p>
		<Button Label="OK" Size="small" (click)="Close" />
	</div>
</span>
<script>
({
	Opened: false,

	Toggle: function () {
		this.Opened = !this.Opened;
	},

	Close: function () {
		this.Opened = false;
	}
})
</script>
```
