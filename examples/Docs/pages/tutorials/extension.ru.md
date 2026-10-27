<!-- generated -->
# Расширение браузера

Список для чтения в кнопке браузера: нажмите её на странице, сохраните страницу в один клик и найдите её позже в любом браузере, куда вы вошли. Один и тот же проект собирается как страница и как расширение для Chrome, Edge и Firefox. Готовый проект — `examples/Tutorials/Extension`.

Чему вы научитесь: `elemenx build --extension` и его поверхности, манифест и запрашиваемые разрешения, API расширения с заменой для разработки, `chrome.storage.sync` и что запрещает политика расширения.

## 1. Один проект, две сборки

```bash
npm run dev            # the page in a tab, as any project: fast to write and to test
npm run extension      # elemenx build --extension: dist/extension/chrome, dist/extension/firefox, and a zip of each
```

Настройки расширения лежат в `elemenx.config.js`:

```js
Extension: {
	Surface: 'popup',
	Name: 'Reading list',
	Description: 'Keeps the pages to read later, on every browser you sign in to.',
	Manifest: {
		permissions: ['activeTab', 'storage']
	}
}
```

- `Surface`: где показывается страница. `popup` — окно кнопки; `tab` — своя вкладка, которую открывает кнопка; `side` — боковая панель Chrome и сайдбар Firefox.
- `Manifest`: ключи, добавляемые к Manifest V3, который пишет сборщик. Просите минимум: `activeTab` даёт страницу вкладки, только когда пользователь нажал кнопку, а `tabs` и `host_permissions` при установке предупредят о «чтении всех ваших данных на всех сайтах».
- Версия берётся из `package.json`; Firefox для публикации нужен `ID`.

## 2. API расширения и замена

В расширении у страницы есть `chrome.storage` и `chrome.tabs`; в `elemenx dev` их нет. Сервис проверяет это один раз и подставляет хранилище страницы и саму страницу, поэтому всё приложение работает и тестируется как страница:

```js
$OnCreate: function () {
	this.Items = [];
	this.Extension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
	this.Local = this.$Storage.Local.Namespace('reading');
},

Current: function (callback) {
	if (this.Extension && chrome.tabs) {
		chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
			callback(tabs[0] ? {Title: tabs[0].title || tabs[0].url, URL: tabs[0].url} : null);
		});

		return;
	}

	callback({Title: document.title, URL: location.href});
}
```

О `chrome` знает только сервис: компонент вызывает `Save`, `Remove` и `Open` и не меняется между двумя сборками. У Firefox то же пространство имён `chrome`, поэтому один код работает в обоих.

## 3. Хранилище, которое следует за пользователем

`chrome.storage.sync` хранит небольшие данные (всего 100 КБ, 8 КБ на элемент) в аккаунте браузера: список виден на каждом компьютере, куда вошёл пользователь. `chrome.storage.local` вмещает больше, но только на этом компьютере. Слушайте его изменения: другое окно расширения или другой компьютер меняет список, пока это окно открыто:

```js
chrome.storage.onChanged.addListener(function (changes, area) {
	if (area === 'sync' && changes.items)
		self.Take(changes.items.newValue || []);
});
```

## 4. Popup — маленькая страница, которая живёт недолго

- Он такой ширины, какую просит страница, до 800 пикселей: страница просит 360 (`.reading { width: 360px; }`).
- Он закрывается, когда теряет фокус, и всё в нём заканчивается: не держите в памяти то, что понадобится потом, сразу пишите в хранилище.
- Ссылка открылась бы в popup: сервис открывает страницу в новой вкладке (`chrome.tabs.create`).

## 5. Политика расширения

Страница расширения не может выполнять код, созданный из текста: ни встроенного `<script>`, ни `eval`, ни `new Function`. Сборщик заранее компилирует выражения шаблонов в функции (`Elemenx.Expressions`), поэтому шаблоны работают; а на встроенном скрипте страницы, который там не выполнился бы, сборка останавливается. Роутер расширения держит маршрут в памяти: его страница — всегда `index.html`.

## 6. Установка и публикация

В Chrome или Edge откройте `chrome://extensions` (`edge://extensions`), включите режим разработчика и загрузите `dist/extension/chrome` как распакованное расширение; в Firefox — `about:debugging`, «Этот Firefox», временное дополнение: `dist/extension/firefox/manifest.json`. Zip-архивы — то, что принимают магазины: Chrome Web Store, Microsoft Edge Add-ons и addons.mozilla.org.

## 7. Тесты

Страница тестируется как любой проект (`tests/examples/tutorials.spec.js` сохраняет, перезагружает и удаляет страницу). Второй тест собирает расширение, загружает его в Edge через `--load-extension`, сохраняет страницу и читает `chrome.storage.sync`: в магазин уходит то, что было проверено.
