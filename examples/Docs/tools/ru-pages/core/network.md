# Сеть и хранилища

У браузера много способов говорить с сервером (запрос, поток, server-sent events, сокет, peer-соединение) и много мест для данных (local и session storage, cookie, IndexedDB), и у каждого свой API. Elemenx даёт каждой группе один вид и привязывает то, что открыл компонент, к компоненту.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 280" role="img" aria-label="Сетевой ресурс">
	<title>Сетевой ресурс</title>
	<rect class="box" x="20" y="20" width="230" height="60" rx="8" />
	<text x="135" y="45.5" text-anchor="middle" class="strong">1  Создать</text>
	<text x="135" y="63.5" text-anchor="middle" class="muted">$Network().WebSocket({...})</text>
	<rect class="box" x="265" y="20" width="230" height="60" rx="8" />
	<text x="380" y="45.5" text-anchor="middle" class="strong">2  Слушать</text>
	<text x="380" y="63.5" text-anchor="middle" class="muted">On('Protocol.Chat', ...)</text>
	<rect class="box accent" x="510" y="20" width="230" height="60" rx="8" />
	<text x="625" y="45.5" text-anchor="middle" class="strong">3  Запустить</text>
	<text x="625" y="63.5" text-anchor="middle" class="muted">Connect(), Execute()</text>
	<polyline class="line" points="250,50 265,50" />
	<polygon class="head" points="265,50 256.0,45.5 256.0,54.5" />
	<polyline class="line" points="495,50 510,50" />
	<polygon class="head" points="510,50 501.0,45.5 501.0,54.5" />
	<rect class="box soft" x="20" y="120" width="200" height="56" rx="8" />
	<text x="120" y="143.5" text-anchor="middle" class="strong">Провод</text>
	<text x="120" y="161.5" text-anchor="middle" class="muted">текст, байты</text>
	<rect class="box accent" x="280" y="120" width="200" height="56" rx="8" />
	<text x="380" y="143.5" text-anchor="middle" class="strong">Protocol</text>
	<text x="380" y="161.5" text-anchor="middle" class="muted">Encode / Decode</text>
	<rect class="box" x="540" y="120" width="200" height="56" rx="8" />
	<text x="640" y="143.5" text-anchor="middle" class="strong">Типизированные сообщения</text>
	<text x="640" y="161.5" text-anchor="middle" class="muted">Protocol.Chat {Text}</text>
	<polyline class="line" points="220,148 280,148" />
	<polygon class="head" points="280,148 271.0,143.5 271.0,152.5" />
	<polygon class="head" points="220,148 229.0,152.5 229.0,143.5" />
	<polyline class="line" points="480,148 540,148" />
	<polygon class="head" points="540,148 531.0,143.5 531.0,152.5" />
	<polygon class="head" points="480,148 489.0,152.5 489.0,143.5" />
	<text x="380" y="222" text-anchor="middle" class="muted">Ресурс принадлежит создавшему его компоненту или сервису и закрывается вместе с ним.</text>
	<text x="380" y="246" text-anchor="middle" class="muted">Send() отказывает при полном буфере (backpressure); Drain сообщает, когда продолжать.</text>
</svg>
```

## Один вид для любого соединения

У каждого ресурса `Elemenx.Network` (XHR, Stream, LongPolling, SSE, WebSocket, WebRTC, Transfer) одна и та же жизнь:

1. **Создать** с настройками: `this.$Network().WebSocket({URL: 'wss://...', Protocol: 'Chat'})`. По проводу пока ничего не идёт.
2. **Слушать**, о чём он будет сообщать: `On('Transport.Open')`, `On('Transport.Error')`, `On('Protocol.Message')`. Каждое событие — `{Namespace, Type, Data, Target}`.
3. **Запустить**: `Execute()` для запроса, `Connect()` для остальных.
4. **Остановить**: `Abort()`, `Close()` или позволить уйти его владельцу.

Раз все они сообщают одинаково, код, показывающий прогресс, повторяющий попытки или пишущий журнал, работает для любого, а переход с long polling на server-sent events меняет одну строку. Ни один не возвращает Promise: запрос можно прервать в любой момент, а событие, пришедшее после ухода компонента, никогда не доставляется.

## Transport и Protocol

От ресурса приходят два семейства событий:

- **`Transport.*`** — то, что происходит на проводе: `BeforeRequest`, `Open`, `Data`, `Success`, `Error`, `Close`, `Drain`. Данные сырые: текст, байты, статус.
- **`Protocol.*`** — то, что значат сообщения. Протокол (`Elemenx.Network.Protocol('Chat', {Encode, Decode})`) стоит между проводом и вашим кодом: превращает каждое пришедшее сообщение в `{Type, Data}`, испускаемое как `Protocol.<Type>`, а каждое отправляемое — в то, что принимает провод. Ваш код слушает `Protocol.Message` или `Protocol.Typing` и никогда не разбирает текст.

## Backpressure

Сокету или каналу данных можно давать данные быстрее, чем их забирает сеть. Вместо того чтобы заполнять память, `Send` возвращает `false`, как только буфер перешёл верхнюю отметку; событие `Drain` сообщает, когда он опустел достаточно, чтобы продолжать. Большой файл идёт через `Transfer`: режется на куски, каждый отправляется, когда есть место, с прогрессом в событиях и `TransferReceiver`, который собирает его обратно.

## Принадлежит и закрывается

`this.$Network()` в компоненте создаёт ресурсы, принадлежащие ему. Когда компонент уничтожается (со страницы ушли, его `*if` ложно), каждый созданный им ресурс закрывается: сокет отключается, запрос прерывается, поток останавливается, а их запоздавшие события уходят в никуда. Ресурсы сервиса живут, пока живёт его приложение. Поэтому страница роутера может открыть поток без кода, который его закроет.

## Хранилища: один вид, и всегда на месте

`this.$Storage` даёт хранилищам браузера один интерфейс:

| Хранилище | Хранится | Для чего |
| --- | --- | --- |
| `Local` | пока не очищено | настройки, черновики, корзина |
| `Session` | пока живёт вкладка | состояние сценария |
| `Cookie` | как вы задали, уходит на сервер | то, что должен прочитать сервер |
| `IndexedDB` | пока не очищено, большое | записи, файлы, офлайн-данные |

`Local.Namespace('cart')` отделяет ключи одной части приложения от остальных; значения входят и выходят как JSON. Там, где странице нельзя пользоваться хранилищами браузера (фрейм в песочнице, заблокированный сайт, тест без DOM), `Local`, `Session` и `Cookie` хранят значения в памяти страницы, а не бросают исключение: приложение работает и забывает всё при перезагрузке.

IndexedDB следует той же модели, что и сеть: операция создаётся, слушается и выполняется (`Store('Notes').Put(...).On('Success', ...).Execute()`), а транзакция пишет несколько записей или ни одной (см. [Работу офлайн](/tutorials/offline)).
