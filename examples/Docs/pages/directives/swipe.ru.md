<!-- generated -->
# *swipe

*swipe заставляет элемент следовать за пальцем (пером или, с Mouse, мышью) вдоль оси и сообщает об окончании движения: *swipe, *swipe="'y'" или *swipe="{Axis: 'x' или 'y', Threshold: 40, Mouse: false}". Страница по-прежнему прокручивается вдоль другой оси (touch-action). Пока палец движется, элемент отправляет swipemove с {DX, DY} (сдвиг вдоль своей оси, другой — 0); когда палец поднят — swipe с {Direction (left, right, up или down), DX, DY}, если сдвиг превысил Threshold пикселей (или был резким), иначе swipecancel (и когда жест забирает браузер). Владелец слушает через (swipe)="Handler" (event.detail). Движение, начатое на поле, ползунке или на чём-то с пометкой data-no-swipe, оставляется им.

## Пример

```example
<div class="elemenx-card" style="padding: 16px; touch-action: pan-y; user-select: none;" *swipe="{Axis: 'x', Threshold: 60, Mouse: true}" (swipemove)="Moving" (swipe)="Swiped" (swipecancel)="Cancelled" [style.transform]="'translateX(' + Offset + 'px)'">
	<strong>Card {{Index + 1}}</strong>
	<p class="elemenx-text small">Swipe me left or right (a mouse drags it too here).</p>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Index: 0,
	Offset: 0,
	Note: '',

	Moving: function (event) {
		this.Offset = event.detail.DX;
	},

	Swiped: function (event) {
		this.Offset = 0;
		this.Index = event.detail.Direction === 'left' ? this.Index + 1 : Math.max(0, this.Index - 1);
		this.Note = 'Swiped ' + event.detail.Direction;
	},

	Cancelled: function () {
		this.Offset = 0;
		this.Note = 'Not far enough';
	}
})
</script>
```
