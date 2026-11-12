<!-- generated -->
# Gamepad

Геймпады управляют страницей так же, как клавиатура: каждый компонент, отвечающий на клавиши, отвечает и на геймпад. Сами геймпады (их кнопки, стики, виды и названия, геймпады страницы) — в сервисе InputDevices из ElemenxCommon; этот сервис двигает по ним страницу.

- Крестовина и левый стик отправляют сфокусированному элементу клавиши-стрелки; когда ни один компонент не принимает стрелку (не отменяет действие по умолчанию), фокус переходит к ближайшему элементу управления с той стороны (Move). Удерживаемое направление повторяется.
- A отправляет Enter, X — пробел, и любая из них нажимает сфокусированный элемент, если клавишу не принял компонент (кнопку, флажок, вариант...; A также переходит по ссылке); B отправляет Escape и отменяет верхний диалог, если его не принял компонент (сначала закрывается открытое всплывающее окно); Y отправляет Delete; остальные кнопки — только события InputDevices.
- Геймпад управляет страницей, только пока она видна и в фокусе, и управляет им одна копия Elemenx, когда геймпады используют несколько приложений или виджетов (запущенная первой: window.ElemenxGamepad); геймпад страницы с Navigate false (InputDevices.Virtual) ничем не управляет.

Navigate (true), если false, отключает клавиши и фокус. Move(direction, scope) переводит фокус к ближайшему элементу управления слева, справа, сверху или снизу (внутри открытого диалога или scope); её может вызывать и клавиатура.

## Методы

- `Move(direction, scope)`

## Тесты

- [InputDevices: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L70) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the keys held, the pointer and how far it went, the fingers; a window left lets every key go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L139) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: actions bound to keys, buttons, halves of the sticks and the mouse; their contexts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L175) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L242) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L316) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: puts the shoulders of the left on the left and those of the right on the right](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L388) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: shows a cross of up, down, left and right (dpad for all four) whose buttons hold the pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L406) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: gives nothing within its dead zone, the right stick by its curve, lets go of a finger taken away, and floats](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L448) — `tests/regression/virtual-gamepad.test.js`
