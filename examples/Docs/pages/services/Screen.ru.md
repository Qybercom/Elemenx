<!-- generated -->
# Screen

Как держат экран страницы и какого он размера — так, как страница строит по этому свою раскладку.

- Orientation() — portrait или landscape (выше, чем шире, — portrait); Angle() — поворот экрана: 0, 90, 180 или 270 градусов; Narrow() — узкий, как телефон (короткая сторона меньше Narrowest пикселей, 600); Coarse() — указатель — палец (pointer: coarse); Phone() — узкий и сенсорный. State() — всё сразу: {Orientation, Angle, Width, Height, Narrow, Coarse, Phone}.
- Страница знает это и по классам: на <html> — elemenx-portrait или elemenx-landscape, elemenx-narrow и elemenx-coarse, пока это так; раскладка меняется одним CSS.
- On('change', callback(state)) / Off(callback): экран повернули или изменился размер (окно растянули) — один раз на изменение; событие шаблона (orientation) на любом элементе даёт то же состояние в event.detail.
- Fullscreen(element, options, callback(error)) — элемент на весь экран (браузер разрешает это только в нажатии); options Landscape (true: пока так, экран держится в альбомной ориентации, где устройство даёт странице её зафиксировать — телефоны в полноэкранном режиме; в остальных он поворачивается как хочет, это не ошибка), Navigation ('hide'). Exit(callback(error)) выходит из него; Full() — есть ли сейчас что-то на весь экран.

Там, где страницы нет (Node, воркер), экран альбомный, 1280 на 800, не узкий и не сенсорный.

## Методы

- `State()`
- `Orientation()`
- `Angle()`
- `Narrow()`
- `Coarse()`
- `Phone()`
- `On(name, callback)`
- `Off(callback)`
- `Full()`
- `Fullscreen(element, options, callback)`
- `Exit(callback)`

## Пример

```example
<div class="elemenx-card" style="padding: 16px;" (orientation)="Turned">
	<p class="elemenx-text">{{State.Orientation}}, {{State.Width}} × {{State.Height}}, turned {{State.Angle}}°{{State.Phone ? ', a phone' : State.Coarse ? ', touched' : ''}}</p>
	<button class="elemenx-button" (click)="Full">Fullscreen in landscape</button>
</div>
<script>
({
	State: {},

	$OnCreate: function () {
		this.State = this.$Service('Screen').State();
	},

	Turned: function (event) {
		this.State = event.detail;
	},

	Full: function (event) {
		this.$Service('Screen').Fullscreen(event.target.closest('.elemenx-card'), {Landscape: true});
	}
})
</script>
```

## Тесты

- [tells its orientation, its size and its kind, and marks <html> by them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-screen.test.js#L29) — `tests/regression/library-screen.test.js`
- [tells a change of the screen once to its listeners and to the event (orientation) of templates](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-screen.test.js#L44) — `tests/regression/library-screen.test.js`
- [tells an error when nothing can be over the whole screen, and leaves it when nothing is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-screen.test.js#L89) — `tests/regression/library-screen.test.js`
- [has every component of ElemenxUI from its $Meta and the classes of its layouts on the Insert tab, with a search](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L367) — `tests/examples/designer.spec.js`
- [drops a row at the end of a screen a row fills by the bar of the containers, and the canvas is as high as its room](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L701) — `tests/examples/designer.spec.js`
