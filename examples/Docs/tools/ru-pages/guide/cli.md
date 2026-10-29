# CLI

Пакет `@qybercom/elemenx` даёт команду `elemenx` (`npx elemenx` в проекте или скрипт `elemenx-cli.js`). Она создаёт проекты и их части, обслуживает их при разработке, обслуживает их сборки так, как это сделал бы производственный сервер, собирает их и делает наборы иконок.

@block 1

`elemenx help <command>` или `elemenx <command> --help` показывает использование и параметры одной команды; `g` — сокращение `generate`.

## generate

@block 2

- `generate application Shop` создаёт папку исходников `Shop/` с `index.js` и корневым компонентом `App`, а также `app.js`, `index.html`, `elemenx.config.js` и `package.json` (со скриптами `dev`, `build`, `serve`), если их в проекте нет. Второе приложение рядом (`generate application Admin`) сохраняет существующие файлы. `--native` готовит его к нативным программам (см. [Сборки](/guide/build)).
- Сущность попадает под корень исходников своего приложения (`Application` из `elemenx.config.js` или `--application`): компонент получает `<Name>/<Name>.js` и `<Name>/<Name>.html`, остальные — `<Name>.js`. Путь выбираете вы (`pages/HomePage`, `./auth/Session`); генератор поднимается от него к ближайшему `index.js` и добавляет сущность туда, относительно него, или в `index.js` корня. Путь, выходящий за корень, отклоняется.
- Без `--force` ничего не перезаписывается, а сущность, уже входящая в граф, не добавляется дважды.

## dev

`elemenx dev` обслуживает проект как есть, с фреймворком и ElemenxUI из пакета: страница загружает файлы графа по одному, а перезагрузка показывает каждое изменение (каждый файл идёт с `Cache-Control: no-cache`: браузер перепроверяет его по ETag). На каждый путь, который не является файлом, он отвечает `index.html`, поэтому маршруты маршрутизатора работают после перезагрузки. `--host 0.0.0.0` открывает его другим устройствам сети.

## serve

`elemenx serve` обслуживает сборку в `dist` так, как это сделал бы производственный сервер: gzip и brotli для ответов от 1024 байт, `ETag`, `Last-Modified`, `Cache-Control`, `Vary: Accept-Encoding`, `304` на условные запросы, `HEAD` с заголовками без тела. Разработка и производство могут работать одновременно на двух портах.

## docs

`elemenx docs` показывает эту справку той версии Elemenx, что установлена в проекте, прямо из пакета: сеть не нужна, а живые примеры работают (и сетевые тоже — с сервером команды). `--open` открывает его в браузере системы; порт — 4179 (`--port`).

## Конфигурация

`elemenx.config.js` в корне проекта задаёт значения по умолчанию; параметр командной строки сильнее него, а он сильнее значений Elemenx.

@block 3

| Ключ | Значение |
| --- | --- |
| `Application`, `Applications` | корень исходников или список приложений проекта, где их несколько |
| `Entry`, `Index`, `Output` | скрипт приложений, страница, папка сборки |
| `Server` | порты и сжатие; `Templates: false` отдаёт страницы как есть (по умолчанию `<template id>` страницы уходит как `<script type="text/html" id>`, см. [Шаблоны](/guide/templates)); `Request(request, response, pathname)` отвечает на собственные пути (API проекта во время разработки: верните `true`, если ответили); `WebSocket: {Path, Message(connection, message)}` отвечает сокету (`connection.Send(text)`, `connection.Close()`) |
| `Single`, `Widget`, `Full`, `Precompile`, `Packs` | значения по умолчанию параметров `build` |
| `Extension` | `Surface`, `Name`, `Description`, `Version`, `ID`, `Icons`, `Manifest` расширения браузера |
| `Native` | `Desktop` и `Mobile`: настройки нативных программ |

Сервер этой справки использует `Request` и `WebSocket` для живых примеров раздела «Сеть».

## icons

@block 4

Каждый SVG-файл папки становится `<symbol>` спрайта с именем по файлу (`Arrow Left.svg` становится `arrow-left`), со своим `viewBox` и `fill` и `stroke` корня; идентификаторы внутри иконки получают её имя впереди, чтобы иконки не конфликтовали. `--current-color` делает каждый цвет, кроме `none`, цветом текста. Сервис `Icons` в ElemenxUI показывает спрайт как набор: `Icons.Register('lucide', 'icons/lucide.svg')`, затем `<Icon Name="lucide:arrow-left" />`.

## native и version

`elemenx native add desktop` устанавливает в проект Electron и его упаковщик, `native add mobile` — Capacitor и его плагины, `native add` — и то, и другое (см. [Сборки](/guide/build)). `elemenx version` печатает версию.
