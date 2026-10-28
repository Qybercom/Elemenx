<!-- generated -->
# Clipboard

The clipboard. Copy(text, callback, options) writes text (with the old way of a hidden field where the Clipboard API is missing or refused); options.Toast shows a toast through the Toast Service (true: 'Copied', or the message). Read(callback) reads the text (the browser may ask the user). callback(error, text).

## Methods

- `Copy(text, callback, options)`
- `Read(callback)`

## Example

```example
<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Text" /></span>
<Button Label="Copy" Icon="copy" Variant="primary" (click)="Copy" />
<Button Label="Read the clipboard" (click)="Read" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Text: 'exn_live_7f3a9c21b8d04e65',
	Note: '',

	Copy: function () {
		var self = this;

		this.$Service('Clipboard').Copy(this.Text, function (error) {
			self.Note = error ? error.message : 'Copied';
		}, {Toast: true});
	},

	Read: function () {
		var self = this;

		this.$Service('Clipboard').Read(function (error, text) {
			self.Note = error ? 'Not allowed: ' + error.name : 'The clipboard holds: ' + text;
		});
	}
})
</script>
```

## Tests

- [takes the Library Services, Directives and Guards the Application names, and the ones they name](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L303) — `tests/regression/builder-multi-application.test.js`
- [Ribbon: the first control of the panel a person can see, after ArrowDown on its tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L84) — `tests/regression/focus-on-open.test.js`
- [ribbon shrinks its groups to fit, folds them into buttons and collapses to its tabs](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L649) — `tests/examples/ui-kit.spec.js`
