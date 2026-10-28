<!-- generated -->
# Панель живой телеметрии

Панель живой телеметрии: гоночная машина, кластер серверов или космический корабль — каждая сцена из 36–60 каналов, значения которых приходят по WebSocket от 1 до 120 раз в секунду. Панель рисует их стрелочными шкалами, полосами, числами, спарклайнами, индикаторами сигнала и лампами, ведёт журнал тревог и показывает собственные кадры, пакеты и обновления в секунду. Готовый проект — `examples/Tutorials/Telemetry`.

Чему вы научитесь: WebSocket сервера CLI, протоколу JSON и правилам панели, которая успевает за быстрым потоком: пакеты не попадают в состояние, состояние меняется раз в кадр, у буферов фиксированная длина.

## 1. Поток сервера

`Server.WebSocket` из `elemenx.config.js` — это поток для `elemenx dev` и `elemenx serve`. Соединение получает каналы своей сцены, а затем их значения со своей частотой. Пакеты идут по часам, а не по интервалу таймера: системный таймер может тикать раз в 15 миллисекунд или около того, и 20 пакетов в секунду превратились бы в 16.

```js
function start (connection) {
	var began = Date.now();
	var sent = 0;

	clearInterval(connection.Timer);

	connection.Timer = setInterval(function () {
		var due = Math.floor((Date.now() - began) * connection.Hz / 1000);

		while (sent < due) {
			packet(connection);

			sent++;
		}
	}, 5);
}
```

Браузер просит другую сцену (`{Type: 'scene', Scene}`) и другую частоту (`{Type: 'rate', Hz}`).

## 2. Пакеты не попадают в состояние

Пакеты принимает сервис `Feed`. Сервис — не реактивное состояние: пакет кладётся в обычное поле и стоит одно присваивание, а не отрисовку, сколько бы их ни пришло.

```js
this.Socket.On('Protocol.data', function (event) {
	self.Latest = event.Data;
	self.Seq = event.Data.Seq;
	self.Received++;
});
```

## 3. Состояние меняется раз в кадр

Панель читает последний пакет в цикле `requestAnimationFrame`. Много пакетов между двумя кадрами стоят одной отрисовки, и все привязки панели читают одни и те же `Values`:

```js
function frame (now) {
	own.Frames++;

	if (!self.Paused && feed.Latest && feed.Seq !== own.Seq)
		self.Draw(feed.Latest);

	own.Frame = window.requestAnimationFrame(frame);
}
```

`Draw` сначала собирает новые значения вне состояния, а потом отдаёт их ему одним присваиванием на каждое поле. Истории спарклайнов — буферы на 90 значений, а журнал хранит последние 30 строк:

```js
history.push(value);

if (history.length > 90)
	history.shift();

series[item.ID] = history.slice();
```

```js
this.Values = packet.Values;
this.Series = series;
this.Lit = lit;
```

Ещё одно правило держит в ритме занятый компьютер: кадр с обновлением длится столько, сколько его скрипт и следующие за ним раскладка и отрисовка, и всё, что он занял сверх кадра, ждёт следующее обновление. Панель занимает не больше половины времени страницы; на медленном процессоре она пропускает кадры и остаётся близко к потоку, вместо того чтобы заполнить каждый кадр и оставить пакеты копиться в очереди.

## 4. Виджет для каждого вида

Шаблон рисует каждый канал по его виду:

```html
<Meter *if="item.Kind === 'dial'" Shape="dial" Needle="true" [value]="Math.round(Values[item.ID] || item.Min)" [min]="item.Min" [max]="item.Max" [high]="item.Alarm" [label]="item.Label" [unit]="item.Unit" ShowValue="true" Size="small" />
<Meter *if="item.Kind === 'bar'" [value]="Values[item.ID] || item.Min" [min]="item.Min" [max]="item.Max" [high]="item.Alarm" [label]="item.Label" [unit]="item.Unit" ShowValue="true" Size="small" />
<Sparkline *if="item.Kind === 'spark'" [values]="Series[item.ID] || []" Type="area" Width="160" Height="36" [min]="item.Min" [max]="item.Max" Dot="true" />
<Signal *if="item.Kind === 'signal'" [value]="Values[item.ID] || 0" Bars="4" />
```

Сцена даёт панели собственную тему, что бы ни показывала страница: `this.$Service('Theme').Scope(this.$Element(), 'scifi')`.

## 5. Сколько это стоит

В шапке видно, сколько кадров в секунду рисует страница (FPS), сколько пакетов она получает и сколько обновлений показывает. При 20 пакетах в секунду показывается каждый пакет, и страница держит кадры; при 120 обновления идут за кадрами (около 60), а пакеты между ними сливаются. Шкалы, полосы и линии сцены обновляются за несколько миллисекунд на настольном компьютере, а бюджет кадра — 16.

## 6. Попробуйте

```bash
node elemenx-cli.js dev examples/Tutorials/Telemetry
```

Сдвиньте частоту на 120, переключитесь на кластер (60 каналов) и следите за FPS; поставьте панель на паузу — пакеты продолжают приходить и считаться.
