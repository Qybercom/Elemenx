<!-- generated -->
# *modal

*modal="Open" открывает элемент <dialog> как модальный, пока выражение истинно, и закрывает его иначе. Он показан в верхнем слое, поверх всего, со своим фоном (popover браузера, открывающийся сразу при любом размере страницы: showModal делает всю страницу инертной, что на большой странице стоит долгой паузы). Тем не менее это модальное окно: aria-modal сообщает об этом экранным читалкам, фон принимает указатель, Tab и Shift+Tab ходят по кругу внутри него, фокус переходит в него при открытии ([autofocus] или его первый элемент управления) и возвращается туда, где был, при закрытии. Escape и нажатие на фон отправляют "dismiss" с {Reason: 'escape'} или {Reason: 'backdrop'}; закрывает диалог владелец. Клавиши принимает верхний из нескольких диалогов. Фон popover пропускает указатель, поэтому нажатия вне диалога принимает слой директивы (elemenx-modal-shade, в верхнем слое под диалогом).

## Пример

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

## Тесты

- [*modal opens a dialog while its expression is true, puts the focus in it, and asks to close on Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L54) — `tests/regression/library-directives.test.js`
