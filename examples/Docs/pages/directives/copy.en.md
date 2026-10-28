<!-- generated -->
# *copy

*copy="text" copies text when the element is clicked (or *copy="{Text, Toast}": Toast true or a message shows a toast). For a moment after the copy the element has the class copied and data-copied="true" (a check icon in a Button, for example). Uses the Clipboard Service. The element dispatches "copied" with {Text, Error}.

## Example

```example
<code class="elemenx-code">{{Token}}</code>
<Button Label="Copy" Icon="copy" *copy="Token" />
<Button Label="Copy with a toast" Icon="copy" Variant="ghost" *copy="{Text: Token, Toast: 'The token is copied'}" />
<button type="button" class="elemenx-link" *copy="'https://example.com/invite/42'" (copied)="Copied">copy the invitation link</button>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Token: 'exn_live_7f3a9c21b8d04e65',
	Note: '',

	Copied: function (event) {
		this.Note = event.detail.Error ? 'Not copied' : 'Copied: ' + event.detail.Text;
	}
})
</script>
```

## Tests

- [takes the Library Services, Directives and Guards the Application names, and the ones they name](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L303) — `tests/regression/builder-multi-application.test.js`
