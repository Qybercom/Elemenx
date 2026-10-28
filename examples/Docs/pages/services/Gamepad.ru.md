<!-- generated -->
# Gamepad

Геймпады (Gamepad API, стандартная раскладка): они управляют страницей так же, как клавиатура. Каждый компонент, отвечающий на клавиши, отвечает и на геймпад.

- Крестовина и левый стик отправляют сфокусированному элементу клавиши-стрелки; когда ни один компонент не принимает стрелку (не отменяет действие по умолчанию), фокус переходит к ближайшему элементу управления с той стороны (Move). Удерживаемое направление повторяется.
- A отправляет Enter, X — пробел, и любая из них нажимает сфокусированный элемент, если клавишу не принял компонент (кнопку, флажок, вариант...; A также переходит по ссылке); B отправляет Escape и отменяет верхний диалог, если его не принял компонент (сначала закрывается открытое всплывающее окно); Y отправляет Delete; остальные кнопки — только события.
- Каждое нажатие — событие button ({Button, Pad}): a, b, x, y, lb, rb, lt, rt, select, start, ls, rs, up, down, left, right, home; на геймпаде без стандартной раскладки, кнопки которого ничего известного не значат, — b0, b1... (стик всё равно двигает). connect и disconnect сообщают о геймпадах ({Pad}); change — о новом Kind.
- Геймпад, о котором сообщают дважды (XInput и HID, Steam), нажимает один раз; стик идёт туда, куда наклонён больше всего; геймпад управляет страницей, только пока она видна и в фокусе, и управляет им одна копия Elemenx, когда геймпады используют несколько приложений или виджетов (запущенная первой: window.ElemenxGamepad); события получают все.

On(name, callback) / Off(callback). Pads() перечисляет [{Index, ID, Kind}]; Kind() — вид последнего использованного геймпада (xbox, playstation, nintendo, generic или '', если его нет); Label(button, kind) — название кнопки на геймпаде этого вида (A, ✕, B...). Navigate (true), если false, отключает клавиши и фокус (события остаются). Move(direction, scope) переводит фокус к ближайшему элементу управления слева, справа, сверху или снизу (внутри открытого диалога или scope); её может вызывать и клавиатура. Браузеры сообщают о геймпаде, как только на странице нажата его кнопка.

## Методы

- `Pads()`
- `Kind()`
- `Label(button, kind)`
- `Move(direction, scope)`
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
		var gamepad = this.$Service('Gamepad');

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
		var gamepad = this.$Service('Gamepad');

		gamepad.Off(this.Pressed);
		gamepad.Off(this.Changed);
	}
})
</script>
```

## Тесты

- [Gamepad: names the buttons of each kind of pad, and lists no pad while none is pressed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L210) — `tests/regression/library-services.test.js`
