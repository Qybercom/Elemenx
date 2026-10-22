<!-- generated -->
# Темы

Внешний вид ElemenxUI — его токены: CSS-переменные `--elemenx-*` для цветов, шрифтов, скруглений, размеров и движения, и переменные каждого компонента. Тема задаёт их, а где токенов не хватает — переопределяет компонент по его классам. Тема — один обычный CSS-файл: без сборки, без каскадных слоёв, в любом браузере, где работает ElemenxUI.

## Схема и тема

`body` несёт два атрибута, которые ставит сервис `Theme`:

- `data-theme`: политика схемы при теме по умолчанию (`system`, `light`, `dark`; `index.css` применяет её до запуска скриптов) или имя именованной темы (`contrast`, `ocean`...);
- `data-scheme`: показанная схема, `light` или `dark`, какой бы ни была тема.

```js
var theme = this.$Service('Theme');

theme.Policy('dark');        /* or 'light', or 'system' to follow the operating system */
theme.Use('soft');           /* a named theme; Use('default') goes back */
theme.Resolved();            /* 'dark': the scheme shown */
```

Политика и тема сохраняются в `localStorage` и возвращаются при следующем визите. Чтобы не мелькала тема по умолчанию, страница может назвать свою тему в разметке: `<body data-theme="soft" data-scheme="dark">`.

| Метод | Значение |
| --- | --- |
| `Policy(value)`, `Policy()` | задаёт или возвращает политику: `system`, `light`, `dark` |
| `Next()` | следующая политика (так делает `ThemeSwitch`) |
| `Resolved()` | показанная схема |
| `Register(name, {URL, Label, Schemes})` | добавляет тему: её таблица стилей загружается при первом использовании; `Schemes: ['dark']` — для темы одной схемы |
| `Use(name, callback)` | показывает тему, загрузив её таблицу стилей; `callback(error)` |
| `Theme()`, `Themes()` | показанная тема, все темы `[{Name, Label, Schemes}]` |
| `Scope(element, name, callback)` | одна часть страницы в своей теме или политике; `null` возвращает её странице |
| `Channels(color)` | каналы цвета (`'75, 68, 61'`) для токенов `-rgb` |
| `OnChange(callback)`, `OffChange(callback)` | `{Policy, Theme, Name}` после каждого изменения, включая смену системной схемы при `system` |

ElemenxUI приносит `contrast` (высокий контраст, светлая и тёмная), `darcula` (тёмная тема IDE JetBrains), `soft` (скруглённые углы, просторные элементы управления, фиолетовый акцент) и две темы для игр — `fantasy` и `scifi`.

## Файл темы

Каждое правило темы начинается с её атрибута, записанного дважды, чтобы работать на любом элементе. Токены обеих схем — под `[data-theme][data-theme='ocean']`, цвета каждой схемы — под `...[data-scheme='light']` и `...[data-scheme='dark']`:

```css
[data-theme][data-theme='ocean'] {
	--elemenx-radius: 6px;
	--elemenx-control: 36px;
}

[data-theme][data-theme='ocean'][data-scheme='light'] {
	--elemenx-accent: #0b6e99;
	--elemenx-accent-rgb: 11, 110, 153;
	--elemenx-background: #f1f6f8;
}

[data-theme][data-theme='ocean'][data-scheme='dark'] {
	--elemenx-accent: #6cc4e8;
	--elemenx-accent-rgb: 108, 196, 232;
	--elemenx-background: #0d1a20;
}

[data-theme][data-theme='ocean'] .elemenx-button.primary {
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
```

Префикс делает тему действующей, только пока она включена (её файл может оставаться на странице), и делает её правила специфичнее правил компонентов, которые они переопределяют, поэтому порядок таблиц стилей не важен. Не заданный токен сохраняет значение по умолчанию. `libraries/ElemenxUI/themes/template.css` перечисляет каждый токен со значением: скопируйте его, переименуйте, оставьте то, что меняете. Классы компонентов публичны: полный список — `docs/THEMING-CLASSES.md` репозитория.

```js
theme.Register('ocean', {URL: 'themes/ocean.css', Label: 'Ocean'});
theme.Use('ocean', function (error) {});
```

## Токены

