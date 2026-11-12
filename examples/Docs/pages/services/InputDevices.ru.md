<!-- generated -->
# InputDevices

То, что игрок и пользователь нажимают, наклоняют и двигают, со всех устройств сразу — так, как это читает игра или страница.

- Клавиши: Down(code) — нажата ли клавиша сейчас (её код: KeyW, Space, ShiftLeft...), Keys() — нажатые коды. Окно, потерявшее фокус, отпускает все клавиши.
- Указатель: Pointer() — {X, Y (в окне), Buttons (бит на каждую нажатую кнопку: 1 — основная), Locked}; Moved() — насколько он сдвинулся с прошлого вызова {X, Y} (и при захваченном указателе); Lock(element) захватывает указатель для элемента (браузер просит об этом в нажатии), Unlock() отдаёт его. Touches() — [{ID, X, Y}] пальцев.
- Геймпады (Gamepad API, стандартная раскладка): Pads() — [{Index, ID, Kind}]; Kind() — вид последнего использованного (xbox, playstation, nintendo, generic, virtual или ''); Label(button, kind) — название кнопки на этом виде (A, ✕, B...). Axes() — стики и курки всех геймпадов сразу, {LeftX, LeftY, RightX, RightY, LeftTrigger, RightTrigger} (от -1 до 1, вверх -1; маленький наклон — 0). Кнопки: a, b, x, y, lb, rb, lt, rt, select, start, ls, rs, up, down, left, right, home (левый стик наклоняется и как up, down, left, right); на геймпаде без стандартной раскладки — b0, b1... Геймпад, о котором сообщают дважды (XInput и HID, Steam), нажимает один раз. Virtual(name, options) делает геймпад страницы (VirtualGamepad на экране, наклон телефона): Press(button), Release(button), Stick('left' или 'right', x, y), Trigger('left' или 'right', value), Destroy(); options Navigate (false: сервис Gamepad из ElemenxUI не двигает им фокус).
- Движение устройства: MotionSupported(), RequestMotion(callback(error, state)) (iOS спрашивает только в нажатии: granted, denied или unsupported), StartMotion(), StopMotion(); Motion() — последнее {Orientation, Acceleration, Gravity, Rotation}. Tilt() — наклон устройства как контроллера с учётом поворота экрана: Steer, Pitch, X, Y (от -1 до 1), Up; Range градусов дают 1 (35), TiltDead градусов — 0 (2). Center() делает текущий наклон серединой.
- Действия: Bind(action, sources, {Context}) — что выполняет действие: код клавиши (KeyW), кнопка геймпада (a, rb), половина оси (LeftX+, LeftY-, RightTrigger), кнопка мыши (Mouse0), половина наклона (Steer+, Pitch-); Unbind(action, context). Value(name) — насколько нажато действие, от 0 до 1, Held(name) — больше ли половины; name может быть и источником (Held('a'), Value('LeftX+')). Axis(negative, positive) — Value(positive) - Value(negative). Context(name) задаёт контекст действий (игра, машина, меню: привязка другого контекста ничего не делает, привязка без контекста работает всегда); Context() возвращает его. Actions() — [{Action, Sources, Context}].
- On(name, callback) / Off(callback): connect и disconnect ({Pad}), change ({Kind}), button ({Button, Pad, Quiet}: удерживаемое направление повторяется через Delay, каждые Repeat мс), orientation и motion.

Те же функции работают там, где страницы нет (Node, воркер): ничего не нажато и ничего не движется.

## Методы

- `Down(code)`
- `Keys()`
- `Pointer()`
- `Moved()`
- `Lock(element)`
- `Unlock()`
- `Touches()`
- `Virtual(name, options)`
- `Axes()`
- `Pads()`
- `Kind()`
- `Label(button, kind)`
- `Press(name, pad)`
- `MotionSupported()`
- `RequestMotion(callback)`
- `StartMotion()`
- `StopMotion()`
- `Motion()`
- `Tilt()`
- `Center()`
- `Bind(action, sources, options)`
- `Unbind(action, context)`
- `Context(name)`
- `Actions()`
- `Value(name)`
- `Held(name)`
- `Axis(negative, positive)`
- `On(name, callback)`
- `Off(callback)`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<GameKey Button="a" [pad]="Kind || 'xbox'" />
	<GameKey Button="b" [pad]="Kind || 'xbox'" />
	<GameKey Button="x" [pad]="Kind || 'xbox'" />
	<GameKey Button="y" [pad]="Kind || 'xbox'" />
</div>
<p class="elemenx-text">{{Kind ? 'A ' + Kind + ' pad is connected.' : 'Connect a gamepad and press a button.'}} Last button: <strong>{{Last}}</strong></p>
<p class="elemenx-text small muted">The pad works the page as the keys do: the d-pad moves the focus, A presses.</p>
<script>
({
	Kind: '',
	Last: '—',

	$OnCreate: function () {
		var self = this;
		var gamepad = this.$Service('InputDevices');

		this.Kind = gamepad.Kind();

		this.Pressed = function (event) {
			self.Last = gamepad.Label(event.Button, gamepad.Kind()) + ' (' + event.Button + ')';
		};

		this.Changed = function () {
			self.Kind = gamepad.Kind();
		};

		gamepad.On('button', this.Pressed);
		gamepad.On('change', this.Changed);
		gamepad.On('connect', this.Changed);
	},

	$OnDestroy: function () {
		var gamepad = this.$Service('InputDevices');

		gamepad.Off(this.Pressed);
		gamepad.Off(this.Changed);
	}
})
</script>
```

## Тесты

- [InputDevices: names the buttons of each kind of pad, and lists no pad while none is pressed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L265) — `tests/regression/library-services.test.js`
- [InputDevices: a pad of the page is a pad as any other: its events, its sticks and triggers, its buttons held; quiet by choice](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L70) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the keys held, the pointer and how far it went, the fingers; a window left lets every key go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L139) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: actions bound to keys, buttons, halves of the sticks and the mouse; their contexts](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L175) — `tests/regression/virtual-gamepad.test.js`
- [InputDevices: the lean of a device as a wheel, its top away, and flat; the way the screen is turned; its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L242) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: its stick leans the pad as far as the finger, its buttons hold, and it goes with its pad](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L316) — `tests/regression/virtual-gamepad.test.js`
- [VirtualGamepad: puts the shoulders of the left on the left and those of the right on the right](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/virtual-gamepad.test.js#L388) — `tests/regression/virtual-gamepad.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [walks, drives and looks by a pad as far as it leans: half a trigger is half the gas, the stick steers, A jumps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1823) — `tests/regression/library-scene.test.js`
