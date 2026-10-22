<!-- generated -->
# *copy

*copy="text" копирует текст по щелчку на элементе (или *copy="{Text, Toast}": Toast true или сообщение показывает уведомление). Ненадолго после копирования у элемента есть класс copied и data-copied="true" (например, иконка-галочка в Button). Использует сервис Clipboard. Элемент отправляет "copied" с {Text, Error}.

## Пример

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
