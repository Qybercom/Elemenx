<!-- generated -->
# PictureInPicture

Картинка в картинке: видео или любая часть страницы в маленьком отдельном окне, которое остаётся поверх других окон системы.

- Supported(kind): есть ли это в браузере для kind 'video' (Chrome, Edge, Safari, Firefox со своей кнопкой) или 'document' (любой элемент: Chrome и Edge).
- Video(video, callback): видео в своё окно или обратно, если оно уже там; callback(error, {Active}).
- Document(element, {Width, Height, Title}, callback): элемент переходит в своё окно со стилями, темой и направлением письма страницы; рамка на его месте говорит, где он, и возвращает его. Он возвращается, когда окно закрывается. callback(error, {Window}).
- Close(callback): видео или элемент обратно на страницу. Active(): {Kind, Element} или null.
- OnChange(callback) / OffChange(callback): callback(Active()), когда что-то уходит в окно или возвращается.

Браузер разрешает открыть окно только после нажатия или клавиши пользователя.

## Методы

- `Supported(kind)`
- `Active()`
- `OnChange(callback)`
- `OffChange(callback)`
- `Video(video, callback)`
- `Document(element, options, callback)`
- `Close(callback)`

## Пример

```example
<div class="elemenx-card docs-pip" style="padding: 12px;">
	<strong>A timer in its own window</strong>
	<p class="elemenx-title">{{Seconds}} s</p>
</div>
<Button Label="Pop it out" Icon="pip" [disabled]="!Supported" (click)="Pop" />
<span class="elemenx-text small muted">{{Supported ? 'Document Picture-in-Picture is here.' : 'This browser has no Document Picture-in-Picture (Chrome and Edge do).'}}</span>
<script>
({
	Seconds: 0,
	Supported: false,

	$OnCreate: function () {
		var self = this;

		this.Supported = this.$Service('PictureInPicture').Supported('document');
		this.Timer = setInterval(function () {
			self.Seconds++;
		}, 1000);
	},

	Pop: function () {
		this.$Service('PictureInPicture').Document(this.$Element().querySelector('.docs-pip'), {Width: 260, Height: 140, Title: 'Timer'}, function () {});
	},

	$OnDestroy: function () {
		clearInterval(this.Timer);
		this.$Service('PictureInPicture').Close(function () {});
	}
})
</script>
```
