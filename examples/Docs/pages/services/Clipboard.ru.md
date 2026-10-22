<!-- generated -->
# Clipboard

Буфер обмена. Copy(text, callback, options) записывает текст (старым способом через скрытое поле, где Clipboard API нет или он запрещён); options.Toast показывает уведомление через сервис Toast (true — «Скопировано», или своё сообщение). Read(callback) читает текст (браузер может спросить пользователя). callback(error, text).

## Методы

- `Copy(text, callback, options)`
- `Read(callback)`

## Пример

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
