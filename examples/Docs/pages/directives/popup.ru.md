<!-- generated -->
# *popup

*popup="Open" показывает элемент как плавающую панель рядом с её якорем, пока выражение истинно. Якорь — ближайший предок .elemenx-popup-anchor или родительский элемент. data-placement: bottom-start (по умолчанию), bottom-end, top-start, top-end, right-start; start и end, а также сторона right-start следуют направлению письма страницы (на странице справа налево start — правый край). Панель right-start, которой нет места ни с одной стороны (подменю на телефоне), встаёт под якорем с отступом. Панель отправляет событие DOM "dismiss" при нажатии указателя снаружи и по Escape; закрывает её владелец. Панель держится у якоря, пока страница прокручивается или меняет размер и пока меняется её собственный размер. Она открывается в верхнем слое (popover браузера): никакие overflow, transform или наложение окружающих частей страницы её не обрезают и не прячут; в браузере без popover она ставится фиксированной панелью поверх страницы.

## Пример

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

## Тесты

- [opens in the top layer and closes on Escape when it was open before its element was in the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/popup.test.js#L36) — `tests/regression/popup.test.js`
