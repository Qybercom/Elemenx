<!-- generated -->
# Живая панель

Цифры магазина в момент, когда они происходят: посетители на сайте, заказы и выручка, график последней минуты и новые заказы — всё это присылает сервер потоком. Готовый проект — `examples/Tutorials/Dashboard`.

Чему вы научитесь: server-sent events через `Network.SSE`, протокол, который превращает текст потока в типизированные сообщения, сервис, владеющий соединением, переподключение и продолжение без потерь и повторов, и пауза потока, на который никто не смотрит.

## 1. Почему SSE

Цифры идут в одну сторону — от сервера. Server-sent events созданы именно для этого: обычный HTTP-ответ, который сервер держит открытым и дописывает, а браузер сам переподключается, когда связь рвётся. [WebSocket](/network/websocket) нужен для сообщений в обе стороны (чат, игра); опрос каждые несколько секунд тратит запросы и всё равно опаздывает.

## 2. Сервер

Поток — это ответ с типом `text/event-stream`, сообщения в нём разделены пустой строкой. У каждого есть `id`: когда связь рвётся, браузер присылает последний обратно (`Last-Event-ID`), и сервер продолжает с него. Проект отдаёт поток из `Server.Request` своего `elemenx.config.js`, который `elemenx dev` и `elemenx serve` вызывают на каждый запрос:

```js
Request: function (request, response, pathname) {
	var id;
	var timer;

	if (pathname !== '/api/stream') return false;

	id = Number(request.headers['last-event-id'] || new URL(request.url, 'http://localhost').searchParams.get('after')) || 0;

	response.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive'});
	response.write('retry: 1000\n\n');

	function send () {
		id += 1;

		response.write('id: ' + id + '\ndata: ' + JSON.stringify(tick(id)) + '\n\n');
	}

	send();

	timer = setInterval(send, 1000);

	request.on('close', function () {
		clearInterval(timer);
	});

	return true;
}
```

`retry` говорит браузеру, сколько ждать перед переподключением. Останавливайте таймер, когда запрос закрылся: поток, который продолжает писать в закрытый сокет, — утечка сервера. Любой сервер делает то же самое: Express, PHP, Go и прокси перед ними, который не должен буферизовать ответ.

## 3. Протокол

`data` сообщения — это текст. Протокол разбирает его один раз, и остальной код слышит типизированные сообщения, а не разбирает текст повсюду:

```js
Elemenx.Network.Protocol('Shop', {
	Decode: function (text) {
		try {
			return {Type: 'Tick', Data: JSON.parse(text)};
		}
		catch (error) {
			return {Type: 'Invalid', Data: text};
		}
	}
});
```

Ресурс с `Protocol: 'Shop'` испускает `Protocol.Tick` с объектом и `Protocol.Invalid` для сообщения, которое не удалось прочесть. Сервер, присылающий несколько видов сообщений, называет их в JSON (`{"Type": "Order", ...}`), а протокол возвращает этот `Type`: `Protocol.Order`, `Protocol.Price`.

## 4. Соединением владеет сервис

Соединение принадлежит сервису, а не компоненту: один поток на всё приложение, что бы ни показывало его цифры, и его состояние в одном месте.

```js
Open: function () {
	var self = this;

	if (this.Stream) return;

	this.Stream = this.$Network().SSE({URL: '/api/stream' + (this.Last ? '?after=' + this.Last : ''), Protocol: 'Shop'});

	this.Stream.On('Transport.Open', function () {
		self.Tell('live');
	});

	this.Stream.On('Transport.Error', function (event) {
		self.Tell(event.Data.ReadyState === 0 ? 'reconnecting' : 'paused');
	});

	this.Stream.On('Protocol.Tick', function (event) {
		self.Take(event.Data);
	});

	this.State = 'connecting';

	this.Stream.Connect();
	this.Tell(this.State);
}
```

- `Transport.Error` с `ReadyState` 0 значит, что браузер переподключается сам: покажите это и больше ничего не делайте. 2 — он сдался.
- `Take(tick)` хранит последнюю минуту точек (`slice(-60)`, чтобы память не росла часами), пять новых заказов, их число и сумму.
- `Tell(state)` вызывает слушателей сервиса (`OnChange`), как в других туториалах.

## 5. Продолжение без пропусков

Браузер присылает `Last-Event-ID`, только когда переподключает тот же `EventSource`. Новый, после паузы, начинает с нуля, и сервер прислал бы первые тики снова: один и тот же заказ дважды в списке. Сервис помнит последний принятый ID и называет его в адресе нового потока (`?after=`); сервер читает оба. Сквозной тест проекта ставит поток на паузу, продолжает его и проверяет, что ни один заказ не пришёл дважды: он падал, пока этой строки не было.

## 6. Никто не смотрит — ничего не идёт

Вкладке в фоне цифры не нужны. Сервис закрывает поток, когда страница скрыта, и открывает снова, с последнего тика, когда она показана:

```js
document.addEventListener('visibilitychange', function () {
	if (!self.Wanted) return;

	if (document.hidden) self.Close('paused');
	else self.Open();
});
```

`Wanted` оставляет на паузе поток, который поставил на паузу человек, когда вкладка возвращается. Сервер держит меньше открытых соединений, а телефон бережёт батарею.

## 7. Компонент

Компонент копирует то, что показывает, при каждом изменении сервиса:

```js
Show: function (live) {
	var last = live.Points[live.Points.length - 1];

	this.State = live.State;
	this.Visitors = last ? last.Visitors : 0;
	this.Orders = live.Orders;
	this.Revenue = live.Revenue;
	this.Recent = live.Recent;
	this.Labels = live.Points.map(function (point) {
		return new Date(point.Time).toLocaleTimeString();
	});
	this.Values = live.Points.map(function (point) {
		return point.Visitors;
	});
}
```

```html
<span class="elemenx-badge live-state" [class.success]="State === 'live'" [class.warning]="State === 'reconnecting' || State === 'connecting'" role="status">{{States[State]}}</span>
<Chart Type="area" [labels]="Labels" [series]="[{Name: 'Visitors', Values: Values}]" Height="220" Min="0" Label="Visitors, the last minute" />
<ul class="live-orders-list" aria-live="polite">
	<li *for="order of Recent" *key="order.ID"><span>#{{order.ID}} · {{order.Customer}}</span><strong>{{Money(order.Amount)}}</strong></li>
</ul>
```

- `role="status"` зачитывает смену состояния скринридеру, `aria-live="polite"` — новые заказы, не перебивая.
- `*key="order.ID"` сохраняет строки уже показанных заказов: новый добавляется сверху, остальные не строятся заново.
- `Min="0"` держит низ графика, чтобы область не прыгала вместе с цифрами.
- `$OnDestroy` компонента убирает его слушатель и ставит поток на паузу.

## 8. Попробуйте

```bash
cd examples/Tutorials/Dashboard
npm install
npm run dev
```

Остановите сервер на несколько секунд и запустите снова: значок покажет «Reconnecting», затем «Live», и цифры продолжатся с того места, где остановились.
