# Service Worker

`Elemenx.ServiceWorker` регистрирует service worker с загруженным в нём Elemenx, подключает его к [обмену сообщениями](/data/messaging) и сообщает о состояниях регистрации событиями. Service worker живёт дольше страницы: кэширует файлы, чтобы страница работала без сети, принимает push-сообщения, отвечает на запросы страниц своей области.

@block 1

Браузер регистрирует воркером сам фреймворк (`elemenx.js?elemenx_service_worker=1&...`); тот загружает скрипт приложения и задаёт `ElemenxWorkerName` и `ElemenxWorkerChannel`, как в [web worker](/data/webworker):

@block 2

## Определение

| Ключ | Значение |
| --- | --- |
| `Script` | скрипт воркера (обязателен) |
| `Scope` | страницы, которыми он управляет, по умолчанию `'./'` |
| `Channel` | его канал, по умолчанию его имя |
| `Framework` | URL `elemenx.js`, по умолчанию скрипт, загруженный страницей |

`Elemenx.ServiceWorker(name, definition)` сразу регистрирует его и возвращает описатель; `this.$ServiceWorker(name, definition)` создаёт описатель, принадлежащий владельцу. Service worker требует HTTPS или `localhost`.

## Описатель

| Метод | Значение |
| --- | --- |
| `Register()` | регистрирует снова после `Unregister` или ошибки |
| `Update()` | просит браузер проверить, нет ли новой версии скрипта |
| `Unregister()` | снимает регистрацию |
| `State()` | `'Unregistered'`, `'Registering'`, `'Installing'`, `'Waiting'`, `'Active'`, `'Unregistering'` или `'Error'` |
| `Registered(callback)` | вызывает обратно `true` или `false`: есть ли у браузера регистрация для его области |
| `Controlled()` | управляет ли этой страницей service worker |
| `Reachable()` | подключён ли активный воркер к обмену сообщениями |
| `Registration()` | `ServiceWorkerRegistration` |
| `Name()`, `Channel()`, `Scope()`, `Destroy()` | |
| `On(state, callback)`, `Off(state, callback)` | событие на каждое состояние по мере наступления: `Registering`, `Installing`, `Waiting`, `Active`, `Unregistering`, `Unregistered`, `Error`; обработчик получает `{Type, Worker, State, Data}` |

## Пример

Service worker справки отвечает в своём канале. Его область, `/sw-demo/`, не включает эту страницу, поэтому здесь он ничем не управляет:

@block 3
