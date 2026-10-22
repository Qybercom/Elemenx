# Темы

Внешний вид ElemenxUI — его токены: CSS-переменные `--elemenx-*` для цветов, шрифтов, скруглений, размеров и движения, и переменные каждого компонента. Тема задаёт их, а где токенов не хватает — переопределяет компонент по его классам. Тема — один обычный CSS-файл: без сборки, без каскадных слоёв, в любом браузере, где работает ElemenxUI.

## Схема и тема

`body` несёт два атрибута, которые ставит сервис `Theme`:

- `data-theme`: политика схемы при теме по умолчанию (`system`, `light`, `dark`; `index.css` применяет её до запуска скриптов) или имя именованной темы (`contrast`, `ocean`...);
- `data-scheme`: показанная схема, `light` или `dark`, какой бы ни была тема.

@block 1

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

@block 2

Префикс делает тему действующей, только пока она включена (её файл может оставаться на странице), и делает её правила специфичнее правил компонентов, которые они переопределяют, поэтому порядок таблиц стилей не важен. Не заданный токен сохраняет значение по умолчанию. `libraries/ElemenxUI/themes/template.css` перечисляет каждый токен со значением: скопируйте его, переименуйте, оставьте то, что меняете. Классы компонентов публичны: полный список — `docs/THEMING-CLASSES.md` репозитория.

@block 3

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

@block 4

## Пример

Блок ниже получает собственную тему; остальная страница сохраняет вашу. `ocean` — тема, которую пример делает из CSS выше и регистрирует через `Elemenx.Style`:

@block 5
