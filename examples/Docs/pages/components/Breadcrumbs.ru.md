<!-- generated -->
# Breadcrumbs

Путь к текущей странице: Items [{ID, Label, Icon, File, Href, Disabled, Class}], последний элемент — текущая страница (aria-current="page", не нажимается без CurrentClickable). Icon называет иконку, File — FileIcon (по имени файла). Нажатие на элемент отправляет select с {Item, Index}; элемент с Href — ссылка (маршрутизатор переходит по ней, как по любой ссылке страницы) и тоже отправляет select. Separator: chevron (по умолчанию), slash, arrow, dot или свой текст. Max (0 — все) оставляет первый элемент и последние Max - 1: остальные прячутся за «…», которое показывает их в меню. Слоты start и end стоят до и после пути (кнопка, статус); Size: small, medium или large.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Separator` | `'chevron'` |
| `Max` | `0` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `CurrentClickable` | `false` |

## События

- `select`: Нажат пункт или выбран в меню скрытых: {Item, Index}.

## Слоты

`start`, `end`

## Пример

```example
<Breadcrumbs [items]="Path" (select)="Picked" />
<Breadcrumbs [items]="Long" Max="4" Separator="slash" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Press a part of the path.',
	Path: [
		{ID: 'home', Label: 'Home', Icon: 'home'},
		{ID: 'docs', Label: 'Docs'},
		{ID: 'components', Label: 'Components'},
		{ID: 'page', Label: 'Breadcrumbs'}
	],
	Long: [
		{ID: 'root', Label: 'Disk C', Icon: 'database'},
		{ID: 'users', Label: 'Users'},
		{ID: 'ada', Label: 'ada'},
		{ID: 'projects', Label: 'Projects'},
		{ID: 'elemenx', Label: 'elemenx'},
		{ID: 'readme', Label: 'README.md', File: true}
	],

	Picked: function (event) {
		this.Note = 'Go to ' + event.Item.Label + ' (part ' + (event.Index + 1) + ')';
	}
})
</script>
```

## Тесты

- [builds with the classes of the layouts, the props of any component, its expressions and its named slots](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L407) — `tests/examples/builder.spec.js`
- [breadcrumbs lead back, fold the middle into a menu; avatars are made of names; presence, badges and pictures](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L2551) — `tests/examples/ui-kit.spec.js`
