<!-- generated -->
# Countdown

Оставшееся время: до момента (To — дата, текст даты или отметка времени) или на длительность (Duration в секундах, которую отсчитывает Running и сохраняет пауза). Показывает дни, часы, минуты и секунды (Units: auto отбрасывает дни и часы, пока они равны 0; dhms, hms или ms оставляют их), каждую единицу с подписью под ней, или одной строкой с Compact. Один раз отправляет end на нуле. Методы: Start(), Pause(), Reset(). Считает по часам страницы, поэтому вкладка в фоне и сон (Cache) показывают верное время, когда возвращаются.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `To` | `''` |
| `Duration` | `0` |
| `Running` | `true` |
| `Units` | `'auto'` |
| `Compact` | `false` |
| `Size` | `'medium'` |
| `Label` | `''` |

## События

- `end`: Время вышло.

## Методы

- `Reset()`
- `Start()`
- `Pause()`

## Пример

```example
<Countdown [to]="Launch" (end)="Ended" />
<Countdown Duration="90" Compact="true" [running]="Running" />
<Button [label]="Running ? 'Pause' : 'Go on'" Size="small" (click)="Toggled" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Launch: Date.now() + (3 * 24 * 3600 + 5 * 3600 + 12) * 1000,
	Running: true,
	Note: 'Three days to the launch; the second one pauses.',

	Toggled: function () {
		this.Running = !this.Running;
	},

	Ended: function () {
		this.Note = 'Launched';
	}
})
</script>
```

## Тесты

- [Countdown shows the time left in its units, waits while not Running, and emits end once at 0](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L100) — `tests/regression/library-new.test.js`