| Группа | Токены |
| --- | --- |
| Шрифт | `--elemenx-font`, `--elemenx-font-mono`, `--elemenx-font-math`, `--elemenx-font-size-small` / `-size` / `-size-large` (12, 14, 16px), `--elemenx-font-size-field` (16px на сенсорном экране), `--elemenx-line-height-small` / `-height` / `-height-large`, `--elemenx-font-weight-strong`, `--elemenx-font-weight-bold` |
| Геометрия | `--elemenx-control-small` / `--elemenx-control` / `-large` / `-giant` (24, 32, 40, 56px; больше на сенсорном экране), `--elemenx-grid-min`, `--elemenx-radius-small` / `--elemenx-radius` / `-large` / `-huge` / `-giant` / `-pill` |
| Движение | `--elemenx-duration`, `--elemenx-duration-slow`, `--elemenx-easing` |
| Цвета схемы | `--elemenx-background`, `--elemenx-surface`, `--elemenx-surface-raised`, `--elemenx-surface-hover`, `--elemenx-text`, `--elemenx-text-muted`, `--elemenx-accent`, `--elemenx-accent-hover`, `--elemenx-accent-text`, `--elemenx-danger`, `--elemenx-success`, `--elemenx-warning`, `--elemenx-info`, `--elemenx-border`, `--elemenx-border-strong`, `--elemenx-shadow`, `--elemenx-focus` и их каналы `-rgb` |
| Обе схемы | `--elemenx-shadow-small`, `--elemenx-shadow-subtle`, `--elemenx-backdrop`, `--elemenx-overlay`, полосы прокрутки, значки и аватары, кнопки геймпада |
| Компоненты | `--elemenx-block-*`, `--elemenx-property-*`, `--elemenx-rating-color`, `--elemenx-tile-color`, `--elemenx-weather-*`, `--elemenx-syntax-*` (подсветка кода), `--elemenx-achievement-*` и токены `--elemenx-game-*` игровых компонентов |

У компонента есть собственные переменные, задаваемые его вариантами (`--elemenx-progress-color`, `--elemenx-drawer-size`...): тема меняет их на его классе.

## Часть страницы

Любой элемент с `data-theme` и `data-scheme` даёт себе и всему внутри собственную тему; `Theme.Scope(element, name)` делает это из кода, сначала загружая таблицу стилей именованной темы:

```html
<section data-theme="darcula" data-scheme="dark">...</section>
<aside data-scheme="dark">...</aside>
```

## Пример

Блок ниже получает собственную тему; остальная страница сохраняет вашу. `ocean` — тема, которую пример делает из CSS выше и регистрирует через `Elemenx.Style`:

```example
<RadioGroup Variant="segmented" [options]="Themes" [value]="Name" (change)="Pick" />
<div class="docs-themed elemenx-panel">
	<div class="elemenx-container wrappable" style="gap: 8px;">
		<Button Label="Primary" Variant="primary" />
		<Button Label="Secondary" />
		<Toggle Label="Toggle" Checked="true" />
		<Rating Value="3" />
	</div>
	<Input Placeholder="A field" />
	<Progress Value="60" />
</div>
<script>
({
	Name: 'page',
	Themes: [
		{Value: 'page', Label: 'Page'},
		{Value: 'light', Label: 'Light'},
		{Value: 'dark', Label: 'Dark'},
		{Value: 'darcula', Label: 'Darcula'},
		{Value: 'soft', Label: 'Soft'},
		{Value: 'contrast', Label: 'Contrast'},
		{Value: 'ocean', Label: 'Ocean'}
	],

	$OnCreate: function () {
		Elemenx.Style('docs-ocean', "[data-theme][data-theme='ocean'] { --elemenx-radius: 6px; } [data-theme][data-theme='ocean'][data-scheme='light'] { --elemenx-accent: #0b6e99; --elemenx-accent-rgb: 11, 110, 153; --elemenx-background: #f1f6f8; --elemenx-surface: #ffffff; } [data-theme][data-theme='ocean'][data-scheme='dark'] { --elemenx-accent: #6cc4e8; --elemenx-accent-rgb: 108, 196, 232; --elemenx-background: #0d1a20; --elemenx-surface: #132630; } [data-theme][data-theme='ocean'] .elemenx-button.primary { text-transform: uppercase; letter-spacing: 0.04em; }");

		this.$Service('Theme').Register('ocean', {Label: 'Ocean'});
	},

	Pick: function (name) {
		this.Name = name;

		this.$Service('Theme').Scope(this.$Element().querySelector('.docs-themed'), name === 'page' ? null : name);
	}
})
</script>
```
