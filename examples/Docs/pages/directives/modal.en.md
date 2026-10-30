<!-- generated -->
# *modal

*modal="Open" opens a <dialog> element as a modal while the expression is truthy and closes it otherwise. It shows in the top layer, over everything, with its backdrop (a popover of the browser, opened at once whatever the size of the page: showModal makes the whole page inert, which costs a long pause on a large page). It is a modal all the same: aria-modal tells the readers of the screen, the backdrop takes the pointer, Tab and Shift+Tab go round inside it, and the focus goes into it when it opens ([autofocus], or its first control) and back to where it was when it closes. Escape and a press on the backdrop dispatch "dismiss" with {Reason: 'escape'} or {Reason: 'backdrop'}; the owner closes the dialog. The dialog on top of several takes the keys. The backdrop of a popover lets the pointer through, so a layer of the directive (elemenx-modal-shade, in the top layer under the dialog) takes the presses outside the dialog.

## Example

```example
<Button Label="Open a modal" Variant="primary" (click)="Open" />
<dialog class="elemenx-card" style="padding: 20px; max-width: 360px;" *modal="Opened" (dismiss)="Dismissed">
	<h3>A plain dialog</h3>
	<p class="elemenx-text">The page behind is inert; Tab goes round inside. Escape or the backdrop dismiss it.</p>
	<span class="elemenx-input"><input class="elemenx-input-control" autofocus placeholder="Focused at once" /></span>
	<Button Label="Close" (click)="Close" />
</dialog>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Opened: false,
	Note: '',

	Open: function () {
		this.Opened = true;
	},

	Close: function () {
		this.Opened = false;
		this.Note = 'Closed by the button';
	},

	Dismissed: function (event) {
		this.Opened = false;
		this.Note = 'Dismissed: ' + event.detail.Reason;
	}
})
</script>
```

## Tests

- [*modal opens a dialog while its expression is true, puts the focus in it, and asks to close on Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L82) — `tests/regression/library-directives.test.js`
