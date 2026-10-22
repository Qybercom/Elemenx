<!-- generated -->
# Ленивая отрисовка и кэш

Два инструмента держат большое приложение быстрым: `*lazy` строит части длинной страницы, только когда они приближаются к экрану, а `Elemenx.Cache` усыпляет уходящие со страницы компоненты вместо уничтожения (keep-alive) и выгружает определения, которыми никто не пользуется.

## *lazy

```html
<Section Title="Sales" *lazy="320">
	<Chart [data]="Sales" />
</Section>

<Table *lazy="'#table-skeleton'" [rows]="Orders" />
```

Хост `*lazy` (элемент или компонент) отрисовывается, когда оказывается в пределах экрана от области просмотра или когда браузер простаивает — что наступит раньше, по одному хосту за раз в порядке страницы; отрисованный, он остаётся. Длинная страница сразу показывает первый экран и строит остальное в фоне, а не замораживает вкладку, пока не построит всё.

Тем временем место держит заглушка (`[data-elemenx-lazy]`):

- без значения — высотой в строку;
- число или длина — этой высоты (`*lazy="320"` пикселей, `*lazy="'20rem'"`); ElemenxUI рисует её мерцанием (`data-elemenx-lazy="sized"`);
- `'#id'` — разметка шаблона страницы или реестра (`data-elemenx-lazy="template"`), как скелет содержимого.

То, что хост объявляет, появляется только после его отрисовки: его сочетания клавиш, слушатели и сервисы стартуют тогда. Их список следит за изменениями (`Hotkeys.OnChange` в ElemenxUI), а не читается один раз. Хост, чей компонент уходит до своей очереди, не отрисовывается никогда.

## Кэш

По умолчанию всё выключено: уходящий компонент уничтожается, определение остаётся загруженным. `Elemenx.Cache(policy)` задаёт политику; `Elemenx.Cache()` возвращает её. Не заданный ключ сохраняет значение; возраст — в миллисекундах, `0` — без ограничения.

```js
Elemenx.Cache({
	Definitions: {MaxAge: 600000, Max: 200},
	Instances: {Scope: 'router', MaxAge: 300000, Max: 20}
});
```

### Экземпляры: keep-alive

Экземпляр, покидающий своё место, засыпает вне страницы и просыпается таким, каким был — его DOM, состояние и прокрутка, — когда место снова его показывает. `Scope` говорит, какие:

| Scope | Что засыпает |
| --- | --- |
| `'none'` | ничего (по умолчанию) |
| `'marked'` | хост `*if` с `*keep` и компонент с `$KeepAlive: true` |
| `'router'` | всё выше и каждая страница маршрутизатора: по уровню, компоненту и параметрам маршрута (не по запросу) |
| `'all'` | всё выше и каждый хост `*if` |

`*keep="false"` и `$KeepAlive: false` исключают экземпляр из любой области. Элементы `*for` никогда не засыпают (`*keep` там выбрасывает ошибку). Экземпляр, проспавший `MaxAge`, вышедший за `Max` спящих (первым — дольше всех спящий) или чьё место исчезло, уничтожается.

Засыпая, компонент или директива с `$OnSleep` узнают об этом, как и те, что внутри; `$OnWake` следует при возвращении. Таймеры, глобальные слушатели, медиа, сокеты и стареющие данные ставятся на паузу и возобновляются там. Перед сном поля паролей и платёжных карт (`autocomplete="cc-*"`) внутри очищаются: спящая страница не хранит секретов.

### Определения

Определение, которым ни один экземпляр не пользуется `MaxAge`, или вышедшее за `Max` загруженных (первым — дольше всех простаивающее), выгружает текст шаблона и стиля, таблицу стилей и скомпилированные выражения. Определение из файлов загружает их снова для следующего экземпляра; определение из кода сохраняет свой объект и снова ставит стиль.

### Статистика

`Elemenx.Cache.Stats()` возвращает `{Definitions: [{Name, Instances, Cached, Idle}], Instances: [{Name, Asleep}]}`; `Elemenx.Cache.Clear()` уничтожает все спящие экземпляры и выгружает все неиспользуемые определения, независимо от политики.

Неверная политика выбрасывает ошибку: `Elemenx.Cache expects a policy object`, `Elemenx.Cache does not know <key>`, `Elemenx.Cache expects Instances.Scope to be none, marked, router or all`, `Elemenx.Cache expects <key> to be a number of 0 or more`.

## Пример

Сорок лениво строящихся разделов и счётчики кэша этой справки (её политика — `{Instances: {Scope: 'marked'}}`):

```example
<p class="elemenx-text small muted">Built: {{Built}} of 40 (the ones near the screen first, the others one by one while the browser is idle) · instances asleep in this page: {{Asleep}}</p>
<Button Label="Read the cache" (click)="Read" />
<div class="docs-lazy-list" style="display: flex; flex-direction: column; gap: 6px; height: 240px; overflow-y: auto;">
	<div *for="i = 0; i < 40; i++" *key="i">
		<div class="elemenx-callout neutral" *lazy="56"><LazyCounter [index]="i" (built)="Count" /></div>
	</div>
</div>
<script>
(function () {
	if (!window.ElemenxDocsLazy) {
		window.ElemenxDocsLazy = true;

		Elemenx.Component('LazyCounter', {
			$Template: '<span>Section {{Index + 1}}, built at {{Time}}</span>',
			Index: 0,
			Time: '',

			$OnCreate: function () {
				this.Time = new Date().toLocaleTimeString();
				this.$Emit('built', this.Index);
			}
		});
	}

	return {
		Built: 0,
		Asleep: 0,

		Count: function () {
			this.Built++;
		},

		Read: function () {
			this.Asleep = Elemenx.Cache.Stats().Instances.length;
		}
	};
})()
</script>
```

Прокрутите страницу: счётчик растёт по мере приближения разделов, а остальные строятся, пока браузер простаивает.
