<!-- generated -->
# События и конвейеры

`Elemenx.Events` — шина страницы для частей, которые не знают друг о друге: компонент сообщает, что что-то произошло, в канал, и каждый компонент, сервис или приложение, слушающие этот канал, это слышат. Доставка синхронная, в той же среде выполнения JavaScript, с самим объектом (без копии). Между вкладками, фреймами и воркерами используйте [обмен сообщениями](/data/messaging).

```js
/* Anywhere: a socket, and a message on a channel. */
var events = Elemenx.Events();

events.On('cart:changed', function (event) {
	console.log(event.Channel, event.Data, event.Source);
});

events.Emit('cart:changed', {Count: 3});
```

## Сокеты

`Elemenx.Events()` создаёт сокет; внутри компонента, сервиса или приложения `this.$Events()` создаёт сокет, который принадлежит им и уничтожается вместе с ними.

| Метод | Значение |
| --- | --- |
| `On(channel, callback)` | слушает канал; один и тот же обработчик добавляется один раз |
| `Off(channel, callback)` | перестаёт слушать; `Off(channel)` снимает все обработчики канала |
| `Emit(channel, data)` | доставляет `data` каждому сокету, слушающему канал, включая этот; возвращает сокет |
| `Channels()` | каналы, которые слушает сокет |
| `Destroy()` | удаляет сокет; уничтоженный сокет выбрасывает `Elemenx Events Socket is destroyed` |
| `ID` | идентификатор сокета |

Событие — `{Channel, Data, Source, Is}`: `Source` — сокет, который его отправил.

## Объявленные каналы

Определение может назвать свои каналы и получать все их через один метод:

```js
Elemenx.Component('CartBadge', {
	$Template: '<span>{{Count}}</span>',
	$Events: ['cart:changed', 'cart:cleared'],
	Count: 0,

	$OnEvent: function (event) {
		var self = this;

		event.Is('cart:changed', function (changed) {
			self.Count = changed.Data.Count;
		});

		event.Is('cart:cleared', function () {
			self.Count = 0;
		});
	}
});
```

`event.Is(channel)` возвращает, относится ли событие к каналу; `event.Is(channel, handler)` к тому же вызывает обработчик, если относится.

## Конвейеры

`event.Is(channel, pipes, handler)` пропускает события канала через конвейер перед обработчиком: список звеньев, каждое записывается как `{Name: setting}`. Конвейер живёт столько же, сколько сокет — владелец слушателя, так что звено помнит увиденное между событиями. Его место определяется порядком вызовов `Is` в слушателе: сохраняйте этот порядок одинаковым при каждом событии.

| Звено | Настройка | Что проходит |
| --- | --- | --- |
| `Debouncer` | число | значение, когда оно пришло столько раз подряд, и не снова, пока другое значение не придёт столько же раз (мерцание датчика не проходит) |
| `Filter` | число | после каждых стольких событий — значение, встретившееся среди них чаще всего (голосование против шума) |
| `Gate` | миллисекунды | событие с истинным значением спустя это время, если за это время не пришло событие с ложным (наведение, которое удерживается; зажатая клавиша) |

```js
event.Is('presence:typing', [{Gate: 500}], function () {
	self.Typing = true;
});

event.Is('sensor:door', [{Debouncer: 3}, {Filter: 5}], function (stable) {
	self.Door = stable.Data;
});
```

`Elemenx.Pipe(name, factory)` добавляет звено: `factory(setting)` возвращает `{Use: function (event, pass) {...}, Destroy: function () {...}}`; `Use` вызывает `pass(event)` (или `pass` с другим событием) для того, что идёт дальше, а `Destroy` освобождает таймеры. `Elemenx.Pipe(name)` возвращает фабрику. Незарегистрированное звено выбрасывает `Elemenx Pipe is not registered: <name>`.

```js
Elemenx.Pipe('Throttle', function (milliseconds) {
	var last = 0;

	return {
		Use: function (event, pass) {
			if (Date.now() - last < milliseconds) return;

			last = Date.now();

			pass(event);
		}
	};
});
```

Обмен сообщениями использует те же звенья: `message.Is(channel, pipes, handler)`.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Emit A" (click)="EmitA" />
	<Button Label="Emit B" (click)="EmitB" />
	<Button Label="Emit A three times" (click)="EmitThree" />
	<Button Label="Hold for 400 ms" (click)="Hold" />
</div>
<Properties>
	<Property Label="Last event" [value]="Last" />
	<Property Label="Debouncer 3 passed" [value]="Debounced" />
	<Property Label="Gate 400 ms" [value]="Gated" />
</Properties>
<script>
({
	$Events: ['docs:letters', 'docs:hold'],
	Last: '—',
	Debounced: '—',
	Gated: '—',

	$OnEvent: function (event) {
		var self = this;

		event.Is('docs:letters', function (letter) {
			self.Last = letter.Data;
		});

		event.Is('docs:letters', [{Debouncer: 3}], function (letter) {
			self.Debounced = letter.Data;
		});

		event.Is('docs:hold', [{Gate: 400}], function () {
			self.Gated = 'passed at ' + new Date().toLocaleTimeString();
		});
	},

	EmitA: function () {
		this.$Events().Emit('docs:letters', 'A').Destroy();
	},

	EmitB: function () {
		this.$Events().Emit('docs:letters', 'B').Destroy();
	},

	EmitThree: function () {
		this.$Events().Emit('docs:letters', 'A').Emit('docs:letters', 'A').Emit('docs:letters', 'A').Destroy();
	},

	Hold: function () {
		this.Gated = 'waiting';

		this.$Events().Emit('docs:hold', true).Destroy();
	}
})
</script>
```
