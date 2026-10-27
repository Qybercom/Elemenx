<!-- generated -->
# Что делает сборка

В разработке браузер загружает ваши файлы по одному, как есть. Это быстро запустить и легко отлаживать, но медленно для посетителя: десятки запросов и все компоненты всех библиотек. `elemenx build` делает то же приложение маленьким и быстрым, не меняя того, как оно работает.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 290" role="img" aria-label="Что делает сборка">
	<title>Что делает сборка</title>
	<rect class="box soft" x="20" y="20" width="160" height="78" rx="8" />
	<text x="100" y="45.5" text-anchor="middle" class="strong">Ваш проект</text>
	<text x="100" y="63.5" text-anchor="middle" class="muted">app.js, index.html</text>
	<text x="100" y="81.5" text-anchor="middle" class="muted">компоненты, библиотеки</text>
	<rect class="box" x="212" y="20" width="168" height="78" rx="8" />
	<text x="296" y="45.5" text-anchor="middle" class="strong">Чтение графа</text>
	<text x="296" y="63.5" text-anchor="middle" class="muted">теги → компоненты</text>
	<text x="296" y="81.5" text-anchor="middle" class="muted">имена → сервисы</text>
	<rect class="box" x="412" y="20" width="168" height="78" rx="8" />
	<text x="496" y="45.5" text-anchor="middle" class="strong">Обрезка и упаковка</text>
	<text x="496" y="63.5" text-anchor="middle" class="muted">лишнее — за борт</text>
	<text x="496" y="81.5" text-anchor="middle" class="muted">встраивание, сжатие</text>
	<rect class="box accent" x="612" y="20" width="128" height="78" rx="8" />
	<text x="676" y="45.5" text-anchor="middle" class="strong">dist/</text>
	<text x="676" y="63.5" text-anchor="middle" class="muted">index.html</text>
	<text x="676" y="81.5" text-anchor="middle" class="muted">elemenx.js, app.js</text>
	<polyline class="line" points="180,59 212,59" />
	<polygon class="head" points="212,59 203.0,54.5 203.0,63.5" />
	<polyline class="line" points="380,59 412,59" />
	<polygon class="head" points="412,59 403.0,54.5 403.0,63.5" />
	<polyline class="line" points="580,59 612,59" />
	<polygon class="head" points="612,59 603.0,54.5 603.0,63.5" />
	<rect class="box" x="80" y="176" width="260" height="52" rx="8" />
	<text x="210" y="206.5" text-anchor="middle" class="strong">Нужен компонент</text>
	<rect class="box accent" x="420" y="140" width="300" height="52" rx="8" />
	<text x="570" y="161.5" text-anchor="middle" class="strong">В Elemenx.Bundle</text>
	<text x="570" y="179.5" text-anchor="middle" class="muted">уже есть: без запроса</text>
	<rect class="box soft" x="420" y="212" width="300" height="52" rx="8" />
	<text x="570" y="233.5" text-anchor="middle" class="strong">Нет в бандле</text>
	<text x="570" y="251.5" text-anchor="middle" class="muted">Discovery грузит файл</text>
	<polyline class="line" points="340,196 420,166" />
	<polygon class="head" points="420,166 410.0,164.9 413.2,173.4" />
	<polyline class="line" points="340,208 420,238" />
	<polygon class="head" points="420,238 413.2,230.6 410.0,239.1" />
</svg>
```

## 1. Читает граф

Сборщик начинает там же, где браузер: с `index.html` и `app.js`. Он читает приложение (`$Component`, `$Root`, `$Use`, `$Router`), а затем идёт по графу так, как его выполнила бы страница:

- **Теги ведут к компонентам.** Шаблон корня называет `<Header>` и `<ProductList>`; их шаблоны — другие; и так далее. Маршруты называют компоненты страниц.
- **Имена ведут к сервисам, гардам и директивам.** `$Service('Cart')`, `Guards: ['SignedIn']`, `*tooltip` в шаблоне: каждое — определение, которое нужно сохранить, а его код называет ещё.
- **Использование ведёт к частям фреймворка.** `$Router` сохраняет Router; `$Network` — Network; `$Messaging` — Messaging; и так далее.

Имя, составленное во время выполнения (`$Service(name)`), проследить нельзя: назовите его где-нибудь в кавычках или собирайте с `--full`.

## 2. Обрезает и упаковывает

То, до чего граф не дошёл, остаётся за бортом: компоненты библиотеки, которые приложение никогда не показывает, сервисы, которые оно никогда не просит, части фреймворка, которые оно не вызывает (Router, Network, воркеры...), пакеты библиотеки, которые оно не использует (эмодзи, города, наборы иконок), и фразы словарей, которые не называет никакой код. Сборка печатает, что выкинула.

То, что осталось, упаковывается:

- шаблоны (`$TemplateURL`) и стили (`$StyleURL`) встраиваются в свои определения, поэтому для них не запрашиваются файлы;
- код, шаблоны и стили сжимаются;
- `$Meta` убирается, если приложение его не читает (`Elemenx.Meta`, Designer);
- с `--precompile` (всегда для расширений и нативных программ) выражения шаблонов записываются функциями, для страниц, запрещающих `eval`.

## 3. Пишет `dist/`

В `dist/` лежат `index.html`, `elemenx.js` (только нужные приложению части), `app.js` (все определения внутри `Elemenx.Bundle({...})`, за ними ваш `app.js`), нужные приложению файлы библиотек и публичные файлы проекта. Другие сборки несут тот же граф в другие места: один HTML-файл (`--single`), изолированный виджет (`--widget`), расширение браузера (`--extension`), нативные программы (`--native`).

## 4. На странице: сначала бандл, потом Discovery

Когда собранная страница работает, все определения уже лежат в `Elemenx.Bundle`: когда нужен компонент, он берётся оттуда, без запроса. Discovery (загрузка файлов по `index.js`) остаётся запасным путём: приложение, в чьём бандле нет компонента, на странице, где есть его исходники, всё равно его найдёт. Именно поэтому сборка — оптимизация, а не другая программа: один и тот же код работает в разработке и в продакшене, а сборка, выкинувшая лишнее, громко ломается при проверке сборки (`elemenx serve`), где вы тестируете её перед публикацией.

## Чего она не делает

Сборщик не переименовывает файлы хешами, не делит бандл на части и не транспилирует: код написан на ES5 и работает как есть. Кешируйте файлы с перепроверкой (см. [Публикацию в интернете](/tutorials/deploy)).
