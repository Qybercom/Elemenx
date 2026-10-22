<!-- generated -->
# Metrics

`Network.Metrics` считает байты, которые ресурс отправляет (TX) и получает (RX), и их скорости: текущую, а также среднюю, наименьшую и наибольшую за измерение. Он слушает события своего транспорта: прогресс выгрузки и загрузки [XHR](/network/xhr), сообщения [WebSocket](/network/websocket), канала [WebRTC](/network/webrtc), [SSE](/network/sse) или [Stream](/network/stream).

```js
var metrics = this.$Network().Metrics({Transport: socket, Interval: 100, Window: 1000});

metrics.On('Metrics.Update', function (event) {
	self.Upload = Math.round(event.Data.TX.Speed / 1024) + ' KiB/s';
	self.Download = Math.round(event.Data.RX.Speed / 1024) + ' KiB/s';
});
```

## Настройки

| Настройка | Значение |
| --- | --- |
| `Transport` | измеряемый ресурс; `Transport(resource)` меняет его, пока метрики остановлены, `Transport()` возвращает его |
| `Interval` | 50: миллисекунды между двумя событиями `Update` и между двумя замерами скоростей |
| `Window` | 250: за сколько миллисекунд трафика считается текущая скорость |
| `AutoStart` | с `Transport` метрики стартуют сразу, если это не `false` |

## Работа и измерение

Метрики работают (`Start()`, `Stop()`): пока они работают, они считают каждый байт, а `Elapsed` — время с `Start`. Измерение (`Begin()`, `End()`) — часть этого времени, для которой хранятся средняя, наименьшая и наибольшая скорости: `Begin` их обнуляет, а время направления идёт, только пока байты идут в этом направлении, так что пауза между выгрузкой и ответом не занижает среднее. `End` замораживает измерение до следующего `Begin`. `Reset()` обнуляет всё, `Active()` говорит, идёт ли измерение, `Destroy()` останавливает и отпускает транспорт.

## Снимок

`Snapshot()` и данные каждого события:

```js
{
	TX: {Bytes, Speed, SpeedAvg, SpeedMin, SpeedMax, MeasureElapsed, Active},
	RX: {Bytes, Speed, SpeedAvg, SpeedMin, SpeedMax, MeasureElapsed, Active},
	Total,          /* TX.Bytes + RX.Bytes */
	Elapsed,        /* milliseconds since Start */
	MeasureElapsed, /* milliseconds since Begin */
	Active,         /* a measurement runs */
	Running         /* the metrics run */
}
```

Скорости — в байтах в секунду.

## События

`Metrics.Start`, `Metrics.Stop`, `Metrics.Begin`, `Metrics.End`, `Metrics.Reset` и `Metrics.Update` — каждые `Interval`, пока метрики работают, и при каждом изменении счётчиков; данные каждого — снимок.

## Пример

Выгрузка 16 МБ на `/api/echo` через [Transfer](/network/transfer) с измерением:

```example
<Button Label="Upload 16 MB" Variant="primary" [disabled]="Busy" (click)="Upload" />
<Properties Columns="2">
	<Property Label="Sent" [value]="Sent" />
	<Property Label="Current speed" [value]="Speed" />
	<Property Label="Average" [value]="Average" />
	<Property Label="Highest" [value]="Highest" />
</Properties>
<script>
({
	Busy: false,
	Sent: '0 MB',
	Speed: '—',
	Average: '—',
	Highest: '—',

	Megabytes: function (bytes) {
		return (bytes / 1048576).toFixed(1) + ' MB';
	},

	Upload: function () {
		var self = this;
		var request = this.$Network().XHR({Method: 'POST', URL: '/api/echo', ResponseType: 'json'});
		var metrics = this.$Network().Metrics({Transport: request, Interval: 100, Window: 500});
		var transfer = this.$Network().Transfer({Transport: request, Data: new Blob([new Uint8Array(16 * 1048576)])});

		this.Busy = true;

		metrics.Begin();

		metrics.On('Metrics.Update', function (event) {
			self.Sent = self.Megabytes(event.Data.TX.Bytes);
			self.Speed = self.Megabytes(event.Data.TX.Speed) + '/s';
			self.Average = self.Megabytes(event.Data.TX.SpeedAvg) + '/s';
			self.Highest = self.Megabytes(event.Data.TX.SpeedMax) + '/s';
		});

		transfer.On('Transfer.Complete', function () {
			metrics.End();

			self.Busy = false;
		});

		transfer.Send();
	}
})
</script>
```
