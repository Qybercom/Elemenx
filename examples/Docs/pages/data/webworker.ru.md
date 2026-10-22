<!-- generated -->
# Web Worker

`Elemenx.WebWorker` запускает скрипт в воркере, вне потока страницы, с загруженным там Elemenx и подключённым [обменом сообщениями](/data/messaging): страница и воркер говорят по каналу, как любые два сокета. Долгие вычисления, разбор больших файлов и сжатие перестают замораживать страницу.

```js
var worker = this.$WebWorker('Resizer', {Script: '/workers/resizer.js', StartMode: 'lazy', Channel: 'images:resize'});

this.$Messaging().Send('images:resize', {Image: blob, Width: 320});
```

Скрипт воркера:

```js
/* /workers/resizer.js: Elemenx is already loaded; ElemenxWorkerName and ElemenxWorkerChannel are set. */
var socket = Elemenx.Messaging();

socket.On(ElemenxWorkerChannel, function (message) {
	var result = resize(message.Data.Image, message.Data.Width);

	socket.Send(message.Source, {Image: result});
});
```

## Определение

| Ключ | Значение |
| --- | --- |
| `Script` | URL скрипта (обязателен) |
| `StartMode` | `'auto'` (по умолчанию: стартует при создании описателя), `'manual'` (стартует по `Start()`) или `'lazy'` (стартует при первом сообщении в его канал) |
| `Channel` | канал воркера, по умолчанию его имя (в воркере — `ElemenxWorkerChannel`) |
| `Framework` | URL `elemenx.js` для воркера; по умолчанию скрипт, который загрузила страница (фреймворк, встроенный в однофайловую сборку, даёт воркеру копию своего текста) |

`Elemenx.WebWorker(name, definition)` регистрирует воркер и возвращает описатель; `Elemenx.WebWorker(name)` создаёт ещё один описатель зарегистрированного. `this.$WebWorker(name, definition)` создаёт описатель, принадлежащий компоненту или сервису и останавливаемый вместе с ним; `$WebWorker(name, definition)` приложения создаёт описатель, общий для его компонентов: `this.$WebWorker(name)` в компоненте возвращает описатель приложения, если он есть.

## Описатель

| Метод | Значение |
| --- | --- |
| `Start()` | запускает воркер (только со страницы) |
| `Stop()` | завершает его; ленивый воркер, остановленный вручную, сам больше не стартует |
| `Destroy()` | завершает его окончательно |
| `State()` | `'Stopped'`, `'Starting'`, `'Running'` или `'Error'` |
| `Name()`, `Channel()`, `StartMode()`, `Native()` | нативный `Worker` |
| `On(event, callback)`, `Off(event, callback)` | `Starting`, `Running` (воркер загрузил свой скрипт), `Stop`, `Error`; обработчик получает `{Type, Worker, State, Data}` |

Сообщение, отправленное до запуска воркера, ждёт: мост держит его, пока воркер не появится. Воркер не может стартовать со страницы, открытой как файл, а сборка-виджет не запускает воркеров.

## Пример

Воркер справки суммирует числа до предела и отвечает суммой и временем; страница при этом остаётся отзывчивой:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Sum to 100 million in the worker" Variant="primary" (click)="Count" />
	<Button Label="Stop the worker" Variant="ghost" (click)="Stop" />
</div>
<Properties>
	<Property Label="State" [value]="State" />
	<Property Label="Answer" [value]="Answer" />
</Properties>
<Spinner *if="Busy" Label="The page still runs this spinner" ShowLabel="true" />
<script>
({
	State: 'Stopped',
	Answer: '—',
	Busy: false,

	$OnCreate: function () {
		var self = this;

		this.Worker = this.$WebWorker('DocsCounter', {Script: '/workers/counter.js', StartMode: 'lazy', Channel: 'docs:counter'});
		this.Socket = this.$Messaging();

		['Starting', 'Running', 'Stop', 'Error'].forEach(function (name) {
			self.Worker.On(name, function (event) {
				self.State = event.State;
			});
		});

		this.Socket.On(function (message) {
			self.Busy = false;
			self.Answer = message.Data.Sum + ' in ' + message.Data.Elapsed + ' ms';
		});
	},

	Count: function () {
		this.Busy = true;
		this.Answer = 'counting...';

		if (this.Worker.State() === 'Stopped')
			this.Worker.Start();

		this.Socket.Send('docs:counter', {Command: 'count', To: 100000000});
	},

	Stop: function () {
		this.Worker.Stop();
		this.Busy = false;
	}
})
</script>
```
