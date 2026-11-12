<!-- generated -->
# Gestures

Что пальцы делают на элементе, распознанное сразу для всех жестов, — так, как это читает страница или игра.

- Recognizer(options) — само распознавание, без страницы (работает в Node и в воркере): Push(kind, id, x, y, time) принимает палец, который опустился, движется, поднялся или отменён (kind: down, move, up, cancel; id пальца; x и y в пикселях; time в мс) и возвращает список жестов; Tick(time) — то, что даёт само время (долгое нажатие); Reset() забывает все пальцы. Жест — {Type, Phase (start, move или end; у тапа, двойного тапа, нажатия и смахивания её нет), X, Y (середина пальцев), Pointers} и по виду:
  - tap; doubletap — второй тап из двух, близких по месту и времени (после его tap);
  - press — палец держали неподвижно Hold мс; pressup — он поднялся (тапа тогда нет);
  - pan — один палец или два, движущихся вместе: DX, DY с начала, MoveX, MoveY с прошлого раза, Pressed после нажатия;
  - swipe — перетаскивание, закончившееся быстро: Direction (left, right, up, down), VX, VY в пикс/мс;
  - pinch — два пальца разводят или сводят: Scale с начала, Step с прошлого раза;
  - rotate — два пальца поворачивают: Angle в радианах с начала (по часовой на экране — плюс), Step;
  - tilt — два пальца вместе вверх или вниз, как наклон карты: DY с начала, MoveY.
  Двумя пальцами щипок, поворот и перетаскивание идут одновременно; наклон — один (кто из него и поворота первым прошёл порог, тот и берёт). Жест двух пальцев начинается, только когда сдвинулись оба (на половину Slop) или один сдвинулся так явно, что сомнений нет (вдвое больше порога): палец, ушедший раньше другого, поворачивает линию между ними, но это ещё не поворот. Второй палец заканчивает перетаскивание одним.
  Настройки: Slop — сколько пикселей палец может сдвинуться и считаться неподвижным (10), Hold — мс нажатия (500), Double и DoubleSlop — мс и пиксели между тапами двойного (300, 30), Fling — пикс/мс смахивания (0,5), Scale — порог щипка (0,06, логарифм масштаба), Angle — порог поворота (0,12 рад), Shift — порог перетаскивания двумя и наклона в пикселях (12).
- Listen(element, callback(gesture, event), options) — пальцы на элементе (и перо; мышь при Mouse true — как один палец) в их жесты по мере появления; настройки — как у Recognizer, плюс Mouse (false) и Touch ('none': touch-action элемента, пока он слушает, чтобы браузер его не прокручивал и не масштабировал; false не трогает). Возвращает функцию остановки. Палец принадлежит элементу, пока не поднимется (захват указателя).
- События шаблонов (Elemenx.EventSource): (tap), (doubletap), (press), (pressup), (pan), (swipe), (pinch), (rotate), (tilt) на любом элементе; жест — в event.detail. Атрибут data-gestures-mouse на элементе принимает и мышь, как один палец (чтобы попробовать жесты на компьютере).

## Методы

- `Recognizer(options)`
- `Listen(element, callback, options)`

## Пример

```example
<div class="elemenx-card" style="height: 220px; display: flex; align-items: center; justify-content: center; user-select: none;" data-gestures-mouse (tap)="Seen" (doubletap)="Seen" (press)="Seen" (pan)="Seen" (swipe)="Seen" (pinch)="Seen" (rotate)="Seen" (tilt)="Seen">
	<div [style.transform]="'rotate(' + Turn + 'rad) scale(' + Size + ')'" style="width: 80px; height: 80px; border-radius: 12px; background: var(--elemenx-accent);"></div>
</div>
<p class="elemenx-text small muted">Tap, press, pan, swipe (a mouse too); with two fingers pinch, turn and tilt. Last: <strong>{{Last}}</strong></p>
<script>
({
	Last: '—',
	Size: 1,
	Turn: 0,

	Seen: function (event) {
		var gesture = event.detail;

		this.Last = gesture.Type + (gesture.Phase ? ' ' + gesture.Phase : '') + (gesture.Direction ? ' ' + gesture.Direction : '');

		if (gesture.Type === 'pinch')
			this.Size = Math.max(0.3, Math.min(3, this.Size * gesture.Step));

		if (gesture.Type === 'rotate')
			this.Turn += gesture.Step;

		if (gesture.Type === 'doubletap') {
			this.Size = 1;
			this.Turn = 0;
		}
	}
})
</script>
```

## Тесты

- [taps, taps twice near in place and time, and presses a finger held still](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L48) — `tests/regression/library-gestures.test.js`
- [pans a finger past its slop, its moves told, and a quick one ends in a swipe](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L65) — `tests/regression/library-gestures.test.js`
- [pinches, rotates and pans two fingers at once; a second finger ends the pan of one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L79) — `tests/regression/library-gestures.test.js`
- [tilts two fingers moving up or down together, alone of the gestures of two](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L109) — `tests/regression/library-gestures.test.js`
- [gives its gestures as events of templates on any element, and lets the element go with its component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L125) — `tests/regression/library-gestures.test.js`
- [takes a mouse as one finger on an element with data-gestures-mouse](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L178) — `tests/regression/library-gestures.test.js`
