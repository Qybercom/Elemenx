<!-- generated -->
# Icons

Наборы иконок страницы. Спрайт библиотеки (index.svg) — набор без имени: <Icon Name="save" />. Другой набор указывается перед именем иконки: <Icon Name="weather:rain" />. Наборы библиотеки 'brands', 'files', 'music', 'weather', 'sport', 'racing', 'science', 'art', 'cinema' и 'games' уже известны; Register(name, source) добавляет набор из файла спрайта (URL относительно страницы) или из разметки спрайта ('<svg>...</svg>'). Набор — спрайт из элементов <symbol id>; символ сохраняет свои атрибуты fill и stroke, так что залитый или цветной набор рисуется таким, каким сделан. Набор загружается один раз, когда иконка впервые его запросит (или через Load). Его символы копируются в скрытый <svg id="elemenx-icons"> страницы: elemenx-icon-<имя> для спрайта библиотеки, elemenx-icon-<набор>-<имя> для набора. Каждый Icon сам рисует фигуры своего символа (*glyph), поэтому набору нужен тот же источник или CORS. Override('save', 'brand:disk') заставляет каждую иконку save рисовать другой символ; Override('save') восстанавливает её. Load(set, callback) вызывает callback (error, names). Ready(set) сообщает, есть ли набор на странице ('' — спрайт библиотеки). Names(set) перечисляет имена загруженного набора. Href(name) — ссылка, которую рисует Icon. OnChange(callback) сообщает {Set}, когда набор загрузился, и {Override: name}, когда меняется замена. Состояние хранится на скрытом <svg>, так что наборы общие для всех приложений страницы.

## Методы

- `Register(name, source)`
- `Href(name)`
- `Ready(name)`
- `Names(name)`
- `Load(name, callback)`
- `Override(name, target)`
- `OnChange(callback)`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Icon Name="save" Size="24" />
	<Icon Name="files:pdf" Size="24" />
	<Icon Name="brands:github" Size="24" Colored="true" />
	<Icon Name="weather:storm" Size="24" Colored="true" />
	<Icon Name="docs:dot" Size="24" />
	<Icon Name="bell" Size="24" />
</div>
<Button [label]="Overridden ? 'Restore the bell' : 'Draw every bell as a star'" (click)="Toggle" />
<script>
({
	Overridden: false,

	$OnCreate: function () {
		this.$Service('Icons').Register('docs', '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="dot" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#e5484d" /></symbol></svg>');
	},

	Toggle: function () {
		this.Overridden = !this.Overridden;

		if (this.Overridden) this.$Service('Icons').Override('bell', 'star');
		else this.$Service('Icons').Override('bell');
	},

	$OnDestroy: function () {
		this.$Service('Icons').Override('bell');
	}
})
</script>
```

## Тесты

- [icon sets load on demand, paint with the theme colors, come from markup and override library icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L255) — `tests/examples/ui-kit.spec.js`
- [the six themed icon sets load as packs and draw every icon of theirs](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3637) — `tests/examples/ui-kit.spec.js`
- [money input formats the amount of its currency and file icons follow the format](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5513) — `tests/examples/ui-kit.spec.js`
